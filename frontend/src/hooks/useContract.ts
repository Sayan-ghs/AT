/**
 * useContract.ts – All smart-contract interactions via algosdk ATC.
 *
 * Every write method returns TxResult { success, txId?, error? }.
 * Read methods return typed data or null on failure.
 */
import { useCallback, useState } from 'react'
import algosdk from 'algosdk'
import { APP_ID, getAlgodClient, METHOD_SIGS } from '../utils/algorand'
import { useWallet } from '../context/WalletContext'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface TxResult {
  success: boolean
  txId?:   string
  result?: unknown
  error?:  string
}

export interface GlobalState {
  totalTokens:      bigint
  pricePerToken:    bigint
  tokensSold:       bigint
  rentPool:         bigint
  assetId:          bigint
  rentDepositRound: bigint
}

export interface InvestorState {
  tokensOwned:    bigint
  isVerified:     boolean
  lastClaimRound: bigint
}

// ──────────────────────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────────────────────

const abi   = (sig: string) => algosdk.ABIMethod.fromSignature(sig)
const b64key = (s: string)  => btoa(s)

export function useContract() {
  const { address, signTxns } = useWallet()
  const [loading, setLoading]   = useState(false)
  const algod = getAlgodClient()

  // ── Pera-compatible TransactionSigner for ATC ──────────────────────────────
  const makeSigner = useCallback(
    (): algosdk.TransactionSigner =>
      async (txns: algosdk.Transaction[], _indexes: number[]): Promise<Uint8Array[]> =>
        signTxns([txns]),
    [signTxns],
  )

  const getSP = useCallback(() => algod.getTransactionParams().do(), [algod])

  // ── Internal ATC executor ──────────────────────────────────────────────────
  const execAtc = useCallback(
    async (atc: algosdk.AtomicTransactionComposer): Promise<TxResult> => {
      setLoading(true)
      try {
        const result = await atc.execute(algod, 5)
        return { success: true, txId: result.txIDs[0], result }
      } catch (e) {
        const error = (e as Error).message
        console.error('ATC error:', error)
        return { success: false, error }
      } finally {
        setLoading(false)
      }
    },
    [algod],
  )

  // ══════════════════════════════════════════════════════════════════════════
  // READ – Global State
  // ══════════════════════════════════════════════════════════════════════════

  const fetchGlobalState = useCallback(async (): Promise<GlobalState | null> => {
    if (!APP_ID) return null
    try {
      const appInfo = await algod.getApplicationByID(APP_ID).do()
      const gs = appInfo.params['global-state'] as Array<{
        key: string
        value: { type: number; uint: number }
      }> | undefined
      if (!gs) return null

      const findUint = (key: string): bigint => {
        const e = gs.find((x) => x.key === b64key(key))
        return BigInt(e?.value?.uint ?? 0)
      }

      return {
        totalTokens:      findUint('total_tokens'),
        pricePerToken:    findUint('price_per_token'),
        tokensSold:       findUint('tokens_sold'),
        rentPool:         findUint('rent_pool'),
        assetId:          findUint('asset_id'),
        rentDepositRound: findUint('rent_deposit_round'),
      }
    } catch (e) {
      console.error('fetchGlobalState:', e)
      return null
    }
  }, [algod])

  // ══════════════════════════════════════════════════════════════════════════
  // READ – Investor Local State (eKYC + holding info)
  // ══════════════════════════════════════════════════════════════════════════

  const fetchInvestorState = useCallback(
    async (accountAddress?: string): Promise<InvestorState | null> => {
      const addr = accountAddress ?? address
      if (!addr || !APP_ID) return null
      try {
        const acctInfo = await algod.accountApplicationInformation(addr, APP_ID).do()
        const ls = acctInfo['app-local-state']?.['key-value'] as Array<{
          key:   string
          value: { type: number; uint: number }
        }> | undefined
        if (!ls) return null

        const findUint = (key: string): bigint => {
          const e = ls.find((x) => x.key === b64key(key))
          return BigInt(e?.value?.uint ?? 0)
        }

        return {
          tokensOwned:    findUint('tokens_owned'),
          isVerified:     findUint('is_verified') === 1n,  // eKYC flag
          lastClaimRound: findUint('last_claim_round'),
        }
      } catch {
        return null
      }
    },
    [algod, address],
  )

  // ══════════════════════════════════════════════════════════════════════════
  // READ – ASA balance from account info
  // ══════════════════════════════════════════════════════════════════════════

  const fetchAsaBalance = useCallback(
    async (assetId: number): Promise<bigint> => {
      if (!address || assetId <= 0) return 0n
      try {
        const info = await algod.accountAssetInformation(address, assetId).do()
        return BigInt(info['asset-holding']?.amount ?? 0)
      } catch {
        return 0n
      }
    },
    [algod, address],
  )

  // ══════════════════════════════════════════════════════════════════════════
  // WRITE – Opt-in to contract local state
  // ══════════════════════════════════════════════════════════════════════════

  const optInToContract = useCallback(async (): Promise<TxResult> => {
    if (!address) return { success: false, error: 'Wallet not connected' }
    setLoading(true)
    try {
      const sp  = await getSP()
      const txn = algosdk.makeApplicationOptInTxnFromObject({
        from: address, appIndex: APP_ID, suggestedParams: sp,
      })
      const [signed] = await signTxns([[txn]])
      const { txId } = await algod.sendRawTransaction(signed).do()
      await algosdk.waitForConfirmation(algod, txId, 5)
      return { success: true, txId }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    } finally {
      setLoading(false)
    }
  }, [address, algod, getSP, signTxns])

  // ══════════════════════════════════════════════════════════════════════════
  // WRITE – Opt-in to ASA (self-transfer of 0)
  // ══════════════════════════════════════════════════════════════════════════

  const optInToAsa = useCallback(
    async (assetId: number): Promise<TxResult> => {
      if (!address) return { success: false, error: 'Wallet not connected' }
      setLoading(true)
      try {
        const sp  = await getSP()
        const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          from: address, to: address,
          assetIndex: assetId, amount: 0, suggestedParams: sp,
        })
        const [signed] = await signTxns([[txn]])
        const { txId } = await algod.sendRawTransaction(signed).do()
        await algosdk.waitForConfirmation(algod, txId, 5)
        return { success: true, txId }
      } catch (e) {
        return { success: false, error: (e as Error).message }
      } finally {
        setLoading(false)
      }
    },
    [address, algod, getSP, signTxns],
  )

  // ══════════════════════════════════════════════════════════════════════════
  // WRITE – Buy tokens  [Payment (idx 0) + AppCall (idx 1)]
  // ══════════════════════════════════════════════════════════════════════════

  const buyTokens = useCallback(
    async (quantity: number, assetId: number): Promise<TxResult> => {
      if (!address) return { success: false, error: 'Wallet not connected' }

      const gs = await fetchGlobalState()
      if (!gs) return { success: false, error: 'Cannot read contract state' }

      const paymentAmount = BigInt(quantity) * gs.pricePerToken
      const sp      = await getSP()
      const signer  = makeSigner()
      const atc     = new algosdk.AtomicTransactionComposer()

      // Group index 0 – Payment
      atc.addTransaction({
        txn: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from: address,
          to:   algosdk.getApplicationAddress(APP_ID),
          amount: Number(paymentAmount),
          suggestedParams: sp,
        }),
        signer,
      })

      // Group index 1 – buy_tokens app call
      atc.addMethodCall({
        appID: APP_ID,
        method: abi(METHOD_SIGS.buyTokens),
        signer, sender: address,
        suggestedParams: { ...sp, fee: 2000, flatFee: true },
        appForeignAssets: [assetId],
        methodArgs: [BigInt(quantity)],
      })

      return execAtc(atc)
    },
    [address, execAtc, fetchGlobalState, getSP, makeSigner],
  )

  // ══════════════════════════════════════════════════════════════════════════
  // WRITE – Claim rent
  // ══════════════════════════════════════════════════════════════════════════

  const claimRent = useCallback(async (): Promise<TxResult> => {
    if (!address) return { success: false, error: 'Wallet not connected' }
    const sp     = await getSP()
    const signer = makeSigner()
    const atc    = new algosdk.AtomicTransactionComposer()

    atc.addMethodCall({
      appID: APP_ID,
      method: abi(METHOD_SIGS.claimRent),
      signer, sender: address,
      suggestedParams: { ...sp, fee: 2000, flatFee: true },
      methodArgs: [],
    })

    return execAtc(atc)
  }, [address, execAtc, getSP, makeSigner])

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN – Create property asset
  // ══════════════════════════════════════════════════════════════════════════

  const createPropertyAsset = useCallback(
    async (totalSupply: number, pricePerToken: number, metadataHash: string): Promise<TxResult> => {
      if (!address) return { success: false, error: 'Wallet not connected' }
      const sp     = await getSP()
      const signer = makeSigner()
      const atc    = new algosdk.AtomicTransactionComposer()

      atc.addMethodCall({
        appID: APP_ID,
        method: abi(METHOD_SIGS.createPropertyAsset),
        signer, sender: address,
        suggestedParams: { ...sp, fee: 2000, flatFee: true },
        methodArgs: [
          BigInt(totalSupply),
          BigInt(pricePerToken),
          new TextEncoder().encode(metadataHash),
        ],
      })

      return execAtc(atc)
    },
    [address, execAtc, getSP, makeSigner],
  )

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN – Verify investor (eKYC)
  // ══════════════════════════════════════════════════════════════════════════

  const verifyInvestor = useCallback(
    async (investorAddress: string): Promise<TxResult> => {
      if (!address) return { success: false, error: 'Wallet not connected' }
      const sp     = await getSP()
      const signer = makeSigner()
      const atc    = new algosdk.AtomicTransactionComposer()

      atc.addMethodCall({
        appID: APP_ID,
        method: abi(METHOD_SIGS.verifyInvestor),
        signer, sender: address,
        suggestedParams: sp,
        methodArgs: [investorAddress],
      })

      return execAtc(atc)
    },
    [address, execAtc, getSP, makeSigner],
  )

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN – Deposit rent  [Payment (idx 0) + AppCall (idx 1)]
  // ══════════════════════════════════════════════════════════════════════════

  const depositRent = useCallback(
    async (algoAmount: number): Promise<TxResult> => {
      if (!address) return { success: false, error: 'Wallet not connected' }

      const microAmount = Math.round(algoAmount * 1_000_000)
      const sp     = await getSP()
      const signer = makeSigner()
      const atc    = new algosdk.AtomicTransactionComposer()

      atc.addTransaction({
        txn: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from: address,
          to:   algosdk.getApplicationAddress(APP_ID),
          amount: microAmount,
          suggestedParams: sp,
        }),
        signer,
      })

      atc.addMethodCall({
        appID: APP_ID,
        method: abi(METHOD_SIGS.depositRent),
        signer, sender: address,
        suggestedParams: sp,
        methodArgs: [],
      })

      return execAtc(atc)
    },
    [address, execAtc, getSP, makeSigner],
  )

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN – Freeze / unfreeze account
  // ══════════════════════════════════════════════════════════════════════════

  const freezeAccount = useCallback(
    async (targetAddress: string, assetId: number): Promise<TxResult> => {
      if (!address) return { success: false, error: 'Wallet not connected' }
      const sp     = await getSP()
      const signer = makeSigner()
      const atc    = new algosdk.AtomicTransactionComposer()

      atc.addMethodCall({
        appID: APP_ID,
        method: abi(METHOD_SIGS.freezeAccount),
        signer, sender: address,
        suggestedParams: { ...sp, fee: 2000, flatFee: true },
        appForeignAssets: [assetId],
        methodArgs: [targetAddress],
      })

      return execAtc(atc)
    },
    [address, execAtc, getSP, makeSigner],
  )

  const unfreezeAccount = useCallback(
    async (targetAddress: string, assetId: number): Promise<TxResult> => {
      if (!address) return { success: false, error: 'Wallet not connected' }
      const sp     = await getSP()
      const signer = makeSigner()
      const atc    = new algosdk.AtomicTransactionComposer()

      atc.addMethodCall({
        appID: APP_ID,
        method: abi(METHOD_SIGS.unfreezeAccount),
        signer, sender: address,
        suggestedParams: { ...sp, fee: 2000, flatFee: true },
        appForeignAssets: [assetId],
        methodArgs: [targetAddress],
      })

      return execAtc(atc)
    },
    [address, execAtc, getSP, makeSigner],
  )

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN – Clawback tokens
  // ══════════════════════════════════════════════════════════════════════════

  const clawbackTokens = useCallback(
    async (targetAddress: string, amount: number, assetId: number): Promise<TxResult> => {
      if (!address) return { success: false, error: 'Wallet not connected' }
      const sp     = await getSP()
      const signer = makeSigner()
      const atc    = new algosdk.AtomicTransactionComposer()

      atc.addMethodCall({
        appID: APP_ID,
        method: abi(METHOD_SIGS.clawbackTokens),
        signer, sender: address,
        suggestedParams: { ...sp, fee: 2000, flatFee: true },
        appForeignAssets: [assetId],
        methodArgs: [targetAddress, BigInt(amount)],
      })

      return execAtc(atc)
    },
    [address, execAtc, getSP, makeSigner],
  )

  // ══════════════════════════════════════════════════════════════════════════

  return {
    loading,
    fetchGlobalState,
    fetchInvestorState,
    fetchAsaBalance,
    optInToContract,
    optInToAsa,
    buyTokens,
    claimRent,
    createPropertyAsset,
    verifyInvestor,
    depositRent,
    freezeAccount,
    unfreezeAccount,
    clawbackTokens,
  }
}

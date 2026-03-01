/**
 * algorand.ts – Algorand client helpers + shared constants.
 */
import algosdk from 'algosdk'

export function getAlgodClient(): algosdk.Algodv2 {
  return new algosdk.Algodv2(
    (import.meta.env.VITE_ALGOD_TOKEN as string) ?? '',
    import.meta.env.VITE_ALGOD_SERVER as string,
    import.meta.env.VITE_ALGOD_PORT as string,
  )
}

export function getIndexerClient(): algosdk.Indexer {
  return new algosdk.Indexer(
    (import.meta.env.VITE_INDEXER_TOKEN as string) ?? '',
    import.meta.env.VITE_INDEXER_SERVER as string,
    import.meta.env.VITE_INDEXER_PORT as string,
  )
}

/** App ID from VITE_APP_ID environment variable. */
export const APP_ID = parseInt(import.meta.env.VITE_APP_ID as string, 10) || 0

// ARC-4 method signatures – must match the contract EXACTLY
export const METHOD_SIGS = {
  createPropertyAsset: 'create_property_asset(uint64,uint64,byte[])uint64',
  updatePrice:         'update_price(uint64)void',
  verifyInvestor:      'verify_investor(address)void',
  buyTokens:           'buy_tokens(uint64)void',
  depositRent:         'deposit_rent()void',
  claimRent:           'claim_rent()uint64',
  freezeAccount:       'freeze_account(address)void',
  unfreezeAccount:     'unfreeze_account(address)void',
  clawbackTokens:      'clawback_tokens(address,uint64)void',
  transferAdmin:       'transfer_admin(address)void',
  estimateClaimable:   'estimate_claimable_rent(address)uint64',
} as const

/** microALGO → ALGO (as a number) */
export const microToAlgo = (micro: bigint | number): number =>
  Number(micro) / 1_000_000

/** ALGO → microALGO */
export const algoToMicro = (algo: number): number => Math.round(algo * 1_000_000)

/** ABCD…WXYZ */
export const shortenAddress = (addr: string): string =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''

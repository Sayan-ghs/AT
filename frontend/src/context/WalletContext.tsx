/*
 * WalletContext.tsx – Pera Wallet React context.
 *
 * Exposes: address, connecting, connect(), disconnect(), signTxns()
 * Wrap the app root with <WalletProvider> once.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import algosdk from 'algosdk'
import { PeraWalletConnect } from '@perawallet/connect'

const peraWallet = new PeraWalletConnect({
  projectId: (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string) || undefined,
})

interface WalletContextType {
  address: string | null
  connecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  /** Sign a group of transactions. Accepts an array-of-arrays of Transaction objects. */
  signTxns: (txnGroups: algosdk.Transaction[][]) => Promise<Uint8Array[]>
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
  signTxns: async () => [],
})

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  // Re-connect session on mount (handles page refresh)
  useEffect(() => {
    peraWallet
      .reconnectSession()
      .then((accounts: string[]) => {
        peraWallet.connector?.on('disconnect', () => setAddress(null))
        if (accounts.length) setAddress(accounts[0])
      })
      .catch(() => {})
  }, [])

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      const accounts = await peraWallet.connect()
      peraWallet.connector?.on('disconnect', () => setAddress(null))
      setAddress(accounts[0] ?? null)
    } catch {
      setAddress(null)
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    peraWallet.disconnect()
    setAddress(null)
  }, [])

  /**
   * Bridge between algosdk ATC (Transaction objects) and Pera (encoded bytes).
   * Pera expects: Array<Array<{ txn: Transaction; signers?: string[] }>>
   * Each inner array = one atomic group.
   */
  const signTxns = useCallback(
    async (txnGroups: algosdk.Transaction[][]): Promise<Uint8Array[]> => {
      const peraGroups = txnGroups.map((group) =>
        group.map((txn) => ({ txn })),
      )
      const signed = await peraWallet.signTransaction(peraGroups)
      return signed as Uint8Array[]
    },
    [],
  )

  return (
    <WalletContext.Provider value={{ address, connecting, connect, disconnect, signTxns }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => useContext(WalletContext)

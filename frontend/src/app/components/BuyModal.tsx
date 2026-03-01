import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, ShieldX } from "lucide-react";
import { Button } from "./Button";
import { useWallet } from "../../context/WalletContext";
import { useContract } from "../../hooks/useContract";

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    name: string;
    tokenPrice: number;   // already in ALGO (e.g. 1.0)
    availableTokens: number;
  };
  assetId: number;
  onSuccess?: () => void;
}

export function BuyModal({ isOpen, onClose, property, assetId, onSuccess }: BuyModalProps) {
  const { address, connect } = useWallet();
  const { loading, optInToContract, optInToAsa, buyTokens, fetchInvestorState } = useContract();

  const [quantity, setQuantity] = useState(1);
  const [step,     setStep]     = useState<"idle" | "buying" | "done">("idle");
  const [status,   setStatus]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  const totalAlgo = (quantity * property.tokenPrice).toFixed(2);

  const handleSetup = async (which: "contract" | "asa") => {
    setStatus(null);
    const res = which === "contract"
      ? await optInToContract()
      : await optInToAsa(assetId);
    setStatus(res.success
      ? { type: "success", text: `Opted in. Tx: ${res.txId?.slice(0, 10)}â€¦` }
      : { type: "error",   text: res.error ?? "Failed" });
  };

  const handleBuy = async () => {
    setStatus(null);
    // eKYC gate: check investor state first
    const inv = await fetchInvestorState();
    if (!inv?.isVerified) {
      setStatus({ type: "error", text: "Your address is not eKYC-verified. Ask the admin to verify you before buying." });
      return;
    }
    setStep("buying");
    const res = await buyTokens(quantity, assetId);
    if (res.success) {
      setStatus({ type: "success", text: `Purchased ${quantity} token${quantity > 1 ? "s" : ""}! Tx: ${res.txId?.slice(0, 10)}â€¦` });
      setStep("done");
      onSuccess?.();
    } else {
      setStatus({ type: "error", text: res.error ?? "Purchase failed" });
      setStep("idle");
    }
  };

  const handleClose = () => {
    setStep("idle");
    setStatus(null);
    setQuantity(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] z-50"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold uppercase">Buy Tokens</h2>
                <button onClick={handleClose} className="w-10 h-10 border-3 border-black hover:bg-gray-100 flex items-center justify-center">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!address ? (
                <div className="text-center py-8">
                  <p className="font-bold text-lg mb-6">Connect your wallet to buy tokens</p>
                  <Button variant="wallet" onClick={connect}>Connect Pera Wallet</Button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-1">{property.name}</h3>
                    <p className="text-gray-400 font-bold text-sm">{property.availableTokens.toLocaleString()} tokens available</p>
                  </div>

                  {/* First-time setup */}
                  <div className="bg-gray-50 border-[3px] border-black p-4 mb-6">
                    <p className="text-xs font-bold uppercase mb-3 text-gray-500">First-time setup (run once per wallet)</p>
                    <div className="flex gap-3">
                      <button onClick={() => handleSetup("contract")} disabled={loading}
                        className="flex-1 py-2 border-[3px] border-black font-bold text-xs hover:bg-gray-100 disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : null} 1. Opt-in to Contract
                      </button>
                      <button onClick={() => handleSetup("asa")} disabled={loading || assetId <= 0}
                        className="flex-1 py-2 border-[3px] border-black font-bold text-xs hover:bg-gray-100 disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : null} 2. Opt-in to ASA
                      </button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mb-8">
                    <label className="block text-sm font-bold mb-3 uppercase tracking-wide">Quantity</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 border-3 border-black font-bold text-xl hover:bg-gray-100">-</button>
                      <input type="number" value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(property.availableTokens, parseInt(e.target.value) || 1)))}
                        className="flex-1 px-4 py-3 border-3 border-black font-mono font-bold text-center text-xl"
                        min="1" max={property.availableTokens} />
                      <button onClick={() => setQuantity(Math.min(property.availableTokens, quantity + 1))}
                        className="w-12 h-12 border-3 border-black font-bold text-xl hover:bg-gray-100">+</button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-100 border-3 border-black p-6 mb-6">
                    <div className="flex justify-between mb-4">
                      <span className="font-bold">Token Price:</span>
                      <span className="font-mono font-bold">{property.tokenPrice} ALGO</span>
                    </div>
                    <div className="flex justify-between mb-4">
                      <span className="font-bold">Quantity:</span>
                      <span className="font-mono font-bold">{quantity}</span>
                    </div>
                    <div className="border-t-3 border-black pt-4 flex justify-between">
                      <span className="font-bold text-lg">Total:</span>
                      <span className="font-mono font-bold text-2xl">{totalAlgo} ALGO</span>
                    </div>
                  </div>

                  {/* eKYC note */}
                  <div className="flex items-start gap-2 mb-6 p-3 border-[3px] border-yellow-400 bg-yellow-50">
                    <ShieldX className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-yellow-800">You must be eKYC-verified by the admin before purchasing.</p>
                  </div>

                  {/* Status */}
                  {status && (
                    <div className={`p-4 border-[3px] border-black font-bold text-sm mb-6 ${
                      status.type === "success" ? "bg-[#00FF88]" : "bg-red-100 text-red-800"
                    }`}>
                      {status.text}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button onClick={handleClose}
                      className="flex-1 py-4 bg-white text-black border-3 border-black font-bold uppercase tracking-wide hover:bg-gray-100">
                      Cancel
                    </button>
                    <Button variant="accent" onClick={handleBuy}
                      disabled={loading || step === "done" || assetId <= 0}
                      className="flex-1">
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Signingâ€¦
                        </span>
                      ) : step === "done" ? "Purchased!" : "Confirm Purchase"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

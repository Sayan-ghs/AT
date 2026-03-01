import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { Loader2, ShieldCheck, PlusCircle, DollarSign, Lock, Unlock, RefreshCcw } from "lucide-react";
import { useContract, GlobalState } from "../../hooks/useContract";
import { useWallet } from "../../context/WalletContext";
import { microToAlgo } from "../../utils/algorand";

type Msg = { type: "success" | "error"; text: string } | null;

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 mb-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-[3px] border-black">
        {icon}
        <h2 className="text-2xl font-bold uppercase">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatusMsg({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return (
    <div className={`mt-4 p-4 border-[3px] border-black font-bold text-sm ${msg.type === "success" ? "bg-[#00FF88]" : "bg-red-100 text-red-800"}`}>
      {msg.text}
    </div>
  );
}

export function Admin() {
  const { address } = useWallet();
  const { loading, fetchGlobalState, createPropertyAsset, verifyInvestor, depositRent, freezeAccount, unfreezeAccount, clawbackTokens } = useContract();

  const [gs, setGs]             = useState<GlobalState | null>(null);
  const [fetching, setFetching] = useState(false);

  // Create Property
  const [supply, setSupply]       = useState("1000000");
  const [price, setPrice]         = useState("1000000");
  const [metaHash, setMetaHash]   = useState("");
  const [createMsg, setCreateMsg] = useState<Msg>(null);

  // Verify Investor (eKYC)
  const [verifyAddr, setVerifyAddr] = useState("");
  const [verifyMsg, setVerifyMsg]   = useState<Msg>(null);

  // Deposit Rent
  const [rentAmount, setRentAmount] = useState("");
  const [rentMsg, setRentMsg]       = useState<Msg>(null);

  // Freeze / Unfreeze
  const [freezeAddr, setFreezeAddr] = useState("");
  const [freezeMsg, setFreezeMsg]   = useState<Msg>(null);

  // Clawback
  const [clawAddr, setClawAddr]     = useState("");
  const [clawAmount, setClawAmount] = useState("");
  const [clawMsg, setClawMsg]       = useState<Msg>(null);

  const refreshGs = async () => {
    setFetching(true);
    const g = await fetchGlobalState();
    setGs(g);
    setFetching(false);
  };

  useEffect(() => { refreshGs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const asId = gs ? Number(gs.assetId) : 0;

  const handleCreate = async () => {
    setCreateMsg(null);
    const res = await createPropertyAsset(Number(supply), Number(price), metaHash);
    setCreateMsg(res.success
      ? { type: "success", text: `Asset created! Tx: ${res.txId?.slice(0, 12)}…` }
      : { type: "error", text: res.error ?? "Failed" });
    if (res.success) refreshGs();
  };

  const handleVerify = async () => {
    setVerifyMsg(null);
    const res = await verifyInvestor(verifyAddr.trim());
    setVerifyMsg(res.success
      ? { type: "success", text: `✓ KYC verified: ${verifyAddr.slice(0, 10)}…` }
      : { type: "error", text: res.error ?? "Failed" });
  };

  const handleDeposit = async () => {
    setRentMsg(null);
    const algoAmt = parseFloat(rentAmount);
    if (isNaN(algoAmt) || algoAmt <= 0) { setRentMsg({ type: "error", text: "Invalid ALGO amount" }); return; }
    const res = await depositRent(algoAmt);
    setRentMsg(res.success
      ? { type: "success", text: `Deposited ${rentAmount} ALGO. Tx: ${res.txId?.slice(0, 12)}…` }
      : { type: "error", text: res.error ?? "Failed" });
    if (res.success) refreshGs();
  };

  const handleFreeze = async (freeze: boolean) => {
    setFreezeMsg(null);
    const res = freeze
      ? await freezeAccount(freezeAddr.trim(), asId)
      : await unfreezeAccount(freezeAddr.trim(), asId);
    setFreezeMsg(res.success
      ? { type: "success", text: `${freeze ? "Froze" : "Unfroze"} ${freezeAddr.slice(0, 10)}…` }
      : { type: "error", text: res.error ?? "Failed" });
  };

  const handleClawback = async () => {
    setClawMsg(null);
    const res = await clawbackTokens(clawAddr.trim(), Number(clawAmount), asId);
    setClawMsg(res.success
      ? { type: "success", text: `Clawed back ${clawAmount} tokens. Tx: ${res.txId?.slice(0, 12)}…` }
      : { type: "error", text: res.error ?? "Failed" });
  };

  const inputCls = "w-full border-[3px] border-black p-3 font-mono text-sm focus:outline-none bg-white";
  const btnCls   = "px-6 py-3 border-[3px] border-black font-bold text-sm hover:bg-gray-100 disabled:opacity-50 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2";

  if (!address) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-[1440px] mx-auto px-8 py-32 text-center">
          <ShieldCheck className="w-20 h-20 mx-auto mb-8 text-gray-300" />
          <h1 className="text-5xl font-bold mb-4 uppercase">Admin Access Required</h1>
          <p className="text-xl text-gray-500">Connect your admin wallet to manage the contract.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-6xl font-bold mb-4 uppercase">Admin Panel</h1>
            <p className="text-xl text-gray-600">Manage the RealEstateToken smart contract</p>
          </div>
          <button onClick={refreshGs} disabled={fetching} className={btnCls}>
            {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Refresh State
          </button>
        </div>

        {/* Contract State Summary */}
        {gs && (
          <div className="grid grid-cols-4 gap-6 mb-10">
            {[
              { label: "Asset ID",       value: gs.assetId.toString() },
              { label: "Total Tokens",   value: gs.totalTokens.toString() },
              { label: "Tokens Sold",    value: gs.tokensSold.toString() },
              { label: "Price / Token",  value: `${microToAlgo(gs.pricePerToken).toFixed(2)} ALGO` },
              { label: "Rent Pool",      value: `${microToAlgo(gs.rentPool).toFixed(2)} ALGO` },
              { label: "Deposit Round",  value: gs.rentDepositRound.toString() },
              { label: "Available",      value: (gs.totalTokens - gs.tokensSold).toString() },
              { label: "Sold %",         value: gs.totalTokens > 0n ? `${((Number(gs.tokensSold) / Number(gs.totalTokens)) * 100).toFixed(1)}%` : "—" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">{item.label}</p>
                <p className="text-xl font-mono font-bold break-all">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* 1. Create Property Asset */}
        <Section title="Create Property Asset" icon={<PlusCircle className="w-7 h-7" />}>
          {asId > 0 ? (
            <div className="p-4 border-[3px] border-black bg-[#00FF88] font-bold text-sm">
              ✓ Property asset already created — ASA ID: <span className="font-mono">{asId}</span>. The contract only allows one asset per deployment.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-2">Total Supply</label>
                  <input className={inputCls} value={supply} onChange={(e) => setSupply(e.target.value)} placeholder="1000000" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-2">Price / Token (μALGO)</label>
                  <input className={inputCls} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1000000 = 1 ALGO" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-2">Metadata Hash (optional)</label>
                  <input className={inputCls} value={metaHash} onChange={(e) => setMetaHash(e.target.value)} placeholder="e.g. ipfs:// CID" />
                </div>
              </div>
              <button onClick={handleCreate} disabled={loading} className={btnCls}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                Create Asset
              </button>
              <StatusMsg msg={createMsg} />
            </>
          )}
        </Section>

        {/* 2. Verify Investor – eKYC */}
        <Section title="Verify Investor (eKYC)" icon={<ShieldCheck className="w-7 h-7" />}>
          <p className="text-sm text-gray-500 mb-4">The investor must already be opted into the contract. This sets their <code>is_verified = 1</code> flag on-chain.</p>
          <div className="flex gap-4 mb-4">
            <input className={`${inputCls} flex-1`} value={verifyAddr} onChange={(e) => setVerifyAddr(e.target.value)} placeholder="Investor Algorand address" />
            <button onClick={handleVerify} disabled={loading || !verifyAddr} className={btnCls}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Verify
            </button>
          </div>
          <StatusMsg msg={verifyMsg} />
        </Section>

        {/* 3. Deposit Rent */}
        <Section title="Deposit Rent" icon={<DollarSign className="w-7 h-7" />}>
          <p className="text-sm text-gray-500 mb-4">Send ALGO to the rent pool. Token holders can claim proportional shares immediately after.</p>
          <div className="flex gap-4 mb-4">
            <input className={`${inputCls} flex-1`} value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} placeholder="Amount in ALGO (e.g. 100)" type="number" min="0" />
            <button onClick={handleDeposit} disabled={loading || !rentAmount} className={btnCls}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Deposit
            </button>
          </div>
          <StatusMsg msg={rentMsg} />
        </Section>

        {/* 4. Freeze / Unfreeze */}
        <Section title="Freeze / Unfreeze Account" icon={<Lock className="w-7 h-7" />}>
          <p className="text-sm text-gray-500 mb-4">The contract is the ASA Freeze Authority. Frozen accounts cannot transfer their tokens.</p>
          <div className="flex gap-4 mb-4">
            <input className={`${inputCls} flex-1`} value={freezeAddr} onChange={(e) => setFreezeAddr(e.target.value)} placeholder="Account address" />
            <button onClick={() => handleFreeze(true)} disabled={loading || !freezeAddr || asId <= 0} className={btnCls}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Freeze
            </button>
            <button onClick={() => handleFreeze(false)} disabled={loading || !freezeAddr || asId <= 0} className={`${btnCls} bg-yellow-50 hover:bg-yellow-100`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />} Unfreeze
            </button>
          </div>
          <StatusMsg msg={freezeMsg} />
        </Section>

        {/* 5. Clawback Tokens */}
        <Section title="Clawback Tokens" icon={<RefreshCcw className="w-7 h-7" />}>
          <p className="text-sm text-gray-500 mb-4">The contract is the ASA Clawback Authority. Tokens are returned to the contract and tokens_sold is decremented.</p>
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-2">From Address</label>
              <input className={inputCls} value={clawAddr} onChange={(e) => setClawAddr(e.target.value)} placeholder="Investor address" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Amount (tokens)</label>
              <input className={inputCls} value={clawAmount} onChange={(e) => setClawAmount(e.target.value)} placeholder="e.g. 10" type="number" min="0" />
            </div>
          </div>
          <button onClick={handleClawback} disabled={loading || !clawAddr || !clawAmount || asId <= 0} className={`${btnCls} bg-red-50 hover:bg-red-100`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Clawback
          </button>
          <StatusMsg msg={clawMsg} />
        </Section>
      </div>
    </div>
  );
}

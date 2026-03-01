import { Link, useLocation } from "react-router";
import { Button } from "./Button";
import { Wallet, LogOut, ShieldCheck } from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import { shortenAddress } from "../../utils/algorand";

export function Navbar() {
  const location = useLocation();
  const { address, connecting, connect, disconnect } = useWallet();

  const navLinks = [
    { path: "/marketplace", label: "Marketplace" },
    { path: "/portfolio",   label: "Portfolio" },
  ];

  return (
    <nav className="border-b-4 border-black bg-white sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-8 py-6 flex items-center justify-between">
        <Link to="/" className="text-3xl font-bold tracking-tight">
          ASSETTOKEN
        </Link>

        <div className="flex items-center gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-lg font-bold uppercase tracking-wide transition-all ${
                location.pathname === link.path
                  ? "text-black underline decoration-4 underline-offset-8"
                  : "text-gray-400 hover:text-black"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {address && (
            <Link
              to="/admin"
              className={`text-sm font-bold uppercase tracking-wide transition-all px-3 py-1 border-2 border-black ${
                location.pathname === "/admin"
                  ? "bg-black text-white"
                  : "text-gray-400 hover:text-black"
              }`}
            >
              Admin
            </Link>
          )}
        </div>

        <div>
          {address ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-5 py-3 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <ShieldCheck className="w-5 h-5 text-[#00FF88]" />
                <Wallet className="w-5 h-5" />
                <span className="font-mono font-bold">{shortenAddress(address)}</span>
              </div>
              <button
                onClick={disconnect}
                className="p-3 border-4 border-black hover:bg-red-50 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                title="Disconnect wallet"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Button variant="wallet" onClick={connect} disabled={connecting}>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                {connecting ? "Connecting…" : "Connect Wallet"}
              </div>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}


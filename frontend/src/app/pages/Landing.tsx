import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { Button } from "../components/Button";
import { FeatureCard } from "../components/FeatureCard";
import { StatsCard } from "../components/StatsCard";
import { Building2, Users, Vote, Coins, TrendingUp } from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import { useContract, GlobalState } from "../../hooks/useContract";
import { microToAlgo } from "../../utils/algorand";

export function Landing() {
  const { address, connect, connecting } = useWallet();
  const { fetchGlobalState } = useContract();
  const [gs, setGs] = useState<GlobalState | null>(null);

  useEffect(() => {
    fetchGlobalState().then(setGs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tvl      = gs ? (microToAlgo(gs.pricePerToken) * Number(gs.tokensSold)).toFixed(0) : null;
  const listed   = gs ? (Number(gs.assetId) > 0 ? "1" : null) : null;
  const rentDist = gs ? microToAlgo(gs.rentPool) : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative border-b-4 border-black overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-8 py-32 grid grid-cols-12 gap-8 items-center">
          <div className="col-span-7">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-7xl font-bold leading-tight mb-6"
            >
              Own Real Estate.
              <br />
              <span className="text-[#5B3EFF]">On-Chain.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 mb-12 leading-relaxed max-w-xl"
            >
              Invest in tokenized real estate with fractional ownership.
              Earn automated rent distributions and trade properties instantly.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-6"
            >
              <Link to="/marketplace">
                <Button variant="primary">Explore Marketplace</Button>
              </Link>
              {address ? (
                <Link to="/portfolio">
                  <Button variant="secondary">My Portfolio</Button>
                </Link>
              ) : (
                <Button variant="secondary" onClick={connect} disabled={connecting}>
                  {connecting ? "Connectingâ€¦" : "Connect Wallet"}
                </Button>
              )}
            </motion.div>
          </div>

          <div className="col-span-5 relative">
            <motion.div
              animate={{
                rotateY: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="relative w-full aspect-square"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#5B3EFF] to-[#00FF88] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <img
                  src="https://images.unsplash.com/photo-1692818769925-6b815111c653?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBza3lzY3JhcGVyJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzcyMjc5NzQzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Building"
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
            </motion.div>

            {/* Floating Token */}
            <motion.div
              animate={{
                y: [-20, 20, -20],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-8 -right-8 w-32 h-32 bg-[#00FF88] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-12"
            >
              <Coins className="w-16 h-16" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-[1440px] mx-auto px-8 py-24 border-b-4 border-black">
        <h2 className="text-5xl font-bold mb-16 uppercase">Why AssetToken</h2>
        <div className="grid grid-cols-4 gap-8">
          <FeatureCard
            icon={<Building2 className="w-8 h-8" />}
            title="Fractional Ownership"
            description="Own pieces of premium real estate starting from just $100. No need for massive capital."
          />
          <FeatureCard
            icon={<Vote className="w-8 h-8" />}
            title="On-Chain Governance"
            description="Vote on property decisions proportional to your token holdings. True democratic ownership."
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Automated Rent"
            description="Receive monthly rental income directly to your wallet. Fully transparent and automated."
          />
          <FeatureCard
            icon={<Coins className="w-8 h-8" />}
            title="Instant Liquidity"
            description="Trade your property tokens 24/7 on our marketplace. No lengthy sale processes."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-[1440px] mx-auto px-8 py-24 border-b-4 border-black">
        <h2 className="text-5xl font-bold mb-16 uppercase">Platform Stats</h2>
        <div className="grid grid-cols-4 gap-8">
          <StatsCard label="Total Value Locked" value={tvl && Number(tvl) > 0 ? `${Number(tvl).toLocaleString()} ALGO` : "$124M"} />
          <StatsCard label="Active Investors" value="12,847" />
          <StatsCard label="Assets Listed" value={listed ?? "156"} />
          <StatsCard label="Rent Distributed" value={rentDist && rentDist > 0 ? `${rentDist.toFixed(2)} ALGO` : "$8.2M"} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white border-b-4 border-black">
        <div className="max-w-[1440px] mx-auto px-8 py-24 text-center">
          <h2 className="text-6xl font-bold mb-8 uppercase">Start Investing Today</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join thousands of investors building wealth through tokenized real estate.
          </p>
          <Link to="/marketplace">
            <Button variant="accent">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6" />
                Browse Properties
              </div>
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-4 border-black">
        <div className="max-w-[1440px] mx-auto px-8 py-12">
          <div className="flex justify-between items-center">
            <p className="text-2xl font-bold">ASSETTOKEN</p>
            <p className="font-mono text-gray-400">Â© 2026 All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

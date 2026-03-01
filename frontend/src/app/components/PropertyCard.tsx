import { motion } from "motion/react";
import { Link } from "react-router";
import { TrendingUp } from "lucide-react";

interface PropertyCardProps {
  id: string;
  image: string;
  name: string;
  location: string;
  tokenPrice: number;
  yield: number;
  tokensSold: number;
  totalTokens: number;
  tag?: string;
}

export function PropertyCard({
  id,
  image,
  name,
  location,
  tokenPrice,
  yield: yieldPercent,
  tokensSold,
  totalTokens,
  tag,
}: PropertyCardProps) {
  const progressPercent = (tokensSold / totalTokens) * 100;

  return (
    <motion.div
      whileHover={{ y: -8, x: 4 }}
      className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all relative"
    >
      {tag && (
        <div className="absolute top-4 right-4 bg-[#00FF88] text-black px-4 py-2 border-3 border-black font-bold text-sm uppercase rotate-3 z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {tag}
        </div>
      )}
      
      <div className="aspect-[4/3] overflow-hidden border-b-4 border-black relative">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <p className="text-gray-400 font-bold mb-6 uppercase tracking-wide text-sm">{location}</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm font-bold text-gray-400 mb-1">TOKEN PRICE</p>
            <p className="text-2xl font-mono font-bold">${tokenPrice}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 mb-1">ANNUAL YIELD</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00FF88]" />
              <p className="text-2xl font-mono font-bold">{yieldPercent}%</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold">TOKENS SOLD</span>
            <span className="text-sm font-mono font-bold">{tokensSold}/{totalTokens}</span>
          </div>
          <div className="w-full h-3 bg-gray-200 border-2 border-black">
            <div
              className="h-full bg-[#00FF88] border-r-2 border-black transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <Link to={`/property/${id}`}>
          <button className="w-full bg-black text-white py-4 font-bold uppercase tracking-wide border-3 border-black hover:bg-[#5B3EFF] transition-colors">
            Buy Tokens
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

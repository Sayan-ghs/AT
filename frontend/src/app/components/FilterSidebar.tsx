import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FilterSidebarProps {
  onFilterChange?: (filters: any) => void;
}

export function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [yieldRange, setYieldRange] = useState([0, 20]);
  const [location, setLocation] = useState("all");
  const [status, setStatus] = useState("all");

  const locations = ["All Locations", "New York", "Los Angeles", "Miami", "San Francisco", "Chicago"];
  const statuses = ["All Status", "Active", "Sold Out"];

  return (
    <div className="w-80 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-32">
      <h2 className="text-2xl font-bold mb-8 uppercase">Filters</h2>

      <div className="space-y-8">
        {/* Location */}
        <div>
          <label className="block text-sm font-bold mb-3 uppercase tracking-wide">Location</label>
          <div className="relative">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 border-3 border-black font-bold appearance-none bg-white cursor-pointer"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc.toLowerCase().replace(" ", "-")}>
                  {loc}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-bold mb-3 uppercase tracking-wide">
            Price Range: ${priceRange[0]} - ${priceRange[1]}
          </label>
          <input
            type="range"
            min="0"
            max="10000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
            className="w-full h-3 bg-gray-200 border-2 border-black appearance-none cursor-pointer slider"
          />
        </div>

        {/* Yield Range */}
        <div>
          <label className="block text-sm font-bold mb-3 uppercase tracking-wide">
            Annual Yield: {yieldRange[0]}% - {yieldRange[1]}%
          </label>
          <input
            type="range"
            min="0"
            max="20"
            value={yieldRange[1]}
            onChange={(e) => setYieldRange([0, parseInt(e.target.value)])}
            className="w-full h-3 bg-gray-200 border-2 border-black appearance-none cursor-pointer slider"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-bold mb-3 uppercase tracking-wide">Status</label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border-3 border-black font-bold appearance-none bg-white cursor-pointer"
            >
              {statuses.map((s) => (
                <option key={s} value={s.toLowerCase().replace(" ", "-")}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Reset Button */}
        <button className="w-full py-3 bg-white text-black border-3 border-black font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors">
          Reset Filters
        </button>
      </div>
    </div>
  );
}

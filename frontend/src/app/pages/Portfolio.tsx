import { useCallback, useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Wallet, TrendingUp, DollarSign, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import { useContract, GlobalState, InvestorState } from "../../hooks/useContract";
import { microToAlgo, shortenAddress } from "../../utils/algorand";

const PROPERTY_IMG =
  "https://images.unsplash.com/photo-1693327448160-951857e2a597?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjB5b3JrJTIwcGVudGhvdXNlJTIwYXBhcnRtZW50fGVufDF8fHx8MTc3MjI3OTc2NXww&ixlib=rb-4.1.0&q=80&w=1080";

const portfolioProperties = [
  {
    id: "1",
    name: "Manhattan Tower",
    location: "New York, NY",
    image: "https://images.unsplash.com/photo-1693327448160-951857e2a597?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjB5b3JrJTIwcGVudGhvdXNlJTIwYXBhcnRtZW50fGVufDF8fHx8MTc3MjI3OTc2NXww&ixlib=rb-4.1.0&q=80&w=1080",
    tokensOwned: 45,
    totalInvestment: 11250,
    currentValue: 12375,
    rentEarned: 945,
    unclaimedRent: 127,
    yield: 8.5,
  },
  {
    id: "2",
    name: "Ocean View Resort",
    location: "Miami, FL",
    image: "https://images.unsplash.com/photo-1739140019682-05bd100b5a5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWFtaSUyMGJlYWNoJTIwbHV4dXJ5JTIwaG90ZWx8ZW58MXx8fHwxNzcyMjc5NzY1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    tokensOwned: 30,
    totalInvestment: 5400,
    currentValue: 6120,
    rentEarned: 658,
    unclaimedRent: 92,
    yield: 12.3,
  },
  {
    id: "3",
    name: "Lakefront Complex",
    location: "Chicago, IL",
    image: "https://images.unsplash.com/photo-1765728614474-391c19da9ec0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGljYWdvJTIwZG93bnRvd24lMjBwcm9wZXJ0eXxlbnwxfHx8fDE3NzIyNzk3NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    tokensOwned: 25,
    totalInvestment: 4875,
    currentValue: 5362,
    rentEarned: 443,
    unclaimedRent: 71,
    yield: 9.2,
  },
];

export function Portfolio() {
  const totalPortfolioValue = portfolioProperties.reduce((sum, prop) => sum + prop.currentValue, 0);
  const totalInvestment = portfolioProperties.reduce((sum, prop) => sum + prop.totalInvestment, 0);
  const totalRentEarned = portfolioProperties.reduce((sum, prop) => sum + prop.rentEarned, 0);
  const totalUnclaimedRent = portfolioProperties.reduce((sum, prop) => sum + prop.unclaimedRent, 0);
  const totalGain = totalPortfolioValue - totalInvestment;
  const totalGainPercent = ((totalGain / totalInvestment) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-4 uppercase">Portfolio</h1>
          <p className="text-xl text-gray-600">
            Track your investments and claim your rental income
          </p>
        </div>

        {/* Wallet Summary */}
        <div className="grid grid-cols-4 gap-8 mb-12">
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="w-8 h-8" />
              <p className="text-sm font-bold text-gray-400 uppercase">ALGO Balance</p>
            </div>
            <p className="text-5xl font-mono font-bold">1,247</p>
          </div>

          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8" />
              <p className="text-sm font-bold text-gray-400 uppercase">Portfolio Value</p>
            </div>
            <p className="text-5xl font-mono font-bold">${totalPortfolioValue.toLocaleString()}</p>
          </div>

          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-[#00FF88]" />
              <p className="text-sm font-bold text-gray-400 uppercase">Total Gain</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-mono font-bold text-[#00FF88]">+{totalGainPercent}%</p>
            </div>
          </div>

          <div className="bg-[#00FF88] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8" />
              <p className="text-sm font-bold uppercase">Unclaimed Rent</p>
            </div>
            <p className="text-5xl font-mono font-bold">${totalUnclaimedRent}</p>
          </div>
        </div>

        {/* Owned Properties */}
        <div>
          <h2 className="text-4xl font-bold mb-8 uppercase">Your Properties</h2>
          <div className="space-y-6">
            {portfolioProperties.map((property) => (
              <div
                key={property.id}
                className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
              >
                <div className="grid grid-cols-12">
                  {/* Property Image */}
                  <div className="col-span-3 border-r-4 border-black">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={property.image}
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="col-span-9 p-8">
                    <div className="grid grid-cols-12 gap-8">
                      <div className="col-span-4">
                        <h3 className="text-2xl font-bold mb-2">{property.name}</h3>
                        <p className="text-gray-400 font-bold uppercase text-sm mb-6">
                          {property.location}
                        </p>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-bold text-sm">TOKENS OWNED</span>
                            <span className="font-mono font-bold">{property.tokensOwned}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-bold text-sm">ANNUAL YIELD</span>
                            <span className="font-mono font-bold text-[#00FF88]">
                              {property.yield}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4 border-l-4 border-r-4 border-black px-8">
                        <p className="text-sm font-bold text-gray-400 mb-4 uppercase">
                          Investment Performance
                        </p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-bold text-gray-400 mb-1">INVESTED</p>
                            <p className="text-2xl font-mono font-bold">
                              ${property.totalInvestment.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 mb-1">CURRENT VALUE</p>
                            <p className="text-2xl font-mono font-bold text-[#00FF88]">
                              ${property.currentValue.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 mb-1">TOTAL GAIN</p>
                            <p className="text-xl font-mono font-bold text-[#00FF88]">
                              +$
                              {(property.currentValue - property.totalInvestment).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4">
                        <p className="text-sm font-bold text-gray-400 mb-4 uppercase">
                          Rental Income
                        </p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-bold text-gray-400 mb-1">TOTAL EARNED</p>
                            <p className="text-2xl font-mono font-bold">
                              ${property.rentEarned.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 mb-1">UNCLAIMED</p>
                            <p className="text-2xl font-mono font-bold text-[#00FF88]">
                              ${property.unclaimedRent}
                            </p>
                          </div>
                          <Button variant="accent" className="w-full mt-2">
                            Claim Rent
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Claim All Section */}
        <div className="mt-12 bg-black text-white border-4 border-black p-12 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-4xl font-bold mb-4 uppercase">Total Unclaimed Rent</h2>
          <p className="text-7xl font-mono font-bold text-[#00FF88] mb-8">
            ${totalUnclaimedRent}
          </p>
          <Button variant="accent">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6" />
              Claim All Rent
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

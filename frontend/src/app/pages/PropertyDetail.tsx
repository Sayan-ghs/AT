import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { BuyModal } from "../components/BuyModal";
import { TrendingUp, MapPin, Building2, Coins } from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const propertyData = {
  "1": {
    id: "1",
    name: "Manhattan Tower",
    location: "New York, NY",
    image: "https://images.unsplash.com/photo-1693327448160-951857e2a597?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjB5b3JrJTIwcGVudGhvdXNlJTIwYXBhcnRtZW50fGVufDF8fHx8MTc3MjI3OTc2NXww&ixlib=rb-4.1.0&q=80&w=1080",
    tokenPrice: 250,
    yield: 8.5,
    tokensSold: 8500,
    totalTokens: 10000,
    description: "Prime luxury residential tower in the heart of Manhattan. Features 50 high-end apartments with stunning city views.",
    squareFeet: "125,000 sq ft",
    yearBuilt: "2021",
    propertyType: "Residential",
  },
};

const ownershipData = [
  { name: "Available", value: 1500, color: "#E5E5E5" },
  { name: "Owned", value: 8500, color: "#00FF88" },
];

const projectedReturns = [
  { month: "Jan", value: 6.2 },
  { month: "Feb", value: 6.8 },
  { month: "Mar", value: 7.1 },
  { month: "Apr", value: 7.5 },
  { month: "May", value: 7.9 },
  { month: "Jun", value: 8.2 },
  { month: "Jul", value: 8.5 },
  { month: "Aug", value: 8.9 },
  { month: "Sep", value: 9.2 },
  { month: "Oct", value: 9.5 },
  { month: "Nov", value: 9.8 },
  { month: "Dec", value: 10.2 },
];

export function PropertyDetail() {
  const { id } = useParams();
  const property = propertyData[id as keyof typeof propertyData] || propertyData["1"];
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = ["Overview", "Financials", "Governance", "Documents"];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-8 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-12 gap-8 mb-12">
          {/* Property Image */}
          <div className="col-span-7">
            <div className="border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden aspect-[4/3]">
              <img
                src={property.image}
                alt={property.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Token Info Panel */}
          <div className="col-span-5">
            <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] sticky top-32">
              <h1 className="text-4xl font-bold mb-2">{property.name}</h1>
              <div className="flex items-center gap-2 text-gray-400 mb-8">
                <MapPin className="w-5 h-5" />
                <span className="font-bold uppercase">{property.location}</span>
              </div>

              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center pb-4 border-b-3 border-black">
                  <span className="font-bold uppercase tracking-wide">Token Price</span>
                  <span className="text-3xl font-mono font-bold">${property.tokenPrice}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b-3 border-black">
                  <span className="font-bold uppercase tracking-wide">Available Tokens</span>
                  <span className="text-3xl font-mono font-bold">
                    {property.totalTokens - property.tokensSold}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b-3 border-black">
                  <span className="font-bold uppercase tracking-wide">Total Supply</span>
                  <span className="text-3xl font-mono font-bold">{property.totalTokens}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wide">Annual Yield</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-[#00FF88]" />
                    <span className="text-3xl font-mono font-bold text-[#00FF88]">
                      {property.yield}%
                    </span>
                  </div>
                </div>
              </div>

              <Button variant="accent" className="w-full" onClick={() => setIsModalOpen(true)}>
                Buy Tokens
              </Button>

              {/* 3D Token Visual */}
              <div className="mt-8 flex justify-center">
                <div className="w-32 h-32 bg-[#00FF88] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-6">
                  <Coins className="w-16 h-16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          {/* Ownership Distribution */}
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-bold mb-6 uppercase">Ownership Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ownershipData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  strokeWidth={3}
                  stroke="#000000"
                >
                  {ownershipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#00FF88] border-2 border-black" />
                <span className="font-bold">Owned (85%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 border-2 border-black" />
                <span className="font-bold">Available (15%)</span>
              </div>
            </div>
          </div>

          {/* Projected Returns */}
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-bold mb-6 uppercase">Projected Returns</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectedReturns}>
                <CartesianGrid strokeWidth={2} stroke="#E5E5E5" />
                <XAxis dataKey="month" stroke="#000000" strokeWidth={2} />
                <YAxis stroke="#000000" strokeWidth={2} />
                <Tooltip
                  contentStyle={{
                    border: "3px solid #000000",
                    backgroundColor: "#FFFFFF",
                    fontWeight: "bold",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#00FF88"
                  strokeWidth={4}
                  dot={{ fill: "#000000", r: 6, strokeWidth: 3, stroke: "#000000" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex border-b-4 border-black">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`flex-1 py-4 px-6 font-bold uppercase tracking-wide transition-colors border-r-4 last:border-r-0 border-black ${
                  activeTab === tab.toLowerCase()
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8 bg-white">
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4 uppercase">About This Property</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{property.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <div className="border-4 border-black p-6">
                    <Building2 className="w-8 h-8 mb-4" />
                    <p className="text-sm font-bold text-gray-400 mb-2">PROPERTY TYPE</p>
                    <p className="text-2xl font-bold">{property.propertyType}</p>
                  </div>
                  <div className="border-4 border-black p-6">
                    <Building2 className="w-8 h-8 mb-4" />
                    <p className="text-sm font-bold text-gray-400 mb-2">SIZE</p>
                    <p className="text-2xl font-bold">{property.squareFeet}</p>
                  </div>
                  <div className="border-4 border-black p-6">
                    <Building2 className="w-8 h-8 mb-4" />
                    <p className="text-sm font-bold text-gray-400 mb-2">YEAR BUILT</p>
                    <p className="text-2xl font-bold">{property.yearBuilt}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "financials" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-4 uppercase">Financial Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between p-4 border-3 border-black">
                    <span className="font-bold">Annual Rental Income</span>
                    <span className="font-mono font-bold">$2,125,000</span>
                  </div>
                  <div className="flex justify-between p-4 border-3 border-black">
                    <span className="font-bold">Property Management Fee</span>
                    <span className="font-mono font-bold">2.5%</span>
                  </div>
                  <div className="flex justify-between p-4 border-3 border-black">
                    <span className="font-bold">Net Operating Income</span>
                    <span className="font-mono font-bold">$2,071,875</span>
                  </div>
                  <div className="flex justify-between p-4 border-3 border-black bg-[#00FF88]">
                    <span className="font-bold">Projected Annual Return</span>
                    <span className="font-mono font-bold">{property.yield}%</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "governance" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-4 uppercase">Active Proposals</h3>
                <div className="border-4 border-black p-6">
                  <p className="font-bold text-xl mb-2">Proposal #7: Rooftop Garden Installation</p>
                  <p className="text-gray-600 mb-4">
                    Vote on installing a rooftop garden to increase property value and resident satisfaction.
                  </p>
                  <div className="flex gap-4">
                    <button className="flex-1 py-3 bg-[#00FF88] border-3 border-black font-bold uppercase">
                      Vote Yes
                    </button>
                    <button className="flex-1 py-3 bg-white border-3 border-black font-bold uppercase">
                      Vote No
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-4 uppercase">Property Documents</h3>
                <div className="space-y-3">
                  {["Property Deed", "Insurance Policy", "Inspection Report", "Token Contract"].map(
                    (doc) => (
                      <div
                        key={doc}
                        className="flex justify-between items-center p-4 border-3 border-black hover:bg-gray-100 cursor-pointer"
                      >
                        <span className="font-bold">{doc}</span>
                        <span className="font-mono text-sm text-gray-400">PDF</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BuyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={{
          name: property.name,
          tokenPrice: property.tokenPrice,
          availableTokens: property.totalTokens - property.tokensSold,
        }}
      />
    </div>
  );
}

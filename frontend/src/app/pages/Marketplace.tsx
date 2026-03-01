import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { FilterSidebar } from "../components/FilterSidebar";
import { PropertyCard } from "../components/PropertyCard";
import { Loader2 } from "lucide-react";
import { useContract, GlobalState } from "../../hooks/useContract";
import { microToAlgo } from "../../utils/algorand";


const PROPERTY_IMAGE =
  (import.meta.env.VITE_PROPERTY_IMAGE as string) ||
  "https://images.unsplash.com/photo-1693327448160-951857e2a597?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjB5b3JrJTIwcGVudGhvdXNlJTIwYXBhcnRtZW50fGVufDF8fHx8MTc3MjI3OTc2NXww&ixlib=rb-4.1.0&q=80&w=1080";

export function Marketplace() {
  const { fetchGlobalState } = useContract();
  const [gs, setGs] = useState<GlobalState | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchGlobalState().then((data) => {
      setGs(data);
      setFetching(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasAsset = gs && Number(gs.assetId) > 0;
  const priceAlgo = gs ? microToAlgo(gs.pricePerToken) : 0;
  const tokensSold = gs ? Number(gs.tokensSold) : 0;
  const totalTokens = gs ? Number(gs.totalTokens) : 0;
  const propertyName = (import.meta.env.VITE_PROPERTY_NAME as string) || "Real Estate Token";
  const propertyLocation = (import.meta.env.VITE_PROPERTY_LOCATION as string) || "Algorand Testnet";
  const propertyYield = parseFloat((import.meta.env.VITE_PROPERTY_YIELD as string) || "0");

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-4 uppercase">Marketplace</h1>
          <p className="text-xl text-gray-600">
            Explore tokenized real estate opportunities on Algorand
          </p>
        </div>

        <div className="flex gap-8">
          <FilterSidebar />

          <div className="flex-1">
            {fetching ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-12 h-12 animate-spin" />
              </div>
            ) : hasAsset ? (
              <div className="grid grid-cols-3 gap-8">
                <PropertyCard
                  id="token"
                  image={PROPERTY_IMAGE}
                  name={propertyName}
                  location={propertyLocation}
                  tokenPrice={priceAlgo}
                  yield={propertyYield}
                  tokensSold={tokensSold}
                  totalTokens={totalTokens}
                  tag="Live"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-2xl font-bold uppercase">No Properties Listed</p>
                <p className="text-gray-500 mt-2 font-bold">
                  The admin has not yet created a property asset.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

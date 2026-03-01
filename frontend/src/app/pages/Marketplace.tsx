import { Navbar } from "../components/Navbar";
import { FilterSidebar } from "../components/FilterSidebar";
import { PropertyCard } from "../components/PropertyCard";

const properties = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1693327448160-951857e2a597?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjB5b3JrJTIwcGVudGhvdXNlJTIwYXBhcnRtZW50fGVufDF8fHx8MTc3MjI3OTc2NXww&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Manhattan Tower",
    location: "New York, NY",
    tokenPrice: 250,
    yield: 8.5,
    tokensSold: 8500,
    totalTokens: 10000,
    tag: "High Yield",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1739140019682-05bd100b5a5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWFtaSUyMGJlYWNoJTIwbHV4dXJ5JTIwaG90ZWx8ZW58MXx8fHwxNzcyMjc5NzY1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Ocean View Resort",
    location: "Miami, FL",
    tokenPrice: 180,
    yield: 12.3,
    tokensSold: 6200,
    totalTokens: 8000,
    tag: "High Yield",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1695194301932-28fef4ff8869?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW4lMjBmcmFuY2lzY28lMjBvZmZpY2UlMjBidWlsZGluZ3xlbnwxfHx8fDE3NzIyNzk3NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Tech Hub Plaza",
    location: "San Francisco, CA",
    tokenPrice: 320,
    yield: 6.8,
    tokensSold: 4500,
    totalTokens: 12000,
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1765728614474-391c19da9ec0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGljYWdvJTIwZG93bnRvd24lMjBwcm9wZXJ0eXxlbnwxfHx8fDE3NzIyNzk3NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Lakefront Complex",
    location: "Chicago, IL",
    tokenPrice: 195,
    yield: 9.2,
    tokensSold: 7800,
    totalTokens: 9000,
  },
  {
    id: "5",
    image: "https://images.unsplash.com/photo-1657896323366-c2f7789378c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb3MlMjBhbmdlbGVzJTIwbW9kZXJuJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzcyMjc5NzY2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Hollywood Heights",
    location: "Los Angeles, CA",
    tokenPrice: 280,
    yield: 7.5,
    tokensSold: 5000,
    totalTokens: 15000,
  },
  {
    id: "6",
    image: "https://images.unsplash.com/photo-1663049964691-fafb07bda9ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3N0b24lMjBoaXN0b3JpYyUyMGJ1aWxkaW5nfGVufDF8fHx8MTc3MjI3OTc2Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Historic District",
    location: "Boston, MA",
    tokenPrice: 215,
    yield: 8.9,
    tokensSold: 9500,
    totalTokens: 10000,
  },
];

export function Marketplace() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-4 uppercase">Marketplace</h1>
          <p className="text-xl text-gray-600">
            Explore tokenized real estate opportunities from around the world
          </p>
        </div>

        <div className="flex gap-8">
          <FilterSidebar />

          <div className="flex-1">
            <div className="grid grid-cols-3 gap-8">
              {properties.map((property) => (
                <PropertyCard key={property.id} {...property} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatsCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export function StatsCard({ label, value, icon }: StatsCardProps) {
  return (
    <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {icon && <div className="mb-4">{icon}</div>}
      <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">{label}</p>
      <p className="text-5xl font-mono font-bold">{value}</p>
    </div>
  );
}

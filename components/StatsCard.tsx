/**
 * StatsCard — Dashboard metric card
 *
 * Displays a label, numeric value, optional accent color and trend indicator.
 */

interface StatsCardProps {
  label: string;
  value: string | number;
  accent?: "green" | "blue" | "amber" | "red" | "gray";
  icon?: React.ReactNode;
  subtitle?: string;
}

const accentMap = {
  green: "bg-nexora-50 text-nexora-700 border-nexora-100",
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  red: "bg-red-50 text-red-600 border-red-100",
  gray: "bg-gray-50 text-gray-600 border-gray-100",
};

const iconBgMap = {
  green: "bg-nexora-100 text-nexora-700",
  blue: "bg-blue-100 text-blue-600",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-red-100 text-red-600",
  gray: "bg-gray-100 text-gray-500",
};

export default function StatsCard({
  label,
  value,
  accent = "gray",
  icon,
  subtitle,
}: StatsCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${accentMap[accent]} transition-all`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgMap[accent]}`}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {subtitle && <p className="text-xs mt-1 opacity-60">{subtitle}</p>}
    </div>
  );
}

import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, subDays } from "date-fns";

const getComputedColor = (variable) => {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  return style.getPropertyValue(variable).trim();
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-float text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-base">${Number(payload[0].value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    </div>
  );
};

export default function PortfolioChart({ snapshots, currentValue }) {
  const [accent, setAccent] = useState(() => getComputedColor("--accent"));
  const [mutedForeground, setMutedForeground] = useState(() => getComputedColor("--muted-foreground"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setAccent(getComputedColor("--accent"));
      setMutedForeground(getComputedColor("--muted-foreground"));
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] });
    return () => observer.disconnect();
  }, []);
  const data = useMemo(() => {
    if (!snapshots?.length) {
      // Generate dummy trend with current value
      return Array.from({ length: 7 }, (_, i) => ({
        date: format(subDays(new Date(), 6 - i), "MMM d"),
        value: currentValue * (0.9 + Math.random() * 0.15),
      })).concat([{ date: "Today", value: currentValue }]);
    }
    return snapshots.slice(-30).map(s => ({
      date: format(typeof s.date === "string" ? parseISO(s.date) : new Date(s.date), "MMM d"),
      value: s.total_value,
    })).concat([{ date: "Today", value: currentValue }]);
  }, [snapshots, currentValue]);

  const min = Math.min(...data.map(d => d.value)) * 0.95;
  const max = Math.max(...data.map(d => d.value)) * 1.05;

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`portfolioGrad-${Date.now()}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`hsl(${accent})`} stopOpacity={0.3} />
            <stop offset="100%" stopColor={`hsl(${accent})`} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: `hsl(${mutedForeground})` }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis domain={[min, max]} hide />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={`hsl(${accent})`}
          strokeWidth={2}
          fill={`url(#portfolioGrad-${Date.now()})`}
          dot={false}
          activeDot={{ r: 4, fill: `hsl(${accent})` }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
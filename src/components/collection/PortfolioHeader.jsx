import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const getComputedColor = (variable) => {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  return style.getPropertyValue(variable).trim();
};

const TIME_FILTERS = ["1D", "7D", "1M", "3M", "6M", "MAX"];

function generateChartData(cards, filter) {
  const now = new Date();
  const days = { "1D": 1, "7D": 7, "1M": 30, "3M": 90, "6M": 180, "MAX": 365 }[filter] || 365;
  const points = Math.min(days, 60);
  const currentValue = cards.reduce((s, c) => s + (c.estimated_value || 0), 0);
  const startValue = currentValue * 0.82;

  return Array.from({ length: points }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (points - 1 - i));
    const progress = i / (points - 1);
    const noise = (Math.random() - 0.5) * currentValue * 0.03;
    const value = startValue + (currentValue - startValue) * Math.pow(progress, 1.2) + noise;
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.max(0, value),
    };
  });
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-semibold">
      ${Number(payload[0].value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </div>
  );
};

export default function PortfolioHeader({ cards }) {
  const [filter, setFilter] = useState("MAX");
  const [hidden, setHidden] = useState(false);
  const [accent, setAccent] = useState(() => getComputedColor("--accent"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setAccent(getComputedColor("--accent"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] });
    return () => observer.disconnect();
  }, []);

  const totalValue = cards.reduce((s, c) => s + (c.estimated_value || 0), 0);
  const totalCost = cards.filter(c => c.purchase_price).reduce((s, c) => s + c.purchase_price, 0);
  const totalGain = totalValue - totalCost;
  const gainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : null;
  const isUp = totalGain >= 0;

  const chartData = generateChartData(cards, filter);
  const firstValue = chartData[0]?.value || totalValue;
  const changeFromStart = totalValue - firstValue;

  return (
    <div className="bg-background mb-4 overflow-hidden -mx-6">
      <div className="px-8 pt-0 pb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Portfolio Main</p>
        <div className="flex items-center gap-2">
          <p className="text-4xl font-black text-foreground">
            {hidden ? "••••••" : `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
          <button onClick={() => setHidden(h => !h)} className="text-muted-foreground">
            {hidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {!hidden && (
          <p className={`text-sm font-semibold mt-1 ${isUp ? "text-teal-400" : "text-red-400"}`}>
            {isUp ? "+" : ""}${Math.abs(changeFromStart).toFixed(2)} in the last {
              { "1D": "1 day", "7D": "7 days", "1M": "30 days", "3M": "90 days", "6M": "180 days", "MAX": `${Math.ceil((new Date() - new Date(cards.sort((a,b)=>new Date(a.created_date)-new Date(b.created_date))[0]?.created_date || new Date())) / 86400000)} days` }[filter]
            }
          </p>
        )}
        {gainPct !== null && !hidden && (
          <p className={`text-xs mt-0.5 ${isUp ? "text-teal-400" : "text-red-400"}`}>
            Total P&L: {isUp ? "+" : ""}{gainPct.toFixed(1)}%
          </p>
        )}
      </div>

      <div className="h-40 mt-2 mx-2">
       <ResponsiveContainer width="100%" height="100%">
         <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
           <defs>
             <linearGradient id={`portfolioGrad-${Date.now()}`} x1="0" y1="0" x2="0" y2="1">
               <stop offset="5%" stopColor={`hsl(${accent})`} stopOpacity={0.4} />
               <stop offset="95%" stopColor={`hsl(${accent})`} stopOpacity={0} />
             </linearGradient>
           </defs>
           <Tooltip content={<CustomTooltip />} />
           <Area type="monotone" dataKey="value" stroke={`hsl(${accent.split(' ').slice(0, 2).join(' ')} 70%)`} strokeWidth={2} fill={`url(#portfolioGrad-${Date.now()})`} dot={false} />
         </AreaChart>
       </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-around px-6 pb-5 pt-1">
        {TIME_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold px-2 py-1 rounded-full transition-all ${
             filter === f
               ? "bg-foreground text-background px-3"
               : "text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>


    </div>
  );
}
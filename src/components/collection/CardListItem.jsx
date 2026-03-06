import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import GradeBadge from "@/components/shared/GradeBadge";
import CardThumbnail from "@/components/shared/CardThumbnail";

export default function CardListItem({ card, onClick }) {
  const gain = card.purchase_price
    ? ((card.estimated_value - card.purchase_price) / card.purchase_price) * 100
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 py-4 border-b border-border last:border-0 text-left hover:bg-muted/40 -mx-1 px-1 rounded-lg"
    >
      <CardThumbnail imageUrl={card.image_url} cardName={card.card_name} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{card.card_name}</p>
        <div className="flex items-center gap-2 mt-1">
          <GradeBadge company={card.grading_company} grade={card.grade} size="sm" />
          {card.set_name && <span className="text-xs text-muted-foreground truncate">{card.set_name}</span>}
        </div>
      </div>

      <div className="flex flex-col items-end flex-shrink-0">
        <span className="font-bold text-sm">
          {card.estimated_value
            ? `$${Number(card.estimated_value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : "—"}
        </span>
        {gain !== null && (
          <span className={`text-xs flex items-center gap-0.5 mt-0.5 ${gain > 0 ? "text-success" : gain < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {gain > 0 ? <TrendingUp className="w-3 h-3" /> : gain < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {gain > 0 ? "+" : ""}{gain.toFixed(1)}%
          </span>
        )}
      </div>
    </button>
  );
}
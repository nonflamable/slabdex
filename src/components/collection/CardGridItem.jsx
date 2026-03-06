import CardThumbnail from "@/components/shared/CardThumbnail";
import GradeBadge from "@/components/shared/GradeBadge";

export default function CardGridItem({ card, onClick }) {
  const gain = card.purchase_price && card.estimated_value
    ? ((card.estimated_value - card.purchase_price) / card.purchase_price) * 100
    : null;

  const isUp = gain !== null ? gain >= 0 : null;

  return (
    <button
      onClick={onClick}
      className="bg-card rounded-2xl overflow-hidden flex flex-col text-left w-full border border-border hover:border-foreground/20 transition-all"
    >
      <div className="w-full aspect-[3/4] bg-muted relative overflow-hidden rounded-t-2xl">
        {card.image_url ? (
          <img src={card.image_url} alt={card.card_name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-muted-foreground text-4xl">🃏</span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="text-xs font-bold leading-tight line-clamp-2">{card.card_name}</p>
        {card.set_name && <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">{card.set_name}</p>}
        <GradeBadge company={card.grading_company} grade={card.grade} size="sm" />
        {card.estimated_value ? (
          <p className="text-xs font-bold mt-1">
            ${Number(card.estimated_value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">No data</p>
        )}
        {gain !== null && (
          <p className={`text-[10px] font-semibold ${isUp ? "text-green-500" : "text-red-500"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(gain).toFixed(2)}%
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">Qty: {card.quantity || 1}</p>
      </div>
    </button>
  );
}
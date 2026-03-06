import { useState } from "react";
import { X, ExternalLink, Trash2, RefreshCw, DollarSign, Calendar, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GradeBadge from "@/components/shared/GradeBadge";
import CardThumbnail from "@/components/shared/CardThumbnail";
import { format, parseISO } from "date-fns";

const MARKETPLACES = ["eBay", "TCGPlayer", "PWCC", "Whatnot", "Local", "Other"];

function safeDate(val) {
  if (!val) return null;
  try { return typeof val === "string" ? parseISO(val) : new Date(val); } catch { return null; }
}

export default function CardDetailModal({ card, onClose, onDelete, onUpdate, onRefreshPrice }) {
  const [purchasePrice, setPurchasePrice] = useState(card.purchase_price || "");
  const [purchaseDate, setPurchaseDate] = useState(card.purchase_date ? card.purchase_date.split("T")[0] : "");
  const [marketplace, setMarketplace] = useState(card.purchase_marketplace || "");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [salesLimit, setSalesLimit] = useState(4);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(card.id, {
      purchase_price: parseFloat(purchasePrice) || null,
      purchase_date: purchaseDate || null,
      purchase_marketplace: marketplace || null,
    });
    setSaving(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefreshPrice(card);
    setRefreshing(false);
  };

  const activePurchasePrice = parseFloat(purchasePrice) || null;
  const gain = activePurchasePrice && card.estimated_value
    ? card.estimated_value - activePurchasePrice
    : null;
  const gainPct = gain !== null && activePurchasePrice
    ? (gain / activePurchasePrice) * 100
    : null;

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-14 pb-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <span className="font-semibold">Card Details</span>
          <Button variant="ghost" size="icon" onClick={() => onDelete(card.id)} className="text-destructive">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 px-6 py-6 space-y-6">
          {/* Card info */}
           <div className="flex gap-5 items-start md:items-center">
             <div className="flex-shrink-0">
               <CardThumbnail imageUrl={card.image_url} cardName={card.card_name} size="lg" />
             </div>
             <div className="flex-1 pt-1 space-y-2">
              <h1 className="text-2xl font-bold leading-tight">{card.card_name}</h1>
              <GradeBadge company={card.grading_company} grade={card.grade} size="md" />
              {card.set_name && <p className="text-sm text-muted-foreground">{card.set_name}{card.card_number ? ` · #${card.card_number}` : ""}</p>}
              {card.cert_number && <p className="text-xs text-muted-foreground">Cert: {card.cert_number}</p>}
            </div>
          </div>

          {/* P&L section */}
          <div className="bg-foreground text-background rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs opacity-50 uppercase tracking-widest mb-1">Market Value</p>
                <p className="text-3xl font-black">
                  {card.estimated_value
                    ? `$${Number(card.estimated_value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "—"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-background/60 hover:text-background hover:bg-white/10"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {activePurchasePrice && (
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                <div>
                  <p className="text-xs opacity-50 mb-0.5">Paid</p>
                  <p className="text-sm font-bold">${Number(activePurchasePrice).toFixed(2)}</p>
                </div>
                {gain !== null && (
                  <>
                    <div>
                      <p className="text-xs opacity-50 mb-0.5">Profit</p>
                      <p className={`text-sm font-bold ${gain >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {gain >= 0 ? "+" : ""}${gain.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs opacity-50 mb-0.5">Return</p>
                      <p className={`text-sm font-bold ${gainPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            {card.last_price_update && (
              <p className="text-xs opacity-40">
                Updated {format(safeDate(card.last_price_update) || new Date(), "MMM d, yyyy")}
              </p>
            )}
          </div>

          {/* Purchase tracking */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Purchase Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Price Paid</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={purchasePrice}
                    onChange={e => setPurchasePrice(e.target.value)}
                    placeholder="0.00"
                    className="h-10 pl-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <button
                    onClick={() => setPurchaseDate(new Date().toISOString().split("T")[0])}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      purchaseDate === new Date().toISOString().split("T")[0]
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-muted-foreground border-border"
                    }`}
                  >
                    Today
                  </button>
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    className="h-10 pl-8 text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Marketplace</Label>
              <div className="flex flex-wrap gap-2">
                {MARKETPLACES.map(m => (
                  <button
                    key={m}
                    onClick={() => setMarketplace(marketplace === m ? "" : m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      marketplace === m
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-muted-foreground border-border"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full h-10 rounded-xl">
              {saving ? "Saving..." : "Save Purchase Details"}
            </Button>
          </div>

          {/* Sales data */}
          {card.ebay_sales?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Recent eBay Sales ({card.ebay_sales.length})
              </h3>
              <div className="space-y-2">
                {card.ebay_sales.slice(0, salesLimit).map((sale, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate pr-4">{sale.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sale.date ? format(safeDate(sale.date) || new Date(), "MMM d, yyyy") : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-sm">${Number(sale.price).toFixed(2)}</span>
                      {sale.url && (
                        <a href={sale.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {card.ebay_sales.length > salesLimit && (
                  <button
                    onClick={() => setSalesLimit(s => s + 4)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground py-2 font-medium transition-colors"
                  >
                    Load more ({card.ebay_sales.length - salesLimit} remaining)
                  </button>
                )}
              </div>
            </div>
          )}

          {card.created_date && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              Added {format(safeDate(card.created_date) || new Date(), "MMMM d, yyyy")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
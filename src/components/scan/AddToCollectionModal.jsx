import { useState } from "react";
import { X, DollarSign, Calendar, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MARKETPLACES = ["eBay", "TCGPlayer", "PWCC", "Whatnot", "Local", "Other"];

export default function AddToCollectionModal({ card, priceData, onConfirm, onCancel, isLoading }) {
  const [purchasePrice, setPurchasePrice] = useState(card?.purchase_price ? String(card.purchase_price) : "");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [marketplace, setMarketplace] = useState("");

  const handleSubmit = () => {
    onConfirm({
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      purchase_date: purchaseDate || null,
      purchase_marketplace: marketplace || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="bg-card w-full rounded-t-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Add to Collection</h2>
          <button onClick={onCancel} className="text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-muted rounded-2xl p-4">
          <p className="font-semibold">{card?.card_name}</p>
          <p className="text-sm text-muted-foreground">{card?.grading_company} {card?.grade} · {card?.set_name}</p>
          {priceData?.estimated_value && (
            <p className="text-sm font-semibold mt-1 text-foreground">
              Market Value: ${Number(priceData.estimated_value).toFixed(2)}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">
            Purchase Price (optional)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={purchasePrice}
              onChange={e => setPurchasePrice(e.target.value)}
              placeholder="0.00"
              className="pl-9 h-12"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">
            Purchase Date (optional)
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              className="pl-9 h-12"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">
            Marketplace (optional)
          </Label>
          <div className="flex flex-wrap gap-2">
            {MARKETPLACES.map(m => (
              <button
                key={m}
                onClick={() => setMarketplace(marketplace === m ? "" : m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
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

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 h-12 rounded-2xl" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1 h-12 rounded-2xl" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Adding..." : "Add to Collection"}
          </Button>
        </div>
      </div>
    </div>
  );
}
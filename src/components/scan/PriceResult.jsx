import { useState } from "react";
import { ExternalLink, TrendingUp, RefreshCw, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import GradeBadge from "@/components/shared/GradeBadge";
import ValueDisplay from "@/components/shared/ValueDisplay";
import { format, parseISO } from "date-fns";

export default function PriceResult({ card, priceData, onAddToCollection, onScanAnother, isAdding }) {
  const [salesLimit, setSalesLimit] = useState(4);
  const [listingsLimit, setListingsLimit] = useState(4);
  const { estimated_value, recentSales, activeListings, estimatedMarketFromSales, estimatedMarketFromListings, dataSource, status } = priceData || {};
  const displayImage = card.image_url;

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Hero */}
        <div className="bg-foreground text-background px-6 pt-14 pb-10">
          <div className="flex items-start gap-4 mb-6">
            {displayImage && (
              <div className="w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 shadow-float">
                <img src={displayImage} alt={card.card_name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 pt-1">
              <GradeBadge company={card.grading_company} grade={card.grade} size="md" />
              <h1 className="text-xl font-bold mt-2 leading-tight">{card.card_name}</h1>
              {card.set_name && <p className="text-sm opacity-60 mt-0.5">{card.set_name}{card.card_number ? ` · #${card.card_number}` : ""}</p>}
            </div>
          </div>

          {/* Value */}
          <div className="bg-white/10 rounded-2xl p-5">
            {status === "no_data" || !estimated_value ? (
              <div>
                <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Estimated Market Value</p>
                <p className="text-2xl font-bold">No recent sales</p>
                <p className="text-xs opacity-50 mt-1">No sold eBay listings found</p>
              </div>
            ) : (
              <>
                <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Estimated Market Value (from sales)</p>
                <p className="text-4xl font-black">
                  ${Number(estimated_value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs opacity-50 mt-1">
                  Based on {recentSales?.length} recent sale{recentSales?.length !== 1 ? "s" : ""}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 px-6 py-6 space-y-6">
          {/* Recent sales */}
          {recentSales && recentSales.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Recent Sales (Newest First)</h3>
              <div className="space-y-2">
                {recentSales.slice(0, salesLimit).map((sale, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate pr-4">{sale.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sale.saleDate ? format(typeof sale.saleDate === "string" ? parseISO(sale.saleDate) : new Date(sale.saleDate), "MMM d, yyyy") : "—"}
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
                {recentSales.length > salesLimit && (
                  <button
                    onClick={() => setSalesLimit(s => s + 4)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground py-2 font-medium transition-colors"
                  >
                    Load more ({recentSales.length - salesLimit} remaining)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active listings */}
          {activeListings && activeListings.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Active Listings (For Reference)</h3>
              <div className="space-y-2">
                {activeListings.slice(0, listingsLimit).map((listing, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate pr-4">{listing.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {listing.listingDate ? format(typeof listing.listingDate === "string" ? parseISO(listing.listingDate) : new Date(listing.listingDate), "MMM d, yyyy") : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-sm">${Number(listing.price).toFixed(2)}</span>
                      {listing.url && (
                        <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {activeListings.length > listingsLimit && (
                  <button
                    onClick={() => setListingsLimit(s => s + 4)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground py-2 font-medium transition-colors"
                  >
                    Load more ({activeListings.length - listingsLimit} remaining)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* No data message */}
          {(!recentSales || recentSales.length === 0) && (!activeListings || activeListings.length === 0) && (
            <div className="text-center py-8">
              <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No eBay listings found for this card.</p>
              <p className="text-xs text-muted-foreground mt-1">Try searching directly on eBay for more options.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-10 pt-4 border-t border-border space-y-3">
          <Button
            className="w-full h-14 text-base font-semibold rounded-2xl"
            onClick={onAddToCollection}
            disabled={isAdding}
          >
            <Plus className="w-5 h-5 mr-2" />
            {isAdding ? "Adding..." : "Add to Collection"}
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 rounded-2xl font-medium"
            onClick={onScanAnother}
          >
            Scan Another Card
          </Button>
        </div>
      </div>
    </div>
  );
}
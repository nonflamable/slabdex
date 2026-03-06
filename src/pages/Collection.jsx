import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Package, LayoutGrid, List } from "lucide-react";
import CardListItem from "@/components/collection/CardListItem";
import CardGridItem from "@/components/collection/CardGridItem";
import CardDetailModal from "@/components/collection/CardDetailModal";
import PortfolioHeader from "@/components/collection/PortfolioHeader";
import EmptyState from "@/components/shared/EmptyState";

export default function Collection() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: () => base44.entities.GradedCard.list("-created_date"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GradedCard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      setSelectedCard(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GradedCard.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards"] }),
  });

  const handleRefreshPrice = async (card) => {
    const priceResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Search eBay SOLD listings for graded Pokémon card: "${card.card_name}" ${card.grading_company} ${card.grade}${card.set_name ? ` from ${card.set_name}` : ""}. Return up to 4 recent SOLD listings only.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          status: { type: "string" },
          sales: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                price: { type: "number" },
                date: { type: "string" },
                url: { type: "string" }
              }
            }
          }
        }
      }
    });
    const sales = (priceResult.sales || []).slice(0, 4);
    const estimated_value = sales.length > 0
      ? sales.reduce((s, x) => s + x.price, 0) / sales.length
      : card.estimated_value;
    await base44.entities.GradedCard.update(card.id, {
      estimated_value,
      ebay_sales: sales,
      last_price_update: new Date().toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ["cards"] });
  };

  const sorted = [...cards].sort((a, b) => {
    if (sortBy === "value") return (b.estimated_value || 0) - (a.estimated_value || 0);
    if (sortBy === "name") return a.card_name.localeCompare(b.card_name);
    return 0;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onDelete={(id) => deleteMutation.mutate(id)}
          onUpdate={(id, data) => updateMutation.mutate({ id, data })}
          onRefreshPrice={handleRefreshPrice}
        />
      )}

      {cards.length === 0 && !isLoading ? (
        <EmptyState
          icon={Package}
          title="No cards yet"
          description="Scan your first graded card slab to start tracking your collection value."
        />
      ) : (
        <>
           {cards.length > 0 && <div className="pt-4"><PortfolioHeader cards={cards} /></div>}

          {/* Controls */}
          <div className="flex items-center justify-between px-4 mb-3 mt-2">
            <div className="flex gap-2">
              {["recent", "value", "name"].map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize ${
                    sortBy === s ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg ${viewMode === "list" ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 pb-32">
            {isLoading ? (
              <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className={`shimmer rounded-2xl ${viewMode === "grid" ? "h-64" : "h-16"}`} />
                ))}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-3">
                {sorted.map(card => (
                  <CardGridItem key={card.id} card={card} onClick={() => setSelectedCard(card)} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {sorted.map(card => (
                  <CardListItem key={card.id} card={card} onClick={() => setSelectedCard(card)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
import { useState } from "react";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import GradeBadge from "@/components/shared/GradeBadge";

const GRADING_COMPANIES = ["PSA", "BGS", "CGC", "SGC", "HGA", "Other"];
const GRADES = ["10", "9.5", "9", "8.5", "8", "7.5", "7", "6", "5", "4", "3", "2", "1"];

export default function SearchCard() {
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("PSA");
  const [grade, setGrade] = useState("10");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const priceData = await lookupEbayPrice(query, company, grade);
    setResult({ card_name: query, grading_company: company, grade, ...priceData });
    setLoading(false);
  };

  const lookupEbayPrice = async (name, gradingCompany, grade) => {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Search eBay sold listings for: "${name}" graded ${gradingCompany} ${grade}. 
      Find the most recent sold listings on eBay for this exact graded Pokémon card.
      Return the last 4 sold listings if available, or fewer if not enough exist.
      Format each sale with: title, price (USD number), date (ISO string), url.
      Also calculate the average price.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
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
          },
          estimated_value: { type: "number" },
          status: { type: "string" }
        }
      }
    });
    return res;
  };

  return (
    <div className="space-y-5">
      {/* Search form */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search any card (e.g. Charizard Base Set)"
            className="h-12 pl-11 rounded-2xl"
          />
        </div>

        <div className="flex gap-2">
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger className="h-11 flex-1 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADING_COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="h-11 w-24 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button onClick={handleSearch} disabled={loading || !query.trim()} className="h-11 px-5 rounded-xl">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
          </Button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="bg-foreground text-background p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs opacity-50 uppercase tracking-widest mb-1">Estimated Value</p>
                <p className="text-4xl font-black">
                  {result.estimated_value
                    ? `$${Number(result.estimated_value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "No data"}
                </p>
              </div>
              <GradeBadge company={result.grading_company} grade={result.grade} size="md" />
            </div>
            <p className="text-sm opacity-70 mt-2 font-medium">{result.card_name}</p>
          </div>

          {result.sales?.length > 0 && (
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {result.sales.length} Recent Sales
              </p>
              {result.sales.map((sale, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground truncate flex-1 pr-4">{sale.title || `Sale #${i + 1}`}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-sm">${Number(sale.price).toFixed(2)}</span>
                    {sale.url && (
                      <a href={sale.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
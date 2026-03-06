import { useState } from "react";
import { Check, X, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import GradeBadge from "@/components/shared/GradeBadge";

const GRADING_COMPANIES = ["PSA", "BGS", "CGC", "SGC", "HGA", "ACE", "Other"];
const GRADES = ["10", "9.5", "9", "8.5", "8", "7.5", "7", "6", "5", "4", "3", "2", "1"];

export default function CardConfirmation({ detectedCard, imageUrl, onConfirm, onRetry }) {
  const [card, setCard] = useState({
    card_name: detectedCard?.card_name || "",
    card_number: detectedCard?.card_number || "",
    set_name: detectedCard?.set_name || "",
    grading_company: detectedCard?.grading_company || "PSA",
    grade: detectedCard?.grade || "10",
    cert_number: detectedCard?.cert_number || "",
  });
  const [purchasePrice, setPurchasePrice] = useState("");

  const update = (field, val) => setCard(prev => ({ ...prev, [field]: val }));

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-14 pb-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={onRetry}>
            <X className="w-5 h-5" />
          </Button>
          <span className="font-semibold">Confirm Card</span>
          <div className="w-10" />
        </div>

        <div className="flex-1 px-6 py-6 space-y-6">
          {/* Image + badge */}
          <div className="flex gap-4 items-start">
            {imageUrl && (
              <div className="w-28 h-40 rounded-xl overflow-hidden bg-muted flex-shrink-0 shadow-card">
                <img src={imageUrl} alt={card.card_name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 pt-2 space-y-3">
              <GradeBadge company={card.grading_company} grade={card.grade} size="lg" />
              <p className="text-xs text-muted-foreground">Review and correct the detected information below</p>
              {detectedCard?.confidence && (
                <div className="inline-flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  {Math.round(detectedCard.confidence * 100)}% confidence
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Card Name</Label>
              <Input
                value={card.card_name}
                onChange={e => update("card_name", e.target.value)}
                placeholder="e.g. Charizard"
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Card #</Label>
                <Input value={card.card_number} onChange={e => update("card_number", e.target.value)} placeholder="4/102" className="h-12" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Set / Series</Label>
                <Input value={card.set_name} onChange={e => update("set_name", e.target.value)} placeholder="Base Set" className="h-12" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Grader</Label>
                <Select value={card.grading_company} onValueChange={v => update("grading_company", v)}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADING_COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Grade</Label>
                <Select value={card.grade} onValueChange={v => update("grade", v)}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Cert Number (Optional)</Label>
              <Input value={card.cert_number} onChange={e => update("cert_number", e.target.value)} placeholder="Optional" className="h-12" />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Purchase Price (Optional)</Label>
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
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-10 pt-4 border-t border-border">
          <Button
            className="w-full h-14 text-base font-semibold rounded-2xl"
            onClick={() => onConfirm({ ...card, purchase_price: purchasePrice ? parseFloat(purchasePrice) : null })}
            disabled={!card.card_name}
          >
            <Check className="w-5 h-5 mr-2" />
            Confirm & Look Up Price
          </Button>
        </div>
      </div>
    </div>
  );
}
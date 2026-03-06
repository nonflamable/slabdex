import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const CONDITIONS = [
  { id: "surfaceScratches", label: "Surface scratches" },
  { id: "edgeWear", label: "Edge wear" },
  { id: "cornerDamage", label: "Corner damage or whitening" },
  { id: "centeringIssues", label: "Centering issues noticed" },
  { id: "printDefects", label: "Print lines or defects" },
];

export default function ConditionForm({ company, onSubmit, onBack }) {
  const [conditions, setConditions] = useState({
    surfaceScratches: false,
    edgeWear: false,
    cornerDamage: false,
    centeringIssues: false,
    printDefects: false,
    notes: "",
  });

  const handleToggle = (id) => {
    setConditions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = () => {
    onSubmit(conditions);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-muted-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs text-muted-foreground">Grading company</p>
          <p className="text-lg font-bold">{company}</p>
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-2xl font-bold text-foreground mb-6">Card Condition</h2>

        <div className="space-y-3 mb-8">
          {CONDITIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleToggle(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                conditions[id]
                  ? "bg-card border-foreground bg-opacity-20"
                  : "bg-card border-border"
              }`}
            >
              <div
                className={`w-5 h-5 rounded border-2 transition-all ${
                  conditions[id]
                    ? "bg-foreground border-foreground"
                    : "border-muted-foreground"
                }`}
              >
                {conditions[id] && <span className="text-background text-sm font-bold">✓</span>}
              </div>
              <span className="text-foreground font-medium">{label}</span>
            </button>
          ))}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-foreground mb-2">
            Additional notes (optional)
          </label>
          <textarea
            value={conditions.notes}
            onChange={(e) => setConditions((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Any other observations about the card..."
            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            rows={4}
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full h-12 rounded-xl bg-foreground text-background font-bold"
      >
        Continue to Camera
      </Button>
    </div>
  );
}
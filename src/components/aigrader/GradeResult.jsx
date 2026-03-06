import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, AlertCircle, CheckCircle } from "lucide-react";

export default function GradeResult({
  company,
  conditions,
  imageUrl,
  result,
  error,
  onReset,
}) {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-background px-4 py-6">
        <button onClick={onReset} className="text-muted-foreground mb-6">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-foreground font-medium">Analysis failed</p>
          <p className="text-muted-foreground text-center text-sm">{error}</p>
        </div>
        <Button onClick={onReset} className="w-full h-12 rounded-xl bg-foreground text-background font-bold">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background px-4 py-6">
      <button onClick={onReset} className="text-muted-foreground mb-6">
        <ChevronLeft className="w-5 h-5" />
      </button>

      {imageUrl && (
        <div className="mb-6 rounded-2xl overflow-hidden bg-card border border-border">
          <img src={imageUrl} alt="Analyzed card" className="w-full h-auto" />
        </div>
      )}

      <div className="flex-1">
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            Grading Company
          </p>
          <p className="text-3xl font-black text-foreground mb-4">{company}</p>

          {result ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                  Estimated Grade
                </p>
                <p className="text-2xl font-black text-teal-400">{result}</p>
              </div>
            </div>
          ) : null}
        </div>

        {result && typeof result === "string" && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-6">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result}</p>
          </div>
        )}

        {conditions && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-6">
            <button
              onClick={() => toggleSection("conditions")}
              className="w-full flex items-center justify-between text-foreground font-semibold mb-3"
            >
              <span>Reported Condition Issues</span>
              <span className={`transition-transform ${expandedSection === "conditions" ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>
            {expandedSection === "conditions" && (
              <div className="space-y-2 pt-3 border-t border-border">
                {[
                  { id: "surfaceScratches", label: "Surface scratches" },
                  { id: "edgeWear", label: "Edge wear" },
                  { id: "cornerDamage", label: "Corner damage/whitening" },
                  { id: "centeringIssues", label: "Centering issues" },
                  { id: "printDefects", label: "Print lines/defects" },
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center gap-2 text-sm">
                    {conditions[id] ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-success" />
                    )}
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                ))}
                {conditions.notes && (
                  <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                    {conditions.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onReset}
          variant="outline"
          className="flex-1 h-12 rounded-xl"
        >
          Grade Another Card
        </Button>
      </div>
    </div>
  );
}
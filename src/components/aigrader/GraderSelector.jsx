import { Button } from "@/components/ui/button";

const COMPANIES = ["PSA", "BGS", "CGC", "TAG"];

export default function GraderSelector({ onSelect }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-black text-foreground mb-2">AI Grader</h1>
        <p className="text-muted-foreground">Select a grading company to get started</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {COMPANIES.map((company) => (
          <Button
            key={company}
            onClick={() => onSelect(company)}
            className="h-32 text-lg font-bold bg-card border border-border hover:bg-accent"
          >
            {company}
          </Button>
        ))}
      </div>
    </div>
  );
}
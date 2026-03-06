import { Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScanLimitPrompt({ scansUsed, scansLimit, onClose, onUpgrade }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
      <div className="bg-card rounded-3xl p-8 w-full max-w-sm text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <Zap className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Daily Limit Reached</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You have reached your daily scan limit ({scansLimit}). Upgrade to Premium for unlimited scans and advanced analytics.
          </p>
        </div>
        <div className="bg-muted rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Today's scans used</p>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-destructive rounded-full"
              style={{ width: `${Math.min((scansUsed / scansLimit) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{scansUsed} / {scansLimit}</p>
        </div>
        <Button className="w-full h-12 rounded-2xl" onClick={onUpgrade}>
          <Zap className="w-4 h-4 mr-2" />
          Upgrade to Premium
        </Button>
        <button onClick={onClose} className="text-sm text-muted-foreground">
          Maybe later
        </button>
      </div>
    </div>
  );
}
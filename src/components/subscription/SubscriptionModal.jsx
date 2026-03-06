import { useState } from "react";
import { X, Check, Zap, Star, TrendingUp, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    id: "premium_weekly",
    label: "Weekly",
    price: "$1.99",
    per: "/ week",
    badge: null,
  },
  {
    id: "premium_monthly",
    label: "Monthly",
    price: "$4.99",
    per: "/ month",
    badge: "Most Popular",
  },
  {
    id: "premium_yearly",
    label: "Yearly",
    price: "$29.99",
    per: "/ year",
    badge: "Best Value · Save 50%",
  },
];

const FEATURES = [
  { icon: Zap, text: "Unlimited card scans" },
  { icon: TrendingUp, text: "Price trend charts per card" },
  { icon: BarChart2, text: "Advanced portfolio analytics" },
  { icon: Star, text: "Portfolio insights & stats" },
];

export default function SubscriptionModal({ onClose, onSubscribe, currentTier, scansUsed, scansLimit }) {
  const [selected, setSelected] = useState("premium_monthly");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    await onSubscribe(selected);
    setLoading(false);
  };

  const isPremium = currentTier !== "free";

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-14 pb-4">
          <div className="w-10" />
          <div className="w-8 h-1 rounded-full bg-border" />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 px-6 py-4 space-y-8">
          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-foreground flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-background" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">SlabDex Pro</h1>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Unlock unlimited scans, price trends, and powerful portfolio analytics.
            </p>
          </div>

          {/* Scan usage meter */}
          {!isPremium && (
            <div className="bg-muted rounded-2xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Free Scans Used</span>
                <span className="text-muted-foreground">{scansUsed} / {scansLimit}</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full"
                  style={{ width: `${Math.min((scansUsed / scansLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Features */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Plans */}
          <div className="space-y-3">
            {PLANS.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  selected === plan.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:border-foreground/30"
                }`}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{plan.label}</span>
                    {plan.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        selected === plan.id ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                      }`}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-lg">{plan.price}</span>
                  <span className={`text-xs ml-1 ${selected === plan.id ? "opacity-60" : "text-muted-foreground"}`}>{plan.per}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-10 pt-4 space-y-3">
          <Button
            className="w-full h-14 text-base font-semibold rounded-2xl"
            onClick={handleSubscribe}
            disabled={loading || isPremium}
          >
            {isPremium ? "Already Subscribed ✓" : loading ? "Processing..." : "Start Pro Access"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Cancel anytime · Billed through App Store · Restore purchases available
          </p>
        </div>
      </div>
    </div>
  );
}
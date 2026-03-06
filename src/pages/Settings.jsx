import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, ChevronRight, Moon, Sun, Bell, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
import ThemeSelector from "@/components/settings/ThemeSelector";

export default function Settings() {
  const [showSubscription, setShowSubscription] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [profile, setProfile] = useState(null);

  const loadProfile = async () => {
    const me = await base44.auth.me().catch(() => null);
    if (me) {
      const profiles = await base44.entities.UserProfile.filter({ created_by: me.email });
      setProfile(profiles[0] || null);
    }
    const storedDark = localStorage.getItem("slabdex_dark");
    const isDark = storedDark !== null ? storedDark === "true" : true;
    document.documentElement.classList.toggle("dark", isDark);
    setDarkMode(isDark);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const isPro = profile?.subscription_tier && profile.subscription_tier !== "free";

  const toggleDark = (val) => {
    setDarkMode(val);
    document.documentElement.classList.toggle("dark", val);
    localStorage.setItem("slabdex_dark", String(val));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {showSubscription && (
      <SubscriptionModal
        onClose={() => setShowSubscription(false)}
        onSubscribe={async (plan) => {
          // Grant pro access by updating the user profile
          if (profile) {
            await base44.entities.UserProfile.update(profile.id, { subscription_tier: plan });
          } else if (user) {
            await base44.entities.UserProfile.create({ subscription_tier: plan, scans_used: 0, scans_limit: 999 });
          }
          await loadProfile();
          setShowSubscription(false);
        }}
        currentTier={profile?.subscription_tier || "free"}
        scansUsed={profile?.scans_used || 0}
        scansLimit={profile?.scans_limit || 10}
      />
      )}

      <div className="h-6" />

      <div className="px-6 pb-32 space-y-6">
        {/* Subscription */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Subscription</p>
          <button
            onClick={() => setShowSubscription(true)}
            className="w-full flex items-center justify-between bg-[rgb(41,41,41)] rounded-2xl p-5 hover:opacity-90"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5" />
              <div className="text-left">
                <p className="font-bold">SlabDex Pro</p>
                <p className="text-xs opacity-60">Unlimited scans · Advanced analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-background/40 px-2 py-1 rounded-lg">
                  {isPro ? "PRO ✓" : "FREE"}
                </span>
              {!isPro && <ChevronRight className="w-4 h-4 opacity-60" />}
            </div>
          </button>
        </div>

        {/* Theme Selector */}
        <ThemeSelector isPro={!!isPro} isDark={darkMode} />

        {/* Preferences */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Preferences</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDark} />
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Price Alerts</span>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* About */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">About</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {[
              { icon: Shield, label: "Privacy Policy" },
              { icon: Info, label: "Terms of Service" },
              { icon: Info, label: "Version 1.0.0" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => base44.auth.logout()}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
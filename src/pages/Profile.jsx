import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Zap, BarChart2, Camera, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import GradeBadge from "@/components/shared/GradeBadge";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadProfile = async () => {
    const me = await base44.auth.me().catch(() => null);
    setUser(me);
    if (me) {
      const profiles = await base44.entities.UserProfile.filter({ created_by: me.email });
      setProfile(profiles[0] || null);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const isPro = profile?.subscription_tier && profile.subscription_tier !== "free";

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, { avatar_url: file_url });
    } else if (user) {
      await base44.entities.UserProfile.create({ avatar_url: file_url, scans_used: 0, scans_limit: 10 });
    }
    await loadProfile();
    setUploadingAvatar(false);
  };

  const { data: cards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: () => base44.entities.GradedCard.list(),
  });

  const totalValue = cards.reduce((sum, c) => sum + (c.estimated_value || 0), 0);
  const totalGraded = cards.filter(c => c.grading_company).length;
  const topCard = [...cards].sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))[0];

  const initials = user
    ? (user.full_name || user.email || "?")[0].toUpperCase()
    : "?";

  const displayName = user?.full_name || "Collector";

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {showSubscription && (
        <SubscriptionModal
          onClose={() => setShowSubscription(false)}
          onSubscribe={async (plan) => {
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

      {/* Header / Profile Info */}
      <div className="px-5 pt-14 pb-5 space-y-5">
        {/* Avatar + Name */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1">
            <label className="cursor-pointer relative group">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center text-2xl font-black text-white overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  initials
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </label>
            <span className="text-xs text-zinc-400">Edit</span>
          </div>
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold">{displayName}</span>
              {isPro && (
                <span className="bg-yellow-400 text-black text-xs font-black px-2 py-0.5 rounded">PRO</span>
              )}
              <Pencil className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-400 mt-0.5">{user?.email || ""}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Total Cards", value: cards.length },
            { label: "Total Sealed", value: 0 },
            { label: "Total Graded", value: totalGraded },
            { label: "Total Value", value: `$${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, green: true },
          ].map(({ label, value, green }) => (
            <div key={label} className="flex flex-col">
              <span className="text-[11px] text-zinc-400">{label}</span>
              <span className={`text-base font-black ${green ? "text-green-400" : "text-white"}`}>{value}</span>
            </div>
          ))}
        </div>


      </div>

      {/* Tabs */}
      <div className="px-5 pb-4">
        <div className="flex bg-zinc-800 rounded-2xl p-1 gap-1">
          {["stats", "settings", "support"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? "bg-zinc-600 text-white" : "text-zinc-400"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-5 pb-32 space-y-4">
        {activeTab === "stats" && (
          <>
            {/* Top card */}
            {topCard && (
              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-xs text-zinc-400 uppercase tracking-widest mb-3">Top Card</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{topCard.card_name}</p>
                    {(topCard.set_name || topCard.card_number) && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {[topCard.set_name, topCard.card_number].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <div className="mt-1">
                      <GradeBadge company={topCard.grading_company} grade={topCard.grade} size="sm" />
                    </div>
                  </div>
                  <p className="font-black text-lg">
                    {topCard.estimated_value ? `$${Number(topCard.estimated_value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Portfolio section */}
            <div>
              <p className="text-lg font-bold mb-3">
                Portfolio: <span className="text-green-400">Main</span>
              </p>
              <div className="bg-zinc-900 rounded-2xl p-4">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Cards", value: cards.length },
                    { label: "Sealed", value: 0 },
                    { label: "Graded", value: totalGraded },
                    { label: "Value", value: `$${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, green: true },
                  ].map(({ label, value, green }) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-xs text-zinc-400 mb-1">{label}</span>
                      <span className={`text-base font-black ${green ? "text-green-400" : "text-white"}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>


          </>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            {/* Subscription */}
            <button
              onClick={() => setShowSubscription(true)}
              className="w-full flex items-center justify-between bg-zinc-900 rounded-2xl p-5 hover:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <div className="text-left">
                  <p className="font-bold">SlabDex Pro</p>
                  <p className="text-xs text-zinc-400">Unlimited scans · Advanced analytics</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-zinc-700 px-2 py-1 rounded-lg">
                {isPro ? "PRO ✓" : "FREE"}
              </span>
            </button>

            {/* Sign out */}
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl text-red-400 border-red-400/30 hover:bg-red-400/10"
              onClick={() => base44.auth.logout()}
            >
              Sign Out
            </Button>
          </div>
        )}

        {activeTab === "support" && (
          <div className="space-y-3">
            {[
              { label: "Privacy Policy" },
              { label: "Terms of Service" },
              { label: "Contact Support" },
              { label: "Version 1.0.0" },
            ].map(({ label }) => (
              <div key={label} className="bg-zinc-900 rounded-2xl px-5 py-4">
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
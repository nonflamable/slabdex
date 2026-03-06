import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, Package, Search, Settings, User } from "lucide-react";

const NAV_ITEMS = [
  { page: "Scan", icon: Camera, label: "Scan" },
  { page: "Collection", icon: Package, label: "Collection" },
  { page: "Search", icon: Search, label: "Search" },
  { page: "Settings", icon: Settings, label: "Settings" },
  { page: "Profile", icon: User, label: "Profile" },
  { page: "AIGrader", icon: Camera, label: "AI Grader" },
];

export default function Layout({ children, currentPageName }) {
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("slabdex_dark")) {
      localStorage.setItem("slabdex_dark", "true");
    }
    const isDark = localStorage.getItem("slabdex_dark") !== "false";
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => setIsPageLoading(false), 300);
    return () => clearTimeout(timer);
  }, [currentPageName]);

  return (
    <div className="min-h-screen bg-background">
      {isPageLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="pb-24">
        {children}
      </main>

      {/* Tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <div className="flex items-center justify-around px-3 pb-8 pt-3 max-w-md mx-auto">
          <div className="flex items-center justify-around w-full bg-zinc-900/95 backdrop-blur-xl rounded-2xl px-2 py-1 shadow-float">
            {NAV_ITEMS.map(({ page, icon: Icon, label }) => {
              const isActive = currentPageName === page;
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                    isActive ? "text-white" : "text-zinc-400"
                  } ${isActive ? "bg-zinc-600/60" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
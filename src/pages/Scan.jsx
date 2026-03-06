import { useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import CameraView from "@/components/scan/CameraView";
import ScanProcessing from "@/components/scan/ScanProcessing";
import CardConfirmation from "@/components/scan/CardConfirmation";
import PriceResult from "@/components/scan/PriceResult";
import AddToCollectionModal from "@/components/scan/AddToCollectionModal";
import ScanLimitPrompt from "@/components/scan/ScanLimitPrompt";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";

const SCAN_LIMIT_FREE = 5;
const STORAGE_KEY = "slabdex_daily_scans";

function getDailyScans() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return { count: 0, date: new Date().toDateString() };
  try {
    return JSON.parse(stored);
  } catch { return { count: 0, date: new Date().toDateString() }; }
}

function incrementDailyScans() {
  const { count, date } = getDailyScans();
  const today = new Date().toDateString();
  const newCount = date === today ? count + 1 : 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: newCount, date: today }));
  return newCount;
}

function getScansUsedToday() {
  const { count, date } = getDailyScans();
  if (date !== new Date().toDateString()) return 0;
  return count;
}

const SCAN_STATES = {
  IDLE: "idle",
  CAMERA: "camera",
  PROCESSING: "processing",
  CONFIRM: "confirm",
  RESULT: "result",
};

export default function Scan() {
  const [state, setState] = useState(SCAN_STATES.IDLE);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectedCard, setDetectedCard] = useState(null);
  const [confirmedCard, setConfirmedCard] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showLimitPrompt, setShowLimitPrompt] = useState(false);
  const [scansUsed, setScansUsed] = useState(getScansUsedToday());
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (!me) return;
      const profiles = await base44.entities.UserProfile.filter({ created_by: me.email });
      const profile = profiles[0];
      if (profile && profile.subscription_tier && profile.subscription_tier !== "free") {
        setIsPro(true);
      }
    }).catch(() => {}).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const isAtLimit = !isPro && scansUsed >= SCAN_LIMIT_FREE;

  const handleOpenCamera = () => {
    if (isAtLimit) {
      setShowLimitPrompt(true);
    } else {
      setState(SCAN_STATES.CAMERA);
    }
  };

  const handleCapture = useCallback(async (blob, imageUrl) => {
    setCapturedImage(imageUrl);
    setState(SCAN_STATES.PROCESSING);

    let uploadedUrl = imageUrl;
    if (blob) {
      const file = blob instanceof File ? blob : new File([blob], "scan.jpg", { type: "image/jpeg" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedUrl = file_url;
    }

    const detected = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this image of a graded Pokémon card slab. Extract:
      - card_name: The Pokémon card name
      - card_number: Card number (e.g. "4/102")
      - set_name: Set or series name
      - grading_company: PSA, BGS, CGC, SGC, HGA, or Other
      - grade: Numeric grade (e.g. "10", "9.5")
      - cert_number: Certification number if visible, else null
      - confidence: 0-1 confidence decimal`,
      file_urls: [uploadedUrl],
      response_json_schema: {
        type: "object",
        properties: {
          card_name: { type: "string" },
          card_number: { type: "string" },
          set_name: { type: "string" },
          grading_company: { type: "string" },
          grade: { type: "string" },
          cert_number: { type: "string" },
          confidence: { type: "number" }
        }
      }
    });

    setDetectedCard({ ...detected, image_url: uploadedUrl });
    setState(SCAN_STATES.CONFIRM);
  }, []);

  const handleConfirm = useCallback(async (cardData) => {
   setState(SCAN_STATES.PROCESSING);
   const { purchase_price, ...rest } = cardData;
   const card = { ...rest, image_url: detectedCard?.image_url, purchase_price };

   try {
     const result = await base44.functions.invoke('searchEbaySoldListings', {
       cardName: card.card_name,
       cardNumber: card.card_number,
       setName: card.set_name,
       grade: card.grade,
       gradingCompany: card.grading_company
     });

     const priceResult = result.data;
     const recentSales = priceResult?.recentSales || [];
     const estimatedValue = priceResult?.estimatedMarketFromSales?.averagePrice;

     // Increment daily scan counter
     const newCount = incrementDailyScans();
     setScansUsed(newCount);

     setConfirmedCard(card);
     setPriceData({
       recentSales: recentSales,
       activeListings: priceResult?.activeListings || [],
       estimatedMarketFromSales: priceResult?.estimatedMarketFromSales,
       estimatedMarketFromListings: priceResult?.estimatedMarketFromListings,
       dataSource: priceResult?.dataSource,
       estimated_value: estimatedValue,
       status: priceResult?.status || "no_data",
       card_image_url: null,
     });
     setState(SCAN_STATES.RESULT);
   } catch (error) {
     console.error('Error fetching price data:', error);
     setConfirmedCard(card);
     setPriceData({
       recentSales: [],
       activeListings: [],
       estimatedMarketFromSales: { lowestPrice: null, averagePrice: null, medianPrice: null },
       estimatedMarketFromListings: { lowestPrice: null, averagePrice: null, medianPrice: null },
       dataSource: 'ebay_sold_and_active',
       estimated_value: null,
       status: "error",
       card_image_url: null,
     });
     setState(SCAN_STATES.RESULT);
   }
  }, [detectedCard]);

  const handleAddToCollection = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleConfirmAdd = useCallback(async ({ purchase_price, purchase_date, purchase_marketplace }) => {
    setIsAdding(true);
    await base44.entities.GradedCard.create({
      ...confirmedCard,
      estimated_value: priceData?.estimated_value,
      ebay_recent_sales: priceData?.recentSales || [],
      ebay_active_listings: priceData?.activeListings || [],
      ebay_data_source: priceData?.dataSource,
      last_price_update: new Date().toISOString(),
      purchase_price: purchase_price ?? confirmedCard.purchase_price ?? null,
      purchase_date: purchase_date || null,
      purchase_marketplace: purchase_marketplace || null,
      image_url: confirmedCard.image_url,
    });
    setIsAdding(false);
    setShowAddModal(false);
    reset();
  }, [confirmedCard, priceData]);

  const reset = () => {
    setState(SCAN_STATES.IDLE);
    setCapturedImage(null);
    setDetectedCard(null);
    setPriceData(null);
    setConfirmedCard(null);
    setShowAddModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {state === SCAN_STATES.CAMERA && (
        <CameraView onCapture={handleCapture} onClose={reset} />
      )}
      {state === SCAN_STATES.PROCESSING && (
        <ScanProcessing imageUrl={capturedImage} />
      )}
      {state === SCAN_STATES.CONFIRM && detectedCard && (
        <CardConfirmation
          detectedCard={detectedCard}
          imageUrl={detectedCard.image_url || capturedImage}
          onConfirm={handleConfirm}
          onRetry={reset}
        />
      )}
      {state === SCAN_STATES.RESULT && confirmedCard && priceData && !showAddModal && (
        <PriceResult
          card={{ ...confirmedCard }}
          priceData={priceData}
          onAddToCollection={handleAddToCollection}
          onScanAnother={reset}
          isAdding={isAdding}
        />
      )}
      {showAddModal && confirmedCard && (
        <AddToCollectionModal
          card={confirmedCard}
          priceData={priceData}
          onConfirm={handleConfirmAdd}
          onCancel={() => setShowAddModal(false)}
          isLoading={isAdding}
        />
      )}
      {showLimitPrompt && (
        <ScanLimitPrompt
          scansUsed={scansUsed}
          scansLimit={SCAN_LIMIT_FREE}
          onClose={() => setShowLimitPrompt(false)}
          onUpgrade={() => { setShowLimitPrompt(false); setShowSubscription(true); }}
        />
      )}
      {showSubscription && (
        <SubscriptionModal
          onClose={() => setShowSubscription(false)}
          onSubscribe={() => setShowSubscription(false)}
          currentTier="free"
          scansUsed={scansUsed}
          scansLimit={SCAN_LIMIT_FREE}
        />
      )}

      {state === SCAN_STATES.IDLE && (
        <div
          className="flex-1 flex flex-col min-h-screen cursor-pointer"
          onClick={isAtLimit ? () => setShowLimitPrompt(true) : () => setState(SCAN_STATES.CAMERA)}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="h-0" />

          <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center">
                <Camera className="w-8 h-8 text-background" />
              </div>
              <span className="text-sm text-muted-foreground">
                {isAtLimit ? "Daily limit reached" : "Tap to scan"}
              </span>
            </div>
          </div>

          {!isPro && scansUsed > 0 && state === SCAN_STATES.IDLE && (
            <div className="px-6 pb-8" onClick={e => e.stopPropagation()}>
              <div className="bg-muted rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Free Scans</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{scansUsed} of {SCAN_LIMIT_FREE} used today</p>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden mt-2 w-32">
                    <div
                      className={`h-full rounded-full ${scansUsed >= SCAN_LIMIT_FREE ? "bg-destructive" : "bg-foreground"}`}
                      style={{ width: `${Math.min((scansUsed / SCAN_LIMIT_FREE) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setShowSubscription(true); }} className="rounded-xl">
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Upgrade
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { useRef, useState, useEffect, useCallback } from "react";
import { X, Zap, ImageIcon, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

// Tunable thresholds
const DETECTION_THRESHOLDS = {
  minConfidence: 70,
  maxPerspectiveSkew: 30,
  maxTiltAngle: 8,
  minBlurScore: 65,
  maxGlareScore: 40,
  minCardCoverage: 25,
  minAspectRatioMatch: 80,
  captureReadyDuration: 800 // ms
};

export default function CameraView({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [flashActive, setFlashActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cardCorners, setCardCorners] = useState(null);
  const [borderColor, setBorderColor] = useState("red");
  const [readyToCapture, setReadyToCapture] = useState(false);
  const readyTimerRef = useRef(null);
  const lastDetectionRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;
    
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);
    
    try {
      const imageUrl = canvas.toDataURL("image/jpeg", 0.7);
      
      // Call the backend function for detailed card detection
      const response = await base44.functions.invoke('detectCardCorners', { imageUrl });
      const data = response.data;
      
      // Check if card is detected and meets confidence threshold
      if (data?.detected && data.confidence >= DETECTION_THRESHOLDS.minConfidence) {
        const corners = data.corners;
        if (Array.isArray(corners) && corners.length === 4) {
          setCardCorners(corners);
          
          // Determine border color based on capture-readiness
          const passConfidence = data.confidence >= DETECTION_THRESHOLDS.minConfidence;
          const passPerspective = data.perspective_score >= (100 - DETECTION_THRESHOLDS.maxPerspectiveSkew);
          const passTilt = Math.abs(data.tilt_angle) <= DETECTION_THRESHOLDS.maxTiltAngle;
          const passBlur = data.blur_score >= DETECTION_THRESHOLDS.minBlurScore;
          const passGlare = data.glare_score <= DETECTION_THRESHOLDS.maxGlareScore;
          const passCoverage = data.card_coverage >= DETECTION_THRESHOLDS.minCardCoverage;
          const passAspectRatio = data.aspect_ratio_match >= DETECTION_THRESHOLDS.minAspectRatioMatch;
          
          const isFullyCaptureReady = passConfidence && passPerspective && passTilt && passBlur && passGlare && passCoverage && passAspectRatio;
          const isPartiallyReady = passConfidence && passCoverage && (passTilt || passPerspective);
          
          // Temporal smoothing - only update color if threshold is met
          lastDetectionRef.current = {
            corners,
            quality: {
              confidence: data.confidence,
              perspective: data.perspective_score,
              tilt: data.tilt_angle,
              blur: data.blur_score,
              glare: data.glare_score,
              coverage: data.card_coverage,
              aspectRatio: data.aspect_ratio_match
            },
            isFullyCaptureReady
          };
          
          if (isFullyCaptureReady) {
            setBorderColor("green");
            // Start/reset ready timer
            if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
            readyTimerRef.current = setTimeout(() => {
              setReadyToCapture(true);
            }, DETECTION_THRESHOLDS.captureReadyDuration);
          } else if (isPartiallyReady) {
            setBorderColor("yellow");
            setReadyToCapture(false);
            if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
          } else {
            setBorderColor("red");
            setReadyToCapture(false);
            if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
          }
        } else {
          setCardCorners(null);
          setReadyToCapture(false);
          setBorderColor("red");
        }
      } else {
        // No valid card detected
        setCardCorners(null);
        setReadyToCapture(false);
        setBorderColor("red");
      }
    } catch (err) {
      setCardCorners(null);
      setReadyToCapture(false);
      setBorderColor("red");
    }
  }, [isStreaming]);

  useEffect(() => {
    startCamera();
    
    // Periodic frame analysis for card detection (every 1 second)
    const analysisInterval = setInterval(() => {
      analyzeFrame();
    }, 1000);
    
    return () => {
      clearInterval(analysisInterval);
      if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
    };
  }, [startCamera, analyzeFrame]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setTorchOn(false);
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const newState = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: newState }] });
      setTorchOn(newState);
    } catch {
      // Torch not supported
    }
  }, [torchOn]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      stopCamera();
      onCapture(blob);
    }, "image/jpeg", 0.9);
  }, [onCapture, stopCamera]);

  // Auto-capture when card is ready
  useEffect(() => {
    if (readyToCapture && isStreaming) {
      const autoCapture = setTimeout(() => {
        capture();
      }, 1000);
      return () => clearTimeout(autoCapture);
    }
  }, [readyToCapture, isStreaming, capture]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onCapture(file);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-14 pb-4 z-10 relative">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </Button>
        <span className="text-white font-semibold tracking-tight">Grade Card</span>
        <div className="w-10" />
      </div>

      {/* Camera viewfinder */}
      <div className="absolute inset-0 overflow-hidden">
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
            <p className="text-red-400 text-center text-sm">{error}</p>
          </div>
        )}

        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!isStreaming ? "hidden" : ""}`}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Card corner border overlay */}
        {isStreaming && cardCorners && borderColor !== "red" && (
          <>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ aspectRatio: 'auto' }}>
              <defs>
                <filter id={`glow-${borderColor}`}>
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Draw polygon connecting the 4 corners */}
              <polygon
                points={cardCorners
                  .map(([x, y]) => `${x * (videoRef.current?.offsetWidth || 1)},${y * (videoRef.current?.offsetHeight || 1)}`)
                  .join(" ")}
                fill="none"
                strokeWidth="4"
                stroke={borderColor === "green" ? "#4ade80" : "#facc15"}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#glow-${borderColor})`}
                style={{ transition: 'stroke 300ms ease-out' }}
              />
              
              {/* Draw corner circles */}
              {cardCorners.map((corner, idx) => (
                <circle
                  key={idx}
                  cx={corner[0] * (videoRef.current?.offsetWidth || 1)}
                  cy={corner[1] * (videoRef.current?.offsetHeight || 1)}
                  r="8"
                  fill={borderColor === "green" ? "#4ade80" : "#facc15"}
                  opacity="0.8"
                />
              ))}
            </svg>
            
            {/* Status message - only show when ready */}
            {readyToCapture && (
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 pointer-events-none">
                <div className="bg-green-500/30 border-2 border-green-400 rounded-full px-8 py-3 backdrop-blur-md animate-pulse">
                  <p className="text-green-300 font-semibold text-center text-sm tracking-wide">
                    Hold steady — ready to capture
                  </p>
                </div>
              </div>
            )}
            
            {/* Quality feedback - show when yellow */}
            {borderColor === "yellow" && lastDetectionRef.current && (
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 pointer-events-none text-center">
                <p className="text-xs font-medium text-yellow-300 bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  {lastDetectionRef.current.quality.blur < DETECTION_THRESHOLDS.minBlurScore
                    ? "Keep steady – card blur"
                    : lastDetectionRef.current.quality.glare > DETECTION_THRESHOLDS.maxGlareScore
                    ? "Reduce glare/reflection"
                    : lastDetectionRef.current.quality.tilt > DETECTION_THRESHOLDS.maxTiltAngle
                    ? "Straighten the card"
                    : lastDetectionRef.current.quality.perspective < (100 - DETECTION_THRESHOLDS.maxPerspectiveSkew)
                    ? "Adjust angle to 90°"
                    : "Better alignment needed"}
                </p>
              </div>
            )}
          </>
        )}

        {/* Flash overlay */}
        {flashActive && <div className="absolute inset-0 bg-white z-20" />}

        {/* Help text when no card detected */}
        {isStreaming && !cardCorners && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-white/60 text-sm tracking-widest uppercase">
              Position card in frame
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8 px-8 py-10 pb-16 z-10">
        {/* Upload from library */}
        <label className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20">
          <ImageIcon className="w-6 h-6 text-white" />
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>

        {/* Capture button */}
        {isStreaming && (
          <button
            onClick={capture}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-float hover:scale-95 active:scale-90"
          >
            <div className="w-16 h-16 rounded-full border-4 border-black/10 bg-white" />
          </button>
        )}

        {/* Torch button */}
        {isStreaming ? (
          <button
            onClick={toggleTorch}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${torchOn ? "bg-yellow-400" : "bg-white/10 hover:bg-white/20"}`}
          >
            {torchOn ? <Zap className="w-6 h-6 text-black" /> : <ZapOff className="w-6 h-6 text-white" />}
          </button>
        ) : (
          <div className="w-14 h-14" />
        )}
      </div>
    </div>
  );
}
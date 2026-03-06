import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, Zap, ImageIcon, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CameraView({ onCapture, onClose, showTiltMeter = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [flashActive, setFlashActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isLevel, setIsLevel] = useState(false);

  // Start camera on mount
  const startCameraRef = useRef(() => {});

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

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    
    // Get device orientation for tilt meter
    const handleOrientation = (event) => {
      const alpha = event.alpha || 0; // z axis rotation
      const beta = event.beta || 0;   // x axis rotation
      const gamma = event.gamma || 0; // y axis rotation
      
      setTilt({ x: beta, y: gamma });
      // Check if device is roughly level (within 10 degrees)
      setIsLevel(Math.abs(beta) < 10 && Math.abs(gamma) < 10);
    };
    
    window.addEventListener("deviceorientation", handleOrientation);
    
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [startCamera]);

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
      // Torch not supported on this device
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
      onCapture(blob, canvas.toDataURL("image/jpeg", 0.9));
    }, "image/jpeg", 0.9);
  }, [onCapture, stopCamera]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onCapture(file, url);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-14 pb-4 z-10 relative">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </Button>
        <span className="text-white font-semibold tracking-tight">Scan Card</span>
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

        {/* Flash overlay */}
        {flashActive && <div className="absolute inset-0 bg-white z-20" />}

        {/* Tilt meter */}
        {isStreaming && showTiltMeter && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
            <div className="w-24 h-24 rounded-full border-2 border-white/40 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center relative">
                {/* Level indicator dot */}
                <div
                  className={`w-3 h-3 rounded-full transition-all ${isLevel ? "bg-green-400" : "bg-red-400"}`}
                  style={{
                    transform: `translate(${tilt.y * 0.8}px, ${tilt.x * 0.8}px)`,
                  }}
                />
                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-px h-4 bg-white/40" />
                  <div className="w-4 h-px bg-white/40" />
                </div>
              </div>
            </div>
            <span className={`text-xs font-semibold tracking-widest transition-colors ${isLevel ? "text-green-400" : "text-red-400"}`}>
              {isLevel ? "LEVEL" : "TILT PHONE"}
            </span>
          </div>
        )}

        {/* Scanning frame */}
        {isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-72 h-96">
              {/* Scan line */}
              <div className="scan-line absolute left-2 right-2 top-4 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            </div>
            <div className="absolute bottom-4 text-white/60 text-xs tracking-widest uppercase">
              Position card within frame
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
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function ScanProcessing({ imageUrl }) {
  const steps = ["Reading card text...", "Identifying set & number...", "Detecting grade...", "Matching database..."];

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center px-8">
      {/* Card preview */}
      {imageUrl && (
        <div className="w-48 h-64 rounded-2xl overflow-hidden mb-10 shadow-float relative">
          <img src={imageUrl} alt="Scanning" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Scan sweep */}
          <div className="scan-line absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg">Analyzing Card</span>
      </div>

      {/* Animated steps */}
      <div className="space-y-3 w-full max-w-xs">
        {steps.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.6, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.6 + 0.2 }}
              className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.6 + 0.4 }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            </motion.div>
            <span className="text-sm text-muted-foreground">{step}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
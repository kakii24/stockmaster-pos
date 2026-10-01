import React, { useState, useEffect } from 'react';
import { Barcode, CheckCircle } from 'lucide-react';

interface ScannerBufferProps {
  lastScanned?: string;
  isScanning?: boolean;
}

export const ScannerBuffer: React.FC<ScannerBufferProps> = ({ lastScanned, isScanning }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastScanned) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [lastScanned]);

  if (!visible && !isScanning) return null;

  return (
    <div className="fixed bottom-10 right-10 z-40 bg-slate-900 border border-emerald-500/70 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
        <Barcode className="w-5 h-5 animate-pulse" />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          Code-barres Scanné
        </p>
        <p className="text-sm font-mono font-bold text-emerald-300">{lastScanned}</p>
      </div>
      <CheckCircle className="w-4 h-4 text-emerald-400 ml-2" />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Wifi, Clock, Database, Printer, DollarSign } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { formatCurrency, formatDateTime } from '../../lib/formatters';

export const Statusbar: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>('');
  const { settings } = usePosStore();

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(formatDateTime(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="h-7 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 shrink-0 select-none">
      {/* Left status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Wifi className="w-3.5 h-3.5" />
          <span className="font-semibold">Système Hors-Ligne Prêt</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>SQLite WAL</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span className="capitalize">{settings.printer_type.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Right status */}
      <div className="flex items-center gap-5 font-mono">
        <div className="flex items-center gap-1 text-slate-300">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Devise : {settings.currency}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{timeStr}</span>
        </div>
      </div>
    </footer>
  );
};

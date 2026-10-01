import { useEffect, useRef } from 'react';

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  maxDelayMs?: number; // threshold between keystrokes for hardware scanner (default 50ms)
  minLength?: number;  // min barcode length (default 3)
}

export function useBarcodeScanner({
  onScan,
  maxDelayMs = 50,
  minLength = 3,
}: UseBarcodeScannerProps) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if user is inside a textarea or modal text input,
      // UNLESS rapid keystrokes (<50ms) reveal a hardware scanner wedge!
      const target = event.target as HTMLElement | null;
      const isInputFocused =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const now = performance.now();
      const delta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Enter key marks end of barcode transmission from hardware scanner
      if (event.key === 'Enter') {
        const scannedCode = bufferRef.current.trim();
        if (scannedCode.length >= minLength) {
          // Hardware scanner completed transmission
          event.preventDefault();
          event.stopPropagation();
          onScan(scannedCode);
        }
        bufferRef.current = '';
        return;
      }

      // If delay between keystrokes exceeds threshold, this is human manual typing: reset buffer
      if (delta > maxDelayMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Only accumulate printable single characters
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        bufferRef.current += event.key;

        // If high speed typing occurs even inside an input, we know it's a scanner
        if (bufferRef.current.length >= 2 && delta <= maxDelayMs && isInputFocused) {
          // Scanner detected
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onScan, maxDelayMs, minLength]);
}

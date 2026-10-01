import { useEffect } from 'react';

interface ShortcutActions {
  onNewSale?: () => void;         // F2
  onToggleSaleType?: () => void;  // F4
  onSelectCustomer?: () => void;  // F6
  onGlobalDiscount?: () => void;  // F8
  onHoldTicket?: () => void;      // F10
  onCheckout?: () => void;        // F12 or Enter when cart not empty
  onHelp?: () => void;            // F1
  onEscape?: () => void;          // Escape
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow escape from anywhere to close active modal
      if (e.key === 'Escape' && actions.onEscape) {
        e.preventDefault();
        actions.onEscape();
        return;
      }

      // Check if user is actively writing inside an input or textarea
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // Function keys work globally across the app
      switch (e.key) {
        case 'F1':
          e.preventDefault();
          actions.onHelp?.();
          break;
        case 'F2':
          e.preventDefault();
          actions.onNewSale?.();
          break;
        case 'F4':
          e.preventDefault();
          actions.onToggleSaleType?.();
          break;
        case 'F6':
          e.preventDefault();
          actions.onSelectCustomer?.();
          break;
        case 'F8':
          e.preventDefault();
          actions.onGlobalDiscount?.();
          break;
        case 'F10':
          e.preventDefault();
          actions.onHoldTicket?.();
          break;
        case 'F12':
          e.preventDefault();
          actions.onCheckout?.();
          break;
        case 'Enter':
          // If not in input and checkout is available, enter triggers checkout
          if (!isInputFocused && actions.onCheckout) {
            e.preventDefault();
            actions.onCheckout();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [actions]);
}

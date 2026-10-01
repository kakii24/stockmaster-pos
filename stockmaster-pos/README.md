# StockMaster POS (Gestion de Stock & Point de Vente)

> **Application Desktop Haute Performance & Offline-First de Gestion Commerciale, de Caisse et de Stock**  
> Conçue pour le commerce de détail et de demi-gros / gros sur les marchés francophones et maghrébins (support natif DZD/EUR, HT, TVA, TTC, Timbre fiscal algérien optionnel).

---

## 1. Technologies & Architecture

- **Moteur Desktop Native :** **Tauri v2** (Rust) — consommation mémoire ultra-faible (< 60 Mo RAM), démarrage instantané, sécurité native.
- **Base de Données Locale :** **SQLite embarqué** avec mode **WAL (Write-Ahead Logging)** pour des écritures transactionnelles concurrentes à haute vitesse sans blocage de l'interface.
- **Frontend :** **React 18 + TypeScript + Vite**.
- **Gestion d'État & Caching :** **Zustand** (panier, caisse, raccourcis, sessions) + **TanStack Query (React Query)** (catalogue produits, valorisation de stock, clients).
- **Interface & Thème :** **Tailwind CSS + Lucide Icons** — thème sombre haute lisibilité adapté aux environnements de caisse, contraste optimal.
- **Intégrations Matérielles :**
  - **Douchette / Lecteur Code-Barres :** Hook d'interception globale (< 50ms par frappe se terminant par Entrée).
  - **Imprimantes Tickets Thermiques :** Générateur de flux d'octets **ESC/POS** natif (formats 80mm et 58mm, tiroir-caisse, découpe papier, encodage CP858 pour accents français).
  - **Facturation A4 :** Modèle légal de Facture / Bon de livraison prêt pour impression physique ou export PDF.

---

## 2. Structure du Projet

```text
stockmaster-pos/
├── src-tauri/                 # Cœur Desktop Rust (Tauri v2)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Schéma SQLite initial + Données de démonstration
│   └── src/
│       ├── main.rs            # Point d'entrée de l'application Tauri
│       ├── db/                # Connexion WAL et exécution des migrations
│       ├── commands/          # Commandes IPC (produits, ventes, stock, clients, impression)
│       ├── hardware/          # Moteur ESC/POS et scanner série
│       └── models/            # Structures Rust fortement typées (Serde)
├── src/                       # Interface Utilisateur React 18 + TypeScript
│   ├── api/                   # Pont IPC Tauri avec fallback automatique navigateur
│   ├── components/
│   │   ├── common/            # Modal, Input, Badge, ConfirmDialog
│   │   ├── layout/            # Sidebar, Header, Statusbar
│   │   ├── pos/               # Cart, QuickGrid, PaymentModal, ReceiptModal, A4InvoiceModal
│   │   ├── inventory/         # StockTable, ProductModal, MovementModal, LowStockAlert
│   │   └── reports/           # TurnoverChart, MarginReport, CashDrawer
│   ├── hooks/                 # useBarcodeScanner, useCart, useKeyboardShortcuts
│   ├── lib/                   # formatters (fr-FR, DZD/EUR, timbre fiscal), escpos-builder
│   ├── store/                 # posStore, authStore (Zustand)
│   ├── types/                 # Interfaces TypeScript
│   ├── App.tsx                # Composant racine orchestrateur
│   └── main.tsx               # Point d'entrée React
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 3. Raccourcis Clavier Caisse

L'application est utilisable à 100% au clavier et avec une douchette code-barres :

| Raccourci | Action |
|---|---|
| **Scan Douchette** | Ajout instantané de l'article au panier sans nécessiter de clic préalable |
| **`[F1]`** | Afficher l'aide des raccourcis clavier |
| **`[F2]`** | Vider le panier / Démarrer une nouvelle vente |
| **`[F4]`** | Basculer entre le tarif **Détail** et le tarif de **Gros** |
| **`[F6]`** | Rechercher et sélectionner un client (avec suivi des créances) |
| **`[F8]`** | Appliquer une remise globale (en montant ou %) |
| **`[F10]`** | Mettre le ticket en attente |
| **`[F12]`** ou **`[Entrée]`** | Ouvrir la fenêtre d'encaissement / paiement |
| **`[Échap]`** | Fermer n'importe quelle fenêtre modale ouverte |

---

## 4. Démarrage Rapide

### Mode Développement Web (Aperçu Navigateur Instantané)
Pour tester immédiatement l'interface avec la base de données de démonstration :
```bash
npm run dev
```
L'application se lance sur `http://localhost:5173`.

### Compilation & Lancement Desktop (Tauri v2)
Pour lancer l'application en mode Desktop natif Windows :
```bash
npm run tauri dev
```

Pour créer l'exécutable d'installation (`.msi` / `.exe`) :
```bash
npm run tauri build
```

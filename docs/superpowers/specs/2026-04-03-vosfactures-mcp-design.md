# Design : vosfactures-mcp

**Date** : 2026-04-03  
**Statut** : Approuvé

---

## Objectif

Créer un serveur MCP (Model Context Protocol) en TypeScript/Node.js qui expose l'ensemble de l'API REST VosFactures comme outils utilisables par un LLM (Claude). Le serveur est conçu pour être publié sur GitHub et facilement configurable via deux variables d'environnement.

---

## Configuration

Deux variables d'environnement requises au démarrage :

| Variable | Description | Exemple |
|---|---|---|
| `VOSFACTURES_API_TOKEN` | Token API trouvable dans Paramètres > Intégration | `qCedKxkTgQhGJpiI2SU` |
| `VOSFACTURES_URL` | URL du compte VosFactures | `https://moncompte.vosfactures.fr` |

Le serveur plante proprement au démarrage si l'une des deux est absente, avec un message explicite en français.

---

## Structure du projet

```
vosfactures-mcp/
├── src/
│   ├── index.ts              # Point d'entrée : init serveur MCP, enregistrement des tools
│   ├── client.ts             # Client HTTP centralisé (fetch + injection api_token + URL de base)
│   ├── types.ts              # Types TypeScript partagés (Document, Client, Produit, etc.)
│   └── tools/
│       ├── documents.ts      # Tous types de documents (factures, devis, avoirs, bons de commande, etc.)
│       ├── clients.ts        # Gestion des contacts clients/fournisseurs
│       ├── produits.ts       # Catalogue produits/services
│       ├── paiements.ts      # Suivi des paiements
│       ├── departements.ts   # Entités/départements
│       ├── recurrences.ts    # Factures récurrentes
│       └── stock.ts          # Documents stock et entrepôts
├── docs/
│   └── superpowers/specs/
│       └── 2026-04-03-vosfactures-mcp-design.md
├── API_README.md             # Documentation complète de l'API VosFactures (référence)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Client HTTP (`client.ts`)

Classe `VosFacturesClient` qui :
- Injecte automatiquement `api_token` sur chaque requête
- Construit l'URL complète à partir de `VOSFACTURES_URL`
- Expose des méthodes `get`, `post`, `put`, `delete` typées
- Retourne des erreurs structurées avec message en français

---

## Outils MCP

Tous les noms d'outils, descriptions et messages d'erreur sont **en français**.

### Documents (`/invoices.json`)

Un seul endpoint API gère tous les types de documents via le champ `kind`. Les outils acceptent un paramètre `type_document` avec l'enum complet :

| Valeur | Type de document |
|---|---|
| `vat` | Facture |
| `estimate` | Devis |
| `correction` | Avoir |
| `advance` | Facture d'acompte |
| `final` | Facture de solde |
| `receipt` | Reçu |
| `proforma` | Facture proforma |
| `client_order` | Bon de commande client |
| `maintenance_request` | Demande de maintenance |
| `payment_receipt` | Reçu de paiement |
| `kp` | Entrée caisse |
| `kw` | Sortie caisse |
| `invoice_other` | Autre document comptable |

**Outils documents** :
- `lister_documents` — liste avec filtres (type, période, client, statut, pagination)
- `obtenir_document` — détail d'un document par ID
- `creer_document` — création (type_document obligatoire)
- `modifier_document` — mise à jour partielle par ID
- `supprimer_document` — suppression par ID
- `envoyer_document_par_email` — envoi au client avec options (objet, message)
- `changer_statut_document` — change le statut (brouillon, envoyé, payé, annulé...)
- `telecharger_document_pdf` — retourne l'URL du PDF

### Clients (`/clients.json`)

- `lister_clients` — liste avec recherche (nom, email, numéro TVA)
- `obtenir_client` — détail par ID
- `creer_client` — création
- `modifier_client` — mise à jour par ID
- `supprimer_client` — suppression par ID
- `rechercher_client` — recherche par nom, email, SIRET, TVA

### Produits (`/products.json`)

- `lister_produits` — liste avec pagination
- `obtenir_produit` — détail par ID
- `creer_produit` — création
- `modifier_produit` — mise à jour par ID

### Paiements (`/payments.json`)

- `lister_paiements` — liste avec filtres
- `obtenir_paiement` — détail par ID
- `ajouter_paiement` — enregistrement d'un paiement lié à une facture
- `modifier_paiement` — mise à jour par ID
- `supprimer_paiement` — suppression par ID

### Départements (`/departments.json`)

- `lister_departements` — liste des entités
- `obtenir_departement` — détail par ID
- `creer_departement` — création
- `modifier_departement` — mise à jour par ID
- `supprimer_departement` — suppression par ID

### Récurrences (`/recurrings.json`)

- `lister_recurrences` — liste des factures récurrentes
- `creer_recurrence` — création avec fréquence (hebdo, mensuel, annuel)
- `modifier_recurrence` — mise à jour par ID

### Stock (`/warehouse_documents.json` + `/warehouses.json`)

- `lister_documents_stock` — liste (bons de livraison, entrées, sorties, transferts)
- `creer_document_stock` — création d'un mouvement de stock
- `lister_entrepots` — liste des entrepôts
- `creer_entrepot` — création d'un entrepôt

---

## Gestion des erreurs

- Messages d'erreur en français avec code HTTP
- Exemple : *"Document introuvable (404)"*, *"Token API invalide (401)"*, *"Données invalides (422) : le champ 'nom' est obligatoire"*
- Les erreurs de l'API sont propagées telles quelles quand elles contiennent un message utile
- Validation des variables d'env au démarrage avec message explicite

---

## Scripts npm

| Commande | Description |
|---|---|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run dev` | Mode watch avec `tsx watch` (test local sans recompile) |
| `npm start` | Lance `dist/index.js` |

---

## Configuration Claude Desktop

### Mode production (après build)

```json
{
  "mcpServers": {
    "vosfactures": {
      "command": "node",
      "args": ["/chemin/vers/vosfactures-mcp/dist/index.js"],
      "env": {
        "VOSFACTURES_API_TOKEN": "ton_token_ici",
        "VOSFACTURES_URL": "https://toncompte.vosfactures.fr"
      }
    }
  }
}
```

### Mode développement (avec tsx, sans build)

```json
{
  "mcpServers": {
    "vosfactures": {
      "command": "npx",
      "args": ["tsx", "/chemin/vers/vosfactures-mcp/src/index.ts"],
      "env": {
        "VOSFACTURES_API_TOKEN": "ton_token_ici",
        "VOSFACTURES_URL": "https://toncompte.vosfactures.fr"
      }
    }
  }
}
```

---

## Publication GitHub

- Dépôt public avec README détaillé listant explicitement tous les types de documents supportés
- `package.json` avec `bin` pointant vers `dist/index.js` pour support `npx`
- `API_README.md` inclus comme référence de la documentation officielle VosFactures

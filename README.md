# vosfactures-mcp

Serveur MCP (Model Context Protocol) pour l'API [VosFactures](https://vosfactures.fr).  
Permet à Claude et autres LLMs de gérer votre facturation directement depuis une conversation.

## Documents supportés

Factures · Devis · Avoirs · Factures d'acompte · Factures de solde · Factures proforma ·  
Bons de commande · Reçus · Entrées/sorties caisse · Demandes de maintenance · Bons de livraison

## Installation

### Prérequis
- Node.js 18+
- Un compte VosFactures avec token API

### Obtenir son token API
Paramètres → Intégration → Code d'autorisation API

### Cloner et installer
```bash
git clone https://github.com/verticka/vosfactures-mcp.git
cd vosfactures-mcp
npm install
```

## Configuration

### Claude Code (CLI) — recommandé

Ajouter dans `~/.claude.json` sous la clé `mcpServers` :

```json
{
  "mcpServers": {
    "vosfactures": {
      "command": "npx",
      "args": ["tsx", "/chemin/vers/vosfactures-mcp/src/index.ts"],
      "env": {
        "VOSFACTURES_API_TOKEN": "votre_token_api",
        "VOSFACTURES_URL": "https://votrecompte.vosfactures.fr"
      }
    }
  }
}
```

### Claude Desktop (macOS)

Ajouter dans `~/Library/Application Support/Claude/claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "vosfactures": {
      "command": "npx",
      "args": ["tsx", "/chemin/vers/vosfactures-mcp/src/index.ts"],
      "env": {
        "VOSFACTURES_API_TOKEN": "votre_token_api",
        "VOSFACTURES_URL": "https://votrecompte.vosfactures.fr"
      }
    }
  }
}
```

### Mode production (avec build)

Si vous préférez utiliser la version compilée (démarrage plus rapide) :

```bash
npm run build
```

Puis remplacer les `args` par :
```json
"args": ["/chemin/vers/vosfactures-mcp/dist/index.js"]
```
Et la `command` par `"node"`.

## Variables d'environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `VOSFACTURES_API_TOKEN` | Oui | Token API — Paramètres → Intégration → Code d'autorisation API |
| `VOSFACTURES_URL` | Oui | URL de votre compte (ex: `https://moncompte.vosfactures.fr`) |

## Outils disponibles (~45 outils)

Tous les outils, descriptions et messages d'erreur sont en français.

### Documents
| Outil | Description |
|-------|-------------|
| `lister_documents` | Liste les documents avec filtres (type, période, client, statut...) |
| `obtenir_document` | Détail complet d'un document par ID |
| `creer_document` | Crée facture, devis, avoir, bon de commande, proforma... |
| `modifier_document` | Modifie un document existant |
| `supprimer_document` | Supprime un document |
| `envoyer_document_par_email` | Envoie au client avec sujet et message personnalisés |
| `changer_statut_document` | Change le statut : émis, envoyé, payé, annulé... |
| `telecharger_document_pdf` | Retourne l'URL de téléchargement PDF |

Types de documents supportés via le paramètre `type_document` :

| Valeur | Type |
|--------|------|
| `vat` | Facture |
| `estimate` | Devis |
| `correction` | Avoir |
| `advance` | Facture d'acompte |
| `final` | Facture de solde |
| `proforma` | Facture proforma |
| `client_order` | Bon de commande client |
| `receipt` | Reçu |
| `payment_receipt` | Reçu de paiement |
| `kp` | Entrée caisse |
| `kw` | Sortie caisse |
| `maintenance_request` | Demande de maintenance |
| `invoice_other` | Autre document comptable |

### Clients
`lister_clients` · `obtenir_client` · `rechercher_client` (par nom, email, SIRET, TVA) · `creer_client` · `modifier_client` · `supprimer_client`

### Produits & Services
`lister_produits` · `obtenir_produit` · `creer_produit` · `modifier_produit`

### Paiements
`lister_paiements` · `obtenir_paiement` · `ajouter_paiement` · `modifier_paiement` · `supprimer_paiement`

### Départements (entités vendeurs)
`lister_departements` · `obtenir_departement` · `creer_departement` · `modifier_departement` · `supprimer_departement`

### Récurrences (factures automatiques)
`lister_recurrences` · `creer_recurrence` · `modifier_recurrence`

### Stock & Entrepôts
`lister_documents_stock` · `creer_document_stock` · `lister_entrepots` · `creer_entrepot`

## Exemples d'utilisation

> "Liste mes factures du mois en cours"  
> "Crée un devis pour Acme Corp, 3 jours de développement à 800€/jour"  
> "Envoie la facture 42 par email au client"  
> "Marque la facture 15 comme payée"  
> "Recherche le client Dupont"

## Licence

MIT

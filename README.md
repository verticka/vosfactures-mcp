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

### Depuis les sources
```bash
git clone https://github.com/verticka/vosfactures-mcp.git
cd vosfactures-mcp
npm install
npm run build
```

## Configuration Claude Desktop

Ajouter dans `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) :

### Mode production
```json
{
  "mcpServers": {
    "vosfactures": {
      "command": "node",
      "args": ["/chemin/vers/vosfactures-mcp/dist/index.js"],
      "env": {
        "VOSFACTURES_API_TOKEN": "votre_token_api",
        "VOSFACTURES_URL": "https://votrecompte.vosfactures.fr"
      }
    }
  }
}
```

### Mode développement (sans build)
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

## Outils disponibles (~45 outils)

### Documents
| Outil | Description |
|-------|-------------|
| `lister_documents` | Liste tous types de documents avec filtres |
| `obtenir_document` | Détail d'un document par ID |
| `creer_document` | Crée facture, devis, avoir, bon de commande... |
| `modifier_document` | Modifie un document existant |
| `supprimer_document` | Supprime un document |
| `envoyer_document_par_email` | Envoie au client par email |
| `changer_statut_document` | Change le statut (payé, envoyé...) |
| `telecharger_document_pdf` | URL du PDF |

### Clients
`lister_clients` · `obtenir_client` · `rechercher_client` · `creer_client` · `modifier_client` · `supprimer_client`

### Produits
`lister_produits` · `obtenir_produit` · `creer_produit` · `modifier_produit`

### Paiements
`lister_paiements` · `obtenir_paiement` · `ajouter_paiement` · `modifier_paiement` · `supprimer_paiement`

### Départements
`lister_departements` · `obtenir_departement` · `creer_departement` · `modifier_departement` · `supprimer_departement`

### Récurrences
`lister_recurrences` · `creer_recurrence` · `modifier_recurrence`

### Stock & Entrepôts
`lister_documents_stock` · `creer_document_stock` · `lister_entrepots` · `creer_entrepot`

## Variables d'environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `VOSFACTURES_API_TOKEN` | Oui | Token API VosFactures |
| `VOSFACTURES_URL` | Oui | URL de votre compte (ex: `https://moncompte.vosfactures.fr`) |

## Licence

MIT

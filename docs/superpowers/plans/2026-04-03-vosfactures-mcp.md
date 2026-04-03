# vosfactures-mcp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer un serveur MCP TypeScript/Node.js exposant l'intégralité de l'API VosFactures comme outils utilisables par un LLM.

**Architecture:** Un client HTTP centralisé (`client.ts`) injecte le token API sur chaque requête. Les outils sont regroupés par ressource dans `src/tools/`. Le point d'entrée `index.ts` enregistre tous les outils auprès du SDK MCP et démarre le serveur en mode stdio.

**Tech Stack:** TypeScript 5, `@modelcontextprotocol/sdk` 1.15.1, `zod` 3, `tsx` (dev), `vitest` (tests), Node.js 18+ (fetch natif)

---

## Fichiers à créer

```
vosfactures-mcp/
├── src/
│   ├── index.ts
│   ├── client.ts
│   ├── types.ts
│   └── tools/
│       ├── documents.ts
│       ├── clients.ts
│       ├── produits.ts
│       ├── paiements.ts
│       ├── departements.ts
│       ├── recurrences.ts
│       └── stock.ts
├── tests/
│   ├── client.test.ts
│   ├── tools/
│   │   ├── documents.test.ts
│   │   ├── clients.test.ts
│   │   ├── produits.test.ts
│   │   ├── paiements.test.ts
│   │   ├── departements.test.ts
│   │   ├── recurrences.test.ts
│   │   └── stock.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

### Task 1 : Initialisation du projet

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`

- [ ] **Étape 1 : Créer package.json**

```json
{
  "name": "vosfactures-mcp",
  "version": "1.0.0",
  "description": "Serveur MCP pour l'API VosFactures - factures, devis, clients, produits, paiements, stock",
  "license": "MIT",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "vosfactures-mcp": "dist/index.js"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc && shx chmod +x dist/index.js",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.15.1",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "@types/node": "^20.17.50",
    "shx": "^0.3.4",
    "tsx": "^4.19.4",
    "typescript": "^5.8.3",
    "vitest": "^1.6.1"
  },
  "keywords": ["mcp", "vosfactures", "facturation", "mcp-server", "modelcontextprotocol"]
}
```

- [ ] **Étape 2 : Créer tsconfig.json**

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "removeComments": true,
    "newLine": "lf"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Étape 3 : Créer vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Étape 4 : Installer les dépendances**

```bash
cd vosfactures-mcp
npm install
```

Résultat attendu : `node_modules/` créé, pas d'erreurs.

- [ ] **Étape 5 : Commit**

```bash
git add package.json tsconfig.json vitest.config.ts
git commit -m "feat: initialisation du projet TypeScript"
```

---

### Task 2 : Client HTTP (`src/client.ts`)

**Files:**
- Create: `src/client.ts`
- Create: `tests/client.test.ts`

- [ ] **Étape 1 : Écrire le test qui échoue**

```typescript
// tests/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../src/client.ts';

describe('VosFacturesClient', () => {
  const client = new VosFacturesClient('https://test.vosfactures.fr', 'mon_token');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('injecte le token dans les requêtes GET', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invoices: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await client.get('/invoices.json');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.vosfactures.fr/invoices.json?api_token=mon_token',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('lève une erreur française en cas de 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }));

    await expect(client.get('/invoices.json')).rejects.toThrow('Token API invalide (401)');
  });

  it('lève une erreur française en cas de 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    }));

    await expect(client.get('/invoices/999.json')).rejects.toThrow('Ressource introuvable (404)');
  });

  it('effectue un POST avec le body JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await client.post('/invoices.json', { invoice: { kind: 'vat' } });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.vosfactures.fr/invoices.json?api_token=mon_token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ invoice: { kind: 'vat' } }),
      })
    );
  });
});
```

- [ ] **Étape 2 : Vérifier que le test échoue**

```bash
npm test
```

Résultat attendu : `Cannot find module '../src/client.ts'`

- [ ] **Étape 3 : Implémenter `src/client.ts`**

```typescript
// src/client.ts

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const MESSAGES_ERREUR: Record<number, string> = {
  401: 'Token API invalide (401)',
  403: 'Accès refusé (403)',
  404: 'Ressource introuvable (404)',
  422: 'Données invalides (422)',
  500: 'Erreur serveur VosFactures (500)',
};

export class VosFacturesClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiToken: string
  ) {}

  private buildUrl(path: string, params: Record<string, string> = {}): string {
    const url = new URL(path, this.baseUrl);
    url.searchParams.set('api_token', this.apiToken);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private async request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const message = MESSAGES_ERREUR[response.status] ?? `Erreur inattendue (${response.status})`;
      let detail = '';
      try {
        const errBody = await response.json() as Record<string, unknown>;
        if (errBody?.message) detail = ` : ${errBody.message}`;
        else if (errBody?.error) detail = ` : ${errBody.error}`;
      } catch { /* pas de body JSON */ }
      throw new Error(message + detail);
    }

    return response.json() as Promise<T>;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export function creerClient(): VosFacturesClient {
  const token = process.env.VOSFACTURES_API_TOKEN;
  const url = process.env.VOSFACTURES_URL;

  if (!token) {
    throw new Error(
      'Variable d\'environnement VOSFACTURES_API_TOKEN manquante.\n' +
      'Trouvez votre token dans : Paramètres > Intégration > Code d\'autorisation API'
    );
  }
  if (!url) {
    throw new Error(
      'Variable d\'environnement VOSFACTURES_URL manquante.\n' +
      'Exemple : https://moncompte.vosfactures.fr'
    );
  }

  return new VosFacturesClient(url, token);
}
```

- [ ] **Étape 4 : Lancer les tests**

```bash
npm test
```

Résultat attendu : 4 tests passent en vert.

- [ ] **Étape 5 : Commit**

```bash
git add src/client.ts tests/client.test.ts
git commit -m "feat: client HTTP VosFactures avec gestion d'erreurs en français"
```

---

### Task 3 : Types partagés (`src/types.ts`)

**Files:**
- Create: `src/types.ts`

Pas de tests pour les types (ce sont des interfaces TypeScript sans logique).

- [ ] **Étape 1 : Créer `src/types.ts`**

```typescript
// src/types.ts

export type TypeDocument =
  | 'vat'
  | 'estimate'
  | 'correction'
  | 'advance'
  | 'final'
  | 'receipt'
  | 'proforma'
  | 'client_order'
  | 'maintenance_request'
  | 'payment_receipt'
  | 'kp'
  | 'kw'
  | 'invoice_other';

export const TYPES_DOCUMENT: Record<TypeDocument, string> = {
  vat: 'Facture',
  estimate: 'Devis',
  correction: 'Avoir',
  advance: "Facture d'acompte",
  final: 'Facture de solde',
  receipt: 'Reçu',
  proforma: 'Facture proforma',
  client_order: 'Bon de commande client',
  maintenance_request: 'Demande de maintenance',
  payment_receipt: 'Reçu de paiement',
  kp: 'Entrée caisse',
  kw: 'Sortie caisse',
  invoice_other: 'Autre document comptable',
};

export interface LigneDocument {
  name: string;
  tax: string;
  total_price_gross: string;
  total_price_net: string;
  quantity: string;
  unit_net_price: string;
}

export interface Document {
  id: number;
  kind: TypeDocument;
  number: string;
  sell_date: string;
  issue_date: string;
  payment_to: string;
  status: string;
  buyer_name: string;
  buyer_email: string;
  total_price_gross: string;
  currency: string;
  positions?: LigneDocument[];
  view_url?: string;
}

export interface Contact {
  id: number;
  name: string;
  shortcut?: string;
  email?: string;
  phone?: string;
  tax_no?: string;
  post_code?: string;
  city?: string;
  street?: string;
  country?: string;
  external_id?: string;
}

export interface Produit {
  id: number;
  name: string;
  code?: string;
  price_net: string;
  price_gross: string;
  tax: string;
  unit?: string;
  description?: string;
}

export interface Paiement {
  id: number;
  invoice_id: number;
  amount: string;
  paid_date: string;
  payment_type: string;
  comment?: string;
}

export interface Departement {
  id: number;
  name: string;
  shortcut?: string;
  tax_no?: string;
  city?: string;
  street?: string;
  post_code?: string;
  email?: string;
}

export interface Recurrence {
  id: number;
  name: string;
  invoice_id: number;
  period: string;
  period_units: string;
  start_date: string;
  end_date?: string;
  active: boolean;
}

export interface DocumentStock {
  id: number;
  kind: string;
  number: string;
  issue_date: string;
  warehouse_id?: number;
  description?: string;
}

export interface Entrepot {
  id: number;
  name: string;
  description?: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export function reponseOk(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

export function reponseErreur(message: string): ToolResult {
  return { content: [{ type: 'text', text: `Erreur : ${message}` }], isError: true };
}
```

- [ ] **Étape 2 : Commit**

```bash
git add src/types.ts
git commit -m "feat: types TypeScript partagés et helpers de réponse"
```

---

### Task 4 : Outils Documents (`src/tools/documents.ts`)

**Files:**
- Create: `src/tools/documents.ts`
- Create: `tests/tools/documents.test.ts`

- [ ] **Étape 1 : Écrire les tests qui échouent**

```typescript
// tests/tools/documents.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../../src/client.ts';
import { handleDocuments, OUTILS_DOCUMENTS } from '../../src/tools/documents.ts';

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
} as unknown as VosFacturesClient;

beforeEach(() => vi.resetAllMocks());

describe('OUTILS_DOCUMENTS', () => {
  it('expose 8 outils', () => {
    expect(OUTILS_DOCUMENTS).toHaveLength(8);
  });

  it('contient lister_documents', () => {
    expect(OUTILS_DOCUMENTS.find(t => t.name === 'lister_documents')).toBeDefined();
  });
});

describe('handleDocuments', () => {
  it('lister_documents appelle GET /invoices.json avec le type', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ invoices: [] });

    const result = await handleDocuments('lister_documents', { type_document: 'estimate' }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith('/invoices.json?kind=estimate');
    expect(result.isError).toBeUndefined();
  });

  it('creer_document appelle POST /invoices.json', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 42, number: 'F/2026/001' });

    const result = await handleDocuments('creer_document', {
      type_document: 'vat',
      buyer_name: 'Acme',
    }, mockClient);

    expect(mockClient.post).toHaveBeenCalledWith('/invoices.json', {
      invoice: { kind: 'vat', buyer_name: 'Acme' },
    });
    expect(result.content[0].text).toContain('42');
  });

  it('envoyer_document_par_email appelle POST /invoices/:id/send_by_email.json', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});

    await handleDocuments('envoyer_document_par_email', { id: 5 }, mockClient);

    expect(mockClient.post).toHaveBeenCalledWith('/invoices/5/send_by_email.json', {});
  });

  it('retourne une erreur si l\'outil est inconnu', async () => {
    const result = await handleDocuments('outil_inexistant', {}, mockClient);
    expect(result.isError).toBe(true);
  });
});
```

- [ ] **Étape 2 : Vérifier que les tests échouent**

```bash
npm test tests/tools/documents.test.ts
```

Résultat attendu : `Cannot find module '../../src/tools/documents.ts'`

- [ ] **Étape 3 : Implémenter `src/tools/documents.ts`**

```typescript
// src/tools/documents.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { VosFacturesClient } from '../client.ts';
import { reponseOk, reponseErreur, type ToolResult } from '../types.ts';

const ENUM_TYPE_DOCUMENT = [
  'vat', 'estimate', 'correction', 'advance', 'final',
  'receipt', 'proforma', 'client_order', 'maintenance_request',
  'payment_receipt', 'kp', 'kw', 'invoice_other',
] as const;

export const OUTILS_DOCUMENTS: Tool[] = [
  {
    name: 'lister_documents',
    description: 'Liste les documents VosFactures : factures, devis, avoirs, bons de commande, factures proforma, reçus, entrées/sorties caisse, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        type_document: { type: 'string', enum: ENUM_TYPE_DOCUMENT, description: 'Type de document à lister' },
        page: { type: 'number', description: 'Numéro de page (défaut : 1)' },
        per_page: { type: 'number', description: 'Résultats par page, max 100 (défaut : 25)' },
        period: { type: 'string', description: 'Période : this_month, last_month, this_year, etc.' },
        date_from: { type: 'string', description: 'Date de début (YYYY-MM-DD)' },
        date_to: { type: 'string', description: 'Date de fin (YYYY-MM-DD)' },
        client_id: { type: 'number', description: 'Filtrer par ID client' },
      },
    },
  },
  {
    name: 'obtenir_document',
    description: 'Récupère le détail complet d\'un document (facture, devis, avoir, bon de commande...) par son ID',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number', description: 'ID du document' },
      },
    },
  },
  {
    name: 'creer_document',
    description: 'Crée un nouveau document : facture, devis, avoir, bon de commande, facture proforma, reçu, bon de livraison, etc.',
    inputSchema: {
      type: 'object',
      required: ['type_document'],
      properties: {
        type_document: { type: 'string', enum: ENUM_TYPE_DOCUMENT, description: 'Type de document à créer' },
        buyer_name: { type: 'string', description: 'Nom du client' },
        buyer_email: { type: 'string', description: 'Email du client' },
        buyer_tax_no: { type: 'string', description: 'Numéro TVA ou SIRET du client' },
        client_id: { type: 'number', description: 'ID d\'un client existant (remplace buyer_name)' },
        sell_date: { type: 'string', description: 'Date de vente (YYYY-MM-DD)' },
        issue_date: { type: 'string', description: 'Date d\'émission (YYYY-MM-DD)' },
        payment_to: { type: 'string', description: 'Date d\'échéance (YYYY-MM-DD)' },
        currency: { type: 'string', description: 'Devise (EUR par défaut)' },
        positions: {
          type: 'array',
          description: 'Lignes du document',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              unit_net_price: { type: 'string' },
              tax: { type: 'string', description: 'Taux de TVA (ex: 20)' },
            },
          },
        },
        description: { type: 'string', description: 'Description ou notes internes' },
      },
    },
  },
  {
    name: 'modifier_document',
    description: 'Modifie un document existant (facture, devis, avoir...) par son ID',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number', description: 'ID du document' },
        buyer_name: { type: 'string' },
        buyer_email: { type: 'string' },
        payment_to: { type: 'string', description: 'Date d\'échéance (YYYY-MM-DD)' },
        currency: { type: 'string' },
        description: { type: 'string' },
      },
    },
  },
  {
    name: 'supprimer_document',
    description: 'Supprime définitivement un document par son ID',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number', description: 'ID du document à supprimer' },
      },
    },
  },
  {
    name: 'envoyer_document_par_email',
    description: 'Envoie un document (facture, devis...) par email au client',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number', description: 'ID du document' },
        email: { type: 'string', description: 'Email destinataire (si différent du client)' },
        sujet: { type: 'string', description: 'Sujet de l\'email' },
        message: { type: 'string', description: 'Corps du message' },
      },
    },
  },
  {
    name: 'changer_statut_document',
    description: 'Change le statut d\'un document (ex: brouillon → envoyé → payé)',
    inputSchema: {
      type: 'object',
      required: ['id', 'statut'],
      properties: {
        id: { type: 'number', description: 'ID du document' },
        statut: {
          type: 'string',
          enum: ['issued', 'sent', 'paid', 'partial', 'rejected', 'cancelled'],
          description: 'Nouveau statut',
        },
      },
    },
  },
  {
    name: 'telecharger_document_pdf',
    description: 'Retourne l\'URL de téléchargement PDF d\'un document',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number', description: 'ID du document' },
      },
    },
  },
];

export async function handleDocuments(
  name: string,
  args: Record<string, unknown>,
  client: VosFacturesClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'lister_documents': {
        const params = new URLSearchParams();
        if (args.type_document) params.set('kind', String(args.type_document));
        if (args.page) params.set('page', String(args.page));
        if (args.per_page) params.set('per_page', String(args.per_page));
        if (args.period) params.set('period', String(args.period));
        if (args.date_from) params.set('date_from', String(args.date_from));
        if (args.date_to) params.set('date_to', String(args.date_to));
        if (args.client_id) params.set('client_id', String(args.client_id));
        const query = params.toString() ? `?${params}` : '';
        const data = await client.get(`/invoices.json${query}`);
        return reponseOk(data);
      }

      case 'obtenir_document': {
        const data = await client.get(`/invoices/${args.id}.json`);
        return reponseOk(data);
      }

      case 'creer_document': {
        const { type_document, ...rest } = args;
        const data = await client.post('/invoices.json', {
          invoice: { kind: type_document, ...rest },
        });
        return reponseOk(data);
      }

      case 'modifier_document': {
        const { id, ...rest } = args;
        const data = await client.put(`/invoices/${id}.json`, { invoice: rest });
        return reponseOk(data);
      }

      case 'supprimer_document': {
        const data = await client.delete(`/invoices/${args.id}.json`);
        return reponseOk(data);
      }

      case 'envoyer_document_par_email': {
        const { id, email, sujet, message } = args;
        const body: Record<string, unknown> = {};
        if (email) body.email = email;
        if (sujet) body.subject = sujet;
        if (message) body.body = message;
        const data = await client.post(`/invoices/${id}/send_by_email.json`, body);
        return reponseOk(data);
      }

      case 'changer_statut_document': {
        const data = await client.post(`/invoices/${args.id}/change_status.json`, {
          invoice: { status: args.statut },
        });
        return reponseOk(data);
      }

      case 'telecharger_document_pdf': {
        const data = await client.get(`/invoices/${args.id}.json`) as { view_url?: string };
        const pdfUrl = data.view_url
          ? data.view_url.replace('/view/', '/') + '.pdf'
          : `PDF disponible sur votre compte VosFactures (ID: ${args.id})`;
        return reponseOk({ pdf_url: pdfUrl });
      }

      default:
        return reponseErreur(`Outil inconnu : ${name}`);
    }
  } catch (err) {
    return reponseErreur(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Étape 4 : Lancer les tests**

```bash
npm test tests/tools/documents.test.ts
```

Résultat attendu : 5 tests passent.

- [ ] **Étape 5 : Commit**

```bash
git add src/tools/documents.ts tests/tools/documents.test.ts
git commit -m "feat: outils MCP documents (factures, devis, avoirs, bons de commande...)"
```

---

### Task 5 : Outils Clients (`src/tools/clients.ts`)

**Files:**
- Create: `src/tools/clients.ts`
- Create: `tests/tools/clients.test.ts`

- [ ] **Étape 1 : Écrire les tests qui échouent**

```typescript
// tests/tools/clients.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../../src/client.ts';
import { handleClients, OUTILS_CLIENTS } from '../../src/tools/clients.ts';

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
} as unknown as VosFacturesClient;

beforeEach(() => vi.resetAllMocks());

describe('OUTILS_CLIENTS', () => {
  it('expose 6 outils', () => {
    expect(OUTILS_CLIENTS).toHaveLength(6);
  });
});

describe('handleClients', () => {
  it('lister_clients appelle GET /clients.json', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleClients('lister_clients', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/clients.json');
  });

  it('rechercher_client ajoute le paramètre name', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleClients('rechercher_client', { nom: 'Acme' }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/clients.json?name=Acme');
  });

  it('creer_client appelle POST /clients.json', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 10 });
    await handleClients('creer_client', { name: 'Acme', email: 'a@acme.fr' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/clients.json', {
      client: { name: 'Acme', email: 'a@acme.fr' },
    });
  });
});
```

- [ ] **Étape 2 : Vérifier que les tests échouent**

```bash
npm test tests/tools/clients.test.ts
```

- [ ] **Étape 3 : Implémenter `src/tools/clients.ts`**

```typescript
// src/tools/clients.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { VosFacturesClient } from '../client.ts';
import { reponseOk, reponseErreur, type ToolResult } from '../types.ts';

export const OUTILS_CLIENTS: Tool[] = [
  {
    name: 'lister_clients',
    description: 'Liste tous les contacts (clients et fournisseurs)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        per_page: { type: 'number', description: 'Max 100' },
      },
    },
  },
  {
    name: 'obtenir_client',
    description: 'Récupère le détail d\'un contact par son ID',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'number' } },
    },
  },
  {
    name: 'rechercher_client',
    description: 'Recherche un client par nom, email, SIRET ou numéro TVA',
    inputSchema: {
      type: 'object',
      properties: {
        nom: { type: 'string', description: 'Recherche par nom' },
        email: { type: 'string', description: 'Recherche par email' },
        tax_no: { type: 'string', description: 'Recherche par numéro TVA ou SIRET' },
        external_id: { type: 'string', description: 'Recherche par référence externe' },
      },
    },
  },
  {
    name: 'creer_client',
    description: 'Crée un nouveau contact client ou fournisseur',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Nom complet' },
        shortcut: { type: 'string', description: 'Nom d\'usage court' },
        email: { type: 'string' },
        phone: { type: 'string' },
        tax_no: { type: 'string', description: 'Numéro TVA ou SIRET' },
        street: { type: 'string' },
        city: { type: 'string' },
        post_code: { type: 'string' },
        country: { type: 'string', description: 'Code pays (FR, BE, CH...)' },
      },
    },
  },
  {
    name: 'modifier_client',
    description: 'Modifie un contact existant',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        street: { type: 'string' },
        city: { type: 'string' },
        post_code: { type: 'string' },
      },
    },
  },
  {
    name: 'supprimer_client',
    description: 'Supprime un contact par son ID',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'number' } },
    },
  },
];

export async function handleClients(
  name: string,
  args: Record<string, unknown>,
  client: VosFacturesClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'lister_clients': {
        const params = new URLSearchParams();
        if (args.page) params.set('page', String(args.page));
        if (args.per_page) params.set('per_page', String(args.per_page));
        const query = params.toString() ? `?${params}` : '';
        return reponseOk(await client.get(`/clients.json${query}`));
      }

      case 'obtenir_client':
        return reponseOk(await client.get(`/clients/${args.id}.json`));

      case 'rechercher_client': {
        const params = new URLSearchParams();
        if (args.nom) params.set('name', String(args.nom));
        if (args.email) params.set('email', String(args.email));
        if (args.tax_no) params.set('tax_no', String(args.tax_no));
        if (args.external_id) params.set('external_id', String(args.external_id));
        const query = params.toString() ? `?${params}` : '';
        return reponseOk(await client.get(`/clients.json${query}`));
      }

      case 'creer_client':
        return reponseOk(await client.post('/clients.json', { client: args }));

      case 'modifier_client': {
        const { id, ...rest } = args;
        return reponseOk(await client.put(`/clients/${id}.json`, { client: rest }));
      }

      case 'supprimer_client':
        return reponseOk(await client.delete(`/clients/${args.id}.json`));

      default:
        return reponseErreur(`Outil inconnu : ${name}`);
    }
  } catch (err) {
    return reponseErreur(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Étape 4 : Lancer les tests**

```bash
npm test tests/tools/clients.test.ts
```

Résultat attendu : 4 tests passent.

- [ ] **Étape 5 : Commit**

```bash
git add src/tools/clients.ts tests/tools/clients.test.ts
git commit -m "feat: outils MCP clients (lister, rechercher, créer, modifier, supprimer)"
```

---

### Task 6 : Outils Produits (`src/tools/produits.ts`)

**Files:**
- Create: `src/tools/produits.ts`
- Create: `tests/tools/produits.test.ts`

- [ ] **Étape 1 : Écrire les tests qui échouent**

```typescript
// tests/tools/produits.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../../src/client.ts';
import { handleProduits, OUTILS_PRODUITS } from '../../src/tools/produits.ts';

const mockClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } as unknown as VosFacturesClient;
beforeEach(() => vi.resetAllMocks());

describe('OUTILS_PRODUITS', () => {
  it('expose 4 outils', () => expect(OUTILS_PRODUITS).toHaveLength(4));
});

describe('handleProduits', () => {
  it('lister_produits appelle GET /products.json', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleProduits('lister_produits', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/products.json');
  });

  it('creer_produit appelle POST /products.json', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 5 });
    await handleProduits('creer_produit', { name: 'Consultation', price_net: '100' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/products.json', {
      product: { name: 'Consultation', price_net: '100' },
    });
  });
});
```

- [ ] **Étape 2 : Vérifier que les tests échouent**

```bash
npm test tests/tools/produits.test.ts
```

- [ ] **Étape 3 : Implémenter `src/tools/produits.ts`**

```typescript
// src/tools/produits.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { VosFacturesClient } from '../client.ts';
import { reponseOk, reponseErreur, type ToolResult } from '../types.ts';

export const OUTILS_PRODUITS: Tool[] = [
  {
    name: 'lister_produits',
    description: 'Liste tous les produits et services du catalogue',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        per_page: { type: 'number' },
        warehouse_id: { type: 'number', description: 'Filtrer par entrepôt' },
      },
    },
  },
  {
    name: 'obtenir_produit',
    description: 'Récupère le détail d\'un produit par son ID',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'number' } },
    },
  },
  {
    name: 'creer_produit',
    description: 'Crée un nouveau produit ou service dans le catalogue',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Nom du produit ou service' },
        code: { type: 'string', description: 'Référence / code produit' },
        price_net: { type: 'string', description: 'Prix HT' },
        price_gross: { type: 'string', description: 'Prix TTC' },
        tax: { type: 'string', description: 'Taux TVA (ex: 20)' },
        unit: { type: 'string', description: 'Unité (ex: h, jour, pièce)' },
        description: { type: 'string' },
      },
    },
  },
  {
    name: 'modifier_produit',
    description: 'Modifie un produit existant',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        price_net: { type: 'string' },
        price_gross: { type: 'string' },
        tax: { type: 'string' },
        description: { type: 'string' },
      },
    },
  },
];

export async function handleProduits(
  name: string,
  args: Record<string, unknown>,
  client: VosFacturesClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'lister_produits': {
        const params = new URLSearchParams();
        if (args.page) params.set('page', String(args.page));
        if (args.per_page) params.set('per_page', String(args.per_page));
        if (args.warehouse_id) params.set('warehouse_id', String(args.warehouse_id));
        const query = params.toString() ? `?${params}` : '';
        return reponseOk(await client.get(`/products.json${query}`));
      }
      case 'obtenir_produit':
        return reponseOk(await client.get(`/products/${args.id}.json`));
      case 'creer_produit':
        return reponseOk(await client.post('/products.json', { product: args }));
      case 'modifier_produit': {
        const { id, ...rest } = args;
        return reponseOk(await client.put(`/products/${id}.json`, { product: rest }));
      }
      default:
        return reponseErreur(`Outil inconnu : ${name}`);
    }
  } catch (err) {
    return reponseErreur(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Étape 4 : Lancer les tests**

```bash
npm test tests/tools/produits.test.ts
```

Résultat attendu : 3 tests passent.

- [ ] **Étape 5 : Commit**

```bash
git add src/tools/produits.ts tests/tools/produits.test.ts
git commit -m "feat: outils MCP produits (catalogue produits et services)"
```

---

### Task 7 : Outils Paiements (`src/tools/paiements.ts`)

**Files:**
- Create: `src/tools/paiements.ts`
- Create: `tests/tools/paiements.test.ts`

- [ ] **Étape 1 : Écrire les tests qui échouent**

```typescript
// tests/tools/paiements.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../../src/client.ts';
import { handlePaiements, OUTILS_PAIEMENTS } from '../../src/tools/paiements.ts';

const mockClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } as unknown as VosFacturesClient;
beforeEach(() => vi.resetAllMocks());

describe('OUTILS_PAIEMENTS', () => {
  it('expose 5 outils', () => expect(OUTILS_PAIEMENTS).toHaveLength(5));
});

describe('handlePaiements', () => {
  it('ajouter_paiement appelle POST /payments.json avec invoice_id et montant', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 3 });
    await handlePaiements('ajouter_paiement', {
      invoice_id: 10,
      amount: '500',
      paid_date: '2026-04-03',
    }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/payments.json', {
      payment: { invoice_id: 10, amount: '500', paid_date: '2026-04-03' },
    });
  });
});
```

- [ ] **Étape 2 : Vérifier que les tests échouent**

```bash
npm test tests/tools/paiements.test.ts
```

- [ ] **Étape 3 : Implémenter `src/tools/paiements.ts`**

```typescript
// src/tools/paiements.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { VosFacturesClient } from '../client.ts';
import { reponseOk, reponseErreur, type ToolResult } from '../types.ts';

export const OUTILS_PAIEMENTS: Tool[] = [
  {
    name: 'lister_paiements',
    description: 'Liste les paiements enregistrés',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        per_page: { type: 'number' },
      },
    },
  },
  {
    name: 'obtenir_paiement',
    description: 'Récupère le détail d\'un paiement par son ID',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'number' } },
    },
  },
  {
    name: 'ajouter_paiement',
    description: 'Enregistre un paiement lié à une facture',
    inputSchema: {
      type: 'object',
      required: ['invoice_id', 'amount', 'paid_date'],
      properties: {
        invoice_id: { type: 'number', description: 'ID de la facture' },
        amount: { type: 'string', description: 'Montant payé' },
        paid_date: { type: 'string', description: 'Date du paiement (YYYY-MM-DD)' },
        payment_type: { type: 'string', description: 'Moyen de paiement (transfer, card, cash...)' },
        comment: { type: 'string' },
      },
    },
  },
  {
    name: 'modifier_paiement',
    description: 'Modifie un paiement existant',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number' },
        amount: { type: 'string' },
        paid_date: { type: 'string' },
        comment: { type: 'string' },
      },
    },
  },
  {
    name: 'supprimer_paiement',
    description: 'Supprime un paiement par son ID',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'number' } },
    },
  },
];

export async function handlePaiements(
  name: string,
  args: Record<string, unknown>,
  client: VosFacturesClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'lister_paiements': {
        const params = new URLSearchParams();
        if (args.page) params.set('page', String(args.page));
        if (args.per_page) params.set('per_page', String(args.per_page));
        const query = params.toString() ? `?${params}` : '';
        return reponseOk(await client.get(`/payments.json${query}`));
      }
      case 'obtenir_paiement':
        return reponseOk(await client.get(`/payments/${args.id}.json`));
      case 'ajouter_paiement':
        return reponseOk(await client.post('/payments.json', { payment: args }));
      case 'modifier_paiement': {
        const { id, ...rest } = args;
        return reponseOk(await client.put(`/payments/${id}.json`, { payment: rest }));
      }
      case 'supprimer_paiement':
        return reponseOk(await client.delete(`/payments/${args.id}.json`));
      default:
        return reponseErreur(`Outil inconnu : ${name}`);
    }
  } catch (err) {
    return reponseErreur(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Étape 4 : Lancer les tests**

```bash
npm test tests/tools/paiements.test.ts
```

Résultat attendu : 2 tests passent.

- [ ] **Étape 5 : Commit**

```bash
git add src/tools/paiements.ts tests/tools/paiements.test.ts
git commit -m "feat: outils MCP paiements"
```

---

### Task 8 : Outils Départements (`src/tools/departements.ts`)

**Files:**
- Create: `src/tools/departements.ts`
- Create: `tests/tools/departements.test.ts`

- [ ] **Étape 1 : Écrire les tests qui échouent**

```typescript
// tests/tools/departements.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../../src/client.ts';
import { handleDepartements, OUTILS_DEPARTEMENTS } from '../../src/tools/departements.ts';

const mockClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } as unknown as VosFacturesClient;
beforeEach(() => vi.resetAllMocks());

describe('OUTILS_DEPARTEMENTS', () => {
  it('expose 5 outils', () => expect(OUTILS_DEPARTEMENTS).toHaveLength(5));
});

describe('handleDepartements', () => {
  it('lister_departements appelle GET /departments.json', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleDepartements('lister_departements', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/departments.json');
  });
});
```

- [ ] **Étape 2 : Vérifier que les tests échouent**

```bash
npm test tests/tools/departements.test.ts
```

- [ ] **Étape 3 : Implémenter `src/tools/departements.ts`**

```typescript
// src/tools/departements.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { VosFacturesClient } from '../client.ts';
import { reponseOk, reponseErreur, type ToolResult } from '../types.ts';

export const OUTILS_DEPARTEMENTS: Tool[] = [
  {
    name: 'lister_departements',
    description: 'Liste les départements (entités vendeurs) de votre compte',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'obtenir_departement',
    description: 'Récupère le détail d\'un département par son ID',
    inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'number' } } },
  },
  {
    name: 'creer_departement',
    description: 'Crée un nouveau département (entité vendeur)',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        shortcut: { type: 'string' },
        tax_no: { type: 'string', description: 'Numéro TVA ou SIRET' },
        email: { type: 'string' },
        street: { type: 'string' },
        city: { type: 'string' },
        post_code: { type: 'string' },
        phone: { type: 'string' },
        bank: { type: 'string', description: 'Nom de la banque' },
        bank_account: { type: 'string', description: 'IBAN' },
      },
    },
  },
  {
    name: 'modifier_departement',
    description: 'Modifie un département existant',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        email: { type: 'string' },
        bank_account: { type: 'string' },
      },
    },
  },
  {
    name: 'supprimer_departement',
    description: 'Supprime un département par son ID',
    inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'number' } } },
  },
];

export async function handleDepartements(
  name: string,
  args: Record<string, unknown>,
  client: VosFacturesClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'lister_departements':
        return reponseOk(await client.get('/departments.json'));
      case 'obtenir_departement':
        return reponseOk(await client.get(`/departments/${args.id}.json`));
      case 'creer_departement':
        return reponseOk(await client.post('/departments.json', { department: args }));
      case 'modifier_departement': {
        const { id, ...rest } = args;
        return reponseOk(await client.put(`/departments/${id}.json`, { department: rest }));
      }
      case 'supprimer_departement':
        return reponseOk(await client.delete(`/departments/${args.id}.json`));
      default:
        return reponseErreur(`Outil inconnu : ${name}`);
    }
  } catch (err) {
    return reponseErreur(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Étape 4 : Lancer les tests**

```bash
npm test tests/tools/departements.test.ts
```

Résultat attendu : 2 tests passent.

- [ ] **Étape 5 : Commit**

```bash
git add src/tools/departements.ts tests/tools/departements.test.ts
git commit -m "feat: outils MCP départements"
```

---

### Task 9 : Outils Récurrences (`src/tools/recurrences.ts`)

**Files:**
- Create: `src/tools/recurrences.ts`
- Create: `tests/tools/recurrences.test.ts`

- [ ] **Étape 1 : Écrire les tests qui échouent**

```typescript
// tests/tools/recurrences.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../../src/client.ts';
import { handleRecurrences, OUTILS_RECURRENCES } from '../../src/tools/recurrences.ts';

const mockClient = { get: vi.fn(), post: vi.fn(), put: vi.fn() } as unknown as VosFacturesClient;
beforeEach(() => vi.resetAllMocks());

describe('OUTILS_RECURRENCES', () => {
  it('expose 3 outils', () => expect(OUTILS_RECURRENCES).toHaveLength(3));
});

describe('handleRecurrences', () => {
  it('lister_recurrences appelle GET /recurrings.json', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleRecurrences('lister_recurrences', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/recurrings.json');
  });
});
```

- [ ] **Étape 2 : Vérifier que les tests échouent**

```bash
npm test tests/tools/recurrences.test.ts
```

- [ ] **Étape 3 : Implémenter `src/tools/recurrences.ts`**

```typescript
// src/tools/recurrences.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { VosFacturesClient } from '../client.ts';
import { reponseOk, reponseErreur, type ToolResult } from '../types.ts';

export const OUTILS_RECURRENCES: Tool[] = [
  {
    name: 'lister_recurrences',
    description: 'Liste les factures récurrentes programmées',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'creer_recurrence',
    description: 'Crée une nouvelle facture récurrente automatique',
    inputSchema: {
      type: 'object',
      required: ['invoice_id', 'period', 'period_units', 'start_date'],
      properties: {
        invoice_id: { type: 'number', description: 'ID de la facture modèle' },
        period: { type: 'number', description: 'Fréquence (ex: 1 pour mensuel)' },
        period_units: {
          type: 'string',
          enum: ['week', 'month', 'year'],
          description: 'Unité de période',
        },
        start_date: { type: 'string', description: 'Date de début (YYYY-MM-DD)' },
        end_date: { type: 'string', description: 'Date de fin optionnelle (YYYY-MM-DD)' },
        active: { type: 'boolean', description: 'Activer immédiatement (défaut: true)' },
      },
    },
  },
  {
    name: 'modifier_recurrence',
    description: 'Modifie une récurrence existante (fréquence, dates, activation)',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number' },
        period: { type: 'number' },
        period_units: { type: 'string', enum: ['week', 'month', 'year'] },
        end_date: { type: 'string' },
        active: { type: 'boolean' },
      },
    },
  },
];

export async function handleRecurrences(
  name: string,
  args: Record<string, unknown>,
  client: VosFacturesClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'lister_recurrences':
        return reponseOk(await client.get('/recurrings.json'));
      case 'creer_recurrence':
        return reponseOk(await client.post('/recurrings.json', { recurring: args }));
      case 'modifier_recurrence': {
        const { id, ...rest } = args;
        return reponseOk(await client.put(`/recurrings/${id}.json`, { recurring: rest }));
      }
      default:
        return reponseErreur(`Outil inconnu : ${name}`);
    }
  } catch (err) {
    return reponseErreur(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Étape 4 : Lancer les tests**

```bash
npm test tests/tools/recurrences.test.ts
```

Résultat attendu : 2 tests passent.

- [ ] **Étape 5 : Commit**

```bash
git add src/tools/recurrences.ts tests/tools/recurrences.test.ts
git commit -m "feat: outils MCP récurrences (factures automatiques)"
```

---

### Task 10 : Outils Stock (`src/tools/stock.ts`)

**Files:**
- Create: `src/tools/stock.ts`
- Create: `tests/tools/stock.test.ts`

- [ ] **Étape 1 : Écrire les tests qui échouent**

```typescript
// tests/tools/stock.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../../src/client.ts';
import { handleStock, OUTILS_STOCK } from '../../src/tools/stock.ts';

const mockClient = { get: vi.fn(), post: vi.fn() } as unknown as VosFacturesClient;
beforeEach(() => vi.resetAllMocks());

describe('OUTILS_STOCK', () => {
  it('expose 4 outils', () => expect(OUTILS_STOCK).toHaveLength(4));
});

describe('handleStock', () => {
  it('lister_documents_stock appelle GET /warehouse_documents.json', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleStock('lister_documents_stock', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/warehouse_documents.json');
  });

  it('lister_entrepots appelle GET /warehouses.json', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleStock('lister_entrepots', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/warehouses.json');
  });
});
```

- [ ] **Étape 2 : Vérifier que les tests échouent**

```bash
npm test tests/tools/stock.test.ts
```

- [ ] **Étape 3 : Implémenter `src/tools/stock.ts`**

```typescript
// src/tools/stock.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { VosFacturesClient } from '../client.ts';
import { reponseOk, reponseErreur, type ToolResult } from '../types.ts';

export const OUTILS_STOCK: Tool[] = [
  {
    name: 'lister_documents_stock',
    description: 'Liste les documents de stock : bons de livraison, bons de réception, transferts',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        per_page: { type: 'number' },
        warehouse_id: { type: 'number', description: 'Filtrer par entrepôt' },
      },
    },
  },
  {
    name: 'creer_document_stock',
    description: 'Crée un mouvement de stock (bon de livraison, réception, transfert)',
    inputSchema: {
      type: 'object',
      required: ['kind'],
      properties: {
        kind: {
          type: 'string',
          enum: ['wz', 'pz', 'mm', 'pw', 'rw'],
          description: 'Type : wz=bon de livraison, pz=bon de réception, mm=transfert, pw=entrée production, rw=sortie production',
        },
        issue_date: { type: 'string', description: 'Date d\'émission (YYYY-MM-DD)' },
        warehouse_id: { type: 'number' },
        description: { type: 'string' },
      },
    },
  },
  {
    name: 'lister_entrepots',
    description: 'Liste les entrepôts configurés',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'creer_entrepot',
    description: 'Crée un nouvel entrepôt',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
      },
    },
  },
];

export async function handleStock(
  name: string,
  args: Record<string, unknown>,
  client: VosFacturesClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'lister_documents_stock': {
        const params = new URLSearchParams();
        if (args.page) params.set('page', String(args.page));
        if (args.per_page) params.set('per_page', String(args.per_page));
        if (args.warehouse_id) params.set('warehouse_id', String(args.warehouse_id));
        const query = params.toString() ? `?${params}` : '';
        return reponseOk(await client.get(`/warehouse_documents.json${query}`));
      }
      case 'creer_document_stock':
        return reponseOk(await client.post('/warehouse_documents.json', { warehouse_document: args }));
      case 'lister_entrepots':
        return reponseOk(await client.get('/warehouses.json'));
      case 'creer_entrepot':
        return reponseOk(await client.post('/warehouses.json', { warehouse: args }));
      default:
        return reponseErreur(`Outil inconnu : ${name}`);
    }
  } catch (err) {
    return reponseErreur(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Étape 4 : Lancer les tests**

```bash
npm test tests/tools/stock.test.ts
```

Résultat attendu : 3 tests passent.

- [ ] **Étape 5 : Commit**

```bash
git add src/tools/stock.ts tests/tools/stock.test.ts
git commit -m "feat: outils MCP stock (bons de livraison, entrepôts)"
```

---

### Task 11 : Point d'entrée MCP (`src/index.ts`)

**Files:**
- Create: `src/index.ts`

- [ ] **Étape 1 : Lancer tous les tests pour vérifier la base**

```bash
npm test
```

Résultat attendu : tous les tests précédents passent.

- [ ] **Étape 2 : Créer `src/index.ts`**

```typescript
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { creerClient } from './client.ts';
import { OUTILS_DOCUMENTS, handleDocuments } from './tools/documents.ts';
import { OUTILS_CLIENTS, handleClients } from './tools/clients.ts';
import { OUTILS_PRODUITS, handleProduits } from './tools/produits.ts';
import { OUTILS_PAIEMENTS, handlePaiements } from './tools/paiements.ts';
import { OUTILS_DEPARTEMENTS, handleDepartements } from './tools/departements.ts';
import { OUTILS_RECURRENCES, handleRecurrences } from './tools/recurrences.ts';
import { OUTILS_STOCK, handleStock } from './tools/stock.ts';

const TOUS_LES_OUTILS = [
  ...OUTILS_DOCUMENTS,
  ...OUTILS_CLIENTS,
  ...OUTILS_PRODUITS,
  ...OUTILS_PAIEMENTS,
  ...OUTILS_DEPARTEMENTS,
  ...OUTILS_RECURRENCES,
  ...OUTILS_STOCK,
];

async function main() {
  const client = creerClient();

  const server = new Server(
    { name: 'vosfactures-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOUS_LES_OUTILS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    const a = args as Record<string, unknown>;

    if (OUTILS_DOCUMENTS.some(t => t.name === name)) return handleDocuments(name, a, client);
    if (OUTILS_CLIENTS.some(t => t.name === name)) return handleClients(name, a, client);
    if (OUTILS_PRODUITS.some(t => t.name === name)) return handleProduits(name, a, client);
    if (OUTILS_PAIEMENTS.some(t => t.name === name)) return handlePaiements(name, a, client);
    if (OUTILS_DEPARTEMENTS.some(t => t.name === name)) return handleDepartements(name, a, client);
    if (OUTILS_RECURRENCES.some(t => t.name === name)) return handleRecurrences(name, a, client);
    if (OUTILS_STOCK.some(t => t.name === name)) return handleStock(name, a, client);

    return {
      content: [{ type: 'text', text: `Erreur : outil inconnu "${name}"` }],
      isError: true,
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
```

- [ ] **Étape 3 : Compiler et vérifier que ça build**

```bash
npm run build
```

Résultat attendu : dossier `dist/` créé avec `index.js`, aucune erreur TypeScript.

- [ ] **Étape 4 : Test rapide en mode dev (optionnel)**

Ajouter dans `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "vosfactures": {
      "command": "npx",
      "args": ["tsx", "/Users/verticka/dev/mcp/vosfactures-mcp/src/index.ts"],
      "env": {
        "VOSFACTURES_API_TOKEN": "TON_TOKEN",
        "VOSFACTURES_URL": "https://toncompte.vosfactures.fr"
      }
    }
  }
}
```

Redémarrer Claude Desktop et vérifier que les outils `lister_documents`, `lister_clients`, etc. apparaissent.

- [ ] **Étape 5 : Commit**

```bash
git add src/index.ts
git commit -m "feat: point d'entrée MCP, enregistrement de tous les outils"
```

---

### Task 12 : README et publication GitHub

**Files:**
- Create: `README.md`

- [ ] **Étape 1 : Créer `README.md`**

```markdown
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

### Depuis npm (recommandé)
```bash
npx vosfactures-mcp
```

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
```

- [ ] **Étape 2 : Lancer tous les tests une dernière fois**

```bash
npm test
```

Résultat attendu : tous les tests passent.

- [ ] **Étape 3 : Commit final et push**

```bash
git add README.md
git commit -m "feat: README complet avec installation, configuration et liste des outils"
git push origin main
```
```

- [ ] **Étape 4 : Vérifier la publication sur GitHub**

Ouvrir `https://github.com/verticka/vosfactures-mcp` et vérifier que le README s'affiche correctement avec la liste des outils.

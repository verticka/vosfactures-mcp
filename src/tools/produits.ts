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
      type: 'object', required: ['id'],
      properties: { id: { type: 'number' } },
    },
  },
  {
    name: 'creer_produit',
    description: 'Crée un nouveau produit ou service dans le catalogue',
    inputSchema: {
      type: 'object', required: ['name'],
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
      type: 'object', required: ['id'],
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

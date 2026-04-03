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
      type: 'object', required: ['kind'],
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
      type: 'object', required: ['name'],
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

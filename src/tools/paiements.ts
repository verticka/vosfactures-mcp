// src/tools/paiements.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { VosFacturesClient } from '../client.js';
import { reponseOk, reponseErreur, type ToolResult } from '../types.js';

export const OUTILS_PAIEMENTS: Tool[] = [
  {
    name: 'lister_paiements',
    description: 'Liste les paiements enregistrés',
    inputSchema: {
      type: 'object',
      properties: { page: { type: 'number' }, per_page: { type: 'number' } },
    },
  },
  {
    name: 'obtenir_paiement',
    description: 'Récupère le détail d\'un paiement par son ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'number' } },
    },
  },
  {
    name: 'ajouter_paiement',
    description: 'Enregistre un paiement lié à une facture',
    inputSchema: {
      type: 'object', required: ['invoice_id', 'amount', 'paid_date'],
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
      type: 'object', required: ['id'],
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
      type: 'object', required: ['id'],
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

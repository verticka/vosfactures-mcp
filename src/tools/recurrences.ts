// src/tools/recurrences.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { VosFacturesClient } from '../client.js';
import { reponseOk, reponseErreur, type ToolResult } from '../types.js';

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
      type: 'object', required: ['invoice_id', 'period', 'period_units', 'start_date'],
      properties: {
        invoice_id: { type: 'number', description: 'ID de la facture modèle' },
        period: { type: 'number', description: 'Fréquence (ex: 1 pour mensuel)' },
        period_units: { type: 'string', enum: ['week', 'month', 'year'], description: 'Unité de période' },
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
      type: 'object', required: ['id'],
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

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
      type: 'object', required: ['name'],
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
      type: 'object', required: ['id'],
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

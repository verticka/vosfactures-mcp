// src/tools/clients.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { VosFacturesClient } from '../client.js';
import { reponseOk, reponseErreur, type ToolResult } from '../types.js';

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
      type: 'object', required: ['id'],
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
      type: 'object', required: ['name'],
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
      type: 'object', required: ['id'],
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
      type: 'object', required: ['id'],
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

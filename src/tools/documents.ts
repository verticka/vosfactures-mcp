import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { VosFacturesClient } from '../client.ts';
import { reponseOk, reponseErreur, type ToolResult } from '../types.ts';

const ENUM_TYPE_DOCUMENT = [
  'vat', 'estimate', 'correction', 'advance', 'final',
  'receipt', 'proforma', 'client_order', 'maintenance_request',
  'payment_receipt', 'kp', 'kw', 'invoice_other',
];

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
      properties: { id: { type: 'number', description: 'ID du document' } },
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
        payment_to: { type: 'string' },
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
      properties: { id: { type: 'number', description: 'ID du document à supprimer' } },
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
      properties: { id: { type: 'number', description: 'ID du document' } },
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
        return reponseOk(await client.get(`/invoices.json${query}`));
      }
      case 'obtenir_document':
        return reponseOk(await client.get(`/invoices/${args.id}.json`));
      case 'creer_document': {
        const { type_document, ...rest } = args;
        return reponseOk(await client.post('/invoices.json', { invoice: { kind: type_document, ...rest } }));
      }
      case 'modifier_document': {
        const { id, ...rest } = args;
        return reponseOk(await client.put(`/invoices/${id}.json`, { invoice: rest }));
      }
      case 'supprimer_document':
        return reponseOk(await client.delete(`/invoices/${args.id}.json`));
      case 'envoyer_document_par_email': {
        const { id, email, sujet, message } = args;
        const body: Record<string, unknown> = {};
        if (email) body.email = email;
        if (sujet) body.subject = sujet;
        if (message) body.body = message;
        return reponseOk(await client.post(`/invoices/${id}/send_by_email.json`, body));
      }
      case 'changer_statut_document':
        return reponseOk(await client.post(`/invoices/${args.id}/change_status.json`, {
          invoice: { status: args.statut },
        }));
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

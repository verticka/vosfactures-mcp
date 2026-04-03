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

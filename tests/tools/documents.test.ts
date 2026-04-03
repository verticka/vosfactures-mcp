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

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
      invoice_id: 10, amount: '500', paid_date: '2026-04-03',
    }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/payments.json', {
      payment: { invoice_id: 10, amount: '500', paid_date: '2026-04-03' },
    });
  });
});

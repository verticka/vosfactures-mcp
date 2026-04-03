// tests/tools/produits.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../../src/client.ts';
import { handleProduits, OUTILS_PRODUITS } from '../../src/tools/produits.ts';

const mockClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } as unknown as VosFacturesClient;
beforeEach(() => vi.resetAllMocks());

describe('OUTILS_PRODUITS', () => {
  it('expose 4 outils', () => expect(OUTILS_PRODUITS).toHaveLength(4));
});

describe('handleProduits', () => {
  it('lister_produits appelle GET /products.json', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleProduits('lister_produits', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/products.json');
  });
  it('creer_produit appelle POST /products.json', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 5 });
    await handleProduits('creer_produit', { name: 'Consultation', price_net: '100' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/products.json', {
      product: { name: 'Consultation', price_net: '100' },
    });
  });
});

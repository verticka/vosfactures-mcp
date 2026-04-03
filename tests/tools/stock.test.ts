// tests/tools/stock.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../../src/client.ts';
import { handleStock, OUTILS_STOCK } from '../../src/tools/stock.ts';

const mockClient = { get: vi.fn(), post: vi.fn() } as unknown as VosFacturesClient;
beforeEach(() => vi.resetAllMocks());

describe('OUTILS_STOCK', () => {
  it('expose 4 outils', () => expect(OUTILS_STOCK).toHaveLength(4));
});

describe('handleStock', () => {
  it('lister_documents_stock appelle GET /warehouse_documents.json', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleStock('lister_documents_stock', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/warehouse_documents.json');
  });
  it('lister_entrepots appelle GET /warehouses.json', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleStock('lister_entrepots', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/warehouses.json');
  });
});

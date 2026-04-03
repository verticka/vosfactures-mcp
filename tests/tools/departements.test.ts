// tests/tools/departements.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../../src/client.ts';
import { handleDepartements, OUTILS_DEPARTEMENTS } from '../../src/tools/departements.ts';

const mockClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } as unknown as VosFacturesClient;
beforeEach(() => vi.resetAllMocks());

describe('OUTILS_DEPARTEMENTS', () => {
  it('expose 5 outils', () => expect(OUTILS_DEPARTEMENTS).toHaveLength(5));
});

describe('handleDepartements', () => {
  it('lister_departements appelle GET /departments.json', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleDepartements('lister_departements', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/departments.json');
  });
});

// tests/tools/clients.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../../src/client.ts';
import { handleClients, OUTILS_CLIENTS } from '../../src/tools/clients.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(),
} as unknown as VosFacturesClient;
beforeEach(() => vi.resetAllMocks());

describe('OUTILS_CLIENTS', () => {
  it('expose 6 outils', () => { expect(OUTILS_CLIENTS).toHaveLength(6); });
});

describe('handleClients', () => {
  it('lister_clients appelle GET /clients.json', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleClients('lister_clients', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/clients.json');
  });
  it('rechercher_client ajoute le paramètre name', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleClients('rechercher_client', { nom: 'Acme' }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/clients.json?name=Acme');
  });
  it('creer_client appelle POST /clients.json', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 10 });
    await handleClients('creer_client', { name: 'Acme', email: 'a@acme.fr' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/clients.json', {
      client: { name: 'Acme', email: 'a@acme.fr' },
    });
  });
});

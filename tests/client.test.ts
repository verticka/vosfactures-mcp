// tests/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../src/client.ts';

describe('VosFacturesClient', () => {
  const client = new VosFacturesClient('https://test.vosfactures.fr', 'mon_token');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('injecte le token dans les requêtes GET', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invoices: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await client.get('/invoices.json');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.vosfactures.fr/invoices.json?api_token=mon_token',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('lève une erreur française en cas de 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }));

    await expect(client.get('/invoices.json')).rejects.toThrow('Token API invalide (401)');
  });

  it('lève une erreur française en cas de 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    }));

    await expect(client.get('/invoices/999.json')).rejects.toThrow('Ressource introuvable (404)');
  });

  it('effectue un POST avec le body JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await client.post('/invoices.json', { invoice: { kind: 'vat' } });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.vosfactures.fr/invoices.json?api_token=mon_token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ invoice: { kind: 'vat' } }),
      })
    );
  });

  it('lève une erreur si la réponse n\'est pas du JSON valide', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token'); },
    }));

    await expect(client.get('/invoices.json')).rejects.toThrow('Réponse non-JSON reçue du serveur VosFactures (200)');
  });
});

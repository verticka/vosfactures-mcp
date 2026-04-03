// tests/tools/recurrences.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VosFacturesClient } from '../../src/client.ts';
import { handleRecurrences, OUTILS_RECURRENCES } from '../../src/tools/recurrences.ts';

const mockClient = { get: vi.fn(), post: vi.fn(), put: vi.fn() } as unknown as VosFacturesClient;
beforeEach(() => vi.resetAllMocks());

describe('OUTILS_RECURRENCES', () => {
  it('expose 3 outils', () => expect(OUTILS_RECURRENCES).toHaveLength(3));
});

describe('handleRecurrences', () => {
  it('lister_recurrences appelle GET /recurrings.json', async () => {
    mockClient.get = vi.fn().mockResolvedValue([]);
    await handleRecurrences('lister_recurrences', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/recurrings.json');
  });
});

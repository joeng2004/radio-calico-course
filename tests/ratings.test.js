/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyRating, fetchRatings, submitRating } from '../public/ratings.js';

function makeElements(overrides = {}) {
  return {
    upCount: { textContent: '0' },
    downCount: { textContent: '0' },
    rateUp: { classList: { toggle: vi.fn() } },
    rateDown: { classList: { toggle: vi.fn() } },
    ...overrides,
  };
}

describe('applyRating', () => {
  it('sets upCount and downCount text', () => {
    const els = makeElements();
    applyRating(els, { up: 5, down: 3, userRating: 0 });
    expect(els.upCount.textContent).toBe(5);
    expect(els.downCount.textContent).toBe(3);
  });

  it('toggles active-up on when userRating === 1', () => {
    const els = makeElements();
    applyRating(els, { up: 1, down: 0, userRating: 1 });
    expect(els.rateUp.classList.toggle).toHaveBeenCalledWith('active-up', true);
    expect(els.rateDown.classList.toggle).toHaveBeenCalledWith('active-down', false);
  });

  it('toggles active-down on when userRating === -1', () => {
    const els = makeElements();
    applyRating(els, { up: 0, down: 1, userRating: -1 });
    expect(els.rateUp.classList.toggle).toHaveBeenCalledWith('active-up', false);
    expect(els.rateDown.classList.toggle).toHaveBeenCalledWith('active-down', true);
  });

  it('removes both active classes when userRating === 0', () => {
    const els = makeElements();
    applyRating(els, { up: 0, down: 0, userRating: 0 });
    expect(els.rateUp.classList.toggle).toHaveBeenCalledWith('active-up', false);
    expect(els.rateDown.classList.toggle).toHaveBeenCalledWith('active-down', false);
  });
});

describe('submitRating', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('does nothing when songKey is null', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await submitRating(null, 1, makeElements());
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('POSTs correct JSON body to /api/ratings', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ up: 1, down: 0, userRating: 1 }),
    });
    const els = makeElements();
    await submitRating('artist|title', 1, els);
    expect(fetchSpy).toHaveBeenCalledWith('/api/ratings', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ song: 'artist|title', rating: 1 }),
    }));
  });

  it('calls applyRating with response data on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ up: 2, down: 1, userRating: 1 }),
    });
    const els = makeElements();
    await submitRating('artist|title', 1, els);
    expect(els.upCount.textContent).toBe(2);
    expect(els.downCount.textContent).toBe(1);
  });

  it('silently handles fetch errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));
    await expect(submitRating('a|b', 1, makeElements())).resolves.toBeUndefined();
  });
});

describe('fetchRatings', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('GETs the correct encoded URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ up: 0, down: 0, userRating: 0 }),
    });
    await fetchRatings('artist|title', makeElements());
    expect(fetchSpy).toHaveBeenCalledWith('/api/ratings?song=artist%7Ctitle');
  });

  it('calls applyRating with response data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ up: 3, down: 2, userRating: -1 }),
    });
    const els = makeElements();
    await fetchRatings('a|b', els);
    expect(els.upCount.textContent).toBe(3);
    expect(els.downCount.textContent).toBe(2);
  });

  it('silently handles fetch errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));
    await expect(fetchRatings('a|b', makeElements())).resolves.toBeUndefined();
  });
});

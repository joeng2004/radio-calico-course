/**
 * Ratings module — pure logic, no global DOM references.
 * Elements are passed in so functions are testable without a real browser.
 */

export function applyRating(elements, { up, down, userRating }) {
  elements.upCount.textContent = up;
  elements.downCount.textContent = down;
  elements.rateUp.classList.toggle('active-up', userRating === 1);
  elements.rateDown.classList.toggle('active-down', userRating === -1);
}

export async function fetchRatings(songKey, elements) {
  try {
    const res = await fetch('/api/ratings?song=' + encodeURIComponent(songKey));
    if (res.ok) applyRating(elements, await res.json());
  } catch (_) {}
}

export async function submitRating(songKey, rating, elements) {
  if (!songKey) return;
  try {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song: songKey, rating })
    });
    if (res.ok) applyRating(elements, await res.json());
  } catch (_) {}
}

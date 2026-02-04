// OpenRouteService API integration via Next.js API route (avoids CORS issues)
// Free API key available at https://openrouteservice.org/dev/#/signup
// For production, set NEXT_PUBLIC_ORS_API_KEY environment variable

const CLIENT_TIMEOUT_MS = 20000;
const CLIENT_MAX_RETRIES = 3;
const CLIENT_RETRY_DELAY_MS = 600;

export interface RouteResult {
  distance: number; // in miles
  duration: number; // in minutes
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof TypeError && err.message === 'Failed to fetch') return true;
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    return m.includes('fetch') || m.includes('network') || m.includes('timeout') || err.name === 'AbortError';
  }
  return false;
}

export async function getRouteDistance(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteResult> {
  const url = `/api/route?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}`;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= CLIENT_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error || `HTTP ${response.status}`;
        throw new Error(msg);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      return {
        distance: data.distance,
        duration: data.duration,
      };
    } catch (err: unknown) {
      lastError = err;
      if (isRetryableError(err) && attempt < CLIENT_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, CLIENT_RETRY_DELAY_MS * attempt));
        continue;
      }
      const message = err instanceof Error ? err.message : 'Failed to calculate route';
      if (message === 'Failed to fetch' || (typeof message === 'string' && message.toLowerCase().includes('fetch'))) {
        throw new Error('Unable to reach route service. Check your connection and try again.');
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request took too long. Please try again.');
      }
      throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to calculate route. Please try again.');
}

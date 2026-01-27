// OpenRouteService API integration via Next.js API route (avoids CORS issues)
// Free API key available at https://openrouteservice.org/dev/#/signup
// For production, set NEXT_PUBLIC_ORS_API_KEY environment variable

export interface RouteResult {
  distance: number; // in miles
  duration: number; // in minutes
}

export async function getRouteDistance(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteResult> {
  try {
    // Use Next.js API route to proxy the request (avoids CORS)
    const url = `/api/route?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      distance: data.distance,
      duration: data.duration,
    };
  } catch (error: any) {
    console.error('Error fetching route:', error);
    throw error;
  }
}

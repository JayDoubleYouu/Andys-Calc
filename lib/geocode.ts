// UK Postcode Geocoding using postcodes.io via Next.js API route (avoids CORS issues)

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export async function geocodePostcode(postcode: string): Promise<Coordinates> {
  try {
    // Use Next.js API route to proxy the request (avoids CORS)
    const response = await fetch(`/api/geocode?postcode=${encodeURIComponent(postcode)}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error: any) {
    console.error('Error geocoding postcode:', postcode, error);
    if (error.message) {
      throw error;
    }
    throw new Error(`Failed to geocode postcode: ${postcode}`);
  }
}

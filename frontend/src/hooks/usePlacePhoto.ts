import { useState, useEffect } from 'react';

export type PhotoCategory = 'destination' | 'hotel' | 'activity' | 'food';

interface UsePlacePhotoResult {
  photo: string;
  loading: boolean;
  error: Error | null;
}

// Highly curated premium Unsplash images as fallbacks
const FALLBACK_IMAGES: Record<PhotoCategory, string[]> = {
  destination: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', // Goa / Tropical beach
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', // Bali
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80', // Dubai
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', // Switzerland
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80', // Japan / Tokyo
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80', // Generic Travel
  ],
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', // Boutique resort
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80', // Beach pool
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80', // Cozy bed
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', // Resort
  ],
  activity: [
    'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80', // Hiking
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80', // Surfing
    'https://images.unsplash.com/photo-1530521954074-e64f6810b3f6?auto=format&fit=crop&w=800&q=80', // Spa
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80', // Roadtrip / explore
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', // Gourmet
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80', // Healthy food
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', // Bistro
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80', // Fine dining
  ],
};

// Smart fallback selection based on search query keywords
function getSmartFallback(query: string, category: PhotoCategory): string {
  const q = query.toLowerCase();
  const list = FALLBACK_IMAGES[category];

  if (category === 'destination') {
    if (q.includes('goa') || q.includes('beach') || q.includes('sea')) return list[0];
    if (q.includes('bali') || q.includes('ubud') || q.includes('forest')) return list[1];
    if (q.includes('dubai') || q.includes('safari') || q.includes('burj')) return list[2];
    if (q.includes('switzerland') || q.includes('alps') || q.includes('snow') || q.includes('mountain')) return list[3];
    if (q.includes('japan') || q.includes('tokyo') || q.includes('kyoto') || q.includes('pagoda') || q.includes('art')) return list[4];
  }

  if (category === 'hotel') {
    if (q.includes('taj') || q.includes('exotica') || q.includes('goa')) return list[0];
    if (q.includes('beach') || q.includes('resort')) return list[1];
    if (q.includes('zostel') || q.includes('hostel')) return 'https://images.unsplash.com/photo-1555854817-5b2260d50c49?auto=format&fit=crop&w=800&q=80'; // Hostel/Dorm
  }

  // Otherwise, return a deterministic hash index of the query to keep the same image for the same query
  let hash = 0;
  for (let i = 0; i < q.length; i++) {
    hash = q.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % list.length;
  return list[idx];
}

export function usePlacePhoto(query: string, category: PhotoCategory): UsePlacePhotoResult {
  const [photo, setPhoto] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setPhoto(FALLBACK_IMAGES[category][0]);
      setLoading(false);
      return;
    }

    const cleanQuery = query.trim();
    const cacheKey = `voira_photo_cache_${category}_${cleanQuery.toLowerCase()}`;

    // 1. Check LocalStorage Cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setPhoto(cached);
      setLoading(false);
      return;
    }

    // 2. Perform Pexels Fetch if API key exists, otherwise use Fallback
    const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
    if (!apiKey) {
      const fallback = getSmartFallback(cleanQuery, category);
      localStorage.setItem(cacheKey, fallback);
      setPhoto(fallback);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchPhoto() {
      try {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanQuery + ' ' + category)}&per_page=1`;
        const res = await fetch(url, {
          headers: {
            Authorization: apiKey,
          },
        });

        if (!res.ok) {
          throw new Error(`Pexels API responded with status ${res.status}`);
        }

        const data = await res.json();
        let imageUrl = '';

        if (data.photos && data.photos.length > 0) {
          imageUrl = data.photos[0].src.large || data.photos[0].src.medium;
        } else {
          // If query + category returns nothing, try searching only by the query name
          const fallbackUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanQuery)}&per_page=1`;
          const fallbackRes = await fetch(fallbackUrl, {
            headers: {
              Authorization: apiKey,
            },
          });
          const fallbackData = await fallbackRes.json();
          if (fallbackData.photos && fallbackData.photos.length > 0) {
            imageUrl = fallbackData.photos[0].src.large || fallbackData.photos[0].src.medium;
          }
        }

        if (!imageUrl) {
          imageUrl = getSmartFallback(cleanQuery, category);
        }

        if (isMounted) {
          localStorage.setItem(cacheKey, imageUrl);
          setPhoto(imageUrl);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching Pexels photo, loading fallback:', err);
        if (isMounted) {
          const fallback = getSmartFallback(cleanQuery, category);
          localStorage.setItem(cacheKey, fallback);
          setPhoto(fallback);
          setError(err);
          setLoading(false);
        }
      }
    }

    fetchPhoto();

    return () => {
      isMounted = false;
    };
  }, [query, category]);

  return { photo, loading, error };
}

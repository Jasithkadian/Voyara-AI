import React, { useEffect, useState, useRef } from 'react';

export interface MapMarkerItem {
  name: string;
  category: 'Hotel' | 'Activity' | 'Restaurant';
  lat?: number;
  lng?: number;
}

interface MapWidgetProps {
  destination: string;
  items: MapMarkerItem[];
  focusedIndex: number | null;
  onMarkerClick: (index: number) => void;
  height?: string;
}

// Global script & CSS loader for Leaflet
let leafletPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise<void>((resolve, reject) => {
    // Check if Leaflet is already loaded globally
    if ((window as any).L) {
      resolve();
      return;
    }

    // 1. Inject Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // 2. Inject Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Leaflet JS CDN'));
    };
    document.body.appendChild(script);
  });

  return leafletPromise;
}

// Deterministic center coordinates for popular cities
function getCenterForDestination(dest: string): [number, number] {
  const d = dest.toLowerCase().trim();
  if (d.includes('goa')) return [15.2993, 74.1240];
  if (d.includes('bali')) return [-8.4095, 115.1889];
  if (d.includes('dubai')) return [25.2048, 55.2708];
  if (d.includes('switzerland') || d.includes('zurich')) return [47.3769, 8.5417];
  if (d.includes('japan') || d.includes('tokyo')) return [35.6762, 139.6503];
  if (d.includes('delhi')) return [28.6139, 77.2090];
  if (d.includes('mumbai')) return [18.9750, 72.8258];
  if (d.includes('paris')) return [48.8566, 2.3522];
  if (d.includes('london')) return [51.5074, -0.1278];
  if (d.includes('new york')) return [40.7128, -74.0060];

  // Stable string hashing fallback
  let hash = 0;
  for (let i = 0; i < d.length; i++) {
    hash = d.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generate lat: [10, 50], lng: [-40, 100]
  const lat = 10 + (Math.abs(hash) % 40) + 0.1234;
  const lng = -20 + (Math.abs(hash) % 110) + 0.5678;
  return [lat, lng];
}

export const MapWidget: React.FC<MapWidgetProps> = ({
  destination,
  items,
  focusedIndex,
  onMarkerClick,
  height = '100%',
}) => {
  const [leafletReady, setLeafletReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Load Leaflet JS & CSS
  useEffect(() => {
    loadLeaflet()
      .then(() => setLeafletReady(true))
      .catch(err => );
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current) return;

    const L = (window as any).L;
    const center = getCenterForDestination(destination);

    // Create Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView(center, 13);

    // Add CartoDB voyager tiles (looks sleek, fitting brand modes)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leafletReady, destination]);

  // Plot and update Markers
  useEffect(() => {
    if (!leafletReady || !mapRef.current) return;

    const L = (window as any).L;
    const map = mapRef.current;
    const center = getCenterForDestination(destination);

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = L.latLngBounds([]);

    // Map each item to a mock latitude/longitude offset deterministically
    const plottedItems = items.map((item, idx) => {
      // Offset coords deterministically based on index so they fan out
      const offsetLat = (Math.sin(idx * 1.7) * 0.015) + (idx * 0.001);
      const offsetLng = (Math.cos(idx * 1.3) * 0.018) - (idx * 0.001);
      
      const lat = item.lat || (center[0] + offsetLat);
      const lng = item.lng || (center[1] + offsetLng);

      const isFocused = focusedIndex === idx;

      // Custom coral branding DIV icon with numbers
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 rounded-full border-2 border-warmWhite flex items-center justify-center font-sans font-bold text-xs shadow-md transition-all duration-300 ${
          isFocused 
            ? 'bg-primary text-warmWhite scale-115 ring-4 ring-primary/25 z-[1000]' 
            : 'bg-coral text-warmWhite hover:bg-coral/90 hover:scale-105'
        }">${idx + 1}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div class="font-sans p-1 text-[11px] text-left">
            <strong class="text-[var(--color-text-primary)] font-bold text-xs">${idx + 1}. ${item.name}</strong>
            <p class="text-[var(--color-text-secondary)] text-[10px] mt-0.5">${item.category}</p>
            ${item.price || item.rating ? `
              <div class="mt-1 pt-1 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[10px]">
                ${item.rating ? `<span class="font-bold flex items-center text-[var(--color-warning)]">★ ${item.rating}</span>` : ''}
                ${item.price ? `<span class="font-mono font-bold text-[var(--color-accent)]">${item.price}</span>` : ''}
              </div>
            ` : ''}
          </div>
        `, { closeButton: false });

      marker.on('click', () => {
        onMarkerClick(idx);
      });

      markersRef.current.push(marker);
      bounds.extend([lat, lng]);

      return { marker, lat, lng };
    });

    // Fit bounds automatically
    if (plottedItems.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Keep coordinates cached inside map reference
    (mapRef.current as any).plottedCoordinates = plottedItems;

  }, [leafletReady, items, destination, focusedIndex]);

  // Pan to focused index
  useEffect(() => {
    if (!leafletReady || !mapRef.current || focusedIndex === null) return;
    const map = mapRef.current;
    const plotted = (map as any).plottedCoordinates;

    if (plotted && plotted[focusedIndex]) {
      const { lat, lng, marker } = plotted[focusedIndex];
      map.setView([lat, lng], 14, { animate: true, duration: 0.8 });
      marker.openPopup();
    }
  }, [leafletReady, focusedIndex]);

  return (
    <div className="w-full relative rounded-lg border border-stoneMuted/60 dark:border-dark-border/60 overflow-hidden shadow-inner bg-stoneMuted/20" style={{ height }}>
      {!leafletReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stoneMuted/15 backdrop-blur-xs">
          <div className="w-8 h-8 rounded-full border-2 border-stoneMuted border-t-primary animate-spin" />
          <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mt-2 animate-pulse">Loading Map Widget...</span>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
};

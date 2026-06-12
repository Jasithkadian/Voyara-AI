import React, { useEffect, useState, useRef } from 'react';

export interface MapMarkerItem {
  name: string;
  category: 'Hotel' | 'Activity' | 'Restaurant';
  lat?: number;
  lng?: number;
  price?: string | number;
  rating?: string | number;
}

interface LeafletTileLayer {
  addTo: (map: LeafletMap) => LeafletTileLayer;
}
interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (content: string, options?: Record<string, unknown>) => LeafletMarker;
  on: (event: string, callback: () => void) => LeafletMarker;
  remove: () => void;
  openPopup: () => void;
  getLatLng: () => { lat: number; lng: number };
}
interface LeafletMap {
  setView: (center: [number, number], zoom: number, options?: Record<string, unknown>) => LeafletMap;
  remove: () => void;
  fitBounds: (bounds: LeafletLatLngBounds, options?: Record<string, unknown>) => LeafletMap;
  plottedCoordinates?: Array<{ lat: number; lng: number }>;
}
interface LeafletLatLngBounds {
  extend: (coords: [number, number]) => LeafletLatLngBounds;
}
interface LeafletGlobal {
  map: (el: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options?: Record<string, unknown>) => LeafletTileLayer;
  control: {
    zoom: (options?: Record<string, unknown>) => { addTo: (map: LeafletMap) => void };
  };
  latLngBounds: (coords: unknown[]) => LeafletLatLngBounds;
  divIcon: (options: Record<string, unknown>) => unknown;
  marker: (coords: [number, number], options?: Record<string, unknown>) => LeafletMarker;
}

interface MapWidgetProps {
  destination: string;
  items: MapMarkerItem[];
  focusedIndex: number | null;
  onMarkerClick: (index: number) => void;
  height?: string;
}

let leafletPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise<void>((resolve, reject) => {
    if ((window as unknown as { L?: LeafletGlobal }).L) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);

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

  let hash = 0;
  for (let i = 0; i < d.length; i++) {
    hash = d.charCodeAt(i) + ((hash << 5) - hash);
  }
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
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);

  useEffect(() => {
    loadLeaflet()
      .then(() => setLeafletReady(true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current) return;

    const L = (window as unknown as { L: LeafletGlobal }).L;
    const center = getCenterForDestination(destination);

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView(center, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leafletReady, destination]);

  // Stagger marker addition sequentially
  useEffect(() => {
    if (!leafletReady || !mapRef.current) return;

    const L = (window as unknown as { L: LeafletGlobal }).L;
    const map = mapRef.current;
    const center = getCenterForDestination(destination);

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = L.latLngBounds([]);
    const timeouts: number[] = [];

    const plottedItems = items.map((item, idx) => {
      const offsetLat = (Math.sin(idx * 1.7) * 0.015) + (idx * 0.001);
      const offsetLng = (Math.cos(idx * 1.3) * 0.018) - (idx * 0.001);
      
      const lat = item.lat || (center[0] + offsetLat);
      const lng = item.lng || (center[1] + offsetLng);

      const isFocused = focusedIndex === idx;

      // Custom div icons using Tailwind brand styles
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-sans font-bold text-xs shadow-md transition-all duration-300 ${
          isFocused 
            ? 'bg-[#2563EB] text-white scale-110 ring-4 ring-blue-500/25 z-[1000]' 
            : 'bg-[#7C3AED] text-white hover:bg-purple-600 hover:scale-105'
        }">${idx + 1}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Staggered addition of markers
      const t = window.setTimeout(() => {
        if (!mapRef.current) return;
        const marker = L.marker([lat, lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div class="font-sans p-1 text-[11px] text-left">
              <strong class="text-stone-900 font-bold text-xs">${idx + 1}. ${item.name}</strong>
              <p class="text-stone-500 text-[10px] mt-0.5">${item.category}</p>
              ${item.price || item.rating ? `
                <div class="mt-1 pt-1 border-t border-stone-100 flex items-center justify-between text-[10px]">
                  ${item.rating ? `<span class="font-bold flex items-center text-amber-500">★ ${item.rating}</span>` : ''}
                  ${item.price ? `<span class="font-mono font-bold text-pink-500">${item.price}</span>` : ''}
                </div>
              ` : ''}
            </div>
          `, { closeButton: false });

        marker.on('click', () => {
          onMarkerClick(idx);
        });

        markersRef.current.push(marker);
      }, idx * 150);

      timeouts.push(t);
      bounds.extend([lat, lng]);

      return { lat, lng };
    });

    if (plottedItems.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapRef.current.plottedCoordinates = plottedItems;

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [leafletReady, items, destination, focusedIndex, onMarkerClick]);

  // Pan to focused index
  useEffect(() => {
    if (!leafletReady || !mapRef.current || focusedIndex === null) return;
    const map = mapRef.current;
    const plotted = map.plottedCoordinates;

    if (plotted && plotted[focusedIndex]) {
      const { lat, lng } = plotted[focusedIndex];
      map.setView([lat, lng], 14, { animate: true, duration: 0.8 });
      
      // Stagger lookup to ensure marker exists before opening popup
      setTimeout(() => {
        const marker = markersRef.current.find(m => {
          const latlng = m.getLatLng();
          return Math.abs(latlng.lat - lat) < 0.0001 && Math.abs(latlng.lng - lng) < 0.0001;
        });
        if (marker) {
          marker.openPopup();
        }
      }, focusedIndex * 150 + 50);
    }
  }, [leafletReady, focusedIndex]);

  return (
    <div className="w-full relative rounded-2xl border border-white/10 overflow-hidden shadow-inner bg-white/5" style={{ height }}>
      {!leafletReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-xs">
          <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-purple-500 animate-spin" />
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2 animate-pulse">Loading Map...</span>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
};

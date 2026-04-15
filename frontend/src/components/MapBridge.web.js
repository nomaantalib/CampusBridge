import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

const WebMap = ({ children, initialRegion, style, onMapReady }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  useEffect(() => {
    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setIsLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsLeafletLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLeafletLoaded && mapRef.current) {
      if (!mapInstance.current) {
        const L = window.L;
        const { latitude, longitude, latitudeDelta } = initialRegion || { latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.05 };
        
        const zoom = Math.round(Math.log2(360 / latitudeDelta));

        mapInstance.current = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([latitude, longitude], zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);

        if (onMapReady) onMapReady();
      } else if (initialRegion) {
        // If map exists, animate to new region
        const L = window.L;
        const zoom = Math.round(Math.log2(360 / initialRegion.latitudeDelta));
        mapInstance.current.setView([initialRegion.latitude, initialRegion.longitude], zoom, { animate: true });
      }
    }
  }, [isLeafletLoaded, initialRegion]);

  return (
    <View style={[style, styles.container]}>
      {!isLeafletLoaded && <ActivityIndicator color="#FF8C69" />}
      <div 
        ref={mapRef} 
        style={{ width: '100%', height: '100%', position: 'absolute' }} 
      />
      {isLeafletLoaded && mapInstance.current && (
          <MapContext.Provider value={mapInstance.current}>
              {children}
          </MapContext.Provider>
      )}
    </View>
  );
};

const MapContext = React.createContext(null);

const Marker = ({ coordinate, onPress, children }) => {
    const map = React.useContext(MapContext);
    const markerRef = useRef(null);

    useEffect(() => {
        if (!map || !window.L) return;
        const L = window.L;
        
        // Custom icon to allow React children (like the colored markers)
        const customIcon = L.divIcon({
            html: '<div id="marker-' + Math.random() + '"></div>',
            className: 'custom-leaflet-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        markerRef.current = L.marker([coordinate.latitude, coordinate.longitude], { icon: customIcon }).addTo(map);
        
        if (onPress) {
            markerRef.current.on('click', onPress);
        }

        return () => {
            if (markerRef.current) map.removeLayer(markerRef.current);
        };
    }, [map, coordinate.latitude, coordinate.longitude]);

    // We can't easily port the React Native "children" into the Leaflet DOM node 
    // without using portals, but for now we effectively sync coordinates.
    return null;
};

const UrlTile = () => null; // Leaflet handles tiles globally in the base map for this bridge

export default WebMap;
export { Marker, UrlTile };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF0', position: 'relative' }
});

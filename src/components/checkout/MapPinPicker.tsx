// src/components/checkout/MapPinPicker.tsx
import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon path (required by bundlers)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPinPickerProps {
  center?: [number, number];
  onPinChange?: (lat: number, lng: number) => void;
  editable?: boolean;
  height?: string;
}

const MapPinPicker: React.FC<MapPinPickerProps> = ({
  center = [9.0243, 38.7468], // Addis Ababa default
  onPinChange,
  editable = true,
  height = '300px'
}) => {
  const [position, setPosition] = useState<[number, number]>(center);

  const handleDragEnd = useCallback(
    (e: L.LeafletEvent) => {
      const marker = e.target;
      const newPos = marker.getLatLng();
      setPosition([newPos.lat, newPos.lng]);
      onPinChange?.(newPos.lat, newPos.lng);
    },
    [onPinChange]
  );

  // Click on map to move the pin
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        if (!editable) return;
        setPosition([e.latlng.lat, e.latlng.lng]);
        onPinChange?.(e.latlng.lat, e.latlng.lng);
      }
    });
    return null;
  };

  return (
    <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={editable}
        dragging={editable}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={position}
          draggable={editable}
          eventHandlers={{ dragend: handleDragEnd }}
        />
        <MapClickHandler />
      </MapContainer>
    </div>
  );
};

export default MapPinPicker;
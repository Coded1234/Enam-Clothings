import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiMapPin, FiLoader } from "react-icons/fi";

// Fix leaflet icon issue
if (L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Component to handle map clicks
function LocationMarker({ position, setPosition, onLocationSelect }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : <Marker position={position} />;
}

const AddressMapPicker = ({ onAddressSelect, currentPosition }) => {
  const defaultCenter = [5.6037, -0.187]; // Accra, Ghana
  const [position, setPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  
  // Detect if user is on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const [showMobileMap, setShowMobileMap] = useState(false);
  
  // Update position if currentPosition changes
  useEffect(() => {
    if (currentPosition) {
      const newPos = { lat: currentPosition.latitude, lng: currentPosition.longitude };
      setPosition(newPos);
      setMapCenter([currentPosition.latitude, currentPosition.longitude]);
    }
  }, [currentPosition]);

  // Reverse geocode: Convert coordinates to address
  const reverseGeocode = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&countrycodes=gh`,
        {
          headers: {
            "User-Agent": "EcommerceWebsite/1.0",
          },
        }
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const formattedAddress = [
          addr.road || addr.suburb || addr.neighbourhood,
          addr.suburb,
          addr.city || addr.town,
        ]
          .filter(Boolean)
          .join(", ");

        setAddress(formattedAddress || data.display_name);

        // Pass address data to parent
        onAddressSelect({
          address: formattedAddress || data.display_name,
          city: addr.city || addr.town || addr.state || "Accra",
          latitude: lat,
          longitude: lng,
          fullAddress: data.display_name,
        });
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setAddress("Unable to get address. Please enter manually.");
    } finally {
      setLoading(false);
    }
  }, [onAddressSelect]);

  // Handle location selection
  const handleLocationSelect = useCallback((latlng) => {
    reverseGeocode(latlng.lat, latlng.lng);
  }, [reverseGeocode]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setPosition(newPos);
        setMapCenter([position.coords.latitude, position.coords.longitude]);
        reverseGeocode(newPos.lat, newPos.lng);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location. Please select on the map.");
        setLoading(false);
      }
    );
  };

  // Open full-screen map for mobile
  const openMobileMap = () => {
    setShowMobileMap(true);
  };

  // Close mobile map
  const closeMobileMap = () => {
    setShowMobileMap(false);
  };

  return (
    <>
      {/* Mobile Full-Screen Map Modal */}
      {isMobile && showMobileMap && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-primary-600 text-white p-4 flex items-center justify-between shadow-lg">
            <h3 className="font-semibold text-lg">Select Delivery Location</h3>
            <button
              onClick={closeMobileMap}
              className="text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-3 border-b border-blue-200">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <FiMapPin className="mt-0.5 flex-shrink-0" />
              <span>Tap anywhere on the map to select your delivery location</span>
            </p>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <LocationMarker
                position={position}
                setPosition={setPosition}
                onLocationSelect={handleLocationSelect}
              />
            </MapContainer>
          </div>

          {/* Selected Address Display */}
          {address && (
            <div className="p-4 bg-green-50 border-t border-green-200">
              <p className="text-sm font-medium text-green-800 mb-1">
                Selected Location:
              </p>
              <p className="text-sm text-green-700">{address}</p>
              {position && (
                <p className="text-xs text-green-600 mt-1">
                  {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                </p>
              )}
              <button
                onClick={closeMobileMap}
                className="mt-3 w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Confirm Location
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="absolute inset-x-0 top-20 mx-4">
              <div className="bg-white shadow-lg rounded-lg p-3 flex items-center gap-2">
                <FiLoader className="animate-spin text-primary-600" />
                <span className="text-sm">Getting address...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 flex items-start gap-2">
            <FiMapPin className="mt-0.5 flex-shrink-0" />
            <span>
              {isMobile 
                ? "Tap the button below to open the map and select your delivery location."
                : "Click on the map to select your delivery location, or use the button below to detect your current location automatically."
              }
            </span>
          </p>
        </div>

        {/* Mobile: Open Map Button */}
        {isMobile && (
          <button
            type="button"
            onClick={openMobileMap}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            <FiMapPin />
            Open Map to Select Location
          </button>
        )}

        {/* Get Current Location Button */}
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin" />
              Getting location...
            </>
          ) : (
            <>
              <FiMapPin />
              Use My Current Location
            </>
          )}
        </button>

        {/* Map - Only show on desktop */}
        {!isMobile && (
          <div className="border-2 border-gray-300 rounded-xl overflow-hidden relative" style={{ height: "400px", zIndex: 1 }}>
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
              whenCreated={(map) => {
                setTimeout(() => {
                  map.invalidateSize();
                }, 100);
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <LocationMarker
                position={position}
                setPosition={setPosition}
                onLocationSelect={handleLocationSelect}
              />
            </MapContainer>
          </div>
        )}

        {/* Selected Address Display */}
        {address && !showMobileMap && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800 mb-1">
              Selected Location:
            </p>
            <p className="text-sm text-green-700">{address}</p>
            {position && (
              <p className="text-xs text-green-600 mt-2">
                Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </p>
            )}
          </div>
        )}
        </div>
    </>
  );
};

export default AddressMapPicker;

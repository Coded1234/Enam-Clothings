"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import maplibregl from "maplibre-gl/dist/maplibre-gl";
import {
  FiMapPin,
  FiLoader,
  FiSearch,
  FiX,
  FiNavigation,
  FiPlus,
  FiMinus,
} from "react-icons/fi";

const MAPLIBRE_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-base",
      type: "raster",
      source: "osm",
    },
  ],
};

function MapLibreMap({
  center,
  zoom,
  scrollWheelZoom,
  style,
  position,
  onLocationSelect,
  onMapReady,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAPLIBRE_STYLE,
      center: [center[1], center[0]],
      zoom,
      scrollZoom: scrollWheelZoom ?? true,
      attributionControl: false,
      antialias: true,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on("click", (e) => {
      const latlng = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      if (markerRef.current) {
        markerRef.current.setLngLat([latlng.lng, latlng.lat]);
      } else {
        markerRef.current = new maplibregl.Marker({ color: "#0f172a" })
          .setLngLat([latlng.lng, latlng.lat])
          .addTo(map);
      }

      map.flyTo({
        center: [latlng.lng, latlng.lat],
        zoom: Math.max(map.getZoom(), 15),
        duration: 600,
        essential: true,
      });

      onLocationSelect?.(latlng);
    });

    if (position) {
      markerRef.current = new maplibregl.Marker({ color: "#0f172a" })
        .setLngLat([position.lng, position.lat])
        .addTo(map);
    }

    map.on("load", () => map.resize());
    setTimeout(() => map.resize(), 100);

    mapRef.current = map;
    onMapReady?.(map);

    return () => {
      onMapReady?.(null);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: [center[1], center[0]],
        zoom,
        duration: 500,
        essential: true,
      });
    }
  }, [center[0], center[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current) return;

    if (position) {
      if (markerRef.current) {
        markerRef.current.setLngLat([position.lng, position.lat]);
      } else {
        markerRef.current = new maplibregl.Marker({ color: "#0f172a" })
          .setLngLat([position.lng, position.lat])
          .addTo(mapRef.current);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [position?.lat, position?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} style={style} />;
}

const AddressMapPicker = ({ onAddressSelect, currentPosition }) => {
  const defaultCenter = [5.6037, -0.187]; // Accra, Ghana
  const [position, setPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  const isMobile =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const [showMobileMap, setShowMobileMap] = useState(false);

  useEffect(() => {
    if (currentPosition) {
      const newPos = {
        lat: currentPosition.latitude,
        lng: currentPosition.longitude,
      };
      setPosition(newPos);
      setMapCenter([currentPosition.latitude, currentPosition.longitude]);
    }
  }, [currentPosition]);

  const reverseGeocode = useCallback(
    async (lat, lng) => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&countrycodes=gh`,
          {
            headers: {
              "User-Agent": "EcommerceWebsite/1.0",
            },
          },
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

          const region = addr.state || addr.state_district || "";
          onAddressSelect({
            address: formattedAddress || data.display_name,
            city: addr.city || addr.town || addr.state || "Accra",
            region,
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
    },
    [onAddressSelect],
  );

  const handleMapClick = useCallback(
    (latlng) => {
      setPosition(latlng);
      reverseGeocode(latlng.lat, latlng.lng);
    },
    [reverseGeocode],
  );

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
        alert(
          "Unable to get your location. Please check your browser permissions.",
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const openMobileMap = () => {
    setShowMobileMap(true);
  };

  const closeMobileMap = () => {
    setShowMobileMap(false);
  };

  const handleMapReady = useCallback((map) => {
    setMapInstance(map);
  }, []);

  const zoomIn = () => mapInstance?.zoomIn();

  const zoomOut = () => mapInstance?.zoomOut();

  const focusSelectedLocation = () => {
    if (!mapInstance) return;
    if (position) {
      mapInstance.flyTo({
        center: [position.lng, position.lat],
        zoom: 16,
        duration: 600,
        essential: true,
      });
      return;
    }
    mapInstance.flyTo({
      center: [mapCenter[1], mapCenter[0]],
      zoom: 13,
      duration: 600,
      essential: true,
    });
  };

  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gh&limit=5`,
        {
          headers: {
            "User-Agent": "EcommerceWebsite/1.0",
          },
        },
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchLocation(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchResultSelect = (result) => {
    const newPos = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
    setPosition(newPos);
    setMapCenter([newPos.lat, newPos.lng]);
    reverseGeocode(newPos.lat, newPos.lng);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <>
      {isMobile && showMobileMap && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="h-full w-full sm:h-[92vh] sm:max-w-2xl bg-white dark:bg-surface flex flex-col sm:rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-[linear-gradient(120deg,#0f172a_0%,#111827_45%,#1f2937_100%)] text-white px-4 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                Select Delivery Location
              </h3>
              <button
                onClick={closeMobileMap}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close map"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-4 bg-white dark:bg-surface border-b border-slate-200 dark:border-primary-700">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for an area in Ghana..."
                  className="w-full pl-11 pr-11 py-3.5 border border-slate-300 dark:border-primary-700 rounded-xl bg-white dark:bg-secondary-600 text-slate-800 dark:text-gold-light focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <FiX />
                  </button>
                )}
                {searching && (
                  <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 animate-spin" />
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 bg-white dark:bg-secondary-600 border border-slate-200 dark:border-primary-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.place_id}
                      onClick={() => handleSearchResultSelect(result)}
                      className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-secondary-500 border-b border-slate-100 dark:border-primary-700 last:border-b-0 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-800 dark:text-gold-light">
                        {result.display_name}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
              <p className="text-sm text-amber-900 flex items-start gap-2">
                <FiMapPin className="mt-0.5 flex-shrink-0" />
                <span>Tap the map to place your delivery pin accurately.</span>
              </p>
            </div>

            <div className="flex-1 relative bg-slate-100">
              <MapLibreMap
                center={mapCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
                position={position}
                onLocationSelect={handleMapClick}
                onMapReady={handleMapReady}
              />

              <div className="absolute top-3 left-3 rounded-full bg-white/95 shadow-md px-3 py-1.5 text-xs font-medium text-slate-700">
                Delivery map
              </div>
              <div className="absolute top-3 right-3 pointer-events-none">
                <div className="pointer-events-auto flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-white/95">
                  <button
                    type="button"
                    onClick={zoomIn}
                    className="w-10 h-10 grid place-items-center text-slate-700 hover:bg-slate-50"
                    aria-label="Zoom in"
                  >
                    <FiPlus />
                  </button>
                  <button
                    type="button"
                    onClick={zoomOut}
                    className="w-10 h-10 grid place-items-center text-slate-700 hover:bg-slate-50 border-t border-slate-200"
                    aria-label="Zoom out"
                  >
                    <FiMinus />
                  </button>
                  <button
                    type="button"
                    onClick={focusSelectedLocation}
                    className="w-10 h-10 grid place-items-center text-slate-700 hover:bg-slate-50 border-t border-slate-200"
                    aria-label="Center map"
                  >
                    <FiNavigation />
                  </button>
                </div>
              </div>
            </div>

            {address && (
              <div className="p-4 bg-emerald-50 border-t border-emerald-200">
                <p className="text-sm font-medium text-emerald-800 mb-1">
                  Selected Location
                </p>
                <p className="text-sm text-emerald-700">{address}</p>
                {position && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                  </p>
                )}
                <button
                  onClick={closeMobileMap}
                  className="mt-3 w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                >
                  Confirm Location
                </button>
              </div>
            )}

            {loading && (
              <div className="absolute inset-x-0 top-20 mx-4">
                <div className="bg-white/95 shadow-lg rounded-xl p-3 flex items-center gap-2 border border-slate-200">
                  <FiLoader className="animate-spin text-primary-600" />
                  <span className="text-sm text-slate-700">
                    Getting address...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {!isMobile && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location in Ghana..."
              className="w-full pl-11 pr-11 py-3.5 border border-slate-300 rounded-2xl bg-white text-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
            {searching && (
              <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 animate-spin" />
            )}

            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleSearchResultSelect(result)}
                    className="w-full text-left p-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors flex items-start gap-3"
                  >
                    <FiMapPin className="text-primary-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {result.display_name.split(",")[0]}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {result.display_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-700 flex items-start gap-2">
            <FiMapPin className="mt-0.5 flex-shrink-0 text-primary-600" />
            <span>
              {isMobile
                ? "Open the map to drop a pin, then confirm your location."
                : "Click to drop a delivery pin or use auto-detect for your current location."}
            </span>
          </p>
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={openMobileMap}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <FiMapPin />
            Open Map to Select Location
          </button>
        )}

        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-400 transition-colors flex items-center justify-center gap-2 shadow-sm"
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

        {!isMobile && (
          <div
            className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-[0_16px_42px_-24px_rgba(15,23,42,0.6)]"
            style={{ height: "420px", zIndex: 1 }}
          >
            <MapLibreMap
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
              position={position}
              onLocationSelect={handleMapClick}
              onMapReady={handleMapReady}
            />

            <div className="absolute top-3 left-3 rounded-full bg-white/95 shadow-md px-3 py-1.5 text-xs font-medium text-slate-700">
              Delivery map
            </div>
            <div className="absolute top-3 right-3 pointer-events-none">
              <div className="pointer-events-auto flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-white/95">
                <button
                  type="button"
                  onClick={zoomIn}
                  className="w-10 h-10 grid place-items-center text-slate-700 hover:bg-slate-50"
                  aria-label="Zoom in"
                >
                  <FiPlus />
                </button>
                <button
                  type="button"
                  onClick={zoomOut}
                  className="w-10 h-10 grid place-items-center text-slate-700 hover:bg-slate-50 border-t border-slate-200"
                  aria-label="Zoom out"
                >
                  <FiMinus />
                </button>
                <button
                  type="button"
                  onClick={focusSelectedLocation}
                  className="w-10 h-10 grid place-items-center text-slate-700 hover:bg-slate-50 border-t border-slate-200"
                  aria-label="Center map"
                >
                  <FiNavigation />
                </button>
              </div>
            </div>

            {position && (
              <div className="absolute left-3 bottom-3 rounded-full bg-white/95 shadow-md px-3 py-1.5 text-[11px] font-medium text-slate-700">
                {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
              </div>
            )}
          </div>
        )}

        {address && !showMobileMap && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
            <p className="text-sm font-medium text-emerald-800 mb-1">
              Selected Location:
            </p>
            <p className="text-sm text-emerald-700">{address}</p>
            {position && (
              <p className="text-xs text-emerald-600 mt-2">
                Coordinates: {position.lat.toFixed(6)},{" "}
                {position.lng.toFixed(6)}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default AddressMapPicker;

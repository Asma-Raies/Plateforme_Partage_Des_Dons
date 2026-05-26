import { useState, useEffect, useRef } from "react";
import {
  loadGoogleMaps,
  isGoogleMapsLoaded,
} from "../utils/googleMapsLoader.js";

/**
 * DonorLocationMap Component
 * Allows donors to select their location on a map for drop-off appointments
 * Features:
 * - Click to place marker at donor's location
 * - Displays coordinates and address
 * - Works with or without Google Maps API key
 */
export default function DonorLocationMap({
  onLocationChange,
  initialLocation = null,
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [location, setLocation] = useState(
    initialLocation || { lat: 36.8065, lng: 10.1686 },
  ); // Default to Tunis
  const [address, setAddress] = useState(
    "Click on the map to select your location",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [mapError, setMapError] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Initialize map when component mounts
  useEffect(() => {
    if (!apiKey || mapError || map) return;

    setIsLoading(true);

    const initMap = async () => {
      try {
        await loadGoogleMaps(apiKey);

        if (!mapRef.current || !window.google?.maps) {
          setIsLoading(false);
          return;
        }

        const newMap = new window.google.maps.Map(mapRef.current, {
          zoom: 13,
          center: location,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          mapId: "4b1582505377a17bf7c1343d",
        });

        newMap.addListener("click", handleMapClick);
        setMap(newMap);

        // Add default marker and address
        addMarkerToMap(newMap, location);
        reverseGeocode(location);

        setIsLoading(false);

        if (initialLocation) {
          addMarkerToMap(newMap, initialLocation);
          reverseGeocode(initialLocation);
        }
      } catch (error) {
        console.error("Failed to initialize map:", error);
        setMapError(true);
        setIsLoading(false);
      }
    };

    initMap();
  }, [apiKey]); // Only depend on apiKey

  // Handle map click to place marker
  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const newLocation = { lat, lng };

    setLocation(newLocation);
    addMarkerToMap(map, newLocation);
    reverseGeocode(newLocation);
    onLocationChange?.(newLocation);
  };

  // Add marker to map
  const addMarkerToMap = (mapInstance, loc) => {
    if (marker) {
      marker.map = null;
    }

    if (!window.google || !mapInstance) return;

    try {
      // Use Advanced Marker Element (new Google Maps standard)
      const newMarker = new window.google.maps.marker.AdvancedMarkerElement({
        position: loc,
        map: mapInstance,
        title: "Your Donation Location",
      });

      setMarker(newMarker);
      mapInstance.panTo(loc);
    } catch (error) {
      // Fallback to legacy Marker if AdvancedMarkerElement not available
      console.warn("AdvancedMarkerElement not available, using legacy Marker");
      const newMarker = new window.google.maps.Marker({
        position: loc,
        map: mapInstance,
        title: "Your Donation Location",
        icon: "http://maps.google.com/mapfiles/ms/icons/0091da.png", // Blue marker
      });

      setMarker(newMarker);
      mapInstance.panTo(loc);
    }
  };

  // Reverse geocode to get address (fallback to coordinates if API not available)
  const reverseGeocode = (loc) => {
    // Simply show coordinates - Geocoding API often has permission issues
    setAddress(`📍 Lat: ${loc.lat.toFixed(6)}, Lng: ${loc.lng.toFixed(6)}`);
  };

  // Use current geolocation
  const handleUseCurrentLocation = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setLocation(newLocation);
          onLocationChange?.(newLocation);
          reverseGeocode(newLocation);
          if (map) {
            addMarkerToMap(map, newLocation);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLoading(false);
          alert(
            "Unable to access your location. Please click on the map to select a location.",
          );
        },
      );
    }
  };

  // Fallback UI when API key is not available
  if (!apiKey) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4v2m0 0v2m0-2H9m3 0h3"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Google Maps API Not Configured
            </p>
            <p className="text-xs text-amber-700 mt-1">
              To use location selection, set up Google Maps API key in your
              .env.local file
            </p>
            <p className="text-xs text-amber-700 mt-2">
              Add:{" "}
              <code className="bg-amber-100 px-2 py-1 rounded">
                VITE_GOOGLE_MAPS_API_KEY=your_key
              </code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error UI when maps fail to load
  if (mapError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-900">
              Unable to Load Map
            </p>
            <p className="text-xs text-red-700 mt-1">
              Google Maps failed to load. Please check your API key
              configuration.
            </p>
            <button
              onClick={() => {
                setMapError(false);
                window.location.reload();
              }}
              className="mt-3 px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Loading state */}
      {isLoading && (
        <div className="w-full h-80 rounded-xl border-2 border-slate-200 shadow-sm bg-slate-100 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-slate-400 mx-auto mb-2"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <p className="text-sm text-slate-500">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      {!isLoading && (
        <div
          ref={mapRef}
          className="w-full h-80 rounded-xl border-2 border-slate-200 shadow-sm bg-slate-100"
        />
      )}

      {/* Current Location Address */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-900 mb-1">
              Selected Location
            </p>
            <p className="text-sm text-blue-700 break-words">{address}</p>
            <p className="text-xs text-blue-600 mt-1 font-mono">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
        <p className="text-xs text-slate-600 mb-2 font-semibold">💡 Tips:</p>
        <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
          <li>Click anywhere on the map to place your location marker</li>
          <li>
            Use the geolocation button to auto-detect your current location
          </li>
          <li>This is where the association will pick up your donation</li>
        </ul>
      </div>

      {/* Use Current Location Button */}
      <button
        onClick={handleUseCurrentLocation}
        disabled={isLoading}
        className="w-full py-2 px-4 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Detecting Location...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Use My Current Location
          </>
        )}
      </button>
    </div>
  );
}

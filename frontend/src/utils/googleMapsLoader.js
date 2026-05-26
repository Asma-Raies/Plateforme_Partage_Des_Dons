/**
 * Single-instance Google Maps loader
 * Ensures Google Maps API is loaded only once globally
 */

let googleMapsLoadingPromise = null;
let googleMapsLoaded = false;

export function loadGoogleMaps(apiKey) {
  // If already loaded, resolve immediately
  if (window.google?.maps) {
    return Promise.resolve();
  }

  // If already loading, return existing promise
  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise;
  }

  // Check if script already exists in DOM
  if (document.querySelector('script[src*="maps.googleapis.com"]')) {
    googleMapsLoaded = true;
    // Wait a bit for it to load
    googleMapsLoadingPromise = new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
    return googleMapsLoadingPromise;
  }

  // Load the script
  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    try {
      const script = document.createElement("script");
      script.type = "text/javascript";
      // Add loading=async parameter as per Google Maps best practices
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
      script.async = true;

      script.onload = () => {
        googleMapsLoaded = true;
        console.log("✅ Google Maps API loaded successfully");
        resolve();
      };

      script.onerror = (error) => {
        console.error("❌ Failed to load Google Maps:", error);
        googleMapsLoadingPromise = null;
        reject(new Error("Failed to load Google Maps"));
      };

      // Remove any existing maps scripts to prevent duplication
      const existingScripts = document.querySelectorAll(
        'script[src*="maps.googleapis.com"]',
      );
      existingScripts.forEach((s) => {
        if (s !== script) {
          s.remove();
        }
      });

      document.head.appendChild(script);
    } catch (error) {
      console.error("❌ Error creating script:", error);
      googleMapsLoadingPromise = null;
      reject(error);
    }
  });

  return googleMapsLoadingPromise;
}

export function isGoogleMapsLoaded() {
  return !!window.google?.maps;
}

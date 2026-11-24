// Google Map with the office pin and a "Get directions" button (Contact page).
// The key is public by design (every visitor's browser receives it), so it must be
// restricted to the site's domains in Google Cloud.
import { gateEmbed } from './consent.js';

const API_KEY = 'AIzaSyD2iysmi5G6GtjbNtmjZoFGYocOR3f-_CE';
const OFFICE = { lat: 51.5203121847596, lng: -0.07874600846277312 };
const PIN = 'https://cdn.prod.website-files.com/6a68dfaeda21c862740b9dd3/6a7c90d35d74f26a5cefe5e1_exclusive-pin.svg';
const ZOOM = 13;

let mapsLoading = null;
function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve();
  if (mapsLoading) return mapsLoading;
  mapsLoading = new Promise((resolve, reject) => {
    window.__exrMapsReady = resolve;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&loading=async&callback=__exrMapsReady`;
    script.async = true;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return mapsLoading;
}

// Click-to-load behind the 'functional' consent category once the cookie banner is
// live (see docs/consent.md). Before that, it loads on page view as it always did.
export default function map(root) {
  gateEmbed(root, 'functional', () => renderMap(root), {
    message: 'This map is provided by Google. Loading it shares your IP address with Google.',
    button: 'Load map',
  });
}

function renderMap(root) {
  loadGoogleMaps()
    .then(() => {
      const { maps } = window.google;
      const instance = new maps.Map(root, {
        center: OFFICE,
        zoom: ZOOM,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [{ elementType: 'all', stylers: [{ saturation: -100 }] }],
      });

      new maps.Marker({
        map: instance,
        position: OFFICE,
        icon: { url: PIN, scaledSize: new maps.Size(84, 84) },
      });

      const directions = document.createElement('a');
      directions.href = `https://www.google.com/maps/dir/?api=1&destination=${OFFICE.lat},${OFFICE.lng}`;
      directions.target = '_blank';
      directions.rel = 'noopener noreferrer';
      directions.textContent = 'Get directions';
      directions.style.cssText =
        'display:block;margin:10px;padding:10px 14px;background:#fff;color:#000;font:600 14px/1 sans-serif;text-decoration:none;box-shadow:0 1px 4px rgba(0,0,0,.3)';
      instance.controls[maps.ControlPosition.TOP_RIGHT].push(directions);
    })
    .catch(() => console.error('[exr] Google Maps failed to load.'));
}

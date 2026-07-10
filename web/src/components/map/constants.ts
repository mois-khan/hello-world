export const BASEMAPS = [
  {
    key: 'standard',
    label: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  },
  {
    key: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: '© Esri'
  },
  {
    key: 'terrain',
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
    attribution: '© OpenStreetMap contributors, © OpenTopoMap'
  }
];

export const MAP_PREVIEWS = {
  standard: 'https://mts0.google.com/vt/lyrs=m&hl=en&x=0&y=0&z=0',
  satellite: 'https://mts0.google.com/vt/lyrs=s&hl=en&x=0&y=0&z=0',
  terrain: 'https://mts0.google.com/vt/lyrs=p&hl=en&x=0&y=0&z=0'
};

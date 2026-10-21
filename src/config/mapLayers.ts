/**
 * Layer visibility contract shared by the township map and the overview
 * layer switcher. Kept in its own module so the map file only exports
 * components (React Fast Refresh friendly).
 */
export interface MapLayers {
  routes: boolean;
  issues: boolean;
  hazards: boolean;
  stations: boolean;
}

export const DEFAULT_LAYERS: MapLayers = {
  routes: true,
  issues: true,
  hazards: true,
  stations: true,
};

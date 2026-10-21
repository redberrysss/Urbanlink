import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import type {
  AccessibilityObstacle,
  LatLng,
  RecyclingStation,
  Report,
  SafetyHazard,
} from '@/types';
import { TOWNSHIP, ROUTE_EDGES, ROUTE_NODES } from '@/data/township';
import { createMarkerIcon, ICONS } from './markerIcons';
import { HAZARD_TYPE_META, REPORT_CATEGORY_META, REPORT_STATUS_META } from '@/utils/constants';
import { cn } from '@/utils/cn';
import { DEFAULT_LAYERS, type MapLayers } from '@/config/mapLayers';

export type { MapLayers };
export { DEFAULT_LAYERS };

export interface TownshipMapProps {
  layers?: Partial<MapLayers>;
  reports?: Report[];
  obstacles?: AccessibilityObstacle[];
  hazards?: SafetyHazard[];
  stations?: RecyclingStation[];
  routePath?: LatLng[];
  routeColor?: string;
  onSelectReport?: (report: Report) => void;
  onSelectObstacle?: (obstacle: AccessibilityObstacle) => void;
  onSelectHazard?: (hazard: SafetyHazard) => void;
  onSelectStation?: (station: RecyclingStation) => void;
  onMapClick?: (position: LatLng) => void;
  picking?: boolean;
  picked?: LatLng | null;
  center?: LatLng;
  zoom?: number;
  className?: string;
  fitTo?: LatLng[];
  showAttribution?: boolean;
}

function BoundsController({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], Math.max(map.getZoom(), 16));
      return;
    }
    map.fitBounds(
      L.latLngBounds(points.map((p) => [p.lat, p.lng] as LatLngExpression)),
      { padding: [48, 48], maxZoom: 17 },
    );
  }, [points, map]);
  return null;
}

function ClickController({
  onMapClick,
}: {
  onMapClick?: (position: LatLng) => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!onMapClick) return;
    const handler = (e: L.LeafletMouseEvent) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [map, onMapClick]);
  return null;
}

function BaseTileLayer({ attribution }: { attribution?: boolean }) {
  return (
    <TileLayer
      attribution={
        attribution
          ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          : undefined
      }
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={19}
    />
  );
}

export function TownshipMap({
  layers = {},
  reports = [],
  obstacles = [],
  hazards = [],
  stations = [],
  routePath,
  routeColor = '#176B5B',
  onSelectReport,
  onSelectObstacle,
  onSelectHazard,
  onSelectStation,
  onMapClick,
  picking,
  picked,
  center,
  zoom = 15,
  className,
  fitTo,
  showAttribution = true,
}: TownshipMapProps) {
  const merged: MapLayers = { ...DEFAULT_LAYERS, ...layers };

  const nodePositions = useMemo(
    () => new Map(ROUTE_NODES.map((n) => [n.id, [n.position.lat, n.position.lng] as LatLngExpression])),
    [],
  );

  /** The seeded pedestrian graph, drawn as thin lines under the markers. */
  const graphLines = useMemo(() => {
    return ROUTE_EDGES.map((edge) => ({
      edge,
      positions: [
        nodePositions.get(edge.from),
        nodePositions.get(edge.to),
      ].filter(Boolean) as LatLngExpression[],
    })).filter((l) => l.positions.length === 2);
  }, [nodePositions]);

  const activeReports = useMemo(
    () => reports.filter((r) => r.status !== 'resolved' && r.status !== 'rejected'),
    [reports],
  );

  const activeHazards = useMemo(
    () => hazards.filter((h) => h.status === 'active' || h.status === 'monitoring'),
    [hazards],
  );

  const openObstacles = useMemo(
    () => obstacles.filter((o) => o.status !== 'resolved'),
    [obstacles],
  );

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <MapContainer
        center={[(center ?? TOWNSHIP.center).lat, (center ?? TOWNSHIP.center).lng]}
        zoom={zoom}
        scrollWheelZoom
        zoomControl
        attributionControl={showAttribution}
        className={cn(picking && 'cursor-crosshair')}
        style={{ height: '100%', width: '100%' }}
      >
        <BaseTileLayer attribution={showAttribution} />
        <ClickController onMapClick={onMapClick} />
        {fitTo ? <BoundsController points={fitTo} /> : null}

        {/* Pedestrian route graph */}
        {merged.routes
          ? graphLines.map(({ edge, positions }) => (
              <Polyline
                key={edge.id}
                positions={positions}
                pathOptions={{
                  color: edge.stepFree ? '#176B5B' : '#94A3B8',
                  weight: 3,
                  opacity: edge.stepFree ? 0.45 : 0.3,
                  dashArray: edge.stepFree ? undefined : '4,6',
                }}
              />
            ))
          : null}

        {/* Highlighted recommended route */}
        {routePath && routePath.length > 1 ? (
          <>
            <Polyline
              positions={routePath.map((p) => [p.lat, p.lng] as LatLngExpression)}
              pathOptions={{
                color: '#ffffff',
                weight: 12,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline
              positions={routePath.map((p) => [p.lat, p.lng] as LatLngExpression)}
              pathOptions={{
                color: routeColor,
                weight: 6,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: routeColor === '#FB5A36' ? '1,9' : undefined,
              }}
            />
          </>
        ) : null}

        {/* Accessibility obstacles */}
        {merged.routes
          ? openObstacles.map((obstacle) => (
              <Marker
                key={`ob-${obstacle.id}`}
                position={[obstacle.position.lat, obstacle.position.lng]}
                icon={createMarkerIcon({
                  color: '#176B5B',
                  glyph: ICONS.accessibility,
                  shape: 'square',
                  size: 28,
                })}
                eventHandlers={{
                  click: () => onSelectObstacle?.(obstacle),
                }}
              >
                <Popup>
                  <div className="p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-primary-600">
                      AccessAble obstacle
                    </p>
                    <p className="mt-1 text-sm font-bold text-ink-900">{obstacle.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-600">{obstacle.description}</p>
                    {obstacle.reportId ? (
                      <p className="mt-2 text-[11px] font-medium text-ink-400">
                        Linked to a FixMyTown report — route weights adjusted.
                      </p>
                    ) : null}
                  </div>
                </Popup>
              </Marker>
            ))
          : null}

        {/* Maintenance issues */}
        {merged.issues
          ? activeReports.map((report) => {
              const meta = REPORT_CATEGORY_META[report.category];
              const status = REPORT_STATUS_META[report.status];
              return (
                <Marker
                  key={`rp-${report.id}`}
                  position={[report.position.lat, report.position.lng]}
                  icon={createMarkerIcon({
                    color: meta.color,
                    glyph: ICONS.pin,
                    size: 30,
                  })}
                  eventHandlers={{ click: () => onSelectReport?.(report) }}
                >
                  <Popup>
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
                          {report.reference}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-ink-900">{report.title}</p>
                      <p className="mt-1 text-xs text-ink-500">{report.address}</p>
                      <p className="mt-2 text-[11px] font-semibold text-ink-700">
                        Priority: {report.priority.level.toUpperCase()} · {report.priority.total} pts
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })
          : null}

        {/* Safety hazards */}
        {merged.hazards
          ? activeHazards.map((hazard) => {
              const meta = HAZARD_TYPE_META[hazard.type];
              return (
                <Marker
                  key={`hz-${hazard.id}`}
                  position={[hazard.position.lat, hazard.position.lng]}
                  icon={createMarkerIcon({
                    color: meta.color,
                    glyph: ICONS.warning,
                    shape: 'dot',
                    size: 26,
                    zIndexOffset: 400,
                  })}
                  eventHandlers={{ click: () => onSelectHazard?.(hazard) }}
                >
                  <Popup>
                    <div className="p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
                        {meta.label}
                      </p>
                      <p className="mt-1 text-sm font-bold text-ink-900">{hazard.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-600">{hazard.description}</p>
                      <p className="mt-2 text-[11px] font-semibold text-ink-700">
                        Prototype risk score: {hazard.riskScore}/100
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })
          : null}

        {/* Recycling stations */}
        {merged.stations
          ? stations.map((station) => (
              <Marker
                key={`st-${station.id}`}
                position={[station.position.lat, station.position.lng]}
                icon={createMarkerIcon({
                  color: '#047857',
                  glyph: ICONS.recycle,
                  shape: 'square',
                  size: 30,
                })}
                eventHandlers={{ click: () => onSelectStation?.(station) }}
              >
                <Popup>
                  <div className="p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                      Recycling station
                    </p>
                    <p className="mt-1 text-sm font-bold text-ink-900">{station.name}</p>
                    <p className="mt-1 text-xs text-ink-500">{station.address}</p>
                    <p className="mt-1 text-xs text-ink-500">{station.hours}</p>
                  </div>
                </Popup>
              </Marker>
            ))
          : null}

        {/* Picked position */}
        {picked ? (
          <Marker
            position={[picked.lat, picked.lng]}
            icon={createMarkerIcon({
              color: '#FB5A36',
              glyph: ICONS.pin,
              size: 34,
              zIndexOffset: 900,
            })}
          />
        ) : null}
      </MapContainer>

      {picking ? (
        <div className="pointer-events-none absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full bg-ink-900/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur">
          Tap the map to place the pin
        </div>
      ) : null}
    </div>
  );
}

import httpx
import logging
import math
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings
from backend.app.services.spatial_service import haversine_distance_meters

logger = logging.getLogger(__name__)

class OSRMAdapter:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.OSRM_BASE_URL

    async def get_route(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        alternatives: bool = True
    ) -> Dict[str, Any]:
        """
        Request driving route from OSRM. Returns dict with distance, duration,
        polyline coordinates [[lon, lat], ...], and alternatives.
        """
        url = f"{self.base_url}/route/v1/driving/{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
        params = {
            "overview": "full",
            "geometries": "geojson",
            "alternatives": "true" if alternatives else "false",
            "steps": "true"
        }

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    routes = data.get("routes", [])
                    if routes:
                        primary = routes[0]
                        alt_routes = []
                        for i, r in enumerate(routes[1:], start=1):
                            alt_routes.append({
                                "name": f"Alternative Route {i}",
                                "distance_meters": r.get("distance", 0.0),
                                "duration_seconds": r.get("duration", 0.0),
                                "geometry": r.get("geometry", {}).get("coordinates", [])
                            })

                        return {
                            "status": "success",
                            "provider": "osrm",
                            "distance_meters": primary.get("distance", 0.0),
                            "duration_seconds": primary.get("duration", 0.0),
                            "geometry": primary.get("geometry", {}).get("coordinates", []),
                            "alternatives": alt_routes
                        }
        except Exception as e:
            logger.warning(f"OSRM service query failed ({e}). Employing resilient geodesic route interpolation.")

        # Resilient fallback interpolation
        return self._generate_fallback_route(origin_lat, origin_lon, dest_lat, dest_lon)

    def _generate_fallback_route(
        self,
        lat1: float, lon1: float,
        lat2: float, lon2: float
    ) -> Dict[str, Any]:
        """
        Generate a multi-point geodesic route connecting origin and destination
        when the external OSRM service is temporarily offline or rate-limited.
        """
        direct_dist = haversine_distance_meters(lat1, lon1, lat2, lon2)
        # Real driving distance along Indian highways is typically ~1.22x straight-line
        driving_dist = direct_dist * 1.22
        # Average highway speed ~55 km/h -> ~15.28 m/s
        duration = driving_dist / 15.28

        # Create 15 intermediate waypoints with gentle road curvature
        num_points = 20
        coords = []
        for i in range(num_points + 1):
            t = i / float(num_points)
            # Add a slight harmonic curve to simulate real highway navigation
            curve_offset = math.sin(t * math.pi) * 0.04
            lon = lon1 + (lon2 - lon1) * t + curve_offset * 0.5
            lat = lat1 + (lat2 - lat1) * t + curve_offset * 0.3
            coords.append([round(lon, 6), round(lat, 6)])

        # Secondary alternative route with opposite curvature
        alt_coords = []
        for i in range(num_points + 1):
            t = i / float(num_points)
            curve_offset = math.sin(t * math.pi) * -0.05
            lon = lon1 + (lon2 - lon1) * t + curve_offset * 0.5
            lat = lat1 + (lat2 - lat1) * t + curve_offset * 0.3
            alt_coords.append([round(lon, 6), round(lat, 6)])

        return {
            "status": "fallback",
            "provider": "geodesic_fallback",
            "distance_meters": driving_dist,
            "duration_seconds": duration,
            "geometry": coords,
            "alternatives": [
                {
                    "name": "Alternative State Corridor",
                    "distance_meters": driving_dist * 1.08,
                    "duration_seconds": duration * 1.15,
                    "geometry": alt_coords
                }
            ]
        }

osrm_client = OSRMAdapter()

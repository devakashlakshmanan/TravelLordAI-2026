import math
from typing import List, Tuple, Dict, Any

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in meters between two points on Earth."""
    r = 6371000.0 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c

def point_to_segment_distance_meters(
    plat: float, plon: float,
    lat1: float, lon1: float,
    lat2: float, lon2: float
) -> float:
    """Calculate minimum distance in meters from a point (plat, plon) to line segment [(lat1, lon1), (lat2, lon2)]."""
    # Project in approximate equirectangular coordinates around the segment
    avg_lat = math.radians((lat1 + lat2 + plat) / 3.0)
    kx = math.cos(avg_lat) * 111320.0 # meters per degree longitude
    ky = 111000.0 # meters per degree latitude

    px = plon * kx
    py = plat * ky
    x1 = lon1 * kx
    y1 = lat1 * ky
    x2 = lon2 * kx
    y2 = lat2 * ky

    dx = x2 - x1
    dy = y2 - y1
    segment_len_sq = dx * dx + dy * dy

    if segment_len_sq == 0:
        return math.hypot(px - x1, py - y1)

    # Parametric projection t in [0, 1]
    t = ((px - x1) * dx + (py - y1) * dy) / segment_len_sq
    t = max(0.0, min(1.0, t))

    closest_x = x1 + t * dx
    closest_y = y1 + t * dy

    return math.hypot(px - closest_x, py - closest_y)

def point_to_polyline_distance_meters(plat: float, plon: float, polyline: List[List[float]]) -> float:
    """
    Given a GeoJSON coordinate polyline [[lon, lat], ...], find the minimum distance in meters
    from the point (plat, plon) to the entire polyline.
    """
    if not polyline:
        return float("inf")
    if len(polyline) == 1:
        return haversine_distance_meters(plat, plon, polyline[0][1], polyline[0][0])

    min_dist = float("inf")
    for i in range(len(polyline) - 1):
        lon1, lat1 = polyline[i]
        lon2, lat2 = polyline[i + 1]
        dist = point_to_segment_distance_meters(plat, plon, lat1, lon1, lat2, lon2)
        if dist < min_dist:
            min_dist = dist
    return min_dist

def partition_route_into_segments(polyline: List[List[float]], max_segment_km: float = 25.0) -> List[Dict[str, Any]]:
    """
    Partition a route polyline [[lon, lat], ...] into contiguous segments
    of roughly max_segment_km distance each.
    """
    if not polyline or len(polyline) < 2:
        return []

    segments = []
    current_segment_coords = [polyline[0]]
    current_segment_distance = 0.0
    seg_idx = 0

    for i in range(len(polyline) - 1):
        lon1, lat1 = polyline[i]
        lon2, lat2 = polyline[i + 1]
        step_dist = haversine_distance_meters(lat1, lon1, lat2, lon2)

        current_segment_coords.append(polyline[i + 1])
        current_segment_distance += step_dist

        if current_segment_distance >= max_segment_km * 1000.0 or i == len(polyline) - 2:
            start_coord = current_segment_coords[0]
            end_coord = current_segment_coords[-1]
            segments.append({
                "segment_index": seg_idx,
                "start_lat": start_coord[1],
                "start_lon": start_coord[0],
                "end_lat": end_coord[1],
                "end_lon": end_coord[0],
                "distance_meters": current_segment_distance,
                "polyline": list(current_segment_coords)
            })
            seg_idx += 1
            current_segment_coords = [polyline[i + 1]]
            current_segment_distance = 0.0

    return segments

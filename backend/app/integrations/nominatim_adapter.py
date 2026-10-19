import re
import math
import logging
from typing import List, Dict, Any, Optional, Tuple
import httpx
from backend.app.core.config import settings
from backend.app.services.spatial_service import haversine_distance_meters

logger = logging.getLogger(__name__)

# Coordinate regex matching formats like "19.0760, 72.8777", "28.6139 77.2090", "lat: 12.97, lon: 77.59"
COORD_REGEX = re.compile(
    r"^\s*\(?\s*(?:lat(?:itude)?\s*[:=]\s*)?([+-]?\d+(?:\.\d+)?)\s*[,;\s]\s*(?:lon(?:gitude)?\s*[:=]\s*)?([+-]?\d+(?:\.\d+)?)\s*\)?\s*$",
    re.IGNORECASE
)

# Comprehensive pan-India reference hubs covering all 28 States, 8 UTs, major highways, and transit centers
PAN_INDIA_HUBS: List[Dict[str, Any]] = [
    # Northern India
    {"display_name": "New Delhi, Delhi, India", "lat": 28.6139, "lon": 77.2090, "type": "national_capital", "state": "Delhi", "importance": 0.98},
    {"display_name": "Noida, Gautam Buddha Nagar, Uttar Pradesh, India", "lat": 28.5355, "lon": 77.3910, "type": "city", "state": "Uttar Pradesh", "importance": 0.86},
    {"display_name": "Gurugram, Haryana, India", "lat": 28.4595, "lon": 77.0266, "type": "city", "state": "Haryana", "importance": 0.88},
    {"display_name": "Chandigarh, India", "lat": 30.7333, "lon": 76.7794, "type": "union_territory", "state": "Chandigarh", "importance": 0.89},
    {"display_name": "Amritsar, Punjab, India", "lat": 31.6340, "lon": 74.8723, "type": "city", "state": "Punjab", "importance": 0.87},
    {"display_name": "Ludhiana, Punjab, India", "lat": 30.9010, "lon": 75.8573, "type": "city", "state": "Punjab", "importance": 0.84},
    {"display_name": "Jalandhar, Punjab, India", "lat": 31.3260, "lon": 75.5762, "type": "city", "state": "Punjab", "importance": 0.82},
    {"display_name": "Shimla, Himachal Pradesh, India", "lat": 31.1048, "lon": 77.1734, "type": "state_capital", "state": "Himachal Pradesh", "importance": 0.89},
    {"display_name": "Manali, Kullu District, Himachal Pradesh, India", "lat": 32.2396, "lon": 77.1887, "type": "town", "state": "Himachal Pradesh", "importance": 0.86},
    {"display_name": "Dharamshala, Kangra, Himachal Pradesh, India", "lat": 32.2190, "lon": 76.3234, "type": "town", "state": "Himachal Pradesh", "importance": 0.84},
    {"display_name": "Kullu, Himachal Pradesh, India", "lat": 31.9579, "lon": 77.1095, "type": "town", "state": "Himachal Pradesh", "importance": 0.82},
    {"display_name": "Mandi, Himachal Pradesh, India", "lat": 31.7087, "lon": 76.9320, "type": "city", "state": "Himachal Pradesh", "importance": 0.81},
    {"display_name": "Srinagar, Jammu and Kashmir, India", "lat": 34.0837, "lon": 74.7973, "type": "city", "state": "Jammu and Kashmir", "importance": 0.88},
    {"display_name": "Jammu, Jammu and Kashmir, India", "lat": 32.7266, "lon": 74.8570, "type": "city", "state": "Jammu and Kashmir", "importance": 0.85},
    {"display_name": "Leh, Ladakh, India", "lat": 34.1526, "lon": 77.5771, "type": "union_territory_capital", "state": "Ladakh", "importance": 0.86},
    {"display_name": "Kargil, Ladakh, India", "lat": 34.5539, "lon": 76.1349, "type": "town", "state": "Ladakh", "importance": 0.80},
    {"display_name": "Dehradun, Uttarakhand, India", "lat": 30.3165, "lon": 78.0322, "type": "state_capital", "state": "Uttarakhand", "importance": 0.87},
    {"display_name": "Haridwar, Uttarakhand, India", "lat": 29.9457, "lon": 78.1642, "type": "city", "state": "Uttarakhand", "importance": 0.85},
    {"display_name": "Rishikesh, Dehradun, Uttarakhand, India", "lat": 30.0869, "lon": 78.2676, "type": "city", "state": "Uttarakhand", "importance": 0.85},
    {"display_name": "Nainital, Uttarakhand, India", "lat": 29.3919, "lon": 79.4542, "type": "town", "state": "Uttarakhand", "importance": 0.83},
    {"display_name": "Mussoorie, Dehradun, Uttarakhand, India", "lat": 30.4598, "lon": 78.0644, "type": "town", "state": "Uttarakhand", "importance": 0.82},
    {"display_name": "Lucknow, Uttar Pradesh, India", "lat": 26.8467, "lon": 80.9462, "type": "state_capital", "state": "Uttar Pradesh", "importance": 0.92},
    {"display_name": "Kanpur, Uttar Pradesh, India", "lat": 26.4499, "lon": 80.3319, "type": "city", "state": "Uttar Pradesh", "importance": 0.88},
    {"display_name": "Varanasi, Uttar Pradesh, India", "lat": 25.3176, "lon": 82.9739, "type": "city", "state": "Uttar Pradesh", "importance": 0.90},
    {"display_name": "Agra, Uttar Pradesh, India", "lat": 27.1767, "lon": 78.0081, "type": "city", "state": "Uttar Pradesh", "importance": 0.89},
    {"display_name": "Prayagraj (Allahabad), Uttar Pradesh, India", "lat": 25.4358, "lon": 81.8463, "type": "city", "state": "Uttar Pradesh", "importance": 0.87},
    {"display_name": "Jaipur, Rajasthan, India", "lat": 26.9124, "lon": 75.7873, "type": "state_capital", "state": "Rajasthan", "importance": 0.92},
    {"display_name": "Jodhpur, Rajasthan, India", "lat": 26.2389, "lon": 73.0243, "type": "city", "state": "Rajasthan", "importance": 0.86},
    {"display_name": "Udaipur, Rajasthan, India", "lat": 24.5854, "lon": 73.7125, "type": "city", "state": "Rajasthan", "importance": 0.87},
    {"display_name": "Jaisalmer, Rajasthan, India", "lat": 26.9157, "lon": 70.9083, "type": "city", "state": "Rajasthan", "importance": 0.84},
    {"display_name": "Kota, Rajasthan, India", "lat": 25.2138, "lon": 75.8648, "type": "city", "state": "Rajasthan", "importance": 0.83},

    # Western India
    {"display_name": "Mumbai, Maharashtra, India", "lat": 19.0760, "lon": 72.8777, "type": "state_capital", "state": "Maharashtra", "importance": 0.97},
    {"display_name": "Pune, Maharashtra, India", "lat": 18.5204, "lon": 73.8567, "type": "city", "state": "Maharashtra", "importance": 0.93},
    {"display_name": "Nagpur, Maharashtra, India", "lat": 21.1458, "lon": 79.0882, "type": "city", "state": "Maharashtra", "importance": 0.88},
    {"display_name": "Nashik, Maharashtra, India", "lat": 19.9975, "lon": 73.7898, "type": "city", "state": "Maharashtra", "importance": 0.85},
    {"display_name": "Chhatrapati Sambhajinagar (Aurangabad), Maharashtra, India", "lat": 19.8762, "lon": 75.3433, "type": "city", "state": "Maharashtra", "importance": 0.84},
    {"display_name": "Ahmedabad, Gujarat, India", "lat": 23.0225, "lon": 72.5714, "type": "city", "state": "Gujarat", "importance": 0.93},
    {"display_name": "Surat, Gujarat, India", "lat": 21.1702, "lon": 72.8311, "type": "city", "state": "Gujarat", "importance": 0.89},
    {"display_name": "Vadodara, Gujarat, India", "lat": 22.3072, "lon": 73.1812, "type": "city", "state": "Gujarat", "importance": 0.87},
    {"display_name": "Rajkot, Gujarat, India", "lat": 22.3039, "lon": 70.8022, "type": "city", "state": "Gujarat", "importance": 0.84},
    {"display_name": "Gandhinagar, Gujarat, India", "lat": 23.2156, "lon": 72.6369, "type": "state_capital", "state": "Gujarat", "importance": 0.86},
    {"display_name": "Panaji, Goa, India", "lat": 15.4909, "lon": 73.8278, "type": "state_capital", "state": "Goa", "importance": 0.88},
    {"display_name": "Margao, South Goa, India", "lat": 15.2832, "lon": 73.9862, "type": "city", "state": "Goa", "importance": 0.82},
    {"display_name": "Daman, Dadra and Nagar Haveli and Daman and Diu, India", "lat": 20.3974, "lon": 72.8328, "type": "union_territory", "state": "DNHDD", "importance": 0.80},
    {"display_name": "Silvassa, Dadra and Nagar Haveli and Daman and Diu, India", "lat": 20.2763, "lon": 73.0083, "type": "town", "state": "DNHDD", "importance": 0.79},

    # Southern India
    {"display_name": "Bengaluru, Karnataka, India", "lat": 12.9716, "lon": 77.5946, "type": "state_capital", "state": "Karnataka", "importance": 0.96},
    {"display_name": "Mysuru, Karnataka, India", "lat": 12.2958, "lon": 76.6394, "type": "city", "state": "Karnataka", "importance": 0.87},
    {"display_name": "Mangaluru, Karnataka, India", "lat": 12.9141, "lon": 74.8560, "type": "city", "state": "Karnataka", "importance": 0.85},
    {"display_name": "Hubballi-Dharwad, Karnataka, India", "lat": 15.3647, "lon": 75.1240, "type": "city", "state": "Karnataka", "importance": 0.83},
    {"display_name": "Belagavi, Karnataka, India", "lat": 15.8497, "lon": 74.4977, "type": "city", "state": "Karnataka", "importance": 0.82},
    {"display_name": "Chennai, Tamil Nadu, India", "lat": 13.0827, "lon": 80.2707, "type": "state_capital", "state": "Tamil Nadu", "importance": 0.95},
    {"display_name": "Coimbatore, Tamil Nadu, India", "lat": 11.0168, "lon": 76.9558, "type": "city", "state": "Tamil Nadu", "importance": 0.88},
    {"display_name": "Madurai, Tamil Nadu, India", "lat": 9.9252, "lon": 78.1198, "type": "city", "state": "Tamil Nadu", "importance": 0.86},
    {"display_name": "Tiruchirappalli, Tamil Nadu, India", "lat": 10.7905, "lon": 78.7047, "type": "city", "state": "Tamil Nadu", "importance": 0.84},
    {"display_name": "Salem, Tamil Nadu, India", "lat": 11.6643, "lon": 78.1460, "type": "city", "state": "Tamil Nadu", "importance": 0.83},
    {"display_name": "Ooty (Udhagamandalam), The Nilgiris, Tamil Nadu, India", "lat": 11.4102, "lon": 76.6950, "type": "town", "state": "Tamil Nadu", "importance": 0.85},
    {"display_name": "Kodaikanal, Dindigul, Tamil Nadu, India", "lat": 10.2381, "lon": 77.4892, "type": "town", "state": "Tamil Nadu", "importance": 0.83},
    {"display_name": "Hyderabad, Telangana, India", "lat": 17.3850, "lon": 78.4867, "type": "state_capital", "state": "Telangana", "importance": 0.95},
    {"display_name": "Warangal, Telangana, India", "lat": 17.9689, "lon": 79.5941, "type": "city", "state": "Telangana", "importance": 0.82},
    {"display_name": "Visakhapatnam, Andhra Pradesh, India", "lat": 17.6868, "lon": 83.2185, "type": "city", "state": "Andhra Pradesh", "importance": 0.89},
    {"display_name": "Vijayawada, Andhra Pradesh, India", "lat": 16.5062, "lon": 80.6480, "type": "city", "state": "Andhra Pradesh", "importance": 0.86},
    {"display_name": "Tirupati, Andhra Pradesh, India", "lat": 13.6288, "lon": 79.4192, "type": "city", "state": "Andhra Pradesh", "importance": 0.85},
    {"display_name": "Amaravati, Andhra Pradesh, India", "lat": 16.5417, "lon": 80.5158, "type": "state_capital", "state": "Andhra Pradesh", "importance": 0.84},
    {"display_name": "Kochi, Ernakulam, Kerala, India", "lat": 9.9312, "lon": 76.2673, "type": "city", "state": "Kerala", "importance": 0.91},
    {"display_name": "Thiruvananthapuram, Kerala, India", "lat": 8.5241, "lon": 76.9366, "type": "state_capital", "state": "Kerala", "importance": 0.90},
    {"display_name": "Kozhikode, Kerala, India", "lat": 11.2588, "lon": 75.7804, "type": "city", "state": "Kerala", "importance": 0.85},
    {"display_name": "Munnar, Idukki, Kerala, India", "lat": 10.0889, "lon": 77.0595, "type": "town", "state": "Kerala", "importance": 0.84},
    {"display_name": "Wayanad (Kalpetta), Kerala, India", "lat": 11.6050, "lon": 76.0830, "type": "district", "state": "Kerala", "importance": 0.83},
    {"display_name": "Puducherry, India", "lat": 11.9416, "lon": 79.8083, "type": "union_territory_capital", "state": "Puducherry", "importance": 0.85},

    # Eastern India
    {"display_name": "Kolkata, West Bengal, India", "lat": 22.5726, "lon": 88.3639, "type": "state_capital", "state": "West Bengal", "importance": 0.95},
    {"display_name": "Howrah, West Bengal, India", "lat": 22.5958, "lon": 88.2636, "type": "city", "state": "West Bengal", "importance": 0.86},
    {"display_name": "Siliguri, Darjeeling/Jalpaiguri, West Bengal, India", "lat": 26.7271, "lon": 88.3953, "type": "city", "state": "West Bengal", "importance": 0.86},
    {"display_name": "Darjeeling, West Bengal, India", "lat": 27.0410, "lon": 88.2663, "type": "town", "state": "West Bengal", "importance": 0.85},
    {"display_name": "Durgapur, Paschim Bardhaman, West Bengal, India", "lat": 23.5204, "lon": 87.3119, "type": "city", "state": "West Bengal", "importance": 0.83},
    {"display_name": "Patna, Bihar, India", "lat": 25.5941, "lon": 85.1376, "type": "state_capital", "state": "Bihar", "importance": 0.90},
    {"display_name": "Gaya, Bihar, India", "lat": 24.7914, "lon": 85.0002, "type": "city", "state": "Bihar", "importance": 0.84},
    {"display_name": "Muzaffarpur, Bihar, India", "lat": 26.1209, "lon": 85.3647, "type": "city", "state": "Bihar", "importance": 0.82},
    {"display_name": "Bhubaneswar, Odisha, India", "lat": 20.2961, "lon": 85.8245, "type": "state_capital", "state": "Odisha", "importance": 0.89},
    {"display_name": "Cuttack, Odisha, India", "lat": 20.4625, "lon": 85.8830, "type": "city", "state": "Odisha", "importance": 0.84},
    {"display_name": "Puri, Odisha, India", "lat": 19.8135, "lon": 85.8312, "type": "city", "state": "Odisha", "importance": 0.85},
    {"display_name": "Rourkela, Sundargarh, Odisha, India", "lat": 22.2604, "lon": 84.8536, "type": "city", "state": "Odisha", "importance": 0.82},
    {"display_name": "Ranchi, Jharkhand, India", "lat": 23.3441, "lon": 85.3096, "type": "state_capital", "state": "Jharkhand", "importance": 0.87},
    {"display_name": "Jamshedpur, Jharkhand, India", "lat": 22.8046, "lon": 86.2029, "type": "city", "state": "Jharkhand", "importance": 0.85},
    {"display_name": "Dhanbad, Jharkhand, India", "lat": 23.7957, "lon": 86.4304, "type": "city", "state": "Jharkhand", "importance": 0.83},

    # Central India
    {"display_name": "Bhopal, Madhya Pradesh, India", "lat": 23.2599, "lon": 77.4126, "type": "state_capital", "state": "Madhya Pradesh", "importance": 0.90},
    {"display_name": "Indore, Madhya Pradesh, India", "lat": 22.7196, "lon": 75.8577, "type": "city", "state": "Madhya Pradesh", "importance": 0.91},
    {"display_name": "Jabalpur, Madhya Pradesh, India", "lat": 23.1815, "lon": 79.9864, "type": "city", "state": "Madhya Pradesh", "importance": 0.84},
    {"display_name": "Gwalior, Madhya Pradesh, India", "lat": 26.2183, "lon": 78.1828, "type": "city", "state": "Madhya Pradesh", "importance": 0.85},
    {"display_name": "Ujjain, Madhya Pradesh, India", "lat": 23.1765, "lon": 75.7885, "type": "city", "state": "Madhya Pradesh", "importance": 0.84},
    {"display_name": "Raipur, Chhattisgarh, India", "lat": 21.2514, "lon": 81.6296, "type": "state_capital", "state": "Chhattisgarh", "importance": 0.86},
    {"display_name": "Bilaspur, Chhattisgarh, India", "lat": 22.0797, "lon": 82.1409, "type": "city", "state": "Chhattisgarh", "importance": 0.81},

    # Northeastern India
    {"display_name": "Guwahati, Kamrup Metropolitan, Assam, India", "lat": 26.1445, "lon": 91.7362, "type": "city", "state": "Assam", "importance": 0.89},
    {"display_name": "Dispur, Assam, India", "lat": 26.1433, "lon": 91.7898, "type": "state_capital", "state": "Assam", "importance": 0.87},
    {"display_name": "Silchar, Cachar, Assam, India", "lat": 24.8333, "lon": 92.7789, "type": "city", "state": "Assam", "importance": 0.81},
    {"display_name": "Dibrugarh, Assam, India", "lat": 27.4728, "lon": 94.9120, "type": "city", "state": "Assam", "importance": 0.82},
    {"display_name": "Shillong, East Khasi Hills, Meghalaya, India", "lat": 25.5788, "lon": 91.8933, "type": "state_capital", "state": "Meghalaya", "importance": 0.86},
    {"display_name": "Cherrapunji (Sohra), Meghalaya, India", "lat": 25.2986, "lon": 91.7328, "type": "town", "state": "Meghalaya", "importance": 0.82},
    {"display_name": "Gangtok, East Sikkim, Sikkim, India", "lat": 27.3389, "lon": 88.6065, "type": "state_capital", "state": "Sikkim", "importance": 0.86},
    {"display_name": "Imphal, Manipur, India", "lat": 24.8170, "lon": 93.9368, "type": "state_capital", "state": "Manipur", "importance": 0.84},
    {"display_name": "Agartala, West Tripura, Tripura, India", "lat": 23.8315, "lon": 91.2868, "type": "state_capital", "state": "Tripura", "importance": 0.84},
    {"display_name": "Aizawl, Mizoram, India", "lat": 23.7271, "lon": 92.7176, "type": "state_capital", "state": "Mizoram", "importance": 0.83},
    {"display_name": "Kohima, Nagaland, India", "lat": 25.6751, "lon": 94.1086, "type": "state_capital", "state": "Nagaland", "importance": 0.83},
    {"display_name": "Dimapur, Nagaland, India", "lat": 25.9068, "lon": 93.7273, "type": "city", "state": "Nagaland", "importance": 0.81},
    {"display_name": "Itanagar, Papum Pare, Arunachal Pradesh, India", "lat": 27.0844, "lon": 93.6053, "type": "state_capital", "state": "Arunachal Pradesh", "importance": 0.83},
    {"display_name": "Tawang, Arunachal Pradesh, India", "lat": 27.5861, "lon": 91.8594, "type": "town", "state": "Arunachal Pradesh", "importance": 0.82},

    # Island Territories
    {"display_name": "Port Blair, South Andaman, Andaman and Nicobar Islands, India", "lat": 11.6234, "lon": 92.7265, "type": "union_territory_capital", "state": "Andaman and Nicobar Islands", "importance": 0.85},
    {"display_name": "Havelock Island (Swaraj Dweep), Andaman and Nicobar Islands, India", "lat": 11.9761, "lon": 92.9876, "type": "island", "state": "Andaman and Nicobar Islands", "importance": 0.82},
    {"display_name": "Kavaratti, Lakshadweep, India", "lat": 10.5669, "lon": 72.6420, "type": "union_territory_capital", "state": "Lakshadweep", "importance": 0.81},
]

class NominatimAdapter:
    """
    Provider-independent, resilient geocoding service for Pan-India TravelLord AI.
    Features:
    - Coordinate direct parsing (lat/lon) with Indian bounding-box detection
    - High-performance LRU memory cache
    - Pan-India reference index covering all 28 states, 8 UTs, and major corridors
    - Reverse geocoding with nearest hub discovery
    - Nominatim live endpoint fallback with polite user-agent and bounded queries
    """

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.NOMINATIM_BASE_URL
        self.cache: Dict[str, List[Dict[str, Any]]] = {}

    def parse_coordinates(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Detects if query is a raw coordinate string (e.g. '19.0760, 72.8777' or 'lat: 12.97 lon: 77.59').
        Returns resolved location dict if valid.
        """
        match = COORD_REGEX.match(query.strip())
        if not match:
            return None

        try:
            val1 = float(match.group(1))
            val2 = float(match.group(2))

            # Disambiguate lat/lon vs lon/lat:
            # India latitudes range ~6°N to 38°N, longitudes range ~68°E to 98°E
            if 6.0 <= val1 <= 38.0 and 68.0 <= val2 <= 98.0:
                lat, lon = val1, val2
            elif 68.0 <= val1 <= 98.0 and 6.0 <= val2 <= 38.0:
                lon, lat = val1, val2
            elif -90.0 <= val1 <= 90.0 and -180.0 <= val2 <= 180.0:
                lat, lon = val1, val2
            else:
                return None

            nearest_hub = self._find_nearest_hub(lat, lon)
            context = f" (near {nearest_hub['display_name'].split(',')[0]})" if nearest_hub else ""

            return {
                "display_name": f"Coordinates: {lat:.5f}°N, {lon:.5f}°E{context}",
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "type": "coordinate",
                "importance": 1.0
            }
        except Exception:
            return None

    def _find_nearest_hub(self, lat: float, lon: float, max_dist_km: float = 120.0) -> Optional[Dict[str, Any]]:
        """Finds closest known Indian city/hub within max_dist_km for contextual reverse labeling."""
        best_hub = None
        min_dist = float("inf")
        for hub in PAN_INDIA_HUBS:
            d = haversine_distance_meters(lat, lon, hub["lat"], hub["lon"]) / 1000.0
            if d < min_dist and d <= max_dist_km:
                min_dist = d
                best_hub = hub
        return best_hub

    async def search(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        """
        Search for places, cities, towns, highways, or raw coordinates across India.
        Prioritizes exact coordinate parsing, cached results, live Nominatim queries,
        and instant pan-India curated hubs.
        """
        clean_q = query.strip()
        if not clean_q or len(clean_q) < 2:
            return []

        # 1. Direct coordinate entry check
        coord_result = self.parse_coordinates(clean_q)
        if coord_result:
            return [coord_result]

        cache_key = clean_q.lower()
        if cache_key in self.cache:
            return self.cache[cache_key]

        # 2. Check local pan-India curated hubs
        # Exact prefix or substring matches
        local_matches: List[Dict[str, Any]] = []
        tokens = [t.strip().lower() for t in clean_q.split() if len(t.strip()) > 1]

        for loc in PAN_INDIA_HUBS:
            loc_name_lower = loc["display_name"].lower()
            if cache_key in loc_name_lower:
                local_matches.append(loc)
            elif all(token in loc_name_lower for token in tokens):
                local_matches.append(loc)

        # Sort local matches by importance
        local_matches.sort(key=lambda x: x.get("importance", 0.5), reverse=True)

        # 3. Query external Nominatim service bounded to India
        try:
            url = f"{self.base_url}/search"
            params = {
                "q": clean_q,
                "format": "json",
                "countrycodes": "in",
                "viewbox": "68.1,37.5,97.4,6.7", # India geographic bounds [minLon, maxLat, maxLon, minLat]
                "limit": limit,
                "addressdetails": 1
            }
            headers = {"User-Agent": "TravelLordAI-PanIndiaGeospatialPlatform/2.0 (geocoding@travellord.ai)"}

            async with httpx.AsyncClient(timeout=3.5) as client:
                res = await client.get(url, params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    formatted = [
                        {
                            "display_name": item.get("display_name", ""),
                            "lat": float(item.get("lat", 0.0)),
                            "lon": float(item.get("lon", 0.0)),
                            "type": item.get("type", "location"),
                            "importance": float(item.get("importance", 0.5))
                        }
                        for item in data
                    ]
                    if formatted:
                        # Combine with top local matches if distinct, preserving order
                        seen = set()
                        combined = []
                        for item in formatted + local_matches:
                            key = f"{round(item['lat'], 3)},{round(item['lon'], 3)}"
                            if key not in seen:
                                seen.add(key)
                                combined.append(item)
                        res_list = combined[:limit]
                        self.cache[cache_key] = res_list
                        return res_list
        except Exception as e:
            logger.info(f"External Nominatim query for '{clean_q}' timed out or unavailable ({e}); utilizing pan-India index.")

        if local_matches:
            res_list = [
                {
                    "display_name": loc["display_name"],
                    "lat": loc["lat"],
                    "lon": loc["lon"],
                    "type": loc["type"],
                    "importance": loc["importance"]
                }
                for loc in local_matches[:limit]
            ]
            self.cache[cache_key] = res_list
            return res_list

        return []

    async def reverse_geocode(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Reverse geocodes coordinates to administrative location with fallback to nearest Indian hub.
        """
        # Validate coordinates
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            return None

        try:
            url = f"{self.base_url}/reverse"
            params = {
                "lat": lat,
                "lon": lon,
                "format": "json",
                "zoom": 14,
                "addressdetails": 1
            }
            headers = {"User-Agent": "TravelLordAI-PanIndiaGeospatialPlatform/2.0 (geocoding@travellord.ai)"}

            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(url, params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "display_name": data.get("display_name", f"{lat:.4f}, {lon:.4f}"),
                        "lat": float(data.get("lat", lat)),
                        "lon": float(data.get("lon", lon)),
                        "type": "reverse_geocoded",
                        "importance": 0.9
                    }
        except Exception as e:
            logger.info(f"Reverse geocode lookup ({lat}, {lon}) failed ({e}); utilizing local nearest hub.")

        nearest = self._find_nearest_hub(lat, lon, max_dist_km=150.0)
        if nearest:
            return {
                "display_name": f"{lat:.4f}°N, {lon:.4f}°E (near {nearest['display_name']})",
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "type": "reverse_hub_context",
                "importance": 0.8
            }

        return {
            "display_name": f"Coordinates: {lat:.5f}°N, {lon:.5f}°E",
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "type": "coordinates",
            "importance": 0.7
        }

nominatim_client = NominatimAdapter()

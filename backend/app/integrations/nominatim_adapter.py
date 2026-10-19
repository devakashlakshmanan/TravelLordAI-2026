import httpx
import logging
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Pre-seeded common Indian travel hubs for instant zero-latency responses & offline reliability
SEED_LOCATIONS = [
    {"display_name": "New Delhi, Delhi, India", "lat": 28.6139, "lon": 77.2090, "type": "city", "importance": 0.95},
    {"display_name": "Manali, Kullu District, Himachal Pradesh, India", "lat": 32.2396, "lon": 77.1887, "type": "town", "importance": 0.85},
    {"display_name": "Shimla, Himachal Pradesh, India", "lat": 31.1048, "lon": 77.1734, "type": "city", "importance": 0.88},
    {"display_name": "Rishikesh, Dehradun, Uttarakhand, India", "lat": 30.0869, "lon": 78.2676, "type": "city", "importance": 0.84},
    {"display_name": "Dehradun, Uttarakhand, India", "lat": 30.3165, "lon": 78.0322, "type": "city", "importance": 0.86},
    {"display_name": "Chandigarh, India", "lat": 30.7333, "lon": 76.7794, "type": "city", "importance": 0.87},
    {"display_name": "Bengaluru, Karnataka, India", "lat": 12.9716, "lon": 77.5946, "type": "city", "importance": 0.94},
    {"display_name": "Mysuru, Karnataka, India", "lat": 12.2958, "lon": 76.6394, "type": "city", "importance": 0.85},
    {"display_name": "Ooty, The Nilgiris, Tamil Nadu, India", "lat": 11.4102, "lon": 76.6950, "type": "town", "importance": 0.83},
    {"display_name": "Munnar, Idukki, Kerala, India", "lat": 10.0889, "lon": 77.0595, "type": "town", "importance": 0.82},
    {"display_name": "Wayanad, Kerala, India", "lat": 11.6854, "lon": 76.1320, "type": "district", "importance": 0.80},
    {"display_name": "Mumbai, Maharashtra, India", "lat": 19.0760, "lon": 72.8777, "type": "city", "importance": 0.96},
    {"display_name": "Pune, Maharashtra, India", "lat": 18.5204, "lon": 73.8567, "type": "city", "importance": 0.90},
    {"display_name": "Goa (Panaji), India", "lat": 15.4909, "lon": 73.8278, "type": "city", "importance": 0.87},
    {"display_name": "Jaipur, Rajasthan, India", "lat": 26.9124, "lon": 75.7873, "type": "city", "importance": 0.89},
    {"display_name": "Srinagar, Jammu and Kashmir, India", "lat": 34.0837, "lon": 74.7973, "type": "city", "importance": 0.86},
    {"display_name": "Leh, Ladakh, India", "lat": 34.1526, "lon": 77.5771, "type": "city", "importance": 0.84},
    {"display_name": "Guwahati, Assam, India", "lat": 26.1445, "lon": 91.7362, "type": "city", "importance": 0.85},
    {"display_name": "Shillong, Meghalaya, India", "lat": 25.5788, "lon": 91.8933, "type": "city", "importance": 0.83},
    {"display_name": "Kolkata, West Bengal, India", "lat": 22.5726, "lon": 88.3639, "type": "city", "importance": 0.93},
    {"display_name": "Chennai, Tamil Nadu, India", "lat": 13.0827, "lon": 80.2707, "type": "city", "importance": 0.92},
    {"display_name": "Hyderabad, Telangana, India", "lat": 17.3850, "lon": 78.4867, "type": "city", "importance": 0.91},
]

class NominatimAdapter:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.NOMINATIM_BASE_URL
        self.cache: Dict[str, List[Dict[str, Any]]] = {}

    async def search(self, query: str, limit: int = 6) -> List[Dict[str, Any]]:
        clean_q = query.strip().lower()
        if not clean_q:
            return []

        if clean_q in self.cache:
            return self.cache[clean_q]

        # Check local seed locations first
        local_matches = [
            loc for loc in SEED_LOCATIONS
            if clean_q in loc["display_name"].lower()
        ]

        try:
            url = f"{self.base_url}/search"
            params = {
                "q": query,
                "format": "json",
                "countrycodes": "in",
                "limit": limit,
                "addressdetails": 1
            }
            headers = {"User-Agent": "TravelLordAI-GeospatialPlatform/1.0 (info@travellord.ai)"}

            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url, params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    formatted = [
                        {
                            "display_name": item.get("display_name", ""),
                            "lat": float(item.get("lat", 0.0)),
                            "lon": float(item.get("lon", 0.0)),
                            "type": item.get("type", "location"),
                            "importance": item.get("importance", 0.5)
                        }
                        for item in data
                    ]
                    if formatted:
                        self.cache[clean_q] = formatted
                        return formatted
        except Exception as e:
            logger.warning(f"Nominatim geocode query failed ({e}); falling back to curated hub index.")

        if local_matches:
            self.cache[clean_q] = local_matches[:limit]
            return local_matches[:limit]

        return []

nominatim_client = NominatimAdapter()

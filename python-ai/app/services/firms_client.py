"""
NASA FIRMS (Fire Information for Resource Management System) Client.
Provides satellite hotspot data with resilient caching, error handling,
and deterministic offline fixtures.
"""

import csv
import io
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
import httpx

from app.core.config import settings
from app.core.logging import logger
from app.schemas.hotspot import HotspotDetection, HotspotQueryFilter, HotspotSummaryResponse

# Realistic deterministic fixture data covering Punjab and Haryana agricultural belt
# Coordinates centered around Sangrur, Ludhiana, Bathinda, Patiala, Karnal
FIXTURE_HOTSPOTS: List[Dict[str, Any]] = [
    {
        "latitude": 30.2458,
        "longitude": 75.8421,
        "brightness": 338.4,
        "scan": 0.42,
        "track": 0.38,
        "acq_date": "2026-10-08",
        "acq_time": "0815",
        "satellite": "NOAA-20",
        "instrument": "VIIRS",
        "confidence": "high",
        "version": "2.0NRT",
        "bright_t31": 298.1,
        "frp": 18.6,
        "daynight": "D"
    },
    {
        "latitude": 30.2512,
        "longitude": 75.8490,
        "brightness": 345.1,
        "scan": 0.42,
        "track": 0.38,
        "acq_date": "2026-10-08",
        "acq_time": "0815",
        "satellite": "NOAA-20",
        "instrument": "VIIRS",
        "confidence": "high",
        "version": "2.0NRT",
        "bright_t31": 301.2,
        "frp": 24.3,
        "daynight": "D"
    },
    {
        "latitude": 30.9010,
        "longitude": 75.8573,
        "brightness": 322.6,
        "scan": 0.39,
        "track": 0.36,
        "acq_date": "2026-10-08",
        "acq_time": "0816",
        "satellite": "NOAA-20",
        "instrument": "VIIRS",
        "confidence": "nominal",
        "version": "2.0NRT",
        "bright_t31": 294.0,
        "frp": 8.9,
        "daynight": "D"
    },
    {
        "latitude": 30.2110,
        "longitude": 74.9455,
        "brightness": 331.0,
        "scan": 0.45,
        "track": 0.40,
        "acq_date": "2026-10-09",
        "acq_time": "0745",
        "satellite": "NOAA-21",
        "instrument": "VIIRS",
        "confidence": "nominal",
        "version": "2.0NRT",
        "bright_t31": 296.5,
        "frp": 12.1,
        "daynight": "D"
    },
    {
        "latitude": 29.9695,
        "longitude": 76.8783,
        "brightness": 315.4,
        "scan": 0.41,
        "track": 0.37,
        "acq_date": "2026-10-09",
        "acq_time": "0747",
        "satellite": "NOAA-21",
        "instrument": "VIIRS",
        "confidence": "low",
        "version": "2.0NRT",
        "bright_t31": 291.8,
        "frp": 4.5,
        "daynight": "D"
    },
    {
        "latitude": 30.3400,
        "longitude": 76.3800,
        "brightness": 341.2,
        "scan": 0.40,
        "track": 0.36,
        "acq_date": "2026-10-09",
        "acq_time": "0746",
        "satellite": "NOAA-21",
        "instrument": "VIIRS",
        "confidence": "high",
        "version": "2.0NRT",
        "bright_t31": 299.7,
        "frp": 19.8,
        "daynight": "D"
    }
]


class NasaFirmsClient:
    """
    Client for interacting with the NASA FIRMS REST API with TTL caching and fallback fixtures.
    """

    def __init__(self):
        # Cache structure: key -> (timestamp, data_list, data_source)
        self._cache: Dict[str, Tuple[float, List[HotspotDetection], str]] = {}

    def _generate_cache_key(self, query: HotspotQueryFilter) -> str:
        return f"{query.satellite_source}_{query.min_lon}_{query.min_lat}_{query.max_lon}_{query.max_lat}_{query.day_range}"

    def get_fixture_hotspots(self, query: Optional[HotspotQueryFilter] = None) -> List[HotspotDetection]:
        """Returns deterministic fixture detections filtered by bounding box if provided."""
        results: List[HotspotDetection] = []
        for raw in FIXTURE_HOTSPOTS:
            lat = raw["latitude"]
            lon = raw["longitude"]
            if query:
                if not (query.min_lat <= lat <= query.max_lat and query.min_lon <= lon <= query.max_lon):
                    continue
            results.append(HotspotDetection(**raw))
        return results

    async def fetch_hotspots(
        self, 
        query: HotspotQueryFilter, 
        map_key: Optional[str] = None
    ) -> Tuple[List[HotspotDetection], str, bool]:
        """
        Fetches hotspots from NASA FIRMS API or cache/fixture.
        Returns: (detections_list, data_source, is_cached)
        """
        cache_key = self._generate_cache_key(query)
        now = time.time()

        # Check Cache
        if cache_key in self._cache:
            cache_time, cached_data, source_type = self._cache[cache_key]
            if now - cache_time < settings.FIRMS_CACHE_TTL_SECONDS:
                logger.debug(f"Returning {len(cached_data)} hotspots from cache for {cache_key}")
                return cached_data, source_type, True

        key = map_key or settings.FIRMS_MAP_KEY

        # If no key configured, use deterministic fixture
        if not key or key.strip() == "" or key.startswith("YOUR_"):
            logger.info("NASA FIRMS_MAP_KEY not set or placeholder; utilizing deterministic fixture dataset.")
            data = self.get_fixture_hotspots(query)
            source = "DETERMINISTIC_FIXTURE_FALLBACK"
            self._cache[cache_key] = (now, data, source)
            return data, source, False

        # Construct NASA FIRMS Area API URL:
        # https://firms.modaps.eosdis.nasa.gov/api/area/csv/[MAP_KEY]/[SOURCE]/[BBOX]/[DAY_RANGE]
        # BBOX format: min_lon,min_lat,max_lon,max_lat
        bbox_str = f"{query.min_lon},{query.min_lat},{query.max_lon},{query.max_lat}"
        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/{query.satellite_source}/{bbox_str}/{query.day_range}"

        try:
            logger.info(f"Calling NASA FIRMS API: {query.satellite_source} across bbox {bbox_str}")
            async with httpx.AsyncClient(timeout=settings.FIRMS_REQUEST_TIMEOUT_SECONDS) as client:
                resp = await client.get(url)

                if resp.status_code == 200:
                    text_content = resp.text.strip()
                    # NASA returns errors as plain text (e.g. "Invalid Map Key" or "Rate limit exceeded")
                    if "Invalid" in text_content or "Transaction Limit" in text_content:
                        logger.warning(f"NASA FIRMS returned API notice: '{text_content[:80]}'. Falling back to fixtures.")
                        data = self.get_fixture_hotspots(query)
                        source = "DETERMINISTIC_FIXTURE_FALLBACK"
                    else:
                        data = self._parse_firms_csv(text_content, query.satellite_source)
                        source = "NASA_FIRMS_LIVE"
                        logger.info(f"Successfully parsed {len(data)} live detections from NASA FIRMS.")
                else:
                    logger.warning(f"NASA FIRMS returned HTTP {resp.status_code}. Falling back to fixtures.")
                    data = self.get_fixture_hotspots(query)
                    source = "DETERMINISTIC_FIXTURE_FALLBACK"

        except Exception as ex:
            logger.error(f"Error fetching NASA FIRMS data: {str(ex)}. Using deterministic fixture fallback.")
            data = self.get_fixture_hotspots(query)
            source = "DETERMINISTIC_FIXTURE_FALLBACK"

        # Apply confidence filter if requested
        if query.min_confidence:
            min_conf = query.min_confidence.lower()
            data = [d for d in data if d.confidence.lower() == min_conf or min_conf in ["all", "any"]]

        self._cache[cache_key] = (now, data, source)
        return data, source, False

    def _parse_firms_csv(self, csv_text: str, satellite_source: str) -> List[HotspotDetection]:
        detections: List[HotspotDetection] = []
        reader = csv.DictReader(io.StringIO(csv_text))
        for row in reader:
            try:
                # Handle field name variations across VIIRS/MODIS
                lat = float(row.get("latitude", 0.0))
                lon = float(row.get("longitude", 0.0))
                brightness = float(row.get("bright_ti4") or row.get("brightness") or 300.0)
                frp = float(row["frp"]) if row.get("frp") else None
                conf = str(row.get("confidence", "nominal")).lower()
                acq_date = str(row.get("acq_date", datetime.now().strftime("%Y-%m-%d")))
                acq_time = str(row.get("acq_time", "0000"))
                satellite = str(row.get("satellite") or satellite_source)

                detections.append(HotspotDetection(
                    latitude=lat,
                    longitude=lon,
                    brightness=brightness,
                    scan=float(row["scan"]) if row.get("scan") else None,
                    track=float(row["track"]) if row.get("track") else None,
                    acq_date=acq_date,
                    acq_time=acq_time,
                    satellite=satellite,
                    instrument=str(row.get("instrument", "VIIRS")),
                    confidence=conf,
                    version=row.get("version"),
                    bright_t31=float(row["bright_ti5"]) if row.get("bright_ti5") else None,
                    frp=frp,
                    daynight=row.get("daynight")
                ))
            except Exception as parse_err:
                logger.debug(f"Skipping unparseable row: {parse_err}")
                continue

        return detections

    async def get_summary(
        self, 
        query: HotspotQueryFilter, 
        map_key: Optional[str] = None
    ) -> HotspotSummaryResponse:
        detections, source, cached = await self.fetch_hotspots(query, map_key)

        high_conf = sum(1 for d in detections if d.confidence in ["high", "h", "100", "90"])
        nom_conf = sum(1 for d in detections if d.confidence in ["nominal", "n", "med", "medium"])
        low_conf = sum(1 for d in detections if d.confidence in ["low", "l"])

        frp_vals = [d.frp for d in detections if d.frp is not None]
        avg_frp = round(sum(frp_vals) / len(frp_vals), 2) if frp_vals else 0.0

        return HotspotSummaryResponse(
            total_hotspots=len(detections),
            high_confidence_count=high_conf,
            nominal_confidence_count=nom_conf,
            low_confidence_count=low_conf,
            average_frp_mw=avg_frp,
            date_range_days=query.day_range,
            satellite_source=query.satellite_source,
            bounding_box={
                "min_lat": query.min_lat,
                "min_lon": query.min_lon,
                "max_lat": query.max_lat,
                "max_lon": query.max_lon
            },
            data_source=source,
            cached=cached,
            generated_at=datetime.now(timezone.utc).isoformat()
        )


firms_client = NasaFirmsClient()

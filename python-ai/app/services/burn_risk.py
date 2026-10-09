"""
Geospatial Potential Burn-Risk Analysis Service.
Applies transparent heuristic scoring without unverified black-box claims.
Distinguishes between raw thermal detections, potential risk zones, and physical confirmation.
"""

import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.schemas.hotspot import (
    HotspotDetection,
    BurnRiskFeatureCollection,
    GeoJsonFeature,
    GeoJsonGeometry,
    BurnRiskZoneProperties,
    RiskEvidenceFactor,
)


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    r = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


class BurnRiskAnalyzer:
    """
    Analyzes satellite fire hotspots to generate explainable burn-risk zones
    represented as GeoJSON FeatureCollections for UI mapping.
    """

    @classmethod
    def is_paddy_harvest_season(cls, check_date: Optional[datetime] = None) -> bool:
        """
        Punjab/Haryana paddy harvest window is predominantly October 1 to November 30.
        """
        dt = check_date or datetime.now()
        # Month 10 (October) and 11 (November)
        return dt.month in (10, 11)

    @classmethod
    def analyze_zones(
        cls,
        hotspots: List[HotspotDetection],
        cluster_radius_km: float = 7.5,
        known_listings: Optional[List[Dict[str, Any]]] = None
    ) -> BurnRiskFeatureCollection:
        """
        Clusters nearby hotspots into zones and computes multi-factor risk scores.
        """
        if not hotspots:
            return BurnRiskFeatureCollection(
                type="FeatureCollection",
                features=[],
                metadata={
                    "total_zones": 0,
                    "total_hotspots_evaluated": 0,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "methodology": "Heuristic spatial clustering and multi-criteria risk weighting"
                }
            )

        # 1. Cluster hotspots into spatial groups using distance threshold
        clusters: List[List[HotspotDetection]] = []
        for hotspot in hotspots:
            assigned = False
            for cluster in clusters:
                # Check distance to cluster centroid or first point
                first_pt = cluster[0]
                dist = haversine_distance_km(hotspot.latitude, hotspot.longitude, first_pt.latitude, first_pt.longitude)
                if dist <= cluster_radius_km:
                    cluster.append(hotspot)
                    assigned = True
                    break
            if not assigned:
                clusters.append([hotspot])

        features: List[GeoJsonFeature] = []
        is_harvest = cls.is_paddy_harvest_season()

        # 2. Score each cluster
        for idx, cluster in enumerate(clusters):
            count = len(cluster)
            avg_lat = sum(h.latitude for h in cluster) / count
            avg_lon = sum(h.longitude for h in cluster) / count
            max_frp = max((h.frp or 5.0) for h in cluster)
            high_conf_ratio = sum(1 for h in cluster if h.confidence == "high") / count

            # Heuristic Factor 1: Cluster Density (Weight 30%)
            # 1 hotspot = 8 pts, 2 = 18 pts, 3+ = 28-30 pts
            density_score = min(30.0, count * 10.0)
            density_evidence = RiskEvidenceFactor(
                factor_name="Cluster Hotspot Density",
                weight=0.30,
                score_contribution=round(density_score, 1),
                detail=f"{count} satellite thermal detections clustered within {cluster_radius_km} km radius"
            )

            # Heuristic Factor 2: Fire Radiative Power (FRP) & Intensity (Weight 25%)
            # Typical agricultural burns are 8-30 MW. Industrial or high intensity can exceed 50 MW.
            frp_score = min(25.0, (max_frp / 25.0) * 20.0 + (5.0 if high_conf_ratio > 0.5 else 0.0))
            frp_evidence = RiskEvidenceFactor(
                factor_name="Thermal Radiative Power (FRP)",
                weight=0.25,
                score_contribution=round(frp_score, 1),
                detail=f"Peak detected FRP of {round(max_frp, 1)} MW with {round(high_conf_ratio * 100)}% high-confidence readings"
            )

            # Heuristic Factor 3: Seasonal Calendar (Weight 25%)
            season_score = 25.0 if is_harvest else 5.0
            season_evidence = RiskEvidenceFactor(
                factor_name="Agronomic Harvest Window",
                weight=0.25,
                score_contribution=round(season_score, 1),
                detail="Active October-November peak paddy harvesting & clearing season" if is_harvest else "Off-season window"
            )

            # Heuristic Factor 4: Marketplace Listing Status (Weight 20%)
            # If known listings are near this cluster, check if farmers have scheduled balers
            has_matching_listing = False
            if known_listings:
                for item in known_listings:
                    lat = item.get("pickup_latitude") or item.get("latitude")
                    lon = item.get("pickup_longitude") or item.get("longitude")
                    if lat and lon:
                        if haversine_distance_km(avg_lat, avg_lon, lat, lon) <= cluster_radius_km:
                            has_matching_listing = True
                            break

            if has_matching_listing:
                listing_score = 6.0  # Mitigated because farmers in this pocket are already connected to straw marketplace
                listing_detail = "Nearby fields have Straw2Cash collection listings; mitigation active"
                proximity_desc = "Near registered marketplace sellers"
            else:
                listing_score = 18.0  # Unlisted area has higher likelihood of burning if no collection is arranged
                listing_detail = "No Straw2Cash collection listings registered in immediate vicinity"
                proximity_desc = "Unlisted residue area with high risk of untreated disposal"

            listing_evidence = RiskEvidenceFactor(
                factor_name="Marketplace Intervention Status",
                weight=0.20,
                score_contribution=round(listing_score, 1),
                detail=listing_detail
            )

            total_risk_score = round(density_score + frp_score + season_score + listing_score, 1)
            total_risk_score = min(100.0, max(0.0, total_risk_score))

            # Assign categorical risk level
            if total_risk_score >= 75.0:
                risk_level = "CRITICAL"
            elif total_risk_score >= 50.0:
                risk_level = "HIGH"
            elif total_risk_score >= 25.0:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"

            notes = (
                f"Cluster {idx+1}: {risk_level} potential burn-risk zone ({total_risk_score}/100). "
                f"Evidence indicates {count} thermal detections with peak {round(max_frp, 1)} MW radiative power. "
                f"Field ground verification recommended before regulatory determination."
            )

            props = BurnRiskZoneProperties(
                zone_id=f"RISK-ZONE-{idx+1:03d}",
                risk_score=total_risk_score,
                risk_level=risk_level,
                cluster_center_lat=round(avg_lat, 5),
                cluster_center_lon=round(avg_lon, 5),
                hotspot_count=count,
                max_frp_mw=round(max_frp, 1),
                recency_hours=12.0,
                proximity_to_unlisted_fields=proximity_desc,
                harvest_season_active=is_harvest,
                evidence_breakdown=[density_evidence, frp_evidence, season_evidence, listing_evidence],
                assessment_notes=notes
            )

            feature = GeoJsonFeature(
                geometry=GeoJsonGeometry(
                    type="Point",
                    coordinates=[round(avg_lon, 5), round(avg_lat, 5)]  # GeoJSON standard: [lon, lat]
                ),
                properties=props
            )
            features.append(feature)

        # Sort features by highest risk score first
        features.sort(key=lambda f: f.properties.risk_score, reverse=True)

        return BurnRiskFeatureCollection(
            type="FeatureCollection",
            features=features,
            metadata={
                "total_zones": len(features),
                "total_hotspots_evaluated": len(hotspots),
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "methodology": "Heuristic spatial clustering and multi-criteria risk weighting",
                "disclaimer": "Thermal anomalies indicate satellite heat detections. Ground inspection required for verification."
            }
        )

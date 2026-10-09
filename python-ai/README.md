# Straw2Cash — Python AI/ML & Intelligence Service

> **Owner:** Member 3 (Senior Python AI/ML Engineer and Full-Stack Integration Engineer)  
> **Service Port:** `8001` (to prevent collisions with Go `8000` and Java `8080`)  
> **Status:** ✅ Feature-Complete, Tested & Ready for Integration

---

## 🎯 What This Service Does

The Python AI/ML layer provides the scientific, geospatial, and conversational intelligence of the **Straw2Cash: Turn Stubble into Income** agricultural marketplace.

1. **Crop-Residue Estimation Engine**: Scientifically calculates gross residue, recoverable straw (bales & tonnes), and moisture adjustments based on ICAR, PAU, and TIFAC coefficients.
2. **NASA FIRMS Satellite Fire-Hotspot Ingestion & Burn-Risk Analysis**: Ingests real-time VIIRS thermal detections, normalizes coordinates, applies TTL caching, and generates explainable heuristic potential burn-risk zones in GeoJSON format.
3. **Multilingual Farmer AI Assistant (Strands Agents SDK)**: Conversational assistant supporting **Hindi**, **Punjabi (Gurmukhi)**, and **English** with typed agent tools (`estimate_residue`, `get_nearby_hotspots`, `get_buyer_demand`, `get_indicative_market_prices`, `explain_listing_steps`). Features Amazon Bedrock integration, Ollama fallback, and a deterministic offline mock engine.
4. **Demand & Price Insights**: Aggregates marketplace requirements from Member 1's Go backend and aligns with Member 2's Java pricing rules.
5. **Interactive Demo Bench**: Built-in farmer UI at `/demo` with speech, multilingual toggles, and live calculation.

---

## 🏗️ Architectural Position

```
                 Member 4 (Frontend / Mobile)
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Go Engine (M1)  │ │ Java Rules (M2)  │ │ Python AI (M3)   │
│  Port 8000       │ │ Port 8080        │ │ Port 8001 (THIS) │
│  Matching        │ │ Pricing, Quotes  │ │ Residue Estimator│
│  Scheduling      │ │ Contracts        │ │ NASA FIRMS VIIRS │
│  PostgreSQL/sqlc │ │ Settlements      │ │ Strands Agent    │
│                  │ │ DynamoDB / Auth  │ │ Demand Insights  │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         ▲                    ▲                    │
         │                    │                    │
         └────────────────────┴────────────────────┘
             HTTP Client (fallback to fixtures)
```

---

## 🚀 Quick Start

### 1. Setup Virtual Environment & Install Dependencies

Using `uv` (recommended, ultra-fast):
```bash
cd python-ai
uv venv .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt
```

Or using standard `python`:
```bash
cd python-ai
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
```
*(The service comes pre-configured with zero-cost defaults and deterministic offline fixtures so it starts immediately without requiring paid accounts or cloud credentials.)*

### 3. Run the Service

```bash
# From python-ai directory:
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

- **Interactive Demo Bench:** [http://localhost:8001/demo](http://localhost:8001/demo)
- **OpenAPI Swagger UI:** [http://localhost:8001/docs](http://localhost:8001/docs)
- **Health Check:** [http://localhost:8001/api/v1/health](http://localhost:8001/api/v1/health)

---

## 🧪 Testing

The service includes a complete automated test suite (29 tests) verifying formulas, unit conversions, NASA FIRMS parsing, GeoJSON validity, Strands tools, and multilingual conversations:

```bash
# Run tests
.venv\Scripts\python -m pytest -v
```

All 29 tests run 100% offline without requiring AWS keys, NASA keys, or active Go/Java backends.

---

## 📡 API Reference & Integration Endpoints

All endpoints are prefixed with `/api/v1`.

### 1. Crop-Residue Estimation
`POST /api/v1/residue/estimate`

**Request:**
```json
{
  "area": 5.0,
  "area_unit": "acres",
  "crop_type": "paddy/rice",
  "region": "Punjab"
}
```

**Supported Units:** `acres`, `killa` (1 killa = 1 acre), `hectares`, `bigha` (1 pucca bigha = 0.4 acre), `sq_meters`.

**Response (200 OK):**
```json
{
  "input_summary": {
    "submitted_area": 5.0,
    "submitted_unit": "acres",
    "normalized_area_hectares": 2.0234,
    "crop_type": "paddy/rice",
    "region": "Punjab"
  },
  "gross_residue_tonnes": 15.05,
  "recoverable_residue_tonnes": 12.04,
  "moisture_adjusted_recoverable_tonnes": 12.6,
  "estimated_bales": 27,
  "unit": "metric tonnes",
  "confidence_range": {
    "min_recoverable_tonnes": 10.6,
    "max_recoverable_tonnes": 13.48,
    "confidence_level_pct": 90.0,
    "basis": "Derived from PAU field trial variance in combine cutter-bar heights (10-30cm) and field micro-topography."
  },
  "assumptions": {
    "grain_yield_assumed_t_per_ha": 6.2,
    "rpr_assumed": 1.2,
    "collection_efficiency_assumed": 0.8,
    "field_moisture_pct": 18.0,
    "source_citations": [
      "ICAR - Indian Agricultural Research Institute (IARI) Biomass Assessment Guidelines",
      "TIFAC Biomass Resource Atlas of India",
      "Punjab Agricultural University (PAU), Ludhiana"
    ],
    "notes": "Calculated using paddy/rice baseline with 80% mechanized baler collection efficiency and 18.0% field moisture."
  },
  "disclaimer": "This is an algorithmic agronomic estimate based on regional crop-residue coefficients, not a physical weighing-bridge measurement."
}
```

---

### 2. NASA FIRMS Hotspots & Burn-Risk Zones
- `GET /api/v1/hotspots?days=2&min_lat=29.5&min_lon=74.0&max_lat=32.5&max_lon=77.0`
- `GET /api/v1/hotspots/summary`
- `GET /api/v1/hotspots/risk-zones` (GeoJSON FeatureCollection)

**GeoJSON Risk Zone Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [75.84555, 30.2485]
      },
      "properties": {
        "zone_id": "RISK-ZONE-001",
        "risk_score": 83.0,
        "risk_level": "CRITICAL",
        "hotspot_count": 2,
        "max_frp_mw": 24.3,
        "recency_hours": 12.0,
        "proximity_to_unlisted_fields": "Unlisted residue area with high risk of untreated disposal",
        "harvest_season_active": true,
        "evidence_breakdown": [
          {"factor_name": "Cluster Hotspot Density", "weight": 0.3, "score_contribution": 20.0, "detail": "2 detections within 7.5 km"},
          {"factor_name": "Thermal Radiative Power (FRP)", "weight": 0.25, "score_contribution": 24.4, "detail": "Peak FRP 24.3 MW"},
          {"factor_name": "Agronomic Harvest Window", "weight": 0.25, "score_contribution": 25.0, "detail": "Active Oct-Nov harvest season"},
          {"factor_name": "Marketplace Intervention Status", "weight": 0.2, "score_contribution": 18.0, "detail": "No Straw2Cash collection listings registered in immediate vicinity"}
        ],
        "classification_caveat": "Classification: Potential Agricultural Burn-Risk Zone. This is an automated geospatial heuristic and does NOT constitute proof of illegal stubble burning."
      }
    }
  ]
}
```

---

### 3. Multilingual Farmer AI Assistant
`POST /api/v1/assistant/chat`

**Request:**
```json
{
  "message": "ਮੇਰੇ ਕੋਲ 5 ਕਿੱਲੇ ਝੋਨਾ ਹੈ, ਕਿੰਨੀ ਪਰਾਲੀ ਹੋਵੇਗੀ ਅਤੇ ਕੀ ਰੇਟ ਮਿਲੇਗਾ?",
  "language": "pa",
  "session_id": "farmer-session-42"
}
```

**Response (200 OK):**
```json
{
  "reply": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰ ਜੀ! ਤੁਹਾਡੇ 5.0 killa ਝੋਨੇ ਦੇ ਖੇਤ ਵਿੱਚੋਂ:\n• ਕੁੱਲ ਪੈਦਾ ਹੋਣ ਵਾਲੀ ਪਰਾਲੀ: ਲਗਭਗ 15.05 ਟਨ\n• ਬੇਲਰ ਨਾਲ ਇਕੱਠੀ ਹੋਣ ਵਾਲੀ ਵੇਚਣਯੋਗ ਪਰਾਲੀ: ਲਗਭਗ 12.04 ਟਨ\n• ਅੰਦਾਜ਼ਨ ਗੱਠਾਂ (Bales): ਲਗਭਗ 27 ਗੱਠਾਂ (450 ਕਿੱਲੋ ਪ੍ਰਤੀ ਗੱਠ)\n\nਜੇਕਰ ਤੁਸੀਂ ਇਹ ਪਰਾਲੀ ਬਾਇਓਮਾਸ ਪਲਾਂਟ (₹2,500/ਟਨ) ਜਾਂ ਪਸ਼ੂ ਫੀਡ ਵਾਲਿਆਂ (₹3,000/ਟਨ) ਨੂੰ ਵੇਚਦੇ ਹੋ, ਤਾਂ ਤੁਹਾਨੂੰ ਲਗਭਗ ₹30,100 ਤੋਂ ₹36,120 ਦੀ ਸ਼ੁੱਧ ਕਮਾਈ ਹੋ ਸਕਦੀ ਹੈ! ਟਰਾਂਸਪੋਰਟ ਦਾ ਖਰਚਾ ਖਰੀਦਦਾਰ ਦੇਵੇਗਾ। ਕੀ ਤੁਸੀਂ ਪਰਾਲੀ ਲਿਸਟ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
  "detected_language": "pa",
  "session_id": "farmer-session-42",
  "tools_called": [
    {
      "tool_name": "estimate_residue",
      "arguments": {"area": 5.0, "area_unit": "killa", "region": "Punjab"},
      "status": "SUCCESS",
      "summary": "Calculated residue for 5.0 killa: 12.04 tonnes (27 bales)"
    }
  ],
  "provider_used": "mock",
  "disclaimer": "This AI assistant provides information and advisory guidance. Final prices, binding contracts, and payments are strictly governed by Member 2's Java rules service."
}
```

---

### 4. Marketplace Demand & Price Insights
- `GET /api/v1/insights/demand?region=Punjab&radius_km=50`
- `GET /api/v1/insights/prices`

Returns aggregated demand by industrial category (Biomass Power Plants, Paper Mills, Cattle Feed Makers, Brick Kilns) and verified base rate rules (`₹2,500/t`, `₹3,000/t`, etc.) from Member 2's Java rules service.

---

## 🤝 Coordination & Integration with Other Members

### Member 1 (Go Backend — Matching & Scheduling):
- **Listing Creation:** When a farmer creates a listing via Go, Go can query `POST /api/v1/residue/estimate` to populate default `quantity_kg` if the farmer does not know their field tonnage.
- **Requirement Matching:** Python polls `GET http://localhost:8000/api/v1/requirements` to display live demand statistics in the AI assistant.

### Member 2 (Java Rules Service — Pricing & Settlements):
- **Price Authority:** Python NEVER invents settlement math or binding prices. Python quotes indicative rates aligned with Java's `price_rules` table (`BIOMASS_POWER_PLANT: ₹2,500`, `CATTLE_FEED_MAKER: ₹3,000`, `PAPER_MILL: ₹2,200`, `BRICK_KILN: ₹1,800`).
- **Transport Transparency:** Python and Java share the fundamental rule: **Transport is charged to the buyer and never deducted from farmer earnings.**

### Member 4 (Frontend — Farmer & Buyer Workflows):
- **Map Visualization:** Consume `GET /api/v1/hotspots/risk-zones` (GeoJSON standard) to render heatmaps and warning zones on Leaflet/Mapbox.
- **Voice/Chat UI:** Point chat interface to `POST /api/v1/assistant/chat`. Pass `language: "hi"`, `"pa"`, or `"en"`.
- **Standalone Demo:** If Member 4's React frontend is still in development, point judges or stakeholders to `http://localhost:8001/demo` for a full working interactive demonstration.

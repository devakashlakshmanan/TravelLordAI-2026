# TravelLord AI — Risk Assessment & Multi-Threat Fusion Methodology

## 1. Philosophical Baseline
1. **Never Assume Silence Equals Safety**: The absence of an active incident in the database must never be reported as "100% Safe." It is reported as *"No reported active hazards in current coverage window; standard travel vigilance recommended."*
2. **Preserve Raw Source Severity**: A source warning level (e.g. IMD "Red Warning") must never be diluted or overwritten by the engine's aggregated index.
3. **Traceability**: Every composite score must break down into explicit contributing factors, spatial buffers, and evidence quality metrics.

---

## 2. Multi-Threat Scoring Architecture

### 2.1 Spatial Corridor Matching
A user's selected journey is evaluated by breaking the route polyline into discrete corridor segments (typically 10 km to 25 km intervals).
A hazard is considered applicable if its coordinate or polygon intersects the corridor buffer:
- **Severe Weather / Cyclone**: 25 km buffer.
- **Flood / Inundation**: 10 km buffer.
- **Landslides / Subsidence**: 5 km buffer.
- **Wildlife Crossing**: 5 km buffer.
- **Road Accident / Blockade**: 2 km buffer directly on the corridor.

### 2.2 Normalized Risk Index Formulation
The Route Risk Score $R_{route} \in [0, 100]$ is computed as:
$$R_{route} = \min\left(100, \sum_{i=1}^{N} w_i \cdot S_i \cdot Q_i \cdot P_i\right)$$

Where:
- $w_i$: Category weight factor:
  - Landslides / Flash Floods: $w = 1.3$
  - Severe Weather Warnings: $w = 1.1$
  - Road Blockages / Civil Strife: $w = 1.2$
  - Wildlife Crossings: $w = 0.9$
  - Local Accidents / Roadworks: $w = 0.8$
- $S_i$: Base severity of incident ($0$ to $40$ scale: Low = 10, Moderate = 20, Severe = 30, Extreme = 40).
- $Q_i$: Evidence Quality multiplier ($0.5$ for unverified community reports, $0.8$ for corroborated reports, $1.0$ for official government feeds).
- $P_i$: Proximity decay factor based on distance from route centerline:
  $$P_i = \max\left(0.2, 1.0 - \frac{d_i}{D_{max}}\right)$$

### 2.3 Uncertainty & Evidence Quality Classification
- **High Evidence Quality**: Grounded by official government alert (IMD/NDMA/GSI) issued within the last 4 hours.
- **Moderate Evidence Quality**: Verified community report with photo evidence or corroborated by multiple independent submissions.
- **Low / Uncertain**: Single unverified citizen submission, or stale data older than the source's standard refresh interval.

---

## 3. Alternative Route Evaluation
When alternative routes are available from the routing engine:
1. Risk scores are computed independently for each alternative.
2. The user is presented with trade-off insights:
   - *Example*: "Route B adds 22 minutes (18 km) but bypasses an active landslide susceptibility zone on NH-58."
3. Officially closed routes are flagged with an unpassable warning and cannot be recommended as viable options.

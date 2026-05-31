---
title: Water Quality Leaflet Map
theme: ocean-floor
---

# Water Quality Leaflet Map

This map shows water systems with detected lead levels using an interactive Leaflet map.

<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
  crossorigin=""
>

<style>
.leaflet-legend {
  background: rgba(255, 255, 255, 0.95);
  color: #222;
  padding: 10px 12px;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
  font: 14px/1.4 Arial, sans-serif;
  line-height: 1.4;
}

.leaflet-legend h4 {
  color: #222;
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: bold;
}

.leaflet-legend div {
  color: #222;
  white-space: nowrap;
}

.leaflet-legend span {
  display: inline-block;
  width: 13px;
  height: 13px;
  margin-right: 6px;
  border-radius: 50%;
  vertical-align: middle;
  border: 1px solid #555;
}
</style>

```js
import L from "npm:leaflet";
```

```js
const leadMapPoints = await FileAttachment("data/lead-map-points.csv").csv({typed: true});
```
A state can be isolated by clicking the dropdown box and selecting it in the menu.

```js
const selectedState = view(Inputs.select(
  ["All", ...Array.from(new Set(leadMapPoints.map(d => d.state))).sort()],
  {label: "State"}
));
```

Lead levels can be controled using the slider or keyboard controls (up, down, left, right arrows) to see each difference incrementally.

```js
const minLead = view(Inputs.range([0, d3.max(leadMapPoints, d => d.lead)], {
  label: "Minimum lead level, mg/L",
  step: 0.001,
  value: 0
}));
```
Certain zipcodes can be searched up using the input box below. 

```js
const searchedZip = view(Inputs.text({
  label: "Search ZIP code",
  placeholder: "Enter ZIP code, e.g. 93405"
}));
```

```js
const normalizedSearchZip = searchedZip.trim().padStart(5, "0");
```

```js
const searchedZipPoint = normalizedSearchZip
  ? leadMapPoints.find(d => String(d.zip).padStart(5, "0") === normalizedSearchZip)
  : null;
```


```js
const filteredLeadMapPoints = leadMapPoints.filter(d =>
  d.lead >= minLead &&
  (selectedState === "All" || d.state === selectedState)
);
```

```js
const mapContainer = html`<div style="height: 650px; width: 100%; border-radius: 12px;"></div>`;
display(mapContainer);

const map = L.map(mapContainer).setView([39.5, -98.35], 4);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const legend = L.control({position: "bottomright"});

legend.onAdd = function () {
  const div = L.DomUtil.create("div", "leaflet-legend");

  div.innerHTML = `
    <h4>Lead level</h4>
    <div><span style="background:#2563eb"></span> Detected below action level</div>
    <div><span style="background:#b00020"></span> At or above action level</div>
    <div><span style="background:#facc15"></span> Searched ZIP</div>
  `;

  return div;
};

legend.addTo(map);

for (const d of filteredLeadMapPoints) {
  if (!Number.isFinite(d.lat) || !Number.isFinite(d.lon)) continue;

  const radius = Math.max(4, Math.min(18, d.lead * 600));
  const color = d.lead >= 0.015 ? "#b00020" : "#2563eb";

  L.circleMarker([d.lat, d.lon], {
    radius,
    color,
    fillColor: color,
    fillOpacity: 0.65,
    weight: 1
  })
    .bindPopup(`
      <strong>${d.city}, ${d.state} ${d.zip}</strong><br>
      System: ${d.system}<br>
      Lead: ${d.lead} mg/L<br>
      Health violations: ${d.healthViolations}<br>
      Grade: ${d.homeSafetyGrade}
    `)
    .addTo(map);
}

if (
  searchedZipPoint &&
  Number.isFinite(searchedZipPoint.lat) &&
  Number.isFinite(searchedZipPoint.lon)
) {
  const searchedMarker = L.circleMarker(
    [searchedZipPoint.lat, searchedZipPoint.lon],
    {
      radius: 22,
      color: "#854d0e",
      fillColor: "#facc15",
      fillOpacity: 0.9,
      weight: 4
    }
  )
    .bindPopup(`
      <strong>Searched ZIP: ${searchedZipPoint.zip}</strong><br>
      ${searchedZipPoint.city}, ${searchedZipPoint.state}<br>
      System: ${searchedZipPoint.system}<br>
      Lead: ${searchedZipPoint.lead} mg/L<br>
      Health violations: ${searchedZipPoint.healthViolations}<br>
      Grade: ${searchedZipPoint.homeSafetyGrade}
    `)
    .addTo(map);

  map.setView([searchedZipPoint.lat, searchedZipPoint.lon], 10);
  searchedMarker.openPopup();
}
```
```js
const waterQuality = await FileAttachment("data/waterQuality.csv").csv({typed: true});
```

```js
const filteredWaterQuality =
  selectedState === "All"
    ? waterQuality
    : waterQuality.filter(d => d.state === selectedState);
```

```js
const systemsWithActiveIssues =
  filteredWaterQuality.filter(d => d.hasActiveIssues).length;

const systemsWithHealthViolations =
  filteredWaterQuality.filter(d => d.healthViolations > 0).length;

const systemsAtOrAboveLeadActionLevel =
  filteredLeadMapPoints.filter(d => d.lead >= 0.015).length;

const averageSafetyScore =
  d3.mean(filteredWaterQuality, d => d.homeSafetyScore);
```

<div class="grid grid-cols-4">
  <div class="card">
    <h2>Water systems</h2>
    <span class="big">${filteredWaterQuality.length.toLocaleString()}</span>
  </div>

  <div class="card">
    <h2>Active issues</h2>
    <span class="big">${systemsWithActiveIssues.toLocaleString()}</span>
  </div>

  <div class="card">
    <h2>Health violations</h2>
    <span class="big">${systemsWithHealthViolations.toLocaleString()}</span>
  </div>

  <div class="card">
    <h2>At or above lead action level (zipcodes)</h2>
    <span class="big">${systemsAtOrAboveLeadActionLevel.toLocaleString()}</span>
  </div>
</div>

<style>
.big {
  font-size: 2rem;
  font-weight: 700;
}
</style>









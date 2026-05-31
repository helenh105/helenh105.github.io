import {csvParse, csvFormat} from "d3-dsv";
import * as fs from "fs";

const rawData = fs.readFileSync("src/data/zipcheckup-water-quality.csv", "utf-8");

const leadMapPoints = csvParse(rawData, (d) => {
  const lead = Number(d.lead_level_mg_l);
  const lat = Number(d.latitude);
  const lon = Number(d.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  if (!Number.isFinite(lead) || lead <= 0) return;

  return {
    zip: d.zip ? d.zip.toString().padStart(5, "0") : "",
    city: d.city || "Unknown",
    state: d.state || "Unknown",
    system: d.system_name || "Unknown system",
    lead,
    totalViolations: Number(d.total_violations) || 0,
    healthViolations: Number(d.health_violations) || 0,
    homeSafetyGrade: d.home_safety_grade || "Unknown",
    lat,
    lon,
    leadCategory:
      lead >= 0.015
        ? "At or above EPA action level"
        : "Detected below action level"
  };
});

process.stdout.write(csvFormat(leadMapPoints));
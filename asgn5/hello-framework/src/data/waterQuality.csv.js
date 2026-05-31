import {csvParse, csvFormat} from "d3-dsv";
import * as fs from "fs";

const rawText = fs.readFileSync("src/data/zipcheckup-water-quality.csv", "utf-8");

function normalizeWaterSource(source) {
  if (!source) return "Unknown";

  const value = source.trim();

  const WATER_SOURCE_MAP = new Map([
    ["GW", "Groundwater"],
    ["SW", "Surface water"],
    ["GU", "Groundwater under influence of surface water"],
    ["Groundwater", "Groundwater"],
    ["Surface water", "Surface water"],
    ["Groundwater under influence of surface water", "Groundwater under influence of surface water"]
  ]);

  return WATER_SOURCE_MAP.get(value) ?? "Other";
}

const STATE_NAMES_MAP = new Map([
  ["CA", "California"],
  ["NY", "New York"],
  ["TX", "Texas"],
  ["FL", "Florida"]
]);

function normalizeState(stateAbbr) {
  if (!stateAbbr) return "Unknown";
  const abbr = stateAbbr.trim().toUpperCase();
  return STATE_NAMES_MAP.get(abbr) ?? abbr;
}

function parseBoolean(value) {
  return value === true || String(value).toLowerCase() === "true";
}

const waterQuality = csvParse(rawText, (d) => {
  const totalViolations = Number(d.total_violations) || 0;
  const healthViolations = Number(d.health_violations) || 0;
  const hasActiveIssues = parseBoolean(d.has_active_issues);

  let issueLevel = "No reported violations";
  if (hasActiveIssues) issueLevel = "Active issues";
  else if (healthViolations > 0) issueLevel = "Health violations";
  else if (totalViolations > 0) issueLevel = "Other violations";

  return {
    zip: d.zip ? d.zip.toString().padStart(5, "0") : "",
    city: d.city || "Unknown",
    state: normalizeState(d.state),
    systemName: d.system_name || "Unknown",
    pwsid: d.pwsid || "",

    population: Number(d.population) || 0,
    waterSource: normalizeWaterSource(d.water_source),

    totalViolations,
    healthViolations,
    unresolvedViolations: Number(d.unresolved_violations) || 0,

    leadLevelMgL: Number(d.lead_level_mg_l) || 0,
    copperLevelMgL: Number(d.copper_level_mg_l) || 0,

    homeSafetyScore: Number(d.home_safety_score) || 0,
    homeSafetyGrade: d.home_safety_grade || "Unknown",

    latitude: Number(d.latitude) || null,
    longitude: Number(d.longitude) || null,

    contaminantCount: Number(d.contaminant_count) || 0,
    hasActiveIssues,

    issueLevel
  };
});

process.stdout.write(csvFormat(waterQuality));
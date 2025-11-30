require("dotenv").config();

function calculateServiceCost({
  serviceType,
  distanceKm = 0,
  baseFee,
  perKmRate,
  freeKm,
  isASAP = true,
  timeOfDay = 12,
  trafficFactor = 1.0,
}) {
  // ------------------------------
  // 1. DEFAULT PRICING RULES
  // ------------------------------
  let DEFAULTS = {
    baseFee: 5000,
    perKmRate: 150,
    freeKm: 5,
  };

  // ------------------------------
  // 2. CORPORATE PRICING OVERRIDE
  // ------------------------------
  if (serviceType === "corporate") {
    DEFAULTS = {
      baseFee: 15000,
      perKmRate: 150,
      freeKm: 5,
    };
  }

  // ------------------------------
  // 3. APPLY OVERRIDES IF SUPPLIED
  // ------------------------------
  baseFee = baseFee ?? DEFAULTS.baseFee;
  perKmRate = perKmRate ?? DEFAULTS.perKmRate;
  freeKm = freeKm ?? DEFAULTS.freeKm;

  // ------------------------------
  // 4. DISTANCE COST
  // ------------------------------
  const billableKm = Math.max(0, distanceKm - freeKm);
  let distanceCost = billableKm * perKmRate;

  // ------------------------------
  // 5. PEAK HOURS MULTIPLIER
  // ------------------------------
  const peak = (h) => (h >= 7 && h <= 10) || (h >= 16 && h <= 20);
  const timeMultiplier = peak(timeOfDay) ? 1.2 : 1.0;

  // ------------------------------
  // 6. ASAP FEE
  // ------------------------------
  const asapFee = isASAP ? 800 : 0;

  // ------------------------------
  // 7. FINAL TOTAL
  // ------------------------------
  let total = (baseFee + distanceCost + asapFee) * timeMultiplier * trafficFactor;

  return Math.round(total);
}

module.exports = { calculateServiceCost };

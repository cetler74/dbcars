import pool from '../config/database';

interface PricingParams {
  vehicleId: string;
  pickupDate: Date;
  dropoffDate: Date;
  pickupLocationId?: string;
  dropoffLocationId?: string;
}

export async function calculatePricing(params: PricingParams) {
  const { vehicleId, pickupDate, dropoffDate, pickupLocationId } = params;

  // Get vehicle base pricing
  const vehicleResult = await pool.query(
    'SELECT base_price_daily, base_price_weekly, base_price_monthly, base_price_hourly FROM vehicles WHERE id = $1',
    [vehicleId]
  );

  if (vehicleResult.rows.length === 0) {
    throw new Error('Vehicle not found');
  }

  const vehicle = vehicleResult.rows[0];

  // Calculate rental duration
  const days = Math.ceil(
    (dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const hours = Math.ceil(
    (dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60)
  );

  let basePrice = 0;

  // Check for pricing rules (seasonal, special dates, location-based)
  const pricingRulesResult = await pool.query(
    `SELECT * FROM pricing_rules 
     WHERE vehicle_id = $1 
     AND start_date <= $2 
     AND end_date >= $3
     AND (location_id IS NULL OR location_id = $4)
     ORDER BY location_id DESC NULLS LAST
     LIMIT 1`,
    [vehicleId, pickupDate, dropoffDate, pickupLocationId]
  );

  if (pricingRulesResult.rows.length > 0) {
    const rule = pricingRulesResult.rows[0];
    // Use pricing from rule if available, otherwise apply multiplier
    if (rule.daily_price) {
      basePrice = rule.daily_price * days;
    } else if (rule.weekly_price && days >= 7) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      basePrice = rule.weekly_price * weeks + (rule.daily_price || vehicle.base_price_daily) * remainingDays;
    } else {
      basePrice = vehicle.base_price_daily * days * (rule.multiplier || 1.0);
    }
  } else {
    // Use standard pricing
    if (days < 1 && vehicle.base_price_hourly) {
      basePrice = vehicle.base_price_hourly * hours;
    } else if (days >= 30 && vehicle.base_price_monthly) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      basePrice =
        vehicle.base_price_monthly * months +
        vehicle.base_price_daily * remainingDays;
    } else if (days >= 7 && vehicle.base_price_weekly) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      basePrice =
        vehicle.base_price_weekly * weeks +
        vehicle.base_price_daily * remainingDays;
    } else {
      basePrice = vehicle.base_price_daily * days;
    }
  }

  return {
    base_price: parseFloat(basePrice.toFixed(2)),
    days,
    hours,
    vehicle_pricing: vehicle,
  };
}


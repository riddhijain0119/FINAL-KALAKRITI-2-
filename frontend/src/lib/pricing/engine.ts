/**
 * Kalakriti Pricing Engine
 * Pure functions — no side effects, fully unit-testable
 * Backend integration: Replace mock data with DB queries in /api/pricing/calculate
 */

export type Medium = 'watercolor' | 'pencil' | 'oil' | 'charcoal' | 'digital' | 'pastel';
export type SizeKey = 'A4' | 'A3' | 'A2' | '12x16' | '16x20' | '20x24' | '24x30';
export type FrameOption = 'none' | 'classic-wood' | 'ornate-gold' | 'modern-black' | 'floating';

export interface PricingConfig {
  medium: Medium;
  sizeKey: SizeKey;
  faces: number;
  frameOption: FrameOption;
  rushDelivery: boolean;
  digitalCopy: boolean;
  certificateOfAuthenticity: boolean;
}

export interface PriceBreakdown {
  basePrice: number;
  sizeMultiplier: number;
  complexityMultiplier: number;
  frameCost: number;
  addOnsCost: number;
  rushFee: number;
  subtotal: number;
  gst: number;
  total: number;
  depositAmount: number;
  balanceAmount: number;
  estimatedDays: number;
}

// Base prices per medium (INR) — defaults; overridden at runtime by CMS via applyPricingOverrides()
let MEDIUM_BASE_PRICES: Record<Medium, number> = {
  watercolor: 2800,
  pencil: 1800,
  oil: 4500,
  charcoal: 2200,
  digital: 1400,
  pastel: 3200,
};

// Size area multipliers
let SIZE_MULTIPLIERS: Record<SizeKey, number> = {
  A4: 1.0,        // 8.27 × 11.69 in = ~96.7 sq in
  A3: 1.45,       // 11.69 × 16.54 in = ~193 sq in
  A2: 2.1,        // 16.54 × 23.39 in = ~387 sq in
  '12x16': 1.35,
  '16x20': 1.85,
  '20x24': 2.4,
  '24x30': 3.2,
};

// Frame costs in INR
let FRAME_COSTS: Record<FrameOption, number> = {
  none: 0,
  'classic-wood': 1200,
  'ornate-gold': 2200,
  'modern-black': 1500,
  floating: 1800,
};

// Estimated production days per medium
let MEDIUM_DAYS: Record<Medium, number> = {
  watercolor: 7,
  pencil: 5,
  oil: 14,
  charcoal: 5,
  digital: 3,
  pastel: 8,
};

// Add-on prices
let ADDON_PRICES = {
  digitalCopy: 299,
  certificateOfAuthenticity: 499,
  rushDelivery: 0, // Calculated separately as percentage
};

let GST_RATE = 0.18;
let RUSH_DELIVERY_SURCHARGE = 0.35; // 35% surcharge
const DEPOSIT_PERCENTAGE = 1.0; // Full payment only — no advance/deposit flow

/**
 * Apply pricing overrides fetched from `/api/content/pricing` (admin CMS).
 * Any keys not present in the override remain at their hardcoded defaults.
 * Listeners (registered via subscribeToPricing) are notified after merge.
 */
export interface PricingOverrides {
  medium_base_prices?: Partial<Record<string, number>>;
  size_multipliers?: Partial<Record<string, number>>;
  frame_costs?: Partial<Record<string, number>>;
  medium_days?: Partial<Record<string, number>>;
  addon_prices?: { digital_copy?: number; certificate_of_authenticity?: number };
  gst_rate?: number;
  rush_delivery_surcharge?: number;
}

const _listeners = new Set<() => void>();
let _version = 0;

export function getPricingVersion(): number { return _version; }

export function subscribeToPricing(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

export function applyPricingOverrides(o: PricingOverrides | null | undefined): void {
  if (!o) return;
  if (o.medium_base_prices) {
    MEDIUM_BASE_PRICES = { ...MEDIUM_BASE_PRICES, ...(o.medium_base_prices as Record<Medium, number>) };
  }
  if (o.size_multipliers) {
    SIZE_MULTIPLIERS = { ...SIZE_MULTIPLIERS, ...(o.size_multipliers as Record<SizeKey, number>) };
  }
  if (o.frame_costs) {
    FRAME_COSTS = { ...FRAME_COSTS, ...(o.frame_costs as Record<FrameOption, number>) };
  }
  if (o.medium_days) {
    MEDIUM_DAYS = { ...MEDIUM_DAYS, ...(o.medium_days as Record<Medium, number>) };
  }
  if (o.addon_prices) {
    ADDON_PRICES = {
      ...ADDON_PRICES,
      ...(o.addon_prices.digital_copy !== undefined ? { digitalCopy: o.addon_prices.digital_copy } : {}),
      ...(o.addon_prices.certificate_of_authenticity !== undefined ? { certificateOfAuthenticity: o.addon_prices.certificate_of_authenticity } : {}),
    };
  }
  if (typeof o.gst_rate === 'number') GST_RATE = o.gst_rate;
  if (typeof o.rush_delivery_surcharge === 'number') RUSH_DELIVERY_SURCHARGE = o.rush_delivery_surcharge;
  _version += 1;
  _listeners.forEach((fn) => fn());
}

/**
 * One-shot loader: fetch latest pricing from CMS and apply overrides.
 * Safe to call multiple times — last write wins. Silently ignores network failure.
 */
export async function loadPricingFromCMS(): Promise<void> {
  try {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const res = await fetch(`${base}/api/content/pricing`, { credentials: 'include' });
    if (!res.ok) return;
    const json = await res.json();
    applyPricingOverrides(json?.data as PricingOverrides);
  } catch {
    /* offline / network error — keep defaults */
  }
}

/**
 * Non-linear complexity multiplier based on face count
 * Formula: 1.0 + (faces * 0.45)
 * Intentionally non-linear — adding a 3rd face costs more than adding a 2nd
 * because compositional complexity grows exponentially with each face
 */
export function calculateComplexityMultiplier(faces: number): number {
  if (faces <= 0) return 1.0;
  if (faces === 1) return 1.0;
  // Non-linear: each additional face adds more than the previous
  return 1.0 + (faces - 1) * 0.45 + Math.max(0, faces - 3) * 0.15;
}

/**
 * Main pricing calculator
 * Formula: Total = (Medium_Base_Price × Size_Multiplier × Complexity_Multiplier) + Frame_Cost + Add-ons + Rush
 */
export function calculatePrice(config: PricingConfig): PriceBreakdown {
  const basePrice = MEDIUM_BASE_PRICES[config.medium];
  const sizeMultiplier = SIZE_MULTIPLIERS[config.sizeKey];
  const complexityMultiplier = calculateComplexityMultiplier(config.faces);

  const artworkSubtotal = basePrice * sizeMultiplier * complexityMultiplier;
  const frameCost = FRAME_COSTS[config.frameOption];

  const addOnsCost =
    (config.digitalCopy ? ADDON_PRICES.digitalCopy : 0) +
    (config.certificateOfAuthenticity ? ADDON_PRICES.certificateOfAuthenticity : 0);

  const preRushTotal = artworkSubtotal + frameCost + addOnsCost;
  const rushFee = config.rushDelivery ? preRushTotal * RUSH_DELIVERY_SURCHARGE : 0;

  const subtotal = preRushTotal + rushFee;
  const gst = subtotal * GST_RATE;
  const total = subtotal + gst;

  const depositAmount = total * DEPOSIT_PERCENTAGE;
  const balanceAmount = total - depositAmount;

  // Estimated days: base days for medium + extra for faces + rush reduction
  const baseDays = MEDIUM_DAYS[config.medium];
  const faceDays = Math.max(0, config.faces - 1) * 2;
  const rushReduction = config.rushDelivery ? Math.floor(baseDays * 0.4) : 0;
  const estimatedDays = Math.max(2, baseDays + faceDays - rushReduction);

  return {
    basePrice,
    sizeMultiplier,
    complexityMultiplier,
    frameCost,
    addOnsCost,
    rushFee,
    subtotal,
    gst,
    total,
    depositAmount,
    balanceAmount,
    estimatedDays,
  };
}

/**
 * Format price in INR with Indian number formatting
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Get human-readable medium label
 */
export function getMediumLabel(medium: Medium): string {
  const labels: Record<Medium, string> = {
    watercolor: 'Watercolour',
    pencil: 'Pencil Sketch',
    oil: 'Oil on Canvas',
    charcoal: 'Charcoal',
    digital: 'Digital Art',
    pastel: 'Soft Pastel',
  };
  return labels[medium];
}

/**
 * Get size display label
 */
export function getSizeLabel(sizeKey: SizeKey): string {
  const labels: Record<SizeKey, string> = {
    A4: 'A4 (8×12 in)',
    A3: 'A3 (12×16 in)',
    A2: 'A2 (16×24 in)',
    '12x16': '12×16 in',
    '16x20': '16×20 in',
    '20x24': '20×24 in',
    '24x30': '24×30 in',
  };
  return labels[sizeKey];
}

export { MEDIUM_BASE_PRICES, SIZE_MULTIPLIERS, FRAME_COSTS, MEDIUM_DAYS };
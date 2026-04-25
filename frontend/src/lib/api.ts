// Thin API helper for new Kalakriti features (WhatsApp, Cashfree, Orders, Auth)
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status}: ${txt}`);
  }
  return res.json();
}

export interface OrderItem {
  medium?: string;
  size?: string;
  frame?: string;
  faces?: number;
  addons?: string[];
  notes?: string;
  reference_urls?: string[];
}

export interface Order {
  order_id: string;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  items: OrderItem[];
  amount: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_plan?: 'full' | 'advance_25';
  advance_amount?: number;
  paid_amount?: number;
  balance_due?: number;
  payment_method?: string;
  courier?: string;
  tracking_id?: string;
  timeline: { status: string; at: string; note?: string; courier?: string; tracking_id?: string }[];
  created_at: string;
  updated_at: string;
  cf_payment_session_id?: string;
  notes?: string;
}

export interface Me {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'admin' | 'customer';
}

// ===== CMS Listings =====
export interface CmsMedium {
  id: string;
  key: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  image_alt: string;
  starting_price: number;
  turnaround: string;
  tag: string;
  tag_color: string;
}

export interface CmsHeroItem {
  id: string;
  before: string;
  before_alt: string;
  after: string;
  after_alt: string;
  medium: string;
  turnaround: string;
  size: string;
}

export interface CmsGalleryItem {
  id: string;
  title: string;
  medium: string;
  size: string;
  image: string;
  alt: string;
  tag: string;
}

export interface CmsPricing {
  medium_base_prices: Record<string, number>;
  size_multipliers: Record<string, number>;
  frame_costs: Record<string, number>;
  medium_days: Record<string, number>;
  addon_prices: Record<string, number>;
  gst_rate: number;
  rush_delivery_surcharge: number;
}

export async function fetchContent<T = any>(section: string): Promise<T> {
  const r = await api<{ data: T }>(`/api/content/${section}`);
  return r.data;
}

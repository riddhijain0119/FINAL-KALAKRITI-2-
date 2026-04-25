"""
Shiprocket integration service.
Handles auth token caching, order creation, AWB assignment, label generation,
courier rate lookup, and tracking. Degrades gracefully on network error.
"""
import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger(__name__)

SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external"
EMAIL = os.environ.get("SHIPROCKET_API_EMAIL", "")
PASSWORD = os.environ.get("SHIPROCKET_API_PASSWORD", "")
PICKUP_PINCODE = os.environ.get("SHIPROCKET_PICKUP_PINCODE", "")
PICKUP_LOCATION = os.environ.get("SHIPROCKET_PICKUP_LOCATION", "Primary")

# in-memory token cache (Shiprocket tokens last 10 days)
_token: Optional[str] = None
_token_expires: Optional[datetime] = None


def is_configured() -> bool:
    return bool(EMAIL and PASSWORD and PICKUP_PINCODE)


async def _get_token(force: bool = False) -> str:
    global _token, _token_expires
    if not is_configured():
        raise RuntimeError("Shiprocket not configured")
    if not force and _token and _token_expires and _token_expires > datetime.now(timezone.utc) + timedelta(hours=1):
        return _token
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(f"{SHIPROCKET_BASE}/auth/login",
                              json={"email": EMAIL, "password": PASSWORD})
        if r.status_code != 200:
            raise RuntimeError(f"Shiprocket auth failed: {r.status_code} {r.text[:200]}")
        data = r.json()
        _token = data["token"]
        _token_expires = datetime.now(timezone.utc) + timedelta(days=9)
        return _token


async def _request(method: str, path: str, **kwargs) -> Any:
    """Authenticated request with one auto-retry on 401."""
    token = await _get_token()
    headers = kwargs.pop("headers", {}) or {}
    headers["Authorization"] = f"Bearer {token}"
    headers.setdefault("Content-Type", "application/json")
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.request(method, f"{SHIPROCKET_BASE}{path}", headers=headers, **kwargs)
        if r.status_code == 401:
            token = await _get_token(force=True)
            headers["Authorization"] = f"Bearer {token}"
            r = await client.request(method, f"{SHIPROCKET_BASE}{path}", headers=headers, **kwargs)
        if r.status_code >= 400:
            raise RuntimeError(f"Shiprocket API {method} {path} failed: {r.status_code} {r.text[:300]}")
        return r.json()


# ---- public helpers ----
async def serviceability(delivery_pincode: str, weight_kg: float = 0.5, cod: bool = False) -> List[Dict]:
    """List available couriers + rates for a delivery pincode."""
    params = {
        "pickup_postcode": PICKUP_PINCODE,
        "delivery_postcode": delivery_pincode,
        "weight": weight_kg,
        "cod": 1 if cod else 0,
    }
    data = await _request("GET", "/courier/serviceability/", params=params)
    couriers = (data.get("data") or {}).get("available_courier_companies") or []
    return [
        {
            "courier_company_id": c.get("courier_company_id"),
            "courier_name": c.get("courier_name"),
            "rate": c.get("rate"),
            "estimated_delivery_days": c.get("estimated_delivery_days"),
            "rating": c.get("rating"),
        }
        for c in couriers[:10]
    ]


def _build_create_order_payload(order: Dict, weight_kg: float = 0.5, length_cm: float = 35,
                                breadth_cm: float = 25, height_cm: float = 5) -> Dict:
    """Map our Mongo order doc into Shiprocket /orders/create/adhoc payload."""
    items = order.get("items") or []
    sub_total = float(order.get("amount") or 0)
    addr = order.get("shipping_address") or ""
    # naive parse: assume comma-separated "Address, City, State, Pincode"
    parts = [p.strip() for p in addr.split(",")] if addr else []
    pincode = ""
    state = "Maharashtra"
    city = "Mumbai"
    address1 = addr or "Address on file"
    for p in reversed(parts):
        if p.isdigit() and len(p) == 6:
            pincode = p
            break
    if len(parts) >= 3:
        city = parts[-3] if not parts[-1].isdigit() else parts[-2]
    name = order.get("customer_name") or "Customer"
    name_parts = name.strip().split()
    first = name_parts[0]
    last = " ".join(name_parts[1:]) or "Kalakriti"
    order_items = [{
        "name": f"Kalakriti {(it.get('medium') or '').title()} {it.get('size') or ''} portrait".strip(),
        "sku": f"KLK-{(it.get('medium') or 'art').upper()}-{(it.get('size') or 'std')}",
        "units": 1,
        "selling_price": str(round(sub_total / max(len(items), 1), 2)),
        "discount": "",
        "tax": "",
        "hsn": 970110,  # paintings, drawings & pastels (HSN code for handmade art)
    } for it in items] or [{
        "name": "Kalakriti handcrafted portrait",
        "sku": "KLK-PORTRAIT",
        "units": 1, "selling_price": str(sub_total),
        "discount": "", "tax": "", "hsn": 970110,
    }]
    return {
        "order_id": order["order_id"],
        "order_date": (order.get("created_at") or datetime.now(timezone.utc).isoformat()).split("T")[0],
        "pickup_location": PICKUP_LOCATION,
        "billing_customer_name": first,
        "billing_last_name": last,
        "billing_address": address1,
        "billing_city": city,
        "billing_pincode": pincode or PICKUP_PINCODE,
        "billing_state": state,
        "billing_country": "India",
        "billing_email": order.get("customer_email") or "",
        "billing_phone": order.get("customer_phone") or "",
        "shipping_is_billing": True,
        "order_items": order_items,
        "payment_method": "Prepaid",
        "sub_total": sub_total,
        "length": length_cm, "breadth": breadth_cm, "height": height_cm, "weight": weight_kg,
    }


async def create_order(order: Dict) -> Dict:
    payload = _build_create_order_payload(order)
    res = await _request("POST", "/orders/create/adhoc", json=payload)
    return {
        "shiprocket_order_id": res.get("order_id"),
        "shipment_id": res.get("shipment_id"),
        "status": res.get("status"),
        "raw": res,
    }


async def assign_awb(shipment_id: int, courier_id: Optional[int] = None) -> Dict:
    body: Dict[str, Any] = {"shipment_id": shipment_id}
    if courier_id:
        body["courier_id"] = courier_id
    res = await _request("POST", "/courier/assign/awb", json=body)
    data = res.get("response", {}).get("data") if isinstance(res.get("response"), dict) else res
    return {
        "awb_code": (data or {}).get("awb_code"),
        "courier_name": (data or {}).get("courier_name"),
        "courier_company_id": (data or {}).get("courier_company_id"),
        "raw": res,
    }


async def generate_label(shipment_id: int) -> str:
    """Returns a label PDF URL hosted on Shiprocket CDN."""
    res = await _request("POST", "/courier/generate/label", json={"shipment_id": [shipment_id]})
    return res.get("label_url") or ""


async def track_awb(awb: str) -> Dict:
    res = await _request("GET", f"/courier/track/awb/{awb}")
    track = (res.get("tracking_data") or {})
    shipment_track = (track.get("shipment_track") or [{}])[0]
    return {
        "current_status": shipment_track.get("current_status") or track.get("track_status"),
        "tracking_url": shipment_track.get("track_url") or track.get("track_url") or f"https://shiprocket.co/tracking/{awb}",
        "etd": shipment_track.get("etd"),
        "history": track.get("shipment_track_activities") or [],
    }

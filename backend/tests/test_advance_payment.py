"""Tests for 25% advance payment plan feature."""
import os
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
# Frontend .env
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')

API = f"{BASE_URL}/api"

def _base_order(amount=8000, plan=None):
    body = {
        "customer_name": "TEST_Advance",
        "customer_email": "test_advance@example.com",
        "customer_phone": "9999900001",
        "shipping_address": "Test St, Pune",
        "items": [{"medium": "watercolor", "size": "A4", "faces": 1}],
        "amount": amount,
    }
    if plan is not None:
        body["payment_plan"] = plan
    return body

def test_health():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("ok") is True

def test_create_order_advance_25_sets_amounts():
    r = requests.post(f"{API}/orders", json=_base_order(8000, "advance_25"))
    assert r.status_code == 200, r.text
    o = r.json()
    assert o["payment_plan"] == "advance_25"
    assert o["advance_amount"] == 2000.0
    assert o["balance_due"] == 8000.0
    assert o["amount"] == 8000
    assert o["payment_status"] == "PENDING"
    assert o["status"] == "Placed"

def test_create_order_full_default():
    r = requests.post(f"{API}/orders", json=_base_order(5000))
    assert r.status_code == 200
    o = r.json()
    assert o["payment_plan"] == "full"
    assert o["advance_amount"] == 5000
    assert o["balance_due"] == 5000

def test_create_order_full_explicit():
    r = requests.post(f"{API}/orders", json=_base_order(5000, "full"))
    assert r.status_code == 200
    assert r.json()["payment_plan"] == "full"

def test_advance_flow_end_to_end():
    # 1. Create advance_25 order
    r = requests.post(f"{API}/orders", json=_base_order(8000, "advance_25"))
    oid = r.json()["order_id"]

    # 2. Create advance charge
    r = requests.post(f"{API}/payments/cashfree/create", params={"order_id": oid, "installment": "advance"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["charge_amount"] == 2000.0
    assert data["installment"] == "advance"
    assert data.get("mock") is True

    # 3. Mock confirm advance
    r = requests.post(f"{API}/payments/cashfree/mock-confirm", params={"order_id": oid})
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["payment_status"] == "SUCCESS"  # webhook mapped
    assert j["paid_amount"] == 2000.0
    assert j["balance_due"] == 6000.0

    # 4. Verify order state - ADVANCE_PAID
    r = requests.get(f"{API}/orders/{oid}", params={"email": "test_advance@example.com"})
    assert r.status_code == 200
    o = r.json()
    assert o["payment_status"] == "ADVANCE_PAID"
    assert o["status"] == "Confirmed"
    assert o["paid_amount"] == 2000.0
    assert o["balance_due"] == 6000.0

    # 5. Create balance charge
    r = requests.post(f"{API}/payments/cashfree/create", params={"order_id": oid, "installment": "balance"})
    assert r.status_code == 200
    assert r.json()["charge_amount"] == 6000.0

    # 6. Mock confirm balance
    r = requests.post(f"{API}/payments/cashfree/mock-confirm", params={"order_id": oid})
    assert r.status_code == 200
    j = r.json()
    assert j["paid_amount"] == 8000.0
    assert j["balance_due"] == 0

    # 7. Verify final state
    r = requests.get(f"{API}/orders/{oid}", params={"email": "test_advance@example.com"})
    o = r.json()
    assert o["payment_status"] == "SUCCESS"
    assert o["paid_amount"] == 8000.0
    assert o["balance_due"] == 0

    # 8. Further charge should 400
    r = requests.post(f"{API}/payments/cashfree/create", params={"order_id": oid, "installment": "full"})
    assert r.status_code == 400

def test_full_flow_single_confirm():
    r = requests.post(f"{API}/orders", json=_base_order(3000, "full"))
    oid = r.json()["order_id"]
    r = requests.post(f"{API}/payments/cashfree/create", params={"order_id": oid, "installment": "advance"})
    assert r.status_code == 200
    assert r.json()["charge_amount"] == 3000.0
    r = requests.post(f"{API}/payments/cashfree/mock-confirm", params={"order_id": oid})
    assert r.status_code == 200
    r = requests.get(f"{API}/orders/{oid}", params={"email": "test_advance@example.com"})
    o = r.json()
    assert o["payment_status"] == "SUCCESS"
    assert o["balance_due"] == 0
    assert o["paid_amount"] == 3000.0

def test_auth_gating_orders_list():
    r = requests.get(f"{API}/orders")
    assert r.status_code == 401

def test_chat_link():
    r = requests.get(f"{API}/whatsapp/chat-link", params={"message": "hi"})
    assert r.status_code == 200
    assert "wa.me" in r.json()["wa_link"]

def test_get_order_requires_email():
    r = requests.post(f"{API}/orders", json=_base_order(1000))
    oid = r.json()["order_id"]
    r = requests.get(f"{API}/orders/{oid}")
    assert r.status_code == 403

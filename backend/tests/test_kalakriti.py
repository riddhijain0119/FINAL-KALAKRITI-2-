"""Kalakriti backend API tests - orders, payments, whatsapp, auth."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://project-restore-27.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created_order(client):
    payload = {
        "customer_name": "TEST_User",
        "customer_email": "TEST_user@example.com",
        "customer_phone": "919999900001",
        "shipping_address": "123 Test St, Test City",
        "items": [{"medium": "Oil", "size": "A4", "frame": "Wood", "faces": 1, "notes": "test"}],
        "amount": 1500.00,
        "currency": "INR",
        "notes": "TEST order",
    }
    r = client.post(f"{API}/orders", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["order_id"].startswith("KLK-")
    assert data["status"] == "Placed"
    assert isinstance(data["timeline"], list) and len(data["timeline"]) >= 1
    assert data["timeline"][0]["status"] == "Placed"
    return data


# ---------- Health ----------
def test_health(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200
    j = r.json()
    assert j.get("ok") is True


# ---------- Orders ----------
def test_create_order(created_order):
    assert created_order["customer_email"] == "test_user@example.com"
    assert created_order["payment_status"] == "PENDING"


def test_get_order_with_email(client, created_order):
    oid = created_order["order_id"]
    r = client.get(f"{API}/orders/{oid}", params={"email": "TEST_user@example.com"})
    assert r.status_code == 200
    assert r.json()["order_id"] == oid


def test_get_order_without_email_403(client, created_order):
    oid = created_order["order_id"]
    r = client.get(f"{API}/orders/{oid}")
    assert r.status_code == 403


def test_get_order_wrong_email_403(client, created_order):
    oid = created_order["order_id"]
    r = client.get(f"{API}/orders/{oid}", params={"email": "wrong@x.com"})
    assert r.status_code == 403


def test_get_order_not_found(client):
    r = client.get(f"{API}/orders/KLK-NOPE-000000", params={"email": "x@y.com"})
    assert r.status_code == 404


# ---------- Auth gating ----------
def test_auth_me_unauth(client):
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_patch_status_unauth(client, created_order):
    r = requests.patch(f"{API}/orders/{created_order['order_id']}/status",
                       json={"status": "Confirmed"})
    assert r.status_code == 401


def test_admin_stats_unauth(client):
    r = requests.get(f"{API}/admin/stats")
    assert r.status_code == 401


def test_list_orders_unauth(client):
    r = requests.get(f"{API}/orders")
    assert r.status_code == 401


# ---------- Cashfree (mock mode) ----------
def test_cashfree_create_mock(client, created_order):
    oid = created_order["order_id"]
    r = client.post(f"{API}/payments/cashfree/create", params={"order_id": oid})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("mock") is True
    assert data["order_id"] == oid
    assert data["payment_session_id"].startswith("mock_session_")


def test_cashfree_create_missing_order(client):
    r = client.post(f"{API}/payments/cashfree/create", params={"order_id": "KLK-NOPE-000000"})
    assert r.status_code == 404


def test_cashfree_webhook_success(client, created_order):
    oid = created_order["order_id"]
    payload = {
        "data": {
            "order": {"order_id": oid},
            "payment": {"payment_status": "SUCCESS", "cf_payment_id": "cf_test_123",
                        "payment_method": "upi"},
        }
    }
    r = client.post(f"{API}/payments/cashfree/webhook", json=payload)
    assert r.status_code == 200, r.text
    assert r.json().get("payment_status") == "SUCCESS"

    # Verify DB update via public GET
    g = client.get(f"{API}/orders/{oid}", params={"email": "TEST_user@example.com"})
    assert g.status_code == 200
    od = g.json()
    assert od["payment_status"] == "SUCCESS"
    assert od["status"] == "Confirmed"
    statuses = [t["status"] for t in od["timeline"]]
    assert "Confirmed" in statuses


def test_cashfree_webhook_no_order_id(client):
    r = client.post(f"{API}/payments/cashfree/webhook", json={"data": {}})
    assert r.status_code == 200
    assert r.json().get("ok") is False


# ---------- WhatsApp ----------
def test_whatsapp_chat_link_default(client):
    r = client.get(f"{API}/whatsapp/chat-link")
    assert r.status_code == 200
    data = r.json()
    assert data["wa_link"].startswith("https://wa.me/")


def test_whatsapp_chat_link_message(client):
    r = client.get(f"{API}/whatsapp/chat-link", params={"message": "Hi there"})
    assert r.status_code == 200
    link = r.json()["wa_link"]
    assert "wa.me/" in link
    assert "text=" in link
    assert "Hi" in link

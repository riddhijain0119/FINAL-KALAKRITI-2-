"""
Kalakriti Backend API
- Emergent Google Auth (admin + customer)
- Orders (create / list / get / update status)
- Cashfree Payments (create order + webhook verify)
- WhatsApp Meta Cloud API (send confirmation + wa.me link)
"""
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import hmac
import base64
import json
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta
from urllib.parse import quote
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# --- Mongo ---
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# --- Config ---
ADMIN_EMAILS = [e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()]
# Cashfree
CF_APP_ID = os.environ.get('CASHFREE_APP_ID', '')
CF_SECRET = os.environ.get('CASHFREE_SECRET_KEY', '')
CF_MODE = os.environ.get('CASHFREE_MODE', 'TEST').upper()
CF_BASE = 'https://sandbox.cashfree.com/pg' if CF_MODE == 'TEST' else 'https://api.cashfree.com/pg'
# WhatsApp
WA_PHONE_ID = os.environ.get('META_WA_PHONE_NUMBER_ID', '')
WA_TOKEN = os.environ.get('META_WA_ACCESS_TOKEN', '')
WA_TEMPLATE = os.environ.get('META_WA_TEMPLATE_NAME', 'order_confirmation')
WA_ADVANCE_TEMPLATE = os.environ.get('META_WA_ADVANCE_TEMPLATE_NAME', 'advance_payment_received')
WA_BRAND_NAME = os.environ.get('WA_BRAND_NAME', 'Kalakriti')
WA_LANG = os.environ.get('META_WA_TEMPLATE_LANG', 'en_US')
BUSINESS_WA = os.environ.get('BUSINESS_WHATSAPP_NUMBER', '919999999999')
WA_GRAPH_VERSION = os.environ.get('META_WA_GRAPH_VERSION', 'v21.0')
# Emergent auth
EMERGENT_AUTH_URL = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data'
FRONTEND_URL = os.environ.get('FRONTEND_URL', '')

# --- App ---
app = FastAPI(title='Kalakriti API')
api_router = APIRouter(prefix="/api")


# ==================== Models ====================
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = 'customer'  # customer | admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderItem(BaseModel):
    medium: Optional[str] = None
    size: Optional[str] = None
    frame: Optional[str] = None
    faces: Optional[int] = 1
    addons: Optional[List[str]] = []
    notes: Optional[str] = ''
    reference_urls: Optional[List[str]] = []

class CreateOrderRequest(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str  # digits only, E.164-ish
    shipping_address: str
    items: List[OrderItem]
    amount: float  # INR (total)
    currency: str = 'INR'
    notes: Optional[str] = ''
    payment_plan: str = 'full'  # 'full' | 'advance_25'

class OrderStatusUpdate(BaseModel):
    status: str  # Placed | Confirmed | In Production | Shipped | Out for Delivery | Delivered | Cancelled
    note: Optional[str] = ''
    courier: Optional[str] = ''
    tracking_id: Optional[str] = ''

ORDER_STATUSES = ['Placed', 'Confirmed', 'In Production', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']


# ==================== Auth helpers ====================
async def get_current_user(request: Request) -> Optional[dict]:
    token = request.cookies.get('session_token')
    if not token:
        auth = request.headers.get('authorization') or request.headers.get('Authorization')
        if auth and auth.lower().startswith('bearer '):
            token = auth.split(' ', 1)[1].strip()
    if not token:
        return None
    sess = await db.user_sessions.find_one({'session_token': token}, {'_id': 0})
    if not sess:
        return None
    exp = sess.get('expires_at')
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp and exp < datetime.now(timezone.utc):
        return None
    user = await db.users.find_one({'user_id': sess['user_id']}, {'_id': 0})
    return user

async def require_user(request: Request) -> dict:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail='Not authenticated')
    return user

async def require_admin(request: Request) -> dict:
    user = await require_user(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    return user


# ==================== Health ====================
@api_router.get("/")
async def root():
    return {'message': 'Kalakriti API', 'ok': True}


# ==================== Auth endpoints ====================
@api_router.post('/auth/session')
async def auth_session(response: Response, x_session_id: str = Header(None, alias='X-Session-ID')):
    """Exchange Emergent session_id for our server-side session_token."""
    if not x_session_id:
        raise HTTPException(status_code=400, detail='Missing X-Session-ID')
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(EMERGENT_AUTH_URL, headers={'X-Session-ID': x_session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail='Invalid session')
    data = r.json()
    email = (data.get('email') or '').lower()
    name = data.get('name') or email
    picture = data.get('picture')
    session_token = data.get('session_token')
    if not email or not session_token:
        raise HTTPException(status_code=401, detail='Incomplete session data')

    # Upsert user
    existing = await db.users.find_one({'email': email}, {'_id': 0})
    role = 'admin' if email in ADMIN_EMAILS else 'customer'
    if existing:
        user_id = existing['user_id']
        await db.users.update_one({'user_id': user_id}, {'$set': {'name': name, 'picture': picture, 'role': role}})
    else:
        user_id = f'user_{uuid.uuid4().hex[:12]}'
        await db.users.insert_one({
            'user_id': user_id, 'email': email, 'name': name, 'picture': picture,
            'role': role, 'created_at': datetime.now(timezone.utc).isoformat()
        })

    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        'user_id': user_id,
        'session_token': session_token,
        'expires_at': expires_at,
        'created_at': datetime.now(timezone.utc),
    })

    # Set httpOnly cookie
    response.set_cookie(
        key='session_token', value=session_token, httponly=True, secure=True,
        samesite='none', path='/', max_age=7*24*60*60,
    )
    return {'user_id': user_id, 'email': email, 'name': name, 'picture': picture, 'role': role}


@api_router.get('/auth/me')
async def auth_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail='Not authenticated')
    return user


@api_router.post('/auth/logout')
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get('session_token')
    if token:
        await db.user_sessions.delete_many({'session_token': token})
    response.delete_cookie('session_token', path='/')
    return {'ok': True}


# ==================== Orders ====================
@api_router.post('/orders')
async def create_order(body: CreateOrderRequest, request: Request):
    user = await get_current_user(request)
    order_id = f'KLK-{datetime.now().strftime("%Y%m%d")}-{uuid.uuid4().hex[:6].upper()}'
    now = datetime.now(timezone.utc)
    plan = body.payment_plan if body.payment_plan in ('full', 'advance_25') else 'full'
    advance_amount = round(body.amount * 0.25, 2) if plan == 'advance_25' else body.amount
    balance_due = round(body.amount - advance_amount, 2)
    doc = {
        'order_id': order_id,
        'user_id': user['user_id'] if user else None,
        'customer_name': body.customer_name,
        'customer_email': body.customer_email.lower(),
        'customer_phone': ''.join(c for c in body.customer_phone if c.isdigit()),
        'shipping_address': body.shipping_address,
        'items': [i.model_dump() for i in body.items],
        'amount': body.amount,
        'currency': body.currency,
        'notes': body.notes,
        'payment_plan': plan,
        'advance_amount': advance_amount,
        'paid_amount': 0.0,
        'balance_due': body.amount,
        'status': 'Placed',
        'payment_status': 'PENDING',
        'payment_provider': 'cashfree',
        'timeline': [{'status': 'Placed', 'at': now.isoformat(), 'note': 'Order received'}],
        'created_at': now.isoformat(),
        'updated_at': now.isoformat(),
    }
    await db.orders.insert_one(doc)
    doc.pop('_id', None)
    return doc


@api_router.get('/orders')
async def list_orders(request: Request, status: Optional[str] = None, limit: int = 100):
    user = await require_user(request)
    q: Dict[str, Any] = {}
    if user.get('role') != 'admin':
        q['user_id'] = user['user_id']
    if status:
        q['status'] = status
    docs = await db.orders.find(q, {'_id': 0}).sort('created_at', -1).to_list(limit)
    return docs


@api_router.get('/orders/{order_id}')
async def get_order(order_id: str, request: Request):
    # Public tracking by order_id + email OR authenticated user
    order = await db.orders.find_one({'order_id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    user = await get_current_user(request)
    email = (request.query_params.get('email') or '').lower()
    if user and user.get('role') == 'admin':
        return order
    if user and user['user_id'] == order.get('user_id'):
        return order
    if email and email == order.get('customer_email'):
        return order
    raise HTTPException(status_code=403, detail='Provide order email for tracking')


@api_router.patch('/orders/{order_id}/status')
async def update_order_status(order_id: str, body: OrderStatusUpdate, request: Request):
    await require_admin(request)
    if body.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f'Invalid status. Must be one of {ORDER_STATUSES}')
    order = await db.orders.find_one({'order_id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    now = datetime.now(timezone.utc).isoformat()
    timeline_entry = {'status': body.status, 'at': now, 'note': body.note or ''}
    if body.courier:
        timeline_entry['courier'] = body.courier
    if body.tracking_id:
        timeline_entry['tracking_id'] = body.tracking_id
    update = {
        '$set': {'status': body.status, 'updated_at': now},
        '$push': {'timeline': timeline_entry},
    }
    if body.courier or body.tracking_id:
        update['$set']['courier'] = body.courier or order.get('courier', '')
        update['$set']['tracking_id'] = body.tracking_id or order.get('tracking_id', '')
    await db.orders.update_one({'order_id': order_id}, update)
    return await db.orders.find_one({'order_id': order_id}, {'_id': 0})


@api_router.get('/admin/stats')
async def admin_stats(request: Request):
    await require_admin(request)
    total = await db.orders.count_documents({})
    paid = await db.orders.count_documents({'payment_status': 'SUCCESS'})
    pending = await db.orders.count_documents({'status': 'Placed'})
    shipped = await db.orders.count_documents({'status': 'Shipped'})
    delivered = await db.orders.count_documents({'status': 'Delivered'})
    # Revenue
    pipeline = [
        {'$match': {'payment_status': 'SUCCESS'}},
        {'$group': {'_id': None, 'total': {'$sum': '$amount'}}},
    ]
    rev = await db.orders.aggregate(pipeline).to_list(1)
    revenue = rev[0]['total'] if rev else 0
    return {
        'total_orders': total, 'paid_orders': paid, 'pending_orders': pending,
        'shipped_orders': shipped, 'delivered_orders': delivered, 'revenue': revenue,
    }


# ==================== Cashfree Payments ====================
@api_router.post('/payments/cashfree/create')
async def cashfree_create(order_id: str, installment: str = 'advance', request: Request = None):
    """installment = 'advance' (first charge: advance_amount) or 'balance' (pay remaining) or 'full' (whole amount)."""
    order = await db.orders.find_one({'order_id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')

    plan = order.get('payment_plan', 'full')
    paid = float(order.get('paid_amount') or 0)
    total = float(order['amount'])
    advance = float(order.get('advance_amount') or total)

    if installment == 'balance':
        charge = round(total - paid, 2)
        cf_oid = f"{order_id}-B{uuid.uuid4().hex[:4].upper()}"
    elif installment == 'full':
        charge = round(total - paid, 2)
        cf_oid = f"{order_id}-F{uuid.uuid4().hex[:4].upper()}"
    else:  # advance (default first payment)
        charge = advance if plan == 'advance_25' else total
        cf_oid = order_id  # first charge uses main order_id for clean webhook

    if charge <= 0:
        raise HTTPException(status_code=400, detail='Nothing to charge — order is already paid in full')

    return_url = f"{FRONTEND_URL}/payment/return?order_id={order_id}" if FRONTEND_URL else None

    payload = {
        'order_id': cf_oid,
        'order_amount': charge,
        'order_currency': order.get('currency', 'INR'),
        'customer_details': {
            'customer_id': order.get('user_id') or f"guest_{order_id}",
            'customer_email': order['customer_email'],
            'customer_phone': order['customer_phone'],
            'customer_name': order['customer_name'],
        },
        'order_meta': {'return_url': return_url},
        'order_note': f"Kalakriti {installment} payment for {order_id}",
        'order_tags': {'parent_order_id': order_id, 'installment': installment},
    }
    headers = {
        'x-api-version': '2023-08-01',
        'x-client-id': CF_APP_ID,
        'x-client-secret': CF_SECRET,
        'Content-Type': 'application/json',
    }
    if not CF_APP_ID or not CF_SECRET:
        mock_session = f'mock_session_{uuid.uuid4().hex}'
        await db.orders.update_one({'order_id': order_id}, {'$set': {
            'cf_payment_session_id': mock_session,
            'last_installment': installment,
            'last_charge_amount': charge,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }})
        return {'mock': True, 'order_id': order_id, 'payment_session_id': mock_session,
                'cf_mode': CF_MODE, 'charge_amount': charge, 'installment': installment,
                'message': 'Cashfree keys not configured. Returning mock session for dev.'}

    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.post(f'{CF_BASE}/orders', json=payload, headers=headers)
    if r.status_code not in (200, 201):
        raise HTTPException(status_code=400, detail=f'Cashfree error: {r.text}')
    data = r.json()
    session_id = data.get('payment_session_id')
    await db.orders.update_one({'order_id': order_id}, {'$set': {
        'cf_payment_session_id': session_id,
        'cf_order_id': data.get('cf_order_id'),
        'last_installment': installment,
        'last_charge_amount': charge,
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }})
    return {'order_id': order_id, 'payment_session_id': session_id,
            'cf_mode': CF_MODE, 'charge_amount': charge, 'installment': installment}


@api_router.post('/payments/cashfree/webhook')
async def cashfree_webhook(request: Request):
    raw = await request.body()
    sig = request.headers.get('x-webhook-signature', '')
    ts = request.headers.get('x-webhook-timestamp', '')
    # Verify signature: base64(HMAC_SHA256(secret, timestamp + body))
    if CF_SECRET and sig and ts:
        msg = (ts + raw.decode('utf-8')).encode('utf-8')
        expected = base64.b64encode(hmac.new(CF_SECRET.encode(), msg, hashlib.sha256).digest()).decode()
        if not hmac.compare_digest(expected, sig):
            logger.warning('Cashfree webhook signature invalid')
            # Still 200 to avoid retries storms; but in prod you may want 401
    try:
        payload = json.loads(raw.decode('utf-8'))
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid JSON')

    data = payload.get('data', {}) or {}
    order_obj = data.get('order', {}) or {}
    payment_obj = data.get('payment', {}) or {}
    cf_order_id_incoming = order_obj.get('order_id') or payload.get('order_id') or ''
    # Parent order_id: strip trailing "-B<hex>" / "-F<hex>" suffix for installment follow-ups
    parent_id = cf_order_id_incoming.split('-B')[0].split('-F')[0]
    order_id = parent_id
    pay_status = payment_obj.get('payment_status') or order_obj.get('order_status')
    paid_now = float(payment_obj.get('payment_amount') or order_obj.get('order_amount') or 0)
    installment = (order_obj.get('order_tags') or payload.get('order_tags') or {}).get('installment', 'advance')

    if not order_id:
        return {'ok': False, 'reason': 'no order_id'}

    mapped = 'PENDING'
    if pay_status in ('SUCCESS', 'PAID'):
        mapped = 'SUCCESS'
    elif pay_status in ('FAILED', 'USER_DROPPED', 'CANCELLED'):
        mapped = 'FAILED'
    elif pay_status in ('EXPIRED',):
        mapped = 'EXPIRED'

    now = datetime.now(timezone.utc).isoformat()
    order = await db.orders.find_one({'order_id': order_id}, {'_id': 0})
    if not order:
        return {'ok': False, 'reason': 'order missing'}

    total = float(order['amount'])
    already_paid = float(order.get('paid_amount') or 0)
    new_paid = already_paid
    set_fields = {
        'payment_method': payment_obj.get('payment_method') or payment_obj.get('payment_group'),
        'cf_payment_id': payment_obj.get('cf_payment_id'),
        'updated_at': now,
    }
    push_entry = None
    if mapped == 'SUCCESS':
        new_paid = round(already_paid + paid_now, 2)
        balance = round(total - new_paid, 2)
        set_fields['paid_amount'] = new_paid
        set_fields['balance_due'] = max(balance, 0)
        if balance <= 0.01:
            set_fields['payment_status'] = 'SUCCESS'
            set_fields['status'] = 'Confirmed' if order.get('status') == 'Placed' else order.get('status')
            push_entry = {'status': set_fields['status'], 'at': now,
                          'note': f'Payment complete (₹{new_paid} of ₹{total})'}
        else:
            set_fields['payment_status'] = 'ADVANCE_PAID'
            if order.get('status') == 'Placed':
                set_fields['status'] = 'Confirmed'
                push_entry = {'status': 'Confirmed', 'at': now,
                              'note': f'Advance received (₹{new_paid} / ₹{total}). Balance ₹{balance} due on completion.'}
    else:
        set_fields['payment_status'] = mapped if mapped != 'PENDING' else order.get('payment_status', 'PENDING')

    update = {'$set': set_fields}
    if push_entry:
        update['$push'] = {'timeline': push_entry}
    await db.orders.update_one({'order_id': order_id}, update)

    if mapped == 'SUCCESS':
        try:
            fresh = await db.orders.find_one({'order_id': order_id}, {'_id': 0})
            if fresh:
                await _send_whatsapp_confirmation(fresh)
        except Exception as e:
            logger.error(f'WhatsApp send failed: {e}')

    return {'ok': True, 'payment_status': mapped, 'installment': installment,
            'paid_amount': new_paid, 'balance_due': max(total - new_paid, 0)}


# Dev helper: simulate a successful Cashfree webhook for a given order (mock mode only)
@api_router.post('/payments/cashfree/mock-confirm')
async def mock_confirm(order_id: str):
    if CF_APP_ID and CF_SECRET:
        raise HTTPException(status_code=400, detail='Mock confirm disabled when Cashfree keys are set')
    order = await db.orders.find_one({'order_id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    last_charge = float(order.get('last_charge_amount') or order.get('advance_amount') or order['amount'])
    fake_payload = {
        'data': {
            'order': {'order_id': order_id, 'order_status': 'PAID', 'order_amount': last_charge,
                      'order_tags': {'installment': order.get('last_installment', 'advance')}},
            'payment': {'payment_status': 'SUCCESS', 'payment_amount': last_charge,
                        'payment_method': 'mock', 'cf_payment_id': f'mock_{uuid.uuid4().hex[:8]}'},
        }
    }
    # Re-dispatch through webhook logic
    class FakeReq:
        headers = {}
        async def body(self): return json.dumps(fake_payload).encode()
    return await cashfree_webhook(FakeReq())  # type: ignore


# ==================== WhatsApp ====================
async def _send_whatsapp_confirmation(order: dict) -> dict:
    if not WA_PHONE_ID or not WA_TOKEN:
        return {'mock': True, 'message': 'WhatsApp creds missing; logged only'}
    phone = order['customer_phone']
    if not phone:
        return {'ok': False, 'reason': 'no phone'}

    # Choose template based on whether balance remains (advance vs full-paid)
    balance = float(order.get('balance_due') or 0)
    paid = float(order.get('paid_amount') or order['amount'])
    if balance > 0.01:
        # Advance-payment template:
        # {{1}} name, {{2}} advance paid, {{3}} order id, {{4}} balance, {{5}} brand
        template_name = WA_ADVANCE_TEMPLATE
        params = [
            {'type': 'text', 'text': order.get('customer_name', 'Customer')},
            {'type': 'text', 'text': f"{paid:.0f}"},
            {'type': 'text', 'text': order['order_id']},
            {'type': 'text', 'text': f"{balance:.0f}"},
            {'type': 'text', 'text': WA_BRAND_NAME},
        ]
    else:
        # Full-payment confirmation template:
        # {{1}} name, {{2}} order id, {{3}} total amount
        template_name = WA_TEMPLATE
        params = [
            {'type': 'text', 'text': order.get('customer_name', 'Customer')},
            {'type': 'text', 'text': order['order_id']},
            {'type': 'text', 'text': f"INR {order['amount']:.2f}"},
        ]

    url = f'https://graph.facebook.com/{WA_GRAPH_VERSION}/{WA_PHONE_ID}/messages'
    payload = {
        'messaging_product': 'whatsapp',
        'to': phone,
        'type': 'template',
        'template': {
            'name': template_name,
            'language': {'code': WA_LANG},
            'components': [{'type': 'body', 'parameters': params}],
        },
    }
    headers = {'Authorization': f'Bearer {WA_TOKEN}', 'Content-Type': 'application/json'}
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.post(url, json=payload, headers=headers)
    return {'status': r.status_code, 'template': template_name,
            'body': r.json() if r.headers.get('content-type','').startswith('application/json') else r.text}


@api_router.post('/whatsapp/send-confirmation/{order_id}')
async def whatsapp_send(order_id: str, request: Request):
    await require_admin(request)
    order = await db.orders.find_one({'order_id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    result = await _send_whatsapp_confirmation(order)
    return result


@api_router.get('/whatsapp/chat-link')
async def whatsapp_chat_link(message: Optional[str] = None, phone: Optional[str] = None):
    target = (phone or BUSINESS_WA).replace('+', '').strip()
    if message:
        return {'wa_link': f'https://wa.me/{target}?text={quote(message)}', 'phone': target}
    return {'wa_link': f'https://wa.me/{target}', 'phone': target}


# ==================== Wire up ====================
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

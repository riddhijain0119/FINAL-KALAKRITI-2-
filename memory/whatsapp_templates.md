# WhatsApp Templates to Submit in Meta Business Manager

Submit these in WhatsApp Manager → Message Templates.
Category for both: **UTILITY**. Language: **English (en_US)**.

## 1. advance_payment_received  (used when balance_due > 0)
**Body:**
```
Hello {{1}},

Thank you! We have received your advance payment of ₹{{2}} for your order: {{3}}.

Your remaining balance of ₹{{4}} is due before dispatch/completion.

We will notify you once your order is ready.

For any queries, feel free to reply to this message.
Team {{5}}
```
Variables sent by backend:
- {{1}} = customer_name
- {{2}} = paid_amount (so far, e.g. "2000")
- {{3}} = order_id (e.g. "KLK-20260421-E9CB2E")
- {{4}} = balance_due (e.g. "6000")
- {{5}} = WA_BRAND_NAME env (default "Kalakriti")

## 2. order_confirmation  (used when balance_due = 0, i.e. fully paid)
**Body:**
```
Hello {{1}}, your Kalakriti order {{2}} is confirmed. Total paid: {{3}}.
Our artist begins work within 24 hours — you'll receive updates here.
```
Variables:
- {{1}} = customer_name
- {{2}} = order_id
- {{3}} = "INR <amount>"

## Env keys (/app/backend/.env)
- `META_WA_TEMPLATE_NAME=order_confirmation`
- `META_WA_ADVANCE_TEMPLATE_NAME=advance_payment_received`
- `WA_BRAND_NAME=Kalakriti`
- `META_WA_TEMPLATE_LANG=en_US`

Restart backend after updating: `sudo supervisorctl restart backend`

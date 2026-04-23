# Auth-Gated App Testing Playbook

## Setup Test User & Session
Use mongosh to seed a test user + session token. Ensure `user_id` is a custom UUID and `session_token` is stored in `user_sessions` with tz-aware expiry.

## Backend API Tests
- GET /api/auth/me with session_token (cookie or Authorization: Bearer) should return user data
- Protected endpoints must return 401 without a valid session

## Browser Testing
Set `session_token` cookie (httpOnly, secure, samesite=None) on the preview domain, then navigate.

## Checklist
- `user_id` field present (custom UUID, not _id)
- Queries use `{"_id": 0}` projection
- API returns user payload, not 401

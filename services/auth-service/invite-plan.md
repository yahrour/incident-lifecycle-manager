## Flow 1 — New Engineer:

1. Engineer clicks invite link:
   https://app.domain.com/register?token=abc123

2. Frontend calls:
   GET /invite/validate?token=abc123
   InviteService checks:
   - token exists in database
   - token not expired
   - token not used
   - check if email already registered
     Backend returns:
     { email, isAlreadyRegistered: false }

3. Frontend shows registration form:
   - email pre-filled and locked
     Engineer fills:
   - firstName, lastName, password, specialty
     Frontend calls:
     POST /invite/register
     { token, firstName, lastName, password, specialty }

4. InviteService:
   → validates token (exists, not expired, not used)
   → creates user with role: engineer ← hardcoded
   → calls Team Service to add member
   → Team Service checks if already in a team
   → marks token as used
   → returns { success: true }

5. Frontend redirects to /login
   Engineer logs in normally via POST /auth/login
   Lands on dashboard with team already there
   Toast: "Welcome to Team X"

---

## Flow 2 — Already Registered Engineer:

1. Engineer clicks invite link:
   https://app.domain.com/register?token=abc123

2. Frontend calls:
   GET /invite/validate?token=abc123
   InviteService checks:
   - token exists in database
   - token not expired
   - token not used
   - check if email already registered
     Backend returns:
     { email, isAlreadyRegistered: true }

3. Frontend redirects to:
   /login?token=abc123
   token kept in URL for after login

4. Engineer fills email and password
   Frontend calls:
   POST /auth/login { email, password }
   AuthService returns:
   { accessToken, refreshToken }

5. Frontend reads token from URL
   immediately calls:
   POST /invite/accept { token: "abc123" }
   with JWT in Authorization header

6. InviteService:
   → validates token (exists, not expired, not used)
   → confirms logged in user email matches token email
   → calls Team Service to add member
   → Team Service checks if already in a team
   → marks token as used
   → returns { success: true }

7. Frontend redirects to dashboard
   Toast: "Welcome to Team X"

### The service ownership is now crystal clear:

GET /invite/validate → InviteService
POST /invite/create → InviteService
POST /invite/register → InviteService
POST /invite/accept → InviteService

POST /auth/login → AuthService
POST /auth/register → AuthService
POST /auth/refresh → AuthService

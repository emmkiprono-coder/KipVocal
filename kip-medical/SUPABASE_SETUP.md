# Kip Vocal Intelligence — Database & Auth Setup Guide

## What this gives you

- **Supabase Postgres** database: sessions, profiles, coaching reports persist across devices
- **Magic link + Google auth**: users sign in with email or Google, no passwords
- **Row-level security**: users see only their own data
- **Admin dashboard**: you see all users, session history, confidence trends, readiness ratings
- **Graceful fallback**: if Supabase is not configured, the app runs on localStorage silently

---

## Step 1: Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Name it `kip-vocal-intelligence`
4. Choose a region close to your users (US East for Advocate Health footprint)
5. Set a strong database password and save it

---

## Step 2: Run the schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open a new query
3. Paste the entire contents of `supabase/schema.sql`
4. Click **Run**

You should see: `profiles`, `sessions`, `coaching_reports` tables created with RLS enabled.

---

## Step 3: Enable Google OAuth (optional but recommended)

1. In Supabase dashboard: **Authentication → Providers → Google**
2. Enable it
3. Go to [Google Cloud Console](https://console.cloud.google.com)
4. Create a project → Enable Google+ API → Create OAuth credentials
5. Add your Vercel URL to authorized redirect URIs:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-project.supabase.co/auth/v1/callback
   ```
6. Paste Client ID and Client Secret back into Supabase

---

## Step 4: Get your Supabase keys

In Supabase dashboard: **Settings → API**

Copy:
- **Project URL**: `https://xxxxx.supabase.co`
- **Anon/public key**: starts with `eyJ...`

---

## Step 5: Add environment variables to Vercel

In your Vercel project: **Settings → Environment Variables**

Add all three:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (your anon key) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (your Anthropic key) |

Set all three for **Production**, **Preview**, and **Development**.

---

## Step 6: Redeploy

After adding env vars, trigger a new deployment:

```bash
git commit --allow-empty -m "chore: trigger redeploy with Supabase env vars"
git push
```

Or click **Redeploy** in the Vercel dashboard.

---

## Step 7: Wire the hooks into your App.jsx

The integration layer is in `src/hooks/`. The key pattern:

```jsx
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useSessions } from './hooks/useSessions';
import { useCoaching } from './hooks/useCoaching';

export default function App() {
  const { user, signInWithEmail, signInWithGoogle, signOut } = useAuth();
  const { profile, saveProfile, clearProfile } = useProfile(user, 'medical');
  const { sessions, addSession, clearSessions } = useSessions(user, 'medical');
  const coaching = useCoaching(user);

  // Show AuthScreen if not signed in
  // Pass addSession as your onEnd handler
  // Pass coaching.generate() to your AI coaching page
}
```

See `src/App.root.jsx` for the full wiring pattern.

---

## File map

```
src/
├── lib/
│   └── supabase.js          Supabase client (checks env vars, graceful fallback)
├── hooks/
│   ├── useAuth.js           Auth state, magic link, Google OAuth
│   ├── useProfile.js        Profile sync: localStorage + Supabase
│   ├── useSessions.js       Session persistence: optimistic + sync to DB
│   └── useCoaching.js       AI coaching generation + save to DB
├── components/
│   ├── AuthScreen.jsx       Magic link + Google sign-in UI
│   └── AdminDashboard.jsx   CRM view of all users and sessions
└── App.root.jsx             Integration pattern (reference, not the main App)

supabase/
└── schema.sql               Full Postgres schema — run in Supabase SQL Editor
```

---

## Admin dashboard access

The `AdminDashboard` component reads from `sessions` joined to `profiles`. 

**Important**: The current admin view uses the anon key, which is limited by RLS to the logged-in user's own data. To see ALL users' data in the admin view, you need to either:

1. **Service role key** (recommended for a server-side admin route): add `SUPABASE_SERVICE_KEY` as a **non-VITE** env var and call it only from your `/api/` serverless functions — never expose it to the browser.

2. **Supabase Studio**: the simplest option — just use the Supabase dashboard directly to view tables. No code needed.

For a production admin dashboard, create a Vercel serverless function at `/api/admin` that uses the service role key and add an auth check for your email address.

---

## Data that persists

| Data | localStorage | Supabase |
|---|---|---|
| User profile (name, role, mode) | ✓ | ✓ |
| Session history | ✓ | ✓ |
| AI coaching reports | ✗ | ✓ |
| Attachment style | ✓ | ✓ |
| Partner profile | ✓ | ✓ |
| Scenario rubric scores | ✗ | ✓ (jsonb) |

---

## Estimated Supabase free tier limits

| Resource | Free limit | Kip usage estimate |
|---|---|---|
| Database size | 500 MB | ~10,000 sessions ≈ 50 MB |
| Monthly active users | 50,000 | Plenty for pilot |
| Auth users | Unlimited | Fine |
| API requests | 2M/month | Fine for internal tool |

The free tier is plenty for a pilot with your team. Upgrade to Pro ($25/mo) when you hit 50+ daily active users.

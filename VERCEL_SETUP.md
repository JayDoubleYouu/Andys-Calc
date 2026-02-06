# Vercel Deployment Setup

## Environment Variables

To deploy this application on Vercel, set these in your project:

**Path:** Vercel Dashboard → your project → **Settings** → **Environment Variables**

Add each variable, then choose **Production**, **Preview**, and **Development**. Click **Save**. After adding or changing variables, **redeploy** (Deployments → ⋮ on latest → Redeploy).

### 1. Supabase (required for sign-in and data)

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your project URL, e.g. `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your project anon/public key from Supabase Dashboard → Settings → API |

Without these, the app will show “Sign-in is not configured” on the login page.

### 2. OpenRouteService (for route calculator)

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_ORS_API_KEY` | Your key from [openrouteservice.org](https://openrouteservice.org/dev/#/signup) |

## Summary

1. Add **NEXT_PUBLIC_SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_ANON_KEY** (from Supabase).
2. Add **NEXT_PUBLIC_ORS_API_KEY** if you use the route calculator.
3. **Redeploy** after saving environment variables.

The `.env.local` file is for local development only and is **not** deployed to Vercel. Never commit secrets to git.

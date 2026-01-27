# Vercel Deployment Setup

## Environment Variables

To deploy this application on Vercel, you need to set the following environment variable:

### OpenRouteService API Key

1. Go to your Vercel project settings
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `NEXT_PUBLIC_ORS_API_KEY`
   - **Value**: `eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijc1Y2M4ZDQ1OGVjNjRjNTZhNjkwMGQxYTE4NjBjY2Y5IiwiaCI6Im11cm11cjY0In0=`
   - **Environment**: Production, Preview, and Development (select all)

4. Click **Save**
5. **Redeploy** your application for the changes to take effect

## Important Notes

- The API key is already set as a fallback in the code, but it's best practice to set it as an environment variable in Vercel
- After adding the environment variable, you must redeploy for it to take effect
- The `.env.local` file is for local development only and is not deployed to Vercel

## Deployment Steps

1. Push your code to GitHub (already done)
2. Import your GitHub repository in Vercel
3. Add the environment variable as described above
4. Deploy

The application should now work correctly on Vercel!

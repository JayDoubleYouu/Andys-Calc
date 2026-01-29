# How to Get Your Free OpenRouteService API Key

The default API key has expired. You need to get your own free API key to use the route calculator.

## Steps:

1. **Go to OpenRouteService**: https://openrouteservice.org/dev/#/signup

2. **Sign up for a free account**:
   - Click "Sign up" or "Get API Key"
   - Create an account (it's free)
   - Verify your email if required

3. **Get your API key**:
   - After logging in, go to your dashboard
   - Copy your API key (it will look like a long string of characters)

4. **Add it to your project**:
   - Open the `.env.local` file in the project root
   - Replace `your_api_key_here` with your actual API key
   - The line should look like: `NEXT_PUBLIC_ORS_API_KEY=your_actual_api_key_here`
   - Save the file

5. **Restart your dev server**:
   - Stop the current server (Ctrl+C in the terminal)
   - Run `npm run dev` again

That's it! The route calculator should now work.

## Note:
- The `.env.local` file is already in `.gitignore`, so your API key won't be committed to git
- The free tier includes 2,000 requests per day, which should be plenty for testing

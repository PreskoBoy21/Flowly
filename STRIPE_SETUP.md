# Stripe Setup Guide for Flowly

## Step 1: Create Stripe Price Objects

1. Replace `sk_test_YOUR_SECRET_KEY_HERE` in `create-stripe-prices.js` with your actual Stripe secret key
2. Run the script to create price objects:
   ```bash
   node create-stripe-prices.js
   ```
3. Copy the generated price IDs

## Step 2: Add Environment Variables

Add these environment variables to your Vercel deployment:

1. Go to your Vercel dashboard → Project Settings → Environment Variables
2. Add the following variables:

### Required Stripe Variables:
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_test_` or `sk_live_`)
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (starts with `pk_test_` or `pk_live_`)
- `STRIPE_PRO_PRICE_ID` - Price ID from the script output
- `STRIPE_BASIC_PRICE_ID` - Price ID from the script output
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (see Step 3)

## Step 3: Setup Stripe Webhooks

1. Go to your Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://www.myflowly.com/api/stripe-webhook`
4. Select these events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret and add it as `STRIPE_WEBHOOK_SECRET`

## Step 4: Test Payment Flow

1. Use test card numbers from Stripe documentation:
   - Success: `4242424242424242`
   - Decline: `4000000000000002`
2. Test the complete flow:
   - Sign up → Choose plan → Complete payment → Check webhook processing

## Common Issues:

### 422 Error:
- Check that price IDs are correct
- Ensure webhook secret is properly set
- Verify all required environment variables are present

### User Already Registered:
- The system now handles this gracefully
- Users will be redirected to login page
- Consider using the login flow instead of signup for existing users

## Environment Variables Checklist:
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PUBLISHABLE_KEY` 
- [ ] `STRIPE_PRO_PRICE_ID`
- [ ] `STRIPE_BASIC_PRICE_ID`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL` 
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' });

// Initialize Supabase client (service role key is recommended for server-side updates)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Add this to your .env.local
);

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  const buf = await req.arrayBuffer();

  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, webhookSecret!);
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    if (userId && stripeCustomerId && stripeSubscriptionId) {
      // Fetch subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

      // Upsert into subscriptions table
      await supabase
        .from('subscriptions')
        .upsert([
          {
            user_id: userId,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            status: subscription.status,
            plan_type: subscription.items.data[0].price.recurring?.interval,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          },
        ], { onConflict: ['user_id'] });

      // Update user role
      await supabase
        .from('profiles')
        .update({ role: 'pro_user' })
        .eq('id', userId);
    }
  }

  return NextResponse.json({ received: true });
} 
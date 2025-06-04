import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  // Initialize Stripe client inside the function to avoid build-time issues
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' });

  // Initialize Supabase client inside the function to avoid build-time issues
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  const buf = await req.arrayBuffer();

  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, webhookSecret!);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      if (!userId) {
        return NextResponse.json({ error: 'Missing userId in metadata' }, { status: 400 });
      }

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
            plan_type: subscription.items.data[0]?.price?.recurring?.interval,
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          },
        ], { onConflict: 'user_id' });

      break;
    
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // Handle subscription updates and cancellations
      const updatedSubscription = event.data.object as Stripe.Subscription;
      
      await supabase
        .from('subscriptions')
        .update({
          status: updatedSubscription.status,
          current_period_end: new Date((updatedSubscription as any).current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', updatedSubscription.id);
      
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
} 
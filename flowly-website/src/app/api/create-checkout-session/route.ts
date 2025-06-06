import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  // Initialize Stripe client inside the function to avoid build-time issues
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' });

  try {
    const body = await req.json();
    const { priceId, userId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Map plan names to actual Stripe price IDs
    let stripePriceId = priceId;
    if (priceId === 'price_pro_monthly') {
      stripePriceId = process.env.STRIPE_PRO_PRICE_ID;
    } else if (priceId === 'price_basic_monthly') {
      stripePriceId = process.env.STRIPE_BASIC_PRICE_ID;
    }

    if (!stripePriceId) {
      return NextResponse.json({ error: 'Invalid price ID or Stripe price not configured' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      metadata: {
        userId,
      },
      client_reference_id: userId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
} 
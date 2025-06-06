const Stripe = require('stripe');

// IMPORTANT: Replace with your LIVE secret key (starts with sk_live_)
// Make sure you're in LIVE MODE in your Stripe dashboard
const stripe = new Stripe('sk_live_YOUR_LIVE_SECRET_KEY_HERE', {
  apiVersion: '2025-04-30.basil',
});

async function createPrices() {
  try {
    console.log('🚨 CREATING LIVE PRICES - REAL PAYMENTS WILL BE PROCESSED! 🚨');
    console.log('Make sure you are in LIVE mode in your Stripe dashboard\n');
    
    // Create Pro plan price
    console.log('Creating Live Pro plan price...');
    const proPrice = await stripe.prices.create({
      unit_amount: 999, // $9.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      product_data: {
        name: 'Flowly Pro Plan',
        description: 'Advanced features, unlimited tasks, AI assistance',
      },
    });
    
    console.log('✅ Live Pro Plan Price ID:', proPrice.id);
    
    // Create Basic plan price
    console.log('Creating Live Basic plan price...');
    const basicPrice = await stripe.prices.create({
      unit_amount: 499, // $4.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      product_data: {
        name: 'Flowly Basic Plan',
        description: 'Essential features for personal productivity',
      },
    });
    
    console.log('✅ Live Basic Plan Price ID:', basicPrice.id);
    
    console.log('\n🔧 UPDATE THESE ENVIRONMENT VARIABLES IN VERCEL:');
    console.log('='.repeat(50));
    console.log(`STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY`);
    console.log(`STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY`);
    console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`);
    console.log(`STRIPE_BASIC_PRICE_ID=${basicPrice.id}`);
    console.log(`NEXT_PUBLIC_SITE_URL=https://www.myflowly.com`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error creating live prices:', error);
    console.log('\n💡 Make sure you:');
    console.log('1. Are in LIVE mode in Stripe dashboard');
    console.log('2. Have replaced sk_live_YOUR_LIVE_SECRET_KEY_HERE with your actual live key');
    console.log('3. Have activated your Stripe account (may need to verify business details)');
  }
}

createPrices(); 
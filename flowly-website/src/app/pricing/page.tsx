import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Pricing Plans - Flowly AI Productivity Planner | Free & Pro Options",
  description: "Choose the perfect Flowly plan for your productivity needs. Start free with basic features or upgrade to Pro for unlimited tasks, AI insights, and advanced planning tools.",
  keywords: [
    "productivity app pricing",
    "task management plans", 
    "AI planner cost",
    "habit tracker pricing",
    "productivity software plans",
    "free productivity app",
    "Pro productivity features"
  ],
  openGraph: {
    title: "Flowly Pricing - Choose Your Productivity Plan",
    description: "Start free or unlock unlimited productivity with Flowly Pro. Compare features and find the perfect plan for your needs.",
    url: "https://www.myflowly.com/pricing",
    images: ["/og-pricing.jpg"],
  },
  alternates: {
    canonical: "/pricing",
  },
}

const tiers = [
  {
    name: 'Free',
    id: 'tier-free',
    href: '/signup',
    price: { monthly: '€0' },
    description: 'Perfect for getting started with productivity planning and habit building.',
    features: [
      'Basic task management',
      'Up to 3 habits tracking',
      '1 goal setting',
      'Basic calendar view',
      'Email support',
    ],
    featured: false,
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '/signup?plan=pro',
    price: { monthly: '€7', yearly: '€59' },
    description: 'Everything you need for serious productivity and goal achievement with AI assistance.',
    features: [
      'Unlimited tasks and projects',
      'Unlimited habits tracking',
      'Unlimited goals',
      'Advanced calendar features',
      'AI-powered productivity assistant',
      'Weekly productivity insights',
      'Priority email support',
      'Custom AI task suggestions',
      'Advanced analytics',
      'Export capabilities',
    ],
    featured: true,
  },
]

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-base font-semibold leading-7 text-[#22c55e]">Pricing</h1>
          <p className="mt-2 text-4xl font-bold tracking-tight text-[#0f172a] sm:text-5xl">
            Choose the right plan for your productivity journey
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-[#64748b]">
            Start with our free plan and upgrade anytime to unlock all features and boost your productivity with AI-powered insights.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-3xl p-8 ring-1 ring-gray-200 xl:p-10 ${
                tier.featured ? 'bg-gray-50 ring-2 ring-[#22c55e]' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h2
                  className={`text-lg font-semibold leading-8 text-[#0f172a]`}
                >
                  {tier.name}
                </h2>
                {tier.featured && (
                  <p className="rounded-full bg-[#bbf7d0] px-2.5 py-1 text-xs font-semibold leading-5 text-[#16a34a]">
                    Most popular
                  </p>
                )}
              </div>
              <p className="mt-4 text-sm leading-6 text-[#64748b]">{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-[#0f172a]">
                  {tier.price.monthly}
                </span>
                <span className="text-sm font-semibold leading-6 text-[#64748b]">/month</span>
              </p>
              {tier.price.yearly && (
                <p className="mt-1 text-sm text-[#64748b]">
                  or {tier.price.yearly}/year (save 30%)
                </p>
              )}
              <Link
                href={tier.href}
                className={`mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  tier.featured
                    ? 'bg-[#22c55e] text-white hover:bg-[#16a34a] focus-visible:outline-[#22c55e]'
                    : 'bg-white text-[#0f172a] ring-1 ring-inset ring-gray-300 hover:ring-gray-400'
                }`}
                aria-label={`Get started with ${tier.name} plan`}
              >
                Get started today
              </Link>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-[#64748b]">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <svg
                      className="h-6 w-5 flex-none text-[#22c55e]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-24 max-w-2xl">
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-[#0f172a]">
            Frequently asked questions
          </h2>
          <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
            <div className="pt-6">
              <dt className="text-base font-semibold leading-7 text-[#0f172a]">
                Can I switch between plans?
              </dt>
              <dd className="mt-2 text-base leading-7 text-[#64748b]">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and you'll be charged or credited accordingly.
              </dd>
            </div>
            <div className="pt-6">
              <dt className="text-base font-semibold leading-7 text-[#0f172a]">
                Is there a free trial for Pro features?
              </dt>
              <dd className="mt-2 text-base leading-7 text-[#64748b]">
                Our Free plan includes core features to help you get started. You can upgrade to Pro anytime to access advanced AI features and unlimited capabilities.
              </dd>
            </div>
            <div className="pt-6">
              <dt className="text-base font-semibold leading-7 text-[#0f172a]">
                What payment methods do you accept?
              </dt>
              <dd className="mt-2 text-base leading-7 text-[#64748b]">
                We accept all major credit cards and process payments securely through Stripe. Your payment information is never stored on our servers.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
} 
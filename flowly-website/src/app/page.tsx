import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "AI-Powered Productivity Planner | Organize Tasks & Build Habits",
  description: "Transform your productivity with Flowly's AI-enhanced planner. Organize tasks, track habits, achieve goals, and get personalized insights. Start free today!",
  openGraph: {
    title: "Flowly - AI-Powered Productivity Planner",
    description: "Transform your productivity with AI-enhanced planning tools. Join thousands who've boosted their productivity with Flowly.",
    images: ["/og-image.jpg"],
  },
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header>
        <nav className="border-b border-gray-100 bg-white" role="navigation" aria-label="Main navigation">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex-shrink-0">
                <Link href="/" aria-label="Flowly homepage">
                  <h1 className="text-2xl font-bold text-[#0f172a]">Flowly</h1>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/pricing" className="text-[#64748b] hover:text-[#0f172a] px-3 py-2 text-sm font-medium">
                  Pricing
                </Link>
                <Link href="/login" className="text-[#64748b] hover:text-[#0f172a] px-3 py-2 text-sm font-medium">
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-[#22c55e] text-white hover:bg-[#16a34a] px-4 py-2 rounded-md text-sm font-medium"
                  aria-label="Start using Flowly for free"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative isolate" aria-labelledby="hero-heading">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 id="hero-heading" className="text-4xl font-bold tracking-tight text-[#0f172a] sm:text-6xl">
                Boost Your Productivity with AI-Powered Planning
              </h1>
              <p className="mt-6 text-lg leading-8 text-[#64748b]">
                Organize tasks, build habits, and achieve your goals with Flowly's clean, intuitive interface and AI-enhanced features. Join thousands of users who've transformed their productivity.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/signup"
                  className="rounded-md bg-[#22c55e] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#16a34a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
                  aria-label="Start using Flowly for free"
                >
                  Start for Free
                </Link>
                <Link href="/pricing" className="text-sm font-semibold leading-6 text-[#0f172a]">
                  View Pricing <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="bg-white py-24 sm:py-32" aria-labelledby="features-heading">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-[#22c55e]">Everything you need</h2>
              <p id="features-heading" className="mt-2 text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
                All-in-one productivity solution
              </p>
              <p className="mt-6 text-lg leading-8 text-[#64748b]">
                Streamline your workflow with our comprehensive suite of productivity tools designed to help you achieve more with less effort.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="text-base font-semibold leading-7 text-[#0f172a]">
                      <h3>{feature.name}</h3>
                    </dt>
                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-[#64748b]">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-gray-50 py-24 sm:py-32" aria-labelledby="benefits-heading">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="benefits-heading" className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
                Why Choose Flowly?
              </h2>
              <p className="mt-6 text-lg leading-8 text-[#64748b]">
                Join thousands of professionals who've transformed their productivity with our AI-powered planning tools.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
                {benefits.map((benefit) => (
                  <article key={benefit.title} className="flex flex-col items-start">
                    <div className="rounded-md bg-[#22c55e]/10 p-2 ring-1 ring-[#22c55e]/20">
                      <benefit.icon className="h-6 w-6 text-[#22c55e]" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold leading-8 text-[#0f172a]">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-base leading-7 text-[#64748b]">
                      {benefit.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[#22c55e] py-16 sm:py-24" aria-labelledby="cta-heading">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="cta-heading" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to boost your productivity?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-green-100">
                Start organizing your tasks, building better habits, and achieving your goals with AI-powered insights today.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/signup"
                  className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#22c55e] shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Get started for free
                </Link>
                <Link href="/pricing" className="text-sm font-semibold leading-6 text-white">
                  Learn more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#0f172a]">Flowly</h2>
            <p className="mt-2 text-sm text-[#64748b]">
              AI-powered productivity planner for modern professionals
            </p>
            <nav className="mt-6 flex justify-center space-x-6" aria-label="Footer navigation">
              <Link href="/pricing" className="text-sm text-[#64748b] hover:text-[#0f172a]">
                Pricing
              </Link>
              <Link href="/login" className="text-sm text-[#64748b] hover:text-[#0f172a]">
                Login
              </Link>
              <Link href="/signup" className="text-sm text-[#64748b] hover:text-[#0f172a]">
                Sign Up
              </Link>
            </nav>
            <p className="mt-8 text-xs text-[#64748b]">
              © 2025 Flowly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating CEO Profile Badge */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white rounded-full shadow-lg border-2 border-[#22c55e] p-3 hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col items-center">
            <Image
              src="/profile.jpg"
              alt="CEO & Founder of Flowly"
              width={50}
              height={50}
              className="rounded-full mb-1"
              priority
            />
            <span className="text-xs font-semibold text-[#22c55e]">CEO</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const features = [
  {
    name: 'Daily Planner',
    description: 'Create, edit, and organize your tasks with priority levels and time blocks. Stay focused on what matters most with intelligent task scheduling.',
  },
  {
    name: 'Habit Tracker',
    description: 'Build lasting habits with daily check-ins, progress tracking, and streak counters. Get insights into your habit patterns and stay motivated.',
  },
  {
    name: 'AI Assistant',
    description: 'Get personalized productivity tips, task suggestions, and weekly summaries powered by advanced AI. Your intelligent productivity companion.',
  },
]

// Import icons (you'll need to install @heroicons/react if not already installed)
import { 
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'

const benefits = [
  {
    title: 'Save 2+ Hours Daily',
    description: 'Our AI-powered planning reduces decision fatigue and helps you focus on high-impact tasks, saving you valuable time every day.',
    icon: ClockIcon,
  },
  {
    title: 'Track Your Progress',
    description: 'Visualize your productivity trends, habit streaks, and goal completion rates with comprehensive analytics and insights.',
    icon: ChartBarIcon,
  },
  {
    title: 'AI-Powered Insights',
    description: 'Get personalized recommendations and productivity tips based on your behavior patterns and goals.',
    icon: SparklesIcon,
  },
  {
    title: 'Achieve More Goals',
    description: 'Break down complex goals into manageable tasks and track your progress with our goal management system.',
    icon: CheckCircleIcon,
  },
]

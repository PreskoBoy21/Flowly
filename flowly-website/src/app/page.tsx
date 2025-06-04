import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-[#0f172a]">Flowly</h1>
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
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="relative isolate">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-[#0f172a] sm:text-6xl">
                Boost Your Productivity with AI-Powered Planning
              </h1>
              <p className="mt-6 text-lg leading-8 text-[#64748b]">
                Organize tasks, build habits, and achieve your goals with Flowly&apos;s clean, intuitive interface and AI-enhanced features.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/signup"
                  className="rounded-md bg-[#22c55e] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#16a34a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
                >
                  Start for Free
                </Link>
                <Link href="/pricing" className="text-sm font-semibold leading-6 text-[#0f172a]">
                  View Pricing <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-[#22c55e]">Everything you need</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
                All-in-one productivity solution
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="text-base font-semibold leading-7 text-[#0f172a]">
                      {feature.name}
                    </dt>
                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-[#64748b]">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

const features = [
  {
    name: 'Daily Planner',
    description: 'Create, edit, and organize your tasks with priority levels and time blocks. Stay focused on what matters most.',
  },
  {
    name: 'Habit Tracker',
    description: 'Build lasting habits with daily check-ins, progress tracking, and streak counters to keep you motivated.',
  },
  {
    name: 'AI Assistant',
    description: 'Get personalized productivity tips, task suggestions, and weekly summaries powered by advanced AI.',
  },
]

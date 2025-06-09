import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Productivity Blog - Tips, Strategies & AI Insights | Flowly",
  description: "Discover productivity tips, habit-building strategies, and AI-powered planning insights. Learn how to maximize your efficiency and achieve your goals with expert advice.",
  keywords: [
    "productivity tips",
    "productivity blog",
    "habit building",
    "time management",
    "AI productivity",
    "goal setting",
    "productivity strategies",
    "planning techniques",
    "work efficiency",
    "personal development"
  ],
  openGraph: {
    title: "Flowly Productivity Blog - Expert Tips & Strategies",
    description: "Master productivity with expert tips, habit-building strategies, and AI insights. Transform your workflow and achieve more.",
    url: "https://www.myflowly.com/blog",
    images: ["/og-blog.jpg"],
  },
  alternates: {
    canonical: "/blog",
  },
}

const featuredPost = {
  id: 1,
  title: 'The Science Behind Habit Formation: How AI Can Help Build Better Routines',
  href: '/blog/habit-formation-ai-guide',
  description:
    'Discover how modern AI technology can accelerate habit formation by providing personalized insights, tracking patterns, and optimizing your daily routines for maximum effectiveness.',
  imageUrl: '/blog-ai-habits.jpg',
  date: '2025-01-15',
  datetime: '2025-01-15',
  category: { title: 'AI & Productivity', href: '/blog/category/ai-productivity' },
  author: {
    name: 'Sarah Chen',
    role: 'Productivity Expert',
    href: '#',
    imageUrl: '/author-sarah.jpg',
  },
  readTime: '8 min read',
}

const posts = [
  {
    id: 2,
    title: '10 Time Management Techniques That Actually Work in 2025',
    href: '/blog/time-management-techniques-2025',
    description:
      'From the Pomodoro Technique to AI-assisted scheduling, explore proven time management strategies that modern professionals use to maximize productivity.',
    imageUrl: '/blog-time-management.jpg',
    date: '2025-01-12',
    datetime: '2025-01-12',
    category: { title: 'Time Management', href: '/blog/category/time-management' },
    author: {
      name: 'Mike Rodriguez',
      role: 'Efficiency Coach',
      href: '#',
      imageUrl: '/author-mike.jpg',
    },
    readTime: '6 min read',
  },
  {
    id: 3,
    title: 'Building a Morning Routine That Sets You Up for Success',
    href: '/blog/morning-routine-success',
    description:
      'Learn how to create a powerful morning routine that energizes your day, boosts focus, and aligns with your productivity goals.',
    imageUrl: '/blog-morning-routine.jpg',
    date: '2025-01-08',
    datetime: '2025-01-08',
    category: { title: 'Habits', href: '/blog/category/habits' },
    author: {
      name: 'Emma Thompson',
      role: 'Wellness Coach',
      href: '#',
      imageUrl: '/author-emma.jpg',
    },
    readTime: '5 min read',
  },
  {
    id: 4,
    title: 'Goal Setting in the Digital Age: SMART Goals Meet AI Insights',
    href: '/blog/smart-goals-ai-insights',
    description:
      'Transform traditional SMART goal setting with AI-powered insights that help you track progress, identify patterns, and achieve objectives faster.',
    imageUrl: '/blog-smart-goals.jpg',
    date: '2025-01-05',
    datetime: '2025-01-05',
    category: { title: 'Goal Setting', href: '/blog/category/goal-setting' },
    author: {
      name: 'David Kim',
      role: 'Performance Coach',
      href: '#',
      imageUrl: '/author-david.jpg',
    },
    readTime: '7 min read',
  },
  {
    id: 5,
    title: 'The Psychology of Procrastination and How to Overcome It',
    href: '/blog/overcome-procrastination-psychology',
    description:
      'Understand the root causes of procrastination and discover evidence-based strategies to overcome this productivity killer once and for all.',
    imageUrl: '/blog-procrastination.jpg',
    date: '2025-01-01',
    datetime: '2025-01-01',
    category: { title: 'Psychology', href: '/blog/category/psychology' },
    author: {
      name: 'Dr. Lisa Wang',
      role: 'Behavioral Psychologist',
      href: '#',
      imageUrl: '/author-lisa.jpg',
    },
    readTime: '9 min read',
  },
]

const categories = [
  { name: 'AI & Productivity', count: 12, href: '/blog/category/ai-productivity' },
  { name: 'Time Management', count: 18, href: '/blog/category/time-management' },
  { name: 'Habits', count: 15, href: '/blog/category/habits' },
  { name: 'Goal Setting', count: 10, href: '/blog/category/goal-setting' },
  { name: 'Psychology', count: 8, href: '/blog/category/psychology' },
]

export default function BlogPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
            Productivity Insights & Expert Tips
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#64748b]">
            Discover evidence-based strategies, AI-powered insights, and expert advice to transform your productivity and achieve your goals faster.
          </p>
        </div>
      </div>

      {/* Featured Post */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-4xl">
          <article className="relative isolate flex flex-col gap-8 lg:flex-row">
            <div className="relative aspect-[16/9] sm:aspect-[2/1] lg:aspect-square lg:w-64 lg:shrink-0">
              <Image
                src={featuredPost.imageUrl}
                alt={featuredPost.title}
                fill
                className="absolute inset-0 h-full w-full rounded-2xl bg-gray-50 object-cover"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
            </div>
            <div>
              <div className="flex items-center gap-x-4 text-xs">
                <time dateTime={featuredPost.datetime} className="text-[#64748b]">
                  {featuredPost.date}
                </time>
                <Link
                  href={featuredPost.category.href}
                  className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-[#64748b] hover:bg-gray-100"
                >
                  {featuredPost.category.title}
                </Link>
                <span className="text-[#64748b]">{featuredPost.readTime}</span>
              </div>
              <div className="group relative max-w-xl">
                <h2 className="mt-3 text-lg font-semibold leading-6 text-[#0f172a] group-hover:text-[#64748b]">
                  <Link href={featuredPost.href}>
                    <span className="absolute inset-0" />
                    {featuredPost.title}
                  </Link>
                </h2>
                <p className="mt-5 text-sm leading-6 text-[#64748b]">{featuredPost.description}</p>
              </div>
              <div className="mt-4 flex border-t border-gray-900/5 pt-4">
                <div className="relative flex items-center gap-x-4">
                  <Image
                    src={featuredPost.author.imageUrl}
                    alt={featuredPost.author.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full bg-gray-50"
                  />
                  <div className="text-sm leading-6">
                    <p className="font-semibold text-[#0f172a]">
                      <Link href={featuredPost.author.href}>
                        <span className="absolute inset-0" />
                        {featuredPost.author.name}
                      </Link>
                    </p>
                    <p className="text-[#64748b]">{featuredPost.author.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="flex flex-col lg:flex-row lg:gap-x-12">
            {/* Main Content */}
            <div className="lg:flex-1">
              <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] mb-8">
                Latest Articles
              </h2>
              <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-2">
                {posts.map((post) => (
                  <article key={post.id} className="flex flex-col items-start">
                    <div className="relative w-full">
                      <Image
                        src={post.imageUrl}
                        alt={post.title}
                        width={600}
                        height={300}
                        className="aspect-[16/9] w-full rounded-2xl bg-gray-100 object-cover sm:aspect-[2/1] lg:aspect-[3/2]"
                      />
                      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                    <div className="max-w-xl">
                      <div className="mt-8 flex items-center gap-x-4 text-xs">
                        <time dateTime={post.datetime} className="text-[#64748b]">
                          {post.date}
                        </time>
                        <Link
                          href={post.category.href}
                          className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-[#64748b] hover:bg-gray-100"
                        >
                          {post.category.title}
                        </Link>
                        <span className="text-[#64748b]">{post.readTime}</span>
                      </div>
                      <div className="group relative">
                        <h3 className="mt-3 text-lg font-semibold leading-6 text-[#0f172a] group-hover:text-[#64748b]">
                          <Link href={post.href}>
                            <span className="absolute inset-0" />
                            {post.title}
                          </Link>
                        </h3>
                        <p className="mt-5 line-clamp-3 text-sm leading-6 text-[#64748b]">
                          {post.description}
                        </p>
                      </div>
                      <div className="relative mt-4 flex items-center gap-x-4">
                        <Image
                          src={post.author.imageUrl}
                          alt={post.author.name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full bg-gray-50"
                        />
                        <div className="text-sm leading-6">
                          <p className="font-semibold text-[#0f172a]">
                            <Link href={post.author.href}>
                              <span className="absolute inset-0" />
                              {post.author.name}
                            </Link>
                          </p>
                          <p className="text-[#64748b]">{post.author.role}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 mt-16 lg:mt-0">
              {/* Categories */}
              <div className="rounded-2xl bg-gray-50 p-6">
                <h3 className="text-lg font-semibold text-[#0f172a] mb-4">
                  Browse by Category
                </h3>
                <ul className="space-y-3">
                  {categories.map((category) => (
                    <li key={category.name}>
                      <Link
                        href={category.href}
                        className="flex items-center justify-between text-sm text-[#64748b] hover:text-[#0f172a]"
                      >
                        <span>{category.name}</span>
                        <span className="text-xs bg-white px-2 py-1 rounded-full">
                          {category.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter Signup */}
              <div className="mt-8 rounded-2xl bg-[#22c55e] p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Stay Updated
                </h3>
                <p className="text-green-100 text-sm mb-4">
                  Get weekly productivity tips and insights delivered to your inbox.
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 rounded-lg text-sm border-0 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-white"
                  />
                  <button className="w-full bg-white text-[#22c55e] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
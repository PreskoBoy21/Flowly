"use client";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

// Define types for better type safety
interface Profile {
  full_name: string | null;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  due_date: string | null;
}

interface Habit {
  id: string;
  name: string;
  frequency: string;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  status: 'in_progress' | 'completed' | 'paused';
}

export default function DashboardPage() {
  const session = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();
        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch tasks (e.g., today's tasks)
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("id, title, completed, priority, due_date")
          .eq("user_id", session.user.id)
          .order("due_date", { ascending: true });
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        // Fetch habits
        const { data: habitsData, error: habitsError } = await supabase
          .from("habits")
          .select("id, name, frequency")
          .eq("user_id", session.user.id);
        if (habitsError) throw habitsError;
        setHabits(habitsData || []);

        // Fetch goals
        const { data: goalsData, error: goalsError } = await supabase
          .from("goals")
          .select("id, title, progress, status")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });
        if (goalsError) throw goalsError;
        setGoals(goalsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session, router]);

  if (!session) return null;
  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  // Calculate stats
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const activeGoals = goals.filter((g) => g.status === "in_progress");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0f172a]">
          Welcome back{profile && profile.full_name ? `, ${profile.full_name}` : ""}!
        </h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Here&apos;s an overview of your productivity today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Tasks Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-[#22c55e]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-[#64748b]">Today&apos;s Tasks</dt>
                  <dd>
                    <div className="text-lg font-medium text-[#0f172a]">{completedTasks}/{totalTasks} completed</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/planner" className="font-medium text-[#22c55e] hover:text-[#16a34a]">
                View all tasks
              </a>
            </div>
          </div>
        </div>

        {/* Habits Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-[#22c55e]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-[#64748b]">Habits</dt>
                  <dd>
                    <div className="text-lg font-medium text-[#0f172a]">{habits.length} tracked</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/habits" className="font-medium text-[#22c55e] hover:text-[#16a34a]">
                View all habits
              </a>
            </div>
          </div>
        </div>

        {/* Goals Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-[#22c55e]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-[#64748b]">Active Goals</dt>
                  <dd>
                    <div className="text-lg font-medium text-[#0f172a]">{activeGoals.length} in progress</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/goals" className="font-medium text-[#22c55e] hover:text-[#16a34a]">
                View all goals
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Top Tasks */}
      <div className="mt-8">
        <h2 className="text-base font-semibold leading-7 text-[#0f172a]">Top Tasks</h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          <ul role="list" className="divide-y divide-gray-200">
            {tasks.slice(0, 5).map((task) => (
              <li key={task.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    readOnly
                    className="h-4 w-4 rounded border-gray-300 text-[#22c55e] focus:ring-[#22c55e]"
                  />
                  <p className="ml-3 text-sm font-medium text-[#0f172a]">{task.title}</p>
                </div>
                <div className="ml-2 flex flex-shrink-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      task.priority === "high"
                        ? "bg-red-50 text-red-700"
                        : task.priority === "medium"
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI Tip */}
      <div className="mt-8">
        <h2 className="text-base font-semibold leading-7 text-[#0f172a]">AI Productivity Tip</h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-[#bbf7d0] shadow">
          <div className="px-6 py-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-[#16a34a]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
              <p className="ml-2 text-sm text-[#16a34a]">
                Try breaking down your larger tasks into smaller, more manageable chunks. This can help
                reduce overwhelm and increase your sense of progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
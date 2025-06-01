'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '../../lib/supabase';
import { format, startOfWeek, addDays, isSameDay, parseISO, subDays, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  streak?: number;
}

interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  notes?: string;
}

interface HabitStats {
  totalHabits: number;
  completedToday: number;
  bestStreak: number;
  completionRate: number;
  weeklyProgress: { [key: string]: number };
}

export default function HabitsPage() {
  const session = useSession();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly'>('daily');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [newHabitTargetDays, setNewHabitTargetDays] = useState(7);
  const [newHabitColor, setNewHabitColor] = useState('#22c55e');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly'>('all');
  const [sortBy, setSortBy] = useState<'streak' | 'name' | 'created'>('streak');
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [isProUser, setIsProUser] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get the current week's dates
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Check if user is pro - only run once after session is available
  useEffect(() => {
    if (!session?.user?.id || isInitialized) return;
    
    const checkProStatus = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setIsProUser(profile?.role === 'pro_user');
      } catch (err) {
        console.error('Error checking pro status:', err);
      }
    };
    
    checkProStatus();
  }, [session?.user?.id, isInitialized]);

  // Fetch habits and their logs - only run once after session is available
  useEffect(() => {
    if (!session?.user?.id || isInitialized) return;

    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch habits and logs in parallel
        const [habitsResponse, logsResponse] = await Promise.all([
          supabase
            .from('habits')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('habit_logs')
            .select('id, habit_id, user_id, completed_at, notes')
            .eq('user_id', session.user.id)
            .gte('completed_at', weekStart.toISOString())
            .lt('completed_at', addDays(weekStart, 7).toISOString())
        ]);

        if (habitsResponse.error) throw habitsResponse.error;
        if (logsResponse.error) throw logsResponse.error;

        const habitsData = habitsResponse.data || [];
        const logsData = logsResponse.data as HabitLog[] || [];

        // Calculate streaks and stats in a single pass
        const habitsWithStreaks = habitsData.map(habit => {
          const habitLogs = logsData.filter(log => log.habit_id === habit.id);
          const streak = calculateStreak(habit.id, new Date(), habitLogs);
          return { ...habit, streak };
        });

        // Batch state updates
        const stats = calculateStats(habitsWithStreaks, logsData);
        
        setHabits(habitsWithStreaks);
        setHabitLogs(logsData);
        setStats(stats);
        setIsInitialized(true);
      } catch (err: any) {
        console.error('Error initializing habits:', err);
        setError(err.message || 'Failed to load habits');
        toast.error('Failed to load habits');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [session?.user?.id, isInitialized]);

  // Calculate habit statistics
  const calculateStats = (habits: Habit[], logs: HabitLog[]): HabitStats => {
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(addDays(weekStart, 7), 'yyyy-MM-dd');

    const weeklyProgress: { [key: string]: number } = {};
    weekDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayLogs = logs.filter(log => format(new Date(log.completed_at), 'yyyy-MM-dd') === dateStr);
      weeklyProgress[dateStr] = (dayLogs.length / habits.length) * 100;
    });

    const completedToday = logs.filter(
      log => format(new Date(log.completed_at), 'yyyy-MM-dd') === todayStr
    ).length;

    const bestStreak = Math.max(...habits.map(habit => habit.streak || 0), 0);
    const totalLogs = logs.length;
    const completionRate = totalLogs > 0 ? (totalLogs / (habits.length * 7)) * 100 : 0;

    return {
      totalHabits: habits.length,
      completedToday,
      bestStreak,
      completionRate,
      weeklyProgress,
    };
  };

  // Add a new habit
  const handleAddHabit = async () => {
    if (!session || !newHabitName) return;
    
    // Check free user limit
    if (!isProUser && habits.length >= 3) {
      toast.error('Free users can only track up to 3 habits. Upgrade to Pro for unlimited habits!');
      setShowAddModal(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([
          {
            user_id: session.user.id,
            name: newHabitName,
            frequency: newHabitFrequency,
            description: newHabitDescription || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newHabit: Habit = {
        ...data,
        streak: 0,
        description: data.description || null,
      };
      setHabits((prev) => [...prev, newHabit]);
      setShowAddModal(false);
      resetForm();
      toast.success('Habit added successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to add habit');
      toast.error('Failed to add habit');
    } finally {
      setLoading(false);
    }
  };

  // Edit habit
  const handleEditHabit = async () => {
    if (!session || !selectedHabit) return;
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('habits')
        .update({
          name: newHabitName,
          frequency: newHabitFrequency,
          description: newHabitDescription || null,
        })
        .eq('id', selectedHabit.id);

      if (error) throw error;

      setHabits((prev) =>
        prev.map((h) =>
          h.id === selectedHabit.id
            ? {
                ...h,
                name: newHabitName,
                frequency: newHabitFrequency,
                description: newHabitDescription || null,
              }
            : h
        )
      );

      setShowEditModal(false);
      resetForm();
      toast.success('Habit updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update habit');
      toast.error('Failed to update habit');
    } finally {
      setLoading(false);
    }
  };

  // Delete habit
  const handleDeleteHabit = async () => {
    if (!session || !selectedHabit) return;
    setLoading(true);
    setError(null);

    try {
      // Delete associated habit logs first
      const { error: logsError } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', selectedHabit.id);

      if (logsError) throw logsError;

      // Delete the habit
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', selectedHabit.id);

      if (error) throw error;

      setHabits((prev) => prev.filter((h) => h.id !== selectedHabit.id));
      setShowDeleteModal(false);
      toast.success('Habit deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete habit');
      toast.error('Failed to delete habit');
    } finally {
      setLoading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setNewHabitName('');
    setNewHabitFrequency('daily');
    setNewHabitDescription('');
    setSelectedHabit(null);
  };

  // Prepare edit form
  const prepareEditForm = (habit: Habit) => {
    setSelectedHabit(habit);
    setNewHabitName(habit.name);
    setNewHabitFrequency(habit.frequency);
    setNewHabitDescription(habit.description || '');
    setShowEditModal(true);
  };

  // Filter and sort habits
  const filteredAndSortedHabits = habits
    .filter((habit) => filter === 'all' || habit.frequency === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'streak':
          return (b.streak || 0) - (a.streak || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  // Handle habit check-in updates
  const handleToggleCheck = async (habitId: string, date: Date) => {
    if (!session?.user?.id || loading) return;
    
    try {
      setLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      const existingLog = habitLogs.find(
        (log) => log.habit_id === habitId && format(new Date(log.completed_at), 'yyyy-MM-dd') === dateStr
      );

      let updatedLogs: HabitLog[];
      if (existingLog) {
        // Delete existing log
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existingLog.id);

        if (error) throw error;

        updatedLogs = habitLogs.filter((log) => log.id !== existingLog.id);
        setHabitLogs(updatedLogs);
      } else {
        // Create new log
        const { data, error } = await supabase
          .from('habit_logs')
          .insert([
            {
              user_id: session.user.id,
              habit_id: habitId,
              completed_at: date.toISOString(),
            },
          ])
          .select('id, habit_id, user_id, completed_at, notes')
          .single();

        if (error) throw error;
        updatedLogs = [...habitLogs, data as HabitLog];
        setHabitLogs(updatedLogs);
      }

      // Update streak locally
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        const habitSpecificLogs = updatedLogs.filter((log: HabitLog) => log.habit_id === habitId);
        const newStreak = calculateStreak(habitId, date, habitSpecificLogs);
        setHabits((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, streak: newStreak } : h))
        );
      }

      // Update stats
      if (stats) {
        const newStats = calculateStats(habits, updatedLogs);
        setStats(newStats);
      }

      toast.success('Habit check updated');
    } catch (err: any) {
      console.error('Error updating habit check:', err);
      setError(err.message || 'Failed to update habit check');
      toast.error('Failed to update habit check');
    } finally {
      setLoading(false);
    }
  };

  // Calculate streak for a habit
  const calculateStreak = (habitId: string, currentDate: Date, logs: HabitLog[]) => {
    let streak = 0;
    let date = currentDate;

    while (true) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const log = logs.find(
        (l) => l.habit_id === habitId && format(new Date(l.completed_at), 'yyyy-MM-dd') === dateStr
      );

      if (!log) break;
      streak++;
      date = addDays(date, -1);
    }

    return streak;
  };

  // Get check status for a habit on a specific date
  const getCheckStatus = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const log = habitLogs.find(
      (l) => l.habit_id === habitId && format(new Date(l.completed_at), 'yyyy-MM-dd') === dateStr
    );
    return !!log;
  };

  // Show loading state only during initial load
  if (!session) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="text-center text-gray-500">Please log in to view your habits.</div>
      </div>
    );
  }

  if (!isInitialized && loading) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-8">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0f172a]">Habits</h1>
            <p className="mt-1 text-sm text-[#64748b]">Track your daily and weekly habits</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowStatsModal(true)}
              className="px-4 py-2 text-sm font-medium text-[#0f172a] bg-white border border-gray-200 rounded-md hover:bg-gray-50"
            >
              View Stats
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#22c55e] text-white px-4 py-2 rounded-md hover:bg-[#16a34a] flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Habit
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-[#64748b]">Total Habits</div>
              <div className="text-2xl font-semibold text-[#0f172a]">{stats.totalHabits}</div>
              {!isProUser && (
                <div className="text-xs text-[#64748b] mt-1">
                  {3 - stats.totalHabits} slots remaining
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-[#64748b]">Completed Today</div>
              <div className="text-2xl font-semibold text-[#0f172a]">{stats.completedToday}</div>
              <div className="text-xs text-[#64748b] mt-1">
                of {stats.totalHabits} habits
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-[#64748b]">Best Streak</div>
              <div className="text-2xl font-semibold text-[#0f172a]">{stats.bestStreak}</div>
              <div className="text-xs text-[#64748b] mt-1">days</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-[#64748b]">Completion Rate</div>
              <div className="text-2xl font-semibold text-[#0f172a]">
                {Math.round(stats.completionRate)}%
              </div>
              <div className="text-xs text-[#64748b] mt-1">this week</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'all'
                ? 'bg-[#22c55e] text-white'
                : 'bg-gray-100 text-[#64748b] hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('daily')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'daily'
                ? 'bg-[#22c55e] text-white'
                : 'bg-gray-100 text-[#64748b] hover:bg-gray-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setFilter('weekly')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'weekly'
                ? 'bg-[#22c55e] text-white'
                : 'bg-gray-100 text-[#64748b] hover:bg-gray-200'
            }`}
          >
            Weekly
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#64748b]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'streak' | 'name' | 'created')}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
          >
            <option value="streak">Streak</option>
            <option value="name">Name</option>
            <option value="created">Created</option>
          </select>
        </div>
      </div>

      {/* Habits Grid */}
      {filteredAndSortedHabits.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="max-w-sm mx-auto">
            <svg
              className="mx-auto h-12 w-12 text-[#64748b]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-[#0f172a]">No habits found</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              {filter !== 'all'
                ? `No ${filter} habits found. Try changing the filter.`
                : 'Get started by adding your first habit!'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#22c55e] hover:bg-[#16a34a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#22c55e]"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Habit
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">
                    Habit
                  </th>
                  {weekDates.map((date) => (
                    <th
                      key={date.toISOString()}
                      className="px-6 py-3 text-center text-xs font-medium text-[#64748b] uppercase tracking-wider"
                    >
                      <div>{format(date, 'EEE')}</div>
                      <div className="text-xs text-[#64748b]">{format(date, 'd MMM')}</div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#64748b] uppercase tracking-wider">
                    Streak
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#64748b] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedHabits.map((habit) => (
                  <tr key={habit.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-3 bg-[#22c55e]" />
                        <div>
                          <div className="text-sm font-medium text-[#0f172a]">{habit.name}</div>
                          <div className="text-xs text-[#64748b]">
                            {habit.frequency}
                          </div>
                        </div>
                      </div>
                    </td>
                    {weekDates.map((date) => (
                      <td key={date.toISOString()} className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleCheck(habit.id, date)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            getCheckStatus(habit.id, date)
                              ? 'bg-[#22c55e] text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {getCheckStatus(habit.id, date) ? (
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          )}
                        </button>
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#bbf7d0] text-[#16a34a]">
                        {habit.streak} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => prepareEditForm(habit)}
                        className="text-[#64748b] hover:text-[#0f172a] mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedHabit(habit);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Habit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4 text-[#0f172a]">
              {showAddModal ? 'Add New Habit' : 'Edit Habit'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Habit Name</label>
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-md px-3 py-2 text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors"
                  placeholder="e.g., Morning Meditation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Description (Optional)</label>
                <textarea
                  value={newHabitDescription}
                  onChange={(e) => setNewHabitDescription(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-md px-3 py-2 text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors"
                  placeholder="Add a description for your habit..."
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Frequency</label>
                <select
                  value={newHabitFrequency}
                  onChange={(e) => setNewHabitFrequency(e.target.value as 'daily' | 'weekly')}
                  className="w-full border-2 border-gray-200 rounded-md px-3 py-2 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={showAddModal ? handleAddHabit : handleEditHabit}
                  disabled={!newHabitName}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#22c55e] rounded-md hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {showAddModal ? 'Add Habit' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4 text-[#0f172a]">Delete Habit</h2>
            <p className="text-[#64748b] mb-6">
              Are you sure you want to delete "{selectedHabit.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedHabit(null);
                }}
                className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#0f172a]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteHabit}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#0f172a]">Habit Statistics</h2>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-[#64748b] hover:text-[#0f172a]"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Weekly Progress Chart */}
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-[#64748b] mb-4">Weekly Progress</h3>
                <div className="h-32 flex items-end gap-2">
                  {weekDates.map((date) => {
                    const progress = stats.weeklyProgress[format(date, 'yyyy-MM-dd')] || 0;
                    return (
                      <div key={date.toISOString()} className="flex-1">
                        <div
                          className="bg-[#22c55e] rounded-t"
                          style={{ height: `${progress}%` }}
                        />
                        <div className="text-xs text-center mt-2 text-[#64748b]">
                          {format(date, 'EEE')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Habit Completion Stats */}
              <div>
                <h3 className="text-sm font-medium text-[#64748b] mb-4">Completion Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-[#64748b]">Today's Progress</div>
                    <div className="mt-1 flex items-center">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#22c55e]"
                          style={{
                            width: `${(stats.completedToday / stats.totalHabits) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="ml-2 text-sm font-medium text-[#0f172a]">
                        {stats.completedToday}/{stats.totalHabits}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#64748b]">Weekly Average</div>
                    <div className="mt-1 text-2xl font-semibold text-[#0f172a]">
                      {Math.round(stats.completionRate)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Streak Stats */}
              <div>
                <h3 className="text-sm font-medium text-[#64748b] mb-4">Streak Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-[#64748b]">Best Streak</div>
                    <div className="mt-1 text-2xl font-semibold text-[#0f172a]">
                      {stats.bestStreak} days
                    </div>
                  </div>
                  {!isProUser && (
                    <div className="mt-4 p-4 bg-[#bbf7d0] rounded-lg">
                      <h4 className="text-sm font-medium text-[#16a34a]">Upgrade to Pro</h4>
                      <p className="mt-1 text-sm text-[#16a34a]">
                        Get detailed analytics, unlimited habits, and more with Flowly Pro!
                      </p>
                      <Link
                        href="/pricing"
                        className="mt-2 inline-block text-sm font-medium text-[#16a34a] hover:text-[#15803d]"
                      >
                        View Pricing →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
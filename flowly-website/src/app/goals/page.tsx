'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '../../lib/supabase';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import toast from 'react-hot-toast';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress: number;
  status: 'in_progress' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface GoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  averageProgress: number;
  upcomingMilestones: GoalMilestone[];
}

export default function GoalsPage() {
  const session = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDescription, setNewMilestoneDescription] = useState('');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'progress' | 'title' | 'target_date'>('progress');
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [isProUser, setIsProUser] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Fetch goals and their milestones - only run once after session is available
  useEffect(() => {
    if (!session?.user?.id || isInitialized) return;

    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch goals and milestones in parallel
        const [goalsResponse, milestonesResponse] = await Promise.all([
          supabase
            .from('goals')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('goal_milestones')
            .select('*, goals!inner(*)')
            .eq('goals.user_id', session.user.id)
            .order('due_date', { ascending: true })
        ]);

        if (goalsResponse.error) throw goalsResponse.error;
        if (milestonesResponse.error) throw milestonesResponse.error;

        const goalsData = goalsResponse.data || [];
        const milestonesData = milestonesResponse.data?.map(m => ({
          id: m.id,
          goal_id: m.goal_id,
          title: m.title,
          description: m.description,
          completed: m.completed,
          due_date: m.due_date,
          created_at: m.created_at,
          updated_at: m.updated_at
        })) || [];

        // Calculate stats
        const stats = calculateStats(goalsData, milestonesData);
        
        setGoals(goalsData);
        setMilestones(milestonesData);
        setStats(stats);
        setIsInitialized(true);
      } catch (err: unknown) {
        console.error('Error initializing goals:', err);
        setError(err instanceof Error ? err.message : 'Failed to load goals');
        toast.error('Failed to load goals');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [session?.user?.id, isInitialized]);

  // Calculate goal statistics
  const calculateStats = (goals: Goal[], milestones: GoalMilestone[]): GoalStats => {
    const activeGoals = goals.filter(g => g.status === 'in_progress');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const averageProgress = goals.length > 0
      ? goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length
      : 0;

    // Get upcoming milestones (not completed, due within next 7 days)
    const today = new Date();
    const nextWeek = addDays(today, 7);
    const upcomingMilestones = milestones
      .filter(m => !m.completed && m.due_date && isAfter(parseISO(m.due_date), today) && isBefore(parseISO(m.due_date), nextWeek))
      .sort((a, b) => {
        if (!a.due_date || !b.due_date) return 0;
        return parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime();
      })
      .slice(0, 5); // Show only next 5 upcoming milestones

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      averageProgress,
      upcomingMilestones,
    };
  };

  // Add a new goal
  const handleAddGoal = async () => {
    if (!session || !newGoalTitle) return;
    
    // Check free user limit
    if (!isProUser && goals.length >= 1) {
      toast.error('Free users can only track up to 1 goal. Upgrade to Pro for unlimited goals!');
      setShowAddModal(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([
          {
            user_id: session.user.id,
            title: newGoalTitle,
            description: newGoalDescription || null,
            target_date: newGoalTargetDate || null,
            progress: 0,
            status: 'in_progress',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setGoals((prev) => [...prev, data]);
      setShowAddModal(false);
      resetForm();
      toast.success('Goal added successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add goal');
      toast.error('Failed to add goal');
    } finally {
      setLoading(false);
    }
  };

  // Edit goal
  const handleEditGoal = async () => {
    if (!session || !selectedGoal) return;
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('goals')
        .update({
          title: newGoalTitle,
          description: newGoalDescription || null,
          target_date: newGoalTargetDate || null,
        })
        .eq('id', selectedGoal.id);

      if (error) throw error;

      setGoals((prev) =>
        prev.map((g) =>
          g.id === selectedGoal.id
            ? {
                ...g,
                title: newGoalTitle,
                description: newGoalDescription || null,
                target_date: newGoalTargetDate || null,
              }
            : g
        )
      );

      setShowEditModal(false);
      resetForm();
      toast.success('Goal updated successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update goal');
      toast.error('Failed to update goal');
    } finally {
      setLoading(false);
    }
  };

  // Delete goal
  const handleDeleteGoal = async () => {
    if (!session || !selectedGoal) return;
    setLoading(true);
    setError(null);

    try {
      // Delete associated milestones first
      const { error: milestonesError } = await supabase
        .from('goal_milestones')
        .delete()
        .eq('goal_id', selectedGoal.id);

      if (milestonesError) throw milestonesError;

      // Delete the goal
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', selectedGoal.id);

      if (error) throw error;

      setGoals((prev) => prev.filter((g) => g.id !== selectedGoal.id));
      setMilestones((prev) => prev.filter((m) => m.goal_id !== selectedGoal.id));
      setShowDeleteModal(false);
      toast.success('Goal deleted successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
      toast.error('Failed to delete goal');
    } finally {
      setLoading(false);
    }
  };

  // Add milestone
  const handleAddMilestone = async () => {
    if (!session || !selectedGoal || !newMilestoneTitle) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('goal_milestones')
        .insert([
          {
            goal_id: selectedGoal.id,
            title: newMilestoneTitle,
            description: newMilestoneDescription || null,
            due_date: newMilestoneDueDate || null,
            completed: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setMilestones((prev) => [...prev, data]);
      setShowMilestoneModal(false);
      resetMilestoneForm();
      toast.success('Milestone added successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add milestone');
      toast.error('Failed to add milestone');
    } finally {
      setLoading(false);
    }
  };

  // Toggle milestone completion
  const handleToggleMilestone = async (milestone: GoalMilestone) => {
    if (!session) return;
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('goal_milestones')
        .update({ completed: !milestone.completed })
        .eq('id', milestone.id);

      if (error) throw error;

      // Update milestones
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestone.id ? { ...m, completed: !m.completed } : m
        )
      );

      // Update goal progress
      const goalMilestones = milestones.filter((m) => m.goal_id === milestone.goal_id);
      const completedMilestones = goalMilestones.filter((m) => m.completed || m.id === milestone.id).length;
      const newProgress = Math.round((completedMilestones / (goalMilestones.length + 1)) * 100);

      const { error: goalError } = await supabase
        .from('goals')
        .update({ progress: newProgress })
        .eq('id', milestone.goal_id);

      if (goalError) throw goalError;

      setGoals((prev) =>
        prev.map((g) =>
          g.id === milestone.goal_id ? { ...g, progress: newProgress } : g
        )
      );

      toast.success('Milestone updated successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update milestone');
      toast.error('Failed to update milestone');
    } finally {
      setLoading(false);
    }
  };

  // Update goal status
  const handleUpdateStatus = async (goal: Goal, newStatus: Goal['status']) => {
    if (!session) return;
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('goals')
        .update({ status: newStatus })
        .eq('id', goal.id);

      if (error) throw error;

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goal.id ? { ...g, status: newStatus } : g
        )
      );

      toast.success('Goal status updated successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update goal status');
      toast.error('Failed to update goal status');
    } finally {
      setLoading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setNewGoalTitle('');
    setNewGoalDescription('');
    setNewGoalTargetDate('');
    setSelectedGoal(null);
  };

  // Reset milestone form state
  const resetMilestoneForm = () => {
    setNewMilestoneTitle('');
    setNewMilestoneDescription('');
    setNewMilestoneDueDate('');
  };

  // Prepare edit form
  const prepareEditForm = (goal: Goal) => {
    setSelectedGoal(goal);
    setNewGoalTitle(goal.title);
    setNewGoalDescription(goal.description || '');
    setNewGoalTargetDate(goal.target_date || '');
    setShowEditModal(true);
  };

  // Filter and sort goals
  const filteredAndSortedGoals = goals
    .filter((goal) => filter === 'all' || goal.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.progress - a.progress;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'target_date':
          if (!a.target_date && !b.target_date) return 0;
          if (!a.target_date) return 1;
          if (!b.target_date) return -1;
          return parseISO(a.target_date).getTime() - parseISO(b.target_date).getTime();
        default:
          return 0;
      }
    });

  // Show loading state only during initial load
  if (!session) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="text-center text-gray-500">Please log in to view your goals.</div>
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
            <h1 className="text-3xl font-bold text-[#0f172a]">Goals</h1>
            <p className="mt-1 text-sm text-[#64748b]">Track your long-term goals and milestones</p>
          </div>
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
            Add Goal
          </button>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-[#64748b]">Total Goals</div>
              <div className="text-2xl font-semibold text-[#0f172a]">{stats.totalGoals}</div>
              {!isProUser && (
                <div className="text-xs text-[#64748b] mt-1">
                  {1 - stats.totalGoals} slots remaining
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-[#64748b]">Active Goals</div>
              <div className="text-2xl font-semibold text-[#0f172a]">{stats.activeGoals}</div>
              <div className="text-xs text-[#64748b] mt-1">
                in progress
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-[#64748b]">Completed Goals</div>
              <div className="text-2xl font-semibold text-[#0f172a]">{stats.completedGoals}</div>
              <div className="text-xs text-[#64748b] mt-1">
                achieved
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-[#64748b]">Average Progress</div>
              <div className="text-2xl font-semibold text-[#0f172a]">
                {Math.round(stats.averageProgress)}%
              </div>
              <div className="text-xs text-[#64748b] mt-1">
                across all goals
              </div>
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
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'in_progress'
                ? 'bg-[#22c55e] text-white'
                : 'bg-gray-100 text-[#64748b] hover:bg-gray-200'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'completed'
                ? 'bg-[#22c55e] text-white'
                : 'bg-gray-100 text-[#64748b] hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'archived'
                ? 'bg-[#22c55e] text-white'
                : 'bg-gray-100 text-[#64748b] hover:bg-gray-200'
            }`}
          >
            Archived
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#64748b]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'progress' | 'title' | 'target_date')}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
          >
            <option value="progress">Progress</option>
            <option value="title">Title</option>
            <option value="target_date">Target Date</option>
          </select>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredAndSortedGoals.length === 0 ? (
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
                d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-[#0f172a]">No goals found</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              {filter !== 'all'
                ? `No ${filter} goals found. Try changing the filter.`
                : 'Get started by adding your first goal!'}
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
                Add Goal
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredAndSortedGoals.map((goal) => (
            <div key={goal.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-[#0f172a]">{goal.title}</h3>
                    {goal.description && (
                      <p className="mt-1 text-sm text-[#64748b]">{goal.description}</p>
                    )}
                    {goal.target_date && (
                      <p className="mt-1 text-sm text-[#64748b]">
                        Target date: {format(parseISO(goal.target_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={goal.status}
                      onChange={(e) => handleUpdateStatus(goal, e.target.value as Goal['status'])}
                      className="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                    >
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button
                      onClick={() => prepareEditForm(goal)}
                      className="text-[#64748b] hover:text-[#0f172a]"
                    >
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoal(goal);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#0f172a]">Progress</span>
                    <span className="text-sm font-medium text-[#0f172a]">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#22c55e] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-[#0f172a]">Milestones</h4>
                    <button
                      onClick={() => {
                        setSelectedGoal(goal);
                        setShowMilestoneModal(true);
                      }}
                      className="text-sm text-[#22c55e] hover:text-[#16a34a] flex items-center gap-1"
                    >
                      <svg
                        className="h-4 w-4"
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
                      Add Milestone
                    </button>
                  </div>
                  <div className="space-y-3">
                    {milestones
                      .filter((m) => m.goal_id === goal.id)
                      .map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleMilestone(milestone)}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                milestone.completed
                                  ? 'bg-[#22c55e] border-[#22c55e] text-white'
                                  : 'border-gray-300 text-transparent'
                              }`}
                            >
                              {milestone.completed && (
                                <svg
                                  className="h-3 w-3"
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
                              )}
                            </button>
                            <div>
                              <p
                                className={`text-sm font-medium ${
                                  milestone.completed
                                    ? 'text-[#64748b] line-through'
                                    : 'text-[#0f172a]'
                                }`}
                              >
                                {milestone.title}
                              </p>
                              {milestone.due_date && (
                                <p className="text-xs text-[#64748b]">
                                  Due: {format(parseISO(milestone.due_date), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-[#64748b]">{milestone.description}</p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4 text-[#0f172a]">
              {showAddModal ? 'Add New Goal' : 'Edit Goal'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Goal Title</label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-md px-3 py-2 text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors"
                  placeholder="e.g., Learn Spanish"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Description (Optional)</label>
                <textarea
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-md px-3 py-2 text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors"
                  placeholder="Add a description for your goal..."
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Target Date (Optional)</label>
                <input
                  type="date"
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-md px-3 py-2 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors"
                />
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
                  onClick={showAddModal ? handleAddGoal : handleEditGoal}
                  disabled={!newGoalTitle}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#22c55e] rounded-md hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {showAddModal ? 'Add Goal' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showMilestoneModal && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4 text-[#0f172a]">Add Milestone</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Milestone Title</label>
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-md px-3 py-2 text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors"
                  placeholder="e.g., Complete basic vocabulary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Description (Optional)</label>
                <textarea
                  value={newMilestoneDescription}
                  onChange={(e) => setNewMilestoneDescription(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-md px-3 py-2 text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors"
                  placeholder="Add a description for your milestone..."
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  value={newMilestoneDueDate}
                  onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-md px-3 py-2 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowMilestoneModal(false);
                    resetMilestoneForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMilestone}
                  disabled={!newMilestoneTitle}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#22c55e] rounded-md hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Milestone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4 text-[#0f172a]">Delete Goal</h2>
            <p className="text-[#64748b] mb-6">
              Are you sure you want to delete &quot;{selectedGoal.title}&quot;? This action cannot be undone and will also delete all associated milestones.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedGoal(null);
                }}
                className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGoal}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
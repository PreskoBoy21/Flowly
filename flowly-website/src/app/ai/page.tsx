'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UserData {
  tasks: Array<{
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high';
    due_date: string | null;
    completed: boolean;
  }>;
  habits: Array<{
    name: string;
    description: string | null;
    frequency: string;
  }>;
  goals: Array<{
    title: string;
    description: string | null;
    target_date: string | null;
    progress: number;
    status: string;
    milestones: Array<{
      title: string;
      description: string | null;
      completed: boolean;
      due_date: string | null;
    }>;
  }>;
}

async function fetchAIResponse(prompt: string): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get AI response');
  return data.response;
}

export default function AIAssistantPage() {
  const session = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all user data
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

      // Fetch habits
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId);

      // Fetch goals with their milestones
      const { data: goals } = await supabase
        .from('goals')
        .select(`
          *,
          goal_milestones (*)
        `)
        .eq('user_id', userId);

      setUserData({
        tasks: tasks || [],
        habits: habits || [],
        goals: goals || [],
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load your data');
    }
  };

  // Check if user is pro and fetch data
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const initializeUser = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.role !== 'pro_user') {
          router.push('/pricing');
          return;
        }
        setIsProUser(true);
        await fetchUserData(session.user.id);
      } catch (err) {
        console.error('Error initializing user:', err);
        toast.error('Failed to verify subscription status');
      }
    };
    
    initializeUser();
  }, [session?.user?.id, router]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateContextPrompt = (userData: UserData): string => {
    const tasks = userData.tasks || [];
    const habits = userData.habits || [];
    const goals = userData.goals || [];

    return `You are a productivity AI assistant helping a user with their personal development. Here's their current data:

Tasks (${tasks.length}):
${tasks.map(task => `- ${task.title} (${task.priority} priority${task.due_date ? `, due ${new Date(task.due_date).toLocaleDateString()}` : ''})${task.completed ? ' [Completed]' : ''}`).join('\n')}

Habits (${habits.length}):
${habits.map(habit => `- ${habit.name} (${habit.frequency})`).join('\n')}

Goals (${goals.length}):
${goals.map(goal => `- ${goal.title} (${goal.progress}% complete, ${goal.status})\n  Milestones:\n  ${(goal.milestones || []).map(m => `  * ${m.title}${m.completed ? ' [Completed]' : ''}`).join('\n  ')}`).join('\n')}

Based on this data, provide personalized, actionable advice and suggestions. Consider:
1. Task prioritization and time management
2. Habit formation and consistency
3. Goal progress and milestone achievement
4. Work-life balance
5. Productivity patterns and potential improvements

User's question: `;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !userData) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const contextPrompt = generateContextPrompt(userData);
      const fullPrompt = contextPrompt + userMessage;
      const response = await fetchAIResponse(fullPrompt);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="text-center text-gray-500">Please log in to use the AI Assistant.</div>
      </div>
    );
  }

  if (!isProUser) {
    return null; // Router will handle redirect to pricing
  }

  return (
    <div className="flex flex-col items-center min-h-[80vh] w-full bg-gray-50 py-8 px-2 sm:px-4">
      <div className="w-full max-w-2xl flex flex-col flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 relative">
        {/* Header */}
        <div className="px-6 pt-6 pb-2 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-[#0f172a]">AI Assistant</h1>
          <p className="mt-1 text-sm text-[#64748b]">
            Get personalized productivity tips, goal suggestions, and task recommendations.
          </p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-4" style={{ minHeight: '400px', maxHeight: '60vh' }}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-[#64748b]">
                <svg
                  className="mx-auto h-10 w-10 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
                <p className="text-lg font-medium">How can I help you today?</p>
                <p className="mt-2 text-sm">
                  Try asking about:
                </p>
                <ul className="mt-2 text-sm space-y-1">
                  <li>• Breaking down a goal into milestones</li>
                  <li>• Creating a habit formation plan</li>
                  <li>• Prioritizing your tasks</li>
                  <li>• Getting productivity tips</li>
                </ul>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex w-full ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm text-base sm:text-sm transition-all break-words ${
                    message.role === 'user'
                      ? 'bg-[#22c55e] text-white rounded-br-md ml-auto'
                      : 'bg-[#f1f5f9] text-[#0f172a] rounded-bl-md mr-auto'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#bbf7d0] text-[#0f172a] rounded-2xl px-4 py-2 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-[#16a34a] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#16a34a] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-[#16a34a] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form - fixed at the bottom of the chat card */}
        <form
          onSubmit={handleSubmit}
          className="w-full border-t border-gray-100 bg-[#f9fafb] px-2 sm:px-4 py-3 flex items-center gap-2 sticky bottom-0 z-10"
          style={{ minHeight: '64px' }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about productivity..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors text-base sm:text-sm bg-white shadow-sm"
            disabled={isLoading}
            style={{ minHeight: '40px', maxHeight: '40px' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-[#22c55e] text-white px-4 py-2 rounded-lg hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base sm:text-sm font-semibold shadow-md"
            style={{ minHeight: '40px' }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
} 
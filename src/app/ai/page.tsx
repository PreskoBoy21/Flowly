'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UserData {
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    due_date?: string;
    completed: boolean;
  }>;
  habits: Array<{
    id: string;
    name: string;
    frequency: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    progress: number;
    status: string;
    milestones?: Array<{
      id: string;
      title: string;
      completed: boolean;
      due_date?: string;
      description?: string;
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
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-[#64748b]">
                {/* ... existing empty state content ... */}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex w-full mb-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-1.5 rounded-lg shadow-sm text-sm transition-all break-words ${
                      message.role === 'user'
                        ? 'bg-[#22c55e] text-white rounded-br-none ml-2'
                        : 'bg-[#f1f5f9] text-[#0f172a] rounded-bl-none mr-2'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start mb-2">
                  <div className="bg-[#f1f5f9] text-[#0f172a] rounded-lg px-3 py-1.5 shadow-sm">
                    <div className="flex space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-[#64748b] rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-[#64748b] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-[#64748b] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full border-t border-gray-100 bg-[#f9fafb] px-2 sm:px-4 py-3 flex items-center gap-2 sticky bottom-0 z-10"
          style={{ minHeight: '64px' }}
        >
          {/* ... existing input form content ... */}
        </form>
      </div>
    </div>
  );
} 
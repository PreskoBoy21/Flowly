'use client';
import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, differenceInMinutes } from 'date-fns';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '../../lib/supabase';

const COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e42', // orange
  '#a855f7', // purple
  '#ef4444', // red
  '#eab308', // yellow
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Task {
  id: string;
  title: string;
  startDate: string; // ISO date string
  startTime: string; // 'HH:mm'
  endDate: string;   // ISO date string
  endTime: string;   // 'HH:mm'
  color: string;
}

export default function PlannerPage() {
  const session = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskStartTime, setNewTaskStartTime] = useState('');
  const [newTaskEndDate, setNewTaskEndDate] = useState('');
  const [newTaskEndTime, setNewTaskEndTime] = useState('');
  const [newTaskColor, setNewTaskColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the start of the current week (Monday)
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDates = WEEKDAYS.map((_, i) => addDays(weekStart, i));

  // Group tasks by day (show if startDate is that day)
  const tasksByDay = weekDates.map(date =>
    tasks.filter(task => isSameDay(parseISO(task.startDate), date))
  );

  // Fetch tasks for the current user and week
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setError(null);
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', session.user.id)
          .order('start_date', { ascending: true });
        if (error) throw error;
        setTasks(
          (data || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            startDate: t.start_date,
            startTime: t.start_time,
            endDate: t.end_date,
            endTime: t.end_time,
            color: t.color || COLORS[0],
          }))
        );
      } catch (err: any) {
        setError(err.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [session]);

  // Add a new task to Supabase
  const handleAddTask = async () => {
    if (!session || !newTaskTitle || !newTaskStartDate || !newTaskStartTime || !newTaskEndDate || !newTaskEndTime) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: session.user.id,
            title: newTaskTitle,
            start_date: newTaskStartDate,
            start_time: newTaskStartTime,
            end_date: newTaskEndDate,
            end_time: newTaskEndTime,
            color: newTaskColor,
            completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (error) throw error;
      setTasks((prev) => [
        ...prev,
        {
          id: data.id,
          title: data.title,
          startDate: data.start_date,
          startTime: data.start_time,
          endDate: data.end_date,
          endTime: data.end_time,
          color: data.color || COLORS[0],
        },
      ]);
      setShowModal(false);
      setNewTaskTitle('');
      setNewTaskStartDate('');
      setNewTaskStartTime('');
      setNewTaskEndDate('');
      setNewTaskEndTime('');
      setNewTaskColor(COLORS[0]);
    } catch (err: any) {
      setError(err.message || 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  // Render the week grid (main calendar view)
  function renderWeekGrid() {
    // 8am to 8pm, 1 hour slots
    const hours = Array.from({ length: 13 }, (_, i) => 8 + i);
    return (
      <div className="flex flex-col h-full w-full">
        {/* Header: days */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {weekDates.map((date, i) => (
            <div key={i} className="py-2 px-2 text-center font-semibold text-gray-800 border-r last:border-r-0 border-gray-200">
              <div>{WEEKDAYS[i]}</div>
              <div className="text-xs text-gray-500">{format(date, 'd MMM')}</div>
            </div>
          ))}
        </div>
        {/* Grid: hours x days */}
        <div className="flex-1 grid grid-cols-7 relative" style={{ minHeight: 600 }}>
          {weekDates.map((date, dayIdx) => (
            <div key={dayIdx} className="border-r last:border-r-0 border-gray-200 relative">
              {/* Hour slots */}
              {hours.map((hour, hIdx) => (
                <div key={hIdx} className="h-12 border-b border-gray-100"></div>
              ))}
              {/* Tasks for this day */}
              {tasks
                .filter(task => isSameDay(parseISO(task.startDate), date))
                .map(task => {
                  // Position and height based on start/end time
                  const [startHour, startMinute] = task.startTime.split(':').map(Number);
                  const [endHour, endMinute] = task.endTime.split(':').map(Number);
                  const top = ((startHour - 8) * 48) + (startMinute / 60) * 48; // 48px per hour
                  let duration = differenceInMinutes(
                    parseISO(`${task.endDate}T${task.endTime}`),
                    parseISO(`${task.startDate}T${task.startTime}`)
                  );
                  if (duration < 30) duration = 30; // minimum block height (30min = 24px)
                  const height = Math.max((duration / 60) * 48, 24);
                  return (
                    <div
                      key={task.id}
                      className="absolute left-2 right-2 rounded shadow px-2 py-1 text-xs font-semibold cursor-pointer flex flex-col justify-center"
                      style={{
                        top,
                        height,
                        background: task.color,
                        color: '#fff',
                        zIndex: 2,
                        minHeight: 32,
                      }}
                      title={task.title}
                    >
                      <span className="truncate">{task.title}</span>
                      <span className="font-normal text-[10px] text-white/80">{task.startTime} - {task.endTime}</span>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session) return <div className="p-8 text-center">Please log in to view your planner.</div>;
  if (loading) return <div className="p-8 text-center">Loading tasks...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <button
            className="bg-[#22c55e] text-white px-4 py-2 rounded-md hover:bg-[#16a34a]"
            onClick={() => setShowModal(true)}
          >
            + Add
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {weekDates.map((date, i) => (
            <div key={i} className="mb-6">
              <div className="font-semibold text-lg mb-2 flex items-center gap-2 text-gray-800">
                {WEEKDAYS[i]}:
                <span className="text-xs text-gray-500">{format(date, 'd MMM')}</span>
              </div>
              <ul className="space-y-2">
                {tasksByDay[i].length === 0 ? (
                  <li className="text-gray-400 text-sm">No tasks</li>
                ) : (
                  tasksByDay[i].map(task => (
                    <li key={task.id} className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ background: task.color }}></span>
                      <span className="font-medium text-gray-800">{task.title}</span>
                      <span className="text-xs text-gray-500">{task.startTime} - {task.endTime}</span>
                    </li>
                  ))
                )}
              </ul>
              {i < weekDates.length - 1 && <hr className="my-4 border-gray-300" />}
            </div>
          ))}
        </div>
      </aside>
      {/* Main calendar view */}
      <main className="flex-1 p-8">
        {renderWeekGrid()}
      </main>
      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4 text-[#0f172a]">Add Task</h2>
            <div className="mb-4">
              <label className="block text-sm text-[#64748b] mb-1">Title</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#22c55e] text-gray-900 placeholder-gray-400"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-[#64748b] mb-1">Start Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#22c55e] text-gray-900 placeholder-gray-400"
                value={newTaskStartDate}
                onChange={e => setNewTaskStartDate(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-[#64748b] mb-1">Start Time</label>
              <input
                type="time"
                className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#22c55e] text-gray-900 placeholder-gray-400"
                value={newTaskStartTime}
                onChange={e => setNewTaskStartTime(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-[#64748b] mb-1">End Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#22c55e] text-gray-900 placeholder-gray-400"
                value={newTaskEndDate}
                onChange={e => setNewTaskEndDate(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-[#64748b] mb-1">End Time</label>
              <input
                type="time"
                className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#22c55e] text-gray-900 placeholder-gray-400"
                value={newTaskEndTime}
                onChange={e => setNewTaskEndTime(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-[#64748b] mb-1">Color</label>
              <div className="flex gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${newTaskColor === color ? 'border-[#22c55e]' : 'border-gray-200'}`}
                    style={{ background: color }}
                    onClick={() => setNewTaskColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-100 text-[#64748b] hover:bg-gray-200"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-[#22c55e] text-white hover:bg-[#16a34a]"
                onClick={handleAddTask}
                disabled={!newTaskTitle || !newTaskStartDate || !newTaskStartTime || !newTaskEndDate || !newTaskEndTime}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
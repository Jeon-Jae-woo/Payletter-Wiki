'use client';

import { useState, useEffect, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getEventsForMonth } from '@/lib/calendar';
import EventCreateModal from './EventCreateModal';
import type { CalendarEvent } from '@/types';

// Format a Date to 'YYYY-MM-DD' key
function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Group events array into a map keyed by 'YYYY-MM-DD'
function groupEventsByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const key = formatDateKey(new Date(event.start_at));
    if (!map[key]) map[key] = [];
    map[key].push(event);
  }
  return map;
}

// Get Monday of the week containing `date`
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const WEEK_COLUMN_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

type ViewMode = 'month' | 'week';

export default function CalendarView() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const loadEvents = useCallback(async (date: Date) => {
    setIsLoading(true);
    const { data } = await getEventsForMonth(date.getFullYear(), date.getMonth() + 1);
    const loaded = (data ?? []) as CalendarEvent[];
    setEvents(loaded);
    setEventsByDate(groupEventsByDate(loaded));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEvents(currentMonth);
  }, [currentMonth, loadEvents]);

  // When switching to week view, sync week to current month's first day
  function handleSetViewMode(mode: ViewMode) {
    if (mode === 'week') {
      setCurrentWeekStart(getMondayOfWeek(new Date()));
    }
    setViewMode(mode);
  }

  function goToPrevMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToToday() {
    setCurrentMonth(new Date());
    setCurrentWeekStart(getMondayOfWeek(new Date()));
  }

  function goToPrevWeek() {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  }

  function goToNextWeek() {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  }

  function handleDayClick(date: Date) {
    setSelectedEvent(null);
    setModalDate(date);
  }

  function handleModalClose() {
    setModalDate(null);
  }

  function handleEventCreated(event: CalendarEvent) {
    setModalDate(null);
    loadEvents(currentMonth);
    setSelectedEvent(event);
  }

  const monthLabel = currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  // For week view: compute the 7 days (Mon–Sun)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Week label
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekLabel = `${weekStart.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} – ${weekEnd.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}`;

  // Ensure week events are loaded — we load the month for any day in the week
  useEffect(() => {
    if (viewMode === 'week') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadEvents(currentWeekStart);
    }
  }, [currentWeekStart, viewMode, loadEvents]);

  const today = new Date();
  const todayKey = formatDateKey(today);

  return (
    <div className="flex flex-col h-full min-h-screen bg-white" style={{ fontFamily: 'Pretendard, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-[#0054FF]" />
          <h1 className="text-lg font-semibold text-gray-900">캘린더</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => handleSetViewMode('month')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-[#0054FF] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              월
            </button>
            <button
              onClick={() => handleSetViewMode('week')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-[#0054FF] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              주
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            오늘
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={viewMode === 'month' ? goToPrevMonth : goToPrevWeek}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-900 min-w-[160px] text-center">
              {viewMode === 'month' ? monthLabel : weekLabel}
            </span>
            <button
              onClick={viewMode === 'month' ? goToNextMonth : goToNextWeek}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar area */}
      <div className="flex-1 relative overflow-auto px-4 pb-4">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#0054FF] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {viewMode === 'month' ? (
          <>
            {/* Weekday header row */}
            <div className="grid grid-cols-7 border-l border-t border-gray-200 mt-2">
              {WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`text-xs font-medium py-2 text-center border-r border-b border-gray-200 bg-gray-50
                    ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* DayPicker with custom Day rendering */}
            <DayPicker
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              hideNavigation
              classNames={{
                month_grid: 'w-full border-l border-gray-200',
                week: 'grid grid-cols-7',
                weeks: 'w-full',
                month: 'w-full',
                months: 'w-full',
                weekdays: 'hidden',
                weekday: 'hidden',
                day: '',
                today: '',
              }}
              components={{
                Day: ({ day, modifiers }) => {
                  const key = formatDateKey(day.date);
                  const dayEvents = eventsByDate[key] ?? [];
                  const isToday = modifiers.today === true;
                  const isOutside = modifiers.outside === true;
                  const dayOfWeek = day.date.getDay();
                  const isSunday = dayOfWeek === 0;
                  const isSaturday = dayOfWeek === 6;

                  return (
                    <td
                      className={`relative flex flex-col h-24 w-full border-r border-b border-gray-200 p-1 cursor-pointer
                        transition-colors hover:bg-blue-50/30
                        ${isOutside ? 'bg-gray-50/50' : 'bg-white'}`}
                      onClick={() => !isOutside && handleDayClick(day.date)}
                    >
                      <span
                        className={`text-sm font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full self-start
                          ${isToday
                            ? 'bg-[#0054FF] text-white'
                            : isSunday
                            ? 'text-red-400'
                            : isSaturday
                            ? 'text-blue-500'
                            : isOutside
                            ? 'text-gray-300'
                            : 'text-gray-700'
                          }`}
                      >
                        {day.date.getDate()}
                      </span>
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        {dayEvents.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent((prev) => (prev?.id === event.id ? null : event));
                            }}
                            className="text-left text-xs px-1.5 py-0.5 rounded-sm truncate
                              bg-[#0054FF] text-white hover:bg-[#0044DD] transition-colors"
                            style={{ backgroundColor: event.color ?? '#0054FF' }}
                          >
                            {event.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-xs text-gray-400 px-1">+{dayEvents.length - 3}개</span>
                        )}
                      </div>
                    </td>
                  );
                },
              }}
            />
          </>
        ) : (
          /* Weekly View */
          <div className="mt-2">
            {/* Week column headers */}
            <div className="grid grid-cols-7 border-l border-t border-gray-200">
              {weekDays.map((day, i) => {
                const key = formatDateKey(day);
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    className="border-r border-b border-gray-200 p-2 text-center cursor-pointer hover:bg-blue-50/30 transition-colors"
                    onClick={() => handleDayClick(day)}
                  >
                    <div
                      className={`inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-md ${
                        isToday ? 'bg-[#0054FF] text-white' : 'text-gray-600'
                      }`}
                    >
                      <span className="text-xs font-medium">{WEEK_COLUMN_LABELS[i]}</span>
                      <span className="text-sm font-bold">{day.getDate()}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Week event rows */}
            <div className="grid grid-cols-7 border-l border-gray-200 overflow-y-auto max-h-[60vh]">
              {weekDays.map((day) => {
                const key = formatDateKey(day);
                const dayEvents = eventsByDate[key] ?? [];
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    className={`border-r border-b border-gray-200 min-h-[200px] p-1.5 cursor-pointer transition-colors hover:bg-blue-50/20 ${
                      isToday ? 'bg-blue-50/10' : 'bg-white'
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="flex flex-col gap-1">
                      {dayEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent((prev) => (prev?.id === event.id ? null : event));
                          }}
                          className="text-left text-xs px-2 py-1 rounded truncate w-full
                            bg-[#0054FF] text-white hover:bg-[#0044DD] transition-colors"
                          style={{ backgroundColor: event.color ?? '#0054FF' }}
                        >
                          {event.title}
                        </button>
                      ))}
                      {dayEvents.length === 0 && (
                        <span className="text-xs text-gray-300 px-1 mt-1">없음</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Event detail card */}
      {selectedEvent && (
        <div className="mx-4 mb-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: selectedEvent.color ?? '#0054FF' }}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{selectedEvent.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedEvent.all_day
                    ? new Date(selectedEvent.start_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : (() => {
                        const start = new Date(selectedEvent.start_at);
                        const end = selectedEvent.end_at ? new Date(selectedEvent.end_at) : null;
                        const dateStr = start.toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                        });
                        const startTime = start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                        const endTime = end
                          ? end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                          : '';
                        return `${dateStr} ${startTime}${endTime ? ` – ${endTime}` : ''}`;
                      })()}
                </p>
                {selectedEvent.description && (
                  <p className="text-xs text-gray-600 mt-1.5 whitespace-pre-wrap">{selectedEvent.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Event count summary */}
      {events.length > 0 && (
        <div className="px-6 pb-3 text-xs text-gray-400">
          {viewMode === 'month' ? `이번 달 일정 ${events.length}개` : `이번 주 일정 ${weekDays.filter(d => (eventsByDate[formatDateKey(d)] ?? []).length > 0).reduce((acc, d) => acc + (eventsByDate[formatDateKey(d)] ?? []).length, 0)}개`}
        </div>
      )}

      {/* Create Event Modal */}
      {modalDate && userId && (
        <EventCreateModal
          selectedDate={modalDate}
          onClose={handleModalClose}
          onSuccess={handleEventCreated}
          userId={userId}
        />
      )}

      {/* Auth guard hint */}
      {modalDate && !userId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 shadow-xl text-center">
            <p className="text-sm text-gray-600">일정을 추가하려면 로그인이 필요합니다.</p>
            <button
              onClick={() => setModalDate(null)}
              className="mt-3 px-4 py-2 text-sm font-medium text-white bg-[#0054FF] rounded-lg hover:bg-[#0044DD] transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

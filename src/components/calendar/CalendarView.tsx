'use client';

import { useState, useEffect, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { ChevronLeft, ChevronRight, X, Calendar, Trash2, FileText, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getEventsForMonth, deleteEvent, getEventDocuments } from '@/lib/calendar';
import { getTodosForMonth } from '@/lib/todos';
import EventCreateModal from './EventCreateModal';
import EventEditModal from './EventEditModal';
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

type LinkedDoc = { id: string; title: string; icon: string | null };

const PRIORITY_LABEL = { high: '높음', medium: '보통', low: '낮음' } as const;
const PRIORITY_STYLE = {
  high: 'bg-red-50 text-red-600 border border-red-200',
  medium: 'bg-blue-50 text-[#0054FF] border border-blue-200',
  low: 'bg-gray-50 text-gray-500 border border-gray-200',
} as const;
const PRIORITY_COLOR = {
  high: '#EF4444',
  medium: '#0054FF',
  low: '#9CA3AF',
} as const;

export default function CalendarView() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});
  const [todoCountByDate, setTodoCountByDate] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedEventDocs, setSelectedEventDocs] = useState<LinkedDoc[]>([]);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const loadEvents = useCallback(async (date: Date) => {
    setIsLoading(true);
    const [{ data: evData }, { data: todoData }] = await Promise.all([
      getEventsForMonth(date.getFullYear(), date.getMonth() + 1),
      getTodosForMonth(date.getFullYear(), date.getMonth() + 1),
    ]);
    const loaded = (evData ?? []) as CalendarEvent[];
    setEvents(loaded);
    setEventsByDate(groupEventsByDate(loaded));

    // due_date 기준으로 미완료 할 일 개수 집계
    const countMap: Record<string, number> = {};
    for (const t of (todoData ?? []) as { due_date: string | null }[]) {
      if (t.due_date) countMap[t.due_date] = (countMap[t.due_date] ?? 0) + 1;
    }
    setTodoCountByDate(countMap);
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

  // 선택된 이벤트의 연결 문서 로드
  useEffect(() => {
    if (!selectedEvent) {
      setSelectedEventDocs([]);
      setIsDeleteConfirm(false);
      return;
    }
    getEventDocuments(selectedEvent.id).then(({ data }) => {
      if (data) {
        setSelectedEventDocs(
          (data as unknown as { documents: LinkedDoc | null }[])
            .filter((row) => row.documents)
            .map((row) => row.documents as LinkedDoc)
        );
      }
    });
  }, [selectedEvent]);

  async function handleDeleteEvent() {
    if (!selectedEvent) return;
    await deleteEvent(selectedEvent.id);
    setSelectedEvent(null);
    loadEvents(currentMonth);
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
    <div className="flex flex-col h-full min-h-screen bg-white dark:bg-gray-900" style={{ fontFamily: 'Pretendard, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-[#0054FF]" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">캘린더</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => handleSetViewMode('month')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-[#0054FF] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              월
            </button>
            <button
              onClick={() => handleSetViewMode('week')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-[#0054FF] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              주
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            오늘
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={viewMode === 'month' ? goToPrevMonth : goToPrevWeek}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[160px] text-center">
              {viewMode === 'month' ? monthLabel : weekLabel}
            </span>
            <button
              onClick={viewMode === 'month' ? goToNextMonth : goToNextWeek}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar area */}
      <div className="flex-1 relative overflow-auto px-4 pb-4">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#0054FF] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {viewMode === 'month' ? (
          <>
            {/* Weekday header row */}
            <div className="grid grid-cols-7 border-l border-t border-gray-200 dark:border-gray-700 mt-2">
              {WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`text-xs font-medium py-2 text-center border-r border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800
                    ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
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
                month_grid: 'w-full border-l border-gray-200 dark:border-gray-700',
                month_caption: 'hidden',
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
                  const todoCount = todoCountByDate[key] ?? 0;
                  const isToday = modifiers.today === true;
                  const isOutside = modifiers.outside === true;
                  const dayOfWeek = day.date.getDay();
                  const isSunday = dayOfWeek === 0;
                  const isSaturday = dayOfWeek === 6;

                  return (
                    <td
                      className={`relative flex flex-col h-24 w-full border-r border-b border-gray-200 dark:border-gray-700 p-1 cursor-pointer
                        transition-colors hover:bg-blue-50/30 dark:hover:bg-blue-950/30
                        ${isOutside ? 'bg-gray-50/50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-900'}`}
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
                            ? 'text-gray-300 dark:text-gray-600'
                            : 'text-gray-700 dark:text-gray-300'
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
                              text-white transition-colors flex items-center gap-0.5"
                            style={{ backgroundColor: PRIORITY_COLOR[event.priority ?? 'medium'] }}
                          >
                            {event.priority === 'high' && <span className="text-[9px] font-bold leading-none">!</span>}
                            <span className="truncate">{event.title}</span>
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 px-1">+{dayEvents.length - 3}개</span>
                        )}
                      </div>
                      {/* 할 일 뱃지 */}
                      {todoCount > 0 && (
                        <div className="mt-auto pt-0.5">
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500 px-1">
                            ☐ {todoCount}
                          </span>
                        </div>
                      )}
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
            <div className="grid grid-cols-7 border-l border-t border-gray-200 dark:border-gray-700">
              {weekDays.map((day, i) => {
                const key = formatDateKey(day);
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    className="border-r border-b border-gray-200 dark:border-gray-700 p-2 text-center cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors"
                    onClick={() => handleDayClick(day)}
                  >
                    <div
                      className={`inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-md ${
                        isToday ? 'bg-[#0054FF] text-white' : 'text-gray-600 dark:text-gray-400'
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
            <div className="grid grid-cols-7 border-l border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[60vh]">
              {weekDays.map((day) => {
                const key = formatDateKey(day);
                const dayEvents = eventsByDate[key] ?? [];
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    className={`border-r border-b border-gray-200 dark:border-gray-700 min-h-[200px] p-1.5 cursor-pointer transition-colors hover:bg-blue-50/20 dark:hover:bg-blue-950/20 ${
                      isToday ? 'bg-blue-50/10 dark:bg-blue-950/10' : 'bg-white dark:bg-gray-900'
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
                          className="text-left text-xs px-2 py-1 rounded w-full
                            text-white transition-colors flex items-center gap-1"
                          style={{ backgroundColor: PRIORITY_COLOR[event.priority ?? 'medium'] }}
                        >
                          {event.priority === 'high' && <span className="text-[9px] font-bold leading-none flex-shrink-0">!</span>}
                          <span className="truncate">{event.title}</span>
                        </button>
                      ))}
                      {dayEvents.length === 0 && (
                        <span className="text-xs text-gray-300 dark:text-gray-600 px-1 mt-1">없음</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            style={{ fontFamily: 'Pretendard, sans-serif' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PRIORITY_COLOR[selectedEvent.priority ?? 'medium'] }}
                />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{selectedEvent.title}</h3>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#0054FF] hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                  title="수정"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              {/* Priority badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">중요도</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLE[selectedEvent.priority ?? 'medium']}`}>
                  {PRIORITY_LABEL[selectedEvent.priority ?? 'medium']}
                </span>
              </div>

              {/* Date/time */}
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {selectedEvent.all_day
                  ? new Date(selectedEvent.start_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                  : (() => {
                      const start = new Date(selectedEvent.start_at);
                      const end = selectedEvent.end_at ? new Date(selectedEvent.end_at) : null;
                      const dateStr = start.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
                      const startTime = start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                      const endTime = end ? end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
                      return `${dateStr} ${startTime}${endTime ? ` – ${endTime}` : ''}`;
                    })()}
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                  {selectedEvent.description}
                </p>
              )}

              {/* Linked documents */}
              {selectedEventDocs.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">연결된 문서</p>
                  <div className="flex flex-col gap-1">
                    {selectedEventDocs.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => router.push(`/documents/${doc.id}`)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-[#0054FF] text-gray-700 dark:text-gray-300 text-xs transition-colors text-left"
                      >
                        <span>{doc.icon ?? <FileText size={12} />}</span>
                        <span className="truncate">{doc.title || '제목 없음'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer: Delete */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
              {isDeleteConfirm ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">정말 삭제할까요?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsDeleteConfirm(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleDeleteEvent}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={13} />
                  일정 삭제
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event count summary */}
      {events.length > 0 && (
        <div className="px-6 pb-3 text-xs text-gray-400 dark:text-gray-500">
          {viewMode === 'month' ? `이번 달 일정 ${events.length}개` : `이번 주 일정 ${weekDays.filter(d => (eventsByDate[formatDateKey(d)] ?? []).length > 0).reduce((acc, d) => acc + (eventsByDate[formatDateKey(d)] ?? []).length, 0)}개`}
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <EventEditModal
          event={selectedEvent}
          initialLinkedDocs={selectedEventDocs}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            setShowEditModal(false);
            setSelectedEvent(updated);
            loadEvents(currentMonth);
          }}
        />
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">일정을 추가하려면 로그인이 필요합니다.</p>
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

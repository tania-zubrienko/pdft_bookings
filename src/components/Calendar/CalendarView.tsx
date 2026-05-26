import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ScheduledClass } from '../../types';
import UI from '@/styles';

type ViewMode = 'week' | 'month';

interface CalendarViewProps {
  classes: ScheduledClass[];
  viewMode: ViewMode;
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onChangeDate: (date: Date) => void;
  onChangeViewMode: (mode: ViewMode) => void;
  /** IDs of ScheduledClass documents the student has a confirmed reservation for */
  reservedClassIds?: Set<string>;
}

// ---- helpers ----
function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const s = new Date(d);
  s.setDate(diff);
  s.setHours(0, 0, 0, 0);
  return s;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// ---- component ----
export default function CalendarView({
  classes,
  viewMode,
  currentDate,
  selectedDate,
  onSelectDate,
  onChangeDate,
  onChangeViewMode,
  reservedClassIds,
}: CalendarViewProps) {
  // Map date-key → class count
  const classCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of classes) {
      const key = toDateKey(c.date);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [classes]);

  // Map date-key → whether the student has a reservation on that day
  const reservedDays = useMemo(() => {
    const set = new Set<string>();
    if (!reservedClassIds) return set;
    for (const c of classes) {
      if (reservedClassIds.has(c.id)) set.add(toDateKey(c.date));
    }
    return set;
  }, [classes, reservedClassIds]);

  // Build the grid of dates
  const calendarDays = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }

    // Month view
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstOfMonth.getDay();
    const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const gridStart = new Date(year, month, 1 + offsetToMonday);

    // Always render 6 rows (42 cells) so layout doesn't jump
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [viewMode, currentDate]);

  // Navigation
  function goBack() {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    onChangeDate(d);
  }

  function goForward() {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    onChangeDate(d);
  }

  function goToday() {
    const today = new Date();
    onChangeDate(today);
    onSelectDate(today);
  }

  // Header label
  const headerLabel = useMemo(() => {
    if (viewMode === 'week') {
      const start = calendarDays[0];
      const end = calendarDays[6];
      const fmt = (d: Date) =>
        d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      const yearStr = end.getFullYear();
      return `${fmt(start)} – ${fmt(end)}, ${yearStr}`;
    }
    return currentDate.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
  }, [viewMode, currentDate, calendarDays]);

  const dayNamesFull = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const dayNamesShort = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className='card overflow-hidden p-3'>
      {/* Toolbar */}
      <div className='flex flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-ui-border-soft'>
        {/* Navigation */}
        <div className='flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start'>
          <button
            onClick={goBack}
            className={UI.button.icon}
            aria-label='Previous'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>
          <h2 className={UI.text.subheading}>{headerLabel}</h2>
          <button
            onClick={goForward}
            className={UI.button.icon}
            aria-label='Next'
          >
            <ChevronRight className='w-5 h-5' />
          </button>
          <button
            onClick={goToday}
            className='ml-1 sm:ml-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-ui-border hover:bg-ui-hover active:bg-ui-hover transition-colors text-ui-text'
          >
            Hoy
          </button>
        </div>

        {/* View Toggle */}
        <div className='flex rounded-lg border border-ui-border overflow-hidden'>
          <button
            onClick={() => onChangeViewMode('week')}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-brand text-ui-text-inverse'
                : 'bg-ui-card text-ui-text hover:bg-ui-hover'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => onChangeViewMode('month')}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-brand text-ui-text-inverse'
                : 'bg-ui-card text-ui-text hover:bg-ui-hover'
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Day-name header */}
      <div className='grid grid-cols-7 border-b border-ui-border-soft'>
        {dayNamesFull.map((name, i) => (
          <div
            key={name + i}
            className='py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-semibold text-ui-text-soft	 uppercase tracking-wider'
          >
            <span className='hidden sm:inline'>{name}</span>
            <span className='sm:hidden'>{dayNamesShort[i]}</span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        className={`grid grid-cols-7 ${viewMode === 'week' ? '' : 'auto-rows-[56px] sm:auto-rows-[80px]'}`}
      >
        {calendarDays.map((day, idx) => {
          const key = toDateKey(day);
          const count = classCountByDay.get(key) ?? 0;
          const hasReservation = reservedDays.has(key);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const today_ = isToday(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const outOfMonth = viewMode === 'month' && !isCurrentMonth;

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day)}
              className={`
                relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 border border-ui-border-soft transition-colors min-h-[44px]
                ${viewMode === 'week' ? 'py-3 sm:py-5' : 'py-1 sm:py-2'}
                ${outOfMonth ? 'bg-ui-hover/50 hover:bg-brand/20' : 'hover:bg-brand/20 active:bg-brand/30'}
                ${selected ? 'bg-ui-input ring-2 ring-inset ring-brand' : ''}
              `}
            >
              <span
                className={`
                  text-xs sm:text-sm font-medium leading-none
                  ${today_ ? 'bg-brand text-ui-text-inverse w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full' : ''}
                  ${outOfMonth ? 'text-ui-text-muted' : ''}
                `}
              >
                {day.getDate()}
              </span>
              {count > 0 && (
                <>
                  {/* Dots on mobile */}
                  <span className='sm:hidden flex gap-0.5'>
                    <span
                      className={`w-1.5 h-1.5 rounded-full
                      ${outOfMonth ? 'bg-ui-text-muted' : 'bg-brand'}
                      `}
                    />
                    {hasReservation && (
                      <span className='w-1.5 h-1.5 rounded-full bg-green-400' />
                    )}
                  </span>
                  {/* Text badge on sm+ */}
                  <span
                    className={`hidden sm:inline ${outOfMonth ? `${UI.badge.base} bg-ui-hover text-ui-text-muted` : UI.badge.blue}`}
                  >
                    {count} {count === 1 ? 'clase' : 'clases'}
                  </span>
                  {hasReservation && (
                    <span
                      className={`hidden sm:inline ${UI.badge.green} ml-0.5`}
                    >
                      ✓ reservada
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

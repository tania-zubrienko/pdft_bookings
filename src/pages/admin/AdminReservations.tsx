import { useEffect, useState, useMemo } from 'react';
import reservationService, {
  AdminReservation,
} from '@/services/reservation.service';
import scheduleService from '@/services/schedule.service';
import { ScheduledClass } from '@/types';
import AdminLayout from '../../components/Layout/AdminLayout';
import {
  Users,
  Search,
  ClipboardX,
  SearchX,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  UserMinus,
  Loader2,
} from 'lucide-react';
import UI from '@/styles';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface ClassGroup {
  scheduledClassId: string;
  classTitle: string;
  classDate: Date;
  reservations: AdminReservation[];
}

function StudentAvatar({ r }: { r: AdminReservation }) {
  const initials = r.studentName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (r.studentAvatar) {
    return (
      <img
        src={r.studentAvatar}
        alt={r.studentName}
        title={r.studentName}
        className='w-9 h-9 rounded-full object-cover border-2 border-ui-surface'
      />
    );
  }
  return (
    <div
      title={r.studentName}
      className='w-9 h-9 rounded-full bg-brand/20 text-brand-light flex items-center justify-center text-xs font-bold border-2 border-ui-surface shrink-0'
    >
      {initials}
    </div>
  );
}

function ClassDetailDialog({
  group,
  onClose,
  onReservationCancelled,
}: {
  group: ClassGroup;
  onClose: () => void;
  onReservationCancelled: (reservationId: string) => void;
}) {
  const [localReservations, setLocalReservations] = useState(
    group.reservations,
  );
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const confirmed = localReservations.filter((r) => r.status === 'confirmed');
  const cancelled = localReservations.filter((r) => r.status === 'cancelled');

  const time = group.classDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dateLabel = group.classDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  async function handleCancel(r: AdminReservation) {
    setCancelling(r.id);
    setConfirmingId(null);
    try {
      await reservationService.adminCancelReservation(
        r.id,
        r.studentId,
        group.scheduledClassId,
        r.paymentMode,
      );
      setLocalReservations((prev) =>
        prev.map((res) =>
          res.id === r.id ? { ...res, status: 'cancelled' as const } : res,
        ),
      );
      onReservationCancelled(r.id);
    } catch (err) {
      console.error('Error cancelling reservation:', err);
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='bg-ui-surface border border-ui-border rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-ui-border'>
          <div>
            <h2 className='text-lg font-bold text-ui-text'>
              {group.classTitle}
            </h2>
            <div className='flex items-center gap-2 mt-1 text-sm text-ui-text-soft'>
              <Clock className='w-4 h-4' />
              <span className='capitalize'>{dateLabel}</span>
              <span>·</span>
              <span>{time}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={UI.button.icon}
            aria-label='Cerrar'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Stats bar */}
        <div className='flex gap-4 px-5 py-3 border-b border-ui-border bg-ui-input'>
          <div className='flex items-center gap-1.5 text-sm text-green-400'>
            <CheckCircle2 className='w-4 h-4' />
            <span className='font-semibold'>{confirmed.length}</span>
            <span className='text-ui-text-muted'>confirmadas</span>
          </div>
          {cancelled.length > 0 && (
            <div className='flex items-center gap-1.5 text-sm text-red-400'>
              <XCircle className='w-4 h-4' />
              <span className='font-semibold'>{cancelled.length}</span>
              <span className='text-ui-text-muted'>canceladas</span>
            </div>
          )}
        </div>

        {/* Student list */}
        <div className='overflow-y-auto flex-1 px-5 py-3 space-y-1'>
          {localReservations.length === 0 ? (
            <p className='text-sm text-ui-text-muted py-4 text-center'>
              Sin reservas para esta clase.
            </p>
          ) : (
            localReservations.map((r) => {
              const isCancelled = r.status === 'cancelled';
              const isThisCancelling = cancelling === r.id;
              const isConfirming = confirmingId === r.id;

              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 py-2.5 border-b border-ui-border-soft last:border-0 ${isCancelled ? 'opacity-50' : ''}`}
                >
                  <StudentAvatar r={r} />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-ui-text truncate'>
                      {r.studentName}
                    </p>
                    <p className='text-xs text-ui-text-muted'>
                      {r.paymentMode === 'credit' ? 'Crédito' : 'Individual'} ·{' '}
                      {r.createdAt.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>

                  {isCancelled ? (
                    <span className='shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-800'>
                      <XCircle className='w-3 h-3' />
                      Cancelada
                    </span>
                  ) : isConfirming ? (
                    <div className='shrink-0 flex items-center gap-1.5'>
                      <span className='text-xs text-ui-text-muted'>
                        ¿Cancelar?
                      </span>
                      <button
                        onClick={() => handleCancel(r)}
                        className='text-xs px-2 py-1 rounded bg-red-900/60 text-red-400 border border-red-800 hover:bg-red-800/60 transition-colors'
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className='text-xs px-2 py-1 rounded bg-ui-input text-ui-text-muted border border-ui-border hover:bg-ui-hover transition-colors'
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(r.id)}
                      disabled={!!cancelling}
                      title='Cancelar reserva'
                      className='shrink-0 p-1.5 rounded-lg text-ui-text-muted hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40'
                    >
                      {isThisCancelling ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <UserMinus className='w-4 h-4' />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ClassCard({
  group,
  onClick,
}: {
  group: ClassGroup;
  onClick: () => void;
}) {
  const confirmed = group.reservations.filter(
    (r) => r.status === 'confirmed',
  ).length;
  const time = group.classDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <button
      onClick={onClick}
      className='w-full text-left rounded-lg bg-ui-input border border-ui-border p-2.5 hover:border-brand/50 hover:bg-ui-hover transition-colors'
    >
      <p className='text-sm font-semibold text-ui-text leading-tight truncate'>
        {group.classTitle}
      </p>
      <p className='text-xs text-ui-text-muted mt-0.5'>{time}</p>
      <div className='mt-1.5 flex items-center gap-1 text-xs font-medium text-brand-light'>
        <Users className='w-3 h-3' />
        <span>
          {confirmed} alumna{confirmed !== 1 ? 's' : ''}
        </span>
      </div>
    </button>
  );
}

export default function AdminReservations() {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ClassGroup | null>(null);

  useEffect(() => {
    Promise.all([
      reservationService.getAdminReservations(),
      scheduleService.getAllScheduledClasses(),
    ]).then(([res, classes]) => {
      setReservations(res);
      setScheduledClasses(classes.filter((c) => c.status === 'active'));
      setLoading(false);
    });
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weekStart = useMemo(() => {
    const base = getWeekStart(today);
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [today, weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  // Filter reservations to visible week + search
  const filteredReservations = useMemo(() => {
    let filtered = reservations.filter(
      (r) => r.classDate >= weekStart && r.classDate < weekEnd,
    );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.classTitle.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [reservations, weekStart, weekEnd, searchQuery]);

  // Group by scheduledClassId — seed from all active scheduled classes first,
  // then overlay reservations so classes with 0 students still appear.
  const groupedByClass = useMemo(() => {
    const map = new Map<string, ClassGroup>();

    // Seed with every active scheduled class in the visible week
    scheduledClasses
      .filter((sc) => sc.date >= weekStart && sc.date < weekEnd)
      .forEach((sc) => {
        map.set(sc.id, {
          scheduledClassId: sc.id,
          classTitle: sc.classTitle,
          classDate: sc.date,
          reservations: [],
        });
      });

    // Overlay reservations (apply search filter)
    filteredReservations.forEach((r) => {
      if (!map.has(r.scheduledClassId)) {
        map.set(r.scheduledClassId, {
          scheduledClassId: r.scheduledClassId,
          classTitle: r.classTitle,
          classDate: r.classDate,
          reservations: [],
        });
      }
      map.get(r.scheduledClassId)!.reservations.push(r);
    });

    return map;
  }, [scheduledClasses, filteredReservations, weekStart, weekEnd]);

  // Stats (entire week, ignoring search)
  const weekReservations = useMemo(
    () =>
      reservations.filter(
        (r) => r.classDate >= weekStart && r.classDate < weekEnd,
      ),
    [reservations, weekStart, weekEnd],
  );
  const stats = useMemo(() => {
    const confirmed = weekReservations.filter(
      (r) => r.status === 'confirmed',
    ).length;
    const uniqueStudents = new Set(weekReservations.map((r) => r.studentId))
      .size;
    const uniqueClasses = new Set(
      weekReservations.map((r) => r.scheduledClassId),
    ).size;
    return {
      total: weekReservations.length,
      confirmed,
      uniqueStudents,
      uniqueClasses,
    };
  }, [weekReservations]);

  const periodLabel = `${weekStart.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })} – ${weekDays[6].toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;

  if (loading) {
    return (
      <AdminLayout>
        <div className={UI.loading.container}>
          <div className={UI.loading.spinner}></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {selectedGroup && (
        <ClassDetailDialog
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onReservationCancelled={(reservationId) => {
            setReservations((prev) =>
              prev.map((r) =>
                r.id === reservationId
                  ? { ...r, status: 'cancelled' as const }
                  : r,
              ),
            );
          }}
        />
      )}
      <div className='mb-6'>
        <h1 className={UI.text.heading}>Reservas</h1>
        <p className={UI.text.headingDescription}>
          Vista semanal de clases y alumnas apuntadas
        </p>
      </div>

      {/* Controls */}
      <div className='flex flex-col sm:flex-row gap-3 mb-5'>
        {/* Week navigation */}
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className={UI.button.icon}
            aria-label='Semana anterior'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`${UI.button.base} ${weekOffset === 0 ? UI.button.primary : UI.button.secondary} text-sm px-3 py-1.5`}
          >
            Esta semana
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className={UI.button.icon}
            aria-label='Semana siguiente'
          >
            <ChevronRight className='w-5 h-5' />
          </button>
        </div>

        {/* Search */}
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Buscar alumna o clase…'
            className='input pl-9'
          />
        </div>
      </div>

      {/* Period label */}
      <p className={`${UI.text.soft} font-medium mb-4`}>{periodLabel}</p>

      {/* Stats row */}
      <div className={UI.stats.grid}>
        <div className={UI.stats.card}>
          <p className={UI.stats.value}>{stats.total}</p>
          <p className={UI.stats.label}>Total Reservas</p>
        </div>
        <div className={UI.stats.card}>
          <p className={UI.stats.valueGreen}>{stats.confirmed}</p>
          <p className={UI.stats.label}>Confirmadas</p>
        </div>
        <div className={UI.stats.card}>
          <p className={UI.stats.value}>{stats.uniqueStudents}</p>
          <p className={UI.stats.label}>Alumnas Únicas</p>
        </div>
        <div className={UI.stats.card}>
          <p className={UI.stats.value}>{stats.uniqueClasses}</p>
          <p className={UI.stats.label}>Clases</p>
        </div>
      </div>

      {/* Empty state — no classes scheduled at all this week */}
      {groupedByClass.size === 0 && (
        <div className={`${UI.card.base} px-6 py-16 text-center`}>
          {searchQuery.trim() ? (
            <>
              <SearchX className={`w-10 h-10 mx-auto mb-3 ${UI.text.muted}`} />
              <p className={`font-medium mb-1 ${UI.text.body}`}>
                Sin resultados
              </p>
              <p className={UI.text.soft}>
                No hay clases o reservas que coincidan con «{searchQuery}».
              </p>
            </>
          ) : (
            <>
              <ClipboardX
                className={`w-10 h-10 mx-auto mb-3 ${UI.text.muted}`}
              />
              <p className={`font-medium mb-1 ${UI.text.body}`}>
                Sin clases esta semana
              </p>
              <p className={UI.text.soft}>
                No hay clases programadas para este período.
              </p>
            </>
          )}
        </div>
      )}

      {/* Calendar grid */}
      {groupedByClass.size > 0 && (
        <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3'>
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            const dayGroups = Array.from(groupedByClass.values())
              .filter((g) => isSameDay(g.classDate, day))
              .sort((a, b) => a.classDate.getTime() - b.classDate.getTime());

            return (
              <div
                key={i}
                className='flex flex-col gap-2'
              >
                {/* Day header */}
                <div
                  className={`text-center rounded-lg py-2 px-1 ${
                    isToday
                      ? 'bg-brand text-white'
                      : 'bg-ui-input border border-ui-border'
                  }`}
                >
                  <p
                    className={`text-xs font-medium ${isToday ? 'text-white' : 'text-ui-text-muted'}`}
                  >
                    {DAY_NAMES[i]}
                  </p>
                  <p
                    className={`text-lg font-bold ${isToday ? 'text-white' : 'text-ui-text'}`}
                  >
                    {day.getDate()}
                  </p>
                  <p
                    className={`text-xs ${isToday ? 'text-white/80' : 'text-ui-text-muted'}`}
                  >
                    {day.toLocaleDateString('es-ES', { month: 'short' })}
                  </p>
                </div>

                {/* Class cards */}
                {dayGroups.length > 0 ? (
                  dayGroups.map((group) => (
                    <ClassCard
                      key={group.scheduledClassId}
                      group={group}
                      onClick={() => setSelectedGroup(group)}
                    />
                  ))
                ) : (
                  <div className='rounded-lg border border-dashed border-ui-border py-6 flex items-center justify-center'>
                    <span className='text-xs text-ui-text-muted'>—</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

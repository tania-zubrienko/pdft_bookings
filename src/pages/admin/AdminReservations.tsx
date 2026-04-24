import { useEffect, useState, useMemo } from 'react';
import reservationService, {
  AdminReservation,
} from '@/services/reservation.service';
import AdminLayout from '../../components/Layout/AdminLayout';
import {
  Calendar,
  CalendarDays,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  SearchX,
  ClipboardX,
} from 'lucide-react';
import UI from '@/lib/styles';

type FilterPeriod = 'week' | 'month';

export default function AdminReservations() {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<FilterPeriod>('week');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    reservationService.getAdminReservations().then((res) => {
      setReservations(res);
      setLoading(false);
    });
  }, []);

  const now = new Date();

  // Get start of current week (Monday)
  const weekStart = useMemo(() => {
    const d = new Date(now);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  const monthStart = useMemo(() => {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const monthEnd = useMemo(() => {
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }, []);

  const filteredReservations = useMemo(() => {
    let filtered = reservations;

    // Filter by period
    const start = period === 'week' ? weekStart : monthStart;
    const end = period === 'week' ? weekEnd : monthEnd;
    filtered = filtered.filter(
      (r) => r.classDate >= start && r.classDate <= end,
    );

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.studentId.toLowerCase().includes(q) ||
          r.classTitle.toLowerCase().includes(q),
      );
    }

    // Sort by class date
    filtered.sort((a, b) => a.classDate.getTime() - b.classDate.getTime());
    return filtered;
  }, [
    reservations,
    period,
    searchQuery,
    weekStart,
    weekEnd,
    monthStart,
    monthEnd,
  ]);

  // Group by class
  const groupedByClass = useMemo(() => {
    const map = new Map<
      string,
      {
        classTitle: string;
        classDate: Date;
        scheduledClassId: string;
        reservations: AdminReservation[];
      }
    >();
    filteredReservations.forEach((r) => {
      if (!map.has(r.scheduledClassId)) {
        map.set(r.scheduledClassId, {
          classTitle: r.classTitle,
          classDate: r.classDate,
          scheduledClassId: r.scheduledClassId,
          reservations: [],
        });
      }
      map.get(r.scheduledClassId)!.reservations.push(r);
    });
    return Array.from(map.values()).sort(
      (a, b) => a.classDate.getTime() - b.classDate.getTime(),
    );
  }, [filteredReservations]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredReservations.length;
    const confirmed = filteredReservations.filter(
      (r) => r.status === 'confirmed',
    ).length;
    const cancelled = filteredReservations.filter(
      (r) => r.status === 'cancelled',
    ).length;
    const uniqueStudents = new Set(filteredReservations.map((r) => r.studentId))
      .size;
    const uniqueClasses = new Set(
      filteredReservations.map((r) => r.scheduledClassId),
    ).size;
    return { total, confirmed, cancelled, uniqueStudents, uniqueClasses };
  }, [filteredReservations]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className='w-4 h-4 text-green-400' />;
      case 'cancelled':
        return <XCircle className='w-4 h-4 text-red-400' />;
      default:
        return null;
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-900/50 text-green-400 border border-green-800',
      cancelled: 'bg-red-900/50 text-red-400 border border-red-800',
    };
    const labels: Record<string, string> = {
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-ui-input text-ui-text-soft'}`}
      >
        {statusIcon(status)}
        {labels[status] ?? status}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={UI.loading.container}>
          <div className={UI.loading.spinner}></div>
        </div>
      </AdminLayout>
    );
  }

  const periodLabel =
    period === 'week'
      ? `${weekStart.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} – ${new Date(weekEnd.getTime() - 1).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}`
      : new Date(now.getFullYear(), now.getMonth()).toLocaleString('es-ES', {
          month: 'long',
          year: 'numeric',
        });

  return (
    <AdminLayout>
      <div className='mb-6'>
        <h1 className={UI.text.heading}>Reservas</h1>
        <p className={UI.text.headingDescription}>
          Consulta quién reservó clases en{' '}
          {period === 'week' ? 'la semana' : 'el mes'} actual
        </p>
      </div>

      {/* Controls */}
      <div className='flex flex-col sm:flex-row gap-3 mb-6'>
        {/* Period toggle */}
        <div className='flex gap-2'>
          <button
            onClick={() => setPeriod('week')}
            className={`${UI.button.base} ${period === 'week' ? UI.button.primary : UI.button.secondary}`}
          >
            <Calendar className='w-4 h-4' />
            Esta Semana
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`${UI.button.base} ${period === 'month' ? UI.button.primary : UI.button.secondary}`}
          >
            <CalendarDays className='w-4 h-4' />
            Este Mes
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

      {/* Reservation list grouped by class */}
      {groupedByClass.length === 0 ? (
        <div className={`${UI.card.base} px-6 py-16 text-center`}>
          {reservations.length === 0 ? (
            <>
              <ClipboardX
                className={`w-10 h-10 mx-auto mb-3 ${UI.text.muted}`}
              />
              <p className={`font-medium mb-1 ${UI.text.body}`}>
                Sin reservas aún
              </p>
              <p className={UI.text.soft}>
                Cuando las alumnas reserven clases aparecerán aquí.
              </p>
            </>
          ) : searchQuery.trim() ? (
            <>
              <SearchX className={`w-10 h-10 mx-auto mb-3 ${UI.text.muted}`} />
              <p className={`font-medium mb-1 ${UI.text.body}`}>
                Sin resultados
              </p>
              <p className={UI.text.soft}>
                No hay reservas que coincidan con «{searchQuery}».
              </p>
            </>
          ) : (
            <>
              <Users className={`w-10 h-10 mx-auto mb-3 ${UI.text.muted}`} />
              <p className={`font-medium mb-1 ${UI.text.body}`}>Sin reservas</p>
              <p className={UI.text.soft}>
                No hay reservas registradas para{' '}
                {period === 'week' ? 'esta semana' : 'este mes'}.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className='space-y-4'>
          {groupedByClass.map((group) => (
            <div
              key={group.scheduledClassId}
              className={UI.card.base}
            >
              <div className='px-4 py-3 bg-ui-input border-b border-ui-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1'>
                <div>
                  <h3 className='font-semibold text-ui-text'>
                    {group.classTitle}
                  </h3>
                  <p className={UI.text.soft}>
                    {group.classDate.toLocaleDateString('es-ES', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    a las{' '}
                    {group.classDate.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </p>
                </div>
                <span className={`text-sm font-medium ${UI.text.brand}`}>
                  {group.reservations.length} reservation
                  {group.reservations.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Student rows */}
              <div className='divide-y divide-ui-border-soft'>
                {group.reservations.map((r) => (
                  <div
                    key={r.id}
                    className='px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'
                  >
                    <div className='flex items-center gap-3 flex-1 min-w-0'>
                      <div className='w-8 h-8 rounded-full bg-brand/20 text-brand-light flex items-center justify-center text-sm font-bold shrink-0'>
                        {r.studentName.charAt(0)}
                      </div>
                      <div className='min-w-0'>
                        <p className='font-medium text-ui-text truncate'>
                          {r.studentName}
                        </p>
                        <p className={`${UI.text.soft} truncate`}>
                          {r.studentId}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 shrink-0'>
                      {statusBadge(r.status)}
                      <span className={UI.text.muted}>
                        {r.paymentMode === 'credit' ? 'Crédito' : 'Individual'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

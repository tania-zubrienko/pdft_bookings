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
} from 'lucide-react';

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
        return <CheckCircle2 className='w-4 h-4 text-green-600' />;
      case 'cancelled':
        return <XCircle className='w-4 h-4 text-red-500' />;
      default:
        return null;
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}
      >
        {statusIcon(status)}
        {labels[status] ?? status}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
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
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
          Reservas
        </h1>
        <p className='text-ui-text-soft	 mt-1'>
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
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'week'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Calendar className='w-4 h-4' />
            Esta Semana
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
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
      <p className='text-sm font-medium text-ui-text-soft	 mb-4'>
        {periodLabel}
      </p>

      {/* Stats row */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'>
        <div className='bg-white rounded-xl border border-gray-200 px-4 py-3'>
          <p className='text-2xl font-bold text-gray-900'>{stats.total}</p>
          <p className='text-xs text-ui-text-soft	'>Total Reservas</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 px-4 py-3'>
          <p className='text-2xl font-bold text-green-600'>{stats.confirmed}</p>
          <p className='text-xs text-ui-text-soft	'>Confirmadas</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 px-4 py-3'>
          <p className='text-2xl font-bold text-gray-900'>
            {stats.uniqueStudents}
          </p>
          <p className='text-xs text-ui-text-soft	'>Alumnas Únicas</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 px-4 py-3'>
          <p className='text-2xl font-bold text-gray-900'>
            {stats.uniqueClasses}
          </p>
          <p className='text-xs text-ui-text-soft	'>Clases</p>
        </div>
      </div>

      {/* Reservation list grouped by class */}
      {groupedByClass.length === 0 ? (
        <div className='bg-white rounded-xl border border-gray-200 px-6 py-12 text-center'>
          <Users className='w-10 h-10 text-gray-300 mx-auto mb-3' />
          <p className='text-ui-text-soft	'>
            No se encontraron reservas para{' '}
            {period === 'week' ? 'esta semana' : 'este mes'}.
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {groupedByClass.map((group) => (
            <div
              key={group.scheduledClassId}
              className='bg-white rounded-xl border border-gray-200 overflow-hidden'
            >
              <div className='px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1'>
                <div>
                  <h3 className='font-semibold text-gray-900'>
                    {group.classTitle}
                  </h3>
                  <p className='text-sm text-ui-text-soft	'>
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
                <span className='text-sm font-medium text-primary-600'>
                  {group.reservations.length} reservation
                  {group.reservations.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Student rows */}
              <div className='divide-y divide-gray-100'>
                {group.reservations.map((r) => (
                  <div
                    key={r.id}
                    className='px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'
                  >
                    <div className='flex items-center gap-3 flex-1 min-w-0'>
                      <div className='w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0'>
                        {r.studentName.charAt(0)}
                      </div>
                      <div className='min-w-0'>
                        <p className='font-medium text-gray-900 truncate'>
                          {r.studentName}
                        </p>
                        <p className='text-sm text-ui-text-soft	 truncate'>
                          {r.studentId}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 shrink-0'>
                      {statusBadge(r.status)}
                      <span className='text-xs text-gray-400'>
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

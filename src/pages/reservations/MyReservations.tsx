import { useEffect, useState } from 'react';
import { Reservation } from '../../types';
import Layout from '../../components/Layout/Layout';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScheduledClass } from '../../types';
import reservationService from '@/services/reservation.service';
import scheduleService from '@/services/schedule.service';
import { useAuth } from '@/contexts/AuthContext';
import UI from '@/styles';
import { formatDate } from '@/utils';

interface ReservationWithClass extends Reservation {
  scheduledClass?: ScheduledClass;
}

export default function MyReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ReservationWithClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      reservationService.getReservationsByStudent(user.uid),
      scheduleService.getAllScheduledClasses(),
    ]).then(([resData, classData]) => {
      const enriched = resData.map((r) => ({
        ...r,
        scheduledClass: classData.find((c) => c.id === r.scheduledClassId),
      }));
      setReservations(enriched);
      setLoading(false);
    });
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      case 'cancelled':
        return <XCircle className='w-5 h-5 text-red-600' />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return UI.badge.green;
      case 'cancelled':
        return UI.badge.red;
      default:
        return UI.badge.base;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={UI.loading.container}>
          <div className={UI.loading.spinner}></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='mb-8'>
        <h1 className={`${UI.text.heading} mb-2`}>Mis Reservas</h1>
        <p className={UI.text.soft}>
          Consulta y gestiona tus reservas de clases
        </p>
      </div>

      {reservations.length > 0 ? (
        <div className='space-y-4'>
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className='card p-6'
            >
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 '>
                    {getStatusIcon(reservation.status)}
                    <span className={getStatusColor(reservation.status)}>
                      {reservation.status === 'confirmed'
                        ? 'Confirmada'
                        : reservation.status === 'cancelled'
                          ? 'Cancelada'
                          : reservation.status}
                    </span>
                  </div>

                  <h3 className='text-lg font-semibold text-ui-text mb-2'>
                    {reservation.scheduledClass?.classTitle ?? 'Unknown Class'}
                  </h3>

                  <div className='flex flex-wrap gap-4 text-sm text-ui-text-soft	'>
                    {reservation.scheduledClass && (
                      <div className='flex items-center gap-1'>
                        <Calendar className='w-4 h-4' />
                        <span>
                          Clase: {formatDate(reservation.scheduledClass.date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex gap-2'>
                  <Link
                    to={`/classes/${reservation.scheduledClassId}`}
                    className='btn btn-secondary'
                  >
                    Ver Clase
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <Calendar className='w-16 h-16 text-ui-text-muted mx-auto mb-4' />
          <h3 className={`${UI.text.subheading} mb-2`}>
            Aún no tienes reservas
          </h3>
          <p className={`${UI.text.soft} mb-6`}>
            ¡Reserva tu primera clase de baile para empezar!
          </p>
          <Link
            to='/classes'
            className='btn btn-primary'
          >
            Explorar Clases
          </Link>
        </div>
      )}
    </Layout>
  );
}

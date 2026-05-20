import UI from '@/styles';
import { ReservationWithClass } from '@/types';
import { formatDate } from '@/utils';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReservationCard(reservation: ReservationWithClass) {
  const getStatusIcon = (status: string) => {
    if (status === 'confirmed')
      return <CheckCircle className='w-5 h-5 text-green-500' />;
    if (status === 'cancelled')
      return <XCircle className='w-5 h-5 text-red-500' />;
    return null;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'confirmed') return UI.badge.green;
    if (status === 'cancelled') return UI.badge.red;
    return UI.badge.base;
  };
  return (
    <div
      key={reservation.id}
      className='card p-6'
    >
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-1'>
            {getStatusIcon(reservation.status)}
            <span className={getStatusBadge(reservation.status)}>
              {reservation.status === 'confirmed'
                ? 'Confirmada'
                : reservation.status === 'cancelled'
                  ? 'Cancelada'
                  : reservation.status}
            </span>
          </div>
          <h3 className='text-lg font-semibold text-gray-100 mb-2'>
            {reservation.scheduledClass?.classTitle ?? 'Clase desconocida'}
          </h3>
          <div className='flex flex-wrap gap-4 text-sm text-ui-text-soft'>
            {reservation.scheduledClass && (
              <div className='flex items-center gap-1'>
                <Calendar className='w-4 h-4' />
                <span>
                  Clase: {formatDate(reservation.scheduledClass.date)}
                </span>
              </div>
            )}
            <div className='flex items-center gap-1'>
              <span>Reservada: {formatDate(reservation.createdAt)}</span>
            </div>
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
  );
}

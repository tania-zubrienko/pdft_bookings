import UI from '@/styles';
import { ReservationWithClass, ScheduledClass } from '@/types';
import { formatDateTime } from '@/utils';
import { CheckCircle, Circle, UserCheckIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ScheduledClassCard({
  scheduledClass,
  reservation,
  onCancel,
}: {
  scheduledClass: ScheduledClass;
  reservation?: ReservationWithClass;
  onCancel: (v: ReservationWithClass) => void;
}) {
  // class ID
  // Class name
  // Reservation?

  const getStatusIcon = () => {
    const status = reservation?.status;
    if (status === 'confirmed')
      return <CheckCircle className='w-5 h-5 text-green-500' />;

    return <Circle className='w-5 h-5 text-blue-500' />;
  };

  const getStatusBadge = () => {
    const status = reservation?.status;
    if (status === 'confirmed') return UI.badge.green;
    return UI.badge.blue;
  };

  const getStatusName = () => {
    const status = reservation?.status;
    if (status === 'confirmed') return 'Ya reservada';
    return 'Disponible';
  };

  const isPassed = () => scheduledClass.date < new Date();

  return (
    <div
      key={'id'}
      className='card p-6'
    >
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-3 mb-1'>
            {getStatusIcon()}
            <span className={getStatusBadge()}>{getStatusName()}</span>
          </div>
          <h3 className='text-lg font-semibold text-gray-100 mb-2'>
            {scheduledClass.classTitle}
          </h3>
          <div className={`flex gap-4 ${UI.text.label}`}>
            <span>
              {formatDateTime(scheduledClass.date)} (
              {scheduledClass.instructorName})
            </span>
            <span className='flex gap-2'>
              <UserCheckIcon className='w-4 h-4' />{' '}
              {scheduledClass.enrolledCount}/{scheduledClass.capacity}
            </span>
          </div>
        </div>
        {/*If reservation exists */}
        <div className='flex gap-2'>
          {!!reservation &&
            reservation.status !== 'cancelled' &&
            !isPassed() && (
              <button
                className={`text-sm ${UI.button.danger}`}
                onClick={() => {
                  onCancel(reservation!);
                }}
              >
                Cancelar
              </button>
            )}
          <Link
            to={`/classes/${scheduledClass.id}`}
            className={`text-sm ${UI.button.primary}`}
          >
            Ver Clase
          </Link>{' '}
        </div>
      </div>
    </div>
  );
}

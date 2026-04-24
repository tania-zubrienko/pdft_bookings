import { Link } from 'react-router-dom';
import { Clock, Users } from 'lucide-react';
import { ScheduledClass } from '../../types';
import UI, { getClassAccent } from '@/lib/styles';

interface ClassCardProps {
  classData: ScheduledClass;
}

export default function ClassCard({ classData }: ClassCardProps) {
  const isFull = classData.enrolledCount >= classData.capacity;
  const spotsLeft = classData.capacity - classData.enrolledCount;
  const accentBarClass = getClassAccent(classData.classTitle);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  return (
    <div className={`${UI.card.interactive} overflow-hidden relative`}>
      {/* Colored accent bar on the left */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${accentBarClass}`}
      ></div>

      <div className='p-4 flex flex-col gap-3 pl-5'>
        {/* Title + time row */}
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <Link
              to={`/classes/${classData.id}`}
              className='text-base font-semibold text-gray-100 hover:text-primary-400 transition-colors line-clamp-1'
            >
              {classData.classTitle}
            </Link>
            <p className='text-sm text-gray-400 mt-0.5'>
              {classData.instructorName}
            </p>
          </div>
          <span className='shrink-0 text-sm font-medium text-gray-300 flex items-center gap-1'>
            <Clock className='w-4 h-4' />
            {formatTime(classData.date)}
          </span>
        </div>

        {/* Info row */}
        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400'>
          <span className='flex items-center gap-1'>
            <Users className='w-4 h-4' />
            {classData.enrolledCount} inscritos
          </span>
          <span
            className={`font-medium ${isFull ? UI.status.full : spotsLeft <= 3 ? UI.status.limited : UI.status.available}`}
          >
            {isFull
              ? 'Completa'
              : `${spotsLeft} plaza${spotsLeft !== 1 ? 's' : ''} libre${spotsLeft !== 1 ? 's' : ''}`}
          </span>
          <span className='text-gray-400'>{classData.duration} min</span>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end pt-2 border-t border-gray-800'>
          <Link
            to={`/classes/${classData.id}`}
            className={`btn text-sm ${isFull ? 'btn-secondary cursor-not-allowed pointer-events-none' : 'btn-primary'}`}
          >
            {isFull ? 'Completa' : 'Reservar'}
          </Link>
        </div>
      </div>
    </div>
  );
}

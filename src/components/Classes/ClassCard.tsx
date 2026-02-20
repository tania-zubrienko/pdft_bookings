import { Link } from 'react-router-dom';
import { Clock, Users, MapPin } from 'lucide-react';
import { Class } from '../../types';

interface ClassCardProps {
  classData: Class;
}

export default function ClassCard({ classData }: ClassCardProps) {
  const isFull = classData.enrolledCount >= classData.capacity;
  const spotsLeft = classData.capacity - classData.enrolledCount;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  return (
    <div className='bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden'>
      <div className='p-4 flex flex-col gap-3'>
        {/* Title + time row */}
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <Link
              to={`/classes/${classData.id}`}
              className='text-base font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-1'
            >
              {classData.title}
            </Link>
            <p className='text-sm text-gray-500 mt-0.5'>
              {classData.instructorName}
            </p>
          </div>
          <span className='shrink-0 text-sm font-medium text-gray-600 flex items-center gap-1'>
            <Clock className='w-4 h-4' />
            {formatTime(classData.scheduledAt)}
          </span>
        </div>

        {/* Info row */}
        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500'>
          <span className='flex items-center gap-1'>
            <Users className='w-4 h-4' />
            {classData.enrolledCount} signed up
          </span>
          <span
            className={`font-medium ${isFull ? 'text-red-600' : spotsLeft <= 3 ? 'text-amber-600' : 'text-green-600'}`}
          >
            {isFull
              ? 'Full'
              : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
          </span>
          {classData.location && (
            <span className='flex items-center gap-1'>
              <MapPin className='w-4 h-4' />
              {classData.location}
            </span>
          )}
          <span className='text-gray-400'>{classData.duration} min</span>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end pt-2 border-t border-gray-100'>
          <Link
            to={`/classes/${classData.id}`}
            className={`btn text-sm ${isFull ? 'btn-secondary cursor-not-allowed pointer-events-none' : 'btn-primary'}`}
          >
            {isFull ? 'Full' : 'Reserve'}
          </Link>
        </div>
      </div>
    </div>
  );
}

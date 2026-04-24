import { Link } from 'react-router-dom';
import { Clock, Users } from 'lucide-react';
import { AppUser, ScheduledClass } from '../../types';
import UI, { getClassAccent } from '@/styles';

interface ClassCardProps {
  classData: ScheduledClass;
  students?: AppUser[];
}

export default function ClassCard({
  classData,
  students = [],
}: ClassCardProps) {
  const isFull = classData.enrolledCount >= classData.capacity;
  const spotsLeft = classData.capacity - classData.enrolledCount;
  const accentBarClass = getClassAccent(classData.classTitle);
  const enrolledStudents = students.filter((s) =>
    classData.studentIds.includes(s.id),
  );

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

        {/* Enrolled student avatars */}
        {enrolledStudents.length > 0 && (
          <div className='flex items-center gap-1'>
            {enrolledStudents.slice(0, 8).map((student) =>
              student.avatar ? (
                <img
                  key={student.id}
                  src={student.avatar}
                  alt={student.name}
                  title={student.name}
                  className='w-7 h-7 rounded-full object-cover ring-1 ring-gray-800'
                />
              ) : (
                <div
                  key={student.id}
                  title={student.name}
                  className='w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center ring-1 ring-gray-800 flex-shrink-0'
                >
                  <span className='text-white text-xs font-medium'>
                    {student.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              ),
            )}
            {enrolledStudents.length > 8 && (
              <span className='text-xs text-gray-500 ml-1'>
                +{enrolledStudents.length - 8}
              </span>
            )}
          </div>
        )}

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

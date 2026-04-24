import UI, { getClassAccent } from '@/lib/styles';
import { ScheduledClass } from '@/types';
import {
  Clock,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';

interface AdminClassCardProps {
  dayNum: number;
  dayDate: Date;
  dayClasses: ScheduledClass[];
  isCurrentDay: boolean;
  openAddClass: (date: Date) => void;
  openEditClass: (cls: ScheduledClass) => void;
  cancelClass: (id: string) => void;
  restoreClass: (id: string) => void;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function AdminClassCard({
  dayNum,
  dayDate,
  dayClasses,
  isCurrentDay,
  openAddClass,
  openEditClass,
  cancelClass,
  restoreClass,
}: AdminClassCardProps) {
  return (
    <div
      key={dayNum}
      //   className='bg-p rounded-xl border border-gray-200 overflow-hidden'
      className={UI.stats.card}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-550`}
      >
        <h3 className={`${UI.text.subheading} flex items-center gap-2`}>
          {DAY_NAMES[dayNum]}
          <span className='font-normal text-ui-text-soft'>
            {dayDate.toLocaleDateString('es-ES', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {isCurrentDay && (
            // <span className='ml-2 text-xs bg-primary-600 text-white px-3 py-1 rounded-full'>
            //   Hoy
            // </span>
            <span className={`${UI.badge.blue} ml-3`}>Hoy</span>
          )}
        </h3>
        <button
          onClick={() => openAddClass(dayDate)}
          className='flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium'
        >
          <Plus className='w-4 h-4' />
          Añadir
        </button>
      </div>

      {dayClasses.length === 0 ? (
        <p className='px-4 py-4 text-sm text-gray-400 italic'>
          Sin clases programadas
        </p>
      ) : (
        <div className='divide-y divide-white/10'>
          {dayClasses.map((cls) => {
            const isCancelled = cls.status === 'cancelled';
            const accent = getClassAccent(cls.classTitle);
            return (
              <div
                key={cls.id}
                className={`relative pl-5 pr-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${
                  isCancelled ? 'opacity-50' : UI.card.rowHover
                } transition-colors`}
              >
                {/* Vertical accent bar */}
                <div
                  className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${accent}`}
                />
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <p
                      className={`font-medium ${isCancelled ? UI.text.error : UI.text.body}`}
                    >
                      {cls.classTitle}
                    </p>
                    {isCancelled && (
                      <span className={UI.badge.red}>Cancelada</span>
                    )}
                  </div>
                  <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-ui-text-soft	 mt-1'>
                    <span className='flex items-center gap-1'>
                      <Clock className='w-3.5 h-3.5' />
                      {cls.date.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}{' '}
                      · {cls.duration}min
                    </span>
                    <span className='flex items-center gap-1'>
                      <UserCog className='w-3.5 h-3.5' />
                      {cls.instructorName}
                    </span>
                    <span className='flex items-center gap-1'>
                      <Users className='w-3.5 h-3.5' />
                      {cls.enrolledCount}/{cls.capacity}
                    </span>
                  </div>
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                  <button
                    onClick={() => openEditClass(cls)}
                    className={UI.button.icon}
                    title='Edit'
                  >
                    <Pencil className='w-4 h-4' />
                  </button>
                  {cls.status === 'active' ? (
                    <button
                      onClick={() => cancelClass(cls.id)}
                      className='p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors'
                      title='Cancelar clase'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  ) : (
                    <button
                      onClick={() => restoreClass(cls.id)}
                      className={UI.button.ghost}
                      //   className='flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1'
                      title='Restaurar clase'
                    >
                      <RotateCcw className='w-3.5 h-3.5' />
                      Restaurar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

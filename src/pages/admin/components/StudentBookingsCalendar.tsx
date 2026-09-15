import { useMemo, useState } from 'react';
import CalendarView from '@/components/Calendar/CalendarView';
import UI from '@/styles';
import { ReservationWithClass } from '@/types';

interface StudentBookingsCalendarProps {
    studentBookings: ReservationWithClass[];
}

export default function StudentBookingsCalendar({
    studentBookings,
}: StudentBookingsCalendarProps) {
    const [calendarViewMode, setCalendarViewMode] = useState<'week' | 'month'>(
        'month',
    );
    const [calendarCurrentDate, setCalendarCurrentDate] = useState(new Date());
    const [calendarSelectedDate, setCalendarSelectedDate] =
        useState<Date | null>(null);

    const studentClasses = useMemo(
        () => studentBookings.map((b) => b.scheduledClass).filter(Boolean),
        [studentBookings],
    );

    const studentClassIds = useMemo(
        () => new Set(studentClasses.map((c) => c.id)),
        [studentClasses],
    );

    const bookingsForSelectedDay = useMemo(() => {
        if (!calendarSelectedDate) return [];
        return studentBookings
            .filter((b) => {
                const date = b.scheduledClass?.date;
                return (
                    !!date &&
                    date.getFullYear() === calendarSelectedDate.getFullYear() &&
                    date.getMonth() === calendarSelectedDate.getMonth() &&
                    date.getDate() === calendarSelectedDate.getDate()
                );
            })
            .sort(
                (a, b) =>
                    a.scheduledClass.date.getTime() - b.scheduledClass.date.getTime(),
            );
    }, [studentBookings, calendarSelectedDate]);

    return (
        <>
            <CalendarView
                classes={studentClasses}
                viewMode={calendarViewMode}
                currentDate={calendarCurrentDate}
                selectedDate={calendarSelectedDate}
                onSelectDate={setCalendarSelectedDate}
                onChangeDate={setCalendarCurrentDate}
                onChangeViewMode={setCalendarViewMode}
                reservedClassIds={studentClassIds}
            />

            {calendarSelectedDate && (
                <div className='mt-4'>
                    <p className='text-sm font-medium text-gray-300 mb-2'>
                        {calendarSelectedDate.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })}
                    </p>
                    {bookingsForSelectedDay.length === 0 ? (
                        <p className='text-gray-400 text-sm'>
                            No hay reservas de la alumna en este día.
                        </p>
                    ) : (
                        <div className='space-y-2'>
                            {bookingsForSelectedDay.map((booking) => (
                                <div
                                    key={booking.id}
                                    className='rounded-lg border border-gray-700 bg-gray-800 p-3 flex items-center justify-between gap-3 text-sm text-gray-200'
                                >
                                    <div>
                                        <p className='font-medium'>
                                            {booking.scheduledClass.classTitle}
                                        </p>
                                        <p className='text-gray-400'>
                                            {booking.scheduledClass.date.toLocaleTimeString(
                                                'es-ES',
                                                { hour: '2-digit', minute: '2-digit' },
                                            )}{' '}
                                            · {booking.scheduledClass.instructorName}
                                        </p>
                                    </div>
                                    <span
                                        className={
                                            booking.status === 'cancelled'
                                                ? UI.badge.red
                                                : UI.badge.green
                                        }
                                    >
                                        {booking.status === 'cancelled' ? 'Cancelada' : 'Confirmada'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

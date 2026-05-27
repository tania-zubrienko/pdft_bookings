import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';
import CalendarView from '@/components/Calendar/CalendarView';
import BookingListButton from '@/pages/reservations/components/BookingListButton';
import ScheduledClassCard from '@/pages/classes/components/SchedulledClassCard';
import { ReservationWithClass, ScheduledClass } from '@/types';
import UI from '@/styles';

type CalendarViewMode = 'week' | 'month';

interface ReservationsTabProps {
  reservationsLoading: boolean;
  reservations: ReservationWithClass[];
  allScheduledClasses: ScheduledClass[];
  calendarViewMode: CalendarViewMode;
  currentDate: Date;
  selectedDate: Date | null;
  reservedClassIds: Set<string>;
  onSelectDate: (date: Date | null) => void;
  onChangeDate: (date: Date) => void;
  onChangeViewMode: (mode: CalendarViewMode) => void;
  onCancel: (reservation: ReservationWithClass) => void;
}

export default function ReservationsTab({
  reservationsLoading,
  reservations,
  allScheduledClasses,
  calendarViewMode,
  currentDate,
  selectedDate,
  reservedClassIds,
  onSelectDate,
  onChangeDate,
  onChangeViewMode,
  onCancel,
}: ReservationsTabProps) {
  const [pastReservationsOpen, setPastReservationsOpen] = useState(false);
  const [activeReservationsOpen, setActiveReservationsOpen] = useState(false);

  const activeReservations = useMemo(() => {
    return reservations.filter(
      (reservation) =>
        !!reservation.scheduledClass?.date &&
        reservation.status !== 'cancelled' &&
        reservation.scheduledClass.date >= new Date(),
    );
  }, [reservations]);

  const pastReservations = useMemo(() => {
    return reservations.filter(
      (reservation) =>
        !!reservation.scheduledClass?.date &&
        reservation.status !== 'cancelled' &&
        reservation.scheduledClass.date < new Date(),
    );
  }, [reservations]);

  const classesForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];

    return allScheduledClasses
      .filter((scheduledClass) => {
        const date = scheduledClass.date;
        return (
          date.getFullYear() === selectedDate.getFullYear() &&
          date.getMonth() === selectedDate.getMonth() &&
          date.getDate() === selectedDate.getDate()
        );
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allScheduledClasses, selectedDate]);

  if (reservationsLoading) {
    return (
      <div className={UI.loading.container}>
        <div className={UI.loading.spinner} />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <CalendarView
        classes={allScheduledClasses}
        viewMode={calendarViewMode}
        currentDate={currentDate}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        onChangeDate={onChangeDate}
        onChangeViewMode={onChangeViewMode}
        reservedClassIds={reservedClassIds}
      />

      {selectedDate && (
        <div>
          <p className={`${UI.text.label} mb-3`}>
            {selectedDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          {classesForSelectedDay.length === 0 ? (
            <p className={UI.text.soft}>No hay clases este dia.</p>
          ) : (
            <div className='space-y-3'>
              {classesForSelectedDay.map((scheduledClass) => {
                const reservation = reservations.find(
                  (item) => item.scheduledClassId === scheduledClass.id,
                );

                return (
                  <ScheduledClassCard
                    key={scheduledClass.id}
                    scheduledClass={scheduledClass}
                    onCancel={onCancel}
                    reservation={reservation}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {reservations.length > 0 && (
        <div className='space-y-4'>
          <BookingListButton
            length={activeReservations.length}
            onClick={() => setActiveReservationsOpen((value) => !value)}
            isOpen={activeReservationsOpen}
            name='Reservas en curso'
          />

          {activeReservationsOpen &&
            activeReservations.map((reservation) => (
              <ScheduledClassCard
                key={reservation.id}
                reservation={reservation}
                onCancel={onCancel}
                scheduledClass={
                  allScheduledClasses.find(
                    (scheduledClass) =>
                      scheduledClass.id === reservation.scheduledClassId,
                  )!
                }
              />
            ))}

          <BookingListButton
            length={pastReservations.length}
            onClick={() => setPastReservationsOpen((value) => !value)}
            isOpen={pastReservationsOpen}
            name='Reservas finalizadas'
          />

          {pastReservationsOpen && (
            <div className='space-y-4'>
              {pastReservations.map((reservation) => (
                <ScheduledClassCard
                  key={reservation.id}
                  reservation={reservation}
                  onCancel={onCancel}
                  scheduledClass={
                    allScheduledClasses.find(
                      (scheduledClass) =>
                        scheduledClass.id === reservation.scheduledClassId,
                    )!
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {reservations.length === 0 && (
        <div className='text-center py-12'>
          <Calendar className='w-16 h-16 text-ui-text-muted mx-auto mb-4' />
          <h3 className={`${UI.text.subheading} mb-2`}>
            Aun no tienes reservas
          </h3>
          <p className={`${UI.text.soft} mb-6`}>
            Reserva tu primera clase de baile para empezar.
          </p>
          <Link
            to='/classes'
            className='btn btn-primary'
          >
            Explorar Clases
          </Link>
        </div>
      )}
    </div>
  );
}

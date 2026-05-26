import { useEffect, useMemo, useState } from 'react';
import { AppUser, ScheduledClass } from '../../types';
import ClassCard from '../../components/Classes/ClassCard';
import CalendarView from '../../components/Calendar/CalendarView';
import Layout from '../../components/Layout/Layout';
import { Calendar } from 'lucide-react';
import scheduleService from '@/services/schedule.service';
import userService from '@/services/user.service';
import UI from '@/styles';

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function ClassList() {
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    Promise.all([
      scheduleService.getAllScheduledClasses(),
      userService.getStudents(),
    ]).then(([classData, studentData]) => {
      setClasses(classData);
      setStudents(studentData);
      setLoading(false);
    });
  }, []);

  // Classes for the selected day
  const classesForDay = useMemo(() => {
    if (!selectedDate) return [];
    return classes
      .filter((c) => isSameDay(c.date, selectedDate))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [classes, selectedDate]);

  // Format selected date for the heading
  const selectedDayLabel = selectedDate
    ? selectedDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null;

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
      {/* Header */}
      <div className='mb-4 sm:mb-6'>
        <h1 className={`${UI.text.heading} mb-1`}>Horario de Clases</h1>
        <p className={UI.text.soft}>
          Selecciona un día para ver las clases disponibles
        </p>
      </div>

      {/* Calendar */}
      <CalendarView
        classes={classes}
        viewMode={viewMode}
        currentDate={currentDate}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onChangeDate={setCurrentDate}
        onChangeViewMode={setViewMode}
      />

      {/* Classes for selected day */}
      {selectedDate && (
        <div className='mt-8'>
          <h2 className={`${UI.text.subheading} mb-4`}>{selectedDayLabel}</h2>

          {classesForDay.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {classesForDay.map((classData) => (
                <ClassCard
                  key={classData.id}
                  classData={classData}
                  students={students}
                />
              ))}
            </div>
          ) : (
            <div className='text-center py-10 card'>
              <Calendar className='w-12 h-12 text-ui-text-muted mx-auto mb-3' />
              <p className={UI.text.soft}>
                No hay clases programadas para este día
              </p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

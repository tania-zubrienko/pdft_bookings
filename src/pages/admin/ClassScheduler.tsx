import { useEffect, useState, useMemo } from 'react';

import { ClassDefinition, User, ScheduledClass } from '../../types';
import AdminLayout from '../../components/Layout/AdminLayout';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  UserCog,
  Clock,
  Users,
  X,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { duplicateWeek, getClassDefinitions, getInstructors, getScheduledClasses } from '@/lib/mockData';

const DAY_NAMES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

// ─── Helpers ──────────────────────────────────────────────────────────

/** Monday-based start of week */
function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const s = new Date(d);
  s.setDate(diff);
  s.setHours(0, 0, 0, 0);
  return s;
}

function endOfWeek(mondayStart: Date): Date {
  const e = new Date(mondayStart);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function weekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`;
}

// ──────────────────────────────────────────────────────────────────────

export default function ClassScheduler() {
  const [allClasses, setAllClasses] = useState<ScheduledClass[]>([]);
  const [classDefinitions, setClassDefinitions] = useState<ClassDefinition[]>(
    [],
  );
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Week navigation — always tracks the Monday of the viewed week
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  // Modal state
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([
      getScheduledClasses(),
      getInstructors(),
      getClassDefinitions(),
    ]).then(([sc, insts, defs]) => {
      setAllClasses(sc);
      setInstructors(insts);
      setClassDefinitions(defs);
      setLoading(false);
    });
  }, []);

  // Classes for the currently viewed week
  const weekEnd = endOfWeek(weekStart);

  const weekClasses = useMemo(() => {
    return allClasses
      .filter((c) => c.date >= weekStart && c.date <= weekEnd)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allClasses, weekStart, weekEnd]);

  // Group by day-of-week (Mon → Sun order: 1,2,3,4,5,6,0)
  const classesGroupedByDay = useMemo(() => {
    const groups: Record<number, ScheduledClass[]> = {};
    for (let d = 0; d < 7; d++) groups[d] = [];
    weekClasses.forEach((c) => groups[c.date.getDay()].push(c));
    return groups;
  }, [weekClasses]);

  // Stats
  const activeCount = weekClasses.filter((c) => c.status === 'active').length;
  const cancelledCount = weekClasses.filter(
    (c) => c.status === 'cancelled',
  ).length;

  // ─── Navigation ─────────────────────────────────────────────────────

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToCurrentWeek = () => {
    setWeekStart(startOfWeek(new Date()));
  };

  // ─── Duplicate week ─────────────────────────────────────────────────

  const handleDuplicateWeek = () => {
    const activeInWeek = weekClasses.filter((c) => c.status === 'active');
    if (activeInWeek.length === 0) return;
    const newClasses = duplicateWeek(activeInWeek, 1);
    setAllClasses((prev) => [...prev, ...newClasses]);
    // Navigate to the next week
    nextWeek();
  };

  // ─── Add / Edit / Cancel / Restore ──────────────────────────────────

  const daysInCurrentWeek = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const openAddClass = (dayDate?: Date) => {
    const targetDate = dayDate ?? daysInCurrentWeek[0];
    const firstDef = classDefinitions[0];
    const firstInst = instructors[0];

    setEditingClass({
      id: `sc-new-${Date.now()}`,
      classId: firstDef?.id ?? '',
      instructorId: firstInst?.id ?? '',
      date: new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        18,
        0,
        0,
      ),
      duration: firstDef?.defaultDuration ?? 60,
      capacity: firstDef?.defaultCapacity ?? 20,
      status: 'active',
      classTitle: firstDef?.title ?? '',
      instructorName: firstInst?.name ?? '',
      enrolledCount: 0,
      studentIds: [],
    });
    setShowModal(true);
  };

  const openEditClass = (cls: ScheduledClass) => {
    setEditingClass({ ...cls });
    setShowModal(true);
  };

  const saveClass = () => {
    if (!editingClass || !editingClass.classTitle) return;
    setAllClasses((prev) => {
      const exists = prev.find((c) => c.id === editingClass.id);
      if (exists) {
        return prev.map((c) => (c.id === editingClass.id ? editingClass : c));
      }
      return [...prev, editingClass];
    });
    setShowModal(false);
    setEditingClass(null);
  };

  const cancelClass = (id: string) => {
    setAllClasses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'cancelled' as const } : c,
      ),
    );
  };

  const restoreClass = (id: string) => {
    setAllClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'active' as const } : c)),
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold text-ui-text-inverse'>
          Horario de Clases
        </h1>
        <p className='text-ui-text-soft	 mt-1'>
          Gestiona las clases semanales — duplica cualquier semana para
          planificar
        </p>
      </div>

      {/* Week navigation */}
      <div className='flex flex-col sm:flex-row items-center justify-between gap-3 mb-6'>
        <div className='flex items-center gap-2'>
          <button
            onClick={prevWeek}
            className='p-2 rounded-lg hover:bg-gray-200 transition-colors'
            aria-label='Previous week'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>
          <h2 className='text-lg sm:text-xl font-bold text-ui-text-muted min-w-[220px] text-center'>
            {weekLabel(weekStart)}
          </h2>
          <button
            onClick={nextWeek}
            className='p-2 rounded-lg hover:bg-gray-200 transition-colors'
            aria-label='Next week'
          >
            <ChevronRight className='w-5 h-5' />
          </button>
          <button
            onClick={goToCurrentWeek}
            className='ml-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors'
          >
            Esta Semana
          </button>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={() => openAddClass()}
            className='btn btn-outline text-sm flex items-center gap-1'
          >
            <Plus className='w-4 h-4' />
            Añadir Clase
          </button>
          <button
            onClick={handleDuplicateWeek}
            disabled={activeCount === 0}
            className='btn btn-primary text-sm flex items-center gap-1'
            title='Copiar las clases de esta semana a la siguiente (inscripciones reiniciadas)'
          >
            <Copy className='w-4 h-4' />
            Duplicar a Siguiente Semana
          </button>
        </div>
      </div>

      {/* Stats */}
      <p className='text-sm text-ui-text-soft	 mb-4'>
        {activeCount} clase{activeCount !== 1 ? 's' : ''} activa
        {activeCount !== 1 ? 's' : ''}
        {cancelledCount > 0 &&
          ` · ${cancelledCount} cancelada${cancelledCount !== 1 ? 's' : ''}`}
      </p>

      {/* Day-by-day schedule */}
      <div className='space-y-4'>
        {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
          const dayDate = daysInCurrentWeek[dayNum === 0 ? 6 : dayNum - 1];
          const isCurrentDay = isSameDay(dayDate, new Date());
          const dayClasses = classesGroupedByDay[dayNum];

          return (
            <div
              key={dayNum}
              className='bg-white rounded-xl border border-gray-200 overflow-hidden'
            >
              <div
                className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 ${isCurrentDay ? 'bg-primary-50' : 'bg-gray-50'
                  }`}
              >
                <h3 className='font-semibold text-gray-900'>
                  {DAY_NAMES[dayNum]}{' '}
                  <span className='font-normal text-ui-text-soft	'>
                    {dayDate.toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {isCurrentDay && (
                    <span className='ml-2 text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full'>
                      Hoy
                    </span>
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
                <div className='divide-y divide-gray-100'>
                  {dayClasses.map((cls) => {
                    const isCancelled = cls.status === 'cancelled';
                    return (
                      <div
                        key={cls.id}
                        className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${isCancelled ? 'opacity-50' : 'hover:bg-gray-50'
                          } transition-colors`}
                      >
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <p
                              className={`font-medium ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                            >
                              {cls.classTitle}
                            </p>
                            {isCancelled && (
                              <span className='text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium'>
                                Cancelada
                              </span>
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
                            className='p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors'
                            title='Edit'
                          >
                            <UserCog className='w-4 h-4' />
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
                              className='flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1'
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
        })}
      </div>

      {/* ─────── CLASS EDITOR MODAL ─────── */}
      {showModal && editingClass && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
              <h3 className='text-lg font-bold text-gray-900'>
                {allClasses.find((c) => c.id === editingClass.id)
                  ? 'Editar Clase'
                  : 'Añadir Clase'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingClass(null);
                }}
                className='p-1 rounded-lg hover:bg-gray-100'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='px-6 py-4 space-y-4'>
              {/* Class Definition picker */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Tipo de Clase
                </label>
                <select
                  value={editingClass.classId}
                  onChange={(e) => {
                    const def = classDefinitions.find(
                      (d) => d.id === e.target.value,
                    );
                    if (def) {
                      setEditingClass({
                        ...editingClass,
                        classId: def.id,
                        classTitle: def.title,
                        duration: def.defaultDuration,
                        capacity: def.defaultCapacity,
                      });
                    }
                  }}
                  className='input'
                >
                  {classDefinitions
                    .filter((d) => d.active)
                    .map((def) => (
                      <option
                        key={def.id}
                        value={def.id}
                      >
                        {def.title}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date + Time */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Fecha
                  </label>
                  <input
                    type='date'
                    value={editingClass.date.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const d = new Date(e.target.value + 'T00:00:00');
                      d.setHours(
                        editingClass.date.getHours(),
                        editingClass.date.getMinutes(),
                      );
                      setEditingClass({ ...editingClass, date: d });
                    }}
                    className='input'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Hora
                  </label>
                  <input
                    type='time'
                    value={`${String(editingClass.date.getHours()).padStart(2, '0')}:${String(editingClass.date.getMinutes()).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      const d = new Date(editingClass.date);
                      d.setHours(h, m, 0, 0);
                      setEditingClass({ ...editingClass, date: d });
                    }}
                    className='input'
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Duración (min)
                </label>
                <input
                  type='number'
                  value={editingClass.duration}
                  onChange={(e) =>
                    setEditingClass({
                      ...editingClass,
                      duration: Number(e.target.value),
                    })
                  }
                  className='input'
                  min={15}
                  step={15}
                />
              </div>

              {/* User */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Instructora
                </label>
                <select
                  value={editingClass.instructorId}
                  onChange={(e) => {
                    const inst = instructors.find(
                      (i) => i.id === e.target.value,
                    );
                    setEditingClass({
                      ...editingClass,
                      instructorId: e.target.value,
                      instructorName: inst?.name ?? '',
                    });
                  }}
                  className='input'
                >
                  {instructors
                    .filter((i) => i.active)
                    .map((inst) => (
                      <option
                        key={inst.id}
                        value={inst.id}
                      >
                        {inst.name} — {inst.specialties.join(', ')}
                      </option>
                    ))}
                </select>
              </div>

              {/* Capacity */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Capacidad
                </label>
                <input
                  type='number'
                  value={editingClass.capacity}
                  onChange={(e) =>
                    setEditingClass({
                      ...editingClass,
                      capacity: Number(e.target.value),
                    })
                  }
                  className='input'
                  min={1}
                />
              </div>
            </div>

            <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200'>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingClass(null);
                }}
                className='btn btn-secondary'
              >
                Cancelar
              </button>
              <button
                onClick={saveClass}
                disabled={!editingClass.classTitle}
                className='btn btn-primary flex items-center gap-1'
              >
                <Save className='w-4 h-4' />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

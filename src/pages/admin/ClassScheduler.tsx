import { useEffect, useState, useMemo } from 'react';

import { ClassDefinition, AppUser, ScheduledClass } from '../../types';
import AdminLayout from '../../components/Layout/AdminLayout';
import { ChevronLeft, ChevronRight, Plus, Save, X, Copy } from 'lucide-react';
import scheduleService from '@/services/schedule.service';
import classDefinitionService from '@/services/class-definition.service';
import userService from '@/services/user.service';
import UI from '@/styles';
import AdminClassCard from './components/AdminClassCard';

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
  const [instructors, setInstructors] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Week navigation — always tracks the Monday of the viewed week
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  // Modal state
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([
      scheduleService.getAllScheduledClasses(),
      userService.getInstructors(),
      classDefinitionService.getAllClassDefinitions(),
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

  const handleDuplicateWeek = async () => {
    const activeInWeek = weekClasses.filter((c) => c.status === 'active');
    if (activeInWeek.length === 0) return;
    await scheduleService.duplicateWeek(activeInWeek, 1);
    const refreshed = await scheduleService.getAllScheduledClasses();
    setAllClasses(refreshed);
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

  const saveClass = async () => {
    if (!editingClass || !editingClass.classTitle) return;
    const { id, ...data } = editingClass;
    await scheduleService.setScheduledClass(id, data);
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

  const cancelClass = async (id: string) => {
    await scheduleService.cancelScheduledClass(id);
    setAllClasses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'cancelled' as const } : c,
      ),
    );
  };

  const restoreClass = async (id: string) => {
    await scheduleService.activateScheduledClass(id);
    setAllClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'active' as const } : c)),
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-brand'></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='mb-6'>
        <h1 className={UI.text.heading}>Horario de Clases</h1>
        <p className={UI.text.headingDescription}>
          Gestiona las clases semanales — duplica cualquier semana para
          planificar
        </p>
      </div>

      {/* Week navigation */}
      <div className='flex flex-col sm:flex-row items-center justify-between gap-3 mb-6'>
        <div className='flex items-center gap-2'>
          <button
            onClick={prevWeek}
            className='p-2 rounded-lg hover:bg-ui-hover transition-colors'
            aria-label='Previous week'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>
          <h2
            className={`${UI.text.subheading} text-ui-text-muted min-w-[220px] text-center`}
          >
            {weekLabel(weekStart)}
          </h2>
          <button
            onClick={nextWeek}
            className='p-2 rounded-lg hover:bg-ui-hover transition-colors'
            aria-label='Next week'
          >
            <ChevronRight className='w-5 h-5' />
          </button>
          <button
            onClick={goToCurrentWeek}
            className={`${UI.button.base} ${UI.button.primary}`}
          >
            Esta Semana
          </button>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={() => openAddClass()}
            className={UI.button.outline}
          >
            <Plus className='w-4 h-4' />
            Añadir Clase
          </button>
          <button
            onClick={handleDuplicateWeek}
            disabled={activeCount === 0}
            className={`${UI.button.base} ${UI.button.primary}`}
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

          return AdminClassCard({
            dayNum,
            dayDate,
            dayClasses,
            isCurrentDay,
            openAddClass,
            openEditClass,
            cancelClass,
            restoreClass,
          });
        })}
      </div>

      {/* ─────── CLASS EDITOR MODAL ─────── */}
      {showModal && editingClass && (
        <div className={UI.modal.backdrop}>
          <div className={UI.card.modal}>
            <div className={UI.card.modalHeader}>
              <h3 className={UI.text.subheading}>
                {allClasses.find((c) => c.id === editingClass.id)
                  ? 'Editar Clase'
                  : 'Añadir Clase'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingClass(null);
                }}
                className={UI.button.ghost}
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className={UI.card.modalBody}>
              {/* Class Definition picker */}
              <div>
                <label className={UI.text.soft}>Tipo de Clase</label>
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
                  className={UI.form.select}
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
              <div className='grid grid-cols-2 gap-4 '>
                <div>
                  <label className={UI.text.soft}>Fecha</label>
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
                    className={UI.form.input}
                  />
                </div>
                <div>
                  <label className={UI.text.soft}>Hora</label>
                  <input
                    type='time'
                    value={`${String(editingClass.date.getHours()).padStart(2, '0')}:${String(editingClass.date.getMinutes()).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      const d = new Date(editingClass.date);
                      d.setHours(h, m, 0, 0);
                      setEditingClass({ ...editingClass, date: d });
                    }}
                    className={UI.form.input}
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className={UI.text.soft}>Duración (min)</label>
                <input
                  type='number'
                  value={editingClass.duration}
                  onChange={(e) =>
                    setEditingClass({
                      ...editingClass,
                      duration: Number(e.target.value),
                    })
                  }
                  className={UI.form.input}
                  min={15}
                  step={15}
                />
              </div>

              {/* User */}
              <div>
                <label className={UI.text.soft}>Profesor</label>
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
                  className={UI.form.input}
                >
                  {instructors
                    .filter((i) => i.active)
                    .map((inst) => (
                      <option
                        key={inst.id}
                        value={inst.id}
                      >
                        {inst.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Capacity */}
              <div>
                <label className={UI.text.soft}>Capacidad</label>
                <input
                  type='number'
                  value={editingClass.capacity}
                  onChange={(e) =>
                    setEditingClass({
                      ...editingClass,
                      capacity: Number(e.target.value),
                    })
                  }
                  className={UI.form.input}
                  min={1}
                />
              </div>
            </div>

            <div className={UI.card.modalFooter}>
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

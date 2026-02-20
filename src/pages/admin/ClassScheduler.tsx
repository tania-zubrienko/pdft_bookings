import { useEffect, useState, useMemo } from 'react';
import {
  getWeeklySlots,
  getInstructors,
  generateMonthClasses,
} from '../../lib/mockData';
import { Class, Instructor, WeeklySlot } from '../../types';
import AdminLayout from '../../components/Layout/AdminLayout';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  UserCog,
  Clock,
  MapPin,
  Users,
  X,
  CalendarPlus,
} from 'lucide-react';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ViewTab = 'template' | 'month';

export default function ClassScheduler() {
  const [template, setTemplate] = useState<WeeklySlot[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [monthClasses, setMonthClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>('template');

  // Month navigation
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // Modal state
  const [editingSlot, setEditingSlot] = useState<WeeklySlot | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);

  useEffect(() => {
    Promise.all([getWeeklySlots(), getInstructors()]).then(([slots, insts]) => {
      setTemplate(slots);
      setInstructors(insts);
      setLoading(false);
    });
  }, []);

  // Generate month view from template
  useEffect(() => {
    if (template.length > 0) {
      const generated = generateMonthClasses(viewYear, viewMonth, template);
      setMonthClasses(generated);
    }
  }, [template, viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // ─── Template editing ───────────────────────────────────────────────

  const slotsGroupedByDay = useMemo(() => {
    const groups: Record<number, WeeklySlot[]> = {};
    for (let d = 0; d < 7; d++) groups[d] = [];
    template.forEach((s) => groups[s.dayOfWeek].push(s));
    // Sort each day by start time
    Object.values(groups).forEach((arr) =>
      arr.sort(
        (a, b) =>
          a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute),
      ),
    );
    return groups;
  }, [template]);

  const openNewSlot = (dayOfWeek: number) => {
    setEditingSlot({
      id: `ws-${Date.now()}`,
      dayOfWeek,
      startHour: 18,
      startMinute: 0,
      title: '',
      description: '',
      instructorId: instructors[0]?.id ?? '',
      instructorName: instructors[0]?.name ?? '',
      duration: 60,
      capacity: 20,
      location: 'Studio A - Main Floor',
    });
    setShowSlotModal(true);
  };

  const openEditSlot = (slot: WeeklySlot) => {
    setEditingSlot({ ...slot });
    setShowSlotModal(true);
  };

  const saveSlot = () => {
    if (!editingSlot || !editingSlot.title) return;
    setTemplate((prev) => {
      const exists = prev.find((s) => s.id === editingSlot.id);
      if (exists) {
        return prev.map((s) => (s.id === editingSlot.id ? editingSlot : s));
      }
      return [...prev, editingSlot];
    });
    setShowSlotModal(false);
    setEditingSlot(null);
  };

  const deleteSlot = (id: string) => {
    setTemplate((prev) => prev.filter((s) => s.id !== id));
  };

  // ─── Month class editing (overrides) ────────────────────────────────

  const monthGroupedByWeek = useMemo(() => {
    const weeks: Class[][] = [];
    if (monthClasses.length === 0) return weeks;

    // Group by ISO week
    const sorted = [...monthClasses].sort(
      (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
    );
    let currentWeekStart: number | null = null;
    let currentWeek: Class[] = [];

    sorted.forEach((cls) => {
      const d = new Date(cls.scheduledAt);
      const dayOfWeek = d.getDay();
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const weekTs = weekStart.getTime();

      if (currentWeekStart === null || weekTs !== currentWeekStart) {
        if (currentWeek.length > 0) weeks.push(currentWeek);
        currentWeek = [];
        currentWeekStart = weekTs;
      }
      currentWeek.push(cls);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  }, [monthClasses]);

  const openAddClass = () => {
    const date = new Date(viewYear, viewMonth, 1);
    setEditingClass({
      id: `extra-${Date.now()}`,
      title: '',
      description: '',
      instructorId: instructors[0]?.id ?? '',
      instructorName: instructors[0]?.name ?? '',
      scheduledAt: date,
      duration: 60,
      capacity: 20,
      enrolledCount: 0,
      active: true,
      location: 'Studio A - Main Floor',
    });
    setShowClassModal(true);
  };

  const openEditClass = (cls: Class) => {
    setEditingClass({ ...cls });
    setShowClassModal(true);
  };

  const saveClass = () => {
    if (!editingClass || !editingClass.title) return;
    setMonthClasses((prev) => {
      const exists = prev.find((c) => c.id === editingClass.id);
      if (exists) {
        return prev.map((c) => (c.id === editingClass.id ? editingClass : c));
      }
      return [...prev, editingClass];
    });
    setShowClassModal(false);
    setEditingClass(null);
  };

  const cancelClass = (id: string) => {
    setMonthClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: false } : c)),
    );
  };

  const restoreClass = (id: string) => {
    setMonthClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: true } : c)),
    );
  };

  const formatTime = (h: number, m: number) => {
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

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
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
          Class Schedule
        </h1>
        <p className='text-gray-500 mt-1'>
          Manage the weekly template and monthly class instances
        </p>
      </div>

      {/* Tab switcher */}
      <div className='flex gap-2 mb-6'>
        <button
          onClick={() => setActiveTab('template')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'template'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Weekly Template
        </button>
        <button
          onClick={() => setActiveTab('month')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'month'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Month View
        </button>
      </div>

      {/* ─────── WEEKLY TEMPLATE TAB ─────── */}
      {activeTab === 'template' && (
        <div className='space-y-4'>
          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
            <div
              key={day}
              className='bg-white rounded-xl border border-gray-200 overflow-hidden'
            >
              <div className='flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200'>
                <h3 className='font-semibold text-gray-900'>
                  {DAY_NAMES[day]}
                </h3>
                <button
                  onClick={() => openNewSlot(day)}
                  className='flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium'
                >
                  <Plus className='w-4 h-4' />
                  Add Class
                </button>
              </div>
              {slotsGroupedByDay[day].length === 0 ? (
                <p className='px-4 py-4 text-sm text-gray-400 italic'>
                  No classes scheduled
                </p>
              ) : (
                <div className='divide-y divide-gray-100'>
                  {slotsGroupedByDay[day].map((slot) => (
                    <div
                      key={slot.id}
                      className='px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-gray-50 transition-colors'
                    >
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-gray-900'>
                          {slot.title}
                        </p>
                        <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1'>
                          <span className='flex items-center gap-1'>
                            <Clock className='w-3.5 h-3.5' />
                            {formatTime(
                              slot.startHour,
                              slot.startMinute,
                            )} · {slot.duration}min
                          </span>
                          <span className='flex items-center gap-1'>
                            <UserCog className='w-3.5 h-3.5' />
                            {slot.instructorName}
                          </span>
                          <span className='flex items-center gap-1'>
                            <Users className='w-3.5 h-3.5' />
                            {slot.capacity} spots
                          </span>
                          <span className='flex items-center gap-1'>
                            <MapPin className='w-3.5 h-3.5' />
                            {slot.location}
                          </span>
                        </div>
                      </div>
                      <div className='flex items-center gap-2 shrink-0'>
                        <button
                          onClick={() => openEditSlot(slot)}
                          className='p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors'
                          title='Edit'
                        >
                          <UserCog className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => deleteSlot(slot.id)}
                          className='p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors'
                          title='Delete'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─────── MONTH VIEW TAB ─────── */}
      {activeTab === 'month' && (
        <div>
          {/* Month navigation */}
          <div className='flex items-center justify-between mb-6'>
            <button
              onClick={prevMonth}
              className='p-2 rounded-lg hover:bg-gray-200 transition-colors'
            >
              <ChevronLeft className='w-5 h-5' />
            </button>
            <h2 className='text-xl font-bold text-gray-900'>{monthLabel}</h2>
            <button
              onClick={nextMonth}
              className='p-2 rounded-lg hover:bg-gray-200 transition-colors'
            >
              <ChevronRight className='w-5 h-5' />
            </button>
          </div>

          <div className='flex items-center justify-between mb-4'>
            <p className='text-sm text-gray-500'>
              {monthClasses.filter((c) => c.active).length} classes ·{' '}
              {monthClasses.filter((c) => !c.active).length} cancelled
            </p>
            <button
              onClick={openAddClass}
              className='btn btn-primary text-sm flex items-center gap-1'
            >
              <CalendarPlus className='w-4 h-4' />
              Add Extra Class
            </button>
          </div>

          {/* Week cards */}
          {monthGroupedByWeek.map((week, wi) => {
            const weekStart = new Date(week[0].scheduledAt);
            const weekDay = weekStart.getDay();
            const mondayDate = new Date(weekStart);
            mondayDate.setDate(
              weekStart.getDate() - weekDay + (weekDay === 0 ? -6 : 1),
            );

            return (
              <div
                key={wi}
                className='mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden'
              >
                <div className='px-4 py-3 bg-gray-50 border-b border-gray-200'>
                  <h3 className='font-semibold text-gray-900'>
                    Week {wi + 1} —{' '}
                    {mondayDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                </div>
                <div className='divide-y divide-gray-100'>
                  {week
                    .sort(
                      (a, b) =>
                        a.scheduledAt.getTime() - b.scheduledAt.getTime(),
                    )
                    .map((cls) => (
                      <div
                        key={cls.id}
                        className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${
                          !cls.active ? 'opacity-50' : 'hover:bg-gray-50'
                        } transition-colors`}
                      >
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <p
                              className={`font-medium ${cls.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}
                            >
                              {cls.title}
                            </p>
                            {!cls.active && (
                              <span className='text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium'>
                                Cancelled
                              </span>
                            )}
                          </div>
                          <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1'>
                            <span>
                              {DAY_NAMES_SHORT[cls.scheduledAt.getDay()]}{' '}
                              {cls.scheduledAt.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className='flex items-center gap-1'>
                              <Clock className='w-3.5 h-3.5' />
                              {cls.scheduledAt.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}{' '}
                              · {cls.duration}min
                            </span>
                            <span className='flex items-center gap-1'>
                              <UserCog className='w-3.5 h-3.5' />
                              {cls.instructorName}
                            </span>
                            <span className='flex items-center gap-1'>
                              <MapPin className='w-3.5 h-3.5' />
                              {cls.location}
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
                          {cls.active ? (
                            <button
                              onClick={() => cancelClass(cls.id)}
                              className='p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors'
                              title='Cancel class'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          ) : (
                            <button
                              onClick={() => restoreClass(cls.id)}
                              className='text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1'
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────── SLOT EDITOR MODAL (weekly template) ─────── */}
      {showSlotModal && editingSlot && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
              <h3 className='text-lg font-bold text-gray-900'>
                {template.find((s) => s.id === editingSlot.id)
                  ? 'Edit Class Slot'
                  : 'New Class Slot'}
              </h3>
              <button
                onClick={() => {
                  setShowSlotModal(false);
                  setEditingSlot(null);
                }}
                className='p-1 rounded-lg hover:bg-gray-100'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='px-6 py-4 space-y-4'>
              {/* Day */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Day
                </label>
                <select
                  value={editingSlot.dayOfWeek}
                  onChange={(e) =>
                    setEditingSlot({
                      ...editingSlot,
                      dayOfWeek: Number(e.target.value),
                    })
                  }
                  className='input'
                >
                  {DAY_NAMES.map((name, i) => (
                    <option
                      key={i}
                      value={i}
                    >
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Class Title
                </label>
                <input
                  type='text'
                  value={editingSlot.title}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, title: e.target.value })
                  }
                  className='input'
                  placeholder='e.g. Salsa Basics'
                />
              </div>

              {/* Description */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Description
                </label>
                <textarea
                  value={editingSlot.description}
                  onChange={(e) =>
                    setEditingSlot({
                      ...editingSlot,
                      description: e.target.value,
                    })
                  }
                  className='input'
                  rows={2}
                  placeholder='Short description…'
                />
              </div>

              {/* Time */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Start Time
                  </label>
                  <input
                    type='time'
                    value={`${String(editingSlot.startHour).padStart(2, '0')}:${String(editingSlot.startMinute).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      setEditingSlot({
                        ...editingSlot,
                        startHour: h,
                        startMinute: m,
                      });
                    }}
                    className='input'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Duration (min)
                  </label>
                  <input
                    type='number'
                    value={editingSlot.duration}
                    onChange={(e) =>
                      setEditingSlot({
                        ...editingSlot,
                        duration: Number(e.target.value),
                      })
                    }
                    className='input'
                    min={15}
                    step={15}
                  />
                </div>
              </div>

              {/* Instructor */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Instructor
                </label>
                <select
                  value={editingSlot.instructorId}
                  onChange={(e) => {
                    const inst = instructors.find(
                      (i) => i.id === e.target.value,
                    );
                    setEditingSlot({
                      ...editingSlot,
                      instructorId: e.target.value,
                      instructorName: inst?.name ?? '',
                    });
                  }}
                  className='input'
                >
                  {instructors.map((inst) => (
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
                  Capacity
                </label>
                <input
                  type='number'
                  value={editingSlot.capacity}
                  onChange={(e) =>
                    setEditingSlot({
                      ...editingSlot,
                      capacity: Number(e.target.value),
                    })
                  }
                  className='input'
                  min={1}
                />
              </div>

              {/* Location */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Location
                </label>
                <input
                  type='text'
                  value={editingSlot.location}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, location: e.target.value })
                  }
                  className='input'
                  placeholder='e.g. Studio A'
                />
              </div>
            </div>

            <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200'>
              <button
                onClick={() => {
                  setShowSlotModal(false);
                  setEditingSlot(null);
                }}
                className='btn btn-secondary'
              >
                Cancel
              </button>
              <button
                onClick={saveSlot}
                disabled={!editingSlot.title}
                className='btn btn-primary flex items-center gap-1'
              >
                <Save className='w-4 h-4' />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────── CLASS EDITOR MODAL (month override) ─────── */}
      {showClassModal && editingClass && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
              <h3 className='text-lg font-bold text-gray-900'>
                {monthClasses.find((c) => c.id === editingClass.id)
                  ? 'Edit Class'
                  : 'Add Extra Class'}
              </h3>
              <button
                onClick={() => {
                  setShowClassModal(false);
                  setEditingClass(null);
                }}
                className='p-1 rounded-lg hover:bg-gray-100'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='px-6 py-4 space-y-4'>
              {/* Title */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Class Title
                </label>
                <input
                  type='text'
                  value={editingClass.title}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, title: e.target.value })
                  }
                  className='input'
                  placeholder='e.g. Salsa Workshop'
                />
              </div>

              {/* Description */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Description
                </label>
                <textarea
                  value={editingClass.description}
                  onChange={(e) =>
                    setEditingClass({
                      ...editingClass,
                      description: e.target.value,
                    })
                  }
                  className='input'
                  rows={2}
                />
              </div>

              {/* Date + Time */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Date
                  </label>
                  <input
                    type='date'
                    value={editingClass.scheduledAt.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const d = new Date(e.target.value + 'T00:00:00');
                      d.setHours(
                        editingClass.scheduledAt.getHours(),
                        editingClass.scheduledAt.getMinutes(),
                      );
                      setEditingClass({ ...editingClass, scheduledAt: d });
                    }}
                    className='input'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Time
                  </label>
                  <input
                    type='time'
                    value={`${String(editingClass.scheduledAt.getHours()).padStart(2, '0')}:${String(editingClass.scheduledAt.getMinutes()).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      const d = new Date(editingClass.scheduledAt);
                      d.setHours(h, m, 0, 0);
                      setEditingClass({ ...editingClass, scheduledAt: d });
                    }}
                    className='input'
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Duration (min)
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

              {/* Instructor */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Instructor
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
                  {instructors.map((inst) => (
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
                  Capacity
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

              {/* Location */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Location
                </label>
                <input
                  type='text'
                  value={editingClass.location ?? ''}
                  onChange={(e) =>
                    setEditingClass({
                      ...editingClass,
                      location: e.target.value,
                    })
                  }
                  className='input'
                />
              </div>
            </div>

            <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200'>
              <button
                onClick={() => {
                  setShowClassModal(false);
                  setEditingClass(null);
                }}
                className='btn btn-secondary'
              >
                Cancel
              </button>
              <button
                onClick={saveClass}
                disabled={!editingClass.title}
                className='btn btn-primary flex items-center gap-1'
              >
                <Save className='w-4 h-4' />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

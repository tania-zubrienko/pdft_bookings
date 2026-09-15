import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import userService from '@/services/user.service';
import creditService from '@/services/credit.service';
import { CreditPool, AppUser, ReservationWithClass } from '../../types';
import { AlertCircle, CheckCircle2, ChevronDown, Plus, Search } from 'lucide-react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import UI from '@/styles';
import CreditModalDialog from './components/CreditModalDialog';
import reservationService from '@/services/reservation.service';
import StudentBookingsCalendar from './components/StudentBookingsCalendar';
import StudentProfileCard from './components/StudentProfileCard';

const EXPIRING_SOON_DAYS = 7;

function poolStatus(pool: CreditPool): 'active' | 'future' | 'expired' {
  const now = new Date();
  if (pool.expiresAt <= now || pool.remainingCredits <= 0) return 'expired';
  if (pool.startDate > now) return 'future';
  return 'active';
}

export default function CreditManagement() {
  const [students, setStudents] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPool, setSelectedPool] = useState<CreditPool | null>(null);

  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentBookings, setStudentBookings] = useState<ReservationWithClass[]>([]);

  const [pools, setPools] = useState<CreditPool[]>([]);
  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    Promise.all([userService.getStudents()]).then(([studentsRes]) => {
      setStudents(studentsRes);
      if (studentsRes.length > 0) setSelectedStudentId(studentsRes[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setPools([]);
      setStudentBookings([]);
      return;
    }
    reservationService.getReservationsWithClassByStudent(selectedStudentId).then(setStudentBookings);
    creditService.getCreditPoolsByStudent(selectedStudentId).then(setPools);
  }, [selectedStudentId]);

  const filteredStudents = useMemo(() => {
    const q = searchStudent.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [students, searchStudent]);

  const stats = useMemo(() => {
    const now = new Date();
    const soon = new Date(
      now.getTime() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000,
    );

    const activeCredits = pools
      .filter((p) => poolStatus(p) === 'active')
      .reduce((sum, p) => sum + p.remainingCredits, 0);

    const expiringSoon = pools.filter(
      (p) =>
        p.remainingCredits > 0 &&
        p.startDate <= now &&
        p.expiresAt > now &&
        p.expiresAt <= soon,
    ).length;

    return { activeCredits, expiringSoon };
  }, [pools]);

  const activeBonosCount = useMemo(
    () => pools.filter((p) => poolStatus(p) === 'active').length,
    [pools],
  );

  const sortedPools = useMemo(
    () =>
      [...pools].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [pools],
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleFormSubmit = async (data: {
    credits: number;
    remainingCredits?: number;
    startDate: string;
    expiresAt: string;
    notes: string;
    id?: string;
    paymentMethod: string;
  }) => {
    setFormError('');
    setFormSuccess('');

    if (!selectedStudentId) {
      setFormError('Selecciona una alumno.');
      return;
    }

    if (!Number.isInteger(data.credits) || data.credits <= 0) {
      setFormError('Los créditos deben ser un número entero mayor que 0.');
      return;
    }

    const start = new Date(`${data.startDate}T00:00:00`);
    const end = new Date(`${data.expiresAt}T23:59:59`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setFormError('Las fechas no son válidas.');
      return;
    }

    if (start >= end) {
      setFormError(
        'La fecha de inicio debe ser anterior a la fecha de expiración.',
      );
      return;
    }

    const hasOverlap = pools.some((pool) => {
      if (data.id && pool.id === data.id) return false;
      if (!pool.isActive || pool.remainingCredits <= 0) return false;

      const overlaps = start < pool.expiresAt && end > pool.startDate;
      return overlaps;
    });

    if (hasOverlap) {
      setFormError(
        'No se puede guardar: existe otro pool activo con fechas solapadas para esta alumno.',
      );
      return;
    }

    setSaving(true);
    try {
      const paymentMethod = data.paymentMethod || 'cash';

      if (data.id) {
        await creditService.updateCreditPool(data.id, {
          totalCredits: data.credits,
          remainingCredits: data.remainingCredits ?? data.credits,
          startDate: start,
          expiresAt: end,
          notes: data.notes,
          paymentMethod,
        });
        const refreshed =
          await creditService.getCreditPoolsByStudent(selectedStudentId);
        setPools(refreshed);
        setFormSuccess('Créditos actualizados correctamente.');
        return;
      }
      await creditService.createCreditPool({
        studentId: selectedStudentId,
        credits: data.credits,
        startDate: start,
        expiresAt: end,
        notes: data.notes,
        createdBy: 'admin_1',
        paymentMethod,
      });

      const refreshed =
        await creditService.getCreditPoolsByStudent(selectedStudentId);
      setPools(refreshed);
      setFormSuccess('Créditos asignados correctamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={UI.loading.container}>
          <div className={UI.loading.spinner}></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='mb-6'>
        <h1 className={UI.text.heading}>Gestión de Créditos</h1>
        <p className={UI.text.soft}>
          Asigna créditos manualmente y revisa los pools por alumno
        </p>
      </div>

      <div className='grid  gap-6'>
        <section className='card p-5 lg:col-span-1'>
          <h2 className='text-lg font-semibold text-gray-100 mb-3'>
            Seleccionar alumno
          </h2>

          <div className='relative mb-3'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              className='input pl-9'
              placeholder='Buscar por nombre o email'
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
            />
          </div>

          <select
            className='input'
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            {filteredStudents.map((s) => (
              <option
                key={s.id}
                value={s.id}
              >
                {s.name} ({s.email})
              </option>
            ))}
          </select>

          <div className='mt-4'>
            <StudentProfileCard
              student={selectedStudent}
              activeCredits={stats.activeCredits}
              activeBonosCount={activeBonosCount}
              expirationDate={pools
                .find((p) => poolStatus(p) === 'active')?.expiresAt}
            />
          </div>
          <section className='p-5 flex flex-col'>
            {formError && (
              <div className={`${UI.alert.error} mb-4`}>
                <AlertCircle className='w-4 h-4' />
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className={`${UI.alert.success} mb-4`}>
                <CheckCircle2 className='w-4 h-4' />
                {formSuccess}
              </div>
            )}
            <button
              type='button'
              className={`${UI.button.primary} inline-flex items-center gap-2 ml-auto`}
              disabled={!selectedStudentId}
              onClick={() => {
                setSelectedPool(null);
                setShowDialog(true);
              }}
            >
              <Plus className='w-4 h-4' />
              Crear créditos
            </button>
          </section>
        </section>


      </div>

      <section className='card p-5 mt-6'>
        <Disclosure defaultOpen>
          {({ open }) => (
            <>
              <DisclosureButton className='flex w-full items-center justify-between text-left'>
                <h2 className='text-lg font-semibold text-gray-100'>
                  Historia de créditos ({sortedPools.length})
                </h2>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''
                    }`}
                />
              </DisclosureButton>

              <DisclosurePanel className='mt-4'>
                {sortedPools.length === 0 ? (
                  <p className='text-gray-400 text-sm'>
                    No hay pools para la alumno seleccionada.
                  </p>
                ) : (
                  <div className='space-y-3'>
                    {sortedPools.map((pool) => {
                      const status = poolStatus(pool);
                      return (
                        <div
                          key={pool.id}
                          className='rounded-lg border border-gray-700 bg-gray-800 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3'
                        >
                          <div className='text-sm text-gray-200'>
                            <p className='font-medium'>
                              {pool.remainingCredits}/{pool.totalCredits} créditos
                            </p>
                            <p className='text-gray-400'>
                              Válido: {pool.startDate.toLocaleDateString('es-ES')} →{' '}
                              {pool.expiresAt.toLocaleDateString('es-ES')}
                            </p>
                            {pool.packageId && (
                              <p className='text-gray-400'>Paquete: {pool.packageId}</p>
                            )}
                            <p className='text-gray-400'>Forma de pago: {pool.paymentMethod}</p>
                            {pool.notes && (
                              <p className='text-gray-400'>Notas: {pool.notes}</p>
                            )}
                          </div>
                          <div className='flex flex-col md:flex-row md:items-center md:justify-end gap-3'>
                            <span
                              className={`${status === 'active'
                                ? UI.badge.green
                                : status === 'future'
                                  ? UI.badge.amber
                                  : status === 'expired'
                                    ? UI.badge.red
                                    : UI.badge.base
                                } w-fit`}
                            >
                              {status === 'active'
                                ? 'Activo'
                                : status === 'future'
                                  ? 'Futuro'
                                  : 'Expirado'}
                            </span>
                            <button
                              className={UI.button.primary}
                              onClick={() => {
                                setShowDialog(true);
                                setSelectedPool(pool);
                              }}
                            >
                              {' '}
                              Editar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      </section>
      <section className='card p-5 mt-6'>
        <h2 className='text-lg font-semibold text-gray-100 mb-4'>
          Historia de reservas ({studentBookings.length})
        </h2>
        <StudentBookingsCalendar studentBookings={studentBookings} />
      </section>
      <section>
        <CreditModalDialog
          creditPool={selectedPool}
          isVisible={showDialog}
          onClose={() => setShowDialog(false)}
          onSave={handleFormSubmit}
          saving={saving}
        />
      </section>
    </AdminLayout>
  );
}

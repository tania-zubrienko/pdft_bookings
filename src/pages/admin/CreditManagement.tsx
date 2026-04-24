import { FormEvent, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import userService from '@/services/user.service';
import packageService from '@/services/package.service';
import creditService from '@/services/credit.service';
import { CreditPool, Package, AppUser } from '../../types';
import { AlertCircle, CheckCircle2, Coins, Search } from 'lucide-react';
import UI from '@/styles';

const EXPIRING_SOON_DAYS = 7;

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function poolStatus(pool: CreditPool): 'active' | 'future' | 'expired' {
  const now = new Date();
  if (pool.expiresAt <= now || pool.remainingCredits <= 0) return 'expired';
  if (pool.startDate > now) return 'future';
  return 'active';
}

export default function CreditManagement() {
  const [students, setStudents] = useState<AppUser[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [pools, setPools] = useState<CreditPool[]>([]);
  const [saving, setSaving] = useState(false);

  const [credits, setCredits] = useState(4);
  const [startDate, setStartDate] = useState(formatDateInput(new Date()));
  const [expiresAt, setExpiresAt] = useState(
    formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  );
  const [packageId, setPackageId] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      userService.getStudents(),
      packageService.getAllPackages(),
    ]).then(([studentsRes, packagesRes]) => {
      setStudents(studentsRes);
      setPackages(packagesRes);
      if (studentsRes.length > 0) setSelectedStudentId(studentsRes[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setPools([]);
      return;
    }
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

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedStudentId) {
      setFormError('Selecciona una alumna.');
      return;
    }

    if (!Number.isInteger(credits) || credits <= 0) {
      setFormError('Los créditos deben ser un número entero mayor que 0.');
      return;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${expiresAt}T23:59:59`);

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

    setSaving(true);
    try {
      await creditService.createCreditPool({
        studentId: selectedStudentId,
        credits,
        startDate: start,
        expiresAt: end,
        packageId: packageId || undefined,
        notes,
        createdBy: 'admin_1',
      });

      const refreshed =
        await creditService.getCreditPoolsByStudent(selectedStudentId);
      setPools(refreshed);
      setNotes('');
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
          Asigna créditos manualmente y revisa los pools por alumna
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <section className='card p-5 lg:col-span-1'>
          <h2 className='text-lg font-semibold text-gray-100 mb-3'>
            Seleccionar alumna
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

          <div className='mt-4 space-y-2 text-sm text-gray-300'>
            <p>
              <span className='text-gray-400'>Alumna:</span>{' '}
              {selectedStudent?.name ?? '—'}
            </p>
            <p>
              <span className='text-gray-400'>Créditos activos:</span>{' '}
              {stats.activeCredits}
            </p>
            <p>
              <span className='text-gray-400'>
                Pools por vencer ({EXPIRING_SOON_DAYS} días):
              </span>{' '}
              {stats.expiringSoon}
            </p>
          </div>
        </section>

        <section className='card p-5 lg:col-span-2'>
          <h2 className='text-lg font-semibold text-gray-100 mb-4'>
            Crear pool de créditos
          </h2>

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

          <form
            onSubmit={submit}
            className='grid grid-cols-1 md:grid-cols-2 gap-4'
          >
            <div>
              <label className='block text-sm text-gray-300 mb-1'>
                Créditos
              </label>
              <input
                type='number'
                min={1}
                step={1}
                className='input'
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
              />
            </div>

            <div>
              <label className='block text-sm text-gray-300 mb-1'>
                Referencia de paquete (opcional)
              </label>
              <select
                className='input'
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
              >
                <option value=''>Sin referencia</option>
                {packages.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                  >
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm text-gray-300 mb-1'>
                Fecha de inicio
              </label>
              <input
                type='date'
                className='input'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className='block text-sm text-gray-300 mb-1'>
                Fecha de expiración
              </label>
              <input
                type='date'
                className='input'
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <div className='md:col-span-2'>
              <label className='block text-sm text-gray-300 mb-1'>
                Notas (opcional)
              </label>
              <textarea
                className='input min-h-[84px]'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Ej. Crédito por promoción o compensación'
              />
            </div>

            <div className='md:col-span-2 flex justify-end'>
              <button
                type='submit'
                className='btn btn-primary inline-flex items-center gap-2'
                disabled={saving}
              >
                <Coins className='w-4 h-4' />
                {saving ? 'Guardando...' : 'Asignar Créditos'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className='card p-5 mt-6'>
        <h2 className='text-lg font-semibold text-gray-100 mb-4'>
          Pools de créditos
        </h2>

        {pools.length === 0 ? (
          <p className='text-gray-400 text-sm'>
            No hay pools para la alumna seleccionada.
          </p>
        ) : (
          <div className='space-y-3'>
            {pools.map((pool) => {
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
                    {pool.notes && (
                      <p className='text-gray-400'>Notas: {pool.notes}</p>
                    )}
                  </div>

                  <span
                    className={`${
                      status === 'active'
                        ? UI.badge.green
                        : status === 'future'
                          ? UI.badge.amber
                          : UI.badge.base
                    } w-fit`}
                  >
                    {status === 'active'
                      ? 'Activo'
                      : status === 'future'
                        ? 'Futuro'
                        : 'Expirado'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}

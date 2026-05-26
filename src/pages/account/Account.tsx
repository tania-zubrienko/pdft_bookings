import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  User,
  Save,
  Camera,
  CheckCircle,
  Clock,
  Users,
  ChevronDown,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Layout from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import reservationService from '@/services/reservation.service';
import scheduleService from '@/services/schedule.service';
import userService from '@/services/user.service';
import { storage } from '@/lib/firebase';
import { CreditBalance, ReservationWithClass, ScheduledClass } from '@/types';
import UI from '@/styles';
import creditService from '@/services/credit.service';
import CreditBalanceCard from '@/components/User/CreditBalance';
import ReservationCard from '@/components/Classes/ReservationCard';
import CalendarView from '@/components/Calendar/CalendarView';

type Tab = 'reservations' | 'profile';

export default function Account() {
  const { user, appUser, refreshAppUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('reservations');

  // ── Reservations tab state ──────────────────────────────────────────────
  const [reservations, setReservations] = useState<ReservationWithClass[]>([]);
  const [allScheduledClasses, setAllScheduledClasses] = useState<
    ScheduledClass[]
  >([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [credits, setCredits] = useState<CreditBalance | null>(null);

  // ── Calendar state ──────────────────────────────────────────────────────
  const [calendarViewMode, setCalendarViewMode] = useState<'week' | 'month'>(
    'month',
  );
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // ── Profile tab state ───────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); // persisted download URL
  const [avatarPreview, setAvatarPreview] = useState(''); // local blob preview
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seed profile fields from appUser
  useEffect(() => {
    if (appUser) {
      setDisplayName(appUser.name ?? '');
      setAvatarUrl(appUser.avatar ?? '');
    }
  }, [appUser]);

  // Load reservations once
  useEffect(() => {
    if (!user) return;

    Promise.all([
      reservationService.getReservationsByStudent(user.uid),
      scheduleService.getAllScheduledClasses(),
      creditService.getCreditBalance(user.uid),
    ]).then(([resData, classData, creditData]) => {
      const enriched = resData.map((r: any) => ({
        ...r,
        scheduledClass: classData.find((c: any) => c.id === r.scheduledClassId),
      }));
      setReservations(enriched);
      setAllScheduledClasses(classData);
      setReservationsLoading(false);
      setCredits(creditData);
    });
    console.log(user);
  }, [user]);

  const avatarInitial = (name: string) =>
    name ? name.charAt(0).toUpperCase() : '?';

  // ── Avatar file pick + upload ────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate: images only, max 5 MB
    if (!file.type.startsWith('image/')) {
      setSaveError('Solo se permiten imágenes.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('La imagen no puede superar 5 MB.');
      return;
    }

    setSaveError('');
    setSaveSuccess(false);
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const downloadUrl = await getDownloadURL(storageRef);
      setAvatarUrl(downloadUrl);
    } catch {
      setSaveError('Error al subir la imagen. Inténtalo de nuevo.');
      setAvatarPreview('');
    } finally {
      setUploading(false);
      // reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Profile save ─────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      setSaveError('El nombre no puede estar vacío.');
      return;
    }
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await userService.updateUserProfile(user.uid, {
        name: displayName.trim(),
        avatar: avatarUrl.trim(),
      });
      await refreshAppUser();
      setSaveSuccess(true);
    } catch {
      setSaveError('Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  // ── Tab bar ──────────────────────────────────────────────────────────────
  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-primary-500 text-primary-400'
        : 'border-transparent text-ui-text-soft hover:text-gray-200'
    }`;

  const getActiveReserves = () => {
    return reservations.filter(
      (r) => !!r.scheduledClass?.date && r.scheduledClass?.date >= new Date(),
    );
  };
  const getPassedReserves = () => {
    return reservations.filter(
      (r) => !!r.scheduledClass?.date && r.scheduledClass?.date < new Date(),
    );
  };

  const [pastReservationsOpen, setPastReservationsOpen] = useState(false);

  // IDs of scheduled classes with a confirmed reservation
  const reservedClassIds = useMemo(() => {
    return new Set(
      reservations
        .filter((r) => r.status === 'confirmed')
        .map((r) => r.scheduledClassId),
    );
  }, [reservations]);

  // Classes on the selected calendar day
  const classesForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return allScheduledClasses
      .filter((c) => {
        const d = c.date;
        return (
          d.getFullYear() === selectedDate.getFullYear() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getDate() === selectedDate.getDate()
        );
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allScheduledClasses, selectedDate]);
  const cancelReservation = async (reservedClass: ReservationWithClass) => {
    const isSuccess =
      await reservationService.cancelReservationForStudent(reservedClass);
    alert(isSuccess);
  };
  return (
    <Layout>
      {/* Page header */}
      <div className='mb-6'>
        <h1 className={`${UI.text.heading} mb-1`}>Mi Cuenta</h1>
        <p className={UI.text.soft}>Gestiona tu perfil y reservas</p>
      </div>

      {/* Credits pool */}
      <div className='mb-6'>
        {credits && <CreditBalanceCard {...credits} />}
      </div>

      {/* Tab bar */}
      <div className='flex border-b border-ui-border-soft mb-6'>
        <button
          className={tabClass('reservations')}
          onClick={() => setActiveTab('reservations')}
        >
          <span className='flex items-center gap-2'>
            <Calendar className='w-4 h-4' />
            Mis Reservas
          </span>
        </button>
        <button
          className={tabClass('profile')}
          onClick={() => setActiveTab('profile')}
        >
          <span className='flex items-center gap-2'>
            <User className='w-4 h-4' />
            Mi Perfil
          </span>
        </button>
      </div>

      {/* ── RESERVATIONS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'reservations' && (
        <>
          {reservationsLoading ? (
            <div className={UI.loading.container}>
              <div className={UI.loading.spinner} />
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Calendar */}
              <CalendarView
                classes={allScheduledClasses}
                viewMode={calendarViewMode}
                currentDate={calendarDate}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onChangeDate={setCalendarDate}
                onChangeViewMode={setCalendarViewMode}
                reservedClassIds={reservedClassIds}
              />

              {/* Day detail */}
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
                    <p className={UI.text.soft}>No hay clases este día.</p>
                  ) : (
                    <div className='space-y-3'>
                      {classesForSelectedDay.map((cls) => {
                        const isReserved = reservedClassIds.has(cls.id);
                        return (
                          <div
                            key={cls.id}
                            className={`card p-4 flex items-center justify-between gap-4 ${
                              isReserved ? 'ring-2 ring-green-500/60' : ''
                            }`}
                          >
                            <div className='flex items-center gap-3 min-w-0'>
                              {isReserved && (
                                <CheckCircle className='w-5 h-5 text-green-400 shrink-0' />
                              )}
                              <div className='min-w-0'>
                                <p className='text-sm font-semibold text-gray-100 truncate'>
                                  {cls.classTitle}
                                </p>
                                <p className='text-xs text-gray-400'>
                                  {cls.instructorName}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center gap-4 shrink-0 text-xs text-gray-400'>
                              <span className='flex items-center gap-1'>
                                <Clock className='w-3.5 h-3.5' />
                                {cls.date.toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })}
                              </span>
                              <span className='flex items-center gap-1'>
                                <Users className='w-3.5 h-3.5' />
                                {cls.enrolledCount}/{cls.capacity}
                              </span>
                              {isReserved ? (
                                <span className={UI.badge.green}>
                                  Reservada
                                </span>
                              ) : cls.status === 'cancelled' ? (
                                <span className={UI.badge.red}>Cancelada</span>
                              ) : cls.enrolledCount >= cls.capacity ? (
                                <span className={UI.badge.base}>Completa</span>
                              ) : (
                                <Link
                                  to={`/classes/${cls.id}`}
                                  className='btn btn-primary py-1 px-3 text-xs'
                                >
                                  Reservar
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Reservation history */}
              {reservations.length > 0 && (
                <div>
                  <p className={`${UI.text.label} mb-3`}>
                    Historial de reservas
                  </p>
                  <div className='space-y-4'>
                    <p className={UI.text.label}>Reservas en curso</p>
                    {getActiveReserves().map((reservation) => (
                      <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        onCancel={cancelReservation}
                      />
                    ))}
                    <button
                      className='flex items-center justify-between w-full text-left py-2'
                      onClick={() => setPastReservationsOpen((v) => !v)}
                    >
                      <span className={UI.text.label}>
                        Reservas finalizadas ({getPassedReserves().length})
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${pastReservationsOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {pastReservationsOpen && (
                      <div className='space-y-4'>
                        {getPassedReserves().map((reservation) => (
                          <ReservationCard
                            key={reservation.id}
                            reservation={reservation}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {reservations.length === 0 && (
                <div className='text-center py-12'>
                  <Calendar className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                  <h3 className={`${UI.text.subheading} mb-2`}>
                    Aún no tienes reservas
                  </h3>
                  <p className={`${UI.text.soft} mb-6`}>
                    ¡Reserva tu primera clase de baile para empezar!
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
          )}
        </>
      )}

      {/* ── PROFILE TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className='max-w-lg'>
          {/* Avatar picker */}
          <div className='flex items-center gap-5 mb-8'>
            <div className='relative flex-shrink-0'>
              <div className='w-20 h-20 rounded-full bg-primary-700 flex items-center justify-center overflow-hidden'>
                {avatarPreview || avatarUrl ? (
                  <img
                    src={avatarPreview || avatarUrl}
                    alt='Avatar'
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <span className='text-3xl font-bold text-white'>
                    {avatarInitial(displayName || appUser?.name || '')}
                  </span>
                )}
              </div>
              {/* Camera overlay button */}
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className='absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary-600 border-2 border-ui-page flex items-center justify-center hover:bg-primary-500 transition-colors disabled:opacity-50'
                aria-label='Cambiar foto'
              >
                {uploading ? (
                  <span className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
                ) : (
                  <Camera className='w-3.5 h-3.5 text-white' />
                )}
              </button>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleFileChange}
              />
            </div>
            <div>
              <p className='text-gray-100 font-semibold text-lg'>
                {appUser?.name || 'Sin nombre'}
              </p>
              <p className={UI.text.soft}>{appUser?.email}</p>
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className='mt-1 text-xs text-primary-400 hover:text-primary-300 disabled:opacity-50 transition-colors'
              >
                {uploading ? 'Subiendo…' : 'Cambiar foto'}
              </button>
            </div>
          </div>

          {/* Form */}
          <div className='space-y-5'>
            <div>
              <label className={`${UI.text.label} block mb-1`}>Nombre</label>
              <input
                type='text'
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className='input w-full'
                placeholder='Tu nombre'
                maxLength={60}
              />
            </div>

            {saveError && <p className={UI.text.error}>{saveError}</p>}
            {saveSuccess && (
              <p className={UI.text.success}>
                Perfil actualizado correctamente.
              </p>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={saving || uploading}
              className={`${UI.button.base} ${UI.button.primary} ${saving || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save className='w-4 h-4' />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

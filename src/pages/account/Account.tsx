import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, User } from 'lucide-react';
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
import CreditBalanceCard from '@/pages/account/components/CreditBalance';
import ReservationsTab from '@/pages/account/components/ReservationsTab';
import ProfileTab from '@/pages/account/components/ProfileTab';

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
  }, [user]);

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
        ? 'border-brand text-brand-light'
        : 'border-transparent text-ui-text-soft hover:text-ui-text'
    }`;

  // IDs of scheduled classes with a confirmed reservation
  const reservedClassIds = useMemo(() => {
    return new Set(
      reservations
        .filter((r) => r.status === 'confirmed')
        .map((r) => r.scheduledClassId),
    );
  }, [reservations]);

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
        <ReservationsTab
          reservationsLoading={reservationsLoading}
          reservations={reservations}
          allScheduledClasses={allScheduledClasses}
          calendarViewMode={calendarViewMode}
          currentDate={calendarDate}
          selectedDate={selectedDate}
          reservedClassIds={reservedClassIds}
          onSelectDate={setSelectedDate}
          onChangeDate={setCalendarDate}
          onChangeViewMode={setCalendarViewMode}
          onCancel={cancelReservation}
        />
      )}

      {/* ── PROFILE TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <ProfileTab
          appUser={appUser}
          displayName={displayName}
          avatarUrl={avatarUrl}
          avatarPreview={avatarPreview}
          uploading={uploading}
          saving={saving}
          saveError={saveError}
          saveSuccess={saveSuccess}
          fileInputRef={fileInputRef}
          onDisplayNameChange={setDisplayName}
          onFileChange={handleFileChange}
          onSaveProfile={handleSaveProfile}
        />
      )}
    </Layout>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  XCircle,
  User,
  Save,
  Camera,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Layout from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import reservationService from '@/services/reservation.service';
import scheduleService from '@/services/schedule.service';
import userService from '@/services/user.service';
import { storage } from '@/lib/firebase';
import { Reservation, ScheduledClass } from '@/types';
import UI from '@/lib/styles';

type Tab = 'reservations' | 'profile';

interface ReservationWithClass extends Reservation {
  scheduledClass?: ScheduledClass;
}

export default function Account() {
  const { user, appUser, refreshAppUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('reservations');

  // ── Reservations tab state ──────────────────────────────────────────────
  const [reservations, setReservations] = useState<ReservationWithClass[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);

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
    ]).then(([resData, classData]) => {
      const enriched = resData.map((r) => ({
        ...r,
        scheduledClass: classData.find((c) => c.id === r.scheduledClassId),
      }));
      setReservations(enriched);
      setReservationsLoading(false);
    });
  }, [user]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return 'N/D';
    const date =
      timestamp instanceof Date ? timestamp : new Date(timestamp as string);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === 'confirmed')
      return <CheckCircle className='w-5 h-5 text-green-500' />;
    if (status === 'cancelled')
      return <XCircle className='w-5 h-5 text-red-500' />;
    return null;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'confirmed') return UI.badge.green;
    if (status === 'cancelled') return UI.badge.red;
    return UI.badge.base;
  };

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

  return (
    <Layout>
      {/* Page header */}
      <div className='mb-6'>
        <h1 className={`${UI.text.heading} mb-1`}>Mi Cuenta</h1>
        <p className={UI.text.soft}>Gestiona tu perfil y reservas</p>
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
          ) : reservations.length > 0 ? (
            <div className='space-y-4'>
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className='card p-6'
                >
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-1'>
                        {getStatusIcon(reservation.status)}
                        <span className={getStatusBadge(reservation.status)}>
                          {reservation.status === 'confirmed'
                            ? 'Confirmada'
                            : reservation.status === 'cancelled'
                              ? 'Cancelada'
                              : reservation.status}
                        </span>
                      </div>
                      <h3 className='text-lg font-semibold text-gray-100 mb-2'>
                        {reservation.scheduledClass?.classTitle ??
                          'Clase desconocida'}
                      </h3>
                      <div className='flex flex-wrap gap-4 text-sm text-ui-text-soft'>
                        {reservation.scheduledClass && (
                          <div className='flex items-center gap-1'>
                            <Calendar className='w-4 h-4' />
                            <span>
                              Clase:{' '}
                              {formatDate(reservation.scheduledClass.date)}
                            </span>
                          </div>
                        )}
                        <div className='flex items-center gap-1'>
                          <span>
                            Reservada: {formatDate(reservation.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Link
                        to={`/classes/${reservation.scheduledClassId}`}
                        className='btn btn-secondary'
                      >
                        Ver Clase
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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

import { RefObject } from 'react';
import { Camera, Save } from 'lucide-react';
import UI from '@/styles';
import { AppUser } from '@/types';

interface ProfileTabProps {
  appUser?: AppUser | null;
  displayName: string;
  avatarUrl: string;
  avatarPreview: string;
  uploading: boolean;
  saving: boolean;
  saveError: string;
  saveSuccess: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDisplayNameChange: (value: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveProfile: () => void;
}

const avatarInitial = (name: string) =>
  name ? name.charAt(0).toUpperCase() : '?';

export default function ProfileTab({
  appUser,
  displayName,
  avatarUrl,
  avatarPreview,
  uploading,
  saving,
  saveError,
  saveSuccess,
  fileInputRef,
  onDisplayNameChange,
  onFileChange,
  onSaveProfile,
}: ProfileTabProps) {
  return (
    <div className='max-w-lg'>
      <div className='flex items-center gap-5 mb-8'>
        <div className='relative flex-shrink-0'>
          <div className='w-20 h-20 rounded-full bg-brand flex items-center justify-center overflow-hidden'>
            {avatarPreview || avatarUrl ? (
              <img
                src={avatarPreview || avatarUrl}
                alt='Avatar'
                className='w-full h-full object-cover'
              />
            ) : (
              <span className='text-3xl font-bold text-ui-text-inverse'>
                {avatarInitial(displayName || appUser?.name || '')}
              </span>
            )}
          </div>

          <button
            type='button'
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className='absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand border-2 border-ui-page flex items-center justify-center hover:bg-brand/80 transition-colors disabled:opacity-50'
            aria-label='Cambiar foto'
          >
            {uploading ? (
              <span className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
            ) : (
              <Camera className='w-3.5 h-3.5 text-ui-text-inverse' />
            )}
          </button>

          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={onFileChange}
          />
        </div>

        <div>
          <p className='text-ui-text font-semibold text-lg'>
            {appUser?.name || 'Sin nombre'}
          </p>
          <p className={UI.text.soft}>{appUser?.email}</p>
          <button
            type='button'
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className='mt-1 text-xs text-brand-light hover:text-brand disabled:opacity-50 transition-colors'
          >
            {uploading ? 'Subiendo...' : 'Cambiar foto'}
          </button>
        </div>
      </div>

      <div className='space-y-5'>
        <div>
          <label className={`${UI.text.label} block mb-1`}>Nombre</label>
          <input
            type='text'
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            className='input w-full'
            placeholder='Tu nombre'
            maxLength={60}
          />
        </div>

        {saveError && <p className={UI.text.error}>{saveError}</p>}
        {saveSuccess && (
          <p className={UI.text.success}>Perfil actualizado correctamente.</p>
        )}

        <button
          onClick={onSaveProfile}
          disabled={saving || uploading}
          className={`${UI.button.base} ${UI.button.primary} ${saving || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Save className='w-4 h-4' />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

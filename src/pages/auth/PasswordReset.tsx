import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { AlertCircle, CheckCircle, KeyRound, Loader2 } from 'lucide-react';

import { auth } from '@/lib/firebase';
import UI from '@/styles';

type ViewState = 'verifying' | 'form' | 'success' | 'error';

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const [viewState, setViewState] = useState<ViewState>('verifying');
  const [email, setEmail] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      const mode = searchParams.get('mode');
      const code = searchParams.get('oobCode');

      if (mode !== 'resetPassword' || !code) {
        setError('El enlace no es valido o ha caducado. Solicita uno nuevo.');
        setViewState('error');
        return;
      }

      try {
        const targetEmail = await verifyPasswordResetCode(auth, code);
        setEmail(targetEmail);
        setOobCode(code);
        setViewState('form');
      } catch {
        setError('El enlace no es valido o ha caducado. Solicita uno nuevo.');
        setViewState('error');
      }
    };

    void run();
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (password.length < 6) {
      setError('La nueva contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setViewState('success');
    } catch {
      setError(
        'No se pudo restablecer la contrasena. Solicita un nuevo enlace.',
      );
      setViewState('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${UI.layout.root} flex items-center justify-center px-4`}>
      <div className='w-full max-w-md card p-6'>
        {viewState === 'verifying' && (
          <div className='flex flex-col items-center text-center gap-4 py-6'>
            <Loader2 className='w-10 h-10 text-primary-400 animate-spin' />
            <h1 className={UI.text.heading}>Verificando enlace</h1>
            <p className={UI.text.soft}>Estamos validando tu solicitud.</p>
          </div>
        )}

        {viewState === 'error' && (
          <div className='flex flex-col items-center text-center gap-4 py-4'>
            <AlertCircle className='w-12 h-12 text-red-400' />
            <h1 className={UI.text.heading}>No se pudo abrir el enlace</h1>
            <p className={UI.text.soft}>{error}</p>
            <Link
              to='/login'
              className='btn btn-primary w-full mt-2'
            >
              Ir a iniciar sesion
            </Link>
          </div>
        )}

        {viewState === 'form' && (
          <>
            <h1 className={`${UI.text.heading} mb-1`}>Nueva contrasena</h1>
            <p className={`${UI.text.soft} mb-6`}>
              Restablece la contrasena para{' '}
              <span className='text-gray-200 font-medium'>{email}</span>.
            </p>

            {error && <div className={`${UI.alert.error} mb-4`}>{error}</div>}

            <form
              onSubmit={handleSubmit}
              className='space-y-4'
            >
              <div>
                <label className='block text-sm text-gray-300 mb-1'>
                  Nueva contrasena
                </label>
                <input
                  type='password'
                  className='input'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className='block text-sm text-gray-300 mb-1'>
                  Confirmar contrasena
                </label>
                <input
                  type='password'
                  className='input'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button
                type='submit'
                className='btn btn-primary w-full inline-flex items-center justify-center gap-2'
                disabled={loading}
              >
                <KeyRound className='w-4 h-4' />
                {loading ? 'Guardando...' : 'Guardar nueva contrasena'}
              </button>
            </form>
          </>
        )}

        {viewState === 'success' && (
          <div className='flex flex-col items-center text-center gap-4 py-4'>
            <CheckCircle className='w-12 h-12 text-green-400' />
            <h1 className={UI.text.heading}>Contrasena actualizada</h1>
            <p className={UI.text.soft}>
              Tu contrasena se ha restablecido correctamente.
            </p>
            <Link
              to='/login'
              className='btn btn-primary w-full mt-2'
            >
              Ir a iniciar sesion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

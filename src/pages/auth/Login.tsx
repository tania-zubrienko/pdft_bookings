import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '@/lib/firebase';
import UI from '@/styles';
import { KeyRound, CheckCircle, Pencil, User } from 'lucide-react';

interface LocationState {
  from?: string;
}
type Tab = 'login' | 'sign_up';
export default function Login() {
  const {
    isAuthenticated,
    login,
    logout,
    signup,
    resendVerificationEmail,
    resetPassword,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedLogin, setUnverifiedLogin] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('login');

  const redirectTo = state?.from || '/classes';

  if (isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // Read emailVerified directly from Firebase to avoid stale React state
      if (!auth?.currentUser?.emailVerified) {
        await logout();
        setUnverifiedLogin(true);
        setError(
          'Por favor, confirme su correo electrónico antes de iniciar sesión.',
        );
        return;
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.warn(err);
      setError('Contraseña o email incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (!email.trim() || !password.trim() || !userName.trim()) {
      return;
    }
    setLoading(true);
    setError('');
    setUnverifiedLogin(false);
    setResendSuccess(false);

    try {
      await signup(email, password, userName);
      setVerificationSent(true);
    } catch (err) {
      setError((err as Error).message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await resendVerificationEmail(email, password);
      setResendSuccess(true);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'EMAIL_ALREADY_VERIFIED') {
        setUnverifiedLogin(false);
        navigate(redirectTo, { replace: true });
      } else {
        setError('No se pudo reenviar el correo. Comprueba tus credenciales.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Introduce tu email para restablecer la contraseña.');
      return;
    }
    setResetLoading(true);
    setResetSuccess(false);
    setError('');
    try {
      await resetPassword(email);
      console.log('sigo');
      setResetSuccess(true);
    } catch {
      setError(
        'No se pudo enviar el correo. Comprueba que el email es correcto.',
      );
    } finally {
      setResetLoading(false);
    }
  };

  const tabClass = (tab: Tab) =>
    `px-6 py-2 text-m font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-primary-500 text-primary-400'
        : 'border-transparent text-ui-text-soft hover:text-gray-200'
    }`;
  return (
    <div className={`${UI.layout.root} flex items-center justify-center px-4`}>
      <div className='w-full max-w-md card p-6'>
        {/** Verification sent confirmation */}
        {verificationSent && (
          <div className='flex flex-col items-center text-center gap-4 py-4'>
            <CheckCircle className='w-12 h-12 text-green-400' />
            <h2 className={UI.text.heading}>¡Revisa tu correo!</h2>
            <p className={UI.text.soft}>
              Te hemos enviado un enlace de confirmación a{' '}
              <span className='text-gray-200 font-medium'>{email}</span>.
              Confirma tu cuenta y luego inicia sesión.
            </p>
            <button
              className='btn btn-primary w-full mt-2'
              onClick={() => {
                setVerificationSent(false);
                setActiveTab('login');
              }}
            >
              Ir al inicio de sesión
            </button>
          </div>
        )}
        {/** Tab Bar */}
        {!verificationSent && (
          <>
            <div className='flex border-b border-ui-border-soft mb-6 justify-around'>
              <button
                className={tabClass('login')}
                onClick={() => setActiveTab('login')}
              >
                <span className='flex items-center gap-2'>
                  <User className='w-4 h-4' />
                  Login
                </span>
              </button>
              <button
                className={tabClass('sign_up')}
                onClick={() => setActiveTab('sign_up')}
              >
                <span className='flex items-center gap-2'>
                  <Pencil className='w-4 h-4' />
                  Crear Cuenta
                </span>
              </button>
            </div>
            {/** Content */}
            <h1 className={`${UI.text.heading} mb-1`}>
              {activeTab === 'login' ? 'Iniciar sesión' : 'Crear nueva cuenta'}
            </h1>
            <p className={`${UI.text.soft} mb-6`}>
              {' '}
              {activeTab === 'login'
                ? 'Accede a las clases y tus reservas'
                : 'Crea tu cuenta para reservar clases y gestionar créditos.'}
            </p>

            {error && <div className={`${UI.alert.error} mb-2`}>{error}</div>}
            {resetSuccess && (
              <div className='flex items-center gap-2 text-green-400 text-sm mb-4'>
                <CheckCircle className='w-4 h-4 flex-shrink-0' />
                Correo de restablecimiento enviado. Revisa tu bandeja de
                entrada.
              </div>
            )}
            {unverifiedLogin && (
              <div className='mb-4'>
                {resendSuccess ? (
                  <div className='flex items-center gap-2 text-green-400 text-sm'>
                    <CheckCircle className='w-4 h-4 flex-shrink-0' />
                    Correo de verificación reenviado. Revisa tu bandeja de
                    entrada.
                  </div>
                ) : (
                  <button
                    type='button'
                    className='text-sm text-primary-400 hover:text-primary-300 underline disabled:opacity-50'
                    onClick={handleResend}
                    disabled={resendLoading}
                  >
                    {resendLoading
                      ? 'Enviando...'
                      : 'Reenviar correo de verificación'}
                  </button>
                )}
              </div>
            )}

            <form
              onSubmit={submit}
              className='space-y-4'
            >
              <div>
                <label className='block text-sm text-gray-300 mb-1'>
                  Email
                </label>
                <input
                  type='email'
                  className='input'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className='block text-sm text-gray-300 mb-1'>
                  Contraseña
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
              {activeTab === 'login' && (
                <div className='flex justify-center'>
                  <button
                    type='button'
                    className='text-xs text-ui-text-soft hover:text-primary-400 flex items-center gap-1 mt-1 disabled:opacity-50'
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                  >
                    <KeyRound className='w-3 h-3' />
                    {resetLoading ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
                  </button>
                </div>
              )}
              {activeTab === 'sign_up' && (
                <div>
                  <label className='block text-sm text-gray-300 mb-1'>
                    Nombre y Apellidos
                  </label>
                  <input
                    type='text'
                    className='input'
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
              )}
              <button
                type='submit'
                className='btn btn-primary w-full'
                disabled={loading}
                onClick={activeTab === 'login' ? submit : register}
              >
                {activeTab === 'login'
                  ? loading
                    ? 'Entrando...'
                    : 'Entrar'
                  : loading
                    ? 'Creando...'
                    : 'Crear cuenta'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UI from '@/styles';

interface LocationState {
  from?: string;
}

export default function Login() {
  const { isAuthenticated, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNew, setIsNew] = useState(false);

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
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError((err as Error).message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (!isNew) {
      setIsNew(true);
      return;
    }
    if (!email.trim() || !password.trim() || !userName.trim()) {
      return;
    }
    setLoading(true);
    setError('');

    try {
      await signup(email, password, userName);
      navigate('/classes', { replace: true });
    } catch (err) {
      setError((err as Error).message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${UI.layout.root} flex items-center justify-center px-4`}>
      <div className='w-full max-w-md card p-6'>
        <h1 className={`${UI.text.heading} mb-1`}>Iniciar sesión</h1>
        <p className={`${UI.text.soft} mb-6`}>
          Accede para reservar clases y gestionar créditos.
        </p>

        {error && <div className={`${UI.alert.error} mb-4`}>{error}</div>}

        <form
          onSubmit={submit}
          className='space-y-4'
        >
          <div>
            <label className='block text-sm text-gray-300 mb-1'>Email</label>
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
          {isNew && (
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
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <button
            type='button'
            className='btn btn-secondary w-full'
            onClick={register}
            disabled={loading}
          >
            Crear cuenta
          </button>
        </form>
      </div>
    </div>
  );
}

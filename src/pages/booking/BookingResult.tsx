import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import UI from '@/styles';

export default function BookingSuccess() {
  const [status, setStatus] = useState<'success' | 'cancelled' | 'unknown'>(
    'unknown',
  );

  useEffect(() => {
    // Determine status based on URL path or params
    if (window.location.pathname.includes('success')) {
      setStatus('success');
    } else if (window.location.pathname.includes('cancelled')) {
      setStatus('cancelled');
    }
  }, []);

  if (status === 'success') {
    return (
      <Layout>
        <div className='max-w-md mx-auto text-center py-12'>
          <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <CheckCircle className='w-12 h-12 text-green-600' />
          </div>

          <h1 className={`${UI.text.heading} mb-4`}>¡Reserva Confirmada!</h1>

          <p className={`${UI.text.soft} mb-8`}>
            Tu clase ha sido reservada con éxito. Te hemos enviado un correo de
            confirmación con todos los detalles.
          </p>

          <div className='space-y-4'>
            <Link
              to='/my-reservations'
              className='btn btn-primary w-full py-3 flex items-center justify-center gap-2'
            >
              Ver Mis Reservas
              <ArrowRight className='w-5 h-5' />
            </Link>

            <Link
              to='/classes'
              className='btn btn-secondary w-full py-3'
            >
              Explorar Más Clases
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === 'cancelled') {
    return (
      <Layout>
        <div className='max-w-md mx-auto text-center py-12'>
          <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <XCircle className='w-12 h-12 text-red-600' />
          </div>

          <h1 className={`${UI.text.heading} mb-4`}>Reserva Cancelada</h1>

          <p className={`${UI.text.soft} mb-8`}>
            Tu pago ha sido cancelado. No se ha realizado ningún cargo. Puedes
            intentarlo de nuevo cuando quieras.
          </p>

          <div className='space-y-4'>
            <Link
              to='/classes'
              className='btn btn-primary w-full py-3'
            >
              Explorar Clases
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={UI.loading.container}>
        <div className={UI.loading.spinner}></div>
      </div>
    </Layout>
  );
}

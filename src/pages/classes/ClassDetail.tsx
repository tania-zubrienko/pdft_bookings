import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ScheduledClass, CreditBalance } from '../../types';
import Layout from '../../components/Layout/Layout';
import { ArrowLeft, Calendar, Users, AlertCircle, Ticket } from 'lucide-react';
import scheduleService from '@/services/schedule.service';
import creditService from '@/services/credit.service';
import { useAuth } from '@/contexts/AuthContext';

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();

  const [classData, setClassData] = useState<ScheduledClass | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!classId) return;

    const fetchData = async () => {
      const [classResult, balanceResult] = await Promise.all([
        scheduleService.getScheduledClassById(classId),
        user
          ? creditService.getCreditBalance(user.uid)
          : Promise.resolve({ remaining: 0, total: 0 }),
      ]);
      setClassData(classResult);
      setCreditBalance(balanceResult);
      setLoading(false);
    };
    fetchData();
  }, [classId, user]);

  const handleBookClass = async () => {
    if (!classData) return;

    setBookingLoading(true);
    setError('');

    try {
      // Mock booking — simulate a short delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('¡Reserva confirmada! (simulación)');
    } catch (err: any) {
      setError(
        err.message || 'Error al reservar la clase. Inténtalo de nuevo.',
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
        </div>
      </Layout>
    );
  }

  if (!classData) {
    return (
      <Layout>
        <div className='text-center py-12'>
          <AlertCircle className='w-16 h-16 text-gray-300 mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Clase No Encontrada
          </h2>
          <p className='text-gray-600 mb-6'>
            La clase que buscas no existe o ha sido eliminada.
          </p>
          <Link
            to='/classes'
            className='btn btn-primary'
          >
            Explorar Clases
          </Link>
        </div>
      </Layout>
    );
  }

  const scheduledDate = classData.date;
  const isFull = classData.enrolledCount >= classData.capacity;
  const spotsLeft = classData.capacity - classData.enrolledCount;

  return (
    <Layout>
      {/* Back Button */}
      <Link
        to='/classes'
        className='inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors'
      >
        <ArrowLeft className='w-5 h-5' />
        Volver a Clases
      </Link>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content */}
        <div className='lg:col-span-2 '>
          {/* Class Info */}
          <h1 className='text-3xl font-bold text-gray-100 mb-4'>
            {classData.classTitle}
          </h1>

          {/* Details Grid */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 '>
            <div className='card rounded-lg p-4'>
              <div className='flex items-center gap-2'>
                <Calendar className='w-6 h-6 text-primary-600' />
                <p className='text-sm text-gray-100 '>Fecha</p>
              </div>
              <p className='font-medium text-gray-100'>
                {formatDate(scheduledDate)} - {formatTime(scheduledDate)}
              </p>
            </div>
            <div className='card rounded-lg p-4'>
              <div className='flex items-center gap-2'>
                <Users className='w-6 h-6 text-primary-600 mb-2' />
                <p className='text-sm text-gray-100'>Plazas</p>
              </div>
              <p className='font-medium text-gray-100'>
                {spotsLeft} / {classData.capacity} disponibles
              </p>
              <p className='text-sm text-gray-100'> Fotos de alumos</p>
            </div>
          </div>

          {/* User */}
          <div className=' card  rounded-xl border p-6 mb-6'>
            <p className='text-sm text-ui-text-soft	 pb-2'>Instructor</p>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center'>
                <span className='text-primary-600 font-bold text-lg'>
                  {classData.instructorName.charAt(0)}
                </span>
              </div>
              <p className='font-medium text-gray-100'>
                {classData.instructorName}
              </p>
            </div>
          </div>
        </div>

        {/* Booking Card */}
        <div className='lg:col-span-1'>
          <div className='card p-6 sticky top-6'>
            {/* Credit Balance */}
            {creditBalance && creditBalance.total > 0 ? (
              <div className='mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg'>
                <div className='flex items-center gap-2 mb-2'>
                  <Ticket className='w-5 h-5 text-indigo-600' />
                  <span className='font-medium text-indigo-900'>
                    Tu Saldo de Clases
                  </span>
                </div>
                <div className='flex items-baseline gap-1'>
                  <span className='text-2xl font-bold text-indigo-700'>
                    {creditBalance.remaining}
                  </span>
                  <span className='text-sm text-indigo-500'>
                    / {creditBalance.total} clases restantes
                  </span>
                </div>
                {/* Progress bar */}
                <div className='mt-2 h-2 bg-indigo-200 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-indigo-600 rounded-full transition-all'
                    style={{
                      width: `${(creditBalance.remaining / creditBalance.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className='mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
                <div className='flex items-center gap-2 mb-2'>
                  <AlertCircle className='w-5 h-5 text-amber-600' />
                  <span className='font-medium text-amber-900'>
                    Sin Créditos Disponibles
                  </span>
                </div>
                <p className='text-sm text-amber-700 mb-3'>
                  Compra un paquete de clases para reservar.
                </p>
                <Link
                  to='/packages'
                  className='btn btn-primary text-sm w-full'
                >
                  Comprar Créditos
                </Link>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm'>
                <AlertCircle className='w-5 h-5 flex-shrink-0' />
                <span>{error}</span>
              </div>
            )}
            <>
              {isFull ?? (
                <div className='flex items-center gap-2'>
                  <AlertCircle className='w-5 h-5 text-red-600' />
                  <span className='font-medium text-red-700'>
                    Clase Completa
                  </span>
                </div>
              )}
            </>
          </div>

          {/* Book Button */}
          {creditBalance && creditBalance.remaining > 0 ? (
            <button
              onClick={handleBookClass}
              disabled={isFull || bookingLoading}
              className='btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2'
            >
              {bookingLoading ? (
                <>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                  Procesando...
                </>
              ) : isFull ? (
                'Clase Completa'
              ) : (
                <>
                  <Ticket className='w-5 h-5' />
                  Usar 1 Crédito para Reservar
                </>
              )}
            </button>
          ) : (
            <Link
              to='/packages'
              className='btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2'
            >
              <Ticket className='w-5 h-5' />
              Obtén Créditos para Reservar
            </Link>
          )}

          <p className='text-xs text-ui-text-soft	 text-center mt-4'>
            1 crédito = 1 reserva de clase
          </p>
        </div>
      </div>
    </Layout>
  );
}

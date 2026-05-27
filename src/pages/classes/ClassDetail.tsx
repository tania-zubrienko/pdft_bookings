import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ScheduledClass,
  AppUser,
  CreditPool,
  Reservation,
  ReservationStatus,
} from '../../types';
import Layout from '../../components/Layout/Layout';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  Ticket,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import scheduleService from '@/services/schedule.service';
import creditService from '@/services/credit.service';
import userService from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';
import UI from '@/styles';
import reservationService from '@/services/reservation.service';
import CreditBalanceCard from '@/pages/account/components/CreditBalance';

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const { user, appUser } = useAuth();

  const [classData, setClassData] = useState<ScheduledClass | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditPool | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingReservation, setExistingReservation] =
    useState<Reservation | null>(null);

  useEffect(() => {
    if (!classId) return;

    const fetchData = async () => {
      const [classResult, currentPool, allStudents, studentReservations] =
        await Promise.all([
          scheduleService.getScheduledClassById(classId),
          user ? creditService.getCurrentPoolByStudent(user.uid) : null,
          userService.getStudents(),
          user ? reservationService.getReservationsByStudent(user.uid) : [],
        ]);
      setClassData(classResult);
      setCreditBalance(currentPool);
      if (classResult) {
        setEnrolledStudents(
          allStudents.filter((s) => classResult.studentIds.includes(s.id)),
        );
        const res =
          studentReservations.find(
            (r) =>
              r.scheduledClassId === classId &&
              r.status === ReservationStatus.Confirmed,
          ) ?? null;
        setExistingReservation(res);
      }
      setLoading(false);
    };
    fetchData();
  }, [classId, user]);

  const alreadyBooked =
    !!appUser && !!classData && classData.studentIds.includes(appUser.id);

  const handleBookClass = async () => {
    if (!classData || !user || !appUser) return;
    if (alreadyBooked) return;
    setBookingLoading(true);
    setError('');
    setSuccess(false);

    try {
      await reservationService.createReservationForStudent(
        classData,
        user,
        creditBalance?.id || null,
        'credit',
      );

      const [updatedClass, updatedPool, allStudents, updatedReservations] =
        await Promise.all([
          scheduleService.getScheduledClassById(classData.id),
          creditService.getCurrentPoolByStudent(user.uid),
          userService.getStudents(),
          reservationService.getReservationsByStudent(user.uid),
        ]);
      if (updatedClass) {
        setClassData(updatedClass);
        setEnrolledStudents(
          allStudents.filter((s) => updatedClass.studentIds.includes(s.id)),
        );
      }
      const updatedRes =
        updatedReservations.find(
          (r) =>
            r.scheduledClassId === classData.id &&
            r.status === ReservationStatus.Confirmed,
        ) ?? null;
      setExistingReservation(updatedRes);
      setCreditBalance(updatedPool);
      setSuccess(true);
    } catch (err: any) {
      const errorMessages: Record<string, string> = {
        CLASS_FULL: 'La clase está completa.',
        ALREADY_BOOKED: 'Ya tienes una reserva para esta clase.',
        NO_VALID_CREDITS: 'No tienes créditos disponibles.',
        CREDIT_POOL_NOT_FOUND: 'No se encontró tu bono de créditos.',
        CLASS_NOT_FOUND: 'La clase no existe.',
        USER_NOT_AUTHENTICATED: 'Debes iniciar sesión para reservar.',
        USER_NOT_FOUND: 'No se encontró tu cuenta de usuario.',
      };
      setError(
        errorMessages[err.message] ??
          'Error al reservar la clase. Inténtalo de nuevo.',
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!classData || !user || !appUser || !existingReservation) return;
    setCancelLoading(true);
    setError('');
    try {
      const success = await reservationService.cancelReservationForStudent({
        ...existingReservation,
      });
      if (!success) throw new Error('CANCEL_FAILED');
      const [updatedClass, allStudents, updatedReservations] =
        await Promise.all([
          scheduleService.getScheduledClassById(classData.id),
          userService.getStudents(),
          reservationService.getReservationsByStudent(user.uid),
        ]);
      if (updatedClass) {
        setClassData(updatedClass);
        setEnrolledStudents(
          allStudents.filter((s) => updatedClass.studentIds.includes(s.id)),
        );
      }
      const updatedRes =
        updatedReservations.find(
          (r) =>
            r.scheduledClassId === classData.id &&
            r.status === ReservationStatus.Confirmed,
        ) ?? null;
      setExistingReservation(updatedRes);
      setSuccess(false);
    } catch {
      setError('Error al cancelar la reserva. Inténtalo de nuevo.');
    } finally {
      setCancelLoading(false);
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
        <div className={UI.loading.container}>
          <div className={UI.loading.spinner}></div>
        </div>
      </Layout>
    );
  }

  if (!classData) {
    return (
      <Layout>
        <div className='text-center py-12'>
          <AlertCircle className='w-16 h-16 text-ui-text-muted mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-ui-text mb-2'>
            Clase No Encontrada
          </h2>
          <p className='text-ui-text-soft mb-6'>
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
        className={`inline-flex items-center gap-2 ${UI.nav.linkInactive} mb-6`}
      >
        <ArrowLeft className='w-5 h-5' />
        Volver a Clases
      </Link>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          <h1 className={UI.text.heading}>{classData.classTitle}</h1>

          {/* Details Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div className='card rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-1'>
                <Calendar className='w-5 h-5 text-brand' />
                <p className='text-sm text-ui-text-muted'>Fecha</p>
              </div>
              <p className='font-medium text-ui-text'>
                {formatDate(scheduledDate)}
              </p>
            </div>

            <div className='card rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-1'>
                <Clock className='w-5 h-5 text-brand' />
                <p className='text-sm text-ui-text-muted'>Hora · Duración</p>
              </div>
              <p className='font-medium text-ui-text'>
                {formatTime(scheduledDate)} · {classData.duration} min
              </p>
            </div>

            <div className='card rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-1'>
                <Users className='w-5 h-5 text-brand' />
                <p className='text-sm text-ui-text-muted'>Plazas</p>
              </div>
              <p className='font-medium text-ui-text'>
                {classData.enrolledCount} / {classData.capacity} inscritos
              </p>
              <p
                className={`text-sm mt-1 ${
                  isFull
                    ? 'text-red-400'
                    : spotsLeft <= 3
                      ? 'text-amber-400'
                      : 'text-green-400'
                }`}
              >
                {isFull
                  ? 'Completa'
                  : `${spotsLeft} plaza${spotsLeft !== 1 ? 's' : ''} libre${spotsLeft !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {/* Instructor */}
          <div className='card rounded-xl p-6'>
            <p className='text-sm text-ui-text-muted pb-2'>Instructor</p>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0'>
                <span className='text-brand font-bold text-lg'>
                  {classData.instructorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className='font-medium text-ui-text'>
                {classData.instructorName}
              </p>
            </div>
          </div>

          {/* Enrolled Students */}
          <div className='card rounded-xl p-6'>
            <p className='text-sm text-ui-text-muted mb-4'>
              Alumnos inscritos ({classData.enrolledCount})
            </p>
            {enrolledStudents.length === 0 ? (
              <p className='text-sm text-ui-text-muted'>
                Aún no hay alumnos inscritos.
              </p>
            ) : (
              <div className='flex flex-wrap gap-4'>
                {enrolledStudents.map((student) => (
                  <div
                    key={student.id}
                    className='flex items-center gap-2'
                  >
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className='w-9 h-9 rounded-full object-cover'
                      />
                    ) : (
                      <div className='w-9 h-9 rounded-full bg-ui-input flex items-center justify-center flex-shrink-0'>
                        <span className='text-white text-sm font-medium'>
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className='text-sm text-ui-text-soft'>
                      {student.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Card */}
        <div className='lg:col-span-1'>
          <div className='card p-6 sticky top-6'>
            {/* Already enrolled: badge + cancel */}
            {alreadyBooked ? (
              <div className='space-y-4'>
                <div className='flex items-center gap-2 px-3 py-2 bg-brand/10 border border-brand/30 rounded-full w-fit'>
                  <CheckCircle className='w-4 h-4 text-brand flex-shrink-0' />
                  <span className='text-sm font-semibold text-brand-light'>
                    Apuntado
                  </span>
                </div>
                <p className='text-sm text-ui-text-soft'>
                  Ya estás inscrito en esta clase.
                </p>
                {error && (
                  <div className={`${UI.alert.error} mb-2`}>
                    <AlertCircle className='w-5 h-5 flex-shrink-0' />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  onClick={handleCancelReservation}
                  disabled={cancelLoading}
                  className='btn w-full py-3 flex items-center justify-center gap-2 border border-red-400 text-red-400 hover:bg-red-400/10 transition-colors rounded-lg'
                >
                  {cancelLoading ? (
                    <>
                      <div className={UI.loading.spinnerSm}></div>
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <XCircle className='w-5 h-5' />
                      Cancelar Reserva
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                {/* Credit Balance */}
                {creditBalance && creditBalance.remainingCredits > 0 && (
                  <CreditBalanceCard
                    {...{
                      remaining: creditBalance.remainingCredits,
                      total: creditBalance.totalCredits,
                      expirationDate: creditBalance.expiresAt,
                    }}
                  />
                )}

                {/* No credits */}
                {(!creditBalance || creditBalance.remainingCredits === 0) && (
                  <div className='mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
                    <div className='flex items-center gap-2 mb-2'>
                      <AlertCircle className='w-5 h-5 text-amber-600' />
                      <span className='font-medium text-amber-900'>
                        Sin Créditos Disponibles
                      </span>
                    </div>
                  </div>
                )}

                {/* Success */}
                {success && (
                  <div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2'>
                    <CheckCircle className='w-5 h-5 text-green-600 flex-shrink-0' />
                    <span className='font-medium text-green-800'>
                      ¡Clase reservada con éxito!
                    </span>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className={`${UI.alert.error} mb-4`}>
                    <AlertCircle className='w-5 h-5 flex-shrink-0' />
                    <span>{error}</span>
                  </div>
                )}

                {/* Class full */}
                {isFull && (
                  <div className='flex items-center gap-2 mb-4'>
                    <AlertCircle className='w-5 h-5 text-red-600' />
                    <span className='font-medium text-red-700'>
                      Clase Completa
                    </span>
                  </div>
                )}

                {/* Book button */}
                {creditBalance && creditBalance.remainingCredits > 0 && (
                  <button
                    onClick={handleBookClass}
                    disabled={isFull || bookingLoading}
                    className='btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2'
                  >
                    {bookingLoading ? (
                      <>
                        <div className={UI.loading.spinnerSm}></div>
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
                )}
                <p className='text-xs text-ui-text-soft text-center mt-4'>
                  1 crédito = 1 reserva de clase
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

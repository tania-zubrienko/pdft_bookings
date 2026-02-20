import { useEffect, useState } from 'react';
import { getReservations } from '../../lib/mockData';
import { Reservation, Class } from '../../types';
import Layout from '../../components/Layout/Layout';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReservationWithClass extends Reservation {
  classData?: Class;
}

export default function MyReservations() {
  const [reservations, setReservations] = useState<ReservationWithClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReservations().then((data) => {
      setReservations(data);
      setLoading(false);
    });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      case 'cancelled':
        return <XCircle className='w-5 h-5 text-red-600' />;
      case 'pending':
        return <AlertCircle className='w-5 h-5 text-yellow-600' />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  return (
    <Layout>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          My Reservations
        </h1>
        <p className='text-gray-600'>View and manage your class bookings</p>
      </div>

      {reservations.length > 0 ? (
        <div className='space-y-4'>
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className='card p-6'
            >
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    {getStatusIcon(reservation.status)}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}
                    >
                      {reservation.status.charAt(0).toUpperCase() +
                        reservation.status.slice(1)}
                    </span>
                    <span className='text-sm text-gray-500'>
                      {reservation.paymentMode === 'credit'
                        ? '(Credit)'
                        : '(Single Payment)'}
                    </span>
                  </div>

                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    Class ID: {reservation.classId}
                  </h3>

                  <div className='flex flex-wrap gap-4 text-sm text-gray-500'>
                    <div className='flex items-center gap-1'>
                      <Calendar className='w-4 h-4' />
                      <span>Booked: {formatDate(reservation.createdAt)}</span>
                    </div>
                    {reservation.paidAt && (
                      <div className='flex items-center gap-1'>
                        <Clock className='w-4 h-4' />
                        <span>Paid: {formatDate(reservation.paidAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex gap-2'>
                  <Link
                    to={`/classes/${reservation.classId}`}
                    className='btn btn-secondary'
                  >
                    View Class
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <Calendar className='w-16 h-16 text-gray-300 mx-auto mb-4' />
          <h3 className='text-xl font-medium text-gray-600 mb-2'>
            No reservations yet
          </h3>
          <p className='text-gray-500 mb-6'>
            Book your first dance class to get started!
          </p>
          <Link
            to='/classes'
            className='btn btn-primary'
          >
            Browse Classes
          </Link>
        </div>
      )}
    </Layout>
  );
}

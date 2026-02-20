import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Layout from '../../components/Layout/Layout';

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

          <h1 className='text-3xl font-bold text-gray-900 mb-4'>
            Booking Confirmed!
          </h1>

          <p className='text-gray-600 mb-8'>
            Your class has been successfully booked. We've sent a confirmation
            email with all the details.
          </p>

          <div className='space-y-4'>
            <Link
              to='/my-reservations'
              className='btn btn-primary w-full py-3 flex items-center justify-center gap-2'
            >
              View My Reservations
              <ArrowRight className='w-5 h-5' />
            </Link>

            <Link
              to='/classes'
              className='btn btn-secondary w-full py-3'
            >
              Browse More Classes
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

          <h1 className='text-3xl font-bold text-gray-900 mb-4'>
            Booking Cancelled
          </h1>

          <p className='text-gray-600 mb-8'>
            Your payment was cancelled. No charges were made. Feel free to try
            again when you're ready.
          </p>

          <div className='space-y-4'>
            <Link
              to='/classes'
              className='btn btn-primary w-full py-3'
            >
              Browse Classes
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
      </div>
    </Layout>
  );
}

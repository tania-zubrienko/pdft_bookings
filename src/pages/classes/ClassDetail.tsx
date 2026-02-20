import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScheduledClassById, getCreditBalance } from '../../lib/mockData';
import { ScheduledClass, CreditBalance } from '../../types';
import Layout from '../../components/Layout/Layout';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle,
  Ticket,
} from 'lucide-react';

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();

  const [classData, setClassData] = useState<ScheduledClass | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!classId) return;

    Promise.all([getScheduledClassById(classId), getCreditBalance()]).then(
      ([classResult, balanceResult]) => {
        setClassData(classResult);
        setCreditBalance(balanceResult);
        setLoading(false);
      },
    );
  }, [classId]);

  const handleBookClass = async () => {
    if (!classData) return;

    setBookingLoading(true);
    setError('');

    try {
      // Mock booking — simulate a short delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Booking confirmed! (mock)');
    } catch (err: any) {
      setError(err.message || 'Failed to book class. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
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
            Class Not Found
          </h2>
          <p className='text-gray-600 mb-6'>
            The class you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to='/classes'
            className='btn btn-primary'
          >
            Browse Classes
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
        Back to Classes
      </Link>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content */}
        <div className='lg:col-span-2'>
          {/* Class Info */}
          <h1 className='text-3xl font-bold text-gray-900 mb-4'>
            {classData.classTitle}
          </h1>

          {/* Details Grid */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
            <div className='bg-gray-50 rounded-lg p-4'>
              <Calendar className='w-6 h-6 text-primary-600 mb-2' />
              <p className='text-sm text-gray-500'>Date</p>
              <p className='font-medium text-gray-900'>
                {formatDate(scheduledDate)}
              </p>
            </div>
            <div className='bg-gray-50 rounded-lg p-4'>
              <Clock className='w-6 h-6 text-primary-600 mb-2' />
              <p className='text-sm text-gray-500'>Time</p>
              <p className='font-medium text-gray-900'>
                {formatTime(scheduledDate)}
              </p>
            </div>
            <div className='bg-gray-50 rounded-lg p-4'>
              <Users className='w-6 h-6 text-primary-600 mb-2' />
              <p className='text-sm text-gray-500'>Spots</p>
              <p className='font-medium text-gray-900'>
                {spotsLeft} / {classData.capacity} available
              </p>
            </div>
            <div className='bg-gray-50 rounded-lg p-4'>
              <Clock className='w-6 h-6 text-primary-600 mb-2' />
              <p className='text-sm text-gray-500'>Duration</p>
              <p className='font-medium text-gray-900'>
                {classData.duration} minutes
              </p>
            </div>
          </div>

          {/* Instructor */}
          <div className='bg-white rounded-xl border border-gray-200 p-6 mb-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Instructor
            </h3>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center'>
                <span className='text-primary-600 font-bold text-lg'>
                  {classData.instructorName.charAt(0)}
                </span>
              </div>
              <div>
                <p className='font-medium text-gray-900'>
                  {classData.instructorName}
                </p>
                <p className='text-sm text-gray-500'>Dance Instructor</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className='bg-white rounded-xl border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Location
            </h3>
            <div className='flex items-center gap-3'>
              <MapPin className='w-5 h-5 text-primary-600' />
              <span className='text-gray-700'>{classData.location}</span>
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
                    Your Class Balance
                  </span>
                </div>
                <div className='flex items-baseline gap-1'>
                  <span className='text-2xl font-bold text-indigo-700'>
                    {creditBalance.remaining}
                  </span>
                  <span className='text-sm text-indigo-500'>
                    / {creditBalance.total} classes remaining
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
                    No Credits Available
                  </span>
                </div>
                <p className='text-sm text-amber-700 mb-3'>
                  Purchase a class package to reserve this class.
                </p>
                <Link
                  to='/packages'
                  className='btn btn-primary text-sm w-full'
                >
                  Buy Credits
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

            {/* Availability Status */}
            <div
              className={`mb-6 p-4 rounded-lg ${isFull ? 'bg-red-50' : 'bg-green-50'}`}
            >
              <div className='flex items-center gap-2'>
                {isFull ? (
                  <>
                    <AlertCircle className='w-5 h-5 text-red-600' />
                    <span className='font-medium text-red-700'>
                      Class is Full
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className='w-5 h-5 text-green-600' />
                    <span className='font-medium text-green-700'>
                      {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} available
                    </span>
                  </>
                )}
              </div>
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
                    Processing...
                  </>
                ) : isFull ? (
                  'Class Full'
                ) : (
                  <>
                    <Ticket className='w-5 h-5' />
                    Use 1 Credit to Reserve
                  </>
                )}
              </button>
            ) : (
              <Link
                to='/packages'
                className='btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2'
              >
                <Ticket className='w-5 h-5' />
                Get Credits to Reserve
              </Link>
            )}

            <p className='text-xs text-gray-500 text-center mt-4'>
              1 credit = 1 class reservation
            </p>

            {/* What's Included */}
            <div className='mt-6 pt-6 border-t border-gray-200'>
              <h4 className='font-medium text-gray-900 mb-3'>
                What's Included
              </h4>
              <ul className='space-y-2 text-sm text-gray-600'>
                <li className='flex items-center gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-500' />
                  {classData.duration} minute class
                </li>
                <li className='flex items-center gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-500' />
                  Professional instruction
                </li>
                <li className='flex items-center gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-500' />
                  All skill levels welcome
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

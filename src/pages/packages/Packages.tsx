import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPackages, getCreditBalance } from '../../lib/mockData';
import { Package, CreditBalance } from '../../types';
import Layout from '../../components/Layout/Layout';
import { CheckCircle, Ticket, Sparkles, ShoppingCart } from 'lucide-react';

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPackages(), getCreditBalance()]).then(([pkgs, balance]) => {
      setPackages(pkgs.filter((p) => p.active));
      setCreditBalance(balance);
      setLoading(false);
    });
  }, []);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);

  const pricePerClass = (pkg: Package) =>
    formatPrice(Math.round(pkg.price / pkg.credits));

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
      {/* Header */}
      <div className='text-center mb-10'>
        <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-3'>
          Class Packages
        </h1>
        <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
          Purchase credits to reserve classes. The more you buy, the more you
          save.
        </p>
      </div>

      {/* Current Balance */}
      {creditBalance && creditBalance.total > 0 && (
        <div className='max-w-md mx-auto mb-10 p-5 bg-indigo-50 border border-indigo-200 rounded-xl'>
          <div className='flex items-center gap-2 mb-2'>
            <Ticket className='w-5 h-5 text-indigo-600' />
            <span className='font-semibold text-indigo-900'>
              Your Current Balance
            </span>
          </div>
          <div className='flex items-baseline gap-1'>
            <span className='text-3xl font-bold text-indigo-700'>
              {creditBalance.remaining}
            </span>
            <span className='text-sm text-indigo-500'>
              / {creditBalance.total} classes remaining
            </span>
          </div>
          <div className='mt-2 h-2 bg-indigo-200 rounded-full overflow-hidden'>
            <div
              className='h-full bg-indigo-600 rounded-full transition-all'
              style={{
                width: `${(creditBalance.remaining / creditBalance.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Package Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto'>
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative rounded-2xl border-2 bg-white p-6 flex flex-col transition-shadow hover:shadow-lg ${
              pkg.highlight ? 'border-primary-500 shadow-md' : 'border-gray-200'
            }`}
          >
            {/* Highlight badge */}
            {pkg.highlight && (
              <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                <span className='inline-flex items-center gap-1 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full'>
                  <Sparkles className='w-3 h-3' />
                  Most Popular
                </span>
              </div>
            )}

            {/* Credits count */}
            <div className='text-center mb-4'>
              <span className='text-5xl font-extrabold text-gray-900'>
                {pkg.credits}
              </span>
              <p className='text-sm text-gray-500 mt-1'>
                {pkg.credits === 1 ? 'class' : 'classes'}
              </p>
            </div>

            {/* Package name */}
            <h3 className='text-lg font-bold text-gray-900 text-center mb-1'>
              {pkg.name}
            </h3>

            {/* Description */}
            {pkg.description && (
              <p className='text-sm text-gray-500 text-center mb-4'>
                {pkg.description}
              </p>
            )}

            {/* Price */}
            <div className='text-center mb-4'>
              <span className='text-3xl font-bold text-primary-600'>
                {formatPrice(pkg.price)}
              </span>
              {pkg.credits > 1 && (
                <p className='text-xs text-gray-400 mt-1'>
                  {pricePerClass(pkg)} per class
                </p>
              )}
            </div>

            {/* Validity */}
            <div className='text-center text-sm text-gray-500 mb-6'>
              Valid for {pkg.validityDays} days
            </div>

            {/* Features */}
            <ul className='space-y-2 text-sm text-gray-600 mb-6 flex-1'>
              <li className='flex items-center gap-2'>
                <CheckCircle className='w-4 h-4 text-green-500 shrink-0' />
                {pkg.credits} class {pkg.credits === 1 ? 'credit' : 'credits'}
              </li>
              <li className='flex items-center gap-2'>
                <CheckCircle className='w-4 h-4 text-green-500 shrink-0' />
                Any class type
              </li>
              <li className='flex items-center gap-2'>
                <CheckCircle className='w-4 h-4 text-green-500 shrink-0' />
                {pkg.validityDays}-day validity
              </li>
            </ul>

            {/* Buy Button */}
            <button
              className={`btn w-full py-3 text-base flex items-center justify-center gap-2 ${
                pkg.highlight ? 'btn-primary' : 'btn-outline'
              }`}
              onClick={() =>
                alert(
                  `Purchase ${pkg.name} for ${formatPrice(pkg.price)} (mock)`,
                )
              }
            >
              <ShoppingCart className='w-4 h-4' />
              Buy {pkg.name}
            </button>
          </div>
        ))}
      </div>

      {/* Back to Classes */}
      <div className='text-center mt-10'>
        <Link
          to='/classes'
          className='text-primary-600 hover:text-primary-700 font-medium transition-colors'
        >
          ← Back to Classes
        </Link>
      </div>
    </Layout>
  );
}

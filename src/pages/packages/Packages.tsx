import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import packageService from '@/services/package.service';
import creditService from '@/services/credit.service';
import { useAuth } from '@/contexts/AuthContext';
import { Package, CreditBalance } from '../../types';
import Layout from '../../components/Layout/Layout';
import { CheckCircle, Ticket, Sparkles, ShoppingCart } from 'lucide-react';
import UI from '@/styles';

export default function Packages() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalance>({
    remaining: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [pkgs, balance] = await Promise.all([
        packageService.getAllPackages(),
        user
          ? creditService.getCreditBalance(user.uid)
          : Promise.resolve({ remaining: 0, total: 0 }),
      ]);
      setPackages(pkgs.filter((p) => p.active));
      setCreditBalance(balance);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  const pricePerClass = (pkg: Package) =>
    formatPrice(Math.round(pkg.price / pkg.credits));

  if (loading) {
    return (
      <Layout>
        <div className={UI.loading.container}>
          <div className={UI.loading.spinner}></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className='text-center mb-10'>
        <h1 className='text-3xl sm:text-4xl font-bold text-ui-text mb-3'>
          Paquetes de Clases
        </h1>
        <p className='text-ui-text-soft text-lg max-w-2xl mx-auto'>
          Compra créditos para reservar clases. Cuantos más compres, más
          ahorras.
        </p>
      </div>

      {/* Current Balance */}
      {creditBalance && creditBalance.total > 0 && (
        <div className='max-w-md mx-auto mb-10 p-5 bg-ui-card border border-ui-border rounded-xl'>
          <div className='flex items-center gap-2 mb-2'>
            <Ticket className='w-5 h-5 text-brand' />
            <span className='font-semibold text-ui-text'>Tu Saldo Actual</span>
          </div>
          <div className='flex items-baseline gap-1'>
            <span className='text-3xl font-bold text-brand'>
              {creditBalance.remaining}
            </span>
            <span className='text-sm text-ui-text-soft'>
              / {creditBalance.total} clases restantes
            </span>
          </div>
          <div className='mt-2 h-2 bg-ui-input rounded-full overflow-hidden'>
            <div
              className='h-full bg-brand rounded-full transition-all'
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
            className={`relative rounded-2xl border-2 bg-ui-card p-6 flex flex-col transition-shadow hover:shadow-lg ${
              pkg.highlight ? 'border-brand shadow-md' : 'border-ui-border-soft'
            }`}
          >
            {/* Highlight badge */}
            {pkg.highlight && (
              <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                <span className={UI.badge.brand}>
                  <Sparkles className='w-3 h-3 mr-1' />
                  Más Popular
                </span>
              </div>
            )}

            {/* Credits count */}
            <div className='text-center mb-4'>
              <span className='text-5xl font-extrabold text-ui-text'>
                {pkg.credits}
              </span>
              <p className='text-sm text-ui-text-soft	 mt-1'>
                {pkg.credits === 1 ? 'clase' : 'clases'}
              </p>
            </div>

            {/* Package name */}
            <h3 className='text-lg font-bold text-ui-text text-center mb-1'>
              {pkg.name}
            </h3>

            {/* Description */}
            {pkg.description && (
              <p className='text-sm text-ui-text-soft	 text-center mb-4'>
                {pkg.description}
              </p>
            )}

            {/* Price */}
            <div className='text-center mb-4'>
              <span className='text-3xl font-bold text-brand'>
                {formatPrice(pkg.price)}
              </span>
              {pkg.credits > 1 && (
                <p className='text-xs text-ui-text-muted mt-1'>
                  {pricePerClass(pkg)} por clase
                </p>
              )}
            </div>

            {/* Validity */}
            <div className='text-center text-sm text-ui-text-soft	 mb-6'>
              Válido por {pkg.validityDays} días
            </div>

            {/* Features */}
            <ul className='space-y-2 text-sm text-ui-text-soft mb-6 flex-1'>
              <li className='flex items-center gap-2'>
                <CheckCircle className='w-4 h-4 text-green-500 shrink-0' />
                {pkg.credits} {pkg.credits === 1 ? 'crédito' : 'créditos'} de
                clase
              </li>
              <li className='flex items-center gap-2'>
                <CheckCircle className='w-4 h-4 text-green-500 shrink-0' />
                Cualquier tipo de clase
              </li>
              <li className='flex items-center gap-2'>
                <CheckCircle className='w-4 h-4 text-green-500 shrink-0' />
                Validez de {pkg.validityDays} días
              </li>
            </ul>

            {/* Buy Button */}
            <button
              className={`btn w-full py-3 text-base flex items-center justify-center gap-2 ${
                pkg.highlight ? 'btn-primary' : 'btn-outline'
              }`}
              onClick={() =>
                alert(
                  `Compra ${pkg.name} por ${formatPrice(pkg.price)} (simulación)`,
                )
              }
            >
              <ShoppingCart className='w-4 h-4' />
              Comprar {pkg.name}
            </button>
          </div>
        ))}
      </div>

      {/* Back to Classes */}
      <div className='text-center mt-10'>
        <Link
          to='/classes'
          className='text-brand hover:text-brand-light font-medium transition-colors'
        >
          ← Volver a Clases
        </Link>
      </div>
    </Layout>
  );
}

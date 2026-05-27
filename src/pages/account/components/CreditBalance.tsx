import { CreditBalance } from '@/types';
import { formatDate } from '@/utils';
import { Ticket } from 'lucide-react';

export default function CreditBalanceCard(credits: CreditBalance) {
  const progress =
    credits.total > 0
      ? Math.min(100, Math.max(0, (credits.remaining / credits.total) * 100))
      : 0;

  return (
    <>
      <div className='mb-4 p-4 bg-ui-card border border-ui-border rounded-lg'>
        <div className='flex items-center gap-2 mb-2'>
          <Ticket className='w-5 h-5 text-brand' />
          <span className='font-medium text-ui-text'>Tu Saldo de Clases</span>
        </div>
        <div className='flex items-baseline gap-1'>
          <span className='text-2xl font-bold text-brand'>
            {credits.remaining}
          </span>
          <span className='text-sm text-ui-text-soft'>
            / {credits.total} clases restantes
          </span>
        </div>
        <div className='mt-2 h-2 bg-ui-input rounded-full overflow-hidden'>
          <div
            className='h-full bg-brand rounded-full transition-all'
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
        {credits.expirationDate && (
          <div className='mt-2 text-sm text-ui-text-soft'>
            <span>Valido hasta: {formatDate(credits.expirationDate)}</span>
          </div>
        )}
      </div>
    </>
  );
}

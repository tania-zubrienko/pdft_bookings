import { CreditBalance } from '@/types';
import { Ticket } from 'lucide-react';

export default function CreditBalanceCard(credits: CreditBalance) {
  function toDateKey(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return (
    <>
      <div className='mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg'>
        <div className='flex items-center gap-2 mb-2'>
          <Ticket className='w-5 h-5 text-indigo-600' />
          <span className='font-medium text-indigo-900'>
            Tu Saldo de Clases
          </span>
        </div>
        <div className='flex items-baseline gap-1'>
          <span className='text-2xl font-bold text-indigo-700'>
            {credits.remaining}
          </span>
          <span className='text-sm text-indigo-500'>
            / {credits.total} clases restantes
          </span>
        </div>
        <div className='mt-2 h-2 bg-indigo-200 rounded-full overflow-hidden'>
          <div
            className='h-full bg-indigo-600 rounded-full transition-all'
            style={{
              width: `${(credits.remaining / credits.total) * 100}%`,
            }}
          />
        </div>
        {credits.expirationDate && (
          <div className='mt-2 text-sm text-indigo-500'>
            <span>Valido hasta: {toDateKey(credits.expirationDate)}</span>
          </div>
        )}
      </div>
    </>
  );
}

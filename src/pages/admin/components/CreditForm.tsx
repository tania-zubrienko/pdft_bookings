import { Coins } from 'lucide-react';
import { FormEvent, useState } from 'react';

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface CreditFormData {
  id?: string;
  credits: number;
  remainingCredits?: number;
  startDate: string;
  expiresAt: string;
  notes: string;
}

export default function CreditForm({
  id,
  initialCredits = 4,
  initialRemainingCredits,
  initialStartDate,
  initialExpiresAt,
  initialNotes = '',
  saving = false,
  onSubmit,
}: {
  id?: string;
  initialCredits?: number;
  initialRemainingCredits?: number;
  initialStartDate?: string;
  initialExpiresAt?: string;
  initialNotes?: string;
  saving?: boolean;
  onSubmit: (data: CreditFormData) => Promise<void>;
}) {
  const [credits, setCredits] = useState(initialCredits);
  const [remainingCredits, setRemainingCredits] = useState(
    initialRemainingCredits ?? initialCredits,
  );
  const [startDate, setStartDate] = useState(
    initialStartDate ?? formatDateInput(new Date()),
  );
  const [expiresAt, setExpiresAt] = useState(
    initialExpiresAt ??
      formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  );
  const [notes, setNotes] = useState(initialNotes);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ id, credits, remainingCredits, startDate, expiresAt, notes });
  };

  const isEdit = Boolean(id);

  return (
    <form
      onSubmit={handleSubmit}
      className='grid grid-cols-1 md:grid-cols-2 gap-4'
    >
      <h2 className='text-lg font-semibold text-gray-100 mb-4 md:col-span-2'>
        {isEdit ? 'Editar pool de créditos' : 'Crear pool de créditos'}
      </h2>

      <div className={isEdit ? '' : 'md:col-span-2'}>
        <label className='block text-sm text-gray-300 mb-1'>Créditos totales</label>
        <input
          type='number'
          min={1}
          step={1}
          className='input'
          value={credits}
          onChange={(e) => {
            const val = Number(e.target.value);
            setCredits(val);
            if (!isEdit) setRemainingCredits(val);
          }}
        />
      </div>

      {isEdit && (
        <div>
          <label className='block text-sm text-gray-300 mb-1'>Créditos restantes</label>
          <input
            type='number'
            min={0}
            max={credits}
            step={1}
            className='input'
            value={remainingCredits}
            onChange={(e) => setRemainingCredits(Number(e.target.value))}
          />
        </div>
      )}

      <div>
        <label className='block text-sm text-gray-300 mb-1'>
          Fecha de inicio
        </label>
        <input
          type='date'
          className='input'
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div>
        <label className='block text-sm text-gray-300 mb-1'>
          Fecha de expiración
        </label>
        <input
          type='date'
          className='input'
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>

      <div className='md:col-span-2'>
        <label className='block text-sm text-gray-300 mb-1'>
          Notas (opcional)
        </label>
        <textarea
          className='input min-h-[84px]'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='Ej. Crédito por promoción o compensación'
        />
      </div>

      <div className='md:col-span-2 flex justify-end'>
        <button
          type='submit'
          className='btn btn-primary inline-flex items-center gap-2'
          disabled={saving}
        >
          <Coins className='w-4 h-4' />
          {saving
            ? 'Guardando...'
            : isEdit
              ? 'Guardar cambios'
              : 'Asignar Créditos'}
        </button>
      </div>
    </form>
  );
}

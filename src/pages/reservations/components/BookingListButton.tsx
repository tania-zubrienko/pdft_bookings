import UI from '@/styles';
import { ChevronDown } from 'lucide-react';

export default function BookingListButton({
  onClick,
  length,
  isOpen,
  name,
}: {
  onClick: () => void;
  length: number;
  isOpen: boolean;
  name: string;
}) {
  return (
    <>
      <button
        className='flex items-center justify-between w-full text-left py-2'
        onClick={onClick}
      >
        <span className={UI.text.label}>
          {name} ({length})
        </span>
        <ChevronDown
          className={`w-4 h-4 text-ui-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
    </>
  );
}

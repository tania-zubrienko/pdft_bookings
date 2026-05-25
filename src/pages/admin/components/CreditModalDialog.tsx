import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import UI from '@/styles';
import { CreditPool } from '@/types';
import CreditForm from './CreditForm';
export default function CreditModalDialog({
  isVisible,
  onClose,
  creditPool,
  onSave,
}: {
  isVisible: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    credits: number;
    startDate: string;
    expiresAt: string;
    notes: string;
  }) => Promise<void>;
  creditPool: CreditPool | null;
}) {
  return (
    <Dialog
      open={isVisible}
      onClose={onClose}
      className={`${UI.card.modal} relative z-10`}
    >
      <DialogBackdrop
        transition
        className='fixed inset-0 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in'
      />

      <div className='fixed inset-0 bg-gray-500/75 z-10 w-screen overflow-y-auto'>
        <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
          <DialogPanel
            transition
            // className='relative transform overflow-hidden rounded-xl text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95'
            className={`${UI.modal}`}
          >
            <div className=' card px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
              <div className='sm:flex sm:items-start'>
                <div className='mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left'>
                  {/*TITLE*/}
                  <DialogTitle
                    as='h3'
                    className={`${UI.text.subheading}`}
                  >
                    Editar créditos
                  </DialogTitle>
                  {/** BODY */}
                  <div className='mt-2 bg-primary'>
                    <CreditForm
                      id={creditPool?.id}
                      initialCredits={
                        creditPool ? creditPool.totalCredits : undefined
                      }
                      initialRemainingCredits={
                        creditPool ? creditPool.remainingCredits : undefined
                      }
                      initialStartDate={
                        creditPool
                          ? creditPool.startDate.toISOString().slice(0, 10)
                          : undefined
                      }
                      initialExpiresAt={
                        creditPool
                          ? creditPool.expiresAt.toISOString().slice(0, 10)
                          : undefined
                      }
                      initialNotes={creditPool?.notes}
                      onSubmit={async (data) => {
                        await onSave(data);
                        onClose();
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

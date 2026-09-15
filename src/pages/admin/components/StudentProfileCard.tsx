import { AppUser } from '@/types';
import { formatDate } from '@/utils';
import {
    Mail,
    Phone,
    Ticket,
    CalendarPlus,
    BadgeCheck,
    CircleDot,
} from 'lucide-react';

interface StudentProfileCardProps {
    student?: AppUser;
    activeCredits: number;
    activeBonosCount: number;
    expirationDate: Date | undefined
}

const avatarInitial = (name: string) =>
    name ? name.charAt(0).toUpperCase() : '?';

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Ticket;
    label: string;
    value: string | number;
}) {
    return (
        <div className='flex items-start gap-2'>
            <Icon className='w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0' />
            <div className='min-w-0'>
                <p className='text-[11px] uppercase tracking-wide text-gray-500'>
                    {label}
                </p>
                <p className='text-sm text-gray-200 truncate'>{value}</p>
            </div>
        </div>
    );
}

export default function StudentProfileCard({
    student,
    activeCredits,
    activeBonosCount,
    expirationDate
}: StudentProfileCardProps) {
    if (!student) {
        return <p className='text-gray-400 text-sm'>Selecciona una alumna.</p>;
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center gap-3'>
                <div className='w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shrink-0'>
                    {student.avatar ? (
                        <img
                            src={student.avatar}
                            alt={student.name}
                            className='w-full h-full object-cover'
                        />
                    ) : (
                        <span className='text-lg font-semibold text-gray-200'>
                            {avatarInitial(student.name)}
                        </span>
                    )}
                </div>
                <p className='text-base font-semibold text-gray-100 truncate'>
                    {student.name}
                </p>
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-3'>
                    <InfoRow
                        icon={Mail}
                        label='Email'
                        value={student.email}
                    />
                    <InfoRow
                        icon={Phone}
                        label='Teléfono'
                        value={student.phone ?? 'No disponible'}
                    />
                    <InfoRow
                        icon={CalendarPlus}
                        label='Añadida'
                        value={student.createdAt ? formatDate(student.createdAt) : 'N/D'}
                    />
                </div>

                <div className='space-y-3'>
                    <InfoRow
                        icon={Ticket}
                        label='Créditos activos'
                        value={activeCredits}
                    />
                    <InfoRow
                        icon={BadgeCheck}
                        label='Bonos activos'
                        value={`${activeBonosCount}  ${(expirationDate && activeBonosCount > 0) ? `(activo hasta ${expirationDate?.toLocaleDateString()})` : ''}`}
                    />
                    <InfoRow
                        icon={CircleDot}
                        label='Estado'
                        value={student.active ? 'Activo' : 'Inactivo'}
                    />

                </div>
            </div>
        </div>
    );
}


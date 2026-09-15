import {
    ClassDefinition,
    ScheduledClass,
    Reservation,
    Instructor,
    Student,
    CreditPool,
    CreditBalance,
    Package,
} from '../types';

// Simulated async delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// MOCK DATA
// ============================================================================

export const mockClassDefinitions: ClassDefinition[] = [
    { id: 'class_1', title: 'Exotic', defaultDuration: 60, defaultCapacity: 12, active: true },
    { id: 'class_2', title: 'Exotic Basic', defaultDuration: 60, defaultCapacity: 12, active: true },
    { id: 'class_3', title: 'Pole Dance', defaultDuration: 60, defaultCapacity: 12, active: true },
    { id: 'class_4', title: 'Pole Choreography', defaultDuration: 60, defaultCapacity: 12, active: true },
    { id: 'class_5', title: 'Aro', defaultDuration: 60, defaultCapacity: 12, active: true },
    { id: 'class_6', title: 'Stretching', defaultDuration: 60, defaultCapacity: 12, active: true },
];

export const mockInstructors: Instructor[] = [
    {
        id: 'instructor_1',
        name: 'Andru Rivera',
        email: 'andru@academy.com',
        specialties: ['Exotic', 'Pole Dance', 'Aro', 'Stretching'],
        active: true,
        avatar: '',
        role: 'instructor',
    },
];

export const mockStudents: Student[] = [
    { id: 'student_1', name: 'John Smith', email: 'john@example.com', active: true, avatar: '', role: 'student' },
    { id: 'student_2', name: 'Emma Johnson', email: 'emma@example.com', active: true, avatar: '', role: 'student' },
    { id: 'student_3', name: 'Michael Brown', email: 'michael@example.com', active: true, avatar: '', role: 'student' },
    { id: 'student_4', name: 'Sarah Davis', email: 'sarah@example.com', active: true, avatar: '', role: 'student' },
    { id: 'student_5', name: 'David Wilson', email: 'david@example.com', active: true, avatar: '', role: 'student' },
];

// Helper function to create date relative to now
const daysFromNow = (days: number, hour: number = 19, minute: number = 0): Date => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, minute, 0, 0);
    return date;
};

export let mockScheduledClasses: ScheduledClass[] = [
    {
        id: 'sched_1',
        classId: 'class_1',
        instructorId: 'instructor_1',
        date: daysFromNow(0, 18, 30),
        duration: 60,
        capacity: 12,
        status: 'active',
        classTitle: 'Exotic',
        instructorName: 'Andru Rivera',
        enrolledCount: 5,
        studentIds: ['student_1', 'student_2', 'student_3', 'student_4', 'student_5'],
    },
    {
        id: 'sched_2',
        classId: 'class_2',
        instructorId: 'instructor_1',
        date: daysFromNow(0, 19, 45),
        duration: 60,
        capacity: 12,
        status: 'active',
        classTitle: 'Exotic Basic',
        instructorName: 'Andru Rivera',
        enrolledCount: 3,
        studentIds: ['student_1', 'student_3', 'student_5'],
    },
    {
        id: 'sched_3',
        classId: 'class_3',
        instructorId: 'instructor_1',
        date: daysFromNow(1, 19, 0),
        duration: 60,
        capacity: 12,
        status: 'active',
        classTitle: 'Pole Dance',
        instructorName: 'Andru Rivera',
        enrolledCount: 2,
        studentIds: ['student_2', 'student_4'],
    },
    {
        id: 'sched_4',
        classId: 'class_4',
        instructorId: 'instructor_1',
        date: daysFromNow(2, 18, 0),
        duration: 60,
        capacity: 12,
        status: 'active',
        classTitle: 'Pole Choreography',
        instructorName: 'Andru Rivera',
        enrolledCount: 1,
        studentIds: ['student_1'],
    },
    {
        id: 'sched_5',
        classId: 'class_5',
        instructorId: 'instructor_1',
        date: daysFromNow(3, 19, 30),
        duration: 60,
        capacity: 12,
        status: 'active',
        classTitle: 'Aro',
        instructorName: 'Andru Rivera',
        enrolledCount: 0,
        studentIds: [],
    },
    {
        id: 'sched_6',
        classId: 'class_6',
        instructorId: 'instructor_1',
        date: daysFromNow(4, 20, 0),
        duration: 60,
        capacity: 12,
        status: 'active',
        classTitle: 'Stretching',
        instructorName: 'Andru Rivera',
        enrolledCount: 0,
        studentIds: [],
    },
    {
        id: 'sched_7',
        classId: 'class_1',
        instructorId: 'instructor_1',
        date: daysFromNow(5, 19, 0),
        duration: 60,
        capacity: 12,
        status: 'active',
        classTitle: 'Exotic',
        instructorName: 'Andru Rivera',
        enrolledCount: 0,
        studentIds: [],
    },
    {
        id: 'sched_8',
        classId: 'class_2',
        instructorId: 'instructor_1',
        date: daysFromNow(6, 20, 30),
        duration: 60,
        capacity: 12,
        status: 'active',
        classTitle: 'Exotic Basic',
        instructorName: 'Andru Rivera',
        enrolledCount: 0,
        studentIds: [],
    },
    {
        id: 'sched_9',
        classId: 'class_3',
        instructorId: 'instructor_1',
        date: daysFromNow(7, 18, 30),
        duration: 60,
        capacity: 12,
        status: 'active',
        classTitle: 'Pole Dance',
        instructorName: 'Andru Rivera',
        enrolledCount: 0,
        studentIds: [],
    },
    {
        id: 'sched_10',
        classId: 'class_4',
        instructorId: 'instructor_1',
        date: daysFromNow(8, 19, 30),
        duration: 60,
        capacity: 12,
        status: 'active',
        classTitle: 'Pole Choreography',
        instructorName: 'Andru Rivera',
        enrolledCount: 0,
        studentIds: [],
    },
    {
        id: 'sched_11',
        classId: 'class_5',
        instructorId: 'instructor_1',
        date: daysFromNow(9, 19, 0),
        duration: 60,
        capacity: 12,
        status: 'active',
        classTitle: 'Aro',
        instructorName: 'Andru Rivera',
        enrolledCount: 0,
        studentIds: [],
    },
    {
        id: 'sched_12',
        classId: 'class_6',
        instructorId: 'instructor_1',
        date: daysFromNow(10, 20, 0),
        duration: 60,
        capacity: 12,
        status: 'active',
        classTitle: 'Stretching',
        instructorName: 'Andru Rivera',
        enrolledCount: 0,
        studentIds: [],
    },
];

export const mockReservations: Reservation[] = [
    {
        id: 'res_1',
        studentId: 'student_1',
        scheduledClassId: 'sched_1',
        status: 'confirmed',
        paymentMode: 'credit',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        creditPoolId: 'pool_1',
    },
    {
        id: 'res_2',
        studentId: 'student_1',
        scheduledClassId: 'sched_2',
        status: 'confirmed',
        paymentMode: 'credit',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        creditPoolId: 'pool_1',
    },
    {
        id: 'res_3',
        studentId: 'student_1',
        scheduledClassId: 'sched_4',
        status: 'confirmed',
        paymentMode: 'credit',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        creditPoolId: 'pool_1',
    },
    {
        id: 'res_4',
        studentId: 'student_2',
        scheduledClassId: 'sched_1',
        status: 'confirmed',
        paymentMode: 'credit',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'res_5',
        studentId: 'student_2',
        scheduledClassId: 'sched_3',
        status: 'confirmed',
        paymentMode: 'credit',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'res_6',
        studentId: 'student_3',
        scheduledClassId: 'sched_1',
        status: 'confirmed',
        paymentMode: 'credit',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'res_7',
        studentId: 'student_3',
        scheduledClassId: 'sched_2',
        status: 'confirmed',
        paymentMode: 'credit',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'res_8',
        studentId: 'student_4',
        scheduledClassId: 'sched_1',
        status: 'confirmed',
        paymentMode: 'credit',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
        id: 'res_9',
        studentId: 'student_4',
        scheduledClassId: 'sched_3',
        status: 'confirmed',
        paymentMode: 'credit',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
        id: 'res_10',
        studentId: 'student_5',
        scheduledClassId: 'sched_1',
        status: 'confirmed',
        paymentMode: 'credit',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
        id: 'res_11',
        studentId: 'student_5',
        scheduledClassId: 'sched_2',
        status: 'confirmed',
        paymentMode: 'credit',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
];

export const mockCreditPools: CreditPool[] = [
    {
        id: 'pool_1',
        studentId: 'student_1',
        totalCredits: 10,
        remainingCredits: 5,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        packageId: 'pkg_regular',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdBy: 'admin_1',
        notes: 'Asignación inicial',
        isActive: true,
    },
];

export const mockPackages: Package[] = [
    {
        id: 'pkg_single',
        name: 'Single Class',
        credits: 1,
        price: 2500, // $25.00
        validityDays: 30,
        active: true,
        description: 'Try a class',
    },
    {
        id: 'pkg_starter',
        name: 'Starter Pack',
        credits: 4,
        price: 8000, // $80.00
        validityDays: 30,
        active: true,
        description: 'Perfect for beginners',
    },
    {
        id: 'pkg_regular',
        name: 'Regular Pack',
        credits: 8,
        price: 14400, // $144.00
        validityDays: 60,
        active: true,
        description: 'Best value for regular students',
        highlight: true,
    },
    {
        id: 'pkg_unlimited',
        name: 'Unlimited Pack',
        credits: 14,
        price: 22400, // $224.00
        validityDays: 90,
        active: true,
        description: 'Maximum flexibility',
    },
];

// ============================================================================
// MOCK API FUNCTIONS
// ============================================================================

export async function getClassDefinitions(): Promise<ClassDefinition[]> {
    await delay(200);
    return [...mockClassDefinitions];
}

export async function getScheduledClasses(): Promise<ScheduledClass[]> {
    await delay(250);
    return [...mockScheduledClasses];
}

export async function getScheduledClassById(id: string): Promise<ScheduledClass | null> {
    await delay(200);
    return mockScheduledClasses.find((sc) => sc.id === id) || null;
}

export async function getReservations(): Promise<Reservation[]> {
    await delay(200);
    // Return reservations for the current student (student_1 in mock)
    return mockReservations.filter((r) => r.studentId === 'student_1');
}

export async function getCreditBalance(): Promise<CreditBalance> {
    await delay(150);
    // Calculate from credit pools for student_1
    const pools = mockCreditPools.filter(
        (p) =>
            p.studentId === 'student_1' &&
            p.startDate <= new Date() &&
            p.expiresAt > new Date()
    );
    const remaining = pools.reduce((sum, p) => sum + p.remainingCredits, 0);
    const total = pools.reduce((sum, p) => sum + p.totalCredits, 0);
    return { remaining, total } as CreditBalance;
}

export async function getCreditPoolsByStudent(studentId: string): Promise<CreditPool[]> {
    await delay(200);
    return mockCreditPools
        .filter((p) => p.studentId === studentId)
        .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())
        .map((p) => ({ ...p }));
}

export interface CreateCreditPoolInput {
    studentId: string;
    credits: number;
    startDate: Date;
    expiresAt: Date;
    packageId?: string;
    notes?: string;
    createdBy?: string;
}

export async function createCreditPool(input: CreateCreditPoolInput): Promise<CreditPool> {
    await delay(250);

    const newPool: CreditPool = {
        id: `pool_${Date.now()}`,
        studentId: input.studentId,
        totalCredits: input.credits,
        remainingCredits: input.credits,
        startDate: input.startDate,
        expiresAt: input.expiresAt,
        packageId: input.packageId,
        createdAt: new Date(),
        createdBy: input.createdBy ?? 'admin_1',
        notes: input.notes?.trim() || undefined,
        isActive: true,
    };

    mockCreditPools.push(newPool);
    return { ...newPool };
}

export async function getPackages(): Promise<Package[]> {
    await delay(200);
    return mockPackages.filter((p) => p.active);
}

export async function getInstructors(): Promise<Instructor[]> {
    await delay(200);
    return mockInstructors.filter((i) => i.active);
}

export async function getStudents(): Promise<Student[]> {
    await delay(200);
    return [...mockStudents];
}

// Admin functions
export interface AdminReservation extends Reservation {
    studentName: string;
    classTitle: string;
    classDate: Date;
}

export async function getAdminReservations(): Promise<AdminReservation[]> {
    await delay(300);
    return mockReservations.map((res) => {
        const student = mockStudents.find((s) => s.id === res.studentId);
        const scheduledClass = mockScheduledClasses.find((sc) => sc.id === res.scheduledClassId);
        return {
            ...res,
            studentName: student?.name || 'Unknown',
            classTitle: scheduledClass?.classTitle || 'Unknown',
            classDate: scheduledClass?.date || new Date(),
        };
    });
}

/**
 * Create a new scheduled class
 */
export async function createScheduledClass(
    classData: Omit<ScheduledClass, 'id' | 'enrolledCount' | 'studentIds'>
): Promise<ScheduledClass> {
    await delay(250);
    const newClass: ScheduledClass = {
        ...classData,
        id: `sched_${Date.now()}`,
        enrolledCount: 0,
        studentIds: [],
    };
    mockScheduledClasses.push(newClass);
    return newClass;
}

/**
 * Update an existing scheduled class
 */
export async function updateScheduledClass(
    id: string,
    updates: Partial<ScheduledClass>
): Promise<ScheduledClass | null> {
    await delay(250);
    const index = mockScheduledClasses.findIndex((sc) => sc.id === id);
    if (index === -1) return null;

    mockScheduledClasses[index] = {
        ...mockScheduledClasses[index],
        ...updates,
    };
    return mockScheduledClasses[index];
}

/**
 * Delete a scheduled class
 */
export async function deleteScheduledClass(id: string): Promise<boolean> {
    await delay(200);
    const index = mockScheduledClasses.findIndex((sc) => sc.id === id);
    if (index === -1) return false;

    mockScheduledClasses.splice(index, 1);
    return true;
}

/**
 * Duplicate a week of classes to the next week
 */
export function duplicateWeek(
    sourceClasses: ScheduledClass[],
    offsetWeeks: number
): ScheduledClass[] {
    const offsetMs = offsetWeeks * 7 * 24 * 60 * 60 * 1000;

    return sourceClasses.map((sourceClass) => {
        const newDate = new Date(sourceClass.date.getTime() + offsetMs);
        return {
            ...sourceClass,
            id: `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: newDate,
            enrolledCount: 0,
            studentIds: [],
        };
    });
}

/**
 * Book a class with credits
 */
export async function bookWithCredits(
    studentId: string,
    scheduledClassId: string
): Promise<{ success: boolean; reservationId?: string; error?: string }> {
    await delay(300);

    // Check if class exists and has capacity
    const classIndex = mockScheduledClasses.findIndex((sc) => sc.id === scheduledClassId);
    if (classIndex === -1) {
        return { success: false, error: 'CLASS_NOT_FOUND' };
    }

    const scheduledClass = mockScheduledClasses[classIndex];
    if (scheduledClass.enrolledCount >= scheduledClass.capacity) {
        return { success: false, error: 'CLASS_FULL' };
    }

    // Check for existing reservation
    const existingReservation = mockReservations.find(
        (r) =>
            r.studentId === studentId &&
            r.scheduledClassId === scheduledClassId &&
            r.status === 'confirmed'
    );
    if (existingReservation) {
        return { success: false, error: 'ALREADY_BOOKED' };
    }

    // Check for valid credits
    const validPools = mockCreditPools.filter(
        (p) =>
            p.studentId === studentId &&
            p.remainingCredits > 0 &&
            p.startDate <= new Date() &&
            p.expiresAt > new Date()
    );

    if (validPools.length === 0) {
        return { success: false, error: 'NO_VALID_CREDITS' };
    }

    // Use FIFO - earliest expiring pool
    validPools.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
    const poolToUse = validPools[0];

    // Decrement credits
    poolToUse.remainingCredits -= 1;

    // Increment enrollment
    mockScheduledClasses[classIndex].enrolledCount += 1;
    mockScheduledClasses[classIndex].studentIds.push(studentId);

    // Create reservation
    const reservationId = `res_${Date.now()}`;
    mockReservations.push({
        id: reservationId,
        studentId,
        scheduledClassId,
        status: 'confirmed',
        paymentMode: 'credit',
        createdAt: new Date(),
        creditPoolId: poolToUse.id,
    });

    return { success: true, reservationId };
}

/**
 * Cancel a reservation
 */
export async function cancelReservation(
    reservationId: string
): Promise<{ success: boolean; error?: string }> {
    await delay(250);

    const reservation = mockReservations.find((r) => r.id === reservationId);
    if (!reservation) {
        return { success: false, error: 'RESERVATION_NOT_FOUND' };
    }

    if (reservation.status === 'cancelled') {
        return { success: false, error: 'ALREADY_CANCELLED' };
    }

    // Update reservation status
    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();

    // Restore credit if payment was with credits
    if (reservation.paymentMode === 'credit' && reservation.creditPoolId) {
        const pool = mockCreditPools.find((p) => p.id === reservation.creditPoolId);
        if (pool) {
            pool.remainingCredits += 1;
        }
    }

    // Decrement enrollment
    const classIndex = mockScheduledClasses.findIndex(
        (sc) => sc.id === reservation.scheduledClassId
    );
    if (classIndex !== -1) {
        mockScheduledClasses[classIndex].enrolledCount -= 1;
        mockScheduledClasses[classIndex].studentIds = mockScheduledClasses[
            classIndex
        ].studentIds.filter((id) => id !== reservation.studentId);
    }

    return { success: true };
}

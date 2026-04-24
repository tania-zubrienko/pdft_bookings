import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import type { CreateCheckoutSessionResponse } from '../types';

interface CreateSingleClassSessionInput {
    classId: string;
}

export interface CloudReservation {
    id: string;
    studentId: string;
    classId: string;
    status: 'pending' | 'paid' | 'cancelled';
    paymentMode: 'single' | 'credit';
    createdAt: unknown;
    paidAt?: unknown;
    creditPoolId?: string;
    paymentIntentId?: string;
    stripeSessionId?: string;
}

function getFunctionsOrThrow() {
    if (!functions) {
        throw new Error('Firebase Functions is not configured. Check your VITE_FIREBASE_* env values.');
    }

    return functions;
}

/**
 * Calls functions.https.onCall("createSingleClassSession")
 */
export async function createSingleClassSession(
    classId: string,
): Promise<CreateCheckoutSessionResponse> {
    const instance = getFunctionsOrThrow();

    const callable = httpsCallable<
        CreateSingleClassSessionInput,
        CreateCheckoutSessionResponse
    >(instance, 'createSingleClassSession');

    const result = await callable({ classId });
    return result.data;
}

/**
 * Calls functions.https.onCall("getMyReservations")
 */
export async function getMyReservations(): Promise<CloudReservation[]> {
    const instance = getFunctionsOrThrow();

    const callable = httpsCallable<Record<string, never>, CloudReservation[]>(
        instance,
        'getMyReservations',
    );

    const result = await callable({});
    return result.data;
}

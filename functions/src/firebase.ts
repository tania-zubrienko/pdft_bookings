import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export { admin };
export const db = admin.firestore();

export const checkIsAdmin = (
  auth: functions.https.CallableContext['auth'],
) => {
  return auth?.token.admin === true;
};

export const checkAuthorized = async (auth: { uid: string } | undefined) => {
  if (!auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in',
    );
  }
  return true;
};

export const checkSameUser = async (uid: string) => {
  const requester = await db.doc(`users/${uid}`).get();
  return requester.data()?.id === uid;
};

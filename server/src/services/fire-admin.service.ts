import { Injectable } from '@nestjs/common';
import admin from 'firebase-admin';
import { UserRecord } from 'firebase-functions/v1/auth';

@Injectable()
export class FireAdminService {
  async getUserData(userId: string): Promise<UserRecord> {
    const auth = admin.auth();
    return await auth.getUser(userId);
  }
  postData(collection: string, data: any, id?: string) {
    const db = admin.firestore();
    if (!id) {
      return db
        .collection(collection)
        .doc()
        .set(JSON.parse(JSON.stringify(data)));
    } else {
      return db
        .collection(collection)
        .doc(id)
        .set(JSON.parse(JSON.stringify(data)));
    }
  }
  getQuery(collection: string) {
    const db = admin.firestore();

    return db.collection(collection);
  }
  getById(collection: string, docId) {
    const db = admin.firestore();
    return db.collection(collection).doc(docId);
  }
  getAll(collection: string) {
    const db = admin.firestore();

    return db.collection(collection).get();
  }
  delete(collection: string, id: string) {
    const db = admin.firestore();
    return db.collection(collection).doc(id).delete();
  }

  updateData(collection: string, data: any, id: string) {
    const db = admin.firestore();
    console.log(id);
    return db.collection(collection).doc(id).set(data, { merge: true });
  }
  async batchWrite(collection: string, data: any[]) {
    const db = admin.firestore();
    let startIndex = 0;
    let endIndex = data.length < 500 ? data.length : 500;

    while (startIndex < data.length) {
      const batch = db.batch();
      let i = startIndex;
      for (i; i < endIndex; i++) {
        if (i == endIndex) {
          console.log(data[i]);
        }
        batch.set(
          db.collection(collection).doc(data[i].id),
          JSON.parse(JSON.stringify(data[i])),
        );
      }
      await batch.commit();
      startIndex = i;
      endIndex =
        data.length - endIndex < 500 ? data.length - endIndex : endIndex + 500;
    }
  }
}

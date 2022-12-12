import { Injectable } from '@nestjs/common';
import admin from 'firebase-admin';

@Injectable()
export class FireAdminService {
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
}

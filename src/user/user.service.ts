import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
interface UploadFile {

  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;

}


@Injectable()
export class UserService {
  // constructor() { }
  constructor(@Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App) { }

  async editData(uid: string, username: string) {
    try {
      const userQuerySnapshot = await this.firebaseAdmin.firestore()
        .collection('Users')
        .where("uid", "==", uid)
        .limit(1)
        .get()
      if (!userQuerySnapshot.empty) {

        const userRef = userQuerySnapshot.docs[0].ref
        const userUpdateStat = userRef.update({
          "username": username
        })
        return userUpdateStat;

      } else {
        return null;
      }

    }
    catch (e) {
      console.log('error create new user', e);
      return e
    }
  }

}

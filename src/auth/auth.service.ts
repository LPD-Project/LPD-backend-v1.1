import { Inject, Injectable } from '@nestjs/common'
import e from 'cors'
import * as admin from 'firebase-admin'
import { User } from 'src/dto/user'


@Injectable()
export class AuthService {
    constructor(@Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App) { }

    async createFirebaseAuthAccount(email: string, password: string) {
        try {
            const userRecord = await this.firebaseAdmin.auth().createUser({
                email: email,
                password: password,
            })

            return userRecord

        } catch (e) {

            return null;
        }

    }



    async create(uid: string, email: string, username: string, imageURL?: string) {
        try {
            const querySnapshot = await this.firebaseAdmin.firestore()
            .collection('Users')
            .where("uid", "==", uid)
            .limit(1)
            .get()

            if(querySnapshot.empty){

                const usersCollectionRef = await this.firebaseAdmin.firestore().collection("Users")

                await usersCollectionRef.add({
                    username: username,
                    email: email,
                    uid: uid,
                    // imageURL:"f"
                    // other fields...
                })
    
                const user = new User(email, uid, username, imageURL)
    
                return user

            }else {
                
                var userData = querySnapshot.docs[0].data() 

                const user = new User(userData["email"], userData["uid"], userData["username"], userData["imageURL"])

                return user;
            
            }

        

        } catch (e) {

            return null;
        }

    }

    async getUserByUid(uid: string) {

        try {

            const querySnapshot = await this.firebaseAdmin.firestore()
                .collection('Users')
                .where("uid", "==", uid)
                .limit(1)
                .get()

            if (!querySnapshot.empty) {

                const userData = querySnapshot.docs[0].data();

                if (userData['uid'] === uid) {

                    const userFound = new User(userData['email'], userData['uid'], userData['username'], userData['imageUrl'], userData['deviceList'])

                    return userFound

                } else {

                    return null;

                }

            } else {

                return null;

            }

        } catch (e) {

            return null;

        }

    }

    async getUserByEmail(email: string) {

        try {

            const querySnapshot = await this.firebaseAdmin.firestore()
                .collection('Users')
                .where("email", "==", email)
                .limit(1)
                .get()

            if (!querySnapshot.empty) {

                const userData = querySnapshot.docs[0].data();

                if (userData['email'] === email) {

                    const userFound = new User(userData['email'], userData['uid'], userData['username'], userData['imageUrl'], userData['deviceList'])

                    return userFound

                } else {

                    return null;

                }

            } else {

                return null;

            }

        } catch (e) {

            return null;

        }

    }

    async updateUserImageByEmail(email: string, imageUrl: string) {

        try {
            const querySnapshot = await this.firebaseAdmin.firestore()
                .collection('Users')
                .where("email", "==", email)
                .limit(1)
                .get()

            if (!querySnapshot.empty) {

                const userData = querySnapshot.docs[0].data();


                if (userData['email'] === email) {

                    const userRef = querySnapshot.docs[0].ref;

                    return await userRef.update({ 'imageUrl': imageUrl })

                } else {

                    return null;

                }

            } else {

                return null;

            }

        } catch (e) {

            return null;

        }

    }


    async getImageUrl(username: string): Promise<string | null> {
        try {

            const querySnapshot = await this.firebaseAdmin.firestore().collection('Users').where("username", "==", username).limit(1).get()

            if (!querySnapshot.empty) {

                const imageUrl = querySnapshot.docs[0].data()['imageUrl']



                console.log(imageUrl)

                return imageUrl


            }

        } catch (error) {

            console.error("Error getting image URL:", error)

            return null

        }
    }

    async getUserImage(uid: string) {
        try {
            const foundUrl =  this.getImageUrl(uid)
            if (foundUrl) {
                const storage = await this.firebaseAdmin.storage()
                const fileName = "Users/" + uid
                const file = storage.bucket().file(fileName)

                const data = await new Promise((resolve, reject) => {
                    file.download()
                        .then(data => resolve(data[0]))
                        .catch(err => reject(err))
                })

                if (data) {
                    return data
                } else {
                    return null
                }
            } else {
                return null
            }

        } catch (e) {
            return null
        }

    }

    async uploadImageToStorage(imageData: Uint8Array, userId: string): Promise<string> {
    
    try {

        // Convert the Uint8Array to a Buffer
        const buffer = Buffer.from(imageData);

        // Get the Firebase Storage bucket
        const bucket = admin.storage().bucket()

        // Upload the image to Firebase Storage with the filename as the user's UID
        await bucket.file(`Users/${userId}`).save(buffer);

        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/Users%2F${userId}?alt=media`;

        console.log("downloadUrl" , downloadUrl)
        return downloadUrl;

    } catch (error) {

        console.error('Error uploading image to storage:', error);

        throw error;

    }

}

  

}

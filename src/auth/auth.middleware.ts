import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor() { }

  use(req: any, res: any, next: NextFunction) {
    try {

      const tokenData = req.headers.authorization;

      if (tokenData.startsWith('Bearer')) {
        const token = tokenData.split(' ')[1];
        try {
          // check if the token work
          admin.auth().verifyIdToken(token).then(async (decode) => {
            const decodedToken = decode;
            console.log(decodedToken);
            try {
              if (decodedToken.email_verified == true) {

                req.headers.authorization = token;
                req.headers.uid = decodedToken.uid;
                req.headers.email = decodedToken.email;
                req.headers.username = decodedToken.email;

                next();
              } else {
                res.status(401)
                res.send({ Error: 'status unverify Authorized 401 error invalid token' });
              }
            } catch (e) {
              res.status(500)
              res.send({ Error: 'server error' });

            }
          }).catch((error) => {
            console.log(error);
          });

        }catch(e){
          res.status(500)
              res.send({ Error: 'server error' });
        }
        

      }
    }
    catch (e) {
      console.log(e);
      res.status(500)
      res.send({ Error: 'server error' });
    }
  }

}


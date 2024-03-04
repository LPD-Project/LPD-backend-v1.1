import { Body, Controller, Get, Inject, Post, Query, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { User } from 'src/dto/user';
import { create } from 'domain';



@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // no middleware here
    @Post('/createUser')
    async createUser(@Req() req: Request, @Res() res: Response): Promise<void> {
        try {


            const user = new User(req.body.email, req.body.uid, req.body.username)


            await this.authService.create(req.body.uid, user.email, user.username, user.imageUrl).then((createdUser) => {

                if (createdUser) {

                    console.log("createdUser", createdUser)

                    console.log(createdUser.uid, createdUser.email, createdUser.username, createdUser.imageUrl, createdUser.deviceList)

                    res.status(200).json({ "uid": createdUser.uid })

                } else {

                    console.log("error here")

                    res.status(500).json({ "message": "create user failed" })

                }

            });

        } catch (err) {

            console.log(err)

            res.status(500).json({ error: 'Internal Server Error' })

        }
    }


    // respond user data
    @Get('/login')
    async login(@Req() req: Request, @Res() res: Response): Promise<void> {

        try {

            var uname;

            if (req.body.username) {

                uname = req.body.username

            } else {

                uname = req.headers.email

            }

            const user = new User(req.headers.email.toString(), req.headers.uid.toString())

            await this.authService.getUserByUid(user.uid).then((userFound) => {

                if (userFound) {

                    console.log(userFound.uid, userFound.email, userFound.username, userFound.imageUrl, userFound.deviceList)

                    res.status(200).json({ "message": "Login Success", "accesstoken": req.headers.authorization.toString(), "uid": userFound.uid, "email": userFound.email, "username": userFound.username, "imageUrl": userFound.imageUrl });

                } else {

                    res.status(500).json({ "message": "Login failed" })

                }

            })



        } catch (err) {

            console.error(err);

            res.status(500).json({ error: 'Internal Server Error' });

        }
    }


    @Get('/login/google')
    async loginGoogleAccount(@Req() req: Request, @Res() res: Response): Promise<void> {
        try {

            var uname;

            if (req.body.username) {

                uname = req.body.username

            } else {

                uname = req.headers.email

            }

            const user = new User(req.headers.email.toString(), req.headers.uid.toString(), uname)

            await this.authService.getUserByUid(user.uid).then(async (userFound) => {

                if (userFound) {

                    console.log(userFound.uid, userFound.email, userFound.username, userFound.imageUrl, userFound.deviceList)

                    res.status(200).json({ "message": "Google Login Success", "accesstoken": req.headers.authorization.toString(), "uid": userFound.uid, "email": userFound.email, "username": userFound.username, "imageUrl": userFound.imageUrl });

                } else {

                    // no user record found 

                    // create a new record for user

                    await this.authService.create(user.uid, user.email, user.username).then((userCreated) => {

                        // create will return null if user already exists
                        
                        // create will return null if user already exists

                        if (userCreated) {
                            
                            res.status(200).json({ "message": "Google Login Success", "accesstoken": req.headers.authorization.toString(), "uid": userCreated.uid, "email": userCreated.email, "username": userCreated.username, "imageUrl": userCreated.imageUrl });


                        } else {

                            res.status(200).json({ "message": "Google Login failed" })

                        }


                    })

                }

            })

        } catch (err) {

            console.log(err)

            res.status(500).json({ error: 'Internal Server Error' })

        }

    }

    // no middleware 
    @Post('user/upload/image')
    async uploadImage(@Req() req: Request, @Res() res: Response) : Promise<void>{
        console.log("upload header ", req.headers);
        console.log("upload body ", req.body);
        console.log("image bytes ", req.body.image);

        var  imageBytes =  req.body.image

        const dowloadUrl = await this.authService.uploadImageToStorage(imageBytes ,  req.body.uid )
        
        console.log("dowloadUrl" , dowloadUrl)

        await this.authService.updateUserImageByEmail(req.body.email, dowloadUrl).then((result) => {
            if (result) {

                res.status(200).json({ "message": "Success" , "url" : dowloadUrl })

            } else {

                res.status(500).json({ "message": "update image failed" })

            }
        })
      }

    @Get('/user/image')
    async giveUserImage(@Req() req: Request, @Res() res: Response): Promise<void> {

        try {
            
            console.log("i am working on giveing image");
            var uname;

            if (req.body.username) {

                uname = req.body.username

            } else {

                uname = req.headers.email

            }

            const user = new User(req.headers.email.toString(), req.headers.uid.toString(), uname)

            console.log("user.uid", user.uid);

            const data = await this.authService.getUserImage(user.uid);

            console.log("data", data);

            if (data) {

                console.log(data)

                res.type('application/octet-stream');

                res.status(200).json({ 'imageBytes': data })

            } else {

                res.status(200).json({ 'message': "no image uploaded" })

            }

        } catch (err) {

            console.log(err)

            res.status(500).json({ error: 'Internal Server Error' })

        }

    }



}

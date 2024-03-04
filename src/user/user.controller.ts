import { Controller, Get, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { Response, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from 'src/dto/user';

@Controller('user')
export class UserController {

    constructor(private readonly userService: UserService) { }

    @Post('/edit')
    async editData(@Req() req: Request, @Res() res: Response): Promise<void> {
        try {

            const user = new User(req.headers.email.toString(), req.headers.uid.toString())

            const userUpdateState = await this.userService.editData(user.uid, req.body.username);

            if (userUpdateState) {
                res.status(200).json({ "message": "Login Success", "accesstoken": req.headers.authorization, "username": req.body.username })
            } else {
                res.status(404).json({ "message": "not found" })
            }

        } catch (err) {
            console.log(err)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }




}

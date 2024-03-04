import { Body, Controller, Get, Inject, Post, Query, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { DeviceService } from './device.service';
import { User } from 'src/dto/user';

@Controller('device')
export class DeviceController {
    // constructor(private gateway: GateWayWebSocket) {}
    constructor(private readonly deviceService: DeviceService) { }

    @Get('/availableDevices')
    async availableDevice(@Req() req: Request, @Res() res: Response): Promise<void> {
        try {  
            // return connected device_serial_code

            const user = new User(req.headers.email.toString(), req.headers.uid.toString())

            const userConnectedDevice = await this.deviceService.getAvailableDevice(user.uid);

            if ( userConnectedDevice.length >= 0  || userConnectedDevice) {
                console.log('userConnectedDevice' , userConnectedDevice )
                res.status(200).json({ 'availableDevice':userConnectedDevice })
            } else {
                res.status(500).json({ 'message': "Internal Server Error after search or paired device" })
            }

        } catch (err) {

            console.log(err)

            res.status(500).json({ error: 'Internal Server Error' })

        }

    }

    @Post('/check')
    async checkPaired(@Req() req: Request, @Res() res: Response): Promise<void> {
        console.log("checking if pairedable")
        
        try {
            console.log("req.body.device_serial_code", req.body.device_serial_code)
            const isPairAble = await this.deviceService.checkPairDevice(req.body.device_serial_code);

            if (isPairAble) {
                res.status(200).json({ 'message': "is pairable" })
            } else {
                res.status(401).json({ 'message': "not pairable" })
            }

        } catch (err) {

            console.log(err)

            res.status(500).json({ error: 'Internal Server Error' })

        }

    }


    // no middleware here
    @Post('/pair')
    async pairDevice(@Req() req: Request, @Res() res: Response): Promise<void> {
        const user = new User(req.headers.email.toString(), req.headers.uid.toString())
        try {
            const devicePairStat = await this.deviceService.pairDeviceWithUserId(user.uid, req.body.device_serial_code , req.body.device_name)
            if (devicePairStat) {
                res.status(200).json({ message: 'paired' })
            } else {
                res.status(500).json({ error: 'device is paired or no device found' })
            }

        } catch (err) {
            console.log(err)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    @Post('/unpair')
    async unPairDevice(@Req() req: Request, @Res() res: Response): Promise<void> {
        const user = new User(req.headers.email.toString(), req.headers.uid.toString())
        try {
            const deviceUnPairStat = await this.deviceService.unPairDeviceWithUserId(user.uid, req.body.device_serial_code)
            if (deviceUnPairStat) {
                res.status(200).json({ message: 'unpaired' })
            } else {
                res.status(500).json({ error: 'device is not paired or device is not found' })
            }

        } catch (err) {
            console.log(err)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    //    when click update at UI 
    @Post('/edit')
    async editDevice(@Req() req: Request, @Res() res: Response): Promise<void> {

        console.log("edit req.body",req.body);
        const imageUrl = await this.deviceService.getImageUrl(req.body.device_serial_code)
        console.log("i got image URL ", imageUrl);
        try {
            // get image url 
            const deviceStat = await this.deviceService.editDevice(req.body.device_serial_code, req.body.device_name, imageUrl)

            if (deviceStat) {
                res.status(200).json({ message: 'unpaired' })
            } else {
                res.status(500).json({ error: 'device is not paired or device is not found' })
            }

        } catch (err) {
            console.log(err)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    @Post('/upload/image')
    async uploadImage(@Req() req: Request, @Res() res: Response): Promise<void> {

        var imageBytes = req.body.image
        const dowloadUrl = await this.deviceService.uploadImageToStorage(imageBytes, req.body.device_serial_code)
        console.log("device image dowloadurl", dowloadUrl)

        await this.deviceService.updateDeviceImageById(req.body.device_serial_code, dowloadUrl).then((result) => {
            if (result) {

                res.status(200).json({ "message": "Success" , "url" : dowloadUrl })

            } else {

                res.status(500).json({ "message": "update image failed" })

            }
        })
    }


    @Post('/image')
    async giveDeviceImage(@Req() req: Request, @Res() res: Response): Promise<void> {

        try {
            console.log("hello req body",req.body)
            console.log("req.body.device_serial_code",  req.body.device_serial_code)
            const data = await this.deviceService.getDeviceImage(req.body.device_serial_code);

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

    @Post('/image/url')
    async deviceImageUrl(@Req() req: Request, @Res() res: Response): Promise<void> {

        try {

            const dowloadUrl = await this.deviceService.getImageUrl(req.body.device_serial_code);

            if (dowloadUrl) {

                console.log(dowloadUrl)

                res.status(200).json({ 'url': dowloadUrl })

            } else {

                res.status(200).json({ 'url': "no image" })

            }

        } catch (err) {

            console.log(err)

            res.status(500).json({ error: 'Internal Server Error' })

        }

    }

    @Post('/state/hardware')
    async getHardwareState(@Req() req: Request, @Res() res: Response): Promise<void> {
        try {
            
            const user = new User(req.headers.email.toString(), req.headers.uid.toString())
            
            const hardwareState = await this.deviceService.getHardwareState(  user.uid ,req.body.device_serial_code);

            if (hardwareState) {

                console.log(hardwareState)

                res.status(200).json({ 'hardwareState': hardwareState })

            } else {

                res.status(400).json({ error: 'Internal Server Error' })

            }

        } catch (err) {

            console.log(err)

            res.status(500).json({ error: 'Internal Server Error' })

        }

    }


}

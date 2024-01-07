import { All, Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @All(':service')
  async proxyRequest (
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.appService.proxyRequest(req, res);
  }
}
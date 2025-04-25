import { Controller, Get, Render, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  getHome(@Req() req: Request) {
    return { 
      title: 'Game Server - Home',
      stylesheets: '',
      scripts: '',
      user: (req.session as any)?.user || null,
      success: null,
      error: null
    };
  }
}

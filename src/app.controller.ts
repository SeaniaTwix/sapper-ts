import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import native from './native'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  hello() {
    return native.hello()
  }

}

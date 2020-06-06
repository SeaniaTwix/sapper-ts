import sirv from 'sirv';
import compression from 'compression';
import * as sapper from '@sapper/server';
import {NestFactory} from '@nestjs/core'
import {AppModule} from './app.module'
import {ValidationPipe} from '@nestjs/common'

import { ignore, session } from './config'

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const comp = compression({ threshold: 0 })
  const statics = sirv('static', { dev })
  app.use(
    comp,
    require('helmet')(),
    statics,
    sapper.middleware({
      ignore,
      session,
    }),
    require('express-rate-limit')({
      windowMs: 900000,
      max: 77,
    })
  )
  app.useGlobalPipes(new ValidationPipe())
  await app.listen(3000)

}

bootstrap().then()

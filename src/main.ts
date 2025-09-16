import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:true,
      forbidNonWhitelisted:true,
      transform:true,
      transformOptions:{
        enableImplicitConversion:true
      }
    })
  )
  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  
    app.enableCors({
      origin:allowedOrigins.length ? allowedOrigins : true,
      methods:'*',
      
    })
  await app.listen(process.env.PORT ?? 4500);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Session middleware for Fred's web auth
  app.use(
    session({
      secret: configService.get('SESSION_SECRET', 'dev-secret'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: configService.get('NODE_ENV') === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );

  // CORS for frontend
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:7847'),
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(`OmniFocus API running on http://localhost:${port}`);
}

bootstrap();

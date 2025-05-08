import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors();

  await app.listen(port);
  Logger.log(
    `🚀 Aplicación corriendo en: http://localhost:${port} 🎉🌐`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  Logger.error(
    `💥 Error al iniciar la aplicación: ${err.message} 🆘`,
    err.stack,
    'Bootstrap',
  );
  process.exit(1);
});

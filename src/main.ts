import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log(">>> INICIANDO SERVIDOR NEST <<<");

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      "http://localhost:3002",
      "https://student-portal-front-production.up.railway.app",
    ],    
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, 
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(Number(process.env.PORT) || 3000);
  console.log('🚀 Servidor corriendo en http://localhost:3000');
  console.log('✅ CORS habilitado para http://localhost:3002');
}
bootstrap();

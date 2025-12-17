import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import axios from 'axios';

async function bootstrap() {
  console.log(">>> INICIANDO SERVIDOR NEST <<<");

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      "https://student-portal-front-production.up.railway.app",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
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



setInterval(async () => {
  try {
    await axios.get(`https://student-portal-api-production.up.railway.app/health`);
    console.log('💓 Hub keep-alive OK');
  } catch (err) {
    console.error('❌ Hub keep-alive FAILED');
  }
}, 60_000); // cada 60 segundos

}
bootstrap();

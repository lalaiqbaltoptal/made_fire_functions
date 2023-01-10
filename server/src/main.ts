import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { swaggerConfig } from './config/swagger-config';

async function bootstrap() {
  const nestFunctions = await NestFactory.create(AppModule, { rawBody: true });
  SwaggerModule.setup(
    'api',
    nestFunctions,
    SwaggerModule.createDocument(nestFunctions, swaggerConfig),
  );
  nestFunctions.enableCors({ origin: true });
  nestFunctions.useGlobalPipes(new ValidationPipe());
  const port = 3000;

  await nestFunctions.listen(port);
}
bootstrap();

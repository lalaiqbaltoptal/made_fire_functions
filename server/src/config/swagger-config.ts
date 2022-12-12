import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Made')
  .setDescription('Career boost')
  .setVersion('1.0')
  .build();

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentModule } from './documents/documents.module';
import { DocumentController } from './documents/documents.controller';
import { Documents } from './documents/documents.entity';
import { MessageController } from './messages/messages.controller';

import environment from './config/environment.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environment],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get('DB_NAME'),
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
        entities: [Documents],
      }),
    }),
    DocumentModule,
  ],
  controllers: [DocumentController, MessageController],
})
export class AppModule {}

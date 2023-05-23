import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './documents/documents.entity';

@Module({
  imports: [    
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db.fxyimzpwblyohtnxjkpd.supabase.co',
      port: 5432,
      username: 'postgres',
      password: 'R8w*u7-4#ZJ8gJ.',
      database: 'postgres',
      entities: [Document],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

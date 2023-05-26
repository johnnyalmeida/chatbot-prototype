import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Documents } from './documents.entity';
import { DocumentService } from './documents.service';

@Module({
  imports: [TypeOrmModule.forFeature([Documents])],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}

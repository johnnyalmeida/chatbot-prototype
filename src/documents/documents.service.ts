import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Documents } from './documents.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Documents) private readonly repo: Repository<Documents>,
  ) {}

  async searchVector(
    queryVector: number[],
    limit: number,
  ): Promise<Documents[]> {
    console.log('QUERY VECTOR', queryVector);
    const matchThreshold = 0.78;
    return await this.repo.query(`SELECT * FROM match_documents($1, $2, $3)`, [
      queryVector,
      matchThreshold,
      limit,
    ]);
  }
}

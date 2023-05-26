import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Documents {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column('int', { array: true, nullable: true })
  embedding: number[];
}

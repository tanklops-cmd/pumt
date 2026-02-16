import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('strip_searches')
export class StripSearch {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  unitId!: string;

  @Column({ nullable: true })
  date!: string;

  @Column({ default: false })
  performed!: boolean;

  @Column({ type: 'simple-json', default: '[]' })
  prisonerIds!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('search_targets')
export class SearchTarget {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  type!: string;

  @Column({ nullable: true })
  value!: string;

  @Column({ nullable: true })
  unitId!: string;

  @Column({ nullable: true })
  date!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

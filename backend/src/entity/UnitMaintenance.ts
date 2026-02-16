import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('unit_maintenance')
export class UnitMaintenance {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  unitId!: string;

  @Column({ nullable: true })
  prisonId!: string;

  @Column({ nullable: true })
  jobDescription!: string;

  @Column({ nullable: true })
  jobNumber!: string;

  @Column({ nullable: true })
  priority!: string;

  @Column({ default: 'Logged' })
  status!: string;

  @Column({ nullable: true })
  addedBy!: string;

  @Column({ nullable: true })
  addedAt!: string;

  @Column({ nullable: true })
  date!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

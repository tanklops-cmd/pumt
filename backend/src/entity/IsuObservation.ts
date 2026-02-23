import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('isu_observations')
export class IsuObservation {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  unitId!: string;

  @Column({ nullable: true })
  prisonId!: string;

  @Column({ nullable: true })
  prisonerId!: string;

  @Column({ nullable: true })
  prisonerName!: string;

  @Column({ nullable: true })
  prisonerCell!: string;

  @Column({ nullable: true })
  interval!: string; // '15' | '30' | '60'

  @Column({ nullable: true })
  activity!: string;

  @Column({ nullable: true })
  observation!: string;

  @Column({ nullable: true })
  recordedBy!: string;

  @Column({ nullable: true })
  recordedAt!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('prisoner_inductions')
export class PrisonerInduction {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  unitId!: string;

  @Column({ nullable: true })
  prisonId!: string;

  @Column({ nullable: true })
  prisonerName!: string;

  @Column({ nullable: true })
  prisonerCell!: string;

  @Column({ default: false })
  laundryNumberAdded!: boolean;

  @Column({ default: false })
  addedToJobsList!: boolean;

  @Column({ default: false })
  sacraCompleted!: boolean;

  @Column({ nullable: true })
  documentName!: string;

  @Column({ nullable: true })
  inductionNotes!: string;

  @Column({ nullable: true })
  inductedBy!: string;

  @Column({ nullable: true })
  inductedAt!: string;

  @Column({ nullable: true })
  date!: string;

  @Column({ default: false })
  pcoNotified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('prisoners')
export class Prisoner {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  name!: string;

  @Column({ nullable: true })
  cell!: string;

  @Column({ nullable: true })
  security!: string;

  @Column({ nullable: true })
  job!: string;

  @Column({ nullable: true })
  notes!: string;

  @Column({ default: false })
  ops!: boolean;

  @Column({ default: false })
  ccs!: boolean;

  @Column({ default: false })
  ntdb!: boolean;

  @Column({ default: false })
  mealBreakfast!: boolean;

  @Column({ default: false })
  mealLunch!: boolean;

  @Column({ default: false })
  mealDinner!: boolean;

  @Column({ nullable: true })
  location!: string;

  @Column({ type: 'simple-json', default: '[]' })
  locationHistory!: Array<{ location: string; from: string; to?: string }>;

  @Column({ nullable: true })
  unitId!: string;

  @Column({ nullable: true })
  category!: string;

  @Column({ default: false })
  protection!: boolean;

  @Column({ default: false })
  laundryNumberAdded!: boolean;

  @Column({ default: false })
  addedToJobsList!: boolean;

  @Column({ default: false })
  sacraCompleted!: boolean;

  @Column({ nullable: true })
  inductionDocumentName!: string;

  @Column({ nullable: true })
  inductionNotes!: string;

  @Column({ nullable: true })
  inductedBy!: string;

  @Column({ nullable: true })
  inductedAt!: string;

  @Column({ default: false })
  pcoNotified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

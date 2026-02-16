import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('muster_confirmations')
export class MusterConfirmation {
  @PrimaryColumn()
  id!: string;

  @Column({ default: false })
  unlock!: boolean;

  @Column({ default: false })
  random!: boolean;

  @Column({ default: false })
  lockup!: boolean;

  @Column({ nullable: true })
  totalMustered!: number;

  @Column({ nullable: true })
  musterdBy!: string;

  @Column({ nullable: true })
  unitId!: string;

  @Column({ nullable: true })
  date!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

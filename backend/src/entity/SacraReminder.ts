import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sacra_reminders')
export class SacraReminder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'unit_id' })
  unitId!: string;

  @Column({ name: 'prisoner1_name' })
  prisoner1Name!: string;

  @Column({ name: 'prisoner2_name' })
  prisoner2Name!: string;

  @Column({ name: 'prisoner1_id' })
  prisoner1Id!: string;

  @Column({ name: 'prisoner2_id' })
  prisoner2Id!: string;

  @Column()
  cell!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'dismissed', default: false })
  dismissed!: boolean;
}

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('daily_tasks')
export class DailyTask {
  @PrimaryColumn()
  id!: string;

  @Column({ nullable: true })
  label!: string;

  @Column({ default: false })
  done!: boolean;

  @Column({ nullable: true })
  unitId!: string;

  @Column({ nullable: true })
  date!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

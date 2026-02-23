import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'type' })
  type!: string;

  @Column()
  title!: string;

  @Column()
  message!: string;

  @Column({ name: 'prisoner_name', nullable: true })
  prisonerName?: string;

  @Column({ name: 'prisoner_cell', nullable: true })
  prisonerCell?: string;

  @Column({ name: 'from_unit', nullable: true })
  fromUnit?: string;

  @Column({ name: 'to_unit', nullable: true })
  toUnit?: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp!: Date;

  @Column({ name: 'dismissed', default: false })
  dismissed!: boolean;
}

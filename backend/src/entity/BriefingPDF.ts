import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('briefing_pdfs')
export class BriefingPDF {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  date!: string;

  @Column({ type: 'text' })
  unit!: string;

  @Column({ type: 'text' })
  uploadedBy!: string;

  @Column({ type: 'text' })
  filePath!: string;

  @Column({ type: 'text', nullable: true })
  originalFileName!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

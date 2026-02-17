import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('prison_briefings')
export class PrisonBriefing {
  @PrimaryColumn()
  prisonId!: string;

  @Column({ type: 'text', nullable: true })
  title!: string;

  @Column({ type: 'text', nullable: true })
  content!: string;

  @Column({ type: 'text', nullable: true })
  postedBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProjectMember } from './project-member.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'app_id', unique: true })
  appId: string;

  @Column({ name: 'app_secret' })
  appSecret: string;

  @Column('simple-array', { name: 'domain_whitelist', nullable: true })
  domainWhitelist: string[];

  @Column('jsonb', { nullable: true, default: {} })
  settings: Record<string, unknown>;

  @Column({ name: 'data_retention_days', default: 90 })
  dataRetentionDays: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members: ProjectMember[];
}

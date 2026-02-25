import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('events')
@Index('idx_events_timestamp', ['timestamp'])
@Index('idx_events_project_event', ['projectId', 'eventName'])
@Index('idx_events_project_timestamp', ['projectId', 'timestamp'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'event_name' })
  eventName: string;

  @Column('jsonb', { default: {} })
  properties: Record<string, unknown>;

  @Column({ type: 'bigint' })
  timestamp: number;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'anonymous_id' })
  anonymousId: string;

  @Column({ name: 'page_url', nullable: true })
  pageUrl: string;

  @Column({ name: 'page_title', nullable: true })
  pageTitle: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'screen_resolution', nullable: true })
  screenResolution: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

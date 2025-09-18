import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ChatMessageRole } from '../enum/roles.enum';

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
  timestamp: string;
}

export interface ConversationMetadata {
  [key: string]: any;
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  messages: ChatMessage[];

  @Column({ type: 'jsonb', default: '{}', nullable: true })
  metadata: ConversationMetadata;

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'uuid' })
  updated_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'updated_by' })
  updater: User;
}

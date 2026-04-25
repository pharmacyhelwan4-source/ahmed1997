import { Timestamp, FieldValue } from 'firebase/firestore';

export type UserRole = 'admin' | 'staff';

export interface Employee {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export type NotebookStage = 'writing' | 'pricing' | 'coding' | 'review' | 'stamping' | 'cutting' | 'delivery' | 'completed';

export interface StageInfo {
  completed: boolean;
  completedAt?: string | Timestamp | FieldValue;
  completedBy?: string;
}

export interface Notebook {
  id: string;
  type: 'computer' | 'invoice';
  month: number;
  year: number;
  computerNumber: number;
  invoiceBookNumber?: number;
  serialStart?: number;
  serialEnd?: number;
  assignedTo: string;
  assignedToName?: string;
  assignedBy: string;
  currentStage: NotebookStage;
  stages: Record<NotebookStage, StageInfo>;
  createdAt: string | Timestamp | FieldValue;
  updatedAt: string | Timestamp | FieldValue;
}

export interface Log {
  id: string;
  notebookId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string | Timestamp | FieldValue;
}

export const STAGES_ORDER: NotebookStage[] = [
  'writing',
  'pricing',
  'coding',
  'review',
  'stamping',
  'cutting',
  'delivery'
];

export const STAGE_LABELS: Record<NotebookStage, string> = {
  writing: 'كتابة',
  pricing: 'تسعير',
  coding: 'تكويد',
  review: 'مراجعة',
  stamping: 'ختم',
  cutting: 'تقطيع',
  delivery: 'تسليم',
  completed: 'مكتمل'
};

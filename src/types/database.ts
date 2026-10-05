export type UserRole = 'super_admin' | 'admin';
export type UserStatus = 'active' | 'inactive';

export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  can_reply: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved' | 'archived';

export interface Feedback {
  id: string;
  rating: number; // 1 to 5
  service_id: string | null;
  service_name?: string; // joined or mapped
  comment: string;
  customer_name: string | null;
  customer_phone: string | null;
  image_url?: string | null;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
}

export type QuestionStatus = 'received' | 'replied';

export interface Question {
  id: string;
  customer_name: string;
  customer_phone: string;
  question: string;
  status: QuestionStatus;
  created_at: string;
  responded_at: string | null;
  responded_by: string | null;
  responder_name?: string | null; // joined from profiles
}

export interface AppSettings {
  id?: number;
  business_name: string;
  logo_url: string;
  welcome_message: string;
  whatsapp_number: string;
  support_message: string;
  reply_template: string;
  feedback_phone_required: boolean;
  updated_at?: string;
}

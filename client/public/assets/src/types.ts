export interface User {
  id: number;
  email: string;
  role: 'admin' | 'student' | 'professor' | 'developer';
  name: string;
  xp: number;
  streak: number;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  order_index: number;
}

export interface Lesson {
  id: number;
  level_id: number;
  title: string;
  content: string;
  order_index: number;
}

export interface UserProgress {
  user_id: number;
  lesson_id: number;
  completed_at: string;
  score: number;
}

export interface Tutor {
  id: number;
  name: string;
  location: string;
  rating: number;
  classes_count: number;
  price_per_hour: number;
  bio: string;
  languages: string; // JSON string
  specialties: string; // JSON string
  available: boolean;
  avatar: string;
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  period: string;
  features: string; // JSON string
  is_popular: boolean;
  tag: string;
}

export interface UserSettings {
  user_id: number;
  theme: 'light' | 'dark';
  learning_language: string;
  notifications: boolean;
}

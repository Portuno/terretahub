import React from 'react';

export interface Pillar {
  area: string;
  content: string;
  icon?: React.ReactNode;
}

export interface ContactFormState {
  name: string;
  email: string;
  message: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  handle: string;
  avatar: string;
  tags: string[];
  hasLinkBio?: boolean; // Indica si el perfil tiene link in bio configurado
  createdAt?: string; // Fecha de creación del perfil
  profileViewsCount?: number; // Cantidad de visitas al perfil
}

export type AppView = 'landing' | 'app' | 'public_profile';

// --- AUTH TYPES ---
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string; // The slug for the link-in-bio
  avatar: string;
  role: 'normal' | 'admin';
}

// --- LINK IN BIO TYPES ---

export type BlockType = 'link' | 'text' | 'header' | 'video' | 'music' | 'gallery' | 'cv';

export interface BioBlock {
  id: string;
  type: BlockType;
  title?: string; // For links or headers
  url?: string; // For links, video, music
  content?: string; // For text blocks
  icon?: string; // For links (e.g., 'instagram', 'star', 'heart')
  images?: string[]; // For gallery blocks
  isVisible: boolean;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
  spotify?: string;
  website?: string;
}

export interface BioTheme {
  id: string;
  name: string;
  bgType: 'color' | 'gradient' | 'image';
  bgColor: string; // fallback color or solid color
  backgroundImage?: string; // URL for background image
  textColor: string;
  buttonStyle: 'solid' | 'outline' | 'soft' | 'pill'; 
  buttonColor: string;
  buttonTextColor: string;
  font: 'serif' | 'sans';
}

export interface LinkBioProfile {
  username: string; // slug
  displayName: string;
  bio: string;
  avatar: string;
  cvUrl?: string; // URL to the PDF CV
  socials: SocialLinks;
  blocks: BioBlock[];
  theme: BioTheme;
}

// --- AGORA (SOCIAL FEED) TYPES ---

export interface AgoraComment {
  id: string;
  author: {
    name: string;
    avatar: string;
    handle: string;
  };
  content: string;
  timestamp: string;
}

export interface AgoraPost {
  id: string;
  authorId: string; // ID del autor para verificar permisos
  author: {
    name: string;
    avatar: string;
    handle: string;
    role?: string;
  };
  content: string;
  timestamp: string;
  comments: AgoraComment[];
  imageUrls?: string[]; // URLs de imágenes (máximo 4, o 3 si hay video)
  videoUrl?: string | null; // URL del video (máximo 1)
  linkUrl?: string | null; // URL de enlace externo opcional
}

// --- PROJECT TYPES ---

export type ProjectPhase = 'Idea' | 'MVP' | 'Mercado Temprano' | 'Escalado';
export type ProjectStatus = 'draft' | 'review' | 'published';

export interface Project {
  id: string;
  authorId: string;
  name: string;
  slogan: string;
  description: string; // The pitch
  images: string[]; // URLs or base64
  videoUrl?: string;
  website?: string; // URL del sitio web del proyecto
  categories: string[];
  technologies: string[];
  phase: ProjectPhase;
  status: ProjectStatus;
  createdAt: string;
}

// --- NOTIFICATIONS TYPES ---

export type NotificationType = 'comment' | 'project_approved' | 'project_rejected' | 'mention';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  created_at: string;
}

// --- EVENTS TYPES ---

export type EventStatus = 'draft' | 'review' | 'published' | 'cancelled' | 'completed';
export type AttendanceStatus = 'registered' | 'attended' | 'cancelled';

export interface Event {
  id: string;
  organizerId: string;
  organizer: {
    name: string;
    avatar: string;
    username: string;
  };
  title: string;
  description?: string;
  location?: string;
  locationUrl?: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  category?: string;
  isOnline: boolean;
  maxAttendees?: number;
  registrationRequired: boolean;
  status: EventStatus;
  attendeeCount: number;
  isUserRegistered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  userId: string;
  status: AttendanceStatus;
  registeredAt: string;
}
export * from './database.types';

import type {
  BadgeDefinition,
  CommunityPost,
  CommunityPostComment,
  CommunityPostReaction,
  Event,
  PostReactionType,
  UserBadge,
} from './database.types';

// Aliases for convenience
export type PostReaction = CommunityPostReaction;
export type PostComment = CommunityPostComment;

// Extended types with relations
export interface UserBadgeWithDefinition extends UserBadge {
  definition?: BadgeDefinition | null;
}

export interface ProfileWithRoles {
  id: string;
  display_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  area_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  area?: {
    id: string;
    name: string;
  } | null;
  roles: {
    role: string;
    area_id: string | null;
    dance_group_id: string | null;
    is_active: boolean;
  }[];
  user_badges?: UserBadgeWithDefinition[];
}

export interface EventLiturgicalRoster {
  presider_name: string | null;
  presider_id: string | null;
  choir_name: string | null;
  choir_group_id: string | null;
  lectors: string[] | null;
  acolytes_guild: string | null;
  sponsor_chapter: string | null;
  mass_sequence_number: number | null;
}

export interface EventWithCreator extends Partial<EventLiturgicalRoster> {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  event_type: string;
  visibility: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  location_name: string | null;
  location_address: string | null;
  featured_image: string | null;
  is_published: boolean;
  created_at: string;
  creator?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export interface EventWithRoster extends Event {
  presider?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  choir_group?: {
    id: string;
    name: string;
  } | null;
}

export interface CommunityPostWithAuthor extends CommunityPost {
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    user_badges?: UserBadgeWithDefinition[];
  } | null;
  event?: (Event & Partial<EventLiturgicalRoster>) | null;
  reactions?: CommunityPostReaction[];
  reaction_counts?: {
    amen: number;
    heart: number;
    like: number;
    total: number;
  };
  user_reaction?: PostReactionType | null;
  comments_count?: number;
}

export interface CommunityPostCommentWithAuthor extends CommunityPostComment {
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    user_badges?: UserBadgeWithDefinition[];
  } | null;
}

export interface NovenaDayProgress {
  day_number: number;
  cycle_year: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface RequestWithDetails {
  id: string;
  request_type: string;
  title: string;
  description: string;
  is_urgent: boolean;
  is_private: boolean;
  status: string;
  created_at: string;
  requester?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  assigned_to_user?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  area?: {
    id: string;
    name: string;
  } | null;
}

// Navigation types
export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  roles?: string[];
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  profile: ProfileWithRoles | null;
}

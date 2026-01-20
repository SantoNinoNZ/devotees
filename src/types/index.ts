export * from './database.types';

// Extended types with relations
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
}

export interface EventWithCreator {
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

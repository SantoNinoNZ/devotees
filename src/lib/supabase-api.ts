import { supabase } from './supabase';
import type {
  Event,
  EventType,
  EventVisibility,
  Novena,
  Request,
  RequestType,
  RequestStatus,
  Announcement,
  Area,
  Profile,
  UserRole,
  ProfileWithRoles,
  BadgeDefinition,
  CommunityPost,
  CommunityPostInsert,
  CommunityPostComment,
  CommunityPostReaction,
  UserBadge,
  UserBadgeWithDefinition,
  NovenaProgress,
  NovenaProgressInsert,
  CommunityPostType,
  IntentionCategory,
  PostReactionType,
  CommunityPostWithAuthor,
  CommunityPostCommentWithAuthor,
  EventWithRoster,
} from '@/types';

// Extended event type with RSVP counts and relations
export interface EventWithDetails extends Event {
  // Location fields (from extended events)
  location_name?: string | null;
  organizer?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  rsvp_going_count?: number;
  rsvp_maybe_count?: number;
  user_rsvp?: {
    status: 'going' | 'maybe' | 'not_going';
    notes: string | null;
  } | null;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
  notes: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface NovenaWithProgress extends Novena {
  user_progress?: {
    id: string;
    current_day: number;
    started_at: string;
    completed_at: string | null;
    last_prayed_at: string | null;
  } | null;
}

export interface RequestWithNotes extends Request {
  notes?: {
    id: string;
    content: string;
    created_by: string;
    created_at: string;
    author?: {
      display_name: string;
      avatar_url: string | null;
    };
  }[];
  requester?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  assigned_user?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  area?: {
    id: string;
    name: string;
  } | null;
}

// Events API
export const eventsApi = {
  // Get all events visible to the current user
  async getEvents(options?: {
    category?: EventType;
    limit?: number;
    offset?: number;
    upcoming?: boolean;
  }): Promise<EventWithDetails[]> {
    if (!supabase) return [];

    let query = supabase
      .from('events')
      .select('*')
      .eq('published', true)
      .order('event_start_date', { ascending: true, nullsFirst: false });

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.upcoming) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('event_start_date', today);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    return (data || []) as EventWithDetails[];
  },

  // Get a single event by ID
  async getEvent(eventId: string): Promise<EventWithDetails | null> {
    if (!supabase) return null;

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }

    // Get RSVP counts
    const { count: goingCount } = await supabase
      .from('event_rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'going');

    const { count: maybeCount } = await supabase
      .from('event_rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'maybe');

    // Get current user's RSVP
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let userRsvp = null;

    if (user) {
      const { data: rsvp } = await supabase
        .from('event_rsvps')
        .select('status, notes')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();
      userRsvp = rsvp;
    }

    return {
      ...(event as Record<string, unknown>),
      rsvp_going_count: goingCount || 0,
      rsvp_maybe_count: maybeCount || 0,
      user_rsvp: userRsvp,
    } as EventWithDetails;
  },

  // Get RSVPs for an event
  async getEventRSVPs(eventId: string): Promise<EventRSVP[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('event_rsvps')
      .select(`
        *,
        user:profiles!event_rsvps_user_id_fkey(id, display_name, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching RSVPs:', error);
      return [];
    }

    return (data || []) as EventRSVP[];
  },

  // RSVP to an event
  async rsvp(
    eventId: string,
    status: 'going' | 'maybe' | 'not_going',
    notes?: string
  ): Promise<boolean> {
    if (!supabase) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('event_rsvps') as any).upsert(
      {
        event_id: eventId,
        user_id: user.id,
        status,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,user_id' }
    );

    if (error) {
      console.error('Error RSVPing to event:', error);
      return false;
    }

    return true;
  },

  // Cancel RSVP
  async cancelRsvp(eventId: string): Promise<boolean> {
    if (!supabase) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error canceling RSVP:', error);
      return false;
    }

    return true;
  },

  // Get upcoming events with liturgical roster
  async getUpcomingEvents(limit = 10): Promise<EventWithRoster[]> {
    try {
      if (!supabase) return [];

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('published', true)
        .gte('event_start_date', today)
        .order('event_start_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching upcoming events:', error);
        return [];
      }

      return (data || []) as EventWithRoster[];
    } catch (err) {
      console.error('Error in getUpcomingEvents:', err);
      return [];
    }
  },

  // Get a single event by ID with liturgical roster
  async getEventById(eventId: string): Promise<EventWithRoster | null> {
    try {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Error fetching event by ID:', error);
        return null;
      }

      return data as EventWithRoster;
    } catch (err) {
      console.error('Error in getEventById:', err);
      return null;
    }
  },
};

// Novenas API
export const novenasApi = {
  // Get all available novenas
  async getNovenas(): Promise<Novena[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('novenas')
      .select('*')
      .eq('is_active', true)
      .order('title');

    if (error) {
      console.error('Error fetching novenas:', error);
      return [];
    }

    return data || [];
  },

  // Get a novena with user's progress
  async getNovena(novenaId: string): Promise<NovenaWithProgress | null> {
    if (!supabase) return null;

    const { data: novena, error } = await supabase
      .from('novenas')
      .select('*')
      .eq('id', novenaId)
      .single();

    if (error) {
      console.error('Error fetching novena:', error);
      return null;
    }

    // Get user's progress
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let userProgress = null;

    if (user) {
      const { data: progress } = await supabase
        .from('user_novenas')
        .select('*')
        .eq('novena_id', novenaId)
        .eq('user_id', user.id)
        .is('completed_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      userProgress = progress;
    }

    return {
      ...(novena as Record<string, unknown>),
      user_progress: userProgress,
    } as NovenaWithProgress;
  },

  // Start a novena
  async startNovena(novenaId: string): Promise<string | null> {
    if (!supabase) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('user_novenas') as any)
      .insert({
        novena_id: novenaId,
        user_id: user.id,
        current_day: 1,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error starting novena:', error);
      return null;
    }

    return data?.id || null;
  },

  // Mark a day as completed
  async completeDay(userNovenaId: string, dayNumber: number): Promise<boolean> {
    if (!supabase) return false;

    // First get the novena to check total days
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userNovena } = await (supabase.from('user_novenas') as any)
      .select('*, novena:novenas(total_days)')
      .eq('id', userNovenaId)
      .single();

    if (!userNovena) return false;

    const totalDays = userNovena.novena?.total_days || 9;
    const isComplete = dayNumber >= totalDays;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('user_novenas') as any)
      .update({
        current_day: dayNumber + 1,
        last_prayed_at: new Date().toISOString(),
        completed_at: isComplete ? new Date().toISOString() : null,
      })
      .eq('id', userNovenaId);

    if (error) {
      console.error('Error completing day:', error);
      return false;
    }

    return true;
  },

  // Get user's active novenas
  async getActiveNovenas(): Promise<NovenaWithProgress[]> {
    if (!supabase) return [];

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('user_novenas') as any)
      .select(`
        *,
        novena:novenas(*)
      `)
      .eq('user_id', user.id)
      .is('completed_at', null)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching active novenas:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((un: any) => ({
      ...(un.novena as Novena),
      user_progress: {
        id: un.id,
        current_day: un.current_day,
        started_at: un.started_at,
        completed_at: un.completed_at,
        last_prayed_at: un.last_prayed_at,
      },
    }));
  },

  // Get user's annual novena day progress
  async getUserNovenaProgress(
    userId: string,
    cycleYear?: number
  ): Promise<NovenaProgress[]> {
    try {
      if (!supabase) return [];

      const year = cycleYear ?? new Date().getFullYear();
      const { data, error } = await supabase
        .from('novena_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('cycle_year', year)
        .order('day_number', { ascending: true });

      if (error) {
        console.error('Error fetching novena progress:', error);
        return [];
      }

      return (data || []) as NovenaProgress[];
    } catch (err) {
      console.error('Error in getUserNovenaProgress:', err);
      return [];
    }
  },

  // Mark a specific day of the annual novena as completed (upsert)
  async markDayCompleted(
    userId: string,
    dayNumber: number,
    cycleYear?: number
  ): Promise<NovenaProgress> {
    if (!supabase) throw new Error('Supabase client not initialized');

    const year = cycleYear ?? new Date().getFullYear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('novena_progress') as any)
      .upsert(
        {
          user_id: userId,
          day_number: dayNumber,
          cycle_year: year,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,day_number,cycle_year' }
      )
      .select('*')
      .single();

    if (error) {
      console.error('Error marking day completed:', error);
      throw error;
    }

    return data as NovenaProgress;
  },
};

// Requests API
export const requestsApi = {
  // Get user's own requests
  async getMyRequests(): Promise<RequestWithNotes[]> {
    if (!supabase) return [];

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        area:areas(id, name),
        assigned_user:profiles!requests_assigned_to_fkey(id, display_name, avatar_url)
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return [];
    }

    return (data || []) as RequestWithNotes[];
  },

  // Get a single request with notes
  async getRequest(requestId: string): Promise<RequestWithNotes | null> {
    if (!supabase) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: request, error } = await (supabase.from('requests') as any)
      .select(`
        *,
        area:areas(id, name),
        requester:profiles!requests_requester_id_fkey(id, display_name, avatar_url),
        assigned_user:profiles!requests_assigned_to_fkey(id, display_name, avatar_url)
      `)
      .eq('id', requestId)
      .single();

    if (error || !request) {
      console.error('Error fetching request:', error);
      return null;
    }

    // Get notes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notes } = await (supabase.from('request_notes') as any)
      .select(`
        *,
        author:profiles!request_notes_created_by_fkey(display_name, avatar_url)
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    return {
      ...request,
      notes: notes || [],
    } as RequestWithNotes;
  },

  // Submit a new request
  async submitRequest(requestData: {
    request_type: RequestType;
    title: string;
    description: string;
    is_urgent?: boolean;
    is_private?: boolean;
    visit_address?: string;
    preferred_date?: string;
    preferred_time_slot?: string;
    area_id?: string;
  }): Promise<string | null> {
    if (!supabase) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Get user's profile for contact info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('display_name, email, phone')
      .eq('id', user.id)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('requests') as any)
      .insert({
        ...requestData,
        requester_id: user.id,
        requester_name: profile?.display_name,
        requester_email: profile?.email || user.email,
        requester_phone: profile?.phone,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error submitting request:', error);
      return null;
    }

    return data?.id || null;
  },

  // Add a note to a request
  async addNote(requestId: string, content: string): Promise<boolean> {
    if (!supabase) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('request_notes') as any).insert({
      request_id: requestId,
      content,
      created_by: user.id,
    });

    if (error) {
      console.error('Error adding note:', error);
      return false;
    }

    return true;
  },

  // For Hermanos: Get area requests
  async getAreaRequests(areaId?: string): Promise<RequestWithNotes[]> {
    if (!supabase) return [];

    let query = supabase
      .from('requests')
      .select(`
        *,
        area:areas(id, name),
        requester:profiles!requests_requester_id_fkey(id, display_name, avatar_url),
        assigned_user:profiles!requests_assigned_to_fkey(id, display_name, avatar_url)
      `)
      .order('is_urgent', { ascending: false })
      .order('created_at', { ascending: false });

    if (areaId) {
      query = query.eq('area_id', areaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching area requests:', error);
      return [];
    }

    return (data || []) as RequestWithNotes[];
  },

  // Update request status
  async updateStatus(
    requestId: string,
    status: RequestStatus,
    assignedTo?: string
  ): Promise<boolean> {
    if (!supabase) return false;

    const updates: Record<string, string | null> = { status };

    if (assignedTo) {
      updates.assigned_to = assignedTo;
      updates.assigned_at = new Date().toISOString();
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('requests') as any).update(updates).eq('id', requestId);

    if (error) {
      console.error('Error updating request status:', error);
      return false;
    }

    return true;
  },
};

// Announcements API
export const announcementsApi = {
  // Get visible announcements
  async getAnnouncements(): Promise<Announcement[]> {
    if (!supabase) return [];

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }

    return data || [];
  },

  // Get a single announcement
  async getAnnouncement(announcementId: string): Promise<Announcement | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (error) {
      console.error('Error fetching announcement:', error);
      return null;
    }

    return data;
  },

  // Apply to a casting call
  async applyToCastingCall(
    announcementId: string,
    application: {
      message: string;
      portfolio_url?: string;
      phone?: string;
    }
  ): Promise<boolean> {
    if (!supabase) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('casting_applications') as any).insert({
      announcement_id: announcementId,
      user_id: user.id,
      message: application.message,
      portfolio_url: application.portfolio_url,
      phone: application.phone,
      status: 'pending',
    });

    if (error) {
      console.error('Error submitting application:', error);
      return false;
    }

    return true;
  },

  // Get user's casting applications
  async getMyApplications(): Promise<
    {
      id: string;
      announcement_id: string;
      status: string;
      created_at: string;
      announcement?: Announcement;
    }[]
  > {
    if (!supabase) return [];

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('casting_applications') as any)
      .select(`
        *,
        announcement:announcements(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return [];
    }

    return data || [];
  },
};

// Areas API
export const areasApi = {
  async getAreas(): Promise<Area[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching areas:', error);
      return [];
    }

    return data || [];
  },
};

// Profile API
export const profileApi = {
  async getProfile(userId: string): Promise<ProfileWithRoles | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        area:areas(id, name),
        roles:user_roles(role, area_id, dance_group_id, is_active)
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as ProfileWithRoles;
  },

  async updateProfile(updates: {
    display_name?: string;
    phone?: string;
    avatar_url?: string;
    area_id?: string;
  }): Promise<boolean> {
    if (!supabase) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  },
};

// Helper to format a community post with author, reaction counts, user reaction, and comment counts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatCommunityPost(post: any, currentUserId?: string | null): CommunityPostWithAuthor {
  const reactions: CommunityPostReaction[] = Array.isArray(post.reactions) ? post.reactions : [];
  const amenCount = reactions.filter((r) => r.reaction_type === 'amen').length;
  const heartCount = reactions.filter((r) => r.reaction_type === 'heart').length;
  const likeCount = reactions.filter((r) => r.reaction_type === 'like').length;
  const userReaction = currentUserId
    ? reactions.find((r) => r.user_id === currentUserId)?.reaction_type || null
    : null;
  const commentsCount = Array.isArray(post.comments)
    ? post.comments.length
    : typeof post.comments_count === 'number'
    ? post.comments_count
    : 0;

  return {
    ...post,
    reaction_counts: {
      amen: amenCount,
      heart: heartCount,
      like: likeCount,
      total: reactions.length,
    },
    user_reaction: userReaction,
    comments_count: commentsCount,
  } as CommunityPostWithAuthor;
}

// Community Feed API
export const communityFeedApi = {
  // Get community posts with author, reactions, and event details
  async getFeedPosts(options?: {
    limit?: number;
    offset?: number;
    type?: CommunityPostType;
    category?: IntentionCategory;
    pinnedOnly?: boolean;
  }): Promise<CommunityPostWithAuthor[]> {
    try {
      if (!supabase) return [];

      let currentUserId: string | null = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData?.user?.id || null;
      } catch {
        // Auth not available
      }

      let query = supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles(
            id,
            display_name,
            avatar_url,
            user_badges:user_badges!user_badges_user_id_fkey(
              id,
              user_id,
              badge_id,
              year,
              title_override,
              organization_or_troupe,
              is_featured,
              awarded_at,
              definition:badge_definitions(*)
            )
          ),
          event:events(*),
          reactions:community_post_reactions(*),
          comments:community_post_comments(id)
        `)
        .eq('is_hidden', false);

      if (options?.pinnedOnly) {
        query = query.eq('is_pinned', true);
      }

      if (options?.type) {
        query = query.eq('post_type', options.type);
      }

      if (options?.category) {
        query = query.eq('intention_category', options.category);
      }

      query = query
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (options?.offset !== undefined && options?.limit !== undefined) {
        query = query.range(options.offset, options.offset + options.limit - 1);
      } else if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching feed posts:', error);
        return [];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []).map((p: any) => formatCommunityPost(p, currentUserId));
    } catch (err) {
      console.error('Error in getFeedPosts:', err);
      return [];
    }
  },

  // Get a single post by ID with all relations
  async getPostById(postId: string): Promise<CommunityPostWithAuthor | null> {
    try {
      if (!supabase) return null;

      let currentUserId: string | null = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData?.user?.id || null;
      } catch {
        // Auth not available
      }

      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles(
            id,
            display_name,
            avatar_url,
            user_badges:user_badges!user_badges_user_id_fkey(
              id,
              user_id,
              badge_id,
              year,
              title_override,
              organization_or_troupe,
              is_featured,
              awarded_at,
              definition:badge_definitions(*)
            )
          ),
          event:events(*),
          reactions:community_post_reactions(*),
          comments:community_post_comments(id)
        `)
        .eq('id', postId)
        .single();

      if (error || !data) {
        if (error) console.error('Error fetching post by ID:', error);
        return null;
      }

      return formatCommunityPost(data, currentUserId);
    } catch (err) {
      console.error('Error in getPostById:', err);
      return null;
    }
  },

  // Create a new community post
  async createPost(post: CommunityPostInsert): Promise<CommunityPost> {
    if (!supabase) throw new Error('Supabase client not initialized');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('community_posts') as any)
      .insert({
        ...post,
        created_at: post.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating post:', error);
      throw error;
    }

    return data as CommunityPost;
  },

  // Toggle a reaction on a post (amen, heart, like)
  async toggleReaction(
    postId: string,
    userId: string,
    reactionType: PostReactionType
  ): Promise<{ added: boolean; count: number }> {
    try {
      if (!supabase) return { added: false, count: 0 };

      // Check if user already reacted
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing, error: checkError } = await (supabase.from('community_post_reactions') as any)
        .select('id, reaction_type')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking post reaction:', checkError);
        return { added: false, count: 0 };
      }

      let added = false;
      if (existing) {
        if (existing.reaction_type === reactionType) {
          // Same reaction: toggle off
          const { error: delError } = await supabase
            .from('community_post_reactions')
            .delete()
            .eq('id', existing.id);
          if (delError) {
            console.error('Error removing reaction:', delError);
            return { added: false, count: 0 };
          }
          added = false;
        } else {
          // Different reaction: update reaction type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updError } = await (supabase.from('community_post_reactions') as any)
            .update({ reaction_type: reactionType })
            .eq('id', existing.id);
          if (updError) {
            console.error('Error updating reaction:', updError);
            return { added: false, count: 0 };
          }
          added = true;
        }
      } else {
        // No reaction: insert new reaction
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insError } = await (supabase.from('community_post_reactions') as any)
          .insert({
            post_id: postId,
            user_id: userId,
            reaction_type: reactionType,
          });
        if (insError) {
          console.error('Error inserting reaction:', insError);
          return { added: false, count: 0 };
        }
        added = true;
      }

      // Fetch updated count for this reaction_type
      const { count, error: countError } = await supabase
        .from('community_post_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('reaction_type', reactionType);

      if (countError) {
        console.error('Error fetching reaction count:', countError);
      }

      return { added, count: count ?? 0 };
    } catch (err) {
      console.error('Error in toggleReaction:', err);
      return { added: false, count: 0 };
    }
  },

  // Toggle Amen reaction on a post
  async toggleAmen(postId: string, userId: string): Promise<{ added: boolean; count: number }> {
    return this.toggleReaction(postId, userId, 'amen');
  },

  // Get comments for a post
  async getPostComments(postId: string): Promise<CommunityPostCommentWithAuthor[]> {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('community_post_comments')
        .select(`
          *,
          author:profiles(
            id,
            display_name,
            avatar_url,
            user_badges:user_badges!user_badges_user_id_fkey(
              id,
              user_id,
              badge_id,
              year,
              title_override,
              organization_or_troupe,
              is_featured,
              definition:badge_definitions(*)
            )
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching post comments:', error);
        return [];
      }

      return (data || []) as CommunityPostCommentWithAuthor[];
    } catch (err) {
      console.error('Error in getPostComments:', err);
      return [];
    }
  },

  // Add comment to a post
  async addComment(
    postId: string,
    authorId: string,
    content: string
  ): Promise<CommunityPostCommentWithAuthor> {
    if (!supabase) throw new Error('Supabase client not initialized');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('community_post_comments') as any)
      .insert({
        post_id: postId,
        author_id: authorId,
        content,
      })
      .select(`
        *,
        author:profiles(
          id,
          display_name,
          avatar_url,
          user_badges:user_badges!user_badges_user_id_fkey(
            id,
            user_id,
            badge_id,
            year,
            title_override,
            organization_or_troupe,
            is_featured,
            definition:badge_definitions(*)
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }

    return data as CommunityPostCommentWithAuthor;
  },

  // Pin / unpin a post
  async pinPost(postId: string, isPinned: boolean): Promise<void> {
    if (!supabase) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('community_posts') as any)
      .update({
        is_pinned: isPinned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      console.error('Error pinning post:', error);
      throw error;
    }
  },

  // Hide / unhide a post (moderation)
  async hidePost(postId: string, isHidden: boolean): Promise<void> {
    if (!supabase) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('community_posts') as any)
      .update({
        is_hidden: isHidden,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      console.error('Error hiding post:', error);
      throw error;
    }
  },

  // Delete a post
  async deletePost(postId: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },
};

// Badges API
export const badgesApi = {
  // Get all badge definitions
  async getAllBadgeDefinitions(): Promise<BadgeDefinition[]> {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('badge_definitions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching badge definitions:', error);
        return [];
      }

      return (data || []) as BadgeDefinition[];
    } catch (err) {
      console.error('Error in getAllBadgeDefinitions:', err);
      return [];
    }
  },

  // Get user badges joined with badge definitions
  async getUserBadges(userId: string): Promise<UserBadgeWithDefinition[]> {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          definition:badge_definitions(*)
        `)
        .eq('user_id', userId)
        .order('year', { ascending: false, nullsFirst: false })
        .order('awarded_at', { ascending: false });

      if (error) {
        console.error('Error fetching user badges:', error);
        return [];
      }

      return (data || []) as UserBadgeWithDefinition[];
    } catch (err) {
      console.error('Error in getUserBadges:', err);
      return [];
    }
  },

  // Get user featured badges joined with badge definitions
  async getUserFeaturedBadges(userId: string): Promise<UserBadgeWithDefinition[]> {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          definition:badge_definitions(*)
        `)
        .eq('user_id', userId)
        .eq('is_featured', true)
        .order('year', { ascending: false, nullsFirst: false })
        .order('awarded_at', { ascending: false });

      if (error) {
        console.error('Error fetching featured badges:', error);
        return [];
      }

      return (data || []) as UserBadgeWithDefinition[];
    } catch (err) {
      console.error('Error in getUserFeaturedBadges:', err);
      return [];
    }
  },
};

// Novena Progress API
export const novenaProgressApi = {
  getUserNovenaProgress: (userId: string, cycleYear?: number) =>
    novenasApi.getUserNovenaProgress(userId, cycleYear),
  markDayCompleted: (userId: string, dayNumber: number, cycleYear?: number) =>
    novenasApi.markDayCompleted(userId, dayNumber, cycleYear),
};

export const novenaApi = novenasApi;

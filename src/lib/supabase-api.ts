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

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT now(),
  distance numeric NOT NULL,
  duration text NOT NULL,
  duration_seconds integer,
  pace text NOT NULL,
  pace_seconds integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  title text,
  notes text,
  weather text,
  feeling text CHECK (feeling = ANY (ARRAY['excellent'::text, 'good'::text, 'ok'::text, 'tough'::text, NULL::text])),
  CONSTRAINT activities_pkey PRIMARY KEY (id),
  CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.activity_pauses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  activity_id uuid NOT NULL,
  start_time integer NOT NULL,
  end_time integer NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_pauses_pkey PRIMARY KEY (id),
  CONSTRAINT activity_pauses_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id)
);
CREATE TABLE public.activity_routes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  activity_id uuid NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  timestamp integer NOT NULL,
  altitude numeric,
  accuracy numeric,
  speed numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_routes_pkey PRIMARY KEY (id),
  CONSTRAINT activity_routes_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'blocked'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_interaction timestamp with time zone,
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT contacts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.users(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  last_message text,
  last_message_time timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.users(id),
  CONSTRAINT conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.users(id)
);
CREATE TABLE public.event_participants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'registered'::text CHECK (status = ANY (ARRAY['registered'::text, 'attended'::text, 'cancelled'::text])),
  CONSTRAINT event_participants_pkey PRIMARY KEY (id),
  CONSTRAINT event_participants_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  date timestamp with time zone NOT NULL,
  location text NOT NULL,
  latitude numeric,
  longitude numeric,
  participants integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  max_participants integer,
  distance numeric,
  difficulty text CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text, NULL::text])),
  registration_required boolean DEFAULT false,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.runners (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  distance numeric,
  pace text,
  pace_seconds integer,
  is_active boolean DEFAULT true,
  activity_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT runners_pkey PRIMARY KEY (id),
  CONSTRAINT runners_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT runners_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.stories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  image_url text,
  video_url text,
  caption text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  view_count integer DEFAULT 0,
  location text,
  CONSTRAINT stories_pkey PRIMARY KEY (id),
  CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.story_views (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  story_id uuid NOT NULL,
  viewer_id uuid NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT story_views_pkey PRIMARY KEY (id),
  CONSTRAINT story_views_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id),
  CONSTRAINT story_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  same_gender_only boolean DEFAULT false,
  hide_exact_location boolean DEFAULT false,
  similar_pace_only boolean DEFAULT false,
  similar_schedule boolean DEFAULT false,
  nearby_runners_notifications boolean DEFAULT true,
  message_notifications boolean DEFAULT true,
  event_notifications boolean DEFAULT true,
  activity_reminders boolean DEFAULT true,
  pace_tolerance integer DEFAULT 30,
  distance_tolerance numeric DEFAULT 5.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  avatar text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  bio text,
  gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text, NULL::text])),
  birth_date date,
  total_distance numeric DEFAULT 0,
  total_time text DEFAULT '0 min'::text,
  sessions integer DEFAULT 0,
  average_pace text,
  auth_user_id text UNIQUE,
  level text CHECK (level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'expert'::text])),
  goal text,
  preferred_time text CHECK (preferred_time = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text, 'night'::text])),
  preferred_terrain text,
  group_preference text CHECK (group_preference = ANY (ARRAY['solo'::text, 'group'::text, 'both'::text])),
  member_since timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
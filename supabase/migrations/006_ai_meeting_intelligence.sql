-- =========================================================
-- 006 AI MEETING INTELLIGENCE
-- =========================================================

-- ---------------------------------------------------------
-- 1. Recording status enum
-- ---------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'meeting_recording_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.meeting_recording_status AS ENUM (
      'uploaded',
      'processing',
      'transcribing',
      'analyzing',
      'completed',
      'failed'
    );
  END IF;
END
$$;


-- ---------------------------------------------------------
-- 2. Meeting recordings
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.meeting_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  meeting_id uuid NOT NULL
    REFERENCES public.meetings(id)
    ON DELETE CASCADE,

  storage_path text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,

  status public.meeting_recording_status
    NOT NULL DEFAULT 'uploaded',

  error_message text,

  created_by uuid NOT NULL
    REFERENCES public.users(id),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------
-- 3. Meeting transcripts
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.meeting_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  meeting_id uuid NOT NULL
    REFERENCES public.meetings(id)
    ON DELETE CASCADE,

  recording_id uuid NOT NULL
    REFERENCES public.meeting_recordings(id)
    ON DELETE CASCADE,

  transcript text NOT NULL,

  status text NOT NULL DEFAULT 'completed',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------
-- 4. AI analysis
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.meeting_ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  meeting_id uuid NOT NULL
    REFERENCES public.meetings(id)
    ON DELETE CASCADE,

  transcript_id uuid NOT NULL
    REFERENCES public.meeting_transcripts(id)
    ON DELETE CASCADE,

  summary text NOT NULL,

  key_points jsonb NOT NULL DEFAULT '[]'::jsonb,

  suggested_minutes text,

  extracted_decisions jsonb NOT NULL DEFAULT '[]'::jsonb,

  extracted_action_items jsonb NOT NULL DEFAULT '[]'::jsonb,

  model_name text,

  status text NOT NULL DEFAULT 'draft',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------
-- 5. Enable RLS
-- ---------------------------------------------------------

ALTER TABLE public.meeting_recordings
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.meeting_transcripts
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.meeting_ai_analysis
ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------
-- 6. Grants
-- ---------------------------------------------------------

GRANT SELECT, INSERT, UPDATE
ON TABLE public.meeting_recordings
TO authenticated;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.meeting_transcripts
TO authenticated;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.meeting_ai_analysis
TO authenticated;


-- ---------------------------------------------------------
-- 7. Indexes
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS
meeting_recordings_meeting_idx
ON public.meeting_recordings(meeting_id, created_at DESC);

CREATE INDEX IF NOT EXISTS
meeting_transcripts_meeting_idx
ON public.meeting_transcripts(meeting_id, created_at DESC);

CREATE INDEX IF NOT EXISTS
meeting_ai_analysis_meeting_idx
ON public.meeting_ai_analysis(meeting_id, created_at DESC);


-- ---------------------------------------------------------
-- 8. Recording RLS
-- ---------------------------------------------------------

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'meeting_recordings'
      AND policyname = 'meeting_recordings_staff_read'
  ) THEN

    CREATE POLICY meeting_recordings_staff_read
    ON public.meeting_recordings
    FOR SELECT
    TO authenticated
    USING (
      public.is_staff()
      OR created_by = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.meetings m
        WHERE m.id = meeting_id
          AND (
            m.created_by = auth.uid()
            OR m.assigned_approver_id = auth.uid()
          )
      )
    );

  END IF;


  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'meeting_recordings'
      AND policyname = 'meeting_recordings_staff_write'
  ) THEN

    CREATE POLICY meeting_recordings_staff_write
    ON public.meeting_recordings
    FOR ALL
    TO authenticated
    USING (
      public.current_role()
      IN ('Super Admin', 'Meeting Secretary')
    )
    WITH CHECK (
      public.current_role()
      IN ('Super Admin', 'Meeting Secretary')
      AND created_by = auth.uid()
    );

  END IF;

END
$$;


-- ---------------------------------------------------------
-- 9. Transcript RLS
-- ---------------------------------------------------------

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'meeting_transcripts'
      AND policyname = 'meeting_transcripts_read'
  ) THEN

    CREATE POLICY meeting_transcripts_read
    ON public.meeting_transcripts
    FOR SELECT
    TO authenticated
    USING (
      public.is_staff()
      OR EXISTS (
        SELECT 1
        FROM public.meetings m
        WHERE m.id = meeting_id
          AND (
            m.status = 'Published'
            OR m.created_by = auth.uid()
            OR m.assigned_approver_id = auth.uid()
          )
      )
    );

  END IF;


  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'meeting_transcripts'
      AND policyname = 'meeting_transcripts_staff_write'
  ) THEN

    CREATE POLICY meeting_transcripts_staff_write
    ON public.meeting_transcripts
    FOR ALL
    TO authenticated
    USING (
      public.current_role()
      IN ('Super Admin', 'Meeting Secretary')
    )
    WITH CHECK (
      public.current_role()
      IN ('Super Admin', 'Meeting Secretary')
    );

  END IF;

END
$$;


-- ---------------------------------------------------------
-- 10. AI analysis RLS
-- ---------------------------------------------------------

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'meeting_ai_analysis'
      AND policyname = 'meeting_ai_analysis_read'
  ) THEN

    CREATE POLICY meeting_ai_analysis_read
    ON public.meeting_ai_analysis
    FOR SELECT
    TO authenticated
    USING (
      public.is_staff()
      OR EXISTS (
        SELECT 1
        FROM public.meetings m
        WHERE m.id = meeting_id
          AND (
            m.status = 'Published'
            OR m.created_by = auth.uid()
            OR m.assigned_approver_id = auth.uid()
          )
      )
    );

  END IF;


  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'meeting_ai_analysis'
      AND policyname = 'meeting_ai_analysis_staff_write'
  ) THEN

    CREATE POLICY meeting_ai_analysis_staff_write
    ON public.meeting_ai_analysis
    FOR ALL
    TO authenticated
    USING (
      public.current_role()
      IN ('Super Admin', 'Meeting Secretary')
    )
    WITH CHECK (
      public.current_role()
      IN ('Super Admin', 'Meeting Secretary')
    );

  END IF;

END
$$;


-- ---------------------------------------------------------
-- 11. Storage policies
-- ---------------------------------------------------------

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'meeting_media_authenticated_upload'
  ) THEN

    CREATE POLICY meeting_media_authenticated_upload
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'meeting-media'
      AND public.current_role()
          IN ('Super Admin', 'Meeting Secretary')
      AND (storage.foldername(name))[1] = 'meetings'
    );

  END IF;


  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'meeting_media_authenticated_read'
  ) THEN

    CREATE POLICY meeting_media_authenticated_read
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'meeting-media'
      AND (
        public.is_staff()
        OR owner_id::uuid = auth.uid()
        OR (storage.foldername(name))[1] = 'meetings'
      )
    );

  END IF;

END
$$;
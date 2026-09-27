-- Final production permissions and storage policy repair.
-- RLS remains enabled. Service-role privileges are server-only.

GRANT SELECT ON TABLE public.users TO service_role;
GRANT SELECT ON TABLE public.meeting_transcripts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.embeddings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.embeddings TO service_role;
GRANT EXECUTE ON FUNCTION public.hybrid_search(text, vector, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hybrid_search(text, vector, integer) TO service_role;

DROP POLICY IF EXISTS meeting_media_authenticated_upload ON storage.objects;
CREATE POLICY meeting_media_authenticated_upload
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meeting-media'
  AND public.current_role() IN ('Super Admin', 'Meeting Secretary')
  AND (storage.foldername(name))[1] = 'meetings'
  AND EXISTS (
    SELECT 1
    FROM public.meetings m
    WHERE m.id = CASE
      WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN ((storage.foldername(name))[2])::uuid
      ELSE NULL
    END
    AND (m.status = 'Published' OR m.created_by = auth.uid() OR m.assigned_approver_id = auth.uid() OR public.is_staff())
  )
);

DROP POLICY IF EXISTS meeting_media_authenticated_read ON storage.objects;
CREATE POLICY meeting_media_authenticated_read
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'meeting-media'
  AND (
    owner_id::uuid = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.meetings m
      WHERE m.id = CASE
        WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN ((storage.foldername(name))[2])::uuid
        ELSE NULL
      END
      AND (m.status = 'Published' OR m.created_by = auth.uid() OR m.assigned_approver_id = auth.uid() OR public.is_staff())
    )
  )
);

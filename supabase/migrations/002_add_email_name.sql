ALTER TABLE emails
  ADD COLUMN IF NOT EXISTS display_name text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'emails_display_name_length'
  ) THEN
    ALTER TABLE emails
      ADD CONSTRAINT emails_display_name_length
      CHECK (display_name IS NULL OR char_length(display_name) <= 16);
  END IF;
END $$;

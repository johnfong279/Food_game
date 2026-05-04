ALTER TABLE emails
  ADD COLUMN IF NOT EXISTS score_at_submit integer;

UPDATE emails e
SET score_at_submit = s.score
FROM scores s
WHERE e.session_id = s.session_id
  AND e.score_at_submit IS NULL;

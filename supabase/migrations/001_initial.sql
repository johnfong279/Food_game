CREATE TABLE sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash  text NOT NULL UNIQUE,
  started_at  timestamptz NOT NULL DEFAULT now(),
  ended_at    timestamptz,
  ip_hash     text,
  user_agent  text
);

CREATE TABLE scores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid REFERENCES sessions(id) UNIQUE,
  score         integer NOT NULL,
  petals_caught integer NOT NULL,
  snacks_caught integer NOT NULL,
  duration_ms   integer NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_scores_score_desc ON scores (score DESC);

CREATE TABLE emails (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     uuid REFERENCES sessions(id) UNIQUE,
  email          text NOT NULL,
  consent        boolean NOT NULL,
  rank_at_submit integer NOT NULL,
  created_at     timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_emails_email_lower ON emails (lower(email));

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails    ENABLE ROW LEVEL SECURITY;

-- Service role can do everything; anon can read scores for leaderboard
CREATE POLICY "service role full access on sessions"
  ON sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service role full access on scores"
  ON scores FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon read scores"
  ON scores FOR SELECT TO anon USING (true);

CREATE POLICY "service role full access on emails"
  ON emails FOR ALL TO service_role USING (true) WITH CHECK (true);

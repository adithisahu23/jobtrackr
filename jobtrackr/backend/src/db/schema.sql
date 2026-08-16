-- JobTrackr database schema
-- Uses gen_random_uuid(), built into PostgreSQL 13+ core (pgcrypto not required).

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company         TEXT NOT NULL,
  role            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'APPLIED'
                    CHECK (status IN ('WISHLIST','APPLIED','SCREENING','INTERVIEW','OFFER','REJECTED','WITHDRAWN')),
  location        TEXT,
  remote          BOOLEAN NOT NULL DEFAULT false,
  salary_min      INTEGER,
  salary_max      INTEGER,
  job_url         TEXT,
  job_description TEXT,
  source          TEXT,
  notes           TEXT,
  applied_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE TABLE IF NOT EXISTS interviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  round_name     TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'OTHER'
                   CHECK (type IN ('PHONE_SCREEN','TECHNICAL','BEHAVIORAL','ONSITE','FINAL','OTHER')),
  scheduled_at   TIMESTAMPTZ NOT NULL,
  interviewer    TEXT,
  outcome        TEXT NOT NULL DEFAULT 'PENDING'
                   CHECK (outcome IN ('PENDING','PASSED','FAILED','CANCELLED')),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);

-- Generic trigger to keep updated_at current on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_interviews_updated_at ON interviews;
CREATE TRIGGER trg_interviews_updated_at BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

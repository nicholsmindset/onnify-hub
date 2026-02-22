-- Client health scores cache table
-- Stores AI-generated health analysis to avoid redundant API calls
CREATE TABLE IF NOT EXISTS client_health_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  delivery_rate INTEGER NOT NULL DEFAULT 0,
  on_time_score INTEGER NOT NULL DEFAULT 0,
  payment_score INTEGER NOT NULL DEFAULT 0,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  narrative TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_health_scores_client ON client_health_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_calculated ON client_health_scores(calculated_at);

-- Auto-update timestamp trigger
CREATE TRIGGER set_health_scores_updated_at
  BEFORE UPDATE ON client_health_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE client_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to health scores"
  ON client_health_scores FOR ALL
  USING (true)
  WITH CHECK (true);

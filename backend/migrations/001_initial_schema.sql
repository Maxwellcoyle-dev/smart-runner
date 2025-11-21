-- Initial Database Schema for Garmin Training Dashboard
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);

-- Garmin credentials (encrypted)
CREATE TABLE garmin_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  encrypted_email TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  session_data JSONB,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_garmin_credentials_user ON garmin_credentials(user_id);

-- Activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  garmin_activity_id BIGINT NOT NULL,
  activity_data JSONB NOT NULL,
  start_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, garmin_activity_id)
);

CREATE INDEX idx_activities_user_start ON activities(user_id, start_time DESC);
CREATE INDEX idx_activities_user_activity ON activities(user_id, garmin_activity_id);
CREATE INDEX idx_activities_start_time ON activities(start_time DESC);

-- Daily summaries
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  summary_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, date DESC);

-- Sync logs
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT,
  activities_synced INTEGER DEFAULT 0
);

CREATE INDEX idx_sync_logs_user_status ON sync_logs(user_id, status);
CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at DESC);

-- Subscription plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL, -- 'free', 'pro', 'premium'
  price_monthly DECIMAL(10, 2) NOT NULL,
  features JSONB NOT NULL,
  ai_requests_per_month INTEGER, -- -1 for unlimited
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier);
CREATE INDEX idx_subscription_plans_stripe_price ON subscription_plans(stripe_price_id);

-- Usage tracking
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature_type VARCHAR(50) NOT NULL, -- 'ai_analysis', 'ai_plan', 'sync'
  usage_count INTEGER DEFAULT 1,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, feature_type, period_start)
);

CREATE INDEX idx_usage_user_period ON usage_tracking(user_id, period_start);
CREATE INDEX idx_usage_feature_period ON usage_tracking(feature_type, period_start);

-- AI analyses (store AI-generated insights)
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_analyses_user_created ON ai_analyses(user_id, created_at DESC);

-- Training plans (AI-generated plans)
CREATE TABLE training_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,
  goals JSONB,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_training_plans_user_active ON training_plans(user_id, is_active);
CREATE INDEX idx_training_plans_user_created ON training_plans(user_id, created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_garmin_credentials_updated_at BEFORE UPDATE ON garmin_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_plans_updated_at BEFORE UPDATE ON training_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, stripe_price_id, tier, price_monthly, features, ai_requests_per_month) VALUES
('Free', 'free', 'free', 0.00, '{"basic_dashboard": true, "limited_sync": true, "basic_charts": true}', 0),
('Pro', 'price_pro_placeholder', 'pro', 9.99, '{"full_dashboard": true, "daily_auto_sync": true, "advanced_charts": true, "ai_insights": true}', 10),
('Premium', 'price_premium_placeholder', 'premium', 19.99, '{"full_dashboard": true, "daily_auto_sync": true, "advanced_charts": true, "unlimited_ai_analysis": true, "training_plan_generation": true, "priority_support": true}', -1);


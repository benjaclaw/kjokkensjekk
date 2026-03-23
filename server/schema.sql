-- Kjøkkensjekk Database Schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
    password_hash TEXT NOT NULL,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_users_email ON users(email);

-- Devices (temperature monitoring equipment)
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fridge', 'freezer', 'hot', 'other')),
    min_temp NUMERIC(5,1) NOT NULL,
    max_temp NUMERIC(5,1) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_devices_org ON devices(org_id);

-- Temperature logs
CREATE TABLE temperature_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    temperature NUMERIC(5,1) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ok', 'warning', 'critical')),
    recorded_by UUID NOT NULL REFERENCES users(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    note TEXT
);

CREATE INDEX idx_temp_logs_device ON temperature_logs(device_id);
CREATE INDEX idx_temp_logs_recorded_at ON temperature_logs(recorded_at);

-- Checklist templates
CREATE TABLE checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_templates_org ON checklist_templates(org_id);

-- Checklist entries (completed checklists)
CREATE TABLE checklist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    completed_by UUID NOT NULL REFERENCES users(id),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    items JSONB NOT NULL DEFAULT '[]',
    signature TEXT
);

CREATE INDEX idx_checklist_entries_template ON checklist_entries(template_id);
CREATE INDEX idx_checklist_entries_completed_at ON checklist_entries(completed_at);

-- Deviations
CREATE TABLE deviations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('ok', 'warning', 'critical')),
    status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'closed')) DEFAULT 'open',
    photo_url TEXT,
    assigned_to UUID REFERENCES users(id),
    due_date TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolution TEXT
);

CREATE INDEX idx_deviations_org ON deviations(org_id);
CREATE INDEX idx_deviations_status ON deviations(status);
CREATE INDEX idx_deviations_created_at ON deviations(created_at);

-- Activity feed
CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('temperature', 'checklist', 'deviation', 'user', 'device')),
    entity_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_org ON activity_feed(org_id);
CREATE INDEX idx_activity_created_at ON activity_feed(created_at);

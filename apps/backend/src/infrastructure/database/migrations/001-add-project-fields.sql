-- Add new fields to projects table
-- Migration: Add color, icon_url, and priority fields to projects table

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6' NOT NULL,
ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'MEDIUM' NOT NULL;

-- Create index for priority filtering
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);

-- Create index for color filtering (if needed)
CREATE INDEX IF NOT EXISTS idx_projects_color ON projects(color);

-- Update existing projects to have default values
UPDATE projects
SET color = '#3B82F6'
WHERE color IS NULL;

UPDATE projects
SET priority = 'MEDIUM'
WHERE priority IS NULL;

-- Add check constraint for priority enum
ALTER TABLE projects
ADD CONSTRAINT chk_projects_priority
CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'));

-- Add check constraint for color format (HEX color)
ALTER TABLE projects
ADD CONSTRAINT chk_projects_color_format
CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

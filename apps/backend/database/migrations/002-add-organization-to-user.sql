-- Add organization column to users table
ALTER TABLE users
ADD COLUMN organization VARCHAR(255) NULL;

-- Add index for organization if needed for searches
CREATE INDEX idx_users_organization ON users(organization);

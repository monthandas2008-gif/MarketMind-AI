-- MarketMind Migration 003: Users Table, Role-Based Access & Admin Approval Workflow
-- Created: 2026-09-23

-- ============================================================
-- 1. Users Table (Authentication & Access Control)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'analyst', -- 'admin', 'analyst'
    status TEXT DEFAULT 'pending', -- 'approved', 'pending', 'rejected'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================================
-- 2. Seed Master Admin User (monthandas2008@gmail.com / Manthan@69)
-- (Password hash generated using PBKDF2-HMAC-SHA256, 100k rounds)
-- ============================================================
INSERT INTO users (id, email, password_hash, salt, name, role, status)
VALUES (
    gen_random_uuid(),
    'monthandas2008@gmail.com',
    '348981442c75a40bbafc5fa08ff9ba85da9f62c08c4a1616c148c3b7a5a415ff',
    '8792019ab76ce0efc123456789abcdef',
    'Manthan Sharma (Admin)',
    'admin',
    'approved'
)
ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    status = 'approved',
    updated_at = now();

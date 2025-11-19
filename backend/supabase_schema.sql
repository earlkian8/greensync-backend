-- ============================================
-- GreenSync Backend Database Schema for Supabase
-- Generated from Laravel Migrations
-- ============================================

-- Enable UUID extension if needed (for future use)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Core Laravel Tables
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_id_index ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_last_activity_index ON sessions(last_activity);

-- Cache tables
CREATE TABLE IF NOT EXISTS cache (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    expiration INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cache_locks (
    key VARCHAR(255) PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    expiration INTEGER NOT NULL
);

-- Jobs tables
CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    queue VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    attempts SMALLINT NOT NULL,
    reserved_at INTEGER NULL,
    available_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS jobs_queue_index ON jobs(queue);

CREATE TABLE IF NOT EXISTS job_batches (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_jobs INTEGER NOT NULL,
    pending_jobs INTEGER NOT NULL,
    failed_jobs INTEGER NOT NULL,
    failed_job_ids TEXT NOT NULL,
    options TEXT NULL,
    cancelled_at INTEGER NULL,
    created_at INTEGER NOT NULL,
    finished_at INTEGER NULL
);

CREATE TABLE IF NOT EXISTS failed_jobs (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL UNIQUE,
    connection TEXT NOT NULL,
    queue TEXT NOT NULL,
    payload TEXT NOT NULL,
    exception TEXT NOT NULL,
    failed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Personal access tokens table
CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT NULL,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS personal_access_tokens_tokenable_type_tokenable_id_index ON personal_access_tokens(tokenable_type, tokenable_id);
CREATE INDEX IF NOT EXISTS personal_access_tokens_expires_at_index ON personal_access_tokens(expires_at);

-- ============================================
-- Application Tables
-- ============================================

-- Residents table
CREATE TABLE IF NOT EXISTS residents (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    house_no VARCHAR(50) NULL,
    street VARCHAR(255) NULL,
    barangay VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    profile_image VARCHAR(255) NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

-- Collectors table
CREATE TABLE IF NOT EXISTS collectors (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    employee_id INTEGER NOT NULL UNIQUE,
    license_number VARCHAR(50) NULL,
    license_number_image VARCHAR(255) NULL,
    vehicle_plate_number VARCHAR(20) NULL,
    vehicle_plate_number_image VARCHAR(255) NULL,
    vehicle_type VARCHAR(50) NULL,
    vehicle_type_image VARCHAR(255) NULL,
    profile_image VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

-- Waste bins table
CREATE TYPE bin_type_enum AS ENUM ('biodegradable', 'non-biodegradable', 'recyclable', 'hazardous');
CREATE TYPE bin_status_enum AS ENUM ('active', 'inactive', 'damaged', 'full');

CREATE TABLE IF NOT EXISTS waste_bins (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    qr_code VARCHAR(255) NOT NULL UNIQUE,
    resident_id BIGINT NOT NULL,
    bin_type bin_type_enum NOT NULL DEFAULT 'biodegradable',
    status bin_status_enum NOT NULL DEFAULT 'active',
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_collected TIMESTAMP NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT waste_bins_resident_id_foreign 
        FOREIGN KEY (resident_id) 
        REFERENCES residents(id) 
        ON DELETE CASCADE
);

-- Collection schedules table
CREATE TYPE collection_day_enum AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
CREATE TYPE waste_type_enum AS ENUM ('biodegradable', 'non-biodegradable', 'recyclable', 'special', 'all');
CREATE TYPE frequency_enum AS ENUM ('weekly', 'bi-weekly', 'monthly');

CREATE TABLE IF NOT EXISTS collection_schedules (
    id BIGSERIAL PRIMARY KEY,
    barangay VARCHAR(100) NOT NULL,
    collection_day collection_day_enum NOT NULL,
    collection_time TIME NOT NULL,
    waste_type waste_type_enum NOT NULL DEFAULT 'all',
    frequency frequency_enum NOT NULL DEFAULT 'weekly',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT collection_schedules_created_by_foreign 
        FOREIGN KEY (created_by) 
        REFERENCES residents(id) 
        ON DELETE CASCADE
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id BIGSERIAL PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    start_location TEXT NULL,
    end_location TEXT NULL,
    estimated_duration INTEGER NULL,
    total_stops INTEGER NOT NULL DEFAULT 0,
    route_map_data TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT routes_created_by_foreign 
        FOREIGN KEY (created_by) 
        REFERENCES residents(id) 
        ON DELETE CASCADE
);

-- Route stops table
CREATE TABLE IF NOT EXISTS route_stops (
    id BIGSERIAL PRIMARY KEY,
    route_id BIGINT NOT NULL,
    stop_order INTEGER NOT NULL,
    stop_address TEXT NOT NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    estimated_time TIME NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT route_stops_route_id_foreign 
        FOREIGN KEY (route_id) 
        REFERENCES routes(id) 
        ON DELETE CASCADE
);

-- Route assignments table
CREATE TYPE assignment_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS route_assignments (
    id BIGSERIAL PRIMARY KEY,
    route_id BIGINT NOT NULL,
    collector_id BIGINT NOT NULL,
    schedule_id BIGINT NOT NULL,
    assignment_date DATE NOT NULL,
    status assignment_status_enum NOT NULL DEFAULT 'pending',
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    notes TEXT NULL,
    assigned_by BIGINT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT route_assignments_route_id_foreign 
        FOREIGN KEY (route_id) 
        REFERENCES routes(id) 
        ON DELETE CASCADE,
    CONSTRAINT route_assignments_collector_id_foreign 
        FOREIGN KEY (collector_id) 
        REFERENCES collectors(id) 
        ON DELETE CASCADE,
    CONSTRAINT route_assignments_schedule_id_foreign 
        FOREIGN KEY (schedule_id) 
        REFERENCES collection_schedules(id) 
        ON DELETE CASCADE,
    CONSTRAINT route_assignments_assigned_by_foreign 
        FOREIGN KEY (assigned_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);

-- Collection requests table
CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE request_status_enum AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS collection_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    bin_id BIGINT NOT NULL,
    request_type VARCHAR(255) NOT NULL,
    description TEXT NULL,
    preferred_date DATE NULL,
    preferred_time TIME NULL,
    waste_type waste_type_enum NOT NULL DEFAULT 'all',
    image_url VARCHAR(255) NULL,
    priority priority_enum NOT NULL DEFAULT 'medium',
    status request_status_enum NOT NULL DEFAULT 'pending',
    assigned_collector_id BIGINT NULL,
    resolution_notes TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    CONSTRAINT collection_requests_user_id_foreign 
        FOREIGN KEY (user_id) 
        REFERENCES residents(id) 
        ON DELETE CASCADE,
    CONSTRAINT collection_requests_bin_id_foreign 
        FOREIGN KEY (bin_id) 
        REFERENCES waste_bins(id) 
        ON DELETE CASCADE,
    CONSTRAINT collection_requests_assigned_collector_id_foreign 
        FOREIGN KEY (assigned_collector_id) 
        REFERENCES collectors(id) 
        ON DELETE SET NULL
);

-- QR collections table
CREATE TYPE collection_status_enum AS ENUM ('successful', 'skipped', 'failed');

CREATE TABLE IF NOT EXISTS qr_collections (
    id BIGSERIAL PRIMARY KEY,
    bin_id BIGINT NOT NULL,
    collector_id BIGINT NOT NULL,
    assignment_id BIGINT NOT NULL,
    qr_code VARCHAR(255) NOT NULL,
    collection_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    waste_weight DECIMAL(8, 2) NULL,
    waste_type waste_type_enum NOT NULL DEFAULT 'all',
    collection_status collection_status_enum NOT NULL DEFAULT 'successful',
    skip_reason TEXT NULL,
    photo_url VARCHAR(255) NULL,
    notes TEXT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by BIGINT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT qr_collections_bin_id_foreign 
        FOREIGN KEY (bin_id) 
        REFERENCES waste_bins(id) 
        ON DELETE CASCADE,
    CONSTRAINT qr_collections_collector_id_foreign 
        FOREIGN KEY (collector_id) 
        REFERENCES collectors(id) 
        ON DELETE CASCADE,
    CONSTRAINT qr_collections_assignment_id_foreign 
        FOREIGN KEY (assignment_id) 
        REFERENCES route_assignments(id) 
        ON DELETE CASCADE,
    CONSTRAINT qr_collections_verified_by_foreign 
        FOREIGN KEY (verified_by) 
        REFERENCES residents(id) 
        ON DELETE SET NULL
);

-- Notifications table
CREATE TYPE recipient_type_enum AS ENUM ('resident', 'collector', 'all_residents', 'all_collectors', 'specific');
CREATE TYPE notification_type_enum AS ENUM ('schedule', 'alert', 'announcement', 'request_update', 'route_assignment');

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_type recipient_type_enum NOT NULL DEFAULT 'specific',
    recipient_id BIGINT NULL,
    sender_id BIGINT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type notification_type_enum NOT NULL DEFAULT 'alert',
    priority priority_enum NOT NULL DEFAULT 'medium',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    action_url VARCHAR(255) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_recipient_id_foreign 
        FOREIGN KEY (recipient_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT notifications_sender_id_foreign 
        FOREIGN KEY (sender_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL,
    module VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    ip_address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Permission Tables (Spatie Laravel Permission)
-- ============================================

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    guard_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT permissions_name_guard_name_unique UNIQUE (name, guard_name)
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    guard_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roles_name_guard_name_unique UNIQUE (name, guard_name)
);

-- Model has permissions table
CREATE TABLE IF NOT EXISTS model_has_permissions (
    permission_id BIGINT NOT NULL,
    model_type VARCHAR(255) NOT NULL,
    model_id BIGINT NOT NULL,
    CONSTRAINT model_has_permissions_permission_id_foreign 
        FOREIGN KEY (permission_id) 
        REFERENCES permissions(id) 
        ON DELETE CASCADE,
    CONSTRAINT model_has_permissions_permission_model_type_primary 
        PRIMARY KEY (permission_id, model_id, model_type)
);

CREATE INDEX IF NOT EXISTS model_has_permissions_model_id_model_type_index 
    ON model_has_permissions(model_id, model_type);

-- Model has roles table
CREATE TABLE IF NOT EXISTS model_has_roles (
    role_id BIGINT NOT NULL,
    model_type VARCHAR(255) NOT NULL,
    model_id BIGINT NOT NULL,
    CONSTRAINT model_has_roles_role_id_foreign 
        FOREIGN KEY (role_id) 
        REFERENCES roles(id) 
        ON DELETE CASCADE,
    CONSTRAINT model_has_roles_role_model_type_primary 
        PRIMARY KEY (role_id, model_id, model_type)
);

CREATE INDEX IF NOT EXISTS model_has_roles_model_id_model_type_index 
    ON model_has_roles(model_id, model_type);

-- Role has permissions table
CREATE TABLE IF NOT EXISTS role_has_permissions (
    permission_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    CONSTRAINT role_has_permissions_permission_id_foreign 
        FOREIGN KEY (permission_id) 
        REFERENCES permissions(id) 
        ON DELETE CASCADE,
    CONSTRAINT role_has_permissions_role_id_foreign 
        FOREIGN KEY (role_id) 
        REFERENCES roles(id) 
        ON DELETE CASCADE,
    CONSTRAINT role_has_permissions_permission_id_role_id_primary 
        PRIMARY KEY (permission_id, role_id)
);

-- ============================================
-- Additional Indexes for Performance
-- ============================================

-- Indexes for foreign keys that might be frequently queried
CREATE INDEX IF NOT EXISTS waste_bins_resident_id_index ON waste_bins(resident_id);
CREATE INDEX IF NOT EXISTS collection_schedules_created_by_index ON collection_schedules(created_by);
CREATE INDEX IF NOT EXISTS routes_created_by_index ON routes(created_by);
CREATE INDEX IF NOT EXISTS route_stops_route_id_index ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS route_assignments_route_id_index ON route_assignments(route_id);
CREATE INDEX IF NOT EXISTS route_assignments_collector_id_index ON route_assignments(collector_id);
CREATE INDEX IF NOT EXISTS route_assignments_schedule_id_index ON route_assignments(schedule_id);
CREATE INDEX IF NOT EXISTS collection_requests_user_id_index ON collection_requests(user_id);
CREATE INDEX IF NOT EXISTS collection_requests_bin_id_index ON collection_requests(bin_id);
CREATE INDEX IF NOT EXISTS collection_requests_assigned_collector_id_index ON collection_requests(assigned_collector_id);
CREATE INDEX IF NOT EXISTS qr_collections_bin_id_index ON qr_collections(bin_id);
CREATE INDEX IF NOT EXISTS qr_collections_collector_id_index ON qr_collections(collector_id);
CREATE INDEX IF NOT EXISTS qr_collections_assignment_id_index ON qr_collections(assignment_id);
CREATE INDEX IF NOT EXISTS notifications_recipient_id_index ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS notifications_sender_id_index ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS activity_logs_user_id_index ON activity_logs(user_id);

-- ============================================
-- Seed Data
-- ============================================

-- Enable pgcrypto extension for password hashing (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert default admin user account
-- Password: 'password' (bcrypt hashed)
-- This matches your DatabaseSeeder.php
INSERT INTO users (name, email, password, email_verified_at, created_at, updated_at)
VALUES (
    'Jenson Canones',
    'dev@unisync.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'password'
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING; -- Prevents duplicate insertion if user already exists

-- ============================================
-- Notes:
-- ============================================
-- 1. This SQL script creates all tables based on your Laravel migrations
-- 2. All foreign key constraints are included with appropriate CASCADE/SET NULL actions
-- 3. All indexes are created for better query performance
-- 4. ENUM types are used for PostgreSQL (Supabase) compatibility
-- 5. Timestamps default to CURRENT_TIMESTAMP
-- 6. Run this script in your Supabase SQL editor
-- 7. Make sure to run migrations in order if you encounter foreign key errors
-- 8. You may need to adjust data types if you have specific requirements
-- 9. Default admin account: dev@unisync.com / password


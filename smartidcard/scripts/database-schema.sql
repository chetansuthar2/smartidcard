-- Smart ID Card System Database Schema

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(20) PRIMARY KEY,
    application_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    class VARCHAR(20) NOT NULL,
    department VARCHAR(50),
    schedule VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Entry logs table
CREATE TABLE IF NOT EXISTS entry_logs (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(id),
    application_number VARCHAR(20) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP NULL,
    status VARCHAR(10) CHECK (status IN ('entry', 'exit')),
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table (optional)
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_app_number ON students(application_number);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_entry_logs_student_id ON entry_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_entry_logs_date ON entry_logs(entry_time);

-- Sample admin user (password: admin123)
INSERT INTO admin_users (username, password_hash, email) VALUES 
('admin', '$2b$10$rQZ9QmSTnkKZHciVGYt0/.VJ8VnNkTQjKLV5aXrULp8jF8.QmQK8G', 'admin@school.com')
ON CONFLICT (username) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE IF EXISTS students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_users ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100),
    class VARCHAR(20) NOT NULL,
    department VARCHAR(50),
    schedule VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create entry logs table
CREATE TABLE IF NOT EXISTS entry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    application_number VARCHAR(20) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE NULL,
    status VARCHAR(10) CHECK (status IN ('entry', 'exit')),
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_app_number ON students(application_number);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_entry_logs_student_id ON entry_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_entry_logs_date ON entry_logs(entry_time);

-- RLS Policies (Allow all operations for now - you can restrict later)
CREATE POLICY "Allow all operations on students" ON students FOR ALL USING (true);
CREATE POLICY "Allow all operations on entry_logs" ON entry_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on admin_users" ON admin_users FOR ALL USING (true);

-- Insert default admin user (username: admin, password: admin123)
INSERT INTO admin_users (username, email, password_hash) VALUES 
('admin', 'admin@school.com', '$2b$10$rQZ9QmSTnkKZHciVGYt0/.VJ8VnNkTQjKLV5aXrULp8jF8.QmQK8G')
ON CONFLICT (username) DO NOTHING;

-- Sample students data
INSERT INTO students (application_number, name, phone, email, class, department, schedule, image_url) VALUES
('APP20241001', 'John Smith', '9876543210', 'john@example.com', '12th-A', 'Science', 'Morning Shift (8:00 AM - 2:00 PM)', '/placeholder.svg?height=150&width=150'),
('APP20241002', 'Sarah Johnson', '9876543211', 'sarah@example.com', '11th-B', 'Commerce', 'Afternoon Shift (2:00 PM - 8:00 PM)', '/placeholder.svg?height=150&width=150'),
('APP20241003', 'Mike Wilson', '9876543212', 'mike@example.com', '10th-C', 'Arts', 'Full Day (8:00 AM - 4:00 PM)', '/placeholder.svg?height=150&width=150')
ON CONFLICT (application_number) DO NOTHING;

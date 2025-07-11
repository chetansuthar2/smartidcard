-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    class VARCHAR(20) NOT NULL,
    department VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create entry_logs table
CREATE TABLE IF NOT EXISTS entry_logs (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) REFERENCES students(id),
    student_name VARCHAR(100) NOT NULL,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('success', 'failed')),
    verification_method VARCHAR(20) DEFAULT 'face_scan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample students
INSERT INTO students (id, name, roll_number, class, department, phone, image_url) VALUES
('STU001', 'राहुल शर्मा', '2024001', '12वीं A', 'Science', '9876543210', '/placeholder.svg?height=150&width=150'),
('STU002', 'प्रिया पटेल', '2024002', '11वीं B', 'Commerce', '9876543211', '/placeholder.svg?height=150&width=150'),
('STU003', 'अमित कुमार', '2024003', '10वीं C', 'Arts', '9876543212', '/placeholder.svg?height=150&width=150');

# 🎓 Smart ID Card Station System

A comprehensive student ID card management system with QR code scanning, face verification, and real-time entry/exit tracking.

## 🌟 Features

### 📱 **Card Station (QR Scanner & Face Verification)**
- **QR Code Scanning**: Real-time QR code detection and validation
- **Live Face Verification**: Anti-spoofing face recognition with liveness detection
- **Entry/Exit Tracking**: Automatic entry/exit logging with timestamps
- **Real-time Stats**: Live dashboard showing today's activity
- **Mobile Responsive**: Works on tablets and mobile devices

### 👨‍💼 **Admin Panel (Student Management)**
- **Student Registration**: Add students with photos and details
- **Student Management**: Edit, delete, and search students
- **History Calendar**: Interactive calendar showing entry/exit data by date
- **Real-time Statistics**: Auto-refreshing stats every 5 seconds
- **Data Export**: Copy student credentials for easy sharing

### 👨‍🎓 **Student Portal**
- **Personal Dashboard**: View profile and QR code
- **Entry History**: Complete entry/exit history with timestamps
- **QR Code Access**: Personal QR code for station scanning
- **Mobile Optimized**: Responsive design for all devices

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Card Station  │    │   Admin Panel   │    │ Student Portal  │
│   (Scanning)    │    │  (Management)   │    │   (Personal)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB       │
                    │   Database      │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Modern web browser with camera support

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd idcard
```

2. **Install dependencies for both applications**
```bash
# Install Card Station dependencies
cd cardstation
npm install

# Install Smart ID Card dependencies  
cd ../smartidcard
npm install
```

3. **Environment Setup**
Create `.env.local` files in both directories:

**cardstation/.env.local**
```env
MONGODB_URI=mongodb://localhost:27017/idcard
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**smartidcard/.env.local**
```env
MONGODB_URI=mongodb://localhost:27017/idcard
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. **Start the applications**
```bash
# Terminal 1: Start Card Station (Port 3000)
cd cardstation
npm run dev

# Terminal 2: Start Admin/Student Portal (Port 3001)  
cd smartidcard
npm run dev
```

5. **Access the applications**
- **Card Station**: http://localhost:3000
- **Admin Panel**: http://localhost:3001/admin
- **Student Portal**: http://localhost:3001

## 📋 Usage Guide

### 🔧 **Admin Panel Setup**

1. **Access Admin Panel**
   - Go to `http://localhost:3001/admin`
   - Default login: `admin` / `admin123`

2. **Add Students**
   - Click "Add New Student"
   - Fill required fields: Name, Phone, Class, Department
   - Upload student photo (required for face verification)
   - System generates unique Enrollment Number

3. **Manage Students**
   - Edit student information
   - Delete students (removes all data including entry history)
   - Search and filter students
   - Copy login credentials

### 📱 **Card Station Operation**

1. **QR Code Scanning**
   - Student scans QR code or enters Enrollment Number
   - System validates against database
   - Shows student information if valid

2. **Face Verification**
   - Live camera activates after QR validation
   - Student looks at camera for face verification
   - Anti-spoofing detection with liveness check
   - Blink detection for enhanced security

3. **Entry/Exit Recording**
   - First scan = Entry
   - Second scan = Exit  
   - Automatic daily reset
   - Real-time database updates

### 👨‍🎓 **Student Portal**

1. **Student Login**
   - Use Enrollment Number and Phone Number
   - View personal dashboard and QR code
   - Check entry/exit history

2. **QR Code Usage**
   - Display QR code for station scanning
   - Copy QR data if needed
   - Works offline once loaded

## 🗄️ Database Schema

### Students Collection
```javascript
{
  _id: ObjectId,
  name: String,
  phone: String,
  email: String,
  class: String,
  department: String,
  schedule: String,
  application_number: String,
  image_url: String,
  created_at: Date,
  updated_at: Date
}
```

### Entry Logs Collection
```javascript
{
  _id: ObjectId,
  student_id: String,
  application_number: String,
  student_name: String,
  entry_time: Date,
  exit_time: Date,
  status: String, // 'entry' or 'exit'
  verified: Boolean,
  face_match_score: Number,
  created_at: Date
}
```

## 🔒 Security Features

- **Face Anti-Spoofing**: Live detection prevents photo attacks
- **Liveness Detection**: Eye movement and blink detection
- **QR Code Validation**: Secure Enrollment Number verification
- **Data Encryption**: Secure data transmission
- **Access Control**: Role-based access for admin/student portals

## 📊 Monitoring & Analytics

### Real-time Statistics
- Total registered students
- Today's entries and exits
- Live activity monitoring
- Historical data analysis

### History Calendar
- Interactive calendar view
- Daily entry/exit counts
- Detailed activity logs
- Date-wise filtering

## 🛠️ Technical Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI Components**: Tailwind CSS, Lucide Icons
- **Database**: MongoDB with native driver
- **Camera**: WebRTC for live video capture
- **QR Scanning**: jsQR library
- **Face Detection**: Browser-native APIs

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly interfaces
- Camera access on mobile devices
- Optimized for tablets and phones

## 🔧 Configuration

### Camera Settings
- Auto-focus enabled
- HD video resolution (1280x720)
- Real-time frame processing
- Cross-browser compatibility

### Database Settings
- Connection pooling
- Automatic reconnection
- Error handling and fallbacks
- Data validation

## 🚨 Troubleshooting

### Common Issues

1. **Camera not working**
   - Check browser permissions
   - Ensure HTTPS in production
   - Verify camera hardware

2. **Database connection failed**
   - Check MongoDB service status
   - Verify connection string
   - Check network connectivity

3. **QR scanning issues**
   - Ensure good lighting
   - Clean camera lens
   - Check QR code quality

### Support
For technical support or feature requests, please check the documentation or contact the development team.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for educational institutions**

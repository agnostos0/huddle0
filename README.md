# 🎉 Eventify - Event Management Platform

A comprehensive event management platform built with the MERN stack, featuring real-time updates, role-based access control, and advanced event management capabilities.

## 🌟 Live Demo

- **Frontend**: [https://huddle-e6492.web.app](https://huddle-e6492.web.app)
- **Backend**: [https://huddle-backend-production.up.railway.app](https://huddle-backend-production.up.railway.app)

## 🚀 Features

### 👥 User Management & Authentication

#### **Multi-Provider Authentication**
- **Email/Password Registration & Login**
- **Google OAuth Integration** (Firebase Auth)
- **JWT Token-based Authentication**
- **Password Recovery System**
  - Forgot Password functionality
  - Username recovery options
- **Real-time Session Management**

#### **Role-Based Access Control (RBAC)**
- **Attendee** (Default Role)
  - Browse and join events
  - Create and join teams
  - View event details and maps
  - Express interest in events
- **Organizer** (Approved Role)
  - All attendee permissions
  - Create and manage events
  - Event approval workflow
  - Analytics for own events
- **Admin** (Super User)
  - All organizer permissions
  - User management (promote/demote/deactivate)
  - Event moderation and approval
  - System-wide analytics
  - Team management

#### **Real-Time User Status Updates**
- **Instant Role Changes**: No logout required
- **Real-Time Deactivation**: Immediate account suspension
- **Live Notifications**: Status change alerts
- **Auto-Logout**: Deactivated users automatically logged out

### 🎪 Event Management

#### **Event Creation & Management**
- **Multi-Step Event Creation**
  - Basic event details
  - Location with interactive map
  - Team requirements configuration
  - Prize pool structure (INR)
  - Image upload with compression
- **Event Approval Workflow**
  - Pending → Admin Review → Approved/Rejected
  - Edit approval system
  - Bulk approval for admins
- **Event Status Management**
  - Draft, Pending, Approved, Rejected, Edited_Pending
  - Status-based visibility control

#### **Advanced Event Features**
- **Interactive Photo Gallery**
  - Click to view full-size images
  - Image compression for performance
  - Base64 storage for reliability
- **Category-Based Search & Filtering**
  - Multiple event categories
  - Case-insensitive search
  - Map and list view filtering
- **Location Services**
  - Interactive Leaflet.js maps
  - Custom map markers
  - Address geocoding
- **Prize Pool Management**
  - Indian Rupee (INR) currency
  - Structured prize distribution
  - Team-based prize allocation

### 👥 Team Management

#### **Two-Step Team Approval System**
1. **Team Leader Approval**
2. **Admin Review & Approval**

#### **Smart Team Formation**
- **Solo Participant Matching**
  - Suggest compatible solo users
  - Interest-based matching
  - Team formation assistance
- **"Interested in Joining" System**
  - Express interest in events
  - View other interested users
  - Direct team formation
- **Team Requirements Validation**
  - Girls/Boys required validation
  - Calculated team size
  - Server-side validation

### 📊 Admin Panel

#### **Comprehensive User Management**
- **User List with Advanced Filtering**
- **Role Management**
  - Promote to organizer/admin
  - Demote to attendee
  - Real-time role updates
- **Account Deactivation System**
  - Deactivate with reason
  - Real-time deactivation
  - Auto-logout for deactivated users
- **Organizer Request Management**
  - Review organizer applications
  - Approve/reject with email notifications
  - Detailed organizer information

#### **Event Moderation**
- **Pending Events Management**
  - Review pending events
  - Bulk approval system
  - Individual event approval/rejection
- **Event Analytics**
  - Event statistics
  - Participation metrics
  - Revenue tracking

#### **Team & Invite Management**
- **Team Approval System**
  - Review team requests
  - Approve/reject teams
  - Team leader management
- **Invite Management**
  - Track event invitations
  - Invitation statistics

### 🎨 User Interface & Experience

#### **Responsive Design**
- **Mobile-First Approach**
- **TailwindCSS Styling**
- **Modern UI Components**
- **Smooth Animations & Transitions**

#### **Interactive Elements**
- **Canvas Confetti Effects**
- **Loading States & Skeleton Screens**
- **Toast Notifications**
- **Modal Dialogs**

#### **Dashboard System**
- **Role-Based Dashboards**
  - Attendee Dashboard (joined events, teams)
  - Organizer Dashboard (event management)
  - Admin Dashboard (full system control)
- **Real-Time Updates**
- **Navigation Guards**

## 🛠 Technical Architecture

### **Frontend Stack**
- **React 18** with Vite
- **React Router** for navigation
- **Context API** for state management
- **Axios** for API communication
- **TailwindCSS** for styling
- **Leaflet.js** for maps
- **Firebase Auth** for Google OAuth

### **Backend Stack**
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Nodemailer** for email notifications
- **CORS** configuration
- **Railway** deployment

### **Database Schema**

#### **User Model**
```javascript
{
  name: String,
  email: String (unique),
  username: String (unique),
  password: String (hashed),
  role: Enum ['user', 'organizer', 'admin'],
  isActive: Boolean,
  deactivationReason: String,
  deactivatedAt: Date,
  organizerProfile: {
    isVerified: Boolean,
    organization: String,
    description: String,
    contactEmail: String,
    contactPhone: String,
    hasRequestedOrganizer: Boolean,
    organizerRequestDate: Date,
    organizerRequestReason: String,
    organizerRequestStatus: Enum ['pending', 'approved', 'rejected'],
    organizerRequestRejectionReason: String,
    approvedBy: ObjectId,
    approvedAt: Date
  },
  preferences: {
    notifications: { email: Boolean, push: Boolean },
    privacy: { showEmail: Boolean, showPhone: Boolean }
  }
}
```

#### **Event Model**
```javascript
{
  title: String,
  description: String,
  category: String,
  location: {
    address: String,
    coordinates: [Number, Number]
  },
  date: Date,
  maxParticipants: Number,
  teamRequirements: {
    girlsRequired: Number,
    boysRequired: Number,
    calculatedTeamSize: Number
  },
  prizePool: {
    totalAmount: Number,
    firstPrize: Number,
    secondPrize: Number,
    thirdPrize: Number
  },
  images: [String], // Base64 encoded
  status: Enum ['draft', 'pending', 'approved', 'rejected', 'edited_pending'],
  createdBy: ObjectId,
  approvedBy: ObjectId,
  approvedAt: Date
}
```

## 🔧 Error Handling & Validation

### **Frontend Error Handling**
- **API Error Interceptors**
- **Network Error Detection**
- **Form Validation**
- **User-Friendly Error Messages**
- **Graceful Degradation**

### **Backend Error Handling**
- **Comprehensive Try-Catch Blocks**
- **Input Validation**
- **Database Error Handling**
- **Authentication Error Management**
- **Detailed Error Logging**

### **Validation Rules**
- **Username**: No spaces, lowercase, unique
- **Email**: Valid format, unique
- **Password**: Minimum strength requirements
- **Event Data**: Required fields, valid dates
- **Team Requirements**: Logical validation
- **Prize Pool**: Positive amounts, valid distribution

## 🚀 Deployment

### **Frontend Deployment (Firebase Hosting)**
```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### **Backend Deployment (Railway)**
- **Automatic deployment** from GitHub
- **Environment variables** configured
- **MongoDB Atlas** connection
- **CORS** properly configured

### **Environment Variables**
```env
# Backend
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-jwt-secret
CLIENT_ORIGIN=https://huddle-e6492.web.app
EMAIL_USER=your-email
EMAIL_PASS=your-email-password

# Frontend
VITE_API_BASE_URL=https://huddle-backend-production.up.railway.app
```

## 📱 API Endpoints

### **Authentication**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/google` - Google OAuth
- `POST /auth/forgot-password` - Password recovery
- `POST /auth/reset-password` - Password reset

### **User Management**
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update profile
- `PUT /users/change-password` - Change password
- `POST /users/request-organizer` - Request organizer status
- `GET /users/organizer-request-status` - Get organizer status

### **Event Management**
- `GET /events` - Get public events
- `POST /events` - Create event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event
- `POST /events/:id/join` - Join event

### **Admin Endpoints**
- `GET /admin/users` - Get all users
- `PUT /admin/users/:id/role` - Update user role
- `POST /admin/users/:id/deactivate` - Deactivate user
- `POST /admin/users/:id/activate` - Activate user
- `GET /admin/events` - Get all events
- `POST /admin/events/:id/approve` - Approve event
- `POST /admin/events/:id/reject` - Reject event

## 🔒 Security Features

### **Authentication Security**
- **JWT Token Validation**
- **Password Hashing** (bcryptjs)
- **Google OAuth Verification**
- **Session Management**

### **Data Protection**
- **Input Sanitization**
- **SQL Injection Prevention**
- **XSS Protection**
- **CORS Configuration**

### **Access Control**
- **Role-Based Middleware**
- **Route Protection**
- **Admin-Only Endpoints**
- **User Permission Validation**

## 🧪 Testing & Quality Assurance

### **Manual Testing Scenarios**
- **User Registration & Login**
- **Event Creation & Management**
- **Team Formation & Approval**
- **Admin Panel Operations**
- **Real-Time Updates**
- **Error Handling**

### **Browser Compatibility**
- **Chrome** (Recommended)
- **Firefox**
- **Safari**
- **Edge**

### **Mobile Responsiveness**
- **iOS Safari**
- **Android Chrome**
- **Tablet Browsers**

## 🚨 Known Issues & Solutions

### **Common Issues**
1. **"Failed to create event"**
   - **Solution**: Check team requirements validation
   - **Fix**: Ensure girlsRequired + boysRequired ≤ maxParticipants

2. **"Network error"**
   - **Solution**: Check backend deployment status
   - **Fix**: Verify Railway deployment and environment variables

3. **"Login failed"**
   - **Solution**: Check user credentials and account status
   - **Fix**: Verify user is not deactivated

4. **"Browse Events" logout issue**
   - **Solution**: Check authentication token
   - **Fix**: Clear localStorage and re-login

### **Performance Optimizations**
- **Image Compression** for faster loading
- **Lazy Loading** for components
- **API Response Caching**
- **Database Indexing**

## 📈 Future Enhancements

### **Planned Features**
- **Real-Time Chat** for teams
- **Payment Integration** for event fees
- **Advanced Analytics** dashboard
- **Mobile App** development
- **Email Notifications** system
- **Social Media Integration**

### **Technical Improvements**
- **WebSocket** for real-time updates
- **Redis** for caching
- **Docker** containerization
- **CI/CD** pipeline
- **Unit Testing** implementation

## 🤝 Contributing

### **Development Setup**
```bash
# Clone the repository
git clone https://github.com/your-username/eventify.git

# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Set up environment variables
cp .env.example .env

# Start development servers
# Frontend: npm run dev
# Backend: npm run dev
```

### **Code Standards**
- **ESLint** configuration
- **Prettier** formatting
- **Conventional Commits**
- **Code Review** process

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Prince Tagadiya**
- **GitHub**: [@prince-tagadiya](https://github.com/prince-tagadiya)
- **Email**: prince@example.com

## 🙏 Acknowledgments

- **Firebase** for hosting and authentication
- **Railway** for backend deployment
- **MongoDB Atlas** for database hosting
- **TailwindCSS** for styling framework
- **React Community** for excellent documentation

---

**Eventify** - Making event management simple, efficient, and enjoyable! 🎉

# 🎉 Eventify - Comprehensive Event Management Platform

A full-stack MERN application for creating, managing, and participating in events with advanced team collaboration features, role-based access control, and interactive maps.

![Eventify Platform](https://img.shields.io/badge/Eventify-Platform-blue?style=for-the-badge&logo=react)
![MERN Stack](https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)

## 🌟 Features Overview

### 🎯 **Core Features**
- **Multi-Role Platform**: User, Organizer, and Admin roles with distinct dashboards
- **Event Management**: Create, edit, delete, and manage events with rich details
- **Team Collaboration**: Build teams, invite members, and participate as teams
- **Interactive Maps**: World map with event markers and location-based filtering
- **Real-time Analytics**: View counts, participant tracking, and engagement metrics
- **Email Invitations**: Beautiful invitation system with email notifications
- **Responsive Design**: Modern UI with animations and mobile-first approach

### 👥 **Role-Based Access Control (RBAC)**

#### **👤 User (Event Attendee)**
- Browse and search events
- Join/leave events individually or as a team
- Create and manage personal teams
- View event details and participant lists
- Access personal dashboard with event history

#### **🎪 Organizer (Event Host)**
- All User features plus:
- Create and manage events with rich details
- Upload multiple event photos
- Set event categories and tags
- Manage event participants
- View event analytics and insights
- Access organizer dashboard

#### **⚡ Admin (Platform Administrator)**
- All Organizer features plus:
- Manage all users, events, and teams
- View platform-wide analytics
- Impersonate any user account
- Moderate content and manage reports
- Access admin dashboard with dark mode UI

## 🚀 **Getting Started**

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/eventify.git
cd eventify
```

2. **Install dependencies**
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

3. **Environment Setup**

Create `.env` files in both backend and frontend directories:

**Backend (.env)**
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/eventify
JWT_SECRET=your_jwt_secret_here
CLIENT_ORIGIN=http://localhost:5175
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:4000/api
```

4. **Start the application**
```bash
# Start backend (from backend directory)
npm start

# Start frontend (from frontend directory)
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5175
- Backend API: http://localhost:4000

## 🎨 **User Interface Features**

### **🏠 Landing Page**
- Animated hero section with gradient backgrounds
- Feature carousel with smooth transitions
- How-to-use guide with step-by-step instructions
- Statistics showcase
- Call-to-action sections
- Responsive design with mobile optimization

### **🔐 Authentication**
- **Login Page**: Email/username login with show/hide password
- **Registration Page**: Role selection with animated password validation
- **Password Strength**: Real-time password criteria checking
- **JWT Authentication**: Secure token-based authentication
- **Role-based Redirects**: Automatic navigation to appropriate dashboard

### **📊 Dashboards**

#### **User Dashboard**
- Personal event overview
- Recent activities
- Team management
- Event recommendations
- Quick actions

#### **Organizer Dashboard**
- Event creation and management
- Analytics and insights
- Participant tracking
- Event performance metrics
- Organizer profile management

#### **Admin Dashboard**
- Dark mode interface
- User management with impersonation
- Event moderation
- Platform analytics
- Content management tools

### **🗺️ Interactive Maps**
- **World Events Map**: Global event visualization
- **Location Picker**: Dynamic location selection with coordinates
- **City-based Filtering**: 20+ popular cities with distance calculation
- **Nearby Events**: Radius-based event discovery
- **Real-time Location**: Browser geolocation integration

### **📧 Email System**
- **Team Invitations**: Beautiful email templates
- **Invitation Management**: Accept, decline, resend invitations
- **Email Validation**: Secure invitation token system
- **SMTP Integration**: Gmail SMTP support

## 🛠️ **Technical Architecture**

### **Frontend (React + Vite)**
- **React 18**: Latest React features with hooks
- **Vite**: Fast development and build tool
- **React Router**: Client-side routing
- **TailwindCSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **React Leaflet**: Interactive maps
- **Canvas Confetti**: Celebration animations

### **Backend (Node.js + Express)**
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Token authentication
- **bcryptjs**: Password hashing
- **Nodemailer**: Email sending
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security middleware

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
  profilePicture: String,
  bio: String,
  socialLinks: Object,
  organizerProfile: Object,
  preferences: Object
}
```

#### **Event Model**
```javascript
{
  title: String,
  description: String,
  date: Date,
  location: String,
  coordinates: { lat: Number, lng: Number },
  category: String,
  organizer: ObjectId (ref: User),
  participants: [ObjectId],
  teams: [ObjectId],
  photos: [String],
  tags: [String],
  price: Number,
  currency: String,
  views: Number,
  viewHistory: [Object]
}
```

#### **Team Model**
```javascript
{
  name: String,
  description: String,
  owner: ObjectId (ref: User),
  members: [ObjectId],
  events: [ObjectId],
  isPublic: Boolean
}
```

## 🎯 **Key Features in Detail**

### **1. Event Creation & Management**
- **Rich Event Details**: Title, description, date, location, category
- **Multiple Photos**: Upload and manage event images
- **Location Picker**: Interactive map for precise location selection
- **Tags & Categories**: Organize events with tags and categories
- **Pricing Options**: Set event prices with currency support
- **Participant Limits**: Control event capacity
- **Team Participation**: Allow team-based event participation

### **2. Team Collaboration**
- **Team Creation**: Create teams with descriptions and privacy settings
- **Member Management**: Invite, accept, and manage team members
- **Email Invitations**: Send beautiful invitation emails
- **Team Analytics**: Track team performance and participation
- **Role-based Permissions**: Different access levels for team members

### **3. Location & Maps**
- **Interactive Maps**: Leaflet-based map integration
- **City Selection**: 20+ popular cities with coordinates
- **Distance Calculation**: Real-time distance calculation
- **Radius Filtering**: Find events within specified radius
- **Location Detection**: Browser geolocation support
- **Coordinate Storage**: Precise location tracking

### **4. Analytics & Insights**
- **View Tracking**: Real-time event view counting
- **Participant Analytics**: Track event participation
- **Team Performance**: Monitor team engagement
- **User Activity**: Track user behavior and preferences
- **Event Performance**: Measure event success metrics

### **5. Admin Features**
- **User Management**: View, edit, and manage all users
- **Event Moderation**: Review and moderate event content
- **Impersonation**: Login as any user for support
- **Platform Analytics**: System-wide statistics
- **Content Management**: Manage inappropriate content
- **Account Management**: Activate/deactivate user accounts

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### **Events**
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/join` - Join event
- `POST /api/events/:id/leave` - Leave event
- `POST /api/events/:id/view` - Record event view

### **Teams**
- `GET /api/teams` - Get user's teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### **Invitations**
- `POST /api/invites` - Send team invitation
- `GET /api/invites/:token` - Get invitation details
- `POST /api/invites/:token/join` - Accept invitation
- `DELETE /api/invites/:id` - Delete invitation

### **Admin**
- `GET /api/admin/users` - Get all users
- `GET /api/admin/events` - Get all events
- `GET /api/admin/teams` - Get all teams
- `GET /api/admin/analytics` - Get platform analytics
- `POST /api/admin/impersonate/:userId` - Impersonate user
- `DELETE /api/admin/clear-database` - Clear all data

## 🎨 **UI/UX Features**

### **Animations & Effects**
- **Scroll Animations**: Intersection Observer-based animations
- **Confetti Effects**: Celebration animations for milestones
- **Loading States**: Smooth loading indicators
- **Hover Effects**: Interactive hover animations
- **Transitions**: Smooth page and component transitions

### **Responsive Design**
- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Responsive tablet layouts
- **Desktop Experience**: Enhanced desktop interfaces
- **Touch-Friendly**: Optimized for touch interactions

### **Accessibility**
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and semantic HTML
- **Color Contrast**: High contrast color schemes
- **Focus Management**: Proper focus indicators

## 🚀 **Deployment**

### **Frontend Deployment (Vercel)**
```bash
npm run build
vercel --prod
```

### **Backend Deployment (Heroku)**
```bash
heroku create your-app-name
git push heroku main
```

### **Database Deployment (MongoDB Atlas)**
1. Create MongoDB Atlas cluster
2. Update connection string in environment variables
3. Configure IP whitelist

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **React Team** for the amazing framework
- **TailwindCSS** for the utility-first CSS framework
- **Leaflet** for the interactive maps
- **MongoDB** for the database solution
- **Express.js** for the backend framework

## 📞 **Support**

For support and questions:
- Create an issue in the GitHub repository
- Email: support@eventify.com
- Documentation: [docs.eventify.com](https://docs.eventify.com)

---

**Made with ❤️ by the Eventify Team**

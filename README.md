# Eventify - Team Event Management Platform

A full-stack MERN (MongoDB, Express.js, React, Node.js) web application for creating, managing, and participating in events as teams.

## 🚀 Features

### Core Features
- **User Authentication**: Sign up, login, and logout with JWT
- **Event Management**: Create, edit, delete, and join events
- **Team Collaboration**: Create teams and invite members via email
- **Dashboard**: View your events, joined events, and all available events
- **Real-time Updates**: Live updates for event participants and team members

### Team Features
- **Team Creation**: Create teams with custom names and descriptions
- **Email Invitations**: Send secure email invitations to join teams
- **Member Management**: Add/remove team members with detailed profiles
- **Social Profiles**: Team members can add bio and social links
- **Team Participation**: Join events as a team with team name display

### Email System
- **Gmail SMTP Integration**: Professional email invitations
- **Secure Tokens**: 32-character secure tokens for invite links
- **Beautiful Templates**: HTML email templates with Eventify branding
- **Auto-expiration**: Invites expire after 7 days

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Nodemailer** for email functionality
- **CORS** enabled for cross-origin requests

### Frontend
- **React** with React Router
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Axios** for API calls
- **Context API** for state management

### Database
- **MongoDB Atlas** for cloud database
- **Mongoose** schemas for data modeling

## 📁 Project Structure

```
huddle/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.js
│   │   ├── db/
│   │   │   └── mongoose.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── Event.js
│   │   │   ├── Invite.js
│   │   │   ├── Team.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── events.routes.js
│   │   │   ├── invites.routes.js
│   │   │   ├── teams.routes.js
│   │   │   └── users.routes.js
│   │   ├── utils/
│   │   │   ├── email.js
│   │   │   └── jwt.js
│   │   └── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── pages/
│   │   │   ├── CreateEvent.jsx
│   │   │   ├── CreateTeam.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EventDetails.jsx
│   │   │   ├── InviteAccept.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Teams.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Gmail account with App Password for SMTP

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd huddle
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**

   Create `.env` file in the backend directory:
   ```env
   PORT=4000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLIENT_ORIGIN=http://localhost:5176
   
   # Gmail SMTP Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASS=your_app_password
   EMAIL_FROM="Eventify <your_gmail@gmail.com>"
   ```

5. **Start the Application**

   **Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5176
   - Backend API: http://localhost:4000

## 📧 Email Setup

### Gmail SMTP Configuration
1. Enable 2-Step Verification on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → App passwords
   - Select "Mail" and "Other"
   - Copy the 16-character password
3. Use the app password in your `.env` file

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/join` - Join event
- `DELETE /api/events/:id/leave` - Leave event

### Teams
- `GET /api/teams/mine` - Get user's teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `POST /api/teams/:id/members/manual` - Add member manually
- `DELETE /api/teams/:id/members/:userId` - Remove member

### Invitations
- `POST /api/invites/teams/:teamId/invite` - Send email invitation
- `GET /api/invites/:token` - Get invite details
- `POST /api/invites/:token/accept` - Accept invitation
- `GET /api/invites/teams/:teamId/invites` - List pending invites

### Users
- `GET /api/users/:id/events` - Get user's created events
- `GET /api/users/:id/joined` - Get user's joined events

## 🎨 Features in Detail

### Team Invitation Flow
1. Team owner clicks "Invite" button
2. Enters email address of invitee
3. System sends beautiful HTML email with secure invite link
4. Invitee clicks link and fills out profile form
5. User is automatically added to team and logged in

### Event Participation
- Users can join events individually or as a team
- Team participation shows team name in event participants
- Click on team names to see team member details
- Click on member cards to see social links and bio

### Dashboard Features
- **My Events**: Events created by the user
- **Joined Events**: Events the user has joined
- **All Events**: Browse all available events
- **My Teams**: Manage teams and send invitations

## 🔒 Security Features
- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Secure email tokens with expiration

## 🚀 Deployment

### Backend Deployment
- Deploy to platforms like Heroku, Railway, or DigitalOcean
- Set environment variables in production
- Use production MongoDB instance

### Frontend Deployment
- Build with `npm run build`
- Deploy to Vercel, Netlify, or similar platforms
- Update API base URL for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Created by Prince Tagadiya

---

**Eventify** - Bringing teams together through events! 🎉

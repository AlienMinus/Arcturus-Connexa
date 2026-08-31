# ⚡ Arcturus Connexa

<div align="center">
  <img src="public/logo.png" alt="Arcturus Logo" width="90" height="90" />
  <h3>Next-Generation Professional Social, Career & Creator Platform</h3>
  <p>
    A full-stack professional networking platform designed to connect developers, creators, organizations, and recruiters with real-time communication, multimedia feeds, 24-hour ephemeral Tales (stories/status), organization approval workflows, interactive job marketplaces, and daily puzzle games.
  </p>
</div>

---

## 📑 Table of Contents

- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Project Architecture](#-project-architecture)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Installation & Running](#installation--running)
- [📡 API Endpoints Reference](#-api-endpoints-reference)
- [🎨 Themes & UI Features](#-themes--ui-features)
- [🚢 Deployment](#-deployment)
- [📄 License](#-license)

---

## ✨ Key Features

### 1. 📖 24h Ephemeral Stories ("Tales")
- **Dual Creation Modes**: Text statuses with customizable gradient backgrounds and typography palettes + photo and video media stories with caption overlays.
- **Story Player**: Fullscreen story player with segmented progress bars, 5-second auto-advancement, pause/play toggles, and touch navigation zones.
- **Live Reactions**: Instant reaction emoji picker (`❤️`, `🔥`, `👏`, `💡`, `🚀`, `😂`) displaying floating badges on viewer profiles.
- **Contained Interactive Drawers**:
  - **Viewers Sheet**: Lists story viewers with timestamps, profile links, and their latest reaction badges.
  - **Comments System**: Public comment section loaded with smooth in/out animations.
- **Dual DM Integration**: Comments posted on a Tale automatically dispatch as a direct reply message to the author with an embedded semi-blurred Tale card preview.
- **Auto-Expiration**: 24-hour MongoDB TTL expiration index.

### 2. 🔐 Modern Authentication & Organization Verification
- **Frosted Glassmorphism UI**: High-contrast typography, floating inputs, and animated eye toggles.
- **EmailJS OTP Verification**: 4-step registration flow with a 6-digit one-time passcode and 10-minute auto-expiry.
- **Organization Account Approval**: Organizations submit registration verification documents (stored securely in MongoDB & Cloudinary) subject to approval by Arcturus Admin.
- **Secure Password Reset**: One-click reset links with time-limited JWT tokens and EmailJS integration.

### 3. 👑 Graphical Admin Dashboard (`/admin`)
- **Arcturus Admin Control Center**: Exclusive graphical administration dashboard for `arcturus_admin`.
- **Organization Document Review**: Document inspection lightbox for business licenses and tax filings with 1-click Approval and preset Rejection workflows.
- **Platform Analytics**: Real-time stats on registered users, active jobs, posts, server uptime, and pending verification queues.
- **Audit Logs & Quick Actions**: Searchable administrative logs and user role management.

### 4. 📰 Multimedia Feed & Advanced Post Suite
- **Quick Access Creation Bar**: One-click triggers for 📷 Media, 🎥 Video, 📅 Event creation, and 📝 Long-form Article drafts.
- **AI Rewrite & Post Assistant**: 1-click AI enhancements (Professional, Catchy Hook, Concise, Storytelling styles) with undo support.
- **Post Scheduling & Audience Targeting**: Schedule posts for future release and target audiences (Public, Connections, Groups, Drafts).
- **Social Engagement**: Multi-reaction bar, comments with profile navigation, reposts, and share capabilities.

### 5. 💼 Jobs Portal & Recruiter Management
- **MongoDB Jobs Marketplace**: Real-time search and filtering by job title, location, employment type, and tech stack.
- **1-Click Apply**: Direct application submission attaching user credentials, contact details, and headline.
- **Recruiter Portal**: Recruiter-exclusive dashboard to publish openings, customize company logos, and track active listings.

### 6. 💬 Real-Time Messaging & Floating Chat
- **Full Messaging Hub (`/messaging`)**: Split-view conversation drawer with message search, end-to-end encryption indicator, and embedded Tale replies.
- **Floating Mini-Messenger Widget**: Persistent bottom-right chat widget allowing seamless multi-tasking across all pages.

### 7. 🚀 Floating Back to Top Component
- **Scroll Progress Ring**: Integrated SVG circular progress indicator that fills dynamically as you scroll down the page.
- **Smooth Auto-Scroll**: Scrolls smoothly to the top when clicked.
- **Smart Visibility**: Fades into view past 250px scroll depth with mobile clearance above the bottom navigation bar.

### 8. 🎮 Daily Puzzle Games Arcade (`/games`)
- Integrated daily brain puzzles including **Crossclimb**, **Pinpoint**, **Queens**, **Tango**, **Mini Sudoku**, and **Zip**.

### 9. 🎨 Dual Theme & Mobile Responsiveness
- **Default Light Theme**: Clean, accessible light mode designed with high readability.
- **Dark Mode**: Dark slate/navy backgrounds (`#0f172a`, `#1e293b`) with neon blue accents and complete CSS coverage.
- **Mobile First Navigation**: Bottom navigation bar with safe-area insets (`env(safe-area-inset-bottom)`).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/) (FontAwesome, Bootstrap Icons, Remix, React Icons)
- **Styling**: Vanilla CSS Modules + Bootstrap 5 + Glassmorphic Design Tokens + Custom Dark Mode
- **Client SDKs**: `@emailjs/browser`, `axios`

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express 5](https://expressjs.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) via [Mongoose 9](https://mongoosejs.com/)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) + `bcrypt`
- **File & Media Storage**: [Cloudinary SDK](https://cloudinary.com/) + `multer`
- **Email Engine**: [EmailJS REST API](https://www.emailjs.com/)

---

## 📂 Project Architecture

```plaintext
arcturus/
├── public/                     # Static assets (logos, icons, background images)
│   ├── manifest.json           # PWA web manifest
│   ├── login.png               # Auth scenic backdrop image
│   └── logo.png                # Brand logo
├── server/                     # Express.js Backend API
│   ├── middleware/             # Authentication & admin authorization middleware
│   │   ├── auth.js
│   │   └── adminAuth.js
│   ├── models/                 # Mongoose schema models
│   │   ├── User.js             # User accounts, credentials & org details
│   │   ├── Profile.js          # Profile attributes, experience, skills
│   │   ├── Post.js             # Feed posts, likes, reactions & comments
│   │   ├── Tale.js             # 24-hour ephemeral stories, reactions & comments
│   │   ├── Message.js          # Encrypted direct messages & embedded tale replies
│   │   ├── Job.js              # Job listings & candidate applications
│   │   └── Otp.js              # Temporary OTP verification with TTL
│   ├── routes/                 # REST API endpoints
│   │   ├── auth.js             # Registration, login, OTP & password reset
│   │   ├── admin.js            # Admin metrics, org approvals & audit logs
│   │   ├── tales.js            # 24h stories, reactions & comments
│   │   ├── profile.js          # Profile queries & updates
│   │   ├── posts.js            # Post creation, AI rewrite & engagement
│   │   ├── messages.js         # Conversation threads
│   │   ├── notifications.js    # Activity alerts & updates
│   │   └── jobs.js             # Job openings & recruiter operations
│   ├── templates/              # HTML Email Templates (EmailJS)
│   ├── utils/                  # Cloudinary uploaders, JWT signing, password hashing
│   └── server.js               # Express application entry point
├── src/                        # React Frontend Application
│   ├── components/             # Reusable UI components
│   │   ├── Tale/               # TaleTray, CreateTaleModal, TaleViewerModal
│   │   ├── Home/               # Feed, PostCard, PostModal, Messenger, Sidebars
│   │   ├── Games/              # Puzzle games arcade
│   │   ├── admin/              # Admin dashboard widgets & document lightbox
│   │   ├── common/             # BackToTop, buttons & shared components
│   │   ├── Navbar/             # Global navigation bar, search & drawer
│   │   └── Profile/            # Profile sections & modals
│   ├── context/                # Global React State Contexts
│   │   ├── AuthContext.jsx     # User session & token management
│   │   ├── ProfileContext.jsx  # Active user profile data
│   │   ├── ThemeContext.jsx    # Light / Dark theme toggling
│   │   └── ReactionContext.jsx # Global reaction states
│   ├── pages/                  # Top-level Page Views
│   │   ├── admin/              # AdminDashboard page
│   │   ├── AuthPage/           # Authentication hub
│   │   ├── HomePage/           # Main activity feed & Tale tray
│   │   ├── JobsPage/           # Jobs discovery marketplace
│   │   ├── JobPostingPage/     # Recruiter job management portal
│   │   ├── MessegingPage/      # Full-page messaging center
│   │   ├── NotificationsPage/  # Clickable activity & connection alerts
│   │   ├── ProfilePage/        # User portfolio & details
│   │   ├── SettingsPage/       # Account, security & privacy preferences
│   │   └── HelpPage/           # Help center & support tickets
│   ├── utils/                  # Client helpers, user name resolution, API URL builders
│   ├── darkmode.css            # Dark mode overrides & theme variables
│   ├── mobile.css              # Mobile screen styles & safe-area insets
│   ├── index.css               # Global base styles & CSS variables
│   ├── Router.jsx              # Application route tree
│   └── App.jsx
├── vite.config.js              # Vite bundler & API proxy configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB Atlas** database cluster
- **Cloudinary** account (for media storage)
- **EmailJS** account (for transactional OTP & password reset emails)

---

### Environment Setup

#### 1. Backend Environment Variables (`server/.env`)

Create a file named `.env` inside the `server/` directory:

```env
# Server Port & URLs
PORT=3000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/arcturus?retryWrites=true&w=majority

# JWT Security
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=12345678901234567890123456789012

# Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# EmailJS Service Integration
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
EMAILJS_TEMPLATE_RESET_PASSWORD=template_xxxxxxx
EMAILJS_TEMPLATE_OTP=template_yyyyyyy
```

#### 2. Frontend Environment Variables (`.env`)

Create a file named `.env` in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

### Installation & Running

#### Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

#### Step 2: Start the Development Servers

```bash
# Terminal 1: Start Backend Server
cd server
npm start

# Terminal 2: Start Frontend Vite Dev Server
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 📡 API Endpoints Reference

### 📖 Ephemeral Stories / Statuses (`/api/tales`)

| Method   | Endpoint                  | Description                                                | Auth Required |
| :------- | :------------------------ | :--------------------------------------------------------- | :-----------: |
| `GET`    | `/api/tales`              | Fetch active, unexpired stories grouped by user            |      ❌       |
| `POST`   | `/api/tales`              | Create a new Tale (text status or media story)             |      ✅       |
| `POST`   | `/api/tales/:id/view`     | Mark story as viewed by authenticated user                 |      ✅       |
| `POST`   | `/api/tales/:id/react`    | React to a story with an emoji                             |      ✅       |
| `POST`   | `/api/tales/:id/comment`  | Post public comment on story & send DM reply to author     |      ✅       |
| `DELETE` | `/api/tales/:id`          | Delete own story                                           |  ✅ (Author)  |

### 👑 Admin Operations (`/api/admin`)

| Method   | Endpoint                          | Description                                             | Auth Required |
| :------- | :-------------------------------- | :------------------------------------------------------ | :-----------: |
| `GET`    | `/api/admin/metrics`              | Fetch system statistics and pending verification counts |  ✅ (Admin)   |
| `GET`    | `/api/admin/organizations`        | List organizations with document review status          |  ✅ (Admin)   |
| `POST`   | `/api/admin/organizations/approve`| Approve organization account                            |  ✅ (Admin)   |
| `POST`   | `/api/admin/organizations/reject` | Reject organization account with reason preset          |  ✅ (Admin)   |
| `GET`    | `/api/admin/audit-logs`           | Retrieve platform audit activity logs                   |  ✅ (Admin)   |

### 🔑 Authentication (`/api/auth`)

| Method   | Endpoint                          | Description                                             | Auth Required |
| :------- | :-------------------------------- | :------------------------------------------------------ | :-----------: |
| `POST`   | `/api/auth/send-registration-otp` | Sends 6-digit OTP to email                              |      ❌       |
| `POST`   | `/api/auth/register`              | Verifies OTP and creates user / organization account    |      ❌       |
| `POST`   | `/api/auth/login`                 | Authenticates user & issues JWT                         |      ❌       |
| `POST`   | `/api/auth/forgot-password`       | Dispatches password reset link                          |      ❌       |
| `POST`   | `/api/auth/reset-password`        | Resets password with token                              |      ❌       |

### 📰 Feed & Posts (`/api/posts`)

| Method   | Endpoint                   | Description                                                | Auth Required |
| :------- | :------------------------- | :--------------------------------------------------------- | :-----------: |
| `GET`    | `/api/posts`               | Fetch feed posts with populated author profiles            |      ✅       |
| `POST`   | `/api/posts`               | Create new post with media, audience, and optional schedule|      ✅       |
| `POST`   | `/api/posts/:id/like`      | Like or react to a post                                    |      ✅       |
| `POST`   | `/api/posts/:id/comment`   | Add a comment to a post                                    |      ✅       |
| `DELETE` | `/api/posts/:id`           | Delete post                                                |  ✅ (Author)  |

### 💼 Jobs Marketplace (`/api/jobs`)

| Method   | Endpoint                  | Description                                                | Auth Required |
| :------- | :------------------------ | :--------------------------------------------------------- | :-----------: |
| `GET`    | `/api/jobs`               | Retrieve active openings with query filters                |      ❌       |
| `GET`    | `/api/jobs/my-listings`   | Get jobs published by authenticated recruiter              |      ✅       |
| `POST`   | `/api/jobs`               | Publish a new job opening                                  |      ✅       |
| `POST`   | `/api/jobs/:id/apply`     | 1-Click apply to a job listing                             |      ✅       |
| `DELETE` | `/api/jobs/:id`           | Close and delete a job listing                             |  ✅ (Owner)   |

### 💬 Messaging (`/api/messages`)

| Method   | Endpoint                      | Description                                              | Auth Required |
| :------- | :---------------------------- | :------------------------------------------------------- | :-----------: |
| `GET`    | `/api/messages/conversations` | List conversation threads with unread counts             |      ✅       |
| `GET`    | `/api/messages/:userId`       | Fetch chat history with user                             |      ✅       |
| `POST`   | `/api/messages`               | Send direct encrypted message or embedded tale reply     |      ✅       |

---

## 🎨 Themes & UI Features

- **Dual Theme System**: Seamless instant switching between clean light mode and dark mode with persistent `localStorage` synchronization.
- **Glassmorphic Aesthetics**: Frosted glass inputs, modals, and embedded preview cards with real-time backdrop filters.
- **Responsive Layout**: Fluid layouts across ultra-wide monitors, laptops, tablets, and smartphones with dedicated bottom tab navigation.

---

## 🚢 Deployment

### Deploy Backend to [Render](https://render.com)
1. Connect your GitHub repository to Render as a **Web Service**.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Add all backend environment variables in the **Environment** tab.

### Deploy Frontend to [Vercel](https://vercel.com)
1. Import your GitHub repository into Vercel.
2. Set **Framework Preset** to `Vite`.
3. Add `VITE_API_BASE_URL=https://your-render-service.onrender.com/api`.
4. Deploy!

---

## 📄 License

This project is available under the **MIT License**.

---

<div align="center">
  <b>Built with ❤️ by the Arcturus Team</b>
</div>

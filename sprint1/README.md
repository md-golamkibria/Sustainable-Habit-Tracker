# Sprint 1 - Sustainable Habit Tracker

## 🎯 Features Included
- **Framework Setup**: React + TailwindCSS frontend, Node.js + Express + MongoDB backend
- **Basic Authentication**: Simple username-based login system with session management
- **User Profile Management**: Create/read user information and goals
- **Log Daily Sustainable Actions**: Record biking, recycling, walking, and other eco-friendly activities
- **Dashboard**: Overview of user stats and recent activity

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Setup & Installation

1. **Install dependencies**:
```bash
cd sprint1
npm install
cd view && npm install
```

2. **Configure environment**:
   - Copy `.env` file and update MongoDB connection if needed
   - Default settings work with local MongoDB

3. **Start the application**:
```bash
# Start both backend and frontend
npm run dev

# Or start individually:
# Backend: npm run server
# Frontend: npm run client
```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 📁 Project Structure

```
sprint1/
├── model/              # Database models
│   ├── User.js         # User schema
│   └── Action.js       # Action schema
├── controller/         # API controllers
│   ├── authController.js
│   ├── userController.js
│   └── actionController.js
├── view/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Profile.js
│   │   │   ├── LogAction.js
│   │   │   └── Navigation.js
│   │   └── App.js
│   └── ...
├── shared/             # Shared utilities
└── server.js           # Express server
```

## 🔧 API Endpoints

### Authentication
- `POST /login` - Create user account with username
- `POST /logout` - Sign out user

### User Management
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile and goals

### Actions
- `POST /actions/log` - Log a new sustainable action
- `GET /actions/list` - Get user's actions (with pagination)
- `GET /actions/stats` - Get action statistics

## 🌱 Supported Actions
- 🚴 Biking (km, miles, times)
- ♻️ Recycling (items, kg, lbs)
- 🚶 Walking (km, miles, steps, times)
- 🚌 Public Transport (trips, km, miles)
- 🛍️ Reusable Bags (times, bags)
- 💡 Energy Saving (hours, times)
- 💧 Water Conservation (minutes, liters, times)

## 💡 Usage

1. **Sign Up**: Enter any username to create an account
2. **Profile Setup**: Customize your profile and set sustainability goals
3. **Log Actions**: Record your daily eco-friendly activities
4. **Track Progress**: View your impact on the dashboard

## 🔄 Development

```bash
# Backend development
npm run server

# Frontend development
cd view && npm start

# Install new packages
npm install <package-name>
cd view && npm install <frontend-package>
```

## 📊 Environmental Impact Calculation
The app automatically calculates CO₂ and water savings based on:
- Action type (biking, recycling, etc.)
- Quantity and unit
- Predefined environmental impact factors

## 🐛 Troubleshooting

1. **MongoDB Connection Issues**:
   - Ensure MongoDB is running locally
   - Check `.env` file for correct connection string

2. **Port Conflicts**:
   - Backend runs on port 5001
   - Frontend runs on port 3000
   - Update ports in `.env` and `package.json` if needed

3. **Session Issues**:
   - Clear browser cookies/storage
   - Restart the server

## 🔮 Next Steps (Sprint 2)
- Environmental impact tracking with detailed metrics
- Goal setting and progress tracking
- Dashboard analytics with charts
- Challenges and rewards system

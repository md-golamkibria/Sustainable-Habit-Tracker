# 🌱 Sprint 3: Complete Sustainable Habit Tracker

## Overview

Sprint 3 represents the complete evolution of the Sustainable Habit Tracker, featuring advanced social interactions, comprehensive gamification, real-time features, and a thriving community platform. Built on the foundation of Sprint 2, this version introduces cutting-edge features for a fully immersive sustainability experience.

## New Features in Sprint 3

### Social Features
- **Friend System**: Send and accept friend requests, build your sustainability network
- **Following System**: Follow other users to stay updated on their progress
- **Privacy Controls**: Manage who can see your profile and activities
- **User Search**: Find friends by username, location, or interests

### Advanced Gamification
- **Leveling System**: Progress through levels with experience points
- **Achievement System**: Unlock badges and rewards for various milestones
- **Points & Rewards**: Earn points and redeem them for real rewards
- **User Titles**: Display special titles on your profile
- **Rarity System**: Common to Legendary rewards with different point values

### Leaderboards & Competition
- **Global Leaderboards**: Compete with users worldwide
- **Friends Leaderboards**: See how you rank among friends
- **Local/Regional Rankings**: Compare with users in your area
- **Category-Based Rankings**: Leaderboards for different metrics
- **Achievement Leaderboards**: Rankings based on completed achievements

### Community Platform
- **Community Posts**: Share achievements, tips, and experiences
- **Post Types**: Action shares, achievements, tips, questions, challenges
- **Social Interactions**: Like, comment, and share posts
- **Trending Posts**: Discover popular content in the community
- **User Feeds**: Personalized feeds from friends and followed users

### Real-Time Notifications
- **Socket.io Integration**: Real-time updates and notifications
- **Rich Notifications**: Friend requests, likes, comments, achievements
- **Push Notifications**: Stay engaged with timely reminders
- **Notification Management**: Mark as read, delete, and subscribe preferences

### Rewards System
- **Multiple Reward Types**: Badges, titles, points, physical items, experiences
- **Eligibility Checking**: Automatic validation of reward requirements
- **Wishlist System**: Save rewards for later redemption
- **Redemption History**: Track all your redeemed rewards
- **Limited-Time Offers**: Special rewards with expiration dates

## Technical Enhancements

### Security & Performance
- **Helmet.js**: Enhanced security headers
- **Rate Limiting**: Protect against abuse and spam
- **Data Compression**: Improved response times
- **Input Validation**: Comprehensive data validation

### Real-Time Features
- **Socket.io Server**: Real-time communication infrastructure
- **User Rooms**: Private channels for personalized updates
- **Live Notifications**: Instant updates for social interactions
- **Real-Time Leaderboards**: Live ranking updates

### Enhanced User Experience
- **Improved UI/UX**: Better navigation and user flows
- **Profile Management**: Comprehensive user profile settings
- **Activity Tracking**: Detailed user activity monitoring
- **Social Privacy**: Granular privacy controls

## Installation & Setup

### Prerequisites
- Node.js 14+ 
- MongoDB 4.4+
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   cd sprint3
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file with:
   ```env
   MONGODB_URI=mongodb://localhost:27017/habit-tracker-sprint3
   SESSION_SECRET=your-session-secret-here
   PORT=5003
   ```

3. **Database Setup**
   ```bash
   # Seed sample rewards
   node utils/seedRewards.js
   ```

4. **Start the Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

5. **Access the Application**
   - Server: http://localhost:5003
   - API Documentation: Available through route exploration

## Project Structure

```
sprint3/
├── controller/           # Route handlers
│   ├── authController.js
│   ├── userController.js
│   ├── actionController.js
│   ├── analyticsController.js
│   ├── challengeController.js
│   ├── goalController.js
│   ├── socialController.js         # NEW: Social features
│   ├── leaderboardController.js    # NEW: Competition & rankings
│   ├── rewardsController.js        # NEW: Rewards system
│   ├── communityController.js      # NEW: Community platform
│   └── notificationsController.js  # NEW: Notifications
├── model/               # Database schemas
│   ├── User.js          # Enhanced with social & gamification
│   ├── Action.js
│   ├── Challenge.js
│   ├── Goal.js
│   ├── Community.js     # NEW: Community posts
│   ├── Notification.js  # NEW: Rich notifications
│   └── Reward.js        # NEW: Rewards system
├── utils/              # Utilities
│   └── seedRewards.js  # Database seeding
├── server.js           # Main server with Socket.io
└── package.json
```

##  API Endpoints

### Social Features
- `GET /social/search-users` - Search for users
- `POST /social/send-friend-request` - Send friend request
- `POST /social/respond-friend-request` - Accept/decline request
- `GET /social/friends` - Get friends list
- `DELETE /social/unfriend` - Remove friend
- `POST /social/follow` - Follow user
- `DELETE /social/unfollow` - Unfollow user
- `GET /social/profile/:userId` - Get user profile

### Leaderboards
- `GET /leaderboard/global` - Global rankings
- `GET /leaderboard/friends` - Friends rankings
- `GET /leaderboard/local` - Local/regional rankings
- `GET /leaderboard/achievements` - Achievement rankings
- `GET /leaderboard/streaks` - Streak rankings
- `GET /leaderboard/stats` - Leaderboard statistics

### Rewards System
- `GET /rewards/available` - Available rewards
- `GET /rewards/categories` - Reward categories
- `POST /rewards/redeem` - Redeem reward
- `GET /rewards/my-rewards` - User's redeemed rewards
- `GET /rewards/featured` - Featured/trending rewards
- `POST /rewards/wishlist` - Add to wishlist
- `GET /rewards/wishlist` - Get wishlist

### Community Platform
- `GET /community/feed` - Personalized feed
- `GET /community/trending` - Trending posts
- `GET /community/search` - Search posts
- `POST /community/posts` - Create post
- `GET /community/posts/:postId` - Get single post
- `POST /community/posts/:postId/like` - Like post
- `POST /community/posts/:postId/comment` - Comment on post
- `POST /community/posts/:postId/share` - Share post
- `DELETE /community/posts/:postId` - Delete post

### Notifications
- `GET /notifications` - Get notifications
- `PATCH /notifications/mark-read` - Mark as read
- `DELETE /notifications/delete` - Delete notifications
- `POST /notifications/subscribe` - Subscribe to push notifications

## Gamification System

### User Progression
- **Experience Points (XP)**: Earned through actions and achievements
- **Levels**: Unlock new features and rewards as you progress
- **Points**: Currency for redeeming rewards
- **Streaks**: Maintain consistency for bonus rewards

### Achievement Categories
- **Environmental Impact**: CO2 reduction, water savings
- **Social Engagement**: Friends, community participation
- **Consistency**: Daily streaks, regular actions
- **Milestones**: Major accomplishments
- **Challenges**: Community challenge completion
- **Community**: Social interactions and leadership
- **Special Events**: Limited-time achievements

### Reward Types
- **Badges**: Digital badges for achievements
- **Titles**: Special profile titles
- **Points**: Bonus points for progression
- **Physical Items**: Real-world sustainable products
- **Experiences**: Tree planting, carbon offsets
- **Discounts**: Partner store discounts

## Real-Time Features

### Socket.io Integration
- **User Rooms**: Private channels for each user
- **Live Notifications**: Instant friend requests, likes, comments
- **Real-Time Updates**: Leaderboard changes, new achievements
- **Community Interactions**: Live post interactions

### Notification Types
- Friend requests and acceptances
- Post likes and comments
- Achievement unlocks
- Reward redemptions
- Challenge completions
- Community mentions

## Analytics & Insights

### User Analytics
- **Personal Progress**: Track your own growth and achievements
- **Social Analytics**: Friend activity and community insights
- **Goal Tracking**: Monitor progress toward personal goals
- **Impact Metrics**: CO2 saved, water conserved, actions completed

### Community Analytics
- **Leaderboard Positions**: Track your rankings
- **Community Engagement**: Post interactions and reach
- **Achievement Progress**: See what you're close to unlocking
- **Reward Statistics**: Redemption history and wishlist

##  Performance & Scalability

### Optimizations
- **Database Indexing**: Optimized queries for all major operations
- **Caching**: Intelligent caching for frequently accessed data
- **Real-Time Efficiency**: Optimized Socket.io event handling
- **Rate Limiting**: Prevent abuse and ensure fair usage

### Monitoring
- **Scheduled Tasks**: Automated leaderboard updates and notifications
- **Error Handling**: Comprehensive error logging and recovery
- **Performance Metrics**: Built-in monitoring for key operations

## Development & Deployment

### Development Mode
```bash
npm run dev  # Run with nodemon for auto-restart
```

### Production Deployment
1. Set environment variables for production
2. Enable HTTPS and secure cookies
3. Configure production MongoDB instance
4. Set up proper logging and monitoring
5. Configure reverse proxy (nginx/Apache)

### Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db/habit-tracker
SESSION_SECRET=your-secure-session-secret
PORT=5003
CORS_ORIGIN=https://yourdomain.com
```

## Contributing

### Feature Development
1. Create feature branch from main
2. Implement feature with tests
3. Update documentation
4. Submit pull request

### Code Style
- Follow existing patterns and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure proper error handling

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Express.js, MongoDB, and Socket.io
- Inspired by sustainable living and community building
- Thanks to all contributors and the open-source community

---

**Sprint 3 Complete - Ready for Production! **

This version represents a fully-featured, production-ready sustainable habit tracking platform with advanced social features, comprehensive gamification, and real-time community interaction capabilities.

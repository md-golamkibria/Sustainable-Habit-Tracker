const express = require('express');
const User = require('../model/User');
const Notification = require('../model/Notification');
const Community = require('../model/Community');
const router = express.Router();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
};

// GET /social/search-users - Search for users to add as friends
router.get('/search-users', requireAuth, async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    const currentUserId = req.session.userId;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query must be at least 2 characters' 
      });
    }
    
    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(query.trim(), 'i');
    
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: searchRegex },
        { bio: searchRegex },
        { location: searchRegex }
      ],
      'social.isPublic': true
    })
    .select('username bio location avatar gamification.level stats.totalActions social.friends')
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ 'stats.totalActions': -1 });
    
    // Add friendship status for each user
    const currentUser = await User.findById(currentUserId);
    const usersWithStatus = users.map(user => {
      let friendshipStatus = 'none';
      
      // Check if already friends
      const friendship = currentUser.social.friends.find(f => 
        f.user.toString() === user._id.toString()
      );
      
      if (friendship) {
        friendshipStatus = friendship.status;
      }
      
      // Check if user is following
      const isFollowing = currentUser.social.following.includes(user._id);
      
      return {
        _id: user._id,
        username: user.username,
        bio: user.bio,
        location: user.location,
        avatar: user.avatar,
        level: user.gamification.level,
        totalActions: user.stats.totalActions,
        friendshipStatus,
        isFollowing,
        friendCount: user.social.friends.filter(f => f.status === 'accepted').length
      };
    });
    
    res.json({
      success: true,
      data: {
        users: usersWithStatus,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: users.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
});

// POST /social/send-friend-request - Send a friend request
router.post('/send-friend-request', requireAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.session.userId;
    
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required' });
    }
    
    if (targetUserId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
    }
    
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);
    
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (!targetUser.social.allowFriendRequests) {
      return res.status(403).json({ success: false, message: 'User is not accepting friend requests' });
    }
    
    // Check if friendship already exists
    const existingFriendship = currentUser.social.friends.find(f => 
      f.user.toString() === targetUserId
    );
    
    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'Already friends with this user' });
      } else {
        return res.status(400).json({ success: false, message: 'Friend request already sent' });
      }
    }
    
    // Add pending friendship to both users
    currentUser.social.friends.push({
      user: targetUserId,
      status: 'pending',
      addedDate: new Date()
    });
    
    targetUser.social.friends.push({
      user: currentUserId,
      status: 'pending',
      addedDate: new Date()
    });
    
    await Promise.all([currentUser.save(), targetUser.save()]);
    
    // Create notification for target user
    await Notification.createNotification({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'friend_request',
      title: '👥 New Friend Request',
      message: `${currentUser.username} wants to be your friend!`,
      priority: 'medium',
      actionUrl: `/social/friends/requests`
    });
    
    // Emit real-time notification if target user is online
    if (req.io) {
      req.io.to(`user-${targetUserId}`).emit('notification', {
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${currentUser.username} wants to be your friend!`,
        sender: {
          id: currentUserId,
          username: currentUser.username,
          avatar: currentUser.avatar
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });
    
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ success: false, message: 'Failed to send friend request' });
  }
});

// POST /social/respond-friend-request - Accept or decline a friend request
router.post('/respond-friend-request', requireAuth, async (req, res) => {
  try {
    const { senderUserId, action } = req.body; // action: 'accept' or 'decline'
    const currentUserId = req.session.userId;
    
    if (!senderUserId || !action) {
      return res.status(400).json({ success: false, message: 'Sender ID and action are required' });
    }
    
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be accept or decline' });
    }
    
    const [currentUser, senderUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(senderUserId)
    ]);
    
    if (!senderUser) {
      return res.status(404).json({ success: false, message: 'Sender user not found' });
    }
    
    // Find the pending friendship
    const currentUserFriendship = currentUser.social.friends.find(f => 
      f.user.toString() === senderUserId && f.status === 'pending'
    );
    
    const senderUserFriendship = senderUser.social.friends.find(f => 
      f.user.toString() === currentUserId && f.status === 'pending'
    );
    
    if (!currentUserFriendship || !senderUserFriendship) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }
    
    if (action === 'accept') {
      // Update friendship status to accepted
      currentUserFriendship.status = 'accepted';
      senderUserFriendship.status = 'accepted';
      
      await Promise.all([currentUser.save(), senderUser.save()]);
      
      // Create notification for sender
      await Notification.createNotification({
        recipient: senderUserId,
        sender: currentUserId,
        type: 'friend_accepted',
        title: '🎉 Friend Request Accepted!',
        message: `${currentUser.username} accepted your friend request!`,
        priority: 'medium',
        actionUrl: `/profile/${currentUserId}`
      });
      
      // Real-time notification
      if (req.io) {
        req.io.to(`user-${senderUserId}`).emit('notification', {
          type: 'friend_accepted',
          title: 'Friend Request Accepted!',
          message: `${currentUser.username} accepted your friend request!`,
          sender: {
            id: currentUserId,
            username: currentUser.username,
            avatar: currentUser.avatar
          }
        });
      }
      
      res.json({
        success: true,
        message: 'Friend request accepted'
      });
      
    } else {
      // Remove friendship entries for decline
      currentUser.social.friends = currentUser.social.friends.filter(f => 
        f.user.toString() !== senderUserId
      );
      senderUser.social.friends = senderUser.social.friends.filter(f => 
        f.user.toString() !== currentUserId
      );
      
      await Promise.all([currentUser.save(), senderUser.save()]);
      
      res.json({
        success: true,
        message: 'Friend request declined'
      });
    }
    
  } catch (error) {
    console.error('Respond friend request error:', error);
    res.status(500).json({ success: false, message: 'Failed to respond to friend request' });
  }
});

// GET /social/friends - Get user's friends list
router.get('/friends', requireAuth, async (req, res) => {
  try {
    const { status = 'accepted', page = 1, limit = 50 } = req.query;
    const currentUserId = req.session.userId;
    
    const skip = (page - 1) * limit;
    
    const user = await User.findById(currentUserId)
      .populate({
        path: 'social.friends.user',
        select: 'username bio location avatar gamification.level stats.totalActions lastActive isOnline',
        options: { 
          skip: skip,
          limit: parseInt(limit)
        }
      });
    
    const friends = user.social.friends
      .filter(f => f.status === status)
      .map(f => ({
        _id: f.user._id,
        username: f.user.username,
        bio: f.user.bio,
        location: f.user.location,
        avatar: f.user.avatar,
        level: f.user.gamification.level,
        totalActions: f.user.stats.totalActions,
        lastActive: f.user.lastActive,
        isOnline: f.user.isOnline,
        friendshipDate: f.addedDate,
        status: f.status
      }));
    
    res.json({
      success: true,
      data: {
        friends,
        count: friends.length,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: friends.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ success: false, message: 'Failed to get friends' });
  }
});

// GET /social/friend-requests - Get pending friend requests
router.get('/friend-requests', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    
    const user = await User.findById(currentUserId)
      .populate({
        path: 'social.friends.user',
        select: 'username bio avatar gamification.level stats.totalActions'
      });
    
    const pendingRequests = user.social.friends
      .filter(f => f.status === 'pending')
      .map(f => ({
        _id: f.user._id,
        username: f.user.username,
        bio: f.user.bio,
        avatar: f.user.avatar,
        level: f.user.gamification.level,
        totalActions: f.user.stats.totalActions,
        requestDate: f.addedDate
      }));
    
    res.json({
      success: true,
      data: {
        requests: pendingRequests,
        count: pendingRequests.length
      }
    });
    
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get friend requests' });
  }
});

// DELETE /social/unfriend - Remove a friend
router.delete('/unfriend', requireAuth, async (req, res) => {
  try {
    const { friendUserId } = req.body;
    const currentUserId = req.session.userId;
    
    if (!friendUserId) {
      return res.status(400).json({ success: false, message: 'Friend user ID is required' });
    }
    
    const [currentUser, friendUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(friendUserId)
    ]);
    
    if (!friendUser) {
      return res.status(404).json({ success: false, message: 'Friend user not found' });
    }
    
    // Remove from both users' friend lists
    currentUser.social.friends = currentUser.social.friends.filter(f => 
      f.user.toString() !== friendUserId
    );
    friendUser.social.friends = friendUser.social.friends.filter(f => 
      f.user.toString() !== currentUserId
    );
    
    await Promise.all([currentUser.save(), friendUser.save()]);
    
    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
    
  } catch (error) {
    console.error('Unfriend error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove friend' });
  }
});

// POST /social/follow - Follow a user
router.post('/follow', requireAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.session.userId;
    
    if (!targetUserId || targetUserId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Invalid target user ID' });
    }
    
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);
    
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if already following
    if (currentUser.social.following.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Already following this user' });
    }
    
    // Add to following/followers
    currentUser.social.following.push(targetUserId);
    targetUser.social.followers.push(currentUserId);
    
    await Promise.all([currentUser.save(), targetUser.save()]);
    
    res.json({
      success: true,
      message: 'Now following user'
    });
    
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ success: false, message: 'Failed to follow user' });
  }
});

// DELETE /social/unfollow - Unfollow a user
router.delete('/unfollow', requireAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.session.userId;
    
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required' });
    }
    
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);
    
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Remove from following/followers
    currentUser.social.following = currentUser.social.following.filter(id => 
      id.toString() !== targetUserId
    );
    targetUser.social.followers = targetUser.social.followers.filter(id => 
      id.toString() !== currentUserId
    );
    
    await Promise.all([currentUser.save(), targetUser.save()]);
    
    res.json({
      success: true,
      message: 'Unfollowed user'
    });
    
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ success: false, message: 'Failed to unfollow user' });
  }
});

// GET /social/profile/:userId - Get user's public profile
router.get('/profile/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.session.userId;
    
    const user = await User.findById(userId)
      .select('-social.friends.user')
      .populate('social.followers', 'username avatar')
      .populate('social.following', 'username avatar');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check friendship status
    const currentUser = await User.findById(currentUserId);
    let friendshipStatus = 'none';
    let isFollowing = false;
    
    if (currentUser) {
      const friendship = currentUser.social.friends.find(f => 
        f.user.toString() === userId
      );
      if (friendship) {
        friendshipStatus = friendship.status;
      }
      
      isFollowing = currentUser.social.following.includes(userId);
    }
    
    // Build response based on privacy settings and friendship
    const canViewPrivateInfo = userId === currentUserId || 
      (user.social.isPublic && friendshipStatus === 'accepted');
    
    const profileData = {
      _id: user._id,
      username: user.username,
      bio: user.bio,
      location: user.location,
      avatar: user.avatar,
      level: user.gamification.level,
      badges: user.gamification.badges,
      joinDate: user.createdAt,
      friendshipStatus,
      isFollowing,
      followerCount: user.social.followers.length,
      followingCount: user.social.following.length,
      friendCount: user.social.friends.filter(f => f.status === 'accepted').length
    };
    
    if (canViewPrivateInfo) {
      profileData.stats = user.formattedStats;
      profileData.achievements = user.gamification.achievements.filter(a => a.completed);
      profileData.recentActivity = {
        totalActions: user.stats.totalActions,
        currentStreak: user.stats.currentStreak,
        lastActive: user.lastActive
      };
    }
    
    res.json({
      success: true,
      data: profileData
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

module.exports = router;

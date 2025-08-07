const express = require('express');
const User = require('../model/User');
const Reward = require('../model/Reward');
const Notification = require('../model/Notification');
const router = express.Router();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
};

// GET /rewards/available - Get available rewards for user
router.get('/available', requireAuth, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const currentUserId = req.session.userId;
    const skip = (page - 1) * limit;
    
    // Get current user to check eligibility
    const currentUser = await User.findById(currentUserId);
    
    // Build filter criteria
    let filterCriteria = { isActive: true };
    if (category && category !== 'all') {
      filterCriteria.category = category;
    }
    
    // Get available rewards
    const rewards = await Reward.find(filterCriteria)
      .sort({ pointsCost: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Check eligibility and format rewards
    const availableRewards = await Promise.all(rewards.map(async (reward) => {
      const isEligible = await reward.checkEligibility(currentUserId);
      const hasRedeemed = currentUser.gamification.redeemedRewards.some(r => 
        r.reward.toString() === reward._id.toString()
      );
      
      return {
        _id: reward._id,
        title: reward.title,
        description: reward.description,
        category: reward.category,
        type: reward.type,
        pointsCost: reward.pointsCost,
        image: reward.image,
        isEligible,
        hasRedeemed,
        canAfford: currentUser.gamification.points >= reward.pointsCost,
        redemptionCount: reward.redemptionCount,
        maxRedemptions: reward.maxRedemptions,
        expiresAt: reward.expiresAt
      };
    }));
    
    res.json({
      success: true,
      data: {
        rewards: availableRewards,
        userPoints: currentUser.gamification.points,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: rewards.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get available rewards error:', error);
    res.status(500).json({ success: false, message: 'Failed to get available rewards' });
  }
});

// GET /rewards/categories - Get reward categories
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const categories = await Reward.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          minPoints: { $min: '$pointsCost' },
          maxPoints: { $max: '$pointsCost' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: categories.map(cat => ({
        category: cat._id,
        count: cat.count,
        pointsRange: {
          min: cat.minPoints,
          max: cat.maxPoints
        }
      }))
    });
    
  } catch (error) {
    console.error('Get reward categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to get reward categories' });
  }
});

// POST /rewards/redeem - Redeem a reward
router.post('/redeem', requireAuth, async (req, res) => {
  try {
    const { rewardId } = req.body;
    const currentUserId = req.session.userId;
    
    if (!rewardId) {
      return res.status(400).json({ success: false, message: 'Reward ID is required' });
    }
    
    const [reward, user] = await Promise.all([
      Reward.findById(rewardId),
      User.findById(currentUserId)
    ]);
    
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }
    
    if (!reward.isActive) {
      return res.status(400).json({ success: false, message: 'Reward is no longer available' });
    }
    
    // Check if reward has expired
    if (reward.expiresAt && reward.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Reward has expired' });
    }
    
    // Check if user has enough points
    if (user.gamification.points < reward.pointsCost) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient points. You need ${reward.pointsCost} points but have ${user.gamification.points}` 
      });
    }
    
    // Check eligibility
    const isEligible = await reward.checkEligibility(currentUserId);
    if (!isEligible) {
      return res.status(403).json({ success: false, message: 'You are not eligible for this reward' });
    }
    
    // Check if already redeemed (for non-repeatable rewards)
    const hasAlreadyRedeemed = user.gamification.redeemedRewards.some(r => 
      r.reward.toString() === rewardId
    );
    
    if (hasAlreadyRedeemed && !reward.isRepeatable) {
      return res.status(400).json({ success: false, message: 'You have already redeemed this reward' });
    }
    
    // Check max redemptions
    if (reward.maxRedemptions && reward.redemptionCount >= reward.maxRedemptions) {
      return res.status(400).json({ success: false, message: 'Reward redemption limit reached' });
    }
    
    // Process redemption
    user.gamification.points -= reward.pointsCost;
    user.gamification.redeemedRewards.push({
      reward: rewardId,
      redeemedAt: new Date(),
      pointsCost: reward.pointsCost
    });
    
    // Update reward redemption count
    reward.redemptionCount += 1;
    reward.lastRedeemedAt = new Date();
    
    await Promise.all([user.save(), reward.save()]);
    
    // Award the reward based on type
    let rewardResult = {};
    switch (reward.type) {
      case 'badge':
        if (!user.gamification.badges.includes(reward.value)) {
          user.gamification.badges.push(reward.value);
          await user.save();
        }
        rewardResult = { type: 'badge', value: reward.value };
        break;
        
      case 'points':
        user.gamification.points += parseInt(reward.value);
        await user.save();
        rewardResult = { type: 'points', value: reward.value };
        break;
        
      case 'title':
        if (!user.gamification.titles.includes(reward.value)) {
          user.gamification.titles.push(reward.value);
          await user.save();
        }
        rewardResult = { type: 'title', value: reward.value };
        break;
        
      case 'discount':
      case 'item':
      case 'experience':
      default:
        rewardResult = { type: reward.type, value: reward.value };
        break;
    }
    
    // Create notification
    await Notification.createNotification({
      recipient: currentUserId,
      type: 'reward_redeemed',
      title: '🎁 Reward Redeemed!',
      message: `You've successfully redeemed: ${reward.title}`,
      priority: 'medium',
      metadata: {
        rewardId: reward._id,
        rewardTitle: reward.title,
        pointsCost: reward.pointsCost,
        rewardType: reward.type,
        rewardValue: reward.value
      }
    });
    
    // Real-time notification
    if (req.io) {
      req.io.to(`user-${currentUserId}`).emit('notification', {
        type: 'reward_redeemed',
        title: 'Reward Redeemed!',
        message: `You've redeemed: ${reward.title}`,
        reward: rewardResult
      });
    }
    
    res.json({
      success: true,
      message: 'Reward redeemed successfully!',
      data: {
        reward: {
          _id: reward._id,
          title: reward.title,
          type: reward.type,
          value: reward.value
        },
        pointsSpent: reward.pointsCost,
        remainingPoints: user.gamification.points,
        rewardResult
      }
    });
    
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ success: false, message: 'Failed to redeem reward' });
  }
});

// GET /rewards/my-rewards - Get user's redeemed rewards
router.get('/my-rewards', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.session.userId;
    const skip = (page - 1) * limit;
    
    const user = await User.findById(currentUserId)
      .populate({
        path: 'gamification.redeemedRewards.reward',
        select: 'title description category type image value pointsCost'
      })
      .select('gamification.redeemedRewards');
    
    const redeemedRewards = user.gamification.redeemedRewards
      .sort((a, b) => b.redeemedAt - a.redeemedAt)
      .slice(skip, skip + parseInt(limit))
      .map(r => ({
        _id: r._id,
        reward: r.reward,
        redeemedAt: r.redeemedAt,
        pointsCost: r.pointsCost
      }));
    
    const totalSpentPoints = user.gamification.redeemedRewards
      .reduce((sum, r) => sum + r.pointsCost, 0);
    
    res.json({
      success: true,
      data: {
        redeemedRewards,
        totalRedeemed: user.gamification.redeemedRewards.length,
        totalSpentPoints,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: skip + parseInt(limit) < user.gamification.redeemedRewards.length
        }
      }
    });
    
  } catch (error) {
    console.error('Get my rewards error:', error);
    res.status(500).json({ success: false, message: 'Failed to get redeemed rewards' });
  }
});

// GET /rewards/featured - Get featured/trending rewards
router.get('/featured', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const currentUser = await User.findById(currentUserId);
    
    // Get trending rewards (most redeemed in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const trendingRewards = await Reward.find({
      isActive: true,
      lastRedeemedAt: { $gte: sevenDaysAgo }
    })
    .sort({ redemptionCount: -1 })
    .limit(5);
    
    // Get new rewards (created in last 14 days)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const newRewards = await Reward.find({
      isActive: true,
      createdAt: { $gte: fourteenDaysAgo }
    })
    .sort({ createdAt: -1 })
    .limit(5);
    
    // Get affordable rewards for user
    const affordableRewards = await Reward.find({
      isActive: true,
      pointsCost: { $lte: currentUser.gamification.points }
    })
    .sort({ pointsCost: 1 })
    .limit(5);
    
    // Format rewards with eligibility
    const formatRewards = async (rewards) => {
      return Promise.all(rewards.map(async (reward) => {
        const isEligible = await reward.checkEligibility(currentUserId);
        const hasRedeemed = currentUser.gamification.redeemedRewards.some(r => 
          r.reward.toString() === reward._id.toString()
        );
        
        return {
          _id: reward._id,
          title: reward.title,
          description: reward.description,
          category: reward.category,
          type: reward.type,
          pointsCost: reward.pointsCost,
          image: reward.image,
          isEligible,
          hasRedeemed,
          canAfford: currentUser.gamification.points >= reward.pointsCost,
          redemptionCount: reward.redemptionCount
        };
      }));
    };
    
    const [trending, newest, affordable] = await Promise.all([
      formatRewards(trendingRewards),
      formatRewards(newRewards),
      formatRewards(affordableRewards)
    ]);
    
    res.json({
      success: true,
      data: {
        trending,
        newest,
        affordable,
        userPoints: currentUser.gamification.points
      }
    });
    
  } catch (error) {
    console.error('Get featured rewards error:', error);
    res.status(500).json({ success: false, message: 'Failed to get featured rewards' });
  }
});

// GET /rewards/stats - Get reward statistics for user
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    
    const user = await User.findById(currentUserId)
      .populate('gamification.redeemedRewards.reward', 'category pointsCost');
    
    const totalRewards = await Reward.countDocuments({ isActive: true });
    const redeemedCount = user.gamification.redeemedRewards.length;
    const totalSpentPoints = user.gamification.redeemedRewards
      .reduce((sum, r) => sum + r.pointsCost, 0);
    
    // Group by category
    const categoryStats = user.gamification.redeemedRewards.reduce((acc, r) => {
      const category = r.reward.category;
      if (!acc[category]) {
        acc[category] = { count: 0, pointsSpent: 0 };
      }
      acc[category].count += 1;
      acc[category].pointsSpent += r.pointsCost;
      return acc;
    }, {});
    
    // Recent redemptions (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRedemptions = user.gamification.redeemedRewards
      .filter(r => r.redeemedAt >= thirtyDaysAgo).length;
    
    res.json({
      success: true,
      data: {
        overview: {
          totalAvailableRewards: totalRewards,
          redeemedCount,
          redemptionRate: totalRewards > 0 ? Math.round((redeemedCount / totalRewards) * 100) : 0,
          totalSpentPoints,
          currentPoints: user.gamification.points,
          recentRedemptions
        },
        categoryBreakdown: Object.entries(categoryStats).map(([category, stats]) => ({
          category,
          count: stats.count,
          pointsSpent: stats.pointsSpent
        })),
        badges: user.gamification.badges,
        titles: user.gamification.titles || []
      }
    });
    
  } catch (error) {
    console.error('Get reward stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get reward statistics' });
  }
});

// POST /rewards/wishlist - Add reward to wishlist
router.post('/wishlist', requireAuth, async (req, res) => {
  try {
    const { rewardId } = req.body;
    const currentUserId = req.session.userId;
    
    if (!rewardId) {
      return res.status(400).json({ success: false, message: 'Reward ID is required' });
    }
    
    const [reward, user] = await Promise.all([
      Reward.findById(rewardId),
      User.findById(currentUserId)
    ]);
    
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }
    
    // Initialize wishlist if it doesn't exist
    if (!user.gamification.wishlist) {
      user.gamification.wishlist = [];
    }
    
    // Check if already in wishlist
    const alreadyInWishlist = user.gamification.wishlist.some(w => 
      w.reward.toString() === rewardId
    );
    
    if (alreadyInWishlist) {
      return res.status(400).json({ success: false, message: 'Reward already in wishlist' });
    }
    
    user.gamification.wishlist.push({
      reward: rewardId,
      addedAt: new Date()
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Reward added to wishlist'
    });
    
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to add reward to wishlist' });
  }
});

// DELETE /rewards/wishlist/:rewardId - Remove reward from wishlist
router.delete('/wishlist/:rewardId', requireAuth, async (req, res) => {
  try {
    const { rewardId } = req.params;
    const currentUserId = req.session.userId;
    
    const user = await User.findById(currentUserId);
    
    if (!user.gamification.wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist is empty' });
    }
    
    user.gamification.wishlist = user.gamification.wishlist.filter(w => 
      w.reward.toString() !== rewardId
    );
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Reward removed from wishlist'
    });
    
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove reward from wishlist' });
  }
});

// GET /rewards/wishlist - Get user's wishlist
router.get('/wishlist', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    
    const user = await User.findById(currentUserId)
      .populate({
        path: 'gamification.wishlist.reward',
        select: 'title description category type pointsCost image isActive'
      });
    
    const wishlist = (user.gamification.wishlist || [])
      .filter(w => w.reward && w.reward.isActive) // Filter out inactive rewards
      .map(w => ({
        _id: w._id,
        reward: w.reward,
        addedAt: w.addedAt,
        canAfford: user.gamification.points >= w.reward.pointsCost
      }))
      .sort((a, b) => b.addedAt - a.addedAt);
    
    res.json({
      success: true,
      data: {
        wishlist,
        userPoints: user.gamification.points
      }
    });
    
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to get wishlist' });
  }
});

module.exports = router;

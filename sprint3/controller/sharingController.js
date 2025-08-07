const express = require('express');
const User = require('../model/User');
const Action = require('../model/Action');
const Goal = require('../model/Goal');
const Challenge = require('../model/Challenge');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
};

// GET /sharing/achievement/:achievementId - Generate shareable achievement link
router.get('/achievement/:achievementId', requireAuth, async (req, res) => {
  try {
    const { achievementId } = req.params;
    const currentUserId = req.session.userId;
    
    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user has this achievement
    const hasAchievement = user.achievements.includes(achievementId);
    if (!hasAchievement) {
      return res.status(403).json({ success: false, message: 'Achievement not found for user' });
    }

    const shareableData = {
      id: `achievement_${achievementId}_${currentUserId}`,
      type: 'achievement',
      title: `🏆 ${user.username} unlocked an achievement!`,
      description: `Check out ${user.username}'s latest sustainable living achievement: ${achievementId}`,
      imageUrl: `${req.protocol}://${req.get('host')}/api/sharing/achievement-image/${achievementId}/${currentUserId}`,
      shareUrl: `${req.protocol}://${req.get('host')}/share/achievement/${achievementId}/${currentUserId}`,
      socialMedia: {
        twitter: {
          text: `🌱 Just unlocked "${achievementId}" on Sustainable Habit Tracker! Join me in making a difference for our planet! #SustainableLiving #EcoFriendly`,
          url: `${req.protocol}://${req.get('host')}/share/achievement/${achievementId}/${currentUserId}`,
          hashtags: ['SustainableLiving', 'EcoFriendly', 'Achievement']
        },
        facebook: {
          quote: `🌱 Just unlocked "${achievementId}" on Sustainable Habit Tracker! Every small action counts towards a greener future!`,
          url: `${req.protocol}://${req.get('host')}/share/achievement/${achievementId}/${currentUserId}`
        },
        linkedin: {
          title: `Sustainable Living Achievement Unlocked!`,
          summary: `I just achieved "${achievementId}" on my sustainability journey. Small steps lead to big changes!`,
          url: `${req.protocol}://${req.get('host')}/share/achievement/${achievementId}/${currentUserId}`
        }
      }
    };

    res.json({
      success: true,
      data: shareableData
    });

  } catch (error) {
    console.error('Generate achievement share error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate shareable achievement' });
  }
});

// GET /sharing/progress-report/:period - Generate shareable progress report
router.get('/progress-report/:period', requireAuth, async (req, res) => {
  try {
    const { period } = req.params; // 'weekly', 'monthly', 'yearly'
    const currentUserId = req.session.userId;
    const { format = 'json' } = req.query; // 'json' or 'pdf'
    
    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'weekly':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'yearly':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid period' });
    }

    // Get user's actions for the period
    const actions = await Action.find({
      userId: currentUserId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 });

    // Get completed goals for the period
    const goals = await Goal.find({
      userId: currentUserId,
      status: 'completed',
      updatedAt: { $gte: startDate, $lte: endDate }
    });

    // Calculate statistics
    const stats = {
      totalActions: actions.length,
      co2Saved: actions.reduce((sum, action) => sum + (action.co2Saved || 0), 0),
      waterSaved: actions.reduce((sum, action) => sum + (action.waterSaved || 0), 0),
      energySaved: actions.reduce((sum, action) => sum + (action.energySaved || 0), 0),
      goalsCompleted: goals.length,
      topCategories: getTopCategories(actions),
      consecutiveDays: calculateConsecutiveDays(actions)
    };

    const reportData = {
      user: {
        username: user.username,
        level: user.level || 1,
        totalExperience: user.experience || 0
      },
      period: {
        type: period,
        startDate,
        endDate,
        daysCount: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      },
      stats,
      actions: actions.slice(0, 10), // Top 10 recent actions
      goals: goals.slice(0, 5), // Top 5 completed goals
      shareUrl: `${req.protocol}://${req.get('host')}/share/report/${period}/${currentUserId}`,
      socialMedia: {
        twitter: {
          text: `🌱 My ${period} sustainability report: ${stats.totalActions} actions, ${stats.co2Saved.toFixed(1)}kg CO2 saved! Join me on Sustainable Habit Tracker! #SustainableLiving`,
          url: `${req.protocol}://${req.get('host')}/share/report/${period}/${currentUserId}`
        },
        facebook: {
          quote: `🌍 ${period.charAt(0).toUpperCase() + period.slice(1)} sustainability update: ${stats.totalActions} eco-friendly actions completed! Every action counts towards a greener future!`,
          url: `${req.protocol}://${req.get('host')}/share/report/${period}/${currentUserId}`
        }
      }
    };

    if (format === 'pdf') {
      // Generate PDF report
      const pdfBuffer = await generatePDFReport(reportData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${user.username}_${period}_report.pdf"`);
      res.send(pdfBuffer);
    } else {
      res.json({
        success: true,
        data: reportData
      });
    }

  } catch (error) {
    console.error('Generate progress report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate progress report' });
  }
});

// GET /sharing/challenge-invite/:challengeId - Generate shareable challenge invitation
router.get('/challenge-invite/:challengeId', requireAuth, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const currentUserId = req.session.userId;
    
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    const user = await User.findById(currentUserId);
    
    const shareableData = {
      id: `challenge_invite_${challengeId}_${currentUserId}`,
      type: 'challenge_invite',
      title: `🌱 Join ${user.username}'s sustainability challenge!`,
      description: `${challenge.title} - ${challenge.description}`,
      challenge: {
        id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        duration: challenge.duration,
        difficulty: challenge.difficulty,
        participants: challenge.participants?.length || 0
      },
      shareUrl: `${req.protocol}://${req.get('host')}/challenges/${challengeId}?invite=${currentUserId}`,
      socialMedia: {
        twitter: {
          text: `🌱 Join me in the "${challenge.title}" sustainability challenge! Let's make a positive impact together! #SustainableChallenge #EcoFriendly`,
          url: `${req.protocol}://${req.get('host')}/challenges/${challengeId}?invite=${currentUserId}`,
          hashtags: ['SustainableChallenge', 'EcoFriendly', 'JoinMe']
        },
        facebook: {
          quote: `🌍 I'm participating in "${challenge.title}" - a sustainability challenge! Want to join me in making a difference?`,
          url: `${req.protocol}://${req.get('host')}/challenges/${challengeId}?invite=${currentUserId}`
        }
      }
    };

    res.json({
      success: true,
      data: shareableData
    });

  } catch (error) {
    console.error('Generate challenge invite error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate challenge invitation' });
  }
});

// POST /sharing/custom-share - Create custom shareable content
router.post('/custom-share', requireAuth, async (req, res) => {
  try {
    const { type, title, description, data, privacy = 'public' } = req.body;
    const currentUserId = req.session.userId;
    
    if (!type || !title) {
      return res.status(400).json({ success: false, message: 'Type and title are required' });
    }

    const user = await User.findById(currentUserId);
    const shareId = `custom_${type}_${currentUserId}_${Date.now()}`;
    
    const shareableData = {
      id: shareId,
      type: 'custom',
      subType: type,
      title,
      description: description || '',
      creator: {
        id: currentUserId,
        username: user.username,
        level: user.level || 1
      },
      data: data || {},
      privacy,
      shareUrl: `${req.protocol}://${req.get('host')}/share/custom/${shareId}`,
      createdAt: new Date(),
      socialMedia: {
        twitter: {
          text: `🌱 ${title} - Check out my sustainability journey! #SustainableLiving`,
          url: `${req.protocol}://${req.get('host')}/share/custom/${shareId}`
        },
        facebook: {
          quote: `🌍 ${title} - ${description}`,
          url: `${req.protocol}://${req.get('host')}/share/custom/${shareId}`
        }
      }
    };

    // Store in database (you might want to create a Share model for this)
    // For now, we'll return the shareable data directly
    
    res.json({
      success: true,
      message: 'Custom shareable content created',
      data: shareableData
    });

  } catch (error) {
    console.error('Create custom share error:', error);
    res.status(500).json({ success: false, message: 'Failed to create custom shareable content' });
  }
});

// Helper functions
function getTopCategories(actions) {
  const categories = {};
  actions.forEach(action => {
    const category = action.category || 'Other';
    categories[category] = (categories[category] || 0) + 1;
  });
  
  return Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));
}

function calculateConsecutiveDays(actions) {
  if (actions.length === 0) return 0;
  
  const dates = [...new Set(actions.map(action => 
    new Date(action.createdAt).toDateString()
  ))].sort();
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currentDate = new Date(dates[i]);
    const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
    
    if (dayDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return maxStreak;
}

async function generatePDFReport(reportData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Header
      doc.fontSize(20).text('Sustainability Progress Report', 50, 50);
      doc.fontSize(14).text(`${reportData.user.username} - ${reportData.period.type.charAt(0).toUpperCase() + reportData.period.type.slice(1)} Report`, 50, 80);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 100);
      
      // Stats
      doc.fontSize(16).text('Key Statistics', 50, 140);
      doc.fontSize(12)
        .text(`Total Actions: ${reportData.stats.totalActions}`, 70, 170)
        .text(`CO2 Saved: ${reportData.stats.co2Saved.toFixed(2)} kg`, 70, 190)
        .text(`Water Saved: ${reportData.stats.waterSaved.toFixed(2)} L`, 70, 210)
        .text(`Goals Completed: ${reportData.stats.goalsCompleted}`, 70, 230)
        .text(`Consecutive Days: ${reportData.stats.consecutiveDays}`, 70, 250);
      
      // Recent Actions
      if (reportData.actions.length > 0) {
        doc.fontSize(16).text('Recent Actions', 50, 290);
        let yPos = 320;
        reportData.actions.slice(0, 5).forEach((action, index) => {
          doc.fontSize(10).text(`${index + 1}. ${action.type || 'Action'} - ${new Date(action.createdAt).toLocaleDateString()}`, 70, yPos);
          yPos += 15;
        });
      }
      
      // Footer
      doc.fontSize(10).text('Generated by Sustainable Habit Tracker', 50, 700);
      
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = router;

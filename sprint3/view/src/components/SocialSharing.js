import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Share2, 
  Download, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Copy, 
  Trophy,
  FileText,
  Users,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const SocialSharing = ({ user }) => {
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('achievements');
  const [userAchievements, setUserAchievements] = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Use mock data for demo purposes
      const mockAchievements = [
        'Green Transportation Champion',
        'Waste Reduction Hero',
        'Energy Conservation Expert',
        'Sustainable Shopping Master',
        'Water Conservation Warrior'
      ];
      
      const mockChallenges = [
        {
          _id: '1',
          title: 'Plastic-Free Week',
          description: 'Avoid using single-use plastics for an entire week',
          participants: [{ _id: 'user1' }, { _id: 'user2' }]
        },
        {
          _id: '2', 
          title: 'Daily Bike Commute',
          description: 'Bike to work or school every day this week',
          participants: [{ _id: 'user3' }, { _id: 'user4' }, { _id: 'user5' }]
        }
      ];
      
      setUserAchievements(mockAchievements);
      setUserChallenges(mockChallenges);
      
      // Also try to fetch from API if available
      try {
        const [achievementsRes, challengesRes] = await Promise.all([
          axios.get('/api/user/achievements'),
          axios.get('/api/challenges/my-challenges')
        ]);
        
        if (achievementsRes.data.achievements) {
          setUserAchievements(achievementsRes.data.achievements);
        }
        if (challengesRes.data.challenges) {
          setUserChallenges(challengesRes.data.challenges);
        }
      } catch (apiError) {
        console.log('API not available, using mock data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const generateShareLink = async (type, id = null, period = null) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generate mock share data for demo purposes
      let mockShareData;
      const baseUrl = window.location.origin;
      
      switch (type) {
        case 'achievement':
          mockShareData = {
            title: `Check out my achievement: ${id}!`,
            description: `I just unlocked the "${id}" achievement on EcoTracker! 🏆`,
            shareUrl: `${baseUrl}/shared/achievement/${btoa(id)}`,
            socialMedia: {
              twitter: {
                text: `🎉 Just unlocked "${id}" on @EcoTracker! Making a difference one action at a time. #Sustainability #EcoFriendly`,
                url: `${baseUrl}/shared/achievement/${btoa(id)}`
              },
              facebook: {
                url: `${baseUrl}/shared/achievement/${btoa(id)}`,
                quote: `🌱 I just achieved "${id}" on EcoTracker! Join me in making our planet more sustainable!`
              },
              linkedin: {
                url: `${baseUrl}/shared/achievement/${btoa(id)}`
              }
            }
          };
          break;
        case 'progress':
          mockShareData = {
            title: `My ${period} sustainability report`,
            description: `Check out my ${period} progress on my sustainability journey!`,
            shareUrl: `${baseUrl}/shared/progress/${period}/${user?.username || 'user'}`,
            socialMedia: {
              twitter: {
                text: `📊 Check out my ${period} sustainability progress! Every small action counts. #EcoTracker #SustainabilityJourney`,
                url: `${baseUrl}/shared/progress/${period}/${user?.username || 'user'}`
              },
              facebook: {
                url: `${baseUrl}/shared/progress/${period}/${user?.username || 'user'}`,
                quote: `🌍 Sharing my ${period} sustainability report. Together we can make a difference!`
              },
              linkedin: {
                url: `${baseUrl}/shared/progress/${period}/${user?.username || 'user'}`
              }
            }
          };
          break;
        case 'challenge':
          const challenge = userChallenges.find(c => c._id === id);
          mockShareData = {
            title: `Join me in the "${challenge?.title}" challenge!`,
            description: challenge?.description || 'Join this sustainability challenge and make a difference!',
            shareUrl: `${baseUrl}/challenges/join/${id}`,
            socialMedia: {
              twitter: {
                text: `🌱 Join me in the "${challenge?.title}" challenge on @EcoTracker! Let's make sustainability fun! #SustainabilityChallenge`,
                url: `${baseUrl}/challenges/join/${id}`
              },
              facebook: {
                url: `${baseUrl}/challenges/join/${id}`,
                quote: `🏆 I'm participating in "${challenge?.title}" - want to join me in making our planet greener?`
              },
              linkedin: {
                url: `${baseUrl}/challenges/join/${id}`
              }
            }
          };
          break;
        default:
          throw new Error('Invalid share type');
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShareData(mockShareData);
      setSuccess('Share link generated successfully!');
      
      // Also try to fetch from real API if available
      try {
        let endpoint = '';
        switch (type) {
          case 'achievement':
            endpoint = `/api/sharing/achievement/${id}`;
            break;
          case 'progress':
            endpoint = `/api/sharing/progress-report/${period}`;
            break;
          case 'challenge':
            endpoint = `/api/sharing/challenge-invite/${id}`;
            break;
        }
        
        const response = await axios.get(endpoint);
        if (response.data.data) {
          setShareData(response.data.data);
        }
      } catch (apiError) {
        console.log('API not available, using mock data');
      }
    } catch (error) {
      setError(error.message || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (period) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`/sharing/progress-report/${period}?format=pdf`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${user.username}_${period}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Report downloaded successfully!');
    } catch (error) {
      setError('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Link copied to clipboard!');
    } catch (error) {
      setError('Failed to copy link');
    }
  };

  const shareToSocialMedia = (platform, shareData) => {
    const socialUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.socialMedia.twitter.text)}&url=${encodeURIComponent(shareData.socialMedia.twitter.url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.socialMedia.facebook.url)}&quote=${encodeURIComponent(shareData.socialMedia.facebook.quote)}`,
      linkedin: shareData.socialMedia.linkedin ? 
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.socialMedia.linkedin.url)}` : 
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.shareUrl)}`
    };

    window.open(socialUrls[platform], '_blank', 'width=600,height=400');
  };

  const ShareModal = ({ shareData, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Share Your Achievement</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">{shareData.title}</h4>
          <p className="text-gray-600 text-sm mb-4">{shareData.description}</p>
          
          <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg mb-4">
            <span className="text-sm text-gray-600 truncate flex-1 mr-2">{shareData.shareUrl}</span>
            <button
              onClick={() => copyToClipboard(shareData.shareUrl)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => shareToSocialMedia('twitter', shareData)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex-1"
            >
              <Twitter className="h-4 w-4" />
              <span>Twitter</span>
            </button>
            <button
              onClick={() => shareToSocialMedia('facebook', shareData)}
              className="flex items-center space-x-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 flex-1"
            >
              <Facebook className="h-4 w-4" />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => shareToSocialMedia('linkedin', shareData)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex-1"
            >
              <Linkedin className="h-4 w-4" />
              <span>LinkedIn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Share2 className="h-6 w-6 mr-2 text-green-600" />
            Social Sharing
          </h2>
          <p className="text-gray-600 mt-2">Share your sustainability achievements and progress with the world!</p>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-4">
          <div className="flex space-x-4 border-b">
            {[
              { id: 'achievements', label: 'Achievements', icon: Trophy },
              { id: 'progress', label: 'Progress Reports', icon: FileText },
              { id: 'challenges', label: 'Challenges', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Share Your Achievements</h3>
              {userAchievements.length > 0 ? (
                <div className="grid gap-4">
                  {userAchievements.map((achievement, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        <div>
                          <h4 className="font-medium">{achievement}</h4>
                          <p className="text-sm text-gray-600">Achievement unlocked!</p>
                        </div>
                      </div>
                      <button
                        onClick={() => generateShareLink('achievement', achievement)}
                        disabled={loading}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No achievements to share yet. Complete some goals to earn achievements!</p>
                </div>
              )}
            </div>
          )}

          {/* Progress Reports Tab */}
          {activeTab === 'progress' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Share Your Progress</h3>
              <div className="grid gap-4">
                {['weekly', 'monthly', 'yearly'].map(period => (
                  <div key={period} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium capitalize">{period} Report</h4>
                        <p className="text-sm text-gray-600">
                          Share your {period} sustainability progress
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => generateShareLink('progress', null, period)}
                          disabled={loading}
                          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </button>
                        <button
                          onClick={() => downloadReport(period)}
                          disabled={loading}
                          className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Invite Friends to Challenges</h3>
              {userChallenges.length > 0 ? (
                <div className="grid gap-4">
                  {userChallenges.map((challenge, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users className="h-8 w-8 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{challenge.title}</h4>
                          <p className="text-sm text-gray-600">{challenge.description}</p>
                          <p className="text-xs text-gray-500">
                            {challenge.participants?.length || 0} participants
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => generateShareLink('challenge', challenge._id)}
                        disabled={loading}
                        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                      >
                        <Users className="h-4 w-4" />
                        <span>Invite</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No challenges to share yet. Join or create some challenges!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {shareData && (
        <ShareModal 
          shareData={shareData} 
          onClose={() => {
            setShareData(null);
            setSuccess('');
            setError('');
          }} 
        />
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span>Generating share link...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialSharing;

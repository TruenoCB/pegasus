import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Settings, Shield, Award, Globe, Mail, Link as LinkIcon, Edit3, Zap, LogOut, X, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, token, logout, login } = useAuthStore();
  const navigate = useNavigate();
  const isMe = !id || id === currentUser?.id;
  const targetUserId = isMe ? currentUser?.id : id;

  const [user, setUser] = useState<any>(isMe ? currentUser : null);
  const [stats, setStats] = useState({ posts: 0, following: 0, followers: 0 });
  const [assetCount, setAssetCount] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [popularAssets, setPopularAssets] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !targetUserId) return;
      try {
        // Fetch user info if not me
        if (!isMe) {
          const userRes = await fetch(`/api/social/users/${targetUserId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (userRes.ok) {
            setUser(await userRes.json());
          }
        }

        const statsRes = await fetch(`/api/social/users/${targetUserId}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats({
            posts: data.posts,
            following: data.following,
            followers: data.followers
          });
          setAssetCount(data.assets || 0);
        }

        const postsRes = await fetch('/api/social/posts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (postsRes.ok) {
          const allPosts = await postsRes.json();
          setPosts(allPosts.filter((p: any) => p.user_id === targetUserId));
        }

        const assetsRes = await fetch(`/api/social/users/${isMe ? 'me' : targetUserId}/assets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (assetsRes.ok) {
          const allAssets = await assetsRes.json();
          setAssets(allAssets);
          // For badges, we'll just mock popular assets from their actual assets for now
          // In a real app, you'd sort by a real 'subscribers' or 'views' count on the asset
          setPopularAssets(allAssets.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to fetch profile data", error);
      }
    };
    fetchData();
  }, [token, targetUserId, isMe]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditProfile = () => {
    setEditName(user?.name || '');
    setEditBio(user?.bio || 'Digital pioneer exploring the boundaries of PEGASUS. Everything is an asset. AI is my second brain.');
    setIsEditing(true);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName, bio: editBio })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        login(token!, updatedUser);
        setUser(updatedUser);
        setIsEditing(false);
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Profile Header */}
      <div className="mb-12">
        <div className="h-48 w-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl border border-white/10 relative">
          {/* Cover image area */}
        </div>
        <div className="px-4 sm:px-8 -mt-16 sm:-mt-20 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div className="w-32 h-32 bg-gray-900 border-4 border-black rounded-3xl flex items-center justify-center text-4xl font-bold shadow-2xl overflow-hidden shrink-0">
              {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : (user?.name?.[0]?.toUpperCase() || 'U')}
            </div>
            <div className="mb-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{user?.name || 'Anonymous User'}</h1>
              <p className="text-gray-500 font-medium">@{user?.email?.split('@')[0] || 'username'}</p>
            </div>
          </div>
          {isMe && (
            <div className="flex gap-3 pb-2">
              <button 
                onClick={handleLogout}
                className="flex-1 sm:flex-none px-6 py-2 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
              <button 
                onClick={handleEditProfile}
                className="flex-1 sm:flex-none px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Sidebar */}
        <aside className="space-y-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-500">About</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {user?.bio || 'Digital pioneer exploring the boundaries of PEGASUS. Everything is an asset. AI is my second brain.'}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Globe className="w-4 h-4" /> <span>Earth</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Mail className="w-4 h-4" /> <span>{user?.email || 'not_set'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <LinkIcon className="w-4 h-4" /> <span className="text-blue-400 hover:underline cursor-pointer">pegasus.io/u/{user?.name?.toLowerCase().replace(/\s+/g, '')}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-500">Badges</h3>
            <div className="flex flex-wrap gap-2">
              {popularAssets.length > 0 ? (
                popularAssets.map((asset, idx) => (
                  <div key={asset.id} className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20 relative group cursor-pointer" title={asset.title}>
                    <div className="w-8 h-8 flex items-center justify-center font-black uppercase">
                      {asset.title?.[0] || 'A'}
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-500">No popular assets yet</span>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Assets', value: assetCount.toString(), color: 'text-yellow-400' },
              { label: 'Posts', value: stats.posts.toString(), color: 'text-blue-400' },
              { label: 'Following', value: stats.following.toString(), color: 'text-purple-400' },
              { label: 'Followers', value: stats.followers.toString(), color: 'text-green-400' }
            ].map((stat) => (
              <div key={stat.label} className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center">
                <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              Recent Assets
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {assets.length === 0 ? (
                <div className="text-center py-6 text-gray-500 border border-dashed border-white/10 rounded-3xl text-sm">
                  You haven't created any assets yet. Head to AURORA to create an RSS Group.
                </div>
              ) : (
                assets.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer">
                    <div>
                      <h4 className="font-bold group-hover:text-yellow-400 transition-colors">{item.title}</h4>
                      <p className="text-xs text-gray-500">{item.type.replace('_', ' ')} • {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <Settings className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              Recent Posts
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {posts.length === 0 ? (
                <div className="text-center py-10 text-gray-500 border border-dashed border-white/10 rounded-3xl">
                  You haven't posted anything yet.
                </div>
              ) : (
                posts.map((item) => (
                  <div key={item.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col group hover:bg-white/10 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                      <Settings className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-gray-300 whitespace-pre-wrap">{item.content}</div>
                    <div className="flex gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-gray-500">
                      <span>{item.likes?.length || 0} Likes</span>
                      <span>{item.comments?.length || 0} Comments</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 w-full max-w-md relative">
            <button 
              onClick={() => setIsEditing(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Bio</label>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <button 
                onClick={saveProfile}
                disabled={isSaving}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

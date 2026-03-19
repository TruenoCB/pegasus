import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Settings, Shield, Award, Globe, Mail, Link as LinkIcon, Edit3, Zap, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ posts: 0, following: 0, followers: 0 });
  const [assetCount, setAssetCount] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const statsRes = await fetch('/api/social/users/me/stats', {
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

        // Fetch user's posts (we can reuse the main posts endpoint but filter locally for now, 
        // ideally backend should have a /users/me/posts endpoint)
        const postsRes = await fetch('/api/social/posts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (postsRes.ok) {
          const allPosts = await postsRes.json();
          setPosts(allPosts.filter((p: any) => p.user_id === user?.id));
        }

        // Fetch user's assets
        const assetsRes = await fetch('/api/social/users/me/assets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (assetsRes.ok) {
          const myAssets = await assetsRes.json();
          setAssets(myAssets);
        }
      } catch (error) {
        console.error("Failed to fetch profile data", error);
      }
    };
    fetchData();
  }, [token, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Profile Header */}
      <div className="relative mb-12">
        <div className="h-48 w-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl border border-white/10" />
        <div className="absolute -bottom-8 left-8 flex items-end gap-6">
          <div className="w-32 h-32 bg-gray-900 border-4 border-black rounded-3xl flex items-center justify-center text-4xl font-bold shadow-2xl">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="mb-2">
            <h1 className="text-4xl font-black tracking-tight">{user?.name || 'Anonymous User'}</h1>
            <p className="text-gray-500 font-medium">@{user?.email?.split('@')[0] || 'username'}</p>
          </div>
        </div>
        <div className="absolute bottom-4 right-8 flex gap-3">
          <button 
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <button className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Sidebar */}
        <aside className="space-y-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-500">About</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Digital pioneer exploring the boundaries of PEGASUS. Everything is an asset. AI is my second brain.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Globe className="w-4 h-4" /> <span>Earth</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Mail className="w-4 h-4" /> <span>{user?.email || 'not_set'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <LinkIcon className="w-4 h-4" /> <span className="text-blue-400 hover:underline cursor-pointer">pegasus.io/u/me</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-500">Badges</h3>
            <div className="flex flex-wrap gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg text-green-400 border border-green-500/20">
                <Award className="w-5 h-5" />
              </div>
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
    </div>
  );
};

export default Profile;

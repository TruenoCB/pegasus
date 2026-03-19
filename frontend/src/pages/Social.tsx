import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, User, Shield, Zap, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Social: React.FC = () => {
  const { token, user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [profileStats, setProfileStats] = useState({ posts: 0, following: 0, followers: 0 });
  const [assetCount, setAssetCount] = useState(0);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/social/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/social/users/me/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileStats({
          posts: data.posts,
          following: data.following,
          followers: data.followers
        });
        setAssetCount(data.assets || 0);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/chat/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedUsers(data.filter((u: any) => u.id !== user?.id).slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPosts();
      fetchStats();
      fetchUsers();
    }
  }, [token]);

  const handlePost = async () => {
    if (!newPostContent.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newPostContent })
      });
      if (res.ok) {
        setNewPostContent('');
        fetchPosts();
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to post", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPosts(); // Refresh to get updated likes
      }
    } catch (error) {
      console.error("Failed to like post", error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/social/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        setNewComment('');
        setCommentingOn(null);
        fetchPosts();
      }
    } catch (error) {
      console.error("Failed to comment", error);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const res = await fetch(`/api/social/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStats(); // Update following count
      }
    } catch (error) {
      console.error("Failed to follow", error);
    }
  };

  const isLikedByMe = (post: any) => {
    return post.likes?.some((like: any) => like.user_id === user?.id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Left Sidebar - Profile & Trends */}
      <aside className="hidden md:block w-64 space-y-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">
              U
            </div>
            <h3 className="font-bold text-lg">Your Profile</h3>
            <p className="text-sm text-gray-500 mb-4">@{user?.name || 'user_name'}</p>
            <div className="grid grid-cols-3 w-full gap-2 border-t border-white/5 pt-4">
              <div className="text-center">
                <div className="font-bold">{profileStats.posts || 0}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{assetCount || 0}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Assets</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{profileStats.followers || 0}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Reach</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
          <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-500">Trending Assets</h4>
          <ul className="space-y-4">
            {['#AI_Ethics', '#Web3_Social', '#DataPrivacy', '#PegasusVibe'].map((tag) => (
              <li key={tag} className="flex justify-between items-center group cursor-pointer">
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{tag}</span>
                <TrendingUpIcon className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Feed */}
      <main className="flex-1 space-y-6">
        {/* Search & Post Input */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex gap-4 items-center">
          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-400" />
          </div>
          <input 
            type="text" 
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
            placeholder="Share an insight or asset..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-gray-300"
          />
          <button 
            onClick={handlePost}
            disabled={loading || !newPostContent.trim()}
            className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* Feed Posts */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-10 text-gray-500 border border-dashed border-white/10 rounded-3xl">
              No posts yet. Be the first to share!
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.07] transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center font-bold text-blue-400 border border-white/5 uppercase">
                      {post.user?.name?.substring(0, 2) || 'AN'}
                    </div>
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        {post.user?.name || 'Anonymous'}
                      </h4>
                      <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <button className="text-gray-500 hover:text-white">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4 text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </div>

                <div className="flex items-center gap-6 border-t border-white/5 pt-4">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors group/btn ${isLikedByMe(post) ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
                  >
                    <Heart className={`w-4 h-4 ${isLikedByMe(post) ? 'fill-red-400' : 'group-hover/btn:fill-red-400'}`} />
                    <span className="text-xs font-medium">{post.likes?.length || 0}</span>
                  </button>
                  <button 
                    onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                    className="flex items-center gap-2 text-gray-500 hover:text-blue-400 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">{post.comments?.length || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-green-400 transition-colors ml-auto">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Comments Section */}
                {commentingOn === post.id && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                    {post.comments?.map((comment: any) => (
                      <div key={comment.id} className="bg-black/20 p-3 rounded-xl text-sm">
                        <div className="font-bold text-gray-400 text-xs mb-1">
                          {comment.user?.name || 'Anonymous'}
                        </div>
                        <div className="text-gray-300">{comment.content}</div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                        placeholder="Write a comment..." 
                        className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none"
                      />
                      <button 
                        onClick={() => handleComment(post.id)}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-full disabled:opacity-50"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </main>

      {/* Right Sidebar - Suggestions */}
      <aside className="hidden lg:block w-64 space-y-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
          <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-500">Who to follow</h4>
          <div className="space-y-4">
            {suggestedUsers.map((person) => (
              <div key={person.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-xs font-bold uppercase">
                  {person.name?.substring(0, 2) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">{person.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{person.email}</div>
                </div>
                <button 
                  onClick={() => handleFollow(person.id)}
                  className="text-xs font-bold text-blue-400 hover:underline"
                >
                  Follow
                </button>
              </div>
            ))}
            {suggestedUsers.length === 0 && (
              <div className="text-xs text-gray-500">No suggestions right now.</div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-9 9-4-4-6 6" />
  </svg>
);

export default Social;

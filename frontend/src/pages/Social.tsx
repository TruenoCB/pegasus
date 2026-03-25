import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, User, Shield, Zap, Search, MessageSquare, Send, Flame, UserPlus, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

const Social: React.FC = () => {
  const { token, user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [profileStats, setProfileStats] = useState({ posts: 0, following: 0, followers: 0 });
  const [assetCount, setAssetCount] = useState(0);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [quotePost, setQuotePost] = useState<any | null>(null);

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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/chat/users?q=${encodeURIComponent(searchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.filter((u: any) => u.id !== user?.id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, token, user]);

  const handlePost = async () => {
    if (!newPostContent.trim()) return;
    setLoading(true);
    try {
      const body: any = { content: newPostContent };
      if (quotePost) {
        body.quote_post_id = quotePost.id;
      }
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setNewPostContent('');
        setQuotePost(null);
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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold mb-4 overflow-hidden">
              {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase() || 'U'}
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
        {/* Redesigned Post Input */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 relative">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
              {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-400" />}
            </div>
            <textarea 
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={quotePost ? "Add a comment..." : "What's happening? Share a long article or an insight..."} 
              className="flex-1 bg-transparent border-none focus:outline-none text-gray-100 resize-none min-h-[80px]"
              rows={3}
            />
          </div>

          {quotePost && (
            <div className="ml-14 mt-2 p-4 border border-white/10 rounded-2xl bg-black/20 relative">
              <button 
                onClick={() => setQuotePost(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-white"
              >
                ✕
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm">{quotePost.user?.name || 'Anonymous'}</span>
                <span className="text-xs text-gray-500">@{quotePost.user?.email?.split('@')[0]}</span>
              </div>
              <div className="text-sm text-gray-300 line-clamp-3 whitespace-pre-wrap">{quotePost.content}</div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-white/10 mt-2">
            <button 
              onClick={handlePost}
              disabled={loading || !newPostContent.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-colors disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
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
                    <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center font-bold text-blue-400 border border-white/5 uppercase overflow-hidden shrink-0">
                      {post.user?.avatar_url ? <img src={post.user.avatar_url} className="w-full h-full object-cover" /> : (post.user?.name?.substring(0, 2) || 'AN')}
                    </div>
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        {post.user?.name || 'Anonymous'}
                      </h4>
                      <p className="text-xs text-gray-500">@{post.user?.email?.split('@')[0]} • {new Date(post.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <button className="text-gray-500 hover:text-white">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4 text-gray-100 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </div>

                {/* Quoted Post Rendering */}
                {post.quoted_post && (
                  <div className="mb-4 p-4 border border-white/10 rounded-2xl bg-black/20 hover:bg-black/30 transition-colors cursor-pointer" onClick={() => setQuotePost(post.quoted_post)}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center text-[8px] font-bold uppercase overflow-hidden">
                        {post.quoted_post.user?.avatar_url ? <img src={post.quoted_post.user.avatar_url} className="w-full h-full object-cover" /> : post.quoted_post.user?.name?.substring(0, 1)}
                      </div>
                      <span className="font-bold text-sm">{post.quoted_post.user?.name || 'Anonymous'}</span>
                      <span className="text-xs text-gray-500">@{post.quoted_post.user?.email?.split('@')[0]}</span>
                    </div>
                    <div className="text-sm text-gray-300 line-clamp-4 whitespace-pre-wrap">{post.quoted_post.content}</div>
                  </div>
                )}

                {/* Shared Asset Rendering */}
                {post.asset && (
                  <div className="mb-4 p-4 border border-blue-500/20 bg-blue-500/5 rounded-2xl flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <Zap className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h5 className="font-bold text-blue-400 mb-1">{post.asset.title}</h5>
                      <p className="text-sm text-gray-400 line-clamp-2">{post.asset.description}</p>
                      <div className="mt-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold border border-white/10 inline-block px-2 py-1 rounded">
                        {post.asset.type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                )}

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
                  <button 
                    onClick={() => {
                      setQuotePost(post);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 text-gray-500 hover:text-green-400 transition-colors ml-auto"
                  >
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
          <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-500">Find Network Nodes</h4>
          <div className="relative mb-4">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..." 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <Search className="w-4 h-4 text-gray-500 absolute right-3 top-2.5" />
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {isSearching ? (
              <div className="text-center py-4">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((person) => (
                <div key={person.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
                    {person.avatar_url ? <img src={person.avatar_url} className="w-full h-full object-cover" /> : person.name?.substring(0, 2) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${person.id}`} className="text-xs font-bold truncate hover:underline block">{person.name}</Link>
                    <div className="text-[10px] text-gray-500 truncate">{person.email}</div>
                  </div>
                  <button 
                    onClick={() => handleFollow(person.id)}
                    className="text-xs font-bold text-blue-400 hover:underline"
                  >
                    Follow
                  </button>
                </div>
              ))
            ) : searchQuery ? (
              <div className="text-xs text-gray-500 text-center py-2">No nodes found.</div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-2 font-medium">Suggested for you</p>
                {suggestedUsers.map((person) => (
                  <div key={person.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
                      {person.avatar_url ? <img src={person.avatar_url} className="w-full h-full object-cover" /> : person.name?.substring(0, 2) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${person.id}`} className="text-xs font-bold truncate hover:underline block">{person.name}</Link>
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
              </>
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

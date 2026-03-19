import React from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, User, Shield, Zap, Search } from 'lucide-react';

const MOCK_POSTS = [
  {
    id: 1,
    user: { name: 'Alex Rivera', avatar: 'AR', role: 'AI Researcher' },
    content: 'Just used AURORA to summarize the latest papers on LLM quantization. The noise-to-signal ratio in research is getting crazy, but AI-powered filtering is a lifesaver. ⚡️',
    timestamp: '2h ago',
    likes: 42,
    comments: 12,
    tag: 'AURORA'
  },
  {
    id: 2,
    user: { name: 'Sarah Chen', avatar: 'SC', role: 'Digital Architect' },
    content: 'The "Everything is an Asset" philosophy in PEGASUS is revolutionary. I just tokenized my latest open-source contribution as a personal asset. The future of digital ownership is here. 🌐',
    timestamp: '5h ago',
    likes: 128,
    comments: 24,
    tag: 'Assets'
  },
  {
    id: 3,
    user: { name: 'Marc Thorne', avatar: 'MT', role: 'Privacy Advocate' },
    content: 'Decentralized social graphs are no longer a dream. PEGASUS is actually making it usable for the average person. No more echo chambers, no more data silos. 🛡️',
    timestamp: '1d ago',
    likes: 89,
    comments: 8,
    tag: 'Social'
  }
];

const Social: React.FC = () => {
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
            <p className="text-sm text-gray-500 mb-4">@user_name</p>
            <div className="grid grid-cols-2 w-full gap-2 border-t border-white/5 pt-4">
              <div className="text-center">
                <div className="font-bold">128</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Assets</div>
              </div>
              <div className="text-center">
                <div className="font-bold">1.2k</div>
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
            placeholder="Share an insight or asset..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-gray-300"
          />
          <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-colors">
            Post
          </button>
        </div>

        {/* Feed Posts */}
        <div className="space-y-6">
          {MOCK_POSTS.map((post) => (
            <article key={post.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.07] transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center font-bold text-blue-400 border border-white/5">
                    {post.user.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold flex items-center gap-2">
                      {post.user.name}
                      {post.id === 1 && <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                    </h4>
                    <p className="text-xs text-gray-500">{post.user.role} • {post.timestamp}</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-white">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 text-gray-300 leading-relaxed">
                {post.content}
              </div>

              {post.tag && (
                <div className="mb-6">
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-500/20">
                    {post.tag}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-6 border-t border-white/5 pt-4">
                <button className="flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors group/btn">
                  <Heart className="w-4 h-4 group-hover/btn:fill-red-400" />
                  <span className="text-xs font-medium">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-500 hover:text-blue-400 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">{post.comments}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-500 hover:text-green-400 transition-colors ml-auto">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Right Sidebar - Suggestions */}
      <aside className="hidden lg:block w-64 space-y-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
          <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-500">Who to follow</h4>
          <div className="space-y-4">
            {[
              { name: 'Dr. Orion', role: 'AI Strategist' },
              { name: 'Luna Stark', role: 'NFT Artist' }
            ].map((person) => (
              <div key={person.name} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg" />
                <div className="flex-1">
                  <div className="text-xs font-bold">{person.name}</div>
                  <div className="text-[10px] text-gray-500">{person.role}</div>
                </div>
                <button className="text-xs font-bold text-blue-400 hover:underline">Follow</button>
              </div>
            ))}
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

import React from 'react';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Shield, Zap, Globe, Coins, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Home specific effects (optional, can be removed if global bg is enough, but keeping subtle overlay is nice) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] opacity-30 mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] opacity-30 mix-blend-screen animate-pulse" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-20 md:mt-0">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-bold tracking-widest text-gray-300 uppercase">System Online</span>
        </div>

        {/* Brand Logo Integration */}
        <div className="flex justify-center mb-8">
            <div className="relative flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl transform hover:scale-105 transition-transform shadow-[0_0_40px_rgba(59,130,246,0.5)]">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="2.5" fill="currentColor" className="animate-pulse" />
                </svg>
            </div>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
          EVERYTHING <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 animate-gradient">
            IS AN ASSET
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Welcome to <span className="text-white font-bold">PEGASUS</span>. The next-generation social network where your posts, RSS feeds, AI summaries, and social connections are permanently stored as verifiable digital assets.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-20">
          {user ? (
            <Link to="/aurora" className="group relative px-8 py-4 bg-white text-black rounded-2xl font-black text-lg tracking-widest uppercase overflow-hidden transition-all hover:scale-105 block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity" />
              <span className="relative flex items-center gap-2">
                Enter <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ) : (
            <>
              <Link to="/register" className="group relative px-8 py-4 bg-white text-black rounded-2xl font-black text-lg tracking-widest uppercase overflow-hidden transition-all hover:scale-105 block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity" />
                <span className="relative flex items-center gap-2">
                  Initialize Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link to="/login" className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all block">
                Login System
              </Link>
            </>
          )}
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto pb-20 md:pb-0">
          {[
            { icon: <Layers className="w-8 h-8 text-blue-400" />, title: 'Asset Centric', desc: 'Every action, from RSS subscriptions to AI reports, is tokenized as a digital asset linked to your identity.' },
            { icon: <Zap className="w-8 h-8 text-purple-400" />, title: 'AURORA', desc: 'Aggregate information feeds and utilize custom AI prompts to generate permanent insight reports.' },
            { icon: <Globe className="w-8 h-8 text-green-400" />, title: 'Social Graph', desc: 'Connect, share, and interact in a network where influence and reach are transparently measured.' }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="mb-6 p-4 bg-black/50 rounded-2xl inline-block group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;

import React from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Settings, Shield, Award, Globe, Mail, Link as LinkIcon, Edit3, Zap } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuthStore();

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
        <button className="absolute bottom-4 right-8 px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2">
          <Edit3 className="w-4 h-4" /> Edit Profile
        </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Assets', value: '12', color: 'text-blue-400' },
              { label: 'Insights', value: '45', color: 'text-purple-400' },
              { label: 'Reputation', value: '2.4k', color: 'text-green-400' }
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
              {[
                { title: 'AI Ethics Manifesto', type: 'Insight', date: 'Mar 15' },
                { title: 'TechCrunch Feed Summary', type: 'AURORA', date: 'Mar 12' },
                { title: 'Smart Contract Snippets', type: 'Code', date: 'Mar 10' }
              ].map((item) => (
                <div key={item.title} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer">
                  <div>
                    <h4 className="font-bold group-hover:text-blue-400 transition-colors">{item.title}</h4>
                    <p className="text-xs text-gray-500">{item.type} • {item.date}</p>
                  </div>
                  <Settings className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

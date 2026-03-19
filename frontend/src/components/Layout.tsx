import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Compass, MessageCircle, User, Zap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Layout: React.FC = () => {
  const { user } = useAuthStore();

  const navItems = [
    { to: '/', icon: <Home className="w-5 h-5" />, label: 'HOME' },
    { to: '/aurora', icon: <Compass className="w-5 h-5" />, label: 'AURORA' },
    { to: '/social', icon: <Zap className="w-5 h-5" />, label: 'SOCIAL' },
    { to: '/chat', icon: <MessageCircle className="w-5 h-5" />, label: 'CHAT' },
    { to: '/profile', icon: <User className="w-5 h-5" />, label: 'PROFILE' },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar Navigation */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto md:left-0 md:h-screen md:w-64 bg-black/90 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/10 z-50">
          <div className="flex md:flex-col h-full p-4 md:p-6">
            <div className="hidden md:flex items-center gap-3 mb-12 px-2 group">
              <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl transform group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor" className="animate-pulse" />
                </svg>
              </div>
              <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:to-white transition-colors">
                PEGASUS
              </span>
            </div>

            <div className="flex md:flex-col justify-around md:justify-start w-full gap-2 md:gap-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {item.icon}
                  <span className="hidden md:block font-bold tracking-widest text-sm">
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>

            <div className="hidden md:block mt-auto p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl border border-white/5">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Network Status</div>
              <div className="flex items-center gap-2 text-sm font-bold text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                SYNCED
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 min-h-screen ${user ? 'md:ml-64 pb-20 md:pb-0' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

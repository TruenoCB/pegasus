import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ghost, Menu, X, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { name: 'PEGASUS', path: '/' },
    { name: 'AURORA', path: '/aurora' },
    { name: 'Social', path: '/social' },
    { name: 'Chat', path: '/chat' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                <Ghost className="w-6 h-6" />
                PEGASUS
              </Link>
              <div className="hidden md:block">
                <div className="flex items-baseline space-x-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === item.path
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-4">
                {user ? (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-300">{user.name}</span>
                        <button onClick={logout} className="text-sm text-gray-400 hover:text-white">Logout</button>
                        <Link to="/profile" className="p-1 rounded-full bg-gray-800 hover:bg-gray-700">
                            <UserIcon className="w-5 h-5 text-gray-300" />
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm text-gray-300 hover:text-white">Log in</Link>
                        <Link to="/register" className="px-3 py-1.5 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors">Sign up</Link>
                    </div>
                )}
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
               {user ? (
                    <>
                        <div className="px-3 py-2 text-gray-400">Signed in as {user.name}</div>
                        <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white">Logout</button>
                    </>
                ) : (
                    <>
                         <Link to="/login" className="block px-3 py-2 text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>Log in</Link>
                         <Link to="/register" className="block px-3 py-2 text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>Sign up</Link>
                    </>
                )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16 min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
};

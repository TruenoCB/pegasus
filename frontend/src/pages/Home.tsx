import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
        All Your Assets.<br />
        One Platform.
      </h1>
      <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-10">
        PEGASUS is the unified gateway for your digital life. 
        Social, Assets, and AI-powered insights in one place.
      </p>
      
      <div className="flex gap-4">
        <Link to="/aurora" className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2">
            Explore AURORA <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/register" className="px-8 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
            Join Now
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
         {/* Feature Cards */}
         {[
             { title: 'AURORA', desc: 'AI-driven information refinement. Break the echo chamber.' },
             { title: 'Assets', desc: 'Everything is an asset. Manage your digital footprint.' },
             { title: 'Social', desc: 'Connect with value. Decentralized social graph.' }
         ].map((item) => (
             <div key={item.title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:transform hover:-translate-y-1">
                 <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                 <p className="text-gray-400">{item.desc}</p>
             </div>
         ))}
      </div>
    </div>
  );
};

export default Home;

import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  Plus, Rss, Loader2, Compass, TrendingUp, 
  Newspaper, Cpu, Globe, Mail, Share2, Bookmark 
} from 'lucide-react';

// 推荐的 RSS 源列表 (模拟社区推荐)
const RECOMMENDED_FEEDS = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Technology', icon: <Cpu className="w-4 h-4" /> },
  { name: '36Kr', url: 'https://36kr.com/feed', category: 'Business', icon: <TrendingUp className="w-4 h-4" /> },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Tech/Culture', icon: <Globe className="w-4 h-4" /> },
  { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', category: 'World', icon: <Newspaper className="w-4 h-4" /> },
];

const Aurora: React.FC = () => {
    const { token } = useAuthStore();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [summaries, setSummaries] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('discover');

    const handleProcess = async (feedUrl?: string) => {
        const targetUrl = feedUrl || url;
        if (!targetUrl) return;
        
        setLoading(true);
        try {
            const res = await fetch('/api/rss/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl }),
            });
            const data = await res.json();
            if (data.summaries) {
                setSummaries(data.summaries);
                setActiveTab('results'); // 自动切换到结果页
            } else {
                alert('No summaries returned. Check console/logs.');
            }
        } catch (error) {
            console.error(error);
            alert('Error processing feed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                
                {/* Header Section */}
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white text-black rounded-2xl">
                                <Rss className="w-8 h-8" />
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter">AURORA</h1>
                        </div>
                        <p className="text-gray-500 text-lg max-w-xl">
                            Next-gen AI RSS aggregator. Turn noisy feeds into clear, actionable intelligence.
                        </p>
                    </div>
                    
                    {/* Quick Search/Input */}
                    <div className="flex-1 max-w-md w-full">
                        <div className="relative group">
                            <input 
                                type="text" 
                                placeholder="Paste RSS Feed URL..." 
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all text-lg"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
                            />
                            <button 
                                onClick={() => handleProcess()} 
                                disabled={loading}
                                className="absolute right-2 top-2 bottom-2 px-6 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'AI Analyze'}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-white/10 mb-8 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('discover')}
                        className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'discover' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <span className="flex items-center gap-2"><Compass className="w-4 h-4" /> Discover Community</span>
                        {activeTab === 'discover' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('results')}
                        className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'results' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <span className="flex items-center gap-2"><Newspaper className="w-4 h-4" /> AI Summaries {summaries.length > 0 && `(${summaries.length})`}</span>
                        {activeTab === 'results' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                    </button>
                </div>

                {activeTab === 'discover' ? (
                    <section className="animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                Popular Sources
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {RECOMMENDED_FEEDS.map((feed) => (
                                <div 
                                    key={feed.name}
                                    className="group p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer relative overflow-hidden"
                                    onClick={() => handleProcess(feed.url)}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <div className="mb-4 text-gray-400">
                                        {feed.icon}
                                    </div>
                                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                                        {feed.category}
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">{feed.name}</h3>
                                    <button className="text-sm font-semibold py-2 px-4 bg-white/10 rounded-full group-hover:bg-white group-hover:text-black transition-all">
                                        Quick Analyze
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : (
                    <section className="animate-in slide-in-from-bottom-4 duration-500">
                        {summaries.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <p className="text-gray-500 text-lg">No summaries yet. Try adding a feed from the Discover tab.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {summaries.map((item, idx) => (
                                    <article 
                                        key={idx} 
                                        className="flex flex-col bg-white/5 rounded-3xl p-8 border border-white/10 hover:border-white/30 hover:bg-white/[0.07] transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                AI Generated
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                                                    <Bookmark className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <h3 className="text-2xl font-bold mb-4 leading-tight group-hover:text-blue-400 transition-colors">
                                            <a href={item.link} target="_blank" rel="noopener noreferrer">
                                                {item.title}
                                            </a>
                                        </h3>
                                        
                                        <div className="text-gray-400 leading-relaxed mb-8 flex-1 text-sm line-clamp-6">
                                            {item.summary}
                                        </div>

                                        <div className="space-y-3 border-t border-white/5 pt-6 mt-auto">
                                            {item.keyPoints && item.keyPoints.slice(0, 3).map((point: string, i: number) => (
                                                <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 flex-shrink-0" />
                                                    <span className="line-clamp-1">{point}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
};

export default Aurora;

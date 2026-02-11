import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Plus, Rss, Loader2 } from 'lucide-react';

const Aurora: React.FC = () => {
    const { token } = useAuthStore();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [summaries, setSummaries] = useState<any[]>([]);

    const handleProcess = async () => {
        if (!url) return;
        setLoading(true);
        try {
            const res = await fetch('/api/rss/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();
            if (data.summaries) {
                setSummaries(data.summaries);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-10">
                <h1 className="text-4xl font-bold mb-2">AURORA</h1>
                <p className="text-gray-400">AI-Powered Information Refinement</p>
            </header>

            {/* Input Section */}
            <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Rss className="w-5 h-5" /> Quick Summarize
                </h2>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        placeholder="Enter RSS Feed URL (e.g. https://feeds.feedburner.com/TechCrunch/)" 
                        className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-lg focus:outline-none focus:border-white"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                    <button 
                        onClick={handleProcess} 
                        disabled={loading}
                        className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Summarize'}
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {summaries.map((item, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
                        <h3 className="text-lg font-bold mb-2 line-clamp-2">
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{item.title}</a>
                        </h3>
                        <div className="text-sm text-gray-300 mb-4 h-32 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                            {item.summary}
                        </div>
                        <div className="space-y-1">
                            {item.keyPoints && item.keyPoints.map((point: string, i: number) => (
                                <div key={i} className="text-xs px-2 py-1 rounded bg-white/10 text-gray-300 truncate">
                                    • {point}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Aurora;

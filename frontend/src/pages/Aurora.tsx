import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  Plus, Rss, Loader2, Compass, TrendingUp, 
  Newspaper, Cpu, Globe, Share2, Bookmark, FolderPlus, Send, Settings
} from 'lucide-react';

// 推荐的 RSS 源列表 (模拟社区推荐)
// This will now be fetched from backend
// const RECOMMENDED_FEEDS = [...]

const Aurora: React.FC = () => {
    const { token } = useAuthStore();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [summaries, setSummaries] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('discover');
    
    // Popular sources state
    const [popularSources, setPopularSources] = useState<any[]>([]);
    
    // My groups & reports state
    const [myGroups, setMyGroups] = useState<any[]>([]);
    const [myReports, setMyReports] = useState<any[]>([]);
    const [generatingReportFor, setGeneratingReportFor] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);

    // Group creation state
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupEmails, setGroupEmails] = useState('');
    const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
    const [customUrls, setCustomUrls] = useState('');
    const [promptConfig, setPromptConfig] = useState('Please summarize the key points, extracting the most important insights and technical details. Format the output in Markdown.');
    const [creatingGroup, setCreatingGroup] = useState(false);

    useEffect(() => {
        const fetchPopularSources = async () => {
            try {
                const res = await fetch('/api/rss/popular', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPopularSources(data || []);
                }
            } catch (error) {
                console.error("Failed to fetch popular sources", error);
            }
        };

        const fetchMyGroups = async () => {
            try {
                const res = await fetch('/api/rss/groups/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMyGroups(data || []);
                }
            } catch (error) {
                console.error("Failed to fetch my groups", error);
            }
        };
        
        const fetchMyReports = async () => {
            try {
                const res = await fetch('/api/rss/reports/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMyReports(data || []);
                }
            } catch (error) {
                console.error("Failed to fetch my reports", error);
            }
        };
        
        if (token) {
            fetchPopularSources();
            fetchMyGroups();
            fetchMyReports();
        }
    }, [token]);

    const getIconComponent = (iconType: string) => {
        switch (iconType) {
            case 'Cpu': return <Cpu className="w-4 h-4" />;
            case 'TrendingUp': return <TrendingUp className="w-4 h-4" />;
            case 'Globe': return <Globe className="w-4 h-4" />;
            case 'Newspaper': return <Newspaper className="w-4 h-4" />;
            default: return <Rss className="w-4 h-4" />;
        }
    };

    const handleProcess = async (feedUrl?: string) => {
        const targetUrl = feedUrl || url;
        if (!targetUrl) return;
        
        setLoading(true);
        try {
            const res = await fetch('/api/rss/process', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ url: targetUrl }),
            });
            const data = await res.json();
            if (res.ok && data.summaries) {
                setSummaries(data.summaries);
                setActiveTab('results'); // 自动切换到结果页
            } else {
                alert(data.error || 'Failed to process feed. Please check URL or login status.');
            }
        } catch (error) {
            console.error(error);
            alert('Error processing feed. Ensure you are logged in.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        const customUrlList = customUrls.split('\n').map(u => u.trim()).filter(u => u);
        const allUrls = [...new Set([...selectedUrls, ...customUrlList])];
        
        if (!groupName || allUrls.length === 0) return;
        
        setCreatingGroup(true);
        try {
            const res = await fetch('/api/rss/group', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    name: groupName,
                    description: `Group created with ${allUrls.length} feeds`,
                    urls: allUrls,
                    emails: groupEmails.split(',').map(e => e.trim()).filter(e => e),
                    prompt_config: promptConfig
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert('Group created successfully!');
                setShowGroupModal(false);
                setGroupName('');
                setGroupEmails('');
                setSelectedUrls([]);
                setCustomUrls('');
                setPromptConfig('Please summarize the key points, extracting the most important insights and technical details. Format the output in Markdown.');
                
                // Refresh my groups
                const groupsRes = await fetch('/api/rss/groups/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (groupsRes.ok) {
                    setMyGroups(await groupsRes.json());
                }
            } else {
                alert(data.error || 'Failed to create group');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating group');
        } finally {
            setCreatingGroup(false);
        }
    };

    const handleGenerateReport = async (groupId: string) => {
        setGeneratingReportFor(groupId);
        try {
            const res = await fetch('/api/rss/groups/report', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ group_id: groupId }),
            });
            if (res.ok) {
                const report = await res.json();
                alert('Report generated successfully!');
                
                // Refresh reports and open the results tab
                const reportsRes = await fetch('/api/rss/reports/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (reportsRes.ok) {
                    setMyReports(await reportsRes.json());
                }
                
                setSelectedReport(report);
                setActiveTab('results');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to generate report');
            }
        } catch (error) {
            console.error(error);
            alert('Error generating report');
        } finally {
            setGeneratingReportFor(null);
        }
    };

    const toggleUrlSelection = (feedUrl: string) => {
        setSelectedUrls(prev => 
            prev.includes(feedUrl) ? prev.filter(u => u !== feedUrl) : [...prev, feedUrl]
        );
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
                        onClick={() => setActiveTab('my_groups')}
                        className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'my_groups' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <span className="flex items-center gap-2"><FolderPlus className="w-4 h-4" /> My Groups</span>
                        {activeTab === 'my_groups' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                    </button>
                    <button 
                        onClick={() => {
                            setActiveTab('results');
                            setSelectedReport(null);
                        }}
                        className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'results' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <span className="flex items-center gap-2"><Newspaper className="w-4 h-4" /> AI Summaries {myReports.length > 0 && `(${myReports.length})`}</span>
                        {activeTab === 'results' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                    </button>
                </div>

                {activeTab === 'discover' && (
                    <section className="animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                Popular Sources
                            </h2>
                            <button 
                                onClick={() => setShowGroupModal(true)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
                            >
                                <FolderPlus className="w-4 h-4" /> Create Group
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {popularSources.map((feed) => (
                                <div 
                                    key={feed.name}
                                    className={`group p-6 border rounded-3xl transition-all relative overflow-hidden ${
                                        selectedUrls.includes(feed.url) 
                                        ? 'bg-blue-900/20 border-blue-500/50' 
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                    }`}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-50 hover:opacity-100 transition-opacity z-10 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 accent-blue-500"
                                            checked={selectedUrls.includes(feed.url)}
                                            onChange={() => toggleUrlSelection(feed.url)}
                                        />
                                    </div>
                                    <div className="mb-4 text-gray-400 cursor-pointer" onClick={() => {
                                        setSelectedUrls(prev => prev.includes(feed.url) ? prev.filter(u => u !== feed.url) : [...prev, feed.url]);
                                    }}>
                                        {getIconComponent(feed.icon_type)}
                                    </div>
                                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 cursor-pointer" onClick={() => {
                                        setSelectedUrls(prev => prev.includes(feed.url) ? prev.filter(u => u !== feed.url) : [...prev, feed.url]);
                                    }}>
                                        {feed.category}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 cursor-pointer" onClick={() => {
                                        setSelectedUrls(prev => prev.includes(feed.url) ? prev.filter(u => u !== feed.url) : [...prev, feed.url]);
                                    }}>{feed.name}</h3>
                                    <div className="text-xs text-gray-500 mb-4">{feed.subscribers} subscribers</div>
                                    <button 
                                        onClick={() => {
                                            setSelectedUrls([feed.url]);
                                            setShowGroupModal(true);
                                        }}
                                        className="text-sm font-semibold py-2 px-4 bg-white/10 rounded-full hover:bg-white hover:text-black transition-all"
                                    >
                                        Create Group
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Group Creation Modal */}
                        {showGroupModal && (
                            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                                <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md">
                                    <h3 className="text-2xl font-bold mb-6">Create RSS Group</h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Group Name</label>
                                            <input 
                                                type="text" 
                                                value={groupName}
                                                onChange={e => setGroupName(e.target.value)}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30"
                                                placeholder="e.g. Daily Tech News"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Notification Emails (comma separated)</label>
                                            <input 
                                                type="text" 
                                                value={groupEmails}
                                                onChange={e => setGroupEmails(e.target.value)}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30"
                                                placeholder="user@example.com, team@example.com"
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Custom RSS URLs (one per line)</label>
                                            <textarea 
                                                value={customUrls}
                                                onChange={e => setCustomUrls(e.target.value)}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 h-24 resize-none"
                                                placeholder="https://example.com/feed.xml&#10;https://blog.com/rss"
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <label className="block text-sm font-medium text-gray-400 mb-1">AI Prompt (Language & Instructions)</label>
                                            <textarea 
                                                value={promptConfig}
                                                onChange={e => setPromptConfig(e.target.value)}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 h-24 resize-none text-sm"
                                                placeholder="e.g. Please summarize the key points in Chinese, extracting the most important insights..."
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <p className="text-sm text-gray-400 mb-2">Selected from Popular ({selectedUrls.length}):</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUrls.length === 0 ? (
                                                    <span className="text-xs text-gray-500">None selected</span>
                                                ) : (
                                                    popularSources.filter(f => selectedUrls.includes(f.url)).map(f => (
                                                        <span key={f.name} className="text-xs px-2 py-1 bg-white/10 rounded-md">{f.name}</span>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-8">
                                        <button 
                                            onClick={() => setShowGroupModal(false)}
                                            className="flex-1 py-3 px-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleCreateGroup}
                                            disabled={creatingGroup || !groupName || (selectedUrls.length === 0 && !customUrls.trim())}
                                            className="flex-1 py-3 px-4 rounded-xl font-bold bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50"
                                        >
                                            {creatingGroup ? 'Creating...' : 'Create Group'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'my_groups' && (
                    <section className="animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                My RSS Groups
                            </h2>
                            <button 
                                onClick={() => {
                                    setShowGroupModal(true);
                                    setActiveTab('discover'); // Switch to discover to pick feeds
                                }}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
                            >
                                <FolderPlus className="w-4 h-4" /> Create New
                            </button>
                        </div>
                        
                        {myGroups.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <p className="text-gray-500 text-lg">You haven't created any RSS groups yet.</p>
                                <button 
                                    onClick={() => setActiveTab('discover')}
                                    className="mt-4 text-blue-400 hover:underline"
                                >
                                    Go to Discover to create one
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {myGroups.map((group) => (
                                    <div key={group.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                        <h3 className="text-xl font-bold mb-2">{group.name}</h3>
                                        <p className="text-gray-400 text-sm mb-4">{group.description}</p>
                                        <div className="text-xs text-gray-500 mb-4">
                                            {(() => {
                                                try { return JSON.parse(group.feed_configs || '[]').length; }
                                                catch { return 0; }
                                            })()} feeds configured
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleGenerateReport(group.id)}
                                                disabled={generatingReportFor === group.id}
                                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                                            >
                                                {generatingReportFor === group.id ? 'Generating...' : 'Generate AI Report'}
                                            </button>
                                            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'results' && (
                    <section className="animate-in slide-in-from-bottom-4 duration-500">
                        {selectedReport ? (
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative">
                                <button 
                                    onClick={() => setSelectedReport(null)}
                                    className="absolute top-8 right-8 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Back to Reports
                                </button>
                                <h2 className="text-3xl font-black mb-2 pr-32">{selectedReport.title}</h2>
                                <p className="text-gray-500 mb-8">{new Date(selectedReport.created_at).toLocaleString()}</p>
                                <div className="prose prose-invert max-w-none">
                                    {/* A simple markdown renderer logic. In real app, use react-markdown */}
                                    {selectedReport.content.split('\n').map((line: string, i: number) => {
                                        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.substring(2)}</h1>;
                                        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-5 mb-3">{line.substring(3)}</h2>;
                                        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.substring(4)}</h3>;
                                        if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1">{line.substring(2)}</li>;
                                        if (line.trim() === '') return <br key={i} />;
                                        return <p key={i} className="mb-4 text-gray-300 leading-relaxed">{line}</p>;
                                    })}
                                </div>
                                <div className="flex gap-4 mt-8 pt-8 border-t border-white/10">
                                    <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                        <Share2 className="w-4 h-4" /> Share Asset
                                    </button>
                                    <button className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-colors">
                                        <Bookmark className="w-4 h-4" /> Save
                                    </button>
                                </div>
                            </div>
                        ) : myReports.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Newspaper className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">No Reports Yet</h3>
                                <p className="text-gray-500">Generate an AI report from one of your RSS groups to see it here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {myReports.map((report) => (
                                    <div 
                                        key={report.id} 
                                        onClick={() => setSelectedReport(report)}
                                        className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">{report.title}</h3>
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm line-clamp-2">
                                            {report.content.replace(/[#*`]/g, '').substring(0, 150)}...
                                        </p>
                                    </div>
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

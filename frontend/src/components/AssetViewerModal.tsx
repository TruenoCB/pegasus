import React, { useState, useEffect } from 'react';
import { X, Loader2, Bookmark, BookmarkCheck, Rss, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuthStore } from '../store/authStore';

interface AssetViewerModalProps {
    assetId: string;
    onClose: () => void;
}

const AssetViewerModal: React.FC<AssetViewerModalProps> = ({ assetId, onClose }) => {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const fetchAsset = async () => {
            setLoading(true);
            try {
                // Fetch asset details
                const res = await fetch(`/api/social/assets/${assetId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Asset not found');
                const assetData = await res.json();
                setData(assetData);

                // Check if it's saved
                const savedRes = await fetch('/api/social/assets/saved', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (savedRes.ok) {
                    const savedAssets = await savedRes.json();
                    setIsSaved(savedAssets.some((sa: any) => sa.id === assetId));
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (assetId && token) {
            fetchAsset();
        }
    }, [assetId, token]);

    const handleToggleSave = async () => {
        try {
            const res = await fetch(`/api/social/assets/${assetId}/save`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setIsSaved(!isSaved);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        {data?.asset?.type === 'RSS_GROUP' && <Rss className="w-5 h-5 text-blue-400" />}
                        {data?.asset?.type === 'SUMMARY_REPORT' && <FileText className="w-5 h-5 text-yellow-400" />}
                        Asset Details
                    </h3>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleToggleSave}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${isSaved ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                            {isSaved ? 'Saved' : 'Save'}
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-10">{error}</div>
                    ) : data ? (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-black mb-2">{data.asset.title}</h1>
                                <p className="text-gray-400">{data.asset.description}</p>
                                <div className="text-xs text-gray-500 mt-2 uppercase tracking-widest font-bold">
                                    {data.asset.type.replace('_', ' ')} • {new Date(data.asset.created_at).toLocaleString()}
                                </div>
                            </div>
                            
                            {data.asset.type === 'RSS_GROUP' && data.group && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                    <h4 className="font-bold text-lg mb-4 text-blue-400">Configuration</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Feeds</div>
                                            <ul className="list-disc list-inside text-sm text-gray-300 ml-4">
                                                {JSON.parse(data.group.feed_configs || '[]').map((f: string, i: number) => (
                                                    <li key={i}>{f}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        {data.group.prompt_config && (
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">AI Prompt</div>
                                                <div className="text-sm text-gray-300 bg-black/50 p-3 rounded-lg">{data.group.prompt_config}</div>
                                            </div>
                                        )}
                                        {data.group.report_frequency && (
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Schedule</div>
                                                <div className="text-sm text-gray-300 capitalize">{data.group.report_frequency}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {data.asset.type === 'SUMMARY_REPORT' && data.report && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                    <div className="prose prose-invert max-w-none prose-sm sm:prose-base prose-p:leading-relaxed prose-headings:font-bold prose-a:text-blue-400">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {data.report.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default AssetViewerModal;
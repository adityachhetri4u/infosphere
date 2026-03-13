import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Flag, RefreshCw } from 'lucide-react';

interface FlaggedArticle {
  id: number;
  title: string;
  url: string;
  flagged_at: string;
  verification_score: number;
  flag_reasons: string[];
  checks_summary: {
    [key: string]: {
      score: number;
      status: string;
    };
  };
}

interface FlaggedStats {
  total_flagged: number;
  common_reasons: Array<{
    reason: string;
    count: number;
  }>;
  average_score: number;
}

const FlaggedNews: React.FC = () => {
  const [flaggedArticles, setFlaggedArticles] = useState<FlaggedArticle[]>([]);
  const [stats, setStats] = useState<FlaggedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFlaggedNews();
  }, []);

  const fetchFlaggedNews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/verification/flagged-news?limit=50');
      
      if (response.data.success) {
        setFlaggedArticles(response.data.flagged_articles);
        setStats(response.data.statistics);
      }
    } catch (err: any) {
      console.error('Failed to fetch flagged news:', err);
      setError(err.response?.data?.detail || 'Failed to load flagged news');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.80) return '#10b981'; // green
    if (score >= 0.65) return '#f59e0b'; // yellow
    if (score >= 0.50) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getStatusBadgeClass = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      'verified': 'bg-green-100 text-green-800 border-green-600',
      'debunked': 'bg-red-100 text-red-800 border-red-600',
      'unreliable': 'bg-red-100 text-red-800 border-red-600',
      'stock_photo': 'bg-yellow-100 text-yellow-800 border-yellow-600',
      'future_dated': 'bg-red-100 text-red-800 border-red-600',
      'not_found': 'bg-gray-100 text-gray-800 border-gray-400',
      'moderate': 'bg-yellow-100 text-yellow-800 border-yellow-600',
      'unknown': 'bg-gray-100 text-gray-800 border-gray-400'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-400';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="newspaper-bg min-h-screen py-4">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="newspaper-section text-center py-12">
            <div className="text-2xl font-black text-black animate-pulse" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>LOADING FLAGGED REPORTS...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="newspaper-bg min-h-screen py-4">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="newspaper-section border-4 border-black p-8 text-center">
            <p className="text-black font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>{error}</p>
            <button
              onClick={fetchFlaggedNews}
              className="bg-black text-white px-6 py-3 font-black uppercase tracking-wide border-2 border-black hover:bg-gray-800 transition-colors"
            >
              RETRY
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="newspaper-bg min-h-screen py-4">
      <div className="max-w-[1600px] mx-auto px-4">
        {/* Newspaper Header */}
        <div className="newspaper-header text-center py-4 mb-6">
          <div className="border-t-4 border-b-4 border-black py-4 mx-4">
            <h1 className="newspaper-title text-5xl font-black text-black mb-2 tracking-tight">
              THE FLAGGED NEWS REGISTRY
            </h1>
            <div className="flex justify-center items-center space-x-8 text-sm font-semibold text-black">
              <span>INTEGRITY WATCHDESK</span>
              <span className="border-l border-r border-black px-4">AI VERIFICATION BUREAU</span>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="newspaper-subtitle text-lg font-semibold text-black max-w-3xl mx-auto italic">
              "Articles flagged for failing advanced verification checks — reviewed with scrutiny"
            </p>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
              <div className="text-xs font-black text-black uppercase tracking-widest mb-3">TOTAL FLAGGED</div>
              <div className="text-4xl font-black text-black" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                {stats.total_flagged}
              </div>
            </div>
            <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
              <div className="text-xs font-black text-black uppercase tracking-widest mb-3">AVERAGE SCORE</div>
              <div className="text-4xl font-black text-black" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                {(stats.average_score * 100).toFixed(1)}%
              </div>
            </div>
            <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
              <div className="text-xs font-black text-black uppercase tracking-widest mb-3">TOP FLAG REASON</div>
              <div className="text-base font-bold text-black" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                {stats.common_reasons[0]?.reason.substring(0, 40) || 'N/A'}...
              </div>
            </div>
          </div>
        )}

        {/* Common Flag Reasons */}
        {stats && stats.common_reasons.length > 0 && (
          <div className="newspaper-section mb-6">
            <div className="newspaper-card-header">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">MOST COMMON FLAG REASONS</h2>
            </div>
            <div className="p-6 space-y-3">
              {stats.common_reasons.map((reason, index) => (
                <div key={index} className="flex items-center justify-between border-b border-black pb-3 last:border-0 last:pb-0">
                  <span className="text-sm font-bold text-black" style={{ fontFamily: 'Georgia, serif' }}>
                    {index + 1}. {reason.reason}
                  </span>
                  <span className="ml-4 px-3 py-1 border-2 border-black text-xs font-black uppercase bg-white text-black flex-shrink-0">
                    {reason.count} articles
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flagged Articles List */}
        <div className="space-y-4">
          {flaggedArticles.length === 0 ? (
            <div className="newspaper-section border-4 border-black p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-black text-black mb-2 uppercase" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                NO FLAGGED ARTICLES
              </h3>
              <p className="text-black font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>
                All recent news articles have passed verification checks!
              </p>
            </div>
          ) : (
            flaggedArticles.map((article) => (
              <div
                key={article.id}
                className="border-4 border-black bg-white p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                {/* Article Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-black mb-2" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                      {article.title}
                    </h3>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-black underline font-bold break-all"
                    >
                      {article.url}
                    </a>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div
                      className="px-4 py-2 border-2 border-black font-black text-white text-center min-w-[64px]"
                      style={{ backgroundColor: getScoreColor(article.verification_score) }}
                    >
                      {(article.verification_score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-sm font-bold text-black mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  Flagged: {formatDate(article.flagged_at)}
                </div>

                {/* Flag Reasons */}
                <div className="mb-4">
                  <h4 className="text-sm font-black text-black mb-2 uppercase tracking-wide">⚠️ FLAG REASONS:</h4>
                  <ul className="space-y-1">
                    {article.flag_reasons.map((reason, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-black font-bold mr-2">•</span>
                        <span className="text-sm text-black" style={{ fontFamily: 'Georgia, serif' }}>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Verification Checks Summary */}
                <div className="border-t-2 border-black pt-4">
                  <h4 className="text-sm font-black text-black mb-3 uppercase tracking-wide">VERIFICATION CHECKS:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(article.checks_summary).map(([checkName, checkData]) => (
                      <div key={checkName} className="text-center">
                        <div className="text-xs font-bold text-black mb-1 capitalize" style={{ fontFamily: 'Georgia, serif' }}>
                          {checkName.replace(/_/g, ' ')}
                        </div>
                        <div
                          className={`inline-flex items-center px-2 py-1 border text-xs font-bold ${getStatusBadgeClass(
                            checkData.status
                          )}`}
                        >
                          {(checkData.score * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchFlaggedNews}
            className="bg-black text-white px-8 py-3 font-black text-sm uppercase tracking-widest border-2 border-black hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={16} className="inline mr-2" />
            REFRESH FLAGGED REPORTS
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlaggedNews;

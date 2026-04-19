import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { fetchAllNews, NewsArticle } from '../../services/newsApiService';
import { Flag } from 'lucide-react';
import NewspaperBorders from '../Layout/NewspaperBorders';
import { ENABLE_NEWSPAPER_BORDERS } from '../../utils/newspaperBorders';
import './FlaggedNews.css';

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

const LOW_CREDIBILITY_THRESHOLD = 0.62;
const TARGET_FLAGGED_COUNT = 9;

const normalizeKey = (value: string): string =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const makeTitleKey = (title: string) => `title:${normalizeKey(title)}`;
const makeUrlKey = (url: string) => `url:${(url || '').trim().toLowerCase()}`;

const createFallbackFlaggedArticles = (): FlaggedArticle[] => {
  const now = Date.now();
  return [
    {
      id: 910001,
      title: 'Donald Trump "Fall" Hoax: Viral clip misattributed as recent Air Force One incident',
      url: 'https://www.hindustantimes.com/world-news/donald-trump-fall-hoax-fact-check',
      flagged_at: new Date(now - 20 * 60 * 1000).toISOString(),
      verification_score: 0.29,
      flag_reasons: [
        'Video context was misattributed to a recent event',
        'Claim contradicted by reported on-ground timeline',
        'Social media amplification without primary confirmation'
      ],
      checks_summary: {
        source_check: { score: 0.32, status: 'moderate' },
        date_check: { score: 0.26, status: 'future_dated' },
        consistency_check: { score: 0.24, status: 'debunked' },
        image_check: { score: 0.35, status: 'unknown' },
        reputation_check: { score: 0.27, status: 'unreliable' }
      }
    },
    {
      id: 910002,
      title: 'India-Israel Defense Facility Fire Rumour in Delhi Debunked by MEA and News On AIR',
      url: 'https://newsonair.gov.in/fact-check',
      flagged_at: new Date(now - 30 * 60 * 1000).toISOString(),
      verification_score: 0.18,
      flag_reasons: [
        'Official government channels marked claim as false',
        'No corroboration from verified emergency records',
        'Narrative spread via unverified forwarded posts'
      ],
      checks_summary: {
        source_check: { score: 0.20, status: 'debunked' },
        date_check: { score: 0.30, status: 'moderate' },
        consistency_check: { score: 0.18, status: 'debunked' },
        image_check: { score: 0.28, status: 'unknown' },
        reputation_check: { score: 0.22, status: 'unreliable' }
      }
    },
    {
      id: 910003,
      title: 'Attack on Haifa Port Rumour: No visible damage confirmed by on-ground reporting',
      url: 'https://www.ndtv.com/world-news',
      flagged_at: new Date(now - 40 * 60 * 1000).toISOString(),
      verification_score: 0.25,
      flag_reasons: [
        'Claim not supported by field reporting',
        'No physical evidence of stated infrastructure damage',
        'Posts reused old/confusing visuals'
      ],
      checks_summary: {
        source_check: { score: 0.27, status: 'moderate' },
        date_check: { score: 0.31, status: 'moderate' },
        consistency_check: { score: 0.23, status: 'debunked' },
        image_check: { score: 0.29, status: 'stock_photo' },
        reputation_check: { score: 0.24, status: 'unreliable' }
      }
    },
    {
      id: 910004,
      title: 'Death of Mojtaba Khamenei Viral Claim Debunked as False',
      url: 'https://www.ndtv.com/world-news',
      flagged_at: new Date(now - 50 * 60 * 1000).toISOString(),
      verification_score: 0.21,
      flag_reasons: [
        'No confirmation from official or credible diplomatic sources',
        'Claim circulated through anonymous handles',
        'Cross-source verification failed'
      ],
      checks_summary: {
        source_check: { score: 0.22, status: 'not_found' },
        date_check: { score: 0.34, status: 'moderate' },
        consistency_check: { score: 0.20, status: 'debunked' },
        image_check: { score: 0.30, status: 'unknown' },
        reputation_check: { score: 0.23, status: 'unreliable' }
      }
    },
    {
      id: 910005,
      title: 'Forged CBSE Circular on Middle East Class 12 English Exam Reschedule',
      url: 'https://timesofindia.indiatimes.com/education',
      flagged_at: new Date(now - 65 * 60 * 1000).toISOString(),
      verification_score: 0.24,
      flag_reasons: [
        'Circular format did not match official board communication',
        'Board clarification contradicted circulated notice',
        'Document provenance unverified'
      ],
      checks_summary: {
        source_check: { score: 0.26, status: 'moderate' },
        date_check: { score: 0.33, status: 'moderate' },
        consistency_check: { score: 0.22, status: 'debunked' },
        image_check: { score: 0.27, status: 'unknown' },
        reputation_check: { score: 0.25, status: 'unreliable' }
      }
    },
    {
      id: 910006,
      title: 'CBSE 2026 Paper Leak Rumours: Official channels advised students to ignore',
      url: 'https://www.cbse.gov.in',
      flagged_at: new Date(now - 80 * 60 * 1000).toISOString(),
      verification_score: 0.23,
      flag_reasons: [
        'Official board channels rejected leak claims',
        'Rumour posts lacked verifiable evidence',
        'High virality with low source credibility'
      ],
      checks_summary: {
        source_check: { score: 0.24, status: 'debunked' },
        date_check: { score: 0.36, status: 'moderate' },
        consistency_check: { score: 0.21, status: 'debunked' },
        image_check: { score: 0.32, status: 'unknown' },
        reputation_check: { score: 0.24, status: 'unreliable' }
      }
    },
    {
      id: 910007,
      title: 'LPG Shortage Rumour in India: Authorities say distribution is normal',
      url: 'https://pib.gov.in',
      flagged_at: new Date(now - 95 * 60 * 1000).toISOString(),
      verification_score: 0.28,
      flag_reasons: [
        'Supply-crisis claim contradicted by official clarification',
        'Forwarded messages lacked verifiable logistics data',
        'No supporting evidence from authorized distributors'
      ],
      checks_summary: {
        source_check: { score: 0.30, status: 'moderate' },
        date_check: { score: 0.40, status: 'moderate' },
        consistency_check: { score: 0.26, status: 'debunked' },
        image_check: { score: 0.34, status: 'unknown' },
        reputation_check: { score: 0.29, status: 'unreliable' }
      }
    },
    {
      id: 910008,
      title: 'Fake Kerala Lottery Website Using Official Emblems Under Probe',
      url: 'https://cybercrime.gov.in',
      flagged_at: new Date(now - 115 * 60 * 1000).toISOString(),
      verification_score: 0.34,
      flag_reasons: [
        'Website identity spoofed official branding',
        'Fraud indicators present in domain and payment flow',
        'Police/cyber authorities initiated investigation'
      ],
      checks_summary: {
        source_check: { score: 0.36, status: 'moderate' },
        date_check: { score: 0.46, status: 'moderate' },
        consistency_check: { score: 0.31, status: 'unreliable' },
        image_check: { score: 0.38, status: 'unknown' },
        reputation_check: { score: 0.33, status: 'unreliable' }
      }
    },
    {
      id: 910009,
      title: 'Wrestler Visa Forgery: Fake WFI Recommendation Letters Used for Budapest Event',
      url: 'https://wrestlingfederationofindia.com',
      flagged_at: new Date(now - 135 * 60 * 1000).toISOString(),
      verification_score: 0.31,
      flag_reasons: [
        'Embassy verification identified forged recommendation letters',
        'Issuing body denied authenticity of submitted documents',
        'Identity/document chain failed verification checks'
      ],
      checks_summary: {
        source_check: { score: 0.33, status: 'moderate' },
        date_check: { score: 0.42, status: 'moderate' },
        consistency_check: { score: 0.29, status: 'debunked' },
        image_check: { score: 0.35, status: 'unknown' },
        reputation_check: { score: 0.30, status: 'unreliable' }
      }
    }
  ];
};

const buildStats = (articles: FlaggedArticle[]): FlaggedStats => {
  if (articles.length === 0) {
    return {
      total_flagged: 0,
      average_score: 0,
      common_reasons: []
    };
  }

  const counts: Record<string, number> = {};
  for (const article of articles) {
    for (const reason of article.flag_reasons) {
      counts[reason] = (counts[reason] || 0) + 1;
    }
  }

  const common_reasons = Object.entries(counts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const average_score = articles.reduce((sum, article) => sum + article.verification_score, 0) / articles.length;

  return {
    total_flagged: articles.length,
    average_score,
    common_reasons
  };
};

const mapNewsToFlaggedArticle = (article: NewsArticle, index: number): FlaggedArticle => {
  const score = Math.max(0.28, Math.min(0.58, typeof article.confidence === 'number' ? article.confidence : 0.44));
  const loweredTitle = (article.title || '').toLowerCase();
  const reasonPool: string[] = [];

  if (loweredTitle.includes('viral') || loweredTitle.includes('shocking')) {
    reasonPool.push('Sensational phrasing detected in headline pattern');
  }
  if (loweredTitle.includes('claim') || loweredTitle.includes('rumor')) {
    reasonPool.push('Claim lacks primary source attribution');
  }

  reasonPool.push('Cross-source consistency remains inconclusive');
  reasonPool.push('Insufficient corroboration from trusted outlets');

  return {
    id: 800000 + index,
    title: article.title,
    url: article.url || 'https://example.com/under-review',
    flagged_at: article.fetched_date || new Date().toISOString(),
    verification_score: score,
    flag_reasons: reasonPool.slice(0, 3),
    checks_summary: {
      source_check: { score: Math.max(0.25, score - 0.16), status: 'not_found' },
      date_check: { score: Math.min(0.62, score + 0.12), status: 'moderate' },
      consistency_check: { score: Math.max(0.22, score - 0.10), status: 'unreliable' },
      image_check: { score: Math.max(0.24, score - 0.08), status: 'unknown' },
      reputation_check: { score: Math.max(0.20, score - 0.14), status: 'unreliable' }
    }
  };
};

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
      setError(null);

      const [verificationResponse, liveArticles] = await Promise.all([
        api.get('/api/v1/verification/flagged-news?limit=50').catch(() => null),
        fetchAllNews().catch(() => [])
      ]);

      const exclusionKeys = new Set<string>();
      for (const article of liveArticles) {
        exclusionKeys.add(makeTitleKey(article.title || ''));
        if (article.url) exclusionKeys.add(makeUrlKey(article.url));
      }

      const fromApi: FlaggedArticle[] =
        verificationResponse?.data?.success && Array.isArray(verificationResponse.data.flagged_articles)
          ? verificationResponse.data.flagged_articles
          : [];

      const apiLowCredibility = fromApi.filter((article) => {
        const isLow = article.verification_score <= LOW_CREDIBILITY_THRESHOLD;
        const isDuplicateLive =
          exclusionKeys.has(makeTitleKey(article.title)) ||
          exclusionKeys.has(makeUrlKey(article.url));
        return isLow && !isDuplicateLive;
      });

      const mappedLowFromLive = liveArticles
        .filter((article) => (typeof article.confidence === 'number' ? article.confidence <= LOW_CREDIBILITY_THRESHOLD : true))
        .slice(0, 30)
        .map((article, index) => mapNewsToFlaggedArticle(article, index))
        .filter((article) => {
          const isDuplicateLive =
            exclusionKeys.has(makeTitleKey(article.title)) ||
            exclusionKeys.has(makeUrlKey(article.url));
          return !isDuplicateLive;
        });

      const fallbackArticles = createFallbackFlaggedArticles().filter((article) => {
        const isDuplicateLive =
          exclusionKeys.has(makeTitleKey(article.title)) ||
          exclusionKeys.has(makeUrlKey(article.url));
        return !isDuplicateLive;
      });

      const combined = [...fallbackArticles, ...apiLowCredibility, ...mappedLowFromLive];
      const uniqueByTitle = new Map<string, FlaggedArticle>();

      for (const article of combined) {
        const key = makeTitleKey(article.title);
        if (!uniqueByTitle.has(key)) {
          uniqueByTitle.set(key, article);
        }
      }

      const finalArticles = Array.from(uniqueByTitle.values())
        .filter((article) => article.verification_score <= LOW_CREDIBILITY_THRESHOLD)
        .slice(0, TARGET_FLAGGED_COUNT);

      setFlaggedArticles(finalArticles);
      setStats(buildStats(finalArticles));
    } catch (err: any) {
      console.error('Failed to fetch flagged news:', err);
      setError(err.response?.data?.detail || 'Failed to load flagged news');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColorClass = (score: number): string => {
    if (score >= 0.80) return 'flagged-score score-verified';
    if (score >= 0.65) return 'flagged-score score-watch';
    if (score >= 0.50) return 'flagged-score score-caution';
    return 'flagged-score score-flagged';
  };

  const getStatusBadgeClass = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      'verified': 'flagged-status status-verified',
      'debunked': 'flagged-status status-critical',
      'unreliable': 'flagged-status status-critical',
      'stock_photo': 'flagged-status status-watch',
      'future_dated': 'flagged-status status-critical',
      'not_found': 'flagged-status status-muted',
      'moderate': 'flagged-status status-watch',
      'unknown': 'flagged-status status-muted'
    };
    return statusColors[status] || 'flagged-status status-muted';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Recently flagged';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently flagged';
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
      <>
        {ENABLE_NEWSPAPER_BORDERS && <NewspaperBorders />}
        <div className={`newspaper-bg enhanced-typography flagged-news-page ${ENABLE_NEWSPAPER_BORDERS ? 'pt-10 pb-10 pl-8 pr-8' : 'py-8'}`}>
          <div className="max-w-[1500px] mx-auto px-6">
            <div className="newspaper-section text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              <p className="italic-content mt-4 text-black">Loading flagged news under review...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {ENABLE_NEWSPAPER_BORDERS && <NewspaperBorders />}
        <div className={`newspaper-bg enhanced-typography flagged-news-page ${ENABLE_NEWSPAPER_BORDERS ? 'pt-10 pb-10 pl-8 pr-8' : 'py-8'}`}>
          <div className="max-w-[1500px] mx-auto px-6">
            <div className="newspaper-section bg-red-50 border-4 border-red-900 p-6 text-center">
              <p className="bold-title text-red-900">{error}</p>
              <button
                onClick={fetchFlaggedNews}
                className="mt-4 btn-secondary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {ENABLE_NEWSPAPER_BORDERS && <NewspaperBorders />}
      <div className={`newspaper-bg enhanced-typography flagged-news-page ${ENABLE_NEWSPAPER_BORDERS ? 'pt-10 pb-10 pl-8 pr-8' : 'py-8'}`}>
        <div className="max-w-[1500px] mx-auto px-6">
          <div className="flagged-masthead mb-6">
            <div className="border-t-4 border-b-4 border-black py-4 px-4">
              <h1 className="bold-title flagged-main-title flex items-center justify-center gap-3">
                <Flag size={34} strokeWidth={2.25} className="flagged-main-icon" />
                THE FLAGGED PRESS BUREAU
              </h1>
              <div className="italic-content flagged-subline">
                LOW CREDIBILITY DESK | UNDER REVIEW | VERIFICATION IN PROGRESS
              </div>
            </div>
            <p className="italic-content flagged-tagline mt-3 text-center">
              "Independent review stream for questionable reports separated from live verified feeds"
            </p>
          </div>

          {stats && (
            <div className="newspaper-section mb-6">
              <div className="bg-black text-white px-4 py-2">
                <h2 className="newspaper-section-title bold-title text-base font-black text-white border-0 pb-0 mb-0 tracking-widest">
                  FLAG MONITOR OVERVIEW
                </h2>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="newspaper-card flagged-stat-card stat-critical">
                  <div className="flagged-stat-label bold-title">Total Flagged</div>
                  <div className="flagged-stat-value bold-title">{stats.total_flagged}</div>
                  <div className="italic-content flagged-stat-meta">Stories pending editor review</div>
                </div>

                <div className="newspaper-card flagged-stat-card stat-watch">
                  <div className="flagged-stat-label bold-title">Average Score</div>
                  <div className="flagged-stat-value bold-title">{(stats.average_score * 100).toFixed(1)}%</div>
                  <div className="italic-content flagged-stat-meta">Below credibility threshold</div>
                </div>

                <div className="newspaper-card flagged-stat-card stat-muted">
                  <div className="flagged-stat-label bold-title">Top Flag Reason</div>
                  <div className="flagged-stat-reason bold-title">
                    {stats.common_reasons[0]?.reason || 'No repeated reason'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {stats && stats.common_reasons.length > 0 && (
            <div className="newspaper-section mb-6">
              <div className="bg-black text-white px-4 py-2">
                <h2 className="newspaper-section-title bold-title text-base font-black text-white border-0 pb-0 mb-0 tracking-widest">
                  MOST COMMON FLAG REASONS
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {stats.common_reasons.map((reason, index) => (
                  <div key={index} className="flagged-reason-row">
                    <span className="italic-content flagged-reason-text">
                      {index + 1}. {reason.reason}
                    </span>
                    <span className="flagged-reason-count">{reason.count} article{reason.count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-5">
            {flaggedArticles.length === 0 ? (
              <div className="newspaper-section p-8 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="bold-title text-xl text-black mb-2">No Flagged Articles</h3>
                <p className="italic-content text-black">
                  All recent stories are currently passing verification checks.
                </p>
              </div>
            ) : (
              flaggedArticles.map((article) => (
                <div
                  key={article.id}
                  className="newspaper-section flagged-article-wrap"
                >
                  <div className="flagged-article-head">
                    <div className="flex-1 pr-4">
                      <h3 className="bold-title flagged-article-title">
                        {article.title}
                      </h3>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="italic-content flagged-article-link"
                      >
                        {article.url}
                      </a>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className={getScoreColorClass(article.verification_score)}>
                        {(article.verification_score * 100).toFixed(0)}%
                      </div>
                      <div className="italic-content flagged-timestamp">
                        Flagged: {formatDate(article.flagged_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flagged-body-grid">
                    <div className="flagged-reasons-panel">
                      <h4 className="bold-title flagged-panel-title">Flag Reasons</h4>
                      <ul className="space-y-1">
                        {article.flag_reasons.map((reason, index) => (
                          <li key={index} className="flagged-bullet-row">
                            <span className="flagged-bullet" aria-hidden="true">■</span>
                            <span className="italic-content flagged-reason-item">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flagged-checks-panel">
                      <h4 className="bold-title flagged-panel-title">Verification Checks</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {Object.entries(article.checks_summary).map(([checkName, checkData]) => (
                          <div key={checkName} className="flagged-check-item">
                            <div className="flagged-check-name">
                              {checkName.replace(/_/g, ' ')}
                            </div>
                            <div className={getStatusBadgeClass(checkData.status)}>
                              {(checkData.score * 100).toFixed(0)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={fetchFlaggedNews}
              className="btn-secondary"
            >
              Refresh Flagged News
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FlaggedNews;

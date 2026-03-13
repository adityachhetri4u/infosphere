import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Network, Clock, Image, Quote } from 'lucide-react';

interface EnhancedVerificationProps {
  articleUrl: string;
  title: string;
  content: string;
  source: string;
  imageUrl?: string;
  claims?: string[];
}

interface VerificationResult {
  overall_score: number;
  verdict: string;
  verifications: {
    temporal: any;
    citations: any[];
    image: any;
    network: any;
  };
  warnings: string[];
  flags: string[];
}

const EnhancedVerification: React.FC<EnhancedVerificationProps> = ({
  articleUrl,
  title,
  content,
  source,
  imageUrl,
  claims = []
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runVerification = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/enhanced-verification/enhanced-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: articleUrl,
          title,
          content,
          source,
          image_url: imageUrl,
          claims
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        setError('Verification failed');
      }
    } catch (err) {
      setError('Failed to connect to verification service');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'VERIFIED':
        return 'text-green-700 bg-green-50 border-green-300';
      case 'NEEDS_REVIEW':
        return 'text-amber-700 bg-amber-50 border-amber-300';
      case 'QUESTIONABLE':
        return 'text-red-700 bg-red-100 border-red-300';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-700';
    if (score >= 0.6) return 'text-amber-700';
    return 'text-red-700';
  };

  return (
    <div className="rounded-lg shadow-lg p-6 space-y-6" style={{ backgroundColor: '#e8dcc6', borderColor: '#a69570', border: '2px solid #a69570' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8" style={{ color: '#5c4234' }} />
          <h2 className="text-2xl font-bold" style={{ color: '#4a3728', fontFamily: 'Playfair Display, Georgia, serif' }}>Enhanced Verification</h2>
        </div>
        <button
          onClick={runVerification}
          disabled={loading}
          className="px-6 py-2 text-white rounded-lg disabled:cursor-not-allowed transition-colors flex items-center space-x-2 font-bold"
          style={{ backgroundColor: '#5c4234' }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              <span>Run Verification</span>
            </>
          )}
        </button>
      </div>

      {/* Article Info */}
      <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: '#f5f1e8' }}>
        <h3 className="font-semibold" style={{ color: '#4a3728' }}>{title}</h3>
        <p className="text-sm" style={{ color: '#5c4234' }}>Source: {source}</p>
        <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: '#5c4234' }}>
          {articleUrl}
        </a>
      </div>

      {/* Error Message */}
      {error && (
        <div className="border rounded-lg p-4 flex items-start space-x-3" style={{ backgroundColor: '#f5e8e8', borderColor: '#b78383' }}>
          <XCircle className="w-5 h-5 mt-0.5" style={{ color: '#b78383' }} />
          <div>
            <h4 className="font-semibold" style={{ color: '#8a3a3a' }}>Error</h4>
            <p className="text-sm" style={{ color: '#8a3a3a' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Overall Verdict */}
          <div className={`border rounded-lg p-6 ${getVerdictColor(result.verdict)}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Overall Assessment</h3>
              <div className="flex items-center space-x-2">
                {result.verdict === 'VERIFIED' && <CheckCircle className="w-6 h-6" />}
                {result.verdict === 'QUESTIONABLE' && <XCircle className="w-6 h-6" />}
                {result.verdict === 'NEEDS_REVIEW' && <AlertTriangle className="w-6 h-6" />}
              </div>
            </div>
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-bold">{result.verdict}</span>
              <span className={`text-2xl font-semibold ${getScoreColor(result.overall_score)}`}>
                {(result.overall_score * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Warnings & Flags */}
          {result.warnings.length > 0 && (
            <div className="border rounded-lg p-4" style={{ backgroundColor: '#f0ede6', borderColor: '#d4c1a0' }}>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: '#8a7f6f' }} />
                <div className="flex-1">
                  <h4 className="font-semibold mb-2" style={{ color: '#5c4234' }}>Warnings</h4>
                  <ul className="space-y-1">
                    {result.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm" style={{ color: '#5c4234' }}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Temporal Verification */}
          {result.verifications.temporal && (
            <div className="border rounded-lg p-4" style={{ backgroundColor: '#f5f1e8', borderColor: '#a69570' }}>
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-5 h-5" style={{ color: '#5c4234' }} />
                <h4 className="font-semibold" style={{ color: '#4a3728' }}>Temporal Analysis</h4>
              </div>
              <div className="space-y-2 text-sm" style={{ color: '#5c4234' }}>
                <p>
                  <span className="font-medium">Claims Tracked:</span>{' '}
                  {result.verifications.temporal.total_claims || 0}
                </p>
                <p>
                  <span className="font-medium">Contradictions:</span>{' '}
                  {result.verifications.temporal.contradictory_claims || 0}
                </p>
                {result.verifications.temporal.shift_detected && (
                  <div className="border rounded p-2 mt-2" style={{ backgroundColor: '#f5e8e8', borderColor: '#b78383' }}>
                    <p className="font-medium" style={{ color: '#8a3a3a' }}>⚠️ Narrative shift detected in recent articles</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Network Analysis */}
          {result.verifications.network && (
            <div className="border rounded-lg p-4" style={{ backgroundColor: '#f5f1e8', borderColor: '#a69570' }}>
              <div className="flex items-center space-x-2 mb-3">
                <Network className="w-5 h-5" style={{ color: '#5c4234' }} />
                <h4 className="font-semibold" style={{ color: '#4a3728' }}>Network Analysis</h4>
              </div>
              <div className="space-y-2 text-sm" style={{ color: '#5c4234' }}>
                <p>
                  <span className="font-medium">Trust Score:</span>{' '}
                  <span className={getScoreColor(result.verifications.network.trust_score)}>
                    {(result.verifications.network.trust_score * 100).toFixed(1)}%
                  </span>
                </p>
                {result.verifications.network.circular_reporting?.circular && (
                  <div className="border rounded p-2 mt-2" style={{ backgroundColor: '#f5e8e8', borderColor: '#b78383' }}>
                    <p className="font-medium" style={{ color: '#8a3a3a' }}>⚠️ Circular reporting detected</p>
                    <p className="text-xs mt-1" style={{ color: '#8a3a3a' }}>
                      Chain length: {result.verifications.network.circular_reporting.chain?.length || 0}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Verification */}
          {result.verifications.image && (
            <div className="border rounded-lg p-4" style={{ backgroundColor: '#f5f1e8', borderColor: '#a69570' }}>
              <div className="flex items-center space-x-2 mb-3">
                <Image className="w-5 h-5" style={{ color: '#5c4234' }} />
                <h4 className="font-semibold" style={{ color: '#4a3728' }}>Image Analysis</h4>
              </div>
              <div className="space-y-2 text-sm" style={{ color: '#5c4234' }}>
                <p>
                  <span className="font-medium">Confidence:</span>{' '}
                  <span className={getScoreColor(result.verifications.image.confidence)}>
                    {(result.verifications.image.confidence * 100).toFixed(1)}%
                  </span>
                </p>
                {result.verifications.image.is_stock_photo && (
                  <div className="border rounded p-2" style={{ backgroundColor: '#f0ede6', borderColor: '#d4c1a0' }}>
                    <p style={{ color: '#5c4234' }}>📸 Stock photo detected</p>
                  </div>
                )}
                {result.verifications.image.metadata && (
                  <details className="mt-2">
                    <summary className="cursor-pointer hover:underline" style={{ color: '#5c4234' }}>View Metadata</summary>
                    <pre className="mt-2 rounded p-2 text-xs overflow-auto" style={{ backgroundColor: '#f5f1e8', color: '#5c4234' }}>
                      {JSON.stringify(result.verifications.image.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Citation Verification */}
          {result.verifications.citations.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Quote className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-gray-900">Quote Verification</h4>
              </div>
              <div className="space-y-3">
                {result.verifications.citations.map((citation, idx) => (
                  <div key={idx} className="bg-gray-50 rounded p-3 text-sm">
                    <p className="font-medium text-gray-900 mb-2">"{citation.quote.substring(0, 80)}..."</p>
                    {citation.verification.verified ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified from official source</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span>Could not verify from official sources</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flags */}
          {result.flags.length > 0 && (
            <div className="border rounded-lg p-4" style={{ backgroundColor: '#f0ede6', borderColor: '#d4c1a0' }}>
              <h4 className="font-semibold mb-2" style={{ color: '#4a3728' }}>Detection Flags</h4>
              <div className="flex flex-wrap gap-2">
                {result.flags.map((flag, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#d4c1a0', color: '#4a3728' }}>
                    {flag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedVerification;

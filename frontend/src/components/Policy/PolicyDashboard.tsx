import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import NewspaperBorders from '../Layout/NewspaperBorders';
import { ENABLE_NEWSPAPER_BORDERS } from '../../utils/newspaperBorders';
import './PolicyDashboard.css';

interface Policy {
  id: number;
  title: string;
  category: string;
  ai_summary: string;
  status: string;
  created_at: string;
}

interface SentimentData {
  positive_score: number;
  negative_score: number;
  neutral_score: number;
  total_comments: number;
}

interface PolicyAnalysis {
  title: string;
  summary: string;
  key_points: string[];
  executive_highlights: string[];
  section_summaries: { title: string; summary: string }[];
  policy_implications: {
    impact_areas?: { area: string; relevance: number }[];
    complexity_level?: string;
    requirement_count?: number;
    estimated_reading_time?: string;
  };
  structure: string;
  sentiment: {
    label: string;
    score: number;
  };
}

const PolicyDashboard: React.FC = () => {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [policyAnalysis, setPolicyAnalysis] = useState<PolicyAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'policies' | 'upload'>('policies');

  // Mock data for demonstration
  const mockPolicies: Policy[] = [
    {
      id: 1,
      title: "Urban Green Spaces Development Initiative",
      category: "Environment",
      ai_summary: "• Proposes creation of 15 new public parks across the city over next 3 years\n• Allocates $50M budget for land acquisition and development\n• Establishes community involvement programs for park design and maintenance",
      status: "active",
      created_at: "2025-10-25T00:00:00Z"
    },
    {
      id: 2,
      title: "Digital Infrastructure Modernization Plan",
      category: "Technology",
      ai_summary: "• Upgrades city-wide fiber optic network to support 5G technology\n• Implements smart city sensors for traffic, air quality, and energy monitoring\n• Provides free public Wi-Fi in all municipal buildings and parks",
      status: "active",
      created_at: "2025-10-20T00:00:00Z"
    },
    {
      id: 3,
      title: "Affordable Housing Development Strategy",
      category: "Housing",
      ai_summary: "• Mandates 20% affordable housing units in new residential developments\n• Creates $100M housing assistance fund for first-time homebuyers\n• Establishes rent stabilization measures for existing tenants",
      status: "active",
      created_at: "2025-10-15T00:00:00Z"
    }
  ];

  const mockSentimentData: { [key: number]: SentimentData } = {
    1: { positive_score: 0.65, negative_score: 0.20, neutral_score: 0.15, total_comments: 127 },
    2: { positive_score: 0.45, negative_score: 0.35, neutral_score: 0.20, total_comments: 89 },
    3: { positive_score: 0.55, negative_score: 0.30, neutral_score: 0.15, total_comments: 203 }
  };

  const handlePolicyClick = (policy: Policy) => {
    setSelectedPolicy(policy);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedPolicy) return;

    setIsSubmittingComment(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate sentiment analysis result
      alert(`Comment analyzed! Sentiment: ${Math.random() > 0.5 ? 'Positive' : 'Negative'}`);
      setNewComment('');
    } catch (error) {
      alert('Failed to submit comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getSentimentChartData = (sentiment: SentimentData) => [
    { name: 'Positive', value: Math.round(sentiment.positive_score * 100), color: '#6f9f88' },
    { name: 'Negative', value: Math.round(sentiment.negative_score * 100), color: '#b78383' },
    { name: 'Neutral', value: Math.round(sentiment.neutral_score * 100), color: '#8a8f9f' }
  ];

  const getOverallSentimentData = () => {
    return mockPolicies.map(policy => ({
      name: policy.title.slice(0, 20) + '...',
      positive: Math.round(mockSentimentData[policy.id].positive_score * 100),
      negative: Math.round(mockSentimentData[policy.id].negative_score * 100),
      neutral: Math.round(mockSentimentData[policy.id].neutral_score * 100),
      comments: mockSentimentData[policy.id].total_comments
    }));
  };

  const getDominantSentiment = (sentiment: SentimentData) => {
    const scores = {
      positive: sentiment.positive_score,
      negative: sentiment.negative_score,
      neutral: sentiment.neutral_score
    };
    
    return Object.keys(scores).reduce((a, b) => scores[a as keyof typeof scores] > scores[b as keyof typeof scores] ? a : b);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-800 bg-green-100 border border-green-300';
      case 'negative': return 'text-red-800 bg-red-100 border border-red-300';
      default: return 'text-slate-700 bg-slate-100 border border-slate-300';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setPolicyAnalysis(null);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handlePDFAnalysis = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setPolicyAnalysis(null);
    
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      let response: Response;
      try {
        response = await fetch(`${apiUrl}/api/v1/policy/summarize`, {
          method: 'POST',
          body: formData,
        });
      } catch (networkError: any) {
        throw new Error(
          `Cannot reach the backend server at ${apiUrl}. ` +
          `Please make sure the backend is running. (${networkError.message})`
        );
      }

      if (!response.ok) {
        let detail = `Server error ${response.status}`;
        try {
          const errorData = await response.json();
          detail = errorData.detail || detail;
        } catch {}
        throw new Error(detail);
      }

      const result = await response.json();
      
      // Transform API response to match PolicyAnalysis interface
      setPolicyAnalysis({
        title: result.filename || 'Policy Document',
        summary: result.summary || 'No summary available',
        key_points: result.key_points || [],
        executive_highlights: result.executive_highlights || [],
        section_summaries: result.section_summaries || [],
        policy_implications: result.policy_implications || {},
        structure: `${result.metadata?.total_pages || 0} pages, ${result.metadata?.word_count || 0} words, Method: ${result.metadata?.processing_method || 'extractive'}`,
        sentiment: {
          label: 'Neutral',
          score: 0.5
        }
      });
    } catch (error: any) {
      console.error('Error analyzing PDF:', error);
      alert(error.message || 'An error occurred while analyzing the PDF. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearUpload = () => {
    setSelectedFile(null);
    setPolicyAnalysis(null);
  };

  return (
    <>
      {ENABLE_NEWSPAPER_BORDERS && <NewspaperBorders />}
      <div className={`newspaper-bg enhanced-typography policy-container ${ENABLE_NEWSPAPER_BORDERS ? 'pt-10 pb-10 pl-8 pr-8' : ''}`}>
        <div className="max-w-[1400px] mx-auto px-6">
        <div className="policy-header">
          <div className="border-t-4 border-b-4 border-black py-4 mx-4">
            <h1 className="bold-title policy-title">
              THE POLICY HERALD
            </h1>
            <div className="italic-content flex justify-center items-center space-x-8 text-sm font-semibold text-black">
              <span>POLICY ANALYSIS BUREAU</span>
              <span className="border-l border-r border-black px-4">AI-POWERED INSIGHTS</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="italic-content policy-subtitle">
              "Your Digital Policy Navigator - AI-Enhanced Public Sentiment Analysis"
            </p>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center mt-6">
          <div className="flex border-2 border-black p-1 bg-white">
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-6 py-2 font-black uppercase tracking-wide text-sm transition-colors ${
                activeTab === 'policies'
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              📋 Active Policies
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2 font-black uppercase tracking-wide text-sm transition-colors ${
                activeTab === 'upload'
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              📄 Upload PDF Policy
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'policies' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Policy List */}
          <div className="lg:col-span-1">
            <div className="newspaper-section">
              <div className="bg-black text-white px-4 py-2">
                <h2 className="bold-title text-sm font-black uppercase tracking-widest">Active Policies</h2>
              </div>
              <div className="space-y-0 divide-y divide-gray-300">
              {mockPolicies.map((policy) => {
                const sentiment = mockSentimentData[policy.id];
                const dominantSentiment = getDominantSentiment(sentiment);
                
                return (
                  <div
                    key={policy.id}
                    onClick={() => handlePolicyClick(policy)}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedPolicy?.id === policy.id
                        ? 'bg-black text-white'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <h3 className={`bold-title font-black mb-2 line-clamp-2 text-sm ${selectedPolicy?.id === policy.id ? 'text-white' : 'text-black'}`} style={{fontFamily:'"Playfair Display",Georgia,serif'}}>
                      {policy.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`bold-title px-2 py-0.5 uppercase tracking-wide text-xs border ${
                        selectedPolicy?.id === policy.id ? 'border-white text-white' : 'border-black text-black'
                      }`}>
                        {policy.category}
                      </span>
                      <span className={`italic-content text-xs font-medium ${getSentimentColor(dominantSentiment)}`}>
                        {dominantSentiment.charAt(0).toUpperCase() + dominantSentiment.slice(1)}
                      </span>
                    </div>
                    <div className={`italic-content mt-2 text-xs ${selectedPolicy?.id === policy.id ? 'text-gray-300' : 'text-gray-500'}`}>
                      {sentiment.total_comments} public comments
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

          {/* Overall Sentiment Chart */}
          <div className="newspaper-section mt-6">
            <div className="bg-black text-white px-4 py-2 mb-4">
              <h3 className="bold-title text-sm font-black uppercase tracking-widest">Policy Sentiment Overview</h3>
            </div>
            <div className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getOverallSentimentData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4c1a0" />
                <XAxis dataKey="name" fontSize={12} stroke="#5c4234" />
                <YAxis stroke="#5c4234" />
                <Tooltip />
                <Bar dataKey="positive" fill="#6f9f88" name="Positive %" />
                <Bar dataKey="negative" fill="#b78383" name="Negative %" />
                <Bar dataKey="neutral" fill="#8a8f9f" name="Neutral %" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Policy Details */}
        <div className="lg:col-span-2">
          {selectedPolicy ? (
            <div className="space-y-6">
              {/* Policy Header */}
              <div className="newspaper-section">
                <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
                  <h2 className="bold-title font-black uppercase tracking-wide text-base" style={{fontFamily:'"Playfair Display",Georgia,serif'}}>{selectedPolicy.title}</h2>
                  <div className="italic-content text-xs text-gray-300 ml-4 shrink-0">
                    {new Date(selectedPolicy.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bold-title px-2 py-0.5 bg-black text-white text-xs uppercase tracking-wide">
                      {selectedPolicy.category}
                    </span>
                    <span className="italic-content text-xs border border-green-700 text-green-800 px-2 py-0.5">
                      {selectedPolicy.status.charAt(0).toUpperCase() + selectedPolicy.status.slice(1)}
                    </span>
                  </div>

                  {/* AI Summary */}
                  <div className="border-l-4 border-black pl-4 py-2">
                    <div className="flex items-center mb-2">
                      <span className="text-xl mr-2">🤖</span>
                      <h3 className="bold-title font-black text-black uppercase text-xs tracking-widest">AI-Generated Summary</h3>
                    </div>
                    <div className="italic-content text-gray-800 whitespace-pre-line leading-relaxed" style={{fontFamily:'Georgia,serif'}}>
                      {selectedPolicy.ai_summary}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sentiment Chart */}
                <div className="newspaper-section">
                  <div className="bg-black text-white px-4 py-2 mb-0">
                    <h3 className="bold-title text-xs font-black uppercase tracking-widest">Public Sentiment</h3>
                  </div>
                  <div className="p-4">
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getSentimentChartData(mockSentimentData[selectedPolicy.id])}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={(entry) => `${entry.name}: ${entry.value}%`}
                        >
                          {getSentimentChartData(mockSentimentData[selectedPolicy.id]).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  </div>
                </div>

                {/* Sentiment Stats */}
                <div className="newspaper-section">
                  <div className="bg-black text-white px-4 py-2 mb-0">
                    <h3 className="bold-title text-xs font-black uppercase tracking-widest">Sentiment Statistics</h3>
                  </div>
                  <div className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="italic-content text-secondary-700">Total Comments</span>
                      <span className="font-semibold text-secondary-900">
                        {mockSentimentData[selectedPolicy.id].total_comments}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="italic-content text-green-700">Positive</span>
                        <span className="font-semibold text-green-700">
                          {Math.round(mockSentimentData[selectedPolicy.id].positive_score * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ backgroundColor: '#6f9f88', width: `${mockSentimentData[selectedPolicy.id].positive_score * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="italic-content text-red-700">Negative</span>
                        <span className="font-semibold text-red-700">
                          {Math.round(mockSentimentData[selectedPolicy.id].negative_score * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ backgroundColor: '#b78383', width: `${mockSentimentData[selectedPolicy.id].negative_score * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="italic-content text-gray-700">Neutral</span>
                        <span className="font-semibold text-gray-700">
                          {Math.round(mockSentimentData[selectedPolicy.id].neutral_score * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ backgroundColor: '#8a8f9f', width: `${mockSentimentData[selectedPolicy.id].neutral_score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

              {/* Add Comment */}
              <div className="newspaper-section">
                <div className="bg-black text-white px-4 py-2">
                  <h3 className="bold-title text-xs font-black uppercase tracking-widest">Add Your Comment</h3>
                </div>
                <div className="p-4 space-y-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts on this policy. Our AI will analyze the sentiment of your comment in real-time."
                    className="input-field resize-none"
                    rows={4}
                  />
                  <div className="flex justify-between items-center">
                    <div className="italic-content text-sm text-secondary-600">
                      💡 Your comment will be analyzed for sentiment using multilingual AI
                    </div>
                    <button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="btn-primary"
                    >
                      {isSubmittingComment ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </span>
                      ) : (
                        'Submit Comment'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="newspaper-section text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="bold-title text-xl font-black text-black mb-2" style={{fontFamily:'"Playfair Display",Georgia,serif'}}>Select a Policy</h3>
              <p className="italic-content text-gray-600 mb-6">
                Choose a policy from the left panel to view AI summaries and sentiment analysis
              </p>
              
              <div className="border-2 border-black p-6 max-w-md mx-auto">
                <h4 className="bold-title font-black text-black mb-3 uppercase text-sm tracking-wide">AI Features Available</h4>
                <ul className="italic-content text-sm text-gray-700 space-y-2 text-left" style={{fontFamily:'Georgia,serif'}}>
                  <li>• Automated policy summarization using BART</li>
                  <li>• Multilingual sentiment analysis with XLM-R</li>
                  <li>• Real-time public opinion monitoring</li>
                  <li>• Interactive sentiment visualization</li>
                  <li>• Comment analysis and classification</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
        /* PDF Upload Section */
        <div className="max-w-4xl mx-auto">
          <div className="newspaper-section mb-8">
            <div className="bg-black text-white px-4 py-2 text-center">
              <h2 className="bold-title text-sm font-black uppercase tracking-widest">📄 PDF Policy Analysis</h2>
            </div>
            <div className="p-6">
            
            {!selectedFile ? (
              <div className="text-center py-12 border-2 border-dashed border-black">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="bold-title text-xl font-black text-black mb-4" style={{fontFamily:'"Playfair Display",Georgia,serif'}}>Upload Policy PDF</h3>
                <p className="italic-content text-gray-600 mb-6 max-w-md mx-auto" style={{fontFamily:'Georgia,serif'}}>
                  Upload a PDF policy document to get AI-powered analysis including summaries, 
                  key points extraction, and sentiment evaluation.
                </p>
                
                <div className="space-y-4">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="inline-block btn-primary cursor-pointer"
                  >
                    📤 Select PDF File
                  </label>
                  
                  <div className="italic-content text-sm text-gray-500">
                    Maximum file size: 10MB • Supported format: PDF
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* File Info */}
                <div className="newspaper-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">📄</div>
                      <div>
                        <div className="bold-title font-black text-black text-sm" style={{fontFamily:'Georgia,serif'}}>{selectedFile.name}</div>
                        <div className="italic-content text-gray-600 text-xs">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePDFAnalysis}
                        disabled={isAnalyzing}
                        className="btn-primary"
                      >
                        {isAnalyzing ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                          </span>
                        ) : (
                          '🤖 Analyze with AI'
                        )}
                      </button>
                      <button
                        onClick={clearUpload}
                        className="px-4 py-2 text-black border-2 border-black font-black uppercase text-xs tracking-wide hover:bg-black hover:text-white transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Analysis Results */}
                {policyAnalysis && (
                  <div className="space-y-6">
                    {/* Title and Summary */}
                    <div className="newspaper-section">
                      <div className="bg-black text-white px-4 py-2">
                        <h3 className="bold-title font-black uppercase tracking-widest text-sm" style={{fontFamily:'"Playfair Display",Georgia,serif'}}>{policyAnalysis.title || 'Policy Document Analysis'}</h3>
                      </div>
                      <div className="p-4 mb-2">
                      <div className="border-l-4 border-black pl-4 py-2 mb-6">
                        <div className="flex items-start">
                          <span className="text-2xl mr-3">🤖</span>
                          <div>
                            <h4 className="bold-title font-black text-black uppercase text-xs tracking-widest mb-2">AI-Generated Summary</h4>
                            <p className="italic-content text-gray-800 leading-relaxed" style={{fontFamily:'Georgia,serif'}}>{policyAnalysis.summary}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sentiment Analysis */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="border-2 border-black p-4">
                          <h4 className="bold-title font-black text-black uppercase text-xs tracking-widest mb-3">📊 Sentiment Analysis</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-secondary-700">Overall Sentiment:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              policyAnalysis.sentiment.label.toLowerCase() === 'positive' 
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : policyAnalysis.sentiment.label.toLowerCase() === 'negative'
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}>
                              {policyAnalysis.sentiment.label} ({(policyAnalysis.sentiment.score * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        <div className="border-2 border-black p-4">
                          <h4 className="bold-title font-black text-black uppercase text-xs tracking-widest mb-3">📋 Document Structure</h4>
                          <p className="italic-content text-gray-800 text-sm" style={{fontFamily:'Georgia,serif'}}>{policyAnalysis.structure}</p>
                        </div>
                      </div>

                      {/* Key Points */}
                      <div className="border-l-4 border-black pl-4 py-2 mt-2">
                        <h4 className="bold-title font-black text-black uppercase text-xs tracking-widest mb-3">🎯 Key Points Extracted ({policyAnalysis.key_points.length})</h4>
                        <ul className="space-y-2">
                          {policyAnalysis.key_points.map((point, index) => (
                            <li key={index} className="flex items-start">
                              <span className="bold-title text-black mr-2 font-black text-sm">{index + 1}.</span>
                              <span className="italic-content text-gray-800 text-sm" style={{fontFamily:'Georgia,serif'}}>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Executive Highlights */}
                      {policyAnalysis.executive_highlights && policyAnalysis.executive_highlights.length > 0 && (
                        <div className="border-l-4 border-gray-500 pl-4 py-2 mt-2">
                          <h4 className="bold-title font-black text-black uppercase text-xs tracking-widest mb-3">⚡ Executive Highlights</h4>
                          <ul className="space-y-2">
                            {policyAnalysis.executive_highlights.map((highlight, index) => (
                              <li key={index} className="flex items-start">
                                <span className="bold-title text-black mr-2">▸</span>
                                <span className="italic-content text-gray-800 text-sm" style={{fontFamily:'Georgia,serif'}}>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Section Summaries */}
                      {policyAnalysis.section_summaries && policyAnalysis.section_summaries.length > 0 && (
                        <div className="border-2 border-black p-4 mt-2">
                          <h4 className="bold-title font-black text-black uppercase text-xs tracking-widest mb-4">📖 Section-by-Section Analysis</h4>
                          <div className="space-y-3 divide-y divide-gray-300">
                            {policyAnalysis.section_summaries.map((section, index) => (
                              <div key={index} className="border-l-4 border-black pl-3 pt-2">
                                <h5 className="bold-title font-black text-black text-sm mb-1" style={{fontFamily:'"Playfair Display",Georgia,serif'}}>{section.title}</h5>
                                <p className="italic-content text-gray-700 text-sm" style={{fontFamily:'Georgia,serif'}}>{section.summary}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Policy Implications */}
                      {policyAnalysis.policy_implications && (
                        <div className="border-2 border-black p-4 mt-2">
                          <h4 className="bold-title font-black text-black uppercase text-xs tracking-widest mb-4">📊 Policy Impact Analysis</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 mb-4 border-2 border-black">
                            <div className="p-3 text-center border-r border-b border-black">
                              <div className="bold-title text-xs text-black uppercase font-black">Complexity</div>
                              <div className="italic-content text-base font-black text-black" style={{fontFamily:'Georgia,serif'}}>{policyAnalysis.policy_implications.complexity_level || 'N/A'}</div>
                            </div>
                            <div className="p-3 text-center border-r border-b border-black">
                              <div className="bold-title text-xs text-black uppercase font-black">Requirements</div>
                              <div className="italic-content text-base font-black text-black" style={{fontFamily:'Georgia,serif'}}>{policyAnalysis.policy_implications.requirement_count ?? 'N/A'}</div>
                            </div>
                            <div className="p-3 text-center border-r border-b border-black">
                              <div className="bold-title text-xs text-black uppercase font-black">Reading Time</div>
                              <div className="italic-content text-base font-black text-black" style={{fontFamily:'Georgia,serif'}}>{policyAnalysis.policy_implications.estimated_reading_time || 'N/A'}</div>
                            </div>
                            <div className="p-3 text-center border-b border-black">
                              <div className="bold-title text-xs text-black uppercase font-black">Impact Areas</div>
                              <div className="italic-content text-base font-black text-black" style={{fontFamily:'Georgia,serif'}}>{policyAnalysis.policy_implications.impact_areas?.length || 0}</div>
                            </div>
                          </div>
                          {policyAnalysis.policy_implications.impact_areas && policyAnalysis.policy_implications.impact_areas.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-secondary-800">Impact Areas:</h5>
                              {policyAnalysis.policy_implications.impact_areas.map((area, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span className="text-secondary-700 text-sm">{area.area}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 h-2">
                                      <div className="bg-black h-2" style={{ width: `${area.relevance * 100}%` }}></div>
                                    </div>
                                    <span className="text-xs text-secondary-600 w-10 text-right">{Math.round(area.relevance * 100)}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          {/* PDF Analysis Features */}
          <div className="newspaper-section mt-6">
            <div className="bg-black text-white px-4 py-2 text-center">
              <h2 className="bold-title font-black uppercase tracking-widest text-sm">🤖 AI-Powered PDF Analysis</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black">
              <div className="p-6 text-center">
                <div className="text-3xl mb-2">📄</div>
                <h3 className="bold-title font-black text-black uppercase text-xs tracking-wide mb-2">Text Extraction</h3>
                <p className="italic-content text-gray-700 text-sm" style={{fontFamily:'Georgia,serif'}}>
                  Advanced PDF parsing with PyPDF2 and pdfplumber for comprehensive text extraction
                </p>
              </div>
              <div className="p-6 text-center">
                <div className="text-3xl mb-2">📝</div>
                <h3 className="bold-title font-black text-black uppercase text-xs tracking-wide mb-2">BART Summarization</h3>
                <p className="italic-content text-gray-700 text-sm" style={{fontFamily:'Georgia,serif'}}>
                  Generates concise summaries and extracts key policy points automatically
                </p>
              </div>
              <div className="p-6 text-center">
                <div className="text-3xl mb-2">😊</div>
                <h3 className="bold-title font-black text-black uppercase text-xs tracking-wide mb-2">Sentiment Analysis</h3>
                <p className="italic-content text-gray-700 text-sm" style={{fontFamily:'Georgia,serif'}}>
                  RoBERTa-based sentiment evaluation to understand policy tone and implications
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technology Information */}
      <div className="newspaper-section mt-8">
        <div className="bg-black text-white px-4 py-2 text-center">
          <h2 className="bold-title font-black uppercase tracking-widest text-sm">Advanced NLP Technology</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black">
          <div className="p-6 text-center">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="bold-title font-black text-black uppercase text-xs tracking-wide mb-2">BART Summarization</h3>
            <p className="italic-content text-gray-700 text-sm" style={{fontFamily:'Georgia,serif'}}>
              Automatically generates concise 3-point summaries from complex policy documents
            </p>
          </div>
          <div className="p-6 text-center">
            <div className="text-3xl mb-2">🌍</div>
            <h3 className="bold-title font-black text-black uppercase text-xs tracking-wide mb-2">Multilingual Sentiment</h3>
            <p className="italic-content text-gray-700 text-sm" style={{fontFamily:'Georgia,serif'}}>
              XLM-RoBERTa model analyzes sentiment across multiple languages and dialects
            </p>
          </div>
          <div className="p-6 text-center">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="bold-title font-black text-black uppercase text-xs tracking-wide mb-2">Real-time Analysis</h3>
            <p className="italic-content text-gray-700 text-sm" style={{fontFamily:'Georgia,serif'}}>
              Continuous monitoring and updating of public sentiment as new comments arrive
            </p>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default PolicyDashboard;
import React, { useState, useEffect } from "react";
import {
  Shield,
  Clock,
  Network,
  Image,
  Quote,
  Activity,
  AlertTriangle,
} from "lucide-react";
import EnhancedVerification from "../Verification/EnhancedVerification";
import NewspaperBorders from "../Layout/NewspaperBorders";
import { ENABLE_NEWSPAPER_BORDERS } from "../../utils/newspaperBorders";

interface NewsArticle {
  id: number;
  title: string;
  content: string;
  source: string;
  url: string;
  published_date: string;
  category: string;
  image_url?: string;
}

const AdvancedVerificationDashboard: React.FC = () => {
  const [recentNews, setRecentNews] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentNews();
  }, []);

  const fetchRecentNews = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/news/live-news?limit=50`
      );
      const data = await response.json();

      if (data.status === "success") {
        setRecentNews(data.articles || []);
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Clock,
      title: "Temporal Fact-Checking",
      description:
        "Tracks claims over time to detect contradictions and narrative shifts",
      color: "text-[#5c4234]",
      bg: "bg-[#e8dcc6]",
      borderColor: "border-[#a69570]",
    },
    {
      icon: Quote,
      title: "Source Citation Analysis",
      description:
        "Verifies quotes against official sources (PIB, PM India, RBI, WHO)",
      color: "text-[#5c4234]",
      bg: "bg-[#e8dcc6]",
      borderColor: "border-[#a69570]",
    },
    {
      icon: Image,
      title: "Image Verification",
      description:
        "Analyzes EXIF metadata and detects stock photos or manipulated images",
      color: "text-[#5c4234]",
      bg: "bg-[#e8dcc6]",
      borderColor: "border-[#a69570]",
    },
    {
      icon: Network,
      title: "Network Analysis",
      description:
        "Detects circular reporting and calculates source trust scores",
      color: "text-[#5c4234]",
      bg: "bg-[#e8dcc6]",
      borderColor: "border-[#a69570]",
    },
  ];

  return (
    <div className="min-h-screen newspaper-bg py-8">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-12">
        {/* Header */}
        <div className="mb-8 border-4 border-[#333] p-6" style={{ backgroundColor: "#e8dcc6" }}>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-10 h-10" style={{ color: "#5c4234" }} strokeWidth={2.5} />
            <h1
              className="text-3xl md:text-4xl font-black uppercase tracking-tight"
              style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#4a3728" }}
            >
              Advanced Verification System
            </h1>
          </div>
          <p
            className="text-base md:text-lg font-medium"
            style={{ fontFamily: "Georgia, serif", color: "#5c4234" }}
          >
            Industry-leading fact-checking powered by AI and official source
            verification
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`${feature.bg} p-6 border-4 ${feature.borderColor} hover:shadow-lg transition-shadow`}
              style={{ borderColor: "#a69570" }}
            >
              <feature.icon
                className={`w-8 h-8 mb-3 ${feature.color}`}
                strokeWidth={2.5}
              />
              <h3
                className={`font-black mb-2 uppercase text-sm ${feature.color}`}
                style={{ fontFamily: "Georgia, serif" }}
              >
                {feature.title}
              </h3>
              <p
                className={`text-sm ${feature.color}`}
                style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Banner */}
        <div className="border-4 p-6 mb-8" style={{ backgroundColor: "#e8dcc6", borderColor: "#a69570" }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div
                className="text-3xl font-black mb-1"
                style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#4a3728" }}
              >
                {recentNews.length}
              </div>
              <div
                className="uppercase text-xs font-bold"
                style={{ fontFamily: "Georgia, serif", color: "#5c4234" }}
              >
                Articles Available
              </div>
            </div>
            <div>
              <div
                className="text-3xl font-black mb-1"
                style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#4a3728" }}
              >
                7
              </div>
              <div
                className="uppercase text-xs font-bold"
                style={{ fontFamily: "Georgia, serif", color: "#5c4234" }}
              >
                Verification Methods
              </div>
            </div>
            <div>
              <div
                className="text-3xl font-black mb-1"
                style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#4a3728" }}
              >
                4
              </div>
              <div
                className="uppercase text-xs font-bold"
                style={{ fontFamily: "Georgia, serif", color: "#5c4234" }}
              >
                Official Sources
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Activity
                  className="w-5 h-5 animate-pulse"
                  style={{ color: "#6f9f88" }}
                  strokeWidth={2.5}
                />
                <span
                  className="font-black uppercase text-sm"
                  style={{ fontFamily: "Georgia, serif", color: "#6f9f88" }}
                >
                  System Active
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article List */}
          <div className="lg:col-span-1">
            <div className="border-4 p-6" style={{ backgroundColor: "#e8dcc6", borderColor: "#a69570" }}>
              <h2
                className="text-xl font-black mb-4 uppercase pb-2"
                style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#4a3728", borderBottom: "2px solid #5c4234" }}
              >
                Recent Articles
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#c0a882", borderTop: "4px solid #5c4234" }} />
                </div>
              ) : (
                <div className="space-y-3 max-h-[800px] overflow-y-auto">
                  {recentNews.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className={`p-4 border-2 cursor-pointer transition-all ${
                        selectedArticle?.id === article.id
                          ? "text-white"
                          : ""
                      }`}
                      style={selectedArticle?.id === article.id ? { backgroundColor: "#5c4234", borderColor: "#4a3728" } : { backgroundColor: "#f5f1e8", borderColor: "#a69570" }}
                    >
                      <h3
                        className="font-bold mb-2 line-clamp-2"
                        style={{
                          fontFamily: "Georgia, serif",
                          color: selectedArticle?.id === article.id ? "#ffffff" : "#4a3728"
                        }}
                      >
                        {article.title}
                      </h3>
                      <div className="space-y-1">
                        <p
                          className="text-xs font-bold"
                          style={{
                            color: selectedArticle?.id === article.id ? "#d4c1a0" : "#5c4234"
                          }}
                        >
                          <span>Source:</span> {article.source}
                        </p>
                        <p
                          className="text-xs"
                          style={{
                            color: selectedArticle?.id === article.id ? "#d4c1a0" : "#5c4234"
                          }}
                        >
                          <span className="font-bold">Category:</span>{" "}
                          <span
                            className="px-2 py-0.5 border font-bold uppercase text-xs"
                            style={{
                              borderColor: selectedArticle?.id === article.id ? "#f5f1e8" : "#a69570",
                              backgroundColor: selectedArticle?.id === article.id ? "#f5f1e8" : "#5c4234",
                              color: selectedArticle?.id === article.id ? "#4a3728" : "#f5f1e8"
                            }}
                          >
                            {article.category}
                          </span>
                        </p>
                        <p
                          className="text-xs"
                          style={{
                            color: selectedArticle?.id === article.id ? "#b19c8a" : "#5c4234"
                          }}
                        >
                          {new Date(
                            article.published_date
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {recentNews.length === 0 && (
                    <div className="text-center py-8">
                      <AlertTriangle
                        className="w-12 h-12 mx-auto mb-2"
                        style={{ color: "#5c4234" }}
                        strokeWidth={2.5}
                      />
                      <p
                        className="font-bold"
                        style={{ fontFamily: "Georgia, serif", color: "#5c4234" }}
                      >
                        No articles available
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Verification Panel */}
          <div className="lg:col-span-2">
            {selectedArticle ? (
              <EnhancedVerification
                articleUrl={selectedArticle.url}
                title={selectedArticle.title}
                content={selectedArticle.content}
                source={selectedArticle.source}
                imageUrl={selectedArticle.image_url}
                claims={[]}
              />
            ) : (
              <div className="border-4 p-12 text-center" style={{ backgroundColor: "#e8dcc6", borderColor: "#a69570" }}>
                <Shield
                  className="w-20 h-20 mx-auto mb-4"
                  style={{ color: "#5c4234" }}
                  strokeWidth={2.5}
                />
                <h3
                  className="text-xl font-black mb-2 uppercase"
                  style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#4a3728" }}
                >
                  Select an Article to Verify
                </h3>
                <p
                  className="font-medium"
                  style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#5c4234" }}
                >
                  Choose an article from the list to run advanced verification
                  analysis
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 border-4 p-6" style={{ backgroundColor: "#e8dcc6", borderColor: "#a69570" }}>
          <h2
            className="text-2xl font-black mb-4 uppercase pb-2"
            style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#4a3728", borderBottom: "2px solid #5c4234" }}
          >
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3
                className="font-black mb-2 flex items-center space-x-2 uppercase text-sm"
                style={{ fontFamily: "Georgia, serif", color: "#4a3728" }}
              >
                <Clock className="w-5 h-5" style={{ color: "#5c4234" }} strokeWidth={2.5} />
                <span>Temporal Tracking</span>
              </h3>
              <p
                className="text-sm"
                style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#5c4234" }}
              >
                We maintain a timeline of all claims made by each source. When a
                new article is analyzed, we check if the source has made
                contradictory statements in the past 30 days.
              </p>
            </div>

            <div>
              <h3
                className="font-black mb-2 flex items-center space-x-2 uppercase text-sm"
                style={{ fontFamily: "Georgia, serif", color: "#4a3728" }}
              >
                <Quote className="w-5 h-5" style={{ color: "#5c4234" }} strokeWidth={2.5} />
                <span>Official Source Verification</span>
              </h3>
              <p
                className="text-sm"
                style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#5c4234" }}
              >
                Quotes attributed to government officials are cross-referenced
                with official websites including PIB, PM India, RBI, WHO, and
                Parliament records.
              </p>
            </div>

            <div>
              <h3
                className="font-black mb-2 flex items-center space-x-2 uppercase text-sm"
                style={{ fontFamily: "Georgia, serif", color: "#4a3728" }}
              >
                <Image className="w-5 h-5" style={{ color: "#5c4234" }} strokeWidth={2.5} />
                <span>Image Analysis</span>
              </h3>
              <p
                className="text-sm"
                style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#5c4234" }}
              >
                Images are analyzed for EXIF metadata, stock photo detection,
                and potential manipulation. Future-dated images or missing
                metadata trigger warnings.
              </p>
            </div>

            <div>
              <h3
                className="font-black mb-2 flex items-center space-x-2 uppercase text-sm"
                style={{ fontFamily: "Georgia, serif", color: "#4a3728" }}
              >
                <Network className="w-5 h-5" style={{ color: "#5c4234" }} strokeWidth={2.5} />
                <span>Citation Network</span>
              </h3>
              <p
                className="text-sm"
                style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#5c4234" }}
              >
                We build a citation graph tracking which sources cite each
                other. Circular reporting (Source A cites B, B cites C, C cites
                A) is detected and penalized.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Newspaper Borders */}
      {ENABLE_NEWSPAPER_BORDERS && <NewspaperBorders />}
      {ENABLE_NEWSPAPER_BORDERS && <NewspaperBorders />}
    </div>
  );
};

export default AdvancedVerificationDashboard;

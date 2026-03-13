import React from "react";

const NewspaperBorders: React.FC = () => {
  return (
    <>
      {/* Top Scrolling News Border */}
      <div
        className="fixed top-0 left-0 right-0 h-6 sm:h-8 border-b border-black sm:border-b-2 z-30 overflow-hidden"
        style={{ backgroundColor: "#faf8f3" }}
      >
        <div className="animate-scroll-left text-black font-bold text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap py-1.5 sm:py-2 font-serif">
          🚨 BREAKING NEWS • LATEST UPDATES • VERIFIED REPORTS • POLICY ANALYSIS
          • MEDIA VERIFICATION • CIVIC INTELLIGENCE • AI-POWERED TRUTH •
          BREAKING NEWS • LATEST UPDATES • VERIFIED REPORTS • POLICY ANALYSIS •
          MEDIA VERIFICATION • CIVIC INTELLIGENCE • AI-POWERED TRUTH • BREAKING
          NEWS • LATEST UPDATES • VERIFIED REPORTS • POLICY ANALYSIS • MEDIA
          VERIFICATION • CIVIC INTELLIGENCE • AI-POWERED TRUTH •
        </div>
      </div>

      {/* Bottom Scrolling Brand Border */}
      <div
        className="fixed bottom-0 left-0 right-0 h-6 sm:h-8 border-t border-black sm:border-t-2 z-30 overflow-hidden"
        style={{ backgroundColor: "#faf8f3" }}
      >
        <div className="animate-scroll-right text-black font-bold text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap py-1.5 sm:py-2 font-serif">
          📰 INFOSPHERE HERALD • DIGITAL TRUTH VERIFICATION •
          NEWS INTEGRITY PLATFORM • INFOSPHERE HERALD •
          DIGITAL TRUTH VERIFICATION • NEWS INTEGRITY PLATFORM • INFOSPHERE
          HERALD • DIGITAL TRUTH VERIFICATION • NEWS
          INTEGRITY PLATFORM •
        </div>
      </div>

      {/* Left Vertical Border - Hidden on mobile and tablet */}
      <div
        className="hidden lg:block fixed top-8 bottom-8 left-0 w-6 border-r-2 border-black z-20 overflow-hidden pointer-events-none"
        style={{ backgroundColor: "#faf8f3" }}
      >
        <div className="vertical-text-left text-black font-bold text-xs uppercase tracking-wider font-serif">
          THE INFOSPHERE HERALD THE INFOSPHERE HERALD THE INFOSPHERE HERALD THE
          INFOSPHERE HERALD
        </div>
      </div>

      {/* Right Vertical Border - Hidden on mobile and tablet */}
      <div
        className="hidden lg:block fixed top-8 bottom-8 right-0 w-6 border-l-2 border-black z-20 overflow-hidden pointer-events-none"
        style={{ backgroundColor: "#faf8f3" }}
      >
        <div className="vertical-text-right text-black font-bold text-xs uppercase tracking-wider font-serif">
          DIGITAL NEWS INTEGRITY DIGITAL NEWS INTEGRITY DIGITAL NEWS INTEGRITY
          DIGITAL NEWS INTEGRITY
        </div>
      </div>
    </>
  );
};

export default NewspaperBorders;

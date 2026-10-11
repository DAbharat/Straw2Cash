import React from 'react';
import { useAuth } from '../lib/context/AuthContext';
import { TopNav } from '../components/layout/TopNav';
import { BlurRevealText } from '../components/ui/BlurRevealText';
import { CountUpNumber } from '../components/ui/CountUpNumber';
import {
  ArrowRight,
  Sparkles,
  Flame,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Plus,
  Scale,
  MapPin,
  Bot,
  Truck,
  Leaf,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { switchRole } = useAuth();

  // 4 Cinematic, high-resolution background images matching the agricultural/straw domain
  const heroBg =
    'https://framerusercontent.com/images/pcb5yTRmmPb3AD4e14mWz1oMukM.jpg?scale-down-to=2048&width=4096&height=2317';
  const aboutBg =
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop';
  const featuresBg =
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=2600&auto=format&fit=crop';
  const ctaBg =
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2600&auto=format&fit=crop';

  return (
    <div className="min-h-screen bg-[#0D1810] text-white selection:bg-[#E5A812]/20 selection:text-[#E5A812]">
      {/* =========================================================================
          SECTION 1: HERO / INTRODUCTION (~100vh)
          ========================================================================= */}
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden">
        {/* Full-width, cinematic background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Organic farming tractor operating in expansive agricultural landscape"
            className="w-full h-full object-cover object-[70%_center] sm:object-center transform scale-100 transition-transform duration-1000 ease-out"
            referrerPolicy="no-referrer"
          />
          {/* Dark gradient overlay, stronger on text side for maximum contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/65 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1810] via-transparent to-black/30" />
        </div>

        {/* Website logo and navigation placed naturally at top over background */}
        <TopNav currentPath="/" onNavigate={onNavigate} />

        {/* Hero Content Left-Aligned with Oversized Typography */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 w-full flex-1 flex items-center">
          <div className="max-w-3xl lg:max-w-4xl xl:max-w-5xl text-left">
            {/* Golden Outlined Pill Badge with Blur Typing Reveal */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 border border-[#E5A812] px-6 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide text-[#E5A812] bg-[#0D1810]/40 backdrop-blur-xs">
                <BlurRevealText
                  as="span"
                  text="We are Producing Natural Products"
                  mode="word"
                  delay={50}
                  staggerDelay={40}
                  triggerOnScroll={false}
                  initialBlurVisible={true}
                />
              </span>
            </div>

            {/* Giant Display Headline with Blur & Character Typing Effect */}
            <div className="mb-6 drop-shadow-sm max-w-full">
              <BlurRevealText
                as="h1"
                text="Organic Farming"
                mode="char"
                delay={150}
                staggerDelay={35}
                showCursor={false}
                triggerOnScroll={false}
                initialBlurVisible={true}
                className="text-3xl min-[400px]:text-4xl sm:text-5xl md:text-6xl lg:text-[4.75rem] xl:text-[5.5rem] font-bold text-white tracking-tight leading-[1.08] block font-sans"
              />
              <BlurRevealText
                as="h1"
                text="and Agriculture"
                mode="char"
                delay={680}
                staggerDelay={35}
                showCursor={true}
                triggerOnScroll={false}
                initialBlurVisible={true}
                className="text-3xl min-[400px]:text-4xl sm:text-5xl md:text-6xl lg:text-[4.75rem] xl:text-[5.5rem] font-bold text-white tracking-tight leading-[1.08] block font-sans"
              />
            </div>

            {/* Description Subtitle with Blur Dissolve into Sharp Clarity */}
            <BlurRevealText
              as="p"
              text="Straw2Cash aims to make agricultural straw easier to estimate, list, discover, and trade."
              mode="word" 
              delay={1300}
              staggerDelay={50}
              triggerOnScroll={false}
              initialBlurVisible={true}
              className="text-white/85 text-sm sm:text-lg leading-relaxed mb-8 sm:mb-10 font-normal max-w-xl block"
            />

            {/* Prominent CTAs with Golden Arrow Circles */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
              <button
                onClick={() => {
                  switchRole('farmer');
                  onNavigate('/farmer/residue-calculator');
                }}
                className="w-full sm:w-auto bg-[#2E581F] hover:bg-[#244818] text-white px-6 sm:px-7 py-3.5 sm:py-4 rounded-full font-bold text-xs sm:text-base inline-flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-102 cursor-pointer border border-white/10"
              >
                <span>Discover More</span>
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-black text-xs shrink-0">
                  →
                </span>
              </button>

              <button
                onClick={() => {
                  switchRole('buyer');
                  onNavigate('/buyer/marketplace');
                }}
                className="w-full sm:w-auto border border-[#E5A812] hover:bg-black/15 text-white px-6 sm:px-7 py-3.5 sm:py-4 rounded-full font-bold text-xs sm:text-base inline-flex items-center justify-center gap-3 transition-all cursor-pointer bg-transparent "
              >
                <span className="text-[#E5A812]">See All Service</span>
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-black text-xs shrink-0">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Right Floating Badge & Quick Button */}
        <div className="relative z-20 pb-8 pr-8 hidden sm:flex justify-end items-center gap-3">
          <button
            onClick={() => onNavigate('/farmer/listings/new')}
            className="px-6 py-2.5 rounded-full bg-transparent border border-white/50 text-white flex items-center justify-center font-bold shadow-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Create quick listing"
          >
            <span>Create Listing</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: ABOUT / CORE VALUE (~100vh)
          ========================================================================= */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden py-20 lg:py-28 border-t border-white/10">
        {/* Full-bleed background image with subtle warm sunrise over golden wheat field */}
        <div className="absolute inset-0 z-0">
          <img
            src={aboutBg}
            alt="Golden sunrise over vast agricultural wheat fields"
            className="w-full h-full object-cover object-center filter brightness-[0.85]"
            referrerPolicy="no-referrer"
          />
          {/* Smooth edge transitions fading into deep dark tones */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1810] via-black/80 to-[#0D1810]" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/50 to-black/90" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Elegant Split Composition: Heading & small label on left, descriptive content on right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Heading and section label */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 border border-[#E5A812] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-[#E5A812] bg-black/40 backdrop-blur-xs">
                <span>02 / About Our Mission</span>
              </div>

              <BlurRevealText
                as="h2"
                text="Turning Stubble Burning Into Rural Prosperity"
                mode="word"
                triggerOnScroll={true}
                initialBlurVisible={true}
                delay={50}
                staggerDelay={40}
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight block"
              />

              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                Every autumn, millions of tons of paddy straw across North India are incinerated due to narrow 15-day harvest windows. Straw2Cash bridges the gap between progressive farmers, industrial bio-energy offtakers, and mechanized balers.
              </p>

              {/* Three Pillars Summary Pills */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 bg-transparent backdrop-blur-sm border border-white/10 p-3 rounded-xl hover:border-[#E5A812]/40 transition-all">
                  <div className="w-8 h-8 rounded-full bg-[#E5A812]/20 text-[#E5A812] flex items-center justify-center font-bold text-xs shrink-0">
                    01
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Farmers Earn ₹1,400–₹1,850/t</h4>
                    <p className="text-[11px] text-white/60">Direct bank escrow payouts, zero burning penalties</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-transparent backdrop-blur-sm border border-white/10 p-3 rounded-xl hover:border-[#68BA75]/40 transition-all">
                  <div className="w-8 h-8 rounded-full bg-[#68BA75]/20 text-[#68BA75] flex items-center justify-center font-bold text-xs shrink-0">
                    02
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Continuous Industrial Feedstock</h4>
                    <p className="text-[11px] text-white/60">Standardized moisture & weighbridge verified deliveries</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-transparent backdrop-blur-sm border border-white/10 p-3 rounded-xl hover:border-[#E5A812]/40 transition-all">
                  <div className="w-8 h-8 rounded-full bg-[#E5A812]/20 text-[#E5A812] flex items-center justify-center font-bold text-xs shrink-0">
                    03
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Guaranteed Baler Fleet Dispatch</h4>
                    <p className="text-[11px] text-white/60">Geo-optimized 50km radius matching within 48 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Quantitative Impact Metrics & Overview Card */}
            <div className="lg:col-span-7">
              <div className="bg-transparent backdrop-blur-md border border-white/15 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2">
                    <span>Verified Ecosystem Impact</span>
                    <span className="text-xs font-mono text-[#E5A812] bg-[#E5A812]/15 px-3 py-1 rounded-full border border-[#E5A812]/30 w-fit">
                      Season 2025–26
                    </span>
                  </h3>
                  <p className="text-xs text-white/70 mt-1">
                    Continuous environmental and financial tracking verified via CAQM telemetrics
                  </p>
                </div>

                {/* 4 Quantitative Impact Counters with CountUpNumber */}
                <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3 sm:gap-6">
                  <div className="bg-transparent border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-[#E5A812]/40 transition-all">
                    <p className="text-xl min-[440px]:text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#E5A812]">
                      <CountUpNumber value={142850} duration={2200} suffix=" t" />
                    </p>
                    <p className="text-[11px] font-medium text-white/70 mt-1 uppercase tracking-wider">
                      Paddy Straw Diverted
                    </p>
                    <p className="text-[10px] text-[#68BA75] mt-1 font-semibold">100% Recycled Biomass</p>
                  </div>

                  <div className="bg-transparent border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-[#E5A812]/40 transition-all">
                    <p className="text-xl min-[440px]:text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
                      <CountUpNumber value={29.85} duration={2000} prefix="₹" suffix=" Cr" decimals={2} />
                    </p>
                    <p className="text-[11px] font-medium text-white/70 mt-1 uppercase tracking-wider">
                      Farmer Income Disbursed
                    </p>
                    <p className="text-[10px] text-[#E5A812] mt-1 font-semibold">Direct Escrow Transfers</p>
                  </div>

                  <div className="bg-transparent border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-[#E5A812]/40 transition-all">
                    <p className="text-xl min-[440px]:text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#E5A812]">
                      <CountUpNumber value={4890} duration={2400} suffix="+" />
                    </p>
                    <p className="text-[11px] font-medium text-white/70 mt-1 uppercase tracking-wider">
                      Farm Fires Prevented
                    </p>
                    <p className="text-[10px] text-[#68BA75] mt-1 font-semibold">Verified by Satellite</p>
                  </div>

                  <div className="bg-transparent border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-[#E5A812]/40 transition-all">
                    <p className="text-xl min-[440px]:text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#68BA75]">
                      <CountUpNumber value={214275} duration={2300} suffix=" t" />
                    </p>
                    <p className="text-[11px] font-medium text-white/70 mt-1 uppercase tracking-wider">
                      CO₂ Emissions Avoided
                    </p>
                    <p className="text-[10px] text-white/60 mt-1">Equiv. to 46,000 vehicles</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10">
                  <p className="text-xs text-white/60 max-w-sm">
                    Read the complete environmental calculation methodology or check historical district reports.
                  </p>
                  <button
                    onClick={() => onNavigate('/impact')}
                    className="inline-flex items-center justify-center gap-2 bg-[#2E581F] hover:bg-[#244818] text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-md w-full sm:w-auto"
                  >
                    <span>View Live Impact Ledger</span>
                    <span className="w-4 h-4 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-[10px]">
                      →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: MAIN FEATURES / SERVICES / PROJECTS (~100vh)
          ========================================================================= */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden py-20 lg:py-28 border-t border-white/10">
        {/* Relevant background image showcasing straw bales in golden landscape */}
        <div className="absolute inset-0 z-0">
          <img
            src={featuresBg}
            alt="Rows of golden straw bales across expansive agricultural fields"
            className="w-full h-full object-cover object-center filter brightness-[0.75]"
            referrerPolicy="no-referrer"
          />
          {/* Dark gradients and transparent overlays for content readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1810] via-black/85 to-[#0D1810]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12">
          {/* Section Header */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-[#E5A812] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-[#E5A812] bg-black/40 backdrop-blur-xs mb-4">
              <span>03 / Core Capabilities & Services</span>
            </div>
            <BlurRevealText
              as="h2"
              text="Four Integrated Systems for North India's Biomass Supply Chain"
              mode="word"
              triggerOnScroll={true}
              initialBlurVisible={true}
              delay={50}
              staggerDelay={40}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight block"
            />
            <p className="mt-4 text-white/80 text-sm sm:text-base leading-relaxed">
              Designed from the ground up for the unique realities of the Kharif harvest: fast turnarounds, reliable contracts, and verifiable weight tickets.
            </p>
          </div>

          {/* 4 Feature Cards in an Elegant Translucent Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Residue Yield Estimator */}
            <div className="bg-transparent backdrop-blur-md border border-white/15 rounded-3xl p-6 flex flex-col justify-between hover:border-[#E5A812]/50 hover:bg-white/5 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E5A812]/15 border border-[#E5A812]/30 flex items-center justify-center text-[#E5A812] mb-5 group-hover:scale-105 transition-transform">
                  <Leaf className="w-6 h-6" />
                </div>
                <span className="font-mono text-[11px] font-bold text-[#E5A812]">01. Estimation</span>
                <h3 className="text-lg font-bold text-white mt-1 group-hover:text-[#E5A812] transition-colors">
                  AI Residue Yield Calculator
                </h3>
                <p className="text-xs text-white/70 mt-2.5 leading-relaxed">
                  Predict harvest residue tonnage from GPS coordinates, crop variety, and cutter bar height before harvesting begins.
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 text-[11px] text-white/80 space-y-1.5">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E5A812]" />
                    <span>Basmati & Non-Basmati Models</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E5A812]" />
                    <span>Instant Market Valuation</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  switchRole('farmer');
                  onNavigate('/farmer/residue-calculator');
                }}
                className="mt-6 w-full py-2.5 px-4 bg-white/10 hover:bg-[#2E581F] text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10"
              >
                <span>Launch Calculator</span>
                <span className="text-[#E5A812] font-black">→</span>
              </button>
            </div>

            {/* Feature 2: Straw Marketplace */}
            <div className="bg-transparent backdrop-blur-md border border-white/15 rounded-3xl p-6 flex flex-col justify-between hover:border-[#E5A812]/50 hover:bg-white/5 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#68BA75]/15 border border-[#68BA75]/30 flex items-center justify-center text-[#68BA75] mb-5 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="font-mono text-[11px] font-bold text-[#68BA75]">02. Commerce</span>
                <h3 className="text-lg font-bold text-white mt-1 group-hover:text-[#68BA75] transition-colors">
                  Biomass Marketplace
                </h3>
                <p className="text-xs text-white/70 mt-2.5 leading-relaxed">
                  Real-time order book connecting farmers with 2G ethanol refineries, power boilers, and paper mills across Punjab and Haryana.
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 text-[11px] text-white/80 space-y-1.5">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#68BA75]" />
                    <span>Moisture & Bale Type Filters</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#68BA75]" />
                    <span>Live Mandi Spot Index</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  switchRole('buyer');
                  onNavigate('/buyer/marketplace');
                }}
                className="mt-6 w-full py-2.5 px-4 bg-white/10 hover:bg-[#2E581F] text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10"
              >
                <span>Browse Marketplace</span>
                <span className="text-[#E5A812] font-black">→</span>
              </button>
            </div>

            {/* Feature 3: Satellite Telemetry */}
            <div className="bg-transparent backdrop-blur-md border border-white/15 rounded-3xl p-6 flex flex-col justify-between hover:border-[#E5A812]/50 hover:bg-white/5 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E5A812]/15 border border-[#E5A812]/30 flex items-center justify-center text-[#E5A812] mb-5 group-hover:scale-105 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="font-mono text-[11px] font-bold text-[#E5A812]">03. Environmental</span>
                <h3 className="text-lg font-bold text-white mt-1 group-hover:text-[#E5A812] transition-colors">
                  Thermal Fire Risk Radar
                </h3>
                <p className="text-xs text-white/70 mt-2.5 leading-relaxed">
                  MODIS and VIIRS satellite tracking pins thermal anomalies in Sangrur, Tarn Taran, and Kaithal to deploy rapid baler capacity.
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 text-[11px] text-white/80 space-y-1.5">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E5A812]" />
                    <span>Active Hotspot Heatmaps</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E5A812]" />
                    <span>CAQM Stubble Alert Triggers</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/fire-risks')}
                className="mt-6 w-full py-2.5 px-4 bg-white/10 hover:bg-[#2E581F] text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10"
              >
                <span>Open Fire Radar</span>
                <span className="text-[#E5A812] font-black">→</span>
              </button>
            </div>

            {/* Feature 4: Escrow & Legal Contracts */}
            <div className="bg-transparent backdrop-blur-md border border-white/15 rounded-3xl p-6 flex flex-col justify-between hover:border-[#E5A812]/50 hover:bg-white/5 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#68BA75]/15 border border-[#68BA75]/30 flex items-center justify-center text-[#68BA75] mb-5 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="font-mono text-[11px] font-bold text-[#68BA75]">04. Settlement</span>
                <h3 className="text-lg font-bold text-white mt-1 group-hover:text-[#68BA75] transition-colors">
                  Digital Escrow Contracts
                </h3>
                <p className="text-xs text-white/70 mt-2.5 leading-relaxed">
                  Automated Java Rules engine holds buyer funds in bank escrow and releases payment upon weighbridge ticket confirmation.
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 text-[11px] text-white/80 space-y-1.5">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#68BA75]" />
                    <span>Zero Non-Payment Risk</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#68BA75]" />
                    <span>Verified Slip Reconciliation</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/contracts')}
                className="mt-6 w-full py-2.5 px-4 bg-white/10 hover:bg-[#2E581F] text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10"
              >
                <span>View Escrow Desk</span>
                <span className="text-[#E5A812] font-black">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: FINAL HIGHLIGHT / CALL TO ACTION (~100vh)
          ========================================================================= */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden py-24 lg:py-32 border-t border-white/10">
        {/* Fourth cinematic background image: peaceful golden hour over expansive farm horizon */}
        <div className="absolute inset-0 z-0">
          <img
            src={ctaBg}
            alt="Golden dusk sunlight illuminating clean farm horizon and agricultural crops"
            className="w-full h-full object-cover object-center filter brightness-[0.70]"
            referrerPolicy="no-referrer"
          />
          {/* Edge gradient smoothly transitioning into deep footer */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09110B] via-black/80 to-[#0D1810]" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/45 to-black/85" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full space-y-8">
          {/* Small Section Label */}
          <div className="inline-flex items-center gap-2 border border-[#E5A812] px-5 py-2 rounded-full text-xs font-semibold tracking-wide text-[#E5A812] bg-black/40 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>04 / Join the Clean Air Exchange</span>
          </div>

          {/* Large Bold Headline */}
          <BlurRevealText
            as="h2"
            text="Clear the Skies. Monetize Every Acre."
            mode="word"
            triggerOnScroll={true}
            initialBlurVisible={true}
            delay={60}
            staggerDelay={45}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08] block max-w-4xl mx-auto"
          />

          {/* Short Supporting Description */}
          <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Join over 12,450 registered farmers, 64+ bio-energy refineries, and 240+ custom baling operators transforming stubble into verified income and cleaner breathing air.
          </p>

          {/* Multilingual AI Advisor Pill */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full text-xs text-white/90">
            <Bot className="w-4 h-4 text-[#E5A812]" />
            <span>
              24/7 AI Agronomy Advisor available in <strong>Punjabi (ਪੰਜਾਬੀ)</strong>, <strong>Hindi (हिंदी)</strong>, and <strong>English</strong>
            </span>
          </div>

          {/* Prominent CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
            <button
              onClick={() => {
                switchRole('farmer');
                onNavigate('/farmer/listings/new');
              }}
              className="w-full sm:w-auto bg-[#2E581F] hover:bg-[#244818] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-xs sm:text-base inline-flex items-center justify-center gap-3 transition-all shadow-2xl hover:scale-102 cursor-pointer border border-white/10"
            >
              <span>List Your Crop Straw</span>
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-black text-xs shrink-0">
                →
              </span>
            </button>

            <button
              onClick={() => {
                switchRole('buyer');
                onNavigate('/buyer/marketplace');
              }}
              className="w-full sm:w-auto border border-[#E5A812] hover:bg-[#E5A812]/15 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-xs sm:text-base inline-flex items-center justify-center gap-3 transition-all cursor-pointer bg-black/35 backdrop-blur-xs"
            >
              <span className="text-[#E5A812]">Source Industrial Feedstock</span>
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-black text-xs shrink-0">
                →
              </span>
            </button>

            <button
              onClick={() => onNavigate('/assistant')}
              className="w-full sm:w-auto text-white/80 hover:text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Ask Multilingual AI Assistant</span>
              <span className="text-[#E5A812]">→</span>
            </button>
          </div>

          {/* Trust Guarantees Bar */}
          <div className="pt-8 sm:pt-10 grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-left border-t border-white/10 max-w-3xl mx-auto">
            <div className="flex items-center gap-2.5 text-xs text-white/70">
              <CheckCircle2 className="w-4 h-4 text-[#E5A812] shrink-0" />
              <span>100% Escrow Backed</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white/70">
              <CheckCircle2 className="w-4 h-4 text-[#E5A812] shrink-0" />
              <span>48h Baler Dispatch SLA</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white/70">
              <CheckCircle2 className="w-4 h-4 text-[#E5A812] shrink-0" />
              <span>Satellite Fire Tracking</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white/70">
              <CheckCircle2 className="w-4 h-4 text-[#E5A812] shrink-0" />
              <span>Zero Farmer Fees</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

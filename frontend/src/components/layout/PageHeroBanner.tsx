import React from 'react';
import { BlurRevealText } from '../ui/BlurRevealText';
import { CountUpNumber } from '../ui/CountUpNumber';

export interface PageHeroStat {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  highlight?: boolean;
}

export interface PageHeroBannerProps {
  badge: string;
  badgeIcon?: React.ReactNode;
  title: string;
  subtitle: string;
  bgImageUrl: string;
  stats?: PageHeroStat[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeroBanner: React.FC<PageHeroBannerProps> = ({
  badge,
  badgeIcon,
  title,
  subtitle,
  bgImageUrl,
  stats,
  actions,
  children,
}) => {
  return (
    <div className="relative w-full -mt-24 sm:-mt-28 pt-28 sm:pt-36 pb-14 sm:pb-20 overflow-hidden text-white mb-8 border-b border-white/10">
      {/* Full-width cinematic background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgImageUrl}
          alt={title}
          className="w-full h-full object-cover object-center filter brightness-[0.78]"
          referrerPolicy="no-referrer"
        />
        {/* Deep dark gradient overlay, stronger on text side for contrast and legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1810] via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl">
          {/* Golden Outlined Pill Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 border border-[#E5A812] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-[#E5A812] bg-[#0D1810]/50 backdrop-blur-xs">
              {badgeIcon}
              <span>{badge}</span>
            </span>
          </div>

          {/* Large Bold Editorial Headline with BlurRevealText */}
          <BlurRevealText
            text={title}
            as="h1"
            mode="word"
            delay={50}
            staggerDelay={35}
            triggerOnScroll={false}
            initialBlurVisible={true}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1] block drop-shadow-md"
          />

          {/* Short Supporting Description */}
          <p className="text-white/85 text-xs sm:text-sm md:text-base leading-relaxed mt-3.5 max-w-2xl font-normal">
            {subtitle}
          </p>

          {/* Action buttons with golden arrow circles if provided */}
          {actions && <div className="mt-6 flex flex-wrap items-center gap-4">{actions}</div>}
        </div>

        {/* Live Metrics Floating Bar if provided */}
        {stats && stats.length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl p-4 hover:border-[#E5A812]/40 transition-all shadow-lg"
              >
                <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p
                  className={`text-xl sm:text-2xl font-extrabold mt-1 ${
                    stat.highlight ? 'text-[#E5A812]' : 'text-white'
                  }`}
                >
                  {typeof stat.value === 'number' ? (
                    <CountUpNumber
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      decimals={stat.decimals || 0}
                      duration={1600}
                    />
                  ) : (
                    <span>
                      {stat.prefix}
                      {stat.value}
                      {stat.suffix}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

import React from "react";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", showWordmark = true }) => {
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* Custom designed brand mark: Speech soundwaves meeting learning bookmark */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="10" fill="#18181B" />
        {/* Modern voice frequency columns evoking an open tutor conversation */}
        <rect x="9" y="15" width="3.5" height="10" rx="1.75" fill="#FE5933" />
        <rect x="15" y="10" width="3.5" height="20" rx="1.75" fill="#FE5933" />
        <rect x="21" y="7" width="3.5" height="26" rx="1.75" fill="#FFFFFF" />
        <rect x="27" y="13" width="3.5" height="14" rx="1.75" fill="#FE5933" />
        {/* Subtle accent dot indicating live voice tutor readiness */}
        <circle cx="33" cy="9" r="2" fill="#22C55E" />
      </svg>
      {showWordmark && (
        <span className="text-xl font-bold tracking-tight text-neutral-900">
          Vocal<span className="text-[#FE5933]">utor</span>
        </span>
      )}
    </div>
  );
};

export default Logo;

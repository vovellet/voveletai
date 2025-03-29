'use client';

import { Z_SCORE_LEVELS, ZScoreLevel } from '@vovelet/shared';

interface VoveCardProps {
  zScoreLevel: ZScoreLevel;
  totalZScore: number;
}

export default function VoveCard({ zScoreLevel, totalZScore }: VoveCardProps) {
  // Define card colors and icons based on level
  const cardConfig = {
    [Z_SCORE_LEVELS.BASIC]: {
      bgGradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
      iconBg: 'bg-blue-300',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'Basic',
      description: 'You\'re on your way to earning more Let rewards!',
    },
    [Z_SCORE_LEVELS.PRO]: {
      bgGradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
      iconBg: 'bg-purple-300',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9.618 5.04C2.127 9.504 2 11.138 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-.862-.127-2.496-.382-4.016z" />
        </svg>
      ),
      label: 'Pro',
      description: 'You\'ve unlocked exclusive rewards and features!',
    },
    [Z_SCORE_LEVELS.PRIME]: {
      bgGradient: 'bg-gradient-to-br from-amber-500 to-amber-700',
      iconBg: 'bg-amber-300',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      label: 'Prime',
      description: 'You\'re among our top contributors!',
    },
  };

  const config = cardConfig[zScoreLevel] || cardConfig[Z_SCORE_LEVELS.BASIC];

  return (
    <div className={`${config.bgGradient} rounded-2xl shadow-xl overflow-hidden text-white relative`}>
      {/* Card background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#smallGrid)" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Card content */}
      <div className="relative p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide opacity-80">VoveletAI</div>
            <div className="text-lg font-bold">Z-Score Card</div>
          </div>
          <div className={`${config.iconBg} p-2 rounded-full`}>
            {config.icon}
          </div>
        </div>

        <div className="flex-grow">
          <div className="text-3xl font-bold mb-1">
            {config.label}
          </div>
          <div className="text-sm opacity-80 mb-4">
            {config.description}
          </div>
          
          <div className="bg-white/20 rounded-lg p-3 flex justify-between items-center">
            <div className="text-sm">Total Z-Score</div>
            <div className="text-xl font-bold">{totalZScore.toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-6 text-xs opacity-70 text-right">
          Member since {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
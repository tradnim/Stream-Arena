import React from 'react';
import { Play, Calendar, Clock, Shield } from 'lucide-react';
import { Match, AppSettings } from '../types';
import { StreamedApi } from '../services/streamedApi';

interface MatchCardProps {
  match: Match;
  onClick: (match: Match) => void;
  settings: AppSettings;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onClick, settings }) => {
  const matchDate = new Date(match.date);
  const isLive = Date.now() >= match.date && Date.now() <= match.date + (2.5 * 60 * 60 * 1000); 

  const homeBadgeId = match.teams?.home?.badge;
  const awayBadgeId = match.teams?.away?.badge;
  const hasBothBadges = !!homeBadgeId && !!awayBadgeId;
  const shouldShowBadges = hasBothBadges || settings.showIncompleteBadges;

  const getTeamBadge = (badgeId?: string) => {
    if (!badgeId) return 'https://picsum.photos/60/60?blur=2';
    return StreamedApi.getBadgeUrl(badgeId);
  };

  // Styles based on settings
  const motionClasses = settings.reduceMotion 
    ? '' 
    : 'hover:-translate-y-1 hover:shadow-[0_0_30px_-10px_rgba(6,182,212,0.3)] transition-all duration-300';
    
  const focusClasses = settings.tvMode
    ? 'focus:ring-4 focus:ring-cyan-400 focus:scale-[1.02] focus:bg-zinc-800'
    : 'focus:ring-2 focus:ring-cyan-500/50';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(match);
    }
  };

  return (
    <div 
      onClick={() => onClick(match)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      className={`group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 cursor-pointer flex flex-col h-full outline-none ${motionClasses} ${focusClasses}`}
    >
      {/* Background Poster Overlay */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 group-focus:opacity-10 pointer-events-none ${!settings.reduceMotion ? 'transition-opacity duration-500' : ''}`}>
        {match.poster && (
          <img 
            src={StreamedApi.getPosterUrl(match.poster)} 
            alt="" 
            className={`w-full h-full object-cover blur-sm scale-110`} 
          />
        )}
      </div>

      {/* Card Header */}
      <div className="relative p-4 flex justify-between items-start z-10">
        <span className="px-2 py-1 rounded bg-zinc-950/50 border border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-cyan-400 group-focus:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
          {match.category}
        </span>
        
        {isLive ? (
          <div className={`flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded text-red-500 text-[10px] font-bold ${!settings.reduceMotion && 'animate-pulse'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            LIVE
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
            <Calendar size={12} />
            {matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>

      {/* Teams Display */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-4 z-10">
        <div className="flex items-center justify-between w-full gap-2">
          {/* Home Team */}
          <div className={`flex flex-col items-center w-[40%] text-center ${!settings.reduceMotion ? 'group-hover:-translate-x-1 transition-transform duration-300' : ''}`}>
            <div className="w-16 h-16 mb-3 relative flex items-center justify-center">
              {shouldShowBadges ? (
                <>
                  <div className={`absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 group-focus:opacity-100 ${!settings.reduceMotion ? 'transition-opacity' : ''}`}></div>
                  <img 
                    src={getTeamBadge(homeBadgeId)} 
                    alt={match.teams?.home?.name}
                    className="w-full h-full object-contain relative z-10 drop-shadow-lg"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </>
              ) : (
                <Shield className="w-8 h-8 text-zinc-800" />
              )}
            </div>
            <span className="text-xs font-bold text-zinc-300 uppercase leading-tight line-clamp-2">
              {match.teams?.home?.name || 'Home'}
            </span>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center">
             <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-zinc-700 to-transparent"></div>
             <span className="my-1 text-[10px] font-black text-zinc-600 italic">VS</span>
             <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-zinc-700 to-transparent"></div>
          </div>

          {/* Away Team */}
          <div className={`flex flex-col items-center w-[40%] text-center ${!settings.reduceMotion ? 'group-hover:translate-x-1 transition-transform duration-300' : ''}`}>
            <div className="w-16 h-16 mb-3 relative flex items-center justify-center">
              {shouldShowBadges ? (
                <>
                  <div className={`absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 group-focus:opacity-100 ${!settings.reduceMotion ? 'transition-opacity' : ''}`}></div>
                  <img 
                    src={getTeamBadge(awayBadgeId)} 
                    alt={match.teams?.away?.name}
                    className="w-full h-full object-contain relative z-10 drop-shadow-lg"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </>
              ) : (
                <Shield className="w-8 h-8 text-zinc-800" />
              )}
            </div>
            <span className="text-xs font-bold text-zinc-300 uppercase leading-tight line-clamp-2">
              {match.teams?.away?.name || 'Away'}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="relative p-4 border-t border-zinc-800/50 bg-zinc-900/30 z-10">
        <h3 className="text-sm font-medium text-zinc-400 text-center mb-3 line-clamp-1 group-hover:text-white group-focus:text-white transition-colors">
          {match.title}
        </h3>
        
        <button tabIndex={-1} className={`w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-cyan-600 group-focus:bg-cyan-600 text-zinc-300 hover:text-white group-focus:text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${!settings.reduceMotion ? 'transition-all duration-300 group-hover:shadow-lg group-hover:shadow-cyan-500/20' : ''}`}>
          {isLive ? (
            <>
              <Play size={12} fill="currentColor" /> Watch Stream
            </>
          ) : (
            <>
              <Clock size={12} /> {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MatchCard;
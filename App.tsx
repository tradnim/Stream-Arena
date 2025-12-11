import React, { useEffect, useState, useMemo } from 'react';
import { Search, Menu, Trophy, Flame, Calendar, X, Zap, LayoutGrid, Radio, Settings, Tv, MonitorPlay, ZapOff, History } from 'lucide-react';
import { Match, Sport, ViewState, AppSettings } from './types';
import { StreamedApi } from './services/streamedApi';
import MatchCard from './components/MatchCard';
import StreamPlayer from './components/StreamPlayer';

function App() {
  // State
  const [view, setView] = useState<ViewState>('list');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    showIncompleteBadges: false,
    autoPlay: true,
    reduceMotion: false,
    tvMode: false, 
    showPastGames: false,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Filters
  const [activeCategory, setActiveCategory] = useState<string>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial Fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [sportsData, matchesData] = await Promise.all([
        StreamedApi.getSports(),
        StreamedApi.getMatches('live') // Default to live
      ]);
      setSports(sportsData);
      setMatches(matchesData);
      setLoading(false);
    };
    init();
  }, []);

  // Fetch matches when category changes
  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setMatches([]); 
      const data = await StreamedApi.getMatches(activeCategory);
      setMatches(data);
      setLoading(false);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    fetchMatches();
  }, [activeCategory]);

  // Handle Android Hardware Back Button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we are in player mode and user presses back, return to list
      if (view === 'player') {
        // Prevent default browser back if possible, but mainly update state
        setView('list');
        setSelectedMatch(null);
      } else if (isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [view, isSettingsOpen]);

  // Derived state
  const filteredMatches = useMemo(() => {
    const now = Date.now();
    // Assuming a match lasts roughly 3 hours (10800000ms) including breaks
    const MATCH_DURATION = 3 * 60 * 60 * 1000;

    return matches.filter(m => {
      // 1. Search Filter
      const matchesSearch = 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.teams?.home?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.teams?.away?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // 2. Past Games Filter
      // If setting is OFF, hide games that ended
      if (!settings.showPastGames) {
         const isPast = now > (m.date + MATCH_DURATION);
         // Exceptions: If it's in the 'live' category, trust the API even if date is old
         if (isPast && activeCategory !== 'live') return false;
      }

      return true;
    });
  }, [matches, searchQuery, settings.showPastGames, activeCategory]);

  // Hero match logic (find first popular live match, or just first match)
  const heroMatch = useMemo(() => {
    if (loading || filteredMatches.length === 0) return null;
    return filteredMatches.find(m => m.popular) || filteredMatches[0];
  }, [filteredMatches, loading]);

  // Handlers
  const handleMatchClick = (match: Match) => {
    // Push state to history stack so Back Button works
    window.history.pushState({ view: 'player' }, '', '#player');
    setSelectedMatch(match);
    setView('player');
  };

  const handleBackToMatches = () => {
    // If we are going back manually via UI button, pop the history state
    // so we don't break the forward/back chain
    if (window.location.hash === '#player') {
      window.history.back();
    } else {
      setSelectedMatch(null);
      setView('list');
    }
  };

  const toggleSetting = (key: keyof AppSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const focusClass = settings.tvMode 
    ? "focus:ring-4 focus:ring-cyan-400 focus:outline-none focus:bg-zinc-800"
    : "focus:ring-2 focus:ring-cyan-500/50 focus:outline-none";

  // Render Video Player View
  if (view === 'player' && selectedMatch) {
    return <StreamPlayer match={selectedMatch} onBack={handleBackToMatches} settings={settings} />;
  }

  // Render Dashboard View
  // Apply Safe Area padding for status bars (pt) and home indicators (pb)
  return (
    <div className={`h-full w-full bg-black text-zinc-200 flex flex-col md:flex-row font-sans overflow-hidden ${settings.reduceMotion ? '' : 'animate-in fade-in'} pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]`}>
      
      {/* Mobile Header with Safe Area Top Padding */}
      <div className="md:hidden flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-cyan-500 p-1.5 rounded-lg">
            <Zap className="w-5 h-5 text-black fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tighter text-white brand-font">STREAM<span className="text-cyan-500">ARENA</span></span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-400">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation with Safe Area Top Padding */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 2xl:w-80 bg-zinc-950 border-r border-zinc-900 transform transition-transform duration-300 ease-in-out flex flex-col
        md:relative md:translate-x-0
        pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Area */}
        <div className="p-6 hidden md:flex items-center gap-3 mb-6">
          <div className="bg-cyan-500 p-2 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Zap className="w-6 h-6 text-black fill-current" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-white brand-font">STREAM<span className="text-cyan-500">ARENA</span></span>
        </div>

        {/* Discovery Section */}
        <div className="px-4 mb-8">
           <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 px-3 font-mono">Main Feeds</h3>
           <nav className="space-y-1">
             <CategoryButton 
               icon={<Radio size={18} />} 
               label="Live Now" 
               active={activeCategory === 'live'} 
               onClick={() => setActiveCategory('live')} 
               pulse={!settings.reduceMotion}
               focusClass={focusClass}
             />
             <CategoryButton 
               icon={<Flame size={18} />} 
               label="Trending" 
               active={activeCategory === 'all/popular'} 
               onClick={() => setActiveCategory('all/popular')} 
               focusClass={focusClass}
             />
             <CategoryButton 
               icon={<Calendar size={18} />} 
               label="Schedule" 
               active={activeCategory === 'today'} 
               onClick={() => setActiveCategory('today')} 
               focusClass={focusClass}
             />
             <CategoryButton 
               icon={<LayoutGrid size={18} />} 
               label="All Events" 
               active={activeCategory === 'all'} 
               onClick={() => setActiveCategory('all')} 
               focusClass={focusClass}
             />
           </nav>
        </div>

        {/* Sports List */}
        <div className="px-4 flex-1 overflow-y-auto pb-8 custom-scrollbar">
           <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 px-3 font-mono">Leagues & Sports</h3>
           <nav className="space-y-1">
             {sports.map(sport => (
               <button
                 key={sport.id}
                 onClick={() => setActiveCategory(sport.id)}
                 className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                   activeCategory === sport.id 
                     ? 'bg-zinc-900 text-cyan-400 border border-zinc-800' 
                     : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
                 } ${focusClass}`}
               >
                 <span className="capitalize">{sport.name}</span>
                 {activeCategory === sport.id && <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_#06b6d4]"></div>}
               </button>
             ))}
           </nav>
        </div>

        {/* User / Footer */}
        <div className="p-4 border-t border-zinc-900">
          <div className="bg-zinc-900/50 rounded-xl p-3 flex items-center justify-between gap-3 border border-zinc-800">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600"></div>
                <div>
                  <p className="text-xs font-bold text-white">Guest User</p>
                  <p className="text-[10px] text-zinc-500">Free Access</p>
                </div>
             </div>
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ${focusClass}`}
                title="Settings"
             >
                <Settings size={18} />
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content with Safe Area Top Padding (for Desktop) */}
      <main className="flex-1 min-w-0 flex flex-col h-full bg-black relative md:pt-[env(safe-area-inset-top)]">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-zinc-900/50 to-transparent pointer-events-none"></div>

        {/* Top Bar */}
        <div className="flex-shrink-0 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize brand-font tracking-tight">
              {activeCategory === 'all/popular' ? 'Trending Arena' : 
               activeCategory === 'today' ? "Today's Roster" : 
               activeCategory === 'live' ? "Live Action" : 
               activeCategory === 'all' ? "Global Events" :
               sports.find(s => s.id === activeCategory)?.name || activeCategory}
            </h1>
          </div>

          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-cyan-500 transition-colors w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search teams, matches..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-zinc-900/80 border border-zinc-800 text-zinc-200 text-sm rounded-lg py-2.5 pl-10 pr-4 transition-all placeholder:text-zinc-700 ${focusClass}`}
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Featured Hero Section */}
            {!loading && heroMatch && !searchQuery && (
              <div 
                   tabIndex={0}
                   onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMatchClick(heroMatch)}
                   className={`relative w-full h-64 md:h-80 2xl:h-96 rounded-2xl overflow-hidden group cursor-pointer border border-zinc-800 hover:border-cyan-500/50 transition-colors ${focusClass}`}
                   onClick={() => handleMatchClick(heroMatch)}>
                {/* Background Image with Blur */}
                <div className="absolute inset-0">
                  {heroMatch.poster ? (
                    <img src={StreamedApi.getPosterUrl(heroMatch.poster)} alt="" className={`w-full h-full object-cover opacity-60 ${!settings.reduceMotion && 'group-hover:scale-105 transition-transform duration-700'}`} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-zinc-900 to-zinc-800"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
                </div>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:max-w-2xl">
                   <div className="flex items-center gap-2 mb-3">
                     <span className="bg-cyan-500 text-black text-xs font-black px-2 py-1 rounded uppercase">Featured Event</span>
                     {heroMatch.popular && <span className="text-yellow-400 flex items-center gap-1 text-xs font-bold uppercase"><Flame size={12} fill="currentColor"/> Trending</span>}
                   </div>
                   <h2 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight brand-font">
                     {heroMatch.title}
                   </h2>
                   <div className="flex items-center gap-4 text-zinc-300 mb-6">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar size={16} className="text-cyan-500"/> 
                        {new Date(heroMatch.date).toLocaleString([], { weekday: 'short', hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className="text-zinc-600">|</span>
                      <span className="uppercase tracking-wider font-bold text-zinc-400">{heroMatch.category}</span>
                   </div>
                   
                   <button className="bg-white text-black hover:bg-cyan-400 px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors">
                     <Zap size={18} fill="currentColor" /> WATCH NOW
                   </button>
                </div>
              </div>
            )}

            {/* Grid */}
            <div>
              {!loading && !searchQuery && <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><LayoutGrid size={18} className="text-cyan-500"/> Latest Matches</h3>}
              
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={`bg-zinc-900/50 border border-zinc-800 rounded-2xl h-72 ${!settings.reduceMotion && 'animate-pulse'}`}></div>
                  ))}
                </div>
              ) : filteredMatches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {filteredMatches.map(match => (
                    <MatchCard key={match.id} match={match} onClick={handleMatchClick} settings={settings} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                  <Trophy className="w-20 h-20 mb-4 opacity-20" />
                  <p className="text-xl font-bold brand-font">NO MATCHES FOUND</p>
                  <p className="text-sm">Adjust your filters or check back later for new events.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-[env(safe-area-inset-top)]" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-bold brand-font flex items-center gap-2">
                 <Settings className="text-cyan-500" /> Settings
               </h2>
               <button onClick={() => setIsSettingsOpen(false)} className={`text-zinc-500 hover:text-white transition-colors ${focusClass}`}>
                 <X />
               </button>
            </div>
            
            <div className="space-y-3">
               
               <SettingsToggle 
                  label="Show Missing Badges" 
                  desc="Display team logos even if one side is missing." 
                  active={settings.showIncompleteBadges} 
                  onClick={() => toggleSetting('showIncompleteBadges')} 
                  focusClass={focusClass}
               />

               <SettingsToggle 
                  label="Auto-Play Streams" 
                  desc="Start video automatically when opening a match." 
                  active={settings.autoPlay} 
                  onClick={() => toggleSetting('autoPlay')}
                  icon={<MonitorPlay size={16} />}
                  focusClass={focusClass}
               />

               <SettingsToggle 
                  label="Show Past Games" 
                  desc="Keep ended matches visible in the list." 
                  active={settings.showPastGames} 
                  onClick={() => toggleSetting('showPastGames')}
                  icon={<History size={16} />}
                  focusClass={focusClass}
               />

               <SettingsToggle 
                  label="TV Focus Mode" 
                  desc="High contrast selection for TV remotes." 
                  active={settings.tvMode} 
                  onClick={() => toggleSetting('tvMode')}
                  icon={<Tv size={16} />}
                  focusClass={focusClass}
               />

               <SettingsToggle 
                  label="Reduce Motion" 
                  desc="Disable animations and transitions." 
                  active={settings.reduceMotion} 
                  onClick={() => toggleSetting('reduceMotion')}
                  icon={<ZapOff size={16} />}
                  focusClass={focusClass}
               />

            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end">
               <button 
                 onClick={() => setIsSettingsOpen(false)}
                 className={`px-6 py-2 bg-zinc-800 hover:bg-cyan-600 text-white rounded-lg text-sm font-bold transition-colors ${focusClass}`}
               >
                 Done
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for sidebar buttons
const CategoryButton = ({ icon, label, active, onClick, pulse = false, focusClass }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, pulse?: boolean, focusClass: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-bold transition-all ${
      active 
        ? 'bg-cyan-500 text-black shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]' 
        : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
    } ${focusClass}`}
  >
    <div className="relative">
      {icon}
      {pulse && !active && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>}
    </div>
    <span>{label}</span>
  </button>
);

// Helper for Settings Toggle
const SettingsToggle = ({ label, desc, active, onClick, icon, focusClass }: { label: string, desc: string, active: boolean, onClick: () => void, icon?: React.ReactNode, focusClass: string }) => (
   <button 
     className={`w-full flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all text-left ${focusClass}`}
     onClick={onClick}
   >
     <div className="flex gap-3">
       {icon && <div className="mt-1 text-zinc-500">{icon}</div>}
       <div>
         <h3 className="font-bold text-zinc-200">{label}</h3>
         <p className="text-xs text-zinc-500 mt-1">{desc}</p>
       </div>
     </div>
     <div className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${active ? 'bg-cyan-500' : 'bg-zinc-800'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${active ? 'left-7' : 'left-1'}`}></div>
     </div>
   </button>
);

export default App;
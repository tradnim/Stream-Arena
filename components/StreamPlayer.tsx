import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, MonitorPlay, AlertTriangle, ShieldCheck, Wifi, ExternalLink, Activity, PlayCircle } from 'lucide-react';
import { Match, Stream, AppSettings } from '../types';
import { StreamedApi } from '../services/streamedApi';

interface StreamPlayerProps {
  match: Match;
  onBack: () => void;
  settings: AppSettings;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ match, onBack, settings }) => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const streamListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAllStreams = async () => {
      setLoading(true);
      setError(null);
      setIsPlaying(false);
      try {
        if (!match.sources || match.sources.length === 0) {
          throw new Error('No stream sources available for this match.');
        }

        const promises = match.sources.map(s => StreamedApi.getStreams(s.source, s.id));
        const results = await Promise.all(promises);
        const allStreams = results.flat();

        if (isMounted) {
          if (allStreams.length > 0) {
            setStreams(allStreams);
            setActiveStream(allStreams[0]);
            // Auto-play logic
            if (settings.autoPlay) {
              setIsPlaying(true);
            }
          } else {
            setError('No signals detected for this event.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown connection error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllStreams();

    return () => {
      isMounted = false;
    };
  }, [match, settings.autoPlay]);

  // When active stream changes, reset playing state if autoplay is off
  const handleStreamChange = (stream: Stream) => {
    setActiveStream(stream);
    if (!settings.autoPlay) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const isDirectFile = activeStream?.embedUrl.match(/\.(m3u8|mp4)$/i);

  const focusClass = settings.tvMode
    ? 'focus:ring-4 focus:ring-cyan-400 focus:outline-none focus:bg-zinc-800'
    : 'focus:ring-2 focus:ring-cyan-500/50 focus:outline-none';

  return (
    <div className={`flex flex-col h-full bg-black text-white ${!settings.reduceMotion && 'animate-fade-in'} pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]`}>
      {/* Header / Navigation */}
      <div className="flex items-center p-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <button 
          onClick={onBack}
          className={`p-2 mr-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-all ${focusClass}`}
          aria-label="Back to matches"
          tabIndex={0}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">{match.category}</span>
            <h2 className="text-lg font-bold line-clamp-1 brand-font">{match.title}</h2>
          </div>
          <p className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
            {new Date(match.date).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Player Area */}
        <div className="flex-1 bg-zinc-950 relative flex items-center justify-center group">
          
          {/* Decorative Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #22d3ee 1px, transparent 0)', backgroundSize: '40px 40px' }}>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4 z-10">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-zinc-800 rounded-full"></div>
                <div className={`absolute top-0 left-0 w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full ${!settings.reduceMotion && 'animate-spin'}`}></div>
              </div>
              <p className={`text-cyan-500 font-mono text-sm ${!settings.reduceMotion && 'animate-pulse'}`}>ESTABLISHING CONNECTION...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md z-10">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                 <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 brand-font">Signal Lost</h3>
              <p className="text-zinc-500 mb-6">{error}</p>
              <button 
                onClick={onBack}
                className={`px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium text-sm ${focusClass}`}
              >
                Return to Arena
              </button>
            </div>
          ) : activeStream ? (
            <>
              {!isPlaying ? (
                <div className="z-20 text-center">
                   <button 
                    onClick={() => setIsPlaying(true)}
                    className={`group/play flex flex-col items-center gap-4 text-zinc-400 hover:text-white transition-colors ${focusClass} rounded-2xl p-6`}
                    autoFocus
                   >
                      <PlayCircle size={80} className={`text-cyan-500 ${!settings.reduceMotion && 'group-hover/play:scale-110 transition-transform'}`} />
                      <span className="font-bold tracking-widest uppercase">Start Transmission</span>
                   </button>
                </div>
              ) : (
                <>
                  {isDirectFile ? (
                     <video 
                       controls 
                       autoPlay 
                       className="w-full h-full relative z-10 outline-none" 
                       src={activeStream.embedUrl}
                     />
                  ) : (
                    <iframe
                      ref={iframeRef}
                      title={`Stream ${activeStream.streamNo}`}
                      src={activeStream.embedUrl}
                      className="w-full h-full absolute inset-0 border-0 z-10"
                      allowFullScreen
                      allow="autoplay; encrypted-media; picture-in-picture"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </>
              )}
              
              {/* Fallback link */}
              <a 
                href={activeStream.embedUrl} 
                target="_blank" 
                rel="noreferrer"
                tabIndex={0}
                className={`absolute top-4 right-4 bg-zinc-900/90 border border-zinc-700 hover:border-cyan-500 hover:text-cyan-400 text-zinc-300 px-3 py-2 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all text-xs font-bold flex items-center gap-2 backdrop-blur-md z-30 ${focusClass}`}
              >
                <ExternalLink size={14} /> EXT. PLAYER
              </a>
            </>
          ) : null}
        </div>

        {/* Sidebar / Stream Selector */}
        <div className="w-full lg:w-80 bg-zinc-900 border-l border-zinc-800 overflow-y-auto flex flex-col" ref={streamListRef}>
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/95 sticky top-0 z-10">
            <h3 className="font-bold text-zinc-100 flex items-center gap-2 brand-font uppercase tracking-wide">
              <Activity size={18} className="text-cyan-500" />
              Feed Sources
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono uppercase">Select signal frequency below</p>
          </div>

          <div className="p-2 space-y-2 flex-1">
            {!loading && !error && streams.map((stream) => (
              <button
                key={`${stream.source}-${stream.id}`}
                onClick={() => handleStreamChange(stream)}
                className={`w-full text-left p-3 rounded-lg transition-all border group relative overflow-hidden ${
                  activeStream === stream
                    ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-100'
                    : 'bg-zinc-800/30 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                } ${focusClass}`}
              >
                {activeStream === stream && (
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>
                )}
                
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm flex items-center gap-2 brand-font">
                    <MonitorPlay size={14} className={activeStream === stream ? "text-cyan-400" : "text-zinc-600"} />
                    CHANNEL {stream.streamNo}
                  </span>
                  {stream.hd && (
                    <span className="bg-cyan-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm">
                      HD
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs opacity-70 font-mono mt-2">
                  <span className="flex items-center gap-1">
                     {stream.language}
                  </span>
                  <span className="bg-black/30 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase border border-white/5">
                    SRC: {stream.source}
                  </span>
                </div>
              </button>
            ))}
            
            {!loading && streams.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
                <Wifi size={24} className="mb-2 opacity-50" />
                <span className="text-xs font-mono uppercase">No Signals Found</span>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
             <div className="flex gap-3 items-start text-xs text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Streams provided by external partners. StreamArena does not host content. If playback fails, switch channels.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamPlayer;
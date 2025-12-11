export interface Team {
  name: string;
  badge: string;
}

export interface MatchTeams {
  home?: Team;
  away?: Team;
}

export interface MatchSource {
  source: string;
  id: string;
}

export interface Match {
  id: string;
  title: string;
  category: string;
  date: number;
  poster?: string;
  popular: boolean;
  teams?: MatchTeams;
  sources: MatchSource[];
}

export interface Stream {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
}

export interface Sport {
  id: string;
  name: string;
}

export type ViewState = 'list' | 'player';

export interface AppSettings {
  showIncompleteBadges: boolean;
  autoPlay: boolean;
  reduceMotion: boolean;
  tvMode: boolean; // High contrast focus for TV remotes
  showPastGames: boolean;
}
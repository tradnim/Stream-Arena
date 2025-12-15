import { Match, Sport, Stream, MatchSource } from '../types';

const BASE_URL = 'https://streamed.pk/api';

const SPORT_IMAGES: Record<string, string> = {
  football: 'https://images.unsplash.com/photo-1504305754058-2f08ccd89a0a?auto=format&fit=crop&q=80',
  soccer: 'https://images.unsplash.com/photo-1504305754058-2f08ccd89a0a?auto=format&fit=crop&q=80',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80',
  tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80',
  cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80',
  rugby: 'https://images.unsplash.com/photo-1628891892233-358498af3e3c?auto=format&fit=crop&q=80',
  baseball: 'https://images.unsplash.com/photo-1508344928928-716d86789702?auto=format&fit=crop&q=80',
  'american football': 'https://images.unsplash.com/photo-1611371805429-87e227289d71?auto=format&fit=crop&q=80',
  nfl: 'https://images.unsplash.com/photo-1611371805429-87e227289d71?auto=format&fit=crop&q=80',
  hockey: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&q=80',
  'ice hockey': 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&q=80',
  motorsport: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80',
  f1: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80',
  mma: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80',
  ufc: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80',
  golf: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80',
  darts: 'https://images.unsplash.com/photo-1574700940428-c2b534e75459?auto=format&fit=crop&q=80',
  snooker: 'https://images.unsplash.com/photo-1606596160913-7d833892795c?auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&q=80' // Generic stadium
};

export const StreamedApi = {
  /**
   * Fetch all available sports categories
   */
  getSports: async (): Promise<Sport[]> => {
    try {
      const response = await fetch(`${BASE_URL}/sports`);
      if (!response.ok) throw new Error('Failed to fetch sports');
      return await response.json();
    } catch (error) {
      console.error('Error fetching sports:', error);
      return [];
    }
  },

  /**
   * Fetch matches. 
   * @param category - 'all', 'live', 'all-today', or a specific sport ID (e.g., 'football')
   */
  getMatches: async (category: string = 'live'): Promise<Match[]> => {
    try {
      // Construct endpoint based on category logic provided in docs
      let endpoint = '';
      if (category === 'live') {
        endpoint = '/matches/live';
      } else if (category === 'all') {
        endpoint = '/matches/all';
      } else if (category === 'today') {
        endpoint = '/matches/all-today';
      } else {
        endpoint = `/matches/${category}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error(`Failed to fetch matches for ${category}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  },

  /**
   * Fetch streams for a specific match source
   */
  getStreams: async (source: string, id: string): Promise<Stream[]> => {
    try {
      const response = await fetch(`${BASE_URL}/stream/${source}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch streams');
      return await response.json();
    } catch (error) {
      console.error('Error fetching streams:', error);
      return [];
    }
  },

  /**
   * Helper to build image URLs
   */
  getBadgeUrl: (badgeId: string) => `${BASE_URL}/images/badge/${badgeId}.webp`,
  getPosterUrl: (posterPath: string) => `https://streamed.pk${posterPath}.webp`,

  /**
   * Get a fallback image based on sport category
   */
  getFallbackImage: (category: string) => {
    if (!category) return SPORT_IMAGES.default;
    const key = category.toLowerCase();
    
    // Direct match
    if (SPORT_IMAGES[key]) return SPORT_IMAGES[key];
    
    // Partial matches
    if (key.includes('football') || key.includes('soccer')) return SPORT_IMAGES.football;
    if (key.includes('basket')) return SPORT_IMAGES.basketball;
    if (key.includes('racing') || key.includes('motor')) return SPORT_IMAGES.motorsport;
    if (key.includes('fight') || key.includes('boxing')) return SPORT_IMAGES.boxing;
    if (key.includes('hockey')) return SPORT_IMAGES.hockey;
    if (key.includes('rugby')) return SPORT_IMAGES.rugby;
    
    return SPORT_IMAGES.default;
  }
};
import { Match, Sport, Stream, MatchSource } from '../types';

const BASE_URL = 'https://streamed.pk/api';

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
  getPosterUrl: (posterPath: string) => `https://streamed.pk${posterPath}.webp`
};

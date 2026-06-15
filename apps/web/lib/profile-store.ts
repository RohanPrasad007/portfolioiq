import { create } from 'zustand';
import { apiClient, setClientToken } from './api-client';

export interface GithubProfileData {
  username: string;
  avatarUrl: string;
  location: string;
  publicRepos: number;
  totalStars: number;
  topLanguages: Array<{ name: string; percentage: number }>;
}

interface ProfileState {
  profile: GithubProfileData | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: (token: string) => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  fetchProfile: async (token: string) => {
    // Cache guard: Return immediately if profile is already loaded
    if (get().profile) return;

    set({ isLoading: true, error: null });
    try {
      setClientToken(token);
      const res = await apiClient.get('/api/github/profile');
      if (res.data && res.data.success) {
        set({ profile: res.data.data, isLoading: false });
      } else {
        set({ error: res.data?.error || 'Failed to load profile', isLoading: false });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to load profile';
      set({ error: errMsg, isLoading: false });
    }
  },
  clearProfile: () => set({ profile: null }),
}));

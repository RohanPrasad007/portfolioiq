import { create } from 'zustand';

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
      const res = await fetch("http://localhost:4000/api/github/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        set({ profile: json.data, isLoading: false });
      } else {
        set({ error: json.error || 'Failed to load profile', isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  clearProfile: () => set({ profile: null }),
}));

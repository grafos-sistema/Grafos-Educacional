import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types/user.types';
import { clientCookies } from '@/lib/cookies';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeProfile: UserRole | null;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setActiveProfile: (profile: UserRole) => void;
  getAvailableProfiles: () => UserRole[];
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      activeProfile: null,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        // Update cookies for server-side access
        if (accessToken && refreshToken) {
          clientCookies.setAuthTokens(accessToken, refreshToken);
        } else {
          clientCookies.clearAuthTokens();
        }
      },

      getAvailableProfiles: () => {
        const { user } = get();
        if (!user) return [];

        const profiles: UserRole[] = [user.role]; // Always include primary role

        // Add additional profiles based on profile existence
        if (user.teacherProfile?.isActive) {
          profiles.push(UserRole.TEACHER);
        }
        if (user.studentProfile?.isActive) {
          profiles.push(UserRole.STUDENT);
        }
        if (user.parentProfile?.isActive) {
          profiles.push(UserRole.PARENT);
        }

        // Remove duplicates
        return Array.from(new Set(profiles));
      },

      setActiveProfile: (profile: UserRole) => {
        const { user } = get();
        if (!user) return;

        const availableProfiles = get().getAvailableProfiles();
        if (!availableProfiles.includes(profile)) {
          console.error(`Profile ${profile} not available for user`);
          return;
        }

        set({ activeProfile: profile });

        // Update user object with active profile
        const updatedUser = {
          ...user,
          activeProfile: profile,
        };

        set({ user: updatedUser });

        // Store in localStorage
        clientCookies.setUserRole(profile);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('activeProfile', profile);
        }
      },

      login: (user, accessToken, refreshToken) => {
        // Determine available profiles
        const profiles: UserRole[] = [user.role];
        if (user.teacherProfile?.isActive) profiles.push(UserRole.TEACHER);
        if (user.studentProfile?.isActive) profiles.push(UserRole.STUDENT);
        if (user.parentProfile?.isActive) profiles.push(UserRole.PARENT);

        // Set initial active profile (primary role)
        const activeProfile = user.role;

        const updatedUser = {
          ...user,
          availableProfiles: Array.from(new Set(profiles)),
          activeProfile,
        };

        set({
          user: updatedUser,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          activeProfile,
        });

        // Store tokens in cookies for server-side access
        clientCookies.setAuthTokens(accessToken, refreshToken);
        clientCookies.setUserRole(activeProfile);

        // Store user and active profile in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('activeProfile', activeProfile);
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          activeProfile: null,
        });
        // Clear cookies and localStorage
        clientCookies.clearAuthTokens();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('activeProfile');
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        activeProfile: state.activeProfile,
      }),
    }
  )
);

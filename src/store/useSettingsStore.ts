import { create } from 'zustand';
import { DEFAULT_REMINDER_FREQUENCY, DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE } from '../constants/reminders';
import { getSetting, removeSetting, setSetting } from '../db/productRepository';
import { requestNotificationPermissions } from '../services/notifications';
import type { AppSettings, UserProfile } from '../types';

const PROFILE_KEY = 'user_profile';
const SETTINGS_KEY = 'app_settings';

const DEFAULT_SETTINGS: AppSettings = {
  onboardingDone: false,
  defaultReminderFrequency: DEFAULT_REMINDER_FREQUENCY,
  defaultReminderHour: DEFAULT_REMINDER_HOUR,
  defaultReminderMinute: DEFAULT_REMINDER_MINUTE,
  expireAlertEnabled: true,
};

export interface SettingsState {
  profile: UserProfile | null;
  settings: AppSettings;
  notificationsGranted: boolean;
  hydrated: boolean;
  hydrate: () => void;
  /**
   * v1 e local-first: o "usuario" e apenas o nome salvo no dispositivo
   * (secao 1.3). O e-mail e opcional e pode ser preenchido depois no perfil.
   */
  signIn: (name: string, email?: string) => Promise<UserProfile>;
  updateProfile: (patch: Partial<Pick<UserProfile, 'name' | 'email'>>) => void;
  signOut: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  /** Marca o onboarding como visto (concluido ou pulado). */
  completeOnboarding: () => void;
  /** Pede a permissão de notificações e guarda o resultado (seção 5.2). */
  askNotificationPermission: () => Promise<boolean>;
  setNotificationsGranted: (granted: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  profile: null,
  settings: DEFAULT_SETTINGS,
  notificationsGranted: false,
  hydrated: false,

  hydrate: () => {
    const profile = getSetting<UserProfile | null>(PROFILE_KEY, null);
    const settings = { ...DEFAULT_SETTINGS, ...getSetting<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS) };
    set({ profile, settings, hydrated: true });
  },

  signIn: async (name, email) => {
    const profile: UserProfile = {
      name: name.trim(),
      email: (email ?? get().profile?.email ?? '').trim().toLowerCase(),
      createdAt: get().profile?.createdAt ?? new Date().toISOString(),
      notificationsEnabled: get().notificationsGranted,
    };
    setSetting(PROFILE_KEY, profile);
    set({ profile });
    // O onboarding só é marcado como visto ao finalizar/pular (tarefa 3).
    const granted = await get().askNotificationPermission();
    const updated = { ...profile, notificationsEnabled: granted };
    setSetting(PROFILE_KEY, updated);
    set({ profile: updated });
    return updated;
  },

  updateProfile: (patch) => {
    const current = get().profile;
    if (!current) return;
    const updated: UserProfile = { ...current, ...patch };
    setSetting(PROFILE_KEY, updated);
    set({ profile: updated });
  },

  signOut: () => {
    removeSetting(PROFILE_KEY);
    set({ profile: null, notificationsGranted: false });
  },

  updateSettings: (patch) => {
    const updated = { ...get().settings, ...patch };
    setSetting(SETTINGS_KEY, updated);
    set({ settings: updated });
  },

  completeOnboarding: () => {
    get().updateSettings({ onboardingDone: true });
  },

  askNotificationPermission: async () => {
    const granted = await requestNotificationPermissions();
    set({ notificationsGranted: granted });
    return granted;
  },

  setNotificationsGranted: (granted) => set({ notificationsGranted: granted }),
}));

export const selectGreetingName = (state: SettingsState): string => {
  const name = state.profile?.name?.trim();
  if (!name) return 'bem-vindo';
  return name.split(' ')[0];
};
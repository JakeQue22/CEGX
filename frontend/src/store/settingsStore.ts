import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CompanySettings } from '@/types';

interface SettingsState {
  settings: CompanySettings | null;
  setSettings: (settings: CompanySettings) => void;
  updateSettings: (partial: Partial<CompanySettings>) => void;
  primaryColor: string;
}

const DEFAULT_PRIMARY = '#3b82f6';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: null,
      primaryColor: DEFAULT_PRIMARY,

      setSettings: (settings) => {
        set({ settings, primaryColor: settings.primaryColor || DEFAULT_PRIMARY });
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty(
            '--primary-color',
            settings.primaryColor || DEFAULT_PRIMARY,
          );
        }
      },

      updateSettings: (partial) => {
        const current = get().settings;
        if (!current) return;
        const updated = { ...current, ...partial };
        set({ settings: updated, primaryColor: updated.primaryColor || DEFAULT_PRIMARY });
        if (typeof document !== 'undefined' && partial.primaryColor) {
          document.documentElement.style.setProperty('--primary-color', partial.primaryColor);
        }
      },
    }),
    {
      name: 'cegx-settings',
    },
  ),
);

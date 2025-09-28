import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type NotificationSettings = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  dailySummaryEnabled: boolean;
};

type NotificationSettingsContextValue = {
  settings: NotificationSettings;
  updateSettings: (updates: Partial<NotificationSettings>) => void;
  resetToDefaults: () => void;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  emailEnabled: false,
  smsEnabled: false,
  dailySummaryEnabled: false,
};

const NotificationSettingsContext = createContext<NotificationSettingsContextValue | undefined>(undefined);

export const NotificationSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  const updateSettings = (updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetToDefaults = () => setSettings(DEFAULT_SETTINGS);

  const value = useMemo(() => ({ settings, updateSettings, resetToDefaults }), [settings]);

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  );
};

export function useNotificationSettings() {
  const ctx = useContext(NotificationSettingsContext);
  if (!ctx) throw new Error('useNotificationSettings must be used within NotificationSettingsProvider');
  return ctx;
}

export { NotificationSettingsContext };



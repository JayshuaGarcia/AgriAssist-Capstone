import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type PrivacySettings = {
  biometricUnlockEnabled: boolean;
  twoFactorEnabled: boolean;
  rememberDeviceEnabled: boolean;
  shareAnalyticsEnabled: boolean;
};

type PrivacySettingsContextValue = {
  settings: PrivacySettings;
  updateSettings: (updates: Partial<PrivacySettings>) => void;
  resetToDefaults: () => void;
};

const DEFAULT_SETTINGS: PrivacySettings = {
  biometricUnlockEnabled: false,
  twoFactorEnabled: false,
  rememberDeviceEnabled: true,
  shareAnalyticsEnabled: false,
};

const PrivacySettingsContext = createContext<PrivacySettingsContextValue | undefined>(undefined);

export const PrivacySettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);

  const updateSettings = (updates: Partial<PrivacySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetToDefaults = () => setSettings(DEFAULT_SETTINGS);

  const value = useMemo(() => ({ settings, updateSettings, resetToDefaults }), [settings]);

  return (
    <PrivacySettingsContext.Provider value={value}>
      {children}
    </PrivacySettingsContext.Provider>
  );
};

export const usePrivacySettings = () => {
  const ctx = useContext(PrivacySettingsContext);
  if (!ctx) throw new Error('usePrivacySettings must be used within PrivacySettingsProvider');
  return ctx;
};







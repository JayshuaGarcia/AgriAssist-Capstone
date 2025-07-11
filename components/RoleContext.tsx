import { createContext, ReactNode, useContext, useState } from 'react';

export type UserRole = 'Admin' | 'BAEWs' | 'Viewer';

interface RoleContextType {
  role: UserRole | null;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

// --- Barangay Context ---
export type Barangay =
  | 'Poblacion'
  | 'Rizal'
  | 'Tabugon'
  | 'San Lorenzo'
  | 'San Pedro'
  | 'Pulongguit-guit'
  | 'Basiad'
  | 'Plaridel'
  | 'Don Tomas'
  | 'Maulawin'
  | 'Patag Ibaba'
  | 'Patag Ilaya'
  | 'Bulala'
  | 'Guitol'
  | 'Kagtalaba';

interface BarangayContextType {
  barangay: Barangay | null;
  setBarangay: (barangay: Barangay) => void;
}

const BarangayContext = createContext<BarangayContextType | undefined>(undefined);

export const BarangayProvider = ({ children }: { children: ReactNode }) => {
  const [barangay, setBarangay] = useState<Barangay | null>(null);
  return (
    <BarangayContext.Provider value={{ barangay, setBarangay }}>
      {children}
    </BarangayContext.Provider>
  );
};

export const useBarangay = () => {
  const context = useContext(BarangayContext);
  if (!context) {
    throw new Error('useBarangay must be used within a BarangayProvider');
  }
  return context;
}; 
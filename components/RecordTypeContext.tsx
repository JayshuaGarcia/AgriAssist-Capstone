import { createContext, ReactNode, useContext, useState } from 'react';

export type RecordType = 
  | 'farmer-profiles'
  | 'livestock'
  | 'fertilizer-logs'
  | 'crop-monitoring'
  | 'accomplishment-reports'
  | 'planting-tracker'
  | 'harvest-tracker';

interface RecordTypeContextType {
  recordType: RecordType | null;
  setRecordType: (recordType: RecordType) => void;
}

const RecordTypeContext = createContext<RecordTypeContextType | undefined>(undefined);

export const RecordTypeProvider = ({ children }: { children: ReactNode }) => {
  const [recordType, setRecordType] = useState<RecordType | null>(null);
  return (
    <RecordTypeContext.Provider value={{ recordType, setRecordType }}>
      {children}
    </RecordTypeContext.Provider>
  );
};

export const useRecordType = () => {
  const context = useContext(RecordTypeContext);
  if (!context) {
    throw new Error('useRecordType must be used within a RecordTypeProvider');
  }
  return context;
}; 
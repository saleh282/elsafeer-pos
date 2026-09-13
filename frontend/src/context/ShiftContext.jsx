import { createContext, useContext, useState, useCallback } from 'react';
import { getCurrentShift as getCurrentShiftApi } from '../services/shiftService';

const ShiftContext = createContext(null);

export const ShiftProvider = ({ children }) => {
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshShift = useCallback(async (branchId) => {
    setLoading(true);
    try {
      const current = await getCurrentShiftApi(branchId);
      setShift(current);
      return current;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ShiftContext.Provider value={{ shift, setShift, loading, refreshShift }}>
      {children}
    </ShiftContext.Provider>
  );
};

export const useShift = () => useContext(ShiftContext);

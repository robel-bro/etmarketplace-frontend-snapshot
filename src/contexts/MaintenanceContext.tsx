import { createContext, useContext, useState, useEffect } from 'react';

const MaintenanceContext = createContext({ enabled: false });

export const MaintenanceProvider = ({ children }) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mock = localStorage.getItem('maintenance');
    setEnabled(mock === 'true');
  }, []);

  return (
    <MaintenanceContext.Provider value={{ enabled }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => useContext(MaintenanceContext);
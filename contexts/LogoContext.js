import { createContext, useContext, useState } from 'react';

const LogoContext = createContext();

export function useLogo() {
  return useContext(LogoContext);
}

export function LogoProvider({ children }) {
  const [logo, setLogo] = useState('/images/VITARLOGO.png'); // Default logo path

  const value = {
    logo,
    setLogo
  };

  return (
    <LogoContext.Provider value={value}>
      {children}
    </LogoContext.Provider>
  );
} 
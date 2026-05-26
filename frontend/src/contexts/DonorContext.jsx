import { createContext, useContext, useState } from "react";

const DonorContext = createContext();

export const DonorProvider = ({ children }) => {
  const [activeView, setActiveView] = useState("dashboard");

  return (
    <DonorContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </DonorContext.Provider>
  );
};

export const useDonorContext = () => {
  const context = useContext(DonorContext);
  if (!context) {
    throw new Error("useDonorContext must be used within DonorProvider");
  }
  return context;
};
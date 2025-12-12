import React, { createContext, useState } from "react";

export const PoultryContext = createContext({});

const Context = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <PoultryContext.Provider value={{isAuthenticated, setIsAuthenticated }}>
      {children}
    </PoultryContext.Provider>
  );
};

export default Context;

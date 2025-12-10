import React, { createContext, useState } from "react";

export const PoultryContext = createContext({});

const Context = ({ children }) => {
  const [dataa, setData] = useState("Hello Context");

  return (
    <PoultryContext.Provider value={{ dataa, setData }}>
      {children}
    </PoultryContext.Provider>
  );
};

export default Context;

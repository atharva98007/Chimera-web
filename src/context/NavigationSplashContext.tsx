"use client";

import { createContext, useContext, type ReactNode } from "react";

type NavigationSplashContextValue = {
  triggerSplash: () => void;
};

const NavigationSplashContext = createContext<NavigationSplashContextValue>({
  triggerSplash: () => {},
});

export function useNavigationSplash() {
  return useContext(NavigationSplashContext);
}

export function NavigationSplashProvider({ children }: { children: ReactNode }) {
  return (
    <NavigationSplashContext.Provider value={{ triggerSplash: () => {} }}>
      {children}
    </NavigationSplashContext.Provider>
  );
}

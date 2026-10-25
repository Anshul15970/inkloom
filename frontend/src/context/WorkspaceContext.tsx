import React, { createContext, useContext, useState, ReactNode } from "react";
import { Brand, UserRole, RouteId } from "../types";
import { MOCK_BRANDS } from "../data/mockData";

interface WorkspaceContextType {
  activeBrand: Brand;
  setActiveBrand: (brand: Brand) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentRoute: RouteId;
  setCurrentRoute: (route: RouteId) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  brands: Brand[];
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [brands] = useState<Brand[]>(MOCK_BRANDS);
  const [activeBrand, setActiveBrand] = useState<Brand>(MOCK_BRANDS[0]);
  const [activeRole, setActiveRole] = useState<UserRole>("BRAND_MANAGER");
  const [currentRoute, setCurrentRoute] = useState<RouteId>("overview");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  return (
    <WorkspaceContext.Provider
      value={{
        activeBrand,
        setActiveBrand,
        activeRole,
        setActiveRole,
        currentRoute,
        setCurrentRoute,
        isAuthenticated,
        setIsAuthenticated,
        brands,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};


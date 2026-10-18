// import { createContext, useContext, useState, useEffect } from "react";

// const AuthContext = createContext<{ tenantId: string | null }>({ tenantId: null });

// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//   const [tenantId, setTenantId] = useState<string | null>(null);

//   useEffect(() => {
//     const id = localStorage.getItem("tenant_id");
//     if (id) setTenantId(id);
//   }, []);

//   return (
//     <AuthContext.Provider value={{ tenantId }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);


// 8-10-26

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type AuthContextType = {
  tenantId: string | null;
  tenantName: string | null;
  tenantEmail: string | null;
  apiKey: string | null;

  setAuthData: (
    tenantId: string,
    tenantName: string,
    tenantEmail: string,
    apiKey: string | null
  ) => void;

  clearAuthData: () => void;
};

const AuthContext = createContext<AuthContextType>({
  tenantId: null,
  tenantName: null,
  tenantEmail: null,
  apiKey: null,

  setAuthData: () => {},
  clearAuthData: () => {},
});

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [tenantEmail, setTenantEmail] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    setTenantId(localStorage.getItem("tenant_id"));
    setTenantName(localStorage.getItem("tenant_name"));
    setTenantEmail(localStorage.getItem("tenant_email"));
    setApiKey(localStorage.getItem("api_key"));
  }, []);

  const setAuthData = (
    tenantId: string,
    tenantName: string,
    tenantEmail: string,
    apiKey: string | null
  ) => {
    localStorage.setItem("tenant_id", tenantId);
    localStorage.setItem("tenant_name", tenantName);
    localStorage.setItem("tenant_email", tenantEmail);

    if (apiKey) {
      localStorage.setItem("api_key", apiKey);
    }

    setTenantId(tenantId);
    setTenantName(tenantName);
    setTenantEmail(tenantEmail);
    setApiKey(apiKey);
  };

  const clearAuthData = () => {
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("tenant_name");
    localStorage.removeItem("tenant_email");
    localStorage.removeItem("api_key");

    setTenantId(null);
    setTenantName(null);
    setTenantEmail(null);
    setApiKey(null);
  };

  return (
    <AuthContext.Provider
      value={{
        tenantId,
        tenantName,
        tenantEmail,
        apiKey,
        setAuthData,
        clearAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

function load() {
  try {
    return JSON.parse(localStorage.getItem('auth')) || { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(load);

  const login = (data) => {
    localStorage.setItem('auth', JSON.stringify(data));
    setAuth(data);
  };
  const logout = () => {
    localStorage.removeItem('auth');
    setAuth({ token: null, user: null });
  };

  return <AuthContext.Provider value={{ ...auth, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, getMe } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('elsafeer_token');
      const cachedUser = localStorage.getItem('elsafeer_user');
      if (token && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          const fresh = await getMe();
          setUser(fresh);
          localStorage.setItem('elsafeer_user', JSON.stringify(fresh));
        } catch (err) {
          localStorage.removeItem('elsafeer_token');
          localStorage.removeItem('elsafeer_user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (username, password) => {
    const data = await loginApi(username, password);
    localStorage.setItem('elsafeer_token', data.token);
    localStorage.setItem('elsafeer_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('elsafeer_token');
    localStorage.removeItem('elsafeer_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

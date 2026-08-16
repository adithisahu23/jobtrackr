import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, getErrorMessage } from "../lib/api";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("jobtrackr_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("jobtrackr_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("jobtrackr_token", res.data.token);
      setUser(res.data.user);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }

  async function register(name: string, email: string, password: string) {
    try {
      const res = await api.post("/auth/register", { name, email, password });
      localStorage.setItem("jobtrackr_token", res.data.token);
      setUser(res.data.user);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }

  function logout() {
    localStorage.removeItem("jobtrackr_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

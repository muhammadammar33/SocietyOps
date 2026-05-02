"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreateSocietyAdminPayload,
  CreateSocietyPayload,
  LoginPayload,
  Resident,
  RegisterPayload,
  Society,
  User,
} from "../components/home/types";
import { createApiClient } from "../lib/api";

const TOKEN_KEY = "societyops.token";

type UseAuthResult = {
  token: string;
  user: User | null;
  societies: Society[];
  residents: Resident[];
  isHydrating: boolean;
  isLoading: boolean;
  message: string;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  createSociety: (payload: CreateSocietyPayload) => Promise<void>;
  createSocietyAdmin: (payload: CreateSocietyAdminPayload) => Promise<void>;
  refreshDashboardData: () => Promise<void>;
  logout: () => void;
};

export function useAuth(apiBase: string): UseAuthResult {
  const api = useMemo(() => createApiClient(apiBase), [apiBase]);

  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchSocieties = useCallback(
    async (bearer: string) => {
      try {
        const list = await api.societies(bearer);
        setSocieties(list);
      } catch {
        setSocieties([]);
      }
    },
    [api],
  );

  const fetchResidents = useCallback(
    async (bearer: string) => {
      try {
        const list = await api.residents(bearer);
        setResidents(list);
      } catch {
        setResidents([]);
      }
    },
    [api],
  );

  const restoreSession = useCallback(
    async (bearer: string) => {
      try {
        const me = await api.me(bearer);
        setUser(me);
        await Promise.all([fetchSocieties(bearer), fetchResidents(bearer)]);
        setMessage(`Signed in as ${me.name} (${me.role})`);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
        setSocieties([]);
        setResidents([]);
        setMessage("Session expired. Please sign in again.");
      } finally {
        setIsHydrating(false);
      }
    },
    [api, fetchResidents, fetchSocieties],
  );

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsHydrating(false);
      return;
    }

    setToken(stored);
    void restoreSession(stored);
  }, [restoreSession]);

  const refreshDashboardData = useCallback(async () => {
    if (!token) return;
    await Promise.all([fetchSocieties(token), fetchResidents(token)]);
  }, [fetchResidents, fetchSocieties, token]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsLoading(true);
      try {
        const data = await api.login(payload.phone, payload.password);
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        setToken(data.accessToken);
        setUser(data.user);
        await Promise.all([
          fetchSocieties(data.accessToken),
          fetchResidents(data.accessToken),
        ]);
        setMessage("Login successful.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Login failed");
      } finally {
        setIsLoading(false);
      }
    },
    [api, fetchResidents, fetchSocieties],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsLoading(true);
      try {
        const data = await api.register({
          ...payload,
          role: "RESIDENT_OWNER",
        });
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        setToken(data.accessToken);
        setUser(data.user);
        await Promise.all([
          fetchSocieties(data.accessToken),
          fetchResidents(data.accessToken),
        ]);
        setMessage("Registration successful.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Registration failed");
      } finally {
        setIsLoading(false);
      }
    },
    [api, fetchResidents, fetchSocieties],
  );

  const createSociety = useCallback(
    async (payload: CreateSocietyPayload) => {
      if (!token) {
        setMessage("Please login first.");
        return;
      }

      setIsLoading(true);
      try {
        await api.createSociety(token, payload);
        await refreshDashboardData();
        setMessage(`Society \"${payload.name}\" created successfully.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not create society");
      } finally {
        setIsLoading(false);
      }
    },
    [api, refreshDashboardData, token],
  );

  const createSocietyAdmin = useCallback(
    async (payload: CreateSocietyAdminPayload) => {
      if (!token) {
        setMessage("Please login first.");
        return;
      }

      setIsLoading(true);
      try {
        await api.createSocietyAdmin(token, payload);
        await refreshDashboardData();
        setMessage(`Society admin \"${payload.name}\" assigned successfully.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not assign society admin");
      } finally {
        setIsLoading(false);
      }
    },
    [api, refreshDashboardData, token],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setSocieties([]);
    setResidents([]);
    setIsHydrating(false);
    setMessage("Logged out.");
  }, []);

  return {
    token,
    user,
    societies,
    residents,
    isHydrating,
    isLoading,
    message,
    login,
    register,
    createSociety,
    createSocietyAdmin,
    refreshDashboardData,
    logout,
  };
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, configureApiAuth } from "../api/http";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession
} from "./session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(() => readStoredSession());
  const sessionRef = useRef(session);

  const applySession = useCallback((nextSession) => {
    sessionRef.current = nextSession;
    setSession(nextSession);

    if (nextSession) {
      writeStoredSession(nextSession);
    } else {
      clearStoredSession();
    }
  }, []);

  const clearSession = useCallback(() => {
    applySession(null);
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
  }, [applySession, queryClient]);

  useEffect(() => {
    configureApiAuth({
      getSession: () => sessionRef.current,
      setSession: applySession,
      clearSession
    });
  }, [applySession, clearSession]);

  const meQuery = useQuery({
    queryKey: ["auth", "me", session?.accessToken ?? null],
    enabled: Boolean(session?.accessToken),
    retry: false,
    queryFn: async () => {
      const response = await apiRequest("/user", { auth: true });
      return {
        ...response.data,
        __version: response.eTag ?? response.data?.version ?? null
      };
    }
  });

  useEffect(() => {
    if (meQuery.error?.status === 401) {
      clearSession();
    }
  }, [clearSession, meQuery.error]);

  const login = useCallback(
    async (credentials) => {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: credentials
      });

      applySession(response.data);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });

      return response;
    },
    [applySession, queryClient]
  );

  const logout = useCallback(async () => {
    const activeSession = sessionRef.current;

    try {
      if (activeSession?.refreshToken) {
        await apiRequest("/user/logout", {
          method: "PATCH",
          auth: true,
          body: {
            token: activeSession.refreshToken
          }
        });
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateProfile = useCallback(
    async (payload, version) => {
      const response = await apiRequest("/user", {
        method: "PATCH",
        auth: true,
        body: payload,
        version
      });

      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });

      return response;
    },
    [queryClient]
  );

  const changePassword = useCallback(async (payload, version) => {
    const response = await apiRequest("/user/reset_password", {
      method: "PATCH",
      auth: true,
      body: payload,
      version
    });

    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });

    return response;
  }, [queryClient]);

  const deleteOwnAccount = useCallback(
    async (version) => {
      const response = await apiRequest("/user", {
        method: "DELETE",
        auth: true,
        version
      });

      clearSession();

      return response;
    },
    [clearSession]
  );

  const value = useMemo(() => {
    const user = meQuery.data ?? null;
    const roles = user?.roles ?? [];
    const isAuthenticated = Boolean(session?.accessToken);
    const isAdmin = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");
    const isSuperAdmin = roles.includes("SUPER_ADMIN");

    return {
      session,
      user,
      roles,
      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      isLoadingUser: meQuery.isPending,
      userError: meQuery.error ?? null,
      login,
      logout,
      updateProfile,
      changePassword,
      deleteOwnAccount,
      clearSession,
      refetchUser: meQuery.refetch
    };
  }, [
    changePassword,
    clearSession,
    deleteOwnAccount,
    login,
    logout,
    meQuery.data,
    meQuery.error,
    meQuery.isPending,
    meQuery.refetch,
    session,
    updateProfile
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

"use client";

import { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LoginForm } from "@/components/LoginForm";

const SESSION_KEY = "pm-mvp-session";
const USERNAME = "user";
const PASSWORD = "password";

export const AuthenticatedKanban = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);

  useEffect(() => {
    setIsSignedIn(window.localStorage.getItem(SESSION_KEY) === USERNAME);
    setHasLoadedSession(true);
  }, []);

  const handleLogin = (username: string, password: string) => {
    if (username !== USERNAME || password !== PASSWORD) {
      return false;
    }

    window.localStorage.setItem(SESSION_KEY, username);
    setIsSignedIn(true);
    return true;
  };

  const handleLogout = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setIsSignedIn(false);
  };

  if (!hasLoadedSession) {
    return null;
  }

  if (!isSignedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <KanbanBoard onLogout={handleLogout} />;
};

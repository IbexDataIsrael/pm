"use client";

import { FormEvent, useState } from "react";

type LoginFormProps = {
  onLogin: (username: string, password: string) => boolean;
};

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (onLogin(username, password)) {
      setError("");
      return;
    }

    setError("Use username user and password password.");
  };

  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-12">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <section className="relative w-full max-w-md rounded-[32px] border border-[var(--stroke)] bg-white/85 p-8 shadow-[var(--shadow)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
          Project Management MVP
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--navy-dark)]">
          Sign in
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--gray-text)]">
          Use the MVP credentials to open your Kanban board.
        </p>

        <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--navy-dark)]">
            Username
            <input
              autoComplete="username"
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--primary-blue)]"
              name="username"
              onChange={(event) => setUsername(event.target.value)}
              value={username}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--navy-dark)]">
            Password
            <input
              autoComplete="current-password"
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--primary-blue)]"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <button
            className="rounded-full bg-[var(--secondary-purple)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
            type="submit"
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
};

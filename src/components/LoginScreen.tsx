import React, { useState } from "react";
import { Eye, EyeOff, Loader2, Sun, Moon, Monitor, Lock } from "lucide-react";
import { ThemePreference } from "./Header";

interface LoginScreenProps {
  onLogin: (username: string, pass: string) => Promise<boolean>;
  isChecking: boolean;
  errorMessage: string | null;
  themePref: ThemePreference;
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  isChecking,
  errorMessage,
  themePref,
  onToggleTheme,
}) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const themeLabel =
    themePref === "system"
      ? "System theme"
      : themePref === "dark"
      ? "Dark theme"
      : "Light theme";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChecking) return;

    // Treat usernames as case-insensitive and trim spaces. Passwords are case-sensitive and must not be changed.
    const normalizedUsername = username.trim().toLowerCase();
    const rawPassword = password;

    if (!normalizedUsername || !rawPassword) {
      return;
    }

    const success = await onLogin(normalizedUsername, rawPassword);
    if (!success) {
      // Keep username filled in, clear password for security
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 transition-colors">
      {/* Top right theme toggle */}
      <div className="flex justify-end w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={onToggleTheme}
          title={`Switch theme (current: ${themeLabel})`}
          aria-label={`Switch theme (current: ${themeLabel})`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {themePref === "system" ? (
            <Monitor className="h-4 w-4" aria-hidden="true" />
          ) : themePref === "dark" ? (
            <Moon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Sun className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Centered Login Card */}
      <div className="w-full max-w-md mx-auto my-auto">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="mb-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#3b6fe0] dark:bg-blue-950/60 dark:text-blue-400 mb-3">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Attendance Analytics
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Sign in to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message banner */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-200"
              >
                {errorMessage}
              </div>
            )}

            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                disabled={isChecking}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Password Input with Show/Hide toggle */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={isChecking}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-3.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  disabled={isChecking}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign in button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isChecking || !username.trim() || !password}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#3b6fe0] px-4 text-sm font-semibold text-white hover:bg-[#2f5ec4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors shadow-xs"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer copyright */}
      <footer className="w-full text-center text-xs text-slate-400 dark:text-slate-600 py-2">
        <span>AttendView Analytics · Secure Access</span>
      </footer>
    </div>
  );
};

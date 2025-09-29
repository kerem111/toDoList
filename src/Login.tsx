import { useState } from "react";
import API from "./api";
import { useTheme } from "./hooks/useTheme";

export default function Login({
  onLogin,
}: {
  onLogin: (token: string) => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const path = mode === "login" ? "/login" : "/register";
      const res = await API.post<{ token: string }>(path, {
        username,
        password,
      });
      const { token } = res;
      if (!token) {
        throw new Error("Token missing in response");
      }
      localStorage.setItem("token", token);
      onLogin(token);
    } catch (err: unknown) {
      const fallback = mode === "login" ? "Login failed" : "Register failed";
      let message = fallback;
      if (err instanceof Error) {
        message = err.message || fallback;
      }
      if (
        mode === "register" &&
        (message.includes("409") || /exists/i.test(message))
      ) {
        message = "This user already exists with this email";
      }
      setError(message);
    }
  };

  return (
    <div className="auth-card">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === "light" ? "🌙" : "🌞"}
      </button>
      <h3>{mode === "login" ? "Login" : "Register"}</h3>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          type="password"
        />
        <div className="auth-actions">
          <button className="btn primary" type="submit">
            {mode === "login" ? "Login" : "Register"}
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Switch to Register" : "Switch to Login"}
          </button>
        </div>
      </form>
    </div>
  );
}

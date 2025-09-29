import "./App.css";
import { useEffect, useState } from "react";
import { ToDoList } from "./toDoList";
import Login from "./Login";

function App() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) {
    return (
      <div className="app">
        <Login onLogin={(t) => setToken(t)} />
      </div>
    );
  }

  return (
    <div className="app">
      <button className="btn logout-btn" onClick={handleLogout}>
        <span className="icon" aria-hidden>
          🔒
        </span>
        Log out
      </button>
      <ToDoList />
    </div>
  );
}

export default App;

import { useState } from "react";
import { useTheme } from "./hooks/useTheme";
import useLocalStorage from "use-local-storage";

export function ToDoList() {
  const [tasks, setTasks] = useLocalStorage<string[]>("tasks", []);
  const [newTask, setNewTask] = useState("");
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{
    task: string;
    index: number;
  } | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, newTask]);
    setNewTask("");
  };

  const confirmDelete = (index: number) => {
    setConfirmIndex(index);
  };

  const deleteTask = (index: number) => {
    const deletedTask = tasks[index];
    const updated = [...tasks];
    updated.splice(index, 1);
    setTasks(updated);
    setConfirmIndex(null);

    // save for undo
    setLastDeleted({ task: deletedTask, index });
    setShowUndo(true);

    // hide undo after 5s
    setTimeout(() => setShowUndo(false), 5000);
  };

  const undoDelete = () => {
    if (lastDeleted) {
      const updated = [...tasks];
      updated.splice(lastDeleted.index, 0, lastDeleted.task);
      setTasks(updated);
      setLastDeleted(null);
      setShowUndo(false);
    }
  };

  const updateTasks = (type: string, index: number) => {
    const updated = [...tasks];
    if (type === "up" && index > 0)
      [updated[index - 1], updated[index]] = [
        updated[index],
        updated[index - 1],
      ];
    if (type === "down" && index < tasks.length - 1)
      [updated[index + 1], updated[index]] = [
        updated[index],
        updated[index + 1],
      ];
    setTasks(updated);
  };

  return (
    <div className="to-do-list">
      {/* Theme toggle */}
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === "light" ? "🌙" : "🌞"}
      </button>

      <h1>To-Do-List</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addTask();
        }}
      >
        <input
          type="text"
          placeholder="Enter a task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button className="task-button" data-type="add">
          Add
        </button>
      </form>

      <ol>
        {tasks.map((task, index) => (
          <li key={index}>
            <span className="text">{task}</span>
            <button
              className="task-button"
              data-type="delete"
              onClick={() => confirmDelete(index)}
            >
              Delete
            </button>
            <button
              className="task-button"
              data-type="move"
              onClick={() => updateTasks("up", index)}
            >
              UP
            </button>
            <button
              className="task-button"
              data-type="move"
              onClick={() => updateTasks("down", index)}
            >
              DOWN
            </button>
          </li>
        ))}
      </ol>

      {/* Confirm Modal */}
      {confirmIndex !== null && (
        <div className="modal-overlay">
          <div className="modal">
            <p>
              Are you sure you want to delete{" "}
              <strong>{tasks[confirmIndex]}</strong>?
            </p>
            <div className="modal-actions">
              <button
                className="task-button confirm-btn"
                onClick={() => deleteTask(confirmIndex!)}
              >
                Confirm
              </button>
              <button
                className="task-button cancel-btn"
                onClick={() => setConfirmIndex(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast */}
      {showUndo && lastDeleted && (
        <div className="undo-toast">
          <span>Task deleted</span>
          <button onClick={undoDelete}>Undo</button>
        </div>
      )}
    </div>
  );
}

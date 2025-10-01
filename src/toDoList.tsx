import { useState, useEffect } from "react";
import { useTheme } from "./hooks/useTheme";
import API, { type Task } from "./api";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

export function ToDoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{
    task: Task;
    index: number;
  } | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // İlk açılışta backend'den görevleri çekelim
  useEffect(() => {
    API.get<Task[]>("/tasks")
      .then((data) => setTasks(data))
      .catch((err) => console.error(err));
  }, []);

  const addTask = async () => {
    if (!newTask.trim()) return;

    const created = await API.post<Task>("/tasks", { text: newTask });
    // Server returns tasks ordered by newest first; keep UI consistent by prepending
    setTasks([created, ...tasks]);
    setNewTask("");
  };

  const confirmDelete = (index: number) => {
    setConfirmIndex(index);
  };

  const deleteTask = async (index: number) => {
    const taskToDelete = tasks[index];

    await API.delete<void>(`/tasks/${taskToDelete.id}`);

    const updated = [...tasks];
    updated.splice(index, 1);
    setTasks(updated);
    setConfirmIndex(null);

    setLastDeleted({ task: taskToDelete, index });
    setShowUndo(true);

    setTimeout(() => setShowUndo(false), 5000);
  };

  const undoDelete = async () => {
    if (lastDeleted) {
      const restored = await API.post<Task>("/tasks", {
        text: lastDeleted.task.text,
      });
      const updated = [...tasks];
      updated.splice(lastDeleted.index, 0, restored);
      setTasks(updated);

      setLastDeleted(null);
      setShowUndo(false);
    }
  };

  // Drag & Drop işlevi
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const updated = Array.from(tasks);
    const [moved] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, moved);

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

      {/* Drag & Drop listesi */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <ol {...provided.droppableProps} ref={provided.innerRef}>
              {tasks.map((task, index) => (
                <Draggable
                  key={task.id}
                  draggableId={task.id.toString()}
                  index={index}
                >
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <span className="text">{task.text}</span>
                      <button
                        className="task-button"
                        data-type="delete"
                        onClick={() => confirmDelete(index)}
                      >
                        Delete
                      </button>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ol>
          )}
        </Droppable>
      </DragDropContext>

      {/* Confirm Modal */}
      {confirmIndex !== null && (
        <div className="modal-overlay">
          <div className="modal">
            <p>
              Are you sure you want to delete{" "}
              <strong>{tasks[confirmIndex].text}</strong>?
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

import React, { useState, useEffect } from "react";

const BASE_URL = "https://playground.4geeks.com/todo";
const USERNAME = "Avilacarlosdev";

// Tareas iniciales que se mostrarán al abrir la app
const INITIAL_TASKS = [
  { label: "Make the bed", done: false },
  { label: "Walk the dog", done: false },
  { label: "Do the replits", done: false },
];

const Home = () => {
  const [nuevaTarea, setNuevaTarea] = useState("");
  // Initialize with initial tasks so they show immediately
  const [listTareas, setListTareas] = useState(
    INITIAL_TASKS.map((task, index) => ({
      id: `initial-${index}`,
      label: task.label,
      done: task.done,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasUsedClearAll, setHasUsedClearAll] = useState(false);

  // Function to get all user tasks
  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_URL}/users/${USERNAME}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // If user doesn't exist, create with initial tasks
        if (response.status === 404) {
          await createUserWithInitialTasks();
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Normalize received data
      let todos = [];
      if (Array.isArray(data)) {
        todos = data;
      } else if (data && Array.isArray(data.todos)) {
        todos = data.todos;
      }

      // Normalize each task to ensure it has id, label and done
      const normalizedTodos = todos.map((todo, index) => ({
        id: todo.id || `task-${index}`,
        label: todo.label || todo.text || String(todo),
        done: Boolean(todo.done),
      }));

      // If we have tasks from server, use them
      if (normalizedTodos.length > 0) {
        setListTareas(normalizedTodos);
      } else if (!hasUsedClearAll) {
        // If no tasks from server and Clear All hasn't been used, keep initial tasks
        setListTareas(
          INITIAL_TASKS.map((task, index) => ({
            id: `initial-${index}`,
            label: task.label,
            done: task.done,
          }))
        );
      } else {
        // If Clear All was used, show empty list
        setListTareas([]);
      }
    } catch (err) {
      console.error("Error fetching todos:", err);
      setError("Error loading tasks. Showing initial tasks.");
      // In case of error, keep showing initial tasks (they're already displayed)
    } finally {
      setLoading(false);
    }
  };

  // Function to create user with initial tasks
  const createUserWithInitialTasks = async () => {
    try {
      const response = await fetch(`${BASE_URL}/users/${USERNAME}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(INITIAL_TASKS),
      });

      if (!response.ok) {
        throw new Error(`Error creating user: ${response.status}`);
      }

      // After creating user, load tasks
      await fetchTodos();
    } catch (err) {
      console.error("Error creating user:", err);
      setError("Error creating user. Showing initial tasks.");
      // Initial tasks are already displayed, no need to set them again
    }
  };

  // Function to add a new task
  const handleAddTask = async () => {
    const taskText = nuevaTarea.trim();
    if (!taskText) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_URL}/todos/${USERNAME}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: taskText,
          done: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error adding task: ${response.status}`);
      }

      // Reload all tasks from server
      await fetchTodos();
      setNuevaTarea("");
    } catch (err) {
      console.error("Error adding task:", err);
      setError("Error adding task");
    } finally {
      setLoading(false);
    }
  };

  // Function to delete an individual task
  const deleteTask = async (taskId) => {
    try {
      setLoading(true);
      setError(null);

      // Check if it's an initial task (has 'initial-' prefix)
      const isInitialTask = taskId.startsWith("initial-");

      if (isInitialTask) {
        // For initial tasks, just remove from local state
        setListTareas((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        );
      } else {
        // For server tasks, delete from server
        const response = await fetch(`${BASE_URL}/todos/${taskId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Error deleting task: ${response.status}`);
        }

        // Reload all tasks from server
        await fetchTodos();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Error deleting task");
    } finally {
      setLoading(false);
    }
  };

  // Function to clear all tasks
  const clearAllTasks = async () => {
    if (listTareas.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      // Delete user (this will delete all their tasks)
      const deleteResponse = await fetch(`${BASE_URL}/users/${USERNAME}`, {
        method: "DELETE",
      });

      // It doesn't matter if user doesn't exist (404), proceed to create empty one

      // Create new user with empty list
      const createResponse = await fetch(`${BASE_URL}/users/${USERNAME}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([]),
      });

      if (!createResponse.ok) {
        throw new Error(`Error clearing tasks: ${createResponse.status}`);
      }

      // Update local state - clear all tasks and mark that Clear All was used
      setListTareas([]);
      setHasUsedClearAll(true);
    } catch (err) {
      console.error("Error clearing tasks:", err);
      setError("Error clearing all tasks");
    } finally {
      setLoading(false);
    }
  };

  // useEffect para cargar las tareas al montar el componente
  useEffect(() => {
    fetchTodos();
  }, []);

  const handleChange = (e) => setNuevaTarea(e.target.value);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleAddTask();
    }
  };

  return (
    <div className="d-flex flex-column align-items-center min-vh-100 py-5 todo-page">
      <h1 className="todo-title">Todo List with React + Fetch</h1>

      {/* Mostrar mensaje de error si existe */}
      {error && (
        <div className="alert alert-warning w-75 w-md-50" role="alert">
          {error}
        </div>
      )}

      <div className="card todo-card w-75 w-md-50 shadow-sm">
        {/* Input para agregar nueva tarea */}
        <div className="card-body p-0">
          <input
            className="form-control todo-input"
            placeholder="What needs to be done?"
            value={nuevaTarea}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
            aria-label="Add task"
          />
        </div>

        {/* Lista de tareas */}
        <ul className="list-group list-group-flush">
          {loading ? (
            <li className="list-group-item text-center text-muted py-4">
              <div
                className="spinner-border spinner-border-sm me-2"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              Loading...
            </li>
          ) : listTareas.length === 0 ? (
            <li className="list-group-item text-center text-muted py-4">
              No tasks, add some!
            </li>
          ) : (
            listTareas.map((tarea) => (
              <li
                key={tarea.id}
                className="list-group-item d-flex justify-content-between align-items-center todo-item"
              >
                <span className="todo-text">{tarea.label}</span>
                <button
                  className="btn delete-btn"
                  onClick={() => deleteTask(tarea.id)}
                  disabled={loading}
                  aria-label={`Delete ${tarea.label}`}
                  title="Delete task"
                >
                  &times;
                </button>
              </li>
            ))
          )}
        </ul>

        {/* Footer con contador y botón clear all */}
        <div className="card-footer text-muted small py-2 px-3 d-flex justify-content-between align-items-center">
          <span>
            {listTareas.length} item{listTareas.length !== 1 ? "s" : ""} left
          </span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={clearAllTasks}
            disabled={loading || listTareas.length === 0}
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;

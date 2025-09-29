import React, { useState } from "react";

const Home = () => {
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [listTareas, setListTareas] = useState([
    "Make the bed",
    "Wash my hands",
    "Eat",
    "Walk the dog",
  ]);

  const handleClick = () => {
    const value = nuevaTarea.trim();
    if (!value) return;
    setListTareas([...listTareas, value]);
    setNuevaTarea("");
  };

  const deleteTarea = (index) => {
    setListTareas(listTareas.filter((_, i) => i !== index));
  };

  const handleChange = (e) => setNuevaTarea(e.target.value);

  return (
    <div className="d-flex flex-column align-items-center min-vh-100 py-5 todo-page">
      <h1 className="todo-title">Todo List with React</h1>

      <div className="card todo-card w-75 w-md-50 shadow-sm">
        {/* input como primer elemento del card/lista */}
        <div className="card-body p-0">
          <input
            className="form-control todo-input"
            placeholder="What needs to be done?"
            value={nuevaTarea}
            onChange={handleChange}
            onKeyDown={(e) => e.key === "Enter" && handleClick()}
            aria-label="Add task"
          />
        </div>

        <ul className="list-group list-group-flush">
          {listTareas.length === 0 ? (
            <li className="list-group-item text-center text-muted py-4">
              No tasks, add some
            </li>
          ) : (
            listTareas.map((tarea, index) => (
              <li
                key={index}
                className="list-group-item d-flex justify-content-between align-items-center todo-item"
              >
                <span className="todo-text">{tarea}</span>
                <button
                  className="btn delete-btn"
                  onClick={() => deleteTarea(index)}
                  aria-label={`Delete ${tarea}`}
                >
                  &times;
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="card-footer text-muted small py-2 px-3">
          {listTareas.length} item{listTareas.length !== 1 ? "s" : ""} left
        </div>
      </div>
    </div>
  );
};

export default Home;

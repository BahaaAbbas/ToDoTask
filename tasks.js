const API_URL = "https://dummyjson.com/todos";
let mainTodos = [];
let selectedRowToDelete = null;

const tbody = document.querySelector(".todo-table tbody");
const formTodo = document.getElementById("todo-form");
const todoText = formTodo.querySelector('[name="text"]');
const searchField = document.getElementById("search");
const popup = document.querySelector(".popup-overlay");
const cancelBtn = document.querySelector(".popup-btn .cancel");
const deleteBtn = document.querySelector(".popup-btn .delete");

// Local stoagre
if (localStorage.getItem("todos") != null) {
  mainTodos = JSON.parse(localStorage.getItem("todos"));
  UpToDateTasks(mainTodos);
  console.log(mainTodos);
} else {
  fetchTodos();
}

// Fetch from URL
async function fetchTodos() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to fetch todos");
    }

    const data = await response.json();
    mainTodos = data.todos;
    localStorage.setItem("todos", JSON.stringify(mainTodos));
    UpToDateTasks(mainTodos);
  } catch (error) {
    console.error(error);
  }
}

// Up to date Tasks
function UpToDateTasks(tasksArray) {
  tbody.innerHTML = "";

  tasksArray.forEach((task) => {
    const row = document.createElement("tr");

    row.dataset.id = task.id;

    row.innerHTML = `
      <td class="status ${task.completed ? "complete" : "pending"}">
        ${task.completed ? "completed" : "pending"}
      </td>
    <td>${task.id}</td>
      <td>${task.userId}</td>
    
      <td class="task">
        <div class="task-content ${task.completed ? "completed-task" : ""}" >
          ${task.todo}
        </div>
      </td>
      <td>
        <i class="fa-solid fa-check ${task.completed ? "disabled" : ""}"></i>
        <i class="fa-solid fa-xmark"></i>
      </td>
    `;

    tbody.appendChild(row);
  });

  updateStats(tasksArray);
}

// Tasks stats
function updateStats(tasks) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  const values = [totalTasks, completedTasks, pendingTasks];

  document.querySelectorAll(".box-info .box-value").forEach((ele, i) => {
    ele.textContent = values[i];
  });

  document
    .querySelectorAll(".footer-summary .summary-text span")
    .forEach((el, i) => {
      el.textContent = values[i];
    });
}

// search
searchField.addEventListener("input", () => {
  const text = searchField.value.toLowerCase();
  const searchedTasks = mainTodos.filter((task) => {
    return task.todo.toLowerCase().includes(text);
  });

  console.log(searchedTasks);
  UpToDateTasks(searchedTasks);
});

// form adding tasks
formTodo.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = todoText.value.trim();

  if (!text) {
    Swal.fire({
      icon: "error",
      title: "Empty Task Bro..",
      text: "Can't add empty task!",
    });

    return;
  }

  if (
    mainTodos.some((task) => task.todo.toLowerCase() === text.toLowerCase())
  ) {
    Swal.fire({
      icon: "error",
      title: "Duplicate Task",
      text: "Task Already Exist Lil Bro..",
    });
    todoText.value = "";

    return;
  }

  const newTask = {
    id: mainTodos.length + 1,
    todo: text,
    completed: false,
    userId: Math.floor(Math.random() * 500 + 1),
  };

  try {
    const response = await fetch(`${API_URL}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    });

    if (!response.ok) throw new Error("Failed to add task");
    mainTodos.push(newTask);
    UpToDateTasks(mainTodos);
    const newRow = tbody.lastElementChild;
    newRow.scrollIntoView({ behavior: "smooth", block: "end" });
    localStorage.setItem("todos", JSON.stringify(mainTodos));
    todoText.value = "";
    searchField.value = "";
  } catch (error) {
    console.error(error);
  }
});

tbody.addEventListener("click", (event) => {
  const row = event.target.closest("tr");
  if (!row) return;

  const taskId = parseInt(row.dataset.id);
  const task = mainTodos.find((task) => task.id === taskId);
  const statusText = row.querySelector(".status");
  const taskContent = row.querySelector(".task-content");
  const checkIcon = row.querySelector(".fa-check");

  if (event.target.classList.contains("fa-check")) {
    if (!task.completed) {
      task.completed = true;
      checkIcon.classList.add("disabled");
      taskContent.classList.add("completed-task");
      statusText.textContent = "completed";
    }
  }

  if (event.target.classList.contains("fa-xmark")) {
    selectedRowToDelete = row;
    popup.style.display = "block";
  }

  updateStatusClass(statusText);
  updateStats(mainTodos);
  localStorage.setItem("todos", JSON.stringify(mainTodos));
});

tbody.addEventListener("dblclick", (event) => {
  const taskContent = event.target.closest(".task-content");

  if (!taskContent) return;

  const row = event.target.closest("tr");
  const taskId = parseInt(row.dataset.id);
  const task = mainTodos.find((task) => {
    return task.id === taskId;
  });
  const statusText = row.querySelector(".status");
  const checkIcon = row.querySelector(".fa-check");

  if (task.completed) {
    task.completed = false;
    checkIcon.classList.remove("disabled");
    taskContent.classList.remove("completed-task");
    statusText.textContent = "pending";
    updateStatusClass(statusText);
    updateStats(mainTodos);
    localStorage.setItem("todos", JSON.stringify(mainTodos));

    taskContent.contentEditable = "true";
    taskContent.focus();

    fetch(`https://dummyjson.com/todos/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: false }),
    }).catch((error) => console.error("Failed to update task status:", error));
  } else {
    taskContent.contentEditable = "true";
    taskContent.focus();
  }

  const saveEdit = async () => {
    const newText = taskContent.textContent.trim();
    if (newText && newText !== task.todo) {
      task.todo = newText;

      try {
        await fetch(`https://dummyjson.com/todos/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ todo: newText }),
        });
      } catch (error) {
        console.error("Error updating task:", error);
      }

      localStorage.setItem("todos", JSON.stringify(mainTodos));
    }

    taskContent.contentEditable = "false";
  };

  const handleKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      taskContent.blur();
    }
  };

  taskContent.addEventListener("blur", saveEdit, { once: true });
  taskContent.addEventListener("keydown", handleKey);
});

function updateStatusClass(statusEl) {
  const isCompleted = statusEl.textContent.trim().toLowerCase() === "completed";
  statusEl.classList.toggle("complete", isCompleted);
  statusEl.classList.toggle("pending", !isCompleted);
}

// Popup delete handlers
cancelBtn.addEventListener("click", () => {
  popup.style.display = "none";
  selectedRowToDelete = null;
});

deleteBtn.addEventListener("click", async () => {
  if (!selectedRowToDelete) return;

  const taskId = parseInt(selectedRowToDelete.dataset.id);

  try {
    const response = await fetch(`${API_URL}/${taskId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete the task");
    }

    mainTodos = mainTodos.filter((task) => {
      return task.id !== taskId;
    });

    mainTodos = mainTodos.map((task, index) => {
      return { ...task, id: index + 1 };
    });

    localStorage.setItem("todos", JSON.stringify(mainTodos));
    UpToDateTasks(mainTodos);
  } catch (error) {
    console.error("Error deleting task:", error);

    Swal.fire({
      icon: "warning",
      title: "Oops...",
      text: "Failed to delete task.",
    });
  } finally {
    popup.style.display = "none";
    selectedRowToDelete = null;
  }
});

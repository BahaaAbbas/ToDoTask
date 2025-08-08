const API_URL = "https://dummyjson.com/todos";
let mainTodos = [];

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
  } catch (error) {}
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

// fourm adding tasks
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
    console.error(err);
  }
});

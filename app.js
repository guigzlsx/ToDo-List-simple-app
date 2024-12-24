class TodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    this.currentFilter = "all";
    this.categories = new Set();
    this.darkMode = localStorage.getItem("darkMode") === "true";
    this.pomodoroInterval = null;
    this.pomodoroTime = 25 * 60; // 25 minutes in seconds
    this.init();
  }

  init() {
    // DOM elements
    this.taskInput = document.getElementById("taskInput");
    this.taskList = document.getElementById("taskList");
    this.addButton = document.getElementById("addButton");
    this.darkModeToggle = document.getElementById("darkModeToggle");
    this.exportButton = document.getElementById("exportTasks");
    this.searchBox = document.querySelector(".search-box");
    this.taskPriority = document.getElementById("taskPriority");
    this.taskCategory = document.getElementById("taskCategory");
    this.taskDueDate = document.getElementById("taskDueDate");
    this.pomodoroTimer = document.getElementById("pomodoroTimer");
    this.startPomodoroBtn = document.getElementById("startPomodoro");
    this.pomodoroPopupToggle = document.getElementById("pomodoroPopupToggle");
    this.pomodoroPopup = document.querySelector(".pomodoro-popup");
    this.closePomodoroPopupBtn = document.querySelector(
      ".pomodoro-popup .close-btn"
    );

    this.setupEventListeners();
    this.renderTasks();
    this.applyDarkMode();
    this.updateStats();
    this.updateCategories(); // Moved here to ensure everything is initialized
  }

  setupEventListeners() {
    if (this.addButton) {
      this.addButton.addEventListener("click", () => this.addTask());
    }
    if (this.taskInput) {
      this.taskInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.addTask();
      });
    }
    const filters = document.querySelector(".filters");
    if (filters) {
      filters.addEventListener("click", (e) => {
        if (e.target.classList.contains("filter-btn")) {
          this.setFilter(e.target.dataset.filter);
        }
      });
    }
    if (this.darkModeToggle) {
      this.darkModeToggle.addEventListener("click", () =>
        this.toggleDarkMode()
      );
    }
    if (this.exportButton) {
      this.exportButton.addEventListener("click", () => this.exportTasks());
    }
    if (this.searchBox) {
      this.searchBox.addEventListener("input", () => this.filterTasks());
    }
    if (this.startPomodoroBtn) {
      this.startPomodoroBtn.addEventListener("click", () =>
        this.togglePomodoro()
      );
    }
    const startTimer = document.getElementById("startTimer");
    if (startTimer) {
      startTimer.addEventListener("click", () => this.startPomodoro());
    }
    const resetTimer = document.getElementById("resetTimer");
    if (resetTimer) {
      resetTimer.addEventListener("click", () => {
        this.stopPomodoro();
        this.pomodoroTime = 25 * 60;
        this.updatePomodoroDisplay();
      });
    }
    if (this.pomodoroPopupToggle) {
      this.pomodoroPopupToggle.addEventListener("click", () =>
        this.togglePomodoroPopup()
      );
    }
    if (this.closePomodoroPopupBtn) {
      this.closePomodoroPopupBtn.addEventListener("click", () =>
        this.togglePomodoroPopup()
      );
    }
  }

  togglePomodoroPopup() {
    this.pomodoroPopup.classList.toggle("active");
  }

  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  updateCategories() {
    // Update the set of categories
    this.categories = new Set(
      this.tasks.map((task) => task.category).filter(Boolean)
    );

    // Update the display of categories
    const categoriesList = document.querySelector(".categories-list");
    if (categoriesList) {
      categoriesList.innerHTML = "<h3>Categories</h3>";
      this.categories.forEach((category) => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.textContent = category;
        btn.addEventListener("click", () => this.filterByCategory(category));
        categoriesList.appendChild(btn);
      });
    }
  }

  addTask() {
    const text = this.taskInput.value.trim();
    if (text) {
      const task = {
        id: Date.now(),
        text,
        completed: false,
        createdAt: new Date(),
        priority: this.taskPriority.value,
        category: this.taskCategory.value.trim(),
        dueDate: this.taskDueDate.value,
        subTasks: [],
      };

      this.tasks.push(task);
      this.saveTasks();
      this.resetInputs();
      this.renderTasks();
      this.updateStats();
      this.updateCategories();
    }
  }

  updateStats() {
    const stats = {
      total: this.tasks.length,
      completed: this.tasks.filter((task) => task.completed).length,
      high: this.tasks.filter((task) => task.priority === "high").length,
      medium: this.tasks.filter((task) => task.priority === "medium").length,
      low: this.tasks.filter((task) => task.priority === "low").length,
      overdue: this.tasks.filter((task) => {
        if (!task.dueDate || task.completed) return false;
        return new Date(task.dueDate) < new Date();
      }).length,
    };

    const statsElement = document.getElementById("taskStats");
    if (statsElement) {
      statsElement.innerHTML = `
              <p>Total: ${stats.total}</p>
              <p>Completed: ${stats.completed}</p>
              <p>High Priority: ${stats.high}</p>
              <p>Medium Priority: ${stats.medium}</p>
              <p>Low Priority: ${stats.low}</p>
              <p>Overdue: ${stats.overdue}</p>
          `;
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((task) => task.id !== id);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();
    this.updateCategories();
  }

  editTask(id) {
    const task = this.tasks.find((task) => task.id === id);
    if (task) {
      const newText = prompt("Edit task:", task.text);
      const newCategory = prompt("Edit category:", task.category);
      const newPriority = prompt(
        "Edit priority (low/medium/high):",
        task.priority
      );
      const newDueDate = prompt("Edit due date (YYYY-MM-DD):", task.dueDate);

      if (newText !== null) task.text = newText.trim();
      if (newCategory !== null) task.category = newCategory.trim();
      if (
        newPriority !== null &&
        ["low", "medium", "high"].includes(newPriority)
      ) {
        task.priority = newPriority;
      }
      if (newDueDate !== null) task.dueDate = newDueDate;

      this.saveTasks();
      this.updateCategories();
      this.renderTasks();
      this.updateStats();
    }
  }

  toggleTask(id) {
    const task = this.tasks.find((task) => task.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
    }
  }

  filterTasks() {
    const searchTerm = this.searchBox.value.toLowerCase();
    const filteredTasks = this.tasks.filter(
      (task) =>
        task.text.toLowerCase().includes(searchTerm) ||
        (task.category && task.category.toLowerCase().includes(searchTerm))
    );
    this.renderFilteredTasks(filteredTasks);
  }

  filterByCategory(category) {
    this.renderFilteredTasks(
      this.tasks.filter((task) => task.category === category)
    );
  }

  setFilter(filter) {
    this.currentFilter = filter;
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    this.renderTasks();
  }

  getFilteredTasks() {
    let filteredTasks = [...this.tasks];

    switch (this.currentFilter) {
      case "active":
        filteredTasks = filteredTasks.filter((task) => !task.completed);
        break;
      case "completed":
        filteredTasks = filteredTasks.filter((task) => task.completed);
        break;
    }

    // Sort by priority and due date
    return filteredTasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return 0;
    });
  }

  renderTasks() {
    const filteredTasks = this.getFilteredTasks();
    this.renderFilteredTasks(filteredTasks);
  }

  renderFilteredTasks(tasks) {
    this.taskList.innerHTML = "";
    tasks.forEach((task) => {
      const li = this.createTaskElement(task);
      this.taskList.appendChild(li);
    });
  }

  createTaskElement(task) {
    const li = document.createElement("li");
    li.className = `task-item priority-${task.priority}`;

    // Check if the task is overdue
    const isOverdue =
      task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

    li.innerHTML = `
          <input type="checkbox" class="task-checkbox" ${
            task.completed ? "checked" : ""
          }>
          <div class="task-content">
              <span class="task-text ${task.completed ? "completed" : ""} ${
      isOverdue ? "overdue" : ""
    }">${task.text}</span>
              ${
                task.category
                  ? `<span class="task-category">${task.category}</span>`
                  : ""
              }
              ${
                task.dueDate
                  ? `<span class="task-date ${
                      isOverdue ? "overdue" : ""
                    }">${new Date(task.dueDate).toLocaleDateString()}</span>`
                  : ""
              }
          </div>
          <div class="task-actions">
              <button class="edit-btn">Edit</button>
              <button class="delete-btn">Delete</button>
          </div>
      `;

    this.setupTaskEventListeners(li, task);
    return li;
  }

  setupTaskEventListeners(li, task) {
    li.querySelector(".task-checkbox").addEventListener("change", () =>
      this.toggleTask(task.id)
    );
    li.querySelector(".edit-btn").addEventListener("click", () =>
      this.editTask(task.id)
    );
    li.querySelector(".delete-btn").addEventListener("click", () =>
      this.deleteTask(task.id)
    );
  }

  togglePomodoro() {
    this.pomodoroTimer.classList.toggle("hidden");
    if (this.pomodoroInterval) {
      this.stopPomodoro();
    }
  }

  startPomodoro() {
    if (this.pomodoroInterval) return;

    this.pomodoroTime = 25 * 60;
    this.updatePomodoroDisplay();

    this.pomodoroInterval = setInterval(() => {
      this.pomodoroTime--;
      this.updatePomodoroDisplay();

      if (this.pomodoroTime <= 0) {
        this.stopPomodoro();
        alert("Time's up! Take a break.");
      }
    }, 1000);
  }

  stopPomodoro() {
    if (this.pomodoroInterval) {
      clearInterval(this.pomodoroInterval);
      this.pomodoroInterval = null;
    }
  }

  updatePomodoroDisplay() {
    const minutes = Math.floor(this.pomodoroTime / 60);
    const seconds = this.pomodoroTime % 60;
    const display = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
    document.querySelector(".timer").textContent = display;
  }

  resetInputs() {
    this.taskInput.value = "";
    this.taskCategory.value = "";
    this.taskDueDate.value = "";
    this.taskPriority.value = "low";
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem("darkMode", this.darkMode);
    this.applyDarkMode();
  }

  applyDarkMode() {
    document.body.classList.toggle("dark-mode", this.darkMode);
  }

  exportTasks() {
    const dataStr = JSON.stringify(this.tasks, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `tasks_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  const todoApp = new TodoApp();
});

document.getElementById("menuToggle").addEventListener("click", () => {
  const menuOptions = document.getElementById("menuOptions");
  const isVisible = menuOptions.style.display === "flex";
  menuOptions.style.display = isVisible ? "none" : "flex";
});

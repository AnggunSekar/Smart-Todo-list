let todos = JSON.parse(localStorage.getItem("smartTodos")) || []
let currentFilter = "all"
let currentPriority = "medium"
let editingIndex = -1

// Declare elements globally but initialize them after DOM loads
let todoForm, todoInput, todoList, emptyState, clearCompleted, editModal, editInput

document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM elements
  todoForm = document.getElementById("todoForm")
  todoInput = document.getElementById("todoInput")
  todoList = document.getElementById("todoList")
  emptyState = document.getElementById("emptyState")
  clearCompleted = document.getElementById("clearCompleted")
  editModal = document.getElementById("editModal")
  editInput = document.getElementById("editInput")

  // Check if all elements exist
  if (!todoForm || !todoInput || !todoList) {
    console.error("Required DOM elements not found!")
    return
  }

  createParticles()
  renderTodos()
  updateStats()
  setupEventListeners()

  // Focus on input after everything is loaded
  setTimeout(() => {
    todoInput.focus()
  }, 100)
})

function createParticles() {
  const particlesContainer = document.getElementById("particles")
  if (!particlesContainer) return

  const particleCount = window.innerWidth < 768 ? 15 : 30

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div")
    particle.className = "particle"

    const size = Math.random() * 4 + 2
    particle.style.width = size + "px"
    particle.style.height = size + "px"
    particle.style.left = Math.random() * 100 + "%"
    particle.style.top = Math.random() * 100 + "%"
    particle.style.animationDelay = Math.random() * 6 + "s"
    particle.style.animationDuration = Math.random() * 3 + 3 + "s"

    particlesContainer.appendChild(particle)
  }
}

function setupEventListeners() {
  // Form submission event
  if (todoForm) {
    todoForm.addEventListener("submit", handleAddTodo)
  }

  // Priority buttons
  document.querySelectorAll(".priority-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".priority-btn").forEach((b) => b.classList.remove("active"))
      this.classList.add("active")
      currentPriority = this.dataset.priority
    })
  })

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"))
      this.classList.add("active")
      currentFilter = this.dataset.filter
      renderTodos()
    })
  })

  // Modal events
  if (editModal) {
    editModal.addEventListener("click", (e) => {
      if (e.target === editModal) {
        closeEditModal()
      }
    })
  }

  // Keyboard events
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeEditModal()
    }
  })

  // Edit input events
  if (editInput) {
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveEdit()
      } else if (e.key === "Escape") {
        closeEditModal()
      }
    })
  }
}

function handleAddTodo(e) {
  e.preventDefault()

  if (!todoInput) {
    console.error("Todo input not found!")
    return
  }

  const text = todoInput.value.trim()

  if (text) {
    const newTodo = {
      id: Date.now(),
      text: text,
      completed: false,
      priority: currentPriority,
      createdAt: new Date().toISOString(),
      completedAt: null,
    }

    todos.unshift(newTodo)
    saveTodos()
    renderTodos()
    updateStats()

    // Clear input
    todoInput.value = ""

    // Success animation
    const addBtn = document.querySelector(".add-btn")
    if (addBtn) {
      addBtn.classList.add("success-animation")
      setTimeout(() => addBtn.classList.remove("success-animation"), 300)
    }

    showNotification("Tugas berhasil ditambahkan!", "success")
  }
}

function renderTodos() {
  if (!todoList || !emptyState) return

  const filteredTodos = getFilteredTodos()

  if (filteredTodos.length === 0) {
    todoList.style.display = "none"
    emptyState.style.display = "block"
    if (clearCompleted) clearCompleted.style.display = "none"
  } else {
    todoList.style.display = "block"
    emptyState.style.display = "none"

    todoList.innerHTML = ""

    filteredTodos.forEach((todo, index) => {
      const li = document.createElement("li")
      li.className = `todo-item ${todo.completed ? "completed" : ""}`
      li.style.animationDelay = `${index * 0.1}s`

      li.innerHTML = `
        <div class="todo-content">
          <div class="todo-checkbox ${todo.completed ? "checked" : ""}" onclick="toggleTodo(${todo.id})">
            ${todo.completed ? '<i class="fas fa-check"></i>' : ""}
          </div>
          <div class="priority-indicator priority-${todo.priority}"></div>
          <span class="todo-text" onclick="toggleTodo(${todo.id})">${escapeHtml(todo.text)}</span>
          <div class="todo-actions">
            <button class="action-btn edit-btn" onclick="openEditModal(${todo.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" onclick="deleteTodo(${todo.id})" title="Hapus">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `

      todoList.appendChild(li)
    })

    const hasCompleted = todos.some((todo) => todo.completed)
    if (clearCompleted) {
      clearCompleted.style.display = hasCompleted ? "block" : "none"
    }
  }
}

function getFilteredTodos() {
  switch (currentFilter) {
    case "completed":
      return todos.filter((todo) => todo.completed)
    case "pending":
      return todos.filter((todo) => !todo.completed)
    default:
      return todos
  }
}

function toggleTodo(id) {
  const todoIndex = todos.findIndex((todo) => todo.id === id)
  if (todoIndex !== -1) {
    todos[todoIndex].completed = !todos[todoIndex].completed
    todos[todoIndex].completedAt = todos[todoIndex].completed ? new Date().toISOString() : null

    saveTodos()
    renderTodos()
    updateStats()

    const message = todos[todoIndex].completed ? "Tugas selesai!" : "Tugas dibatalkan"
    const type = todos[todoIndex].completed ? "success" : "info"
    showNotification(message, type)
  }
}

function openEditModal(id) {
  const todo = todos.find((todo) => todo.id === id)
  if (todo && editModal && editInput) {
    editingIndex = id
    editInput.value = todo.text
    editModal.style.display = "block"
    editInput.focus()
    editInput.select()
  }
}

function closeEditModal() {
  if (editModal && editInput) {
    editModal.style.display = "none"
    editingIndex = -1
    editInput.value = ""
  }
}

function saveEdit() {
  const newText = editInput ? editInput.value.trim() : ""
  if (newText && editingIndex !== -1) {
    const todoIndex = todos.findIndex((todo) => todo.id === editingIndex)
    if (todoIndex !== -1) {
      todos[todoIndex].text = newText
      saveTodos()
      renderTodos()
      closeEditModal()
      showNotification("Tugas berhasil diupdate!", "success")
    }
  }
}

function deleteTodo(id) {
  if (confirm("Yakin ingin menghapus tugas ini?")) {
    todos = todos.filter((todo) => todo.id !== id)
    saveTodos()
    renderTodos()
    updateStats()
    showNotification("Tugas berhasil dihapus!", "error")
  }
}

function clearCompletedTasks() {
  const completedCount = todos.filter((todo) => todo.completed).length
  if (completedCount > 0 && confirm(`Hapus ${completedCount} tugas yang sudah selesai?`)) {
    todos = todos.filter((todo) => !todo.completed)
    saveTodos()
    renderTodos()
    updateStats()
    showNotification(`${completedCount} tugas berhasil dihapus!`, "success")
  }
}

function updateStats() {
  const total = todos.length
  const completed = todos.filter((todo) => todo.completed).length
  const pending = total - completed

  const totalElement = document.getElementById("totalTasks")
  const completedElement = document.getElementById("completedTasks")
  const pendingElement = document.getElementById("pendingTasks")

  if (totalElement) totalElement.textContent = total
  if (completedElement) completedElement.textContent = completed
  if (pendingElement) pendingElement.textContent = pending

  animateNumber("totalTasks", total)
  animateNumber("completedTasks", completed)
  animateNumber("pendingTasks", pending)
}

function animateNumber(elementId, targetNumber) {
  const element = document.getElementById(elementId)
  if (element) {
    element.style.transform = "scale(1.2)"
    setTimeout(() => {
      element.style.transform = "scale(1)"
    }, 200)
  }
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 10px;
    color: white;
    font-weight: 500;
    z-index: 1001;
    animation: slideInRight 0.3s ease-out;
    max-width: 280px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    font-size: 0.85rem;
  `

  switch (type) {
    case "success":
      notification.style.background = "linear-gradient(135deg, #4CAF50, #45a049)"
      break
    case "error":
      notification.style.background = "linear-gradient(135deg, #F44336, #d32f2f)"
      break
    default:
      notification.style.background = "linear-gradient(135deg, #667eea, #764ba2)"
  }

  notification.textContent = message
  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease-in"
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

function saveTodos() {
  try {
    localStorage.setItem("smartTodos", JSON.stringify(todos))
  } catch (error) {
    console.error("Error saving todos:", error)
    showNotification("Error menyimpan data!", "error")
  }
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// Add CSS animations
const style = document.createElement("style")
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }
`
document.head.appendChild(style)

// Make functions globally available for onclick handlers
window.toggleTodo = toggleTodo
window.openEditModal = openEditModal
window.deleteTodo = deleteTodo
window.clearCompletedTasks = clearCompletedTasks
window.closeEditModal = closeEditModal
window.saveEdit = saveEdit

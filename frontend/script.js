// ==== Task Manager Logic ====
let userId = null; // Store logged-in user ID

document.addEventListener('DOMContentLoaded', function () {
  const taskInput = document.getElementById('taskInput');
  const priorityInput = document.getElementById('priorityInput');
  const searchInput = document.getElementById('searchInput');
  const priorityFilter = document.getElementById('priorityFilter');
  const statusFilter = document.getElementById('statusFilter');
  const logoutBtn = document.getElementById('logoutBtn');

  let tasks = [];

  // Load userId from localStorage on page load
  userId = localStorage.getItem('userId');
  console.log('Loaded userId from localStorage:', userId);
  if (userId) {
    console.log('User is logged in, showing app and hiding auth');
    document.getElementById('auth').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    fetchTasks();
  } else {
    console.log('No userId found, showing auth and hiding app');
    document.getElementById('auth').style.display = 'block';
    document.getElementById('app').style.display = 'none';
    logoutBtn.style.display = 'none'; // Hide logout button
  }

  // Logout button click handler
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('userId');
    userId = null;
    document.getElementById('auth').style.display = 'block';
    document.getElementById('app').style.display = 'none';
    logoutBtn.style.display = 'none';
  });

  async function fetchTasks() {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:5006/api/users/tasks`, {
        headers: { 'x-user-id': userId }
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      tasks = await res.json();
      renderTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  async function updateTaskOnServer(task) {
    try {
      const res = await fetch(`http://localhost:5006/api/users/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(task)
      });
      if (!res.ok) throw new Error('Failed to update task');
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteTaskOnServer(task) {
    try {
      const res = await fetch(`http://localhost:5006/api/users/tasks/${task._id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      if (!res.ok) throw new Error('Failed to delete task');
    } catch (err) {
      alert(err.message);
    }
  }

  async function addTaskOnServer(task) {
    console.log('Adding task on server with userId:', userId, 'task:', task);
    try {
      if (!userId) {
        throw new Error('User ID not set. Please login first.');
      }
      const res = await fetch(`http://localhost:5006/api/users/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(task)
      });
      console.log('Response status:', res.status);
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error response:', errorData);
        throw new Error('Failed to add task: ' + (errorData.message || res.statusText));
      }
      const savedTask = await res.json();
      console.log('Saved task:', savedTask);
      return savedTask;
    } catch (err) {
      alert(err.message);
      return null;
    }
  }

  // After login success
  async function handleAuth() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
      alert("Please fill in both fields.");
      return;
    }

    const endpoint = isLogin ? '/login' : '/register';

    try {
      const res = await fetch(BASE_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert(data.message);

      if (isLogin) {
        loggedInUserId = data.userId; 
        localStorage.setItem('userId', loggedInUserId); 
        document.getElementById('auth').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        window.setUserId(loggedInUserId);
      } else {
        toggleForm(); 
      }
    } catch (err) {
      alert(err.message);
    }
  }

  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-manager-list-item';
    if (task.status === 'completed') {
      li.classList.add('completed');
    }
    li.textContent = `${task.text} (${new Date(task.timestamp).toLocaleString()})`;

    const completeBtn = document.createElement('button');
    completeBtn.textContent = task.status === 'completed' ? 'Undo' : 'Complete';
    completeBtn.className = 'complete-btn';
    completeBtn.onclick = async () => {
      task.status = task.status === 'completed' ? 'pending' : 'completed';
      await updateTaskOnServer({ ...task, _id: task._id });
      await fetchTasks();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = async () => {
      await deleteTaskOnServer({ ...task, _id: task._id });
      await fetchTasks();
    };

    li.appendChild(completeBtn);
    li.appendChild(deleteBtn);
    return li;
  }

  function renderTasks() {
    const highPriorityList = document.getElementById('highPriorityList');
    const pendingList = document.getElementById('pendingList');
    const completedList = document.getElementById('completedList');

    highPriorityList.innerHTML = '';
    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    // Apply filters
    const searchText = searchInput.value.toLowerCase();
    const priorityVal = priorityFilter.value;
    const statusVal = statusFilter.value;

    let filteredTasks = tasks.filter(task => {
      const matchesSearch = task.text.toLowerCase().startsWith(searchText);
      const matchesPriority = priorityVal === 'all' || (priorityVal === 'high' && task.priority === 'high');
      let matchesStatus = true;
      if (statusVal === 'pending') matchesStatus = task.status === 'pending';
      else if (statusVal === 'completed') matchesStatus = task.status === 'completed';
      else if (statusVal === 'high') matchesStatus = task.priority === 'high';
      else matchesStatus = true;

      return matchesSearch && matchesPriority && matchesStatus;
    });

    // Sort latest first
    filteredTasks.sort((a, b) => b.timestamp - a.timestamp);

    // Separate tasks by category
    const highPriorityTasks = filteredTasks.filter(t => t.priority === 'high' && t.status !== 'completed');
    const pendingTasks = filteredTasks.filter(t => t.status === 'pending' && t.priority !== 'high');
    const completedTasks = filteredTasks.filter(t => t.status === 'completed');

    // Show only 1 or 2 tasks in highPriority and pending sections if many remain
    const maxShow = 2;

    highPriorityTasks.slice(0, maxShow).forEach(task => {
      highPriorityList.appendChild(createTaskElement(task));
    });
    if (highPriorityTasks.length > maxShow) {
      const more = document.createElement('li');
      more.textContent = `...and ${highPriorityTasks.length - maxShow} more`;
      highPriorityList.appendChild(more);
    }

    pendingTasks.slice(0, maxShow).forEach(task => {
      pendingList.appendChild(createTaskElement(task));
    });
    if (pendingTasks.length > maxShow) {
      const more = document.createElement('li');
      more.textContent = `...and ${pendingTasks.length - maxShow} more`;
      pendingList.appendChild(more);
    }

    completedTasks.forEach(task => {
      completedList.appendChild(createTaskElement(task));
    });
  }

  window.addTask = async function () {
    const taskText = taskInput.value.trim();
    const priority = priorityInput.value;
    if (taskText !== '') {
      const newTask = {
        text: taskText,
        priority: priority,
        status: 'pending',
        timestamp: Date.now()
      };
      const savedTask = await addTaskOnServer(newTask);
      if (savedTask) {
        tasks.push(savedTask);
        taskInput.value = '';
        renderTasks();
      }
    }
  };

  window.filterTasks = function () {
    renderTasks();
  };

  renderTasks();

  
  window.setUserId = function (id) {
    userId = id;
    fetchTasks();
  };
});

// ==== Auth Logic ====
let isLogin = true;
let loggedInUserId = null;
const BASE_URL = 'http://localhost:5006/api';

function toggleForm() {
  isLogin = !isLogin;
  document.getElementById('formTitle').textContent = isLogin ? 'Login' : 'Register';
  document.querySelector('.auth-box button').textContent = isLogin ? 'Login' : 'Register';
  document.getElementById('toggleText').innerHTML = isLogin
    ? `Don't have an account? <a href="#" onclick="toggleForm()">Register</a>`
    : `Already have an account? <a href="#" onclick="toggleForm()">Login</a>`;
}

async function handleAuth() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    alert("Please fill in both fields.");
    return;
  }

  const endpoint = isLogin ? '/login' : '/register';

  try {
    const res = await fetch(BASE_URL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    alert(data.message);

    if (isLogin) {
      loggedInUserId = data.userId; 
      localStorage.setItem('userId', loggedInUserId); 
      document.getElementById('auth').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      window.setUserId(loggedInUserId);
    } else {
      toggleForm(); 
    }
  } catch (err) {
    alert(err.message);
  }
}

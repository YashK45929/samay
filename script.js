let runningTasks = [];

function startTask() {
  const name = document.getElementById('taskName').value.trim();
  const categorySelect = document.getElementById('taskCategory');
  const selectedCategory = categorySelect.value;
  const customCategoryInput = document.getElementById('customCategory');
  const category = selectedCategory === "Other" ? customCategoryInput.value.trim() : selectedCategory;

  // 🔴 Require task name
  if (!name) {
    alert("Enter a task name!");
    return;
  }

  // 🔴 Require a valid category, including custom for 'Other'
  if (!category) {
    alert("Please select a category or enter one if 'Other' is chosen.");
    return;
  }

  // 🔴 Prevent duplicate running task
  if (runningTasks.find(t => t.name === name)) {
    alert("Task already running!");
    return;
  }

  const now = new Date();
  const task = {
    name,
    category,
    date: now.toISOString().split('T')[0],
    startDate: now,
    start: formatAMPM(now)
  };
  
  runningTasks.push(task);

  // Save to localStorage
  saveRunningTasks();

  // Reset form
  document.getElementById('taskName').value = '';
  categorySelect.value = '';
  customCategoryInput.value = '';
  customCategoryInput.style.display = 'none';

  renderRunningTasks();
}

// Add these helper functions anywhere in script.js

function saveRunningTasks() {
  // Convert Date objects to ISO strings for storage
  const tasksToSave = runningTasks.map(task => ({
    ...task,
    startDate: task.startDate.toISOString()
  }));
  localStorage.setItem('runningTasks', JSON.stringify(tasksToSave));
}

function loadRunningTasks() {
  try {
    const storedTasks = JSON.parse(localStorage.getItem('runningTasks')) || [];
    // Convert ISO strings back to Date objects
    runningTasks = storedTasks.map(task => ({
      ...task,
      startDate: new Date(task.startDate)
    }));
  } catch (e) {
    console.error("Error loading running tasks:", e);
    runningTasks = [];
  }
}

function endTask(name) {
  const index = runningTasks.findIndex(t => t.name === name);
  if (index === -1) return alert("Task not found!");

  const task = runningTasks[index];
  const endDate = new Date();

  task.end = formatAMPM(endDate);
  task.duration = calculateDuration(task.startDate, endDate);
  task.date = task.date || new Date().toISOString().split('T')[0];
  task.startDate = task.startDate || new Date();

  runningTasks.splice(index, 1);
  
  // Update localStorage
  saveRunningTasks();

  let tasks = [];
  try {
    tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  } catch {
    tasks = [];
  }

  tasks.push(task);
  localStorage.setItem('tasks', JSON.stringify(tasks));

  renderRunningTasks();
  displayTasks();
}

function renderRunningTasks() {
  const runningList = document.getElementById('runningList');
  runningList.innerHTML = runningTasks.map(t => `
    <div class="task-item">
      <strong>${t.name}</strong>
      ${t.category ? `<span class="time">Category: ${t.category}</span>` : ''}
      <span class="time">Start: ${t.start}</span>
      <button class="end-btn" onclick="endTask('${t.name}')">End Task</button>
    </div>
  `).join('');
}

function displayTasks(filterDate = null) {
  const taskList = document.getElementById('taskList');
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

  const grouped = {};
  tasks.forEach(task => {
    if (filterDate && task.date !== filterDate) return;
    if (!grouped[task.date]) grouped[task.date] = [];
    grouped[task.date].push(task);
  });

  taskList.innerHTML = Object.keys(grouped).reverse().map(date => {
    const label = formatDateLabel(date);
    const entries = grouped[date].map(t => `
      <div class="task-item">
        <strong>${t.name}</strong>
        ${t.category ? `<span class="time">Category: ${t.category}</span>` : ''}
        <span class="time">Start: ${t.start}</span>
        <span class="time">End: ${t.end}</span>
        <span class="duration">Duration: ${t.duration}</span>
      </div>
    `).join('');
    return `<div><div class="date-header">${label}</div>${entries}</div>`;
  }).join('');

  updateSummary();
  updateChart();
}

function formatAMPM(date) {
  let h = date.getHours(), m = date.getMinutes(), s = date.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(h)}:${pad(m)}:${pad(s)} ${ampm}`;
}

function calculateDuration(start, end) {
  const diff = end - start;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function pad(n) {
  return n < 10 ? '0' + n : n;
}

function downloadCSV() {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  if (!tasks.length) return alert("No tasks to export!");

  const headers = ['Task Name', 'Category', 'Start Time', 'End Time', 'Duration', 'Date'];
  const rows = tasks.map(t => [t.name, t.category || '', t.start, t.end, t.duration, t.date]);

  let csv = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n"
    + rows.map(r => r.join(",")).join("\n");

  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", "tasks.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('dark', isDark);
  updateModeLabel();
}

function updateModeLabel() {
  const label = document.getElementById('modeLabel');
  label.textContent = document.body.classList.contains('dark') 
    ? '🌙 Dark Mode' : '🌞 Light Mode';
}

(function restoreDarkMode() {
  const isDark = localStorage.getItem('dark') === 'true';
  if (isDark) {
    document.body.classList.add('dark');
    document.getElementById('modeToggle').checked = true;
  }
  updateModeLabel();
})();

function filterByDate() {
  const date = document.getElementById('filterDate').value;
  displayTasks(date);
}

function clearFilter() {
  document.getElementById('filterDate').value = '';
  displayTasks();
}

function formatDateLabel(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr).toDateString();
}

// ✅ Daily/Weekly Summary
function updateSummary() {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const today = {};
  const week = {};

  tasks.forEach(task => {
    const duration = parseDuration(task.duration);
    const cat = task.category || "Uncategorized";
    const taskDate = new Date(task.date);
    const dayDiff = (now - taskDate) / (1000 * 60 * 60 * 24);

    if (task.date === todayStr) {
      today[cat] = (today[cat] || 0) + duration;
    }
    if (dayDiff <= 6) {
      week[cat] = (week[cat] || 0) + duration;
    }
  });

  const todayList = Object.keys(today).map(cat =>
    `<li>${cat}: ${formatDuration(today[cat])}</li>`
  ).join('');

  const weekList = Object.keys(week).map(cat =>
    `<li>${cat}: ${formatDuration(week[cat])}</li>`
  ).join('');

  document.getElementById("todaySummary").innerHTML = todayList || "<li>No activity</li>";
  document.getElementById("weekSummary").innerHTML = weekList || "<li>No activity</li>";
}

let weeklyChart;

function updateChart() {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const now = new Date();
  const weekly = {};

  tasks.forEach(task => {
    if (!task.duration) return;

    const taskDate = new Date(task.date);
    const dayDiff = (now - taskDate) / (1000 * 60 * 60 * 24);
    if (dayDiff <= 6) {
      const category = task.category || "Uncategorized";
      const seconds = parseDuration(task.duration);
      weekly[category] = (weekly[category] || 0) + seconds;
    }
  });

  const labels = Object.keys(weekly);
  const values = labels.map(cat => weekly[cat]);
  const total = values.reduce((a, b) => a + b, 0);

  const percentages = values.map(val => (val / total * 100).toFixed(1));

  const ctx = document.getElementById("weeklyChart").getContext("2d");

  if (weeklyChart) weeklyChart.destroy();

  weeklyChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.map((label, i) => `${label} - ${percentages[i]}%`),
      datasets: [{
        data: values,
        backgroundColor: [
          '#4e79a7', '#f28e2c', '#e15759',
          '#76b7b2', '#59a14f', '#edc949',
          '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
        ]
      }]
    },
    options: {
      responsive: true,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 10,
            font: { size: 13 }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const mins = Math.round(context.parsed / 60);
              return `${context.label}: ${mins} min`;
            }
          }
        }
      }
    }
  });
}


function parseDuration(str) {
  const [h, m, s] = str.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function toggleOtherCategoryInput() {
  const selected = document.getElementById('taskCategory').value;
  const customInput = document.getElementById('customCategory');
  customInput.style.display = (selected === "Other") ? 'block' : 'none';
}


// Replace the current init code at the bottom of script.js
// Init
loadRunningTasks();  // Load running tasks from storage
renderRunningTasks();
displayTasks();

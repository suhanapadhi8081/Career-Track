const APPS_KEY = 'careertrack_v2_apps';
const SKILLS_KEY = 'careertrack_v2_skills';

function getDateOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

function getDaysRemaining(targetDate) {
    if (!targetDate) return null;
    const today = new Date(getDateOffset(0));
    const target = new Date(targetDate);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

const defaultApps = [{
        id: 1,
        company: 'Amazon',
        role: 'SDE Intern',
        status: 'Offer',
        reminderDate: getDateOffset(-1),
        notes: 'Offer letter received and under review.'
    },
    {
        id: 2,
        company: 'Google',
        role: 'AI Software Intern',
        status: 'Interviewing',
        reminderDate: getDateOffset(1),
        notes: 'Final DSA & ML fundamentals revision before technical round.'
    },
    {
        id: 3,
        company: 'Microsoft',
        role: 'Explore SWE Intern',
        status: 'Applied',
        reminderDate: getDateOffset(0),
        notes: 'Application submitted via careers portal.'
    }
];

const defaultSkills = [{
        id: 101,
        name: 'Python & Core Programming',
        expanded: true,
        milestones: [
            { id: 1, text: 'OOPs, Decorators & File Handling', done: true },
            { id: 2, text: 'Built 2+ Python/Flask Projects', done: true },
            { id: 3, text: 'Solved 30+ Coding Problems', done: true },
            { id: 4, text: 'Mock Technical Interview Revision', done: false }
        ]
    },
    {
        id: 102,
        name: 'Data Structures & Algorithms',
        expanded: false,
        milestones: [
            { id: 1, text: 'Arrays, Strings & Hashing', done: true },
            { id: 2, text: 'Linked Lists, Stacks & Queues', done: true },
            { id: 3, text: 'Trees, Graphs & Recursion', done: false },
            { id: 4, text: 'Dynamic Programming & Timed Tests', done: false }
        ]
    },
    {
        id: 103,
        name: 'Machine Learning & AI',
        expanded: false,
        milestones: [
            { id: 1, text: 'NumPy, Pandas & Data Preprocessing', done: true },
            { id: 2, text: 'Supervised & Unsupervised Models', done: true },
            { id: 3, text: 'Neural Networks & Model Evaluation', done: false },
            { id: 4, text: 'End-to-End AI Capstone Project', done: false }
        ]
    },
    {
        id: 104,
        name: 'SQL & Web Backend (Flask)',
        expanded: false,
        milestones: [
            { id: 1, text: 'SQL Joins, Indexing & Queries', done: true },
            { id: 2, text: 'REST API Design & Routing', done: true },
            { id: 3, text: 'Authentication & Deployment', done: true },
            { id: 4, text: 'System Design Basics', done: false }
        ]
    }
];

let applications = JSON.parse(localStorage.getItem(APPS_KEY)) || defaultApps;
let skills = JSON.parse(localStorage.getItem(SKILLS_KEY)) || defaultSkills;

function saveToStorage() {
    localStorage.setItem(APPS_KEY, JSON.stringify(applications));
    localStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
}

function quickFilterStage(stage) {
    document.getElementById('statusFilter').value = stage;
    renderAll();
}

function getSkillPercent(skill) {
    if (!skill.milestones || skill.milestones.length === 0) return 0;
    const completed = skill.milestones.filter(m => m.done).length;
    return Math.round((completed / skill.milestones.length) * 100);
}

function renderReminders(showToast = false) {
    const container = document.getElementById('reminderPills');

    const upcoming = applications
        .filter(app => app.status === 'Interviewing' && app.reminderDate)
        .map(app => ({...app, diffDays: getDaysRemaining(app.reminderDate) }))
        .filter(app => app.diffDays !== null && app.diffDays <= 3)
        .sort((a, b) => a.diffDays - b.diffDays);

    if (upcoming.length === 0) {
        container.innerHTML = `<span class="reminder-empty">No interviews in the next 3 days. Set a stage to <strong>Interviewing</strong> with a date to see alerts here.</span>`;
        return;
    }

    container.innerHTML = upcoming.map(item => {
        let badgeClass = 'reminder-3days';
        let label = `In ${item.diffDays} days`;

        if (item.diffDays < 0) {
            badgeClass = 'reminder-overdue';
            label = `Overdue (${Math.abs(item.diffDays)}d ago)`;
        } else if (item.diffDays === 0) {
            badgeClass = 'reminder-today';
            label = 'Today';
        } else if (item.diffDays === 1) {
            badgeClass = 'reminder-tomorrow';
            label = 'Tomorrow';
        }

        return `
      <span class="reminder-pill ${badgeClass}" onclick="openModal(${item.id})">
        <strong>${escapeHtml(item.company)}</strong> (${escapeHtml(item.role)}) &mdash; ${label}
      </span>
    `;
    }).join('');

    if (showToast) {
        const urgent = upcoming.filter(r => r.diffDays <= 1);
        if (urgent.length > 0) {
            const lines = urgent.map(u => {
                const tag = u.diffDays < 0 ? 'Overdue' : (u.diffDays === 0 ? 'Today' : 'Tomorrow');
                return `&bull; <strong>${escapeHtml(u.company)}</strong> (${tag})`;
            }).join('<br>');
            document.getElementById('toastBody').innerHTML = lines;
            document.getElementById('toastAlert').classList.add('show');
        }
    }
}

function closeToast() {
    document.getElementById('toastAlert').classList.remove('show');
}

function renderMetrics() {
    const total = applications.length;
    const active = applications.filter(a => a.status === 'Applied' || a.status === 'Interviewing').length;
    const interviews = applications.filter(a => a.status === 'Interviewing').length;
    const offers = applications.filter(a => a.status === 'Offer').length;

    const avgSkill = skills.length ?
        Math.round(skills.reduce((sum, s) => sum + getSkillPercent(s), 0) / skills.length) :
        0;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statInterviews').textContent = interviews;
    document.getElementById('statOffers').textContent = offers;
    document.getElementById('statReadinessAvg').textContent = `Prep Completed: ${avgSkill}%`;
}

function getFilteredApps() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const stage = document.getElementById('statusFilter').value;

    return applications.filter(app => {
        const matchesStage = stage === 'All' || app.status === stage;
        const matchesQuery =
            app.company.toLowerCase().includes(query) ||
            app.role.toLowerCase().includes(query) ||
            (app.notes && app.notes.toLowerCase().includes(query));
        return matchesStage && matchesQuery;
    });
}

function getDateBadgeHtml(app) {
    if (!app.reminderDate) return `<span class="date-tag">&mdash;</span>`;
    let badge = '';

    if (app.status === 'Interviewing') {
        const diff = getDaysRemaining(app.reminderDate);
        if (diff < 0) {
            badge = `<span class="date-sub-badge reminder-overdue">Overdue</span>`;
        } else if (diff === 0) {
            badge = `<span class="date-sub-badge reminder-today">Today</span>`;
        } else if (diff === 1) {
            badge = `<span class="date-sub-badge reminder-tomorrow">Tomorrow</span>`;
        } else if (diff <= 3) {
            badge = `<span class="date-sub-badge reminder-3days">In ${diff}d</span>`;
        }
    }

    return `<span class="date-tag">${app.reminderDate}</span>${badge}`;
}

function renderTable() {
    const tbody = document.getElementById('applicationsBody');
    const filtered = getFilteredApps();
    document.getElementById('recordCountLabel').textContent = filtered.length;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No matching applications. Click "+ New Application" to add one.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(app => `
    <tr>
      <td>
        <span class="company-name">${escapeHtml(app.company)}</span>
        ${app.notes ? `<div class="note-preview" title="${escapeHtml(app.notes)}">${escapeHtml(app.notes)}</div>` : ''}
      </td>
      <td><span class="role-text">${escapeHtml(app.role)}</span></td>
      <td>${getDateBadgeHtml(app)}</td>
      <td><span class="badge status-${app.status}">${app.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="icon-btn" onclick="openModal(${app.id})">Edit</button>
          <button class="icon-btn delete" onclick="deleteOpportunity(${app.id})">&times;</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderKanban() {
  const board = document.getElementById('kanbanViewContainer');
  const stages = ['Wishlist', 'Applied', 'Interviewing', 'Offer'];
  const filtered = getFilteredApps();

  board.innerHTML = stages.map(stage => {
    const items = filtered.filter(a => a.status === stage);
    return `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span>${stage}</span>
          <span>${items.length}</span>
        </div>
        ${items.length === 0 ? `<div class="kanban-empty">Empty</div>` : ''}
        ${items.map(item => `
          <div class="kanban-card">
            <div class="kanban-card-title">${escapeHtml(item.company)}</div>
            <div class="kanban-card-role">${escapeHtml(item.role)}</div>
            ${item.reminderDate ? getDateBadgeHtml(item) : ''}
            <div class="kanban-card-footer">
              <button class="icon-btn" onclick="openModal(${item.id})">Edit</button>
              <button class="icon-btn delete" onclick="deleteOpportunity(${item.id})">&times;</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
}

function switchView(view) {
  const tableEl = document.getElementById('tableViewContainer');
  const kanbanEl = document.getElementById('kanbanViewContainer');
  const btnTable = document.getElementById('btnTableView');
  const btnKanban = document.getElementById('btnKanbanView');

  if (view === 'table') {
    tableEl.style.display = 'block';
    kanbanEl.classList.remove('active');
    btnTable.classList.add('active');
    btnKanban.classList.remove('active');
  } else {
    tableEl.style.display = 'none';
    kanbanEl.classList.add('active');
    btnKanban.classList.add('active');
    btnTable.classList.remove('active');
  }
}

function renderSkills() {
  const list = document.getElementById('skillsList');
  if (skills.length === 0) {
    list.innerHTML = `<div class="empty-state">No topics added yet.</div>`;
    return;
  }

  list.innerHTML = skills.map(skill => {
    const pct = getSkillPercent(skill);
    const doneCount = skill.milestones.filter(m => m.done).length;

    return `
      <div class="skill-card">
        <div class="skill-top" onclick="toggleSkillDrawer(${skill.id})">
          <div class="skill-title-wrap">
            <span class="skill-chevron">${skill.expanded ? '▾' : '▸'}</span>
            <span class="skill-name">${escapeHtml(skill.name)}</span>
          </div>
          <div class="skill-meta">
            <span class="skill-count">${doneCount}/${skill.milestones.length}</span>
            <span class="skill-pct">${pct}%</span>
            <button class="skill-remove" onclick="event.stopPropagation(); removeSkill(${skill.id})">&times;</button>
          </div>
        </div>

        <div class="progress-track">
          <div class="progress-fill" style="width: ${pct}%;"></div>
        </div>

        <div class="milestones-drawer ${skill.expanded ? 'open' : ''}">
          ${skill.milestones.map(m => `
            <div class="milestone-row">
              <label class="milestone-label ${m.done ? 'done' : ''}">
                <input type="checkbox" ${m.done ? 'checked' : ''} onchange="toggleMilestone(${skill.id}, ${m.id})" />
                <span>${escapeHtml(m.text)}</span>
              </label>
              <button class="milestone-del" onclick="deleteMilestone(${skill.id}, ${m.id})">&times;</button>
            </div>
          `).join('')}

          <form class="add-milestone-row" onsubmit="addMilestone(event, ${skill.id})">
            <input type="text" id="ms-input-${skill.id}" placeholder="Add checkpoint..." required />
            <button type="submit" class="btn btn-secondary">+ Add</button>
          </form>
        </div>
      </div>
    `;
  }).join('');
}

function toggleSkillDrawer(skillId) {
  const skill = skills.find(s => s.id === skillId);
  if (skill) {
    skill.expanded = !skill.expanded;
    saveToStorage();
    renderSkills();
  }
}

function toggleMilestone(skillId, milestoneId) {
  const skill = skills.find(s => s.id === skillId);
  if (!skill) return;
  const ms = skill.milestones.find(m => m.id === milestoneId);
  if (ms) {
    ms.done = !ms.done;
    saveToStorage();
    renderSkills();
    renderMetrics();
  }
}

function addMilestone(e, skillId) {
  e.preventDefault();
  const input = document.getElementById(`ms-input-${skillId}`);
  const text = input.value.trim();
  if (!text) return;

  const skill = skills.find(s => s.id === skillId);
  if (skill) {
    skill.milestones.push({ id: Date.now(), text, done: false });
    skill.expanded = true;
    saveToStorage();
    renderSkills();
    renderMetrics();
  }
}

function deleteMilestone(skillId, milestoneId) {
  const skill = skills.find(s => s.id === skillId);
  if (skill) {
    skill.milestones = skill.milestones.filter(m => m.id !== milestoneId);
    saveToStorage();
    renderSkills();
    renderMetrics();
  }
}

function addSkill(e) {
  e.preventDefault();
  const input = document.getElementById('newSkillName');
  const name = input.value.trim();
  if (!name) return;

  skills.push({
    id: Date.now(),
    name,
    expanded: true,
    milestones: [
      { id: Date.now() + 1, text: 'Core Concepts', done: false },
      { id: Date.now() + 2, text: 'Hands-on Practice', done: false },
      { id: Date.now() + 3, text: 'Mini Project', done: false },
      { id: Date.now() + 4, text: 'Interview Revision', done: false }
    ]
  });
  input.value = '';
  saveToStorage();
  renderSkills();
  renderMetrics();
}

function removeSkill(id) {
  skills = skills.filter(s => s.id !== id);
  saveToStorage();
  renderSkills();
  renderMetrics();
}

function openModal(id = null) {
  const modal = document.getElementById('opportunityModal');
  const title = document.getElementById('modalTitle');
  const saveBtn = document.getElementById('saveBtn');

  if (id !== null) {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    title.textContent = 'Edit Application';
    saveBtn.textContent = 'Update';
    document.getElementById('editId').value = app.id;
    document.getElementById('companyInput').value = app.company;
    document.getElementById('roleInput').value = app.role;
    document.getElementById('statusInput').value = app.status;
    document.getElementById('reminderDateInput').value = app.reminderDate || '';
    document.getElementById('notesInput').value = app.notes || '';
  } else {
    title.textContent = 'New Application';
    saveBtn.textContent = 'Save';
    document.getElementById('opportunityForm').reset();
    document.getElementById('editId').value = '';
  }

  modal.classList.add('open');
}

function closeModal() {
  document.getElementById('opportunityModal').classList.remove('open');
}

function saveOpportunity(e) {
  e.preventDefault();
  const editId = document.getElementById('editId').value;
  const company = document.getElementById('companyInput').value.trim();
  const role = document.getElementById('roleInput').value.trim();
  const status = document.getElementById('statusInput').value;
  const reminderDate = document.getElementById('reminderDateInput').value;
  const notes = document.getElementById('notesInput').value.trim();

  if (editId) {
    const index = applications.findIndex(a => a.id === Number(editId));
    if (index !== -1) {
      applications[index] = {
        ...applications[index],
        company,
        role,
        status,
        reminderDate,
        notes
      };
    }
  } else {
    applications.unshift({
      id: Date.now(),
      company,
      role,
      status,
      reminderDate,
      notes
    });
  }

  saveToStorage();
  closeModal();
  renderAll(true);
}

function deleteOpportunity(id) {
  if (confirm('Delete this application?')) {
    applications = applications.filter(a => a.id !== id);
    saveToStorage();
    renderAll();
  }
}

function exportToCSV() {
  if (applications.length === 0) {
    alert('No records to export.');
    return;
  }
  const headers = ['Company', 'Role', 'Date', 'Stage', 'Notes'];
  const rows = applications.map(a => [
    `"${(a.company || '').replace(/"/g, '""')}"`,
    `"${(a.role || '').replace(/"/g, '""')}"`,
    `"${a.reminderDate || ''}"`,
    `"${a.status}"`,
    `"${(a.notes || '').replace(/"/g, '""')}"`
  ]);
  const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csv));
  link.setAttribute('download', 'CareerTrack_Applications.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAll(showToast = false) {
  renderReminders(showToast);
  renderMetrics();
  renderTable();
  renderKanban();
  renderSkills();
}

document.getElementById('opportunityModal').addEventListener('click', (e) => {
  if (e.target.id === 'opportunityModal') closeModal();
});

renderAll(true);

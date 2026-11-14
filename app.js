const STORAGE_KEY = 'careertrack_apps_v5';
const SKILLS_KEY = 'careertrack_skills_v5';

function formatOffsetDate(daysOffset) {
    const dt = new Date();
    dt.setDate(dt.getDate() + daysOffset);
    return dt.toISOString().split('T')[0];
}

const seedApplications = [
    {
        id: 'app-101',
        company: 'Google',
        role: 'AI Software Intern',
        status: 'Interviewing',
        date: formatOffsetDate(1),
        notes: 'Final DSA & ML fundamentals revision with system design basics.'
    },
    {
        id: 'app-102',
        company: 'Microsoft',
        role: 'Explore SWE Intern',
        status: 'Applied',
        date: formatOffsetDate(0),
        notes: 'Application submitted via careers portal with employee referral.'
    },
    {
        id: 'app-103',
        company: 'Amazon',
        role: 'SDE Intern',
        status: 'Offer Accepted',
        date: formatOffsetDate(-2),
        notes: 'Offer letter accepted for winter internship.'
    },
    {
        id: 'app-104',
        company: 'Infosys',
        role: 'Backend Intern',
        status: 'Offer Received',
        date: formatOffsetDate(-1),
        notes: 'Offer letter received; reviewing compensation and team details.'
    }
];

const seedSkills = [
    {
        id: 'sk-1',
        name: 'Python & Core Programming',
        expanded: true,
        milestones: [
            { id: 'm-1', text: 'OOPs, Decorators & File Handling', done: true },
            { id: 'm-2', text: 'Built 2+ Python/Flask Projects', done: true },
            { id: 'm-3', text: 'Solved 30+ Coding Problems', done: true },
            { id: 'm-4', text: 'Mock Technical Interview Revision', done: false }
        ]
    },
    {
        id: 'sk-2',
        name: 'Data Structures & Algorithms',
        expanded: false,
        milestones: [
            { id: 'm-5', text: 'Arrays, Strings & Hashing', done: true },
            { id: 'm-6', text: 'Linked Lists, Stacks & Queues', done: true },
            { id: 'm-7', text: 'Trees, Graphs & Recursion', done: false },
            { id: 'm-8', text: 'Dynamic Programming & Timed Tests', done: false }
        ]
    },
    {
        id: 'sk-3',
        name: 'Machine Learning & AI',
        expanded: false,
        milestones: [
            { id: 'm-9', text: 'NumPy, Pandas & Data Cleaning', done: true },
            { id: 'm-10', text: 'Supervised & Unsupervised Models', done: true },
            { id: 'm-11', text: 'Model Evaluation & Feature Tuning', done: false },
            { id: 'm-12', text: 'End-to-End ML Mini Project', done: false }
        ]
    },
    {
        id: 'sk-4',
        name: 'SQL & Web Backend (Flask)',
        expanded: false,
        milestones: [
            { id: 'm-13', text: 'Joins, Subqueries & Indexing', done: true },
            { id: 'm-14', text: 'REST APIs & JSON Handling', done: true },
            { id: 'm-15', text: 'Authentication & Session Security', done: true },
            { id: 'm-16', text: 'Database Schema Design Practice', done: false }
        ]
    }
];

let applications = JSON.parse(localStorage.getItem(STORAGE_KEY));
if (!Array.isArray(applications) || applications.length === 0) {
    applications = seedApplications;
}

let skills = JSON.parse(localStorage.getItem(SKILLS_KEY));
if (!Array.isArray(skills) || skills.length === 0) {
    skills = seedSkills;
}

let activeView = 'list';

function persistData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    localStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
}

function getDaysDiff(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function formatStatusClass(status) {
    return 'status-' + status.replace(/\s+/g, '-');
}

function getDeadlineBadge(app) {
    if (app.status === 'Rejected' || app.status === 'Offer Received' || app.status === 'Offer Accepted') return null;
    const diff = getDaysDiff(app.date);

    if (diff < 0 && app.status === 'Interviewing') {
        return { label: `Overdue (${Math.abs(diff)}d ago)`, pillClass: 'reminder-overdue', badgeBg: '#fef2f2', badgeColor: '#991b1b' };
    }
    if (diff === 0) {
        return { label: 'Today', pillClass: 'reminder-today', badgeBg: '#fff7ed', badgeColor: '#9a3412' };
    }
    if (diff === 1) {
        return { label: 'Tomorrow', pillClass: 'reminder-tomorrow', badgeBg: '#fffbeb', badgeColor: '#92400e' };
    }
    if (diff > 1 && diff <= 3) {
        return { label: `In ${diff} days`, pillClass: 'reminder-3days', badgeBg: '#f0fdf4', badgeColor: '#166534' };
    }
    return null;
}

function renderReminders() {
    const container = document.getElementById('reminderList');
    const upcoming = applications
        .map(app => ({ app, info: getDeadlineBadge(app) }))
        .filter(item => item.info !== null)
        .sort((a, b) => getDaysDiff(a.app.date) - getDaysDiff(b.app.date));

    if (upcoming.length === 0) {
        container.innerHTML = `<span class="reminder-empty">No urgent interviews scheduled in the next 3 days.</span>`;
        return;
    }

    container.innerHTML = upcoming.map(({ app, info }) => `
        <span class="reminder-pill ${info.pillClass}" onclick="openEditModal('${app.id}')">
            <strong>${escapeHTML(app.company)}</strong> (${escapeHTML(app.role)}) — ${info.label}
        </span>
    `).join('');
}

function triggerInitialToast() {
    const urgent = applications.filter(app => {
        const diff = getDaysDiff(app.date);
        return (app.status !== 'Rejected' && app.status !== 'Offer Received' && app.status !== 'Offer Accepted') && (diff === 0 || diff === 1);
    });

    if (urgent.length > 0) {
        const toast = document.getElementById('reminderToast');
        const body = document.getElementById('toastBody');
        body.innerHTML = urgent.map(a => {
            const when = getDaysDiff(a.date) === 0 ? 'Today' : 'Tomorrow';
            return `• <strong>${escapeHTML(a.company)}</strong> (${when})`;
        }).join('<br>');
        toast.classList.add('show');
    }
}

function updateSummaryStats() {
    const receivedCount = applications.filter(a => a.status === 'Offer Received').length;
    const acceptedCount = applications.filter(a => a.status === 'Offer Accepted').length;

    document.getElementById('statTotal').textContent = applications.length;
    document.getElementById('statActive').textContent = applications.filter(a => a.status === 'Applied' || a.status === 'Interviewing').length;
    document.getElementById('statInterviews').textContent = applications.filter(a => a.status === 'Interviewing').length;
    document.getElementById('statOffers').textContent = receivedCount + acceptedCount;
    document.getElementById('statOffersNote').textContent = `${receivedCount} received · ${acceptedCount} accepted`;
}

function getFilteredApps() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const stage = document.getElementById('statusFilter').value;

    return applications.filter(app => {
        const matchesStage = stage === 'All' || app.status === stage;
        const matchesText =
            app.company.toLowerCase().includes(query) ||
            app.role.toLowerCase().includes(query) ||
            (app.notes && app.notes.toLowerCase().includes(query));
        return matchesStage && matchesText;
    });
}

function renderApplications() {
    const filtered = getFilteredApps();
    document.getElementById('visibleCount').textContent = filtered.length;

    const tbody = document.getElementById('appTableBody');
    const emptyEl = document.getElementById('emptyState');

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyEl.style.display = 'block';
    } else {
        emptyEl.style.display = 'none';
        tbody.innerHTML = filtered.map(app => {
            const alert = getDeadlineBadge(app);
            const alertHTML = alert ?
                `<span class="date-sub-badge" style="background:${alert.badgeBg};color:${alert.badgeColor}">${alert.label}</span>` :
                '';

            return `
                <tr>
                    <td>
                        <span class="company-name">${escapeHTML(app.company)}</span>
                        ${app.notes ? `<div class="note-preview">${escapeHTML(app.notes)}</div>` : ''}
                    </td>
                    <td class="role-text">${escapeHTML(app.role)}</td>
                    <td>
                        <span class="date-tag">${app.date}</span>
                        ${alertHTML}
                    </td>
                    <td><span class="badge ${formatStatusClass(app.status)}">${app.status}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="icon-btn" onclick="openEditModal('${app.id}')">Edit</button>
                            <button class="icon-btn delete" onclick="removeApplication('${app.id}')">&times;</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderBoardView(filtered);
    updateSummaryStats();
    renderReminders();
}

function renderBoardView(list) {
    const board = document.getElementById('boardView');
    const columns = [
        { title: 'Wishlist', filter: a => a.status === 'Wishlist' },
        { title: 'Applied', filter: a => a.status === 'Applied' },
        { title: 'Interviewing', filter: a => a.status === 'Interviewing' },
        { title: 'Offers', filter: a => a.status === 'Offer Received' || a.status === 'Offer Accepted' }
    ];

    board.innerHTML = columns.map(col => {
        const colItems = list.filter(col.filter);
        return `
            <div class="kanban-col">
                <div class="kanban-col-header">
                    <span>${col.title}</span>
                    <span>${colItems.length}</span>
                </div>
                ${colItems.length === 0 ? `<div class="kanban-empty">Empty</div>` : colItems.map(item => {
                    const alert = getDeadlineBadge(item);
                    const offerTag = (item.status === 'Offer Received' || item.status === 'Offer Accepted')
                        ? `<span class="badge ${formatStatusClass(item.status)}" style="margin-top:4px">${item.status}</span>`
                        : '';
                    return `
                        <div class="kanban-card">
                            <div class="kanban-card-title">${escapeHTML(item.company)}</div>
                            <div class="kanban-card-role">${escapeHTML(item.role)}</div>
                            <span class="date-tag">${item.date}</span>
                            ${offerTag}
                            ${alert ? `<span class="date-sub-badge" style="background:${alert.badgeBg};color:${alert.badgeColor}">${alert.label}</span>` : ''}
                            <div class="kanban-card-footer">
                                <button class="icon-btn" onclick="openEditModal('${item.id}')">Edit</button>
                                <button class="icon-btn delete" onclick="removeApplication('${item.id}')">&times;</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }).join('');
}

function renderSkills() {
    const container = document.getElementById('skillsContainer');

    container.innerHTML = skills.map(skill => {
        const total = skill.milestones.length;
        const doneCount = skill.milestones.filter(m => m.done).length;
        const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

        return `
            <div class="skill-card">
                <div class="skill-top" onclick="toggleSkillDrawer('${skill.id}')">
                    <div class="skill-title-wrap">
                        <span class="skill-chevron">${skill.expanded ? '▾' : '▸'}</span>
                        <span class="skill-name">${escapeHTML(skill.name)}</span>
                    </div>
                    <div class="skill-meta">
                        <span class="skill-count">${doneCount}/${total}</span>
                        <span class="skill-pct">${pct}%</span>
                        <button class="skill-remove" onclick="event.stopPropagation(); deleteSkill('${skill.id}')">&times;</button>
                    </div>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width:${pct}%"></div>
                </div>
                <div class="milestones-drawer ${skill.expanded ? 'open' : ''}">
                    ${skill.milestones.map(m => `
                        <div class="milestone-row">
                            <label class="milestone-label ${m.done ? 'done' : ''}">
                                <input type="checkbox" ${m.done ? 'checked' : ''} onchange="toggleMilestone('${skill.id}', '${m.id}')">
                                <span>${escapeHTML(m.text)}</span>
                            </label>
                            <button class="milestone-del" onclick="deleteMilestone('${skill.id}', '${m.id}')">&times;</button>
                        </div>
                    `).join('')}
                    <div class="add-milestone-row">
                        <input type="text" id="ms-input-${skill.id}" placeholder="Add checkpoint..." onkeydown="if(event.key==='Enter'){event.preventDefault(); addMilestone('${skill.id}');}">
                        <button type="button" class="btn btn-secondary" onclick="addMilestone('${skill.id}')">+ Add</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.toggleSkillDrawer = function(skillId) {
    skills = skills.map(s => s.id === skillId ? { ...s, expanded: !s.expanded } : s);
    persistData();
    renderSkills();
};

window.toggleMilestone = function(skillId, msId) {
    skills = skills.map(s => {
        if (s.id !== skillId) return s;
        return {
            ...s,
            milestones: s.milestones.map(m => m.id === msId ? { ...m, done: !m.done } : m)
        };
    });
    persistData();
    renderSkills();
};

window.addMilestone = function(skillId) {
    const input = document.getElementById(`ms-input-${skillId}`);
    const val = input.value.trim();
    if (!val) return;

    skills = skills.map(s => {
        if (s.id !== skillId) return s;
        return {
            ...s,
            expanded: true,
            milestones: [...s.milestones, { id: 'm-' + Date.now(), text: val, done: false }]
        };
    });
    persistData();
    renderSkills();
};

window.deleteMilestone = function(skillId, msId) {
    skills = skills.map(s => {
        if (s.id !== skillId) return s;
        return { ...s, milestones: s.milestones.filter(m => m.id !== msId) };
    });
    persistData();
    renderSkills();
};

window.deleteSkill = function(skillId) {
    skills = skills.filter(s => s.id !== skillId);
    persistData();
    renderSkills();
};

const backdrop = document.getElementById('modalBackdrop');
const appForm = document.getElementById('appForm');

function openCreateModal() {
    appForm.reset();
    document.getElementById('appId').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Application';
    document.getElementById('dateInput').valueAsDate = new Date();
    backdrop.classList.add('open');
}

window.openEditModal = function(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;

    document.getElementById('appId').value = app.id;
    document.getElementById('companyInput').value = app.company;
    document.getElementById('roleInput').value = app.role;
    document.getElementById('statusInput').value = app.status;
    document.getElementById('dateInput').value = app.date;
    document.getElementById('notesInput').value = app.notes || '';
    document.getElementById('modalTitle').textContent = 'Edit Application';
    backdrop.classList.add('open');
};

function closeModal() {
    backdrop.classList.remove('open');
}

window.removeApplication = function(id) {
    if (confirm('Remove this application from your tracker?')) {
        applications = applications.filter(a => a.id !== id);
        persistData();
        renderApplications();
    }
};

function exportApplicationsCSV() {
    if (applications.length === 0) return;
    const headers = ['Company', 'Role', 'Status', 'Date', 'Notes'];
    const rows = applications.map(a => [
        `"${a.company.replace(/"/g, '""')}"`,
        `"${a.role.replace(/"/g, '""')}"`,
        a.status,
        a.date,
        `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CareerTrack_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

document.getElementById('openModalBtn').addEventListener('click', openCreateModal);
document.getElementById('closeModalBtn').addEventListener('click', closeModal);
document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });

appForm.addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('appId').value;
    const entry = {
        id: id || 'app-' + Date.now(),
        company: document.getElementById('companyInput').value.trim(),
        role: document.getElementById('roleInput').value.trim(),
        status: document.getElementById('statusInput').value,
        date: document.getElementById('dateInput').value,
        notes: document.getElementById('notesInput').value.trim()
    };

    if (id) {
        applications = applications.map(a => a.id === id ? entry : a);
    } else {
        applications.unshift(entry);
    }

    persistData();
    renderApplications();
    closeModal();
});

document.getElementById('addSkillForm').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('newSkillName');
    const name = input.value.trim();
    if (!name) return;

    skills.push({
        id: 'sk-' + Date.now(),
        name,
        expanded: true,
        milestones: [{ id: 'm-' + Date.now(), text: 'Core Concepts & Fundamentals', done: false }]
    });

    persistData();
    renderSkills();
    input.value = '';
});

document.getElementById('searchInput').addEventListener('input', renderApplications);
document.getElementById('statusFilter').addEventListener('change', renderApplications);
document.getElementById('exportBtn').addEventListener('click', exportApplicationsCSV);
document.getElementById('closeToastBtn').addEventListener('click', () => {
    document.getElementById('reminderToast').classList.remove('show');
});

document.getElementById('viewListBtn').addEventListener('click', () => {
    activeView = 'list';
    document.getElementById('viewListBtn').classList.add('active');
    document.getElementById('viewBoardBtn').classList.remove('active');
    document.getElementById('tableView').style.display = 'block';
    document.getElementById('boardView').classList.remove('active');
});

document.getElementById('viewBoardBtn').addEventListener('click', () => {
    activeView = 'board';
    document.getElementById('viewBoardBtn').classList.add('active');
    document.getElementById('viewListBtn').classList.remove('active');
    document.getElementById('tableView').style.display = 'none';
    document.getElementById('boardView').classList.add('active');
});

persistData();
renderApplications();
renderSkills();
triggerInitialToast();

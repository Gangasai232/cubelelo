/* ═══════════════════════════════════════════════════════════════
   CUBELELO SUPPORT INSIGHTS — script.js  v5
   Changes: AI assistant removed · Green Low rows · Tight layout
   ═══════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────────
   SAMPLE DATA
────────────────────────────────────────────────────────────── */
const SAMPLE_CSV = `Ticket ID,Date,Customer Name,Product,Issue Description,Category,Status,Priority
T001,01-03-26,Amit Sharma,3x3 Speed Cube Pro,Cube is very tight and scratches seen,product quality,open,High
T002,2026/03/01,Riya Mehta,2x2 cube basic,Got wrong item (black instead of stickerless),Wrong item,closed,Medium
T003,02-03-2026,Karan Patel,4x4 Master Cube,delivery late by 5 days,Delivery Delay,Open,HIGH
T004,2026-03-02,Neha Verma,Lube Kit Pro,oil bottle leaking,,Resolved,Low
T005,03/03/26,Arjun Nair,3x3 speed cube pro,corner broken on arrival,damaged product,open,High
T006,2026-03-03,Pooja Singh,Timer Stack Pro,timer not working properly,Product defect,Closed,Medium
T007,04-03-2026,Rohit Gupta,Pyraminx Speed Cube,marked delivered but not received,Delivery Issue,open,High
T008,2026-03-04,Sneha Iyer,3x3 Speed Cube Lite,no update on replacement request,Replacement Delay,,Medium
T009,05-03-2026,Ankit Jain,5x5 Cube Advanced,pieces popping frequently,Product Quality,Closed,Medium
T010,2026-03-05,Kavya Shah,2x2 Cube Basic,order not shipped yet,shipping delay,open,Low
T011,06-03-2026,Vikas Yadav,3x3 Speed Cube Pro,looks like duplicate product,authenticity issue,Open,High
T012,2026-03-06,Meera Joshi,Lube Kit Basic,missing item in box,Missing Item,closed,Medium
T013,07-03-26,Harsh Agarwal,Mirror Cube,edges sharp difficult to use,Product quality,Closed,Low
T014,2026-03-07,Simran Kaur,3x3 Speed Cube Pro,color faded quickly,product Quality,open,Medium
T015,08-03-2026,Raj Malhotra,4x4 Master Cube,refund not received after return,Refund delay,open,High
T016,2026-03-08,Aisha Khan,Timer Stack Pro,buttons not responding,product defect,Closed,Medium
T017,09-03-2026,Saurabh Mishra,3x3 Speed Cube Lite,delivery guy not reachable,delivery issue,Open,High
T018,2026-03-09,Nidhi Kapoor,Pyraminx Speed Cube,packaging damaged but product ok,Packaging issue,closed,Low
T019,10-03-2026,Aditya Rao,5x5 Cube Advanced,replacement approved not shipped,Replacement delay,open,High
T020,2026-03-10,Ananya Das,2x2 Cube Basic,combo ordered got only 1 item,,Closed,Medium
T021,11-03-2026,Rahul Chatterjee,3x3 Speed Cube Pro,not smooth even after lube,Product quality,Open,Medium
T022,2026-03-11,Priya Nair,Lube Kit Pro,wrong quantity delivered,Wrong Item,closed,Low
T023,12-03-2026,Deepak Singh,Mirror Cube,late delivery but fine,Delivery delay,Closed,Low
T024,2026-03-12,Shreya Gupta,4x4 Master Cube,internal broken,product defect,open,High
T025,13-03-2026,Manish Kumar,3x3 Speed Cube Lite,cancelled but refund pending,refund Delay,Open,High
T026,2026-03-13,Tanya Arora,Pyraminx Speed Cube,received used product,Product quality,open,High
T027,14-03-2026,Gaurav Bansal,Timer Stack Pro,display flickering,Product Defect,Closed,Medium
T028,2026-03-14,Ishita Sen,5x5 Cube Advanced,delivery rescheduled many times,Delivery Delay,open,Medium
T029,15-03-2026,Varun Khanna,3x3 Speed Cube Pro,replacement wrong again,wrong item,Open,High
T030,2026-03-15,Divya Reddy,Lube Kit Basic,cap broken leaking oil,Product Quality,closed,Low`;

/* ──────────────────────────────────────────────────────────────
   GLOBAL STATE
────────────────────────────────────────────────────────────── */
let allTickets        = [];
let unresolvedTickets = [];
let currentStats      = null;
let checklistState    = [];

/* ──────────────────────────────────────────────────────────────
   THEME TOGGLE
────────────────────────────────────────────────────────────── */
function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('cubelelo-theme', next);
}
function initTheme() {
  const saved = localStorage.getItem('cubelelo-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
}

/* ──────────────────────────────────────────────────────────────
   CSV PARSING
────────────────────────────────────────────────────────────── */
function parseCSV(raw) {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

  const headers = splitCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, ' '));
  const fieldMap = {
    'ticket id':'ticketId','ticketid':'ticketId',
    'date':'date','created date':'date',
    'customer name':'customerName','customername':'customerName',
    'product':'product','product name':'product',
    'issue description':'description','description':'description',
    'category':'category','issue type':'category',
    'status':'status','priority':'priority',
  };
  const colKeys = headers.map(h => fieldMap[h] || h);
  const tickets = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line);
    const obj = {};
    colKeys.forEach((key, idx) => { obj[key] = (values[idx] || '').trim(); });
    tickets.push(normalise(obj));
  }
  if (tickets.length === 0) throw new Error('No data rows found in CSV.');
  return tickets;
}

function splitCSVLine(line) {
  const result = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuote = !inQuote;
    else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

/* ──────────────────────────────────────────────────────────────
   NORMALISATION
────────────────────────────────────────────────────────────── */
function normalise(t) {
  t.category   = normaliseCategory(t.category);
  t.status     = normaliseStatus(t.status);
  t.priority   = normalisePriority(t.priority);
  t.product    = titleCase(t.product);
  t.parsedDate = parseDate(t.date);
  return t;
}

const CATEGORY_MAP = {
  'product quality':'Product Quality','product defect':'Product Defect',
  'damaged product':'Damaged Product','delivery delay':'Delivery Delay',
  'delivery issue':'Delivery Delay','shipping delay':'Delivery Delay',
  'wrong item':'Wrong Item','refund delay':'Refund Delay',
  'replacement delay':'Replacement Delay','missing item':'Missing Item',
  'packaging issue':'Packaging Issue','authenticity issue':'Authenticity Issue',
};
function normaliseCategory(raw) {
  if (!raw || !raw.trim()) return 'Uncategorised';
  return CATEGORY_MAP[raw.trim().toLowerCase()] || titleCase(raw.trim());
}
function normaliseStatus(raw) {
  if (!raw || !raw.trim()) return 'Open';
  const s = raw.trim().toLowerCase();
  if (s === 'closed') return 'Closed';
  if (s === 'resolved') return 'Resolved';
  if (s.includes('progress')) return 'In Progress';
  return 'Open';
}
function normalisePriority(raw) {
  const p = (raw || '').trim().toLowerCase();
  if (p === 'high') return 'High';
  if (p === 'medium') return 'Medium';
  if (p === 'low') return 'Low';
  return 'Medium';
}
function parseDate(raw) {
  if (!raw) return null;
  const s = raw.trim();
  let m = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3]);
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (m) { let yr=+m[3]; if(yr<100) yr+=2000; return new Date(yr,+m[2]-1,+m[1]); }
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) { let yr=+m[3]; if(yr<100) yr+=2000; return new Date(yr,+m[1]-1,+m[2]); }
  return new Date(s) || null;
}
function daysSince(date) {
  if (!date || isNaN(date)) return null;
  return Math.floor((new Date() - date) / 86400000);
}
function titleCase(str) {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/* ──────────────────────────────────────────────────────────────
   REASON GENERATOR
────────────────────────────────────────────────────────────── */
const REASON_MAP = {
  'Delivery Delay':    'Logistics or courier partner delay',
  'Refund Delay':      'Payment gateway processing backlog',
  'Replacement Delay': 'Replacement not dispatched — warehouse gap',
  'Product Quality':   'Needs QC inspection or batch recall review',
  'Damaged Product':   'Packaging inadequacy or transit mishandling',
  'Wrong Item':        'Pick-and-pack error — warehouse mis-fulfilment',
  'Product Defect':    'Manufacturing defect; vendor escalation needed',
  'Missing Item':      'Partial shipment — contents not fully verified',
  'Uncategorised':     'Category missing — needs manual triage',
  'Authenticity Issue':'Product authenticity check required',
};
function getReason(ticket) {
  return REASON_MAP[ticket.category] || `Follow-up: ${ticket.description.slice(0,48)}…`;
}

/* ──────────────────────────────────────────────────────────────
   ANALYSIS ENGINE
────────────────────────────────────────────────────────────── */
function analyseTickets(tickets) {
  const total = tickets.length;
  const unresolved = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');

  const catCount = {};
  tickets.forEach(t => { catCount[t.category] = (catCount[t.category] || 0) + 1; });
  const categories = Object.entries(catCount)
    .sort((a,b) => b[1]-a[1])
    .map(([name, count]) => ({ name, count, pct: ((count/total)*100).toFixed(0) }));

  const catOpenCount = {};
  unresolved.forEach(t => { catOpenCount[t.category] = (catOpenCount[t.category] || 0) + 1; });

  const prodCount = {};
  tickets.forEach(t => { const p=t.product||'Unknown'; prodCount[p]=(prodCount[p]||0)+1; });
  const topProduct = Object.entries(prodCount).sort((a,b)=>b[1]-a[1])[0];

  const pendingOld = unresolved.filter(t => { const d=daysSince(t.parsedDate); return d!==null && d>3; });
  const highPriUnresolved = unresolved.filter(t => t.priority === 'High');
  const repeatedProducts = Object.entries(prodCount).filter(([,c])=>c>=3).sort((a,b)=>b[1]-a[1]);

  return {
    total, unresolved, categories, catOpenCount,
    topProduct, pendingOld, highPriUnresolved, repeatedProducts,
    catCount, prodCount
  };
}

/* ──────────────────────────────────────────────────────────────
   MANAGER SUMMARY
────────────────────────────────────────────────────────────── */
function buildManagerSummary(stats) {
  const { total, unresolved, categories, topProduct, pendingOld, highPriUnresolved } = stats;
  const lines = [];
  const openRate = ((unresolved.length/total)*100).toFixed(0);

  lines.push({
    text: `<strong>${total}</strong> support tickets received this week — <strong>${unresolved.length}</strong> still unresolved (<strong>${openRate}%</strong> open rate).`,
    urgent: unresolved.length/total > 0.5, critical: false, icon: '📈'
  });
  if (categories[0]) {
    lines.push({
      text: `Top issue: <strong>${categories[0].name}</strong> with <strong>${categories[0].count}</strong> tickets (${categories[0].pct}%) — category-level action required.`,
      urgent: categories[0].count >= 5, critical: false, icon: '🔥'
    });
  }
  if (topProduct) {
    lines.push({
      text: `Most flagged product: <strong>${topProduct[0]}</strong> — <strong>${topProduct[1]}</strong> complaints. Schedule immediate SKU quality review.`,
      urgent: topProduct[1] >= 5, critical: false, icon: '📦'
    });
  }
  if (highPriUnresolved.length > 0) {
    lines.push({
      text: `<strong>${highPriUnresolved.length}</strong> high-priority tickets unresolved — escalation needed. Customer churn risk elevated.`,
      urgent: false, critical: true, icon: '🚨'
    });
  }
  if (pendingOld.length > 0) {
    lines.push({
      text: `<strong>${pendingOld.length}</strong> ticket${pendingOld.length>1?'s':''} pending over <strong>3 days</strong> — SLA breach risk. Escalate to team lead.`,
      urgent: pendingOld.length >= 3, critical: false, icon: '⏰'
    });
  }
  return lines;
}

/* ──────────────────────────────────────────────────────────────
   ACTION CHECKLIST
────────────────────────────────────────────────────────────── */
function buildChecklist(stats) {
  const { highPriUnresolved, pendingOld, categories, topProduct, repeatedProducts } = stats;
  const items = [];

  if (highPriUnresolved.length > 0)
    items.push({ text:`Escalate ${highPriUnresolved.length} high-priority open ticket${highPriUnresolved.length>1?'s':''} to team lead`, tag:'urgent', done:false });
  if (pendingOld.length > 0)
    items.push({ text:`Follow up on ${pendingOld.length} overdue ticket${pendingOld.length>1?'s':''} (>3 days old)`, tag:'urgent', done:false });
  if (topProduct)
    items.push({ text:`Schedule QC review for "${topProduct[0]}" (${topProduct[1]} complaints)`, tag:'qc', done:false });
  if (categories[0])
    items.push({ text:`Investigate root cause of "${categories[0].name}" issues`, tag:'review', done:false });
  if (repeatedProducts.length > 1)
    items.push({ text:`Flag ${repeatedProducts.length} repeat-complaint products to vendor`, tag:'ops', done:false });
  if (items.length < 3)
    items.push({ text:'Update ticket categories for uncategorised items', tag:'ops', done:false });

  checklistState = items;
}

function renderChecklist() {
  const container = document.getElementById('checklistItems');
  const progress  = document.getElementById('checklistProgress');
  const total = checklistState.length;
  const done  = checklistState.filter(i => i.done).length;
  progress.textContent = `${done} / ${total} done`;
  progress.className = 'checklist-progress' + (done===total && total>0 ? ' all-done' : '');
  container.innerHTML = checklistState.map((item, idx) => `
    <div class="checklist-item ${item.done?'done':''}" onclick="toggleChecklistItem(${idx})">
      <div class="checklist-checkbox">${item.done?'✓':''}</div>
      <div class="checklist-item-content">
        <div class="checklist-item-text">${item.text}</div>
        <span class="checklist-item-tag tag-${item.tag}">${item.tag}</span>
      </div>
    </div>
  `).join('');
}

function toggleChecklistItem(idx) {
  checklistState[idx].done = !checklistState[idx].done;
  renderChecklist();
}

/* ──────────────────────────────────────────────────────────────
   RENDER: STAT ROW
────────────────────────────────────────────────────────────── */
function renderStatRow(stats) {
  const { total, unresolved, highPriUnresolved, pendingOld } = stats;
  const resolved = total - unresolved.length;
  const cards = [
    { label:'Total Tickets',      value:total,                  desc:'received this week',  accent:'#f97316', accentGlow:'rgba(249,115,22,0.08)',  icon:'🎫', colorValue:false },
    { label:'Unresolved',         value:unresolved.length,      desc:`${((unresolved.length/total)*100).toFixed(0)}% of total`, accent:'#f59e0b', accentGlow:'rgba(245,158,11,0.08)', icon:'⏳', colorValue:true },
    { label:'Resolved',           value:resolved,               desc:`${((resolved/total)*100).toFixed(0)}% resolution rate`, accent:'#10b981', accentGlow:'rgba(16,185,129,0.08)',  icon:'✅', colorValue:false },
    { label:'High Priority Open', value:highPriUnresolved.length, desc:'urgent escalations', accent:'#ef4444', accentGlow:'rgba(239,68,68,0.08)',  icon:'🎯', colorValue:true },
    { label:'Overdue >3 Days',    value:pendingOld.length,      desc:'SLA breach risk',     accent:'#8b5cf6', accentGlow:'rgba(139,92,246,0.07)', icon:'⌛', colorValue:pendingOld.length>0 },
  ];
  document.getElementById('statRow').innerHTML = cards.map(c => `
    <div class="stat-card" style="--accent:${c.accent};--accent-glow:${c.accentGlow}">
      <span class="stat-icon">${c.icon}</span>
      <div class="stat-label">${c.label}</div>
      <div class="stat-value ${c.colorValue?'stat-value-colored':''}">${c.value}</div>
      <div class="stat-desc">${c.desc}</div>
    </div>
  `).join('');
}

/* ──────────────────────────────────────────────────────────────
   RENDER: CATEGORIES + FOOTER
────────────────────────────────────────────────────────────── */
function renderCategories(categories, catOpenCount, total) {
  const maxCount = categories[0]?.count || 1;

  document.getElementById('categoriesList').innerHTML = categories.map((cat, i) => {
    const barWidth = Math.max(4, (cat.count / maxCount) * 100);
    return `
      <div class="cat-row">
        <span class="cat-rank">${i+1}</span>
        <div class="cat-info">
          <div class="cat-name">
            <span class="cat-name-label">${cat.name}</span>
            <span class="cat-stats">${cat.count} · ${cat.pct}%</span>
          </div>
          <div class="cat-bar-wrap">
            <div class="cat-bar" data-width="${barWidth}" style="width:0%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  setTimeout(() => {
    document.querySelectorAll('.cat-bar').forEach((bar, i) => {
      setTimeout(() => { bar.style.width = bar.dataset.width + '%'; }, i * 80);
    });
  }, 100);

  renderCatFooter(categories.slice(0, 5), catOpenCount);
}

function renderCatFooter(categories, catOpenCount) {
  const footer = document.getElementById('catFooter');
  if (!categories.length) { footer.innerHTML = ''; return; }

  const rows = categories.map(cat => {
    const open     = catOpenCount[cat.name] || 0;
    const resolved = cat.count - open;
    return `
      <div class="cat-footer-stat">
        <span class="cat-footer-stat-name" title="${cat.name}">${cat.name}</span>
        <div class="cat-footer-stat-pills">
          <span class="stat-pill stat-pill-open"  title="Open / In Progress">${open} open</span>
          <span class="stat-pill stat-pill-res"   title="Resolved / Closed">${resolved} done</span>
        </div>
      </div>
    `;
  }).join('');

  footer.innerHTML = `
    <div class="cat-footer-title">
      <span class="cat-footer-title-icon">📂</span>
      <span class="cat-footer-title-text">Status Breakdown — Top Categories</span>
      <div class="cat-footer-legend">
        <span class="cat-legend-dot"><span class="dot-open"></span>Open</span>
        <span class="cat-legend-dot"><span class="dot-resolved"></span>Done</span>
      </div>
    </div>
    <div class="cat-footer-stats">${rows}</div>
  `;
}

/* ──────────────────────────────────────────────────────────────
   RENDER: MANAGER SUMMARY
────────────────────────────────────────────────────────────── */
function renderManagerSummary(stats) {
  const lines = buildManagerSummary(stats);
  document.getElementById('managerSummary').innerHTML = lines.map((line, i) => {
    const cls = line.critical ? 'summary-line critical' : line.urgent ? 'summary-line urgent' : 'summary-line';
    return `
      <div class="${cls}">
        <div class="summary-left">
          <span class="summary-num">${i+1}</span>
          <span class="summary-icon-small">${line.icon}</span>
        </div>
        <div class="summary-content">${line.text}</div>
      </div>
    `;
  }).join('');
  buildChecklist(stats);
  renderChecklist();
}

/* ──────────────────────────────────────────────────────────────
   RENDER: KEY INSIGHTS
────────────────────────────────────────────────────────────── */
function renderInsights(stats) {
  const { categories, topProduct, pendingOld, repeatedProducts } = stats;
  const insights = [
    {
      emoji:'🏆', heading:'Most Common Issue',
      value: categories[0] ? `<span class="highlight">${categories[0].name}</span>` : 'N/A',
      detail: categories[0] ? `${categories[0].count} tickets · ${categories[0].pct}% of all` : '—',
    },
    {
      emoji:'📦', heading:'Most Complained Product',
      value: topProduct ? `<span class="highlight">${topProduct[0]}</span>` : 'N/A',
      detail: topProduct ? `${topProduct[1]} tickets filed — QC review needed` : '—',
    },
    {
      emoji:'⏰', heading:'SLA Overdue (>3 days)',
      value: `<span class="highlight">${pendingOld.length}</span> tickets`,
      detail: pendingOld.length ? 'At risk of SLA breach — escalate immediately' : 'All tickets within SLA window ✓',
    },
    {
      emoji:'🔁', heading:'Repeat Complaint Products',
      value: repeatedProducts.length ? `<span class="highlight">${repeatedProducts.length}</span> product${repeatedProducts.length>1?'s':''}` : 'None detected',
      detail: repeatedProducts.length ? repeatedProducts.slice(0,2).map(([p,c])=>`${p}: ${c}×`).join(' · ') : 'No product has 3+ complaints',
    },
  ];
  document.getElementById('insightsGrid').innerHTML = insights.map(ins => `
    <div class="insight-card">
      <span class="insight-emoji">${ins.emoji}</span>
      <div class="insight-heading">${ins.heading}</div>
      <div class="insight-value">${ins.value}</div>
      <div class="insight-detail">${ins.detail}</div>
    </div>
  `).join('');
}

/* ──────────────────────────────────────────────────────────────
   RENDER: UNRESOLVED TABLE
   High = RED row + RED badge
   Medium = YELLOW row + YELLOW badge
   Low = GREEN row + GREEN badge  ← NEW
────────────────────────────────────────────────────────────── */
function populateCategoryFilter(unresolved) {
  const sel = document.getElementById('filterCat');
  const cats = [...new Set(unresolved.map(t => t.category))].sort();
  sel.innerHTML = '<option value="">All</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderUnresolvedTable(tickets) {
  const wrap = document.getElementById('unresolvedTableWrap');
  if (tickets.length === 0) {
    wrap.innerHTML = '<div class="empty-state">No tickets match the current filter.</div>';
    return;
  }

  const rows = tickets.map(t => {
    const days      = daysSince(t.parsedDate);
    const daysStr   = days !== null
      ? `<span class="days-badge${days > 3 ? ' old' : ''}">${days}d</span>`
      : '<span class="days-badge">—</span>';

    const priClass  = { High:'pri-high', Medium:'pri-medium', Low:'pri-low' }[t.priority] || 'pri-medium';
    const priSymbol = { High:'▲', Medium:'●', Low:'▼' }[t.priority] || '●';

    /* High = red tint, Medium = yellow tint, Low = green tint */
    const rowClass  = t.priority === 'High'   ? 'row-high'
                    : t.priority === 'Medium' ? 'row-medium'
                    :                           'row-low';

    const statusClass = t.status === 'In Progress' ? 'status-progress' : 'status-open';

    return `
      <tr class="${rowClass}">
        <td><span class="tid">${t.ticketId || '—'}</span></td>
        <td>${t.customerName || '—'}</td>
        <td>${t.product || '—'}</td>
        <td>${t.category}</td>
        <td><span class="status-badge ${statusClass}">${t.status}</span></td>
        <td><span class="pri-badge ${priClass}">${priSymbol} ${t.priority}</span></td>
        <td>${daysStr}</td>
        <td class="reason-text">${getReason(t)}</td>
      </tr>
    `;
  }).join('');

  wrap.innerHTML = `
    <table class="ticket-table">
      <thead>
        <tr>
          <th>Ticket ID</th><th>Customer</th><th>Product</th>
          <th>Issue Type</th><th>Status</th><th>Priority</th>
          <th>Age</th><th>Likely Reason</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/* ──────────────────────────────────────────────────────────────
   FILTER LOGIC
────────────────────────────────────────────────────────────── */
function applyFilters() {
  const catFilter = document.getElementById('filterCat').value;
  const priFilter = document.getElementById('filterPri').value;
  let filtered = [...unresolvedTickets];
  if (catFilter) filtered = filtered.filter(t => t.category === catFilter);
  if (priFilter) filtered = filtered.filter(t => t.priority === priFilter);

  const noteEl = document.getElementById('filterNote');
  if (catFilter || priFilter) {
    noteEl.classList.remove('hidden');
    const parts = [];
    if (catFilter) parts.push(`Issue Type = "${catFilter}"`);
    if (priFilter) parts.push(`Priority = "${priFilter}"`);
    noteEl.textContent = `Showing ${filtered.length} of ${unresolvedTickets.length} tickets · ${parts.join(' + ')}`;
  } else {
    noteEl.classList.add('hidden');
  }
  renderUnresolvedTable(filtered);
}

function clearFilters() {
  document.getElementById('filterCat').value = '';
  document.getElementById('filterPri').value = '';
  applyFilters();
}

/* ──────────────────────────────────────────────────────────────
   MAIN ORCHESTRATOR
────────────────────────────────────────────────────────────── */
function renderDashboard(tickets) {
  allTickets    = tickets;
  const stats   = analyseTickets(tickets);
  currentStats  = stats;
  unresolvedTickets = stats.unresolved;

  const dates = tickets.map(t => t.parsedDate).filter(Boolean);
  if (dates.length) {
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    const fmt = d => d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    document.getElementById('weekLabel').textContent = `${fmt(min)} – ${fmt(max)}`;
  }

  document.getElementById('ticketCountBadge').textContent     = `${tickets.length} tickets`;
  document.getElementById('unresolvedCountBadge').textContent = `${unresolvedTickets.length} open`;

  renderStatRow(stats);
  renderCategories(stats.categories, stats.catOpenCount, stats.total);
  renderManagerSummary(stats);
  renderInsights(stats);
  populateCategoryFilter(unresolvedTickets);
  renderUnresolvedTable(unresolvedTickets);

  document.getElementById('inputSection').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ──────────────────────────────────────────────────────────────
   INPUT HANDLERS
────────────────────────────────────────────────────────────── */
function showError(msg) { const el=document.getElementById('errorMsg'); el.textContent=msg; el.classList.remove('hidden'); }
function clearError() { document.getElementById('errorMsg').classList.add('hidden'); }

function handleAnalyze() {
  clearError();
  const pasteVal = document.getElementById('csvPaste').value.trim();
  if (pasteVal) {
    try { renderDashboard(parseCSV(pasteVal)); } catch(e) { showError('CSV parse error: ' + e.message); }
    return;
  }
  const fileInput = document.getElementById('csvFile');
  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = e => {
      try { renderDashboard(parseCSV(e.target.result)); } catch(err) { showError('File error: ' + err.message); }
    };
    reader.onerror = () => showError('Could not read file. Please try again.');
    reader.readAsText(fileInput.files[0]);
    return;
  }
  showError('Please upload a CSV file or paste CSV text before clicking Generate Summary.');
}

function loadSampleData() {
  document.getElementById('csvPaste').value = SAMPLE_CSV;
  document.getElementById('fileName').textContent = '';
  clearError();
}

function resetDashboard() {
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('inputSection').classList.remove('hidden');
  document.getElementById('csvPaste').value = '';
  document.getElementById('csvFile').value = '';
  document.getElementById('fileName').textContent = '';
  currentStats = null;
  checklistState = [];
  clearError();
}

/* ──────────────────────────────────────────────────────────────
   FILE UPLOAD & DRAG-DROP
────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const zone       = document.getElementById('uploadZone');
  const fileInput  = document.getElementById('csvFile');
  const browseBtn  = document.getElementById('browseBtn');
  const fileNameEl = document.getElementById('fileName');

  browseBtn.addEventListener('click', () => fileInput.click());
  zone.addEventListener('click', e => { if (e.target !== browseBtn) fileInput.click(); });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      fileNameEl.textContent = fileInput.files[0].name;
      document.getElementById('csvPaste').value = '';
    }
  });
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      fileInput.files = e.dataTransfer.files;
      fileNameEl.textContent = file.name;
      document.getElementById('csvPaste').value = '';
    } else {
      showError('Please drop a valid .csv file.');
    }
  });
});

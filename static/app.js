// ─── Identity ───────────────────────────────────────────────
const NAMES = ['Shadow','Blaze','Nova','Pixel','Storm','Echo','Frost','Viper','Zen','Arc'];
const COLORS = ['#ff6b6b','#ffa94d','#ffe066','#69db7c','#4dabf7','#cc5de8','#f783ac','#63e6be','#74c0fc','#a9e34b'];

function getOrCreateUser() {
  let user = JSON.parse(localStorage.getItem('grid_user'));
  if (!user) {
    user = {
      name: NAMES[Math.floor(Math.random() * NAMES.length)] + Math.floor(Math.random() * 99),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    localStorage.setItem('grid_user', JSON.stringify(user));
  }
  return user;
}

const ME = getOrCreateUser();
const COOLDOWN_MS = 1500;
let onCooldown = false;
let myTileCount = 0;
let tooltip = null;

// ─── HUD Setup ──────────────────────────────────────────────
document.getElementById('my-dot').style.background = ME.color;
document.getElementById('my-name').textContent = ME.name;

// ─── Grid Render ────────────────────────────────────────────
const gridEl = document.getElementById('grid');
const cells = [];

function buildGrid() {
  for (let i = 0; i < 800; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.id = i;
    cell.addEventListener('click', () => onCellClick(i));
    cell.addEventListener('mouseenter', (e) => showTooltip(e, i));
    cell.addEventListener('mouseleave', hideTooltip);
    gridEl.appendChild(cell);
    cells.push(cell);
  }
}

function applyTile(tile, animate = false) {
  const cell = cells[tile.tile_id];
  if (!cell) return;
  cell.style.background = tile.color;
  cell.dataset.owner = tile.owner_name || '';

  if (tile.owner_name === ME.name) {
    cell.classList.add('mine');
  } else {
    cell.classList.remove('mine');
  }

  if (animate) {
    const cls = tile.owner_name === ME.name ? 'pop' : 'ripple';
    cell.classList.remove('pop', 'ripple');
    void cell.offsetWidth; // force reflow to restart animation
    cell.classList.add(cls);
    setTimeout(() => cell.classList.remove(cls), 400);
  }
}

// ─── Load Initial State ──────────────────────────────────────
async function loadGrid() {
  const res = await fetch('/api/grid/');
  const tiles = await res.json();
  myTileCount = 0;
  tiles.forEach(tile => {
    applyTile(tile, false);
    if (tile.owner_name === ME.name) myTileCount++;
  });
  document.getElementById('my-count').textContent = myTileCount;
}

// ─── WebSocket ───────────────────────────────────────────────
const wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${wsProtocol}://${location.host}/ws/grid/`);

ws.onopen = () => {
  console.log('WebSocket connected');
  showToast('Connected to grid!');
};

ws.onclose = () => {
  showToast('Disconnected. Refresh to reconnect.');
};

ws.onmessage = (e) => {
  const data = JSON.parse(e.data);

  if (data.type === 'tile.updated') {
    // Update tile count if it was previously mine or now mine
    const cell = cells[data.tile_id];
    const wasmine = cell.dataset.owner === ME.name;
    const ismine = data.owner_name === ME.name;
    if (wasmine && !ismine) myTileCount--;
    if (!wasmine && ismine) myTileCount++;
    document.getElementById('my-count').textContent = myTileCount;

    applyTile({ tile_id: data.tile_id, owner_name: data.owner_name, color: data.color }, true);
    addFeedItem(data.owner_name, data.tile_id);
  }

  if (data.type === 'online.count') {
    document.getElementById('online-count').textContent = data.count;
  }
};

// ─── Tile Click ──────────────────────────────────────────────
function onCellClick(tileId) {
  if (onCooldown) {
    showToast('⏳ Wait a moment...');
    return;
  }
  ws.send(JSON.stringify({
    tile_id: tileId,
    owner_name: ME.name,
    color: ME.color,
  }));
  startCooldown();
}

function startCooldown() {
  onCooldown = true;
  const bar = document.getElementById('cooldown-bar');
  const start = Date.now();

  function tick() {
    const elapsed = Date.now() - start;
    const pct = Math.min((elapsed / COOLDOWN_MS) * 100, 100);
    bar.style.width = pct + '%';
    if (elapsed < COOLDOWN_MS) {
      requestAnimationFrame(tick);
    } else {
      bar.style.width = '0%';
      onCooldown = false;
    }
  }
  requestAnimationFrame(tick);
}

// ─── Leaderboard ─────────────────────────────────────────────
async function loadLeaderboard() {
  const res = await fetch('/api/leaderboard/');
  const data = await res.json();
  const el = document.getElementById('leaderboard');
  el.innerHTML = '';
  data.forEach((row, i) => {
    const div = document.createElement('div');
    div.className = 'lb-row';
    div.innerHTML = `
      <div class="lb-dot" style="background:${row.color}"></div>
      <div class="lb-name">${row.owner_name}</div>
      <div class="lb-count">${row.count}</div>
    `;
    el.appendChild(div);
  });
}

// ─── Live Feed ───────────────────────────────────────────────
function addFeedItem(name, tileId) {
  const feed = document.getElementById('feed');
  const item = document.createElement('div');
  item.className = 'feed-item';
  item.innerHTML = `<span style="color:${name === ME.name ? ME.color : '#aaa'}">${name}</span> captured #${tileId}`;
  feed.prepend(item);
  // Keep only last 20 items
  while (feed.children.length > 20) feed.removeChild(feed.lastChild);
}

// ─── Tooltip ─────────────────────────────────────────────────
function showTooltip(e, tileId) {
  const owner = cells[tileId].dataset.owner;
  if (!owner) return;
  tooltip = document.createElement('div');
  tooltip.className = 'cell-tooltip';
  tooltip.textContent = `${owner} owns #${tileId}`;
  document.body.appendChild(tooltip);
  moveTooltip(e);
  cells[tileId].addEventListener('mousemove', moveTooltip);
}

function moveTooltip(e) {
  if (!tooltip) return;
  tooltip.style.left = (e.clientX + 12) + 'px';
  tooltip.style.top = (e.clientY - 28) + 'px';
}

function hideTooltip() {
  if (tooltip) { tooltip.remove(); tooltip = null; }
}

// ─── Toast ───────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ─── Init ────────────────────────────────────────────────────
buildGrid();
loadGrid();
loadLeaderboard();
setInterval(loadLeaderboard, 5000);
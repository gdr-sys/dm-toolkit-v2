const Debug = (() => {
  const MAX_LINES = 80;
  let lines = [];
  let enabled = false;
  let panelBodyEl = null;
  let panelEl = null;

  const timestamp = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}.${d.getMilliseconds().toString().padStart(3,'0')}`;
  };

  const addLine = (type, args) => {
    const msg = args.map(a => {
      if (typeof a === 'object') {
        try { return JSON.stringify(a); }
        catch { return String(a); }
      }
      return String(a);
    }).join(' ');

    const line = { type, msg, ts: timestamp() };
    lines.push(line);
    if (lines.length > MAX_LINES) lines.shift();

    if (type === 'error') console.error(`[DM] ${msg}`);
    else if (type === 'warn') console.warn(`[DM] ${msg}`);
    else console.log(`[DM] ${msg}`);

    if (panelBodyEl && panelBodyEl.classList.contains('open')) {
      renderLine(line);
      panelBodyEl.scrollTop = panelBodyEl.scrollHeight;
    }
  };

  const renderLine = (line) => {
    if (!panelBodyEl) return;
    const el = document.createElement('div');
    el.className = `debug-line ${line.type}`;
    el.textContent = `[${line.ts}] ${line.msg}`;
    panelBodyEl.appendChild(el);

    while (panelBodyEl.children.length > MAX_LINES) {
      panelBodyEl.removeChild(panelBodyEl.firstChild);
    }
  };

  const render = () => {
    if (!panelBodyEl) return;
    panelBodyEl.innerHTML = '';
    lines.forEach(renderLine);
    panelBodyEl.scrollTop = panelBodyEl.scrollHeight;
  };

  const init = (panelBodyElement, panelElement) => {
    panelBodyEl = panelBodyElement;
    panelEl = panelElement;
    const settings = Storage ? Storage.getSettings() : { debugEnabled: false };
    enabled = settings.debugEnabled || false;
    if (panelEl) panelEl.classList.toggle('active', enabled);
    Debug.log('Debug inizializzato', `storage: ${enabled ? 'ON' : 'OFF'}`);
    const info = Storage ? Storage.getStorageInfo() : {};
    Debug.info(`Storage: ${info.usedKB || '?'} KB usati, ${info.campaigns || 0} campagne`);
  };

  const toggle = () => {
    enabled = !enabled;
    if (panelEl) panelEl.classList.toggle('active', enabled);
    if (Storage) Storage.updateSettings({ debugEnabled: enabled });
    if (enabled) render();
    Debug.log(`Debug ${enabled ? 'abilitato' : 'disabilitato'}`);
    return enabled;
  };

  const toggleBody = () => {
    if (!panelBodyEl) return;
    const open = panelBodyEl.classList.toggle('open');
    if (open) render();
  };

  const clear = () => {
    lines = [];
    if (panelBodyEl) panelBodyEl.innerHTML = '';
  };

  const isEnabled = () => enabled;

  return {
    init,
    toggle,
    toggleBody,
    clear,
    isEnabled,
    log:   (...args) => addLine('log',   args),
    warn:  (...args) => addLine('warn',  args),
    error: (...args) => addLine('error', args),
    info:  (...args) => addLine('info',  args),
  };
})();

/* ============================================================
   STORAGE.JS — Gestione dati localStorage + debug
   ============================================================ */

const Storage = (() => {
  const PREFIX = 'dmtoolkit_';

  const KEYS = {
    campaigns:       PREFIX + 'campaigns',
    activeCampaign:  PREFIX + 'active_campaign',
    settings:        PREFIX + 'settings',
    diceHistory:     PREFIX + 'dice_history',
    masterScreen:    PREFIX + 'master_screen',
  };

  const emptyCampaign = (id, name, type = 'campagna') => ({
    id,
    name,
    type,
    system: '5e2024',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastSession: '',
    color: '#8b2635',
    icon: type === 'oneshot' ? '⚡' : '📖',

    sessionRecap: '',
    quests: [],
    timeline: [],
    factions: [],

    locations: [],
    npcs: [],

    party: [],
    combatSessions: [],
    activeCombat: null,
    calendar: {
      day: 1, month: 1, year: 1490,
      timeHours: 8, timeMinutes: 0,
      system: 'FR'
    },

    generatorCache: {}
  });

  const defaultSettings = () => ({
    theme: 'dark',
    sidebarCollapsed: false,
    debugEnabled: false,
    diceSound: false,
    language: 'it',
  });

  const get = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      Debug.error(`Storage.get(${key}):`, e.message);
      return fallback;
    }
  };

  const set = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      Debug.error(`Storage.set(${key}):`, e.message);

      if (key.includes('campaigns') && Array.isArray(value)) {
        const cleaned = value.map(camp => {
          const c = { ...camp };
          const stripBase64 = (arr) => (arr||[]).map(x => ({
            ...x, immagine: (x.immagine||'').startsWith('data:') ? '' : (x.immagine||'')
          }));
          c.npcs = stripBase64(c.npcs);
          c.locations = stripBase64(c.locations);
          c.factions = stripBase64(c.factions);
          return c;
        });
        try {
          localStorage.setItem(key, JSON.stringify(cleaned));
          Toast.show('⚠️ Storage pieno: immagini file rimosse. Usa URL esterni per le immagini.', 'warning', 6000);
          return true;
        } catch(e2) {
          Toast.show('Storage esaurito! Esporta la campagna e riduci il contenuto.', 'error', 8000);
        }
      } else {
        Toast.show(`Storage pieno (${key}): riduci le note o esporta la campagna.`, 'error', 6000);
      }
      return false;
    }
  };

  const remove = (key) => {
    try { localStorage.removeItem(key); return true; }
    catch (e) { Debug.error(`Storage.remove(${key}):`, e.message); return false; }
  };

  const getCampaigns = () => get(KEYS.campaigns, []);
  const saveCampaigns = (list) => set(KEYS.campaigns, list);

  const getCampaign = (id) => {
    const list = getCampaigns();
    const found = list.find(c => c.id === id);
    if (!found) return null;

    const defaults = emptyCampaign(found.id, found.name, found.type);
    return { ...defaults, ...found };
  };

  const _genCampCode = () => {

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const createCampaign = (name, type = 'campagna') => {
    const id = 'camp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const campaign = emptyCampaign(id, name, type);
    campaign.shareCode = _genCampCode();
    const list = getCampaigns();
    list.push(campaign);
    saveCampaigns(list);
    Debug.log(`Campagna creata: ${name} (${id}) codice: ${campaign.shareCode}`);
    return campaign;
  };

  const updateCampaign = (id, partial) => {
    const list = getCampaigns();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) { Debug.warn(`updateCampaign: id ${id} non trovato`); return false; }
    list[idx] = { ...list[idx], ...partial, updatedAt: Date.now() };
    saveCampaigns(list);
    return list[idx];
  };

  const deleteCampaign = (id) => {
    let list = getCampaigns();
    const len = list.length;
    list = list.filter(c => c.id !== id);
    if (list.length === len) { Debug.warn(`deleteCampaign: id ${id} non trovato`); return false; }
    saveCampaigns(list);
    const active = get(KEYS.activeCampaign);
    if (active === id) remove(KEYS.activeCampaign);
    Debug.log(`Campagna eliminata: ${id}`);
    return true;
  };

  const duplicateCampaign = (id, newName) => {
    const src = getCampaign(id);
    if (!src) return null;
    const newId = 'camp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = newId;
    copy.name = newName || src.name + ' (Copia)';
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    const list = getCampaigns();
    list.push(copy);
    saveCampaigns(list);
    Debug.log(`Campagna duplicata: ${newName}`);
    return copy;
  };

  const getActiveCampaignId = () => get(KEYS.activeCampaign);
  const setActiveCampaign = (id) => { set(KEYS.activeCampaign, id); Debug.log(`Campagna attiva: ${id}`); };

  const getSettings = () => ({ ...defaultSettings(), ...get(KEYS.settings, {}) });
  const updateSettings = (partial) => {
    const current = getSettings();
    return set(KEYS.settings, { ...current, ...partial });
  };

  const getDiceHistory = () => get(KEYS.diceHistory, []);
  const addDiceRoll = (formula, results, total) => {
    let history = getDiceHistory();
    history.unshift({ formula, results, total, ts: Date.now() });
    if (history.length > 50) history = history.slice(0, 50);
    set(KEYS.diceHistory, history);
  };

  const exportCampaign = (id) => {
    const c = getCampaign(id);
    if (!c) return null;
    const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.name.replace(/\s+/g, '_')}_dmtoolkit.json`;
    a.click();
    URL.revokeObjectURL(url);
    Debug.log(`Export campagna: ${c.name}`);
    return true;
  };

  const importCampaign = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.id || !data.name) throw new Error('Struttura non valida');

      data.id = 'camp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      data.name = data.name + ' (Importata)';
      const list = getCampaigns();
      list.push(data);
      saveCampaigns(list);
      Debug.log(`Importata campagna: ${data.name}`);
      return data;
    } catch (e) {
      Debug.error(`importCampaign: ${e.message}`);
      return null;
    }
  };

  const getMasterScreen = () => get(KEYS.masterScreen, { blocks: [], layout: [] });
  const saveMasterScreen = (data) => set(KEYS.masterScreen, data);

  const getStorageInfo = () => {
    let total = 0;
    for (let k in localStorage) {
      if (k.startsWith(PREFIX)) {
        total += (localStorage[k].length + k.length) * 2;
      }
    }
    return {
      usedKB: (total / 1024).toFixed(1),
      campaigns: getCampaigns().length
    };
  };

  return {
    KEYS,
    get, set, remove,
    getCampaigns, saveCampaigns, getCampaign,
    createCampaign, updateCampaign, deleteCampaign, duplicateCampaign,
    getActiveCampaignId, setActiveCampaign,
    getSettings, updateSettings,
    getDiceHistory, addDiceRoll,
    exportCampaign, importCampaign,
    getMasterScreen, saveMasterScreen,
    getStorageInfo,
    emptyCampaign
  };
})();

/* ============================================================
   DADI.JS — Widget dadi fisso e motore di lancio
   ============================================================ */

const Dadi = (() => {
  let panelOpen = false;

  const rollSingle = (faces) => Math.floor(Math.random() * faces) + 1;

  /**
   * Parsea e lancia una formula tipo "2d6+3", "d20", "4d6kh3", "1d100"
   * Restituisce { formula, rolls, total, detail }
   */
  const roll = (formula) => {
    formula = formula.trim().toLowerCase().replace(/\s/g, '');
    const results = { formula, rolls: [], total: 0, detail: '', error: null };

    const tokens = formula.split(/(?=[+\-])/);
    let total = 0;
    const parts = [];

    for (const token of tokens) {
      const sign = token.startsWith('-') ? -1 : 1;
      const cleanToken = token.replace(/^[+\-]/, '');

      if (/^\d+$/.test(cleanToken)) {
        const val = parseInt(cleanToken) * sign;
        total += val;
        parts.push({ type: 'const', val, sign });
        continue;
      }

      const diceMatch = cleanToken.match(/^(\d*)d(\d+)(k[hl]\d+)?$/);
      if (diceMatch) {
        const num = parseInt(diceMatch[1] || '1');
        const faces = parseInt(diceMatch[2]);
        const keepStr = diceMatch[3] || '';

        if (faces < 2 || num < 1 || num > 100) {
          results.error = `Formula non valida: ${cleanToken}`;
          return results;
        }

        const rolled = Array.from({ length: num }, () => rollSingle(faces));
        let kept = [...rolled];

        if (keepStr) {
          const keepType = keepStr[1];
          const keepN = parseInt(keepStr.slice(2));
          const sorted = [...rolled].sort((a, b) => a - b);
          if (keepType === 'h') {
            const threshold = sorted[Math.max(0, sorted.length - keepN)];
            kept = rolled.filter((v, i) => {

              return v >= threshold;
            }).slice(0, keepN);
          } else {
            const threshold = sorted[Math.min(sorted.length - 1, keepN - 1)];
            kept = rolled.filter(v => v <= threshold).slice(0, keepN);
          }
        }

        const subtotal = kept.reduce((a, b) => a + b, 0) * sign;
        total += subtotal;
        parts.push({ type: 'dice', num, faces, rolled, kept, subtotal, sign });
        results.rolls.push(...rolled);
        continue;
      }

      results.error = `Token non riconosciuto: ${cleanToken}`;
      return results;
    }

    results.total = total;
    results.parts = parts;

    results.detail = parts.map(p => {
      if (p.type === 'const') return (p.sign < 0 ? '−' : '+') + Math.abs(p.val);
      const sign = p.sign < 0 ? '−' : '';
      const rollStr = p.rolled.map(v => {
        const kept = p.kept.includes(v);
        return kept ? `[${v}]` : `(${v})`;
      }).join(', ');
      return `${sign}${p.num}d${p.faces}: ${rollStr}`;
    }).join('  ');

    Debug.log(`🎲 ${formula} → ${total} (${results.detail})`);
    Storage.addDiceRoll(formula, results.rolls, total);

    return results;
  };

  const updateResult = (result) => {
    const el = document.getElementById('dice-result-value');
    const formula = document.getElementById('dice-result-formula');
    const detail = document.getElementById('dice-result-detail');
    const icon = document.getElementById('dice-toggle-icon');

    if (!el) return;

    if (result.error) {
      el.textContent = 'ERR';
      formula.textContent = result.error;
      detail.textContent = '';
      return;
    }

    formula.textContent = result.formula.toUpperCase();
    el.classList.remove('dice-result-appear');
    void el.offsetWidth;
    el.classList.add('dice-result-appear');
    el.textContent = result.total;
    detail.textContent = result.detail;

    if (icon) {
      icon.classList.add('dice-rolling');
      setTimeout(() => {
        icon.classList.remove('dice-rolling');

        icon.innerHTML = `<span style="font-size:1.1rem;font-weight:900;font-family:var(--font-mono);">${result.total}</span>`;
        setTimeout(() => { icon.innerHTML = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="4" ry="4"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>'; }, 3000);
      }, 400);
    }

    updateHistory();
  };

  const updateHistory = () => {
    const el = document.getElementById('dice-history-list');
    if (!el) return;
    const history = Storage.getDiceHistory().slice(0, 10);
    el.innerHTML = history.length === 0
      ? '<div class="text-muted text-sm" style="text-align:center;padding:4px;">Nessun tiro</div>'
      : history.map((h, i) => `
        <div class="dice-history-item" style="${i===0?'opacity:1;':'opacity:0.7;'}">
          <span style="color:var(--text-muted);font-size:0.72rem;">${h.formula.toUpperCase()}</span>
          <span style="font-size:0.72rem;color:var(--text-muted);">${h.rolls?.join(', ')||''}</span>
          <span class="text-accent font-bold" style="font-size:${i===0?'1.1rem':'0.9rem'};font-family:var(--font-mono);">${h.total}</span>
        </div>`).join('');
  };

  const rollFormula = (formula) => {
    const result = roll(formula);
    updateResult(result);
    return result;
  };

  const rollDie = (faces, num = 1) => {
    const formula = `${num}d${faces}`;
    return rollFormula(formula);
  };

  const rollCustom = () => {
    const numEl = document.getElementById('dice-custom-num');
    const facesEl = document.getElementById('dice-custom-faces');
    const modEl = document.getElementById('dice-custom-mod');
    if (!numEl || !facesEl) return;
    const num = parseInt(numEl.value) || 1;
    const faces = parseInt(facesEl.value) || 6;
    const mod = parseInt(modEl?.value) || 0;
    let formula = `${num}d${faces}`;
    if (mod > 0) formula += `+${mod}`;
    if (mod < 0) formula += `${mod}`;
    rollFormula(formula);
  };

  const rollFormulaInput = () => {
    const el = document.getElementById('dice-formula-field');
    if (!el || !el.value.trim()) return;
    rollFormula(el.value.trim());
  };

  const togglePanel = () => {
    panelOpen = !panelOpen;
    const panel = document.getElementById('dice-panel');
    if (panel) panel.classList.toggle('open', panelOpen);
    if (panelOpen) updateHistory();
    Debug.log(`Pannello dadi: ${panelOpen ? 'aperto' : 'chiuso'}`);
  };

  const init = () => {
    Debug.log('Dadi inizializzati');
  };

  return { init, roll, rollDie, rollFormula, rollCustom, rollFormulaInput, togglePanel };
})();

/* ============================================================
   MODALS.JS — Sistema modal generico + modal specifici
   ============================================================ */

const Toast = (() => {
  const show = (msg, type = 'info', duration = 3000) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span style="font-size:0.85rem;">${icons[type] || 'ℹ'}</span><span>${msg}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = `fadeOut ${250}ms ease forwards`;
      setTimeout(() => toast.remove(), 250);
    }, duration);
  };

  return { show };
})();

const Modal = (() => {
  let stack = [];

  const open = (id) => {
    const overlay = document.getElementById(`modal-${id}`);
    if (!overlay) { Debug.warn(`Modal non trovato: modal-${id}`); return; }
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    stack.push(id);
    Debug.log(`Modal aperto: ${id}`);
  };

  const close = (id) => {
    const overlay = document.getElementById(`modal-${id}`);
    if (!overlay) return;
    overlay.style.display = 'none';
    stack = stack.filter(s => s !== id);
    Debug.log(`Modal chiuso: ${id}`);
  };

  const closeAll = () => {
    document.querySelectorAll('.modal-overlay').forEach(el => {
      el.style.display = 'none';
    });
    stack = [];
  };

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      const id = e.target.id.replace('modal-', '');
      close(id);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stack.length > 0) {
      close(stack[stack.length - 1]);
    }
  });

  return { open, close, closeAll };
})();

const openNewCampaignModal = () => {
  const el = document.getElementById('modal-new-campaign');
  if (!el) return;

  document.getElementById('nc-name').value = '';
  document.getElementById('nc-type').value = 'campagna';

  const lastSystem = localStorage.getItem('dm_toolkit_last_system') || '5e2024';
  document.getElementById('nc-system').value = lastSystem;
  Modal.open('new-campaign');
  setTimeout(() => document.getElementById('nc-name')?.focus(), 100);
};

const submitNewCampaign = () => {
  const name   = document.getElementById('nc-name')?.value?.trim();
  const type   = document.getElementById('nc-type')?.value   || 'campagna';
  const system = document.getElementById('nc-system')?.value || '5e2024';
  const useElettro = document.getElementById('nc-elettro')?.checked || false;
  const useCalendario = document.getElementById('nc-calendario')?.checked || false;
  const calendarioTipo = document.getElementById('nc-calendario-tipo')?.value || 'fantasy';

  if (!name) { Toast.show('Inserisci un nome', 'warning'); return; }

  localStorage.setItem('dm_toolkit_last_system', system);
  const camp = Storage.createCampaign(name, type);
  const updates = { system, useElettro };
  if (useCalendario) {
    updates.calendario = Calendario.initPreset(calendarioTipo);
  }
  Storage.updateCampaign(camp.id, updates);

  Modal.close('new-campaign');
  App.openCampaign(camp.id);
};

const openEditCampaignModal = (camp) => {
  document.getElementById('ec-id').value = camp.id;
  document.getElementById('ec-name').value = camp.name;
  document.getElementById('ec-type').value = camp.type || 'campagna';
  document.getElementById('ec-system').value = camp.system || '5e2024';
  document.getElementById('ec-elettro').checked = camp.useElettro || false;
  const hasCalendario = !!camp.calendario;
  document.getElementById('ec-calendario').checked = hasCalendario;
  document.getElementById('ec-calendario-preset').style.display = hasCalendario ? '' : 'none';
  if (camp.calendario?.tipo) document.getElementById('ec-calendario-tipo').value = camp.calendario.tipo;
  Modal.open('edit-campaign');
  setTimeout(() => document.getElementById('ec-name')?.focus(), 100);
};

const submitEditCampaign = () => {
  const id = document.getElementById('ec-id')?.value;
  const name = document.getElementById('ec-name')?.value?.trim();
  if (!id || !name) { Toast.show('Inserisci un nome', 'warning'); return; }

  const useCalendario = document.getElementById('ec-calendario')?.checked || false;
  const calendarioTipo = document.getElementById('ec-calendario-tipo')?.value || 'fantasy';
  const camp = Storage.getCampaign(id);
  const updates = {
    name,
    type: document.getElementById('ec-type')?.value,
    system: document.getElementById('ec-system')?.value,
    useElettro: document.getElementById('ec-elettro')?.checked || false,
    calendario: useCalendario
      ? (camp?.calendario?.tipo === calendarioTipo ? camp.calendario : Calendario.initPreset(calendarioTipo))
      : null,
  };

  Storage.updateCampaign(id, updates);
  Modal.close('edit-campaign');
  App.renderHomePage();
  Toast.show('Campagna aggiornata', 'success');
};

let _confirmCallback = null;
const openConfirmModal = (title, body, callback) => {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-body').textContent = body;
  _confirmCallback = callback;
  Modal.open('confirm');
};

const submitConfirm = () => {
  Modal.close('confirm');
  if (_confirmCallback) { _confirmCallback(); _confirmCallback = null; }
};

let _editingQuestId = null;
const openQuestModal = (quest) => {
  _editingQuestId = quest ? quest.id : null;
  document.getElementById('quest-modal-title').textContent = quest ? 'Modifica Quest' : 'Nuova Quest';
  document.getElementById('qm-title').value = quest?.title || '';
  document.getElementById('qm-status').value = quest?.status || 'disponibile';
  document.getElementById('qm-reward').value = quest?.reward || '';
  document.getElementById('qm-notes').value = quest?.notes || '';
  Modal.open('quest');
  setTimeout(() => document.getElementById('qm-title')?.focus(), 100);
};

const submitQuest = () => {
  const title = document.getElementById('qm-title')?.value?.trim();
  if (!title) { Toast.show('Inserisci un titolo', 'warning'); return; }

  const camp = App.getActiveCampaign();
  if (!camp) return;

  const quests = [...(camp.quests || [])];
  const questData = {
    title,
    status: document.getElementById('qm-status')?.value || 'disponibile',
    reward: document.getElementById('qm-reward')?.value || '',
    notes: document.getElementById('qm-notes')?.value || '',
  };

  if (_editingQuestId) {
    const idx = quests.findIndex(q => q.id === _editingQuestId);
    if (idx !== -1) quests[idx] = { ...quests[idx], ...questData };
  } else {
    quests.push({ id: 'q_' + Date.now(), ...questData });
  }

  App.saveActiveCampaign({ quests });
  Modal.close('quest');
  App.renderQuestList();
  Toast.show(quest ? 'Quest aggiornata' : 'Quest aggiunta', 'success');
};

const openTimelineModal = () => {
  document.getElementById('tm-day').value = '';
  document.getElementById('tm-event').value = '';
  document.getElementById('tm-type').value = '';
  Modal.open('timeline');
  setTimeout(() => document.getElementById('tm-day')?.focus(), 100);
};

const submitTimelineEvent = () => {
  const day = parseInt(document.getElementById('tm-day')?.value);
  const event = document.getElementById('tm-event')?.value?.trim();
  if (!event || isNaN(day)) { Toast.show('Compila giorno ed evento', 'warning'); return; }

  const camp = App.getActiveCampaign();
  if (!camp) return;

  const timeline = [...(camp.timeline || [])];
  timeline.push({
    id: 'ev_' + Date.now(),
    day,
    event,
    type: document.getElementById('tm-type')?.value || '',
  });

  App.saveActiveCampaign({ timeline });
  Modal.close('timeline');
  App.renderTimeline();
  Toast.show('Evento aggiunto', 'success');
};

let _editingFactionId = null;
const openFactionModal = (faction) => {
  _editingFactionId = faction ? faction.id : null;
  document.getElementById('faction-modal-title').textContent = faction ? 'Modifica Fazione' : 'Nuova Fazione';
  document.getElementById('fm-name').value = faction?.name || '';
  document.getElementById('fm-power').value = faction?.power ?? 50;
  document.getElementById('fm-power-val').textContent = faction?.power ?? 50;
  document.getElementById('fm-influence').value = faction?.influence || '';
  document.getElementById('fm-notes').value = faction?.notes || '';
  Modal.open('faction');
  setTimeout(() => document.getElementById('fm-name')?.focus(), 100);
};

const submitFaction = () => {
  const name = document.getElementById('fm-name')?.value?.trim();
  if (!name) { Toast.show('Inserisci un nome', 'warning'); return; }

  const camp = App.getActiveCampaign();
  if (!camp) return;

  const factions = [...(camp.factions || [])];
  const data = {
    name,
    power: parseInt(document.getElementById('fm-power')?.value) || 50,
    influence: document.getElementById('fm-influence')?.value || '',
    notes: document.getElementById('fm-notes')?.value || '',
  };

  if (_editingFactionId) {
    const idx = factions.findIndex(f => f.id === _editingFactionId);
    if (idx !== -1) factions[idx] = { ...factions[idx], ...data };
  } else {
    factions.push({ id: 'f_' + Date.now(), ...data });
  }

  App.saveActiveCampaign({ factions });
  Modal.close('faction');
  App.renderFactionList();
  Toast.show(faction ? 'Fazione aggiornata' : 'Fazione aggiunta', 'success');
};

/* ============================================================
   APP.JS — Navigazione, Campagne, Tema, Init
   ============================================================ */
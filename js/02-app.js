const App = (() => {
  let currentPage = 'home';
  let activeCampaign = null;

  const pages = {
    home:       { label: 'Home',   icon: '🏠', navItem: true,  requiresCampaign: false },
    campagna:   { label: 'Dashboard',   icon: '📖', navItem: true,  requiresCampaign: true  },
    mondo:      { label: 'Mondo',      icon: '🗺️', navItem: true,  requiresCampaign: true  },
    sessione:   { label: 'Sessione',   icon: '⚔️', navItem: true,  requiresCampaign: true  },
    generatori: { label: 'Generatori', icon: '✨', navItem: true,  requiresCampaign: false },
    compendio:  { label: 'Compendio',  icon: '📚', navItem: true,  requiresCampaign: false },
    schermo:    { label: 'Schermo DM', icon: '🖥️', navItem: true,  requiresCampaign: false },
    wiki:       { label: 'Wiki',        icon: '📝', navItem: true,  requiresCampaign: true  },
    'wiki-png':      { label: 'PNG',      icon: '📝', navItem: false, requiresCampaign: true },
    'wiki-luoghi':   { label: 'Luoghi',   icon: '📝', navItem: false, requiresCampaign: true },
    'wiki-fazioni':  { label: 'Fazioni',  icon: '📝', navItem: false, requiresCampaign: true },
    'wiki-lore':     { label: 'Lore',     icon: '📝', navItem: false, requiresCampaign: true },
    'wiki-sessioni': { label: 'Sessioni', icon: '📝', navItem: false, requiresCampaign: true },
    trame:          { label: 'Trame',    icon: '🎭', navItem: true,  requiresCampaign: true  },
    'wiki-quest':   { label: 'Quest',    icon: '⚔️', navItem: false, requiresCampaign: true  },
    'wiki-pg':      { label: 'PG',       icon: '🧙', navItem: false, requiresCampaign: true  },
    'wiki-incontri':{ label: 'Incontri', icon: '⚔️',  navItem: false, requiresCampaign: true  },
  };

  const navigateTo = (pageId) => {
    Debug.log(`navigateTo: ${pageId}`);

    const page = pages[pageId];
    if (!page) { Debug.warn(`Pagina sconosciuta: ${pageId}`); return; }

    if (page.requiresCampaign && !activeCampaign) {
      const savedId = Storage.getActiveCampaignId();
      if (savedId) {
        const camp = Storage.getCampaign(savedId);
        if (camp) {
          setActiveCampaign(camp);
          Debug.log(`Campagna ripristinata automaticamente: ${camp.name}`);
        }
      }

      if (!activeCampaign) {
        Toast.show('Seleziona prima una campagna', 'warning');
        navigateTo('home');
        return;
      }
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const pageEl = document.getElementById(`page-${pageId}`);
    if (pageEl) {
      pageEl.classList.add('active');
    } else {
      Debug.warn(`Elemento #page-${pageId} non trovato`);
    }

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageId);
    });

    const topbarTitle = document.getElementById('topbar-title');
    if (topbarTitle) {
      topbarTitle.textContent = page.label;
    }

    currentPage = pageId;

    switch (pageId) {
      case 'home':       renderHomePage(); break;
      case 'campagna':   renderCampaignPage(); setTimeout(() => { try { renderDashboard(); } catch(e){} try{QuestKanban.render();}catch(e){} }, 100); break;
      case 'mondo': WikiSections.goto('png'); return;
      case 'mondo_legacy':
        App.reloadActiveCampaign();
        try { NPC.init(); } catch(e) { Debug.warn('NPC non pronto: ' + e); }
        try { Luoghi.init(); } catch(e) {}
        try { Fazioni.init(); } catch(e) {}
        break;
      case 'sessione':   try { Sessione.init(); setTimeout(() => NoteSessione.render(), 100); } catch(e) {} setTimeout(()=>{try{Clocks.render();}catch(e){}; try{ScenePlanner.render();}catch(e){}; try{SessioniLog.showTab('corrente');}catch(e){}},200); break;
      case 'generatori':
        setTimeout(() => { GeneratoriDD.enable(); Generatori.applyVisibility(); EncounterBuilder.init(); RNGLoot.init(); }, 100);
        break;
      case 'compendio':  try { Compendio.init(); } catch(e) {} break;
      case 'schermo':    try { Schermo.init(); } catch(e) {} break;
      case 'wiki':
        requestAnimationFrame(() => requestAnimationFrame(() => {
          try { WikiDM.init(); } catch(e) { Debug.warn('WikiDM: ' + e); }
        }));
        break;
    case 'wiki-png':
    case 'wiki-luoghi':
    case 'wiki-fazioni':
    case 'wiki-lore':
    case 'wiki-sessioni':

        setTimeout(() => { try { WikiSections.renderCounters(); } catch(e) {} }, 100);
        break;
    case 'trame':
        setTimeout(() => { try { Trame.renderList(); } catch(e) {} }, 100);
        break;
    }
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const moon = document.getElementById('theme-icon-moon');
    const sun  = document.getElementById('theme-icon-sun');
    if (moon) moon.style.display = theme === 'dark' ? 'block' : 'none';
    if (sun)  sun.style.display  = theme === 'dark' ? 'none'  : 'block';
    Storage.updateSettings({ theme });
    Debug.log(`Tema: ${theme}`);
  };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  };

  const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('main-content');
    const collapsed = sidebar.classList.toggle('collapsed');
    main.classList.toggle('expanded', collapsed);
    Storage.updateSettings({ sidebarCollapsed: collapsed });
    Debug.log(`Sidebar: ${collapsed ? 'collapsed' : 'expanded'}`);
  };

  const setActiveCampaign = (campaign) => {
    activeCampaign = campaign;
    Storage.setActiveCampaign(campaign ? campaign.id : null);

    const nameEl = document.getElementById('sidebar-campaign-name');
    const dotEl = document.getElementById('sidebar-campaign-dot');
    if (nameEl) nameEl.textContent = campaign ? campaign.name : 'Nessuna campagna';
    if (dotEl) dotEl.style.display = campaign ? 'block' : 'none';

    document.querySelectorAll('.nav-item[data-requires-campaign]').forEach(el => {
      el.classList.toggle('nav-disabled', !campaign);
      el.style.opacity = campaign ? '1' : '0.4';
    });

    Debug.log(`Campagna attiva: ${campaign ? campaign.name : 'nessuna'}`);
  };

  const getActiveCampaign = () => activeCampaign;

  const reloadActiveCampaign = () => {
    if (!activeCampaign) return;
    const fresh = Storage.getCampaign(activeCampaign.id);
    if (fresh) activeCampaign = fresh;
    return fresh;
  };

  const saveActiveCampaign = (partial) => {
    if (!activeCampaign) return;
    const updated = Storage.updateCampaign(activeCampaign.id, partial);
    if (updated) activeCampaign = updated;
    return updated;
  };

  const renderHomePage = () => {
    const grid = document.getElementById('campaign-grid');
    if (!grid) return;

    const campaigns = Storage.getCampaigns();
    Debug.log(`renderHomePage: ${campaigns.length} campagne`);

    const countEl = document.getElementById('campaign-grid-count');
    if (countEl) countEl.textContent = campaigns.length > 0 ? `${campaigns.length} campagn${campaigns.length === 1 ? 'a' : 'e'}` : '';

    const actionsEl = document.getElementById('campaign-grid-actions');
    if (actionsEl) actionsEl.innerHTML = `
      <button class="btn btn-ghost btn-sm" onclick="importCampaignFromFile()" title="Importa da file">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Importa
      </button>
      <button class="btn btn-ghost btn-sm" onclick="Storage.createSnapshot('Manuale');Toast.show('Snapshot salvato', \'success\');renderSnapshotList();" title="Salva snapshot">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Snapshot
      </button>
      <button class="btn btn-ghost btn-sm" onclick="Modal.open('modal-snapshots');renderSnapshotList();" title="Cronologia backup">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Cronologia
      </button>
      <button class="btn btn-ghost btn-sm" onclick="BackupSystem.exportAll()" title="Backup">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Backup
      </button>
    `;

    grid.innerHTML = '';

    if (campaigns.length === 0) {

      grid.innerHTML = `
        <div class="home-empty-v2" style="grid-column:1/-1;text-align:center;padding:32px 20px;">
          <div style="margin-bottom:20px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
              style="width:64px;height:64px;opacity:0.25;margin:0 auto;display:block;">
              <path d="M12 2L3 7v10l9 5 9-5V7z"/>
              <path d="M12 2v20"/><path d="M3 7l9 5 9-5"/>
            </svg>
          </div>
          <h3 style="font-family:var(--font-display);font-size:1.1rem;margin-bottom:8px;">Inizia la tua avventura</h3>
          <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:24px;line-height:1.6;">Crea la tua prima campagna per iniziare a usare il toolkit.</p>
          <button class="btn btn-primary" onclick="openNewCampaignModal()" style="font-size:0.95rem;padding:10px 24px;">
            + Nuova Campagna
          </button>
          <div style="margin-top:32px;display:flex;flex-direction:column;gap:10px;text-align:left;max-width:260px;margin-left:auto;margin-right:auto;">
            <div style="display:flex;align-items:center;gap:12px;font-size:0.82rem;color:var(--text-muted);">
              <div style="width:24px;height:24px;background:var(--accent-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.72rem;font-weight:700;flex-shrink:0;">1</div>
              <span>Crea una campagna o One Shot</span>
            </div>
            <div style="display:flex;align-items:center;gap:12px;font-size:0.82rem;color:var(--text-muted);">
              <div style="width:24px;height:24px;background:var(--accent-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.72rem;font-weight:700;flex-shrink:0;">2</div>
              <span>Aggiungi PNG, luoghi e fazioni nella Wiki</span>
            </div>
            <div style="display:flex;align-items:center;gap:12px;font-size:0.82rem;color:var(--text-muted);">
              <div style="width:24px;height:24px;background:var(--accent-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.72rem;font-weight:700;flex-shrink:0;">3</div>
              <span>Gestisci sessioni e combattimenti</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const svgPencil = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    const svgExport = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
    const svgTrash = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';

    campaigns.sort((a, b) => b.updatedAt - a.updatedAt).forEach(camp => {
      const isActive = activeCampaign && activeCampaign.id === camp.id;
      const date = new Date(camp.updatedAt).toLocaleDateString('it-IT', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      const typeLabel = camp.type === 'oneshot' ? 'One Shot' : 'Campagna';

      const card = document.createElement('article');
      card.className = 'campaign-card' + (isActive ? ' is-active' : '');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Apri campagna ${camp.name}`);

      card.innerHTML = `
        ${isActive ? '<div class="cc-active-tag"><span class="cc-active-dot"></span> Attiva</div>' : ''}
        <div class="cc-body">
          <div class="cc-top">
            <div class="cc-icon">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <div style="min-width:0;flex:1;">
              <span class="cc-type">${typeLabel} · ${camp.system || '5e'}</span>
              <span class="cc-name" title="${camp.name}">${camp.name}</span>
            </div>
          </div>
          <div class="cc-desc">${camp.description || 'Nessuna descrizione.'}</div>
        </div>
        <div class="cc-footer">
          <div class="cc-footer-meta">
            <span class="cc-date">${date}</span>
          </div>
          <div class="cc-actions">
            <button class="btn btn-ghost btn-icon-sm" title="Modifica" aria-label="Modifica campagna" onclick="event.stopPropagation();App.editCampaign('${camp.id}')">${svgPencil}</button>
            <button class="btn btn-ghost btn-icon-sm" title="Esporta" aria-label="Esporta campagna" onclick="event.stopPropagation();Storage.exportCampaign('${camp.id}')">${svgExport}</button>
            <button class="btn btn-ghost btn-icon-sm" title="Elimina" aria-label="Elimina campagna" style="color:var(--accent-danger);" onclick="event.stopPropagation();App.confirmDeleteCampaign('${camp.id}')">${svgTrash}</button>
          </div>
        </div>
      `;

      card.onclick = () => App.openCampaign(camp.id);
      card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); App.openCampaign(camp.id); } };
      grid.appendChild(card);
    });

    const newCard = document.createElement('button');
    newCard.className = 'campaign-card-new';
    newCard.setAttribute('aria-label', 'Crea nuova campagna o One Shot');
    newCard.onclick = openNewCampaignModal;
    newCard.innerHTML = `
      <div class="cc-new-icon">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
      <span style="font-family:var(--font-display);font-size:0.75rem;letter-spacing:0.06em;color:inherit;">Nuova Campagna</span>
    `;
    grid.appendChild(newCard);
  };

const renderSnapshotList = () => {
  const el = document.getElementById('snapshot-list');
  if (!el) return;
  const info = Storage.getSnapshotInfo();
  if (!info.list.length) {
    el.innerHTML = '<div class="text-muted text-sm">Nessuno snapshot salvato.</div>';
    return;
  }
  el.innerHTML = info.list.map(s => `
    <div style="display:flex;align-items:center;gap:var(--space-sm);padding:8px 10px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);">
      <div style="flex:1;min-width:0;">
        <div style="font-family:var(--font-display);font-size:0.82rem;">${s.label}</div>
        <div style="font-size:0.72rem;color:var(--text-muted);">${s.dateStr} · ${s.campagneCount} campagne</div>
      </div>
      <button class="btn btn-ghost btn-sm" style="font-size:0.72rem;" onclick="Storage.exportSnapshot('${s.id}')">📤</button>
      <button class="btn btn-secondary btn-sm" style="font-size:0.72rem;" onclick="
        openConfirmModal('Ripristinare questo snapshot?','Tutte le campagne attuali verranno sostituite con quelle dello snapshot.',()=>{
          if(Storage.restoreSnapshot('${s.id}')){
            renderSnapshotList();
            renderHomePage();
            Toast.show('Snapshot ripristinato','success');
          }
        })">↩ Ripristina</button>
      <button class="btn btn-ghost btn-sm" style="font-size:0.72rem;" onclick="
        Storage.deleteSnapshot('${s.id}');
        renderSnapshotList();
        Toast.show('Snapshot eliminato','info');">🗑️</button>
    </div>`).join('');
  const counter = document.getElementById('snapshot-counter');
  if (counter) counter.textContent = `${info.count}/${info.max}`;
};

window.addEventListener('open-modal-snapshots', renderSnapshotList);

const openCampaign = (id) => {
    const camp = Storage.getCampaign(id);
    if (!camp) { Toast.show('Campagna non trovata', 'error'); return; }
    setActiveCampaign(camp);

    try { if (typeof Compendio !== 'undefined') Compendio.changeSistema(camp.system || '5e2024'); } catch(e) {}
    navigateTo('campagna');
    Toast.show(`Campagna aperta: ${camp.name}`, 'success');
  };

  const editCampaign = (id) => {
    const camp = Storage.getCampaign(id);
    if (!camp) return;
    openEditCampaignModal(camp);
  };

  const confirmDeleteCampaign = (id) => {
    const camp = Storage.getCampaign(id);
    if (!camp) return;
    openConfirmModal(
      `Eliminare "${camp.name}"?`,
      'Questa azione non può essere annullata. Tutti i dati della campagna verranno persi.',
      () => {
        Storage.deleteCampaign(id);
        if (activeCampaign && activeCampaign.id === id) setActiveCampaign(null);
        renderHomePage();
        Toast.show('Campagna eliminata', 'info');
      }
    );
  };

  const renderCampaignPage = () => {
    if (!activeCampaign) return;
    const fresh = Storage.getCampaign(activeCampaign.id);
    if (fresh) activeCampaign = fresh;

    Debug.log(`renderCampaignPage: ${activeCampaign.name}`);

    const titleEl = document.getElementById('camp-page-title');
    if (titleEl) titleEl.textContent = activeCampaign.name;

    const recapEl = document.getElementById('camp-session-recap');
    if (recapEl) recapEl.value = activeCampaign.sessionRecap || '';

    renderQuestList();
    renderTimeline();
    renderFactionList();
  };

  const saveRecap = () => {
    const el = document.getElementById('camp-session-recap');
    if (!el || !activeCampaign) return;
    App.saveActiveCampaign({ sessionRecap: el.value });
    Toast.show('Riepilogo salvato', 'success');
    Debug.log('Riepilogo sessione salvato');
  };

  const renderQuestList = () => {
    if (!activeCampaign) return;
    const quests = activeCampaign.quests || [];
    const tabs = ['disponibile', 'in_corso', 'completata', 'fallita'];
    const labels = { disponibile: 'Disponibili', in_corso: 'In Corso', completata: 'Completate', fallita: 'Fallite' };
    const colors = { disponibile: 'badge-muted', in_corso: 'badge-primary', completata: 'badge-success', fallita: 'badge-warning' };

    tabs.forEach(status => {
      const el = document.getElementById(`quest-list-${status}`);
      if (!el) return;
      const filtered = quests.filter(q => q.status === status);
      if (filtered.length === 0) {
        el.innerHTML = `<div class="empty-state" style="padding:var(--space-lg)"><div class="text-muted text-sm">Nessuna quest ${labels[status].toLowerCase()}</div></div>`;
        return;
      }
      el.innerHTML = filtered.map(q => `
        <div class="quest-item status-${q.status}" style="border-left:3px solid var(--${q.status === 'disponibile' ? 'border' : q.status === 'in_corso' ? 'accent-primary' : q.status === 'completata' ? 'accent-success' : 'accent-danger'});padding-left:10px;margin-bottom:8px;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
            <div style="flex:1;min-width:0;">
              <div style="font-family:var(--font-display);font-size:0.9rem;font-weight:600;color:var(--text-primary);margin-bottom:2px;">${q.title}</div>
              ${q.notes ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">${q.notes}</div>` : ''}
              ${q.reward ? `<div style="font-size:0.78rem;color:var(--accent-secondary);display:flex;align-items:center;gap:4px;margin-top:4px;">🏆 <span style="font-weight:600;">Ricompensa:</span> ${q.reward}</div>` : ''}
              ${q.steps?.length ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">📋 ${q.steps.filter(s=>s.done).length}/${q.steps.length} obiettivi completati</div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
              <span class="badge ${colors[q.status]}" style="font-size:0.65rem;">${labels[q.status]}</span>
              <div style="display:flex;gap:2px;">
                <button class="btn btn-ghost btn-icon-sm" onclick="App.editQuest('${q.id}')" title="Modifica">✏️</button>
                <button class="btn btn-ghost btn-icon-sm" onclick="App.deleteQuest('${q.id}')" title="Elimina" style="color:var(--accent-danger);">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    });
  };

  const addQuest = () => {
    openQuestModal(null);
  };

  const editQuest = (id) => {
    if (!activeCampaign) return;
    const quest = (activeCampaign.quests || []).find(q => q.id === id);
    if (quest) openQuestModal(quest);
  };

  const deleteQuest = (id) => {
    if (!activeCampaign) return;
    openConfirmModal('Eliminare questa quest?', '', () => {
      const quests = (activeCampaign.quests || []).filter(q => q.id !== id);
      App.saveActiveCampaign({ quests });
      renderQuestList();
      Toast.show('Quest eliminata', 'info');
    });
  };

  const renderTimeline = () => {
    if (!activeCampaign) return;
    const events = (activeCampaign.timeline || []).sort((a, b) => a.day - b.day);
    const el = document.getElementById('timeline-list');
    if (!el) return;

    if (events.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:var(--space-lg)"><div class="text-muted text-sm">Nessun evento registrato</div></div>`;
      return;
    }

    el.innerHTML = (() => {
      const typeColors = {
        '':             { dot:'var(--border-strong)', badge:'badge-muted',    label:'Generico'       },
        'politico':     { dot:'#5ba4f5',              badge:'badge-primary',  label:'⚖️ Politico'    },
        'combattimento':{ dot:'var(--accent-danger)', badge:'badge-danger',   label:'⚔️ Combattimento'},
        'magia':        { dot:'#c97bea',              badge:'badge-secondary',label:'🔮 Magia'        },
        'disastro':     { dot:'#f5a623',              badge:'badge-warning',  label:'⚠️ Disastro'    },
        'scoperta':     { dot:'#69cc85',              badge:'badge-success',  label:'🔍 Scoperta'    },
      };
      return events.map((e, i) => {
        const tc = typeColors[e.type || ''] || typeColors[''];
        return `
        <div class="timeline-item">
          <div class="timeline-day">
            <span style="font-family:var(--font-mono);font-size:0.7rem;color:var(--accent-secondary);">G${e.day}</span>
          </div>
          <div class="timeline-track">
            <div class="timeline-dot" style="background:${tc.dot};border-color:${tc.dot};"></div>
            ${i < events.length - 1 ? '<div class="timeline-line"></div>' : ''}
          </div>
          <div class="timeline-content" style="border-left:2px solid ${tc.dot};padding-left:8px;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:4px;">
              <div style="flex:1;min-width:0;">
                <div class="timeline-event-text" style="margin-bottom:3px;">${e.event}</div>
                ${e.type ? `<span class="badge ${tc.badge}" style="font-size:0.6rem;">${tc.label}</span>` : ''}
              </div>
              <button class="btn btn-ghost btn-icon-sm" onclick="App.deleteTimelineEvent('${e.id}')" title="Elimina" style="color:var(--text-muted);flex-shrink:0;">🗑️</button>
            </div>
          </div>
        </div>`;
      }).join('');
    })();
  };

  const addTimelineEvent = () => {
    openTimelineModal();
  };

  const deleteTimelineEvent = (id) => {
    if (!activeCampaign) return;
    const timeline = (activeCampaign.timeline || []).filter(e => e.id !== id);
    App.saveActiveCampaign({ timeline });
    renderTimeline();
  };

  const renderFactionList = () => {
    if (!activeCampaign) return;
    const factions = activeCampaign.factions || [];
    const el = document.getElementById('faction-list');
    if (!el) return;

    if (factions.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="module-placeholder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:2.4rem;height:2.4rem;opacity:0.4;" aria-hidden="true"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/></svg></div><div class="text-muted text-sm">Nessuna fazione registrata</div></div>`;
      return;
    }

    el.innerHTML = factions.map(f => {
      const pct = Math.round(f.power || 50);
      return `
        <div class="faction-item">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div>
              <div class="faction-item-name">${f.name}</div>
              ${f.influence ? `<div class="text-xs text-muted">${f.influence}</div>` : ''}
            </div>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-ghost btn-icon-sm" onclick="App.editFaction('${f.id}')" title="Modifica"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="btn btn-ghost btn-icon-sm" onclick="App.deleteFaction('${f.id}')" title="Elimina"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="text-xs text-muted" style="flex-shrink:0;">Potere</span>
            <div class="progress-bar" style="flex:1;">
              <div class="progress-fill ${pct > 66 ? 'progress-ally' : pct > 33 ? 'progress-neutral' : 'progress-hostil'}" style="width:${pct}%"></div>
            </div>
            <span class="text-xs text-mono">${pct}%</span>
          </div>
          ${f.notes ? `<div class="text-xs text-muted" style="margin-top:5px;">${f.notes}</div>` : ''}
        </div>
      `;
    }).join('');
  };

  const addFaction = () => openFactionModal(null);
  const editFaction = (id) => {
    if (!activeCampaign) return;
    const f = (activeCampaign.factions || []).find(x => x.id === id);
    if (f) openFactionModal(f);
  };
  const deleteFaction = (id) => {
    openConfirmModal('Eliminare questa fazione?', '', () => {
      const factions = (activeCampaign.factions || []).filter(x => x.id !== id);
      App.saveActiveCampaign({ factions });
      renderFactionList();
      Toast.show('Fazione eliminata', 'info');
    });
  };

  const importCampaignFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const camp = Storage.importCampaign(ev.target.result);
        if (camp) {
          renderHomePage();
          Toast.show(`Importata: ${camp.name}`, 'success');
        } else {
          Toast.show('File non valido', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const init = () => {
    Debug.log('App.init() start');

    const settings = Storage.getSettings();
    const savedTheme = settings.theme;
    const osTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(savedTheme || osTheme);

    if (settings.sidebarCollapsed) {
      document.getElementById('sidebar')?.classList.add('collapsed');
      document.getElementById('main-content')?.classList.add('expanded');
    }

    const savedId = Storage.getActiveCampaignId();
    if (savedId) {
      const camp = Storage.getCampaign(savedId);
      if (camp) {
        setActiveCampaign(camp);
        Debug.log(`Ripristinata campagna attiva: ${camp.name}`);
      }
    }

    Dadi.init();

    navigateTo('home');

    Debug.log('App.init() completato');
    Toast.show('DM Toolkit caricato ⚔️', 'success');
  };

  return {
    init,
    navigateTo,
    toggleTheme,
    toggleSidebar,
    getActiveCampaign,
    setActiveCampaign,
    reloadActiveCampaign,
    saveActiveCampaign,
    renderHomePage,
    renderCampaignPage,
    openCampaign,
    editCampaign,
    confirmDeleteCampaign,
    saveRecap,
    addQuest, editQuest, deleteQuest,
    renderQuestList,
    addTimelineEvent, deleteTimelineEvent,
    renderTimeline,
    addFaction, editFaction, deleteFaction,
    renderFactionList,
  };
})();

/* ============================================================
   NPC.JS — Modulo PNG completo
   ============================================================ */
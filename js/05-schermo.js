const Schermo = (() => {

  const _svgIcon = (path) => `<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  const BLOCK_TYPES = {
    percezioni: {
      label: 'Party',
      icon: _svgIcon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
      desc: 'HP, CA, percezioni passive e ispirazione dei PG',
      defaultSize: 'md',
    },
    dadi: {
      label: 'Dadi Rapidi',
      icon: _svgIcon('<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 8h.01"/><path d="M8 8h.01"/><path d="M8 16h.01"/><path d="M16 16h.01"/><path d="M12 12h.01"/>'),
      desc: 'Lancia qualsiasi dado al volo',
      defaultSize: 'sm',
    },
    meteo: {
      label: 'Meteo',
      icon: _svgIcon('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>'),
      desc: 'Genera e mostra il meteo del giorno',
      defaultSize: 'sm',
    },
    note_sessione: {
      label: 'Note Sessione',
      icon: _svgIcon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
      desc: 'Note rapide della sessione attiva — sincronizzate con la Sessione',
      defaultSize: 'md',
    },
    note: {
      label: 'Note Rapide',
      icon: _svgIcon('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
      desc: 'Blocco note libero per la sessione',
      defaultSize: 'md',
    },
    combat_mini: {
      label: 'Combat Tracker (ridotto)',
      icon: _svgIcon('<line x1="14.5" y1="17.5" x2="3" y2="6"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>'),
      desc: 'Iniziativa, HP, turno attivo con pulsanti essenziali',
      defaultSize: 'lg',
    },
    combat_full: {
      label: 'Combat Tracker (completo)',
      icon: _svgIcon('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
      desc: 'Combat tracker identico alla sezione Sessione',
      defaultSize: 'xl',
    },
    condizioni: {
      label: 'Condizioni (tabella compatta)',
      icon: _svgIcon('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'),
      desc: 'Lista rapida delle condizioni 5e',
      defaultSize: 'md',
    },
    compendio_ref: {
      label: 'Riferimento Compendio',
      icon: _svgIcon('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
      desc: 'Scegli una sezione del compendio (ripetibile)',
      defaultSize: 'md',
      repeatable: true,
    },
    dc: {
      label: 'Tabella DC',
      icon: _svgIcon('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
      desc: 'Classi di difficoltà di riferimento',
      defaultSize: 'sm',
    },
    tempo: {
      label: 'Tempo & Calendario',
      icon: _svgIcon('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
      desc: 'Gestione del tempo di gioco e calendario in-game',
      defaultSize: 'sm',
    },
    timer: {
      label: 'Timer / Conto alla rovescia',
      icon: _svgIcon('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/>'),
      desc: 'Timer funzionante con allarme visivo',
      defaultSize: 'sm',
    },
    preferiti: {
      label: 'Preferiti Compendio',
      icon: _svgIcon('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
      desc: 'I tuoi preferiti dal Compendio — accesso rapido',
      defaultSize: 'md',
    },
    stili_vita: {
      label: 'Stili di Vita & Servizi',
      icon: _svgIcon('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
      desc: 'Costi giornalieri stili di vita e tariffe servizi comuni',
      defaultSize: 'md',
    },
    proprieta_armi: {
      label: 'Proprietà delle Armi',
      icon: _svgIcon('<line x1="14.5" y1="17.5" x2="3" y2="6"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>'),
      desc: 'Tabella completa delle proprietà (2014/2024)',
      defaultSize: 'md',
    },
    custom: {
      label: 'Blocco Personalizzato',
      icon: _svgIcon('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
      desc: 'Testo libero con titolo personalizzato',
      defaultSize: 'md',
      repeatable: true,
    },
    velocita: {
      label: 'Velocità di Viaggio',
      icon: _svgIcon('<path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="M12 8v4l2 2"/>'),
      desc: 'Cerca creature, cavalcature e veicoli con velocità',
      defaultSize: 'lg',
      repeatable: false,
    },
  };

  const SIZES = {
    s1: { label: '1 col',  cols: 1 },
    s2: { label: '2 col',  cols: 2 },
    s3: { label: '3 col',  cols: 3 },
    s5: { label: 'Pieno',  cols: 5 },
  };

  let _blocks = [];

  const load = () => {
    try {
      const saved = Storage.getMasterScreen();
      _blocks = saved?.blocks || [];

      const titoliFix = {
        'Percezioni Passive Party': 'Party',
        'Combat Mini': 'Combat Tracker',
        'Riferimento Condizioni': 'Condizioni (tabella completa)',
      };
      _blocks.forEach(b => {
        if (titoliFix[b.title]) b.title = titoliFix[b.title];
      });
    } catch (e) {
      _blocks = [];
    }
  };

  const save = () => {
    Storage.saveMasterScreen({ blocks: _blocks });
  };

  const init = () => {
    load();
    App.reloadActiveCampaign();
    render();

    setTimeout(() => { App.reloadActiveCampaign(); render(); }, 200);
    setTimeout(() => { App.reloadActiveCampaign(); render(); }, 800);
    Debug.log(`Schermo.init(): ${_blocks.length} blocchi`);
  };

  const render = () => {
    const grid = document.getElementById('schermo-grid');
    const empty = document.getElementById('schermo-empty');
    if (!grid) return;

    App.reloadActiveCampaign();

    if (_blocks.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    SchermoDD.reset();
    grid.innerHTML = _blocks.map((block, idx) => renderBlock(block, idx)).join('');
    _blocks.forEach(b => updateBlockContent(b));
    requestAnimationFrame(() => SchermoDD.enable());
  };

  const renderBlock = (block, idx) => {
    const def = BLOCK_TYPES[block.type] || BLOCK_TYPES.custom;

    const sizeMap = { sm:'s1', md:'s2', lg:'s3', xl:'s5' };
    const rawSize = block.size || def.defaultSize || 's2';
    const size = SIZES[rawSize] ? rawSize : (sizeMap[rawSize] || 's2');
    if (block.size !== size) { block.size = size; }
    const cols = SIZES[size]?.cols || 2;
    const title = block.title || def.label;
    const spanStyle = `grid-column: span ${cols};`;

    return `
      <div class="schermo-block schermo-block-${size}" id="sblock-${block.id}" style="${spanStyle}">
        <div class="schermo-block-header">
          <span class="schermo-block-icon" style="cursor:grab;" title="Trascina per spostare">${def.icon}</span>
          <span class="schermo-block-title">${title}</span>
          <div class="schermo-block-actions">
            <button class="btn btn-ghost btn-icon-sm" onclick="Schermo.resizeBlock('${block.id}')" title="Altezza: ${size.toUpperCase()}" style="font-family:var(--font-mono);font-size:0.6rem;width:auto;padding:0 4px;opacity:0.6;">${size.toUpperCase()}</button>
            <button class="btn btn-ghost btn-icon-sm" onclick="Schermo.moveBlock('${block.id}', -1)" title="Sposta su"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg></button>
            <button class="btn btn-ghost btn-icon-sm" onclick="Schermo.moveBlock('${block.id}', 1)" title="Sposta giù"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></button>
            ${block.type === 'custom' || block.type === 'note' ? `<button class="btn btn-ghost btn-icon-sm" onclick="Schermo.editBlock('${block.id}')" title="Modifica"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>` : ''}
            <button class="btn btn-ghost btn-icon-sm" onclick="Schermo.removeBlock('${block.id}')" title="Rimuovi" aria-label="Rimuovi"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
        </div>
        <div class="schermo-block-body" id="sbody-${block.id}" style="min-height:${block.bodyHeight ? block.bodyHeight+'px' : 'auto'};overflow:auto;">
          <!-- Popolato da updateBlockContent -->
        </div>
        <div class="schermo-block-resize" onmousedown="Schermo.startResize(event,'${block.id}')"></div>
      </div>`;
  };

  const updateBlockContent = (block) => {
    const el = document.getElementById(`sbody-${block.id}`);
    if (!el) return;

    switch (block.type) {
      case 'percezioni':     el.innerHTML = renderPercezioni(); if(!el.innerHTML.includes('text-muted')||el.innerHTML.includes('Nessun PG')) setTimeout(()=>{App.reloadActiveCampaign();el.innerHTML=renderPercezioni();},600); break;
      case 'preferiti':      el.innerHTML = renderPreferiti(); break;
      case 'note_sessione':  el.innerHTML = renderNoteSessione(); break;
      case 'dadi':           el.innerHTML = renderDadiMini(block.id); break;
      case 'meteo':          el.innerHTML = renderMeteoMini(block.id); break;
      case 'note':           el.innerHTML = renderNote(block); break;
      case 'combat_mini':    el.innerHTML = renderCombatMini(); break;
      case 'combat_full':    el.innerHTML = renderCombatFull(); break;
      case 'condizioni':     el.innerHTML = renderCondizioni(); break;
      case 'compendio_ref':  el.innerHTML = renderCompendioRef(block); break;
      case 'proprieta_armi': el.innerHTML = renderProprietaArmi(); break;
      case 'stili_vita':     el.innerHTML = renderStiliVita(); break;
      case 'dc':             el.innerHTML = renderDC(); break;
      case 'tempo':          el.innerHTML = renderTempo(); break;
      case 'timer':          TimerBlock.init(block.id, el); break;
      case 'custom':         el.innerHTML = renderCustom(block); break;
      case 'velocita':       el.innerHTML = renderVelocita(block.id); break;
      default:               el.innerHTML = '<div class="text-muted text-sm">Blocco sconosciuto</div>';
    }
  };

  const renderPreferiti = () => {
    App.reloadActiveCampaign();
    const camp = App.getActiveCampaign();
    const favs = camp?.compendioFavoriti || [];
    if (!favs.length) return '<div class="text-muted text-sm">Nessun preferito. Aggiungi ⭐ dal Compendio.</div>';

    const openFn = {
      monsters: 'openMonster', magic_items: 'openMagicItem',
      equipment: 'openEquipment', rules: 'openRule', spells: 'openSpell',
    };
    const tipoLabel = {
      monsters: 'Mostri', magic_items: 'Oggetti Magici', equipment: 'Equipaggiamento', rules: 'Regole', spells: 'Incantesimi',
    };

    const gruppi = {};
    favs.forEach(f => {
      if (!gruppi[f.tipo]) gruppi[f.tipo] = [];
      gruppi[f.tipo].push(f);
    });

    return Object.entries(gruppi).map(([tipo, items]) =>
      '<div style="margin-bottom:8px;">' +
        '<div style="font-family:var(--font-display);font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">' +
          tipoLabel[tipo] + ' ' + tipo.replace('_',' ') +
        '</div>' +
        items.map(f =>
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border);font-size:0.82rem;">' +
            '<span style="cursor:pointer;color:var(--accent-secondary);text-decoration:underline dotted;" ' +
              'onclick="apriFavoritoSchermo(\'' + tipo + '\',\'' + f.id + '\')">'  +
              f.nome +
            '</span>' +
            '<button class="btn btn-ghost btn-icon-sm" style="font-size:0.8rem;" ' +
              'onclick="Compendio.toggleFavorito(\'' + f.id + '\',\'' + f.nome.replace(/'/g,"\'") + '\',\'' + tipo + '\',event);Schermo._refreshFavoriti()" ' +
              'title="Rimuovi"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="var(--accent-secondary)" stroke="var(--accent-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>' +
          '</div>'
        ).join('') +
      '</div>'
    ).join('');
  };

  const _refreshFavoriti = () => {
    _blocks.filter(b => b.type === 'preferiti').forEach(b => updateBlockContent(b));
  };

  const renderNoteSessione = () => {
    App.reloadActiveCampaign();
    const notes = NoteSessione.getData();

    if (!notes.length) {
      return '<div class="text-muted text-sm" style="margin-bottom:8px;">Nessuna nota.</div>' +
        '<button class="btn btn-secondary btn-sm" onclick="NoteSessione.addVoce();Schermo._refreshNoteSessione()">+ Nota</button>';
    }

    return '<div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px;">' +
      notes.map((n, i) =>
        '<div style="display:flex;gap:6px;align-items:flex-start;padding:4px 0;border-bottom:1px solid var(--border);">' +
          '<span style="flex-shrink:0;font-size:0.85rem;">' + (n.tipo||'📌') + '</span>' +
          '<span style="flex:1;font-size:0.8rem;line-height:1.4;word-break:break-word;">' + (n.testo||'') + '</span>' +
          '<button class="btn btn-ghost btn-icon-sm" style="flex-shrink:0;font-size:0.65rem;opacity:0.5;" ' +
            'onclick="NoteSessione.remove('+i+');Schermo._refreshNoteSessione()" title="Rimuovi" aria-label="Rimuovi"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div>'
      ).join('') +
    '</div>' +
    '<div style="display:flex;gap:4px;">' +
      '<button class="btn btn-secondary btn-sm" style="flex:1;font-size:0.72rem;" onclick="NoteSessione.addVoce();setTimeout(()=>Schermo._refreshNoteSessione(),100)">+ Nota</button>' +
      '<button class="btn btn-ghost btn-sm" style="font-size:0.72rem;" onclick="App.navigateTo(\'sessione\')">→ Sessione</button>' +
    '</div>';
  };

  const _refreshNoteSessione = () => {
    _blocks.filter(b => b.type === 'note_sessione').forEach(b => updateBlockContent(b));

    NoteSessione.render();
  };

  const renderPercezioni = () => {
    App.reloadActiveCampaign();
    const camp = App.getActiveCampaign();
    const party = camp?.party || [];
    if (!party.length) return '<div class="text-muted text-sm">Nessun PG. Aggiungili in Sessione → Party.</div>';

    return party.map(pg => {
      const hpPct = pg.hpMax > 0 ? Math.max(0, Math.round((pg.hpAttuali ?? pg.hpMax) / pg.hpMax * 100)) : 100;
      const hpCol = hpPct > 66 ? 'var(--accent-success)' : hpPct > 33 ? 'var(--accent-warning)' : 'var(--accent-danger)';
      return '<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);padding:8px;margin-bottom:6px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<div>' +
            '<div style="font-family:var(--font-display);font-size:0.85rem;">' + pg.nome + '</div>' +
            '<div style="font-size:0.7rem;color:var(--text-muted);">' + [pg.giocatore, pg.classe, pg.livello ? 'Liv.'+pg.livello : ''].filter(Boolean).join(' · ') + '</div>' +
          '</div>' +
          (pg.inspirazione ? '<span class="badge badge-gold" style="font-size:0.6rem;">Ispirazione</span>' : '') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:3px;margin-bottom:6px;">' +
          ['percezionePassiva:👁️Perc.', 'investigazionePassiva:🔍Inv.', 'intuizionePassiva:💡Int.', 'ca:🛡️CA', 'hpAttuali:❤️HP'].map(s => {
            const [key, lbl] = s.split(':');
            const val = key === 'hpAttuali' ? (pg.hpAttuali ?? pg.hpMax ?? '?') + '/' + (pg.hpMax||'?') : (pg[key] || 10);
            return '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:3px;text-align:center;">' +
              '<div style="font-size:0.55rem;color:var(--text-muted);">' + lbl + '</div>' +
              '<div style="font-family:var(--font-mono);font-size:0.8rem;font-weight:700;">' + val + '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div style="height:4px;background:var(--bg-tertiary);border-radius:var(--radius-full);overflow:hidden;">' +
          '<div style="height:100%;width:' + hpPct + '%;background:' + hpCol + ';border-radius:var(--radius-full);transition:width 0.3s;"></div>' +
        '</div>' +
      '</div>';
    }).join('');
  };

  const renderDadiMini = (blockId) => `
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
      ${['4','6','8','10','12','20','100'].map(d => `
        <button class="btn btn-secondary btn-sm" style="padding:4px 8px;font-size:0.7rem;"
          onclick="Schermo.rollDie(${d},'${blockId}')">d${d}</button>`).join('')}
    </div>
    <div id="schermo-dice-result-${blockId}" style="font-family:var(--font-mono);font-size:1.4rem;font-weight:700;color:var(--accent-primary);text-align:center;min-height:36px;">—</div>
    <div id="schermo-dice-formula-${blockId}" style="font-size:0.7rem;color:var(--text-muted);text-align:center;"></div>`;

  const rollDie = (faces, blockId) => {
    const result = Math.floor(Math.random() * faces) + 1;
    const el = document.getElementById(`schermo-dice-result-${blockId}`);
    const formula = document.getElementById(`schermo-dice-formula-${blockId}`);
    if (el) { el.textContent = result; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'diceResult 0.3s ease'; }
    if (formula) formula.textContent = `d${faces}`;
    Storage.addDiceRoll(`d${faces}`, [result], result);
    Debug.log(`Schermo dice: d${faces} → ${result}`);
  };

  const renderMeteoMini = (blockId) => `
    <div id="schermo-meteo-${blockId}" class="text-sm text-muted" style="margin-bottom:8px;">Clicca per generare il meteo</div>
    <button class="btn btn-secondary btn-sm w-full" onclick="Schermo.generateMeteo('${blockId}')">Genera Meteo</button>`;

  const generateMeteo = async (blockId) => {
    const el = document.getElementById(`schermo-meteo-${blockId}`);
    if (!el) return;
    try {
      const r = await fetch('data/tabelle.json');
      const t = await r.json();
      const tipi = Object.keys(t.meteo);
      const tipo = tipi[Math.floor(Math.random() * tipi.length)];
      const pool = t.meteo[tipo];
      const desc = pool[Math.floor(Math.random() * pool.length)];
      const icons = { soleggiato: '☀️', nuvoloso: '☁️', pioggia: '🌧️', temporale: '⛈️', neve: '❄️', nebbia: '🌫️' };
      el.innerHTML = `<span style="font-size:1.2rem;">${icons[tipo] || '🌤️'}</span> <strong>${tipo}</strong><br><span class="text-muted">${desc}</span>`;
    } catch (e) {
      el.textContent = 'Errore caricamento dati';
    }
  };

  const renderNote = (block) => `
    <textarea
      style="width:100%;min-height:120px;background:transparent;border:none;resize:vertical;font-family:var(--font-body);font-size:0.85rem;color:var(--text-primary);outline:none;padding:0;"
      placeholder="Scrivi note rapide qui..."
      onchange="Schermo.saveNote('${block.id}', this.value)"
    >${block.content || ''}</textarea>`;

  const saveNote = (id, content) => {
    const block = _blocks.find(b => b.id === id);
    if (block) { block.content = content; save(); }
  };

  const renderCombatFull = () => {
    App.reloadActiveCampaign();
    const camp = App.getActiveCampaign();
    const combat = camp?.activeCombat;

    if (!combat || !combat.combatants?.length) {
      return '<div class="text-muted text-sm" style="margin-bottom:8px;">Nessuno scontro attivo.</div>' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap;">' +
          '<button class="btn btn-primary btn-sm" onclick="App.navigateTo(\'sessione\');setTimeout(()=>Sessione.newCombat(),300)">⚔️ Nuovo Scontro</button>' +
          '<button class="btn btn-secondary btn-sm" onclick="App.navigateTo(\'sessione\')">→ Sessione</button>' +
        '</div>';
    }

    const sorted = [...combat.combatants].sort((a, b) => b.iniziativa - a.iniziativa);
    const activeIdx = combat.turno || 0;

    const rows = sorted.map((c, i) => {
      const isActive = i === activeIdx;
      const hpPct = c.maxHp > 0 ? Math.max(0, Math.round((c.hp / c.maxHp) * 100)) : 100;
      const hpCol = hpPct > 66 ? 'var(--accent-success)' : hpPct > 33 ? 'var(--accent-warning)' : 'var(--accent-danger)';
      const condBadges = (c.condizioni || []).map(cond =>
        `<span class="badge badge-primary" style="font-size:0.6rem;padding:1px 4px;">${cond.slice(0,6)}</span>`
      ).join('');
      const icon = c.tipo === 'pg' ? '👤' : c.tipo === 'mostro' ? '🐉' : '⚔️';

      return `<div class="combat-row${isActive ? ' combat-active' : ''}${c.hp <= 0 ? ' combat-dead' : ''}"
          id="schermo-comb-${c.id}"
          style="display:grid;grid-template-columns:36px 1fr 140px auto;align-items:center;gap:8px;padding:5px 8px;">

        <!-- Iniziativa -->
        <div style="text-align:center;">
          <span style="font-family:var(--font-mono);font-size:0.9rem;font-weight:700;">${c.iniziativa}</span>
        </div>

        <!-- Nome + condizioni -->
        <div style="min-width:0;">
          <div style="display:flex;align-items:center;gap:5px;">
            <span style="font-size:0.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${icon} ${c.nome}${c.concentrazione ? ' 🔮' : ''}</span>
            ${c.tipo === 'pg' ? '' : `<button class="btn btn-ghost btn-icon-sm" style="flex-shrink:0;width:22px;height:22px;font-size:0.6rem;" onclick="Sessione.openCombatantSheet('${c.id}')" title="Scheda">📋</button>`}
          </div>
          ${condBadges ? `<div style="display:flex;flex-wrap:wrap;gap:2px;margin-top:2px;">${condBadges}</div>` : ''}
        </div>

        <!-- HP barra + valori -->
        <div>
          <div style="display:flex;align-items:center;gap:5px;">
            <div style="flex:1;height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${hpPct}%;background:${hpCol};border-radius:3px;transition:width 0.3s;"></div>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.75rem;color:${hpCol};min-width:44px;text-align:right;">${c.hp}/${c.maxHp}</span>
          </div>
        </div>

        <!-- Azioni -->
        <div style="display:flex;gap:4px;flex-shrink:0;">
          <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:0.72rem;"
            onclick="Sessione.changeHPSchermo('${c.id}',-1);setTimeout(()=>Schermo._refreshCombat(),200)" title="Danno">💥 Danno</button>
          <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:0.72rem;"
            onclick="Sessione.changeHPSchermo('${c.id}',1);setTimeout(()=>Schermo._refreshCombat(),200)" title="Cura">💚 Cura</button>
          <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:0.72rem;"
            onclick="Sessione.openCondizioneSchermo('${c.id}')" title="Condizioni">🔴 Cond.</button>
        </div>
      </div>`;
    }).join('');

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
        <div>
          <span style="font-family:var(--font-display);font-size:0.95rem;font-weight:700;">Round ${combat.round || 1}</span>
          <span style="color:var(--accent-secondary);margin-left:8px;font-size:0.85rem;">🎯 ${sorted[activeIdx]?.nome || '—'}</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick="Sessione.rollAllInitiative();setTimeout(()=>Schermo._refreshCombat(),200)">🎲 Init tutti</button>
          <button class="btn btn-secondary btn-sm" onclick="Sessione.prevTurn();setTimeout(()=>Schermo._refreshCombat(),200)">◀ Indietro</button>
          <button class="btn btn-primary btn-sm" onclick="Sessione.nextTurn();setTimeout(()=>Schermo._refreshCombat(),200)">▶ Avanti</button>
          <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('sessione');closeMobileMenu()">→ Sessione</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;">${rows}</div>
      <div style="margin-top:8px;">
        <button class="btn btn-ghost btn-sm" style="font-size:0.72rem;" onclick="Sessione.newCombat();setTimeout(()=>Schermo._refreshCombat(),300)">🆕 Nuovo Scontro</button>
      </div>`;
  };

  const renderCombatMini = () => {
    App.reloadActiveCampaign();
    const camp = App.getActiveCampaign();
    const combat = camp?.activeCombat;
    if (!combat || !combat.combatants?.length) {
      return '<div class="text-muted text-sm" style="margin-bottom:8px;">Nessuno scontro attivo.</div>' +
             '<div style="display:flex;gap:4px;flex-wrap:wrap;">' +
               '<button class="btn btn-primary btn-sm" onclick="App.navigateTo(\'sessione\');Sessione.newCombat()">Nuovo Scontro</button>' +
               '<button class="btn btn-secondary btn-sm" onclick="App.navigateTo(\'sessione\')">→ Sessione</button>' +
             '</div>';
    }

    const sorted = [...combat.combatants].sort((a,b) => b.iniziativa - a.iniziativa);
    const activeIdx = combat.turno || 0;

    return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        '<div style="font-family:var(--font-display);font-size:0.85rem;">Round ' + (combat.round||1) + ' · ' +
          '<span style="color:var(--accent-secondary);">' + (sorted[activeIdx]?.nome||'') + '</span></div>' +
        '<div style="display:flex;gap:4px;">' +
          '<button class="btn btn-primary btn-sm" onclick="Sessione.nextTurn();Schermo._refreshCombat()">▶ Avanti</button>' +
          '<button class="btn btn-secondary btn-sm" onclick="Sessione.rollAllInitiative();Schermo._refreshCombat()" title="Init tutti">Init</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:2px;">' +
      sorted.map((c, i) => {
        const isActive = i === activeIdx;
        const hpPct = c.maxHp > 0 ? Math.max(0, Math.round((c.hp/c.maxHp)*100)) : 100;
        const hpCol = hpPct > 66 ? 'var(--accent-success)' : hpPct > 33 ? 'var(--accent-warning)' : 'var(--accent-danger)';
        const cond = (c.condizioni||[]).map(x => '<span style="font-size:0.55rem;background:var(--accent-primary);color:#fff;border-radius:2px;padding:0 3px;">' + x.slice(0,4) + '</span>').join('');
        return '<div style="display:flex;align-items:center;gap:4px;padding:4px 6px;border-radius:var(--radius-sm);' +
            'background:' + (isActive ? 'rgba(139,38,53,0.15)' : 'transparent') + ';' +
            'border-left:2px solid ' + (isActive ? 'var(--accent-primary)' : 'transparent') + ';' +
            (c.hp <= 0 ? 'opacity:0.4;' : '') + '">' +
          '<span style="font-family:var(--font-mono);font-size:0.72rem;width:22px;text-align:right;color:var(--accent-secondary);">' + c.iniziativa + '</span>' +
          '<span style="flex:1;font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
            (c.tipo==='pg'?'👤':c.tipo==='mostro'?'🐉':'⚔️') + ' ' + c.nome +
            (c.concentrazione ? ' 🔮' : '') +
          '</span>' +
          (cond ? '<span style="display:flex;gap:2px;">' + cond + '</span>' : '') +
          '<div style="display:flex;align-items:center;gap:3px;">' +
            '<div style="width:32px;height:4px;background:var(--bg-tertiary);border-radius:2px;">' +
              '<div style="height:100%;width:' + hpPct + '%;background:' + hpCol + ';border-radius:2px;"></div>' +
            '</div>' +
            '<span style="font-family:var(--font-mono);font-size:0.68rem;color:' + hpCol + ';min-width:24px;">' + c.hp + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:1px;">' +
            '<button class="btn btn-ghost btn-icon-sm" style="width:22px;height:22px;font-size:0.65rem;" onclick="Sessione.quickDamage(\'' + c.id + '\');Schermo._refreshCombat()" title="Danno"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></button>' +
            '<button class="btn btn-ghost btn-icon-sm" style="width:22px;height:22px;font-size:0.65rem;" onclick="Sessione.openCondizioneModal(\'' + c.id + '\')" title="Condizioni"><span style="color:#e74c3c;"><svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg></span></button>' +
          '</div>' +
        '</div>';
      }).join('') +
      '</div>' +
      '<button class="btn btn-ghost btn-sm w-full" style="margin-top:6px;font-size:0.72rem;" onclick="App.navigateTo(\'sessione\')">→ Apri Sessione completa</button>';
  };

  const _refreshCombat = () => {
    _blocks.filter(b => b.type === 'combat_mini' || b.type === 'combat_full').forEach(b => updateBlockContent(b));
    _blocks.filter(b => b.type === 'percezioni').forEach(b => updateBlockContent(b));
  };

  const renderCondizioni = () => {
    const condizioni2024 = [
      ['Accecato',     'Non vede. Fallisce prove che richiedono la vista. Attacchi contro: Vantaggio. Suoi attacchi: Svantaggio.'],
      ['Affascinato',  'Non può attaccare la fonte. La fonte ha Vantaggio alle prove sociali contro di lui.'],
      ['Afferrato ★',  'Velocità 0. Svantaggio agli attacchi vs bersagli diversi dall\'afferratore. Liberarsi: azione + Atletica/Acrobazia vs DC 8+FOR+comp.'],
      ['Assordato',    'Non sente. Fallisce prove che richiedono l\'udito.'],
      ['Avvelenato',   'Svantaggio a tutte le prove e i tiri per colpire.'],
      ['Incapacitato ★','Niente azioni né reazioni. Non può parlare. Svantaggio all\'iniziativa.'],
      ['Invisibile',   'Non visto senza magia. Attacchi contro: Svantaggio. Suoi attacchi: Vantaggio.'],
      ['Paralizzato',  'Incapacitato, immobile. Fallisce TS FOR/DES. Attacchi contro: Vantaggio. Critici da mischia entro 1,5m.'],
      ['Pietrificato', 'Pietra. Incapacitato, peso ×10. Immune a veleni/malattie. Resistenza a tutti i danni. Critici da mischia.'],
      ['Prono',        'Muove solo strisciando (costo doppio). Svantaggio ai propri attacchi. Mischia vs lui: Vantaggio. Distanza vs lui: Svantaggio.'],
      ['Spaventato',   'Svantaggio a prove e attacchi mentre la fonte è visibile. Non può avvicinarsi volontariamente.'],
      ['Stordito',     'Incapacitato, immobile. Parla in modo incerto. Fallisce TS FOR/DES. Attacchi contro: Vantaggio.'],
      ['Trattenuto',   'Velocità 0. Svantaggio ai propri attacchi. Vantaggio agli attacchi contro. Svantaggio ai TS DES.'],
    ];
    const condizioni2014 = [
      ['Accecato',     'Non vede. Fallisce prove che richiedono la vista. Attacchi contro: Vantaggio. Suoi attacchi: Svantaggio.'],
      ['Affascinato',  'Non può attaccare o bersagliare la fonte con effetti nocivi. La fonte ha Vantaggio alle prove sociali.'],
      ['Afferrato',    'Velocità 0. Termina se afferratore è Incapacitato o bersaglio viene spostato fuori portata.'],
      ['Assordato',    'Non sente. Fallisce prove che richiedono l\'udito.'],
      ['Avvelenato',   'Svantaggio a tutte le prove di caratteristica e ai tiri per colpire.'],
      ['Incapacitato', 'Niente azioni né reazioni.'],
      ['Invisibile',   'Pesantemente oscurato. TxC contro: Svantaggio. Suoi attacchi: Vantaggio.'],
      ['Paralizzato',  'Incapacitato, immobile. Fallisce TS FOR/DES. Attacchi contro: Vantaggio. Critici da mischia entro 1,5m.'],
      ['Pietrificato', 'Incapacitato, immobile, peso ×10. Fallisce TS FOR/DES. Attacchi contro: Vantaggio. Immune a veleni/malattie. Resist. tutti danni.'],
      ['Prono',        'Muove solo strisciando (costo doppio). Svantaggio ai propri attacchi. Mischia vs lui (entro 1,5m): Vantaggio. Distanza vs lui: Svantaggio.'],
      ['Spaventato',   'Svantaggio a prove e TxC mentre fonte è visibile. Non può muoversi volontariamente verso la fonte.'],
      ['Stordito',     'Incapacitato, immobile. Parla solo balbettando. Fallisce TS FOR/DES. Attacchi contro: Vantaggio.'],
      ['Trattenuto',   'Velocità 0. Svantaggio ai TxC e ai TS DES. Attacchi contro: Vantaggio.'],
    ];

    const camp = App.getActiveCampaign();
    const sistema = camp?.system === '5e2014' ? '5e2014' : '5e2024';
    const list = sistema === '5e2014' ? condizioni2014 : condizioni2024;
    const label = sistema === '5e2014' ? '2014' : '2024 ★';

    return '<div style="font-size:0.62rem;color:var(--text-muted);margin-bottom:6px;font-family:var(--font-display);">Edizione ' + label + '</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;">' +
      list.map(([nome, desc]) =>
        '<tr>' +
          '<td style="font-family:var(--font-display);font-weight:600;font-size:0.72rem;padding:4px 6px 4px 0;vertical-align:top;white-space:nowrap;border-bottom:1px solid var(--border);min-width:90px;">' + nome + '</td>' +
          '<td style="padding:4px 0;vertical-align:top;border-bottom:1px solid var(--border);color:var(--text-secondary);line-height:1.4;">' + desc + '</td>' +
        '</tr>'
      ).join('') +
      '</table>';
  };

  const _compendioSections = () => {
    const rules = Compendio?.getData()?.rules || [];

    const capitoli = {};
    rules.forEach(r => {
      const cap = r.capitolo || 'Regole';
      if (!capitoli[cap]) capitoli[cap] = [];
      capitoli[cap].push(r);
    });
    return capitoli;
  };

  const renderCompendioRef = (block) => {
    App.reloadActiveCampaign();
    const sezione = block.content || '';

    let allRules = Compendio?.getData()?.rules || [];
    if (allRules.length === 0) {

      const camp = App.getActiveCampaign();
      const sistema = camp?.system || '5e2024';
      const file = sistema === '5e2014' ? 'data/srd_5_1_rules.json' : 'data/srd_5_2_1_rules.json';
      fetch(file).then(r => r.json()).then(rulesData => {
        if (Compendio._injectRules) Compendio._injectRules(rulesData);
        setTimeout(() => updateBlockContent(block), 300);
      }).catch(() => {
        Compendio?.init?.();
        setTimeout(() => updateBlockContent(block), 1500);
      });
      return '<div class="text-muted text-sm" style="padding:8px;">⏳ Caricamento regole in corso...</div>';
    }

    const capitoli = _compendioSections();

    const opts = Object.entries(capitoli).map(([cap, capRules]) =>
      '<optgroup label="' + cap + '">' +
      capRules.map(r => '<option value="' + r.id + '"' + (r.id === sezione ? ' selected' : '') + '>' + r.nome + '</option>').join('') +
      '</optgroup>'
    ).join('');

    const selector = '<select class="form-select" style="width:100%;margin-bottom:8px;font-size:0.75rem;" ' +
      'onchange="Schermo.setCompendioRef(\'' + block.id + '\',this.value)">' +
      '<option value="">— Scegli una sezione —</option>' +
      opts +
      '</select>';

    if (!sezione) {
      return (allRules.length === 0
        ? '<div class="text-muted text-sm">Apri il Compendio almeno una volta per caricare le regole.</div>'
        : selector);
    }

    const regola = allRules.find(r => r.id === sezione);
    if (!regola) return selector + '<div class="text-muted text-sm">Sezione non trovata.</div>';

    const content = (regola.sezioni || []).map(sez => {
      if (!sez.righe?.length) return '';
      const cols = Object.keys(sez.righe[0]);
      return '<div style="font-family:var(--font-display);font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin:8px 0 4px;">' + sez.titolo + '</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;">' +
        '<thead><tr>' + cols.map(c => '<th style="text-align:left;padding:3px 4px 3px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.04em;text-transform:uppercase;color:var(--text-muted);">' + c + '</th>').join('') + '</tr></thead>' +
        '<tbody>' + sez.righe.map(r =>
          '<tr>' + cols.map(c => '<td style="padding:3px 4px 3px 0;border-bottom:1px solid var(--border);vertical-align:top;line-height:1.4;">' + (r[c]||'—') + '</td>').join('') + '</tr>'
        ).join('') + '</tbody></table>';
    }).join('');

    const descHtml = regola.descrizione
      ? '<div class="text-sm" style="line-height:1.6;margin-bottom:8px;color:var(--text-secondary);">' + regola.descrizione + '</div>'
      : '';

    return selector + descHtml + (content || '<div class="text-muted text-sm">Nessuna tabella disponibile.</div>');
  };

  const renderStiliVita = () => {
    const tbl = (rows, header) => {
      const hdr = header ? `<div style="font-family:var(--font-display);font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;padding:6px 0 3px;border-top:1px solid var(--border);margin-top:4px;">${header}</div>` : '';
      return hdr + '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;">' +
        rows.map(([n,v]) =>
          '<tr><td style="padding:2px 0;border-bottom:1px solid var(--border);">' + n + '</td>' +
          '<td style="padding:2px 0;text-align:right;font-family:var(--font-mono);color:var(--accent-secondary);border-bottom:1px solid var(--border);">' + v + '</td></tr>'
        ).join('') + '</table>';
    };

    return tbl([
      ['Miserabile',   '— (straccione)'],
      ['Squallido',    '1 mr/giorno'],
      ['Povero',       '2 mr/giorno'],
      ['Modesto',      '1 mo/giorno'],
      ['Comodo',       '2 mo/giorno'],
      ['Ricco',        '4 mo/giorno'],
      ['Aristocratico','10+ mo/giorno'],
    ]) +
    tbl([
      ['Locanda squallida',    '7 mr/notte'],
      ['Locanda povera',       '1 ma/notte'],
      ['Locanda modesta',      '5 ma/notte'],
      ['Locanda comoda',       '8 ma/notte'],
      ['Locanda ricca',        '2 mo/notte'],
      ['Locanda aristocratica','4 mo/notte'],
      ['Pasto semplice',       '3 mr'],
      ['Pasto buono',          '5 mr'],
      ['Boccale di birra',     '4 mr'],
      ['Vino (bottiglia)',     '2 mr'],
      ['Stalla (notte)',       '5 mr'],
      ['Guardia del corpo',    '2 mo/giorno'],
      ['Messaggero',           '2 mr/km'],
      ['Traghetto/pedaggio',   '1 mr'],
      ['Carrozza',             '3 mr/km'],
    ], 'Servizi');
  };

  const renderProprietaArmi = () => {
    const camp = App.getActiveCampaign();
    const is2024 = camp?.system !== '5e2014';

    const props2024 = [
      ['Ammunizione', 'Richiede munizioni per attaccare a distanza. Estrarre/recuperare munizione fa parte dell\'attacco. Fine scontro: recuperi metà delle munizioni usate.'],
      ['Affilata', 'Puoi usare FOR o DES per TxC e danno con questa arma.'],
      ['Appesantita', 'Creature Piccole o Minuscole hanno Svantaggio ai TxC con quest\'arma.'],
      ['Colpo di grazia', 'Critico automatico se bersaglio è Incapacitato e sei entro 1,5m.'],
      ['Destrezza', 'Puoi scegliere FOR o DES per TxC e danno.'],
      ['Devastante', 'Quando tiri il massimo su un dado danno, ritira e somma (una volta sola).'],
      ['Lancio', 'Puoi lanciare l\'arma come attacco a distanza. Gittata indicata tra parentesi.'],
      ['Leggera', 'Adatta al combattimento con due armi. Puoi effettuare un attacco bonus con l\'altra mano.'],
      ['Lunga', 'Quando fai un attacco con quest\'arma, puoi attaccare bersagli entro 3m invece di 1,5m.'],
      ['Mischia', 'Attacca bersagli entro 1,5m (o di più con proprietà Lunga).'],
      ['Munizioni', 'Vedi Ammunizione.'],
      ['Spinta', 'Se colpisci, puoi spingere il bersaglio di 3m lontano da te (azione bonus).'],
      ['Speciale', 'Regole speciali descritte nella voce dell\'arma.'],
      ['Versatile', 'Puoi usare questa arma a una o due mani. Danno a due mani indicato tra parentesi.'],
    ];

    const props2014 = [
      ['Ammunizione', 'Richiede munizioni per attaccare a distanza. Fine scontro: recuperi metà delle munizioni usate (se non magiche).'],
      ['Destrezza', 'Puoi usare FOR o DES per TxC e danno.'],
      ['Lanciabile', 'Puoi lanciare quest\'arma come attacco a distanza. Gittata tra parentesi.'],
      ['Leggera', 'Adatta al combattimento con due armi (bonus action attack).'],
      ['Lunga', 'Portata di 3m invece di 1,5m.'],
      ['Mischia', 'Attacco da mischia a 1,5m.'],
      ['Pesante', 'Creature Piccole e Minuscole: Svantaggio ai TxC.'],
      ['Ricarica', 'Puoi fare solo 1 attacco con questa arma per azione/azione bonus, indipendentemente dagli attacchi extra.'],
      ['Speciale', 'Regole speciali nella voce dell\'arma.'],
      ['Versatile', 'Puoi usarla a una o due mani. Danno a due mani tra parentesi.'],
      ['A due mani', 'Richiede entrambe le mani per attaccare.'],
      ['Distanza', 'Gittata normale/massima tra parentesi. Oltre la gittata normale: Svantaggio. Oltre la massima: impossibile.'],
    ];

    const list = is2024 ? props2024 : props2014;
    const label = is2024 ? '2024' : '2014';

    return '<div style="font-size:0.62rem;color:var(--text-muted);margin-bottom:6px;font-family:var(--font-display);">Edizione ' + label + '</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;">' +
      list.map(([nome, desc]) =>
        '<tr>' +
          '<td style="font-family:var(--font-display);font-weight:600;font-size:0.72rem;padding:4px 6px 4px 0;vertical-align:top;white-space:nowrap;border-bottom:1px solid var(--border);min-width:85px;">' + nome + '</td>' +
          '<td style="padding:4px 0;vertical-align:top;border-bottom:1px solid var(--border);color:var(--text-secondary);line-height:1.4;">' + desc + '</td>' +
        '</tr>'
      ).join('') +
      '</table>';
  };

  const setCompendioRef = (blockId, sezioneId) => {
    const block = _blocks.find(b => b.id === blockId);
    if (!block) return;
    block.content = sezioneId;
    const allRules = Compendio?.getData()?.rules || [];
    const regola = allRules.find(r => r.id === sezioneId);
    if (regola) block.title = '📖 ' + regola.nome;
    save();
    updateBlockContent(block);

    const titleEl = document.querySelector('#sblock-' + blockId + ' .schermo-block-title');
    if (titleEl && regola) titleEl.textContent = regola.nome;
    Debug.log('CompendioRef: ' + sezioneId);
  };

  const renderDC = () => {
    const dcs = [
      ['Banale', '5'], ['Facile', '10'], ['Media', '15'],
      ['Difficile', '20'], ['Molto difficile', '25'], ['Quasi impossibile', '30'],
    ];
    return `<div style="display:grid;grid-template-columns:1fr auto;gap:3px 12px;">` +
      dcs.map(([d, v]) => `
        <span style="font-size:0.82rem;">${d}</span>
        <span style="font-family:var(--font-mono);font-size:0.82rem;font-weight:700;color:var(--accent-primary);">${v}</span>`).join('') +
      `</div>`;
  };

  const renderTempo = () => {
    App.reloadActiveCampaign();
    const cal = Calendario.get();

    if (!cal) {
      return '<div class="text-muted text-sm" style="text-align:center;padding:8px;">Nessun calendario attivo.<br><small>Attivalo nelle impostazioni campagna.</small></div>';
    }

    const dateStr = Calendario.getDateStr(cal);
    const timeStr = Calendario.getTimeStr(cal);
    const mese = cal.mesi[cal.mese];
    const festivita = (cal.festivita||[]).find(f => f.mese===cal.mese && f.giorno===cal.giorno);

    return `
      <div style="text-align:center;margin-bottom:10px;">
        <div style="font-family:var(--font-mono);font-size:2rem;font-weight:700;color:var(--accent-primary);">${timeStr}</div>
        <div style="font-size:0.82rem;color:var(--text-secondary);margin-top:2px;font-family:var(--font-display);">${dateStr}</div>
        ${festivita ? `<div style="font-size:0.72rem;color:var(--accent-secondary);margin-top:3px;">🎉 ${festivita.nome}</div>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:6px;">
        <button class="btn btn-secondary btn-sm" style="font-size:0.72rem;" onclick="Schermo._avanzaTempo('minuti',10)">+10 min</button>
        <button class="btn btn-secondary btn-sm" style="font-size:0.72rem;" onclick="Schermo._avanzaTempo('ore',1)">+1 ora</button>
        <button class="btn btn-secondary btn-sm" style="font-size:0.72rem;" onclick="Schermo._avanzaTempo('ore',8)">+8 ore</button>
        <button class="btn btn-secondary btn-sm" style="font-size:0.72rem;" onclick="Schermo._avanzaTempo('giorni',1)">+1 giorno</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
        <button class="btn btn-ghost btn-sm" style="font-size:0.65rem;" onclick="Schermo._avanzaTempo('minuti',-10)">−10 min</button>
        <button class="btn btn-ghost btn-sm" style="font-size:0.65rem;" onclick="Schermo._avanzaTempo('giorni',-1)">−1 giorno</button>
      </div>`;
  };

  const _avanzaTempo = (unit, amount) => {
    let cal = Calendario.get();
    if (!cal) { Toast.show('Nessun calendario attivo', 'warning'); return; }
    cal = Calendario.advance(cal, unit, amount);
    Calendario.save(cal);
    _blocks.filter(b => b.type === 'tempo').forEach(b => updateBlockContent(b));
    Toast.show(Calendario.getDateStr(cal) + ' ' + Calendario.getTimeStr(cal), 'info', 2000);
  };

  const advanceTime = (minutes) => _avanzaTempo('minuti', minutes);

  const renderVelocita = (blockId) => {
    const durata = document.getElementById(`vel-schermo-dur-${blockId}`)?.value || '8h';
    return `
      <div style="margin-bottom:6px;display:flex;gap:6px;align-items:center;">
        <input type="text" id="vel-schermo-q-${blockId}" class="form-input"
          placeholder="🔍 Cerca..." style="flex:1;font-size:0.78rem;padding:4px 8px;"
          oninput="Schermo.filterVelocita('${blockId}')">
        <select id="vel-schermo-dur-${blockId}" class="form-select"
          style="font-size:0.72rem;width:auto;" onchange="Schermo.filterVelocita('${blockId}')">
          <option value="1h">1h</option>
          <option value="8h" selected>8h</option>
          <option value="16h">16h</option>
          <option value="24h">24h</option>
        </select>
      </div>
      <div id="vel-schermo-list-${blockId}" class="text-muted text-sm">Digita per cercare...</div>`;
  };

  const filterVelocita = async (blockId) => {
    const q = (document.getElementById(`vel-schermo-q-${blockId}`)?.value || '').toLowerCase().trim();
    const durata = document.getElementById(`vel-schermo-dur-${blockId}`)?.value || '8h';
    const el = document.getElementById(`vel-schermo-list-${blockId}`);
    if (!el) return;
    if (!q) { el.innerHTML = '<span class="text-muted text-sm">Digita per cercare...</span>'; return; }

    let data = null;
    try { const r = await fetch('data/velocita.json'); data = await r.json(); } catch(e) { return; }

    const durKeys = {
      '1h':  { norm: 'vel_1h_norm', lento: 'vel_1h_lento', fast: 'vel_1h_fast' },
      '8h':  { norm: 'vel_8h_norm', lento: 'vel_8h_lento', fast: 'vel_8h_fast' },
      '16h': { norm: 'vel_16h_norm', lento: 'vel_16h_lento', fast: 'vel_16h_fast' },
      '24h': { norm: 'vel_24h_norm', lento: 'vel_24h_lento', fast: 'vel_24h_fast' },
    };
    const keys = durKeys[durata] || durKeys['8h'];

    const numQ = parseFloat(q);
    const generics = isNaN(numQ) ? [] : (data.monture_generiche || []).filter(m =>
      String(m.vel_base_ft).includes(q) || String(m.vel_base_m).includes(q)
    );

    const results = (data.creature || []).filter(c => c.nome.toLowerCase().includes(q));
    const allResults = [...generics.map(m => ({
      nome: `${m.vel_base_ft}ft / ${m.vel_base_m}m base`,
      tipo: 'montatura generica',
      ...m
    })), ...results];

    if (!allResults.length) { el.innerHTML = '<span class="text-muted text-sm">Nessun risultato</span>'; return; }

    el.innerHTML = '<div style="display:flex;flex-direction:column;gap:3px;">' +
      allResults.slice(0, 8).map(c => {
        const norm = c[keys.norm] ?? '—';
        const lento = c[keys.lento] ?? '—';
        const fast = c[keys.fast] ?? '—';
        return `<div style="display:flex;align-items:baseline;justify-content:space-between;gap:6px;padding:3px 0;border-bottom:1px solid var(--border);">
          <span style="font-size:0.75rem;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.nome}</span>
          <div style="display:flex;gap:4px;flex-shrink:0;">
            ${lento !== '—' ? `<span class="schermo-stat" title="Lento">L ${lento}</span>` : ''}
            <span class="schermo-stat" title="Normale">🚶${norm}</span>
            ${fast !== '—' ? `<span class="schermo-stat" title="Veloce">V ${fast}</span>` : ''}
          </div>
        </div>`;
      }).join('') + '</div>';
  };

  const renderCustom = (block) => `
    <div style="font-size:0.85rem;color:var(--text-secondary);white-space:pre-wrap;line-height:1.6;">${block.content || '<span class="text-muted">Clicca ✏️ per modificare</span>'}</div>`;

  const addBlock = () => {

    const sel = document.getElementById('schermo-block-type');
    if (sel) {
      sel.innerHTML = Object.entries(BLOCK_TYPES).map(([key, def]) =>
        `<option value="${key}">${def.icon} ${def.label}${def.repeatable ? ' (ripetibile)' : ''}</option>`
      ).join('');
    }
    const sizeSel = document.getElementById('schermo-block-size');
    if (sizeSel) {
      sizeSel.innerHTML = Object.entries(SIZES).map(([key, def]) =>
        `<option value="${key}" ${key === 'md' ? 'selected' : ''}>${def.label}</option>`
      ).join('');
    }
    if (document.getElementById('schermo-block-title')) {
      document.getElementById('schermo-block-title').value = '';
    }
    if (document.getElementById('schermo-block-content')) {
      document.getElementById('schermo-block-content').value = '';
    }
    Modal.open('schermo-add-modal');
  };

  const submitAddBlock = () => {
    const type    = document.getElementById('schermo-block-type')?.value || 'note';
    const size    = document.getElementById('schermo-block-size')?.value || 'md';
    const title   = document.getElementById('schermo-block-title')?.value?.trim() || '';
    const content = document.getElementById('schermo-block-content')?.value?.trim() || '';

    const block = {
      id: 'sb_' + Date.now(),
      type, size,
      title: title || BLOCK_TYPES[type]?.label || 'Blocco',
      content,
    };

    const colCounts = [0,1,2,3].map(c => _blocks.filter(b => (b.col ?? 0) === c).length);
    block.col = colCounts.indexOf(Math.min(...colCounts));
    _blocks.push(block);
    save();
    Modal.close('schermo-add-modal');
    render();
    Toast.show('Blocco aggiunto', 'success');
    Debug.log(`Schermo: blocco ${type} aggiunto`);
  };

  const removeBlock = (id) => {
    _blocks = _blocks.filter(b => b.id !== id);
    save();
    render();
  };

  const resizeBlock = (id) => {
    const block = _blocks.find(b => b.id === id);
    if (!block) return;
    const sizeKeys = Object.keys(SIZES);
    const cur = sizeKeys.indexOf(block.size || 'md');
    block.size = sizeKeys[(cur + 1) % sizeKeys.length];
    save();
    render();
  };

  const moveBlock = (id, dir) => {
    const idx = _blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= _blocks.length) return;
    [_blocks[idx], _blocks[newIdx]] = [_blocks[newIdx], _blocks[idx]];
    save();
    render();
  };

  const editBlock = (id) => {
    const block = _blocks.find(b => b.id === id);
    if (!block) return;
    const title = prompt('Titolo del blocco:', block.title || '');
    if (title === null) return;
    const content = prompt('Contenuto:', block.content || '');
    if (content === null) return;
    block.title = title || block.title;
    block.content = content;
    save();
    render();
  };

  const resetLayout = () => {
    openConfirmModal('Resettare lo schermo?', 'Tutti i blocchi verranno rimossi.', () => {
      _blocks = [];
      save();
      render();
      Toast.show('Schermo resettato', 'info');
    });
  };

  const refreshCombat = () => {
    _blocks.filter(b => b.type === 'combat_mini').forEach(b => updateBlockContent(b));
  };

  const _swapBlocks = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const item = _blocks.splice(fromIdx, 1)[0];
    _blocks.splice(toIdx, 0, item);
    save();
    render();
  };

  const startResize = (e, blockId) => {
    e.preventDefault();
    e.stopPropagation();
    const bodyEl = document.getElementById(`sbody-${blockId}`);
    if (!bodyEl) return;
    const startY = e.clientY;

    const startH = bodyEl.getBoundingClientRect().height;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';

    const onMove = (ev) => {
      const delta = ev.clientY - startY;
      const newH = Math.max(40, Math.round(startH + delta));
      bodyEl.style.minHeight = newH + 'px';
      bodyEl.style.maxHeight = 'none';
    };
    const onUp = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const screen = Storage.getMasterScreen();
      const blk = (screen.blocks || []).find(b => b.id === blockId);
      if (blk) {
        blk.bodyHeight = parseInt(bodyEl.style.minHeight) || blk.bodyHeight;
        Storage.saveMasterScreen(screen);
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return {
    init, render, addBlock, submitAddBlock,
    removeBlock, resizeBlock, moveBlock, editBlock, resetLayout,
    rollDie, generateMeteo, saveNote, advanceTime, refreshCombat,
    setCompendioRef, _refreshCombat, _refreshFavoriti, _swapBlocks,
    _refreshNoteSessione, _avanzaTempo,
    startResize,
    _blocks: () => _blocks,
    _syncFromDOM: () => {
      const grid = document.getElementById('schermo-grid');
      if (!grid) return;
      const newOrder = [];
      grid.querySelectorAll('.schermo-block').forEach(el => {
        const id = el.id.replace('sblock-', '');
        const blk = _blocks.find(b => b.id === id);
        if (blk) newOrder.push(blk);
      });
      _blocks = newOrder;
      save();
    },
  };
})();
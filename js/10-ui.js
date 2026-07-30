const SessCtx = (() => {
  let _activeTab = 'note';

  const showTab = (tab) => {
    _activeTab = tab;
    ['note','png','luoghi','info'].forEach(t => {
      const el = document.getElementById('sess-ctx-' + t);
      const btn = document.getElementById('sess-ctx-tab-' + t);
      if (el)  el.style.display  = t === tab ? '' : 'none';
      if (btn) btn.className = t === tab ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
    });
    if (tab === 'png')    _renderPNG();
    if (tab === 'luoghi') _renderLuoghi();
    if (tab === 'info')   _renderInfo();
  };

  const _getActiveSessione = () => {
    const camp = App.getActiveCampaign();
    if (!camp) return null;

    return (camp.sessioni_log || []).find(s => s.stato === 'in_corso') ||
           (camp.sessioni_log || []).slice(-1)[0] || null;
  };

  const _renderPNG = () => {
    const camp = App.getActiveCampaign();
    const sess = _getActiveSessione();
    const container = document.getElementById('sess-ctx-png-list');
    if (!container) return;

    let npcIds = sess?.npcs || [];
    const npcNames = (sess?.npcs_nomi || []);

    const npcs = (camp?.npcs || []).filter(n => npcIds.includes(n.id));

    const wikiSess = (camp?.wiki?.sessioni || []).find(s => s.sessioneId === sess?.id);
    const extraNames = wikiSess ? (wikiSess.png || '').split(',').map(s => s.trim()).filter(Boolean) : [];

    if (!npcs.length && !extraNames.length) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;">Nessun PNG nella sessione attiva.<br>Aggiungili dalla scheda sessione in Wiki.</div>';
      return;
    }

    container.innerHTML = npcs.map(n =>
      '<button onclick="WikiSections.goto(\'png\'); setTimeout(()=>WikiSections.openCard(\'png\',\''+n.id+'\'),150)" ' +
      'style="display:flex;align-items:center;gap:6px;padding:5px 10px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);cursor:pointer;font-size:0.78rem;color:var(--text-primary);">' +
      (n.immagine ? '<img src="'+n.immagine+'" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" onerror="this.style.display=\'none\'">' : '') +
      '<span>' + (n.name || n.nome || '?') + '</span>' +
      (n.ruolo ? '<span style="color:var(--text-muted);font-size:0.7rem;">— ' + n.ruolo + '</span>' : '') +
      '</button>'
    ).join('') +
    extraNames.map(nm =>
      '<span style="padding:4px 10px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);font-size:0.78rem;">@' + nm + '</span>'
    ).join('');
  };

  const _renderLuoghi = () => {
    const camp = App.getActiveCampaign();
    const sess = _getActiveSessione();
    const container = document.getElementById('sess-ctx-luoghi-list');
    if (!container) return;

    const luoghiStr = sess?.luoghi_visitati || '';
    const luoghiNames = luoghiStr.split(',').map(s=>s.trim()).filter(Boolean);
    const locs = (camp?.locations || []).filter(l => luoghiNames.includes(l.nome || l.name));

    if (!luoghiNames.length) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;">Nessun luogo nella sessione attiva.</div>';
      return;
    }

    container.innerHTML = luoghiNames.map(nome => {
      const loc = locs.find(l => (l.nome || l.name) === nome);
      return '<button onclick="WikiSections.goto(\'luoghi\'); setTimeout(()=>{ const l=(App.getActiveCampaign()?.locations||[]).find(x=>(x.nome||x.name)===\''+nome+'\'); if(l) WikiSections.openCard(\'luoghi\',l.id); },150)" ' +
        'style="display:flex;align-items:center;gap:6px;padding:5px 10px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);cursor:pointer;font-size:0.78rem;color:var(--text-primary);">' +
        '<span>' + nome + '</span>' +
        (loc?.tipo ? '<span style="color:var(--text-muted);font-size:0.7rem;">— ' + loc.tipo + '</span>' : '') +
        '</button>';
    }).join('');
  };

  const _renderInfo = () => {
    const camp = App.getActiveCampaign();
    const sess = _getActiveSessione();
    const container = document.getElementById('sess-ctx-info-content');
    if (!container) return;

    if (!sess) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;">Nessuna sessione attiva.<br>Crea una sessione con "+ Nuova Sessione".</div>';
      return;
    }

    const rows = [
      ['Sessione', sess.numero ? 'S' + sess.numero : '—'],
      ['Titolo', sess.titolo || '—'],
      ['Data', sess.data || '—'],
      ['Stato', sess.stato || '—'],
      ['Meteo', sess.meteo || '—'],
      ['Obiettivi', sess.notePrep || '—'],
      ['Ganci', sess.ganci || '—'],
      ['XP', sess.xp || '—'],
    ];

    container.innerHTML = rows
      .filter(([,v]) => v !== '—')
      .map(([k,v]) =>
        '<div style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-start;">' +
        '<span style="font-size:0.68rem;font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);min-width:70px;padding-top:2px;">' + k + '</span>' +
        '<span style="font-size:0.82rem;flex:1;">' + v + '</span>' +
        '</div>'
      ).join('') +
      '<button onclick="SessCtx.openWikiSessione()" class="btn btn-ghost btn-sm" style="margin-top:8px;font-size:0.72rem;">📖 Scheda completa in Wiki →</button>';
  };

  const openWikiSessione = () => {
    const sess = _getActiveSessione();
    if (!sess) { Toast.show('Nessuna sessione attiva', 'warning'); return; }
    WikiSections.goto('sessioni');
    setTimeout(() => {
      WikiSections.openCard('sessioni', sess.id);
    }, 200);
  };

  const refresh = () => {
    if (_activeTab === 'png')    _renderPNG();
    else if (_activeTab === 'luoghi') _renderLuoghi();
    else if (_activeTab === 'info')   _renderInfo();
    Toast.show('Aggiornato', 'success', 1000);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const origNav = App.navigateTo;
    if (typeof origNav === 'function') {

    }
  });

  return { showTab, refresh, openWikiSessione };
})();

const Trame = (() => {

  const CATEGORIE = ['Trama A — Principale','Trama B','Trama C','Arco personaggio','Sottotrama','Mistero','Altro'];
  const STATI     = ['In corso','Completata','In pausa','Abbandonata'];
  const CAT_COLORS = {
    'Trama A — Principale': '#c9a84c',
    'Trama B':              '#5ba4f5',
    'Trama C':              '#c97bea',
    'Arco personaggio':     '#69cc85',
    'Sottotrama':           '#ff9f43',
    'Mistero':              '#ff6b6b',
    'Altro':                '#56d4dd',
  };
  const STATO_COLORS = {
    'In corso':    '#69cc85',
    'Completata':  '#5ba4f5',
    'In pausa':    '#f5a623',
    'Abbandonata': '#7a7068',
  };

  let _currentId = null;

  const _getData = () => {
    const camp = App.getActiveCampaign();
    if (!camp.trame) camp.trame = [];
    return camp.trame;
  };

  const _save = (trame) => App.saveActiveCampaign({ trame });

  const _esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // ── Crea nuova trama ──
  const newTrama = () => {
    const trame = _getData();
    // Categoria automatica: A se è la prima, poi B, C, ecc.
    const cat = CATEGORIE[Math.min(trame.length, CATEGORIE.length - 1)];
    const color = CAT_COLORS[cat] || '#c9a84c';
    const nuova = {
      id: 'tr_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
      titolo: 'Nuova trama',
      categoria: cat,
      colore: color,
      stato: 'In corso',
      corpo: '',
      note: '',
    };
    trame.push(nuova);
    _save(trame);
    renderList();
    // Apri subito la nuova trama
    setTimeout(() => openTrama(nuova.id), 50);
  };

  const deleteTrama = (id) => {
    if (!confirm('Eliminare questa trama?')) return;
    const trame = _getData().filter(t => t.id !== id);
    _save(trame);
    _currentId = null;
    renderList();
    const detail = document.getElementById('trame-detail');
    if (detail) detail.style.display = 'none';
    const list = document.getElementById('trame-list');
    if (list) list.style.display = '';
  };

  // ── Lista card ──
  const renderList = () => {
    const container = document.getElementById('trame-container');
    if (!container) return;
    const trame = _getData();

    if (!trame.length) {
      container.innerHTML =
        '<div style="text-align:center;padding:40px;color:var(--text-muted);">' +
        '<div style="font-size:2rem;opacity:0.3;margin-bottom:12px;">📖</div>' +
        '<div style="font-size:0.9rem;margin-bottom:16px;">Nessuna trama. Crea la prima per iniziare.</div>' +
        '<button class="btn btn-primary" onclick="Trame.newTrama()">+ Crea prima trama</button>' +
        '</div>';
      return;
    }

    // Raggruppa per categoria
    const bycat = {};
    CATEGORIE.forEach(c => { bycat[c] = []; });
    trame.forEach(t => {
      const cat = t.categoria || CATEGORIE[0];
      if (!bycat[cat]) bycat[cat] = [];
      bycat[cat].push(t);
    });

    let html2 = '';
    CATEGORIE.forEach(cat => {
      const items = bycat[cat] || [];
      if (!items.length) return;
      const color = CAT_COLORS[cat] || 'var(--accent-primary)';
      html2 += '<div style="margin-bottom:24px;">' +
        '<div style="font-size:0.72rem;font-family:var(--font-display);text-transform:uppercase;' +
        'letter-spacing:0.1em;color:' + color + ';font-weight:700;margin-bottom:10px;' +
        'padding-bottom:4px;border-bottom:2px solid ' + color + '40;">' + cat + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
        items.map(function(t) {
          const sc = STATO_COLORS[t.stato] || '#aaa';
          return '<div class="trama-card-item" data-id="' + t.id + '" ' +
            'style="display:flex;align-items:center;gap:12px;padding:12px 16px;' +
            'background:var(--bg-card);border:1px solid var(--border);' +
            'border-left:4px solid ' + (t.colore||color) + ';' +
            'border-radius:var(--radius-md);cursor:pointer;">' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-family:var(--font-display);font-size:0.95rem;font-weight:600;' +
              'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _esc(t.titolo||'Senza titolo') + '</div>' +
              (t.corpo ? '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;' +
              'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _esc(t.corpo.replace(/<[^>]*>/g,'').slice(0,80)) + '</div>' : '') +
            '</div>' +
            '<span style="padding:2px 8px;background:' + sc + '22;color:' + sc + ';' +
            'border-radius:var(--radius-full);font-size:0.7rem;white-space:nowrap;">' + (t.stato||'In corso') + '</span>' +
            '<button class="trama-del-btn" data-id="' + t.id + '" ' +
            'style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px;font-size:0.85rem;flex-shrink:0;">✕</button>' +
          '</div>';
        }).join('') +
        '</div></div>';
    });

    container.innerHTML = html2;

    // Event delegation
    container.querySelectorAll('.trama-card-item').forEach(function(el) {
      el.addEventListener('click', function(e) {
        if (e.target.classList.contains('trama-del-btn') || e.target.closest('.trama-del-btn')) return;
        Trame.openTrama(this.dataset.id);
      });
    });
    container.querySelectorAll('.trama-del-btn').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        Trame.deleteTrama(this.dataset.id);
      });
    });
  };

  // ── Apri pagina dettaglio trama ──
  const openTrama = (id) => {
    const trame = _getData();
    const t = trame.find(function(x) { return x.id === id; });
    if (!t) return;
    _currentId = id;

    const list   = document.getElementById('trame-list');
    const detail = document.getElementById('trame-detail');
    if (list)   list.style.display   = 'none';
    if (detail) detail.style.display = '';

    if (!detail) return;
    const color = t.colore || CAT_COLORS[t.categoria] || 'var(--accent-primary)';

    detail.innerHTML =
      '<div style="max-width:800px;margin:0 auto;padding:0 0 40px;">' +

        // Header
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;flex-wrap:wrap;">' +
          '<button onclick="Trame.closeDetail()" style="background:none;border:none;cursor:pointer;' +
          'color:var(--text-muted);padding:4px 8px;font-size:0.85rem;display:flex;align-items:center;gap:4px;">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Trame</button>' +
          '<div style="width:1px;height:16px;background:var(--border);"></div>' +
          '<input id="trama-titolo" value="' + _esc(t.titolo||'') + '" ' +
          'style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;background:transparent;' +
          'border:none;border-bottom:2px solid ' + color + ';flex:1;min-width:200px;padding:2px 0;color:var(--text-primary);">' +
          '<select id="trama-categoria" style="font-size:0.78rem;background:var(--bg-secondary);' +
          'border:1px solid var(--border);border-radius:var(--radius-sm);padding:4px 8px;color:var(--text-primary);">' +
          CATEGORIE.map(function(c) { return '<option value="' + c + '"' + (t.categoria===c?' selected':'') + '>' + c + '</option>'; }).join('') +
          '</select>' +
          '<select id="trama-stato" style="font-size:0.78rem;background:var(--bg-secondary);' +
          'border:1px solid var(--border);border-radius:var(--radius-sm);padding:4px 8px;' +
          'color:' + (STATO_COLORS[t.stato]||'var(--text-muted)') + ';">' +
          STATI.map(function(s) { return '<option value="' + s + '"' + (t.stato===s?' selected':'') + '>' + s + '</option>'; }).join('') +
          '</select>' +
          '<input type="color" id="trama-colore" value="' + (t.colore||color) + '" ' +
          'style="width:28px;height:28px;border:none;border-radius:4px;cursor:pointer;">' +
        '</div>' +

        // Corpo principale
        '<div style="margin-bottom:20px;">' +
          '<div style="font-size:0.68rem;font-family:var(--font-display);text-transform:uppercase;' +
          'letter-spacing:0.08em;color:var(--text-muted);margin-bottom:8px;">Corpo principale</div>' +
          '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;">' +
            '<div style="display:flex;flex-wrap:wrap;gap:2px;padding:4px 8px;border-bottom:1px solid var(--border);background:var(--bg-secondary);">' +
            '<button class="nc-tb trama-tb" data-cmd="bold"><b>B</b></button>' +
            '<button class="nc-tb trama-tb" data-cmd="italic"><i>I</i></button>' +
            '<button class="nc-tb trama-tb" data-cmd="underline"><u>S</u></button>' +
            '<button class="nc-tb trama-tb" data-cmd="strikeThrough"><s>ab</s></button>' +
            '<div style="width:1px;background:var(--border);margin:2px 3px;"></div>' +
            '<button class="nc-tb trama-tb" data-cmd="h2">H2</button>' +
            '<button class="nc-tb trama-tb" data-cmd="h3">H3</button>' +
            '<button class="nc-tb trama-tb" data-cmd="ul">•</button>' +
            '<button class="nc-tb trama-tb" data-cmd="ol">1.</button>' +
            '</div>' +
            '<div id="trama-corpo" contenteditable="true" ' +
            'style="min-height:200px;padding:14px;font-size:0.88rem;line-height:1.8;outline:none;" ' +
            'data-placeholder="Corpo principale della trama — usa [[Link]], @Personaggio, #tag...">' + (t.corpo||'') + '</div>' +
          '</div>' +
        '</div>' +

        // Note
        '<div style="margin-bottom:20px;">' +
          '<div style="font-size:0.68rem;font-family:var(--font-display);text-transform:uppercase;' +
          'letter-spacing:0.08em;color:var(--text-muted);margin-bottom:8px;">Note</div>' +
          '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;">' +
            '<div id="trama-note" contenteditable="true" ' +
            'style="min-height:100px;padding:14px;font-size:0.85rem;line-height:1.7;outline:none;" ' +
            'data-placeholder="Note, idee, connessioni con altre trame...">' + (t.note||'') + '</div>' +
          '</div>' +
        '</div>' +

        // Salva
        '<div style="display:flex;gap:8px;">' +
          '<button class="btn btn-primary" onclick="Trame.saveCurrent()">Salva</button>' +
          '<button class="btn btn-ghost" onclick="Trame.closeDetail()">← Torna alla lista</button>' +
        '</div>' +
      '</div>';

    // Autosave
    const _autosave = () => setTimeout(() => Trame.saveCurrent(), 1500);
    // Event delegation toolbar
    document.querySelectorAll('.trama-tb').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var cmd = this.dataset.cmd;
        if (cmd === 'h2' || cmd === 'h3') wikiFB(cmd);
        else if (cmd === 'ul') wikiF('insertUnorderedList');
        else if (cmd === 'ol') wikiF('insertOrderedList');
        else wikiF(cmd);
      });
    });

    document.getElementById('trama-titolo')?.addEventListener('input', _autosave);
    document.getElementById('trama-categoria')?.addEventListener('change', _autosave);
    document.getElementById('trama-stato')?.addEventListener('change', _autosave);
    document.getElementById('trama-colore')?.addEventListener('change', _autosave);
    document.getElementById('trama-corpo')?.addEventListener('input', _autosave);
    document.getElementById('trama-note')?.addEventListener('input', _autosave);
  };

  // ── Salva trama corrente ──
  const saveCurrent = () => {
    if (!_currentId) return;
    const trame = _getData();
    const t = trame.find(function(x) { return x.id === _currentId; });
    if (!t) return;
    t.titolo    = document.getElementById('trama-titolo')?.value?.trim() || t.titolo;
    t.categoria = document.getElementById('trama-categoria')?.value || t.categoria;
    t.stato     = document.getElementById('trama-stato')?.value || t.stato;
    t.colore    = document.getElementById('trama-colore')?.value || t.colore;
    t.corpo     = document.getElementById('trama-corpo')?.innerHTML || t.corpo;
    t.note      = document.getElementById('trama-note')?.innerHTML || t.note;
    _save(trame);
  };

  // ── Torna alla lista ──
  const closeDetail = () => {
    if (_currentId) saveCurrent();
    _currentId = null;
    const list   = document.getElementById('trame-list');
    const detail = document.getElementById('trame-detail');
    if (list)   list.style.display   = '';
    if (detail) detail.style.display = 'none';
    renderList();
  };

  // ── Render entry point ──
  const render = () => renderList();

  return { newTrama, deleteTrama, openTrama, saveCurrent, closeDetail, render, renderList };
})();

const renderDashboard = () => {
  const camp = App.getActiveCampaign();
  if (!camp) return;
  const sessLog = camp.sessioni_log || [];
  const ultima = sessLog.slice().sort(function(a,b){ return (b.numero||0)-(a.numero||0); })[0];

  var dashUlt = document.getElementById('dash-ultima-sessione');
  if (dashUlt) {
    if (ultima) {
      var sc2 = ultima.stato==='giocata'?'#69cc85':ultima.stato==='in_corso'?'#f5a623':'#5ba4f5';
      var sl = ultima.stato==='giocata'?'Giocata':ultima.stato==='in_corso'?'In corso':'Pianificata';
      dashUlt.innerHTML =
        '<div style="margin-bottom:8px;"><span style="padding:2px 8px;background:'+sc2+'22;color:'+sc2+';border-radius:var(--radius-full);font-size:0.72rem;">'+sl+'</span>' +
        '<span style="font-family:var(--font-display);font-size:0.95rem;font-weight:600;margin-left:8px;">S'+(ultima.numero||'?')+(ultima.titolo?' — '+ultima.titolo:'')+'</span></div>' +
        (ultima.data?'<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">'+ultima.data+'</div>':'') +
        (ultima.recap?'<div style="font-size:0.82rem;line-height:1.6;color:var(--text-secondary);overflow:hidden;">'+ultima.recap+'</div>':'') +
        '<button class="btn btn-ghost btn-sm dash-sess-open" data-id="'+ultima.id+'" style="margin-top:8px;font-size:0.72rem;">Apri scheda</button>';
      var sub = document.getElementById('dash-ultima-sess-sub');
      if (sub) sub.textContent = 'S'+(ultima.numero||'?')+(ultima.titolo?' — '+ultima.titolo:'')+(ultima.data?' · '+ultima.data:'');
    } else {
      dashUlt.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;">Nessuna sessione ancora.</div>';
    }
  }

  var dashGanci = document.getElementById('dash-ganci');
  if (dashGanci) dashGanci.innerHTML = (ultima&&ultima.ganci)
    ? '<div style="font-size:0.85rem;line-height:1.7;">'+ultima.ganci+'</div>'
    : '<div style="color:var(--text-muted);font-size:0.82rem;">Nessun gancio.</div>';

  var dashQuest = document.getElementById('dash-quest-attive');
  if (dashQuest) {
    var qA = (camp.quests||[]).filter(function(q){ return q.stato==='Attiva'||q.stato==='In sospeso'; });
    var SQ = { Attiva:'#e84393', 'In sospeso':'#f5a623', Completata:'#69cc85', Fallita:'#7a7068' };
    dashQuest.innerHTML = qA.length ? qA.map(function(q) {
      return '<div class="dash-q-item" data-id="'+q.id+'" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);cursor:pointer;">' +
        '<span style="width:6px;height:6px;border-radius:50%;background:'+(SQ[q.stato]||'#aaa')+';flex-shrink:0;"></span>' +
        '<span style="font-size:0.83rem;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(q.titolo||q.name||'Quest')+'</span>' +
        '<span style="font-size:0.68rem;color:var(--text-muted);">'+(q.tipo||'')+'</span></div>';
    }).join('') : '<div style="color:var(--text-muted);font-size:0.82rem;padding:8px 0;">Nessuna quest attiva.</div>';
  }

  var dashPng = document.getElementById('dash-png-recenti');
  if (dashPng) {
    var nIds = new Map();
    sessLog.slice().sort(function(a,b){return (b.numero||0)-(a.numero||0);}).slice(0,5).forEach(function(s){
      (s.npcs||[]).forEach(function(id){ if(!nIds.has(id)) nIds.set(id, s.numero||0); });
    });
    var rNpcs = Array.from(nIds.entries()).slice(0,6).map(function(e){
      var n=(camp.npcs||[]).find(function(x){return x.id===e[0];});
      return n?Object.assign({},n,{sessNum:e[1]}):null;
    }).filter(Boolean);
    dashPng.innerHTML = rNpcs.length ? rNpcs.map(function(n) {
      var img = n.immagine?'<img src="'+n.immagine+'" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">':'';
      return '<div class="dash-n-item" data-id="'+n.id+'" style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);cursor:pointer;">' +
        img+'<div style="flex:1;min-width:0;"><div style="font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(n.name||n.nome||'?')+'</div>' +
        '<div style="font-size:0.68rem;color:var(--text-muted);">'+(n.ruolo||n.job||'')+(n.sessNum?' S'+n.sessNum:'')+'</div></div></div>';
    }).join('') : '<div style="color:var(--text-muted);font-size:0.82rem;">Nessun PNG nelle sessioni recenti.</div>';
  }

  var dashTrame = document.getElementById('dash-trame');
  if (dashTrame) {
    var tA = (camp.trame||[]).filter(function(t){return t.stato==='In corso';});
    dashTrame.innerHTML = tA.length ? tA.map(function(t) {
      return '<div class="dash-t-item" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);cursor:pointer;">' +
        '<div style="width:10px;height:10px;border-radius:50%;background:'+(t.colore||'#aaa')+';flex-shrink:0;"></div>' +
        '<div style="flex:1;min-width:0;"><div style="font-size:0.82rem;font-weight:600;">'+(t.titolo||'Trama')+'</div>' +
        '<div style="font-size:0.68rem;color:var(--text-muted);">'+(t.tipo||'')+'</div></div></div>';
    }).join('') : '<div style="color:var(--text-muted);font-size:0.82rem;">Nessuna trama in corso.</div>';
    document.querySelectorAll('.dash-t-item').forEach(function(el){el.addEventListener('click',function(){WikiSections.gotoTrame();});});
  }

  document.querySelectorAll('.dash-q-item').forEach(function(el){el.addEventListener('click',function(){_openWikiCard('quest',this.dataset.id);});});
  document.querySelectorAll('.dash-n-item').forEach(function(el){el.addEventListener('click',function(){_openWikiCard('png',this.dataset.id);});});
  document.querySelectorAll('.dash-sess-open').forEach(function(el){el.addEventListener('click',function(){_openSessFromDash(this.dataset.id);});});

  var dashClocks = document.getElementById('dash-clocks-preview');
  if (dashClocks) {
    var clocks = camp.clocks || [];
    var activeClocks = clocks.filter(function(c){ return c.attivo !== false; });
    if (activeClocks.length) {
      dashClocks.innerHTML = activeClocks.map(function(c) {
        var pct = Math.round(((c.progresso||0) / (c.totale||8)) * 100);
        var filled = c.progresso || 0;
        var total  = c.totale || 8;
        var segs   = '';
        for (var s = 0; s < total; s++) {
          segs += '<div style="flex:1;height:8px;border-radius:2px;background:' + (s < filled ? (c.colore||'var(--accent-primary)') : 'var(--bg-tertiary)') + ';margin:0 1px;"></div>';
        }
        return '<div style="margin-bottom:10px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
            '<span style="font-size:0.8rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70%;">' + (c.nome||'Clock') + '</span>' +
            '<span style="font-size:0.72rem;color:var(--text-muted);">' + filled + '/' + total + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:1px;">' + segs + '</div>' +
        '</div>';
      }).join('');
    } else {
      dashClocks.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;">Nessun clock attivo.</div>';
    }
  }

  var dashNotes = document.getElementById('dash-recent-notes');
  if (dashNotes) {
    var wiki = camp.wiki || {};
    var allNotes = [];
    (wiki.lore||[]).forEach(function(n){ allNotes.push({tipo:'Lore', titolo:n.titolo||'', ts:n.aggiornatoAt||0, color:'#5ba4f5', id:n.id}); });
    (wiki.sessioni||[]).forEach(function(n){ allNotes.push({tipo:'Sessione', titolo:n.titolo||'', ts:n.aggiornatoAt||0, color:'#ff9f43', id:n.id}); });
    (camp.quests||[]).forEach(function(q){ allNotes.push({tipo:'Quest', titolo:q.titolo||q.name||'', ts:q.aggiornatoAt||0, color:'#e84393', id:q.id}); });
    allNotes.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
    var recent = allNotes.slice(0,6);
    if (recent.length) {
      dashNotes.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
        recent.map(function(n) {
          return '<div class="dash-note-item" data-tipo="' + n.tipo.toLowerCase() + '" data-id="' + n.id + '" ' +
            'style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg-secondary);border:1px solid var(--border);border-left:3px solid ' + n.color + ';border-radius:var(--radius-md);cursor:pointer;min-width:140px;flex:1;">' +
            '<div style="min-width:0;">' +
              '<div style="font-size:0.68rem;color:' + n.color + ';text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">' + n.tipo + '</div>' +
              '<div style="font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (n.titolo||'Senza titolo') + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
      document.querySelectorAll('.dash-note-item').forEach(function(el) {
        el.addEventListener('click', function() {
          var tipo = this.dataset.tipo;
          var id   = this.dataset.id;
          if (tipo === 'quest') _openWikiCard('quest', id);
          else if (tipo === 'sessione') _openWikiCard('sessioni', id);
          else _openWikiCard('lore', id);
        });
      });
    } else {
      dashNotes.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;">Nessuna nota wiki ancora.</div>';
    }
  }
};

WikiSections._addCustomField = function(type) {
  if (!WikiSections._currentItem) return;
  var item = WikiSections._currentItem;
  if (!item.campi_custom) item.campi_custom = [];
  item.campi_custom.push({ chiave: '', tipo: 'testo', valore: '' });

  var detailEl = document.getElementById('wiki-' + type + '-detail');
  if (detailEl) {
    var cfg = WikiSections._getCfg(type);
    if (cfg) detailEl.innerHTML = WikiSections._renderDetailPub(type, item, 'edit');
    WikiSections._reattachEditListeners(type);
  }
};

WikiSections._removeCustomField = function(type, fi) {
  if (!WikiSections._currentItem) return;
  var item = WikiSections._currentItem;
  if (!item.campi_custom) return;
  item.campi_custom.splice(fi, 1);
  var detailEl = document.getElementById('wiki-' + type + '-detail');
  if (detailEl) {
    detailEl.innerHTML = WikiSections._renderDetailPub(type, item, 'edit');
    WikiSections._reattachEditListeners(type);
  }
};

WikiSections._saveCustomFields = function(type) {
  if (!WikiSections._currentItem) return;
  var item = WikiSections._currentItem;
  var keys = document.querySelectorAll('.ws-custom-key');
  var tipos = document.querySelectorAll('.ws-custom-tipo');
  var vals = document.querySelectorAll('.ws-custom-val');
  if (!keys.length) return;
  var custom = [];
  for (var i = 0; i < keys.length; i++) {
    var chiave = keys[i].value.trim();
    var tipo   = tipos[i] ? tipos[i].value : 'testo';
    var valore = vals[i] ? vals[i].value : '';
    if (chiave) custom.push({ chiave: chiave, tipo: tipo, valore: valore });
  }
  item.campi_custom = custom;
};

WikiSections._reattachEditListeners = function(type) {
  var editor = document.getElementById('ws-editor-free');
  if (editor && WikiSections._currentItem) {
    editor.addEventListener('input', function() {
      WikiSections._currentItem.note = editor.innerHTML;
      WikiSections._scheduleAutosavePub(type);
    });
  }

  var cfg = WikiSections._getCfg(type);
  var detailEl = document.getElementById('wiki-' + type + '-detail');
  if (cfg && cfg.fields && detailEl) {
    cfg.fields.forEach(function(f) {
      if (f.type === 'mention' || f.type === 'mentions') {
        var inp = detailEl.querySelector('#wsf-' + f.key);
        if (inp) MentionPicker.attachToInput(inp);
      }
    });
  }
};

const _renderLuoghiTree = () => {
  const camp = App.getActiveCampaign();
  if (!camp) return;
  const luoghi = (camp.locations || []).map(l => ({
    id: l.id, nome: l.nome || l.name || '',
    tipo: l.tipo || '',
    regione: l.regione || l.parent || '',
    immagine: l.immagine || '',
  }));

  const tree = document.getElementById('wiki-luoghi-tree');
  if (!tree) return;

  const byParent = {};
  const roots = [];
  luoghi.forEach(l => {
    const parent = l.regione || '';
    if (!byParent[parent]) byParent[parent] = [];
    byParent[parent].push(l);
  });

  const allNomi = new Set(luoghi.map(l => l.nome));
  luoghi.forEach(l => {
    if (!l.regione || !allNomi.has(l.regione)) roots.push(l);
  });

  const renderNode = (l, depth) => {
    const children = byParent[l.nome] || [];
    const indent = depth * 20;
    const tipoColors = {
      Regione:'#f5a623', Continente:'#c97bea', Citta:'#69cc85',
      Citta:'#69cc85', Dungeon:'#ff6b6b', Taverna:'#56d4dd',
      Negozio:'#56d4dd', Fortezza:'#ff9f43', Villaggio:'#69cc85',
    };
    const color = tipoColors[l.tipo] || 'var(--accent-primary)';
    let html2 = '<div style="padding:6px 8px 6px ' + (indent+8) + 'px;display:flex;align-items:center;gap:8px;' +
      'border-left:' + (depth>0?'2px solid var(--border)':'none') + ';' +
      'margin-left:' + (depth>0?'20px':'0') + ';' +
      'cursor:pointer;border-radius:var(--radius-sm);" ' +
      'class="luoghi-tree-node" data-id="' + l.id + '" ' +
      'class="luoghi-tree-node" data-id="' + l.id + '" style="' +
      'padding:6px 8px 6px ' + (indent+8) + 'px;display:flex;align-items:center;gap:8px;border-left:' + (depth>0?'2px solid var(--border)':'none') + ';margin-left:' + (depth>0?'20px':'0') + ';cursor:pointer;border-radius:var(--radius-sm);">' +
      (children.length ? '<span style="font-size:0.7rem;color:var(--text-muted);width:12px;">▶</span>' : '<span style="width:12px;"></span>') +
      (l.immagine ? '<img src="' + l.immagine + '" style="width:20px;height:20px;border-radius:50%;object-fit:cover;">' : '') +
      '<span style="font-size:0.7rem;padding:1px 6px;background:' + color + '22;color:' + color + ';border-radius:var(--radius-full);">' + (l.tipo||'Luogo') + '</span>' +
      '<span style="font-size:0.88rem;">' + l.nome + '</span>' +
      '</div>';
    children.forEach(function(child) { html2 += renderNode(child, depth+1); });
    return html2;
  };

  let treeHtml = '<div style="padding:8px;">';
  if (!roots.length) {
    treeHtml += '<div style="color:var(--text-muted);font-size:0.85rem;padding:16px;">Nessun luogo. Aggiungili e usa il campo @Regione per creare la gerarchia.</div>';
  } else {
    roots.forEach(function(r) { treeHtml += renderNode(r, 0); });
  }
  treeHtml += '</div>';
  tree.innerHTML = treeHtml;

  tree.querySelectorAll('.luoghi-tree-node').forEach(function(el) {
    el.addEventListener('click', function() {
      _openWikiCard('luoghi', this.dataset.id);
    });
  });
};

/* ── INIT ── */

const MonsterCache = (() => {
  let _monsters = [];
  let _loaded = false;
  let _loading = false;

  const load = async () => {
    if (_loaded || _loading) return;
    _loading = true;
    try {
      const camp = App.getActiveCampaign();
      const sistema = camp?.system === '5e2014' ? '5e2014' : '5e2024';
      const file = sistema === '5e2014' ? 'srd_5_1_monsters.json' : 'srd_5_2_1_monsters.json';
      const r = await fetch('data/' + file);
      if (r.ok) {
        _monsters = await r.json();
        _loaded = true;
        Debug.log('MonsterCache: ' + _monsters.length + ' mostri caricati (' + sistema + ')');
      }
    } catch(e) {
      Debug.warn('MonsterCache errore: ' + e.message);
    }
    _loading = false;
  };

  const search = (q) => {
    if (!q) return [];
    const n = q.toLowerCase();
    return _monsters.filter(m => m.nome.toLowerCase().includes(n)).slice(0, 15);
  };

  const get = (id) => _monsters.find(m => m.id === id) || null;
  const getAll = () => _monsters;
  const isLoaded = () => _loaded;

  return { load, search, get, getAll, isLoaded };
})();

const CompendioCache = (() => {

  const openItem = async (nome) => {
    const n = nome.toLowerCase().trim();

    const campSistema = App.getActiveCampaign()?.system || '5e2024';
    const selEl = document.getElementById('comp-sistema-select');
    if (selEl && selEl.value !== campSistema) {
      selEl.value = campSistema;
      Compendio.changeSistema(campSistema);

      await new Promise(r => setTimeout(r, 1500));
    }

    const data = Compendio.getData();

    if (data.magic_items.length === 0 && data.equipment.length === 0) {
      Toast.show('Caricamento compendio...', 'info', 2000);
      Compendio.init();
      await new Promise(r => setTimeout(r, 2000));
    }

    const data2 = Compendio.getData();
    const n2 = n;

    let found = data2.magic_items.find(x => x.nome?.toLowerCase().includes(n2) || n2.includes(x.nome?.toLowerCase().trim()));
    if (found) { Compendio.openMagicItem(found.id); return; }

    found = data2.equipment.find(x => x.nome?.toLowerCase().includes(n2) || n2.includes(x.nome?.toLowerCase().trim()));
    if (found) { Compendio.openEquipment(found.id); return; }

    Toast.show(`"${nome}" non trovato nel Compendio`, 'info');
    Debug.log(`CompendioCache miss: "${nome}" (sistema: ${campSistema}, mi:${data2.magic_items.length}, eq:${data2.equipment.length})`);
  };

  const findItem = (nome) => {
    const data = Compendio.getData();
    const n = nome?.toLowerCase().trim();
    return data.magic_items.find(x => x.nome?.toLowerCase().includes(n)) ||
           data.equipment.find(x => x.nome?.toLowerCase().includes(n)) || null;
  };

  return { openItem, findItem, load: () => Compendio.init() };
})();

const apriFavoritoSchermo = async (tipo, id) => {

  if (!Compendio.getData()[tipo]?.length) {
    Toast.show('Caricamento...', 'info', 1500);
    await new Promise(r => setTimeout(r, 1600));
    Compendio.init();
    await new Promise(r => setTimeout(r, 1500));
  }
  const fn = {
    monsters: 'openMonster', magic_items: 'openMagicItem',
    equipment: 'openEquipment', rules: 'openRule', spells: 'openSpell',
  }[tipo];
  if (fn && Compendio[fn]) Compendio[fn](id);
};

const EncounterBuilder = (() => {

  const XP_SOGLIE = {
    1:  {facile:25,   media:50,   difficile:75,   mortale:100},
    2:  {facile:50,   media:100,  difficile:150,  mortale:200},
    3:  {facile:75,   media:150,  difficile:225,  mortale:400},
    4:  {facile:125,  media:250,  difficile:375,  mortale:500},
    5:  {facile:250,  media:500,  difficile:750,  mortale:1100},
    6:  {facile:300,  media:600,  difficile:900,  mortale:1400},
    7:  {facile:350,  media:750,  difficile:1100, mortale:1700},
    8:  {facile:450,  media:900,  difficile:1400, mortale:2100},
    9:  {facile:550,  media:1100, difficile:1600, mortale:2400},
    10: {facile:600,  media:1200, difficile:1900, mortale:2800},
    11: {facile:800,  media:1600, difficile:2400, mortale:3600},
    12: {facile:1000, media:2000, difficile:3000, mortale:4500},
    13: {facile:1100, media:2200, difficile:3400, mortale:5100},
    14: {facile:1250, media:2500, difficile:3800, mortale:5700},
    15: {facile:1400, media:2800, difficile:4300, mortale:6400},
    16: {facile:1600, media:3200, difficile:4800, mortale:7200},
    17: {facile:2000, media:3900, difficile:5900, mortale:8800},
    18: {facile:2100, media:4200, difficile:6300, mortale:9500},
    19: {facile:2400, media:4900, difficile:7300, mortale:10900},
    20: {facile:2800, media:5700, difficile:8500, mortale:12700},
  };

  const XP_PER_CR = {
    '0':10,'1/8':25,'1/4':50,'1/2':100,
    '1':200,'2':450,'3':700,'4':1100,'5':1800,
    '6':2300,'7':2900,'8':3900,'9':5000,'10':5900,
    '11':7200,'12':8400,'13':10000,'14':11500,'15':13000,
    '16':15000,'17':18000,'18':20000,'19':22000,'20':25000,
    '21':33000,'22':41000,'23':50000,'24':62000,
    '25':75000,'26':90000,'27':105000,'28':120000,'29':135000,'30':155000,
  };

  const _moltiplicatore = (n) => {
    if (n === 1) return 1;
    if (n === 2) return 1.5;
    if (n <= 6) return 2;
    if (n <= 10) return 2.5;
    if (n <= 14) return 3;
    return 4;
  };

  const _crAdatti = (livello, difficolta) => {
    const maxCR = {
      facile:   Math.max(1, Math.floor(livello / 4)),
      media:    Math.max(1, Math.floor(livello / 2)),
      difficile:Math.max(1, livello - 2),
      mortale:  livello,
    }[difficolta] || Math.floor(livello / 2);

    const minCR = Math.max(0, maxCR - 4);

    return Object.keys(XP_PER_CR).filter(cr => {
      const val = cr.includes('/') ? eval(cr) : parseFloat(cr);
      return val >= (minCR === 0 ? 0 : minCR - 0.5) && val <= maxCR;
    });
  };

  const CATS = [
    { id:'humanoid-warrior',    nome:'Umanoidi — Guerriero',    emoji:'⚔️',  tipi:['umanoide','goblinoide','orco','umano'] },
    { id:'humanoid-caster',     nome:'Umanoidi — Incantatore',  emoji:'🧙',  tipi:['umanoide'] },
    { id:'humanoid-rogue',      nome:'Umanoidi — Ladro/Ranger', emoji:'🏹',  tipi:['umanoide'] },
    { id:'beasts',              nome:'Bestie',                  emoji:'🐺',  tipi:['bestia'] },
    { id:'undead-physical',     nome:'Non Morti — Fisico',      emoji:'💀',  tipi:['non morto'] },
    { id:'undead-incorporeal',  nome:'Non Morti — Incorporeo',  emoji:'👻',  tipi:['non morto'] },
    { id:'demons',              nome:'Demoni',                  emoji:'😈',  tipi:['demone','aberrazione'] },
    { id:'devils',              nome:'Diavoli',                 emoji:'🔱',  tipi:['diavolo'] },
    { id:'dragons',             nome:'Draghi',                  emoji:'🐉',  tipi:['drago'] },
    { id:'constructs',          nome:'Costrutti',               emoji:'🤖',  tipi:['costrutto'] },
    { id:'aberrations',         nome:'Aberrazioni',             emoji:'🦑',  tipi:['aberrazione'] },
    { id:'fey-benevolent',      nome:'Fate Benevole',           emoji:'🧚',  tipi:['folletto','fata'] },
    { id:'fey-malevolent',      nome:'Fate Malvagie',           emoji:'🧟',  tipi:['folletto','fata'] },
    { id:'giants',              nome:'Giganti',                 emoji:'🗿',  tipi:['gigante'] },
    { id:'oozes',               nome:'Melme & Ooze',            emoji:'🟢',  tipi:['melma'] },
    { id:'plants',              nome:'Piante',                  emoji:'🌿',  tipi:['pianta'] },
    { id:'elemental-fire',      nome:'Elementali — Fuoco',      emoji:'🔥',  tipi:['elementale'] },
    { id:'elemental-water',     nome:'Elementali — Acqua',      emoji:'💧',  tipi:['elementale'] },
    { id:'elemental-earth',     nome:'Elementali — Terra',      emoji:'⛰️',  tipi:['elementale'] },
    { id:'elemental-air',       nome:'Elementali — Aria',       emoji:'🌪️',  tipi:['elementale'] },
    { id:'celestials',          nome:'Celestiali',              emoji:'✨',  tipi:['celestiale'] },
  ];

  const LOOT_TABLES = /* inserito dopo */ null;

  const PROB_STANDARD = [
    { rarity:'Niente',    minion:[1,40],  elite:[1,20],  boss:null },
    { rarity:'Comune',    minion:[41,75], elite:[21,50], boss:[1,20] },
    { rarity:'Non Comune',minion:[76,90], elite:[51,80], boss:[21,55] },
    { rarity:'Raro',      minion:[91,98], elite:[81,95], boss:[56,85] },
    { rarity:'Epico',     minion:[99,100],elite:[96,99], boss:[86,97] },
    { rarity:'Leggendario',minion:null,   elite:[100,100],boss:[98,100]},
  ];

  const _rollD = (sides) => Math.floor(Math.random() * sides) + 1;
  const _rnd = (a) => a[Math.floor(Math.random() * a.length)];

  const _rangoNemico = (nome, isLast) => {
    const n = nome.toLowerCase();
    if (isLast) return 'Boss';
    if (n.includes('capo') || n.includes('leader') || n.includes('signore') || n.includes('capitano')) return 'Elite';
    return 'Minion';
  };

  const _rollLootItem = (rango, catId) => {
    const d100 = _rollD(100);
    const table = PROB_STANDARD;
    let rarita = 'Niente';
    const key = rango === 'Boss' ? 'boss' : rango === 'Elite' ? 'elite' : 'minion';

    for (const row of table) {
      const range = row[key];
      if (!range) continue;
      if (d100 >= range[0] && d100 <= range[1]) { rarita = row.rarity; break; }
    }

    let luckyUpgrade = false;
    if ((d100 === 75 || d100 === 90) && rarita !== 'Niente' && rarita !== 'Leggendario') {
      if (_rollD(4) > 2) {
        const up = { 'Comune':'Non Comune','Non Comune':'Raro','Raro':'Epico','Epico':'Leggendario' };
        if (up[rarita]) { rarita = up[rarita]; luckyUpgrade = true; }
      }
    }

    return { d100, rarita, luckyUpgrade, rango };
  };

  const LOOT_GENERICI = {
    'Comune':     ['Pozione di Guarigione', '1d6×10 mo', 'Gemma grezza (10 mo)', 'Componenti magici comuni', 'Olio magico'],
    'Non Comune': ['Pozione di Guarigione Superiore', 'Pergamena incantesimo (1°-2° lv)', 'Anello di Protezione', '2d6×25 mo + gemme', 'Mantello della Protezione'],
    'Raro':       ['Pozione di Guarigione Suprema', 'Arma +1', 'Scudo +1', 'Pergamena (3°-4° lv)', 'Stivali di Elven Kind'],
    'Epico':      ['Arma +2', 'Armatura +1', 'Mantello di Spostamento', 'Pergamena (5°-6° lv)', 'Anello di Resistenza'],
    'Leggendario':['Arma +3', 'Armatura +2', 'Mantello dell\'Invisibilità', 'Pergamena (7°-9° lv)', 'Anello dei Tre Desideri'],
  };

  let _ultimoEncounter = null;

  const init = () => {
    const el = document.getElementById('enc-categorie');
    if (!el || el.children.length > 0) return;
    el.innerHTML = CATS.map(c =>
      `<label style="display:flex;align-items:center;gap:4px;cursor:pointer;padding:3px 8px;border-radius:var(--radius-sm);background:var(--bg-secondary);font-size:0.75rem;border:1px solid var(--border);">
        <input type="checkbox" data-enc-cat="${c.id}"> ${c.emoji} ${c.nome}
      </label>`
    ).join('');
  };

  const genera = async () => {
    const livello   = parseInt(document.getElementById('enc-livello')?.value) || 5;
    const difficolta= document.getElementById('enc-difficolta')?.value || 'media';
    const nPG       = parseInt(document.getElementById('enc-npg')?.value) || 4;
    const el        = document.getElementById('enc-result');
    const lootSec   = document.getElementById('enc-loot-section');
    if (!el) return;

    const catChecks = document.querySelectorAll('[data-enc-cat]:checked');
    const catIds    = [...catChecks].map(c => c.dataset.encCat);
    if (!catIds.length) {
      Toast.show('Seleziona almeno una categoria', 'warning'); return;
    }

    const sogliaPerPG = XP_SOGLIE[livello]?.[difficolta] || 500;
    const budgetTotale= sogliaPerPG * nPG;

    const crAdatti = _crAdatti(livello, difficolta);
    if (!crAdatti.length) {
      el.innerHTML = '<div class="text-muted text-sm">Nessun CR adatto trovato.</div>'; return;
    }

    const dati = Compendio.getData();
    const monsters = [...(dati.monsters || [])];

    const catSelezionate = CATS.filter(c => catIds.includes(c.id));
    const tipiAccettati  = [...new Set(catSelezionate.flatMap(c => c.tipi))];

    const monstriValidi = monsters.filter(m => {
      const tipo = (m.tipo || '').toLowerCase();
      const cr   = m.grado_sfida?.valore;
      const crStr= cr != null ? (cr < 1 ? (cr === 0 ? '0' : cr === 0.125 ? '1/8' : cr === 0.25 ? '1/4' : '1/2') : String(Math.floor(cr))) : null;
      const tipoOk = tipiAccettati.some(t => tipo.includes(t));
      const crOk  = crStr && crAdatti.includes(crStr);
      return tipoOk && crOk;
    });

    const pool = monstriValidi.length >= 3 ? monstriValidi :
      monsters.filter(m => {
        const cr  = m.grado_sfida?.valore;
        const crStr = cr != null ? (cr < 1 ? (cr === 0 ? '0' : cr === 0.125 ? '1/8' : cr === 0.25 ? '1/4' : '1/2') : String(Math.floor(cr))) : null;
        return crStr && crAdatti.includes(crStr);
      });

    if (!pool.length) {
      el.innerHTML = '<div class="text-muted text-sm">Nessun mostro trovato per questi criteri. Prova a cambiare livello o categorie.</div>';
      return;
    }

    const encounter = [];
    let xpTotale = 0;
    let tentativi = 0;

    while (xpTotale < budgetTotale * 0.7 && tentativi < 50) {
      tentativi++;
      const m = _rnd(pool);
      const cr = m.grado_sfida?.valore ?? 1;
      const crStr = cr < 1 ? (cr === 0 ? '0' : cr === 0.125 ? '1/8' : cr === 0.25 ? '1/4' : '1/2') : String(Math.floor(cr));
      const xpMostro = XP_PER_CR[crStr] || 200;

      const nAttuali = encounter.reduce((s, e) => s + e.qty, 0) + 1;
      const mult = _moltiplicatore(nAttuali);
      const nuovoXP = encounter.reduce((s, e) => s + XP_PER_CR[e.cr] * e.qty, 0) + xpMostro;
      if (nuovoXP * mult > budgetTotale * 1.5) continue;

      const esistente = encounter.find(e => e.id === m.id);
      if (esistente) {
        esistente.qty++;
      } else {
        encounter.push({
          id: m.id, nome: m.nome || 'Mostro', cr: crStr,
          xp: xpMostro, qty: 1, hp: m.punti_ferita?.media || 10,
          ca: m.classe_armatura?.valore || m.classe_armatura || 12,
          catId: _rnd(catIds),
        });
      }

      xpTotale = encounter.reduce((s, e) => s + XP_PER_CR[e.cr] * e.qty, 0);
    }

    if (!encounter.length) {
      el.innerHTML = '<div class="text-muted text-sm">Non riesco a generare un encounter. Prova a variare i parametri.</div>';
      return;
    }

    const nMostri = encounter.reduce((s, e) => s + e.qty, 0);
    const mult    = _moltiplicatore(nMostri);
    const xpAdj   = Math.round(xpTotale * mult);
    const diffLabel = { facile:'🟢 Facile', media:'🟡 Media', difficile:'🟠 Difficile', mortale:'🔴 Mortale' }[difficolta];

    _ultimoEncounter = encounter;

    el.innerHTML =
      `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <span class="badge badge-muted">${diffLabel}</span>
        <span class="badge badge-muted">Liv. ${livello} · ${nPG} PG</span>
        <span class="badge badge-muted">Budget: ${budgetTotale} XP</span>
        <span class="badge badge-muted">XP encounter: ${xpAdj}</span>
      </div>` +
      `<table style="width:100%;border-collapse:collapse;font-size:0.82rem;margin-bottom:10px;">
        <thead><tr>
          <th style="text-align:left;padding:4px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.65rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">Mostro</th>
          <th style="text-align:center;padding:4px 4px;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.65rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">N.</th>
          <th style="text-align:center;padding:4px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.65rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">CR</th>
          <th style="text-align:center;padding:4px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.65rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">PF</th>
          <th style="text-align:center;padding:4px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.65rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">CA</th>
          <th style="text-align:right;padding:4px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.65rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">XP</th>
        </tr></thead>
        <tbody>` +
      encounter.map(e =>
        `<tr>
          <td style="padding:4px 0;border-bottom:1px solid var(--border);">${e.nome}</td>
          <td style="padding:4px 4px;border-bottom:1px solid var(--border);text-align:center;font-family:var(--font-mono);">×${e.qty}</td>
          <td style="padding:4px 0;border-bottom:1px solid var(--border);text-align:center;font-family:var(--font-mono);color:var(--text-muted);">GS ${e.cr}</td>
          <td style="padding:4px 0;border-bottom:1px solid var(--border);text-align:center;font-family:var(--font-mono);">${e.hp}</td>
          <td style="padding:4px 0;border-bottom:1px solid var(--border);text-align:center;font-family:var(--font-mono);">${e.ca}</td>
          <td style="padding:4px 0;border-bottom:1px solid var(--border);text-align:right;font-family:var(--font-mono);color:var(--accent-secondary);">${XP_PER_CR[e.cr] * e.qty}</td>
        </tr>`
      ).join('') +
      `</tbody></table>` +
      `<div style="display:flex;gap:6px;">
        <button class="btn btn-primary btn-sm" onclick="EncounterBuilder.aggiungiAlCombat()">⚔️ Aggiungi al Combat Tracker</button>
        <button class="btn btn-secondary btn-sm" onclick="EncounterBuilder.genera()">🎲 Rigenera</button>
      </div>`;

    if (lootSec) lootSec.style.display = '';
    Debug.log('Encounter generato: ' + encounter.map(e => e.qty + '× ' + e.nome).join(', '));
  };

  const aggiungiAlCombat = () => {
    if (!_ultimoEncounter?.length) return;
    const camp = App.getActiveCampaign();
    if (!camp) { Toast.show('Apri una campagna prima', 'warning'); return; }

    let aggiunti = 0;
    _ultimoEncounter.forEach(entry => {
      for (let i = 0; i < entry.qty; i++) {
        const nome = entry.qty > 1 ? `${entry.nome} #${i+1}` : entry.nome;
        const bonusInit = 0;
        Sessione.addMonsterDirect({
          nome, tipo:'mostro',
          hp: entry.hp, maxHp: entry.hp, ca: entry.ca,
          iniziativaBonus: bonusInit,
        });
        aggiunti++;
      }
    });

    App.navigateTo('sessione');
    Toast.show(`${aggiunti} nemici aggiunti al Combat Tracker!`, 'success', 3000);
  };

  const generaLoot = () => {
    const el = document.getElementById('enc-loot-result');
    if (!el || !_ultimoEncounter?.length) return;
    const stato = document.getElementById('enc-loot-stato')?.value || 'intatto';
    const statoLabel = { intatto:'✓ Intatto', danneggiato:'⚠ Danneggiato', inutilizzabile:'✗ Inutilizzabile', maledetto:'☠ Maledetto' }[stato] || '';

    const risultati = [];
    _ultimoEncounter.forEach((entry, idx) => {
      const isLast = idx === _ultimoEncounter.length - 1;
      for (let i = 0; i < entry.qty; i++) {
        const nome = entry.qty > 1 ? `${entry.nome} #${i+1}` : entry.nome;
        const rango = _rangoNemico(nome, isLast && i === entry.qty - 1);
        const roll = _rollLootItem(rango, entry.catId);

        if (roll.rarita === 'Niente') {
          risultati.push({ nome, rango, rarita: 'Niente', item: '—' });
        } else {
          const itemsPool = LOOT_GENERICI[roll.rarita] || [];
          const item = itemsPool[Math.floor(Math.random() * itemsPool.length)] || roll.rarita;
          const itemLabel = stato !== 'intatto' ? `${item} (${statoLabel})` : item;
          risultati.push({ nome, rango, rarita: roll.rarita, item: itemLabel, lucky: roll.luckyUpgrade });
        }
      }
    });

    const coloreRarita = {
      'Niente':'var(--text-muted)', 'Comune':'var(--text-secondary)',
      'Non Comune':'#69cc85', 'Raro':'#5ba4f5', 'Epico':'#c97bea', 'Leggendario':'#f5a623',
    };

    el.innerHTML =
      `<table style="width:100%;border-collapse:collapse;font-size:0.78rem;">
        <thead><tr>
          <th style="text-align:left;padding:3px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">Nemico</th>
          <th style="text-align:center;padding:3px 4px;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">Rango</th>
          <th style="text-align:left;padding:3px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">Loot</th>
        </tr></thead>
        <tbody>` +
      risultati.map(r =>
        `<tr>
          <td style="padding:3px 0;border-bottom:1px solid var(--border);">${r.nome}</td>
          <td style="padding:3px 4px;border-bottom:1px solid var(--border);text-align:center;font-size:0.7rem;color:var(--text-muted);">${r.rango}</td>
          <td style="padding:3px 0;border-bottom:1px solid var(--border);color:${coloreRarita[r.rarita] || 'inherit'};">
            ${r.item}${r.lucky ? ' ✨' : ''}
          </td>
        </tr>`
      ).join('') +
      `</tbody></table>`;

    Debug.log('Loot generato per encounter');
  };

  return { init, genera, aggiungiAlCombat, generaLoot, CATS };
})();

const DescrizioneGen = (() => {

  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const rndN = (a, n) => {
    const copy = [...a].sort(() => Math.random() - 0.5);
    return copy.slice(0, n);
  };

  const NOMI = {
    taverna: {
      squallido: ['La Bettola del Topo','Il Cinghiale Pelato','La Fogna Allegra','Il Secchio Bucato','L\'Orso Puzzolente','La Carcassa Ubriaca','Il Lurido Calice','La Muffa Dorata'],
      normale:   ['La Locanda del Viandante','Il Cavallo Stanco','La Luna Mezza','Il Cervo Rosso','L\'Ancora e la Brocca','Il Falco Grigio','La Stella Cadente','Il Cinghiale Sano'],
      lusso:     ['La Dimora del Cigno d\'Argento','Il Palazzo delle Maree','La Corona Dorata','L\'Olimpo dei Viaggiatori','La Villa del Drago Addormentato','Il Nettare degli Dei','La Residenza Imperiale','Il Calice di Platino'],
    },
    bottega: {
      squallido: ['Rigattiere di Quarta Mano','Merci Dubbie di Varno','Lo Scantinato del Mercante','Cianfrusaglie e Rifiuti','Il Bazar del Lerciume','Merce Usata - Non Chiedere'],
      normale:   ['Bottega del Fabbro','Emporio delle Spezie','La Merceria','Forniture dell\'Avventuriero','Il Negozio di Urist','Commercio e Baratto'],
      lusso:     ['La Gioielleria della Corona','Emporio delle Rarità Esotiche','Il Mercante di Oggetti Magici','La Boutique Arcana','Preziosi e Manufatti d\'Arte','Il Collezionista Raffinato'],
    },
    strada: {
      squallido: ['Vicolo del Pericolo','Budello dei Mendicanti','Strada dei Rifiuti','Il Corridoio Buio','Viuzza delle Ombre','Traversa Malfamata'],
      normale:   ['Via del Mercante','Strada Principale','Corso delle Botteghe','Via del Porto','Viale della Fiera','Strada Rotabile'],
      lusso:     ['Viale dei Nobili','Corso della Corona','Via dei Palazzi','Promenade Dorata','Boulevard delle Fontane','Viale del Giardino Reale'],
    },
    quartiere: {
      squallido: ['Il Ghetto','I Bassifondi','Il Quartiere dei Reietti','La Fogna della Città','Il Ventre Marcio','Zona delle Baracche'],
      normale:   ['Il Quartiere dei Mercanti','Il Distretto Artigiano','La Zona Residenziale','Il Quartiere del Porto','Il Rione dei Lavoratori','Il Settore Civile'],
      lusso:     ['Il Quartiere Nobile','Il Distretto della Corona','Il Rione dei Signori','La Zona delle Ville','Il Quartiere delle Ambasciate','Il Settore Imperiale'],
    },
    dungeon: {
      squallido: ['Le Fogne Dimenticate','Il Tugurio Sotterraneo','Le Catacombe Abbandonate','La Tana dei Rifiuti','Il Budello Marcio','Le Rovine Allagate'],
      normale:   ['Le Tombe Antiche','Il Dungeon del Castello','Le Cripte dei Caduti','Il Labirinto di Pietra','Le Sale dei Guardiani','Il Sotterraneo di Guardia'],
      lusso:     ['Il Palazzo Sotterraneo','Le Camere del Re Sepolto','Il Santuario Nascosto','La Volta dei Tesori','Le Sale del Trono Perduto','Il Mausoleo Imperiale'],
    },
    foresta: {
      squallido: ['Il Bosco Malato','La Palude Boscosa','Il Sottobosco Marcio','La Foresta dei Sussurri Oscuri','Il Bosco Infestato','La Selva dei Perduti'],
      normale:   ['La Foresta di Quercia','Il Bosco dei Cacciatori','La Selva Verde','Il Bosco dei Cervi','La Foresta Antica','Il Bosco del Confine'],
      lusso:     ['Il Bosco Incantato','La Foresta degli Elfi','Il Giardino Eterno','La Selva d\'Argento','Il Bosco del Re','La Foresta delle Fate'],
    },
    tempio: {
      squallido: ['La Cappella Abbandonata','Il Santuario Diroccato','L\'Altare Profanato','La Cappella dei Reietti','Il Tempietto Maledetto','L\'Oratorio in Rovina'],
      normale:   ['Il Tempio di Pelor','La Chiesa del Villaggio','Il Santuario della Luce','La Cappella dei Pellegrini','Il Tempio degli Antenati','La Casa della Preghiera'],
      lusso:     ['La Grande Cattedrale','Il Tempio d\'Oro','Il Santuario Imperiale','La Basilica della Speranza','Il Duomo della Corona','Il Tempio dei Mille Dei'],
    },
    castello: {
      squallido: ['La Torre Diroccata','Il Forte Abbandonato','Le Rovine del Castello','Il Fortilizio Fatiscente','La Fortezza Dimenticata','Il Castello in Rovina'],
      normale:   ['Il Castello del Signore','La Fortezza di Confine','Il Forte Militare','La Rocca del Guardiano','Il Castello di Pietra','La Torre di Guardia'],
      lusso:     ['Il Palazzo Reale','La Fortezza della Corona','Il Gran Castello','Il Bastione Imperiale','Il Castello delle Cento Torri','La Reggia d\'Oro'],
    },
    porto: {
      squallido: ['Il Molo Marcio','Il Porto dei Contrabbandieri','La Banchina dei Naufraghi','Il Molo Abbandonato','Il Porto Malfamato','La Banchina Lercia'],
      normale:   ['Il Porto del Pescatore','La Banchina dei Mercanti','Il Molo delle Barche','Il Porto Commerciale','La Banchina del Re','Il Porto dei Viaggiatori'],
      lusso:     ['Il Porto Imperiale','La Marina Reale','Il Gran Bacino','Il Porto delle Navi d\'Oro','La Darsena di Platino','Il Porto delle Flotte'],
    },
    mercato: {
      squallido: ['Il Mercatino delle Pulci','Il Bazar dei Rifiuti','Il Mercato dei Ladri','La Fiera degli Scarti','Il Bazaruccio','Il Mercato Nero'],
      normale:   ['Il Mercato della Piazza','La Fiera del Villaggio','Il Bazar dei Mercanti','Il Mercato Settimanale','La Fiera dell\'Est','Il Mercato Coperto'],
      lusso:     ['Il Gran Bazar','La Fiera delle Rarità','Il Mercato d\'Oro','Il Bazaar Imperiale','La Grande Fiera della Corona','Il Mercato delle Meraviglie'],
    },
  };

  const DESC = {
    taverna: {
      squallido: {
        aspetto:    ['un locale buio e soffocante con travi marce','una stanza unica con il soffitto basso e annerito dal fumo','un ambiente angusto che puzza di muffa e birra acida','quattro mura scrostate con un pavimento di terra battuta'],
        odori:      ['birra rancida e vomito secco','fumo acre e sudore','muffa e cibo bruciato','sporcizia e umanità ammassata'],
        atmosfera:  ['i clienti si guardano storto e evitano il contatto visivo','un silenzio pesante rotto solo da qualche tosse','risse che scoppiano e finiscono nel giro di pochi secondi','borbottii e sussurri tra ubriachi'],
        dettagli:   ['un barista sdentato con uno sguardo vuoto','topie che corrono liberamente tra i tavoli','panche di legno marce che scricchiolano','un cane spelacchiato dorme accanto al fuoco spento'],
        cliente:    ['un mendicante che russa sul bancone','tre scaricatori di porto con le nocche sbucciate','un individuo incappucciato che non consuma nulla','una prostituta stanca che aspetta clienti'],
      },
      normale: {
        aspetto:    ['un locale accogliente con tavoli in legno robusto','una sala ampia illuminata da torce e un focolare centrale','un ambiente caldo con trofei di caccia alle pareti','un inn pulito e funzionale con odore di stufato'],
        odori:      ['pane appena sfornato e spezie','birra fresca e legno di quercia','stufato di verdure e fumo di pino','cera delle candele e foin di erbe aromatiche'],
        atmosfera:  ['chiacchiere e risate da ogni tavolo','un menestrello che suona in un angolo','mercanti che discutono affari a voce alta','viaggiatori stanchi che si godono un pasto caldo'],
        dettagli:   ['la barista serve con un sorriso stanco ma sincero','un menu scritto su una lavagna di ardesia','boccali di stagno appesi alle travi','un gatto arancione dorme sul bancone'],
        cliente:    ['un gruppo di avventurieri che confrontano cicatrici','un mercante che conta monete sotto il tavolo','un vecchio che fissa il fuoco stringendo il suo boccale','due guardie fuori servizio che ridono di qualcosa'],
      },
      lusso: {
        aspetto:    ['una sala elegante con arazzi colorati alle pareti','un locale su due piani con balconate in legno intagliato','un ambiente sontuoso con lampadari di cristallo','una sala raffinata con tavoli distanziati e tovaglie di lino'],
        odori:      ['vino pregiato e profumi esotici','carne arrosto e salse alle erbe fini','fiori freschi e candele alla vaniglia','spezie d\'oltre mare e pane al rosmarino'],
        atmosfera:  ['conversazioni sommesse e musica discreta','nobili che si ignorano con eleganza','servitori silenziosi che si muovono come ombre','un\'aria di esclusività che pesa come seta'],
        dettagli:   ['un maggiordomo che valuta ogni cliente con un\'occhiata','posate d\'argento e bicchieri di vetro soffiato','un fuoco nel caminetto ornato di sculture','fiori freschi in vasi di ceramica dipinta'],
        cliente:    ['un nobile in incognito con troppo oro','un mercante straniero che cerca accordi riservati','una coppia di ricchi che non si parlano','un diplomatico con la sua scorta discreta'],
      },
    },

    bottega: {
      squallido: {
        aspetto:    ['un buco nel muro con merci ammucchiate senza ordine','un banco di legno traballante con polvere ovunque','uno scantinato con scaffali piegati sotto il peso','una tenda rattoppata con oggetti appesi a fili'],
        odori:      ['muffa, olio vecchio e metallo arrugginito','grasso e polvere di anni','merce avariata e legno marcio','sudore e qualcosa di indefinibile e sgradevole'],
        atmosfera:  ['il venditore ti guarda come se stessi rubando','silenzio imbarazzante rotto dal cigolìo del legno','il mercante negozia ogni rame con ferocia','nessuno fa domande su come è arrivata la merce'],
        dettagli:   ['oggetti di dubbia provenienza senza etichetta','una bilancia chiaramente manomessa','il mercante nasconde qualcosa sotto il bancone','polvere così spessa che si vedono le impronte'],
        merce:      ['attrezzi arrugginiti ma funzionanti','vestiti usati di taglie sbagliate','cibo quasi scaduto a metà prezzo','oggetti di cui non si capisce lo scopo'],
      },
      normale: {
        aspetto:    ['un negozio ordinato con scaffali pieni','una bottega dall\'insegna colorata e leggibile','un locale pulito con merci disposte con cura','un emporio con vetrina e banco ben tenuto'],
        odori:      ['legno fresco e olio di manutenzione','spezie e tessuti nuovi','ferro lavorato e cuoio','carta e inchiostro'],
        atmosfera:  ['il venditore saluta con un cenno professionale','altri clienti valutano la merce tranquillamente','un apprendista sistema gli scaffali in fondo','scambi rapidi e onesti senza fronzoli'],
        dettagli:   ['listini prezzi scritti chiaramente','campioni di merce esposti sul bancone','un registro clienti tenuto bene','strumenti del mestiere esposti alle pareti'],
        merce:      ['attrezzi in buone condizioni con garanzia orale','forniture standard a prezzi ragionevoli','una piccola selezione di oggetti insoliti','componenti per incantesimi di base'],
      },
      lusso: {
        aspetto:    ['una boutique con vetrine illuminate e insegna dorata','un emporio elegante con merce esposta su cuscini di velluto','un negozio esclusivo che sembra un museo privato','una galleria commerciale con guardie discrete'],
        odori:      ['cedro e sandalo','profumo d\'oriente e cera pregiata','pelle conciata finemente e metalli rari','aria pulita filtrata da erbe aromatiche'],
        atmosfera:  ['il commesso ti valuta prima ancora di salutare','ogni oggetto ha una storia raccontata con orgoglio','la discrezione è parte del servizio','si compra con un cenno, si paga con una firma'],
        dettagli:   ['vetrine con serrature','oggetti con certificato di autenticità','il proprietario è in fondo e riceve solo su appuntamento','illuminazione a incantesimo che valorizza i colori'],
        merce:      ['oggetti magici di rarità provata','manufatti artistici di artigiani famosi','componenti per incantesimi rari e potenti','materie prime di qualità eccezionale'],
      },
    },

    strada: {
      squallido: {
        aspetto:    ['un vicolo stretto tra muri scrostati e umidi','un budello lastricato da ciottoli rotti e fango','una strada buia fiancheggiata da baracche di tavole','un corridoio tra edifici ammassati che toglie il sole'],
        odori:      ['fognature e immondizia','cibo andato a male e cenere','urina e fumo di carbone','muffa e acqua stagnante'],
        atmosfera:  ['occhi che ti seguono dalle finestre sbarrate','qualcuno scappa quando ti senti avvicinarti','un silenzio che fa scattare l\'istinto di sopravvivenza','nessuno sembra essere lì per caso'],
        dettagli:   ['graffiti incomprensibili sui muri','ratti che spariscono negli angoli','una porta sbarrata con troppe catene','panni stesi che nascondono le finestre'],
        persone:    ['mendicanti che non chiedono più nulla','bambini che ti osservano senza espressione','una figura incappucciata che si allontana in fretta','qualcuno che dorme in un angolo — o forse no'],
      },
      normale: {
        aspetto:    ['una via acciottolata larga quanto due carri','una strada trafficata con negozi ai lati','un corso lastricato con marciapiede rialzato','una via dritta con insegne che si dondolano al vento'],
        odori:      ['pane caldo e fumo di camino','spezie e merce dei mercanti','cavalli e paglia','pioggia su pietra calda'],
        atmosfera:  ['il traffico scorre con qualche intoppo','voci che si mescolano in un brusio vivo','venditori ambulanti che gridano la merce','la normalità caotica di una città che funziona'],
        dettagli:   ['lanterne sui pali che aspettano la sera','carri che scaricano davanti alle botteghe','una fontana pubblica circondata di gente','un crieur che annuncia le notizie del giorno'],
        persone:    ['famiglie con borse della spesa','artigiani che tornano dal lavoro','soldati di pattuglia senza fretta','un bambino che insegue un pollo fuggito'],
      },
      lusso: {
        aspetto:    ['un boulevard ampio con alberi potati ai lati','un viale lastricato di pietra bianca e pulita','una promenade con statue e fontane ornamentali','una strada privata con cancelli e guardie'],
        odori:      ['fiori di stagione e acqua di rose','cera per il pavimento e profumi dei passanti','erba tagliata dei giardini dietro i muri','aria pulita con sentore di legno di qualità'],
        atmosfera:  ['il silenzio è una forma di privilegio','carrozze private che sfilano lente','nessuno cammina veloce — qui si passeggia','uno sguardo di troppo viene notato dalla guardia'],
        dettagli:   ['lampioni di ferro battuto con decorazioni floreali','banchine per le carrozze davanti ai portoni','stemmi di famiglia sopra ogni cancello','giardinieri che curano i vasi con precisione chirurgica'],
        persone:    ['nobili con scorta che ignorano tutti','dame con abiti che valgono più di una casa','diplomatici stranieri in visita ufficiale','servitori in livrea che corrono commissioni'],
      },
    },

    quartiere: {
      squallido: {
        aspetto:    ['un dedalo di baracche di legno e lamiera','casupole ammassate che si sostengono a vicenda','edifici costruiti uno sopra l\'altro senza piano','strade di fango che diventano torrenti quando piove'],
        odori:      ['fuochi di spazzatura e cibo povero','fogna scoperta e animali da cortile','sudore collettivo e fumo di carbone'],
        atmosfera:  ['la povertà ha il suo rumore — basso e continuo','bambini che giocano tra rifiuti con un\'allegria strana','adulti che guardano i forestieri con sospetto esperto','la comunità si stringe contro il mondo esterno'],
        dettagli:   ['panni stesi tra le finestre che toccano quasi l\'altra sponda','animali da cortile che girano liberi','orti improvvisati su ogni superficie piana','graffiti che segnano il territorio'],
        persone:    ['famiglie di sei in due stanze','ex-soldati con lo sguardo perso','contrabbandieri che usano i vicoli come corridoi','bambini che conoscono ogni angolo meglio degli adulti'],
      },
      normale: {
        aspetto:    ['case a due piani in mattoni con tegole rosse','un quartiere con strade regolari e incroci ben definiti','edifici ben mantenuti con orti sul retro','una zona viva con botteghe al piano terra'],
        odori:      ['pane dal forno di quartiere','profumo di stufato dalle finestre aperte','legno lavorato e metallo caldo'],
        atmosfera:  ['la vita normale della gente normale','i bambini giocano, gli adulti lavorano','i vicini si conoscono e si guardano le spalle','c\'è un ordine non scritto che funziona'],
        dettagli:   ['una piazza centrale con pozzo e panchine','la chiesa o il tempio del quartiere al centro','un\'osteria di quartiere dove si decide tutto','il mercatino del mattino ogni tre giorni'],
        persone:    ['artigiani e bottegai','famiglie di classe media che ci tengono alla reputazione','l\'anziana che sa tutto di tutti','il giovane guardiaspalle di qualche commerciante'],
      },
      lusso: {
        aspetto:    ['villette con giardini curati dietro muri alti','palazzi con portoni in legno intagliato','un quartiere dove ogni edificio è un\'opera d\'arte','strade private con accesso controllato'],
        odori:      ['fiori e erbe del giardino','cedro e cuoio delle carrozze','profumi esotici dalle finestre aperte'],
        atmosfera:  ['il privilegio ha il profumo del silenzio','servi che entrano ed escono dai portoni sul retro','rarissimi passanti — qui non si passeggia senza motivo','ogni cosa comunica potere e separazione'],
        dettagli:   ['stemmi di casato sopra ogni ingresso','fontane private nei cortili interni','guardie private in livrea ai cancelli','carrozze che escono solo all\'ora giusta'],
        persone:    ['nobili che non camminano mai da soli','ambasciatori stranieri in visita','il mercante arricchito che imita i nobili','servitori che sanno tutto e non dicono nulla'],
      },
    },

    dungeon: {
      squallido: {
        aspetto:    ['corridoi di pietra grezza umida di condensa','fogne abbandonate con il soffitto che crolla','un sistema di cunicoli scavati male e senza ordine','catacombe dimenticate con ossa sparse'],
        odori:      ['muffa densa e acqua stagnante','marciume organico e ruggine','un\'umidità fredda che si attacca ai vestiti','qualcosa di morto, non troppo lontano'],
        atmosfera:  ['silenzio totale rotto da gocce d\'acqua','l\'oscurità è quasi tangibile senza luce magica','ogni passo risuona in modi che non tornano','la sensazione costante di essere osservati'],
        dettagli:   ['graffiti in lingue dimenticate sulle pareti','ossa sparse senza ordine né sepoltura','trappole già scattate — ma da chi?','residui di fuochi vecchi di mesi o anni'],
        pericolo:   ['il soffitto ha crepe che non ispirano fiducia','acqua che scorre verso il basso — verso cosa?','l\'aria si fa più fredda procedendo','suoni di unghie su pietra, forse ratti'],
      },
      normale: {
        aspetto:    ['corridoi di pietra squadrata con torce spente','sale vuote un tempo usate come prigione','un dungeon di costruzione militare, funzionale','catacombe ordinate di una casata nobile'],
        odori:      ['pietra fredda e ferro vecchio','cera bruciata e polvere','aria ferma che non circola da anni'],
        atmosfera:  ['la storia di questo posto si sente nel silenzio','porte rinforzate sfondate da dentro o da fuori','qualcuno ha vissuto qui — i segni sono ovunque','la struttura è solida, il pericolo viene da altro'],
        dettagli:   ['celle con sbarre ancora funzionanti','braci spente in bracieri di pietra','equipaggiamento militare arrugginito alle pareti','incisioni che segnano i livelli e le direzioni'],
        pericolo:   ['porte che si chiudono da sole','un corridoio che sembra più lungo all\'andata','la mappa non torna con la realtà','rumori che sembrano rispondere ai vostri'],
      },
      lusso: {
        aspetto:    ['sale intagliate con rilievi di battaglie dimenticate','corridoi con mosaici ancora vividi sul pavimento','un palazzo sotterraneo costruito per durare secoli','camere funerarie con soffitti a volta decorati'],
        odori:      ['incenso vecchio di decenni','metallo prezioso e pietra levigata','magia residua con sentore di ozono'],
        atmosfera:  ['la grandezza di un\'epoca perduta è ancora palpabile','ogni sala racconta qualcosa a chi sa guardare','un silenzio reverenziale, quasi sacro','si ha la sensazione di essere ospiti non invitati'],
        dettagli:   ['colonne con capitelli intagliati ancora integri','porte di bronzo con iscrizioni in lingue antiche','trappole magiche ancora attive dopo secoli','tesori dimenticati che aspettano da generazioni'],
        pericolo:   ['guardiani costrutti ancora fedeli al loro scopo','maledizioni attive incise sulle soglie','sigilli magici che reagiscono alla magia','la struttura si adatta per tenere fuori gli intrusi'],
      },
    },

    foresta: {
      squallido: {
        aspetto:    ['alberi storti e malati con la corteccia nera','fango profondo che rallenta ogni passo','vegetazione densa e intricata senza sentiero','un bosco che sembra rifiutarsi di lasciarti passare'],
        odori:      ['decomposizione e funghi velenosi','acqua stagnante e foglie marce','un\'umidità pesante che soffoca'],
        atmosfera:  ['il silenzio degli animali è il primo avvertimento','la luce filtra appena, grigia e fredda','ci si sente osservati da ogni direzione','i sentieri spariscono mentre si cammina'],
        dettagli:   ['alberi caduti che bloccano il cammino','ragnatele enormi tra i rami','tracce di animali malati nel fango','un odore di bruciato senza fonte visibile'],
        suoni:      ['cigolìo di rami senza vento','fruscii troppo grandi per essere ratti','silenzio improvviso di tutti gli uccelli','qualcosa che cammina parallelo al sentiero'],
      },
      normale: {
        aspetto:    ['un bosco misto con querce e pini alti','sentieri battuti da cacciatori e boscaioli','una foresta viva con chiome che filtrano la luce','alberi centenari con radici che emergono dal terreno'],
        odori:      ['resina e foglie umide','muschio e terra smossa','fiori selvatici e legno fresco'],
        atmosfera:  ['il bosco è vivo e lo si sente','uccelli che cantano e rispondono','il vento muove le chiome in modo ritmico','ci si sente piccoli nel modo giusto'],
        dettagli:   ['ruscelli che attraversano il sentiero','nidi in ogni ramo abbastanza alto','funghi e bacche identificabili ai lati del sentiero','tracce di cervi e cinghiali nel fango'],
        suoni:      ['picchio sul legno in lontananza','foglie mosse dal vento','acqua corrente ovunque ci si fermi','il canto di uccelli che non si vedono'],
      },
      lusso: {
        aspetto:    ['una foresta antica e protetta da incantesimi','alberi di grandezza straordinaria con corteccia luminosa','un bosco di fate con vegetazione che sembra curata','sentieri di muschio morbido che guidano da soli'],
        odori:      ['fiori magici e aria purissima','magia leggera come profumo di primavera eterna','legno prezioso e rugiada mattutina'],
        atmosfera:  ['la bellezza qui fa quasi male a guardarla','il tempo sembra scorrere diversamente','ogni pianta sembra consapevole della tua presenza','ci si sente ospiti di qualcosa di molto più antico'],
        dettagli:   ['piante curative rare che crescono spontanee','fuochi fatui che illuminano il cammino','animali non spaventati dagli avventurieri','fiori che sbocciano e appassiscono in pochi secondi'],
        suoni:      ['musica senza strumenti tra le foglie','il canto di creature mai viste prima','silenzio perfetto quando ci si ferma ad ascoltare','voci lontane in lingue sconosciute'],
      },
    },

    tempio: {
      squallido: {
        aspetto:    ['una cappella abbandonata con il tetto sfondato','muri scrostati con affreschi vandalizzati','un altare rovesciato e profanato','un luogo sacro che non lo è più da tempo'],
        odori:      ['muffa e legno marcio','cenere vecchia e cera bruciata','qualcosa di metallico — sangue? ruggine?'],
        atmosfera:  ['il silenzio di un dio che non risponde più','freddo innaturale anche in estate','la sensazione di una presenza non benevolente','oggetti sacri distrutti o trafugati'],
        dettagli:   ['simboli divini cancellati o invertiti','candele consumate da anni','testi sacri strappati e dispersi','tracce di riti non ortodossi sull\'altare'],
      },
      normale: {
        aspetto:    ['un tempio di pietra locale con campanile','navate semplici illuminate da candele e finestre','un luogo di culto pulito e funzionale','un santuario con i simboli del dio ben visibili'],
        odori:      ['incenso e cera','fiori freschi sull\'altare','legno di sandalo e olio sacro'],
        atmosfera:  ['pellegrini che pregano in silenzio','sacerdoti che si muovono con ritmo quotidiano','un senso di pace genuino e non performativo','la comunità si riconosce in questo luogo'],
        dettagli:   ['offerte votive lasciate dai fedeli','un libro delle preghiere condiviso','una cassetta per offerte in legno','vetrate colorate che proiettano luce colorata'],
      },
      lusso: {
        aspetto:    ['una cattedrale con soffitti a volta altissimi','colonne di marmo e pavimenti di mosaico','un tempio dorato visibile da mezza città','sale enormi con acustica progettata per il canto'],
        odori:      ['incenso raro bruciato in quantità','fiori esotici e olii preziosi','oro e pietra calda'],
        atmosfera:  ['il potere religioso e temporale si fondono qui','il silenzio è imposto dall\'architettura stessa','i fedeli si sentono piccoli — è lo scopo','preti di alto rango che non guardano i comuni'],
        dettagli:   ['statue di divinità alte quanto edifici','reliquie in teche di vetro e oro','donazioni di nobili che comprano perdono','guardiani armati in abiti religiosi'],
      },
    },

    castello: {
      squallido: {
        aspetto:    ['una torre solitaria con mura crepate','rovine di un forte militare abbandonato','un fortilizio tenuto in piedi a stento','mura che grondano acqua dopo ogni pioggia'],
        odori:      ['muffa, polvere e ferro vecchio','fumo di torce economiche','umidità di pietra mai asciutta'],
        atmosfera:  ['le guardie sembrano più a disagio dei visitatori','non si sa chi comanda o se qualcuno comanda','ogni stanza racconta una sconfitta','manutenzione zero, morale sotto zero'],
        dettagli:   ['ponte levatoio bloccato a metà','stendardi strappati ancora appesi','armature arrugginite in piedi per abitudine','un fossato asciutto usato come discarica'],
      },
      normale: {
        aspetto:    ['un castello funzionale con mura solide','torri di guardia con sentinelle attive','cortile interno con attività militare quotidiana','un forte ben organizzato senza eccessi'],
        odori:      ['ferro e cuoio delle armature','fuochi dei fabbri e cucine','fieno dalle stalle e cavalli'],
        atmosfera:  ['efficienza militare senza cerimonie','guardie che fanno il loro lavoro senza commenti','una gerarchia chiara e rispettata','si capisce subito chi comanda e come'],
        dettagli:   ['armerie ben fornite e organizzate','stalle con cavalli curati','una sala del consiglio con mappe alle pareti','un\'armeria con armi di ogni tipo etichettate'],
      },
      lusso: {
        aspetto:    ['torri eleganti visibili da giorni di cammino','cortili con giardini e fontane','sale del trono decorate con arazzi di seta','un palazzo-fortezza che è anche manifesto di potere'],
        odori:      ['cera e legno pregiato','fiori dei giardini interni','cucine che lavorano sempre per ospiti importanti'],
        atmosfera:  ['ogni movimento è politica','il protocollo è la vera armatura di questo posto','le guardie sembrano statue — eppure non perdono nulla','la ricchezza è esibita come forma di deterrenza'],
        dettagli:   ['arazzi che raccontano la storia della casata','banchi di marmo nel cortile','guardie d\'élite con armature su misura','stemmi ovunque — anche sul cibo'],
      },
    },

    porto: {
      squallido: {
        aspetto:    ['banchine di legno marcio che cigolano','barche abbandonate mezzo affondate','magazzini diroccati con tetti sfondati','reti ammonticchiate e mai riparate'],
        odori:      ['pesce marcio e alghe','carburante di nave e ruggine','acqua di sentina e salsedine rancida'],
        atmosfera:  ['contrabbandieri che lavorano alla luce del giorno','guardie che guardano dall\'altra parte','ogni affare si chiude senza parlare troppo','si sa che alcune domande non si fanno'],
        dettagli:   ['casse senza marchio che spariscono in fretta','pescatori che sembrano aspettare più che pescare','gabbiani enormi che rubano senza essere cacciati','una locanda sul molo che non chiude mai'],
      },
      normale: {
        aspetto:    ['un porto attivo con navi di diversi tipi','banchine in legno solido ben tenuto','magazzini pieni di mercanzia in entrata e uscita','una dogana che rallenta ma non ferma il commercio'],
        odori:      ['sale e pesce fresco','catrame e legno umido','spezie esotiche dai carichi'],
        atmosfera:  ['il rumore di un porto è come nessun altro','doganieri che fanno il loro lavoro con noia professionale','marinai di ogni nazionalità che si capiscono a gesti','le notizie arrivano prima qui che ovunque'],
        dettagli:   ['aste del pesce al mattino presto','navi in riparazione in secca','un faro che funziona — quasi sempre','taverne per ogni nazionalità di marinai'],
      },
      lusso: {
        aspetto:    ['una marina con navi da guerra e mercantili d\'alto bordo','banchine di pietra lavorata con corrimano di bronzo','magazzini sicuri con guardie armate','un porto imperiale con cerimonie di arrivo'],
        odori:      ['spezie rare e legni pregiati','cera e pulizia — raro per un porto','profumo dei carichi di lusso'],
        atmosfera:  ['le navi più belle del mondo passano di qui','commercianti con lettera di credito, non monete','le trattative avvengono nelle sale private','il porto parla il linguaggio del potere'],
        dettagli:   ['guardie navali in armatura completa','uffici di compagnie commerciali lungo la banchina','una sala di accoglienza per i capitani di rango','navi da guerra ancorate come monito permanente'],
      },
    },

    mercato: {
      squallido: {
        aspetto:    ['bancarelle di fortuna su cassette capovolte','merce esposta su teli di sacco a terra','tende rattoppate che non riparano dalla pioggia','un mercato che si smonta in cinque minuti se arrivano le guardie'],
        odori:      ['cibo avanzato e spezie economiche','animali vivi ammassati','sudore e troppa gente in poco spazio'],
        atmosfera:  ['urla e contrattazioni senza esclusione di colpi','ladri che lavorano nella folla','merce di provenienza incerta a prezzi bassissimi','il mercato più onesto nella disonestà'],
        dettagli:   ['bambini che fanno da palo','un venditore di informazioni travestito da fruttivendolo','merce rubata mischiata a merce legale','la guardia passa — tutti aspettano che ripassi'],
      },
      normale: {
        aspetto:    ['bancarelle ordinate su una piazza acciottolata','tendoni colorati che danno ombra e identità','un mercato che si svolge ai giorni stabiliti','venditori con posto fisso e clientela affezionata'],
        odori:      ['pane fresco e frutta di stagione','spezie e formaggi','animali vivi e fieno'],
        atmosfera:  ['il ritmo del mercato è il ritmo del paese','contrattare è normale, quasi obbligatorio','si trovano notizie tanto quanto merci','famiglie che si incontrano per caso ogni settimana'],
        dettagli:   ['un banditore che annuncia le offerte del giorno','pesatori pubblici per garantire le misure','una fontana centrale dove tutti si incontrano','il banco della locanda con stuzzichini'],
      },
      lusso: {
        aspetto:    ['un bazar coperto con gallerie illuminate','stand permanenti con vetrine e sicurezza','un mercato privato su invito','padiglioni eleganti per ogni categoria di merce'],
        odori:      ['spezie esotiche e profumi d\'oltre mare','cibo di alta cucina preparato sul posto','seta e pelli pregiate'],
        atmosfera:  ['si parla sottovoce e si mostra poco','ogni acquisto è un\'operazione diplomatica','i prezzi non si chiedono — si conoscono già','il bello è essere ammessi, non comprare'],
        dettagli:   ['guardie private discrete a ogni angolo','dimostrazioni di artigiani di fama','degustazioni di vini e cibi rari','contratti firmati davanti a testimoni notarili'],
      },
    },
  };

  const genera = () => {
    const tipo    = document.getElementById('gen-desc-tipo')?.value || 'taverna';
    const qualita = document.getElementById('gen-desc-qualita')?.value || 'normale';
    const el      = document.getElementById('gen-desc-result');
    if (!el) return;

    const t = DESC[tipo];
    const q = t?.[qualita];
    if (!q) { el.innerHTML = '<div class="text-muted text-sm">Tipo non trovato.</div>'; return; }

    const nomi   = NOMI[tipo]?.[qualita] || ['Luogo senza nome'];
    const nome   = rnd(nomi);

    const aspetto   = rnd(q.aspetto);
    const odori     = rnd(q.odori);
    const atmosfera = rnd(q.atmosfera);
    const dettagli  = rndN(q.dettagli || [], 2);
    const extra     = q.persone || q.merce || q.suoni || q.pericolo || q.cliente || [];
    const extItem   = extra.length ? rnd(extra) : null;

    const qualLabel = { squallido:'💀 Squallido', normale:'⚖️ Normale', lusso:'👑 Lusso' }[qualita] || '';
    const tipoLabel = {
      taverna:'🍺 Taverna', bottega:'🛒 Bottega', strada:'🛤️ Strada',
      quartiere:'🏘️ Quartiere', dungeon:'🏚️ Dungeon', foresta:'🌲 Foresta',
      tempio:'⛪ Tempio', castello:'🏰 Castello', porto:'⚓ Porto', mercato:'🏪 Mercato',
    }[tipo] || tipo;

    el.innerHTML =
      `<div style="margin-bottom:10px;">
        <div style="font-family:var(--font-display);font-size:1.1rem;color:var(--accent-secondary);margin-bottom:3px;">${nome}</div>
        <div style="display:flex;gap:6px;">
          <span class="badge badge-muted">${tipoLabel}</span>
          <span class="badge badge-muted">${qualLabel}</span>
        </div>
      </div>
      <div style="background:var(--bg-secondary);border-left:3px solid var(--accent-primary);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:12px 14px;font-size:0.85rem;line-height:1.85;color:var(--text-secondary);">
        ${aspetto.charAt(0).toUpperCase() + aspetto.slice(1)}.
        Nell'aria si sente ${odori}.
        ${atmosfera.charAt(0).toUpperCase() + atmosfera.slice(1)}.
        ${dettagli.map(d => d.charAt(0).toUpperCase() + d.slice(1) + '.').join(' ')}
        ${extItem ? extItem.charAt(0).toUpperCase() + extItem.slice(1) + '.' : ''}
      </div>`;

    Debug.log('Descrizione generata: ' + nome + ' [' + tipo + '/' + qualita + ']');
  };

  const aggiornaSottotipo = () => {

  };

  return { genera, aggiornaSottotipo };
})();

const NomiLuoghiGen = (() => {
  const rnd = (a) => a[Math.floor(Math.random()*a.length)];

  const PREFISSI = {
    citta:    ['Alta','Nuova','Pietra','Torre','Ferro','Porto','Gran','Santa','Antica','Forte','Valle','Monte'],
    villaggio:['Piccola','Bassa','Verde','Vecchia','Rossa','Bianca','Scura','Buona','Dolce','Grigia'],
    fiume:    ['Argento','Rapido','Chiaro','Buio','Freddo','Morto','Lungo','Amaro','Bianco','Nero'],
    montagna: ['Alta','Bianca','Nera','Rossa','Grande','Fredda','Antica','Aspra','Spezzata','Solitaria'],
    foresta:  ['Verde','Oscura','Antica','Silenziosa','Nebbiosa','Morta','Fonda','Mille','Sacra','Perduta'],
    dungeon:  ['Tomba','Cripta','Abisso','Prigione','Sala','Volta','Camera','Labirinto','Torre','Fossa'],
    regno:    ['Alto','Gran','Nuovo','Antico','Libero','Eterno','Glorioso','Oscuro','Fiero','Sacro'],
  };
  const RADICI = {
    citta:    ['haven','vale','burg','shire','ford','wick','moor','bridge','holm','gate','field','cross','mere','thorpe'],
    villaggio:['brook','mill','ton','stead','ford','wick','ham','field','green','wood','mere','low','nook'],
    fiume:    ['un','ia','ara','eno','asso','ello','ina','ora','ane','olo'],
    montagna: ['peak','horn','berg','fell','crag','tor','stein','fang','spire','ridge'],
    foresta:  ['wood','vale','glade','dell','thicket','grove','hollow','moor','fen','weald'],
    dungeon:  ['del Vecchio Re','Senza Ritorno','delle Ombre','Maledetta','dei Caduti','Dimenticata','Perduta','Antica','Oscura'],
    regno:    ['ia','ar','or','un','eld','ath','em','ion','imar','ador'],
  };
  const SUFFISSI = {
    citta:    ['sul Fiume','delle Mille Torri','del Nord','dei Mercanti','Imperiale','della Costa','Alta','Libera'],
    villaggio:['sul Colle','del Bosco','dei Cacciatori','dei Pescatori','al Crocevia','della Palude','dei Mulini'],
    fiume:    ['Argentato','che Canta','Oscuro','Eterno','del Nord','Profondo','delle Lacrime','Antico'],
    montagna: ['Innevata','del Drago','dei Giganti','Maledetta','degli Spiriti','Solitaria','Eterna','Spezzata'],
    foresta:  ['degli Elfi','dei Lupi','Incantata','Proibita','dei Sussurri','Perduta','Eterna','Antica'],
    dungeon:  ['','','',''],
    regno:    ['del Nord','dei Mari','Orientale','Imperiale','delle Montagne','delle Pianure','del Sole','della Luna'],
  };
  const NOMI_FANTASIA = {
    citta:    ['Silverkeep','Ironhaven','Stormwall','Goldenmere','Duskport','Ashford','Ravenmoor','Brightholm','Shadowgate','Crystalvale'],
    villaggio:['Millbrook','Thornwick','Greenvale','Oakham','Dustford','Mossystone','Redfield','Willowmere','Fernholt','Thistledown'],
    fiume:    ['Silvara','Eanor','Miruvor','Dunath','Celebrant','Anduin','Rhosfar','Imladris','Gwathló','Narog'],
    montagna: ['Doomspire','Frosthorn','Ironpeak','Grimfang','Stormcrest','Voidtop','Greystone','Blackhorn','Coldreach','Ashpeak'],
    foresta:  ['Shadowmere','Whisperwood','Moonvale','Darkfen','Greenweald','Mistwood','Thornthicket','Elderglade','Hollowbrook','Feygrove'],
    dungeon:  ['Le Tombe di Varath','Il Labirinto di Kessir','Le Catacombe dei Re Perduti','La Prigione di Morath','Le Sale di Drathûn','Il Sepolcro di Zara','La Cripta dell\'Immortale','Il Dungeon di Gorth'],
    regno:    ['Aldamor','Verantia','Khorun','Selindra','Orvanthar','Duskemeria','Irontheld','Vaeloria','Grimholt','Surantis'],
  };

  const genera = () => {
    const tipo = document.getElementById('gen-nomluogo-tipo')?.value || 'citta';
    const el = document.getElementById('gen-nomluogo-result');
    if (!el) return;

    const nomi = [];

    nomi.push(rnd(NOMI_FANTASIA[tipo] || NOMI_FANTASIA.citta));

    const pref = rnd(PREFISSI[tipo] || PREFISSI.citta);
    const rad  = rnd(RADICI[tipo] || RADICI.citta);
    const suff = rnd(SUFFISSI[tipo] || SUFFISSI.citta);
    const opzione2 = tipo === 'dungeon'
      ? (rnd(NOMI_FANTASIA.dungeon))
      : (pref + rad + (suff ? ' ' + suff : '')).trim();
    nomi.push(opzione2);

    const pref2 = rnd(PREFISSI[tipo]);
    const rad2  = rnd(RADICI[tipo]);
    nomi.push((pref2 + rad2).replace(/([a-z])([A-Z])/g, '$1 $2'));

    const tipoLabel = {
      citta:'🏙️ Città', villaggio:'🏘️ Villaggio', fiume:'🌊 Fiume',
      montagna:'⛰️ Montagna', foresta:'🌲 Foresta', dungeon:'🏚️ Dungeon/Rovina', regno:'👑 Regno'
    }[tipo] || tipo;

    el.innerHTML =
      '<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px;font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.05em;">' + tipoLabel + '</div>' +
      nomi.map((n, i) =>
        '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">' +
          '<span style="font-family:var(--font-display);font-size:' + (i===0?'1rem':'0.88rem') + ';' + (i===0?'color:var(--accent-secondary);':'') + '">' + n + '</span>' +
          (i===0 ? '<span class="badge badge-muted" style="font-size:0.6rem;">suggerito</span>' : '') +
        '</div>'
      ).join('') +
      '<button class="btn btn-ghost btn-sm w-full" style="margin-top:6px;font-size:0.72rem;" onclick="NomiLuoghiGen.genera()">🎲 Altri nomi</button>';

    Debug.log('Nomi luoghi generati per ' + tipo);
  };

  return { genera };
})();

const GanciGen = (() => {
  const rnd = (a) => a[Math.floor(Math.random()*a.length)];

  const GANCI = {
    mistero: [
      'Un mercante viene trovato morto nella sua stanza chiusa dall\'interno. Le sue ultime parole scritte: "loro sanno".',
      'I bambini del villaggio smettono tutti di parlare lo stesso giorno. Non hanno paura — sembrano in attesa.',
      'Una nave arriva al porto senza equipaggio. Il pasto è ancora caldo nelle cucine.',
      'Le statue del tempio piangono sangue ogni notte di luna piena. I sacerdoti fingono di non saperlo.',
      'Un libro appare nella biblioteca del mago con la sua calligrafia — ma lui non l\'ha mai scritto.',
      'Tutti nel villaggio hanno lo stesso sogno da tre notti. E ora qualcuno è sparito.',
      'Un anello viene ritrovato dopo cinquant\'anni — sul dito di qualcuno che ha trent\'anni.',
      'Le campane della città suonano da sole a mezzanotte. Solo il party le sente.',
      'Un cadavere viene sepolto. La mattina dopo è seduto alla sua tavola, come se nulla fosse.',
      'Le ombre del party puntano sempre nella stessa direzione — anche quando il sole è altrove.',
    ],
    azione: [
      'Un corriere ferito crolla ai piedi del party: "Portate questo a..." muore prima di finire.',
      'Il castello viene assediato. Il party è dentro. Le provviste bastano tre giorni.',
      'Una carovana viene assaltata davanti al party. I banditi sono troppi — o sembrano troppi.',
      'La gilda dei ladri ha messo una taglia sulla testa di uno dei PG. Motivo: sconosciuto.',
      'Un prigioniero fugge dalla prigione della città. Il borgomastro offre una taglia. Qualcuno nel party lo conosce.',
      'Un mercenario si avvicina al party: "Vi offro il doppio di quello che vi stanno pagando per smettere".',
      'Il ponte sul fiume viene fatto saltare. Il party è nel mezzo di due eserciti.',
      'Un drago sorvola la città ogni notte. Nessuno sa cosa vuole. Ieri ha bruciato un quartiere.',
      'La città viene messa in quarantena. Nessuno esce. Qualcuno nel party deve uscire.',
      'Un torneo richiede campioni. Il premio è qualcosa che il party vuole disperatamente.',
    ],
    sociale: [
      'Un nobile offre una cena al party. Nel dessert rivela di sapere tutto su di loro.',
      'Due famiglie potenti si sfidano a duello. Il party è l\'unico a sapere che entrambe hanno ragione.',
      'Un mercante vuole assumere il party come scorta. In realtà vuole testimonial per la sua merce.',
      'La figlia del sindaco è innamorata di qualcuno di sbagliato. Il padre offre molto per "risolvere".',
      'Un diplomatico straniero arriva in città. Il suo interprete sta mentendo — e solo il party se ne accorge.',
      'Il party viene invitato a un banchetto reale. Sono gli unici senza invito di sangue nobile.',
      'Un vecchio amico di uno dei PG ricompare — e chiede un favore difficile da rifiutare.',
      'Due gilde sono in guerra commerciale. Entrambe offrono lavoro al party. Simultaneamente.',
      'Il party viene accusato di un crimine che non ricorda di aver commesso — ma le prove ci sono.',
      'Un bambino segue il party ovunque. Dice di essere stato mandato da loro stessi, dal futuro.',
    ],
    esplorazione: [
      'Una mappa viene trovata nel ventre di un pesce grande abbastanza da ingoiare un uomo.',
      'Una porta compare su una parete che ieri era piena. Porta a un posto che non dovrebbe esistere.',
      'Il sentiero nella foresta si chiude dietro al party. Davanti, una luce che si allontana.',
      'Un faro lampeggia da una costa dove non ci dovrebbe essere terra.',
      'Un antico dungeon viene scoperto sotto le fondamenta di un edificio in costruzione.',
      'Una nebbia strana avvolge il party. Quando si dirada, il paesaggio è cambiato.',
      'Una stella che nessuno ha mai visto appare nel cielo e punta sempre verso est.',
      'Una mappa mostra una città che non esiste in nessun libro — ma le coordinate sono precise.',
      'Un passaggio segreto nella locanda porta a una rete di tunnel che attraversa tutta la città.',
      'Il party trova un accampamento fresco — e le impronte portano verso un muro di roccia solida.',
    ],
    soprannaturale: [
      'Gli specchi della città non riflettono più le persone — solo i loro peccati.',
      'Ogni persona che muore in città risorge entro un\'ora. Sembra un dono. Forse è una trappola.',
      'Un dio minore si materializza davanti al party e chiede aiuto. Non sembra in grado di farlo da solo.',
      'Il tempo si ferma per tutti tranne il party. Hanno finché il sole non tramonta per fare qualcosa.',
      'La magia smette di funzionare in un raggio di un miglio dalla città. Non si sa perché.',
      'Un portale si apre nel centro della piazza. Da dentro si sente una voce familiare.',
      'Il party inizia ad avere tutti lo stesso sogno profetico — ma ognuno vede una fine diversa.',
      'Una maledizione si diffonde: chiunque dica bugie perde temporaneamente la voce.',
      'Un fantasma può essere visto solo dai PG. Vuole qualcosa — ma non sa più cosa.',
      'Il piano astrale si sovrappone alla realtà per una notte. I morti camminano tra i vivi.',
    ],
  };

  const CONTESTI = [
    'Accade mentre il party si trova in una taverna.',
    'Succede la mattina dopo una lunga notte di viaggio.',
    'Avviene proprio mentre il party stava per lasciare la città.',
    'Capita durante una fiera di paese affollata.',
    'Si verifica nel momento di maggiore tranquillità.',
    'Accade nel mezzo di un\'altra missione.',
    'Succede all\'alba, prima che chiunque altro sia sveglio.',
    'Si manifesta durante una guardia notturna.',
  ];

  const genera = () => {
    const tipo = document.getElementById('gen-gancio-tipo')?.value || 'tutti';
    const el = document.getElementById('gen-gancio-result');
    if (!el) return;

    let pool = [];
    if (tipo === 'tutti') {
      Object.values(GANCI).forEach(arr => pool.push(...arr));
    } else {
      pool = GANCI[tipo] || [];
    }

    const gancio  = rnd(pool);
    const contesto = rnd(CONTESTI);
    const tipoLabel = {
      tutti:'🎣', mistero:'🔍 Mistero', azione:'⚔️ Azione',
      sociale:'💬 Sociale', esplorazione:'🗺️ Esplorazione', soprannaturale:'🌀 Soprannaturale'
    }[tipo] || '🎣';

    el.innerHTML =
      '<div style="background:var(--bg-secondary);border-left:3px solid var(--accent-secondary);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:10px 12px;margin-bottom:8px;font-size:0.85rem;line-height:1.7;">' + gancio + '</div>' +
      '<div style="font-size:0.75rem;color:var(--text-muted);font-style:italic;margin-bottom:8px;">📍 ' + contesto + '</div>' +
      '<div style="display:flex;gap:4px;">' +
        '<span class="badge badge-muted">' + tipoLabel + '</span>' +
      '</div>' +
      '<button class="btn btn-ghost btn-sm w-full" style="margin-top:8px;font-size:0.72rem;" onclick="GanciGen.genera()">🎲 Altro gancio</button>';

    Debug.log('Gancio generato: ' + tipo);
  };

  return { genera };
})();

const OracoloGen = (() => {
  const lancia = (modalita) => {
    const el = document.getElementById('gen-oracolo-result');
    if (!el) return;

    const d100 = Math.floor(Math.random() * 100) + 1;
    const dTwist = Math.floor(Math.random() * 6) + 1;

    let risposta, colore, emoji;
    if (d100 <= 10) {
      risposta = 'NO, e inoltre...'; colore = 'var(--accent-danger)'; emoji = '❌❌';
    } else if (d100 <= 35) {
      risposta = 'No'; colore = 'var(--accent-danger)'; emoji = '❌';
    } else if (d100 <= 45) {
      risposta = 'No, ma...'; colore = '#e07b39'; emoji = '❌✨';
    } else if (d100 <= 55) {
      risposta = 'Sì, ma...'; colore = '#c8a43a'; emoji = '✅⚠️';
    } else if (d100 <= 75) {
      risposta = 'Sì'; colore = 'var(--accent-success)'; emoji = '✅';
    } else if (d100 <= 90) {
      risposta = 'Sì, e inoltre...'; colore = 'var(--accent-success)'; emoji = '✅✅';
    } else {
      risposta = 'Sì, assolutamente!'; colore = '#5bc85b'; emoji = '✅✅✅';
    }

    const TWIST = [
      'ma qualcuno lo nota',
      'ma costa più del previsto',
      'ma non nel modo che ti aspettavi',
      'ma introduce una complicazione',
      'ma qualcuno si opporrà',
      'ma richiede tempo extra',
      'ma ha un effetto collaterale',
      'ma dipende da una terza parte',
      'ma le cose cambieranno presto',
      'ma non tutti saranno d\'accordo',
      'e cambia qualcosa di importante',
      'e apre una nuova possibilità',
    ];

    let twistTesto = '';
    if (modalita === 'complicato' || d100 <= 10 || d100 >= 91) {
      twistTesto = ['No, e inoltre...','No, ma...','Sì, ma...','Sì, e inoltre...'].includes(risposta)
        ? '' : ' — ' + (TWIST[dTwist - 1] || TWIST[0]);
    }

    el.innerHTML =
      '<div style="text-align:center;padding:8px 0;">' +
        '<div style="font-size:2rem;margin-bottom:4px;">' + emoji + '</div>' +
        '<div style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:' + colore + ';margin-bottom:4px;">' + risposta + '</div>' +
        (twistTesto ? '<div style="font-size:0.8rem;color:var(--text-muted);font-style:italic;">' + twistTesto + '</div>' : '') +
        '<div style="font-size:0.65rem;color:var(--text-muted);margin-top:6px;">d100: ' + d100 + '</div>' +
      '</div>';

    Debug.log('Oracolo: ' + risposta + ' (d100=' + d100 + ')');
  };

  return { lancia };
})();

const MissioniGen = (() => {
  const rnd = (a) => a[Math.floor(Math.random()*a.length)];

  const COMMITTENTI = {
    '1-4':   ['Un contadino disperato','La guardia del villaggio','Un mercante locale','Il prete del tempio','La figlia del mugnaio','Un anziano saggio','Un bambino coraggioso','Il sindaco nervoso'],
    '5-10':  ['Il capitano della guardia','Un nobile minore','Il maestro della gilda','Un mago eccentrico','La badessa del convento','Un mercante ricco','Il borgomastro','Un cavaliere in pensione'],
    '11-16': ['Un lord potente','Il gran maestro della gilda','Un alto sacerdote','Un ambasciatore straniero','Un arcimago','Il comandante dell\'esercito','Un re in incognito','Una spia reale'],
    '17-20': ['Il consiglio dei re','Un dio minore incarnato','Un\'antica entità che chiede favori','Il papa della chiesa','L\'imperatore stesso','Un drago che tratta da pari','Il guardiano di un piano cosmico','Un profeta di un\'era futura'],
  };

  const RICOMPENSE = {
    '1-4':   ['20 mo','50 mo','Un oggetto comune','30 mo e una stanza gratis per un mese','Una pozione di guarigione','La gratitudine di un artigiano esperto','Un favore del sindaco','40 mo e informazioni utili'],
    '5-10':  ['200 mo','Un oggetto non comune','500 mo','Una mappa verso un dungeon inesplorato','Un oggetto magico minore','Il titolo di campione del villaggio','300 mo e una lettera di credito','Un cavallo di razza'],
    '11-16': ['1000 mo','Un oggetto raro','Un terreno e una piccola proprietà','2000 mo','Un oggetto magico raro','Il titolo di nobile minore','Accesso a un archivio segreto','Un artefatto incompleto da completare'],
    '17-20': ['10000 mo','Un oggetto molto raro','Un castello in dono','Un artefatto leggendario','Il titolo di paladino del regno','L\'appoggio di un esercito','Un desiderio parziale concesso','La mappa di un piano cosmico'],
  };

  const COMPLICAZIONI = {
    '1-4':   [
      'In realtà il committente non può permettersi la ricompensa promessa.',
      'La missione è più pericolosa di quanto sembri — qualcuno ha mentito.',
      'C\'è un secondo gruppo che vuole la stessa cosa.',
      'Il target ha una famiglia che supplica pietà.',
      'La missione è illegale secondo la legge locale.',
      'Un amico del party è coinvolto nel problema.',
    ],
    '5-10':  [
      'Una fazione rivale sta seguendo il party.',
      'Il committente ha un secondo obiettivo nascosto.',
      'La missione attira l\'attenzione di una gilda criminale.',
      'Completarla creerà un nemico potente altrove.',
      'Il target è innocente — è stato incastrato.',
      'Qualcuno all\'interno del gruppo del party ha interessi contrari.',
    ],
    '11-16': [
      'La missione è una trappola elaborata di un nemico del party.',
      'Completarla destabilizzerà l\'equilibrio politico della regione.',
      'Il committente è controllato da un\'entità superiore.',
      'La ricompensa è maledetta.',
      'Completarla risveglia qualcosa di antico e pericoloso.',
      'Un altro potere vuole il party fuori dai giochi.',
    ],
    '17-20': [
      'La missione è parte di una profezia cosmica che nessuno ha letto per intero.',
      'Completarla altererà il piano astrale in modo permanente.',
      'Il committente non è ciò che sembra — è un\'entità travestita.',
      'La ricompensa ha un costo nascosto che si svelerà dopo.',
      'Divinità rivali stanno usando il party come pedine.',
      'Il successo della missione è già "scritto" — ma non il modo.',
    ],
  };

  const MISSIONI = {
    caccia: {
      '1-4': [
        { titolo: 'I Ratti del Mugnaio', obiettivo: 'Eliminare un nido di ratti giganti che infestano il mulino del villaggio.', luogo: 'Cantina del mulino', nemico: 'Ratti giganti (GS 1/4)', dettaglio: 'Il mugnio teme che si siano già mangiati parte delle scorte invernali.' },
        { titolo: 'Il Lupo di Pietrabianca', obiettivo: 'Cacciare un lupo enorme che attacca gli animali da fattoria.', luogo: 'Bosco vicino al villaggio', nemico: 'Lupo gigante (GS 1)', dettaglio: 'Alcune impronte suggeriscono che il lupo sia in realtà un licantropo.' },
        { titolo: 'Nido di Goblin', obiettivo: 'Ripulire un accampamento di goblin che derubano i viaggiatori.', luogo: 'Grotta a due ore dal villaggio', nemico: 'Banda di goblin (6-8)', dettaglio: 'I goblin sembrano guidati da qualcuno di più intelligente di loro.' },
        { titolo: 'La Bestia della Palude', obiettivo: 'Uccidere o scacciare la creatura che terrorizza i pescatori.', luogo: 'Palude meridionale', nemico: 'Coccodrillo gigante (GS 2)', dettaglio: 'I pescatori giurano che la bestia sia intelligente e abbia già teso un\'imboscata.' },
      ],
      '5-10': [
        { titolo: 'Il Troll di Pietraforte', obiettivo: 'Eliminare il troll che ha preso il controllo del ponte principale.', luogo: 'Ponte sul fiume Eanor', nemico: 'Troll (GS 5)', dettaglio: 'Il troll porta un amuleto di fattura nanica — da dove viene?' },
        { titolo: 'La Gorgone della Valle', obiettivo: 'Cacciare la gorgone che ha pietrificato tre pastori.', luogo: 'Valle di Greystone', nemico: 'Gorgone (GS 5)', dettaglio: 'I pastori pietrificati sono ancora vivi — si può salvarli entro sette giorni.' },
        { titolo: 'Il Wyvern di Capo Nero', obiettivo: 'Uccidere o scacciare il wyvern che attacca le navi mercantili.', luogo: 'Scogliere a nord del porto', nemico: 'Wyvern (GS 6)', dettaglio: 'Il wyvern sembra proteggere qualcosa sulle scogliere — un nido? Un tesoro?' },
        { titolo: 'La Banda degli Squartatori', obiettivo: 'Eliminare un gruppo di banditi d\'élite che ha saccheggiato tre villaggi.', luogo: 'Fortino abbandonato nelle colline', nemico: 'Banditi con capo veterano (GS 3+5)', dettaglio: 'La banda ha connessioni con qualcuno in città — qualcuno li protegge.' },
      ],
      '11-16': [
        { titolo: 'Il Drago di Morathis', obiettivo: 'Sconfiggere il drago giovane che rivendica la regione come suo territorio.', luogo: 'Caverne di Morathis', nemico: 'Drago giovane (GS 10-13)', dettaglio: 'Il drago sta raccogliendo metallo per qualcosa — non solo tesoro.' },
        { titolo: 'Il Lich Senza Nome', obiettivo: 'Distruggere il lich che sta risvegliando i morti nelle città costiere.', luogo: 'Mausoleo imperiale sommerso', nemico: 'Lich (GS 21 — indebolito GS 14)', dettaglio: 'Il lich cerca il suo phylactery perduto — qualcuno del party potrebbe averlo.' },
        { titolo: 'L\'Esercito degli Occhi', obiettivo: 'Sconfiggere il beholder che controlla un\'intera città come marionettista.', luogo: 'La città di Valdris', nemico: 'Beholder (GS 13)', dettaglio: 'I cittadini sotto controllo hanno ancora frammenti di volontà propria.' },
        { titolo: 'La Caccia al Vampiro', obiettivo: 'Trovare e distruggere il vampiro che svuota di sangue i nobili della città.', luogo: 'Palazzo aristocratico / catacomba', nemico: 'Vampiro (GS 13) + spawn', dettaglio: 'Il vampiro è uno dei nobili più rispettati. Tutti lo proteggono inconsciamente.' },
      ],
      '17-20': [
        { titolo: 'Il Signore dei Demoni', obiettivo: 'Sconfiggere il principe demoniaco che ha aperto un portale permanente.', luogo: 'Piano dell\'Abisso (strato 113)', nemico: 'Principe demoniaco (GS 20+)', dettaglio: 'Chiudere il portale richiede un sacrificio — ma non necessariamente di sangue.' },
        { titolo: 'Il Dio Caduto', obiettivo: 'Fermare un dio morente che nella sua agonia sta distruggendo il piano materiale.', luogo: 'Cuore della divinità ferita', nemico: 'Avatar divino (GS 20+)', dettaglio: 'Il dio non è malvagio — è semplicemente disperato. Si può salvare?' },
        { titolo: 'L\'Antidrago', obiettivo: 'Distruggere l\'antidrago primordiale risvegliato da un rituale proibito.', luogo: 'Piana di Ashveld', nemico: 'Antidrago (leggendario)', dettaglio: 'Cinque armi specifiche possono ferirlo — il party ne ha già una senza saperlo.' },
      ],
    },

    recupero: {
      '1-4': [
        { titolo: 'La Spada del Nonno', obiettivo: 'Recuperare una spada di famiglia rubata da goblin e portata nel loro covo.', luogo: 'Grotta dei goblin', nemico: 'Goblin (5-6)', dettaglio: 'La spada ha un\'iscrizione che il committente non ha mai saputo leggere.' },
        { titolo: 'Il Libro del Vecchio Mago', obiettivo: 'Recuperare un grimorio rubato dalla camera di un mago anziano.', luogo: 'Casa del ladro in città', nemico: 'Ladro (GS 1/2) + guardie', dettaglio: 'Il ladro non sapeva cosa stesse rubando — sta cercando di venderlo.' },
        { titolo: 'Le Provviste del Villaggio', obiettivo: 'Recuperare le scorte invernali rubate da una banda di razziatori.', luogo: 'Accampamento razziatori a nord', nemico: 'Banditi (4-6)', dettaglio: 'Le provviste sono già state in parte consumate — ne manca un terzo.' },
      ],
      '5-10': [
        { titolo: 'L\'Artefatto Rubato', obiettivo: 'Recuperare un artefatto museale rubato da una gilda di ladri professionisti.', luogo: 'Quartiere generale della gilda', nemico: 'Ladri esperti (GS 2-4)', dettaglio: 'L\'artefatto è già stato rivenduto — bisogna seguire la catena.' },
        { titolo: 'Il Sigillo del Re', obiettivo: 'Recuperare il sigillo reale prima che venga usato per firmare documenti falsi.', luogo: 'Nave mercantile in partenza', nemico: 'Spie straniere (4-6, GS 3)', dettaglio: 'Il sigillo è già stato usato una volta — per cosa?' },
        { titolo: 'La Reliquia Perduta', obiettivo: 'Recuperare una reliquia sacra da un dungeon dove era stata nascosta secoli fa.', luogo: 'Cripta sotto le rovine', nemico: 'Non morti (GS 1-4)', dettaglio: 'La reliquia è protetta da una maledizione — chi la tocca vede il passato.' },
      ],
      '11-16': [
        { titolo: 'Il Cuore del Golem', obiettivo: 'Recuperare il nucleo di un golem antico prima che venga attivato dal nemico.', luogo: 'Laboratorio segreto sotterraneo', nemico: 'Cultisti + golem parziali', dettaglio: 'Il nucleo è un essere cosciente intrappolato da secoli.' },
        { titolo: 'La Corona Spezzata', obiettivo: 'Recuperare i tre frammenti della corona del re antico sparsi per il regno.', luogo: 'Tre siti diversi in sequenza', nemico: 'Vari (cambiano per sito)', dettaglio: 'Chi porta tutti e tre i frammenti ne viene corrotto lentamente.' },
      ],
      '17-20': [
        { titolo: 'Il Nome del Dio', obiettivo: 'Recuperare il vero nome di un dio rubato da un arcivampiro per usarlo come arma.', luogo: 'Fortezza extradimensionale', nemico: 'Arcivampiro (GS 20) + esercito', dettaglio: 'Pronunciare il nome nel posto sbagliato potrebbe distruggere un piano.' },
        { titolo: 'L\'Anima del Mondo', obiettivo: 'Recuperare il cristallo che contiene l\'essenza del piano materiale, rubato da un titano.', luogo: 'Isola fluttuante nel piano astrale', nemico: 'Titano del caos (GS 20+)', dettaglio: 'Rompere il cristallo restaura il piano — ma uccide chi lo porta.' },
      ],
    },

    scorta: {
      '1-4': [
        { titolo: 'Il Mercante Nervoso', obiettivo: 'Scortare un mercante con un carico prezioso fino alla città successiva.', luogo: 'Strada commerciale (due giorni)', nemico: 'Banditi in agguato (1d4+2)', dettaglio: 'Il mercante sa di essere seguito — ma non dice da chi.' },
        { titolo: 'Il Pellegrino Anziano', obiettivo: 'Accompagnare un anziano prete al tempio sul monte sacro.', luogo: 'Sentiero di montagna (tre giorni)', nemico: 'Goblin + pericoli naturali', dettaglio: 'L\'anziano porta qualcosa di nascosto nelle vesti — e qualcuno lo sa.' },
      ],
      '5-10': [
        { titolo: 'L\'Ambasciatore', obiettivo: 'Scortare un diplomatico straniero attraverso territorio ostile.', luogo: 'Foresta di confine (quattro giorni)', nemico: 'Assassini (3-4, GS 3)', dettaglio: 'Uno degli assassini potrebbe essere nella scorta ufficiale.' },
        { titolo: 'Il Prigioniero Illustre', obiettivo: 'Trasportare un nobile prigioniero in un castello sicuro per il processo.', luogo: 'Strada reale sorvegliata', nemico: 'Alleati del nobile che tentano il salvataggio', dettaglio: 'Il nobile è innocente. O forse no.' },
        { titolo: 'Il Carico Magico', obiettivo: 'Scortare una cassa sigillata con rune a destinazione — senza aprirla.', luogo: 'Rotta commerciale con tre checkpoint', nemico: 'Ladri di magia (GS 2-4)', dettaglio: 'La cassa emette suoni. A volte parla.' },
      ],
      '11-16': [
        { titolo: 'L\'Erede al Trono', obiettivo: 'Portare in salvo l\'erede reale mentre il castello viene assaltato.', luogo: 'Dal castello alla frontiera sicura', nemico: 'Esercito ribelle e assassini reali', dettaglio: 'L\'erede conosce qualcosa che i ribelli vogliono disperatamente.' },
        { titolo: 'Il Profeta', obiettivo: 'Proteggere un profeta che ha previsto l\'assassinio di un re — incluso il proprio.', luogo: 'Città-capitale durante un festival', nemico: 'Culto segreto + sicari', dettaglio: 'Il profeta accetta serenamente il proprio destino. Il party no.' },
      ],
      '17-20': [
        { titolo: 'L\'Ultimo Dio', obiettivo: 'Scortare l\'avatar di un dio morente al suo luogo di riposo finale.', luogo: 'Attraverso tre piani cosmici', nemico: 'Demoni che vogliono la morte del dio + angeli che vogliono accelerarla', dettaglio: 'Il dio offre risposte — ma ogni risposta ha un prezzo.' },
      ],
    },

    esplorazione: {
      '1-4': [
        { titolo: 'La Grotta dei Cristalli', obiettivo: 'Esplorare e mappare una grotta inesplorata segnalata da un pastore.', luogo: 'Colline a est del villaggio', nemico: 'Sciame di pipistrelli + trappole naturali', dettaglio: 'La grotta ha cristalli che brillano da soli — e segni di presenza recente.' },
        { titolo: 'Le Rovine del Vecchio Forte', obiettivo: 'Investigare le rovine abbandonate da cui arrivano luci notturne strane.', luogo: 'Rovine a nord del bosco', nemico: 'Scheletri animati (2-3)', dettaglio: 'Qualcuno usa le rovine come base. Non i morti.' },
      ],
      '5-10': [
        { titolo: 'La Città Sommersa', obiettivo: 'Esplorare i resti di una città antica sommersa in un lago e riportare una mappa.', luogo: 'Lago di Miravar', nemico: 'Sahuagin + elementali d\'acqua', dettaglio: 'La città è parzialmente abitata ancora. Da chi?' },
        { titolo: 'Il Passo Dimenticato', obiettivo: 'Trovare e cartografare un passo di montagna che appare solo in vecchie mappe nanice.', luogo: 'Catena montuosa settentrionale', nemico: 'Bestie di montagna + intemperie', dettaglio: 'Il passo è reale — e qualcuno lo usa già.' },
        { titolo: 'L\'Isola Senza Nome', obiettivo: 'Raggiungere e mappare un\'isola che appare sulle carte solo durante le tempeste.', luogo: 'Mare aperto a ovest', nemico: 'Pirati + creature marine', dettaglio: 'L\'isola non è sempre nello stesso posto.' },
      ],
      '11-16': [
        { titolo: 'Il Piano Specchio', obiettivo: 'Esplorare il riflesso del piano materiale dove tutto è invertito.', luogo: 'Piano Etereo (zona specchio)', nemico: 'Versioni corrotte di entità conosciute', dettaglio: 'Nel piano specchio esiste una versione del party. Non è amica.' },
        { titolo: 'La Biblioteca Proibita', obiettivo: 'Raggiungere e saccheggiare la biblioteca di un lich decaduto piena di conoscenze proibite.', luogo: 'Dungeon extradimensionale sigillato', nemico: 'Costrutti bibliotecari + trappole magiche', dettaglio: 'Alcuni libri non vogliono essere letti. Altri vogliono essere portati via.' },
      ],
      '17-20': [
        { titolo: 'Il Centro del Mondo', obiettivo: 'Raggiungere il punto fisico dove il piano materiale ha avuto origine.', luogo: 'Core planetario (viaggio extradimensionale)', nemico: 'Entità primordiali che proteggono il segreto', dettaglio: 'Il centro non è un luogo — è un momento. E si sta per concludere.' },
      ],
    },

    intriga: {
      '1-4': [
        { titolo: 'Chi ha Rubato il Pane?', obiettivo: 'Scoprire chi sta rubando cibo dai magazzini del villaggio di notte.', luogo: 'Villaggio', nemico: 'Nessun combattimento previsto', dettaglio: 'Il ladro è qualcuno di disperato — la risposta non è semplice.' },
        { titolo: 'La Lettera Falsa', obiettivo: 'Scoprire chi ha scritto una lettera falsa che ha rovinato la reputazione di un mercante.', luogo: 'Città mercantile', nemico: 'Rivale commerciale + tirapiedi', dettaglio: 'La lettera contiene un errore grammaticale che svela l\'autore a chi sa cercarlo.' },
      ],
      '5-10': [
        { titolo: 'La Spia nella Gilda', obiettivo: 'Identificare la talpa all\'interno della gilda degli avventurieri che vende informazioni.', luogo: 'Sede della gilda', nemico: 'Spia addestrata (GS 3-4)', dettaglio: 'La spia ha mimetizzato le sue tracce scaricando i sospetti su altri.' },
        { titolo: 'Il Successore Sbagliato', obiettivo: 'Provare che il candidato al titolo nobiliare è un impostore.', luogo: 'Palazzo nobiliare', nemico: 'Guardie private + complici', dettaglio: 'L\'impostore crede di essere il vero erede — è stato ingannato anche lui.' },
        { titolo: 'Il Veleno Lento', obiettivo: 'Scoprire chi sta avvelenando lentamente il borgomastro senza che lui lo sappia.', luogo: 'Palazzo municipale', nemico: 'Avvelenatore professionista (GS 4)', dettaglio: 'Il movente è politico, ma l\'esecutore è personale.' },
      ],
      '11-16': [
        { titolo: 'Il Doppio Gioco', obiettivo: 'Smascherare un generale che serve contemporaneamente due regni nemici.', luogo: 'Quartier generale militare', nemico: 'Spie d\'élite (GS 5-7)', dettaglio: 'Il generale crede di poter controllare entrambi i regni. Potrebbe avere ragione.' },
        { titolo: 'Il Conclave dei Veleni', obiettivo: 'Infiltrarsi in una gilda di assassini e scoprire il prossimo obiettivo.', luogo: 'Rete di tunnel sotto la capitale', nemico: 'Assassini (GS 5-8)', dettaglio: 'Il prossimo obiettivo è qualcuno che il party conosce.' },
      ],
      '17-20': [
        { titolo: 'Il Grande Tradimento', obiettivo: 'Scoprire quale dei re alleati ha venduto i piani di guerra al nemico.', luogo: 'Concilio dei re + ambienti diplomatici', nemico: 'Nessun combattimento diretto — tutto è politica', dettaglio: 'Tutti e tre i re hanno buone ragioni. Uno solo ha tradito. O forse due.' },
      ],
    },

    salvataggio: {
      '1-4': [
        { titolo: 'Il Bambino nel Bosco', obiettivo: 'Trovare un bambino scomparso nel bosco prima che arrivi la notte.', luogo: 'Bosco vicino al villaggio', nemico: 'Goblin che l\'hanno catturato', dettaglio: 'Il bambino si è allontanato di proposito — stava inseguendo qualcosa.' },
        { titolo: 'I Minatori Intrappolati', obiettivo: 'Liberare un gruppo di minatori intrappolati da un crollo in miniera.', luogo: 'Miniera abbandonata', nemico: 'Bestie sotterranee risvegliate', dettaglio: 'Il crollo non è stato accidentale — qualcuno voleva tenerli dentro.' },
      ],
      '5-10': [
        { titolo: 'Il Prigioniero della Torre', obiettivo: 'Liberare un alchimista imprigionato da un nobile corrotto prima che venga giustiziato.', luogo: 'Torre di guardia del castello', nemico: 'Guardie (GS 1-3) + il nobile (GS 5)', dettaglio: 'L\'alchimista sa qualcosa sul nobile. Per questo è in prigione.' },
        { titolo: 'L\'Equipaggio Perduto', obiettivo: 'Salvare l\'equipaggio di una nave naufragata su un\'isola abitata da creature ostili.', luogo: 'Isola al largo della costa', nemico: 'Lizardfolk + creature dell\'isola', dettaglio: 'Due marinai si sono adattati all\'isola e non vogliono più andarsene.' },
        { titolo: 'La Città sotto Assedio', obiettivo: 'Infiltrarsi in una città assediata e aiutare i civili a fuggire dai tunnel sotterranei.', luogo: 'Città assediata + tunnel sotterranei', nemico: 'Soldati nemici + pericoli nei tunnel', dettaglio: 'Non tutti i civili possono essere salvati. Il party deve scegliere.' },
      ],
      '11-16': [
        { titolo: 'L\'Anima Imprigionata', obiettivo: 'Liberare l\'anima di un eroe del passato intrappolata in un oggetto maledetto da un lich.', luogo: 'Piano Astrale + sede del lich', nemico: 'Guardiani del lich (GS 8-12)', dettaglio: 'L\'eroe non vuole essere liberato — si sente in colpa per qualcosa.' },
        { titolo: 'Il Drago Prigioniero', obiettivo: 'Salvare un drago buono intrappolato in una gabbia magica da un culto.', luogo: 'Tempio del culto in caverna', nemico: 'Cultisti (GS 3-8) + guardiani costrutti', dettaglio: 'Il drago chiede di essere ucciso piuttosto che liberato così indebolito.' },
      ],
      '17-20': [
        { titolo: 'Il Mondo Intrappolato', obiettivo: 'Liberare un intero piano di esistenza intrappolato in una gemma da un archimago pazzo.', luogo: 'Dentro la gemma (piano in miniatura) + laboratorio dell\'archimago', nemico: 'L\'archimago (GS 20) + costrutti difensivi', dettaglio: 'Gli abitanti del piano intrappolato si sono adattati. Alcuni non vogliono uscire.' },
      ],
    },
  };

  const genera = () => {
    const livello  = document.getElementById('gen-miss-livello')?.value || '5-10';
    const tipo     = document.getElementById('gen-miss-tipo')?.value || 'tutti';
    const el       = document.getElementById('gen-miss-result');
    if (!el) return;

    let pool = [];
    const tipi = tipo === 'tutti' ? Object.keys(MISSIONI) : [tipo];
    tipi.forEach(t => {
      const missPerLiv = MISSIONI[t]?.[livello] || [];
      pool.push(...missPerLiv.map(m => ({ ...m, tipo: t })));
    });

    if (!pool.length) {
      el.innerHTML = '<div class="text-muted text-sm">Nessuna missione disponibile per questa combinazione. Prova un altro livello o tipo.</div>';
      return;
    }

    const missione = rnd(pool);
    const committente = rnd(COMMITTENTI[livello] || COMMITTENTI['5-10']);
    const ricompensa  = rnd(RICOMPENSE[livello] || RICOMPENSE['5-10']);
    const complicazione = rnd(COMPLICAZIONI[livello] || COMPLICAZIONI['5-10']);

    const tipoLabel = {
      caccia:'⚔️ Caccia/Sterminio', recupero:'📦 Recupero', scorta:'🛡️ Scorta',
      esplorazione:'🗺️ Esplorazione', intriga:'🎭 Intriga', salvataggio:'💚 Salvataggio'
    }[missione.tipo] || missione.tipo;

    const livLabel = { '1-4':'Liv. 1–4','5-10':'Liv. 5–10','11-16':'Liv. 11–16','17-20':'Liv. 17–20' }[livello] || livello;

    el.innerHTML =
      `<div style="margin-bottom:10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <span style="font-family:var(--font-display);font-size:1.05rem;color:var(--accent-secondary);">${missione.titolo}</span>
        <span class="badge badge-muted">${tipoLabel}</span>
        <span class="badge badge-muted">${livLabel}</span>
      </div>
      <div style="display:grid;gap:8px;font-size:0.83rem;">
        <div style="background:var(--bg-secondary);border-radius:var(--radius-sm);padding:8px 10px;">
          <div style="font-family:var(--font-display);font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">📋 Obiettivo</div>
          <div style="line-height:1.6;">${missione.obiettivo}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div style="background:var(--bg-secondary);border-radius:var(--radius-sm);padding:8px 10px;">
            <div style="font-family:var(--font-display);font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">👤 Committente</div>
            <div>${committente}</div>
          </div>
          <div style="background:var(--bg-secondary);border-radius:var(--radius-sm);padding:8px 10px;">
            <div style="font-family:var(--font-display);font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">📍 Luogo</div>
            <div>${missione.luogo}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div style="background:var(--bg-secondary);border-radius:var(--radius-sm);padding:8px 10px;">
            <div style="font-family:var(--font-display);font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">⚔️ Nemici</div>
            <div>${missione.nemico}</div>
          </div>
          <div style="background:var(--bg-secondary);border-radius:var(--radius-sm);padding:8px 10px;">
            <div style="font-family:var(--font-display);font-size:0.65rem;color:var(--accent-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">🎁 Ricompensa</div>
            <div style="color:var(--accent-secondary);">${ricompensa}</div>
          </div>
        </div>
        <div style="background:var(--bg-secondary);border-left:3px solid #e07b39;border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:8px 10px;">
          <div style="font-family:var(--font-display);font-size:0.65rem;color:#e07b39;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">💡 Dettaglio segreto</div>
          <div style="color:var(--text-secondary);font-style:italic;">${missione.dettaglio}</div>
        </div>
        <div style="background:var(--bg-secondary);border-left:3px solid var(--accent-danger);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:8px 10px;">
          <div style="font-family:var(--font-display);font-size:0.65rem;color:var(--accent-danger);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">⚡ Complicazione</div>
          <div style="color:var(--text-secondary);">${complicazione}</div>
        </div>
      </div>
      <button class="btn btn-ghost btn-sm w-full" style="margin-top:10px;font-size:0.72rem;" onclick="MissioniGen.genera()">🎲 Altra missione</button>`;

    Debug.log('Missione generata: ' + missione.titolo + ' [' + livello + '/' + missione.tipo + ']');
  };

  return { genera };
})();

const RNGLoot = (() => {

  let _rank = 'Minion';
  let _selectedCats = [];
  let _condition = null;
  let _multiplier = 1;

  const CATS = [
    { id:'humanoid-warrior',   name:'⚔️ Umanoidi — Guerriero',   prob:'Standard' },
    { id:'humanoid-caster',    name:'🧙 Umanoidi — Incantatore',  prob:'Standard' },
    { id:'humanoid-rogue',     name:'🏹 Umanoidi — Ladro/Ranger', prob:'Standard' },
    { id:'beasts',             name:'🐺 Bestie',                  prob:'Bestie'   },
    { id:'undead-physical',    name:'💀 Non Morti — Fisico',      prob:'Standard' },
    { id:'undead-incorporeal', name:'👻 Non Morti — Incorporeo',  prob:'Standard' },
    { id:'demons',             name:'😈 Demoni',                  prob:'Standard' },
    { id:'devils',             name:'🔱 Diavoli',                 prob:'Standard' },
    { id:'dragons',            name:'🐉 Draghi',                  prob:'Standard' },
    { id:'constructs',         name:'🤖 Costrutti',               prob:'Standard' },
    { id:'aberrations',        name:'🦑 Aberrazioni',             prob:'Standard' },
    { id:'fey-benevolent',     name:'🧚 Fate Benevole',           prob:'Standard' },
    { id:'fey-malevolent',     name:'🧟 Fate Malvagie',           prob:'Standard' },
    { id:'giants',             name:'🗿 Giganti',                  prob:'Standard' },
    { id:'oozes',              name:'🟢 Melme & Ooze',            prob:'Melme'    },
    { id:'plants',             name:'🌿 Piante',                  prob:'Piante'   },
    { id:'elemental-fire',     name:'🔥 Elementali — Fuoco',      prob:'Standard' },
    { id:'elemental-water',    name:'💧 Elementali — Acqua',      prob:'Standard' },
    { id:'elemental-earth',    name:'⛰️ Elementali — Terra',      prob:'Standard' },
    { id:'elemental-air',      name:'🌪️ Elementali — Aria',      prob:'Standard' },
    { id:'celestials',         name:'✨ Celestiali',               prob:'Celestiali'},
  ];

  const PROB = {
    Standard:   { Minion:[40,75,90,98,100,0],  Elite:[20,50,80,95,99,100],  Boss:[0,20,55,85,97,100]  },
    Bestie:     { Minion:[70,90,98,100,0,0],    Elite:[50,80,95,99,100,0],   Boss:[30,60,85,97,100,0]  },
    Melme:      { Minion:[80,95,99,100,0,0],    Elite:[60,85,97,100,0,0],    Boss:[40,70,90,98,100,0]  },
    Piante:     { Minion:[75,93,99,100,0,0],    Elite:[55,83,97,100,0,0],    Boss:[35,65,87,97,100,0]  },
    Celestiali: { Minion:[20,55,85,97,100,0],   Elite:[10,35,70,92,99,100],  Boss:[0,15,45,80,95,100]  },
  };
  const RARITIES = ['Niente','Comune','Non Comune','Raro','Epico','Leggendario'];
  const RARITY_COLOR = {
    'Niente':'var(--text-muted)','Comune':'var(--text-secondary)',
    'Non Comune':'#69cc85','Raro':'#5ba4f5','Epico':'#c97bea','Leggendario':'#f5a623',
  };

  const LOOT = {
    'humanoid-warrior':   { 'Comune':['2d6 monete d\'oro','Spada corta usurata','Scudo di legno scheggiato','Pozione di Guarigione','Torcia e acciarino','Razioni da viaggio (1d4 giorni)','Armatura di cuoio rattoppata','Fiala di veleno comune'],'Non Comune':['Spada lunga ben mantenuta','Cotta di maglia','Pozione di Guarigione Superiore','2d10 mo + 1d6 gemme grezze','Arco lungo con faretra (20 frecce)','Armatura di cuoio borchiato','Pergamena incantesimo 1° lv.','Mantello della Protezione'],'Raro':['Spada lunga +1','Armatura a maglie +1','Scudo +1','Pozione di Guarigione Suprema','Stivali di Elven Kind','Guanti dell\'Ogre','Pergamena incantesimo 3° lv.','Cintura della forza del gigante (minore)'],'Epico':['Spada lunga +2','Armatura a piastre +1','Scudo +2','Mantello di Spostamento','Anello di Protezione','Elmo della Telepatia','Stivali della Velocità','Guanti di Destrezza'],'Leggendario':['Spada lunga +3','Armatura a piastre +2','Spada Vorpal','Scudo +3','Mantello dell\'Invisibilità','Anello di Resistenza agli Incantesimi','Armatura Invulnerabile','Cintura della forza del gigante (superiore)'] },
    'humanoid-caster':    { 'Comune':['2d6 mo','Componenti materiali varie','Libro di appunti arcani','Candele e incenso rituale','Pozione di Guarigione','Bastone nodoso','Amuleto simbolico','Razioni ed erbe essiccate'],'Non Comune':['Pergamena incantesimo 1° lv.','Focus arcano di cristallo','Pozione di Chiaroveggenza','2d10 mo + simbolo cultista','Libro degli incantesimi (1d4 incant. 1° lv.)','Bacchetta con 1d4 cariche (1° lv.)','Pozione di Guarigione Superiore','Mantello della Protezione'],'Raro':['Libro degli incantesimi (1d4 incant. 2-3° lv.)','Bacchetta dei Dardi Magici','Pergamena incantesimo 3° lv.','Sfera di cristallo (minore)','Collana di Palle di Fuoco','Anello di Contenimento degli Incantesimi','Cappello dell\'Intelletto','Mantello dell\'Elfo'],'Epico':['Libro degli incantesimi (1d4 incant. 4-5° lv.)','Bacchetta dei Raggi di Gelo','Pergamena incantesimo 5° lv.','Sfera di Cristallo','Anello della Mente','Diadema dell\'Intelletto','Mantello del Mago','Bacchetta di Paralisi'],'Leggendario':['Libro degli incantesimi (1d4 incant. 6-9° lv.)','Bastone dei Maghi','Sfera di Cristallo superiore','Anello di Resistenza agli Incantesimi','Mantello dell\'Invisibilità','Amuleto della Salute','Bacchetta delle Meraviglie','Tomo della Comprensione'] },
    'humanoid-rogue':     { 'Comune':['2d6 mo','Pugnale affilato','Corda di canapa (15 m)','Kit da scasso','Faretra con 1d10 frecce','Mantello scuro consumato','Razioni da viaggio','Trappola da caccia'],'Non Comune':['Arco corto ben mantenuto','Due pugnali bilanciati','Mantello dell\'Elfo','Kit da scasso di qualità','Pozione di Guarigione Superiore','2d10 mo + mappa parziale','Stivali silenziosi','Veleno da contatto (1d4 dosi)'],'Raro':['Arco lungo +1','Pugnale +1','Stivali di Elven Kind','Mantello dell\'Elfo (magico)','Guanti del Ladro','Pozione di Invisibilità','Frecce di Ricerca (1d6)','Anello del Salto'],'Epico':['Arco lungo +2','Pugnale +2','Mantello di Spostamento','Stivali della Velocità','Anello dell\'Evasione','Occhiali della Notte','Scimitarra della Velocità','Bracciali della Difesa'],'Leggendario':['Arco lungo +3','Pugnale +3','Mantello dell\'Invisibilità','Anello dell\'Invisibilità','Stivali dei Piani','Guanti di Destrezza','Scimitarra della Velocità +3','Anello di Resistenza agli Incantesimi'] },
    'beasts':             { 'Comune':['Dente o artiglio (ricordo)','Collare bestia addestrata','Borsa marcia 1d6 mo (vittima)','Anello semplice (vittima)','Pugnale arrugginito (vittima)','Amuleto spezzato (vittima)','Monete sparse 1d10 (vittima)','Gemma grezza (vittima)'],'Non Comune':['Borsa 2d10 mo (vittima)','Anello d\'argento semplice (vittima)','Pozione di Guarigione (vittima)','Amuleto semplice (vittima)','Mappa parziale (vittima)','Pergamena incantesimo 1° lv. (vittima)','Gemme semipreziose 1d4 (vittima)','Sigillo nobiliare (vittima)'],'Raro':['Borsa 2d6 mo e gemme (vittima)','Anello di Protezione (vittima)','Amuleto della Salute (vittima)','Pozione di Guarigione Superiore (vittima)','Pergamena incantesimo 2-3° lv. (vittima)','Gemme preziose 1d4 (vittima)','Collana magica minore (vittima)','Medaglione dei Pensieri (vittima)'],'Epico':['Anello dell\'Evasione (vittima)','Anello della Mente (vittima)','Pozione di Guarigione Suprema (vittima)','Pergamena incantesimo 4-5° lv. (vittima)','Gemme rare 1d4 (vittima)','Amuleto degli Scudi (vittima)','Anello di Resistenza (vittima)','Collana di Adattamento (vittima)'] },
    'undead-physical':    { 'Comune':['1d6 mo arrugginite','Osso inciso con rune','Armatura di cuoio marcita','Spada corta scheggiata','Amuleto funerario semplice','Bende con unguenti','Simbolo religioso corrotto','Anello funerario semplice'],'Non Comune':['2d10 mo antiche','Spada lunga ben conservata','Armatura a maglie funzionale','Pozione di Guarigione','Amuleto oscuro','Pergamena incantesimo 1° lv. (oscuro)','Gemme funebri 1d4','Simbolo sacro profanato'],'Raro':['Spada lunga +1 (antica)','Armatura a maglie +1 (antica)','Amuleto della Salute','Pozione di Guarigione Superiore','Pergamena incantesimo 2-3° lv.','Anello di Protezione','Scudo +1 (antico)','Simbolo sacro animato'],'Epico':['Spada lunga +2 (con iscrizioni)','Armatura a piastre +1 (antica)','Mantello di Spostamento','Anello dell\'Evasione','Pergamena incantesimo 4-5° lv.','Scudo +2 (antico)','Elmo della Telepatia','Amuleto degli Scudi'],'Leggendario':['Spada lunga +3 (con nome)','Armatura a piastre +2','Falce della Morte','Anello di Resistenza agli Incantesimi','Mantello dell\'Invisibilità','Pergamena incantesimo 6-9° lv.','Corona del non morto','Amuleto della Salute superiore'] },
    'undead-incorporeal': { 'Comune':['Monete antiche sparse 1d10','Candele votive consumate','Libro di preghiere corrotto','Gemma grezza opaca','Lettera sbiadita illeggibile','Simbolo religioso abbandonato','Gioiello spezzato','Frammento di lapide'],'Non Comune':['2d10 mo antiche','Diario con indizi narrativi','Gemme funebri 1d4','Pergamena incantesimo 1° lv.','Gioiello antico integro','Simbolo sacro profanato funzionale','Pozione di Guarigione','Lettera con segreto narrativo'],'Raro':['Gemme preziose 1d4','Pergamena incantesimo 2-3° lv.','Anello di Protezione','Amuleto della Salute','Pozione di Guarigione Superiore','Libro degli incantesimi parziale','Gioiello antico (2d6×10 mo)','Medaglione dei Pensieri'],'Epico':['Pergamena incantesimo 4-5° lv.','Anello dell\'Evasione','Mantello di Spostamento','Gemme rare 1d4','Libro degli incantesimi completo','Diadema dell\'Intelletto','Pozione di Guarigione Suprema','Gioiello rarissimo (2d6×100 mo)'],'Leggendario':['Pergamena incantesimo 6-9° lv.','Anello di Resistenza agli Incantesimi','Mantello dell\'Invisibilità','Libro degli incantesimi leggendario','Corona antica','Amuleto della Salute superiore','Sfera di Cristallo','Reliquia sacra perduta'] },
    'demons':             { 'Comune':['Frammento osso demoniaco','Sangue dem. cristallizzato','Simbolo dell\'Abisso corrotto','Dente o artiglio demoniaco','Monete abissali','Amuleto corrotto','Frammento armatura inutilizzabile','Pietra abissale grezza'],'Non Comune':['Arma corrotta +0 (conta come magica)','Sangue dem. concentrato (veleno)','Pergamena incantesimo 1° lv. (oscuro)','Simbolo abissale funzionale','Gemme corrotte 1d4','Pozione di Guarigione (vittima)','Frammento pietra abissale rara','Amuleto della Resistenza minore'],'Raro':['Arma demoniaca +1 (maledetta)','Armatura demoniaca +1 (maledetta)','Pergamena incantesimo 2-3° lv.','Gemme abissali rare 1d4','Anello di Resistenza al Fuoco','Pozione di Resistenza','Amuleto della Salute corrotto','Scudo demoniaco +1'],'Epico':['Arma demoniaca +2','Armatura demoniaca +1 (pesante)','Pergamena incantesimo 4-5° lv.','Anello di Resistenza agli Elementi','Mantello di Spostamento corrotto','Gemme abissali leggendarie 1d4','Amuleto degli Scudi demoniaco','Scudo demoniaco +2'],'Leggendario':['Arma demoniaca +3 (fortemente maledetta)','Armatura demoniaca +2','Pergamena incantesimo 6-9° lv.','Anello di Resistenza agli Incantesimi','Mantello dell\'Invisibilità corrotto','Reliquia abissale','Sfera di Cristallo corrotta','Corona demoniaca'] },
    'devils':             { 'Comune':['Contratto infernale vuoto','Monete infernali nere','Simbolo delle Nove Inferno','Gemma rossa grezza','Sigillo di un Arcidiavolo','Penna di scrittura infernale','Frammento armatura infernale','Pietra infernale levigata'],'Non Comune':['Contratto infernale parziale','Arma infernale +0','Pergamena incantesimo 1° lv.','Gemme rosse 1d4','Simbolo infernale funzionale','Pozione di Resistenza al Fuoco','Amuleto infernale minore','Sigillo di convocazione'],'Raro':['Arma infernale +1','Armatura infernale +1','Pergamena incantesimo 2-3° lv.','Contratto con clausola attiva','Anello di Resistenza al Fuoco','Gemme preziose infernali 1d4','Amuleto della Salute infernale','Scudo infernale +1'],'Epico':['Arma infernale +2','Armatura infernale +1 (pesante)','Pergamena incantesimo 4-5° lv.','Contratto con potere attivo','Anello di Resistenza agli Elementi','Mantello di Spostamento infernale','Diadema dell\'Intelletto infernale','Scudo infernale +2'],'Leggendario':['Arma infernale +3','Armatura infernale +2','Pergamena incantesimo 6-9° lv.','Contratto leggendario','Anello di Resistenza agli Incantesimi','Mantello dell\'Invisibilità infernale','Corona infernale','Reliquia delle Nove Inferno'] },
    'dragons':            { 'Comune':['4d6 mo','Gemme grezze 1d6','Gioiello antico semplice','Arma mundana di qualità','Monete di civiltà scomparse','Scultura preziosa piccola (2d6×10 mo)','Armatura mundana di qualità','Pergamena incantesimo 1° lv.'],'Non Comune':['4d10 mo + 1d6 gemme','Gemme semipreziose 1d6','Gioiello antico elaborato (2d6×50 mo)','Spada lunga di qualità superiore','Pozione di Guarigione Superiore (1d4 fiale)','Pergamena incantesimo 2-3° lv.','Scultura preziosa rara','Armatura a maglie di qualità superiore'],'Raro':['4d10×10 mo + gemme preziose','Spada lunga +1 (antica)','Armatura a maglie +1 (antica)','Pozione di Guarigione Suprema (1d4 fiale)','Pergamena incantesimo 3-4° lv.','Anello di Protezione','Gemme rare 1d6','Opera d\'arte rarissima'],'Epico':['4d10×100 mo + gemme leggendarie','Spada lunga +2 (con nome)','Armatura a piastre +1 (antica)','Mantello di Spostamento','Pergamena incantesimo 5-6° lv.','Anello di Resistenza agli Incantesimi','Sfera di Cristallo','Opera d\'arte leggendaria'],'Leggendario':['4d10×1000 mo + gemme rarissime','Spada lunga +3 (leggendaria)','Armatura a piastre +2 (leggendaria)','Mantello dell\'Invisibilità','Pergamena incantesimo 7-9° lv.','Bastone dei Maghi','Anello dei Tre Desideri','Reliquia draconiana unica'] },
    'constructs':         { 'Comune':['Ingranaggi e viti metalliche','Frammento pietra incisa','Monete del creatore 1d6','Strumenti da fabbro semplici','Simbolo del creatore inciso','Frammento armatura metallica','Pietra grezza non incantata','Documento tecnico illeggibile'],'Non Comune':['Nucleo energetico minore','Monete del creatore 2d10','Pergamena incantesimo 1° lv.','Strumenti da fabbro di qualità','Gemme grezze 1d4','Documento tecnico leggibile','Pozione di Guarigione','Amuleto del creatore'],'Raro':['Nucleo energetico (focus arcano)','Pergamena incantesimo 2-3° lv.','Gemme preziose 1d4','Anello di Protezione','Pozione di Guarigione Superiore','Documento tecnico raro','Armatura di cuoio +1','Amuleto della Salute'],'Epico':['Nucleo energetico superiore','Pergamena incantesimo 4-5° lv.','Gemme rare 1d4','Anello di Resistenza agli Incantesimi','Mantello di Spostamento','Documento tecnico leggendario','Diadema dell\'Intelletto','Armatura a maglie +1'],'Leggendario':['Nucleo energetico leggendario','Pergamena incantesimo 6-9° lv.','Gemme leggendarie 1d4','Anello dei Tre Desideri','Mantello dell\'Invisibilità','Bastone dei Maghi','Sfera di Cristallo superiore','Tomo della Comprensione'] },
    'aberrations':        { 'Comune':['Frammento chitinoso','Monete vittima 1d6','Occhio cristallizzato','Simbolo psionico inciso','Amuleto vittima','Pietra extraplanare grezza','Documento illeggibile','Gemma grezza opaca'],'Non Comune':['Monete 2d10','Cristallo psionico minore','Pergamena incantesimo 1° lv.','Gemme grezze 1d4','Amuleto della Salute (vittima)','Documento parziale leggibile','Pozione di Guarigione','Pietra extraplanare rara'],'Raro':['Cristallo psionico','Pergamena incantesimo 2-3° lv.','Gemme preziose 1d4','Anello di Protezione','Elmo della Telepatia','Pozione di Guarigione Superiore','Medaglione dei Pensieri','Documento raro'],'Epico':['Cristallo psionico superiore','Pergamena incantesimo 4-5° lv.','Diadema dell\'Intelletto','Gemme rare 1d4','Anello della Mente','Mantello di Spostamento','Sfera di Cristallo','Elmo della Brillanza'],'Leggendario':['Cristallo psionico leggendario','Pergamena incantesimo 6-9° lv.','Anello di Resistenza agli Incantesimi','Mantello dell\'Invisibilità','Sfera di Cristallo superiore','Tomo della Comprensione','Reliquia extraplanare unica','Corona psionica'] },
    'fey-benevolent':     { 'Comune':['Fiori magici appassiti','Bacche selvatiche','Monete fatate','Piuma colorata rara','Pietra levigata con runa','Filo d\'oro fatato','Gemma grezza luminosa','Foglia perennemente verde'],'Non Comune':['Pozione di Guarigione fatata','Pergamena incantesimo 1° lv. (natura)','Gemme luminose 1d4','Polvere fatata','Amuleto della natura','Monete d\'oro fatate 2d10','Fiala di rugiada (Guarigione Superiore)','Simbolo druidico funzionale'],'Raro':['Pergamena incantesimo 2-3° lv. (natura)','Mantello dell\'Elfo','Stivali di Elven Kind','Pozione di Guarigione Superiore fatata','Gemme rare luminose 1d4','Anello di Protezione fatato','Bacchetta fatata','Amuleto della Salute fatato'],'Epico':['Pergamena incantesimo 4-5° lv.','Mantello di Spostamento fatato','Stivali della Velocità fatati','Anello dell\'Evasione','Gemme leggendarie luminose 1d4','Bacchetta delle Meraviglie','Diadema dell\'Intelletto fatato','Arpa delle Fate'],'Leggendario':['Pergamena incantesimo 6-9° lv.','Mantello dell\'Invisibilità fatato','Anello dei Tre Desideri fatato','Reliquia fatata unica','Corona delle Fate','Bacchetta leggendaria','Tomo della Comprensione fatato','Sfera di Cristallo fatata'] },
    'fey-malevolent':     { 'Comune':['Osso inciso con maledizione','Monete fatate corrotte','Erbe velenose essiccate','Occhio di vetro inquietante','Dente di creatura sconosciuta','Filo nero intrecciato con capelli','Gemma grezza opaca','Simbolo maledetto'],'Non Comune':['Pozione di veleno','Pergamena incantesimo 1° lv. (oscuro)','Gemme corrotte 1d4','Ingredienti per rituale','Amuleto maledetto minore','Monete d\'oro corrotte 2d10','Libro di ricette oscure','Simbolo fatato corrotto funzionale'],'Raro':['Pergamena incantesimo 2-3° lv. (oscuro)','Pozione di Guarigione Superiore (rubata)','Gemme preziose corrotte 1d4','Anello di Protezione maledetto','Mantello dell\'Elfo corrotto','Bacchetta corrotta','Libro degli incantesimi oscuro parziale','Amuleto della Salute corrotto'],'Epico':['Pergamena incantesimo 4-5° lv.','Mantello di Spostamento corrotto','Gemme rare corrotte 1d4','Anello dell\'Evasione corrotto','Libro degli incantesimi oscuro completo','Diadema dell\'Intelletto corrotto','Bacchetta delle Meraviglie corrotta','Reliquia fatata oscura'],'Leggendario':['Pergamena incantesimo 6-9° lv.','Mantello dell\'Invisibilità corrotto','Anello dei Tre Desideri corrotto (maledetto)','Corona delle Fate Oscure','Reliquia maledetta leggendaria','Sfera di Cristallo oscura','Tomo della Comprensione oscuro','Bacchetta leggendaria corrotta'] },
    'giants':             { 'Comune':['4d6 mo','Gemme grezze 1d4 (ciondoli)','Arma taglia enorme inutilizzabile','Oggetto mundano schiacciato','Osso enorme intagliato','Pelle animale grezza','Monete antiche schiacciate 1d10','Pietra decorativa'],'Non Comune':['2d10×10 mo','Gemme semipreziose 1d4','Arma taglia normale (rubata)','Pozione di Guarigione (rubata)','Gioiello rozzo (2d6×50 mo)','Pergamena incantesimo 1° lv. (rubata)','Scultura rozza (2d6×100 mo)','Armatura taglia normale (rubata)'],'Raro':['2d10×100 mo','Gemme preziose 1d4','Spada lunga +1 (rubata)','Armatura a maglie +1 (rubata)','Pozione di Guarigione Superiore','Pergamena incantesimo 2-3° lv.','Gioiello antico (2d6×250 mo)','Anello di Protezione (rubato)'],'Epico':['2d10×500 mo + gemme rare','Spada lunga +2 (rubata)','Armatura a piastre +1 (rubata)','Mantello di Spostamento (rubato)','Pergamena incantesimo 4-5° lv.','Anello di Resistenza agli Incantesimi','Opera d\'arte leggendaria','Scudo +2 (rubato)'],'Leggendario':['2d10×1000 mo + gemme leggendarie','Spada lunga +3 (leggendaria)','Armatura a piastre +2 (leggendaria)','Mantello dell\'Invisibilità','Pergamena incantesimo 6-9° lv.','Bastone dei Maghi (rubato)','Anello dei Tre Desideri','Reliquia dei giganti'] },
    'oozes':              { 'Comune':['Monete corrose 1d6','Gemma grezza resistente agli acidi','Frammento metallico inutilizzabile','Anello semplice corroso','Amuleto parzialmente dissolto','Pietra resistente agli acidi','Monete d\'oro 1d10 resistenti','Dente o osso resistente'],'Non Comune':['Monete 2d10 resistenti','Gemme semipreziose 1d4 (insolubili)','Anello d\'argento integro (vittima)','Amuleto integro (vittima)','Pergamena magica resistente 1° lv.','Gemme luminose resistenti 1d4','Pozione di Guarigione integra (vittima)','Gioiello resistente (2d6×10 mo)'],'Raro':['Gemme preziose resistenti 1d4','Anello di Protezione (vittima)','Amuleto della Salute (vittima)','Pergamena incantesimo 2-3° lv.','Pozione di Guarigione Superiore integra','Medaglione dei Pensieri (vittima)','Gioiello raro resistente (2d6×100 mo)','Anello di Resistenza agli Elementi'],'Epico':['Gemme rare resistenti 1d4','Anello dell\'Evasione','Pergamena incantesimo 4-5° lv.','Anello di Resistenza agli Incantesimi','Sfera di Cristallo integra (vittima)','Diadema dell\'Intelletto (vittima)','Gioiello leggendario resistente','Reliquia resistente (effetto DM)'] },
    'plants':             { 'Comune':['Bacche velenose','Monete 1d6 (vittima)','Radice rara','Gemma grezza intrappolata','Seme magico dormiente','Anello semplice (vittima)','Frammento di legno duro','Amuleto intrappolato (vittima)'],'Non Comune':['Monete 2d10 (vittima)','Gemme grezze 1d4','Pergamena incantesimo 1° lv. (vittima)','Pozione di Guarigione (vittima)','Anello d\'argento (vittima)','Amuleto della natura funzionale','Seme magico attivo (effetto DM)','Gioiello intrappolato (2d6×10 mo)'],'Raro':['Gemme preziose 1d4','Pergamena incantesimo 2-3° lv.','Anello di Protezione (vittima)','Pozione di Guarigione Superiore','Amuleto della Salute (vittima)','Bastone druidico +1','Gioiello raro (2d6×100 mo)','Seme leggendario (effetto narrativo)'],'Epico':['Gemme rare 1d4','Pergamena incantesimo 4-5° lv.','Bastone druidico +2','Anello della natura (effetto DM)','Mantello dell\'Elfo superiore','Diadema vegetale (effetto DM)','Reliquia naturale unica','Seme leggendario potenziato'] },
    'elemental-fire':     { 'Comune':['Cenere magica','Pietra vulcanica rara','Monete fuse e deformate','Cristallo di fuoco grezzo','Frammento di ossidiana','Gemma grezza annerita','Simbolo elementale del fuoco','Carbone magico'],'Non Comune':['Cristallo di fuoco (focus arcano)','Gemme grezze resistenti al fuoco 1d4','Pergamena incantesimo 1° lv. (fuoco)','Pozione di Resistenza al Fuoco','Pietra vulcanica lavorata (2d6×10 mo)','Amuleto resistenza fuoco minore','Monete d\'oro fuse recuperabili 2d10','Simbolo elementale funzionale'],'Raro':['Cristallo di fuoco superiore','Pergamena incantesimo 2-3° lv. (fuoco)','Anello di Resistenza al Fuoco','Gemme preziose resistenti al fuoco 1d4','Pozione di Resistenza al Fuoco superiore','Armatura +1 resistente al fuoco','Pietra del fuoco elementale (effetto DM)','Amuleto resistenza al fuoco'],'Epico':['Cristallo di fuoco leggendario','Pergamena incantesimo 4-5° lv.','Anello di Immunità al Fuoco','Armatura +2 resistente al fuoco','Mantello resistenza al fuoco','Gemme rare elementali 1d4','Spada Fiammeggiante +2','Reliquia elementale del fuoco'],'Leggendario':['Cuore elementale del fuoco','Pergamena incantesimo 6-9° lv.','Spada Fiammeggiante +3','Armatura +2 con immunità al fuoco','Anello dei Tre Desideri elementale','Mantello dell\'Invisibilità elementale','Bastone del fuoco leggendario','Reliquia elementale leggendaria'] },
    'elemental-water':    { 'Comune':['Perla grezza','Conchiglia rara','Pietra levigata dall\'acqua','Cristallo d\'acqua grezzo','Alghe magiche essiccate','Gemma grezza bagnata','Simbolo elementale dell\'acqua','Sale marino cristallizzato'],'Non Comune':['Cristallo d\'acqua (focus arcano)','Perle semipreziose 1d4','Pergamena incantesimo 1° lv. (acqua)','Pozione di Respirazione Acquatica','Pietra marina lavorata (2d6×10 mo)','Amuleto resistenza freddo minore','Monete recuperate dal fondale 2d10','Simbolo elementale funzionale'],'Raro':['Cristallo d\'acqua superiore','Pergamena incantesimo 2-3° lv.','Anello di Resistenza al Freddo','Perle preziose 1d4','Pozione Respirazione Acquatica superiore','Stivali del camminatore sulle acque','Amuleto della resistenza al freddo','Tridente +1 elementale'],'Epico':['Cristallo d\'acqua leggendario','Pergamena incantesimo 4-5° lv.','Anello di Immunità al Freddo','Perle rare 1d4','Mantello resistenza al freddo','Tridente +2 elementale','Stivali del camminatore sulle acque sup.','Reliquia elementale dell\'acqua'],'Leggendario':['Cuore elementale dell\'acqua','Pergamena incantesimo 6-9° lv.','Tridente +3 elementale','Anello dei Tre Desideri elementale','Mantello dell\'Invisibilità elementale','Bastone dell\'acqua leggendario','Perle leggendarie 1d4','Reliquia elementale leggendaria'] },
    'elemental-earth':    { 'Comune':['Pietra rara non lavorata','Cristallo di terra grezzo','Gemma grezza estratta','Minerale raro grezzo','Frammento di roccia magica','Polvere di pietra magica','Simbolo elementale della terra','Cristallo di quarzo grezzo'],'Non Comune':['Cristallo di terra (focus arcano)','Gemme grezze 1d4','Pergamena incantesimo 1° lv. (terra)','Minerale raro lavorato (2d6×10 mo)','Pozione di Resistenza agli Acidi','Amuleto resistenza acidi minore','Monete estratte dalla roccia 2d10','Simbolo elementale funzionale'],'Raro':['Cristallo di terra superiore','Pergamena incantesimo 2-3° lv.','Anello di Resistenza agli Acidi','Gemme preziose 1d4','Armatura di pietra +1','Amuleto della resistenza alla pietra','Minerale leggendario grezzo','Scudo di pietra +1 elementale'],'Epico':['Cristallo di terra leggendario','Pergamena incantesimo 4-5° lv.','Anello di Immunità agli Acidi','Gemme rare 1d4','Armatura di pietra +2','Scudo di pietra +2 elementale','Minerale rarissimo (2d6×500 mo)','Reliquia elementale della terra'],'Leggendario':['Cuore elementale della terra','Pergamena incantesimo 6-9° lv.','Armatura di pietra +3 leggendaria','Anello dei Tre Desideri elementale','Mantello dell\'Invisibilità elementale','Bastone della terra leggendario','Gemme leggendarie 1d4','Reliquia elementale leggendaria'] },
    'elemental-air':      { 'Comune':['Piuma rara','Cristallo d\'aria grezzo','Polvere di vento cristallizzata','Gemma grezza trasparente','Frammento di nuvola solidificata','Simbolo elementale dell\'aria','Pietra levigata dal vento','Piuma magica'],'Non Comune':['Cristallo d\'aria (focus arcano)','Gemme grezze trasparenti 1d4','Pergamena incantesimo 1° lv. (aria)','Pozione di Volare minore (effetto DM)','Piume rare preziose (2d6×10 mo)','Amuleto della caduta lenta','Monete portate dal vento 2d10','Simbolo elementale funzionale'],'Raro':['Cristallo d\'aria superiore','Pergamena incantesimo 2-3° lv.','Anello di Caduta Lenta','Gemme trasparenti preziose 1d4','Stivali del vento (effetto DM)','Mantello della resistenza al fulmine','Piume leggendarie (2d6×100 mo)','Arco del vento +1'],'Epico':['Cristallo d\'aria leggendario','Pergamena incantesimo 4-5° lv.','Anello di Immunità al Fulmine','Stivali del vento superiori','Mantello dell\'Invisibilità elementale','Arco del vento +2','Gemme trasparenti rare 1d4','Reliquia elementale dell\'aria'],'Leggendario':['Cuore elementale dell\'aria','Pergamena incantesimo 6-9° lv.','Arco del vento +3','Anello dei Tre Desideri elementale','Mantello dell\'Invisibilità elementale sup.','Bastone dell\'aria leggendario','Gemme trasparenti leggendarie 1d4','Reliquia elementale leggendaria'] },
    'celestials':         { 'Comune':['Piuma celestiale','Simbolo sacro semplice','Monete d\'oro benedette 1d6','Cristallo di luce grezzo','Pergamena di preghiera','Gemma grezza luminosa','Amuleto sacro semplice','Pietra benedetta'],'Non Comune':['Simbolo sacro funzionale','Pozione di Guarigione benedetta','Pergamena incantesimo 1° lv. (divino)','Gemme luminose 1d4','Monete d\'oro benedette 2d10','Amuleto della protezione sacra minore','Piume celestiali preziose (2d6×10 mo)','Cristallo di luce (focus divino)'],'Raro':['Pergamena incantesimo 2-3° lv. (divino)','Simbolo sacro +1','Armatura benedetta +1','Pozione di Guarigione Superiore benedetta','Anello di Protezione sacra','Gemme celestiali rare 1d4','Amuleto della Salute benedetto','Scudo sacro +1'],'Epico':['Pergamena incantesimo 4-5° lv. (divino)','Armatura benedetta +2','Spada sacra +2','Anello di Resistenza agli Incantesimi sacro','Mantello di Spostamento benedetto','Gemme celestiali 1d4','Diadema della saggezza celestiale','Scudo sacro +2'],'Leggendario':['Pergamena incantesimo 6-9° lv. (divino)','Armatura celestiale +3','Spada sacra +3','Anello dei Tre Desideri benedetto','Mantello dell\'Invisibilità benedetto','Bastone della saggezza divina','Reliquia celestiale unica','Corona celestiale'] },
  };

  const SPELLS = {
    1:['Dardo Incantato','Mani Brucianti','Charme su Persone','Dardo di Acido','Scudo','Sonno','Dardo di Gelo','Dardo di Fuoco'],
    2:['Freccia Acida di Melf','Invisibilità','Oscurità','Ragnatela','Forza Fantasma','Suggestionare','Immagine Speculare','Nebbia Assassina'],
    3:['Palla di Fuoco','Fulmine','Volare','Contrincantesimo','Dissolvere Magie','Ipnosi','Frecce di Fulmine','Timore'],
    4:['Muro di Fuoco','Polimorfismo','Sfera Infuocata di Otiluke','Occhio Arcano','Grande Invisibilità','Confusione','Porta Dimensionale','Individuazione della Sfera'],
    5:['Cono di Freddo','Animare Morti','Nube Mortale','Dominare Persone','Muro di Forza','Telecinesi','Modificare Memoria','Legame Planare'],
    6:['Disintegrazione','Catena di Fulmini','Visione Vera','Sfera di Annientamento','Suggestione di Massa','Individuazione del Pensiero'],
    7:['Dito della Morte','Teletrasporto','Inversione della Gravità','Prisma Spettrale','Tempesta di Fuoco','Forma Eterea'],
    8:['Terremoto','Mente Vuota','Dominare Mostri','Nube Incendiaria'],
    9:['Desiderio','Meteora','Proiezione Astrale','Arresto del Tempo'],
  };

  const rnd = (a) => a[Math.floor(Math.random() * a.length)];

  const rollRarity = (catId, rank) => {
    const cat = CATS.find(c => c.id === catId);
    const probKey = cat?.prob || 'Standard';
    const probs = PROB[probKey]?.[rank] || PROB.Standard.Minion;
    const d100 = Math.floor(Math.random() * 100) + 1;
    let cum = 0;
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] === 0) continue;
      cum += probs[i];
      if (d100 <= cum) return { rarity: RARITIES[i], d100 };
    }
    return { rarity: 'Niente', d100 };
  };

  const luckyCheck = (rarity, d100) => {
    if (rarity === 'Niente' || rarity === 'Leggendario') return { rarity, lucky: false };
    if (d100 !== 75 && d100 !== 90) return { rarity, lucky: false };
    const d4 = Math.floor(Math.random() * 4) + 1;
    if (d4 <= 2) return { rarity, lucky: false };
    const up = {'Comune':'Non Comune','Non Comune':'Raro','Raro':'Epico','Epico':'Leggendario'};
    return { rarity: up[rarity] || rarity, lucky: true };
  };

  const getItem = (catId, rarity) => {
    if (rarity === 'Niente') return null;
    const items = LOOT[catId]?.[rarity] || [];
    if (!items.length) return null;
    let item = rnd(items);

    const m2 = item.match(/(\d+)-(\d+)°\s*lv/);
    const m1 = item.match(/(\d+)°\s*lv/);
    if (m2) {
      const l1 = parseInt(m2[1]), l2 = parseInt(m2[2]);
      const lvl = l1 + Math.floor(Math.random() * (l2 - l1 + 1));
      item += ` → ${rnd(SPELLS[lvl] || SPELLS[1])} (${lvl}° lv.)`;
    } else if (m1) {
      const lvl = parseInt(m1[1]);
      item += ` → ${rnd(SPELLS[lvl] || SPELLS[1])}`;
    }
    return item;
  };

  const init = () => {
    const grid = document.getElementById('rng-cat-grid');
    if (!grid || grid.children.length > 0) return;
    grid.innerHTML = CATS.map(cat =>
      `<button class="btn btn-ghost btn-sm" id="rng-cat-${cat.id}"
        style="text-align:left;padding:4px 8px;font-size:0.72rem;"
        onclick="RNGLoot.toggleCat('${cat.id}')">${cat.name}</button>`
    ).join('');

    _selectedCats = [CATS[0].id];
    renderCats();
    setRank('Minion');
    _condition = null;
  };

  const renderCats = () => {
    CATS.forEach(cat => {
      const btn = document.getElementById('rng-cat-' + cat.id);
      if (!btn) return;
      const sel = _selectedCats.includes(cat.id);
      btn.className = sel ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
      btn.style.textAlign = 'left';
      btn.style.padding = '4px 8px';
      btn.style.fontSize = '0.72rem';
    });
  };

  const toggleCat = (id) => {
    if (_rank === 'Minion') {

      if (_selectedCats.includes(id)) {
        if (_selectedCats.length > 1) _selectedCats = _selectedCats.filter(c => c !== id);
      } else {
        _selectedCats = [..._selectedCats, id];
      }
    } else {

      _selectedCats = [id];
    }
    renderCats();
  };

  const setRank = (rank) => {
    _rank = rank;

    if (rank !== 'Minion' && _selectedCats.length > 1) {
      _selectedCats = [_selectedCats[0]];
    }

    ['Minion','Elite','Boss'].forEach(r => {
      const btn = document.getElementById('rng-rank-' + r);
      if (btn) btn.className = r === rank ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
    });

    const hint = document.getElementById('rng-cat-hint');
    if (hint) hint.textContent = rank === 'Minion' ? '— Minion: clicca più categorie' : '— ' + rank + ': selezione singola';
    renderCats();
  };

  const setCond = (cond) => {
    _condition = cond;

    ['intatto','danneggiato','inutilizzabile','maledetto'].forEach(c => {
      const btn = document.getElementById('rng-cond-' + c);
      if (!btn) return;
      const key = c;
      btn.className = _condition === key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
    });
  };

  const adjMult = (delta) => {
    const el = document.getElementById('rng-multiplier');
    if (!el) return;
    _multiplier = Math.max(1, Math.min(99, (_multiplier || 1) + delta));
    el.value = _multiplier;
  };

  const setMult = (val) => {
    _multiplier = Math.max(1, Math.min(99, parseInt(val) || 1));
    const el = document.getElementById('rng-multiplier');
    if (el) el.value = _multiplier;
  };

  const genera = () => {
    const el = document.getElementById('gen-loot-result');
    if (!el) return;
    if (!_selectedCats.length) { Toast.show('Seleziona almeno una categoria', 'warning'); return; }
    const n = _multiplier || 1;

    const results = [];
    for (let i = 0; i < n; i++) {

      const catId = rnd(_selectedCats);
      const { rarity: r0, d100 } = rollRarity(catId, _rank);
      const { rarity, lucky } = luckyCheck(r0, d100);
      const item = getItem(catId, rarity);
      const catName = CATS.find(c => c.id === catId)?.name || catId;

      const condLabel = _condition && item ? ({
        intatto:'✓ Intatto', danneggiato:'⚠ Danneggiato',
        inutilizzabile:'✗ Inutilizzabile', maledetto:'☠ Maledetto',
      }[_condition] || '') : '';
      results.push({ n: i+1, catId, catName, rarity, d100, lucky, item, condLabel });
    }

    const withLoot = results.filter(r => r.rarity !== 'Niente').length;
    const summary = ['Comune','Non Comune','Raro','Epico','Leggendario'].map(r => {
      const cnt = results.filter(x => x.rarity === r).length;
      return cnt ? `<span style="color:${RARITY_COLOR[r]}">${cnt}× ${r}</span>` : '';
    }).filter(Boolean).join('  ');

    el.innerHTML =
      `<div style="font-size:0.75rem;margin-bottom:8px;">${withLoot}/${n} tiri con loot — ${summary || '<span class="text-muted">Nessun loot</span>'}</div>` +
      `<div style="display:flex;flex-direction:column;gap:4px;">` +
      results.map(r =>
        r.rarity === 'Niente'
          ? `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--border);">
              <span style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);min-width:28px;">#${r.n}</span>
              <span style="font-size:0.7rem;color:var(--text-muted);">d100: ${r.d100}</span>
              <span style="color:var(--text-muted);font-size:0.78rem;">💀 Nessun loot</span>
            </div>`
          : `<div style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;border-bottom:1px solid var(--border);">
              <span style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);min-width:28px;flex-shrink:0;">#${r.n}</span>
              <div style="min-width:0;flex:1;">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <span style="font-size:0.68rem;color:var(--text-muted);">d100:${r.d100}</span>
                  <span style="font-size:0.72rem;color:${RARITY_COLOR[r.rarity]};font-weight:600;">${r.rarity}${r.lucky ? ' ✨' : ''}</span>
                  <span style="font-size:0.65rem;color:var(--text-muted);">${n > 1 && _selectedCats.length > 1 ? r.catName : ''}</span>
                </div>
                <div style="font-size:0.82rem;margin-top:2px;">🎁 ${r.item}${r.condLabel ? ` <span style="font-size:0.68rem;color:var(--text-muted);">(${r.condLabel})</span>` : ''}</div>
              </div>
            </div>`
      ).join('') +
      `</div>` +
      `<button class="btn btn-ghost btn-sm w-full" style="margin-top:8px;font-size:0.72rem;" onclick="RNGLoot.genera()">🎲 Tira ancora ×${n}</button>`;

    Debug.log('RNGLoot: ' + n + '× ' + _rank + ' → ' + withLoot + ' con loot');
  };

  return { init, toggleCat, setRank, setCond, adjMult, setMult, genera };
})();

const LootPanel = (() => {
  const switchTab = (tab) => {
    const rng = document.getElementById('loot-panel-rng');
    const dmg = document.getElementById('loot-panel-dmg');
    const btnRng = document.getElementById('loot-tab-rng');
    const btnDmg = document.getElementById('loot-tab-dmg');
    if (!rng || !dmg) return;
    if (tab === 'rng') {
      rng.style.display = ''; dmg.style.display = 'none';
      btnRng?.classList.replace('btn-ghost','btn-primary');
      btnDmg?.classList.replace('btn-primary','btn-ghost');
    } else {
      rng.style.display = 'none'; dmg.style.display = '';
      btnRng?.classList.replace('btn-primary','btn-ghost');
      btnDmg?.classList.replace('btn-ghost','btn-primary');
    }
  };
  const loadIframe = () => {
    const iframe = document.getElementById('loot-dmg-iframe');
    const ph = document.getElementById('loot-iframe-placeholder');
    if (!iframe) return;
    iframe.src = iframe.dataset.src || 'https://dnd-loot-generator-sepia.vercel.app/';
    if (ph) ph.style.display = 'none';
  };
  return { switchTab, loadIframe };
})();

const TimerBlock = (() => {
  const _timers = {};

  const init = (blockId, el) => {
    if (_timers[blockId]?.interval) clearInterval(_timers[blockId].interval);
    if (!_timers[blockId]) _timers[blockId] = { remaining: 0, running: false, started: false };

    _render(blockId, el || _el(blockId));
  };

  const _el = (blockId) => document.querySelector(`#sblock-${blockId} .schermo-block-body`);

  const _render = (blockId, el) => {
    const container = el || _el(blockId);
    if (!container) return;
    const t = _timers[blockId] || { remaining: 0, running: false, started: false };
    const rem = Math.max(0, t.remaining);
    const m = Math.floor(rem / 60);
    const s = rem % 60;
    const display = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    const isAlarm = rem === 0 && t.started;
    const color = isAlarm ? 'var(--accent-danger)' : t.running ? 'var(--accent-primary)' : 'var(--text-primary)';

    container.innerHTML =
      '<div style="text-align:center;">' +
        '<div id="td-' + blockId + '" style="font-family:var(--font-mono);font-size:2.4rem;font-weight:900;color:' + color + ';letter-spacing:2px;margin-bottom:6px;">' + display + '</div>' +
        (isAlarm ? '<div style="font-size:0.78rem;color:var(--accent-danger);font-weight:700;margin-bottom:6px;">⏰ TEMPO SCADUTO!</div>' : '') +
        '<div style="display:flex;gap:4px;justify-content:center;margin-bottom:6px;">' +
          (t.running
            ? '<button class="btn btn-secondary btn-sm" onclick="TimerBlock.pause(\'' + blockId + '\')">⏸ Pausa</button>'
            : '<button class="btn btn-primary btn-sm" onclick="TimerBlock.start(\'' + blockId + '\')"' + (rem===0&&!t.started?' disabled':'') + '>▶ Avvia</button>'
          ) +
          '<button class="btn btn-ghost btn-sm" onclick="TimerBlock.reset(\'' + blockId + '\')">↺</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin-bottom:6px;">' +
          [['1m',60],['3m',180],['5m',300],['10m',600]].map(function(x){ return '<button class="btn btn-ghost btn-sm" style="font-size:0.7rem;padding:3px;" onclick="TimerBlock.set(\'' + blockId + '\',' + x[1] + ')">' + x[0] + '</button>'; }).join('') +
        '</div>' +
        '<div style="display:flex;gap:3px;align-items:center;justify-content:center;">' +
          '<input type="number" id="tm-' + blockId + '" placeholder="min" min="0" max="99" class="form-input" style="width:46px;text-align:center;font-size:0.8rem;padding:4px;">' +
          '<span style="color:var(--text-muted);">:</span>' +
          '<input type="number" id="ts-' + blockId + '" placeholder="ss" min="0" max="59" class="form-input" style="width:46px;text-align:center;font-size:0.8rem;padding:4px;">' +
          '<button class="btn btn-secondary btn-sm" style="font-size:0.72rem;" onclick="TimerBlock.setCustom(\'' + blockId + '\')">Set</button>' +
        '</div>' +
      '</div>';
  };

  const start = (blockId) => {
    const t = _timers[blockId];
    if (!t || t.remaining <= 0) return;
    t.running = true; t.started = true;
    t.interval = setInterval(() => {
      t.remaining--;
      const disp = document.getElementById('td-' + blockId);
      if (disp) {
        const m = Math.floor(t.remaining / 60), s = t.remaining % 60;
        disp.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        if (t.remaining <= 10) disp.style.color = 'var(--accent-danger)';
        if (t.remaining <= 0) { clearInterval(t.interval); t.running = false; _render(blockId, null); if(navigator.vibrate) navigator.vibrate([500,200,500,200,500]); }
      }
    }, 1000);
    _render(blockId, null);
  };

  const pause = (blockId) => {
    const t = _timers[blockId]; if (!t) return;
    clearInterval(t.interval); t.running = false; _render(blockId, null);
  };

  const reset = (blockId) => {
    const t = _timers[blockId]; if (!t) return;
    clearInterval(t.interval); t.running = false; t.remaining = 0; t.started = false; _render(blockId, null);
  };

  const set = (blockId, seconds) => {
    const t = _timers[blockId]; if (!t) return;
    clearInterval(t.interval); t.running = false; t.remaining = seconds; t.started = false; _render(blockId, null);
  };

  const setCustom = (blockId) => {
    const m = parseInt(document.getElementById('tm-' + blockId)?.value) || 0;
    const s = parseInt(document.getElementById('ts-' + blockId)?.value) || 0;
    const total = m * 60 + s;
    if (total > 0) set(blockId, total);
  };

  return { init, start, pause, reset, set, setCustom };
})();

const Calendario = (() => {

  const PRESET = {
    forgotten_realms: {
      tipo: 'forgotten_realms', nome: 'Calendario delle Tempeste',
      mesi: [
        { nome: 'Hammer', giorni: 30, it: 'Martello (Deepwinter)' },
        { nome: 'Alturiak', giorni: 30, it: 'Alturiak (La Maschera)' },
        { nome: 'Ches', giorni: 30, it: 'Ches (La Stella)' },
        { nome: 'Tarsakh', giorni: 30, it: 'Tarsakh (Lo Scudo)' },
        { nome: 'Mirtul', giorni: 30, it: 'Mirtul (Le Fioriture)' },
        { nome: 'Kythorn', giorni: 30, it: 'Kythorn (Il Tempo dei Fiori)' },
        { nome: 'Flamerule', giorni: 30, it: 'Flamerule (La Fiamma)' },
        { nome: 'Eleasis', giorni: 30, it: 'Eleasis (La Fiamma d\'Estate)' },
        { nome: 'Eleint', giorni: 30, it: 'Eleint (Il Falcone)' },
        { nome: 'Marpenoth', giorni: 30, it: 'Marpenoth (La Foglia)' },
        { nome: 'Uktar', giorni: 30, it: 'Uktar (La Caccia)' },
        { nome: 'Nightal', giorni: 30, it: 'Nightal (Il Lungo Buio)' },
      ],
      giorni_settimana: ['Luna', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
      anno_base: 1492, prefisso_anno: 'Anno del Drago',
      festivita: [
        { mese:0, giorno:1, nome:'Midwinter (Giorno del Martello)' },
        { mese:3, giorno:30, nome:'Greengrass' },
        { mese:6, giorno:30, nome:'Midsummer' },
        { mese:8, giorno:30, nome:'Highharvestide' },
        { mese:11, giorno:20, nome:'Feast of the Moon' },
      ],
    },
    greyhawk: {
      tipo: 'greyhawk', nome: 'Calendario di Oerth',
      mesi: [
        { nome: 'Needfest', giorni: 7, it: 'Needfest' },
        { nome: 'Fireseek', giorni: 28, it: 'Fireseek (Caccia al Fuoco)' },
        { nome: 'Readying', giorni: 28, it: 'Readying (Preparazione)' },
        { nome: 'Coldeven', giorni: 28, it: 'Coldeven (Freddo Uguale)' },
        { nome: 'Growfest', giorni: 7, it: 'Growfest' },
        { nome: 'Planting', giorni: 28, it: 'Planting (La Semina)' },
        { nome: 'Flocktime', giorni: 28, it: 'Flocktime (Tempo del Gregge)' },
        { nome: 'Wealsun', giorni: 28, it: 'Wealsun (Sole Fiorente)' },
        { nome: 'Richfest', giorni: 7, it: 'Richfest' },
        { nome: 'Reaping', giorni: 28, it: 'Reaping (Il Raccolto)' },
        { nome: 'Goodmonth', giorni: 28, it: 'Goodmonth (Buon Mese)' },
        { nome: 'Harvester', giorni: 28, it: 'Harvester (Il Mietitore)' },
        { nome: 'Brewfest', giorni: 7, it: 'Brewfest' },
        { nome: 'Patchwall', giorni: 28, it: 'Patchwall (Il Muro di Toppe)' },
        { nome: 'Ready\'reat', giorni: 28, it: 'Ready\'reat (Preparazione al Gelo)' },
        { nome: 'Sunsebb', giorni: 28, it: 'Sunsebb (Sole Calante)' },
      ],
      giorni_settimana: ['Starday', 'Sunday', 'Moonday', 'Godsday', 'Waterday', 'Earthday', 'Freeday'],
      anno_base: 591, prefisso_anno: 'AC',
      festivita: [],
    },
    eberron: {
      tipo: 'eberron', nome: 'Calendario di Khorvaire',
      mesi: [
        { nome: 'Zarantyr', giorni: 28, it: 'Zarantyr (Tempesta di Metà Inverno)' },
        { nome: 'Olarune', giorni: 28, it: 'Olarune (Custode)' },
        { nome: 'Therendor', giorni: 28, it: 'Therendor (Primavera Nascente)' },
        { nome: 'Eyre', giorni: 28, it: 'Eyre (Il Fabbro)' },
        { nome: 'Dravago', giorni: 28, it: 'Dravago (La Fioritura)' },
        { nome: 'Nymm', giorni: 28, it: 'Nymm (Abbondanza)' },
        { nome: 'Lharvion', giorni: 28, it: 'Lharvion (La Mietitrice)' },
        { nome: 'Barrakas', giorni: 28, it: 'Barrakas (La Lanterna)' },
        { nome: 'Rhaan', giorni: 28, it: 'Rhaan (Il Libro)' },
        { nome: 'Sypheros', giorni: 28, it: 'Sypheros (L\'Ombra)' },
        { nome: 'Aryth', giorni: 28, it: 'Aryth (L\'Ancoraggio)' },
        { nome: 'Vult', giorni: 28, it: 'Vult (La Torre)' },
      ],
      giorni_settimana: ['Sul', 'Mol', 'Zol', 'Wir', 'Zor', 'Far', 'Sar'],
      anno_base: 998, prefisso_anno: 'YK',
      festivita: [],
    },
    fantasy: {
      tipo: 'fantasy', nome: 'Calendario Fantasy',
      mesi: [
        { nome: 'Frostmonth', it: 'Gelo', giorni: 30 },
        { nome: 'Icemonth', it: 'Ghiaccio', giorni: 30 },
        { nome: 'Bloommonth', it: 'Fioriture', giorni: 30 },
        { nome: 'Rainmonth', it: 'Piogge', giorni: 30 },
        { nome: 'Seedmonth', it: 'Semina', giorni: 30 },
        { nome: 'Greenmonth', it: 'Verdura', giorni: 30 },
        { nome: 'Sunmonth', it: 'Sole', giorni: 30 },
        { nome: 'Firemonth', it: 'Fiamma', giorni: 30 },
        { nome: 'Harvestmonth', it: 'Raccolto', giorni: 30 },
        { nome: 'Leafmonth', it: 'Foglie', giorni: 30 },
        { nome: 'Windmonth', it: 'Vento', giorni: 30 },
        { nome: 'Darkmonth', it: 'Oscurità', giorni: 30 },
      ],
      giorni_settimana: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'],
      anno_base: 1, prefisso_anno: 'Anno',
      festivita: [],
    },
    custom: {
      tipo: 'custom', nome: 'Calendario Personalizzato',
      mesi: [
        { nome: 'Mese 1', it: 'Primo Mese', giorni: 30 },
        { nome: 'Mese 2', it: 'Secondo Mese', giorni: 30 },
        { nome: 'Mese 3', it: 'Terzo Mese', giorni: 30 },
        { nome: 'Mese 4', it: 'Quarto Mese', giorni: 30 },
        { nome: 'Mese 5', it: 'Quinto Mese', giorni: 30 },
        { nome: 'Mese 6', it: 'Sesto Mese', giorni: 30 },
        { nome: 'Mese 7', it: 'Settimo Mese', giorni: 30 },
        { nome: 'Mese 8', it: 'Ottavo Mese', giorni: 30 },
        { nome: 'Mese 9', it: 'Nono Mese', giorni: 30 },
        { nome: 'Mese 10', it: 'Decimo Mese', giorni: 30 },
        { nome: 'Mese 11', it: 'Undicesimo Mese', giorni: 30 },
        { nome: 'Mese 12', it: 'Dodicesimo Mese', giorni: 30 },
      ],
      giorni_settimana: ['Giorno 1','Giorno 2','Giorno 3','Giorno 4','Giorno 5','Giorno 6','Giorno 7'],
      anno_base: 1, prefisso_anno: 'Anno',
      festivita: [],
    },
  };

  const initPreset = (tipo) => {
    const preset = PRESET[tipo] || PRESET.fantasy;
    return {
      ...preset,
      giorno: 1, mese: 0, anno: preset.anno_base,
      ora: 8, minuti: 0,
    };
  };

  const getDateStr = (cal) => {
    if (!cal) return '';
    const mese = cal.mesi[cal.mese];
    const nomeMese = mese?.it || mese?.nome || '';
    const giorno = cal.giorno;
    const anno = cal.anno;
    const gg = cal.giorni_settimana?.[(giorno-1) % (cal.giorni_settimana?.length||7)] || '';
    return `${gg}, ${giorno} ${nomeMese} — ${cal.prefisso_anno} ${anno}`;
  };

  const getTimeStr = (cal) => {
    if (!cal) return '';
    const h = String(cal.ora||0).padStart(2,'0');
    const m = String(cal.minuti||0).padStart(2,'0');
    return h + ':' + m;
  };

  const advance = (cal, unit, amount) => {
    const c = { ...cal, mesi: [...cal.mesi] };
    if (unit === 'minuti') {
      c.minuti = (c.minuti||0) + amount;
      while (c.minuti >= 60) { c.minuti -= 60; c.ora = (c.ora||0)+1; }
      while (c.minuti < 0)  { c.minuti += 60; c.ora = (c.ora||0)-1; }
    }
    if (unit === 'ore') { c.ora = (c.ora||0) + amount; }
    if (unit === 'giorni' || c.ora >= 24 || c.ora < 0) {
      const daysFromHours = c.ora >= 24 ? Math.floor(c.ora/24) : c.ora < 0 ? -Math.ceil(Math.abs(c.ora)/24) : 0;
      c.ora = ((c.ora % 24) + 24) % 24;
      const extraDays = (unit === 'giorni' ? amount : 0) + daysFromHours;
      c.giorno += extraDays;

      while (c.giorno > (c.mesi[c.mese]?.giorni||30)) {
        c.giorno -= (c.mesi[c.mese]?.giorni||30);
        c.mese++;
        if (c.mese >= c.mesi.length) { c.mese = 0; c.anno++; }
      }
      while (c.giorno < 1) {
        c.mese--;
        if (c.mese < 0) { c.mese = c.mesi.length-1; c.anno--; }
        c.giorno += (c.mesi[c.mese]?.giorni||30);
      }
    }
    if (unit === 'mesi') { c.mese += amount; while(c.mese>=c.mesi.length){c.mese-=c.mesi.length;c.anno++;} while(c.mese<0){c.mese+=c.mesi.length;c.anno--;} }
    return c;
  };

  const save = (cal) => App.saveActiveCampaign({ calendario: cal });
  const get = () => App.getActiveCampaign()?.calendario || null;

  return { initPreset, getDateStr, getTimeStr, advance, save, get, PRESET };
})();

const NoteCampagna = (() => {
  let _catIdx = 0;
  let _pageIdx = 0;
  let _mobileView = 'cats';

  const _get = () => {
    const camp = App.getActiveCampaign();
    return camp?.noteCampagna || [];
  };
  const _save = (data) => App.saveActiveCampaign({ noteCampagna: data });
  const _isMobile = () => window.innerWidth <= 768;

  const render = () => {
    if (_isMobile()) renderMobile();
    else renderDesktop();
  };

  const renderDesktop = () => {
    const container = document.getElementById('nc-container');
    if (!container) return;
    container.style.flexDirection = 'row';

    const sidebar = document.getElementById('nc-sidebar');
    const pages = document.getElementById('nc-pages');
    const editorWrap = document.getElementById('nc-editor-wrap');
    if (sidebar) { sidebar.style.display = ''; sidebar.style.width = '180px'; sidebar.style.borderRight = '1px solid var(--border)'; sidebar.style.borderBottom = 'none'; }
    if (pages) { pages.style.display = ''; pages.style.width = '200px'; pages.style.borderRight = '1px solid var(--border)'; pages.style.borderBottom = 'none'; }
    if (editorWrap) editorWrap.style.display = '';

    renderSidebar(); renderPages(); renderEditor();
  };

  const renderMobile = () => {
    const container = document.getElementById('nc-container');
    if (!container) return;
    container.style.flexDirection = 'column';

    const sidebar = document.getElementById('nc-sidebar');
    const pages = document.getElementById('nc-pages');
    const editorWrap = document.getElementById('nc-editor-wrap');

    if (_mobileView === 'cats') {
      if (sidebar) { sidebar.style.display = ''; sidebar.style.width = '100%'; sidebar.style.borderRight = 'none'; sidebar.style.borderBottom = '1px solid var(--border)'; }
      if (pages) pages.style.display = 'none';
      if (editorWrap) editorWrap.style.display = 'none';
    } else if (_mobileView === 'pages') {
      if (sidebar) sidebar.style.display = 'none';
      if (pages) { pages.style.display = ''; pages.style.width = '100%'; pages.style.borderRight = 'none'; pages.style.borderBottom = '1px solid var(--border)'; }
      if (editorWrap) editorWrap.style.display = 'none';
    } else {
      if (sidebar) sidebar.style.display = 'none';
      if (pages) pages.style.display = 'none';
      if (editorWrap) editorWrap.style.display = '';
    }

    renderSidebar(); renderPages(); renderEditor();
  };

  const renderSidebar = () => {
    const el = document.getElementById('nc-sidebar');
    if (!el) return;
    const cats = _get();
    const isMob = _isMobile();

    const backBtn = isMob && _mobileView !== 'cats' ? '' : '';
    el.innerHTML = cats.length === 0
      ? '<div class="text-muted text-sm" style="padding:10px;font-size:0.75rem;">Nessuna categoria.<br>Clicca "+ Categoria"</div>'
      : cats.map((cat, i) =>
        '<div onclick="NoteCampagna.selectCat(' + i + ')" style="padding:9px 10px;cursor:pointer;font-size:0.82rem;font-family:var(--font-display);border-left:3px solid ' + (i===_catIdx?'var(--accent-primary)':'transparent') + ';background:' + (i===_catIdx?'var(--bg-card)':'transparent') + ';display:flex;align-items:center;gap:4px;border-bottom:1px solid var(--border);">' +
          '<span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (cat.nome||'Categoria') + '</span>' +
          (isMob ? '<span style="color:var(--text-muted);font-size:0.8rem;">›</span>' : '') +
          '<button class="btn btn-ghost btn-icon-sm" style="font-size:0.6rem;opacity:0.5;flex-shrink:0;" onclick="event.stopPropagation();NoteCampagna.renameCategoria(' + i + ')"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
          '<button class="btn btn-ghost btn-icon-sm" style="opacity:0.5;flex-shrink:0;color:var(--accent-danger);" aria-label="Elimina categoria" onclick="event.stopPropagation();NoteCampagna.deleteCategoria(' + i + ')"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div>'
      ).join('');
  };

  const renderPages = () => {
    const el = document.getElementById('nc-pages');
    if (!el) return;
    const cats = _get();
    const cat = cats[_catIdx];
    const isMob = _isMobile();

    if (!cat) { el.innerHTML = '<div class="text-muted text-sm" style="padding:10px;font-size:0.75rem;">Seleziona una categoria</div>'; return; }
    const pages = cat.pagine || [];

    el.innerHTML =
      '<div style="padding:5px 8px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;">' +
        (isMob ? '<button class="btn btn-ghost btn-sm" style="font-size:0.7rem;padding:2px 6px;" onclick="NoteCampagna._mobileBack()">‹ Categorie</button>' : '') +
        '<span style="font-size:0.65rem;font-family:var(--font-display);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + cat.nome + '</span>' +
        '<button class="btn btn-ghost btn-icon-sm" style="font-size:0.7rem;flex-shrink:0;" onclick="NoteCampagna.addPage()">+</button>' +
      '</div>' +
      (pages.length === 0
        ? '<div class="text-muted text-sm" style="padding:10px;font-size:0.75rem;">Clicca + per aggiungere una pagina</div>'
        : pages.map((p, i) =>
          '<div onclick="NoteCampagna.selectPage(' + i + ')" style="padding:9px 10px;cursor:pointer;font-size:0.82rem;background:' + (i===_pageIdx?'var(--bg-tertiary)':'transparent') + ';border-bottom:1px solid var(--border);border-left:2px solid ' + (i===_pageIdx?'var(--accent-secondary)':'transparent') + ';display:flex;align-items:center;gap:4px;">' +
            '<span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (p.titolo || '<em style="color:var(--text-muted)">Senza titolo</em>') + '</span>' +
            (isMob ? '<span style="color:var(--text-muted);font-size:0.8rem;">›</span>' : '') +
          '</div>'
        ).join(''));
  };

  const renderEditor = () => {
    const cats = _get();
    const page = cats[_catIdx]?.pagine?.[_pageIdx];
    const titleEl = document.getElementById('nc-page-title');
    const contentEl = document.getElementById('nc-page-content');
    const headerEl = document.getElementById('nc-editor-header');
    if (!titleEl || !contentEl) return;

    if (headerEl && _isMobile()) {
      const backExists = headerEl.querySelector('.nc-back-btn');
      if (!backExists) {
        const backBtn = document.createElement('button');
        backBtn.className = 'btn btn-ghost btn-sm nc-back-btn';
        backBtn.style.cssText = 'font-size:0.7rem;padding:2px 6px;flex-shrink:0;';
        backBtn.textContent = '‹ Pagine';
        backBtn.onclick = () => NoteCampagna._mobileBack();
        headerEl.insertBefore(backBtn, headerEl.firstChild);
      }
    } else if (headerEl) {
      headerEl.querySelector('.nc-back-btn')?.remove();
    }

    if (!page) {
      titleEl.value = ''; contentEl.value = '';
      titleEl.disabled = true; contentEl.disabled = true;
      return;
    }
    titleEl.disabled = false; contentEl.disabled = false;
    titleEl.value = page.titolo || '';

    setTimeout(() => ncRefreshEditor?.(), 50);

    if (contentEl.contentEditable === 'true') {

      const saved = page.contenuto || '';
      contentEl.innerHTML = saved.includes('<') ? saved : saved.split('\n').map(l => l ? `<p>${l}</p>` : '<p><br></p>').join('');
    } else {
      contentEl.value = page.contenuto || '';
    }
  };

  const _mobileBack = () => {
    if (_mobileView === 'editor') _mobileView = 'pages';
    else _mobileView = 'cats';
    render();
  };

  const selectCat = (i) => {
    _catIdx = i; _pageIdx = 0;
    if (_isMobile()) { _mobileView = 'pages'; render(); }
    else { renderSidebar(); renderPages(); renderEditor(); }
  };

  const selectPage = (i) => {
    _pageIdx = i;
    if (_isMobile()) { _mobileView = 'editor'; render(); }
    else { renderPages(); renderEditor(); setTimeout(() => document.getElementById('nc-page-content')?.focus(), 50); }
  };

  const addCategoria = () => {
    const nome = prompt('Nome categoria:', 'Nuova Categoria');
    if (!nome?.trim()) return;
    const data = _get();
    data.push({ id: 'cat_'+Date.now(), nome: nome.trim(), pagine: [] });
    _save(data); _catIdx = data.length-1; _pageIdx = 0;
    if (_isMobile()) _mobileView = 'pages';
    render();
  };

  const renameCategoria = (i) => {
    const data = _get();
    const nome = prompt('Nuovo nome:', data[i]?.nome || '');
    if (!nome?.trim()) return;
    data[i].nome = nome.trim(); _save(data); renderSidebar(); renderPages();
  };

  const deleteCategoria = (i) => {
    const data = _get();
    if (!confirm('Eliminare "' + (data[i]?.nome||'') + '" e tutte le sue pagine?')) return;
    data.splice(i, 1); _save(data);
    if (_catIdx >= data.length) _catIdx = Math.max(0, data.length-1);
    _pageIdx = 0; _mobileView = 'cats'; render();
  };

  const addPage = () => {
    const data = _get();
    if (!data[_catIdx]) return;
    if (!data[_catIdx].pagine) data[_catIdx].pagine = [];
    data[_catIdx].pagine.push({ id: 'p_'+Date.now(), titolo: '', contenuto: '' });
    _pageIdx = data[_catIdx].pagine.length-1;
    _save(data);
    if (_isMobile()) _mobileView = 'editor';
    render();
    setTimeout(() => document.getElementById('nc-page-title')?.focus(), 80);
  };

  const deletePage = () => {
    const data = _get();
    const pages = data[_catIdx]?.pagine;
    if (!pages?.length) return;
    if (!confirm('Eliminare "' + (pages[_pageIdx]?.titolo||'questa pagina') + '"?')) return;
    pages.splice(_pageIdx, 1); _save(data);
    if (_pageIdx >= pages.length) _pageIdx = Math.max(0, pages.length-1);
    if (_isMobile()) _mobileView = 'pages';
    render();
  };

  const savePage = () => {
    const data = _get();
    const page = data[_catIdx]?.pagine?.[_pageIdx];
    if (!page) return;
    page.titolo = document.getElementById('nc-page-title')?.value || '';
    const el = document.getElementById('nc-page-content');

    page.contenuto = el ? (el.contentEditable === 'true' ? el.innerHTML : el.value) : '';
    _save(data);
    ncUpdateTagBar?.();

    const pageEls = document.querySelectorAll('#nc-pages > div');
    const dataEl = pageEls[_pageIdx+1];
    if (dataEl) {
      const span = dataEl.querySelector('span');
      if (span) span.textContent = page.titolo || 'Senza titolo';
    }
  };

  return { render, selectCat, selectPage, addCategoria, renameCategoria, deleteCategoria, addPage, deletePage,
    _getData: _get, get _catIdx() { return _catIdx; }, get _pageIdx() { return _pageIdx; }, savePage, _mobileBack };
})();

const NoteSessione = (() => {
  const _get = () => {
    const camp = App.getActiveCampaign();
    return camp?.noteSessione || [];
  };
  const _save = (list) => App.saveActiveCampaign({ noteSessione: list });

  const render = () => {
    const el = document.getElementById('note-sessione-list');
    if (!el) return;
    const notes = _get();
    if (!notes.length) {
      el.innerHTML = '<div class="text-muted text-sm" style="padding:8px 0;">Nessuna nota. Clicca "+ Nota" per aggiungerne una.</div>';
      return;
    }
    el.innerHTML = notes.map((n, i) => `
      <div style="display:flex;align-items:flex-start;gap:6px;padding:6px 0;border-bottom:1px solid var(--border);">
        <select style="border:none;background:transparent;font-size:0.75rem;color:var(--text-muted);cursor:pointer;padding:0;flex-shrink:0;"
          onchange="NoteSessione.updateTipo(${i},this.value)">
          ${[['📌','Generico'],['👤','PNG'],['📍','Luogo'],['⚔️','Combattimento'],['🎯','Obiettivo'],['❓','Da fare'],['💡','Idea']].map(
            ([emoji,label]) => `<option value="${emoji}" ${n.tipo===emoji?'selected':''}>${emoji} ${label}</option>`
          ).join('')}
        </select>
        <textarea style="flex:1;border:none;background:transparent;font-size:0.82rem;color:var(--text-primary);resize:none;outline:none;font-family:var(--font-body);padding:0;min-height:20px;"
          rows="1"
          oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px';NoteSessione.updateTesto(${i},this.value)"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();NoteSessione.addVoce();}"
          placeholder="Scrivi nota...">${n.testo}</textarea>
        <button class="btn btn-ghost btn-icon-sm" style="flex-shrink:0;opacity:0.4;font-size:0.7rem;"
          onclick="NoteSessione.remove(${i})" title="Rimuovi" aria-label="Rimuovi"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>`).join('');

    el.querySelectorAll('textarea').forEach(t => {
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + 'px';
    });

    window.Schermo?._refreshNoteSessione?.();
  };

  const addVoce = (tipo='📌', testo='') => {
    const list = [..._get(), { tipo, testo }];
    _save(list);
    render();

    setTimeout(() => {
      const textareas = document.querySelectorAll('#note-sessione-list textarea');
      textareas[textareas.length - 1]?.focus();
    }, 50);
  };

  const updateTipo = (i, tipo) => {
    const list = _get();
    if (list[i]) { list[i].tipo = tipo; _save(list); }
    window.Schermo?._refreshNoteSessione?.();
  };

  const updateTesto = (i, testo) => {
    const list = _get();
    if (list[i]) { list[i].testo = testo; _save(list); }
    window.Schermo?._refreshNoteSessione?.();
  };

  const remove = (i) => {
    const list = _get();
    list.splice(i, 1);
    _save(list);
    render();
  };

  const clear = () => {
    Modal.confirm('Cancella tutte le note sessione?', '', () => {
      _save([]);
      render();
    });
  };

  return { render, addVoce, updateTipo, updateTesto, remove, clear, getData: _get };
})();

const SchermoDD = (() => {
  let _sortables = [];

  const enable = () => {
    if (typeof Sortable === 'undefined') return;
    _sortables.forEach(s => { try { s.destroy(); } catch(e) {} });
    _sortables = [];

    const grid = document.getElementById('schermo-grid');
    if (!grid) return;

    const s = Sortable.create(grid, {
      animation: 150,
      handle: '.schermo-block-header',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      forceFallback: false,
      onEnd: () => Schermo._syncFromDOM(),
    });
    _sortables.push(s);

    document.querySelectorAll('.schermo-block-header').forEach(h => {
      h.style.cursor = 'grab';
    });
  };

  const reset = () => {
    _sortables.forEach(s => { try { s.destroy(); } catch(e) {} });
    _sortables = [];
  };

  return { enable, reset };
})();

const GeneratoriDD = (() => {
  const STORAGE_KEY = 'dm_generatori_order';

  const saveOrder = () => {
    const grid = document.querySelector('#page-generatori .generatori-grid');
    if (!grid) return;
    const order = [...grid.querySelectorAll('.gen-card[data-gen-id]')].map(c => c.dataset.genId);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch {}
  };

  const applyOrder = () => {

    return;
  };

  const move = (genId, dir) => {
    const grid = document.querySelector('#page-generatori .generatori-grid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.gen-card[data-gen-id]')];
    const idx = cards.findIndex(c => c.dataset.genId === genId);
    if (idx === -1) return;
    const target = cards[idx + dir];
    if (!target) return;
    if (dir < 0) grid.insertBefore(cards[idx], target);
    else grid.insertBefore(target, cards[idx]);
    saveOrder();
    enable();
  };

  const enable = () => {
    const grid = document.querySelector('#page-generatori .generatori-grid');
    if (!grid) return;
    applyOrder();
    const cards = [...grid.querySelectorAll('.gen-card[data-gen-id]')];
    cards.forEach((card, i) => {

      card.querySelector('.gen-move-btns')?.remove();
      const header = card.querySelector('.card-header');
      if (!header) return;
      const btns = document.createElement('div');
      btns.className = 'gen-move-btns';
      btns.style.cssText = 'display:flex;gap:2px;margin-left:auto;';
      btns.innerHTML =
        `<button class="btn btn-ghost btn-icon-sm" style="opacity:${i===0?'0.2':'0.7'};" ${i===0?'disabled':''} onclick="GeneratoriDD.move('${card.dataset.genId}',-1)" title="Su">↑</button>` +
        `<button class="btn btn-ghost btn-icon-sm" style="opacity:${i===cards.length-1?'0.2':'0.7'};" ${i===cards.length-1?'disabled':''} onclick="GeneratoriDD.move('${card.dataset.genId}',1)" title="Giù">↓</button>`;
      header.appendChild(btns);
    });
  };

  return { enable, applyOrder, move };
})();

const BackupSystem = (() => {
  const BACKUP_KEY = 'dm_last_backup';

  const exportAll = () => {
    try {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      const json = JSON.stringify({ version: 1, date: new Date().toISOString(), data }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dm-toolkit-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      localStorage.setItem(BACKUP_KEY, Date.now().toString());
      Toast.show('✅ Backup scaricato', 'success', 3000);
    } catch(e) { Toast.show('Errore backup: ' + e.message, 'error'); }
  };

  const importAll = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { data } = JSON.parse(e.target.result);
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
        Toast.show('✅ Backup ripristinato — ricarica la pagina', 'success', 5000);
        setTimeout(() => location.reload(), 2000);
      } catch(err) { Toast.show('File backup non valido', 'error'); }
    };
    reader.readAsText(file);
  };

  const openImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => { if (e.target.files[0]) importAll(e.target.files[0]); };
    input.click();
  };

  const autoBackup = () => {
    const last = parseInt(localStorage.getItem(BACKUP_KEY) || '0');
    const now = Date.now();

    if (now - last > 7 * 24 * 60 * 60 * 1000) {
      setTimeout(() => Toast.show('💾 Nessun backup da 7+ giorni — considera di farne uno', 'info', 6000), 5000);
    }
  };

  return { exportAll, openImport, autoBackup };
})();

document.addEventListener('DOMContentLoaded', () => {
  Debug.init(
    document.getElementById('debug-body'),
    document.getElementById('debug-panel')
  );
  App.init();
  BackupSystem.autoBackup();
  Settings.init();
  try { WikiSections.init(); } catch(e) {}
  setTimeout(() => { try { DriveBackup.init(); } catch(e) {} }, 1200);

  setTimeout(() => { try { GDriveUI.init(); } catch(e) {} }, 1000);
  setTimeout(() => { try { FirebaseSync.init(); } catch(e) {} }, 500);

  setTimeout(() => MonsterCache.load(), 500);

  if ('serviceWorker' in navigator && window.self === window.top) {
    navigator.serviceWorker.register('sw.js', { scope: '/dm-toolkit/' }).catch(function(){});
  }

});
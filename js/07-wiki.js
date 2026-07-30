const WikiDM = (() => {
  'use strict';

  let _section = 'lore';
  let _noteId  = null;
  let _mobileView = 'tree';

  const _getWiki = () => {
    const camp = App.getActiveCampaign();
    const w = camp?.wiki;
    if (w) return w;
    return { lore: [], sessioni: [], templates: [] };
  };
  const _saveWiki = (w) => App.saveActiveCampaign({ wiki: w });
  const _isMobile = () => window.innerWidth <= 768;
  const _uid = () => 'n' + Date.now() + Math.random().toString(36).slice(2,5);

  const _builtinTemplates = () => [
    { id:'tpl_sess', nome:'⚔️ Sessione', icona:'⚔️', builtin:true, contenuto:`<h1>Sessione — </h1>
<p><strong>Data:</strong> &nbsp;|&nbsp; <strong>Sessione n°:</strong> </p>
<h2>🎯 Obiettivi</h2><ul><li></li></ul>
<h2>🗺️ Scene Preparate</h2><p></p>
<h2>👥 PNG Coinvolti</h2><ul><li></li></ul>
<h2>⚔️ Encounter</h2><p></p>
<h2>💰 Loot</h2><p></p>
<h2>🔒 Segreti DM</h2><blockquote></blockquote>
<h2>📝 Note Live</h2><p></p>
<h2>📖 Recap</h2><p></p>
<h2>🔗 Thread aperti</h2><ul><li></li></ul>` },
    { id:'tpl_lore', nome:'📚 Lore', icona:'📚', builtin:true, contenuto:`<h1></h1>
<p><em>#tag</em></p>
<h2>Descrizione</h2><p></p>
<h2>Storia</h2><p></p>
<h2>Connessioni</h2><ul><li>[[Collegamento]]</li></ul>
<h2>Note DM</h2><blockquote></blockquote>` },
    { id:'tpl_npc', nome:'👤 PNG', icona:'👤', builtin:true, contenuto:`<h1></h1>
<p><strong>Razza:</strong> &nbsp;|&nbsp; <strong>Ruolo:</strong> &nbsp;|&nbsp; <strong>Luogo:</strong> [[]]</p>
<p>#png</p>
<h2>Descrizione</h2><p></p>
<h2>Personalità</h2><p><strong>Vuole:</strong> <br><strong>Teme:</strong> <br><strong>Segreto:</strong> </p>
<h2>Relazioni</h2><ul><li>[[]] — </li></ul>
<h2>Dialoghi</h2><blockquote></blockquote>` },
    { id:'tpl_loc', nome:'🗺️ Luogo', icona:'🗺️', builtin:true, contenuto:`<h1></h1>
<p><strong>Tipo:</strong> &nbsp;|&nbsp; <strong>Regione:</strong> [[]] &nbsp;|&nbsp; #luogo</p>
<h2>Descrizione</h2><p></p>
<h2>Atmosfera</h2><p><strong>Vista:</strong> <br><strong>Suoni:</strong> <br><strong>Odori:</strong> </p>
<h2>Abitanti</h2><ul><li>[[]]</li></ul>
<h2>Note DM</h2><blockquote></blockquote>` },
    { id:'tpl_free', nome:'📄 Nota Libera', icona:'📄', builtin:true, contenuto:`<h1></h1><p></p>` },
  ];

  const _ensureTemplates = (w) => {
    const builtin = _builtinTemplates();

    try {
      const extra = _extraTemplates();
      extra.forEach(t => {
        if (!builtin.find(b => b.id === t.id)) builtin.push(t);
      });
    } catch(e) {}
    if (!w.templates || !w.templates.length) {
      w.templates = builtin;
    } else {

      builtin.forEach(bt => {
        if (!w.templates.find(t => t.id === bt.id)) w.templates.unshift(bt);
      });
    }
    return w;
  };

  const init = () => {
    const w = _getWiki();
    _ensureTemplates(w);
    _saveWiki(w);
    _section = 'lore';
    _noteId = w.lore?.[0]?.id || null;
    _mobileView = 'tree';
    _render();
  };

  const _render = () => {
    _renderTabs();
    _renderSectionActions();
    if (_isMobile()) _renderMobile();
    else _renderDesktop();
  };

  const _renderDesktop = () => {
    const sidebar = document.getElementById('wiki-sidebar');
    const editorArea = document.getElementById('wiki-editor-area');
    if (sidebar) sidebar.style.display = 'flex';
    if (editorArea) editorArea.style.display = 'flex';
    _renderMobileBack(false);
    renderTree();
    renderEditor();
  };

  const _renderMobile = () => {
    const sidebar = document.getElementById('wiki-sidebar');
    const editorArea = document.getElementById('wiki-editor-area');
    if (_mobileView === 'tree') {
      if (sidebar) sidebar.style.display = 'flex';
      if (editorArea) editorArea.style.display = 'none';
      _renderMobileBack(false);
      renderTree();
    } else {
      if (sidebar) sidebar.style.display = 'none';
      if (editorArea) editorArea.style.display = 'flex';
      _renderMobileBack(true);
      renderEditor();
    }
  };

  const _renderMobileBack = (show) => {
    const topbar = document.getElementById('wiki-topbar');
    if (!topbar) return;
    let backBtn = topbar.querySelector('.wiki-back-btn');
    if (show && !backBtn) {
      backBtn = document.createElement('button');
      backBtn.className = 'btn btn-ghost btn-sm wiki-back-btn';
      backBtn.textContent = '‹ Note';
      backBtn.onclick = () => { _mobileView = 'tree'; _renderMobile(); };
      topbar.insertBefore(backBtn, topbar.firstChild);
    } else if (!show && backBtn) {
      backBtn.remove();
    }
  };

  const _renderTabs = () => {
    ['lore','sessioni','templates'].forEach(s => {
      const btn = document.getElementById('wiki-tab-' + s);
      if (btn) btn.className = s === _section ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
    });
  };

  const _renderSectionActions = () => {
    const el = document.getElementById('wiki-section-actions');
    if (!el) return;
    if (_section === 'templates') {
      el.innerHTML = '<button class="btn btn-secondary btn-sm" onclick="WikiDM.newTemplate()">+ Template</button>';
    } else {
      el.innerHTML = '<button class="btn btn-primary btn-sm" onclick="WikiDM.newNote()">+ Nota</button>';
    }
  };

  const switchSection = (sec) => {
    _section = sec;
    _noteId = null;
    _mobileView = 'tree';

    const grafoPanel = document.getElementById('wiki-grafo-panel');
    const sidebar    = document.getElementById('wiki-sidebar');
    const editorArea = document.getElementById('wiki-editor-area');

    if (sec === 'grafo') {
      if (grafoPanel) grafoPanel.style.display = 'flex';
      if (sidebar)    sidebar.style.display    = 'none';
      if (editorArea) editorArea.style.display = 'none';
      ['lore','sessioni','templates'].forEach(s => {
        const b = document.getElementById('wiki-tab-'+s);
        if (b) b.className = 'btn btn-ghost btn-sm';
      });
      const gb = document.getElementById('wiki-tab-grafo');
      if (gb) gb.className = 'btn btn-primary btn-sm';
      setTimeout(() => { try { WikiGrafo.render(); } catch(e) {} }, 80);
      return;
    }

    if (grafoPanel) grafoPanel.style.display = 'none';
    if (sidebar)    sidebar.style.display    = '';
    if (editorArea) editorArea.style.display = '';

    _render();
  };

  const renderTree = () => {
    const tree = document.getElementById('wiki-tree');
    if (!tree) return;

    if (_section === 'templates') {
      _renderTemplatesTree(tree);
      return;
    }

    const w = _getWiki();
    const notes = w[_section] || [];

    if (!notes.length) {
      const labels = { lore:'Lore', sessioni:'Sessioni' };
      tree.innerHTML = `<div style="padding:20px 12px;text-align:center;color:var(--text-muted);">
        <div style="font-size:2rem;margin-bottom:8px;">${_section==='lore'?'📚':'📋'}</div>
        <div style="font-size:0.82rem;margin-bottom:12px;">Nessuna nota in ${labels[_section]}</div>
        <button class="btn btn-primary btn-sm" onclick="WikiDM.newNote()">+ Nuova nota</button>
      </div>`;
      return;
    }

    const sorted = [...notes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.aggiornatoAt||0) - (a.aggiornatoAt||0);
    });

    tree.innerHTML = sorted.map(n => {
      const active = n.id === _noteId;
      return `<div data-note-id="${n.id}"
        style="display:flex;align-items:center;gap:6px;padding:7px 8px 7px 12px;cursor:pointer;
               border-right:${active ? '2px solid var(--accent-primary)' : '2px solid transparent'};
               background:${active ? 'rgba(139,38,53,0.15)' : 'transparent'};"
        onclick="WikiDM._clickNote('${n.id}')"
        onmouseenter="if(!${active})this.style.background='var(--bg-tertiary)'"
        onmouseleave="if(!${active})this.style.background='transparent'">
        <span style="font-size:0.75rem;flex-shrink:0;">${n.pinned ? '📌' : _noteIcon(n.titolo)}</span>
        <span style="font-size:0.82rem;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${n.pinned?'font-weight:600;':''}">${n.titolo || 'Senza titolo'}</span>
        <div style="display:flex;gap:2px;flex-shrink:0;opacity:0.5;" onclick="event.stopPropagation();">
          <button title="${n.pinned?'Rimuovi pin':'Fissa in cima'}"
            style="width:18px;height:18px;background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0;color:${n.pinned?'var(--accent-secondary)':'var(--text-muted)'};"
            onclick="WikiDM.togglePin('${n.id}')">📌</button>
        </div>
      </div>`;
    }).join('');
  };

  const _noteIcon = (titolo) => {
    const t = (titolo||'').toLowerCase();
    if (t.includes('sessione')) return '⚔️';
    if (t.includes('png') || t.includes('npc')) return '👤';
    if (t.includes('luogo')) return '🗺️';
    return '📄';
  };

  const _clickNote = (id) => {
    _noteId = id;
    if (_isMobile()) { _mobileView = 'editor'; _renderMobile(); }
    else { renderTree(); renderEditor(); }
  };

  const renderEditor = () => {
    const titleEl  = document.getElementById('wiki-note-title');
    const contentEl = document.getElementById('wiki-note-content');
    const actionsEl = document.getElementById('wiki-note-actions');
    const breadEl  = document.getElementById('wiki-breadcrumb');

    if (_section === 'templates') { _renderTemplateEditor(); return; }
    if (!titleEl || !contentEl) return;

    const w = _getWiki();
    const nota = _noteId ? (w[_section]||[]).find(n => n.id === _noteId) : null;

    if (breadEl) {
      const sec = { lore:'📚 Lore', sessioni:'📋 Sessioni' }[_section] || '';
      breadEl.innerHTML = nota
        ? `<span style="cursor:pointer;" onclick="WikiDM.switchSection('${_section}')">${sec}</span> › ${nota.titolo||'Senza titolo'}`
        : sec;
    }

    if (actionsEl) {
      actionsEl.innerHTML = nota
        ? `<button class="btn btn-ghost btn-icon-sm" onclick="WikiDM.deleteNote()" title="Elimina" style="color:var(--accent-danger);">🗑️</button>`
        : '';
    }

    if (!nota) {
      titleEl.value = '';
      titleEl.disabled = true;
      contentEl.contentEditable = 'false';
      contentEl.innerHTML = `<div style="max-width:440px;margin:48px auto;text-align:center;color:var(--text-muted);">
        <div style="font-size:3rem;margin-bottom:16px;">${_section==='lore'?'📚':'📋'}</div>
        <div style="font-size:0.9rem;margin-bottom:20px;line-height:1.6;">
          ${_section==='lore'
            ? 'Scrivi la lore del mondo: storia, divinità, magia, fazioni...'
            : 'Una nota per sessione: prep, note live, recap finale.'}
        </div>
        <button class="btn btn-primary" onclick="WikiDM.newNote()">+ Crea prima nota</button>
        <div style="margin-top:20px;font-size:0.72rem;">
          Usa <kbd style="background:var(--bg-tertiary);padding:1px 5px;border-radius:3px;">[[link]]</kbd> per collegare ·
          <kbd style="background:var(--bg-tertiary);padding:1px 5px;border-radius:3px;">#tag</kbd> per categorizzare
        </div>
      </div>`;
      _hideBacklinks();
      _hideTagBar();
      return;
    }

    titleEl.value = nota.titolo || '';
    contentEl.innerHTML = nota.contenuto || '';
    _showTagBar(nota.tags || []);
    _showBacklinks(nota);

    setTimeout(() => { _applyViewMode(); try { _updateCompendioToggle(nota); } catch(e) {} }, 30);
  };

  const newNote = (secOverride) => {
    const sec = secOverride || _section;
    if (sec === 'templates') { newTemplate(); return; }
    const w = _getWiki();
    const tpls = w.templates || _builtinTemplates();

    const list = document.getElementById('wiki-tpl-list');
    if (list) {
      list.innerHTML = tpls.map(t =>
        `<div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border);
              border-radius:var(--radius-md);margin-bottom:6px;cursor:pointer;background:var(--bg-secondary);"
          onclick="WikiDM._createFromTpl('${t.id}','${sec}');Modal.close('wiki-tpl')"
          onmouseenter="this.style.background='var(--bg-tertiary)'"
          onmouseleave="this.style.background='var(--bg-secondary)'">
          <span style="font-size:1.4rem;">${t.icona}</span>
          <div>
            <div style="font-family:var(--font-display);font-size:0.88rem;">${t.nome}</div>
            ${t.builtin ? '<div style="font-size:0.68rem;color:var(--text-muted);">Predefinito</div>' : '<div style="font-size:0.68rem;color:var(--accent-secondary);">Personalizzato</div>'}
          </div>
        </div>`
      ).join('');
    }
    Modal.open('wiki-tpl');
  };

  const _createFromTpl = (tplId, sec) => {
    const w = _getWiki();
    const tpl = (w.templates || _builtinTemplates()).find(t => t.id === tplId)
             || _builtinTemplates().find(t => t.id === tplId);
    const now = new Date().toLocaleDateString('it-IT');
    const nSess = (w.sessioni||[]).length + 1;
    const contenuto = (tpl?.contenuto || '<p></p>')
      .replace(/Sessione — /g, `Sessione ${nSess} — `)
      .replace(/Data:\s*&nbsp;\|/g, `Data: ${now} &nbsp;|`);
    const nota = { id:_uid(), titolo:'', contenuto, tags:[], creatoAt:Date.now(), aggiornatoAt:Date.now() };
    if (!w[sec]) w[sec] = [];
    w[sec].unshift(nota);
    _saveWiki(w);
    _section = sec;
    _noteId = nota.id;
    _mobileView = 'editor';
    _render();

    const mondoTipoMap = {
      'tpl_npc':'npc', 'tpl_npc_wiki':'npc',
      'tpl_loc':'luogo', 'tpl_luogo_wiki':'luogo',
      'tpl_dungeon':'luogo',
      'tpl_negozio':'luogo',
    };
    const mondoTipo = mondoTipoMap[tplId];
    if (mondoTipo) {
      setTimeout(() => _createInMondo(mondoTipo, nota), 300);
    }
  };

  const _createInMondo = (tipo, nota) => {
    try {
      const camp = App.getActiveCampaign();
      if (!camp) return;
      const uid = Date.now();
      if (tipo === 'npc') {
        const npcs = [...(camp.npcs||[])];
        const npcData = {
          id: 'npc_' + uid,
          name: nota.titolo || 'Nuovo PNG',
          race: '', job: '', icon: '👤',
          trait: '', secret: '', wants: '', offers: '', links: '',
          relation: 50, imgPosX: 50, imgPosY: 50, imgZoom: 100,
          wikiId: nota.id,
        };
        npcs.push(npcData);
        App.saveActiveCampaign({ npcs });

        const w = _getWiki();
        const n = (w[_section]||[]).find(x => x.id === nota.id);
        if (n) { n.mondoId = npcData.id; n.mondoTipo = 'npc'; _saveWiki(w); }
        Toast.show('👤 PNG creato nel Mondo — aprilo per completare i dettagli', 'success', 3000);
      } else if (tipo === 'luogo') {
        const locations = [...(camp.locations||[])];
        const locData = {
          id: 'loc_' + uid,
          nome: nota.titolo || 'Nuovo Luogo',
          tipo: 'altro', desc: '', note: '', poi: '', loot: '',
          imgPosX: 50, imgPosY: 50, imgZoom: 100,
          wikiId: nota.id,
        };
        locations.push(locData);
        App.saveActiveCampaign({ locations });
        const w = _getWiki();
        const n = (w[_section]||[]).find(x => x.id === nota.id);
        if (n) { n.mondoId = locData.id; n.mondoTipo = 'luogo'; _saveWiki(w); }
        Toast.show('🗺️ Luogo creato nel Mondo — aprilo per completare i dettagli', 'success', 3000);
      }
    } catch(e) { Debug.warn('_createInMondo:', e); }
  };

  const deleteNote = () => {
    if (!_noteId) return;
    const w = _getWiki();
    const nota = (w[_section]||[]).find(n => n.id === _noteId);
    if (!confirm('Eliminare "' + (nota?.titolo||'questa nota') + '"? Sarà nel cestino per 30 giorni.')) return;

    try { WikiTrash.addToTrash(nota, _section); } catch(e) {}
    w[_section] = (w[_section]||[]).filter(n => n.id !== _noteId);
    _saveWiki(w);
    _noteId = w[_section]?.[0]?.id || null;
    _mobileView = 'tree';
    _render();
    Toast.show('Nota spostata nel cestino', 'info', 1500);
  };

  const saveNote = () => {
    if (!_noteId) return;
    if (_section === 'templates') { saveTemplate(); return; }
    const w = _getWiki();
    const nota = (w[_section]||[]).find(n => n.id === _noteId);
    if (!nota) return;
    nota.titolo = document.getElementById('wiki-note-title')?.value || '';
    nota.contenuto = document.getElementById('wiki-note-content')?.innerHTML || '';
    nota.aggiornatoAt = Date.now();
    nota.tags = [...new Set(
      [...nota.contenuto.matchAll(/class="nc-tag"[^>]*>([^<]+)</g)].map(m => m[1])
    )];
    const _oldTitolo = (w[_section]||[]).find(n => n.id === _noteId)?.titolo || '';
    _saveWiki(w);

    if (nota.inCompendio) {
      try { _syncWikiToCompendio(_noteId, true); } catch(e) {}
    }

    if (nota.mondoId && nota.mondoTipo && nota.titolo && nota.titolo !== _oldTitolo) {
      try {
        const camp = App.getActiveCampaign();
        if (nota.mondoTipo === 'npc') {
          const npcs = (camp?.npcs||[]).map(n => n.id===nota.mondoId ? {...n, name:nota.titolo} : n);
          App.saveActiveCampaign({ npcs });
          _safeRename('npc', _oldTitolo, nota.titolo);
        } else if (nota.mondoTipo === 'luogo') {
          const locations = (camp?.locations||[]).map(l => l.id===nota.mondoId ? {...l, nome:nota.titolo} : l);
          App.saveActiveCampaign({ locations });
          _safeRename('luogo', _oldTitolo, nota.titolo);
        } else if (nota.mondoTipo === 'fazione') {
          const factions = (camp?.factions||[]).map(f => f.id===nota.mondoId ? {...f, nome:nota.titolo} : f);
          App.saveActiveCampaign({ factions });
          _safeRename('fazione', _oldTitolo, nota.titolo);
        }
      } catch(e) { Debug.warn('Sync titolo→Mondo:', e); }
    }

    const el = document.querySelector(`[data-note-id="${_noteId}"] span:nth-child(2)`);
    if (el) el.textContent = nota.titolo || 'Senza titolo';
    _showTagBar(nota.tags);
  };

  const openNote = (id) => { _noteId = id; renderEditor(); };

  const search = (q) => {
    const query = q.trim().toLowerCase();
    if (!query) { clearSearch(); return; }
    const w = _getWiki();
    const results = [];
    ['lore','sessioni'].forEach(sec => {
      (w[sec]||[]).forEach(n => {
        const text = (n.titolo + ' ' + (n.contenuto||'').replace(/<[^>]+>/g,'')).toLowerCase();
        if (text.includes(query)) {
          const raw = (n.contenuto||'').replace(/<[^>]+>/g,'');
          const idx = raw.toLowerCase().indexOf(query);
          const start = Math.max(0, idx-40);
          const excerpt = (start>0?'…':'') + raw.slice(start, idx+query.length+60).replace(
            new RegExp(query,'gi'), m => `<mark style="background:rgba(93,164,90,0.3);border-radius:2px;">${m}</mark>`
          ) + '…';
          results.push({ sec, n, excerpt });
        }
      });
    });

    const sr = document.getElementById('wiki-search-results');
    const sl = document.getElementById('wiki-search-list');
    if (sr) sr.style.display = '';
    const icons = { lore:'📚', sessioni:'📋' };
    if (sl) sl.innerHTML = !results.length
      ? '<p style="color:var(--text-muted);text-align:center;padding:20px;">Nessun risultato.</p>'
      : results.map(r => `<div style="padding:10px;border:1px solid var(--border);border-radius:var(--radius-md);
            margin-bottom:8px;cursor:pointer;background:var(--bg-secondary);"
          onclick="WikiDM._openResult('${r.sec}','${r.n.id}')"
          onmouseenter="this.style.background='var(--bg-tertiary)'"
          onmouseleave="this.style.background='var(--bg-secondary)'">
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;">
            <span style="font-size:0.8rem;">${icons[r.sec]}</span>
            <strong style="font-family:var(--font-display);font-size:0.88rem;">${r.n.titolo||'Senza titolo'}</strong>
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);">${r.excerpt}</div>
        </div>`
      ).join('');
  };

  const clearSearch = () => {
    const sr = document.getElementById('wiki-search-results');
    if (sr) sr.style.display = 'none';
    const inp = document.getElementById('wiki-search');
    if (inp) inp.value = '';
  };

  const _openResult = (sec, id) => {
    clearSearch();
    _section = sec;
    _noteId = id;
    _mobileView = 'editor';
    _render();
  };

  const _showTagBar = (tags) => {
    const bar = document.getElementById('wiki-tag-bar');
    if (!bar) return;
    if (!tags?.length) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    bar.innerHTML = '<span style="color:var(--text-muted);margin-right:4px;flex-shrink:0;">Tags:</span>' +
      [...new Set(tags)].map(t => `<span class="nc-tb-tag">${t}</span>`).join('');
  };
  const _hideTagBar = () => { const b = document.getElementById('wiki-tag-bar'); if(b) b.style.display='none'; };

  const _showBacklinks = (currentNota) => {
    const panel = document.getElementById('wiki-backlinks');
    if (!panel) return;
    const w = _getWiki();
    const titolo = currentNota.titolo;
    if (!titolo) { panel.style.display = 'none'; return; }
    const links = [];
    ['lore','sessioni'].forEach(sec => {
      (w[sec]||[]).forEach(n => {
        if (n.id === currentNota.id) return;
        if ((n.contenuto||'').includes(`data-link="${titolo}"`)) {
          links.push({ sec, n });
        }
      });
    });
    if (!links.length) { panel.style.display = 'none'; return; }
    panel.style.display = 'flex';
    panel.innerHTML = '<span style="flex-shrink:0;margin-right:6px;">🔗 Citata da:</span>' +
      links.map(l => `<span style="padding:2px 8px;background:var(--bg-card);border:1px solid var(--border);
          border-radius:var(--radius-sm);cursor:pointer;color:#5ba4f5;font-size:0.75rem;"
          onclick="WikiDM._clickNote('${l.n.id}');WikiDM.switchSection('${l.sec}')">
          ${l.n.titolo||'Senza titolo'}
        </span>`).join('');
  };
  const _hideBacklinks = () => { const p = document.getElementById('wiki-backlinks'); if(p) p.style.display='none'; };

  const _renderTemplatesTree = (tree) => {
    const w = _getWiki();
    const tpls = w.templates || _builtinTemplates();
    tree.innerHTML = tpls.map(t => {
      const active = t.id === _noteId;
      return `<div data-tpl-id="${t.id}"
        style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;
               background:${active?'rgba(139,38,53,0.15)':'transparent'};
               border-right:${active?'2px solid var(--accent-primary)':'2px solid transparent'};"
        onclick="WikiDM._clickTemplate('${t.id}')"
        onmouseenter="if(!${active})this.style.background='var(--bg-tertiary)'"
        onmouseleave="if(!${active})this.style.background='transparent'">
        <span>${t.icona}</span>
        <span style="font-size:0.82rem;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.nome}</span>
        ${t.builtin ? '<span style="font-size:0.6rem;color:var(--text-muted);">def</span>' : ''}
      </div>`;
    }).join('') + `<div style="padding:8px 12px;border-top:1px solid var(--border);margin-top:8px;">
      <button class="btn btn-ghost btn-sm w-full" style="font-size:0.75rem;" onclick="WikiDM.newTemplate()">+ Nuovo template</button>
    </div>`;
  };

  const _clickTemplate = (id) => {
    _noteId = id;
    if (_isMobile()) { _mobileView = 'editor'; _renderMobile(); }
    else { _renderTemplatesTree(document.getElementById('wiki-tree')); _renderTemplateEditor(); }
  };

  const _renderTemplateEditor = () => {
    const titleEl  = document.getElementById('wiki-note-title');
    const contentEl = document.getElementById('wiki-note-content');
    const actionsEl = document.getElementById('wiki-note-actions');
    const breadEl  = document.getElementById('wiki-breadcrumb');
    if (breadEl) breadEl.textContent = '🗂️ Template';
    if (!titleEl || !contentEl) return;
    const w = _getWiki();
    const tpl = (w.templates||_builtinTemplates()).find(t => t.id === _noteId);
    if (actionsEl) {
      actionsEl.innerHTML = (tpl && !tpl.builtin)
        ? `<button class="btn btn-ghost btn-icon-sm" onclick="WikiDM.deleteTemplate('${tpl.id}')" style="color:var(--accent-danger);">🗑️</button>`
        : '';
    }
    if (!tpl) {
      titleEl.value = ''; titleEl.disabled = true;
      contentEl.contentEditable = 'false';
      contentEl.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">
        <div style="font-size:2.5rem;margin-bottom:12px;">🗂️</div>
        <div style="margin-bottom:16px;">Seleziona un template o creane uno nuovo</div>
        <button class="btn btn-primary btn-sm" onclick="WikiDM.newTemplate()">+ Nuovo template</button>
      </div>`;
      return;
    }
    titleEl.disabled = false;
    titleEl.value = tpl.nome;
    contentEl.contentEditable = 'true';
    contentEl.innerHTML = tpl.contenuto;
    _hideTagBar(); _hideBacklinks();
  };

  const saveTemplate = () => {
    if (!_noteId || _section !== 'templates') return;
    const w = _getWiki();
    const tpl = (w.templates||[]).find(t => t.id === _noteId);
    if (!tpl) return;
    tpl.nome = document.getElementById('wiki-note-title')?.value || tpl.nome;
    tpl.contenuto = document.getElementById('wiki-note-content')?.innerHTML || '';
    _saveWiki(w);
    Toast.show('Template salvato', 'success', 1200);
  };

  const newTemplate = () => {
    const nome = prompt('Nome del template:', 'Nuovo template');
    if (!nome?.trim()) return;
    const w = _getWiki();
    if (!w.templates) w.templates = _builtinTemplates();
    const tpl = { id:'tpl_'+Date.now(), nome:nome.trim(), icona:'📄', builtin:false, contenuto:`<h1>${nome.trim()}</h1>\n<p></p>` };
    w.templates.push(tpl);
    _saveWiki(w);
    _noteId = tpl.id;
    _render();
  };

  const deleteTemplate = (id) => {
    const w = _getWiki();
    const tpl = (w.templates||[]).find(t => t.id === id);
    if (tpl?.builtin) { Toast.show('I template predefiniti non possono essere eliminati', 'warning'); return; }
    if (!confirm('Eliminare questo template?')) return;
    w.templates = (w.templates||[]).filter(t => t.id !== id);
    _saveWiki(w);
    _noteId = null;
    _render();
  };

  const togglePin = (id) => {
    const w = _getWiki();
    const nota = (w[_section]||[]).find(n => n.id === id);
    if (!nota) return;
    nota.pinned = !nota.pinned;
    _saveWiki(w);
    renderTree();
  };

  return {
    init, switchSection, renderTree, renderEditor,
    newNote, openNote, saveNote, deleteNote,
    newTemplate, deleteTemplate, saveTemplate,
    search, clearSearch, togglePin,
    toggleViewMode: () => { _wikiViewMode = _wikiViewMode === 'view' ? 'edit' : 'view'; _applyViewMode(); },
    getCurrentNote: () => { const w = _getWiki(); return (w[_section]||[]).find(n => n.id === _noteId) || null; },
    toggleCompendioSync: (enabled) => { if (_noteId) _syncWikiToCompendio(_noteId, enabled); },
    _createFromTpl, _clickNote, _clickTemplate, _openResult,
    get _section() { return _section; },
    get _noteId()  { return _noteId; },
    _getData: _getWiki,
  };
})();

const _getActiveEditor = () => {
  const active = document.activeElement;
  if (active && active.contentEditable === 'true') return active;

  return document.getElementById('wiki-note-content') ||
         document.getElementById('ws-editor-free') ||
         document.getElementById('nc-page-content');
};

const _saveActiveEditor = () => {
  const el = _getActiveEditor();
  if (!el) return;
  if (el.id === 'wiki-note-content') WikiDM.saveNote();
  else if (el.id === 'nc-page-content') NoteCampagna.savePage?.();
  else if (el.id === 'ws-editor-free' && window.WikiSections?._currentType) {
    WikiSections._manualSave?.();
  }
};

const wikiF  = (cmd) => {
  const el = _getActiveEditor();
  if (!el) return;
  el.focus();
  document.execCommand(cmd, false, null);
  _saveActiveEditor();
};

const wikiFB = (tag) => {
  const el = _getActiveEditor();
  if (!el) return;
  el.focus();
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const range = sel.getRangeAt(0);

  if (!sel.isCollapsed) {
    const frag = range.extractContents();
    const wrapper = document.createElement(tag);
    wrapper.appendChild(frag);
    range.insertNode(wrapper);

    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    sel.addRange(newRange);
  } else {

    document.execCommand('formatBlock', false, '<' + tag + '>');
  }
  _saveActiveEditor();
};

const wikiInsertTag = () => {
  const tag = prompt('Nome tag (senza #):','');
  if (!tag?.trim()) return;
  document.getElementById('wiki-note-content')?.focus();
  document.execCommand('insertHTML',false,`<span class="nc-tag">#${tag.trim().toLowerCase().replace(/\s+/g,'_')}</span>&nbsp;`);
  WikiDM.saveNote();
};

const wikiInsertLink = () => {
  const w = WikiDM._getData?.() || {};
  const camp = App.getActiveCampaign();

  const pages = [];
  ['lore','sessioni'].forEach(sec => (w[sec]||[]).forEach(n =>
    pages.push({ tipo:'wiki', tipo_label:'📝 Wiki', titolo:n.titolo, key:n.titolo })
  ));
  (camp?.npcs||[]).forEach(n =>
    pages.push({ tipo:'png', tipo_label:'👤 PNG', titolo:n.name||n.nome||'', id:n.id, key:'png:'+( n.name||n.nome||'') })
  );
  (camp?.locations||[]).forEach(l =>
    pages.push({ tipo:'luogo', tipo_label:'🗺️ Luogo', titolo:l.nome||'', id:l.id, key:'luogo:'+(l.nome||'') })
  );
  (camp?.factions||[]).forEach(f =>
    pages.push({ tipo:'fazione', tipo_label:'⚔️ Fazione', titolo:f.nome||'', id:f.id, key:'fazione:'+(f.nome||'') })
  );

  if (!pages.length) { Toast.show('Nessuna nota o entità disponibile','info'); return; }

  const list = pages.slice(0,30).map((p,i) => `${i+1}. ${p.tipo_label} ${p.titolo}`).join('\n');
  const input = prompt('Collega a (numero o titolo):\n' + list, '');
  if (!input?.trim()) return;

  let found = null;
  const num = parseInt(input.trim());
  if (!isNaN(num) && num >= 1 && num <= pages.length) {
    found = pages[num-1];
  } else {
    found = pages.find(p => p.titolo.toLowerCase() === input.trim().toLowerCase());
  }

  const titolo = found ? found.titolo : input.trim();
  const key = found ? found.key : titolo;
  const cls = found ? 'nc-wikilink' : 'nc-wikilink nc-broken';
  const label = found ? (
    found.tipo === 'png' ? '👤 ' :
    found.tipo === 'luogo' ? '🗺️ ' :
    found.tipo === 'fazione' ? '⚔️ ' : ''
  ) + titolo : titolo;

  document.getElementById('wiki-note-content')?.focus();
  const _safeKey = key.replace(/'/g, "\\'");
  const _span = '<span class="' + cls + '" data-link="' + key + '" data-tipo="' + (found?.tipo||'wiki') + '" onclick="wikiNavigateLink(\'' + _safeKey + '\')">[[' + label + ']]</span>&nbsp;';
  document.execCommand('insertHTML', false, _span);
  WikiDM.saveNote();
};

const wikiNavigateLink = (key) => {

  const tipo = key.startsWith('png:') ? 'png'
             : key.startsWith('luogo:') ? 'luogo'
             : key.startsWith('fazione:') ? 'fazione'
             : 'wiki';
  const titolo = tipo === 'wiki' ? key
               : tipo === 'png'     ? key.slice(4)
               : tipo === 'luogo'   ? key.slice(6)
               : key.slice(8);

  if (tipo === 'png') {
    const camp = App.getActiveCampaign();
    const npc = (camp?.npcs||[]).find(n => (n.name||n.nome||'').toLowerCase() === titolo.toLowerCase());
    if (npc) {
      App.navigateTo('mondo');
      setTimeout(() => {
        try { NPC.init(); } catch(e) {}
        setTimeout(() => NPC.openView(npc.id), 150);
      }, 100);
      return;
    }
    Toast.show('PNG "' + titolo + '" non trovato nel Mondo', 'warning', 2500);
    return;
  }

  if (tipo === 'luogo') {
    const camp = App.getActiveCampaign();
    const loc = (camp?.locations||[]).find(l => (l.nome||'').toLowerCase() === titolo.toLowerCase());
    if (loc) {
      App.navigateTo('mondo');
      setTimeout(() => {
        try { Luoghi.init(); } catch(e) {}
        setTimeout(() => Luoghi.openView(loc.id), 150);
      }, 100);
      return;
    }
    Toast.show('Luogo "' + titolo + '" non trovato nel Mondo', 'warning', 2500);
    return;
  }

  if (tipo === 'fazione') {
    const camp = App.getActiveCampaign();
    const faz = (camp?.factions||[]).find(f => (f.nome||'').toLowerCase() === titolo.toLowerCase());
    if (faz) {
      App.navigateTo('mondo');
      setTimeout(() => {
        try { Fazioni.init(); } catch(e) {}
        setTimeout(() => Fazioni.openView(faz.id), 150);
      }, 100);
      return;
    }
    Toast.show('Fazione "' + titolo + '" non trovata nel Mondo', 'warning', 2500);
    return;
  }

  const w = WikiDM._getData?.() || {};
  for (const sec of ['lore','sessioni']) {
    const n = (w[sec]||[]).find(n => n.titolo === titolo);
    if (n) { WikiDM.switchSection(sec); WikiDM.openNote(n.id); return; }
  }
  Toast.show('Nota "' + titolo + '" non trovata', 'info', 2500);
};

const wikiEditorKeydown = (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key==='b') { e.preventDefault(); wikiF('bold'); }
    if (e.key==='i') { e.preventDefault(); wikiF('italic'); }
    if (e.key==='u') { e.preventDefault(); wikiF('underline'); }
    if (e.key==='s') { e.preventDefault(); WikiDM.saveNote(); Toast.show('Salvato','success',800); }
  }
  if (e.key==='Tab') { e.preventDefault(); document.execCommand('insertHTML',false,'&nbsp;&nbsp;&nbsp;&nbsp;'); }
};

const GlobalSearch = (() => {
  let _idx = -1;
  let _results = [];

  const open = () => {
    Modal.open('global-search');
    setTimeout(() => {
      const inp = document.getElementById('gs-input');
      if (inp) { inp.value = ''; inp.focus(); }
      document.getElementById('gs-results').innerHTML =
        '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.85rem;">Inizia a digitare per cercare...</div>';
    }, 50);
  };

  const search = (q) => {
    const query = q.trim().toLowerCase();
    if (!query || query.length < 2) {
      document.getElementById('gs-results').innerHTML =
        '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.85rem;">Inizia a digitare per cercare...</div>';
      _results = [];
      return;
    }
    _results = [];
    const camp = App.getActiveCampaign();

    try { _results.push(..._enrichedSearch(query, camp)); } catch(e) {}

    const wiki = camp?.wiki || {};
    ['lore','sessioni'].forEach(sec => {
      (wiki[sec]||[]).forEach(n => {
        const text = (n.titolo + ' ' + (n.contenuto||'').replace(/<[^>]+>/g,'')).toLowerCase();
        if (text.includes(query)) {
          const secLabel = sec === 'lore' ? '📚 Lore' : '📋 Sessione';
          _results.push({ tipo:secLabel, nome:n.titolo||'Senza titolo', sub:'', action:() => { Modal.close('global-search'); App.navigateTo('wiki'); setTimeout(()=>{ WikiDM.switchSection(sec); WikiDM.openNote(n.id); },200); } });
        }
      });
    });

    try {
      const monsters = Compendio?.getData()?.monsters || [];
      monsters.slice(0,500).forEach(m => {
        if ((m.nome||'').toLowerCase().includes(query)) {
          _results.push({ tipo:'🐉 Mostro', nome:m.nome, sub:'GS '+(m.grado_sfida?.raw||'?'), action:() => { Modal.close('global-search'); App.navigateTo('compendio'); setTimeout(()=>Compendio.openMonster(m.id),200); } });
        }
      });
    } catch(e) {}

    _idx = -1;
    _renderResults(query);
  };

  const _renderResults = (query) => {
    const el = document.getElementById('gs-results');
    if (!el) return;
    if (!_results.length) {
      el.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);">Nessun risultato per "' + query + '"</div>';
      return;
    }
    el.innerHTML = _results.slice(0,20).map((r,i) =>
      '<div data-gs-idx="'+i+'" style="display:flex;align-items:center;gap:10px;padding:9px 16px;cursor:pointer;border-bottom:1px solid var(--border);'+(_idx===i?'background:var(--bg-tertiary);':'')+'" onclick="GlobalSearch._pick('+i+')" onmouseenter="GlobalSearch._hover('+i+')" onmouseleave="this.style.background=\'\'">' +
        '<span style="font-size:0.82rem;flex-shrink:0;min-width:80px;color:var(--text-muted);">' + r.tipo + '</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:0.88rem;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + r.nome + '</div>' +
          (r.sub ? '<div style="font-size:0.72rem;color:var(--text-muted);">' + r.sub + '</div>' : '') +
        '</div>' +
      '</div>'
    ).join('') + (_results.length > 20 ? '<div style="padding:8px 16px;font-size:0.72rem;color:var(--text-muted);">e altri ' + (_results.length-20) + ' risultati — affina la ricerca</div>' : '');
  };

  const _hover = (i) => {
    _idx = i;
    document.querySelectorAll('[data-gs-idx]').forEach((el,j) => {
      el.style.background = j===i ? 'var(--bg-tertiary)' : '';
    });
  };

  const _pick = (i) => {
    const r = _results[i];
    if (r) r.action();
  };

  const keydown = (e) => {
    if (e.key === 'Escape') { Modal.close('global-search'); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); _idx = Math.min(_idx+1, Math.min(_results.length,20)-1); _renderResults(document.getElementById('gs-input')?.value||''); }
    if (e.key === 'ArrowUp') { e.preventDefault(); _idx = Math.max(_idx-1, -1); _renderResults(document.getElementById('gs-input')?.value||''); }
    if (e.key === 'Enter' && _idx >= 0) { e.preventDefault(); _pick(_idx); }
  };

  return { open, search, keydown, _pick, _hover };
})();

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    GlobalSearch.open();
  }
  if (e.key === 'Escape') {
    const gs = document.getElementById('modal-global-search');
    if (gs && gs.style.display !== 'none') Modal.close('global-search');
  }
});

const Scratchpad = (() => {
  const KEY = 'dm_scratchpad';
  let _open = false;

  const toggle = () => {
    const panel = document.getElementById('scratchpad-panel');
    if (!panel) return;
    _open = !_open;
    panel.style.display = _open ? 'flex' : 'none';
    if (_open) {
      const ta = document.getElementById('scratchpad-text');
      if (ta) { ta.value = localStorage.getItem(KEY) || ''; ta.focus(); }
    }
  };

  const save = () => {
    const val = document.getElementById('scratchpad-text')?.value || '';
    localStorage.setItem(KEY, val);
  };

  const clear = () => {
    if (!confirm('Pulire lo scratchpad?')) return;
    localStorage.removeItem(KEY);
    const ta = document.getElementById('scratchpad-text');
    if (ta) ta.value = '';
  };

  return { toggle, save, clear };
})();

const wikiCallout = (tipo) => {
  const labels = {
    'read-aloud': '📢 READ ALOUD',
    'secret':     '🔒 SEGRETO DM',
    'loot':       '💰 LOOT',
    'clue':       '🔍 INDIZIO',
    'trap':       '⚠️ TRAPPOLA',
    'improv':     '💡 IMPROV',
  };
  const el = document.getElementById('wiki-note-content');
  if (!el) return;
  el.focus();
  document.execCommand('insertHTML', false,
    '<div class="wiki-callout wiki-callout-' + tipo + '" contenteditable="true">' +
    '<span class="wiki-callout-label">' + (labels[tipo]||tipo) + '</span>' +
    '<p>...</p></div><p><br></p>'
  );
  WikiDM.saveNote();
};

const ncCallout = (tipo) => {
  const labels = {
    'read-aloud': '📢 READ ALOUD', 'secret': '🔒 SEGRETO DM',
    'loot': '💰 LOOT', 'clue': '🔍 INDIZIO',
    'trap': '⚠️ TRAPPOLA', 'improv': '💡 IMPROV',
  };
  const el = document.getElementById('nc-page-content');
  if (!el) return;
  el.focus();
  document.execCommand('insertHTML', false,
    '<div class="wiki-callout wiki-callout-' + tipo + '">' +
    '<span class="wiki-callout-label">' + (labels[tipo]||tipo) + '</span>' +
    '<p>...</p></div><p><br></p>'
  );
  NoteCampagna.savePage();
};

const Clocks = (() => {
  const _getClocks = () => {
    const camp = App.getActiveCampaign();
    return camp?.clocks || [];
  };
  const _saveClocks = (clocks) => App.saveActiveCampaign({ clocks });

  const render = () => {
    const el = document.getElementById('clocks-list');
    if (!el) return;
    const clocks = _getClocks();
    if (!clocks.length) {
      el.innerHTML = '<div class="text-muted text-sm" style="padding:8px;">Nessun clock attivo. Usali per rituali, inseguimenti, pressione fazioni, allarmi...</div>';
      return;
    }
    el.innerHTML = clocks.map((c, i) => {
      const pct = Math.round((c.current / c.max) * 100);
      const color = pct >= 100 ? 'var(--accent-danger)' : pct >= 66 ? '#f5a623' : 'var(--accent-secondary)';
      const segs = Array.from({length: c.max}, (_, j) => {
        const filled = j < c.current;
        return '<div style="flex:1;height:100%;background:' + (filled ? color : 'var(--bg-tertiary)') + ';border-right:1px solid var(--bg-primary);transition:background 0.2s;"></div>';
      }).join('');
      return '<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 12px;min-width:180px;flex:1;max-width:240px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<span style="font-family:var(--font-display);font-size:0.82rem;font-weight:600;">' + c.nome + '</span>' +
          '<div style="display:flex;gap:2px;">' +
            '<span style="font-size:0.68rem;color:var(--text-muted);">' + c.current + '/' + c.max + '</span>' +
            '<button onclick="Clocks.tick('+i+')" style="background:none;border:none;cursor:pointer;color:var(--accent-secondary);font-size:0.8rem;padding:0 3px;" title="Avanza">+</button>' +
            '<button onclick="Clocks.untick('+i+')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.8rem;padding:0 3px;" title="Indietro">−</button>' +
            '<button onclick="Clocks.remove('+i+')" style="background:none;border:none;cursor:pointer;color:var(--accent-danger);font-size:0.8rem;padding:0 3px;" title="Rimuovi">✕</button>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;height:14px;border-radius:4px;overflow:hidden;gap:1px;">' + segs + '</div>' +
        (c.note ? '<div style="font-size:0.68rem;color:var(--text-muted);margin-top:4px;">' + c.note + '</div>' : '') +
        (pct >= 100 ? '<div style="font-size:0.7rem;color:var(--accent-danger);margin-top:4px;font-weight:600;">⚡ COMPLETATO</div>' : '') +
      '</div>';
    }).join('');
  };

  const add = () => {
    const nome = prompt('Nome del clock (es. "Rituale del Profano", "Inseguimento"):', '');
    if (!nome?.trim()) return;
    const maxStr = prompt('Quanti segmenti? (4, 6, 8, 10...)', '6');
    const max = Math.max(2, Math.min(20, parseInt(maxStr) || 6));
    const nota = prompt('Nota opzionale (lascia vuoto per saltare):', '') || '';
    const clocks = _getClocks();
    clocks.push({ nome: nome.trim(), max, current: 0, nota });
    _saveClocks(clocks);
    render();
  };

  const tick = (i) => {
    const clocks = _getClocks();
    if (!clocks[i]) return;
    clocks[i].current = Math.min(clocks[i].max, clocks[i].current + 1);
    if (clocks[i].current >= clocks[i].max) Toast.show('⚡ Clock "' + clocks[i].nome + '" completato!', 'warning', 4000);
    _saveClocks(clocks);
    render();
  };

  const untick = (i) => {
    const clocks = _getClocks();
    if (!clocks[i]) return;
    clocks[i].current = Math.max(0, clocks[i].current - 1);
    _saveClocks(clocks);
    render();
  };

  const remove = (i) => {
    if (!confirm('Rimuovere questo clock?')) return;
    const clocks = _getClocks();
    clocks.splice(i, 1);
    _saveClocks(clocks);
    render();
  };

  return { add, tick, untick, remove, render };
})();

const _renderDashRecenti = () => {
  const camp = App.getActiveCampaign();
  const wiki = camp?.wiki || {};
  const el = document.getElementById('dash-recent-notes');
  const clocksEl = document.getElementById('dash-clocks-preview');

  if (el) {
    const all = [...(wiki.lore||[]), ...(wiki.sessioni||[])]
      .sort((a,b) => (b.aggiornatoAt||0) - (a.aggiornatoAt||0))
      .slice(0, 5);
    if (!all.length) {
      el.innerHTML = '<div style="padding:8px 12px;color:var(--text-muted);font-size:0.82rem;">Nessuna nota wiki ancora.</div>';
    } else {
      el.innerHTML = all.map(n => {
        const sec = (wiki.lore||[]).find(x=>x.id===n.id) ? 'lore' : 'sessioni';
        const icon = sec === 'sessioni' ? '⚔️' : (n.pinned ? '📌' : '📄');
        const ago = _timeAgo(n.aggiornatoAt);
        return '<div style="display:flex;align-items:center;gap:8px;padding:6px 12px;cursor:pointer;border-bottom:1px solid var(--border);" onclick="App.navigateTo(\'wiki\');setTimeout(()=>{WikiDM.switchSection(\''+sec+'\');WikiDM.openNote(\''+n.id+'\');},200)">' +
          '<span style="font-size:0.8rem;">' + icon + '</span>' +
          '<span style="flex:1;font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (n.titolo||'Senza titolo') + '</span>' +
          '<span style="font-size:0.68rem;color:var(--text-muted);flex-shrink:0;">' + ago + '</span>' +
          '</div>';
      }).join('');
    }
  }

  if (clocksEl) {
    const clocks = camp?.clocks || [];
    if (!clocks.length) {
      clocksEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;">Nessun clock. Aggiungili in Sessione.</div>';
    } else {
      clocksEl.innerHTML = clocks.slice(0,3).map(c => {
        const pct = Math.round((c.current/c.max)*100);
        const color = pct>=100?'var(--accent-danger)':pct>=66?'#f5a623':'var(--accent-secondary)';
        return '<div style="margin-bottom:8px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:3px;">' +
            '<span>' + c.nome + '</span><span style="color:'+color+';">' + c.current+'/'+c.max + '</span>' +
          '</div>' +
          '<div style="height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden;">' +
            '<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:3px;transition:width 0.3s;"></div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  }
};

const _timeAgo = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff/60000);
  const h = Math.floor(diff/3600000);
  const d = Math.floor(diff/86400000);
  if (m < 1) return 'ora';
  if (m < 60) return m + 'm fa';
  if (h < 24) return h + 'h fa';
  return d + 'g fa';
};

const WikiGrafo = (() => {
  let _sim = null;
  const C = { wiki:'#5ba4f5', sessione:'#c97bea', png:'#69cc85', luogo:'#f5a623', fazione:'#ff6b6b' };
  const I = { wiki:'📄', sessione:'⚔️', png:'👤', luogo:'🗺️', fazione:'⚔️' };

  const _build = () => {
    const camp = App.getActiveCampaign();
    const wiki = camp?.wiki || {};
    const nodes = [], links = [], map = {};
    const showWiki = document.getElementById('grafo-show-wiki')?.checked !== false;
    const showPng  = document.getElementById('grafo-show-png')?.checked !== false;
    const showLoc  = document.getElementById('grafo-show-luoghi')?.checked !== false;
    const showFaz  = document.getElementById('grafo-show-fazioni')?.checked !== false;

    const add = (id, label, tipo, ref) => {
      if (!map[id]) { const n={id,label,tipo,ref,deg:0}; nodes.push(n); map[id]=n; }
      return map[id];
    };
    const link = (s,t) => { if(map[s]&&map[t]&&s!==t){ links.push({source:s,target:t}); map[s].deg++; map[t].deg++; } };

    if (showWiki) ['lore','sessioni'].forEach(sec => (wiki[sec]||[]).forEach(n => add('w_'+n.id, n.titolo||'—', sec==='sessioni'?'sessione':'wiki', {sec,id:n.id})));
    if (showPng)  (camp?.npcs||[]).forEach(n => add('p_'+n.id, n.name||n.nome||'', 'png', {id:n.id}));
    if (showLoc)  (camp?.locations||[]).forEach(l => add('l_'+l.id, l.nome||'', 'luogo', {id:l.id}));
    if (showFaz)  (camp?.factions||[]).forEach(f => add('f_'+f.id, f.nome||'', 'fazione', {id:f.id}));

    ['lore','sessioni'].forEach(sec => (wiki[sec]||[]).forEach(n => {
      const src = 'w_'+n.id;
      [...(n.contenuto||'').matchAll(/data-link="([^"]+)"/g)].forEach(m => {
        const key=m[1], tipo=key.startsWith('png:')?'png':key.startsWith('luogo:')?'luogo':key.startsWith('fazione:')?'fazione':'wiki';
        const nome=tipo==='wiki'?key:key.slice({png:4,luogo:6,fazione:8}[tipo]);
        if (tipo==='png') { const x=(camp?.npcs||[]).find(x=>(x.name||x.nome||'')===nome); if(x)link(src,'p_'+x.id); }
        else if (tipo==='luogo') { const x=(camp?.locations||[]).find(x=>x.nome===nome); if(x)link(src,'l_'+x.id); }
        else if (tipo==='fazione') { const x=(camp?.factions||[]).find(x=>x.nome===nome); if(x)link(src,'f_'+x.id); }
        else ['lore','sessioni'].forEach(s=>{ const x=(wiki[s]||[]).find(x=>x.titolo===nome); if(x)link(src,'w_'+x.id); });
      });
    }));
    if (showPng&&showFaz) (camp?.npcs||[]).forEach(n=>{ if(n.factionId)link('p_'+n.id,'f_'+n.factionId); });
    return {nodes,links};
  };

  const _open = (d) => {
    if (d.tipo==='wiki'||d.tipo==='sessione') { WikiDM.switchSection(d.tipo==='sessione'?'sessioni':'lore'); WikiDM.openNote(d.ref.id); }
    else if (d.tipo==='png') { App.navigateTo('mondo'); setTimeout(()=>NPC.openView(d.ref.id),150); }
    else if (d.tipo==='luogo') { App.navigateTo('mondo'); setTimeout(()=>Luoghi.openView(d.ref.id),150); }
    else if (d.tipo==='fazione') { App.navigateTo('mondo'); setTimeout(()=>Fazioni.openView(d.ref.id),150); }
  };

  const render = () => {
    const svg = document.getElementById('wiki-grafo-svg');
    if (!svg) return;

    if (!svg.clientWidth) {
      setTimeout(() => render(), 100);
      return;
    }
    const {nodes,links} = _build();
    const W = svg.clientWidth || 800, H = Math.max(svg.clientHeight, 400);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    if (!nodes.length) {
      const t=document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x',W/2);t.setAttribute('y',H/2);t.setAttribute('text-anchor','middle');
      t.setAttribute('fill','#555');t.setAttribute('font-size','14');
      t.textContent='Nessun nodo — crea note con [[link]] per popolare il grafo';
      svg.appendChild(t); return;
    }

    if (typeof d3==='undefined') {

      const r=Math.min(W,H)*0.35, cx=W/2, cy=H/2;
      nodes.forEach((n,i)=>{ n.x=cx+r*Math.cos(i/nodes.length*2*Math.PI-Math.PI/2); n.y=cy+r*Math.sin(i/nodes.length*2*Math.PI-Math.PI/2); });
      links.forEach(l=>{ const s=nodes.find(n=>n.id===l.source),t=nodes.find(n=>n.id===l.target); if(!s||!t)return;
        const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
        ln.setAttribute('x1',s.x);ln.setAttribute('y1',s.y);ln.setAttribute('x2',t.x);ln.setAttribute('y2',t.y);
        ln.setAttribute('stroke','#444');ln.setAttribute('stroke-width','1.5');svg.appendChild(ln); });
      nodes.forEach(n=>{ const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
        c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);c.setAttribute('r',18);c.setAttribute('fill',C[n.tipo]||'#888');
        c.style.cursor='pointer';c.onclick=()=>_open(n);svg.appendChild(c); });
      return;
    }

    if (_sim) _sim.stop();
    const d3svg=d3.select(svg);
    const g=d3svg.append('g');
    d3svg.call(d3.zoom().scaleExtent([0.2,4]).on('zoom',e=>g.attr('transform',e.transform)));
    const defs=d3svg.append('defs');
    defs.append('marker').attr('id','arr').attr('viewBox','0 -5 10 10').attr('refX',22).attr('refY',0)
      .attr('markerWidth',5).attr('markerHeight',5).attr('orient','auto')
      .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#444');

    const lnk=g.append('g').selectAll('line').data(links).enter().append('line')
      .attr('stroke','#444').attr('stroke-width',1.5).attr('marker-end','url(#arr)').attr('opacity',0.5);

    const nd=g.append('g').selectAll('g').data(nodes).enter().append('g').attr('cursor','pointer')
      .call(d3.drag()
        .on('start',(e,d)=>{if(!e.active)_sim.alphaTarget(0.3).restart();d.fx=d.x;d.fy=d.y;})
        .on('drag', (e,d)=>{d.fx=e.x;d.fy=e.y;})
        .on('end',  (e,d)=>{if(!e.active)_sim.alphaTarget(0);d.fx=null;d.fy=null;}))
      .on('click',(e,d)=>_open(d));

    nd.append('circle').attr('r',d=>Math.max(16,12+d.deg*3))
      .attr('fill',d=>C[d.tipo]||'#888').attr('fill-opacity',0.85)
      .attr('stroke','#1a1a1a').attr('stroke-width',2);
    nd.append('text').attr('text-anchor','middle').attr('dy','0.35em').attr('font-size','12').text(d=>I[d.tipo]||'📄');
    nd.append('text').attr('text-anchor','middle').attr('dy',d=>Math.max(16,12+d.deg*3)+13)
      .attr('fill','#ccc').attr('font-size','10').text(d=>d.label.length>16?d.label.slice(0,14)+'…':d.label);

    _sim=d3.forceSimulation(nodes)
      .force('link',d3.forceLink(links).id(d=>d.id).distance(110).strength(0.8))
      .force('charge',d3.forceManyBody().strength(-280))
      .force('center',d3.forceCenter(W/2,H/2))
      .force('collision',d3.forceCollide(35))
      .on('tick',()=>{
        lnk.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
        nd.attr('transform',d=>'translate('+d.x+','+d.y+')');
      });
  };
  return { render };
})();

const wikiInsertImage = () => {
  const url = prompt('URL immagine (es. https://i.imgur.com/...):', '');
  if (!url?.trim()) return;
  const alt = prompt('Descrizione immagine (opzionale):', '') || 'immagine';
  const el = document.getElementById('wiki-note-content');
  if (!el) return;
  el.focus();
  document.execCommand('insertHTML', false,
    '<figure style="margin:12px 0;text-align:center;">' +
    '<img src="' + url.trim() + '" alt="' + alt + '" style="max-width:100%;border-radius:var(--radius-md);border:1px solid var(--border);" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'block\'">' +
    '<div style="display:none;padding:8px;background:var(--bg-tertiary);border-radius:var(--radius-md);color:var(--text-muted);font-size:0.78rem;">⚠️ Immagine non caricata: ' + url.trim() + '</div>' +
    (alt !== 'immagine' ? '<figcaption style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">' + alt + '</figcaption>' : '') +
    '</figure><p><br></p>'
  );
  WikiDM.saveNote();
};

const MentionPicker = (() => {
  let _active = false;
  let _query  = '';
  let _idx    = 0;
  let _results = [];
  let _editorEl = null;
  let _atRange  = null;

  const _getItems = (q) => {
    const camp = App.getActiveCampaign();
    const wiki = camp?.wiki || {};
    const items = [];
    const lc = q.toLowerCase();

    ['lore','sessioni'].forEach(sec => {
      (wiki[sec]||[]).forEach(n => {
        if (!lc || (n.titolo||'').toLowerCase().includes(lc)) {
          items.push({
            label: (sec === 'sessioni' ? '⚔️' : '📄') + ' ' + (n.titolo||'Senza titolo'),
            key: n.titolo || '', tipo: 'wiki', sec, id: n.id,
            color: sec === 'sessioni' ? '#c97bea' : '#5ba4f5',
          });
        }
      });
    });

    (camp?.npcs||[]).forEach(n => {
      const nome = n.name || n.nome || '';
      if (!lc || nome.toLowerCase().includes(lc)) {
        items.push({ label:'👤 '+nome, key:'png:'+nome, tipo:'png', id:n.id, color:'#69cc85' });
      }
    });

    (camp?.locations||[]).forEach(l => {
      if (!lc || (l.nome||'').toLowerCase().includes(lc)) {
        items.push({ label:'🗺️ '+(l.nome||''), key:'luogo:'+(l.nome||''), tipo:'luogo', id:l.id, color:'#f5a623' });
      }
    });

    (camp?.factions||[]).forEach(f => {
      if (!lc || (f.nome||'').toLowerCase().includes(lc)) {
        items.push({ label:'⚔️ '+(f.nome||''), key:'fazione:'+(f.nome||''), tipo:'fazione', id:f.id, color:'#ff6b6b' });
      }
    });

    return items.slice(0, 12);
  };

  const _show = (x, y) => {
    const dd = document.getElementById('mention-dropdown');
    if (!dd) return;
    dd.style.display = 'block';

    const vw = window.innerWidth, vh = window.innerHeight;
    const left = Math.min(x, vw - 280);
    const top  = y + 22 + window.scrollY;
    dd.style.left = left + 'px';
    dd.style.top  = (top > vh - 300 ? y - 10 - 280 + window.scrollY : top) + 'px';
    _renderList();
  };

  const _hide = () => {
    _active = false;
    _query  = '';
    _idx    = 0;
    _results = [];
    _atRange = null;
    const dd = document.getElementById('mention-dropdown');
    if (dd) dd.style.display = 'none';
  };

  const _renderList = () => {
    _results = _getItems(_query);
    const el = document.getElementById('mention-list');
    if (!el) return;
    if (!_results.length) { _hide(); return; }
    el.innerHTML = _results.map((r, i) =>
      '<div data-mi="'+i+'" onclick="MentionPicker.pick('+i+')" style="'+
      'padding:7px 12px;cursor:pointer;font-size:0.82rem;display:flex;align-items:center;gap:8px;'+
      (_idx===i ? 'background:var(--bg-tertiary);' : '')+'">' +
        '<span style="width:6px;height:6px;border-radius:50%;background:'+r.color+';flex-shrink:0;"></span>'+
        r.label +
      '</div>'
    ).join('');
  };

  const onInput = (e, el) => {
    _editorEl = el;
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;

    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);

    const anchor = sel.anchorNode;
    if (!anchor || anchor.nodeType !== Node.TEXT_NODE) { _hide(); return; }
    const textBefore = anchor.textContent.slice(0, sel.anchorOffset);
    const atIdx = textBefore.lastIndexOf('@');
    if (atIdx < 0) { _hide(); return; }

    const afterAt = textBefore.slice(atIdx + 1);
    // Nasconde se: c'è uno spazio dopo la @, o la @ è troppo lontana (>30 char)
    if (afterAt.includes(' ')) { _hide(); return; }
    if (afterAt.length > 30) { _hide(); return; }
    // Nasconde se la @ fa parte di un indirizzo email (char prima è alfanumerico)
    if (atIdx > 0 && /[a-zA-Z0-9]/.test(textBefore[atIdx - 1])) { _hide(); return; }

    _query = afterAt;
    _active = true;

    const rect = range.getBoundingClientRect();
    _show(rect.left, rect.top);

    _atRange = document.createRange();
    _atRange.setStart(anchor, atIdx);
    _atRange.setEnd(anchor, sel.anchorOffset);
  };

  const onKeydown = (e) => {
    if (!_active) return;
    if (e.key === 'ArrowDown')  { e.preventDefault(); _idx = Math.min(_idx+1, _results.length-1); _renderList(); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); _idx = Math.max(_idx-1, 0); _renderList(); }
    else if (e.key === 'Enter' || e.key === 'Tab') { if (_results.length) { e.preventDefault(); pick(_idx); } }
    else if (e.key === 'Escape') { _hide(); }
  };

  const pick = (i) => {
    const r = _results[i];
    if (!r || !_atRange) { _hide(); return; }

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(_atRange);

    const titolo = r.tipo === 'wiki' ? r.key
                 : r.tipo === 'png'  ? r.key.slice(4)
                 : r.tipo === 'luogo' ? r.key.slice(6)
                 : r.key.slice(8);
    const icon = r.tipo === 'png' ? '👤 '
               : r.tipo === 'luogo' ? '🗺️ '
               : r.tipo === 'fazione' ? '⚔️ '
               : '';

    document.execCommand('insertHTML', false,
      '<span class="nc-wikilink" data-link="'+r.key+'" '+
      'onclick="wikiNavigateLink(\''+r.key.replace(/'/g,"\\'")+'\')" '+
      'style="cursor:pointer;color:'+r.color+';">@'+icon+titolo+'</span>&nbsp;'
    );

    _hide();

    if (_editorEl?.id === 'wiki-note-content') WikiDM.saveNote();
    else if (_editorEl?.id === 'nc-page-content') NoteCampagna.savePage();
  };

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#mention-dropdown') && !e.target.closest('[contenteditable]')) {
      _hide();
    }
  });

  const attachToInput = (inputEl) => {
    if (!inputEl || inputEl._mpAttached) return;
    inputEl._mpAttached = true;
    inputEl.addEventListener('input', () => {
      const val = inputEl.value;
      const cursor = inputEl.selectionStart || val.length;
      const before = val.slice(0, cursor);
      const atIdx  = before.lastIndexOf('@');
      if (atIdx < 0) { _hide(); return; }
      const query = before.slice(atIdx + 1);
      if (/\s/.test(query)) { _hide(); return; }
      if (query.length > 30) { _hide(); return; }
      if (atIdx > 0 && /[a-zA-Z0-9]/.test(before[atIdx - 1])) { _hide(); return; }
      _query   = query;
      _results = _getItems(query);
      if (!_results.length) { _hide(); return; }
      const rect = inputEl.getBoundingClientRect();
      _show(rect.left, rect.bottom + window.scrollY);
      _render((item) => {
        const name = item.key.replace(/^(png|luogo|fazione|wiki):/, '');
        const before2 = val.slice(0, atIdx);
        const after2  = val.slice(cursor);
        inputEl.value = before2 + '@' + name + (after2.startsWith(' ') ? after2 : ' ' + after2);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        _hide();
      });
    });
    inputEl.addEventListener('keydown', (e) => {
      if (!_active) return;
      if (e.key === 'ArrowDown') { _idx = Math.min(_idx+1, _results.length-1); _render(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { _idx = Math.max(_idx-1, 0); _render(); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === 'Tab') {
        if (_results[_idx]) {
          const item = _results[_idx];
          const name = item.key.replace(/^(png|luogo|fazione|wiki):/, '');
          const val  = inputEl.value;
          const cursor = inputEl.selectionStart || val.length;
          const atIdx = val.slice(0, cursor).lastIndexOf('@');
          inputEl.value = val.slice(0, atIdx) + '@' + name + ' ' + val.slice(cursor);
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          _hide();
        }
        e.preventDefault();
      } else if (e.key === 'Escape') _hide();
    });
    inputEl.addEventListener('blur', () => setTimeout(_hide, 150));
  };

  return { onInput, onKeydown, pick, attachToInput };
})();

const ScenePlanner = (() => {
  const BEAT_TYPES = [
    { value:'apertura',    label:'Apertura',     color:'#5ba4f5' },
    { value:'sociale',     label:'Sociale',      color:'#69cc85' },
    { value:'esplorazione',label:'Esplorazione',  color:'#f5a623' },
    { value:'combattimento',label:'Combattimento',color:'#ff6b6b' },
    { value:'rivelazione', label:'Rivelazione',  color:'#c97bea' },
    { value:'cliffhanger', label:'Cliffhanger',  color:'#ff9f43' },
    { value:'riposo',      label:'Riposo',        color:'#aaa' },
    { value:'libero',      label:'Libero',        color:'#888' },
  ];

  const _getActiveSession = () => {
    const camp = App.getActiveCampaign();
    return (camp?.sessioni_log||[]).find(s => s.stato === 'in_corso') || null;
  };

  const _getBeats = () => {
    const sess = _getActiveSession();
    if (sess) return sess.beats || [];

    return App.getActiveCampaign()?.sceneBeats || [];
  };

  const _saveBeats = (beats) => {
    const sess = _getActiveSession();
    if (sess) {
      const camp = App.getActiveCampaign();
      const sessioni = (camp?.sessioni_log||[]).map(s =>
        s.id === sess.id ? { ...s, beats } : s
      );
      App.saveActiveCampaign({ sessioni_log: sessioni });
    } else {

      App.saveActiveCampaign({ sceneBeats: beats });
    }
  };

  const render = () => {
    const list = document.getElementById('scene-planner-list');
    const empty = document.getElementById('scene-planner-empty');
    if (!list) return;

    const activeSess = _getActiveSession();
    const badge = document.getElementById('scene-sess-badge');
    if (badge) {
      if (activeSess) {
        badge.style.display = '';
        badge.textContent = 'Sessione ' + activeSess.numero + (activeSess.titolo ? ' — ' + activeSess.titolo : '') + ' · in corso';
      } else {
        badge.style.display = 'none';
      }
    }

    const beats = _getBeats();
    if (!beats.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    list.innerHTML = beats.map((b, i) => {
      const tipo = BEAT_TYPES.find(t => t.value === b.tipo) || BEAT_TYPES[7];
      return (
        '<div class="scene-beat" data-idx="'+i+'" style="display:flex;align-items:flex-start;gap:8px;'+
        'padding:8px 10px;background:var(--bg-secondary);border:1px solid var(--border);'+
        'border-left:3px solid '+tipo.color+';border-radius:var(--radius-md);cursor:grab;">' +

          '<span style="color:var(--text-muted);font-size:0.8rem;padding-top:2px;cursor:grab;user-select:none;">⠿</span>' +

          '<div style="flex:1;min-width:0;">' +

            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
              '<select onchange="ScenePlanner.setTipo('+i+',this.value)" '+
              'style="font-size:0.72rem;background:var(--bg-tertiary);border:1px solid var(--border);'+
              'border-radius:var(--radius-sm);padding:2px 4px;color:'+tipo.color+';">' +
              BEAT_TYPES.map(t =>
                '<option value="'+t.value+'"'+(t.value===b.tipo?' selected':'')+'>'+t.label+'</option>'
              ).join('') +
              '</select>' +
              (b.principale ? '<span style="font-size:0.65rem;background:rgba(91,164,245,0.2);color:#5ba4f5;padding:1px 6px;border-radius:var(--radius-full);">★ Principale</span>' : '') +
              (b.tipo === 'cliffhanger' ? '<span style="font-size:0.65rem;background:rgba(255,159,67,0.2);color:#ff9f43;padding:1px 6px;border-radius:var(--radius-full);">⚡ Cliffhanger</span>' : '') +
            '</div>' +

            '<input type="text" value="'+((b.titolo||'').replace(/"/g,'&quot;'))+'" '+
            'placeholder="Titolo beat..." '+
            'onchange="ScenePlanner.setTitolo('+i+',this.value)" '+
            'style="width:100%;background:transparent;border:none;border-bottom:1px solid var(--border);'+
            'padding:2px 0;font-size:0.85rem;color:var(--text-primary);font-family:var(--font-display);'+
            'font-weight:600;margin-bottom:4px;" />' +

            '<textarea placeholder="Note, PNG coinvolti, dettagli..." '+
            'onchange="ScenePlanner.setNote('+i+',this.value)" '+
            'style="width:100%;background:transparent;border:none;font-size:0.78rem;'+
            'color:var(--text-secondary);resize:none;min-height:36px;line-height:1.5;">'+
            (b.note||'')+'</textarea>' +

          '</div>' +

          '<div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0;">' +
            '<button onclick="ScenePlanner.togglePrincipale('+i+')" title="Segna come incontro principale" '+
            'style="background:none;border:none;cursor:pointer;font-size:0.8rem;color:'+(b.principale?'#5ba4f5':'var(--text-muted)')+';">★</button>' +
            '<button onclick="ScenePlanner.moveUp('+i+')" title="Sposta su" '+
            'style="background:none;border:none;cursor:pointer;font-size:0.7rem;color:var(--text-muted);">▲</button>' +
            '<button onclick="ScenePlanner.moveDown('+i+')" title="Sposta giù" '+
            'style="background:none;border:none;cursor:pointer;font-size:0.7rem;color:var(--text-muted);">▼</button>' +
            '<button onclick="ScenePlanner.remove('+i+')" title="Rimuovi" '+
            'style="background:none;border:none;cursor:pointer;font-size:0.8rem;color:var(--accent-danger);">✕</button>' +
          '</div>' +

        '</div>'
      );
    }).join('');
  };

  const addBeat = () => {
    const beats = _getBeats();
    const tipo = beats.length === 0 ? 'apertura'
               : beats.length === 1 ? 'combattimento'
               : 'libero';
    beats.push({ titolo:'', tipo, note:'', principale: false });
    _saveBeats(beats);
    render();

    setTimeout(() => {
      const inputs = document.querySelectorAll('.scene-beat input[type=text]');
      if (inputs.length) inputs[inputs.length-1].focus();
    }, 50);
  };

  const setTipo = (i, v) => {
    const beats = _getBeats();
    if (beats[i]) { beats[i].tipo = v; _saveBeats(beats); render(); }
  };

  const setTitolo = (i, v) => {
    const beats = _getBeats();
    if (beats[i]) { beats[i].titolo = v; _saveBeats(beats); }
  };

  const setNote = (i, v) => {
    const beats = _getBeats();
    if (beats[i]) { beats[i].note = v; _saveBeats(beats); }
  };

  const togglePrincipale = (i) => {
    const beats = _getBeats();
    if (!beats[i]) return;
    const wasMain = beats[i].principale;
    beats.forEach(b => b.principale = false);
    beats[i].principale = !wasMain;
    _saveBeats(beats);
    render();
  };

  const moveUp = (i) => {
    const beats = _getBeats();
    if (i <= 0) return;
    [beats[i-1], beats[i]] = [beats[i], beats[i-1]];
    _saveBeats(beats);
    render();
  };

  const moveDown = (i) => {
    const beats = _getBeats();
    if (i >= beats.length-1) return;
    [beats[i], beats[i+1]] = [beats[i+1], beats[i]];
    _saveBeats(beats);
    render();
  };

  const remove = (i) => {
    const beats = _getBeats();
    beats.splice(i, 1);
    _saveBeats(beats);
    render();
  };

  const clear = () => {
    if (!confirm('Pulire tutti i beat della sessione?')) return;
    _saveBeats([]);
    render();
  };

  return { render, addBeat, setTipo, setTitolo, setNote, togglePrincipale, moveUp, moveDown, remove, clear };
})();

const SessioniLog = (() => {

  let _tempNpcs = [];
  let _editingId = null;

  const _getSessioni = () => {
    const camp = App.getActiveCampaign();
    return (camp?.sessioni_log || []).sort((a,b) => (b.numero||0)-(a.numero||0));
  };

  const _saveSessioni = (sessioni) => App.saveActiveCampaign({ sessioni_log: sessioni });

  const _nextNumero = () => {
    const s = App.getActiveCampaign()?.sessioni_log || [];
    return s.length ? Math.max(...s.map(x => x.numero||0)) + 1 : 1;
  };

  const showTab = (tab) => {
    const corrente = document.getElementById('sessione-content');
    const storico  = document.getElementById('sessione-storico');
    const btnC = document.getElementById('sess-tab-corrente');
    const btnS = document.getElementById('sess-tab-storico');
    if (tab === 'corrente') {
      if (corrente) corrente.style.display = '';
      if (storico)  storico.style.display  = 'none';
      if (btnC) { btnC.className = 'btn btn-primary btn-sm'; btnC.style.fontSize='0.78rem'; }
      if (btnS) { btnS.className = 'btn btn-ghost btn-sm';   btnS.style.fontSize='0.78rem'; }
    } else {
      if (corrente) corrente.style.display = 'none';
      if (storico)  storico.style.display  = '';
      if (btnC) { btnC.className = 'btn btn-ghost btn-sm';   btnC.style.fontSize='0.78rem'; }
      if (btnS) { btnS.className = 'btn btn-primary btn-sm'; btnS.style.fontSize='0.78rem'; }
      renderList();
    }
  };

  const renderList = () => {
    const el = document.getElementById('sessioni-log-list');
    if (!el) return;
    const sessioni = _getSessioni();
    const camp = App.getActiveCampaign();

    if (!sessioni.length) {
      el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:0.85rem;">Nessuna sessione ancora. Crea la prima con "+ Nuova Sessione".</div>';
      return;
    }

    const STATO_COLORS = { pianificata:'#5ba4f5', in_corso:'#f5a623', giocata:'#69cc85' };
    const STATO_LABELS = { pianificata:'Pianificata', in_corso:'In corso', giocata:'Giocata' };

    el.innerHTML = sessioni.map(s => {
      const color = STATO_COLORS[s.stato] || '#888';
      const label = STATO_LABELS[s.stato] || s.stato;
      const npcs = (s.npcs||[]).map(id => {
        const n = (camp?.npcs||[]).find(x => x.id === id);
        return n ? (n.name||n.nome||'') : '';
      }).filter(Boolean);

      const beatCount = (s.beats||[]).length;
      const mainBeat = (s.beats||[]).find(b => b.principale);

      const wikiNota = (camp?.wiki?.sessioni||[]).find(n => n.sessioneId === s.id);

      return (
        '<div style="background:var(--bg-card);border:1px solid var(--border);border-left:3px solid '+color+';'+
        'border-radius:var(--radius-md);padding:14px 16px;display:flex;flex-direction:column;gap:8px;">' +

          '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<span style="font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--text-muted);">S'+s.numero+'</span>' +
              '<div>' +
                '<div style="font-family:var(--font-display);font-size:0.95rem;font-weight:600;">'+( s.titolo||'Senza titolo')+'</div>' +
                (s.data ? '<div style="font-size:0.72rem;color:var(--text-muted);">'+s.data+'</div>' : '') +
              '</div>' +
              '<span style="font-size:0.68rem;padding:2px 8px;background:'+color+'22;color:'+color+';border:1px solid '+color+'44;border-radius:var(--radius-full);">'+label+'</span>' +
            '</div>' +
            '<div style="display:flex;gap:6px;">' +
              (wikiNota ?
                '<button class="btn btn-ghost btn-sm" onclick="SessioniLog.openWiki(\''+s.id+'\')" style="font-size:0.72rem;">📝 Wiki</button>' :
                '<button class="btn btn-ghost btn-sm" onclick="SessioniLog.createWikiNote(\''+s.id+'\')" style="font-size:0.72rem;">+ Nota Wiki</button>'
              ) +
              '<button class="btn btn-ghost btn-sm" onclick="SessioniLog.edit(\''+s.id+'\')" style="font-size:0.72rem;">✏️ Modifica</button>' +
              (s.stato !== 'giocata' ?
                '<button class="btn btn-primary btn-sm" onclick="SessioniLog.setInCorso(\''+s.id+'\')" style="font-size:0.72rem;">▶ In corso</button>' : '') +
              '<button class="btn btn-ghost btn-sm" onclick="SessioniLog.remove(\''+s.id+'\')" style="font-size:0.72rem;color:var(--accent-danger);">✕</button>' +
            '</div>' +
          '</div>' +

          (npcs.length ? '<div style="display:flex;flex-wrap:wrap;gap:4px;">'+
            npcs.map(n => '<span style="font-size:0.72rem;padding:1px 8px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-full);">👤 '+n+'</span>').join('')+
          '</div>' : '') +

          (beatCount ? '<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">' +
            (s.beats||[]).map(b => {
              const BEAT_COLORS = {apertura:'#5ba4f5',sociale:'#69cc85',esplorazione:'#f5a623',combattimento:'#ff6b6b',rivelazione:'#c97bea',cliffhanger:'#ff9f43',riposo:'#aaa',libero:'#888'};
              const bc = BEAT_COLORS[b.tipo]||'#888';
              return '<span style="font-size:0.68rem;padding:1px 8px;background:'+bc+'22;border:1px solid '+bc+'44;color:'+bc+';border-radius:var(--radius-full);">'+(b.principale?'★ ':'')+( b.titolo||b.tipo)+'</span>';
            }).join('') +
          '</div>' : '') +

          (s.recap ? '<div style="font-size:0.78rem;color:var(--text-secondary);border-top:1px solid var(--border);padding-top:8px;line-height:1.5;">'+s.recap.slice(0,200)+(s.recap.length>200?'...':'')+'</div>' : '') +

        '</div>'
      );
    }).join('');
  };

  const newSession = () => {
    _editingId = null;
    _tempNpcs  = [];
    document.getElementById('sl-id').value       = '';
    document.getElementById('sl-numero').value   = _nextNumero();
    document.getElementById('sl-titolo').value   = '';
    document.getElementById('sl-data').value     = new Date().toISOString().slice(0,10);
    document.getElementById('sl-stato').value    = 'pianificata';
    document.getElementById('sl-note-prep').value= '';
    document.getElementById('sl-recap').value    = '';
    document.getElementById('session-log-title').textContent = 'Nuova Sessione';
    _renderNpcsModal();
    _populateNpcSelect();
    Modal.open('session-log');
  };

  const edit = (id) => {
    const s = (App.getActiveCampaign()?.sessioni_log||[]).find(x => x.id === id);
    if (!s) return;
    _editingId = id;
    _tempNpcs  = [...(s.npcs||[])];
    document.getElementById('sl-id').value       = id;
    document.getElementById('sl-numero').value   = s.numero || '';
    document.getElementById('sl-titolo').value   = s.titolo || '';
    document.getElementById('sl-data').value     = s.data || '';
    document.getElementById('sl-stato').value    = s.stato || 'pianificata';
    document.getElementById('sl-note-prep').value= s.notePrep || '';
    document.getElementById('sl-recap').value    = s.recap || '';
    document.getElementById('session-log-title').textContent = 'Sessione ' + s.numero;
    _renderNpcsModal();
    _populateNpcSelect();
    Modal.open('session-log');
  };

  const save = () => {
    const id = document.getElementById('sl-id').value || ('sess_' + Date.now());
    const data = {
      id,
      numero:   parseInt(document.getElementById('sl-numero').value) || 1,
      titolo:   document.getElementById('sl-titolo').value.trim(),
      data:     document.getElementById('sl-data').value,
      stato:    document.getElementById('sl-stato').value,
      npcs:     [..._tempNpcs],
      notePrep: document.getElementById('sl-note-prep').value,
      recap:    document.getElementById('sl-recap').value,
      beats:    _editingId ? ((App.getActiveCampaign()?.sessioni_log||[]).find(x=>x.id===_editingId)?.beats||[]) : [],
      creatoAt: _editingId ? ((App.getActiveCampaign()?.sessioni_log||[]).find(x=>x.id===_editingId)?.creatoAt||Date.now()) : Date.now(),
      aggiornatoAt: Date.now(),
    };

    const camp = App.getActiveCampaign();
    const sessioni = camp?.sessioni_log || [];
    const idx = sessioni.findIndex(x => x.id === id);
    if (idx >= 0) sessioni[idx] = data;
    else sessioni.push(data);
    _saveSessioni(sessioni);

    Modal.close('session-log');
    Toast.show(_editingId ? 'Sessione aggiornata' : 'Sessione '+data.numero+' creata', 'success', 2000);

    if (document.getElementById('sessione-storico')?.style.display !== 'none') renderList();
  };

  const remove = (id) => {
    if (!confirm('Eliminare questa sessione?')) return;
    const sessioni = (App.getActiveCampaign()?.sessioni_log||[]).filter(x => x.id !== id);
    _saveSessioni(sessioni);
    renderList();
  };

  const setInCorso = (id) => {
    const sessioni = (App.getActiveCampaign()?.sessioni_log||[]).map(s =>
      ({ ...s, stato: s.id === id ? 'in_corso' : (s.stato === 'in_corso' ? 'pianificata' : s.stato) })
    );
    _saveSessioni(sessioni);
    renderList();
    Toast.show('Sessione impostata come in corso — i beat si salvano qui', 'success', 2000);

    setTimeout(() => { try { ScenePlanner.render(); } catch(e) {} }, 100);
  };

  const addNpc = (id) => {
    if (!id || _tempNpcs.includes(id)) return;
    _tempNpcs.push(id);
    _renderNpcsModal();
  };

  const _removeNpc = (id) => {
    _tempNpcs = _tempNpcs.filter(x => x !== id);
    _renderNpcsModal();
  };

  const _renderNpcsModal = () => {
    const el = document.getElementById('sl-npcs-list');
    if (!el) return;
    const camp = App.getActiveCampaign();
    el.innerHTML = _tempNpcs.map(id => {
      const n = (camp?.npcs||[]).find(x => x.id === id);
      const nome = n ? (n.name||n.nome||'') : id;
      return '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-full);font-size:0.72rem;">'+
        '👤 '+nome+
        '<button onclick="SessioniLog._removeNpc(\''+id+'\')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.7rem;">✕</button>'+
        '</span>';
    }).join('');
  };

  const _populateNpcSelect = () => {
    const sel = document.getElementById('sl-npcs-select');
    if (!sel) return;
    const camp = App.getActiveCampaign();
    sel.innerHTML = '<option value="">Aggiungi PNG...</option>' +
      (camp?.npcs||[]).map(n =>
        '<option value="'+n.id+'">'+(n.name||n.nome||'')+'</option>'
      ).join('');
  };

  const createWikiNote = (sessioneId) => {
    const s = (App.getActiveCampaign()?.sessioni_log||[]).find(x => x.id === sessioneId);
    if (!s) return;
    const camp = App.getActiveCampaign();
    const wiki = camp?.wiki || { lore:[], sessioni:[], templates:[] };
    const uid = 'n' + Date.now() + Math.random().toString(36).slice(2,5);
    const npcsLinks = (s.npcs||[]).map(id => {
      const n = (camp?.npcs||[]).find(x => x.id === id);
      return n ? '<span class="nc-wikilink" data-link="png:'+(n.name||n.nome||'')+'" onclick="wikiNavigateLink(\'png:'+(n.name||n.nome||'')+'\')">[[👤 '+(n.name||n.nome||'')+']]</span>' : '';
    }).filter(Boolean).join(' · ');

    const beatsHtml = (s.beats||[]).map(b =>
      '<li>'+(b.principale?'<strong>':'')+(b.titolo||b.tipo)+(b.principale?'</strong>':'')+(b.note?' — '+b.note:'')+'</li>'
    ).join('');

    const contenuto =
      '<h1>Sessione '+s.numero+' — '+(s.titolo||'')+'</h1>' +
      '<p><strong>Data:</strong> '+(s.data||'')+'&nbsp;|&nbsp;<strong>Stato:</strong> '+(s.stato||'')+'&nbsp;|&nbsp;#sessione</p>' +
      (npcsLinks ? '<p><strong>PNG coinvolti:</strong> '+npcsLinks+'</p>' : '') +
      (beatsHtml ? '<h2>Beat</h2><ul>'+beatsHtml+'</ul>' : '') +
      (s.notePrep ? '<h2>Note di prep</h2><p>'+s.notePrep+'</p>' : '') +
      '<h2>Note live</h2><p></p>' +
      (s.recap ? '<h2>Recap</h2><p>'+s.recap+'</p>' : '<h2>Recap</h2><p></p>');

    const nota = {
      id: uid,
      titolo: 'Sessione '+s.numero+(s.titolo?' — '+s.titolo:''),
      contenuto,
      tags: ['sessione'],
      sessioneId,
      creatoAt: Date.now(),
      aggiornatoAt: Date.now(),
    };

    if (!wiki.sessioni) wiki.sessioni = [];
    wiki.sessioni.unshift(nota);
    App.saveActiveCampaign({ wiki });

    const sessioni = (camp.sessioni_log||[]).map(x =>
      x.id === sessioneId ? { ...x, wikiNoteId: uid } : x
    );
    App.saveActiveCampaign({ sessioni_log: sessioni });

    Toast.show('📝 Nota Wiki creata — apertura...', 'success', 2000);
    setTimeout(() => {
      App.navigateTo('wiki');
      setTimeout(() => { WikiDM.switchSection('sessioni'); WikiDM.openNote(uid); }, 200);
    }, 300);
  };

  const openWiki = (sessioneId) => {
    const camp = App.getActiveCampaign();
    const nota = (camp?.wiki?.sessioni||[]).find(n => n.sessioneId === sessioneId);
    if (!nota) return;
    App.navigateTo('wiki');
    setTimeout(() => { WikiDM.switchSection('sessioni'); WikiDM.openNote(nota.id); }, 200);
  };

  return {
    showTab, renderList, newSession, edit, save, remove,
    setInCorso, addNpc, _removeNpc,
    createWikiNote, openWiki,
  };
})();

const _enrichedSearchOrig = _enrichedSearch;

const QuestKanban = (() => {
  let _view = 'kanban';

  const setView = (v) => {
    _view = v;
    const kanban = document.getElementById('quest-kanban-view');
    const list   = document.getElementById('quest-list-view');
    const btnK   = document.getElementById('quest-view-kanban');
    const btnL   = document.getElementById('quest-view-list');
    if (kanban) kanban.style.display = v === 'kanban' ? 'flex' : 'none';
    if (list)   list.style.display   = v === 'list' ? '' : 'none';
    if (btnK) { btnK.className = v === 'kanban' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'; btnK.style.fontSize='0.72rem'; }
    if (btnL) { btnL.className = v === 'list'   ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'; btnL.style.fontSize='0.72rem'; }
    if (v === 'kanban') render();
  };

  const COLORS = { disponibile:'#5ba4f5', in_corso:'#f5a623', completata:'#69cc85', fallita:'#ff6b6b' };

  const render = () => {
    const camp = App.getActiveCampaign();
    const quests = camp?.quests || [];
    ['disponibile','in_corso','completata','fallita'].forEach(status => {
      const col = document.getElementById('kanban-col-' + status);
      if (!col) return;
      const items = quests.filter(q => q.status === status);
      col.innerHTML = items.length ? items.map(q =>
        '<div draggable="true" data-qid="'+q.id+'" '+
        'ondragstart="QuestKanban._dragStart(event,\''+q.id+'\')" '+
        'style="background:var(--bg-card);border:1px solid var(--border);border-left:3px solid '+COLORS[status]+';'+
        'border-radius:var(--radius-md);padding:8px 10px;cursor:grab;font-size:0.82rem;" '+
        'onclick="App.openQuest(\''+q.id+'\')">' +
          '<div style="font-weight:600;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (q.title||'') + '</div>' +
          (q.notes ? '<div style="font-size:0.72rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + q.notes.slice(0,50) + '</div>' : '') +
        '</div>'
      ).join('') :
      '<div style="font-size:0.72rem;color:var(--text-muted);padding:8px;text-align:center;border:1px dashed var(--border);border-radius:var(--radius-md);">—</div>';

      col.ondragover = (e) => { e.preventDefault(); col.style.background = 'rgba(91,164,245,0.08)'; };
      col.ondragleave = () => { col.style.background = ''; };
      col.ondrop = (e) => {
        e.preventDefault();
        col.style.background = '';
        const qid = e.dataTransfer.getData('qid');
        _drop(qid, status);
      };
    });
  };

  const _dragStart = (e, id) => e.dataTransfer.setData('qid', id);

  const _drop = (qid, newStatus) => {
    const camp = App.getActiveCampaign();
    if (!camp) return;
    const quests = (camp.quests||[]).map(q => q.id === qid ? { ...q, status: newStatus } : q);
    App.saveActiveCampaign({ quests });
    render();
  };

  return { setView, render, _dragStart };
})();

const WikiTrash = (() => {
  const KEY = 'dm_wiki_trash';

  const _getTrash = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e) { return []; }
  };
  const _saveTrash = (t) => {

    const sorted = t.sort((a,b) => (b.deletedAt||0)-(a.deletedAt||0)).slice(0,50);
    localStorage.setItem(KEY, JSON.stringify(sorted));
  };

  const addToTrash = (nota, sec) => {
    const trash = _getTrash();
    trash.push({ ...nota, deletedAt: Date.now(), _sec: sec });
    _saveTrash(trash);
  };

  const restore = (id) => {
    const trash = _getTrash();
    const nota = trash.find(n => n.id === id);
    if (!nota) return;
    const { deletedAt, _sec, ...clean } = nota;
    const sec = _sec || 'lore';

    const camp = App.getActiveCampaign();
    const wiki = camp?.wiki || {};
    if (!wiki[sec]) wiki[sec] = [];
    wiki[sec].unshift({ ...clean, titolo: (clean.titolo||'') + ' (ripristinata)' });
    App.saveActiveCampaign({ wiki });

    _saveTrash(trash.filter(n => n.id !== id));
    Toast.show('Nota ripristinata in ' + sec, 'success');
    WikiDM.switchSection(sec);
  };

  const getAll = () => _getTrash();

  const empty = () => {
    if (!confirm('Svuotare definitivamente il cestino? Le note non saranno recuperabili.')) return;
    localStorage.removeItem(KEY);
    Toast.show('Cestino svuotato', 'info');
  };

  return { addToTrash, restore, getAll, empty };
})();

const ExportMarkdown = (() => {
  const _htmlToMd = (html) => {
    if (!html) return '';
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<u[^>]*>(.*?)<\/u>/gi, '$1')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<ul[^>]*>|<\/ul>/gi, '')
      .replace(/<ol[^>]*>|<\/ol>/gi, '')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<hr\s*\/?>/gi, '\n---\n')
      .replace(/<span class="nc-wikilink"[^>]*data-link="([^"]+)"[^>]*>\[\[([^\]]+)\]\]<\/span>/gi, '[[$2]]')
      .replace(/<span class="nc-tag"[^>]*>#([^<]+)<\/span>/gi, '#$1')
      .replace(/<div class="wiki-callout[^"]*"[^>]*>.*?<span class="wiki-callout-label"[^>]*>([^<]+)<\/span>([\s\S]*?)<\/div>/gi,
        (_, label, content) => '\n> **' + label + '**\n' + content.replace(/<[^>]+>/g,'').trim().split('\n').map(l => '> ' + l).join('\n') + '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const exportNote = (nota) => {
    if (!nota) return;
    const md = '# ' + (nota.titolo||'Senza titolo') + '\n\n' +
      (nota.tags?.length ? nota.tags.map(t=>'#'+t).join(' ') + '\n\n' : '') +
      _htmlToMd(nota.contenuto||'');
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (nota.titolo||'nota').replace(/[^a-zA-Z0-9\s]/g,'').trim().replace(/\s+/g,'-') + '.md';
    a.click();
    Toast.show('Nota esportata come Markdown', 'success', 1500);
  };

  const exportAll = () => {
    const camp = App.getActiveCampaign();
    const wiki = camp?.wiki || {};
    const lines = [];
    ['lore','sessioni'].forEach(sec => {
      (wiki[sec]||[]).forEach(n => {
        lines.push('# ' + (n.titolo||'Senza titolo'));
        if (n.tags?.length) lines.push(n.tags.map(t=>'#'+t).join(' '));
        lines.push('');
        lines.push(_htmlToMd(n.contenuto||''));
        lines.push('\n---\n');
      });
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (camp?.name||'campagna').replace(/[^a-zA-Z0-9]/g,'-') + '-wiki.md';
    a.click();
    Toast.show('Wiki esportata come Markdown (compatibile Obsidian)', 'success', 2000);
  };

  return { exportNote, exportAll };
})();

const Settings = (() => {

  const _getSettings = () => {
    try { return JSON.parse(localStorage.getItem('dm_settings') || '{}'); } catch(e) { return {}; }
  };
  const _save = (s) => localStorage.setItem('dm_settings', JSON.stringify(s));

  const DENSITY_PRESETS = {
    compact:  { xs:'2px',  sm:'6px',  md:'12px', lg:'18px', xl:'24px', '2xl':'36px', '3xl':'48px', maxW:'1200px', sidebar:'220px' },
    normal:   { xs:'4px',  sm:'8px',  md:'16px', lg:'24px', xl:'32px', '2xl':'48px', '3xl':'64px', maxW:'1600px', sidebar:'240px' },
    spacious: { xs:'6px',  sm:'12px', md:'20px', lg:'32px', xl:'44px', '2xl':'60px', '3xl':'80px', maxW:'1800px', sidebar:'260px' },
    wide:     { xs:'4px',  sm:'8px',  md:'16px', lg:'24px', xl:'32px', '2xl':'48px', '3xl':'64px', maxW:'100%',   sidebar:'240px' },
  };
  const DENSITY_LABELS = { compact:'Compatto', normal:'Normale', spacious:'Spazioso', wide:'Wide' };

  const setDensity = (key) => {
    const preset = DENSITY_PRESETS[key] || DENSITY_PRESETS.normal;
    const root = document.documentElement;
    root.style.setProperty('--space-xs',  preset.xs);
    root.style.setProperty('--space-sm',  preset.sm);
    root.style.setProperty('--space-md',  preset.md);
    root.style.setProperty('--space-lg',  preset.lg);
    root.style.setProperty('--space-xl',  preset.xl);
    root.style.setProperty('--space-2xl', preset['2xl']);
    root.style.setProperty('--space-3xl', preset['3xl']);
    root.style.setProperty('--sidebar-width', preset.sidebar);

    document.querySelectorAll('.page').forEach(el => {
      el.style.maxWidth = preset.maxW;
    });
    const s = _getSettings();
    s.density = key;
    _save(s);

    document.querySelectorAll('.settings-density-btn').forEach(btn => {
      btn.className = btn.dataset.density === key ? 'btn btn-primary btn-sm settings-density-btn' : 'btn btn-ghost btn-sm settings-density-btn';
    });
    const lbl = document.getElementById('ui-density-label');
    if (lbl) lbl.textContent = DENSITY_LABELS[key] || key;
  };

  const setFontSize = (pct) => {
    document.documentElement.style.fontSize = pct + '%';
    const s = _getSettings();
    s.fontSize = pct;
    _save(s);

    document.querySelectorAll('.settings-font-btn').forEach(btn => {
      const size = parseInt(btn.dataset.size);
      btn.className = size === pct ? 'btn btn-primary btn-sm settings-font-btn' : 'btn btn-ghost btn-sm settings-font-btn';
    });
    const lbl = document.getElementById('font-size-label');
    if (lbl) lbl.textContent = pct + '%';
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dm_theme', theme);
    const btnD = document.getElementById('theme-btn-dark');
    const btnL = document.getElementById('theme-btn-light');
    if (btnD) btnD.className = theme === 'dark'  ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
    if (btnL) btnL.className = theme === 'light' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';

    try { App.applyTheme(theme); } catch(e) {}
  };

  const updateAuthInfo = () => {
    const el = document.getElementById('settings-auth-info');
    if (!el) return;
    try {
      const user = firebase?.auth?.()?.currentUser;
      if (user) {
        if (user.isAnonymous) {
          el.innerHTML = '<div style="font-size:0.85rem;"><strong>Anonimo</strong> — dati sul cloud senza account</div>';
        } else {
          el.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">' +
            (user.photoURL ? '<img src="'+user.photoURL+'" style="width:28px;height:28px;border-radius:50%;">' : '') +
            '<div><div style="font-size:0.85rem;font-weight:600;">'+(user.displayName||user.email||'')+'</div>' +
            '<div style="font-size:0.72rem;color:var(--text-muted);">'+(user.email||'')+'</div></div></div>';
        }
      } else {
        el.innerHTML = '<div style="font-size:0.85rem;color:var(--text-muted);">Non connesso — solo locale</div>';
      }
    } catch(e) {
      el.innerHTML = '<div style="font-size:0.85rem;color:var(--text-muted);">Solo locale</div>';
    }
  };

  const open = () => {
    const s = _getSettings();

    const currentSize = s.fontSize || 100;
    document.querySelectorAll('.settings-font-btn').forEach(btn => {
      const size = parseInt(btn.dataset.size);
      btn.className = size === currentSize ? 'btn btn-primary btn-sm settings-font-btn' : 'btn btn-ghost btn-sm settings-font-btn';
    });
    const lbl = document.getElementById('font-size-label');
    if (lbl) lbl.textContent = currentSize + '%';

    const theme = localStorage.getItem('dm_theme') || 'dark';
    const btnD = document.getElementById('theme-btn-dark');
    const btnL = document.getElementById('theme-btn-light');
    if (btnD) btnD.className = theme === 'dark'  ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
    if (btnL) btnL.className = theme === 'light' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';

    updateAuthInfo();

    _initBgUI();

    const currentDensity = _getSettings().density || 'normal';
    document.querySelectorAll('.settings-density-btn').forEach(btn => {
      btn.className = btn.dataset.density === currentDensity ? 'btn btn-primary btn-sm settings-density-btn' : 'btn btn-ghost btn-sm settings-density-btn';
    });
    const densLbl = document.getElementById('ui-density-label');
    if (densLbl) densLbl.textContent = DENSITY_LABELS[currentDensity] || 'Normale';

    const _s2 = _getSettings();
    const _cd = _s2.density||'normal';
    document.querySelectorAll('.settings-density-btn').forEach(b=>{ b.className=b.dataset.density===_cd?'btn btn-primary btn-sm settings-density-btn':'btn btn-ghost btn-sm settings-density-btn'; });
    const _dl = document.getElementById('ui-density-label');
    if(_dl) _dl.textContent = DENSITY_LABELS[_cd]||'Normale';
    Modal.open('settings');
  };

  const init = () => {
    const s = _getSettings();
    if (s.fontSize && s.fontSize !== 100) {
      document.documentElement.style.fontSize = s.fontSize + '%';
    }
    if (s.density && s.density !== 'normal') {
      setDensity(s.density);
    }
    if (s.bgColor && s.bgColor !== 'default') {
      const colors = {'gray-900':'#111111','gray-800':'#1f2937','gray-700':'#374151','slate':'#1e293b','parchment':'#f5f0e8'};
      const c = colors[s.bgColor];
      if (c) { document.documentElement.style.setProperty('--bg-page', c); document.body.style.background = c; }
    }
  };

  const BG_COLORS = {
    'default':  '',
    'gray-900': '#111111',
    'gray-800': '#1f2937',
    'gray-700': '#374151',
    'slate':    '#1e293b',
    'parchment':'#f5f0e8',
  };

  const setBg = (key) => {
    const color = BG_COLORS[key] || '';
    if (color) {
      document.documentElement.style.setProperty('--bg-page', color);
      document.body.style.background = color;
    } else {
      document.documentElement.style.removeProperty('--bg-page');
      document.body.style.background = '';
    }
    const s = _getSettings();
    s.bgColor = key;
    _save(s);

    document.querySelectorAll('.settings-bg-btn').forEach(btn => {
      btn.className = btn.dataset.bg === key ? 'btn btn-primary btn-sm settings-bg-btn' : 'btn btn-ghost btn-sm settings-bg-btn';
    });
  };

  const _initBgUI = () => {
    const s = _getSettings();
    const currentBg = s.bgColor || 'default';
    document.querySelectorAll('.settings-bg-btn').forEach(btn => {
      btn.className = btn.dataset.bg === currentBg ? 'btn btn-primary btn-sm settings-bg-btn' : 'btn btn-ghost btn-sm settings-bg-btn';
    });
  };

  return { setFontSize, setTheme, setBg, setDensity, updateAuthInfo, open, init, _initBgUI };
})();

const WikiSections = (() => {

  const TYPES = {
    png: {
      label: 'PNG', color: '#69cc85',
      fields: [
        { key: 'ruolo',       label: 'Ruolo / Professione',  type: 'short',   hint: 'es. Mercante, Guardia, Mago' },
        { key: 'razza',       label: 'Razza / Specie',       type: 'short',   hint: 'es. Umano, Elfo, Nano' },
        { key: 'stato',       label: 'Stato',                type: 'select',  options: ['Vivo','Morto','Scomparso','Alleato','Nemico','Sconosciuto'] },
        { key: 'allineamento',label: 'Allineamento',         type: 'select',  options: ['','Legale Buono','Neutrale Buono','Caotico Buono','Legale Neutrale','Neutrale','Caotico Neutrale','Legale Malvagio','Neutrale Malvagio','Caotico Malvagio'] },
        { key: 'sede',        label: 'Luogo / Sede',         type: 'mention', hint: '@NomeLuogo' },
        { key: 'fazione',     label: 'Fazione / Gruppo',     type: 'mention', hint: '@NomeFazione' },
        { key: 'apparenza',   label: 'Aspetto fisico',       type: 'long',    hint: 'Come appare questo personaggio?' },
        { key: 'personalita',  label: 'Personalita e tratti',  type: 'long',    hint: 'Tic, abitudini, voce...' },
        { key: 'vuole',       label: 'Vuole / Obiettivo',    type: 'long',    hint: 'Cosa desidera questo personaggio?' },
        { key: 'teme',        label: 'Teme / Debolezza',     type: 'long',    hint: 'Cosa lo spaventa o lo limita?' },
        { key: 'relazioni',   label: 'Relazioni',            type: 'mentions',hint: '@PNG amico, @Fazione rivale...' },
        { key: 'gancio',      label: 'Gancio per il party',  type: 'long',    hint: 'Come potrebbe coinvolgere i giocatori?' },
        { key: 'segreto',     label: 'Segreto DM',           type: 'secret',  hint: 'Informazioni riservate al DM' },
      ],
      getData: (camp) => (camp?.npcs || []).map(n => ({
        id: n.id, nome: n.name || n.nome || '',
        immagine: n.immagine || '',
        ruolo: n.job || n.ruolo || '', razza: n.race || n.razza || '',
        stato: n.stato || 'Vivo', allineamento: n.alignment || n.allineamento || '',
        sede: n.location || n.sede || '', fazione: n.fazione || '',
        apparenza: n.apparenza || n.description || '',
        personalita: n.personality || n.personalita || '',
        vuole: n.wants || n.vuole || '', teme: n.fears || n.teme || '',
        relazioni: n.relazioni || n.links || '',
        gancio: n.gancio || '',
        segreto: n.secret || n.segreto || '',
        note: n.noteLibere || '', tags: n.tags || [],
        campi_custom: n.campi_custom || [], _source: 'mondo',
      })),
      saveItem: (camp, item) => {
        const npcs = camp.npcs || [];
        const idx = npcs.findIndex(n => n.id === item.id);
        const d = { ...(idx>=0?npcs[idx]:{}), id:item.id, name:item.nome, nome:item.nome,
          immagine:item.immagine||'', job:item.ruolo, ruolo:item.ruolo, race:item.razza, razza:item.razza,
          stato:item.stato, alignment:item.allineamento, allineamento:item.allineamento,
          location:item.sede, sede:item.sede, fazione:item.fazione,
          apparenza:item.apparenza, description:item.apparenza,
          personality:item.personalita, personalita:item.personalita,
          wants:item.vuole, vuole:item.vuole, fears:item.teme, teme:item.teme,
          relazioni:item.relazioni, links:item.relazioni,
          gancio:item.gancio, secret:item.segreto, segreto:item.segreto,
          noteLibere:item.note, tags:item.tags||[],
          campi_custom:item.campi_custom||[], aggiornatoAt:Date.now() };
        if (idx>=0) npcs[idx]=d; else npcs.push(d);
        App.saveActiveCampaign({ npcs });
        try { _mondoToWiki('npc', d, camp); } catch(e) {}
      },
      newItem: () => ({ id:'npc_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
        nome:'', ruolo:'', razza:'', stato:'Vivo', allineamento:'', sede:'', fazione:'',
        apparenza:'', personalita:'', vuole:'', teme:'', relazioni:'', gancio:'', segreto:'', note:'', tags:[] }),
    },

    luoghi: {
      label: 'Luoghi', color: '#f5a623',
      fields: [
        { key: 'tipo',        label: 'Tipo di luogo',        type: 'select',  options: ['Città','Villaggio','Dungeon','Taverna','Castello','Tempio','Foresta','Regione','Paese','Porto','Torre','Altro'] },
        { key: 'regione',     label: 'Regione / Zona',       type: 'mention', hint: '@LuogoPadre' },
        { key: 'clima',       label: 'Clima / Ambiente',     type: 'short',   hint: 'es. Freddo e umido, desertico...' },
        { key: 'atmosfera',   label: 'Descrizione',          type: 'long',    hint: 'Cosa si vede, sente, percepisce entrando?' },
        { key: 'abitanti',    label: 'PNG Notabili',         type: 'mentions',hint: '@PNG che abitano o frequentano questo luogo' },
        { key: 'punti',       label: 'Punti di interesse',   type: 'mentions',hint: '@Luogo, Stanza, Negozio...' },
        { key: 'storia',      label: 'Storia / Lore',        type: 'long',    hint: 'Cosa e successo qui?' },
        { key: 'pericoli',    label: 'Pericoli / Trappole',  type: 'long',    hint: 'Mostri, trappole, fazioni ostili...' },
        { key: 'segreto',     label: 'Segreto DM',           type: 'secret',  hint: 'Informazioni riservate al DM' },
      ],
      getData: (camp) => (camp?.locations || []).map(l => ({
        id:l.id, nome:l.nome||l.name||'', immagine:l.immagine||'',
        tipo:l.tipo||'', regione:l.regione||'', clima:l.clima||'',
        atmosfera:l.atmosfera||l.description||'', abitanti:l.npcs||l.abitanti||'',
        punti:l.punti||'', storia:l.storia||'', pericoli:l.pericoli||'',
        segreto:l.secret||l.segreto||'', note:l.noteLibere||'', tags:l.tags||[],
        campi_custom:l.campi_custom||[], _source:'mondo',
      })),
      saveItem: (camp, item) => {
        const locs = camp.locations || [];
        const idx = locs.findIndex(l => l.id === item.id);
        const d = { ...(idx>=0?locs[idx]:{}), id:item.id, nome:item.nome, name:item.nome,
          immagine:item.immagine, tipo:item.tipo, regione:item.regione, clima:item.clima,
          atmosfera:item.atmosfera, description:item.atmosfera,
          npcs:item.abitanti, abitanti:item.abitanti,
          punti:item.punti, storia:item.storia, pericoli:item.pericoli,
          secret:item.segreto, segreto:item.segreto, noteLibere:item.note,
          tags:item.tags, aggiornatoAt:Date.now() };
        if (idx>=0) locs[idx]=d; else locs.push(d);
        App.saveActiveCampaign({ locations: locs });
        try { _mondoToWiki('location', d, camp); } catch(e) {}
      },
      newItem: () => ({ id:'loc_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
        nome:'', tipo:'Città', regione:'', clima:'', atmosfera:'', abitanti:'',
        punti:'', storia:'', pericoli:'', segreto:'', note:'', tags:[] }),
    },

    fazioni: {
      label: 'Fazioni', color: '#c97bea',
      fields: [
        { key: 'tipo',        label: 'Tipo',                 type: 'select',  options: ['Gilda','Ordine','Governo','Criminale','Militare','Mercantile','Religiosa','Arcana','Altro'] },
        { key: 'attitudine',  label: 'Attitudine verso party',type: 'select', options: ['Alleata','Amichevole','Neutrale','Sospettosa','Ostile','Sconosciuta'] },
        { key: 'simbolo', label: 'Simbolo / Motto', type: 'short', hint: 'es. Un drago rampante' },
        { key: 'leader',      label: 'Leader',               type: 'mention', hint: '@NomePNG' },
        { key: 'sede',        label: 'Sede / Base',          type: 'mention', hint: '@NomeLuogo' },
        { key: 'obiettivo',   label: 'Obiettivo pubblico',   type: 'long',    hint: 'Cosa dicono di voler fare?' },
        { key: 'vero_obiettivo', label: 'Vero obiettivo',   type: 'long',    hint: 'Cosa vogliono davvero?' },
        { key: 'risorse',     label: 'Risorse / Influenza',  type: 'long',    hint: 'Soldi, truppe, magia, contatti...' },
        { key: 'nemici',      label: 'Rivali / Nemici',      type: 'mentions',hint: '@Fazione rivale, @PNG nemico...' },
        { key: 'segreto',     label: 'Segreto DM',           type: 'secret',  hint: 'Informazioni riservate al DM' },
      ],
      getData: (camp) => (camp?.factions || []).map(f => ({
        id:f.id, nome:f.nome||f.name||'', immagine:f.immagine||'',
        tipo:f.tipo||'', attitudine:f.attitudine||'Neutrale', simbolo:f.simbolo||'',
        leader:f.leader||'', sede:f.sede||'',
        obiettivo:f.obiettivo||f.description||'', vero_obiettivo:f.vero_obiettivo||'',
        risorse:f.risorse||'', nemici:f.nemici||'',
        segreto:f.secret||f.segreto||'', note:f.noteLibere||'', tags:f.tags||[],
        campi_custom:f.campi_custom||[], _source:'mondo',
      })),
      saveItem: (camp, item) => {
        const facs = camp.factions || [];
        const idx = facs.findIndex(f => f.id === item.id);
        const d = { ...(idx>=0?facs[idx]:{}), id:item.id, nome:item.nome, name:item.nome,
          immagine:item.immagine, tipo:item.tipo, attitudine:item.attitudine, simbolo:item.simbolo,
          leader:item.leader, sede:item.sede, obiettivo:item.obiettivo, description:item.obiettivo,
          vero_obiettivo:item.vero_obiettivo, risorse:item.risorse, nemici:item.nemici,
          secret:item.segreto, segreto:item.segreto, noteLibere:item.note,
          tags:item.tags, aggiornatoAt:Date.now() };
        if (idx>=0) facs[idx]=d; else facs.push(d);
        App.saveActiveCampaign({ factions: facs });
        try { _mondoToWiki('faction', d, camp); } catch(e) {}
      },
      newItem: () => ({ id:'fac_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
        nome:'', tipo:'Gilda', attitudine:'Neutrale', simbolo:'', leader:'', sede:'',
        obiettivo:'', vero_obiettivo:'', risorse:'', nemici:'', segreto:'', note:'', tags:[] }),
    },

    lore: {
      label: 'Lore', color: '#5ba4f5',
      fields: [
        { key: 'categoria',  label: 'Categoria',             type: 'select',  options: ['Generale','Storia','Religione','Magia','Politica','Leggenda','Oggetto Magico','Profezia','Segreto DM','Altro'] },
        { key: 'periodo',   label: 'Periodo / Era',          type: 'short',   hint: 'es. 500 anni fa' },
        { key: 'collegati', label: 'Entita collegate',      type: 'mentions',hint: '@PNG, @Luogo, @Fazione' },
        { key: 'rilevanza',  label: 'Rilevanza per il party',type: 'select',  options: ['Alta','Media','Bassa','Segreto DM'] },
        { key: 'fonti',      label: 'Fonti / Chi sa?',       type: 'long',    hint: 'Chi conosce questa informazione?' },
      ],
      getData: (camp) => {
        const wiki = camp?.wiki || {};
        return (wiki.lore || []).map(n => ({
          id:n.id, nome:n.titolo||'',
          categoria:n.categoria||'Generale', periodo:n.periodo||'',
          collegati:n.collegati||'', rilevanza:n.rilevanza||'Media', fonti:n.fonti||'',
          contenuto:n.contenuto||'', note:'', tags:n.tags||[], _source:'wiki',
        }));
      },
      saveItem: (camp, item) => {
        const wiki = camp?.wiki || { lore:[], sessioni:[] };
        if (!wiki.lore) wiki.lore = [];
        const idx = wiki.lore.findIndex(n => n.id === item.id);
        const d = { id:item.id, titolo:item.nome, categoria:item.categoria, periodo:item.periodo,
          collegati:item.collegati, rilevanza:item.rilevanza, fonti:item.fonti,
          contenuto:item.contenuto||'', tags:item.tags||[], aggiornatoAt:Date.now() };
        if (idx>=0) wiki.lore[idx]=d; else wiki.lore.unshift(d);
        App.saveActiveCampaign({ wiki });
      },
      newItem: () => ({ id:'n'+Date.now()+Math.random().toString(36).slice(2,5),
        nome:'', categoria:'Generale', periodo:'', collegati:'', rilevanza:'Media', fonti:'', contenuto:'', tags:[] }),
    },

    pg: {
      label: 'PG', color: '#56d4dd',
      fields: [
        { key: 'classe',      label: 'Classe / Sottoclasse',  type: 'short',   hint: 'es. Guerriero / Campione' },
        { key: 'razza',       label: 'Razza / Specie',        type: 'short',   hint: 'es. Umano, Elfo, Nano' },
        { key: 'livello',     label: 'Livello',               type: 'short',   hint: 'es. 5' },
        { key: 'giocatore',   label: 'Nome giocatore',        type: 'short',   hint: 'Chi gioca questo PG?' },
        { key: 'hp_max',      label: 'HP massimi',            type: 'short',   hint: 'es. 45' },
        { key: 'ca',          label: 'Classe Armatura',       type: 'short',   hint: 'es. 16' },
        { key: 'iniziativa',  label: 'Bonus iniziativa',      type: 'short',   hint: 'es. +3' },
        { key: 'perc_pass',   label: 'Percezione passiva',    type: 'short',   hint: 'es. 14' },
        { key: 'velocita',    label: 'Velocita',              type: 'short',   hint: 'es. 9m' },
        { key: 'background',  label: 'Background',            type: 'short',   hint: 'es. Soldato, Nobile' },
        { key: 'motivazione', label: 'Motivazione / Goal',    type: 'long',    hint: 'Cosa vuole questo PG?' },
        { key: 'legami',      label: 'Legami con altri PG',   type: 'mentions', hint: '@AltroPG' },
        { key: 'note_dm',     label: 'Note DM',               type: 'secret',  hint: 'Info riservate al DM' },
      ],
      getData: (camp) => (camp?.pg || []).map(p => ({
        id:p.id, nome:p.nome||p.name||'', immagine:p.immagine||'',
        classe:p.classe||'', razza:p.razza||'', livello:p.livello||'',
        giocatore:p.giocatore||'', hp_max:p.hp_max||'', ca:p.ca||'',
        iniziativa:p.iniziativa||'', perc_pass:p.perc_pass||'',
        velocita:p.velocita||'', background:p.background||'',
        motivazione:p.motivazione||'', legami:p.legami||'',
        note_dm:p.note_dm||'', note:p.noteLibere||'',
        tags:p.tags||[], campi_custom:p.campi_custom||[], _source:'pg',
      })),
      saveItem: (camp, item) => {
        if (!camp.pg) camp.pg = [];
        const idx = camp.pg.findIndex(p => p.id === item.id);
        const d = { ...(idx>=0?camp.pg[idx]:{}), id:item.id, nome:item.nome, name:item.nome,
          immagine:item.immagine||'', classe:item.classe, razza:item.razza,
          livello:item.livello, giocatore:item.giocatore, hp_max:item.hp_max,
          ca:item.ca, iniziativa:item.iniziativa, perc_pass:item.perc_pass,
          velocita:item.velocita, background:item.background,
          motivazione:item.motivazione, legami:item.legami, note_dm:item.note_dm,
          noteLibere:item.note, tags:item.tags||[],
          campi_custom:item.campi_custom||[], aggiornatoAt:Date.now() };
        if (idx>=0) camp.pg[idx]=d; else camp.pg.push(d);
        App.saveActiveCampaign({ pg: camp.pg });
      },
      newItem: () => ({ id:'pg_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
        nome:'', classe:'', razza:'', livello:'', giocatore:'',
        hp_max:'', ca:'', iniziativa:'', perc_pass:'', velocita:'',
        background:'', motivazione:'', legami:'', note_dm:'',
        note:'', tags:[], campi_custom:[] }),
    },

    incontri: {
      label: 'Incontri', color: '#ff6b6b',
      fields: [
        { key: 'tipo',       label: 'Tipo',                type: 'select', options: ['Combattimento','Esplorazione','Sociale','Trappola','Misto','Altro'] },
        { key: 'difficolta', label: 'Difficolta',          type: 'select', options: ['Facile','Medio','Difficile','Mortale','Boss'] },
        { key: 'stato',      label: 'Stato',               type: 'select', options: ['Bozza','Pronto','Usato'] },
        { key: 'ambientazione', label: 'Ambientazione',   type: 'mention', hint: '@Luogo' },
        { key: 'sessione',   label: 'Sessione prevista',  type: 'mention', hint: '@Sessione' },
        { key: 'nemici',     label: 'Nemici / Mostri',    type: 'long',   hint: 'es. 3x Goblin CR1/4, 1x Bugbear CR1' },
        { key: 'xp_totale',  label: 'XP totali',          type: 'short',  hint: 'es. 450 XP' },
        { key: 'loot',       label: 'Loot possibile',     type: 'long',   hint: 'Oggetti, monete, ricompense...' },
        { key: 'tattiche',   label: 'Tattiche nemici',    type: 'long',   hint: 'Come si comportano i nemici?' },
        { key: 'condizioni', label: 'Condizioni speciali',type: 'long',   hint: 'Terreno, effetti, varianti...' },
        { key: 'note_dm',    label: 'Note DM',             type: 'secret', hint: 'Twist, info riservate' },
      ],
      getData: (camp) => (camp?.incontri || []).map(e => ({
        id:e.id, nome:e.nome||e.name||'',
        tipo:e.tipo||'Combattimento', difficolta:e.difficolta||'Medio',
        stato:e.stato||'Bozza', ambientazione:e.ambientazione||'',
        sessione:e.sessione||'', nemici:e.nemici||'',
        xp_totale:e.xp_totale||'', loot:e.loot||'',
        tattiche:e.tattiche||'', condizioni:e.condizioni||'',
        note_dm:e.note_dm||'', note:e.noteLibere||'',
        tags:e.tags||[], campi_custom:e.campi_custom||[], _source:'incontri',
      })),
      saveItem: (camp, item) => {
        if (!camp.incontri) camp.incontri = [];
        const idx = camp.incontri.findIndex(e => e.id === item.id);
        const d = { ...(idx>=0?camp.incontri[idx]:{}), id:item.id, nome:item.nome, name:item.nome,
          tipo:item.tipo, difficolta:item.difficolta, stato:item.stato,
          ambientazione:item.ambientazione, sessione:item.sessione,
          nemici:item.nemici, xp_totale:item.xp_totale, loot:item.loot,
          tattiche:item.tattiche, condizioni:item.condizioni,
          note_dm:item.note_dm, noteLibere:item.note,
          tags:item.tags||[], campi_custom:item.campi_custom||[], aggiornatoAt:Date.now() };
        if (idx>=0) camp.incontri[idx]=d; else camp.incontri.push(d);
        App.saveActiveCampaign({ incontri: camp.incontri });
      },
      newItem: () => ({ id:'enc_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
        nome:'', tipo:'Combattimento', difficolta:'Medio', stato:'Bozza',
        ambientazione:'', sessione:'', nemici:'', xp_totale:'', loot:'',
        tattiche:'', condizioni:'', note_dm:'', note:'', tags:[], campi_custom:[] }),
    },

    quest: {
      label: 'Quest', color: '#e84393',
      fields: [
        { key: 'tipo',        label: 'Tipo',                    type: 'select',  options: ['Principale','Secondaria','Personale','Side quest','Altro'] },
        { key: 'stato',       label: 'Stato',                   type: 'select',  options: ['Attiva','In sospeso','Completata','Fallita','Nascosta'] },
        { key: 'priorita',    label: 'Priorita',                type: 'select',  options: ['Alta','Media','Bassa'] },
        { key: 'committente', label: 'Committente',             type: 'mention', hint: '@PNG che ha dato la quest' },
        { key: 'png',         label: 'PNG coinvolti',           type: 'mentions', hint: '@PNG importanti' },
        { key: 'luoghi',      label: 'Luoghi',                  type: 'mentions', hint: '@Luogo dove si svolge' },
        { key: 'fazioni',     label: 'Fazioni coinvolte',       type: 'mentions', hint: '@Fazione' },
        { key: 'obiettivo',   label: 'Obiettivo',               type: 'long',    hint: 'Cosa deve fare il party?' },
        { key: 'ricompensa',  label: 'Ricompensa',              type: 'short',   hint: 'es. 500 MO, Spada +1' },
        { key: 'ostacoli',    label: 'Ostacoli / Complicazioni',type: 'long',    hint: 'Cosa rende difficile questa quest?' },
        { key: 'sviluppi',    label: 'Sviluppi possibili',      type: 'long',    hint: 'Come potrebbe evolversi?' },
        { key: 'segreto',     label: 'Segreto DM',              type: 'secret',  hint: 'Twist nascosti, info riservate' },
      ],
      getData: (camp) => (camp?.quests || []).map(q => ({
        id: q.id, nome: q.titolo || q.name || '',
        tipo: q.tipo || 'Secondaria', stato: q.stato || 'Attiva', priorita: q.priorita || 'Media',
        committente: q.committente || '', png: q.npcs || q.png || '',
        luoghi: q.luoghi || '', fazioni: q.fazioni || '',
        obiettivo: q.obiettivo || q.description || '',
        ricompensa: q.ricompensa || '', ostacoli: q.ostacoli || '',
        sviluppi: q.sviluppi || '', segreto: q.segreto || q.secret || '',
        note: q.noteLibere || '', tags: q.tags || [], _source: 'quests',
      })),
      saveItem: (camp, item) => {
        if (!camp.quests) camp.quests = [];
        const idx = camp.quests.findIndex(q => q.id === item.id);
        const d = { ...(idx>=0 ? camp.quests[idx] : {}),
          id: item.id, titolo: item.nome, name: item.nome,
          tipo: item.tipo, stato: item.stato, priorita: item.priorita,
          committente: item.committente, npcs: item.png, png: item.png,
          luoghi: item.luoghi, fazioni: item.fazioni,
          obiettivo: item.obiettivo, description: item.obiettivo,
          ricompensa: item.ricompensa, ostacoli: item.ostacoli,
          sviluppi: item.sviluppi, segreto: item.segreto, secret: item.segreto,
          noteLibere: item.note, tags: item.tags || [], aggiornatoAt: Date.now(),
        };
        if (idx>=0) camp.quests[idx]=d; else camp.quests.push(d);
        App.saveActiveCampaign({ quests: camp.quests });
      },
      newItem: () => ({
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
        nome: '', tipo: 'Secondaria', stato: 'Attiva', priorita: 'Media',
        committente: '', png: '', luoghi: '', fazioni: '', obiettivo: '',
        ricompensa: '', ostacoli: '', sviluppi: '', segreto: '', note: '', tags: [],
      }),
    },

    sessioni: {
      label: 'Sessioni', color: '#ff9f43',
      fields: [

        { key: 'numero',        label: 'Numero',             type: 'short' },
        { key: 'data',          label: 'Data',               type: 'short' },
        { key: 'titolo',        label: 'Titolo sessione',    type: 'short',   hint: 'es. La caduta di Velmoor' },
        { key: 'stato',         label: 'Stato',              type: 'select',  options: ['Pianificata','In corso','Giocata'] },

        { key: '_sep_prep',     label: '— Preparazione —',   type: 'separator' },
        { key: 'meteo',         label: 'Meteo / Atmosfera',  type: 'short',   hint: 'es. Notte di tempesta, alba nebbiosa' },
        { key: 'png_previsti',  label: 'PNG previsti',       type: 'mentions', hint: '@PNG che potrebbero apparire' },
        { key: 'luoghi_previsti',label: 'Luoghi previsti',   type: 'mentions', hint: '@Luoghi dove si svolgerà' },
        { key: 'fazioni',       label: 'Fazioni coinvolte',  type: 'mentions', hint: '@Fazione che ha un ruolo' },
        { key: 'obiettivi',     label: 'Obiettivi DM',       type: 'long',    hint: 'Cosa vuoi che succeda? Rivelazioni, hook...' },
        { key: 'beat_prep',     label: 'Scene / Beat pianificati', type: 'long', hint: 'Sequenza di scene previste' },
        { key: 'ganci_entrata', label: 'Ganci in entrata',   type: 'long',    hint: 'Fili aperti dalla sessione precedente' },
        { key: 'segreto',       label: 'Note DM private',    type: 'secret',  hint: 'Twist, segreti, info riservate' },

        { key: '_sep_post',     label: '— Post Sessione —',  type: 'separator' },
        { key: 'png',           label: 'PNG apparsi',        type: 'mentions', hint: '@PNG effettivamente apparsi' },
        { key: 'png_nuovi',     label: 'PNG introdotti (1a volta)', type: 'mentions', hint: '@PNG visti per la prima volta' },
        { key: 'luoghi_vis',    label: 'Luoghi visitati',    type: 'mentions', hint: '@Luoghi effettivamente visitati' },
        { key: 'successo',      label: 'Come è andata',      type: 'long',    hint: 'Cosa ha fatto davvero il party?' },
        { key: 'decisioni',     label: 'Decisioni chiave',   type: 'long',    hint: 'Scelte importanti dei giocatori' },
        { key: 'lore_rivelata', label: 'Lore rivelata',      type: 'long',    hint: 'Segreti svelati, storia raccontata' },
        { key: 'recap',         label: 'Recap per i giocatori', type: 'long', hint: 'Riassunto da leggere/mandare ai giocatori' },
        { key: 'ganci',         label: 'Ganci prossima sessione', type: 'long', hint: 'Fili aperti, cliffhanger' },
        { key: 'xp',            label: 'XP / Ricompense',   type: 'short',   hint: 'es. 300 XP, Spada +1' },
      ],
      getData: (camp) => {
        const wiki = camp?.wiki || {};
        const sessLog = camp?.sessioni_log || [];
        const fromLog = sessLog.map(s => ({
          id: s.id, nome: 'Sessione ' + s.numero + (s.titolo ? ' — ' + s.titolo : ''),
          numero: String(s.numero||''), data: s.data||'', titolo: s.titolo||'',
          stato: s.stato==='in_corso' ? 'In corso' : s.stato==='giocata' ? 'Giocata' : 'Pianificata',
          meteo: s.meteo||'',

          png_previsti: s.png_previsti||'',
          luoghi_previsti: s.luoghi_previsti||'',
          fazioni: Array.isArray(s.fazioni) ? s.fazioni.join(', ') : (s.fazioni||''),
          obiettivi: s.notePrep||s.obiettivi||'',
          beat_prep: s.beat_prep||(s.beats||[]).map(b=>b.titolo||b.tipo||'').filter(Boolean).join(', ')||'',
          ganci_entrata: s.ganci_entrata||'',
          segreto: s.segreto||'',

          png: (s.npcs||[]).map(id => {
            const n = (camp?.npcs||[]).find(x => x.id===id);
            return n ? (n.name||n.nome||id) : id;
          }).join(', '),
          png_nuovi: s.png_nuovi||'',
          luoghi_vis: s.luoghi_visitati||s.luoghi_vis||'',
          successo: s.successo||'',
          decisioni: s.decisioni||'', lore_rivelata: s.lore_rivelata||'',
          recap: s.recap||'', ganci: s.ganci||'',
          xp: s.xp||'',
          contenuto: '', tags:['sessione'], _source:'sessioni_log', _origId:s.id,
        }));
        const fromWiki = (wiki.sessioni||[])
          .filter(n => !fromLog.find(s => s._origId===n.sessioneId))
          .map(n => ({
            id:n.id, nome:n.titolo||'',
            numero:'', data:'', stato:'Giocata',
            png:'', luoghi_vis:'', obiettivi:'', successo:'', recap:'', ganci:'', xp:'', segreto:'',
            contenuto:n.contenuto||'', tags:n.tags||[], _source:'wiki',
          }));
        return [...fromLog, ...fromWiki];
      },
      saveItem: (camp, item) => {
        if (item._source==='sessioni_log') {
          const sessioni = (camp.sessioni_log||[]).map(s =>
            s.id===item._origId ? { ...s,
              titolo: item.titolo || item.nome.replace(/^Sessione \d+\s*[\u2014-]\s*/, '').replace(/^Sessione \d+$/, ''),
              data:item.data||'', meteo:item.meteo||'',
              stato:item.stato==='In corso'?'in_corso':item.stato==='Giocata'?'giocata':'pianificata',

              png_previsti:item.png_previsti||'', luoghi_previsti:item.luoghi_previsti||'',
              fazioni:item.fazioni||'', notePrep:item.obiettivi||'', obiettivi:item.obiettivi||'',
              beat_prep:item.beat_prep||'', ganci_entrata:item.ganci_entrata||'', segreto:item.segreto||'',

              png_nuovi:item.png_nuovi||'', luoghi_visitati:item.luoghi_vis||'',
              successo:item.successo||'', decisioni:item.decisioni||'', lore_rivelata:item.lore_rivelata||'',
              recap:item.recap||'', ganci:item.ganci||'', xp:item.xp||'',
            } : s
          );
          App.saveActiveCampaign({ sessioni_log: sessioni });
        } else {
          const wiki = camp?.wiki || { lore:[], sessioni:[] };
          if (!wiki.sessioni) wiki.sessioni = [];
          const idx = wiki.sessioni.findIndex(n => n.id===item.id);
          const d = { id:item.id, titolo:item.nome, contenuto:item.contenuto||'',
            tags:item.tags||[], aggiornatoAt:Date.now() };
          if (idx>=0) wiki.sessioni[idx]=d; else wiki.sessioni.unshift(d);
          App.saveActiveCampaign({ wiki });
        }
      },
      newItem: () => ({ id:'ws_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
        nome:'', numero:'', data:new Date().toISOString().slice(0,10), titolo:'',
        stato:'Pianificata', meteo:'', png_previsti:'', luoghi_previsti:'', fazioni:'',
        obiettivi:'', beat_prep:'', ganci_entrata:'', segreto:'',
        png:'', png_nuovi:'', luoghi_vis:'', successo:'', decisioni:'', lore_rivelata:'',
        recap:'', ganci:'', xp:'', contenuto:'', tags:['sessione'], _source:'wiki' }),
      newItem: () => ({ id:'ws_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
        nome:'', numero:'', data:new Date().toISOString().slice(0,10), titolo:'',
        stato:'Pianificata', meteo:'', png_previsti:'', luoghi_previsti:'', fazioni:'',
        obiettivi:'', beat_prep:'', ganci_entrata:'', segreto:'',
        png:'', png_nuovi:'', luoghi_vis:'', successo:'', decisioni:'', lore_rivelata:'',
        recap:'', ganci:'', xp:'', contenuto:'', tags:['sessione'], _source:'wiki' }),
    },
  };

  let _currentType = null;
  let _currentItem = null;
  let _autosaveTimer = null;
  let _expanded = false;

  const toggleExpand = () => {
    _expanded = !_expanded;
    const sub = document.getElementById('wiki-subnav');
    const chev = document.getElementById('wiki-nav-chevron');
    if (sub) sub.style.display = _expanded ? 'flex' : 'none';
    if (chev) chev.style.transform = _expanded ? 'rotate(180deg)' : '';
    if (_expanded && !_currentType) goto('png');
  };

  const goto = (type) => {
    _currentType = type;
    _currentItem = null;

    App.navigateTo('wiki-' + type);

    document.querySelectorAll('.nav-subitem').forEach(b => {
      b.classList.toggle('active', b.dataset.wikiSection === type);
    });

    if (!_expanded) {
      _expanded = true;
      const sub = document.getElementById('wiki-subnav');
      const chev = document.getElementById('wiki-nav-chevron');
      if (sub) sub.style.display = 'flex';
      if (chev) chev.style.transform = 'rotate(180deg)';
    }

    renderList(type);
  };

  const renderList = (type) => {
    const cfg = TYPES[type];
    const camp = App.getActiveCampaign();
    const items = cfg.getData(camp);
    const grid = document.getElementById('wiki-' + type + '-grid');
    if (!grid) return;

    const cnt = document.getElementById('wiki-cnt-' + type);
    if (cnt) cnt.textContent = items.length;

    if (!items.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">' +
        '<div style="font-size:2rem;margin-bottom:8px;opacity:0.3;">+</div>' +
        '<div style="margin-bottom:12px;">Nessun ' + cfg.label.toLowerCase() + ' ancora.</div>' +
        '<button class="btn btn-primary" onclick="WikiSections.newCard(\'' + type + '\')">Crea il primo</button>' +
        '</div>';
      return;
    }

    const STATUS_COLORS = {
      Vivo: '#69cc85', Morto: '#ff6b6b', Scomparso: '#aaa',
      Alleato: '#5ba4f5', Nemico: '#ff6b6b',
      Pianificata: '#5ba4f5', 'In corso': '#f5a623', Giocata: '#69cc85',
      Alleata: '#69cc85', Amichevole: '#5ba4f5', Neutrale: '#aaa',
      Sospettosa: '#f5a623', Ostile: '#ff6b6b',
    };

    grid.innerHTML = items.map(item => {
      const statusColor = STATUS_COLORS[item.stato || item.attitudine] || cfg.color;
      const sub = item.ruolo || item.tipo || item.categoria || item.stato || item.numero || '';
      const tags = (item.tags || []).slice(0, 3).map(t =>
        '<span style="font-size:0.62rem;padding:1px 6px;background:' + cfg.color + '22;color:' + cfg.color + ';border-radius:var(--radius-full);">' + t + '</span>'
      ).join('');

      return '<div onclick="WikiSections.openCard(\'' + type + '\',\'' + item.id + '\')" ' +
        'data-search="' + (item.nome + ' ' + sub + ' ' + (item.tags||[]).join(' ')).toLowerCase() + '" ' +
        'style="background:var(--bg-card);border:1px solid var(--border);border-top:3px solid ' + cfg.color + ';' +
        'border-radius:var(--radius-md);padding:12px;cursor:pointer;transition:border-color 0.15s,transform 0.1s;" ' +
        'onmouseenter="this.style.borderColor=\'' + cfg.color + '\';this.style.transform=\'translateY(-1px)\'" ' +
        'onmouseleave="this.style.borderColor=\'var(--border)\';this.style.borderTopColor=\'' + cfg.color + '\';this.style.transform=\'\'">' +
        (item.immagine ? '<img src="' + item.immagine + '" style="width:100%;height:60px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:8px;" onerror="this.style.display=\'none\'">' : '') +
        '<div style="font-family:var(--font-display);font-weight:600;font-size:0.88rem;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
        (item.nome || '<em style="color:var(--text-muted)">Senza nome</em>') + '</div>' +
        (sub ? '<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px;">' + sub + '</div>' : '') +
        (tags ? '<div style="display:flex;flex-wrap:wrap;gap:3px;">' + tags + '</div>' : '') +
        '</div>';
    }).join('');
  };

  const openCard = (type, id) => {
    const cfg = TYPES[type];
    const camp = App.getActiveCampaign();
    const items = cfg.getData(camp);
    const item = items.find(x => x.id === id);
    if (!item) return;
    _currentType = type;
    _currentItem = { ...item };

    const listEl   = document.getElementById('wiki-' + type + '-list');
    const detailEl = document.getElementById('wiki-' + type + '-detail');
    if (listEl) listEl.style.display = 'none';
    if (detailEl) { detailEl.style.display = ''; detailEl.innerHTML = _renderDetail(type, item, 'view'); }

    const editor = document.getElementById('ws-editor-free');
    if (editor) {
      editor.addEventListener('input', () => {
        _currentItem.note = editor.innerHTML;
        _scheduleAutosave(type);
      });

      editor.addEventListener('input', (e) => MentionPicker.onInput(e, editor));
      editor.addEventListener('keydown', (e) => MentionPicker.onKeydown(e));
    }
  };

  const _renderDetail = (type, item, mode = 'view') => {
    const cfg = TYPES[type];
    const STATUS_COLORS = {
      Vivo: '#69cc85', Morto: '#ff6b6b', Scomparso: '#aaa',
      Alleato: '#5ba4f5', Nemico: '#ff6b6b',
      Pianificata: '#5ba4f5', 'In corso': '#f5a623', Giocata: '#69cc85',
      Alleata: '#69cc85', Amichevole: '#5ba4f5', Neutrale: '#aaa',
      Sospettosa: '#f5a623', Ostile: '#ff6b6b',
    };
    const statusColor = STATUS_COLORS[item.stato || item.attitudine] || cfg.color;
    const isEdit = mode === 'edit';

    const _viewField = (f, val) => {
      if (f.type === 'separator') {
        const isPrep = f.label.toLowerCase().includes('prep');
        const isPost = f.label.toLowerCase().includes('post');
        const color = isPrep ? '#f5a623' : isPost ? '#69cc85' : 'var(--accent-secondary)';
        return '<div style="grid-column:1/-1;margin:14px 0 6px;padding:8px 14px;background:' + color + '18;border-left:4px solid ' + color + ';border-radius:0 var(--radius-md) var(--radius-md) 0;">' +
          '<div style="font-size:0.8rem;font-family:var(--font-display);font-weight:700;color:' + color + ';letter-spacing:0.05em;">' + f.label.replace(/^[—–]/,'').replace(/[—–]$/,'').trim() + '</div>' +
          '</div>';
      }
      if (!val && val !== 0) return '';
      const isSecret = f.type === 'secret';
      let content = '';
      if (f.type === 'mention' || f.type === 'mentions') {

        content = String(val).split(',').map(v => v.trim()).filter(Boolean).map(v => {
          const clean = v.replace(/^@/, '');
          return '<span onclick="WikiSections._jumpToEntity(\'' + clean.replace(/'/g,"\\'") + '\')" ' +
            'style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;background:' + cfg.color + '22;' +
            'color:' + cfg.color + ';border:1px solid ' + cfg.color + '44;border-radius:var(--radius-full);' +
            'font-size:0.78rem;cursor:pointer;margin:2px;" ' +
            'onmouseenter="this.style.background=\'' + cfg.color + '44\'" ' +
            'onmouseleave="this.style.background=\'' + cfg.color + '22\'">' +
            '@' + clean + '</span>';
        }).join('');
      } else if (f.type === 'long' || f.type === 'secret') {
        content = '<div style="font-size:0.85rem;line-height:1.7;white-space:pre-wrap;">' + _escHtml(String(val)) + '</div>';
      } else if (f.type === 'select') {
        const sc = STATUS_COLORS[val] || cfg.color;
        content = '<span style="padding:2px 10px;background:' + sc + '22;color:' + sc + ';border:1px solid ' + sc + '44;border-radius:var(--radius-full);font-size:0.78rem;">' + _escHtml(String(val)) + '</span>';
      } else {
        content = '<span style="font-size:0.88rem;">' + _escHtml(String(val)) + '</span>';
      }
      if (!content) return '';
      return '<div style="margin-bottom:14px;">' +
        '<div style="font-size:0.65rem;font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.08em;color:' + (isSecret ? '#ff6b6b' : 'var(--text-muted)') + ';margin-bottom:4px;">' +
        (isSecret ? '🔒 ' : '') + f.label + '</div>' +
        (isSecret ?
          '<div style="background:rgba(255,107,107,0.08);border-left:3px solid #ff6b6b;padding:8px 12px;border-radius:0 var(--radius-md) var(--radius-md) 0;">' + content + '</div>' :
          content) +
        '</div>';
    };

    const _editField = (f) => {
      if (f.type === 'separator') {
        const isPrep = f.label.toLowerCase().includes('prep');
        const isPost = f.label.toLowerCase().includes('post');
        const color = isPrep ? '#f5a623' : isPost ? '#69cc85' : 'var(--accent-secondary)';
        return '<div style="grid-column:1/-1;margin:16px 0 8px;padding:10px 14px;background:' + color + '18;border-left:4px solid ' + color + ';border-radius:0 var(--radius-md) var(--radius-md) 0;">' +
          '<div style="font-size:0.8rem;font-family:var(--font-display);font-weight:700;color:' + color + ';letter-spacing:0.05em;">' + f.label.replace(/^[—–]/,'').replace(/[—–]$/,'').trim() + '</div>' +
          '</div>';
      }
      const val = item[f.key] || '';
      let input = '';
      if (f.type === 'select') {
        input = '<select id="wsf-' + f.key + '" class="form-select" style="font-size:0.82rem;" onchange="WikiSections._fieldChange(\'' + type + '\',\'' + f.key + '\',this.value)">' +
          f.options.map(o => '<option value="' + o + '"' + (val === o ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>';
      } else if (f.type === 'long') {
        input = '<textarea id="wsf-' + f.key + '" class="form-textarea" rows="3" style="font-size:0.82rem;line-height:1.6;" oninput="WikiSections._fieldChange(\'' + type + '\',\'' + f.key + '\',this.value)">' + _escHtml(val) + '</textarea>';
      } else if (f.type === 'secret') {
        input = '<textarea id="wsf-' + f.key + '" rows="2" style="width:100%;background:rgba(255,107,107,0.08);border:1px solid rgba(255,107,107,0.3);border-radius:var(--radius-md);padding:8px;font-size:0.82rem;color:var(--text-primary);resize:vertical;" oninput="WikiSections._fieldChange(\'' + type + '\',\'' + f.key + '\',this.value)">' + _escHtml(val) + '</textarea>';
      } else {
        input = '<input id="wsf-' + f.key + '" type="text" class="form-input" style="font-size:0.82rem;" value="' + _escHtml(val) + '" placeholder="' + (f.type === 'mention' || f.type === 'mentions' ? 'Scrivi @nome...' : '') + '" oninput="WikiSections._fieldChange(\'' + type + '\',\'' + f.key + '\',this.value)">';
      }
      const isSecret = f.type === 'secret';
      return '<div class="form-group" style="margin-bottom:12px;">' +
        '<label class="form-label" style="font-size:0.68rem;' + (isSecret ? 'color:#ff6b6b;' : '') + '">' +
        (isSecret ? '🔒 ' : '') + f.label +
        (f.hint ? '<span style="font-weight:400;color:var(--text-muted);font-size:0.65rem;margin-left:6px;">' + f.hint + '</span>' : '') +
        '</label>' + input + '</div>';
    };

    const tagsStr = (item.tags || []).join(', ');

    return '<div style="max-width:760px;margin:0 auto;">' +

      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">' +
        '<button onclick="WikiSections.closeDetail(\'' + type + '\')" ' +
          'style="background:none;border:none;cursor:pointer;color:var(--accent-primary);font-size:0.85rem;display:flex;align-items:center;gap:4px;">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Torna</button>' +
        '<div style="flex:1;min-width:0;">' +
          (isEdit ?
            '<input id="wsf-nome" type="text" value="' + _escHtml(item.nome) + '" placeholder="Nome..." ' +
            'style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;background:transparent;border:none;border-bottom:2px solid ' + cfg.color + ';width:100%;padding:2px 0;color:var(--text-primary);" ' +
            'oninput="WikiSections._fieldChange(\'' + type + '\',\'nome\',this.value)">' :
            '<h2 style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;margin:0;color:var(--text-primary);">' + _escHtml(item.nome || 'Senza nome') + '</h2>'
          ) +
        '</div>' +
        '<div style="display:flex;gap:6px;">' +
          (isEdit ?
            '<button onclick="WikiSections._saveAndView(\'' + type + '\')" ' +
              'class="btn btn-primary btn-sm">Salva</button>' :
            '<button onclick="WikiSections.editCard(\'' + type + '\',\'' + item.id + '\')" ' +
              'class="btn btn-ghost btn-sm" style="display:flex;align-items:center;gap:4px;">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
              'Modifica</button>'
          ) +
          (isEdit ?
            '<button onclick="WikiSections.deleteCard(\'' + type + '\',\'' + item.id + '\')" ' +
              'style="background:none;border:1px solid var(--accent-danger);border-radius:var(--radius-md);cursor:pointer;color:var(--accent-danger);font-size:0.72rem;padding:4px 10px;">Elimina</button>' : ''
          ) +
        '</div>' +
      '</div>' +

      (item.immagine && !isEdit ?
        '<div style="position:relative;width:100%;height:180px;border-radius:var(--radius-md);overflow:hidden;margin-bottom:16px;background:var(--bg-secondary);">' +
          '<img src="' + item.immagine + '" id="ws-inline-img" ' +
          'style="position:absolute;cursor:move;max-width:none;max-height:none;width:auto;height:auto;min-height:100%;min-width:100%;object-fit:cover;top:0;left:0;user-select:none;" ' +
          'draggable="false" ' +
          'onmousedown="InlineImgDrag.start(event,this)" ' +
          'onclick="InlineImgDrag.click(event,this)" ' +
          'onerror="this.parentElement.style.display=\'none\'" ' +
          'title="Trascina per riposizionare · Clicca per ingrandire">' +
          '<button onclick="ImageViewer.open(document.getElementById(\'ws-inline-img\').src)" ' +
          'style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.5);border:none;border-radius:var(--radius-sm);color:#fff;cursor:pointer;padding:3px 7px;font-size:0.7rem;z-index:2;">⤢ Ingrandisci</button>' +
          '</div>' : '') +
      (isEdit && (type === 'png' || type === 'luoghi' || type === 'fazioni') ?
        '<div class="form-group" style="margin-bottom:16px;">' +
        '<label class="form-label">Immagine URL</label>' +
        '<input id="wsf-immagine" type="text" class="form-input" style="font-size:0.82rem;" value="' + _escHtml(item.immagine || '') + '" placeholder="https://..." oninput="WikiSections._fieldChange(\'' + type + '\',\'immagine\',this.value)">' +
        '</div>' : '') +

      '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);padding:16px;margin-bottom:16px;">' +
        '<div style="font-size:0.68rem;font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:12px;">Informazioni</div>' +
        cfg.fields.map(f => isEdit ? _editField(f) : _viewField(f, item[f.key])).join('') +
      '</div>' +

      (() => {
        const custom = _currentItem?.campi_custom || item.campi_custom || [];
        if (!isEdit && !custom.length) return '';
        let html = '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);padding:16px;margin-bottom:16px;">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">';
        html += '<div style="font-size:0.68rem;font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.08em;color:var(--accent-secondary);">Campi personalizzati</div>';
        if (isEdit) html += '<button onclick="WikiSections._addCustomField(\'' + type + '\')" style="font-size:0.72rem;padding:3px 8px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;color:var(--text-primary);">+ Campo</button>';
        html += '</div>';
        if (custom.length) {
          html += custom.map(function(f, fi) {
            if (isEdit) {
              return '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;" data-fi="' + fi + '">' +
                '<input class="form-input ws-custom-key" data-fi="' + fi + '" value="' + _escHtml(f.chiave||'') + '" placeholder="Nome campo" style="width:35%;font-size:0.78rem;">' +
                '<select class="form-select ws-custom-tipo" data-fi="' + fi + '" style="width:25%;font-size:0.78rem;">' +
                  ['testo','numero','si_no','data','link'].map(function(t){ return '<option value="' + t + '"' + (f.tipo===t?' selected':'') + '>' + {testo:'Testo',numero:'Numero',si_no:'Sì/No',data:'Data',link:'@Link'}[t] + '</option>'; }).join('') +
                '</select>' +
                (f.tipo === 'si_no'
                  ? '<select class="form-select ws-custom-val" data-fi="' + fi + '" style="flex:1;font-size:0.78rem;"><option value="si"' + (f.valore==='si'?' selected':'') + '>Sì</option><option value="no"' + (f.valore==='no'?' selected':'') + '>No</option></select>'
                  : '<input class="form-input ws-custom-val" data-fi="' + fi + '" value="' + _escHtml(f.valore||'') + '" placeholder="Valore" style="flex:1;font-size:0.78rem;">'
                ) +
                '<button onclick="WikiSections._removeCustomField(\'' + type + '\',' + fi + ')" style="background:none;border:none;cursor:pointer;color:var(--accent-danger);font-size:0.9rem;padding:0 4px;">✕</button>' +
              '</div>';
            } else {
              if (!f.valore && f.valore !== 0) return '';
              var valDisplay = f.tipo === 'si_no' ? (f.valore === 'si' ? '● Sì' : '○ No')
                : f.tipo === 'link' ? '<span style="color:var(--accent-primary);cursor:pointer;" onclick="WikiSections._jumpToEntity(\'' + (f.valore||'').replace(/^@/,'') + '\')">@' + _escHtml((f.valore||'').replace(/^@/,'')) + '</span>'
                : _escHtml(String(f.valore));
              return '<div style="display:flex;gap:8px;align-items:baseline;padding:4px 0;border-bottom:1px solid var(--border);">' +
                '<span style="font-size:0.72rem;color:var(--text-muted);min-width:120px;flex-shrink:0;">' + _escHtml(f.chiave||'') + '</span>' +
                '<span style="font-size:0.85rem;">' + valDisplay + '</span>' +
              '</div>';
            }
          }).join('');
        } else if (isEdit) {
          html += '<div style="font-size:0.78rem;color:var(--text-muted);font-style:italic;">Nessun campo personalizzato. Clicca + Campo per aggiungerne uno.</div>';
        }
        html += '</div>';
        return html;
      })() +

      '<div style="margin-bottom:16px;">' +
        (isEdit ?
          '<div class="form-group"><label class="form-label">Tag</label>' +
          '<input id="wsf-tags" type="text" class="form-input" style="font-size:0.82rem;" value="' + _escHtml(tagsStr) + '" placeholder="#png, #importante..." ' +
          'oninput="WikiSections._fieldChange(\'' + type + '\',\'tags\',this.value.split(\',\').map(t=>t.trim()).filter(Boolean))"></div>' :
          (item.tags?.length ?
            '<div style="display:flex;flex-wrap:wrap;gap:4px;">' +
            item.tags.map(t => '<span style="font-size:0.72rem;padding:2px 8px;background:' + cfg.color + '22;color:' + cfg.color + ';border-radius:var(--radius-full);">#' + t + '</span>').join('') +
            '</div>' : '')
        ) +
      '</div>' +

      (type === 'png' ? (() => {
        const camp = App.getActiveCampaign();
        const sessLog = camp?.sessioni_log || [];
        const apparso = sessLog.filter(s => (s.npcs||[]).includes(item.id));
        if (!apparso.length) return '';
        return '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px 16px;margin-bottom:16px;">' +
          '<div style="font-size:0.68rem;font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:10px;">Apparso in</div>' +
          apparso.map(s => '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="font-size:0.7rem;padding:1px 7px;background:' + (s.stato==='giocata'?'#69cc8522':'#5ba4f522') + ';color:' + (s.stato==='giocata'?'#69cc85':'#5ba4f5') + ';border-radius:var(--radius-full);">' + (s.stato==='giocata'?'Giocata':'Pianificata') + '</span>' +
            '<span style="font-size:0.82rem;cursor:pointer;color:var(--accent-primary);" onclick="WikiSections.goto(\'sessioni\');setTimeout(()=>WikiSections.openCard(\'sessioni\',\''+s.id+'\'),150)">S' + s.numero + (s.titolo?' — '+s.titolo:'') + '</span>' +
            (s.data?'<span style="font-size:0.72rem;color:var(--text-muted);">'+s.data+'</span>':'') +
            '</div>'
          ).join('') +
          '</div>';
      })() : '') +

      '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin-bottom:16px;">' +
        '<div style="padding:8px 12px;border-bottom:1px solid var(--border);font-size:0.68rem;font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);">Note libere</div>' +
        (isEdit ?
          '<div style="display:flex;flex-wrap:wrap;gap:2px;padding:4px 8px;border-bottom:1px solid var(--border);background:var(--bg-secondary);">' +
          '<button class="nc-tb" onclick="wikiF(\'bold\')"><b>B</b></button>' +
          '<button class="nc-tb" onclick="wikiF(\'italic\')"><i>I</i></button>' +
          '<button class="nc-tb" onclick="wikiF(\'underline\')"><u>S</u></button>' +
          '<button class="nc-tb" onclick="wikiF(\'strikeThrough\')"><s>ab</s></button>' +
          '<div style="width:1px;background:var(--border);margin:2px 3px;"></div>' +
          '<button class="nc-tb" onclick="wikiFB(\'h2\')">H2</button>' +
          '<button class="nc-tb" onclick="wikiFB(\'h3\')">H3</button>' +
          '<button class="nc-tb" onclick="wikiF(\'insertUnorderedList\')">•</button>' +
          '<button class="nc-tb" onclick="wikiF(\'insertOrderedList\')">±1.</button>' +
          '<div style="width:1px;background:var(--border);margin:2px 3px;"></div>' +
          '<input type="color" id="ws-color-pick" value="#c97bea" style="width:22px;height:22px;border:none;border-radius:3px;cursor:pointer;padding:1px;" title="Colore testo" oninput="wikiApplyColorWS(this.value)">' +
          '<input type="color" id="ws-hl-pick" value="#f5a623" style="width:22px;height:22px;border:none;border-radius:3px;cursor:pointer;padding:1px;" title="Evidenziatore" oninput="wikiApplyHighlightWS(this.value)">' +
          '</div>' : '') +
        (isEdit ?
          '<div id="ws-editor-free" contenteditable="true" spellcheck="true" ' +
          'style="min-height:120px;padding:12px 16px;font-size:0.88rem;line-height:1.8;outline:none;color:var(--text-primary);" ' +
          'data-placeholder="Note libere... [[Nome]] per collegare · @Nome per menzione · #tag">' + (item.note || '') + '</div>' :
          (item.note ?
            '<div style="padding:12px 16px;font-size:0.88rem;line-height:1.8;color:var(--text-primary);">' + WikiSections._parseLinks(item.note) + '</div>' :
            '<div style="padding:12px 16px;font-size:0.82rem;color:var(--text-muted);font-style:italic;">Nessuna nota. Clicca Modifica per aggiungerne.</div>')
        ) +
      '</div>' +

      (isEdit ? '<div id="ws-autosave-status" style="font-size:0.68rem;color:var(--text-muted);text-align:right;margin-bottom:8px;"></div>' : '') +

    '</div>';
  };

  const _escHtml = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const _parseLinks = (text) => {
    if (!text) return '';
    text = text.replace(/\[\[([^\]]+)\]\]/g, function(_, name) {
      var clean = name.trim();
      var safe = clean.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
      return '<span class="ws-link" data-name="' + safe + '" onclick="WikiSections._jumpToEntity(this.dataset.name)" style="cursor:pointer;color:var(--accent-primary);text-decoration:underline dotted;padding:0 2px;" title="Vai a ' + safe + '">' + clean + '</span>';
    });
    text = text.replace(/@([\wA-Za-z][\w\s]{1,30}?)(?=[\s,;.!?]|$)/gm, function(_, name) {
      var clean = name.trim();
      var safe = clean.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
      return '<span class="ws-link" data-name="' + safe + '" onclick="WikiSections._jumpToEntity(this.dataset.name)" style="cursor:pointer;color:var(--accent-secondary);font-weight:600;" title="Vai a ' + safe + '">@' + clean + '</span>';
    });

    text = text.replace(/#([\w\u00C0-\u00FF]+)/g, function(_, tag) {
      var safe = tag.replace(/"/g, "");
      return '<span class="nc-tag" data-tag="' + safe + '" style="display:inline-block;padding:1px 7px;background:var(--accent-primary);opacity:0.8;color:#fff;border-radius:var(--radius-full);font-size:0.78rem;cursor:pointer;" title="#' + safe + '">#' + safe + '</span>';
    });
    return text;
  };

  const _fieldChange = (type, key, value) => {
    if (!_currentItem) return;
    _currentItem[key] = value;
    _scheduleAutosave(type);
  };

  const _scheduleAutosave = (type) => {
    clearTimeout(_autosaveTimer);
    const status = document.getElementById('ws-autosave-status');
    if (status) status.textContent = 'Salvataggio...';
    _autosaveTimer = setTimeout(() => {
      _save(type);
      if (status) status.textContent = 'Salvato ' + new Date().toLocaleTimeString('it-IT', {hour:'2-digit',minute:'2-digit'});
    }, 1500);
  };

  const _save = (type) => {
    if (!_currentItem) return;
    const camp = App.getActiveCampaign();

    const editor = document.getElementById('ws-editor-free');
    if (editor) _currentItem.note = editor.innerHTML;
    TYPES[type].saveItem(camp, _currentItem);

    renderCounters();
  };

  const closeDetail = (type) => {

    if (_currentItem) {
      try { WikiSections._saveCustomFields(type); } catch(e) {}
      _save(type);
    }
    _currentItem = null;
    const listEl   = document.getElementById('wiki-' + type + '-list');
    const detailEl = document.getElementById('wiki-' + type + '-detail');
    if (listEl) listEl.style.display = '';
    if (detailEl) detailEl.style.display = 'none';
    renderList(type);
  };

  const newCard = (type) => {
    const cfg = TYPES[type];
    const newItem = cfg.newItem();

    const camp = App.getActiveCampaign();
    cfg.saveItem(camp, newItem);

    const detailEl2 = document.getElementById('wiki-' + type + '-detail');
    const listEl2   = document.getElementById('wiki-' + type + '-list');
    _currentType = type;
    _currentItem = { ...newItem };
    if (listEl2) listEl2.style.display = 'none';
    if (detailEl2) { detailEl2.style.display = ''; detailEl2.innerHTML = _renderDetail(type, newItem, 'edit'); }
    const editor2 = document.getElementById('ws-editor-free');
    if (editor2) editor2.addEventListener('input', () => { _currentItem.note = editor2.innerHTML; _scheduleAutosave(type); });

    setTimeout(() => document.getElementById('wsf-nome')?.focus(), 100);
  };

  const deleteCard = (type, id) => {
    if (!confirm('Eliminare questa voce? Verrà spostata nel cestino.')) return;
    const camp = App.getActiveCampaign();
    const cfg = TYPES[type];

    const items = cfg.getData(camp);
    const item = items.find(x => x.id === id);
    if (item) try { WikiTrash.addToTrash({ id, titolo: item.nome }, type); } catch(e) {}

    if (type === 'png') {
      App.saveActiveCampaign({ npcs: (camp.npcs || []).filter(n => n.id !== id) });
    } else if (type === 'luoghi') {
      App.saveActiveCampaign({ locations: (camp.locations || []).filter(l => l.id !== id) });
    } else if (type === 'fazioni') {
      App.saveActiveCampaign({ factions: (camp.factions || []).filter(f => f.id !== id) });
    } else if (type === 'lore' || type === 'sessioni') {
      const wiki = camp?.wiki || {};
      const sec = type === 'lore' ? 'lore' : 'sessioni';
      if (wiki[sec]) wiki[sec] = wiki[sec].filter(n => n.id !== id);
      App.saveActiveCampaign({ wiki });
    }
    closeDetail(type);
    Toast.show('Voce eliminata', 'info', 1500);
  };

  const filter = (type, q) => {
    const lc = q.toLowerCase();
    document.querySelectorAll('#wiki-' + type + '-grid > div').forEach(card => {
      card.style.display = (card.dataset.search || '').includes(lc) ? '' : 'none';
    });
  };

  const filterTag = (type, tag) => {
    const camp = App.getActiveCampaign();
    const cfg = TYPES[type];
    const items = cfg.getData(camp);
    const grid = document.getElementById('wiki-' + type + '-grid');
    if (!grid) return;
    if (!tag) { renderList(type); return; }
    grid.querySelectorAll('[data-search]').forEach((card, i) => {
      const item = items[i];
      card.style.display = (item?.tags || []).includes(tag) ? '' : 'none';
    });
  };

  const renderCounters = () => {
    const camp = App.getActiveCampaign();
    if (!camp) return;
    Object.keys(TYPES).forEach(type => {
      const cnt = document.getElementById('wiki-cnt-' + type);
      if (cnt) try { cnt.textContent = TYPES[type].getData(camp).length; } catch(e) {}
    });
  };

  const init = () => {
    renderCounters();
  };

  const editCard = (type, id) => {
    const cfg = TYPES[type];
    const camp = App.getActiveCampaign();
    const items = cfg.getData(camp);
    const item = items.find(x => x.id === id);
    if (!item) return;
    _currentType = type;
    _currentItem = { ...item };
    const detailEl = document.getElementById('wiki-' + type + '-detail');
    if (detailEl) detailEl.innerHTML = _renderDetail(type, item, 'edit');

    setTimeout(() => {
      const editor = document.getElementById('ws-editor-free');
      if (editor) {
        editor.addEventListener('input', () => { _currentItem.note = editor.innerHTML; _scheduleAutosave(type); });
        editor.addEventListener('blur', () => { if(_currentItem) _save(type); });
        editor.addEventListener('input', (e) => MentionPicker.onInput(e, editor));
        editor.addEventListener('keydown', (e) => MentionPicker.onKeydown(e));
      }

      const detailEl2 = document.getElementById('wiki-' + type + '-detail');
      if (detailEl2) {
        detailEl2.querySelectorAll('input,textarea,select').forEach(el => {
          el.addEventListener('blur', () => { if(_currentItem) _save(type); });
        });
        const cfg = TYPES[type];
        if (cfg?.fields) {
          cfg.fields.forEach(f => {
            if (f.type === 'mention' || f.type === 'mentions') {
              const inp = detailEl2.querySelector('#wsf-' + f.key);
              if (inp) MentionPicker.attachToInput(inp);
            }
          });
        }
      }
    }, 50);
  };

  const _saveAndView = (type) => {
    if (_currentItem) {

      try { WikiSections._saveCustomFields(type); } catch(e) {}
      _save(type);
    }
    const camp = App.getActiveCampaign();
    const cfg = TYPES[type];
    const items = cfg.getData(camp);
    const item = items.find(x => x.id === _currentItem?.id);
    const detailEl = document.getElementById('wiki-' + type + '-detail');
    if (detailEl && item) detailEl.innerHTML = _renderDetail(type, item, 'view');
    const status = document.getElementById('ws-autosave-status');

  };

  const _jumpToEntity = (name) => {
    const camp = App.getActiveCampaign();
    const lc = name.toLowerCase();

    const npc = (camp?.npcs||[]).find(n => (n.name||n.nome||'').toLowerCase().includes(lc));
    if (npc) { goto('png'); setTimeout(() => openCard('png', npc.id), 100); return; }

    const loc = (camp?.locations||[]).find(l => (l.nome||l.name||'').toLowerCase().includes(lc));
    if (loc) { goto('luoghi'); setTimeout(() => openCard('luoghi', loc.id), 100); return; }

    const fac = (camp?.factions||[]).find(f => (f.nome||f.name||'').toLowerCase().includes(lc));
    if (fac) { goto('fazioni'); setTimeout(() => openCard('fazioni', fac.id), 100); return; }
    Toast.show('Entità non trovata: ' + name, 'warning', 2000);
  };

  const _manualSave = () => { if (_currentType && _currentItem) _save(_currentType); };
  const gotoTrame = () => {

    App.navigateTo('trame');

    document.querySelectorAll('.nav-subitem').forEach(b => {
      b.classList.toggle('active', b.dataset.wikiSection === 'trame');
    });
    if (!_expanded) {
      _expanded = true;
      const sub = document.getElementById('wiki-subnav');
      const chev = document.getElementById('wiki-nav-chevron');
      if (sub) sub.style.display = 'flex';
      if (chev) chev.style.transform = 'rotate(180deg)';
    }
  };

  const _renderDetailPub = (type, item, mode) => _renderDetail(type, item, mode);
  const _scheduleAutosavePub = (type) => _scheduleAutosave(type);
  const _getCfg = (type) => TYPES[type];
  const _currentItemRef = { get value() { return _currentItem; } };

  const _saveWithCustom = (type) => {
    _saveCustomFields(type);
    _save(type);
  };

  const toggleLuoghiView = () => {
    const grid = document.getElementById('wiki-luoghi-grid');
    const tree = document.getElementById('wiki-luoghi-tree');
    const btn  = document.getElementById('luoghi-view-btn');
    if (!grid || !tree) return;
    const showingTree = tree.style.display !== 'none';
    grid.style.display = showingTree ? '' : 'none';
    tree.style.display = showingTree ? 'none' : '';
    if (btn) btn.textContent = showingTree ? '🌳 Albero' : '📋 Lista';
    if (!showingTree) _renderLuoghiTree();
  };

  return { toggleExpand, goto, gotoTrame, toggleLuoghiView, renderList, openCard, editCard, closeDetail,
    newCard, deleteCard, filter, filterTag, renderCounters, init,
    _fieldChange, _jumpToEntity, _saveAndView, _parseLinks, _manualSave,
    _renderDetailPub, _scheduleAutosavePub, _getCfg, _saveWithCustom,
    get _currentType() { return _currentType; },
    get _currentItem()  { return _currentItem; },
  };
})();
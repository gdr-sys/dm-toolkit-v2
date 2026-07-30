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
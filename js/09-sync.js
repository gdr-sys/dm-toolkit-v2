const GDrive = (() => {

  let CLIENT_ID = localStorage.getItem('dm_gdrive_client_id') || '';
  const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';
  const FILE_NAME = 'dm-toolkit-campagna.json';

  let _loggedIn = false;
  let _fileId = null;
  let _userInfo = null;

  const init = () => {
    const btn = document.getElementById('gdrive-btn');
    if (btn) btn.style.display = '';

    _fileId = localStorage.getItem('dm_gdrive_fileid') || null;
    const savedId = localStorage.getItem('dm_gdrive_client_id');
    if (savedId) CLIENT_ID = savedId;
    _updateBtn();
  };

  const _updateBtn = () => {
    const btn = document.getElementById('gdrive-btn');
    if (!btn) return;
    if (_loggedIn && _userInfo) {
      btn.textContent = '☁️ ' + (_userInfo.name?.split(' ')[0] || 'Drive');
      btn.title = 'Connesso come ' + _userInfo.email + ' — clicca per opzioni';
      btn.style.color = 'var(--accent-secondary)';
    } else {
      btn.textContent = '☁️ Drive';
      btn.title = 'Connetti Google Drive';
      btn.style.color = '';
    }
  };

  const toggleLogin = () => {
    if (!CLIENT_ID) { Modal.open('gdrive-setup'); return; }
    if (_loggedIn) { Modal.open('gdrive-options'); }
    else { _login(); }
  };

  const _login = async () => {
    if (!window.gapi) {
      Toast.show('Aggiungi prima il Client ID (clicca ☁️ Drive)', 'warning', 3000);
      Modal.open('gdrive-setup');
      return;
    }
    try {
      await gapi.auth2.getAuthInstance().signIn();
      _loggedIn = true;
      const profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
      _userInfo = { name: profile.getName(), email: profile.getEmail(), picture: profile.getImageUrl() };
      _updateBtn();
      Toast.show('✓ Connesso come ' + _userInfo.name, 'success', 2000);
    } catch(e) {
      Toast.show('Login fallito: ' + (e.error || e.message), 'error');
    }
  };

  const logout = () => {
    if (window.gapi) gapi.auth2.getAuthInstance().signOut();
    _loggedIn = false;
    _userInfo = null;
    _fileId = null;
    localStorage.removeItem('dm_gdrive_fileid');
    _updateBtn();
    Toast.show('Disconnesso da Google Drive', 'info');
    Modal.close('gdrive-options');
  };

  const save = async (campagna) => {
    if (!_loggedIn) return false;
    try {
      const body = JSON.stringify({ campagna, savedAt: Date.now(), version: 1 });
      if (_fileId) {
        await gapi.client.request({
          path: '/upload/drive/v3/files/' + _fileId,
          method: 'PATCH',
          params: { uploadType: 'media' },
          body,
        });
      } else {
        const res = await gapi.client.drive.files.create({
          resource: { name: FILE_NAME, mimeType: 'application/json' },
          media: { mimeType: 'application/json', body },
          fields: 'id, webViewLink',
        });
        _fileId = res.result.id;
        localStorage.setItem('dm_gdrive_fileid', _fileId);
      }
      return true;
    } catch(e) {
      Debug.warn('GDrive save error:', e);
      return false;
    }
  };

  const load = async (fileId) => {
    if (!_loggedIn) return null;
    try {
      const fid = fileId || _fileId;
      if (!fid) return null;
      const res = await gapi.client.drive.files.get({ fileId: fid, alt: 'media' });
      return res.result;
    } catch(e) {
      Debug.warn('GDrive load error:', e);
      return null;
    }
  };

  const generateInvite = async () => {
    if (!_loggedIn) { Toast.show('Connettiti prima a Google Drive', 'warning'); return null; }
    if (!_fileId) { Toast.show('Salva prima la campagna su Drive', 'warning'); return null; }
    try {

      await gapi.client.drive.permissions.create({
        fileId: _fileId,
        resource: { role: 'writer', type: 'anyone' },
      });

      const code = btoa(_fileId).replace(/=/g,'').slice(0,16).toUpperCase();

      const invites = JSON.parse(localStorage.getItem('dm_invites') || '{}');
      invites[code] = _fileId;
      localStorage.setItem('dm_invites', JSON.stringify(invites));
      return { code, fileId: _fileId };
    } catch(e) {
      Debug.warn('GDrive invite error:', e);
      return null;
    }
  };

  const acceptInvite = async (code) => {
    if (!_loggedIn) { await _login(); if (!_loggedIn) return false; }

    let fileId = null;

    const invites = JSON.parse(localStorage.getItem('dm_invites') || '{}');
    if (invites[code]) { fileId = invites[code]; }
    else {

      try { fileId = atob(code + '=='.slice(0, (4 - code.length % 4) % 4)); } catch(e) {}
    }
    if (!fileId) {

      fileId = code;
    }
    try {
      const data = await load(fileId);
      if (!data?.campagna) { Toast.show('Codice non valido o campagna non trovata', 'error'); return false; }
      _fileId = fileId;
      localStorage.setItem('dm_gdrive_fileid', fileId);
      return data.campagna;
    } catch(e) {
      Toast.show('Errore accesso: ' + (e.message||''), 'error');
      return false;
    }
  };

  const _saveClientId = () => {
    const id = document.getElementById('gdrive-client-id-input')?.value?.trim();
    if (!id) { Toast.show('Inserisci il Client ID', 'warning'); return; }
    CLIENT_ID = id;
    localStorage.setItem('dm_gdrive_client_id', id);
    Modal.close('gdrive-setup');
    Toast.show('Client ID salvato — ricarica la pagina', 'success', 3000);
  };

  const isLoggedIn = () => _loggedIn;
  const getFileId = () => _fileId;

  return { init, toggleLogin, logout, save, load, generateInvite, acceptInvite, isLoggedIn, getFileId, _saveClientId };
})();

let _wikiViewMode = 'view';

const _applyViewMode = () => {
  const content = document.getElementById('wiki-note-content');
  const toolbar  = document.getElementById('wiki-toolbar');
  const titleEl  = document.getElementById('wiki-note-title');
  const btn      = document.getElementById('wiki-view-toggle');

  if (_wikiViewMode === 'view') {
    if (content) { content.contentEditable = 'false'; content.style.cursor = 'default'; }
    if (toolbar)  toolbar.classList.add('view-mode');
    if (titleEl)  titleEl.disabled = true;
    if (btn) { btn.textContent = '✏️ Modifica'; btn.title = 'Passa in modalità modifica'; btn.style.color = 'var(--accent-secondary)'; }
  } else {
    if (content) { content.contentEditable = 'true'; content.style.cursor = ''; content.focus(); }
    if (toolbar)  toolbar.classList.remove('view-mode');
    if (titleEl)  titleEl.disabled = false;
    if (btn) { btn.textContent = '👁 Vista'; btn.title = 'Passa in modalità lettura'; btn.style.color = ''; }
  }
};

const _getWordAtCursor = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  if (!sel.isCollapsed) return null;

  const range = sel.getRangeAt(0).cloneRange();
  range.expand('word');
  return range;
};

const wikiApplyColor = () => {
  const color = document.getElementById('wiki-color-pick')?.value || '#f5a623';
  const sel = window.getSelection();
  const el = document.getElementById('wiki-note-content');
  if (!el) return;
  el.focus();

  if (sel && sel.isCollapsed) {
    const r = _getWordAtCursor();
    if (r) { sel.removeAllRanges(); sel.addRange(r); }
  }
  document.execCommand('foreColor', false, color);
  _saveActiveEditor();
};

const wikiApplyHighlight = () => {
  const color = document.getElementById('wiki-hl-pick')?.value || '#f5a623';
  const sel = window.getSelection();
  const el = _getActiveEditor();
  if (!el) return;
  el.focus();
  if (sel && sel.isCollapsed) {
    const r = _getWordAtCursor();
    if (r) { sel.removeAllRanges(); sel.addRange(r); }
  }
  document.execCommand('hiliteColor', false, color + '60');
  WikiDM.saveNote();
};

const miniFmt = (fieldId, cmd) => {
  const el = document.getElementById(fieldId);
  if (!el) return;
  const isEditable = el.contentEditable === 'true';

  if (isEditable) {

    el.focus();

    if (cmd === 'bold')      { document.execCommand('bold', false, null); }
    else if (cmd === 'italic')    { document.execCommand('italic', false, null); }
    else if (cmd === 'underline') { document.execCommand('underline', false, null); }
    else if (cmd === 'link') {
      const camp = App.getActiveCampaign();
      const pages = [];
      const wiki = camp?.wiki || {};
      ['lore','sessioni'].forEach(sec => (wiki[sec]||[]).forEach(n => pages.push({label:'📄 '+n.titolo, key:n.titolo})));
      (camp?.npcs||[]).forEach(n => pages.push({label:'👤 '+(n.name||n.nome||''), key:'png:'+(n.name||n.nome||'')}));
      (camp?.locations||[]).forEach(l => pages.push({label:'🗺️ '+(l.nome||''), key:'luogo:'+(l.nome||'')}));
      (camp?.factions||[]).forEach(f => pages.push({label:'⚔️ '+(f.nome||''), key:'fazione:'+(f.nome||'')}));
      const list = pages.slice(0,25).map((p,i) => (i+1)+'. '+p.label).join('\n');
      const input = prompt('Collega a (numero o titolo):\n'+list, '');
      if (!input?.trim()) return;
      const num = parseInt(input.trim());
      const found = !isNaN(num) && num>=1 && num<=pages.length ? pages[num-1]
                  : pages.find(p => p.label.toLowerCase().includes(input.trim().toLowerCase()));
      const key = found ? found.key : input.trim();
      const titolo = key.startsWith('png:') ? key.slice(4)
                   : key.startsWith('luogo:') ? key.slice(6)
                   : key.startsWith('fazione:') ? key.slice(8)
                   : key;
      const cls = found ? 'nc-wikilink' : 'nc-wikilink nc-broken';
      const icon = !found ? '' : key.startsWith('png:') ? '👤 ' : key.startsWith('luogo:') ? '🗺️ ' : key.startsWith('fazione:') ? '⚔️ ' : '';
      document.execCommand('insertHTML', false,
        '<span class="'+cls+'" data-link="'+key+'" onclick="wikiNavigateLink(\''+key.replace(/'/g,"\\'")+'\')" style="cursor:pointer;">[['+icon+titolo+']]</span>&nbsp;'
      );
    }
    else if (cmd === 'tag') {
      const tag = prompt('Nome tag (senza #):', '');
      if (!tag?.trim()) return;
      document.execCommand('insertHTML', false,
        '<span class="nc-tag">#'+tag.trim().toLowerCase().replace(/\s+/g,'_')+'</span>&nbsp;'
      );
    }
    else if (cmd === 'secret') {
      document.execCommand('insertHTML', false,
        '<div class="wiki-callout wiki-callout-secret"><span class="wiki-callout-label">🔒 SEGRETO DM</span><p>...</p></div><p><br></p>'
      );
    }
    else if (cmd === 'clue') {
      document.execCommand('insertHTML', false,
        '<div class="wiki-callout wiki-callout-clue"><span class="wiki-callout-label">🔍 INDIZIO</span><p>...</p></div><p><br></p>'
      );
    }
    return;
  }

  const start = el.selectionStart || 0, end = el.selectionEnd || 0;
  const text = el.value || '';
  const sel = text.slice(start, end);
  let ins = '';
  if (cmd === 'bold')       ins = '**'+(sel||'testo')+'**';
  else if (cmd === 'italic') ins = '*'+(sel||'testo')+'*';
  else if (cmd === 'underline') ins = '__'+(sel||'testo')+'__';
  else if (cmd === 'tag') {
    const tag = prompt('Nome tag:', '');
    if (!tag?.trim()) return;
    ins = '#'+tag.trim().toLowerCase().replace(/\s+/g,'_')+' ';
  }
  else if (cmd === 'link') { ins = '[[]]'; }
  else if (cmd === 'secret') { ins = '[SEGRETO DM: ...]'; }
  else if (cmd === 'clue')   { ins = '[INDIZIO: ...]'; }
  if (ins) {
    el.value = text.slice(0,start) + ins + text.slice(end);
    el.selectionStart = el.selectionEnd = start + ins.length;
    el.dispatchEvent(new Event('input'));
    el.focus();
  }
};
const _getWordInTextarea = (el) => {
  const pos = el.selectionStart;
  const text = el.value;
  let start = pos, end = pos;
  while (start > 0 && /\w/.test(text[start-1])) start--;
  while (end < text.length && /\w/.test(text[end])) end++;
  el._wordStart = start; el._wordEnd = end;
  return text.slice(start, end);
};

const _insertInTextarea = (el, ins, start, end) => {
  const text = el.value;
  el.value = text.slice(0, start) + ins + text.slice(end);
  el.selectionStart = el.selectionEnd = start + ins.length;
  el.dispatchEvent(new Event('input'));
  el.focus();
};

const _extraTemplates = () => [
  {
    id:'tpl_oggetto', nome:'💎 Oggetto Magico', icona:'💎', builtin:true,
    contenuto:`<h1></h1>
<p><strong>Tipo:</strong> &nbsp;|&nbsp; <strong>Rarità:</strong> &nbsp;|&nbsp; <strong>Richiede sintonia:</strong> No &nbsp;|&nbsp; #oggetto</p>
<h2>Descrizione</h2><p></p>
<h2>Proprietà magiche</h2><ul><li></li></ul>
<h2>Storia dell'oggetto</h2><p></p>
<h2>Note DM</h2><blockquote></blockquote>`
  },
  {
    id:'tpl_dungeon', nome:'🏚️ Dungeon / Stanza', icona:'🏚️', builtin:true,
    contenuto:`<h1></h1>
<p><strong>Tipo:</strong> Dungeon / Stanza &nbsp;|&nbsp; <strong>Piano:</strong> &nbsp;|&nbsp; #dungeon</p>
<h2>📢 READ ALOUD</h2>
<div class="wiki-callout wiki-callout-read-aloud"><span class="wiki-callout-label">📢 READ ALOUD</span><p>Descrivi la stanza ai giocatori...</p></div>
<h2>Dettagli DM</h2><p></p>
<h2>⚠️ Pericoli / Trappole</h2>
<div class="wiki-callout wiki-callout-trap"><span class="wiki-callout-label">⚠️ TRAPPOLA</span><p>...</p></div>
<h2>💰 Loot</h2>
<div class="wiki-callout wiki-callout-loot"><span class="wiki-callout-label">💰 LOOT</span><p>...</p></div>
<h2>Uscite</h2><ul><li>Nord: [[]]</li><li>Sud: [[]]</li></ul>`
  },
  {
    id:'tpl_evento', nome:'🔍 Evento / Segreto', icona:'🔍', builtin:true,
    contenuto:`<h1></h1>
<p><strong>Tipo:</strong> Evento / Segreto &nbsp;|&nbsp; <strong>Sessione:</strong> &nbsp;|&nbsp; #segreto</p>
<h2>Cosa è successo</h2><p></p>
<h2>🔒 Chi lo sa</h2>
<div class="wiki-callout wiki-callout-secret"><span class="wiki-callout-label">🔒 SEGRETO DM</span><p>Solo il DM sa che...</p></div>
<h2>🔍 Come può emergere</h2>
<div class="wiki-callout wiki-callout-clue"><span class="wiki-callout-label">🔍 INDIZIO</span><p>I PG possono scoprirlo se...</p></div>
<h2>Impatto sulla trama</h2><p></p>
<h2>Collegato a</h2><ul><li>[[]]</li></ul>`
  },
  {
    id:'tpl_negozio', nome:'🏪 Negozio', icona:'🏪', builtin:true,
    contenuto:`<h1></h1>
<p><strong>Tipo:</strong> &nbsp;|&nbsp; <strong>Luogo:</strong> [[]] &nbsp;|&nbsp; #negozio</p>
<h2>Descrizione</h2><p></p>
<h2>Gestore</h2><p>[[]] — </p>
<h2>Inventario</h2>
<div class="wiki-callout wiki-callout-loot"><span class="wiki-callout-label">💰 IN VENDITA</span>
<ul><li></li></ul></div>
<h2>Prezzi speciali / offerte</h2><p></p>
<h2>Note DM</h2><blockquote></blockquote>`
  },
];

const _fieldVal = (id) => {
  const el = document.getElementById(id);
  if (!el) return '';
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value;

  return el.innerHTML || '';
};
const _setField = (id, val) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') el.value = val || '';
  else el.innerHTML = val || '';
};

const miniFmtColor = (fieldId) => {
  const el = document.getElementById(fieldId);
  if (!el || el.contentEditable !== 'true') return;
  el.focus();
  const color = document.getElementById('wiki-color-pick')?.value || '#f5a623';
  const sel = window.getSelection();
  if (sel && sel.isCollapsed) { const r = _getWordAtCursor(); if (r) { sel.removeAllRanges(); sel.addRange(r); } }
  document.execCommand('foreColor', false, color);
};

const miniFmtHL = (fieldId) => {
  const el = document.getElementById(fieldId);
  if (!el || el.contentEditable !== 'true') return;
  el.focus();
  const color = document.getElementById('wiki-hl-pick')?.value || '#f5a623';
  const sel = window.getSelection();
  if (sel && sel.isCollapsed) { const r = _getWordAtCursor(); if (r) { sel.removeAllRanges(); sel.addRange(r); } }
  document.execCommand('hiliteColor', false, color + '60');
};

const WIKI_COMP_TEMPLATES = {

  'tpl_oggetto':  'magic_items',
  'tpl_npc':      'monsters',
  'tpl_npc_wiki': 'monsters',
  'tpl_sess':     null,
  'tpl_lore':     null,
  'tpl_loc':      null,
  'tpl_luogo_wiki': null,
  'tpl_dungeon':  null,
  'tpl_evento':   null,
  'tpl_negozio':  null,
  'tpl_free':     null,
};

const _extractFromWikiNote = (nota) => {
  const html = nota.contenuto || '';
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const nome = h1 ? h1[1].replace(/<[^>]+>/g,'').trim() : nota.titolo || '';

  const tags = [...html.matchAll(/class="nc-tag"[^>]*>#([^<]+)/g)].map(m => m[1]);

  let categoria = 'magic_items';
  if (tags.includes('oggetto') || tags.includes('oggetto_magico')) categoria = 'magic_items';
  else if (tags.includes('mostro') || tags.includes('png') || tags.includes('npc')) categoria = 'monsters';
  else if (tags.includes('incantesimo') || tags.includes('spell')) categoria = 'spells';
  else if (tags.includes('equipaggiamento') || tags.includes('equipment')) categoria = 'equipment';

  const extractField = (label) => {
    const re = new RegExp('<strong>' + label + ':<\/strong>\s*([^<\n]+)', 'i');
    const m = html.match(re);
    return m ? m[1].replace(/<[^>]+>/g,'').trim() : '';
  };

  const extractSection = (heading) => {
    const re = new RegExp('<h2[^>]*>[^<]*' + heading + '[^<]*<\/h2>([\s\S]*?)(?=<h[12]|$)', 'i');
    const m = html.match(re);
    return m ? m[1].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim() : '';
  };

  const base = {
    id: 'wiki_' + nota.id,
    wikiId: nota.id,
    nome,
    categoria,
    descrizione: extractSection('Descrizione') || extractSection('Proprietà') || text.slice(0, 500),
    note: 'Importato dalla Wiki il ' + new Date().toLocaleDateString('it-IT'),
  };

  if (categoria === 'magic_items') {
    return {
      ...base,
      rarita: extractField('Rarità') || extractField('Rarity') || '',
      tipo_base: extractField('Tipo') || '',
      sintonia: extractField('Richiede sintonia').toLowerCase().includes('sì') ||
                extractField('Sintonia').toLowerCase().includes('sì'),
    };
  } else if (categoria === 'monsters') {
    return {
      ...base,
      gs: extractField('GS') || extractField('Grado Sfida') || '1',
      tipo: extractField('Tipo') || extractField('Razza') || '',
      dimensione: extractField('Dimensione') || 'Media',
      pf: extractField('PF') || '10',
      ca: extractField('CA') || '12',
    };
  }
  return base;
};

const _syncWikiToCompendio = (notaId, enable) => {
  const w = WikiDM._getData?.() || {};
  const camp = App.getActiveCampaign();
  if (!camp) return;

  let nota = null;
  for (const sec of ['lore','sessioni']) {
    nota = (w[sec]||[]).find(n => n.id === notaId);
    if (nota) break;
  }
  if (!nota) return;

  const homebrew = (camp.homebrew || []).slice();

  if (enable) {

    const item = _extractFromWikiNote(nota);
    const existingIdx = homebrew.findIndex(h => h.wikiId === notaId);
    if (existingIdx >= 0) {
      homebrew[existingIdx] = { ...homebrew[existingIdx], ...item };
      Toast.show('📦 Compendio aggiornato: ' + item.nome, 'success', 2000);
    } else {
      homebrew.push(item);
      Toast.show('📦 Aggiunto al Compendio: ' + item.nome, 'success', 2000);
    }

    nota.inCompendio = true;
  } else {

    const before = homebrew.length;
    const filtered = homebrew.filter(h => h.wikiId !== notaId);
    if (filtered.length < before) {
      Toast.show('📦 Rimosso dal Compendio', 'info', 1500);
    }
    nota.inCompendio = false;
    App.saveActiveCampaign({ homebrew: filtered });

    WikiDM.saveNote();
    return;
  }

  App.saveActiveCampaign({ homebrew });
  WikiDM.saveNote();
};

const _updateCompendioToggle = (nota) => {
  const wrap  = document.getElementById('wiki-compendio-sync');
  const check = document.getElementById('wiki-sync-check');
  const mondoBtn = document.getElementById('wiki-mondo-sync-btn');
  if (!wrap || !check) return;

  const content = nota?.contenuto || '';
  const tags = [...content.matchAll(/class="nc-tag"[^>]*>#([^<]+)/g)].map(m => m[1]);
  const showFor = ['oggetto','oggetto_magico','mostro','npc','png','incantesimo','spell','equipaggiamento'];
  const shouldShow = tags.some(t => showFor.includes(t)) ||
    (nota?.titolo||'').toLowerCase().includes('oggetto') ||
    content.includes('class="nc-wikilink"');

  wrap.style.display = shouldShow ? 'flex' : 'none';
  check.checked = nota?.inCompendio === true;

  if (mondoBtn) {
    mondoBtn.style.display = nota?.mondoId ? 'block' : 'none';
  }
};

const _mondoToWiki = (tipo, entita) => {
  const w = (() => {
    const camp = App.getActiveCampaign();
    return camp?.wiki || { lore: [], sessioni: [], templates: [] };
  })();

  const nome = entita.name || entita.nome || '';
  const existing = (w.lore || []).find(n =>
    n.mondoId === entita.id || n.titolo === nome
  );

  let contenuto = '';

  if (tipo === 'npc') {
    const faz = (() => {
      const camp = App.getActiveCampaign();
      return (camp?.factions||[]).find(f => f.id === entita.factionId);
    })();
    contenuto =
      '<h1>' + nome + '</h1>' +
      '<p><strong>Razza:</strong> ' + (entita.race||'') +
      ' &nbsp;|&nbsp; <strong>Ruolo:</strong> ' + (entita.job||'') +
      (faz ? ' &nbsp;|&nbsp; <strong>Fazione:</strong> <span class="nc-wikilink" data-link="fazione:'+faz.nome+'" onclick="wikiNavigateLink(\'fazione:'+faz.nome+'\')">[[⚔️ '+faz.nome+']]</span>' : '') +
      '</p>' +
      '<p>#npc #png' + (entita.factionId ? '' : '') + (entita.race ? ' #'+entita.race.toLowerCase().replace(/\s+/g,'_') : '') + '</p>' +
      '<h2>Tratto caratteriale</h2>' +
      '<p>' + (entita.trait || '') + '</p>' +
      '<h2>Vuole / Offre</h2>' +
      '<p><strong>Vuole:</strong> ' + (entita.wants||'...') + '<br>' +
      '<strong>Offre:</strong> ' + (entita.offers||'...') + '</p>' +
      (entita.secret ? '<h2>🔒 Segreto DM</h2><div class="wiki-callout wiki-callout-secret"><span class="wiki-callout-label">🔒 SEGRETO DM</span><p>' + entita.secret + '</p></div>' : '') +
      '<h2>Legami</h2>' +
      '<p>' + (entita.links || '') + '</p>';
  }

  else if (tipo === 'luogo') {
    contenuto =
      '<h1>' + nome + '</h1>' +
      '<p><strong>Tipo:</strong> ' + (entita.tipo||'') + ' &nbsp;|&nbsp; #luogo' + (entita.tipo ? ' #'+entita.tipo : '') + '</p>' +
      '<h2>Descrizione</h2>' +
      '<p>' + (entita.desc || '') + '</p>' +
      (entita.poi ? '<h2>Punti di Interesse</h2><p>' + entita.poi + '</p>' : '') +
      (entita.loot ? '<h2>💰 Loot</h2><div class="wiki-callout wiki-callout-loot"><span class="wiki-callout-label">💰 LOOT</span><p>' + entita.loot + '</p></div>' : '') +
      (entita.note ? '<h2>Note DM</h2><blockquote>' + entita.note + '</blockquote>' : '');
  }

  else if (tipo === 'fazione') {
    contenuto =
      '<h1>' + nome + '</h1>' +
      '<p>#fazione' + (entita.tipo ? ' #'+entita.tipo.toLowerCase().replace(/\s+/g,'_') : '') + '</p>' +
      '<h2>Obiettivi</h2>' +
      '<p>' + (entita.obiettivi || '') + '</p>' +
      (entita.note ? '<h2>Note DM</h2><div class="wiki-callout wiki-callout-secret"><span class="wiki-callout-label">🔒 SEGRETO DM</span><p>' + entita.note + '</p></div>' : '');
  }

  const now = Date.now();

  if (existing) {

    existing.titolo = nome;
    existing.aggiornatoAt = now;

    const userExtra = _extractUserAdditions(existing.contenuto);
    existing.contenuto = contenuto + (userExtra ? '\n<hr>\n' + userExtra : '');
    existing.mondoId = entita.id;
    existing.mondoTipo = tipo;
  } else {

    const uid = 'n' + now + Math.random().toString(36).slice(2,5);
    const nota = {
      id: uid,
      titolo: nome,
      contenuto,
      tags: [tipo === 'npc' ? 'npc' : tipo === 'luogo' ? 'luogo' : 'fazione'],
      creatoAt: now,
      aggiornatoAt: now,
      mondoId: entita.id,
      mondoTipo: tipo,
    };
    if (!w.lore) w.lore = [];
    w.lore.unshift(nota);
  }

  App.saveActiveCampaign({ wiki: w });
};

const _extractUserAdditions = (html) => {
  if (!html) return '';

  const hrIdx = html.lastIndexOf('<hr>');
  if (hrIdx >= 0) return html.slice(hrIdx + 4).trim();
  return '';
};

const wikiToMondo = (notaId) => {
  const camp = App.getActiveCampaign();
  if (!camp) return;
  const wiki = camp.wiki || {};
  const nota = (wiki.lore||[]).find(n => n.id === notaId);
  if (!nota?.mondoId || !nota?.mondoTipo) {
    Toast.show('Questa nota non è collegata a un\'entità del Mondo', 'info', 2500);
    return;
  }

  const tipo = nota.mondoTipo;
  const html = nota.contenuto || '';

  const extractField = (label) => {
    const re = new RegExp('<strong>' + label + ':<\\/strong>\\s*([^<\\n]+)', 'i');
    const m = html.match(re);
    return m ? m[1].replace(/<[^>]+>/g,'').trim() : null;
  };
  const extractSection = (heading) => {
    const re = new RegExp('<h2[^>]*>[^<]*' + heading + '[^<]*<\\/h2>([\\s\\S]*?)(?=<h[12]|<hr|$)', 'i');
    const m = html.match(re);
    return m ? m[1].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim() : null;
  };

  if (tipo === 'npc') {
    const npcs = (camp.npcs||[]).map(n => {
      if (n.id !== nota.mondoId) return n;
      return {
        ...n,
        trait:  extractSection('Tratto') || n.trait,
        wants:  extractField('Vuole') || n.wants,
        offers: extractField('Offre') || n.offers,
        secret: extractSection('Segreto') || n.secret,
        links:  extractSection('Legami') || n.links,
      };
    });
    App.saveActiveCampaign({ npcs });
    Toast.show('PNG aggiornato dal wiki ✓', 'success');
  }
  else if (tipo === 'luogo') {
    const locations = (camp.locations||[]).map(l => {
      if (l.id !== nota.mondoId) return l;
      return {
        ...l,
        desc: extractSection('Descrizione') || l.desc,
        poi:  extractSection('Punti di Interesse') || l.poi,
        note: extractSection('Note DM') || l.note,
      };
    });
    App.saveActiveCampaign({ locations });
    Toast.show('Luogo aggiornato dal wiki ✓', 'success');
  }
  else if (tipo === 'fazione') {
    const factions = (camp.factions||[]).map(f => {
      if (f.id !== nota.mondoId) return f;
      return {
        ...f,
        obiettivi: extractSection('Obiettivi') || f.obiettivi,
        note:      extractSection('Note DM') || f.note,
      };
    });
    App.saveActiveCampaign({ factions });
    Toast.show('Fazione aggiornata dal wiki ✓', 'success');
  }
};

const _safeRename = (tipo, oldName, newName) => {
  if (!oldName || !newName || oldName === newName) return;
  const camp = App.getActiveCampaign();
  if (!camp?.wiki) return;

  const prefix = tipo === 'npc' ? 'png' : tipo === 'luogo' ? 'luogo' : 'fazione';
  const oldKey = prefix + ':' + oldName;
  const newKey = prefix + ':' + newName;
  const oldLabel = tipo === 'npc' ? '👤 ' : tipo === 'luogo' ? '🗺️ ' : '⚔️ ';

  let count = 0;
  const wiki = camp.wiki;
  ['lore','sessioni'].forEach(sec => {
    (wiki[sec]||[]).forEach(nota => {
      if (!nota.contenuto) return;
      let c = nota.contenuto;
      c = c.split('data-link="'+oldKey+'"').join('data-link="'+newKey+'"');
      c = c.split('[['+oldLabel+oldName+']]').join('[['+oldLabel+newName+']]');
      c = c.split('[['+oldName+']]').join('[['+newName+']]');
      if (c !== nota.contenuto) { nota.contenuto = c; nota.aggiornatoAt = Date.now(); count++; }
    });
  });
  if (count > 0) {
    App.saveActiveCampaign({ wiki });
    Toast.show('🔗 ' + count + ' link aggiornati → "' + newName + '"', 'info', 2500);
  }

};

const npcGetCronologia = (npcId) => {
  const camp = App.getActiveCampaign();
  const wiki = camp?.wiki || {};
  const npc = (camp?.npcs||[]).find(n => n.id === npcId);
  if (!npc) return [];
  const nome = npc.name || npc.nome || '';
  const eventi = [];
  ['lore','sessioni'].forEach(sec => {
    (wiki[sec]||[]).forEach(n => {
      if ((n.contenuto||'').includes('data-link="png:'+nome+'"') ||
          (n.contenuto||'').includes('[[👤 '+nome+']]') ||
          (n.contenuto||'').includes('[['+nome+']]')) {
        eventi.push({ sec, titolo:n.titolo||'Senza titolo', id:n.id, ts:n.aggiornatoAt||0 });
      }
    });
  });
  return eventi.sort((a,b) => b.ts - a.ts);
};

const npcRenderCronologia = (npcId) => {
  const el = document.getElementById('npc-cronologia');
  const wikiBtn = document.getElementById('npc-wiki-link');
  if (!el) return;
  const camp = App.getActiveCampaign();
  const wiki = camp?.wiki || {};
  const wikiNota = (wiki.lore||[]).find(n => n.mondoId === npcId);
  if (wikiBtn) {
    if (wikiNota) {
      wikiBtn.style.display = '';
      const btn = wikiBtn.querySelector('button');
      if (btn) btn.onclick = () => {
        App.navigateTo('wiki');
        setTimeout(() => { WikiDM.switchSection('lore'); WikiDM.openNote(wikiNota.id); }, 200);
      };
    } else {
      wikiBtn.style.display = 'none';
    }
  }
  const eventi = npcGetCronologia(npcId);
  if (!eventi.length) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:0.75rem;padding:4px 0;">Nessuna citazione nelle note wiki.</div>';
    return;
  }
  el.innerHTML = '';
  eventi.forEach(e => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--border);cursor:pointer;';
    const icon = e.sec === 'sessioni' ? '⚔️' : '📚';
    div.innerHTML = '<span>' + icon + '</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (e.titolo||'Senza titolo') + '</span>';
    div.addEventListener('click', () => {
      App.navigateTo('wiki');
      setTimeout(() => { WikiDM.switchSection(e.sec); WikiDM.openNote(e.id); }, 200);
    });
    el.appendChild(div);
  });
};

const _enrichedSearch = (q, camp) => {
  const results = [];
  const query = q.toLowerCase();

  (camp?.npcs||[]).forEach(n => {
    const haystack = [n.name||n.nome, n.alias, n.job, n.race, n.trait, n.secret, n.wants, n.links].filter(Boolean).join(' ').toLowerCase();
    if (haystack.includes(query)) {
      let sub = n.job || n.race || '';

      if ((n.trait||'').toLowerCase().includes(query)) sub = 'Tratto: ' + n.trait.slice(0,40);
      else if ((n.secret||'').toLowerCase().includes(query)) sub = '🔒 Segreto';
      else if ((n.wants||'').toLowerCase().includes(query)) sub = 'Vuole: ' + n.wants.slice(0,40);
      results.push({ tipo:'👤 PNG', nome:n.name||n.nome||'', sub,
        action:() => { Modal.close('global-search'); App.navigateTo('mondo'); setTimeout(()=>NPC.openView(n.id),150); }
      });
    }
  });

  (camp?.locations||[]).forEach(l => {
    const haystack = [l.nome, l.tipo, l.desc, l.note, l.poi].filter(Boolean).join(' ').toLowerCase();
    if (haystack.includes(query)) {
      let sub = l.tipo || '';
      if ((l.desc||'').toLowerCase().includes(query)) sub = l.desc.replace(/<[^>]+>/g,'').slice(0,40);
      results.push({ tipo:'🗺️ Luogo', nome:l.nome||'', sub,
        action:() => { Modal.close('global-search'); App.navigateTo('mondo'); setTimeout(()=>Luoghi.openView(l.id),150); }
      });
    }
  });

  (camp?.factions||[]).forEach(f => {
    const haystack = [f.nome, f.tipo, f.obiettivi, f.note].filter(Boolean).join(' ').toLowerCase();
    if (haystack.includes(query)) {
      let sub = f.tipo || '';
      if ((f.obiettivi||'').toLowerCase().includes(query)) sub = f.obiettivi.replace(/<[^>]+>/g,'').slice(0,40);
      results.push({ tipo:'⚔️ Fazione', nome:f.nome||'', sub,
        action:() => { Modal.close('global-search'); App.navigateTo('mondo'); setTimeout(()=>Fazioni.openView(f.id),150); }
      });
    }
  });

  return results;
};

const npcSetStatus = (id, status) => {
  const camp = App.getActiveCampaign();
  if (!camp) return;
  const npcs = (camp.npcs||[]).map(n => n.id===id ? {...n, status} : n);
  App.saveActiveCampaign({ npcs });
  if (window.NPC) NPC.render();
  Toast.show('Stato aggiornato: ' + status, 'success', 1200);
};

const wikiDuplicaNote = () => {
  const noteId = WikiDM._noteId;
  if (!noteId) return;
  const camp = App.getActiveCampaign();
  const wiki = camp?.wiki || {};
  let nota = null, sec = '';
  for (const s of ['lore','sessioni']) {
    const found = (wiki[s]||[]).find(n => n.id === noteId);
    if (found) { nota = found; sec = s; break; }
  }
  if (!nota) return;
  const now = Date.now();
  const uid = 'n' + now + Math.random().toString(36).slice(2,5);
  const copia = {
    ...nota,
    id: uid,
    titolo: 'Copia di ' + (nota.titolo || 'Senza titolo'),
    creatoAt: now,
    aggiornatoAt: now,
    mondoId: null,
    inCompendio: false,
  };
  if (!wiki[sec]) wiki[sec] = [];
  const idx = wiki[sec].findIndex(n => n.id === noteId);
  wiki[sec].splice(idx + 1, 0, copia);
  App.saveActiveCampaign({ wiki });
  WikiDM.switchSection(sec);
  WikiDM.openNote(uid);
  Toast.show('📄 Nota duplicata', 'success', 1500);
};

const _loadGapi = (clientId) => new Promise((resolve, reject) => {
  if (window.gapi?.auth2) { resolve(); return; }
  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.onload = () => {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      }).then(resolve).catch(reject);
    });
  };
  script.onerror = reject;
  document.head.appendChild(script);
});

const GDriveUI = (() => {
  const syncNow = async () => {
    const camp = App.getActiveCampaign();
    if (!camp) { Toast.show('Nessuna campagna attiva', 'warning'); return; }
    Toast.show('Salvataggio su Drive...', 'info', 2000);
    const ok = await GDrive.save(camp);
    if (ok) {
      Toast.show('✓ Campagna salvata su Drive', 'success', 2000);
    } else {
      Toast.show('Errore salvataggio Drive', 'error');
    }
  };

  const generateInvite = async () => {
    const inp = document.getElementById('gdrive-invite-code');
    const hint = document.getElementById('gdrive-invite-hint');
    if (inp) inp.value = 'Generazione...';
    const result = await GDrive.generateInvite();
    if (result) {
      if (inp) inp.value = result.code;
      if (hint) hint.textContent = '✓ Codice generato — condividilo con il co-autore. È valido finché la campagna è su Drive.';

      try { await navigator.clipboard.writeText(result.code); if (hint) hint.textContent += ' (copiato!)'} catch(e) {}
    } else {
      if (inp) inp.value = '';
      if (hint) hint.textContent = '✗ Errore — salva prima la campagna su Drive.';
    }
  };

  const joinCampaign = async () => {
    const code = document.getElementById('gdrive-join-code')?.value?.trim().toUpperCase();
    if (!code) { Toast.show('Inserisci un codice', 'warning'); return; }
    Toast.show('Accesso alla campagna...', 'info', 2000);
    const campagna = await GDrive.acceptInvite(code);
    if (campagna) {

      if (campagna.id) {

        const existing = Storage.getCampaigns().find(c => c.id === campagna.id);
        if (existing) {

          Storage.updateCampaign(campagna.id, campagna);
          Toast.show('✓ Campagna sincronizzata: ' + campagna.name, 'success', 3000);
        } else {

          Storage.createCampaign(campagna);
          Toast.show('✓ Campagna aggiunta: ' + campagna.name, 'success', 3000);
        }

        try {
          const user = FirebaseSync.getUser?.();
          if (user && !user.isAnonymous) {
            setTimeout(() => {
              FirebaseSync._syncAllCampaignsNow?.(user);
            }, 500);
          }
        } catch(e) {}
        App.init();
        Modal.close('gdrive-options');
      }
    }
  };

  const updateUserInfo = (userInfo) => {
    const el = document.getElementById('gdrive-user-name');
    if (el && userInfo) {
      el.innerHTML = '<strong>' + (userInfo.name||'') + '</strong><br><span style="font-size:0.72rem;color:var(--text-muted);">' + (userInfo.email||'') + '</span>';
    }
  };

  const init = async () => {
    const clientId = localStorage.getItem('dm_gdrive_client_id');
    if (!clientId) return;
    try {
      await _loadGapi(clientId);
      GDrive.init();

      const authInstance = gapi.auth2.getAuthInstance();
      if (authInstance.isSignedIn.get()) {
        const profile = authInstance.currentUser.get().getBasicProfile();
        GDrive._loggedIn = true;
        GDrive._userInfo = { name: profile.getName(), email: profile.getEmail() };
        GDrive._updateBtn();
        updateUserInfo(GDrive._userInfo);
      }
    } catch(e) {
      Debug.warn('GDrive init:', e);
    }
  };

  return { syncNow, generateInvite, joinCampaign, updateUserInfo, init };
})();

const DriveBackup = (() => {
  const FOLDER_NAME = 'DM Toolkit';
  const LS_KEY = 'dm_drive_connected';
  const LS_LAST = 'dm_drive_last_backup';
  let _folderId = null;
  let _connected = false;
  let _gapiReady = false;

  const init = async () => {
    _connected = localStorage.getItem(LS_KEY) === 'true';
    if (_connected) _updateUI();

    if (window.gapi && !_gapiReady) {
      try {
        await _initGapi();
      } catch(e) {}
    }
  };

  const _initGapi = () => new Promise((resolve, reject) => {
    if (_gapiReady) { resolve(); return; }
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: ['AIzaSyBH','SGF0MEYj','wpj9aTe3','Y-CUNldH','giB3yIg'].join(''),
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        _gapiReady = true;
        resolve();
      } catch(e) { reject(e); }
    });
  });

  const connect = async () => {
    try {

      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      const auth = firebase.auth();
      const user = auth.currentUser;

      if (!user) {
        Toast.show('Accedi prima con Google', 'warning');
        return;
      }

      await user.reauthenticateWithPopup(provider);
      const credential = firebase.auth.GoogleAuthProvider.credential(
        user.providerData.find(p => p.providerId === 'google.com')?.idToken
      );

      await _initGapi();
      _connected = true;
      localStorage.setItem(LS_KEY, 'true');
      _updateUI();
      Toast.show('Google Drive collegato — backup automatico attivo', 'success', 3000);
      Modal.close('drive-welcome');

      setTimeout(() => backupNow(), 1000);
    } catch(e) {
      if (e.code === 'auth/popup-closed-by-user') return;

      _connectOAuth();
    }
  };

  const _connectOAuth = () => {

    if (!window.gapi) {
      Toast.show('Caricamento Google API...', 'info', 2000);
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => gapi.load('auth2,client', async () => {
        await gapi.client.init({
          apiKey: ['AIzaSyBH','SGF0MEYj','wpj9aTe3','Y-CUNldH','giB3yIg'].join(''),
          clientId: '',
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          scope: 'https://www.googleapis.com/auth/drive.file',
        });
        _gapiReady = true;
        _connected = true;
        localStorage.setItem(LS_KEY, 'true');
        _updateUI();
        backupNow();
      });
      document.head.appendChild(script);
    }
  };

  const connectFromWelcome = async () => {
    Modal.close('drive-welcome');
    localStorage.setItem('dm_drive_welcome_seen', 'true');

    Settings.open();
    setTimeout(() => connect(), 300);
  };

  const dismissWelcome = () => {
    localStorage.setItem('dm_drive_welcome_seen', 'true');
    Modal.close('drive-welcome');
  };

  const backupNow = async () => {
    if (!_connected) return;
    const camp = App.getActiveCampaign();
    if (!camp) return;

    try {

      if (!_folderId) _folderId = await _getOrCreateFolder();

      const content = JSON.stringify(camp, null, 2);
      const filename = (camp.name||'campagna').replace(/[^a-zA-Z0-9\s]/g,'-').trim() + '.json';

      const existing = await gapi.client.drive.files.list({
        q: `name='${filename}' and '${_folderId}' in parents and trashed=false`,
        fields: 'files(id)',
      });

      if (existing.result.files?.length) {

        await gapi.client.request({
          path: `/upload/drive/v3/files/${existing.result.files[0].id}`,
          method: 'PATCH',
          params: { uploadType: 'media' },
          headers: { 'Content-Type': 'application/json' },
          body: content,
        });
      } else {

        await gapi.client.drive.files.create({
          resource: { name: filename, parents: [_folderId] },
          media: { mimeType: 'application/json', body: content },
        });
      }

      const now = new Date().toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' });
      localStorage.setItem(LS_LAST, now);
      _updateLastBackup(now);

    } catch(e) {
      Debug.warn('Drive backup error:', e.message);
    }
  };

  const _getOrCreateFolder = async () => {

    const res = await gapi.client.drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
    });
    if (res.result.files?.length) return res.result.files[0].id;

    const folder = await gapi.client.drive.files.create({
      resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    });
    return folder.result.id;
  };

  const _updateUI = () => {
    const label = document.getElementById('drive-settings-label');
    const connectBtn = document.getElementById('drive-connect-btn');
    const backupBtn = document.getElementById('drive-backup-now-btn');
    const disconnectBtn = document.getElementById('drive-disconnect-btn');
    const lastBackup = document.getElementById('drive-last-backup');

    if (_connected) {
      if (label) { label.textContent = 'Collegato — cartella "DM Toolkit" su Google Drive'; label.style.color = 'var(--accent-secondary)'; }
      if (connectBtn) connectBtn.style.display = 'none';
      if (backupBtn) backupBtn.style.display = '';
      if (disconnectBtn) disconnectBtn.style.display = '';
      _updateLastBackup(localStorage.getItem(LS_LAST));
    } else {
      if (label) { label.textContent = 'Non collegato'; label.style.color = 'var(--text-muted)'; }
      if (connectBtn) connectBtn.style.display = '';
      if (backupBtn) backupBtn.style.display = 'none';
      if (disconnectBtn) disconnectBtn.style.display = 'none';
      if (lastBackup) lastBackup.textContent = '';
    }
  };

  const _updateLastBackup = (time) => {
    const el = document.getElementById('drive-last-backup');
    if (el && time) el.textContent = 'Ultimo backup: ' + time;
  };

  const disconnect = () => {
    if (!confirm('Scollegare Google Drive? I backup automatici verranno disattivati.')) return;
    _connected = false;
    _folderId = null;
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_LAST);
    _updateUI();
    Toast.show('Google Drive scollegato', 'info');
  };

  const showWelcomeIfNeeded = () => {
    const seen = localStorage.getItem('dm_drive_welcome_seen');
    const connected = localStorage.getItem(LS_KEY) === 'true';
    if (!seen && !connected) {
      setTimeout(() => Modal.open('drive-welcome'), 1500);
    }
  };

  return { init, connect, connectFromWelcome, dismissWelcome, backupNow, disconnect, showWelcomeIfNeeded, _updateUI };
})();

const FirebaseSync = (() => {
  let _app = null;
  let _db  = null;
  let _auth = null;
  let _user = null;
  let _campRef = null;
  let _presenceRef = null;
  let _listening = false;
  let _lastSyncAt = null;
  let _syncTimeout = null;

  const _buildConfig = () => {
    const k = ['AIzaSyBH','SGF0MEYj','wpj9aTe3','Y-CUNldH','giB3yIg'].join('');
    return {
      apiKey: k,
      authDomain: "dm-tollkit.firebaseapp.com",
      databaseURL: "https://dm-tollkit-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "dm-tollkit",
      storageBucket: "dm-tollkit.firebasestorage.app",
      messagingSenderId: "872264957916",
      appId: ["1:872264957916","web","37d3a98932a98c7fc4d919"].join(':')
    };
  };
  const _getConfig = () => {

    try {
      const custom = localStorage.getItem('dm_firebase_config');
      if (custom) return JSON.parse(custom);
    } catch(e) {}
    return _buildConfig();
  };
  const _saveConfig = (cfg) => localStorage.setItem('dm_firebase_config', JSON.stringify(cfg));

  const init = (attempt = 0) => {

    if (typeof firebase === 'undefined') {
      if (attempt < 20) {
        setTimeout(() => init(attempt + 1), 300);
      } else {
        Debug.warn('Firebase SDK non caricato dopo 6 secondi');
      }
      return;
    }

    const cfg = _getConfig();
    if (!cfg) return;

    try {

      if (!firebase.apps.length) {
        _app = firebase.initializeApp(cfg);
      } else {
        _app = firebase.apps[0];
      }
      _db   = firebase.database();
      _auth = firebase.auth();

      const btn = document.getElementById('fb-auth-btn');
      if (btn) btn.style.display = 'flex';

      _auth.onAuthStateChanged(user => {
        _user = user;
        _updateAuthBtn();
        if (user) {
          _onLogin(user);
        } else {
          _onLogout();
        }
      });
    } catch(e) {
      Debug.warn('Firebase init error:', e.message);
    }
  };

  let _mode = localStorage.getItem('dm_auth_mode') || 'local';

  const useLocal = () => {
    _mode = 'local';
    localStorage.setItem('dm_auth_mode', 'local');
    if (_auth && _user?.isAnonymous) _auth.signOut();
    _updateAuthBtn();
    Toast.show('💾 Modalità locale attivata', 'info', 2000);
  };

  const loginAnonymous = async () => {
    if (!_auth) { Modal.open('firebase-setup'); return; }
    try {
      await _auth.signInAnonymously();
      _mode = 'anonymous';
      localStorage.setItem('dm_auth_mode', 'anonymous');
      Toast.show('👤 Accesso anonimo — dati salvati sul cloud', 'success', 2500);
    } catch(e) {
      Toast.show('Errore accesso anonimo: ' + (e.message||''), 'error');
    }
  };

  const loginGoogle = async () => {
    if (!_auth) { Modal.open('firebase-setup'); return; }
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      if (_user?.isAnonymous) {

        await _user.linkWithPopup(provider);
        Toast.show('✓ Account Google collegato — dati mantenuti', 'success');
      } else {
        await _auth.signInWithPopup(provider);
      }
      _mode = 'google';
      localStorage.setItem('dm_auth_mode', 'google');
    } catch(e) {
      if (e.code === 'auth/credential-already-in-use') {

        const provider = new firebase.auth.GoogleAuthProvider();
        await _auth.signInWithPopup(provider);
      } else {
        Toast.show('Login fallito: ' + (e.message||''), 'error');
      }
    }
  };

  const _loginGoogle = loginGoogle;

  const upgradeToGoogle = () => loginGoogle();

  const switchMode = () => {
    Modal.close('collab');
    Modal.open('auth-choice');
  };

  const toggleAuth = () => {
    if (typeof firebase === 'undefined' || !_auth) {

      Toast.show('Connessione in corso...', 'info', 1500);
      init();
      setTimeout(() => toggleAuth(), 1500);
      return;
    }
    if (_user) {
      Modal.open('collab');
      _updateCollabModal();
    } else {
      Modal.open('auth-choice');
    }
  };

  const logout = () => {
    _auth?.signOut();
    Modal.close('collab');
  };

  const _onLogin = (user) => {
    _updateAuthBtn();
    if (user.isAnonymous) {
      Toast.show('Accesso anonimo attivo', 'info', 2000);
    } else {
      Toast.show('Benvenuto ' + (user.displayName||user.email||'').split(' ')[0], 'success', 2000);
      setTimeout(() => { try { DriveBackup.showWelcomeIfNeeded(); } catch(e) {} }, 2000);

      _syncAllCampaigns(user);
    }

    const camp = App.getActiveCampaign();
    if (camp) {
      _startSync(camp.id);
    } else if (!user.isAnonymous) {

      const lastCampId = localStorage.getItem('dm_last_camp_id');
      const lastShareCode = localStorage.getItem('dm_last_share_code');
      if (lastShareCode && _db) {

        _db.ref('campagne/' + lastShareCode + '/data').once('value').then(snap => {
          const remote = snap.val();
          if (remote && remote.id) {
            Storage.saveCampaign(remote);
            App.setActiveCampaign(remote);
            _startSync(remote.id);
            Toast.show('Campagna ripristinata dal cloud', 'success', 3000);
            setTimeout(() => { try { App.renderHomePage(); } catch(e) {} }, 300);
          }
        }).catch(e => Debug.warn('Ripristino campagna fallito:', e.message));
      }
    }
  };

  const _registerCampaignForUser = (camp, key) => {
    if (!_db || !_user || _user.isAnonymous) return;
    const uid = _user.uid;
    _db.ref('utenti/' + uid + '/campagne/' + key).set({
      nome: camp.name || '',
      id: camp.id,
      aggiornatoAt: firebase.database.ServerValue.TIMESTAMP,
    }).catch(e => Debug.warn('Errore registrazione campagna:', e.message));
  };

  const _syncAllCampaigns = async (user) => {
    if (!_db || !user || user.isAnonymous) return;
    const uid = user.uid;

    try {

      const localCamps = Storage.getCampaigns() || [];
      for (const camp of localCamps) {
        const key = camp.shareCode || _campKey(camp.id);

        try {
          const existing = await _db.ref('campagne/' + key + '/data').once('value');
          if (!existing.val()) {

            await _db.ref('campagne/' + key + '/data').set({
              ...camp,
              updatedAt: Date.now(),
              updatedBy: uid,
              updatedByName: user.displayName || user.email,
              ownerId: uid,
            });
          }

          await _db.ref('utenti/' + uid + '/campagne/' + key).set({
            nome: camp.name || '',
            id: camp.id,
            aggiornatoAt: firebase.database.ServerValue.TIMESTAMP,
          });

          localStorage.setItem('dm_last_camp_id', camp.id);
          localStorage.setItem('dm_last_share_code', key);
        } catch(e) {
          Debug.warn('Push campagna locale:', e.message);
        }
      }

      const snap = await _db.ref('utenti/' + uid + '/campagne').once('value');
      const remoteIndex = snap.val() || {};
      const remoteKeys = Object.keys(remoteIndex);

      let downloaded = 0;
      for (const key of remoteKeys) {
        try {
          const campSnap = await _db.ref('campagne/' + key + '/data').once('value');
          const remote = campSnap.val();
          if (!remote || !remote.id) continue;

          const local = Storage.getCampaign(remote.id);
          const remoteTs = remote.updatedAt || 0;
          const localTs  = local?.updatedAt || 0;

          if (!local) {

            Storage.saveCampaign(remote);
            downloaded++;
          } else if (remoteTs > localTs) {

            Storage.saveCampaign(remote);
            downloaded++;
          }
        } catch(e) {
          Debug.warn('Download campagna remota:', e.message);
        }
      }

      if (downloaded > 0) {
        Toast.show(downloaded + ' campagna' + (downloaded > 1 ? 'e' : '') + ' caricata dal cloud', 'success', 3000);
        setTimeout(() => { try { App.renderHomePage(); } catch(e) {} }, 400);
      } else if (localCamps.length > 0) {
        Toast.show('Campagne sincronizzate con il cloud', 'success', 2000);
      }
    } catch(e) {
      Debug.warn('Errore syncAllCampaigns:', e.message);
    }
  };

  const _onLogout = () => {
    _stopSync();
    _updateAuthBtn();
    const presence = document.getElementById('fb-presence');
    if (presence) presence.style.display = 'none';
  };

  const _updateAuthBtn = () => {
    const btn   = document.getElementById('fb-auth-btn');
    const icon  = document.getElementById('fb-auth-icon');
    const label = document.getElementById('fb-auth-label');
    if (!btn) return;
    if (_user?.isAnonymous) {
      if (icon) icon.textContent = '👤';
      if (label) label.textContent = 'Anonimo';
      btn.style.borderColor = 'var(--border-strong)';
      btn.style.color = 'var(--text-muted)';
    } else if (_user) {
      if (icon) icon.textContent = '🔑';
      if (label) label.textContent = (_user.displayName||_user.email||'').split(' ')[0];
      btn.style.borderColor = 'var(--accent-secondary)';
      btn.style.color = 'var(--accent-secondary)';
    } else {
      if (icon) icon.textContent = '☁️';
      if (label) label.textContent = 'Accedi';
      btn.style.borderColor = 'var(--border)';
      btn.style.color = 'var(--text-muted)';
    }
  };

  const _campKey = (campId) => {

    const camp = App.getActiveCampaign?.();
    if (camp?.shareCode) return camp.shareCode;

    return campId.replace(/[^a-zA-Z0-9]/g,'').slice(-6).toUpperCase() || 'CAMP01';
  };

  const _startSync = (campId) => {
    if (!_db || !_user) return;
    _stopSync();

    const camp = App.getActiveCampaign?.();
    const key = camp?.shareCode || _campKey(campId);
    _campRef = _db.ref('campagne/' + key);
    _presenceRef = _db.ref('campagne/' + key + '/presenza/' + _user.uid);

    _presenceRef.set({
      nome: _user.displayName || _user.email,
      foto: _user.photoURL || null,
      online: true,
      at: firebase.database.ServerValue.TIMESTAMP,
    });

    if (camp) {
      _registerCampaignForUser(camp, key);

      localStorage.setItem('dm_last_camp_id', camp.id);
      localStorage.setItem('dm_last_share_code', key);
    }

    _presenceRef.onDisconnect().remove();

    _db.ref('campagne/' + key + '/presenza').on('value', snap => {
      const presence = snap.val() || {};
      _renderPresence(presence);
    });

    _campRef.child('data').on('value', snap => {
      const remote = snap.val();
      if (!remote) return;
      if (remote.updatedAt <= (_lastSyncAt || 0)) return;

      if (remote.updatedBy === _user.uid) return;

      _mergeRemote(remote);
    });

    _listening = true;
    _updateSyncStatus('In ascolto...');
  };

  const _stopSync = () => {
    if (_campRef) { _campRef.off(); _campRef = null; }
    if (_presenceRef) { _presenceRef.remove(); _presenceRef = null; }
    _listening = false;
  };

  const push = (camp) => {
    if (!_db || !_user || !_campRef) return;

    if (!_user.isAnonymous) {
      const key = camp?.shareCode || _campKey(camp?.id || '');
      _registerCampaignForUser(camp, key);
      localStorage.setItem('dm_last_camp_id', camp?.id || '');
      localStorage.setItem('dm_last_share_code', key);
    }

    if (_syncTimeout) clearTimeout(_syncTimeout);
    _syncTimeout = setTimeout(async () => {
      try {
        await _campRef.child('data').set({
          ...camp,
          updatedAt: firebase.database.ServerValue.TIMESTAMP,
          updatedBy: _user.uid,
          updatedByName: _user.displayName || _user.email,
        });
        _lastSyncAt = Date.now();
        _updateSyncStatus('Sync: ' + new Date().toLocaleTimeString('it-IT'));
      } catch(e) {
        Debug.warn('Firebase push error:', e.message);
      }
    }, 2000);
  };

  const syncNow = () => {
    const camp = App.getActiveCampaign();
    if (!camp) return;
    if (!_user) { Toast.show('Accedi prima', 'warning'); return; }
    if (!_campRef) { _startSync(camp.id); }
    push(camp);
    Toast.show('☁️ Sync inviata', 'success', 1500);
  };

  const _mergeRemote = (remote) => {
    const local = App.getActiveCampaign();

    if (!local && remote && remote.id) {
      Storage.saveCampaign(remote);
      App.setActiveCampaign(remote);
      Toast.show('Campagna caricata dal cloud', 'success', 2000);
      setTimeout(() => { try { App.renderHomePage(); } catch(e) {} }, 300);
      return;
    }
    if (!local || local.id !== remote.id) return;

    const merged = { ...local };

    if (remote.wiki) {
      const localWiki = local.wiki || {};
      ['lore','sessioni'].forEach(sec => {
        const remNotes = remote.wiki[sec] || [];
        const locNotes = localWiki[sec] || [];
        const noteMap = {};
        locNotes.forEach(n => noteMap[n.id] = n);
        remNotes.forEach(n => {
          if (!noteMap[n.id] || (n.aggiornatoAt||0) > (noteMap[n.id].aggiornatoAt||0)) {
            noteMap[n.id] = n;
          }
        });
        merged.wiki = merged.wiki || {};
        merged.wiki[sec] = Object.values(noteMap).sort((a,b) => (b.aggiornatoAt||0)-(a.aggiornatoAt||0));
      });
    }

    if (remote.npcs) {
      const locMap = {};
      (local.npcs||[]).forEach(n => locMap[n.id] = n);
      (remote.npcs||[]).forEach(n => {
        if (!locMap[n.id]) locMap[n.id] = n;

      });
      merged.npcs = Object.values(locMap);
    }

    App.saveActiveCampaign(merged);
    _lastSyncAt = Date.now();

    const nome = remote.updatedByName || 'Co-autore';
    Toast.show('📥 ' + nome + ' ha salvato modifiche', 'info', 2500);
    _updateSyncStatus('Ricevuto da ' + nome + ' · ' + new Date().toLocaleTimeString('it-IT'));
  };

  const _renderPresence = (presence) => {
    const bar = document.getElementById('fb-presence');
    if (!bar) return;
    const others = Object.entries(presence)
      .filter(([uid]) => uid !== _user?.uid && uid !== 'data')
      .map(([, v]) => v);
    if (!others.length) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    bar.innerHTML = others.map(u =>
      '<span style="display:inline-flex;align-items:center;gap:3px;" title="' + (u.nome||'Co-autore') + ' è online">' +
      '<span style="width:7px;height:7px;background:#69cc85;border-radius:50%;"></span>' +
      '<span style="font-size:0.72rem;">' + (u.nome||'Co-autore').split(' ')[0] + '</span>' +
      '</span>'
    ).join(' · ');
  };

  const getCampCode = () => {
    const camp = App.getActiveCampaign();
    if (!camp) return null;

    if (!camp.shareCode) {

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      camp.shareCode = code;
      App.saveActiveCampaign({ shareCode: code });
    }
    return camp.shareCode;
  };

  const copyCode = () => {
    const code = getCampCode();
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => Toast.show('Codice copiato!', 'success', 1500));
  };

  const joinCampaign = async () => {
    const raw = document.getElementById('collab-join-code')?.value?.trim().toUpperCase();
    const code = raw?.replace(/[^A-Z0-9]/g,'');
    if (!code || code.length < 4) { Toast.show('Inserisci il codice a 6 caratteri', 'warning'); return; }
    if (!_user) { Toast.show('Accedi prima con Google o email', 'warning'); return; }
    if (!_db) { Toast.show('Firebase non disponibile', 'error'); return; }
    try {
      Toast.show('Ricerca campagna...', 'info', 1500);

      const snap = await _db.ref('campagne/' + code + '/data').get();
      const remote = snap.val();
      if (!remote) {
        Toast.show('Codice non trovato — verifica le maiuscole e riprova', 'error', 3000);
        return;
      }

      const existing = Storage.getCampaigns?.()?.find(c => c.shareCode === code || c.id === remote.id);
      if (existing) {
        App.saveActiveCampaign({ ...remote, id: existing.id });
        Toast.show('Campagna sincronizzata: ' + (remote.name||''), 'success');
      } else {
        const newId = remote.id || ('collab_' + Date.now());
        const newCamp = { ...remote, id: newId, shareCode: code };
        try { Storage.createCampaign(newCamp); } catch(e) { Storage.updateCampaign?.(newId, newCamp); }
        Toast.show('Campagna aggiunta: ' + (remote.name||code), 'success');
        setTimeout(() => App.init?.(), 300);
      }
      Modal.close('collab');
      _startSync(remote.id || code);
    } catch(e) {
      Toast.show('Errore: ' + (e.message||'Riprova'), 'error');
    }
  };

  const _updateCollabModal = () => {
    if (!_user) return;
    const nameEl    = document.getElementById('collab-user-name');
    const emailEl   = document.getElementById('collab-user-email');
    const photoEl   = document.getElementById('collab-user-photo');
    const placEl    = document.getElementById('collab-user-placeholder');
    const codeEl    = document.getElementById('collab-camp-code');
    const upgradeEl = document.getElementById('collab-upgrade-section');

    if (_user.isAnonymous) {
      if (nameEl)  nameEl.textContent  = 'Utente anonimo';
      if (emailEl) emailEl.textContent = 'Nessun account collegato';
      if (upgradeEl) upgradeEl.style.display = '';

      const codeSection = codeEl?.closest('div[style*="border-top"]');
    } else {
      if (nameEl)  nameEl.textContent  = _user.displayName || '';
      if (emailEl) emailEl.textContent = _user.email || '';
      if (upgradeEl) upgradeEl.style.display = 'none';
      if (_user.photoURL && photoEl) {
        photoEl.src = _user.photoURL;
        photoEl.style.display = '';
        if (placEl) placEl.style.display = 'none';
      }
    }
    if (codeEl) {
      const code = getCampCode();
      codeEl.textContent = _user.isAnonymous ? '(accedi con Google per collaborare)' : (code || '(salva una campagna)');
    }
  };

  const _updateSyncStatus = (msg) => {
    const el = document.getElementById('collab-last-sync');
    if (el) el.textContent = msg;
  };

  const saveConfig = () => {
    const raw = document.getElementById('fb-config-input')?.value?.trim();
    if (!raw) { Toast.show('Incolla la configurazione Firebase', 'warning'); return; }
    try {

      const cfg = new Function('return (' + raw + ')')();
      if (!cfg.apiKey || !cfg.databaseURL) {
        Toast.show('Config non valida — assicurati di includere apiKey e databaseURL', 'error');
        return;
      }
      _saveConfig(cfg);
      Modal.close('firebase-setup');
      Toast.show('Config salvata — ricarica la pagina per attivare Firebase', 'success', 4000);
    } catch(e) {
      Toast.show('Errore nel formato config: ' + e.message, 'error');
    }
  };

  const onCampagnaSaved = (camp) => {
    if (_user && _campRef) push(camp);
  };

  const onCampagnaActivated = (campId) => {
    if (_user && campId) _startSync(campId);
  };

  const loginEmail = async () => {
    const email    = document.getElementById('auth-email')?.value?.trim();
    const password = document.getElementById('auth-password')?.value;
    const errEl    = document.getElementById('auth-email-error');
    if (!email || !password) {
      if (errEl) { errEl.textContent = 'Inserisci email e password.'; errEl.style.display=''; }
      return;
    }
    if (!_auth) return;
    try {
      await _auth.signInWithEmailAndPassword(email, password);
      _mode = 'google';
      localStorage.setItem('dm_auth_mode', 'google');
      Modal.close('auth-choice');
    } catch(e) {
      const msg = e.code === 'auth/user-not-found' ? 'Account non trovato — registrati prima.'
                : e.code === 'auth/wrong-password'  ? 'Password errata.'
                : e.code === 'auth/invalid-email'   ? 'Email non valida.'
                : e.message;
      if (errEl) { errEl.textContent = msg; errEl.style.display=''; }
    }
  };

  const registerEmail = async () => {
    const email    = document.getElementById('auth-email')?.value?.trim();
    const password = document.getElementById('auth-password')?.value;
    const errEl    = document.getElementById('auth-email-error');
    if (!email || !password) {
      if (errEl) { errEl.textContent = 'Inserisci email e password.'; errEl.style.display=''; }
      return;
    }
    if (password.length < 6) {
      if (errEl) { errEl.textContent = 'La password deve avere almeno 6 caratteri.'; errEl.style.display=''; }
      return;
    }
    if (!_auth) return;
    try {
      if (_user?.isAnonymous) {

        const credential = firebase.auth.EmailAuthProvider.credential(email, password);
        await _user.linkWithCredential(credential);
      } else {
        await _auth.createUserWithEmailAndPassword(email, password);
      }
      _mode = 'google';
      localStorage.setItem('dm_auth_mode', 'google');
      Modal.close('auth-choice');
      Toast.show('✓ Account creato — benvenuto!', 'success');
    } catch(e) {
      const msg = e.code === 'auth/email-already-in-use' ? 'Email già in uso — prova ad accedere.'
                : e.code === 'auth/invalid-email'        ? 'Email non valida.'
                : e.code === 'auth/weak-password'        ? 'Password troppo debole.'
                : e.message;
      if (errEl) { errEl.textContent = msg; errEl.style.display=''; }
    }
  };

  return {
    init, toggleAuth, logout, saveConfig,
    loginAnonymous, loginGoogle, loginEmail, registerEmail,
    useLocal, upgradeToGoogle, switchMode,
    syncNow, push, onCampagnaSaved, onCampagnaActivated,
    getCampCode, copyCode, joinCampaign,
  };
})();
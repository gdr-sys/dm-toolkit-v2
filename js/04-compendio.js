const Compendio = (() => {

  const _data = { monsters: [], magic_items: [], equipment: [], rules: [], spells: [] };

  let _loaded = false;
  let _loading = false;
  let _activeTab = 'monsters';
  let _searchTimer = null;
  let _sistema = '5e2024';

  const SISTEMA_FILES = {
    '5e2024': {
      monsters:    'srd_5_2_1_monsters.json',
      magic_items: 'srd_5_2_1_magic_items.json',
      equipment:   'srd_5_2_1_equipment.json',
      rules:       'srd_5_2_1_rules.json',
      spells:      'srd_5_2_1_spells.json',
      dm_screen:   'dm_screen_2024.json',
    },
    '5e2014': {
      monsters:    'srd_5_1_monsters.json',
      magic_items: 'srd_5_1_magic_items.json',
      equipment:   'srd_5_1_equipment.json',
      rules:       'srd_5_1_rules.json',
      spells:      'srd_5_1_spells.json',
      dm_screen:   'dm_screen_2014.json',
    },
  };

  const getSistema = () => {
    const camp = App.getActiveCampaign();
    if (camp?.system === '5e2014') return '5e2014';
    return '5e2024';
  };

  const changeSistema = (sistema) => {
    if (_sistema === sistema) return;
    _sistema = sistema;
    _loaded = false;
    _data.monsters = [];
    _data.magic_items = [];
    _data.equipment = [];
    _data.rules = [];
    _data.spells = [];
    load();
    Debug.log(`Compendio: sistema cambiato → ${sistema}`);
  };

  const _filters = {
    monsters:    { q: '', tipo: '', gs_min: '', gs_max: '' },
    magic_items: { q: '', tipo_base: '', rarita: '' },
    equipment:   { q: '', tipo: '', categoria: '' },
    rules:       { q: '', categoria: '' },
    spells:      { q: '', livello: '', scuola: '', rituale: '' },
    homebrew:    { q: '', categoria: '' },
    cerca:       { q: '' },
  };

  const gsDisplay = (m) => {
    const gs = m.grado_sfida;
    if (!gs) return '?';
    const v = gs.valore;
    if (v === 0.125) return '1/8';
    if (v === 0.25)  return '1/4';
    if (v === 0.5)   return '1/2';
    if (v === null || v === undefined) return '?';
    return String(Number.isInteger(v) ? v : parseFloat(v));
  };

  const gsNumeric = (m) => {
    const gs = m.grado_sfida;
    if (!gs || gs.valore === null || gs.valore === undefined) return -1;
    return parseFloat(gs.valore);
  };

  const tipoPrincipale = (t) => (t || '').split('(')[0].trim();

  const normalizzaRarita = (r) => {
    r = (r || '').toLowerCase().trim();
    if (r.includes('leggend'))   return 'leggendaria';
    if (r.includes('molto rar')) return 'molto rara';
    if (r.includes('rar'))       return 'rara';
    if (r.includes('non comune'))return 'non comune';
    if (r.includes('comune'))    return 'comune';
    if (r.includes('manufatto')) return 'manufatto';
    return 'variabile';
  };

  const raritaOrder = { comune: 0, 'non comune': 1, rara: 2, 'molto rara': 3, leggendaria: 4, manufatto: 5, variabile: 6 };
  const raritaBadge = { comune: 'badge-muted', 'non comune': 'badge-success', rara: 'badge-blue', 'molto rara': 'badge-primary', leggendaria: 'badge-gold', manufatto: 'badge-warning', variabile: 'badge-muted' };

  const modStr = (v) => {
    const m = Math.floor((parseInt(v || 10) - 10) / 2);
    return (m >= 0 ? '+' : '') + m;
  };

  const highlight = (text, q) => {
    if (!q || !text) return text || '';
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return String(text).replace(re, '<mark style="background:var(--accent-secondary);color:#fff;border-radius:2px;padding:0 2px;">$1</mark>');
  };

  const load = async () => {
    if (_loaded || _loading) return;
    _loading = true;
    showLoading(true);
    _sistema = getSistema();
    const sistemaFiles = SISTEMA_FILES[_sistema] || SISTEMA_FILES['5e2024'];
    Debug.log(`Compendio: caricamento ${_sistema}...`);

    const badge = document.getElementById('comp-sistema-badge');
    if (badge) badge.textContent = _sistema === '5e2014' ? '5e (2014)' : '5.5e (2024)';

    const sel = document.getElementById('comp-sistema-select');
    if (sel) sel.value = _sistema;

    try {
      const base = 'data/';
      const files = [
        ['monsters',    sistemaFiles.monsters],
        ['magic_items', sistemaFiles.magic_items],
        ['equipment',   sistemaFiles.equipment],
        ['rules',       sistemaFiles.rules],
        ['spells',      sistemaFiles.spells],
      ].filter(([, f]) => f);

      for (const [key, file] of files) {
        try {
          const r = await fetch(base + file);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          _data[key] = await r.json();
          Debug.log(`Compendio: ${key} caricato (${_data[key].length} voci)`);
          if (key === 'spells') Toast.show(`Incantesimi: ${_data[key].length} caricati`, 'success', 3000);
        } catch (e) {
          Debug.error(`Compendio: errore caricamento ${file}:`, e.message);
          if (key === 'spells') Toast.show(`Errore spells: ${file} — ${e.message}`, 'error', 6000);
          _data[key] = [];
        }
      }

      if (sistemaFiles.dm_screen) {
        try {
          const r = await fetch(base + sistemaFiles.dm_screen);
          if (r.ok) {
            const data = await r.json();
            _data.rules = [..._data.rules, ...data];
            Debug.log(`Compendio: dm_screen aggiunto (${data.length} regole)`);
          }
        } catch (e) { /* skip */ }
      }

      const _parseGS = (raw) => {
        if (raw === '1/8' || raw === 0.125) return 0.125;
        if (raw === '1/4' || raw === 0.25) return 0.25;
        if (raw === '1/2' || raw === 0.5)  return 0.5;
        const n = parseFloat(raw);
        return isNaN(n) ? null : n;
      };
      const _gsRaw = (v) => {
        if (v === 0.125) return '1/8';
        if (v === 0.25)  return '1/4';
        if (v === 0.5)   return '1/2';
        return v != null ? String(v) : '?';
      };
      _data.monsters.forEach(m => {
        try {

        if (!m.grado_sfida) {

          const cr = m.challenge_rating ?? m.cr ?? m.grado_sfida_val;
          const val = _parseGS(cr);
          m.grado_sfida = { valore: val, raw: _gsRaw(val) };
        } else {

          const rawSrc = m.grado_sfida.raw || m.grado_sfida.testo || m.grado_sfida.valore;
          const val = _parseGS(rawSrc);
          m.grado_sfida.valore = val;
          m.grado_sfida.raw = _gsRaw(val);
        }

        if (!m.punti_ferita && m.hit_points != null) {
          m.punti_ferita = { media: m.hit_points, dado: m.hit_dice || '' };
        }

        if (!m.classe_armatura && m.armor_class != null) {
          m.classe_armatura = typeof m.armor_class === 'object'
            ? (m.armor_class[0]?.value || m.armor_class) : m.armor_class;
        }

        if (!m.nome && m.name) m.nome = m.name;
        } catch(e) { Debug.warn('Normalizzazione mostro fallita:', e.message); }
      });

      _data.magic_items.forEach(i => {
        i._rarita_norm = normalizzaRarita(i.rarita);
      });

      _loaded = true;
      buildFilterOptions();
      render();
    } catch (e) {
      Debug.error('Compendio load:', e.message);
      Toast.show('Errore caricamento compendio', 'error');
    } finally {
      _loading = false;
      showLoading(false);
    }
  };

  const showLoading = (on) => {
    const el = document.getElementById('comp-loading');
    const content = document.getElementById('comp-content');
    if (el) el.style.display = on ? 'flex' : 'none';
    if (content) content.style.display = on ? 'none' : 'block';
  };

  const buildFilterOptions = () => {

    const tipiMostri = [...new Set(_data.monsters.map(m => tipoPrincipale(m.tipo)))].sort();
    fillSelect('comp-filter-tipo-monsters', tipiMostri, 'Tutti i tipi');

    const gsVals = [...new Set(_data.monsters.map(gsDisplay))].filter(v => v !== '?');
    const gsOrder = { '0': 0, '1/8': 0.125, '1/4': 0.25, '1/2': 0.5 };
    const gsSorted = gsVals.sort((a, b) => {
      const na = gsOrder[a] !== undefined ? gsOrder[a] : parseFloat(a);
      const nb = gsOrder[b] !== undefined ? gsOrder[b] : parseFloat(b);
      return na - nb;
    });
    fillSelect('comp-filter-gs-min', ['0', '1/8', '1/4', '1/2', ...gsSorted.filter(v => !['0','1/8','1/4','1/2'].includes(v))], 'GS min', false);
    fillSelect('comp-filter-gs-max', ['0', '1/8', '1/4', '1/2', ...gsSorted.filter(v => !['0','1/8','1/4','1/2'].includes(v))], 'GS max', false);

    const tipiMagic = [...new Set(_data.magic_items.map(i => i.tipo_base || ''))].filter(Boolean).sort();
    fillSelect('comp-filter-tipo-magic', tipiMagic, 'Tutti i tipi');

    const catEquip = [...new Set(_data.equipment.map(e => e.categoria || ''))].filter(Boolean).sort();
    fillSelect('comp-filter-cat-equip', catEquip, 'Tutte le categorie');

    const tipiEquip = [...new Set(_data.equipment.map(e => e.tipo || ''))].filter(Boolean).sort();
    fillSelect('comp-filter-tipo-equip', tipiEquip, 'Tutti i tipi');

    const catRules = [...new Set(_data.rules.map(r => r.categoria || ''))].filter(Boolean).sort();
    fillSelect('comp-filter-cat-rules', catRules, 'Tutte le categorie');
  };

  const fillSelect = (id, options, placeholder, withEmpty = true) => {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = withEmpty ? `<option value="">${placeholder}</option>` : `<option value="">${placeholder}</option>`;
    options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      el.appendChild(o);
    });
    el.value = cur;
  };

  const switchTab = (tab) => {
    _activeTab = tab;
    const tabKeys = ['monsters', 'magic_items', 'equipment', 'rules', 'spells', 'homebrew', 'cerca', 'velocita'];
    const countIds = { monsters: 'comp-count-monsters', magic_items: 'comp-count-magic', equipment: 'comp-count-equip', rules: 'comp-count-rules', spells: 'comp-count-spells', homebrew: 'comp-count-homebrew', cerca: 'comp-count-cerca', velocita: '' };
    tabKeys.forEach(t => {
      document.getElementById(`comp-tab-${t}`)?.classList.toggle('active', t === tab);
      document.getElementById(`comp-panel-${t}`)?.classList.toggle('active', t === tab);
      document.getElementById(`comp-filters-${t}`)?.classList.toggle('hidden', t !== tab);
      const countEl = document.getElementById(countIds[t]);
      if (countEl) countEl.style.display = t === tab ? '' : 'none';
    });
    if (!_loaded && tab !== 'homebrew' && tab !== 'cerca' && tab !== 'velocita') { load(); return; }
    if (tab === 'cerca') {
      setTimeout(() => document.getElementById('comp-search-cerca')?.focus(), 100);
    }
    if (tab === 'velocita') {

      searchVelocita();
      return;
    }
    render();
    Debug.log(`Compendio tab: ${tab}`);
  };

  const onSearch = (tab) => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
      _filters[tab].q = document.getElementById(`comp-search-${tab}`)?.value?.trim() || '';
      render();
    }, 200);
  };

  const onFilter = (tab, field, value) => {
    _filters[tab][field] = value;
    render();
  };

  const render = () => {
    switch (_activeTab) {
      case 'monsters':    renderMonsters(); break;
      case 'magic_items': renderMagicItems(); break;
      case 'equipment':   renderEquipment(); break;
      case 'rules':       renderRules(); break;
      case 'spells':      renderSpells(); break;
      case 'homebrew':    renderHomebrew(); break;
      case 'cerca':       renderCercaTutto(); break;
    }
  };

  const _getFavoriti = () => {
    const camp = App.getActiveCampaign();
    return camp?.compendioFavoriti || [];
  };

  const _isFavorito = (id) => _getFavoriti().some(f => f.id === id);

  const toggleFavorito = (id, nome, tipo, event) => {
    if (event) event.stopPropagation();
    const camp = App.getActiveCampaign();
    if (!camp) return;
    let favoriti = [..._getFavoriti()];
    const idx = favoriti.findIndex(f => f.id === id);
    if (idx !== -1) {
      favoriti.splice(idx, 1);
      Toast.show(`${nome} rimosso dai preferiti`, 'info', 2000);
    } else {
      favoriti.push({ id, nome, tipo });
      Toast.show(`⭐ ${nome} aggiunto ai preferiti`, 'success', 2000);
    }
    App.saveActiveCampaign({ compendioFavoriti: favoriti });

    const btn = document.querySelector(`.comp-fav-btn[data-id="${id}"]`);
    if (btn) btn.innerHTML = idx !== -1
      ? `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
      : `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="var(--accent-secondary)" stroke="var(--accent-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

    if (_activeTab === 'favoriti') render();

    if (window.Schermo) Schermo._refreshFavoriti?.();
    Debug.log(`Favoriti: ${idx !== -1 ? 'rimosso' : 'aggiunto'} ${nome}`);
  };

  const favBtn = (id, nome, tipo) => {
    const isFav = _isFavorito(id);
    const starSvg = isFav
      ? `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="var(--accent-secondary)" stroke="var(--accent-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
      : `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    return `<button class="comp-fav-btn btn btn-ghost btn-icon-sm" data-id="${id}"
      onclick="Compendio.toggleFavorito('${id}','${nome.replace(/'/g,"\'")}','${tipo}',event)"
      title="${isFav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}"
      style="padding:0 4px;">${starSvg}</button>`;
  };

  const renderFavoritiSection = (tipo) => {

    const favs = _getFavoriti().filter(f => f.tipo === tipo || f.tipo === 'homebrew' && _getHomebrew().some(h => h.id === f.id && h.categoria === tipo));
    if (!favs.length) return '';
    const openFn = {
      monsters: 'openMonster', magic_items: 'openMagicItem',
      equipment: 'openEquipment', rules: 'openRule', spells: 'openSpell',
      homebrew: 'openHomebrew', velocita: null,
    }[tipo] || 'openMonster';

    const favRows = favs.map(f => {
      const isHb = f.tipo === 'homebrew';
      const fn = isHb ? 'openHomebrew' : openFn;
      return `
        <div class="comp-row comp-row-fav" onclick="Compendio.${fn}('${f.id}')">
          <div class="comp-row-main">
            <span class="comp-row-name">${f.nome}${isHb ? ' <span style="font-size:0.6rem;color:var(--accent-secondary);">HB</span>' : ''}</span>
          </div>
          <div class="comp-row-stats">
            ${favBtn(f.id, f.nome, f.tipo)}
          </div>
        </div>`;
    }).join('');

    const hasContent = favRows;
    if (!hasContent) return '';
    return `<div class="comp-cat-header" style="color:var(--accent-secondary);">⭐ Preferiti</div>` +
      favRows +
      `<div style="height:1px;background:var(--border);margin:6px 0 8px;"></div>`;
  };

  const renderMonsters = () => {
    const el = document.getElementById('comp-list-monsters');
    if (!el) return;
    const f = _filters.monsters;
    const q = f.q.toLowerCase();

    const gsToNum = (s) => {
      if (!s) return -1;
      if (s === '1/8') return 0.125;
      if (s === '1/4') return 0.25;
      if (s === '1/2') return 0.5;
      return parseFloat(s);
    };

    let list = _data.monsters.filter(m => {
      if (q && !m.nome.toLowerCase().includes(q) && !tipoPrincipale(m.tipo).toLowerCase().includes(q)) return false;
      if (f.tipo && tipoPrincipale(m.tipo) !== f.tipo) return false;
      const gs = gsNumeric(m);
      if (f.gs_min && gs < gsToNum(f.gs_min)) return false;
      if (f.gs_max && gs > gsToNum(f.gs_max)) return false;
      return true;
    });

    list.sort((a, b) => {
      const ga = gsNumeric(a), gb = gsNumeric(b);
      if (ga !== gb) return ga - gb;
      return a.nome.localeCompare(b.nome, 'it');
    });

    const count = document.getElementById('comp-count-monsters');
    if (count) count.textContent = `${list.length} mostri`;

    const hbMonsters = _getHomebrew().filter(h => h.categoria === 'monsters' &&
      (!q || h.nome.toLowerCase().includes(q)));
    const hbRows = hbMonsters.map(h => ({
      _hb: true, id: h.id, nome: h.nome,
      gs: h.gs ?? h.grado_sfida?.valore ?? null,
      pf: h.pf ?? h.punti_ferita?.media ?? null,
      ca: h.ca ?? h.classe_armatura ?? null,
      tipo: h.tipo || 'Homebrew', dimensione: h.dimensione || '',
    }));

    const combined = [...list.map(m => ({
      _hb: false, id: m.id, nome: m.nome,
      gs: gsNumeric(m), gsDisplay: gsDisplay(m),
      pf: m.punti_ferita?.media || '?', ca: m.classe_armatura || '?',
      tipo: tipoPrincipale(m.tipo), dimensione: m.dimensione || '',
    })), ...hbRows].sort((a, b) => {
      const ga = a._hb ? (parseFloat(a.gs) || -1) : a.gs;
      const gb = b._hb ? (parseFloat(b.gs) || -1) : b.gs;
      if (ga !== gb) return ga - gb;
      return a.nome.localeCompare(b.nome, 'it');
    });

    if (combined.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🐉</div><h3>Nessun mostro trovato</h3><p class="text-muted">Prova a modificare i filtri</p></div>`;
      if (count) count.textContent = '0 mostri';
      return;
    }
    if (count) count.textContent = `${combined.length} mostri`;

    el.innerHTML = renderFavoritiSection('monsters') + combined.map(m => {
      const gs = m._hb ? (m.gs ?? '?') : m.gsDisplay;
      const pf = m._hb ? (m.pf ?? '?') : m.pf;
      const ca = m._hb ? (m.ca ?? '?') : m.ca;
      const openFn = m._hb ? `Compendio.openHomebrew('${m.id}')` : `Compendio.openMonster('${m.id}')`;
      return `
        <div class="comp-row" onclick="${openFn}">
          <div class="comp-row-main">
            <span class="comp-row-name">${highlight(m.nome, f.q)}${m._hb ? ' <span style="font-size:0.6rem;color:var(--accent-secondary);">HB</span>' : ''}</span>
            <span class="comp-row-meta">${highlight(m.tipo, f.q)} · ${m.dimensione}</span>
          </div>
          <div class="comp-row-stats">
            <span class="comp-stat-pill" title="Grado Sfida">GS ${gs}</span>
            <span class="comp-stat-pill" title="Punti Ferita">PF ${pf}</span>
            <span class="comp-stat-pill" title="Classe Armatura">CA ${ca}</span>
            ${favBtn(m.id, m.nome, m._hb ? 'homebrew' : 'monsters')}
          </div>
        </div>`;
    }).join('');
  };

  const renderMagicItems = () => {
    const el = document.getElementById('comp-list-magic');
    if (!el) return;
    const f = _filters.magic_items;
    const q = f.q.toLowerCase();

    let list = _data.magic_items.filter(i => {
      if (q && !i.nome.toLowerCase().includes(q) && !(i.tipo_base || '').toLowerCase().includes(q)) return false;
      if (f.tipo_base && i.tipo_base !== f.tipo_base) return false;
      if (f.rarita && i._rarita_norm !== f.rarita) return false;
      return true;
    });

    list.sort((a, b) => {
      const ra = raritaOrder[a._rarita_norm] ?? 99;
      const rb = raritaOrder[b._rarita_norm] ?? 99;
      if (ra !== rb) return ra - rb;
      return a.nome.localeCompare(b.nome, 'it');
    });

    const count = document.getElementById('comp-count-magic');
    if (count) count.textContent = `${list.length} oggetti`;

    if (list.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✨</div><h3>Nessun oggetto trovato</h3></div>`;
      return;
    }

    el.innerHTML = (() => {

    const hbMagic = _getHomebrew().filter(h => h.categoria === 'magic_items' &&
      (!q || h.nome.toLowerCase().includes(q)));
    const hbMagicMapped = hbMagic.map(h => ({
      _hb: true, id: h.id, nome: h.nome,
      tipo_base: h.tipo_base || h.sottotitolo || 'Homebrew',
      _rarita_norm: normalizzaRarita(h.rarita || ''),
      richiede_sintonia: h.richiede_sintonia || false,
    }));
    const allMagic = [...list.map(i => ({...i, _hb:false})), ...hbMagicMapped]
      .sort((a,b) => {
        const ra = raritaOrder[a._rarita_norm]??99, rb = raritaOrder[b._rarita_norm]??99;
        if (ra!==rb) return ra-rb;
        return a.nome.localeCompare(b.nome,'it');
      });
    if (count) count.textContent = allMagic.length + ' oggetti';
    return renderFavoritiSection('magic_items') + allMagic.map(i => {
      const openFn = i._hb ? 'Compendio.openHomebrew(\'' + i.id + '\')' : 'Compendio.openMagicItem(\'' + i.id + '\')';
      return '<div class="comp-row" onclick="' + openFn + '">' +
        '<div class="comp-row-main">' +
          '<span class="comp-row-name">' + highlight(i.nome, f.q) + (i._hb ? ' <span style="font-size:0.6rem;color:var(--accent-secondary);">HB</span>' : '') + '</span>' +
          '<span class="comp-row-meta">' + (i.tipo_base||'') + (i.richiede_sintonia ? ' · <em>richiede sintonia</em>' : '') + '</span>' +
        '</div>' +
        '<div class="comp-row-stats">' +
          '<span class="badge ' + (raritaBadge[i._rarita_norm]||'badge-muted') + '">' + i._rarita_norm + '</span>' +
          favBtn(i.id, i.nome, i._hb ? 'homebrew' : 'magic_items') +
        '</div>' +
      '</div>';
    }).join('');
  })()
  };

  const renderEquipment = () => {
    const el = document.getElementById('comp-list-equip');
    if (!el) return;
    const f = _filters.equipment;
    const q = f.q.toLowerCase();

    let list = _data.equipment.filter(e => {
      if (q && !e.nome.toLowerCase().includes(q) && !(e.categoria || '').toLowerCase().includes(q)) return false;
      if (f.tipo && e.tipo !== f.tipo) return false;
      if (f.categoria && e.categoria !== f.categoria) return false;
      return true;
    });

    list.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));

    const count = document.getElementById('comp-count-equip');
    if (count) count.textContent = `${list.length} voci`;

    if (list.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚔️</div><h3>Nessun equipaggiamento trovato</h3></div>`;
      return;
    }

    const hbEquip = _getHomebrew().filter(h => h.categoria === 'equipment' &&
      (!q || h.nome.toLowerCase().includes(q)));
    const allEquip = [...list.map(e => ({...e,_hb:false})),
      ...hbEquip.map(h => ({_hb:true, id:h.id, nome:h.nome,
        categoria:h.categoria_tipo||h.sottotitolo||'Homebrew',
        danni:h.danni||'', costo:h.costo||'', peso:h.peso||''}))
    ].sort((a,b) => a.nome.localeCompare(b.nome,'it'));
    if (count) count.textContent = `${allEquip.length} voci`;
    el.innerHTML = renderFavoritiSection('equipment') + allEquip.map(e => `
      <div class="comp-row" onclick="${e._hb ? `Compendio.openHomebrew('${e.id}')` : `Compendio.openEquipment('${e.id}')`}">
        <div class="comp-row-main">
          <span class="comp-row-name">${highlight(e.nome, f.q)}${e._hb ? ' <span style="font-size:0.6rem;color:var(--accent-secondary);">HB</span>' : ''}</span>
          <span class="comp-row-meta">${highlight(e.categoria || '', f.q)}</span>
        </div>
        <div class="comp-row-stats">
          ${e.danni ? `<span class="comp-stat-pill">${e.danni}</span>` : ''}
          ${e.costo ? `<span class="comp-stat-pill">${e.costo}</span>` : ''}
          ${e.peso  ? `<span class="comp-stat-pill">${e.peso}</span>`  : ''}
          ${favBtn(e.id, e.nome, e._hb ? 'homebrew' : 'equipment')}
        </div>
      </div>`).join('');
  };

  const renderRules = () => {
    const el = document.getElementById('comp-list-rules');
    if (!el) return;
    const f = _filters.rules;
    const q = f.q.toLowerCase();

    let list = _data.rules.filter(r => {
      if (q && !r.nome.toLowerCase().includes(q) && !(r.descrizione || '').toLowerCase().includes(q)) return false;
      if (f.categoria && r.categoria !== f.categoria) return false;
      return true;
    });

    list.sort((a, b) => (a.categoria || '').localeCompare(b.categoria || '', 'it') || a.nome.localeCompare(b.nome, 'it'));

    const count = document.getElementById('comp-count-rules');
    if (count) count.textContent = `${list.length} regole`;

    if (list.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📖</div><h3>Nessuna regola trovata</h3></div>`;
      return;
    }

    let currentCat = '';
    el.innerHTML = renderFavoritiSection('rules') + list.map(r => {
      let catHeader = '';
      if (r.categoria !== currentCat) {
        currentCat = r.categoria;
        catHeader = `<div class="comp-cat-header">${r.categoria}</div>`;
      }
      return catHeader + `
        <div class="comp-row" onclick="Compendio.openRule('${r.id}')">
          <div class="comp-row-main">
            <span class="comp-row-name">${highlight(r.nome, f.q)}</span>
            <span class="comp-row-meta">${r.pagine_sorgente ? 'p. ' + r.pagine_sorgente : ''}</span>
          </div>
          <div class="comp-row-stats">
            <span class="comp-stat-pill">${r.capitolo || ''}</span>
          </div>
        </div>`;
    }).join('');
  };

  const openMonster = (id) => {
    const m = _data.monsters.find(x => x.id === id);
    if (!m) return;
    Debug.log(`Compendio: apro mostro ${m.nome}`);

    const gs = m.grado_sfida || {};
    const pf = m.punti_ferita || {};
    const car = m.caratteristiche || {};
    const vel = m.velocita || {};

    const statAbbr = { forza: 'FOR', destrezza: 'DES', costituzione: 'COS', intelligenza: 'INT', saggezza: 'SAG', carisma: 'CAR' };

    const abilitaStr = Object.entries(m.abilita || {}).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${v >= 0 ? '+' : ''}${v}`).join(', ');
    const velStr = Object.entries(vel).filter(([,v]) => v).map(([k, v]) => k === 'camminata' ? v : `${k} ${v}`).join(', ');
    const tsStr = Object.entries(car).filter(([,v]) => v.tiro_salvezza !== v.modificatore).map(([k, v]) => `${statAbbr[k] || k} ${v.tiro_salvezza >= 0 ? '+' : ''}${v.tiro_salvezza}`).join(', ');

    const renderAzioni = (lista, titolo) => {
      if (!lista || !lista.length) return '';
      return `<div class="sb-section-title">${titolo}</div>` +
        lista.map(a => `<div class="sb-action"><strong>${a.nome}.</strong> <span class="text-secondary">${a.descrizione || ''}</span></div>`).join('');
    };

    const renderAzioniLegg = (al) => {
      if (!al || !al.azioni || !al.azioni.length) return '';
      return `<div class="sb-section-title">Azioni Leggendarie</div>
        <div class="sb-action text-muted text-sm" style="margin-bottom:6px;">${al.descrizione_utilizzi || ''}</div>` +
        al.azioni.map(a => `<div class="sb-action"><strong>${a.nome}.</strong> <span class="text-secondary">${a.descrizione || ''}</span></div>`).join('');
    };

    const immunLine = (label, arr) => arr && arr.length ? `<div class="stat-row"><strong>${label}</strong> <span>${arr.join(', ')}</span></div>` : '';

    const content = `
      <div class="stat-block" style="max-height:65vh;overflow-y:auto;">
        <div class="stat-block-title">${m.nome}</div>
        <div class="stat-block-subtitle">${m.dimensione || ''} ${m.tipo || ''}${m.allineamento ? ', ' + m.allineamento : ''}</div>
        <div class="stat-block-divider"></div>
        <div class="stat-row"><strong>Classe Armatura</strong> <span>${m.classe_armatura || '—'}</span></div>
        <div class="stat-row"><strong>Punti Ferita</strong> <span>${pf.media || '—'} ${pf.formula ? '(' + pf.formula + ')' : ''}</span></div>
        <div class="stat-row"><strong>Velocità</strong> <span>${velStr || '—'}</span></div>
        <div class="stat-block-divider"></div>
        <div class="stat-abilities">
          ${Object.entries(statAbbr).map(([key, abbr]) => {
            const s = car[key] || {};
            return `<div class="stat-ability-box">
              <div class="stat-ability-name">${abbr}</div>
              <div class="stat-ability-score">${s.punteggio || 10}</div>
              <div class="stat-ability-mod">${modStr(s.punteggio || 10)}</div>
            </div>`;
          }).join('')}
        </div>
        <div class="stat-block-divider"></div>
        ${tsStr ? `<div class="stat-row"><strong>Tiri Salvezza</strong> <span>${tsStr}</span></div>` : ''}
        ${abilitaStr ? `<div class="stat-row"><strong>Abilità</strong> <span>${abilitaStr}</span></div>` : ''}
        ${immunLine('Immunità ai Danni', m.immunita_danni)}
        ${immunLine('Resistenze', m.resistenze)}
        ${immunLine('Vulnerabilità', m.vulnerabilita)}
        ${immunLine('Immunità alle Condizioni', m.immunita_condizione)}
        <div class="stat-row"><strong>Sensi</strong> <span>${Object.entries(m.sensi || {}).filter(([,v])=>v).map(([k,v])=>k.replace(/_/g,' ')+ ' ' +v).join(', ') || '—'}</span></div>
        ${m.lingue?.length ? `<div class="stat-row"><strong>Lingue</strong> <span>${m.lingue.join(', ')}</span></div>` : ''}
        <div class="stat-row"><strong>Grado di Sfida</strong> <span>${gs.raw || gsDisplay(m)}</span></div>
        <div class="stat-row"><strong>Bonus Competenza</strong> <span>+${m.bonus_competenza || '?'}</span></div>
        <div class="stat-block-divider"></div>
        ${(m.tratti || []).map(t => `<div class="sb-action"><strong>${t.nome}.</strong> <span class="text-secondary">${t.descrizione || ''}</span></div>`).join('')}
        ${renderAzioni(m.azioni, 'Azioni')}
        ${renderAzioni(m.azioni_bonus, 'Azioni Bonus')}
        ${renderAzioni(m.reazioni, 'Reazioni')}
        ${renderAzioniLegg(m.azioni_leggendarie)}
      </div>`;

    openDetailModal(m.nome, content, () => sendToCombat(m));
  };

  const openMagicItem = (id) => {
    const i = _data.magic_items.find(x => x.id === id);
    if (!i) return;
    Debug.log(`Compendio: apro oggetto ${i.nome}`);

    const content = `
      <div style="max-height:65vh;overflow-y:auto;">
        <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-md);">
          <span class="badge ${raritaBadge[i._rarita_norm] || 'badge-muted'}">${i._rarita_norm}</span>
          <span class="text-sm text-muted">${i.tipo || ''}</span>
          ${i.richiede_sintonia ? '<span class="badge badge-muted">richiede sintonia</span>' : ''}
        </div>
        <div class="text-sm" style="line-height:1.7;white-space:pre-wrap;">${i.descrizione || '—'}</div>
      </div>`;

    openDetailModal(i.nome, content);
  };

  const openEquipment = (id) => {
    const e = _data.equipment.find(x => x.id === id);
    if (!e) return;
    Debug.log(`Compendio: apro equipaggiamento ${e.nome}`);

    const rows = [
      e.categoria ? ['Categoria', e.categoria] : null,
      e.danni     ? ['Danni', e.danni] : null,
      e.proprieta?.length ? ['Proprietà', e.proprieta.join(', ')] : null,
      e.padronanza ? ['Padronanza', e.padronanza] : null,
      e.peso   ? ['Peso', e.peso] : null,
      e.costo  ? ['Costo', e.costo] : null,
    ].filter(Boolean);

    const sezioniHTML = (e.sezioni || []).map(s => {
      if (!s.righe || !s.righe.length) return '';
      const keys = Object.keys(s.righe[0]);
      return `
        <div style="margin-top:var(--space-md);">
          <div class="comp-cat-header">${s.titolo}</div>
          <table style="width:100%;font-size:0.82rem;border-collapse:collapse;">
            <thead><tr>${keys.map(k => `<th style="text-align:left;padding:4px 6px;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.7rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">${k}</th>`).join('')}</tr></thead>
            <tbody>${s.righe.map(r => `<tr>${keys.map(k => `<td style="padding:4px 6px;border-bottom:1px solid var(--border);vertical-align:top;">${r[k] || ''}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>`;
    }).join('');

    const content = `
      <div style="max-height:65vh;overflow-y:auto;">
        <table style="width:100%;font-size:0.85rem;margin-bottom:var(--space-md);">
          ${rows.map(([k,v]) => `<tr><td style="color:var(--text-muted);padding:3px 0;width:110px;font-family:var(--font-display);font-size:0.75rem;letter-spacing:0.04em;text-transform:uppercase;">${k}</td><td style="padding:3px 0;">${v}</td></tr>`).join('')}
        </table>
        ${e.descrizione ? `<div class="text-sm" style="line-height:1.7;margin-bottom:var(--space-md);white-space:pre-wrap;">${e.descrizione}</div>` : ''}
        ${sezioniHTML}
      </div>`;

    openDetailModal(e.nome, content);
  };

  const openRule = (id) => {
    const r = _data.rules.find(x => x.id === id);
    if (!r) return;
    Debug.log(`Compendio: apro regola ${r.nome}`);

    const sezioniHTML = (r.sezioni || []).map(s => {
      if (!s.righe || !s.righe.length) return `<div class="comp-cat-header">${s.titolo}</div>`;
      const keys = Object.keys(s.righe[0]);
      return `
        <div style="margin-top:var(--space-md);">
          <div class="comp-cat-header">${s.titolo}</div>
          <table style="width:100%;font-size:0.82rem;border-collapse:collapse;">
            <thead><tr>${keys.map(k => `<th style="text-align:left;padding:4px 6px;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.7rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">${k}</th>`).join('')}</tr></thead>
            <tbody>${s.righe.map(row => `<tr>${keys.map(k => `<td style="padding:4px 6px;border-bottom:1px solid var(--border);vertical-align:top;">${row[k] || ''}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>`;
    }).join('');

    const content = `
      <div style="max-height:65vh;overflow-y:auto;">
        <div class="text-xs text-muted" style="margin-bottom:var(--space-md);font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase;">${r.categoria} · ${r.capitolo}${r.pagine_sorgente ? ' · p. ' + r.pagine_sorgente : ''}</div>
        ${r.descrizione ? `<div class="text-sm" style="line-height:1.7;margin-bottom:var(--space-md);">${r.descrizione}</div>` : ''}
        ${sezioniHTML}
      </div>`;

    openDetailModal(r.nome, content);
  };

  let _currentMonsterForCombat = null;

  const openDetailModal = (title, content, onSendToCombat = null) => {
    _currentMonsterForCombat = onSendToCombat;
    const titleEl  = document.getElementById('comp-detail-title');
    const bodyEl   = document.getElementById('comp-detail-body');
    const combatBtn = document.getElementById('comp-detail-combat-btn');

    if (titleEl)  titleEl.textContent = title;
    if (bodyEl)   bodyEl.innerHTML = content;
    if (combatBtn) combatBtn.style.display = onSendToCombat ? 'inline-flex' : 'none';

    Modal.open('comp-detail');
  };

  const sendToCombat = (m) => {
    if (!m) { if (_currentMonsterForCombat) _currentMonsterForCombat(); return; }
    Debug.log(`Compendio → Combat: ${m.nome}`);
    const pf = m.punti_ferita?.media || 10;
    const combatant = {
      id: 'comb_' + Date.now(),
      nome: m.nome,
      tipo: 'mostro',
      hp: pf,
      maxHp: pf,
      ca: m.classe_armatura || 10,
      iniziativa: 0,
      gs: m.grado_sfida ? (m.grado_sfida.raw || String(m.grado_sfida.valore)) : '?',
      monsterId: m.id,
      condizioni: [],
    };

    const camp = App.getActiveCampaign();
    if (camp) {
      const pending = camp.pendingCombatants || [];
      pending.push(combatant);
      App.saveActiveCampaign({ pendingCombatants: pending });
      Toast.show(`${m.nome} aggiunto al Combat Tracker`, 'success');
      Modal.close('comp-detail');
      App.navigateTo('sessione');
    } else {
      Toast.show('Seleziona prima una campagna', 'warning');
    }
  };

  const sendCurrentToCombat = () => {
    if (_currentMonsterForCombat) _currentMonsterForCombat();
  };

  const renderSpells = () => {
    const el = document.getElementById('comp-list-spells');
    if (!el) return;
    const f = _filters.spells;
    const q = f.q.toLowerCase();

    const scuolaBadge = {
      Abiurazione: 'badge-blue', Ammaliamento: 'badge-primary',
      Divinazione: 'badge-gold', Evocazione: 'badge-success',
      Illusione: 'badge-muted', Invocazione: 'badge-warning',
      Necromanzia: 'badge-primary', Trasmutazione: 'badge-muted',
    };

    let list = _data.spells.filter(s => {
      if (q && !s.nome.toLowerCase().includes(q) && !(s.scuola||'').toLowerCase().includes(q)) return false;
      if (f.livello !== '' && String(s.livello) !== f.livello) return false;
      if (f.scuola && s.scuola !== f.scuola) return false;
      if (f.rituale === 'true' && !(s.rituale === true || s.rituale === 'true')) return false;
      return true;
    });

    list.sort((a, b) => {
      if (a.livello !== b.livello) return a.livello - b.livello;
      return a.nome.localeCompare(b.nome, 'it');
    });

    const count = document.getElementById('comp-count-spells');
    if (count) count.textContent = list.length + ' incantesimi';

    if (_data.spells.length === 0) {
      Toast.show('Incantesimi non caricati — verifica il nome file su GitHub', 'warning', 5000);
    }

    if (list.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✨</div><h3>Nessun incantesimo trovato</h3></div>';
      return;
    }

    let currentLv = -1;
    el.innerHTML = renderFavoritiSection('spells') + list.map(s => {
      let lvHeader = '';
      if (s.livello !== currentLv) {
        currentLv = s.livello;
        lvHeader = '<div class="comp-cat-header">' + (s.livello === 0 ? 'Trucchetti (0)' : s.livello + '\xB0 livello') + '</div>';
      }
      const badge = scuolaBadge[s.scuola] || 'badge-muted';
      const isRitual = s.rituale === true || s.rituale === 'true';
      const isConc = (s.durata||'').toLowerCase().includes('concentrazione');
      const ritLabel = isRitual ? '<span class="badge badge-gold" style="font-size:0.6rem;">R</span>' : '';
      const conc = isConc ? '<span class="badge badge-blue" style="font-size:0.6rem;">C</span>' : '';
      return lvHeader +
        '<div class="comp-row" onclick="Compendio.openSpell(\'' + s.id + '\')">' +
          '<div class="comp-row-main">' +
            '<span class="comp-row-name">' + highlight(s.nome, f.q) + '</span>' +
            '<span class="comp-row-meta">' + (s.scuola||'') + ' \xB7 ' + (s.tempo_lancio||'') + ' \xB7 ' + (s.gittata||'') + '</span>' +
          '</div>' +
          '<div class="comp-row-stats">' +
            '<span class="badge ' + badge + '" style="font-size:0.62rem;">' + (s.scuola||'') + '</span>' +
            ritLabel + conc + favBtn(s.id, s.nome, 'spells') +
          '</div>' +
        '</div>';
    }).join('');
  };

  const openSpell = (id) => {
    const s = _data.spells.find(x => x.id === id);
    if (!s) return;
    Debug.log('Compendio: apro incantesimo ' + s.nome);

    const isConc = (s.durata||'').toLowerCase().includes('concentrazione');
    const isRitual = s.rituale === true || s.rituale === 'true';
    const lvLabel = s.livello === 0 ? 'Trucchetto' : s.livello + '\xB0 livello';

    const rows = [
      ['Tempo di lancio', s.tempo_lancio],
      ['Gittata', s.gittata],
      ['Componenti', s.componenti],
      ['Durata', s.durata],
    ].filter(function(r){ return r[1]; }).map(function(r){
      return '<tr><td style="color:var(--text-muted);padding:3px 0;width:130px;font-family:var(--font-display);font-size:0.72rem;letter-spacing:0.04em;text-transform:uppercase;">' + r[0] + '</td><td style="padding:3px 0;">' + r[1] + '</td></tr>';
    }).join('');

    const content =
      '<div style="max-height:65vh;overflow-y:auto;">' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:var(--space-md);">' +
          '<span class="badge badge-muted">' + lvLabel + '</span>' +
          '<span class="badge badge-muted">' + (s.scuola||'') + '</span>' +
          (isRitual ? '<span class="badge badge-gold">Rituale</span>' : '') +
          (isConc ? '<span class="badge badge-blue">Concentrazione</span>' : '') +
        '</div>' +
        '<table style="width:100%;font-size:0.85rem;margin-bottom:var(--space-md);">' + rows + '</table>' +
        '<div class="text-sm" style="line-height:1.75;white-space:pre-wrap;">' + (s.descrizione||'\u2014') + '</div>' +
      '</div>';

    openDetailModal(s.nome, content);
  };

  const _getHomebrew = () => App.getActiveCampaign()?.homebrew || [];
  const _saveHomebrew = (list) => App.saveActiveCampaign({ homebrew: list });

  const renderHomebrew = () => {
    const el = document.getElementById('comp-list-homebrew');
    if (!el) return;
    const f = _filters.homebrew;
    const q = f.q.toLowerCase();
    let list = _getHomebrew().filter(h => {
      if (q && !h.nome.toLowerCase().includes(q) && !(h.note||'').toLowerCase().includes(q)) return false;
      if (f.categoria && h.categoria !== f.categoria) return false;
      return true;
    });
    list.sort((a,b) => a.nome.localeCompare(b.nome,'it'));
    const count = document.getElementById('comp-count-homebrew');
    if (count) count.textContent = list.length + ' voci';
    if (list.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔧</div><h3>Nessuna voce homebrew</h3><p class="text-muted">Clicca "+ Aggiungi" per creare la tua prima voce</p></div>';
      return;
    }
    const catLabel = { monsters:'🐉 Mostri', magic_items:'✨ Oggetti Magici', equipment:'⚔️ Equipaggiamento', spells:'💫 Incantesimi', rules:'📖 Regole', altro:'📌 Altro' };
    const catBadge = { monsters:'badge-primary', magic_items:'badge-gold', equipment:'badge-muted', spells:'badge-blue', rules:'badge-muted', altro:'badge-muted' };
    el.innerHTML = list.map(h => {

      let stats = '';
      if (h.categoria === 'monsters') {
        if (h.gs != null || h.grado_sfida) stats += '<span class="comp-stat-pill" title="Grado Sfida">GS ' + (h.gs ?? h.grado_sfida?.valore ?? '?') + '</span>';
        if (h.pf != null || h.punti_ferita) stats += '<span class="comp-stat-pill" title="Punti Ferita">PF ' + (h.pf ?? h.punti_ferita?.media ?? '?') + '</span>';
        if (h.ca != null || h.classe_armatura) stats += '<span class="comp-stat-pill" title="Classe Armatura">CA ' + (h.ca ?? h.classe_armatura ?? '?') + '</span>';
      } else if (h.categoria === 'magic_items') {
        const rarita = normalizzaRarita(h.rarita || '');
        stats += '<span class="badge ' + (raritaBadge[rarita] || 'badge-muted') + '">' + (rarita || 'N/A') + '</span>';
      } else if (h.categoria === 'equipment') {
        if (h.danni) stats += '<span class="comp-stat-pill">' + h.danni + '</span>';
        if (h.costo) stats += '<span class="comp-stat-pill">' + h.costo + '</span>';
        if (h.peso) stats += '<span class="comp-stat-pill">' + h.peso + '</span>';
      } else if (h.categoria === 'spells') {
        if (h.livello != null) stats += '<span class="comp-stat-pill">' + (h.livello === 0 ? 'Trucchetto' : h.livello + '° lv.') + '</span>';
        if (h.scuola) stats += '<span class="comp-stat-pill">' + h.scuola + '</span>';
      }
      return '<div class="comp-row" onclick="Compendio.openHomebrew(\'' + h.id + '\')">' +
        '<div class="comp-row-main">' +
          '<span class="comp-row-name">' + highlight(h.nome, f.q) + '</span>' +
          '<span class="comp-row-meta">' + (h.sottotitolo||'') + '</span>' +
        '</div>' +
        '<div class="comp-row-stats">' +
          stats +
          favBtn(h.id, h.nome, 'homebrew') +
          '<button class="btn btn-ghost btn-icon-sm" style="font-size:0.7rem;" onclick="event.stopPropagation();Compendio.editHomebrew(\'' + h.id + '\')">✏️</button>' +
          '<button class="btn btn-ghost btn-icon-sm" style="font-size:0.7rem;color:var(--accent-danger);" onclick="event.stopPropagation();Compendio.deleteHomebrew(\'' + h.id + '\')">🗑️</button>' +
        '</div>' +
      '</div>';
    }).join('');
  };

  const openHomebrew = (id) => {
    const h = _getHomebrew().find(x => x.id === id);
    if (!h) return;

    let content = '';
    const row = (label, val) => val ? `<tr><td style="color:var(--text-muted);padding:3px 0;width:130px;font-family:var(--font-display);font-size:0.72rem;letter-spacing:0.04em;text-transform:uppercase;">${label}</td><td style="padding:3px 0;">${val}</td></tr>` : '';

    switch (h.categoria) {
      case 'monsters':
        content = '<div style="max-height:65vh;overflow-y:auto;">' +
          '<div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:8px;font-style:italic;">' +
            [h.dimensione, h.tipo, h.allineamento].filter(Boolean).join(', ') +
          '</div>' +
          '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin-bottom:12px;">' +
            row('Classe Armatura', h.ca) +
            row('Punti Ferita', h.pf) +
            row('Velocità', h.velocita) +
            row('Grado Sfida', h.gs) +
          '</table>' +
          (h.stat1 || h.stat2 ? '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-bottom:12px;text-align:center;">' +
            (h.stat1+'/'+h.stat2).split('/').map((s,i)=>{
              const labels=['FOR','DES','COS','INT','SAG','CAR'];
              const val=parseInt(s.trim())||10;
              const mod=Math.floor((val-10)/2);
              return `<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:4px 2px;"><div style="font-size:0.6rem;color:var(--text-muted);">${labels[i]||''}</div><div style="font-family:var(--font-mono);font-size:0.85rem;font-weight:700;">${val}</div><div style="font-size:0.65rem;color:var(--text-muted);">${mod>=0?'+':''}${mod}</div></div>`;
            }).join('') +
          '</div>' : '') +
          '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin-bottom:12px;">' +
            row('Tiri Salvezza', h.ts) +
            row('Sensi', h.sensi) +
            row('Lingue', h.lingue) +
            row('Immunità danni', h.immunitaDanni) +
            row('Immunità cond.', h.immunitaCond) +
          '</table>' +
          (h.tratti ? '<div style="font-family:var(--font-display);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--accent-primary);margin:8px 0 4px;">Tratti</div><div style="font-size:0.85rem;white-space:pre-wrap;line-height:1.6;">' + h.tratti + '</div>' : '') +
          (h.azioni ? '<div style="font-family:var(--font-display);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--accent-primary);margin:8px 0 4px;">Azioni</div><div style="font-size:0.85rem;white-space:pre-wrap;line-height:1.6;">' + h.azioni + '</div>' : '') +
          (h.legact ? '<div style="font-family:var(--font-display);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--accent-primary);margin:8px 0 4px;">Azioni Leggendarie</div><div style="font-size:0.85rem;white-space:pre-wrap;line-height:1.6;">' + h.legact + '</div>' : '') +
          '<div style="margin-top:12px;padding-top:8px;border-top:1px solid var(--border);">' +
            '<button class="btn btn-primary btn-sm" onclick="Sessione.addHomebrewMonster(\''+id+'\');this.closest(\'.modal-overlay\').remove()">Aggiungi al Combat Tracker</button>' +
          '</div>' +
        '</div>';
        break;

      case 'magic_items':
        content = '<div style="max-height:65vh;overflow-y:auto;">' +
          '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
            (h.rarita ? `<span class="badge badge-muted">${h.rarita}</span>` : '') +
            (h.tipo_base ? `<span class="badge badge-muted">${h.tipo_base}</span>` : '') +
            (h.sintonia ? `<span class="badge badge-muted"><em>richiede sintonia${h.sintonia_con?' ('+h.sintonia_con+')':''}</em></span>` : '') +
          '</div>' +
          '<div class="text-sm" style="line-height:1.75;white-space:pre-wrap;">' + (h.descrizione||'—') + '</div>' +
        '</div>';
        break;

      case 'equipment':
        content = '<div style="max-height:65vh;overflow-y:auto;">' +
          '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin-bottom:12px;">' +
            row('Categoria', h.categoria_eq) +
            row('Costo', h.costo) +
            row('Danni', h.danni) +
            row('Peso', h.peso) +
            row('Proprietà', h.proprieta) +
          '</table>' +
          (h.descrizione ? '<div class="text-sm" style="line-height:1.75;white-space:pre-wrap;">' + h.descrizione + '</div>' : '') +
        '</div>';
        break;

      case 'spells':
        const isConc = (h.durata||'').toLowerCase().includes('concentrazione');
        content = '<div style="max-height:65vh;overflow-y:auto;">' +
          '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
            `<span class="badge badge-muted">${h.livello===0?'Trucchetto':h.livello+'° livello'}</span>` +
            (h.scuola ? `<span class="badge badge-muted">${h.scuola}</span>` : '') +
            (h.rituale ? '<span class="badge badge-gold">Rituale</span>' : '') +
            (isConc ? '<span class="badge badge-blue">Concentrazione</span>' : '') +
          '</div>' +
          '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin-bottom:12px;">' +
            row('Tempo di lancio', h.tempo_lancio) +
            row('Gittata', h.gittata) +
            row('Componenti', h.componenti) +
            row('Durata', h.durata) +
            row('Classi', h.classi) +
          '</table>' +
          '<div class="text-sm" style="line-height:1.75;white-space:pre-wrap;">' + (h.descrizione||'—') + '</div>' +
        '</div>';
        break;

      default:
        content = '<div style="max-height:65vh;overflow-y:auto;">' +
          (h.capitolo ? '<div class="text-muted text-sm" style="margin-bottom:8px;">' + h.capitolo + '</div>' : '') +
          (h.sotto ? '<div class="text-muted text-sm" style="margin-bottom:8px;">' + h.sotto + '</div>' : '') +
          '<div class="text-sm" style="line-height:1.75;white-space:pre-wrap;">' + (h.descrizione||'—') + '</div>' +
        '</div>';
    }

    openDetailModal(h.nome, content);
  };

  const _hbFormFields = (cat, h) => {
    const v = (key, def='') => h?.[key] ?? def;
    const sel = (key, opts) => opts.map(([val, lbl]) =>
      `<option value="${val}"${v(key)===val?' selected':''}>${lbl}</option>`).join('');

    switch (cat) {
      case 'monsters': return `
        <div class="form-row">
          <div class="form-group"><label class="form-label">Dimensione</label>
            <select id="hb-dimensione" class="form-select">
              ${sel('dimensione',[['Minuscola','Minuscola'],['Piccola','Piccola'],['Media','Media'],['Grande','Grande'],['Enorme','Enorme'],['Mastodontica','Mastodontica']])}
            </select></div>
          <div class="form-group"><label class="form-label">Tipo</label>
            <input id="hb-tipo" class="form-input" value="${v('tipo')}" placeholder="es. Non Morto, Bestia"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Allineamento</label>
            <input id="hb-allineamento" class="form-input" value="${v('allineamento')}" placeholder="es. Caotico Malvagio"></div>
          <div class="form-group"><label class="form-label">Grado Sfida</label>
            <input id="hb-gs" class="form-input" value="${v('gs')}" placeholder="es. 5 (1.800 PE)"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Punti Ferita</label>
            <input id="hb-pf" class="form-input" value="${v('pf')}" placeholder="es. 52 (7d10+14)"></div>
          <div class="form-group"><label class="form-label">Classe Armatura</label>
            <input id="hb-ca" class="form-input" value="${v('ca')}" placeholder="es. 15 (armatura naturale)"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Velocità</label>
            <input id="hb-velocita" class="form-input" value="${v('velocita')}" placeholder="es. 9m, volare 18m"></div>
          <div class="form-group"><label class="form-label">Tiro Salvezza Bonus</label>
            <input id="hb-ts" class="form-input" value="${v('ts')}" placeholder="es. FOR +5, COS +4"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">FOR / DES / COS</label>
            <input id="hb-stat1" class="form-input" value="${v('stat1')}" placeholder="es. 16 / 12 / 15"></div>
          <div class="form-group"><label class="form-label">INT / SAG / CAR</label>
            <input id="hb-stat2" class="form-input" value="${v('stat2')}" placeholder="es. 8 / 10 / 6"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Immunità danni</label>
            <input id="hb-immunitaDanni" class="form-input" value="${v('immunitaDanni')}" placeholder="es. Fuoco, Veleno"></div>
          <div class="form-group"><label class="form-label">Immunità condizioni</label>
            <input id="hb-immunitaCond" class="form-input" value="${v('immunitaCond')}" placeholder="es. Avvelenato, Paralizzato"></div>
        </div>
        <div class="form-group"><label class="form-label">Sensi</label>
          <input id="hb-sensi" class="form-input" value="${v('sensi')}" placeholder="es. Scurovisione 18m, Perc. Passiva 12"></div>
        <div class="form-group"><label class="form-label">Lingue</label>
          <input id="hb-lingue" class="form-input" value="${v('lingue')}" placeholder="es. Comune, Abissale"></div>
        <div class="form-group"><label class="form-label">Tratti speciali</label>
          <textarea id="hb-tratti" class="form-input" rows="3" placeholder="Tratti passivi (es. Resistenza Magica: vantaggio ai TS contro magie...)">${v('tratti')}</textarea></div>
        <div class="form-group"><label class="form-label">Azioni</label>
          <textarea id="hb-azioni" class="form-input" rows="4" placeholder="Attacchi e azioni (es. Spada: +5 a colpire, 1d8+3 taglienti...)">${v('azioni')}</textarea></div>
        <div class="form-group"><label class="form-label">Azioni leggendarie / bonus / reazioni</label>
          <textarea id="hb-legact" class="form-input" rows="3" placeholder="Azioni leggendarie, bonus action, reazioni...">${v('legact')}</textarea></div>`;

      case 'magic_items': return `
        <div class="form-row">
          <div class="form-group"><label class="form-label">Tipo</label>
            <select id="hb-tipo_base" class="form-select">
              ${sel('tipo_base',[['Arma','Arma'],['Armatura','Armatura'],['Scudo','Scudo'],['Anello','Anello'],['Bacchetta','Bacchetta'],['Bastone','Bastone'],['Verga','Verga'],['Oggetto meraviglioso','Oggetto meraviglioso'],['Pozione','Pozione'],['Pergamena','Pergamena']])}
            </select></div>
          <div class="form-group"><label class="form-label">Rarità</label>
            <select id="hb-rarita" class="form-select">
              ${sel('rarita',[['comune','Comune'],['non comune','Non comune'],['raro','Raro'],['molto raro','Molto raro'],['leggendario','Leggendario'],['variabile','Variabile']])}
            </select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label" style="display:flex;align-items:center;gap:6px;">
            <input type="checkbox" id="hb-sintonia" ${v('sintonia')?'checked':''}> Richiede sintonia</label></div>
          <div class="form-group"><label class="form-label">Con chi (sintonia)</label>
            <input id="hb-sintonia_con" class="form-input" value="${v('sintonia_con')}" placeholder="es. solo da un druido"></div>
        </div>
        <div class="form-group"><label class="form-label">Descrizione / Effetti</label>
          <textarea id="hb-descrizione" class="form-input" rows="6" placeholder="Descrivi proprietà, cariche, effetti...">${v('descrizione')}</textarea></div>`;

      case 'equipment': return `
        <div class="form-row">
          <div class="form-group"><label class="form-label">Categoria</label>
            <select id="hb-categoria_eq" class="form-select">
              ${sel('categoria_eq',[['Mischia semplice','Mischia semplice'],['Mischia da guerra','Mischia da guerra'],['Distanza semplice','Distanza semplice'],['Distanza da guerra','Distanza da guerra'],['Leggera','Armatura Leggera'],['Media','Armatura Media'],['Pesante','Armatura Pesante'],['Scudo','Scudo'],["Equipaggiamento d'avventura","Equipaggiamento d'avventura"],['Strumenti','Strumenti'],['Altro','Altro']])}
            </select></div>
          <div class="form-group"><label class="form-label">Costo</label>
            <input id="hb-costo" class="form-input" value="${v('costo')}" placeholder="es. 15 mo"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Danni</label>
            <input id="hb-danni" class="form-input" value="${v('danni')}" placeholder="es. 1d8 taglienti"></div>
          <div class="form-group"><label class="form-label">Peso</label>
            <input id="hb-peso" class="form-input" value="${v('peso')}" placeholder="es. 2 kg"></div>
        </div>
        <div class="form-group"><label class="form-label">Proprietà</label>
          <input id="hb-proprieta" class="form-input" value="${v('proprieta')}" placeholder="es. leggera, lancio 6/18m, versatile (1d10)"></div>
        <div class="form-group"><label class="form-label">Descrizione / Note</label>
          <textarea id="hb-descrizione" class="form-input" rows="4" placeholder="Descrizione o regole speciali...">${v('descrizione')}</textarea></div>`;

      case 'spells': return `
        <div class="form-row">
          <div class="form-group"><label class="form-label">Livello</label>
            <select id="hb-livello" class="form-select">
              ${[0,1,2,3,4,5,6,7,8,9].map(l=>`<option value="${l}"${v('livello',0)==l?' selected':''}>${l===0?'Trucchetto':l+'° livello'}</option>`).join('')}
            </select></div>
          <div class="form-group"><label class="form-label">Scuola</label>
            <select id="hb-scuola" class="form-select">
              ${sel('scuola',[['Abiurazione','Abiurazione'],['Ammaliamento','Ammaliamento'],['Divinazione','Divinazione'],['Evocazione','Evocazione'],['Illusione','Illusione'],['Invocazione','Invocazione'],['Necromanzia','Necromanzia'],['Trasmutazione','Trasmutazione']])}
            </select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Tempo di lancio</label>
            <input id="hb-tempo_lancio" class="form-input" value="${v('tempo_lancio')}" placeholder="es. 1 azione"></div>
          <div class="form-group"><label class="form-label">Gittata</label>
            <input id="hb-gittata" class="form-input" value="${v('gittata')}" placeholder="es. 30m, Sé stessi"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Componenti</label>
            <input id="hb-componenti" class="form-input" value="${v('componenti')}" placeholder="es. V, S, M (un ramoscello)"></div>
          <div class="form-group"><label class="form-label">Durata</label>
            <input id="hb-durata" class="form-input" value="${v('durata')}" placeholder="es. Concentrazione, fino a 1 minuto"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label" style="display:flex;align-items:center;gap:6px;">
            <input type="checkbox" id="hb-rituale" ${v('rituale')?'checked':''}> Rituale</label></div>
          <div class="form-group"><label class="form-label">Classi</label>
            <input id="hb-classi" class="form-input" value="${v('classi')}" placeholder="es. Mago, Stregone"></div>
        </div>
        <div class="form-group"><label class="form-label">Descrizione</label>
          <textarea id="hb-descrizione" class="form-input" rows="6" placeholder="Effetti dell'incantesimo...">${v('descrizione')}</textarea></div>`;

      case 'rules': return `
        <div class="form-row">
          <div class="form-group"><label class="form-label">Capitolo / Categoria</label>
            <input id="hb-capitolo" class="form-input" value="${v('capitolo')}" placeholder="es. Combattimento, Magia, Esplorazione"></div>
        </div>
        <div class="form-group"><label class="form-label">Regola / Descrizione</label>
          <textarea id="hb-descrizione" class="form-input" rows="8" placeholder="Testo della regola, tabelle, esempi...">${v('descrizione')}</textarea></div>`;

      default: return `
        <div class="form-group"><label class="form-label">Sottotitolo / Tipo</label>
          <input id="hb-sub" class="form-input" value="${v('sotto')}" placeholder="es. Oggetto, Luogo, Evento"></div>
        <div class="form-group"><label class="form-label">Descrizione / Note</label>
          <textarea id="hb-descrizione" class="form-input" rows="7" placeholder="Descrizione libera...">${v('descrizione')}</textarea></div>`;
    }
  };

  const openHomebrewModal = (id) => {
    const h = id ? _getHomebrew().find(x => x.id === id) : null;
    const cat = h?.categoria || 'monsters';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'display:flex;';
    modal.id = 'hb-modal';

    const catOptions = [
      ['monsters','🐉 Mostri'],['magic_items','✨ Oggetti Magici'],
      ['equipment','⚔️ Equipaggiamento'],['spells','💫 Incantesimi'],
      ['rules','📖 Regole'],['altro','📌 Altro'],
    ].map(([v,l]) => `<option value="${v}"${cat===v?' selected':''}>${l}</option>`).join('');

    modal.innerHTML =
      '<div class="modal" style="max-width:580px;">' +
        '<div class="modal-header">' +
          '<h2 style="font-family:var(--font-display);font-size:1.1rem;">' + (h?'Modifica':'Nuovo') + ' Homebrew</h2>' +
          '<button class="btn btn-ghost btn-icon" onclick="this.closest(\'.modal-overlay\').remove()" aria-label="Chiudi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div>' +
        '<div class="modal-body" style="max-height:70vh;overflow-y:auto;">' +
          '<div class="form-row" style="margin-bottom:var(--space-md);">' +
            '<div class="form-group" style="flex:2;">' +
              '<label class="form-label">Nome *</label>' +
              '<input type="text" id="hb-nome" class="form-input" value="' + (h?.nome||'') + '" placeholder="Nome">' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">Categoria</label>' +
              '<select id="hb-cat" class="form-select" onchange="Compendio._refreshHBForm(this.value,\'' + (h?.id||'') + '\')">' +
                catOptions +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div id="hb-fields">' + _hbFormFields(cat, h) + '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-ghost" onclick="this.closest(\'.modal-overlay\').remove()">Annulla</button>' +
          '<button class="btn btn-primary" onclick="Compendio.saveHomebrew(\'' + (h?.id||'') + '\',this)">Salva</button>' +
        '</div>' +
      '</div>';

    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('hb-nome')?.focus(), 100);
  };

  const _refreshHBForm = (cat, id) => {
    const h = id ? _getHomebrew().find(x => x.id === id) : null;
    const fields = document.getElementById('hb-fields');
    if (fields) fields.innerHTML = _hbFormFields(cat, h);
  };

  const editHomebrew = (id) => openHomebrewModal(id);

  const saveHomebrew = (id, btn) => {
    const nome = document.getElementById('hb-nome')?.value?.trim();
    if (!nome) { Toast.show('Inserisci un nome', 'warning'); return; }
    const cat = document.getElementById('hb-cat')?.value || 'altro';

    const g = (sid) => document.getElementById(sid)?.value?.trim() || '';
    const gc = (sid) => document.getElementById(sid)?.checked || false;

    let dati = { nome, categoria: cat };

    switch (cat) {
      case 'monsters':
        dati = { ...dati,
          dimensione: g('hb-dimensione'), tipo: g('hb-tipo'),
          allineamento: g('hb-allineamento'), gs: g('hb-gs'),
          pf: g('hb-pf'), ca: g('hb-ca'), velocita: g('hb-velocita'),
          ts: g('hb-ts'), stat1: g('hb-stat1'), stat2: g('hb-stat2'),
          immunitaDanni: g('hb-immunitaDanni'), immunitaCond: g('hb-immunitaCond'),
          sensi: g('hb-sensi'), lingue: g('hb-lingue'),
          tratti: g('hb-tratti'), azioni: g('hb-azioni'), legact: g('hb-legact'),

          classe_armatura: parseInt(g('hb-ca')) || 10,
          punti_ferita: { media: parseInt(g('hb-pf')) || 10 },
          grado_sfida: { valore: parseFloat(g('hb-gs')) || 1 },
        };
        break;
      case 'magic_items':
        dati = { ...dati,
          tipo_base: g('hb-tipo_base'), rarita: g('hb-rarita'),
          sintonia: gc('hb-sintonia'), sintonia_con: g('hb-sintonia_con'),
          descrizione: g('hb-descrizione'),
        };
        break;
      case 'equipment':
        dati = { ...dati,
          categoria_eq: g('hb-categoria_eq'), costo: g('hb-costo'),
          danni: g('hb-danni'), peso: g('hb-peso'),
          proprieta: g('hb-proprieta'), descrizione: g('hb-descrizione'),
        };
        break;
      case 'spells':
        dati = { ...dati,
          livello: parseInt(document.getElementById('hb-livello')?.value) || 0,
          scuola: g('hb-scuola'), tempo_lancio: g('hb-tempo_lancio'),
          gittata: g('hb-gittata'), componenti: g('hb-componenti'),
          durata: g('hb-durata'), rituale: gc('hb-rituale'),
          classi: g('hb-classi'), descrizione: g('hb-descrizione'),
        };
        break;
      case 'rules':
        dati = { ...dati, capitolo: g('hb-capitolo'), descrizione: g('hb-descrizione') };
        break;
      default:
        dati = { ...dati, sotto: g('hb-sub'), descrizione: g('hb-descrizione') };
    }

    let list = _getHomebrew();
    if (id) {
      const idx = list.findIndex(x => x.id === id);
      if (idx !== -1) list[idx] = { ...list[idx], ...dati };
    } else {
      list.push({ id: 'hb_' + Date.now(), ...dati });
    }
    _saveHomebrew(list);
    btn.closest('.modal-overlay').remove();
    Toast.show('✅ Homebrew salvato', 'success');
    if (_activeTab === 'homebrew') render();
    Debug.log('Homebrew salvato: ' + nome + ' [' + cat + ']');
  };

  const deleteHomebrew = (id) => {
    const h = _getHomebrew().find(x => x.id === id);
    if (!h) return;
    Modal.confirm('Elimina "' + h.nome + '"?', () => {
      _saveHomebrew(_getHomebrew().filter(x => x.id !== id));
      if (_activeTab === 'homebrew') render();
      Toast.show('Eliminato', 'info');
    });
  };

  const renderCercaTutto = () => {
    const el = document.getElementById('comp-list-cerca');
    if (!el) return;
    const q = (_filters.cerca.q || '').toLowerCase().trim();
    const count = document.getElementById('comp-count-cerca');
    if (!q) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>Cerca in tutto il Compendio</h3><p class="text-muted">Mostri, oggetti, equipaggiamento, regole, incantesimi, homebrew</p></div>';
      if (count) count.textContent = '';
      return;
    }
    if (q.length < 2) {
      el.innerHTML = '<div class="text-muted text-sm" style="padding:8px;">Digita almeno 2 caratteri...</div>';
      return;
    }
    const results = [];
    _data.monsters.filter(m => m.nome.toLowerCase().includes(q)).slice(0,5).forEach(m =>
      results.push({ tipo:'🐉 Mostro', nome:m.nome, meta:(m.tipo||'')+(m.grado_sfida?.valore!=null?' · GS '+m.grado_sfida.valore:''), fn:"Compendio.openMonster('"+m.id+"')" }));
    _data.magic_items.filter(m => m.nome.toLowerCase().includes(q)).slice(0,5).forEach(m =>
      results.push({ tipo:'✨ Oggetto', nome:m.nome, meta:(m.rarita||''), fn:"Compendio.openMagicItem('"+m.id+"')" }));
    _data.equipment.filter(m => m.nome.toLowerCase().includes(q)).slice(0,5).forEach(m =>
      results.push({ tipo:'⚔️ Equip.', nome:m.nome, meta:(m.categoria||''), fn:"Compendio.openEquipment('"+m.id+"')" }));
    _data.spells.filter(m => m.nome.toLowerCase().includes(q)).slice(0,5).forEach(m =>
      results.push({ tipo:'💫 Incant.', nome:m.nome, meta:(m.livello===0?'Trucchetto':m.livello+'° lv')+(m.scuola?' · '+m.scuola:''), fn:"Compendio.openSpell('"+m.id+"')" }));
    _data.rules.filter(m => m.nome.toLowerCase().includes(q)).slice(0,3).forEach(m =>
      results.push({ tipo:'📖 Regola', nome:m.nome, meta:m.capitolo||'', fn:"Compendio.openRule('"+m.id+"')" }));
    _getHomebrew().filter(m => m.nome.toLowerCase().includes(q)).slice(0,5).forEach(m => {
      const cl = {monsters:'🐉',magic_items:'✨',equipment:'⚔️',spells:'💫',rules:'📖',altro:'📌'}[m.categoria]||'🔧';
      results.push({ tipo:cl+' HB', nome:m.nome, meta:m.sottotitolo||'', fn:"Compendio.openHomebrew('"+m.id+"')" });
    });
    if (count) count.textContent = results.length + ' risultati';
    if (!results.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>Nessun risultato per "'+q+'"</h3></div>';
      return;
    }
    el.innerHTML = results.map(r =>
      '<div class="comp-row" onclick="'+r.fn+'">' +
        '<div class="comp-row-main">' +
          '<span class="comp-row-name">'+highlight(r.nome, q)+'</span>' +
          '<span class="comp-row-meta">'+r.meta+'</span>' +
        '</div>' +
        '<div class="comp-row-stats"><span class="badge badge-muted" style="font-size:0.6rem;white-space:nowrap;">'+r.tipo+'</span></div>' +
      '</div>'
    ).join('');
  };

  const init = () => {

    const nuovoSistema = getSistema();
    if (nuovoSistema !== _sistema && _loaded) {
      _sistema = nuovoSistema;
      _loaded = false;
    }
    if (!_loaded && !_loading) load();
    else if (_loaded) render();
    Debug.log(`Compendio.init() sistema=${_sistema}`);
  };

  let _velData = null;

  const loadVelocita = async () => {
    if (_velData) return _velData;
    try {
      const r = await fetch('data/velocita.json');
      _velData = await r.json();
    } catch(e) { _velData = { creature: [], monture_generiche: [] }; }
    return _velData;
  };

  const searchVelocita = async () => {
    const q = (document.getElementById('vel-search')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('vel-cat')?.value || '';
    const durata = document.getElementById('vel-durata')?.value || '8h';
    const data = await loadVelocita();

    const durKeys = {
      '1h':  { lento: 'vel_1h_lento', norm: 'vel_1h_norm', fast: 'vel_1h_fast' },
      '8h':  { lento: 'vel_8h_lento', norm: 'vel_8h_norm', fast: 'vel_8h_fast' },
      '16h': { lento: 'vel_16h_lento', norm: 'vel_16h_norm', fast: 'vel_16h_fast' },
      '24h': { lento: 'vel_24h_lento', norm: 'vel_24h_norm', fast: 'vel_24h_fast' },
    };
    const keys = durKeys[durata] || durKeys['8h'];

    const genWrap = document.getElementById('vel-generic-wrap');
    const genList = document.getElementById('vel-generic-list');
    if (genWrap && genList) {
      const showGen = !cat || cat === 'terrestri';
      genWrap.style.display = showGen ? '' : 'none';
      if (showGen) {
        genList.innerHTML = data.monture_generiche.map(m => {
          const norm = m[keys.norm] ?? '—';
          const lento = m[keys.lento] ?? '—';
          const fast = m[keys.fast] ?? '—';
          return `<div class="comp-row">
            <div class="comp-row-main">
              <span class="comp-row-name">${m.vel_base_ft}ft / ${m.vel_base_m}m base</span>
            </div>
            <div class="comp-row-stats">
              <span class="comp-stat-pill" title="Lento">🐢 ${lento}</span>
              <span class="comp-stat-pill" title="Normale">🚶 ${norm}</span>
              <span class="comp-stat-pill" title="Veloce">💨 ${fast}</span>
            </div>
          </div>`;
        }).join('');
      }
    }

    const el = document.getElementById('vel-results-list');
    if (!el) return;

    let lista = data.creature || [];
    if (cat) lista = lista.filter(c => c.categoria === cat);
    if (q) lista = lista.filter(c => c.nome.toLowerCase().includes(q));

    if (!lista.length) {
      el.innerHTML = '<div class="text-muted text-sm" style="padding:var(--space-md);">Nessun risultato</div>';
      return;
    }

    el.innerHTML = lista.map(c => {
      const norm = c[keys.norm] ?? '—';
      const lento = c[keys.lento] ?? '—';
      const fast = c[keys.fast] ?? '—';
      const badges = { terrestri:'🦶', acquatici:'🌊', volanti:'🦅', veicoli:'⚓', magia_terra:'✨', magia_aria:'✨' };
      const badge = badges[c.categoria] || '';
      const noteHtml = c.note ? `<span class="text-xs text-muted" style="margin-left:6px;">${c.note}</span>` : '';
      return `<div class="comp-row">
        <div class="comp-row-main">
          <span class="comp-row-name">${badge} ${c.nome}</span>
          <span class="comp-row-meta">${c.tipo || c.categoria}${noteHtml ? ' · ' + c.note : ''}</span>
        </div>
        <div class="comp-row-stats">
          ${lento !== '—' ? `<span class="comp-stat-pill" title="Lento">L ${lento} km</span>` : ''}
          ${norm !== '—' ? `<span class="comp-stat-pill" title="Normale">N ${norm} km</span>` : ''}
          ${fast !== '—' ? `<span class="comp-stat-pill" title="Veloce">V ${fast} km</span>` : ''}
        </div>
      </div>`;
    }).join('');
  };

  return {
    init, switchTab, onSearch, onFilter,
    openMonster, openMagicItem, openEquipment, openRule, openSpell,
    openHomebrew, openHomebrewModal, editHomebrew, saveHomebrew, deleteHomebrew,
    _refreshHBForm, _getHB: _getHomebrew,
    sendCurrentToCombat, changeSistema, toggleFavorito,
    getData: () => _data,
    renderCercaTutto,
    _injectRules: (rules) => { _data.rules = rules; },
    searchVelocita,
  };
})();

/* ============================================================
   SCHERMO.JS — Schermo del Master personalizzabile
   ============================================================ */
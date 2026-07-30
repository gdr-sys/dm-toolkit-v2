const NPC = (() => {
  let _editingId = null;
  let _viewingId = null;
  let _flipped    = false;

  const mod = (v) => {
    const m = Math.floor((parseInt(v || 10) - 10) / 2);
    return (m >= 0 ? '+' : '') + m;
  };

  const relColor = (v) => {
    v = Math.max(0, Math.min(100, parseInt(v)));
    let r, g, b;
    if (v <= 25) {
      const t = v / 25;
      r = 200; g = Math.round(60 + t * 100); b = 30;
    } else if (v <= 50) {
      const t = (v - 25) / 25;
      r = Math.round(200 - t * 30); g = Math.round(160 + t * 60); b = 30;
    } else if (v <= 75) {
      const t = (v - 50) / 25;
      r = Math.round(170 - t * 120); g = Math.round(200 + t * 20); b = Math.round(30 + t * 30);
    } else {
      const t = (v - 75) / 25;
      r = Math.round(50 - t * 30); g = Math.round(220 - t * 110); b = Math.round(60 + t * 150);
    }
    return `rgb(${r},${g},${b})`;
  };

  const relLabel = (v) => {
    v = parseInt(v);
    if (v <= 15)  return '😡 Ostile';
    if (v <= 30)  return '😤 Diffidente';
    if (v <= 45)  return '😐 Sospettoso';
    if (v <= 55)  return '😶 Neutrale';
    if (v <= 70)  return '🙂 Cordiale';
    if (v <= 85)  return '😊 Amichevole';
    if (v <= 95)  return '😄 Fidato';
    return '💚 Alleato';
  };

  const updateRelationPreview = (v) => {
    const bar = document.getElementById('nm-rel-bar');
    const lbl = document.getElementById('nm-rel-label');
    const val = document.getElementById('nm-rel-val');
    if (bar) { bar.style.width = v + '%'; bar.style.background = relColor(v); }
    if (lbl) lbl.textContent = relLabel(v);
    if (val) val.textContent = v;
  };

  const populateFactionSelect = () => {
    const camp = App.getActiveCampaign();
    const factions = camp?.factions || [];
    ['nm-faction', 'npc-filter-faction'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const cur = sel.value;
      while (sel.options.length > 1) sel.remove(1);
      factions.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.name;
        sel.appendChild(opt);
      });
      sel.value = cur;
    });
  };

  const addAction = () => {
    const list = document.getElementById('nm-actions-list');
    if (!list) return;
    const id = 'act_' + Date.now();
    const row = document.createElement('div');
    row.className = 'action-item';
    row.dataset.actionId = id;
    row.innerHTML = `
      <div style="flex:1;">
        <input type="text" class="form-input action-name" placeholder="Nome azione (es. Spada corta)" style="margin-bottom:4px;">
        <input type="text" class="form-input action-desc" placeholder="Descrizione (es. +4 al colpire, 1d6+2 perforanti)">
      </div>
      <button class="btn btn-ghost btn-icon-sm" onclick="this.closest('.action-item').remove()" style="flex-shrink:0;margin-top:4px;"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
    `;
    list.appendChild(row);
  };

  const getActions = () => {
    const rows = document.querySelectorAll('#nm-actions-list .action-item');
    return Array.from(rows).map(r => ({
      name: r.querySelector('.action-name')?.value?.trim() || '',
      desc: r.querySelector('.action-desc')?.value?.trim() || '',
    })).filter(a => a.name);
  };

  const renderActionsInModal = (actions) => {
    const list = document.getElementById('nm-actions-list');
    if (!list) return;
    list.innerHTML = '';
    (actions || []).forEach(a => {
      const id = 'act_' + Date.now() + Math.random();
      const row = document.createElement('div');
      row.className = 'action-item';
      row.dataset.actionId = id;
      row.innerHTML = `
        <div style="flex:1;">
          <input type="text" class="form-input action-name" value="${a.name}" placeholder="Nome azione" style="margin-bottom:4px;">
          <input type="text" class="form-input action-desc" value="${a.desc}" placeholder="Descrizione">
        </div>
        <button class="btn btn-ghost btn-icon-sm" onclick="this.closest('.action-item').remove()" style="flex-shrink:0;margin-top:4px;"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
      `;
      list.appendChild(row);
    });
  };

  const switchModalTab = (tab) => {
    const ruolo  = document.getElementById('npc-modal-ruolo');
    const combat = document.getElementById('npc-modal-combat');
    const btnR   = document.getElementById('npc-tab-ruolo-btn');
    const btnC   = document.getElementById('npc-tab-combat-btn');
    if (!ruolo || !combat) return;
    if (tab === 'ruolo') {
      ruolo.style.display  = '';
      combat.style.display = 'none';
      btnR?.classList.add('active');
      btnC?.classList.remove('active');
    } else {
      ruolo.style.display  = 'none';
      combat.style.display = '';
      btnR?.classList.remove('active');
      btnC?.classList.add('active');
    }
  };

  const openModal = (npc) => {
    _editingId = npc ? npc.id : null;
    populateFactionSelect();
    switchModalTab('ruolo');
    document.getElementById('npc-modal-title').textContent = npc ? 'Modifica PNG' : 'Nuovo PNG';

    const fields = {
      'nm-name':  npc?.name  || '', 'nm-race': npc?.race || '',
      'nm-job':   npc?.job   || '', 'nm-icon': npc?.icon || '',
      'nm-voice': npc?.voice || '', 'nm-tic':  npc?.tic  || '',
      'nm-trait':  npc?.trait  || '', 'nm-secret': npc?.secret || '',
      'nm-wants':  npc?.wants  || '', 'nm-offers': npc?.offers || '',
      'nm-obiettivo-segreto': npc?.obiettivoSegreto || '',
      'nm-links':  npc?.links  || '',
      'nm-cr':    npc?.cr    || '', 'nm-hp':    npc?.hp    || '',
      'nm-ac':    npc?.ac    || '', 'nm-speed': npc?.speed || '',
      'nm-type':  npc?.type  || '',
      'nm-str':   npc?.str   || '', 'nm-dex': npc?.dex || '',
      'nm-con':   npc?.con   || '', 'nm-int': npc?.int_ || '',
      'nm-wis':   npc?.wis   || '', 'nm-cha': npc?.cha  || '',
      'nm-immunities':   npc?.immunities   || '',
      'nm-senses':       npc?.senses       || '',
      'nm-languages':    npc?.languages    || '',
      'nm-special':      npc?.special      || '',
      'nm-combat-notes': npc?.combatNotes  || '',
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });

    const alignEl = document.getElementById('nm-align');
    if (alignEl) alignEl.value = npc?.align || '';
    const moraleEl = document.getElementById('nm-morale');
    if (moraleEl) moraleEl.value = npc?.morale || '';
    const obiettivoEl = document.getElementById('nm-obiettivo-segreto');
    if (obiettivoEl) obiettivoEl.value = npc?.obiettivoSegreto || '';
    const facEl = document.getElementById('nm-faction');
    if (facEl) facEl.value = npc?.factionId || '';

    const rel = npc?.relation ?? 50;
    const relEl = document.getElementById('nm-relation');
    if (relEl) relEl.value = rel;
    updateRelationPreview(rel);
    renderActionsInModal(npc?.actions || []);

    if (window.setImgPreview) setImgPreview('npc', npc?.immagine || '');
    const aliasEl = document.getElementById('nm-alias');
    if (aliasEl) aliasEl.value = npc?.alias || '';
    if (npc?.imgPosX != null) { const el = document.getElementById('npc-img-pos-x'); if(el) el.value = npc.imgPosX; }
    if (npc?.imgPosY != null) { const el = document.getElementById('npc-img-pos-y'); if(el) el.value = npc.imgPosY; }
    if (npc?.imgZoom != null) { const el = document.getElementById('npc-img-zoom'); if(el) el.value = npc.imgZoom; }
    const imgUrlEl = document.getElementById('npc-img-url');
    if (imgUrlEl) imgUrlEl.value = npc?.immagine || '';

    Modal.open('npc');
    setTimeout(() => document.getElementById('nm-name')?.focus(), 100);
    Debug.log(`NPC modal: ${npc ? npc.name : 'nuovo'}`);
  };

  const submitModal = () => {
    const name = document.getElementById('nm-name')?.value?.trim();
    if (!name) { Toast.show('Inserisci un nome', 'warning'); return; }

    App.reloadActiveCampaign();
    const camp = App.getActiveCampaign();
    Debug.log(`NPC save: campagna = ${camp ? camp.name : 'NULL'}, id = ${camp?.id}`);
    if (!camp) { Toast.show('Nessuna campagna attiva — apri una campagna prima', 'warning'); return; }

    const campFresh = Storage.getCampaign(camp.id);
    Debug.log(`NPC save: campagna fresh npcs = ${JSON.stringify((campFresh?.npcs || []).length)}`);

    const npcs = [...(campFresh?.npcs || [])];
    const relation = parseInt(document.getElementById('nm-relation')?.value) || 50;

    const data = {
      name,
      alias:    document.getElementById('nm-alias')?.value?.trim()  || '',
      race:     document.getElementById('nm-race')?.value?.trim()   || '',
      job:      document.getElementById('nm-job')?.value?.trim()    || '',
      icon:     document.getElementById('nm-icon')?.value?.trim()   || '👤',
      voice:    document.getElementById('nm-voice')?.value?.trim()  || '',
      tic:      document.getElementById('nm-tic')?.value?.trim()    || '',
      trait:    _fieldVal('nm-trait')?.trim()  || '',
      secret:   _fieldVal('nm-secret')?.trim() || '',
      wants:    document.getElementById('nm-wants')?.value?.trim()  || '',
      offers:   document.getElementById('nm-offers')?.value?.trim() || '',
      links:    document.getElementById('nm-links')?.value?.trim()  || '',
      factionId: document.getElementById('nm-faction')?.value       || '',
      relation,
      cr:     document.getElementById('nm-cr')?.value?.trim()    || '',
      hp:     document.getElementById('nm-hp')?.value?.trim()    || '',
      ac:     document.getElementById('nm-ac')?.value?.trim()    || '',
      speed:  document.getElementById('nm-speed')?.value?.trim() || '',
      type:   document.getElementById('nm-type')?.value?.trim()  || '',
      align:  document.getElementById('nm-align')?.value         || '',
      str:    document.getElementById('nm-str')?.value           || '',
      dex:    document.getElementById('nm-dex')?.value           || '',
      con:    document.getElementById('nm-con')?.value           || '',
      int_:   document.getElementById('nm-int')?.value           || '',
      wis:    document.getElementById('nm-wis')?.value           || '',
      cha:    document.getElementById('nm-cha')?.value           || '',
      immunities:  document.getElementById('nm-immunities')?.value?.trim()   || '',
      senses:      document.getElementById('nm-senses')?.value?.trim()       || '',
      languages:   document.getElementById('nm-languages')?.value?.trim()    || '',
      special:     document.getElementById('nm-special')?.value?.trim()      || '',
      combatNotes: document.getElementById('nm-combat-notes')?.value?.trim() || '',
      actions: getActions(),
      immagine: document.getElementById('npc-img-url')?.value?.trim() || '',
      imgPosX: parseInt(document.getElementById('npc-img-pos-x')?.value || 50),
      imgPosY: parseInt(document.getElementById('npc-img-pos-y')?.value || 50),
      imgZoom: parseInt(document.getElementById('npc-img-zoom')?.value || 100),
      obiettivoSegreto: document.getElementById('nm-obiettivo-segreto')?.value?.trim() || '',
      morale: document.getElementById('nm-morale')?.value || '',
    };

    const _oldNpcName = _editingId ? (npcs.find(n => n.id === _editingId)?.name || '') : '';

    if (_editingId) {
      const idx = npcs.findIndex(n => n.id === _editingId);
      if (idx !== -1) npcs[idx] = { ...npcs[idx], ...data };
      else npcs.push({ id: 'npc_' + Date.now(), ...data });
    } else {
      npcs.push({ id: 'npc_' + Date.now(), ...data });
    }

    Debug.log(`NPC save: salvo ${npcs.length} npcs per campagna ${camp.id}`);

    const result = Storage.updateCampaign(camp.id, { npcs });
    Debug.log(`NPC save: Storage.updateCampaign result = ${result ? 'ok' : 'FALLITO'}`);

    if (!result) {
      Toast.show('Errore salvataggio — controlla il debug', 'error');
      return;
    }

    App.reloadActiveCampaign();

    Modal.close('npc');
    render();
    Toast.show(_editingId ? 'PNG aggiornato' : 'PNG aggiunto', 'success');
    Debug.log(`NPC salvato: ${name}`);

    if (_oldNpcName && _oldNpcName !== name) _safeRename('npc', _oldNpcName, name);

    setTimeout(() => {
      try {
        const camp2 = App.getActiveCampaign();
        const savedNpc = (camp2?.npcs||[]).find(n => n.name === name);
        if (savedNpc) _mondoToWiki('npc', savedNpc);
      } catch(e) { Debug.warn('Wiki sync NPC:', e); }
    }, 200);
  };

  const openView = (id) => {
    const camp = App.getActiveCampaign();
    const npc = (camp?.npcs || []).find(n => n.id === id);
    if (!npc) return;
    _viewingId = id;
    _flipped = false;

    document.getElementById('npc-view-icon').textContent = npc.icon || '👤';
    document.getElementById('npc-view-name').textContent = npc.name;
    document.getElementById('npc-view-meta').textContent = [npc.race, npc.job].filter(Boolean).join(' · ');

    const inner = document.getElementById('npc-flip-inner');
    if (inner) inner.classList.remove('flipped');
    const flipBtn = document.getElementById('npc-flip-btn');
    if (flipBtn) flipBtn.textContent = 'Combattimento';

    const rel = npc.relation ?? 50;
    const fill = document.getElementById('npc-view-rel-fill');
    const lbl  = document.getElementById('npc-view-rel-label');
    const val  = document.getElementById('npc-view-rel-val');
    setTimeout(() => { try { npcRenderCronologia(id); } catch(e) {} }, 100);
    if (fill) { fill.style.width = rel + '%'; fill.style.background = relColor(rel); }
    if (lbl)  lbl.textContent = relLabel(rel);
    if (val)  val.textContent = rel + ' / 100';

    const setText = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt || '—'; };
    setText('npc-view-trait',  npc.trait);
    setText('npc-view-secret', npc.secret);
    setText('npc-view-wants',  npc.wants);
    setText('npc-view-offers', npc.offers);
    setText('npc-view-links',  npc.links);
    setText('npc-view-voice',  [npc.voice, npc.tic].filter(Boolean).join(' · '));
    setText('npc-view-cadenza',  npc.cadenza);
    setText('npc-view-saluto',   npc.saluto);
    setText('npc-view-argomento', npc.argomentoRicorrente);
    setText('npc-view-obiettivo', npc.obiettivoSegreto);
    setText('npc-view-hook',     npc.hookSituazionale);

    const archEl = document.getElementById('npc-view-archetipo');
    if (archEl) { archEl.textContent = npc.archetipo || '—'; archEl.closest('.card')?.style.setProperty('display', npc.archetipo ? '' : 'none'); }

    const ruoloWrap = document.getElementById('npc-view-ruolo-wrap');
    if (ruoloWrap) ruoloWrap.style.display = npc.ruoloCombattivo ? '' : 'none';
    setText('npc-view-ruolo', npc.ruoloCombattivo);
    setText('npc-view-abilita', npc.abilitaSpeciale);

    if (npc.attaccoBonus !== undefined) {
      setText('sb-attacco', `+${npc.attaccoBonus}`);
      setText('sb-savedc',  npc.saveDC || npc.save_dc || '—');
      setText('sb-num-attacchi', npc.numAttacchi ? `${npc.numAttacchi}× ~${npc.dannoPerAttacco} danni` : '—');
    }

    const moraleWrap = document.getElementById('npc-view-morale-wrap');
    const moraleEl   = document.getElementById('npc-view-morale');
    if (moraleWrap && moraleEl) {
      if (npc.morale) {
        const moraleLabels = {
          coraggioso: '🗡️ Coraggioso — combatte fino alla morte',
          determinato: '⚠️ Determinato — fugge sotto il 25% PF',
          cauto: '🏃 Cauto — fugge sotto il 50% PF',
          codardo: '💨 Codardo — fugge al primo danno subito',
          fanatico: '🔥 Fanatico — non si arrende mai',
          mercenario: '💰 Mercenario — si arrende se offri oro',
        };
        moraleEl.textContent = moraleLabels[npc.morale] || npc.morale;
        moraleWrap.style.display = '';
      } else {
        moraleWrap.style.display = 'none';
      }
    }

    const combatBtn = document.getElementById('npc-add-combat-btn');
    if (combatBtn) combatBtn.style.display = npc.hp ? '' : 'none';

    setText('sb-name',     npc.name);
    setText('sb-subtitle', [npc.type || 'Umanoide', npc.align].filter(Boolean).join(', '));
    setText('sb-ac',    npc.ac);
    setText('sb-hp',    npc.hp);
    setText('sb-speed', npc.speed);
    setText('sb-cr',    npc.cr);

    const abilities = document.getElementById('sb-abilities');
    if (abilities) {
      const stats = [['FOR', npc.str], ['DES', npc.dex], ['COS', npc.con], ['INT', npc.int_], ['SAG', npc.wis], ['CAR', npc.cha]];
      abilities.innerHTML = stats.map(([abbr, v]) => `
        <div class="stat-ability-box">
          <div class="stat-ability-name">${abbr}</div>
          <div class="stat-ability-score">${v || 10}</div>
          <div class="stat-ability-mod">${mod(v || 10)}</div>
        </div>`).join('');
    }

    const showRow = (rowId, spanId, v) => {
      const row = document.getElementById(rowId);
      const span = document.getElementById(spanId);
      if (!row || !span) return;
      row.style.display = v ? '' : 'none';
      if (v) span.textContent = v;
    };
    showRow('sb-immunities-row', 'sb-immunities', npc.immunities);
    showRow('sb-senses-row',     'sb-senses',     npc.senses);
    showRow('sb-lang-row',       'sb-languages',  npc.languages);

    const sbSavesRow = document.getElementById('sb-saves-row');
    const sbSaves = document.getElementById('sb-saves');
    if (sbSavesRow && sbSaves) {
      if (npc.savingThrows) {
        sbSaves.textContent = npc.savingThrows;
        sbSavesRow.style.display = '';
      } else if (npc.attaccoBonus !== undefined) {

        const profBonus = npc.profBonus || 2;
        const statsMap = {
          for: npc.str || 10, des: npc.dex || 10, cos: npc.con || 10,
          int: npc.int_ || 10, sag: npc.wis || 10, car: npc.cha || 10,
        };
        const labels = { for:'FOR', des:'DES', cos:'COS', int:'INT', sag:'SAG', car:'CAR' };

        const primaCaratteristica = {
          Brute: ['for'], Skirmisher: ['des'], Artillery: ['des'],
          Controller: ['sag', 'car'], Soldier: ['for', 'cos'], Civile: [],
        }[npc.ruoloCombattivo] || [];
        const savesStr = Object.entries(statsMap).map(([k, v]) => {
          const mod = Math.floor((v - 10) / 2);
          const bonus = primaCaratteristica.includes(k) ? mod + profBonus : mod;
          return `${labels[k]} ${bonus >= 0 ? '+' : ''}${bonus}`;
        }).join(', ');
        sbSaves.textContent = savesStr;
        sbSavesRow.style.display = '';
      } else {
        sbSavesRow.style.display = 'none';
      }
    }

    const special = document.getElementById('sb-special');
    if (special) special.innerHTML = npc.special
      ? npc.special.split('\n').map(l => `<p style="margin-bottom:4px;font-size:0.85rem;">${l}</p>`).join('')
      : '';

    const actList = document.getElementById('sb-actions');
    if (actList) {
      let actions = (npc.actions || []).map(a =>
        `<li class="action-item"><div><strong>${a.name}.</strong> ${a.desc}</div></li>`
      );

      if (!actions.length && npc.nomeArma && npc.dadoAttacco) {
        const tipoAtk = (npc.ruoloCombattivo || '').toLowerCase().includes('artillery')
          ? 'Attacco con arma a distanza' : 'Attacco con arma da mischia';
        const portata = (npc.ruoloCombattivo || '').toLowerCase().includes('artillery')
          ? 'gittata 30/120 m' : 'portata 1,5 m';
        const atkBonus = npc.attaccoBonus !== undefined ? `+${npc.attaccoBonus}` : '';
        actions.push(`<li class="action-item"><div>
          <strong>${npc.nomeArma}.</strong> ${tipoAtk}: ${atkBonus} al tiro per colpire, ${portata}, un bersaglio.
          <em>Danno: ${npc.dadoAttacco} danni da ${npc.tipoDanno || 'contundente'}.</em>
        </div></li>`);
        if (npc.numAttacchi > 1) {
          actions.unshift(`<li class="action-item"><div>
            <strong>Multiattacco.</strong> Il PNG effettua ${npc.numAttacchi} attacchi con ${npc.nomeArma}.
          </div></li>`);
        }
        if (npc.abilitaSpeciale) {
          const [nome, desc] = npc.abilitaSpeciale.split('(');
          actions.push(`<li class="action-item"><div>
            <strong>${nome.trim()}.</strong> ${desc ? desc.replace(')', '') : ''}
          </div></li>`);
        }
      }
      actList.innerHTML = actions.join('') ||
        '<li class="text-muted text-sm" style="padding:6px 0;">Nessuna azione inserita</li>';
    }

    const notes = document.getElementById('sb-notes');
    if (notes) notes.textContent = npc.combatNotes || '';

    Modal.open('npc-view');
    Debug.log(`NPC view: ${npc.name}`);
  };

  const flipCard = () => {
    _flipped = !_flipped;
    document.getElementById('npc-flip-inner')?.classList.toggle('flipped', _flipped);
    const btn = document.getElementById('npc-flip-btn');
    if (btn) btn.textContent = _flipped ? 'Ruolo' : 'Combattimento';
  };

  const editFromView = () => {
    if (!_viewingId) return;
    const camp = App.getActiveCampaign();
    const npc = (camp?.npcs || []).find(n => n.id === _viewingId);
    if (!npc) return;
    Modal.close('npc-view');
    setTimeout(() => openModal(npc), 200);
  };

  const quickRelChange = (e) => {
    if (!_viewingId) return;
    const track = document.getElementById('npc-view-rel-track');
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const v = Math.max(0, Math.min(100, pct));

    const camp = App.getActiveCampaign();
    const npcs = [...(camp?.npcs || [])];
    const idx = npcs.findIndex(n => n.id === _viewingId);
    if (idx === -1) return;

    npcs[idx].relation = v;
    App.saveActiveCampaign({ npcs });

    const fill = document.getElementById('npc-view-rel-fill');
    const lbl  = document.getElementById('npc-view-rel-label');
    const valEl= document.getElementById('npc-view-rel-val');
    if (fill)  { fill.style.width = v + '%'; fill.style.background = relColor(v); }
    if (lbl)   lbl.textContent = relLabel(v);
    if (valEl) valEl.textContent = v + ' / 100';

    render();
    Debug.log(`Relazione ${npcs[idx].name}: ${v}`);
  };

  const deleteNPC = (id) => {
    openConfirmModal('Eliminare questo PNG?', 'I dati andranno persi.', () => {
      const camp = App.getActiveCampaign();
      const npcs = (camp?.npcs || []).filter(n => n.id !== id);
      App.saveActiveCampaign({ npcs });
      render();
      Toast.show('PNG eliminato', 'info');
    });
  };

  const render = () => {

    App.reloadActiveCampaign();
    const camp = App.getActiveCampaign();
    const el = document.getElementById('npc-list');
    Debug.log(`NPC.render: camp=${camp?.name || 'NULL'}, npcs=${camp?.npcs?.length ?? 'undefined'}, el=${el ? 'ok' : 'NOT FOUND'}`);
    if (!el) return;

    const search  = document.getElementById('npc-search')?.value?.toLowerCase() || '';
    const facFilt = document.getElementById('npc-filter-faction')?.value || '';

    let npcs = camp?.npcs || [];
    if (search)  npcs = npcs.filter(n =>
      n.name.toLowerCase().includes(search) ||
      (n.race || '').toLowerCase().includes(search) ||
      (n.job  || '').toLowerCase().includes(search)
    );
    if (facFilt) npcs = npcs.filter(n => n.factionId === facFilt);

    if (npcs.length === 0) {
      el.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <div class="module-placeholder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:2.6rem;height:2.6rem;opacity:0.4;" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
        <h3>${camp?.npcs?.length ? 'Nessun PNG trovato' : 'Nessun PNG ancora'}</h3>
        <p class="text-sm text-muted">${camp?.npcs?.length ? 'Prova a modificare i filtri' : 'Clicca "+ Nuovo PNG" per cominciare'}</p>
      </div>`;
      return;
    }

    el.innerHTML = npcs.map(npc => {
      const rel = npc.relation ?? 50;
      const col = relColor(rel);
      const lbl = relLabel(rel);
      const facName = camp?.factions?.find(f => f.id === npc.factionId)?.name || '';
      return `
        <div class="npc-card" onclick="NPC.openView('${npc.id}')">
          ${npc.immagine ? `<div style="position:relative;height:140px;width:100%;border-radius:var(--radius-md);margin-bottom:8px;overflow:hidden;"><div id="npc-img-bg-${npc.id}" style="width:100%;height:100%;background:url('${npc.immagine}') ${npc.imgPosX||50}% ${npc.imgPosY||50}% / ${npc.imgZoom||100}% auto no-repeat;"></div><div style="position:absolute;bottom:4px;right:4px;display:flex;gap:2px;background:rgba(0,0,0,0.65);border-radius:4px;padding:2px 3px;z-index:10;">
        <button onclick="event.stopPropagation();npcImgAdjust.bind(null,'${npc.id}')('x',-10)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:0.85rem;line-height:1;" title="←">←</button>
        <button onclick="event.stopPropagation();npcImgAdjust.bind(null,'${npc.id}')('x',10)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:0.85rem;line-height:1;" title="→">→</button>
        <button onclick="event.stopPropagation();npcImgAdjust.bind(null,'${npc.id}')('y',-10)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:0.85rem;line-height:1;" title="↑">↑</button>
        <button onclick="event.stopPropagation();npcImgAdjust.bind(null,'${npc.id}')('y',10)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:0.85rem;line-height:1;" title="↓">↓</button>
        <button onclick="event.stopPropagation();npcImgAdjust.bind(null,'${npc.id}')('z',-20)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;line-height:1;" title="−">−</button>
        <button onclick="event.stopPropagation();npcImgAdjust.bind(null,'${npc.id}')('z',20)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;line-height:1;" title="+">+</button>
      </div></div>` : ''}
          <div class="npc-card-header">
            <div class="npc-avatar">${npc.icon || '👤'}</div>
            <div style="flex:1;min-width:0;">
              <div class="npc-name">${npc.name}</div>
              <div class="npc-meta">${[npc.race, npc.job].filter(Boolean).join(' · ') || '—'}</div>
              ${facName ? `<span class="badge badge-muted" style="margin-top:3px;">${facName}</span>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;" onclick="event.stopPropagation()">
              <button class="btn btn-ghost btn-icon-sm" title="Modifica"
                onclick="NPC.openModal((App.getActiveCampaign()?.npcs||[]).find(n=>n.id==='${npc.id}'))"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="btn btn-ghost btn-icon-sm" title="Elimina"
                onclick="NPC.deleteNPC('${npc.id}')"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
            </div>
          </div>
          <div class="npc-card-body">
            ${npc.trait ? `<div class="text-sm text-muted" style="margin-bottom:var(--space-sm);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${npc.trait}</div>` : ''}
            <div class="relation-bar-wrap">
              <div class="relation-bar-labels">
                <span>Ostile</span>
                <span style="color:${col};font-weight:600;">${lbl}</span>
                <span>Alleato</span>
              </div>
              <div class="relation-bar-track">
                <div class="relation-bar-fill" style="width:${rel}%;background:${col};"></div>
              </div>
              <div class="relation-bar-value">${rel}/100</div>
            </div>
          </div>
        </div>`;
    }).join('');
  };

  const filter = () => render();

  const init = () => {

    App.reloadActiveCampaign();
    populateFactionSelect();
    render();
    Debug.log('NPC.init()');
  };

  const addCurrentToCombat = () => {
    if (!_viewingId) return;
    if (typeof Sessione !== 'undefined' && Sessione.addNPCToCombat) {
      Sessione.addNPCToCombat(_viewingId);
    } else {
      Toast.show('Modulo Sessione non disponibile', 'warning');
    }
  };

  return {
    init, render, filter,
    openModal, submitModal,
    openView, flipCard, editFromView,
    quickRelChange, updateRelationPreview,
    addAction, deleteNPC, switchModalTab,
    addCurrentToCombat,
  };
})();

/* ============================================================
   LUOGHI.JS — Gestione luoghi con gerarchia e immagini
   ============================================================ */

const Luoghi = (() => {
  let _editingId = null;

  const tipoIcon = {
    regno: '🌍', citta: '🏙️', villaggio: '🏘️',
    dungeon: '⚔️', locanda: '🍺', edificio: '🏛️',
    natura: '🌲', altro: '📍'
  };

  const getAll = () => App.getActiveCampaign()?.locations || [];

  const filter = () => render();

  const render = () => {
    const el = document.getElementById('luoghi-list');
    if (!el) return;
    const camp = App.getActiveCampaign();
    if (!camp) return;

    const q    = document.getElementById('luoghi-search')?.value?.toLowerCase() || '';
    const tipo = document.getElementById('luoghi-filter-tipo')?.value || '';

    let list = getAll().filter(l => {
      if (q    && !l.nome.toLowerCase().includes(q)) return false;
      if (tipo && l.tipo !== tipo) return false;
      return true;
    });

    if (list.length === 0) {
      el.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <div class="module-placeholder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:2.6rem;height:2.6rem;opacity:0.4;" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
        <h3>${getAll().length ? 'Nessun luogo trovato' : 'Nessun luogo ancora'}</h3>
        <p class="text-sm text-muted">Clicca "+ Nuovo Luogo" per cominciare</p>
      </div>`;
      return;
    }

    el.innerHTML = list.map(l => {
      const parent = l.parentId ? getAll().find(x => x.id === l.parentId) : null;
      const img = l.immagine
        ? `<div style="height:100px;background:url('${l.immagine}') center/cover;border-radius:var(--radius-md) var(--radius-md) 0 0;margin:-var(--space-md) -var(--space-md) var(--space-sm);"></div>`
        : '';
      return `
        <div class="npc-card" onclick="Luoghi.openView('${l.id}')">
          ${l.immagine ? `<div style="height:90px;background:url('${l.immagine}') center/cover no-repeat;border-radius:var(--radius-lg) var(--radius-lg) 0 0;flex-shrink:0;"></div>` : ''}
          <div class="npc-card-header">
            <div class="npc-avatar">${l.icon || tipoIcon[l.tipo] || '📍'}</div>
            <div style="flex:1;min-width:0;">
              <div class="npc-name">${l.nome}</div>
              <div class="npc-meta">${l.tipo || ''} ${parent ? '· in ' + parent.nome : ''}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;" onclick="event.stopPropagation()">
              <button class="btn btn-ghost btn-icon-sm" onclick="Luoghi.openModal(Luoghi._getById('${l.id}'))"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="btn btn-ghost btn-icon-sm" onclick="Luoghi.delete('${l.id}')"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
            </div>
          </div>
          <div class="npc-card-body">
            ${l.desc ? `<div class="text-sm text-muted" style="overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${l.desc}</div>` : ''}
          </div>
        </div>`;
    }).join('');
  };

  const _getById = (id) => getAll().find(l => l.id === id) || null;

  const openModal = (luogo) => {
    _editingId = luogo?.id || null;
    document.getElementById('luogo-modal-title').textContent = luogo ? 'Modifica Luogo' : 'Nuovo Luogo';
    document.getElementById('luogo-id').value = luogo?.id || '';

    const fields = {
      'luogo-nome': luogo?.nome || '', 'luogo-tipo': luogo?.tipo || 'locanda',
      'luogo-icon': luogo?.icon || '', 'luogo-desc': luogo?.desc || '',
      'luogo-poi':  luogo?.poi  || '', 'luogo-loot': luogo?.loot || '',
      'luogo-note': luogo?.note || '', 'luogo-img-url': luogo?.immagine || '',
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id); if (el) el.value = val;
    });

    setImgPreview('luogo', luogo?.immagine || '');

    const parentSel = document.getElementById('luogo-parent');
    if (parentSel) {
      parentSel.innerHTML = '<option value="">— Nessuno (luogo radice) —</option>';
      getAll().filter(l => l.id !== luogo?.id).forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = (tipoIcon[l.tipo] || '📍') + ' ' + l.nome;
        opt.selected = l.id === luogo?.parentId;
        parentSel.appendChild(opt);
      });
    }

    Modal.open('luogo');
    setTimeout(() => document.getElementById('luogo-nome')?.focus(), 100);
  };

  const submitModal = () => {
    const nome = document.getElementById('luogo-nome')?.value?.trim();
    if (!nome) { Toast.show('Inserisci un nome', 'warning'); return; }
    const camp = App.getActiveCampaign();
    if (!camp) return;

    const locations = [...(camp.locations || [])];
    const data = {
      nome,
      tipo:      document.getElementById('luogo-tipo')?.value || 'altro',
      icon:      document.getElementById('luogo-icon')?.value?.trim() || '',
      parentId:  document.getElementById('luogo-parent')?.value || '',
      desc:      _fieldVal('luogo-desc')?.trim() || '',
      poi:       document.getElementById('luogo-poi')?.value?.trim() || '',
      loot:      document.getElementById('luogo-loot')?.value?.trim() || '',
      note:      _fieldVal('luogo-note')?.trim() || '',
      immagine:  document.getElementById('luogo-img-url')?.value?.trim() || '',
    };

    const _oldLocNome = _editingId ? (locations.find(l => l.id === _editingId)?.nome || '') : '';

    if (_editingId) {
      const idx = locations.findIndex(l => l.id === _editingId);
      if (idx !== -1) locations[idx] = { ...locations[idx], ...data };
    } else {
      locations.push({ id: 'loc_' + Date.now(), ...data });
    }

    App.saveActiveCampaign({ locations });
    Modal.close('luogo');
    render();
    Toast.show(_editingId ? 'Luogo aggiornato' : 'Luogo aggiunto', 'success');
    Debug.log(`Luogo salvato: ${nome}`);
    if (_oldLocNome && _oldLocNome !== nome) _safeRename('luogo', _oldLocNome, nome);

    setTimeout(() => {
      try {
        const camp2 = App.getActiveCampaign();
        const saved = (camp2?.locations||[]).find(l => l.nome === nome);
        if (saved) _mondoToWiki('luogo', saved);
      } catch(e) { Debug.warn('Wiki sync Luogo:', e); }
    }, 200);
  };

  const openView = (id) => {
    const l = _getById(id);
    if (!l) return;
    const parent = l.parentId ? _getById(l.parentId) : null;
    const figli = getAll().filter(x => x.parentId === id);

    const content = `
      ${l.immagine ? `<div style="position:relative;height:200px;width:100%;border-radius:var(--radius-md);margin-bottom:8px;overflow:hidden;"><div id="loc-img-${l.id}" style="width:100%;height:100%;background:url('${l.immagine}') ${l.imgPosX||50}% ${l.imgPosY||50}% / ${l.imgZoom||100}% auto no-repeat;"></div><div style="position:absolute;bottom:4px;right:4px;display:flex;gap:2px;background:rgba(0,0,0,0.65);border-radius:4px;padding:2px 3px;z-index:10;">
        <button onclick="event.stopPropagation();locImgAdjust.bind(null,'${l.id}')('x',-10)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:0.85rem;line-height:1;" title="←">←</button>
        <button onclick="event.stopPropagation();locImgAdjust.bind(null,'${l.id}')('x',10)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:0.85rem;line-height:1;" title="→">→</button>
        <button onclick="event.stopPropagation();locImgAdjust.bind(null,'${l.id}')('y',-10)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:0.85rem;line-height:1;" title="↑">↑</button>
        <button onclick="event.stopPropagation();locImgAdjust.bind(null,'${l.id}')('y',10)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:0.85rem;line-height:1;" title="↓">↓</button>
        <button onclick="event.stopPropagation();locImgAdjust.bind(null,'${l.id}')('z',-20)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;line-height:1;" title="−">−</button>
        <button onclick="event.stopPropagation();locImgAdjust.bind(null,'${l.id}')('z',20)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;line-height:1;" title="+">+</button>
      </div></div>` : ''}
      <div class="text-xs text-muted" style="font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:var(--space-sm);">
        ${tipoIcon[l.tipo] || '📍'} ${l.tipo || ''} ${parent ? '· dentro ' + parent.nome : ''}
      </div>
      ${l.desc ? `<div class="text-sm" style="line-height:1.7;margin-bottom:var(--space-md);">${l.desc}</div>` : ''}
      ${l.poi ? `<div class="card card-accent" style="margin-bottom:var(--space-sm);padding:var(--space-sm) var(--space-md);"><div class="text-xs text-muted" style="font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.05em;">Punti di Interesse / PNG</div><div class="text-sm" style="margin-top:4px;">${l.poi}</div></div>` : ''}
      ${l.loot ? `<div class="card card-gold" style="margin-bottom:var(--space-sm);padding:var(--space-sm) var(--space-md);"><div class="text-xs" style="font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.05em;color:var(--accent-secondary);">🎁 Loot / Tesoro</div><div class="text-sm" style="margin-top:4px;">${l.loot}</div></div>` : ''}
      ${l.note ? `<div class="card" style="padding:var(--space-sm) var(--space-md);"><div class="text-xs text-muted" style="font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.05em;">Note DM 🔒</div><div class="text-sm" style="margin-top:4px;">${l.note}</div></div>` : ''}
      ${figli.length ? `<div style="margin-top:var(--space-md);"><div class="comp-cat-header">Luoghi interni</div>${figli.map(f => `<div class="comp-row" onclick="Luoghi.openView('${f.id}')"><div class="comp-row-main"><span class="comp-row-name">${tipoIcon[f.tipo] || '📍'} ${f.nome}</span></div></div>`).join('')}</div>` : ''}
    `;

    const titleEl = document.getElementById('comp-detail-title');
    const bodyEl  = document.getElementById('comp-detail-body');
    const btn     = document.getElementById('comp-detail-combat-btn');
    if (titleEl) titleEl.textContent = (l.icon || tipoIcon[l.tipo] || '📍') + ' ' + l.nome;
    if (bodyEl)  bodyEl.innerHTML = content;
    if (btn)     btn.style.display = 'none';
    Modal.open('comp-detail');
  };

  const _delete = (id) => {
    openConfirmModal('Eliminare questo luogo?', 'I luoghi interni rimarranno ma perderanno il genitore.', () => {
      const camp = App.getActiveCampaign();
      let locations = (camp?.locations || []).filter(l => l.id !== id);

      locations = locations.map(l => l.parentId === id ? { ...l, parentId: '' } : l);
      App.saveActiveCampaign({ locations });
      render();
      Toast.show('Luogo eliminato', 'info');
    });
  };

  const init = () => { render(); Debug.log('Luoghi.init()'); };

  return { init, render, filter, openModal, submitModal, openView, delete: _delete, _getById };
})();

/* ============================================================
   FAZIONI.JS — Gestione fazioni nel Mondo con immagini
   ============================================================ */

const Fazioni = (() => {
  let _editingId = null;

  const getAll = () => {
    const camp = App.getActiveCampaign();

    return camp?.factions || [];
  };

  const relColor = (v) => {
    v = Math.max(0, Math.min(100, parseInt(v || 50)));
    if (v <= 25) return `rgb(200,${Math.round(60+v/25*100)},30)`;
    if (v <= 50) return `rgb(${Math.round(200-(v-25)/25*30)},${Math.round(160+(v-25)/25*60)},30)`;
    if (v <= 75) return `rgb(${Math.round(170-(v-50)/25*120)},${Math.round(200+(v-50)/25*20)},${Math.round(30+(v-50)/25*30)})`;
    return `rgb(${Math.round(50-(v-75)/25*30)},${Math.round(220-(v-75)/25*110)},${Math.round(60+(v-75)/25*150)})`;
  };

  const filter = () => render();

  const render = () => {
    const el = document.getElementById('fazioni-list');
    if (!el) return;

    const q = document.getElementById('fazioni-search')?.value?.toLowerCase() || '';
    let list = getAll().filter(f => !q || f.name.toLowerCase().includes(q));

    if (list.length === 0) {
      el.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <div class="module-placeholder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:2.6rem;height:2.6rem;opacity:0.4;" aria-hidden="true"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/></svg></div>
        <h3>${getAll().length ? 'Nessuna fazione trovata' : 'Nessuna fazione ancora'}</h3>
        <p class="text-sm text-muted">Clicca "+ Nuova Fazione" per cominciare</p>
      </div>`;
      return;
    }

    el.innerHTML = list.map(f => {
      const pct = f.power ?? 50;
      const col = relColor(pct);
      const img = f.immagine;
      return `
        <div class="npc-card" onclick="Fazioni.openView('${f.id}')">
          ${img ? `<div style="height:80px;background:url('${img}') center/cover no-repeat;border-radius:var(--radius-lg) var(--radius-lg) 0 0;flex-shrink:0;"></div>` : ''}
          <div class="npc-card-header">
            <div class="npc-avatar">${f.icon || '🏛️'}</div>
            <div style="flex:1;min-width:0;">
              <div class="npc-name">${f.name}</div>
              <div class="npc-meta">${f.influence || ''}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;" onclick="event.stopPropagation()">
              <button class="btn btn-ghost btn-icon-sm" onclick="Fazioni.openModal(Fazioni._getById('${f.id}'))"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="btn btn-ghost btn-icon-sm" onclick="Fazioni.delete('${f.id}')"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
            </div>
          </div>
          <div class="npc-card-body">
            <div class="relation-bar-wrap">
              <div class="relation-bar-labels">
                <span>Debole</span>
                <span style="color:${col};font-weight:600;">${pct}%</span>
                <span>Dominante</span>
              </div>
              <div class="relation-bar-track">
                <div class="relation-bar-fill" style="width:${pct}%;background:${col};"></div>
              </div>
            </div>
            ${f.notes ? `<div class="text-xs text-muted" style="margin-top:6px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${f.notes}</div>` : ''}
          </div>
        </div>`;
    }).join('');
  };

  const _getById = (id) => getAll().find(f => f.id === id) || null;

  const openModal = (fazione) => {
    _editingId = fazione?.id || null;
    document.getElementById('fazione-mondo-title').textContent = fazione ? 'Modifica Fazione' : 'Nuova Fazione';
    document.getElementById('fazione-mondo-id').value = fazione?.id || '';

    const fields = {
      'fazione-mondo-nome':      fazione?.name      || '',
      'fazione-mondo-icon':      fazione?.icon      || '',
      'fazione-mondo-influenza': fazione?.influence || '',
      'fazione-mondo-obiettivi': fazione?.obiettivi || '',
      'fazione-mondo-relazioni': fazione?.relazioni || '',
      'fazione-mondo-note':      fazione?.notes     || '',
      'fazione-img-url':         fazione?.immagine  || '',
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id); if (el) el.value = val;
    });

    const powerEl = document.getElementById('fazione-mondo-power');
    const powerVal = document.getElementById('fazione-mondo-power-val');
    if (powerEl) powerEl.value = fazione?.power ?? 50;
    if (powerVal) powerVal.textContent = fazione?.power ?? 50;

    setImgPreview('fazione', fazione?.immagine || '');
    Modal.open('fazione-mondo');
    setTimeout(() => document.getElementById('fazione-mondo-nome')?.focus(), 100);
  };

  const submitModal = () => {
    const nome = document.getElementById('fazione-mondo-nome')?.value?.trim();
    if (!nome) { Toast.show('Inserisci un nome', 'warning'); return; }
    const camp = App.getActiveCampaign();
    if (!camp) return;

    const factions = [...(camp.factions || [])];
    const data = {
      name:      nome,
      icon:      document.getElementById('fazione-mondo-icon')?.value?.trim()      || '🏛️',
      power:     parseInt(document.getElementById('fazione-mondo-power')?.value)   || 50,
      influence: document.getElementById('fazione-mondo-influenza')?.value?.trim() || '',
      obiettivi: _fieldVal('fazione-mondo-obiettivi')?.trim() || '',
      relazioni: document.getElementById('fazione-mondo-relazioni')?.value?.trim() || '',
      notes:     _fieldVal('fazione-mondo-note')?.trim()      || '',
      immagine:  document.getElementById('fazione-img-url')?.value?.trim()         || '',
    };

    if (_editingId) {
      const idx = factions.findIndex(f => f.id === _editingId);
      if (idx !== -1) factions[idx] = { ...factions[idx], ...data };
    } else {
      factions.push({ id: 'faz_' + Date.now(), ...data });
    }

    App.saveActiveCampaign({ factions });
    Modal.close('fazione-mondo');
    render();

    if (window.App) App.renderFactionList();
    Toast.show(_editingId ? 'Fazione aggiornata' : 'Fazione aggiunta', 'success');
    Debug.log(`Fazione salvata: ${nome}`);

    setTimeout(() => {
      try {
        const camp2 = App.getActiveCampaign();
        const saved = (camp2?.factions||[]).find(f => f.nome === nome);
        if (saved) _mondoToWiki('fazione', saved);
      } catch(e) { Debug.warn('Wiki sync Fazione:', e); }
    }, 200);
  };

  const openView = (id) => {
    const f = _getById(id);
    if (!f) return;
    const pct = f.power ?? 50;
    const col = relColor(pct);

    const content = `
      ${f.immagine ? `<div style="position:relative;height:160px;width:100%;border-radius:var(--radius-md);margin-bottom:8px;overflow:hidden;"><div id="faz-img-${f.id}" style="width:100%;height:100%;background:url('${f.immagine}') ${f.imgPosX||50}% ${f.imgPosY||50}% / ${f.imgZoom||100}% auto no-repeat;"></div><div style="position:absolute;bottom:4px;right:4px;display:flex;gap:2px;background:rgba(0,0,0,0.65);border-radius:4px;padding:2px 3px;z-index:10;">
        <button onclick="event.stopPropagation();fazImgAdjust.bind(null,'${f.id}')('x',-10)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:0.85rem;line-height:1;" title="←">←</button>
        <button onclick="event.stopPropagation();fazImgAdjust.bind(null,'${f.id}')('x',10)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:0.85rem;line-height:1;" title="→">→</button>
        <button onclick="event.stopPropagation();fazImgAdjust.bind(null,'${f.id}')('y',-10)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:0.85rem;line-height:1;" title="↑">↑</button>
        <button onclick="event.stopPropagation();fazImgAdjust.bind(null,'${f.id}')('y',10)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:0.85rem;line-height:1;" title="↓">↓</button>
        <button onclick="event.stopPropagation();fazImgAdjust.bind(null,'${f.id}')('z',-20)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;line-height:1;" title="−">−</button>
        <button onclick="event.stopPropagation();fazImgAdjust.bind(null,'${f.id}')('z',20)" style="width:24px;height:24px;background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;line-height:1;" title="+">+</button>
      </div></div>` : ''}
      <div style="margin-bottom:var(--space-md);">
        <div class="relation-bar-labels"><span>Debole</span><span style="color:${col};font-weight:600;">${pct}% potere</span><span>Dominante</span></div>
        <div class="relation-bar-track"><div class="relation-bar-fill" style="width:${pct}%;background:${col};"></div></div>
      </div>
      ${f.influence ? `<div class="text-sm" style="margin-bottom:var(--space-sm);"><strong>Zona di influenza:</strong> ${f.influence}</div>` : ''}
      ${f.obiettivi ? `<div class="card card-accent" style="padding:var(--space-sm) var(--space-md);margin-bottom:var(--space-sm);"><div class="text-xs text-muted" style="font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.05em;">Obiettivi</div><div class="text-sm" style="margin-top:4px;">${f.obiettivi}</div></div>` : ''}
      ${f.relazioni ? `<div class="card" style="padding:var(--space-sm) var(--space-md);margin-bottom:var(--space-sm);"><div class="text-xs text-muted" style="font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.05em;">Relazioni</div><div class="text-sm" style="margin-top:4px;">${f.relazioni}</div></div>` : ''}
      ${f.notes ? `<div class="card card-gold" style="padding:var(--space-sm) var(--space-md);"><div class="text-xs" style="font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.05em;color:var(--accent-secondary);">🔒 Note DM</div><div class="text-sm" style="margin-top:4px;">${f.notes}</div></div>` : ''}
    `;

    const titleEl = document.getElementById('comp-detail-title');
    const bodyEl  = document.getElementById('comp-detail-body');
    const btn     = document.getElementById('comp-detail-combat-btn');
    if (titleEl) titleEl.textContent = (f.icon || '🏛️') + ' ' + f.name;
    if (bodyEl)  bodyEl.innerHTML = content;
    if (btn)     btn.style.display = 'none';
    Modal.open('comp-detail');
  };

  const _delete = (id) => {
    const f = _getById(id);
    openConfirmModal(`Eliminare "${f?.name}"?`, '', () => {
      const camp = App.getActiveCampaign();
      const factions = (camp?.factions || []).filter(x => x.id !== id);
      App.saveActiveCampaign({ factions });
      render();
      if (window.App) App.renderFactionList();
      Toast.show('Fazione eliminata', 'info');
    });
  };

  const init = () => { render(); Debug.log('Fazioni.init()'); };

  return { init, render, filter, openModal, submitModal, openView, delete: _delete, _getById };
})();

/* ============================================================
   SESSIONE.JS — Combat Tracker + Party + Tempo
   ============================================================ */

const Sessione = (() => {

  let _combat = null;
  let _sortedCombatants = [];

  const CONDIZIONI = [
    'Accecato','Affascinato','Afferrato','Assordato','Avvelenato',
    'Esausto','Incapacitato','Indebolimento','Invisibile','Paralizzato',
    'Pietrificato','Prono','Rallentato','Restrained','Spaventato','Stordito'
  ];

  const rollD = (faces) => Math.floor(Math.random() * faces) + 1;
  const rollInit = (dex_mod = 0) => rollD(20) + parseInt(dex_mod || 0);

  const loadCombat = () => {
    const camp = App.getActiveCampaign();
    if (!camp) return null;
    return camp.activeCombat || null;
  };

  const saveCombat = (combat) => {
    _combat = combat;
    App.saveActiveCampaign({ activeCombat: combat });
  };

  const saveParty = (party) => {
    App.saveActiveCampaign({ party });
  };

  const init = () => {
    const camp = App.getActiveCampaign();
    if (!camp) { renderNoCampaign(); return; }

    if (camp.pendingCombatants && camp.pendingCombatants.length > 0) {
      if (!_combat) newCombat();
      camp.pendingCombatants.forEach(c => addCombatantToCurrent(c));
      saveCombat(_combat);
      App.saveActiveCampaign({ pendingCombatants: [] });
      Toast.show(camp.pendingCombatants.length + ' mostro aggiunto al combat', 'success');
    }

    _combat = loadCombat();
    renderParty();
    renderCombat();
    renderSavedSessions();
    Debug.log('Sessione.init()');
  };

  const renderNoCampaign = () => {
    const el = document.getElementById('sessione-content');
    if (el) el.innerHTML = `<div class="empty-state"><div class="module-placeholder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:2.6rem;height:2.6rem;opacity:0.4;" aria-hidden="true"><line x1="14.5" y1="17.5" x2="3" y2="6"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg></div><h3>Seleziona una campagna</h3><p class="text-sm text-muted">Apri una campagna dalla home per usare il Combat Tracker</p></div>`;
  };

  const renderParty = () => {
    const camp = App.getActiveCampaign();
    const party = camp?.party || [];
    const el = document.getElementById('party-list');
    if (!el) return;

    if (party.length === 0) {
      el.innerHTML = `<div class="text-muted text-sm" style="padding:var(--space-md);">Nessun personaggio nel party. Aggiungili per vedere le percezioni passive.</div>`;
      return;
    }

    el.innerHTML = party.map(pg => {
      const hpAttuali = pg.hpAttuali ?? pg.hpMax ?? 0;
      const hpMax = pg.hpMax || 1;
      const hpPct = Math.max(0, Math.round(hpAttuali / hpMax * 100));
      const hpCol = hpPct > 66 ? 'var(--accent-success)' : hpPct > 33 ? 'var(--accent-warning)' : 'var(--accent-danger)';
      return `
      <div class="party-card" style="padding:var(--space-sm);border-radius:var(--radius-md);background:var(--bg-secondary);border:1px solid var(--border);">
        <!-- Riga 1: nome + classe/livello + azioni -->
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <div style="flex:1;min-width:0;">
            <div style="font-family:var(--font-display);font-size:0.88rem;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pg.nome}</div>
            <div style="font-size:0.68rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${[pg.giocatore, pg.classe, pg.livello ? 'Lv.' + pg.livello : ''].filter(Boolean).join(' · ')}</div>
          </div>
          <div style="display:flex;gap:1px;flex-shrink:0;">
            <button class="btn btn-ghost btn-icon-sm" onclick="Sessione.editPG('${pg.id}')" title="Modifica" style="width:22px;height:22px;font-size:0.6rem;">✏️</button>
            <button class="btn btn-ghost btn-icon-sm" onclick="Sessione.deletePG('${pg.id}')" title="Rimuovi" style="width:22px;height:22px;font-size:0.6rem;color:var(--accent-danger);">🗑️</button>
          </div>
        </div>

        <!-- Riga 2: HP barra + valori -->
        <div style="margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-family:var(--font-mono);font-size:0.78rem;color:${hpCol};font-weight:700;">PF ${hpAttuali}/${hpMax}</span>
            <span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);">CA ${pg.ca || '?'}</span>
          </div>
          <div style="height:5px;background:var(--bg-tertiary);border-radius:var(--radius-full);overflow:hidden;">
            <div style="height:100%;width:${hpPct}%;background:${hpCol};border-radius:var(--radius-full);transition:width 0.3s;"></div>
          </div>
        </div>

        <!-- Riga 3: Percezioni + Ispirazione -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:3px;align-items:center;">
          <div class="party-stat-box" title="Percezione Passiva" style="padding:2px;text-align:center;">
            <span class="party-stat-label" style="font-size:0.55rem;">Perc</span>
            <span class="party-stat-value" style="font-size:0.85rem;">${pg.percezionePassiva || 10}</span>
          </div>
          <div class="party-stat-box" title="Investigazione Passiva" style="padding:2px;text-align:center;">
            <span class="party-stat-label" style="font-size:0.55rem;">Inv</span>
            <span class="party-stat-value" style="font-size:0.85rem;">${pg.investigazionePassiva || 10}</span>
          </div>
          <div class="party-stat-box" title="Intuizione Passiva" style="padding:2px;text-align:center;">
            <span class="party-stat-label" style="font-size:0.55rem;">Int</span>
            <span class="party-stat-value" style="font-size:0.85rem;">${pg.intuizionePassiva || 10}</span>
          </div>
          <button class="party-inspiration-btn ${pg.inspirazione ? 'active' : ''}"
            onclick="Sessione.toggleInspirazione('${pg.id}')"
            title="Ispirazione" style="font-size:0.6rem;padding:2px 5px;white-space:nowrap;">
            ✨
          </button>
        </div>
      </div>`;
    }).join('');
  };

  const toggleInspirazione = (id) => {
    const camp = App.getActiveCampaign();
    if (!camp) return;
    const party = [...(camp.party || [])];
    const idx = party.findIndex(p => p.id === id);
    if (idx === -1) return;
    party[idx].inspirazione = !party[idx].inspirazione;
    saveParty(party);
    renderParty();
    Toast.show(party[idx].inspirazione ? `✨ ${party[idx].nome} ha ispirazione!` : `${party[idx].nome}: ispirazione rimossa`, 'info');
    Debug.log(`Ispirazione ${party[idx].nome}: ${party[idx].inspirazione}`);
  };

  const addPG = () => openPGModal(null);
  const editPG = (id) => {
    const camp = App.getActiveCampaign();
    const pg = (camp?.party || []).find(p => p.id === id);
    if (pg) openPGModal(pg);
  };
  const deletePG = (id) => {
    openConfirmModal('Rimuovere questo personaggio?', '', () => {
      const camp = App.getActiveCampaign();
      const party = (camp?.party || []).filter(p => p.id !== id);
      saveParty(party);
      renderParty();
      Toast.show('Personaggio rimosso', 'info');
    });
  };

  const openPGModal = (pg) => {
    const fields = {
      'pg-nome': pg?.nome || '', 'pg-giocatore': pg?.giocatore || '',
      'pg-livello': pg?.livello || '', 'pg-classe': pg?.classe || '',
      'pg-hp-max': pg?.hpMax || '', 'pg-hp-attuali': pg?.hpAttuali || '',
      'pg-ca': pg?.ca || '', 'pg-iniziativa-bonus': pg?.iniziativaBonus || '0',
      'pg-perc': pg?.percezionePassiva || '10',
      'pg-invest': pg?.investigazionePassiva || '10',
      'pg-intui': pg?.intuizionePassiva || '10',
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });
    document.getElementById('pg-modal-id').value = pg?.id || '';
    document.getElementById('pg-modal-title').textContent = pg ? 'Modifica Personaggio' : 'Aggiungi Personaggio';
    document.getElementById('pg-inspirazione').checked = pg?.inspirazione || false;
    Modal.open('pg-modal');
    setTimeout(() => document.getElementById('pg-nome')?.focus(), 100);
  };

  const submitPG = () => {
    const nome = document.getElementById('pg-nome')?.value?.trim();
    if (!nome) { Toast.show('Inserisci un nome', 'warning'); return; }
    const camp = App.getActiveCampaign();
    const party = [...(camp?.party || [])];
    const id = document.getElementById('pg-modal-id')?.value;
    const hpMax = parseInt(document.getElementById('pg-hp-max')?.value) || 0;

    const data = {
      nome, id: id || 'pg_' + Date.now(),
      giocatore: document.getElementById('pg-giocatore')?.value?.trim() || '',
      livello:   parseInt(document.getElementById('pg-livello')?.value) || 1,
      classe:    document.getElementById('pg-classe')?.value?.trim() || '',
      hpMax,
      hpAttuali: parseInt(document.getElementById('pg-hp-attuali')?.value) || hpMax,
      ca:        parseInt(document.getElementById('pg-ca')?.value) || 10,
      iniziativaBonus: parseInt(document.getElementById('pg-iniziativa-bonus')?.value) || 0,
      percezionePassiva:     parseInt(document.getElementById('pg-perc')?.value)   || 10,
      investigazionePassiva: parseInt(document.getElementById('pg-invest')?.value) || 10,
      intuizionePassiva:     parseInt(document.getElementById('pg-intui')?.value)  || 10,
      inspirazione: document.getElementById('pg-inspirazione')?.checked || false,
    };

    if (id) {
      const idx = party.findIndex(p => p.id === id);
      if (idx !== -1) party[idx] = data;
    } else {
      party.push(data);
    }
    saveParty(party);
    Modal.close('pg-modal');
    renderParty();
    Toast.show(id ? 'Personaggio aggiornato' : 'Personaggio aggiunto', 'success');
    Debug.log(`PG ${id ? 'aggiornato' : 'aggiunto'}: ${nome}`);
  };

  const addPGtoCombat = () => {
    const camp = App.getActiveCampaign();
    const party = camp?.party || [];
    if (!party.length) { Toast.show('Nessun personaggio nel party', 'warning'); return; }
    if (!_combat) newCombat();

    party.forEach(pg => {
      const exists = _combat.combatants.find(c => c.pgId === pg.id);
      if (!exists) {
        _combat.combatants.push({
          id: 'comb_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
          nome: pg.nome,
          tipo: 'pg',
          pgId: pg.id,
          hp: pg.hpAttuali || pg.hpMax || 0,
          maxHp: pg.hpMax || 0,
          ca: pg.ca || 10,
          iniziativa: rollInit(pg.iniziativaBonus),
          iniziativaBonus: pg.iniziativaBonus || 0,
          condizioni: [],
          note: '',
          concentrazione: false,
        });
      }
    });
    sortCombatants();
    saveCombat(_combat);
    renderCombat();
    Toast.show('Party aggiunto al combat', 'success');
  };

  const newCombat = () => {
    const camp = App.getActiveCampaign();
    _combat = {
      id: 'scontro_' + Date.now(),
      nome: 'Scontro ' + new Date().toLocaleDateString('it-IT'),
      turno: 0,
      round: 1,
      status: 'attivo',
      combatants: [],
      iniziataAt: Date.now(),
      campagnaId: camp?.id || '',
    };
    saveCombat(_combat);
    renderCombat();
    Debug.log('Nuovo combat creato');
  };

  const sortCombatants = () => {
    if (!_combat) return;
    _sortedCombatants = [..._combat.combatants].sort((a, b) => {
      if (b.iniziativa !== a.iniziativa) return b.iniziativa - a.iniziativa;

      if (a.tipo === 'pg' && b.tipo !== 'pg') return -1;
      if (b.tipo === 'pg' && a.tipo !== 'pg') return 1;
      return a.nome.localeCompare(b.nome, 'it');
    });
  };

  const renderCombat = () => {
    const el = document.getElementById('combat-tracker');
    if (!el) return;

    if (!_combat || !_combat.combatants.length) {
      el.innerHTML = `
        <div class="combat-header" style="justify-content:space-between;">
          <div style="font-family:var(--font-display);font-size:1rem;color:var(--text-muted);">Nessuno scontro attivo</div>
          <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" onclick="Sessione.newCombat()">Nuovo Scontro</button>
            <button class="btn btn-secondary btn-sm" onclick="Sessione.addPGtoCombat()">Aggiungi Party</button>
            <button class="btn btn-secondary btn-sm" onclick="Sessione.addMonsterQuick()">Aggiungi Mostro</button>
          </div>
        </div>
        <div style="padding:var(--space-lg);text-align:center;color:var(--text-muted);">
          <div style="margin-bottom:var(--space-sm);opacity:0.4;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:2.4rem;height:2.4rem;" aria-hidden="true"><line x1="14.5" y1="17.5" x2="3" y2="6"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg></div>
          <div class="text-sm">Inizia un nuovo scontro o riprendi uno salvato qui sotto</div>
        </div>`;
      return;
    }

    sortCombatants();
    const round = _combat.round || 1;
    const turnoIdx = _combat.turno || 0;
    const activeCombatant = _sortedCombatants[turnoIdx] || null;

    el.innerHTML = `
      <!-- Header combat -->
      <div class="combat-header">
        <div style="display:flex;align-items:center;gap:var(--space-md);">
          <div class="combat-round-badge">Round ${round}</div>
          <div>
            <div style="font-family:var(--font-display);font-size:1rem;">${_combat.nome}</div>
            ${activeCombatant ? `<div class="text-xs text-muted">Turno di: <strong style="color:var(--accent-secondary);">${activeCombatant.nome}</strong></div>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:var(--space-sm);">
          <button class="btn btn-primary btn-sm" onclick="Sessione.nextTurn()">▶ Avanti</button>
          <button class="btn btn-secondary btn-sm" onclick="Sessione.addMonsterQuick()">+ Mostro</button>
          <button class="btn btn-secondary btn-sm" onclick="Sessione.rollAllInitiative()">Init tutti</button>
          <button class="btn btn-ghost btn-sm" onclick="Sessione.saveCombatSession()">Salva</button>
          <button class="btn btn-danger btn-sm" onclick="Sessione.endCombat()">■ Fine</button>
        </div>
      </div>

      <!-- Lista combatenti -->
      <div class="combat-list" id="combat-list">
        ${_sortedCombatants.map((c, idx) => renderCombatant(c, idx === turnoIdx)).join('')}
      </div>

      <!-- Footer: aggiungi -->
      <div class="combat-footer">
        <button class="btn btn-ghost btn-sm" onclick="Sessione.addPGtoCombat()">+ Party</button>
        <button class="btn btn-ghost btn-sm" onclick="Sessione.addMonsterQuick()">+ Mostro</button>
        <button class="btn btn-ghost btn-sm" onclick="Sessione.addNPCFromWorld()">+ NPC</button>
        <button class="btn btn-ghost btn-sm" onclick="Sessione.addCustomCombatant()">+ Homebrew</button>
      </div>
    `;
  };

  const renderCombatant = (c, isActive) => {
    const hpPct = c.maxHp > 0 ? Math.max(0, Math.round((c.hp / c.maxHp) * 100)) : 100;
    const hpColor = hpPct > 66 ? 'var(--accent-success)' : hpPct > 33 ? 'var(--accent-warning)' : 'var(--accent-danger)';
    const isDead = c.hp <= 0;
    const effectsHTML = (c.effects || []).map(ef =>
        `<span style="display:inline-flex;align-items:center;gap:2px;padding:1px 6px;background:rgba(93,164,90,0.12);border:1px solid var(--accent-secondary);border-radius:var(--radius-full);font-size:0.62rem;color:var(--accent-secondary);" title="${ef.nome} — ${ef.round} round rimasti">
          ⏱${ef.nome} <strong>${ef.round}r</strong>
        </span>`
      ).join('');
      const condizioniHTML = (c.condizioni || []).map(cond =>
      `<span class="badge badge-primary" style="font-size:0.6rem;cursor:pointer;" onclick="Sessione.removeCondizione('${c.id}','${cond}')" title="Rimuovi">${cond} ✕</span>`
    ).join('');

    return `
      <div class="combat-row ${isActive ? 'combat-row-active' : ''} ${isDead ? 'combat-row-dead' : ''}" id="combatant-${c.id}">
        <!-- Iniziativa -->
        <div class="combat-init-col">
          <input type="number" class="combat-init-input" value="${c.iniziativa}"
            onchange="Sessione.updateInit('${c.id}', this.value)"
            title="Iniziativa">
        </div>

        <!-- Nome e tipo -->
        <div class="combat-name-col">
          <div style="display:flex;align-items:center;gap:6px;">
            ${c.tipo === 'pg'
              ? `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-tertiary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
              : c.tipo === 'mostro'
              ? `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-danger)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
              : `<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="14.5" y1="17.5" x2="3" y2="6"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>`}
            <div>
              <div style="font-family:var(--font-display);font-size:0.88rem;${isDead ? 'text-decoration:line-through;opacity:0.5;' : ''}">${c.nome}</div>
              ${c.gs ? `<span class="text-xs text-muted">GS ${c.gs}</span>` : ''}
              ${c.concentrazione ? '<span class="badge badge-blue" style="font-size:0.6rem;">CONC.</span>' : ''}
            </div>
          </div>
          ${condizioniHTML ? `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;">${condizioniHTML}${effectsHTML}</div>` : ''}
        </div>

        <!-- HP -->
        <div class="combat-hp-col">
          <div style="display:flex;align-items:center;gap:4px;">
            <button class="btn btn-ghost btn-icon-sm" onclick="Sessione.changeHP('${c.id}', -1)" title="Danno">−</button>
            <div style="text-align:center;min-width:60px;">
              <input type="number" class="combat-hp-input" value="${c.hp}"
                onchange="Sessione.setHP('${c.id}', this.value)"
                style="color:${hpColor};" title="HP attuali">
              <div class="text-xs text-muted">/ ${c.maxHp || '∞'}</div>
            </div>
            <button class="btn btn-ghost btn-icon-sm" onclick="Sessione.changeHP('${c.id}', 1)" title="Cura">+</button>
          </div>
          <div class="combat-hp-bar">
            <div class="combat-hp-fill" style="width:${hpPct}%;background:${hpColor};"></div>
          </div>
        </div>

        <!-- CA -->
        <div class="combat-ca-col">
          <div class="text-xs text-muted">CA</div>
          <div style="font-family:var(--font-mono);font-size:0.9rem;">${c.ca || '—'}</div>
        </div>

        <!-- Azioni rapide -->
        <div class="combat-actions-col">
          ${c.tipo !== 'pg' ? `<button class="btn btn-ghost btn-icon-sm" title="Scheda mostro" onclick="Sessione.openCombatantSheet('${c.id}')"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></button>` : ''}
          <button class="btn btn-ghost btn-icon-sm" title="Aggiungi condizione" onclick="Sessione.openCondizioneModal('${c.id}')"><span style="color:#e74c3c;"><svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg></span></button>
          <button class="btn btn-ghost btn-icon-sm" title="Concentrazione" onclick="Sessione.toggleConcentrazione('${c.id}')" style="${c.concentrazione ? 'color:var(--accent-tertiary);' : ''}"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>
          <button class="btn btn-ghost btn-icon-sm" title="Danno rapido" onclick="Sessione.quickDamage('${c.id}')"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></button>
          <button class="btn btn-ghost btn-icon-sm" title="Note" onclick="Sessione.openNote('${c.id}')" style="${c.note ? 'color:var(--accent-secondary);' : ''}"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></button>
          <button class="btn btn-ghost btn-icon-sm" title="Rimuovi" onclick="Sessione.removeCombatant('${c.id}')"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
        </div>
      </div>`;
  };

  const prevTurn = () => {
    if (!_combat || !_sortedCombatants.length) return;
    _combat.turno = (_combat.turno - 1 + _sortedCombatants.length) % _sortedCombatants.length;
    if (_combat.turno === _sortedCombatants.length - 1) {
      _combat.round = Math.max(1, (_combat.round || 1) - 1);
    }
    saveCombat(_combat);
    renderCombat();
  };

  const changeHPSchermo = (id, delta) => {
    App.reloadActiveCampaign();
    const camp = App.getActiveCampaign();
    if (!camp?.activeCombat) return;
    _combat = camp.activeCombat;
    changeHP(id, delta);
  };

  const openCondizioneSchermo = (id) => {
    App.reloadActiveCampaign();
    const camp = App.getActiveCampaign();
    if (!camp?.activeCombat) return;
    _combat = camp.activeCombat;
    openCondizioneModal(id);
  };

  const nextTurn = () => {
    if (!_combat || !_sortedCombatants.length) return;

    if (_combat.turno === _sortedCombatants.length - 1) _tickEffects();
    _combat.turno = (_combat.turno + 1) % _sortedCombatants.length;
    if (_combat.turno === 0) {
      _combat.round++;
      Toast.show(`Round ${_combat.round} iniziato`, 'info');
    }

    _combat.combatants = _sortedCombatants.map(c => {
      const orig = _combat.combatants.find(x => x.id === c.id);
      return orig || c;
    });
    saveCombat(_combat);
    renderCombat();
    Debug.log(`Turno avanzato: round ${_combat.round}, turno ${_combat.turno}`);
  };

  const rollAllInitiative = () => {
    if (!_combat) return;
    _combat.combatants.forEach(c => {
      if (c.tipo !== 'pg') {
        c.iniziativa = rollInit(c.iniziativaBonus || 0);
      }
    });
    _combat.turno = 0;
    saveCombat(_combat);
    renderCombat();
    Toast.show('Iniziativa lanciata per tutti i mostri', 'success');
  };

  const updateInit = (id, val) => {
    if (!_combat) return;
    const c = _combat.combatants.find(x => x.id === id);
    if (c) { c.iniziativa = parseInt(val) || 0; saveCombat(_combat); sortCombatants(); renderCombat(); }
  };

  const _syncPartyHP = (combatant) => {
    if (combatant.tipo !== 'pg') return;
    const camp = App.getActiveCampaign();
    if (!camp) return;
    const party = [...(camp.party || [])];
    const pgIdx = party.findIndex(p => p.nome === combatant.nome);
    if (pgIdx === -1) return;
    party[pgIdx] = { ...party[pgIdx], hpAttuali: combatant.hp };
    App.saveActiveCampaign({ party });
    Debug.log(`Party sync: ${combatant.nome} HP → ${combatant.hp}`);
  };

  const changeHP = (id, delta) => {
    const c = _combat?.combatants.find(x => x.id === id);
    if (!c) return;
    const val = prompt(`${delta > 0 ? 'Cura' : 'Danno'} per ${c.nome} (HP attuali: ${c.hp}/${c.maxHp}):`, '');
    if (val === null) return;
    const amount = parseInt(val);
    if (isNaN(amount) || amount < 0) { Toast.show('Valore non valido', 'warning'); return; }
    c.hp = Math.max(0, Math.min(c.maxHp || 9999, c.hp + (delta > 0 ? amount : -amount)));
    if (c.hp === 0) Toast.show(`${c.nome} è a 0 PF!`, 'warning');
    saveCombat(_combat);
    _syncPartyHP(c);
    renderCombat();
    Debug.log(`${c.nome}: HP ${c.hp}/${c.maxHp}`);
  };

  const setHP = (id, val) => {
    const c = _combat?.combatants.find(x => x.id === id);
    if (!c) return;
    c.hp = Math.max(0, Math.min(c.maxHp || 9999, parseInt(val) || 0));
    saveCombat(_combat);
    _syncPartyHP(c);
    const bar = document.querySelector(`#combatant-${id} .combat-hp-fill`);
    const pct = c.maxHp > 0 ? Math.round((c.hp / c.maxHp) * 100) : 100;
    const col = pct > 66 ? 'var(--accent-success)' : pct > 33 ? 'var(--accent-warning)' : 'var(--accent-danger)';
    if (bar) { bar.style.width = pct + '%'; bar.style.background = col; }
  };

  const quickDamage = (id) => {
    const c = _combat?.combatants.find(x => x.id === id);
    if (!c) return;
    const val = prompt(`Danno rapido per ${c.nome} (HP: ${c.hp}/${c.maxHp}):`, '');
    if (val === null) return;
    const amount = parseInt(val);
    if (isNaN(amount)) return;
    c.hp = Math.max(0, c.hp - amount);
    if (c.hp === 0) Toast.show(`💀 ${c.nome} è a 0 PF!`, 'warning');
    saveCombat(_combat);
    _syncPartyHP(c);
    renderCombat();
  };

  const openCondizioneModal = (id) => {
    document.getElementById('cond-combatant-id').value = id;
    const c = _combat?.combatants.find(x => x.id === id);
    const attive = c?.condizioni || [];
    const el = document.getElementById('cond-list');
    if (el) {
      el.innerHTML = CONDIZIONI.map(cond => `
        <label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;font-size:0.85rem;">
          <input type="checkbox" value="${cond}" ${attive.includes(cond) ? 'checked' : ''}>
          ${cond}
        </label>`).join('');
    }
    document.getElementById('cond-modal-title').textContent = `Condizioni — ${c?.nome || ''}`;
    Modal.open('cond-modal');
  };

  const submitCondizioni = () => {
    const id = document.getElementById('cond-combatant-id')?.value;
    const c = _combat?.combatants.find(x => x.id === id);
    if (!c) return;
    const checked = [...document.querySelectorAll('#cond-list input:checked')].map(i => i.value);
    c.condizioni = checked;
    saveCombat(_combat);
    Modal.close('cond-modal');
    renderCombat();
  };

  const removeCondizione = (id, cond) => {
    const c = _combat?.combatants.find(x => x.id === id);
    if (!c) return;
    c.condizioni = (c.condizioni || []).filter(x => x !== cond);
    saveCombat(_combat);
    renderCombat();
  };

  const addEffect = () => {
    const id = document.getElementById('cond-combatant-id')?.value;
    const nome = document.getElementById('cond-effect-name')?.value?.trim();
    const round = parseInt(document.getElementById('cond-effect-rounds')?.value) || 1;
    if (!id || !nome) { Toast.show('Inserisci nome e round', 'warning'); return; }
    const c = _combat?.combatants.find(x => x.id === id);
    if (!c) return;
    if (!c.effects) c.effects = [];
    c.effects.push({ nome, round });
    saveCombat(_combat);

    openCondizioneModal(id);
  };

  const _removeEffect = (id, idx) => {
    const c = _combat?.combatants.find(x => x.id === id);
    if (!c || !c.effects) return;
    c.effects.splice(idx, 1);
    saveCombat(_combat);
    openCondizioneModal(id);
  };

  const _tickEffects = () => {
    if (!_combat?.combatants) return;
    const expired = [];
    _combat.combatants.forEach(c => {
      if (!c.effects?.length) return;
      c.effects = c.effects.map(ef => ({ ...ef, round: ef.round - 1 }));
      const just_expired = c.effects.filter(ef => ef.round <= 0);
      just_expired.forEach(ef => expired.push(c.nome + ': "' + ef.nome + '" scaduto'));
      c.effects = c.effects.filter(ef => ef.round > 0);
    });
    if (expired.length) Toast.show('⏱ ' + expired.join(' · '), 'info', 4000);
  };

  const toggleConcentrazione = (id) => {
    const c = _combat?.combatants.find(x => x.id === id);
    if (!c) return;
    c.concentrazione = !c.concentrazione;
    saveCombat(_combat);
    renderCombat();
  };

  const openNote = (id) => {
    const c = _combat?.combatants.find(x => x.id === id);
    if (!c) return;
    const nota = prompt(`Note per ${c.nome}:`, c.note || '');
    if (nota === null) return;
    c.note = nota;
    saveCombat(_combat);
    renderCombat();
  };

  const openCombatantSheet = async (id) => {
    const c = _combat?.combatants.find(x => x.id === id);
    if (!c) return;

    if (!MonsterCache.isLoaded()) {
      Toast.show('Caricamento mostri...', 'info', 2000);
      await MonsterCache.load();
    }

    const m = c.monsterId
      ? (MonsterCache.get(c.monsterId) || MonsterCache.getAll().find(x => x.nome === c.nome))
      : MonsterCache.getAll().find(x => x.nome === c.nome);

    const modStr = (v) => { const m = Math.floor((parseInt(v||10)-10)/2); return (m>=0?'+':'')+m; };

    const parseRoll = (desc) => {

      const match = desc?.match(/(\d+d\d+(?:[+\-]\d+)?)/i);
      return match ? match[1] : null;
    };

    const rollFormula = (formula, nomeDanno) => {
      const result = Dadi.roll(formula);
      if (result.error) return;

      Toast.show(`${nomeDanno}: ${result.total} (${formula})`, 'info', 4000);
      Debug.log(`Combat roll: ${nomeDanno} → ${result.total} [${formula}]`);
    };

    const car = m?.caratteristiche || {};
    const statAbbr = { forza:'FOR', destrezza:'DES', costituzione:'COS', intelligenza:'INT', saggezza:'SAG', carisma:'CAR' };

    const azioniHTML = (m?.azioni || []).map(a => {
      const formula = parseRoll(a.descrizione || a.desc || '');
      const nomeAz = a.nome || a.name || '?';
      const descAz = a.descrizione || a.desc || '';
      return `
        <div class="sb-action" style="cursor:${formula ? 'pointer' : 'default'};"
          ${formula ? `onclick="Sessione._rollAction('${formula}','${nomeAz.replace(/'/g,"\'")}',this)"` : ''}>
          <strong>${nomeAz}.</strong>
          <span class="text-secondary"> ${descAz}</span>
          ${formula ? `<span class="badge badge-muted" style="margin-left:4px;font-size:0.6rem;">🎲 ${formula}</span>` : ''}
        </div>`;
    }).join('') || '<div class="text-muted text-sm" style="padding:4px 0;">Nessuna azione disponibile</div>';

    const content = m ? `
      <div style="max-height:70vh;overflow-y:auto;">
        <div class="stat-block">
          <div class="stat-block-title">${m.nome}</div>
          <div class="stat-block-subtitle">${m.dimensione||''} ${m.tipo||''}${m.allineamento?', '+m.allineamento:''}</div>
          <div class="stat-block-divider"></div>
          <div class="stat-row"><strong>Classe Armatura</strong> <span>${m.classe_armatura||'—'}</span></div>
          <div class="stat-row"><strong>Punti Ferita</strong> <span>${m.punti_ferita?.media||'—'} ${m.punti_ferita?.formula?'('+m.punti_ferita.formula+')':''}</span></div>
          <div class="stat-row"><strong>Velocità</strong> <span>${Object.entries(m.velocita||{}).filter(([,v])=>v).map(([k,v])=>k==='camminata'?v:k+' '+v).join(', ')||'—'}</span></div>
          <div class="stat-block-divider"></div>
          <div class="stat-abilities">
            ${Object.entries(statAbbr).map(([key,abbr])=>{
              const s = car[key]||{};
              return `<div class="stat-ability-box">
                <div class="stat-ability-name">${abbr}</div>
                <div class="stat-ability-score">${s.punteggio||10}</div>
                <div class="stat-ability-mod">${modStr(s.punteggio||10)}</div>
              </div>`;
            }).join('')}
          </div>
          <div class="stat-block-divider"></div>
          ${m.grado_sfida ? `<div class="stat-row"><strong>GS</strong> <span>${m.grado_sfida.raw||m.grado_sfida.valore}</span></div>` : ''}
          <div class="stat-block-divider"></div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;">💡 Clicca su un\'azione con 🎲 per tirare i dadi automaticamente</div>
          <div class="sb-section-title">Azioni</div>
          ${azioniHTML}
          ${m.azioni_bonus?.length ? `<div class="sb-section-title" style="margin-top:8px;">Azioni Bonus</div>${m.azioni_bonus.map(a=>{
            const formula = parseRoll(a.descrizione||'');
            return `<div class="sb-action" style="cursor:${formula?'pointer':'default'};" ${formula?`onclick="Sessione._rollAction('${formula}','${(a.nome||'').replace(/'/g,"\'")}',this)"`:''}>
              <strong>${a.nome||''}.</strong> <span class="text-secondary">${a.descrizione||''}</span>
              ${formula?`<span class="badge badge-muted" style="margin-left:4px;font-size:0.6rem;">🎲 ${formula}</span>`:''}
            </div>`;
          }).join('')}` : ''}
          ${m.reazioni?.length ? `<div class="sb-section-title" style="margin-top:8px;">Reazioni</div>${m.reazioni.map(a=>`<div class="sb-action"><strong>${a.nome||''}.</strong> <span class="text-secondary">${a.descrizione||''}</span></div>`).join('')}` : ''}
        </div>
      </div>` :
      `<div class="empty-state"><div class="empty-state-icon">📋</div>
        <h3>${c.nome}</h3>
        <p class="text-sm text-muted">Mostro custom — nessuna scheda nel Compendio</p>
        ${c.gs ? `<p class="text-sm">GS ${c.gs} · CA ${c.ca} · PF ${c.hp}/${c.maxHp}</p>` : ''}
      </div>`;

    const existingModal = document.getElementById('combat-sheet-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'combat-sheet-modal';
    modal.style.cssText = 'display:flex;';
    modal.innerHTML = `<div class="modal" style="max-width:540px;">
      <div class="modal-header">
        <h2 style="font-family:var(--font-display);font-size:1rem;">${c.nome}</h2>
        <button class="btn btn-ghost btn-icon" onclick="document.getElementById('combat-sheet-modal')?.remove()" aria-label="Chiudi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="modal-body" style="padding:0;">${content}</div>
    </div>`;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    Debug.log(`Combat sheet: ${c.nome} (${m ? 'da compendio' : 'custom'})`);
  };

  const _rollAction = (formula, nome, el) => {
    const result = Dadi.roll(formula);
    if (result.error) { Toast.show('Formula non valida: ' + formula, 'warning'); return; }

    const existing = el.querySelector('.action-roll-result');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'action-roll-result';
    div.style.cssText = 'margin-top:4px;padding:4px 8px;background:var(--bg-tertiary);border-radius:var(--radius-sm);font-family:var(--font-mono);font-size:0.85rem;display:flex;align-items:center;gap:8px;';
    div.innerHTML = `<span style="color:var(--accent-secondary);font-weight:700;font-size:1.1rem;">${result.total}</span><span style="color:var(--text-muted);font-size:0.72rem;">${result.detail}</span><span style="color:var(--text-muted);font-size:0.7rem;">${nome}</span>`;
    el.appendChild(div);

    div.style.animation = 'diceResult 0.3s ease';
    Storage.addDiceRoll(formula, result.rolls, result.total);
    Debug.log(`${nome}: ${result.total} [${formula}] → ${result.detail}`);
  };

  const addCombatantToCurrent = (combatant) => {
    if (!_combat) newCombat();
    _combat.combatants.push({
      ...combatant,
      id: combatant.id || 'comb_' + Date.now(),
      iniziativa: rollInit(0),
      condizioni: [],
      note: '',
      concentrazione: false,
    });
  };

  const addMonsterDirect = (dati) => {

    if (!_combat) newCombat();
    const bonusInit = dati.iniziativaBonus || 0;
    const init = rollInit(bonusInit);
    _combat.combatants.push({
      id: 'c_enc_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
      nome: dati.nome || 'Mostro',
      tipo: 'mostro',
      hp: dati.hp || 10, maxHp: dati.maxHp || dati.hp || 10,
      ca: dati.ca || 12,
      iniziativa: init, iniziativaBonus: bonusInit,
      condizioni: [], concentrazione: false, note: '',
    });
    saveCombat(_combat);
    renderCombat();
  };

  const addMonsterQuick = () => {
    document.getElementById('monster-search-input').value = '';
    document.getElementById('monster-search-results').innerHTML = '<div class="text-muted text-sm">Digita per cercare...</div>';
    Modal.open('monster-search-modal');
    setTimeout(() => document.getElementById('monster-search-input')?.focus(), 100);
  };

  const searchMonster = () => {
    const q = document.getElementById('monster-search-input')?.value?.toLowerCase() || '';
    const el = document.getElementById('monster-search-results');
    if (!el) return;
    if (!q) { el.innerHTML = '<div class="text-muted text-sm">Digita per cercare...</div>'; return; }

    if (!MonsterCache.isLoaded()) {
      el.innerHTML = '<div class="text-muted text-sm">Caricamento mostri...</div>';
      MonsterCache.load().then(() => searchMonster());
      return;
    }
    const results = MonsterCache.search(q);

    if (!results.length) { el.innerHTML = '<div class="text-muted text-sm">Nessun mostro trovato</div>'; return; }

    el.innerHTML = results.map(m => {
      const gs = m.grado_sfida?.raw || '?';
      const pf = m.punti_ferita?.media || '?';
      return `<div class="comp-row" onclick="Sessione.addMonsterFromCompendio('${m.id}')">
        <div class="comp-row-main">
          <span class="comp-row-name">${m.nome}</span>
          <span class="comp-row-meta">${m.tipo || ''}</span>
        </div>
        <div class="comp-row-stats">
          <span class="comp-stat-pill">GS ${gs}</span>
          <span class="comp-stat-pill">PF ${pf}</span>
        </div>
      </div>`;
    }).join('');
  };

  const addNPCFromWorld = () => {
    App.reloadActiveCampaign();
    const camp = App.getActiveCampaign();
    const npcs = camp?.npcs || [];

    if (!npcs.length) {
      Toast.show('Nessun NPC nel Mondo. Aggiungili dalla sezione Mondo → PNG.', 'info', 3000);
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'display:flex;';
    modal.innerHTML = `<div class="modal" style="max-width:420px;">
      <div class="modal-header">
        <h2 style="font-family:var(--font-display);font-size:1rem;">👤 Aggiungi NPC al Combat</h2>
        <button class="btn btn-ghost btn-icon" onclick="this.closest('.modal-overlay').remove()" aria-label="Chiudi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="modal-body" style="padding:0;max-height:50vh;overflow-y:auto;">
        <div class="comp-filters" style="padding:8px;border-bottom:1px solid var(--border);">
          <input type="text" class="form-input" placeholder="🔍 Cerca NPC..." style="flex:1;"
            oninput="this.closest('.modal').querySelectorAll('.comp-row').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(this.value.toLowerCase())?'':'none')">
        </div>
        ${npcs.map(npc => `
          <div class="comp-row" onclick="Sessione._addNPCById('${npc.id}');this.closest('.modal-overlay').remove()">
            <div class="comp-row-main">
              <span class="comp-row-name">${npc.name || 'NPC senza nome'}</span>
              <span class="comp-row-meta">${[npc.race, npc.role].filter(Boolean).join(' · ')}</span>
            </div>
            <div class="comp-row-stats">
              ${npc.ca ? `<span class="comp-stat-pill">CA ${npc.ca}</span>` : ''}
              ${npc.hpMax ? `<span class="comp-stat-pill">PF ${npc.hpMax}</span>` : ''}
            </div>
          </div>`).join('')}
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Chiudi</button>
      </div>
    </div>`;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  };

  const _addNPCById = (id) => {
    App.reloadActiveCampaign();
    const camp = App.getActiveCampaign();
    const npc = (camp?.npcs || []).find(n => n.id === id);
    if (!npc) return;

    if (!_combat) newCombat();

    const nome = npc.name || 'NPC';
    const pf = parseInt(npc.hpMax || npc.hp) || 20;
    const ca = parseInt(npc.ca) || 12;
    const bonusInit = Math.floor(((parseInt(npc.dex) || 10) - 10) / 2);
    const init = rollInit(bonusInit);

    _combat.combatants.push({
      id: 'c_npc_' + Date.now(),
      nome, tipo: 'mostro',
      hp: pf, maxHp: pf, ca,
      iniziativa: init, iniziativaBonus: bonusInit,
      condizioni: [], concentrazione: false, note: npc.role || '',
      npcId: id,
    });
    saveCombat(_combat);
    renderCombat();
    Toast.show(`${nome} aggiunto al combat (Init: ${init})`, 'success');
  };

  const addHomebrewMonster = (id) => {
    const h = Compendio._getHB ? Compendio._getHB().find(x => x.id === id) : null;

    const nome = h?.nome || 'Mostro Homebrew';
    const pf = parseInt(h?.pf) || (h?.punti_ferita?.media) || 20;
    const ca = parseInt(h?.ca) || (h?.classe_armatura) || 12;
    const gs = parseFloat(h?.gs) || (h?.grado_sfida?.valore) || 1;
    const bonusInit = Math.floor(((parseInt(h?.stat1?.split('/')[1]) || 10) - 10) / 2);

    if (!_combat) newCombat();
    const init = rollInit(bonusInit);
    const combatant = {
      id: 'c_hb_' + Date.now(),
      nome, tipo: 'mostro',
      hp: pf, maxHp: pf, ca,
      iniziativa: init, iniziativaBonus: bonusInit,
      condizioni: [], concentrazione: false, note: '',
      homebrewId: id,
    };
    _combat.combatants.push(combatant);
    saveCombat(_combat);
    renderCombat();
    Toast.show(`${nome} aggiunto al combat (Init: ${init})`, 'success');
  };

  const addMonsterFromCompendio = (id) => {
    const m = MonsterCache.get(id) || Compendio?.getData()?.monsters?.find(x => x.id === id);
    if (!m) return;
    if (!_combat) newCombat();

    const qty = parseInt(prompt(`Quanti ${m.nome} aggiungere?`, '1')) || 1;
    const pf = m.punti_ferita?.media || 10;

    for (let i = 0; i < qty; i++) {
      const suffix = qty > 1 ? ` #${i + 1}` : '';
      _combat.combatants.push({
        id: 'comb_' + Date.now() + '_' + i,
        nome: m.nome + suffix,
        tipo: 'mostro',
        monsterId: m.id,
        hp: pf,
        maxHp: pf,
        ca: m.classe_armatura || 10,
        gs: m.grado_sfida?.raw || '?',
        iniziativa: rollInit(m.caratteristiche?.destrezza?.modificatore || 0),
        iniziativaBonus: m.caratteristiche?.destrezza?.modificatore || 0,
        condizioni: [],
        note: '',
        concentrazione: false,
      });
    }
    saveCombat(_combat);
    Modal.close('monster-search-modal');
    renderCombat();
    Toast.show(`${qty > 1 ? qty + '× ' : ''}${m.nome} aggiunto`, 'success');
    Debug.log(`Mostro aggiunto al combat: ${m.nome} x${qty}`);
  };

  const addCustomCombatant = () => {

    ['custom-nome','custom-tipo','custom-hp','custom-ca','custom-gs','custom-init-bonus','custom-qty']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = el.id === 'custom-qty' ? '1' : el.id === 'custom-tipo' ? 'mostro' : ''; });
    Modal.open('custom-combatant-modal');
    setTimeout(() => document.getElementById('custom-nome')?.focus(), 100);
  };

  const submitCustomCombatant = () => {
    const nome = document.getElementById('custom-nome')?.value?.trim();
    if (!nome) { Toast.show('Inserisci un nome', 'warning'); return; }
    const hp  = parseInt(document.getElementById('custom-hp')?.value)  || 10;
    const ca  = parseInt(document.getElementById('custom-ca')?.value)  || 10;
    const gs  = document.getElementById('custom-gs')?.value?.trim()    || '';
    const bon = parseInt(document.getElementById('custom-init-bonus')?.value) || 0;
    const qty = Math.max(1, Math.min(20, parseInt(document.getElementById('custom-qty')?.value) || 1));
    const tipo = document.getElementById('custom-tipo')?.value || 'mostro';

    if (!_combat) newCombat();

    for (let i = 0; i < qty; i++) {
      const suffix = qty > 1 ? ` #${i + 1}` : '';
      _combat.combatants.push({
        id: 'comb_' + Date.now() + '_' + i,
        nome: nome + suffix,
        tipo,
        hp, maxHp: hp, ca, gs,
        iniziativa: rollInit(bon),
        iniziativaBonus: bon,
        condizioni: [], note: '', concentrazione: false,
      });
    }
    saveCombat(_combat);
    Modal.close('custom-combatant-modal');
    renderCombat();
    Toast.show(`${qty > 1 ? qty + '× ' : ''}${nome} aggiunto`, 'success');
    Debug.log(`Combatente custom: ${nome} x${qty}`);
  };

  const removeCombatant = (id) => {
    if (!_combat) return;
    _combat.combatants = _combat.combatants.filter(c => c.id !== id);
    if (_combat.turno >= _combat.combatants.length) _combat.turno = 0;
    saveCombat(_combat);
    renderCombat();
  };

  const saveCombatSession = () => {
    if (!_combat) return;
    const camp = App.getActiveCampaign();
    if (!camp) return;
    const sessions = [...(camp.combatSessions || [])];
    const existing = sessions.findIndex(s => s.id === _combat.id);
    const snapshot = { ..._combat, savedAt: Date.now(), status: 'salvato' };
    if (existing !== -1) sessions[existing] = snapshot;
    else sessions.push(snapshot);
    App.saveActiveCampaign({ combatSessions: sessions });
    Toast.show('Scontro salvato', 'success');
    renderSavedSessions();
    Debug.log('Combat salvato');
  };

  const endCombat = () => {
    openConfirmModal('Terminare lo scontro?', 'Lo scontro verrà salvato e l\'area combat si svuoterà.', () => {
      saveCombatSession();
      _combat.status = 'concluso';
      App.saveActiveCampaign({ activeCombat: null });
      _combat = null;
      _sortedCombatants = [];
      renderCombat();
      renderSavedSessions();
      Toast.show('Scontro concluso', 'info');
    });
  };

  const renderSavedSessions = () => {
    const el = document.getElementById('saved-sessions-list');
    if (!el) return;
    const camp = App.getActiveCampaign();
    const sessions = (camp?.combatSessions || []).slice().reverse().slice(0, 5);
    if (!sessions.length) {
      el.innerHTML = '<div class="text-muted text-sm" style="padding:8px;">Nessuno scontro salvato</div>';
      return;
    }
    el.innerHTML = sessions.map(s => {
      const data = new Date(s.savedAt || s.iniziataAt).toLocaleDateString('it-IT');
      return `<div class="comp-row" style="cursor:default;">
        <div class="comp-row-main">
          <span class="comp-row-name">${s.nome}</span>
          <span class="comp-row-meta">${data} · Round ${s.round} · ${s.combatants?.length || 0} combatenti</span>
        </div>
        <div class="comp-row-stats">
          <button class="btn btn-ghost btn-sm" onclick="Sessione.loadCombatSession('${s.id}')">Riprendi</button>
        </div>
      </div>`;
    }).join('');
  };

  const loadCombatSession = (id) => {
    const camp = App.getActiveCampaign();
    const session = (camp?.combatSessions || []).find(s => s.id === id);
    if (!session) return;
    _combat = { ...session, status: 'attivo' };
    saveCombat(_combat);
    renderCombat();
    Toast.show(`Scontro "${session.nome}" ripreso`, 'success');
  };

  return {
    init,
    addPG, editPG, deletePG, submitPG, openPGModal, addPGtoCombat, toggleInspirazione,
    newCombat, nextTurn, prevTurn, changeHPSchermo, openCondizioneSchermo, addEffect, _removeEffect, rollAllInitiative, updateInit,
    changeHP, setHP, quickDamage,
    openCondizioneModal, submitCondizioni, removeCondizione,
    toggleConcentrazione, openNote,
    addMonsterQuick, addMonsterDirect, searchMonster, addMonsterFromCompendio, addHomebrewMonster,
    addNPCFromWorld, _addNPCById,
    addCustomCombatant, submitCustomCombatant, removeCombatant,
    saveCombatSession, endCombat, loadCombatSession,
    openCombatantSheet, _rollAction,
  };
})();

/* ============================================================
   COMPENDIO.JS — Mostri, Oggetti Magici, Equipaggiamento, Regole
   ============================================================ */
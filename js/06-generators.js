const Generatori = {

  _GEN_DEFS: {
    npc:       { label: 'PNG Completo',         emoji: '👤' },
    meteo:     { label: 'Meteo',                emoji: '🌤️' },
    sensori:   { label: 'Rumori & Odori',       emoji: '👁️' },
    rumors:    { label: 'Voci di Corridoio',    emoji: '💬' },
    accento:   { label: 'Voce & Accento',       emoji: '🎭' },
    shop:      { label: 'Shop Generator',       emoji: '🏪' },
    viaggio:   { label: 'Calcolatore Viaggio',  emoji: '🧭' },
    loot:      { label: 'Loot Generator',       emoji: '💰' },
    biblioteca:{ label: 'Biblioteca',           emoji: '📚' },
    nomi:      { label: 'Generatore Nomi',      emoji: '📛' },
    incontri:  { label: 'Incontri Casuali',     emoji: '⚠️' },
    follia:    { label: 'Follia',               emoji: '🌀' },
    encounter:  { label: 'Encounter Builder',    emoji: '⚔️' },
    descrizione:  { label: 'Descrizione Luoghi',    emoji: '🏙️' },
    nomi_luoghi:  { label: 'Nomi Luoghi',             emoji: '🗺️' },
    ganci:        { label: 'Ganci Narrativi',          emoji: '🎣' },
    oracolo:      { label: 'Oracolo',                  emoji: '🔮' },
    missioni:     { label: 'Missioni Secondarie',      emoji: '📜' },
  },

  _getEnabledGen: () => {
    const camp = App.getActiveCampaign();
    const saved = camp?.generatoriAbilitati;
    if (!saved) return Object.keys(Generatori._GEN_DEFS);
    return saved;
  },

  _saveEnabledGen: (list) => {
    App.saveActiveCampaign({ generatoriAbilitati: list });
  },

  applyVisibility: () => {
    const enabled = Generatori._getEnabledGen();
    document.querySelectorAll('.gen-card[data-gen-id]').forEach(card => {
      const id = card.dataset.genId;

      if (['encounter','descrizione','nomi_luoghi','ganci','oracolo','missioni','loot'].includes(id)) { card.style.display = ''; return; }
      card.style.display = enabled.includes(id) ? '' : 'none';
    });
  },

  toggleSettings: () => {
    const panel = document.getElementById('gen-settings-panel');
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    if (!isOpen) {
      Generatori._renderToggles();
      panel.style.display = '';
      document.getElementById('gen-settings-btn').textContent = 'Chiudi';
    } else {
      panel.style.display = 'none';
      document.getElementById('gen-settings-btn').textContent = '⚙️ Personalizza';
    }
  },

  _renderToggles: () => {
    const list = document.getElementById('gen-toggles-list');
    if (!list) return;
    const enabled = Generatori._getEnabledGen();
    list.innerHTML = Object.entries(Generatori._GEN_DEFS).map(([id, def]) => {
      const on = enabled.includes(id);
      return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 8px;border-radius:var(--radius-sm);background:var(--bg-secondary);font-size:0.82rem;">
        <input type="checkbox" data-gen-toggle="${id}" ${on?'checked':''} onchange="Generatori._onToggle('${id}',this.checked)">
        <span>${def.emoji} ${def.label}</span>
      </label>`;
    }).join('');
  },

  _onToggle: (id, checked) => {
    let enabled = [...Generatori._getEnabledGen()];
    if (checked && !enabled.includes(id)) enabled.push(id);
    if (!checked) enabled = enabled.filter(x => x !== id);
    Generatori._saveEnabledGen(enabled);
    Generatori.applyVisibility();
  },

  toggleAll: (value) => {
    const all = Object.keys(Generatori._GEN_DEFS);
    Generatori._saveEnabledGen(value ? all : []);
    Generatori._renderToggles();
    Generatori.applyVisibility();
  },

  rollNPC: async () => {
    const t = await loadTabelle();
    if (!t) return;

    const tonoFiltro = document.getElementById('gen-npc-tono')?.value || 'tutti';
    const crScelto   = document.getElementById('gen-npc-cr')?.value || 'auto';
    const dettaglio  = document.getElementById('gen-npc-dettaglio')?.value || 'base';

    let archetipiPool = t.archetipi || [];
    if (tonoFiltro !== 'tutti') {
      const filtrati = archetipiPool.filter(a => a.tono?.includes(tonoFiltro));
      if (filtrati.length) archetipiPool = filtrati;
    }
    const archetipo = rnd(archetipiPool);

    const razza = rnd(t.razze);
    const razzaKey = razza.toLowerCase().replace(/['\s]/g, k => k === "'" ? '' : '_').replace(/mezz_orco.*/, 'mezz_orco');
    const nomiPool = t.nomi[razzaKey] || t.nomi['umano'];
    const nome = rnd(nomiPool);

    const prof = archetipo.mestieri?.length ? rnd(archetipo.mestieri) : rnd(t.professioni);

    const STAT_PROF = {

      'Guardia':       {for:14,des:11,cos:13,int:10,sag:11,car:10, arma:'Spada corta', armatura:'Armatura di cuoio'},
      'Soldato':       {for:15,des:12,cos:14,int:10,sag:12,car:10, arma:'Spada lunga', armatura:'Cotta di maglia'},
      'Mercenario':    {for:15,des:13,cos:14,int:11,sag:11,car:12, arma:'Ascia da guerra', armatura:'Cotta di maglia'},
      'Cavaliere':     {for:16,des:11,cos:15,int:11,sag:12,car:13, arma:'Lancia', armatura:'Armatura a piastre'},
      'Cacciatore':    {for:12,des:15,cos:12,int:12,sag:14,car:10, arma:'Arco lungo', armatura:'Armatura di cuoio'},
      'Assassino':     {for:11,des:17,cos:12,int:13,sag:13,car:12, arma:'Pugnale', armatura:'Armatura di cuoio'},

      'Mago':          {for:8, des:13,cos:12,int:17,sag:12,car:11, arma:'Bastone', armatura:'Nessuna'},
      'Stregone':      {for:9, des:14,cos:13,int:12,sag:12,car:17, arma:'Bastone', armatura:'Nessuna'},
      'Chierico':      {for:13,des:10,cos:13,int:12,sag:16,car:13, arma:'Mazza', armatura:'Armatura a piastre'},
      'Druido':        {for:11,des:13,cos:12,int:14,sag:17,car:11, arma:'Bastone', armatura:'Nessuna'},
      'Bardo':         {for:10,des:14,cos:11,int:13,sag:12,car:17, arma:'Stocco', armatura:'Armatura di cuoio'},
      'Strega':        {for:9, des:14,cos:11,int:15,sag:15,car:14, arma:'Bastone', armatura:'Nessuna'},

      'Mercante':      {for:10,des:11,cos:11,int:13,sag:12,car:16, arma:'Pugnale', armatura:'Nessuna'},
      'Taverniere':    {for:13,des:10,cos:14,int:11,sag:12,car:15, arma:'Mazza da osteria', armatura:'Nessuna'},
      'Fabbro':        {for:16,des:10,cos:15,int:11,sag:10,car:10, arma:'Martello da fabbro', armatura:'Grembiule di cuoio'},
      'Ladro':         {for:11,des:17,cos:12,int:13,sag:12,car:13, arma:'Pugnale', armatura:'Armatura di cuoio'},
      'Nobile':        {for:10,des:12,cos:11,int:14,sag:13,car:16, arma:'Stocco', armatura:'Nessuna'},
      'Contadino':     {for:13,des:10,cos:14,int:9, sag:11,car:9,  arma:'Falce', armatura:'Nessuna'},
      'Pescatore':     {for:12,des:13,cos:13,int:10,sag:12,car:9,  arma:'Fiocina', armatura:'Nessuna'},
      'Mendicante':    {for:9, des:12,cos:10,int:10,sag:13,car:11, arma:'Bastone', armatura:'Nessuna'},
      'Guaritore':     {for:9, des:12,cos:11,int:14,sag:16,car:13, arma:'Bastone', armatura:'Nessuna'},
      'Sacerdote':     {for:11,des:10,cos:12,int:13,sag:16,car:14, arma:'Mazza', armatura:'Armatura a piastre'},
      'Esploratore':   {for:12,des:16,cos:13,int:13,sag:15,car:11, arma:'Spada corta', armatura:'Armatura di cuoio'},
      'Marinaio':      {for:13,des:14,cos:13,int:11,sag:12,car:11, arma:'Sciabola', armatura:'Nessuna'},
      'Bibliotecario': {for:8, des:11,cos:10,int:17,sag:14,car:11, arma:'Bastone', armatura:'Nessuna'},
      'Alchimista':    {for:9, des:13,cos:11,int:17,sag:13,car:11, arma:'Pugnale', armatura:'Nessuna'},
      'Spia':          {for:11,des:16,cos:12,int:15,sag:14,car:15, arma:'Pugnale', armatura:'Armatura di cuoio'},
      'Criminale':     {for:13,des:15,cos:13,int:12,sag:11,car:13, arma:'Pugnale', armatura:'Armatura di cuoio'},
    };

    const statProf = STAT_PROF[prof] || {for:10,des:10,cos:10,int:10,sag:10,car:10,arma:'Nessuna',armatura:'Nessuna'};

    const statVar = (v) => Math.max(6, Math.min(20, v + (Math.floor(Math.random()*3)-1)));
    const charStats = {
      for: statVar(statProf.for), des: statVar(statProf.des), cos: statVar(statProf.cos),
      int: statVar(statProf.int), sag: statVar(statProf.sag), car: statVar(statProf.car),
      arma: statProf.arma, armatura: statProf.armatura,
    };
    const mod = (v) => Math.floor((v-10)/2);
    const modStr = (v) => (mod(v)>=0?'+':'')+mod(v);

    const tratto = archetipo.tratti_coerenti?.length ? rnd(archetipo.tratti_coerenti) : rnd(t.tratti);

    const segreto = rnd(t.segreti);
    const desiderio = rnd(t.desideri);
    const obiettivo = rnd(t.obiettivi || []);
    const apparenza = rnd(t.apparenza || []);
    const voce = rnd(t.accenti_voci.voce);
    const tic = rnd(t.accenti_voci.tic);

    const cadenza = rnd(t.cadenza_verbale || []);
    const saluto = rnd(t.saluto_caratteristico || []);
    const argomentoRicorrente = rnd(t.argomento_ricorrente || []);

    let difetto = '', legame = '', background = '', hookSituazionale = '', legameTesto = '';
    if (dettaglio === 'espandi') {
      difetto = rnd(t.difetti || []);
      background = rnd(t.background_npc || []);
      hookSituazionale = rnd(t.hook_situazionali || []);

      const camp = App.getActiveCampaign();
      const tipiLegame = Object.keys(t.tipi_legame || {});
      const tipoLegame = rnd(tipiLegame);
      const fraseLegame = rnd(t.tipi_legame[tipoLegame]);

      let target = null;
      const pool = [];
      (camp?.factions || []).forEach(f => pool.push(f.name));
      (camp?.npcs || []).forEach(n => pool.push(n.name));
      (camp?.luoghi || []).forEach(l => pool.push(l.name));
      if (pool.length) target = rnd(pool);
      else target = rnd(t.legame_target_fallback || ['una gilda locale']);

      legameTesto = `${fraseLegame} ${target}`;
      legame = legameTesto;
    }

    const crTable = t.cr_stat_table || {};
    const crKeys = Object.keys(crTable);
    const cr = crScelto === 'auto' ? '0' : crScelto;
    const rigaCR = crTable[cr] || crTable['0'];

    const ruoloKey = archetipo.ruolo_combattivo || 'civile';
    const ruoloInfo = (t.ruoli_combattivi || {})[ruoloKey] || { label: 'Civile', num_attacchi: 0, descrizione: '' };
    const abilitaPool = (t.abilita_speciali_per_ruolo || {})[ruoloKey] || [];
    const abilitaSpeciale = abilitaPool.length ? rnd(abilitaPool) : null;

    const acVariazione = Math.floor(Math.random() * 3) - 1;
    const ac = Math.max(8, rigaCR.ac + acVariazione);

    const pf = Math.floor(Math.random() * (rigaCR.pf_max - rigaCR.pf_min + 1)) + rigaCR.pf_min;

    const numAttacchi = Math.max(1, ruoloInfo.num_attacchi || 1);
    const dannoTotale = Math.floor(Math.random() * (rigaCR.danno_max - rigaCR.danno_min + 1)) + rigaCR.danno_min;
    const dannoPerAttacco = Math.max(1, Math.round(dannoTotale / numAttacchi));

    const dannoADado = (media) => {
      const dadi = [{f:4,m:2.5},{f:6,m:3.5},{f:8,m:4.5},{f:10,m:5.5},{f:12,m:6.5}];

      let best = dadi[0], bestDiff = 999;
      for (const d of dadi) {
        const diff = Math.abs(media - d.m);
        if (diff < bestDiff) { best = d; bestDiff = diff; }
      }
      const mod = Math.round(media - best.m);
      const modStr = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : '';
      return { dado: `1d${best.f}${modStr}`, faces: best.f, mod };
    };
    const dadoAttacco = dannoADado(dannoPerAttacco);

    const nomiArmaPerRuolo = {
      brute:      ['Ascia a due mani','Mazza ferrata','Martello da guerra','Falcione','Clava gigante'],
      skirmisher: ['Spada corta','Pugnale','Balestra a mano','Daga avvelenata','Lama gemella'],
      artillery:  ['Arco lungo','Balestra pesante','Giavellotto','Fionda','Freccette'],
      controller: ['Bastone arcano','Scettro maledetto','Frusta','Catena','Simbolo sacro'],
      soldier:    ['Spada lunga','Lancia','Ascia da battaglia','Mazzafrusto','Alabarda'],
      civile:     ['Bastone','Coltello da cucina','Attrezzo da lavoro'],
    };
    const nomeArma = (() => {
      const pool = nomiArmaPerRuolo[ruoloKey] || nomiArmaPerRuolo.civile;
      return pool[Math.floor(Math.random() * pool.length)];
    })();

    const tipoDannoPerRuolo = {
      brute: 'taglio', skirmisher: 'perforazione', artillery: 'perforazione',
      controller: 'necrotico/psichico', soldier: 'taglio', civile: 'contundente',
    };
    const tipoDanno = tipoDannoPerRuolo[ruoloKey] || 'contundente';

    const fasceRuolo = (t.caratteristiche_per_ruolo || {})[ruoloKey] || { alta: [], media: [], basse: [] };
    const rangeC = t.range_caratteristiche || { alta: [14,18], media: [11,13], bassa: [8,10] };
    const statKeys = ['forza','destrezza','costituzione','intelligenza','saggezza','carisma'];
    const stats = {};
    statKeys.forEach(k => {
      let range;
      if (fasceRuolo.alta?.includes(k)) range = rangeC.alta;
      else if (fasceRuolo.media?.includes(k)) range = rangeC.media;
      else if (ruoloKey === 'civile') range = [9, 11];
      else range = rangeC.bassa;
      stats[k] = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    });

    const icon = ['👨','👩','🧙','⚔️','🗡️','🛡️','🎭','🧝','🐉'][Math.floor(Math.random()*9)];

    Generatori._lastGeneratedNPC = {
      name: nome, race: razza, job: prof, icon,
      archetipo: archetipo.nome,
      trait: tratto, secret: segreto, wants: desiderio,
      voice: voce, tic, cadenza, saluto, argomentoRicorrente,
      obiettivo, difetto, legame: legameTesto, apparenza, background,
      hookSituazionale,
      ruoloCombattivo: ruoloInfo.label, abilitaSpeciale,
      nomeArma, tipoDanno, dadoAttacco: dadoAttacco.dado,

      str: charStats.for, dex: charStats.des, con: charStats.cos,
      int_: charStats.int, wis: charStats.sag, cha: charStats.car,
      nomeArma: charStats.arma || nomeArma, armatura: charStats.armatura,
      ac, hp: pf, cr, dannoPerAttacco, numAttacchi, attaccoBonus: rigaCR.attacco, saveDC: rigaCR.save_dc,
      relation: 50,
    };

    const el = document.getElementById('gen-npc-result');
    const saveBtn = document.getElementById('gen-npc-save-btn');
    if (!el) return;
    if (saveBtn) saveBtn.style.display = '';

    const espansoHTML = dettaglio === 'espandi' ? `
          <div class="text-sm" style="margin-bottom:4px;"><strong>Background:</strong> ${background}</div>
          <div class="text-sm" style="margin-bottom:4px;"><strong>Legame:</strong> ${legameTesto}</div>
          <div class="text-sm" style="margin-bottom:4px;"><strong>Difetto:</strong> ${difetto}</div>
          <div class="text-sm" style="margin-bottom:4px;"><strong>🎬 Ora sta facendo:</strong> <em>${hookSituazionale}</em></div>` : '';

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
        <!-- Colonna sinistra: Ruolo narrativo -->
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:var(--space-sm);">
            <span style="font-size:1.8rem;">${icon}</span>
            <div>
              <div style="font-family:var(--font-display);font-size:1.1rem;">${nome}</div>
              <div><span class="badge badge-muted">${razza}</span> <span class="badge badge-gold">${prof}</span></div>
              <div class="text-xs text-muted" style="margin-top:2px;">🎭 ${archetipo.nome}</div>
            </div>
          </div>
          <div class="text-sm" style="margin-bottom:4px;"><strong>Apparenza:</strong> ${apparenza}</div>
          <div class="text-sm" style="margin-bottom:4px;"><strong>Tratto:</strong> ${tratto}</div>
          <div class="text-sm" style="margin-bottom:4px;"><strong>Voce:</strong> ${voce} · <em>${tic}</em></div>
          <div class="text-sm" style="margin-bottom:4px;"><strong>Cadenza:</strong> ${cadenza}</div>
          <div class="text-sm" style="margin-bottom:4px;"><strong>Saluto:</strong> ${saluto}</div>
          <div class="text-sm" style="margin-bottom:4px;"><strong>Argomento ricorrente:</strong> ${argomentoRicorrente}</div>
          <div class="text-sm" style="margin-bottom:4px;"><strong>Obiettivo:</strong> ${obiettivo}</div>
          <div class="text-sm" style="margin-bottom:4px;"><strong>Desiderio dai PG:</strong> ${desiderio}</div>
          ${espansoHTML}
          <div class="card card-gold" style="padding:6px 10px;margin-top:6px;">
            <div class="text-xs" style="color:var(--accent-secondary);"><strong>🔒 Segreto:</strong> ${segreto}</div>
          </div>
        </div>

        <!-- Colonna destra: Stat block -->
        <div class="stat-block">
          <div class="stat-block-title">${nome}</div>
          <div class="stat-block-subtitle">${razza} · ${ruoloInfo.label} · CR ${cr}</div>
          <div class="stat-block-divider"></div>
          <div class="stat-row"><strong>AC</strong> ${ac} &nbsp; <strong>PF</strong> ${pf}</div>
          <div class="stat-row"><strong>Tiro per colpire</strong> ${rigaCR.attacco >= 0 ? '+' : ''}${rigaCR.attacco} &nbsp; <strong>Save DC</strong> ${rigaCR.save_dc}</div>
          <div class="sb-section-title" style="margin-top:8px;">Azioni</div>
          <div class="sb-action">
            <strong>${nomeArma}.</strong> Attacco ${ruoloKey === 'artillery' ? 'con arma a distanza' : 'con arma da mischia'}: ${rigaCR.attacco >= 0 ? '+' : ''}${rigaCR.attacco} al tiro per colpire${ruoloKey === 'artillery' ? ', gittata 30/120 m' : ', portata 1,5 m'}, un bersaglio.
            <em>Danno: ${dadoAttacco.dado} danni da ${tipoDanno}.</em>
          </div>
          ${numAttacchi > 1 ? `<div class="sb-action"><em>Multiattacco: effettua ${numAttacchi} attacchi con ${nomeArma} per round.</em></div>` : ''}
          ${abilitaSpeciale ? `<div class="sb-action"><strong>${abilitaSpeciale.split('(')[0].trim()}.</strong> ${(abilitaSpeciale.match(/\(([^)]+)\)/)||[])[1] || ''}</div>` : ''}
          <div class="stat-abilities">
            ${statKeys.map(k => `
              <div class="stat-ability-box">
                <div class="stat-ability-name">${k.slice(0,3).toUpperCase()}</div>
                <div class="stat-ability-score">${stats[k]}</div>
                <div class="stat-ability-mod">${modStr(stats[k])}</div>
              </div>`).join('')}
          </div>
          <div class="stat-block-divider"></div>
          <div class="text-xs text-muted" style="margin-bottom:4px;">${ruoloInfo.descrizione}</div>
          ${abilitaSpeciale ? `<div class="sb-action"><strong>${abilitaSpeciale.split('(')[0].trim()}.</strong> ${(abilitaSpeciale.match(/\(([^)]+)\)/)||[])[1] || ''}</div>` : ''}
        </div>
      </div>`;
  },

  _lastGeneratedNPC: null,

  openGeneratedNPC: () => {
    const npc = Generatori._lastGeneratedNPC;
    if (!npc || !window.NPC) return;
    NPC.openModal(npc);
  },

  saveGeneratedNPC: () => {
    const npc = Generatori._lastGeneratedNPC;
    if (!npc) return;

    App.reloadActiveCampaign();
    const camp = App.getActiveCampaign();
    Debug.log(`saveGeneratedNPC: camp=${camp?.name}, id=${camp?.id}`);
    if (!camp) { Toast.show('Seleziona una campagna prima', 'warning'); return; }

    const campFresh = Storage.getCampaign(camp.id);
    const npcs = [...(campFresh?.npcs || [])];
    npcs.push({ id: 'npc_' + Date.now(), ...npc });
    const result = Storage.updateCampaign(camp.id, { npcs });
    Debug.log(`saveGeneratedNPC: result=${result ? 'ok' : 'FALLITO'}, npcs=${npcs.length}`);
    if (!result) { Toast.show('Errore salvataggio', 'error'); return; }
    App.reloadActiveCampaign();
    Toast.show(`${npc.name} salvato nel Mondo!`, 'success');
    document.getElementById('gen-npc-save-btn').style.display = 'none';
    document.getElementById('gen-npc-edit-btn').style.display = 'none';
    try { NPC.render(); } catch(e) {}
    Debug.log(`PNG salvato: ${npc.name}`);
  },

  rollNomi: () => {
    const razza = document.getElementById('gen-nomi-razza')?.value || 'umano';
    const el = document.getElementById('gen-nomi-result');
    if (!el) return;

    const nomi = {
      umano: {
        m: ['Aldric','Beren','Caelan','Dorian','Edric','Faolan','Garrett','Hadric','Idris','Jareth','Kael','Loran','Mattis','Nestor','Oryn','Perin','Quirin','Rolan','Soren','Tavish','Ulric','Varis','Wynn','Xander','Yoren','Zephyr'],
        f: ['Aelindra','Brynn','Calla','Dara','Elara','Freya','Gwen','Hana','Isara','Jessa','Kira','Lyra','Mira','Nessa','Orla','Petra','Quinn','Risa','Sera','Tara','Una','Vera','Willa','Xyla','Yara','Zara'],
        c: ['Ashford','Blackwood','Coldwell','Dunmore','Eastgate','Fairfield','Greenwood','Harwick','Ironwood','Jarvis','Kestrel','Lannis','Merrow','Nighthollow','Overton','Pendleton','Quarry','Redmoor','Stonemark','Thorne','Underhill','Vanthorpe','Westfall','Xenos','York','Zane'],
      },
      elfo: {
        m: ['Aerdyn','Celeborn','Daeron','Erevan','Faelas','Galeth','Halamar','Ilphas','Jariel','Kerym','Laucian','Miritar','Neldor','Orym','Paelias','Quelmar','Riardon','Soveliss','Thalion','Uruvion','Varis','Wyll','Xelris','Yaerevan','Zannifer'],
        f: ['Adrie','Birel','Caelynn','Dara','Enna','Faral','Galinndan','Hadarai','Immeral','Jelenneth','Keyleth','Leshanna','Mialee','Naivara','Orisis','Quelenna','Raina','Shava','Thia','Uriangkatai','Valna','Wrennis','Xanaphia','Yaara','Zinnia'],
        c: ["Amastacia (Quella che Canta le Stelle)","Galanodel (Sussurro di Luna)","Holimion (Fiocco di Diamante)","Liadon (Lama d'Argento)","Meliamne (Quercia Danzante)","Naïlo (Brezza Notturna)","Siannodel (Ruscello di Luna)","Xiloscient (Petalo d'Oro)"],
      },
      nano: {
        m: ['Adrik','Baern','Darrak','Eberk','Fargrim','Gardain','Harbek','Kildrak','Morgran','Orsik','Oskar','Rangrim','Rurik','Taklinn','Thoradin','Thorin','Tordek','Traubon','Travok','Ulfgar','Veit','Vondal'],
        f: ['Amber','Artin','Audhild','Bardryn','Dagnal','Diesa','Eldeth','Falkrunn','Finellen','Gunnloda','Gurdis','Helja','Hlin','Kathra','Kristryd','Mardred','Riswynn','Sannl','Torbera','Torgga','Vistra'],
        c: ['Balderk','Dankil','Gorunn','Holderhek','Loderr','Lutgehr','Rumnaheim','Strakeln','Torunn','Ungart'],
      },
      halfling: {
        m: ['Alton','Ander','Cade','Corrin','Eldon','Errich','Finnan','Garret','Lindal','Lyle','Merric','Milo','Osborn','Perrin','Reed','Roscoe','Wellby'],
        f: ['Andry','Bree','Callie','Cora','Euphemia','Jillian','Kithri','Lavinia','Lidda','Merla','Nedda','Paela','Portia','Seraphina','Shaena','Trym','Vani','Verna'],
        c: ['Brushgather','Goodbarrel','Greenbottle','High-hill','Hilltopple','Leagallow','Tealeaf','Thorngage','Tosscobble','Underbough'],
      },
      tiefling: {
        m: ['Akmenos','Amnon','Barakas','Damakos','Ekemon','Iados','Kairon','Leucis','Melech','Mordai','Morthos','Pelaios','Skamos','Therai'],
        f: ['Akta','Anakis','Bryseis','Criella','Damaia','Ea','Kallista','Lerissa','Makaria','Nemeia','Orianna','Phelaia','Rieta'],
        v: ['Ambizione','Arte','Caos','Corruzione','Crudeltà','Disfatta','Dolore','Eccesso','Fuoco','Gloria','Inganno','Menzogna','Morte','Notte','Odio','Rabbia','Sangue','Terrore','Tormento','Tradimento','Vendetta','Vergogna'],
      },
      dragonide: {
        m: ['Arjhan','Balasar','Bharash','Donaar','Ghesh','Heskan','Kriv','Medrash','Mehen','Nadarr','Pandjed','Patrin','Rhogar','Shamash','Shedinn','Tarhun','Torinn'],
        f: ['Akra','Biri','Daret','Farideh','Harann','Havilar','Jheri','Kava','Korinn','Mishann','Nala','Perra','Raiann','Sora','Surina','Thava','Uadjit'],
        c: ['Clethtinthiallor','Daardendrian','Delmirev','Drachedandion','Fenkenkabradon','Kepeshkmolik','Kerrhylon','Kimbatuul','Linxakasendalor','Myastan','Nemmonis','Norixius','Ophinshtalajiir','Prexijandilin','Shestendeliath','Turnuroth','Verthisathurgiesh','Yarjerit'],
      },
      gnomo: {
        m: ['Alston','Alvyn','Boddynock','Brocc','Burgell','Dimble','Eldon','Erky','Fonkin','Frug','Gerbo','Gimble','Glim','Jebeddo','Kellen','Namfoodle','Orryn','Roondar','Seebo','Sindri','Warryn','Wrenn','Zook'],
        f: ['Bimpnottin','Breena','Caramip','Carlin','Donella','Duvamil','Ella','Ellyjobell','Ellywick','Lilli','Loopmottin','Lorilla','Mardnab','Nissa','Nyx','Oda','Orla','Roywyn','Shamil','Tana','Waywocket','Zanna'],
        c: ['Beren','Dunderdell','Garrick','Nackle','Ningel','Raulnor','Scheppen','Timbers','Turen'],
      },
      mezzorco: {
        m: ['Dench','Feng','Gell','Henk','Holg','Imsh','Keth','Krusk','Mhurren','Ront','Shump','Thokk'],
        f: ['Baggi','Emen','Engong','Kansif','Myev','Neega','Ovak','Ownka','Shautha','Sutha','Vola','Volen','Yevelda'],
        c: ['nessun cognome (usa nome del clan)'],
      },
    };

    const n = nomi[razza] || nomi.umano;
    const r = (arr) => arr[Math.floor(Math.random()*arr.length)];
    const genM = r(n.m||[]);
    const genF = r(n.f||[]);
    const genC = r(n.c||n.v||['—']);

    el.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
      ['Maschile','Femminile'].map((g,i) => {
        const nome = i===0 ? genM : genF;
        const full = nome + (n.c||n.v ? ' ' + genC : '');
        return '<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px;">' +
          '<div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">' + g + '</div>' +
          '<div style="font-family:var(--font-display);font-size:0.9rem;">' + nome + '</div>' +
          '<div style="font-size:0.72rem;color:var(--text-muted);">' + genC + '</div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<button class="btn btn-ghost btn-sm w-full" style="margin-top:6px;font-size:0.72rem;" onclick="Generatori.rollNomi()">Altri nomi</button>';
    Debug.log('Nomi generati per ' + razza);
  },

  rollIncontro: () => {
    const ambiente = document.getElementById('gen-incontri-ambiente')?.value || 'foresta';
    const livello  = document.getElementById('gen-incontri-livello')?.value  || 'medio';
    const el = document.getElementById('gen-incontri-result');
    if (!el) return;
    const rnd = (a) => a[Math.floor(Math.random()*a.length)];

    const incontri = {
      foresta: {
        basso: [
          '1d4 goblin nascosti tra i rovi che tendono un agguato',
          'Un lupo solitario ferito, affamato e aggressivo',
          '1d3 banditi che si fingono viaggiatori in difficoltà',
          'Un ragno gigante che cala dal soffitto di foglie',
          'Una trappola da caccia nascosta sotto le foglie secche',
          'Un coboldo esploratore — gli altri sono vicini',
          'Un cinghiale irritato che difende i cuccioli',
          '1d4 pixie dispettose che rubano oggetti dagli zaini',
        ],
        medio: [
          '1d6 lupi guidati da un worg intelligente',
          '2d4 goblin su lupi da guerra che cacciano',
          'Un orco solitario in cerca di prede, urlante',
          'Un cubo gelatinoso che occupa un sentiero stretto',
          'Un gruppo di banditi con un capo umanoide (GS 2)',
          'Un dryad che difende il suo albero sacro con forza',
          'Un owlbear che ha perso i cuccioli — furibondo',
          'Tracce fresche di un troll — ore di anticipo',
        ],
        alto: [
          'Un giovane drago verde che rivendica la foresta',
          'Un gruppetto di assassini inviati da qualcuno',
          'Una strega della foresta con 1d4 servitori non morti',
          'Un treant irato per la deforestazione recente',
          'Un vampiro che usa la foresta come caccia notturna',
          'Un grifone che difende il nido nelle alture',
          'Una banda di ranger corrotti guidati da un ex eroe',
          'Portale instabile — creature aberranti emergono',
        ],
      },
      dungeon: {
        basso: [
          '1d6 scheletri che pattugliano il corridoio',
          'Una trappola a dardo avvelenato su una porta',
          '1d4 ratti giganti che escono da un buco nel muro',
          'Due goblin che litigano sul cibo — non vi hanno visto',
          'Uno zombie lento che cammina verso di voi',
          'Una trappola a fossa coperta da polvere fine',
          '1d3 coboldi trappeurs con un sistema di fili',
          'Un fungo velenoso che spore se disturbato',
        ],
        medio: [
          '1d4 zombie che banchettano su resti di un avventuriero',
          'Un gelatinoso cubo che riempie il corridoio',
          'Un gruppo di gnoll che esplora il dungeon',
          'Un mago pazzo con 1d3 costrutti difettosi',
          'Una mummia dimenticata che si risveglia',
          'Un\'ombra che insegue il personaggio con meno PF',
          '2d4 orchi ubriachi che dormono — svegliarli è rischioso',
          'Un naga custode di un\'anticamera del tesoro',
        ],
        alto: [
          'Un vampiro con 1d4 spawn nel suo sarcofago',
          'Un beholder che considera il dungeon suo territorio',
          'Un lich indebolito — cerca corpi per recuperare forza',
          'Una chimera rinchiusa — la gabbia sta cedendo',
          'Un demone maggiore invocato e non più controllato',
          'Un drago anziano che dorme su un cumulo di ossa',
          'Un mindflayer con 1d6 schiavi thrall',
          'La guardia non-morta di un re sepolto',
        ],
      },
      citta: {
        basso: [
          'Un borseggiatore nimble colpisce un PG (DEX CD 13)',
          'Una rissa fuori da una taverna — folla eccitata',
          'Un mendicante con informazioni preziose in cambio di cibo',
          'Una guardia corrotta che chiede "pedaggio" informale',
          'Un bambino che chiede aiuto — la madre è scomparsa',
          'Un ciarlatano vende pozioni false a prezzi alti',
          'Un testimone di un crimine che chiede protezione',
          'Un mercante furioso insegue un presunto ladro',
        ],
        medio: [
          'Un banditore legge una taglia — la descrizione somiglia a un PG',
          'Agenti della gilda dei ladri che "proteggono" un negozio',
          'Un nobile in carrozza che crea incidente diplomatico',
          'Un cultista che distribuisce volantini nel mercato',
          'Guardie corrotte che scortano un carico sospetto',
          'Un assassino che ha sbagliato bersaglio — confusione',
          'Un incendio doloso in un quartiere povero',
          'Un ricattatore che conosce segreti di qualcuno del party',
        ],
        alto: [
          'Un maestro assassino incaricato di eliminare un PG',
          'Un demone travestito da nobile che gestisce la città',
          'Una rivolta popolare che sta degenerando',
          'Un incantatore rinnegato che terrorizza il mercato',
          'La guardia della città intrappolata da un incantesimo di massa',
          'Un drago polimorfo che vive come mercante da anni',
          'Una cospirazione per assassinare il signore della città',
          'Un portale aperto in piazza centrale da un rituale fallito',
        ],
      },
      pianura: {
        basso: [
          '1d4 banditi a cavallo che chiedono pedaggi',
          'Un cacciatore di taglie che cerca qualcuno',
          'Un contadino con un carro spezzato e bestiame rubato',
          '1d6 goblin che assaltano un piccolo accampamento',
          'Un gregge incustodito — dove sono i pastori?',
          'Un fuoco di accampamento abbandonato di recente',
          'Un soldato disertore, ferito e spaventato',
          'Una trappola di caccia dimenticata sul sentiero',
        ],
        medio: [
          'Un gruppo di gnoll che cacciano in formazione',
          '1d4 orchi che scortano un prigioniero',
          'Un cavaliere nero che non si ferma per nessun motivo',
          'Un\'aquila gigante che sorvola e poi attacca',
          'Nuvola di polvere — piccolo esercito di goblin in marcia',
          'Un guardiano della palude — troll solitario e furioso',
          'Un cerchio di pietre con un spirito intrappolato',
          'Banditi organizzati con un mago come supporto',
        ],
        alto: [
          'Un gigante delle colline che lancia rocce da lontano',
          'Un drago anziano che sorvola cercando prede',
          'Un esercito di non-morti in marcia verso la città',
          'Un lich che viaggia verso una destinazione sconosciuta',
          'Una mandria di manticore che cacciano in gruppo',
          'Un arcimago fuggitivo braccato da agenti misteriosi',
          'Un portale elementale che aspira tutto nel raggio di 30m',
          'Un semi-dio caduto che cerca un degno avversario',
        ],
      },
      montagna: {
        basso: [
          '1d4 orchi che controllano un passo di montagna',
          'Una valanga minore — CD DES 12 o 2d6 danni contundenti',
          '1d6 coboldi che estraggono in una sporgenza',
          'Un\'aquila gigante che difende il nido',
          'Un sentiero ghiacciato — CD DES 10 per non cadere',
          'Un mercante nano bloccato da una frana',
          'Una famiglia di capre delle montagne — attenzione al caprone',
          'Un passaggio segreto in una parete rocciosa',
        ],
        medio: [
          'Un gigante delle colline curioso e territoriale',
          'Un manticora che caccia dal cielo',
          'Un wyvern che difende il nido a strapiombo',
          '2d4 orchi con un capo sciamano',
          'Un troll di montagna che usa un\'avalanga come trappola',
          'Un grifo che sorvola — si interessa al party',
          'Un\'imboscata di goblin da alta quota con pietre',
          'Un nano corrotto che controlla il passo con mercenari',
        ],
        alto: [
          'Un drago adulto delle montagne — territorio segnato',
          'Un gigante delle tempeste che comanda i fulmini',
          'Un esercito di orchi guidato da un campione half-drago',
          'Un\'arrocca di pietra che si risveglia',
          'Un\'antica creatura elementale di terra che emerge',
          'Un nemico antico sigillato nella roccia — ora libero',
          'Un lich che usa la montagna come fortezza',
          'Portale verso il Piano elementale della terra',
        ],
      },
      mare: {
        basso: [
          'Una piccola barca pirata con 1d6 pirati disorganizzati',
          'Banchi di nebbia fitta — qualcosa si muove dentro',
          'Un relitto galleggiante — qualcosa si agita ancora dentro',
          '1d4 sahuagin che assaltano dalla prua',
          'Delfini che escortano — poi scappano all\'improvviso',
          'Una corrente pericolosa — CD FOR 11 per nuotare fuori',
          'Una scialuppa alla deriva con un unico sopravvissuto',
          'Un polpo gigante che abbraccia lo scafo',
        ],
        medio: [
          'Una nave pirata ben equipaggiata con un capitano GS 5',
          'Un drago di mare che emerge tra le onde',
          'Sirene che cantano — CD SAG 14 o il PG si getta in mare',
          'Un idra marina che attacca dal basso',
          'Un mercante in difficoltà — è una trappola di pirati',
          'Una tempesta improvvisa — tiro abilità per mantenere la rotta',
          'Una balena infuriata che speronò una nave prima di voi',
          'Un elementale dell\'acqua che sorge dal nulla',
        ],
        alto: [
          'Un kraken che si risveglia — impossibile combatterlo, solo fuggire',
          'Una flotta di non-morti — navi fantasma con equipaggio spettrale',
          'Un drago delle tempeste che comanda la flotta pirata',
          'Un dio del mare minore che vuole un tributo',
          'Un\'aberrazione degli abissi che emerge alla superficie',
          'Una maelstrom magica con una struttura al centro',
          'La nave fantasma del Capitano Maledetto — vi segue',
          'Un portale negli abissi si apre sotto la chiglia',
        ],
      },
      palude: {
        basso: [
          '1d4 lizardfolk che emergono dall\'acqua torbida',
          'Fuochi fatui che cercano di attirare fuori dal sentiero',
          'Sabbie mobili — CD DES 12 o si affonda di 1,5m',
          'Gas fetido — CD COS 12 o svantaggio per 1 ora',
          'Un serpente gigante sul tronco che funge da ponte',
          'Un coboldo scalvenged con trappole artigianali',
          'Una rana gigante che inghiotte una creatura piccola',
          'Una zona di territorio lizardfolk — vietato l\'accesso',
        ],
        medio: [
          'Un troll di palude che si rigenera nell\'acqua',
          'Un gruppo di lizardfolk con uno sciamano',
          'Un\'idra a tre teste che ha il nido nelle canne',
          'Un\'ombra che insegue dal crepuscolo',
          'Una druidessa corrotta che controlla la palude',
          'Un\'antica maledizione trasforma l\'acqua in acido diluito',
          'Fuochi fatui intelligenti che lavorano per una strega',
          '2d4 zombie acquatici che emergono dal fango nero',
        ],
        alto: [
          'Un drago nero che tana nelle profondità della palude',
          'Una strega antica con un\'armata di non-morti acquatici',
          'Un behir che ha stabilito territorio nella palude',
          'Un\'aberrazione della palude — qualcosa di mai catalogato',
          'Un portale verso il Piano dell\'Acqua — inonda la zona',
          'Un lich che usa la palude come laboratorio',
          'Una mandria di ippopotami giganti guidati da un\'entità',
          'Un tentacolo del kraken che emerge in questa palude',
        ],
      },
      deserto: {
        basso: [
          'Un miraggio — CD SAG 12 per non seguirlo',
          '1d4 gnoll che cacciano nella sabbia',
          'Un\'imboscata di briganti nomadi (1d6)',
          '2d4 scorpioni giganti da sotto la sabbia',
          'Un pozzo avvelenato con ossa attorno',
          'Un mercante di spezie con prezzi sospettosi',
          'Una tempesta di sabbia in arrivo — 30 minuti',
          'Tracce di un verme della sabbia — non fresche',
        ],
        medio: [
          'Un\'ankheg che emerge sotto i piedi del party',
          'Un giovane lamia con 1d4 cultisti',
          'Un djinn imprigionato che offre un accordo pericoloso',
          'Un mummia che difende le rovine di una città',
          'Un branco di iena gigante con un capo GS 4',
          'Rovine con un guardiano costrutto ancora attivo',
          'Una tempesta di fuoco elementale — pianura bruciante',
          'Tracce di un verme della sabbia — fresche, molto fresche',
        ],
        alto: [
          'Un drago rosso che usa il deserto come caccia',
          'Un verme della sabbia adulto — il suolo trema',
          'Un lich del deserto nel suo palazzo sepolto',
          'Un genio maligno con un esercito di cultisti',
          'Un elemental del fuoco di dimensioni colossali',
          'Un avatar del dio del sole — vuole sacrifici',
          'Una città sepolta che emerge — ancora abitata da non-morti',
          'Un portale verso il Piano elementale del fuoco',
        ],
      },
    };

    const lista = incontri[ambiente]?.[livello] || incontri.foresta.medio;
    const incontro = rnd(lista);
    const ora = rnd(['Alba (nebbia leggera)','Mattina','Mezzogiorno (caldo)','Pomeriggio','Tramonto','Sera','Notte (buio)','Mezzanotte']);
    const distanza = rnd(['Visibile immediatamente','A 30m','A 60m','In lontananza (300m+)','Sentito ma non visto']);
    const lvLabel = { basso:'Liv. 1–4', medio:'Liv. 5–10', alto:'Liv. 11+' }[livello]||'';

    el.innerHTML =
      '<div style="background:var(--bg-secondary);border-left:3px solid var(--accent-primary);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:8px;margin-bottom:6px;font-size:0.85rem;line-height:1.5;">' + incontro + '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
        '<span class="badge badge-muted">🕐 ' + ora + '</span>' +
        '<span class="badge badge-muted">📍 ' + distanza + '</span>' +
        '<span class="badge badge-muted">⚔️ ' + lvLabel + '</span>' +
      '</div>' +
      '<button class="btn btn-ghost btn-sm w-full" style="margin-top:6px;font-size:0.72rem;" onclick="Generatori.rollIncontro()">Nuovo incontro</button>';
    Debug.log('Incontro: ' + ambiente + ' / ' + livello);
  },

  rollFollia: () => {
    const tipo = document.getElementById('gen-follia-tipo')?.value || 'breve';
    const el = document.getElementById('gen-follia-result');
    if (!el) return;
    const rnd = (a) => a[Math.floor(Math.random()*a.length)];

    const follie = {
      breve: [
        'Il personaggio si rannicchia in un angolo e trema (incapacitato).',
        'Il personaggio urla, ride o piange istericamente (incapacitato).',
        'Il personaggio si paralizza, fissa nel vuoto, fermo come una statua.',
        'Il personaggio vaneggia incomprensibilmente.',
        'Il personaggio scappa nel modo più veloce possibile dalla fonte del terrore.',
        'Il personaggio attacca il bersaglio più vicino — amico o nemico.',
        'Il personaggio fa azioni casuali determinate da un d8.',
        'Il personaggio sviene (incapacitato, non combatte).',
        'Il personaggio è convinto di non vedere ciò che vede realmente.',
        'Il personaggio si siede, ride piano, parla con qualcuno che non c\'è.',
      ],
      prolungata: [
        'Il personaggio perde la propria identità — non risponde al nome.',
        'Il personaggio è convinto di essere qualcun altro (personaggio famoso, NPC, creatura).',
        'Il personaggio è paranoico: nessuno si fida di nessuno nel gruppo.',
        'Il personaggio subisce allucinazioni — sente voci che lo insultano.',
        'Il personaggio è ossessionato da un oggetto inanimato (lo tratta come vitale).',
        'Il personaggio deve prepararsi ad ogni azione con rituali particolari.',
        'Il personaggio non parla a parole, solo attraverso gesti e suoni.',
        'Il personaggio è soggetto a attacchi di panico improvvisi (WIS DC 10 ogni mattina).',
        'Il personaggio ricorda solo gli ultimi 5 minuti di vita (amnesia).',
        'Il personaggio è convinto che tutti i presenti vogliano ucciderlo.',
      ],
      permanente: [
        'Agorafobia: svantaggio ai tiri quando è all\'aperto.',
        'Claustrofobia: svantaggio ai tiri in spazi chiusi o ristretti.',
        'Deliri di grandezza: il personaggio si crede un dio incarnato.',
        'Dipendenza: il personaggio deve possedere un tipo di oggetto o perde il controllo.',
        'Disorganizzazione mentale: non può compiere più di un\'azione pianificata per round.',
        'Dissociazione: in combattimento deve superare WIS DC 12 o si immobilizza.',
        'Flashback: ogni volta che subisce danni, WIS DC 11 o è spaventato per 1 round.',
        'Misantropia: non può cooperare con più di una persona alla volta.',
        'Ossessione: spende ogni risorsa possibile per un obiettivo irrazionale.',
        'Paranoia: non può dormire se qualcuno del gruppo è sveglio (esaurimento).',
      ],
    };

    const lista = follie[tipo] || follie.breve;
    const effetto = rnd(lista);
    const durata = {
      breve: `Durata: 1d10 minuti (${Math.floor(Math.random()*10)+1} min)`,
      prolungata: `Durata: 1d10×10 ore (${(Math.floor(Math.random()*10)+1)*10} ore)`,
      permanente: 'Permanente — rimuovibile con <em>maggior restauro</em> o magia simile',
    }[tipo];

    el.innerHTML =
      '<div style="background:var(--bg-secondary);border-left:3px solid var(--accent-danger);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:8px;margin-bottom:6px;font-size:0.85rem;line-height:1.5;">' + effetto + '</div>' +
      '<div class="badge badge-muted" style="font-size:0.72rem;">' + durata + '</div>' +
      '<button class="btn btn-ghost btn-sm w-full" style="margin-top:6px;font-size:0.72rem;" onclick="Generatori.rollFollia()">Nuovo effetto</button>';
    Debug.log('Follia: ' + tipo);
  },

  rollBiblioteca: async () => {
    const size = document.getElementById('gen-bib-size')?.value || 'piccola';
    const el = document.getElementById('gen-bib-result');
    if (!el) return;

    const camp = App.getActiveCampaign();
    const sistema = camp?.system === '5e2014' ? '5e2014' : '5e2024';
    const spFile = sistema === '5e2014' ? 'srd_5_1_spells.json' : 'srd_5_2_1_spells.json';
    let spells = [];
    try {
      const r = await fetch('data/' + spFile);
      if (r.ok) spells = await r.json();
    } catch(e) {}

    const config = {
      piccola: { maxLv:3, n:6,  prezzi:{0:10,1:60,2:120,3:200}, desc:'Una stanza con scaffali polverosi. Incantesimi comuni, qualche testo di storia.' },
      grande:  { maxLv:6, n:10, prezzi:{0:10,1:60,2:120,3:200,4:320,5:640,6:1280}, desc:'Biblioteca civica o universitaria. Ottima selezione, anche testi rari.' },
      enorme:  { maxLv:9, n:16, prezzi:{0:10,1:60,2:120,3:200,4:320,5:640,6:1280,7:2560,8:5120,9:10240}, desc:'Archivio monumentale. Pergamene di ogni livello, testi proibiti, grimori antichi.' },
    };
    const cfg = config[size];

    const available = spells.filter(s => s.livello <= cfg.maxLv);
    const shuffled = [...available].sort(() => Math.random() - 0.5).slice(0, cfg.n);

    const nomiNomi = { piccola:['Archivio di Fratel Aldric','Scriptorium del Borgo','La Biblioteca Impolverata'], grande:['Accademia delle Arti Arcane','Biblioteca Civica di Valmoore','Il Gran Scriptorium'], enorme:['Archivio dei Mille Nomi','La Biblioteca dell\'Oracolo','Il Vault dei Segreti'] };
    const nome = rnd(nomiNomi[size]);

    el.innerHTML = '<div style="font-family:var(--font-display);font-size:0.8rem;color:var(--accent-secondary);margin-bottom:4px;">' + nome + '</div>' +
      '<div class="text-muted text-sm" style="margin-bottom:8px;">' + cfg.desc + '</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:0.78rem;">' +
        '<thead><tr>' +
          '<th style="text-align:left;padding:3px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">Pergamena</th>' +
          '<th style="text-align:center;padding:3px 4px;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">Lv</th>' +
          '<th style="text-align:right;padding:3px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">Prezzo</th>' +
        '</tr></thead><tbody>' +
        shuffled.map(s =>
          '<tr><td style="padding:3px 0;border-bottom:1px solid var(--border);">📜 ' + s.nome + '</td>' +
          '<td style="padding:3px 4px;border-bottom:1px solid var(--border);text-align:center;font-family:var(--font-mono);color:var(--text-muted);">' + s.livello + '</td>' +
          '<td style="padding:3px 0;border-bottom:1px solid var(--border);text-align:right;font-family:var(--font-mono);color:var(--accent-secondary);">' + (cfg.prezzi[s.livello]||'—') + ' mo</td></tr>'
        ).join('') +
        '</tbody></table>';
    Debug.log('Biblioteca: ' + nome + ' (' + shuffled.length + ' pergamene)');
  },

  rollWeather: async () => {
    const stagione = document.getElementById('gen-meteo-stagione')?.value || 'primavera';
    const el = document.getElementById('gen-weather-result');
    if (!el) return;

    const meteoStagionale = {
      primavera: {
        '☀️ Soleggiato':   ['Sole caldo, vento leggero. Ideale per viaggiare.', 'Cielo limpido, profumo di fiori. Temperatura gradevole.', 'Sole con qualche nuvola. Brezza fresca dal nord.'],
        '🌦️ Variabile':    ['Alternanza di sole e nuvole. Possibili rovesci brevi.', 'Cielo incerto, arcobaleno al mattino.'],
        '🌧️ Pioggia':      ['Pioggia leggera e persistente. Strade fangose.', 'Rovescio intermittente. Terreno scivoloso (-2 velocità).'],
        '⛈️ Temporale':    ['Temporale improvviso. Fulmini vicini. Rischio per i metalli.'],
        '🌫️ Nebbia':       ['Nebbia mattutina densa. Visibilità ridotta a 9m. Si dirada a mezzogiorno.'],
      },
      estate: {
        '☀️ Soleggiato':   ['Caldo intenso. Rischio esaurimento senza acqua ogni 4 ore.', 'Sole cocente, nessuna nuvola. Ombra preziosa.', 'Afa opprimente. Velocità ridotta di 3m in armatura pesante.'],
        '🌬️ Ventoso':      ['Vento caldo e secco. Polvere negli occhi (-1 Percezione).', 'Raffiche di vento da sud. Difficoltà a mantenere torce accese.'],
        '🌧️ Rovescio':     ['Temporale estivo breve ma violento. Poi sole.', 'Pioggia calda improvvisa. Finisce in 1 ora.'],
        '☁️ Nuvoloso':     ['Coperto, nessuna pioggia. Temperatura piacevole.'],
      },
      autunno: {
        '☁️ Coperto':      ['Cielo grigio, luce fioca. Temperatura fresca.', 'Nuvole basse, atmosfera cupa. Ottimo per tensione narrativa.'],
        '🌧️ Pioggia':      ['Pioggia costante. Terreno fangoso. -3m velocità.', 'Pioggia battente con vento. Torce impossibili da tenere accese.'],
        '🌫️ Nebbia':       ['Nebbia fitta dall\'alba al tramonto. Visibilità 6m.', 'Nebbia banchi irregolari. Si apre e si chiude.'],
        '☀️ Soleggiato':   ['Giornata autunnale limpida. Foglie colorate. Temperatura fresca.'],
        '🌬️ Vento':        ['Vento freddo da nord. Foglie che volano. Difficoltà Stealth all\'aperto.'],
      },
      inverno: {
        '❄️ Neve':         ['Neve abbondante. Velocità dimezzata. Tracce visibili per ore.', 'Nevicata leggera. Silenzio totale. Vantaggio su Furtività.', 'Bufera di neve. Visibilità 3m. Rischio esaurimento senza riparo.'],
        '🧊 Ghiaccio':     ['Ghiaccio sul terreno. DC DES 13 o caduta ogni 9m di corsa.', 'Tutto ghiacciato. DC DES 10 per azioni fisiche veloci.'],
        '☁️ Grigio':       ['Cielo grigio piombo. Freddo pungente. Nessuna precipitazione.'],
        '☀️ Sole invernale':['Sole freddo e limpido. Terreno gelato ma praticabile. Magnifico.'],
        '🌬️ Bufera':       ['Tempesta di vento e gelo. Movimento possibile solo a metà velocità. Danno freddo 1 ogni ora senza riparo.'],
      },
      tropicale: {
        '🌧️ Pioggia torrenziale':['Pioggia tropicale violenta. Fiumi in piena. Visibilità 9m.', 'Rovescio equatoriale. Finisce in 20 minuti. Poi caldo umido.'],
        '☀️ Sole cocente': ['Umidità al 90%. Caldo insopportabile. Esaurimento dopo 6 ore senza acqua.'],
        '🌩️ Temporale':    ['Temporale tropicale. Fulmini frequenti. Alberi che cadono.'],
        '🌫️ Umidità':      ['Nebbia calda e umida. Visibilità ridotta. Tutto si inzuppa.'],
        '🌊 Uragano':      ['Uragano in avvicinamento. 1d4 ore prima dell\'impatto.'],
      },
      artico: {
        '❄️ Tormenta':     ['Tormenta artica. Visibilità 0. Muoversi è pericoloso (danno freddo 1d4/ora).', 'Neve fitta e vento tagliente. DC CON 12 o un livello esaurimento.'],
        '🧊 Freddo estremo':['Temperatura sotto lo zero. Danno freddo 1 ogni 2 ore senza protezione.'],
        '☀️ Luce artica':  ['Sole basso, luce abbagliante sul ghiaccio. Svantaggio Percezione visiva.'],
        '🌌 Aurora boreale':['Cielo sgombro con aurora. Effetti magici potenziati (+1 livello incantesimo slot).'],
        '🌬️ Bufera':       ['Bufera polare. Impossibile avanzare. Rifugiarsi o 1d6 danno freddo/ora.'],
      },
    };

    const s = meteoStagionale[stagione] || meteoStagionale.primavera;
    const tipi = Object.keys(s);

    const tipo = tipi[Math.floor(Math.random()*tipi.length)];
    const desc = s[tipo][Math.floor(Math.random()*s[tipo].length)];
    const temp = { primavera:'10–18°C', estate:'25–38°C', autunno:'5–15°C', inverno:'-15–2°C', tropicale:'28–36°C', artico:'-40–-10°C' }[stagione]||'';

    el.innerHTML =
      '<div style="display:flex;gap:var(--space-sm);align-items:flex-start;">' +
        '<span style="font-size:1.8rem;">' + tipo.split(' ')[0] + '</span>' +
        '<div>' +
          '<div style="font-family:var(--font-display);font-size:0.8rem;color:var(--accent-secondary);">' + tipo.slice(tipo.indexOf(' ')+1) + ' — ' + stagione.charAt(0).toUpperCase()+stagione.slice(1) + '</div>' +
          '<div class="text-sm" style="margin-top:2px;">' + desc + '</div>' +
          (temp ? '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">🌡️ ' + temp + '</div>' : '') +
        '</div>' +
      '</div>';
    Debug.log('Meteo: ' + tipo + ' (' + stagione + ')');
  },

  rollSensori: async () => {
    const t = await loadTabelle();
    if (!t) return;
    const tipo = document.getElementById('gen-sensori-type')?.value || 'dungeon';
    const pool = t.sensori[tipo] || t.sensori['dungeon'];
    const desc = rnd(pool);
    const el = document.getElementById('gen-sensori-result');
    if (!el) return;
    el.innerHTML = `<div class="text-sm" style="font-style:italic;color:var(--text-secondary);">"${desc}"</div>`;
    Debug.log(`Sensori (${tipo}): ${desc}`);
  },

  rollRumors: async () => {
    const t = await loadTabelle();
    if (!t) return;

    const vere = [...t.voci_corridoio.vere].sort(() => Math.random()-0.5).slice(0,2);
    const falsa = rnd(t.voci_corridoio.false);
    const all = [
      { text: vere[0], vera: true },
      { text: falsa, vera: false },
      { text: vere[1], vera: true },
    ].sort(() => Math.random()-0.5);

    const el = document.getElementById('gen-rumors-result');
    if (!el) return;
    el.innerHTML = all.map((v, i) => `
      <div style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-start;">
        <span class="badge ${v.vera ? 'badge-muted' : 'badge-muted'}" style="flex-shrink:0;">${i+1}</span>
        <div class="text-sm">${v.text}</div>
        <span class="badge ${v.vera ? 'badge-success' : 'badge-primary'}" style="flex-shrink:0;opacity:0.3;"
              title="${v.vera ? 'Vera' : 'Falsa'}">${v.vera ? '✓' : '✗'}</span>
      </div>
    `).join('');
    Debug.log('Voci di corridoio generate');
  },

  rollAccent: async () => {
    const t = await loadTabelle();
    if (!t) return;
    const av = t.accenti_voci;
    const voce = rnd(av.voce);
    const tic = rnd(av.tic);
    const stile = rnd(av.stile);
    const el = document.getElementById('gen-accent-result');
    if (!el) return;
    el.innerHTML = `
      <div class="text-sm" style="margin-bottom:4px;"><strong>Voce:</strong> ${voce}</div>
      <div class="text-sm" style="margin-bottom:4px;"><strong>Tic:</strong> ${tic}</div>
      <div class="text-sm"><strong>Stile:</strong> ${stile}</div>
    `;
    Debug.log(`Accento generato: ${voce}`);
  },

  rollTreasure: () => {
    const cr = parseInt(document.getElementById('gen-cr-input')?.value) || 0;
    const tipo = document.getElementById('gen-cr-type')?.value || 'individuale';
    const el = document.getElementById('gen-treasure-result');
    if (!el) return;

    let rame = 0, argento = 0, elettro = 0, oro = 0, platino = 0;
    const d = (n, f) => {
      let t = 0;
      for (let i = 0; i < n; i++) t += Math.floor(Math.random()*f)+1;
      return t;
    };

    if (tipo === 'individuale') {
      if (cr <= 4) { rame = d(5,6)*100; argento = d(2,6)*10; oro = d(1,6); }
      else if (cr <= 10) { argento = d(4,6)*100; oro = d(2,6)*10; elettro = d(1,6); }
      else if (cr <= 16) { oro = d(4,6)*100; platino = d(1,6)*10; }
      else { oro = d(6,6)*1000; platino = d(3,6)*100; }
    } else {

      if (cr <= 4) { rame = d(6,6)*100; argento = d(3,6)*100; oro = d(2,6)*10; }
      else if (cr <= 10) { oro = d(2,6)*100; argento = d(2,6)*1000; platino = d(1,6)*10; }
      else if (cr <= 16) { oro = d(4,6)*1000; platino = d(5,6)*100; }
      else { oro = d(12,6)*1000; platino = d(8,6)*1000; }
    }

    const rolls = [];
    if (rame > 0)    rolls.push(`<span>🟤 ${rame.toLocaleString('it-IT')} mr</span>`);
    if (argento > 0) rolls.push(`<span>⚪ ${argento.toLocaleString('it-IT')} ma</span>`);
    if (elettro > 0) rolls.push(`<span>🔵 ${elettro.toLocaleString('it-IT')} me</span>`);
    if (oro > 0)     rolls.push(`<span style="color:var(--accent-secondary)">🟡 ${oro.toLocaleString('it-IT')} mo</span>`);
    if (platino > 0) rolls.push(`<span style="color:var(--accent-info)">🔷 ${platino.toLocaleString('it-IT')} mp</span>`);

    el.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:8px;font-family:var(--font-mono);font-size:0.82rem;margin-top:4px;">
        ${rolls.join('')}
      </div>
      <div class="text-xs text-muted" style="margin-top:4px;">CR ${cr} · ${tipo}</div>
    `;
    Debug.log(`Tesoro CR${cr}: ${rolls.map(r=>r.replace(/<[^>]+>/g,'')).join(', ')}`);
  },

  rollShop: async () => {
    const tipo    = document.getElementById('gen-shop-tipo')?.value    || 'generale';
    const att     = document.getElementById('gen-shop-att')?.value     || 'neutrale';
    const livello = document.getElementById('gen-shop-livello')?.value || 'medio';
    const el      = document.getElementById('gen-shop-result');
    if (!el) return;

    el.innerHTML = '<div class="text-muted text-sm">Generazione in corso...</div>';

    const attMult = { ostile: 1.2, diffidente: 1.1, neutrale: 1.0, cordiale: 0.9, amico: 0.8 };
    const mult  = attMult[att] || 1.0;
    const sconto = mult < 1 ? `🟢 ${Math.round((1-mult)*100)}% sconto` : mult > 1 ? `🔴 +${Math.round((mult-1)*100)}% rincaro` : '';

    const camp   = App.getActiveCampaign();
    const sistema = camp?.system === '5e2014' ? '5e2014' : '5e2024';
    const eqFile = sistema === '5e2014' ? 'srd_5_1_equipment.json'   : 'srd_5_2_1_equipment.json';
    const miFile = sistema === '5e2014' ? 'srd_5_1_magic_items.json' : 'srd_5_2_1_magic_items.json';

    let eqData = [], miData = [], sanePrices = {};
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch('data/' + eqFile),
        fetch('data/' + miFile),
        fetch('data/sane_prices.json'),
      ]);
      if (r1.ok) eqData = await r1.json();
      if (r2.ok) miData = await r2.json();
      if (r3.ok) sanePrices = await r3.json();
    } catch(e) { Debug.warn('Shop fetch:', e.message); }

    const parseCosto = (s) => {
      const m = String(s||'').match(/^([\d.,]+)\s*(\w+)$/);
      return m ? { p: parseFloat(m[1].replace(',','.')), u: m[2] } : null;
    };

    const getSanePrice = (nome) => {
      if (!nome) return null;

      if (sanePrices[nome]) return { p: sanePrices[nome], u: 'mo' };

      const nLow = nome.toLowerCase();
      for (const [k, v] of Object.entries(sanePrices)) {
        if (k.toLowerCase() === nLow) return { p: v, u: 'mo' };
      }
      return null;
    };

    const prezziRarita = {
      'comune':      { min: 50,    max: 100   },
      'common':      { min: 50,    max: 100   },
      'non comune':  { min: 101,   max: 500   },
      'uncommon':    { min: 101,   max: 500   },
      'raro':        { min: 501,   max: 5000  },
      'rare':        { min: 501,   max: 5000  },
      'molto raro':  { min: 5001,  max: 50000 },
      'very rare':   { min: 5001,  max: 50000 },
      'rara':        { min: 501,   max: 5000  },
      'molto rara':  { min: 5001,  max: 50000 },
    };

    const prezzoRarita = (r) => {
      const key = (r||'').toLowerCase();
      const range = prezziRarita[key];
      if (!range) return null;
      return range.min + Math.floor(Math.random() * (range.max - range.min));
    };

    const catMap = {
      armaiolo_base:  ['Mischia semplice', 'Distanza semplice', 'Leggera', 'Scudo'],
      armaiolo_lusso: ['Mischia da guerra', 'Distanza da guerra', 'Media', 'Pesante', 'Scudo'],
      speziale:       ["Equipaggiamento d'avventura", 'Dotazioni'],
      generale:       ["Equipaggiamento d'avventura", 'Dotazioni', 'Strumenti da artigiano', 'Strumenti'],
      magia:          ["Equipaggiamento d'avventura", 'Dotazioni', 'Strumenti speciali', 'Strumenti'],
      bazar:          ["Equipaggiamento d'avventura", 'Dotazioni', 'Giochi', 'Merci'],
      taverna_shop:   ['Vitto e alloggio', 'Stile di vita', 'Servizi', 'Servizi magici'],
      biblioteca:    ["Equipaggiamento d'avventura", 'Strumenti'],  // fallback, gestito separatamente
    };

    if (tipo === 'biblioteca') {
      el.innerHTML = '<div class="text-muted text-sm">Usa il generatore <strong>📚 Biblioteca</strong> nella griglia per le pergamene. Lo Shop mostra equipaggiamento fisico.</div>';

      const prezziScroll = { basso:{0:10,1:60}, medio:{0:10,1:60,2:120,3:200,4:320}, alto:{0:10,1:60,2:120,3:200,4:320,5:640,6:1280} };
      const scrollLv = prezziScroll[livello] || prezziScroll.medio;
      const nomeNeg = rnd(['Archivio di Fratel Aldric','Scriptorium del Borgo','La Libreria Arcana']);
      el.innerHTML = `<div style="font-family:var(--font-display);font-size:0.8rem;color:var(--accent-secondary);margin-bottom:6px;">${nomeNeg} <span class="badge badge-muted" style="font-size:0.6rem;">${lvLabel}</span></div>` +
        '<table style="width:100%;border-collapse:collapse;font-size:0.78rem;"><thead><tr>' +
        '<th style="text-align:left;padding:3px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-muted);">Pergamena</th>' +
        '<th style="text-align:right;padding:3px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-muted);">Prezzo</th>' +
        '</tr></thead><tbody>' +
        Object.entries(scrollLv).map(([lv, p]) => {
          const prezFin = Math.round(p * mult);
          return `<tr><td style="padding:3px 0;border-bottom:1px solid var(--border);">📜 Pergamena magica (${lv}° livello)</td>` +
            `<td style="padding:3px 0;border-bottom:1px solid var(--border);text-align:right;font-family:var(--font-mono);color:var(--accent-secondary);">${prezFin} mo</td></tr>`;
        }).join('') +
        '</tbody></table>' +
        '<div class="text-muted text-sm" style="margin-top:6px;">Livelli disponibili variano per dimensione biblioteca. Usa il generatore 📚 per la lista completa.</div>';
      Debug.log(`Shop biblioteca: ${nomeNeg}`);
      return;
    }

    const prezzoMax = { basso: 75, medio: 750, alto: 999999 };
    const maxP = prezzoMax[livello] || 750;

    const raritaOk = {
      basso:  ['comune', 'common'],
      medio:  ['comune', 'common', 'non comune', 'uncommon'],
      alto:   ['comune', 'common', 'non comune', 'uncommon', 'raro', 'rara', 'rare'],
    };
    const rarOk = raritaOk[livello] || raritaOk.medio;

    const magicoFisso = {
      basso: [
        { n: 'Pozione di guarigione',         p: 50,  u: 'mo', qMin:2, qMax:5 },
        { n: 'Pergamena magica (0° livello)',  p: 10,  u: 'mo', qMin:2, qMax:4 },
        { n: 'Pergamena magica (1° livello)',  p: 60,  u: 'mo', qMin:1, qMax:3 },
      ],
      medio: [
        { n: 'Pozione di guarigione',              p: 50,   u: 'mo', qMin:2, qMax:4 },
        { n: 'Pozione di guarigione superiore',    p: 150,  u: 'mo', qMin:1, qMax:2 },
        { n: 'Pergamena magica (2° livello)',      p: 120,  u: 'mo', qMin:1, qMax:2 },
        { n: 'Pergamena magica (3° livello)',      p: 200,  u: 'mo', qMin:1, qMax:1 },
        { n: 'Arma +1',                            p: 1000, u: 'mo', qMin:1, qMax:1, raro:true },
        { n: 'Scudo +1',                           p: 1500, u: 'mo', qMin:1, qMax:1, raro:true },
        { n: 'Armatura +1',                        p: 1500, u: 'mo', qMin:1, qMax:1, raro:true },
      ],
      alto: [
        { n: 'Pozione di guarigione eccezionale',  p: 450,  u: 'mo', qMin:1, qMax:3 },
        { n: 'Pozione di guarigione suprema',      p: 1350, u: 'mo', qMin:1, qMax:2 },
        { n: 'Pergamena magica (4° livello)',      p: 320,  u: 'mo', qMin:1, qMax:2 },
        { n: 'Pergamena magica (5° livello)',      p: 640,  u: 'mo', qMin:1, qMax:1 },
        { n: 'Arma +1',                            p: 1000, u: 'mo', qMin:1, qMax:2, raro:true },
        { n: 'Arma +2',                            p: 4000, u: 'mo', qMin:1, qMax:1, raro:true },
        { n: 'Scudo +1',                           p: 1500, u: 'mo', qMin:1, qMax:1, raro:true },
        { n: 'Scudo +2',                           p: 6000, u: 'mo', qMin:1, qMax:1, raro:true },
        { n: 'Armatura +1',                        p: 1500, u: 'mo', qMin:1, qMax:1, raro:true },
        { n: 'Armatura +2',                        p: 6000, u: 'mo', qMin:1, qMax:1, raro:true },
      ],
    };

    const cats = catMap[tipo] || catMap.generale;

    const toMo = (p, u) => {
      if (u === 'mr') return p / 10;
      if (u === 'ma') return p / 5;
      if (u === 'mp') return p * 10;
      return p;
    };

    let pool = eqData
      .filter(x => cats.includes(x.categoria))
      .map(x => { const c = parseCosto(x.costo); return c ? { ...c, n: x.nome, qMin:1, qMax:4, id:x.id } : null; })
      .filter(x => x && toMo(x.p, x.u) <= maxP);

    if (tipo === 'magia' || tipo === 'bazar' || tipo === 'armaiolo_lusso') {

      const miPool = miData
        .filter(x => rarOk.includes((x.rarita||'').toLowerCase()))
        .map(x => {
          const sane = getSanePrice(x.nome);
          const p = sane ? sane.p : prezzoRarita(x.rarita);
          return p ? { n: x.nome, p, u: 'mo', qMin:1, qMax:1, raro:true, id:x.id } : null;
        })
        .filter(Boolean);

      const fissi = magicoFisso[livello] || [];
      pool = [...pool, ...miPool, ...fissi];
    } else if (tipo === 'speziale') {
      pool = [...pool, ...(magicoFisso[livello]||[]).filter(x => x.n.includes('ozione') || x.n.includes('ergamena'))];
    }

    if (pool.length === 0) {
      pool = [
        { n:'Pugnale', p:2, u:'mo', qMin:2, qMax:6 },
        { n:'Torcia', p:1, u:'mr', qMin:5, qMax:20 },
        { n:'Razioni (1 giorno)', p:5, u:'mr', qMin:5, qMax:15 },
        { n:'Corda canapa (15m)', p:1, u:'mo', qMin:2, qMax:5 },
        { n:'Scudo', p:10, u:'mo', qMin:1, qMax:3 },
      ];
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const count = Math.min(shuffled.length, 8 + Math.floor(Math.random() * 5));
    const selected = shuffled.slice(0, count).map(i => ({
      ...i, qty: (i.qMin||1) + Math.floor(Math.random() * ((i.qMax||1) - (i.qMin||1) + 1))
    }));

    const nomiNeg = {
      armaiolo_base:  ['Al Ferro Antico','La Spada Spuntata','Forge di Ugrosh'],
      armaiolo_lusso: ['Lame d\'Argento','L\'Arsenal del Re','Acciaio & Gloria'],
      speziale:       ['L\'Erba Buona','Pozioni di Mirna','Il Calderone Verde'],
      generale:       ['Bottega del Viaggiatore','Il Sacco Pesante','Merce Varia di Polt'],
      magia:          ['L\'Occhio di Vecna','Arcana Borealis','Il Grimorio Aperto'],
      bazar:          ['Curiosità di Zarnax','Il Bazar del Caos','Oggetti Misteriosi'],
      taverna_shop:   ['La Fiasca Traboccante','Il Drago Ubriaco','Locanda dei Viandanti'],
      biblioteca:    ['Archivio di Fratel Aldric','Scriptorium del Borgo','La Libreria Arcana'],
    };
    const nomeNeg = rnd(nomiNeg[tipo] || ['Negozio']);
    const lvLabel = { basso:'Liv. 1–4', medio:'Liv. 5–10', alto:'Liv. 11+' }[livello] || '';
    const edLabel = sistema === '5e2014' ? '2014' : '2024';

    el.innerHTML = `
      <div style="font-family:var(--font-display);font-size:0.8rem;color:var(--accent-secondary);margin-bottom:6px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;">
        <span>${nomeNeg}${sconto ? ` <span class="badge badge-muted">${sconto}</span>` : ''}</span>
        <span style="display:flex;gap:4px;">
          <span class="badge badge-muted" style="font-size:0.6rem;">${lvLabel}</span>
          <span class="badge badge-muted" style="font-size:0.6rem;">${edLabel}</span>
        </span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:0.78rem;">
        <thead><tr>
          <th style="text-align:left;padding:3px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-muted);">Oggetto</th>
          <th style="text-align:center;padding:3px 4px;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-muted);">Qt.</th>
          <th style="text-align:right;padding:3px 0;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-muted);">Prezzo cad.</th>
        </tr></thead>
        <tbody>${selected.map(item => {
          const prezzoFin = Math.round(item.p * mult * 10) / 10;
          const mostra = item.raro ? '<span class="badge badge-gold" style="font-size:0.58rem;">magico</span> ' : '';
          const nomeCell = `<span style="cursor:pointer;color:var(--accent-secondary);text-decoration:underline dotted;" onclick="CompendioCache.openItem(this.dataset.nome)" data-nome="${item.n.replace(/"/g,'&quot;')}" title="Apri nel Compendio">${mostra}${item.n} 🔗</span>`;
          return `<tr>
            <td style="padding:3px 0;border-bottom:1px solid var(--border);">${nomeCell}</td>
            <td style="padding:3px 4px;border-bottom:1px solid var(--border);text-align:center;font-family:var(--font-mono);color:var(--text-muted);">×${item.qty}</td>
            <td style="padding:3px 0;border-bottom:1px solid var(--border);text-align:right;font-family:var(--font-mono);color:var(--accent-secondary);">${prezzoFin.toLocaleString('it-IT')} ${item.u}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>`;
    Debug.log(`Shop: ${nomeNeg} | ${sistema} | ${livello} | ${selected.length} items`);
  },

  rollLoot: () => {
    const tipo   = document.getElementById('gen-loot-tipo')?.value   || 'mostro';
    const cr     = parseInt(document.getElementById('gen-loot-cr')?.value) || 0;
    const el     = document.getElementById('gen-loot-result');
    if (!el) return;

    const d  = (n, f) => { let t = 0; for (let i = 0; i < n; i++) t += Math.floor(Math.random()*f)+1; return t; };
    const r  = (arr) => arr[Math.floor(Math.random()*arr.length)];
    const pct= (p) => Math.random()*100 < p;

    const gemme_basse  = ['Ematite (10 mo)','Agata (10 mo)','Occhio di tigre (10 mo)','Turchese (10 mo)','Diaspro (10 mo)'];
    const gemme_medie  = ['Granato (100 mo)','Giada (100 mo)','Spinello (100 mo)','Tormalina (100 mo)','Crisolito (100 mo)'];
    const gemme_alte   = ['Perla (500 mo)','Topazio (500 mo)','Zaffiro (1000 mo)','Rubino (5000 mo)','Diamante (5000 mo)'];

    const arte_bassa  = ['Statua d\'argento (25 mo)','Osso intagliato (25 mo)','Bicchiere d\'oro (25 mo)','Ciotola di elettro (25 mo)'];
    const arte_media  = ['Tapisserie di seta (250 mo)','Incensiere d\'argento (250 mo)','Scatola d\'avorio (250 mo)'];
    const arte_alta   = ['Torque d\'oro (750 mo)','Idolo d\'oro (750 mo)','Corona d\'argento (7500 mo)'];

    const magia_A = ['Pozione di cura','Olio scivolante','Antitossina','Pozione d\'arrampicata','Pergamena (incantesimo liv.1)'];
    const magia_B = ['Pozione di cura superiore','Stivali del passo lungo','Mantello di protezione','Barra di ferro pieghevole','Pergamena (incantesimo liv.2-3)'];
    const magia_C = ['Pozione di guarigione grande','Anello di nuoto','Amuleto di salute','Bracciali di difesa','Pergamena (incantesimo liv.4-5)'];
    const magia_D = ['Spada +1','Armatura +1','Anello di resistenza','Mantello dell\'elfo','Borse senza fondo'];
    const magia_E = ['Spada +2','Bracciali d\'arco','Anello di invisibilità','Occhio dell\'aquila','Cintura della forza del gigante'];
    const magia_F = ['Spada +3','Armatura +2','Anello dei tre desideri','Mantello del ragno','Bacchetta del mago di guerra'];

    let monete = '', extras = [];

    const useElettro = App.getActiveCampaign()?.useElettro || false;

    if (tipo === 'mostro' || tipo === 'scrigno') {
      if (cr <= 4) {
        const mr = d(5,6)*100; const ma = d(2,6)*10; const mo = d(1,6);
        monete = `🟤 ${mr} mr · ⚪ ${ma} ma · 🟡 ${mo} mo`;
      } else if (cr <= 10) {
        const mr = d(2,6)*50; const ma = d(4,6)*100; const mo = d(2,6)*10;
        const me = useElettro ? d(1,6)*10 : 0;
        monete = `🟤 ${mr} mr · ⚪ ${ma} ma${me ? ' · 🔵 ' + me + ' me' : ''} · 🟡 ${mo} mo`;
        if (pct(40)) extras.push('💎 ' + r(gemme_basse));
        if (pct(20)) extras.push('💎 ' + r(gemme_medie));
        if (pct(20)) extras.push('🖼️ ' + r(arte_media));
        if (pct(25)) extras.push('✨ ' + r(magia_B));
        if (pct(10)) extras.push('✨ ' + r(magia_C));
      } else if (cr <= 16) {
        const mo = d(4,6)*100; const mp = d(1,6)*10;
        monete = `🟡 ${mo} mo · 🔷 ${mp} mp`;
        if (pct(50)) extras.push('💎 ' + r(gemme_medie));
        if (pct(30)) extras.push('💎 ' + r(gemme_alte));
        if (pct(30)) extras.push('🖼️ ' + r(arte_alta));
        if (pct(35)) extras.push('✨ ' + r(magia_C));
        if (pct(20)) extras.push('✨ ' + r(magia_D));
      } else {
        const mo = d(6,6)*1000; const mp = d(3,6)*100;
        monete = `🟡 ${mo.toLocaleString('it-IT')} mo · 🔷 ${mp} mp`;
        if (pct(70)) extras.push('💎 ' + r(gemme_alte));
        if (pct(50)) extras.push('🖼️ ' + r(arte_alta));
        if (pct(40)) extras.push('✨ ' + r(magia_D));
        if (pct(25)) extras.push('✨ ' + r(magia_E));
        if (pct(10)) extras.push('✨ ' + r(magia_F));
      }
    }

    const tematici = {
      bandito:   ['Borsa di cuoio con 2d6 mo', 'Chiave arrugginita', 'Lettera con istruzioni cifrate', 'Spada corta usurata', 'Mappa parziale di un dungeon'],
      guardia:   ['Uniforme della città', 'Fischietto d\'argento (5 mo)', '2d6 mo di paga', 'Manette', 'Ordini scritti del capitano'],
      mago:      ['Libro degli incantesimi danneggiato', 'Componenti arcane (1d6×10 mo)', 'Pergamena (incantesimo casuale)', 'Gemma come focus (50 mo)', 'Note su un esperimento'],
      sacerdote: ['Simbolo sacro (25 mo)', 'Acqua santa (fiala)', 'Libro di preghiere', '2d6 mo nelle offerte', 'Reliquia (valore incerto)'],
      mercante:  [`${d(2,6)*10} mo in cassa`, 'Manifesto di carico', 'Sigillo di una gilda', 'Campione di merce esotica', 'Lettera di credito (100 mo)'],
      non_morto: ['Dente d\'oro (5 mo)', 'Amuleto funerario (10 mo)', 'Olio di unzione (25 mo)', 'Pergamena antica illeggibile', 'Frammento di osso inciso'],
      drago:     [`🔷 ${d(6,6)*1000} mp · 🟡 ${d(12,6)*1000} mo`, '💎 ' + r(gemme_alte), '💎 ' + r(gemme_alte), '✨ ' + r(magia_E), '✨ ' + r(magia_F)],
      tomba:     ['Urna funeraria (50 mo)', 'Gioiello sepolcrale (100 mo)', 'Amuleto antico (25 mo)', '💎 ' + r(gemme_medie), pct(30) ? '✨ ' + r(magia_C) : 'Bende mummificate (inutili)'],
    };

    if (tipo !== 'mostro' && tipo !== 'scrigno' && tematici[tipo]) {
      const items = tematici[tipo];
      extras = items.sort(() => Math.random()-0.5).slice(0, 3 + Math.floor(Math.random()*3));
      monete = '';
    }

    const linkItem = (testo) => {
      if (!testo.startsWith('✨')) return `<span>${testo}</span>`;
      const nomePulito = testo.replace('✨ ', '').replace(/ \(.*\)$/, '').trim();
      return `<span style="cursor:pointer;color:var(--accent-secondary);text-decoration:underline dotted;"
        onclick="CompendioCache.openItem('${nomePulito.replace(/'/g,"\'")}')" title="Cerca nel Compendio">✨ ${nomePulito} 🔗</span>`;
    };

    const rows = extras.map(e => `
      <div style="display:flex;align-items:baseline;gap:6px;padding:3px 0;border-bottom:1px solid var(--border);font-size:0.82rem;">
        ${linkItem(e)}
      </div>`).join('') || '<div class="text-muted text-sm">Nessun oggetto speciale (sfortuna!)</div>';

    el.innerHTML = `
      ${monete ? `<div style="font-family:var(--font-mono);font-size:0.82rem;color:var(--accent-secondary);margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid var(--border);">${monete}</div>` : ''}
      ${rows}
      <div class="text-xs text-muted" style="margin-top:6px;">${tipo === 'mostro' || tipo === 'scrigno' ? `CR ${cr}` : tipo}</div>`;
    Debug.log(`Loot generato: tipo=${tipo}, CR=${cr}, extras=${extras.length}`);
  },

  calcViaggio: () => {
    const terreno = document.getElementById('gen-viaggio-terreno')?.value || 'strada';
    const ritmo   = document.getElementById('gen-viaggio-ritmo')?.value   || 'normale';
    const mezzo   = document.getElementById('gen-viaggio-mezzo')?.value   || 'piedi';
    const giorni  = parseInt(document.getElementById('gen-viaggio-giorni')?.value) || 1;
    const el      = document.getElementById('gen-viaggio-result');
    if (!el) return;

    const velBase = {
      piedi:  { lento: 24, normale: 32, veloce: 40 },
      cavallo:{ lento: 32, normale: 48, veloce: 64 },
      barca:  { lento: 24, normale: 40, veloce: 56 },
      nave:   { lento: 48, normale: 80, veloce: 96 },
    };

    const terrenoMult = {
      strada:   1.0, pianura: 0.9, foresta: 0.6,
      colline:  0.7, montagna: 0.5, palude: 0.5,
      deserto:  0.7, mare: 1.0,
    };

    const incontriBase = { lento: 10, normale: 20, veloce: 35 };
    const incontriTerreno = { strada: 0.5, pianura: 1.0, foresta: 1.5, colline: 1.2, montagna: 1.3, palude: 1.4, deserto: 1.2, mare: 0.8 };

    const vel = (velBase[mezzo]?.[ritmo] || 32) * (terrenoMult[terreno] || 1.0);
    const kmTotali = Math.round(vel * giorni);
    const razTotali = giorni * 1;
    const probIncontro = Math.min(95, Math.round(incontriBase[ritmo] * (incontriTerreno[terreno] || 1.0)));

    const turniGuardia = giorni * 3;

    const percMod = ritmo === 'lento' ? '+5 Percezione passiva' : ritmo === 'veloce' ? '–5 Percezione passiva' : 'Nessun modificatore';

    const perditaStrada = terreno === 'strada' ? 'No' : terreno === 'pianura' ? '10%' : terreno === 'foresta' ? '50%' : terreno === 'montagna' ? '30%' : '25%';

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:0.82rem;">
        <div class="text-muted">Distanza totale</div>
        <div style="font-family:var(--font-mono);font-weight:700;color:var(--accent-primary);">${kmTotali} km</div>
        <div class="text-muted">Velocità/giorno</div>
        <div style="font-family:var(--font-mono);">${Math.round(vel)} km</div>
        <div class="text-muted">Razioni (per PG)</div>
        <div style="font-family:var(--font-mono);">${razTotali} ×</div>
        <div class="text-muted">Turni di guardia</div>
        <div style="font-family:var(--font-mono);">${turniGuardia}</div>
        <div class="text-muted">Prob. incontri</div>
        <div style="font-family:var(--font-mono);color:${probIncontro > 50 ? 'var(--accent-danger)' : 'var(--accent-secondary)'};">${probIncontro}% / notte</div>
        <div class="text-muted">Percezione</div>
        <div style="font-size:0.75rem;">${percMod}</div>
        <div class="text-muted">Perdersi</div>
        <div style="font-size:0.75rem;">${perditaStrada}</div>
      </div>`;
    Debug.log(`Viaggio: ${kmTotali}km in ${giorni}gg (${mezzo}, ${terreno}, ${ritmo})`);
  },

  _initEncounter: () => {

    const el = document.getElementById('enc-categorie');
    if (!el || el.children.length > 0) return;
    const categorie = EncounterBuilder._CATS;
    el.innerHTML = categorie.map(c =>
      `<label style="display:flex;align-items:center;gap:4px;cursor:pointer;padding:3px 8px;border-radius:var(--radius-sm);background:var(--bg-secondary);font-size:0.75rem;border:1px solid var(--border);">
        <input type="checkbox" data-enc-cat="${c.id}"> ${c.emoji} ${c.nome}
      </label>`
    ).join('');
  },

};

/* ── TABS HELPER ── */
const switchTab = (btn, targetId) => {
  const parent = btn.closest('.tabs');
  if (!parent) return;
  parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const container = parent.parentElement;
  if (!container) return;
  container.querySelectorAll(':scope > .tab-content').forEach(c => {
    c.classList.toggle('active', c.id === targetId);
  });
};

const switchQuestTab = (btn, status) => {
  const parent = btn.closest('.tabs');
  parent?.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['disponibile','in_corso','completata','fallita'].forEach(s => {
    const el = document.getElementById(`quest-list-${s}`);
    if (el) el.classList.toggle('active', s === status);
  });
};

/* ══════════════════════════════════════
   GESTIONE IMMAGINI (PNG, Luoghi, Fazioni)
══════════════════════════════════════ */

const _imgData = {};

const setImgPreview = (key, src) => {
  const preview = document.getElementById(`${key}-img-preview`);
  const placeholder = document.getElementById(`${key}-img-placeholder`);
  const clearBtn = document.getElementById(`${key}-img-clear`);
  const posControls = document.getElementById(`${key}-img-pos-controls`);
  if (!preview) return;
  if (src) {
    preview.src = src;
    preview.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    if (clearBtn) clearBtn.style.display = '';
    if (posControls) posControls.style.display = '';
    _imgData[key] = src;
  } else {
    preview.src = '';
    preview.style.display = 'none';
    if (placeholder) placeholder.style.display = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (posControls) posControls.style.display = 'none';
    _imgData[key] = '';
  }
};

const updateImgPreviewPos = (key) => {
  const x = document.getElementById(key + '-img-pos-x')?.value || 50;
  const y = document.getElementById(key + '-img-pos-y')?.value || 50;
  const z = document.getElementById(key + '-img-zoom')?.value || 100;
  const preview = document.getElementById(key + '-img-preview');
  if (preview && preview.src) {
    preview.style.objectPosition = x + '% ' + y + '%';
    preview.style.transform = 'scale(' + (z/100).toFixed(2) + ')';
    preview.style.transformOrigin = x + '% ' + y + '%';
  }
};

const handleImgUpload = (key) => {
  const input = document.getElementById(`${key}-img-file`);
  if (!input?.files?.[0]) return;
  const file = input.files[0];
  if (file.size > 2 * 1024 * 1024) {
    Toast.show('Immagine troppo grande (max 2MB)', 'warning');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const src = e.target.result;

    setImgPreview(key, src);

    Toast.show('Anteprima temporanea — usa un URL esterno per salvare', 'info', 4000);
  };
  reader.readAsDataURL(file);
};

const handleImgUrl = (key) => {
  const urlEl = document.getElementById(`${key}-img-url`);
  const src = urlEl?.value?.trim() || '';
  if (src && (src.startsWith('http') || src.startsWith('data:'))) {
    setImgPreview(key, src);
  } else if (!src) {
    setImgPreview(key, '');
  }
};

const clearImg = (key) => {
  setImgPreview(key, '');
  const urlEl = document.getElementById(`${key}-img-url`);
  const fileEl = document.getElementById(`${key}-img-file`);
  if (urlEl) urlEl.value = '';
  if (fileEl) fileEl.value = '';
};

const renderImgPositionabile = (src, opts) => {
  if (!src) return '';
  const h = opts?.h || '200px';
  const objPos = opts?.pos || '50% 50%';
  const zoom = opts?.zoom || 1;
  const dataId = opts?.dataId || '';
  const saveFn = opts?.saveFn || '';
  return `<div style="position:relative;width:100%;height:${h};overflow:hidden;border-radius:var(--radius-md);background:var(--bg-tertiary);margin-bottom:8px;cursor:grab;" id="img-pos-wrap-${dataId}">
    <img src="${src}" style="width:100%;height:100%;object-fit:cover;object-position:${objPos};transform:scale(${zoom});transform-origin:${objPos};transition:object-position 0.2s,transform 0.2s;" id="img-pos-${dataId}" draggable="false">
    <div style="position:absolute;bottom:4px;right:4px;display:flex;gap:3px;opacity:0.8;">
      <button onclick="imgMove('${dataId}','up',${saveFn ? '\''+saveFn+'\'' : 'null'})" class="btn btn-ghost btn-icon-sm" style="width:22px;height:22px;font-size:0.7rem;background:var(--bg-card);" title="Sposta su">↑</button>
      <button onclick="imgMove('${dataId}','down',${saveFn ? '\''+saveFn+'\'' : 'null'})" class="btn btn-ghost btn-icon-sm" style="width:22px;height:22px;font-size:0.7rem;background:var(--bg-card);" title="Sposta giù">↓</button>
      <button onclick="imgMove('${dataId}','left',${saveFn ? '\''+saveFn+'\'' : 'null'})" class="btn btn-ghost btn-icon-sm" style="width:22px;height:22px;font-size:0.7rem;background:var(--bg-card);" title="Sposta sx">←</button>
      <button onclick="imgMove('${dataId}','right',${saveFn ? '\''+saveFn+'\'' : 'null'})" class="btn btn-ghost btn-icon-sm" style="width:22px;height:22px;font-size:0.7rem;background:var(--bg-card);" title="Sposta dx">→</button>
      <button onclick="imgZoom('${dataId}','in',${saveFn ? '\''+saveFn+'\'' : 'null'})" class="btn btn-ghost btn-icon-sm" style="width:22px;height:22px;font-size:0.7rem;background:var(--bg-card);" title="Zoom in">+</button>
      <button onclick="imgZoom('${dataId}','out',${saveFn ? '\''+saveFn+'\'' : 'null'})" class="btn btn-ghost btn-icon-sm" style="width:22px;height:22px;font-size:0.7rem;background:var(--bg-card);" title="Zoom out">−</button>
    </div>
  </div>`;
};

const _imgPos = {};
const _imgZoom = {};

const imgMove = (dataId, dir, saveFn) => {
  if (!_imgPos[dataId]) _imgPos[dataId] = [50, 50];
  const step = 10;
  if (dir === 'up')    _imgPos[dataId][1] = Math.max(0, _imgPos[dataId][1] - step);
  if (dir === 'down')  _imgPos[dataId][1] = Math.min(100, _imgPos[dataId][1] + step);
  if (dir === 'left')  _imgPos[dataId][0] = Math.max(0, _imgPos[dataId][0] - step);
  if (dir === 'right') _imgPos[dataId][0] = Math.min(100, _imgPos[dataId][0] + step);
  const img = document.getElementById('img-pos-' + dataId);
  if (img) {
    const pos = _imgPos[dataId][0] + '% ' + _imgPos[dataId][1] + '%';
    const z = _imgZoom[dataId] || 1;
    img.style.objectPosition = pos;
    img.style.transform = 'scale(' + z + ')';
    img.style.transformOrigin = pos;
  }
};

const imgZoom = (dataId, dir, saveFn) => {
  if (!_imgZoom[dataId]) _imgZoom[dataId] = 1;
  if (dir === 'in')  _imgZoom[dataId] = Math.min(3, _imgZoom[dataId] + 0.2);
  if (dir === 'out') _imgZoom[dataId] = Math.max(0.5, _imgZoom[dataId] - 0.2);
  const img = document.getElementById('img-pos-' + dataId);
  if (img) {
    const pos = _imgPos[dataId] ? _imgPos[dataId][0] + '% ' + _imgPos[dataId][1] + '%' : '50% 50%';
    img.style.transform = 'scale(' + _imgZoom[dataId] + ')';
    img.style.transformOrigin = pos;
  }
};

const _imgState = {};
const _getImgState = (id, entity) => {
  if (!_imgState[id]) {
    const camp = App.getActiveCampaign();
    let obj = null;
    if (entity==='npc') obj=(camp?.npcs||[]).find(n=>n.id===id);
    if (entity==='loc') obj=(camp?.locations||[]).find(l=>l.id===id);
    if (entity==='faz') obj=(camp?.factions||[]).find(f=>f.id===id);
    _imgState[id]={x:obj?.imgPosX??50,y:obj?.imgPosY??50,z:obj?.imgZoom??100};
  }
  return _imgState[id];
};
const _applyImgState = (entity, id, s) => {
  const el = document.getElementById(entity+'-img-'+id);
  if (el) { el.style.backgroundPosition=s.x+'% '+s.y+'%'; el.style.backgroundSize=s.z+'% auto'; }
  const camp = App.getActiveCampaign();
  if (!camp) return;
  if (entity==='npc') { const npcs=(camp.npcs||[]).map(n=>n.id===id?{...n,imgPosX:s.x,imgPosY:s.y,imgZoom:s.z}:n); App.saveActiveCampaign({npcs}); }
  else if (entity==='loc') { const locations=(camp.locations||[]).map(l=>l.id===id?{...l,imgPosX:s.x,imgPosY:s.y,imgZoom:s.z}:l); App.saveActiveCampaign({locations}); }
  else if (entity==='faz') { const factions=(camp.factions||[]).map(f=>f.id===id?{...f,imgPosX:s.x,imgPosY:s.y,imgZoom:s.z}:f); App.saveActiveCampaign({factions}); }
};
const npcImgAdjust = (id,axis,delta) => { const s=_getImgState(id,'npc'); if(axis==='x')s.x=Math.max(0,Math.min(100,s.x+delta)); if(axis==='y')s.y=Math.max(0,Math.min(100,s.y+delta)); if(axis==='z')s.z=Math.max(50,Math.min(300,s.z+delta)); _applyImgState('npc',id,s); };
const locImgAdjust = (id,axis,delta) => { const s=_getImgState(id,'loc'); if(axis==='x')s.x=Math.max(0,Math.min(100,s.x+delta)); if(axis==='y')s.y=Math.max(0,Math.min(100,s.y+delta)); if(axis==='z')s.z=Math.max(50,Math.min(300,s.z+delta)); _applyImgState('loc',id,s); };
const fazImgAdjust = (id,axis,delta) => { const s=_getImgState(id,'faz'); if(axis==='x')s.x=Math.max(0,Math.min(100,s.x+delta)); if(axis==='y')s.y=Math.max(0,Math.min(100,s.y+delta)); if(axis==='z')s.z=Math.max(50,Math.min(300,s.z+delta)); _applyImgState('faz',id,s); };

const ncFmt = (cmd) => {
  document.getElementById('nc-page-content')?.focus();
  document.execCommand(cmd, false, null);
  NoteCampagna.savePage();
};

const ncFmtBlock = (tag) => {
  const el = document.getElementById('nc-page-content');
  if (!el) return;
  el.focus();

  if (['h1','h2','h3','p'].includes(tag)) {
    document.execCommand('formatBlock', false, '<' + tag + '>');
  } else if (tag === 'blockquote') {
    document.execCommand('formatBlock', false, '<blockquote>');
  }
  NoteCampagna.savePage();
};

const ncEditorKeydown = (e) => {

  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'b') { e.preventDefault(); ncFmt('bold'); }
    if (e.key === 'i') { e.preventDefault(); ncFmt('italic'); }
    if (e.key === 'u') { e.preventDefault(); ncFmt('underline'); }
  }

  if (e.key === 'Tab') {
    e.preventDefault();
    document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
  }

};

const ncInsertTag = () => {
  const tag = prompt('Nome tag (senza #):', '');
  if (!tag?.trim()) return;
  document.getElementById('nc-page-content')?.focus();
  document.execCommand('insertHTML', false,
    `<span class="nc-tag" onclick="ncClickTag(this)">#${tag.trim().toLowerCase().replace(/\s+/g,'_')}</span>&nbsp;`
  );
  NoteCampagna.savePage();
  ncUpdateTagBar();
};

const ncInsertLink = () => {
  const cats = NoteCampagna._getData ? NoteCampagna._getData() : [];

  const pages = [];
  cats.forEach(c => (c.pagine||[]).forEach(p => pages.push({ cat: c.nome, titolo: p.titolo, id: p.id })));
  if (!pages.length) { Toast.show('Nessuna nota disponibile', 'info'); return; }
  const titoli = pages.map((p,i) => `${i+1}. [${p.cat}] ${p.titolo}`).join('\n');
  const input = prompt(`Link a quale nota?\n${titoli}\n\nScrivi il titolo:`, '');
  if (!input?.trim()) return;
  const found = pages.find(p => p.titolo.toLowerCase() === input.trim().toLowerCase());
  const titolo = found ? found.titolo : input.trim();
  const cls = found ? 'nc-wikilink' : 'nc-wikilink nc-broken';
  document.getElementById('nc-page-content')?.focus();
  document.execCommand('insertHTML', false,
    `<span class="${cls}" data-link="${titolo}" onclick="ncClickLink(this)">[[${titolo}]]</span>&nbsp;`
  );
  NoteCampagna.savePage();
  ncUpdateBacklinks();
};

const ncClickTag = (el) => {
  const tag = el.textContent.slice(1);
  Toast.show(`Tag: ${tag} — usa la ricerca per filtrare`, 'info', 2000);
};

const ncClickLink = (el) => {
  const titolo = el.dataset.link;
  const cats = NoteCampagna._getData ? NoteCampagna._getData() : [];
  for (let ci = 0; ci < cats.length; ci++) {
    const pi = (cats[ci].pagine||[]).findIndex(p => p.titolo === titolo);
    if (pi >= 0) {
      NoteCampagna.selectCat(ci);
      NoteCampagna.selectPage(pi);
      return;
    }
  }
  Toast.show(`Nota "${titolo}" non trovata`, 'warning');
};

const ncUpdateTagBar = () => {
  const el = document.getElementById('nc-page-content');
  const bar = document.getElementById('nc-tag-bar');
  if (!el || !bar) return;
  const tags = [...el.querySelectorAll('.nc-tag')].map(t => t.textContent);
  const unique = [...new Set(tags)];
  if (!unique.length) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  bar.innerHTML = '<span style="color:var(--text-muted);margin-right:4px;">Tags:</span>' +
    unique.map(t => `<span class="nc-tb-tag" onclick="ncClickTag({textContent:'${t}'})">${t}</span>`).join('');
};

const ncUpdateBacklinks = () => {
  const panel = document.getElementById('nc-backlinks');
  if (!panel) return;
  const cats = NoteCampagna._getData ? NoteCampagna._getData() : [];
  const currentPage = cats[NoteCampagna._catIdx]?.pagine?.[NoteCampagna._pageIdx];
  if (!currentPage) { panel.style.display = 'none'; return; }
  const titolo = currentPage.titolo;
  const backlinks = [];
  cats.forEach((c, ci) => {
    (c.pagine||[]).forEach((p, pi) => {
      if (p.id === currentPage.id) return;
      if ((p.contenuto||'').includes(`data-link="${titolo}"`)) {
        backlinks.push({ cat: c.nome, titolo: p.titolo, ci, pi });
      }
    });
  });
  if (!backlinks.length) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  panel.innerHTML = '<span style="margin-right:6px;">🔗 Citata da:</span>' +
    backlinks.map(b =>
      `<span class="nc-bl-item" onclick="NoteCampagna.selectCat(${b.ci});NoteCampagna.selectPage(${b.pi})">
        <span style="color:var(--text-muted);font-size:0.68rem;">${b.cat} / </span>${b.titolo}
      </span>`
    ).join('');
};

const ncRefreshEditor = () => {
  ncUpdateTagBar();
  ncUpdateBacklinks();
};
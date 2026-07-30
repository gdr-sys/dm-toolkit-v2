const ExportPDF = (() => {

  const exportCampagna = async () => {
    const camp = App.getActiveCampaign();
    if (!camp) { Toast.show('Nessuna campagna attiva', 'warning'); return; }

    Toast.show('Generazione PDF in corso...', 'info', 3000);

    if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
      _exportHTML(camp);
      return;
    }

    const { jsPDF } = window.jspdf || { jsPDF };
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const pageW = 210, pageH = 297, margin = 15, contentW = pageW - margin*2;
    let y = margin;

    const addPage = () => { doc.addPage(); y = margin; };
    const checkY = (needed = 8) => { if (y + needed > pageH - margin) addPage(); };

    const title = (text, size=16) => {
      checkY(size/2 + 4);
      doc.setFontSize(size);
      doc.setFont('helvetica','bold');
      doc.setTextColor(139,38,53);
      doc.text(text, margin, y);
      y += size/2 + 4;
      doc.setTextColor(0,0,0);
    };
    const h2 = (text) => {
      checkY(10);
      doc.setFontSize(13);
      doc.setFont('helvetica','bold');
      doc.setTextColor(60,60,60);
      doc.text(text, margin, y);
      y += 7;
      doc.setDrawColor(200,200,200);
      doc.line(margin, y-2, pageW-margin, y-2);
      y += 3;
      doc.setTextColor(0,0,0);
    };
    const body = (text, indent=0) => {
      if (!text) return;
      doc.setFontSize(10);
      doc.setFont('helvetica','normal');
      doc.setTextColor(50,50,50);
      const lines = doc.splitTextToSize(text, contentW - indent);
      lines.forEach(line => { checkY(5); doc.text(line, margin+indent, y); y+=5; });
      doc.setTextColor(0,0,0);
    };
    const label = (lbl, val, indent=4) => {
      if (!val) return;
      doc.setFontSize(9);
      doc.setFont('helvetica','bold'); doc.text(lbl+':', margin+indent, y);
      doc.setFont('helvetica','normal');
      const x = margin + indent + doc.getTextWidth(lbl+': ');
      const lines = doc.splitTextToSize(String(val), contentW - indent - doc.getTextWidth(lbl+': '));
      doc.text(lines[0]||'', x, y); y += 5;
      lines.slice(1).forEach(l => { checkY(5); doc.text(l, margin+indent+20, y); y+=5; });
    };
    const separator = () => { y += 4; doc.setDrawColor(230,230,230); doc.line(margin, y, pageW-margin, y); y += 6; };

    doc.setFillColor(139,38,53);
    doc.rect(0, 0, pageW, 60, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(28); doc.setFont('helvetica','bold');
    doc.text(camp.name || 'Campagna', margin, 30);
    doc.setFontSize(12); doc.setFont('helvetica','normal');
    doc.text('DM Toolkit — Export campagna', margin, 42);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('it-IT'), margin, 52);
    doc.setTextColor(0,0,0);
    y = 70;

    if (camp.sessionRecap) {
      h2(' Ultima sessione');
      body(camp.sessionRecap);
      separator();
    }

    const quests = camp.quests || [];
    if (quests.length) {
      h2('Quest');
      quests.forEach(q => {
        checkY(12);
        doc.setFontSize(11); doc.setFont('helvetica','bold');
        const stato = {disponibile:'[ ]', in_corso:'[→]', completata:'[]', fallita:'[]'}[q.status]||'';
        doc.text(stato + ' ' + (q.title||''), margin+2, y); y += 6;
        if (q.notes) body(q.notes, 4);
        if (q.reward) { doc.setFontSize(9); doc.setFont('helvetica','italic'); doc.text('Ricompensa: '+q.reward, margin+4, y); y+=5; }
        y += 2;
      });
      separator();
    }

    const npcs = camp.npcs || [];
    if (npcs.length) {
      h2('PNG');
      npcs.forEach(n => {
        checkY(15);
        doc.setFontSize(12); doc.setFont('helvetica','bold');
        doc.text((n.name||''), margin+2, y); y+=6;
        label('Razza/Classe', [n.race,n.job].filter(Boolean).join(' · '));
        if (n.trait) label('Personalità', n.trait);
        if (n.wants) label('Vuole', n.wants);
        if (n.secret) { doc.setFontSize(9); doc.setFont('helvetica','italic'); doc.setTextColor(139,38,53); doc.text('[Segreto DM] '+n.secret, margin+4, y); y+=5; doc.setTextColor(0,0,0); }
        y += 3;
      });
      separator();
    }

    const locs = camp.locations || [];
    if (locs.length) {
      h2('Luoghi');
      locs.forEach(l => {
        checkY(12);
        doc.setFontSize(12); doc.setFont('helvetica','bold');
        doc.text((l.nome||''), margin+2, y); y+=6;
        if (l.tipo) label('Tipo', l.tipo);
        if (l.descrizione) body(l.descrizione, 4);
        y += 3;
      });
      separator();
    }

    const faz = camp.factions || [];
    if (faz.length) {
      h2('Fazioni');
      faz.forEach(f => {
        checkY(12);
        doc.setFontSize(12); doc.setFont('helvetica','bold');
        doc.text((f.nome||''), margin+2, y); y+=6;
        if (f.descrizione) body(f.descrizione, 4);
        y += 3;
      });
      separator();
    }

    const wiki = camp.wiki || {};
    ['lore','sessioni'].forEach(sec => {
      const notes = wiki[sec] || [];
      if (!notes.length) return;
      h2(sec==='lore' ? 'Lore' : 'Sessioni');
      notes.forEach(n => {
        checkY(12);
        doc.setFontSize(12); doc.setFont('helvetica','bold');
        doc.text((n.titolo||'Senza titolo'), margin+2, y); y+=6;
        if (n.contenuto) {
          const plain = n.contenuto.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
          body(plain.slice(0,500) + (plain.length>500?'...':''), 4);
        }
        y += 3;
      });
      separator();
    });

    const filename = (camp.name||'campagna').replace(/[^a-zA-Z0-9]/g,'_') + '_' + new Date().toISOString().slice(0,10) + '.pdf';
    doc.save(filename);
    Toast.show('PDF esportato: '+filename, 'success', 3000);
  };

  const _exportHTML = (camp) => {
    const win = window.open('', '_blank');
    if (!win) { Toast.show('Popup bloccato — abilita i popup per il download', 'warning'); return; }
    const npcs = (camp.npcs||[]).map(n => `<h3>${n.name||''}</h3><p>${n.trait||''} ${n.wants||''}</p>`).join('');
    const quests = (camp.quests||[]).map(q => `<h3>${q.title||''}</h3><p>${q.notes||''}</p>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${camp.name||'Campagna'}</title>
      <style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;color:#222}h1{color:#8b2635}h2{border-bottom:2px solid #8b2635;padding-bottom:4px}@media print{body{margin:0}}</style>
<style>
/* Toast sopra la mobile nav su mobile */
@media (max-width: 768px) {
  .toast-container,
  #toast-container,
  [class*="toast-box"],
  [id*="toast"] {
    bottom: calc(70px + env(safe-area-inset-bottom, 0px)) !important;
  }
}

/* ── DENSITÀ UI — protezioni minime ── */
/* In modalità compatta i form-input non scendono sotto 120px */
.form-input, .form-select, .form-textarea {
  min-width: 80px;
}
/* I card-title non vanno a capo in modo strano */
.card-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Le label non si sovrappongono */
.form-label {
  min-height: 16px;
  display: block;
}
/* I badge/chip hanno min-width */
[style*="border-radius:var(--radius-full)"] {
  white-space: nowrap;
}

</style>
</head>
      <body><h1>${camp.name||'Campagna'}</h1>
      <p><em>Export del ${new Date().toLocaleDateString('it-IT')}</em></p>
      ${camp.sessionRecap?'<h2>Ultima sessione</h2><p>'+camp.sessionRecap+'</p>':''}
      ${quests?'<h2>Quest</h2>'+quests:''}
      ${npcs?'<h2>PNG</h2>'+npcs:''}
      <script>window.print();<\/script>
<!-- Modal setup Google Drive -->
<div class="modal-overlay hidden" id="modal-gdrive-setup" style="display:none;" onclick="if(event.target===this)Modal.close('gdrive-setup')">
  <div class="modal" style="max-width:480px;">
    <div class="modal-header">
      <h3 class="modal-title"> Configura Google Drive</h3>
      <button class="btn btn-ghost btn-icon-sm" onclick="Modal.close('gdrive-setup')"></button>
    </div>
    <div class="modal-body" style="font-size:0.85rem;line-height:1.7;">
      <p>Per sincronizzare e collaborare tramite Google Drive ti serve un <strong>Client ID OAuth 2.0</strong> gratuito.</p>
      <ol style="padding-left:1.4em;margin:10px 0;">
        <li>Vai su <a href="https://console.cloud.google.com" target="_blank" style="color:#5ba4f5;">console.cloud.google.com</a></li>
        <li>Crea progetto → abilita <strong>Google Drive API</strong></li>
        <li>Credenziali → OAuth 2.0 Client ID → tipo <strong>Web</strong></li>
        <li>Aggiungi <code style="background:var(--bg-tertiary);padding:1px 5px;border-radius:3px;">https://gdr-sys.github.io</code> come origine autorizzata</li>
        <li>Copia il Client ID qui sotto</li>
      </ol>
      <input id="gdrive-client-id-input" type="text" class="form-input" placeholder="xxxxxx.apps.googleusercontent.com" style="margin-bottom:8px;">
      <p style="font-size:0.75rem;color:var(--text-muted);">Il Client ID viene salvato solo sul tuo dispositivo.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="Modal.close('gdrive-setup')">Annulla</button>
      <button class="btn btn-primary" onclick="GDrive._saveClientId()">Salva e connetti</button>
    </div>
  </div>
</div>

<!-- Modal opzioni Google Drive (quando già connesso) -->
<div class="modal-overlay hidden" id="modal-gdrive-options" style="display:none;" onclick="if(event.target===this)Modal.close('gdrive-options')">
  <div class="modal" style="max-width:440px;">
    <div class="modal-header">
      <h3 class="modal-title"> Google Drive</h3>
      <button class="btn btn-ghost btn-icon-sm" onclick="Modal.close('gdrive-options')"></button>
    </div>
    <div class="modal-body">
      <div id="gdrive-user-info" style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg-secondary);border-radius:var(--radius-md);margin-bottom:16px;">
        <div style="width:36px;height:36px;background:var(--accent-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1rem;"></div>
        <div id="gdrive-user-name" style="font-size:0.88rem;"></div>
      </div>

      <!-- Salva su Drive -->
      <div style="margin-bottom:12px;">
        <button class="btn btn-primary w-full" onclick="GDriveUI.syncNow()">
           Salva campagna su Drive
        </button>
      </div>

      <!-- Invita collaboratore -->
      <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:12px;">
        <div style="font-family:var(--font-display);font-size:0.82rem;font-weight:600;margin-bottom:8px;"> Invita collaboratore</div>
        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">Genera un codice da condividere con il co-autore.</p>
        <div style="display:flex;gap:8px;">
          <input id="gdrive-invite-code" type="text" class="form-input" placeholder="Codice generato qui..." readonly style="flex:1;font-family:var(--font-mono);font-size:0.9rem;letter-spacing:0.1em;" onclick="this.select()">
          <button class="btn btn-secondary" onclick="GDriveUI.generateInvite()">Genera</button>
        </div>
        <div id="gdrive-invite-hint" style="font-size:0.72rem;color:var(--text-muted);margin-top:6px;"></div>
      </div>

      <!-- Unisciti con codice -->
      <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:12px;">
        <div style="font-family:var(--font-display);font-size:0.82rem;font-weight:600;margin-bottom:8px;"> Unisciti a una campagna</div>
        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">Hai un codice invito? Inseriscilo per accedere alla campagna condivisa.</p>
        <div style="display:flex;gap:8px;">
          <input id="gdrive-join-code" type="text" class="form-input" placeholder="Inserisci codice..." style="flex:1;font-family:var(--font-mono);text-transform:uppercase;" maxlength="20">
          <button class="btn btn-primary" onclick="GDriveUI.joinCampaign()">Accedi</button>
        </div>
      </div>

      <!-- Disconnect -->
      <div style="border-top:1px solid var(--border);padding-top:12px;">
        <button class="btn btn-ghost btn-sm" onclick="GDrive.logout()" style="color:var(--accent-danger);">Disconnetti Google Drive</button>
      </div>
    </div>
  </div>
</div>

<!-- Modal: Configura Firebase -->
<div class="modal-overlay hidden" id="modal-firebase-setup" style="display:none;" onclick="if(event.target===this)Modal.close('firebase-setup')">
  <div class="modal" style="max-width:520px;">
    <div class="modal-header">
      <h3 class="modal-title"> Configura Firebase</h3>
      <button class="btn btn-ghost btn-icon-sm" onclick="Modal.close('firebase-setup')"></button>
    </div>
    <div class="modal-body" style="font-size:0.85rem;line-height:1.7;">
      <p>Firebase è <strong>gratuito</strong> e permette collaborazione in tempo reale. Setup in 5 minuti:</p>
      <ol style="padding-left:1.4em;margin:10px 0 16px;">
        <li>Vai su <a href="https://console.firebase.google.com" target="_blank" style="color:#f5a623;">console.firebase.google.com</a></li>
        <li>Crea progetto → abilita <strong>Google Authentication</strong></li>
        <li>Crea <strong>Realtime Database</strong> (modalità test)</li>
        <li>Impostazioni progetto → Aggiungi app Web → copia la config</li>
        <li>Aggiungi <code style="background:var(--bg-tertiary);padding:1px 5px;border-radius:3px;">gdr-sys.github.io</code> ai domini autorizzati</li>
      </ol>
      <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:10px;margin-bottom:12px;">
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px;">Incolla qui la tua Firebase config (oggetto JS):</div>
        <textarea id="fb-config-input" rows="8" class="form-textarea" style="font-family:var(--font-mono);font-size:0.72rem;" placeholder='{
  "apiKey": "...",
  "authDomain": "...",
  "databaseURL": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}'></textarea>
      </div>
      <p style="font-size:0.72rem;color:var(--text-muted);">La config viene salvata nel tuo browser. Non contiene dati sensibili — è la configurazione pubblica dell'app.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="Modal.close('firebase-setup')">Annulla</button>
      <button class="btn btn-primary" onclick="FirebaseSync.saveConfig()">Salva e connetti</button>
    </div>
  </div>
</div>

<!-- Modal: Scegli come entrare -->
<div class="modal-overlay hidden" id="modal-auth-choice" style="display:none;" onclick="if(event.target===this)Modal.close('auth-choice')">
  <div style="background:var(--bg-card);border-radius:16px 16px 0 0;width:100%;max-width:460px;box-sizing:border-box;overflow:hidden;max-height:90vh;overflow-y:auto;">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 18px 12px;border-bottom:1px solid var(--border);">
      <span style="font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--text-primary);">Benvenuto nel DM Toolkit</span>
      <button onclick="Modal.close('auth-choice')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px;line-height:0;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <!-- Body -->
    <div style="padding:14px;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;">

      <!-- Solo locale -->
      <button onclick="FirebaseSync.useLocal();Modal.close('auth-choice')"
        style="display:flex;align-items:center;gap:12px;width:100%;padding:12px;background:transparent;border:1px solid var(--border);border-radius:10px;cursor:pointer;box-sizing:border-box;text-align:left;min-width:0;">
        <span style="flex-shrink:0;width:24px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="3" width="20" height="14" rx="2"/>
  <line x1="8" y1="21" x2="16" y2="21"/>
  <line x1="12" y1="17" x2="12" y2="21"/>
</svg></span>
        <span style="display:flex;flex-direction:column;min-width:0;flex:1;overflow:hidden;">
          <span style="font-family:var(--font-display);font-size:0.88rem;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Solo locale</span>
          <span style="font-size:0.73rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Dati nel browser. Nessun account richiesto.</span>
        </span>
      </button>

      <!-- Anonimo -->
      <button onclick="FirebaseSync.loginAnonymous();Modal.close('auth-choice')"
        style="display:flex;align-items:center;gap:12px;width:100%;padding:12px;background:transparent;border:1px solid var(--border);border-radius:10px;cursor:pointer;box-sizing:border-box;text-align:left;min-width:0;">
        <span style="flex-shrink:0;width:24px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</svg></span>
        <span style="display:flex;flex-direction:column;min-width:0;flex:1;overflow:hidden;">
          <span style="font-family:var(--font-display);font-size:0.88rem;font-weight:600;color:var(--text-primary);">Anonimo</span>
          <span style="font-size:0.73rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Cloud senza account. Aggiornabile a Google in seguito.</span>
        </span>
      </button>

      <!-- Google -->
      <button onclick="FirebaseSync.loginGoogle()"
        style="display:flex;align-items:center;gap:12px;width:100%;padding:12px;background:transparent;border:1px solid var(--border);border-radius:10px;cursor:pointer;box-sizing:border-box;text-align:left;min-width:0;">
        <span style="flex-shrink:0;width:24px;display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
</svg></span>
        <span style="display:flex;flex-direction:column;min-width:0;flex:1;overflow:hidden;">
          <span style="font-family:var(--font-display);font-size:0.88rem;font-weight:600;color:var(--text-primary);">Accedi con Google</span>
          <span style="font-size:0.73rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Sync multi-dispositivo e collaborazione.</span>
        </span>
      </button>

      <!-- Email/Password -->
      <div style="border:1px solid var(--border);border-radius:10px;padding:12px;box-sizing:border-box;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <span style="flex-shrink:0;width:24px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
  <polyline points="22,6 12,13 2,6"/>
</svg></span>
          <span style="display:flex;flex-direction:column;min-width:0;">
            <span style="font-family:var(--font-display);font-size:0.88rem;font-weight:600;color:var(--text-primary);">Email e Password</span>
            <span style="font-size:0.73rem;color:var(--text-muted);">Registrati o accedi con email.</span>
          </span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <input id="auth-email" type="email" placeholder="email@esempio.com"
            style="width:100%;box-sizing:border-box;padding:9px 12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:0.85rem;outline:none;">
          <input id="auth-password" type="password" placeholder="Password (min 6 caratteri)"
            style="width:100%;box-sizing:border-box;padding:9px 12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:0.85rem;outline:none;"
            onkeydown="if(event.key==='Enter')FirebaseSync.loginEmail()">
          <div style="display:flex;gap:6px;">
            <button onclick="FirebaseSync.loginEmail()"
              style="flex:1;padding:9px;background:var(--accent-primary);color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:var(--font-display);font-size:0.82rem;font-weight:600;">Accedi</button>
            <button onclick="FirebaseSync.registerEmail()"
              style="flex:1;padding:9px;background:transparent;color:var(--text-primary);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-family:var(--font-display);font-size:0.82rem;">Registrati</button>
          </div>
          <div id="auth-email-error" style="font-size:0.72rem;color:var(--accent-danger);display:none;"></div>
        </div>
      </div>

      <p style="font-size:0.71rem;color:var(--text-muted);text-align:center;margin:4px 0 0;padding:0 4px;">
        Puoi cambiare modalita in qualsiasi momento dalle impostazioni.
      </p>
    </div>
  </div>
</div></div>
</div>

<!-- Modal: Invita collaboratore -->
<div class="modal-overlay hidden" id="modal-collab" style="display:none;" onclick="if(event.target===this)Modal.close('collab')">
  <div class="modal" style="max-width:440px;">
    <div class="modal-header">
      <h3 class="modal-title"> Collaborazione</h3>
      <button class="btn btn-ghost btn-icon-sm" onclick="Modal.close('collab')"></button>
    </div>
    <div class="modal-body">
      <!-- Info utente -->
      <div id="collab-user-info" style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg-secondary);border-radius:var(--radius-md);margin-bottom:16px;">
        <img id="collab-user-photo" src="" style="width:36px;height:36px;border-radius:50%;display:none;">
        <div id="collab-user-placeholder" style="width:36px;height:36px;background:var(--accent-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;"></div>
        <div>
          <div id="collab-user-name" style="font-size:0.88rem;font-weight:600;"></div>
          <div id="collab-user-email" style="font-size:0.72rem;color:var(--text-muted);"></div>
        </div>
      </div>

      <!-- Co-autori online -->
      <div id="collab-online" style="margin-bottom:16px;display:none;">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.05em;"> Online ora</div>
        <div id="collab-online-list" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
      </div>

      <!-- Invita -->
      <div style="border-top:1px solid var(--border);padding-top:14px;margin-bottom:14px;">
        <div style="font-family:var(--font-display);font-size:0.85rem;font-weight:600;margin-bottom:6px;"> Invita co-autore</div>
        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">Condividi il codice campagna — il co-autore lo inserisce per accedere.</p>
        <div style="display:flex;gap:8px;align-items:center;">
          <code id="collab-camp-code" style="flex:1;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);padding:8px 12px;font-size:0.9rem;letter-spacing:0.12em;text-align:center;cursor:pointer;" onclick="FirebaseSync.copyCode()" title="Clicca per copiare">—</code>
          <button class="btn btn-ghost btn-sm" onclick="FirebaseSync.copyCode()"> Copia</button>
        </div>
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">Codice di 6 caratteri — condividilo con il co-autore. Valido finché la campagna esiste su Firebase.</div>
      </div>

      <!-- Unisciti -->
      <div style="border-top:1px solid var(--border);padding-top:14px;margin-bottom:14px;">
        <div style="font-family:var(--font-display);font-size:0.85rem;font-weight:600;margin-bottom:6px;"> Unisciti a una campagna</div>
        <div style="display:flex;gap:8px;">
          <input id="collab-join-code" type="text" class="form-input" placeholder="Codice campagna..." style="flex:1;font-family:var(--font-mono);text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()">
          <button class="btn btn-primary btn-sm" onclick="FirebaseSync.joinCampaign()">Accedi</button>
        </div>
      </div>

      <!-- Sync status -->
      <div id="collab-sync-status" style="border-top:1px solid var(--border);padding-top:12px;font-size:0.75rem;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;">
        <span id="collab-last-sync">Nessuna sync</span>
        <button class="btn btn-ghost btn-sm" onclick="FirebaseSync.syncNow()">↻ Sincronizza</button>
      </div>

      <!-- Upgrade anonimo → Google -->
      <div id="collab-upgrade-section" style="border-top:1px solid var(--border);padding-top:12px;margin-top:4px;display:none;">
        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;">
          Stai usando un account anonimo. Passa a Google per collaborare e sincronizzare su più dispositivi.
        </div>
        <button class="btn btn-secondary btn-sm" onclick="FirebaseSync.upgradeToGoogle()">
           Collega account Google
        </button>
      </div>

      <!-- Logout -->
      <div style="margin-top:12px;display:flex;gap:8px;align-items:center;">
        <button class="btn btn-ghost btn-sm" onclick="FirebaseSync.logout()" style="color:var(--accent-danger);font-size:0.75rem;">Esci</button>
        <button class="btn btn-ghost btn-sm" onclick="FirebaseSync.switchMode()" style="font-size:0.75rem;">Cambia modalità</button>
      </div>
    </div>
  </div>
</div>

<!-- @mention selector -->
<div id="mention-dropdown" style="display:none;position:fixed;z-index:900;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-xl);min-width:260px;max-height:280px;overflow-y:auto;">
  <div style="padding:6px 10px;font-size:0.68rem;color:var(--text-muted);font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--border);">Collega a...</div>
  <div id="mention-list" style="padding:4px 0;"></div>
</div>

<!-- Modal: Sessione (crea/modifica) -->
<div class="modal-overlay hidden" id="modal-session-log" style="display:none;" onclick="if(event.target===this)Modal.close('session-log')">
  <div class="modal" style="max-width:600px;">
    <div class="modal-header">
      <h3 class="modal-title" id="session-log-title">Nuova Sessione</h3>
      <button class="btn btn-ghost btn-icon-sm" onclick="Modal.close('session-log')"></button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">
      <input type="hidden" id="sl-id">

      <div class="grid-2" style="gap:10px;">
        <div class="form-group">
          <label class="form-label">Numero sessione</label>
          <input type="number" id="sl-numero" class="form-input" min="1" placeholder="1">
        </div>
        <div class="form-group">
          <label class="form-label">Data</label>
          <input type="date" id="sl-data" class="form-input">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Titolo</label>
        <input type="text" id="sl-titolo" class="form-input" placeholder="es. La taverna di Waterdeep">
      </div>

      <div class="form-group">
        <label class="form-label">Stato</label>
        <select id="sl-stato" class="form-select">
          <option value="pianificata">Pianificata</option>
          <option value="in_corso">In corso</option>
          <option value="giocata">Giocata</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">PNG coinvolti</label>
        <div id="sl-npcs-list" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;"></div>
        <select id="sl-npcs-select" class="form-select" onchange="SessioniLog.addNpc(this.value);this.value=''">
          <option value="">Aggiungi PNG...</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Note di prep</label>
        <textarea id="sl-note-prep" class="form-textarea" rows="3" placeholder="Obiettivi, segreti da rivelare, incontri preparati..."></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Recap (dopo la sessione)</label>
        <textarea id="sl-recap" class="form-textarea" rows="3" placeholder="Cosa è successo, decisioni del party, conseguenze..."></textarea>
      </div>

    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="Modal.close('session-log')">Annulla</button>
      <button class="btn btn-primary" onclick="SessioniLog.save()">Salva Sessione</button>
    </div>
  </div>
</div>

<!-- Modal: Impostazioni -->
<div class="modal-overlay hidden" id="modal-settings" style="display:none;" onclick="if(event.target===this)Modal.close('settings')">
  <div class="modal" style="max-width:520px;max-height:90vh;overflow-y:auto;">
    <div class="modal-header" style="position:sticky;top:0;background:var(--bg-card);z-index:1;">
      <h3 class="modal-title">Impostazioni</h3>
      <button class="btn btn-ghost btn-icon-sm" onclick="Modal.close('settings')"></button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:20px;padding:20px;">

      <!-- Aspetto -->
      <section>
        <h4 style="font-family:var(--font-display);font-size:0.82rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin:0 0 12px;">Aspetto</h4>

        <!-- Tema e sfondo -->
        <div style="margin-bottom:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div>
              <div style="font-size:0.88rem;font-weight:600;">Tema</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">Scuro o chiaro</div>
            </div>
            <div style="display:flex;gap:6px;">
              <button id="theme-btn-dark" onclick="Settings.setTheme('dark')"
                class="btn btn-sm" style="font-size:0.78rem;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Scuro</button>
              <button id="theme-btn-light" onclick="Settings.setTheme('light')"
                class="btn btn-sm" style="font-size:0.78rem;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> Chiaro</button>
            </div>
          </div>
          <!-- Colore sfondo -->
          <div>
            <div style="font-size:0.78rem;font-weight:600;margin-bottom:6px;">Colore di sfondo</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button onclick="Settings.setBg('default')" id="bg-btn-default" class="btn btn-sm settings-bg-btn" data-bg="default" style="font-size:0.72rem;">Default</button>
              <button onclick="Settings.setBg('gray-900')" id="bg-btn-gray-900" class="btn btn-ghost btn-sm settings-bg-btn" data-bg="gray-900" style="font-size:0.72rem;background:#111;">Grigio scuro</button>
              <button onclick="Settings.setBg('gray-800')" id="bg-btn-gray-800" class="btn btn-ghost btn-sm settings-bg-btn" data-bg="gray-800" style="font-size:0.72rem;background:#1f2937;">Grigio medio</button>
              <button onclick="Settings.setBg('gray-700')" id="bg-btn-gray-700" class="btn btn-ghost btn-sm settings-bg-btn" data-bg="gray-700" style="font-size:0.72rem;background:#374151;">Grigio chiaro</button>
              <button onclick="Settings.setBg('slate')" id="bg-btn-slate" class="btn btn-ghost btn-sm settings-bg-btn" data-bg="slate" style="font-size:0.72rem;background:#1e293b;">Ardesia</button>
              <button onclick="Settings.setBg('parchment')" id="bg-btn-parchment" class="btn btn-ghost btn-sm settings-bg-btn" data-bg="parchment" style="font-size:0.72rem;background:#f5f0e8;color:#333;">Pergamena</button>
            </div>
          </div>
        </div>

        <!-- Dimensione font -->
        <div style="margin-bottom:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div>
              <div style="font-size:0.88rem;font-weight:600;">Dimensione testo</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">Scala il testo dell'interfaccia</div>
            </div>
            <span id="font-size-label" style="font-size:0.82rem;color:var(--accent-secondary);font-weight:600;">100%</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button onclick="Settings.setFontSize(85)"  class="btn btn-ghost btn-sm settings-font-btn" data-size="85"  style="font-size:0.72rem;">85%</button>
            <button onclick="Settings.setFontSize(100)" class="btn btn-ghost btn-sm settings-font-btn" data-size="100" style="font-size:0.78rem;">100%</button>
            <button onclick="Settings.setFontSize(110)" class="btn btn-ghost btn-sm settings-font-btn" data-size="110" style="font-size:0.82rem;">110%</button>
            <button onclick="Settings.setFontSize(125)" class="btn btn-ghost btn-sm settings-font-btn" data-size="125" style="font-size:0.88rem;">125%</button>
            <button onclick="Settings.setFontSize(150)" class="btn btn-ghost btn-sm settings-font-btn" data-size="150" style="font-size:0.95rem;">150%</button>
          </div>
        </div>

        <!-- Densità / Zoom UI -->
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div>
              <div style="font-size:0.88rem;font-weight:600;">Densità interfaccia</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">Spazio tra elementi, larghezza contenuto</div>
            </div>
            <span id="ui-density-label" style="font-size:0.82rem;color:var(--accent-secondary);font-weight:600;">Normale</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button onclick="Settings.setDensity('compact')"  class="btn btn-ghost btn-sm settings-density-btn" data-density="compact"  style="font-size:0.72rem;">Compatto</button>
            <button onclick="Settings.setDensity('normal')"   class="btn btn-ghost btn-sm settings-density-btn" data-density="normal"   style="font-size:0.78rem;">Normale</button>
            <button onclick="Settings.setDensity('spacious')" class="btn btn-ghost btn-sm settings-density-btn" data-density="spacious" style="font-size:0.82rem;">Spazioso</button>
            <button onclick="Settings.setDensity('wide')"     class="btn btn-ghost btn-sm settings-density-btn" data-density="wide"     style="font-size:0.82rem;">Wide</button>
          </div>
        </div>
      </section>

      <!-- Account -->
      <section style="border-top:1px solid var(--border);padding-top:16px;">
        <h4 style="font-family:var(--font-display);font-size:0.82rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin:0 0 12px;">Account & Sync</h4>
        <div id="settings-auth-info" style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:12px;margin-bottom:10px;">
          <div style="font-size:0.85rem;color:var(--text-muted);">Non connesso — modalità locale</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="Modal.close('settings');FirebaseSync.toggleAuth()">
            Gestisci account
          </button>
          <button class="btn btn-ghost btn-sm" onclick="ExportMarkdown.exportAll()" title="Esporta tutta la wiki come Markdown compatibile Obsidian">
            ↓ <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export Wiki
          </button>
        </div>
      </section>

      <!-- Google Drive Backup -->
      <section style="border-top:1px solid var(--border);padding-top:16px;">
        <h4 style="font-family:var(--font-display);font-size:0.82rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin:0 0 12px;">Backup su Google Drive</h4>
        <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:12px;margin-bottom:10px;font-size:0.82rem;">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span id="drive-settings-label" style="color:var(--text-muted);">Non collegato</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button id="drive-connect-btn" class="btn btn-primary btn-sm" onclick="DriveBackup.connect()">Collega Drive</button>
          <button id="drive-backup-now-btn" class="btn btn-ghost btn-sm" style="display:none;" onclick="DriveBackup.backupNow()">Salva ora su Drive</button>
          <button id="drive-disconnect-btn" class="btn btn-ghost btn-sm" style="display:none;color:var(--accent-danger);" onclick="DriveBackup.disconnect()">Scollega</button>
        </div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:8px;" id="drive-last-backup"></div>
      </section>

      <!-- Supporta il progetto -->
      <section style="border-top:1px solid var(--border);padding-top:16px;">
        <h4 style="font-family:var(--font-display);font-size:0.82rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin:0 0 12px;">Supporta il progetto</h4>
        <a href="https://ko-fi.com/noemimarcolini" target="_blank" rel="noopener"
          style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);text-decoration:none;color:var(--text-primary);transition:border-color 0.15s;"
          onmouseenter="this.style.borderColor='#FF5E5B'" onmouseleave="this.style.borderColor='var(--border)'">
          <span style="color:#FF5E5B;flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></span>
          <div>
            <div style="font-size:0.88rem;font-weight:600;">Ko-fi — noemimarcolini</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">Se questo toolkit ti è utile, offrimi un caffè!</div>
          </div>
        </a>
      </section>

      <!-- Altre app -->
      <section style="border-top:1px solid var(--border);padding-top:16px;">
        <h4 style="font-family:var(--font-display);font-size:0.82rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin:0 0 12px;">Altre app per il tuo gioco</h4>
        <div style="display:flex;flex-direction:column;gap:8px;">

          <a href="https://gdr-toolbox.noemi-marcolini.workers.dev/" target="_blank" rel="noopener"
            style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);text-decoration:none;color:var(--text-primary);"
            onmouseenter="this.style.borderColor='var(--accent-primary)'" onmouseleave="this.style.borderColor='var(--border)'">
            <span style="color:var(--accent-primary);flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span>
            <div>
              <div style="font-size:0.85rem;font-weight:600;">GDR Toolbox</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">Tutte le webapp per il gioco di ruolo in un posto</div>
            </div>
            <span style="margin-left:auto;color:var(--text-muted);flex-shrink:0;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>
          </a>

          <a href="https://gdr-sys.github.io/Compendio-incantesimi-homebrew/" target="_blank" rel="noopener"
            style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);text-decoration:none;color:var(--text-primary);"
            onmouseenter="this.style.borderColor='var(--accent-primary)'" onmouseleave="this.style.borderColor='var(--border)'">
            <span style="color:#c97bea;flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>
            <div>
              <div style="font-size:0.85rem;font-weight:600;">Compendio Incantesimi Homebrew</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">Raccogli e consulta i tuoi incantesimi personalizzati</div>
            </div>
            <span style="margin-left:auto;color:var(--text-muted);flex-shrink:0;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>
          </a>

          <a href="https://gdr-sys.github.io/The-Hungry-Dragon/" target="_blank" rel="noopener"
            style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);text-decoration:none;color:var(--text-primary);"
            onmouseenter="this.style.borderColor='var(--accent-primary)'" onmouseleave="this.style.borderColor='var(--border)'">
            <span style="color:var(--accent-danger);flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12s1.5-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></span>
            <div>
              <div style="font-size:0.85rem;font-weight:600;">The Hungry Dragon</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">Gestione taverna e negozio per il tuo party</div>
            </div>
            <span style="margin-left:auto;color:var(--text-muted);flex-shrink:0;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>
          </a>

          <a href="https://grimoire-forge.vercel.app/" target="_blank" rel="noopener"
            style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);text-decoration:none;color:var(--text-primary);"
            onmouseenter="this.style.borderColor='var(--accent-primary)'" onmouseleave="this.style.borderColor='var(--border)'">
            <span style="color:#f5a623;flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>
            <div>
              <div style="font-size:0.85rem;font-weight:600;">Grimoire Forge</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">Crea e gestisci il tuo grimorio personalizzato</div>
            </div>
            <span style="margin-left:auto;color:var(--text-muted);flex-shrink:0;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>
          </a>

        </div>
      </section>

      <!-- Info app -->
      <section style="border-top:1px solid var(--border);padding-top:16px;">
        <h4 style="font-family:var(--font-display);font-size:0.82rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin:0 0 8px;">Informazioni</h4>
        <div style="font-size:0.78rem;color:var(--text-muted);line-height:1.7;">
          <div>DM Toolkit — versione 2.0</div>
          <div>Dati SRD D&D 5e — OGL/ORC — Wizards of the Coast</div>
          <div style="margin-top:4px;">
            <a href="https://github.com/gdr-sys/dm-toolkit" target="_blank" style="color:var(--accent-primary);text-decoration:none;display:inline-flex;align-items:center;gap:4px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg> GitHub</a>
            &nbsp;·&nbsp;
            <a href="https://ko-fi.com/noemimarcolini" target="_blank" style="color:var(--accent-primary);text-decoration:none;">Ko-fi</a>
          </div>
        </div>
      </section>

    </div>
  </div>
</div>

<!-- Modal: Connetti Google Drive (post-login) -->
<div class="modal-overlay hidden" id="modal-drive-welcome" style="display:none;" onclick="if(event.target===this)Modal.close('drive-welcome')">
  <div class="modal" style="max-width:440px;">
    <div class="modal-header" style="border-bottom:none;padding-bottom:0;">
      <button class="btn btn-ghost btn-icon-sm" onclick="DriveBackup.dismissWelcome()" style="margin-left:auto;">✕</button>
    </div>
    <div class="modal-body" style="padding:8px 24px 24px;text-align:center;">

      <!-- Icona -->
      <div style="width:56px;height:56px;background:linear-gradient(135deg,var(--accent-primary),#c97bea);border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>

      <h3 style="font-family:var(--font-display);font-size:1.2rem;margin:0 0 8px;">Metti al sicuro la tua campagna</h3>
      <p style="font-size:0.85rem;color:var(--text-muted);line-height:1.6;margin:0 0 20px;">
        Ogni avventura merita di essere preservata. Collega Google Drive e le tue campagne verranno salvate automaticamente in una cartella <strong>DM Toolkit</strong> sul tuo Drive — al sicuro, sempre accessibili, solo tuoi.
      </p>

      <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:12px 16px;margin-bottom:20px;text-align:left;">
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;gap:10px;font-size:0.82rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Backup automatico ad ogni salvataggio</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.82rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>File JSON nella tua cartella Drive — sempre esportabile</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.82rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Nessun dato extra su Firebase — lo storage è tuo</span>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <button class="btn btn-primary" style="width:100%;padding:12px;" onclick="DriveBackup.connectFromWelcome()">
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Collega Google Drive
          </div>
        </button>
        <button class="btn btn-ghost" style="width:100%;font-size:0.82rem;color:var(--text-muted);" onclick="DriveBackup.dismissWelcome()">
          Non ora — posso farlo dalle impostazioni
        </button>
      </div>

    </div>
  </div>
</div>

<!-- Image Viewer Overlay -->
<div id="img-viewer-overlay" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);cursor:zoom-out;align-items:center;justify-content:center;"
  onclick="ImageViewer.close()">
  <div style="position:relative;max-width:90vw;max-height:90vh;user-select:none;" onclick="event.stopPropagation()">
    <img id="img-viewer-img" src="" alt=""
      style="max-width:90vw;max-height:85vh;object-fit:contain;border-radius:var(--radius-md);cursor:grab;transition:transform 0.1s;"
      draggable="false">
    <div style="position:absolute;bottom:-36px;left:50%;transform:translateX(-50%);display:flex;gap:8px;align-items:center;">
      <button onclick="ImageViewer.zoom(-0.25)" style="background:rgba(255,255,255,0.15);border:none;border-radius:50%;width:32px;height:32px;color:#fff;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">−</button>
      <span id="img-viewer-zoom" style="color:#fff;font-size:0.78rem;min-width:40px;text-align:center;">100%</span>
      <button onclick="ImageViewer.zoom(0.25)" style="background:rgba(255,255,255,0.15);border:none;border-radius:50%;width:32px;height:32px;color:#fff;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">+</button>
      <button onclick="ImageViewer.reset()" style="background:rgba(255,255,255,0.15);border:none;border-radius:var(--radius-sm);height:32px;padding:0 10px;color:#fff;cursor:pointer;font-size:0.75rem;">Reset</button>
      <button onclick="ImageViewer.close()" style="background:rgba(255,255,255,0.15);border:none;border-radius:50%;width:32px;height:32px;color:#fff;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">✕</button>
    </div>
  </div>
</div>

</body></html>`);
    win.document.close();
  };

  return { exportCampagna };
})();
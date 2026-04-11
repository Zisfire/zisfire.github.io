/**
 * @file script/album/profile.js
 * Chargement et affichage du profil d'un utilisateur Bastocos.
 *
 * Actif uniquement quand le paramètre URL "Profile=<nom>" est présent.
 * Charge UsersData/<nom>.json + globaldata.json, puis affiche :
 *  - En-tête : avatar, nom, ID, bilan V/D/N
 *  - Onglet Cartes    (avec barre de progression)
 *  - Onglet Armures   (avec barre de progression)
 *  - Onglet Armes     (avec barre de progression)
 *  - Onglet Déchets   (avec total de revente)
 *  - Onglet Statistiques
 */

(function initProfilePage() {
  'use strict';

  // ── Vérification du mode ──────────────────────────────────────────────────
  const params      = new URLSearchParams(window.location.search);
  const profileName = params.get('Profile');
  if (!profileName) {
    console.log('[album/profile] Aucun paramètre Profile — module inactif.');
    return;
  }

  console.log(`[album/profile] Paramètre Profile détecté : "${profileName}"`);

  // ── Hamburger ─────────────────────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('nav-menu');
  hamburger.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
  });

  // ── Masquage de la section recherche ─────────────────────────────────────
  // (déjà géré par le script inline dans album.html, mais on s'assure ici aussi)
  const sectionSearch  = document.getElementById('section-search');
  const sectionProfile = document.getElementById('section-profile');
  sectionSearch.hidden  = true;
  sectionProfile.hidden = false;

  // ── Store interne pour les modals (évite l'injection JSON en attribut HTML) ──
  /**
   * @type {Object.<string, object[]>}
   * Clé = identifiant d'onglet (namespace), valeur = tableau d'items
   */
  const _modalStore = {};

  /**
   * Enregistre un item dans le store modal.
   * @param {string} ns   - Namespace (identifiant de l'onglet)
   * @param {object} item - L'objet item à mémoriser
   * @returns {number} Index de l'item dans le store
   */
  function _registerItem(ns, item) {
    if (!_modalStore[ns]) _modalStore[ns] = [];
    const idx = _modalStore[ns].length;
    _modalStore[ns].push(item);
    return idx;
  }

  /**
   * Récupère un item depuis le store modal.
   * @param {string} ns  - Namespace
   * @param {number} idx - Index
   * @returns {object|null}
   */
  function _getItem(ns, idx) {
    return (_modalStore[ns] ?? [])[idx] ?? null;
  }

  // ── Utilitaires ───────────────────────────────────────────────────────────
  /**
   * Échappe les caractères HTML spéciaux pour éviter les injections XSS.
   * @param {*} str
   * @returns {string}
   */
  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Formate une date ISO en format lisible français.
   * @param {string|null} iso
   * @returns {string}
   */
  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  // ── Messages d'erreur ─────────────────────────────────────────────────────
  /**
   * Affiche un message "profil non trouvé" avec un lien retour.
   * @param {string} name
   */
  function showProfileNotFound(name) {
    console.warn(`[album/profile] Profil non trouvé : "${name}"`);
    sectionProfile.innerHTML = `
      <div class="profile-error">
        <p class="fetch-err">⚠ Aucun profil trouvé pour <strong>${escHtml(name)}</strong>.</p>
        <p class="profile-error-sub">Ce joueur n'existe pas encore ou une mise à jour est en cours.</p>
        <a href="album.html" class="btn-voir-page" style="display:inline-block;margin-top:1.5rem;">
          ← Retour à la recherche
        </a>
      </div>`;
  }

  /** Affiche un message d'erreur générique. */
  function showProfileError() {
    console.error('[album/profile] Erreur inattendue lors du chargement.');
    sectionProfile.innerHTML = `
      <div class="profile-error">
        <p class="fetch-err">⚠ Une erreur est survenue lors du chargement du profil.</p>
        <a href="album.html" class="btn-voir-page" style="display:inline-block;margin-top:1.5rem;">
          ← Retour à la recherche
        </a>
      </div>`;
  }

  // ── Chargement des données ────────────────────────────────────────────────
  sectionProfile.innerHTML = '<p class="loading">Chargement du profil…</p>';

  console.log('[album/profile] Chargement de globaldata.json et profil utilisateur…');

  Promise.all([
    fetch('globaldata.json').then(r => {
      if (!r.ok) throw new Error(`globaldata HTTP ${r.status}`);
      return r.json();
    }),
    fetch(`UsersData/${encodeURIComponent(profileName)}.json`).then(r => {
      if (r.status === 404) return null; // Profil inexistant
      if (!r.ok) throw new Error(`profil HTTP ${r.status}`);
      return r.json();
    }),
  ])
    .then(([rawGlobal, rawUser]) => {
      if (rawUser === null) {
        showProfileNotFound(profileName);
        return;
      }
      const gd   = new GlobalData(rawGlobal);
      const user = new User(rawUser);
      console.log(`[album/profile] Données chargées pour "${user.name}" — Rendu en cours…`);
      renderProfile(user, gd);
    })
    .catch(err => {
      console.error('[album/profile] Erreur lors du fetch :', err);
      showProfileError();
    });

  // ── Rendu principal ───────────────────────────────────────────────────────
  /**
   * Construit et insère le HTML complet du profil dans sectionProfile.
   * @param {User}       user
   * @param {GlobalData} gd
   */
  function renderProfile(user, gd) {
    const s = user.stats;

    // Mise à jour du titre de page
    document.title = `Bastocos — Profil de ${user.name}`;

    sectionProfile.innerHTML = `
      <!-- ── En-tête profil ──────────────────────────────── -->
      <div class="profile-header">
        <img
          class="profile-avatar"
          src="${escHtml(user.avatar)}"
          alt="Avatar de ${escHtml(user.name)}"
          onerror="this.onerror=null;this.src='https://placehold.co/80x80/1e0f0f/c0392b?text=?'"
        />
        <div class="profile-header-info">
          <h1 class="profile-name">${escHtml(user.name)}</h1>
          <p class="profile-id">ID : ${user.id}</p>
          <p class="profile-record" title="Victoires / Défaites / Nulles">
            (${s.VictoryCount}/${s.DefeatCount}/${s.DrawCount})
          </p>
        </div>
        <a href="album.html" class="btn-back">← Recherche</a>
      </div>

      <!-- ── Navigation onglets ──────────────────────────── -->
      <ul class="tabs-nav" role="tablist" id="profile-tabs-nav">
        <li><button class="tab-btn active" role="tab" aria-selected="true"  data-tab="tab-cards">Cartes</button></li>
        <li><button class="tab-btn"        role="tab" aria-selected="false" data-tab="tab-armors">Armures</button></li>
        <li><button class="tab-btn"        role="tab" aria-selected="false" data-tab="tab-weapons">Armes</button></li>
        <li><button class="tab-btn"        role="tab" aria-selected="false" data-tab="tab-trash">Déchets</button></li>
        <li><button class="tab-btn"        role="tab" aria-selected="false" data-tab="tab-stats">Statistiques</button></li>
      </ul>

      <!-- ── Panneaux ────────────────────────────────────── -->
      <div class="tab-panels">
        <div class="tab-panel active" id="tab-cards"   role="tabpanel"></div>
        <div class="tab-panel"        id="tab-armors"  role="tabpanel"></div>
        <div class="tab-panel"        id="tab-weapons" role="tabpanel"></div>
        <div class="tab-panel"        id="tab-trash"   role="tabpanel"></div>
        <div class="tab-panel"        id="tab-stats"   role="tabpanel"></div>
      </div>`;

    // Remplissage des onglets
    renderCollectionTab('tab-cards',   user.cards,   gd.cardCount,   buildCardHtml,   true);
    renderCollectionTab('tab-armors',  user.armors,  gd.armorCount,  buildArmorHtml,  true);
    renderCollectionTab('tab-weapons', user.weapons, gd.weaponCount, buildWeaponHtml, true);
    renderTrashTab(user.trashs);
    renderStatsTab(user.stats, user.login);

    // Activer la logique d'onglets et la modal
    initTabs();
    initModal();

    console.log(`[album/profile] Profil de "${user.name}" entièrement rendu.`);
  }

  // ── Onglet collection générique ───────────────────────────────────────────
  /**
   * Remplit un onglet de collection avec barre de progression optionnelle.
   * @param {string}   tabId       - ID de l'élément DOM du panneau
   * @param {object[]} items       - Items possédés par le joueur
   * @param {number}   maxCount    - Nombre total d'items uniques dans le jeu
   * @param {Function} buildHtmlFn - (item, idx, ns) => HTMLString
   * @param {boolean}  withProgress
   */
  function renderCollectionTab(tabId, items, maxCount, buildHtmlFn, withProgress) {
    const panel = document.getElementById(tabId);
    const ns    = tabId; // namespace du store modal pour cet onglet
    let html    = '';

    // Barre de progression de la collection
    if (withProgress) {
      const unique = items.length;
      const pct    = maxCount > 0 ? Math.min(Math.round((unique / maxCount) * 100), 100) : 0;
      html += `
        <div class="progress-wrap">
          <div class="progress-label">
            Collection : ${unique} / ${maxCount}
            <span class="progress-pct">(${pct}&nbsp;%)</span>
          </div>
          <div class="progress-bar-bg"
               role="progressbar"
               aria-valuenow="${unique}"
               aria-valuemax="${maxCount}"
               aria-label="Progression de la collection">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>`;
      console.log(`[album/profile] Onglet "${tabId}" : ${unique}/${maxCount} items (${pct}%)`);
    }

    if (items.length === 0) {
      html += '<p class="profile-empty">Aucun item obtenu pour le moment.</p>';
    } else {
      html += '<div class="items-grid">';
      items.forEach(item => {
        const idx = _registerItem(ns, item);
        html += buildHtmlFn(item, idx, ns);
      });
      html += '</div>';
    }

    panel.innerHTML = html;

    // Attacher les listeners sur les boutons "En savoir +"
    panel.querySelectorAll('.btn-more').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = _getItem(btn.dataset.ns, parseInt(btn.dataset.idx, 10));
        if (item) {
          openModal(item);
        } else {
          console.warn('[album/profile] Item introuvable dans le store :', btn.dataset);
        }
      });
    });
  }

  // ── Constructeurs HTML d'items ────────────────────────────────────────────

  /**
   * Construit le HTML d'une carte.
   * @param {object} item
   * @param {number} idx
   * @param {string} ns
   * @returns {string}
   */
  function buildCardHtml(item, idx, ns) {
    return `
      <div class="item-card">
        <div class="item-count-badge">×${item.Count ?? 1}</div>
        <img src="${escHtml(item.Image)}" alt="${escHtml(item.Name)}" loading="lazy" />
        <div class="item-name">${escHtml(item.Name)}</div>
        <button class="btn-more" data-ns="${ns}" data-idx="${idx}">En savoir +</button>
      </div>`;
  }

  /**
   * Construit le HTML d'une armure.
   * @param {object} item
   * @param {number} idx
   * @param {string} ns
   * @returns {string}
   */
  function buildArmorHtml(item, idx, ns) {
    return `
      <div class="item-card">
        <div class="item-count-badge">×${item.Count ?? 1}</div>
        <img src="${escHtml(item.Image)}" alt="${escHtml(item.Name)}" loading="lazy" />
        <div class="item-name">${escHtml(item.Name)}</div>
        <div class="item-stat-mini">🛡 Défense : ${item.Defense ?? 0}</div>
        <button class="btn-more" data-ns="${ns}" data-idx="${idx}">En savoir +</button>
      </div>`;
  }

  /**
   * Construit le HTML d'une arme.
   * @param {object} item
   * @param {number} idx
   * @param {string} ns
   * @returns {string}
   */
  function buildWeaponHtml(item, idx, ns) {
    return `
      <div class="item-card">
        <div class="item-count-badge">×${item.Count ?? 1}</div>
        <img src="${escHtml(item.Image)}" alt="${escHtml(item.Name)}" loading="lazy" />
        <div class="item-name">${escHtml(item.Name)}</div>
        <div class="item-stat-mini">⚔ Attaque : ${item.Attack ?? 0}</div>
        <button class="btn-more" data-ns="${ns}" data-idx="${idx}">En savoir +</button>
      </div>`;
  }

  // ── Onglet Déchets ────────────────────────────────────────────────────────
  /**
   * Remplit l'onglet Déchets sans barre de progression,
   * mais avec le total de revente calculé.
   * @param {object[]} items
   */
  function renderTrashTab(items) {
    const panel = document.getElementById('tab-trash');
    const ns    = 'tab-trash';

    if (items.length === 0) {
      panel.innerHTML = '<p class="profile-empty">Aucun déchet collecté pour le moment.</p>';
      return;
    }

    const totalSell = items.reduce(
      (sum, t) => sum + (t.SellValue ?? 0) * (t.Count ?? 1),
      0
    );
    console.log(`[album/profile] Onglet Déchets : ${items.length} type(s), valeur totale = ${totalSell} 🪙`);

    let html = `
      <p class="trash-total-sell">
        Valeur totale de revente : <strong>${totalSell}&nbsp;🪙</strong>
      </p>
      <div class="items-grid">`;

    items.forEach(item => {
      const idx       = _registerItem(ns, item);
      const lineTotal = (item.SellValue ?? 0) * (item.Count ?? 1);
      html += `
        <div class="item-card">
          <div class="item-count-badge">×${item.Count ?? 1}</div>
          <img src="${escHtml(item.Image)}" alt="${escHtml(item.Name)}" loading="lazy" />
          <div class="item-name">${escHtml(item.Name)}</div>
          <div class="item-stat-mini">🪙 ${item.SellValue ?? 0} / pièce&ensp;(total : ${lineTotal})</div>
          <button class="btn-more" data-ns="${ns}" data-idx="${idx}">En savoir +</button>
        </div>`;
    });

    html += '</div>';
    panel.innerHTML = html;

    panel.querySelectorAll('.btn-more').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = _getItem(btn.dataset.ns, parseInt(btn.dataset.idx, 10));
        if (item) openModal(item);
      });
    });
  }

  // ── Onglet Statistiques ───────────────────────────────────────────────────
  /**
   * Remplit l'onglet Statistiques avec toutes les données du joueur.
   * @param {object} stats
   * @param {object} login
   */
  function renderStatsTab(stats, login) {
    const panel = document.getElementById('tab-stats');

    /** @type {[string, string|number][]} */
    const rows = [
      // Finances
      ['💰 Monnaie',                        stats.Money          + ' 🪙'],
      // Assauts
      ['⚔ Victoires (Assaut)',              stats.AssaultVictoryCount],
      ['💀 Défaites (Assaut)',              stats.AssaultDefeatCount],
      ['🤝 Égalités (Assaut)',              stats.AssaultDrawCount],
      ['😴 AFK (Assaut)',                   stats.AssaultAfkCount],
      ['🚀 Assauts lancés',                 stats.AssaultsLaunched],
      // Duels
      ['⚔ Victoires (Duel)',               stats.DuelVictoryCount],
      ['💀 Défaites (Duel)',               stats.DuelDefeatCount],
      ['🤝 Égalités (Duel)',               stats.DuelDrawCount],
      ['😴 AFK (Duel)',                    stats.DuelAfkCount],
      ['📋 Participations (Duel)',          stats.DuelParticipationCount],
      // Combat
      ['🏹 Total attaques',                stats.AttackCount],
      ['💥 Dégâts totaux',                stats.TotalDamage],
      ['💥 Max 1 coup (Assaut)',           stats.MaxDamageSingleHitAssault],
      ['💥 Max 1 coup (Duel)',             stats.MaxDamageSingleHitDuel],
      // Loot & collection
      ['📦 Items lootés',                  stats.LootedCount],
      ['🃏 Cartes lootées',               stats.CardsLooted],
      ['🃏 Cartes vendues',               stats.CardsSold],
      ['📊 Progression Cardex',            stats.CardexProgress],
      // Commerce
      ['🛒 Achats effectués',              stats.PurchaseCount],
      ['💵 Argent dépensé',               stats.MoneySpent       + ' 🪙'],
      ['💵 Argent gagné (ventes)',         stats.MoneyEarned      + ' 🪙'],
      // Activité
      ['📅 Jours actifs',                  stats.ActiveDays],
      ['⌨ Commandes totales',             stats.TotalCommandCount],
      // Connexions
      ['🕐 Première connexion',            formatDate(login?.FirstLogin)],
      ['🕐 Dernière connexion',            formatDate(login?.LastLogin)],
    ];

    let html = '<ul class="modal-stats profile-stats-list">';
    rows.forEach(([k, v]) => {
      html += `
        <li class="modal-stat">
          <span class="modal-stat-k">${escHtml(k)}</span>
          <span class="modal-stat-v">${escHtml(String(v ?? '—'))}</span>
        </li>`;
    });
    html += '</ul>';
    panel.innerHTML = html;

    console.log('[album/profile] Onglet Statistiques rendu.');
  }

  // ── Navigation par onglets ────────────────────────────────────────────────
  /** Active la navigation par onglets sur la section profil. */
  function initTabs() {
    const nav     = document.getElementById('profile-tabs-nav');
    const buttons = nav.querySelectorAll('.tab-btn');
    const panels  = sectionProfile.querySelectorAll('.tab-panel');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        buttons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const targetPanel = document.getElementById(target);
        if (targetPanel) targetPanel.classList.add('active');

        console.log(`[album/profile] Onglet actif : "${target}"`);
      });
    });

    console.log('[album/profile] Navigation par onglets initialisée.');
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  /** Initialise les événements de fermeture de la modal. */
  function initModal() {
    const overlay = document.getElementById('modal-overlay');
    const close   = document.getElementById('modal-close');

    if (!overlay || !close) {
      console.warn('[album/profile] Éléments de la modal introuvables dans le DOM.');
      return;
    }

    close.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') overlay.classList.remove('open');
    });

    console.log('[album/profile] Modal initialisée.');
  }

  /**
   * Ouvre la modal et la remplit avec les détails de l'item.
   * @param {object} item
   */
  function openModal(item) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    document.getElementById('modal-img').src           = item.Image ?? '';
    document.getElementById('modal-img').alt           = item.Name  ?? '';
    document.getElementById('modal-name').textContent  = item.Name  ?? '';
    document.getElementById('modal-desc').textContent  = item.Description ?? '';

    const statsList = document.getElementById('modal-stats');
    statsList.innerHTML = '';

    /** @type {[string, string|number][]} */
    const rows = [
      ['Quantité possédée', item.Count ?? 1],
    ];
    if (item.CardRarity !== undefined) rows.push(['Rareté', item.CardRarity ?? 'Standard']);
    if ((item.Attack  ?? 0) > 0)       rows.push(['Attaque',  item.Attack  + ' pts']);
    if ((item.Defense ?? 0) > 0)       rows.push(['Défense',  item.Defense + ' pts']);
    if (item.SellValue !== undefined)  rows.push(['Valeur de vente', item.SellValue + ' 🪙']);

    rows.forEach(([k, v]) => {
      const li = document.createElement('li');
      li.className = 'modal-stat';
      li.innerHTML = `
        <span class="modal-stat-k">${escHtml(String(k))}</span>
        <span class="modal-stat-v">${escHtml(String(v))}</span>`;
      statsList.appendChild(li);
    });

    overlay.classList.add('open');
    console.log(`[album/profile] Modal ouverte pour : "${item.Name ?? '?'}"`);
  }

}());

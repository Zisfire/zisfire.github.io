/**
 * @file script/album/ui.js
 * Interface de recherche de joueur — page Album de Bastocos.
 *
 * Actif uniquement quand aucun paramètre "Profile" n'est présent dans l'URL.
 * Gère : hamburger, autocomplete, validation et redirection vers le profil.
 */

(function initSearchUI() {
  'use strict';

  // ── Vérification du mode ──────────────────────────────────────────────────
  const params = new URLSearchParams(window.location.search);
  if (params.has('Profile')) {
    // Mode profil actif — ce module ne s'initialise pas
    console.log('[album/ui] Mode profil détecté, section recherche inactive.');
    return;
  }

  console.log('[album/ui] Mode recherche actif.');

  // ── Hamburger ─────────────────────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('nav-menu');
  hamburger.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
  });

  // ── Données ───────────────────────────────────────────────────────────────
  /** @type {string[]} Liste des pseudos chargés depuis users.json */
  let users   = [];
  let hlIndex = -1;

  console.log('[album/ui] Chargement de users.json…');
  fetch('users.json')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      users = data;
      console.log(`[album/ui] ${users.length} utilisateur(s) chargé(s).`);
    })
    .catch(err => {
      console.error('[album/ui] Impossible de charger users.json :', err);
    });

  // ── Références DOM ────────────────────────────────────────────────────────
  const input = document.getElementById('user-search');
  const box   = document.getElementById('autocomplete-box');
  const msg   = document.getElementById('search-msg');

  // ── Suggestions autocomplete ──────────────────────────────────────────────
  /**
   * Affiche les suggestions correspondant à la query saisie.
   * @param {string} query
   */
  function renderSuggestions(query) {
    box.innerHTML = '';
    hlIndex = -1;
    if (!query) { box.classList.remove('show'); return; }

    const matches = users.filter(u =>
      u.toLowerCase().includes(query.toLowerCase())
    );
    if (matches.length === 0) { box.classList.remove('show'); return; }

    matches.forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      li.setAttribute('role', 'option');
      li.addEventListener('mousedown', e => {
        e.preventDefault();
        selectUser(name);
      });
      box.appendChild(li);
    });
    box.classList.add('show');
  }

  /**
   * Remplit le champ avec le nom sélectionné et met à jour le message.
   * @param {string} name
   */
  function selectUser(name) {
    console.log(`[album/ui] Joueur sélectionné : "${name}"`);
    input.value = name;
    box.classList.remove('show');
    msg.className   = 'search-msg ok';
    msg.textContent = `✔ Profil trouvé : ${name}. Cliquez sur "Voir ma page" pour continuer.`;
  }

  /**
   * Affiche un message d'erreur joueur introuvable.
   * @param {string} query
   */
  function showNotFound(query) {
    console.warn(`[album/ui] Joueur introuvable : "${query}"`);
    msg.className   = 'search-msg err';
    msg.textContent = `⚠ Aucun joueur nommé « ${query} » n'a été trouvé. Une mise à jour est peut-être en cours.`;
  }

  /** Valide la saisie courante et met à jour l'état du message. */
  function validateInput() {
    const q = input.value.trim();
    if (!q) return;
    const exact = users.find(u => u.toLowerCase() === q.toLowerCase());
    if (exact) {
      selectUser(exact);
    } else {
      showNotFound(q);
    }
    box.classList.remove('show');
  }

  // ── Bouton "Voir ma page" ─────────────────────────────────────────────────
  document.getElementById('btn-voir-page').addEventListener('click', () => {
    const q = input.value.trim();
    if (!q) {
      msg.className   = 'search-msg err';
      msg.textContent = '⚠ Veuillez entrer un pseudo avant de continuer.';
      return;
    }

    box.classList.remove('show');
    const found = users.find(u => u.toLowerCase() === q.toLowerCase());
    if (found) {
      // Redirection vers la page profil via paramètre URL
      console.log(`[album/ui] Redirection vers le profil : "${found}"`);
      window.location.href = `album.html?Profile=${encodeURIComponent(found)}`;
    } else {
      showNotFound(q);
    }
  });

  // ── Événements du champ de saisie ─────────────────────────────────────────
  input.addEventListener('input', () => {
    msg.textContent = '';
    msg.className   = 'search-msg';
    renderSuggestions(input.value.trim());
  });

  input.addEventListener('keydown', e => {
    const items = box.querySelectorAll('li');
    if (!box.classList.contains('show') || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      hlIndex = Math.min(hlIndex + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('hl', i === hlIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      hlIndex = Math.max(hlIndex - 1, 0);
      items.forEach((el, i) => el.classList.toggle('hl', i === hlIndex));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (hlIndex >= 0 && items[hlIndex]) {
        selectUser(items[hlIndex].textContent);
      } else {
        validateInput();
      }
    } else if (e.key === 'Escape') {
      box.classList.remove('show');
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => box.classList.remove('show'), 150);
  });

  input.addEventListener('keyup', e => {
    if (e.key === 'Enter' && box.querySelectorAll('.hl').length === 0) {
      validateInput();
    }
  });

}());

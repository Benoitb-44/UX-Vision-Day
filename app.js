/* ============================================
   CDISCOUNT — Agent d'Achat IA "Clio"
   app.js — Logique interactive de la maquette
   ============================================ */

'use strict';

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  permLevel: 'lecture',         // 'lecture' | 'suggestion' | 'autonome'
  onboardingStep: 1,
  memoryEnabled: false,
  conversationStep: 0,          // étape du scénario pré-scripté
  typing: false,
  cartItems: [],
  actionLog: [],
};

// ─── Conversation script ──────────────────────────────────────────────────────
const SCENARIO = [
  // Étape 0 — démarrage automatique (message agent d'accueil)
  {
    type: 'agent',
    text: `Bonjour Thomas ! 👋 Je suis <strong>Clio</strong>, votre conseiller d'achat personnel Cdiscount.<br><br>Je peux vous aider à trouver le produit idéal, comparer les prix, et vous montrer si c'est le bon moment d'acheter grâce à l'historique des prix.<br><br>Vous cherchez quoi aujourd'hui ?`,
    suggestions: [
      'Je cherche un PC gamer ~800€',
      'Comparer 2 TV Samsung',
      'Mon dernier achat Cdiscount',
    ],
  },
  // Étape 1 — réponse à "PC gamer ~800€"
  {
    type: 'agent',
    text: `Super ! Pour vous faire une recommandation vraiment adaptée, j'ai besoin de quelques détails.<br><br><strong>Quel est votre usage principal ?</strong>`,
    suggestions: [
      'AAA récents (Cyberpunk, Hogwarts…)',
      'Stratégie / simulation',
      'Streaming + jeux occasionnels',
    ],
  },
  // Étape 2 — réponse à "AAA récents"
  {
    type: 'agent',
    text: `Et vous préférez un <strong>PC fixe</strong> ou un <strong>PC portable</strong> ?`,
    suggestions: [
      'PC fixe',
      'PC portable',
    ],
  },
  // Étape 3 — réponse à "PC fixe" → recommandation + cartes + graphiques
  {
    type: 'agent',
    text: `Parfait, voici ce que j'ai retenu :<br><br><em>📋 <strong>Votre besoin :</strong> PC fixe pour AAA récents, budget ~800€, livraison rapide si possible.</em><br><br>J'ai analysé le catalogue et les 90 derniers jours de prix. Voici mes 2 meilleures recommandations :`,
    extra: 'products',
    suggestions: [
      'Voir les accessoires',
      'Configurer une alerte',
      'Comparer en détail',
    ],
  },
  // Étape 4 — réponse à "Voir les accessoires"
  {
    type: 'agent',
    text: `Voici les accessoires recommandés pour compléter votre setup :<br><br>🖥️ <strong>Écran 27" 144Hz</strong> — À partir de <strong>179€</strong> · Livraison J+1<br>🎧 <strong>Casque gaming</strong> — À partir de <strong>59€</strong> · Livraison J+1<br>⌨️ <strong>Clavier + souris gaming</strong> — À partir de <strong>49€</strong> · Bundle disponible<br><br>💡 En les achetant ensemble, vous économisez <strong>jusqu'à 30€</strong> grâce aux offres abonné CàV.`,
    suggestions: [
      'Ajouter les accessoires au panier',
      'Je préfère commander sans accessoires',
      'Voir le bundle complet',
    ],
  },
  // Étape 5 — réponse à "Comparer en détail"
  {
    type: 'agent',
    text: `Voici une comparaison directe sur les critères qui comptent pour les AAA récents :<br><br><table style="width:100%;font-size:0.82rem;border-collapse:collapse;"><tr style="background:#f5f5f5;"><th style="padding:6px 8px;text-align:left;border:1px solid #e0e0e0;"></th><th style="padding:6px 8px;border:1px solid #e0e0e0;">MSI Pulse 16 AI</th><th style="padding:6px 8px;border:1px solid #e0e0e0;">ASUS TUF A16</th></tr><tr><td style="padding:6px 8px;border:1px solid #e0e0e0;font-weight:600;">GPU</td><td style="padding:6px 8px;border:1px solid #e0e0e0;">RTX 4060</td><td style="padding:6px 8px;border:1px solid #e0e0e0;">RTX 4060</td></tr><tr style="background:#f5f5f5;"><td style="padding:6px 8px;border:1px solid #e0e0e0;font-weight:600;">CPU</td><td style="padding:6px 8px;border:1px solid #e0e0e0;">Intel i7-13700H</td><td style="padding:6px 8px;border:1px solid #e0e0e0;">AMD Ryzen 7 7745H</td></tr><tr><td style="padding:6px 8px;border:1px solid #e0e0e0;font-weight:600;">RAM</td><td style="padding:6px 8px;border:1px solid #e0e0e0;">16 Go DDR5</td><td style="padding:6px 8px;border:1px solid #e0e0e0;">16 Go DDR5</td></tr><tr style="background:#f5f5f5;"><td style="padding:6px 8px;border:1px solid #e0e0e0;font-weight:600;">Stockage</td><td style="padding:6px 8px;border:1px solid #e0e0e0;">512 Go NVMe</td><td style="padding:6px 8px;border:1px solid #e0e0e0;">512 Go NVMe</td></tr><tr><td style="padding:6px 8px;border:1px solid #e0e0e0;font-weight:600;">Prix</td><td style="padding:6px 8px;border:1px solid #e0e0e0;color:#2E7D32;font-weight:700;">749€ 💚</td><td style="padding:6px 8px;border:1px solid #e0e0e0;color:#F57C00;font-weight:700;">779€ 🟡</td></tr></table><br>🏆 <strong>Mon avis :</strong> Les deux sont équivalents pour votre usage. Le MSI est un meilleur deal aujourd'hui grâce à son historique de prix favorable.`,
    suggestions: [
      'Ajouter MSI au panier',
      'Ajouter ASUS au panier',
      'Configurer une alerte',
    ],
  },
];

// ─── Products data ────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 'msi-pulse',
    icon: '🖥️',
    name: 'MSI Pulse 16 AI — Intel i7 / RTX 4060 / 16 Go / 512 Go',
    rating: 4.2,
    reviews: 847,
    price: 749,
    oldPrice: 829,
    badge: 'good',
    badgeLabel: '💚 Bon prix',
    delivery: '🚀 Livraison J+1 (abonné CàV)',
    priceHistory: generatePriceHistory(829, 749, 90),
    savings: 80,
    avgPrice: 829,
  },
  {
    id: 'asus-tuf',
    icon: '🖥️',
    name: 'ASUS TUF Gaming A16 — Ryzen 7 / RTX 4060 / 16 Go / 512 Go',
    rating: 4.0,
    reviews: 523,
    price: 779,
    oldPrice: null,
    badge: 'average',
    badgeLabel: '🟡 Prix moyen',
    delivery: '📦 Livraison en 2-3 jours',
    priceHistory: generatePriceHistory(790, 779, 90),
    savings: null,
    avgPrice: 790,
  },
];

// ─── Utils ────────────────────────────────────────────────────────────────────
function generatePriceHistory(start, end, days) {
  const pts = [];
  for (let i = 0; i < days; i++) {
    const t = i / (days - 1);
    const noise = (Math.sin(i * 0.4) * 20) + (Math.sin(i * 1.1) * 10);
    const base = start + (end - start) * t;
    pts.push(Math.round(Math.max(end * 0.9, Math.min(start * 1.1, base + noise))));
  }
  // Last point = current price
  pts[days - 1] = end;
  return pts;
}

function getTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const dom = {};
document.addEventListener('DOMContentLoaded', () => {
  dom.onboardingOverlay = document.getElementById('onboarding-overlay');
  dom.chatMessages      = document.getElementById('chat-messages');
  dom.chatInput         = document.getElementById('chat-input');
  dom.sendBtn           = document.getElementById('send-btn');
  dom.permBtns          = document.querySelectorAll('.perm-btn');
  dom.permActiveInfo    = document.getElementById('perm-active-info');
  dom.actionLogEl       = document.getElementById('action-log');
  dom.toast             = document.getElementById('toast');
  dom.modalSteps        = document.querySelectorAll('.modal-step');
  dom.modalDots         = document.querySelectorAll('.modal-dot');
  dom.memoryToggle      = document.getElementById('memory-toggle');

  init();
});

// ─── Init ────────────────────────────────────────────────────────────────────
function init() {
  // Onboarding
  document.getElementById('btn-next-1').addEventListener('click', () => goToStep(2));
  document.getElementById('btn-next-2').addEventListener('click', () => goToStep(3));
  document.getElementById('btn-back-2').addEventListener('click', () => goToStep(1));
  document.getElementById('btn-back-3').addEventListener('click', () => goToStep(2));
  document.getElementById('btn-start').addEventListener('click', startApp);

  dom.memoryToggle.addEventListener('click', () => {
    state.memoryEnabled = !state.memoryEnabled;
    dom.memoryToggle.classList.toggle('on', state.memoryEnabled);
  });

  // Permission buttons
  dom.permBtns.forEach(btn => {
    btn.addEventListener('click', () => setPermLevel(btn.dataset.level));
  });

  // Chat input
  dom.sendBtn.addEventListener('click', sendMessage);
  dom.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  dom.chatInput.addEventListener('input', () => {
    dom.chatInput.style.height = 'auto';
    dom.chatInput.style.height = dom.chatInput.scrollHeight + 'px';
  });
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
function goToStep(n) {
  state.onboardingStep = n;
  dom.modalSteps.forEach((s, i) => s.classList.toggle('active', i === n - 1));
  dom.modalDots.forEach((d, i) => d.classList.toggle('active', i === n - 1));
}

function startApp() {
  dom.onboardingOverlay.classList.add('hidden');
  // Déclenche le message d'accueil de Clio
  setTimeout(() => appendAgentMessage(SCENARIO[0]), 600);
  state.conversationStep = 1;
}

// ─── Permission levels ────────────────────────────────────────────────────────
const PERM_INFO = {
  lecture: {
    text: '<strong>Mode Lecture actif</strong><br>Clio peut rechercher, comparer et analyser les prix. Les actions (panier, alertes) nécessitent un niveau supérieur.',
    icon: '🟡',
  },
  suggestion: {
    text: '<strong>Mode Suggestion actif</strong><br>Clio peut ajouter au panier, créer des alertes prix et sauvegarder des listes. Chaque action requiert votre validation.',
    icon: '🟠',
  },
  autonome: {
    text: '<strong>Mode Autonome actif</strong><br>Clio peut commander dans le cadre que vous avez défini (budget max, produit validé). Une confirmation est toujours demandée avant exécution.',
    icon: '🔴',
  },
};

function setPermLevel(level) {
  state.permLevel = level;
  dom.permBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.level === level));
  const info = PERM_INFO[level];
  dom.permActiveInfo.innerHTML = info.text;
  logAction(info.icon + ' Niveau passé en mode ' + level.charAt(0).toUpperCase() + level.slice(1), 'info');
  showToast('Niveau d\'action : ' + level.charAt(0).toUpperCase() + level.slice(1), 'success');
}

// ─── Send message ─────────────────────────────────────────────────────────────
function sendMessage(overrideText) {
  const text = overrideText || dom.chatInput.value.trim();
  if (!text || state.typing) return;

  // Append user bubble
  appendUserMessage(text);
  dom.chatInput.value = '';
  dom.chatInput.style.height = 'auto';

  // Detect special actions
  const lower = text.toLowerCase();
  if (lower.includes('panier') || lower.includes('ajouter')) {
    handleCartAction(text);
    return;
  }
  if (lower.includes('alerte')) {
    handleAlertAction();
    return;
  }

  // Normal scenario progression
  triggerAgentResponse();
}

function triggerAgentResponse() {
  const step = SCENARIO[state.conversationStep];
  if (!step) {
    // Default fallback
    setTimeout(() => {
      appendAgentMessage({
        type: 'agent',
        text: `Je prends note ! Pour aller plus loin sur ce sujet, vous pouvez me donner plus de détails ou choisir une option ci-dessous.`,
        suggestions: [
          'Voir d\'autres produits',
          'Affiner ma recherche',
          'Contacter le service client',
        ],
      });
    }, 1400);
    return;
  }

  showTyping();
  const delay = 1200 + Math.random() * 600;
  setTimeout(() => {
    hideTyping();
    appendAgentMessage(step);
    state.conversationStep++;
  }, delay);
}

// ─── Cart / Alert actions ─────────────────────────────────────────────────────
function handleCartAction(text) {
  if (state.permLevel === 'lecture') {
    showUpgradeNotice('suggestion', 'Passez en mode Suggestion pour ajouter des produits au panier.');
    return;
  }

  const productName = text.toLowerCase().includes('msi') ? 'MSI Pulse 16 AI' : 'ASUS TUF Gaming A16';
  const productPrice = text.toLowerCase().includes('msi') ? '749€' : '779€';

  showTyping();
  setTimeout(() => {
    hideTyping();
    state.cartItems.push(productName);
    logAction('🛒 Ajouté au panier : ' + productName + ' — ' + productPrice, 'success');
    appendAgentMessage({
      type: 'agent',
      text: `✅ <strong>${productName}</strong> (${productPrice}) a été ajouté à votre panier !<br><br>Votre panier contient maintenant <strong>${state.cartItems.length} article(s)</strong>. Voulez-vous finaliser votre commande ?`,
      suggestions: [
        'Voir mon panier',
        'Ajouter des accessoires',
        'Continuer mes achats',
      ],
    });
    showToast('🛒 ' + productName + ' ajouté au panier', 'success');
    state.conversationStep++;
  }, 900);
}

function handleAlertAction() {
  if (state.permLevel === 'lecture') {
    showUpgradeNotice('suggestion', 'Passez en mode Suggestion pour créer des alertes prix.');
    return;
  }
  showAlertModal();
}

// ─── Render messages ──────────────────────────────────────────────────────────
function appendUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'msg-row user';
  row.innerHTML = `
    <div class="msg-content">
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <div class="msg-time">${getTime()}</div>
    </div>`;
  dom.chatMessages.appendChild(row);
  scrollToBottom();
}

function appendAgentMessage(step) {
  const row = document.createElement('div');
  row.className = 'msg-row agent';

  let extraHtml = '';
  if (step.extra === 'products') {
    extraHtml = renderProducts();
  }

  row.innerHTML = `
    <div class="msg-avatar">CA</div>
    <div class="msg-content">
      <div class="msg-bubble">${step.text}</div>
      ${extraHtml}
      ${step.suggestions ? renderSuggestions(step.suggestions) : ''}
      <div class="msg-time">${getTime()}</div>
    </div>`;

  // Attach suggestion click handlers
  row.querySelectorAll('.sugg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.disabled = true;
      sendMessage(btn.textContent);
    });
  });

  dom.chatMessages.appendChild(row);
  scrollToBottom();
}

function renderSuggestions(suggestions) {
  const items = suggestions.map(s => `<button class="sugg-btn">${escapeHtml(s)}</button>`).join('');
  return `<div class="suggestions">${items}</div>`;
}

function renderProducts() {
  return `<div class="product-cards">${PRODUCTS.map(p => renderProductCard(p)).join('')}</div>`;
}

function renderProductCard(p) {
  const oldPriceHtml = p.oldPrice ? `<span class="product-price-old">${p.oldPrice}€</span>` : '';
  return `
    <div class="product-card">
      <div class="product-card-inner">
        <div class="product-thumb">${p.icon}</div>
        <div class="product-details">
          <div class="product-name">${p.name}</div>
          <div class="product-rating">
            <span class="stars">${renderStars(p.rating)}</span>
            <span>${p.rating} — ${p.reviews} avis</span>
          </div>
          <div class="product-price-row">
            <span class="product-price">${p.price}€</span>
            ${oldPriceHtml}
            <span class="price-badge ${p.badge}">${p.badgeLabel}</span>
          </div>
          <div class="product-delivery">${p.delivery}</div>
        </div>
      </div>
      ${renderPriceChart(p)}
      <div class="product-card-actions">
        <button class="btn-see">Voir le produit</button>
        <button class="btn-cart" data-product="${p.id}" data-name="${p.name}">+ Panier</button>
      </div>
    </div>`;
}

function renderPriceChart(p) {
  const pts = p.priceHistory;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const w = 400, h = 70, pad = 4;
  const chartH = h - pad * 2;

  const points = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = pad + (1 - (v - min) / range) * chartH;
    return `${x},${y}`;
  }).join(' ');

  const currentY = pad + (1 - (pts[pts.length - 1] - min) / range) * chartH;
  const minIdx = pts.indexOf(min);
  const minX = (minIdx / (pts.length - 1)) * w;
  const minY = pad + chartH; // min is always bottom

  const savingsHtml = p.savings
    ? `<span class="price-savings">Économie de ${p.savings}€ vs moy. 90j</span>`
    : '';

  return `
    <div class="price-chart-wrap" style="margin:0 14px 0;">
      <div class="price-chart-header">
        <span class="price-chart-title">📈 Historique prix — 90 derniers jours</span>
        ${savingsHtml}
      </div>
      <svg class="price-chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <!-- Area fill -->
        <defs>
          <linearGradient id="grad-${p.id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3732FF" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#3732FF" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <polygon
          points="${points} ${w},${h} 0,${h}"
          fill="url(#grad-${p.id})"
        />
        <!-- Price line -->
        <polyline
          points="${points}"
          fill="none"
          stroke="#3732FF"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <!-- Current price dashed line -->
        <line
          x1="0" y1="${currentY}"
          x2="${w}" y2="${currentY}"
          stroke="#2E7D32"
          stroke-width="1.5"
          stroke-dasharray="5,4"
          opacity="0.7"
        />
        <!-- Min price dot -->
        <circle cx="${minX}" cy="${minY}" r="4" fill="#2E7D32" />
      </svg>
      <div class="price-chart-footer">
        <div class="price-stat">
          <span class="price-stat-label">Il y a 90j</span>
          <span class="price-stat-value">${pts[0]}€</span>
        </div>
        <div class="price-stat">
          <span class="price-stat-label">Prix min historique</span>
          <span class="price-stat-value green">${min}€</span>
        </div>
        <div class="price-stat">
          <span class="price-stat-label">Moy. 90j</span>
          <span class="price-stat-value">${p.avgPrice}€</span>
        </div>
        <div class="price-stat">
          <span class="price-stat-label">Aujourd'hui</span>
          <span class="price-stat-value green">${p.price}€</span>
        </div>
      </div>
      <div style="font-size:0.68rem;color:#9E9E9E;margin-top:4px;">Prix suivi depuis 90 jours sur Cdiscount</div>
    </div>`;
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function showTyping() {
  state.typing = true;
  dom.sendBtn.disabled = true;

  const row = document.createElement('div');
  row.className = 'typing-row';
  row.id = 'typing-indicator';
  row.innerHTML = `
    <div class="msg-avatar">CA</div>
    <div class="typing-bubble">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  dom.chatMessages.appendChild(row);
  scrollToBottom();
}

function hideTyping() {
  state.typing = false;
  dom.sendBtn.disabled = false;
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

// ─── Action log ───────────────────────────────────────────────────────────────
function logAction(text, type = 'info') {
  state.actionLog.unshift({ text, type });
  renderActionLog();
}

function renderActionLog() {
  if (!dom.actionLogEl) return;
  if (state.actionLog.length === 0) {
    dom.actionLogEl.innerHTML = '<div class="action-log-empty">Aucune action pour l\'instant</div>';
    return;
  }
  dom.actionLogEl.innerHTML = state.actionLog
    .slice(0, 5)
    .map(a => `<div class="action-entry ${a.type}">
      <span class="action-entry-icon">${a.type === 'success' ? '✓' : 'ℹ'}</span>
      <span>${a.text}</span>
    </div>`)
    .join('');
}

// ─── Upgrade notice ───────────────────────────────────────────────────────────
function showUpgradeNotice(targetLevel, message) {
  const row = document.createElement('div');
  row.className = 'msg-row agent';
  row.innerHTML = `
    <div class="msg-avatar">CA</div>
    <div class="msg-content">
      <div class="upgrade-notice">
        <span>⚠️ ${message}</span>
        <button onclick="upgradeTo('${targetLevel}')">Passer en mode ${targetLevel.charAt(0).toUpperCase() + targetLevel.slice(1)}</button>
      </div>
    </div>`;
  dom.chatMessages.appendChild(row);
  scrollToBottom();
}

function upgradeTo(level) {
  setPermLevel(level);
  appendAgentMessage({
    type: 'agent',
    text: `✅ Niveau passé en mode <strong>${level.charAt(0).toUpperCase() + level.slice(1)}</strong> ! Vous pouvez maintenant effectuer cette action.`,
    suggestions: ['Réessayer', 'Retour à la recherche'],
  });
}

// ─── Alert modal ──────────────────────────────────────────────────────────────
function showAlertModal() {
  const modal = document.createElement('div');
  modal.className = 'alert-modal';
  modal.id = 'alert-modal';
  modal.innerHTML = `
    <div class="alert-box">
      <h4>🔔 Configurer une alerte prix</h4>
      <p>Je vous notifierai dès que le prix atteint votre cible sur le produit sélectionné.</p>
      <div>
        <label style="font-size:0.8rem;font-weight:600;display:block;margin-bottom:6px;">Prix cible (€)</label>
        <input type="number" class="alert-input" id="alert-price-input" value="699" min="1" />
      </div>
      <div>
        <label style="font-size:0.8rem;font-weight:600;display:block;margin-bottom:6px;">Notification par</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;cursor:pointer;">
            <input type="checkbox" checked /> Email
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;cursor:pointer;">
            <input type="checkbox" checked /> SMS
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;cursor:pointer;">
            <input type="checkbox" /> Notification push
          </label>
        </div>
      </div>
      <div class="alert-row">
        <button class="btn-back" onclick="closeAlertModal()">Annuler</button>
        <button class="btn-next" onclick="confirmAlert()">Créer l'alerte</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function closeAlertModal() {
  const modal = document.getElementById('alert-modal');
  if (modal) modal.remove();
}

function confirmAlert() {
  const input = document.getElementById('alert-price-input');
  const price = input ? input.value : '699';
  closeAlertModal();
  logAction('🔔 Alerte créée : MSI Pulse 16 AI à ' + price + '€', 'success');
  appendAgentMessage({
    type: 'agent',
    text: `✅ Alerte créée ! Je vous contacterai dès que le <strong>MSI Pulse 16 AI</strong> passe sous <strong>${price}€</strong>.<br><br>📊 D'après l'historique des 90 derniers jours, ce prix a déjà été atteint 2 fois. Les chances sont bonnes !`,
    suggestions: [
      'Voir mes alertes actives',
      'Ajouter quand même au panier',
      'Nouvelle recherche',
    ],
  });
  showToast('🔔 Alerte prix créée à ' + price + '€', 'success');
  state.conversationStep++;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(message, type = '') {
  dom.toast.textContent = message;
  dom.toast.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => dom.toast.classList.remove('show'), 3000);
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function scrollToBottom() {
  dom.chatMessages.scrollTo({ top: dom.chatMessages.scrollHeight, behavior: 'smooth' });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Event delegation for dynamic cart buttons ───────────────────────────────
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-cart')) {
    const name = e.target.dataset.name || 'ce produit';
    sendMessage('Ajouter ' + name + ' au panier');
  }
  if (e.target.classList.contains('btn-see')) {
    showToast('📄 Ouverture de la fiche produit…');
  }
});

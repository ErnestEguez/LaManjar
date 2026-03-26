/* ===========================================
   LA MANJAR PWA - script.js
   
   Para personalizar:
   - WHATSAPP_NUMBER: número de WhatsApp destino
   - PRODUCTS: arreglo de productos del catálogo
   - Imágenes: coloca archivos en la carpeta /images
   =========================================== */

// ── CONFIGURACIÓN ──────────────────────────────
// 🔧 Cambia este número si cambia el contacto de WhatsApp
const WHATSAPP_NUMBER = '593980313461';

// ── CATÁLOGO DE PRODUCTOS ──────────────────────
// 🔧 Agrega, edita o elimina productos aquí.
// Campos: id, name, desc, price, image
const PRODUCTS = [
  {
    id: 1,
    name: 'Tortilla de Verde × 2',
    desc: 'Deliciosas tortillas de verde con queso, receta casera tradicional. Paquete de 2 unidades.',
    price: 2.50,
    image: 'images/tortilla-2und.png'
  },
  {
    id: 2,
    name: 'Tortilla de Verde × 4',
    desc: 'Deliciosas tortillas de verde con queso, receta casera tradicional. Paquete de 4 unidades.',
    price: 2.50,
    image: 'images/tortilla-4und.jpg'
  },
  {
    id: 3,
    name: 'Corviches × 2',
    desc: 'Crujientes corviches rellenos de maní, hechos con amor en casa. Paquete de 2 unidades.',
    price: 3.00,
    image: 'images/corviche-2und.jpg'
  },
  {
    id: 4,
    name: 'Corviches × 4',
    desc: 'Crujientes corviches rellenos de maní, hechos con amor en casa. Paquete de 4 unidades.',
    price: 3.00,
    image: 'images/corviche-4und.jpg'
  }
];

// ── ESTADO DE LA APP ───────────────────────────
let cart = [];          // [{product, qty}]
let activeProduct = null; // producto en el modal

// ── INIT ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderCatalog();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});

// ── RENDER CATÁLOGO ────────────────────────────
function renderCatalog() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';
  PRODUCTS.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${i * 0.06}s`;
    card.innerHTML = `
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy"
             onerror="this.src='images/logo.jpg'" />
        <span class="price-badge">$${p.price.toFixed(2)}</span>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <button class="btn-add" id="btn-add-${p.id}" onclick="openModal(${p.id})">
          + Agregar
        </button>
      </div>`;
    grid.appendChild(card);
  });
}

// ── MODAL ──────────────────────────────────────
function openModal(productId) {
  activeProduct = PRODUCTS.find(p => p.id === productId);
  if (!activeProduct) return;

  document.getElementById('modal-img').src = activeProduct.image;
  document.getElementById('modal-img').onerror = function() { this.src = 'images/logo.jpg'; };
  document.getElementById('modal-name').textContent = activeProduct.name;
  document.getElementById('modal-desc').textContent = activeProduct.desc;
  document.getElementById('modal-price').textContent = `$${activeProduct.price.toFixed(2)}`;
  document.getElementById('modal-qty').value = 1;
  updateModalSubtotal();

  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModalDirect() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  activeProduct = null;
}

function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModalDirect();
}

function changeQty(delta) {
  const input = document.getElementById('modal-qty');
  const newVal = Math.max(1, Math.min(99, (parseInt(input.value) || 1) + delta));
  input.value = newVal;
  updateModalSubtotal();
}

document.addEventListener('DOMContentLoaded', () => {
  const qtyInput = document.getElementById('modal-qty');
  if (qtyInput) {
    qtyInput.addEventListener('input', updateModalSubtotal);
  }
});

function updateModalSubtotal() {
  if (!activeProduct) return;
  const qty = parseInt(document.getElementById('modal-qty').value) || 1;
  const subtotal = activeProduct.price * qty;
  document.getElementById('modal-subtotal').textContent = `$${subtotal.toFixed(2)}`;
}

function confirmAdd() {
  if (!activeProduct) return;
  const qty = parseInt(document.getElementById('modal-qty').value) || 1;

  const existing = cart.find(c => c.product.id === activeProduct.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ product: activeProduct, qty });
  }

  closeModalDirect();
  updateCartBar();
  showToast(`✅ ${activeProduct.name} agregado`);
}

// ── CART BAR ───────────────────────────────────
function updateCartBar() {
  const bar = document.getElementById('cart-bar');
  const totalItems = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + c.qty * c.product.price, 0);

  document.getElementById('cart-count').textContent =
    totalItems === 1 ? '1 ítem' : `${totalItems} ítems`;
  document.getElementById('cart-total').textContent = `$${totalPrice.toFixed(2)}`;

  if (totalItems > 0) {
    bar.classList.remove('hidden');
  } else {
    bar.classList.add('hidden');
  }
}

// ── VIEWS ──────────────────────────────────────
function showOrder() {
  if (cart.length === 0) {
    showToast('¡Agrega productos primero! 🛒');
    return;
  }
  renderOrderView();
  document.getElementById('view-catalog').classList.remove('active');
  document.getElementById('view-order').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('cart-bar').classList.add('hidden');
}

function showCatalog() {
  document.getElementById('view-order').classList.remove('active');
  document.getElementById('view-catalog').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateCartBar();
}

// ── RENDER ORDER VIEW ──────────────────────────
function renderOrderView() {
  const container = document.getElementById('order-items');
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = `<div class="empty-order">
      <div class="empty-icon">🛒</div>
      <p>Tu carrito está vacío.<br>Agrega productos para continuar.</p>
    </div>`;
    document.getElementById('order-total-display').textContent = '$0.00';
    return;
  }

  let total = 0;
  cart.forEach((item, idx) => {
    const subtotal = item.qty * item.product.price;
    total += subtotal;

    const div = document.createElement('div');
    div.className = 'order-item-card';
    div.innerHTML = `
      <img class="order-item-img"
           src="${item.product.image}" alt="${item.product.name}"
           onerror="this.src='images/logo.jpg'" />
      <div class="order-item-info">
        <div class="order-item-name">${item.product.name}</div>
        <div class="order-item-meta">${item.qty} × $${item.product.price.toFixed(2)}</div>
      </div>
      <div class="order-item-subtotal">$${subtotal.toFixed(2)}</div>
      <button class="order-item-remove" onclick="removeItem(${idx})" title="Eliminar">✕</button>`;
    container.appendChild(div);
  });

  document.getElementById('order-total-display').textContent = `$${total.toFixed(2)}`;
}

function removeItem(idx) {
  cart.splice(idx, 1);
  renderOrderView();
  updateCartBar();
  if (cart.length === 0) showCatalog();
}

// ── VALIDACIÓN DE FORMULARIO ───────────────────
function getCustomerData() {
  const name    = document.getElementById('customer-name').value.trim();
  const phone   = document.getElementById('customer-phone').value.trim();
  const address = document.getElementById('customer-address').value.trim();
  const notes   = document.getElementById('customer-notes').value.trim();
  return { name, phone, address, notes };
}

function validateForm() {
  const { name, phone } = getCustomerData();
  if (!name) { showToast('Por favor ingresa tu nombre 👤'); return false; }
  if (!phone) { showToast('Por favor ingresa tu teléfono 📱'); return false; }
  if (cart.length === 0) { showToast('Tu carrito está vacío 🛒'); return false; }
  return true;
}

// ── WHATSAPP ───────────────────────────────────
// 🔧 El número de WhatsApp se configura en WHATSAPP_NUMBER al inicio del archivo
function sendWhatsApp() {
  if (!validateForm()) return;
  const { name, phone, address, notes } = getCustomerData();
  const total = cart.reduce((s, c) => s + c.qty * c.product.price, 0);

  let msg = `🍽️ *PEDIDO - La Manjar*\n`;
  msg += `━━━━━━━━━━━━━━━━\n`;
  msg += `👤 *Cliente:* ${name}\n`;
  msg += `📱 *Teléfono:* ${phone}\n`;
  if (address) msg += `📍 *Dirección:* ${address}\n`;
  msg += `━━━━━━━━━━━━━━━━\n`;
  msg += `🛒 *Productos:*\n`;
  cart.forEach(item => {
    const sub = (item.qty * item.product.price).toFixed(2);
    msg += `  • ${item.product.name}\n`;
    msg += `    ${item.qty} × $${item.product.price.toFixed(2)} = *$${sub}*\n`;
  });
  msg += `━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *TOTAL: $${total.toFixed(2)}*\n`;
  if (notes) msg += `📝 *Observaciones:* ${notes}\n`;
  msg += `━━━━━━━━━━━━━━━━\n`;
  msg += `_Pedido enviado desde la app La Manjar_ 🧡`;

  const encoded = encodeURIComponent(msg);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
  window.open(url, '_blank');
}

// ── DESCARGA CSV ───────────────────────────────
function downloadCSV() {
  if (!validateForm()) return;
  const { name, phone, address, notes } = getCustomerData();
  const total = cart.reduce((s, c) => s + c.qty * c.product.price, 0);

  const now = new Date();
  const fecha = now.toLocaleDateString('es-EC', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const hora  = now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

  // BOM para compatibilidad con Excel en Windows
  let csv = '\uFEFF';
  csv += 'Fecha,Hora,Nombre,Teléfono,Dirección,Producto,Cantidad,Precio Unitario,Subtotal,Total,Observaciones\n';

  cart.forEach((item, idx) => {
    const subtotal = item.qty * item.product.price;
    const totalCol = idx === 0 ? total.toFixed(2) : '';
    const row = [
      fecha,
      hora,
      escapeCsv(name),
      escapeCsv(phone),
      escapeCsv(address),
      escapeCsv(item.product.name),
      item.qty,
      item.product.price.toFixed(2),
      subtotal.toFixed(2),
      totalCol,
      escapeCsv(notes)
    ];
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `pedido_lamanjar_${formatDateForFilename(now)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📥 Archivo descargado');
}

function escapeCsv(val) {
  if (!val) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDateForFilename(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}_${h}${min}`;
}

// ── TOAST ──────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

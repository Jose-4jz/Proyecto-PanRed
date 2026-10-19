/* ===================================================
   PANRED - LÓGICA CENTRAL, SESIÓN DINÁMICA Y PEDIDOS
   =================================================== */

const INVENTARIO_INICIAL = [
  { id: 'p1', nombre: 'Bolillo Crujiente (Paq 5pzas)', precio: 25.0, pesoKg: 0.35, cat: 'salado', stock: 40, img: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=500&q=80', tanda: '6:30 PM', masa: 'Trigo Tradicional', alergenos: 'Gluten' },
  { id: 'p2', nombre: 'Concha de Vainilla / Chocolate', precio: 12.0, pesoKg: 0.09, cat: 'dulce', stock: 25, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80', tanda: '7:00 PM', masa: 'Bizcocho', alergenos: 'Lácteos, Huevo' },
  { id: 'p3', nombre: 'Haza Pan Masa Madre', precio: 85.0, pesoKg: 0.60, cat: 'madra', stock: 10, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80', tanda: '8:00 AM', masa: 'Masa Madre', alergenos: 'Gluten' },
  { id: 'p4', nombre: 'Pastel Individual de Frutos', precio: 65.0, pesoKg: 0.45, cat: 'reposteria', stock: 8, img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80', tanda: 'Continuo', masa: 'Pão de Jó', alergenos: 'Lácteos, Huevo' },
  { id: 'p5', nombre: 'Charola Mixta Reunión (12 pzas)', precio: 130.0, pesoKg: 1.20, cat: 'paquetes', stock: 5, img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80', tanda: 'Bajo Pedido', masa: 'Variadas', alergenos: 'Gluten, Huevo' }
];

/* --- INVENTARIO Y CARRITO --- */
function getInventario() {
  const local = localStorage.getItem('panred_inventario');
  if (!local) {
    localStorage.setItem('panred_inventario', JSON.stringify(INVENTARIO_INICIAL));
    return INVENTARIO_INICIAL;
  }
  return JSON.parse(local);
}

function saveInventario(inv) {
  localStorage.setItem('panred_inventario', JSON.stringify(inv));
}

function getCarrito() {
  const local = localStorage.getItem('panred_carrito');
  return local ? JSON.parse(local) : [];
}

function saveCarrito(carrito) {
  localStorage.setItem('panred_carrito', JSON.stringify(carrito));
  actualizarBarraNavegacion();
}

function getModalidad() {
  return localStorage.getItem('panred_modalidad') || 'domicilio';
}

function saveModalidad(modo) {
  localStorage.setItem('panred_modalidad', modo);
}

function calcularTotales() {
  const carrito = getCarrito();
  const modo = getModalidad();
  const inventario = getInventario();

  let subtotal = 0;
  let pesoTotalKg = 0;

  carrito.forEach(item => {
    const prod = inventario.find(p => p.id === item.id);
    if (prod) {
      subtotal += prod.precio * item.cantidad;
      pesoTotalKg += (prod.pesoKg || 0.1) * item.cantidad;
    }
  });

  let costoEnvio = 0;
  if (modo === 'domicilio' && carrito.length > 0) {
    const envioBase = 35.0;
    const extraPeso = pesoTotalKg > 1.0 ? Math.ceil(pesoTotalKg - 1.0) * 10.0 : 0;
    costoEnvio = envioBase + extraPeso;
  }

  const totalFinal = subtotal + costoEnvio;
  return { subtotal, pesoTotalKg, costoEnvio, totalFinal };
}

/* --- GESTIÓN DE AUTENTICACIÓN / SESIÓN --- */
function getUsuarioSesion() {
  const local = localStorage.getItem('panred_usuario');
  return local ? JSON.parse(local) : null;
}

function iniciarSesionSimulada(nombre, email) {
  const usuario = { nombre: nombre.trim(), email: email.trim().toLowerCase() };
  localStorage.setItem('panred_usuario', JSON.stringify(usuario));
  actualizarBarraNavegacion();
  return usuario;
}

function cerrarSesionSimulada() {
  localStorage.removeItem('panred_usuario');
  actualizarBarraNavegacion();
  location.reload();
}

/* --- MODAL DE LOGIN DINÁMICO (DESDE CUALQUIER PÁGINA) --- */
function abrirModalAuthGlobal() {
  const modal = document.getElementById('modal-auth');
  if (!modal) {
    window.location.href = "productos.html?action=login";
    return;
  }

  // Escenario A: Clic voluntario en la Navbar
  const titulo = document.getElementById('auth-modal-titulo');
  const desc = document.getElementById('auth-modal-desc');
  const btn = document.getElementById('auth-modal-btn');

  if (titulo) titulo.innerText = "👋 ¡Bienvenido a PanRed!";
  if (desc) desc.innerText = "Ingresa tu cuenta de cliente para guardar tu historial de pedidos y agilizar tus compras.";
  if (btn) btn.innerText = "Iniciar Sesión / Registrarme 🔑";

  modal.classList.add('active');
}

/* --- HISTORIAL DE PEDIDOS Y PANEL ADMIN --- */
function getHistorialPedidos() {
  const local = localStorage.getItem('panred_pedidos');
  return local ? JSON.parse(local) : [];
}

function guardarNuevoPedido(numPedido, pin, total, items, modo) {
  const usuario = getUsuarioSesion();
  const pedidos = getHistorialPedidos();
  
  const nuevoPedido = {
    id: numPedido,
    pin: pin,
    cliente: usuario ? usuario.nombre : "Invitado",
    email: usuario ? usuario.email : "invitado@panred.com",
    total: total,
    modo: modo,
    items: items,
    fecha: new Date().toLocaleString('es-MX'),
    estatus: "En Preparación"
  };

  pedidos.unshift(nuevoPedido);
  localStorage.setItem('panred_pedidos', JSON.stringify(pedidos));

  registrarEnFilaAdmin(nuevoPedido);
}

function registrarEnFilaAdmin(pedido) {
  let colaAdmin = JSON.parse(localStorage.getItem('panred_cola_admin')) || [
    { id: '#PR-101', nombre: "Carlos Mendoza", tipo: "Entrega Web - Pedido #PR-101", estatus: "En Preparación" },
    { id: '#PR-102', nombre: "María Fernández", tipo: "Compra Directa en Caja", estatus: "Atendido" }
  ];

  colaAdmin.unshift({
    id: pedido.id,
    nombre: pedido.cliente,
    tipo: `Entrega Web (${pedido.modo === 'domicilio' ? '🛵 Domicilio' : '🏪 Click&Collect'})`,
    estatus: "En Preparación"
  });

  localStorage.setItem('panred_cola_admin', JSON.stringify(colaAdmin));
}

/* --- ACTUALIZACIÓN GLOBAL DE LA NAVBAR --- */
function actualizarBarraNavegacion() {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    const carrito = getCarrito();
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    cartCount.innerText = `(${totalItems})`;
  }

  const contenedorUser = document.getElementById('user-nav-container');
  if (contenedorUser) {
    const user = getUsuarioSesion();
    if (user) {
      contenedorUser.innerHTML = `
        <span style="color: #4ade80; font-weight: bold; font-size: 0.9rem;">👤 ${user.nombre}</span>
        <button onclick="cerrarSesionSimulada()" style="background: transparent; color: #ef4444; border: 1px solid #ef4444; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; margin-left: 6px;">Salir</button>
      `;
    } else {
      contenedorUser.innerHTML = `
        <button onclick="abrirModalAuthGlobal()" style="background: #3b82f6; color: #fff; border: none; padding: 5px 12px; border-radius: 15px; font-weight: bold; font-size: 0.85rem; cursor: pointer;">👤 Iniciar Sesión</button>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  getInventario();
  actualizarBarraNavegacion();
});

/* ===================================================
   PANRED - MENÚ DESPLEGABLE DE CUENTA
   =================================================== */

(function () {

    // --- ESTILOS DEL MENÚ ---
    const estilos = document.createElement('style');

    estilos.textContent = `
        #user-nav-container {
            position: relative;
        }

        .panred-user-menu {
            position: relative;
        }

        .panred-user-menu summary {
            list-style: none;
            cursor: pointer;
            color: #4ade80;
            font-weight: bold;
            font-size: 0.9rem;
            white-space: nowrap;
        }

        .panred-user-menu summary::-webkit-details-marker {
            display: none;
        }

        .panred-user-menu summary:hover {
            color: #86efac;
        }

        .panred-user-dropdown {
            position: absolute;
            top: calc(100% + 12px);
            right: 0;
            min-width: 220px;
            background: #111827;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.4);
            z-index: 2000;
        }

        .panred-user-dropdown a,
        .panred-user-dropdown button {
            display: block;
            width: 100%;
            padding: 10px;
            color: #e2e8f0;
            text-decoration: none;
            text-align: left;
            background: transparent;
            border: none;
            border-radius: 5px;
            font-size: 0.85rem;
            cursor: pointer;
        }

        .panred-user-dropdown a:hover,
        .panred-user-dropdown button:hover {
            background: #1e293b;
            color: #55aaff;
        }

        .panred-user-dropdown .cerrar-cuenta {
            color: #f87171;
            border-top: 1px solid #334155;
            margin-top: 5px;
        }

        .panred-user-dropdown .cerrar-cuenta:hover {
            color: #fca5a5;
        }
    `;

    document.head.appendChild(estilos);


    // --- ACTUALIZACIÓN DE LA BARRA DE NAVEGACIÓN ---
    window.actualizarBarraNavegacion = function () {

        const cartCount = document.getElementById('cart-count');

        if (cartCount) {
            const carrito = getCarrito();
            const totalItems = carrito.reduce(
                (sum, item) => sum + item.cantidad, 0
            );

            cartCount.innerText = `(${totalItems})`;
        }

        const contenedorUser = document.getElementById('user-nav-container');

        if (!contenedorUser) return;

        const user = getUsuarioSesion();

        if (user) {

            const nombreSeguro = String(user.nombre || 'Mi cuenta')
                .replace(/[&<>"']/g, caracter => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                })[caracter]);

            contenedorUser.innerHTML = `
                <details class="panred-user-menu">

                    <summary>
                        👤 ${nombreSeguro} ▾
                    </summary>

                    <div class="panred-user-dropdown">

                        <a href="mi-cuenta.html?seccion=pedidos">
                            📦 Mis pedidos
                        </a>

                        <a href="mi-cuenta.html?seccion=historial">
                           🛒 Historial de compras
                        </a>

                        <a href="mi-cuenta.html?seccion=facturas">
                            🧾 Mis facturas
                        </a>

                        <a href="mi-cuenta.html?seccion=datos-facturacion">
                            📄 Datos de facturación
                        </a>

                        <a href="mi-cuenta.html?seccion=informacion">
                            👤 Mi información
                        </a>

                        <button
                            class="cerrar-cuenta"
                            onclick="cerrarSesionSimulada()">
                            Salir de mi cuenta
                        </button>

                    </div>

                </details>
            `;

        } else {

            contenedorUser.innerHTML = `
                <button
                    onclick="abrirModalAuthGlobal()"
                    style="
                        background: #3b82f6;
                        color: #fff;
                        border: none;
                        padding: 5px 12px;
                        border-radius: 15px;
                        font-weight: bold;
                        font-size: 0.85rem;
                        cursor: pointer;
                    ">
                    👤 Iniciar Sesión
                </button>
            `;

        }
    };


    // --- ABRIR LA SECCIÓN INDICADA EN MI CUENTA ---
    document.addEventListener('DOMContentLoaded', function () {

        const parametros = new URLSearchParams(window.location.search);
        const seccion = parametros.get('seccion');

        if (!seccion || typeof mostrarSeccionCuenta !== 'function') {
            return;
        }

        const botones = document.querySelectorAll('.cuenta-menu button');

        const botonSeccion = Array.from(botones).find(boton => {
            return (boton.getAttribute('onclick') || '')
                .includes("'" + seccion + "'");
        });

        if (botonSeccion) {
            mostrarSeccionCuenta(seccion, botonSeccion);
        }

    });

})();

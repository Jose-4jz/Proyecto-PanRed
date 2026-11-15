/*
 * Facturación demostrativa PanRed.
 * Usa la sesión y el historial de pedidos existentes; no genera CFDI.
 */
(function () {
  'use strict';

  const CLAVE_FACTURAS = 'panred_facturas';
  const CLAVE_CONSECUTIVO = 'panred_factura_consecutivo';

  function normalizarCorreo(correo) {
    return String(correo || '').trim().toLowerCase();
  }

  function leerFacturas() {
    const guardadas = localStorage.getItem(CLAVE_FACTURAS);
    if (!guardadas) return [];

    const facturas = JSON.parse(guardadas);
    if (!Array.isArray(facturas)) {
      throw new Error('El historial de facturas no tiene un formato válido.');
    }
    return facturas;
  }

  function guardarFacturas(facturas) {
    localStorage.setItem(CLAVE_FACTURAS, JSON.stringify(facturas));
  }

  function obtenerClaveDatosFacturacion(usuario) {
    return 'panred_datos_facturacion_' +
      encodeURIComponent(normalizarCorreo(usuario.email));
  }

  function leerDatosFiscales(usuario) {
    const guardados = localStorage.getItem(obtenerClaveDatosFacturacion(usuario));
    return guardados ? JSON.parse(guardados) : null;
  }

  function formatoMoneda(importe) {
    return Number(importe || 0).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN'
    });
  }

  function escaparHTML(valor) {
    return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (caracter) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[caracter];
    });
  }

  function fechaLegible(fecha) {
    if (!fecha) return 'No disponible';
    const convertida = new Date(fecha);
    return isNaN(convertida.getTime())
      ? String(fecha)
      : convertida.toLocaleString('es-MX');
  }

  function siguienteFolio(facturas) {
    const valorGuardado = Number(localStorage.getItem(CLAVE_CONSECUTIVO) || 0);
    const consecutivoGuardado = Number.isFinite(valorGuardado) ? valorGuardado : 0;
    const mayorFolioExistente = facturas.reduce(function (mayor, factura) {
      const coincidencia = String(factura.folio || '').match(/^PAN-FAC-(\d+)$/);
      return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
    }, 0);
    const consecutivo = Math.max(consecutivoGuardado, mayorFolioExistente) + 1;
    return 'PAN-FAC-' + String(consecutivo).padStart(6, '0');
  }

  function buscarFacturaPorPedido(facturas, pedidoId, correo) {
    const email = normalizarCorreo(correo);
    return facturas.find(function (factura) {
      return String(factura.pedidoId) === String(pedidoId) &&
        normalizarCorreo(factura.email) === email;
    });
  }

  function agregarMensaje(contenedor, mensaje) {
    const aviso = document.createElement('div');
    aviso.className = 'cuenta-vacio';
    aviso.textContent = mensaje;
    contenedor.appendChild(aviso);
  }

  function agregarTitulo(contenedor, texto) {
    const titulo = document.createElement('h3');
    titulo.textContent = texto;
    titulo.style.margin = '18px 0 12px';
    contenedor.appendChild(titulo);
  }

  function crearBoton(texto, accion) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'cuenta-boton';
    boton.style.border = '0';
    boton.style.cursor = 'pointer';
    boton.textContent = texto;
    boton.addEventListener('click', accion);
    return boton;
  }

  function renderizarFacturacion() {
    const contenedor = document.getElementById('lista-facturas');
    const usuario = getUsuarioSesion();
    if (!contenedor || !usuario || !usuario.email) return;

    contenedor.textContent = '';

    let pedidos;
    let facturas;
    let inventario;
    try {
      pedidos = getHistorialPedidos();
      facturas = leerFacturas().filter(function (factura) {
        return normalizarCorreo(factura.email) === normalizarCorreo(usuario.email);
      });
      inventario = getInventario();
    } catch (error) {
      console.error('No fue posible cargar la información de facturación.', error);
      agregarMensaje(contenedor, 'No fue posible cargar tus facturas. Revisa los datos guardados en este navegador.');
      return;
    }

    const pedidosEntregados = pedidos.filter(function (pedido) {
      return normalizarCorreo(pedido.email) === normalizarCorreo(usuario.email) &&
        String(pedido.estatus || '').trim().toLowerCase() === 'entregado';
    });

    agregarTitulo(contenedor, 'Pedidos entregados');
    if (pedidosEntregados.length === 0) {
      agregarMensaje(contenedor, 'Aún no tienes pedidos entregados disponibles para facturar.');
    } else {
      pedidosEntregados.slice().reverse().forEach(function (pedido) {
        const facturaExistente = buscarFacturaPorPedido(facturas, pedido.id, usuario.email);
        const tarjeta = document.createElement('article');
        tarjeta.className = 'cuenta-pedido';

        const titulo = document.createElement('strong');
        titulo.className = 'pedido-numero';
        titulo.textContent = 'Pedido ' + (pedido.id || 'Sin número');
        tarjeta.appendChild(titulo);

        const fecha = document.createElement('p');
        fecha.style.marginTop = '8px';
        fecha.textContent = 'Fecha del pedido: ' + fechaLegible(pedido.fecha);
        tarjeta.appendChild(fecha);

        const listaProductos = document.createElement('ul');
        listaProductos.className = 'pedido-productos';
        (Array.isArray(pedido.items) ? pedido.items : []).forEach(function (item) {
          const producto = inventario.find(function (entrada) {
            return String(entrada.id) === String(item.id);
          });
          const elemento = document.createElement('li');
          elemento.textContent = (producto ? producto.nombre : (item.nombre || 'Producto')) +
            ' · Cantidad: ' + (item.cantidad || 1);
          listaProductos.appendChild(elemento);
        });
        tarjeta.appendChild(listaProductos);

        const total = document.createElement('p');
        total.style.marginTop = '8px';
        total.textContent = 'Importe total: ' + formatoMoneda(pedido.total);
        tarjeta.appendChild(total);

        if (facturaExistente) {
          const folio = document.createElement('p');
          folio.style.marginTop = '8px';
          folio.textContent = 'Folio de factura: ' + facturaExistente.folio;
          tarjeta.appendChild(folio);
          tarjeta.appendChild(crearBoton('Consultar comprobante', function () {
              imprimirFactura(facturaExistente);
          }));
        } else {
          tarjeta.appendChild(crearBoton('Generar factura demostrativa', function () {
              generarFactura(pedido, usuario);
          }));
        }

        contenedor.appendChild(tarjeta);
      });
    }
  }

  function irADatosFacturacion() {
    const botones = document.querySelectorAll('.cuenta-menu button');
    const botonDatos = Array.prototype.find.call(botones, function (boton) {
      return (boton.getAttribute('onclick') || '').indexOf("'datos-facturacion'") !== -1;
    });
    if (botonDatos && typeof mostrarSeccionCuenta === 'function') {
      mostrarSeccionCuenta('datos-facturacion', botonDatos);
    }
  }

  function generarFactura(pedido, usuario) {
    const usuarioActual = getUsuarioSesion();
    const correo = normalizarCorreo(usuarioActual && usuarioActual.email);
    if (!correo || correo !== normalizarCorreo(usuario && usuario.email)) {
      alert('Inicia sesión con la cuenta propietaria del pedido para generar la factura.');
      return;
    }

    const pedidoActual = getHistorialPedidos().find(function (pedidoGuardado) {
      return String(pedidoGuardado.id) === String(pedido.id) &&
        normalizarCorreo(pedidoGuardado.email) === correo;
    });
    if (!pedidoActual) {
      alert('No se encontró un pedido de esta cuenta para facturar.');
      return;
    }
    if (String(pedidoActual.estatus || '').trim().toLowerCase() !== 'entregado') {
      alert('Solo puedes generar una factura cuando el pedido esté entregado.');
      return;
    }

    let datosFiscales;
    let facturas;
    try {
      datosFiscales = leerDatosFiscales(usuarioActual);
      facturas = leerFacturas();
    } catch (error) {
      console.error('No fue posible recuperar los datos de facturación.', error);
      alert('No fue posible leer tus datos guardados. Revisa y vuelve a guardar tus Datos de facturación.');
      irADatosFacturacion();
      return;
    }

    if (!datosFiscales || !datosFiscales.rfc || !datosFiscales.nombre ||
        !datosFiscales.codigoPostal || !datosFiscales.regimenFiscal || !datosFiscales.usoCFDI) {
      alert('Primero completa y guarda tus Datos de facturación.');
      irADatosFacturacion();
      return;
    }

    const existente = buscarFacturaPorPedido(facturas, pedidoActual.id, correo);
    if (existente) {
      renderizarFacturacion();
      imprimirFactura(existente);
      return;
    }

    const inventario = getInventario();
    const items = (Array.isArray(pedidoActual.items) ? pedidoActual.items : []).map(function (item) {
      const producto = inventario.find(function (entrada) {
        return String(entrada.id) === String(item.id);
      });
      return {
        nombre: item.nombre || (producto && producto.nombre) || 'Producto',
        cantidad: item.cantidad || 1
      };
    });

    const factura = {
      folio: siguienteFolio(facturas),
      pedidoId: pedidoActual.id,
      email: usuarioActual.email,
      fechaEmision: new Date().toISOString(),
      fechaPedido: pedidoActual.fecha || '',
      modalidad: pedidoActual.modo || '',
      total: Number(pedidoActual.total || 0),
      items: items,
      receptor: {
        rfc: datosFiscales.rfc,
        nombre: datosFiscales.nombre,
        codigoPostal: datosFiscales.codigoPostal,
        regimenFiscal: datosFiscales.regimenFiscal,
        usoCFDI: datosFiscales.usoCFDI
      }
    };

    facturas.push(factura);
    try {
      guardarFacturas(facturas);
    } catch (error) {
      console.error('No fue posible guardar la factura.', error);
      alert('No se pudo guardar la factura en este navegador. Revisa el almacenamiento disponible.');
      return;
    }

    try {
      localStorage.setItem(CLAVE_CONSECUTIVO, factura.folio.slice('PAN-FAC-'.length));
    } catch (error) {
      console.error('No fue posible actualizar el consecutivo de facturas.', error);
    }

    renderizarFacturacion();
    imprimirFactura(factura);
  }

  function imprimirFactura(factura) {
    const ventana = window.open('', '_blank');
    if (!ventana) {
      alert('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para este sitio e inténtalo de nuevo.');
      return;
    }

    const receptor = factura.receptor || {};
    const productos = (Array.isArray(factura.items) ? factura.items : []).map(function (item) {
      return '<tr><td>' + escaparHTML(item.nombre) + '</td><td>' +
        escaparHTML(item.cantidad) + '</td></tr>';
    }).join('');
    const modalidad = factura.modalidad === 'domicilio'
      ? 'Envío a domicilio'
      : 'Recoger en sucursal';
    const documento = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escaparHTML(factura.folio)} - PanRed</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; padding: 32px; }
    .hoja { max-width: 850px; margin: auto; border: 1px solid #cbd5e1; padding: 32px; }
    .encabezado { display: flex; justify-content: space-between; gap: 20px; border-bottom: 3px solid #3b6e9f; padding-bottom: 16px; }
    h1, h2 { color: #245783; }
    h1 { margin: 0 0 8px; }
    h2 { font-size: 16px; margin: 24px 0 10px; }
    p { margin: 6px 0; line-height: 1.4; }
    .folio { text-align: right; }
    .aviso { margin: 22px 0; padding: 12px; background: #fff7ed; border: 1px solid #fdba74; color: #9a3412; font-weight: bold; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 11px; text-align: left; }
    th { background: #eff6ff; }
    .importe { text-align: right; font-weight: bold; font-size: 20px; margin-top: 20px; }
    .acciones { text-align: center; margin: 20px auto; }
    .acciones button { padding: 11px 18px; background: #245783; color: white; border: 0; border-radius: 5px; cursor: pointer; }
    @media print {
      body { padding: 0; }
      .hoja { border: 0; padding: 12px; }
      .acciones { display: none; }
    }
    @media (max-width: 600px) {
      body { padding: 12px; }
      .hoja { padding: 18px; }
      .encabezado { flex-direction: column; }
      .folio { text-align: left; }
    }
  </style>
</head>
<body>
  <main class="hoja">
    <header class="encabezado">
      <div>
        <h1>PanRed</h1>
        <p><strong>PanRed Comercializadora, S.A. de C.V.</strong></p>
        <p>RFC ficticio: PDE000000XXX</p>
      </div>
      <div class="folio">
        <h2>FACTURA DEMOSTRATIVA</h2>
        <p><strong>Folio:</strong> ${escaparHTML(factura.folio)}</p>
        <p><strong>Fecha de emisión:</strong> ${escaparHTML(fechaLegible(factura.fechaEmision))}</p>
        <p><strong>Pedido original:</strong> ${escaparHTML(factura.pedidoId)}</p>
      </div>
    </header>
    <p class="aviso">DOCUMENTO DE DEMOSTRACIÓN · SIN VALIDEZ FISCAL · NO ES CFDI</p>
    <h2>Datos fiscales del cliente</h2>
    <p><strong>Nombre o razón social:</strong> ${escaparHTML(receptor.nombre)}</p>
    <p><strong>RFC:</strong> ${escaparHTML(receptor.rfc)}</p>
    <p><strong>Código postal fiscal:</strong> ${escaparHTML(receptor.codigoPostal)}</p>
    <p><strong>Régimen fiscal:</strong> ${escaparHTML(receptor.regimenFiscal)}</p>
    <p><strong>Uso indicado:</strong> ${escaparHTML(receptor.usoCFDI)}</p>
    <h2>Productos del pedido</h2>
    <p><strong>Modalidad de entrega:</strong> ${escaparHTML(modalidad)}</p>
    <table>
      <thead><tr><th>Producto</th><th>Cantidad</th></tr></thead>
      <tbody>${productos || '<tr><td colspan="2">Sin productos registrados</td></tr>'}</tbody>
    </table>
    <p class="importe">Importe total del pedido: ${formatoMoneda(factura.total)}</p>
    <p>Este comprobante es una simulación académica. No calcula ni desglosa impuestos y no tiene validez fiscal.</p>
    <div class="acciones"><button type="button" onclick="window.print()">Imprimir / Guardar como PDF</button></div>
  </main>
</body>
</html>`;

    ventana.document.open();
    ventana.document.write(documento);
    ventana.document.close();
  }

  document.addEventListener('DOMContentLoaded', renderizarFacturacion);

  window.PanRedFacturacion = {
    actualizar: renderizarFacturacion,
    generar: generarFactura
  };
})();

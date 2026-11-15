
 ================================================================
   FACTURACION DEMOSTRATIVA PANRED
   Requiere app.js getUsuarioSesion() y getHistorialPedidos().
   Los documentos se guardan localmente en el navegador.
   No genera CFDI ni realiza validaciones ante el SAT.
   ================================================================ 
(function () {
  'use strict';

  const CLAVE_FACTURAS = 'panred_facturas';
  const CLAVE_CONSECUTIVO = 'panred_factura_consecutivo';

  function leerFacturas() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_FACTURAS)  '[]');
      return Array.isArray(datos)  datos  [];
    } catch (error) {
      console.error('No fue posible leer el historial de facturas', error);
      return [];
    }
  }

  function guardarFacturas(facturas) {
    localStorage.setItem(CLAVE_FACTURAS, JSON.stringify(facturas));
  }

  function obtenerClaveDatosFacturacion(usuario) {
    return 'panred_datos_facturacion_' +
      encodeURIComponent(usuario.email.trim().toLowerCase());
  }

  function leerDatosFiscales(usuario) {
    try {
      const guardados = localStorage.getItem(obtenerClaveDatosFacturacion(usuario));
      return guardados  JSON.parse(guardados)  null;
    } catch (error) {
      return null;
    }
  }

  function formatoMoneda(importe) {
    return Number(importe  0).toLocaleString('es-MX', {
      style 'currency', currency 'MXN'
    });
  }

  function escaparHTML(valor) {
    return String(valor == null  ''  valor).replace([&']g, function (caracter) {
      return {
        '&' '&amp;', '' '&lt;', '' '&gt;', '' '&quot;', ' '&#39;'
      }[caracter];
    });
  }

  function fechaLegible(fecha) {
    if (!fecha) return 'No disponible';
    const convertida = new Date(fecha);
    return isNaN(convertida.getTime())
       String(fecha)
       convertida.toLocaleString('es-MX');
  }

  function siguienteFolio(facturas) {
    const consecutivoGuardado = Number(localStorage.getItem(CLAVE_CONSECUTIVO)  0);
    const mayorFolioExistente = (facturas  []).reduce((mayor, factura) = {
      const coincidencia = String(factura.folio  '').match(^PAN-FAC-(d+)$);
      return coincidencia  Math.max(mayor, Number(coincidencia[1]))  mayor;
    }, 0);
    const consecutivo = Math.max(consecutivoGuardado, mayorFolioExistente) + 1;
    localStorage.setItem(CLAVE_CONSECUTIVO, String(consecutivo));
    return 'PAN-FAC-' + String(consecutivo).padStart(6, '0');
  }

  function buscarFacturaPorPedido(facturas, pedidoId) {
    return facturas.find(factura = String(factura.pedidoId) === String(pedidoId));
  }

  function renderizarFacturacion() {
    const contenedor = document.getElementById('lista-facturas');
    const usuario = getUsuarioSesion();
    if (!contenedor  !usuario  !usuario.email) return;

    const pedidos = getHistorialPedidos().filter(pedido =
      pedido.email && pedido.email.toLowerCase() === usuario.email.toLowerCase()
    );
    const entregados = pedidos.filter(pedido =
      String(pedido.estatus  '').trim().toLowerCase() === 'entregado'
    );
    const facturas = leerFacturas().filter(factura =
      factura.email && factura.email.toLowerCase() === usuario.email.toLowerCase()
    );

    contenedor.innerHTML = '';

    if (entregados.length === 0 && facturas.length === 0) {
      contenedor.innerHTML = 'div class=cuenta-vacioAún no tienes pedidos entregados disponibles para facturar.div';
      return;
    }

    entregados.slice().reverse().forEach(pedido = {
      const existente = buscarFacturaPorPedido(facturas, pedido.id);
      const tarjeta = document.createElement('article');
      tarjeta.className = 'cuenta-pedido';

      const titulo = document.createElement('strong');
      titulo.className = 'pedido-numero';
      titulo.textContent = 'Pedido ' + (pedido.id  'Sin número');

      const fecha = document.createElement('p');
      fecha.style.marginTop = '8px';
      fecha.textContent = 'Fecha del pedido ' + fechaLegible(pedido.fecha);

      const total = document.createElement('p');
      total.style.marginTop = '8px';
      total.textContent = 'Importe total ' + formatoMoneda(pedido.total);

      tarjeta.appendChild(titulo);
      tarjeta.appendChild(fecha);
      tarjeta.appendChild(total);

      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'cuenta-boton';
      boton.style.border = '0';
      boton.style.cursor = 'pointer';

      if (existente) {
        boton.textContent = 'Consultar  Descargar ' + existente.folio;
        boton.addEventListener('click', () = imprimirFactura(existente));
      } else {
        boton.textContent = 'Generar factura demostrativa';
        boton.addEventListener('click', () = generarFactura(pedido, usuario));
      }

      tarjeta.appendChild(boton);
      contenedor.appendChild(tarjeta);
    });

    facturas.slice().reverse().forEach(factura = {
      if (entregados.some(pedido = String(pedido.id) === String(factura.pedidoId))) return;

      const tarjeta = document.createElement('article');
      tarjeta.className = 'cuenta-pedido';
      const titulo = document.createElement('strong');
      titulo.className = 'pedido-numero';
      titulo.textContent = factura.folio + ' · Pedido ' + factura.pedidoId;
      const importe = document.createElement('p');
      importe.style.marginTop = '8px';
      importe.textContent = 'Importe ' + formatoMoneda(factura.total);
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'cuenta-boton';
      boton.style.border = '0';
      boton.style.cursor = 'pointer';
      boton.textContent = 'Consultar  Descargar';
      boton.addEventListener('click', () = imprimirFactura(factura));
      tarjeta.appendChild(titulo);
      tarjeta.appendChild(importe);
      tarjeta.appendChild(boton);
      contenedor.appendChild(tarjeta);
    });
  }

  function generarFactura(pedido, usuario) {
    const estado = String(pedido.estatus  '').trim().toLowerCase();
    if (estado !== 'entregado') {
      alert('Solo puedes generar una factura cuando el pedido esté entregado.');
      return;
    }

    const datosFiscales = leerDatosFiscales(usuario);
    if (!datosFiscales  !datosFiscales.rfc  !datosFiscales.nombre 
        !datosFiscales.codigoPostal  !datosFiscales.regimenFiscal  !datosFiscales.usoCFDI) {
      alert('Primero completa y guarda tus Datos de facturación.');
      if (typeof mostrarSeccionCuenta === 'function') {
        const boton = document.querySelector('.cuenta-menu button[onclick=datos-facturacion]');
        if (boton) mostrarSeccionCuenta('datos-facturacion', boton);
      }
      return;
    }

    const facturas = leerFacturas();
    const existente = buscarFacturaPorPedido(facturas, pedido.id);
    if (existente) {
      imprimirFactura(existente);
      return;
    }

    const factura = {
      folio siguienteFolio(facturas),
      pedidoId pedido.id,
      email usuario.email,
      fechaEmision new Date().toISOString(),
      fechaPedido pedido.fecha  '',
      modalidad pedido.modo  '',
      total Number(pedido.total  0),
      receptor {
        rfc datosFiscales.rfc,
        nombre datosFiscales.nombre,
        codigoPostal datosFiscales.codigoPostal,
        regimenFiscal datosFiscales.regimenFiscal,
        usoCFDI datosFiscales.usoCFDI
      }
    };

    facturas.push(factura);
    try {
      guardarFacturas(facturas);
    } catch (error) {
      alert('No se pudo guardar la factura en este navegador. Revisa el almacenamiento disponible.');
      return;
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

    const receptor = factura.receptor  {};
    const modo = factura.modalidad === 'domicilio'  'Envío a domicilio'  'Recoger en sucursal';
    const documento = `!DOCTYPE html
html lang=es
head
meta charset=UTF-8
meta name=viewport content=width=device-width, initial-scale=1.0
title${escaparHTML(factura.folio)} - PanRedtitle
style
  body{font-familyArial,Helvetica,sans-serif;color#1f2937;margin0;padding35px;}
  .hoja{max-width850px;marginauto;border1px solid #cbd5e1;padding34px;}
  .encabezado{displayflex;justify-contentspace-between;gap20px;border-bottom3px solid #3b6e9f;padding-bottom18px;}
  h1{margin0;color#245783;}h2{font-size16px;margin24px 0 10px;color#245783;}
  p{margin6px 0;line-height1.4}.folio{text-alignright}.aviso{margin22px 0;padding12px;background#fff7ed;border1px solid #fdba74;color#9a3412;font-weightbold;text-aligncenter;}
  table{width100%;border-collapsecollapse;margin-top12px;}th,td{border1px solid #cbd5e1;padding11px;text-alignleft;}th{background#eff6ff;}.importe{text-alignright;font-weightbold;font-size20px;margin-top20px;}
  .nota{font-size12px;color#475569;margin-top25px;border-top1px solid #cbd5e1;padding-top12px;}
  .acciones{text-aligncenter;margin20px auto;}.acciones button{padding11px 18px;background#245783;colorwhite;border0;border-radius5px;cursorpointer;}
  @media print{body{padding0}.hoja{border0;padding12px}.acciones{displaynone}}
style
head
body
div class=hoja
  div class=encabezado
    divh1PanRedh1pstrongPanRed Comercializadora, S.A. de C.V.strongppRFC PDE000000XXX (identificador ficticio)ppDomicilio de referencia ficticio Avenida Tecnológico sn, esquina Avenida Carlos Hank González, Colonia Valle de Anáhuac, Sección Fuentes, Ecatepec de Morelos, Estado de México, C.P. 55210.pdiv
    div class=folioh2FACTURA DEMOSTRATIVAh2pstrongFoliostrong ${escaparHTML(factura.folio)}ppstrongFecha de emisiónstrong ${escaparHTML(fechaLegible(factura.fechaEmision))}ppstrongPedidostrong ${escaparHTML(factura.pedidoId)}pdiv
  div
  div class=avisoDOCUMENTO DE DEMOSTRACIÓN · SIN VALIDEZ FISCAL · NO ES CFDIdiv
  h2Datos del receptorh2
  pstrongNombre  razón socialstrong ${escaparHTML(receptor.nombre)}p
  pstrongRFCstrong ${escaparHTML(receptor.rfc)}p
  pstrongCódigo postal fiscalstrong ${escaparHTML(receptor.codigoPostal)}p
  pstrongRégimen fiscalstrong ${escaparHTML(receptor.regimenFiscal)}p
  pstrongUso del CFDI indicadostrong ${escaparHTML(receptor.usoCFDI)}p
  h2Concepto de la operaciónh2
  tabletheadtrthDescripciónththModalidadththImportethtrthead
  tbodytrtdCompra correspondiente al pedido ${escaparHTML(factura.pedidoId)}tdtd${escaparHTML(modo)}tdtd${formatoMoneda(factura.total)}tdtrtbodytable
  p class=importeTOTAL ${formatoMoneda(factura.total)}p
  div class=notapEste documento es una representación académica generada por PanRed para fines demostrativos. Los datos del emisor son ficticios y el domicilio indicado es únicamente una referencia, no un domicilio fiscal real ni implica relación institucional con el TESE.ppEl importe se presenta como resumen del pedido. Este documento no calcula ni desglosa impuestos, no sustituye un CFDI y no tiene efectos fiscales.ppDocumento almacenado localmente en el navegador del usuario.pdiv
div
div class=accionesbutton onclick=window.print()Imprimir  Guardar como PDFbuttondiv
body
html`;

    ventana.document.open();
    ventana.document.write(documento);
    ventana.document.close();
  }

  document.addEventListener('DOMContentLoaded', renderizarFacturacion);

  window.PanRedFacturacion = {
    actualizar renderizarFacturacion,
    generar generarFactura
  };
})();

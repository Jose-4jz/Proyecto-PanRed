# PanRed — Guía de instalación y presentación

## 1. Requisitos previos

Para ejecutar y presentar el proyecto, se necesita:

- Visual Studio Code (VS Code).
- La carpeta completa del proyecto PanRed.
- La extensión **Live Server** de VS Code.
- Una computadora y, si se desea presentar en un celular, ambos dispositivos conectados a la misma red Wi-Fi.

## 2. Preparación del proyecto

1. Localizar el archivo `.rar` que contiene el proyecto PanRed.
2. Extraer su contenido en una carpeta de fácil acceso.
3. Verificar que se hayan extraído todos los archivos y carpetas del proyecto.
4. Abrir Visual Studio Code.
5. Seleccionar **Archivo → Abrir carpeta** y elegir la carpeta donde se extrajo PanRed.

**Importante:** trabajar desde la carpeta completa del proyecto para conservar las rutas y referencias entre sus archivos.

## 3. Iniciar el servidor local

1. Abrir el proyecto PanRed en Visual Studio Code.
2. Localizar el botón **Go Live** en la esquina inferior derecha de la ventana. Este botón corresponde a la extensión Live Server.
3. Hacer clic en **Go Live** para iniciar el servidor local.
4. Esperar a que se abra el navegador o a que VS Code indique que el servidor está activo.

El servidor permite visualizar la página desde el navegador sin necesidad de instalar el proyecto en un servidor web externo.

## 4. Presentar el proyecto en la computadora

Una vez iniciado Live Server, abrir la página de productos desde el navegador.

Dirección habitual:

`http://127.0.0.1:5500/productos.html`

También puede utilizarse la dirección local que muestre Live Server.

## 5. Presentar el proyecto desde un celular

Para visualizar PanRed desde un teléfono, seguir estos pasos:

1. Conectar la computadora y el celular a la misma red Wi-Fi.
2. Iniciar Live Server en la computadora.
3. Consultar la dirección IPv4 de la computadora siguiendo las instrucciones de la sección 6.
4. Sustituir la dirección IP de ejemplo por la dirección obtenida.
5. Abrir el navegador del celular e ingresar la dirección completa de la página.

**Ejemplo de acceso en la red doméstica:**

`http://192.168.100.30:5500/productos.html`

Esta dirección corresponde a la configuración de red utilizada anteriormente. Si la computadora recibe una dirección IP diferente, será necesario actualizarla en el enlace.

**Importante:** no cerrar VS Code ni detener Live Server durante la presentación. Si el celular no puede acceder a la página, revisar la conexión Wi-Fi y las posibles restricciones del firewall de Windows.

## 6. Consultar la dirección IP de la computadora

La dirección IP local puede cambiar al conectarse a otra red o al reiniciar el router. Para obtener la dirección actual en Windows:

1. Presionar `Win + R`.
2. Escribir `cmd` y presionar Enter.
3. Ejecutar el siguiente comando:

   `ipconfig`

4. Localizar el apartado correspondiente al adaptador **Wi-Fi** que esté conectado.
5. Identificar el campo **Dirección IPv4**.
6. Copiar esa dirección y utilizarla en el enlace de la sección 5.

**Ejemplo de referencia:**

- Dirección IPv4: `192.167.110.40`
- Puerto de Live Server: `5500`
- Archivo que se desea mostrar: `productos.html`

Con estos datos, el enlace completo sería:

`http://192.167.110.40:5500/productos.html`

No utilizar la dirección IPv6, la puerta de enlace predeterminada ni la dirección de un adaptador que esté desconectado.

## 7. Solución de problemas

### Live Server no inicia

- Verificar que la extensión Live Server esté instalada y habilitada.
- Confirmar que la carpeta del proyecto esté abierta en VS Code.
- Revisar si el puerto habitual `5500` está ocupado y comprobar qué puerto está utilizando el servidor.

### La página no abre en el celular

- Confirmar que ambos dispositivos estén conectados a la misma red Wi-Fi.
- Verificar que Live Server siga activo.
- Comprobar que la dirección IPv4 sea la actual.
- Revisar que el enlace incluya el puerto correcto y la ruta `productos.html`.
- Si persiste el problema, comprobar que el firewall de Windows permita las conexiones necesarias y que la red no tenga aislamiento entre dispositivos.

### La página no se encuentra

- Confirmar que el archivo `productos.html` exista dentro de la carpeta que está sirviendo Live Server.
- Revisar que la ruta del archivo sea correcta.
- Comprobar que se haya abierto la carpeta adecuada del proyecto.

## 8. Lista de verificación antes de presentar

- [ ] Todos los archivos del proyecto están disponibles.
- [ ] PanRed está abierto en Visual Studio Code.
- [ ] Live Server está activo.
- [ ] La página `productos.html` abre correctamente en la computadora.
- [ ] La computadora y el celular están conectados a la misma red Wi-Fi, si se realizará una demostración móvil.
- [ ] La dirección IPv4 y el enlace de acceso son correctos.
- [ ] El celular puede acceder a la página, si corresponde.

---

**Nota de mantenimiento:** las direcciones IP, los puertos y las rutas de acceso deben verificarse cuando cambie la configuración del equipo. Esta guía utiliza como referencia el puerto `5500` y la dirección IPv4 `192.168.100.30`, correspondientes a una configuración anterior.
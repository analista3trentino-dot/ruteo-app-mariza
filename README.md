# Ruteo por Carteras · TR1 · Trentino

App web de ruteo de vendedores TR1, publicada con GitHub Pages.

## Secciones (barra de abajo)

- **Ruta**: carteras y clientes (con su código), lista o mapa, filtros por día y "Top".
- **Top**: cuántos clientes top hay que visitar cada día, por supervisor y por cartera.
- **Catálogo**: catálogo de productos 2025 (páginas `pag-01.webp` … `pag-77.webp`).
- **Precios**: lista 25 y lista 35, con buscador.

## Elegir la cartera (link general)

La primera vez que se abre el link general en un celular, la app pregunta "¿Cuál es tu cartera?".
El vendedor la elige y queda guardada en ese celular. Arriba hay un botón "Cambiar cartera".
Los supervisores eligen "Soy supervisor: ver todas las carteras".

## Visitas (supervisores)

La sección **Visitas** aparece solo en modo supervisor. Lee `visitas.xlsx`
(el Excel de marcaciones del sistema, del día 1 del mes hasta ayer).
Cruza cada visita con el ruteo **por código de cliente** y muestra, por día y por mes:
cumplimiento del ruteo (la visita vale aunque haya sido otro día) y clientes visitados.
Para entrar como supervisor se pide la clave que está en `config.js`.

## Link por vendedor

Agregando `?c=CÓDIGO` al link, la app abre solo esa cartera (y su cartera mixta AR si tiene),
sin supervisores ni otras carteras. Ejemplo:

    https://analista3trentino-dot.github.io/ruteo-app-mariza/?c=TR1338

El link sin `?c=` es el general (supervisores y jefatura).

## Qué archivo actualizar para cada cosa

| Quiero cambiar…                 | Archivo                                   | Cómo                                   |
|---------------------------------|-------------------------------------------|----------------------------------------|
| Nombre del vendedor de una cartera | `vendedores.js`                        | Editar en GitHub con el lápiz          |
| Clientes top                    | `clientes_top.xlsx`                       | Subir el Excel nuevo con ese nombre    |
| Visitas (control de ruteo)      | `visitas.xlsx`                            | Cada mañana: exportar las marcaciones del mes, renombrar y subir |
| Clave de supervisores           | `config.js`                               | Editar en GitHub con el lápiz          |
| Precios                         | `lista_precios_25.xlsx`, `lista_precios_35.xlsx` | Exportar del sistema, renombrar y subir (la app muestra la fecha de actualización) |
| Colores y diseño                | `styles.css`                              | Editar en GitHub                       |
| Clientes, días y GPS            | `data.js`, `data-mix.js`                  | Pedir que se regeneren                 |

Los Excel se leen tal como salen del sistema: la app busca sola la fila de títulos
(no importa si arriba están los "Filtros aplicados").

- `clientes_top.xlsx` necesita las columnas **Vendedor** y **Subcliente**.
- Las listas de precios necesitan **cod_articulo, desc_articulo, referencia,
  precio_unitario, precio_caja** (y opcional **cod_barra**).

## Archivos de la app (no hace falta tocarlos)

`index.html`, `app.js`, `excel.js`, `precios.js`, `catalogo.js`, `xlsx.mini.min.js`
(librería para leer Excel, SheetJS, licencia Apache 2.0), `logo-trentino.png`.

## Nota sobre actualizaciones

En `index.html` cada archivo lleva una marca de versión (`?v=…`) para que los celulares
descarguen siempre la versión nueva y no mezclen archivos viejos con nuevos.

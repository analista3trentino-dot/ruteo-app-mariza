# Ruteo por Carteras · TR1 · Trentino

App web de ruteo de vendedores TR1, publicada con GitHub Pages.

## Secciones (barra de abajo)

- **Ruta**: carteras y clientes (con su código), lista o mapa, filtros por día y "Top".
- **Top**: cuántos clientes top hay que visitar cada día, por supervisor y por cartera.
- **Catálogo**: catálogo de productos 2025 (páginas `pag-01.webp` … `pag-77.webp`).
- **Precios**: lista 25 y lista 35, con buscador.

## Qué archivo actualizar para cada cosa

| Quiero cambiar…                 | Archivo                                   | Cómo                                   |
|---------------------------------|-------------------------------------------|----------------------------------------|
| Nombre del vendedor de una cartera | `vendedores.js`                        | Editar en GitHub con el lápiz          |
| Clientes top                    | `clientes_top.xlsx`                       | Subir el Excel nuevo con ese nombre    |
| Precios                         | `lista_precios_25.xlsx`, `lista_precios_35.xlsx` | Subir el Excel nuevo con ese nombre |
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

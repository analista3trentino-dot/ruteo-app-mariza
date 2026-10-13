# Ruteo por Carteras · TR1 · Trentino

App web de ruteo de vendedores TR1 (lista + mapa), publicada con GitHub Pages.

## Estructura

```
index.html            Estructura de la página (encabezado, KPIs, filtros, lista, mapa)
css/styles.css        Todos los estilos (colores, tipografía, tarjetas, mapa)
js/data.js            APP_DATA: supervisores, carteras y clientes
js/data-mix.js        APP_DATA_MIX: carteras de vendedores mixtos
js/app.js             Lógica: filtros, búsqueda, días, visitas, mapa Leaflet
assets/logo-trentino.png
```

## Orden de carga (no cambiar)

1. Leaflet (CDN) en el `<head>`
2. `js/data.js` → `js/data-mix.js` → `js/app.js` al final del `<body>`

`app.js` usa las variables globales `APP_DATA` y `APP_DATA_MIX`, por eso los
archivos de datos deben cargarse antes.

## Actualizar datos

Para refrescar clientes o carteras, reemplazá solo `js/data.js` y/o
`js/data-mix.js` (y la fecha `GEN_DATE` al inicio de `js/app.js`).
El diseño y la lógica no se tocan.

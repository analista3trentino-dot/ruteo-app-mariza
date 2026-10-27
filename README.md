# Ruteo por Carteras TR1

App web publicada en GitHub Pages. Para actualizarla se suben los Excel del sistema
a la página principal del repositorio (**Agregar archivo → Subir archivos → Confirmar cambios**),
con el nombre que traigan. La app reconoce cada Excel y usa el más nuevo de cada tipo.

| Qué cambia | Qué Excel subir | Cada cuánto |
|---|---|---|
| Ruteo (clientes y días) | Detalle de ruteo por carteras | Cuando cambia el ruteo |
| GPS de los clientes | Subcliente por Visita latitud y longitud | Cuando cambia el ruteo |
| LP y PM de cada cliente | Padrón de clientes (Subcliente, PM, LP) | Cuando cambia |
| Visitas | Marcaciones de visitas | Cada mañana |
| Lo que compró cada cliente en el mes | Ventas (Power BI, "Datos resumidos") | Cada día |
| Potencial de ruta | Potencial de Ruta de Venta | Cuando se actualiza |
| Precios (botón LP) | Listado de precios de cada lista | Cuando cambian |

Archivos que se pueden editar a mano:
- `vendedores.js`: solo para cambiar cómo se muestra el nombre de un vendedor.
- `config.js`: clave de supervisores.
- `ruteo.js` (arriba): nombre que se muestra de cada supervisor.

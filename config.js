// =====================================================================
//  CLAVES DE ACCESO
// ---------------------------------------------------------------------
//  SUPERVISORES: cada uno entra con SU clave y ve solo su equipo
//  (sus vendedores, sus visitas y sus avisos).
//  JEFATURA: ve todo, todos los equipos y el control de supervisores.
//  Los vendedores no tienen clave: solo ven su cartera.
//
//  Para cambiar una clave: editá el texto entre comillas y confirmá los
//  cambios. Ese supervisor tendrá que escribir la clave nueva.
//  No borres las comillas " " ni la coma , del final.
// =====================================================================

const CLAVES_SUPERVISORES = {
  "TR12": "aygas12",        // ST. MAY. AYGAS
  "TR13": "centro13",       // ST. GAS CENTRO
  "TR15": "itaugua15",      // ST. GAS ITAUGUA/ITA
  "TR16": "caacupe16",      // ST. CAACUPE
  "TR17": "norte17",        // ST. GAS NORTE
  "TR18": "paraguari18",    // ST. PARAGUARI (TR18 y TR19)
};

const CLAVE_JEFATURA = 'jefatura2026';


// =====================================================================
//  CLIENTES TOP
// ---------------------------------------------------------------------
//  Son clientes top los que tienen uno de estos PM (del padrón/ruteo).
//  Para agregar o quitar un PM, editá la lista. Ej.: "13.8",
// =====================================================================
const PM_TOP = ["13.1", "13.2", "13.5", "21.1", "12.1", "12.2"];

// Stock: un producto cuenta como "reposición" recién cuando supera estas unidades.
// Con menos, en la lista de precios aparece en rojo (stock bajo).
const STOCK_MINIMO = 1000;

// Vendedores mixtos (marcan por Trentino y por Apolo): sus visitas por Apolo se suman
// a su cartera TR. Si se agrega uno nuevo, sumalo a la lista.
const MIXTOS = ["TR1621", "TR1737", "TR1821", "TR1933", "TR1934"];

// Clientes que NO son top aunque tengan uno de esos PM (código del subcliente)
const TOP_EXCLUIR = [
  "3136-30",   // COOPERATIVA CHORTITZER LTDA - ITA
];


// =====================================================================
//  FOTOS Y COMPETENCIA (se guardan en Google Drive)
// ---------------------------------------------------------------------
//  FOTOS_URL: el enlace de la "aplicación web" de Google Apps Script
//  (termina en /exec). FOTOS_CLAVE tiene que ser igual a CLAVE_APP del
//  script de Google. Si dejás FOTOS_URL vacío, las fotos no aparecen.
// =====================================================================
const FOTOS_URL = "https://script.google.com/macros/s/AKfycbwD4J2ho6VOFvZ2TAgkJYiM4ZZIusm7xXcmj3kJNp_JWjVHCNnj3ERJ5mTDxL7HAmxLPw/exec";
const FOTOS_CLAVE = "trentino-fotos-2026";

// Carpeta de Google Drive con las imágenes de las marcas y productos (ficha TOP).
// Logos: un archivo con el nombre de la marca (ej. "Menoyo.png").
// Productos: el nombre empieza con el código del artículo (ej. "5033.jpg").
const MARCAS_CARPETA = "1mGNL79KR9Mpu_MEDXRj5Dtx6xCuQIAZG";

// Encuesta de la app: mientras esté activa, a cada vendedor y supervisor le aparece
// el botón "Responder" arriba de la ruta. Las respuestas llegan a tu planilla (hoja
// "Encuesta") y el resumen se ve en Jefatura > Supervisores.
// Plazo: "hasta" es día y hora de cierre ("AAAA-MM-DD HH:MM"). Después de esa hora el botón
// desaparece solo y no se aceptan más respuestas; vos seguís viendo los resultados.
// Para cerrarla antes poné activa: false. Para una encuesta nueva, cambiá el id (ej. "app-dic-2026").
const ENCUESTA = { id: "app-nov-2026", activa: true, hasta: "2026-11-06 17:00" };

// ---------------------------------------------------------------------
// PRODUCTOS FOCO DEL MES: franja arriba de la Ruta y del Catálogo (no en Avisos).
// Cada mes cambiá el mes y las marcas. Por cada marca podés poner:
//   producto:    el producto foco (texto corto)
//   logo:        imagen del logo (archivo subido a GitHub)
//   foto:        foto del producto foco
//   referencias: imágenes de referencia (folletos)
//   paginas:     páginas del catálogo a mostrar (si no, se buscan solas por la marca)
// ---------------------------------------------------------------------
const PRODUCTOS_FOCO = {
  mes: "Noviembre",
  mensaje: "¡Vamos Trentino! A empujar estas marcas en cada visita.",
  marcas: [
    { marca: "Mesa", logo: "foco-logo-mesa.webp" },
    { marca: "Saadet", logo: "foco-logo-saadet.webp",
      referencias: [{ src: "foco-saadet.jpg", w: 756, h: 540 }] },
    { marca: "Copacol", logo: "foco-logo-copacol.webp" },
    { marca: "Urca", producto: "Jabón en polvo", logo: "foco-logo-urca.webp",
      foto: { src: "foco-urca-jabon.webp", w: 283, h: 265 } },
    { marca: "7 Colinas", producto: "660 Choop", logo: "foco-logo-7-colinas.webp",
      referencias: [{ src: "foco-7-colinas.jpg", w: 1088, h: 1100 }] },
    { marca: "Casaredo", producto: "Wafer 43 g", logo: "foco-logo-casaredo.webp", paginas: [45, 44] },
    { marca: "Menoyo", producto: "Display de 60 g", logo: "foco-logo-menoyo.webp" }
  ]
};

// =====================================================================
//  MARCAS POTENCIALES DEL MES
//  Se ven en la pantalla de foco (pestaña "Potenciales") y en el Catálogo.
//  canasta: true  → es especial de CANASTAS NAVIDEÑAS (se muestra aparte, con su sello 🎄).
//  Si una marca no tiene logo, se muestra su nombre.
// =====================================================================
const MARCAS_POTENCIALES = {
  mes: "Noviembre",
  mensaje: "Marcas con más oportunidad este mes: ofrecelas en cada cliente.",
  canastas: {
    titulo: "Canastas navideñas",
    mensaje: "Productos especiales para armar canastas de fin de año. Ofrecelos a comercios que arman canastas y a empresas que regalan a su gente."
  },
  marcas: [
    { marca: "Menoyo", logo: "foco-logo-menoyo.webp" },
    { marca: "Rivoli", logo: "foco-logo-rivoli.webp", canasta: true },
    { marca: "Mesa", logo: "foco-logo-mesa.webp" },
    { marca: "Piacere", logo: "foco-logo-piacere.webp" },
    { marca: "Urca", logo: "foco-logo-urca.webp" },
    { marca: "Selky", logo: "foco-logo-selky.webp", canasta: true },
    { marca: "Chocobon", logo: "foco-logo-chocobon.webp", canasta: true },
    { marca: "Casaredo", logo: "foco-logo-casaredo.webp", canasta: true },
    { marca: "Santa Mónica", logo: "foco-logo-santa-monica.webp", canasta: true },
    { marca: "Piattelli", logo: "foco-logo-piattelli.webp" },
    { marca: "Otro Loco Más", logo: "foco-logo-otro-loco-mas.webp" },
    { marca: "Farruca", logo: "foco-logo-la-farruca.webp", canasta: true, catalogo: "La Farruca" },
    { marca: "Danesa", producto: "Galletitas danesas Bakemate (lata)", logo: "foco-logo-bakemate.webp", canasta: true, catalogo: "Bakemate",
      foto: { src: "foco-bakemate-danesa.webp", w: 544, h: 562 }, paginas: [46] },
    { marca: "7 Colinas", logo: "foco-logo-7-colinas.webp" },
    { marca: "Anasol", logo: "foco-logo-anasol.webp" }
  ]
};

// =====================================================================
//  TÁCTICOS DE VOLUMEN DEL MES
//  Solo para clientes con PERFIL (PM) habilitado: en la Ruta les aparece "🎯 Táctico".
//  Cada acción: comprando "compra" recibe "bonif" sin cargo (en cajas o unidades).
//  Para el mes que viene: cambiar "mes", los "perfiles" y las "marcas".
// =====================================================================
const TACTICOS = {
  mes: "Noviembre",
  perfiles: ["12.1","12.2","13.1","13.2","13.5","13.8","13.9","17.1","17.9","21.1","21.2","21.3","21.9","22.4","22.8","23.1","25.5","25.8"],
  marcas: [
    { marca: "Bluf", acciones: [
      { accion: "6433", cod: "3185", productos: ["3185 Papel hig. simple neutro 30m 4 und", "3184 Papel hig. simple perfumado 30m 4 und", "3187 Papel hig. simple neutro 30m 8 und", "3186 Papel hig. simple perfumado 30m 8 und"], compra: 30, bonif: 1, unidad: "cajas", nota: "Surtido entre los 4 códigos" },
      { accion: "6434", cod: "3185", productos: ["3185 Papel hig. simple neutro 30m 4 und", "3184 Papel hig. simple perfumado 30m 4 und", "3187 Papel hig. simple neutro 30m 8 und", "3186 Papel hig. simple perfumado 30m 8 und"], compra: 100, bonif: 5, unidad: "cajas", nota: "Surtido entre los 4 códigos" } ] },
    { marca: "Residence", nombre: "Residence Velas", acciones: [
      { accion: "6432", cod: "218", productos: ["469 Vela Nº2 chica", "468 Vela Nº3 mediana", "467 Vela Nº4", "218 Vela Nº5", "476 Vela Nº6 caja 24x8", "475 Vela Nº8 caja 24x8"], compra: 100, bonif: 5, unidad: "cajas", nota: "Surtido de velas" },
      { accion: "6435", cod: "469", productos: ["469 Vela Nº2 chica - und c/8"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6436", cod: "468", productos: ["468 Vela Nº3 mediana - und c/8"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6437", cod: "467", productos: ["467 Vela Nº4 - und c/8"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6438", cod: "218", productos: ["218 Vela Nº5 - und c/8"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6440", cod: "476", productos: ["476 Vela Nº6 - caja 24x8"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6441", cod: "475", productos: ["475 Vela Nº8 - caja 24x8"], compra: 30, bonif: 1, unidad: "cajas" } ] },
    { marca: "Menoyo", logo: "foco-logo-menoyo.webp", acciones: [
      { accion: "6442", cod: "775", productos: ["775 Mayonesa - und 2,7 kg"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6443", cod: "2012", productos: ["2012 Mostaza - caja 4x2,7 kg"], compra: 30, bonif: 1, unidad: "cajas" } ] },
    { marca: "Rivoli", logo: "foco-logo-rivoli.webp", acciones: [
      { accion: "6444", cod: "1399", productos: ["1399 Aceitunas verdes rodaja - balde 3,2 kg"], compra: 30, bonif: 1, unidad: "und" },
      { accion: "6445", cod: "1398", productos: ["1398 Aceitunas verdes s/semilla - balde 3,2 kg"], compra: 30, bonif: 1, unidad: "und" },
      { accion: "6446", cod: "837", productos: ["837 Aceitunas verdes c/semilla - balde 3,2 kg"], compra: 30, bonif: 1, unidad: "und" },
      { accion: "6489", cod: "1520", productos: ["1520 Aceitunas verdes c/semilla doy pack 170 g"], compra: 23, bonif: 1, unidad: "und" },
      { accion: "6488", cod: "350", productos: ["350 Aceitunas verdes c/semilla doy pack 240 g"], compra: 23, bonif: 1, unidad: "und" } ] },
    { marca: "Piacere", logo: "foco-logo-piacere.webp", acciones: [
      { accion: "6449", cod: "1730", productos: ["1730 Ketchup - und 160 g", "1731 Mostaza - und 160 g"], compra: 30, bonif: 1, unidad: "cajas", nota: "Surtido ketchup y mostaza" } ] },
    { marca: "Listo", acciones: [
      { accion: "6519", cod: "11863", productos: ["11863 Extracto de tomate bidón - caja 4x3 kg"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6520", cod: "6951", productos: ["6951 Salsa lista p/ pizza - und 3 kg"], compra: 30, bonif: 1, unidad: "cajas" } ] },
    { marca: "Listo Aceites", nombre: "Listo Aceites / Conservas", acciones: [
      { accion: "6453", cod: "3884", productos: ["3884 Aceite de girasol - 900 ml"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6454", cod: "3883", productos: ["3883 Aceite de girasol - 1500 ml"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6456", cod: "3881", productos: ["3881 Aceite de girasol - 5000 ml"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6460", cod: "6956", productos: ["6956 Aceite mezcla - 900 ml"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6461", cod: "6955", productos: ["6955 Aceite mezcla - 1500 ml"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6459", cod: "6957", productos: ["6957 Aceite mezcla - 5000 ml"], compra: 30, bonif: 1, unidad: "cajas" } ] },
    { marca: "Mesa", logo: "foco-logo-mesa.webp", acciones: [
      { accion: "6462", cod: "64", productos: ["64 Margarina c/sal - caja 24x250 g"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6464", cod: "92", productos: ["92 Margarina c/sal - caja 12x500 g"], compra: 30, bonif: 1, unidad: "cajas" } ] },
    { marca: "Hanilase", nombre: "Hanilase / Ha-La", acciones: [
      { accion: "6466", cod: "1299", productos: ["1299 Cuajo Hanilase - caja 24x200 ml"], compra: 30, bonif: 1, unidad: "cajas" } ] },
    { marca: "Copacol", logo: "foco-logo-copacol.webp", acciones: [
      { accion: "6467", cod: "7200", productos: ["7200 Mortadela c/tocino - 1,7 kg"], compra: 30, bonif: 1, unidad: "cajas" } ] },
    { marca: "7 Colinas", logo: "foco-logo-7-colinas.webp", acciones: [
      { accion: "6468", cod: "1967", productos: ["1967 Tinto suave - caja 12x880 ml"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6469", cod: "1961", productos: ["1961 Tinto suave - caja 6x2 L"], compra: 30, bonif: 1, unidad: "cajas" },
      { accion: "6470", cod: "1986", productos: ["1986 Tinto suave - 3 L"], compra: 30, bonif: 1, unidad: "cajas" } ] },
    { marca: "Selky", logo: "foco-logo-selky.webp", acciones: [
      { accion: "6490", cod: "7183", productos: ["7183 Papas barbacoa - 110 g"], compra: 23, bonif: 1, unidad: "und" },
      { accion: "6491", cod: "7185", productos: ["7185 Papas crema acebollada - 110 g"], compra: 23, bonif: 1, unidad: "und" },
      { accion: "6493", cod: "7186", productos: ["7186 Papas picante - 110 g"], compra: 23, bonif: 1, unidad: "und" },
      { accion: "6494", cod: "7184", productos: ["7184 Papas queso - 110 g"], compra: 23, bonif: 1, unidad: "und" } ] },
    { marca: "Bakemate", nombre: "Bakemate (Danesa)", logo: "foco-logo-bakemate.webp", acciones: [
      { accion: "6495", cod: "6069", productos: ["6069 Galletita danesa mantecada lata - 114 g"], compra: 23, bonif: 1, unidad: "und" } ] },
    { marca: "Chocobon", logo: "foco-logo-chocobon.webp", acciones: [
      { accion: "6497", cod: "6122", productos: ["6122 Bombón relleno chocolate - display x12"], compra: 23, bonif: 1, unidad: "und" },
      { accion: "6524", cod: "6123", productos: ["6123 Bombón relleno chocolate - x24"], compra: 23, bonif: 1, unidad: "und" } ] },
    { marca: "Casaredo", logo: "foco-logo-casaredo.webp", acciones: [
      { accion: "6498", cod: "4975", productos: ["4975 Roscas chocolate 250 g", "4976 Roscas leche 250 g", "4977 Roscas coco 250 g", "4979 Roscas brigadeiro 250 g", "4980 Roscas capuccino 250 g"], compra: 19, bonif: 1, unidad: "und", nota: "Surtido de roscas" } ] },
    { marca: "Santa Mónica", logo: "foco-logo-santa-monica.webp", acciones: [
      { accion: "6485", cod: "3368", productos: ["3368 Vino dulce - 750 ml"], compra: 11, bonif: 1, unidad: "und" },
      { accion: "6486", cod: "3371", productos: ["3371 Gran vino tinto - 750 ml"], compra: 11, bonif: 1, unidad: "und" } ] }
  ]
};

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

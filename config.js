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


// =====================================================================
//  FOTOS Y COMPETENCIA (se guardan en Google Drive)
// ---------------------------------------------------------------------
//  FOTOS_URL: el enlace de la "aplicación web" de Google Apps Script
//  (termina en /exec). FOTOS_CLAVE tiene que ser igual a CLAVE_APP del
//  script de Google. Si dejás FOTOS_URL vacío, las fotos no aparecen.
// =====================================================================
const FOTOS_URL = "https://script.google.com/macros/s/AKfycbwD4J2ho6VOFvZ2TAgkJYiM4ZZIusm7xXcmj3kJNp_JWjVHCNnj3ERJ5mTDxL7HAmxLPw/exec";
const FOTOS_CLAVE = "trentino-fotos-2026";

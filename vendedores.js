// =====================================================================
//  VENDEDORES POR CARTERA
// ---------------------------------------------------------------------
//  Para cambiar el vendedor de una cartera, modificá SOLO el nombre
//  que está entre comillas, a la derecha del código.
//
//  Para dejar una cartera sin vendedor, escribí:  "CARTERA VACANTE"
//
//  Reglas para no romper nada:
//   - No borres las comillas " " ni la coma , del final de cada línea.
//   - No cambies el código de la izquierda (TR1201, AR1621, etc.).
//   - Lo que está después de // es solo una nota, no hace falta tocarlo.
// =====================================================================

const VENDEDORES = {

  // ---------- ST. GAS NORTE ----------
  "TM2312": "ELVA PALACIOS",                   // PV. LIMPIO

  // ---------- ST. MAY. AYGAS ----------
  "TR1201": "CARTERA VACANTE",                 // ST. LICITACIONES-NANAWA
  "TR1231": "ROCIO MEDINA",                    // RV. ABASTO
  "TR1232": "CARTERA VACANTE",                 // RV. MERCADO 4
  "TR1233": "RAMONA BENITEZ",                  // RV. MERCADO SAN LORENZO
  "TR1234": "YOHANA PALACIOS",                 // RV. CENTRO/MERCADO LUQUE

  // ---------- ST. GAS CENTRO ----------
  "TR1331": "KEVIN PERALTA",                   // RV. ASU-LAMBARE
  "TR1332": "MIGUEL CARRERAS",                 // RV. ASUNCION
  "TR1334": "SOFIA GONZALEZ",                  // RV. FDM
  "TR1335": "CARTERA VACANTE",                 // RV. LAMBARE - VE
  "TR1336": "SANTIAGO FERNANDEZ",              // RV. VILLA ELISA/SAN ANTONIO
  "TR1337": "JUAN SILVANO",                    // RV. ÑEMBY
  "TR1338": "ERIKSON SAMANIEGO",               // RV. SAN LORENZO

  // ---------- ST. GAS ITAUGUA/ITA ----------
  "TR1531": "ERIK YEGRS",                      // RV. VILLETA-GUARAMBARE
  "TR1532": "SERGIO BENITEZ",                  // RV. YPANE
  "TR1533": "CARTERA VACANTE",                 // VD. ZONAL J.A SALDIVAR
  "TR1534": "FRANCISCO LEIVA",                 // RV. ITA
  "TR1535": "CARTERA VACANTE",                 // VD. YPACARAI
  "TR1536": "MARIA ROMERO",                    // VD. ITAUGUA
  "TR1537": "RUBEN MEDINA",                    // RV. CAPIATA
  "TR1538": "JUAN BENITEZ",                    // VD. AREGUA-LUQUE

  // ---------- ST. CAACUPE ----------
  "TR1621": "LORENA MENDEZ",                   // PV. SUPER CAACUPE
  "TR1632": "TONMY GIMENEZ",                   // VD. ZONAL CAACUPE
  "TR1633": "RUTH VERA",                       // RV. SANBER
  "TR1634": "MARIBEL REYES",                   // RV. ALTOS/ATYRA
  "TR1635": "MARIA GONZALEZ",                  // RV. TOBATI
  "TR1637": "CARTERA VACANTE",                 // RV. EUSEBIO AYALIA
  "TR1638": "CARTERA VACANTE",                 // VD. CARAGUATAY

  // ---------- ST. GAS NORTE ----------
  "TR1731": "CARTERA VACANTE",                 // RV. MRA
  "TR1732": "KEVIN MONGES",                    // RV.  LIMPIO
  "TR1733": "CARTERA VACANTE",                 // RV. EMBOSCADA
  "TR1734": "JOSEFINA ACOSTA",                 // RV. ARROYOS ESTEROS
  "TR1735": "NILDA BARRIENTOS",                // RV. VILLA HAYES/REMAN.
  "TR1737": "INGRID CASTRO",                   // RV. BENJAMIN ACEVAL

  // ---------- ST. PARAGUARI ----------
  "TR1821": "LORENZO VAZQUEZ",                 // PV. SUPER PARAGUARI
  "TR1832": "CARTERA VACANTE",                 // VD. ZONAL PARAGUARI
  "TR1834": "LAURA AGÜERO",                    // RV. YAGUARON
  "TR1836": "ROSA FERREIRA",                   // RV. PIRIBEBUY
  "TR1839": "CARTERA VACANTE",                 // VD. VALENZUELA
  "TR1931": "NERY PINTOS",                     // RV. CARAPEGUA
  "TR1932": "ADAN SOSA",                       // VD. QUINDY
  "TR1933": "LUIS GALEANO",                    // VD. YBYCUI/ACAHAY
  "TR1934": "MAICKOL DAVID BRITEZ MORALES",    // VD. LA COLMENA

  // ---------- ST. CAACUPE ----------
  "AR1621": "LORENA MENDEZ",                   // PV. SUPER CAACUPE  (cartera mixta)

  // ---------- ST. GAS NORTE ----------
  "AR1737": "INGRID CASTRO",                   // RV. BENJAMIN ACEVAL  (cartera mixta)

  // ---------- ST. PARAGUARI ----------
  "AR1821": "LORENZO VAZQUEZ",                 // PV. SUPER PARAGUARI  (cartera mixta)
  "AR1933": "LUIS GALEANO",                    // VD. YBYCUI/ACAHAY  (cartera mixta)
  "AR1934": "MAICKOL BRITEZ",                  // VD. LA COLMENA  (cartera mixta)

};


// ---------------------------------------------------------------------
//  NO MODIFICAR DESDE AQUÍ: aplica la lista de arriba a la app.
// ---------------------------------------------------------------------
[typeof APP_DATA !== "undefined" ? APP_DATA : null,
 typeof APP_DATA_MIX !== "undefined" ? APP_DATA_MIX : null].forEach(function (d) {
  if (!d || !d.carteras) return;
  d.carteras.forEach(function (c) {
    var n = VENDEDORES[c.vc];
    if (typeof n === "string" && n.trim()) c.vn = n.trim().toUpperCase();
  });
});

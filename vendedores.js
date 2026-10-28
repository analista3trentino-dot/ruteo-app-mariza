// =====================================================================
//  NOMBRES DE SUPERVISORES Y VENDEDORES
// ---------------------------------------------------------------------
//  Solo cambiá el nombre que está entre comillas:
//   - Si queda vacante:   "VACANTE"
//   - Si entra alguien:   escribí su nombre, ej. "JUAN PEREZ"
//  Y listo: la app lo toma sola al confirmar los cambios.
//
//  Las carteras y supervisores VACANTES no se cuentan en Visitas ni en el
//  control de Jefatura (solo cuentan los activos).
//
//  Reglas para no romper nada:
//   - No borres las comillas " " ni la coma , del final de cada línea.
//   - No cambies el código de la izquierda (TR13, TR1338, etc.).
//   - Lo que está después de // es solo una nota.
// =====================================================================

// ---------- SUPERVISORES ----------
const SUPERVISORES = {
  "TR12": "VACANTE",                    // ST. MAY. AYGAS
  "TR13": "FELIX SEGOVIA",              // ST. GAS CENTRO
  "TR15": "VACANTE",                    // ST. GAS ITAUGUA/ITA
  "TR16": "DIEGO GARCIA",               // ST. CAACUPE
  "TR17": "JORGE GONZALEZ",             // ST. GAS NORTE
  "TR18": "MARIA LIZ GALEANO",          // ST. PARAGUARI
};

// ---------- VENDEDORES ----------
const VENDEDORES = {

  // ---------- TR12 Aygas ----------
  "TR1201": "VACANTE",                      // ST. LICITACIONES-NANAWA
  "TR1231": "ROCIO MEDINA",                         // RV. ABASTO
  "TR1232": "VACANTE",                      // RV. MERCADO 4
  "TR1233": "RAMONA BENITEZ",                       // RV. MERCADO SAN LORENZO
  "TR1234": "YOHANA PALACIOS",                      // RV. CENTRO/MERCADO LUQUE

  // ---------- TR13 Centro ----------
  "TR1331": "KEVIN PERALTA",                        // RV. ASU-LAMBARE
  "TR1332": "MIGUEL CARRERAS",                      // RV. ASUNCION
  "TR1334": "SOFIA GONZALEZ",                       // RV. FDM
  "TR1335": "VACANTE",                      // RV. LAMBARE - VE
  "TR1336": "SANTIAGO FERNANDEZ",                   // RV. VILLA ELISA/SAN ANTONIO
  "TR1337": "JUAN SILVANO",                         // RV. ÑEMBY
  "TR1338": "ERIKSON SAMANIEGO",                    // RV. SAN LORENZO

  // ---------- TR15 Itauguá ----------
  "TR1531": "ERIK YEGRS",                           // RV. VILLETA-GUARAMBARE
  "TR1532": "SERGIO BENITEZ",                       // RV. YPANE
  "TR1533": "VACANTE",                      // VD. ZONAL J.A SALDIVAR
  "TR1534": "FRANCISCO LEIVA",                      // RV. ITA
  "TR1535": "VACANTE",                      // VD. YPACARAI
  "TR1536": "MARIA ROMERO",                         // VD. ITAUGUA
  "TR1537": "RUBEN MEDINA",                         // RV. CAPIATA
  "TR1538": "VACANTE",                      // VD. AREGUA-LUQUE

  // ---------- TR16 Caacupé ----------
  "TR1621": "LORENA MENDEZ",                        // PV. SUPER CAACUPE
  "TR1632": "TOMMY GIMENEZ",                        // VD. ZONAL CAACUPE
  "TR1633": "RUTH VERA",                            // RV. SANBER
  "TR1634": "MARIBEL REYES",                        // RV. ALTOS/ATYRA
  "TR1635": "MARIA GONZALEZ",                       // RV. TOBATI
  "TR1637": "VACANTE",                      // RV. EUSEBIO AYALIA
  "TR1638": "VACANTE",                      // VD. CARAGUATAY

  // ---------- TR17 Norte ----------
  "TM2312": "ELVA PALACIOS",                        // PV. LIMPIO
  "TR1731": "NATALIA CARDENAS",                       // RV. MRA
  "TR1732": "KEVIN MONGES",                         // RV.  LIMPIO
  "TR1733": "VACANTE",                      // RV. EMBOSCADA
  "TR1734": "JOSEFINA ACOSTA",                      // RV. ARROYOS ESTEROS
  "TR1735": "ALEJANDRO RAMIREZ",                    // RV. VILLA HAYES/REMAN.
  "TR1737": "INGRID CASTRO",                        // RV. BENJAMIN ACEVAL

  // ---------- TR18-19 Paraguarí ----------
  "TR1821": "LORENZO VAZQUEZ",                      // PV. SUPER PARAGUARI
  "TR1832": "VACANTE",                      // VD. ZONAL PARAGUARI
  "TR1834": "LAURA AGÜERO",                         // RV. YAGUARON
  "TR1836": "ROSA FERREIRA",                        // RV. PIRIBEBUY
  "TR1839": "VACANTE",                      // VD. VALENZUELA
  "TR1931": "NERY PINTOS",                          // RV. CARAPEGUA
  "TR1932": "ADAN SOSA",                            // VD. QUINDY
  "TR1933": "LUIS GALEANO",                         // VD. YBYCUI/ACAHAY
  "TR1934": "MAICKOL DAVID BRITEZ MORALES",         // VD. LA COLMENA

};

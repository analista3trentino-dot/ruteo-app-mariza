// =====================================================================
//  VENDEDORES POR CARTERA
// ---------------------------------------------------------------------
//  Para cambiar el vendedor de una cartera, modificá SOLO el nombre
//  que está entre comillas, a la derecha del código.
//
//  Para dejar una cartera sin vendedor, escribí:  "CARTERA VACANTE"
//
//  Lo que escribas acá es lo que muestra la app (tiene prioridad sobre
//  el nombre que trae el Excel de ruteo del sistema).
//  Si aparece una cartera nueva en el ruteo que no está en esta lista,
//  la app usa el nombre del sistema; podés agregarla con una línea más.
//
//  Reglas para no romper nada:
//   - No borres las comillas " " ni la coma , del final de cada línea.
//   - No cambies el código de la izquierda (TR1338, TM2312, etc.).
//   - Lo que está después de // es solo una nota, no hace falta tocarlo.
// =====================================================================

const VENDEDORES = {

  // ---------- TR12 Aygas ----------
  "TR1201": "CARTERA VACANTE",                      // ST. LICITACIONES-NANAWA
  "TR1231": "ROCIO MEDINA",                         // RV. ABASTO
  "TR1232": "CARTERA VACANTE",                      // RV. MERCADO 4
  "TR1233": "RAMONA BENITEZ",                       // RV. MERCADO SAN LORENZO
  "TR1234": "YOHANA PALACIOS",                      // RV. CENTRO/MERCADO LUQUE

  // ---------- TR13 Centro ----------
  "TR1331": "KEVIN PERALTA",                        // RV. ASU-LAMBARE
  "TR1332": "MIGUEL CARRERAS",                      // RV. ASUNCION
  "TR1334": "SOFIA GONZALEZ",                       // RV. FDM
  "TR1335": "CARTERA VACANTE",                      // RV. LAMBARE - VE
  "TR1336": "SANTIAGO FERNANDEZ",                   // RV. VILLA ELISA/SAN ANTONIO
  "TR1337": "JUAN SILVANO",                         // RV. ÑEMBY
  "TR1338": "ERIKSON SAMANIEGO",                    // RV. SAN LORENZO

  // ---------- TR15 Itauguá ----------
  "TR1531": "ERIK YEGRS",                           // RV. VILLETA-GUARAMBARE
  "TR1532": "SERGIO BENITEZ",                       // RV. YPANE
  "TR1533": "CARTERA VACANTE",                      // VD. ZONAL J.A SALDIVAR
  "TR1534": "FRANCISCO LEIVA",                      // RV. ITA
  "TR1535": "CARTERA VACANTE",                      // VD. YPACARAI
  "TR1536": "MARIA ROMERO",                         // VD. ITAUGUA
  "TR1537": "RUBEN MEDINA",                         // RV. CAPIATA
  "TR1538": "CARTERA VACANTE",                      // VD. AREGUA-LUQUE

  // ---------- TR16 Caacupé ----------
  "TR1621": "LORENA MENDEZ",                        // PV. SUPER CAACUPE
  "TR1632": "TOMMY GIMENEZ",                        // VD. ZONAL CAACUPE
  "TR1633": "RUTH VERA",                            // RV. SANBER
  "TR1634": "MARIBEL REYES",                        // RV. ALTOS/ATYRA
  "TR1635": "MARIA GONZALEZ",                       // RV. TOBATI
  "TR1637": "CARTERA VACANTE",                      // RV. EUSEBIO AYALIA
  "TR1638": "CARTERA VACANTE",                      // VD. CARAGUATAY

  // ---------- TR17 Norte ----------
  "TM2312": "ELVA PALACIOS",                        // PV. LIMPIO
  "TR1731": "SANDY CARDENAS",                       // RV. MRA
  "TR1732": "KEVIN MONGES",                         // RV.  LIMPIO
  "TR1733": "CARTERA VACANTE",                      // RV. EMBOSCADA
  "TR1734": "JOSEFINA ACOSTA",                      // RV. ARROYOS ESTEROS
  "TR1735": "ALEJANDRO RAMIREZ",                    // RV. VILLA HAYES/REMAN.
  "TR1737": "INGRID CASTRO",                        // RV. BENJAMIN ACEVAL

  // ---------- TR18-19 Paraguarí ----------
  "TR1821": "LORENZO VAZQUEZ",                      // PV. SUPER PARAGUARI
  "TR1832": "CARTERA VACANTE",                      // VD. ZONAL PARAGUARI
  "TR1834": "LAURA AGÜERO",                         // RV. YAGUARON
  "TR1836": "ROSA FERREIRA",                        // RV. PIRIBEBUY
  "TR1839": "CARTERA VACANTE",                      // VD. VALENZUELA
  "TR1931": "NERY PINTOS",                          // RV. CARAPEGUA
  "TR1932": "ADAN SOSA",                            // VD. QUINDY
  "TR1933": "LUIS GALEANO",                         // VD. YBYCUI/ACAHAY
  "TR1934": "MAICKOL DAVID BRITEZ MORALES",         // VD. LA COLMENA

};

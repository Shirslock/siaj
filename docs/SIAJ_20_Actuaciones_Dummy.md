# SIAJ — 20 Actuaciones Dummy para el Prototipo

> Generado: Julio 2026 — v2 (estados y checklists corregidos)  
> Propósito: Datos de prueba para `expedientes.mock.ts` y dashboard Power BI  
> Letrados: CASANO Felix (UR_004) · DANTIOCHIA Luis (UR_007) · RIOS Mariana (UR_012) · MÉNDEZ Jorge (UR_015)  
> Coordinadores: SBARBATI Pablo (Civil) · MOLINELLI Rodrigo (Laboral) · DESIDERI Gustavo (Penal)

> **Estados del sistema:**  
> - **Estado Global:** ACTIVO | ARCHIVADO  
> - **Sub-estado:** Nombre exacto del catálogo SIAJ (ver Excel de estados)  
> - Los checklists de cada actividad corresponden a las tareas del sub-estado actual según el catálogo oficial.

---

## ACTUACIÓN 01 — P-0001/2024
**ID:** P-0001/2024  
**Tipo:** OFICIO (Penal)  
**Área:** PENAL  
**Carátula:** MINISTERIO DE SEGURIDAD S/ OFICIO — INCIDENTE LÍNEA ROCA KM 23  
**Letrado:** CASANO, Felix (UR_004)  
**Coordinador:** DESIDERI, Gustavo  
**Fecha Recepción:** 2024-03-12  
**Estado Global:** ACTIVO  
**Sub-estado:** En análisis  
**Urgente:** No  
**N° EE GDE:** EX-2024-25861-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| N° de Causa | mesa_num_causa | 25.861/2024 |
| N° de Sumario | mesa_num_sumario | SUM-2024-0312 |
| N° de IPP | mesa_num_ipp | IPP-3301/2024 |
| Carátula | mesa_caratula | MINISTERIO DE SEGURIDAD S/ INFORMES — APEDREO LÍNEA ROCA |
| Fuero | mesa_juzgado_fuero | CCC |
| Juzgado | mesa_juzgado | JUZGADO NAC. CRIM. Y CORR. 14 |
| Comisaría | mesa_comisaria | COMISARÍA 28 DE BARRACAS |
| Línea ferroviaria | mesa_linea | ROCA |
| Fecha recepción oficio | mesa_fecha_recep_of | 2024-03-10 |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Datos contacto requirente | abg_datos_contacto | Lic. Rodríguez — Tel: 011-4321-0000 |
| Fecha del hecho | abg_fecha_hecho | 2024-03-01 |
| Lugar del hecho | abg_lugar_hecho | Km 23 Línea Roca — Estación Temperley |
| Parte damnificada | abg_damnificado | SOFSA S.A. — Vagón 3421 |
| Parte imputada | abg_imputado | Desconocido |
| Tipo de hecho | abg_tipo_hecho | APEDREO CON DAÑO, DAÑO BIENES FFCC |
| Tipo de solicitud | abg_tipo_solicitud | Solicitud de información, Solicitud de filmaciones |
| N° Siniestro | abg_num_siniestro | SIN-2024-0301-ROCA |

### Timeline

**[RECEPCION] Actuación recibida y asignada**
- Fecha: 2024-03-12 · Doc GDE: EX-2024-25861-APN-DGJYA

**[MOVIMIENTO → Sub-estado: Pedido de información/filmaciones] Pedido de filmaciones a Comisaría 28**
- Fecha: 2024-03-20 · Es impulsorio: Sí · Doc GDE: NO-2024-10021-APN-DGJYA
- Descripción: Se solicitó a la Comisaría 28 de Barracas las filmaciones de cámaras del km 23 correspondientes al 01/03/2024.
- Checklist (sub-estado: Pedido de información/filmaciones/notificación — sin tareas de checklist definidas en catálogo)

**[MOVIMIENTO → Sub-estado: En análisis] Análisis de filmaciones recibidas**
- Fecha: 2024-04-05 · Es impulsorio: Sí · Doc GDE: IF-2024-12500-APN-DGJYA
- Descripción: Se recibieron las filmaciones. Se está analizando la secuencia del apedreo. Pendiente contestación al Ministerio.
- Fecha vencimiento: 2026-08-15 · Fecha aviso: 2026-07-25

### Solicitudes
- Solicitar filmaciones a Seguridad FFCC → RRHH / GARCIA, María José → completada

### Intervinientes
| Nombre | Rol | Documento |
|---|---|---|
| RODRÍGUEZ PABLO ESTEBAN | ACTOR | DNI 28.441.002 |

---

## ACTUACIÓN 02 — P-0002/2017
**ID:** P-0002/2017  
**Tipo:** QUERELLA  
**Área:** PENAL  
**Carátula:** SOFSA S.A. C/ DESCONOCIDOS S/ QUERELLA — DAÑO BIENES FFCC LÍNEA SAN MARTÍN  
**Letrado:** CASANO, Felix (UR_004)  
**Coordinador:** DESIDERI, Gustavo  
**Fecha Recepción:** 2017-08-22  
**Estado Global:** ACTIVO  
**Sub-estado:** Instrucción  
**Urgente:** No  
**N° EE GDE:** EX-2017-115031-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| Área requirente | area_requirente | GERENCIA DE OPERACIONES |
| Línea ferroviaria | linea | SAN MARTÍN |
| N° Causa / IPP | numero_causa | 115.031/2017 |
| Fuero | juzgado_fuero | FSM |
| Juzgado | juzgado | JUZGADO FEDERAL CRIM. Y CORR. DE SAN ISIDRO 1 |
| Tribunal | tribunal | TRIBUNAL ORAL CRIM. FEDERAL DE SAN MARTÍN 2 |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Carátula | abg_caratula | SOFSA S.A. C/ NN S/ DAÑO BIENES FFCC — ESTACIÓN PALERMO |
| Tipo de hecho | abg_tipo_hecho | DAÑO BIENES FFCC |
| Fecha del hecho | abg_fecha_hecho | 2017-08-10 |
| Lugar del hecho | abg_lugar_hecho | Estación Palermo — Línea San Martín |
| Estado de la causa | estado_causa | INSTRUCCIÓN |
| Próxima audiencia | fecha_prox_audiencia | 2026-09-15 |
| Imputados | imputados | NN — identificados parcialmente |
| Observaciones | observaciones | Causa en instrucción. Peritos en terreno. Audiencia oral sept 2026. |

### Timeline

**[RECEPCION] Querella recibida y asignada**
- Fecha: 2017-08-22 · Doc GDE: EX-2017-115031-APN-DGJYA

**[MOVIMIENTO → Sub-estado: Aceptado] Hito 3.1 — Se presenta como parte querellante**
- Fecha: 2017-09-14 · Doc GDE: ES-2017-50021-APN-DGJYA · Es impulsorio: Sí
- Descripción: Se presentó escrito de querella. Juzgado FSM aceptó la constitución.

**[MOVIMIENTO → Sub-estado: Instrucción] Hitos procesales — Estado: Instrucción**
- Fecha: 2026-06-11 · Fecha vencimiento: 2026-09-15 · Fecha aviso: 2026-08-15
- Descripción: Causa en etapa de instrucción. Audiencia oral fijada para 15/09/2026.
- **Hitos disponibles (sub-estado: Instrucción):**
  - [x] 5.1 Datos Imputados — completar datos + Delegada Art.196 CPPN (SI/NO) + Organismo Judicial
  - [x] 5.2 Declaración Indagatoria (SI/NO)
  - [ ] 5.3 Prueba (SI/NO) — subir documentación + fecha + organismo
  - [ ] 5.4 Conciliación (HAY ACUERDO / NO HAY ACUERDO)
  - [ ] 5.5 Reparación Integral (HAY ACUERDO / NO HAY ACUERDO)
  - [ ] 5.6 Suspensión del Juicio a Prueba / Probation (SE CONCEDE / NO SE CONCEDE)
  - [ ] 5.7 Procesamiento (SI/NO)
  - [ ] 5.8 Sobreseimiento (SI/NO) → SI + Sentencia Firme: FINALIZA CAUSA
  - [ ] 5.9 Falta de Mérito (SI/NO)
  - [ ] 5.10 Instrucción Complementaria (SI/NO)
  - [ ] 5.11 Elevación a Juicio (SI/NO) → SI + Sentencia Firme: AVANZA A JUICIO
  - [ ] 5.12 Prescripción de Acción Penal (SI/NO) → SI + Sentencia Firme: FINALIZA CAUSA
  - [ ] 5.13 Recurso de Apelación (SI/NO)
  - [ ] 5.14 Recurso de Queja (SI/NO)
  - [ ] 5.15 Recurso de Casación (SI/NO)

### Intervinientes
| Nombre | Rol | Documento |
|---|---|---|
| SOFSA S.A. | ACTOR | CUIT 30-99887766-4 |
| NN DESCONOCIDOS | DEMANDADO | — |

---

## ACTUACIÓN 03 — C-0003/2012
**ID:** C-0003/2012  
**Tipo:** DEMANDA_CIVIL  
**Área:** CIVIL  
**Carátula:** RODRIGUEZ, MARIO OSCAR C/ SOFSA SA S/ DAÑOS Y PERJUICIOS  
**Letrado:** DANTIOCHIA, Luis (UR_007)  
**Coordinador:** SBARBATI, Pablo  
**Fecha Recepción:** 2012-11-05  
**Estado Global:** ACTIVO  
**Sub-estado:** Apelación  
**Urgente:** Sí  
**N° EE GDE:** EX-2012-107030-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| N° de Causa | mesa_num_causa | 107.030/2012 |
| Fuero | mesa_juzgado_fuero | CIVIL |
| Juzgado | mesa_juzgado | JUZGADO CIVIL 54 |
| Secretaría | mesa_secretaria | ÚNICA |
| Carátula | mesa_caratula | RODRIGUEZ MARIO OSCAR C/ SOFSA SA S/ DAÑOS Y PERJUICIOS |
| Abogado de la contraria | mesa_abogado_contr | Dr. PÉREZ ANTONIO |
| Parte Actora | mesa_parte_actora | RODRIGUEZ, MARIO OSCAR |
| Parte Demandada | mesa_parte_dem | SOFSA S.A. |
| Fecha de inicio | mesa_fecha_inicio | 2012-11-05 |
| Tipo de Juicio | mesa_juicio | ACCIDENTE - ACCIÓN CIVIL |
| Monto de la demanda | mesa_monto | 4850000 |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Estado | estado_tramite | APELACIÓN |
| Fecha contestación demanda | fecha_contestacion | 2013-02-18 |
| Monto del acuerdo | monto_acuerdo | 2100000 |
| Tipo de hecho | abg_tipo_hecho | ACCIDENTE DE TRÁNSITO ADYACENTE A VÍA |
| Fecha del hecho | abg_fecha_hecho | 2012-09-20 |
| Lugar del hecho | abg_lugar_hecho | Av. Mitre 1400 — Banfield |
| Línea ferroviaria | abg_linea | ROCA |
| N° de siniestro | abg_num_siniestro | SIN-2012-09-ROCA |
| Observaciones | observaciones | Sentencia 1° instancia desfavorable $3.200.000. En apelación. |

### Timeline

**[RECEPCION] Demanda civil recibida**
- Fecha: 2012-11-05 · Doc GDE: EX-2012-107030-APN-DGJYA

**[MOVIMIENTO → Inicio] Contestación de demanda presentada**
- Fecha: 2013-02-18 · Doc GDE: ES-2013-4501-APN-DGJYA · Es impulsorio: Sí

**[MOVIMIENTO → Sentencia 1° instancia desfavorable] Sentencia 1° instancia**
- Fecha: 2025-08-10 · Doc GDE: SEN-2025-001-JC54
- Descripción: Sentencia desfavorable. Condena por $3.200.000.

**[MOVIMIENTO → Apelación] Expresión de agravios ante Cámara Civil**
- Fecha: 2026-05-10 · Doc GDE: ES-2026-30011-APN-DGJYA · Es impulsorio: Sí
- Descripción: Se presentaron los agravios contra la sentencia de primera instancia.
- Fecha vencimiento: 2026-09-30 · Fecha aviso: 2026-08-30
- **Checklist de tareas (sub-estado: Apelación):**
  - [x] Notificación de la Cámara para expresar agravios
  - [x] Redacción de recurso
  - [ ] Registro de apelantes
  - [ ] Contestación de agravios (si corresponde)
  - [ ] Presentación en sistema judicial y subir sentencia de primera instancia

**[REPLY en Expresión de agravios]**
- Autor: CASANO, Felix · Fecha: 2026-06-01
- Texto: Confirmar fecha de audiencia de conciliación en Cámara. Pendiente de fijación.
- Fecha vencimiento: 2026-09-30 · Fecha aviso: 2026-08-30

### Intervinientes
| Nombre | Rol | Documento | Letrado patrocinante |
|---|---|---|---|
| RODRIGUEZ, MARIO OSCAR | ACTOR | DNI 23.456.789 | Dr. PÉREZ ANTONIO |
| SOFSA S.A. | DEMANDADO | CUIT 30-99887766-4 | DANTIOCHIA, Luis |

---

## ACTUACIÓN 04 — C-0004/2019
**ID:** C-0004/2019  
**Tipo:** DEMANDA_CIVIL  
**Área:** CIVIL  
**Carátula:** FERNANDEZ, CLAUDIA BEATRIZ C/ SOFSA SA S/ COBRO DE SUMAS DE DINERO  
**Letrado:** RIOS, Mariana (UR_012)  
**Coordinador:** SBARBATI, Pablo  
**Fecha Recepción:** 2019-06-14  
**Estado Global:** ACTIVO  
**Sub-estado:** Inicio  
**Urgente:** No  
**N° EE GDE:** EX-2019-92962-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| N° de Causa | mesa_num_causa | 92.962/2019 |
| Fuero | mesa_juzgado_fuero | CIVIL |
| Juzgado | mesa_juzgado | JUZGADO CIVIL 71 |
| Secretaría | mesa_secretaria | ÚNICA |
| Carátula | mesa_caratula | FERNANDEZ CLAUDIA B. C/ SOFSA SA S/ COBRO SUMAS DINERO |
| Abogado de la contraria | mesa_abogado_contr | Dra. SUÁREZ CAROLINA |
| Parte Actora | mesa_parte_actora | FERNANDEZ, CLAUDIA BEATRIZ |
| Parte Demandada | mesa_parte_dem | SOFSA S.A. |
| Fecha de inicio | mesa_fecha_inicio | 2019-06-14 |
| Tipo de Juicio | mesa_juicio | COBRO DE SUMAS DE DINERO |
| Monto de la demanda | mesa_monto | 1200000 |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Estado | estado_tramite | EN TRAMITACIÓN |
| Fecha contestación demanda | fecha_contestacion | 2019-09-20 |
| Tipo de hecho | abg_tipo_hecho | FALLA EN SERVICIO — CAÍDA EN ANDÉN |
| Fecha del hecho | abg_fecha_hecho | 2019-05-30 |
| Lugar del hecho | abg_lugar_hecho | Estación Once — Andén 4 |
| Línea ferroviaria | abg_linea | SARMIENTO |
| N° de siniestro | abg_num_siniestro | SIN-2019-05-SAR |

### Timeline

**[RECEPCION] Demanda civil recibida**
- Fecha: 2019-06-14 · Doc GDE: EX-2019-92962-APN-DGJYA

**[MOVIMIENTO → Inicio] Contestación de demanda presentada**
- Fecha: 2019-09-20 · Doc GDE: ES-2019-88012-APN-DGJYA · Es impulsorio: Sí
- Descripción: Se negaron los hechos. Se ofreció prueba pericial médica.
- Fecha vencimiento: 2026-08-20 · Fecha aviso: 2026-07-20
- **Checklist de tareas (sub-estado: Inicio):**
  - [x] Análisis inicial de la demanda y notificación. Registrar operador a la fecha del hecho.
  - [x] Verificar el proveído de traslado de demanda (firmado por el juez)
  - [x] Interposición de revocatoria con apelación en subsidio. Verificación ley 24.344 (si corresponde)
  - [x] Interposición de nulidad de la notificación (si corresponde)
  - [x] Interposición de caducidad (si corresponde)
  - [x] Definición de plazo para contestar demanda
  - [x] Generación de tarea: contestación de demanda (AGENDAR)
  - [ ] Redacción de defensa de fondo (buscar antecedentes, vinculaciones con otros expedientes)
  - [ ] Planteo de excepciones (si corresponde)
  - [ ] Oposiciones
  - [ ] Planteo de prorrateo
  - [ ] Requerir citación de terceros — SI/NO — Registrar
  - [ ] Ofrecimiento de prueba: Documental / Testimonial / Pericial / Informativa
  - [ ] Presentación en sistema judicial y subir escrito presentado

### Intervinientes
| Nombre | Rol | Documento |
|---|---|---|
| FERNANDEZ, CLAUDIA BEATRIZ | ACTOR | DNI 31.220.445 |
| SOFSA S.A. | DEMANDADO | CUIT 30-99887766-4 |

---

## ACTUACIÓN 05 — L-0005/2013
**ID:** L-0005/2013  
**Tipo:** DEMANDA_LABORAL  
**Área:** LABORAL  
**Carátula:** GOMEZ, CARLOS ALBERTO C/ SOFSA SA S/ DESPIDO  
**Letrado:** RIOS, Mariana (UR_012)  
**Coordinador:** MOLINELLI, Rodrigo  
**Fecha Recepción:** 2013-09-30  
**Estado Global:** ACTIVO  
**Sub-estado:** Prueba  
**Urgente:** No  
**N° EE GDE:** EX-2013-89251-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| N° de Causa | mesa_num_causa | 89.251/2013 |
| Fuero | mesa_juzgado_fuero | LABORAL |
| Juzgado | mesa_juzgado | JUZGADO DEL TRABAJO 12 |
| Secretaría | mesa_secretaria | ÚNICA |
| Carátula | mesa_caratula | GOMEZ CARLOS A. C/ SOFSA SA S/ DESPIDO |
| Abogado de la contraria | mesa_abogado_contr | Dr. VILLA ROBERTO |
| Parte Actora | mesa_parte_actora | GOMEZ, CARLOS ALBERTO |
| Parte Demandada | mesa_parte_dem | SOFSA S.A. |
| Fecha de inicio | mesa_fecha_inicio | 2013-09-30 |
| Tipo de Juicio | mesa_juicio | DESPIDO |
| Monto de la demanda | mesa_monto | 2340000 |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Estado | estado_tramite | EN TRAMITACIÓN |
| Tope convenio | tope_convenio | NO |
| Fecha contestación demanda | fecha_contestacion | 2014-01-15 |
| Monto del acuerdo | monto_acuerdo | 890000 |
| Tipo de hecho | abg_tipo_hecho | DESPIDO SIN CAUSA JUSTIFICADA |
| Fecha del hecho | abg_fecha_hecho | 2013-08-15 |
| Lugar del hecho | abg_lugar_hecho | Talleres Línea Roca — Gerencia RRHH |
| Línea ferroviaria | abg_linea | ROCA |

### Timeline

**[RECEPCION] Demanda laboral recibida**
- Fecha: 2013-09-30 · Doc GDE: EX-2013-89251-APN-DGJYA

**[MOVIMIENTO → Inicio] Contestación de demanda**
- Fecha: 2014-01-15 · Es impulsorio: Sí

**[MOVIMIENTO → Traba de litis] Traba de litis — proveído**
- Fecha: 2014-06-20 · Es impulsorio: Sí

**[MOVIMIENTO → Prueba] Etapa probatoria — pericia contable**
- Fecha: 2026-03-20 · Doc GDE: IF-2026-40011-APN-DGJYA · Es impulsorio: Sí
- Descripción: Perito contador de oficio designado. Puntos de pericia presentados.
- Fecha vencimiento: 2026-08-31 · Fecha aviso: 2026-07-31
- **Checklist de tareas (sub-estado: Prueba):**
  - [x] Redacción de oficios
  - [x] Seguimiento de libramiento — control de respuestas
  - [x] Reiteración de oficios no contestados o incorrectos
  - [x] Control de designación de perito
  - [ ] Aceptación de cargo
  - [ ] Fecha de pericias — pasar a consultores
  - [ ] Control de presentación de pericia — Impugnar SI/NO
  - [ ] Impugnación de pericia
  - [ ] Contestar aclaraciones de peritos
  - [ ] Traslado de la impugnación
  - [ ] Control de audiencias — fechas
  - [ ] Notificar a Recursos Humanos (si son nuestros testigos)
  - [ ] Notificación de testigos
  - [ ] Preparación de interrogatorio
  - [ ] Cédula de citación a la parte actora

### Intervinientes
| Nombre | Rol | Documento |
|---|---|---|
| GOMEZ, CARLOS ALBERTO | ACTOR | DNI 17.892.334 |
| SOFSA S.A. | DEMANDADO | CUIT 30-99887766-4 |

---

## ACTUACIÓN 06 — C-0006/2018
**ID:** C-0006/2018  
**Tipo:** DEMANDA_CIVIL  
**Área:** CIVIL  
**Carátula:** MARTINEZ, ANA PAULA C/ SOFSA SA S/ DAÑOS Y PERJUICIOS  
**Letrado:** DANTIOCHIA, Luis (UR_007)  
**Coordinador:** SBARBATI, Pablo  
**Fecha Recepción:** 2018-04-18  
**Estado Global:** ACTIVO  
**Sub-estado:** Prueba  
**Urgente:** No  
**N° EE GDE:** EX-2018-79235-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| N° de Causa | mesa_num_causa | 79.235/2018 |
| Fuero | mesa_juzgado_fuero | CIVIL |
| Juzgado | mesa_juzgado | JUZGADO CIVIL 23 |
| Secretaría | mesa_secretaria | ÚNICA |
| Carátula | mesa_caratula | MARTINEZ ANA PAULA C/ SOFSA SA S/ DAÑOS Y PERJUICIOS |
| Abogado de la contraria | mesa_abogado_contr | Dr. TORRES MIGUEL |
| Parte Actora | mesa_parte_actora | MARTINEZ, ANA PAULA |
| Parte Demandada | mesa_parte_dem | SOFSA S.A. |
| Fecha de inicio | mesa_fecha_inicio | 2018-04-18 |
| Tipo de Juicio | mesa_juicio | DAÑOS Y PERJUICIOS |
| Monto de la demanda | mesa_monto | 890000 |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Estado | estado_tramite | EN TRAMITACIÓN |
| Fecha contestación demanda | fecha_contestacion | 2018-07-22 |
| Tipo de hecho | abg_tipo_hecho | LESIONES EN BAJADA DEL TREN |
| Fecha del hecho | abg_fecha_hecho | 2018-03-05 |
| Lugar del hecho | abg_lugar_hecho | Estación Quilmes — Puerta delantera vagón 2 |
| Línea ferroviaria | abg_linea | ROCA |
| N° de siniestro | abg_num_siniestro | SIN-2018-03-ROCA |

### Timeline

**[RECEPCION] Demanda civil recibida**
- Fecha: 2018-04-18 · Doc GDE: EX-2018-79235-APN-DGJYA

**[MOVIMIENTO → Inicio] Contestación de demanda**
- Fecha: 2018-07-22 · Es impulsorio: Sí

**[MOVIMIENTO → Prueba] Pericia médica — lesión tobillo**
- Fecha: 2026-05-20 · Es impulsorio: Sí
- Descripción: Perito médico designado. Fecha de revisación: 10/07/2026.
- Fecha vencimiento: 2026-08-30 · Fecha aviso: 2026-07-30
- **Checklist de tareas (sub-estado: Prueba):**
  - [x] Redacción de oficios
  - [x] Seguimiento de libramiento — control de respuestas
  - [x] Reiteración de oficios no contestados o contestados incorrectamente
  - [ ] Control de designación de perito
  - [ ] Aceptación de cargo
  - [ ] Fecha de pericias — pasar fecha a los consultores
  - [ ] Control de presentación de pericia — impugnar SI/NO
  - [ ] Impugnación de pericia
  - [ ] Traslado de la impugnación
  - [ ] Control de audiencias — fechas
  - [ ] Notificar a Recursos Humanos (si son nuestros testigos)
  - [ ] Notificación de testigos
  - [ ] Preparación de interrogatorio
  - [ ] Cédula de citación a la parte actora

### Intervinientes
| Nombre | Rol | Documento |
|---|---|---|
| MARTINEZ, ANA PAULA | ACTOR | DNI 35.112.009 |
| DR. GARCIA HERNÁN | PERITO | CUIT 20-12345678-3 |

---

## ACTUACIÓN 07 — L-0007/2015
**ID:** L-0007/2015  
**Tipo:** DEMANDA_LABORAL  
**Área:** LABORAL  
**Carátula:** PEREYRA, JUAN MANUEL C/ SOFSA SA S/ ACCIDENTE DE TRABAJO  
**Letrado:** RIOS, Mariana (UR_012)  
**Coordinador:** MOLINELLI, Rodrigo  
**Fecha Recepción:** 2015-02-03  
**Estado Global:** ACTIVO  
**Sub-estado:** Ejecución de sentencia  
**Urgente:** Sí  
**N° EE GDE:** EX-2015-65730-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| N° de Causa | mesa_num_causa | 65.730/2015 |
| Fuero | mesa_juzgado_fuero | LABORAL |
| Juzgado | mesa_juzgado | JUZGADO DEL TRABAJO 8 |
| Secretaría | mesa_secretaria | ÚNICA |
| Carátula | mesa_caratula | PEREYRA JUAN M. C/ SOFSA SA S/ ACCIDENTE TRABAJO |
| Abogado de la contraria | mesa_abogado_contr | Dra. MÉNDEZ PATRICIA |
| Parte Actora | mesa_parte_actora | PEREYRA, JUAN MANUEL |
| Parte Demandada | mesa_parte_dem | SOFSA S.A. |
| Codemandados | mesa_codemandados | ART FERROVIARIA S.A. |
| Fecha de inicio | mesa_fecha_inicio | 2015-02-03 |
| Tipo de Juicio | mesa_juicio | ACCIDENTE DE TRABAJO |
| Monto de la demanda | mesa_monto | 3100000 |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Estado | estado_tramite | FIRME |
| Tope convenio | tope_convenio | SI |
| Fecha contestación demanda | fecha_contestacion | 2015-05-18 |
| Monto del acuerdo | monto_acuerdo | 1850000 |
| Tipo de hecho | abg_tipo_hecho | ACCIDENTE EN VÍAS — FRACTURA |
| Fecha del hecho | abg_fecha_hecho | 2015-01-12 |
| Lugar del hecho | abg_lugar_hecho | Km 18 Línea Roca — entre Temperley y Llavallol |
| Línea ferroviaria | abg_linea | ROCA |

### Timeline

**[RECEPCION] Demanda laboral recibida**
- Fecha: 2015-02-03 · Doc GDE: EX-2015-65730-APN-DGJYA

**[MOVIMIENTO → Sentencia 1° instancia desfavorable] Sentencia condenatoria**
- Fecha: 2023-04-10 · Monto condena: $1.850.000

**[MOVIMIENTO → Ejecución de sentencia] Liquidación presentada**
- Fecha: 2026-05-28 · Doc GDE: ES-2026-40011-APN-DGJYA · Es impulsorio: Sí
- Descripción: Liquidación definitiva presentada ante Juzgado del Trabajo 8.
- Fecha vencimiento: 2026-09-30 · Fecha aviso: 2026-08-30
- **Checklist de tareas (sub-estado: Ejecución de sentencia):**
  - [x] Liquidación
  - [x] Presentación de liquidación
  - [ ] Control de traslado de liquidación
  - [ ] Contestación de impugnación si corresponde
  - [ ] Pedido de aprobación de liquidación
  - [ ] Intimación de pago
  - [ ] Pedido de embargo si corresponde
  - [ ] Seguimiento de embargo
  - [ ] Control de transferencia / depósito judicial
  - [ ] Pedido de libramiento de fondos
  - [ ] Registro de cobro efectivo

### Solicitudes
- Solicitar reserva presupuestaria para pago → COMERCIAL / MOLINA, Diego → en_curso

### Intervinientes
| Nombre | Rol | Documento |
|---|---|---|
| PEREYRA, JUAN MANUEL | ACTOR | DNI 29.003.118 |
| ART FERROVIARIA S.A. | TERCERO | CUIT 30-71002233-5 |

---

## ACTUACIÓN 08 — C-0008/2022
**ID:** C-0008/2022  
**Tipo:** DEFENSA_CIVIL  
**Área:** CIVIL  
**Carátula:** ESTADO NACIONAL C/ SOFSA SA S/ AMPARO — ACCESIBILIDAD ESTACIONES  
**Letrado:** CASANO, Felix (UR_004)  
**Coordinador:** SBARBATI, Pablo  
**Fecha Recepción:** 2022-07-19  
**Estado Global:** ACTIVO  
**Sub-estado:** Asume representación  
**Urgente:** No  
**N° EE GDE:** EX-2022-16579-APN-DGJYA

> ⚠ Sub-estado corregido: DEFENSA_CIVIL no tiene estado "Inicio". Sub-estados válidos: Asignado → En análisis → Asume representación → No asume representación.

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| N° de Causa | numero_causa | 16.579/2022 |
| Fuero | juzgado_fuero | CCF |
| Juzgado | juzgado | JUZGADO CIVIL Y COMERCIAL FEDERAL 3 |
| Carátula | mesa_caratula | ESTADO NACIONAL C/ SOFSA SA S/ AMPARO |
| Datos de los dependientes | mesa_datos_dependientes | Secretaría de Obras Públicas — Ente Nacional de Transporte |
| Tipo de Juicio | tipo_juicio | AMPARO |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Estado | estado_tramite | EN TRÁMITE |
| Fecha contestación demanda | fecha_contestacion | 2022-10-05 |
| Tipo de hecho | abg_tipo_hecho | INCUMPLIMIENTO NORMATIVA ACCESIBILIDAD |
| Lugar del hecho | abg_lugar_hecho | Estaciones líneas RG y San Martín |
| Línea ferroviaria | abg_linea | SAN MARTÍN |
| Observaciones | observaciones | Amparo colectivo. Contestación presentada con Plan de Obras. Audiencia 05/10/2026. |

### Timeline

**[RECEPCION] Amparo recibido y asignado**
- Fecha: 2022-07-19 · Doc GDE: EX-2022-16579-APN-DGJYA

**[MOVIMIENTO → En análisis] Análisis del amparo**
- Fecha: 2022-08-10 · Es impulsorio: No
- Descripción: Se analizó legitimación activa del Estado Nacional. Se elaboró estrategia de defensa.

**[MOVIMIENTO → Asume representación] SOFSA asume defensa — Contestación presentada**
- Fecha: 2022-10-05 · Doc GDE: ES-2022-60021-APN-DGJYA · Es impulsorio: Sí
- Descripción: Se presentó contestación adjuntando Plan de Accesibilidad 2023-2025.
- Fecha vencimiento: 2026-10-05 · Fecha aviso: 2026-09-05
- **Nota:** Sub-estado "Asume representación" no tiene checklist de tareas definido en el catálogo. Las tareas son libres según el letrado.
- Checklist libre:
  - [x] Preparar informe de avance de obras
  - [ ] Presentar documentación de licitación
  - [ ] Asistir a audiencia 05/10/2026

### Intervinientes
| Nombre | Rol | Documento |
|---|---|---|
| ESTADO NACIONAL | ACTOR | CUIT 30-60001EM-4 |
| SOFSA S.A. | DEMANDADO | CUIT 30-99887766-4 |

---

## ACTUACIÓN 09 — C-0009/2013
**ID:** C-0009/2013  
**Tipo:** COBRO_CANON  
**Área:** CIVIL  
**Carátula:** SOFSA SA C/ PERMISIONARIO KIOSCO ANDÉN — COBRO CÁNONES ADEUDADOS  
**Letrado:** DANTIOCHIA, Luis (UR_007)  
**Coordinador:** SBARBATI, Pablo  
**Fecha Recepción:** 2013-01-28  
**Estado Global:** ACTIVO  
**Sub-estado:** Acuerdo extrajudicial  
**Urgente:** No  
**N° EE GDE:** EX-2013-1694-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| Permisionario | permisionario | COMERCIOS ANDÉN S.R.L. |
| Referencia contrato / N° PPU | ref_contrato_ppu | PPU-2009-00144 |
| Área requirente | area_requirente | COMERCIAL |
| Fecha del requerimiento | fecha_requerimiento | 2013-01-10 |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Período adeudado | periodo_adeudado | Enero 2012 — Diciembre 2013 |
| Monto informado | monto_informado | 180000 |
| Monto actualizado | monto_actualizado | 285000 |
| Garante | garante | SIN GARANTE |
| Inicio prescripción | inicio_prescripcion | 2012-01-01 |

### Timeline

**[RECEPCION] Cobro de cánones recibido**
- Fecha: 2013-01-28 · Doc GDE: EX-2013-1694-APN-DGJYA

**[MOVIMIENTO → Asignado] Análisis de antecedentes — tareas completadas**
- Fecha: 2013-02-15 · Es impulsorio: Sí
- Checklist completado (sub-estado Asignado — 9 tareas del catálogo, todas cumplidas):
  - [x] Recepción del reclamo interno / Fecha de prescripción
  - [x] Análisis de antecedentes contractuales
  - [x] Verificar períodos adeudados
  - [x] Verificar períodos prescriptos
  - [x] Solicitar a Administración certificado de deuda actualizado
  - [x] Verificar documentación respaldatoria
  - [x] Solicitar antecedentes internos si faltan
  - [x] Analizar viabilidad de cobro
  - [x] Definir estrategia: Acuerdo extrajudicial / Devuelto al sector / Inicio de juicio

**[MOVIMIENTO → En análisis] CD intimación de pago enviada**
- Fecha: 2013-03-15 · Doc GDE: CD-2013-00221-APN-DGJYA · Es impulsorio: Sí

**[MOVIMIENTO → Acuerdo extrajudicial] Propuesta de acuerdo en negociación**
- Fecha: 2026-04-20 · Es impulsorio: Sí
- Descripción: COMERCIOS ANDÉN propone pago en 6 cuotas de $47.500. Pendiente conformidad de Comercial.
- Fecha vencimiento: 2026-10-20 · Fecha aviso: 2026-09-20
- **Checklist de tareas (sub-estado: Acuerdo extrajudicial):**
  - [x] Verificar monto actualizado de deuda
  - [x] Analizar viabilidad del acuerdo
  - [ ] Solicitar conformidades internas (si corresponden)
  - [ ] Redacción de borrador de acuerdo
  - [ ] Solicitar cuenta bancaria y notificar a Administración
  - [ ] Revisión interna del acuerdo
  - [ ] Remisión para firma
  - [ ] Registrar acuerdo firmado
  - [ ] Registrar monto del acuerdo
  - [ ] Controlar cumplimiento del acuerdo
  - [ ] Informar a Administración el pago del acuerdo
  - [ ] Registrar incumplimiento (si ocurre)
  - [ ] Definir nueva estrategia: continuar / iniciar juicio / reactivar gestión

### Solicitudes
- Conformidad Comercial para acuerdo → COMERCIAL / FERNÁNDEZ, Laura → pendiente

### Intervinientes
| Nombre | Rol | Documento |
|---|---|---|
| COMERCIOS ANDÉN S.R.L. | DEMANDADO | CUIT 30-55443322-1 |
| SOFSA S.A. | ACTOR | CUIT 30-99887766-4 |

---

## ACTUACIÓN 10 — C-0010/2022
**ID:** C-0010/2022  
**Tipo:** DEFENSA_CIVIL  
**Área:** CIVIL  
**Carátula:** ASOCIACIÓN USUARIOS TREN C/ SOFSA SA S/ AMPARO — REGULARIDAD DEL SERVICIO  
**Letrado:** CASANO, Felix (UR_004)  
**Coordinador:** SBARBATI, Pablo  
**Fecha Recepción:** 2022-09-01  
**Estado Global:** ACTIVO  
**Sub-estado:** En análisis  
**Urgente:** No  
**N° EE GDE:** EX-2022-57631-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| N° de Causa | numero_causa | 57.631/2022 |
| Fuero | juzgado_fuero | CAF |
| Juzgado | juzgado | JUZGADO CONTENCIOSO ADMINISTRATIVO FEDERAL 5 |
| Carátula | mesa_caratula | ASOCIACIÓN USUARIOS TREN C/ SOFSA SA S/ AMPARO |
| Datos de los dependientes | mesa_datos_dependientes | Ministerio de Transporte de la Nación |
| Tipo de Juicio | tipo_juicio | AMPARO |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Estado | estado_tramite | EN TRÁMITE |
| Fecha contestación demanda | fecha_contestacion | 2022-12-01 |
| Tipo de hecho | abg_tipo_hecho | IRREGULARIDAD EN FRECUENCIA DE SERVICIO |
| Observaciones | observaciones | Análisis de viabilidad en curso. Coordinador: SBARBATI, Pablo. |

### Timeline

**[RECEPCION] Amparo recibido**
- Fecha: 2022-09-01 · Doc GDE: EX-2022-57631-APN-DGJYA

**[MOVIMIENTO → En análisis] Análisis de legitimación activa**
- Fecha: 2022-10-15 · Es impulsorio: No
- Descripción: Se está analizando la legitimación activa de la Asociación y viabilidad de la defensa.
- Fecha vencimiento: 2026-12-01 · Fecha aviso: 2026-11-01
- **Nota:** Sub-estado "En análisis" en Defensas Civiles no tiene checklist de tareas predefinido en el catálogo. Las tareas son libres.
- Checklist libre:
  - [x] Analizar legitimación activa de la Asociación
  - [x] Relevar estadísticas de puntualidad 2022
  - [ ] Definir estrategia de defensa
  - [ ] Redactar contestación de amparo

### Intervinientes
| Nombre | Rol | Documento |
|---|---|---|
| ASOCIACIÓN USUARIOS TREN | ACTOR | CUIT 30-70112233-9 |
| SOFSA S.A. | DEMANDADO | CUIT 30-99887766-4 |

---

## ACTUACIÓN 11 — C-0011/2024
**ID:** C-0011/2024  
**Tipo:** OFICIO (Civil/Laboral)  
**Área:** CIVIL  
**Carátula:** JUZGADO CIVIL 30 S/ OFICIO — INFORMES SOBRE INMUEBLE LÍNEA ROCA  
**Letrado:** DANTIOCHIA, Luis (UR_007)  
**Coordinador:** SBARBATI, Pablo  
**Fecha Recepción:** 2024-05-10  
**Estado Global:** ACTIVO  
**Sub-estado:** Asignado  
**Urgente:** No  
**N° EE GDE:** EX-2024-OFC-001-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| N° de Causa | mesa_num_causa | 44.821/2024 |
| Fuero | mesa_juzgado_fuero | CIVIL |
| Juzgado | mesa_juzgado | JUZGADO CIVIL 30 |
| Secretaría | mesa_secretaria | ÚNICA |
| Organismo | mesa_organismo | JUZGADO CIVIL 30 — SEC. ÚNICA |
| Carátula | mesa_caratula | GÓMEZ C/ MUNICIPALIDAD S/ EXPROPIACIÓN |
| Fecha recepción oficio | mesa_fecha_recep_of | 2024-05-08 |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Carácter | abg_caracter | Informativo |
| Objeto del requerimiento | abg_objeto_req | Informe sobre titularidad y uso del inmueble ubicado en Av. Roca 1240 vinculado a vías ferroviarias. |
| Área informante | abg_area_informante | Gerencia de Patrimonio |
| Fecha de contestación | abg_fecha_contestacion | 2024-06-30 |

### Timeline

**[RECEPCION] Oficio civil recibido**
- Fecha: 2024-05-10 · Doc GDE: EX-2024-OFC-001-APN-DGJYA

**[MOVIMIENTO → Pedido de información] Pedido de informe a Patrimonio**
- Fecha: 2024-05-20 · Es impulsorio: Sí
- Descripción: Se solicitó a Gerencia de Patrimonio el informe sobre el inmueble.
- Fecha vencimiento: 2026-07-10 · Fecha aviso: 2026-07-03
- Checklist libre (Oficios no tiene checklist de catálogo):
  - [x] Solicitar informe a Gerencia de Patrimonio
  - [ ] Recibir y revisar informe
  - [ ] Redactar respuesta al Juzgado
  - [ ] Presentar respuesta dentro del plazo

---

## ACTUACIÓN 12 — C-0012/2023
**ID:** C-0012/2023  
**Tipo:** CARTA_DOC  
**Área:** CIVIL  
**Carátula:** CARTA DOCUMENTO — RECLAMO DAÑOS PROPIEDAD LINDANTE VÍA LÍNEA BELGRANO  
**Letrado:** MÉNDEZ, Jorge (UR_015)  
**Coordinador:** SBARBATI, Pablo  
**Fecha Recepción:** 2023-08-14  
**Estado Global:** ACTIVO  
**Sub-estado:** Asignado  
**Urgente:** No  
**N° EE GDE:** EX-2023-CD-015-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| N° de Carta Documento | numero_carta | CD-2023-8811 |
| Remitente | remitente | VILLANUEVA, ROBERTO OSCAR |
| Fecha de la Carta | fecha_carta | 2023-08-10 |
| Documental | documental | Completo |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Monto reclamado | abg_monto_reclam | 450000 |
| Objeto | abg_objeto | Daños en propiedad en calle Perón 2240 lindante a vías del FC Belgrano por vibraciones de trenes de carga. |
| Requiere respuesta | abg_requiere_resp | Sí |
| Área informante | abg_area_informante | Gerencia de Infraestructura |
| Vinculación con contrato | abg_vinculacion | Sin vinculación contractual. Propietario particular. |
| Fecha de respuesta | abg_fecha_resp | 2023-10-15 |

### Timeline

**[RECEPCION] Carta documento recibida**
- Fecha: 2023-08-14 · Doc GDE: EX-2023-CD-015-APN-DGJYA

**[MOVIMIENTO → Pedido de información] Solicitud de informe a Infraestructura**
- Fecha: 2023-08-25 · Es impulsorio: Sí
- Fecha vencimiento: 2026-10-15 · Fecha aviso: 2026-09-15
- Checklist libre (Carta Documento no tiene checklist de catálogo):
  - [x] Solicitar informe técnico a Infraestructura
  - [x] Recibir informe de medición de vibraciones
  - [ ] Redactar respuesta rechazando responsabilidad
  - [ ] Enviar respuesta al remitente

---

## ACTUACIÓN 13 — L-0013/2024
**ID:** L-0013/2024  
**Tipo:** MEDIACION  
**Área:** LABORAL  
**Carátula:** MEDIACIÓN — RECLAMO LABORAL SOTO C/ SOFSA SA — DIFERENCIAS SALARIALES  
**Letrado:** RIOS, Mariana (UR_012)  
**Coordinador:** MOLINELLI, Rodrigo  
**Fecha Recepción:** 2024-02-20  
**Estado Global:** ARCHIVADO  
**Sub-estado:** Cumplido (no acuerdo)  
**Urgente:** No  
**N° EE GDE:** EX-2024-MED-003-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| Tipo de mediación | mesa_tipo_mediacion | Privada |
| Requirente | mesa_requirente | SOTO, MARCELA ALEJANDRA |
| Requerido | mesa_requerido | SOFSA S.A. |
| Mediador / Organismo | mesa_mediador | Dra. GIMÉNEZ, Claudia — Centro Mediación Palermo |
| Fecha de audiencia | mesa_fecha_audiencia | 2024-03-25 |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Resultado | resultado | FRACASÓ |
| Objeto del reclamo | abg_objeto_reclamo | Diferencias salariales por categoría incorrecta durante 18 meses. |
| Monto reclamado | abg_monto_reclamado | 320000 |
| Fecha de cierre | abg_fecha_cierre | 2024-03-25 |
| Requiere asistencia | abg_requiere_asistencia | No |
| Observaciones | observaciones | Mediación fracasada. Requirente presentó demanda laboral. |

### Timeline

**[RECEPCION] Mediación laboral recibida**
- Fecha: 2024-02-20 · Doc GDE: EX-2024-MED-003-APN-DGJYA

**[MOVIMIENTO → Asignado] Análisis previo a la audiencia**
- Fecha: 2024-03-01 · Es impulsorio: No
- Checklist libre:
  - [x] Solicitar información a RRHH sobre categoría del empleado
  - [x] Analizar diferencias salariales reclamadas
  - [x] Definir posición de SOFSA para la audiencia

**[MOVIMIENTO → Cumplido (no acuerdo)] Audiencia de mediación — fracasada**
- Fecha: 2024-03-25 · Doc GDE: AC-2024-00332-APN-DGJYA · Es impulsorio: Sí
- Descripción: Las partes no llegaron a acuerdo. Requirente presentará demanda laboral.

### Intervinientes
| Nombre | Rol | Documento |
|---|---|---|
| SOTO, MARCELA ALEJANDRA | ACTOR | DNI 27.334.110 |
| SOFSA S.A. | DEMANDADO | CUIT 30-99887766-4 |

---

## ACTUACIÓN 14 — L-0014/2023
**ID:** L-0014/2023  
**Tipo:** SECLO  
**Área:** LABORAL  
**Carátula:** SECLO — RECLAMO LABORAL VARGAS C/ SOFSA SA — ACCIDENTE  
**Letrado:** RIOS, Mariana (UR_012)  
**Coordinador:** MOLINELLI, Rodrigo  
**Fecha Recepción:** 2023-11-08  
**Estado Global:** ACTIVO  
**Sub-estado:** Asignado  
**Urgente:** No  
**N° EE GDE:** EX-2023-SEC-008-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| Requirente | mesa_requirente | VARGAS, PEDRO DAMIÁN |
| CUIL Requirente | mesa_cuil_requirente | 20-30441122-5 |
| Requerido | mesa_requerido | SOFSA S.A. |
| Objeto del reclamo | mesa_objeto_reclamo | Accidente de trabajo sufrido el 15/09/2023 en mantenimiento de material rodante. Lesión lumbar. |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Monto reclamado | abg_monto_reclamado | 1100000 |
| Requiere asistencia | abg_requiere_asistencia | Sí |

### Timeline

**[RECEPCION] SECLO recibido**
- Fecha: 2023-11-08 · Doc GDE: EX-2023-SEC-008-APN-DGJYA

**[MOVIMIENTO → Asignado] Preparación para audiencia SECLO**
- Fecha: 2023-11-20 · Es impulsorio: No
- Descripción: Se coordinó con RRHH el informe del accidente. Audiencia fijada en sede Morón.
- Fecha vencimiento: 2026-08-15 · Fecha aviso: 2026-07-25
- Checklist libre (SECLO — Asignado no tiene checklist de catálogo):
  - [x] Coordinar con RRHH datos del accidente
  - [ ] Evaluar propuesta de acuerdo
  - [ ] Asistir a audiencia SECLO sede Morón

### Solicitudes
- Informe accidente de trabajo Vargas → RRHH / TORRES, Roberto → en_curso

---

## ACTUACIÓN 15 — C-0015/2022
**ID:** C-0015/2022  
**Tipo:** LANZAMIENTO  
**Área:** CIVIL  
**Carátula:** LANZAMIENTO — OCUPANTES ILEGALES INMUEBLE LÍNEA SAN MARTÍN — PALERMO  
**Letrado:** DANTIOCHIA, Luis (UR_007)  
**Coordinador:** SBARBATI, Pablo  
**Fecha Recepción:** 2022-04-11  
**Estado Global:** ACTIVO  
**Sub-estado:** Juicio iniciado  
**Urgente:** Sí  
**N° EE GDE:** EX-2022-LAN-002-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| N° Memo | numero_memo | MEMO-2022-0041 |
| Área requirente | area_requirente | Gerencia de Infraestructura |
| Fecha del requerimiento | fecha_requerimiento | 2022-04-05 |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Línea ferroviaria | abg_linea | SAN MARTÍN |
| Lugar / Estación / Km | abg_lugar_estacion_km | Palermo — km 3.5 — lateral norte de vías |
| Notificación al ocupante | abg_notificacion_ocupante | 2022-05-20 |
| Documental | abg_documental | Completo |

### Timeline

**[RECEPCION] Lanzamiento recibido**
- Fecha: 2022-04-11 · Doc GDE: EX-2022-LAN-002-APN-DGJYA

**[MOVIMIENTO → Asignado] Análisis previo — todas las tareas del catálogo completadas**
- Fecha: 2022-04-20 · Es impulsorio: No
- Checklist completado (sub-estado Asignado):
  - [x] Análisis de antecedentes del inmueble — jurisdicción
  - [x] Verificar fecha de notificación e intimación
  - [x] Identificar intrusos / permisionarios
  - [x] Verificar documentación respaldatoria
  - [x] Solicitar antecedentes internos faltantes
  - [x] Evaluar posibilidad de lanzamiento
  - [x] Definir estrategia: Acuerdo extrajudicial / Devuelto al sector / Inicio de juicio

**[MOVIMIENTO → En análisis] Intimación a ocupantes**
- Fecha: 2022-05-20 · Doc GDE: CD-2022-00551-APN-DGJYA · Es impulsorio: Sí

**[MOVIMIENTO → Juicio iniciado] Demanda de desalojo presentada**
- Fecha: 2022-07-10 · Doc GDE: ES-2022-80012-APN-DGJYA · Es impulsorio: Sí
- Descripción: Ante incumplimiento, se presentó demanda de lanzamiento ante Juzgado Civil.
- Fecha vencimiento: 2026-09-10 · Fecha aviso: 2026-08-10
- **Checklist de tareas (sub-estado: Juicio iniciado):**
  - [ ] Registrar tipo de acción judicial y observaciones
  - [ ] Cambio de estado a: Lanzamiento Judicializado

---

## ACTUACIÓN 16 — C-0016/2023
**ID:** C-0016/2023  
**Tipo:** RECUPERO  
**Área:** CIVIL  
**Carátula:** RECUPERO — DAÑO MATERIAL SINIESTRO VIAL LÍNEA ROCA — RESPONSABLE TERCERO  
**Letrado:** MÉNDEZ, Jorge (UR_015)  
**Coordinador:** SBARBATI, Pablo  
**Fecha Recepción:** 2023-06-05  
**Estado Global:** ACTIVO  
**Sub-estado:** En análisis  
**Urgente:** No  
**N° EE GDE:** EX-2023-REC-011-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| N° Siniestro | num_siniestro | SIN-2023-0415-ROCA |
| Fecha de siniestro | fecha_siniestro | 2023-04-15 |
| Línea ferroviaria | linea | ROCA |
| Fecha del requerimiento | fecha_requerimiento | 2023-05-28 |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| PAN | abg_pan | PAN-20230415-001 |
| Seguro | abg_seguro | SEGUROS DEL SUR S.A. — Póliza 4411-2021 |
| Monto a reclamar | abg_monto_reclamar | 380000 |
| Documental | abg_documental | Completo |

### Timeline

**[RECEPCION] Recupero recibido**
- Fecha: 2023-06-05 · Doc GDE: EX-2023-REC-011-APN-DGJYA

**[MOVIMIENTO → Asignado] Análisis de viabilidad — tareas del catálogo**
- Fecha: 2023-06-15 · Es impulsorio: No
- **Checklist completado (sub-estado: Asignado — 9 tareas del catálogo):**
  - [x] Recepción del reclamo interno / Fecha de prescripción
  - [x] Análisis de antecedentes del siniestro
  - [x] Identificar responsable/s involucrado/s
  - [x] Verificar intervención de compañía aseguradora
  - [x] Verificar actas, informes técnicos y antecedentes internos
  - [x] Verificar presupuesto o valuación del daño
  - [ ] Solicitar antecedentes internos faltantes
  - [ ] Evaluar posibilidad de recupero
  - [ ] Definir estrategia: Acuerdo extrajudicial / Devuelto al sector / Juicio iniciado

**[MOVIMIENTO → En análisis] Denuncia ante aseguradora presentada**
- Fecha: 2023-06-20 · Doc GDE: IF-2023-44012-APN-DGJYA · Es impulsorio: Sí
- Descripción: Se presentó denuncia ante SEGUROS DEL SUR. Pendiente respuesta.
- Fecha vencimiento: 2026-09-20 · Fecha aviso: 2026-08-20
- **Nota:** Sub-estado "En análisis" en Recuperos no tiene checklist adicional en el catálogo.

### Solicitudes
- Tasación de daños al material rodante → SEGUROS / SUÁREZ, Patricia → completada

---

## ACTUACIÓN 17 — P-0017/2024
**ID:** P-0017/2024  
**Tipo:** DESAFUERO  
**Área:** PENAL  
**Carátula:** DESAFUERO — EMPLEADO FERREYRA HUGO — SUSTRACCIÓN BIENES FFCC  
**Letrado:** CASANO, Felix (UR_004)  
**Coordinador:** DESIDERI, Gustavo  
**Fecha Recepción:** 2024-04-08  
**Estado Global:** ACTIVO  
**Sub-estado:** En análisis  
**Urgente:** No  
**N° EE GDE:** EX-2024-DES-007-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| Fecha de ingreso | fecha_ingreso | 2024-04-08 |
| Empleado | empleado | FERREYRA, HUGO ARIEL |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Área requirente | abg_area_req | Gerencia RRHH — Seguridad Interna |
| Línea requirente | abg_linea_req | MITRE |
| Motivo / hecho denunciado | abg_motivo | FERREYRA sorprendido en flagrante sustracción de materiales eléctricos del depósito de estación Palermo el 01/04/2024. |
| Tipo de hecho | abg_tipo_hecho | HURTO - ROBO |
| Fecha del hecho | abg_fecha_hecho | 2024-04-01 |
| Sanción que se persigue | abg_sancion | Despido |
| Fecha informe sanción | abg_fecha_informe | 2024-05-15 |
| N° Causa Penal | abg_causa_penal | IPP-2024-1122 |
| N° Informe UCIT | abg_nro_ucit | UCIT-2024-0084 |

### Timeline

**[RECEPCION] Desafuero recibido**
- Fecha: 2024-04-08 · Doc GDE: EX-2024-DES-007-APN-DGJYA

**[MOVIMIENTO → Asignado] Análisis previo — tareas del catálogo**
- Fecha: 2024-04-10 · Es impulsorio: No
- **Checklist (sub-estado: Asignado — 5 tareas del catálogo):**
  - [x] Pedido de antecedentes internos
  - [x] Control de documentación respaldatoria
  - [x] Evaluación de estrategia judicial
  - [ ] Evaluación de riesgo institucional
  - [ ] Definir estrategia: Devuelto al sector / Juicio iniciado

**[MOVIMIENTO → En análisis] Pedido de desafuero gremial presentado**
- Fecha: 2024-05-20 · Doc GDE: ES-2024-55011-APN-DGJYA · Es impulsorio: Sí
- Descripción: Se solicitó al gremio la suspensión del fuero sindical para proceder al despido.
- Fecha vencimiento: 2026-08-20 · Fecha aviso: 2026-07-20
- **Nota:** Sub-estado "En análisis" en Desafueros no tiene checklist adicional en el catálogo.

### Solicitudes
- Informe disciplinario de Ferreyra → RRHH / GARCIA, María José → completada

---

## ACTUACIÓN 18 — C-0018/2023
**ID:** C-0018/2023  
**Tipo:** EJECUCION_GAR  
**Área:** CIVIL  
**Carátula:** EJECUCIÓN DE PÓLIZA — CONTRATISTA CONSTRUCCIONES DEL SUR — INCUMPLIMIENTO CONTRATO  
**Letrado:** MÉNDEZ, Jorge (UR_015)  
**Coordinador:** SBARBATI, Pablo  
**Fecha Recepción:** 2023-09-01  
**Estado Global:** ACTIVO  
**Sub-estado:** En análisis  
**Urgente:** No  
**N° EE GDE:** EX-2023-EJG-005-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| Contratista / Proveedor | contratista | CONSTRUCCIONES DEL SUR S.R.L. |
| Área requirente | area_requirente | Gerencia de Infraestructura |
| Fecha de ingreso a SACO | fecha_ingreso_saco | 2023-09-01 |
| N° Expediente Electrónico | num_ee | EX-2023-EJG-005-APN-DGJYA |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Aseguradora | abg_aseguradora | SEGUROS FEDERALES S.A. |
| N° Póliza/s | abg_num_poliza | POL-2020-00331 |
| Tipo de Póliza/s | abg_tipo_poliza | Seguro de caución por cumplimiento de contrato |
| Monto/s a ejecutar | abg_monto_ejecutar | 650000 |
| Fecha de rescisión | abg_fecha_rescision | 2023-07-15 |
| Fecha de prescripción | abg_fecha_prescripcion | 2025-07-15 |
| Instrucción de reclamar daños | abg_instruccion_daños | Infraestructura instruyó reclamar daños por retraso + diferencias de coste. |
| Acuerdo | abg_acuerdo | Aseguradora propone 70% ($455.000). Pendiente resolución. |

### Timeline

**[RECEPCION] Ejecución de póliza recibida**
- Fecha: 2023-09-01 · Doc GDE: EX-2023-EJG-005-APN-DGJYA

**[MOVIMIENTO → Asignado] Análisis de viabilidad — tareas del catálogo**
- Fecha: 2023-09-10 · Es impulsorio: No
- **Checklist (sub-estado: Asignado — 7 tareas del catálogo):**
  - [x] Recepción del reclamo interno / Fecha de prescripción
  - [x] Verificar documentación respaldatoria
  - [x] Verificar la valuación del daño
  - [x] Intimación a la contratista
  - [x] Denuncia a la compañía de seguro
  - [ ] Verificar intervención de compañía aseguradora
  - [ ] Definir estrategia: Acuerdo extrajudicial / Devuelto al sector / Inicio de juicio

**[MOVIMIENTO → En análisis] Denuncia formal ante aseguradora**
- Fecha: 2023-10-05 · Doc GDE: IF-2023-60011-APN-DGJYA · Es impulsorio: Sí
- Descripción: Se denunció siniestro ante SEGUROS FEDERALES S.A. por $650.000.
- Fecha vencimiento: 2026-08-05 · Fecha aviso: 2026-07-15
- **Nota:** Sub-estado "En análisis" en Ejecución de pólizas no tiene checklist adicional en el catálogo.

---

## ACTUACIÓN 19 — P-0019/2024
**ID:** P-0019/2024  
**Tipo:** CARTA_SUCESO  
**Área:** PENAL  
**Carátula:** CARTA SAE — APEDREO CON LESIONES LÍNEA MITRE KM 11  
**Letrado:** CASANO, Felix (UR_004)  
**Coordinador:** DESIDERI, Gustavo  
**Fecha Recepción:** 2024-07-15  
**Estado Global:** ACTIVO  
**Sub-estado:** Asignado  
**Urgente:** No  
**N° EE GDE:** EX-2024-CSA-009-APN-DGJYA

### Campos Mesa
_(Carta SAE no tiene campos de Mesa — todo lo completa el letrado)_

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| Documental | abg_documental | Completo |
| N° de Suceso | numero_sae | SAE-2024-001122 |
| Jurisdicción | abg_jurisdiccion | SAN ISIDRO |
| Tipo de hecho | abg_tipo_hecho | APEDREO CON LESIONES |
| Fecha del hecho | abg_fecha_hecho | 2024-07-10 |
| Lugar del hecho | abg_lugar_hecho | Línea Mitre — km 11 — entre Núñez y Belgrano R |
| Línea ferroviaria | abg_linea | MITRE |
| Fuero | abg_juzgado_fuero | CCC |
| Juzgado | abg_juzgado | JUZGADO NAC. CRIM. Y CORR. 22 |
| N° de Causa | abg_num_causa | 88.441/2024 |
| Denunciante | abg_denunciante | SOFSA S.A. — Jefe de Formación SR. ROMERO |
| Estado | estado_tramite | CARGADA |

### Timeline

**[RECEPCION] Carta SAE recibida**
- Fecha: 2024-07-15 · Doc GDE: EX-2024-CSA-009-APN-DGJYA

**[MOVIMIENTO → Asignado] Carta SAE cargada en sistema**
- Fecha: 2024-07-16 · Doc GDE: IF-2024-88011-APN-DGJYA · Es impulsorio: Sí
- Descripción: Suceso cargado en sistema IFGRA. Lesionado trasladado al Hospital Pirovano.
- **Hito 2.1 pendiente — Procede / No Procede:**
  - [ ] 2.1 ¿Procede la denuncia? (SI/NO) → SI: avanza a sub-estado Procede

---

## ACTUACIÓN 20 — P-0020/2023
**ID:** P-0020/2023  
**Tipo:** DEFENSA_PENAL  
**Área:** PENAL  
**Carátula:** DEFENSA PENAL — EMPLEADO ACUSADO — CAUSA HOMICIDIO CULPOSO LÍNEA BELGRANO  
**Letrado:** CASANO, Felix (UR_004)  
**Coordinador:** DESIDERI, Gustavo  
**Fecha Recepción:** 2023-03-20  
**Estado Global:** ACTIVO  
**Sub-estado:** Instrucción  
**Urgente:** Sí  
**N° EE GDE:** EX-2023-DEP-014-APN-DGJYA

### Campos Mesa
| Campo | ID | Valor |
|---|---|---|
| Área requirente | area_requirente | Gerencia de Operaciones |
| Línea ferroviaria | linea | BELGRANO SUR |
| Datos del empleado a asistir | datos_empleado | MORA, LUIS ALBERTO — Legajo 44.001 — Maquinista categoría A — 15 años de antigüedad. |

### Campos Letrado
| Campo | ID | Valor |
|---|---|---|
| N° Causa / IPP | abg_numero_causa | IPP-2023-0041 |
| Fuero | abg_juzgado_fuero | CCC |
| Juzgado | abg_juzgado | JUZGADO NAC. CRIM. Y CORR. 8 |
| Carátula | abg_caratula | MORA LUIS A. S/ HOMICIDIO CULPOSO EN ACCIDENTE FERROVIARIO |
| Datos de los imputados | abg_datos_imputados | MORA, LUIS ALBERTO — DNI 29.441.002 — Maquinista. Imputa exceso de velocidad. |
| Tipo de hecho | abg_tipo_hecho | INTERRUPCIÓN A LOS MEDIOS DE TRANSPORTE |
| Fecha del hecho | abg_fecha_hecho | 2023-03-15 |
| Lugar del hecho | abg_lugar_hecho | Km 22 — Línea Belgrano Sur — Cruce Villa Soldati |
| Estado de la causa | estado_causa | INSTRUCCIÓN |
| Próxima audiencia | fecha_prox_audiencia | 2026-10-20 |
| Observaciones | observaciones | Imputado en libertad con restricciones. Peritos de parte presentados. |

### Timeline

**[RECEPCION] Defensa penal asignada**
- Fecha: 2023-03-20 · Doc GDE: EX-2023-DEP-014-APN-DGJYA

**[MOVIMIENTO → Aceptado] Hito 3.1 — SOFSA asume defensa técnica**
- Fecha: 2023-04-10 · Doc GDE: ES-2023-20011-APN-DGJYA · Es impulsorio: Sí
- Descripción: Se presentó escrito de constitución como defensa técnica del empleado MORA.

**[MOVIMIENTO → Instrucción] Hitos procesales — Estado: Instrucción**
- Fecha: 2024-08-15 · Es impulsorio: Sí
- Descripción: Pericia técnica ferroviaria en curso. Audiencia programada para 20/10/2026.
- Fecha vencimiento: 2026-10-20 · Fecha aviso: 2026-09-20
- **Hitos disponibles (sub-estado: Instrucción — idénticos a Querella):**
  - [x] 5.1 Datos Imputados — completar datos + Delegada Art.196 CPPN (SI/NO) + Organismo Judicial
  - [x] 5.2 Declaración Indagatoria (SI/NO)
  - [x] 5.3 Prueba (SI/NO) — subir documentación + fecha + organismo
  - [ ] 5.4 Conciliación (HAY ACUERDO / NO HAY ACUERDO)
  - [ ] 5.5 Reparación Integral (HAY ACUERDO / NO HAY ACUERDO)
  - [ ] 5.6 Suspensión del Juicio a Prueba / Probation (SE CONCEDE / NO SE CONCEDE)
  - [ ] 5.7 Procesamiento (SI/NO)
  - [ ] 5.8 Sobreseimiento (SI/NO) → SI + Sentencia Firme: FINALIZA CAUSA
  - [ ] 5.9 Falta de Mérito (SI/NO)
  - [ ] 5.10 Instrucción Complementaria (SI/NO)
  - [ ] 5.11 Elevación a Juicio (SI/NO) → SI + Sentencia Firme: AVANZA A JUICIO
  - [ ] 5.12 Prescripción de Acción Penal (SI/NO) → SI + Sentencia Firme: FINALIZA CAUSA
  - [ ] 5.13 Recurso de Apelación (SI/NO)
  - [ ] 5.14 Recurso de Queja (SI/NO)
  - [ ] 5.15 Recurso de Casación (SI/NO)

**[REPLY en hitos de instrucción]**
- Autor: CASANO, Felix · Fecha: 2026-05-20
- Texto: Informe pericial de oficio: velocidad correcta. Favorable para la defensa. Preparar alegato.
- Fecha vencimiento: 2026-10-20 · Fecha aviso: 2026-09-20

### Solicitudes
- Historial capacitaciones empleado Mora → RRHH / GARCIA, María José → completada

---

## RESUMEN DE COBERTURA

| # | ID Mock | Tipo Gestión | Área | Letrado | Estado Global | Sub-estado |
|---|---|---|---|---|---|---|
| 01 | P-0001/2024 | OFICIO (Penal) | PENAL | CASANO | ACTIVO | En análisis |
| 02 | P-0002/2017 | QUERELLA | PENAL | CASANO | ACTIVO | Instrucción |
| 03 | C-0003/2012 | DEMANDA_CIVIL | CIVIL | DANTIOCHIA | ACTIVO | Apelación |
| 04 | C-0004/2019 | DEMANDA_CIVIL | CIVIL | RIOS | ACTIVO | Inicio |
| 05 | L-0005/2013 | DEMANDA_LABORAL | LABORAL | RIOS | ACTIVO | Prueba |
| 06 | C-0006/2018 | DEMANDA_CIVIL | CIVIL | DANTIOCHIA | ACTIVO | Prueba |
| 07 | L-0007/2015 | DEMANDA_LABORAL | LABORAL | RIOS | ACTIVO | Ejecución de sentencia |
| 08 | C-0008/2022 | DEFENSA_CIVIL | CIVIL | CASANO | ACTIVO | Asume representación |
| 09 | C-0009/2013 | COBRO_CANON | CIVIL | DANTIOCHIA | ACTIVO | Acuerdo extrajudicial |
| 10 | C-0010/2022 | DEFENSA_CIVIL | CIVIL | CASANO | ACTIVO | En análisis |
| 11 | C-0011/2024 | OFICIO (Civil) | CIVIL | DANTIOCHIA | ACTIVO | Asignado |
| 12 | C-0012/2023 | CARTA_DOC | CIVIL | MÉNDEZ | ACTIVO | Asignado |
| 13 | L-0013/2024 | MEDIACION | LABORAL | RIOS | ARCHIVADO | Cumplido (no acuerdo) |
| 14 | L-0014/2023 | SECLO | LABORAL | RIOS | ACTIVO | Asignado |
| 15 | C-0015/2022 | LANZAMIENTO | CIVIL | DANTIOCHIA | ACTIVO | Juicio iniciado |
| 16 | C-0016/2023 | RECUPERO | CIVIL | MÉNDEZ | ACTIVO | En análisis |
| 17 | P-0017/2024 | DESAFUERO | PENAL | CASANO | ACTIVO | En análisis |
| 18 | C-0018/2023 | EJECUCION_GAR | CIVIL | MÉNDEZ | ACTIVO | En análisis |
| 19 | P-0019/2024 | CARTA_SUCESO | PENAL | CASANO | ACTIVO | Asignado |
| 20 | P-0020/2023 | DEFENSA_PENAL | PENAL | CASANO | ACTIVO | Instrucción |

### Correcciones aplicadas respecto a v1
- ❌ Eliminado estado "EN_TRAMITE" (no existe) → ✅ Estado Global: ACTIVO / ARCHIVADO
- ❌ Sub-estado "INICIO" en DEFENSA_CIVIL → ✅ "Asume representación" (Act. 08)
- ✅ Checklists reemplazados por las tareas exactas del catálogo Excel (por tipo + sub-estado)
- ✅ Hitos penales (5.x) incluidos como procesales en Querella y Defensa Penal
- ✅ Sub-estados sin tareas de catálogo documentados como "sin checklist predefinido"
- ✅ MEDIACION fracasada → Estado Global ARCHIVADO, sub-estado Cumplido (no acuerdo)

### Vencimientos próximos (julio-octubre 2026)
| Actuación | Sub-estado | Vence | Aviso |
|---|---|---|---|
| OFC-2024-001 | Pedido de información | 2026-07-10 | 2026-07-03 |
| EJG-2023-005 | En análisis | 2026-08-05 | 2026-07-15 |
| MO 25.861-2024 | En análisis | 2026-08-15 | 2026-07-25 |
| DES-2024-007 | En análisis | 2026-08-20 | 2026-07-20 |
| CIV 92.962-2019 | Inicio | 2026-08-20 | 2026-07-20 |
| CIV 79.235-2018 | Prueba | 2026-08-30 | 2026-07-30 |
| CIV 89.251-2013 | Prueba | 2026-08-31 | 2026-07-31 |
| REC-2023-011 | En análisis | 2026-09-20 | 2026-08-20 |
| FSM 115.031-2017 | Instrucción | 2026-09-15 | 2026-08-15 |
| CIV 65.730-2015 | Ejecución de sentencia | 2026-09-30 | 2026-08-30 |
| CIV 107.030-2012 | Apelación | 2026-09-30 | 2026-08-30 |
| DEP-2023-014 | Instrucción | 2026-10-20 | 2026-09-20 |
| CCF 16.579-2022 | Asume representación | 2026-10-05 | 2026-09-05 |
| CCF 1.694-2013 | Acuerdo extrajudicial | 2026-10-20 | 2026-09-20 |

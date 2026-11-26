// Listado para el equipo de desarrollo: todos los cambios de Deltas 3 con la prioridad sugerida.
// Uso: node desarrollo_listado.cjs <salida.docx>   (NODE_PATH debe apuntar a un node_modules con "docx")
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, Footer, PageNumber, BorderStyle, LevelFormat,
} = require('docx');

const OUT = process.argv[2];
const FONT = 'Arial';
const NAVY = '1B3A5C';

// [delta, cambio, pantalla / HU, nota]
const PRIORIDADES = [
  { n: 1, tema: 'Lanzamientos Judicializados', por: 'Es lo que más frena hoy la operación de Civil: el ciclo actual no refleja cómo se tramitan.', items: [
    ['5', 'Iniciar Juicio → Lanzamiento Judicializado: se elige el tipo (Operativo / Comercial). El ciclo pasa de 6 a 11 estados, con bifurcación por vulnerabilidad en Constatación Judicial.', 'HU-15 Iniciar Juicio', 'Va junto con 2B y 8C. Una vez en producción, se suman al migrador los Lanzamientos Judicializados (Anexo C del documento de Deltas 3).'],
    ['2B', 'Edición de Datos: el tipo de lanzamiento queda bloqueado después del alta.', 'HU-08 Edición de Datos', 'Parte del Delta 2; el 2A va en la Prioridad 3.'],
    ['8C', 'Estados y tareas del Lanzamiento Judicializado.', 'Ciclo de estados / Excel de Estados y Tareas', 'Parte del Delta 8; el resto va en la Prioridad 2.'],
    ['13', 'Iniciar Juicio siempre crea una actuación derivada. Al finalizar el juicio, el antecedente se finaliza en cascada, con aviso si quedan tareas pendientes.', 'HU-15 Iniciar Juicio', 'Usa la causal de finalización del Delta 3 (Prioridad 2).'],
    ['19', 'Notificación por campana a Mesa SACO cuando un letrado inicia un juicio.', 'HU-15 / Notificaciones', ''],
  ]},
  { n: 2, tema: 'Bifurcaciones y finalizaciones de los estados', por: 'Completa los ciclos de Civil / Laboral: hoy hay estados sin salida y finalizaciones sin causal.', items: [
    ['3', 'Cambiar Estado: sub-estado DESARCHIVADO (Civil / Laboral y Penal) y causal de finalización obligatoria, según la etapa.', 'HU-11 Cambiar Estado', ''],
    ['4B', 'Desarchivado desde la línea de tiempo.', 'HU-14 Línea de Tiempo C/L', 'Solo esta parte del Delta 4; el resto va en la Prioridad 6.'],
    ['8', 'Demandas Civil / Laboral: bifurcación Favorable / Desfavorable en Alegato y Apelación y baja del estado Recurso de Queja. Catálogo de tareas v2, con las tareas de análisis pasadas de Asignado a En Análisis.', 'Ciclo de estados / Excel de Estados y Tareas', 'El ciclo y las tareas van juntos.'],
    ['15', 'Ciclo A: Acuerdo Extrajudicial pasa a Finalizado.', 'Ciclo de estados', ''],
    ['16', 'Mediaciones y SECLO: ciclo propio con bifurcación Cumplido (acuerdo) / Cumplido (no acuerdo).', 'Ciclo de estados', ''],
    ['17', 'Defensa Civil: ciclo propio con bifurcación Asume / No asume representación.', 'Ciclo de estados', ''],
  ]},
  { n: 3, tema: 'Solicitudes penales', por: 'Penal carga hoy las solicitudes en un campo único que no alcanza.', items: [
    ['2A', 'Edición de Datos: se elimina el campo «Tipo de Solicitud».', 'HU-08 Edición de Datos', 'Va junto con 6B y 6C.'],
    ['6B · 6C', 'Los 10 tipos de Solicitud Penal pasan a ser actividades de la línea de tiempo, con sub-formulario y la etiqueta «Sin completar».', 'HU-16 Línea de Tiempo Penal', ''],
  ]},
  { n: 4, tema: 'Bandejas', por: 'Cambios chicos y de uso diario para Mesa SACO y los letrados.', items: [
    ['18', 'Exportar a Excel las filas filtradas de las bandejas de Mesa SACO y del letrado, con la columna Estado en las dos.', 'Bandejas', ''],
    ['27', 'Marca «Cargada en SIGEJ»: la tilda Mesa SACO (en el detalle o en su bandeja) y puede filtrar por ella. El resto de los roles solo ve la etiqueta.', 'Detalle / Bandeja Mesa SACO', ''],
    ['29', 'El filtro de Carátula también busca por Remitente.', 'Bandejas Mesa SACO y Letrado', ''],
    ['30', 'Columnas y filtros «Tipo de Juicio» y «Tipo de Hecho».', 'Bandeja del Letrado', ''],
    ['33', 'Botón «Mis actuaciones» como acceso rápido al filtro Letrado. Para el letrado, la bandeja abre con el botón activo.', 'Bandeja de Actuaciones', 'Sin cambios en la base de datos.'],
  ]},
  { n: 5, tema: 'Penal', por: 'Resto de los cambios del área Penal.', items: [
    ['6A', 'Responder / Editar / Eliminar actividades en la línea de tiempo Penal. Los movimientos del sistema no se modifican.', 'HU-16 Línea de Tiempo Penal', 'Es el mismo mecanismo que el 4A (Prioridad 6): conviene construirlo una sola vez.'],
    ['7', 'Iniciar Querella desde una Carta SAE. Se bloquea si la actuación no tiene tipo de intervención o es «Sin intervención».', 'HU-27 Iniciar Querella (nueva)', ''],
    ['10', 'Oficio Penal: regla de prioridad del agrupador de causa (Causa > IPP > Sumario).', 'HU-01 / HU-08', ''],
    ['31', 'Querella y Defensa Penal: «Elevación a Juicio» pasa a llamarse «Requerimiento de Elevación a Juicio (Etapa Intermedia)».', 'Ciclo de estados Penal', ''],
    ['32', 'Hitos «Excepciones» y «Planteo de Nulidad» y actividades de la etapa Intermedia.', 'HU-16 Línea de Tiempo Penal', ''],
    ['34', 'Nueva etapa «Recurso Extraordinario Federal» entre Juicio y Ejecución Penal.', 'Ciclo de estados Penal', ''],
    ['36', 'Marca «Confidencial» en la actuación penal: la ven solo el abogado asignado, el coordinador y los gerentes. Reemplaza la regla de emergencia que hoy está en PRD.', 'HU-08 / Detalle / Bandejas / Principal', 'La regla de visibilidad aplica también al Excel (18), a la fila de Mesa SACO (27) y a Principal.'],
  ]},
  { n: 6, tema: 'Línea de tiempo y adjuntos', por: 'Mejoras de carga en la línea de tiempo de Civil / Laboral.', items: [
    ['4A', 'Responder / Editar / Eliminar actividades en la línea de tiempo Civil / Laboral (eliminar sin dejar rastro).', 'HU-14 Línea de Tiempo C/L', 'Ver nota del 6A.'],
    ['20', 'Adjuntos múltiples en toda carga, menos el Alta. No se admiten videos, tampoco dentro de un .zip.', 'Adjuntos', ''],
    ['21', 'Vencimiento de una actividad: marcarlo como cumplido o quitarlo, con chip de vencimiento en la tarjeta. El reply sigue quitando el vencimiento, como en PRD.', 'HU-14 Línea de Tiempo C/L', ''],
  ]},
  { n: 7, tema: 'Alta y datos de la actuación', por: 'Cambios de datos: tocan la base de datos pero no bloquean la operación.', items: [
    ['12', 'Montos múltiples: N pares de moneda + importe, con catálogo de monedas.', 'HU-01 / HU-08', ''],
    ['14', 'Se desactiva el tipo de gestión «Pedido de Causa Penal» (queda inactivo, sin borrar el histórico).', 'Catálogo', ''],
    ['28', 'El campo Remitente admite más de un remitente (Carta Documento y Otras).', 'HU-01 / HU-08', ''],
  ]},
  { n: 8, tema: 'Principal y menú', por: 'Cambios de visualización.', items: [
    ['22', 'Filtro «Por letrado» junto a Mías / Mi área / Todo (Coordinador y Gerente).', 'Principal', ''],
    ['23', 'Rediseño visual del menú lateral.', 'Sidebar', 'Solo estético.'],
    ['24', 'Tarjetas de indicadores compactas (de ~250 px a ~105 px de alto).', 'Principal', ''],
    ['35', 'Tarjetas propias del área Penal (Oficios en trámite / cumplidos, Querellas, Defensas penales y Carta SAE), con selector Civil/Laboral | Penal para quien tiene áreas mezcladas.', 'Principal', 'Respeta el filtro «Por letrado» (22).'],
  ]},
  { n: 9, tema: 'Configuración', por: 'Administración de catálogos.', items: [
    ['11', 'Matrículas con Tomo y Folio. Switch Activo / Inactivo en Editar.', 'Módulo Configuración', ''],
    ['25', 'Filtros en las tablas de Organismos Judiciales: búsqueda, provincia y estado.', 'Configuración / Organismos', ''],
  ]},
];

const JUNTOS = [
  '2B, 5 y 8C: tipo de lanzamiento, ciclo y tareas del Lanzamiento Judicializado.',
  '13 usa la causal de finalización del 3. Como la Entrega 1 incluye las Prioridades 1 a 4, salen juntos.',
  '8: el ciclo Favorable / Desfavorable y el catálogo de tareas v2 van juntos.',
  '2A con 6B y 6C: se quita el campo Tipo de Solicitud cuando las solicitudes pasan a la línea de tiempo.',
  '4A y 6A son el mismo mecanismo en las dos líneas de tiempo, aunque estén en prioridades distintas.',
  '36 se apoya en una única función de visibilidad que usan las bandejas, el detalle, Principal y la exportación a Excel (18).',
];

// ---------------------------------------------------------------- helpers
const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const borders = { top: border, bottom: border, left: border, right: border };
const W = [800, 4700, 1900, 2240]; // = 9640 (Carta vertical, márgenes de 0,75")
const TW = W.reduce((a, b) => a + b, 0);
const margins = { top: 70, bottom: 70, left: 100, right: 100 };

const cell = (children, w, opts = {}) => new TableCell({
  borders, width: { size: w, type: WidthType.DXA }, margins, columnSpan: opts.span,
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
  children: Array.isArray(children) ? children : [children],
});
const p = (text, o = {}) => new Paragraph({
  alignment: o.align, spacing: { before: 0, after: o.after ?? 0 },
  children: [new TextRun({ text, bold: o.bold, color: o.color, size: o.size ?? 18, font: FONT, italics: o.italics })],
});
const bullet = t => new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 60 },
  children: [new TextRun({ text: t, font: FONT, size: 20 })] });

// tabla resumen
const RW = [1300, 3000, 1500, 3840];
function resumen() {
  const head = new TableRow({ tableHeader: true, children: ['Prioridad', 'Tema', 'Deltas', 'Entrega']
    .map((h, i) => cell(p(h, { bold: true, color: 'FFFFFF' }), RW[i], { fill: NAVY })) });
  const rows = PRIORIDADES.map(g => new TableRow({ cantSplit: true, children: [
    cell(p(`Prioridad ${g.n}`, { bold: true }), RW[0], { fill: g.n <= 4 ? 'E2EFDA' : undefined }),
    cell(p(g.tema), RW[1], { fill: g.n <= 4 ? 'E2EFDA' : undefined }),
    cell(p(g.items.map(i => i[0]).join(', ')), RW[2], { fill: g.n <= 4 ? 'E2EFDA' : undefined }),
    cell(p(g.n <= 4 ? 'Entrega 1' : 'Siguientes entregas (orden a confirmar)'), RW[3], { fill: g.n <= 4 ? 'E2EFDA' : undefined }),
  ]}));
  return new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: RW, rows: [head, ...rows] });
}

function tabla(g) {
  const head = new TableRow({ tableHeader: true, children: ['Delta', 'Cambio', 'Pantalla / HU', 'Notas']
    .map((h, i) => cell(p(h, { bold: true, color: 'FFFFFF', align: i === 0 ? AlignmentType.CENTER : undefined }), W[i], { fill: NAVY })) });
  const rows = g.items.map(([d, c, pant, nota]) => new TableRow({ cantSplit: true, children: [
    cell(p(d, { bold: true, align: AlignmentType.CENTER }), W[0]),
    cell(p(c), W[1]),
    cell(p(pant, { color: '404040' }), W[2]),
    cell(p(nota, { color: '595959', italics: true, size: 17 }), W[3]),
  ]}));
  return new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: W, rows: [head, ...rows] });
}

const total = PRIORIDADES.reduce((a, g) => a + g.items.length, 0);
const body = [];
body.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('SIAJ — Deltas 3: listado de cambios y prioridades sugeridas')] }));
body.push(p('Para el equipo de desarrollo · Noviembre 2026', { color: '595959', after: 240, size: 20 }));

body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Para qué es este listado')] }));
[
  `Son todos los cambios del documento de Deltas 3 (${total} ítems), agrupados en 9 prioridades. Sirve para tener el panorama completo y planificar, sin tener que leer el documento entero.`,
  'El detalle de cada cambio (diseño, reglas y cómo probar) llega con cada entrega, en un documento aparte que incluye solo esos cambios.',
  'Las prioridades son una sugerencia nuestra. El área de negocio todavía puede reordenarlas; si cambian, les avisamos.',
  'La columna «Delta» es el número en el documento de Deltas 3. Una letra (2A, 4B, 8C…) indica que solo una parte de ese Delta va en esa prioridad. Los números 1, 9 y 26 no figuran: quedaron fuera del documento.',
].forEach(t => body.push(p(t, { size: 20, after: 120 })));

body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Resumen')] }));
body.push(resumen());
body.push(p('En verde, lo que entra en la Entrega 1.', { size: 17, color: '595959', italics: true, after: 120 }));

body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Cambios que van juntos')] }));
JUNTOS.forEach(t => body.push(bullet(t)));

PRIORIDADES.forEach((g, i) => {
  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: i === 0, children: [new TextRun(`Prioridad ${g.n} — ${g.tema}`)] }));
  body.push(p(g.por, { size: 19, color: '404040', after: 100, italics: true }));
  body.push(tabla(g));
});

const doc = new Document({
  creator: 'SIAJ', title: 'SIAJ — Deltas 3: listado de cambios y prioridades sugeridas',
  styles: {
    default: { document: { run: { font: FONT, size: 20 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', run: { font: FONT, size: 36, bold: true, color: NAVY }, paragraph: { spacing: { before: 0, after: 60 }, keepNext: true } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 26, bold: true, color: NAVY }, paragraph: { spacing: { before: 280, after: 100 }, keepNext: true, outlineLevel: 0 } },
    ],
  },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1300, right: 1300 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      new TextRun({ text: 'SIAJ — Deltas 3 · Listado para desarrollo · Página ', font: FONT, size: 16, color: '808080' }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: '808080' }),
    ] })] }) },
    children: body,
  }],
});

Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log('ok', total, 'items'); });

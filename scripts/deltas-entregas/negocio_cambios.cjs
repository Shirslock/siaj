// Documento para el área de negocio: todos los cambios documentados, para que prioricen la primera entrega.
// Uso: node negocio_cambios.cjs <salida.docx>   (NODE_PATH debe apuntar a un node_modules con "docx")
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, PageOrientation, Footer, PageNumber, BorderStyle, LevelFormat,
} = require('docx');

const OUT = process.argv[2];
const FONT = 'Arial';
const NAVY = '1B3A5C';

const GRUPOS = [
  { titulo: 'Alta y datos de la actuación', items: [
    ['Montos en varias monedas', 'Cada campo de monto admite varios importes, uno por moneda (por ejemplo, un rubro en pesos y otro en dólares). Los totales se muestran por moneda, sin convertir. Las monedas se administran desde Configuración.', 'Mesa SACO, letrados, Gerencia (indicador de monto expuesto)', '12'],
    ['Más de un remitente', 'El campo Remitente de Carta Documento y Otras admite varios remitentes (hasta 10).', 'Mesa SACO, letrados', '28'],
    ['Agrupador de causa automático en Oficio Penal', 'Con N° de Causa, N° de IPP y N° de Sumario, el sistema elige solo con cuál agrupar (primero Causa, después IPP, después Sumario) y se renombra si se completa uno de mayor prioridad.', 'Mesa SACO, letrados de Penal', '10'],
    ['Baja de «Pedido de Causa Penal»', 'Deja de ofrecerse como tipo de gestión en el alta. Queda inactivo, sin borrarse el histórico.', 'Mesa SACO', '14'],
  ]},
  { titulo: 'Bandejas', items: [
    ['Exportar las bandejas a Excel', 'Botón para descargar en Excel las filas que se ven en pantalla con los filtros aplicados, en la bandeja de Mesa SACO y en la del letrado.', 'Mesa SACO, letrados, coordinadores', '18'],
    ['Marca «Cargada en SIGEJ»', 'Mesa SACO marca la actuación cuando ya la cargó en SIGEJ y puede filtrar su bandeja por esa marca.', 'Mesa SACO', '27'],
    ['El filtro de Carátula también busca por Remitente', 'Al escribir en el filtro de Carátula también aparecen las actuaciones cuyo remitente coincide.', 'Mesa SACO, letrados', '29'],
    ['Tipo de Juicio y Tipo de Hecho en la bandeja del letrado', 'Columnas y filtros nuevos para ubicar actuaciones por tipo de juicio o de hecho.', 'Letrados, coordinadores', '30'],
    ['Botón «Mis actuaciones»', 'Acceso rápido para ver solo las actuaciones propias. Para el letrado viene activado al entrar.', 'Letrados, coordinadores, referentes', '33'],
  ]},
  { titulo: 'Pantalla principal y menú', items: [
    ['Filtro «Por letrado» en la pantalla principal', 'Además de Mías / Mi área / Todo, el coordinador y el gerente pueden ver los indicadores de un letrado puntual.', 'Coordinadores, Gerencia', '22'],
    ['Tarjetas de indicadores más compactas', 'Las 5 tarjetas de la pantalla principal ocupan menos alto, para que se vea más información sin bajar.', 'Todos los usuarios', '24'],
    ['Tarjetas propias del área Penal', 'Indicadores específicos de Penal: Oficios en trámite y cumplidos, Querellas, Defensas penales y Carta SAE. Quien tiene áreas mezcladas elige Civil/Laboral o Penal.', 'Área Penal, Gerencia', '35'],
    ['Rediseño visual del menú lateral', 'Menú con fondo oscuro, logo en blanco y la opción activa resaltada. Es un cambio estético.', 'Todos los usuarios', '23'],
  ]},
  { titulo: 'Estados, ciclos y tareas (Civil / Laboral)', items: [
    ['Lanzamiento Judicializado: tipo y nuevo ciclo', 'Al judicializar un Lanzamiento se elige si es Operativo o Comercial. El ciclo pasa de 6 a 11 estados y en Constatación Judicial se elige el camino según haya o no personas vulnerables.', 'Letrados de Civil', '5, 2B, 8C'],
    ['Iniciar Juicio: actuación nueva y cierre del antecedente', 'Iniciar Juicio siempre crea una actuación nueva para el juicio. Cuando el juicio se finaliza, la actuación de origen se finaliza sola, y el sistema avisa si quedaron tareas pendientes.', 'Letrados de Civil y Laboral', '13'],
    ['Aviso a Mesa SACO al iniciar un juicio', 'Cuando un letrado inicia un juicio, Mesa SACO recibe un aviso en la campana de notificaciones.', 'Mesa SACO', '19'],
    ['Demandas: sentencia favorable o desfavorable', 'En Alegato y en Apelación el letrado indica si la sentencia fue favorable o desfavorable. Se elimina el estado Recurso de Queja.', 'Letrados de Civil y Laboral', '8'],
    ['Catálogo de tareas nuevo', 'Las tareas por estado de las Demandas, del Lanzamiento Judicializado y de los tipos con ciclo A/B se reemplazan por las de la planilla de negocio (v2). Las tareas de análisis pasan de Asignado a En Análisis, y Devuelto al Sector Requirente pasa a tener 4 tareas.', 'Letrados de Civil y Laboral', '8'],
    ['Causal de finalización obligatoria', 'Al finalizar una Demanda hay que elegir la causal, según la etapa en que esté (por ejemplo: desistimiento, allanamiento, sentencia firme favorable o desfavorable, cumplimiento total). Se puede finalizar desde cualquier estado.', 'Letrados de Civil y Laboral', '3B'],
    ['Desarchivar una actuación', 'Una actuación finalizada o archivada se puede desarchivar para cargar una actividad y después volver a archivarla. Queda registrado en la línea de tiempo.', 'Letrados de todas las áreas', '3A, 4B'],
    ['Acuerdo Extrajudicial pasa a Finalizado', 'En los tipos con ciclo A (Cobro de Cánones, Reclamo a Contratistas, etc.), desde Acuerdo Extrajudicial se puede avanzar a Finalizado. Antes no tenía salida.', 'Letrados de Civil y Laboral', '15'],
    ['Mediaciones y SECLO con ciclo de estados', 'Pasan de una lista libre de estados a un ciclo ordenado que termina en Cumplido con acuerdo o Cumplido sin acuerdo.', 'Letrados de Civil y Laboral', '16'],
    ['Defensa Civil con ciclo de estados', 'Pasa de una lista libre a un ciclo ordenado en el que el letrado indica si asume o no la representación.', 'Letrados de Civil', '17'],
  ]},
  { titulo: 'Línea de tiempo y actividades', items: [
    ['Responder, editar y eliminar actividades', 'En la línea de tiempo (Civil/Laboral y Penal) se puede responder una actividad, editarla o eliminarla. Los movimientos del sistema no se pueden modificar.', 'Letrados de todas las áreas', '4A, 6A'],
    ['Adjuntar varios archivos a la vez', 'En toda carga (salvo el alta) se pueden adjuntar varios archivos juntos. No se admiten videos, tampoco dentro de un .zip.', 'Letrados, Mesa SACO', '20'],
    ['Vencimientos: marcar cumplido o quitar', 'El vencimiento de una actividad se puede marcar como cumplido o quitar, y se ve como etiqueta en la tarjeta de la actividad.', 'Letrados de Civil y Laboral', '21'],
  ]},
  { titulo: 'Penal', items: [
    ['Solicitudes penales como actividades', 'Las 10 solicitudes penales (Información, Filmaciones, Citaciones, etc.) se cargan como actividades en la línea de tiempo, cada una con su formulario. Se marcan «Sin completar» mientras falten datos. Se quita el campo Tipo de Solicitud de la solapa Datos.', 'Letrados de Penal', '2A, 6B, 6C'],
    ['Iniciar Querella desde Carta SAE', 'Desde una Carta SAE Suceso / Denuncia se puede iniciar la Querella. No se habilita si la actuación no tiene tipo de intervención o es «Sin intervención».', 'Letrados de Penal', '7'],
    ['Nuevo nombre del estado «Elevación a Juicio»', 'En Querella y Defensa Penal pasa a llamarse «Requerimiento de Elevación a Juicio (Etapa Intermedia)».', 'Letrados de Penal', '31'],
    ['Excepciones, Planteo de Nulidad y actividades de la etapa Intermedia', 'Se agregan los hitos «Excepciones» y «Planteo de Nulidad» y las actividades de la etapa Intermedia, según el cuadro de SIAJ.', 'Letrados de Penal', '32'],
    ['Nueva etapa «Recurso Extraordinario Federal»', 'En Querella y Defensa Penal se agrega la etapa REF entre Juicio y Ejecución Penal, igual que en Civil.', 'Letrados de Penal', '34'],
    ['Actuaciones confidenciales', 'El coordinador marca una actuación como confidencial y solo la ven el letrado asignado y el coordinador. Las demás vuelven a ser visibles para el área. Está en definición con el referente de Penal; hoy rige el cambio de emergencia ya aplicado en producción.', 'Área Penal', 'En definición'],
  ]},
  { titulo: 'Configuración', items: [
    ['Matrículas de abogados y reactivar valores de catálogos', 'Cada abogado se carga con sus matrículas (CABA, Provincia, Federal), cada una con tomo y folio. En todos los catálogos, un valor dado de baja se puede volver a activar desde Editar, sin tener que cargarlo de nuevo.', 'Administradores de catálogos', '11'],
    ['Filtros en Organismos Judiciales', 'Búsqueda por texto, provincia y estado en las tablas de juzgados, tribunales, fiscalías, UFI y comisarías.', 'Administradores del sistema', '25'],
  ]},
];

// numeración correlativa y referencias cruzadas para "Cambios que van juntos"
let n = 0;
const num = {};
GRUPOS.forEach(g => g.items.forEach(it => { n += 1; it.n = n; num[it[0]] = n; }));
const N = t => num[t];

const JUNTOS = [
  `${N('Lanzamiento Judicializado: tipo y nuevo ciclo')}, ${N('Iniciar Juicio: actuación nueva y cierre del antecedente')} y ${N('Aviso a Mesa SACO al iniciar un juicio')}: los tres cambian la misma pantalla (Iniciar Juicio). Conviene que tengan la misma prioridad.`,
  `${N('Iniciar Juicio: actuación nueva y cierre del antecedente')} necesita el ${N('Causal de finalización obligatoria')}: la actuación de origen se cierra con la misma causal que el juicio.`,
  `${N('Demandas: sentencia favorable o desfavorable')} y ${N('Catálogo de tareas nuevo')}: las tareas nuevas de las Demandas están armadas sobre el ciclo nuevo. Si uno va en la primera entrega, conviene que el otro también.`,
  `${N('Catálogo de tareas nuevo')} incluye las tareas del Lanzamiento Judicializado. Si se prioriza el ${N('Lanzamiento Judicializado: tipo y nuevo ciclo')}, esas tareas van con él aunque el resto del catálogo espere.`,
];

// ---------------------------------------------------------------- helpers
const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const borders = { top: border, bottom: border, left: border, right: border };
const W = [600, 6100, 2300, 1100, 1300, 2280]; // = 13680 (Carta apaisada con márgenes de 0,75")
const TW = W.reduce((a, b) => a + b, 0);
const margins = { top: 80, bottom: 80, left: 110, right: 110 };

const cell = (children, w, opts = {}) => new TableCell({
  borders, width: { size: w, type: WidthType.DXA }, margins,
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
  children: Array.isArray(children) ? children : [children],
});
const p = (text, o = {}) => new Paragraph({
  alignment: o.align, spacing: { before: 0, after: o.after ?? 0 },
  children: [new TextRun({ text, bold: o.bold, color: o.color, size: o.size ?? 19, font: FONT, italics: o.italics })],
});

function tabla(items) {
  const head = new TableRow({ tableHeader: true, children:
    ['N°', 'Cambio', 'Quién lo usa', 'Ref.', 'Prioridad (1 / 2 / 3)', 'Comentarios']
      .map((h, i) => cell(p(h, { bold: true, color: 'FFFFFF', size: 18, align: i === 0 || i >= 3 ? AlignmentType.CENTER : undefined }), W[i], { fill: NAVY })) });
  const rows = items.map(([titulo, desc, quien, ref, ], k) => {
    const it = items[k];
    const enDef = ref === 'En definición';
    return new TableRow({ cantSplit: true, children: [
      cell(p(String(it.n), { bold: true, align: AlignmentType.CENTER }), W[0]),
      cell([p(titulo, { bold: true, after: 40 }), p(desc)], W[1]),
      cell(p(quien), W[2]),
      cell(p(ref, { align: AlignmentType.CENTER, color: '595959', size: 17, italics: enDef }), W[3]),
      cell(p(''), W[4], { fill: 'FFF9E0' }),
      cell(p(''), W[5], { fill: 'FFF9E0' }),
    ]});
  });
  return new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: W, rows: [head, ...rows] });
}

const body = [];
body.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('SIAJ — Cambios documentados para priorizar')] }));
body.push(p('Documento para el área de negocio · Noviembre 2026', { color: '595959', after: 240, size: 20 }));

body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Para qué es este documento')] }));
const intro = [
  'Estos son todos los cambios al sistema que ya están documentados y listos para pasar a desarrollo. Desarrollo los va a recibir por partes, así que necesitamos que nos indiquen cuáles son los más importantes para la primera entrega.',
  'Cada cambio está explicado en pocas líneas. La columna «Ref.» es la referencia al documento técnico; no hace falta tenerla en cuenta para priorizar.',
];
intro.forEach(t => body.push(p(t, { size: 21, after: 120 })));

body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Cómo completarlo')] }));
[
  ['1', 'lo necesitamos en la primera entrega.'],
  ['2', 'puede ir en la segunda entrega.'],
  ['3', 'puede esperar.'],
].forEach(([k, t]) => body.push(new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 60 },
  children: [new TextRun({ text: `Prioridad ${k}: `, bold: true, font: FONT, size: 21 }), new TextRun({ text: t, font: FONT, size: 21 })] })));
body.push(p('En la columna «Comentarios» pueden agregar lo que consideren: si un cambio ya no hace falta, si hay que ajustarlo o si depende de otra cosa. Las celdas para completar están en amarillo.', { size: 21, after: 120 }));

body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Cambios que conviene priorizar juntos')] }));
body.push(p('Algunos cambios dependen de otros. Si les dan prioridades distintas, lo conversamos:', { size: 21, after: 80 }));
JUNTOS.forEach(t => body.push(new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 60 },
  children: [new TextRun({ text: t, font: FONT, size: 21 })] })));

GRUPOS.forEach((g, i) => {
  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: i === 0, children: [new TextRun(g.titulo)] }));
  body.push(tabla(g.items));
});

const doc = new Document({
  creator: 'SIAJ', title: 'SIAJ — Cambios documentados para priorizar',
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', run: { font: FONT, size: 40, bold: true, color: NAVY }, paragraph: { spacing: { before: 0, after: 60 }, keepNext: true } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 28, bold: true, color: NAVY }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 0 } },
    ],
  },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      new TextRun({ text: 'SIAJ — Cambios para priorizar · Página ', font: FONT, size: 16, color: '808080' }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: '808080' }),
    ] })] }) },
    children: body,
  }],
});

Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log('ok', n, 'cambios'); });

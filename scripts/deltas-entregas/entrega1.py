"""Entrega 1 de Deltas 3: Prioridades 1 a 4, organizada por tema.

Uso: py -I entrega1.py <docx maestro> <docx salida> <nombre xlsx de la entrega>
Los bloques se ubican por anclas de texto del maestro (títulos de Delta y de sección),
no por posición, así que tolera cambios menores en el maestro.
"""
import re, sys, zipfile, os
from xml.sax.saxutils import escape
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docx_body import split_body, text, load

MASTER, OUT, XLSX_NAME = sys.argv[1], sys.argv[2], sys.argv[3]
MASTER_XLSX = 'SIAJ_Deltas3_Estados_y_Tareas.xlsx'

x = load(MASTER)
pre, it, post = split_body(x)
T = [text(e) for e in it]

def find(pred, lo=0):
    for i in range(lo, len(it)):
        if pred(T[i]):
            return i
    raise KeyError(lo)

def at(prefix, lo=0):
    return find(lambda t: t.startswith(prefix), lo)

def delta(n):
    return at(f'DELTA {n} —')

def blk(a, b):
    return it[a:b]

EMPTY = '<w:p/>'

# ------------------------------------------------------------------ plantillas
tpl_parte = it[at('PARTE A')]            # banner grande (tema)
tpl_delta = it[delta(2)]                 # banner medio (sub-tema)
tpl_intro = it[at('Orden en que')]       # párrafo de texto común
i_prio_tbl = find(lambda t: 'Prioridad 1' in t and 'Qué incluye' in t)
prio_tbl = it[i_prio_tbl]
prio_rows = re.findall(r'<w:tr[ >].*?</w:tr>', prio_tbl, re.S)
tbl_open = prio_tbl[:prio_tbl.find('<w:tr')]

def retitle(tbl, new):
    ts = list(re.finditer(r'<w:t(?: [^>]*)?>[^<]*</w:t>', tbl))
    out, last = [], 0
    for k, m in enumerate(ts):
        out.append(tbl[last:m.start()])
        out.append(f'<w:t xml:space="preserve">{escape(new) if k == 0 else ""}</w:t>')
        last = m.end()
    out.append(tbl[last:])
    return ''.join(out)

def para(t, bold=None, italic=False):
    rpr = re.search(r'<w:r>(<w:rPr>.*?</w:rPr>)<w:t>', tpl_intro).group(1)
    if italic:
        rpr = rpr.replace('<w:rPr>', '<w:rPr><w:i/><w:iCs/>').replace('w:val="222222"', 'w:val="555555"')
    rpr_b = rpr.replace('<w:rPr>', '<w:rPr><w:b/><w:bCs/>')
    ppr = re.search(r'<w:pPr>.*?</w:pPr>', tpl_intro).group(0)
    runs = f'<w:r>{rpr_b}<w:t xml:space="preserve">{escape(bold)} </w:t></w:r>' if bold else ''
    runs += f'<w:r>{rpr}<w:t xml:space="preserve">{escape(t)}</w:t></w:r>'
    return f'<w:p>{ppr}{runs}</w:p>'

def row(vals, fill=None, tpl=None):
    tpl = tpl or prio_rows[1]
    r = re.sub(r'w:fill="[0-9A-F]{6}"', f'w:fill="{fill}"', tpl) if fill else tpl
    for old, new in zip(re.findall(r'<w:t>(.*?)</w:t>', tpl), vals):
        r = r.replace(f'<w:t>{old}</w:t>', f'<w:t>{escape(new)}</w:t>', 1)
    return r

PAGE = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

def tema(titulo, intro, origen):
    return [PAGE, retitle(tpl_parte, titulo), EMPTY, para(intro), para(origen, 'Origen:', italic=True), EMPTY]

def subtema(titulo):
    return [retitle(tpl_delta, titulo), EMPTY]

FILL = {1: 'F8D7DA', 2: 'FCE4D0', 3: 'FFF3CD', 4: 'FFF9E0'}

# ------------------------------------------------------------------ anclas del maestro
d2, d3, d4, d5, d6, d8 = delta(2), delta(3), delta(4), delta(5), delta(6), delta(8)
d13, d15, d16, d17, d18, d19 = delta(13), delta(15), delta(16), delta(17), delta(18), delta(19)
d27, d29, d30, d33 = delta(27), delta(29), delta(30), delta(33)
nxt = {d2: delta(10), d13: d15, d15: d16, d16: d17, d17: delta(19), d18: delta(22),
       d19: delta(31), d27: delta(28), d29: d30, d30: d33, d33: delta(35), d6: delta(7)}

s2a, s2b = at('2A —', d2), at('2B —', d2)
s3a, s3b = at('3A —', d3), at('3B —', d3)
s3_nota = at('Nota complementaria', d3)
s5a, s5b = at('5A —', d5), at('5B —', d5)
s8_flujo = at('El flujo de estados de las Demandas', d8)
s8a, s8b, s8c, s8d = at('8A —', d8), at('8B —', d8), at('8C —', d8), at('8D —', d8)
s8_reemplazo = at('Las tareas por estado detalladas', s8c)
s8_img = at('Demanda en Alegato', s8d)              # epígrafe de la captura de la bifurcación
s4b = at('4B —', d4)
s6b, s6c = at('6B —', d6), at('6C —', d6)

def cuerpo(d):
    """Contenido de un Delta sin su banner (desde el recuadro de HU / primera sección)."""
    return blk(d + 2, nxt[d])

# ------------------------------------------------------------------ secciones
S = []
S += tema('Sección 1 — Iniciar Juicio y Lanzamiento Judicializado',
          'Todo lo que pasa cuando un letrado inicia juicio desde una actuación antecedente: se crea la actuación '
          'derivada, se avisa a Mesa SACO y, si el antecedente es un Lanzamiento, el Lanzamiento Judicializado nace '
          'con su tipo (Operativo / Comercial) y su nuevo ciclo de 11 estados. La causal con la que se finaliza el '
          'antecedente en cascada es la de la sección 3.1.',
          'Prioridad 1 · Deltas 13, 19, 5, 2B y 8C · HU-15 (Iniciar Juicio) y HU-08 (Edición de Datos).')
S += subtema('1.1 Iniciar Juicio: actuación derivada y cierre del antecedente · Delta 13')
S += cuerpo(d13)
S += subtema('1.2 Aviso a Mesa SACO al iniciar un juicio · Delta 19')
S += cuerpo(d19)
S += subtema('1.3 Tipo de lanzamiento Operativo / Comercial · Deltas 5A y 2B')
S += blk(s5a, s5b) + blk(s2b, nxt[d2])
S += subtema('1.4 Ciclo de estados del Lanzamiento Judicializado · Deltas 5B, 5C, 5D y 8C')
S += blk(s5b, d8) + blk(s8c, s8_reemplazo) + [para('Las tareas de cada estado y el reemplazo del catálogo están en la sección 4.'), EMPTY]

S += tema('Sección 2 — Ciclos de estados con bifurcación',
          'Tipos de actuación cuyo ciclo deja de ser lineal: el letrado elige la rama al cambiar de estado.',
          'Prioridad 2 · Deltas 8, 15, 16 y 17 · HU-11 (Cambiar Estado).')
S += subtema('2.1 Demandas Civil / Laboral: Favorable / Desfavorable · Delta 8')
S += [it[d8 + 2], EMPTY] + blk(s8_flujo, s8a) + blk(s8_img - 2, s8_img + 1) + [EMPTY]
S += subtema('2.2 Ciclo A: Acuerdo Extrajudicial pasa a Finalizado · Delta 15')
S += cuerpo(d15)
S += subtema('2.3 Mediaciones y SECLO · Delta 16')
S += cuerpo(d16)
S += subtema('2.4 Defensa Civil · Delta 17')
S += cuerpo(d17)

S += tema('Sección 3 — Finalización y desarchivado',
          'Cómo se cierra una actuación (causal obligatoria) y cómo se reabre para cargar una actividad (Desarchivado).',
          'Prioridad 2 · Deltas 3 y 4B · HU-11 (Cambiar Estado) y HU-14 (Línea de Tiempo C/L).')
S += subtema('3.1 Causal de finalización obligatoria · Delta 3B')
S += blk(s3b, find(lambda t: t.startswith('DELTA '), s3b + 1))   # 3B + nota HU-14 + ejemplo
S += subtema('3.2 Desarchivado · Deltas 3A y 4B')
S += blk(s3a, s3b) + blk(s4b, d6)

S += tema('Sección 4 — Catálogo de tareas por estado',
          'Las tareas de las Demandas, del Lanzamiento Judicializado y de los tipos con ciclo A/B se reemplazan por '
          'el catálogo nuevo. El detalle está en el Excel de la entrega (Anexo A).',
          'Prioridades 1 y 2 · Delta 8 (8A, 8B, 8C y 8D).')
S += subtema('4.1 Reemplazo total del catálogo · Delta 8')
S += blk(s8_reemplazo, s8d)
S += subtema('4.2 Tareas nuevas y modificadas · Deltas 8A y 8B')
S += blk(s8a, s8c)
S += blk(s8d, s8_img - 2)

S += tema('Sección 5 — Solicitudes penales',
          'El campo «Tipo de Solicitud» del Oficio Penal desaparece de Datos y las 10 solicitudes pasan a ser '
          'actividades de la línea de tiempo con su propio sub-formulario.',
          'Prioridad 3 · Deltas 2A, 6B y 6C · HU-08 (Edición de Datos) y HU-16 (Línea de Tiempo Penal).')
S += subtema('5.1 Se elimina «Tipo de Solicitud» de Datos · Delta 2A')
S += blk(s2a, s2b)
S += subtema('5.2 Solicitudes penales como actividades · Deltas 6B y 6C')
S += blk(s6b, nxt[d6])

S += tema('Sección 6 — Bandejas',
          'Cambios en las bandejas de Mesa SACO y del Letrado: exportar, marcar, filtrar y acceso rápido.',
          'Prioridad 4 · Deltas 18, 27, 29, 30 y 33 · HU-01 (Bandejas).')
S += subtema('6.1 Exportar a Excel (Mesa SACO y Letrado) · Delta 18')
S += cuerpo(d18)
S += subtema('6.2 Marca «Cargada en SIGEJ» · Delta 27')
S += cuerpo(d27)
S += subtema('6.3 El filtro de Carátula también busca por Remitente · Delta 29')
S += cuerpo(d29)
S += subtema('6.4 Columnas y filtros «Tipo de Juicio» y «Tipo de Hecho» · Delta 30')
S += cuerpo(d30)
S += subtema('6.5 Botón «Mis actuaciones» · Delta 33')
S += cuerpo(d33)

# ------------------------------------------------------------------ carátula
contenido = [
    ('1', 'Iniciar Juicio y Lanzamiento Judicializado', '13, 19, 5, 2B, 8C', 1,
     'Actuación derivada y cierre del antecedente en cascada, aviso a Mesa SACO, tipo de lanzamiento y ciclo de 11 estados.'),
    ('2', 'Ciclos de estados con bifurcación', '8, 15, 16, 17', 2,
     'Demandas Favorable / Desfavorable, Acuerdo Extrajudicial a Finalizado, Mediaciones / SECLO y Defensa Civil.'),
    ('3', 'Finalización y desarchivado', '3, 4B', 2,
     'Causal de finalización obligatoria y sub-estado Desarchivado.'),
    ('4', 'Catálogo de tareas por estado', '8 (8A–8D)', 2,
     'Reemplazo total del catálogo de tareas; detalle en el Excel de la entrega.'),
    ('5', 'Solicitudes penales', '2A, 6B, 6C', 3,
     'Las 10 Solicitudes Penales pasan a actividades con sub-formulario y badge «Sin completar».'),
    ('6', 'Bandejas', '18, 27, 29, 30, 33', 4,
     'Exportar a Excel, «Cargada en SIGEJ», filtro por Remitente, Tipo de Juicio / Hecho y «Mis actuaciones».'),
]
tbl_cont = (tbl_open + row(['Sección', 'Tema', 'Deltas', 'Qué incluye'], tpl=prio_rows[0])
            + ''.join(row([s, t, d, f'Prioridad {p}. {q}'], FILL[p]) for s, t, d, p, q in contenido) + '</w:tbl>')
prox = [r for r in prio_rows[1:] if re.search(r'<w:t>Prioridad [5-9]</w:t>', r)]
tbl_prox = tbl_open + prio_rows[0] + ''.join(prox) + '</w:tbl>'

caratula = [
    retitle(tpl_parte, 'Entrega 1 — Prioridades 1 a 4'), EMPTY,
    para('Esta entrega reúne los cambios más críticos del Documento de Deltas 3: las Prioridades 1 a 4 definidas por '
         'el área de negocio. Está organizada por tema, de modo que todo lo relacionado queda junto. Cada título '
         'indica de qué Delta sale, para poder ubicarlo en el documento completo.'), EMPTY,
    tbl_cont, EMPTY,
    para('el 6A (Reply / Editar / Eliminar en la línea de tiempo Penal) va en la Prioridad 5 y el 4A (Reply / Editar / '
         'Eliminar en Civil / Laboral) en la Prioridad 6.', 'Deltas que llegan en parte:'),
    para(f'{XLSX_NAME} (estados, bifurcaciones y tareas) y decisiones de negocio que aplican.', 'Anexos:'), EMPTY,
    retitle(tpl_delta, 'Próximas entregas'), EMPTY,
    tbl_prox, EMPTY,
]

cover = it[at('Documento de Deltas 3')]
cover = cover.replace('<w:t>Documento de Deltas 3</w:t>', '<w:t>Documento de Deltas 3 — Entrega 1</w:t>', 1)
cover = cover.replace('<w:t>Cambios a las Historias de Usuario y Tareas Procesales</w:t>',
                      '<w:t>Prioridades 1 a 4: los cambios más críticos</w:t>', 1)
assert 'Entrega 1' in cover and 'Prioridades 1 a 4' in cover

# ------------------------------------------------------------------ anexos
i_anexos, i_anexoA, i_anexoB, i_anexoC = at('ANEXOS'), at('Anexo A —'), at('Anexo B —'), at('Anexo C —')
anexoA_txt = it[i_anexoA + 2].replace(
    'reemplaza a las tablas sueltas de versiones anteriores. Se generó desde el prototipo y contiene:',
    'es el Excel de estados y tareas del documento completo, con la hoja «Cambios» limitada a los Deltas de esta '
    'entrega. Contiene:')
assert 'limitada' in anexoA_txt
anexoA_tbl = it[i_anexoA + 4]
anexoA_tbl = anexoA_tbl.replace([r for r in re.findall(r'<w:tr[ >].*?</w:tr>', anexoA_tbl, re.S)
                                 if '<w:t>Catálogos</w:t>' in r][0], '')
anexos = (blk(i_anexos, i_anexoA + 2) + [anexoA_txt, it[i_anexoA + 3], anexoA_tbl] + blk(i_anexoA + 5, i_anexoB)
          + blk(i_anexoC, i_anexoC + 4))

# ------------------------------------------------------------------ armado
i_cover = at('Documento de Deltas 3')
body = it[:i_cover] + [cover] + it[i_cover + 1:at('Índice de Cambios')] + caratula + S + anexos + [it[-1]]
assert it[-1].startswith('<w:sectPr')
doc = (pre + ''.join(body) + post).replace(MASTER_XLSX, XLSX_NAME).replace('Anexo C —', 'Anexo B —')

# ------------------------------------------------------------------ limpiar media / objetos sin uso
zin = zipfile.ZipFile(MASTER)
rels = zin.read('word/_rels/document.xml.rels').decode('utf-8')
used = set(re.findall(r'r:(?:id|embed|link)="(rId\d+)"', doc))
drop = set()
def keep_rel(m):
    rid = re.search(r'Id="(rId\d+)"', m.group(0)).group(1)
    tgt = re.search(r'Target="([^"]+)"', m.group(0)).group(1)
    if rid not in used and tgt.startswith(('media/', 'embeddings/')):
        drop.add('word/' + tgt); return ''
    return m.group(0)
rels2 = re.sub(r'<Relationship [^>]*/>', keep_rel, rels)
ct = zin.read('[Content_Types].xml').decode('utf-8')
for t in drop:
    ct = re.sub(r'<Override PartName="/' + re.escape(t) + r'"[^>]*/>', '', ct)
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as zout:
    for info in zin.infolist():
        if info.filename in drop:
            continue
        data = {'word/document.xml': doc.encode('utf-8'),
                'word/_rels/document.xml.rels': rels2.encode('utf-8'),
                '[Content_Types].xml': ct.encode('utf-8')}.get(info.filename) or zin.read(info.filename)
        zout.writestr(info, data)
print('ok; elementos:', len(body), '; archivos quitados:', len(drop))

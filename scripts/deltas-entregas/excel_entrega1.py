"""Excel de la Entrega 1 (Prioridades 1 a 4): el maestro sin la hoja Catálogos y con Cambios
limitado a los Deltas de la entrega.

Uso: py -I excel_entrega1.py <xlsx maestro> <xlsx salida>
"""
import sys, openpyxl
from openpyxl.utils import get_column_letter

SRC, OUT = sys.argv[1], sys.argv[2]
DELTAS = {'2', '3', '5', '8', '8B', '13', '15', '16', '17', '18', '19', '27', '29', '30', '33'}

wb = openpyxl.load_workbook(SRC)
ws = wb['Cambios']
for r in range(ws.max_row, 1, -1):
    d, _, cambio = (str(ws.cell(r, c).value or '') for c in (1, 2, 3))
    # el Delta 2 vigente solo tiene 2A y 2B: la fila de "Tipo de Intervención" quedó de una versión anterior
    if d not in DELTAS or 'Tipo de Intervención' in cambio:
        ws.delete_rows(r)
ws.auto_filter.ref = f'A1:{get_column_letter(ws.max_column)}{ws.max_row}'
del wb['Catálogos']

for row in wb['Bifurcaciones'].iter_rows(min_row=2):
    for c in row:
        if c.value == 'Pendiente de confirmar con negocio: no figura en los deltas.':
            c.value = 'Confirmado con negocio: sigue vigente el salto directo para el tipo Comercial (ver Anexo B del documento de la entrega).'

ix = wb['Índice']
for row in ix.iter_rows():
    for c in row:
        if c.value == 'SIAJ — Deltas 3 (Etapa 2) · Estados y tareas':
            c.value = 'SIAJ — Deltas 3 (Etapa 2) · Entrega 1 (Prioridades 1 a 4) · Estados y tareas'
        elif isinstance(c.value, str) and c.value.startswith('Resumen de qué cambió por delta'):
            c.value = 'Resumen de qué cambió, solo para los Deltas de la Entrega 1 (antes / ahora).'
for r in range(ix.max_row, 0, -1):
    if ix.cell(r, 2).value == 'Catálogos':
        ix.delete_rows(r)
wb.save(OUT)
print('Cambios:', ws.max_row - 1, 'filas')

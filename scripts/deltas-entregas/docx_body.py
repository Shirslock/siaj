"""Utilidades: separar el <w:body> de un docx en elementos de primer nivel."""
import re, zipfile

TAG = re.compile(r'<(/?)(w:[A-Za-z]+)([^>]*?)(/?)>')

def split_body(xml):
    b0 = xml.find('<w:body>') + len('<w:body>')
    b1 = xml.rfind('</w:body>')
    body = xml[b0:b1]
    items = []
    depth = 0
    start = None
    for m in TAG.finditer(body):
        closing, name, _, selfclose = m.groups()
        if depth == 0 and not closing:
            start = m.start()
            if selfclose:
                items.append(body[start:m.end()]); continue
            depth = 1; top = name; continue
        if depth == 0:
            continue
        if not closing and not selfclose and name == top:
            depth += 1
        elif closing and name == top:
            depth -= 1
            if depth == 0:
                items.append(body[start:m.end()])
    return xml[:b0], items, xml[b1:]

def text(el):
    return re.sub(r'<[^>]+>', '', el.replace('</w:p>', '\n')).strip()

def load(path):
    with zipfile.ZipFile(path) as z:
        return z.read('word/document.xml').decode('utf-8')

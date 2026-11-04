"""Generate the two-page HTML template from the supplied Word form (stdlib only).
Usage: python3 scripts/import-sdm-application.py /path/to/form.docx
Personal values are replaced by empty editable fields before writing artifacts.
"""
import sys, zipfile, json, html, re, copy
import xml.etree.ElementTree as E
from pathlib import Path
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS={'w':W,'v':'urn:schemas-microsoft-com:vml'}
def val(node,path,attr='val',default=''):
 e=node.find(path,NS)
 return e.get('{'+W+'}'+attr,default) if e is not None else default
def text(p):return ''.join(t.text or '' for t in p.findall('./w:r/w:t',NS))
r=E.fromstring(zipfile.ZipFile(sys.argv[1]).read('word/document.xml'))
tables=r.findall('w:body/w:tbl',NS)
fields=[]
# page, row, cell, paragraph, field key, label, retain source default
specs=[(0,1,0,0,'actividad','Nombre de la actividad',True),(0,3,0,0,'nombre','Nombres y apellidos',False),(0,4,0,0,'rut','RUT',False),(0,4,1,0,'telefono','Teléfono',False),(0,5,0,1,'ley','Ley a la cual pertenece',False),(0,5,1,0,'horas','Grado / Horas',False),(0,5,2,0,'profesion','Estamento o profesión',False),(0,5,3,0,'cargo','Cargo',False),(0,6,0,0,'funciones','Funciones asociadas al programa',False),(0,7,0,0,'unidad','Unidad de trabajo',False),(0,7,1,0,'establecimiento','Establecimiento',False),(0,8,0,1,'emailInstitucional','Correo institucional',False),(0,9,0,1,'emailPersonal','Correo personal',False),(0,10,0,1,'fechas','Fechas de ejecución',True),(0,12,0,0,'entidad','Entidad ejecutora',True),(0,14,0,0,'lugar','Lugar de ejecución',True),(0,14,1,0,'ciudad','Ciudad de ejecución',True),(1,3,0,1,'compromisos','Mes y año de ejecución de compromisos',True),(1,7,0,0,'firmaNombre','Nombre y cargo del postulante (firma)',False)]
for page,row,cell,para,key,label,retain in specs:
 p=tables[page].findall('w:tr',NS)[row].findall('w:tc',NS)[cell].findall('w:p',NS)[para]
 original=text(p); prefix,sep,value=original.partition(':')
 if sep:prefix+=': '
 else:prefix='';value=original
 fields.append(dict(key=key,label=label,default='',maxLength=140 if key=='actividad' else 85))
 runs=p.findall('w:r',NS)
 properties=copy.deepcopy(runs[0].find('w:rPr',NS)) if runs else None
 for run in runs:p.remove(run)
 run=E.SubElement(p,'{'+W+'}r')
 if properties is not None:run.append(properties)
 E.SubElement(run,'{'+W+'}t').text=prefix+'{{'+key+'}}'
# Additional blank signature fields.
for row,key,label in [(8,'jefatura','Nombre y cargo de jefatura directa'),(9,'director','Nombre del director del establecimiento')]:
 p=tables[1].findall('w:tr',NS)[row].findall('w:tc',NS)[0].findall('w:p',NS)[0]
 run=E.SubElement(p,'{'+W+'}r');E.SubElement(run,'{'+W+'}t').text=' {{'+key+'}}'
 fields.append(dict(key=key,label=label,default='',maxLength=85))
# These labels are drawn by the floating text boxes, not repeated underneath.
for page,row,cell,para in [(0,6,1,2),(1,0,0,2),(1,4,0,2)]:
 p=tables[page].findall('w:tr',NS)[row].findall('w:tc',NS)[cell].findall('w:p',NS)[para]
 for run in p.findall('w:r',NS):p.remove(run)
# Editable selections use empty defaults for a reusable training form.
def add_field(key,label,kind='text',options=None):
 field=dict(key=key,label=label,default=[] if kind=='checkboxes' else '',type=kind,maxLength=85)
 if options:field['options']=[dict(value=str(i),label=label) for i,label in enumerate(options)]
 fields.append(field)
def set_paragraph(p,value):
 runs=p.findall('w:r',NS)
 props=copy.deepcopy(runs[0].find('w:rPr',NS)) if runs else None
 for run in runs:p.remove(run)
 run=E.SubElement(p,'{'+W+'}r')
 if props is not None:run.append(props)
 E.SubElement(run,'{'+W+'}t').text=value
# Applicant authorization and document date are completed per document.
add_field('cuotas','Número de cuotas del descuento','select')
fields[-1]['options']=[dict(value=str(i),label=str(i)) for i in range(1,4)]
add_field('fechaDocumento','Fecha del documento (postulante)','date')
authorization=tables[1].findall('w:tr',NS)[7].findall('w:tc',NS)[0].findall('w:p',NS)[1]
set_paragraph(authorization,text(authorization).replace('en cuotas','en {{cuotas}} cuotas'))
signature=tables[1].findall('w:tr',NS)[7].findall('w:tc',NS)[1].findall('w:p',NS)[2]
set_paragraph(signature,'Firma / Fecha: {{fechaDocumento}}')
def cell(page,shape,row,column,value):
 sh=r.findall('w:body/w:p',NS)[page].findall('.//v:shape',NS)[shape]
 c=sh.findall('.//w:tr',NS)[row].findall('w:tc',NS)[column]
 set_paragraph(c.find('w:p',NS),value)
def mark(key,index):return '{{'+key+'__'+str(index)+'}}'
for row,key,label in [(8,'viatico','Solicita viático'),(9,'pasajes','Solicita pasajes'),(10,'matricula','Solicita matrícula'),(11,'arancel','Solicita arancel')]:
 add_field(key,label,'select',['Sí','No'])
 p=tables[0].findall('w:tr',NS)[row].findall('w:tc',NS)[1].findall('w:p',NS)[2]
 set_paragraph(p,'[ '+mark(key,0)+' ] Sí          [ '+mark(key,1)+' ] No')
add_field('tipoActividad','Tipo de actividad','checkboxes',['PAC','Programa Iniciativa Ministerial','Sistema de Aprendizaje a Distancia','Formación Médica Continua','Capital Humano','No programada Minsal','Extraprogramática interna','Externa'])
for i in range(8):cell(0,i//4,i%4,0,mark('tipoActividad',i))
add_field('calidad','Calidad jurídica','select',['Titular','Contrata','Honorarios'])
for i in range(3):cell(0,2+i,0,0,mark('calidad',i))
for i,key,label in [(0,'horasCronologicas','Horas cronológicas'),(1,'horasPedagogicas','Horas pedagógicas')]:
 add_field(key,label,'number');cell(0,5,i,0,'{{'+key+'}}')
add_field('discapacidad','Requiere adaptación por discapacidad acreditada','select',['Sí','No'])
cell(0,6,0,0,mark('discapacidad',0));cell(0,6,0,3,mark('discapacidad',1))
add_field('adaptacion','Adaptación requerida');cell(0,6,0,2,'Especificar: {{adaptacion}}')
add_field('sistemaTrabajo','Sistema de trabajo','select',['Horario normal','Sistema de turno'])
cell(2,5,0,0,mark('sistemaTrabajo',0));cell(2,5,0,3,mark('sistemaTrabajo',1))
add_field('remuneraciones','Mantención de remuneraciones','select',['Total','Parcial'])
cell(2,3,0,0,mark('remuneraciones',0));cell(2,4,0,0,mark('remuneraciones',1))
add_field('porcentaje','Porcentaje de remuneración parcial','number');cell(2,4,0,1,'Parcial {{porcentaje}}%')
for column,key,label in [(0,'cubiertas','Número de cubiertas de turno'),(3,'compensacion','Horas por compensar')]:
 add_field(key,label,'number');cell(2,6,1,column,'{{'+key+'}}')
add_field('aprendizajes','Compromisos adquiridos','checkboxes',['Réplica al equipo de trabajo','Preparar capacitación interna','Diseñar y ejecutar un proyecto de mejora','Elaborar orientaciones técnicas','Elaborar propuesta de rediseño de procesos','Exponer en reuniones o consejos técnicos','Otro'])
for i in range(6):cell(2,7,i//2,0 if i%2==0 else 3,mark('aprendizajes',i))
cell(2,7,3,0,mark('aprendizajes',6))
add_field('otroCompromiso','Otro compromiso');cell(2,7,3,1,'Otro: ¿Cuál? {{otroCompromiso}}')

# Resolve Word's inherited paragraph/run styles, not a single substitute font.
styles=E.fromstring(zipfile.ZipFile(sys.argv[1]).read('word/styles.xml'))
style_map={el.get('{'+W+'}styleId'):el for el in styles.findall('w:style',NS)}
def inherited(p,run):
 props={}
 def merge(pr):
  if pr is not None:
   for child in pr:props[child.tag.split('}')[-1]]=child
 merge(styles.find('w:docDefaults/w:rPrDefault/w:rPr',NS))
 def apply_style(key):
  st=style_map.get(key)
  if st is not None:
   parent=val(st,'w:basedOn')
   if parent:apply_style(parent)
   merge(st.find('w:rPr',NS))
 apply_style(val(p,'w:pPr/w:pStyle',default='Normal'))
 merge(p.find('w:pPr/w:rPr',NS));merge(run.find('w:rPr',NS))
 return props
def paragraph(p):
 align=val(p,'w:pPr/w:jc',default='left').replace('both','justify')
 parts=[]
 for run in p.findall('w:r',NS):
  props=inherited(p,run)
  def attr(name,attribute='val',default=''):
   el=props.get(name)
   return el.get('{'+W+'}'+attribute,default) if el is not None else default
  if 'vanish' in props and attr('vanish') not in ('0','false'):continue
  font='Arial'  # Uniform font for the editable document and printed output.
  size=float(attr('sz',default='22'))/2
  style=f'font-family: &quot;{html.escape(font)}&quot;, sans-serif;font-size:{size}pt;'
  for prop,css in [('b','font-weight:bold;'),('i','font-style:italic;')]:
   if prop in props and attr(prop) not in ('0','false'):style+=css
  if 'u' in props and attr('u')!='none':style+='text-decoration:underline;'
  color=attr('color')
  if re.fullmatch('[A-Fa-f0-9]{6}',color):style+=f'color:#{color};'
  spacing=attr('spacing')
  if spacing:style+=f'letter-spacing:{float(spacing)/20}pt;'
  content=''
  for el in run:
   tag=el.tag.split('}')[-1]
   if tag=='t':content+=html.escape(el.text or '')
   elif tag=='tab':content+='&emsp;'
   elif tag=='br':content+='<br>'
  if content:parts.append(f'<span style="{style}">{content}</span>')
 return f'<p style="text-align:{align}">'+(''.join(parts) or '&nbsp;')+'</p>'
def table(t,shape=False,attachments=None):
 grid=[float(c.get('{'+W+'}w'))/20 for c in t.findall('w:tblGrid/w:gridCol',NS)]
 width='100%' if shape else f'{sum(grid)}pt'
 out=f'<table style="width:{width}" class="'+('shape-table' if shape else 'main-table')+'"><colgroup>'+''.join(f'<col style="width:{w/sum(grid)*100}%">' for w in grid)+'</colgroup>'
 rows=t.findall('w:tr',NS)
 for ri,row in enumerate(rows):
  height=float(val(row,'w:trPr/w:trHeight',default='0'))/20
  out+=f'<tr style="height:{height}pt">';col=0
  for ci,c in enumerate(row.findall('w:tc',NS)):
   span=int(val(c,'w:tcPr/w:gridSpan',default='1')); merge=c.find('w:tcPr/w:vMerge',NS);rowspan=1
   if merge is not None and merge.get('{'+W+'}val')!='restart':col+=span;continue
   if merge is not None:
    for nextrow in rows[ri+1:]:
     nc=0;found=False
     for nextcell in nextrow.findall('w:tc',NS):
      if nc==col:
       m=nextcell.find('w:tcPr/w:vMerge',NS);found=m is not None and m.get('{'+W+'}val')!='restart';break
      nc+=int(val(nextcell,'w:tcPr/w:gridSpan',default='1'))
     if not found:break
     rowspan+=1
   fill=val(c,'w:tcPr/w:shd','fill', 'FFFFFF');fill=fill if re.fullmatch('[A-Fa-f0-9]{6}',fill) else 'FFFFFF'
   attached=(attachments or {}).get((ri,ci),[])
   paragraphs=c.findall('w:p',NS)
   if attached:paragraphs=[p for p in paragraphs if text(p).strip() not in ('','.')]
   content=''.join(paragraph(p) for p in paragraphs)
   if attached:content+='<div class="field-options">'+''.join(attached)+'</div>'
   out+=f'<td colspan="{span}" rowspan="{rowspan}" style="background:#{fill}">'+content+'</td>';col+=span
  out+='</tr>'
 return out+'</table>'
# Keep Word text boxes in their owning cells, so entered text cannot cause
# page-anchored overlays to cover borders or drift into another row.
shape_cells=[{0:(2,0),1:(2,0),2:(6,1),3:(6,1),4:(6,1),5:(11,0),6:(13,0)},
             {3:(4,0),4:(4,0),5:(0,0),6:(1,0),7:(2,0)}]
body=[]
paragraphs=r.findall('w:body/w:p',NS)
for i,t in enumerate(tables):
 shapes=paragraphs[0 if i==0 else 2].findall('.//v:shape',NS)
 attachments={}
 for si,s in enumerate(shapes):
  target=shape_cells[i].get(si)
  if target is None:continue
  props=dict(x.split(':',1) for x in s.get('style','').split(';') if ':' in x)
  content=''.join(table(tb,True) for tb in s.findall('.//w:txbxContent/w:tbl',NS))
  attachments.setdefault(target,[]).append(f'<div class="field-group" style="width:{props["width"]}">{content}</div>')
 body.append('<section class="page"><div class="form">'+table(t,attachments=attachments)+'</div></section>')
editor_css='''
.editable-text{display:inline-block;min-width:5ch;min-height:1em;max-width:100%;vertical-align:baseline;white-space:pre-wrap;overflow-wrap:anywhere;background:#e7f1fc;box-shadow:inset 0 -1px #93b4d6;cursor:text}
.editable-text:focus{outline:1px solid #2563eb;background:#dbeafe}
.inline-control{font:inherit;color:inherit;max-width:100%;border:0;border-bottom:1px solid #93b4d6;background:#e7f1fc;padding:0;vertical-align:baseline}
.number-field{width:5ch}.date-field{width:11em}.option-toggle{font:inherit;color:#000;display:inline-block;min-width:1.3em;min-height:1.3em;padding:0;border:1px solid #93b4d6;background:#e7f1fc;cursor:pointer;text-align:center;line-height:1.1}
.option-toggle[aria-pressed="true"]{background:#dbeafe}.option-toggle:focus-visible{outline:2px solid #2563eb}.print-value{display:none}
@media print{.editable-text{background:transparent;box-shadow:none;outline:none;min-width:0}.inline-control{display:none}.print-value{display:inline;white-space:pre-wrap}.option-toggle{border-color:transparent;background:transparent!important;outline:none;color:#000}.editable-text:empty{min-width:0}}
'''
css='''*{box-sizing:border-box}body{margin:0;background:#e2e8f0;color:#000;font-family:Arial,sans-serif}.page{position:relative;width:612pt;min-height:792pt;margin:16px auto;background:white;box-shadow:0 2px 8px #0002;page-break-after:always}.page:last-child{page-break-after:auto}.form{padding-top:42pt;margin-left:36pt}table{border-collapse:collapse;table-layout:fixed}td{vertical-align:top;padding:2pt 5pt}.main-table>tbody>tr>td,.main-table>tr>td{border:.5pt solid #000}p{margin:0;font-size:9pt;line-height:1.08;overflow-wrap:anywhere}.field-options{display:flex;flex-wrap:wrap;align-items:flex-start;gap:6pt 12pt;margin-top:6pt;margin-bottom:3pt}.field-group{max-width:100%;min-width:0;flex-shrink:1}.shape-table td{padding:1pt 3pt;border:0;background:transparent!important}.shape-table tr{break-inside:avoid}.value{white-space:pre-wrap;font:inherit}.selection{white-space:pre} @media screen{.page{zoom:var(--preview-scale,1)}} @page{size:letter;margin:0}@media print{body{background:white}.page{margin:0;box-shadow:none;break-inside:avoid;min-height:792pt}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'''
output=Path('src/components/sdm/documents')
(output/'application-template.html').write_text('<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>Ficha de postulación a capacitación</title><style>'+css+editor_css+'</style></head><body>'+''.join(body)+'</body></html>')
(output/'application-fields.json').write_text(json.dumps(fields,ensure_ascii=False,indent=2)+'\n')
print('Generated template:',len(body),'pages,',len(fields),'editable fields')

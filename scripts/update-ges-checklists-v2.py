#!/usr/bin/env python3
"""
Reescribe el bloque 'checklist' de cada tema GES con la estructura oficial
de la Pauta de Cotejo: Anamnesis + Examen Clínico + Exámenes + Datos Administrativos
"""
import uuid, requests

SUPABASE_URL = "https://gcuevpxondfepbowvyqa.supabase.co"
SUPABASE_KEY = "sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

def bid(): return str(uuid.uuid4())

def chk(title, sections):
    return {"id": bid(), "type": "checklist", "tab": None, "title": title, "sections": sections}

def adm(*items):
    base = ["RUT válido y vigente", "Interconsulta médica firmada con diagnóstico GES explícito",
            "Registro en MLE con código GES y problema de salud especificado"]
    return {"label": "Datos Administrativos", "items": list(base) + list(items)}

# ─────────────────────────────────────────────────────────────────────────────
CHECKLISTS = {}

# Cardiopatías congénitas
CHECKLISTS["04dd5a0e-c1ad-4b7f-a9e5-ec26d7748c87"] = chk("Pauta de Cotejo — Cardiopatías Congénitas", [
    {"label": "Anamnesis", "items": [
        "Historia de cianosis, síncope o disnea de esfuerzo",
        "Infecciones respiratorias frecuentes o retardo del desarrollo psicomotor",
        "Antecedentes familiares de cardiopatía congénita",
        "Curva de crecimiento pondoestatural",
    ]},
    {"label": "Examen Clínico", "items": [
        "Saturación de O₂ basal",
        "Auscultación cardiaca (soplos, ruidos anómalos)",
        "Signos de insuficiencia cardíaca (hepatomegalia, edema)",
        "Pulsos periféricos y presión arterial",
        "Peso y talla (percentiles)",
    ]},
    {"label": "Exámenes", "items": [
        "ECG de 12 derivaciones",
        "Radiografía de tórax AP",
        "Ecocardiograma con informe cardiológico",
        "Hemograma",
        "Saturometría de pulso registrada",
    ]},
    adm(),
])

# IAM
CHECKLISTS["696efcff77924d3a78533dd6"] = chk("Pauta de Cotejo — IAM", [
    {"label": "Anamnesis", "items": [
        "Tiempo desde el evento agudo y síntomas del episodio",
        "Factores de riesgo cardiovascular: HTA, DM, tabaco, dislipidemia, obesidad",
        "Tratamiento actual post-IAM (antiagregantes, estatina, IECA/ARA, BB)",
        "Antecedentes de revascularización previa (PTCA, bypass)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Presión arterial en ambos brazos",
        "Frecuencia cardíaca y ritmo",
        "Auscultación cardíaca (soplos, galope S3)",
        "Signos de insuficiencia cardíaca (crepitaciones, edema, ingurgitación yugular)",
    ]},
    {"label": "Exámenes", "items": [
        "ECG de 12 derivaciones post-evento",
        "Ecocardiograma con FEVI post-IAM",
        "Troponinas seriadas con valores y fecha",
        "Perfil lipídico",
        "Glicemia y HbA1c",
        "Creatinina",
        "Hemograma",
    ]},
    adm("Informe de coronariografía si fue realizada"),
])

# HTA
CHECKLISTS["696ea74c245ef362de4f433a"] = chk("Pauta de Cotejo — HTA", [
    {"label": "Anamnesis", "items": [
        "Tiempo de diagnóstico y tratamiento antihipertensivo actual",
        "Síntomas de HTA secundaria: cefalea, palpitaciones, sudoración, visión borrosa",
        "Antecedentes familiares cardiovasculares",
        "Adherencia al tratamiento y estilo de vida",
    ]},
    {"label": "Examen Clínico", "items": [
        "Presión arterial en ambos brazos y de pie",
        "Frecuencia cardíaca",
        "IMC y perímetro abdominal",
        "Auscultación cardíaca y vascular (soplos carotídeos, renales)",
        "Fondo de ojo si disponible",
    ]},
    {"label": "Exámenes", "items": [
        "Creatinina y clearance renal (CKD-EPI)",
        "Electrolitos plasmáticos (Na, K)",
        "Glicemia",
        "Perfil lipídico",
        "Orina completa con microalbuminuria",
        "ECG de 12 derivaciones",
        "Hemograma",
    ]},
    adm(),
])

# Marcapaso
CHECKLISTS["dc917bbe-bbff-4a36-89f3-895c41628b2f"] = chk("Pauta de Cotejo — Marcapaso", [
    {"label": "Anamnesis", "items": [
        "Síntomas: síncope, presíncope, mareos, palpitaciones, disnea",
        "Antecedentes de bloqueos AV o enfermedad del nódulo sinusal",
        "Antecedentes de IAM o cardiopatía isquémica",
        "Medicamentos actuales (betabloqueadores, antiarrítmicos, digoxina)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Frecuencia cardíaca y ritmo",
        "Presión arterial",
        "Auscultación cardíaca",
        "Signos de disfunción autonómica o cardíaca",
    ]},
    {"label": "Exámenes", "items": [
        "ECG de 12 derivaciones (documentar bloqueo/bradicardia)",
        "Holter 24 horas (si disponible)",
        "Electrolitos plasmáticos",
        "Función tiroidea (TSH)",
        "Hemograma",
        "Función renal",
    ]},
    adm(),
])

# Válvula aórtica
CHECKLISTS["89f5d99d-1d44-43f2-b1a1-a6f228035602"] = chk("Pauta de Cotejo — Valvulopatía Aórtica", [
    {"label": "Anamnesis", "items": [
        "Síntomas de disnea de esfuerzo, síncope o angina",
        "Tiempo de evolución y progresión de síntomas",
        "Antecedentes de fiebre reumática o endocarditis",
        "Tratamiento anticoagulante o antiagregante actual",
    ]},
    {"label": "Examen Clínico", "items": [
        "Auscultación cardíaca: soplo sistólico (carácter, irradiación)",
        "Presión de pulso y pulso carotídeo (parvus et tardus)",
        "Signos de insuficiencia cardíaca congestiva",
        "Pulsos periféricos",
    ]},
    {"label": "Exámenes", "items": [
        "Ecocardiograma doppler (gradiente, área valvular, FEVI)",
        "ECG de 12 derivaciones",
        "Radiografía de tórax AP y lateral",
        "Hemograma",
        "Función renal",
    ]},
    adm(),
])

# Válvula mitral/tricúspide
CHECKLISTS["41e275d6-1057-4075-a9ef-f6305a895bca"] = chk("Pauta de Cotejo — Valvulopatía Mitral", [
    {"label": "Anamnesis", "items": [
        "Síntomas: disnea, ortopnea, palpitaciones, fatiga",
        "Antecedentes de fiebre reumática",
        "Historia de fibrilación auricular",
        "Tratamiento anticoagulante actual",
    ]},
    {"label": "Examen Clínico", "items": [
        "Auscultación cardíaca (soplo sistólico/diastólico, irradiación, intensidad)",
        "Signos de congestión pulmonar (crepitaciones basales)",
        "Signos de congestión sistémica (ingurgitación yugular, edema, hepatomegalia)",
        "Frecuencia cardíaca y ritmo (FA)",
    ]},
    {"label": "Exámenes", "items": [
        "Ecocardiograma doppler con área valvular y FEVI",
        "ECG de 12 derivaciones",
        "Radiografía de tórax AP",
        "Hemograma",
        "Función renal",
        "TP/INR si anticoagulado",
    ]},
    adm(),
])

# ERC 4-5
CHECKLISTS["696efcff77924d3a78533dd4"] = chk("Pauta de Cotejo — ERC Etapa 4-5", [
    {"label": "Anamnesis", "items": [
        "Etiología de la ERC (DM, HTA, glomerulopatía, otra)",
        "Tiempo de diagnóstico y progresión (VFGe previos)",
        "Síntomas urémicos: náuseas, prurito, astenia, edema",
        "Medicamentos nefrotóxicos o que requieren ajuste de dosis",
    ]},
    {"label": "Examen Clínico", "items": [
        "Presión arterial",
        "Edema de extremidades inferiores",
        "Signos de sobrecarga de volumen",
        "Estado nutricional",
        "Signos de uremia (asterixis, pericarditis)",
    ]},
    {"label": "Exámenes", "items": [
        "Creatinina y VFGe (CKD-EPI)",
        "Electrolitos: Na, K, bicarbonato",
        "Calcio, fósforo, PTH intacta",
        "Albúmina",
        "Hemograma",
        "Orina completa con proteinuria/creatinuria (RAC)",
        "Ecografía renal bilateral",
    ]},
    adm(),
])

# ERC terminal
CHECKLISTS["2d31e828-cf69-4a64-8274-6e706b2bf74a"] = chk("Pauta de Cotejo — ERC Terminal", [
    {"label": "Anamnesis", "items": [
        "Etiología de la ERC y tiempo de diagnóstico",
        "VFGe actual (< 15 ml/min/1.73m²)",
        "Síntomas urémicos y descompensaciones previas",
        "Preferencia del paciente sobre modalidad de terapia de reemplazo renal",
        "Acceso vascular previo o fístula AV",
    ]},
    {"label": "Examen Clínico", "items": [
        "Presión arterial",
        "Edema y signos de sobrecarga de volumen",
        "Evaluación de venas para acceso vascular (hemodiálisis)",
        "Estado nutricional (IMC, albúmina clínica)",
    ]},
    {"label": "Exámenes", "items": [
        "Creatinina y VFGe",
        "Electrolitos, bicarbonato",
        "PTH, calcio, fósforo",
        "Albúmina",
        "Hemograma",
        "Ecografía renal",
        "Serología: VIH, hepatitis B (HBsAg), hepatitis C (Anti-VHC)",
    ]},
    adm(),
])

# Cáncer cervicouterino
CHECKLISTS["696efcff77924d3a78533dd2"] = chk("Pauta de Cotejo — Cáncer Cervicouterino", [
    {"label": "Anamnesis", "items": [
        "Antecedentes familiares — infección persistente por genotipo de alto riesgo de VPH",
        "Estado general",
        "Dolor pélvico",
        "Edad",
        "Factores de riesgo: edad temprana de inicio de vida sexual, múltiples parejas sexuales, multiparidad, tabaquismo",
    ]},
    {"label": "Examen Clínico", "items": [
        "Examen ginecológico con especuloscopía para evaluar condición del cuello — describir imagen del cuello",
        "Sangrado vaginal",
        "Pérdida de peso inexplicable",
    ]},
    {"label": "Exámenes", "items": [
        "PAP",
    ]},
    adm(),
])

# Cáncer de mama
CHECKLISTS["696efcff77924d3a78533dd1"] = chk("Pauta de Cotejo — Cáncer de Mama", [
    {"label": "Anamnesis", "items": [
        "Nódulo mamario: tiempo de evolución, cambios de tamaño",
        "Secreción por pezón, retracción o cambios en la piel",
        "Antecedentes familiares de cáncer de mama u ovario (BRCA)",
        "Uso de anticonceptivos hormonales o TRH",
    ]},
    {"label": "Examen Clínico", "items": [
        "Descripción del nódulo: tamaño, consistencia, movilidad, límites",
        "Piel de naranja, retracción pezón, eritema",
        "Adenopatías axilares, supraclaviculares e infraclaviculares",
        "Examen de mama contralateral",
    ]},
    {"label": "Exámenes", "items": [
        "Mamografía bilateral con informe radiológico (BI-RADS)",
        "Ecografía mamaria",
        "Biopsia core o PAAF con informe histológico",
        "Hemograma",
        "Función hepática",
    ]},
    adm(),
])

# Cáncer gástrico
CHECKLISTS["696efcff77924d3a78533dd3"] = chk("Pauta de Cotejo — Cáncer Gástrico", [
    {"label": "Anamnesis", "items": [
        "Síntomas: epigastralgia, saciedad precoz, baja de peso, disfagia, náuseas",
        "Duración de síntomas y antecedente de H. pylori",
        "Antecedentes familiares de cáncer gástrico",
        "Historia de úlcera gástrica o gastritis crónica",
    ]},
    {"label": "Examen Clínico", "items": [
        "Estado nutricional: peso actual y baja de peso reciente (%)",
        "Palpación de masa epigástrica",
        "Adenopatía supraclavicular izquierda (Virchow)",
        "Hepatomegalia o ascitis",
    ]},
    {"label": "Exámenes", "items": [
        "Endoscopía digestiva alta con biopsia e informe histológico",
        "Hemograma",
        "Albúmina",
        "Función hepática",
        "TAC abdomen-pelvis con contraste (si disponible)",
    ]},
    adm(),
])

# Cáncer colorrectal
CHECKLISTS["b670e7b4-8b9c-46e6-91c8-3290999e1712"] = chk("Pauta de Cotejo — Cáncer Colorrectal", [
    {"label": "Anamnesis", "items": [
        "Cambio en hábito intestinal, sangre en deposiciones, pujo, tenesmo",
        "Tiempo de síntomas y baja de peso",
        "Antecedentes familiares de CCR o poliposis adenomatosa",
        "Colonoscopías previas y resultados",
    ]},
    {"label": "Examen Clínico", "items": [
        "Tacto rectal (descripción de hallazgos: masa, distancia al margen anal)",
        "Palpación abdominal (masa, hepatomegalia)",
        "Estado nutricional",
        "Signos de anemia (palidez, taquicardia)",
    ]},
    {"label": "Exámenes", "items": [
        "Colonoscopía con biopsia e informe histológico",
        "CEA (antígeno carcinoembrionario)",
        "Hemograma",
        "Función hepática",
        "TAC abdomen-pelvis con contraste (si disponible)",
    ]},
    adm(),
])

# Cáncer de pulmón
CHECKLISTS["accbebd9-cd1a-4414-8efd-43a205591d2f"] = chk("Pauta de Cotejo — Cáncer de Pulmón", [
    {"label": "Anamnesis", "items": [
        "Tos persistente, hemoptisis, dolor torácico, disnea",
        "Baja de peso involuntaria",
        "Historia de tabaquismo (años-paquete) y exposición laboral (asbesto, sílice)",
        "Antecedentes de EPOC o fibrosis pulmonar",
    ]},
    {"label": "Examen Clínico", "items": [
        "Estado general (ECOG o Karnofsky)",
        "Auscultación pulmonar (hipoventilación, derrame pleural)",
        "Adenopatías supraclaviculares o cervicales",
        "Síndrome de vena cava superior (edema facial, ingurgitación)",
        "Dedos en palillo de tambor",
    ]},
    {"label": "Exámenes", "items": [
        "Radiografía de tórax AP y lateral",
        "TAC de tórax con contraste",
        "Biopsia: broncoscopía con muestra o punción guiada por TAC con informe histológico",
        "Hemograma",
        "Función hepática y renal",
    ]},
    adm(),
])

# Cáncer de próstata
CHECKLISTS["ad4d27ee-fcf5-4a47-8000-5bb4823970e0"] = chk("Pauta de Cotejo — Cáncer de Próstata", [
    {"label": "Anamnesis", "items": [
        "Síntomas urinarios bajos: polaquiuria, dificultad miccional, goteo terminal",
        "Historia de PSA previos y velocidad de ascenso",
        "Antecedentes familiares de cáncer de próstata",
        "Síntomas de metástasis óseas (dolor lumbar u óseo)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Tacto rectal (tamaño prostático, consistencia, nódulos, simetría)",
        "Estado general",
        "Dolor óseo a la palpación",
        "Adenopatías inguinales",
    ]},
    {"label": "Exámenes", "items": [
        "PSA total y libre con índice PSA libre/total",
        "Biopsia prostática con informe histológico (score de Gleason/ISUP)",
        "Hemograma",
        "Función renal",
        "Fosfatasa alcalina",
        "Ecografía prostática transrectal (si disponible)",
    ]},
    adm(),
])

# Cáncer de ovario
CHECKLISTS["cf979499-4e1d-422b-a32c-018f26bb2b93"] = chk("Pauta de Cotejo — Cáncer de Ovario", [
    {"label": "Anamnesis", "items": [
        "Distensión abdominal, dolor pélvico, síntomas digestivos vagos",
        "Antecedentes familiares de cáncer ovario/mama (BRCA)",
        "Historia menstrual, paridad y uso de ACO",
        "Tiempo de evolución de síntomas",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palpación abdominal (masa pelviana, ascitis)",
        "Examen ginecológico bimanual",
        "Adenopatías inguinales",
        "Estado nutricional y ECOG",
    ]},
    {"label": "Exámenes", "items": [
        "Ecografía transvaginal y abdominal con informe",
        "CA-125",
        "Hemograma",
        "Función hepática y renal",
        "TAC abdomen-pelvis con contraste (si disponible)",
    ]},
    adm(),
])

# Cáncer vesical
CHECKLISTS["f3bab9dd-74e1-4820-b6c6-b34a65c87146"] = chk("Pauta de Cotejo — Cáncer Vesical", [
    {"label": "Anamnesis", "items": [
        "Hematuria macro o microscópica (frecuencia y tiempo)",
        "Cistitis de repetición, disuria, urgencia miccional",
        "Exposición a tabaco y carcinógenos (anilinas, aminas aromáticas)",
        "Antecedentes de litiasis o tuberculosis urogenital",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palpación suprapúbica (masa vesical)",
        "Tacto rectal bimanual",
        "Estado general (ECOG)",
    ]},
    {"label": "Exámenes", "items": [
        "Cistoscopía con biopsia e informe histológico",
        "Citología urinaria",
        "Ecografía vesical (con vejiga llena)",
        "Hemograma",
        "Función renal",
        "TAC abdomen-pelvis (si disponible, estadificación)",
    ]},
    adm(),
])

# Cáncer renal
CHECKLISTS["0de56f1e-1904-45b4-a74e-51e9d5a0691b"] = chk("Pauta de Cotejo — Cáncer Renal", [
    {"label": "Anamnesis", "items": [
        "Hematuria, dolor lumbar, masa en flanco (tríada clásica)",
        "Baja de peso, fiebre, sudoración nocturna",
        "Hallazgo incidental en ecografía o TAC",
        "Tabaquismo; antecedentes de enfermedad de Von Hippel-Lindau",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palpación de masa en flanco",
        "Estado general (ECOG)",
        "Varicocele izquierdo de aparición reciente",
        "Adenopatías",
    ]},
    {"label": "Exámenes", "items": [
        "TAC abdomen y pelvis con contraste trifásico (arterial, venoso, tardío)",
        "Hemograma",
        "Función renal",
        "Función hepática",
        "Ecografía abdominal si no hay TAC",
    ]},
    adm(),
])

# Cáncer de tiroides
CHECKLISTS["44b72db1-6886-422b-b75b-9b5d6976bed6"] = chk("Pauta de Cotejo — Cáncer de Tiroides", [
    {"label": "Anamnesis", "items": [
        "Nódulo tiroideo: tiempo, crecimiento, disfagia, disfonía",
        "Antecedentes de irradiación cervical en la infancia",
        "Historia familiar de cáncer medular de tiroides o NEM",
        "Síntomas de hipo/hipertiroidismo asociados",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palpación tiroidea: tamaño del nódulo, consistencia, movilidad con deglución",
        "Adenopatías cervicales (cadenas yugulares y pretraqueales)",
        "Evaluación de voz (parálisis de cuerdas vocales)",
    ]},
    {"label": "Exámenes", "items": [
        "Ecografía tiroidea con informe (TIRADS)",
        "PAAF con informe citológico (Bethesda)",
        "TSH y T4 libre",
        "Calcitonina (si sospecha de carcinoma medular)",
        "Hemograma",
    ]},
    adm(),
])

# Linfomas
CHECKLISTS["146af38c-7db0-4fc4-a8d4-5f4033fd1b86"] = chk("Pauta de Cotejo — Linfomas", [
    {"label": "Anamnesis", "items": [
        "Adenopatías: localización, tamaño, tiempo de evolución, adherencia",
        "Síntomas B: fiebre > 38°C, sudoración nocturna, baja de peso > 10% en 6 meses",
        "Prurito generalizado",
        "Antecedentes de inmunosupresión, VIH, trasplante",
    ]},
    {"label": "Examen Clínico", "items": [
        "Descripción y medición de adenopatías (cervicales, axilares, inguinales)",
        "Esplenomegalia y hepatomegalia",
        "Estado general (ECOG)",
        "Temperatura",
    ]},
    {"label": "Exámenes", "items": [
        "Biopsia excisional de ganglio con inmunohistoquímica (no solo PAAF)",
        "Hemograma con diferencial",
        "LDH y β2-microglobulina",
        "Función hepática y renal",
        "TAC de cuello, tórax, abdomen y pelvis con contraste",
        "Serología VIH",
    ]},
    adm(),
])

# Leucemia
CHECKLISTS["b44e610d-1a6e-49fc-8518-07eca7932a49"] = chk("Pauta de Cotejo — Leucemia", [
    {"label": "Anamnesis", "items": [
        "Síntomas de anemia: fatiga, palidez, disnea",
        "Infecciones frecuentes o graves",
        "Hemorragias espontáneas, petequias, equimosis",
        "Dolores óseos (especialmente en niños con LLA)",
        "Tiempo de evolución de síntomas",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palidez cutáneo-mucosa",
        "Fiebre",
        "Adenopatías",
        "Esplenomegalia y hepatomegalia",
        "Petequias o equimosis",
        "Signos meníngeos (en niños)",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma completo con diferencial (presencia de blastos)",
        "Frotis de sangre periférica con descripción",
        "LDH y ácido úrico",
        "Función hepática y renal",
        "Coagulación (TP, TTPA, fibrinógeno)",
        "Mielograma urgente",
    ]},
    adm("Derivación urgente a hematología oncológica"),
])

# Mieloma
CHECKLISTS["50aa8ef3-daac-415d-b028-c599240078c5"] = chk("Pauta de Cotejo — Mieloma Múltiple", [
    {"label": "Anamnesis", "items": [
        "Dolor óseo: columna, caderas, esternón; fracturas patológicas",
        "Astenia intensa, infecciones frecuentes",
        "Síntomas de hipercalcemia: poliuria, náuseas, constipación, confusión",
        "Antecedentes de insuficiencia renal de causa no explicada",
    ]},
    {"label": "Examen Clínico", "items": [
        "Dolor óseo a la palpación vertebral",
        "Deformidades vertebrales (cifosis)",
        "Estado general (ECOG)",
        "Signos de anemia",
        "Signos de insuficiencia renal",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma con diferencial y VHS elevada",
        "Proteinograma electroforético con inmunofijación",
        "Inmunoglobulinas cuantitativas (IgG, IgA, IgM)",
        "Calcio, creatinina, LDH, β2-microglobulina",
        "Proteinuria de Bence-Jones (orina 24h)",
        "Radiografías óseas (cráneo, columna, pelvis, húmero, fémur)",
    ]},
    adm(),
])

# Hemofilia
CHECKLISTS["7c0496c9-7cd2-4d08-8ae3-81a0f01c590a"] = chk("Pauta de Cotejo — Hemofilia", [
    {"label": "Anamnesis", "items": [
        "Historia de episodios hemorrágicos: frecuencia, gravedad, localización",
        "Diagnóstico previo con niveles de factor VIII o IX",
        "Inhibidores conocidos (título en unidades Bethesda)",
        "Antecedentes familiares de hemofilia",
        "Tratamiento de reemplazo actual (tipo de factor, dosis, frecuencia)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Articulaciones con hemartros activo o crónico (rodillas, tobillos, codos)",
        "Hematomas activos o signos de sangrado",
        "Signos de artropatía hemofílica (limitación funcional, atrofia muscular)",
        "Examen neurológico si hemorragia previa del SNC",
    ]},
    {"label": "Exámenes", "items": [
        "TTPA (prolongado) y TP (normal)",
        "Niveles de factor VIII o IX (actividad %)",
        "Inhibidores cuantitativo (test de Bethesda)",
        "Hemograma",
        "Serología viral: VIH, hepatitis B y C",
    ]},
    adm(),
])

# Cáncer pediátrico
CHECKLISTS["14e327a1-6444-4bf0-b989-e16484b7af01"] = chk("Pauta de Cotejo — Cáncer Pediátrico", [
    {"label": "Anamnesis", "items": [
        "Tipo de tumor diagnosticado o en sospecha",
        "Síntomas específicos y tiempo de evolución",
        "Antecedentes familiares de tumores o síndromes predisponentes",
        "Comorbilidades y antecedentes perinatales",
    ]},
    {"label": "Examen Clínico", "items": [
        "Estado general y nutricional (percentiles peso/talla)",
        "Descripción de masa o adenopatías",
        "Hepatoesplenomegalia",
        "Signos neurológicos si tumor SNC",
        "Temperatura (síntomas B)",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma completo con diferencial",
        "LDH y función hepática/renal",
        "Imágenes según tumor: TAC, RNM o ecografía",
        "Biopsia con informe histológico si posible",
    ]},
    adm("Derivación urgente a oncología pediátrica"),
])

# Cuidados paliativos
CHECKLISTS["cda1e4f0-3773-4f1a-ba33-f68bde078471"] = chk("Pauta de Cotejo — Cuidados Paliativos", [
    {"label": "Anamnesis", "items": [
        "Diagnóstico oncológico o enfermedad terminal de base con etapa actual",
        "Tratamientos previos (quimioterapia, radioterapia, cirugía) y respuesta",
        "Síntomas dominantes: dolor (EVA), disnea, náuseas, constipación, ansiedad",
        "Preferencias del paciente y familia sobre el cuidado",
    ]},
    {"label": "Examen Clínico", "items": [
        "Escala ECOG o Karnofsky",
        "Valoración del dolor (EVA actual y en reposo/movimiento)",
        "Estado nutricional",
        "Presencia de síntomas descontrolados",
        "Signos vitales",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma (si útil para manejo sintomático)",
        "Función renal y calcio (hipercalcemia tumoral)",
        "Sin énfasis en estudios adicionales si fase paliativa establecida",
    ]},
    adm(),
])

# Osteosarcoma
CHECKLISTS["a0b9543b-2ba2-4d90-9933-3b63f74d62cc"] = chk("Pauta de Cotejo — Osteosarcoma", [
    {"label": "Anamnesis", "items": [
        "Dolor óseo localizado, especialmente nocturno",
        "Masa palpable de aparición progresiva",
        "Edad del paciente (frecuente en adolescentes 10-20 años)",
        "Antecedentes de neurofibromatosis o radioterapia previa",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palpación de masa ósea (localización, tamaño, temperatura, dolor)",
        "Limitación funcional de la articulación adyacente",
        "Adenopatías regionales",
        "Signos de fractura patológica",
    ]},
    {"label": "Exámenes", "items": [
        "Radiografía del hueso comprometido AP y lateral (triángulo de Codman, sunburst)",
        "RNM del segmento óseo comprometido con extensión a partes blandas",
        "Fosfatasa alcalina y LDH",
        "Hemograma",
        "Biopsia ósea con informe histológico (previo a tratamiento)",
    ]},
    adm("Derivación urgente a cirugía oncológica/traumatológica"),
])

# DM1
CHECKLISTS["390a2aa6-4b7b-4b4f-8247-192dc6f0d202"] = chk("Pauta de Cotejo — Diabetes Mellitus Tipo 1", [
    {"label": "Anamnesis", "items": [
        "Tiempo de diagnóstico y esquema de insulina actual (tipo, dosis, frecuencia)",
        "Episodios hipoglicémicos graves (convulsión, pérdida de conciencia) en el último año",
        "Episodios de cetoacidosis diabética y frecuencia",
        "Complicaciones ya detectadas: nefropatía, retinopatía, neuropatía, pie diabético",
        "Adherencia al tratamiento y monitoreo glicémico (frecuencia de controles)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Presión arterial",
        "IMC",
        "Inspección de sitios de inyección de insulina (lipodistrofia)",
        "Examen de pies: pulsos pedios, sensibilidad vibratoria y al monofilamento, lesiones",
        "Fondo de ojo (si disponible en APS)",
    ]},
    {"label": "Exámenes", "items": [
        "HbA1c",
        "Glicemia en ayunas",
        "Creatinina y VFGe",
        "Microalbuminuria o RAC (albúmina/creatinina en orina)",
        "Perfil lipídico",
        "TSH (asociación con tiroiditis autoinmune en DM1)",
        "Orina completa",
    ]},
    adm(),
])

# DM2
CHECKLISTS["696ea74c245ef362de4f4339"] = chk("Pauta de Cotejo — Diabetes Mellitus Tipo 2", [
    {"label": "Anamnesis", "items": [
        "Tiempo de diagnóstico y tratamiento actual (hipoglicemiantes orales o insulina)",
        "Control metabólico previo (HbA1c histórica)",
        "Complicaciones: neuropatía, pie diabético, retinopatía, nefropatía",
        "Factores de riesgo cardiovascular asociados (HTA, dislipidemia, tabaquismo)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Presión arterial",
        "IMC y perímetro abdominal",
        "Examen de pies: sensibilidad, pulsos, lesiones activas o cicatrices",
        "Fondo de ojo",
        "Auscultación cardíaca",
    ]},
    {"label": "Exámenes", "items": [
        "HbA1c",
        "Glicemia en ayunas",
        "Creatinina y VFGe",
        "Microalbuminuria o RAC",
        "Perfil lipídico",
        "Orina completa",
    ]},
    adm(),
])

# Hipotiroidismo
CHECKLISTS["696efcff77924d3a78533dce"] = chk("Pauta de Cotejo — Hipotiroidismo", [
    {"label": "Anamnesis", "items": [
        "Tiempo de diagnóstico y dosis actual de levotiroxina",
        "Síntomas actuales: frío, constipación, fatiga, bradipsiquia, aumento de peso, edema",
        "Antecedentes de tiroiditis (Hashimoto), cirugía tiroidea o radioterapia cervical",
        "Adherencia al tratamiento (en ayunas, 30 min antes de alimentos)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Frecuencia cardíaca (bradicardia)",
        "Presión arterial",
        "Piel seca, caída de cabello, voz ronca",
        "Edema palpebral y pretibial (mixedema)",
        "Bocio: tamaño, consistencia, nódulos",
        "Reflejos osteotendinosos (enlentecidos)",
    ]},
    {"label": "Exámenes", "items": [
        "TSH",
        "T4 libre",
        "Anticuerpos anti-TPO (si no determinados previamente)",
        "Hemograma",
        "Colesterol y perfil lipídico",
        "Glicemia",
    ]},
    adm(),
])

# Retinopatía diabética
CHECKLISTS["696ea74c245ef362de4f4337"] = chk("Pauta de Cotejo — Retinopatía Diabética", [
    {"label": "Anamnesis", "items": [
        "Tiempo de diagnóstico de diabetes y control glicémico (HbA1c última)",
        "Tiempo de diagnóstico de retinopatía y tipo (no proliferativa/proliferativa)",
        "Tratamiento ocular previo: fotocoagulación láser, inyecciones intravítreas",
        "Síntomas visuales actuales: visión borrosa, manchas, destellos, pérdida de campo",
    ]},
    {"label": "Examen Clínico", "items": [
        "Agudeza visual con y sin corrección en cada ojo",
        "Presión intraocular",
        "Fondo de ojo con pupila dilatada (descripción de hallazgos)",
        "Evaluación del polo anterior",
    ]},
    {"label": "Exámenes", "items": [
        "HbA1c",
        "Glicemia",
        "Presión arterial registrada",
        "Creatinina",
        "OCT macular (si disponible)",
    ]},
    adm(),
])

# ACV
CHECKLISTS["696efcff77924d3a78533dd5"] = chk("Pauta de Cotejo — ACV", [
    {"label": "Anamnesis", "items": [
        "Tiempo exacto de inicio de síntomas (fundamental para trombolisis)",
        "Tipo de déficit neurológico: motor, sensitivo, afasia, hemianopsia, vértigo",
        "Factores de riesgo: HTA, FA, DM, tabaco, dislipidemia, AIT previo",
        "Tratamiento anticoagulante o antiagregante previo al evento",
    ]},
    {"label": "Examen Clínico", "items": [
        "Escala NIHSS documentada",
        "Presión arterial en ambos brazos",
        "Frecuencia cardíaca y ritmo (fibrilación auricular)",
        "Saturación de O₂",
        "Glicemia capilar",
        "Auscultación carotídea",
    ]},
    {"label": "Exámenes", "items": [
        "TAC de encéfalo sin contraste (urgente)",
        "ECG de 12 derivaciones",
        "Hemograma",
        "Coagulación (TP, TTPA)",
        "Glicemia",
        "Electrolitos",
        "Ecocardiograma y Holter si FA sospechada",
    ]},
    adm("Registro de hora de inicio de síntomas es obligatorio"),
])

# Epilepsia infantil
CHECKLISTS["105de3f0-3055-4cb4-a124-f4b46bcfb945"] = chk("Pauta de Cotejo — Epilepsia Infantil", [
    {"label": "Anamnesis", "items": [
        "Descripción semiológica de las crisis: tipo, duración, frecuencia, factores desencadenantes",
        "Edad de inicio de las crisis",
        "Desarrollo psicomotor y hitos del lenguaje",
        "Historia perinatal (hipoxia, prematurez, malformaciones)",
        "Antecedentes familiares de epilepsia",
        "Tratamiento antiepiléptico actual y respuesta",
    ]},
    {"label": "Examen Clínico", "items": [
        "Examen neurológico completo (tono, reflejos, coordinación)",
        "Perímetro cefálico (macro o microcefalia)",
        "Signos neurocutáneos (manchas café con leche, hipopigmentadas, adenomas sebáceos)",
        "Fondo de ojo",
    ]},
    {"label": "Exámenes", "items": [
        "EEG con informe (incluyendo sueño si disponible)",
        "RNM de encéfalo en protocolo epilepsia",
        "Hemograma",
        "Función hepática y renal",
        "Glicemia y electrolitos",
        "Nivel sérico del antiepiléptico en uso",
    ]},
    adm(),
])

# Epilepsia adulto
CHECKLISTS["3a6e79f1-9214-48f7-acdf-5b740de89486"] = chk("Pauta de Cotejo — Epilepsia Adulto", [
    {"label": "Anamnesis", "items": [
        "Tipo y semiología de las crisis (focal, generalizada, secundariamente generalizada)",
        "Frecuencia de crisis y fecha de la última",
        "Factores desencadenantes (privación de sueño, alcohol, estrés)",
        "Medicación antiepiléptica actual: fármaco, dosis, adherencia",
        "Antecedentes de TEC, meningitis, ACV, tumor cerebral",
    ]},
    {"label": "Examen Clínico", "items": [
        "Examen neurológico completo",
        "Estado cognitivo basal (orientación, memoria)",
        "Signos de traumatismos recientes",
        "Temperatura (si sospecha crisis febril)",
    ]},
    {"label": "Exámenes", "items": [
        "EEG con informe",
        "RNM de encéfalo (protocolo epilepsia)",
        "Niveles séricos del antiepiléptico en uso",
        "Hemograma",
        "Función hepática y renal",
        "Glicemia y electrolitos",
    ]},
    adm(),
])

# Parkinson
CHECKLISTS["32cec82e-412a-4d75-89fc-f0f6e3bc252d"] = chk("Pauta de Cotejo — Parkinson", [
    {"label": "Anamnesis", "items": [
        "Antecedentes de comorbilidades y tratamiento farmacológico (detallar fármacos del último año; sospechar parkinsonismo por fármacos o vascular)",
        "Tiempo de los síntomas: data de inicio de síntomas",
    ]},
    {"label": "Examen Clínico", "items": [
        "Presencia de temblores involuntarios",
        "Enlentecimiento (bradicinesia)",
        "Inestabilidad postural",
        "Trastornos de la marcha",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma",
        "Función renal y hepática",
        "Glicemia",
        "Electrolitos plasmáticos",
        "Función tiroidea (TSH)",
    ]},
    {"label": "Registro en MLE", "items": [
        "Marcar patología como NO GES al derivar a confirmación diagnóstica y especificar el problema de salud",
        "Casos confirmados en tratamiento: derivar como GES a control",
        "Casos confirmados por neurólogo del extrasistema no requieren nueva derivación; puede ser confirmado por APS",
    ]},
    adm("Interconsulta a neurología adulto"),
])

# Esclerosis múltiple
CHECKLISTS["ef881e41-0fd1-47c9-aab9-0d0292a2a485"] = chk("Pauta de Cotejo — Esclerosis Múltiple", [
    {"label": "Anamnesis", "items": [
        "Episodios neurológicos previos (brotes): síntomas, duración y recuperación",
        "Síntomas actuales y tiempo de evolución",
        "Terapia modificadora de enfermedad actual y respuesta",
        "Antecedentes familiares de EM",
    ]},
    {"label": "Examen Clínico", "items": [
        "Escala EDSS documentada",
        "Evaluación de visión (neuritis óptica), motricidad, coordinación, sensibilidad",
        "Signo de Lhermitte (sensación eléctrica a la flexión cervical)",
        "Valoración cognitiva breve",
        "Signos de Uhthoff (empeoramiento con calor)",
    ]},
    {"label": "Exámenes", "items": [
        "RNM de encéfalo y médula espinal con gadolinio (protocolo EM)",
        "Potenciales evocados visuales",
        "Estudio LCR: bandas oligoclonales e índice IgG (si disponible)",
        "Hemograma",
        "Función hepática y renal (previo a inmunomoduladores)",
    ]},
    adm(),
])

# Alzheimer
CHECKLISTS["696ea74c245ef362de4f4338"] = chk("Pauta de Cotejo — Alzheimer / Demencia", [
    {"label": "Anamnesis", "items": [
        "Tiempo de evolución del deterioro cognitivo y descripción de síntomas (memoria, lenguaje, orientación, conducta)",
        "Funcionalidad previa y actual (AVD básicas e instrumentales; CDR o escala funcional)",
        "Antecedentes familiares de demencia",
        "Medicamentos que pueden causar deterioro cognitivo (anticolinérgicos, benzodiacepinas)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Mini-Mental State Examination (MMSE) con puntaje documentado",
        "Evaluación conductual (agitación, alucinaciones, desinhibición)",
        "Signos neurológicos focales",
        "Marcha y riesgo de caídas",
        "Presión arterial ortostática",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma",
        "Glicemia",
        "TSH",
        "Vitamina B12 y ácido fólico",
        "Función hepática y renal",
        "RNM de encéfalo (atrofia, ACV)",
        "Serología VIH (según criterio clínico)",
    ]},
    adm(),
])

# Tumores SNC
CHECKLISTS["0e3b7497-b79c-470a-a320-e2f542568c29"] = chk("Pauta de Cotejo — Tumores SNC", [
    {"label": "Anamnesis", "items": [
        "Síntomas: cefalea de predominio nocturno/matutino, convulsiones, déficit neurológico focal, cambios conductuales o de personalidad",
        "Tiempo de evolución y progresión",
        "Antecedentes de neoplasia primaria conocida (metástasis)",
        "Uso de corticoides y respuesta",
    ]},
    {"label": "Examen Clínico", "items": [
        "Escala ECOG",
        "Examen neurológico completo (pares craneales, motor, sensitivo, cerebeloso)",
        "Signos de hipertensión endocraneana (papiledema, bradicardia, HTA)",
        "Fondo de ojo",
    ]},
    {"label": "Exámenes", "items": [
        "RNM de encéfalo con y sin gadolinio (protocolo tumor)",
        "Hemograma",
        "Función hepática y renal",
        "Coagulación",
        "TAC tórax-abdomen-pelvis si sospecha de metástasis cerebrales",
    ]},
    adm(),
])

# Esquizofrenia
CHECKLISTS["ec705134-c8cf-4c83-86f3-7dce68dcf20a"] = chk("Pauta de Cotejo — Esquizofrenia", [
    {"label": "Anamnesis", "items": [
        "Tiempo de diagnóstico y número de hospitalizaciones psiquiátricas previas",
        "Síntomas actuales: positivos (alucinaciones, delirios) y negativos (alogia, abulia, aplanamiento afectivo)",
        "Antipsicótico actual: nombre, dosis, vía, adherencia",
        "Consumo de sustancias (alcohol, cannabis, cocaína)",
        "Comorbilidades médicas",
    ]},
    {"label": "Examen Clínico", "items": [
        "Examen del estado mental: orientación, afecto, ideación, juicio",
        "Signos extrapiramidales: rigidez, temblor, bradicinesia, discinesia tardía",
        "Estado nutricional",
        "Signos vitales y peso (metabólico)",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma",
        "Glicemia y perfil lipídico (síndrome metabólico)",
        "Función hepática",
        "Función renal",
        "ECG (QTc prolongado con antipsicóticos)",
        "Nivel sérico de antipsicótico si aplica",
    ]},
    adm(),
])

# Depresión
CHECKLISTS["696efcff77924d3a78533dca"] = chk("Pauta de Cotejo — Depresión", [
    {"label": "Anamnesis", "items": [
        "Tiempo de evolución del episodio actual y número de episodios previos",
        "Síntomas: ánimo depresivo, anhedonia, insomnio/hipersomnia, cambios en apetito y peso, fatiga, ideación suicida",
        "Ideación o intentos de suicidio (activos o pasados)",
        "Antidepresivo actual y adherencia",
        "Antecedentes de episodios maníacos (descartar bipolar)",
        "Consumo de sustancias y factores psicosociales relevantes",
    ]},
    {"label": "Examen Clínico", "items": [
        "Escala PHQ-9 o Hamilton documentada con puntaje",
        "Evaluación de riesgo suicida explícita",
        "Estado mental: orientación, afecto, ideación suicida/homicida",
        "Estado nutricional",
    ]},
    {"label": "Exámenes", "items": [
        "TSH (descartar hipotiroidismo como causa)",
        "Hemograma",
        "Glicemia",
        "Función hepática",
        "Vitamina B12 y ácido fólico",
    ]},
    adm(),
])

# Trastorno bipolar
CHECKLISTS["e816b3ce-91f8-4659-8586-a7c551125239"] = chk("Pauta de Cotejo — Trastorno Bipolar", [
    {"label": "Anamnesis", "items": [
        "Número de episodios maníacos y depresivos y hospitalizaciones previas",
        "Estado actual del ánimo (eutímico, maníaco, hipomaníaco, depresivo)",
        "Estabilizador del ánimo actual: fármaco, dosis, adherencia",
        "Antecedentes familiares de TB o psicosis",
        "Consumo de sustancias",
    ]},
    {"label": "Examen Clínico", "items": [
        "Examen del estado mental completo",
        "Peso y signos de síndrome metabólico",
        "Signos vitales",
        "Evaluación de riesgo (suicida o de daño a otros)",
    ]},
    {"label": "Exámenes", "items": [
        "Litemia (si en tratamiento con litio; rango terapéutico 0.6-1.2 mEq/L)",
        "Creatinina y función renal (litio)",
        "TSH (litio causa hipotiroidismo)",
        "Nivel de ácido valproico o carbamazepina si aplica",
        "Hemograma",
        "Función hepática",
        "Glicemia y perfil lipídico",
    ]},
    adm(),
])

# Alcohol/drogas
CHECKLISTS["dd0b1b9f-0848-48ab-9e9f-82aaef29e772"] = chk("Pauta de Cotejo — Consumo Problemático Alcohol/Drogas", [
    {"label": "Anamnesis", "items": [
        "Sustancias utilizadas, cantidad y tiempo de uso",
        "Última dosis y síntomas de abstinencia actuales",
        "Intentos de desintoxicación previos y resultados",
        "Tratamiento actual (metadona, buprenorfina si dependencia a opioides)",
        "Comorbilidades psiquiátricas (depresión, ansiedad, psicosis)",
        "Situación social y familiar",
    ]},
    {"label": "Examen Clínico", "items": [
        "Signos de abstinencia: temblor, sudoración, taquicardia, agitación",
        "Estigmas de consumo crónico: hepatomegalia, telangiectasias, eritema palmar",
        "Examen del estado mental",
        "Escala AUDIT (alcohol) o DAST (drogas) con puntaje",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma (VCM elevado en alcoholismo)",
        "Función hepática: GGT, transaminasas, bilirrubina",
        "Glicemia",
        "Perfil lipídico",
        "Serología: VIH, hepatitis B y C",
        "Tóxico en orina (si aplica)",
    ]},
    adm(),
])

# EPOC
CHECKLISTS["696efcff77924d3a78533dcc"] = chk("Pauta de Cotejo — EPOC", [
    {"label": "Anamnesis", "items": [
        "Historia de tabaquismo (paquetes-año y estado actual: activo/exfumador)",
        "Disnea: escala mMRC (0-4)",
        "Exacerbaciones en el último año: número y hospitalizaciones",
        "Tratamiento inhalatorio actual (SABA, LABA, LAMA, CI): técnica y adherencia",
        "Comorbilidades cardiovasculares",
    ]},
    {"label": "Examen Clínico", "items": [
        "Saturación de O₂ basal",
        "Frecuencia respiratoria",
        "Auscultación pulmonar: sibilancias, murmullo disminuido, roncus",
        "Uso de musculatura accesoria, respiración labio fruncido",
        "Signos de cor pulmonale: edema, ingurgitación yugular",
        "IMC (bajo peso en EPOC avanzado)",
    ]},
    {"label": "Exámenes", "items": [
        "Espirometría post-broncodilatador (VEF1/CVF < 0.70; VEF1 % teórico)",
        "Radiografía de tórax AP",
        "Hemograma (poliglobulia)",
        "Gasometría arterial si VEF1 < 50% o SatO₂ < 92%",
    ]},
    adm(),
])

# Asma pediátrico
CHECKLISTS["696efcff77924d3a78533dcb"] = chk("Pauta de Cotejo — Asma Pediátrico", [
    {"label": "Anamnesis", "items": [
        "Síntomas: sibilancias, tos nocturna, disnea de esfuerzo",
        "Frecuencia de crisis, hospitalizaciones y uso de broncodilatador de rescate (SOS)",
        "Antecedentes atópicos: rinitis, dermatitis atópica, alergia alimentaria",
        "Tratamiento de mantención actual y adherencia",
        "Exposición a tabaco ambiental, polvo de habitación, mascotas",
    ]},
    {"label": "Examen Clínico", "items": [
        "Saturación de O₂",
        "Frecuencia respiratoria",
        "Auscultación pulmonar: sibilancias, prolongación espiratoria",
        "Signos de atopia: conjuntivitis, rinitis, eczema",
        "Talla y peso (percentiles): crecimiento",
    ]},
    {"label": "Exámenes", "items": [
        "Espirometría con prueba broncodilatadora (si > 5 años)",
        "Peak flow y variabilidad (si disponible)",
        "Hemograma con diferencial (eosinofilia)",
        "IgE total",
        "Radiografía de tórax en primera evaluación",
    ]},
    adm(),
])

# Asma adulto
CHECKLISTS["497a8ff3-6423-4261-b832-21f370f9cec9"] = chk("Pauta de Cotejo — Asma Adulto", [
    {"label": "Anamnesis", "items": [
        "Control actual del asma (test ACT o clasificación GINA documentada)",
        "Exacerbaciones en el último año y hospitalizaciones",
        "Factores desencadenantes identificados (alérgenos, ejercicio, AINE, frío)",
        "Tratamiento de mantención (CI, LABA): nombre, dosis, técnica inhalatoria",
        "Historia ocupacional y tabaquismo",
    ]},
    {"label": "Examen Clínico", "items": [
        "Saturación de O₂",
        "Frecuencia respiratoria",
        "Auscultación pulmonar: sibilancias, prolongación espiratoria",
        "Signos de rinitis alérgica",
        "IMC",
    ]},
    {"label": "Exámenes", "items": [
        "Espirometría con prueba broncodilatadora (VEF1/CVF, VEF1 %)",
        "Peak flow y variabilidad",
        "IgE total y prick test (si disponible)",
        "Hemograma con diferencial",
        "Radiografía de tórax",
    ]},
    adm(),
])

# Fibrosis quística
CHECKLISTS["734b76cc-c348-4156-b6a4-044b22f72476"] = chk("Pauta de Cotejo — Fibrosis Quística", [
    {"label": "Anamnesis", "items": [
        "Método diagnóstico: test del sudor (Cl > 60 mEq/L) o mutaciones CFTR identificadas",
        "Función pulmonar actual (VEF1 % teórico y comparación con basal)",
        "Colonización bacteriana crónica: Pseudomonas aeruginosa, S. aureus (MRSA)",
        "Insuficiencia pancreática exocrina y dosis de enzimas",
        "Tratamiento actual: DNasa, azithromicina, moduladores CFTR",
    ]},
    {"label": "Examen Clínico", "items": [
        "Saturación de O₂ basal",
        "Auscultación pulmonar: crepitaciones, sibilancias",
        "Estado nutricional: IMC y curvas de crecimiento",
        "Dedos en palillo de tambor",
        "Signos de cor pulmonale",
    ]},
    {"label": "Exámenes", "items": [
        "Espirometría (VEF1)",
        "Cultivo de expectoración o hisopado faríngeo",
        "Hemograma",
        "Función hepática",
        "Vitaminas liposolubles: A, D, E, K",
        "Glicemia (screening de CFRD: diabetes relacionada a FQ)",
    ]},
    adm(),
])

# Rehab post-COVID
CHECKLISTS["5a93339d-f5e8-499a-896a-edee30086b1c"] = chk("Pauta de Cotejo — Rehabilitación Post-COVID", [
    {"label": "Anamnesis", "items": [
        "Antecedentes de COVID-19: fecha, gravedad (ambulatorio/hospitalizado/UCI), ventilación mecánica",
        "Síntomas persistentes actuales: disnea, fatiga crónica, fog cognitivo, dolor torácico, palpitaciones",
        "Tiempo de evolución post-COVID (> 4 semanas de síntomas persistentes)",
        "Comorbilidades previas y nivel de actividad física antes del COVID",
    ]},
    {"label": "Examen Clínico", "items": [
        "Saturación de O₂ basal y de esfuerzo (test de 1 min sentarse/pararse)",
        "Frecuencia cardíaca y respiratoria",
        "Auscultación pulmonar",
        "Evaluación cognitiva breve (orientación, concentración)",
        "Fuerza muscular de extremidades",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma",
        "Dímero D",
        "Función renal y hepática",
        "PCR",
        "Radiografía o TAC de tórax (si síntomas respiratorios persistentes)",
        "Espirometría (si síntomas respiratorios)",
        "ECG",
    ]},
    adm(),
])

# Escoliosis
CHECKLISTS["0d625400-8943-465b-a784-5ba7257ee429"] = chk("Pauta de Cotejo — Escoliosis", [
    {"label": "Anamnesis", "items": [
        "Edad de inicio de la deformidad y progresión",
        "Menarquia (en mujeres) y madurez esquelética estimada",
        "Dolor dorsal o lumbar asociado",
        "Antecedentes familiares de escoliosis",
        "Compromiso respiratorio o neurológico (disnea, debilidad)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Test de Adams (inclinación anterior: giba costal o lumbar)",
        "Medición clínica de la desviación lateral",
        "Evaluación de madurez esquelética (Risser)",
        "Examen neurológico de extremidades inferiores (fuerza, sensibilidad, reflejos)",
        "Evaluación de hombros y nivelación de pelvis",
    ]},
    {"label": "Exámenes", "items": [
        "Radiografía de columna total AP y lateral en bipedestación (medición ángulo de Cobb)",
        "Radiografía de mano izquierda (edad ósea, Risser)",
        "Espirometría si curva > 60° o compromiso respiratorio clínico",
    ]},
    adm(),
])

# Endoprótesis cadera
CHECKLISTS["16fa6559-f50b-4c99-89f7-33b1e82e6183"] = chk("Pauta de Cotejo — Endoprótesis Total de Cadera", [
    {"label": "Anamnesis", "items": [
        "Dolor en cadera: intensidad (EVA), localización, irradiación, relación con el movimiento",
        "Limitación funcional (escala de Lequesne ≥ 10 o Harris Hip Score)",
        "Tratamiento conservador previo: AINE, kinesioterapia, infiltraciones y tiempo",
        "Comorbilidades para evaluación de riesgo quirúrgico (DM, cardiopatía, anticoagulación)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Movilidad de cadera: flexión, rotación interna y externa, abducción",
        "Marcha (cojera, Trendelenburg, uso de bastón)",
        "Longitud de extremidades (diferencia)",
        "Crepitación y dolor a la movilización",
    ]},
    {"label": "Exámenes", "items": [
        "Radiografía de pelvis AP y axial de cadera (grado Kellgren-Lawrence)",
        "Hemograma",
        "Coagulación: TP y TTPA",
        "Función renal",
        "Glicemia",
        "ECG preoperatorio",
        "Grupo ABO-Rh",
    ]},
    adm(),
])

# Artrosis
CHECKLISTS["696efcff77924d3a78533dcd"] = chk("Pauta de Cotejo — Artrosis", [
    {"label": "Anamnesis", "items": [
        "Articulaciones comprometidas y tiempo de evolución",
        "Dolor y limitación funcional (EVA; escala WOMAC si rodilla/cadera)",
        "Tratamiento previo: AINE, kinesioterapia, infiltraciones y respuesta",
        "Comorbilidades relevantes para AINE (HTA, DM, patología renal, úlcera)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Crepitación articular a la movilización pasiva",
        "Movilidad activa y pasiva de articulaciones comprometidas",
        "Signos inflamatorios: calor, edema, derrame articular",
        "Deformidades articulares (varo/valgo rodillas)",
        "Fuerza muscular periarticular",
    ]},
    {"label": "Exámenes", "items": [
        "Radiografía de articulaciones comprometidas AP y lateral (pinzamiento, osteofitos, esclerosis)",
        "Hemograma",
        "VHS y PCR (descartar artritis inflamatoria)",
        "Ácido úrico (descartar gota)",
        "Función renal",
    ]},
    adm(),
])

# HNP lumbar
CHECKLISTS["aa072279-9dbe-4704-b0aa-099292715a51"] = chk("Pauta de Cotejo — HNP Lumbar", [
    {"label": "Anamnesis", "items": [
        "Lumbociática: dermátomo afectado, intensidad (EVA) y tiempo de evolución",
        "Déficit neurológico motor: pie caído, debilidad de extremidad",
        "Síntomas de síndrome de cola de caballo: retención urinaria, incontinencia fecal o urinaria (URGENCIA)",
        "Tratamiento previo: analgésicos, kinesioterapia, infiltraciones y respuesta",
    ]},
    {"label": "Examen Clínico", "items": [
        "Reflejos osteotendinosos: patelar (L4) y aquiliano (S1)",
        "Sensibilidad en dermátomos L4, L5, S1",
        "Fuerza muscular en MMII (cuádriceps, tibial anterior, extensores dedos, flexores plantares)",
        "Signo de Lasègue (reprodución del dolor radicular)",
        "Marcha en puntas y talones",
        "Examen de esfínteres si hay síntomas",
    ]},
    {"label": "Exámenes", "items": [
        "RNM de columna lumbosacra (nivel, tipo y grado de hernia; compromiso radicular)",
        "Hemograma",
        "Función renal",
    ]},
    adm("Derivación urgente si síndrome de cola de caballo"),
])

# Colecistectomía
CHECKLISTS["696efcff77924d3a78533dcf"] = chk("Pauta de Cotejo — Colecistectomía Laparoscópica", [
    {"label": "Anamnesis", "items": [
        "Cólicos biliares: frecuencia, severidad, relación con comidas grasas",
        "Episodios de ictericia, fiebre o colangitis previos",
        "Pancreatitis biliar documentada",
        "Comorbilidades para evaluación de riesgo quirúrgico (DM, cardiopatía, obesidad mórbida)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Signo de Murphy (dolor en hipocondrio derecho a la palpación durante inspiración)",
        "Ictericia escleral y cutánea",
        "Signo de Courvoisier (vesícula palpable sin dolor)",
        "Estado nutricional",
    ]},
    {"label": "Exámenes", "items": [
        "Ecografía abdominal con informe (colelitiasis, coledocolitiasis, pared vesicular)",
        "Hemograma",
        "Función hepática: bilirrubina, GGT, FA, transaminasas",
        "Función renal",
        "Coagulación: TP y TTPA",
        "Glicemia",
        "ECG preoperatorio",
    ]},
    adm(),
])

# Fisura labiopalatina
CHECKLISTS["40389e49-9062-4fe4-830c-6fc7ff69bccf"] = chk("Pauta de Cotejo — Fisura Labiopalatina", [
    {"label": "Anamnesis", "items": [
        "Tipo de fisura: labio, paladar o ambos; unilateral o bilateral",
        "Antecedentes familiares de fisura",
        "Dificultad para alimentarse (succión, regurgitación nasal)",
        "Otitis medias recurrentes",
        "Edad y peso actual del paciente",
    ]},
    {"label": "Examen Clínico", "items": [
        "Descripción de la fisura: extensión y compromiso de estructuras (úvula, velo, paladar duro, reborde alveolar, labio)",
        "Evaluación del desarrollo pondoestatural",
        "Otoscopía",
        "Dismorfias craneofaciales asociadas (síndrome)",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma",
        "Función hepática y renal",
        "Otoemisiones acústicas o audiometría",
        "Evaluación genética si dismorfias asociadas",
    ]},
    adm(),
])

# Displasia de cadera
CHECKLISTS["077e850d-cded-4863-aa08-113e7d59aab0"] = chk("Pauta de Cotejo — Displasia del Desarrollo de Cadera", [
    {"label": "Anamnesis", "items": [
        "Edad de diagnóstico y método: screening neonatal, ecografía o examen clínico",
        "Factores de riesgo: primogénita, presentación podálica, antecedentes familiares",
        "Uso previo de arnés (Pavlik) u ortesis y tiempo de tratamiento",
        "Síntomas actuales: cojera, asimetría de pliegues, acortamiento",
    ]},
    {"label": "Examen Clínico", "items": [
        "Signo de Ortolani (reducción) y Barlow (luxación) en menores de 3 meses",
        "Limitación de abducción de caderas (< 60°)",
        "Asimetría de pliegues inguinales y glúteos",
        "Diferencia de longitud de extremidades",
        "Marcha (en niños que caminan): Trendelenburg, cojera",
    ]},
    {"label": "Exámenes", "items": [
        "Ecografía de caderas (clasificación de Graf) en menores de 3-4 meses",
        "Radiografía de pelvis AP en mayores de 4-6 meses (índice acetabular, línea de Hilgenreiner)",
    ]},
    adm(),
])

# Cataratas
CHECKLISTS["696efcff77924d3a78533dd0"] = chk("Pauta de Cotejo — Cataratas", [
    {"label": "Anamnesis", "items": [
        "Disminución de agudeza visual: tiempo de evolución y progresión",
        "Deslumbramiento, halos alrededor de luces, diplopía monocular",
        "Antecedentes de DM, uso crónico de corticoides, trauma ocular, uveítis",
        "Repercusión en actividades cotidianas (conducción, lectura, escaleras)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Agudeza visual con y sin corrección (Snellen) en cada ojo",
        "Biomicroscopía de polo anterior: tipo y grado de opacidad del cristalino (LOCS III)",
        "Presión intraocular",
        "Fondo de ojo con pupila dilatada",
    ]},
    {"label": "Exámenes", "items": [
        "Agudeza visual documentada por ojo",
        "Biometría ocular (A-scan o IOL Master para cálculo de LIO)",
        "Hemograma",
        "Glicemia",
        "Coagulación",
        "ECG si ≥ 60 años",
    ]},
    adm(),
])

# Vicios de refracción
CHECKLISTS["d4d5f0b5-c80f-47d0-87a2-2b821d6643ac"] = chk("Pauta de Cotejo — Vicios de Refracción", [
    {"label": "Anamnesis", "items": [
        "Síntomas: visión borrosa (lejos, cerca o ambas), cefalea frontal, fatiga visual",
        "Edad de inicio y antecedentes familiares de miopía/hipermetropía/astigmatismo",
        "Uso previo de lentes y graduación",
        "Actividades visuales del paciente (escolaridad, trabajo)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Agudeza visual sin corrección y con estenopeico en cada ojo",
        "Refracción objetiva (esquiascopía o refractómetro automático)",
        "Refracción subjetiva manifiesta",
        "Biomicroscopía de polo anterior",
        "Presión intraocular",
    ]},
    {"label": "Exámenes", "items": [
        "Refractometría documentada por ojo",
        "Topografía corneal si sospecha de queratocono o astigmatismo irregular",
        "No se requieren exámenes de laboratorio de rutina",
    ]},
    adm(),
])

# Estrabismo
CHECKLISTS["621eace6-3e44-48ff-b43a-12ab248095a9"] = chk("Pauta de Cotejo — Estrabismo", [
    {"label": "Anamnesis", "items": [
        "Tipo de desviación observada: esotropia, exotropia, hipertropia",
        "Constante o intermitente; distancia y cerca",
        "Edad de inicio",
        "Uso de parches (oclusión) o lentes previos",
        "Ambliopía diagnosticada previamente",
        "Antecedentes de cirugía ocular",
    ]},
    {"label": "Examen Clínico", "items": [
        "Agudeza visual con y sin corrección en cada ojo",
        "Reflejo corneal de Hirschberg",
        "Cover test (unilateral y alternante, lejos y cerca)",
        "Motilidad ocular en 9 posiciones de mirada",
        "Refracción bajo cicloplejia (atropina en niños)",
    ]},
    {"label": "Exámenes", "items": [
        "Refractometría bajo cicloplejia documentada",
        "Agudeza visual por ojo documentada",
        "Fondo de ojo con pupila dilatada",
        "No se requieren exámenes de laboratorio de rutina",
    ]},
    adm(),
])

# Desprendimiento de retina
CHECKLISTS["2b610547-f2bd-43c5-87ad-e6efc78d1e62"] = chk("Pauta de Cotejo — Desprendimiento de Retina", [
    {"label": "Anamnesis", "items": [
        "Fotopsias (destellos) y miodesopsias (manchas flotantes): tiempo de aparición",
        "Pérdida de campo visual en forma de cortina oscura",
        "Historia de miopía severa o trauma ocular",
        "Cirugía ocular previa",
        "Estado del ojo contralateral",
    ]},
    {"label": "Examen Clínico", "items": [
        "Agudeza visual con y sin corrección",
        "Presión intraocular",
        "Biomicroscopía con lente de 78D o 90D (localización de desgarros)",
        "Fondo de ojo dilatado (extensión del DR, tipo: regmatógeno, traccional, exudativo)",
        "Indentación escleral con depresión escleral si posible",
    ]},
    {"label": "Exámenes", "items": [
        "Ecografía ocular modo B si el fondo de ojo no es visible",
        "Hemograma y coagulación (previo a cirugía)",
        "Glicemia si DM",
    ]},
    adm("Derivación URGENTE a oftalmología — riesgo de ceguera irreversible"),
])

# Hipoacusia adulto
CHECKLISTS["23e4223d-7d08-4c8f-8cce-34840f8d0fca"] = chk("Pauta de Cotejo — Hipoacusia Adulto", [
    {"label": "Anamnesis", "items": [
        "Tipo: unilateral o bilateral; conducción o sensorioneural",
        "Tiempo de evolución y progresión",
        "Tinnitus o acúfenos y vértigo asociado",
        "Exposición a ruido laboral o recreacional",
        "Uso de ototóxicos (aminoglucósidos, cisplatino, furosemida)",
        "Antecedentes de otitis, trauma o cirugía de oído",
    ]},
    {"label": "Examen Clínico", "items": [
        "Otoscopía: CAE y membrana timpánica (perforación, retracción, efusión)",
        "Prueba de voz cuchicheo",
        "Diapasones: Rinne (512 Hz) y Weber",
        "Evaluación del equilibrio si vértigo asociado",
        "Pares craneales",
    ]},
    {"label": "Exámenes", "items": [
        "Audiometría tonal liminar con impedanciometría (timpanometría y reflejos estapediales)",
        "Logoaudiometría (discriminación de la palabra)",
        "Potenciales evocados auditivos del tronco (BERA) si sospecha retrococlear",
        "Hemograma",
        "TSH si sospecha hipotiroidismo como causa",
    ]},
    adm(),
])

# Hipoacusia pediátrico
CHECKLISTS["1f8b7f23-acd8-4758-a8f6-cee6d23b9537"] = chk("Pauta de Cotejo — Hipoacusia Pediátrico", [
    {"label": "Anamnesis", "items": [
        "Resultado de otoemisiones acústicas al nacer",
        "Antecedentes perinatales: prematurez, hipoxia neonatal, hiperbilirrubinemia, infecciones TORCH",
        "Antecedentes de meningitis, parotiditis o encefalitis",
        "Historia familiar de hipoacusia congénita",
        "Hitos del lenguaje: edad de primeras palabras, frases, grado de comprensión",
    ]},
    {"label": "Examen Clínico", "items": [
        "Otoscopía",
        "Observación de respuesta a sonidos según edad",
        "Evaluación del desarrollo del lenguaje",
        "Dismorfias craneofaciales asociadas (síndrome de Waardenburg, BOR, etc.)",
        "Pares craneales",
    ]},
    {"label": "Exámenes", "items": [
        "Audiometría con refuerzo visual (6-24 meses) o audiometría de juego (2-5 años)",
        "Potenciales evocados auditivos de tronco (BERA/ABR) si no coopera",
        "Impedanciometría",
        "Otoemisiones acústicas",
        "TSH y función renal (síndrome de Pendred)",
    ]},
    adm(),
])

# Artritis reumatoidea
CHECKLISTS["adfbd7d1-2956-466b-add3-facdd6ef3f01"] = chk("Pauta de Cotejo — Artritis Reumatoidea", [
    {"label": "Anamnesis", "items": [
        "Articulaciones comprometidas y distribución (sinovitis simétrica de pequeñas articulaciones)",
        "Tiempo de evolución de síntomas articulares (> 6 semanas para criterios ACR/EULAR 2010)",
        "Rigidez matutina: duración en minutos",
        "Tratamiento actual: AINE, cloroquina, metotrexato, leflunomida, biológico",
        "Comorbilidades (pulmonares, cardiovasculares)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Signos inflamatorios articulares: sinovitis, calor, edema, dolor a la compresión",
        "Articulaciones comprometidas: DIP, PIP, MCF, muñecas, codos, rodillas, tobillos",
        "Nódulos reumatoideos",
        "Compromiso extraarticular: ojos (queratoconjuntivitis seca), pulmón",
    ]},
    {"label": "Exámenes", "items": [
        "Factor reumatoideo cuantitativo",
        "Anti-CCP (anticuerpos antipéptido cíclico citrulinado)",
        "Hemograma",
        "VHS y PCR",
        "Función hepática y renal (previo a DMARD)",
        "Radiografía de manos y muñecas AP (erosiones, osteopenia periarticular)",
    ]},
    adm(),
])

# Artritis juvenil
CHECKLISTS["403033ae-7f8d-4d50-842c-22df45a881eb"] = chk("Pauta de Cotejo — Artritis Idiopática Juvenil", [
    {"label": "Anamnesis", "items": [
        "Edad de inicio y tipo de compromiso articular (oligoarticular, poliarticular, sistémico)",
        "Fiebre, rash, uveítis o serositis",
        "Impacto en escolaridad y actividades cotidianas",
        "Tratamiento actual: AINE, metotrexato, biológico",
        "Antecedentes familiares de artritis o espondiloartropatía",
    ]},
    {"label": "Examen Clínico", "items": [
        "Recuento de articulaciones activas (dolor y edema)",
        "Signos inflamatorios articulares",
        "Examen ocular (rash malar, uveítis anterior — requiere lámpara de hendidura)",
        "Estado de crecimiento: talla y peso en percentiles",
        "Rash de Still (evanescente, salmón) y linfoadenopatías en forma sistémica",
    ]},
    {"label": "Exámenes", "items": [
        "Factor reumatoideo y anti-CCP",
        "ANA (anticuerpos antinucleares)",
        "Hemograma",
        "VHS y PCR",
        "Función hepática y renal",
        "Radiografía de articulaciones comprometidas",
        "Evaluación oftalmológica con lámpara de hendidura (uveítis)",
    ]},
    adm(),
])

# Lupus
CHECKLISTS["92f86d68-fcb0-408c-8236-3e93c9ad00bc"] = chk("Pauta de Cotejo — Lupus Eritematoso Sistémico", [
    {"label": "Anamnesis", "items": [
        "Síntomas: fotosensibilidad, rash malar, artritis, serositis, úlceras orales, alopecia",
        "Síntomas renales: edema, hematuria, proteinuria",
        "Síntomas neuropsiquiátricos: convulsiones, psicosis, cefalea intensa",
        "Tiempo de diagnóstico y tratamiento actual (hidroxicloroquina, prednisona, inmunosupresor)",
        "Brotes previos y órganos comprometidos en cada brote",
    ]},
    {"label": "Examen Clínico", "items": [
        "Rash malar (eritema en alas de mariposa), lesiones discoides, fotosensibilidad",
        "Artritis (articulaciones inflamadas, sin deformidad)",
        "Presión arterial y edema (nefritis lúpica)",
        "Serositis: frote pericárdico, pleurítico",
        "Examen neurológico",
        "Adenopatías y esplenomegalia",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma con diferencial (leucopenia, trombocitopenia, anemia hemolítica)",
        "ANA y anti-dsDNA",
        "Complemento C3 y C4",
        "Anti-Sm, anti-SSA/Ro, anti-SSB/La",
        "VHS y PCR",
        "Creatinina, orina completa con sedimento, proteinuria/creatinuria (RAC)",
        "Anticuerpos antifosfolípidos: ACLA y anticoagulante lúpico",
        "Función hepática",
    ]},
    adm(),
])

# Helicobacter pylori
CHECKLISTS["ad54ffbe-d515-4619-a151-eb3c8b444423"] = chk("Pauta de Cotejo — Helicobacter pylori", [
    {"label": "Anamnesis", "items": [
        "Síntomas: epigastralgia, náuseas, pirosis, dispepsia, saciedad precoz",
        "Antecedentes de úlcera gástrica o duodenal documentada",
        "Tratamiento previo de erradicación y resultado (test de control)",
        "Uso crónico de AINE o aspirina",
        "Antecedentes familiares de cáncer gástrico",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palpación epigástrica (dolor, masa)",
        "Signos de alarma: baja de peso, vómitos, disfagia, hemorragia digestiva",
        "Estado nutricional",
        "Signos de anemia (palidez, taquicardia)",
    ]},
    {"label": "Exámenes", "items": [
        "Test diagnóstico de H. pylori: test del aliento con ¹³C-urea o antígeno en deposiciones",
        "Endoscopía digestiva alta con biopsia (si síntomas de alarma, > 45 años, o úlcera)",
        "Hemograma",
        "Función hepática básica",
    ]},
    adm(),
])

# Hepatitis B
CHECKLISTS["4da81a6d-68b3-4223-b78e-0d4eae135371"] = chk("Pauta de Cotejo — Hepatitis B", [
    {"label": "Anamnesis", "items": [
        "Forma de diagnóstico: screening, síntomas o contacto",
        "Factores de riesgo: contacto sexual, transfusiones, UDIV, vertical",
        "Estado: portador inactivo, hepatitis crónica activa, cirrosis",
        "Tratamiento antiviral actual y respuesta",
        "Historia de hepatitis delta (VHD) coinfección",
    ]},
    {"label": "Examen Clínico", "items": [
        "Ictericia escleral y cutánea",
        "Hepatomegalia y esplenomegalia",
        "Signos de cirrosis: eritema palmar, telangiectasias arácneas, ascitis",
        "Adenopatías",
        "Estado general (ECOG si cirrosis)",
    ]},
    {"label": "Exámenes", "items": [
        "Perfil serológico: HBsAg, HBeAg, Anti-HBe, Anti-HBs, Anti-HBc total e IgM",
        "ADN VHB cuantitativo (carga viral)",
        "Transaminasas (ALT, AST)",
        "Bilirrubina total y directa",
        "Albúmina, TP/INR (función hepática)",
        "Hemograma",
        "Ecografía abdominal con informe",
        "AFP si cirrosis (screening CHC)",
    ]},
    adm(),
])

# Hepatitis C
CHECKLISTS["67174ceb-c58d-40a4-b517-5fe0c224944b"] = chk("Pauta de Cotejo — Hepatitis C", [
    {"label": "Anamnesis", "items": [
        "Forma de diagnóstico y tiempo estimado de infección",
        "Factores de riesgo: UDIV (compartir agujas), transfusiones antes de 1992, tatuajes, hemodiálisis",
        "Tratamiento antiviral previo (interferón o AAD) y respuesta (RVS)",
        "Comorbilidades: alcohol, VIH, VHB",
    ]},
    {"label": "Examen Clínico", "items": [
        "Signos de enfermedad hepática crónica: eritema palmar, telangiectasias arácneas",
        "Hepato-esplenomegalia",
        "Ascitis e ictericia",
        "Estado general",
    ]},
    {"label": "Exámenes", "items": [
        "Anti-VHC y ARN VHC cuantitativo (carga viral) con genotipo",
        "Transaminasas (ALT, AST)",
        "Bilirrubina, albúmina, TP/INR",
        "Hemograma",
        "Ecografía abdominal",
        "FibroScan, APRI o FIB-4 (estadificación de fibrosis)",
        "Serología VIH y VHB",
    ]},
    adm(),
])

# Cirrosis
CHECKLISTS["b53e5123-b5ba-445c-aa84-d9a25d45d0ea"] = chk("Pauta de Cotejo — Cirrosis Hepática", [
    {"label": "Anamnesis", "items": [
        "Etiología: alcohol, VHB, VHC, NASH/MAFLD, autoinmune, otra",
        "Tiempo de diagnóstico y descompensaciones previas: ascitis, encefalopatía, hemorragia variceal, PBE",
        "Abstinencia alcohólica (si etiología alcohólica)",
        "Tratamiento actual y adherencia",
        "Evaluación de candidatura a trasplante hepático",
    ]},
    {"label": "Examen Clínico", "items": [
        "Ictericia, eritema palmar, telangiectasias arácneas, dedos en palillo de tambor",
        "Hepato-esplenomegalia",
        "Ascitis (matidez cambiante, oleada ascítica)",
        "Encefalopatía hepática: asterixis, desorientación, agitación",
        "Edema de MMII",
        "Estado nutricional (desnutrición calórico-proteica frecuente)",
    ]},
    {"label": "Exámenes", "items": [
        "Función hepática: bilirrubina, albúmina, TP/INR (score Child-Pugh)",
        "MELD-Na (creatinina, bilirrubina, INR, sodio)",
        "Hemograma (trombocitopenia, leucopenia por hiperesplenismo)",
        "Transaminasas y GGT",
        "Ecografía abdominal con Doppler hepático",
        "AFP (screening de CHC cada 6 meses)",
        "Endoscopía digestiva alta (screening de várices esofágicas)",
    ]},
    adm(),
])

# Parto prematuro
CHECKLISTS["a0c7a7ce-e81e-4735-ae8e-409229771997"] = chk("Pauta de Cotejo — Parto Prematuro", [
    {"label": "Anamnesis", "items": [
        "Edad gestacional actual (ecografía de primer trimestre confirmada)",
        "Contracciones uterinas: frecuencia y duración",
        "Antecedentes de parto prematuro previo (principal factor de riesgo)",
        "Infecciones vaginales o urinarias en el embarazo actual",
        "Estado de membranas: rotura prematura de membranas (RPM)",
        "Comorbilidades maternas (HTA, DM gestacional, hipotiroidismo)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Altura uterina",
        "Contracciones uterinas (frecuencia, duración e intensidad)",
        "Cérvix: longitud cervical, dilatación, borramiento (score de Bishop)",
        "Latidos cardiofetales",
        "Temperatura materna",
        "Flujo vaginal o sangrado activo",
    ]},
    {"label": "Exámenes", "items": [
        "Ecografía obstétrica (biometría fetal, líquido amniótico, placenta, cervicometría transvaginal)",
        "Hemograma",
        "Orina completa y urocultivo",
        "PCR",
        "Cultivo vaginal y rectal (SGB: Streptococcus B a las 35-37 sem)",
        "Coagulación si sangrado",
    ]},
    adm(),
])

# Agresión sexual
CHECKLISTS["de922ca2-9101-47df-9e4a-ccefabcc2657"] = chk("Pauta de Cotejo — Agresión Sexual", [
    {"label": "Anamnesis", "items": [
        "Tiempo transcurrido desde el evento (horas — crítico para muestra forense y profilaxis)",
        "Tipo de agresión y posibilidad de penetración (vaginal, anal, oral)",
        "Uso de profilaxis post-exposición VIH (PEP) y anticoncepción de emergencia",
        "Estado emocional y red de soporte social",
        "Denuncia policial realizada (sí/no)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Examen físico completo: lesiones traumáticas con descripción anatómica detallada",
        "Examen ginecológico: lesiones, signos de penetración",
        "Registro fotográfico de lesiones (si disponible y con consentimiento)",
        "Evaluación del estado emocional y disociativo",
    ]},
    {"label": "Exámenes", "items": [
        "β-HCG (embarazo)",
        "Serología basal: VIH, hepatitis B (HBsAg), hepatitis C, VDRL",
        "Hemograma",
        "Toma de muestras forenses: hisopados vaginal, rectal y oral (según relato) — cadena de custodia",
        "Orina completa",
    ]},
    adm("Notificación obligatoria a autoridad sanitaria; activar protocolo SENAME si víctima menor de edad"),
])

# Pie diabético (no estaba en la lista original pero puede existir)
CHECKLISTS["696efcff77924d3a78533dd7"] = chk("Pauta de Cotejo — Pie Diabético", [
    {"label": "Anamnesis", "items": [
        "Tiempo de diagnóstico de DM y control metabólico (HbA1c)",
        "Descripción de la lesión: tiempo de evolución, causa desencadenante, tratamiento previo",
        "Antecedentes de lesiones o amputaciones previas en pies",
        "Neuropatía o arteriopatía periférica conocida",
    ]},
    {"label": "Examen Clínico", "items": [
        "Descripción de la lesión (Wagner/Texas): extensión, profundidad, infección, isquemia",
        "Pulsos pedios y tibiales posteriores",
        "Sensibilidad con monofilamento 10g y diapasón",
        "Temperatura local y signos de infección (calor, edema, secreción)",
    ]},
    {"label": "Exámenes", "items": [
        "HbA1c y glicemia",
        "Hemograma y PCR (infección)",
        "Función renal",
        "Cultivo de lesión (con antibiograma)",
        "Radiografía del pie (osteomielitis, gas)",
        "Ecografía doppler arterial de EEII si isquemia",
    ]},
    adm(),
])

# ─────────────────────────────────────────────────────────────────────────────
def update_checklist(topic_id, new_chk):
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/topics?id=eq.{topic_id}&select=id,name,content_blocks",
        headers=HEADERS
    )
    data = r.json()
    if not data:
        print(f"  ✗ Not found: {topic_id}")
        return False

    name = data[0].get('name', topic_id)
    blocks = data[0].get('content_blocks') or []

    new_blocks = []
    replaced = False
    for block in blocks:
        if block.get('type') == 'checklist' and not replaced:
            new_blocks.append(new_chk)
            replaced = True
        else:
            new_blocks.append(block)

    if not replaced:
        new_blocks.append(new_chk)

    r2 = requests.patch(
        f"{SUPABASE_URL}/rest/v1/topics?id=eq.{topic_id}",
        headers=HEADERS,
        json={"content_blocks": new_blocks}
    )
    if r2.status_code in (200, 204):
        print(f"  ✓ {name}")
        return True
    else:
        print(f"  ✗ {name}: {r2.status_code} {r2.text[:100]}")
        return False

if __name__ == '__main__':
    print(f"Actualizando checklists de {len(CHECKLISTS)} temas GES...\n")
    ok = 0
    for tid, chklist in CHECKLISTS.items():
        if update_checklist(tid, chklist):
            ok += 1
    print(f"\nListo: {ok}/{len(CHECKLISTS)} actualizados.")

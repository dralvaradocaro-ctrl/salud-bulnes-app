#!/usr/bin/env python3
"""
v3 — Reescribe checklists GES con ítems exactos de la Pauta de Cotejo GES 2026
(ORDINARIO 2G N°017, Servicio de Salud Ñuble, Febrero 2026).
Excluye Retinopatía Diabética y Alzheimer/Demencia.
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
    base = ["RUT válido y vigente",
            "Interconsulta médica firmada con diagnóstico GES explícito",
            "Registro en MLE con código GES y problema de salud especificado"]
    return {"label": "Datos Administrativos", "items": list(base) + list(items)}

CHECKLISTS = {}

# ─── CARDIOPATÍAS CONGÉNITAS ──────────────────────────────────────────────────
CHECKLISTS["04dd5a0e-c1ad-4b7f-a9e5-ec26d7748c87"] = chk("Pauta de Cotejo — Cardiopatías Congénitas", [
    {"label": "Anamnesis", "items": [
        "Síntomas: cianosis, disnea, fatiga al alimentarse, infecciones respiratorias recurrentes",
        "Antecedentes familiares de cardiopatía congénita",
        "Curva de peso y talla (retraso pondoestatural)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Auscultación cardíaca — soplo (caracterizar: intensidad, foco, irradiación)",
        "Saturación de O₂ basal",
        "Pulsos periféricos y presión arterial",
        "Signos de insuficiencia cardíaca: hepatomegalia, edema",
    ]},
    {"label": "Exámenes", "items": [
        "Ecocardiograma con informe de cardiólogo",
        "ECG de 12 derivaciones",
        "Radiografía de tórax AP",
        "Hemograma",
    ]},
    adm(),
])

# ─── IAM ──────────────────────────────────────────────────────────────────────
CHECKLISTS["696efcff77924d3a78533dd6"] = chk("Pauta de Cotejo — Infarto Agudo del Miocardio", [
    {"label": "Anamnesis", "items": [
        "Dolor precordial opresivo con irradiación a brazo izquierdo, mandíbula o dorso",
        "Síntomas asociados: disnea, náuseas, sudoración, síncope",
        "Factores de riesgo cardiovascular: HTA, DM, tabaquismo, dislipidemia",
        "Antecedentes de cardiopatía isquémica o revascularización previa",
    ]},
    {"label": "Examen Clínico", "items": [
        "Presión arterial en ambos brazos y frecuencia cardíaca",
        "Auscultación cardíaca — soplos, galope S3",
        "Signos de insuficiencia cardíaca: crepitaciones, edema, ingurgitación yugular",
    ]},
    {"label": "Exámenes", "items": [
        "ECG de 12 derivaciones (adjuntar con fecha y hora)",
        "Troponinas seriadas con valores y fecha",
        "Ecocardiograma con FEVI post-evento",
        "Hemograma, perfil lipídico, glicemia, creatinina",
    ]},
    adm("Epicrisis de hospitalización del evento agudo",
        "Informe de coronariografía si fue realizada"),
])

# ─── HTA ──────────────────────────────────────────────────────────────────────
CHECKLISTS["696ea74c245ef362de4f433a"] = chk("Pauta de Cotejo — Hipertensión Arterial", [
    {"label": "Anamnesis", "items": [
        "Síntomas: cefalea, tinnitus, escotomas, epistaxis — pueden estar ausentes",
        "Tiempo de diagnóstico y tratamiento antihipertensivo actual",
        "Factores de riesgo y comorbilidades: DM, dislipidemia, tabaquismo, obesidad",
        "Antecedentes familiares cardiovasculares",
    ]},
    {"label": "Examen Clínico", "items": [
        "Presión arterial sentado tras 5 min de reposo, en ambos brazos",
        "Peso, talla e IMC",
        "Auscultación cardíaca y vascular",
        "Examen neurológico básico — daño de órgano blanco",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma",
        "Perfil bioquímico (glicemia, creatinina, Na, K)",
        "Orina completa con sedimento",
        "ECG de 12 derivaciones",
        "Perfil lipídico",
    ]},
    adm(),
])

# ─── MARCAPASO ────────────────────────────────────────────────────────────────
CHECKLISTS["dc917bbe-bbff-4a36-89f3-895c41628b2f"] = chk("Pauta de Cotejo — Marcapaso", [
    {"label": "Anamnesis", "items": [
        "Síntomas: síncope, presíncope, mareos, palpitaciones",
        "Antecedentes de bloqueo AV, enfermedad del nódulo sinusal o IAM",
        "Medicamentos que pueden causar bradicardia: betabloqueadores, antiarrítmicos, digoxina",
    ]},
    {"label": "Examen Clínico", "items": [
        "Frecuencia cardíaca y ritmo — documentar bradicardia",
        "Presión arterial",
        "Auscultación cardíaca",
    ]},
    {"label": "Exámenes", "items": [
        "ECG de 12 derivaciones — documentar bloqueo o bradicardia",
        "Holter de ritmo 24h si disponible",
        "Electrolitos plasmáticos",
        "Función tiroidea (TSH)",
        "Hemograma y función renal",
    ]},
    adm(),
])

# ─── VÁLVULA AÓRTICA ──────────────────────────────────────────────────────────
CHECKLISTS["89f5d99d-1d44-43f2-b1a1-a6f228035602"] = chk("Pauta de Cotejo — Valvulopatía Aórtica", [
    {"label": "Anamnesis", "items": [
        "Síntomas: disnea de esfuerzo, síncope, angina — tríada de EA grave",
        "Tiempo de evolución y progresión",
        "Antecedentes de fiebre reumática o endocarditis",
    ]},
    {"label": "Examen Clínico", "items": [
        "Auscultación cardíaca — soplo sistólico eyectivo (foco aórtico, irradiación a cuello)",
        "Pulso carotídeo parvus et tardus — en estenosis grave",
        "Signos de insuficiencia cardíaca",
    ]},
    {"label": "Exámenes", "items": [
        "Ecocardiograma Doppler — gradiente medio, área valvular, FEVI",
        "ECG de 12 derivaciones",
        "Radiografía de tórax AP",
        "Hemograma y función renal",
    ]},
    adm(),
])

# ─── VÁLVULA MITRAL/TRICÚSPIDE ────────────────────────────────────────────────
CHECKLISTS["41e275d6-1057-4075-a9ef-f6305a895bca"] = chk("Pauta de Cotejo — Valvulopatía Mitral", [
    {"label": "Anamnesis", "items": [
        "Síntomas: disnea, ortopnea, palpitaciones, fatiga",
        "Antecedentes de fiebre reumática",
        "Historia de fibrilación auricular y anticoagulación",
    ]},
    {"label": "Examen Clínico", "items": [
        "Auscultación cardíaca — soplo (sistólico en IM, diastólico en EM; irradiación, intensidad)",
        "Signos de congestión pulmonar: crepitaciones",
        "Signos de congestión sistémica: ingurgitación yugular, edema, hepatomegalia",
        "Frecuencia cardíaca y ritmo — fibrilación auricular",
    ]},
    {"label": "Exámenes", "items": [
        "Ecocardiograma Doppler — área valvular, FEVI, presión pulmonar",
        "ECG de 12 derivaciones",
        "Radiografía de tórax AP",
        "Hemograma, función renal, TP/INR si anticoagulado",
    ]},
    adm(),
])

# ─── ERC 4-5 ──────────────────────────────────────────────────────────────────
CHECKLISTS["696efcff77924d3a78533dd4"] = chk("Pauta de Cotejo — ERC Etapa 4-5", [
    {"label": "Anamnesis", "items": [
        "Etiología de la ERC y tiempo de diagnóstico — DM, HTA, glomerulopatía, otra",
        "Síntomas urémicos: náuseas, prurito, astenia, edema",
        "Medicamentos nefrotóxicos o con requerimiento de ajuste de dosis",
        "Progresión: VFGe previos comparativos",
    ]},
    {"label": "Examen Clínico", "items": [
        "Presión arterial",
        "Edema de extremidades — sobrecarga de volumen",
        "Estado nutricional",
    ]},
    {"label": "Exámenes", "items": [
        "Creatinina y VFGe (CKD-EPI)",
        "Electrolitos: Na, K, bicarbonato",
        "Calcio, fósforo, PTH intacta",
        "Albúmina",
        "Hemograma",
        "Orina completa con razón albúmina/creatinina (RAC)",
        "Ecografía renal bilateral",
    ]},
    adm(),
])

# ─── ERC TERMINAL ─────────────────────────────────────────────────────────────
CHECKLISTS["2d31e828-cf69-4a64-8274-6e706b2bf74a"] = chk("Pauta de Cotejo — ERC Terminal", [
    {"label": "Anamnesis", "items": [
        "Etiología y VFGe actual (< 15 ml/min/1,73 m²)",
        "Síntomas urémicos y descompensaciones previas",
        "Preferencia del paciente sobre modalidad de terapia de reemplazo renal",
        "Acceso vascular previo o fístula AV",
    ]},
    {"label": "Examen Clínico", "items": [
        "Presión arterial",
        "Edema y signos de sobrecarga de volumen",
        "Estado nutricional",
        "Evaluación de venas para acceso vascular si hemodiálisis",
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

# ─── CÁNCER CERVICOUTERINO ────────────────────────────────────────────────────
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

# ─── CÁNCER DE MAMA ───────────────────────────────────────────────────────────
CHECKLISTS["696efcff77924d3a78533dd1"] = chk("Pauta de Cotejo — Cáncer de Mama", [
    {"label": "Anamnesis", "items": [
        "Nódulo mamario: tiempo de evolución, cambios de tamaño",
        "Secreción por pezón, retracción cutánea o cambios en la piel",
        "Antecedentes familiares de cáncer de mama u ovario",
        "Uso de anticonceptivos hormonales o terapia de reemplazo hormonal",
    ]},
    {"label": "Examen Clínico", "items": [
        "Descripción del nódulo: tamaño, consistencia, movilidad, límites",
        "Piel de naranja, retracción del pezón, eritema",
        "Adenopatías axilares, supraclaviculares e infraclaviculares",
    ]},
    {"label": "Exámenes", "items": [
        "Mamografía bilateral con informe radiológico (BI-RADS)",
        "Ecografía mamaria",
        "Biopsia core o PAAF con informe histológico",
        "Hemograma",
    ]},
    adm(),
])

# ─── CÁNCER GÁSTRICO ──────────────────────────────────────────────────────────
CHECKLISTS["696efcff77924d3a78533dd3"] = chk("Pauta de Cotejo — Cáncer Gástrico", [
    {"label": "Anamnesis", "items": [
        "Síntomas: epigastralgia, saciedad precoz, baja de peso, disfagia, náuseas",
        "Antecedente de H. pylori, úlcera gástrica o gastritis crónica",
        "Antecedentes familiares de cáncer gástrico",
    ]},
    {"label": "Examen Clínico", "items": [
        "Estado nutricional: peso actual y porcentaje de baja de peso",
        "Palpación de masa epigástrica",
        "Adenopatía supraclavicular izquierda (ganglio de Virchow)",
        "Hepatomegalia o ascitis",
    ]},
    {"label": "Exámenes", "items": [
        "Endoscopía digestiva alta con biopsia e informe histológico",
        "Hemograma",
        "Albúmina y función hepática",
    ]},
    adm(),
])

# ─── CÁNCER COLORRECTAL ───────────────────────────────────────────────────────
CHECKLISTS["b670e7b4-8b9c-46e6-91c8-3290999e1712"] = chk("Pauta de Cotejo — Cáncer Colorrectal", [
    {"label": "Anamnesis", "items": [
        "Cambio en hábito intestinal, sangre en deposiciones, pujo, tenesmo",
        "Baja de peso y tiempo de síntomas",
        "Antecedentes familiares de CCR o poliposis adenomatosa",
    ]},
    {"label": "Examen Clínico", "items": [
        "Tacto rectal — descripción: masa, distancia al margen anal",
        "Palpación abdominal: masa, hepatomegalia",
        "Signos de anemia: palidez, taquicardia",
    ]},
    {"label": "Exámenes", "items": [
        "Colonoscopía con biopsia e informe histológico",
        "Hemograma",
        "CEA (antígeno carcinoembrionario)",
        "Función hepática",
    ]},
    adm(),
])

# ─── CÁNCER DE PULMÓN ─────────────────────────────────────────────────────────
CHECKLISTS["accbebd9-cd1a-4414-8efd-43a205591d2f"] = chk("Pauta de Cotejo — Cáncer de Pulmón", [
    {"label": "Anamnesis", "items": [
        "Síntomas: tos persistente, hemoptisis, dolor torácico, disnea",
        "Baja de peso involuntaria",
        "Historia de tabaquismo (años-paquete) y exposición laboral (asbesto, sílice)",
    ]},
    {"label": "Examen Clínico", "items": [
        "Estado general (ECOG)",
        "Auscultación pulmonar — hipoventilación, derrame pleural",
        "Adenopatías supraclaviculares o cervicales",
        "Síndrome de vena cava superior: edema facial, ingurgitación yugular",
    ]},
    {"label": "Exámenes", "items": [
        "Radiografía de tórax AP y lateral",
        "TAC de tórax con contraste",
        "Biopsia con informe histológico (broncoscopía o punción guiada por TAC)",
        "Hemograma y función hepática y renal",
    ]},
    adm(),
])

# ─── CÁNCER DE PRÓSTATA ───────────────────────────────────────────────────────
CHECKLISTS["ad4d27ee-fcf5-4a47-8000-5bb4823970e0"] = chk("Pauta de Cotejo — Cáncer de Próstata", [
    {"label": "Anamnesis", "items": [
        "Síntomas urinarios bajos: polaquiuria, dificultad miccional, goteo terminal",
        "Historia de PSA previos y velocidad de ascenso",
        "Antecedentes familiares de cáncer de próstata",
        "Síntomas de metástasis óseas: dolor lumbar u óseo",
    ]},
    {"label": "Examen Clínico", "items": [
        "Tacto rectal — tamaño, consistencia, nódulos, simetría de próstata",
        "Estado general",
        "Dolor óseo a la palpación",
    ]},
    {"label": "Exámenes", "items": [
        "PSA total y libre con índice PSA libre/total",
        "Biopsia prostática con informe histológico (score de Gleason/ISUP)",
        "Hemograma y función renal",
        "Fosfatasa alcalina",
    ]},
    adm(),
])

# ─── CÁNCER DE OVARIO ─────────────────────────────────────────────────────────
CHECKLISTS["cf979499-4e1d-422b-a32c-018f26bb2b93"] = chk("Pauta de Cotejo — Cáncer de Ovario", [
    {"label": "Anamnesis", "items": [
        "Distensión abdominal, dolor pélvico, síntomas digestivos vagos",
        "Antecedentes familiares de cáncer de ovario o mama",
        "Historia menstrual y paridad",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palpación abdominal: masa pelviana, ascitis",
        "Examen ginecológico bimanual",
        "Estado nutricional y estado general (ECOG)",
    ]},
    {"label": "Exámenes", "items": [
        "Ecografía transvaginal y abdominal con informe",
        "CA-125",
        "Hemograma, función hepática y renal",
    ]},
    adm(),
])

# ─── CÁNCER VESICAL ───────────────────────────────────────────────────────────
CHECKLISTS["f3bab9dd-74e1-4820-b6c6-b34a65c87146"] = chk("Pauta de Cotejo — Cáncer Vesical", [
    {"label": "Anamnesis", "items": [
        "Hematuria macro o microscópica — frecuencia y tiempo de evolución",
        "Síntomas urinarios: disuria, urgencia, cistitis a repetición",
        "Exposición a tabaco y carcinógenos: anilinas, aminas aromáticas",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palpación suprapúbica",
        "Tacto rectal bimanual",
        "Estado general (ECOG)",
    ]},
    {"label": "Exámenes", "items": [
        "Cistoscopía con biopsia e informe histológico",
        "Citología urinaria",
        "Ecografía vesical",
        "Hemograma y función renal",
    ]},
    adm(),
])

# ─── CÁNCER RENAL ─────────────────────────────────────────────────────────────
CHECKLISTS["0de56f1e-1904-45b4-a74e-51e9d5a0691b"] = chk("Pauta de Cotejo — Cáncer Renal", [
    {"label": "Anamnesis", "items": [
        "Hematuria, dolor lumbar, masa en flanco — tríada clásica",
        "Baja de peso, fiebre, sudoración nocturna",
        "Tabaquismo; antecedentes de síndrome de Von Hippel-Lindau",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palpación de masa en flanco",
        "Estado general (ECOG)",
        "Varicocele izquierdo de aparición reciente",
    ]},
    {"label": "Exámenes", "items": [
        "TAC abdomen y pelvis con contraste trifásico — arterial, venoso y tardío",
        "Hemograma, función renal y hepática",
        "Ecografía abdominal si no hay TAC disponible",
    ]},
    adm(),
])

# ─── CÁNCER DE TIROIDES ───────────────────────────────────────────────────────
CHECKLISTS["44b72db1-6886-422b-b75b-9b5d6976bed6"] = chk("Pauta de Cotejo — Cáncer de Tiroides", [
    {"label": "Anamnesis", "items": [
        "Nódulo tiroideo: tiempo de evolución, cambio de tamaño, síntomas compresivos",
        "Disfonía, disfagia, disnea de aparición reciente",
        "Antecedentes de irradiación cervical o familiar de cáncer tiroideo",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palpación tiroidea: tamaño, consistencia, nódulos, movilidad",
        "Adenopatías cervicales",
        "Evaluación de parálisis de cuerda vocal si disfonía",
    ]},
    {"label": "Exámenes", "items": [
        "Ecografía tiroidea con informe (clasificación TIRADS)",
        "TSH",
        "Punción aspirativa con aguja fina (PAAF) con informe citológico",
        "Calcitonina si sospecha de carcinoma medular",
    ]},
    adm(),
])

# ─── LINFOMAS ─────────────────────────────────────────────────────────────────
CHECKLISTS["146af38c-7db0-4fc4-a8d4-5f4033fd1b86"] = chk("Pauta de Cotejo — Linfomas", [
    {"label": "Anamnesis", "items": [
        "Adenopatías: localización, tamaño, tiempo de evolución",
        "Síntomas B: fiebre, sudoración nocturna, baja de peso > 10% en 6 meses",
        "Prurito, fatiga, disnea",
    ]},
    {"label": "Examen Clínico", "items": [
        "Descripción de adenopatías: tamaño, consistencia, movilidad, número y cadenas comprometidas",
        "Esplenomegalia y hepatomegalia",
        "Estado general (ECOG)",
    ]},
    {"label": "Exámenes", "items": [
        "Biopsia ganglionar excisional con informe histológico e inmunohistoquímica",
        "Hemograma con diferencial",
        "VHS, LDH, ácido úrico",
        "Función hepática y renal",
        "TAC cuello-tórax-abdomen-pelvis con contraste",
    ]},
    adm(),
])

# ─── LEUCEMIA ─────────────────────────────────────────────────────────────────
CHECKLISTS["b44e610d-1a6e-49fc-8518-07eca7932a49"] = chk("Pauta de Cotejo — Leucemia", [
    {"label": "Anamnesis", "items": [
        "Síntomas de anemia: palidez, fatiga, disnea",
        "Síntomas de trombocitopenia: hematomas espontáneos, petequias, sangrado mucoso",
        "Infecciones frecuentes o fiebre sin foco aparente",
        "Dolores óseos, especialmente en niños",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palidez de mucosas",
        "Petequias o equimosis",
        "Adenopatías y esplenomegalia",
        "Estado general (ECOG o Karnofsky)",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma con diferencial y frotis de sangre periférica — descripción de blastos",
        "Mielograma con informe hematológico",
        "LDH y ácido úrico",
        "Función hepática y renal",
        "Coagulación: TP, TTPA, fibrinógeno",
    ]},
    adm(),
])

# ─── MIELOMA MÚLTIPLE ─────────────────────────────────────────────────────────
CHECKLISTS["50aa8ef3-daac-415d-b028-c599240078c5"] = chk("Pauta de Cotejo — Mieloma Múltiple", [
    {"label": "Anamnesis", "items": [
        "Dolor óseo (columna, costillas, pelvis)",
        "Síntomas de anemia: fatiga, disnea",
        "Infecciones de repetición",
        "Síntomas de hipercalcemia: poliuria, polidipsia, constipación, confusión",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palidez de mucosas",
        "Dolor óseo a la palpación",
        "Estado general (ECOG)",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma con frotis — rouleaux eritrocitario",
        "Proteínas totales, albúmina, globulinas",
        "Electroforesis de proteínas séricas — pico monoclonal",
        "Beta-2 microglobulina, LDH, calcio",
        "Función renal y creatinina",
        "Radiografía de columna total, pelvis y cráneo AP/lateral",
    ]},
    adm(),
])

# ─── HEMOFILIA ────────────────────────────────────────────────────────────────
CHECKLISTS["7c0496c9-7cd2-4d08-8ae3-81a0f01c590a"] = chk("Pauta de Cotejo — Hemofilia", [
    {"label": "Anamnesis", "items": [
        "Sangrado espontáneo o post-traumático desproporcionado: hemartrosis, hematomas musculares",
        "Historia familiar de hemofilia (herencia ligada al X)",
        "Factor deficiente conocido, nivel basal y tratamiento de reemplazo actual",
        "Número de episodios de sangrado en el último año",
    ]},
    {"label": "Examen Clínico", "items": [
        "Articulaciones diana con signos de artropatía hemofílica (rodillas, codos, tobillos)",
        "Hematomas activos",
        "Estado funcional articular",
    ]},
    {"label": "Exámenes", "items": [
        "Coagulación: TTPA prolongado, TP normal",
        "Niveles del factor (VIII o IX)",
        "Inhibidores del factor (si falta de respuesta al tratamiento)",
        "Hemograma",
    ]},
    adm(),
])

# ─── CÁNCER PEDIÁTRICO ────────────────────────────────────────────────────────
CHECKLISTS["14e327a1-6444-4bf0-b989-e16484b7af01"] = chk("Pauta de Cotejo — Cáncer en Menores de 15 Años", [
    {"label": "Anamnesis", "items": [
        "Síntomas de alarma: fiebre prolongada, baja de peso, palidez, adenopatías, dolor óseo",
        "Masa o tumor palpable de aparición reciente",
        "Síntomas neurológicos: cefalea persistente, vómitos en proyectil, ataxia",
        "Tiempo de evolución y progresión",
    ]},
    {"label": "Examen Clínico", "items": [
        "Palidez de mucosas, petequias, equimosis",
        "Adenopatías: tamaño, localización, consistencia",
        "Masa abdominal o esplenomegalia",
        "Estado neurológico y fondo de ojo si cefalea",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma con diferencial y frotis",
        "LDH, ácido úrico, función renal y hepática",
        "Ecografía abdominal o de la región comprometida",
        "Radiografía de la región comprometida",
    ]},
    adm(),
])

# ─── CUIDADOS PALIATIVOS ──────────────────────────────────────────────────────
CHECKLISTS["cda1e4f0-3773-4f1a-ba33-f68bde078471"] = chk("Pauta de Cotejo — Cuidados Paliativos por Cáncer", [
    {"label": "Anamnesis", "items": [
        "Diagnóstico oncológico confirmado: tipo, estadio, tratamiento recibido",
        "Evaluación del dolor: escala EVA, localización, características, tratamiento actual",
        "Síntomas prevalentes: náuseas, disnea, constipación, insomnio, anorexia",
        "Estado funcional: escala ECOG o Karnofsky",
        "Situación social y red de apoyo familiar",
    ]},
    {"label": "Examen Clínico", "items": [
        "Estado general y signos vitales",
        "Evaluación del dolor al examen físico",
        "Estado nutricional",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma",
        "Función renal y hepática",
        "Exámenes según síntoma a tratar",
    ]},
    adm(),
])

# ─── OSTEOSARCOMA ─────────────────────────────────────────────────────────────
CHECKLISTS["a0b9543b-2ba2-4d90-9933-3b63f74d62cc"] = chk("Pauta de Cotejo — Osteosarcoma", [
    {"label": "Anamnesis", "items": [
        "Dolor óseo persistente con o sin masa de partes blandas — localización habitual: rodilla, fémur distal, tibia proximal",
        "Tiempo de evolución y progresión del dolor",
        "Baja de peso, fiebre",
    ]},
    {"label": "Examen Clínico", "items": [
        "Masa ósea o de partes blandas: tamaño, consistencia, dolor a la palpación",
        "Limitación funcional de la extremidad comprometida",
        "Estado general (ECOG/Karnofsky)",
    ]},
    {"label": "Exámenes", "items": [
        "Radiografía de la región comprometida AP y lateral — patrón de destrucción ósea",
        "Fosfatasa alcalina y LDH",
        "Hemograma",
        "RNM de la extremidad comprometida",
        "TAC de tórax — búsqueda de metástasis pulmonares",
    ]},
    adm(),
])

# ─── DIABETES MELLITUS TIPO 1 ─────────────────────────────────────────────────
CHECKLISTS["390a2aa6-4b7b-4b4f-8247-192dc6f0d202"] = chk("Pauta de Cotejo — Diabetes Mellitus Tipo 1", [
    {"label": "Anamnesis", "items": [
        "Inicio de síntomas: polidipsia, poliuria, polifagia, baja de peso",
        "Episodios de hipoglicemia: frecuencia, severidad, reconocimiento",
        "Esquema de insulina actual: basal, bolos, dosis, adherencia",
        "Complicaciones conocidas: nefropatía, retinopatía, neuropatía",
    ]},
    {"label": "Examen Clínico", "items": [
        "Peso, talla e IMC",
        "Presión arterial",
        "Examen de pies: sensibilidad, pulsos, heridas",
    ]},
    {"label": "Exámenes", "items": [
        "HbA1c",
        "Glicemia en ayunas",
        "Creatinina y VFGe",
        "Orina completa con microalbuminuria",
        "Perfil lipídico",
        "Hemograma",
        "TSH (asociación con tiroiditis autoinmune)",
    ]},
    adm(),
])

# ─── DIABETES MELLITUS TIPO 2 ─────────────────────────────────────────────────
CHECKLISTS["696ea74c245ef362de4f4339"] = chk("Pauta de Cotejo — Diabetes Mellitus Tipo 2", [
    {"label": "Anamnesis", "items": [
        "Tiempo de diagnóstico y tratamiento actual: hipoglicemiantes orales, insulina",
        "Control metabólico: HbA1c más reciente",
        "Síntomas de complicaciones: visión, sensibilidad en pies, edema",
        "Adherencia al tratamiento y estilo de vida",
    ]},
    {"label": "Examen Clínico", "items": [
        "Peso, talla, IMC y perímetro abdominal",
        "Presión arterial",
        "Examen de pies: sensibilidad con monofilamento, pulsos pedios, heridas",
    ]},
    {"label": "Exámenes", "items": [
        "HbA1c",
        "Glicemia en ayunas",
        "Creatinina y VFGe",
        "Orina completa con microalbuminuria",
        "Perfil lipídico",
        "Hemograma",
    ]},
    adm(),
])

# ─── HIPOTIROIDISMO ───────────────────────────────────────────────────────────
CHECKLISTS["696efcff77924d3a78533dce"] = chk("Pauta de Cotejo — Hipotiroidismo", [
    {"label": "Anamnesis", "items": [
        "Síntomas: frío, constipación, fatiga, aumento de peso, edema, bradicardia, bradipsiquia",
        "Tiempo de diagnóstico y dosis actual de levotiroxina — adherencia en ayunas",
        "Antecedentes de tiroiditis, cirugía tiroidea o radioterapia cervical",
    ]},
    {"label": "Examen Clínico", "items": [
        "Frecuencia cardíaca — bradicardia",
        "Piel seca, caída de cabello, voz ronca, edema palpebral (mixedema)",
        "Bocio: tamaño, consistencia, nódulos",
        "Reflejos osteotendinosos enlentecidos",
    ]},
    {"label": "Exámenes", "items": [
        "TSH",
        "T4 libre",
        "Anticuerpos anti-TPO si no determinados previamente",
        "Hemograma",
        "Perfil lipídico y glicemia",
    ]},
    adm(),
])

# ─── ACV ISQUÉMICO ────────────────────────────────────────────────────────────
CHECKLISTS["696efcff77924d3a78533dd5"] = chk("Pauta de Cotejo — ACV Isquémico", [
    {"label": "Anamnesis", "items": [
        "Déficit neurológico focal de inicio agudo: hemiparesia, hemihipoestesia, afasia, hemianopsia, ataxia",
        "Tiempo de inicio de síntomas — hora exacta de inicio o último visto normal",
        "Factores de riesgo: HTA, FA, DM, tabaquismo, dislipidemia, cardiopatía",
        "Tratamiento anticoagulante o antiagregante actual",
    ]},
    {"label": "Examen Clínico", "items": [
        "Escala NIH-SS (NIHSS) documentada",
        "Presión arterial y frecuencia cardíaca (ritmo: FA)",
        "Examen neurológico completo",
    ]},
    {"label": "Exámenes", "items": [
        "TAC de encéfalo sin contraste",
        "ECG de 12 derivaciones",
        "Hemograma, coagulación (TP, TTPA)",
        "Glicemia, creatinina, electrolitos",
        "Perfil lipídico",
    ]},
    adm(),
])

# ─── EPILEPSIA INFANTIL ───────────────────────────────────────────────────────
CHECKLISTS["105de3f0-3055-4cb4-a124-f4b46bcfb945"] = chk("Pauta de Cotejo — Epilepsia Infantil", [
    {"label": "Anamnesis", "items": [
        "Alteración de conciencia, conducta y/o del movimiento o de la postura — descripción del evento por testigos",
        "Antecedentes mórbidos — descartar patología cardiaca, neurológica, síndrome febril, estado mental alterado",
    ]},
    {"label": "Examen Clínico", "items": [
        "Examen neurológico",
        "Observar color de piel, expresión facial, movimientos, postura",
    ]},
    {"label": "Exámenes", "items": [
        "EEG",
        "Hemograma, glicemia",
        "Pruebas hepáticas",
        "Función renal",
    ]},
    adm(),
])

# ─── EPILEPSIA ADULTO ─────────────────────────────────────────────────────────
CHECKLISTS["3a6e79f1-9214-48f7-acdf-5b740de89486"] = chk("Pauta de Cotejo — Epilepsia Adulto", [
    {"label": "Anamnesis", "items": [
        "Alteración de conciencia, conducta y/o del movimiento o de la postura — descripción del evento por testigos",
        "Antecedentes mórbidos — descartar patología cardiaca, neurológica, síndrome febril, estado mental alterado",
        "Medicación antiepiléptica actual y adherencia",
    ]},
    {"label": "Examen Clínico", "items": [
        "Examen neurológico",
        "Observar color de piel, expresión facial, movimientos, postura",
    ]},
    {"label": "Exámenes", "items": [
        "EEG",
        "Hemograma, glicemia",
        "Pruebas hepáticas",
        "Función renal",
    ]},
    adm(),
])

# ─── PARKINSON ────────────────────────────────────────────────────────────────
CHECKLISTS["32cec82e-412a-4d75-89fc-f0f6e3bc252d"] = chk("Pauta de Cotejo — Parkinson", [
    {"label": "Anamnesis", "items": [
        "Antecedentes de comorbilidades y tratamiento farmacológico — detallar fármacos del último año; sospechar parkinsonismo por fármacos o vascular",
        "Data de inicio de síntomas",
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

# ─── ESCLEROSIS MÚLTIPLE ──────────────────────────────────────────────────────
CHECKLISTS["ef881e41-0fd1-47c9-aab9-0d0292a2a485"] = chk("Pauta de Cotejo — Esclerosis Múltiple", [
    {"label": "Anamnesis", "items": [
        "Episodios neurológicos previos (brotes): síntomas, duración y recuperación",
        "Síntomas actuales y tiempo de evolución",
        "Terapia modificadora de enfermedad actual y respuesta",
    ]},
    {"label": "Examen Clínico", "items": [
        "Escala EDSS documentada",
        "Evaluación de visión, motricidad, coordinación y sensibilidad",
        "Signo de Lhermitte — sensación eléctrica a la flexión cervical",
    ]},
    {"label": "Exámenes", "items": [
        "RNM de encéfalo y médula espinal con gadolinio (protocolo EM)",
        "Potenciales evocados visuales",
        "Estudio LCR: bandas oligoclonales e índice IgG si disponible",
        "Hemograma y función hepática y renal",
    ]},
    adm(),
])

# ─── TUMORES SNC ──────────────────────────────────────────────────────────────
CHECKLISTS["0e3b7497-b79c-470a-a320-e2f542568c29"] = chk("Pauta de Cotejo — Tumores SNC", [
    {"label": "Anamnesis", "items": [
        "Síntomas: cefalea de predominio nocturno/matutino, convulsiones, déficit neurológico focal",
        "Cambios conductuales o de personalidad",
        "Tiempo de evolución y progresión",
        "Antecedentes de neoplasia primaria conocida — descartar metástasis cerebrales",
    ]},
    {"label": "Examen Clínico", "items": [
        "Escala ECOG",
        "Examen neurológico completo: pares craneales, motor, sensitivo, cerebeloso",
        "Signos de hipertensión endocraneana: papiledema, bradicardia, HTA",
    ]},
    {"label": "Exámenes", "items": [
        "RNM de encéfalo con y sin gadolinio (protocolo tumor)",
        "Hemograma, coagulación y función hepática y renal",
    ]},
    adm(),
])

# ─── ESQUIZOFRENIA ────────────────────────────────────────────────────────────
CHECKLISTS["ec705134-c8cf-4c83-86f3-7dce68dcf20a"] = chk("Pauta de Cotejo — Esquizofrenia", [
    {"label": "Anamnesis", "items": [
        "Tiempo de diagnóstico y hospitalizaciones psiquiátricas previas",
        "Síntomas actuales: positivos (alucinaciones, delirios) y negativos (alogia, abulia, aplanamiento)",
        "Antipsicótico actual: nombre, dosis, vía, adherencia",
        "Consumo de sustancias",
    ]},
    {"label": "Examen Clínico", "items": [
        "Examen del estado mental: orientación, afecto, ideación, juicio",
        "Signos extrapiramidales: rigidez, temblor, discinesia tardía",
        "Peso y signos vitales — síndrome metabólico",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma",
        "Glicemia y perfil lipídico",
        "Función hepática y renal",
        "ECG — QTc prolongado con antipsicóticos",
    ]},
    adm(),
])

# ─── DEPRESIÓN ────────────────────────────────────────────────────────────────
CHECKLISTS["696efcff77924d3a78533dca"] = chk("Pauta de Cotejo — Depresión", [
    {"label": "Anamnesis", "items": [
        "Tiempo de evolución del episodio actual y número de episodios previos",
        "Síntomas: ánimo depresivo, anhedonia, insomnio, cambios en apetito, fatiga, ideación suicida",
        "Ideación o intentos de suicidio activos o pasados — evaluar riesgo",
        "Antidepresivo actual y adherencia",
        "Antecedentes de episodios maníacos — descartar trastorno bipolar",
    ]},
    {"label": "Examen Clínico", "items": [
        "Escala PHQ-9 o Hamilton con puntaje documentado",
        "Evaluación de riesgo suicida explícita",
        "Estado mental: orientación, afecto, ideación",
    ]},
    {"label": "Exámenes", "items": [
        "TSH — descartar hipotiroidismo como causa",
        "Hemograma",
        "Glicemia y función hepática",
    ]},
    adm(),
])

# ─── TRASTORNO BIPOLAR ────────────────────────────────────────────────────────
CHECKLISTS["e816b3ce-91f8-4659-8586-a7c551125239"] = chk("Pauta de Cotejo — Trastorno Bipolar", [
    {"label": "Anamnesis", "items": [
        "Número de episodios maníacos y depresivos y hospitalizaciones previas",
        "Estado actual del ánimo: eutímico, maníaco, hipomaníaco, depresivo",
        "Estabilizador del ánimo actual: fármaco, dosis, adherencia",
        "Consumo de sustancias",
    ]},
    {"label": "Examen Clínico", "items": [
        "Examen del estado mental completo",
        "Evaluación de riesgo suicida o de daño a terceros",
        "Peso y signos vitales — síndrome metabólico",
    ]},
    {"label": "Exámenes", "items": [
        "Litemia si en tratamiento con litio — rango terapéutico 0,6–1,2 mEq/L",
        "Creatinina y TSH si litio — nefrotoxicidad e hipotiroidismo",
        "Nivel de ácido valproico o carbamazepina si aplica",
        "Hemograma, función hepática, glicemia y perfil lipídico",
    ]},
    adm(),
])

# ─── ALCOHOL/DROGAS ───────────────────────────────────────────────────────────
CHECKLISTS["dd0b1b9f-0848-48ab-9e9f-82aaef29e772"] = chk("Pauta de Cotejo — Consumo Problemático Alcohol/Drogas", [
    {"label": "Anamnesis", "items": [
        "Sustancias utilizadas, cantidad y tiempo de uso",
        "Última dosis y síntomas de abstinencia actuales",
        "Intentos de desintoxicación previos",
        "Comorbilidades psiquiátricas: depresión, ansiedad",
        "Situación social y familiar",
    ]},
    {"label": "Examen Clínico", "items": [
        "Signos de abstinencia: temblor, sudoración, taquicardia, agitación",
        "Estigmas de consumo crónico: hepatomegalia, telangiectasias, eritema palmar",
        "Escala AUDIT (alcohol) o DAST (drogas) con puntaje",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma — VCM elevado en alcoholismo",
        "Función hepática: GGT, transaminasas, bilirrubina",
        "Glicemia y perfil lipídico",
        "Serología: VIH, hepatitis B y C",
    ]},
    adm(),
])

# ─── EPOC ─────────────────────────────────────────────────────────────────────
CHECKLISTS["696efcff77924d3a78533dcc"] = chk("Pauta de Cotejo — EPOC", [
    {"label": "Anamnesis", "items": [
        "Historia de tabaquismo: paquetes-año y estado actual (activo/exfumador)",
        "Disnea: escala mMRC (0–4)",
        "Exacerbaciones en el último año: número y hospitalizaciones",
        "Tratamiento inhalatorio actual: SABA, LABA, LAMA, CI — técnica y adherencia",
    ]},
    {"label": "Examen Clínico", "items": [
        "Saturación de O₂ basal",
        "Frecuencia respiratoria",
        "Auscultación pulmonar: sibilancias, murmullo disminuido",
        "Signos de cor pulmonale: edema, ingurgitación yugular",
    ]},
    {"label": "Exámenes", "items": [
        "Espirometría post-broncodilatador — VEF1/CVF < 0,70; VEF1 % teórico",
        "Radiografía de tórax AP",
        "Hemograma",
        "Gasometría arterial si VEF1 < 50% o SatO₂ < 92%",
    ]},
    adm(),
])

# ─── ASMA PEDIÁTRICO ──────────────────────────────────────────────────────────
CHECKLISTS["696efcff77924d3a78533dcb"] = chk("Pauta de Cotejo — Asma Pediátrico", [
    {"label": "Anamnesis", "items": [
        "Síntomas: sibilancias, tos nocturna, disnea de esfuerzo",
        "Frecuencia de crisis, hospitalizaciones y uso de broncodilatador de rescate",
        "Antecedentes atópicos: rinitis, dermatitis, alergia alimentaria",
        "Tratamiento de mantención actual y adherencia",
        "Exposición a tabaco ambiental, polvo de habitación, mascotas",
    ]},
    {"label": "Examen Clínico", "items": [
        "Saturación de O₂ y frecuencia respiratoria",
        "Auscultación pulmonar: sibilancias, prolongación espiratoria",
        "Talla y peso — percentiles",
    ]},
    {"label": "Exámenes", "items": [
        "Espirometría con prueba broncodilatadora si > 5 años",
        "Hemograma con diferencial — eosinofilia",
        "IgE total",
        "Radiografía de tórax en primera evaluación",
    ]},
    adm(),
])

# ─── ASMA ADULTO ──────────────────────────────────────────────────────────────
CHECKLISTS["497a8ff3-6423-4261-b832-21f370f9cec9"] = chk("Pauta de Cotejo — Asma Adulto", [
    {"label": "Anamnesis", "items": [
        "Control actual del asma: test ACT o clasificación GINA documentada",
        "Exacerbaciones en el último año y hospitalizaciones",
        "Factores desencadenantes identificados: alérgenos, ejercicio, AINE, frío",
        "Tratamiento de mantención (CI/LABA): nombre, dosis, técnica inhalatoria",
    ]},
    {"label": "Examen Clínico", "items": [
        "Saturación de O₂ y frecuencia respiratoria",
        "Auscultación pulmonar: sibilancias, prolongación espiratoria",
        "Signos de rinitis alérgica",
    ]},
    {"label": "Exámenes", "items": [
        "Espirometría con prueba broncodilatadora — VEF1/CVF, VEF1 %",
        "IgE total",
        "Hemograma con diferencial",
        "Radiografía de tórax",
    ]},
    adm(),
])

# ─── FIBROSIS QUÍSTICA ────────────────────────────────────────────────────────
CHECKLISTS["734b76cc-c348-4156-b6a4-044b22f72476"] = chk("Pauta de Cotejo — Fibrosis Quística", [
    {"label": "Anamnesis", "items": [
        "Método diagnóstico: test del sudor (Cl > 60 mEq/L) o mutaciones CFTR",
        "Función pulmonar actual: VEF1 % comparado con basal",
        "Colonización bacteriana crónica: Pseudomonas aeruginosa, S. aureus (MRSA)",
        "Insuficiencia pancreática exocrina y dosis de enzimas",
    ]},
    {"label": "Examen Clínico", "items": [
        "Saturación de O₂ basal",
        "Auscultación pulmonar: crepitaciones, sibilancias",
        "Estado nutricional: IMC y curvas de crecimiento",
        "Dedos en palillo de tambor",
    ]},
    {"label": "Exámenes", "items": [
        "Espirometría (VEF1)",
        "Cultivo de expectoración o hisopado faríngeo",
        "Hemograma y función hepática",
        "Vitaminas liposolubles: A, D, E, K",
        "Glicemia — screening de CFRD (diabetes relacionada a FQ)",
    ]},
    adm(),
])

# ─── REHAB POST-COVID ─────────────────────────────────────────────────────────
CHECKLISTS["5a93339d-f5e8-499a-896a-edee30086b1c"] = chk("Pauta de Cotejo — Rehabilitación Post-COVID", [
    {"label": "Anamnesis", "items": [
        "COVID-19: fecha, gravedad (ambulatorio/hospitalizado/UCI), ventilación mecánica",
        "Síntomas persistentes (> 4 semanas): disnea, fatiga, fog cognitivo, dolor torácico, palpitaciones",
        "Nivel de actividad física antes del COVID y comorbilidades previas",
    ]},
    {"label": "Examen Clínico", "items": [
        "Saturación de O₂ basal y de esfuerzo — test de 1 min sentarse/pararse",
        "Frecuencia cardíaca y respiratoria",
        "Evaluación cognitiva breve: orientación y concentración",
        "Fuerza muscular de extremidades",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma",
        "Dímero D y PCR",
        "Función renal y hepática",
        "Espirometría si síntomas respiratorios persistentes",
        "ECG",
    ]},
    adm(),
])

# ─── ESCOLIOSIS ───────────────────────────────────────────────────────────────
CHECKLISTS["0d625400-8943-465b-a784-5ba7257ee429"] = chk("Pauta de Cotejo — Escoliosis", [
    {"label": "Anamnesis", "items": [
        "Edad de inicio de la deformidad y progresión",
        "Menarquia en mujeres y madurez esquelética estimada",
        "Dolor dorsal o lumbar asociado",
        "Compromiso respiratorio o neurológico: disnea, debilidad",
    ]},
    {"label": "Examen Clínico", "items": [
        "Test de Adams — giba costal o lumbar en inclinación anterior",
        "Evaluación de madurez esquelética (Risser)",
        "Examen neurológico de extremidades inferiores: fuerza, sensibilidad, reflejos",
    ]},
    {"label": "Exámenes", "items": [
        "Radiografía de columna total AP y lateral en bipedestación — medición ángulo de Cobb",
        "Radiografía de mano izquierda para edad ósea (Risser)",
        "Espirometría si curva > 60° o compromiso respiratorio",
    ]},
    adm(),
])

# ─── ENDOPRÓTESIS CADERA ──────────────────────────────────────────────────────
CHECKLISTS["16fa6559-f50b-4c99-89f7-33b1e82e6183"] = chk("Pauta de Cotejo — Endoprótesis Total de Cadera", [
    {"label": "Anamnesis", "items": [
        "Dolor en cadera: intensidad (EVA), localización, relación con el movimiento",
        "Limitación funcional: escala de Lequesne ≥ 10 o Harris Hip Score",
        "Tratamiento conservador previo: AINE, kinesioterapia, infiltraciones y tiempo",
        "Comorbilidades para evaluación de riesgo quirúrgico: DM, cardiopatía, anticoagulación",
    ]},
    {"label": "Examen Clínico", "items": [
        "Movilidad de cadera: flexión, rotación interna/externa, abducción",
        "Marcha: cojera, Trendelenburg, uso de bastón",
        "Longitud de extremidades — diferencia",
    ]},
    {"label": "Exámenes", "items": [
        "Radiografía de pelvis AP y axial de cadera — grado Kellgren-Lawrence",
        "Hemograma, coagulación (TP, TTPA), función renal, glicemia",
        "ECG preoperatorio",
        "Grupo ABO-Rh",
    ]},
    adm(),
])

# ─── ARTROSIS ─────────────────────────────────────────────────────────────────
CHECKLISTS["696efcff77924d3a78533dcd"] = chk("Pauta de Cotejo — Artrosis", [
    {"label": "Anamnesis", "items": [
        "Articulaciones comprometidas y tiempo de evolución",
        "Dolor y limitación funcional: EVA; escala WOMAC si rodilla o cadera",
        "Tratamiento previo: AINE, kinesioterapia, infiltraciones y respuesta",
    ]},
    {"label": "Examen Clínico", "items": [
        "Crepitación articular a la movilización pasiva",
        "Movilidad activa y pasiva de articulaciones comprometidas",
        "Signos inflamatorios: calor, edema, derrame articular — descartar artritis",
        "Deformidades articulares: varo/valgo",
    ]},
    {"label": "Exámenes", "items": [
        "Radiografía de articulaciones comprometidas AP y lateral — pinzamiento, osteofitos, esclerosis",
        "VHS y PCR — descartar artritis inflamatoria",
        "Ácido úrico — descartar gota",
        "Hemograma y función renal",
    ]},
    adm(),
])

# ─── HNP LUMBAR ───────────────────────────────────────────────────────────────
CHECKLISTS["aa072279-9dbe-4704-b0aa-099292715a51"] = chk("Pauta de Cotejo — HNP Lumbar", [
    {"label": "Anamnesis", "items": [
        "Lumbociática: dermátomo afectado, intensidad (EVA) y tiempo de evolución",
        "Déficit neurológico motor: pie caído, debilidad de extremidad",
        "Síntomas de síndrome de cola de caballo: retención urinaria, incontinencia — URGENCIA",
        "Tratamiento previo: analgésicos, kinesioterapia, infiltraciones y respuesta",
    ]},
    {"label": "Examen Clínico", "items": [
        "Reflejos osteotendinosos: patelar (L4) y aquiliano (S1)",
        "Sensibilidad en dermátomos L4, L5, S1",
        "Fuerza muscular en MMII",
        "Signo de Lasègue — reproducción del dolor radicular",
    ]},
    {"label": "Exámenes", "items": [
        "RNM de columna lumbar con contraste si hay déficit neurológico",
        "Hemograma y función renal",
    ]},
    adm(),
])

# ─── COLECISTECTOMÍA ──────────────────────────────────────────────────────────
CHECKLISTS["696efcff77924d3a78533dcf"] = chk("Pauta de Cotejo — Colecistectomía Preventiva", [
    {"label": "Anamnesis", "items": [
        "Cólicos biliares: frecuencia, severidad, relación con comidas grasas",
        "Episodios previos de ictericia, fiebre o colangitis",
        "Pancreatitis biliar documentada",
        "Comorbilidades para riesgo quirúrgico: DM, cardiopatía, obesidad mórbida",
    ]},
    {"label": "Examen Clínico", "items": [
        "Signo de Murphy — dolor en hipocondrio derecho a la palpación durante inspiración",
        "Ictericia escleral y cutánea",
        "Estado nutricional",
    ]},
    {"label": "Exámenes", "items": [
        "Ecografía abdominal con informe — colelitiasis, pared vesicular, coledocolitiasis",
        "Hemograma",
        "Función hepática: bilirrubina, GGT, FA, transaminasas",
        "Coagulación: TP y TTPA",
        "Glicemia y función renal",
        "ECG preoperatorio",
    ]},
    adm(),
])

# ─── FISURA LABIOPALATINA ─────────────────────────────────────────────────────
CHECKLISTS["40389e49-9062-4fe4-830c-6fc7ff69bccf"] = chk("Pauta de Cotejo — Fisura Labiopalatina", [
    {"label": "Anamnesis", "items": [
        "Tipo de fisura: labio, paladar o ambos; unilateral o bilateral",
        "Dificultad para alimentarse: succión, regurgitación nasal",
        "Antecedentes familiares de fisura",
        "Otitis medias recurrentes",
    ]},
    {"label": "Examen Clínico", "items": [
        "Descripción de la fisura: extensión y estructuras comprometidas — úvula, velo, paladar duro, reborde alveolar, labio",
        "Desarrollo pondoestatural",
        "Otoscopía",
        "Dismorfias craneofaciales asociadas (síndrome)",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma y función hepática y renal",
        "Otoemisiones acústicas o audiometría",
    ]},
    adm(),
])

# ─── DISPLASIA DE CADERA ──────────────────────────────────────────────────────
CHECKLISTS["077e850d-cded-4863-aa08-113e7d59aab0"] = chk("Pauta de Cotejo — Displasia del Desarrollo de Cadera", [
    {"label": "Anamnesis", "items": [
        "Edad de diagnóstico y método: screening neonatal, ecografía o examen clínico",
        "Factores de riesgo: primogénita, presentación podálica, antecedentes familiares",
        "Uso previo de arnés Pavlik u ortesis y tiempo de tratamiento",
    ]},
    {"label": "Examen Clínico", "items": [
        "Signo de Ortolani (reducción) y Barlow (luxación) en menores de 3 meses",
        "Limitación de abducción de caderas (< 60°)",
        "Asimetría de pliegues inguinales y glúteos",
        "Marcha en niños que caminan: Trendelenburg, cojera",
    ]},
    {"label": "Exámenes", "items": [
        "Ecografía de caderas (clasificación de Graf) en menores de 3–4 meses",
        "Radiografía de pelvis AP en mayores de 4–6 meses — índice acetabular, línea de Hilgenreiner",
    ]},
    adm(),
])

# ─── CATARATAS ────────────────────────────────────────────────────────────────
CHECKLISTS["696efcff77924d3a78533dd0"] = chk("Pauta de Cotejo — Cataratas", [
    {"label": "Anamnesis", "items": [
        "Disminución de agudeza visual: tiempo de evolución y progresión",
        "Deslumbramiento, halos alrededor de luces, diplopía monocular",
        "Repercusión en actividades cotidianas: conducción, lectura, escaleras",
        "Antecedentes de DM, uso crónico de corticoides, trauma ocular",
    ]},
    {"label": "Examen Clínico", "items": [
        "Agudeza visual con y sin corrección (Snellen) en cada ojo",
        "Biomicroscopía de polo anterior — tipo y grado de opacidad del cristalino (LOCS III)",
        "Presión intraocular",
        "Fondo de ojo con pupila dilatada",
    ]},
    {"label": "Exámenes", "items": [
        "Agudeza visual documentada por ojo",
        "Biometría ocular (A-scan o IOL Master) para cálculo de LIO",
        "Hemograma, glicemia, coagulación",
        "ECG si ≥ 60 años",
    ]},
    adm(),
])

# ─── VICIOS DE REFRACCIÓN ─────────────────────────────────────────────────────
CHECKLISTS["d4d5f0b5-c80f-47d0-87a2-2b821d6643ac"] = chk("Pauta de Cotejo — Vicios de Refracción", [
    {"label": "Anamnesis", "items": [
        "Síntomas: visión borrosa (lejos, cerca o ambas), cefalea frontal, fatiga visual",
        "Uso previo de lentes y graduación",
        "Actividades visuales del paciente: escolaridad, trabajo",
    ]},
    {"label": "Examen Clínico", "items": [
        "Agudeza visual sin corrección y con estenopeico en cada ojo",
        "Refracción objetiva (esquiascopía o refractómetro automático)",
        "Refracción subjetiva manifiesta",
        "Presión intraocular",
    ]},
    {"label": "Exámenes", "items": [
        "Refractometría documentada por ojo",
        "Topografía corneal si sospecha de queratocono o astigmatismo irregular",
    ]},
    adm(),
])

# ─── ESTRABISMO ───────────────────────────────────────────────────────────────
CHECKLISTS["621eace6-3e44-48ff-b43a-12ab248095a9"] = chk("Pauta de Cotejo — Estrabismo", [
    {"label": "Anamnesis", "items": [
        "Tipo de desviación: esotropia, exotropia, hipertropia — constante o intermitente",
        "Edad de inicio",
        "Uso previo de parches (oclusión) o lentes",
        "Ambliopía diagnosticada previamente",
    ]},
    {"label": "Examen Clínico", "items": [
        "Agudeza visual con y sin corrección en cada ojo",
        "Reflejo corneal de Hirschberg",
        "Cover test unilateral y alternante: lejos y cerca",
        "Motilidad ocular en 9 posiciones de mirada",
        "Refracción bajo cicloplejia (atropina en niños)",
    ]},
    {"label": "Exámenes", "items": [
        "Refractometría bajo cicloplejia documentada",
        "Fondo de ojo con pupila dilatada",
    ]},
    adm(),
])

# ─── DESPRENDIMIENTO DE RETINA ────────────────────────────────────────────────
CHECKLISTS["2b610547-f2bd-43c5-87ad-e6efc78d1e62"] = chk("Pauta de Cotejo — Desprendimiento de Retina", [
    {"label": "Anamnesis", "items": [
        "Fotopsias (destellos) y miodesopsias (manchas flotantes) — tiempo de aparición",
        "Pérdida de campo visual en forma de cortina oscura",
        "Historia de miopía severa o trauma ocular",
    ]},
    {"label": "Examen Clínico", "items": [
        "Agudeza visual",
        "Fondo de ojo con pupila dilatada — descripción del desprendimiento",
        "Presión intraocular",
    ]},
    {"label": "Exámenes", "items": [
        "Ecografía ocular modo B si el fondo de ojo no es visible",
        "Hemograma y coagulación previo a cirugía",
    ]},
    adm("Derivación URGENTE a oftalmología — riesgo de ceguera irreversible"),
])

# ─── HIPOACUSIA ADULTO ────────────────────────────────────────────────────────
CHECKLISTS["23e4223d-7d08-4c8f-8cce-34840f8d0fca"] = chk("Pauta de Cotejo — Hipoacusia Adulto", [
    {"label": "Anamnesis", "items": [
        "Tipo: unilateral o bilateral; conducción o sensorioneural",
        "Tiempo de evolución y progresión",
        "Tinnitus, acúfenos y vértigo asociado",
        "Exposición a ruido laboral o recreacional",
        "Uso de ototóxicos: aminoglucósidos, cisplatino, furosemida",
    ]},
    {"label": "Examen Clínico", "items": [
        "Otoscopía: CAE y membrana timpánica — perforación, retracción, efusión",
        "Diapasones: Rinne (512 Hz) y Weber",
        "Evaluación del equilibrio si vértigo asociado",
    ]},
    {"label": "Exámenes", "items": [
        "Audiometría tonal liminar con impedanciometría — timpanometría y reflejos estapediales",
        "Logoaudiometría (discriminación de la palabra)",
        "Potenciales evocados auditivos del tronco (BERA) si sospecha retrococlear",
        "TSH si sospecha hipotiroidismo como causa",
    ]},
    adm(),
])

# ─── HIPOACUSIA PEDIÁTRICO ────────────────────────────────────────────────────
CHECKLISTS["1f8b7f23-acd8-4758-a8f6-cee6d23b9537"] = chk("Pauta de Cotejo — Hipoacusia Pediátrico", [
    {"label": "Anamnesis", "items": [
        "Resultado de otoemisiones acústicas al nacer",
        "Antecedentes perinatales: prematurez, hipoxia neonatal, hiperbilirrubinemia, TORCH",
        "Historia familiar de hipoacusia congénita",
        "Hitos del lenguaje: edad de primeras palabras, frases, grado de comprensión",
    ]},
    {"label": "Examen Clínico", "items": [
        "Otoscopía",
        "Evaluación del desarrollo del lenguaje según edad",
        "Dismorfias craneofaciales asociadas: síndrome de Waardenburg, BOR",
    ]},
    {"label": "Exámenes", "items": [
        "Audiometría con refuerzo visual (6–24 meses) o audiometría de juego (2–5 años)",
        "Potenciales evocados auditivos de tronco (BERA/ABR) si no coopera",
        "Impedanciometría y otoemisiones acústicas",
        "TSH y función renal (síndrome de Pendred)",
    ]},
    adm(),
])

# ─── ARTRITIS REUMATOIDEA ─────────────────────────────────────────────────────
CHECKLISTS["adfbd7d1-2956-466b-add3-facdd6ef3f01"] = chk("Pauta de Cotejo — Artritis Reumatoidea", [
    {"label": "Anamnesis", "items": [
        "Articulaciones comprometidas: sinovitis simétrica de pequeñas articulaciones — MCF, IFP, muñecas",
        "Tiempo de evolución > 6 semanas (criterios ACR/EULAR 2010)",
        "Rigidez matutina: duración en minutos",
        "Tratamiento actual: AINE, cloroquina, metotrexato, leflunomida, biológico",
    ]},
    {"label": "Examen Clínico", "items": [
        "Signos inflamatorios articulares: sinovitis, calor, edema, dolor a la compresión",
        "Nódulos reumatoideos",
        "Compromiso extraarticular: ojos (queratoconjuntivitis seca), pulmón",
    ]},
    {"label": "Exámenes", "items": [
        "Factor reumatoideo cuantitativo",
        "Anti-CCP (anticuerpos antipéptido cíclico citrulinado)",
        "VHS y PCR",
        "Hemograma y función hepática y renal — previo a DMARD",
        "Radiografía de manos y muñecas AP — erosiones, osteopenia periarticular",
    ]},
    adm(),
])

# ─── ARTRITIS JUVENIL ─────────────────────────────────────────────────────────
CHECKLISTS["403033ae-7f8d-4d50-842c-22df45a881eb"] = chk("Pauta de Cotejo — Artritis Idiopática Juvenil", [
    {"label": "Anamnesis", "items": [
        "Edad de inicio y tipo de compromiso articular: oligoarticular, poliarticular, sistémico",
        "Fiebre, rash, uveítis o serositis",
        "Impacto en escolaridad y actividades cotidianas",
        "Tratamiento actual: AINE, metotrexato, biológico",
    ]},
    {"label": "Examen Clínico", "items": [
        "Recuento de articulaciones activas: dolor y edema",
        "Signos inflamatorios articulares",
        "Examen ocular — uveítis anterior requiere lámpara de hendidura",
    ]},
    {"label": "Exámenes", "items": [
        "Hemograma con diferencial, VHS y PCR",
        "Factor reumatoideo y ANA (anticuerpos antinucleares)",
        "Función hepática y renal",
        "Radiografía de articulaciones comprometidas",
    ]},
    adm(),
])

# ─── LUPUS ────────────────────────────────────────────────────────────────────
CHECKLISTS["92f86d68-fcb0-408c-8236-3e93c9ad00bc"] = chk("Pauta de Cotejo — Lupus Eritematoso Sistémico", [
    {"label": "Anamnesis", "items": [
        "Síntomas: eritema malar, fotosensibilidad, úlceras orales, artritis, serositis",
        "Manifestaciones renales: edema, hematuria, hipertensión",
        "Manifestaciones neurológicas: convulsiones, psicosis",
        "Tratamiento actual: hidroxicloroquina, corticoides, inmunosupresores",
    ]},
    {"label": "Examen Clínico", "items": [
        "Eritema malar (en alas de mariposa) y fotosensibilidad",
        "Artritis no erosiva",
        "Serositis: pleuritis, pericarditis",
        "Presión arterial — nefritis lúpica",
    ]},
    {"label": "Exámenes", "items": [
        "ANA (anticuerpos antinucleares) — si positivo: Anti-dsDNA, Anti-Sm",
        "Hemograma con diferencial — leucopenia, linfopenia, trombocitopenia, anemia hemolítica",
        "Complemento: C3, C4, CH50",
        "Orina completa con sedimento y proteinuria/creatinuria",
        "Función renal, función hepática",
        "VHS y PCR",
    ]},
    adm(),
])

# ─── HELICOBACTER PYLORI ──────────────────────────────────────────────────────
CHECKLISTS["ad54ffbe-d515-4619-a151-eb3c8b444423"] = chk("Pauta de Cotejo — Erradicación de H. pylori", [
    {"label": "Anamnesis", "items": [
        "Síntomas: epigastralgia, dispepsia, plenitud postprandial",
        "Antecedente de úlcera péptica documentada",
        "Tratamiento de erradicación previo y resultado",
    ]},
    {"label": "Examen Clínico", "items": [
        "Dolor epigástrico a la palpación",
        "Estado nutricional",
    ]},
    {"label": "Exámenes", "items": [
        "Test diagnóstico de H. pylori: test del aliento con ¹³C-urea o antígeno en deposiciones",
        "Endoscopía digestiva alta con biopsia si síntomas de alarma o > 45 años",
        "Hemograma",
    ]},
    adm(),
])

# ─── HEPATITIS B ──────────────────────────────────────────────────────────────
CHECKLISTS["4da81a6d-68b3-4223-b78e-0d4eae135371"] = chk("Pauta de Cotejo — Hepatitis B Crónica", [
    {"label": "Anamnesis", "items": [
        "Forma de diagnóstico: screening, síntomas o contacto",
        "Factores de riesgo: contacto sexual, transfusiones, UDIV, vertical",
        "Estado clínico: portador inactivo, hepatitis crónica activa, cirrosis",
        "Tratamiento antiviral actual y respuesta",
    ]},
    {"label": "Examen Clínico", "items": [
        "Ictericia escleral y cutánea",
        "Hepatomegalia y esplenomegalia",
        "Signos de cirrosis: eritema palmar, telangiectasias arácneas, ascitis",
    ]},
    {"label": "Exámenes", "items": [
        "Perfil serológico: HBsAg, HBeAg, Anti-HBe, Anti-HBc IgM",
        "ADN VHB cuantitativo (carga viral)",
        "Transaminasas (ALT, AST), bilirrubina, albúmina, TP/INR",
        "Hemograma",
        "Ecografía abdominal con informe",
        "AFP si cirrosis — screening de CHC",
    ]},
    adm(),
])

# ─── HEPATITIS C ──────────────────────────────────────────────────────────────
CHECKLISTS["67174ceb-c58d-40a4-b517-5fe0c224944b"] = chk("Pauta de Cotejo — Hepatitis C Crónica", [
    {"label": "Anamnesis", "items": [
        "Forma de diagnóstico y tiempo estimado de infección",
        "Factores de riesgo: UDIV, transfusiones antes de 1992, tatuajes, hemodiálisis",
        "Tratamiento antiviral previo (interferón o AAD) y resultado (RVS)",
        "Comorbilidades: alcohol, VIH, VHB",
    ]},
    {"label": "Examen Clínico", "items": [
        "Signos de enfermedad hepática crónica: eritema palmar, telangiectasias arácneas",
        "Hepato-esplenomegalia",
        "Ascitis e ictericia",
    ]},
    {"label": "Exámenes", "items": [
        "Anti-VHC y ARN VHC cuantitativo con genotipo",
        "Transaminasas (ALT, AST), bilirrubina, albúmina, TP/INR",
        "Hemograma",
        "Ecografía abdominal",
        "FibroScan, APRI o FIB-4 para estadificación de fibrosis",
        "Serología VIH y VHB",
    ]},
    adm(),
])

# ─── CIRROSIS ─────────────────────────────────────────────────────────────────
CHECKLISTS["b53e5123-b5ba-445c-aa84-d9a25d45d0ea"] = chk("Pauta de Cotejo — Cirrosis Hepática", [
    {"label": "Anamnesis", "items": [
        "Etiología: alcohol, VHB, VHC, NASH/MAFLD, autoinmune",
        "Descompensaciones previas: ascitis, encefalopatía, hemorragia variceal, PBE",
        "Abstinencia alcohólica si etiología alcohólica",
        "Evaluación de candidatura a trasplante hepático",
    ]},
    {"label": "Examen Clínico", "items": [
        "Ictericia, eritema palmar, telangiectasias arácneas, dedos en palillo de tambor",
        "Hepato-esplenomegalia",
        "Ascitis: matidez cambiante, oleada ascítica",
        "Encefalopatía hepática: asterixis, desorientación",
        "Estado nutricional",
    ]},
    {"label": "Exámenes", "items": [
        "Función hepática: bilirrubina, albúmina, TP/INR — score Child-Pugh",
        "MELD-Na: creatinina, bilirrubina, INR, sodio",
        "Hemograma — trombocitopenia, leucopenia por hiperesplenismo",
        "Ecografía abdominal con Doppler hepático",
        "AFP cada 6 meses — screening de CHC",
        "Endoscopía digestiva alta — screening de várices esofágicas",
    ]},
    adm(),
])

# ─── PARTO PREMATURO ──────────────────────────────────────────────────────────
CHECKLISTS["a0c7a7ce-e81e-4735-ae8e-409229771997"] = chk("Pauta de Cotejo — Prevención de Parto Prematuro", [
    {"label": "Anamnesis", "items": [
        "Edad gestacional actual — confirmada por ecografía de primer trimestre",
        "Contracciones uterinas: frecuencia y duración",
        "Antecedente de parto prematuro previo — principal factor de riesgo",
        "Infecciones vaginales o urinarias en el embarazo actual",
    ]},
    {"label": "Examen Clínico", "items": [
        "Dinámica uterina: número de contracciones en 30 minutos",
        "Longitud cervical por ecografía transvaginal — ≤ 25 mm es criterio de riesgo",
        "Examen vaginal: dilatación, borramiento cervical",
    ]},
    {"label": "Exámenes", "items": [
        "Cultivo vaginal y urocultivo",
        "Fibronectina fetal si disponible",
        "Ecografía obstétrica con biometría fetal",
        "Hemograma y PCR",
    ]},
    adm(),
])

# ─── AGRESIÓN SEXUAL ──────────────────────────────────────────────────────────
CHECKLISTS["de922ca2-9101-47df-9e4a-ccefabcc2657"] = chk("Pauta de Cotejo — Agresión Sexual Aguda", [
    {"label": "Anamnesis", "items": [
        "Tiempo transcurrido desde el evento",
        "Descripción del tipo de agresión (sin revictimizar) — para orientar exámenes forenses",
        "Antecedentes de ITS o embarazo previo",
        "Uso de anticonceptivos previo al evento",
    ]},
    {"label": "Examen Clínico", "items": [
        "Evaluación de lesiones físicas: descripción y localización",
        "Examen ginecológico o genital según tipo de agresión — con consentimiento",
        "Estado emocional y nivel de riesgo vital",
    ]},
    {"label": "Exámenes", "items": [
        "Test de embarazo (en mayores de 14 años o con actividad sexual previa)",
        "Serología: VIH, hepatitis B, sífilis (VDRL)",
        "Cultivos para ITS: gonococo, Chlamydia",
        "Hemograma",
    ]},
    adm("Profilaxis post-exposición VIH si corresponde (< 72 hrs)",
        "Anticoncepción de emergencia si corresponde",
        "Denuncia a Carabineros o Fiscalía según protocolo — obligatoria en menores de 14 años"),
])

# ─── PIE DIABÉTICO (UUID sin match en DB — se incluye igualmente) ─────────────
CHECKLISTS["696efcff77924d3a78533dd7"] = chk("Pauta de Cotejo — Pie Diabético", [
    {"label": "Anamnesis", "items": [
        "Tiempo de diagnóstico de DM y control metabólico: HbA1c",
        "Descripción de la lesión: tiempo de evolución, causa desencadenante, tratamiento previo",
        "Antecedentes de lesiones o amputaciones previas en pies",
        "Neuropatía o arteriopatía periférica conocida",
    ]},
    {"label": "Examen Clínico", "items": [
        "Descripción de la lesión (Wagner/Texas): extensión, profundidad, infección, isquemia",
        "Pulsos pedios y tibiales posteriores",
        "Sensibilidad con monofilamento 10 g y diapasón",
    ]},
    {"label": "Exámenes", "items": [
        "HbA1c y glicemia",
        "Hemograma y PCR",
        "Función renal",
        "Cultivo de lesión con antibiograma",
        "Radiografía del pie — osteomielitis, gas",
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

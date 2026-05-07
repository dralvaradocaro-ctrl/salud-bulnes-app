#!/usr/bin/env python3
"""
Updates each GES topic with protocol_header + criteria + checklist blocks.
Then deletes the 13 Policlínico "Pauta de Cotejo" topics.
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

PROTO_HDR = {
    "ordinario": "ORDINARIO 2G N°017",
    "institution": "Servicio de Salud Ñuble",
    "department": "Dpto. de Procesos y GES",
    "date": "Febrero 2026",
}

def hdr(summary):
    return {"id": bid(), "type": "protocol_header", "tab": None,
            "layout_position": "full", **PROTO_HDR,
            "title": "Pauta de Cotejo — Patologías GES 2026",
            "summary": summary}

def crit(title, color, items):
    return {"id": bid(), "type": "criteria", "tab": None,
            "title": title, "color": color, "items": items}

def chk(title, sections):
    return {"id": bid(), "type": "checklist", "tab": None,
            "title": title, "sections": sections}

# ── Content per GES topic ──────────────────────────────────────────────────

CONTENT = {}

# Cardiopatías congénitas | 04dd5a0e-c1ad-4b7f-a9e5-ec26d7748c87
CONTENT["04dd5a0e-c1ad-4b7f-a9e5-ec26d7748c87"] = [
    hdr("Criterios de inclusión y requisitos de derivación al nivel secundario para cardiopatías congénitas operables según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Diagnóstico de cardiopatía congénita operable confirmado por cardiólogo o cirujano cardiovascular",
        "Edad: sin límite de edad establecido en GES",
        "Paciente con indicación quirúrgica o intervencionista",
        "Cardiopatías incluidas: CIA, CIV, ductus arterioso persistente, Tetralogía de Fallot, coartación aórtica, entre otras",
        "Derivación desde APS o nivel secundario con diagnóstico confirmado",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Documentos Clínicos", "items": [
            "Interconsulta médica con diagnóstico GES explícito",
            "Ecocardiograma con informe",
            "Radiografía de tórax AP y lateral reciente",
            "ECG de 12 derivaciones",
        ]},
        {"label": "Evaluaciones Complementarias", "items": [
            "Evaluación nutricional (peso, talla, IMC)",
            "Saturometría de pulso basal",
            "Hemograma y grupo sanguíneo",
            "Función renal (creatinina, BUN)",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido y vigente",
            "Ficha clínica actualizada",
            "Consentimiento informado firmado por tutor/paciente",
        ]},
    ]),
]

# IAM | 696efcff77924d3a78533dd6
CONTENT["696efcff77924d3a78533dd6"] = [
    hdr("Criterios de inclusión y requisitos de derivación para seguimiento post-IAM y evaluación cardiológica según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Diagnóstico de IAM confirmado (STEMI o NSTEMI) con epicrisis de hospitalización",
        "Paciente en seguimiento post-IAM que requiere evaluación cardiológica especializada",
        "Fracción de eyección deprimida post-IAM (FEVI <40%)",
        "Indicación de coronariografía o revascularización",
        "Rehabilitación cardíaca post-IAM",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Documentos del Evento Agudo", "items": [
            "Epicrisis de hospitalización",
            "ECG durante el episodio y de control",
            "Troponinas seriadas con valores y fecha",
            "Informe de coronariografía si fue realizada",
        ]},
        {"label": "Evaluación Cardiológica", "items": [
            "Ecocardiograma con FEVI post-IAM",
            "Esquema farmacológico actual (antiagregantes, estatinas, IECA/ARA-II, betabloqueador)",
            "Control de factores de riesgo (PA, glicemia, perfil lipídico)",
        ]},
        {"label": "Datos Administrativos", "items": [
            "RUT válido",
            "Interconsulta con diagnóstico GES",
            "Clasificación KILLIP al ingreso registrada",
        ]},
    ]),
]

# HTA | 696ea74c245ef362de4f433a
CONTENT["696ea74c245ef362de4f433a"] = [
    hdr("Criterios de inclusión y requisitos de derivación para HTA resistente, secundaria o con daño de órgano blanco según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "purple", [
        "HTA primaria o esencial en personas ≥15 años",
        "HTA resistente: PA >140/90 mmHg con ≥3 fármacos en dosis óptimas incluyendo diurético",
        "HTA con daño de órgano blanco: retinopatía, nefropatía, hipertrofia VI",
        "Crisis hipertensiva de repetición o HTA severa no controlada",
        "Sospecha de HTA secundaria (renovascular, suprarrenal, etc.)",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Control Clínico", "items": [
            "Registro de PA en al menos 2 controles distintos (promedio)",
            "Esquema farmacológico actual con dosis y cumplimiento",
            "Interconsulta con motivo de derivación explícito",
        ]},
        {"label": "Exámenes de Laboratorio", "items": [
            "Hemograma, electrolitos plasmáticos (Na, K)",
            "Creatinina y clearance estimado (CKD-EPI)",
            "Orina completa con microalbuminuria o proteinuria 24h",
            "Perfil lipídico y glicemia en ayunas",
            "ECG de 12 derivaciones",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Peso, talla, IMC",
            "Fondo de ojo si disponible",
        ]},
    ]),
]

# Marcapaso | dc917bbe-bbff-4a36-89f3-895c41628b2f
CONTENT["dc917bbe-bbff-4a36-89f3-895c41628b2f"] = [
    hdr("Criterios de inclusión y requisitos de derivación para implante de marcapaso según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "amber", [
        "Bloqueo AV completo (grado III) sintomático o asintomático con FC <40 lpm",
        "Bloqueo AV 2° grado tipo II (Mobitz II) con síntomas",
        "Disfunción sinusal con síntomas (síncope, presíncope, bradicardia severa)",
        "Bloqueo bifascicular con síncope inexplicado",
        "Personas ≥15 años con indicación de marcapaso permanente",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Estudios Electrofisiológicos", "items": [
            "ECG de 12 derivaciones con trazado del trastorno",
            "Holter de ritmo de 24 horas si disponible",
            "Prueba de esfuerzo si corresponde",
        ]},
        {"label": "Evaluación Preoperatoria", "items": [
            "Hemograma, coagulación (TTPK, TP-INR)",
            "Función renal y electrolitos",
            "Radiografía de tórax",
            "Ecocardiograma si disponible",
        ]},
        {"label": "Datos Administrativos", "items": [
            "RUT válido",
            "Interconsulta con diagnóstico y código GES",
            "Epicrisis de episodios previos si existieran",
        ]},
    ]),
]

# Válvula aórtica | 89f5d99d-1d44-43f2-b1a1-a6f228035602
CONTENT["89f5d99d-1d44-43f2-b1a1-a6f228035602"] = [
    hdr("Criterios de inclusión y requisitos de derivación para tratamiento quirúrgico de valvulopatía aórtica según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "green", [
        "Estenosis aórtica severa sintomática (área valvular <1 cm², gradiente medio >40 mmHg)",
        "Insuficiencia aórtica severa con síntomas o disfunción sistólica (FEVI <50%)",
        "Valvulopatía aórtica con indicación quirúrgica confirmada por cardiólogo",
        "Seguimiento de valvulopatía aórtica moderada a severa en control especializado",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Estudio Cardiológico", "items": [
            "Ecocardiograma doppler con informe detallado de severidad",
            "ECG de 12 derivaciones",
            "Radiografía de tórax AP",
            "Coronariografía si indicada (edad >50 años o factores de riesgo)",
        ]},
        {"label": "Evaluación Funcional", "items": [
            "Clasificación NYHA documentada",
            "Prueba de esfuerzo si no hay contraindicación",
            "Evaluación nutricional",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta con diagnóstico GES explícito",
        ]},
    ]),
]

# Válvulas mitral y tricúspide | 41e275d6-1057-4075-a9ef-f6305a895bca
CONTENT["41e275d6-1057-4075-a9ef-f6305a895bca"] = [
    hdr("Criterios de inclusión y requisitos de derivación para tratamiento quirúrgico de valvulopatías mitral y tricúspide según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "purple", [
        "Estenosis mitral severa sintomática (área valvular <1.5 cm²)",
        "Insuficiencia mitral severa sintomática o con FEVI <60% o DDVI >40mm",
        "Prolapso valvular mitral con insuficiencia severa",
        "Valvulopatía tricúspide significativa asociada",
        "Indicación de intervención quirúrgica o percutánea confirmada",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Estudio Cardiológico", "items": [
            "Ecocardiograma Doppler con cuantificación de severidad",
            "ECG de 12 derivaciones",
            "Radiografía de tórax",
            "Score de Wilkins si estenosis mitral para valorar valvuloplastia",
        ]},
        {"label": "Estado Funcional", "items": [
            "Clasificación NYHA documentada",
            "PA, FC, saturación basal",
            "Función renal y hemograma",
        ]},
        {"label": "Datos Administrativos", "items": [
            "RUT válido",
            "Interconsulta médica con diagnóstico GES",
        ]},
    ]),
]

# ERC 4-5 | 696efcff77924d3a78533dd4
CONTENT["696efcff77924d3a78533dd4"] = [
    hdr("Criterios de inclusión y requisitos de derivación para ERC etapa 4-5 según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "ERC etapa 4 (TFG 15-29 mL/min/1.73m²) o etapa 5 (TFG <15 mL/min) no en diálisis",
        "Dos mediciones de TFG disminuida con más de 3 meses de diferencia",
        "Proteinuria persistente (ACR >300 mg/g o >500 mg/24h)",
        "Progresión documentada de la función renal",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Exámenes de Función Renal", "items": [
            "Creatinina sérica (2 mediciones con >3 meses de diferencia)",
            "TFG estimada por CKD-EPI o MDRD",
            "Orina completa con sedimento",
            "Relación albúmina/creatinina en orina (ACR)",
        ]},
        {"label": "Exámenes Metabólicos", "items": [
            "Electrolitos (Na, K, Cl, HCO3)",
            "Calcio, fósforo, PTH intacta",
            "Hemograma (anemia de ERC)",
            "Perfil lipídico, glicemia / HbA1c si diabético",
        ]},
        {"label": "Evaluación Clínica", "items": [
            "PA, peso, talla, IMC",
            "Interconsulta con diagnóstico GES",
            "Ecografía renal reciente",
            "RUT válido",
        ]},
    ]),
]

# ERC terminal (prevención secundaria) | 2d31e828-cf69-4a64-8274-6e706b2bf74a
CONTENT["2d31e828-cf69-4a64-8274-6e706b2bf74a"] = [
    hdr("Criterios de inclusión y requisitos de derivación para ERC en diálisis y evaluación de trasplante según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "ERC terminal en hemodiálisis o diálisis peritoneal",
        "Paciente en lista de espera o evaluación para trasplante renal",
        "Complicaciones de la terapia de sustitución renal",
        "Acceso vascular disfuncionante o complicado",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Documentación del Programa", "items": [
            "Certificado de centro de diálisis con frecuencia y modalidad",
            "Kt/V, hemograma, PTH, ferritina, saturación de transferrina (último mes)",
            "Acceso vascular: tipo, fecha de confección, última revisión",
        ]},
        {"label": "Evaluación para Trasplante", "items": [
            "Serología: VIH, VHB (HBsAg, Anti-HBc), VHC, CMV, EBV, Chagas",
            "Grupo sanguíneo y panel de anticuerpos (PRA)",
            "ECG y ecocardiograma",
            "Radiografía de tórax",
        ]},
        {"label": "Datos Administrativos", "items": [
            "RUT válido",
            "Interconsulta nefrológica con diagnóstico GES",
        ]},
    ]),
]

# Cáncer cervicouterino | 696efcff77924d3a78533dd2
CONTENT["696efcff77924d3a78533dd2"] = [
    hdr("Criterios de inclusión y requisitos de derivación para cáncer cervicouterino según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Cáncer cervicouterino confirmado histológicamente (≥15 años)",
        "PAP con resultado ASCUS, LSIL, HSIL, AGC o sospecha de cáncer",
        "Colposcopía con biopsia positiva para NIC 2, NIC 3, carcinoma in situ o invasor",
        "Lesión sugerente de cáncer cervical al examen ginecológico",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Confirmación Diagnóstica", "items": [
            "Informe de biopsia cervical con resultado anatomopatológico",
            "Informe de colposcopía",
            "PAP previo con resultado",
            "Estudio de VPH si disponible",
        ]},
        {"label": "Estadificación", "items": [
            "TAC de tórax, abdomen y pelvis con contraste",
            "RNM de pelvis si disponible",
            "Radiografía de tórax",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta con diagnóstico GES",
            "Hemograma, función renal y hepática",
        ]},
    ]),
]

# Cáncer de mama | 696efcff77924d3a78533dd1
CONTENT["696efcff77924d3a78533dd1"] = [
    hdr("Criterios de inclusión y requisitos de derivación para cáncer de mama según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Cáncer de mama confirmado histológicamente en personas ≥15 años",
        "Mamografía con BI-RADS 4 o 5 (alta sospecha)",
        "Nódulo mamario palpable con citología o biopsia sospechosa",
        "Seguimiento oncológico post-tratamiento",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Confirmación Diagnóstica", "items": [
            "Informe anatomopatológico de biopsia (core biopsy o trucut)",
            "Inmunohistoquímica: RE, RP, HER2, Ki67",
            "Mamografía bilateral reciente con informe BI-RADS",
            "Ecografía mamaria y axilar",
        ]},
        {"label": "Estadificación", "items": [
            "TAC de tórax y abdomen con contraste",
            "Cintigrafía ósea si sospecha metástasis",
            "Hemograma, función hepática, CEA, CA 15-3",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Antecedentes familiares de cáncer de mama/ovario",
            "Interconsulta oncológica",
        ]},
    ]),
]

# Cáncer gástrico | 696efcff77924d3a78533dd3
CONTENT["696efcff77924d3a78533dd3"] = [
    hdr("Criterios de inclusión y requisitos de derivación para cáncer gástrico según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "amber", [
        "Cáncer gástrico confirmado por endoscopía y biopsia",
        "Lesión endoscópica sospechosa de malignidad (Paris IIa, IIb, IIc, III)",
        "Síntomas de alarma: baja de peso >10%, disfagia, sangrado digestivo, vómitos persistentes",
        "Edad ≥40 años con epigastralgia persistente y H. pylori positivo sin respuesta a tratamiento",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Confirmación Diagnóstica", "items": [
            "Informe de endoscopía digestiva alta con fotos",
            "Biopsia gástrica con informe anatomopatológico",
            "Test de H. pylori (ureasas, biopsia o test respiratorio)",
        ]},
        {"label": "Estadificación", "items": [
            "TAC de tórax, abdomen y pelvis con contraste",
            "Ecoendoscopía si disponible",
            "CEA, CA 19-9, HER2 en tumor si estadio avanzado",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Hemograma y función renal/hepática",
            "Interconsulta oncológica",
        ]},
    ]),
]

# Cáncer colorrectal | b670e7b4-8b9c-46e6-91c8-3290999e1712
CONTENT["b670e7b4-8b9c-46e6-91c8-3290999e1712"] = [
    hdr("Criterios de inclusión y requisitos de derivación para cáncer colorrectal según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "green", [
        "Cáncer colorrectal confirmado por colonoscopía y biopsia",
        "Sangrado rectal de causa no hemorroidal o en mayores de 50 años",
        "Cambio en hábito intestinal persistente >4 semanas",
        "Antecedente familiar de cáncer colorrectal en familiar de primer grado <60 años",
        "Pólipo con displasia de alto grado en colonoscopía",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Confirmación Diagnóstica", "items": [
            "Colonoscopía total con informe y fotos",
            "Biopsia con informe anatomopatológico",
            "CEA y CA 19-9 basales",
        ]},
        {"label": "Estadificación", "items": [
            "TAC de tórax, abdomen y pelvis",
            "RNM de pelvis si cáncer de recto",
            "Test KRAS/NRAS/BRAF si estadio IV",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta con diagnóstico GES",
            "Hemograma y función renal/hepática",
        ]},
    ]),
]

# Cáncer de pulmón | accbebd9-cd1a-4414-8efd-43a205591d2f
CONTENT["accbebd9-cd1a-4414-8efd-43a205591d2f"] = [
    hdr("Criterios de inclusión y requisitos de derivación para cáncer de pulmón según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Cáncer de pulmón confirmado histológica o citológicamente",
        "Nódulo pulmonar >8mm con características sospechosas (Lung-RADS ≥3)",
        "Derrame pleural con citología positiva para células malignas",
        "Hemoptisis o masa pulmonar en fumador >40 años",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico", "items": [
            "TAC de tórax con contraste",
            "Informe de broncoscopía y biopsia si realizada",
            "Citología de esputo o líquido pleural si aplica",
        ]},
        {"label": "Estudio Molecular", "items": [
            "EGFR, ALK, ROS1, KRAS, PD-L1 (si adenocarcinoma confirmado)",
            "Biopsia líquida si no hay tejido disponible",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Historia tabáquica (paquetes/año)",
            "Interconsulta oncología o broncopulmonar",
        ]},
    ]),
]

# Cáncer de próstata | ad4d27ee-fcf5-4a47-8000-5bb4823970e0
CONTENT["ad4d27ee-fcf5-4a47-8000-5bb4823970e0"] = [
    hdr("Criterios de inclusión y requisitos de derivación para cáncer de próstata según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Cáncer de próstata confirmado por biopsia prostática (Gleason/ISUP score)",
        "PSA >10 ng/mL o PSA 4-10 con tacto rectal alterado",
        "Tacto rectal con nódulo o induración sospechosa",
        "Biopsia previa negativa con PSA persistentemente elevado",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico y Estadificación", "items": [
            "PSA total y libre con cociente",
            "Informe de biopsia con Gleason/ISUP score",
            "Tacto rectal documentado",
            "Cintigrafía ósea si PSA >20 o Gleason ≥8",
            "RNM de pelvis multiparamétrica si disponible",
        ]},
        {"label": "Evaluación General", "items": [
            "Función renal y hepática",
            "Hemograma",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta urológica u oncológica",
        ]},
    ]),
]

# Cáncer de ovario | cf979499-4e1d-422b-a32c-018f26bb2b93
CONTENT["cf979499-4e1d-422b-a32c-018f26bb2b93"] = [
    hdr("Criterios de inclusión y requisitos de derivación para cáncer de ovario epitelial según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Masa ovárica con características malignas en ecografía (ORADS ≥4)",
        "CA-125 elevado en mujer postmenopáusica con masa ovárica",
        "Carcinomatosis peritoneal con sospecha de origen ovárico",
        "Diagnóstico histológico de carcinoma de ovario, trompa o peritoneal primario",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Estudios de Imágenes", "items": [
            "Ecografía transvaginal con score ORADS",
            "TAC de abdomen y pelvis con contraste",
            "CA-125, HE4, índice ROMA",
        ]},
        {"label": "Evaluación Quirúrgica", "items": [
            "Hemograma, coagulación",
            "Función renal y hepática",
            "Albúmina sérica",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Estado menopaúsico documentado",
            "Interconsulta ginecología oncológica",
        ]},
    ]),
]

# Cáncer vesical | f3bab9dd-74e1-4820-b6c6-b34a65c87146
CONTENT["f3bab9dd-74e1-4820-b6c6-b34a65c87146"] = [
    hdr("Criterios de inclusión y requisitos de derivación para cáncer vesical según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "amber", [
        "Hematuria macroscópica sin causa infecciosa evidente en ≥40 años",
        "Masa vesical en ecografía o TAC sugerente de neoplasia",
        "Cistoscopía con lesión sospechosa de carcinoma urotelial",
        "Diagnóstico histológico de cáncer vesical confirmado",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Estudios Diagnósticos", "items": [
            "Orina completa y urocultivo",
            "Citología urinaria",
            "Ecografía renal y vesical",
            "Uro-TAC (abdomen y pelvis con fases)",
        ]},
        {"label": "Confirmación", "items": [
            "Informe de cistoscopía si realizada",
            "Informe anatomopatológico de RTUP si disponible",
            "Hemograma y función renal",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta urológica",
        ]},
    ]),
]

# Cáncer renal | 0de56f1e-1904-45b4-a74e-51e9d5a0691b
CONTENT["0de56f1e-1904-45b4-a74e-51e9d5a0691b"] = [
    hdr("Criterios de inclusión y requisitos de derivación para cáncer renal según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "purple", [
        "Masa renal sólida >1.5 cm con características malignas en TAC o RNM",
        "Hematuria macroscópica con masa renal en imágenes",
        "Diagnóstico histológico de carcinoma de células renales",
        "Lesión renal incidental Bosniak ≥III en TAC",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Imágenes", "items": [
            "TAC trifásico de abdomen y pelvis",
            "RNM renal si alergia a contraste o lesión compleja",
            "Radiografía o TAC de tórax",
        ]},
        {"label": "Laboratorio", "items": [
            "Función renal (creatinina, TFG)",
            "Hemograma y perfil hepático",
            "LDH si sospecha de estadio avanzado",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta urológica u oncológica",
        ]},
    ]),
]

# Cáncer de tiroides | 44b72db1-6886-422b-b75b-9b5d6976bed6
CONTENT["44b72db1-6886-422b-b75b-9b5d6976bed6"] = [
    hdr("Criterios de inclusión y requisitos de derivación para cáncer de tiroides según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "green", [
        "Nódulo tiroideo ≥1 cm con TIRADS 4 o 5 en ecografía",
        "PAAF con resultado Bethesda IV, V o VI",
        "Carcinoma tiroideo diferenciado confirmado por biopsia",
        "Bocio compresivo o subesternal con síntomas",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Estudios Tiroideos", "items": [
            "Ecografía tiroidea con clasificación TIRADS",
            "PAAF con informe citológico (Bethesda)",
            "TSH, T4 libre, T3",
            "Calcitonina si sospecha carcinoma medular",
        ]},
        {"label": "Estadificación si Confirmado", "items": [
            "TAC de cuello y tórax sin contraste (para cintigrafía posterior)",
            "Tiroglobulina basal",
            "Ecografía cervical con cadenas ganglionares",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta endocrinología o cirugía de cabeza y cuello",
        ]},
    ]),
]

# Linfomas | 146af38c-7db0-4fc4-a8d4-5f4033fd1b86
CONTENT["146af38c-7db0-4fc4-a8d4-5f4033fd1b86"] = [
    hdr("Criterios de inclusión y requisitos de derivación para linfomas según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "purple", [
        "Linfoma de Hodgkin o no Hodgkin confirmado histológicamente (≥15 años)",
        "Adenopatías periféricas >1.5 cm de más de 4 semanas sin causa infecciosa",
        "Síntomas B: fiebre, sudoración nocturna, baja de peso >10%",
        "Masa mediastínica o retroperitoneal en imágenes",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico", "items": [
            "Informe anatomopatológico + inmunohistoquímica de biopsia",
            "PET-CT o TAC de cuello, tórax, abdomen y pelvis",
            "LDH, beta-2 microglobulina",
        ]},
        {"label": "Laboratorio", "items": [
            "Hemograma con fórmula diferencial",
            "VHS, PCR, función hepática y renal",
            "Serología: VIH, VHB, VHC",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta hematológica",
            "Consentimiento informado",
        ]},
    ]),
]

# Leucemia | b44e610d-1a6e-49fc-8518-07eca7932a49
CONTENT["b44e610d-1a6e-49fc-8518-07eca7932a49"] = [
    hdr("Criterios de inclusión y requisitos de derivación para leucemia según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Leucemia en personas de 15 años y más (LMA, LLA, LLC, LMC u otras)",
        "Hemograma con blastos circulantes o pancitopenia inexplicada",
        "Mielograma con ≥20% de blastos (LMA) o linfocitosis clonal (LLC)",
        "Leucocitosis extrema (>100.000/mm³) o sospecha de proceso leucémico",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico Hematológico", "items": [
            "Hemograma completo con fórmula diferencial",
            "Mielograma con informe citológico",
            "Inmunofenotipo por citometría de flujo",
            "Citogenética y FISH si indicado",
            "PCR para fusiones específicas (BCR-ABL, PML-RARA si aplica)",
        ]},
        {"label": "Laboratorio General", "items": [
            "Coagulación completa (TP, TTPK, fibrinógeno)",
            "Función renal y hepática, ácido úrico, LDH",
            "Grupo sanguíneo",
            "Serología: VIH, VHB, VHC, CMV",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta hematológica urgente",
        ]},
    ]),
]

# Mieloma | 50aa8ef3-daac-415d-b028-c599240078c5
CONTENT["50aa8ef3-daac-415d-b028-c599240078c5"] = [
    hdr("Criterios de inclusión y requisitos de derivación para mieloma múltiple según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "amber", [
        "Mieloma múltiple sintomático (criterios CRAB: hipercalcemia, insuficiencia renal, anemia, lesiones óseas)",
        "Paraproteína en electroforesis con pico monoclonal en adultos >40 años",
        "Aplastamientos vertebrales múltiples o dolor óseo severo",
        "Bence-Jones positivo en orina",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico", "items": [
            "Electroforesis de proteínas sérica y urinaria",
            "Inmunofijación sérica y urinaria",
            "Cadenas ligeras libres en suero (FLC)",
            "Mielograma o biopsia de médula ósea",
        ]},
        {"label": "Evaluación de Daño Orgánico", "items": [
            "Hemograma (anemia)",
            "Calcemia, creatinina",
            "Serie ósea radiológica o PET-CT",
            "Beta-2 microglobulina y albumina (estadificación ISS)",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta hematología",
        ]},
    ]),
]

# Hemofilia | 7c0496c9-7cd2-4d08-8ae3-81a0f01c590a
CONTENT["7c0496c9-7cd2-4d08-8ae3-81a0f01c590a"] = [
    hdr("Criterios de inclusión y requisitos de derivación para hemofilia según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Hemofilia A o B confirmada por dosificación de factor VIII o IX",
        "Episodios de sangrado espontáneo o postraumático desproporcionado",
        "Hemartrosis recurrente con limitación funcional",
        "Diagnóstico familiar de hemofilia en familiar de primer grado",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico de Coagulación", "items": [
            "TTPK prolongado",
            "Dosificación de factor VIII y IX",
            "Inhibidor de factor VIII/IX si sospecha",
            "Grupo sanguíneo",
        ]},
        {"label": "Evaluación Articular", "items": [
            "Radiografía de articulaciones afectadas",
            "Score de artropatía hemofílica si disponible",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta hematología",
        ]},
    ]),
]

# Cáncer pediátrico | 14e327a1-6444-4bf0-b989-e16484b7af01
CONTENT["14e327a1-6444-4bf0-b989-e16484b7af01"] = [
    hdr("Criterios de inclusión y requisitos de derivación para cáncer en menores de 15 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Cáncer en personas menores de 15 años (cualquier tipo histológico)",
        "Masa tumoral palpable o en imágenes en menor de 15 años",
        "Signos de alarma: palidez, petequias, adenopatías, masa abdominal, cefalea persistente",
        "Hemograma alterado con blastos o pancitopenia en menor de 15 años",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Inicial", "items": [
            "Hemograma con fórmula diferencial",
            "Ecografía abdominal y/o área afectada",
            "Radiografía de tórax",
            "LDH, ácido úrico, función renal y hepática",
        ]},
        {"label": "Derivación Urgente", "items": [
            "Interconsulta a oncología pediátrica con URGENCIA",
            "Hospitalización si inestable hemodinámicamente",
            "Consentimiento informado de tutor legal",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido (menor y tutor)",
            "Carné de vacunas",
        ]},
    ]),
]

# Cuidados paliativos | cda1e4f0-3773-4f1a-ba33-f68bde078471
CONTENT["cda1e4f0-3773-4f1a-ba33-f68bde078471"] = [
    hdr("Criterios de inclusión y requisitos de derivación para alivio del dolor y cuidados paliativos por cáncer según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "purple", [
        "Cáncer avanzado o terminal sin opciones de tratamiento curativo",
        "Dolor oncológico severo (EVA ≥7) no controlado con analgésicos básicos",
        "Necesidad de opioides para control del dolor",
        "Síntomas refractarios en contexto oncológico",
        "Expectativa de vida estimada <12 meses por oncólogo tratante",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Documentación Oncológica", "items": [
            "Diagnóstico oncológico confirmado con informe anatomopatológico",
            "Último informe de imágenes",
            "Carta de oncólogo tratante con pronóstico estimado",
        ]},
        {"label": "Evaluación de Síntomas", "items": [
            "Escala EVA/NRS de dolor documentada",
            "Escala ECOG o Karnofsky",
            "Esquema analgésico actual y respuesta",
            "Evaluación nutricional",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta UAPO o equipo de paliativos",
        ]},
    ]),
]

# Osteosarcoma | a0b9543b-2ba2-4d90-9933-3b63f74d62cc
CONTENT["a0b9543b-2ba2-4d90-9933-3b63f74d62cc"] = [
    hdr("Criterios de inclusión y requisitos de derivación para osteosarcoma según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "green", [
        "Osteosarcoma confirmado histológicamente",
        "Masa ósea dolorosa en persona joven (<30 años) con imagen radiológica sugerente",
        "Lesión ósea lítica o blástica con características agresivas en imagen",
        "Fractura patológica en hueso previamente anormal",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico", "items": [
            "Radiografía del área comprometida",
            "RNM del hueso afectado con extensión",
            "Biopsia con informe anatomopatológico",
            "FAL (fosfatasa alcalina), LDH",
        ]},
        {"label": "Estadificación", "items": [
            "TAC de tórax para metástasis pulmonares",
            "Cintigrafía ósea",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta traumatología oncológica + oncología",
        ]},
    ]),
]

# DM1 | 390a2aa6-4b7b-4b4f-8247-192dc6f0d202
CONTENT["390a2aa6-4b7b-4b4f-8247-192dc6f0d202"] = [
    hdr("Criterios de inclusión y requisitos de derivación para diabetes mellitus tipo 1 según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Diabetes mellitus tipo 1 confirmada (insulinopenia, anticuerpos anti-GAD o anti-islotes)",
        "Mal control metabólico persistente (HbA1c >8%) a pesar de tratamiento optimizado",
        "Episodios frecuentes de hipoglicemia severa o cetoacidosis diabética",
        "Evaluación para bomba de insulina o monitoreo continuo de glucosa",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Control Metabólico", "items": [
            "HbA1c reciente (<3 meses)",
            "Glicemias capilares de los últimos 30 días",
            "Esquema de insulina actual (basal-bolo, dosis, ajustes)",
            "Registro de hipoglicemias severas",
        ]},
        {"label": "Evaluación de Complicaciones", "items": [
            "Fondo de ojo (retinopatía)",
            "Microalbuminuria o proteinuria 24h",
            "Creatinina y TFG",
            "Monofilamento y evaluación de pie diabético",
            "Perfil lipídico",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Peso, talla, IMC",
            "Interconsulta endocrinológica",
        ]},
    ]),
]

# DM2 | 696ea74c245ef362de4f4339
CONTENT["696ea74c245ef362de4f4339"] = [
    hdr("Criterios de inclusión y requisitos de derivación para diabetes mellitus tipo 2 según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "amber", [
        "DM2 con HbA1c >8% en tratamiento con 2 o más hipoglicemiantes orales",
        "DM2 que requiere inicio de insulina o ajuste complejo de esquema",
        "DM2 con complicaciones crónicas: nefropatía, retinopatía, neuropatía, macroangiopatía",
        "DM2 en embarazo (diabetes gestacional o pregestacional)",
        "DM2 con IMC >35 para evaluación de cirugía bariátrica",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Control Metabólico", "items": [
            "HbA1c últimos 3 meses",
            "Glicemia en ayunas y postprandial",
            "Tratamiento actual (fármacos, dosis, adherencia)",
        ]},
        {"label": "Evaluación de Riesgo CV y Renal", "items": [
            "PA, perfil lipídico",
            "Creatinina y microalbuminuria",
            "ECG en mayores de 50 años",
            "Evaluación de pie diabético (monofilamento)",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "IMC, perímetro de cintura",
            "Interconsulta endocrinología",
        ]},
    ]),
]

# Hipotiroidismo | 696efcff77924d3a78533dce
CONTENT["696efcff77924d3a78533dce"] = [
    hdr("Criterios de inclusión y requisitos de derivación para hipotiroidismo según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Hipotiroidismo primario confirmado (TSH >10 mUI/L con T4L baja)",
        "Hipotiroidismo subclínico con TSH >10 mUI/L o sintomático",
        "Hipotiroidismo en embarazo (TSH >2.5 mUI/L en 1T o >3 mUI/L en 2T-3T)",
        "Hipotiroidismo de difícil control o de causa secundaria/central",
        "Tiroiditis de Hashimoto con hipotiroidismo establecido",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Función Tiroidea", "items": [
            "TSH, T4 libre, T3 libre",
            "Anti-TPO y anti-tiroglobulina",
            "Ecografía tiroidea si bocio o nódulo",
        ]},
        {"label": "Tratamiento Actual", "items": [
            "Levotiroxina: dosis actual y respuesta",
            "Tiempo de diagnóstico y controles previos",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta endocrinología",
        ]},
    ]),
]

# Retinopatía diabética | 696ea74c245ef362de4f4337
CONTENT["696ea74c245ef362de4f4337"] = [
    hdr("Criterios de inclusión y requisitos de derivación para retinopatía diabética según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Diabetes mellitus tipo 1 o 2 con hallazgos de retinopatía en fondo de ojo",
        "Retinopatía diabética no proliferativa moderada a severa",
        "Retinopatía diabética proliferativa (neovascularización)",
        "Edema macular diabético clínicamente significativo",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Oftalmológica", "items": [
            "Fondo de ojo con informe o retinografía no midriática",
            "Clasificación de severidad (ETDRS o DRSS internacional)",
            "OCT macular si disponible",
            "Agudeza visual corregida",
        ]},
        {"label": "Control Metabólico", "items": [
            "HbA1c",
            "PA",
            "Perfil lipídico",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta oftalmología",
        ]},
    ]),
]

# ACV | 696efcff77924d3a78533dd5
CONTENT["696efcff77924d3a78533dd5"] = [
    hdr("Criterios de inclusión y requisitos de derivación para ataque cerebrovascular isquémico según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "ACV isquémico agudo en personas ≥15 años (primeras 72h para activación GES)",
        "TIA con déficit transitorio y evidencia de isquemia en neuroimagen",
        "Seguimiento post-ACV con secuelas neurológicas",
        "ACV con indicación de trombolisis o trombectomía mecánica",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Urgencia / Agudo", "items": [
            "TC de encéfalo sin contraste (o RNM DWI si disponible)",
            "NIHSS documentado al ingreso",
            "Hora exacta de inicio de síntomas",
            "PA, glicemia capilar, ECG al ingreso",
        ]},
        {"label": "Seguimiento / Prevención Secundaria", "items": [
            "RNM de encéfalo con DWI, FLAIR",
            "Doppler carotídeo y transcraneal",
            "Ecocardiograma transtorácico",
            "Holter de ritmo 24-72h",
            "Perfil lipídico, HbA1c",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta neurológica",
            "Score mRS al alta documentado",
        ]},
    ]),
]

# Epilepsia infantil | 105de3f0-3055-4cb4-a124-f4b46bcfb945
CONTENT["105de3f0-3055-4cb4-a124-f4b46bcfb945"] = [
    hdr("Criterios de inclusión y requisitos de derivación para epilepsia en personas desde 1 año y menores de 15 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Dos o más crisis epilépticas no provocadas con >24h de diferencia en 1-14 años",
        "Crisis epilépticas con EEG anormal compatible con epilepsia",
        "Epilepsia refractaria (fallo a 2 antiepilépticos en dosis adecuadas)",
        "Síndrome epiléptico específico: West, Lennox-Gastaut, Dravet u otros",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico", "items": [
            "EEG de vigilia y/o sueño con informe",
            "RNM de encéfalo con protocolo de epilepsia",
            "Descripción detallada de las crisis (tipo, duración, frecuencia)",
            "Video de crisis si disponible",
        ]},
        {"label": "Tratamiento Actual", "items": [
            "Antiepilépticos actuales con dosis y niveles plasmáticos si aplica",
            "Respuesta al tratamiento (reducción de crisis)",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta neuropediatría",
        ]},
    ]),
]

# Epilepsia adulto | 3a6e79f1-9214-48f7-acdf-5b740de89486
CONTENT["3a6e79f1-9214-48f7-acdf-5b740de89486"] = [
    hdr("Criterios de inclusión y requisitos de derivación para epilepsia en adultos ≥15 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Epilepsia en adultos ≥15 años con crisis recurrentes",
        "Epilepsia refractaria (fallo a ≥2 antiepilépticos en dosis y tiempo adecuados)",
        "Primera crisis epiléptica no provocada con sospecha de epilepsia focal",
        "Epilepsia con posible indicación quirúrgica",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico", "items": [
            "EEG con descripción de foco o patrón epileptiforme",
            "RNM de encéfalo con protocolo de epilepsia (FLAIR, T2, T1)",
            "Descripción de tipo de crisis, duración, frecuencia mensual",
        ]},
        {"label": "Tratamiento", "items": [
            "Antiepilépticos actuales con dosis",
            "Niveles plasmáticos si disponibles",
            "Adherencia al tratamiento",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta neurología adultos",
        ]},
    ]),
]

# Parkinson | 32cec82e-412a-4d75-89fc-f0f6e3bc252d
CONTENT["32cec82e-412a-4d75-89fc-f0f6e3bc252d"] = [
    hdr("Criterios de inclusión y requisitos de derivación para enfermedad de Parkinson según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "green", [
        "Enfermedad de Parkinson idiopática diagnosticada clínicamente (criterios MDS-UPDRS)",
        "Parkinsonismo con necesidad de ajuste de tratamiento dopaminérgico",
        "Parkinson con fluctuaciones motoras o discinesias",
        "Sospecha de parkinsonismo atípico (AMS, PSP, DCB)",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Neurológica", "items": [
            "Escala UPDRS o MoCA documentada",
            "RNM de encéfalo (para descartar causas secundarias)",
        ]},
        {"label": "Tratamiento", "items": [
            "Levodopa y otros dopaminérgicos: dosis actuales",
            "Respuesta al tratamiento y tiempo de encendido/apagado",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta neurología",
        ]},
    ]),
]

# Esclerosis múltiple | ef881e41-0fd1-47c9-aab9-0d0292a2a485
CONTENT["ef881e41-0fd1-47c9-aab9-0d0292a2a485"] = [
    hdr("Criterios de inclusión y requisitos de derivación para esclerosis múltiple remitente recurrente según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "purple", [
        "Esclerosis múltiple confirmada por criterios de McDonald 2017",
        "Primer brote desmielinizante con criterios de síndrome clínicamente aislado (CIS)",
        "EM con brotes que requiere inicio o cambio de terapia modificadora",
        "EM progresiva primaria o secundaria con deterioro funcional",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico", "items": [
            "RNM de encéfalo y médula espinal con gadolinio (protocolo EM)",
            "Potenciales evocados visuales",
            "Estudio LCR: bandas oligoclonales, índice IgG",
            "Descripción de brotes previos y secuelas",
        ]},
        {"label": "Seguimiento", "items": [
            "Terapia modificadora de enfermedad actual",
            "Escala EDSS documentada",
            "Último brote y fecha",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta neurología especializada en EM",
        ]},
    ]),
]

# Alzheimer | 696ea74c245ef362de4f4338
CONTENT["696ea74c245ef362de4f4338"] = [
    hdr("Criterios de inclusión y requisitos de derivación para enfermedad de Alzheimer y otras demencias según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "amber", [
        "Demencia tipo Alzheimer con diagnóstico clínico confirmado (criterios NIA-AA)",
        "Deterioro cognitivo leve (MCI) con sospecha de etiología Alzheimer",
        "Demencia con MMSE <24 con impacto funcional significativo",
        "Necesidad de inicio o ajuste de tratamiento farmacológico",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Cognitiva", "items": [
            "MMSE o MoCA con puntaje y fecha",
            "Test del reloj o evaluación neuropsicológica breve",
            "Escala CDR (Clinical Dementia Rating)",
            "Evaluación funcional (AVD básicas e instrumentales)",
        ]},
        {"label": "Neuroimagen y Laboratorio", "items": [
            "RNM de encéfalo",
            "TSH, vitamina B12, folato",
            "Hemograma, función renal/hepática",
        ]},
        {"label": "Datos del Paciente y Familia", "items": [
            "RUT válido",
            "Cuidador principal identificado",
            "Interconsulta neurología o geriatría",
        ]},
    ]),
]

# Tumores SNC | 0e3b7497-b79c-470a-a320-e2f542568c29
CONTENT["0e3b7497-b79c-470a-a320-e2f542568c29"] = [
    hdr("Criterios de inclusión y requisitos de derivación para tumores primarios del SNC según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Tumor primario del SNC confirmado o sospechado por neuroimagen (≥15 años)",
        "Masa intracraneal con efecto de masa o captación de contraste",
        "Crisis epilépticas de inicio reciente en adulto con lesión en neuroimagen",
        "Déficit neurológico focal de causa no vascular en neuroimagen",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Neuroimagen", "items": [
            "RNM de encéfalo con gadolinio (protocolo tumoral)",
            "Espectroscopía o perfusión si disponible",
            "TAC de encéfalo con contraste si RNM no disponible",
        ]},
        {"label": "Estado General", "items": [
            "Escala de Karnofsky o ECOG",
            "Descripción de síntomas neurológicos",
            "Uso de corticoides: dosis y duración",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta neurocirugía urgente",
            "Hemograma y coagulación si cirugía inminente",
        ]},
    ]),
]

# Esquizofrenia | ec705134-c8cf-4c83-86f3-7dce68dcf20a
CONTENT["ec705134-c8cf-4c83-86f3-7dce68dcf20a"] = [
    hdr("Criterios de inclusión y requisitos de derivación para esquizofrenia según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "purple", [
        "Esquizofrenia diagnosticada según DSM-5 o CIE-10 (F20.x)",
        "Primer episodio psicótico con sospecha de esquizofrenia",
        "Psicosis resistente a tratamiento (sin respuesta a 2 antipsicóticos)",
        "Descompensación psicótica aguda",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Psiquiátrica", "items": [
            "Interconsulta con descripción de síntomas (positivos, negativos, desorganizados)",
            "Tratamiento antipsicótico actual con dosis y tiempo",
            "Antecedente de hospitalizaciones psiquiátricas",
        ]},
        {"label": "Exámenes de Rutina", "items": [
            "Hemograma, glicemia, perfil lipídico",
            "TSH",
            "Screening de drogas en orina",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Red de apoyo familiar identificada",
            "Interconsulta psiquiatría",
        ]},
    ]),
]

# Depresión | 696efcff77924d3a78533dca
CONTENT["696efcff77924d3a78533dca"] = [
    hdr("Criterios de inclusión y requisitos de derivación para depresión en personas ≥15 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Depresión mayor en personas ≥15 años (criterios DSM-5 o CIE-10 F32/F33)",
        "Episodio depresivo moderado a severo (PHQ-9 ≥10)",
        "Depresión refractaria (fallo a ≥2 antidepresivos en dosis y tiempo adecuados)",
        "Depresión con riesgo suicida activo",
        "Depresión en contexto de comorbilidad psiquiátrica mayor",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación de Depresión", "items": [
            "PHQ-9 o escala de Hamilton con puntaje y fecha",
            "Evaluación de riesgo suicida documentada",
            "Antidepresivos actuales: nombre, dosis, duración",
            "Respuesta al tratamiento documentada",
        ]},
        {"label": "Diagnóstico Diferencial", "items": [
            "TSH (descartar hipotiroidismo)",
            "Hemograma (descartar anemia)",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta psiquiatría",
            "Red de apoyo y riesgo social",
        ]},
    ]),
]

# Trastorno bipolar | e816b3ce-91f8-4659-8586-a7c551125239
CONTENT["e816b3ce-91f8-4659-8586-a7c551125239"] = [
    hdr("Criterios de inclusión y requisitos de derivación para trastorno bipolar según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "amber", [
        "Trastorno bipolar tipo I o II diagnosticado (DSM-5 F31.x)",
        "Episodio maníaco o hipomaníaco activo",
        "Depresión bipolar sin respuesta a tratamiento estabilizador",
        "Trastorno bipolar con psicosis o riesgo suicida",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Psiquiátrica", "items": [
            "Descripción de episodios maníacos/hipomaníacos previos",
            "Estabilizadores actuales: litio, valproato, lamotrigina con dosis",
            "Antipsicóticos asociados",
        ]},
        {"label": "Laboratorio para Estabilizadores", "items": [
            "Litemia si usa litio (rango terapéutico 0.6-1.2 mEq/L)",
            "Función renal y tiroidea (litio)",
            "Hemograma y hepático (valproato)",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta psiquiatría",
            "Riesgo suicida documentado",
        ]},
    ]),
]

# Alcohol/drogas jóvenes | dd0b1b9f-0848-48ab-9e9f-82aaef29e772
CONTENT["dd0b1b9f-0848-48ab-9e9f-82aaef29e772"] = [
    hdr("Criterios de inclusión y requisitos de derivación para consumo perjudicial de alcohol y drogas en menores de 20 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Consumo perjudicial o dependencia de alcohol/sustancias en menores de 20 años",
        "AUDIT-C ≥3 en hombres o ≥2 en mujeres (adolescentes)",
        "Síndrome de abstinencia con riesgo de complicaciones",
        "Fracaso de intervención breve ambulatoria previa",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación de Consumo", "items": [
            "AUDIT-C o AUDIT con puntaje",
            "Tipo de sustancia, frecuencia, cantidad y tiempo de consumo",
            "Antecedentes de hospitalizaciones por abstinencia o sobredosis",
        ]},
        {"label": "Laboratorio", "items": [
            "Hemograma, VCM",
            "GGT, transaminasas",
            "Screening toxicológico en orina",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Tutor legal si menor de edad",
            "Interconsulta psiquiatría o COSAM",
        ]},
    ]),
]

# EPOC | 696efcff77924d3a78533dcc
CONTENT["696efcff77924d3a78533dcc"] = [
    hdr("Criterios de inclusión y requisitos de derivación para EPOC según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "EPOC confirmado por espirometría post-broncodilatador: VEF1/CVF <0.70",
        "EPOC GOLD II-IV con síntomas o exacerbaciones frecuentes",
        "EPOC con hipoxemia crónica (SaO2 <88%) candidato a O2 domiciliario",
        "EPOC con indicación de rehabilitación pulmonar",
        "EPOC con ≥2 exacerbaciones/año a pesar de tratamiento optimizado",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Espirometría", "items": [
            "Espirometría post-broncodilatador con informe (VEF1, CVF, VEF1/CVF)",
            "Clasificación GOLD y grupo A/B/E",
        ]},
        {"label": "Evaluación Clínica", "items": [
            "Saturometría basal y de esfuerzo",
            "CAT o mMRC documentados",
            "Número de exacerbaciones en el último año",
            "Tratamiento inhalador actual",
            "Historia tabáquica (paquetes-año)",
        ]},
        {"label": "Exámenes", "items": [
            "Hemograma (poliglobulia)",
            "Radiografía de tórax AP y lateral",
            "Gasometría arterial si SaO2 <92%",
            "RUT válido",
        ]},
    ]),
]

# Asma pediátrico | 696efcff77924d3a78533dcb
CONTENT["696efcff77924d3a78533dcb"] = [
    hdr("Criterios de inclusión y requisitos de derivación para asma bronquial moderada y grave en menores de 15 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "green", [
        "Asma bronquial moderada o grave en menores de 15 años",
        "Crisis asmáticas recurrentes (≥3/año) a pesar de tratamiento de mantención",
        "Asma con hospitalización por crisis en el último año",
        "Uso frecuente de corticoide sistémico para el asma",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico y Control", "items": [
            "Espirometría si ≥5 años (o PEF si no disponible)",
            "Cuestionario de control del asma (c-ACT) con puntaje",
        ]},
        {"label": "Tratamiento", "items": [
            "Tratamiento de mantención actual con técnica de inhalación",
            "Broncodilatador de rescate: frecuencia de uso",
            "Número de crisis en el último año y gravedad",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Peso y talla",
            "Interconsulta broncopulmonar pediátrico",
        ]},
    ]),
]

# Asma adulto | 497a8ff3-6423-4261-b832-21f370f9cec9
CONTENT["497a8ff3-6423-4261-b832-21f370f9cec9"] = [
    hdr("Criterios de inclusión y requisitos de derivación para asma bronquial en personas ≥15 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "green", [
        "Asma bronquial moderada o grave en adultos ≥15 años con mal control",
        "Asma severa refractaria a dosis altas de CSI + LABA",
        "Asma con hospitalizaciones frecuentes",
        "Asma con dependencia de corticoide oral",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Función Pulmonar", "items": [
            "Espirometría pre y post broncodilatador",
            "Clasificación de severidad (GINA)",
        ]},
        {"label": "Control y Tratamiento", "items": [
            "ACT con puntaje",
            "Tratamiento actual completo con dosis",
            "Alergias documentadas",
            "Eosinofilia en sangre si disponible",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta broncopulmonar adultos",
        ]},
    ]),
]

# Fibrosis quística | 734b76cc-c348-4156-b6a4-044b22f72476
CONTENT["734b76cc-c348-4156-b6a4-044b22f72476"] = [
    hdr("Criterios de inclusión y requisitos de derivación para fibrosis quística según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "purple", [
        "Fibrosis quística confirmada por test del sudor (Cl >60 mEq/L) o mutación CFTR",
        "Insuficiencia pancreática exocrina con esteatorrea",
        "Infecciones respiratorias recurrentes con gérmenes típicos",
        "VEF1 <70% del predicho",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico", "items": [
            "Test del sudor con resultado (Cl en mEq/L)",
            "Estudio genético de mutaciones CFTR si disponible",
            "Espirometría (VEF1, CVF)",
        ]},
        {"label": "Seguimiento", "items": [
            "Cultivo de esputo con antibiograma (último 6 meses)",
            "Estado nutricional: peso, talla, IMC",
            "Vitaminas liposolubles (A, D, E, K)",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta broncopulmonar o equipo multidisciplinario FQ",
        ]},
    ]),
]

# Rehab COVID | 5a93339d-f5e8-499a-896a-edee30086b1c
CONTENT["5a93339d-f5e8-499a-896a-edee30086b1c"] = [
    hdr("Criterios de inclusión y requisitos de derivación para rehabilitación SARS-CoV-2 según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "amber", [
        "COVID-19 grave o crítico con secuelas funcionales persistentes (>12 semanas)",
        "Disnea persistente post-COVID con limitación funcional (mMRC ≥2)",
        "Fatiga crónica post-COVID que impide actividades de la vida diaria",
        "Fibrosis pulmonar post-COVID en TAC",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Documentación", "items": [
            "Confirmación de COVID-19 previo (PCR, antígeno o serología positiva)",
            "Epicrisis de hospitalización si estuvo hospitalizado",
            "Tiempo transcurrido desde el episodio agudo",
        ]},
        {"label": "Evaluación Funcional", "items": [
            "Saturometría basal y con esfuerzo",
            "Escala mMRC de disnea",
            "Espirometría si tolera",
            "Test de marcha de 6 minutos",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta broncopulmonar o medicina física y rehabilitación",
        ]},
    ]),
]

# Escoliosis | 0d625400-8943-465b-a784-5ba7257ee429
CONTENT["0d625400-8943-465b-a784-5ba7257ee429"] = [
    hdr("Criterios de inclusión y requisitos de derivación para tratamiento quirúrgico de escoliosis en menores de 25 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Escoliosis idiopática en personas menores de 25 años con indicación quirúrgica",
        "Ángulo de Cobb ≥45° en escoliosis torácica o ≥40° en escoliosis lumbar",
        "Progresión documentada del ángulo de Cobb (>5° en 6 meses) con potencial de crecimiento",
        "Escoliosis con compromiso cardiopulmonar",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Imágenes", "items": [
            "Radiografía de columna total AP y lateral de pie",
            "Ángulo de Cobb medido y documentado",
            "Clasificación de Risser (madurez esquelética)",
        ]},
        {"label": "Evaluación General", "items": [
            "Peso, talla, IMC",
            "Función pulmonar si escoliosis severa",
            "Hemograma y coagulación",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta traumatología o cirugía de columna",
        ]},
    ]),
]

# Endoprótesis cadera | 16fa6559-f50b-4c99-89f7-33b1e82e6183
CONTENT["16fa6559-f50b-4c99-89f7-33b1e82e6183"] = [
    hdr("Criterios de inclusión y requisitos de derivación para endoprótesis total de cadera en personas ≥65 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "amber", [
        "Artrosis de cadera severa con limitación funcional severa en personas ≥65 años",
        "Escala de Lequesne ≥10 o WOMAC con limitación funcional severa documentada",
        "Fractura de cuello femoral en personas ≥65 años",
        "Fracaso de tratamiento conservador con kinesioterapia y analgesia",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Funcional", "items": [
            "Escala de Lequesne o WOMAC con puntaje",
            "Descripción de limitación funcional",
        ]},
        {"label": "Imágenes y Preoperatorio", "items": [
            "Radiografía de pelvis AP y axial de cadera",
            "Clasificación Kellgren-Lawrence de artrosis",
            "Hemograma, coagulación",
            "Grupo sanguíneo",
            "Función renal y glicemia",
            "ECG y evaluación cardiológica si >65 años",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta traumatología",
        ]},
    ]),
]

# Artrosis | 696efcff77924d3a78533dcd
CONTENT["696efcff77924d3a78533dcd"] = [
    hdr("Criterios de inclusión y requisitos de derivación para artrosis de cadera y/o rodilla en personas ≥55 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "green", [
        "Artrosis de cadera y/o rodilla leve a moderada en personas ≥55 años",
        "Dolor crónico articular con limitación funcional documentada",
        "Fracaso de tratamiento farmacológico básico (AINE, paracetamol)",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Funcional y Dolor", "items": [
            "EVA de dolor en reposo y movimiento",
            "Escala WOMAC o Lequesne",
            "Goniometría de articulación afectada",
        ]},
        {"label": "Imágenes", "items": [
            "Radiografía de rodillas AP carga y/o cadera AP bilateral",
            "Clasificación Kellgren-Lawrence",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Fármacos actuales y respuesta",
        ]},
    ]),
]

# HNP lumbar | aa072279-9dbe-4704-b0aa-099292715a51
CONTENT["aa072279-9dbe-4704-b0aa-099292715a51"] = [
    hdr("Criterios de inclusión y requisitos de derivación para hernia del núcleo pulposo lumbar según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "HNP lumbar con radiculopatía confirmada por imagen",
        "Síntomas >6 semanas sin respuesta a tratamiento conservador",
        "Déficit neurológico progresivo: paresia, pérdida de sensibilidad",
        "Síndrome de cauda equina (urgencia quirúrgica)",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico por Imagen", "items": [
            "RNM de columna lumbar con informe (nivel, tipo y grado de hernia)",
            "TAC de columna lumbar si contraindicación a RNM",
        ]},
        {"label": "Evaluación Clínica", "items": [
            "Descripción del nivel radicular afectado",
            "Signo de Lasègue documentado",
            "Escala EVA de dolor y ODI (Oswestry)",
        ]},
        {"label": "Tratamiento Previo y Datos", "items": [
            "Kinesiología (sesiones y respuesta)",
            "Analgesia actual y respuesta",
            "RUT válido",
        ]},
    ]),
]

# Colecistectomía | 696efcff77924d3a78533dcf
CONTENT["696efcff77924d3a78533dcf"] = [
    hdr("Criterios de inclusión y requisitos de derivación para colecistectomía preventiva en personas de 35-49 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "amber", [
        "Personas entre 35 y 49 años con cálculos biliares asintomáticos",
        "Colelitiasis sintomática con cólicos biliares recurrentes",
        "Colecistitis aguda o crónica con indicación quirúrgica",
        "Pólipo vesicular ≥10mm o con factores de riesgo de malignización",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico", "items": [
            "Ecografía abdominal con informe (tamaño de cálculos, estado de vesícula)",
            "Descripción de síntomas biliares",
        ]},
        {"label": "Evaluación Preoperatoria", "items": [
            "Hemograma, coagulación",
            "Función hepática (bilirrubina, FA, GGT)",
            "Amilasa/lipasa si colecistitis",
            "ECG en >40 años",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido (edad 35-49 años verificada)",
            "Interconsulta cirugía general",
        ]},
    ]),
]

# Fisura labiopalatina | 40389e49-9062-4fe4-830c-6fc7ff69bccf
CONTENT["40389e49-9062-4fe4-830c-6fc7ff69bccf"] = [
    hdr("Criterios de inclusión y requisitos de derivación para fisura labiopalatina según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Fisura labial con o sin fisura palatina confirmada al nacimiento",
        "Fisura palatina aislada confirmada",
        "Cualquier tipo de fisura orofacial que requiera corrección quirúrgica",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico", "items": [
            "Descripción y fotografía clínica de la fisura",
            "Tipo de fisura (Veau I, II, III, IV)",
            "Ecografía prenatal con diagnóstico si disponible",
        ]},
        {"label": "Evaluación General", "items": [
            "Evaluación genética si sospecha de síndrome asociado",
            "Evaluación de alimentación y peso (lactante)",
            "Ecografía cardíaca si sospecha de cardiopatía",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido (menor y tutor)",
            "Interconsulta cirugía maxilofacial o plástica",
        ]},
    ]),
]

# Displasia cadera | 077e850d-cded-4863-aa08-113e7d59aab0
CONTENT["077e850d-cded-4863-aa08-113e7d59aab0"] = [
    hdr("Criterios de inclusión y requisitos de derivación para displasia luxante de caderas según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "green", [
        "Displasia del desarrollo de la cadera (DDC) detectada por screening neonatal",
        "Graf tipo II en ecografía de cadera en lactante <6 meses",
        "Asimetría de pliegues o limitación de abducción al examen físico neonatal",
        "Ortolani o Barlow positivos al examen",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico", "items": [
            "Ecografía de caderas con clasificación de Graf (en <4-6 meses)",
            "Radiografía de pelvis AP si >4-6 meses",
        ]},
        {"label": "Evaluación Clínica", "items": [
            "Descripción de examen físico: Ortolani, Barlow, abducción",
            "Peso y edad gestacional",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido (menor y tutor)",
            "Interconsulta traumatología infantil",
        ]},
    ]),
]

# Cataratas | 696efcff77924d3a78533dd0
CONTENT["696efcff77924d3a78533dd0"] = [
    hdr("Criterios de inclusión y requisitos de derivación para tratamiento quirúrgico de cataratas según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "amber", [
        "Catarata con AV ≤0.3 en el ojo a operar con mejor corrección",
        "Catarata con impacto funcional significativo documentado",
        "Catarata traumática en cualquier edad",
        "Catarata congénita en menores de 15 años (urgencia)",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Oftalmológica", "items": [
            "Agudeza visual corregida con mejor corrección óptica (MAVC)",
            "Examen con lámpara de hendidura (densidad y tipo de catarata)",
            "Presión intraocular (PIO)",
            "Fondo de ojo dilatado",
        ]},
        {"label": "Biometría Preoperatoria", "items": [
            "Biometría ocular (longitud axial, queratometría)",
            "Recuento de células endoteliales si disponible",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta oftalmología",
        ]},
    ]),
]

# Vicios de refracción | d4d5f0b5-c80f-47d0-87a2-2b821d6643ac
CONTENT["d4d5f0b5-c80f-47d0-87a2-2b821d6643ac"] = [
    hdr("Criterios de inclusión y requisitos de derivación para vicios de refracción en personas ≥65 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Vicios de refracción en personas ≥65 años con necesidad de corrección óptica",
        "Agudeza visual sin corrección ≤0.5",
        "Presbicia con necesidad de corrección para visión cercana",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Visual", "items": [
            "Agudeza visual sin corrección (AVSC) y con corrección (MAVC)",
            "Refracción objetiva (autorrefractómetro) y/o subjetiva",
        ]},
        {"label": "Examen Ocular", "items": [
            "Biomicroscopía de segmento anterior",
            "Fondo de ojo si indicado",
            "Tonometría",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido (≥65 años verificada)",
            "Interconsulta oftalmología",
        ]},
    ]),
]

# Estrabismo | 621eace6-3e44-48ff-b43a-12ab248095a9
CONTENT["621eace6-3e44-48ff-b43a-12ab248095a9"] = [
    hdr("Criterios de inclusión y requisitos de derivación para estrabismo en personas menores de 9 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "green", [
        "Estrabismo en personas menores de 9 años con indicación de tratamiento",
        "Esotropia o exotropia constante o intermitente significativa",
        "Ambliopía asociada al estrabismo",
        "Estrabismo vertical o parético",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Oftalmológica Pediátrica", "items": [
            "Agudeza visual (con y sin corrección, cada ojo separado)",
            "Reflejo corneal de Hirschberg",
            "Cover test y uncover test",
            "Refracción bajo cicloplejia",
            "Fondo de ojo dilatado",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido (menor de 9 años verificada)",
            "Interconsulta oftalmología pediátrica",
        ]},
    ]),
]

# Desprendimiento retina | 2b610547-f2bd-43c5-87ad-e6efc78d1e62
CONTENT["2b610547-f2bd-43c5-87ad-e6efc78d1e62"] = [
    hdr("Criterios de inclusión y requisitos de derivación para desprendimiento de retina regmatógeno según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Desprendimiento de retina regmatógeno no traumático confirmado",
        "Síntomas de alerta: fotopsias, miodesopsias nuevas, pérdida de campo visual",
        "Agujero o desgarro retinal con riesgo de desprendimiento",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Oftalmológica (URGENCIA)", "items": [
            "Agudeza visual actual",
            "Fondo de ojo con descripción de localización",
            "OCT si disponible",
            "Ecografía ocular en modo B si no se visualiza retina",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Derivación URGENTE a oftalmología",
            "Tiempo de evolución de síntomas",
        ]},
    ]),
]

# Hipoacusia adulto | 23e4223d-7d08-4c8f-8cce-34840f8d0fca
CONTENT["23e4223d-7d08-4c8f-8cce-34840f8d0fca"] = [
    hdr("Criterios de inclusión y requisitos de derivación para hipoacusia bilateral en personas ≥65 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "purple", [
        "Hipoacusia bilateral con indicación de audífono en ≥65 años",
        "Pérdida auditiva ≥40 dB en mejor oído en frecuencias conversacionales",
        "Impacto funcional significativo documentado",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Audiológica", "items": [
            "Audiometría tonal liminal con umbral auditivo bilateral",
            "Impedanciometría (timpanograma y reflejos estapediales)",
            "Logoaudiometría si disponible",
        ]},
        {"label": "Evaluación ORL", "items": [
            "Otoscopía documentada",
            "Descarte de causa tratable",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido (≥65 años)",
            "Interconsulta ORL",
        ]},
    ]),
]

# Hipoacusia pediátrico moderada/severa/profunda | 1f8b7f23-acd8-4758-a8f6-cee6d23b9537
CONTENT["1f8b7f23-acd8-4758-a8f6-cee6d23b9537"] = [
    hdr("Criterios de inclusión y requisitos de derivación para hipoacusia moderada, severa y profunda en personas menores de 4 años según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "purple", [
        "Hipoacusia bilateral en menores de 4 años detectada por screening neonatal (PEAT alterado)",
        "Pérdida auditiva ≥40 dB en mejor oído en menor de 4 años",
        "Retraso del lenguaje con sospecha de hipoacusia como causa",
        "Candidato a implante coclear",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Screening y Diagnóstico", "items": [
            "PEAT (Potenciales Evocados Auditivos de Tronco) con informe",
            "OAE (Emisiones Otoacústicas) si <6 meses",
            "Audiometría conductual (BOA, VRA) según edad",
            "Impedanciometría",
        ]},
        {"label": "Evaluación de Causa", "items": [
            "Serología materna TORCH si sospecha congénita",
            "Estudio genético (Conexina 26/GJB2)",
            "TAC o RNM de rocas petrosas si candidato a implante",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido (menor y tutor)",
            "Interconsulta ORL pediátrico",
        ]},
    ]),
]

# Artritis reumatoidea | adfbd7d1-2956-466b-add3-facdd6ef3f01
CONTENT["adfbd7d1-2956-466b-add3-facdd6ef3f01"] = [
    hdr("Criterios de inclusión y requisitos de derivación para artritis reumatoidea según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Artritis reumatoidea confirmada según criterios ACR/EULAR 2010 (score ≥6)",
        "Poliartritis simétrica con rigidez matutina >1 hora",
        "Factor reumatoideo (FR) o Anti-CCP positivo con artritis",
        "AR con actividad moderada a severa (DAS28 >3.2)",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico Inmunológico", "items": [
            "Factor reumatoideo (FR IgM)",
            "Anti-CCP (anticuerpos anti-péptido citrulinado cíclico)",
            "ANA si duda diagnóstica",
            "VHS y PCR como marcadores de actividad",
        ]},
        {"label": "Evaluación Articular", "items": [
            "Recuento de articulaciones dolorosas e inflamadas (DAS28)",
            "Radiografía de manos y pies AP bilateral",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "DMARDs actuales con dosis y tiempo",
            "Interconsulta reumatología",
        ]},
    ]),
]

# Artritis juvenil | 403033ae-7f8d-4d50-842c-22df45a881eb
CONTENT["403033ae-7f8d-4d50-842c-22df45a881eb"] = [
    hdr("Criterios de inclusión y requisitos de derivación para artritis idiopática juvenil según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "green", [
        "Artritis idiopática juvenil (AIJ) en menores de 16 años (criterios ILAR)",
        "Artritis persistente >6 semanas sin causa identificada en menor de 16 años",
        "AIJ poliarticular, sistémica o con uveítis asociada",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico", "items": [
            "Descripción de articulaciones afectadas y tiempo de evolución",
            "ANA (asociado a uveítis en AIJ oligoarticular)",
            "FR y Anti-CCP si mayor de 10 años",
            "VHS, PCR, hemograma",
        ]},
        {"label": "Evaluación Ocular", "items": [
            "Examen en lámpara de hendidura (uveítis subclínica)",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido (menor y tutor)",
            "Interconsulta reumatología pediátrica",
        ]},
    ]),
]

# Lupus | 92f86d68-fcb0-408c-8236-3e93c9ad00bc
CONTENT["92f86d68-fcb0-408c-8236-3e93c9ad00bc"] = [
    hdr("Criterios de inclusión y requisitos de derivación para lupus eritematoso sistémico según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "purple", [
        "LES confirmado según criterios SLICC 2012 o ACR/EULAR 2019",
        "LES con compromiso renal (lupus nefritis: proteinuria >500 mg/24h)",
        "LES con compromiso del SNC, cardíaco, pulmonar o hematológico grave",
        "LES con actividad moderada a severa (SLEDAI >6)",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico Inmunológico", "items": [
            "ANA (título y patrón)",
            "Anti-DNA doble cadena (anti-dsDNA)",
            "Complemento C3, C4 y CH50",
            "Anti-Smith, anti-Ro/La, anti-cardiolipinas",
        ]},
        {"label": "Evaluación de Daño Orgánico", "items": [
            "Orina completa con proteinuria 24h o ACR",
            "Creatinina y TFG",
            "Hemograma (citopenias)",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Tratamiento actual: hidroxicloroquina, corticoides",
            "Interconsulta reumatología",
        ]},
    ]),
]

# Helicobacter | ad54ffbe-d515-4619-a151-eb3c8b444423
CONTENT["ad54ffbe-d515-4619-a151-eb3c8b444423"] = [
    hdr("Criterios de inclusión y requisitos de derivación para tratamiento de erradicación de Helicobacter pylori según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "amber", [
        "Úlcera péptica confirmada por endoscopía con test de H. pylori positivo",
        "Linfoma MALT gástrico de bajo grado",
        "Familiar de primer grado de paciente con cáncer gástrico con H. pylori positivo",
        "Test de H. pylori positivo en paciente con dispepsia funcional persistente",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico de H. pylori", "items": [
            "Test de urea en aliento (gold standard no invasivo)",
            "Test de antígeno en deposiciones",
            "Biopsia gástrica con ureasas o histología",
            "Sin uso de IBP las últimas 2 semanas antes del test",
        ]},
        {"label": "Endoscopía si Indicada", "items": [
            "Informe de endoscopía digestiva alta",
            "Biopsia de antro y cuerpo si úlcera gástrica",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta gastroenterología",
        ]},
    ]),
]

# Hepatitis B | 4da81a6d-68b3-4223-b78e-0d4eae135371
CONTENT["4da81a6d-68b3-4223-b78e-0d4eae135371"] = [
    hdr("Criterios de inclusión y requisitos de derivación para hepatitis crónica por virus hepatitis B según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Hepatitis B crónica confirmada (HBsAg positivo >6 meses)",
        "Hepatitis B con replicación viral activa (HBV-DNA detectable)",
        "Hepatitis B con indicación de tratamiento antiviral",
        "Profilaxis de reactivación por HBV en paciente inmunosupresor",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Serología y Virología", "items": [
            "HBsAg, Anti-HBs, Anti-HBc (IgG e IgM)",
            "HBeAg y Anti-HBe",
            "HBV-DNA cuantitativo (carga viral)",
        ]},
        {"label": "Evaluación Hepática", "items": [
            "Transaminasas (ALT, AST), GGT, bilirrubina",
            "Albúmina, TP-INR",
            "Ecografía abdominal",
            "FIB-4 o Fibroscan si disponible",
            "AFP (alpha-fetoproteína)",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Interconsulta gastroenterología o hepatología",
        ]},
    ]),
]

# Hepatitis C | 67174ceb-c58d-40a4-b517-5fe0c224944b
CONTENT["67174ceb-c58d-40a4-b517-5fe0c224944b"] = [
    hdr("Criterios de inclusión y requisitos de derivación para hepatitis crónica por virus hepatitis C según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Hepatitis C crónica confirmada (Anti-VHC positivo + VHC-RNA detectable)",
        "Hepatitis C con indicación de tratamiento con antivirales de acción directa (AAD)",
        "Hepatitis C con fibrosis hepática significativa (F2 o superior)",
        "Coinfección VHC + VIH",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Diagnóstico VHC", "items": [
            "Anti-VHC (ELISA de tercera generación)",
            "VHC-RNA cuantitativo (carga viral)",
            "Genotipo VHC (1a, 1b, 2, 3, etc.)",
        ]},
        {"label": "Estadificación Hepática", "items": [
            "Transaminasas, GGT, bilirrubina",
            "Albúmina, TP-INR",
            "Fibroscan (elastografía hepática) o FIB-4",
            "AFP",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "VIH si no conocido",
            "Interconsulta gastroenterología/hepatología",
        ]},
    ]),
]

# Cirrosis | b53e5123-b5ba-445c-aa84-d9a25d45d0ea
CONTENT["b53e5123-b5ba-445c-aa84-d9a25d45d0ea"] = [
    hdr("Criterios de inclusión y requisitos de derivación para cirrosis hepática según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "purple", [
        "Cirrosis hepática compensada o descompensada",
        "Cirrosis con várices esofágicas documentadas en endoscopía",
        "Cirrosis con hipertensión portal sintomática",
        "Cirrosis candidato a trasplante hepático",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Función Hepática", "items": [
            "Child-Pugh y MELD-Na calculados",
            "Albúmina, TP-INR, bilirrubina total",
            "Transaminasas, GGT",
            "Recuento plaquetario",
        ]},
        {"label": "Evaluación de Complicaciones", "items": [
            "Endoscopía digestiva alta (várices, GAVE)",
            "Ecografía doppler portal",
            "AFP (screening hepatocarcinoma)",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Etiología documentada",
            "Interconsulta hepatología",
        ]},
    ]),
]

# Parto prematuro | a0c7a7ce-e81e-4735-ae8e-409229771997
CONTENT["a0c7a7ce-e81e-4735-ae8e-409229771997"] = [
    hdr("Criterios de inclusión y requisitos de derivación para prevención de parto prematuro según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "blue", [
        "Amenaza de parto prematuro entre semanas 22 y 34+6",
        "Cervicometría ≤25 mm entre semanas 14 y 24",
        "Antecedente de parto prematuro previo (<37 semanas)",
        "Embarazo gemelar con riesgo de parto prematuro",
        "Ruptura prematura de membranas antes de término (RPMO)",
    ]),
    chk("Requisitos para la Derivación (SIC)", [
        {"label": "Evaluación Obstétrica", "items": [
            "FUR y edad gestacional confirmada por ecografía del 1T",
            "Cervicometría transvaginal con longitud cervical",
            "Monitoreo de actividad uterina",
            "Espéculo para descartar RPMO",
        ]},
        {"label": "Laboratorio", "items": [
            "Hemograma y PCR",
            "Orina completa y urocultivo",
            "Cultivo vaginorectal para SGB si >35 semanas",
        ]},
        {"label": "Datos del Paciente", "items": [
            "RUT válido",
            "Carnet de control prenatal actualizado",
            "Interconsulta obstetricia de alto riesgo",
        ]},
    ]),
]

# Agresión sexual | de922ca2-9101-47df-9e4a-ccefabcc2657
CONTENT["de922ca2-9101-47df-9e4a-ccefabcc2657"] = [
    hdr("Criterios de inclusión y requisitos de atención integral para agresión sexual aguda según Pauta de Cotejo GES 2026."),
    crit("Criterios de Inclusión GES", "red", [
        "Persona víctima de agresión sexual de cualquier edad y sexo",
        "Consulta dentro de las 120 horas post-agresión para profilaxis y evidencia forense",
        "Víctima de agresión sexual que requiere atención médica, psicológica y legal integrada",
    ]),
    chk("Requisitos del Protocolo de Atención (SIC)", [
        {"label": "Atención Inmediata", "items": [
            "Denuncia policial o fiscal (o consentimiento de la víctima)",
            "Examen médico legal con consentimiento informado",
            "Toma de muestras forenses según protocolo",
            "Fotografías de lesiones si existen",
        ]},
        {"label": "Profilaxis y Tratamiento", "items": [
            "Profilaxis ETS: azitromicina + ceftriaxona",
            "Profilaxis VIH (TARV) si agresión de alto riesgo dentro de 72h",
            "Anticoncepción de emergencia si mujer en edad fértil (dentro de 120h)",
            "VHB: vacuna o inmunoglobulina si no vacunada",
        ]},
        {"label": "Seguimiento", "items": [
            "VIH, VDRL, VHB, VHC basales y a los 3-6 meses",
            "Derivación a psicología o psiquiatría",
            "Asistente social para red de apoyo",
            "RUT válido",
        ]},
    ]),
]

# ── IDs de los 13 topics de Policlínico a eliminar ────────────────────────
POLICLINICO_TO_DELETE = [
    "c00d8653-02a0-4782-ae71-d6025ec742a3",
    "d1962f28-05e1-4327-af0a-4f873cfd1223",
    "01624b52-e306-4c2b-94bd-b3dbcfefae15",
    "2ca1f120-b78c-4b97-99e9-d185e4d82f6c",
    "595a8d10-4a5a-48b3-85c7-af2f0f0034d7",
    "0e69dc66-4f59-4822-adae-2b79b838dece",
    "8c2a801d-6aa0-43ee-8925-4babe543dd80",
    "f6338532-b133-42d8-bfdd-c421f82adb09",
    "72f1cb5f-11b4-4f4b-993e-8c97b4a9028c",
    "3425c191-c1e7-4fe8-a4af-8fa8f5fa0de8",
    "2bd7db14-fa58-4489-9c37-717bfc25ee6b",
    "f19bf9c5-803d-460d-b61c-314f45e911cf",
    "437d7dd3-ebc9-42f1-8eca-691ba7888dd9",
]

def get_existing_blocks(topic_id):
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/topics?id=eq.{topic_id}&select=content_blocks",
        headers=HEADERS
    )
    data = resp.json()
    if data:
        return data[0].get("content_blocks") or []
    return []

def update_topic(topic_id, new_blocks):
    existing = get_existing_blocks(topic_id)
    combined = new_blocks + existing  # new blocks first (header + criteria + checklist), then existing
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/topics?id=eq.{topic_id}",
        headers=HEADERS,
        json={"content_blocks": combined},
        timeout=30,
    )
    return resp.status_code in (200, 201, 204)

def delete_topic(topic_id):
    resp = requests.delete(
        f"{SUPABASE_URL}/rest/v1/topics?id=eq.{topic_id}",
        headers=HEADERS,
        timeout=30,
    )
    return resp.status_code in (200, 204)

if __name__ == "__main__":
    print(f"\nUpdating {len(CONTENT)} GES topics...\n")
    ok = 0
    for tid, blocks in CONTENT.items():
        success = update_topic(tid, blocks)
        status = "✓" if success else "✗"
        print(f"  {status} {tid}")
        if success:
            ok += 1

    print(f"\nDeleting {len(POLICLINICO_TO_DELETE)} Policlínico Pauta de Cotejo topics...\n")
    deleted = 0
    for tid in POLICLINICO_TO_DELETE:
        success = delete_topic(tid)
        status = "✓" if success else "✗"
        print(f"  {status} {tid}")
        if success:
            deleted += 1

    print(f"\nDone: {ok}/{len(CONTENT)} updated, {deleted}/{len(POLICLINICO_TO_DELETE)} deleted.")

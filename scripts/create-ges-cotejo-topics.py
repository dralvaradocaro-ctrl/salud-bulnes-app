#!/usr/bin/env python3
"""
Creates "Pauta de Cotejo GES 2026" topics in Supabase, one per specialty group.
Category: Policlínico (696ea6ff245ef362de4f431e)
"""
import json, uuid, requests, sys

SUPABASE_URL = "https://gcuevpxondfepbowvyqa.supabase.co"
SUPABASE_KEY = "sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh"
CATEGORY_ID  = "696ea6ff245ef362de4f431e"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

PROTOCOL_HEADER = {
    "type": "protocol_header",
    "ordinario": "ORDINARIO 2G N°017",
    "title": "Pauta de Cotejo — Patologías GES 2026",
    "institution": "Servicio de Salud Ñuble",
    "department": "Dpto. de Procesos y GES",
    "date": "Febrero 2026",
    "summary": "Pautas de cotejo actualizadas para la derivación de patologías GES 2026 al nivel secundario. Cada pestaña corresponde a una patología GES y contiene los criterios de inclusión y los requisitos documentales exigidos para la derivación.",
}

def blk(tab, btype, **kw):
    return {"id": str(uuid.uuid4()), "tab": tab, "type": btype, **kw}

def criteria(tab, title, color, items):
    return blk(tab, "criteria", title=title, color=color, items=items)

def checklist(tab, title, sections):
    return blk(tab, "checklist", title=title, sections=sections)

def hdr():
    b = dict(PROTOCOL_HEADER)
    b["id"] = str(uuid.uuid4())
    b["tab"] = None
    b["layout_position"] = "full"
    return b

# ── TOPICS DATA ──────────────────────────────────────────────────────────────

TOPICS = []

# ─────────────────────────────────────────────────────────────────────────────
# 1. CARDIOLOGÍA GES
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Cardiología",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo para derivación GES en patologías cardiológicas: cardiopatías congénitas, IAM, HTA, marcapasos, valvulopatías.",
    "tags": ["GES", "cardiología", "pauta de cotejo", "derivación"],
    "blocks": [
        hdr(),
        # CARDIOPATÍAS CONGÉNITAS
        criteria("cardiopatias-congenitas", "Criterios de Inclusión GES", "blue", [
            "Diagnóstico de cardiopatía congénita operable confirmado por cardiólogo o cirujano cardiovascular",
            "Edad: sin límite de edad establecido en GES",
            "Paciente con indicación quirúrgica o intervencionista",
            "Cardiopatías incluidas: CIA, CIV, ductus arterioso persistente, Tetralogía de Fallot, coartación aórtica, entre otras",
            "Derivación desde APS o nivel secundario con diagnóstico confirmado",
        ]),
        checklist("cardiopatias-congenitas", "Requisitos para la Derivación (SIC)", [
            {"label": "Documentos Clínicos", "items": [
                "Interconsulta médica con diagnóstico GES explícito",
                "Ecografía cardíaca (ecocardiograma) con informe",
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
        # IAM
        criteria("iam", "Criterios de Inclusión GES", "red", [
            "Diagnóstico de Infarto Agudo del Miocardio confirmado (STEMI o NSTEMI)",
            "Manejo inicial en urgencia con estabilización hemodinámica",
            "Indicación de coronariografía o revascularización",
            "Paciente en seguimiento post-IAM que requiere evaluación cardiológica especializada",
            "Fracción de eyección deprimida post-IAM (FEVI <40%)",
        ]),
        checklist("iam", "Requisitos para la Derivación (SIC)", [
            {"label": "Documentos del Evento Agudo", "items": [
                "Epicrisis del episodio de hospitalización",
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
        # HTA
        criteria("hta", "Criterios de Inclusión GES", "purple", [
            "Diagnóstico de HTA primaria o esencial confirmado, en personas de 15 años y más",
            "HTA resistente (PA >140/90 mmHg con ≥3 fármacos en dosis óptimas incluyendo diurético)",
            "HTA con daño de órgano blanco: retinopatía, nefropatía, hipertrofia VI",
            "Crisis hipertensiva de repetición o HTA severa no controlada",
            "Sospecha de HTA secundaria (renovascular, suprarrenal, etc.)",
        ]),
        checklist("hta", "Requisitos para la Derivación (SIC)", [
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
        # MARCAPASO
        criteria("marcapaso", "Criterios de Inclusión GES", "amber", [
            "Trastorno de generación del impulso o de conducción con indicación de marcapaso, en personas de 15 años y más",
            "Bloqueo AV completo (grado III) sintomático o asintomático con FC <40 lpm",
            "Bloqueo AV 2° grado tipo II (Mobitz II) con síntomas",
            "Disfunción sinusal con síntomas (síncope, presíncope, bradicardia severa)",
            "Bloqueo bifascicular con síncope inexplicado",
        ]),
        checklist("marcapaso", "Requisitos para la Derivación (SIC)", [
            {"label": "Estudios Electrofisiológicos", "items": [
                "ECG de 12 derivaciones con trazado del trastorno",
                "Holter de ritmo de 24 horas si disponible",
                "Prueba de esfuerzo si corresponde",
                "Estudio electrofisiológico si indicado",
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
        # VALVULOPATÍA AÓRTICA
        criteria("valvulopatia-aortica", "Criterios de Inclusión GES", "green", [
            "Estenosis aórtica severa sintomática (área valvular <1 cm², gradiente medio >40 mmHg)",
            "Insuficiencia aórtica severa con síntomas o disfunción sistólica (FEVI <50%)",
            "Valvulopatía aórtica con indicación quirúrgica confirmada por cardiólogo",
            "Seguimiento de valvulopatía aórtica moderada a severa en control especializado",
        ]),
        checklist("valvulopatia-aortica", "Requisitos para la Derivación (SIC)", [
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
                "Ficha clínica actualizada",
            ]},
        ]),
        # VALVULOPATÍA MITRAL
        criteria("valvulopatia-mitral", "Criterios de Inclusión GES", "purple", [
            "Estenosis mitral severa sintomática (área valvular <1.5 cm²)",
            "Insuficiencia mitral severa sintomática o con FEVI <60% o DDVI >40mm",
            "Prolapso valvular mitral con insuficiencia severa",
            "Valvulopatía mitral con indicación de intervención (quirúrgica o percutánea)",
        ]),
        checklist("valvulopatia-mitral", "Requisitos para la Derivación (SIC)", [
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
                "Consentimiento informado",
            ]},
        ]),
    ]
})

# ─────────────────────────────────────────────────────────────────────────────
# 2. NEFROLOGÍA GES
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Nefrología",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo para ERC etapas 4-5 y ERC en diálisis.",
    "tags": ["GES", "nefrología", "ERC", "pauta de cotejo"],
    "blocks": [
        hdr(),
        criteria("erc-4-5", "Criterios de Inclusión GES", "blue", [
            "ERC etapa 4 (TFG 15-29 mL/min/1.73m²) o etapa 5 (TFG <15 mL/min/1.73m²) no en diálisis",
            "Diagnóstico confirmado por nefrología o médico tratante con exámenes",
            "Dos mediciones de TFG disminuida con más de 3 meses de diferencia",
            "Proteinuria persistente (ACR >300 mg/g o >500 mg/24h)",
            "Progresión documentada de la función renal",
        ]),
        checklist("erc-4-5", "Requisitos para la Derivación (SIC)", [
            {"label": "Exámenes de Función Renal", "items": [
                "Creatinina sérica (2 mediciones con >3 meses de diferencia)",
                "TFG estimada por CKD-EPI o MDRD",
                "Orina completa con sedimento",
                "Relación albúmina/creatinina en orina (ACR)",
                "Proteinuria 24h si disponible",
            ]},
            {"label": "Exámenes Metabólicos", "items": [
                "Electrolitos (Na, K, Cl, HCO3)",
                "Calcio, fósforo, PTH intacta",
                "Hemograma (anemia de ERC)",
                "Perfil lipídico",
                "Glicemia en ayunas / HbA1c si diabético",
            ]},
            {"label": "Evaluación Clínica", "items": [
                "PA, peso, talla, IMC",
                "Interconsulta con diagnóstico GES",
                "Ecografía renal reciente",
                "RUT válido",
            ]},
        ]),
        criteria("erc-terminal", "Criterios de Inclusión GES", "red", [
            "ERC terminal en hemodiálisis o diálisis peritoneal",
            "Paciente en lista de espera o evaluación para trasplante renal",
            "Complicaciones de la terapia de sustitución renal",
            "Acceso vascular disfuncionante o complicado",
            "Evaluación periódica en programa de diálisis",
        ]),
        checklist("erc-terminal", "Requisitos para la Derivación (SIC)", [
            {"label": "Documentación del Programa", "items": [
                "Certificado de centro de diálisis con frecuencia y modalidad",
                "Exámenes mensuales del programa: Kt/V, hemograma, PTH, ferritina, saturación de transferrina",
                "Acceso vascular: tipo, fecha de confección, última revisión",
            ]},
            {"label": "Evaluación para Trasplante", "items": [
                "Serología: VIH, VHB (HBsAg, Anti-HBc), VHC, CMV, EBV, Chagas",
                "Grupo sanguíneo y panel de anticuerpos (PRA)",
                "Evaluación cardiovascular: ECG, ecocardiograma",
                "Radiografía de tórax",
            ]},
            {"label": "Datos Administrativos", "items": [
                "RUT válido",
                "Interconsulta nefrológica con diagnóstico GES",
                "Ficha de programa de diálisis actualizada",
            ]},
        ]),
    ]
})

# ─────────────────────────────────────────────────────────────────────────────
# 3. ONCOLOGÍA — TUMORES SÓLIDOS
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Oncología Tumores Sólidos",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo GES para cánceres: cervicouterino, mama, gástrico, colorrectal, pulmón, próstata, ovario, vesical, renal, tiroides.",
    "tags": ["GES", "oncología", "cáncer", "pauta de cotejo"],
    "blocks": [
        hdr(),
        # CERVICOUTERINO
        criteria("cervicouterino", "Criterios de Inclusión GES", "red", [
            "Cáncer cervicouterino confirmado histológicamente (≥15 años)",
            "Papanicolaou con resultado ASCUS, LSIL, HSIL, AGC o sospecha de cáncer",
            "Colposcopía con biopsia positiva para NIC 2, NIC 3, carcinoma in situ o invasor",
            "Lesión sugerente de cáncer cervical al examen ginecológico",
        ]),
        checklist("cervicouterino", "Requisitos para la Derivación (SIC)", [
            {"label": "Confirmación Diagnóstica", "items": [
                "Resultado de biopsia cervical con informe anatomopatológico",
                "Informe de colposcopía",
                "PAP previo con resultado",
                "Estudio de VPH si disponible",
            ]},
            {"label": "Imágenes y Estadificación", "items": [
                "TAC de tórax, abdomen y pelvis con contraste",
                "RNM de pelvis si disponible",
                "Radiografía de tórax",
            ]},
            {"label": "Datos Administrativos", "items": [
                "RUT válido",
                "Interconsulta con diagnóstico GES",
                "Hemograma, función renal, hepática",
            ]},
        ]),
        # MAMA
        criteria("mama", "Criterios de Inclusión GES", "red", [
            "Cáncer de mama confirmado histológicamente en personas ≥15 años",
            "Mamografía con BI-RADS 4 o 5 (alta sospecha)",
            "Nódulo mamario palpable con citología o biopsia sospechosa",
            "Seguimiento oncológico post-tratamiento",
        ]),
        checklist("mama", "Requisitos para la Derivación (SIC)", [
            {"label": "Confirmación Diagnóstica", "items": [
                "Informe anatomopatológico de biopsia (core biopsy o trucut)",
                "Inmunohistoquímica: RE, RP, HER2, Ki67",
                "Mamografía bilateral reciente con informe BI-RADS",
                "Ecografía mamaria y axilar",
            ]},
            {"label": "Estadificación", "items": [
                "TAC de tórax y abdomen con contraste",
                "Cintigrafía ósea si sospecha metástasis",
                "PET-CT si disponible y estadio avanzado",
                "Hemograma, función hepática, CEA, CA 15-3",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido",
                "Antecedentes familiares de cáncer de mama/ovario",
                "Interconsulta oncológica",
            ]},
        ]),
        # GÁSTRICO
        criteria("gastrico", "Criterios de Inclusión GES", "amber", [
            "Cáncer gástrico confirmado por endoscopía y biopsia",
            "Lesión endoscópica sospechosa de malignidad (Paris IIa, IIb, IIc, III)",
            "Síntomas de alarma: baja de peso >10%, disfagia, sangrado digestivo, vómitos persistentes",
            "Edad ≥40 años con epigastralgia persistente y H. pylori positivo sin respuesta a tratamiento",
        ]),
        checklist("gastrico", "Requisitos para la Derivación (SIC)", [
            {"label": "Confirmación Diagnóstica", "items": [
                "Informe de endoscopía digestiva alta con fotos",
                "Biopsia gástrica con informe anatomopatológico",
                "Test de H. pylori (ureasas, biopsia o test respiratorio)",
            ]},
            {"label": "Estadificación", "items": [
                "TAC de tórax, abdomen y pelvis con contraste",
                "Ecoendoscopía si disponible (T y N locales)",
                "PET-CT si estadio avanzado o recidiva",
                "CEA, CA 19-9, HER2 en tumor si estadio avanzado",
            ]},
            {"label": "Datos Administrativos", "items": [
                "RUT válido", "Hemograma y función renal/hepática", "Interconsulta oncológica",
            ]},
        ]),
        # COLORRECTAL
        criteria("colorrectal", "Criterios de Inclusión GES", "green", [
            "Cáncer colorrectal confirmado por colonoscopía y biopsia",
            "Sangrado rectal de causa no hemorroidal o en mayores de 50 años",
            "Cambio en hábito intestinal persistente >4 semanas",
            "Antecedente familiar de cáncer colorrectal en familiar de primer grado <60 años",
            "Pólipo con displasia de alto grado en colonoscopía",
        ]),
        checklist("colorrectal", "Requisitos para la Derivación (SIC)", [
            {"label": "Confirmación Diagnóstica", "items": [
                "Colonoscopía total con informe y fotos",
                "Biopsia con informe anatomopatológico",
                "CEA y CA 19-9 basales",
            ]},
            {"label": "Estadificación", "items": [
                "TAC de tórax, abdomen y pelvis",
                "RNM de pelvis si cáncer de recto",
                "Ecografía hepática o TAC hepático",
                "Test KRAS/NRAS/BRAF si estadio IV",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta con diagnóstico GES", "Hemograma y función renal/hepática",
            ]},
        ]),
        # PULMÓN
        criteria("pulmon", "Criterios de Inclusión GES", "blue", [
            "Cáncer de pulmón confirmado histológica o citológicamente",
            "Nódulo pulmonar >8mm en TAC con características sospechosas (Lung-RADS ≥3)",
            "Derrame pleural con citología positiva para células malignas",
            "Síntomas: hemoptisis, tos persistente, baja de peso en fumador >40 años",
            "Masa pulmonar o mediastínica en radiografía o TAC",
        ]),
        checklist("pulmon", "Requisitos para la Derivación (SIC)", [
            {"label": "Confirmación Diagnóstica", "items": [
                "TAC de tórax con contraste",
                "Informe de broncoscopía y biopsia si realizada",
                "Citología de esputo o líquido pleural si aplica",
                "PET-CT si disponible",
            ]},
            {"label": "Estudio Molecular", "items": [
                "EGFR, ALK, ROS1, KRAS, PD-L1 (si adenocarcinoma)",
                "Biopsia líquida si no hay tejido disponible",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Historia tabáquica (paquetes/año)", "Interconsulta oncología o broncopulmonar",
            ]},
        ]),
        # PRÓSTATA
        criteria("prostata", "Criterios de Inclusión GES", "blue", [
            "Cáncer de próstata confirmado por biopsia prostática (Gleason/ISUP score)",
            "PSA >10 ng/mL o PSA 4-10 con tacto rectal alterado",
            "Tacto rectal con nódulo o induración sospechosa",
            "Biopsia previa negativa con PSA persistentemente elevado",
        ]),
        checklist("prostata", "Requisitos para la Derivación (SIC)", [
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
                "Ecografía renal y vesical si obstrucción",
            ]},
            {"label": "Datos Administrativos", "items": [
                "RUT válido", "Interconsulta urológica u oncológica",
            ]},
        ]),
        # OVARIO
        criteria("ovario", "Criterios de Inclusión GES", "red", [
            "Masa ovárica con características de malignidad en ecografía (score IOTA ≥3 o ORADS ≥4)",
            "CA-125 elevado en mujer postmenopáusica con masa ovárica",
            "Carcinomatosis peritoneal con sospecha de origen ovárico",
            "Diagnóstico histológico de cáncer de ovario, trompa o peritoneal primario",
        ]),
        checklist("ovario", "Requisitos para la Derivación (SIC)", [
            {"label": "Estudios de Imágenes", "items": [
                "Ecografía transvaginal con score IOTA o ORADS",
                "TAC de abdomen y pelvis con contraste",
                "CA-125, HE4, índice ROMA",
            ]},
            {"label": "Evaluación Quirúrgica", "items": [
                "Hemograma, coagulación",
                "Función renal y hepática",
                "Albúmina sérica",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta ginecología oncológica", "Estado menopaúsico documentado",
            ]},
        ]),
        # VESICAL
        criteria("vesical", "Criterios de Inclusión GES", "amber", [
            "Hematuria macroscópica sin causa infecciosa evidente en ≥40 años",
            "Masa vesical en ecografía o TAC sugerente de neoplasia",
            "Cistoscopía con lesión sospechosa de carcinoma urotelial",
            "Diagnóstico histológico de cáncer vesical confirmado",
        ]),
        checklist("vesical", "Requisitos para la Derivación (SIC)", [
            {"label": "Estudios Diagnósticos", "items": [
                "Orina completa y urocultivo",
                "Citología urinaria",
                "Ecografía renal y vesical",
                "Uro-TAC (TAC abdomen y pelvis con fases)",
            ]},
            {"label": "Confirmación y Estadificación", "items": [
                "Informe de cistoscopía",
                "Informe anatomopatológico de RTUP o biopsia",
                "Hemograma y función renal",
            ]},
            {"label": "Datos Administrativos", "items": [
                "RUT válido", "Interconsulta urológica",
            ]},
        ]),
        # RENAL
        criteria("renal", "Criterios de Inclusión GES", "purple", [
            "Masa renal sólida >1.5 cm con características de malignidad en TAC o RNM",
            "Hematuria macroscópica con masa renal en imágenes",
            "Diagnóstico histológico de carcinoma de células renales",
            "Lesión renal incidental con Bosniak ≥III en TAC",
        ]),
        checklist("renal", "Requisitos para la Derivación (SIC)", [
            {"label": "Imágenes", "items": [
                "TAC trifásico de abdomen y pelvis",
                "RNM renal si alergia a contraste o lesión compleja",
                "Radiografía de tórax o TAC de tórax",
            ]},
            {"label": "Laboratorio", "items": [
                "Función renal (creatinina, TFG)",
                "Hemograma",
                "Perfil hepático",
                "LDH si sospecha de estadio avanzado",
            ]},
            {"label": "Datos Administrativos", "items": [
                "RUT válido", "Interconsulta urológica u oncológica",
            ]},
        ]),
        # TIROIDES
        criteria("tiroides", "Criterios de Inclusión GES", "green", [
            "Nódulo tiroideo ≥1 cm con TIRADS 4 o 5 en ecografía",
            "PAAF de nódulo con resultado Bethesda IV, V o VI",
            "Carcinoma tiroideo diferenciado confirmado por biopsia",
            "Bocio compresivo o subesternal con síntomas",
        ]),
        checklist("tiroides", "Requisitos para la Derivación (SIC)", [
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
            {"label": "Datos Administrativos", "items": [
                "RUT válido", "Interconsulta endocrinología o cirugía de cabeza y cuello",
            ]},
        ]),
    ]
})

# ─────────────────────────────────────────────────────────────────────────────
# 4. ONCOLOGÍA HEMATOLÓGICA Y PALIATIVOS
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Oncología Hematológica y Paliativos",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo GES para linfomas, leucemias, mieloma, hemofilia, cáncer pediátrico, paliativos y osteosarcoma.",
    "tags": ["GES", "hematología", "oncología", "paliativos", "pauta de cotejo"],
    "blocks": [
        hdr(),
        criteria("linfoma", "Criterios de Inclusión GES", "purple", [
            "Linfoma de Hodgkin o no Hodgkin confirmado histológicamente (≥15 años)",
            "Adenopatías periféricas >1.5 cm de más de 4 semanas, sin causa infecciosa",
            "Síntomas B: fiebre, sudoración nocturna, baja de peso >10%",
            "Masa mediastínica o retroperitoneal en imágenes",
            "Biopsia ganglionar o de médula ósea con resultado linfomatoso",
        ]),
        checklist("linfoma", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico", "items": [
                "Informe anatomopatológico + inmunohistoquímica de biopsia",
                "Biopsia de médula ósea si indicada",
                "PET-CT o TAC de cuello, tórax, abdomen y pelvis",
                "LDH, beta-2 microglobulina",
            ]},
            {"label": "Laboratorio", "items": [
                "Hemograma con fórmula diferencial",
                "VHS, PCR, función hepática y renal",
                "Serología: VIH, VHB, VHC",
                "SPEP (electroforesis de proteínas) si corresponde",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta hematológica", "Consentimiento informado",
            ]},
        ]),
        criteria("leucemia", "Criterios de Inclusión GES", "red", [
            "Leucemia en personas de 15 años y más (LMA, LLA, LLC, LMC u otras)",
            "Hemograma con blastos circulantes o pancitopenia inexplicada",
            "Mielograma con ≥20% de blastos (LMA) o linfocitosis clonal (LLC)",
            "Leucocitosis extrema (>100.000/mm³) o sospecha de proceso leucémico",
        ]),
        checklist("leucemia", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico Hematológico", "items": [
                "Hemograma completo con fórmula diferencial",
                "Mielograma con informe citológico",
                "Inmunofenotipo por citometría de flujo",
                "Citogenética (cariotipo) y FISH si indicado",
                "PCR para fusiones específicas (BCR-ABL para LMC, PML-RARA para LMA-M3)",
            ]},
            {"label": "Laboratorio General", "items": [
                "Coagulación completa (TP, TTPK, fibrinógeno)",
                "Función renal y hepática, ácido úrico, LDH",
                "Grupo sanguíneo",
                "Serología: VIH, VHB, VHC, CMV",
            ]},
            {"label": "Datos Administrativos", "items": [
                "RUT válido", "Interconsulta hematológica urgente", "Hospitalización si inestable",
            ]},
        ]),
        criteria("mieloma", "Criterios de Inclusión GES", "amber", [
            "Mieloma múltiple sintomático (criterios CRAB: hipercalcemia, insuficiencia renal, anemia, lesiones óseas)",
            "Paraproteína en electroforesis con pico monoclonal en adultos >40 años",
            "Aplastamientos vertebrales múltiples en contexto de osteoporosis severa o dolor óseo",
            "Bence-Jones positivo en orina",
        ]),
        checklist("mieloma", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico", "items": [
                "Electroforesis de proteínas sérica y urinaria",
                "Inmunofijación sérica y urinaria",
                "Cadenas ligeras libres en suero (FLC)",
                "Mielograma o biopsia de médula ósea",
                "Citogenética de células plasmáticas",
            ]},
            {"label": "Evaluación de Daño Orgánico", "items": [
                "Hemograma (anemia)",
                "Calcemia, creatinina",
                "Serie ósea radiológica o PET-CT/RNM",
                "Beta-2 microglobulina y albumina (estadificación ISS)",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta hematología",
            ]},
        ]),
        criteria("hemofilia", "Criterios de Inclusión GES", "blue", [
            "Hemofilia A o B confirmada por dosificación de factor VIII o IX",
            "Episodios de sangrado espontáneo o postraumático desproporcionado",
            "Hemartrosis recurrente con limitación funcional",
            "Diagnóstico familiar de hemofilia en familiar de primer grado",
        ]),
        checklist("hemofilia", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico de Coagulación", "items": [
                "TTPK prolongado",
                "Dosificación de factor VIII y IX",
                "Inhibidor de factor VIII/IX si sospecha",
                "Grupo sanguíneo",
            ]},
            {"label": "Evaluación Articular", "items": [
                "Radiografía de articulaciones afectadas",
                "Score de artropatía hemofílica (Gilbert o Pettersson)",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta hematología", "Carné de hemofilia si disponible",
            ]},
        ]),
        criteria("cancer-pediatrico", "Criterios de Inclusión GES", "red", [
            "Cáncer en personas menores de 15 años (cualquier tipo histológico)",
            "Masa tumoral palpable o en imágenes en menor de 15 años",
            "Signos de alarma: palidez, petequias, adenopatías, masa abdominal, cefalea persistente",
            "Hemograma alterado con blastos o pancitopenia en menor de 15 años",
        ]),
        checklist("cancer-pediatrico", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Inicial", "items": [
                "Hemograma con fórmula diferencial",
                "Ecografía abdominal y/o de área afectada",
                "Radiografía de tórax",
                "LDH, ácido úrico, función renal y hepática",
            ]},
            {"label": "Derivación Urgente", "items": [
                "Interconsulta a oncología pediátrica con URGENCIA",
                "Hospitalización si inestable hemodinámicamente",
                "Consentimiento informado de tutor legal",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido (menor y tutor)", "Carné de vacunas",
            ]},
        ]),
        criteria("paliativos", "Criterios de Inclusión GES", "purple", [
            "Cáncer avanzado o terminal sin opciones de tratamiento curativo",
            "Dolor oncológico severo (EVA ≥7) no controlado con analgésicos básicos",
            "Necesidad de opioides para control del dolor",
            "Síntomas refractarios: disnea, náuseas, delirio, ansiedad en contexto oncológico",
            "Expectativa de vida estimada <12 meses por oncólogo tratante",
        ]),
        checklist("paliativos", "Requisitos para la Derivación (SIC)", [
            {"label": "Documentación Oncológica", "items": [
                "Diagnóstico oncológico confirmado con informe anatomopatológico",
                "Último informe de imágenes (TAC, PET-CT, etc.)",
                "Carta de oncólogo tratante con pronóstico estimado",
            ]},
            {"label": "Evaluación de Síntomas", "items": [
                "Escala EVA/NRS de dolor documentada",
                "Escala ECOG o Karnofsky",
                "Esquema analgésico actual y respuesta",
                "Evaluación nutricional",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta UAPO o equipo de paliativos", "Directrices anticipadas si disponibles",
            ]},
        ]),
        criteria("osteosarcoma", "Criterios de Inclusión GES", "green", [
            "Osteosarcoma confirmado histológicamente",
            "Masa ósea dolorosa en persona joven (<30 años) con imagen radiológica sugerente",
            "Lesión ósea lítica o blástica en TAC o RNM con características agresivas",
            "Fractura patológica en hueso previamente anormal",
        ]),
        checklist("osteosarcoma", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico", "items": [
                "Radiografía del área comprometida",
                "RNM del hueso afectado con extensión",
                "Biopsia con informe anatomopatológico",
                "FAL (fosfatasa alcalina), LDH",
            ]},
            {"label": "Estadificación", "items": [
                "TAC de tórax para metástasis pulmonares",
                "Cintigrafía ósea",
                "PET-CT si disponible",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta oncología o traumatología oncológica",
            ]},
        ]),
    ]
})

# ─────────────────────────────────────────────────────────────────────────────
# 5. ENDOCRINOLOGÍA Y METABOLISMO
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Endocrinología y Metabolismo",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo GES para DM1, DM2, pie diabético, hipotiroidismo y retinopatía diabética.",
    "tags": ["GES", "endocrinología", "diabetes", "pauta de cotejo"],
    "blocks": [
        hdr(),
        criteria("dm1", "Criterios de Inclusión GES", "blue", [
            "Diabetes mellitus tipo 1 confirmada (insulinopenia, anticuerpos anti-GAD, anti-islotes)",
            "Mal control metabólico persistente (HbA1c >8%) a pesar de tratamiento optimizado",
            "Episodios frecuentes de hipoglicemia severa o cetoacidosis diabética",
            "Evaluación para bomba de insulina o sistemas de monitoreo continuo",
            "Complicaciones crónicas con necesidad de evaluación especializada",
        ]),
        checklist("dm1", "Requisitos para la Derivación (SIC)", [
            {"label": "Control Metabólico", "items": [
                "HbA1c reciente (<3 meses)",
                "Glicemias capilares de los últimos 30 días (libro o descarga de glucómetro)",
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
                "RUT válido", "Peso, talla, IMC", "Interconsulta endocrinológica",
            ]},
        ]),
        criteria("dm2", "Criterios de Inclusión GES", "amber", [
            "Diabetes mellitus tipo 2 con HbA1c >8% en tratamiento con 2 o más hipoglicemiantes orales",
            "DM2 que requiere inicio de insulina o ajuste complejo de esquema",
            "DM2 con complicaciones crónicas: nefropatía, retinopatía, neuropatía, macroangiopatía",
            "DM2 en embarazo (diabetes gestacional o pregestacional)",
            "DM2 con IMC >35 para evaluación de cirugía bariátrica",
        ]),
        checklist("dm2", "Requisitos para la Derivación (SIC)", [
            {"label": "Control Metabólico", "items": [
                "HbA1c últimos 3 meses",
                "Glicemia en ayunas y postprandial",
                "Tratamiento actual (fármacos, dosis, adherencia)",
            ]},
            {"label": "Evaluación de Riesgo CV y Renal", "items": [
                "PA, perfil lipídico",
                "Creatinina y microalbuminuria",
                "ECG en mayores de 50 años",
                "Evaluación de pie diabético",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "IMC, perímetro de cintura", "Interconsulta endocrinología",
            ]},
        ]),
        criteria("pie-diabetico", "Criterios de Inclusión GES", "red", [
            "Diabetes mellitus con úlcera en pie (clasificación Wagner 1 o superior)",
            "Pie diabético con infección o signos de isquemia",
            "Neuropatía periférica severa con pérdida de sensibilidad a monofilamento",
            "Antecedente de amputación previa por complicaciones del pie diabético",
            "Deformidades del pie diabético con riesgo de ulceración",
        ]),
        checklist("pie-diabetico", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación del Pie", "items": [
                "Clasificación de Wagner de la úlcera si existe",
                "Monofilamento de 10g documentado",
                "Índice tobillo-brazo (ITB)",
                "Cultivo de la úlcera si infectada",
            ]},
            {"label": "Exámenes", "items": [
                "HbA1c, glicemia",
                "Hemograma, PCR si infección",
                "Función renal",
                "Radiografía del pie si sospecha de osteomielitis",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta podología/cirugía vascular/endocrinología",
            ]},
        ]),
        criteria("hipotiroidismo", "Criterios de Inclusión GES", "blue", [
            "Hipotiroidismo primario confirmado (TSH >10 mUI/L con T4L baja)",
            "Hipotiroidismo subclínico con TSH >10 mUI/L o sintomático",
            "Hipotiroidismo en embarazo (TSH >2.5 mUI/L en 1T o >3 mUI/L en 2T-3T)",
            "Hipotiroidismo de difícil control o de causa secundaria/central",
            "Tiroiditis de Hashimoto con hipotiroidismo establecido",
        ]),
        checklist("hipotiroidismo", "Requisitos para la Derivación (SIC)", [
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
                "RUT válido", "Interconsulta endocrinología", "Control de embarazo si aplica",
            ]},
        ]),
        criteria("retinopatia-diabetica", "Criterios de Inclusión GES", "red", [
            "Diabetes mellitus tipo 1 o 2 con hallazgos de retinopatía en fondo de ojo",
            "Retinopatía diabética no proliferativa moderada a severa",
            "Retinopatía diabética proliferativa (neovascularización)",
            "Edema macular diabético clínicamente significativo",
            "Primera evaluación oftalmológica en diabético sin control previo",
        ]),
        checklist("retinopatia-diabetica", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Oftalmológica", "items": [
                "Fondo de ojo con informe (o retinografía no midriática)",
                "Clasificación de severidad (ETDRS o internacional DRSS)",
                "OCT macular si disponible",
                "Agudeza visual corregida",
            ]},
            {"label": "Control Metabólico", "items": [
                "HbA1c",
                "PA",
                "Perfil lipídico",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta oftalmología",
            ]},
        ]),
    ]
})

# ─────────────────────────────────────────────────────────────────────────────
# 6. NEUROLOGÍA
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Neurología",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo GES para ACV, epilepsia, Parkinson, esclerosis múltiple, Alzheimer y tumores SNC.",
    "tags": ["GES", "neurología", "ACV", "pauta de cotejo"],
    "blocks": [
        hdr(),
        criteria("acv", "Criterios de Inclusión GES", "red", [
            "ACV isquémico agudo en personas ≥15 años (primeras 72 horas para activación de vía GES)",
            "TIA con déficit transitorio de ≥24h con evidencia de isquemia en neuroimagen",
            "Seguimiento post-ACV con secuelas neurológicas",
            "ACV isquémico con indicación de trombolisis o trombectomía mecánica",
        ]),
        checklist("acv", "Requisitos para la Derivación (SIC)", [
            {"label": "Urgencia / Agudo", "items": [
                "TC de encéfalo sin contraste (o RNM DWI si disponible)",
                "NIHSS documentado al ingreso",
                "Hora exacta de inicio de síntomas",
                "PA, glicemia capilar, ECG al ingreso",
            ]},
            {"label": "Seguimiento / Secundaria", "items": [
                "RNM de encéfalo con secuencias DWI, FLAIR",
                "Doppler carotídeo y transcraneal",
                "Ecocardiograma transtorácico",
                "Holter de ritmo 24-72h (detectar FA)",
                "Perfil lipídico, HbA1c",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta neurológica", "Score mRS al alta documentado",
            ]},
        ]),
        criteria("epilepsia-infantil", "Criterios de Inclusión GES", "blue", [
            "Epilepsia en personas desde 1 año y menores de 15 años",
            "Dos o más crisis epilépticas no provocadas con >24h de diferencia",
            "Crisis epilépticas con EEG anormal compatible con epilepsia",
            "Epilepsia refractaria (fallo a 2 antiepilépticos en dosis adecuadas)",
            "Síndrome epiléptico específico: West, Lennox-Gastaut, Dravet u otros",
        ]),
        checklist("epilepsia-infantil", "Requisitos para la Derivación (SIC)", [
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
                "RUT válido", "Interconsulta neuropediatría", "Carné de vacunas",
            ]},
        ]),
        criteria("epilepsia-adulto", "Criterios de Inclusión GES", "blue", [
            "Epilepsia en adultos ≥15 años con crisis recurrentes",
            "Epilepsia refractaria (fallo a ≥2 antiepilépticos en dosis y tiempo adecuados)",
            "Primera crisis epiléptica no provocada con sospecha de epilepsia focal",
            "Epilepsia con posible indicación quirúrgica (epilepsia del lóbulo temporal con esclerosis hipocampal)",
        ]),
        checklist("epilepsia-adulto", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico", "items": [
                "EEG con descripción de foco o patrón epileptiforme",
                "RNM de encéfalo con protocolo de epilepsia (FLAIR, T2, T1)",
                "Descripción de tipo de crisis, duración, frecuencia mensual",
            ]},
            {"label": "Tratamiento", "items": [
                "Antiepilépticos actuales con dosis",
                "Niveles plasmáticos de fenitoína, valproato u otros si disponibles",
                "Adherencia al tratamiento",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta neurología adultos",
            ]},
        ]),
        criteria("parkinson", "Criterios de Inclusión GES", "green", [
            "Enfermedad de Parkinson idiopática diagnosticada clínicamente (criterios MDS-UPDRS)",
            "Parkinsonismo con necesidad de ajuste de tratamiento dopaminérgico",
            "Parkinson con fluctuaciones motoras o discinesias",
            "Sospecha de parkinsonismo atípico (AMS, PSP, DCB)",
            "Evaluación para deep brain stimulation (DBS)",
        ]),
        checklist("parkinson", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Neurológica", "items": [
                "Escala UPDRS o MoCA documentada",
                "RNM de encéfalo (para descartar causas secundarias)",
                "DAT-SPECT si disponible y diagnóstico dudoso",
            ]},
            {"label": "Tratamiento", "items": [
                "Levodopa y otros dopaminérgicos: dosis actuales",
                "Respuesta al tratamiento y tiempo de encendido/apagado",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta neurología", "Evaluación fonoaudiológica y kinésica si disponible",
            ]},
        ]),
        criteria("esclerosis-multiple", "Criterios de Inclusión GES", "purple", [
            "Esclerosis múltiple confirmada por criterios de McDonald (2017)",
            "Primer brote desmielinizante con criterios de síndrome clínicamente aislado (CIS)",
            "EM con brotes que requiere inicio o cambio de terapia modificadora de enfermedad",
            "EM progresiva primaria o secundaria con deterioro funcional",
        ]),
        checklist("esclerosis-multiple", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico", "items": [
                "RNM de encéfalo y médula espinal con gadolinio (protocolo EM)",
                "Potenciales evocados visuales",
                "Estudio LCR: bandas oligoclonales, índice IgG",
                "Descripción de brotes previos y secuelas",
            ]},
            {"label": "Tratamiento y Seguimiento", "items": [
                "Terapia modificadora de enfermedad actual",
                "Escala EDSS documentada",
                "Último brote y fecha",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta neurología especializada en EM",
            ]},
        ]),
        criteria("alzheimer", "Criterios de Inclusión GES", "amber", [
            "Demencia tipo Alzheimer con diagnóstico clínico confirmado (criterios NIA-AA)",
            "Deterioro cognitivo leve (MCI) con sospecha de etiología Alzheimer",
            "Demencia con MMSE <24 con impacto funcional significativo",
            "Necesidad de inicio o ajuste de tratamiento farmacológico",
            "Evaluación neuropsicológica para estadificación y diagnóstico diferencial",
        ]),
        checklist("alzheimer", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Cognitiva", "items": [
                "MMSE o MoCA con puntaje y fecha",
                "Test del reloj o evaluación neuropsicológica breve",
                "Escala CDR (Clinical Dementia Rating)",
                "Evaluación funcional (AVD básicas e instrumentales)",
            ]},
            {"label": "Neuroimagen y Laboratorio", "items": [
                "RNM de encéfalo (atrofia hipocampal, infartos, otras causas)",
                "TSH, vitamina B12, folato",
                "Hemograma, función renal/hepática",
                "VDRL, VIH si <65 años",
            ]},
            {"label": "Datos del Paciente y Familia", "items": [
                "RUT válido", "Cuidador principal identificado", "Interconsulta neurología o geriatría",
            ]},
        ]),
        criteria("tumores-snc", "Criterios de Inclusión GES", "red", [
            "Tumor primario del SNC confirmado o sospechado por neuroimagen (≥15 años)",
            "Masa intracraneal en TAC o RNM con efecto de masa o captación de contraste",
            "Crisis epilépticas de inicio reciente en adulto con lesión en neuroimagen",
            "Déficit neurológico focal de causa no vascular en neuroimagen",
        ]),
        checklist("tumores-snc", "Requisitos para la Derivación (SIC)", [
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
                "RUT válido", "Interconsulta neurocirugía urgente", "Hemograma y coagulación si cirugía inminente",
            ]},
        ]),
    ]
})

# ─────────────────────────────────────────────────────────────────────────────
# 7. SALUD MENTAL
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Salud Mental",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo GES para esquizofrenia, depresión, trastorno bipolar y consumo de alcohol/drogas.",
    "tags": ["GES", "salud mental", "psiquiatría", "pauta de cotejo"],
    "blocks": [
        hdr(),
        criteria("esquizofrenia", "Criterios de Inclusión GES", "purple", [
            "Esquizofrenia diagnosticada según DSM-5 o CIE-10 (F20.x)",
            "Primer episodio psicótico con sospecha de esquizofrenia",
            "Psicosis resistente a tratamiento (sin respuesta a 2 antipsicóticos)",
            "Esquizofrenia con comorbilidades que requiere evaluación especializada",
            "Descompensación psicótica aguda",
        ]),
        checklist("esquizofrenia", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Psiquiátrica", "items": [
                "Interconsulta con descripción de síntomas (positivos, negativos, desorganizados)",
                "Tratamiento antipsicótico actual con dosis y tiempo",
                "Escala PANSS o CGI si disponible",
                "Antecedente de hospitalizaciones psiquiátricas",
            ]},
            {"label": "Exámenes de Rutina", "items": [
                "Hemograma, glicemia, perfil lipídico (metabolismo antipsicóticos)",
                "TSH",
                "EEG si indicado",
                "Screening de drogas en orina",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Red de apoyo familiar identificada", "Interconsulta psiquiatría",
            ]},
        ]),
        criteria("depresion", "Criterios de Inclusión GES", "blue", [
            "Depresión mayor en personas ≥15 años (criterios DSM-5 o CIE-10 F32/F33)",
            "Episodio depresivo moderado a severo (PHQ-9 ≥10)",
            "Depresión refractaria (fallo a ≥2 antidepresivos en dosis y tiempo adecuados)",
            "Depresión con riesgo suicida activo",
            "Depresión bipolar o en contexto de comorbilidad psiquiátrica mayor",
        ]),
        checklist("depresion", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación de Depresión", "items": [
                "PHQ-9 o escala de Hamilton con puntaje y fecha",
                "Evaluación de riesgo suicida (escala SAD PERSONS o similar)",
                "Antidepresivos actuales: nombre, dosis, duración",
                "Respuesta al tratamiento documentada",
            ]},
            {"label": "Diagnóstico Diferencial", "items": [
                "TSH (descartar hipotiroidismo)",
                "Hemograma (descartar anemia)",
                "Descarte de organicidad si >50 años o atipicidad",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta psiquiatría", "Red de apoyo y riesgo social",
            ]},
        ]),
        criteria("bipolar", "Criterios de Inclusión GES", "amber", [
            "Trastorno bipolar tipo I o II diagnosticado (DSM-5 F31.x)",
            "Episodio maníaco o hipomaníaco activo",
            "Depresión bipolar sin respuesta a tratamiento estabilizador",
            "Diagnóstico diferencial entre depresión unipolar y bipolar",
            "Trastorno bipolar con psicosis o riesgo suicida",
        ]),
        checklist("bipolar", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Psiquiátrica", "items": [
                "Descripción de episodios maníacos/hipomaníacos previos",
                "Estabilizadores actuales: litio, valproato, lamotrigina (dosis y litemia si aplica)",
                "Escala de Young (YMRS) o BPRS si disponible",
                "Antipsicóticos asociados",
            ]},
            {"label": "Laboratorio para Estabilizadores", "items": [
                "Litemia si usa litio (rango terapéutico 0.6-1.2 mEq/L)",
                "Función renal y tiroidea (litio)",
                "Hemograma y hepático (valproato)",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta psiquiatría", "Riesgo suicida documentado",
            ]},
        ]),
        criteria("alcohol-drogas", "Criterios de Inclusión GES", "red", [
            "Dependencia a alcohol o sustancias psicoactivas (DSM-5 F10-F19)",
            "Síndrome de abstinencia a alcohol con riesgo de complicaciones (convulsiones, delirium tremens)",
            "Consumo perjudicial con daño orgánico o psicosocial significativo",
            "Fracaso de tratamientos ambulatorios previos",
            "Comorbilidad psiquiátrica asociada al consumo",
        ]),
        checklist("alcohol-drogas", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación de Consumo", "items": [
                "AUDIT-C o AUDIT con puntaje",
                "Tipo de sustancia, frecuencia, cantidad y tiempo de consumo",
                "Antecedentes de hospitalizaciones por abstinencia o sobredosis",
            ]},
            {"label": "Laboratorio", "items": [
                "Hemograma, VCM (macrocitosis por alcohol)",
                "GGT, transaminasas (daño hepático)",
                "Función renal",
                "Screening toxicológico en orina",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta psiquiatría o COSAM", "Red de apoyo social",
            ]},
        ]),
    ]
})

# ─────────────────────────────────────────────────────────────────────────────
# 8. RESPIRATORIO
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Respiratorio",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo GES para EPOC, asma pediátrico y adulto, fibrosis quística y rehab. post-COVID.",
    "tags": ["GES", "respiratorio", "EPOC", "asma", "pauta de cotejo"],
    "blocks": [
        hdr(),
        criteria("epoc", "Criterios de Inclusión GES", "blue", [
            "EPOC confirmado por espirometría post-broncodilatador: VEF1/CVF <0.70",
            "EPOC GOLD II-IV con síntomas o exacerbaciones frecuentes",
            "EPOC con hipoxemia crónica (SaO2 <88% en reposo) candidato a oxígeno domiciliario",
            "EPOC con indicación de rehabilitación pulmonar",
            "EPOC con exacerbaciones frecuentes (≥2/año) a pesar de tratamiento optimizado",
        ]),
        checklist("epoc", "Requisitos para la Derivación (SIC)", [
            {"label": "Espirometría", "items": [
                "Espirometría post-broncodilatador con informe (VEF1, CVF, VEF1/CVF)",
                "Clasificación GOLD y grupo A/B/E según síntomas y exacerbaciones",
            ]},
            {"label": "Evaluación Clínica", "items": [
                "Saturometría basal y de esfuerzo",
                "CAT o mMRC (disnea) documentados",
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
        criteria("asma-pediatrico", "Criterios de Inclusión GES", "green", [
            "Asma bronquial moderada o grave en menores de 15 años",
            "Crisis asmáticas recurrentes (≥3 en el año) a pesar de tratamiento de mantención",
            "Asma con hospitalización por crisis en el último año",
            "Uso frecuente de corticoide sistémico para el asma",
            "Asma con sospecha de comorbilidad: ERGE, rinitis alérgica, obesidad",
        ]),
        checklist("asma-pediatrico", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico y Control", "items": [
                "Espirometría si ≥5 años (o PEF si no disponible)",
                "Test de provocación bronquial si diagnóstico dudoso",
                "Cuestionario de control del asma (ACT/c-ACT) con puntaje",
            ]},
            {"label": "Tratamiento", "items": [
                "Tratamiento de mantención actual (CSI, LABA, montelukast) con técnica de inhalación",
                "Broncodilatador de rescate: frecuencia de uso",
                "Número de crisis en el último año y gravedad",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Peso y talla (dosis en kg)", "Interconsulta broncopulmonar pediátrico",
            ]},
        ]),
        criteria("asma-adulto", "Criterios de Inclusión GES", "green", [
            "Asma bronquial moderada o grave en adultos (≥15 años) con mal control",
            "Asma severa refractaria a dosis altas de CSI + LABA",
            "Asma con hospitalizaciones frecuentes o uso de ventilación mecánica",
            "Asma con dependencia de corticoide oral",
            "Asma con fenotipo eosinofílico o alérgico severo (candidato a biológicos)",
        ]),
        checklist("asma-adulto", "Requisitos para la Derivación (SIC)", [
            {"label": "Función Pulmonar", "items": [
                "Espirometría pre y post broncodilatador",
                "Variabilidad del PEF si disponible",
                "Clasificación de severidad (GINA)",
            ]},
            {"label": "Control y Tratamiento", "items": [
                "ACT (Asthma Control Test) con puntaje",
                "Tratamiento actual completo con dosis",
                "Alergias documentadas (Prick test o IgE específica)",
                "Eosinofilia en sangre y esputo si disponible",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta broncopulmonar adultos",
            ]},
        ]),
        criteria("fibrosis-quistica", "Criterios de Inclusión GES", "purple", [
            "Fibrosis quística confirmada por test del sudor (Cl >60 mEq/L) o mutación CFTR",
            "Insuficiencia pancreática exocrina con esteatorrea",
            "Infecciones respiratorias recurrentes con gérmenes típicos (Pseudomonas, Staphylococcus)",
            "VEF1 <70% del predicho",
        ]),
        checklist("fibrosis-quistica", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico", "items": [
                "Test del sudor con resultado (Cl en mEq/L)",
                "Estudio genético de mutaciones CFTR si disponible",
                "Espirometría (VEF1, CVF)",
            ]},
            {"label": "Seguimiento", "items": [
                "Cultivo de esputo con antibiograma (último 6 meses)",
                "Función pancreática (elastasa fecal o grasa en deposición)",
                "Estado nutricional: peso, talla, IMC",
                "Vitaminas liposolubles (A, D, E, K)",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta broncopulmonar o equipo multidisciplinario FQ",
            ]},
        ]),
        criteria("covid-rehab", "Criterios de Inclusión GES", "amber", [
            "COVID-19 grave o crítico con secuelas funcionales persistentes (>12 semanas)",
            "Disnea persistente post-COVID con limitación funcional (mMRC ≥2)",
            "Fatiga crónica post-COVID que impide actividades de la vida diaria",
            "Fibrosis pulmonar post-COVID en TAC",
            "Síndrome post-UCI con debilidad neuromuscular o cognitiva",
        ]),
        checklist("covid-rehab", "Requisitos para la Derivación (SIC)", [
            {"label": "Documentación", "items": [
                "Confirmación de COVID-19 previo (PCR, antígeno o serología positiva)",
                "Epicrisis de hospitalización si estuvo hospitalizado",
                "Tiempo transcurrido desde el episodio agudo",
            ]},
            {"label": "Evaluación Funcional", "items": [
                "Saturometría basal y con esfuerzo",
                "Escala mMRC de disnea",
                "Espirometría si tolera",
                "TAC de tórax post-COVID si disponible",
                "Test de marcha de 6 minutos",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta broncopulmonar o medicina física y rehabilitación",
            ]},
        ]),
    ]
})

# ─────────────────────────────────────────────────────────────────────────────
# 9. TRAUMATOLOGÍA Y CIRUGÍA
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Traumatología y Cirugía",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo GES para escoliosis, endoprótesis de cadera, artrosis, HNP lumbar, colecistectomía, fisura labiopalatina, displasia de cadera y osteosarcoma.",
    "tags": ["GES", "traumatología", "cirugía", "pauta de cotejo"],
    "blocks": [
        hdr(),
        criteria("escoliosis", "Criterios de Inclusión GES", "blue", [
            "Escoliosis idiopática en personas menores de 25 años con indicación quirúrgica",
            "Ángulo de Cobb ≥45° en escoliosis torácica o ≥40° en escoliosis lumbar",
            "Progresión documentada del ángulo de Cobb (>5° en 6 meses) con potencial de crecimiento",
            "Escoliosis con compromiso cardiopulmonar",
        ]),
        checklist("escoliosis", "Requisitos para la Derivación (SIC)", [
            {"label": "Imágenes", "items": [
                "Radiografía de columna total AP y lateral de pie (Rx panorámica)",
                "Ángulo de Cobb medido y documentado",
                "Clasificación de Risser (madurez esquelética)",
                "TAC o RNM de columna si malformación vertebral sospechada",
            ]},
            {"label": "Evaluación General", "items": [
                "Peso, talla, IMC",
                "Función pulmonar si escoliosis severa (CVF, VEF1)",
                "Hemograma y coagulación",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta traumatología o cirugía de columna",
            ]},
        ]),
        criteria("endoprotesis-cadera", "Criterios de Inclusión GES", "amber", [
            "Artrosis de cadera severa con limitación funcional severa en personas ≥65 años",
            "Escala de Lequesne ≥10 o WOMAC con limitación funcional severa documentada",
            "Fractura de cuello femoral en personas ≥65 años",
            "Necrosis avascular de cadera con colapso en estadio III-IV",
            "Fracaso de tratamiento conservador con kinesioterapia y analgesia",
        ]),
        checklist("endoprotesis-cadera", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Funcional", "items": [
                "Escala de Lequesne o WOMAC con puntaje",
                "Descripción de limitación funcional (subir escaleras, caminar distancia)",
            ]},
            {"label": "Imágenes", "items": [
                "Radiografía de pelvis AP y axial de cadera afectada",
                "Clasificación Kellgren-Lawrence de artrosis",
            ]},
            {"label": "Evaluación Preoperatoria", "items": [
                "Hemograma, coagulación (TP, TTPK, plaquetas)",
                "Grupo sanguíneo",
                "Función renal y glicemia",
                "ECG y evaluación cardiológica si >65 años",
                "RUT válido",
            ]},
        ]),
        criteria("artrosis", "Criterios de Inclusión GES", "green", [
            "Artrosis de cadera y/o rodilla leve a moderada en personas ≥55 años",
            "Dolor crónico articular con limitación funcional documentada",
            "Fracaso de tratamiento farmacológico básico (AINE, paracetamol)",
            "Necesidad de rehabilitación kinésica y manejo del dolor especializado",
        ]),
        checklist("artrosis", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Funcional y Dolor", "items": [
                "EVA de dolor en reposo y movimiento",
                "Escala WOMAC o Lequesne",
                "Goniometría de articulación afectada",
            ]},
            {"label": "Imágenes", "items": [
                "Radiografía de rodillas AP carga y/o cadera AP bilateral",
                "Clasificación Kellgren-Lawrence",
            ]},
            {"label": "Tratamiento", "items": [
                "Fármacos actuales y respuesta",
                "Infiltraciones previas y resultado",
                "RUT válido",
            ]},
        ]),
        criteria("hnp-lumbar", "Criterios de Inclusión GES", "red", [
            "Hernia del núcleo pulposo lumbar con radiculopatía confirmada por imagen",
            "Síntomas >6 semanas sin respuesta a tratamiento conservador",
            "Déficit neurológico progresivo: paresia, pérdida de sensibilidad",
            "Síndrome de cauda equina (urgencia quirúrgica)",
            "Dolor radicular EVA ≥7 refractario a analgesia escalonada",
        ]),
        checklist("hnp-lumbar", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico por Imagen", "items": [
                "RNM de columna lumbar con informe (nivel, tipo y grado de hernia)",
                "TAC de columna lumbar si contraindicación a RNM",
            ]},
            {"label": "Evaluación Clínica", "items": [
                "Descripción del nivel radicular afectado (L4, L5, S1)",
                "Signo de Lasègue documentado",
                "Escala EVA de dolor y ODI (Oswestry)",
                "Electromiografía si necesario para confirmar nivel",
            ]},
            {"label": "Tratamiento Previo", "items": [
                "Kinesiología (sesiones y respuesta)",
                "Analgesia actual y respuesta",
                "RUT válido",
            ]},
        ]),
        criteria("colecistectomia", "Criterios de Inclusión GES", "amber", [
            "Personas entre 35 y 49 años con cálculos biliares asintomáticos (prevención cáncer vesicular)",
            "Colelitiasis sintomática con cólicos biliares recurrentes",
            "Colecistitis aguda o crónica con indicación quirúrgica",
            "Pólipo vesicular ≥10mm o con factores de riesgo de malignización",
        ]),
        checklist("colecistectomia", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico", "items": [
                "Ecografía abdominal con informe (tamaño de cálculos, estado de vesícula, pólipo si aplica)",
                "Descripción de síntomas biliares",
            ]},
            {"label": "Evaluación Preoperatoria", "items": [
                "Hemograma, coagulación",
                "Función hepática (bilirrubina, fosfatasa alcalina, GGT)",
                "Amilasa/lipasa si colecistitis",
                "ECG en >40 años",
                "Glicemia y función renal",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido (edad 35-49 años verificada)", "Interconsulta cirugía general",
            ]},
        ]),
        criteria("fisura-labiopalatina", "Criterios de Inclusión GES", "blue", [
            "Fisura labial con o sin fisura palatina confirmada al nacimiento",
            "Fisura palatina aislada confirmada",
            "Cualquier tipo de fisura orofacial que requiera corrección quirúrgica",
        ]),
        checklist("fisura-labiopalatina", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico", "items": [
                "Descripción y fotografía clínica de la fisura",
                "Tipo de fisura (Veau I, II, III, IV)",
                "Ecografía prenatal con diagnóstico si disponible",
            ]},
            {"label": "Evaluación General", "items": [
                "Evaluación genética si sospecha de síndrome asociado",
                "Evaluación de alimentación y peso (lactante)",
                "Ecografía cardíaca si sospecha de cardiopatía asociada",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido (menor y tutor)", "Interconsulta cirugía maxilofacial o plástica",
            ]},
        ]),
        criteria("displasia-cadera", "Criterios de Inclusión GES", "green", [
            "Displasia del desarrollo de la cadera (DDC) detectada por screening neonatal o ecografía",
            "Graf tipo II en ecografía de cadera en recién nacido o lactante <6 meses",
            "Asimetría de pliegues o limitación de abducción al examen físico neonatal",
            "Cadera luxada o subluxada al examen (Ortolani o Barlow positivos)",
        ]),
        checklist("displasia-cadera", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico", "items": [
                "Ecografía de caderas con clasificación de Graf (en <4-6 meses)",
                "Radiografía de pelvis AP si >4-6 meses con índice acetabular e índice de migración",
            ]},
            {"label": "Evaluación Clínica", "items": [
                "Descripción de examen físico: Ortolani, Barlow, abducción",
                "Peso y edad gestacional",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido (menor y tutor)", "Interconsulta traumatología infantil",
            ]},
        ]),
        criteria("osteosarcoma-tmt", "Criterios de Inclusión GES", "red", [
            "Osteosarcoma confirmado histológicamente con indicación de tratamiento",
            "Neoadyuvancia completada y evaluación de respuesta",
            "Recidiva local o metástasis pulmonares de osteosarcoma",
            "Seguimiento post-tratamiento",
        ]),
        checklist("osteosarcoma-tmt", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico y Estadificación", "items": [
                "Informe anatomopatológico de biopsia",
                "RNM del hueso afectado",
                "TAC de tórax (metástasis pulmonares)",
                "Cintigrafía ósea",
                "FAL y LDH basales",
            ]},
            {"label": "Evaluación Preoperatoria", "items": [
                "Hemograma y coagulación",
                "Función renal y hepática",
                "Ecocardiograma (cardiotoxicidad por quimioterapia)",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta traumatología oncológica + oncología",
            ]},
        ]),
    ]
})

# ─────────────────────────────────────────────────────────────────────────────
# 10. OFTALMOLOGÍA Y ORL
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Oftalmología y ORL",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo GES para cataratas, vicios de refracción, estrabismo, desprendimiento de retina, hipoacusia adulto y pediátrico.",
    "tags": ["GES", "oftalmología", "ORL", "hipoacusia", "pauta de cotejo"],
    "blocks": [
        hdr(),
        criteria("cataratas", "Criterios de Inclusión GES", "amber", [
            "Catarata que produce reducción de agudeza visual AV ≤0.3 en el ojo operado",
            "Catarata con impacto funcional significativo documentado",
            "Catarata traumática en cualquier edad",
            "Catarata congénita o del desarrollo en menores de 15 años (urgencia oftalmológica)",
        ]),
        checklist("cataratas", "Requisitos para la Derivación (SIC)", [
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
                "RUT válido", "Interconsulta oftalmología", "Hemograma y glicemia si diabético",
            ]},
        ]),
        criteria("vicios-refraccion", "Criterios de Inclusión GES", "blue", [
            "Vicios de refracción en personas ≥65 años con necesidad de corrección óptica",
            "Agudeza visual sin corrección ≤0.5",
            "Presbicia con necesidad de corrección para visión de cerca en adulto mayor",
        ]),
        checklist("vicios-refraccion", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Visual", "items": [
                "Agudeza visual sin corrección (AVSC) y con corrección óptica (MAVC)",
                "Refracción objetiva (autorrefractómetro) y/o subjetiva",
            ]},
            {"label": "Examen Ocular", "items": [
                "Biomicroscopía de segmento anterior",
                "Fondo de ojo si indicado",
                "Tonometría",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido (≥65 años verificada)", "Interconsulta oftalmología",
            ]},
        ]),
        criteria("estrabismo", "Criterios de Inclusión GES", "green", [
            "Estrabismo en personas menores de 9 años con indicación de tratamiento",
            "Esotropia o exotropia constante o intermitente significativa",
            "Ambliopía asociada al estrabismo",
            "Estrabismo vertical o parético",
        ]),
        checklist("estrabismo", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Oftalmológica Pediátrica", "items": [
                "Agudeza visual (con y sin corrección, cada ojo separado)",
                "Reflejo corneal de Hirschberg",
                "Cover test y uncover test",
                "Refracción bajo cicloplejia",
                "Fondo de ojo dilatado",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido (menor de 9 años verificada)", "Interconsulta oftalmología pediátrica",
            ]},
        ]),
        criteria("desprendimiento-retina", "Criterios de Inclusión GES", "red", [
            "Desprendimiento de retina regmatógeno no traumático confirmado",
            "Síntomas de alerta: fotopsias, miodesopsias nuevas o incrementadas, pérdida de campo visual",
            "Agujero o desgarro retinal con riesgo de desprendimiento en fondo de ojo",
        ]),
        checklist("desprendimiento-retina", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Oftalmológica (URGENCIA)", "items": [
                "Agudeza visual actual",
                "Fondo de ojo con oftalmoscopio indirecto y descripción de localización",
                "OCT si disponible",
                "Ecografía ocular en modo B si no se visualiza retina",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Derivación URGENTE a oftalmología", "Tiempo de evolución de síntomas",
            ]},
        ]),
        criteria("hipoacusia-adulto", "Criterios de Inclusión GES", "purple", [
            "Hipoacusia bilateral de origen conductivo, sensorioneural o mixta con indicación de audífono en ≥65 años",
            "Pérdida auditiva ≥40 dB en mejor oído en frecuencias conversacionales (500-4000 Hz)",
            "Impacto funcional significativo documentado (dificultad para comunicarse)",
        ]),
        checklist("hipoacusia-adulto", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Audiológica", "items": [
                "Audiometría tonal liminal con umbral auditivo bilateral",
                "Impedanciometría (timpanograma y reflejos estapediales)",
                "Logoaudiometría si disponible",
            ]},
            {"label": "Evaluación ORL", "items": [
                "Otoscopía documentada",
                "Descarte de causa tratable: tapón de cerumen, OMA, perforación",
                "TAC de hueso temporal si indicado",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido (≥65 años)", "Interconsulta ORL",
            ]},
        ]),
        criteria("hipoacusia-pediatrico", "Criterios de Inclusión GES", "purple", [
            "Hipoacusia bilateral en menores detectada por screening neonatal (PEAT alterado)",
            "Pérdida auditiva ≥40 dB en mejor oído en niño menor de 15 años",
            "Retraso del lenguaje con sospecha de hipoacusia como causa",
            "Candidato a implante coclear (hipoacusia profunda bilateral)",
        ]),
        checklist("hipoacusia-pediatrico", "Requisitos para la Derivación (SIC)", [
            {"label": "Screening y Diagnóstico", "items": [
                "PEAT (Potenciales Evocados Auditivos de Tronco) con informe",
                "OAE (Emisiones Otoacústicas) si <6 meses",
                "Audiometría conductual (BOA, VRA, juego) según edad",
                "Impedanciometría",
            ]},
            {"label": "Evaluación de Causa", "items": [
                "Serología materna TORCH si sospecha congénita",
                "Estudio genético (Conexina 26/GJB2) si hipoacusia sensorioneural",
                "TAC o RNM de rocas petrosas si candidato a implante",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido (menor y tutor)", "Interconsulta ORL pediátrico",
            ]},
        ]),
    ]
})

# ─────────────────────────────────────────────────────────────────────────────
# 11. REUMATOLOGÍA
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Reumatología",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo GES para artritis reumatoidea, artritis idiopática juvenil y lupus eritematoso sistémico.",
    "tags": ["GES", "reumatología", "artritis", "lupus", "pauta de cotejo"],
    "blocks": [
        hdr(),
        criteria("artritis-reumatoidea", "Criterios de Inclusión GES", "red", [
            "Artritis reumatoidea confirmada según criterios ACR/EULAR 2010 (score ≥6)",
            "Poliartritis simétrica con rigidez matutina >1 hora",
            "Factor reumatoideo (FR) o Anti-CCP positivo con artritis",
            "AR con actividad moderada a severa (DAS28 >3.2)",
            "AR con indicación de DMARD biológico",
        ]),
        checklist("artritis-reumatoidea", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico Inmunológico", "items": [
                "Factor reumatoideo (FR IgM)",
                "Anti-CCP (anticuerpos anti-péptido citrulinado cíclico)",
                "ANA si duda diagnóstica",
                "VHS y PCR como marcadores de actividad",
            ]},
            {"label": "Evaluación Articular", "items": [
                "Recuento de articulaciones dolorosas e inflamadas (DAS28)",
                "Radiografía de manos y pies AP bilateral",
                "Ecografía articular si disponible",
            ]},
            {"label": "Tratamiento y Datos", "items": [
                "DMARDs actuales (metotrexato, leflunomida, etc.) con dosis y tiempo",
                "Serología VHB, VHC, VIH (previo a biológicos)",
                "RUT válido",
                "Interconsulta reumatología",
            ]},
        ]),
        criteria("artritis-juvenil", "Criterios de Inclusión GES", "green", [
            "Artritis idiopática juvenil (AIJ) en menores de 16 años (criterios ILAR)",
            "Artritis persistente >6 semanas sin causa identificada en menor de 16 años",
            "AIJ poliarticular, sistémica o con uveítis asociada",
            "AIJ con indicación de tratamiento biológico",
        ]),
        checklist("artritis-juvenil", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico", "items": [
                "Descripción de articulaciones afectadas y tiempo de evolución",
                "ANA (asociado a uveítis en AIJ oligoarticular)",
                "FR y Anti-CCP si mayor de 10 años",
                "HLA-B27 si compromiso axial sospechado",
                "VHS, PCR, hemograma",
            ]},
            {"label": "Evaluación Ocular", "items": [
                "Examen en lámpara de hendidura (uveítis subclínica)",
                "Frecuencia de controles oftalmológicos en AIJ",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido (menor y tutor)", "Interconsulta reumatología pediátrica",
            ]},
        ]),
        criteria("lupus", "Criterios de Inclusión GES", "purple", [
            "Lupus eritematoso sistémico (LES) según criterios SLICC 2012 o ACR/EULAR 2019",
            "LES con compromiso renal (lupus nefritis: proteinuria >500 mg/24h o hematuria con cilindros)",
            "LES con compromiso del SNC, cardíaco, pulmonar o hematológico grave",
            "LES con actividad moderada a severa (SLEDAI >6)",
            "LES con indicación de inmunosupresor o biológico",
        ]),
        checklist("lupus", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico Inmunológico", "items": [
                "ANA (título y patrón)",
                "Anti-DNA doble cadena (anti-dsDNA)",
                "Complemento C3, C4 y CH50",
                "Anticuerpos anti-Smith, anti-Ro/La, anti-cardiolipinas, anti-β2GP1",
                "Anticuerpos anti-fosfolípidos (Síndrome antifosfolípido asociado)",
            ]},
            {"label": "Evaluación de Daño Orgánico", "items": [
                "Orina completa con proteinuria 24h o ACR",
                "Creatinina y TFG",
                "Hemograma (citopenias)",
                "Biopsia renal si lupus nefritis",
            ]},
            {"label": "Tratamiento y Datos", "items": [
                "Tratamiento actual: hidroxicloroquina, corticoides, inmunosupresores",
                "RUT válido",
                "Interconsulta reumatología",
            ]},
        ]),
    ]
})

# ─────────────────────────────────────────────────────────────────────────────
# 12. GASTROENTEROLOGÍA
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Gastroenterología",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo GES para H. pylori, hepatitis B y C, cirrosis, cáncer gástrico y colorrectal.",
    "tags": ["GES", "gastroenterología", "hepatitis", "pauta de cotejo"],
    "blocks": [
        hdr(),
        criteria("helicobacter", "Criterios de Inclusión GES", "amber", [
            "Úlcera péptica confirmada por endoscopía con test de H. pylori positivo",
            "Linfoma MALT gástrico de bajo grado",
            "Familiar de primer grado de paciente con cáncer gástrico",
            "Test de H. pylori positivo en paciente con dispepsia funcional persistente",
            "Post-resección de cáncer gástrico temprano",
        ]),
        checklist("helicobacter", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico de H. pylori", "items": [
                "Test de urea en aliento (gold standard no invasivo)",
                "Test de antígeno en deposiciones",
                "Biopsia gástrica con ureasas o histología (si se realiza EDA)",
                "Ausencia de uso de IBP las últimas 2 semanas antes del test",
            ]},
            {"label": "Endoscopía si indicada", "items": [
                "Informe de endoscopía digestiva alta",
                "Biopsia de antro y cuerpo si úlcera gástrica",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta gastroenterología",
            ]},
        ]),
        criteria("hepatitis-b", "Criterios de Inclusión GES", "red", [
            "Hepatitis B crónica confirmada (HBsAg positivo >6 meses)",
            "Hepatitis B con replicación viral activa (HBV-DNA detectable)",
            "Hepatitis B con indicación de tratamiento antiviral",
            "Hepatitis B con coinfección VIH o VHC",
            "Profilaxis de reactivación por HBV en paciente inmunosupresor",
        ]),
        checklist("hepatitis-b", "Requisitos para la Derivación (SIC)", [
            {"label": "Serología y Virología", "items": [
                "HBsAg, Anti-HBs, Anti-HBc (IgG e IgM)",
                "HBeAg y Anti-HBe",
                "HBV-DNA cuantitativo (carga viral)",
                "Genotipo viral si disponible",
            ]},
            {"label": "Evaluación Hepática", "items": [
                "Transaminasas (ALT, AST), GGT, bilirrubina total y directa",
                "Albúmina, TP-INR (función sintética)",
                "Ecografía abdominal con evaluación de fibrosis/cirrosis",
                "FIB-4 o Fibroscan si disponible",
                "AFP (alpha-fetoproteína)",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta gastroenterología o hepatología",
            ]},
        ]),
        criteria("hepatitis-c", "Criterios de Inclusión GES", "red", [
            "Hepatitis C crónica confirmada (Anti-VHC positivo + VHC-RNA detectable)",
            "Hepatitis C con indicación de tratamiento con antivirales de acción directa (AAD)",
            "Hepatitis C con fibrosis hepática significativa (F2 o superior)",
            "Hepatitis C con manifestaciones extrahepáticas (crioglobulinemia, glomerulonefritis)",
            "Coinfección VHC + VIH",
        ]),
        checklist("hepatitis-c", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico VHC", "items": [
                "Anti-VHC (ELISA de tercera generación)",
                "VHC-RNA cuantitativo (carga viral)",
                "Genotipo VHC (1a, 1b, 2, 3, etc.)",
            ]},
            {"label": "Estadificación Hepática", "items": [
                "Transaminasas, GGT, bilirrubina",
                "Albúmina, TP-INR",
                "Fibroscan (elastografía hepática) o FIB-4",
                "Ecografía abdominal",
                "AFP",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "VIH si no conocido", "Interconsulta gastroenterología/hepatología",
            ]},
        ]),
        criteria("cirrosis", "Criterios de Inclusión GES", "purple", [
            "Cirrosis hepática compensada o descompensada (ascitis, encefalopatía, hemorragia variceal)",
            "Cirrosis con várices esofágicas documentadas en endoscopía",
            "Cirrosis con hipertensión portal sintomática",
            "Cirrosis candidato a trasplante hepático",
            "Hepatocarcinoma en contexto de cirrosis",
        ]),
        checklist("cirrosis", "Requisitos para la Derivación (SIC)", [
            {"label": "Función Hepática", "items": [
                "Child-Pugh y MELD-Na calculados",
                "Albúmina, TP-INR, bilirrubina total",
                "Transaminasas, GGT",
                "Recuento plaquetario (hipertensión portal)",
            ]},
            {"label": "Evaluación de Complicaciones", "items": [
                "Endoscopía digestiva alta (várices, GAVE)",
                "Ecografía doppler portal",
                "AFP (screening hepatocarcinoma)",
                "Paracentesis diagnóstica con GASA si ascitis",
            ]},
            {"label": "Etiología y Datos", "items": [
                "Etiología documentada (OH, VHB, VHC, NASH, autoinmune, etc.)",
                "RUT válido", "Interconsulta hepatología",
            ]},
        ]),
        criteria("cancer-gastrico", "Criterios de Inclusión GES", "amber", [
            "Cáncer gástrico confirmado por biopsia endoscópica",
            "Lesión endoscópica sospechosa Paris II o III en paciente sintomático",
            "Seguimiento post-gastrectomía por cáncer gástrico",
        ]),
        checklist("cancer-gastrico", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico", "items": [
                "Informe de endoscopía digestiva alta con fotos y biopsia",
                "Informe anatomopatológico con Lauren, HER2 y gradación",
            ]},
            {"label": "Estadificación", "items": [
                "TAC de tórax, abdomen y pelvis",
                "Ecoendoscopía para T y N locales",
                "CEA, CA 19-9",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Hemograma y función general", "Interconsulta oncología o cirugía oncológica",
            ]},
        ]),
        criteria("cancer-colorrectal", "Criterios de Inclusión GES", "green", [
            "Cáncer colorrectal confirmado por colonoscopía y biopsia",
            "Pólipo adenomatoso con displasia de alto grado",
            "Seguimiento post-resección de cáncer colorrectal",
            "Síndrome de Lynch o poliposis adenomatosa familiar",
        ]),
        checklist("cancer-colorrectal", "Requisitos para la Derivación (SIC)", [
            {"label": "Diagnóstico", "items": [
                "Colonoscopía completa con informe y fotos",
                "Biopsia con informe anatomopatológico",
                "CEA y CA 19-9 basales",
            ]},
            {"label": "Estadificación", "items": [
                "TAC de tórax, abdomen y pelvis",
                "RNM de pelvis si cáncer de recto",
                "Estudio molecular: KRAS, NRAS, BRAF, inestabilidad de microsatélites (IMS)",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Interconsulta cirugía/oncología colorrectal",
            ]},
        ]),
    ]
})

# ─────────────────────────────────────────────────────────────────────────────
# 13. GINECOLOGÍA Y OBSTETRICIA
# ─────────────────────────────────────────────────────────────────────────────
TOPICS.append({
    "name": "Pauta de Cotejo GES 2026 — Ginecología y Obstetricia",
    "subcategory": "GES 2026",
    "description": "Pautas de cotejo GES para prevención de parto prematuro y atención de víctimas de agresión sexual.",
    "tags": ["GES", "ginecología", "obstetricia", "parto prematuro", "pauta de cotejo"],
    "blocks": [
        hdr(),
        criteria("parto-prematuro", "Criterios de Inclusión GES", "blue", [
            "Embarazada con amenaza de parto prematuro (contracciones con cambios cervicales entre semanas 22 y 34+6)",
            "Cervicometría ≤25 mm por transvaginal entre semanas 14 y 24",
            "Antecedente de parto prematuro previo (<37 semanas)",
            "Embarazo gemelar con riesgo de parto prematuro",
            "Embarazada con ruptura prematura de membranas antes de término (RPMO)",
        ]),
        checklist("parto-prematuro", "Requisitos para la Derivación (SIC)", [
            {"label": "Evaluación Obstétrica", "items": [
                "FUR y edad gestacional confirmada por ecografía del 1T",
                "Cervicometría transvaginal con medición de longitud cervical",
                "Monitoreo de actividad uterina (CTGF si disponible)",
                "Espéculo: descartar RPMO (pooling, test de helechos, PAMG-1 si disponible)",
            ]},
            {"label": "Laboratorio", "items": [
                "Hemograma y PCR",
                "Orina completa y urocultivo",
                "Cultivo vaginorectal para SGB (Streptococcus grupo B) si >35 semanas",
                "Perfil de bienestar fetal: LA, movimientos, FCF",
            ]},
            {"label": "Datos del Paciente", "items": [
                "RUT válido", "Carnet de control prenatal actualizado", "Interconsulta obstetricia de alto riesgo",
            ]},
        ]),
        criteria("agresion-sexual", "Criterios de Inclusión GES", "red", [
            "Persona víctima de agresión sexual de cualquier edad y sexo",
            "Consulta dentro de las 120 horas post-agresión para profilaxis y evidencia forense",
            "Víctima de agresión sexual con necesidad de atención médica, psicológica y legal integrada",
        ]),
        checklist("agresion-sexual", "Requisitos para la Derivación (SIC)", [
            {"label": "Atención Inmediata (Protocolo GES)", "items": [
                "Denuncia policial o fiscal (o consentimiento de la víctima para realizarla)",
                "Examen médico legal con consentimiento informado",
                "Toma de muestras forenses: hisopados vaginales, anales, bucales según protocolo",
                "Fotografías de lesiones si existen",
            ]},
            {"label": "Profilaxis y Tratamiento", "items": [
                "Profilaxis ETS: gonorrea, clamidia, tricomonas (azitromicina + ceftriaxona)",
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
})

# ─────────────────────────────────────────────────────────────────────────────
# CREATE TOPICS IN SUPABASE
# ─────────────────────────────────────────────────────────────────────────────

def create_topic(topic_data):
    payload = {
        "name": topic_data["name"],
        "category_id": CATEGORY_ID,
        "subcategory": topic_data.get("subcategory", "GES 2026"),
        "description": topic_data.get("description", ""),
        "tags": topic_data.get("tags", []),
        "has_local_protocol": False,
        "content_blocks": topic_data["blocks"],
    }
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/topics",
        headers=HEADERS,
        json=payload,
        timeout=30,
    )
    if resp.status_code in (200, 201):
        data = resp.json()
        created = data[0] if isinstance(data, list) else data
        print(f"  ✓ Created: {topic_data['name']} (id={created.get('id')})")
        return created
    else:
        print(f"  ✗ Error {resp.status_code}: {resp.text[:200]}")
        return None

if __name__ == "__main__":
    print(f"\nCreating {len(TOPICS)} GES Cotejo topics...\n")
    created = 0
    for t in TOPICS:
        result = create_topic(t)
        if result:
            created += 1
    print(f"\nDone: {created}/{len(TOPICS)} topics created.")

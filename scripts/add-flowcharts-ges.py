#!/usr/bin/env python3
"""
Adds a mermaid flowchart block to each GES topic (after protocol_header).
Each flowchart covers: detection → workup → GES criteria → referral pathway.
"""
import uuid, requests

SUPABASE_URL = "https://gcuevpxondfepbowvyqa.supabase.co"
SUPABASE_KEY = "sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

STYLE = """
    classDef inicio fill:#3730a3,stroke:#312e81,color:#fff,font-weight:bold
    classDef proceso fill:#f1f5f9,stroke:#94a3b8,color:#1e293b
    classDef decision fill:#fef3c7,stroke:#d97706,color:#78350f,font-weight:bold
    classDef derivacion fill:#d1fae5,stroke:#059669,color:#064e3b,font-weight:bold
    classDef aps fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef alerta fill:#fee2e2,stroke:#dc2626,color:#7f1d1d,font-weight:bold"""

def flow(content): return f"flowchart TD\n{STYLE}\n{content}"

def mblock(chart_content, title="Algoritmo de Derivación GES"):
    return {
        "id": str(uuid.uuid4()),
        "type": "mermaid",
        "tab": None,
        "layout_position": "full",
        "title": title,
        "content": flow(chart_content),
    }

# ── FLOWCHARTS (topic_id → mermaid block) ────────────────────────────────────

FLOWS = {}

# 1. CARDIOPATÍAS CONGÉNITAS
FLOWS["04dd5a0e-c1ad-4b7f-a9e5-ec26d7748c87"] = mblock("""
    A(["🔍 Detección\\nSíntoma cardíaco, soplo,\\ncianosis o hallazgo eco"]):::inicio
    A --> B["Evaluación pediátrica\\no médico APS"]:::proceso
    B --> C["Ecocardiograma\\n+ RxTórax + ECG"]:::proceso
    C --> D{{"¿Cardiopatía\\ncongénita operable?"}}:::decision
    D -->|Sí| E["Apertura GES\\n+ interconsulta"]:::proceso
    D -->|No| F["Control APS\\nseguimiento"]:::aps
    E --> G["Cardiología /\\nCirugía Cardiovascular\\n— HHM"]:::derivacion
    G --> H["Resolución quirúrgica\\no intervencionista"]:::derivacion""")

# 2. IAM
FLOWS["696efcff77924d3a78533dd6"] = mblock("""
    A(["🚨 Urgencia\\nDolor torácico,\\ndisnea, síncope"]):::inicio
    A --> B["ECG 12 derivaciones\\n+ Troponinas seriadas"]:::proceso
    B --> C{{"¿Criterios IAM?\\nSTEMI / NSTEMI"}}:::decision
    C -->|STEMI| D["Activación código IAM\\nTraslado inmediato"]:::alerta
    C -->|NSTEMI| E["Antiagregación\\n+ Hospitalización"]:::proceso
    D --> F["Hemodinamia\\n— HHM"]:::derivacion
    E --> F
    F --> G["Coronariografía\\n± Revascularización"]:::derivacion
    G --> H["Seguimiento post-IAM\\nEco FEVI + Cardiología"]:::aps""")

# 3. HTA
FLOWS["696ea74c245ef362de4f433a"] = mblock("""
    A(["📋 Pesquisa\\nControl rutina APS\\nPA elevada"]):::inicio
    A --> B["2 mediciones PA\\n> 2 semanas apart"]:::proceso
    B --> C{{"¿PA ≥ 140/90\\nmmHg?"}}:::decision
    C -->|No| F["Control APS\\nMedidas HV"]:::aps
    C -->|Sí| D["Exámenes: Lab + ECG\\n+ orina + fondo de ojo"]:::proceso
    D --> E{{"¿HTA resistente\\no daño órgano?"}}:::decision
    E -->|No| G["Tratamiento APS\\nCumplimiento farmacológico"]:::aps
    E -->|Sí| H["Apertura GES\\nInterconsulta"]:::proceso
    H --> I["Cardiología /\\nMedicina Interna\\n— HHM"]:::derivacion""")

# 4. MARCAPASO
FLOWS["dc917bbe-bbff-4a36-89f3-895c41628b2f"] = mblock("""
    A(["🫀 Síntoma\\nSíncope, presíncope,\\nbradicardia severa"]):::inicio
    A --> B["ECG 12 derivaciones\\n+ Holter ritmo 24h"]:::proceso
    B --> C{{"¿Trastorno conducción\\ncon indicación MCP?"}}:::decision
    C -->|No| F["Evaluación cardiológica\\nelectiva"]:::aps
    C -->|Sí| D["Apertura GES\\nEvaluación preoperatoria"]:::proceso
    D --> E["Lab: hemograma,\\ncoagulación, RxTórax"]:::proceso
    E --> G["Cardiología /\\nElectrofisiología\\n— HHM"]:::derivacion
    G --> H["Implante de\\nmarcapaso definitivo"]:::derivacion""")

# 5. VÁLVULA AÓRTICA
FLOWS["89f5d99d-1d44-43f2-b1a1-a6f228035602"] = mblock("""
    A(["🔍 Sospecha\\nSoplo eyectivo,\\ndisnea, síncope, angina"]):::inicio
    A --> B["Ecocardiograma Doppler\\n+ ECG + RxTórax"]:::proceso
    B --> C{{"¿Estenosis severa\\no IAo severa?"}}:::decision
    C -->|No| F["Control periódico\\neco seriada APS/Card"]:::aps
    C -->|Sí| D["Evaluación funcional\\nNYHA + coronariografía"]:::proceso
    D --> E{{"¿Indicación\\nquirúrgica?"}}:::decision
    E -->|No| F
    E -->|Sí| G["Apertura GES\\nInterconsulta"]:::proceso
    G --> H["Cardiología /\\nCirugía Cardiovascular\\n— HHM"]:::derivacion""")

# 6. VÁLVULAS MITRAL/TRICÚSPIDE
FLOWS["41e275d6-1057-4075-a9ef-f6305a895bca"] = mblock("""
    A(["🔍 Sospecha\\nSoplo, disnea,\\nFA, cardiomegalia"]):::inicio
    A --> B["Ecocardiograma Doppler\\nCuantificación severidad"]:::proceso
    B --> C{{"¿Valvulopatía\\nsevera sintomática?"}}:::decision
    C -->|No| F["Control eco periódico\\nAPS / Cardiología"]:::aps
    C -->|Sí| D["NYHA + test esfuerzo\\nScore Wilkins si EM"]:::proceso
    D --> E{{"¿Indicación\\nquirúrgica/percutánea?"}}:::decision
    E -->|No| F
    E -->|Sí| G["Apertura GES\\n+ preoperatorio"]:::proceso
    G --> H["Cardiología /\\nCirugía Cardiovascular\\n— HHM"]:::derivacion""")

# 7. ERC 4-5
FLOWS["696efcff77924d3a78533dd4"] = mblock("""
    A(["🔬 Pesquisa\\nExamen orina anormal\\ncreatinina elevada en control"]):::inicio
    A --> B["TFG estimada CKD-EPI\\n+ orina + microalbuminuria"]:::proceso
    B --> C{{"¿TFG < 30?\\n(Etapa 4-5)"}}:::decision
    C -->|No| F["Manejo factores riesgo\\nControl APS c/3 meses"]:::aps
    C -->|Sí| D["2 mediciones TFG\\n> 3 meses diferencia"]:::proceso
    D --> E["Metabólico: Ca, P,\\nPTH, hemograma, eco renal"]:::proceso
    E --> G["Apertura GES\\nInterconsulta Nefrología"]:::proceso
    G --> H["Nefrología\\n— HHM"]:::derivacion
    H --> I["Plan TRS precoz\\nFístula AV si indicado"]:::derivacion""")

# 8. ERC TERMINAL
FLOWS["2d31e828-cf69-4a64-8274-6e706b2bf74a"] = mblock("""
    A(["⚠️ Inicio Diálisis\\nTFG < 15 o síntomas\\nurémicos refractarios"]):::inicio
    A --> B["Inscripción programa\\ndiálisis — Centro TRS"]:::proceso
    B --> C["Seguimiento mensual:\\nKt/V, PTH, ferritina,\\nacceso vascular"]:::proceso
    C --> D{{"¿Candidato a\\ntrasplante renal?"}}:::decision
    D -->|Sí| E["Evaluación trasplante:\\nserología + PRA +\\ncardiovascular"]:::proceso
    D -->|No| F["Seguimiento crónico\\nen programa diálisis"]:::aps
    E --> G["Nefrología\\n— HHM\\nLista de espera TR"]:::derivacion
    F --> H["Control regular\\nacceso vascular"]:::aps""")

# 9. CÁNCER CERVICOUTERINO
FLOWS["696efcff77924d3a78533dd2"] = mblock("""
    A(["🔍 Pesquisa\\nPAP de rutina\\no síntoma ginecológico"]):::inicio
    A --> B{{"¿PAP alterado?\\nASCUS / LSIL /\\nHSIL / AGC"}}:::decision
    B -->|No| F["Control PAP\\nc/3 años APS"]:::aps
    B -->|Sí| C["Colposcopía\\n+ Biopsia cervical"]:::proceso
    C --> D{{"¿NIC 2-3 o\\ncarcinoma?"}}:::decision
    D -->|No| F
    D -->|Sí| E["TAC estadificación\\n+ Apertura GES"]:::proceso
    E --> G["Ginecología Oncológica\\n— HHM"]:::derivacion
    G --> H["Cirugía / Radioterapia\\n/ Quimioterapia"]:::derivacion""")

# 10. CÁNCER DE MAMA
FLOWS["696efcff77924d3a78533dd1"] = mblock("""
    A(["🔍 Detección\\nMamografía BI-RADS 4-5\\no nódulo palpable"]):::inicio
    A --> B["Ecografía mamaria\\n+ evaluación axilar"]:::proceso
    B --> C{{"¿BI-RADS ≥ 4?"}}:::decision
    C -->|No| F["Seguimiento\\nmamografía anual"]:::aps
    C -->|Sí| D["Biopsia (core biopsy)\\n+ IHQ: RE/RP/HER2/Ki67"]:::proceso
    D --> E{{"¿Carcinoma\\nconfirmado?"}}:::decision
    E -->|No| F
    E -->|Sí| G["Estadificación:\\nTAC + cintigrafía ósea\\n+ Apertura GES"]:::proceso
    G --> H["Cirugía Oncológica\\n/ Oncología\\n— HHM"]:::derivacion""")

# 11. CÁNCER GÁSTRICO
FLOWS["696efcff77924d3a78533dd3"] = mblock("""
    A(["🔍 Sospecha\\nBaja de peso, disfagia,\\nvómitos, sangrado digestivo"]):::inicio
    A --> B["Endoscopía digestiva alta\\n+ biopsia + test H. pylori"]:::proceso
    B --> C{{"¿Carcinoma gástrico\\nconfirmado?"}}:::decision
    C -->|No| F["Tratamiento H. pylori\\n+ control endoscópico"]:::aps
    C -->|Sí| D["Estadificación:\\nTAC tórax-abdomen-pelvis\\n+ Ecoendoscopía"]:::proceso
    D --> E["CEA + CA 19-9\\n+ HER2 si avanzado\\n+ Apertura GES"]:::proceso
    E --> G["Oncología /\\nCirugía Digestiva\\n— HHM"]:::derivacion""")

# 12. CÁNCER COLORRECTAL
FLOWS["b670e7b4-8b9c-46e6-91c8-3290999e1712"] = mblock("""
    A(["🔍 Sospecha\\nSangrado rectal, cambio\\nhábito intestinal > 4 sem"]):::inicio
    A --> B["Colonoscopía completa\\n+ biopsia"]:::proceso
    B --> C{{"¿Adenocarcinoma\\nconfirmado?"}}:::decision
    C -->|No| F["Seguimiento colonoscópico\\npolipectomía si pólipo"]:::aps
    C -->|Sí| D["TAC tórax-abd-pelvis\\nRNM pelvis si recto"]:::proceso
    D --> E["CEA + CA 19-9\\nKRAS/NRAS/BRAF\\n+ Apertura GES"]:::proceso
    E --> G["Oncología /\\nCirugía Digestiva\\n— HHM"]:::derivacion""")

# 13. CÁNCER PULMÓN
FLOWS["accbebd9-cd1a-4414-8efd-43a205591d2f"] = mblock("""
    A(["🔍 Sospecha\\nHemoptisis, tos crónica,\\nnódulo pulmonar en imagen"]):::inicio
    A --> B["TAC tórax con contraste\\n+ evaluación Lung-RADS"]:::proceso
    B --> C{{"¿Lung-RADS ≥ 3 o\\nlesión sospechosa?"}}:::decision
    C -->|No| F["Control TAC\\na 6-12 meses"]:::aps
    C -->|Sí| D["Broncoscopía / Biopsia\\nCitología esputo/pleural"]:::proceso
    D --> E{{"¿Carcinoma\\nconfirmado?"}}:::decision
    E -->|No| F
    E -->|Sí| G["Panel molecular:\\nEGFR/ALK/ROS1/PD-L1\\n+ PET-CT + GES"]:::proceso
    G --> H["Oncología /\\nBroncopulmonar\\n— HHM"]:::derivacion""")

# 14. CÁNCER PRÓSTATA
FLOWS["ad4d27ee-fcf5-4a47-8000-5bb4823970e0"] = mblock("""
    A(["🔍 Pesquisa\\nPSA elevado o tacto\\nrectal alterado"]):::inicio
    A --> B{{"¿PSA > 10 ng/mL\\no TR sospechoso?"}}:::decision
    B -->|No| F["Control anual\\nPSA + TR en APS"]:::aps
    B -->|Sí| C["Biopsia prostática\\n(guiada por RNM o eco)"]:::proceso
    C --> D{{"¿Adenocarcinoma\\nconfirmado?"}}:::decision
    D -->|No| F
    D -->|Sí| E["Gleason/ISUP\\nCintigrafía ósea si PSA>20\\nRNM pelvis"]:::proceso
    E --> G["Apertura GES\\nUrología / Oncología\\n— HHM"]:::derivacion
    G --> H["Prostatectomía /\\nRadioterapia / Hormonoterapia"]:::derivacion""")

# 15. CÁNCER OVARIO
FLOWS["cf979499-4e1d-422b-a32c-018f26bb2b93"] = mblock("""
    A(["🔍 Sospecha\\nMasa pélvica,\\nCA-125 elevado,\\ndistensión abdominal"]):::inicio
    A --> B["Ecografía transvaginal\\nScore ORADS"]:::proceso
    B --> C{{"¿ORADS ≥ 4 o\\nCA-125 elevado?"}}:::decision
    C -->|No| F["Control ecográfico\\na 3-6 meses"]:::aps
    C -->|Sí| D["TAC abdomen-pelvis\\nHE4 + índice ROMA"]:::proceso
    D --> E{{"¿Alta sospecha\\nde malignidad?"}}:::decision
    E -->|No| F
    E -->|Sí| G["Apertura GES\\nPreoperatorio\\n+ Interconsulta"]:::proceso
    G --> H["Ginecología Oncológica\\n— HHM"]:::derivacion""")

# 16. CÁNCER VESICAL
FLOWS["f3bab9dd-74e1-4820-b6c6-b34a65c87146"] = mblock("""
    A(["🔍 Sospecha\\nHematuria macroscópica\\n≥ 40 años sin ITU"]):::inicio
    A --> B["Orina completa\\nurocultivo + citología"]:::proceso
    B --> C["Ecografía renal-vesical\\nUro-TAC"]:::proceso
    C --> D{{"¿Masa vesical\\nvisualizada?"}}:::decision
    D -->|No| F["Investigar otras causas\\nnefrología/urología"]:::aps
    D -->|Sí| E["Cistoscopía + RTUP\\nbiopsia histológica"]:::proceso
    E --> G{{"¿Carcinoma\\nurotelial confirmado?"}}:::decision
    G -->|No| F
    G -->|Sí| H["Apertura GES\\nUrología / Oncología\\n— HHM"]:::derivacion""")

# 17. CÁNCER RENAL
FLOWS["0de56f1e-1904-45b4-a74e-51e9d5a0691b"] = mblock("""
    A(["🔍 Hallazgo\\nMasa renal incidental\\no hematuria macro"]):::inicio
    A --> B["TAC trifásico\\nabdomen + pelvis"]:::proceso
    B --> C{{"¿Masa renal sólida\\nBosniak ≥ III?"}}:::decision
    C -->|No| F["Control imagen\\na 6-12 meses"]:::aps
    C -->|Sí| D["TAC tórax para mets\\nLDH + función renal"]:::proceso
    D --> E{{"¿Resecable o\\nestudio completo?"}}:::decision
    E -->|Sí| G["Apertura GES\\nUrología / Oncología\\n— HHM"]:::derivacion
    E -->|No| H["Biopsia renal\\n+ estadificación completa"]:::proceso
    H --> G""")

# 18. CÁNCER TIROIDES
FLOWS["44b72db1-6886-422b-b75b-9b5d6976bed6"] = mblock("""
    A(["🔍 Hallazgo\\nNódulo tiroideo\\nen imagen o palpación"]):::inicio
    A --> B["Ecografía tiroidea\\nClasificación TIRADS"]:::proceso
    B --> C{{"¿TIRADS ≥ 4\\ny nódulo > 1 cm?"}}:::decision
    C -->|No| F["Control eco\\na 12 meses APS"]:::aps
    C -->|Sí| D["PAAF con\\ninforme Bethesda"]:::proceso
    D --> E{{"¿Bethesda\\nIV / V / VI?"}}:::decision
    E -->|No| F
    E -->|Sí| G["TAC cuello/tórax s/c\\nCalcitonina + Tg"]:::proceso
    G --> H["Apertura GES\\nEndocrinología /\\nCirugía C&C — HHM"]:::derivacion""")

# 19. LINFOMAS
FLOWS["146af38c-7db0-4fc4-a8d4-5f4033fd1b86"] = mblock("""
    A(["🔍 Sospecha\\nAdenomegalia > 1.5 cm\\n> 4 sem sin infección"]):::inicio
    A --> B["Hemograma + VHS\\nLDH + B2-microglobulina"]:::proceso
    B --> C{{"¿Síntomas B\\no masa mediastínica?"}}:::decision
    C -->|No| D["Investigar causas\\ninfecciosas / reactivas"]:::aps
    C -->|Sí| E["Biopsia ganglionar\\nIHQ + inmunofenotipo"]:::proceso
    E --> F{{"¿Linfoma\\nconfirmado?"}}:::decision
    F -->|No| D
    F -->|Sí| G["PET-CT estadificación\\n+ BOM si indicado\\n+ Apertura GES"]:::proceso
    G --> H["Hematología\\n— HHM"]:::derivacion""")

# 20. LEUCEMIA
FLOWS["b44e610d-1a6e-49fc-8518-07eca7932a49"] = mblock("""
    A(["🚨 Sospecha\\nPancitopenia, blastos\\nen hemograma, síntomas B"]):::inicio
    A --> B["Hemograma urgente\\ncon fórmula diferencial"]:::proceso
    B --> C{{"¿Blastos circulantes\\no pancitopenia severa?"}}:::decision
    C -->|No| D["Estudio diferencial\\nanemia / aplasia"]:::aps
    C -->|Sí| E["Mielograma urgente\\ninmunofenotipo + citogenética"]:::proceso
    E --> F{{"¿Leucemia\\nconfirmada?"}}:::decision
    F -->|No| D
    F -->|Sí| G["Apertura GES URGENTE\\nCoagulación + grupo Rh\\n+ serología viral"]:::alerta
    G --> H["Hematología\\n— HHM\\nHospitalización"]:::derivacion""")

# 21. MIELOMA
FLOWS["50aa8ef3-daac-415d-b028-c599240078c5"] = mblock("""
    A(["🔍 Sospecha\\nAnemia + dolor óseo\\naplastamientos vertebrales\\no hipercalcemia"]):::inicio
    A --> B["Electroforesis proteínas\\nCadenas ligeras FLC\\nhemograma + calcemia"]:::proceso
    B --> C{{"¿Pico monoclonal\\no FLC alteradas?"}}:::decision
    C -->|No| D["Estudio diferencial\\notras causas anemia"]:::aps
    C -->|Sí| E["Inmunofijación sérica/urinaria\\nMielograma + citogenética"]:::proceso
    E --> F{{"¿Mieloma múltiple\\nsintomático (CRAB)?"}}:::decision
    F -->|No| D
    F -->|Sí| G["Serie ósea + ISS\\n+ Apertura GES"]:::proceso
    G --> H["Hematología\\n— HHM"]:::derivacion""")

# 22. HEMOFILIA
FLOWS["7c0496c9-7cd2-4d08-8ae3-81a0f01c590a"] = mblock("""
    A(["🔍 Sospecha\\nSangrado desproporcionado\\nhemartrosis o antecedente familiar"]):::inicio
    A --> B["TTPK + tiempo\\nde sangría"]:::proceso
    B --> C{{"¿TTPK\\nprolongado?"}}:::decision
    C -->|No| D["Estudio coagulación\\ncompleto"]:::aps
    C -->|Sí| E["Dosificación\\nFactor VIII y IX"]:::proceso
    E --> F{{"¿Factor < 40%?"}}:::decision
    F -->|No| D
    F -->|Sí| G["Apertura GES\\nGrupo sanguíneo\\n+ serología viral"]:::proceso
    G --> H["Hematología Pediátrica (<15a)\\nHematología (≥15a)\\n— HHM"]:::derivacion
    H --> I["Profilaxis con\\nfactores de coagulación"]:::derivacion""")

# 23. CÁNCER PEDIÁTRICO
FLOWS["14e327a1-6444-4bf0-b989-e16484b7af01"] = mblock("""
    A(["🚨 Señal de alarma\\nPalidez, petequias,\\nadenomegalia, masa,\\ncefalea persistente < 15a"]):::inicio
    A --> B["Hemograma URGENTE\\nLDH + ácido úrico"]:::proceso
    B --> C{{"¿Blastos / masa /\\nanemia severa?"}}:::decision
    C -->|No| D["Reevaluar en 48-72h\\nInvestigar infección"]:::aps
    C -->|Sí| E["Ecografía / imagen\\nde área comprometida"]:::proceso
    E --> F["Derivación URGENTE\\n+ Apertura GES\\n+ Tutor informado"]:::alerta
    F --> G["Oncología Pediátrica\\n— HHM"]:::derivacion
    G --> H["Biopsia + estadificación\\n+ Protocolo oncológico"]:::derivacion""")

# 24. CUIDADOS PALIATIVOS
FLOWS["cda1e4f0-3773-4f1a-ba33-f68bde078471"] = mblock("""
    A(["📋 Criterio de ingreso\\nCáncer avanzado sin\\nopción curativa"]:::inicio)
    A --> B["Evaluación oncólogo\\nECOG + pronóstico\\nexpectativa < 12 meses"]:::proceso
    B --> C{{"¿EVA dolor ≥ 7\\no síntomas refractarios?"}}:::decision
    C -->|No| D["Manejo APS\\nescalada analgésica"]:::aps
    C -->|Sí| E["Apertura GES Paliativos\\n+ interconsulta UAPO"]:::proceso
    E --> F["Evaluación nutricional\\n+ escala Karnofsky"]:::proceso
    F --> G["UAPO / Cuidados Paliativos\\n— HHM"]:::derivacion
    G --> H["Plan de cuidados\\nOpioides + apoyo psicosocial"]:::derivacion""")

# 25. OSTEOSARCOMA
FLOWS["a0b9543b-2ba2-4d90-9933-3b63f74d62cc"] = mblock("""
    A(["🔍 Sospecha\\nDolor óseo + masa\\npersistente en joven"]):::inicio
    A --> B["Radiografía del hueso\\nFAL + LDH"]:::proceso
    B --> C{{"¿Lesión agresiva\\no masa ósea?"}}:::decision
    C -->|No| D["Control clínico\\na 4 semanas"]:::aps
    C -->|Sí| E["RNM del hueso\\ncon extensión"]:::proceso
    E --> F["TAC tórax\\nCintigrafía ósea"]:::proceso
    F --> G["Biopsia ósea\\n+ Apertura GES"]:::proceso
    G --> H["Oncología Pediátrica (<15a)\\nTraumat. Oncológica (≥15a)\\n— HHM"]:::derivacion
    H --> I["Neoadyuvancia\\n+ Cirugía"]:::derivacion""")

# 26. DM1
FLOWS["390a2aa6-4b7b-4b4f-8247-192dc6f0d202"] = mblock("""
    A(["🔍 Sospecha\\nPolidipsia, poliuria,\\nbaja de peso, cetosis"]):::inicio
    A --> B["Glicemia > 200 mg/dL\\nHbA1c + Anti-GAD"]:::proceso
    B --> C{{"¿DM1\\nconfirmada?"}}:::decision
    C -->|No| D["Reevaluar:\\nDM2 u otras causas"]:::aps
    C -->|Sí| E["Inicio insulina\\n+ Apertura GES"]:::alerta
    E --> F["HbA1c, microalbuminuria\\nfondo de ojo, monofilamento\\nperfil lipídico"]:::proceso
    F --> G{{"¿HbA1c > 8% o\\ncomplicaciones?"}}:::decision
    G -->|No| H["Control c/3 meses\\nAPS + Endocrinología"]:::aps
    G -->|Sí| I["Endocrinología Pediátrica (<15a)\\nEndocrinología (≥15a)\\n— HHM"]:::derivacion""")

# 27. DM2
FLOWS["696ea74c245ef362de4f4339"] = mblock("""
    A(["📋 Pesquisa\\nGlicemia en ayunas\\ncontrol rutina APS"]):::inicio
    A --> B{{"¿Glicemia ≥ 126 mg/dL\\no HbA1c ≥ 6.5%?"}}:::decision
    B -->|No| F["Prevención:\\nDieta + ejercicio\\ncontrol anual"]:::aps
    B -->|Sí| C["Diagnóstico DM2\\nApertura GES\\n+ Metformina"]:::proceso
    C --> D["Control c/3 meses:\\nHbA1c + PA + perfil lipídico\\n+ microalbuminuria"]:::proceso
    D --> E{{"¿HbA1c > 8% con\\n2 hipoglicemiantes?"}}:::decision
    E -->|No| F2["Ajuste APS\\n+ refuerzo HV"]:::aps
    E -->|Sí| G["Intensificación:\\n+ insulina o fármaco 3°\\nEndocrinología HHM"]:::derivacion
    F2 --> D""")

# 28. HIPOTIROIDISMO
FLOWS["696efcff77924d3a78533dce"] = mblock("""
    A(["📋 Pesquisa\\nTSH en control rutina\\no síntomas hipotiroidismo"]):::inicio
    A --> B{{"¿TSH > 4.5 mUI/L?"}}:::decision
    B -->|No| F["TSH normal\\nControl anual"]:::aps
    B -->|Sí| C["T4 libre + Anti-TPO\\nEcografía tiroidea"]:::proceso
    C --> D{{"¿TSH > 10 o\\nT4L baja?"}}:::decision
    D -->|No| G["Hipotiroidismo subclínico\\nControl c/6 meses"]:::aps
    D -->|Sí| E["Inicio Levotiroxina\\n+ Apertura GES"]:::proceso
    E --> H{{"¿Control difícil\\no embarazada?"}}:::decision
    H -->|No| I["Control APS\\nTSH c/3 meses"]:::aps
    H -->|Sí| J["Endocrinología\\n— HHM"]:::derivacion""")

# 29. RETINOPATÍA DIABÉTICA
FLOWS["696ea74c245ef362de4f4337"] = mblock("""
    A(["📋 Screening anual\\nFondo de ojo en\\ndiabético conocido"]):::inicio
    A --> B["Fondo de ojo dilatado\\no retinografía no midriática"]:::proceso
    B --> C{{"¿Retinopatía\\ndetectada?"}}:::decision
    C -->|No| F["Control anual\\nOptimizar HbA1c + PA"]:::aps
    C -->|Sí| D["Clasificar severidad:\\nNPDR leve / mod / sev\\nRDP / EMD"]:::proceso
    D --> E{{"¿RDP o EMD\\nclinicamente sig.?"}}:::decision
    E -->|No| G["Control oftalmológico\\nc/6 meses"]:::aps
    E -->|Sí| H["Apertura GES\\nOCT macular\\nUrgencia retina"]:::proceso
    H --> I["Oftalmología\\n— HHM\\nFotocoagulación / anti-VEGF"]:::derivacion""")

# 30. ACV
FLOWS["696efcff77924d3a78533dd5"] = mblock("""
    A(["🚨 Código ACV\\nDeficit neurológico focal\\nde inicio súbito"]):::inicio
    A --> B["NIHSS + hora de inicio\\nGlicemia + PA + ECG"]:::proceso
    B --> C["TC encéfalo urgente\\nsin contraste"]:::proceso
    C --> D{{"¿Isquémico y\\n< 4.5h de inicio?"}}:::decision
    D -->|Sí| E["Trombolisis IV\\n(si criterios)\\nTraslado a HHM"]:::alerta
    D -->|No| F["Manejo AVC-U\\nAntiagregación\\n± trombolisis si <24h"]:::proceso
    E --> G["Neurología\\n— HHM\\nUnidad ACV"]:::derivacion
    F --> G
    G --> H["Prevención 2°:\\nHolter + eco cardíaca\\nDoppler carotídeo"]:::derivacion""")

# 31. EPILEPSIA INFANTIL
FLOWS["105de3f0-3055-4cb4-a124-f4b46bcfb945"] = mblock("""
    A(["🔍 Sospecha\\nCrisis convulsiva\\nen niño 1-14 años"]):::inicio
    A --> B["Evaluación médica\\nDescartar causa provocada\\n(fiebre, electrolitos, hipoglicemia)"]:::proceso
    B --> C{{"¿≥ 2 crisis no\\nprovocadas?"}}:::decision
    C -->|No| F["1° crisis: EEG + RNM\\nControl neurología"]:::aps
    C -->|Sí| D["EEG vigilia/sueño\\nRNM encéfalo protocolo epilepsia"]:::proceso
    D --> E{{"¿EEG anormal o\\nsíndrome epiléptico?"}}:::decision
    E -->|No| G["Control pediátrico\\nc/3 meses"]:::aps
    E -->|Sí| H["Inicio antiepiléptico\\n+ Apertura GES"]:::proceso
    H --> I["Neuropediatría\\n— HHM"]:::derivacion""")

# 32. EPILEPSIA ADULTO
FLOWS["3a6e79f1-9214-48f7-acdf-5b740de89486"] = mblock("""
    A(["🔍 Sospecha\\nCrisis epiléptica\\nadulto ≥ 15 años"]):::inicio
    A --> B["EEG + RNM encéfalo\\n(protocolo epilepsia)"]:::proceso
    B --> C{{"¿EEG anormal o\\n≥ 2 crisis?"}}:::decision
    C -->|No| F["Control neurológico\\n1° crisis aislada"]:::aps
    C -->|Sí| D["Inicio antiepiléptico\\n+ Apertura GES"]:::proceso
    D --> E{{"¿Refractaria a\\n2 FAE en dosis óptimas?"}}:::decision
    E -->|No| G["Control APS /\\nNeurología c/6 meses"]:::aps
    E -->|Sí| H["Evaluación cirugía epilepsia\\nNeurología — HHM"]:::derivacion
    H --> I["Video-EEG +\\nRNM 3T + SPECT"]:::derivacion""")

# 33. PARKINSON
FLOWS["32cec82e-412a-4d75-89fc-f0f6e3bc252d"] = mblock("""
    A(["🔍 Sospecha\\nTemblor en reposo,\\nbradiquinesia, rigidez"]):::inicio
    A --> B["Evaluación clínica\\nCriterios MDS-UPDRS"]:::proceso
    B --> C{{"¿Parkinsonismo\\ncumple criterios?"}}:::decision
    C -->|No| D["Estudio diferencial\\ntremor esencial / iatrogénico"]:::aps
    C -->|Sí| E["RNM encéfalo\\n(descartar secundario)"]:::proceso
    E --> F["Inicio Levodopa\\n+ Apertura GES"]:::proceso
    F --> G{{"¿Fluctuaciones\\nmotor o discinesias?"}}:::decision
    G -->|No| H["Control c/6 meses\\nAjuste dopaminérgico"]:::aps
    G -->|Sí| I["Neurología\\n— HHM\\nEvaluación DBS"]:::derivacion""")

# 34. ESCLEROSIS MÚLTIPLE
FLOWS["ef881e41-0fd1-47c9-aab9-0d0292a2a485"] = mblock("""
    A(["🔍 Sospecha\\nNeuritis óptica, parestesias,\\ndebilidad episódica"]):::inicio
    A --> B["RNM encéfalo y médula\\ncon gadolinio (protocolo EM)"]:::proceso
    B --> C{{"¿Lesiones desmielinizantes\\ncumplen criterios McDonald?"}}:::decision
    C -->|No| F["Vigilancia:\\ncontrol neurológico"]:::aps
    C -->|Sí| D["PEV + LCR\\n(bandas oligoclonales)\\n+ EDSS"]:::proceso
    D --> E["Apertura GES\\n+ inicio TME"]:::proceso
    E --> G{{"¿Brote activo o\\nEDSS empeora?"}}:::decision
    G -->|No| H["Control c/6 meses\\nRNM anual"]:::aps
    G -->|Sí| I["Cambio TME o\\nescalada terapéutica\\nNeurología — HHM"]:::derivacion""")

# 35. ALZHEIMER
FLOWS["696ea74c245ef362de4f4338"] = mblock("""
    A(["🔍 Sospecha\\nFamiliar reporta pérdida\\nmemoria funcional"]:::inicio)
    A --> B["MMSE o MoCA\\n+ CDR"]:::proceso
    B --> C{{"¿MMSE < 24 o\\nMoCA < 25?"}}:::decision
    C -->|No| F["Control APS\\nc/6-12 meses"]:::aps
    C -->|Sí| D["RNM encéfalo\\nTSH + B12 + folato"]:::proceso
    D --> E{{"¿Causa tratable\\ndescartada?"}}:::decision
    E -->|No| G["Tratar causa específica"]:::aps
    E -->|Sí| H["Diagnóstico Alzheimer\\nApertura GES"]:::proceso
    H --> I["Neurología / Geriatría\\n— HHM\\nInhibidor colinesterasa"]:::derivacion""")

# 36. TUMORES SNC
FLOWS["0e3b7497-b79c-470a-a320-e2f542568c29"] = mblock("""
    A(["🚨 Sospecha\\nCrisis convulsiva nueva,\\ndeficit focal o HTE"]):::inicio
    A --> B["TC encéfalo urgente\\ncon contraste"]:::proceso
    B --> C{{"¿Masa intracraneal\\ncon captación?"}}:::decision
    C -->|No| F["Estudio diferencial\\nACV / infección"]:::aps
    C -->|Sí| D["RNM encéfalo\\ncon gadolinio\\n(protocolo tumoral)"]:::proceso
    D --> E["Karnofsky + corticoides\\nsi efecto de masa\\n+ Apertura GES"]:::proceso
    E --> G["Neurocirugía / Oncología\\n— HHM"]:::derivacion
    G --> H["Biopsia ± cirugía\\nRadioterapia ± QT"]:::derivacion""")

# 37. ESQUIZOFRENIA
FLOWS["ec705134-c8cf-4c83-86f3-7dce68dcf20a"] = mblock("""
    A(["🔍 Sospecha\\n1° episodio psicótico:\\nalucinaciones, delirios,\\ndesorganización"]):::inicio
    A --> B["Evaluación psiquiátrica\\n+ screening drogas"]:::proceso
    B --> C{{"¿Psicosis > 6 meses\\no síndrome completo?"}}:::decision
    C -->|No| D["Control psiquiátrico\\nmensual + observación"]:::aps
    C -->|Sí| E["TSH + hemograma\\nGlicemia + perfil lipídico"]:::proceso
    E --> F["Apertura GES\\nInicio antipsicótico"]:::proceso
    F --> G{{"¿Resistente a\\n2 antipsicóticos?"}}:::decision
    G -->|No| H["Control mensual\\nPsiquiatría APS / COSAM"]:::aps
    G -->|Sí| I["Psiquiatría — HHM\\nCLOZAPINA"]:::derivacion""")

# 38. DEPRESIÓN
FLOWS["696efcff77924d3a78533dca"] = mblock("""
    A(["📋 Pesquisa\\nPHQ-2 alterado en\\ncontrol o consulta espontánea"]):::inicio
    A --> B["PHQ-9 completo\\n+ evaluación riesgo suicida"]:::proceso
    B --> C{{"¿PHQ-9 ≥ 10\\n(mod-severo)?"}}:::decision
    C -->|No| F["PHQ-9 < 10:\\nApoyo breve APS\\ncontrol 4 sem"]:::aps
    C -->|Sí| D["Inicio antidepresivo\\n+ psicoeducación\\n+ Apertura GES"]:::proceso
    D --> E{{"¿Riesgo suicida\\nactivo?"}}:::decision
    E -->|Sí| G["Derivación URGENTE\\nPsiquiatría — HHM"]:::alerta
    E -->|No| H{{"¿Respuesta a\\n2 antidepresivos?"}}:::decision
    H -->|Sí| I["Alta / mantención\\nc/3 meses APS"]:::aps
    H -->|No| J["Psiquiatría — HHM\\nDepresión refractaria"]:::derivacion""")

# 39. TRASTORNO BIPOLAR
FLOWS["e816b3ce-91f8-4659-8586-a7c551125239"] = mblock("""
    A(["🔍 Sospecha\\nEpisodio maníaco /\\nhipomaníaco o depresión\\ncon historia de manía"]):::inicio
    A --> B["Evaluación psiquiátrica\\nYMRS + historia clínica"]:::proceso
    B --> C{{"¿Criterios TB\\nI o II cumplidos?"}}:::decision
    C -->|No| D["Descartar causa orgánica\\nTSH + EEG"]:::aps
    C -->|Sí| E["Inicio estabilizador\\n(Li, VPA, LTG)\\n+ Apertura GES"]:::proceso
    E --> F["Litemia c/3 meses\\nFunción renal + tiroidea"]:::proceso
    F --> G{{"¿Episodio agudo\\no refractario?"}}:::decision
    G -->|No| H["Control c/3 meses\\nPsiquiatría APS"]:::aps
    G -->|Sí| I["Psiquiatría — HHM"]:::derivacion""")

# 40. ALCOHOL/DROGAS <20
FLOWS["dd0b1b9f-0848-48ab-9e9f-82aaef29e772"] = mblock("""
    A(["📋 Pesquisa\\nAUDIT-C o CRAFFT\\nen control adolescente"]):::inicio
    A --> B{{"¿AUDIT-C ≥ 3 (H)\\no ≥ 2 (M)?"}}:::decision
    B -->|No| F["Consejería breve\\ncontrol anual"]:::aps
    B -->|Sí| C["AUDIT completo\\n+ screening toxicológico"]:::proceso
    C --> D{{"¿Dependencia o\\nconsumo perjudicial?"}}:::decision
    D -->|No| G["Intervención breve\\ncontrol c/3 meses"]:::aps
    D -->|Sí| E["Apertura GES\\nEvaluación psiquiátrica\\n+ GGT, hemograma"]:::proceso
    E --> H["Psiquiatría /\\nCOSAM — HHM\\no SENDA"]:::derivacion""")

# 41. EPOC
FLOWS["696efcff77924d3a78533dcc"] = mblock("""
    A(["📋 Sospecha\\nTabaquismo + disnea\\n+ tos crónica > 40 años"]):::inicio
    A --> B["Espirometría\\npost-broncodilatador"]:::proceso
    B --> C{{"¿VEF1/CVF < 0.70\\npost-BD?"}}:::decision
    C -->|No| F["EPOC descartado\\nOtra causa a investigar"]:::aps
    C -->|Sí| D["Clasificar GOLD\\nCAT + mMRC\\nRxTórax"]:::proceso
    D --> E{{"¿GOLD II-IV o\\n≥ 2 exacerb/año?"}}:::decision
    E -->|No| G["SABA/LAMA APS\\nantitabaco"]:::aps
    E -->|Sí| H["Apertura GES\\nSaO2 + gasometría\\n+ Interconsulta"]:::proceso
    H --> I["Broncopulmonar\\n— HHM"]:::derivacion""")

# 42. ASMA PEDIÁTRICO
FLOWS["696efcff77924d3a78533dcb"] = mblock("""
    A(["🔍 Sospecha\\nSibilancias recurrentes,\\ntos nocturna < 15 años"]):::inicio
    A --> B["Test de respuesta\\na SABA + espirometría (≥5a)"]:::proceso
    B --> C{{"¿Reversibilidad\\no variabilidad PEF?"}}:::decision
    C -->|No| F["Diagnóstico diferencial\\notras causas respiratorias"]:::aps
    C -->|Sí| D["Clasificar severidad\\nGINA pediátrico"]:::proceso
    D --> E{{"¿Asma moderada\\no severa no controlada?"}}:::decision
    E -->|No| G["CSI bajo/med\\ncontrol APS c/3m"]:::aps
    E -->|Sí| H["c-ACT + Apertura GES\\n+ ICS alto + LABA"]:::proceso
    H --> I["Broncopulmonar Pediátrico\\n— HHM"]:::derivacion""")

# 43. ASMA ADULTO
FLOWS["497a8ff3-6423-4261-b832-21f370f9cec9"] = mblock("""
    A(["🔍 Sospecha\\nDisnea + sibilancias\\nepisódicas > 15 años"]):::inicio
    A --> B["Espirometría + test\\nbroncodilatador"]:::proceso
    B --> C{{"¿Reversibilidad\\n> 12% y 200 mL?"}}:::decision
    C -->|No| F["Provocación bronquial\\nsi sospecha alta"]:::aps
    C -->|Sí| D["ACT + clasificación GINA\\ninicio CSI"]:::proceso
    D --> E{{"¿ACT < 20 con\\nCSI altas dosis + LABA?"}}:::decision
    E -->|No| G["Control APS c/3m\\najuste tratamiento"]:::aps
    E -->|Sí| H["Apertura GES\\nEosinófilos + IgE\\nAlergia"]:::proceso
    H --> I["Broncopulmonar\\n— HHM"]:::derivacion""")

# 44. FIBROSIS QUÍSTICA
FLOWS["734b76cc-c348-4156-b6a4-044b22f72476"] = mblock("""
    A(["🔍 Sospecha\\nScreening neonatal +\\ninfecciones recurrentes\\no malabsorción"]):::inicio
    A --> B["Test del sudor\\n(Cl > 60 mEq/L)"]:::proceso
    B --> C{{"¿Test del sudor\\npositivo?"}}:::decision
    C -->|No| D["Estudio genético CFTR\\nsi sospecha alta"]:::aps
    C -->|Sí| E["Espirometría + cultivo\\nesputo + estado nutricional\\n+ vitaminas liposolubles"]:::proceso
    E --> F["Apertura GES\\n+ Enzimas pancreáticas\\n+ Fisioterapia respiratoria"]:::proceso
    F --> G["Broncopulmonar Pediátrico (<15a)\\nBroncopulmonar (≥15a)\\n— HHM"]:::derivacion
    G --> H["Programa FQ\\nMultidisciplinario"]:::derivacion""")

# 45. REHAB COVID
FLOWS["5a93339d-f5e8-499a-896a-edee30086b1c"] = mblock("""
    A(["📋 Post-COVID\\nSíntomas > 12 semanas\\ntras episodio confirmado"]):::inicio
    A --> B["mMRC + SaO2 basal\\ny con esfuerzo"]:::proceso
    B --> C{{"¿Disnea mMRC ≥ 2\\no SaO2 < 94% esfuerzo?"}}:::decision
    C -->|No| F["Seguimiento APS\\nconsejería actividad física"]:::aps
    C -->|Sí| D["Espirometría\\nTAC tórax post-COVID\\nTest marcha 6 min"]:::proceso
    D --> E["Apertura GES\\n+ Interconsulta"]:::proceso
    E --> G["Medicina Física y\\nRehabilitación /\\nBroncopulmonar — HHM"]:::derivacion
    G --> H["Programa rehabilitación\\npulmonar + cognitivo"]:::derivacion""")

# 46. ESCOLIOSIS
FLOWS["0d625400-8943-465b-a784-5ba7257ee429"] = mblock("""
    A(["🔍 Detección\\nExamen físico escolar\\no asimetría de hombros"]):::inicio
    A --> B["Radiografía columna total\\nAP + lateral de pie"]:::proceso
    B --> C["Medición Cobb\\n+ Risser (madurez ósea)"]:::proceso
    C --> D{{"¿Cobb ≥ 25° con\\npotencial crecimiento?"}}:::decision
    D -->|No| F["Control c/6 meses\\nRx seriada"]:::aps
    D -->|Sí| E{{"¿Cobb ≥ 45° torácica\\no ≥ 40° lumbar?"}}:::decision
    E -->|No| G["Corsé ortopédico\\ncontrol trimestral"]:::aps
    E -->|Sí| H["Apertura GES\\nEvaluación quirúrgica\\n+ Función pulmonar"]:::proceso
    H --> I["Traumatología /\\nCirugía de Columna\\n— HHM"]:::derivacion""")

# 47. ENDOPRÓTESIS CADERA
FLOWS["16fa6559-f50b-4c99-89f7-33b1e82e6183"] = mblock("""
    A(["🔍 Motivo de consulta\\nDolor cadera severo\\ny limitación funcional ≥ 65a"]):::inicio
    A --> B["Radiografía pelvis AP\\n+ axial cadera"]:::proceso
    B --> C["Kellgren-Lawrence IV\\nLequesne ≥ 10"]:::proceso
    C --> D{{"¿Fracaso tratamiento\\nconservador > 6 meses?"}}:::decision
    D -->|No| E["Kinesioterapia\\n+ AINE + infiltración"]:::aps
    D -->|Sí| F["Apertura GES\\nEvaluación preoperatoria:\\nHemo + coag + ECG + Eco"]:::proceso
    F --> G["Traumatología\\n— HHM"]:::derivacion
    G --> H["Endoprótesis total\\nde cadera"]:::derivacion""")

# 48. ARTROSIS
FLOWS["696efcff77924d3a78533dcd"] = mblock("""
    A(["📋 Consulta\\nDolor articular crónico\\ncadera/rodilla ≥ 55 años"]):::inicio
    A --> B["Rx cadera/rodilla\\nKellgren-Lawrence"]:::proceso
    B --> C["EVA + WOMAC\\ngoniometría"]:::proceso
    C --> D{{"¿Grado K-L ≥ II y\\nEVA > 5?"}}:::decision
    D -->|No| F["Medidas HV\\npérdida de peso"]:::aps
    D -->|Sí| E["Apertura GES\\nKinesioterapia\\n+ AINE / paracetamol"]:::proceso
    E --> G{{"¿Fracaso de tratamiento\\na 6 meses?"}}:::decision
    G -->|No| H["Mantención tratamiento\\ncontrol c/6 meses"]:::aps
    G -->|Sí| I["Traumatología /\\nReumatología — HHM\\nInfiltración / Cirugía"]:::derivacion""")

# 49. HNP LUMBAR
FLOWS["aa072279-9dbe-4704-b0aa-099292715a51"] = mblock("""
    A(["🔍 Consulta\\nLumbalgia + ciática\\nradiculopatía L4-S1"]):::inicio
    A --> B["Examen neurológico\\nLasègue + fuerza muscular\\n+ reflejos"]:::proceso
    B --> C{{"¿Síndrome cauda\\nequina?"}}:::decision
    C -->|Sí| D["URGENCIA: RNM\\nNeurocirugía — HHM"]:::alerta
    C -->|No| E["Tratamiento conservador\\n6 semanas:\\nKinesioterapia + analgesia"]:::aps
    E --> F{{"¿Mejoría < 50%\\na las 6 semanas?"}}:::decision
    F -->|No| G["Continuar tratamiento\\ncontrol al mes"]:::aps
    F -->|Sí| H["RNM columna lumbar\\n+ ODI + EVA"]:::proceso
    H --> I["Apertura GES\\nNeurocirugía /\\nCirugía Columna — HHM"]:::derivacion""")

# 50. COLECISTECTOMÍA
FLOWS["696efcff77924d3a78533dcf"] = mblock("""
    A(["🔍 Pesquisa\\nCálculos biliares en eco\\no cólico biliar 35-49 años"]):::inicio
    A --> B["Ecografía abdominal\\ncaracterizar vesícula\\ny cálculos"]:::proceso
    B --> C{{"¿Edad 35-49 años\\ncon litiasis confirmada?"}}:::decision
    C -->|No| F["Manejo expectante\\ncontrol anual"]:::aps
    C -->|Sí| D["Evaluación síntomas\\n+ función hepática"]:::proceso
    D --> E{{"¿Pólipo ≥ 10mm\\no cólico biliar?"}}:::decision
    E -->|No| G["Apertura GES asintomático\\nInterconsulta electiva"]:::proceso
    E -->|Sí| H["Apertura GES sintomático\\nEvaluación preoperatoria"]:::proceso
    G --> I["Cirugía General\\n— HHM"]:::derivacion
    H --> I""")

# 51. FISURA LABIOPALATINA
FLOWS["40389e49-9062-4fe4-830c-6fc7ff69bccf"] = mblock("""
    A(["🔍 Diagnóstico\\nFisura labial/palatina\\nen RN o prenatal"]:::inicio)
    A --> B["Fotografía clínica\\nClasificación Veau\\nEvaluación alimentación"]:::proceso
    B --> C["Eco cardíaca\\nEvaluación genética\\nsi síndrome asociado"]:::proceso
    C --> D["Apertura GES\\nEquipo multidisciplinario\\nFamilia informada"]:::proceso
    D --> E["Cirugía Plástica /\\nMaxilofacial — HHM"]:::derivacion
    E --> F["Queiloplastia (~3 meses)\\nVelofaringoplastia (~12 meses)\\nFonoaudiología + ortodoncia"]:::derivacion""")

# 52. DISPLASIA CADERA
FLOWS["077e850d-cded-4863-aa08-113e7d59aab0"] = mblock("""
    A(["📋 Screening neonatal\\nExamen físico RN:\\nOrtolani / Barlow"]):::inicio
    A --> B{{"¿Signo positivo\\no asimetría pliegues?"}}:::decision
    B -->|No| F["Control pediátrico\\nrutina"]:::aps
    B -->|Sí| C["Ecografía caderas\\nClasificación Graf\\n(< 4-6 meses)"]:::proceso
    C --> D{{"¿Graf tipo IIb\\no superior?"}}:::decision
    D -->|No| G["Graf IIa: control\\neco 4-6 semanas"]:::aps
    D -->|Sí| E["Apertura GES\\nArrés de Pavlik"]:::proceso
    E --> H["Traumatología Infantil\\n— HHM"]:::derivacion
    H --> I["Control eco seriado\\nhasta normalización"]:::derivacion""")

# 53. CATARATAS
FLOWS["696efcff77924d3a78533dd0"] = mblock("""
    A(["🔍 Detección\\nBaja AV o sospecha\\ncatarata congénita"]):::inicio
    A --> B["Agudeza visual con\\nmejor corrección (MAVC)"]:::proceso
    B --> C["Lámpara de hendidura\\nPIO + fondo de ojo"]:::proceso
    C --> D{{"¿AV ≤ 0.3 o\\ncatarata congénita?"}}:::decision
    D -->|No| F["Control oftalmológico\\nanual"]:::aps
    D -->|Sí| E["Biometría ocular\\nRecuento endotelial\\nApertura GES"]:::proceso
    E --> G["Oftalmología Pediátrica (<15a)\\nOftalmología (≥15a)\\n— HHM"]:::derivacion
    G --> H["Facoemulsificación\\n+ LIO"]:::derivacion""")

# 54. VICIOS DE REFRACCIÓN
FLOWS["d4d5f0b5-c80f-47d0-87a2-2b821d6643ac"] = mblock("""
    A(["📋 Pesquisa\\nControl adulto mayor ≥ 65a\\nDificultad visual"]):::inicio
    A --> B["AV sin corrección\\n(Snellen / E de Illiteracy)"]:::proceso
    B --> C{{"¿AV s/c ≤ 0.5?"}}:::decision
    C -->|No| F["Control visual\\nc/2 años"]:::aps
    C -->|Sí| D["Refracción objetiva\\n(autorefractómetro)\\n+ subjetiva"]:::proceso
    D --> E["Biomicroscopía\\n+ PIO + fondo de ojo"]:::proceso
    E --> G["Apertura GES\\nOftalmología — HHM\\nPrescripción lentes"]:::derivacion""")

# 55. ESTRABISMO
FLOWS["621eace6-3e44-48ff-b43a-12ab248095a9"] = mblock("""
    A(["🔍 Detección\\nDesviación ocular en\\nniño < 9 años"]):::inicio
    A --> B["AV monocular\\nReflejo corneal Hirschberg"]:::proceso
    B --> C{{"¿Cover test\\npositivo?"}}:::decision
    C -->|No| F["Pseudoestrabismo:\\ncontrol pediátrico"]:::aps
    C -->|Sí| D["Refracción bajo\\ncicloplejia"]:::proceso
    D --> E{{"¿Ambliopía asociada?"}}:::decision
    E -->|Sí| G["Oclusión + corrección\\nóptica + Apertura GES"]:::proceso
    E -->|No| G
    G --> H["Oftalmología Pediátrica\\n— HHM"]:::derivacion
    H --> I["Cirugía ocular\\nsi indicado"]:::derivacion""")

# 56. DESPRENDIMIENTO RETINA
FLOWS["2b610547-f2bd-43c5-87ad-e6efc78d1e62"] = mblock("""
    A(["🚨 URGENCIA\\nFotopsias / miodesopsias\\nnuevas o pérdida campo visual"]):::inicio
    A --> B["AV actual\\nFondo de ojo dilatado\\nURGENTE"]:::proceso
    B --> C{{"¿Desgarro / DR\\nconfirmado?"}}:::decision
    C -->|No| D["Miodesopsias benignas:\\ncontrol en 2 semanas"]:::aps
    C -->|Sí| E{{"¿DR total o\\ncompromiso mácula?"}}:::decision
    E -->|Sí| F["URGENCIA máxima\\nTraslado inmediato\\nHHM — Oftalmología"]:::alerta
    E -->|No| G["Urgencia 24-48h\\nApertura GES\\nHHM — Oftalmología"]:::proceso
    F --> H["Vitrectomía /\\nIndentación escleral"]:::derivacion
    G --> H""")

# 57. HIPOACUSIA ADULTO
FLOWS["23e4223d-7d08-4c8f-8cce-34840f8d0fca"] = mblock("""
    A(["📋 Pesquisa\\nDificultad auditiva\\nadulto ≥ 65 años"]):::inicio
    A --> B["Otoscopía\\nDescartar: tapón, OMA,\\nperforación tratable"]:::proceso
    B --> C{{"¿Causa tratable\\nidentificada?"}}:::decision
    C -->|Sí| F["Tratamiento médico\\ncontrol 30 días"]:::aps
    C -->|No| D["Audiometría tonal\\nliminal + impedanciometría"]:::proceso
    D --> E{{"¿Pérdida ≥ 40 dB\\nen mejor oído?"}}:::decision
    E -->|No| G["Control auditivo\\nc/12 meses"]:::aps
    E -->|Sí| H["Apertura GES\\nORL — HHM\\nIndicación audífono"]:::derivacion""")

# 58. HIPOACUSIA PEDIÁTRICO
FLOWS["1f8b7f23-acd8-4758-a8f6-cee6d23b9537"] = mblock("""
    A(["📋 Screening neonatal\\nOAE alteradas en RN\\nPEAT si no pasa OAE"]):::inicio
    A --> B{{"¿PEAT > 30 dB\\nen mejor oído?"}}:::decision
    B -->|No| F["Hipoacusia descartada\\ncontrol del lenguaje"]:::aps
    B -->|Sí| C["Confirmar con PEAT\\ndiagnóstico a los 3 meses"]:::proceso
    C --> D["Serología TORCH\\nGenética (Cx26/GJB2)"]:::proceso
    D --> E{{"¿Hipoacusia ≥ 40 dB\\nprofunda bilateral?"}}:::decision
    E -->|No| G["Amplificación auditiva\\ncontrol c/6 meses"]:::aps
    E -->|Sí| H["Apertura GES\\nORL Pediátrico — HHM\\nEvaluar implante coclear"]:::derivacion""")

# 59. ARTRITIS REUMATOIDEA
FLOWS["adfbd7d1-2956-466b-add3-facdd6ef3f01"] = mblock("""
    A(["🔍 Sospecha\\nPoliartritis simétrica\\nrigidez matutina > 1 hora"]):::inicio
    A --> B["FR + Anti-CCP\\nVHS + PCR"]:::proceso
    B --> C{{"¿Anti-CCP o FR\\npositivos + artritis?"}}:::decision
    C -->|No| D["Derivar reumatología\\npara estudio diferencial"]:::aps
    C -->|Sí| E["Rx manos-pies AP\\nScore DAS28"]:::proceso
    E --> F{{"¿DAS28 > 3.2\\nmoderado-severo?"}}:::decision
    F -->|No| G["MTX + APS\\ncontrol c/3 meses"]:::aps
    F -->|Sí| H["Apertura GES\\n+ serología para biológicos\\nReumatología — HHM"]:::derivacion
    H --> I["DMARD combinado\\no biológico (anti-TNF)"]:::derivacion""")

# 60. ARTRITIS JUVENIL
FLOWS["403033ae-7f8d-4d50-842c-22df45a881eb"] = mblock("""
    A(["🔍 Sospecha\\nArtritis > 6 semanas\\nen < 16 años"]:::inicio)
    A --> B["ANA + FR + Anti-CCP\\nVHS + PCR + hemograma"]:::proceso
    B --> C["Fondo de ojo en lámpara\\nde hendidura\\n(uveítis subclínica)"]:::proceso
    C --> D{{"¿Criterios AIJ\\ncumplidos?"}}:::decision
    D -->|No| E["Estudio diferencial\\ninfeccioso / maligno"]:::aps
    D -->|Sí| F["Apertura GES\\nClasificar: oligo/poli/sistémica"]:::proceso
    F --> G["Reumatología Pediátrica\\n— HHM"]:::derivacion
    G --> H["MTX ± AINE\\ncontrol oftalmológico\\ntrimestral"]:::derivacion""")

# 61. LUPUS
FLOWS["92f86d68-fcb0-408c-8236-3e93c9ad00bc"] = mblock("""
    A(["🔍 Sospecha\\nArtritis + fotosensibilidad +\\ncompromiso renal o hematológico"]):::inicio
    A --> B["ANA (título y patrón)\\nAnti-dsDNA + C3/C4"]:::proceso
    B --> C{{"¿ANA + ≥ 4 criterios\\nSLICC 2012?"}}:::decision
    C -->|No| D["Vigilancia:\\ncontrol c/6 meses"]:::aps
    C -->|Sí| E["Orina + proteinuria 24h\\nhemograma + creatinina\\nAnti-fosfolípidos"]:::proceso
    E --> F{{"¿Nefritis lúpica\\no compromiso grave?"}}:::decision
    F -->|No| G["HCQ + APS\\ncontrol c/3 meses"]:::aps
    F -->|Sí| H["Apertura GES\\nReumatología (≥15a)\\nReumatol. Pediátrica (<15a)\\n— HHM"]:::derivacion
    H --> I["Biopsia renal\\n+ inmunosupresor"]:::derivacion""")

# 62. HELICOBACTER
FLOWS["ad54ffbe-d515-4619-a151-eb3c8b444423"] = mblock("""
    A(["🔍 Indicación de test\\nÚlcera péptica confirmada\\no familiar 1° cáncer gástrico"]):::inicio
    A --> B["Test de urea en aliento\\n(sin IBP 14 días previos)\\no Ag en deposición"]:::proceso
    B --> C{{"¿H. pylori\\npositivo?"}}:::decision
    C -->|No| F["H. pylori negativo:\\nmanejo sintomático APS"]:::aps
    C -->|Sí| D["Terapia erradicación:\\nAmoxicilina + Claritromicina\\n+ IBP x 14 días"]:::proceso
    D --> E["Test de control\\n4-6 semanas post-tratamiento"]:::proceso
    E --> G{{"¿Erradicación\\nconfirmada?"}}:::decision
    G -->|Sí| H["Alta con control\\nendoscópico si úlcera gástrica"]:::aps
    G -->|No| I["2° línea: Bismuto\\nGastroenterología — HHM"]:::derivacion""")

# 63. HEPATITIS B
FLOWS["4da81a6d-68b3-4223-b78e-0d4eae135371"] = mblock("""
    A(["📋 Pesquisa\\nHBsAg en control\\nrutina o factores de riesgo"]):::inicio
    A --> B{{"¿HBsAg positivo\\n> 6 meses?"}}:::decision
    B -->|No| F["HB aguda o falso +\\nVacunar si susceptible"]:::aps
    B -->|Sí| C["HBV-DNA cuantitativo\\nHBeAg/Anti-HBe\\nTransaminasas + AFP"]:::proceso
    C --> D["Ecografía abdominal\\nFIB-4 o Fibroscan"]:::proceso
    D --> E{{"¿HBV-DNA > 2000 UI/mL\\no fibrosis ≥ F2?"}}:::decision
    E -->|No| G["Vigilancia semestral:\\nTransaminasas + AFP\\nEcografía"]:::aps
    E -->|Sí| H["Apertura GES\\nGastroenterología /\\nHepatología — HHM\\nTenofovir o Entecavir"]:::derivacion""")

# 64. HEPATITIS C
FLOWS["67174ceb-c58d-40a4-b517-5fe0c224944b"] = mblock("""
    A(["📋 Pesquisa\\nAnti-VHC en control\\nrutina o factores de riesgo"]):::inicio
    A --> B{{"¿Anti-VHC\\npositivo?"}}:::decision
    B -->|No| F["Control anual\\nsi factores de riesgo"]:::aps
    B -->|Sí| C["VHC-RNA cuantitativo\\nGenotipo VHC"]:::proceso
    C --> D{{"¿VHC-RNA\\ndetectable?"}}:::decision
    D -->|No| G["Infección resuelta\\ncontrol serológico"]:::aps
    D -->|Sí| E["Fibroscan o FIB-4\\nEcografía + AFP"]:::proceso
    E --> F["Apertura GES\\nGastroenterología /\\nHepatología — HHM"]:::derivacion
    F --> H["Antivirales Acción Directa\\nAAD (Sofosbuvir/Ledipasvir)\\nRVS ≥ 95%"]:::derivacion""")

# 65. CIRROSIS
FLOWS["b53e5123-b5ba-445c-aa84-d9a25d45d0ea"] = mblock("""
    A(["🔍 Sospecha\\nHepatomegalia, esplenomegalia,\\ntrombocitopenia, ascitis"]):::inicio
    A --> B["Función hepática: ALT, AST,\\nBilirrubina, TP-INR, Albúmina"]:::proceso
    B --> C["Ecografía Doppler portal\\nFibroscan / FIB-4"]:::proceso
    C --> D{{"¿Fibrosis F4 o\\ncirrosis establecida?"}}:::decision
    D -->|No| E["Manejo etiología\\ncontrol c/6 meses"]:::aps
    D -->|Sí| F["Child-Pugh + MELD-Na\\nEndoscopía (várices)\\nAFP"]:::proceso
    F --> G{{"¿Descompensada\\no Child B/C?"}}:::decision
    G -->|No| H["Child A: vigilancia\\nAFP + eco c/6 meses"]:::aps
    G -->|Sí| I["Apertura GES\\nGastroenterología /\\nHepatología — HHM"]:::derivacion""")

# 66. PARTO PREMATURO
FLOWS["a0c7a7ce-e81e-4735-ae8e-409229771997"] = mblock("""
    A(["📋 Control Prenatal\\nEmbarazo entre 22-34 sem\\nfactores de riesgo PP"]):::inicio
    A --> B["Cervicometría transvaginal\\nentre sem 14-24"]:::proceso
    B --> C{{"¿CL ≤ 25 mm\\no síntomas de PP?"}}:::decision
    C -->|No| F["Control prenatal habitual\\ncervicometría c/2 sem si riesgo"]:::aps
    C -->|Sí| D["Hospitalización\\nTocolíticos + Corticoides\\nantenatales"]:::proceso
    D --> E{{"¿Trabajo de parto\\nestablecido < 34 sem?"}}:::decision
    E -->|No| G["Reposo + nifedipino\\ncontrol estricto"]:::aps
    E -->|Sí| H["Apertura GES\\nObstetricia Alto Riesgo\\n— HHM + Traslado neonatología"]:::alerta
    H --> I["Parto prematuro controlado\\n+ UCIN neonatal"]:::derivacion""")

# 67. AGRESIÓN SEXUAL
FLOWS["de922ca2-9101-47df-9e4a-ccefabcc2657"] = mblock("""
    A(["🚨 Consulta\\nVíctima de agresión sexual\\ncualquier edad"]):::inicio
    A --> B["Acogida + privacidad\\nConsentimiento informado\\nDenuncia (con permiso)"]:::proceso
    B --> C{{"¿< 120 horas\\npost-agresión?"}}:::decision
    C -->|No| D["Atención psicológica\\n+ seguimiento serologías"]:::aps
    C -->|Sí| E["Examen médico legal\\n+ Muestras forenses\\n(protocolo SML)"]:::proceso
    E --> F["Profilaxis ITS:\\nAzitromicina + Ceftriaxona\\n+ VHB vacuna/Ig"]:::proceso
    F --> G{{"¿Riesgo VIH\\n< 72h?"}}:::decision
    G -->|Sí| H["TARV profiláctico\\n28 días"]:::alerta
    G -->|No| I["AE si fértil\\n+ Seguimiento serologías"]:::proceso
    H --> J["Psicología + Asistente Social\\n— HHM / Red apoyo"]:::derivacion
    I --> J""")

# ── APPLY TO SUPABASE ─────────────────────────────────────────────────────────

def insert_flowchart(topic_id, flow_block):
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/topics?id=eq.{topic_id}&select=content_blocks",
        headers=HEADERS, timeout=15
    )
    data = r.json()
    if not data:
        print(f"  ✗ Not found: {topic_id}")
        return False
    blocks = data[0].get("content_blocks") or []

    # Insert after protocol_header (index 0 if present, else prepend)
    insert_pos = 1
    for i, b in enumerate(blocks):
        if b.get("type") == "protocol_header":
            insert_pos = i + 1
            break

    # Skip if already has a mermaid block
    if any(b.get("type") == "mermaid" for b in blocks):
        print(f"  – Already has mermaid, skipping {topic_id}")
        return True

    blocks.insert(insert_pos, flow_block)

    r2 = requests.patch(
        f"{SUPABASE_URL}/rest/v1/topics?id=eq.{topic_id}",
        headers=HEADERS,
        json={"content_blocks": blocks},
        timeout=15,
    )
    return r2.status_code in (200, 204)

if __name__ == "__main__":
    print(f"\nAdding flowcharts to {len(FLOWS)} GES topics...\n")
    ok = 0
    for tid, block in FLOWS.items():
        success = insert_flowchart(tid, block)
        print(f"  {'✓' if success else '✗'} {tid}")
        if success:
            ok += 1
    print(f"\nDone: {ok}/{len(FLOWS)} flowcharts added.")

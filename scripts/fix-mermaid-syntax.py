#!/usr/bin/env python3
"""
Restores 4 corrupted mermaid blocks. Previous fix attempt used raw string
backreferences which wrote literal \1 \2 into the DB. This script restores
the correct content from the original add-flowcharts-ges.py source.
"""
import requests, json

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

def flow(content):
    return f"flowchart TD\n{STYLE}\n{content}"

# Correct mermaid content for each corrupted topic
# Key fix: :::clase goes AFTER the closing ) of the node, not inside the ["..."]
CORRECT_CHARTS = {
    # Cuidados Paliativos
    "cda1e4f0-3773-4f1a-ba33-f68bde078471": flow("""
    A(["📋 Criterio de ingreso\\nCáncer avanzado sin\\nopción curativa"]):::inicio
    A --> B["Evaluación oncólogo\\nECOG + pronóstico\\nexpectativa < 12 meses"]:::proceso
    B --> C{{"¿EVA dolor ≥ 7\\no síntomas refractarios?"}}:::decision
    C -->|No| D["Manejo APS\\nescalada analgésica"]:::aps
    C -->|Sí| E["Apertura GES Paliativos\\n+ interconsulta UAPO"]:::proceso
    E --> F["Evaluación nutricional\\n+ escala Karnofsky"]:::proceso
    F --> G["UAPO / Cuidados Paliativos\\n— HHM"]:::derivacion
    G --> H["Plan de cuidados\\nOpioides + apoyo psicosocial"]:::derivacion"""),

    # Alzheimer
    "696ea74c245ef362de4f4338": flow("""
    A(["🔍 Sospecha\\nFamiliar reporta pérdida\\nmemoria funcional"]):::inicio
    A --> B["MMSE o MoCA\\n+ CDR"]:::proceso
    B --> C{{"¿MMSE < 24 o\\nMoCA < 25?"}}:::decision
    C -->|No| F["Control APS\\nc/6-12 meses"]:::aps
    C -->|Sí| D["RNM encéfalo\\nTSH + B12 + folato"]:::proceso
    D --> E{{"¿Causa tratable\\ndescartada?"}}:::decision
    E -->|No| G["Tratar causa específica"]:::aps
    E -->|Sí| H["Diagnóstico Alzheimer\\nApertura GES"]:::proceso
    H --> I["Neurología / Geriatría\\n— HHM\\nInhibidor colinesterasa"]:::derivacion"""),

    # Fisura Labiopalatina
    "40389e49-9062-4fe4-830c-6fc7ff69bccf": flow("""
    A(["🔍 Diagnóstico\\nFisura labial/palatina\\nen RN o prenatal"]):::inicio
    A --> B["Fotografía clínica\\nClasificación Veau\\nEvaluación alimentación"]:::proceso
    B --> C["Eco cardíaca\\nEvaluación genética\\nsi síndrome asociado"]:::proceso
    C --> D["Apertura GES\\nEquipo multidisciplinario\\nFamilia informada"]:::proceso
    D --> E["Cirugía Plástica /\\nMaxilofacial — HHM"]:::derivacion
    E --> F["Queiloplastia (~3 meses)\\nVelofaringoplastia (~12 meses)\\nFonoaudiología + ortodoncia"]:::derivacion"""),

    # Artritis Idiopática Juvenil
    "403033ae-7f8d-4d50-842c-22df45a881eb": flow("""
    A(["🔍 Sospecha\\nArtritis > 6 semanas\\nen < 16 años"]):::inicio
    A --> B["ANA + FR + Anti-CCP\\nVHS + PCR + hemograma"]:::proceso
    B --> C["Fondo de ojo en lámpara\\nde hendidura\\n(uveítis subclínica)"]:::proceso
    C --> D{{"¿Criterios AIJ\\ncumplidos?"}}:::decision
    D -->|No| E["Estudio diferencial\\ninfeccioso / maligno"]:::aps
    D -->|Sí| F["Apertura GES\\nClasificar: oligo/poli/sistémica"]:::proceso
    F --> G["Reumatología Pediátrica\\n— HHM"]:::derivacion
    G --> H["MTX ± AINE\\ncontrol oftalmológico\\ntrimestral"]:::derivacion"""),
}

def fix_topic(topic_id, correct_chart):
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/topics?id=eq.{topic_id}&select=title,content_blocks",
        headers=HEADERS, timeout=15
    )
    data = r.json()
    if not data:
        print(f"  ✗ Not found: {topic_id}")
        return False

    title = data[0].get("title", topic_id)
    blocks = data[0].get("content_blocks") or []

    fixed = False
    for b in blocks:
        if b.get("type") == "mermaid":
            b["content"] = correct_chart
            fixed = True
            break

    if not fixed:
        print(f"  ✗ No mermaid block found in: {title}")
        return False

    r2 = requests.patch(
        f"{SUPABASE_URL}/rest/v1/topics?id=eq.{topic_id}",
        headers=HEADERS,
        json={"content_blocks": blocks},
        timeout=15,
    )
    ok = r2.status_code in (200, 204)
    print(f"  {'✓' if ok else f'✗ HTTP {r2.status_code}'} {title}")
    return ok

if __name__ == "__main__":
    print(f"\nFixing {len(CORRECT_CHARTS)} corrupted mermaid blocks...\n")
    ok = 0
    for tid, chart in CORRECT_CHARTS.items():
        if fix_topic(tid, chart):
            ok += 1
    print(f"\nDone: {ok}/{len(CORRECT_CHARTS)} fixed.")

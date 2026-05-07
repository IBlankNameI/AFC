# ─── Motor de Inferencia Funcional ────────────────────────────
# Lógica de cálculo conductual: clasificación heurística de funciones
# basada en análisis de keywords en consecuentes.

KEYWORDS = {
    "Escape/Evitación": ["retira", "quita", "deja de", "sale", "vete", "evita", "termina", "descanso"],
    "Atención": ["mira", "regaña", "habla", "acerca", "atención", "explica", "consuela", "abrazo"],
    "Tangible": ["da", "entrega", "juguete", "caramelo", "comida", "objeto", "obtiene", "premio"],
    "Sensorial/Automático": ["solo", "mismo", "estereotipia", "estimulación", "placer", "balanceo"],
}

SUGERENCIAS = {
    "Escape/Evitación": "Implementar FCT (Entrenamiento en Comunicación Funcional) para solicitar descansos.",
    "Atención": "Utilizar Extinción y Reforzamiento Diferencial de Conductas Alternativas (DRA).",
    "Tangible": "Establecer sistemas de espera y reforzamiento diferencial de baja tasa.",
    "Sensorial/Automático": "Proporcionar dietas sensoriales o juguetes de estimulación alternativa.",
    "Indeterminado": "Se recomienda realizar un registro más descriptivo para identificar la función.",
}


def run_inference(registros_data):
    """
    Ejecuta el motor de inferencia heurística sobre una lista de registros.
    Retorna: (conteo_por_funcion, funcion_predominante, sugerencia_intervencion)
    """
    conteo = {f: 0 for f in KEYWORDS.keys()}
    conteo["Indeterminado"] = 0

    for r in registros_data:
        hallado = False
        cons_lower = (r.consecuente if hasattr(r, 'consecuente') else r['consecuente']).lower()
        for funcion, palabras in KEYWORDS.items():
            if any(p in cons_lower for p in palabras):
                conteo[funcion] += 1
                hallado = True
        if not hallado:
            conteo["Indeterminado"] += 1

    funcion_top = max(conteo, key=conteo.get)
    return conteo, funcion_top, SUGERENCIAS.get(funcion_top)

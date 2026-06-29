import re
from sqlalchemy.orm import Session
from models.checklist import ChecklistItem, Keyword
from models.agent import Agent

def normalizar(texto: str) -> str:
    texto = texto.lower()
    texto = texto.replace("á", "a").replace("é", "e").replace("í", "i")
    texto = texto.replace("ó", "o").replace("ú", "u").replace("ü", "u")
    texto = re.sub(r'[^\w\s]', ' ', texto)
    return texto

def contar_frecuencia(texto_normalizado: str, palabra: str) -> int:
    patron = r'\b' + re.escape(palabra) + r'\b'
    return len(re.findall(patron, texto_normalizado))

def analizar_conversacion(contenido: str, db: Session, agent_id: int = None) -> dict:
    texto_normalizado = normalizar(contenido)
    items = db.query(ChecklistItem).all()

    agente = None
    if agent_id:
        agente = db.query(Agent).filter(Agent.id == agent_id).first()

    autorizado_cobros = agente.autorizado_cobros if agente else True

    todas_keywords = []
    for item in items:
        keywords = db.query(Keyword).filter(
            Keyword.item_id == item.id,
            Keyword.activa == True
        ).all()
        todas_keywords.extend(keywords)

    palabras_pago_autorizadas = [k for k in todas_keywords if k.categoria == "obligatoria" and k.activa]
    palabras_prohibidas_global = [k for k in todas_keywords if k.categoria == "prohibida" and k.activa]

    hay_datos_pago = any(
        contar_frecuencia(texto_normalizado, normalizar(k.palabra)) > 0
        for k in palabras_pago_autorizadas + palabras_prohibidas_global
    )

    resultados = []
    items_cumplidos = 0
    palabras_obligatorias_encontradas = []
    palabras_obligatorias_faltantes = []
    palabras_prohibidas_encontradas = []
    frecuencias = {}

    for item in items:
        keywords = db.query(Keyword).filter(
            Keyword.item_id == item.id,
            Keyword.activa == True
        ).all()

        encontradas = []
        faltantes = []
        prohibidas_item = []
        aplica = True

        for kw in keywords:
            palabra_norm = normalizar(kw.palabra)
            frecuencia = contar_frecuencia(texto_normalizado, palabra_norm)
            encontrada = frecuencia > 0

            if encontrada:
                frecuencias[kw.palabra] = frecuencia

            if kw.categoria == "prohibida":
                if encontrada:
                    prohibidas_item.append({"palabra": kw.palabra, "frecuencia": frecuencia})
                    palabras_prohibidas_encontradas.append(kw.palabra)

            elif kw.categoria == "obligatoria":
                if not hay_datos_pago:
                    aplica = False
                elif not autorizado_cobros:
                    if encontrada:
                        prohibidas_item.append({"palabra": kw.palabra, "frecuencia": frecuencia})
                        palabras_prohibidas_encontradas.append(
                            f"{kw.palabra} (agente no autorizado para cobros)"
                        )
                else:
                    if encontrada:
                        encontradas.append({"palabra": kw.palabra, "frecuencia": frecuencia})
                        palabras_obligatorias_encontradas.append(kw.palabra)
                    else:
                        faltantes.append(kw.palabra)
                        palabras_obligatorias_faltantes.append(kw.palabra)
            else:
                if encontrada:
                    encontradas.append({"palabra": kw.palabra, "frecuencia": frecuencia})

        if not aplica:
            resultados.append({
                "item_id": item.id,
                "criterio": item.criterio,
                "categoria": item.categoria,
                "peso": item.peso,
                "cumplido": True,
                "aplica": False,
                "keywords_encontradas": [],
                "keywords_faltantes": [],
                "keywords_prohibidas": [],
                "frecuencias": {},
                "keywords_total": 0
            })
            items_cumplidos += 1
            continue

        if item.categoria == "prohibida":
            cumplido = len(prohibidas_item) == 0
        else:
            cumplido = len(prohibidas_item) == 0 and len(encontradas) > 0

        if cumplido:
            items_cumplidos += 1

        resultados.append({
            "item_id": item.id,
            "criterio": item.criterio,
            "categoria": item.categoria,
            "peso": item.peso,
            "cumplido": cumplido,
            "aplica": True,
            "keywords_encontradas": [e["palabra"] for e in encontradas],
            "keywords_faltantes": faltantes,
            "keywords_prohibidas": [p["palabra"] for p in prohibidas_item],
            "frecuencias": {e["palabra"]: e["frecuencia"] for e in encontradas},
            "keywords_total": len(keywords)
        })

    total_items = len(items)
    penalizacion = len(palabras_prohibidas_encontradas) * 10
    puntuacion_base = round((items_cumplidos / total_items) * 100, 2) if total_items > 0 else 0
    puntuacion = max(0, puntuacion_base - penalizacion)

    alerta_fraude = len(palabras_prohibidas_encontradas) > 0
    tipo_alerta = None
    if alerta_fraude:
        if not autorizado_cobros:
            tipo_alerta = "AGENTE NO AUTORIZADO COMPARTIÓ DATOS DE PAGO"
        else:
            tipo_alerta = "AGENTE USÓ MÉTODOS DE PAGO NO AUTORIZADOS"

    return {
        "puntuacion": puntuacion,
        "puntuacion_base": puntuacion_base,
        "items_cumplidos": items_cumplidos,
        "items_total": total_items,
        "palabras_obligatorias_encontradas": palabras_obligatorias_encontradas,
        "palabras_obligatorias_faltantes": palabras_obligatorias_faltantes,
        "palabras_prohibidas_encontradas": palabras_prohibidas_encontradas,
        "frecuencias": frecuencias,
        "penalizacion": penalizacion,
        "alerta_fraude": alerta_fraude,
        "tipo_alerta": tipo_alerta,
        "autorizado_cobros": autorizado_cobros,
        "hay_datos_pago": hay_datos_pago,
        "detalle": resultados
    }

def calcular_promedio_agente(evaluaciones: list) -> dict:
    if not evaluaciones:
        return {"promedio": 0, "total": 0}
    puntuaciones = [e["puntuacion"] for e in evaluaciones]
    return {
        "promedio": round(sum(puntuaciones) / len(puntuaciones), 2),
        "total": len(puntuaciones),
        "maxima": max(puntuaciones),
        "minima": min(puntuaciones)
    }
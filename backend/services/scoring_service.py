import json
from sqlalchemy.orm import Session
from models.evaluation import Evaluation

def calcular_parte_automatica(agent_id: int, mes: int, anio: int, db: Session) -> dict:
    evaluations = db.query(Evaluation).filter(
        Evaluation.agent_id == agent_id,
        Evaluation.mes == mes,
        Evaluation.anio == anio
    ).all()

    if not evaluations:
        return {
            "puntuacion_automatica": 0,
            "pts_cumplimiento": 0,
            "pts_obligatorias": 0,
            "pts_prohibidas": 0,
            "total_conversaciones": 0
        }

    total_conv = len(evaluations)
    suma_cumplimiento = 0
    suma_obligatorias = 0
    total_prohibidas = 0

    for ev in evaluations:
        if ev.items_total > 0:
            suma_cumplimiento += (ev.items_cumplidos / ev.items_total) * 100

        faltantes = json.loads(ev.palabras_obligatorias_faltantes or "[]")
        encontradas_obl = json.loads(ev.palabras_obligatorias_encontradas or "[]")
        total_obl = len(faltantes) + len(encontradas_obl)
        if total_obl > 0:
            suma_obligatorias += (len(encontradas_obl) / total_obl) * 100
        else:
            suma_obligatorias += 100

        prohibidas = json.loads(ev.palabras_prohibidas_encontradas or "[]")
        total_prohibidas += len(prohibidas)

    promedio_cumplimiento = suma_cumplimiento / total_conv
    promedio_obligatorias = suma_obligatorias / total_conv

    pts_cumplimiento = round((promedio_cumplimiento / 100) * 20)
    pts_obligatorias = round((promedio_obligatorias / 100) * 15)
    pts_prohibidas = max(0, round(15 - (total_prohibidas * 3)))
    puntuacion_automatica = pts_cumplimiento + pts_obligatorias + pts_prohibidas

    return {
        "puntuacion_automatica": puntuacion_automatica,
        "pts_cumplimiento": pts_cumplimiento,
        "pts_obligatorias": pts_obligatorias,
        "pts_prohibidas": pts_prohibidas,
        "total_conversaciones": total_conv,
        "promedio_cumplimiento": round(promedio_cumplimiento),
        "promedio_obligatorias": round(promedio_obligatorias),
        "total_prohibidas_detectadas": total_prohibidas
    }

def calcular_parte_manual(criterios: dict) -> int:
    pesos = {
        "velocidad_respuesta": 2.0,
        "capacidad_trabajo": 2.0,
        "uso_plantillas": 1.5,
        "resolucion_primer_contacto": 2.0,
        "actitud_trato": 2.0,
        "conocimiento_producto": 0.5
    }
    total_peso = sum(pesos.values())
    suma = 0
    for criterio, peso in pesos.items():
        valor = min(10, max(0, criterios.get(criterio, 0)))
        suma += valor * peso

    return round((suma / (total_peso * 10)) * 50)

def calcular_nivel(calificacion: int) -> str:
    if calificacion >= 90: return "Excelente"
    if calificacion >= 75: return "Bueno"
    if calificacion >= 60: return "Regular"
    return "Deficiente"

def calcular_evaluacion_final(automatica: int, manual: int) -> dict:
    total = max(0, min(100, automatica + manual))
    return {
        "calificacion_final": total,
        "nivel": calcular_nivel(total)
    }
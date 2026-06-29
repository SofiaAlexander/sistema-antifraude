from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models.evaluation import Evaluation
from models.agent import Agent
from models.conversation import Conversation
from services.export_service import exportar_reporte_excel
import json
import io

router = APIRouter(prefix="/reports", tags=["Reportes"])

@router.get("/dashboard")
def get_dashboard(mes: int, anio: int, db: Session = Depends(get_db)):
    agents = db.query(Agent).filter(Agent.activo == True).all()
    resultado = []

    for agent in agents:
        evaluations = db.query(Evaluation).filter(
            Evaluation.agent_id == agent.id,
            Evaluation.mes == mes,
            Evaluation.anio == anio
        ).all()

        if not evaluations:
            continue

        puntuaciones = [e.puntuacion for e in evaluations]
        promedio = round(sum(puntuaciones) / len(puntuaciones), 2)

        resultado.append({
            "agent_id": agent.id,
            "agente": agent.nombre,
            "codigo": agent.codigo,
            "area": agent.area,
            "total_conversaciones": len(evaluations),
            "puntuacion_promedio": promedio
        })

    resultado.sort(key=lambda x: x["puntuacion_promedio"], reverse=True)
    return {"mes": mes, "anio": anio, "total_agentes": len(resultado), "agentes": resultado}

@router.get("/supervisor")
def get_supervisor_report(mes: int, anio: int, db: Session = Depends(get_db)):
    agents = db.query(Agent).filter(Agent.activo == True).all()
    agentes_data = []
    todas_frecuencias = {}
    todas_obligatorias_faltantes = {}
    todas_prohibidas = {}

    for agent in agents:
        evaluations = db.query(Evaluation).filter(
            Evaluation.agent_id == agent.id,
            Evaluation.mes == mes,
            Evaluation.anio == anio
        ).all()

        if not evaluations:
            continue

        puntuaciones = [e.puntuacion for e in evaluations]
        promedio = round(sum(puntuaciones) / len(puntuaciones), 2)

        if promedio >= 90:
            calificacion = "Excelente"
        elif promedio >= 75:
            calificacion = "Bueno"
        elif promedio >= 60:
            calificacion = "Regular"
        else:
            calificacion = "Deficiente"

        for ev in evaluations:
            frecuencias = json.loads(ev.frecuencias or "{}")
            for palabra, freq in frecuencias.items():
                todas_frecuencias[palabra] = todas_frecuencias.get(palabra, 0) + freq

            faltantes = json.loads(ev.palabras_obligatorias_faltantes or "[]")
            for palabra in faltantes:
                todas_obligatorias_faltantes[palabra] = todas_obligatorias_faltantes.get(palabra, 0) + 1

            prohibidas = json.loads(ev.palabras_prohibidas_encontradas or "[]")
            for palabra in prohibidas:
                todas_prohibidas[palabra] = todas_prohibidas.get(palabra, 0) + 1

        agentes_data.append({
            "agent_id": agent.id,
            "agente": agent.nombre,
            "codigo": agent.codigo,
            "area": agent.area,
            "total_conversaciones": len(evaluations),
            "puntuacion_promedio": promedio,
            "puntuacion_maxima": max(puntuaciones),
            "puntuacion_minima": min(puntuaciones),
            "calificacion": calificacion
        })

    agentes_data.sort(key=lambda x: x["puntuacion_promedio"], reverse=True)

    palabras_mas_usadas = sorted(todas_frecuencias.items(), key=lambda x: x[1], reverse=True)[:10]
    obligatorias_mas_omitidas = sorted(todas_obligatorias_faltantes.items(), key=lambda x: x[1], reverse=True)[:10]
    prohibidas_detectadas = sorted(todas_prohibidas.items(), key=lambda x: x[1], reverse=True)

    return {
        "mes": mes,
        "anio": anio,
        "total_agentes": len(agentes_data),
        "agentes": agentes_data,
        "palabras_mas_usadas": [{"palabra": p, "frecuencia": f} for p, f in palabras_mas_usadas],
        "obligatorias_mas_omitidas": [{"palabra": p, "veces": f} for p, f in obligatorias_mas_omitidas],
        "prohibidas_detectadas": [{"palabra": p, "veces": f} for p, f in prohibidas_detectadas]
    }

@router.get("/agent/{agent_id}/monthly")
def get_monthly_report(agent_id: int, mes: int, anio: int, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agente no encontrado")

    evaluations = db.query(Evaluation).filter(
        Evaluation.agent_id == agent_id,
        Evaluation.mes == mes,
        Evaluation.anio == anio
    ).all()

    if not evaluations:
        return {
            "agente": agent.nombre,
            "mes": mes,
            "anio": anio,
            "total_conversaciones": 0,
            "puntuacion_promedio": 0,
            "mensaje": "Sin evaluaciones este mes"
        }

    puntuaciones = [e.puntuacion for e in evaluations]
    promedio = round(sum(puntuaciones) / len(puntuaciones), 2)

    return {
        "agente": agent.nombre,
        "codigo": agent.codigo,
        "area": agent.area,
        "mes": mes,
        "anio": anio,
        "total_conversaciones": len(evaluations),
        "puntuacion_promedio": promedio,
        "puntuacion_maxima": max(puntuaciones),
        "puntuacion_minima": min(puntuaciones),
        "conversaciones": [
            {
                "conversation_id": e.conversation_id,
                "puntuacion": e.puntuacion,
                "items_cumplidos": e.items_cumplidos,
                "items_total": e.items_total
            }
            for e in evaluations
        ]
    }

@router.get("/agent/{agent_id}/export/excel")
def export_excel(agent_id: int, mes: int, anio: int, db: Session = Depends(get_db)):
    data = exportar_reporte_excel(agent_id, mes, anio, db)
    return StreamingResponse(
        io.BytesIO(data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=reporte_agente_{agent_id}_mes{mes}_{anio}.xlsx"}
    )

@router.get("/supervisor/export/excel")
def export_supervisor_excel(mes: int, anio: int, db: Session = Depends(get_db)):
    from services.export_service import exportar_reporte_supervisor
    data = exportar_reporte_supervisor(mes, anio, db)
    return StreamingResponse(
        io.BytesIO(data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=reporte_supervisor_mes{mes}_{anio}.xlsx"}
    )
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.monthly_evaluation import MonthlyEvaluation
from models.agent import Agent
from services.scoring_service import (
    calcular_parte_automatica,
    calcular_parte_manual,
    calcular_evaluacion_final
)
from services.export_service import exportar_evaluacion_mensual
import io

router = APIRouter(prefix="/monthly", tags=["Evaluacion Mensual"])

class EvaluacionManualInput(BaseModel):
    agent_id: int
    mes: int
    anio: int
    velocidad_respuesta: float
    capacidad_trabajo: float
    uso_plantillas: float
    resolucion_primer_contacto: float
    actitud_trato: float
    conocimiento_producto: float
    observaciones: Optional[str] = ""

@router.get("/preview/{agent_id}")
def preview_evaluacion(agent_id: int, mes: int, anio: int, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agente no encontrado")
    automatica = calcular_parte_automatica(agent_id, mes, anio, db)
    return {
        "agente": agent.nombre,
        "codigo": agent.codigo,
        "mes": mes,
        "anio": anio,
        "parte_automatica": automatica
    }

@router.post("/evaluar")
def crear_evaluacion(data: EvaluacionManualInput, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == data.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agente no encontrado")

    existente = db.query(MonthlyEvaluation).filter(
        MonthlyEvaluation.agent_id == data.agent_id,
        MonthlyEvaluation.mes == data.mes,
        MonthlyEvaluation.anio == data.anio
    ).first()

    automatica = calcular_parte_automatica(data.agent_id, data.mes, data.anio, db)
    criterios_manuales = {
        "velocidad_respuesta": data.velocidad_respuesta,
        "capacidad_trabajo": data.capacidad_trabajo,
        "uso_plantillas": data.uso_plantillas,
        "resolucion_primer_contacto": data.resolucion_primer_contacto,
        "actitud_trato": data.actitud_trato,
        "conocimiento_producto": data.conocimiento_producto
    }
    pts_manual = calcular_parte_manual(criterios_manuales)
    resultado = calcular_evaluacion_final(automatica["puntuacion_automatica"], pts_manual)

    if existente:
        ev = existente
    else:
        ev = MonthlyEvaluation(agent_id=data.agent_id, mes=data.mes, anio=data.anio)
        db.add(ev)

    ev.puntuacion_automatica = automatica["puntuacion_automatica"]
    ev.pts_cumplimiento      = automatica["pts_cumplimiento"]
    ev.pts_obligatorias      = automatica["pts_obligatorias"]
    ev.pts_prohibidas        = automatica["pts_prohibidas"]
    ev.total_conversaciones  = automatica["total_conversaciones"]
    ev.velocidad_respuesta         = data.velocidad_respuesta
    ev.capacidad_trabajo           = data.capacidad_trabajo
    ev.uso_plantillas              = data.uso_plantillas
    ev.resolucion_primer_contacto  = data.resolucion_primer_contacto
    ev.actitud_trato               = data.actitud_trato
    ev.conocimiento_producto       = data.conocimiento_producto
    ev.puntuacion_manual   = pts_manual
    ev.calificacion_final  = resultado["calificacion_final"]
    ev.nivel               = resultado["nivel"]
    ev.observaciones       = data.observaciones
    ev.completada          = True

    db.commit()
    db.refresh(ev)

    return {
        "mensaje": "Evaluacion guardada correctamente",
        "id": ev.id,
        "agente": agent.nombre,
        "calificacion_final": ev.calificacion_final,
        "nivel": ev.nivel,
        "puntuacion_automatica": ev.puntuacion_automatica,
        "puntuacion_manual": pts_manual
    }

@router.get("/historial/{agent_id}")
def get_historial(agent_id: int, db: Session = Depends(get_db)):
    evaluaciones = db.query(MonthlyEvaluation).filter(
        MonthlyEvaluation.agent_id == agent_id,
        MonthlyEvaluation.completada == True
    ).order_by(MonthlyEvaluation.anio.desc(), MonthlyEvaluation.mes.desc()).all()

    meses = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
             'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

    return [
        {
            "id": e.id,
            "mes": e.mes,
            "anio": e.anio,
            "periodo": f"{meses[e.mes]} {e.anio}",
            "calificacion_final": e.calificacion_final,
            "nivel": e.nivel,
            "puntuacion_automatica": e.puntuacion_automatica,
            "puntuacion_manual": e.puntuacion_manual,
            "total_conversaciones": e.total_conversaciones,
            "velocidad_respuesta": e.velocidad_respuesta,
            "capacidad_trabajo": e.capacidad_trabajo,
            "uso_plantillas": e.uso_plantillas,
            "resolucion_primer_contacto": e.resolucion_primer_contacto,
            "actitud_trato": e.actitud_trato,
            "conocimiento_producto": e.conocimiento_producto,
            "observaciones": e.observaciones
        }
        for e in evaluaciones
    ]

@router.get("/resumen")
def get_resumen(mes: int, anio: int, db: Session = Depends(get_db)):
    evaluaciones = db.query(MonthlyEvaluation).filter(
        MonthlyEvaluation.mes == mes,
        MonthlyEvaluation.anio == anio,
        MonthlyEvaluation.completada == True
    ).all()

    meses = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
             'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

    resultado = []
    for e in evaluaciones:
        agent = db.query(Agent).filter(Agent.id == e.agent_id).first()
        resultado.append({
            "agent_id": e.agent_id,
            "agente": agent.nombre if agent else "N/A",
            "codigo": agent.codigo if agent else "N/A",
            "calificacion_final": e.calificacion_final,
            "nivel": e.nivel,
            "total_conversaciones": e.total_conversaciones
        })

    resultado.sort(key=lambda x: x["calificacion_final"], reverse=True)
    return {
        "mes": mes,
        "anio": anio,
        "periodo": f"{meses[mes]} {anio}",
        "total": len(resultado),
        "evaluaciones": resultado
    }

@router.get("/export/excel/{agent_id}")
def export_monthly_excel(agent_id: int, mes: int, anio: int, db: Session = Depends(get_db)):
    data = exportar_evaluacion_mensual(agent_id, mes, anio, db)
    if not data:
        raise HTTPException(status_code=404, detail="Evaluacion no encontrada")
    return StreamingResponse(
        io.BytesIO(data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=evaluacion_{agent_id}_mes{mes}_{anio}.xlsx"}
    )
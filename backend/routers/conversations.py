from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json
from database import get_db
from models.conversation import Conversation
from models.evaluation import Evaluation
from models.agent import Agent
from services.analysis_engine import analizar_conversacion
from services.file_parser import parsear_txt, parsear_csv, parsear_xlsx, parsear_leadsales

router = APIRouter(prefix="/conversations", tags=["Conversaciones"])

class ConversacionTexto(BaseModel):
    agent_id: int
    mes: int
    anio: int
    cliente: str
    fecha: str
    texto: str

class ChatLeadsales(BaseModel):
    mes: int
    anio: int
    cliente: str
    fecha: str
    texto: str

@router.post("/upload")
async def upload_conversation(
    agent_id: int = Form(...),
    mes: int = Form(...),
    anio: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    contenido_bytes = await file.read()
    filename = file.filename.lower()

    try:
        if filename.endswith(".txt"):
            conversaciones = parsear_txt(contenido_bytes.decode("utf-8"))
        elif filename.endswith(".csv"):
            conversaciones = parsear_csv(contenido_bytes.decode("utf-8"))
        elif filename.endswith(".xlsx"):
            conversaciones = parsear_xlsx(contenido_bytes)
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado. Usa .txt, .csv o .xlsx")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer el archivo: {str(e)}")

    if not conversaciones:
        raise HTTPException(status_code=400, detail="No se encontraron conversaciones en el archivo")

    resultados = []
    for conv in conversaciones:
        conversacion = Conversation(
            agent_id=agent_id,
            nombre_agente=conv["nombre_agente"],
            cliente=conv["cliente"],
            fecha=conv["fecha"],
            contenido=conv["conversacion"],
            nombre_archivo=file.filename,
            mes=mes,
            anio=anio
        )
        db.add(conversacion)
        db.commit()
        db.refresh(conversacion)

        resultado = analizar_conversacion(conv["conversacion"], db, agent_id=agent_id)

        evaluacion = Evaluation(
            agent_id=agent_id,
            conversation_id=conversacion.id,
            puntuacion=resultado["puntuacion"],
            puntuacion_base=resultado["puntuacion_base"],
            items_cumplidos=resultado["items_cumplidos"],
            items_total=resultado["items_total"],
            palabras_obligatorias_encontradas=json.dumps(resultado["palabras_obligatorias_encontradas"], ensure_ascii=False),
            palabras_obligatorias_faltantes=json.dumps(resultado["palabras_obligatorias_faltantes"], ensure_ascii=False),
            palabras_prohibidas_encontradas=json.dumps(resultado["palabras_prohibidas_encontradas"], ensure_ascii=False),
            frecuencias=json.dumps(resultado["frecuencias"], ensure_ascii=False),
            penalizacion=resultado["penalizacion"],
            alerta_fraude=resultado.get("alerta_fraude", False),
            tipo_alerta=resultado.get("tipo_alerta", None),
            detalle=json.dumps(resultado["detalle"], ensure_ascii=False),
            mes=mes,
            anio=anio
        )
        db.add(evaluacion)
        db.commit()

        resultados.append({
            "conversation_id": conversacion.id,
            "cliente": conv["cliente"],
            "fecha": conv["fecha"],
            "puntuacion": resultado["puntuacion"],
            "puntuacion_base": resultado["puntuacion_base"],
            "items_cumplidos": resultado["items_cumplidos"],
            "items_total": resultado["items_total"],
            "palabras_obligatorias_encontradas": resultado["palabras_obligatorias_encontradas"],
            "palabras_obligatorias_faltantes": resultado["palabras_obligatorias_faltantes"],
            "palabras_prohibidas_encontradas": resultado["palabras_prohibidas_encontradas"],
            "frecuencias": resultado["frecuencias"],
            "penalizacion": resultado["penalizacion"],
            "alerta_fraude": resultado.get("alerta_fraude", False),
            "tipo_alerta": resultado.get("tipo_alerta", None),
            "detalle": resultado["detalle"]
        })

    return {
        "mensaje": f"{len(resultados)} conversación(es) cargada(s) y analizada(s)",
        "total": len(resultados),
        "resultados": resultados
    }

@router.post("/pegar")
def pegar_conversacion(data: ConversacionTexto, db: Session = Depends(get_db)):
    if not data.texto.strip():
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")

    conversacion = Conversation(
        agent_id=data.agent_id,
        nombre_agente="",
        cliente=data.cliente,
        fecha=data.fecha,
        contenido=data.texto,
        nombre_archivo="pegado_manual",
        mes=data.mes,
        anio=data.anio
    )
    db.add(conversacion)
    db.commit()
    db.refresh(conversacion)

    resultado = analizar_conversacion(data.texto, db, agent_id=data.agent_id)

    evaluacion = Evaluation(
        agent_id=data.agent_id,
        conversation_id=conversacion.id,
        puntuacion=resultado["puntuacion"],
        puntuacion_base=resultado["puntuacion_base"],
        items_cumplidos=resultado["items_cumplidos"],
        items_total=resultado["items_total"],
        palabras_obligatorias_encontradas=json.dumps(resultado["palabras_obligatorias_encontradas"], ensure_ascii=False),
        palabras_obligatorias_faltantes=json.dumps(resultado["palabras_obligatorias_faltantes"], ensure_ascii=False),
        palabras_prohibidas_encontradas=json.dumps(resultado["palabras_prohibidas_encontradas"], ensure_ascii=False),
        frecuencias=json.dumps(resultado["frecuencias"], ensure_ascii=False),
        penalizacion=resultado["penalizacion"],
        alerta_fraude=resultado.get("alerta_fraude", False),
        tipo_alerta=resultado.get("tipo_alerta", None),
        detalle=json.dumps(resultado["detalle"], ensure_ascii=False),
        mes=data.mes,
        anio=data.anio
    )
    db.add(evaluacion)
    db.commit()

    return {
        "mensaje": "Conversación analizada correctamente",
        "conversation_id": conversacion.id,
        "cliente": data.cliente,
        "fecha": data.fecha,
        "puntuacion": resultado["puntuacion"],
        "puntuacion_base": resultado["puntuacion_base"],
        "items_cumplidos": resultado["items_cumplidos"],
        "items_total": resultado["items_total"],
        "palabras_obligatorias_encontradas": resultado["palabras_obligatorias_encontradas"],
        "palabras_obligatorias_faltantes": resultado["palabras_obligatorias_faltantes"],
        "palabras_prohibidas_encontradas": resultado["palabras_prohibidas_encontradas"],
        "frecuencias": resultado["frecuencias"],
        "penalizacion": resultado["penalizacion"],
        "alerta_fraude": resultado.get("alerta_fraude", False),
        "tipo_alerta": resultado.get("tipo_alerta", None),
        "detalle": resultado["detalle"]
    }

@router.post("/leadsales")
def analizar_chat_leadsales(data: ChatLeadsales, db: Session = Depends(get_db)):
    if not data.texto.strip():
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")

    agentes = db.query(Agent).filter(
        Agent.activo == True,
        Agent.nombre_leadsales != None
    ).all()

    if not agentes:
        raise HTTPException(status_code=400, detail="No hay agentes con nombre de Leadsales configurado.")

    agentes_map = {a.nombre_leadsales: a.id for a in agentes}
    partes = parsear_leadsales(data.texto, agentes_map)

    if not partes:
        raise HTTPException(status_code=400, detail="No se detectaron agentes conocidos en el chat.")

    resultados = []
    for parte in partes:
        conversacion = Conversation(
            agent_id=parte["agent_id"],
            nombre_agente=parte["nombre_agente"],
            cliente=data.cliente,
            fecha=data.fecha,
            contenido=parte["contenido"],
            nombre_archivo="leadsales_manual",
            mes=data.mes,
            anio=data.anio
        )
        db.add(conversacion)
        db.commit()
        db.refresh(conversacion)

        resultado = analizar_conversacion(parte["contenido"], db, agent_id=parte["agent_id"])

        evaluacion = Evaluation(
            agent_id=parte["agent_id"],
            conversation_id=conversacion.id,
            puntuacion=resultado["puntuacion"],
            puntuacion_base=resultado["puntuacion_base"],
            items_cumplidos=resultado["items_cumplidos"],
            items_total=resultado["items_total"],
            palabras_obligatorias_encontradas=json.dumps(resultado["palabras_obligatorias_encontradas"], ensure_ascii=False),
            palabras_obligatorias_faltantes=json.dumps(resultado["palabras_obligatorias_faltantes"], ensure_ascii=False),
            palabras_prohibidas_encontradas=json.dumps(resultado["palabras_prohibidas_encontradas"], ensure_ascii=False),
            frecuencias=json.dumps(resultado["frecuencias"], ensure_ascii=False),
            penalizacion=resultado["penalizacion"],
            alerta_fraude=resultado.get("alerta_fraude", False),
            tipo_alerta=resultado.get("tipo_alerta", None),
            detalle=json.dumps(resultado["detalle"], ensure_ascii=False),
            mes=data.mes,
            anio=data.anio
        )
        db.add(evaluacion)
        db.commit()

        agente_obj = db.query(Agent).filter(Agent.id == parte["agent_id"]).first()
        resultados.append({
            "agent_id": parte["agent_id"],
            "agente": agente_obj.nombre if agente_obj else parte["nombre_agente"],
            "autorizado_cobros": agente_obj.autorizado_cobros if agente_obj else True,
            "conversation_id": conversacion.id,
            "puntuacion": resultado["puntuacion"],
            "items_cumplidos": resultado["items_cumplidos"],
            "items_total": resultado["items_total"],
            "palabras_obligatorias_encontradas": resultado["palabras_obligatorias_encontradas"],
            "palabras_obligatorias_faltantes": resultado["palabras_obligatorias_faltantes"],
            "palabras_prohibidas_encontradas": resultado["palabras_prohibidas_encontradas"],
            "frecuencias": resultado["frecuencias"],
            "penalizacion": resultado["penalizacion"],
            "alerta_fraude": resultado.get("alerta_fraude", False),
            "tipo_alerta": resultado.get("tipo_alerta", None),
            "detalle": resultado["detalle"]
        })

    total_alertas = sum(1 for r in resultados if r.get("alerta_fraude"))
    return {
        "mensaje": f"Chat analizado. Se encontraron {len(resultados)} agente(s).",
        "total_agentes": len(resultados),
        "total_alertas": total_alertas,
        "cliente": data.cliente,
        "fecha": data.fecha,
        "resultados": resultados
    }

@router.get("/agent/{agent_id}")
def get_conversations_by_agent(agent_id: int, db: Session = Depends(get_db)):
    conversations = db.query(Conversation).filter(
        Conversation.agent_id == agent_id
    ).all()
    return [
        {
            "id": c.id,
            "nombre_agente": c.nombre_agente,
            "cliente": c.cliente,
            "fecha": c.fecha,
            "nombre_archivo": c.nombre_archivo,
            "mes": c.mes,
            "anio": c.anio,
            "cargado": str(c.cargado)
        }
        for c in conversations
    ]

@router.get("/{conversation_id}")
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    evaluation = db.query(Evaluation).filter(
        Evaluation.conversation_id == conversation_id
    ).first()
    return {
        "id": conv.id,
        "nombre_agente": conv.nombre_agente,
        "cliente": conv.cliente,
        "fecha": conv.fecha,
        "contenido": conv.contenido,
        "nombre_archivo": conv.nombre_archivo,
        "mes": conv.mes,
        "anio": conv.anio,
        "evaluacion": {
            "puntuacion": evaluation.puntuacion,
            "puntuacion_base": evaluation.puntuacion_base,
            "items_cumplidos": evaluation.items_cumplidos,
            "items_total": evaluation.items_total,
            "palabras_obligatorias_encontradas": json.loads(evaluation.palabras_obligatorias_encontradas or "[]"),
            "palabras_obligatorias_faltantes": json.loads(evaluation.palabras_obligatorias_faltantes or "[]"),
            "palabras_prohibidas_encontradas": json.loads(evaluation.palabras_prohibidas_encontradas or "[]"),
            "frecuencias": json.loads(evaluation.frecuencias or "{}"),
            "penalizacion": evaluation.penalizacion,
            "alerta_fraude": evaluation.alerta_fraude,
            "tipo_alerta": evaluation.tipo_alerta,
            "detalle": json.loads(evaluation.detalle)
        } if evaluation else None
    }

@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    db.query(Evaluation).filter(Evaluation.conversation_id == conversation_id).delete()
    db.delete(conv)
    db.commit()
    return {"mensaje": "Conversación eliminada"}
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.agent import Agent

router = APIRouter(prefix="/agents", tags=["Agentes"])

class AgentCreate(BaseModel):
    nombre: str
    codigo: str
    email: Optional[str] = None
    area: Optional[str] = None
    nombre_leadsales: Optional[str] = None
    autorizado_cobros: Optional[bool] = False

class AgentUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    area: Optional[str] = None
    activo: Optional[bool] = None
    nombre_leadsales: Optional[str] = None
    autorizado_cobros: Optional[bool] = None

@router.get("/")
def get_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    return [
        {
            "id": a.id,
            "nombre": a.nombre,
            "codigo": a.codigo,
            "email": a.email,
            "area": a.area,
            "activo": a.activo,
            "nombre_leadsales": a.nombre_leadsales,
            "autorizado_cobros": a.autorizado_cobros
        }
        for a in agents
    ]

@router.get("/{agent_id}")
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agente no encontrado")
    return agent

@router.post("/")
def create_agent(data: AgentCreate, db: Session = Depends(get_db)):
    existing = db.query(Agent).filter(Agent.codigo == data.codigo).first()
    if existing:
        raise HTTPException(status_code=400, detail="El código de agente ya existe")
    agent = Agent(
        nombre=data.nombre,
        codigo=data.codigo,
        email=data.email,
        area=data.area,
        nombre_leadsales=data.nombre_leadsales.lower().strip() if data.nombre_leadsales else None,
        autorizado_cobros=data.autorizado_cobros
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return {"mensaje": "Agente creado correctamente", "id": agent.id}

@router.put("/{agent_id}")
def update_agent(agent_id: int, data: AgentUpdate, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agente no encontrado")
    if data.nombre is not None:
        agent.nombre = data.nombre
    if data.email is not None:
        agent.email = data.email
    if data.area is not None:
        agent.area = data.area
    if data.activo is not None:
        agent.activo = data.activo
    if data.nombre_leadsales is not None:
        agent.nombre_leadsales = data.nombre_leadsales.lower().strip()
    if data.autorizado_cobros is not None:
        agent.autorizado_cobros = data.autorizado_cobros
    db.commit()
    return {"mensaje": "Agente actualizado correctamente"}

@router.delete("/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agente no encontrado")
    agent.activo = False
    db.commit()
    return {"mensaje": "Agente desactivado correctamente"}
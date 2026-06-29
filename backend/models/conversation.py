from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id             = Column(Integer, primary_key=True, index=True)
    agent_id       = Column(Integer, ForeignKey("agents.id"))
    nombre_agente  = Column(String)
    cliente        = Column(String)
    fecha          = Column(String)
    contenido      = Column(Text, nullable=False)
    nombre_archivo = Column(String)
    mes            = Column(Integer)
    anio           = Column(Integer)
    cargado        = Column(DateTime(timezone=True), server_default=func.now())
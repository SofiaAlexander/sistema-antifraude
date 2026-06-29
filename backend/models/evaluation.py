from sqlalchemy import Column, Integer, Float, Text, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base

class Evaluation(Base):
    __tablename__ = "evaluations"

    id                                = Column(Integer, primary_key=True, index=True)
    agent_id                          = Column(Integer, ForeignKey("agents.id"))
    conversation_id                   = Column(Integer, ForeignKey("conversations.id"))
    puntuacion                        = Column(Float)
    puntuacion_base                   = Column(Float)
    items_cumplidos                   = Column(Integer)
    items_total                       = Column(Integer)
    palabras_obligatorias_encontradas = Column(Text)
    palabras_obligatorias_faltantes   = Column(Text)
    palabras_prohibidas_encontradas   = Column(Text)
    frecuencias                       = Column(Text)
    penalizacion                      = Column(Float, default=0)
    alerta_fraude                     = Column(Boolean, default=False)
    tipo_alerta                       = Column(String)
    detalle                           = Column(Text)
    mes                               = Column(Integer)
    anio                              = Column(Integer)
    creado                            = Column(DateTime(timezone=True), server_default=func.now())
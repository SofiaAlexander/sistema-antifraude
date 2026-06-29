from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base

class MonthlyEvaluation(Base):
    __tablename__ = "monthly_evaluations"

    id                          = Column(Integer, primary_key=True, index=True)
    agent_id                    = Column(Integer, ForeignKey("agents.id"))
    mes                         = Column(Integer)
    anio                        = Column(Integer)

    # Parte automatica
    puntuacion_automatica       = Column(Float, default=0)
    pts_cumplimiento            = Column(Float, default=0)
    pts_obligatorias            = Column(Float, default=0)
    pts_prohibidas              = Column(Float, default=0)
    total_conversaciones        = Column(Integer, default=0)

    # Parte manual (0-10 cada una)
    velocidad_respuesta         = Column(Float, default=0)
    capacidad_trabajo           = Column(Float, default=0)
    uso_plantillas              = Column(Float, default=0)
    resolucion_primer_contacto  = Column(Float, default=0)
    actitud_trato               = Column(Float, default=0)
    conocimiento_producto       = Column(Float, default=0)
    puntuacion_manual           = Column(Float, default=0)

    # Resultado final
    calificacion_final          = Column(Float, default=0)
    nivel                       = Column(String, default="")
    observaciones               = Column(Text)
    completada                  = Column(Boolean, default=False)
    creado                      = Column(DateTime(timezone=True), server_default=func.now())
    actualizado                 = Column(DateTime(timezone=True), onupdate=func.now())
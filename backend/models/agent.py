from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base

class Agent(Base):
    __tablename__ = "agents"

    id                    = Column(Integer, primary_key=True, index=True)
    nombre                = Column(String, nullable=False)
    codigo                = Column(String, unique=True, index=True)
    email                 = Column(String)
    area                  = Column(String)
    nombre_leadsales      = Column(String)
    autorizado_cobros     = Column(Boolean, default=False)
    activo                = Column(Boolean, default=True)
    creado                = Column(DateTime(timezone=True), server_default=func.now())
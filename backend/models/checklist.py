from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base

class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id          = Column(Integer, primary_key=True, index=True)
    criterio    = Column(String, nullable=False)
    descripcion = Column(String)
    categoria   = Column(String, default="general")
    peso        = Column(Float, default=1.0)
    creado      = Column(DateTime(timezone=True), server_default=func.now())

class Keyword(Base):
    __tablename__ = "keywords"

    id          = Column(Integer, primary_key=True, index=True)
    item_id     = Column(Integer, ForeignKey("checklist_items.id"))
    palabra     = Column(String, nullable=False)
    tipo        = Column(String, default="palabra")
    categoria   = Column(String, default="general")
    activa      = Column(Boolean, default=True)
    creado      = Column(DateTime(timezone=True), server_default=func.now())
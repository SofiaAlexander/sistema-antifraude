from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models.checklist import ChecklistItem, Keyword

router = APIRouter(prefix="/checklist", tags=["Checklist"])

CATEGORIAS_VALIDAS = ["general", "saludo", "seguimiento", "cierre", "prohibida", "obligatoria"]

class KeywordCreate(BaseModel):
    palabra: str
    tipo: Optional[str] = "palabra"
    categoria: Optional[str] = "general"
    activa: Optional[bool] = True

class KeywordUpdate(BaseModel):
    palabra: Optional[str] = None
    tipo: Optional[str] = None
    categoria: Optional[str] = None
    activa: Optional[bool] = None

class ChecklistItemCreate(BaseModel):
    criterio: str
    descripcion: Optional[str] = None
    categoria: Optional[str] = "general"
    peso: Optional[float] = 1.0
    keywords: Optional[List[KeywordCreate]] = []

class ChecklistItemUpdate(BaseModel):
    criterio: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    peso: Optional[float] = None

@router.get("/")
def get_checklist(db: Session = Depends(get_db)):
    items = db.query(ChecklistItem).all()
    result = []
    for item in items:
        keywords = db.query(Keyword).filter(Keyword.item_id == item.id).all()
        result.append({
            "id": item.id,
            "criterio": item.criterio,
            "descripcion": item.descripcion,
            "categoria": item.categoria,
            "peso": item.peso,
            "keywords": [
                {
                    "id": k.id,
                    "palabra": k.palabra,
                    "tipo": k.tipo,
                    "categoria": k.categoria,
                    "activa": k.activa
                }
                for k in keywords
            ]
        })
    return result

@router.get("/categorias")
def get_categorias():
    return CATEGORIAS_VALIDAS

@router.post("/")
def create_item(data: ChecklistItemCreate, db: Session = Depends(get_db)):
    item = ChecklistItem(
        criterio=data.criterio,
        descripcion=data.descripcion,
        categoria=data.categoria,
        peso=data.peso
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    for kw in data.keywords:
        k = Keyword(
            item_id=item.id,
            palabra=kw.palabra.lower().strip(),
            tipo=kw.tipo,
            categoria=kw.categoria,
            activa=kw.activa
        )
        db.add(k)
    db.commit()
    return {"mensaje": "Item creado correctamente", "id": item.id}

@router.put("/{item_id}")
def update_item(item_id: int, data: ChecklistItemUpdate, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    if data.criterio is not None:
        item.criterio = data.criterio
    if data.descripcion is not None:
        item.descripcion = data.descripcion
    if data.categoria is not None:
        item.categoria = data.categoria
    if data.peso is not None:
        item.peso = data.peso
    db.commit()
    return {"mensaje": "Item actualizado correctamente"}

@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    db.query(Keyword).filter(Keyword.item_id == item_id).delete()
    db.delete(item)
    db.commit()
    return {"mensaje": "Item eliminado correctamente"}

@router.post("/{item_id}/keywords")
def add_keyword(item_id: int, data: KeywordCreate, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    kw = Keyword(
        item_id=item_id,
        palabra=data.palabra.lower().strip(),
        tipo=data.tipo,
        categoria=data.categoria,
        activa=data.activa
    )
    db.add(kw)
    db.commit()
    db.refresh(kw)
    return {"mensaje": "Palabra clave agregada", "id": kw.id}

@router.put("/keywords/{keyword_id}")
def update_keyword(keyword_id: int, data: KeywordUpdate, db: Session = Depends(get_db)):
    kw = db.query(Keyword).filter(Keyword.id == keyword_id).first()
    if not kw:
        raise HTTPException(status_code=404, detail="Palabra clave no encontrada")
    if data.palabra is not None:
        kw.palabra = data.palabra.lower().strip()
    if data.tipo is not None:
        kw.tipo = data.tipo
    if data.categoria is not None:
        kw.categoria = data.categoria
    if data.activa is not None:
        kw.activa = data.activa
    db.commit()
    return {"mensaje": "Palabra clave actualizada"}

@router.delete("/keywords/{keyword_id}")
def delete_keyword(keyword_id: int, db: Session = Depends(get_db)):
    kw = db.query(Keyword).filter(Keyword.id == keyword_id).first()
    if not kw:
        raise HTTPException(status_code=404, detail="Palabra clave no encontrada")
    db.delete(kw)
    db.commit()
    return {"mensaje": "Palabra clave eliminada"}
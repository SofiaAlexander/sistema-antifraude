from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.user import User
from auth import hash_password

router = APIRouter(prefix="/users", tags=["Usuarios"])

ROLES_VALIDOS = ["admin", "supervisor", "auditor", "direccion"]

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None
    password: Optional[str] = None

class UserCreate(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str = "supervisor"

@router.get("/")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "nombre": u.nombre,
            "email": u.email,
            "rol": u.rol,
            "activo": u.activo,
            "creado": str(u.creado)
        }
        for u in users
    ]

@router.post("/")
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    if data.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Rol inválido. Usa: {', '.join(ROLES_VALIDOS)}")
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    user = User(
        nombre=data.nombre,
        email=data.email,
        password=hash_password(data.password),
        rol=data.rol,
        activo=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"mensaje": "Usuario creado correctamente", "id": user.id}

@router.put("/{user_id}")
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if data.nombre is not None:
        user.nombre = data.nombre
    if data.email is not None:
        existing = db.query(User).filter(User.email == data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="El correo ya está en uso")
        user.email = data.email
    if data.rol is not None:
        if data.rol not in ROLES_VALIDOS:
            raise HTTPException(status_code=400, detail=f"Rol inválido. Usa: {', '.join(ROLES_VALIDOS)}")
        user.rol = data.rol
    if data.activo is not None:
        user.activo = data.activo
    if data.password is not None and data.password.strip():
        user.password = hash_password(data.password)
    db.commit()
    return {"mensaje": "Usuario actualizado correctamente"}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
    return {"mensaje": "Usuario eliminado correctamente"}
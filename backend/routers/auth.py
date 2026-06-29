from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.user import User
from auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# --- Schemas ---
class RegisterRequest(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str = "supervisor"

class LoginRequest(BaseModel):
    email: str
    password: str

# --- Registro ---
@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user = User(
        nombre=data.nombre,
        email=data.email,
        password=hash_password(data.password),
        rol=data.rol
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"mensaje": "Usuario creado correctamente", "id": user.id}

# --- Login ---
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "rol": user.rol,
        "nombre": user.nombre
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": user.rol,
        "nombre": user.nombre
    }
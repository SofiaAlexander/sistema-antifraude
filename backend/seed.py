import requests

BASE = "http://127.0.0.1:8000"

usuarios = [
    {"nombre": "Administrador", "email": "admin@empresa.com", "password": "admin123", "rol": "admin"},
    {"nombre": "Laura Supervisora", "email": "supervisor@empresa.com", "password": "super123", "rol": "supervisor"},
    {"nombre": "Carlos Director", "email": "direccion@empresa.com", "password": "dir123", "rol": "direccion"},
    {"nombre": "Ana Auditora", "email": "auditor@empresa.com", "password": "audit123", "rol": "auditor"},
]

agentes = [
    {"nombre": "María García", "codigo": "AG001", "email": "maria@empresa.com", "area": "Ventas", "nombre_leadsales": "maria garcia", "autorizado_cobros": False},
    {"nombre": "Valeria Pérez", "codigo": "AG002", "email": "valeria@empresa.com", "area": "Ventas", "nombre_leadsales": "valeria perez", "autorizado_cobros": False},
    {"nombre": "Daniel Ayala", "codigo": "AG003", "email": "daniel@empresa.com", "area": "Cobranza", "nombre_leadsales": "daniel ayala", "autorizado_cobros": True},
    {"nombre": "Victor Pinedo", "codigo": "AG004", "email": "victor@empresa.com", "area": "Cobranza", "nombre_leadsales": "victor pinedo", "autorizado_cobros": True},
]

print("Creando usuarios...")
for u in usuarios:
    res = requests.post(f"{BASE}/auth/register", json=u)
    if res.status_code == 200:
        print(f"  ✅ {u['nombre']}")
    else:
        print(f"  ❌ {u['nombre']} — {res.json()}")

print("Creando agentes...")
for a in agentes:
    res = requests.post(f"{BASE}/agents/", json=a)
    if res.status_code == 200:
        print(f"  ✅ {a['nombre']}")
    else:
        print(f"  ❌ {a['nombre']} — {res.json()}")

print("Listo.")
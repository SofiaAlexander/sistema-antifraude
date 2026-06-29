import requests

BASE = "http://127.0.0.1:8000"

checklist = [
    {
        "criterio": "Palabras de alerta de fraude",
        "descripcion": "Detecta uso de métodos de pago personales no autorizados",
        "categoria": "prohibida",
        "keywords": [
            {"palabra": "mi paypal", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "cuenta nueva", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "hsbc", "tipo": "palabra", "categoria": "prohibida"},
            {"palabra": "banorte", "tipo": "palabra", "categoria": "prohibida"},
            {"palabra": "inbursa", "tipo": "palabra", "categoria": "prohibida"},
            {"palabra": "nu banco", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "esta cuenta nueva", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "nuevos datos", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "nuevo metodo", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "mi tarjeta", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "mi cuenta", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "mi banco", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "pagame directo", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "mejor por aqui", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "este stripe", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "stripe nuevo", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "paypal nuevo", "tipo": "frase", "categoria": "prohibida"},
            {"palabra": "link de pago", "tipo": "frase", "categoria": "prohibida"},
        ]
    },
    {
        "criterio": "Método de pago autorizado",
        "descripcion": "Verifica que se usen los métodos de pago oficiales de la empresa",
        "categoria": "obligatoria",
        "keywords": [
            {"palabra": "728969000123722691", "tipo": "palabra", "categoria": "obligatoria"},
            {"palabra": "4217 4701 0274 1341", "tipo": "frase", "categoria": "obligatoria"},
            {"palabra": "728969000150028177", "tipo": "palabra", "categoria": "obligatoria"},
            {"palabra": "4217 4702 7385 1556", "tipo": "frase", "categoria": "obligatoria"},
            {"palabra": "728969000167859902", "tipo": "palabra", "categoria": "obligatoria"},
            {"palabra": "4217 4702 3037 4171", "tipo": "frase", "categoria": "obligatoria"},
            {"palabra": "j3cm6np6klqhc", "tipo": "palabra", "categoria": "obligatoria"},
            {"palabra": "holafelix.com", "tipo": "palabra", "categoria": "obligatoria"},
            {"palabra": "creativasapiens@gmail.com", "tipo": "palabra", "categoria": "obligatoria"},
        ]
    },
    {
        "criterio": "Solicitud de comprobante",
        "descripcion": "Verifica que el agente solicite comprobante de pago",
        "categoria": "obligatoria",
        "keywords": [
            {"palabra": "comprobante", "tipo": "palabra", "categoria": "obligatoria"},
            {"palabra": "foto del pago", "tipo": "frase", "categoria": "obligatoria"},
            {"palabra": "manda foto", "tipo": "frase", "categoria": "obligatoria"},
            {"palabra": "validar", "tipo": "palabra", "categoria": "obligatoria"},
            {"palabra": "envia foto", "tipo": "frase", "categoria": "obligatoria"},
        ]
    }
]

print("Creando checklist...")
for item in checklist:
    keywords = item["keywords"]
    payload = {
        "criterio": item["criterio"],
        "descripcion": item["descripcion"],
        "categoria": item["categoria"],
        "keywords": []
    }
    res = requests.post(f"{BASE}/checklist/", json=payload)
    if res.status_code == 200:
        item_id = res.json()["id"]
        print(f"  ✅ Criterio: {item['criterio']} (id: {item_id})")
        for kw in keywords:
            res_kw = requests.post(f"{BASE}/checklist/{item_id}/keywords", json=kw)
            if res_kw.status_code == 200:
                print(f"     ✅ {kw['palabra']}")
            else:
                print(f"     ❌ {kw['palabra']} — status {res_kw.status_code}")
    else:
        print(f"  ❌ {item['criterio']} — status {res.status_code}")

print("Listo.")
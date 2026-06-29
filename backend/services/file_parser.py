import csv
import io
import re
from typing import List, Dict

def parsear_txt(contenido: str) -> List[Dict]:
    conversaciones = []
    bloques = contenido.strip().split("===")
    for bloque in bloques:
        bloque = bloque.strip()
        if not bloque:
            continue
        datos = {"nombre_agente": "", "fecha": "", "cliente": "", "conversacion": ""}
        if "---" in bloque:
            cabecera, texto = bloque.split("---", 1)
        else:
            cabecera = ""
            texto = bloque
        for linea in cabecera.strip().splitlines():
            if linea.upper().startswith("AGENTE:"):
                datos["nombre_agente"] = linea.split(":", 1)[1].strip()
            elif linea.upper().startswith("FECHA:"):
                datos["fecha"] = linea.split(":", 1)[1].strip()
            elif linea.upper().startswith("CLIENTE:"):
                datos["cliente"] = linea.split(":", 1)[1].strip()
        datos["conversacion"] = texto.strip()
        if datos["conversacion"]:
            conversaciones.append(datos)
    return conversaciones

def parsear_csv(contenido: str) -> List[Dict]:
    conversaciones = []
    reader = csv.DictReader(io.StringIO(contenido))
    for row in reader:
        row_lower = {k.lower().strip(): v for k, v in row.items()}
        datos = {
            "nombre_agente": row_lower.get("agente", ""),
            "fecha": row_lower.get("fecha", ""),
            "cliente": row_lower.get("cliente", ""),
            "conversacion": row_lower.get("conversacion", "")
        }
        if datos["conversacion"]:
            conversaciones.append(datos)
    return conversaciones

def parsear_xlsx(contenido_bytes: bytes) -> List[Dict]:
    import openpyxl
    conversaciones = []
    wb = openpyxl.load_workbook(io.BytesIO(contenido_bytes))
    ws = wb.active
    headers = []
    for row in ws.iter_rows(values_only=True):
        if not headers:
            headers = [str(h).lower().strip() if h else "" for h in row]
            continue
        if not any(row):
            continue
        row_dict = dict(zip(headers, row))
        datos = {
            "nombre_agente": str(row_dict.get("agente", "") or ""),
            "fecha": str(row_dict.get("fecha", "") or ""),
            "cliente": str(row_dict.get("cliente", "") or ""),
            "conversacion": str(row_dict.get("conversacion", "") or "")
        }
        if datos["conversacion"]:
            conversaciones.append(datos)
    return conversaciones

def parsear_leadsales(texto: str, agentes_map: dict) -> list:
    lineas = texto.strip().splitlines()
    patron_fecha = re.compile(
        r'^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?\s+\d+,\s+\d{4}',
        re.IGNORECASE
    )

    conversaciones_por_agente = {}
    for nombre, agent_id in agentes_map.items():
        conversaciones_por_agente[agent_id] = {
            "agent_id": agent_id,
            "nombre_agente": nombre,
            "mensajes": []
        }

    agente_actual = None
    mensaje_actual = []
    es_mensaje_agente = False

    i = 0
    while i < len(lineas):
        linea = lineas[i].strip()

        if not linea:
            i += 1
            continue

        linea_lower = linea.lower()

        nombre_detectado = None
        for nombre in agentes_map.keys():
            if linea_lower == nombre.lower():
                nombre_detectado = nombre
                break

        if nombre_detectado is not None:
            if mensaje_actual and agente_actual is not None:
                agent_id = agentes_map[agente_actual]
                conversaciones_por_agente[agent_id]["mensajes"].append(" ".join(mensaje_actual))
                mensaje_actual = []
            agente_actual = nombre_detectado
            es_mensaje_agente = True
            i += 1
            continue

        if patron_fecha.match(linea):
            if es_mensaje_agente and agente_actual:
                if mensaje_actual:
                    agent_id = agentes_map[agente_actual]
                    conversaciones_por_agente[agent_id]["mensajes"].append(" ".join(mensaje_actual))
                    mensaje_actual = []
            else:
                agente_actual = None
                es_mensaje_agente = False
                mensaje_actual = []
            i += 1
            continue

        if es_mensaje_agente and agente_actual:
            mensaje_actual.append(linea)

        i += 1

    if mensaje_actual and agente_actual and agente_actual in agentes_map:
        agent_id = agentes_map[agente_actual]
        conversaciones_por_agente[agent_id]["mensajes"].append(" ".join(mensaje_actual))

    resultado = []
    for agent_id, data in conversaciones_por_agente.items():
        if data["mensajes"]:
            resultado.append({
                "agent_id": agent_id,
                "nombre_agente": data["nombre_agente"],
                "contenido": "\n".join(data["mensajes"])
            })

    return resultado
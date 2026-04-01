# Truco

Juego de Truco en HTML, CSS y JavaScript con modo de un jugador contra una IA local.

## Modos de juego

- **Dos jugadores:** funciona directamente abriendo `index.html`, sin instalar nada.
- **Jugador contra IA:** requiere levantar un servidor local con Python (ver instrucciones abajo).

---

## Habilitar la IA (servidor local)

La IA corre en un backend de FastAPI que se comunica con el juego via HTTP. Seguí estos pasos según tu sistema operativo.

### Requisitos previos

Necesitás tener **Python 3.10 o superior** instalado.

- **Windows:** descargalo desde https://www.python.org/downloads/ — durante la instalación, tildá la opción **"Add Python to PATH"**.
- **Linux/macOS:** en la mayoría de los sistemas ya viene instalado. Verificá con `python3 --version`.

---

### Windows (PowerShell)

1. Abrí PowerShell y navegá a la carpeta del proyecto:

```powershell
cd "C:\ruta\a\Truco"
```

2. Creá el entorno virtual:

```powershell
python -m venv .venv
```

3. Instalá las dependencias:

```powershell
.\.venv\Scripts\pip install -r requirements.txt
```

4. Iniciá el servidor:

```powershell
.\.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

5. Verificá que esté funcionando abriendo en el navegador:
   [http://127.0.0.1:8000/salud](http://127.0.0.1:8000/salud)
   Debería responder: `{"estado":"ok"}`

6. Abrí `index.html` y elegí **"Jugar contra IA"**.

> Si aparece el error `address already in use`, cerrá la terminal anterior y volvé a ejecutar el paso 4.

---

### Linux / macOS (terminal)

1. Navegá a la carpeta del proyecto:

```bash
cd /ruta/a/Truco
```

2. Creá el entorno virtual:

```bash
python3 -m venv .venv
```

3. Instalá las dependencias:

```bash
./.venv/bin/pip install -r requirements.txt
```

4. Iniciá el servidor:

```bash
./.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

5. Verificá que esté funcionando:

```bash
curl -s http://127.0.0.1:8000/salud
```

Debería responder: `{"estado":"ok"}`

6. Abrí `index.html` y elegí **"Jugar contra IA"**.

> Si aparece `address already in use`, cerrá el proceso anterior con `pkill -f "uvicorn backend.main"` y volvé a iniciar.

---

## Alcance de esta primera version de IA

- Juega cartas automaticamente.
- Responde Envido.
- Responde Truco y puede subir a Retruco con una heuristica simple.
- Usa reglas sencillas, pensadas como base para mejorar luego.

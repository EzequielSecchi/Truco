# Truco

Juego de Truco en HTML, CSS y JavaScript.

## Modos de juego

- Dos jugadores: funciona como el tablero original.
- Jugador contra IA: el rival responde y juega cartas usando un backend en FastAPI.

## Levantar la IA

1. Ir a la carpeta del proyecto:

```bash
cd "/home/foxitrix/Escritorio/Pc formateada/facultad/Programacion/Truco"
```

2. Instalar dependencias (usando el entorno virtual del proyecto):

```bash
./.venv/bin/python -m pip install -r requirements.txt
```

3. Iniciar el backend:

```bash
./.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

4. Comprobar que la IA esta activa:

```bash
curl -s http://127.0.0.1:8000/salud
```

Deberia responder: `{"estado":"ok"}`

5. Abrir el juego y elegir "Jugar contra IA".

Si aparece `address already in use`, cerrar backend previo y volver a iniciar:

```bash
pkill -f "uvicorn backend.main"
./.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

## Alcance de esta primera version de IA

- Juega cartas automaticamente.
- Responde Envido.
- Responde Truco y puede subir a Retruco con una heuristica simple.
- Usa reglas sencillas, pensadas como base para mejorar luego.

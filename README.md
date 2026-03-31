# Truco

Juego de Truco en HTML, CSS y JavaScript.

## Modos de juego

- Dos jugadores: funciona como el tablero original.
- Jugador contra IA: el rival responde y juega cartas usando un backend en FastAPI.

## Levantar la IA

1. Instalar dependencias:

```bash
pip install -r requirements.txt
```

2. Iniciar el backend:

```bash
uvicorn backend.main:app --reload
```

3. Abrir el juego y elegir "Jugar contra IA".

## Alcance de esta primera version de IA

- Juega cartas automaticamente.
- Responde Envido.
- Responde Truco y puede subir a Retruco con una heuristica simple.
- Usa reglas sencillas, pensadas como base para mejorar luego.

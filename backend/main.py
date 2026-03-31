import random
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title='Truco IA')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

ORDEN_PRIORIDAD_TRUCO = [
    [25],
    [37],
    [31],
    [7],
    [3, 15, 27, 39],
    [2, 14, 26, 38],
    [13, 1],
    [12, 24, 36, 48],
    [11, 23, 35, 47],
    [10, 22, 34, 46],
    [19, 43],
    [6, 18, 30, 42],
    [5, 17, 29, 41],
    [4, 16, 28, 40],
]

CARTAS_ORO = {1, 2, 3, 4, 5, 6, 7, 10, 11, 12}
CARTAS_COPA = {13, 14, 15, 16, 17, 18, 19, 22, 23, 24}
CARTAS_ESPADA = {25, 26, 27, 28, 29, 30, 31, 34, 35, 36}
CARTAS_BASTO = {37, 38, 39, 40, 41, 42, 43, 46, 47, 48}

PRIORIDAD_CARTAS: dict[int, int] = {}
for indice, grupo in enumerate(ORDEN_PRIORIDAD_TRUCO):
    prioridad = len(ORDEN_PRIORIDAD_TRUCO) - indice
    for numero in grupo:
        PRIORIDAD_CARTAS[numero] = prioridad


class TrucoState(BaseModel):
    nivel_aceptado: int
    nivel_pendiente: int | None = None
    puede_escalar_ahora: str | None = None


class EnvidoState(BaseModel):
    habilitado: bool
    fue_cantado: bool
    tipo_pendiente: str | None = None


class DecisionRequest(BaseModel):
    fase: Literal['jugar-carta', 'responder-truco', 'responder-envido', 'decidir-canto']
    turno_actual: str | None
    mano: str
    dificultad: Literal['facil', 'normal', 'dificil'] = 'normal'
    puntos: dict[str, int]
    puntos_objetivo: int
    bazas: dict[str, dict[str, int | None | str]]
    bazas_ganadas: dict[str, int]
    progreso_lado: dict[str, int]
    indice_baza_actual: int
    baza_actual: dict[str, int | None | str] | None = None
    cartas_jugador: list[int]
    cartas_rival: list[int]
    estado_truco: TrucoState
    estado_envido: EnvidoState
    nivel_pendiente: int | None = None
    canto: str | None = None


class DecisionResponse(BaseModel):
    accion: str
    carta: int | None = None
    acepta: bool | None = None


@app.get('/salud')
def salud() -> dict[str, str]:
    return {'estado': 'ok'}


@app.post('/ia/decidir', response_model=DecisionResponse)
def decidir(req: DecisionRequest) -> DecisionResponse:
    if req.fase == 'jugar-carta':
        carta = elegir_carta(req.cartas_rival, req.baza_actual, req.dificultad)
        return DecisionResponse(accion='jugar-carta', carta=carta)

    if req.fase == 'responder-envido':
        acepta = decidir_envido(req.cartas_rival, req.canto or 'envido', req.puntos, req.puntos_objetivo, req.dificultad)
        return DecisionResponse(accion='responder-envido', acepta=acepta)

    if req.fase == 'responder-truco':
        accion, acepta = decidir_truco(req.cartas_rival, req.nivel_pendiente or 2, req.dificultad)
        return DecisionResponse(accion=accion, acepta=acepta)

    if req.fase == 'decidir-canto':
        accion = decidir_canto(req)
        return DecisionResponse(accion=accion)

    return DecisionResponse(accion='sin-accion')


def perfil_dificultad(dificultad: str) -> dict[str, float]:
    if dificultad == 'facil':
        return {
            'error_jugada': 0.5,
            'error_canto': 0.45,
            'error_respuesta': 0.35,
            'penalidad_fuerza': 2.8,
            'penalidad_envido': 5.0,
            'truco_subir': 13.0,
            'truco_aceptar': 9.5,
            'retruco_aceptar': 11.5,
            'vale_cuatro_aceptar': 13.5,
            'cantar_envido': 28.0,
            'cantar_real': 30.0,
            'cantar_falta': 32.0,
        }
    if dificultad == 'dificil':
        return {
            'error_jugada': 0.0,
            'error_canto': 0.0,
            'error_respuesta': 0.0,
            'penalidad_fuerza': 0.0,
            'penalidad_envido': 0.0,
            'truco_subir': 10.0,
            'truco_aceptar': 6.0,
            'retruco_aceptar': 8.0,
            'vale_cuatro_aceptar': 11.0,
            'cantar_envido': 24.0,
            'cantar_real': 27.0,
            'cantar_falta': 29.0,
        }
    return {
        'error_jugada': 0.22,
        'error_canto': 0.2,
        'error_respuesta': 0.16,
        'penalidad_fuerza': 1.3,
        'penalidad_envido': 2.2,
        'truco_subir': 11.0,
        'truco_aceptar': 8.0,
        'retruco_aceptar': 10.0,
        'vale_cuatro_aceptar': 12.5,
        'cantar_envido': 27.0,
        'cantar_real': 29.0,
        'cantar_falta': 30.0,
    }


def decidir_canto(req: DecisionRequest) -> str:
    perfil = perfil_dificultad(req.dificultad)
    puede_escalar = req.estado_truco.puede_escalar_ahora == 'rival'
    es_turno = req.turno_actual == 'rival'

    if random.random() < perfil['error_canto']:
        return 'nada'

    # Envido solo cuando es el turno del rival para jugar cartas
    if es_turno and req.estado_envido.habilitado and not req.estado_envido.fue_cantado:
        valor = calcular_envido(req.cartas_rival)
        if valor >= perfil['cantar_falta']:
            return 'cantar-faltaenvido'
        if valor >= perfil['cantar_real']:
            return 'cantar-realenvido'
        if valor >= perfil['cantar_envido']:
            return 'cantar-envido'

    # Truco si es turno del rival o puede escalar al siguiente nivel
    if (puede_escalar or es_turno) and req.cartas_rival:
        siguiente_nivel = req.estado_truco.nivel_aceptado + 1
        if siguiente_nivel <= 4:
            prioridades = sorted(
                (prioridad_carta(c) for c in req.cartas_rival), reverse=True
            )
            fuerza = (sum(prioridades[:2]) / min(2, len(prioridades))) - perfil['penalidad_fuerza']
            umbral = {2: perfil['truco_aceptar'], 3: perfil['retruco_aceptar'], 4: perfil['vale_cuatro_aceptar']}.get(siguiente_nivel, perfil['vale_cuatro_aceptar'])
            if fuerza >= umbral:
                return 'cantar-truco'

    return 'nada'


def elegir_carta(cartas_rival: list[int], baza_actual: dict[str, int | None | str] | None, dificultad: str) -> int | None:
    if not cartas_rival:
        return None

    perfil = perfil_dificultad(dificultad)
    cartas_ordenadas = sorted(cartas_rival, key=prioridad_carta)

    if random.random() < perfil['error_jugada']:
        if dificultad == 'facil':
            # En facil, el error es más evidente: juega la peor carta disponible.
            return cartas_ordenadas[0]
        return random.choice(cartas_rival)

    carta_jugador = None
    if baza_actual:
        valor = baza_actual.get('jugador')
        if isinstance(valor, int):
            carta_jugador = valor

    if carta_jugador is None:
        return cartas_ordenadas[0]

    cartas_que_ganan = [carta for carta in cartas_ordenadas if prioridad_carta(carta) > prioridad_carta(carta_jugador)]
    if cartas_que_ganan:
        return cartas_que_ganan[0]

    return cartas_ordenadas[0]


def decidir_truco(cartas_rival: list[int], nivel_pendiente: int, dificultad: str) -> tuple[str, bool]:
    if not cartas_rival:
        return 'rechazar', False

    perfil = perfil_dificultad(dificultad)
    prioridades = sorted((prioridad_carta(carta) for carta in cartas_rival), reverse=True)
    fuerza = (sum(prioridades[:2]) / min(2, len(prioridades))) - perfil['penalidad_fuerza']

    if random.random() < perfil['error_respuesta']:
        fuerza -= 2

    if nivel_pendiente <= 2:
        if fuerza >= perfil['truco_subir']:
            return 'subir', True
        return 'aceptar', fuerza >= perfil['truco_aceptar']

    if nivel_pendiente == 3:
        return 'aceptar', fuerza >= perfil['retruco_aceptar']

    return 'aceptar', fuerza >= perfil['vale_cuatro_aceptar']


def decidir_envido(cartas_rival: list[int], canto: str, puntos: dict[str, int], puntos_objetivo: int, dificultad: str) -> bool:
    perfil = perfil_dificultad(dificultad)
    valor = calcular_envido(cartas_rival) - perfil['penalidad_envido']
    puntos_rival = puntos.get('rival', 0)
    cerca_de_ganar = puntos_rival >= puntos_objetivo - 4

    if random.random() < perfil['error_respuesta']:
        valor -= 2

    if canto == 'faltaenvido':
        return valor >= perfil['cantar_falta'] or cerca_de_ganar
    if canto == 'realenvido':
        return valor >= perfil['cantar_real']
    return valor >= perfil['cantar_envido']


def prioridad_carta(codigo: int) -> int:
    return PRIORIDAD_CARTAS.get(codigo, 0)


def obtener_palo(codigo: int) -> str | None:
    if codigo in CARTAS_ORO:
        return 'oro'
    if codigo in CARTAS_COPA:
        return 'copa'
    if codigo in CARTAS_ESPADA:
        return 'espada'
    if codigo in CARTAS_BASTO:
        return 'basto'
    return None


def valor_envido(codigo: int) -> int:
    valor = ((codigo - 1) % 12) + 1
    return 0 if valor >= 10 else valor


def calcular_envido(cartas: list[int]) -> int:
    if not cartas:
        return 0

    por_palo: dict[str, list[int]] = {
        'oro': [],
        'copa': [],
        'espada': [],
        'basto': [],
    }

    for carta in cartas:
        palo = obtener_palo(carta)
        if palo is not None:
            por_palo[palo].append(valor_envido(carta))

    mejor = 0
    for valores in por_palo.values():
        if len(valores) >= 2:
            ordenados = sorted(valores, reverse=True)
            mejor = max(mejor, ordenados[0] + ordenados[1] + 20)

    if mejor > 0:
        return mejor

    return max(valor_envido(carta) for carta in cartas)

// función para obtener un número aleatorio entre min y max
function obtenerAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const ANCHO_CARTA = 131;
const ALTO_CARTA = 200;
const ESCALA_CARTA = 0.66;
const GAP_CARTAS = -40;
const DORSO_CARTA = 'Cartas/__50.gif';
const DESPLAZAMIENTO_MANO_JUGADOR = 200;
const DESPLAZAMIENTO_MANO_RIVAL = -220;
const CARTAS_ORO = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
const CARTAS_COPA = [13, 14, 15, 16, 17, 18, 19, 22, 23, 24];
const CARTAS_ESPADA = [25, 26, 27, 28, 29, 30, 31, 34, 35, 36];
const CARTAS_BASTO = [37, 38, 39, 40, 41, 42, 43, 46, 47, 48];
const PALOS_CARTAS = {
    oro: new Set(CARTAS_ORO),
    copa: new Set(CARTAS_COPA),
    espada: new Set(CARTAS_ESPADA),
    basto: new Set(CARTAS_BASTO)
};
const ORDEN_PRIORIDAD_TRUCO = [
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
    [4, 16, 28, 40]
];
const PRIORIDAD_CARTAS = new Map();

ORDEN_PRIORIDAD_TRUCO.forEach((grupo, indice) => {
    const prioridad = ORDEN_PRIORIDAD_TRUCO.length - indice;
    grupo.forEach((numeroCarta) => PRIORIDAD_CARTAS.set(numeroCarta, prioridad));
});

// números de cartas (en imagenes) a excluir
const cartasExcluidas = [8, 9, 20, 21, 32, 33, 44, 45];

let cartaEnArrastre = null;
let offsetX = 0;
let offsetY = 0;
let ultimoMouseX = 0;
let ultimoMouseY = 0;
let contadorCapas = 10;
let turnoActual = null;
let partidaIniciada = false;
let puntosObjetivo = 15;
let mano = 'jugador';
let ganadorPartida = null;

const puntos = {
    jugador: 0,
    rival: 0
};

const progresoLado = {
    jugador: 0,
    rival: 0
};

const bazas = {
    0: { jugador: null, rival: null, ganador: null },
    1: { jugador: null, rival: null, ganador: null },
    2: { jugador: null, rival: null, ganador: null }
};

const bazasGanadas = {
    jugador: 0,
    rival: 0
};

const manosPorLado = {
    jugador: [],
    rival: []
};

const estadoEnvido = {
    habilitado: true,
    fueCantado: false,
    seleccionando: false,
    pendiente: false,
    esperandoContinuar: false,
    cantor: null,
    tipoCantoPendiente: null
};

const estadoTruco = {
    nivelAceptado: 1,
    nivelPendiente: null,
    pendiente: false,
    esperandoContinuar: false,
    cantor: null,
    responder: null,
    puedeEscalarAhora: null
};

let ui = null;

function obtenerUI() {
    if (ui) {
        return ui;
    }

    ui = {
        marcador: document.getElementById('marcador'),
        turnoIndicador: document.getElementById('turnoIndicador'),
        btnEnvidoJugador: document.getElementById('btnEnvidoJugador'),
        btnEnvidoRival: document.getElementById('btnEnvidoRival'),
        btnTrucoJugador: document.getElementById('btnTrucoJugador'),
        btnTrucoRival: document.getElementById('btnTrucoRival'),
        btnMazoJugador: document.getElementById('btnMazoJugador'),
        btnMazoRival: document.getElementById('btnMazoRival'),
        panelCantosEnvido: document.getElementById('panelCantosEnvido'),
        textoCantosEnvido: document.getElementById('textoCantosEnvido'),
        btnCantarEnvido: document.getElementById('btnCantarEnvido'),
        btnCantarRealEnvido: document.getElementById('btnCantarRealEnvido'),
        btnCantarFaltaEnvido: document.getElementById('btnCantarFaltaEnvido'),
        btnCancelarCantoEnvido: document.getElementById('btnCancelarCantoEnvido'),
        panelRespuestaEnvido: document.getElementById('panelRespuestaEnvido'),
        textoRespuestaEnvido: document.getElementById('textoRespuestaEnvido'),
        btnQuieroEnvido: document.getElementById('btnQuieroEnvido'),
        btnNoQuieroEnvido: document.getElementById('btnNoQuieroEnvido'),
        panelResultadoEnvido: document.getElementById('panelResultadoEnvido'),
        textoResultadoEnvido: document.getElementById('textoResultadoEnvido'),
        btnContinuarEnvido: document.getElementById('btnContinuarEnvido'),
        panelRespuestaTruco: document.getElementById('panelRespuestaTruco'),
        textoRespuestaTruco: document.getElementById('textoRespuestaTruco'),
        btnQuieroTruco: document.getElementById('btnQuieroTruco'),
        btnNoQuieroTruco: document.getElementById('btnNoQuieroTruco'),
        btnSubirTruco: document.getElementById('btnSubirTruco'),
        panelInicioPartida: document.getElementById('panelInicioPartida'),
        btnPartida15: document.getElementById('btnPartida15'),
        btnPartida30: document.getElementById('btnPartida30'),
        panelFinPartida: document.getElementById('panelFinPartida'),
        textoFinPartida: document.getElementById('textoFinPartida'),
        btnReiniciarPartida: document.getElementById('btnReiniciarPartida')
    };

    return ui;
}

function nombreLado(lado) {
    return lado === 'jugador' ? 'Jugador' : 'Rival';
}

function ladoOpuesto(lado) {
    return lado === 'jugador' ? 'rival' : 'jugador';
}

function actualizarMarcador() {
    const elementos = obtenerUI();
    elementos.marcador.textContent = `Jugador ${puntos.jugador} - Rival ${puntos.rival} (a ${puntosObjetivo})`;
}

function actualizarIndicadorTurno() {
    const elementos = obtenerUI();

    if (!partidaIniciada) {
        elementos.turnoIndicador.textContent = 'Turno: Elegi partida';
        return;
    }
    if (ganadorPartida) {
        elementos.turnoIndicador.textContent = `Turno: Gano ${nombreLado(ganadorPartida)}`;
        return;
    }
    if (estadoEnvido.pendiente) {
        elementos.turnoIndicador.textContent = 'Turno: Respuesta de Envido';
        return;
    }
    if (estadoEnvido.seleccionando) {
        elementos.turnoIndicador.textContent = 'Turno: Elegir canto de Envido';
        return;
    }
    if (estadoEnvido.esperandoContinuar) {
        elementos.turnoIndicador.textContent = 'Turno: Continuar Envido';
        return;
    }
    if (estadoTruco.pendiente) {
        elementos.turnoIndicador.textContent = 'Turno: Respuesta de Truco';
        return;
    }
    if (estadoTruco.esperandoContinuar) {
        elementos.turnoIndicador.textContent = 'Turno: Continuar Truco';
        return;
    }
    if (turnoActual === null) {
        elementos.turnoIndicador.textContent = 'Turno: Mano terminada';
        return;
    }

    elementos.turnoIndicador.textContent = `Turno: ${nombreLado(turnoActual)}`;
}

function actualizarBotones() {
    const elementos = obtenerUI();
    const bloqueadoGeneral = !partidaIniciada || !!ganadorPartida || estadoEnvido.seleccionando || estadoEnvido.pendiente || estadoEnvido.esperandoContinuar || estadoTruco.pendiente || estadoTruco.esperandoContinuar;

    // Si ambos jugaron en la primera mano, no se puede cantar envido
    if (bazas[0].jugador !== null && bazas[0].rival !== null) {
        estadoEnvido.habilitado = false;
    }

    const puedeCantarEnvido = !bloqueadoGeneral && estadoEnvido.habilitado;
        const puedeCantarTrucoJugador = !bloqueadoGeneral && obtenerSiguienteNivelTruco('jugador') !== null;
        const puedeCantarTrucoRival = !bloqueadoGeneral && obtenerSiguienteNivelTruco('rival') !== null;
    const puedeIrAlMazo = !bloqueadoGeneral && turnoActual !== null;

    elementos.btnEnvidoJugador.disabled = !puedeCantarEnvido || turnoActual !== 'jugador';
    elementos.btnEnvidoRival.disabled = !puedeCantarEnvido || turnoActual !== 'rival';
        elementos.btnTrucoJugador.disabled = !puedeCantarTrucoJugador || turnoActual !== 'jugador';
        elementos.btnTrucoRival.disabled = !puedeCantarTrucoRival || turnoActual !== 'rival';
    elementos.btnMazoJugador.disabled = !puedeIrAlMazo || turnoActual !== 'jugador';
    elementos.btnMazoRival.disabled = !puedeIrAlMazo || turnoActual !== 'rival';

    const textoTrucoJugador = obtenerTextoSiguienteTruco('jugador');
    const textoTrucoRival = obtenerTextoSiguienteTruco('rival');
    elementos.btnTrucoJugador.textContent = textoTrucoJugador || 'Truco';
    elementos.btnTrucoRival.textContent = textoTrucoRival || 'Truco';

    actualizarIndicadorTurno();
}


function sumarPuntos(lado, cantidad) {
    puntos[lado] += cantidad;
    actualizarMarcador();

    if (puntos[lado] >= puntosObjetivo) {
        ganadorPartida = lado;
        const elementos = obtenerUI();
        elementos.textoFinPartida.textContent = `Gano ${nombreLado(lado)} ${puntos[lado]} a ${puntos[ladoOpuesto(lado)]}`;
        elementos.panelFinPartida.classList.remove('panel-envido--hidden');
        turnoActual = null;
        actualizarBotones();
        return true;
    }
    return false;
}

function compararCartas(codigoJugador, codigoRival) {
    const prioridadJugador = PRIORIDAD_CARTAS.get(codigoJugador) || 0;
    const prioridadRival = PRIORIDAD_CARTAS.get(codigoRival) || 0;

    if (prioridadJugador > prioridadRival) {
        return 'jugador';
    }
    if (prioridadRival > prioridadJugador) {
        return 'rival';
    }
    return mano;
}

function evaluarBaza(indice) {
    const baza = bazas[indice];
    if (baza.jugador === null || baza.rival === null || baza.ganador) {
        return;
    }

    baza.ganador = compararCartas(baza.jugador, baza.rival);
    bazasGanadas[baza.ganador] += 1;
}

function obtenerGanadorMano() {
    if (bazasGanadas.jugador > bazasGanadas.rival) {
        return 'jugador';
    }
    if (bazasGanadas.rival > bazasGanadas.jugador) {
        return 'rival';
    }
    return mano;
}

function resetearEstadoDeMano() {
    progresoLado.jugador = 0;
    progresoLado.rival = 0;
    bazasGanadas.jugador = 0;
    bazasGanadas.rival = 0;

    [0, 1, 2].forEach((indice) => {
        bazas[indice].jugador = null;
        bazas[indice].rival = null;
        bazas[indice].ganador = null;
    });

    const casillas = document.querySelectorAll('.casilla');
    casillas.forEach((casilla) => {
        casilla.classList.remove('ocupada');
        casilla.dataset.cantidad = '0';
    });

    estadoEnvido.habilitado = true;
    estadoEnvido.fueCantado = false;
    estadoEnvido.seleccionando = false;
    estadoEnvido.pendiente = false;
    estadoEnvido.esperandoContinuar = false;
    estadoEnvido.cantor = null;
    estadoEnvido.tipoCantoPendiente = null;

    estadoTruco.nivelAceptado = 1;
    estadoTruco.nivelPendiente = null;
    estadoTruco.pendiente = false;
    estadoTruco.esperandoContinuar = false;
    estadoTruco.cantor = null;
    estadoTruco.responder = null;
    estadoTruco.puedeEscalarAhora = null;

    contadorCapas = 10;
    turnoActual = mano;

    const elementos = obtenerUI();
    elementos.panelCantosEnvido.classList.add('panel-envido--hidden');
    elementos.panelRespuestaEnvido.classList.add('panel-envido--hidden');
    elementos.panelResultadoEnvido.classList.add('panel-envido--hidden');
    elementos.panelRespuestaTruco.classList.add('panel-envido--hidden');

    actualizarBotones();
}

function repartirCartasSinRepetir() {
    const seisCartas = [];
    while (seisCartas.length < 6) {
        const numero = obtenerAleatorio(1, 48);
        if (!seisCartas.includes(numero) && !cartasExcluidas.includes(numero)) {
            seisCartas.push(numero);
        }
    }

    return {
        jugador: seisCartas.slice(0, 3),
        rival: seisCartas.slice(3, 6)
    };
}

function crearMano(cartas, contenedor, side, desplazamientoY) {
    const totalAncho = (ANCHO_CARTA * 3) + (GAP_CARTAS * 2);
    const startX = -totalAncho / 2;
    const startY = -ALTO_CARTA / 2 + desplazamientoY;

    cartas.forEach((numero, index) => {
        const img = document.createElement('img');
        const numeroFormato = String(numero).padStart(2, '0');

        img.src = `Cartas/__${numeroFormato}.gif`;
        img.alt = `Carta ${numero}`;
        img.className = 'carta';
        img.dataset.side = side;
        img.dataset.cardCode = String(numero);
        img.dataset.colocada = 'false';
        img.style.transform = `scale(${ESCALA_CARTA})`;

        const cartaX = startX + (index * (ANCHO_CARTA + GAP_CARTAS));
        img.style.left = (window.innerWidth / 2 + cartaX) + 'px';
        img.style.top = (window.innerHeight / 2 + startY) + 'px';

        img.dataset.initialLeft = img.style.left;
        img.dataset.initialTop = img.style.top;
        img.dataset.initialTransform = img.style.transform;

        contenedor.appendChild(img);
    });
}

function iniciarNuevaMano() {
    if (ganadorPartida) {
        return;
    }

    const reparto = repartirCartasSinRepetir();
    const cartasJugador = reparto.jugador;
    const cartasRival = reparto.rival;
    const contenedorJugador = document.getElementById('contenedorCartasJugador');
    const contenedorRival = document.getElementById('contenedorCartasRival');

    contenedorJugador.querySelectorAll('.carta').forEach((carta) => carta.remove());
    contenedorRival.querySelectorAll('.carta').forEach((carta) => carta.remove());

    manosPorLado.jugador = [...cartasJugador];
    manosPorLado.rival = [...cartasRival];

    crearMano(cartasJugador, contenedorJugador, 'jugador', DESPLAZAMIENTO_MANO_JUGADOR);
    crearMano(cartasRival, contenedorRival, 'rival', DESPLAZAMIENTO_MANO_RIVAL);

    resetearEstadoDeMano();
}

function aplicarCapasSegunPrioridad(cartaRecienJugada, indiceCasilla) {
    const cartasEnCasilla = Array.from(document.querySelectorAll(`.carta[data-casilla-index="${indiceCasilla}"]`));

    if (cartasEnCasilla.length === 1) {
        cartaRecienJugada.style.zIndex = String(contadorCapas);
        contadorCapas += 1;
        return;
    }

    if (cartasEnCasilla.length === 2) {
        const otraCarta = cartasEnCasilla.find((item) => item !== cartaRecienJugada);
        const prioridadNueva = PRIORIDAD_CARTAS.get(Number(cartaRecienJugada.dataset.cardCode)) || 0;
        const prioridadOtra = PRIORIDAD_CARTAS.get(Number(otraCarta.dataset.cardCode)) || 0;
        const base = contadorCapas;
        contadorCapas += 2;

        if (prioridadNueva >= prioridadOtra) {
            otraCarta.style.zIndex = String(base);
            cartaRecienJugada.style.zIndex = String(base + 1);
        } else {
            cartaRecienJugada.style.zIndex = String(base);
            otraCarta.style.zIndex = String(base + 1);
        }
    }
}

function encastrarCartaEnCasilla(carta, casilla) {
    const rect = casilla.getBoundingClientRect();
    const indiceCasilla = Number(casilla.dataset.index);
    const lado = carta.dataset.side;
    const codigoCarta = Number(carta.dataset.cardCode);

    carta.style.left = rect.left + 'px';
    carta.style.top = rect.top + 'px';
    carta.style.transform = `scale(${ESCALA_CARTA})`;
    carta.dataset.casillaIndex = String(indiceCasilla);
    aplicarCapasSegunPrioridad(carta, indiceCasilla);
    carta.classList.add('volviendo');

    setTimeout(() => carta.classList.remove('volviendo'), 400);

    const cantidadActual = Number(casilla.dataset.cantidad || '0') + 1;
    casilla.dataset.cantidad = String(cantidadActual);
    casilla.classList.add('ocupada');

    carta.dataset.colocada = 'true';
    carta.style.cursor = 'default';

    bazas[indiceCasilla][lado] = codigoCarta;
    evaluarBaza(indiceCasilla);
}

function volverCartaAOrigen(carta) {
    carta.classList.add('volviendo');
    carta.style.left = carta.dataset.initialLeft;
    carta.style.top = carta.dataset.initialTop;
    carta.style.transform = carta.dataset.initialTransform;
    setTimeout(() => carta.classList.remove('volviendo'), 400);
}

function obtenerCasillaBajoPuntero(x, y) {
    const casillas = document.querySelectorAll('.casilla');
    for (const casilla of casillas) {
        const rect = casilla.getBoundingClientRect();
        const dentroX = x >= rect.left && x <= rect.right;
        const dentroY = y >= rect.top && y <= rect.bottom;
        if (dentroX && dentroY) {
            return casilla;
        }
    }
    return null;
}

function cerrarManoConGanador(ganador, puntosGanados) {
    turnoActual = null;
    actualizarBotones();

    if (sumarPuntos(ganador, puntosGanados)) {
        return;
    }

    mano = ladoOpuesto(mano);
    setTimeout(() => {
        iniciarNuevaMano();
    }, 900);
}

function irAlMazo(lado) {
    if (!partidaIniciada || ganadorPartida || turnoActual !== lado) {
        return;
    }
    if (estadoEnvido.seleccionando || estadoEnvido.pendiente || estadoEnvido.esperandoContinuar || estadoTruco.pendiente || estadoTruco.esperandoContinuar) {
        return;
    }

    const ganador = ladoOpuesto(lado);
    const puntosMazo = estadoEnvido.fueCantado ? 2 : 1;
    cerrarManoConGanador(ganador, puntosMazo);
}

function revisarFinDeMano() {
    if (bazasGanadas.jugador >= 2 || bazasGanadas.rival >= 2) {
        const ganador = bazasGanadas.jugador >= 2 ? 'jugador' : 'rival';
        cerrarManoConGanador(ganador, valorManoTruco());
        return;
    }

    if (progresoLado.jugador === 3 && progresoLado.rival === 3) {
        const ganador = obtenerGanadorMano();
        cerrarManoConGanador(ganador, valorManoTruco());
    }
}

function determinarProximoTurno(indiceBaza, ladoQueJugo) {
    const baza = bazas[indiceBaza];
    if (baza && baza.ganador) {
        return baza.ganador;
    }
    return ladoOpuesto(ladoQueJugo);
}

function manejarMouseDown(e) {
    if (!partidaIniciada || ganadorPartida) {
        return;
    }
    if (estadoEnvido.seleccionando || estadoEnvido.pendiente || estadoEnvido.esperandoContinuar || estadoTruco.pendiente || estadoTruco.esperandoContinuar) {
        return;
    }

    if (
        e.target.classList.contains('carta') &&
        e.target.dataset.colocada !== 'true' &&
        e.target.dataset.side === turnoActual
    ) {
        cartaEnArrastre = e.target;
        cartaEnArrastre.classList.add('dragging');
        ultimoMouseX = e.clientX;
        ultimoMouseY = e.clientY;

        const rect = cartaEnArrastre.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    }
}

function manejarMouseMove(e) {
    if (!cartaEnArrastre) {
        return;
    }
    ultimoMouseX = e.clientX;
    ultimoMouseY = e.clientY;
    cartaEnArrastre.style.left = (e.clientX - offsetX) + 'px';
    cartaEnArrastre.style.top = (e.clientY - offsetY) + 'px';
}

function manejarMouseUp() {
    if (!cartaEnArrastre) {
        return;
    }

    cartaEnArrastre.classList.remove('dragging');

    const sideCarta = cartaEnArrastre.dataset.side;
    const casillaDestino = obtenerCasillaBajoPuntero(ultimoMouseX, ultimoMouseY);
    const indiceEsperado = progresoLado[sideCarta];
    const esCasillaEsperada = casillaDestino && Number(casillaDestino.dataset.index) === indiceEsperado;
    const cantidadEnCasilla = casillaDestino ? Number(casillaDestino.dataset.cantidad || '0') : 0;
    const hayEspacio = cantidadEnCasilla < 2;

    if (esCasillaEsperada && hayEspacio) {
        encastrarCartaEnCasilla(cartaEnArrastre, casillaDestino);
        progresoLado[sideCarta] += 1;
        turnoActual = determinarProximoTurno(indiceEsperado, sideCarta);
        revisarFinDeMano();
        actualizarBotones();
    } else {
        volverCartaAOrigen(cartaEnArrastre);
    }

    cartaEnArrastre = null;
}

function elegirPuntajeObjetivo(valor) {
    puntosObjetivo = valor;
    puntos.jugador = 0;
    puntos.rival = 0;
    mano = 'jugador';
    ganadorPartida = null;
    partidaIniciada = true;

    const elementos = obtenerUI();
    elementos.panelInicioPartida.classList.add('panel-envido--hidden');
    elementos.panelFinPartida.classList.add('panel-envido--hidden');

    actualizarMarcador();
    iniciarNuevaMano();
}

function reiniciarPartida() {
    const elementos = obtenerUI();
    partidaIniciada = false;
    ganadorPartida = null;
    turnoActual = null;

    document.querySelectorAll('.carta').forEach((carta) => carta.remove());
    document.querySelectorAll('.casilla').forEach((casilla) => {
        casilla.classList.remove('ocupada');
        casilla.dataset.cantidad = '0';
    });

    elementos.panelFinPartida.classList.add('panel-envido--hidden');
    elementos.panelInicioPartida.classList.remove('panel-envido--hidden');
    elementos.panelCantosEnvido.classList.add('panel-envido--hidden');
    elementos.panelRespuestaEnvido.classList.add('panel-envido--hidden');
    elementos.panelResultadoEnvido.classList.add('panel-envido--hidden');
    elementos.panelRespuestaTruco.classList.add('panel-envido--hidden');
    actualizarMarcador();
    actualizarBotones();
}

function inicializarEventos() {
    const elementos = obtenerUI();

    elementos.btnEnvidoJugador.addEventListener('click', () => cantarEnvido('jugador'));
    elementos.btnEnvidoRival.addEventListener('click', () => cantarEnvido('rival'));
    elementos.btnCantarEnvido.addEventListener('click', () => seleccionarCantoEnvido('envido'));
    elementos.btnCantarRealEnvido.addEventListener('click', () => seleccionarCantoEnvido('realenvido'));
    elementos.btnCantarFaltaEnvido.addEventListener('click', () => seleccionarCantoEnvido('faltaenvido'));
    elementos.btnCancelarCantoEnvido.addEventListener('click', cancelarSeleccionEnvido);
    elementos.btnQuieroEnvido.addEventListener('click', resolverEnvido(true));
    elementos.btnNoQuieroEnvido.addEventListener('click', resolverEnvido(false));
    elementos.btnContinuarEnvido.addEventListener('click', continuarEnvido);

    elementos.btnTrucoJugador.addEventListener('click', () => cantarTruco('jugador'));
    elementos.btnTrucoRival.addEventListener('click', () => cantarTruco('rival'));
    elementos.btnQuieroTruco.addEventListener('click', resolverTruco(true));
    elementos.btnNoQuieroTruco.addEventListener('click', resolverTruco(false));
    elementos.btnSubirTruco.addEventListener('click', subirTrucoDesdeRespuesta);

    elementos.btnMazoJugador.addEventListener('click', () => irAlMazo('jugador'));
    elementos.btnMazoRival.addEventListener('click', () => irAlMazo('rival'));

    elementos.btnPartida15.addEventListener('click', () => elegirPuntajeObjetivo(15));
    elementos.btnPartida30.addEventListener('click', () => elegirPuntajeObjetivo(30));
    elementos.btnReiniciarPartida.addEventListener('click', reiniciarPartida);

    document.addEventListener('mousedown', manejarMouseDown);
    document.addEventListener('mousemove', manejarMouseMove);
    document.addEventListener('mouseup', manejarMouseUp);
}

window.addEventListener('DOMContentLoaded', () => {
    obtenerUI();
    inicializarEventos();
    actualizarMarcador();
    actualizarBotones();
    obtenerUI().panelInicioPartida.classList.remove('panel-envido--hidden');
});

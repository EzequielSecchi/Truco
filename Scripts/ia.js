// --- Módulo de Inteligencia Artificial ---
// Estas funciones manejan toda la comunicación con el backend y las decisiones del rival IA.
// Dependen de las variables y funciones definidas en script.js, envido.js y truco.js.

let tiempoInicioTurnoIA = null;

function obtenerCartaAleatoria() {
    const cartas = obtenerCartasDisponibles('rival');
    if (!cartas.length) return null;
    return cartas[Math.floor(Math.random() * cartas.length)];
}

function esModoIA() {
    return modoJuego === 'ia';
}

function obtenerEstadoParaIA() {
    const indiceBazaActual = obtenerIndiceBazaActual();
    return {
        turno_actual: turnoActual,
        mano,
        dificultad: dificultadIA || 'normal',
        puntos,
        puntos_objetivo: puntosObjetivo,
        bazas,
        bazas_ganadas: bazasGanadas,
        progreso_lado: progresoLado,
        indice_baza_actual: indiceBazaActual,
        baza_actual: bazas[indiceBazaActual],
        cartas_jugador: obtenerCartasDisponibles('jugador'),
        cartas_rival: obtenerCartasDisponibles('rival'),
        estado_truco: {
            nivel_aceptado: estadoTruco.nivelAceptado,
            nivel_pendiente: estadoTruco.nivelPendiente,
            puede_escalar_ahora: estadoTruco.puedeEscalarAhora
        },
        estado_envido: {
            habilitado: estadoEnvido.habilitado,
            fue_cantado: estadoEnvido.fueCantado,
            tipo_pendiente: estadoEnvido.tipoCantoPendiente
        }
    };
}

async function solicitarDecisionIA(fase, extra = {}) {
    const respuesta = await fetch(`${URL_BACKEND_IA}/ia/decidir`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fase,
            ...obtenerEstadoParaIA(),
            ...extra
        })
    });

    if (!respuesta.ok) {
        throw new Error(`Backend IA respondio ${respuesta.status}`);
    }

    return respuesta.json();
}

function jugarCartaProgramaticamente(lado, codigoCarta) {
    if (turnoActual !== lado || ganadorPartida) {
        return false;
    }

    const carta = document.querySelector(`.carta[data-side="${lado}"][data-card-code="${codigoCarta}"][data-colocada="false"]`);
    if (!carta) {
        return false;
    }

    const indiceEsperado = progresoLado[lado];
    const casilla = document.querySelector(`.casilla[data-index="${indiceEsperado}"]`);
    if (!casilla) {
        return false;
    }

    encastrarCartaEnCasilla(carta, casilla);
    progresoLado[lado] += 1;
    tiempoInicioTurnoIA = null;
    turnoActual = determinarProximoTurno(indiceEsperado, lado);
    revisarFinDeMano();
    actualizarBotones();
    return true;
}

async function ejecutarAccionIA() {
    if (!esModoIA() || ganadorPartida || !partidaIniciada) {
        return;
    }

    if (estadoEnvido.pendiente && estadoEnvido.cantor === 'jugador') {
        const decision = await solicitarDecisionIA('responder-envido', {
            canto: estadoEnvido.tipoCantoPendiente || 'envido'
        });
        resolverEnvido(decision.acepta === true)();
        return;
    }

    if (estadoTruco.pendiente && estadoTruco.cantor === 'jugador') {
        const decision = await solicitarDecisionIA('responder-truco', {
            nivel_pendiente: estadoTruco.nivelPendiente
        });

        if (decision.accion === 'subir') {
            subirTrucoDesdeRespuesta();
            return;
        }

        resolverTruco(decision.acepta === true)();
        return;
    }

    const puedeActuarAhora = (turnoActual === 'rival' || estadoTruco.puedeEscalarAhora === 'rival')
        && !estadoEnvido.pendiente && !estadoTruco.pendiente
        && !estadoEnvido.esperandoContinuar && !estadoTruco.esperandoContinuar;

    if (puedeActuarAhora) {
        const decision = await solicitarDecisionIA('decidir-canto');

        if (decision.accion === 'cantar-truco') {
            cantarTruco('rival');
            return;
        }

        const tipoEnvido = {
            'cantar-envido': 'envido',
            'cantar-realenvido': 'realenvido',
            'cantar-faltaenvido': 'faltaenvido'
        }[decision.accion];

        if (tipoEnvido) {
            cantarEnvido('rival');
            seleccionarCantoEnvido(tipoEnvido);
            return;
        }

        // La IA decidió no cantar nada: si tenía derecho a escalar, se lo cede
        if (estadoTruco.puedeEscalarAhora === 'rival') {
            estadoTruco.puedeEscalarAhora = null;
        }

        if (turnoActual === 'rival') {
            const decisionCarta = await solicitarDecisionIA('jugar-carta');
            if (decisionCarta.carta !== null && decisionCarta.carta !== undefined) {
                jugarCartaProgramaticamente('rival', Number(decisionCarta.carta));
            }
        }
    }
}

function programarTurnoIA() {
    if (!esModoIA() || !iaDisponible || iaEnCurso || temporizadorIA !== null || !partidaIniciada || ganadorPartida) {
        return;
    }

    const debeResponderEnvido = estadoEnvido.pendiente && estadoEnvido.cantor === 'jugador';
    const debeResponderTruco = estadoTruco.pendiente && estadoTruco.cantor === 'jugador';
    const debeJugarCarta = turnoActual === 'rival' && !estadoEnvido.pendiente && !estadoTruco.pendiente && !estadoEnvido.esperandoContinuar && !estadoTruco.esperandoContinuar;
    const puedeEscalarTruco = estadoTruco.puedeEscalarAhora === 'rival' && !estadoTruco.pendiente && !estadoEnvido.pendiente && !estadoEnvido.esperandoContinuar && !estadoTruco.esperandoContinuar;

    // Resetear el temporizador de seguridad cuando ya no es turno del rival
    if (!debeJugarCarta && !puedeEscalarTruco) {
        tiempoInicioTurnoIA = null;
    }

    if (!debeResponderEnvido && !debeResponderTruco && !debeJugarCarta && !puedeEscalarTruco) {
        return;
    }

    // Iniciar el reloj cuando el rival tiene que actuar
    if ((debeJugarCarta || puedeEscalarTruco) && tiempoInicioTurnoIA === null) {
        tiempoInicioTurnoIA = Date.now();
    }

    // Seguridad: si lleva más de 10 segundos sin jugar carta, tirar una aleatoria
    if (debeJugarCarta && tiempoInicioTurnoIA !== null && Date.now() - tiempoInicioTurnoIA > 10000) {
        console.warn('IA tardó demasiado, jugando carta aleatoria');
        tiempoInicioTurnoIA = null;
        const cartaAleatoria = obtenerCartaAleatoria();
        if (cartaAleatoria !== null) {
            jugarCartaProgramaticamente('rival', cartaAleatoria);
        }
        return;
    }

    temporizadorIA = window.setTimeout(async () => {
        temporizadorIA = null;
        iaEnCurso = true;
        try {
            actualizarIndicadorTurno();
            await ejecutarAccionIA();
        } catch (error) {
            console.error('No se pudo ejecutar la IA', error);
            iaDisponible = false;
            obtenerUI().turnoIndicador.textContent = 'Turno: IA no disponible';
        } finally {
            iaEnCurso = false;
            actualizarBotones();
        }
    }, 700);
}

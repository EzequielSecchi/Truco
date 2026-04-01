function obtenerPaloDeCarta(codigoCarta) {
    if (PALOS_CARTAS.oro.has(codigoCarta)) {
        return 'oro';
    }
    if (PALOS_CARTAS.copa.has(codigoCarta)) {
        return 'copa';
    }
    if (PALOS_CARTAS.espada.has(codigoCarta)) {
        return 'espada';
    }
    if (PALOS_CARTAS.basto.has(codigoCarta)) {
        return 'basto';
    }
    return null;
}

function valorEnvidoCarta(codigoCarta) {
    const valorBase = ((codigoCarta - 1) % 12) + 1;
    return valorBase >= 10 ? 0 : valorBase;
}

function calcularEnvidoDeMano(cartasMano) {
    const porPalo = {
        oro: [],
        copa: [],
        espada: [],
        basto: []
    };

    cartasMano.forEach((codigoCarta) => {
        const palo = obtenerPaloDeCarta(codigoCarta);
        if (palo) {
            porPalo[palo].push(valorEnvidoCarta(codigoCarta));
        }
    });

    let mejor = 0;
    Object.values(porPalo).forEach((valores) => {
        if (valores.length >= 2) {
            const [a, b] = [...valores].sort((x, y) => y - x);
            const total = a + b + 20;
            if (total > mejor) {
                mejor = total;
            }
        }
    });

    if (mejor > 0) {
        return mejor;
    }

    return Math.max(...cartasMano.map((codigoCarta) => valorEnvidoCarta(codigoCarta)));
}

function datosCantoEnvido(tipo) {
    if (tipo === 'realenvido') {
        return { nombre: 'Real Envido', puntosQuiero: 3, puntosNoQuiero: 1 };
    }
    if (tipo === 'faltaenvido') {
        return { nombre: 'Falta Envido', puntosQuiero: null, puntosNoQuiero: 1 };
    }
    return { nombre: 'Envido', puntosQuiero: 2, puntosNoQuiero: 1 };
}

function puntosFaltaEnvidoPara(lado) {
    return Math.max(1, puntosObjetivo - puntos[lado]);
}

function cantarEnvido(cantor) {
    if (!estadoEnvido.habilitado || estadoEnvido.seleccionando || estadoEnvido.pendiente || estadoEnvido.esperandoContinuar) {
        return;
    }
    if (turnoActual !== cantor) {
        return;
    }

    const elementos = obtenerUI();
    estadoEnvido.seleccionando = true;
    estadoEnvido.cantor = cantor;
    elementos.textoCantosEnvido.textContent = `${nombreLado(cantor)}: elegi el canto`;
    elementos.panelCantosEnvido.classList.remove('panel-envido--hidden');
    actualizarBotones();
}

function seleccionarCantoEnvido(tipo) {
    if (!estadoEnvido.seleccionando || !estadoEnvido.cantor) {
        return;
    }

    const elementos = obtenerUI();
    const cantor = estadoEnvido.cantor;
    const responde = ladoOpuesto(cantor);
    const datos = datosCantoEnvido(tipo);

    estadoEnvido.seleccionando = false;
    estadoEnvido.pendiente = true;
    estadoEnvido.tipoCantoPendiente = tipo;
    estadoEnvido.fueCantado = true;

    elementos.panelCantosEnvido.classList.add('panel-envido--hidden');
    elementos.textoRespuestaEnvido.textContent = `${nombreLado(cantor)} canto ${datos.nombre}. ${nombreLado(responde)}: Queres?`;
    elementos.panelRespuestaEnvido.classList.remove('panel-envido--hidden');
    actualizarBotones();
}

function cancelarSeleccionEnvido() {
    if (!estadoEnvido.seleccionando) {
        return;
    }

    const elementos = obtenerUI();
    estadoEnvido.seleccionando = false;
    estadoEnvido.cantor = null;
    elementos.panelCantosEnvido.classList.add('panel-envido--hidden');
    actualizarBotones();
}

function interrumpirTrucoConEnvido(tipo) {
    if (!estadoTruco.pendiente || estadoTruco.esperandoContinuar) {
        return false;
    }
    if (!estadoTruco.responder) {
        return false;
    }
    if (!estadoEnvido.habilitado || estadoEnvido.fueCantado || estadoEnvido.pendiente || estadoEnvido.esperandoContinuar) {
        return false;
    }

    const elementos = obtenerUI();
    const cantor = estadoTruco.responder;
    const responde = ladoOpuesto(cantor);
    const datos = datosCantoEnvido(tipo);

    estadoTruco.esperandoContinuar = true;
    elementos.panelRespuestaTruco.classList.add('panel-envido--hidden');

    estadoEnvido.seleccionando = false;
    estadoEnvido.pendiente = true;
    estadoEnvido.cantor = cantor;
    estadoEnvido.tipoCantoPendiente = tipo;
    estadoEnvido.fueCantado = true;

    elementos.textoRespuestaEnvido.textContent = `${nombreLado(cantor)} canto ${datos.nombre}. ${nombreLado(responde)}: Queres?`;
    elementos.panelRespuestaEnvido.classList.remove('panel-envido--hidden');
    actualizarBotones();
    return true;
}

function reanudarTrucoPendienteSiCorresponde() {
    if (!estadoTruco.esperandoContinuar || !estadoTruco.pendiente || !estadoTruco.cantor) {
        return;
    }

    const elementos = obtenerUI();
    estadoTruco.esperandoContinuar = false;
    elementos.textoRespuestaTruco.textContent = `${nombreLado(estadoTruco.cantor)} canto ${nombreNivelTruco(estadoTruco.nivelPendiente)}. ${nombreLado(ladoOpuesto(estadoTruco.cantor))}: Queres?`;
    actualizarOpcionesRespuestaTruco();
    elementos.panelRespuestaTruco.classList.remove('panel-envido--hidden');
    actualizarBotones();
}

function subidasEnvidoDisponibles(tipoActual) {
    if (tipoActual === 'envido') {
        return ['realenvido', 'faltaenvido'];
    }
    if (tipoActual === 'realenvido') {
        return ['faltaenvido'];
    }
    return [];
}

function subirEnvidoDesdeRespuesta(tipo) {
    if (!estadoEnvido.pendiente || !estadoEnvido.cantor) {
        return false;
    }

    const tipoActual = estadoEnvido.tipoCantoPendiente || 'envido';
    const posibles = subidasEnvidoDisponibles(tipoActual);
    if (!posibles.includes(tipo)) {
        return false;
    }

    const elementos = obtenerUI();
    const nuevoCantor = ladoOpuesto(estadoEnvido.cantor);
    const responde = ladoOpuesto(nuevoCantor);
    const datos = datosCantoEnvido(tipo);

    estadoEnvido.cantor = nuevoCantor;
    estadoEnvido.tipoCantoPendiente = tipo;
    estadoEnvido.fueCantado = true;

    elementos.textoRespuestaEnvido.textContent = `${nombreLado(nuevoCantor)} canto ${datos.nombre}. ${nombreLado(responde)}: Queres?`;
    elementos.panelRespuestaEnvido.classList.remove('panel-envido--hidden');
    actualizarBotones();
    return true;
}

function resolverEnvido(acepta) {
    return function () {
        if (!estadoEnvido.pendiente) {
            return;
        }

        const elementos = obtenerUI();
        const cantor = estadoEnvido.cantor;
        const tipo = estadoEnvido.tipoCantoPendiente || 'envido';
        const datos = datosCantoEnvido(tipo);

        elementos.panelRespuestaEnvido.classList.add('panel-envido--hidden');
        estadoEnvido.pendiente = false;
        estadoEnvido.cantor = null;
        estadoEnvido.tipoCantoPendiente = null;
        estadoEnvido.habilitado = false;

        if (!acepta) {
            sumarPuntos(cantor, datos.puntosNoQuiero);
            reanudarTrucoPendienteSiCorresponde();
            actualizarBotones();
            return;
        }

        const puntosJugador = calcularEnvidoDeMano(manosPorLado.jugador);
        const puntosRival = calcularEnvidoDeMano(manosPorLado.rival);
        let ganador = 'empate';

        if (puntosJugador > puntosRival) {
            ganador = 'jugador';
        } else if (puntosRival > puntosJugador) {
            ganador = 'rival';
        } else {
            ganador = mano;
        }

        const puntosGanados = tipo === 'faltaenvido' ? puntosFaltaEnvidoPara(ganador) : datos.puntosQuiero;
        sumarPuntos(ganador, puntosGanados);

        elementos.textoResultadoEnvido.textContent = `${datos.nombre} querido. Jugador ${puntosJugador} - Rival ${puntosRival}. Gana ${nombreLado(ganador)} (${puntosGanados} puntos).`;
        elementos.panelResultadoEnvido.classList.remove('panel-envido--hidden');
        estadoEnvido.esperandoContinuar = true;

        if (ganadorPartida) {
            estadoEnvido.esperandoContinuar = false;
            elementos.panelResultadoEnvido.classList.add('panel-envido--hidden');
            return;
        }

        actualizarBotones();
    };
}

function continuarEnvido() {
    const elementos = obtenerUI();
    elementos.panelResultadoEnvido.classList.add('panel-envido--hidden');
    estadoEnvido.esperandoContinuar = false;
    reanudarTrucoPendienteSiCorresponde();
    actualizarBotones();
}

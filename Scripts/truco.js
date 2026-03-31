function nombreNivelTruco(nivel) {
    if (nivel === 4) {
        return 'Vale Cuatro';
    }
    if (nivel === 3) {
        return 'Retruco';
    }
    return 'Truco';
}

function obtenerSiguienteNivelTruco(lado) {
    if (!lado || estadoTruco.pendiente) {
        return null;
    }

    // Si hay una escalada reservada, solo ese lado puede cantar.
    if (estadoTruco.puedeEscalarAhora !== null && estadoTruco.puedeEscalarAhora !== lado) {
        return null;
    }

    // Si no hay nivel aceptado, puede cantar Truco (nivel 2)
    if (estadoTruco.nivelAceptado === 1) {
        return 2;
    }
    
    // Si ya aceptó Truco, puede cantar Retruco (nivel 3)
    if (estadoTruco.nivelAceptado === 2) {
        return 3;
    }
    
    // Si ya aceptó Retruco, puede cantar Vale Cuatro (nivel 4)
    if (estadoTruco.nivelAceptado === 3) {
        return 4;
    }
    
    return null;
}

function obtenerTextoSiguienteTruco(lado) {
    const siguiente = obtenerSiguienteNivelTruco(lado);
    if (!siguiente) {
        return null;
    }
    return nombreNivelTruco(siguiente);
}

function valorManoTruco() {
    return estadoTruco.nivelAceptado;
}

function puntosNoQuieroTruco() {
    if (!estadoTruco.nivelPendiente) {
        return 1;
    }
    return Math.max(1, estadoTruco.nivelPendiente - 1);
}

function siguienteNivelDesdePendiente() {
    if (estadoTruco.nivelPendiente === 2) {
        return 3;
    }
    if (estadoTruco.nivelPendiente === 3) {
        return 4;
    }
    return null;
}

function actualizarOpcionesRespuestaTruco() {
    const elementos = obtenerUI();
    const proximoNivel = siguienteNivelDesdePendiente();

    if (proximoNivel) {
        elementos.btnSubirTruco.hidden = false;
        elementos.btnSubirTruco.textContent = nombreNivelTruco(proximoNivel);
    } else {
        elementos.btnSubirTruco.hidden = true;
    }
}

function cantarTruco(cantor) {
    if (estadoTruco.pendiente || estadoTruco.esperandoContinuar) {
        return;
    }

    const puedePorTurno = turnoActual === cantor;
    const puedePorEscalada = estadoTruco.puedeEscalarAhora === cantor;
    if (!puedePorTurno && !puedePorEscalada) {
        return;
    }

    const siguienteNivel = obtenerSiguienteNivelTruco(cantor);
    if (!siguienteNivel) {
        return;
    }

    const elementos = obtenerUI();
    estadoTruco.pendiente = true;
    estadoTruco.nivelPendiente = siguienteNivel;
    estadoTruco.cantor = cantor;
    estadoTruco.responder = ladoOpuesto(cantor);
    estadoTruco.puedeEscalarAhora = null;

    elementos.textoRespuestaTruco.textContent = `${nombreLado(cantor)} canto ${nombreNivelTruco(siguienteNivel)}. ${nombreLado(ladoOpuesto(cantor))}: Queres?`;
    actualizarOpcionesRespuestaTruco();
    elementos.panelRespuestaTruco.classList.remove('panel-envido--hidden');
    actualizarBotones();
}

function subirTrucoDesdeRespuesta() {
    if (!estadoTruco.pendiente || estadoTruco.nivelPendiente === 4) {
        return;
    }

    const elementos = obtenerUI();
    const nuevoNivel = siguienteNivelDesdePendiente();
    if (!nuevoNivel) {
        return;
    }

    // El responder escala: ahora el cantor debe responder
    const nuevoCantor = estadoTruco.responder;
    const nuevoResponder = estadoTruco.cantor;
    estadoTruco.cantor = nuevoCantor;
    estadoTruco.responder = nuevoResponder;
    estadoTruco.nivelPendiente = nuevoNivel;
    estadoTruco.puedeEscalarAhora = null;
    
    elementos.textoRespuestaTruco.textContent = `${nombreLado(estadoTruco.cantor)} canto ${nombreNivelTruco(nuevoNivel)}. ${nombreLado(ladoOpuesto(estadoTruco.cantor))}: Queres?`;
    actualizarOpcionesRespuestaTruco();
    actualizarBotones();
}

function resolverTruco(acepta) {
    return function () {
        if (!estadoTruco.pendiente) {
            return;
        }

        const elementos = obtenerUI();
        const cantor = estadoTruco.cantor;
        const nivelPendiente = estadoTruco.nivelPendiente;

        elementos.panelRespuestaTruco.classList.add('panel-envido--hidden');
        elementos.btnSubirTruco.hidden = true;

        if (!acepta) {
            // No quiero: el cantor gana puntos y se cierra la mano
            const puntosGanados = puntosNoQuieroTruco();
            estadoTruco.pendiente = false;
            estadoTruco.nivelAceptado = 1;
            estadoTruco.nivelPendiente = null;
            estadoTruco.cantor = null;
            estadoTruco.responder = null;
            estadoTruco.puedeEscalarAhora = null;
            cerrarManoConGanador(cantor, puntosGanados);
            return;
        }

        // Quiero: aceptar el nivel actual
        estadoTruco.nivelAceptado = nivelPendiente;
        estadoTruco.pendiente = false;
        estadoTruco.nivelPendiente = null;
        
        // El responder puede cantar el siguiente nivel ahora
        estadoTruco.puedeEscalarAhora = estadoTruco.responder;
        estadoTruco.cantor = null;
        estadoTruco.responder = null;
        
        actualizarBotones();
    };
}

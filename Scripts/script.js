// función para obtener un número aleatorio entre min y max
function obtenerAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// números de cartas (en imagenes) a excluir
const cartasExcluidas = [8, 9, 20, 21, 32, 33, 44, 45];

// función para obtener 3 cartas aleatorias sin repetición
function obtener3CartasAleatorias() {
    const cartas = [];
    while (cartas.length < 3) {
        const numero = obtenerAleatorio(1, 48);
        if (!cartas.includes(numero) && !cartasExcluidas.includes(numero)) {
            cartas.push(numero);
        }
    }
    return cartas;
}

// función para mostrar las 3 cartas
function mostrar3Cartas() {
    const cartas = obtener3CartasAleatorias();
    const contenedor = document.getElementById('contenedorCartas');
    
    // remover solo las cartas anteriores, no la mesa
    const cartasAnteriores = contenedor.querySelectorAll('.carta');
    cartasAnteriores.forEach(carta => carta.remove());
    
    // dimensiones de las cartas
    const anchoCartA = 131;
    const altoCarta = 200;
    const gap = -40;
    const scale = 0.66;
    
    // posición para centrar las 3 cartas
    const totalAncho = (anchoCartA * 3) + (gap * 2);
    const startX = -totalAncho / 2;
    const startY = -altoCarta / 2 + 200;
    
    // crear las imágenes para cada carta
    cartas.forEach((numero, index) => {
        const img = document.createElement('img');
        const numeroFormato = String(numero).padStart(2, '0');
        img.src = `Cartas/__${numeroFormato}.gif`;
        img.alt = `Carta ${numero}`;
        img.className = 'carta';
        img.style.transform = `scale(${scale})`;
        
        // posición inicial en el centro
        const cartaX = startX + (index * (anchoCartA + gap));
        const cartaY = startY;
        
        img.style.left = (window.innerWidth / 2 + cartaX) + 'px';
        img.style.top = (window.innerHeight / 2 + cartaY) + 'px';
        
        // guardar posición inicial
        img.dataset.initialLeft = img.style.left;
        img.dataset.initialTop = img.style.top;
        img.dataset.initialTransform = img.style.transform;
        
        contenedor.appendChild(img);
    });
}
// lógica para arrastrar cartas
let cartaEnArrastre = null;
let offsetX = 0;
let offsetY = 0;

document.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('carta')) {
        cartaEnArrastre = e.target;
        cartaEnArrastre.classList.add('dragging');
        
        const rect = cartaEnArrastre.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    }
});

document.addEventListener('mousemove', (e) => {
    if (cartaEnArrastre) {
        cartaEnArrastre.style.left = (e.clientX - offsetX) + 'px';
        cartaEnArrastre.style.top = (e.clientY - offsetY) + 'px';
    }
});

document.addEventListener('mouseup', () => {
    if (cartaEnArrastre) {
        cartaEnArrastre.classList.remove('dragging');
        cartaEnArrastre.classList.add('volviendo');
        
        // restaurar la posición
        cartaEnArrastre.style.left = cartaEnArrastre.dataset.initialLeft;
        cartaEnArrastre.style.top = cartaEnArrastre.dataset.initialTop;
        cartaEnArrastre.style.transform = cartaEnArrastre.dataset.initialTransform;
        
        // remover la clase de transición después de que termine
        setTimeout(() => {
            cartaEnArrastre.classList.remove('volviendo');
        }, 500);
        
        cartaEnArrastre = null;
    }
});

// ejecutar la función cuando cargue la página
window.addEventListener('DOMContentLoaded', function() {
    mostrar3Cartas();
});

// recalcular posiciones cuando cambia el tamaño de la ventana
window.addEventListener('resize', mostrar3Cartas);

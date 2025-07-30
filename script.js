window.addEventListener('load', () => {
    // Registrar o Service Worker para funcionalidade offline
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js') // Caminho já estava correto, mantendo para consistência.
            .then(reg => console.log('Service Worker registrado com sucesso.', reg))
            .catch(err => console.error('Falha ao registrar Service Worker.', err));
    }

    // --- Elementos do DOM ---
    const loadingScreen = document.getElementById('loading-screen');
    const progressBar = document.getElementById('progress-bar');
    const startButton = document.getElementById('start-button');
    const callScreen = document.getElementById('call-screen');
    const dustinCallImage = document.getElementById('dustin-call-image');
    const dustinAudio = document.getElementById('dustin-audio');
    const compassContainer = document.getElementById('compass-container');
    const compassArrow = document.getElementById('compass-arrow');
    const bikeModel = document.getElementById('bike-model');

    // --- Coordenadas do Alvo ---
    const targetCoords = {
        latitude: -27.639914348589738,
        longitude: -48.667501536175926
    };

    let vibrationInterval;
    let navigationWatchId; // Alterado de Interval para WatchId

    // --- 1. Lógica de Carregamento ---
    function simulateLoading() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            progressBar.style.width = progress + '%';
            if (progress >= 100) {
                clearInterval(interval);
                progressBar.parentElement.classList.add('hidden');
                startButton.classList.remove('hidden');
            }
        }, 100); // Simula um carregamento rápido
    }

    simulateLoading();

    // --- 2. Início do Jogo ---
    startButton.addEventListener('click', () => {
        loadingScreen.classList.add('hidden');
        callScreen.classList.remove('hidden');

        // Inicia a vibração contínua
        if ('vibrate' in navigator) {
            vibrationInterval = setInterval(() => navigator.vibrate(500), 600);
        }
    });

    // --- 3. Chamada do Dustin ---
    dustinCallImage.addEventListener('click', () => {
        // Para a vibração
        if (vibrationInterval) {
            clearInterval(vibrationInterval);
            navigator.vibrate(0);
        }

        // Toca o áudio e esconde a tela de chamada
        dustinAudio.play();
        callScreen.classList.add('hidden');
    });

    // --- 4. Início da Navegação ---
    dustinAudio.addEventListener('ended', () => {
        // Pede permissão e inicia a navegação
        if (navigator.geolocation) {
            compassContainer.classList.remove('hidden');
            // Usa watchPosition para uma atualização mais eficiente
            const options = {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 20000
            };
            navigationWatchId = navigator.geolocation.watchPosition(positionSuccess, positionError, options);
        } else {
            alert("Geolocalização não é suportada por este navegador.");
        }
    });

    // --- 5. Lógica de Navegação e Descoberta ---

    function positionSuccess(pos) {
        const userCoords = pos.coords;
        const distance = calculateDistance(userCoords.latitude, userCoords.longitude, targetCoords.latitude, targetCoords.longitude);

        console.log(`Distância até o alvo: ${distance.toFixed(2)} metros`);

        if (distance <= 10) {
            // Chegou ao local!
            navigator.geolocation.clearWatch(navigationWatchId); // Para de observar a posição
            compassContainer.classList.add('hidden');
            navigator.vibrate([200, 100, 200]); // Vibra duas vezes
            bikeModel.setAttribute('visible', 'true');
            alert('Você está perto! Use a câmera para encontrar a bicicleta do Will!');
        } else {
            // Continua navegando
            const bearing = calculateBearing(userCoords.latitude, userCoords.longitude, targetCoords.latitude, targetCoords.longitude);
            compassArrow.style.transform = `rotate(${bearing}deg)`;
        }
    }

    function positionError(err) {
        console.warn(`ERRO(${err.code}): ${err.message}`);
        alert(`ERRO(${err.code}): ${err.message}`);
        // Poderia mostrar uma mensagem de erro para o usuário aqui
    }

    // --- Funções Auxiliares de Geometria ---
    function toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    function toDegrees(radians) {
        return radians * 180 / Math.PI;
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Raio da Terra em metros
        const φ1 = toRadians(lat1);
        const φ2 = toRadians(lat2);
        const Δφ = toRadians(lat2 - lat1);
        const Δλ = toRadians(lon2 - lon1);

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // em metros
    }

    function calculateBearing(lat1, lon1, lat2, lon2) {
        const φ1 = toRadians(lat1);
        const λ1 = toRadians(lon1);
        const φ2 = toRadians(lat2);
        const λ2 = toRadians(lon2);

        const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) -
                  Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
        const θ = Math.atan2(y, x);

        return (toDegrees(θ) + 360) % 360; // em graus
    }
});
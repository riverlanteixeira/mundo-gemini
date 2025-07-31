window.addEventListener('load', () => {
    // Registrar o Service Worker para funcionalidade offline
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
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
    const bikeModelViewer = document.getElementById('bike-model');
    const compassContainer = document.getElementById('compass-container');
    const compassArrow = document.getElementById('compass-arrow');
    const distanceMeter = document.getElementById('distance-meter');

    let vibrationInterval;
    let wakeLock = null;
    let currentMission = 0; // Começa na missão 0 (primeira)
    let hasArrived = false; // Garante que a vibração de chegada ocorra apenas uma vez
    let navigationWatchId; // Alterado de Interval para WatchId
    let deviceAlpha = 0;

    // --- Coordenadas dos Alvos (Missões) ---
    const missionTargets = [
        { latitude: -27.630917802426634, longitude: -48.679809836619185, audio: 'assets/audio/dustin-intro.mp3' }, // Missão 1 (Bicicleta)
        { latitude: -27.630000000000000, longitude: -48.670000000000000, audio: 'assets/audio/dustin-missao-1-completa.mp3' } // Missão 2 (Exemplo)
    ];
    let targetCoords = missionTargets[currentMission];

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
    startButton.addEventListener('click', async () => {
        loadingScreen.classList.add('hidden');
        callScreen.classList.remove('hidden');

        // Inicia a vibração contínua
        if ('vibrate' in navigator) {
            vibrationInterval = setInterval(() => navigator.vibrate(500), 600);
        }

        // Solicita o Wake Lock para manter a tela ligada
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock ativado!');
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    });

    // --- 3. Chamada do Dustin --- 
    dustinCallImage.addEventListener('click', () => {
        // Para a vibração
        if (vibrationInterval) {
            clearInterval(vibrationInterval);
            navigator.vibrate(0);
        }

        // Toca o áudio inicial do Dustin
        dustinAudio.src = targetCoords.audio;
        dustinAudio.play();
    });

    // --- 4. Início da Navegação (após áudio inicial) ---
    dustinAudio.addEventListener('ended', () => {
        callScreen.classList.add('hidden');

        // Ativa a câmera e o modo AR diretamente
        bikeModelViewer.classList.remove('hidden');
        bikeModelViewer.activateAR();
    });

    // --- 5. Lógica de Navegação e Descoberta ---
    window.addEventListener('deviceorientation', (event) => {
        if (event.alpha) {
            // Usa webkitCompassHeading para compatibilidade com iOS
            deviceAlpha = event.webkitCompassHeading || event.alpha;
        }
    });

    function positionSuccess(pos) {
        const userCoords = pos.coords;
        const distance = calculateDistance(userCoords.latitude, userCoords.longitude, targetCoords.latitude, targetCoords.longitude);

        // Atualiza o medidor de distância
        distanceMeter.textContent = `${distance.toFixed(0)} m`;

        if (distance <= 5 && !hasArrived) {
            hasArrived = true; // Marca que o jogador chegou
            // Chegou ao local!
            compassArrow.classList.add('hidden'); // Esconde apenas a seta
            navigator.vibrate([200, 100, 200]); // Vibra duas vezes
            bikeModelViewer.classList.remove('hidden'); // Mostra o model-viewer
            bikeModelViewer.activateAR(); // Ativa o modo AR

            // Libera o Wake Lock quando a missão é concluída (se não for mais necessário)
            if (wakeLock !== null) {
                wakeLock.release();
                wakeLock = null;
                console.log('Wake Lock liberado.');
            }
        } else if (distance > 5) {
            // Continua navegando
            const bearing = calculateBearing(userCoords.latitude, userCoords.longitude, targetCoords.latitude, targetCoords.longitude);
            const rotation = bearing - deviceAlpha; // Ajusta a rotação com base na orientação do dispositivo
            compassArrow.style.transform = `rotate(${rotation}deg)`;
            hasArrived = false; // Reseta para permitir nova chegada se afastar e voltar
        }
    }

    function positionError(err) {
        console.warn(`ERRO(${err.code}): ${err.message}`);
        alert(`ERRO(${err.code}): ${err.message}`);
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

    // --- Lógica de Coleta da Bicicleta e Próxima Missão ---
    bikeModelViewer.addEventListener('click', () => {
        // Esconde a bicicleta
        bikeModelViewer.classList.add('hidden');

        // Avança para a próxima missão
        currentMission++;
        if (currentMission < missionTargets.length) {
            targetCoords = missionTargets[currentMission];
            dustinAudio.src = targetCoords.audio; // Define o áudio da próxima missão
            dustinAudio.play();

            // Reativa a bússola e o medidor de distância para a nova missão
            compassContainer.classList.remove('hidden');
            compassArrow.classList.remove('hidden'); // Garante que a seta apareça novamente
            hasArrived = false; // Reseta o estado de chegada para a nova missão

            // Reinicia o watchPosition para o novo alvo
            if (navigationWatchId) {
                navigator.geolocation.clearWatch(navigationWatchId);
            }
            const options = {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 20000
            };
            navigationWatchId = navigator.geolocation.watchPosition(positionSuccess, positionError, options);

        } else {
            // Todas as missões completas
            alert('Parabéns! Todas as missões foram completas!');
            compassContainer.classList.add('hidden');
            if (wakeLock !== null) {
                wakeLock.release();
                wakeLock = null;
            }
        }
    });
});
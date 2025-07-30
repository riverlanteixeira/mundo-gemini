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
    const bikeModelViewer = document.getElementById('bike-model'); // Referência ao model-viewer

    let vibrationInterval;
    let wakeLock = null;

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

        // Toca o áudio
        dustinAudio.play();
    });

    // --- 4. Exibir Bicicleta após o Áudio ---
    dustinAudio.addEventListener('ended', () => {
        callScreen.classList.add('hidden');
        bikeModelViewer.classList.remove('hidden'); // Mostra o model-viewer

        // Inicia o modo AR automaticamente (opcional, pode ser um botão)
        // bikeModelViewer.activateAR();

        // Libera o Wake Lock quando a missão é concluída (se não for mais necessário)
        if (wakeLock !== null) {
            wakeLock.release();
            wakeLock = null;
            console.log('Wake Lock liberado.');
        }
    });
});
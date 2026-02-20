const socket = new WebSocket('ws://' + window.location.host + '/ws'); // Note: WS not implemented in simple Flask, using polling for this demo

// --- Graph Setup ---
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 0
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#e0e0e0' }
        },
        x: {
            grid: { display: false },
            ticks: { display: false }
        }
    },
    plugins: {
        legend: { labels: { color: '#e0e0e0' } }
    }
};

const cpuCtx = document.getElementById('cpuChart').getContext('2d');
const cpuChart = new Chart(cpuCtx, {
    type: 'line',
    data: {
        labels: Array(20).fill(''),
        datasets: [{
            label: 'CPU %',
            data: Array(20).fill(0),
            borderColor: '#00ffcc',
            backgroundColor: 'rgba(0, 255, 204, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
        }]
    },
    options: chartOptions
});

const ramCtx = document.getElementById('ramChart').getContext('2d');
const ramChart = new Chart(ramCtx, {
    type: 'bar',
    data: {
        labels: Array(20).fill(''),
        datasets: [{
            label: 'RAM %',
            data: Array(20).fill(0),
            backgroundColor: '#ff00ff',
            borderColor: '#ff00ff',
            borderWidth: 1
        }]
    },
    options: chartOptions
});

const tempCtx = document.getElementById('tempChart').getContext('2d');
const tempChart = new Chart(tempCtx, {
    type: 'doughnut',
    data: {
        labels: ['Core', 'Ext'],
        datasets: [{
            data: [50, 50],
            backgroundColor: ['#ff3333', '#333333'],
            borderColor: '#000',
            borderWidth: 2
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        }
    }
});

const netCtx = document.getElementById('netChart').getContext('2d');
const netChart = new Chart(netCtx, {
    type: 'line',
    data: {
        labels: Array(20).fill(''),
        datasets: [{
            label: 'Traffic',
            data: Array(20).fill(0),
            borderColor: '#ffff00',
            backgroundColor: 'rgba(255, 255, 0, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            fill: true
        }]
    },
    options: chartOptions
});

const diskCtx = document.getElementById('diskChart').getContext('2d');
const diskChart = new Chart(diskCtx, {
    type: 'bar',
    data: {
        labels: Array(20).fill(''),
        datasets: [{
            label: 'Disk %',
            data: Array(20).fill(0),
            backgroundColor: '#00ffff',
            borderColor: '#00ffff',
            borderWidth: 1
        }]
    },
    options: chartOptions
});

const swapCtx = document.getElementById('swapChart').getContext('2d');
const swapChart = new Chart(swapCtx, {
    type: 'bar',
    data: {
        labels: Array(20).fill(''),
        datasets: [{
            label: 'Swap %',
            data: Array(20).fill(0),
            backgroundColor: '#ff3333',
            borderColor: '#ff3333',
            borderWidth: 1
        }]
    },
    options: chartOptions
});

const loadCtx = document.getElementById('loadChart').getContext('2d');
const loadChart = new Chart(loadCtx, {
    type: 'line',
    data: {
        labels: Array(20).fill(''),
        datasets: [{
            label: 'Load',
            data: Array(20).fill(0),
            borderColor: '#ffffff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 0
        }]
    },
    options: chartOptions
});

// --- Globe Setup (Three.js) ---
function initGlobe() {
    const container = document.getElementById('globe-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Create a wireframe sphere
    const geometry = new THREE.IcosahedronGeometry(10, 2);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ffcc, 
        wireframe: true,
        transparent: true,
        opacity: 0.6
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Add some particles around the globe
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 30;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.1,
        color: 0xff00ff,
        transparent: true,
        opacity: 0.8
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    camera.position.z = 20;

    function animate() {
        requestAnimationFrame(animate);
        
        sphere.rotation.y += 0.002;
        sphere.rotation.x += 0.001;
        
        particlesMesh.rotation.y -= 0.001;

        renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
}

// Initialize Globe
initGlobe();

// --- Logic ---

let uptimeSeconds = 0;

function updateUptime() {
    uptimeSeconds++;
    const h = Math.floor(uptimeSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((uptimeSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (uptimeSeconds % 60).toString().padStart(2, '0');
    document.getElementById('uptime').innerText = `${h}:${m}:${s}`;
}

setInterval(updateUptime, 1000);

// Simulate data fetching
setInterval(async () => {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        // Update CPU
        const cpuData = cpuChart.data.datasets[0].data;
        cpuData.shift();
        cpuData.push(data.cpu);
        cpuChart.update();

        // Update RAM
        const ramData = ramChart.data.datasets[0].data;
        ramData.shift();
        ramData.push(data.ram);
        ramChart.update();

        // Update Net
        const netData = netChart.data.datasets[0].data;
        netData.shift();
        netData.push(data.network_in);
        netChart.update();

        // Update Disk
        const diskData = diskChart.data.datasets[0].data;
        diskData.shift();
        diskData.push(data.disk_usage);
        diskChart.update();

        // Update Swap
        const swapData = swapChart.data.datasets[0].data;
        swapData.shift();
        swapData.push(data.swap_usage);
        swapChart.update();

        // Update Load
        const loadData = loadChart.data.datasets[0].data;
        loadData.shift();
        loadData.push(data.load_avg);
        loadChart.update();

        // Update Temp
        tempChart.data.datasets[0].data = [data.temp, 100 - data.temp];
        tempChart.update();

        // Random visual stimulation
        if(Math.random() > 0.95) {
            document.body.style.boxShadow = `inset 0 0 50px rgba(0, 255, 204, 0.2)`;
            setTimeout(() => {
                document.body.style.boxShadow = 'none';
            }, 200);
        }

    } catch (error) {
        console.error("Error fetching stats", error);
    }
}, 1500);

// --- Terminal Logic ---
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const clearBtn = document.getElementById('clearBtn');

terminalInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const command = terminalInput.value;
        if (!command) return;

        // Display command
        appendLine(`➜ ${command}`, 'input');
        terminalInput.value = '';

        // Send to backend
        try {
            const response = await fetch('/api/terminal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            const result = await response.json();
            
            if (result.response) {
                appendLine(result.response, 'output');
            }
        } catch (error) {
            appendLine("Connection to server core failed.", 'error');
        }
    }
});

clearBtn.addEventListener('click', () => {
    terminalOutput.innerHTML = '';
    appendLine("Terminal cleared.", 'success');
});

function appendLine(text, type) {
    const div = document.createElement('div');
    div.className = `output-line ${type}`;
    div.innerText = text;
    terminalOutput.appendChild(div);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Initial focus
terminalInput.focus();

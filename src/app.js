import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
    advanceDemoState,
    calculateDemoScore,
    createInitialState,
    setDemoScenario,
    DEMO_TURBIDITY_TRIGGER_NTU
} from './scenarios.js';

        // --- GLOBAL STATE & SIMULATION VARIABLES ---
        const state = createInitialState();

        const ui = {
            holoTemp: document.getElementById('holo-temp'),
            holoPh: document.getElementById('holo-ph'),
            holoTds: document.getElementById('holo-tds'),
            holoTurbidity: document.getElementById('holo-turbidity'),
            holoEsp: document.getElementById('holo-esp'),
            holoCloud: document.getElementById('holo-cloud'),
            dashTemp: document.getElementById('dash-temp'),
            dashPh: document.getElementById('dash-ph'),
            dashTds: document.getElementById('dash-tds'),
            dashTurbidity: document.getElementById('dash-turbidity'),
            gaugeTemp: document.getElementById('gauge-temp'),
            gaugePh: document.getElementById('gauge-ph'),
            gaugeTds: document.getElementById('gauge-tds'),
            gaugeTurb: document.getElementById('gauge-turb'),
            wqiValue: document.getElementById('wqi-value'),
            wqiStatus: document.getElementById('wqi-status'),
            xaiBarsContainer: document.getElementById('xai-bars-container'),
            xaiSummary: document.getElementById('xai-summary'),
            alerts: document.getElementById('alerts-container'),
            timestamp: document.getElementById('timestamp')
        };

        // --- 1. THREE.JS SETUP ---
        const container = document.getElementById('canvas-container');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff); 
        scene.fog = new THREE.FogExp2(0xffffff, 0.012);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(-15, 12, 35);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 + 0.1;
        controls.minDistance = 10;
        controls.maxDistance = 60;
        controls.target.set(0, 0, 0);

        // --- 2. ENVIRONMENT & LIGHTING ---
        const grid = new THREE.GridHelper(100, 50, 0x0066ff, 0xdddddd);
        grid.position.y = -8;
        grid.material.opacity = 0.5;
        grid.material.transparent = true;
        scene.add(grid);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(10, 20, 10);
        mainLight.castShadow = true;
        scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x0066ff, 0.4);
        fillLight.position.set(-10, 5, -10);
        scene.add(fillLight);

        // --- 3. PIPELINE GEOMETRY (WITH INNER WATER VOLUME) ---
        const pipeGroup = new THREE.Group();
        scene.add(pipeGroup);

        const pipeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff, 
            transmission: 0.8, 
            opacity: 0.4,
            metalness: 0.1,
            roughness: 0.1,
            ior: 1.5,
            thickness: 1.0,
            side: THREE.DoubleSide,
            transparent: true
        });

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            metalness: 0.7,
            roughness: 0.4,
        });

        // Main Outer Pipe (Length 44, spans entirely between tanks at +/- 22)
        const mainPipeGeo = new THREE.CylinderGeometry(2, 2, 44, 32);
        mainPipeGeo.rotateZ(Math.PI / 2);
        const mainPipe = new THREE.Mesh(mainPipeGeo, pipeMaterial);
        mainPipe.castShadow = true;
        pipeGroup.add(mainPipe);

        // Inner Blue Water Volume
        const innerWaterGeo = new THREE.CylinderGeometry(1.85, 1.85, 44, 32);
        innerWaterGeo.rotateZ(Math.PI / 2);
        const innerWaterMat = new THREE.MeshPhysicalMaterial({
            color: 0x0055ff,
            transmission: 0.6, 
            opacity: 0.6,
            transparent: true,
            roughness: 0.2,
            ior: 1.33 // Water IOR
        });
        const innerWater = new THREE.Mesh(innerWaterGeo, innerWaterMat);
        pipeGroup.add(innerWater);

        // Input Face Tank (Water Input - Temp Side)
        const tankGeo = new THREE.CylinderGeometry(4, 4, 10, 32);
        const inletTank = new THREE.Mesh(tankGeo, metalMaterial);
        inletTank.position.set(-22, 0, 0);
        inletTank.castShadow = true;
        pipeGroup.add(inletTank);

        // Output Face Tank (Water Output - Turbidity Side)
        const outletTank = new THREE.Mesh(tankGeo, metalMaterial);
        outletTank.position.set(22, 0, 0);
        outletTank.castShadow = true;
        pipeGroup.add(outletTank);

        // --- 4. SENSORS GEOMETRY ---
        const sensors = {};
        const sensorPositions = [
            { id: 'temp', name: 'Temp', x: -12, color: 0xff4400 },
            { id: 'tds', name: 'TDS', x: -4, color: 0x8800ff },
            { id: 'ph', name: 'pH', x: 4, color: 0x00aa00 },
            { id: 'turbidity', name: 'Turbidity', x: 12, color: 0x0066ff }
        ];

        const sensorBaseGeo = new THREE.BoxGeometry(3, 5, 5);
        const sensorRingGeo = new THREE.TorusGeometry(2.2, 0.4, 16, 32);
        sensorRingGeo.rotateY(Math.PI / 2);

        sensorPositions.forEach(sp => {
            const group = new THREE.Group();
            group.position.set(sp.x, 0, 0);

            const ring = new THREE.Mesh(sensorRingGeo, metalMaterial);
            group.add(ring);

            const box = new THREE.Mesh(sensorBaseGeo, metalMaterial);
            box.position.y = 3;
            box.castShadow = true;
            group.add(box);

            const stripGeo = new THREE.BoxGeometry(3.1, 0.5, 5.1);
            const strip = new THREE.Mesh(stripGeo, new THREE.MeshStandardMaterial({
                color: sp.color, emissive: sp.color, emissiveIntensity: 1
            }));
            strip.position.y = 3;
            group.add(strip);

            const antGeo = new THREE.CylinderGeometry(0.1, 0.1, 2);
            const antenna = new THREE.Mesh(antGeo, metalMaterial);
            antenna.position.set(0, 6.5, 0);
            group.add(antenna);

            pipeGroup.add(group);
            sensors[sp.id] = { group: group, strip: strip };
        });

        // --- 5. ESP32 & CLOUD SERVER ---
        const espGroup = new THREE.Group();
        espGroup.position.set(0, 12, -5);
        
        const boardGeo = new THREE.BoxGeometry(4, 0.2, 6);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x225522, metalness: 0.3, roughness: 0.8 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        espGroup.add(board);
        
        const chipGeo = new THREE.BoxGeometry(1.5, 0.3, 1.5);
        const chip = new THREE.Mesh(chipGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
        chip.position.y = 0.2;
        espGroup.add(chip);
        scene.add(espGroup);

        const cloudGroup = new THREE.Group();
        cloudGroup.position.set(0, 22, -10);
        
        const nodeGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const nodeMat = new THREE.MeshStandardMaterial({ color: 0x8800ff, transparent: true, opacity: 0.8 });
        
        const p1 = new THREE.Mesh(nodeGeo, nodeMat); p1.position.set(-2, 0, 0); cloudGroup.add(p1);
        const p2 = new THREE.Mesh(nodeGeo, nodeMat); p2.position.set(2, 0, 0); cloudGroup.add(p2);
        const p3 = new THREE.Mesh(nodeGeo, nodeMat); p3.position.set(0, 2, 0); cloudGroup.add(p3);
        const p4 = new THREE.Mesh(nodeGeo, nodeMat); p4.position.set(0, -1, 1.5); cloudGroup.add(p4);
        scene.add(cloudGroup);

        // --- 6. DATA CONNECTIONS ---
        const connectionLines = [];
        function createDataConnection(startPos, endPos, color) {
            const material = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
            const points = [startPos];
            const mid = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
            mid.y += 2; 
            const curve = new THREE.QuadraticBezierCurve3(startPos, mid, endPos);
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(20)), material);
            scene.add(line);

            const packet = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: color }));
            scene.add(packet);
            connectionLines.push({ line, curve, packet, progress: Math.random() });
        }

        sensorPositions.forEach(sp => createDataConnection(new THREE.Vector3(sp.x, 8, 0), espGroup.position, 0x0066ff));
        createDataConnection(espGroup.position, cloudGroup.position, 0x8800ff);
        createDataConnection(espGroup.position, new THREE.Vector3(-2, 22, -10), 0x8800ff);
        createDataConnection(espGroup.position, new THREE.Vector3(2, 22, -10), 0x8800ff);

        // --- 7. WATER & PARTICLE SYSTEMS ---
        
        // Denser Deep Blue Water Flow
        const waterParticleCount = 4000;
        const waterGeo = new THREE.BufferGeometry();
        const waterPos = new Float32Array(waterParticleCount * 3);
        const waterVel = [];
        for (let i = 0; i < waterParticleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * 1.6;
            // Spread strictly from -22 (Input face) to 22 (Output face)
            const x = -22 + Math.random() * 44; 
            waterPos[i*3] = x; 
            waterPos[i*3+1] = Math.sin(angle) * r; 
            waterPos[i*3+2] = Math.cos(angle) * r;
            waterVel.push(Math.random() * 0.15 + 0.08); // Faster flow
        }
        waterGeo.setAttribute('position', new THREE.BufferAttribute(waterPos, 3));
        const waterMat = new THREE.PointsMaterial({
            color: 0x0044ff, size: 0.3, transparent: true, opacity: 1.0, blending: THREE.NormalBlending
        });
        const waterSystem = new THREE.Points(waterGeo, waterMat);
        scene.add(waterSystem);

        // TDS Minerals
        const tdsCount = 1000;
        const tdsGeo = new THREE.BufferGeometry();
        const tdsPos = new Float32Array(tdsCount * 3);
        const tdsVel = [];
        for (let i = 0; i < tdsCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * 1.6;
            const x = -4 + Math.random() * 26; // From TDS sensor to Output face
            tdsPos[i*3] = x; tdsPos[i*3+1] = Math.sin(angle) * r; tdsPos[i*3+2] = Math.cos(angle) * r;
            tdsVel.push(Math.random() * 0.05 + 0.02);
        }
        tdsGeo.setAttribute('position', new THREE.BufferAttribute(tdsPos, 3));
        const tdsMat = new THREE.PointsMaterial({
            color: 0xcc6600, size: 0.2, transparent: true, opacity: 0, blending: THREE.NormalBlending
        });
        const tdsSystem = new THREE.Points(tdsGeo, tdsMat);
        scene.add(tdsSystem);

        // Turbidity Particles
        const turbCount = 1500;
        const turbGeo = new THREE.BufferGeometry();
        const turbPos = new Float32Array(turbCount * 3);
        const turbVel = [];
        for (let i = 0; i < turbCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * 1.6;
            const x = 12 + Math.random() * 10; // From Turbidity sensor to Output face
            turbPos[i*3] = x; turbPos[i*3+1] = Math.sin(angle) * r; turbPos[i*3+2] = Math.cos(angle) * r;
            turbVel.push(Math.random() * 0.08 + 0.03);
        }
        turbGeo.setAttribute('position', new THREE.BufferAttribute(turbPos, 3));
        const turbMat = new THREE.PointsMaterial({
            color: 0x442200, size: 0.3, transparent: true, opacity: 0, blending: THREE.NormalBlending
        });
        const turbSystem = new THREE.Points(turbGeo, turbMat);
        scene.add(turbSystem);


        // --- 8. CHART.JS INITIALIZATION ---
        const ctx = document.getElementById('telemetryChart').getContext('2d');
        Chart.defaults.color = '#333333';
        Chart.defaults.font.family = 'Rajdhani';
        Chart.defaults.font.weight = 'bold';
        
        const telemetryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(20).fill(''),
                datasets: [
                    { label: 'Temp', borderColor: '#ff6600', data: Array(20).fill(28.5), borderWidth: 2, pointRadius: 0, tension: 0.4 },
                    { label: 'pH (*10)', borderColor: '#00aa00', data: Array(20).fill(72), borderWidth: 2, pointRadius: 0, tension: 0.4 },
                    { label: 'TDS (/10)', borderColor: '#8800ff', data: Array(20).fill(42.5), borderWidth: 2, pointRadius: 0, tension: 0.4 },
                    { label: 'Turbidity (NTU)', borderColor: '#d90000', data: Array(20).fill(18.4), borderWidth: 2, pointRadius: 0, tension: 0.4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: { display: false },
                    y: { grid: { color: 'rgba(0,0,0,0.05)' } }
                },
                plugins: { legend: { labels: { boxWidth: 10, font: { size: 11, weight: 'bold' } } } }
            }
        });


        // --- 9. SIMULATION & XAI LOGIC ---
        function updateDashboardValue(elementId, value) {
            document.getElementById(elementId).innerText = value.toFixed(value % 1 === 0 ? 0 : 2);
        }

        function updateGauge(gaugeEl, percent) {
            const offset = 100 - (percent * 100);
            gaugeEl.style.strokeDashoffset = Math.max(0, Math.min(100, offset));
        }

        function addAlert(msg, type='info') {
            const el = document.createElement('div');
            let colors = type === 'alert' ? 'bg-red-50 border-red-500 text-red-800' : 
                         type === 'warn' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : 
                         'bg-blue-50 border-blue-500 text-blue-800';
            
            const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
            el.className = `p-2 border-l-4 ${colors} animate-pulse font-bold`;
            el.textContent = `[${time}] ${msg}`;
            
            ui.alerts.prepend(el);
            if(ui.alerts.children.length > 4) ui.alerts.removeChild(ui.alerts.lastChild);
        }

        function updateHologramPosition(vector3, element) {
            const pos = vector3.clone();
            pos.project(camera);
            const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (pos.y * -0.5 + 0.5) * window.innerHeight;
            
            if (pos.z < 1) {
                element.style.display = 'block';
                element.style.left = `${x}px`;
                element.style.top = `${y}px`;
            } else {
                element.style.display = 'none';
            }
        }

        function renderXAIBars(penalties, totalPenalty) {
            ui.xaiBarsContainer.replaceChildren();
            
            const features = [
                { name: 'Temperature Deviation', val: penalties.temp, color: 'bg-orange-500', text: 'text-orange-600' },
                { name: 'pH Imbalance', val: penalties.ph, color: 'bg-green-600', text: 'text-green-700' },
                { name: 'TDS Particles', val: penalties.tds, color: 'bg-purple-600', text: 'text-purple-700' },
                { name: 'Turbidity (Cloudiness)', val: penalties.turb, color: 'bg-blue-600', text: 'text-blue-700' }
            ];

            features.sort((a, b) => b.val - a.val);

            if(totalPenalty < 5) {
                ui.xaiSummary.textContent = 'Demo heuristic only; this is not a trained model or a water-quality index.';
                ui.xaiSummary.className = "text-xs text-green-700 font-mono font-bold leading-tight";
            } else {
                ui.xaiSummary.textContent = `In this synthetic example, ${features[0].name} contributes ${(features[0].val/totalPenalty*100).toFixed(0)}% of the demo score penalty. This is not a trained model.`;
                ui.xaiSummary.className = `text-xs ${features[0].text} font-mono font-bold leading-tight`;
            }

            features.forEach(f => {
                if(f.val < 0.1 && totalPenalty < 5) return; 
                const widthPercent = totalPenalty > 0 ? Math.min(100, (f.val / 30) * 100) : 0; 
                const penaltyDrop = f.val.toFixed(1);

                const row = document.createElement('div');
                row.className = 'mb-2';

                const labelRow = document.createElement('div');
                labelRow.className = 'flex justify-between text-[11px] font-bold mb-1';

                const name = document.createElement('span');
                name.className = 'text-gray-700 uppercase';
                name.textContent = f.name;

                const value = document.createElement('span');
                value.className = f.text;
                value.textContent = `-${penaltyDrop} demo score pts`;
                labelRow.append(name, value);

                const track = document.createElement('div');
                track.className = 'w-full bg-gray-200 rounded-full h-1.5';

                const bar = document.createElement('div');
                bar.className = `${f.color} h-1.5 rounded-full`;
                bar.style.width = `${widthPercent}%`;
                track.append(bar);
                row.append(labelRow, track);
                ui.xaiBarsContainer.append(row);
            });
        }

        let lastScenarioAlert = '';

        function setIncidentScenario(scenario) {
            Object.assign(state, setDemoScenario(scenario));
            if (scenario === 'turbidity-exceeded') {
                document.getElementById('incident-turbidity').textContent = state.turbidity.toFixed(1);
                document.getElementById('incident-status').textContent = 'INVESTIGATION REQUIRED';
                document.getElementById('incident-status').className = 'text-sm font-black text-red-700';
                document.getElementById('incident-explanation').textContent = `Simulated turbidity ${state.turbidity.toFixed(1)} NTU exceeds the illustrative ${DEMO_TURBIDITY_TRIGGER_NTU} NTU demo trigger. Verify, sample and investigate; do not infer potability from this reading.`;
                ui.holoTurbidity.classList.add('!border-red-600', '!text-red-700');
                if (lastScenarioAlert !== scenario) addAlert('SIMULATION: turbidity trigger exceeded; verify reading and arrange confirmatory sampling.', 'alert');
                lastScenarioAlert = scenario;
            } else {
                document.getElementById('incident-turbidity').textContent = state.turbidity.toFixed(1);
                document.getElementById('incident-status').textContent = 'BASELINE DEMO • NO TRIGGER';
                document.getElementById('incident-status').className = 'text-sm font-black text-blue-700';
                document.getElementById('incident-explanation').textContent = 'Synthetic baseline values are shown for interface testing only. This does not establish drinking-water safety.';
                ui.holoTurbidity.classList.remove('!border-red-600', '!text-red-700');
                if (lastScenarioAlert !== scenario) addAlert('SIMULATION reset to baseline values; no live data is being received.', 'info');
                lastScenarioAlert = scenario;
            }
        }
        document.getElementById('run-turbidity-scenario').addEventListener('click', () => setIncidentScenario('turbidity-exceeded'));
        document.getElementById('reset-simulation').addEventListener('click', () => setIncidentScenario('baseline'));

        function simulateData() {
            Object.assign(state, advanceDemoState(state));
            const { score, penalties, totalPenalty } = calculateDemoScore(state);
            renderXAIBars(penalties, totalPenalty);

            const incidentActive = state.scenario === 'turbidity-exceeded';
            const pipeTargetColor = new THREE.Color(incidentActive ? 0xff6666 : 0x88ccff);
            pipeMaterial.color.lerp(pipeTargetColor, 0.05);

            ui.wqiValue.textContent = score.toFixed(0);
            ui.wqiStatus.textContent = incidentActive ? 'INVESTIGATION FLAG • DEMO' : 'DEMO ONLY';
            ui.wqiStatus.className = incidentActive
                ? 'text-sm font-black text-red-700'
                : 'text-sm font-black text-blue-700';
            
            ui.holoTemp.textContent = `TEMP: ${state.temp.toFixed(1)}°C`;
            ui.holoPh.textContent = `pH: ${state.ph.toFixed(2)}`;
            ui.holoTds.textContent = `TDS: ${state.tds.toFixed(0)} ppm`;
            ui.holoTurbidity.textContent = `TURB: ${state.turbidity.toFixed(1)} NTU`;

            updateDashboardValue('dash-temp', state.temp);
            updateDashboardValue('dash-ph', state.ph);
            updateDashboardValue('dash-tds', state.tds);
            updateDashboardValue('dash-turbidity', state.turbidity);

            updateGauge(ui.gaugeTemp, (state.temp - 10) / 35);
            updateGauge(ui.gaugePh, state.ph / 14);
            updateGauge(ui.gaugeTds, state.tds / 1000);
            updateGauge(ui.gaugeTurb, Math.min(1, state.turbidity / 50));

            ui.timestamp.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });

            const tData = telemetryChart.data.datasets;
            tData[0].data.shift(); tData[0].data.push(state.temp);
            tData[1].data.shift(); tData[1].data.push(state.ph * 10);
            tData[2].data.shift(); tData[2].data.push(state.tds / 10);
            tData[3].data.shift(); tData[3].data.push(state.turbidity);
            telemetryChart.update();

            tdsMat.opacity = Math.min(0.9, (state.tds - 100) / 700);
            turbMat.opacity = Math.min(0.9, state.turbidity / 25);
        }

        setInterval(simulateData, 1000);

        // --- Render Loop ---
        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            controls.update();

            // Flow continuous blue water particles from Input Face (-22) to Output Face (22)
            const wPos = waterGeo.attributes.position.array;
            for(let i=0; i<waterParticleCount; i++) {
                wPos[i*3] += waterVel[i] * 60 * delta; 
                if(wPos[i*3] > 22) wPos[i*3] = -22; 
            }
            waterGeo.attributes.position.needsUpdate = true;

            // TDS flow
            const tPos = tdsGeo.attributes.position.array;
            for(let i=0; i<tdsCount; i++) {
                tPos[i*3] += tdsVel[i] * 60 * delta;
                if(tPos[i*3] > 22) tPos[i*3] = -4; // Reset to TDS sensor
            }
            tdsGeo.attributes.position.needsUpdate = true;

            // Turbidity flow
            const turbP = turbGeo.attributes.position.array;
            for(let i=0; i<turbCount; i++) {
                turbP[i*3] += turbVel[i] * 60 * delta;
                turbP[i*3+1] += Math.sin(time * 2 + i) * 0.01;
                turbP[i*3+2] += Math.cos(time * 2 + i) * 0.01;
                if(turbP[i*3] > 22) turbP[i*3] = 12; // Reset to Turbidity sensor
            }
            turbGeo.attributes.position.needsUpdate = true;

            connectionLines.forEach(conn => {
                conn.progress += delta * 0.5;
                if (conn.progress > 1) conn.progress = 0;
                const point = conn.curve.getPoint(conn.progress);
                conn.packet.position.copy(point);
            });

            updateHologramPosition(new THREE.Vector3(-12, 10, 0), ui.holoTemp);
            updateHologramPosition(new THREE.Vector3(-4, 10, 0), ui.holoTds);
            updateHologramPosition(new THREE.Vector3(4, 10, 0), ui.holoPh);
            updateHologramPosition(new THREE.Vector3(12, 10, 0), ui.holoTurbidity);
            updateHologramPosition(new THREE.Vector3(0, 16, -5), ui.holoEsp);
            updateHologramPosition(new THREE.Vector3(0, 26, -10), ui.holoCloud);

            renderer.render(scene, camera);
        }

        setIncidentScenario('turbidity-exceeded');
        simulateData();
        animate();
        document.getElementById('simulation-status').textContent = 'Demo active • synthetic values only';

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);
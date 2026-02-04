// API BASE URL
const API_BASE = 'http://44.212.246.54:3000/api';

// Global Variables
let areasData = [];
let currentArea = null;
let currentView = 'buckets';
let isConnected = false;

// Initialize App
async function init() {
    checkConnection();
    await loadAreasFromBackend();
    renderBuckets();
}

// Check backend connection
async function checkConnection() {
    const statusEl = document.getElementById('connectionStatus');
    const statusDot = statusEl.querySelector('.status-dot');
    
    try {
        const response = await fetch(`${API_BASE}/areas`);
        if (response.ok) {
            isConnected = true;
            statusEl.classList.remove('disconnected');
            statusEl.classList.add('connected');
            statusEl.querySelector('span').textContent = 'Bağlı';
            statusDot.style.background = '#4CAF50';
        } else {
            throw new Error('Connection failed');
        }
    } catch (error) {
        isConnected = false;
        statusEl.classList.remove('connected');
        statusEl.classList.add('disconnected');
        statusEl.querySelector('span').textContent = 'Bağlantı yoxdur';
        statusDot.style.background = '#e74c3c';
        console.error('Backend connection error:', error);
    }
}

// Show/Hide Loading
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// Load areas from backend
async function loadAreasFromBackend() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/areas`);
        if (!response.ok) throw new Error('Failed to load areas');
        
        areasData = await response.json();
        console.log('Areas loaded:', areasData);
    } catch (error) {
        console.error('Error loading areas:', error);
        await showConfirm({
            title: '❌ Xəta',
            message: 'Backend ilə əlaqə qurula bilmədi. Səhifəni yeniləyin.',
            buttons: [
                { text: 'Yenilə', value: 'reload', class: 'confirm-btn-yes' }
            ]
        });
        if (error.message === 'reload') {
            location.reload();
        }
    } finally {
        hideLoading();
    }
}

// Save area levels to backend
async function saveAreaLevels(areaName, lightLevel, darkLevel) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/areas/${areaName}/levels`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lightLevel, darkLevel })
        });
        
        if (!response.ok) throw new Error('Failed to save levels');
        
        return await response.json();
    } catch (error) {
        console.error('Error saving levels:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Add action to history
async function addHistoryToBackend(areaName, action, type, amount, note) {
    showLoading();
    try {
        const timestamp = Date.now();
        const response = await fetch(`${API_BASE}/areas/${areaName}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, type, amount, note, timestamp })
        });
        
        if (!response.ok) throw new Error('Failed to add history');
        
        return await response.json();
    } catch (error) {
        console.error('Error adding history:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Add custom action
async function addCustomActionToBackend(areaName, action, type) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/areas/${areaName}/actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, type })
        });
        
        if (!response.ok) throw new Error('Failed to add action');
        
        return await response.json();
    } catch (error) {
        console.error('Error adding action:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Reset area
async function resetAreaInBackend(areaName) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/areas/${areaName}/reset`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to reset area');
        
        return await response.json();
    } catch (error) {
        console.error('Error resetting area:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Reset all areas
async function resetAllAreasInBackend() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/areas/reset-all`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to reset all areas');
        
        return await response.json();
    } catch (error) {
        console.error('Error resetting all areas:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Toggle View
function toggleView() {
    const bucketsView = document.getElementById('bucketsView');
    const vizView = document.getElementById('visualizationView');
    
    if (currentView === 'buckets') {
        bucketsView.style.display = 'none';
        vizView.classList.add('active');
        currentView = 'visualization';
        renderVisualization();
    } else {
        bucketsView.style.display = 'block';
        vizView.classList.remove('active');
        currentView = 'buckets';
    }
}

// Calculate Circle Value
function calculateCircleValue(area) {
    const netValue = area.lightLevel - area.darkLevel;
    const circleValue = Math.max(0, Math.min(10, (netValue + 100) / 20));
    return circleValue;
}

// Render Visualization
function renderVisualization() {
    const container = document.getElementById('personCircles');
    const svg = document.getElementById('webSvg');
    
    const existingElements = container.querySelectorAll('.area-point, .area-end-dot, .area-label-viz');
    existingElements.forEach(el => el.remove());
    
    svg.innerHTML = '';
    
    const centerX = 300;
    const centerY = 300;
    const maxRadius = 220;
    const angleStep = (2 * Math.PI) / areasData.length;
    
    const points = areasData.map((area, index) => {
        const circleValue = calculateCircleValue(area);
        const angle = index * angleStep - Math.PI / 2;
        const radius = (circleValue / 10) * maxRadius;
        
        return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            area: area,
            circleValue: circleValue,
            angle: angle
        };
    });
    
    if (points.length > 0) {
        const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        gradient.setAttribute('id', 'webGradient');
        gradient.setAttribute('cx', '50%');
        gradient.setAttribute('cy', '50%');
        gradient.setAttribute('r', '50%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('style', 'stop-color:rgba(255,255,255,0.2);stop-opacity:1');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('style', 'stop-color:rgba(255,255,255,0.05);stop-opacity:1');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', polygonPoints);
        polygon.setAttribute('fill', 'url(#webGradient)');
        polygon.setAttribute('stroke', 'rgba(255,255,255,0.3)');
        polygon.setAttribute('stroke-width', '2');
        polygon.style.transition = 'all 0.5s ease';
        svg.appendChild(polygon);
        
        points.forEach(point => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', centerX);
            line.setAttribute('y1', centerY);
            line.setAttribute('x2', point.x);
            line.setAttribute('y2', point.y);
            line.setAttribute('stroke', point.area.color);
            line.setAttribute('stroke-width', '2');
            line.setAttribute('opacity', '0.5');
            line.style.transition = 'all 0.5s ease';
            svg.appendChild(line);
        });
        
        for (let i = 0; i < points.length; i++) {
            const nextI = (i + 1) % points.length;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', points[i].x);
            line.setAttribute('y1', points[i].y);
            line.setAttribute('x2', points[nextI].x);
            line.setAttribute('y2', points[nextI].y);
            
            const gradientId = `lineGrad${i}`;
            const lineGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            lineGrad.setAttribute('id', gradientId);
            
            const gradStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            gradStop1.setAttribute('offset', '0%');
            gradStop1.setAttribute('style', `stop-color:${points[i].area.color};stop-opacity:1`);
            
            const gradStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            gradStop2.setAttribute('offset', '100%');
            gradStop2.setAttribute('style', `stop-color:${points[nextI].area.color};stop-opacity:1`);
            
            lineGrad.appendChild(gradStop1);
            lineGrad.appendChild(gradStop2);
            svg.querySelector('defs').appendChild(lineGrad);
            
            line.setAttribute('stroke', `url(#${gradientId})`);
            line.setAttribute('stroke-width', '3');
            line.style.transition = 'all 0.5s ease';
            line.style.cursor = 'pointer';
            line.addEventListener('mouseenter', function() {
                this.setAttribute('stroke-width', '5');
            });
            line.addEventListener('mouseleave', function() {
                this.setAttribute('stroke-width', '3');
            });
            svg.appendChild(line);
        }
    }
    
    points.forEach((point, index) => {
        const area = point.area;
        
        const endDot = document.createElement('div');
        endDot.className = 'area-end-dot';
        endDot.style.left = (point.x - 12.5) + 'px';
        endDot.style.top = (point.y - 12.5) + 'px';
        endDot.style.borderColor = area.color;
        endDot.style.background = area.color;
        endDot.textContent = point.circleValue.toFixed(1);
        endDot.onclick = () => openAreaModal(area.name);
        container.appendChild(endDot);
        
        const labelDistance = maxRadius + 50;
        const labelX = centerX + Math.cos(point.angle) * labelDistance;
        const labelY = centerY + Math.sin(point.angle) * labelDistance;
        
        const label = document.createElement('div');
        label.className = 'area-label-viz';
        label.style.color = area.color;
        label.style.borderColor = area.color;
        
        const tempLabel = document.createElement('div');
        tempLabel.style.position = 'absolute';
        tempLabel.style.visibility = 'hidden';
        tempLabel.style.whiteSpace = 'nowrap';
        tempLabel.textContent = area.name;
        document.body.appendChild(tempLabel);
        const labelWidth = tempLabel.offsetWidth;
        document.body.removeChild(tempLabel);
        
        label.style.left = (labelX - labelWidth / 2 - 10) + 'px';
        label.style.top = (labelY - 15) + 'px';
        label.textContent = area.name;
        label.onclick = () => openAreaModal(area.name);
        container.appendChild(label);
    });
    
    const legend = document.getElementById('vizLegend');
    legend.innerHTML = '';
    areasData.forEach(area => {
        const circleValue = calculateCircleValue(area);
        const netValue = area.lightLevel - area.darkLevel;
        
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.style.borderLeftColor = area.color;
        legendItem.innerHTML = `
            <div class="legend-color" style="background: linear-gradient(to right, ${area.color}aa, ${area.color}ff);"></div>
            <div class="legend-info">
                <div class="legend-name" style="color: ${area.color};">${area.name}</div>
                <div class="legend-stats">
                    Dəyər: <strong>${circleValue.toFixed(1)}/10</strong><br>
                    ☀️ ${area.lightLevel.toFixed(1)}% | 🌙 ${area.darkLevel.toFixed(1)}% | Net: ${netValue.toFixed(1)}%
                </div>
            </div>
        `;
        legendItem.onclick = () => openAreaModal(area.name);
        legend.appendChild(legendItem);
    });
}

// Show Confirm Dialog
function showConfirm(options) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('confirmOverlay');
        const panel = document.getElementById('confirmPanel');
        const title = document.getElementById('confirmTitle');
        const subtitle = document.getElementById('confirmSubtitle');
        const message = document.getElementById('confirmMessage');
        const inputArea = document.getElementById('confirmInputArea');
        const buttonsArea = document.getElementById('confirmButtons');

        title.innerHTML = options.title || 'Təsdiq';
        subtitle.textContent = options.subtitle || '';
        message.innerHTML = options.message || '';
        inputArea.innerHTML = '';
        buttonsArea.innerHTML = '';

        if (options.input) {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'confirm-input-group';
            
            if (options.input.label) {
                const label = document.createElement('label');
                label.className = 'confirm-label';
                label.textContent = options.input.label;
                inputGroup.appendChild(label);
            }

            if (options.input.quickSelect) {
                const quickDiv = document.createElement('div');
                quickDiv.className = 'quick-select-buttons';
                
                options.input.quickSelect.forEach(item => {
                    const btn = document.createElement('div');
                    btn.className = 'quick-select-btn';
                    btn.innerHTML = `<div style="font-size: 10px; opacity: 0.7;">${item.label}</div><div style="font-size: 14px; font-weight: bold;">${item.value}</div>`;
                    btn.onclick = () => {
                        document.querySelectorAll('.quick-select-btn').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        document.getElementById('confirmInput').value = item.value;
                    };
                    quickDiv.appendChild(btn);
                });
                
                inputGroup.appendChild(quickDiv);
            }

            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'confirmInput';
            input.className = 'confirm-input';
            input.placeholder = options.input.placeholder || '';
            input.value = options.input.default || '';
            
            inputGroup.appendChild(input);
            inputArea.appendChild(inputGroup);

            setTimeout(() => input.focus(), 100);
        }

        if (options.buttons) {
            options.buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = `confirm-btn ${btn.class || 'confirm-btn-neutral'}`;
                button.textContent = btn.text;
                button.onclick = () => {
                    const inputValue = document.getElementById('confirmInput')?.value || null;
                    hideConfirm();
                    resolve({ button: btn.value, input: inputValue });
                };
                buttonsArea.appendChild(button);
            });
        }

        overlay.classList.add('active');
        panel.classList.add('active');
    });
}

function hideConfirm() {
    document.getElementById('confirmOverlay').classList.remove('active');
    document.getElementById('confirmPanel').classList.remove('active');
}

// Create Gradient Drop
function createGradientDrop(areaColor, type) {
    const drop = document.createElement('div');
    drop.className = 'drop-in-bucket';
    
    if (type === 'light') {
        drop.style.background = `linear-gradient(135deg, ${areaColor} 0%, #ffffff 100%)`;
    } else {
        drop.style.background = `linear-gradient(135deg, ${areaColor} 0%, #000000 100%)`;
    }
    
    return drop;
}

// Render Bucket Drops
function renderBucketDrops(container, area) {
    container.innerHTML = '';
    
    const lightDrops = Math.floor(area.lightLevel * 2);
    const darkDrops = Math.floor(area.darkLevel * 2);
    
    for (let i = 0; i < darkDrops; i++) {
        container.appendChild(createGradientDrop(area.color, 'dark'));
    }
    
    for (let i = 0; i < lightDrops; i++) {
        container.appendChild(createGradientDrop(area.color, 'light'));
    }
}

// Render Buckets
function renderBuckets() {
    const grid = document.getElementById('bucketsGrid');
    grid.innerHTML = '';

    areasData.forEach(area => {
        const totalLevel = area.lightLevel + area.darkLevel;
        const circleValue = calculateCircleValue(area);

        const bucketDiv = document.createElement('div');
        bucketDiv.className = 'bucket-container';
        bucketDiv.style.borderColor = area.color;
        bucketDiv.onclick = () => openAreaModal(area.name);

        bucketDiv.innerHTML = `
            <div class="bucket-name" style="color: ${area.color}">${area.name}</div>
            
            <div style="text-align: center; margin-bottom: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: ${area.color};">
                    ${circleValue.toFixed(1)}/10
                </div>
                <div style="font-size: 11px; opacity: 0.7;">Həyat Dəyəri</div>
            </div>
            
            <div class="faucet" style="color: ${area.color}" onclick="event.stopPropagation(); openAreaModal('${area.name}')">
                <svg viewBox="0 0 100 80" fill="currentColor">
                    <rect x="10" y="20" width="60" height="15" rx="5"/>
                    <rect x="60" y="10" width="15" height="35" rx="3"/>
                    <circle cx="67.5" cy="27.5" r="8" fill="white" opacity="0.3"/>
                    <path d="M 50 35 Q 50 45, 45 55 L 55 55 Q 50 45, 50 35" fill="currentColor" opacity="0.6"/>
                </svg>
            </div>

            <div class="bucket-visual" style="border: 3px solid ${area.color}">
                <div class="bucket-drops-container" data-area="${area.name}"></div>
                <div class="bucket-percentage">${totalLevel.toFixed(1)}%</div>
            </div>

            <div class="bucket-stats">
                <div class="stat-item">
                    <span>☀️</span>
                    <span class="stat-value stat-light">${area.lightLevel.toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span>🌙</span>
                    <span class="stat-value stat-dark">${area.darkLevel.toFixed(1)}%</span>
                </div>
            </div>

            <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: center;">
                <button onclick="event.stopPropagation(); manualAdjust('${area.name}')" style="padding: 8px 12px; background: #3498db; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 11px; font-weight: bold;">
                    ✏️ Manuel
                </button>
                <button onclick="event.stopPropagation(); resetArea('${area.name}')" style="padding: 8px 12px; background: #e74c3c; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 11px; font-weight: bold;">
                    🔄 Sıfırla
                </button>
            </div>
        `;

        grid.appendChild(bucketDiv);
        
        const dropsContainer = bucketDiv.querySelector('.bucket-drops-container');
        renderBucketDrops(dropsContainer, area);
    });
    
    if (currentView === 'visualization') {
        renderVisualization();
    }
}

// Open Area Modal
function openAreaModal(areaName) {
    currentArea = areaName;
    const area = areasData.find(a => a.name === areaName);

    const circleValue = calculateCircleValue(area);
    document.getElementById('modalTitle').innerHTML = `
        <span style="color: ${area.color}">${area.name}</span>
        <span style="font-size: 18px; opacity: 0.8;"> - ${circleValue.toFixed(1)}/10</span>
    `;

    updateModalBucket(area);
    renderActions('light', area.lightActions);
    renderActions('dark', area.darkActions);
    renderHistory(area.history);

    document.getElementById('areaModal').classList.add('active');
}

// Update Modal Bucket
function updateModalBucket(area) {
    const modalBucket = document.getElementById('modalBucketVisual');
    const modalDropsContainer = document.getElementById('modalDropsContainer');
    const modalPercentage = document.getElementById('modalPercentage');

    if (!modalBucket || !modalDropsContainer || !modalPercentage) {
        return;
    }

    modalBucket.style.borderColor = area.color;
    
    const totalLevel = area.lightLevel + area.darkLevel;
    modalPercentage.textContent = totalLevel.toFixed(1) + '%';

    renderBucketDrops(modalDropsContainer, area);

    modalBucket.onclick = () => showBucketDetails(area);
}

// Show Bucket Details
async function showBucketDetails(area) {
    if (area.history.length === 0) {
        await showConfirm({
            title: '🪣 Boş Kova',
            message: 'Bu kovada hələ heç bir əməl yoxdur.',
            buttons: [
                { text: 'Bağla', value: 'close', class: 'confirm-btn-neutral' }
            ]
        });
        return;
    }

    const sortedHistory = [...area.history].reverse();
    let detailsHTML = `<div style="max-height: 300px; overflow-y: auto;">`;
    
    sortedHistory.forEach((item, index) => {
        const gradientColor = item.type === 'light' 
            ? `linear-gradient(135deg, ${area.color} 0%, #ffffff 100%)`
            : `linear-gradient(135deg, ${area.color} 0%, #000000 100%)`;
        
        detailsHTML += `
            <div style="background: ${item.type === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)'}; 
                        padding: 10px; margin: 5px 0; border-radius: 8px; 
                        border-left: 4px solid; border-image: ${gradientColor} 1;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: ${gradientColor};"></div>
                    <strong>${index + 1}. ${item.action}</strong>
                </div>
                <span style="opacity: 0.8; font-size: 13px;">+${item.amount}% - ${item.date}</span>
                ${item.note ? `<br><span style="opacity: 0.7; font-size: 12px;">💬 ${item.note}</span>` : ''}
            </div>
        `;
    });
    
    detailsHTML += `</div>`;

    await showConfirm({
        title: `🪣 ${area.name} Kovanı`,
        subtitle: `Toplam ${area.history.length} əməl`,
        message: detailsHTML,
        buttons: [
            { text: 'Bağla', value: 'close', class: 'confirm-btn-neutral' }
        ]
    });
}

// Render Actions
function renderActions(type, actions) {
    const container = document.getElementById(`${type}Actions`);
    
    if (!container) {
        return;
    }
    
    container.innerHTML = '';

    if (!actions || !Array.isArray(actions)) {
        actions = [];
    }

    if (actions.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.cssText = 'padding: 20px; text-align: center; opacity: 0.5; grid-column: 1 / -1;';
        emptyDiv.textContent = 'Hələ əməl əlavə edilməyib';
        container.appendChild(emptyDiv);
        return;
    }

    actions.forEach((action, index) => {
        const actionWrapper = document.createElement('div');
        actionWrapper.style.cssText = 'position: relative;';
        
        const btn = document.createElement('button');
        btn.className = `action-btn ${type}`;
        btn.innerHTML = `
            <div style="font-size: 14px; font-weight: bold;">${action}</div>
            <div class="impact" style="margin-top: 5px;">
                ${type === 'light' ? '☀️' : '🌙'} Əlavə et
            </div>
        `;
        btn.onclick = (e) => {
            e.stopPropagation();
            showActionDialog(action, type);
        };
        
        actionWrapper.appendChild(btn);
        container.appendChild(actionWrapper);
    });
}

// Show Action Dialog
async function showActionDialog(action, type) {
    const area = areasData.find(a => a.name === currentArea);
    if (!area) return;
    
    const confirmResult = await showConfirm({
        title: `${type === 'light' ? '☀️' : '🌙'} Əməl Əlavə Et`,
        subtitle: `Sahə: ${area.name}`,
        message: `"<strong>${action}</strong>" əməlini əlavə etmək istəyirsiniz?`,
        buttons: [
            { text: 'Xeyr', value: 'no', class: 'confirm-btn-no' },
            { text: 'Bəli, davam et', value: 'yes', class: 'confirm-btn-yes' }
        ]
    });
    
    if (confirmResult.button !== 'yes') return;
    
    const amountResult = await showConfirm({
        title: '📊 Miqdar Seçin',
        subtitle: action,
        message: 'Sürətli seçim və ya öz rəqəminizi yazın:',
        input: {
            label: 'Miqdar (%)',
            placeholder: 'Və ya öz rəqəminizi yazın (məsələn: 1.5, 3, 7.5)',
            default: '1',
            quickSelect: [
                { label: 'Çox kiçik', value: '0.5' },
                { label: 'Kiçik', value: '1' },
                { label: 'Orta', value: '2' },
                { label: 'Böyük', value: '5' },
                { label: 'Çox böyük', value: '10' }
            ]
        },
        buttons: [
            { text: 'Geri', value: 'back', class: 'confirm-btn-no' },
            { text: 'Növbəti', value: 'next', class: 'confirm-btn-yes' }
        ]
    });
    
    if (amountResult.button !== 'next') return;
    
    const amount = parseFloat(amountResult.input) || 1;
    
    const noteResult = await showConfirm({
        title: '📝 Not Əlavə Et (İxtiyari)',
        subtitle: action,
        message: 'İstədiyiniz qeydi yazın və ya boş saxlayın:',
        input: {
            label: 'Not / Qeyd',
            placeholder: '💡 Məsələn: "10 dəqiqə meditasiya etdim", "Səhər 7:00-da"...'
        },
        buttons: [
            { text: 'Geri', value: 'back', class: 'confirm-btn-no' },
            { text: 'Boş saxla', value: 'skip', class: 'confirm-btn-neutral' },
            { text: 'Əlavə et', value: 'add', class: 'confirm-btn-yes' }
        ]
    });
    
    if (noteResult.button === 'back') return;
    
    const note = noteResult.button === 'add' ? noteResult.input : '';
    
    await addActionToArea(action, type, area, amount, note || '');
}

// Add Action to Area
async function addActionToArea(action, type, area, amount, note) {
    try {
        await addHistoryToBackend(area.name, action, type, amount, note);
        await loadAreasFromBackend();
        
        createDropAnimation(area.color, type);
        renderBuckets();
        
        const updatedArea = areasData.find(a => a.name === area.name);
        updateModalBucket(updatedArea);
        renderHistory(updatedArea.history);
    } catch (error) {
        await showConfirm({
            title: '❌ Xəta',
            message: 'Əməl əlavə edilərkən xəta baş verdi.',
            buttons: [
                { text: 'Bağla', value: 'close', class: 'confirm-btn-neutral' }
            ]
        });
    }
}

// Create Drop Animation
function createDropAnimation(color, type) {
    const allFaucets = document.querySelectorAll('.bucket-container .faucet');
    
    allFaucets.forEach((faucet) => {
        const bucketContainer = faucet.closest('.bucket-container');
        if (!bucketContainer) return;
        
        const drop = document.createElement('div');
        drop.style.position = 'absolute';
        drop.style.width = '20px';
        drop.style.height = '20px';
        drop.style.borderRadius = '50% 50% 50% 0';
        drop.style.transform = 'rotate(-45deg)';
        drop.style.left = '50%';
        drop.style.marginLeft = '-10px';
        drop.style.top = '80px';
        drop.style.zIndex = '9999';
        drop.style.pointerEvents = 'none';
        
        if (type === 'light') {
            drop.style.background = `linear-gradient(135deg, ${color} 0%, #ffffff 100%)`;
            drop.style.boxShadow = `0 0 15px ${color}`;
        } else {
            drop.style.background = `linear-gradient(135deg, ${color} 0%, #000000 100%)`;
            drop.style.boxShadow = `0 0 15px ${color}`;
        }
        
        drop.style.opacity = '1';
        drop.style.transition = 'all 1.5s ease-in';
        
        if (getComputedStyle(bucketContainer).position === 'static') {
            bucketContainer.style.position = 'relative';
        }
        
        bucketContainer.appendChild(drop);
        
        setTimeout(() => {
            drop.style.top = '320px';
            drop.style.opacity = '0';
            drop.style.transform = 'rotate(-45deg) scale(0.3)';
        }, 50);
        
        setTimeout(() => {
            if (drop && drop.parentNode) {
                drop.parentNode.removeChild(drop);
            }
        }, 1600);
    });

    const modalBucket = document.getElementById('modalBucketVisual');
    if (modalBucket) {
        const modalDrop = document.createElement('div');
        modalDrop.style.position = 'absolute';
        modalDrop.style.width = '15px';
        modalDrop.style.height = '15px';
        modalDrop.style.borderRadius = '50% 50% 50% 0';
        modalDrop.style.transform = 'rotate(-45deg)';
        modalDrop.style.left = '50%';
        modalDrop.style.marginLeft = '-7.5px';
        modalDrop.style.top = '-30px';
        modalDrop.style.zIndex = '100';
        modalDrop.style.pointerEvents = 'none';
        
        if (type === 'light') {
            modalDrop.style.background = `linear-gradient(135deg, ${color} 0%, #ffffff 100%)`;
            modalDrop.style.boxShadow = `0 0 10px ${color}`;
        } else {
            modalDrop.style.background = `linear-gradient(135deg, ${color} 0%, #000000 100%)`;
            modalDrop.style.boxShadow = `0 0 10px ${color}`;
        }
        
        modalDrop.style.opacity = '1';
        modalDrop.style.transition = 'all 1.2s ease-in';
        
        modalBucket.appendChild(modalDrop);
        
        setTimeout(() => {
            modalDrop.style.top = '200px';
            modalDrop.style.opacity = '0';
        }, 50);
        
        setTimeout(() => {
            if (modalDrop && modalDrop.parentNode) {
                modalDrop.parentNode.removeChild(modalDrop);
            }
        }, 1300);
    }
}

// Render History
function renderHistory(history) {
    const container = document.getElementById('historyList');
    
    if (history.length === 0) {
        container.innerHTML = '<div class="empty-state">Hələ heç bir əməl edilməyib</div>';
        return;
    }

    container.innerHTML = '';
    const sortedHistory = [...history].reverse();

    sortedHistory.forEach(item => {
        const historyDiv = document.createElement('div');
        historyDiv.className = `history-item ${item.type}`;
        historyDiv.innerHTML = `
            <div class="history-info">
                <div><strong>${item.action}</strong></div>
                ${item.note ? `<div style="font-size: 12px; opacity: 0.8; margin-top: 3px;">💬 ${item.note}</div>` : ''}
                <div class="history-date">${item.date}</div>
            </div>
            <div>${item.type === 'light' ? '☀️' : '🌙'} +${item.amount || 0.5}%</div>
        `;
        container.appendChild(historyDiv);
    });
}

// Add Custom Action
async function addCustomAction(type) {
    if (!currentArea) return;

    const result = await showConfirm({
        title: `${type === 'light' ? '☀️' : '🌙'} Yeni Əməl Əlavə Et`,
        subtitle: currentArea,
        message: 'Əməlin adını daxil edin:',
        input: {
            label: 'Əməl Adı',
            placeholder: 'Məsələn: Meditasiya, İdman, Oxumaq...'
        },
        buttons: [
            { text: 'Ləğv et', value: 'cancel', class: 'confirm-btn-no' },
            { text: 'Əlavə et', value: 'add', class: 'confirm-btn-yes' }
        ]
    });

    if (result.button !== 'add' || !result.input || result.input.trim() === '') {
        return;
    }

    try {
        await addCustomActionToBackend(currentArea, result.input.trim(), type);
        await loadAreasFromBackend();
        
        const area = areasData.find(a => a.name === currentArea);
        if (area) {
            renderActions('light', area.lightActions);
            renderActions('dark', area.darkActions);
        }
    } catch (error) {
        await showConfirm({
            title: '❌ Xəta',
            message: 'Əməl əlavə edilərkən xəta baş verdi.',
            buttons: [
                { text: 'Bağla', value: 'close', class: 'confirm-btn-neutral' }
            ]
        });
    }
}

// Manual Adjust
async function manualAdjust(areaName) {
    const area = areasData.find(a => a.name === areaName);
    
    const lightResult = await showConfirm({
        title: '✏️ Manuel Tənzimləmə',
        subtitle: `${areaName} - Aydınlıq Səviyyəsi`,
        message: 'Yeni aydınlıq səviyyəsini daxil edin (0-100):',
        input: {
            label: '☀️ Aydınlıq Səviyyəsi (%)',
            placeholder: '0 - 100',
            default: area.lightLevel.toFixed(1)
        },
        buttons: [
            { text: 'Ləğv et', value: 'cancel', class: 'confirm-btn-no' },
            { text: 'Növbəti', value: 'next', class: 'confirm-btn-yes' }
        ]
    });
    
    if (lightResult.button !== 'next') return;
    
    const darkResult = await showConfirm({
        title: '✏️ Manuel Tənzimləmə',
        subtitle: `${areaName} - Qaranlıq Səviyyəsi`,
        message: 'Yeni qaranlıq səviyyəsini daxil edin (0-100):',
        input: {
            label: '🌙 Qaranlıq Səviyyəsi (%)',
            placeholder: '0 - 100',
            default: area.darkLevel.toFixed(1)
        },
        buttons: [
            { text: 'Geri', value: 'back', class: 'confirm-btn-no' },
            { text: 'Yadda saxla', value: 'save', class: 'confirm-btn-yes' }
        ]
    });

    if (darkResult.button !== 'save') return;

    const newLight = Math.max(0, Math.min(100, parseFloat(lightResult.input) || 0));
    const newDark = Math.max(0, Math.min(100, parseFloat(darkResult.input) || 0));

    try {
        await saveAreaLevels(areaName, newLight, newDark);
        await loadAreasFromBackend();
        renderBuckets();
    } catch (error) {
        await showConfirm({
            title: '❌ Xəta',
            message: 'Səviyyələr saxlanılarkən xəta baş verdi.',
            buttons: [
                { text: 'Bağla', value: 'close', class: 'confirm-btn-neutral' }
            ]
        });
    }
}

// Reset Area
async function resetArea(areaName) {
    const result = await showConfirm({
        title: '🔄 Sahəni Sıfırla',
        subtitle: areaName,
        message: `<strong>${areaName}</strong> sahəsini sıfırlamaq istədiyinizə əminsiniz?<br><br><span style="color: #e74c3c;">⚠️ Bütün tarixçə silinəcək və bu əməliyyat geri alına bilməz!</span>`,
        buttons: [
            { text: 'Xeyr', value: 'no', class: 'confirm-btn-no' },
            { text: 'Bəli, sıfırla', value: 'yes', class: 'confirm-btn-yes' }
        ]
    });

    if (result.button !== 'yes') return;

    try {
        await resetAreaInBackend(areaName);
        await loadAreasFromBackend();
        renderBuckets();
    } catch (error) {
        await showConfirm({
            title: '❌ Xəta',
            message: 'Sıfırlama əməliyyatında xəta baş verdi.',
            buttons: [
                { text: 'Bağla', value: 'close', class: 'confirm-btn-neutral' }
            ]
        });
    }
}

// Open Master Bucket
function openMasterBucket() {
    renderMasterBucket();
    document.getElementById('masterModal').classList.add('active');
}

// Render Master Bucket
function renderMasterBucket() {
    let totalLight = 0;
    let totalDark = 0;
    let allHistory = [];

    areasData.forEach(area => {
        totalLight += area.lightLevel;
        totalDark += area.darkLevel;
        allHistory = allHistory.concat(area.history.map(h => ({
            ...h,
            area: area.name,
            color: area.color
        })));
    });

    const avgLight = totalLight / areasData.length;
    const avgDark = totalDark / areasData.length;
    const totalAvg = avgLight + avgDark;

    const masterDropsContainer = document.getElementById('masterDropsContainer');
    if (masterDropsContainer) {
        masterDropsContainer.innerHTML = '';
        
        const sortedHistory = allHistory.sort((a, b) => a.timestamp - b.timestamp);
        sortedHistory.forEach(item => {
            const drop = createGradientDrop(item.color, item.type);
            masterDropsContainer.appendChild(drop);
        });
    }

    document.getElementById('masterPercentage').textContent = totalAvg.toFixed(1) + '%';
    document.getElementById('totalLight').textContent = avgLight.toFixed(1) + '%';
    document.getElementById('totalDark').textContent = avgDark.toFixed(1) + '%';

    const lightCount = allHistory.filter(h => h.type === 'light').length;
    const darkCount = allHistory.filter(h => h.type === 'dark').length;
    document.getElementById('lightCount').textContent = lightCount + ' əməl';
    document.getElementById('darkCount').textContent = darkCount + ' əməl';

    const masterBucket = document.getElementById('masterBucketVisual');
    if (masterBucket) {
        masterBucket.onclick = () => showMasterBucketDetails(allHistory);
    }

    renderAreasBreakdown();
    renderMasterHistory(allHistory);
}

// Show Master Bucket Details
async function showMasterBucketDetails(allHistory) {
    if (allHistory.length === 0) {
        await showConfirm({
            title: '🏆 Boş Ümumi Kova',
            message: 'Hələ heç bir əməl edilməyib.',
            buttons: [
                { text: 'Bağla', value: 'close', class: 'confirm-btn-neutral' }
            ]
        });
        return;
    }

    const sortedHistory = allHistory.sort((a, b) => b.timestamp - a.timestamp);
    let detailsHTML = `<div style="max-height: 400px; overflow-y: auto;">`;
    
    sortedHistory.forEach((item, index) => {
        const gradientColor = item.type === 'light' 
            ? `linear-gradient(135deg, ${item.color} 0%, #ffffff 100%)`
            : `linear-gradient(135deg, ${item.color} 0%, #000000 100%)`;
        
        detailsHTML += `
            <div style="background: ${item.type === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)'}; 
                        padding: 10px; margin: 5px 0; border-radius: 8px; 
                        border-left: 4px solid; border-image: ${gradientColor} 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                    <div style="width: 14px; height: 14px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: ${gradientColor};"></div>
                    <span style="color: ${item.color}; font-weight: bold; font-size: 11px; padding: 2px 8px; background: rgba(0,0,0,0.3); border-radius: 10px;">${item.area}</span>
                </div>
                <strong style="font-size: 14px;">${index + 1}. ${item.action}</strong><br>
                <span style="opacity: 0.8; font-size: 12px;">+${item.amount}% - ${item.date}</span>
                ${item.note ? `<br><span style="opacity: 0.7; font-size: 11px;">💬 ${item.note}</span>` : ''}
            </div>
        `;
    });
    
    detailsHTML += `</div>`;

    await showConfirm({
        title: `🏆 Ümumi Kova - Bütün Əməllər`,
        subtitle: `Toplam ${allHistory.length} əməl (${allHistory.filter(h => h.type === 'light').length} ☀️ / ${allHistory.filter(h => h.type === 'dark').length} 🌙)`,
        message: detailsHTML,
        buttons: [
            { text: 'Bağla', value: 'close', class: 'confirm-btn-neutral' }
        ]
    });
}

// Render Areas Breakdown
function renderAreasBreakdown() {
    const container = document.getElementById('areasBreakdown');
    container.innerHTML = '';

    areasData.forEach(area => {
        const total = area.lightLevel + area.darkLevel;
        const lightPercent = total > 0 ? (area.lightLevel / total) * 100 : 0;
        const darkPercent = total > 0 ? (area.darkLevel / total) * 100 : 0;

        const barDiv = document.createElement('div');
        barDiv.className = 'area-bar';
        barDiv.innerHTML = `
            <div class="area-bar-label">
                <span style="color: ${area.color}">${area.name}</span>
                <span>${total.toFixed(1)}%</span>
            </div>
            <div class="area-bar-visual" style="border: 2px solid ${area.color}">
                <div class="area-bar-fill">
                    <div style="width: ${darkPercent}%; background: linear-gradient(135deg, ${area.color} 0%, #000000 100%);"></div>
                    <div style="width: ${lightPercent}%; background: linear-gradient(135deg, ${area.color} 0%, #ffffff 100%);"></div>
                </div>
            </div>
        `;
        container.appendChild(barDiv);
    });
}

// Render Master History
function renderMasterHistory(allHistory) {
    const container = document.getElementById('masterHistoryList');
    
    if (allHistory.length === 0) {
        container.innerHTML = '<div class="empty-state">Hələ heç bir əməl edilməyib</div>';
        return;
    }

    container.innerHTML = '';
    const sortedHistory = allHistory.sort((a, b) => b.timestamp - a.timestamp);

    sortedHistory.forEach(item => {
        const historyDiv = document.createElement('div');
        historyDiv.className = `history-item ${item.type}`;
        historyDiv.style.borderLeftColor = item.color;
        historyDiv.innerHTML = `
            <div class="history-info">
                <div>
                    <span style="color: ${item.color}; font-weight: bold;">[${item.area}]</span>
                    <strong>${item.action}</strong>
                </div>
                ${item.note ? `<div style="font-size: 12px; opacity: 0.8; margin-top: 3px;">💬 ${item.note}</div>` : ''}
                <div class="history-date">${item.date}</div>
            </div>
            <div>${item.type === 'light' ? '☀️' : '🌙'} +${item.amount || 0.5}%</div>
        `;
        container.appendChild(historyDiv);
    });
}

// Reset All Areas
async function resetAllAreas() {
    const result = await showConfirm({
        title: '🗑️ HAMISI SIL',
        subtitle: 'Bütün sahələri sıfırla',
        message: `<strong style="color: #e74c3c; font-size: 18px;">⚠️ DİQQƏT!</strong><br><br>BÜTÜN sahələri və tarixçəni silmək istədiyinizə əminsiniz?<br><br>Bu əməliyyat geri alına bilməz!`,
        buttons: [
            { text: 'Xeyr, geri qayıt', value: 'no', class: 'confirm-btn-no' },
            { text: 'Bəli, hamısını sil', value: 'yes', class: 'confirm-btn-yes' }
        ]
    });

    if (result.button !== 'yes') return;

    try {
        await resetAllAreasInBackend();
        await loadAreasFromBackend();
        renderBuckets();
        closeModal('masterModal');
    } catch (error) {
        await showConfirm({
            title: '❌ Xəta',
            message: 'Sıfırlama əməliyyatında xəta baş verdi.',
            buttons: [
                { text: 'Bağla', value: 'close', class: 'confirm-btn-neutral' }
            ]
        });
    }
}

// Close Modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Event Listeners
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

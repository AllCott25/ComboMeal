// Color scheme
const GREEN = '#2d5a2d';
const WHITE = '#ffffff';
const STROKE_WIDTH = 4;

// 1. Filled-in Flower Generator with more organic petal shapes
function createFilledFlower(size, variation) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 100 100');
    
    const centerX = 50;
    const centerY = 50;
    
    // Different variations with more organic petal arrangements
    const variations = [
        { rotation: 0, centerOffset: { x: -2, y: -1 }, centerSize: 7, petalScale: 1 },
        { rotation: 25, centerOffset: { x: 1, y: -2 }, centerSize: 9, petalScale: 0.95 },
        { rotation: -15, centerOffset: { x: -3, y: 2 }, centerSize: 6, petalScale: 1.05 },
        { rotation: 40, centerOffset: { x: 2, y: 1 }, centerSize: 8, petalScale: 0.9 },
        { rotation: -30, centerOffset: { x: 0, y: -3 }, centerSize: 10, petalScale: 1.1 },
        { rotation: 10, centerOffset: { x: -1, y: 0 }, centerSize: 7, petalScale: 0.98 },
        { rotation: -45, centerOffset: { x: 3, y: -2 }, centerSize: 11, petalScale: 0.92 },
        { rotation: 35, centerOffset: { x: -2, y: 3 }, centerSize: 5, petalScale: 1.02 },
        { rotation: -5, centerOffset: { x: 1, y: 2 }, centerSize: 9, petalScale: 0.96 },
        { rotation: 20, centerOffset: { x: -3, y: -1 }, centerSize: 8, petalScale: 1.08 }
    ];
    
    const config = variations[variation % variations.length];
    
    // Create more organic petals using paths
    const petalCount = 5;
    const baseAngles = [0, 68, 143, 215, 290]; // Irregular spacing
    
    baseAngles.forEach((baseAngle, i) => {
        const angle = (baseAngle + config.rotation) * Math.PI / 180;
        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Create organic petal shape using cubic bezier curves
        const petalLength = 25 * config.petalScale * (i % 2 === 0 ? 1 : 0.9);
        const petalWidth = 15 * config.petalScale * (i % 2 === 0 ? 0.95 : 1.05);
        
        const tipX = centerX + Math.cos(angle) * petalLength;
        const tipY = centerY + Math.sin(angle) * petalLength;
        
        // Control points for organic petal shape
        const cp1x = centerX + Math.cos(angle - 0.4) * petalWidth;
        const cp1y = centerY + Math.sin(angle - 0.4) * petalWidth;
        
        const cp2x = tipX + Math.cos(angle - 0.3) * petalWidth * 0.8;
        const cp2y = tipY + Math.sin(angle - 0.3) * petalWidth * 0.8;
        
        const cp3x = tipX + Math.cos(angle + 0.3) * petalWidth * 0.8;
        const cp3y = tipY + Math.sin(angle + 0.3) * petalWidth * 0.8;
        
        const cp4x = centerX + Math.cos(angle + 0.4) * petalWidth;
        const cp4y = centerY + Math.sin(angle + 0.4) * petalWidth;
        
        const path = `M ${centerX} ${centerY}
                      C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tipX} ${tipY}
                      C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${centerX} ${centerY}`;
        
        petal.setAttribute('d', path);
        petal.setAttribute('fill', GREEN);
        
        svg.appendChild(petal);
    });
    
    // Create slightly irregular center circle
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const cx = centerX + config.centerOffset.x;
    const cy = centerY + config.centerOffset.y;
    const r = config.centerSize;
    
    // Create slightly irregular circle
    const circlePath = `M ${cx + r} ${cy}
                        A ${r} ${r * 0.95} 0 0 1 ${cx} ${cy + r}
                        A ${r * 0.98} ${r} 0 0 1 ${cx - r} ${cy}
                        A ${r} ${r * 0.97} 0 0 1 ${cx} ${cy - r}
                        A ${r * 0.96} ${r} 0 0 1 ${cx + r} ${cy}`;
    
    centerCircle.setAttribute('d', circlePath);
    centerCircle.setAttribute('fill', WHITE);
    
    svg.appendChild(centerCircle);
    
    return svg;
}

// 2. Outline Flower Generator with more organic shapes
function createOutlineFlower(size, variation) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 100 100');
    
    const centerX = 50;
    const centerY = 50;
    
    // Different variations
    const variations = [
        { rotation: 0, centerSize: 11, petalScale: 1, angles: [0, 72, 144, 216, 288] },
        { rotation: 18, centerSize: 9, petalScale: 0.95, angles: [0, 68, 140, 215, 290] },
        { rotation: -25, centerSize: 13, petalScale: 1.05, angles: [0, 75, 145, 210, 285] },
        { rotation: 36, centerSize: 10, petalScale: 0.9, angles: [0, 70, 142, 218, 288] },
        { rotation: -12, centerSize: 8, petalScale: 1.1, angles: [0, 73, 146, 212, 290] },
        { rotation: 8, centerSize: 12, petalScale: 0.98, angles: [0, 71, 143, 214, 287] },
        { rotation: -40, centerSize: 11, petalScale: 0.92, angles: [0, 69, 141, 217, 291] },
        { rotation: 30, centerSize: 9, petalScale: 1.02, angles: [0, 74, 145, 213, 289] },
        { rotation: -18, centerSize: 14, petalScale: 0.96, angles: [0, 72, 140, 216, 285] },
        { rotation: 22, centerSize: 10, petalScale: 1.08, angles: [0, 76, 144, 211, 290] }
    ];
    
    const config = variations[variation % variations.length];
    
    // Create organic petal outlines
    config.angles.forEach((baseAngle, i) => {
        const angle = (baseAngle + config.rotation) * Math.PI / 180;
        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Create more organic oval shape
        const petalLength = 24 * config.petalScale * (i % 2 === 0 ? 1 : 0.88);
        const petalWidth = 13 * config.petalScale * (i % 2 === 0 ? 0.92 : 1.08);
        const petalDistance = petalLength * 0.5;
        
        const cx = centerX + Math.cos(angle) * petalDistance;
        const cy = centerY + Math.sin(angle) * petalDistance;
        
        // Create organic oval using bezier curves
        const startX = cx + Math.cos(angle) * petalLength * 0.5;
        const startY = cy + Math.sin(angle) * petalLength * 0.5;
        
        const endX = cx - Math.cos(angle) * petalLength * 0.5;
        const endY = cy - Math.sin(angle) * petalLength * 0.5;
        
        const cp1x = startX + Math.cos(angle + Math.PI/2) * petalWidth;
        const cp1y = startY + Math.sin(angle + Math.PI/2) * petalWidth;
        
        const cp2x = endX + Math.cos(angle + Math.PI/2) * petalWidth;
        const cp2y = endY + Math.sin(angle + Math.PI/2) * petalWidth;
        
        const cp3x = endX - Math.cos(angle + Math.PI/2) * petalWidth;
        const cp3y = endY - Math.sin(angle + Math.PI/2) * petalWidth;
        
        const cp4x = startX - Math.cos(angle + Math.PI/2) * petalWidth;
        const cp4y = startY - Math.sin(angle + Math.PI/2) * petalWidth;
        
        const path = `M ${startX} ${startY}
                      C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}
                      C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${startX} ${startY}`;
        
        petal.setAttribute('d', path);
        petal.setAttribute('fill', WHITE);
        petal.setAttribute('stroke', GREEN);
        petal.setAttribute('stroke-width', STROKE_WIDTH);
        petal.setAttribute('stroke-linejoin', 'round');
        
        svg.appendChild(petal);
    });
    
    // Create organic filled center
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const r = config.centerSize;
    
    // Create slightly irregular circle for center
    const circlePath = `M ${centerX + r} ${centerY}
                        A ${r * 0.98} ${r} 0 0 1 ${centerX} ${centerY + r}
                        A ${r} ${r * 0.96} 0 0 1 ${centerX - r} ${centerY}
                        A ${r * 0.97} ${r} 0 0 1 ${centerX} ${centerY - r}
                        A ${r} ${r * 0.99} 0 0 1 ${centerX + r} ${centerY}`;
    
    centerCircle.setAttribute('d', circlePath);
    centerCircle.setAttribute('fill', GREEN);
    
    svg.appendChild(centerCircle);
    
    return svg;
}

// 3. Sprig Generator with very soft, rounded organic shapes
function createSprig(size, variation) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 100 100');
    
    const variations = [
        { angles: [-35, -12, 12, 35], leafScale: 1, stemCurve: 0 },
        { angles: [-40, -15, 10, 33], leafScale: 0.95, stemCurve: -3 },
        { angles: [-30, -8, 15, 38], leafScale: 1.05, stemCurve: 3 },
        { angles: [-42, -18, 8, 30], leafScale: 0.9, stemCurve: -2 },
        { angles: [-28, -5, 18, 40], leafScale: 1.1, stemCurve: 2 },
        { angles: [-38, -14, 11, 34], leafScale: 0.98, stemCurve: -4 },
        { angles: [-33, -10, 14, 36], leafScale: 1.02, stemCurve: 1 },
        { angles: [-45, -20, 5, 28], leafScale: 0.92, stemCurve: -1 },
        { angles: [-32, -7, 16, 39], leafScale: 1.08, stemCurve: 4 },
        { angles: [-37, -13, 13, 37], leafScale: 0.96, stemCurve: -3 }
    ];
    
    const config = variations[variation % variations.length];
    const centerX = 50 + config.stemCurve;
    const centerY = 72;
    const stemTop = 45;
    
    // Create very soft curved stem
    const stem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const stemPath = `M ${centerX} ${centerY} 
                      Q ${centerX + config.stemCurve/2} ${(centerY + stemTop)/2} 
                        ${centerX + config.stemCurve} ${stemTop}`;
    stem.setAttribute('d', stemPath);
    stem.setAttribute('stroke', GREEN);
    stem.setAttribute('stroke-width', STROKE_WIDTH);
    stem.setAttribute('stroke-linecap', 'round');
    stem.setAttribute('fill', 'none');
    svg.appendChild(stem);
    
    // Create very soft, rounded teardrop leaves
    config.angles.forEach((angleDeg, i) => {
        const angle = angleDeg * Math.PI / 180 - Math.PI / 2;
        const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const startX = centerX + config.stemCurve;
        const startY = stemTop;
        
        // Vary leaf sizes for organic look
        const leafLength = 22 * config.leafScale * (i % 2 === 0 ? 1 : 0.85);
        const leafWidth = 8 * config.leafScale * (i === 1 || i === 2 ? 1.2 : 1);
        
        const tipX = startX + Math.cos(angle) * leafLength;
        const tipY = startY + Math.sin(angle) * leafLength;
        
        // Very soft, rounded control points
        const cp1x = startX + Math.cos(angle) * leafLength * 0.25 - Math.sin(angle) * leafWidth * 0.8;
        const cp1y = startY + Math.sin(angle) * leafLength * 0.25 + Math.cos(angle) * leafWidth * 0.8;
        
        const cp2x = startX + Math.cos(angle) * leafLength * 0.75 - Math.sin(angle) * leafWidth;
        const cp2y = startY + Math.sin(angle) * leafLength * 0.75 + Math.cos(angle) * leafWidth;
        
        const cp3x = startX + Math.cos(angle) * leafLength * 0.75 + Math.sin(angle) * leafWidth;
        const cp3y = startY + Math.sin(angle) * leafLength * 0.75 - Math.cos(angle) * leafWidth;
        
        const cp4x = startX + Math.cos(angle) * leafLength * 0.25 + Math.sin(angle) * leafWidth * 0.8;
        const cp4y = startY + Math.sin(angle) * leafLength * 0.25 - Math.cos(angle) * leafWidth * 0.8;
        
        // Extra control points for very rounded tip
        const tipcp1x = tipX - Math.cos(angle) * leafLength * 0.1 - Math.sin(angle) * leafWidth * 0.3;
        const tipcp1y = tipY - Math.sin(angle) * leafLength * 0.1 + Math.cos(angle) * leafWidth * 0.3;
        
        const tipcp2x = tipX - Math.cos(angle) * leafLength * 0.1 + Math.sin(angle) * leafWidth * 0.3;
        const tipcp2y = tipY - Math.sin(angle) * leafLength * 0.1 - Math.cos(angle) * leafWidth * 0.3;
        
        const path = `M ${startX} ${startY}
                      C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tipcp1x} ${tipcp1y}
                      Q ${tipX} ${tipY}, ${tipcp2x} ${tipcp2y}
                      C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${startX} ${startY}`;
        
        leaf.setAttribute('d', path);
        leaf.setAttribute('fill', WHITE);
        leaf.setAttribute('stroke', GREEN);
        leaf.setAttribute('stroke-width', STROKE_WIDTH);
        leaf.setAttribute('stroke-linejoin', 'round');
        leaf.setAttribute('stroke-linecap', 'round');
        
        svg.appendChild(leaf);
    });
    
    return svg;
}

// 4. Three Circles Generator with variations
function createThreeCircles(size, variation) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 100 100');
    
    // Different arrangements and sizes - more organic placements
    const variations = [
        { 
            circles: [
                { x: 36, y: 42, r: 11, filled: true },
                { x: 64, y: 41, r: 11, filled: true },
                { x: 50, y: 64, r: 11, filled: false }
            ]
        },
        { 
            circles: [
                { x: 31, y: 48, r: 13, filled: true },
                { x: 51, y: 36, r: 9, filled: false },
                { x: 69, y: 49, r: 13, filled: true }
            ]
        },
        { 
            circles: [
                { x: 41, y: 37, r: 10, filled: false },
                { x: 59, y: 36, r: 10, filled: true },
                { x: 50, y: 58, r: 14, filled: true }
            ]
        },
        { 
            circles: [
                { x: 37, y: 46, r: 12, filled: true },
                { x: 56, y: 32, r: 8, filled: true },
                { x: 61, y: 56, r: 15, filled: false }
            ]
        },
        { 
            circles: [
                { x: 46, y: 37, r: 7, filled: true },
                { x: 45, y: 63, r: 7, filled: true },
                { x: 64, y: 50, r: 16, filled: false }
            ]
        },
        { 
            circles: [
                { x: 32, y: 41, r: 9, filled: false },
                { x: 50, y: 49, r: 13, filled: true },
                { x: 68, y: 40, r: 9, filled: true }
            ]
        },
        { 
            circles: [
                { x: 39, y: 39, r: 14, filled: true },
                { x: 61, y: 38, r: 14, filled: true },
                { x: 50, y: 61, r: 9, filled: false }
            ]
        },
        { 
            circles: [
                { x: 36, y: 54, r: 11, filled: true },
                { x: 55, y: 41, r: 16, filled: false },
                { x: 64, y: 59, r: 8, filled: true }
            ]
        },
        { 
            circles: [
                { x: 41, y: 44, r: 10, filled: true },
                { x: 59, y: 45, r: 10, filled: true },
                { x: 50, y: 31, r: 6, filled: false }
            ]
        },
        { 
            circles: [
                { x: 27, y: 50, r: 12, filled: false },
                { x: 50, y: 46, r: 15, filled: true },
                { x: 73, y: 49, r: 12, filled: true }
            ]
        }
    ];
    
    const config = variations[variation % variations.length];
    
    // Sort circles by size (largest first) to ensure proper layering
    const sortedCircles = [...config.circles].sort((a, b) => b.r - a.r);
    
    sortedCircles.forEach(circleConfig => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Create slightly organic circles
        const cx = circleConfig.x;
        const cy = circleConfig.y;
        const r = circleConfig.r;
        
        const circlePath = `M ${cx + r} ${cy}
                            A ${r * 0.98} ${r} 0 0 1 ${cx} ${cy + r}
                            A ${r} ${r * 0.97} 0 0 1 ${cx - r} ${cy}
                            A ${r * 0.99} ${r} 0 0 1 ${cx} ${cy - r}
                            A ${r} ${r * 0.98} 0 0 1 ${cx + r} ${cy}`;
        
        circle.setAttribute('d', circlePath);
        
        if (circleConfig.filled) {
            circle.setAttribute('fill', GREEN);
        } else {
            circle.setAttribute('fill', WHITE);
            circle.setAttribute('stroke', GREEN);
            circle.setAttribute('stroke-width', STROKE_WIDTH);
        }
        
        svg.appendChild(circle);
    });
    
    return svg;
}

// Function to create a design item with both sizes
function createDesignItem(designFunc, name, variation) {
    const item = document.createElement('div');
    item.className = 'design-item';
    
    const title = document.createElement('h3');
    title.textContent = name;
    item.appendChild(title);
    
    const display = document.createElement('div');
    display.className = 'design-display';
    
    // Large version
    const largeContainer = document.createElement('div');
    const largeDesign = document.createElement('div');
    largeDesign.className = 'large-design';
    largeDesign.appendChild(designFunc(80, variation));
    largeContainer.appendChild(largeDesign);
    const largeLabel = document.createElement('div');
    largeLabel.className = 'size-label';
    largeLabel.textContent = 'Large (80px)';
    largeContainer.appendChild(largeLabel);
    
    // Small version
    const smallContainer = document.createElement('div');
    const smallDesign = document.createElement('div');
    smallDesign.className = 'small-design';
    smallDesign.appendChild(designFunc(20, variation));
    smallContainer.appendChild(smallDesign);
    const smallLabel = document.createElement('div');
    smallLabel.className = 'size-label';
    smallLabel.textContent = 'Small (20px)';
    smallContainer.appendChild(smallLabel);
    
    display.appendChild(largeContainer);
    display.appendChild(smallContainer);
    item.appendChild(display);
    
    return item;
}

// Generate all designs
document.addEventListener('DOMContentLoaded', function() {
    // Generate 10 filled flowers
    const filledFlowersContainer = document.getElementById('filled-flowers');
    for (let i = 0; i < 10; i++) {
        filledFlowersContainer.appendChild(
            createDesignItem(createFilledFlower, `Filled Flower ${i + 1}`, i)
        );
    }
    
    // Generate 10 outline flowers
    const outlineFlowersContainer = document.getElementById('outline-flowers');
    for (let i = 0; i < 10; i++) {
        outlineFlowersContainer.appendChild(
            createDesignItem(createOutlineFlower, `Outline Flower ${i + 1}`, i)
        );
    }
    
    // Generate 10 sprigs
    const sprigsContainer = document.getElementById('sprigs');
    for (let i = 0; i < 10; i++) {
        sprigsContainer.appendChild(
            createDesignItem(createSprig, `Sprig ${i + 1}`, i)
        );
    }
    
    // Generate 10 three circles
    const threeCirclesContainer = document.getElementById('three-circles');
    for (let i = 0; i < 10; i++) {
        threeCirclesContainer.appendChild(
            createDesignItem(createThreeCircles, `Three Circles ${i + 1}`, i)
        );
    }
});
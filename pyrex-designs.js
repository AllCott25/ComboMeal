// Color scheme
const GREEN = '#2d5a2d';
const WHITE = '#ffffff';
const STROKE_WIDTH = 4;

// 1. Filled-in Flower Generator with variations
function createFilledFlower(size, variation) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 100 100');
    
    const centerX = 50;
    const centerY = 50;
    
    // Different variations of petal arrangements
    const variations = [
        { petalLength: 28, petalWidth: 20, rotation: 0, centerOffset: { x: -3, y: -2 }, centerSize: 8 },
        { petalLength: 32, petalWidth: 18, rotation: 36, centerOffset: { x: 2, y: -3 }, centerSize: 10 },
        { petalLength: 26, petalWidth: 22, rotation: 18, centerOffset: { x: -2, y: 3 }, centerSize: 7 },
        { petalLength: 30, petalWidth: 19, rotation: -18, centerOffset: { x: 3, y: 2 }, centerSize: 9 },
        { petalLength: 34, petalWidth: 16, rotation: 45, centerOffset: { x: -4, y: 0 }, centerSize: 11 },
        { petalLength: 27, petalWidth: 21, rotation: -36, centerOffset: { x: 0, y: -4 }, centerSize: 8 },
        { petalLength: 31, petalWidth: 17, rotation: 12, centerOffset: { x: 2, y: 2 }, centerSize: 10 },
        { petalLength: 29, petalWidth: 20, rotation: -12, centerOffset: { x: -3, y: 1 }, centerSize: 6 },
        { petalLength: 33, petalWidth: 15, rotation: 24, centerOffset: { x: 1, y: -2 }, centerSize: 12 },
        { petalLength: 28, petalWidth: 19, rotation: -24, centerOffset: { x: -1, y: 3 }, centerSize: 9 }
    ];
    
    const config = variations[variation % variations.length];
    
    // Create petals with non-uniform angles
    const petalAngles = [0, 68, 144, 216, 292]; // Non-uniform angles
    
    petalAngles.forEach((baseAngle, i) => {
        const angle = (baseAngle + config.rotation) * Math.PI / 180;
        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        
        const petalDistance = config.petalLength * 0.55;
        const px = centerX + Math.cos(angle) * petalDistance;
        const py = centerY + Math.sin(angle) * petalDistance;
        
        // Vary petal sizes slightly
        const sizeMultiplier = i % 2 === 0 ? 1 : 0.95;
        
        petal.setAttribute('cx', px);
        petal.setAttribute('cy', py);
        petal.setAttribute('rx', config.petalWidth * sizeMultiplier);
        petal.setAttribute('ry', config.petalLength * sizeMultiplier);
        petal.setAttribute('transform', `rotate(${angle * 180 / Math.PI} ${px} ${py})`);
        petal.setAttribute('fill', GREEN);
        
        svg.appendChild(petal);
    });
    
    // Create off-center white circle
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('cx', centerX + config.centerOffset.x);
    centerCircle.setAttribute('cy', centerY + config.centerOffset.y);
    centerCircle.setAttribute('r', config.centerSize);
    centerCircle.setAttribute('fill', WHITE);
    
    svg.appendChild(centerCircle);
    
    return svg;
}

// 2. Outline Flower Generator with variations
function createOutlineFlower(size, variation) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 100 100');
    
    const centerX = 50;
    const centerY = 50;
    
    // Different variations
    const variations = [
        { petalLength: 26, petalWidth: 18, rotation: 0, centerSize: 12, angles: [0, 72, 144, 216, 288] },
        { petalLength: 30, petalWidth: 16, rotation: 20, centerSize: 10, angles: [0, 70, 140, 215, 290] },
        { petalLength: 24, petalWidth: 20, rotation: -15, centerSize: 14, angles: [0, 75, 145, 210, 285] },
        { petalLength: 28, petalWidth: 17, rotation: 35, centerSize: 11, angles: [0, 68, 142, 218, 292] },
        { petalLength: 32, petalWidth: 15, rotation: -25, centerSize: 9, angles: [0, 73, 146, 212, 287] },
        { petalLength: 25, petalWidth: 19, rotation: 10, centerSize: 13, angles: [0, 71, 143, 214, 286] },
        { petalLength: 29, petalWidth: 16, rotation: -30, centerSize: 12, angles: [0, 74, 141, 217, 289] },
        { petalLength: 27, petalWidth: 18, rotation: 40, centerSize: 10, angles: [0, 69, 145, 213, 291] },
        { petalLength: 31, petalWidth: 14, rotation: 15, centerSize: 11, angles: [0, 72, 140, 220, 288] },
        { petalLength: 26, petalWidth: 17, rotation: -20, centerSize: 15, angles: [0, 76, 144, 211, 290] }
    ];
    
    const config = variations[variation % variations.length];
    
    // Create petal outlines with white fill to hide overlaps
    config.angles.forEach((baseAngle, i) => {
        const angle = (baseAngle + config.rotation) * Math.PI / 180;
        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        
        const petalDistance = config.petalLength * 0.55;
        const px = centerX + Math.cos(angle) * petalDistance;
        const py = centerY + Math.sin(angle) * petalDistance;
        
        // Vary petal sizes
        const sizeMultiplier = i % 2 === 0 ? 1 : 0.9;
        
        petal.setAttribute('cx', px);
        petal.setAttribute('cy', py);
        petal.setAttribute('rx', config.petalWidth * sizeMultiplier);
        petal.setAttribute('ry', config.petalLength * sizeMultiplier);
        petal.setAttribute('transform', `rotate(${angle * 180 / Math.PI} ${px} ${py})`);
        petal.setAttribute('fill', WHITE);
        petal.setAttribute('stroke', GREEN);
        petal.setAttribute('stroke-width', STROKE_WIDTH);
        
        svg.appendChild(petal);
    });
    
    // Create filled center
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('cx', centerX);
    centerCircle.setAttribute('cy', centerY);
    centerCircle.setAttribute('r', config.centerSize);
    centerCircle.setAttribute('fill', GREEN);
    
    svg.appendChild(centerCircle);
    
    return svg;
}

// 3. Sprig Generator with rounded ends and shared branch
function createSprig(size, variation) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 100 100');
    
    const variations = [
        { angles: [-40, -15, 15, 40], leafLength: 28, leafWidth: 10, stemLength: 15 },
        { angles: [-45, -20, 10, 35], leafLength: 30, leafWidth: 9, stemLength: 18 },
        { angles: [-35, -10, 20, 45], leafLength: 26, leafWidth: 11, stemLength: 12 },
        { angles: [-50, -25, 5, 30], leafLength: 32, leafWidth: 8, stemLength: 20 },
        { angles: [-30, -5, 25, 50], leafLength: 27, leafWidth: 10, stemLength: 14 },
        { angles: [-42, -18, 12, 38], leafLength: 29, leafWidth: 9, stemLength: 16 },
        { angles: [-38, -12, 18, 42], leafLength: 31, leafWidth: 11, stemLength: 17 },
        { angles: [-48, -22, 8, 32], leafLength: 25, leafWidth: 10, stemLength: 13 },
        { angles: [-33, -8, 22, 47], leafLength: 28, leafWidth: 12, stemLength: 15 },
        { angles: [-43, -17, 13, 37], leafLength: 30, leafWidth: 9, stemLength: 19 }
    ];
    
    const config = variations[variation % variations.length];
    const centerX = 50;
    const centerY = 70;
    
    // Create shared stem/branch
    const stem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const stemPath = `M ${centerX} ${centerY} L ${centerX} ${centerY - config.stemLength}`;
    stem.setAttribute('d', stemPath);
    stem.setAttribute('stroke', GREEN);
    stem.setAttribute('stroke-width', STROKE_WIDTH);
    stem.setAttribute('stroke-linecap', 'round');
    stem.setAttribute('fill', 'none');
    svg.appendChild(stem);
    
    // Create teardrop leaves with rounded ends
    config.angles.forEach((angleDeg, i) => {
        const angle = angleDeg * Math.PI / 180 - Math.PI / 2;
        const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const startX = centerX;
        const startY = centerY - config.stemLength;
        
        // Vary leaf sizes
        const lengthMultiplier = i % 2 === 0 ? 1 : 0.85;
        const widthMultiplier = i % 2 === 0 ? 1 : 1.1;
        
        const leafLen = config.leafLength * lengthMultiplier;
        const leafWid = config.leafWidth * widthMultiplier;
        
        const endX = startX + Math.cos(angle) * leafLen;
        const endY = startY + Math.sin(angle) * leafLen;
        
        // Control points for rounded teardrop shape
        const cp1x = startX + Math.cos(angle) * leafLen * 0.4 - Math.sin(angle) * leafWid;
        const cp1y = startY + Math.sin(angle) * leafLen * 0.4 + Math.cos(angle) * leafWid;
        
        const cp2x = startX + Math.cos(angle) * leafLen * 0.8 - Math.sin(angle) * leafWid * 0.6;
        const cp2y = startY + Math.sin(angle) * leafLen * 0.8 + Math.cos(angle) * leafWid * 0.6;
        
        const cp3x = startX + Math.cos(angle) * leafLen * 0.8 + Math.sin(angle) * leafWid * 0.6;
        const cp3y = startY + Math.sin(angle) * leafLen * 0.8 - Math.cos(angle) * leafWid * 0.6;
        
        const cp4x = startX + Math.cos(angle) * leafLen * 0.4 + Math.sin(angle) * leafWid;
        const cp4y = startY + Math.sin(angle) * leafLen * 0.4 - Math.cos(angle) * leafWid;
        
        const path = `M ${startX} ${startY}
                      C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}
                      C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${startX} ${startY}`;
        
        leaf.setAttribute('d', path);
        leaf.setAttribute('fill', WHITE);
        leaf.setAttribute('stroke', GREEN);
        leaf.setAttribute('stroke-width', STROKE_WIDTH);
        leaf.setAttribute('stroke-linejoin', 'round');
        
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
    
    // Different arrangements and sizes
    const variations = [
        { 
            circles: [
                { x: 35, y: 40, r: 12, filled: true },
                { x: 65, y: 40, r: 12, filled: true },
                { x: 50, y: 65, r: 12, filled: false }
            ]
        },
        { 
            circles: [
                { x: 30, y: 50, r: 14, filled: true },
                { x: 50, y: 35, r: 10, filled: false },
                { x: 70, y: 50, r: 14, filled: true }
            ]
        },
        { 
            circles: [
                { x: 40, y: 35, r: 11, filled: false },
                { x: 60, y: 35, r: 11, filled: true },
                { x: 50, y: 60, r: 15, filled: true }
            ]
        },
        { 
            circles: [
                { x: 35, y: 45, r: 13, filled: true },
                { x: 55, y: 30, r: 9, filled: true },
                { x: 60, y: 55, r: 16, filled: false }
            ]
        },
        { 
            circles: [
                { x: 45, y: 35, r: 8, filled: true },
                { x: 45, y: 65, r: 8, filled: true },
                { x: 65, y: 50, r: 18, filled: false }
            ]
        },
        { 
            circles: [
                { x: 30, y: 40, r: 10, filled: false },
                { x: 50, y: 50, r: 14, filled: true },
                { x: 70, y: 40, r: 10, filled: true }
            ]
        },
        { 
            circles: [
                { x: 38, y: 38, r: 15, filled: true },
                { x: 62, y: 38, r: 15, filled: true },
                { x: 50, y: 62, r: 10, filled: false }
            ]
        },
        { 
            circles: [
                { x: 35, y: 55, r: 12, filled: true },
                { x: 55, y: 40, r: 17, filled: false },
                { x: 65, y: 60, r: 9, filled: true }
            ]
        },
        { 
            circles: [
                { x: 40, y: 45, r: 11, filled: true },
                { x: 60, y: 45, r: 11, filled: true },
                { x: 50, y: 30, r: 7, filled: false }
            ]
        },
        { 
            circles: [
                { x: 25, y: 50, r: 13, filled: false },
                { x: 50, y: 45, r: 16, filled: true },
                { x: 75, y: 50, r: 13, filled: true }
            ]
        }
    ];
    
    const config = variations[variation % variations.length];
    
    // Sort circles by size (largest first) to ensure proper layering
    const sortedCircles = [...config.circles].sort((a, b) => b.r - a.r);
    
    sortedCircles.forEach(circleConfig => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        
        circle.setAttribute('cx', circleConfig.x);
        circle.setAttribute('cy', circleConfig.y);
        circle.setAttribute('r', circleConfig.r);
        
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
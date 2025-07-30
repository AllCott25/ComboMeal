// Color scheme
const GREEN = '#2d5a2d';
const WHITE = '#ffffff';

// Helper function to add slight randomness for hand-made effect
function wobble(value, maxWobble = 3) {
    return value + (Math.random() - 0.5) * maxWobble;
}

// Helper function to create wonky circles
function createWonkyCircle(cx, cy, r) {
    const points = 8;
    let path = 'M';
    
    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wobbleAmount = i === points ? 0 : wobble(0, r * 0.1);
        const x = cx + Math.cos(angle) * (r + wobbleAmount);
        const y = cy + Math.sin(angle) * (r + wobbleAmount);
        
        if (i === 0) {
            path += `${x} ${y}`;
        } else {
            const cp1x = cx + Math.cos(angle - Math.PI / points) * (r + wobbleAmount) * 1.3;
            const cp1y = cy + Math.sin(angle - Math.PI / points) * (r + wobbleAmount) * 1.3;
            path += ` Q${cp1x} ${cp1y} ${x} ${y}`;
        }
    }
    
    return path + ' Z';
}

// 1. Filled-in Flower Generator
function createFilledFlower(size) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 100 100');
    
    const petalCount = 5;
    const centerX = 50;
    const centerY = 50;
    const petalLength = wobble(30, 2);
    const petalWidth = wobble(18, 2);
    
    // Create petals
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        
        const px = centerX + Math.cos(angle) * petalLength * 0.6;
        const py = centerY + Math.sin(angle) * petalLength * 0.6;
        
        petal.setAttribute('cx', wobble(px, 2));
        petal.setAttribute('cy', wobble(py, 2));
        petal.setAttribute('rx', petalWidth);
        petal.setAttribute('ry', petalLength);
        petal.setAttribute('transform', `rotate(${angle * 180 / Math.PI + wobble(0, 5)} ${px} ${py})`);
        petal.setAttribute('fill', GREEN);
        
        svg.appendChild(petal);
    }
    
    // Create off-center white circle
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const circleRadius = wobble(8, 1);
    const offsetX = wobble(3, 2);
    const offsetY = wobble(3, 2);
    centerCircle.setAttribute('d', createWonkyCircle(centerX + offsetX, centerY + offsetY, circleRadius));
    centerCircle.setAttribute('fill', WHITE);
    
    svg.appendChild(centerCircle);
    
    return svg;
}

// 2. Outline Flower Generator
function createOutlineFlower(size) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 100 100');
    
    const petalCount = 5;
    const centerX = 50;
    const centerY = 50;
    const petalLength = wobble(28, 2);
    const petalWidth = wobble(16, 2);
    
    // Create petal outlines
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        
        const px = centerX + Math.cos(angle) * petalLength * 0.6;
        const py = centerY + Math.sin(angle) * petalLength * 0.6;
        
        petal.setAttribute('cx', wobble(px, 2));
        petal.setAttribute('cy', wobble(py, 2));
        petal.setAttribute('rx', petalWidth);
        petal.setAttribute('ry', petalLength);
        petal.setAttribute('transform', `rotate(${angle * 180 / Math.PI + wobble(0, 5)} ${px} ${py})`);
        petal.setAttribute('fill', 'none');
        petal.setAttribute('stroke', GREEN);
        petal.setAttribute('stroke-width', wobble(2, 0.5));
        
        svg.appendChild(petal);
    }
    
    // Create filled center
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    centerCircle.setAttribute('d', createWonkyCircle(centerX, centerY, wobble(10, 1)));
    centerCircle.setAttribute('fill', GREEN);
    
    svg.appendChild(centerCircle);
    
    return svg;
}

// 3. Sprig Generator
function createSprig(size) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 100 100');
    
    const leafCount = 4;
    const centerX = 50;
    const centerY = 60;
    
    // Create teardrop leaves
    for (let i = 0; i < leafCount; i++) {
        const angle = (i / leafCount) * Math.PI * 0.8 - Math.PI * 0.4 - Math.PI / 2;
        const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const startX = centerX + wobble(0, 3);
        const startY = centerY + wobble(0, 3);
        const endX = startX + Math.cos(angle) * wobble(30, 3);
        const endY = startY + Math.sin(angle) * wobble(30, 3);
        
        // Create teardrop shape with wonky curves
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const perpX = Math.sin(angle) * wobble(10, 2);
        const perpY = -Math.cos(angle) * wobble(10, 2);
        
        const path = `M ${startX} ${startY} 
                      Q ${midX + perpX} ${midY + perpY} ${endX} ${endY}
                      Q ${midX - perpX} ${midY - perpY} ${startX} ${startY}`;
        
        leaf.setAttribute('d', path);
        leaf.setAttribute('fill', 'none');
        leaf.setAttribute('stroke', GREEN);
        leaf.setAttribute('stroke-width', wobble(2, 0.5));
        
        svg.appendChild(leaf);
    }
    
    return svg;
}

// 4. Three Circles Generator
function createThreeCircles(size) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 100 100');
    
    // Position variations
    const positions = [
        { x: wobble(35, 5), y: wobble(40, 5), filled: true },
        { x: wobble(65, 5), y: wobble(40, 5), filled: true },
        { x: wobble(50, 5), y: wobble(65, 5), filled: false }
    ];
    
    positions.forEach(pos => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const radius = wobble(12, 2);
        
        circle.setAttribute('d', createWonkyCircle(pos.x, pos.y, radius));
        
        if (pos.filled) {
            circle.setAttribute('fill', GREEN);
        } else {
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', GREEN);
            circle.setAttribute('stroke-width', wobble(2, 0.5));
        }
        
        svg.appendChild(circle);
    });
    
    return svg;
}

// Function to create a design item with both sizes
function createDesignItem(designFunc, name) {
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
    largeDesign.appendChild(designFunc(100));
    largeContainer.appendChild(largeDesign);
    const largeLabel = document.createElement('div');
    largeLabel.className = 'size-label';
    largeLabel.textContent = 'Large (100px)';
    largeContainer.appendChild(largeLabel);
    
    // Small version
    const smallContainer = document.createElement('div');
    const smallDesign = document.createElement('div');
    smallDesign.className = 'small-design';
    smallDesign.appendChild(designFunc(50));
    smallContainer.appendChild(smallDesign);
    const smallLabel = document.createElement('div');
    smallLabel.className = 'size-label';
    smallLabel.textContent = 'Small (50px)';
    smallContainer.appendChild(smallLabel);
    
    display.appendChild(largeContainer);
    display.appendChild(smallContainer);
    item.appendChild(display);
    
    return item;
}

// Generate all designs
document.addEventListener('DOMContentLoaded', function() {
    // Generate 5 filled flowers
    const filledFlowersContainer = document.getElementById('filled-flowers');
    for (let i = 1; i <= 5; i++) {
        filledFlowersContainer.appendChild(
            createDesignItem(createFilledFlower, `Filled Flower ${i}`)
        );
    }
    
    // Generate 5 outline flowers
    const outlineFlowersContainer = document.getElementById('outline-flowers');
    for (let i = 1; i <= 5; i++) {
        outlineFlowersContainer.appendChild(
            createDesignItem(createOutlineFlower, `Outline Flower ${i}`)
        );
    }
    
    // Generate 5 sprigs
    const sprigsContainer = document.getElementById('sprigs');
    for (let i = 1; i <= 5; i++) {
        sprigsContainer.appendChild(
            createDesignItem(createSprig, `Sprig ${i}`)
        );
    }
    
    // Generate 5 three circles
    const threeCirclesContainer = document.getElementById('three-circles');
    for (let i = 1; i <= 5; i++) {
        threeCirclesContainer.appendChild(
            createDesignItem(createThreeCircles, `Three Circles ${i}`)
        );
    }
});
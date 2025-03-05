// Textured Mixing Bowl Variants for Culinary Logic Puzzle Game
// This file contains 10 different textured mixing bowl designs with white bases and avocado green patterns

// Array to store all bowl design functions
const bowlDesigns = [];

// Bowl design class
class BowlDesign {
  constructor(name, description, drawFunction) {
    this.name = name;
    this.description = description;
    this.drawFunction = drawFunction;
  }
}

// Create individual p5.js instances for each bowl design
function setupBowlDesigns() {
  // Create container elements for each bowl design
  bowlDesigns.forEach((design, index) => {
    const containerDiv = document.createElement('div');
    containerDiv.className = 'design-card';
    containerDiv.id = `bowl-${index}`;
    
    const titleElement = document.createElement('h3');
    titleElement.className = 'design-title';
    titleElement.textContent = design.name;
    containerDiv.appendChild(titleElement);
    
    const canvasContainer = document.createElement('div');
    canvasContainer.id = `canvas-${index}`;
    containerDiv.appendChild(canvasContainer);
    
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'design-description';
    descriptionElement.textContent = design.description;
    containerDiv.appendChild(descriptionElement);
    
    document.getElementById('textured-bowls-row').appendChild(containerDiv);
    
    // Create a new p5 instance for this bowl
    new p5(function(p) {
      p.setup = function() {
        const canvas = p.createCanvas(200, 200);
        canvas.parent(`canvas-${index}`);
      };
      
      p.draw = function() {
        p.background(245, 241, 232);
        p.translate(p.width/2, p.height/2);
        design.drawFunction(p);
      };
    });
  });
}

// Common bowl shape function
function drawBowlBase(p) {
  // White base
  p.fill(255);
  p.stroke(100);
  p.strokeWeight(2);
  
  // Draw the bowl with 90-degree angle at the top
  p.beginShape();
  p.vertex(-60, -20);  // Left top edge
  p.vertex(-60, 50);   // Left side (straight down)
  p.vertex(60, 50);    // Bottom
  p.vertex(60, -20);   // Right side (straight up)
  p.endShape(p.CLOSE);
}

// Avocado green color for patterns
const avocadoGreen = [119, 143, 93]; // RGB for #778F5D

// ===== TEXTURED MIXING BOWL VARIANTS =====

// 1. Striped Pattern Bowl
bowlDesigns.push(new BowlDesign(
  'Striped Pattern Bowl',
  'A mixing bowl with horizontal stripes in avocado green.',
  function(p) {
    drawBowlBase(p);
    
    // Add horizontal stripes
    p.stroke(avocadoGreen);
    p.strokeWeight(3);
    for (let y = -10; y < 50; y += 10) {
      p.line(-59, y, 59, y);
    }
  }
));

// 2. Dotted Pattern Bowl
bowlDesigns.push(new BowlDesign(
  'Dotted Pattern Bowl',
  'A mixing bowl with a grid of dots in avocado green.',
  function(p) {
    drawBowlBase(p);
    
    // Add dots
    p.fill(avocadoGreen);
    p.noStroke();
    for (let x = -50; x <= 50; x += 10) {
      for (let y = -10; y <= 40; y += 10) {
        p.ellipse(x, y, 4, 4);
      }
    }
  }
));

// 3. Zigzag Pattern Bowl
bowlDesigns.push(new BowlDesign(
  'Zigzag Pattern Bowl',
  'A mixing bowl with zigzag lines in avocado green.',
  function(p) {
    drawBowlBase(p);
    
    // Add zigzag pattern
    p.stroke(avocadoGreen);
    p.strokeWeight(2);
    p.noFill();
    
    for (let y = -10; y < 50; y += 15) {
      p.beginShape();
      for (let x = -55; x <= 55; x += 10) {
        p.vertex(x, y + ((x % 20 === 0) ? -5 : 5));
      }
      p.endShape();
    }
  }
));

// 4. Checkered Pattern Bowl
bowlDesigns.push(new BowlDesign(
  'Checkered Pattern Bowl',
  'A mixing bowl with a checkered pattern in avocado green and white.',
  function(p) {
    drawBowlBase(p);
    
    // Add checkered pattern
    p.fill(avocadoGreen);
    p.noStroke();
    
    for (let x = -55; x < 55; x += 10) {
      for (let y = -15; y < 45; y += 10) {
        if ((x + y) % 20 === 0) {
          p.rect(x, y, 10, 10);
        }
      }
    }
  }
));

// 5. Floral Pattern Bowl
bowlDesigns.push(new BowlDesign(
  'Floral Pattern Bowl',
  'A mixing bowl with simple flower motifs in avocado green.',
  function(p) {
    drawBowlBase(p);
    
    // Add floral pattern
    p.fill(avocadoGreen);
    p.noStroke();
    
    for (let x = -45; x <= 45; x += 20) {
      for (let y = -5; y <= 35; y += 20) {
        // Draw flower
        for (let i = 0; i < 6; i++) {
          let angle = i * p.PI / 3;
          let px = x + p.cos(angle) * 5;
          let py = y + p.sin(angle) * 5;
          p.ellipse(px, py, 4, 4);
        }
        p.ellipse(x, y, 4, 4); // Center of flower
      }
    }
  }
));

// 6. Wavy Lines Pattern Bowl
bowlDesigns.push(new BowlDesign(
  'Wavy Lines Pattern Bowl',
  'A mixing bowl with horizontal wavy lines in avocado green.',
  function(p) {
    drawBowlBase(p);
    
    // Add wavy lines
    p.stroke(avocadoGreen);
    p.strokeWeight(2);
    p.noFill();
    
    for (let y = -10; y < 50; y += 10) {
      p.beginShape();
      for (let x = -55; x <= 55; x += 5) {
        p.vertex(x, y + p.sin(x * 0.1) * 3);
      }
      p.endShape();
    }
  }
));

// 7. Crosshatch Pattern Bowl
bowlDesigns.push(new BowlDesign(
  'Crosshatch Pattern Bowl',
  'A mixing bowl with a crosshatch pattern in avocado green.',
  function(p) {
    drawBowlBase(p);
    
    // Add crosshatch pattern
    p.stroke(avocadoGreen);
    p.strokeWeight(1);
    
    // Diagonal lines in one direction
    for (let i = -70; i <= 70; i += 10) {
      p.line(i, -20, i + 70, 50);
    }
    
    // Diagonal lines in the other direction
    for (let i = -70; i <= 70; i += 10) {
      p.line(i, -20, i - 70, 50);
    }
  }
));

// 8. Herringbone Pattern Bowl
bowlDesigns.push(new BowlDesign(
  'Herringbone Pattern Bowl',
  'A mixing bowl with a herringbone pattern in avocado green.',
  function(p) {
    drawBowlBase(p);
    
    // Add herringbone pattern
    p.stroke(avocadoGreen);
    p.strokeWeight(2);
    
    for (let y = -15; y < 50; y += 10) {
      for (let x = -55; x < 55; x += 10) {
        p.line(x, y, x + 5, y + 10);
        p.line(x + 10, y, x + 5, y + 10);
      }
    }
  }
));

// 9. Spiral Pattern Bowl
bowlDesigns.push(new BowlDesign(
  'Spiral Pattern Bowl',
  'A mixing bowl with spiral patterns in avocado green.',
  function(p) {
    drawBowlBase(p);
    
    // Add spiral patterns
    p.stroke(avocadoGreen);
    p.strokeWeight(1.5);
    p.noFill();
    
    // Draw several small spirals
    let centers = [
      {x: -30, y: 0}, 
      {x: 0, y: 20}, 
      {x: 30, y: 0},
      {x: -20, y: 30},
      {x: 20, y: 30}
    ];
    
    centers.forEach(center => {
      for (let r = 1; r <= 5; r++) {
        p.beginShape();
        for (let theta = 0; theta < p.TWO_PI * 2; theta += 0.1) {
          let x = center.x + r * theta * p.cos(theta) / p.TWO_PI;
          let y = center.y + r * theta * p.sin(theta) / p.TWO_PI;
          
          // Keep within bowl bounds
          if (x > -55 && x < 55 && y > -15 && y < 45) {
            p.vertex(x, y);
          }
        }
        p.endShape();
      }
    });
  }
));

// 10. Geometric Pattern Bowl
bowlDesigns.push(new BowlDesign(
  'Geometric Pattern Bowl',
  'A mixing bowl with geometric shapes in avocado green.',
  function(p) {
    drawBowlBase(p);
    
    // Add geometric pattern
    p.stroke(avocadoGreen);
    p.strokeWeight(1.5);
    p.noFill();
    
    // Draw triangles
    for (let x = -50; x <= 30; x += 20) {
      for (let y = -10; y <= 30; y += 20) {
        p.triangle(x, y, x + 10, y - 10, x + 20, y);
      }
    }
    
    // Draw squares
    for (let x = -40; x <= 40; x += 20) {
      for (let y = 0; y <= 40; y += 20) {
        p.rect(x - 5, y - 5, 10, 10);
      }
    }
    
    // Draw circles
    for (let x = -45; x <= 45; x += 30) {
      for (let y = -5; y <= 35; y += 20) {
        p.ellipse(x, y, 8, 8);
      }
    }
  }
));

// Initialize the bowl designs when the page loads
window.onload = function() {
  setupBowlDesigns();
}; 
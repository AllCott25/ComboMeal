// Vessel Design Mockups for Culinary Logic Puzzle Game
// This file contains 20 different vessel designs drawn in profile view using p5.js

// Array to store all vessel design functions
const vesselDesigns = [];

// Vessel design class
class VesselDesign {
  constructor(name, category, description, drawFunction) {
    this.name = name;
    this.category = category;
    this.description = description;
    this.drawFunction = drawFunction;
  }
}

// Create individual p5.js instances for each vessel design
function setupVesselDesigns() {
  // Create container elements for each vessel design
  vesselDesigns.forEach((design, index) => {
    const containerDiv = document.createElement('div');
    containerDiv.className = 'design-card';
    containerDiv.id = `vessel-${index}`;
    
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
    
    // Add to the appropriate row based on category
    let rowId;
    switch(design.category) {
      case 'mixing-bowl':
        rowId = 'mixing-bowls-row';
        break;
      case 'saute-pan':
        rowId = 'saute-pans-row';
        break;
      case 'casserole-dish':
        rowId = 'casserole-dishes-row';
        break;
      case 'chefs-pot':
        rowId = 'chefs-pots-row';
        break;
      case 'baking-dish':
        rowId = 'baking-dishes-row';
        break;
      default:
        rowId = 'mixing-bowls-row';
    }
    
    document.getElementById(rowId).appendChild(containerDiv);
    
    // Create a new p5 instance for this vessel
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

// ===== MIXING BOWL DESIGNS =====

// 1. Classic Mixing Bowl
vesselDesigns.push(new VesselDesign(
  'Classic Mixing Bowl',
  'mixing-bowl',
  'A traditional round mixing bowl with slightly curved sides and a wide opening.',
  function(p) {
    p.fill(200);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the bowl
    p.beginShape();
    p.vertex(-60, -20);  // Left top edge
    p.bezierVertex(-70, 0, -70, 40, -50, 50);  // Left side curve
    p.vertex(50, 50);  // Bottom
    p.bezierVertex(70, 40, 70, 0, 60, -20);  // Right side curve
    p.endShape();
    
    // Draw the opening (top)
    p.line(-60, -20, 60, -20);
    
    // Add some detail
    p.strokeWeight(1);
    p.line(-50, 0, 50, 0);
    p.line(-40, 25, 40, 25);
  }
));

// 2. Modern Mixing Bowl
vesselDesigns.push(new VesselDesign(
  'Modern Mixing Bowl',
  'mixing-bowl',
  'A sleek, minimalist bowl with straight sides and a wide, flat bottom.',
  function(p) {
    p.fill(200);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the bowl
    p.beginShape();
    p.vertex(-70, -20);  // Left top edge
    p.vertex(-60, 50);   // Left bottom corner
    p.vertex(60, 50);    // Right bottom corner
    p.vertex(70, -20);   // Right top edge
    p.endShape();
    
    // Draw the opening (top)
    p.line(-70, -20, 70, -20);
    
    // Add some detail - subtle line
    p.strokeWeight(1);
    p.line(-65, 15, 65, 15);
  }
));

// 3. Vintage Mixing Bowl
vesselDesigns.push(new VesselDesign(
  'Vintage Mixing Bowl',
  'mixing-bowl',
  'A decorative bowl with a pattern of small dots around the rim and sides.',
  function(p) {
    p.fill(200);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the bowl
    p.beginShape();
    p.vertex(-60, -25);  // Left top edge
    p.bezierVertex(-75, 0, -75, 40, -50, 50);  // Left side curve
    p.vertex(50, 50);  // Bottom
    p.bezierVertex(75, 40, 75, 0, 60, -25);  // Right side curve
    p.endShape();
    
    // Draw the opening (top)
    p.line(-60, -25, 60, -25);
    
    // Add decorative dots
    p.strokeWeight(1);
    p.fill(100);
    
    // Top rim dots
    for (let i = -50; i <= 50; i += 20) {
      p.ellipse(i, -20, 5, 5);
    }
    
    // Side dots
    for (let i = -10; i <= 30; i += 20) {
      p.ellipse(-55, i, 5, 5);
      p.ellipse(55, i, 5, 5);
    }
  }
));

// 4. Stackable Mixing Bowl
vesselDesigns.push(new VesselDesign(
  'Stackable Mixing Bowl',
  'mixing-bowl',
  'A practical bowl with small handles on the sides for easy stacking and handling.',
  function(p) {
    p.fill(200);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the bowl
    p.beginShape();
    p.vertex(-60, -20);  // Left top edge
    p.bezierVertex(-70, 0, -70, 40, -50, 50);  // Left side curve
    p.vertex(50, 50);  // Bottom
    p.bezierVertex(70, 40, 70, 0, 60, -20);  // Right side curve
    p.endShape();
    
    // Draw the opening (top)
    p.line(-60, -20, 60, -20);
    
    // Draw handles
    p.beginShape();
    p.vertex(-70, 10);
    p.vertex(-80, 10);
    p.vertex(-80, 30);
    p.vertex(-70, 30);
    p.endShape();
    
    p.beginShape();
    p.vertex(70, 10);
    p.vertex(80, 10);
    p.vertex(80, 30);
    p.vertex(70, 30);
    p.endShape();
  }
));

// 5. Textured Mixing Bowl
vesselDesigns.push(new VesselDesign(
  'Textured Mixing Bowl',
  'mixing-bowl',
  'A bowl with a textured exterior that adds visual interest and a tactile quality.',
  function(p) {
    p.fill(200);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the bowl
    p.beginShape();
    p.vertex(-60, -20);  // Left top edge
    p.bezierVertex(-70, 0, -70, 40, -50, 50);  // Left side curve
    p.vertex(50, 50);  // Bottom
    p.bezierVertex(70, 40, 70, 0, 60, -20);  // Right side curve
    p.endShape();
    
    // Draw the opening (top)
    p.line(-60, -20, 60, -20);
    
    // Add texture with wavy lines
    p.strokeWeight(1);
    for (let y = -10; y < 50; y += 10) {
      p.beginShape();
      for (let x = -60; x <= 60; x += 5) {
        let xPos = x;
        let yPos = y + p.sin(x * 0.1) * 3;
        
        // Adjust points to follow the bowl's curve
        if (y > 30) {
          if (x < -40) xPos = x + (y - 30) * 0.5;
          if (x > 40) xPos = x - (y - 30) * 0.5;
        }
        
        p.vertex(xPos, yPos);
      }
      p.endShape();
    }
  }
));

// ===== SAUTÉ PAN DESIGNS =====

// 6. Classic Sauté Pan
vesselDesigns.push(new VesselDesign(
  'Classic Sauté Pan',
  'saute-pan',
  'A traditional sauté pan with straight sides and a long handle.',
  function(p) {
    p.fill(180);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the pan body
    p.beginShape();
    p.vertex(-60, 0);    // Left top edge
    p.vertex(-60, 30);   // Left side
    p.vertex(60, 30);    // Right side
    p.vertex(60, 0);     // Right top edge
    p.endShape(p.CLOSE);
    
    // Draw the handle
    p.beginShape();
    p.vertex(60, 15);    // Handle start
    p.vertex(100, 15);   // Handle end
    p.vertex(100, 25);   // Handle bottom
    p.vertex(60, 25);    // Handle bottom at pan
    p.endShape(p.CLOSE);
    
    // Add some detail
    p.strokeWeight(1);
    p.line(-50, 10, 50, 10);
    p.line(-50, 20, 50, 20);
  }
));

// 7. Chef's Sauté Pan
vesselDesigns.push(new VesselDesign(
  'Chef\'s Sauté Pan',
  'saute-pan',
  'A professional-style pan with an angled handle for better balance.',
  function(p) {
    p.fill(180);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the pan body
    p.beginShape();
    p.vertex(-60, 0);    // Left top edge
    p.vertex(-60, 40);   // Left side
    p.vertex(60, 40);    // Right side
    p.vertex(60, 0);     // Right top edge
    p.endShape(p.CLOSE);
    
    // Draw the angled handle
    p.beginShape();
    p.vertex(60, 20);    // Handle start
    p.vertex(100, 0);    // Handle end (angled up)
    p.vertex(100, 10);   // Handle bottom
    p.vertex(60, 30);    // Handle bottom at pan
    p.endShape(p.CLOSE);
    
    // Add some detail - rim
    p.strokeWeight(1);
    p.line(-55, 5, 55, 5);
  }
));

// 8. Double-Handled Sauté Pan
vesselDesigns.push(new VesselDesign(
  'Double-Handled Sauté Pan',
  'saute-pan',
  'A versatile pan with two short handles instead of one long handle.',
  function(p) {
    p.fill(180);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the pan body
    p.beginShape();
    p.vertex(-60, 0);    // Left top edge
    p.vertex(-60, 30);   // Left side
    p.vertex(60, 30);    // Right side
    p.vertex(60, 0);     // Right top edge
    p.endShape(p.CLOSE);
    
    // Draw left handle
    p.beginShape();
    p.vertex(-60, 10);
    p.vertex(-80, 10);
    p.vertex(-80, 20);
    p.vertex(-60, 20);
    p.endShape(p.CLOSE);
    
    // Draw right handle
    p.beginShape();
    p.vertex(60, 10);
    p.vertex(80, 10);
    p.vertex(80, 20);
    p.vertex(60, 20);
    p.endShape(p.CLOSE);
    
    // Add some detail
    p.strokeWeight(1);
    p.ellipse(0, 15, 40, 10);
  }
));

// 9. Deep Sauté Pan
vesselDesigns.push(new VesselDesign(
  'Deep Sauté Pan',
  'saute-pan',
  'A deeper version of the sauté pan for recipes that need more volume.',
  function(p) {
    p.fill(180);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the pan body
    p.beginShape();
    p.vertex(-60, -10);   // Left top edge
    p.vertex(-60, 40);    // Left side
    p.vertex(60, 40);     // Right side
    p.vertex(60, -10);    // Right top edge
    p.endShape(p.CLOSE);
    
    // Draw the handle
    p.beginShape();
    p.vertex(60, 15);    // Handle start
    p.vertex(100, 15);   // Handle end
    p.vertex(100, 25);   // Handle bottom
    p.vertex(60, 25);    // Handle bottom at pan
    p.endShape(p.CLOSE);
    
    // Add some detail - depth lines
    p.strokeWeight(1);
    p.line(-50, 0, 50, 0);
    p.line(-50, 15, 50, 15);
    p.line(-50, 30, 50, 30);
  }
));

// 10. Sloped Sauté Pan
vesselDesigns.push(new VesselDesign(
  'Sloped Sauté Pan',
  'saute-pan',
  'A pan with one sloped side for easy pouring and tossing of ingredients.',
  function(p) {
    p.fill(180);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the pan body with sloped side
    p.beginShape();
    p.vertex(-60, 0);    // Left top edge
    p.vertex(-60, 30);   // Left side
    p.vertex(60, 30);    // Right side
    p.vertex(60, 0);     // Right top edge
    p.vertex(30, -10);   // Sloped edge
    p.endShape(p.CLOSE);
    
    // Draw the handle
    p.beginShape();
    p.vertex(-60, 15);   // Handle start
    p.vertex(-100, 15);  // Handle end
    p.vertex(-100, 25);  // Handle bottom
    p.vertex(-60, 25);   // Handle bottom at pan
    p.endShape(p.CLOSE);
    
    // Add some detail
    p.strokeWeight(1);
    p.line(-50, 10, 50, 10);
    p.line(-50, 20, 50, 20);
  }
));

// ===== CASSEROLE DISH DESIGNS =====

// 11. Classic Rectangular Casserole
vesselDesigns.push(new VesselDesign(
  'Classic Rectangular Casserole',
  'casserole-dish',
  'A traditional rectangular casserole dish with handles on both short sides.',
  function(p) {
    p.fill(220);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the dish body
    p.rect(-60, 0, 120, 40);
    
    // Draw handles
    p.beginShape();
    p.vertex(-60, 15);
    p.vertex(-75, 15);
    p.vertex(-75, 25);
    p.vertex(-60, 25);
    p.endShape();
    
    p.beginShape();
    p.vertex(60, 15);
    p.vertex(75, 15);
    p.vertex(75, 25);
    p.vertex(60, 25);
    p.endShape();
    
    // Add some detail - inner edge
    p.strokeWeight(1);
    p.rect(-55, 5, 110, 30);
  }
));

// 12. Oval Casserole
vesselDesigns.push(new VesselDesign(
  'Oval Casserole',
  'casserole-dish',
  'An oval-shaped dish with integrated handles that curve outward.',
  function(p) {
    p.fill(220);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the oval dish body
    p.ellipse(0, 20, 120, 40);
    
    // Draw handles
    p.beginShape();
    p.vertex(-60, 15);
    p.vertex(-75, 10);
    p.vertex(-75, 30);
    p.vertex(-60, 25);
    p.endShape();
    
    p.beginShape();
    p.vertex(60, 15);
    p.vertex(75, 10);
    p.vertex(75, 30);
    p.vertex(60, 25);
    p.endShape();
    
    // Add some detail - inner edge
    p.strokeWeight(1);
    p.ellipse(0, 20, 110, 30);
  }
));

// 13. Scalloped Casserole
vesselDesigns.push(new VesselDesign(
  'Scalloped Casserole',
  'casserole-dish',
  'A rectangular dish with a decorative scalloped edge for a vintage look.',
  function(p) {
    p.fill(220);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the dish body
    p.rect(-60, 0, 120, 40);
    
    // Draw handles
    p.beginShape();
    p.vertex(-60, 15);
    p.vertex(-75, 15);
    p.vertex(-75, 25);
    p.vertex(-60, 25);
    p.endShape();
    
    p.beginShape();
    p.vertex(60, 15);
    p.vertex(75, 15);
    p.vertex(75, 25);
    p.vertex(60, 25);
    p.endShape();
    
    // Add scalloped edge
    p.strokeWeight(1);
    p.beginShape();
    for (let x = -55; x <= 55; x += 10) {
      p.vertex(x, 0);
      p.vertex(x + 5, -5);
    }
    p.endShape();
  }
));

// 14. Deep Casserole
vesselDesigns.push(new VesselDesign(
  'Deep Casserole',
  'casserole-dish',
  'A deeper version of the casserole dish for layered recipes.',
  function(p) {
    p.fill(220);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the dish body
    p.rect(-60, -20, 120, 60);
    
    // Draw handles
    p.beginShape();
    p.vertex(-60, 15);
    p.vertex(-75, 15);
    p.vertex(-75, 25);
    p.vertex(-60, 25);
    p.endShape();
    
    p.beginShape();
    p.vertex(60, 15);
    p.vertex(75, 15);
    p.vertex(75, 25);
    p.vertex(60, 25);
    p.endShape();
    
    // Add some detail - depth lines
    p.strokeWeight(1);
    p.line(-55, -10, 55, -10);
    p.line(-55, 0, 55, 0);
    p.line(-55, 10, 55, 10);
    p.line(-55, 20, 55, 20);
    p.line(-55, 30, 55, 30);
  }
));

// 15. Divided Casserole
vesselDesigns.push(new VesselDesign(
  'Divided Casserole',
  'casserole-dish',
  'A casserole dish with a divider in the middle for multiple components.',
  function(p) {
    p.fill(220);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the dish body
    p.rect(-60, 0, 120, 40);
    
    // Draw handles
    p.beginShape();
    p.vertex(-60, 15);
    p.vertex(-75, 15);
    p.vertex(-75, 25);
    p.vertex(-60, 25);
    p.endShape();
    
    p.beginShape();
    p.vertex(60, 15);
    p.vertex(75, 15);
    p.vertex(75, 25);
    p.vertex(60, 25);
    p.endShape();
    
    // Add divider
    p.strokeWeight(2);
    p.line(0, 5, 0, 35);
    
    // Add some detail - inner edges
    p.strokeWeight(1);
    p.rect(-55, 5, 50, 30);
    p.rect(5, 5, 50, 30);
  }
));

// ===== CHEF'S POT DESIGNS =====

// 16. Classic Stock Pot
vesselDesigns.push(new VesselDesign(
  'Classic Stock Pot',
  'chefs-pot',
  'A tall, cylindrical pot with straight sides and two small handles.',
  function(p) {
    p.fill(160);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the pot body
    p.rect(-50, -30, 100, 70);
    
    // Draw handles
    p.beginShape();
    p.vertex(-50, 0);
    p.vertex(-65, 0);
    p.vertex(-65, 10);
    p.vertex(-50, 10);
    p.endShape();
    
    p.beginShape();
    p.vertex(50, 0);
    p.vertex(65, 0);
    p.vertex(65, 10);
    p.vertex(50, 10);
    p.endShape();
    
    // Add some detail - rim
    p.strokeWeight(1);
    p.line(-45, -25, 45, -25);
    p.line(-45, -15, 45, -15);
  }
));

// 17. Dutch Oven
vesselDesigns.push(new VesselDesign(
  'Dutch Oven',
  'chefs-pot',
  'A heavy pot with sloped sides and large integrated handles.',
  function(p) {
    p.fill(160);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the pot body with sloped sides
    p.beginShape();
    p.vertex(-50, -20);  // Left top
    p.vertex(-60, 0);    // Left middle
    p.vertex(-50, 40);   // Left bottom
    p.vertex(50, 40);    // Right bottom
    p.vertex(60, 0);     // Right middle
    p.vertex(50, -20);   // Right top
    p.endShape(p.CLOSE);
    
    // Draw handles
    p.beginShape();
    p.vertex(-50, 10);
    p.vertex(-70, 0);
    p.vertex(-70, 20);
    p.vertex(-50, 30);
    p.endShape();
    
    p.beginShape();
    p.vertex(50, 10);
    p.vertex(70, 0);
    p.vertex(70, 20);
    p.vertex(50, 30);
    p.endShape();
    
    // Add some detail - rim
    p.strokeWeight(1);
    p.line(-45, -15, 45, -15);
  }
));

// 18. Soup Pot
vesselDesigns.push(new VesselDesign(
  'Soup Pot',
  'chefs-pot',
  'A wide pot with curved sides, perfect for soups and stews.',
  function(p) {
    p.fill(160);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the pot body with curved sides
    p.beginShape();
    p.vertex(-60, -20);  // Left top
    p.bezierVertex(-70, 0, -70, 20, -60, 40);  // Left curve
    p.vertex(60, 40);    // Bottom
    p.bezierVertex(70, 20, 70, 0, 60, -20);    // Right curve
    p.endShape(p.CLOSE);
    
    // Draw handles
    p.beginShape();
    p.vertex(-60, 0);
    p.vertex(-75, 0);
    p.vertex(-75, 10);
    p.vertex(-60, 10);
    p.endShape();
    
    p.beginShape();
    p.vertex(60, 0);
    p.vertex(75, 0);
    p.vertex(75, 10);
    p.vertex(60, 10);
    p.endShape();
    
    // Add some detail - rim
    p.strokeWeight(1);
    p.line(-50, -15, 50, -15);
  }
));

// 19. Lidded Chef's Pot
vesselDesigns.push(new VesselDesign(
  'Lidded Chef\'s Pot',
  'chefs-pot',
  'A pot with a domed lid that sits on top.',
  function(p) {
    p.fill(160);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the pot body
    p.rect(-50, -10, 100, 50);
    
    // Draw handles
    p.beginShape();
    p.vertex(-50, 10);
    p.vertex(-65, 10);
    p.vertex(-65, 20);
    p.vertex(-50, 20);
    p.endShape();
    
    p.beginShape();
    p.vertex(50, 10);
    p.vertex(65, 10);
    p.vertex(65, 20);
    p.vertex(50, 20);
    p.endShape();
    
    // Draw the lid
    p.beginShape();
    p.vertex(-50, -10);
    p.bezierVertex(-25, -30, 25, -30, 50, -10);
    p.endShape();
    
    // Add lid handle
    p.rect(-5, -30, 10, 10);
  }
));

// 20. Decorative Chef's Pot
vesselDesigns.push(new VesselDesign(
  'Decorative Chef\'s Pot',
  'chefs-pot',
  'A pot with decorative patterns or textures around the middle.',
  function(p) {
    p.fill(160);
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw the pot body
    p.rect(-50, -30, 100, 70);
    
    // Draw handles
    p.beginShape();
    p.vertex(-50, 0);
    p.vertex(-65, 0);
    p.vertex(-65, 10);
    p.vertex(-50, 10);
    p.endShape();
    
    p.beginShape();
    p.vertex(50, 0);
    p.vertex(65, 0);
    p.vertex(65, 10);
    p.vertex(50, 10);
    p.endShape();
    
    // Add decorative pattern
    p.strokeWeight(1);
    p.rect(-40, -10, 80, 30);
    
    // Add pattern inside the decorative area
    for (let x = -35; x < 35; x += 10) {
      for (let y = -5; y < 15; y += 10) {
        p.line(x, y, x + 5, y + 5);
        p.line(x + 5, y, x, y + 5);
      }
    }
  }
));

// Initialize the vessel designs when the page loads
window.onload = function() {
  setupVesselDesigns();
}; 
/**
 * Recipe Graph Traversal System - Proof of Concept
 * Developed by: APlasker
 * Date: May 18, 2025
 * 
 * This proof-of-concept demonstrates a graph-based approach to recipe combinations
 * which will solve issues like the Boiled Potatoes + ingredients → Mashed Potatoes problem.
 */

class RecipeNode {
  constructor(id, name, type, displayProps = {}) {
    this.id = id;
    this.name = name;
    this.type = type; // 'base_ingredient', 'intermediate_combo', 'final_combo'
    this.displayProps = displayProps;
    this.verb = displayProps.verb || null;
  }
}

class RecipeEdge {
  constructor(id, sourceId, targetId, requiredIngredients = [], combinationType = 'direct', priority = 1) {
    this.id = id;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.requiredIngredients = requiredIngredients;
    this.combinationType = combinationType; // 'direct', 'parent_child', 'multi_component'
    this.priority = priority;
  }
}

class RecipeGraph {
  constructor() {
    this.nodes = new Map(); // id -> RecipeNode
    this.edges = new Map(); // id -> RecipeEdge
    this.outgoingEdges = new Map(); // sourceId -> [RecipeEdge]
    this.incomingEdges = new Map(); // targetId -> [RecipeEdge]
  }

  /**
   * Add a node to the graph
   */
  addNode(node) {
    this.nodes.set(node.id, node);
    return this;
  }

  /**
   * Add an edge to the graph
   */
  addEdge(edge) {
    this.edges.set(edge.id, edge);
    
    // Add to outgoing edges from source
    if (!this.outgoingEdges.has(edge.sourceId)) {
      this.outgoingEdges.set(edge.sourceId, []);
    }
    this.outgoingEdges.get(edge.sourceId).push(edge);
    
    // Add to incoming edges to target
    if (!this.incomingEdges.has(edge.targetId)) {
      this.incomingEdges.set(edge.targetId, []);
    }
    this.incomingEdges.get(edge.targetId).push(edge);
    
    return this;
  }

  /**
   * Find possible combinations between vessels
   */
  findPossibleCombinations(vessel1, vessel2) {
    console.log(`Finding possible combinations between: ${this.getVesselName(vessel1)} and ${this.getVesselName(vessel2)}`);
    
    // Get node IDs for each vessel
    const nodeId1 = this.getNodeIdForVessel(vessel1);
    const nodeId2 = this.getNodeIdForVessel(vessel2);
    
    if (!nodeId1 || !nodeId2) {
      console.log("Could not identify nodes for vessels");
      return [];
    }
    
    // Get all ingredients from both vessels
    const allIngredients = this.getAllIngredients(vessel1, vessel2);
    console.log("Combined ingredients:", allIngredients);
    
    // Results will store possible combinations
    let possibleCombinations = [];
    
    // Case 1: Direct combination (both are base ingredients or intermediate combos)
    this.findDirectCombinations(nodeId1, nodeId2, allIngredients, possibleCombinations);
    
    // Case 2: Parent-child combination (one is parent of target recipe)
    this.findParentChildCombinations(nodeId1, nodeId2, allIngredients, possibleCombinations);
    
    // Sort by priority
    possibleCombinations.sort((a, b) => b.priority - a.priority);
    return possibleCombinations;
  }
  
  /**
   * Find direct combinations where both vessels combine directly
   */
  findDirectCombinations(nodeId1, nodeId2, allIngredients, results) {
    // Look for edges where both nodes are directly required
    for (const edge of this.edges.values()) {
      // Skip edges that don't involve both nodes
      if (![edge.sourceId, ...edge.requiredIngredients].includes(nodeId1) || 
          ![edge.sourceId, ...edge.requiredIngredients].includes(nodeId2)) {
        continue;
      }
      
      // Check if all ingredients are provided
      const allRequired = [edge.sourceId, ...edge.requiredIngredients];
      if (this.hasAllIngredients(allIngredients, allRequired)) {
        // Found a match
        results.push({
          targetId: edge.targetId,
          edge: edge,
          priority: edge.priority,
          type: 'direct'
        });
        console.log(`Found direct combination: ${this.nodes.get(edge.targetId).name}`);
      }
    }
  }
  
  /**
   * Find parent-child combinations (like Boiled Potatoes → Mashed Potatoes)
   */
  findParentChildCombinations(nodeId1, nodeId2, allIngredients, results) {
    // Try nodeId1 as parent
    this.checkParentChildCombination(nodeId1, nodeId2, allIngredients, results);
    
    // Try nodeId2 as parent
    this.checkParentChildCombination(nodeId2, nodeId1, allIngredients, results);
  }
  
  /**
   * Check if parentId is a parent for a recipe that uses childId as an ingredient
   */
  checkParentChildCombination(parentId, childId, allIngredients, results) {
    // Skip if this node isn't a proper parent
    if (!this.outgoingEdges.has(parentId)) {
      return;
    }
    
    // Check all outgoing edges from parent
    for (const edge of this.outgoingEdges.get(parentId)) {
      if (edge.combinationType === 'parent_child') {
        // For parent-child edges, check if required ingredients match
        const requiredIds = edge.requiredIngredients;
        
        // Check if the child node ID is in required ingredients
        if (requiredIds.includes(childId)) {
          // Check if we have all other required ingredients
          if (this.hasAllIngredients(allIngredients, [parentId, ...requiredIds])) {
            // Found a match
            results.push({
              targetId: edge.targetId,
              edge: edge,
              priority: edge.priority + 1, // Parent-child gets higher priority
              type: 'parent_child'
            });
            console.log(`Found parent-child combination: ${this.nodes.get(edge.targetId).name}`);
          }
        }
      }
    }
  }
  
  /**
   * Check if all required ingredients are present
   */
  hasAllIngredients(available, required) {
    // Ensure all required ingredients are in available
    return required.every(id => available.includes(id));
  }
  
  /**
   * Get a list of all ingredient node IDs from both vessels
   */
  getAllIngredients(vessel1, vessel2) {
    const ingredients1 = this.getVesselIngredients(vessel1);
    const ingredients2 = this.getVesselIngredients(vessel2);
    return [...new Set([...ingredients1, ...ingredients2])];
  }
  
  /**
   * Get ingredient node IDs from a vessel
   */
  getVesselIngredients(vessel) {
    // If vessel has a name, it's a completed combination
    if (vessel.name) {
      const nodeId = this.getNodeIdByName(vessel.name);
      return nodeId ? [nodeId] : [];
    }
    
    // If vessel has ingredients, get IDs for each
    if (vessel.ingredients && vessel.ingredients.length > 0) {
      return vessel.ingredients.map(ing => this.getNodeIdByName(ing)).filter(id => id != null);
    }
    
    return [];
  }
  
  /**
   * Get node ID from vessel
   */
  getNodeIdForVessel(vessel) {
    if (vessel.name) {
      return this.getNodeIdByName(vessel.name);
    }
    
    // For vessels with just ingredients, return the first one
    // This is simplified and would need to be enhanced
    if (vessel.ingredients && vessel.ingredients.length > 0) {
      return this.getNodeIdByName(vessel.ingredients[0]);
    }
    
    return null;
  }
  
  /**
   * Get node ID by name
   */
  getNodeIdByName(name) {
    for (const [id, node] of this.nodes.entries()) {
      if (node.name === name) {
        return id;
      }
    }
    return null;
  }
  
  /**
   * Get vessel name for logging
   */
  getVesselName(vessel) {
    if (vessel.name) {
      return vessel.name;
    }
    return vessel.ingredients ? vessel.ingredients.join('+') : 'unknown';
  }
  
  /**
   * Create a new vessel from a combination result
   */
  createNewVessel(combinationResult, vessel1, vessel2) {
    const targetNode = this.nodes.get(combinationResult.targetId);
    if (!targetNode) {
      console.error("Target node not found");
      return null;
    }
    
    // Calculate new vessel position
    const x = (vessel1.x + vessel2.x) / 2;
    const y = (vessel1.y + vessel2.y) / 2;
    
    // Create vessel dimensions based on display properties
    const width = targetNode.displayProps.width || Math.max(vessel1.w, vessel2.w);
    const height = targetNode.displayProps.height || Math.max(vessel1.h, vessel2.h);
    
    // Get color from display properties
    const color = targetNode.displayProps.color || 'green';
    
    // Create the new vessel
    const newVessel = {
      name: targetNode.name,
      ingredients: [],
      complete_combinations: [],
      x: x,
      y: y,
      w: width,
      h: height,
      color: color,
      verb: targetNode.verb || "Mix",
      verbDisplayTime: 120,
      isAdvanced: true
    };
    
    console.log(`Created new vessel: ${newVessel.name}`);
    return newVessel;
  }
  
  /**
   * Main combine function to replace the current combineVessels
   */
  combineVessels(vessel1, vessel2) {
    console.log(`Attempting to combine vessels using graph traversal`);
    
    // Find possible combinations
    const possibleCombinations = this.findPossibleCombinations(vessel1, vessel2);
    
    // If we found combinations, create a new vessel
    if (possibleCombinations.length > 0) {
      const bestMatch = possibleCombinations[0]; // Already sorted by priority
      console.log(`Selected combination: ${this.nodes.get(bestMatch.targetId).name}`);
      return this.createNewVessel(bestMatch, vessel1, vessel2);
    }
    
    console.log("No valid combinations found");
    return null;
  }
}

/**
 * Demonstration: Shepherd's Pie Recipe
 */
function demonstrateShepherdsPie() {
  // Create recipe graph
  const graph = new RecipeGraph();
  
  // Create nodes for ingredients and combinations
  // Base ingredients
  graph.addNode(new RecipeNode('ing1', 'Potatoes', 'base_ingredient'));
  graph.addNode(new RecipeNode('ing2', 'Water', 'base_ingredient'));
  graph.addNode(new RecipeNode('ing3', 'Butter', 'base_ingredient'));
  graph.addNode(new RecipeNode('ing4', 'Milk', 'base_ingredient'));
  graph.addNode(new RecipeNode('ing5', 'Salt', 'base_ingredient'));
  graph.addNode(new RecipeNode('ing6', 'Ground Beef', 'base_ingredient'));
  graph.addNode(new RecipeNode('ing7', 'Carrots', 'base_ingredient'));
  graph.addNode(new RecipeNode('ing8', 'Peas', 'base_ingredient'));
  
  // Intermediate combinations
  graph.addNode(new RecipeNode('combo1', 'Boiled Potatoes', 'intermediate_combo', {
    verb: 'Boil',
    color: 'green',
    width: 150,
    height: 75
  }));
  
  graph.addNode(new RecipeNode('combo2', 'Mashed Potatoes', 'intermediate_combo', {
    verb: 'Mash',
    color: 'green',
    width: 150,
    height: 75
  }));
  
  graph.addNode(new RecipeNode('combo3', 'Meat Filling', 'intermediate_combo', {
    verb: 'Cook',
    color: 'green',
    width: 150,
    height: 75
  }));
  
  // Final combination
  graph.addNode(new RecipeNode('final', 'Shepherd\'s Pie', 'final_combo', {
    verb: 'Bake',
    color: 'green',
    width: 180,
    height: 90
  }));
  
  // Create edges for recipe steps
  // Boiled Potatoes = Potatoes + Water
  graph.addEdge(new RecipeEdge('edge1', 'ing1', 'combo1', ['ing2'], 'direct', 1));
  
  // Mashed Potatoes = Boiled Potatoes + Butter + Milk + Salt
  graph.addEdge(new RecipeEdge('edge2', 'combo1', 'combo2', ['ing3', 'ing4', 'ing5'], 'parent_child', 1));
  
  // Meat Filling = Ground Beef + Carrots + Peas
  graph.addEdge(new RecipeEdge('edge3', 'ing6', 'combo3', ['ing7', 'ing8'], 'direct', 1));
  
  // Shepherd's Pie = Mashed Potatoes + Meat Filling
  graph.addEdge(new RecipeEdge('edge4', 'combo2', 'final', ['combo3'], 'direct', 1));
  
  // Demonstrate some combinations
  console.log("\n=== DEMONSTRATION: SHEPHERD'S PIE RECIPE ===\n");
  
  // Test Case 1: Potatoes + Water
  console.log("Test Case 1: Potatoes + Water");
  const vessel1 = { ingredients: ['Potatoes'] };
  const vessel2 = { ingredients: ['Water'] };
  const result1 = graph.combineVessels(vessel1, vessel2);
  console.log("Result:", result1 ? result1.name : "No combination found");
  
  // Test Case 2: Boiled Potatoes + other ingredients
  console.log("\nTest Case 2: Boiled Potatoes + Butter + Milk + Salt");
  const vessel3 = { name: 'Boiled Potatoes' };
  const vessel4 = { ingredients: ['Butter', 'Milk', 'Salt'] };
  const result2 = graph.combineVessels(vessel3, vessel4);
  console.log("Result:", result2 ? result2.name : "No combination found");
  
  // Test Case 3: Ground Beef + Carrots + Peas
  console.log("\nTest Case 3: Ground Beef + Vegetables");
  const vessel5 = { ingredients: ['Ground Beef'] };
  const vessel6 = { ingredients: ['Carrots', 'Peas'] };
  const result3 = graph.combineVessels(vessel5, vessel6);
  console.log("Result:", result3 ? result3.name : "No combination found");
  
  // Test Case 4: Mashed Potatoes + Meat Filling
  console.log("\nTest Case 4: Mashed Potatoes + Meat Filling");
  const vessel7 = { name: 'Mashed Potatoes' };
  const vessel8 = { name: 'Meat Filling' };
  const result4 = graph.combineVessels(vessel7, vessel8);
  console.log("Result:", result4 ? result4.name : "No combination found");
  
  return graph;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RecipeNode,
    RecipeEdge,
    RecipeGraph,
    demonstrateShepherdsPie
  };
} else {
  // For browser usage
  window.RecipeGraph = {
    RecipeNode,
    RecipeEdge,
    RecipeGraph,
    demonstrateShepherdsPie
  };
}

// Auto-run demonstration if not in module context
if (typeof window !== 'undefined') {
  console.log("Recipe Graph Proof of Concept");
  console.log("Run demonstrateShepherdsPie() to see the demonstration");
} 
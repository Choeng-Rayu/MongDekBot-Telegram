document.addEventListener("DOMContentLoaded", function () {
  // Vanta.js background
  VANTA.GLOBE({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.0,
    minWidth: 200.0,
    scale: 1.0,
    scaleMobile: 1.0,
    color: 0x3f83f8,
    backgroundColor: 0x111827,
    size: 1.0
  });

  // Constants
  const WORLD_SIZE = 30;
  const FOOD_SIZE = 1;
  const FOOD_ENERGY = 50;
  const MAX_FOOD = 30;

  // Physics parameters
  const PHYSICS_STEP = 1 / 60;
  let SUBSTEPS = 3; // Will be set based on physics accuracy setting

  // Simulation variables
  let world; // Cannon.js physics world
  let scene, camera, renderer; // Three.js components
  let creatures = [];
  let foods = [];
  let currentGeneration = 0;
  let simulationRunning = false;
  let simulationInterval;
  let lastTime = 0;
  let selectedCreature = null;
  let followedCreature = null;
  let lineageChart = null;
  let fitnessHistory = [];
  let environmentType = "plains";
  let nextCreatureId = 0;
  let speciesCount = 0;

  // DOM elements
  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const resetBtn = document.getElementById("reset-btn");
  const breedBtn = document.getElementById("breed-btn");
  const mutateBtn = document.getElementById("mutate-btn");
  const followBtn = document.getElementById("follow-btn");
  const populationGrid = document.getElementById("population-grid");
  const loadingOverlay = document.getElementById("loading-overlay");
  const statsOverlay = document.getElementById("stats-overlay");
  const generationCounter = document.getElementById("generation-counter");
  const fitnessScore = document.getElementById("fitness-score");
  const foodCount = document.getElementById("food-count");
  const environmentSelect = document.getElementById("environment-type");
  const physicsAccuracyInput = document.getElementById("physics-accuracy");
  const foodAmountInput = document.getElementById("food-amount");

  // Gene UI elements
  const speedBar = document.getElementById("speed-bar");
  const strengthBar = document.getElementById("strength-bar");
  const sizeBar = document.getElementById("size-bar");
  const healthBar = document.getElementById("health-bar");
  const behaviorBar = document.getElementById("behavior-bar");
  const specializationBar = document.getElementById("specialization-bar");
  const speedValue = document.getElementById("speed-value");
  const strengthValue = document.getElementById("strength-value");
  const sizeValue = document.getElementById("size-value");
  const healthValue = document.getElementById("health-value");
  const behaviorType = document.getElementById("behavior-type");
  const specialization = document.getElementById("specialization");

  // Creature class with physics integration
  class VoxelCreature {
    constructor(genes = null, generation = 0) {
      this.id = nextCreatureId++;
      this.generation = generation;
      this.age = 0;
      this.energy = 100;
      this.alive = true;
      this.eaten = 0;
      this.mated = false;
      this.speciesId = null;
      this.speciesColor = Math.floor(Math.random() * 360);

      // Physics body
      this.body = null;
      this.meshes = [];
      this.limbBodies = [];
      this.constraints = [];

      // Movement control
      this.movementTimer = 0;
      this.targetDirection = new THREE.Vector3();
      this.currentDirection = new THREE.Vector3();
      this.lastDecisionTime = 0;
      this.targetFood = null;

      // Genes
      if (genes) {
        this.genes = { ...genes };
        this.speciesId = genes.speciesId || null;
      } else {
        this.genes = {
          speed: Math.random(),
          strength: Math.random(),
          size: 0.3 + Math.random() * 0.7, // Ensure minimum size
          health: Math.random(),
          color: Math.floor(Math.random() * 360),
          symmetry: Math.random() > 0.7 ? "radial" : "bilateral",
          limbs: Math.floor(2 + Math.random() * 6),
          bodyShape: ["blocky", "slender", "spherical", "elongated"][
            Math.floor(Math.random() * 4)
          ],
          behavior: Math.random() * 2 - 1, // -1 to 1 (passive to aggressive)
          metabolism: 0.5 + Math.random() * 0.5, // Energy consumption rate
          senseRange: 0.5 + Math.random() * 0.5 // How far they can sense food/mates
        };

        // Assign species ID only to first generation creatures
        if (generation === 0) {
          this.speciesId = speciesCount++;
        }
      }

      // Calculate initial fitness
      this.calculateFitness();

      // Create physics and visual representation
      this.createPhysicsBody();
      this.createVisualRepresentation();
    }

    createPhysicsBody() {
      // Main body physics
      const bodySize = 0.5 + this.genes.size * 1.5; // 0.5 to 2 meters

      this.body = new CANNON.Body({
        mass: 5 * this.genes.size * this.genes.strength,
        position: new CANNON.Vec3(
          (Math.random() - 0.5) * WORLD_SIZE * 0.8,
          WORLD_SIZE / 4,
          (Math.random() - 0.5) * WORLD_SIZE * 0.8
        ),
        shape: new CANNON.Sphere(bodySize * 0.5),
        linearDamping: 0.5,
        angularDamping: 0.7,
        material: new CANNON.Material({ friction: 0.3, restitution: 0.3 })
      });

      this.body.creature = this; // Reference back to creature
      world.addBody(this.body);

      // Add limbs based on symmetry
      const limbRadius = bodySize * 0.15;
      const limbLength = bodySize * 0.7;
      const limbMass = 0.5 * this.genes.size * this.genes.strength;

      if (this.genes.symmetry === "radial") {
        // Radial symmetry - limbs arranged in a circle
        const angleIncrement = (2 * Math.PI) / this.genes.limbs;

        for (let i = 0; i < this.genes.limbs; i++) {
          const angle = i * angleIncrement;
          const dx = Math.cos(angle) * (bodySize / 2 + limbLength / 2);
          const dz = Math.sin(angle) * (bodySize / 2 + limbLength / 2);

          const limbBody = new CANNON.Body({
            mass: limbMass,
            position: new CANNON.Vec3(dx, 0, dz),
            shape: new CANNON.Box(
              new CANNON.Vec3(limbRadius, limbLength / 2, limbRadius)
            ),
            material: new CANNON.Material({ friction: 0.4, restitution: 0.2 })
          });

          // Position relative to main body
          limbBody.position.vadd(this.body.position, limbBody.position);

          // Add constraint (joint) to main body
          const constraint = new CANNON.PointToPointConstraint(
            this.body,
            new CANNON.Vec3(dx, 0, dz),
            limbBody,
            new CANNON.Vec3(0, -limbLength / 2, 0)
          );

          world.addBody(limbBody);
          world.addConstraint(constraint);

          this.limbBodies.push(limbBody);
          this.constraints.push(constraint);
        }
      } else {
        // Bilateral symmetry - pairs of limbs on sides
        const limbsPerSide = Math.ceil(this.genes.limbs / 2);
        const yOffset = (bodySize * 0.7) / (limbsPerSide + 1);

        for (let side = 0; side < 2; side++) {
          const xOffset =
            side === 0
              ? -(bodySize / 2 + limbLength / 2)
              : bodySize / 2 + limbLength / 2;

          for (let i = 0; i < limbsPerSide; i++) {
            if (this.limbBodies.length >= this.genes.limbs) break;

            const yPos = -bodySize / 2 + (i + 1) * yOffset;

            const limbBody = new CANNON.Body({
              mass: limbMass,
              position: new CANNON.Vec3(xOffset, yPos, 0),
              shape: new CANNON.Box(
                new CANNON.Vec3(limbLength / 2, limbRadius, limbRadius)
              ),
              material: new CANNON.Material({ friction: 0.4, restitution: 0.2 })
            });

            // Position relative to main body
            limbBody.position.vadd(this.body.position, limbBody.position);

            // Add constraint (joint) to main body
            const constraint = new CANNON.PointToPointConstraint(
              this.body,
              new CANNON.Vec3(
                xOffset > 0 ? bodySize / 2 : -bodySize / 2,
                yPos,
                0
              ),
              limbBody,
              new CANNON.Vec3(0, 0, 0)
            );

            world.addBody(limbBody);
            world.addConstraint(constraint);

            this.limbBodies.push(limbBody);
            this.constraints.push(constraint);
          }
        }
      }
    }

    createVisualRepresentation() {
      const bodyColor = new THREE.Color(`hsl(${this.genes.color}, 60%, 50%)`);
      const limbColor = new THREE.Color(
        `hsl(${(this.genes.color + 30) % 360}, 60%, 50%)`
      );

      // Main body
      const bodySize = 0.5 + this.genes.size * 1.5;
      let bodyGeometry;

      switch (this.genes.bodyShape) {
        case "slender":
          bodyGeometry = new THREE.BoxGeometry(
            bodySize * 0.6,
            bodySize * 1.4,
            bodySize * 0.6
          );
          break;
        case "spherical":
          bodyGeometry = new THREE.SphereGeometry(bodySize * 0.5, 12, 12);
          break;
        case "elongated":
          bodyGeometry = new THREE.BoxGeometry(
            bodySize * 1.5,
            bodySize * 0.6,
            bodySize * 0.6
          );
          break;
        default:
          // 'blocky'
          bodyGeometry = new THREE.BoxGeometry(bodySize, bodySize, bodySize);
      }

      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.7,
        metalness: 0.1
      });

      const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      bodyMesh.creature = this; // Reference back to creature

      if (this.genes.bodyShape === "spherical") {
        bodyMesh.position.copy(this.body.position);
      } else {
        bodyMesh.position.copy(this.body.position);
      }

      this.meshes.push(bodyMesh);
      scene.add(bodyMesh);

      // Limbs
      const limbRadius = bodySize * 0.15;
      const limbLength = bodySize * 0.7;

      this.limbBodies.forEach((limbBody, i) => {
        let limbGeometry;

        if (this.genes.symmetry === "radial") {
          limbGeometry = new THREE.CylinderGeometry(
            limbRadius,
            limbRadius,
            limbLength,
            8
          );
        } else {
          limbGeometry = new THREE.BoxGeometry(
            limbLength,
            limbRadius * 2,
            limbRadius * 2
          );
        }

        const limbMaterial = new THREE.MeshStandardMaterial({
          color: limbColor,
          roughness: 0.7,
          metalness: 0.1
        });

        const limbMesh = new THREE.Mesh(limbGeometry, limbMaterial);
        limbMesh.castShadow = true;
        limbMesh.receiveShadow = true;

        if (this.genes.symmetry === "radial") {
          limbMesh.rotation.x = Math.PI / 2;
        }

        this.meshes.push(limbMesh);
        scene.add(limbMesh);
      });

      // Eyes
      if (Math.random() > 0.3) {
        const eyeSize = bodySize * 0.1;
        const eyeGeometry = new THREE.SphereGeometry(eyeSize, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

        for (let i = 0; i < 2; i++) {
          const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
          const pupil = new THREE.Mesh(
            new THREE.SphereGeometry(eyeSize * 0.6, 8, 8),
            pupilMaterial
          );
          pupil.position.set(0, 0, eyeSize * 0.4);

          // Position eyes based on symmetry
          if (this.genes.symmetry === "radial") {
            eye.position.set(
              (i === 0 ? -1 : 1) * bodySize * 0.3,
              bodySize * 0.4,
              -bodySize * 0.2
            );
          } else {
            eye.position.set(
              (i === 0 ? -1 : 1) * bodySize * 0.2,
              bodySize * 0.3,
              -bodySize * 0.3
            );
          }

          eye.add(pupil);
          bodyMesh.add(eye);
          this.meshes.push(eye, pupil);
        }
      }
    }

    updateVisualRepresentation() {
      if (this.meshes.length === 0 || !this.body) return;

      // Update main body mesh
      this.meshes[0].position.copy(this.body.position);
      this.meshes[0].quaternion.copy(this.body.quaternion);

      // Update limb meshes
      this.limbBodies.forEach((limb, i) => {
        if (this.meshes[i + 1]) {
          this.meshes[i + 1].position.copy(limb.position);
          this.meshes[i + 1].quaternion.copy(limb.quaternion);
        }
      });
    }

    makeDecision(time) {
      if (time - this.lastDecisionTime < 1) return; // Only make decisions every second

      this.lastDecisionTime = time;

      // Age and energy consumption
      this.age++;
      this.energy -= 0.2 * this.genes.metabolism;

      if (this.energy <= 0) {
        this.alive = false;
        return;
      }

      // Random chance to change direction
      if (Math.random() < 0.3) {
        this.targetDirection
          .set(Math.random() * 2 - 1, 0, Math.random() * 2 - 1)
          .normalize();
      }

      // Look for nearby food
      if (this.energy < 70 || Math.random() < 0.5) {
        this.findFood();
      }

      // If we have a target food, move toward it
      if (this.targetFood) {
        const direction = new CANNON.Vec3(
          this.targetFood.body.position.x - this.body.position.x,
          0,
          this.targetFood.body.position.z - this.body.position.z
        ).unit();

        this.targetDirection.set(direction.x, 0, direction.z);
      }

      // Chance to mate if energy is high and not already mated
      if (this.energy > 70 && !this.mated && Math.random() < 0.1) {
        this.findMate();
      }
    }

    findFood() {
      let closestFood = null;
      let closestDistance = Infinity;
      const senseRange = 5 + this.genes.senseRange * 10;

      foods.forEach((food) => {
        const distance = this.body.position.distanceTo(food.body.position);
        if (distance < senseRange && distance < closestDistance) {
          closestDistance = distance;
          closestFood = food;
        }
      });

      this.targetFood = closestFood;
    }

    findMate() {
      let closestMate = null;
      let closestDistance = 10; // Only look for mates within 10 meters

      creatures.forEach((creature) => {
        if (
          creature.id !== this.id &&
          creature.energy > 70 &&
          !creature.mated
        ) {
          const distance = this.body.position.distanceTo(
            creature.body.position
          );
          if (distance < closestDistance) {
            closestDistance = distance;
            closestMate = creature;
          }
        }
      });

      if (closestMate && Math.random() < 0.7) {
        // 70% chance to mate if found
        this.mateWith(closestMate);
      }
    }

    mateWith(mate) {
      if (this.mated || mate.mated) return;

      const mutationRate = parseInt(
        document.getElementById("mutation-rate").value
      );
      const child = this.breedWith(mate, mutationRate);

      // Add child to population
      creatures.push(child);

      // Mark both parents as mated
      this.mated = true;
      mate.mated = true;

      // Update UI in next frame
      setTimeout(() => {
        renderPopulation();
        if (
          selectedCreature &&
          (selectedCreature.id === this.id || selectedCreature.id === mate.id)
        ) {
          selectCreature(child);
        }
      }, 0);
    }

    move(time) {
      if (!this.alive) return;

      // Apply movement forces
      const speed = 5 + this.genes.speed * 15;

      // Dampen existing velocity
      this.body.velocity.x *= 0.9;
      this.body.velocity.z *= 0.9;

      // Apply new force in target direction scaled by speed
      const force = new CANNON.Vec3(
        this.targetDirection.x * speed,
        0,
        this.targetDirection.z * speed
      );

      this.body.applyForce(force, this.body.position);

      // Animate limbs if time is available
      if (time && this.limbBodies.length > 0) {
        const cycle = Math.sin(time * 5 * this.genes.speed) * 0.5;

        this.limbBodies.forEach((limb, i) => {
          // For radial limbs
          if (this.genes.symmetry === "radial") {
            const angleOffset = (i / this.limbBodies.length) * Math.PI * 2;
            const swing =
              Math.sin(time * 5 * this.genes.speed + angleOffset) * 0.2;

            // Apply force to swing limbs
            const swingForce = new CANNON.Vec3(
              this.targetDirection.x * swing * speed * 0.5,
              0,
              this.targetDirection.z * swing * speed * 0.5
            );

            limb.applyForce(swingForce, limb.position);
          } else {
            // For bilateral limbs
            const phase = i % 2 === 0 ? 0 : Math.PI;
            const swing = Math.sin(time * 5 * this.genes.speed + phase) * 0.2;

            // Apply force to swing limbs forward/back
            const swingForce = new CANNON.Vec3(
              this.targetDirection.x * swing * speed,
              0,
              this.targetDirection.z * swing * speed
            );

            limb.applyForce(swingForce, limb.position);
          }
        });
      }
    }

    checkForCollisions() {
      if (!this.alive) return;

      // Check for food collisions
      if (!this.targetFood || !this.targetFood.alive) {
        this.targetFood = null;
        return;
      }

      const distance = this.body.position.distanceTo(
        this.targetFood.body.position
      );
      const collisionDistance = 1 + this.genes.size;

      if (distance < collisionDistance) {
        this.eat(this.targetFood);
        this.targetFood = null;
      }
    }

    eat(food) {
      if (!food.alive) return;

      // Consume the food
      this.energy += FOOD_ENERGY * this.genes.health;
      this.energy = Math.min(100, this.energy);
      this.eaten++;
      food.alive = false;

      // Remove food from world and scene
      world.removeBody(food.body);
      scene.remove(food.mesh);

      // Remove from foods array
      const index = foods.indexOf(food);
      if (index !== -1) foods.splice(index, 1);

      // Update food count
      updateFoodCount();
    }

    calculateFitness() {
      // Base fitness on energy, age, and eaten food
      const survivalFitness = (this.age / 100) * 0.2;
      const energyFitness = (this.energy / 100) * 0.3;
      const foodFitness = Math.min(1, this.eaten / 20);

      // Environment-specific adaptations
      let environmentalFitness = 0;

      switch (environmentType) {
        case "plains":
          environmentalFitness =
            this.genes.speed * 0.2 + this.genes.health * 0.1;
          break;
        case "ocean":
          environmentalFitness = this.genes.speed * 0.3 - this.genes.size * 0.1;
          break;
        case "mountains":
          environmentalFitness = this.genes.strength * 0.3;
          break;
        case "desert":
          environmentalFitness = this.genes.health * 0.3;
          break;
        case "forest":
          const colorFitness = 1 - Math.abs(this.genes.color - 120) / 360;
          environmentalFitness = colorFitness * 0.2 + this.genes.size * 0.1;
          break;
        case "predators":
          // Higher aggression is better
          environmentalFitness =
            (this.genes.behavior + 1) * 0.15 + this.genes.speed * 0.15;
          break;
      }

      // Combine fitness components
      this.fitness =
        survivalFitness +
        energyFitness +
        foodFitness * 0.5 +
        environmentalFitness;

      // Ensure fitness is between 0 and 1
      this.fitness = Math.max(0, Math.min(1, this.fitness));
      return this.fitness;
    }

    mutate(mutationRate) {
      const mutationFactor = mutationRate / 50; // Scale to 0.02 to 0.2

      for (const gene in this.genes) {
        if (gene === "symmetry" || gene === "bodyShape") {
          // For discrete traits, chance to flip to another value
          if (Math.random() < mutationFactor * 0.5) {
            if (gene === "symmetry") {
              this.genes.symmetry =
                this.genes.symmetry === "radial" ? "bilateral" : "radial";
            } else {
              const shapes = ["blocky", "slender", "spherical", "elongated"];
              this.genes.bodyShape =
                shapes[Math.floor(Math.random() * shapes.length)];
            }
          }
        } else if (gene === "limbs") {
          // Limbs can change by +- 1 or 2 with mutation
          if (Math.random() < mutationFactor) {
            this.genes.limbs = Math.max(
              2,
              this.genes.limbs + (Math.random() < 0.5 ? -1 : 1)
            );
          }
        } else {
          // For continuous traits, add or subtract small amount
          if (Math.random() < mutationFactor) {
            const change = (Math.random() - 0.5) * 0.3 * mutationFactor;
            this.genes[gene] = Math.max(
              0,
              Math.min(1, this.genes[gene] + change)
            );
          }
        }
      }

      // After mutation, recalculate fitness
      this.calculateFitness();

      // If body changed significantly, recreate physics and visuals
      if (Math.random() < mutationFactor * 0.5) {
        this.recreatePhysicsAndVisuals();
      }
    }

    recreatePhysicsAndVisuals() {
      // Remove old physics bodies and constraints
      this.removePhysicsBodies();

      // Remove old meshes
      this.meshes.forEach((mesh) => scene.remove(mesh));
      this.meshes = [];

      // Create new physics and visual representation
      this.createPhysicsBody();
      this.createVisualRepresentation();
    }

    removePhysicsBodies() {
      if (this.body) world.removeBody(this.body);

      this.limbBodies.forEach((limb) => {
        if (limb) world.removeBody(limb);
      });

      this.constraints.forEach((constraint) => {
        if (constraint) world.removeConstraint(constraint);
      });

      this.limbBodies = [];
      this.constraints = [];
    }

    breedWith(partner, mutationRate) {
      // Sexual recombination
      const childGenes = {};

      for (const gene in this.genes) {
        if (gene === "symmetry" || gene === "bodyShape") {
          // Discrete traits - 50/50 chance from either parent
          childGenes[gene] =
            Math.random() < 0.5 ? this.genes[gene] : partner.genes[gene];
        } else {
          // Continuous traits - blend of both parents with possible mutation
          childGenes[gene] = (this.genes[gene] + partner.genes[gene]) / 2;
        }
      }

      // Inherit species from more fit parent
      const parent1Fitness = this.fitness;
      const parent2Fitness = partner.fitness;

      childGenes.speciesId =
        parent1Fitness > parent2Fitness ? this.speciesId : partner.speciesId;

      // Create child with combined genes
      const child = new VoxelCreature(
        childGenes,
        Math.max(this.generation, partner.generation) + 1
      );

      // Apply mutations
      child.mutate(mutationRate);

      return child;
    }

    getSpecialization() {
      const traits = {
        speed: this.genes.speed,
        strength: this.genes.strength,
        size: this.genes.size,
        health: this.genes.health,
        behavior: this.genes.behavior
      };

      const maxTrait = Object.keys(traits).reduce((a, b) =>
        traits[a] > traits[b] ? a : b
      );
      const minTrait = Object.keys(traits).reduce((a, b) =>
        traits[a] < traits[b] ? a : b
      );

      const specializationScore = traits[maxTrait] - traits[minTrait];

      if (specializationScore > 0.4) {
        return {
          trait: maxTrait,
          score: specializationScore
        };
      } else {
        return {
          trait: "generalist",
          score: specializationScore
        };
      }
    }
  }

  // Food class
  class Food {
    constructor() {
      this.alive = true;

      // Create physics body
      this.body = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(
          1 + (Math.random() - 0.5) * (WORLD_SIZE-2),
          0.5,
          1 + (Math.random() - 0.5) * (WORLD_SIZE-2)
        ),
        shape: new CANNON.Sphere(FOOD_SIZE * 0.5),
        material: new CANNON.Material({ friction: 0.5, restitution: 0.3 })
      });

      this.body.food = this; // Reference back to food
      world.addBody(this.body);

      // Create visual representation
      this.createVisualRepresentation();
    }

    createVisualRepresentation() {
      const geometry = new THREE.SphereGeometry(FOOD_SIZE * 0.5, 16, 16);
      const color = new THREE.Color(
        `hsl(${Math.random() * 60 + 80}, 70%, 50%)`
      );
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.9,
        metalness: 0.1
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      scene.add(this.mesh);
    }

    updateVisualRepresentation() {
      if (this.mesh) {
        this.mesh.position.copy(this.body.position);
      }
    }
  }

  // Initialize THREE.js and Cannon.js
  function initPhysicsWorld() {
    // Setup Cannon.js physics world
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Earth gravity
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    // Create ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    world.addBody(groundBody);

    // Setup Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Setup camera
    camera = new THREE.PerspectiveCamera(
      75,
      voxelViewer.offsetWidth / voxelViewer.offsetHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(voxelViewer.offsetWidth, voxelViewer.offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    threeContainer.innerHTML = "";
    threeContainer.appendChild(renderer.domElement);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(WORLD_SIZE, WORLD_SIZE / 2);
    scene.add(gridHelper);

    // Add world bounds
    addWorldBounds();

    // Start rendering
    animate();

    // Hide loading screen when ready
    loadingOverlay.style.display = "none";
  }

  function addWorldBounds() {
    // Create invisible walls around the world
    const wallMaterial = new CANNON.Material({
      friction: 0.3,
      restitution: 0.7
    });
    const wallShape = new CANNON.Box(new CANNON.Vec3(WORLD_SIZE / 2, 10, 1));

    // North wall
    const northWall = new CANNON.Body({ mass: 0 });
    northWall.addShape(wallShape);
    northWall.position.set(0, 5, -WORLD_SIZE / 2);
    world.addBody(northWall);

    // South wall
    const southWall = new CANNON.Body({ mass: 0 });
    southWall.addShape(wallShape);
    southWall.position.set(0, 5, WORLD_SIZE / 2);
    world.addBody(southWall);

    // West wall
    const westWall = new CANNON.Body({ mass: 0 });
    westWall.addShape(new CANNON.Box(new CANNON.Vec3(1, 10, WORLD_SIZE / 2)));
    westWall.position.set(-WORLD_SIZE / 2, 5, 0);
    world.addBody(westWall);

    // East wall
    const eastWall = new CANNON.Body({ mass: 0 });
    eastWall.addShape(new CANNON.Box(new CANNON.Vec3(1, 10, WORLD_SIZE / 2)));
    eastWall.position.set(WORLD_SIZE / 2, 5, 0);
    world.addBody(eastWall);

    // Visual representation of bounds (for debugging)
    if (false) {
      const wallGeometry = new THREE.BoxGeometry(WORLD_SIZE, 10, 2);
      const wallMaterial = new THREE.MeshBasicMaterial({
        color: 0x444444,
        wireframe: true,
        opacity: 0.3,
        transparent: true
      });

      const northWallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      northWallMesh.position.set(0, 5, -WORLD_SIZE / 2);
      scene.add(northWallMesh);

      const southWallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      southWallMesh.position.set(0, 5, WORLD_SIZE / 2);
      scene.add(southWallMesh);

      const westWallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 10, WORLD_SIZE),
        wallMaterial
      );
      westWallMesh.position.set(-WORLD_SIZE / 2, 5, 0);
      scene.add(westWallMesh);

      const eastWallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 10, WORLD_SIZE),
        wallMaterial
      );
      eastWallMesh.position.set(WORLD_SIZE / 2, 5, 0);
      scene.add(eastWallMesh);
    }
  }

  // Animation loop
  function animate(time) {
    requestAnimationFrame(animate);

    // Update physics
    updatePhysics(time);

    // Update camera to follow creature
    if (followedCreature && followedCreature.body) {
      camera.position.lerp(
        new THREE.Vector3(
          followedCreature.body.position.x,
          followedCreature.body.position.y + 10,
          followedCreature.body.position.z + 20
        ),
        0.1
      );
      camera.lookAt(
        new THREE.Vector3(
          followedCreature.body.position.x,
          followedCreature.body.position.y + 5,
          followedCreature.body.position.z
        )
      );
    }

    // Render scene
    renderer.render(scene, camera);
  }

  function updatePhysics(time) {
    if (!simulationRunning) return;

    // Spawn food periodically
    if (foods.length < getMaxFoodCount() && Math.random() < 0.05) {
      spawnFood();
    }

    // Update creatures
    creatures.forEach((creature) => {
      if (creature.alive) {
        creature.makeDecision(time);
        creature.move(time);
        creature.checkForCollisions();
        creature.updateVisualRepresentation();
        creature.calculateFitness();
      }
    });

    // Update food visuals
    foods.forEach((food) => {
      if (food.alive) {
        food.updateVisualRepresentation();
      }
    });

    // Step physics world
    const deltaTime = time - lastTime;
    lastTime = time;

    if (deltaTime > 0) {
      world.step(PHYSICS_STEP, deltaTime, SUBSTEPS);
    }

    // Remove dead creatures
    cleanupDeadCreatures();

    // Check if should advance generation
    checkGenerationAdvance();
  }

  function spawnFood() {
    if (foods.length >= getMaxFoodCount()) return;

    const food = new Food();
    foods.push(food);
    updateFoodCount();
  }

  function getMaxFoodCount() {
    const foodScale = parseInt(document.getElementById("food-amount").value);
    return Math.floor((MAX_FOOD * foodScale) / 10);
  }

  function cleanupDeadCreatures() {
    const aliveCreatures = [];

    creatures.forEach((creature) => {
      if (creature.alive && creature.energy > 0) {
        aliveCreatures.push(creature);
      } else {
        // Remove physics bodies and visuals
        creature.removePhysicsBodies();
        creature.meshes.forEach((mesh) => scene.remove(mesh));

        // If this was the selected/followed creature, clear selection
        if (selectedCreature && selectedCreature.id === creature.id) {
          selectedCreature = null;
          statsOverlay.classList.add("hidden");
        }

        if (followedCreature && followedCreature.id === creature.id) {
          followedCreature = null;
        }
      }
    });

    creatures = aliveCreatures;
  }

  function checkGenerationAdvance() {
    // Advance generation when 80% of creatures have died
    const survivalThreshold = Math.max(3, creatures.length * 0.2);

    if (creatures.length <= survivalThreshold && simulationRunning) {
      nextGeneration();
    }
  }

  function nextGeneration() {
    // Evaluate fitness for all creatures
    creatures.forEach((creature) => creature.calculateFitness());

    // Sort by fitness (descending)
    creatures.sort((a, b) => b.fitness - a.fitness);

    // Keep top performers (elitism)
    const keepCount = Math.max(3, Math.floor(creatures.length * 0.3));
    const nextGeneration = creatures.slice(0, keepCount);

    // Breed to fill population
    const targetPopulation = parseInt(
      document.getElementById("population-size").value
    );
    const mutationRate = parseInt(
      document.getElementById("mutation-rate").value
    );

    while (nextGeneration.length < targetPopulation) {
      // Select parents using fitness-proportionate selection
      const parent1 = selectParent();
      const parent2 = selectParent();

      if (parent1 && parent2) {
        const child = parent1.breedWith(parent2, mutationRate);
        nextGeneration.push(child);
      }
    }

    // Reset mated status for new generation
    nextGeneration.forEach((creature) => (creature.mated = false));

    creatures = nextGeneration;
    currentGeneration++;
    updateGenerationCounter();
    renderPopulation();
    updateChartData();

    // Store fitness history
    const maxFitness = creatures[0]?.fitness || 0;
    fitnessHistory.push(maxFitness * 100);
    if (fitnessHistory.length > 15) {
      fitnessHistory.shift();
    }

    // Update fitness score
    fitnessScore.textContent = maxFitness.toFixed(2);

    // Show fittest creature
    if (creatures.length > 0) {
      selectCreature(creatures[0]);
    }

    // Spawn new food
    respawnFood();
  }

  function selectParent() {
    // Fitness proportionate selection
    const fitnessSum = creatures.reduce(
      (sum, creature) => sum + creature.fitness,
      0
    );
    const random = Math.random() * fitnessSum;
    let runningSum = 0;

    for (const creature of creatures) {
      runningSum += creature.fitness;
      if (runningSum >= random) {
        return creature;
      }
    }

    return creatures[0]; // fallback
  }

  function respawnFood() {
    // Remove all existing food
    foods.forEach((food) => {
      world.removeBody(food.body);
      scene.remove(food.mesh);
    });
    foods = [];

    // Spawn new food
    for (let i = 0; i < getMaxFoodCount(); i++) {
      spawnFood();
    }
  }

  // Initialize simulation
  function initSimulation(populationSize = 12) {
    clearPopulation();

    // Create initial population
    for (let i = 0; i < populationSize; i++) {
      creatures.push(new VoxelCreature(null, 0));
    }

    currentGeneration = 0;
    nextCreatureId = 0;
    updateGenerationCounter();

    // Spawn initial food
    respawnFood();

    renderPopulation();
    updateChartData();

    // Select a random creature
    if (creatures.length > 0) {
      selectCreature(creatures[Math.floor(Math.random() * creatures.length)]);
    }
  }

  // Render population grid
  function renderPopulation() {
    populationGrid.innerHTML = "";

    // Sort by fitness
    const sortedCreatures = [...creatures].sort(
      (a, b) => b.fitness - a.fitness
    );

    sortedCreatures.forEach((creature) => {
      const color = new THREE.Color(`hsl(${creature.genes.color}, 70%, 50%)`);

      const card = document.createElement("div");
      card.className = `creature-card bg-gray-700 rounded-lg p-3 cursor-pointer transition ${
        selectedCreature?.id === creature.id ? "ring-2 ring-teal-400" : ""
      }`;

      // Create a simple visual representation for the card
      const visual = document.createElement("div");
      visual.className =
        "h-24 mb-2 flex items-center justify-center rounded bg-gray-800 relative";

      // Main body
      const body = document.createElement("div");
      body.className = "absolute w-8 h-8";
      body.style.backgroundColor = `hsl(${creature.genes.color}, 70%, 50%)`;
      body.style.borderRadius =
        creature.genes.bodyShape === "spherical" ? "50%" : "0";
      body.style.transform = `
                        translate(-50%, -50%)
                        ${
                          creature.genes.bodyShape === "slender"
                            ? "scaleX(0.7) scaleY(1.4)"
                            : ""
                        }
                        ${
                          creature.genes.bodyShape === "elongated"
                            ? "scaleX(1.5) scaleY(0.7)"
                            : ""
                        }
                    `;

      // Add some limbs based on symmetry and count
      const limbs = [];
      const showLimbs = Math.min(4, creature.genes.limbs);
      const limbColor = `hsl(${(creature.genes.color + 20) % 360}, 70%, 50%)`;

      if (creature.genes.symmetry === "radial") {
        for (let i = 0; i < showLimbs; i++) {
          const angle = (i / showLimbs) * Math.PI * 2;
          const x = Math.cos(angle) * 20;
          const y = Math.sin(angle) * 20;

          limbs.push(`
                                <div class="absolute w-2 h-4" style="
                                    background-color: ${limbColor};
                                    left: 50%;
                                    top: 50%;
                                    margin-left: -1px;
                                    margin-top: -2px;
                                    transform: translate(${x}px, ${y}px) rotate(${angle}rad);
                                "></div>
                            `);
        }
      } else {
        for (let i = 0; i < showLimbs; i++) {
          const xOffset = i % 2 === 0 ? -15 : 15;
          const yPos = -15 + Math.floor(i / 2) * 15;

          limbs.push(`
                                <div class="absolute h-2 w-4" style="
                                    background-color: ${limbColor};
                                    left: 50%;
                                    top: 50%;
                                    margin-left: -8px;
                                    margin-top: -1px;
                                    transform: translate(${xOffset}px, ${yPos}px);
                                "></div>
                            `);
        }
      }

      visual.innerHTML = `
                        ${limbs.join("")}
                        <div class="absolute w-8 h-8" style="
                            background-color: ${color.getStyle()};
                            left: 50%;
                            top: 50%;
                            margin-left: -16px;
                            margin-top: -16px;
                            border-radius: ${
                              creature.genes.bodyShape === "spherical"
                                ? "50%"
                                : "0"
                            };
                            transform: translate(0, 0)
                                ${
                                  creature.genes.bodyShape === "slender"
                                    ? "scaleX(0.7) scaleY(1.4)"
                                    : ""
                                }
                                ${
                                  creature.genes.bodyShape === "elongated"
                                    ? "scaleX(1.5) scaleY(0.7)"
                                    : ""
                                };
                        "></div>
                    `;

      card.appendChild(visual);

      // Add creature info
      const info = document.createElement("div");
      info.className = "text-sm";
      info.innerHTML = `
                        <div class="flex justify-between mb-1">
                            <span class="font-medium">Gen ${
                              creature.generation
                            }</span>
                            <span class="text-xs bg-gray-600 px-1 rounded">${Math.round(
                              creature.fitness * 100
                            )}%</span>
                        </div>
                        <div class="flex justify-between text-xs text-gray-400 mb-1">
                            <span>${
                              creature.speciesId
                                ? `Species ${creature.speciesId}`
                                : "New"
                            }</span>
                            <span>Age ${creature.age}</span>
                        </div>
                        <div class="h-1 w-full bg-gray-600 rounded-full mb-1">
                            <div class="h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" style="width: ${
                              creature.energy
                            }%"></div>
                        </div>
                        <div class="h-1 w-full bg-gray-600 rounded-full">
                            <div class="h-1 bg-gradient-to-r from-green-400 to-green-500 rounded-full" style="width: ${Math.min(
                              100,
                              creature.eaten * 10
                            )}%"></div>
                        </div>
                    `;

      card.appendChild(info);

      card.addEventListener("click", () => selectCreature(creature));
      populationGrid.appendChild(card);
    });
  }

  // Select a creature to view details
  function selectCreature(creature) {
    selectedCreature = creature;
    updateSelectedCreatureInfo();
    highlightSelectedCard();

    // Show stats overlay
    statsOverlay.classList.remove("hidden");

    // Update stats display
    if(document.getElementById("stat-speed")) { document.getElementById("stat-speed").textContent = (
      creature.genes.speed * 10
    ).toFixed(1);
    document.getElementById("stat-strength").textContent = (
      creature.genes.strength * 10
    ).toFixed(1);
    document.getElementById("stat-size").textContent = (
      creature.genes.size * 10
    ).toFixed(1);
    document.getElementById("stat-health").textContent = (
      creature.genes.health * 10
    ).toFixed(1);
    document.getElementById("stat-energy").textContent = Math.round(
      creature.energy
    );
    document.getElementById("stat-age").textContent = creature.age;
                                              }
    // Update gene visualization
    updateGeneVisualization(creature);
  }

  // Update selected creature info display
  function updateSelectedCreatureInfo() {
    if (!selectedCreature) return;

    document.getElementById(
      "selected-creature"
    ).textContent = `Creature #${selectedCreature.id
      .toString()
      .padStart(4, "0")}`;
    document.getElementById(
      "creature-age"
    ).textContent = `Age: ${selectedCreature.age}`;
    document.getElementById("creature-fitness").textContent = `Fitness: ${(
      selectedCreature.fitness * 100
    ).toFixed(1)}%`;
    document.getElementById(
      "creature-generation"
    ).textContent = `Gen: ${selectedCreature.generation}`;
    document.getElementById("creature-species").textContent = `Species: ${
      selectedCreature.speciesId !== null ? selectedCreature.speciesId : "New"
    }`;
  }

  // Update gene visualization bars
  function updateGeneVisualization(creature) {
    if (!creature) return;

    // Update progress bars
    speedBar.style.width = `${creature.genes.speed * 100}%`;
    strengthBar.style.width = `${creature.genes.strength * 100}%`;
    sizeBar.style.width = `${creature.genes.size * 100}%`;
    healthBar.style.width = `${creature.genes.health * 100}%`;
    behaviorBar.style.width = `${((creature.genes.behavior + 1) / 2) * 100}%`;

    // Update values
    speedValue.textContent = `${(creature.genes.speed * 10).toFixed(1)}`;
    strengthValue.textContent = `${(creature.genes.strength * 10).toFixed(1)}`;
    sizeValue.textContent = `${(creature.genes.size * 10).toFixed(1)}`;
    healthValue.textContent = `${(creature.genes.health * 10).toFixed(1)}`;
    behaviorType.textContent =
      creature.genes.behavior > 0
        ? "Aggressive"
        : creature.genes.behavior < 0
        ? "Passive"
        : "Neutral";

    // Update specialization
    const spec = creature.getSpecialization();
    specializationBar.style.width = `${spec.score * 100}%`;
    specialization.textContent =
      spec.trait === "generalist" ? "Generalist" : `${spec.trait} specialist`;
  }

  // Initialize chart
  function initLineageChart() {
    const ctx = document.getElementById("lineage-chart").getContext("2d");

    lineageChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: 15 }, (_, i) => `Gen ${i}`),
        datasets: [
          {
            label: "Top Fitness",
            data: Array(15).fill(0),
            borderColor: "#4fd1c5",
            backgroundColor: "rgba(79, 209, 197, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: {
              color: "rgba(255, 255, 255, 0.1)"
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)"
            }
          },
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.05)"
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)"
            }
          }
        },
        elements: {
          point: {
            radius: 0
          }
        }
      }
    });
  }

  // Update chart data
  function updateChartData() {
    if (!lineageChart) return;

    // Shift data if needed
    const labels = Array.from({ length: 15 }, (_, i) => {
      const gen = currentGeneration - (14 - i);
      return `Gen ${gen >= 0 ? gen : ""}`;
    });

    // Pad fitness history with zeros if needed
    const paddedFitness = [
      ...Array(Math.max(0, 15 - fitnessHistory.length)).fill(0),
      ...fitnessHistory
    ];

    lineageChart.data.labels = labels;
    lineageChart.data.datasets[0].data = paddedFitness;
    lineageChart.update();
  }

  // Clear population
  function clearPopulation() {
    // Remove all creatures
    creatures.forEach((creature) => {
      creature.removePhysicsBodies();
      creature.meshes.forEach((mesh) => scene.remove(mesh));
    });

    creatures = [];
    foods = [];

    renderPopulation();
    selectedCreature = null;
    followedCreature = null;
    statsOverlay.classList.add("hidden");
    document.getElementById("selected-creature").textContent = "None";
    fitnessScore.textContent = "0";
    fitnessHistory = [];
    updateChartData();
    updateFoodCount();
  }

  // Update food count display
  function updateFoodCount() {
    foodCount.textContent = foods.length;
  }

  // Highlight the selected creature's card
  function highlightSelectedCard() {
    document.querySelectorAll(".creature-card").forEach((card) => {
      const creatureId = card.querySelector("div").dataset.creatureId;
      if (selectedCreature && creatureId === selectedCreature.id.toString()) {
        card.classList.add("ring-2", "ring-teal-400");
      } else {
        card.classList.remove("ring-2", "ring-teal-400");
      }
    });
  }

  // Update generation counter display
  function updateGenerationCounter() {
    generationCounter.textContent = currentGeneration;
  }

  // Breed selected creature with random mate
  function breedSelectedCreature() {
    if (!selectedCreature || creatures.length < 2) return;

    // Find a mate (not the same as selected)
    let mate;
    do {
      mate = creatures[Math.floor(Math.random() * creatures.length)];
    } while (mate.id === selectedCreature.id);

    const mutationRate = parseInt(
      document.getElementById("mutation-rate").value
    );
    const child = selectedCreature.breedWith(mate, mutationRate);

    // Add child to population
    creatures.push(child);

    // Select the new child
    selectCreature(child);
    renderPopulation();
  }

  // Force mutate selected creature
  function forceMutateCreature() {
    if (!selectedCreature) return;

    const mutationRate =
      parseInt(document.getElementById("mutation-rate").value) * 2; // More intense for forced mutation
    selectedCreature.mutate(mutationRate);

    // Update display
    selectCreature(selectedCreature);
    renderPopulation();
  }

  // Toggle follow mode for selected creature
  function toggleFollowCreature() {
    if (!selectedCreature) return;

    if (followedCreature && followedCreature.id === selectedCreature.id) {
      followedCreature = null;
      followBtn.innerHTML = '<i class="fas fa-eye mr-1"></i> Follow';
      followBtn.classList.remove("bg-green-700", "text-white");
      followBtn.classList.add("bg-green-600", "hover:bg-green-500");
    } else {
      followedCreature = selectedCreature;
      followBtn.innerHTML = '<i class="fas fa-eye-slash mr-1"></i> Following';
      followBtn.classList.remove("bg-green-600", "hover:bg-green-500");
      followBtn.classList.add("bg-green-700", "text-white");
    }
  }

  // Event listeners
  startBtn.addEventListener("click", () => {
    if (!simulationRunning) {
      simulationRunning = true;
      lastTime = performance.now();
      startBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Running...';
      startBtn.classList.replace("bg-teal-600", "bg-teal-700");
    }
  });

  pauseBtn.addEventListener("click", () => {
    simulationRunning = false;
    startBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Start Evolution';
    startBtn.classList.replace("bg-teal-700", "bg-teal-600");
  });

  resetBtn.addEventListener("click", () => {
    simulationRunning = false;
    startBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Start Evolution';
    startBtn.classList.replace("bg-teal-700", "bg-teal-600");

    const populationSize = parseInt(
      document.getElementById("population-size").value
    );
    initSimulation(populationSize);
  });

  breedBtn.addEventListener("click", breedSelectedCreature);
  mutateBtn.addEventListener("click", forceMutateCreature);
  followBtn.addEventListener("click", toggleFollowCreature);

  // Environment change
  environmentSelect.addEventListener("change", function () {
    environmentType = this.value;

    // Recalculate all fitness scores
    creatures.forEach((creature) => creature.calculateFitness());

    // Sort by new fitness
    creatures.sort((a, b) => b.fitness - a.fitness);

    // Update display if we have a selected creature
    if (selectedCreature) {
      selectCreature(selectedCreature);
    }

    renderPopulation();
  });

  // Physics accuracy change
  physicsAccuracyInput.addEventListener("input", function () {
    SUBSTEPS = parseInt(this.value);
  });

  // Food amount change
  foodAmountInput.addEventListener("input", function () {
    // Adjust food to new amount
    while (foods.length > getMaxFoodCount()) {
      const food = foods.pop();
      if (food) {
        world.removeBody(food.body);
        scene.remove(food.mesh);
      }
    }

    updateFoodCount();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space") {
      e.preventDefault();
      if (simulationRunning) {
        pauseBtn.click();
      } else {
        startBtn.click();
      }
    }

    if (e.code === "KeyF") {
      e.preventDefault();
      if (selectedCreature) {
        toggleFollowCreature();
      }
    }
  });

  // Get container dimensions
  const voxelViewer = document.querySelector(".voxel-container");
  const threeContainer = document.getElementById("three-container");

  // Initialize everything when cannon.js is loaded
  function checkCannonLoaded() {
    if (typeof CANNON !== "undefined") {
      initPhysicsWorld();
      initLineageChart();
      initSimulation();

      // Start with a random creature selected
      if (creatures.length > 0) {
        selectCreature(creatures[Math.floor(Math.random() * creatures.length)]);
      }
    } else {
      setTimeout(checkCannonLoaded, 100);
    }
  }

  checkCannonLoaded();

  // Resize handling
  window.addEventListener("resize", function () {
    if (renderer && camera) {
      camera.aspect = voxelViewer.offsetWidth / voxelViewer.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(voxelViewer.offsetWidth, voxelViewer.offsetHeight);
    }
  });
});

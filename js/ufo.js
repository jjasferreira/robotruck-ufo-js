'use strict';   // Applies to all script

/*
    *  UFO - key bindings:
    * - '1' - change camera to perspective view
    * - 'C' - toggle camera controls
    * - '7' - toggle edges visibility
    * - '8' - toggle light helper visibility
    * - '9' - toggle axes helper visibility
    * - '0' - toggle axes visibility
    * - 'W' - toggle wireframe
    * - 'L' - toggle light
    * - '←/→' - move UFO on x-axis
    * - '↑/↓' - move UFO on z-axis
 */

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let ufoScene, ufoRenderer;

let previousTime = 0, currentTime = 0;

let debugMode = false;

// Cameras
let camera;
const cameras = { persp: null };
let windowResized = false;
let controls;

// Keys
let keys = {};

// All meshes except for the terrain and sky
let meshes = [];

// Colors, materials and geometry edges
const colors = {
    fog: 0x656597, darkgrey: 0x404040, lightblue: 0x3492da, darkorange: 0xad5b28, bistre: 0x302514, darkgreen: 0x035f53,
    lightyellow: 0xffffb3, goldenyellow: 0xf7d842, grey: 0x999999
};
let currentMaterial;
let m = {};
let edgesMaterial;

// Axes Helper and all Rotation Axes
let axesHelper;
let isAxesHelperVisible = false;
let rAxes = {};

// Terrain's variables
let terrain, terrainMaterial, fieldTextureSize = 256;

// Sky's variables
let skydome, skydomeMaterial, skyTextureSize = 4096;

// UFO's Object3Ds
let body3D, cockpit3D, baubles3D, cylinder3D;

// Movements and Rotations
let movementSpeed = 40;
let rotationSpeed = 0.04;

// CorkTree's Object3Ds
let trunk3D, branch3D, trunkCrown3D, branchCrown3D;

// Moon's Object3Ds
let moon3D;

// House's Object3Ds
let house3D;

// UFO's, CorkTree's and Moon's dimensions
const d = {
    bodyR: 800, cockpitR: 400, passengerR: 80, baubleR: 80, cylinderR: 80, cylinderH: 200,
    lowTrunkBotR: 75, lowTrunkTopR: 50, lowTrunkH: 800, uppTrunkBotR: 60, uppTrunkTopR: 50, uppTrunkH: 200,
    lowBranchBotR: 50, lowBranchTopR: 35, lowBranchH: 300, uppBranchBotR: 45, uppBranchTopR: 35, uppBranchH: 200,
    trunkCrownR: 400, branchCrownR: 250,
    moonR: 200
};

// UFO's and Moon's lights
let pointLightIntensity = 1.5, pointLightHelper,
    spotLight, spotLightIntensity = 8.5, spotLightHelper,
    moonLight, moonLightIntensity = 0.8, moonLightHelper;
let pointLights = [];

//////////////////
/* CREATE SCENE */
//////////////////

function createScene() {

    ufoScene = new THREE.Scene();
    ufoScene.fog = new THREE.FogExp2(colors.fog, 0.00005);

    createAmbientLight(0xffffff, 0.1);

    createMaterials();
    createTerrain();
    createSkydome();
    createUFO(-1000, 2500, 500);
    createCorkTree(500, 50, -500, 1);
    createCorkTree(2000, 50, -500, 1.2);
    createCorkTree(3500, 50, -500, 0.8);
    createMoon();
    createHouse();
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

function createAmbientLight(color, intensity) {

    const ambientLight = new THREE.AmbientLight(color, intensity);
    ufoScene.add(ambientLight);
    return ambientLight;
}

// TODO: add other light creation logic to specific functions here

///////////////////////
/* CREATE COMPONENTS */
///////////////////////

function createMaterials() {

    // Color Phong Materials
    currentMaterial = 'phong';
    for (const [name, color] of Object.entries(colors))
        m[name] = new THREE.MeshPhongMaterial({ color: color, wireframe: false });
    m.cockpitMaterial = new THREE.MeshPhongMaterial({ color: colors.lightblue, wireframe: false, transparent: true, opacity: 0.5 });
    m.baubleMaterial = new THREE.MeshPhongMaterial({ color: colors.darkorange, wireframe: false, transparent: true, opacity: 0.5 });

    // Texture Phong Materials
    const displacementMap = new THREE.TextureLoader().setPath("textures").load("/heightmap.png");
    const displacementScale = 500;
    const normalMap = new THREE.TextureLoader().setPath("textures").load("/normalmap.png");
    const terrainTexture = new THREE.CanvasTexture(generateTerrainTexture(fieldTextureSize));
    terrainMaterial = new THREE.MeshPhongMaterial({
        color: colors.fog, displacementMap: displacementMap, displacementScale: displacementScale,
        normalMap: normalMap, side: THREE.DoubleSide, map: terrainTexture
    });
    const skydomeTexture = new THREE.CanvasTexture(generateSkyTexture(skyTextureSize));
    skydomeMaterial = new THREE.MeshPhongMaterial({ map: skydomeTexture, side: THREE.DoubleSide });

    // Edges material
    edgesMaterial = new THREE.LineBasicMaterial({ color: colors.grey, visible: false });
}

function updateMaterials(type) {

    if (currentMaterial === type)
        return;
    for (let mesh of meshes) {
        const mc = mesh.material.color;
        const mw = mesh.material.wireframe;
        const mt = mesh.material.transparent;
        const mo = mesh.material.opacity;
        switch (type) {
            case 'lambert':
                mesh.material = new THREE.MeshLambertMaterial({ color: mc, wireframe: mw, transparent: mt, opacity: mo });
                break;
            case 'phong':
                mesh.material = new THREE.MeshPhongMaterial({ color: mc, wireframe: mw, transparent: mt, opacity: mo });
                break;
            case 'toon':
                mesh.material = new THREE.MeshToonMaterial({ color: mc, wireframe: mw, transparent: mt, opacity: mo });
                break;
            case 'basic':
                mesh.material = new THREE.MeshBasicMaterial({ color: mc, wireframe: mw, transparent: mt, opacity: mo });
                break;
            default:
                break;
        }
    }
    currentMaterial = type;
}

function createTerrain() {

    const terrainGeometry = new THREE.PlaneGeometry(25000, 25000, 100, 100);
    terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI/2;
    terrain.receiveShadow = true;
    ufoScene.add(terrain);
}

function createSkydome() {

    const skydomeGeometry = new THREE.SphereGeometry(12500, 64, 64);
    skydome = new THREE.Mesh(skydomeGeometry, skydomeMaterial);
    ufoScene.add(skydome);
}

function createUFO(x, y, z) {

    // Body 3D (parent: scene; children: body, cockpit 3D, baubles 3D)
    body3D = createObject3D(ufoScene, x, y, z);
    meshes.push(createMesh('ell', [d.bodyR, 1, 3/8, 1], m.darkgrey, body3D));
    // Cockpit 3D (parent: body 3D; children: cockpit, passenger)
    cockpit3D = createObject3D(body3D, 0, d.bodyR/8, 0);
    meshes.push(createMesh('sph', [d.cockpitR], m.cockpitMaterial, cockpit3D));
    const passengerTexture = new THREE.TextureLoader().setPath('textures').load('/cat.png');
    const passengerMaterial = new THREE.MeshBasicMaterial({ map: passengerTexture, wireframe: false });
    meshes.push(createMesh('ell', [d.passengerR, 1, 5/6, 1], passengerMaterial, cockpit3D, 0, 7*d.passengerR/2, 0));
    // Baubles 3D (parent: body 3D; children: baubles, point lights)
    baubles3D = createObject3D(body3D, 0, -7*d.bodyR/40, 0);
    for (let i = 0; i < 12; i++) { // Baubles placed radially in increments of 30 degrees
        meshes.push(createMesh('sph', [d.baubleR], m.baubleMaterial, baubles3D, 4*d.bodyR/5*Math.sin(i*Math.PI/6), 0, 4*d.bodyR/5*Math.cos(i*Math.PI/6)));
        const pointLight = new THREE.PointLight(colors.lightyellow, 1, 1000);
        pointLight.position.set(5*d.bodyR/6*Math.sin(i*Math.PI/6), -3*d.bodyR/40, 5*d.bodyR/6*Math.cos(i*Math.PI/6));
        pointLight.intensity = pointLightIntensity;
        baubles3D.add(pointLight);
        pointLights.push(pointLight);
        // Point light helper
        pointLightHelper = new THREE.PointLightHelper(pointLight, 10);
        pointLightHelper.visible = false;
        ufoScene.add(pointLightHelper);
    }
    // Cylinder 3D (parent: body 3D; children: cylinder, spot light)
    cylinder3D = createObject3D(body3D, 0, -3*d.bodyR/8, 0);
    meshes.push(createMesh('cyl', [d.cylinderR, d.cylinderR, d.cylinderH], m.goldenyellow, cylinder3D));
    spotLight = new THREE.SpotLight(colors.white, 1);
    spotLight.position.set(0, -d.cylinderH/2, 0);
	spotLight.intensity = spotLightIntensity;
    spotLight.penumbra = 0.1;
    spotLight.castShadow = true;
    spotLight.distance = y-3*d.bodyR/8-d.cylinderH/2;
    spotLight.target = createObject3D(cylinder3D, 0, 3*d.bodyR/8-y, 0);
    spotLight.target.updateMatrixWorld();
    cylinder3D.add(spotLight);
    // Spot light helper
    spotLightHelper = new THREE.SpotLightHelper(spotLight);
    spotLightHelper.visible = false;
    ufoScene.add(spotLightHelper);
}

function createCorkTree(x, y, z, s) {

    // Trunk 3D (parent: scene; children: lower trunk, upper trunk, trunk crown 3D, branch 3D)
    trunk3D = createObject3D(ufoScene, x, y, z);
    meshes.push(createMesh('cyl', [s*d.lowTrunkTopR, s*d.lowTrunkBotR, s*d.lowTrunkH], m.darkorange, trunk3D, 0, s*d.lowTrunkH/2, 0));
    meshes.push(createMesh('cyl', [s*d.uppTrunkTopR, s*d.uppTrunkBotR, s*d.uppTrunkH], m.bistre, trunk3D, 0, s*(d.lowTrunkH+d.uppTrunkH/2), 0));
    // Trunk Crown 3D (parent: trunk 3D; children: trunk crown)
    trunkCrown3D = createObject3D(trunk3D, 0, s*(d.lowTrunkH+d.uppTrunkH), 0);
    meshes.push(createMesh('ell', [s*d.trunkCrownR, 1, 0.5, 1], m.darkgreen, trunkCrown3D, 0, s*d.trunkCrownR/4, 0));
    // Branch 3D (parent: trunk 3D, children: lower branch, upper branch, branch crown 3D)
    branch3D = createObject3D(trunk3D, 0, 3*s*d.lowTrunkH/4, 0);
    meshes.push(createMesh('cyl', [s*d.lowBranchTopR, s*d.lowBranchBotR, s*d.lowBranchH], m.darkorange, branch3D, 0, s*d.lowBranchH/2, 0));
    meshes.push(createMesh('cyl', [s*d.uppBranchTopR, s*d.uppBranchBotR, s*d.uppBranchH], m.bistre, branch3D, 0, s*(d.lowBranchH+d.uppBranchH/2), 0));
    // Branch Crown 3D (parent: branch 3D; children: branch crown)
    branchCrown3D = createObject3D(branch3D, 0, s*(d.lowBranchH+d.uppBranchH), 0);
    meshes.push(createMesh('ell', [s*d.branchCrownR, 1, 0.5, 1], m.darkgreen, branchCrown3D, 0, s*d.branchCrownR/4, 0));

    // Object3D's Final Rotations
    trunk3D.rotateOnWorldAxis(rAxes.y, getRandomAngle(0, 2*Math.PI));
    trunk3D.rotateOnWorldAxis(rAxes.x, getRandomAngle(-Math.PI/16, Math.PI/16));
    trunk3D.rotateOnWorldAxis(rAxes.z, getRandomAngle(-Math.PI/8, 0));
    branch3D.rotateOnWorldAxis(rAxes.x, getRandomAngle(-Math.PI/8, Math.PI/8));
    branch3D.rotateOnWorldAxis(rAxes.z, getRandomAngle(Math.PI/6, Math.PI/3));
    trunkCrown3D.rotateOnWorldAxis(rAxes.x, getRandomAngle(-Math.PI/16, Math.PI/16));
    trunkCrown3D.rotateOnWorldAxis(rAxes.z, getRandomAngle(-Math.PI/16, Math.PI/16));
    branchCrown3D.rotateOnWorldAxis(rAxes.x, getRandomAngle(-Math.PI/16, Math.PI/16));
    branchCrown3D.rotateOnWorldAxis(rAxes.z, getRandomAngle(-Math.PI/16, Math.PI/16));

    function getRandomAngle(min, max) {
        return Math.random() * (max - min) + min;
    }
}

function createHouse() {

    // House3D (parent: scene)
    house3D = createObject3D(ufoScene, 0, 160, 3000); 
    let vertices3D = [];
    let indexes3D = [];

    // Colors of various parts of the house
    let houseMaterials = [];
    const houseColors = {darkblue: 0x3630a6, white:0xffffff, orange:0xe7751c,
                         black: 0x000000, greyish:0xd6c3c3, darkbrown:0x53380e,
                         lightbrown:0x8c601b, darkgrey: 0x383a4f, oak:0x311d0a};
    for (const [name, color] of Object.entries(houseColors)) {
        houseMaterials.push( new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, wireframe: false}));
    }
    // settle a unit for simplification purposes
    let u = 80;
    let blueStripesVertices = 
        new Float32Array([0,0,0,             0,0,19*u,          0,2*u,19*u,        0,2*u,0,             //0,1,2,3 bottom stripe and door
                          0,8*u,19*u,        0,0,20*u,          0,8*u,20*u,        0,9*u,19*u,          //4,5,6,7
                          0,8*u,24*u,        0,9*u,24*u,        0,0,23*u,          0,0,24*u,            //8,9,10,11
                          0,8*u,23*u,        0,2*u,24*u,        0,0,32*u,          0,2*u,32*u,          //12,13,14,15
                          0,5.5*u,3.5*u,     0,5.5*u,4*u,       0,9*u,3.5*u,       0,9*u,4*u,           //16,17,18,19 right front window
                          0,9.5*u,3.5*u,     0,9.5*u,7*u,       0,9*u,7*u,         0,9.5*u,7.5*u,       //20,21,22,23
                          0,6*u,7*u,         0,6*u,7.5*u,       0,5.5*u,7.5*u,     0,6*u,4*u,           //24,25,26,27
                          0,5.5*u,11.5*u,    0,5.5*u,12*u,      0,9*u,11.5*u,      0,9*u,12*u,          //28,29,30,32 left front window
                          0,9.5*u,11.5*u,    0,9.5*u,15*u,      0,9*u,15*u,        0,9.5*u,15.5*u,      //32,33,34,35
                          0,6*u,15*u,        0,6*u,15.5*u,      0,5.5*u,15.5*u,    0,6*u,12*u,          //36,37,38,39
                          -40*u,0,0,         -40*u,2*u,0,       -40*u,0,32*u,      -40*u,2*u,32*u,      //40,41,42,43
                          -16.5*u,4*u,0,     -17.5*u,4*u,0,     -16.5*u,10*u,0,    -17.5*u,10*u,0,      //44,45,46,47 right-side window
                          -16.5*u,11*u,0,    -22.5*u,11*u,0,    -22.5*u,10*u,0,    -23.5*u,11*u,0,      //48,49,50,51
                          -22.5*u,5*u,0,     -23.5*u,5*u,0,     -23.5*u,4*u,0,     -16.5*u,5*u,0,       //52,53,54,55
                          -16.5*u,4*u,32*u,  -17.5*u,4*u,32*u,  -16.5*u,10*u,32*u, -17.5*u,10*u,32*u,   //56,57,58,59 left-side window
                          -16.5*u,11*u,32*u, -22.5*u,11*u,32*u, -22.5*u,10*u,32*u, -23.5*u,11*u,32*u,   //60,61,62,63
                          -22.5*u,5*u,32*u,  -23.5*u,5*u,32*u,  -23.5*u,4*u,32*u,  -16.5*u,5*u,32*u,    //64,65,66,67
                          -40*u,5.5*u,14*u,  -40*u,5.5*u,14.5*u,-40*u,9*u,14*u,    -40*u,9*u,14.5*u,    //68,69,70,71 back center window
                          -40*u,9.5*u,14*u,  -40*u,9.5*u,17.5*u,-40*u,9*u,17.5*u,  -40*u,9.5*u,18*u,    //72,73,74,75
                          -40*u,6*u,17.5*u,  -40*u,6*u,18*u,    -40*u,5.5*u,18*u,  -40*u,6*u,14.5*u,    //76,77,78,79
                          -40*u,5.5*u,3.5*u, -40*u,5.5*u,4*u,   -40*u,9*u,3.5*u,   -40*u,9*u,4*u,       //80,81,82,83 back right window
                          -40*u,9.5*u,3.5*u, -40*u,9.5*u,7*u,   -40*u,9*u,7*u,     -40*u,9.5*u,7.5*u,   //84,85,86,87
                          -40*u,6*u,7*u,     -40*u,6*u,7.5*u,   -40*u,5.5*u,7.5*u, -40*u,6*u,4*u,       //88,89,90,91
                          -40*u,5.5*u,24.5*u, -40*u,5.5*u,25*u,  -40*u,9*u,24.5*u,  -40*u,9*u,25*u,     //92,93,94,95 back left window
                          -40*u,9.5*u,24.5*u, -40*u,9.5*u,28*u,  -40*u,9*u,28*u,    -40*u,9.5*u,28.5*u, //96,97,98,99
                          -40*u,6*u,28*u,    -40*u,6*u,28.5*u,  -40*u,5.5*u,28.5*u, -40*u,6*u,25*u ]);  //100,101,102,103
                                  

    let blueStripesIndexes = [0,2,1, 0,2,3, 1,4,5, 4,5,6, 4,7,8, 7,8,9, 8,10,11,
                              8,12,10, 11,13,14, 13,14,15, 16,17,18, 17,18,19,
                              18,20,22, 20,21,22, 21,23,24, 23,24,25, 25,26,27,
                              17,26,27, 28,29,30, 29,30,31, 30,32,34, 32,33,34,
                              33,35,36, 35,36,37, 37,38,39, 29,38,39, 0,3,40, 
                              3,40,41, 14,15,42, 15,42,43, 44,45,46, 45,46,47,
                              46,48,50, 48,49,50, 49,51,52, 51,52,53, 53,54,55,
                              45,54,55, 56,57,58, 57,58,59, 58,60,62, 60,61,62,
                              61,63,64, 63,64,65, 65,66,67, 57,66,67, 40,41,42,
                              41,42,43, 68,69,70, 69,70,71, 70,72,74, 72,73,74,
                              73,75,76, 75,76,77, 77,78,79, 69,78,79, 80,81,82,
                              81,82,83, 82,84,86, 84,85,86, 85,87,88, 87,88,89,
                              89,90,91, 81,90,91, 92,93,94, 93,94,95, 94,96,98,
                              96,97,98, 97,99,100, 99,100,101, 101,102,103, 93,102,103];

    vertices3D.push(blueStripesVertices);
    indexes3D.push(blueStripesIndexes);

    let wallsVertices = 
        new Float32Array([0,2*u,0,            0,11*u,0,           0,2*u,3.5*u,        0,11*u,3.5*u,      //0,1,2,3 front side
                          0,9.5*u,3.5*u,      0,11*u,19*u,        0,9.5*u,19*u,       0,2*u,19*u,        //4,5,6,7
                          0,9.5*u,15.5*u,     0,2*u,15.5*u,       0,5.5*u,15.5*u,     0,5.5*u,3.5*u,     //8,9,10,11
                          0,5.5*u,7.5*u,      0,5.5*u,11.5*u,     0,9.5*u,7.5*u,      0,9.5*u,11.5*u,    //12,13,14,15
                          0,9*u,19*u,         0,11*u,24*u,        0,9*u,24*u,         0,2*u,24*u,        //16,17,18,19 
                          0,11*u,32*u,        0,2*u,32*u,         -40*u,2*u,0,        -40*u,5.5*u,0,     //20,21,22,23 back side
                          -40*u,2*u,32*u,     -40*u,5.5*u,32*u,   -40*u,11*u,0,       -40*u,5.5*u,3.5*u, //24,25,26,27
                          -40*u,11*u,3.5*u,   -40*u,11*u,32*u,    -40*u,5.5*u,28.5*u, -40*u,11*u,28.5*u, //28,29,30,31 
                          -40*u,9.5*u,3.5*u,  -40*u,9.5*u,28.5*u, -40*u,5.5*u,7.5*u,  -40*u,9.5*u,7.5*u, //32,33,34,35
                          -40*u,5.5*u,14*u,   -40*u,9.5*u,14*u,   -40*u,5.5*u,18*u,   -40*u,9.5*u,18*u,  //36,37,38,39
                          -40*u,5.5*u,24.5*u, -40*u,9.5*u,24.5*u, 0,4*u,0,            -40*u,4*u,0,       //40,41,42,43 right side
                          -16.5*u,4*u,0,      -16.5*u,11*u,0,     -23.5*u,4*u,0,      -23.5*u,11*u,0,    //44,45,46,47 
                          -20*u,18*u,0,       0,4*u,32*u,         -40*u,4*u,32*u,     -16.5*u,4*u,32*u,  //48,49,50,51 left side
                          -16.5*u,11*u,32*u,  -23.5*u,4*u,32*u,   -23.5*u,11*u,32*u,  -20*u,18*u,32*u,   //52,53,54,55
                          ]);

    let wallsIndexes = [0,1,2, 1,2,3, 3,4,5, 4,5,6, 6,7,9, 6,8,9, 9,10,11, 2,9,11,
                        12,13,14, 13,14,15, 5,16,18, 5,17,18, 17,19,21, 17,20,21,
                        22,23,24, 23,24,25, 23,26,27, 26,27,28, 25,29,30, 29,30,31,
                        28,32,33, 28,31,33, 34,35,36, 35,36,37, 38,39,40, 39,40,41,
                        0,42,22, 42,22,43, 42,1,44, 1,44,45, 26,43,46, 26,46,47,
                        1,26,48, 21,49,24, 49,24,50, 49,20,51, 20,51,52, 29,50,53,
                        29,53,54, 20,29,55];

    vertices3D.push(wallsVertices);
    indexes3D.push(wallsIndexes);

    let roofVertices = 
        new Float32Array([0,11*u,0,         0,11.5*u,0,       -20*u,18*u,0,     -20*u,18.5*u,0,     //0,1,2,3 roof
                          -40*u,11*u,0,     -40*u,11.5*u,0,    0,11*u,32*u,     0,11.5*u,32*u,      //4,5,6,7
                          -20*u,18*u,32*u,  -20*u,18.5*u,32*u, -40*u,11*u,32*u, -40*u,11.5*u,32*u,  //8,9,10,11
                           12*u,11*u,0,     12*u,11*u,32*u,    12*u,11.5*u,0,   12*u,11.5*u,32*u]); //12,13,14,15 roof extension

    let roofIndexes = [0,1,2, 1,2,3, 2,3,4, 3,4,5, 6,7,8, 7,8,9, 8,9,10, 9,10,11,
                       4,5,10, 5,10,11, 1,7,3, 3,9,7, 3,9,5, 5,11,9, 0,1,12,
                       12,14,1, 6,7,13, 13,15,7, 12,14,13, 13,14,15, 0,12,6, 6,12,13,
                       1,14,7, 7,15,14];

    vertices3D.push(roofVertices);
    indexes3D.push(roofIndexes);

    let windowFrameVertices = 
        new Float32Array([0,6*u,5.4*u,        0,6*u,5.6*u,        0,9*u,5.4*u,        0,9*u,5.6*u,           //0,1,2,3 front side
                          0,7.4*u,4*u,        0,7.6*u,4*u,        0,7.4*u,7*u,        0,7.6*u,7*u,           //4,5,6,7
                          0,6*u,13.4*u,       0,6*u,13.6*u,       0,9*u,13.4*u,       0,9*u,13.6*u,          //8,9,10,11
                          0,7.4*u,12*u,       0,7.6*u,12*u,       0,7.4*u,15*u,       0,7.6*u,15*u,          //12,13,14,15
                          -40*u,6*u,5.4*u,    -40*u,6*u,5.6*u,    -40*u,9*u,5.4*u,    -40*u,9*u,5.6*u,       //16,17,18,19 back side
                          -40*u,7.4*u,4*u,    -40*u,7.6*u,4*u,    -40*u,7.4*u,7*u,    -40*u,7.6*u,7*u,       //20,21,22,23 
                          -40*u,6*u,15.9*u,   -40*u,6*u,16.1*u,   -40*u,9*u,15.9*u,   -40*u,9*u,16.1*u,      //24,25,26,27
                          -40*u,7.4*u,14.5*u, -40*u,7.6*u,14.5*u, -40*u,7.4*u,17.5*u, -40*u,7.6*u,17.5*u,    //28,29,30,31 
                          -40*u,6*u,26.4*u,   -40*u,6*u,26.6*u,   -40*u,9*u,26.4*u,   -40*u,9*u,26.6*u,      //32,33,34,35
                          -40*u,7.4*u,25*u,   -40*u,7.6*u,25*u,   -40*u,7.4*u,28*u,   -40*u,7.6*u,28*u,      //36,37,38,39
                          -19.8*u,5*u,0,      -20.2*u,5*u,0,      -19.8*u,10*u,0,     -20.2*u,10*u,0,        //40,41,42,43 right side
                          -17.5*u,7.3*u,0,    -17.5*u,7.7*u,0,    -22.5*u,7.3*u,0,    -22.5*u,7.7*u,0,       //44,45,46,47 
                          -19.8*u,5*u,32*u,   -20.2*u,5*u,32*u,   -19.8*u,10*u,32*u,  -20.2*u,10*u,32*u,     //48,49,50,51 left side
                          -17.5*u,7.3*u,32*u, -17.5*u,7.7*u,32*u, -22.5*u,7.3*u,32*u, -22.5*u,7.7*u,32*u]);  //52,53,54,55

    let windowFrameIndexes = [0,1,2, 1,2,3, 4,5,6, 5,6,7, 8,9,10, 9,10,11, 12,13,14,
                              13,14,15, 16,17,18, 17,18,19, 20,21,22, 21,22,23,
                              24,25,26, 25,26,27, 28,29,30, 29,30,31, 32,33,34,
                              33,34,35, 36,37,38, 37,38,39, 40,41,42, 41,42,43,
                              44,45,46, 45,46,47, 48,49,50, 49,50,51, 52,53,54,
                              53,54,55];

    vertices3D.push(windowFrameVertices);
    indexes3D.push(windowFrameIndexes);

    let windowGlassVertices = 
        new Float32Array([0,6*u,4*u,          0,6*u,5.4*u,        0,7.4*u,4*u,        0,7.4*u,5.4*u,         //0,1,2,3 front right window
                          0,6*u,5.6*u,        0,6*u,7*u,          0,7.4*u,5.6*u,      0,7.4*u,7*u,           //4,5,6,7
                          0,7.6*u,4*u,        0,7.6*u,5.4*u,      0,9*u,4*u,          0,9*u,5.4*u,           //8,9,10,11
                          0,7.6*u,5.6*u,      0,7.6*u,7*u,        0,9*u,5.6*u,        0,9*u,7*u,             //12,13,14,15
                          0,6*u,12*u,         0,6*u,13.4*u,       0,7.4*u,12*u,       0,7.4*u,13.4*u,        //16,17,18,19 front left window 
                          0,6*u,13.6*u,       0,6*u,15*u,         0,7.4*u,13.6*u,     0,7.4*u,15*u,          //20,21,22,23 
                          0,7.6*u,12*u,       0,7.6*u,13.4*u,     0,9*u,12*u,         0,9*u,13.4*u,          //24,25,26,27
                          0,7.6*u,13.6*u,     0,7.6*u,15*u,       0,9*u,13.6*u,       0,9*u,15*u,            //28,29,30,31 
                          -40*u,6*u,4*u,      -40*u,6*u,5.4*u,    -40*u,7.4*u,4*u,    -40*u,7.4*u,5.4*u,     //32,33,34,35 back right window
                          -40*u,6*u,5.6*u,    -40*u,6*u,7*u,      -40*u,7.4*u,5.6*u,  -40*u,7.4*u,7*u,       //36,37,38,39
                          -40*u,7.6*u,4*u,    -40*u,7.6*u,5.4*u,  -40*u,9*u,4*u,      -40*u,9*u,5.4*u,       //40,41,42,43
                          -40*u,7.6*u,5.6*u,  -40*u,7.6*u,7*u,    -40*u,9*u,5.6*u,    -40*u,9*u,7*u,         //44,45,46,47 
                          -40*u,6*u,14.5*u,   -40*u,6*u,15.9*u,   -40*u,7.4*u,14.5*u, -40*u,7.4*u,15.9*u,    //48,49,50,51 back center window
                          -40*u,6*u,16.1*u,   -40*u,6*u,17.5*u,   -40*u,7.4*u,16.1*u, -40*u,7.4*u,17.5*u,    //52,53,54,55
                          -40*u,7.6*u,14.5*u, -40*u,7.6*u,15.9*u, -40*u,9*u,14.5*u,   -40*u,9*u,15.9*u,      //56,57,58,59
                          -40*u,7.6*u,16.1*u, -40*u,7.6*u,17.5*u, -40*u,9*u,16.1*u,   -40*u,9*u,17.5*u,      //60,61,62,63
                          -40*u,6*u,25*u,     -40*u,6*u,26.4*u,   -40*u,7.4*u,25*u,   -40*u,7.4*u,26.4*u,    //64,65,66,67 back left window
                          -40*u,6*u,26.6*u,   -40*u,6*u,28*u,     -40*u,7.4*u,26.6*u, -40*u,7.4*u,28*u,      //68,69,70,71 
                          -40*u,7.6*u,25*u,   -40*u,7.6*u,26.4*u, -40*u,9*u,25*u,     -40*u,9*u,26.4*u,      //72,73,74,75
                          -40*u,7.6*u,26.6*u, -40*u,7.6*u,28*u,   -40*u,9*u,26.6*u,   -40*u,9*u,28*u,        //76,77,78,79
                          -17.5*u,5*u,0,      -19.8*u,5*u,0,      -17.5*u,7.3*u,0,    -19.8*u,7.3*u,0,       //80,81,82,83 right side window
                          -20.2*u,5*u,0,      -22.5*u,5*u,0,      -20.2*u,7.3*u,0,    -22.5*u,7.3*u,0,       //84,85,86,87
                          -17.5*u,7.7*u,0,    -19.8*u,7.7*u,0,    -17.5*u,10*u,0,     -19.8*u,10*u,0,        //88,89,90,91
                          -20.2*u,7.7*u,0,    -22.5*u,7.7*u,0,    -20.2*u,10*u,0,     -22.5*u,10*u,0,        //92,93,94,95
                          -17.5*u,5*u,32*u,   -19.8*u,5*u,32*u,   -17.5*u,7.3*u,32*u, -19.8*u,7.3*u,32*u,    //96,97,98,99 left side window
                          -20.2*u,5*u,32*u,   -22.5*u,5*u,32*u,   -20.2*u,7.3*u,32*u, -22.5*u,7.3*u,32*u,    //100,101,102,103
                          -17.5*u,7.7*u,32*u, -19.8*u,7.7*u,32*u, -17.5*u,10*u,32*u,  -19.8*u,10*u,32*u,     //104,105,106,107
                          -20.2*u,7.7*u,32*u, -22.5*u,7.7*u,32*u, -20.2*u,10*u,32*u,  -22.5*u,10*u,32*u, ]); //108,109,110,111


    let windowGlassIndexes = [1,0,2, 1,2,3, 5,4,6, 5,6,7, 9,8,10, 9,10,11, 13,12,14,
                              13,14,15, 17,16,18, 17,18,19, 21,20,22, 21,22,23,
                              25,24,26, 25,26,27, 29,28,30, 29,30,31, 33,32,34,
                              33,34,35, 37,36,38, 37,38,39, 41,40,42, 41,42,43, 
                              45,44,46, 45,46,47, 49,48,50, 49,50,51, 53,52,54,
                              53,54,55, 57,56,58, 57,58,59, 61,60,62, 61,62,63,
                              65,64,66, 65,66,67, 69,68,70, 69,70,71, 73,72,74,
                              73,74,75, 77,76,78, 77,78,79, 81,80,82, 81,82,83,
                              85,84,86, 85,86,87, 89,88,90, 89,90,91, 93,92,94,
                              93,94,95, 97,96,98, 97,98,99, 101,100,102, 101,102,103,
                              105,104,106, 105,106,107, 109,108,110, 109,110,111];

    vertices3D.push(windowGlassVertices);
    indexes3D.push(windowGlassIndexes);

    let outerDoorVertices = 
        new Float32Array([0,0,20*u,    0,2*u,20*u,  0,0,23*u,    0,2*u,23*u, //0,1,2,3 outer door
                          0,2*u,21*u,  0,6*u,20*u,  0,6*u,21*u,  0,2*u,22*u, //4,5,6,7
                          0,6*u,23*u,  0,6*u,22*u,  0,8*u,20*u,  0,8*u,23*u, //8,9,10,11
                        ]);

    let outerDoorIndexes = [1,0,2, 1,2,3, 4,1,5, 4,5,6, 7,3,9, 3,8,9, 5,8,10, 10,11,8];

    vertices3D.push(outerDoorVertices);
    indexes3D.push(outerDoorIndexes);

    let innerDoorVertices = 
        new Float32Array([0,2*u,21*u,   0,2*u,22*u,  0,6*u,21*u,  0,6*u,22*u]);

    let innerDoorIndexes = [1,0,2, 1,2,3];

    vertices3D.push(innerDoorVertices);
    indexes3D.push(innerDoorIndexes);

    let porchVertices = 
        new Float32Array([ 12*u,0,-2*u,    12*u,-1*u,-2*u,   12*u,0,34*u,    12*u,-1*u,34*u,  //0,1,2,3 porch
                          -42*u,0,-2*u,    -42*u,-1*u,-2*u,  -42*u,0,34*u,   -42*u,-1*u,34*u, //4,5,6,7
                           0,0,-2*u,       0,0,34*u,         -40*u,0,-2*u,   -40*u,0,34*u,    //8,9,10,11
                           0,0,0,          -40*u,0,0,        0,0,32*u,       -40*u,0,32*u]);  //12,13,14,15

    let porchIndexes = [3,1,0, 0,2,3, 1,5,0, 1,4,5, 3,7,2, 2,6,7, 7,5,4, 4,6,7,
                        0,2,8, 2,8,9, 4,6,10, 6,10,11, 8,12,13, 13,10,8, 9,14,15, 
                        11,15,9];

    vertices3D.push(porchVertices);
    indexes3D.push(porchIndexes);

    let pillarsVertices = 
        new Float32Array([0,11*u,0,         0,10.5*u,0,     0,11*u,32*u,     0,10.5*u,32*u,    //0,1,2,3 below roof
                          12*u,11*u,0,      12*u,10.5*u,0,  12*u,11*u,32*u,  12*u,10.5*u,32*u, //4,5,6,7
                          12*u,11*u,3*u,    12*u,0,3*u,     12*u,11*u,5*u,   12*u,0,5*u,         //8,9,10,11 1st pillar
                          10*u,11*u,3*u,    10*u,0,3*u,     10*u,11*u,5*u,   10*u,0,5*u,         //12,13,14,15
                          12*u,11*u,11*u,   12*u,0,11*u,    12*u,11*u,13*u,  12*u,0,13*u,        //16,17,18,19 2nd pillar
                          10*u,11*u,11*u,   10*u,0,11*u,    10*u,11*u,13*u,  10*u,0,13*u,        //20,21,22,23
                          12*u,11*u,19*u,   12*u,0,19*u,    12*u,11*u,21*u,  12*u,0,21*u,        //24,25,26,27 3rd pillar
                          10*u,11*u,19*u,   10*u,0,19*u,    10*u,11*u,21*u,  10*u,0,21*u,        //28,29,30,31 
                          12*u,11*u,27*u,   12*u,0,27*u,    12*u,11*u,29*u,  12*u,0,29*u,        //32,33,34,35 4th pillar
                          10*u,11*u,27*u,   10*u,0,27*u,    10*u,11*u,29*u,  10*u,0,29*u,        //36,37,38,39
                        ]);

    let pillarsIndexes = [0,1,5, 4,5,0, 2,3,7, 6,7,2, 5,4,7, 6,7,4, 5,1,3, 7,3,5,
                          8,9,11, 10,11,8, 8,12,9, 9,13,12, 10,14,11, 11,15,14,
                          12,13,15, 14,15,12, 16,17,19, 18,19,16, 16,20,17, 17,21,20, 
                          18,22,19, 19,23,22, 20,21,23, 24,25,27, 26,27,24, 24,28,25,
                          25,29,28, 26,30,27, 27,31,30, 28,29,31, 32,33,35, 34,35,32,
                          32,36,33, 33,37,36, 34,38,35, 35,39,38, 36,37,39]
  
                        

    vertices3D.push(pillarsVertices);
    indexes3D.push(pillarsIndexes);

    for (let i = 0; i < vertices3D.length; i++) {
        let vertices = vertices3D[i];
        let indexes = indexes3D[i]
        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(indexes);
        geometry.computeVertexNormals();
        house3D.add(new THREE.Mesh(geometry, houseMaterials[i]));
    }
} 

function createMoon() {

    // Add emissivity to material
    m.lightyellow.emissive = new THREE.Color(colors.lightyellow);

    // Moon 3D (parent: scene; children: moon, moon light)
    moon3D = createObject3D(ufoScene, 5000, 5000, 5000);
    meshes.push(createMesh('sph', [d.moonR], m.lightyellow, moon3D, d.moonR, d.moonR, d.moonR));
    moonLight = new THREE.DirectionalLight(colors.lightyellow, moonLightIntensity);
    moonLight.castShadow = true;
    const value = 15000;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = value;
    moonLight.shadow.camera.left = -value;
    moonLight.shadow.camera.right = value;
    moonLight.shadow.camera.top = value;
    moonLight.shadow.camera.bottom = -value;
    moon3D.add(moonLight);
    // Moon light helper
    moonLightHelper = new THREE.CameraHelper(moonLight.shadow.camera);
    moonLightHelper.visible = false;
    ufoScene.add(moonLightHelper);
}

////////////
/* UPDATE */
////////////

function update(delta) {

    // Update cameras if window has been resized
    if (windowResized) {
        updatePerspectiveCamera(cameras.persp);
        windowResized = false;
    }
    rotateUFO(rotationSpeed, delta);
    for (let k in keys) {
        if (keys[k] === true) {
            switch (k) {
                // Texture Generation Controls (keys 1, 2)
                case "49": // 1
                    debug('1');
                    const terrainTexture = new THREE.CanvasTexture(generateTerrainTexture(fieldTextureSize));
                    terrain.material.map = terrainTexture;
                    keys[k] = false;
                    break;
                case "50": // 2
                    debug('2');
                    const skyTexture = new THREE.CanvasTexture(generateSkyTexture(skyTextureSize));
                    skydome.material.map = skyTexture;
                    keys[k] = false;
                    break;
                // Material Update Controls (keys Q, W, E, R)
                case '81': // Q
                case '113': // q
                    debug('Q');
                    updateMaterials('lambert');
                    keys[k] = false;
                    break;
                case '87': // W
                case '119': // w
                    debug('W');
                    updateMaterials('phong');
                    keys[k] = false;
                    break;
                case '69': // E
                case '101': // e
                    debug('E');
                    updateMaterials('toon');
                    keys[k] = false;
                    break;
                case "82": // R
                case "114": // r
                    debug('R');
                    updateMaterials('basic');
                    keys[k] = false;
                    break;
                // Light Controls (keys D, P, S)
                case '68': // D
                case '100': // d
                    debug('D');
                    moonLight.intensity = moonLight.intensity === 0 ? moonLightIntensity : 0;
                    keys[k] = false;
                    break;
                case '80': // P
                case '112': // p
                    debug('P');
                    spotLight.intensity = spotLight.intensity === 0 ? spotLightIntensity : 0;
                    keys[k] = false;
                    break;
                case '83': // S
                case '115': // s
                    debug('S');
                    for (let light of pointLights)
                        light.intensity = light.intensity === 0 ? pointLightIntensity : 0;
                    keys[k] = false;
                    break;
                // Camera Controls (keys C)
                case '67': // C
                case '99': // c
                    debug('C');
                    controls.enabled = !controls.enabled;
                    controls.object = camera;
                    controls.update();
                    keys[k] = false;
                    break;
                // Visual Representation Controls (keys 7, 8, 9)
                case '55': // 7
                    debug('7');
                    edgesMaterial.visible = !edgesMaterial.visible;
                    keys[k] = false;
                    break;
                case '56': // 8
                    debug('8');
                    pointLightHelper.visible = !pointLightHelper.visible;
                    spotLightHelper.visible = !spotLightHelper.visible;
                    moonLightHelper.visible = !moonLightHelper.visible;
                    keys[k] = false;
                    break;
                case '57': // 9
                    debug('9');
                    if (!isAxesHelperVisible) {
                        ufoScene.add(axesHelper);
                        isAxesHelperVisible = true;
                    } else {
                        ufoScene.remove(axesHelper);
                        isAxesHelperVisible = false;
                    }
                    keys[k] = false;
                    break;
                // UFO Movement Controls (keys left, up, right, down)
                case '37': // left
                    moveUFO('x', -movementSpeed, delta);
                    break;
                case '38': // up
                    moveUFO('z', -movementSpeed, delta);
                    break;
                case '39': // right
                    moveUFO('x', movementSpeed, delta);
                    break;
                case '40': // down
                    moveUFO('z', movementSpeed, delta);
                    break;
                default:
                    break;
            }
        }
    }
}

/////////////
/* DISPLAY */
/////////////

function render() {

    ufoRenderer.render(ufoScene, camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////

function init() {

    // Create renderer
    ufoRenderer = new THREE.WebGLRenderer({ antialias: true });
    ufoRenderer.setPixelRatio(window.devicePixelRatio);
    ufoRenderer.setSize(window.innerWidth, window.innerHeight);
    ufoRenderer.setClearColor(colors.fog, 1);
    ufoRenderer.xr.enabled = true;
    ufoRenderer.shadowMap.enabled = true;
    ufoRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(ufoRenderer.domElement);
    document.body.appendChild(VRButton.createButton(ufoRenderer));

    // Create all cameras and set default camera
    cameras.persp = createPerspectiveCamera(750, 750, 750, 0, 0, 0, 1, 50000, 70);
    camera = cameras.persp;

    // Create camera controls and disable them and their arrow keys and debug mode
    controls = new THREE.OrbitControls(camera, ufoRenderer.domElement);
    controls.keys = {LEFT: null, UP: null, RIGHT: null, BOTTOM: null};
    controls.enabled = false;
    debugMode = true;

    // Create Axes Helper and Rotation Axes to be used
    axesHelper = new THREE.AxesHelper(750);
    rAxes.x = new THREE.Vector3(1, 0, 0);
    rAxes.y = new THREE.Vector3(0, 1, 0);
    rAxes.z = new THREE.Vector3(0, 0, 1);

    // Create scene, keep track of time and add event listeners
    createScene();
    previousTime = performance.now();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('keyup', onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////

function animate() {

    requestAnimationFrame(animate);
    ufoRenderer.setAnimationLoop(render);

    currentTime = performance.now();
    let delta = (currentTime - previousTime) / 20;
    previousTime = currentTime;
    update(delta);
    render();
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////

function onResize() {

    ufoRenderer.setSize(window.innerWidth, window.innerHeight);
    if (window.innerHeight > 0 && window.innerWidth > 0)
        windowResized = true;
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////

function onKeyDown(e) {

    keys[e.keyCode] = true;
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////

function onKeyUp(e) {

    keys[e.keyCode] = false;
}

////////////////////////
/* MOVEMENT FUNCTIONS */
////////////////////////

function moveUFO(axis, speed, delta) {

    let adjustment;
    if (axis === 'x')
        adjustment = new THREE.Vector3(speed * delta, 0, 0);
    else if (axis === 'z')
        adjustment = new THREE.Vector3(0, 0, speed * delta);
    body3D.position.add(adjustment);
}

function rotateUFO(rotationSpeed, delta) {

    body3D.rotateOnWorldAxis(rAxes.y, rotationSpeed * delta);
}

////////////////////
/* DEBUG FUNCTION */
////////////////////

function debug(text) {

    if (debugMode)
        console.log(text);
}
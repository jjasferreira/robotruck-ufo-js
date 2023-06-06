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

let currentMaterial;

// Cameras
let camera;
const cameras = { persp: null };
let windowResized = false;
let controls;

// Keys
let keys = {};

let meshes = [];

// Colors, materials and geometry edges
const colors = {
    fog: 0x656597, darkgrey: 0x404040, lightblue: 0x3492da, darkorange: 0xad5b28, bistre: 0x302514, darkgreen: 0x035f53,
    lightyellow: 0xffffb3, goldenyellow: 0xf7d842, grey: 0x999999
};
let m = {};
let edgesMaterial;

// Axes Helper and all Rotation Axes
let axesHelper;
let isAxesHelperVisible = false;
let rAxes = {};

// Terrain's variables
let terrain, disMap, disScale, terrainTexture;

// UFO's Object3Ds
let body3D, cockpit3D, baubles3D, cylinder3D;
let pointLights = [];

// Movements and Rotations
let movementSpeed = 40;
let rotationSpeed = 0.04;

// CorkTree's Object3Ds
let trunk3D, branch3D, trunkCrown3D, branchCrown3D;

// Moon's Object3Ds
let moon3D;

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
    spotLight, spotLightIntensity = 4.5, spotLightHelper,
    moonLight, moonLightIntensity = 0.5, moonLightHelper;

//////////////////
/* CREATE SCENE */
//////////////////

function createScene() {

    ufoScene = new THREE.Scene();
    ufoScene.fog = new THREE.FogExp2(colors.fog, 0.00005);

    createAmbientLight(0xffffff, 0.1);

    currentMaterial = 'phong';
    createMaterials(currentMaterial);
    createTerrain();
    createSkydome();
    createUFO(-1000, 2500, 500);
    createCorkTree(500, 50, -500, 1);
    createCorkTree(2000, 50, -500, 1.2);
    createCorkTree(3500, 50, -500, 0.8);
    createMoon();
    //createHouse();
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

function createMaterials(type) {

    switch (type) {
        case 'standard':
            for (const [name, color] of Object.entries(colors))
                m[name] = new THREE.MeshStandardMaterial({ color: color, wireframe: false });
            m.cockpitMaterial = new THREE.MeshStandardMaterial({ color: colors.lightblue, wireframe: false, transparent: true, opacity: 0.5 });
            m.baubleMaterial = new THREE.MeshStandardMaterial({ color: colors.darkorange, wireframe: false, transparent: true, opacity: 0.5 });
            break;
        case 'lambert':
            for (const [name, color] of Object.entries(colors))
                m[name] = new THREE.MeshLambertMaterial({ color: color, wireframe: false });
            m.cockpitMaterial = new THREE.MeshLambertMaterial({ color: colors.lightblue, wireframe: false, transparent: true, opacity: 0.5 });
            m.baubleMaterial = new THREE.MeshLambertMaterial({ color: colors.darkorange, wireframe: false, transparent: true, opacity: 0.5 });
            break;
        case 'phong':
            for (const [name, color] of Object.entries(colors))
                m[name] = new THREE.MeshPhongMaterial({ color: color, wireframe: false });
            m.cockpitMaterial = new THREE.MeshPhongMaterial({ color: colors.lightblue, wireframe: false, transparent: true, opacity: 0.5 });
            m.baubleMaterial = new THREE.MeshPhongMaterial({ color: colors.darkorange, wireframe: false, transparent: true, opacity: 0.5 });
            break;
        case 'cartoon':
            for (const [name, color] of Object.entries(colors))
                m[name] = new THREE.MeshToonMaterial({ color: color, wireframe: false });
            m.cockpitMaterial = new THREE.MeshToonMaterial({ color: colors.lightblue, wireframe: false, transparent: true, opacity: 0.5 });
            m.baubleMaterial = new THREE.MeshToonMaterial({ color: colors.darkorange, wireframe: false, transparent: true, opacity: 0.5 });
            break;
    }
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
                terrain.material = new THREE.MeshLambertMaterial({ color: colors.fog, displacementMap: disMap,
                    displacementScale: disScale, side: THREE.DoubleSide, map: terrainTexture });
                break;
            case 'phong':
                mesh.material = new THREE.MeshPhongMaterial({ color: mc, wireframe: mw, transparent: mt, opacity: mo });
                terrain.material = new THREE.MeshPhongMaterial({ color: colors.fog, displacementMap: disMap,
                    displacementScale: disScale, side: THREE.DoubleSide, map: terrainTexture });
                break;
            case 'toon':
                mesh.material = new THREE.MeshToonMaterial({ color: mc, wireframe: mw, transparent: mt, opacity: mo });
                terrain.material = new THREE.MeshToonMaterial({ color: colors.fog, displacementMap: disMap,
                    displacementScale: disScale, side: THREE.DoubleSide, map: terrainTexture });
                break;
            case 'basic':
                mesh.material = new THREE.MeshBasicMaterial({ color: mc, wireframe: mw, transparent: mt, opacity: mo });
                terrain.material = new THREE.MeshBasicMaterial({ color: colors.fog, displacementMap: disMap,
                    displacementScale: disScale, side: THREE.DoubleSide, map: terrainTexture });
        }
    }
    currentMaterial = type;
}

function createTerrain() {

    const terrainGeometry = new THREE.PlaneGeometry(25000, 25000, 100, 100);

    let image = new Image();
    image.src = "textures/field.png";
    image.onload = function () {
        const height = image.height;
        const width = image.width;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width * 10;
        canvas.height = height * 10;

        // Since three js doesn't allow textures and heightmaps to have independent repeat settings, we are using a canvas
        // to draw the texture as intended, which has the added benefit of allowing us to rotate the textures, making them
        // even more seamless
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                // Add random rotation in multiples of 90 degrees and translation
                const rotation = (Math.floor(Math.random() * 4)) * 90;
                ctx.save();
                // Translate to the center of the image and apply the rotation
                ctx.translate((x * width) + (width / 2), (y * height) + (height / 2));
                ctx.rotate((Math.PI / 180) * rotation);
                // Draw the image and restore the saved state of the context
                ctx.drawImage(image, -(width / 2), -(height / 2), width, height);
                ctx.restore();
            }
        }
        terrainTexture = new THREE.CanvasTexture(canvas);
        disMap = new THREE.TextureLoader().setPath("textures").load("/heightmap.png");
        disScale = 500;

        const terrainMaterial = new THREE.MeshPhongMaterial({ color: colors.fog, displacementMap: disMap,
            displacementScale: disScale, side: THREE.DoubleSide, map: terrainTexture });

        terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrain.rotation.x = -Math.PI/2;
        terrain.receiveShadow = true;
        ufoScene.add(terrain);
    }
}

function createSkydome() {

    const skydomeGeometry = new THREE.SphereGeometry(12500, 64, 64);
    const skydomeTexture = new THREE.TextureLoader().setPath('textures').load('/sky.png');
    const skydomeMaterial = new THREE.MeshBasicMaterial({ map: skydomeTexture, side: THREE.DoubleSide });
    const skydome = new THREE.Mesh(skydomeGeometry, skydomeMaterial);
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
                // Camera Controls (keys 1, C)
                case '49': // 1
                    console.log('1');
                    camera = cameras.persp;
                    keys[k] = false;
                    break;
                case '67': // C
                case '99': // c
                    console.log('C');
                    controls.enabled = !controls.enabled;
                    controls.object = camera;
                    controls.update();
                    keys[k] = false;
                    break;
                // Visual Representation Controls (keys 7, 8, 9)
                case '55': // 7
                    console.log('7');
                    edgesMaterial.visible = !edgesMaterial.visible;
                    keys[k] = false;
                    break;
                case '56': // 8
                    console.log('8');
                    pointLightHelper.visible = !pointLightHelper.visible;
                    spotLightHelper.visible = !spotLightHelper.visible;
                    moonLightHelper.visible = !moonLightHelper.visible;
                    keys[k] = false;
                    break;
                case '57': // 9
                    console.log('9');
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
                // Light Controls (keys D, P, S)
                case '68': // D
                case '100': // d
                    console.log('D');
                    moonLight.intensity = moonLight.intensity === 0 ? moonLightIntensity : 0;
                    keys[k] = false;
                    break;
                case '80': // P
                case '112': // p
                    console.log('P');
                    spotLight.intensity = spotLight.intensity === 0 ? spotLightIntensity : 0;
                    keys[k] = false;
                    break;
                case '83': // S
                case '115': // s
                    console.log('S');
                    for (let light of pointLights)
                        light.intensity = light.intensity === 0 ? pointLightIntensity : 0;
                    keys[k] = false;
                    break;
                // Material Controls (keys Q, W, E, R)
                case '81': // Q
                case '113': // q
                    console.log('Q');
                    updateMaterials('lambert');
                    keys[k] = false;
                    break;
                case '87': // W
                case '119': // w
                    console.log('W');
                    updateMaterials('phong');
                    keys[k] = false;
                    break;
                case '69': // E
                case '101': // e
                    console.log('E');
                    updateMaterials('toon');
                    keys[k] = false;
                    break;
                case "82": // R
                case "114": // r
                    console.log('R');
                    updateMaterials('basic');
                    keys[k] = false;
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

    // Create camera controls and disable them and their arrow keys
    controls = new THREE.OrbitControls(camera, ufoRenderer.domElement);
    controls.keys = {LEFT: null, UP: null, RIGHT: null, BOTTOM: null};
    controls.enabled = true;

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
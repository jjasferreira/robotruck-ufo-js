'use strict';   // Applies to all script

/*
    *  UFO - key bindings:
    * - '9' - toggle axes helper visibility
 */

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let ufoScene, ufoRenderer;

let previousTime = 0, currentTime = 0;

let currentMaterial;

// Cameras
let camera;
const cameras = {persp: null, stereo: null};
let windowResized = false;
let controls;

// Keys
let keys = {};

let objects = [];

const textures = { // TODO remove this?
    field: 'field.png', sky: 'sky.png',
};

// Colors, materials and geometry edges
const colors = {
    darkgrey: 0x404040, lightblue: 0x3492da, darkorange: 0xad5b28, bistre: 0x302514, darkgreen: 0x035f53,
    lightyellow: 0xffffb3, goldenyellow: 0xf7d842,
};
let m = {};
let edgesMaterial;

// Axes Helper and all Rotation Axes
let axesHelper;
let isAxesHelperVisible = false;
let rAxes = {};

let groundTexture, groundGeometry, ground, disMap;

// UFO's Object3Ds
let ufoBody3D, ufoCockpit3D, ufoBauble3D, ufoQuantumPhotonicResonator3D;
let pointlights = [];

let movementSpeed = 10;
let rotationSpeed = 0.04;

// CorkTree's Object3Ds
let trunk3D, branch3D, trunkCrown3D, branchCrown3D;

// Moon's Object3Ds
let moon3D;

// UFO's, CorkTree's and Moon's dimensions
const d = {
    bodyRadius: 800,
    lowTrunkBotR: 75, lowTrunkTopR: 50, lowTrunkH: 800, uppTrunkBotR: 60, uppTrunkTopR: 50, uppTrunkH: 200,
    lowBranchBotR: 50, lowBranchTopR: 35, lowBranchH: 300, uppBranchBotR: 45, uppBranchTopR: 35, uppBranchH: 200,
    trunkCrownR: 400, branchCrownR: 250,
    moonR: 200
};

// UFO's and Moon's lights
let spotLight, moonLight;

//////////////////
/* CREATE SCENE */
//////////////////

function createScene() {

    ufoScene = new THREE.Scene();
    ufoScene.fog = new THREE.FogExp2(0x656597, 0.00005);

    createAmbientLight(0xffffff, 0.1);

    currentMaterial = 'phong';
    createMaterials(currentMaterial);
    createTerrain();
    createFlyingSaucer();
    createCorkTree(500, 50, -500, 1);
    createCorkTree(2000, 50, -500, 1.2);
    createCorkTree(3500, 50, -500, 0.8);
    createMoon();
    createSkydome();
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

///////////////////////
/* CREATE COMPONENTS */
///////////////////////

function createMaterials(type) {
    // type can be lambert, phong or cartoon

    switch (type) {
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

    // Boxes and Cylinders materials
    /*for (const [name, color] of Object.entries(colors)) {
        //m[name] = new THREE.MeshBasicMaterial({ color: color, wireframe: false });
        m[name] = new THREE.MeshStandardMaterial({ color: color, wireframe: false });
    }*/
    // Edges material
    edgesMaterial = new THREE.LineBasicMaterial({ color: colors.black, visible: false });
}

function createTerrain() {
    groundGeometry = new THREE.PlaneGeometry(25000, 25000, 100, 100);

    let image = new Image();
    image.src = "../textures/field.png";
    image.onload = function () {
        const height = image.height;
        const width = image.width;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = width * 10;
        canvas.height = height * 10;
        // draw the image scaled down by 10 in a 10x10 tiled pattern on the canvas

        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                // rotation and translation magic to draw each tile in the right place
                const rotation = (Math.floor(Math.random() * 4)) * 90; // Random rotation in multiples of 90 degrees
                context.save(); // Save the current state of the context
                context.translate((x * width) + (width / 2), (y * height) + (height / 2)); // Translate to the center of the image
                context.rotate((Math.PI / 180) * rotation); // Apply the rotation
                context.drawImage(image, -(width / 2), -(height / 2), width, height); // Draw the image
                context.restore(); // Restore the saved state of the context
            }
        }

        // load the texture from the canvas
        groundTexture = new THREE.CanvasTexture(canvas);

        disMap = new THREE.TextureLoader().setPath("../textures").load("/heightmap.png");

        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x656597,
            displacementMap: disMap,
            displacementScale: 500,
            side: THREE.DoubleSide,
            map: groundTexture
        });

        ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;


        ground.receiveShadow = true;
        ufoScene.add(ground);
    }
}

function createSkydome() {

    const skydomeGeometry = new THREE.SphereGeometry(12500, 64, 64);
    const skydomeTexture = new THREE.TextureLoader().setPath('../textures').load('/sky.png');
    const skydomeMaterial = new THREE.MeshBasicMaterial({ map: skydomeTexture, side: THREE.DoubleSide });
    const skydome = new THREE.Mesh(skydomeGeometry, skydomeMaterial);
    ufoScene.add(skydome);
}

function createFlyingSaucer() {
    ufoBody3D = createObject3D(ufoScene, -1000, 2000, 500);
    createGeometry('ell', [d.bodyRadius, 3/8, 1, 1], m.darkgrey, ufoBody3D, 0, 0, 0, rAxes.z, Math.PI/2);

    ufoCockpit3D = createObject3D(ufoBody3D, 0, 0, 0);
    createGeometry('sph', [d.bodyRadius / 2], m.cockpitMaterial, ufoCockpit3D, 0, 100, 0);

    ufoBauble3D = createObject3D(ufoBody3D, 0, 0, 0);
    //place the baubles radially in increments of 30 degrees
    for (let i = 0; i < 12; i++) {
        createGeometry('sph', [d.bodyRadius / 10], m.baubleMaterial, ufoBauble3D, d.bodyRadius * 0.8 * Math.sin(i * Math.PI / 6), -140, d.bodyRadius * 0.8 * Math.cos(i * Math.PI / 6));
        //add point light to each bauble
        let pointLight = new THREE.PointLight(colors.lightyellow, 1, 1000);
        pointLight.intensity = 1;
        //pointLight.position.set(0,0,0);
        pointLight.position.set(d.bodyRadius * 0.8 * Math.sin(i * Math.PI / 6), -200, d.bodyRadius * 0.8 * Math.cos(i * Math.PI / 6));
        //add a lens flare to each bauble
        /*let textureLoader = new THREE.TextureLoader();
        let textureFlare0 = textureLoader.load('../images/cat.png');
        let lensFlare = new THREE.LensFlare(textureFlare0, 100, 0.0, THREE.AdditiveBlending, colors.lightyellow);
        pointLight.add(lensFlare);
        */
        //add point light helper
        let pointLightHelper = new THREE.PointLightHelper(pointLight, 10);
        pointLightHelper.visible = true;
        ufoScene.add(pointLightHelper);
        pointlights.push(pointLight);
        ufoBauble3D.add(pointLight);

    }

    ufoQuantumPhotonicResonator3D = createObject3D(ufoBody3D, 0, 0, 0);
    createGeometry('cyl', [d.bodyRadius / 10, d.bodyRadius / 10, d.bodyRadius / 2], m.goldenyellow, ufoQuantumPhotonicResonator3D, 0, -200, 0);

    // add spherical cat (meme)
    let catPassenger = createObject3D(ufoBody3D, 0, 0, 0);
    //get cat.png from the images folder
    let catTexture = new THREE.TextureLoader().setPath('../textures').load('/cat.png');
    let catMaterial = new THREE.MeshBasicMaterial({ map: catTexture, wireframe: false });
    createGeometry('sph', [d.bodyRadius / 10], catMaterial, ufoCockpit3D, 0, 400, 0);

    // create light target that is straight below the ufo relative to its position
    let lightTarget = createObject3D(ufoBody3D, 0, -1000, 0);

    // add spotlight to quantum photonic resonator pointing down
    spotLight = new THREE.SpotLight(colors.white, 1);
    spotLight.position.set(0, -400, 0);
	spotLight.intensity = 3;
    spotLight.penumbra = 0.1;
    spotLight.castShadow = true;
    spotLight.distance = 3000;
    spotLight.target = lightTarget;
    spotLight.target.updateMatrixWorld();

    let lightHelper = new THREE.SpotLightHelper(spotLight);
    lightHelper.visible = true;
    ufoScene.add( lightHelper );

    ufoBody3D.add(spotLight);
    // add object3d and color of material to objects array
    objects.push([ufoBody3D, colors.darkgrey]);
    objects.push([ufoQuantumPhotonicResonator3D, colors.goldenyellow]);

}

function createCorkTree(x, y, z, s) {

    // Trunk 3D (parent: scene; children: lower trunk, upper trunk, trunk crown 3D, branch 3D)
    trunk3D = createObject3D(ufoScene, x, y, z);
    createGeometry('cyl', [s*d.lowTrunkTopR, s*d.lowTrunkBotR, s*d.lowTrunkH], m.darkorange, trunk3D, 0, s*d.lowTrunkH/2, 0);
    createGeometry('cyl', [s*d.uppTrunkTopR, s*d.uppTrunkBotR, s*d.uppTrunkH], m.bistre, trunk3D, 0, s*(d.lowTrunkH+d.uppTrunkH/2), 0);
    // Trunk Crown 3D (parent: trunk 3D; children: trunk crown)
    trunkCrown3D = createObject3D(trunk3D, 0, s*(d.lowTrunkH+d.uppTrunkH), 0);
    createGeometry('ell', [s*d.trunkCrownR, 1, 0.5, 1], m.darkgreen, trunkCrown3D, 0, s*d.trunkCrownR/4, 0);
    // Branch 3D (parent: trunk 3D, children: lower branch, upper branch, branch crown 3D)
    branch3D = createObject3D(trunk3D, 0, 450, 0);
    createGeometry('cyl', [s*d.lowBranchTopR, s*d.lowBranchBotR, s*d.lowBranchH], m.darkorange, branch3D, 0, s*d.lowBranchH/2, 0);
    createGeometry('cyl', [s*d.uppBranchTopR, s*d.uppBranchBotR, s*d.uppBranchH], m.bistre, branch3D, 0, s*(d.lowBranchH+d.uppBranchH/2), 0);
    // Branch Crown 3D (parent: branch 3D; children: branch crown)
    branchCrown3D = createObject3D(branch3D, 0, s*(d.lowBranchH+d.uppBranchH), 0);
    createGeometry('ell', [s*d.branchCrownR, 1, 0.5, 1], m.darkgreen, branchCrown3D, 0, s*d.branchCrownR/4, 0);

    // Object3D's Final Rotations
    trunk3D.rotateOnWorldAxis(rAxes.y, getRandomAngle(0, 2*Math.PI));
    trunk3D.rotateOnWorldAxis(rAxes.x, getRandomAngle(-Math.PI/16, Math.PI/16));
    trunk3D.rotateOnWorldAxis(rAxes.z, getRandomAngle(-Math.PI/5, 0));
    branch3D.rotateOnWorldAxis(rAxes.x, getRandomAngle(-Math.PI/8, Math.PI/8));
    branch3D.rotateOnWorldAxis(rAxes.z, getRandomAngle(Math.PI/6, Math.PI/3));
    trunkCrown3D.rotateOnWorldAxis(rAxes.x, getRandomAngle(-Math.PI/16, Math.PI/16));
    trunkCrown3D.rotateOnWorldAxis(rAxes.z, getRandomAngle(-Math.PI/16, Math.PI/16));
    branchCrown3D.rotateOnWorldAxis(rAxes.x, getRandomAngle(-Math.PI/16, Math.PI/16));
    branchCrown3D.rotateOnWorldAxis(rAxes.z, getRandomAngle(-Math.PI/16, Math.PI/16));

    objects.push([trunk3D, colors.darkorange]);
    objects.push([trunkCrown3D, colors.darkgreen]);
    objects.push([branch3D, colors.darkorange]);
    objects.push([branchCrown3D, colors.darkgreen]);

    function getRandomAngle(min, max) {
        return Math.random() * (max - min) + min;
    }
}

function createMoon() {

    // Moon 3D (parent: scene; children: moon)
    moon3D = createObject3D(ufoScene, 5000, 5000, 5000);
    createGeometry('sph', [d.moonR], m.lightyellow, moon3D, d.moonR, d.moonR, d.moonR);

    // Moon's directional light and shadow properties
    moonLight = new THREE.DirectionalLight(m.lightyellow, 2);
    moonLight.castShadow = true;
    const value = 15000;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = value;
    moonLight.shadow.camera.left = -value;
    moonLight.shadow.camera.right = value;
    moonLight.shadow.camera.top = value;
    moonLight.shadow.camera.bottom = -value;
    moon3D.add(moonLight);

    // TODO: remove Helper
    const helper = new THREE.CameraHelper(moonLight.shadow.camera);
    ufoScene.add(helper);
}

////////////
/* UPDATE */
////////////

/*
- D - toggle da luz da lua
- P - toggle da spotlight
- S - toggle das luzes pontuais
- Q - Tipo de sombreamento para gourard
- W - Phong
- E - Cartoon shader
- R - Desativar iluminação
- 1 - VR
*/
function update(delta) {

    // Update cameras if window has been resized
    if (windowResized) {
        updatePerspectiveCamera(cameras.persp);
        updateStereoCamera(cameras.stereo);
        windowResized = false;
    }
    rotateSaucer(rotationSpeed, delta);
    for (let k in keys) {
        if (keys[k] === true) {
            switch (k) {
                // Camera Controls (keys 1, 2, C)
                case '49': // 1
                    console.log('1');
                    camera = cameras.persp;
                    keys[k] = false;
                    break;
                case '50': // 2
                    console.log('2');
                    camera = cameras.stereo;
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
                // Visual Representation Controls (keys 9)
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
                    moveSaucer('x', -movementSpeed, delta);
                    break;
                case '38': // up
                    moveSaucer('z', -movementSpeed, delta);
                    break;
                case '39': // right
                    moveSaucer('x', movementSpeed, delta);
                    break;
                case '40': // down
                    moveSaucer('z', movementSpeed, delta);
                    break;
                case '68': // D
                case '100': // d
                    console.log('D');
                    moonLight.intensity = moonLight.intensity === 0 ? 2 : 0;
                    keys[k] = false;
                    break;
                case '80': // P
                case '112': // p
                    console.log('P');
                    spotLight.intensity = spotLight.intensity === 0 ? 3 : 0;
                    keys[k] = false;
                    break;
                case '83': // S
                case '115': // s
                    console.log('S');
                    togglePointLights();
                    keys[k] = false;
                    break;
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

    if (camera instanceof THREE.PerspectiveCamera)
        ufoRenderer.render(ufoScene, camera);
    else if (camera instanceof THREE.StereoCamera) {
        ufoRenderer.setScissorTest(true);
        ufoRenderer.setScissor(0, 0, window.innerWidth / 2, window.innerHeight);
        ufoRenderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight);
        ufoRenderer.render(ufoScene, camera.cameraL);
        ufoRenderer.setScissor(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
        ufoRenderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
        ufoRenderer.render(ufoScene, camera.cameraR);
        ufoRenderer.setScissorTest(false);
    }
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////

function init() {

    // Create renderer
    ufoRenderer = new THREE.WebGLRenderer({ antialias: true });
    ufoRenderer.setSize(window.innerWidth, window.innerHeight);
    ufoRenderer.setPixelRatio(window.devicePixelRatio);
    ufoRenderer.setClearColor(0x656597, 1);
    ufoRenderer.vr.enabled = true;
    ufoRenderer.shadowMap.enabled = true;
    ufoRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(ufoRenderer.domElement);

    // Create all cameras and set default camera
    cameras.persp = createPerspectiveCamera(750, 750, 750, 0, 0, 0, 1, 50000, 70);
    cameras.stereo = createStereoCamera(0.064, 1, 50000, 70);
    camera = cameras.persp;

    // Create camera controls and disable them and their arrow keys
    controls = new THREE.OrbitControls(camera, ufoRenderer.domElement);
    controls.keys = {LEFT: null, UP: null, RIGHT: null, BOTTOM: null};
    controls.enabled = false;

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

    switch (e.keyCode) {
        default:
            keys[e.keyCode] = true;
    }

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

function moveSaucer(axis, speed, delta) {

    let adjustment;
    if (axis === 'x')
        adjustment = new THREE.Vector3(speed * delta, 0, 0);
    else if (axis === 'z')
        adjustment = new THREE.Vector3(0, 0, speed * delta);
    ufoBody3D.position.add(adjustment);
}

function togglePointLights() {
    for (let i = 0; i < pointlights.length; i++) {
        console.log(pointlights[i].intensity);
        pointlights[i].intensity = pointlights[i].intensity === 0 ? 1 : 0;
    }
}

function updateMaterials(type) {
    if (currentMaterial === type) return;
    // iterate through objects vector and update their materials
    for (let i = 0; i < objects.length; i++) {
        const children = objects[i][0].children;
        switch (type) {
            case 'lambert':
                for (let j = 0; j < children.length; j++) {
                    children[j].material = new THREE.MeshLambertMaterial({color: objects[i][1], wireframe: false});
                }
                ground.material = new THREE.MeshLambertMaterial({
                    color: 0x656597,
                    displacementMap: disMap,
                    displacementScale: 500,
                    side: THREE.DoubleSide,
                    map: groundTexture
                });
                break;
            case 'phong':
                for (let j = 0; j < children.length; j++) {
                    children[j].material = new THREE.MeshPhongMaterial({color: objects[i][1], wireframe: false});
                }
                ground.material = new THREE.MeshPhongMaterial({
                    color: 0x656597,
                    displacementMap: disMap,
                    displacementScale: 500,
                    side: THREE.DoubleSide,
                    map: groundTexture
                });
                break;
            case 'toon':
                for (let j = 0; j < children.length; j++) {
                    children[j].material = new THREE.MeshToonMaterial({color: objects[i][1], wireframe: false});
                }
                ground.material = new THREE.MeshToonMaterial({
                    color: 0x656597,
                    displacementMap: disMap,
                    displacementScale: 500,
                    side: THREE.DoubleSide,
                    map: groundTexture
                });
                break;
            case 'basic':
                for (let j = 0; j < children.length; j++) {
                    children[j].material = new THREE.MeshBasicMaterial({color: objects[i][1], wireframe: false});
                }
                ground.material = new THREE.MeshBasicMaterial({
                    color: 0x656597,
                    displacementMap: disMap,
                    displacementScale: 500,
                    side: THREE.DoubleSide,
                    map: groundTexture
                });
        }
        /*ufoCockpit3D.material = new THREE.MeshToonMaterial({color: colors.lightblue, wireframe: false, transparent: true, opacity: 0.5});
                ufoBauble3D.material = new THREE.MeshToonMaterial({color: colors.darkorange, wireframe: false, transparent: true, opacity: 0.5});
                console.log("after", objects[i][0].material);
                */
    }
    const cockpitChildren = ufoCockpit3D.children;
    const baubleChildren = ufoBauble3D.children;
    console.log("lengths", cockpitChildren.length, baubleChildren.length);
    switch (type) {
        case 'lambert':
            cockpitChildren[0].material = new THREE.MeshLambertMaterial({ color: colors.lightblue, wireframe: false, transparent: true, opacity: 0.5 });
            for (let j = 0; j < baubleChildren.length; j++) {
                baubleChildren[j].material = new THREE.MeshLambertMaterial({ color: colors.darkorange, wireframe: false, transparent: true, opacity: 0.5 });
            }
            break;
        case 'phong':
            cockpitChildren[0].material = new THREE.MeshPhongMaterial({ color: colors.lightblue, wireframe: false, transparent: true, opacity: 0.5 });
            for (let j   = 0; j < baubleChildren.length; j++) {
                baubleChildren[j].material = new THREE.MeshPhongMaterial({ color: colors.darkorange, wireframe: false, transparent: true, opacity: 0.5 });
            }
            break;
        case 'toon':
            cockpitChildren[0].material = new THREE.MeshToonMaterial({ color: colors.lightblue, wireframe: false, transparent: true, opacity: 0.5 });
            for (let j = 0; j < baubleChildren.length; j++) {
                baubleChildren[j].material = new THREE.MeshToonMaterial({ color: colors.darkorange, wireframe: false, transparent: true, opacity: 0.5 });
            }
            break;
        case 'basic':
            cockpitChildren[0].material = new THREE.MeshBasicMaterial({ color: colors.lightblue, wireframe: false, transparent: true, opacity: 0.5 });
            for (let j = 0; j < baubleChildren.length; j++) {
                baubleChildren[j].material = new THREE.MeshBasicMaterial({ color: colors.darkorange, wireframe: false, transparent: true, opacity: 0.5 });
            }
            break;
    }
    currentMaterial = type;
}

function rotateSaucer(rotationSpeed, delta) {

    ufoBody3D.rotateOnWorldAxis(rAxes.y, rotationSpeed * delta);
}
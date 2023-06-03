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

let camera;
let controls;

let keys = {};

const textures = { // TODO remove this?
    terrain: "textures/texture.png", moon: "textures/moon.png",
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

// UFO's Object3Ds
let ufoBody3D, ufoCockpit3D, ufoBauble3D, ufoQuantumPhotonicResonator3D;

let movementSpeed = 10;
let rotationSpeed = 0.04;

// CorkTree's Object3Ds
let trunk3D, branch3D, trunkCrown3D, branchCrown3D;

// Moon's Object3Ds
let moon3D;

// UFO's, CorkTree's and Moon's dimensions
const d = {
    bodyRadius: 800,
    lowTrunkBotR: 75, lowTrunkTopR: 50, lowTrunkH: 700, uppTrunkBotR: 60, uppTrunkTopR: 50, uppTrunkH: 200,
    lowBranchBotR: 50, lowBranchTopR: 35, lowBranchH: 300, uppBranchBotR: 45, uppBranchTopR: 35, uppBranchH: 200,
    trunkCrownR: 400, branchCrownR: 250,
    moonR: 200
};

//////////////////
/* CREATE SCENE */
//////////////////

function createScene() {

    ufoScene = new THREE.Scene();
    ufoScene.fog = new THREE.FogExp2(0x656597, 0.00005);

    createAmbientLight(0xffffff, 1);

    createMaterials();
    createTerrain();
    createFlyingSaucer();
    createCorkTree(500, 0, -500, 1);
    createCorkTree(2000, 0, -500, 1.2);
    createCorkTree(3500, 0, -500, 0.8);
    createMoon();
    createSkydome();
    //createHouse();
}


/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

// TODO: remove function, it is just so that we can see what is rendered
function createAmbientLight(color, intensity) {

    const ambientLight = new THREE.AmbientLight(color, intensity);
    ufoScene.add(ambientLight);
    return ambientLight;
}

///////////////////////
/* CREATE COMPONENTS */
///////////////////////

function createMaterials() {

    // Boxes and Cylinders materials
    for (const [name, color] of Object.entries(colors)) {
        //m[name] = new THREE.MeshBasicMaterial({ color: color, wireframe: false });
        m[name] = new THREE.MeshPhongMaterial({ color: color, wireframe: false });
        // must cast shadows in order to receive shadows
        m[name].castShadow = true;
    }
    // Edges material
    edgesMaterial = new THREE.LineBasicMaterial({ color: colors.black, visible: false });
}


function createTerrain() {
    const groundGeometry = new THREE.PlaneGeometry(25000, 25000, 100, 100);

    //create a canvas element and add the texture at images/texture.png

    let image = new Image();
    image.src = "../images/fieldTexture.png";
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
                const rotation = (Math.floor(Math.random() * 4)) * 90; // Random rotation in multiples of 90 degrees
                context.save(); // Save the current state of the context
                context.translate((x * width) + (width / 2), (y * height) + (height / 2)); // Translate to the center of the image
                context.rotate((Math.PI / 180) * rotation); // Apply the rotation
                context.drawImage(image, -(width / 2), -(height / 2), width, height); // Draw the image
                context.restore(); // Restore the saved state of the context
            }
        }

        // load the texture from the canvas
        const groundTexture = new THREE.CanvasTexture(canvas);
        //

        const disMap = new THREE.TextureLoader().setPath("../images").load("/heightmap.png");

        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x656597,
            displacementMap: disMap,
            displacementScale: 500,
            side: THREE.DoubleSide,
            map: groundTexture
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;

        ground.receiveShadow = true;
        ground.castShadow = true;

        ufoScene.add(ground);
    }
}

function createSkydome() {
    // must be double-sided in order to see the inside of the skydome
    const skydomeGeometry = new THREE.SphereGeometry(12500, 64, 64);
    // get the texture from images/skytexture.jpg
    const skydomeTexture = new THREE.TextureLoader().setPath("../images").load("/skytexture.png");
    const skydomeMaterial = new THREE.MeshBasicMaterial({ map: skydomeTexture, side: THREE.DoubleSide });
    const skydome = new THREE.Mesh(skydomeGeometry, skydomeMaterial);
    ufoScene.add(skydome);
}

function createFlyingSaucer() {
    ufoBody3D = createObject3D(ufoScene, -1000, 2000, 500);
    createGeometry('ell', [d.bodyRadius, 3/8, 1, 1], m.darkgrey, ufoBody3D, 0, 0, 0, rAxes.z, Math.PI/2);
    ufoCockpit3D = createObject3D(ufoBody3D, 0, 0, 0);
    let glassMaterial = new THREE.MeshBasicMaterial({ color: colors.lightblue, wireframe: false, transparent: true, opacity: 0.5 });
    createGeometry('sph', [d.bodyRadius / 2], glassMaterial, ufoBody3D, 0, 100, 0);
    ufoBauble3D = createObject3D(ufoBody3D, 0, 0, 0);
    //place the baubles radially in increments of 30 degrees
    for (let i = 0; i < 12; i++) {
        createGeometry('sph', [d.bodyRadius / 10], m.lightyellow, ufoBauble3D, d.bodyRadius * 0.8 * Math.sin(i * Math.PI / 6), -140, d.bodyRadius * 0.8 * Math.cos(i * Math.PI / 6));
    }
    ufoQuantumPhotonicResonator3D = createObject3D(ufoBody3D, 0, 0, 0);
    createGeometry('cyl', [d.bodyRadius / 10, d.bodyRadius / 10, d.bodyRadius / 2], m.goldenyellow, ufoQuantumPhotonicResonator3D, 0, -200, 0);


    let catPassenger = createObject3D(ufoBody3D, 0, 0, 0);
    //get cat.png from the images folder
    let catTexture = new THREE.TextureLoader().setPath("../images").load("/cat.png");
    let catMaterial = new THREE.MeshBasicMaterial({ map: catTexture, wireframe: false });
    createGeometry('sph', [d.bodyRadius / 10], catMaterial, ufoBody3D, 0, 400, 0);

    // add spotlight to quantum photonic resonator pointing down
    let spotLight = new THREE.SpotLight(colors.white, 1);
    spotLight.position.set(0, -400, 0);
	spotLight.intensity = 10;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    //radius of the light cone
    spotLight.distance = 3000;
    //pointing straight down
    spotLight.angle = Math.PI;
    spotLight.shadow.mapSize.width = 10240;
    spotLight.shadow.mapSize.height = 10240;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 30000;
    ufoBody3D.add(spotLight);

    // create sphere at the same position as the spotlight
    let spotLightSphere = new THREE.SphereGeometry(10, 10, 10);
    let spotLightSphereMesh = new THREE.Mesh(spotLightSphere, m.white);
    spotLightSphereMesh.position.set(0, -400, 0);
    ufoBody3D.add(spotLightSphereMesh);



}

function createCorkTree(x, y, z, s) {

    // Trunk 3D (parent: scene; children: lower trunk, upper trunk, trunk crown 3D, branch 3D)
    trunk3D = createObject3D(ufoScene, x, y, z);
    trunk3D.receiveShadow = true;
    trunk3D.castShadow = true;
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
    trunk3D.rotateOnWorldAxis(rAxes.x, getRandomAngle(-Math.PI/8, Math.PI/8));
    trunk3D.rotateOnWorldAxis(rAxes.z, getRandomAngle(-Math.PI/5, 0));
    branch3D.rotateOnWorldAxis(rAxes.x, getRandomAngle(-Math.PI/8, Math.PI/8));
    branch3D.rotateOnWorldAxis(rAxes.z, getRandomAngle(Math.PI/6, Math.PI/3));
    trunkCrown3D.rotateOnWorldAxis(rAxes.x, getRandomAngle(-Math.PI/12, Math.PI/12));
    trunkCrown3D.rotateOnWorldAxis(rAxes.z, getRandomAngle(-Math.PI/12, Math.PI/12));
    branchCrown3D.rotateOnWorldAxis(rAxes.x, getRandomAngle(-Math.PI/12, Math.PI/12));
    branchCrown3D.rotateOnWorldAxis(rAxes.z, getRandomAngle(-Math.PI/12, Math.PI/12));

    function getRandomAngle(min, max) {
        return Math.random() * (max - min) + min;
    }
}

function createMoon() {

    // Moon 3D (parent: scene; children: moon)
    moon3D = createObject3D(ufoScene, 5000, 5000, 5000);
    createGeometry('sph', [d.moonR], m.lightyellow, moon3D, 0, 0, 0);
    // add directional lightyellow light
    let moonLight = new THREE.DirectionalLight(m.lightyellow, 1);
    moonLight.position.set(0, 0, 0);
    moon3D.add(moonLight);
    // directional lightyellow helper
    let moonLightHelper = new THREE.DirectionalLightHelper(moonLight, 1000);
    moon3D.add(moonLightHelper);
    // light direction is slightly tilted
    moonLight.target.position.set(0, 0, 0);
    moonLight.castShadow = true;
    // TODO

}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////

function checkCollisions() {

}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////

function handleCollisions() {

}

////////////
/* UPDATE */
////////////

function update(delta) {
    rotateSaucer(rotationSpeed, delta);
    for (let k in keys) {
        if (keys[k] === true) {
            switch (k) {
                case "37": // left arrow
                    moveSaucer('x', -movementSpeed, delta);
                    break;
                case "38": // up arrow
                    moveSaucer('z', -movementSpeed, delta);
                    break;
                case "39": // right arrow
                    moveSaucer('x', movementSpeed, delta);
                    break;
                case "40": // down arrow
                    moveSaucer('z', movementSpeed, delta);
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

    ufoRenderer = new THREE.WebGLRenderer({ antialias: true });
    ufoRenderer.setSize(window.innerWidth, window.innerHeight);
    ufoRenderer.setClearColor(0x656597, 1);
    document.body.appendChild(ufoRenderer.domElement);

    camera = createPerspectiveCamera(750, 500, 500, 0, 0, 0, 1, 50000, 70);

    // Create camera controls and disable them and their arrow keys
    controls = new THREE.OrbitControls(camera, ufoRenderer.domElement);
    controls.keys = {LEFT: null, UP: null, RIGHT: null, BOTTOM: null};
    controls.enabled = true;

    // Create Axes Helper and Rotation Axes to be used
    axesHelper = new THREE.AxesHelper(750);
    rAxes.x = new THREE.Vector3(1, 0, 0);
    rAxes.y = new THREE.Vector3(0, 1, 0);
    rAxes.z = new THREE.Vector3(0, 0, 1);

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
    if (window.innerHeight > 0 && window.innerWidth > 0) {
        if (camera instanceof THREE.OrthographicCamera)
            updateOrthographicCamera(camera);
        else
            updatePerspectiveCamera(camera);
    }

}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////

function onKeyDown(e) {
    switch (e.keyCode) {
        case 57: // 9
        if (!isAxesHelperVisible) {
            ufoScene.add(axesHelper);
            isAxesHelperVisible = true;
        } else {
            ufoScene.remove(axesHelper);
            isAxesHelperVisible = false;
        }
        break;
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
    if (axis === 'x') {
        adjustment = new THREE.Vector3(speed * delta, 0, 0);
    } else if (axis === 'z') {
        adjustment = new THREE.Vector3(0, 0, speed * delta);
    }
    ufoBody3D.position.add(adjustment);
}

function rotateSaucer(rotationSpeed, delta) {
    ufoBody3D.rotateOnWorldAxis(rAxes.y, rotationSpeed * delta);
}
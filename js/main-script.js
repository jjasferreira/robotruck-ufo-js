'use strict';   // Applies to all of script
// TODO: add dark edges to components would look pretty cool

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene, renderer;

let previousTime = 0, currentTime = 0;

// Cameras
let camera;
const cameras = {front: null, side: null, top: null, iso: null, persp: null};

// Keys
let keys = {};

// Materials
let materials = [];

// RoboTruck components
let torsoPivot, headPivot, lArmPivot, rArmPivot, abdomenPivot, waistPivot,
    lThighPivot, rThighPivot, lLegPivot, rLegPivot, lBootPivot, rBootPivot;

// Trailer components
let trailer, trailerBody, plate, wheelRig, couplerBody
let latchPivot;
let latchPivotRotating = false;

// Movements and Rotations
let movementSpeed = 0.5;
let armsOffset = 0;
let rotationSpeed = 0.008;
let headPivotAngle = 0;
let thighsPivotsAngle = 0;
let bootsPivotsAngle = 0;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////

function createScene(){

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF0EAD6);
    scene.fog = new THREE.FogExp2( 0xa9a9fc, 0.00025);
    createRoboTruck();
    createTrailer();
    // TODO: remove the axes helper later
    const axesHelper = new THREE.AxesHelper(300);
    axesHelper.renderOrder = 1; // Set a higher render order for the axes helper
    scene.add(axesHelper);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createOrthographicCamera(x, y, z, near, far){

    const width = window.innerWidth / 2;
    const height = window.innerHeight / 2;
    const camera = new THREE.OrthographicCamera(-width, width, height, -height, near, far);
    camera.position.set(x, y, z);
    camera.lookAt(scene.position);
    return camera;
}

function createPerspectiveCamera(x, y, z, near, far, fov){

    const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);
    camera.position.set(x, y, z);
    camera.lookAt(scene.position);
    return camera;
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createPivot(parent, x = 0, y = 0, z = 0){

    const pivot = new THREE.Object3D();
    pivot.position.set(x, y, z);
    parent.add(pivot);
    return pivot;
}

function createCube(w, h, d, color, rotAxis, parent, x = 0, y = 0, z = 0){

    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshBasicMaterial({ color: color });
    materials.push(material);
    const cube = new THREE.Mesh(geometry, material);
    if (rotAxis !== null)
        cube.rotateOnAxis(rotAxis, Math.PI / 2);
    cube.position.set(x, y, z);
    parent.add(cube);
    return cube;
}

function createCylinder(rt, rb, h, color, rotAxis, parent, x = 0, y = 0, z = 0){

    // TODO: should we do CylinderGeometry(rt, rb, h, 32) to make it look smoother?
    const geometry = new THREE.CylinderGeometry(rt, rb, h);
    const material = new THREE.MeshBasicMaterial({ color: color });
    materials.push(material);
    const cylinder = new THREE.Mesh(geometry, material);
    if (rotAxis !== null)
        cylinder.rotateOnAxis(rotAxis, Math.PI / 2);
    cylinder.position.set(x, y, z);
    parent.add(cylinder);
    return cylinder;
}

function createRoboTruck(){

    // Torso Pivot
    torsoPivot = createPivot(scene, 0, 0, 0);
    const torsoW = 240, torsoH = 160, torsoD = 160;
    createCube(torsoW, torsoH, torsoD, 0x808080, null, torsoPivot);
    // Head Pivot (parent: torsoPivot; children: head, eyes, antennas)
    headPivot = createPivot(torsoPivot, 0, torsoH/2, -torsoD/2);
    const headW = 80, headH = 80, headD = 80;
    createCube(headW, headH, headD, 0xe8Beac, null, headPivot, 0, headH/2, headD/2);
    const eyeW = 20, eyeH = 40/3, eyeD = 10;
    createCube(eyeW, eyeH, eyeD, 0xffffff, null, headPivot, -headW/4, 3*headH/5, headD);
    createCube(eyeW, eyeH, eyeD, 0xffffff, null, headPivot, headW/4, 3*headH/5, headD);
    const antennaW = 40/3, antennaH = 40, antennaD = 40/3;
    createCube(antennaW, antennaH, antennaD, 0xff0000, null, headPivot, -headW/4, headH, 0);
    createCube(antennaW, antennaH, antennaD, 0xff0000, null, headPivot, headW/4, headH, 0);
    // Arms Pivots (parent: torsoPivot; children: upper arms, exhaust pipes, lower arms)
    lArmPivot = createPivot(torsoPivot, -torsoW/2, 0, -torsoD/2);
    rArmPivot = createPivot(torsoPivot, torsoW/2, 0, -torsoD/2);
    const uArmW = 80, uArmH = 160, uArmD = 80;
    createCube(uArmW, uArmH, uArmD, 0x035f53, null, lArmPivot, -uArmW/2, 0, -uArmD/2);
    createCube(uArmW, uArmH, uArmD, 0x035f53, null, rArmPivot, uArmW/2, 0, -uArmD/2);
    const pipeR = 10, pipeH = 120;
    createCylinder(pipeR, pipeR, pipeH, 0x808080, null, lArmPivot, -pipeR-uArmW, 3*uArmH/8, pipeR-uArmD);
    createCylinder(pipeR, pipeR, pipeH, 0x808080, null, rArmPivot, pipeR+uArmW, 3*uArmH/8, pipeR-uArmD);
    const lArmW = 80, lArmH = 80, lArmD = 240;
    createCube(lArmW, lArmH, lArmD, 0xffae42, null, lArmPivot, -uArmW/2, -lArmH/2-uArmH/2, lArmD/2-uArmD);
    createCube(lArmW, lArmH, lArmD, 0xffae42, null, rArmPivot, uArmW/2, -lArmH/2-uArmH/2, lArmD/2-uArmD);
    // Abdomen Pivot (parent: torso pivot; children: abdomen, waist pivot)
    abdomenPivot = createPivot(torsoPivot, 0, -torsoH/2, 0);
    const abdomenW = 80, abdomenH = 80, abdomenD = 160;
    createCube(abdomenW, abdomenH, abdomenD, 0x035f53, null, abdomenPivot, 0, -abdomenH/2, 0);
    // Waist Pivot (parent: abdomen pivot; children: waist, front wheels, thighs pivots)
    waistPivot = createPivot(abdomenPivot, 0, -abdomenH, abdomenD/8);
    const waistW = 240, waistH = 80, waistD = 120;
    createCube(waistW, waistH, waistD, 0x808080, null, waistPivot, 0, -waistH/2, 0);
    const wheelR = 40, wheelH = 40;
    const rotAxis = new THREE.Vector3(0, 0, 1);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, waistPivot, -wheelH/2-waistW/2, -3*waistH/4, 0);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, waistPivot, wheelH/2+waistW/2, -3*waistH/4, 0);
    // Thighs Pivots (parent: waist pivot; children: thighs, legs pivots)
    lThighPivot = createPivot(waistPivot, -waistW/3, -waistH, -waistD/2);
    rThighPivot = createPivot(waistPivot, waistW/3, -waistH, -waistD/2);
    const thighW = 40, thighH = 120, thighD = 40;
    createCube(thighW, thighH, thighD, 0x3492da, null, lThighPivot, 0, -thighH/2, -thighD/2);
    createCube(thighW, thighH, thighD, 0x3492da, null, rThighPivot, 0, -thighH/2, -thighD/2);
    // Legs Pivots (parents: thighs pivots; children: legs, back wheels, trailer socket, boots pivots)
    lLegPivot = createPivot(lThighPivot, 0, -thighH, -thighD);
    rLegPivot = createPivot(rThighPivot, 0, -thighH, -thighD);
    const legW = 80, legH = 320, legD = 80;
    createCube(legW, legH, legD, 0x3630a6, null, lLegPivot, 0, -legH/2, 0);
    createCube(legW, legH, legD, 0x3630a6, null, rLegPivot, 0, -legH/2, 0);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, lLegPivot, -wheelH/2-legW/2, -7*legH/16, legD/4);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, lLegPivot, -wheelH/2-legW/2, -13*legH/16, legD/4);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, rLegPivot, wheelH/2+legW/2, -7*legH/16, legD/4);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, rLegPivot, wheelH/2+legW/2, -13*legH/16, legD/4);
    const socketW = 40, socketH = 40, socketD = 40;
    createCube(socketW, socketH, socketD, 0xdac134, null, lLegPivot, legW/4, -5*legH/16, -3*socketD/2);
    createCube(socketW, socketH, socketD, 0xdac134, null, rLegPivot, -legW/4, -5*legH/16, -3*socketD/2);
    // Boots Pivots (parents: legs pivots; children: boots)
    lBootPivot = createPivot(lLegPivot, 0, -legH, legD/2);
    rBootPivot = createPivot(rLegPivot, 0, -legH, legD/2);
    const bootW = 80, bootH = 40, bootD = 60;
    createCube(bootW, bootH, bootD, 0x131056, null, lBootPivot, 0, -bootH/2, bootD/2);
    createCube(bootW, bootH, bootD, 0x131056, null, rBootPivot, 0, -bootH/2, bootD/2);
}

function createTrailer(){

    // create new Object3D for the trailer
    trailer = new THREE.Object3D();
    trailer.position.set(300, 0, -1080);
    // add the trailer to the scene
    scene.add(trailer);


    const bodyW = 240, bodyH = 280, bodyD = 1160;
    trailerBody = createCube(bodyW, bodyH, bodyD, 0xff606b, null, trailer);

    const plateW = 240, plateH = 40, plateD = 760;
    // color is light gray hex = 0x808080
    plate = createCube(plateW, plateH, plateD, 0x808080, null, trailer, 0, -bodyH/2 - plateH/2, -bodyD/2 + plateD/2);

    const wheelRigW = 240, wheelRigH = 80, wheelRigD = 400;
    // color is dark gray hex = 0x 858585
    wheelRig = createCube(wheelRigW, wheelRigH, wheelRigD, 0x2222222, null, trailer, 0, -bodyH/2 - plateH - wheelRigH/2,  -bodyD/2 + wheelRigD/2);

    const wheelR = 40, wheelH = 40;
    const rotAxis = new THREE.Vector3(0, 0, 1);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, wheelRig, -wheelH/2-wheelRigW/2, -wheelRigH/4, -wheelRigD/5);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, wheelRig, wheelH/2+wheelRigW/2, -wheelRigH/4, -wheelRigD/5);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, wheelRig, -wheelH/2-wheelRigW/2, -wheelRigH/4, wheelRigD/5);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, wheelRig, wheelH/2+wheelRigW/2, -wheelRigH/4, wheelRigD/5);

    const couplerW = 80, couplerH = 40, couplerD = 120;
    const couplerLatchW = 40, couplerLatchH = 40, couplerLatchD = 40;
    couplerBody = createCube(couplerW, couplerH, couplerD, 0x808080, null, trailerBody, 0, -bodyH/2 - couplerH/2, bodyD/2 - couplerD/2 - couplerLatchD);
    let couplerPivot1 = createPivot(couplerBody, -couplerW/2, 0, couplerD/2);
    let couplerPivot2 = createPivot(couplerBody, couplerW/2, 0, couplerD/2);
    let couplerLatch1 = createCube(couplerLatchW, couplerLatchH, couplerLatchD, 0x808080, null, couplerPivot1, couplerLatchW/2, 0, couplerLatchD/2);
    let couplerLatch2 = createCube(couplerLatchW, couplerLatchH, couplerLatchD, 0x808080, null, couplerPivot2, -couplerLatchW/2, 0, couplerLatchD/2);

}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {

}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions(){

}

////////////
/* UPDATE */
////////////
function update(delta){
    for (let k in keys) {
        if (keys[k] == true) {
            switch (k) {
                // Arms Movement Controls (keys E, D)
                case "69": // E
                case "101": // e
                    if (armsOffset < 80)
                        requestAnimationFrame(() => moveArms(movementSpeed, delta));
                    break;
                case "68": // D
                case "100": // d
                    if (armsOffset > 0)
                        requestAnimationFrame(() => moveArms(-movementSpeed, delta));
                    break;
                // Head Rotation Controls (keys R, F)
                case "82": // R
                case "114": // r
                    if (headPivotAngle < Math.PI)
                        requestAnimationFrame(() => rotateHeadPivot(rotationSpeed * 2, delta));
                    break;
                case "70": // F
                case "102": // f
                    if (headPivotAngle > 0)
                        requestAnimationFrame(() => rotateHeadPivot(-rotationSpeed * 2, delta));
                    break;
                // Thighs Rotation Controls (keys W, S)
                case "87": // W
                case "119": // w
                    if (thighsPivotsAngle < Math.PI/2)
                        requestAnimationFrame(() => rotateThighsPivots(rotationSpeed, delta));
                    break;
                case "83": //S
                case "115": //s
                    if (thighsPivotsAngle > 0)
                        requestAnimationFrame(() => rotateThighsPivots(-rotationSpeed, delta));
                    break;
                // Boots Rotation Controls (keys Q, A)
                case "81": // Q
                case "113": // q
                    if (bootsPivotsAngle < Math.PI/2)
                        requestAnimationFrame(() => rotateBootsPivots(rotationSpeed, delta));
                    break;
                case "65": //A
                case "97": //a
                    if (bootsPivotsAngle > 0)
                        requestAnimationFrame(() => rotateBootsPivots(-rotationSpeed, delta));
                    break;
                case "37": // left arrow
                        moveTrailer("x", movementSpeed * 4, delta);
                    break;
                case "39": // right arrow
                        moveTrailer("x", -movementSpeed * 4, delta);
                    break;
                case "40": // down arrow
                        moveTrailer("z", movementSpeed * 4, delta);
                    break;
                case "38": // up arrow
                        moveTrailer("z", -movementSpeed * 4, delta);
                    break;
            }
        }
    }
}

/////////////
/* DISPLAY */
/////////////
function render(){

    renderer.render(scene, camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
// noinspection JSUnresolvedReference
function init(){

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();

    // Create all cameras and set default camera
    cameras.front = createOrthographicCamera(0, 0, 500, 1, 5000);
    cameras.side = createOrthographicCamera(500, 0, 0, 1, 5000);
    cameras.top = createOrthographicCamera(0, 500, 0, 1, 5000);
    cameras.iso = createOrthographicCamera(500, 500, 500, 1, 5000);
    cameras.persp = createPerspectiveCamera(500, 500, 750, 1, 5000, 80);
    camera = cameras.front;

    previousTime = performance.now();

    // TODO: remove this controls line later
    //const controls = new THREE.OrbitControls(camera, renderer.domElement);

    render();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('keyup', onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate(){

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

function onResize(){

    // TODO: how to keep resize information when changing camera?
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (window.innerHeight > 0 && window.innerWidth > 0) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////

function onKeyDown(e){

    switch (e.keyCode) {
        // Camera Controls (keys 1, 2, 3, 4, 5)
        case 49: // 1
            camera = cameras.front;
            let controls = new THREE.OrbitControls(camera, renderer.domElement);
            break;
        case 50: // 2
            camera = cameras.side;
            break;
        case 51: // 3
            camera = cameras.top;
            break;
        case 52: // 4
            camera = cameras.iso;
            break;
        case 53: // 5
            camera = cameras.persp;
            break;
        // Visual Representation Controls (key 6)
        case 54: // 6
            materials.forEach(function (material) {
                material.wireframe = !material.wireframe;
            });
            break;
        default:
            keys[e.keyCode] = true;
    }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////

function onKeyUp(e){

    // Ignore 1 to 6 keys because they are used for camera switching
    if (e.keyCode >= 49 && e.keyCode <= 54)
        return;
    keys[e.keyCode] = false;
}

/////////////////////////
/* MOVEMENT FUNCTIONS */
/////////////////////////

function rotateHeadPivot(speed, delta){
    const target = speed > 0 ? Math.PI : 0;
    if ((speed > 0 && headPivotAngle + speed <= target) || (speed < 0 && headPivotAngle + speed >= target)) {
        headPivot.rotation.x -= speed * delta;
        headPivotAngle += speed * delta;
    }
}

function moveArms(speed, delta){
    const target = speed > 0 ? 80 : 0;
    if ((speed > 0 && armsOffset + speed <= target) || (speed < 0 && armsOffset + speed >= target)) {
        lArmPivot.position.x += speed * delta;
        rArmPivot.position.x -= speed * delta;
        armsOffset += speed * delta;
    }
}

function rotateThighsPivots(speed, delta) {
    const target = speed > 0 ? Math.PI/2 : 0;
    if ((speed > 0 && thighsPivotsAngle + speed <= target)  || (speed < 0 && thighsPivotsAngle + speed >= target)) {
        lThighPivot.rotation.x += speed * delta;
        rThighPivot.rotation.x += speed * delta;
        thighsPivotsAngle += speed * delta;
    }
}

function rotateBootsPivots(speed, delta){
    const target = speed > 0 ? Math.PI/2 : 0;
    if ((speed > 0 && bootsPivotsAngle + speed <= target) || (speed < 0 && bootsPivotsAngle + speed >= target)) {
        lBootPivot.rotation.x += speed * delta;
        rBootPivot.rotation.x += speed * delta;
        bootsPivotsAngle += speed * delta;
    }
}

function moveTrailer(axis, speed, delta){
    if (speed !== 0 && axis === "x") {
        trailer.position.x -= speed * delta;
    } else {
        trailer.position.z += speed * delta;
    }
}

/*

function moveTrailer(axis, speed){
    trailerMoving = true;
    const target = speed > 0 ? 80 : 0;
    if ((speed > 0 && trailerOffset + speed <= target) || (speed < 0 && trailerOffset + speed >= target)) {
        trailer.position[axis] += speed;
        trailerOffset += speed;
        requestAnimationFrame(() => moveTrailer(axis, speed));
    } else {
        trailer.position[axis] += target - trailerOffset;
        trailerOffset = target;
        trailerMoving = false;
    }
}

function rotateLatchPivot(speed) {
    latchPivotRotating = true;
    const axis = new THREE.Vector3(0, 1, 0);
    const target = speed > 0 ? Math.PI : 0;
    if ((speed > 0 && latchPivotAngle + speed <= target) || (speed < 0 && latchPivotAngle + speed >= target)) {
        latchPivot.rotateOnAxis(axis, speed);
        latchPivotAngle += speed;
        requestAnimationFrame(() => rotateLatchPivot(speed));
    } else {
        latchPivot.rotateOnAxis(axis, target - latchPivotAngle);
        latchPivotAngle = target;
        latchPivotRotating = false;
    }
}

*/

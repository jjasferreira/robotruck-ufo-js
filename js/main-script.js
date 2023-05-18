'use strict';   // Aplies to all of script
// TODO: add dark edges to components would look pretty cool

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene, renderer;

// Cameras
let camera;
const cameras = {front: null, side: null, top: null, iso: null, persp: null};

// Keys
const keys = {};

// RoboTruck components and their materials
let torso, headPivot, head, uLeftArm, uRightArm, abdomen, waist, thighsPivot,
    leftThigh, rightThigh, leftLeg, rightLeg, bootsPivot;
let materials = [];

// Movements and Rotations
let movementSpeed = 0.2;
let armsMoving = false;
let armsOffset = 0;
let rotationSpeed = 0.008;
let headPivotRotating = false;
let headPivotAngle = 0;
let thighsPivotRotating = false;
let thighsPivotAngle = 0;
let bootsPivotRotating = false;
let bootsPivotAngle = 0;

// Trailer components
let trailerBody, plate, wheelRig, couplerBody
let latchPivot;
let latchPivotRotating = false;

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

    // Torso
    const torsoW = 240, torsoH = 160, torsoD = 160;
    torso = createCube(torsoW, torsoH, torsoD, 0x808080, null, scene);
    // Head Pivot
    headPivot = createPivot(torso, 0, torsoH/2, -torsoD/2);
    // Head
    const headW = 80, headH = 80, headD = 80;
    head = createCube(headW, headH, headD, 0xe8Beac, null, headPivot, 0, headH/2, headD/2);
    // Eyes
    const eyeW = 20, eyeH = 40/3, eyeD = 10;
    createCube(eyeW, eyeH, eyeD, 0xffffff, null, head, -headW/4, headH/4, headD/2);
    createCube(eyeW, eyeH, eyeD, 0xffffff, null, head, headW/4, headH/4, headD/2);
    // Antennas
    const antennaW = 40/3, antennaH = 40, antennaD = 40/3;
    createCube(antennaW, antennaH, antennaD, 0xff0000, null, head, -headW/4, headH/2, -headD/2);
    createCube(antennaW, antennaH, antennaD, 0xff0000, null, head, headW/4, headH/2, -headD/2);
    // Upper Arms
    const uArmW = 80, uArmH = 160, uArmD = 80;
    uLeftArm = createCube(uArmW, uArmH, uArmD, 0x035f53, null, torso, -uArmW/2-torsoW/2, 0, -uArmD/2-torsoD/2);
    uRightArm = createCube(uArmW, uArmH, uArmD, 0x035f53, null, torso, uArmW/2+torsoW/2, 0, -uArmD/2-torsoD/2);
    // Exhaust Pipes
    const pipeR = 10, pipeH = 120;
    createCylinder(pipeR, pipeR, pipeH, 0x808080, null, uLeftArm, -pipeR-uArmW/2, 3*uArmH/8, pipeR-uArmD/2);
    createCylinder(pipeR, pipeR, pipeH, 0x808080, null, uRightArm, pipeR+uArmW/2, 3*uArmH/8, pipeR-uArmD/2);
    // Lower Arms
    const lArmW = 80, lArmH = 80, lArmD = 240;
    createCube(lArmW, lArmH, lArmD, 0xffae42, null, uLeftArm, 0, -lArmH/2-uArmH/2, lArmD/2-uArmD/2);
    createCube(lArmW, lArmH, lArmD, 0xffae42, null, uRightArm, 0, -lArmH/2-uArmH/2, lArmD/2-uArmD/2);
    // Abdomen
    const abdomenW = 80, abdomenH = 80, abdomenD = 160;
    abdomen = createCube(abdomenW, abdomenH, abdomenD, 0x035f53, null, torso, 0, -abdomenH/2-torsoH/2, 0);
    // Waist
    const waistW = 240, waistH = 80, waistD = 120;
    waist = createCube(waistW, waistH, waistD, 0x808080, null, abdomen, 0, -waistH/2-abdomenH/2, abdomenD/8);
    // Front Wheels
    const wheelR = 40, wheelH = 40;
    const rotAxis = new THREE.Vector3(0, 0, 1);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, waist, -wheelH/2-waistW/2, -waistH/4, 0);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, waist, wheelH/2+waistW/2, -waistH/4, 0);
    // Thighs Pivot
    thighsPivot = createPivot(waist, 0, -waistH/2, -waistD/2);
    // Thighs
    const thighW = 40, thighH = 120, thighD = 40;
    leftThigh = createCube(thighW, thighH, thighD, 0x3492da, null, waist, -waistW/3+thighW/2, -waistH/2-thighH/2, -waistD/2-thighD/2);
    rightThigh = createCube(thighW, thighH, thighD, 0x3492da, null, waist, waistW/3-thighW/2, -waistH/2-thighH/2, -waistD/2-thighD/2);
    // Legs
    const legW = 80, legH = 320, legD = 80;
    leftLeg = createCube(legW, legH, legD, 0x3630a6, null, leftThigh, 0, -thighH/2-legH/2, -thighD/2);
    rightLeg = createCube(legW, legH, legD, 0x3630a6, null, rightThigh, 0, -thighH/2-legH/2, -thighD/2);
    // Back Wheels
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, leftLeg, -legW/2-wheelH/2, legH/16, legD/4);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, leftLeg, -legW/2-wheelH/2, -5*legH/16, legD/4);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, rightLeg, legW/2+wheelH/2, legH/16, legD/4);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, rightLeg, legW/2+wheelH/2, -5*legH/16, legD/4);
    // Trailer Socket (fitting word?)
    const socketW = 40, socketH = 40, socketD = 40;
    createCube(socketW, socketH, socketD, 0xdac134, null, leftLeg, legW/4, 3*legH/16, -3*socketD/2);
    createCube(socketW, socketH, socketD, 0xdac134, null, rightLeg, -legW/4, 3*legH/16, -3*socketD/2);
    // Boots Pivot
    //  TODO
    // Boots
    const bootW = 80, bootH = 40, bootD = 40;
    createCube(bootW, bootH, bootD, 0x131056, null, leftLeg, 0, -legH/2-bootH/2, legD/2+bootD/2)
    createCube(bootW, bootH, bootD, 0x131056, null, rightLeg, 0, -legH/2-bootH/2, legD/2+bootD/2)

}

function createTrailer(){

    const bodyW = 240, bodyH = 280, bodyD = 1160;
    trailerBody = createCube(bodyW, bodyH, bodyD, 0xff606b, null, scene, 300, 0, -1080);

    const plateW = 240, plateH = 40, plateD = 760;
    // color is light gray hex = 0x808080
    plate = createCube(plateW, plateH, plateD, 0x808080, null, trailerBody, 0, -bodyH/2 - plateH/2, -bodyD/2 + plateD/2);

    const wheelRigW = 240, wheelRigH = 80, wheelRigD = 400;
    // color is dark gray hex = 0x 858585
    wheelRig = createCube(wheelRigW, wheelRigH, wheelRigD, 0x2222222, null, plate, 0, -plateH/2 - wheelRigH/2, -plateD/2 + wheelRigD/2);

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
function update(){

    // testing: torso.rotation.y += 0.001;
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

    // TODO: remove this controls line later
    const controls = new THREE.OrbitControls(camera, renderer.domElement);

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
    update();
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
            controls = new THREE.OrbitControls(camera, renderer.domElement);
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
        // Arms Movement Controls (keys E, D)
        case 69: // E
        case 101: // e
            if (armsOffset < 80 && !armsMoving)
                moveArms(movementSpeed);
            break;
        case 68: // D
        case 100: // d
            if (armsOffset > 0 && !armsMoving)
                moveArms(-movementSpeed);
            break;
        // Head Rotation Controls (keys R, F)
        case 82: // R
        case 114: // r
            if (headPivotAngle < Math.PI && !headPivotRotating)
                rotateHeadPivot(rotationSpeed);
            break;
        case 70: // F
        case 102: // f
            if (headPivotAngle > 0 && !headPivotRotating)
                rotateHeadPivot(-rotationSpeed);
            break;
        // Thighs Rotation Controls (keys T, G)
        case 84: // T
        case 116: // t
            if (thighsPivotAngle < Math.PI/2 && !thighsPivotRotating)
                rotateThighsPivot(rotationSpeed);
            break;
        case 71: //G
        case 103: //g
            if (thighsPivotAngle > 0 && !thighsPivotRotating)
                rotateThighsPivot(-rotationSpeed);
            break;
        // Boots Rotation Controls (keys Y, H)
        case 87: // Y
        case 119: // y
            if (bootsPivotAngle < Math.PI/2 && !bootsPivotRotating)
                rotateBootsPivot(rotationSpeed);
            break;
        case 72: //H
        case 104: //h
            if (bootsPivotAngle > 0 && !bootsPivotRotating)
                rotateBootsPivot(-rotationSpeed);
            break;
        /* Trailer movement (arrow keys - left, right, down, up)
        case 37: // left arrow
            if (trailerOffset < 80 && !trailerMoving)
                moveTrailer("x", movementSpeed);
            break;
        case 39: // right arrow
            if (trailerOffset > 0 && !trailerMoving)
                moveTrailer("x", -movementSpeed);
            break;
        case 40: // down arrow
            if (trailerOffset < 80 && !trailerMoving)
                moveTrailer("z", movementSpeed);
            break;
        case 38: // up arrow
            if (trailerOffset > 0 && !trailerMoving)
                moveTrailer("z", -movementSpeed);
            break;
         */
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
    */

    function moveArms(speed){
        armsMoving = true;
        const target = speed > 0 ? 80 : 0;
        if ((speed > 0 && armsOffset + speed <= target) || (speed < 0 && armsOffset + speed >= target)) {
            uLeftArm.position.x += speed;
            uRightArm.position.x -= speed;
            armsOffset += speed;
            requestAnimationFrame(() => moveArms(speed));
        } else {
            uLeftArm.position.x += target - armsOffset;
            uRightArm.position.x -= target - armsOffset;
            armsOffset = target;
            armsMoving = false;
        }
    }

    // TODO: is this function ok?
    function rotateHeadPivot(speed){
        headPivotRotating = true;
        const axis = new THREE.Vector3(-1, 0, 0);
        const target = speed > 0 ? Math.PI : 0;
        if ((speed > 0 && headPivotAngle + speed <= target) || (speed < 0 && headPivotAngle + speed >= target)) {
            headPivot.rotateOnAxis(axis, speed);
            headPivotAngle += speed;
            requestAnimationFrame(() => rotateHeadPivot(speed));
        } else {
            headPivot.rotateOnAxis(axis, target - headPivotAngle);
            headPivotAngle = target;
            headPivotRotating = false;
        }
    }

    /*
    function rotateThighsPivot(speed) {
        thighsPivotRotating = true;
        const axis = new THREE.Vector3(0, 0, 0);
        const target = speed > 0 ? Math.PI/2 : 0;
        if ((speed > 0 && thighsPivotAngle + speed <= target)  || (speed < 0 && thighsPivotAngle + speed >= target)) {
            thighsPivot.rotateOnAxis(axis, -speed);
            thighsPivotAngle += speed;
            requestAnimationFrame(() => rotateThighsPivot(speed));
        }
        else {
            thighsPivot.rotateOnAxis(axis, target - thighsPivotAngle);
            thighsPivotAngle = target;
            thighsPivotRotating = false;
        }
    }

    function rotateBootsPivot(speed){
        bootsPivotRotating = true;
        const axis = new THREE.Vector3(0, 0, 0);
        const target = speed > 0 ? Math.PI/2 : 0;
        if ((speed > 0 && bootsPivotAngle + speed <= target) || (speed < 0 && bootsPivotAngle + speed >= target)) {
            bootsPivot.rotateOnAxis(axis, -speed);
            bootsPivotAngle += speed;
            requestAnimationFrame(() => rotateBootsPivot(speed));
        } 
        else {
            bootsPivot.rotateOnAxis(axis, target - bootsPivotAngle);
            bootsPivotAngle = target;
            bootsPivotRotating = false;
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
//import * as THREE from 'three'; // TODO: how to import THREE.js?
// TODO: add dark edges to components would look pretty cool

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene, renderer;
// Cameras
let camera, frontCamera, sideCamera, topCamera, orthoCamera, perspCamera;
let cameraStatus = {front: true, side: false, top: false, ortho: false, persp: false};
// RoboTruck components that are also parent objects
let torso, headPivot, head, uLeftArm, uRightArm, abdomen, waist, thighsPivot;
// Movements and Rotations
let movementSpeed = 0.2;
let armsMoving = false;
let armsOffset = 0;
let rotationSpeed = 0.008;
let headPivotRotating = false;
let headPivotAngle = 0;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////

function createScene(){
    'use strict';

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF0EAD6);
    createRoboTruck();
    // TODO: remove the axes helper later
    const axesHelper = new THREE.AxesHelper(300);
    axesHelper.renderOrder = 1; // Set a higher render order for the axes helper
    scene.add(axesHelper);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createFrontCamera(){
    'use strict';

    frontCamera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 5000);
    frontCamera.position.x = 0;
    frontCamera.position.y = 0;
    frontCamera.position.z = 500;
    frontCamera.lookAt(scene.position);
}

function createSideCamera() {
    'use strict';

    sideCamera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 5000);
    sideCamera.position.x = 500;
    sideCamera.position.y = 0;
    sideCamera.position.z = 0;
    sideCamera.lookAt(scene.position);
}

function createTopCamera(){
    'use strict';

    topCamera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 5000);
    topCamera.position.x = 0;
    topCamera.position.y = 500;
    topCamera.position.z = 0;
    topCamera.lookAt(scene.position);
}

function createOrthographicCamera(){
    'use strict';

    orthoCamera = new THREE.OrthographicCamera(-500, 500, 500, -500, 1, 5000);
    orthoCamera.position.x = 500;
    orthoCamera.position.y = 500;
    orthoCamera.position.z = 500;
    orthoCamera.lookAt(scene.position);
}

function createPerspectiveCamera(){
    'use strict';

    perspCamera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 5000);
    perspCamera.position.x = 400; // TODO: x, y and z can be any number really
    perspCamera.position.y = 300;
    perspCamera.position.z = 500;
    perspCamera.lookAt(scene.position);
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
    const material = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
    const cube = new THREE.Mesh(geometry, material);
    if (rotAxis !== null)
        cube.rotateOnAxis(rotAxis, Math.PI / 2);
    cube.position.set(x, y, z);
    parent.add(cube);
    return cube;
}

function createCylinder(rt, rb, h, color, rotAxis, parent, x = 0, y = 0, z = 0) {
    // TODO: should we do CylinderGeometry(rt, rb, h, 32) to make it look smoother?
    const geometry = new THREE.CylinderGeometry(rt, rb, h);
    const material = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
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
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, waist, -wheelH/2-waistW/2, -waistH/2, -waistD/4);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, waist, wheelH/2+waistW/2, -waistH/2, -waistD/4);
    // Thighs Pivot
    thighsPivot = createPivot(waist, 0, -waistH/2, -waistD/2);
    // Thighs
    // TODO

}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {
    'use strict';

}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions(){
    'use strict';

}

////////////
/* UPDATE */
////////////
function update(){
    'use strict';

    //torso.rotation.y += 0.001;
}

/////////////
/* DISPLAY */
/////////////
function render() {
    'use strict';

    renderer.render(scene, camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
    'use strict';

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();

    // TODO: Pass camera creation parameters as arguments later
    createFrontCamera();
    createSideCamera();
    createTopCamera();
    createOrthographicCamera();
    createPerspectiveCamera();
    camera = frontCamera;

    render();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('keyup', onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';

    requestAnimationFrame(animate);
    update();
    render();
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////

function onResize() {
    'use strict';

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

function onKeyDown(e) {
    'use strict';

    switch (e.keyCode) {
        // Camera Controls (keys 1, 2, 3, 4, 5)
        case 49: // 1
            cameraStatus = {front: true, side: false, top: false, ortho: false, persp: false};
            camera = frontCamera;
            break;
        case 50: // 2
            cameraStatus = {front: false, side: true, top: false, ortho: false, persp: false};
            camera = sideCamera;
            break;
        case 51: // 3
            cameraStatus = {front: false, side: false, top: true, ortho: false, persp: false};
            camera = topCamera;
            break;
        case 52: // 4
            cameraStatus = {front: false, side: false, top: false, ortho: true, persp: false};
            camera = orthoCamera;
            break;
        case 53: // 5
            cameraStatus = {front: false, side: false, top: false, ortho: false, persp: true};
            camera = perspCamera;
            break;
        // Visual Representation Controls (key 6)
        case 54: // 6
            // TODO: should objects be instantiated with wireframe or not?
            scene.traverse(function (node) {
                if (node instanceof THREE.Mesh)
                    node.material.wireframe = !node.material.wireframe;
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
    }

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
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////

function onKeyUp(e){
    'use strict';

}
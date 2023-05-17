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
let torso, headPivot, head, uLeftArm, uRightArm;
// Rotation
let rotationSpeed = 0.008;
let isRotationInProgress = false;
let headPivotState = 0;

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

    frontCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    frontCamera.position.x = 0;
    frontCamera.position.y = 0;
    frontCamera.position.z = 500;
    frontCamera.lookAt(scene.position);
}

function createSideCamera() {
    'use strict';

    sideCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    sideCamera.position.x = 500;
    sideCamera.position.y = 0;
    sideCamera.position.z = 0;
    sideCamera.lookAt(scene.position);
}

function createTopCamera(){
    'use strict';

    topCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    topCamera.position.x = 0;
    topCamera.position.y = 500;
    topCamera.position.z = 0;
    topCamera.lookAt(scene.position);
}

function createOrthographicCamera(){
    'use strict';

    orthoCamera = new THREE.OrthographicCamera(-500, 500, 500, -500, 1, 1000);
    orthoCamera.position.x = 500;
    orthoCamera.position.y = 500;
    orthoCamera.position.z = 500;
    orthoCamera.lookAt(scene.position);
}

function createPerspectiveCamera(){
    'use strict';

    perspCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    perspCamera.position.x = 500; // TODO: x, y and z can be any number really
    perspCamera.position.y = 500;
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

function createCube(w, h, d, color, parent, x = 0, y = 0, z = 0){
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, z);
    parent.add(cube);
    return cube;
}

function createRoboTruck(){

    // Torso
    const torsoW = 240, torsoH = 160, torsoD = 160;
    torso = createCube(torsoW, torsoH, torsoD, 0x808080, scene);
    // Head Pivot
    headPivot = createPivot(torso, 0, torsoH/2, -torsoD/2);
    // Head
    const headW = 80, headH = 80, headD = 80;
    head = createCube(headW, headH, headD, 0xe8Beac, headPivot, 0, headH/2, headD/2);
    // Eyes
    const eyeW = 20, eyeH = 40/3, eyeD = 10;
    createCube(eyeW, eyeH, eyeD, 0xffffff, head, -headW/4, headH/4, headD/2);
    createCube(eyeW, eyeH, eyeD, 0xffffff, head, headW/4, headH/4, headD/2);
    // Antennas
    const antennaW = 40/3, antennaH = 40, antennaD = 40/3;
    createCube(antennaW, antennaH, antennaD, 0xff0000, head, -headW/4, headH/2, -headD/2);
    createCube(antennaW, antennaH, antennaD, 0xff0000, head, headW/4, headH/2, -headD/2);
    // Upper Arms
    const uArmW = 80, uArmH = 160, uArmD = 80;
    uLeftArm = createCube(uArmW, uArmH, uArmD, 0x035f53, torso, -uArmW/2-torsoW/2, 0, -uArmD/2-torsoD/2);
    uRightArm = createCube(uArmW, uArmH, uArmD, 0x035f53, torso, uArmW/2+torsoW/2, 0, -uArmD/2-torsoD/2);
    // Lower Arms
    const lArmW = 80, lArmH = 80, lArmD = 240;
    createCube(lArmW, lArmH, lArmD, 0xffae42, uLeftArm, 0, -lArmH/2-uArmH/2, lArmD/2-uArmD/2);
    createCube(lArmW, lArmH, lArmD, 0xffae42, uRightArm, 0, -lArmH/2-uArmH/2, lArmD/2-uArmD/2);
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
        // Rotation Controls (keys R, F)
        case 82: // R
            if (headPivotState < Math.PI && !isRotationInProgress)
                rotateHeadPivot(rotationSpeed);
            break;
        case 70: // F
            if (headPivotState > 0 && !isRotationInProgress)
                rotateHeadPivot(-rotationSpeed);
            break;
    }

    // TODO: is this function ok?
    function rotateHeadPivot(speed) {
        isRotationInProgress = true;
        const axis = new THREE.Vector3(-1, 0, 0);
        const target = speed > 0 ? Math.PI : 0;
        if ((speed > 0 && headPivotState + speed <= target) || (speed < 0 && headPivotState + speed >= target)) {
            headPivot.rotateOnAxis(axis, speed);
            headPivotState += speed;
            requestAnimationFrame(() => rotateHeadPivot(speed));
        } else {
            headPivot.rotateOnAxis(axis, target - headPivotState);
            headPivotState = target;
            isRotationInProgress = false;
        }
    }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////

function onKeyUp(e){
    'use strict';

}
//import * as THREE from 'three'; // TODO: how to import THREE.js?

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene, renderer;

let camera, frontCamera, sideCamera, topCamera, orthoCamera, perspCamera;
let cameraStatus = {front: true, side: false, top: false, ortho: false, persp: false};

let torso, headPivot, head, eye, antenna, thigh, leg, wheel;

let rotationSpeed = 0.005;
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
    perspCamera.position.x = 500;
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

function createTorso(w, h, d, x=0, y=0, z=0){
    const torsoGeometry = new THREE.BoxGeometry(w, h, d);
    const torsoMaterial = new THREE.MeshBasicMaterial({ color: 0x035f53, wireframe: true });
    torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(x, y, z);
    scene.add(torso);
}

function createHeadPivot(x, y, z){
    headPivot = new THREE.Object3D();
    headPivot.position.set(x, y, z);
    torso.add(headPivot);
}

function createHead(w, h, d, x, y, z){
    const headGeometry = new THREE.BoxGeometry(w, h, d);
    const headMaterial = new THREE.MeshBasicMaterial({ color: 0xe8Beac, wireframe: true });
    head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(x, y, z)
    headPivot.add(head);
}

function createEye(w, h, d, x, y, z){
    const eyeGeometry = new THREE.BoxGeometry(w, h, d);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true});
    eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(x, y, d/2 + z);
    headPivot.add(eye);
}

function createAntenna(w, h, d, x, y, z){
    const antennaGeometry = new THREE.BoxGeometry(w, h, d);
    const antennaMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(x, y, -d/2 + z);
    headPivot.add(antenna);
}

function createRoboTruck(){
    // TODO: show dark edges instead of wireframe would look pretty cool

    const torsoW=240, torsoH=160, torsoD=160;
    createTorso(torsoW, torsoH, torsoD);

    // Head Pivot
    createHeadPivot(0, torsoH/2, -torsoD/2);
    const headW=80, headH=80, headD=80;
    createHead(headW, headH, headD, 0, headH/2, headD/2);
    const eyeW=20, eyeH=40/3, eyeD=10;
    // TODO: do we need to keep reference to each eye/antenna? Do we need to define pivots for the eye and antenna?
    createEye(eyeW, eyeH, eyeD, -headW/4, 3*headH/4, headD);
    createEye(eyeW, eyeH, eyeD, headW/4, 3*headH/4, headD);
    const antennaW = 40/3, antennaH = 40, antennaD = 40/3;
    createAntenna(antennaW, antennaH, antennaD, -headW/4, headH, 0);
    createAntenna(antennaW, antennaH, antennaD, headW/4, headH, 0);


    //createArm()
    //
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
        // Rotation Controls
        case 82: // R
            if (headPivotState < Math.PI && !isRotationInProgress)
                rotateHeadPivot(rotationSpeed);
            break;
        case 70: // F
            if (headPivotState > 0 && !isRotationInProgress)
                rotateHeadPivot(-rotationSpeed);
            break;
    }
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
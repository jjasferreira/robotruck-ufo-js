//import * as THREE from 'three'; TODO: how to import THREE.js?

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene, renderer;

let camera, frontCamera, sideCamera, topCamera, orthoCamera, perspCamera;
let cameraStatus = {front: true, side: false, top: false, ortho: false, persp: false};

let torso, head, leftEye, rightEye, leftAntenna, rightAntenna;

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

function createRoboTruck(){
    'use strict';

    // Torso
    const torsoGeometry = new THREE.BoxGeometry(240, 160, 160);
    const torsoMaterial = new THREE.MeshBasicMaterial({ color: 0x035f53, wireframe: true });
    torso = new THREE.Mesh(torsoGeometry, torsoMaterial);

    // Head
    const headGeometry = new THREE.BoxGeometry(80, 80, 80);
    // TODO: show dark edges instead of wireframe would look pretty cool
    const headMaterial = new THREE.MeshBasicMaterial({ color: 0xe8Beac, wireframe: true });
    head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 40, 40);
    head.position.y += torsoGeometry.parameters.height/2;
    head.position.z -= torsoGeometry.parameters.depth/2;
    torso.add(head);

    // Eyes
    const eyeGeometry = new THREE.BoxGeometry(20, 40/3, 10);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0, 0, 5);
    leftEye.position.x -= headGeometry.parameters.width/4;
    leftEye.position.y += headGeometry.parameters.height/4;
    leftEye.position.z += headGeometry.parameters.depth/2;
    head.add(leftEye);
    rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0, 0, 5);
    rightEye.position.x += headGeometry.parameters.width/4;
    rightEye.position.y += headGeometry.parameters.height/4;
    rightEye.position.z += headGeometry.parameters.depth/2;
    head.add(rightEye);

    // Antennas TODO: make them

    scene.add(torso);
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions(){
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

    //torso.rotation.y -= 0.01;
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
        case 49: // 1 key
            cameraStatus = {front: true, side: false, top: false, ortho: false, persp: false};
            camera = frontCamera;
            break;
        case 50: // 2 key
            cameraStatus = {front: false, side: true, top: false, ortho: false, persp: false};
            camera = sideCamera;
            break;
        case 51: // 3 key
            cameraStatus = {front: false, side: false, top: true, ortho: false, persp: false};
            camera = topCamera;
            break;
        case 52: // 4 key
            cameraStatus = {front: false, side: false, top: false, ortho: true, persp: false};
            camera = orthoCamera;
            break;
        case 53: // 5 key
            cameraStatus = {front: false, side: false, top: false, ortho: false, persp: true};
            camera = perspCamera;
            break;
    }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////

function onKeyUp(e){
    'use strict';

}
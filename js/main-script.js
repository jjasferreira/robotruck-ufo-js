//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

var scene, renderer;

var frontCamera, topCamera, sideCamera, camera;

var tempCube;

var cameraStatus = {front: true, top: false, side: false};


/////////////////////
/* CREATE SCENE(S) */
/////////////////////

function createScene(){
    'use strict';
    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(10));
    scene.background = new THREE.Color(0xF0EAD6);
    createCube(0, 0, 0);

}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createFrontCamera(){
    'use strict';
    frontCamera = new THREE.PerspectiveCamera(70,
                                              window.innerWidth / window.innerHeight,
                                              1,
                                              1000);
    frontCamera.position.x = 0;
    frontCamera.position.y = 0;
    frontCamera.position.z = 50;
    frontCamera.lookAt(scene.position);

}

function createTopCamera(){
    'use strict';
    topCamera = new THREE.PerspectiveCamera(70,
                                            window.innerWidth / window.innerHeight,
                                            1,
                                            1000);
    topCamera.position.x = 0;
    topCamera.position.y = 50;
    topCamera.position.z = 0;
    topCamera.lookAt(scene.position);
}

function createSideCamera() {
    'use strict';
    sideCamera = new THREE.PerspectiveCamera(70,
                                                window.innerWidth / window.innerHeight,
                                                1,
                                                1000);
    sideCamera.position.x = 50;
    sideCamera.position.y = 0;
    sideCamera.position.z = 0;
    sideCamera.lookAt(scene.position);
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createCube(x, y, z){
    'use strict';
    var geometry = new THREE.BoxGeometry(10, 10, 10);
    var material = new THREE.MeshBasicMaterial({ color: 0xf0ff0f, wireframe: true });
    tempCube = new THREE.Mesh(geometry, material);
    tempCube.position.set(x, y, z);
    scene.add(tempCube);
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
    createTopCamera();
    createSideCamera();
    camera = frontCamera;

    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    

}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';
    render();

    requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////

function onResize() { 
    'use strict';

    // TODO how to keep resize information when changing camera?

    renderer.setSize(window.innerWidth, window.innerHeight);

    /* if (window.innerHeight > 0 && window.innerWidth > 0) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    } */
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
 
function onKeyDown(e) {
    'use strict';
    switch (e.keyCode) {
        case 49: // 1 key
            cameraStatus = {front: true, top: false, side: false};
            camera = frontCamera;
            break;
        case 50: // 2 key
            cameraStatus = {front: false, top: true, side: false};
            camera = topCamera;
            break;
        case 51: // 3 key
            cameraStatus = {front: false, top: false, side: true};
            camera = sideCamera;
            break;
    }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e){
    'use strict';
    //TODO what is the purpose of thisfunction? Is this only applicable to movement or toggles as well?

}
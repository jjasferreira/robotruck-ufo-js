'use strict';   // Applies to all script

/*
    *  Texture Generation - key bindings:
    * - '1' - change to field scene and generate new texture
    * - '2' - change to sky scene and generate new texture
 */

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let fieldScene, skyScene;
let scenes = {field : true, sky : false}
let texRenderer;

let fieldTextureSize = 256, skyTextureSize = 4096;

// Cameras
let textureCamera;

//////////////////
/* CREATE SCENE */
//////////////////

function createFieldScene() {

    fieldScene = new THREE.Scene();
    const canvas = generateFieldTexture(fieldTextureSize, true);
    const texture = new THREE.CanvasTexture(canvas);
    const plane = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshBasicMaterial({map: texture});
    const mesh = new THREE.Mesh(plane, material);
    fieldScene.add(mesh);
}

function createSkyScene() {

    skyScene = new THREE.Scene();
    const canvas = generateSkyTexture(skyTextureSize, true);
    const texture = new THREE.CanvasTexture(canvas);
    const plane = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshBasicMaterial({map: texture});
    const mesh = new THREE.Mesh(plane, material);
    skyScene.add(mesh);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////

function animate() {

    requestAnimationFrame(animate);
    render();
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////

function init() {

    // Create renderer
    texRenderer = new THREE.WebGLRenderer({ antialias: true });
    texRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(texRenderer.domElement);

    // Create camera
    textureCamera = createOrthographicCamera(0, 0, 5, 0, 0, 0, 0.1, 1000, 1/150);

    // Create scene, keep track of time and add event listeners
    createFieldScene();
    createSkyScene();
    document.addEventListener('keydown', onKeyDown);
}

/////////////
/* DISPLAY */
/////////////

function render() {

    if (scenes.field)
        texRenderer.render(fieldScene, textureCamera);
    else if (scenes.sky)
        texRenderer.render(skyScene, textureCamera);
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////

function onKeyDown(e) {
    switch (e.keyCode) {
        case 49: // 1
            createFieldScene();
            scenes.field = true;
            scenes.sky = false;
            break;
        case 50: // 2
            createSkyScene();
            scenes.field = false;
            scenes.sky = true;
            break;
        default:
            break;
    }
}
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

// Cameras
let camera;

//////////////////
/* CREATE SCENE */
//////////////////

function createFieldScene() {

    fieldScene = new THREE.Scene();
    const texture = generateFieldTexture(256);
    const plane = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshBasicMaterial({map: texture});
    const mesh = new THREE.Mesh(plane, material);
    fieldScene.add(mesh);
}

function createSkyScene() {

    skyScene = new THREE.Scene();
    const texture = generateSkyTexture(4096);
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
    camera = createOrthographicCamera(0, 0, 5, 0, 0, 0, 0.1, 1000, 1/150);

    // Create scene, keep track of time and add event listeners
    createFieldScene();
    createSkyScene();
    document.addEventListener('keydown', onKeyDown);
}

//////////////////////////////////
/* TEXTURE GENERATION FUNCTIONS */
//////////////////////////////////

function generateFieldTexture(size) {

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    // Fill canvas background with green
    ctx.fillStyle = '#0f874b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Field circles colors: white, yellow, lavender, light-blue
    const colors = ['#ffffff', '#ffffcc', '#d6c2f0', '#a3c9ff'];
    // Generate 50 circles
    let circles = [];
    A: for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 5 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        // Make sure the new circle does not clip the edges
        if (x - r <= 0 || x + r >= canvas.width || y - r <= 0 || y + r >= canvas.height) {
            i--;
            continue;
        }
        // Make sure the new circle does not overlap with previous ones
        for (let circle of circles) {
            const xDiff = x - circle.x;
            const yDiff = y - circle.y;
            const dist = Math.sqrt(xDiff ** 2 + yDiff ** 2);
            if (dist <= r + circle.r) {
                i--;
                continue A;
            }
        }
        // If everything is fine, draw the circle
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        circles.push({x: x, y: y, r: r});
    }
    exportTexture(canvas, 'field.png');
    return new THREE.CanvasTexture(canvas);
}

function generateSkyTexture(size) {

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    // Fill canvas background with gradient from dark-blue to dark-violet
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#04048a');
    gradient.addColorStop(1, '#4b0082');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars color: white
    ctx.fillStyle = '#ffffff';
    // Generate 500 stars
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 3 + 1;
        // Make sure the new circle does not surpass the margins
        if (x - r < 6 || x + r > canvas.width - 6 || y - r < 6 || y + r > canvas.height + 6) {
            i--;
            continue;
        }
        // If everything is fine, draw the circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    exportTexture(canvas, 'sky.png');
    return new THREE.CanvasTexture(canvas);
}

function exportTexture(canvas, filename) {

    let downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', '../textures/' + filename);
    canvas.toBlob(function(blob) {
        let url = URL.createObjectURL(blob);
        downloadLink.setAttribute('href', url);
        downloadLink.click();
    });
}

/////////////
/* DISPLAY */
/////////////

function render() {

    if (scenes.field)
        texRenderer.render(fieldScene, camera);
    else if (scenes.sky)
        texRenderer.render(skyScene, camera);
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
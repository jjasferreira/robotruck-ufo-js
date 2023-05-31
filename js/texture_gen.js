// Create a scene, camera, and renderer
let flowerScene, skyScene;
let camera, renderer;

let currentScene = {field : true, sky : false}

// plane
let planeMesh;

// Materials
let fieldMaterial, skyMaterial;

// Variables for field and sky textures
let fieldTexture, skyTexture;


function createFlowerScene() {
    flowerScene = new THREE.Scene();
    // Initial texture generation
    fieldTexture = generateFieldTexture();
    // create a plane for displaying the textures
    let planeGeometry = new THREE.PlaneGeometry(8, 8);
    fieldMaterial = new THREE.MeshBasicMaterial({map: fieldTexture});
    planeMesh = new THREE.Mesh(planeGeometry, fieldMaterial);
    flowerScene.add(planeMesh);
}

function createSkyScene() {
    skyScene = new THREE.Scene();
    // Texture generation
    skyTexture = generateSkyTexture();
    let planeGeometry = new THREE.PlaneGeometry(5, 5);
    skyMaterial = new THREE.MeshBasicMaterial({map: skyTexture});
    planeMesh = new THREE.Mesh(planeGeometry, skyMaterial);
    skyScene.add(planeMesh);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function init() {
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera = createPerspectiveCamera(0, 0, 5, 0, 0, 0, 0.1, 1000, 75)
    //camera = createOrthographicCamera(0, 0, 5, 0, 0, 0, 0.1, 1000)
    // TODO why does this look fucked up?

    createFlowerScene();
    createSkyScene();

    // Set up keyboard event listeners
    document.addEventListener('keydown', onKeyDown);
    render();

    //export textures to files
    //exportTextures();
}

// Function to generate the field texture
function generateFieldTexture() {
    let canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    let ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#79d021'; // grass green
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Flower circles
    let colors = ['#ffffff', '#ffffcc', '#d6c2f0', '#a3c9ff']; // White, Yellow, Lavender, Light-blue
    for (let i = 0; i < 200; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let radius = Math.random() * 5 + 2;
        let color = colors[Math.floor(Math.random() * colors.length)];

        // make sure the circles don't clip the edges
        if (x - radius < 0 || x + radius > canvas.width || y - radius < 0 || y + radius > canvas.height) {
            i--;
            continue;
        }

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
}

// Function to generate the sky texture
function generateSkyTexture() {
    let canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    let ctx = canvas.getContext('2d');

    // Background gradient
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#06068a'); // Dark-blue
    gradient.addColorStop(1, '#4b0082'); // Dark-violet
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#ffffff'; // White
    for (let i = 0; i < 200; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let radius = Math.random() * 3 + 1;

        if (x - radius < 6 || x + radius > canvas.width - 6 || y - radius < 6 || y + radius > canvas.height + 6) {
            i--;
            continue;
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
}

// Render function
function render() {
    if (currentScene.field) {
        renderer.render(flowerScene, camera);
    } else if (currentScene.sky) {
        renderer.render(skyScene, camera);
    }
}

// Keyboard event listener
function onKeyDown(event) {
    if (event.key === '1') {
        currentScene.field = true;
        currentScene.sky = false;
    } else if (event.key === '2') {
        currentScene.field = false;
        currentScene.sky = true;
    }
}

function createPerspectiveCamera(x, y, z, lx, ly, lz, near, far, fov) {
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(x, y, z);
    camera.lookAt(lx, ly, lz);
    return camera;
}

function createOrthographicCamera(x, y, z, lx, ly, lz, near, far) {
    const width = 5 * window.innerWidth/6;
    const height = 5 * window.innerHeight/6;
    const camera = new THREE.OrthographicCamera(-width, width, height, -height, near, far);
    camera.position.set(x, y, z);
    camera.lookAt(lx, ly, lz);
    return camera;
}

function exportTextures() {
    // TODO, check this link: https://stackoverflow.com/questions/11112321/how-to-save-canvas-as-png-image
}
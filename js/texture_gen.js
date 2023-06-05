
// Create a scene, camera, and renderer
let flowerScene, skyScene;
let camera, renderer_textures;

let scenes = {field : true, sky : false}

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
    renderer_textures = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer_textures.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer_textures.domElement);

    camera = createPerspectiveCamera(0, 0, 5, 0, 0, 0, 0.1, 1000, 75)
    //camera = createOrthographicCamera(0, 0, 5, 0, 0, 0, 0.1, 1000)

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
    const canvas_width = 256;
    const canvas_height = 256;
    canvas.width = canvas_width;
    canvas.height = canvas_height;
    let ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0f874b'; // grass green
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Flower circles
    let colors = ['#ffffff', '#ffffcc', '#d6c2f0', '#a3c9ff']; // White, Yellow, Lavender, Light-blue

    let prevCircles = [];
    for (let i = 0; i < 50; i++) {
        let x = Math.random() * canvas_width;
        let y = Math.random() * canvas_height;
        let radius = Math.random() * 5 + 2;
        let color = colors[Math.floor(Math.random() * colors.length)];

        let invalid = false;
        // make sure the circles don't clip the edges
        if (x - radius < 0 || x + radius > canvas.width || y - radius < 0 || y + radius > canvas.height) {
            i--;
            invalid = true;
        }

        // make sure the circles don't overlap
        for (let j = 0; j < prevCircles.length && invalid === false; j++) {
            let prevCircle = prevCircles[j];
            let xDiff = x - prevCircle.x;
            let yDiff = y - prevCircle.y;
            let dist = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
            if (dist < radius + prevCircle.radius) {
                invalid = true;
                i--;
            }
        }
        if (!invalid) {

            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            prevCircles.push({x: x, y: y, radius: radius});
        }
    }
    exportTexture(canvas, 'field.png');

    return new THREE.CanvasTexture(canvas);
}

// Function to generate the sky texture
function generateSkyTexture() {
    let canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 4096;
    let ctx = canvas.getContext('2d');

    // Background gradient
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#04048a'); // Dark-blue
    gradient.addColorStop(1, '#4b0082'); // Dark-violet
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#ffffff'; // White
    for (let i = 0; i < 500; i++) {
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

    exportTexture(canvas, 'sky.png');
    return new THREE.CanvasTexture(canvas);
}

// Render function
function render() {
    if (scenes.field) {
        renderer_textures.render(flowerScene, camera);
    } else if (scenes.sky) {
        renderer_textures.render(skyScene, camera);
    }
}

// Keyboard event listener
function onKeyDown(event) {
    if (event.key === '1') {
        createFlowerScene();
        scenes.field = true;
        scenes.sky = false;
    } else if (event.key === '2') {
        createSkyScene();
        scenes.field = false;
        scenes.sky = true;
    }
}

function exportTexture(canvas, filename) {
    // TODO, check this link: https://stackoverflow.com/questions/11112321/how-to-save-canvas-as-png-image
    let downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', "../images/" + filename);
    canvas.toBlob(function(blob) {
      let url = URL.createObjectURL(blob);
      downloadLink.setAttribute('href', url);
      //downloadLink.click();
    });
}
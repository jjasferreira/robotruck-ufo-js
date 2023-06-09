
///////////////////////////////
/* CREATE AND UPDATE CAMERAS */
///////////////////////////////

function createOrthographicCamera(x, y, z, lx, ly, lz, near, far, scale) {

    const width = scale * window.innerWidth;
    const height = scale * window.innerHeight;
    const camera = new THREE.OrthographicCamera(-width, width, height, -height, near, far);
    camera.position.set(x, y, z);
    camera.lookAt(lx, ly, lz);
    return camera;
}

function updateOrthographicCamera(camera, scale) {

    const width = scale * window.innerWidth;
    const height = scale * window.innerHeight;
    camera.left = -width;
    camera.right = width;
    camera.top = height;
    camera.bottom = -height;
    camera.updateProjectionMatrix();
}

function createPerspectiveCamera(x, y, z, lx, ly, lz, near, far, fov) {

    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(x, y, z);
    camera.lookAt(lx, ly, lz);
    return camera;
}

function updatePerspectiveCamera(camera) {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

////////////////////////////////////
/* CREATE OBJECT3D AND GEOMETRIES */
////////////////////////////////////

function createObject3D(parent, x = 0, y = 0, z = 0) {

    const obj3D = new THREE.Object3D();
    obj3D.position.set(x, y, z);
    parent.add(obj3D);
    return obj3D;
}

function createMesh(type, parameters, material, parent, x = 0, y = 0, z = 0, rAxis = null, rAngle = null) {

    // Create geometry based on the type
    let geometry;
    if (type === 'box')
        geometry = new THREE.BoxGeometry(...parameters);
    else if (type === 'cyl')
        geometry = new THREE.CylinderGeometry(...parameters, 16);
    else if (type === 'sph')
        geometry = new THREE.SphereGeometry(...parameters, 16, 16);
    else if (type === 'ell') {
        geometry = new THREE.SphereGeometry(parameters[0], 16, 16);
        geometry.applyMatrix(new THREE.Matrix4().makeScale(parameters[1], parameters[2], parameters[3]));
    }
    else if (type == 'buf') {
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(parameters[0], 3));
        geometry.setIndex(parameters[1]);
        geometry.computeVertexNormals();
    }
    // Create mesh with the specified material
    const mesh = new THREE.Mesh(geometry, material);
    // Create edges and add them to the mesh and to the edges array
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    mesh.add(edges);
    // Apply rotation if specified
    if (rAxis !== null && rAngle !== null)
        mesh.rotateOnAxis(rAxis, rAngle);
    // Set position and add to parent
    mesh.position.set(x, y, z);
    parent.add(mesh);
    // Add ability to cast and receive shadow
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

//////////////////////////////////
/* TEXTURE GENERATION FUNCTIONS */
//////////////////////////////////

function generateFieldTexture(size, exp = false) {

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    // Fill canvas background with green
    ctx.fillStyle = '#49b037';
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
    if (exp)
        exportTexture(canvas, 'field.png');
    return canvas;
}

function generateTerrainTexture(size, exp = false) {

    // If size is too small, throw error and return
    if (size * 10 < 256) {
        console.error("Terrain texture size too small. Minimum size is 256.");
        return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = size * 10;
    canvas.height = size * 10;
    const ctx = canvas.getContext('2d');
    let texture = generateFieldTexture(size);
    // Since three js does not allow textures and heightmaps to have independent repeat settings, we are using a canvas
    // to draw the texture as intended, which allows us to rotate the textures, making them even more seamless
    for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
            // Add random rotation in multiples of 90 degrees and translation
            const rotation = (Math.floor(Math.random() * 4)) * 90;
            ctx.save();
            // Translate to the center of the image and apply the rotation
            ctx.translate((x * size) + (size / 2), (y * size) + (size / 2));
            ctx.rotate((Math.PI / 180) * rotation);
            // Draw the image and restore the saved state of the context
            ctx.drawImage(texture, -(size / 2), -(size/ 2), size, size);
            ctx.restore();
        }
    }
    if (exp)
        exportTexture(canvas, 'terrain.png');
    return canvas;
}

function generateSkyTexture(size, exp = false) {

    // If size is too small, throw error and return
    if (size < 256) {
        console.error("Sky texture size too small. Minimum size is 256.");
        return;
    }
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
    // Generate 500 stars (it does not matter if stars overlap)
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
    if (exp)
        exportTexture(canvas, 'sky.png');
    return canvas;
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

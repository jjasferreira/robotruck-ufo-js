
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

function createStereoCamera(eyeSeparation) {

    const camera = new THREE.StereoCamera();
    camera.eyeSep = eyeSeparation;
    return camera;
}

function updateStereoCamera(camera) {

        camera.update(camera.cameraL, camera.cameraR);
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

function createGeometry(type, parameters, material, parent, x = 0, y = 0, z = 0, rAxis = null, rAngle = null) {

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
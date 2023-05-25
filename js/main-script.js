'use strict';   // Applies to all of script
// TODO: add dark edges to components would look pretty cool

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene, renderer;

let previousTime = 0, currentTime = 0;

// Cameras
let camera;
const cameras = {front: null, side: null, top: null, iso: null, persp: null};

// Keys
let keys = {};

// Materials
const colors = {
    grey: 0x808080, beige: 0xe8beac, white: 0xffffff, red: 0xff0000, darkgreen: 0x035f53, amber: 0xffae42,
    darkgrey: 0x5a5a5a, lightblue: 0x3492da, darkblue: 0x3630a6, lime: 0xdac134, salmon: 0xff606b, black: 0x222222
};
let m = {};

// Rotation axes
const rAxes = {x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1)};

// RoboTruck's Object3Ds
let torso3D, head3D, lArm3D, rArm3D, abdomen3D, waist3D, thighs3D, legs3D, boots3D;

// Trailer's Object3Ds
let trailer3D, lLatch3D, rLatch3D, plate3D, chassis3D;

// RoboTruck's and Trailer's dimensions
const d = {
    torsoW: 240, torsoH: 160, torsoD: 160, headW: 80, headH: 80, headD: 80, eyeW: 20, eyeH: 40/3, eyeD: 10,
    antennaW: 40/3, antennaH: 40, antennaD: 40/3, uArmW: 80, uArmH: 160, uArmD: 80, pipeR: 10, pipeH: 120, lArmW: 80,
    lArmH: 80, lArmD: 240, abdomenW: 80, abdomenH: 80, abdomenD: 160, waistW: 240, waistH: 80, waistD: 120, wheelR: 40,
    wheelH: 40, thighW: 40, thighH: 120, thighD: 40, legW: 80, legH: 320, legD: 80,
    socketW: 40, socketH: 40, socketD: 40, bootW: 80, bootH: 40, bootD: 60,
    bodyW: 240, bodyH: 280, bodyD: 1160, couplerW: 80, couplerH: 40, couplerD: 120, latchW: 40, latchH: 40, latchD: 40,
    plateW: 240, plateH: 40, plateD: 760, chassisW: 240, chassisH: 80, chassisD: 400
};

// Movements and Rotations
let movementSpeed = 0.5;
let armsOffset = 0;
let rotationSpeed = 0.008 * 20; // TODO when rotating we need to check the minimum between the intended rotation and what's left. If rotation speed is not a divisor of full rotation angle, we get stuck before the end
let head3DAngle = 0;
let thighs3DAngle = 0;
let boots3DAngle = 0;
let latches3DAngle = 0;

// Bounding Boxes
let robotruckAABB, trailerAABB;

// Animation phases
let coupling = false, inCouplingPosition = false;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////

function createScene() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF0EAD6);
    scene.fog = new THREE.FogExp2( 0xa9a9fc, 0.00025);
    // create robotruck, trailer and respective bounding boxes
    createMaterials();
    createRoboTruck();
    createRoboAABB();
    createTrailer();
    createTrailerAABB(trailer3D.position);
    // TODO: remove the axes helper later
    const axesHelper = new THREE.AxesHelper(300);
    scene.add(axesHelper);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createOrthographicCamera(x, y, z, near, far) {

    const width = window.innerWidth / 2;
    const height = window.innerHeight / 2;
    const camera = new THREE.OrthographicCamera(-width, width, height, -height, near, far);
    camera.position.set(x, y, z);
    camera.lookAt(scene.position);
    return camera;
}

function createPerspectiveCamera(x, y, z, near, far, fov) {

    const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);
    camera.position.set(x, y, z);
    camera.lookAt(scene.position);
    return camera;
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createObject3D(parent, x = 0, y = 0, z = 0) {

    const obj3D = new THREE.Object3D();
    obj3D.position.set(x, y, z);
    parent.add(obj3D);
    return obj3D;
}

function createMaterials() {

    for (const [name, color] of Object.entries(colors))
        m[name] = new THREE.MeshBasicMaterial({ color: color });
}

function createCube(w, h, d, material, rotAxis, parent, x = 0, y = 0, z = 0) {

    const geometry = new THREE.BoxGeometry(w, h, d);
    const cube = new THREE.Mesh(geometry, material);
    if (rotAxis !== null)
        cube.rotateOnAxis(rotAxis, Math.PI / 2);
    cube.position.set(x, y, z);
    parent.add(cube);
    return cube;
}

function createCylinder(rt, rb, h, material, rotAxis, parent, x = 0, y = 0, z = 0) {

    // TODO: should we do CylinderGeometry(rt, rb, h, 32) to make it look smoother?
    const geometry = new THREE.CylinderGeometry(rt, rb, h);
    const cylinder = new THREE.Mesh(geometry, material);
    if (rotAxis !== null)
        cylinder.rotateOnAxis(rotAxis, Math.PI / 2);
    cylinder.position.set(x, y, z);
    parent.add(cylinder);
    return cylinder;
}

function createRoboTruck() {

    // Torso 3D (parent: scene; children: torso, head 3D, arms 3Ds, abdomen 3D)
    torso3D = createObject3D(scene, 0, d.torsoH/2+d.abdomenH+d.waistH+d.wheelR/2, 0);
    createCube(d.torsoW, d.torsoH, d.torsoD, m.grey, null, torso3D);
    // Head 3D (parent: torso 3D; chirAxes.zen: head, eyes, antennas)
    head3D = createObject3D(torso3D, 0, d.torsoH/2, -d.torsoD/2);
    createCube(d.headW, d.headH, d.headD, m.beige, null, head3D, 0, d.headH/2, d.headD/2);
    createCube(d.eyeW, d.eyeH, d.eyeD, m.white, null, head3D, -d.headW/4, 3*d.headH/5, d.headD);
    createCube(d.eyeW, d.eyeH, d.eyeD, m.white, null, head3D, d.headW/4, 3*d.headH/5, d.headD);
    createCube(d.antennaW, d.antennaH, d.antennaD, m.red, null, head3D, -d.headW/4, d.headH, 0);
    createCube(d.antennaW, d.antennaH, d.antennaD, m.red, null, head3D, d.headW/4, d.headH, 0);
    // Arms 3Ds (parent: torso 3D; children: upper arms, exhaust pipes, lower arms)
    lArm3D = createObject3D(torso3D, -d.torsoW/2, 0, -d.torsoD/2);
    rArm3D = createObject3D(torso3D, d.torsoW/2, 0, -d.torsoD/2);
    createCube(d.uArmW, d.uArmH, d.uArmD, m.darkgreen, null, lArm3D, -d.uArmW/2, 0, -d.uArmD/2);
    createCube(d.uArmW, d.uArmH, d.uArmD, m.darkgreen, null, rArm3D, d.uArmW/2, 0, -d.uArmD/2);
    createCylinder(d.pipeR, d.pipeR, d.pipeH, m.grey, null, lArm3D, -d.pipeR-d.uArmW, 3*d.uArmH/8, d.pipeR-d.uArmD);
    createCylinder(d.pipeR, d.pipeR, d.pipeH, m.grey, null, rArm3D, d.pipeR+d.uArmW, 3*d.uArmH/8, d.pipeR-d.uArmD);
    createCube(d.lArmW, d.lArmH, d.lArmD, m.amber, null, lArm3D, -d.uArmW/2, -d.lArmH/2-d.uArmH/2, d.lArmD/2-d.uArmD);
    createCube(d.lArmW, d.lArmH, d.lArmD, m.amber, null, rArm3D, d.uArmW/2, -d.lArmH/2-d.uArmH/2, d.lArmD/2-d.uArmD);
    // Abdomen 3D (parent: torso 3D; children: abdomen, waist 3D)
    abdomen3D = createObject3D(torso3D, 0, -d.torsoH/2, 0);
    createCube(d.abdomenW, d.abdomenH, d.abdomenD, m.darkgreen, null, abdomen3D, 0, -d.abdomenH/2, 0);
    // Waist 3D (parent: abdomen 3D; children: waist, front wheels, thighs 3D)
    waist3D = createObject3D(abdomen3D, 0, -d.abdomenH, d.abdomenD/8);
    createCube(d.waistW, d.waistH, d.waistD, m.grey, null, waist3D, 0, -d.waistH/2, 0);
    createCylinder(d.wheelR, d.wheelR, d.wheelH, m.darkgrey, rAxes.z, waist3D, -d.wheelH/2-d.waistW/2, -3*d.waistH/4, 0);
    createCylinder(d.wheelR, d.wheelR, d.wheelH, m.darkgrey, rAxes.z, waist3D, d.wheelH/2+d.waistW/2, -3*d.waistH/4, 0);
    // Thighs 3D (parent: waist 3D; children: thighs, legs 3D)
    thighs3D = createObject3D(waist3D, 0, -d.waistH, -d.waistD/2);
    createCube(d.thighW, d.thighH, d.thighD, m.lightblue, null, thighs3D, -d.waistW/3, -d.thighH/2, -d.thighD/2);
    createCube(d.thighW, d.thighH, d.thighD, m.lightblue, null, thighs3D, d.waistW/3, -d.thighH/2, -d.thighD/2);
    // Legs 3D (parents: thighs 3D; children: legs, back wheels, trailer socket, boots 3D)
    legs3D = createObject3D(thighs3D, 0, -d.thighH, -d.thighD);
    createCube(d.legW, d.legH, d.legD, m.darkblue, null, legs3D, -d.waistW/3, -d.legH/2, 0);
    createCube(d.legW, d.legH, d.legD, m.darkblue, null, legs3D, d.waistW/3, -d.legH/2, 0);
    createCylinder(d.wheelR, d.wheelR, d.wheelH, m.darkgrey, rAxes.z, legs3D, -d.waistW/3-d.wheelH/2-d.legW/2, -7*d.legH/16, d.legD/4);
    createCylinder(d.wheelR, d.wheelR, d.wheelH, m.darkgrey, rAxes.z, legs3D, -d.waistW/3-d.wheelH/2-d.legW/2, -13*d.legH/16, d.legD/4);
    createCylinder(d.wheelR, d.wheelR, d.wheelH, m.darkgrey, rAxes.z, legs3D, d.waistW/3+d.wheelH/2+d.legW/2, -7*d.legH/16, d.legD/4);
    createCylinder(d.wheelR, d.wheelR, d.wheelH, m.darkgrey, rAxes.z, legs3D, d.waistW/3+d.wheelH/2+d.legW/2, -13*d.legH/16, d.legD/4);
    createCube(d.socketW, d.socketH, d.socketD, m.lime, null, legs3D, -d.waistW/3+d.legW/4, -5*d.legH/16, -3*d.socketD/2);
    createCube(d.socketW, d.socketH, d.socketD, m.lime, null, legs3D, d.waistW/3-d.legW/4, -5*d.legH/16, -3*d.socketD/2);
    // Boots 3D (parents: legs 3D; children: boots)
    boots3D = createObject3D(legs3D, 0, -d.legH, d.legD/2);
    createCube(d.bootW, d.bootH, d.bootD, m.grey, null, boots3D, -d.waistW/3, -d.bootH/2, d.bootD/2);
    createCube(d.bootW, d.bootH, d.bootD, m.grey, null, boots3D, d.waistW/3, -d.bootH/2, d.bootD/2);
}

function createTrailer() {

    // Trailer 3D (parent: scene; children: body, coupler, latches 3Ds, plate 3D)
    trailer3D = createObject3D(scene, 500, d.bodyH/2+d.plateH+d.chassisH+d.wheelR/2, -1250);
    createCube(d.bodyW, d.bodyH, d.bodyD, m.salmon, null, trailer3D);
    createCube(d.couplerW, d.couplerH, d.couplerD, m.grey, null, trailer3D, 0, -d.couplerH/2-d.bodyH/2, -5*d.couplerD/6+d.bodyD/2);
    // Latches 3Ds (parent: trailer 3D; children: latches)
    lLatch3D = createObject3D(trailer3D, -d.latchW, -d.latchH/2-d.bodyH/2, -d.latchD+d.bodyD/2);
    rLatch3D = createObject3D(trailer3D, d.latchW, -d.latchH/2-d.bodyH/2, -d.latchD+d.bodyD/2);
    createCube(d.latchW, d.latchH, d.latchD, m.black, null, lLatch3D, d.latchW/2, 0, d.latchD/2);
    createCube(d.latchW, d.latchH, d.latchD, m.black, null, rLatch3D, -d.latchW/2, 0, d.latchD/2);
    // Plate 3D (parent: trailer 3D; children: plate, chassis 3D)
    plate3D = createObject3D(trailer3D, 0, -d.bodyH/2, -d.bodyD/2);
    createCube(d.plateW, d.plateH, d.plateD, m.grey, null, plate3D, 0, -d.plateH/2, d.plateD/2);
    // Chassis 3D (parent: plate 3D; children: chassis, wheels)
    chassis3D = createObject3D(plate3D, 0, -d.plateH, 0);
    createCube(d.chassisW, d.chassisH, d.chassisD, m.black, null, chassis3D, 0, -d.chassisH/2, d.chassisD/2);
    createCylinder(d.wheelR, d.wheelR, d.wheelH, m.darkgrey, rAxes.z, chassis3D, -d.wheelH/2-d.chassisW/2, -3*d.chassisH/4, 3*d.chassisD/10);
    createCylinder(d.wheelR, d.wheelR, d.wheelH, m.darkgrey, rAxes.z, chassis3D, d.wheelH/2+d.chassisW/2, -3*d.chassisH/4, 3*d.chassisD/10);
    createCylinder(d.wheelR, d.wheelR, d.wheelH, m.darkgrey, rAxes.z, chassis3D, -d.wheelH/2-d.chassisW/2, -3*d.chassisH/4, 7*d.chassisD/10);
    createCylinder(d.wheelR, d.wheelR, d.wheelH, m.darkgrey, rAxes.z, chassis3D, d.wheelH/2+d.chassisW/2, -3*d.chassisH/4, 7*d.chassisD/10);
}

/////////////////////////////////////////
/* COLLISION AND BOUNDARIES FUNCTIONS */
/////////////////////////////////////////

function checkCollisions() {
    // check if trailer collides with robotruck
    return (
        robotruckAABB[0][0] <= trailerAABB[1][0] && //xmin_robo <= xmax_trailer
        robotruckAABB[1][0] >= trailerAABB[0][0] && //xmax_robo >= xmin_trailer
        robotruckAABB[0][1] <= trailerAABB[1][1] && //ymin_robo <= ymax_trailer
        robotruckAABB[1][1] >= trailerAABB[0][1] && //ymax_robo >= ymin_trailer
        robotruckAABB[0][2] <= trailerAABB[1][2] && //zmin_robo <= zmax_trailer
        robotruckAABB[1][2] >= trailerAABB[0][2] //zmax_robo >= zmin_trailer
      );
}

function checkBoundaries(position) {
    // constants needed
    let maxBoundary = 2000, minBoundary = -2000;
    // check if trailer excedes scene boundaries
    return (
        position.x > maxBoundary,
        position.x < minBoundary,
        position.z > maxBoundary,
        position.z < minBoundary
    );
} 

function createBoundingBox(xmin, ymin, zmin, xmax, ymax, zmax) {
    let min_point = [xmin, ymin, zmin];
    let max_point = [xmax, ymax, zmax];
    return [min_point, max_point];
}

function createRoboAABB() {
    // creates bounding box for robotruck in robot mode
    //constants needed
    const pipeR = 10, thighH = 120, legH = 320, bootH = 40, uArmW = 80, 
        headH = 80, antennaH = 40, torsoD = 160, uArmD = 80;
    robotruckAABB = createBoundingBox(lArm3D.position.x - uArmW - pipeR,
                                      thighs3D.position.y - thighH - legH - bootH,
                                      head3D.position.z - uArmD,
                                      rArm3D.position.x + uArmW + pipeR,
                                      head3D.position.y + headH + antennaH/2,
                                      head3D.position.z + torsoD);
}                                   

function createTruckAABB() {
    // creates bounding box for robotruck in truck mode
    // constants needed
    const wheelR = 40, thighH = 120, legH = 320, bootH = 40, uArmW = 80, 
        headH = 80, antennaH = 40, torsoD = 160;

    robotruckAABB = createBoundingBox(lArm3D.position.x - uArmW - wheelR,
                                      thighs3D.position.y - wheelR/2,
                                      thighs3D.position.z - thighH - legH - bootH,
                                      rArm3D.position.x + uArmW + wheelR, 
                                      head3D.position.y + headH + antennaH/2,
                                      head3D.position.z + torsoD);
}

function createTrailerAABB(position) {
    // constants needed for trailer AABB
    const bodyW = 240, bodyH = 280, bodyD = 1160, wheelR = 40, 
        plateH = 40, chassisH = 80;  
    //update trailer bounding box
    trailerAABB = createBoundingBox(position.x - bodyW/2 - wheelR,
                                    position.y - bodyH/2 - plateH - chassisH - wheelR/2,
                                    position.z - bodyD/2,
                                    position.x + bodyW/2 + wheelR,
                                    position.y + bodyH/2,
                                    position.z + bodyD/2); 
}

function isTruck() {
    const margin_pi = 0.02, margin_half_pi = 0.01; 
    return head3DAngle >= Math.PI - margin_pi && 
           thighs3DAngle >= Math.PI/2 - margin_half_pi && 
           boots3DAngle >= Math.PI/2 - margin_half_pi; 
}

function updateRobotruckAABB() {
    if (isTruck())
        createTruckAABB();
    else
        createRoboAABB();
}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////

function handleCollisions() {
    // if is in truck mode, begin coupling animation
    if (isTruck()) {
        coupling = true;
    }
}

////////////
/* UPDATE */
////////////

function update(delta) {
    let tentPosition;
    if (!coupling) {
        for (let k in keys) {
            if (keys[k] === true) {
                switch (k) {
                    // Head Rotation Controls (keys R, F)
                    case "82": // R
                    case "114": // r
                        rotateHead(rotationSpeed * 2, delta);
                        break;
                    case "70": // F
                    case "102": // f
                        rotateHead(-rotationSpeed * 2, delta);
                        break;
                    // Arms Movement Controls (keys E, D)
                    case "69": // E
                    case "101": // e
                        moveArms(movementSpeed, delta);
                        break;
                    case "68": // D
                    case "100": // d
                        moveArms(-movementSpeed, delta);
                        break;
                    // Thighs Rotation Controls (keys W, S)
                    case "87": // W
                    case "119": // w
                        rotateThighs(rotationSpeed, delta);
                        break;
                    case "83": // S
                    case "115": // s
                        rotateThighs(-rotationSpeed, delta);
                        break;
                    // Boots Rotation Controls (keys Q, A)
                    case "81": // Q
                    case "113": // q
                        rotateBoots(rotationSpeed, delta);
                        break;
                    case "65": // A
                    case "97": // a
                        rotateBoots(-rotationSpeed, delta);
                        break;
                    // Trailer Movement Controls (keys left, right, down, up)
                    case "37": // left
                        tentPosition = checkMoveTrailer("x", movementSpeed * 20, delta);
                        executeMoveTrailer(tentPosition);
                        break;
                    case "39": // right
                        tentPosition = checkMoveTrailer("x", -movementSpeed * 20, delta);
                        executeMoveTrailer(tentPosition);
                        break;
                    case "40": // down
                        tentPosition = checkMoveTrailer("z", movementSpeed * 20, delta);
                        executeMoveTrailer(tentPosition);
                        break;
                    case "38": // up
                        tentPosition = checkMoveTrailer("z", -movementSpeed * 20, delta);
                        executeMoveTrailer(tentPosition);
                        break;
                    // Latches Rotation Controls (keys H, Y)
                    case "72": // H
                    case "104": // h
                        rotateLatches(rotationSpeed, delta);
                        break;
                    case "89": // Y
                    case "121": // y
                        rotateLatches(-rotationSpeed, delta);
                } 
            }
        }
    } else {
        if (!inCouplingPosition) { // move andrew tate latches
            moveTrailerToCouplingPosition();
        } else {
            console.log("coupling");
            doCouplingAnimation(delta);
        }
    }
    // check if robotruck is in robo or truck mode to update AABB
    updateRobotruckAABB();
}


function doCouplingAnimation(delta) {
    //bring the z position to -780
    let positionZ = trailer3D.position.z;
    if (positionZ < -780) {
        let deltaZ = Math.min(20, Math.abs(-780 - trailer3D.position.z));
        trailer3D.position.z += deltaZ;
    } else {
        rotateLatches(rotationSpeed, delta)
    }
}

function moveTrailerToCouplingPosition() {
    // if z position is not 1080, update by 20 or 1080 - z, whichever is smaller
    let positionZ = trailer3D.position.z;
    let positionX = trailer3D.position.x;
    let deltaZ = Math.min(20, Math.abs(-1060 - trailer3D.position.z));
    let deltaX = Math.min(20, Math.abs(0 - trailer3D.position.x));
    if (positionZ < -1060)
        trailer3D.position.z += deltaZ;
    else if (positionZ > -1060)
        trailer3D.position.z -= deltaZ;
    else if (positionX < 0)
        trailer3D.position.x += deltaX;
    else if (positionX > 0)
        trailer3D.position.x -= deltaX;
    else {
        inCouplingPosition = true;
    }
}

/////////////
/* DISPLAY */
/////////////

function render() {

    renderer.render(scene, camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////

function init() {

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();

    // Create all cameras and set default camera
    cameras.front = createOrthographicCamera(0, 0, 500, 0, 5000);
    cameras.side = createOrthographicCamera(500, 0, 0, 0, 5000);
    cameras.top = createOrthographicCamera(0, 500, 0, 0, 5000);
    cameras.iso = createOrthographicCamera(500, 500, 500, 0, 5000);
    cameras.persp = createPerspectiveCamera(500, 500, 750, 0, 5000, 80);
    camera = cameras.front;

    previousTime = performance.now();

    // TODO: remove this controls line later
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    // disable arrow keys for camera controls
    controls.keys = {
        LEFT: null, //left arrow
        UP: null, // up arrow
        RIGHT: null, // right arrow
        BOTTOM: null // down arrow
    }

    render();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('keyup', onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////

function animate() {

    requestAnimationFrame(animate);
    currentTime = performance.now();
    let delta = (currentTime - previousTime) / 20;
    previousTime = currentTime;
    update(delta);
    render();
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////

function onResize() {

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

    switch (e.keyCode) {
        // Camera Controls (keys 1, 2, 3, 4, 5)
        case 49: // 1
            camera = cameras.front;
            let controls = new THREE.OrbitControls(camera, renderer.domElement);
            break;
        case 50: // 2
            camera = cameras.side;
            break;
        case 51: // 3
            camera = cameras.top;
            break;
        case 52: // 4
            camera = cameras.iso;
            break;
        case 53: // 5
            camera = cameras.persp;
            break;
        // Visual Representation Controls (key 6)
        case 54: // 6
            m.forEach(function (material) {
                material.wireframe = !material.wireframe;
            });
            break;
        default:
            keys[e.keyCode] = true;
    }
}

/////////////////////
/* KEY UP CALLBACK */
/////////////////////

function onKeyUp(e) {

    // Ignore 1 to 6 keys because they are used for camera switching
    if (e.keyCode >= 49 && e.keyCode <= 54)
        return;
    keys[e.keyCode] = false;
}

/////////////////////////////////////
/* MOVEMENT AND ROTATION FUNCTIONS */
/////////////////////////////////////

function rotateHead(speed, delta) {
    const target = speed > 0 ? Math.PI : 0;
    if (target - head3DAngle < speed * delta) {
        head3D.rotation.x = target;
        head3DAngle = target;
    }
    if ((speed > 0 && head3DAngle + speed <= target) || (speed < 0 && head3DAngle + speed >= target)) {
        head3D.rotation.x -= speed * delta;
        head3DAngle += speed * delta;
    }
}

function moveArms(speed, delta) {
    const target = speed > 0 ? 80 : 0;
    if (target - armsOffset < speed * delta) {
        lArm3D.position.x = target;
        rArm3D.position.x = -target;
        armsOffset = target;
    }
    if ((speed > 0 && armsOffset + speed <= target) || (speed < 0 && armsOffset + speed >= target)) {
        lArm3D.position.x += speed * delta;
        rArm3D.position.x -= speed * delta;
        armsOffset += speed * delta;
    }
}

function rotateThighs(speed, delta) {
    const target = speed > 0 ? Math.PI / 2 : 0;
    if (target - thighs3DAngle < speed * delta) {
        thighs3D.rotation.x = target;
        thighs3DAngle = target;
    }
    if ((speed > 0 && thighs3DAngle + speed <= target) || (speed < 0 && thighs3DAngle + speed >= target)) {
        thighs3D.rotation.x += speed * delta;
        thighs3DAngle += speed * delta;
    }
}

function rotateBoots(speed, delta) {
    const target = speed > 0 ? Math.PI / 2 : 0;
    if (target - boots3DAngle < speed * delta) {
        boots3D.rotation.x = target;
        boots3DAngle = target;
    }
    if ((speed > 0 && boots3DAngle + speed <= target) || (speed < 0 && boots3DAngle + speed >= target)) {
        boots3D.rotation.x += speed * delta;
        boots3DAngle += speed * delta;
    }
}

function checkMoveTrailer(axis, speed, delta) {
    let tentativePosition = Object.assign({}, trailer3D.position);
    if (speed !== 0 && axis === "x")
        tentativePosition.x -= speed * delta;
    else
        tentativePosition.z += speed * delta;
    return tentativePosition;
}

function executeMoveTrailer(position) {
    createTrailerAABB(position);
    // if there is a collision and is in truck mode, set coupling to true
    if (checkCollisions() && isTruck())
        coupling = true;
    // if there are no collisions move trailer
    if (!checkCollisions() && !checkBoundaries(position))
        trailer3D.position.set(position.x, position.y, position.z);
}

function rotateLatches(speed, delta) {
    const target = speed > 0 ? Math.PI/2 : 0;
    if ((speed > 0 && latches3DAngle + speed <= target) || (speed < 0 && latches3DAngle + speed >= target)) {
        lLatch3D.rotation.y -= speed * delta;
        rLatch3D.rotation.y += speed * delta;
        latches3DAngle += speed * delta;
    }
    if (latches3DAngle === target)
        coupling = false;
}

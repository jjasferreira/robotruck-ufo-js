'use strict';   // Applies to all of script

/*
    *  RoboTruck - key bindings:
    * - '1' - change camera to front view
    * - '2' - change camera to side view
    * - '3' - change camera to top view
    * - '4' - change camera to isometric view
    * - '5' - change camera to perspective view
    * - 'C' - toggle camera controls
    * - '6' - toggle wireframe mode
    * - '7' - toggle edges visibility
    * - '8' - toggle bounding boxes visibility
    * - '9' - toggle axes helper visibility
    * - 'R/F' - rotate RoboTruck's head
    * - 'E/D' - move RoboTruck's arms
    * - 'W/S' - rotate RoboTruck's thighs
    * - 'Q/A' - rotate RoboTruck's boots
    * - '←/→' - move Trailer on x-axis
    * - '↑/↓' - move Trailer on z-axis
    * - 'Z' - reset Trailer's position and lathes rotation
 */

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene, renderer;

let previousTime = 0, currentTime = 0;

// Cameras
let camera;
const cameras = {front: null, side: null, top: null, iso: null, persp: null};
let controls;

// Keys
let keys = {};

// Colors, materials and geometry edges
const colors = {
    eggshell: 0xf0ead6, fog: 0x656597, grey: 0x999999, beige: 0xe8beac, white: 0xffffff, red: 0xff0000,
    darkgreen: 0x035f53, amber: 0xffae42, darkgrey: 0x404040, lightblue: 0x3492da, darkblue: 0x3630a6,
    lime: 0x94cc1d, salmon: 0xff606b, black: 0x333333
};
let m = {};
let edgesMaterial;
let boundingBoxesMaterial;

// Axes Helper and all Rotation Axes
let axesHelper;
let isAxesHelperVisible = false;
let rAxes = {};

// RoboTruck's Object3Ds
let torso3D, head3D, lArm3D, rArm3D, abdomen3D, waist3D, thighs3D, legs3D, boots3D;

// Trailer's Object3Ds
let body3D, lLatch3D, rLatch3D, plate3D, chassis3D;

// RoboTruck's and Trailer's dimensions
const d = {
    torsoW: 240, torsoH: 160, torsoD: 160, headW: 80, headH: 80, headD: 80, eyeW: 20, eyeH: 40/3, eyeD: 10,
    antennaW: 40/3, antennaH: 40, antennaD: 40/3, uppArmW: 80, uppArmH: 160, uppArmD: 80, pipeR: 10, pipeH: 120, lowArmW: 80,
    lowArmH: 80, lowArmD: 240, abdomenW: 80, abdomenH: 80, abdomenD: 160, waistW: 240, waistH: 80, waistD: 120, wheelR: 40,
    wheelH: 40, thighW: 40, thighH: 120, thighD: 40, legW: 80, legH: 320, legD: 80,
    socketW: 40, socketH: 40, socketD: 40, bootW: 80, bootH: 40, bootD: 60,
    bodyW: 240, bodyH: 280, bodyD: 1160, couplerW: 80, couplerH: 40, couplerD: 120, latchW: 40, latchH: 40, latchD: 40,
    plateW: 240, plateH: 40, plateD: 760, chassisW: 240, chassisH: 80, chassisD: 400
};

// Movements and Rotations
let movementSpeed = 5;
let armsOffset = 0;
let rotationSpeed = 0.1;
let head3DAngle = 0;
let thighs3DAngle = 0;
let boots3DAngle = 0;
let latches3DAngle = 0;

// Bounding Boxes
let roboTruckAABB, trailerAABB;
let roboTruckBoundingBox, trailerBoundingBox;

// Animation phases
let coupling = false, trailerBehindTruck = false;
let latchesLocked = false, unlockingLatches = false;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////

function createScene() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.eggshell);
    scene.fog = new THREE.FogExp2(colors.fog, 0.00025);

    // Create RoboTruck, Trailer and respective bounding boxes
    createMaterials();
    createRoboTruck();
    updateRoboTruckAABB();
    createTrailer();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createOrthographicCamera(x, y, z, lx, ly, lz, near, far) {

    const width = 5*window.innerWidth/6;
    const height = 5*window.innerHeight/6;
    const camera = new THREE.OrthographicCamera(-width, width, height, -height, near, far);
    camera.position.set(x, y, z);
    camera.lookAt(lx, ly, lz);
    return camera;
}

function updateOrthographicCamera(camera) {

    const width = 3*window.innerWidth/4;
    const height = 3*window.innerHeight/4;
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

    // Boxes and Cylinders materials
    for (const [name, color] of Object.entries(colors))
        m[name] = new THREE.MeshBasicMaterial({ color: color, wireframe: false });
    // Edges material
    edgesMaterial = new THREE.LineBasicMaterial({ color: colors.black, visible: false });
    boundingBoxesMaterial = new THREE.LineBasicMaterial({ color: colors.red, visible: false });
}

function createGeometry(type, parameters, material, rotAxis, parent, x = 0, y = 0, z = 0) {

    // Create geometry based on the type
    let geometry;
    if (type === 'box')
        geometry = new THREE.BoxGeometry(...parameters);
    else if (type === 'cyl')
        geometry = new THREE.CylinderGeometry(...parameters, 16);
    // Create mesh with the specified material
    const mesh = new THREE.Mesh(geometry, material);
    // Create edges and add them to the mesh and to the edges array
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    mesh.add(edges);
    // Apply rotation if specified
    if (rotAxis !== null)
        mesh.rotateOnAxis(rotAxis, Math.PI / 2);
    // Set position and add to parent
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
}

function createRoboTruck() {

    // Torso 3D (parent: scene; children: torso, head 3D, arms 3Ds, abdomen 3D)
    torso3D = createObject3D(scene, 0, d.torsoH/2+d.abdomenH+d.waistH+d.wheelR/2, 0);
    createGeometry('box', [d.torsoW, d.torsoH, d.torsoD], m.grey, null, torso3D);
    // Head 3D (parent: torso 3D; children: head, eyes, antennas)
    head3D = createObject3D(torso3D, 0, d.torsoH/2, -d.torsoD/2);
    createGeometry('box', [d.headW, d.headH, d.headD], m.beige, null, head3D, 0, d.headH/2, d.headD/2);
    createGeometry('box', [d.eyeW, d.eyeH, d.eyeD], m.white, null, head3D, -d.headW/4, 3*d.headH/5, d.headD);
    createGeometry('box', [d.eyeW, d.eyeH, d.eyeD], m.white, null, head3D, d.headW/4, 3*d.headH/5, d.headD);
    createGeometry('box', [d.antennaW, d.antennaH, d.antennaD], m.red, null, head3D, -d.headW/4, d.headH, 0);
    createGeometry('box', [d.antennaW, d.antennaH, d.antennaD], m.red, null, head3D, d.headW/4, d.headH, 0);
    // Arms 3Ds (parent: torso 3D; children: upper arms, exhaust pipes, lower arms)
    lArm3D = createObject3D(torso3D, -d.torsoW/2, 0, -d.torsoD/2);
    rArm3D = createObject3D(torso3D, d.torsoW/2, 0, -d.torsoD/2);
    createGeometry('box', [d.uppArmW, d.uppArmH, d.uppArmD], m.darkgreen, null, lArm3D, -d.uppArmW/2, 0, -d.uppArmD/2);
    createGeometry('box', [d.uppArmW, d.uppArmH, d.uppArmD], m.darkgreen, null, rArm3D, d.uppArmW/2, 0, -d.uppArmD/2);
    createGeometry('cyl', [d.pipeR, d.pipeR, d.pipeH], m.grey, null, lArm3D, -d.pipeR-d.uppArmW, 3*d.uppArmH/8, d.pipeR-d.uppArmD);
    createGeometry('cyl', [d.pipeR, d.pipeR, d.pipeH], m.grey, null, rArm3D, d.pipeR+d.uppArmW, 3*d.uppArmH/8, d.pipeR-d.uppArmD);
    createGeometry('box', [d.lowArmW, d.lowArmH, d.lowArmD], m.amber, null, lArm3D, -d.uppArmW/2, -d.lowArmH/2-d.uppArmH/2, d.lowArmD/2-d.uppArmD);
    createGeometry('box', [d.lowArmW, d.lowArmH, d.lowArmD], m.amber, null, rArm3D, d.uppArmW/2, -d.lowArmH/2-d.uppArmH/2, d.lowArmD/2-d.uppArmD);
    // Abdomen 3D (parent: torso 3D; children: abdomen, waist 3D)
    abdomen3D = createObject3D(torso3D, 0, -d.torsoH/2, 0);
    createGeometry('box', [d.abdomenW, d.abdomenH, d.abdomenD], m.darkgreen, null, abdomen3D, 0, -d.abdomenH/2, 0);
    // Waist 3D (parent: abdomen 3D; children: waist, front wheels, thighs 3D)
    waist3D = createObject3D(abdomen3D, 0, -d.abdomenH, d.abdomenD/8);
    createGeometry('box', [d.waistW, d.waistH, d.waistD], m.grey, null, waist3D, 0, -d.waistH/2, 0);
    createGeometry('cyl', [d.wheelR, d.wheelR, d.wheelH], m.darkgrey, rAxes.z, waist3D, -d.wheelH/2-d.waistW/2, -3*d.waistH/4, 0);
    createGeometry('cyl', [d.wheelR, d.wheelR, d.wheelH], m.darkgrey, rAxes.z, waist3D, d.wheelH/2+d.waistW/2, -3*d.waistH/4, 0);
    // Thighs 3D (parent: waist 3D; children: thighs, legs 3D)
    thighs3D = createObject3D(waist3D, 0, -d.waistH, -d.waistD/2);
    createGeometry('box', [d.thighW, d.thighH, d.thighD], m.lightblue, null, thighs3D, -d.waistW/3, -d.thighH/2, -d.thighD/2);
    createGeometry('box', [d.thighW, d.thighH, d.thighD], m.lightblue, null, thighs3D, d.waistW/3, -d.thighH/2, -d.thighD/2);
    // Legs 3D (parents: thighs 3D; children: legs, back wheels, trailer socket, boots 3D)
    legs3D = createObject3D(thighs3D, 0, -d.thighH, -d.thighD);
    createGeometry('box', [d.legW, d.legH, d.legD], m.darkblue, null, legs3D, -d.waistW/3, -d.legH/2, 0);
    createGeometry('box', [d.legW, d.legH, d.legD], m.darkblue, null, legs3D, d.waistW/3, -d.legH/2, 0);
    createGeometry('cyl', [d.wheelR, d.wheelR, d.wheelH], m.darkgrey, rAxes.z, legs3D, -d.waistW/3-d.wheelH/2-d.legW/2, -7*d.legH/16, d.legD/4);
    createGeometry('cyl', [d.wheelR, d.wheelR, d.wheelH], m.darkgrey, rAxes.z, legs3D, -d.waistW/3-d.wheelH/2-d.legW/2, -13*d.legH/16, d.legD/4);
    createGeometry('cyl', [d.wheelR, d.wheelR, d.wheelH], m.darkgrey, rAxes.z, legs3D, d.waistW/3+d.wheelH/2+d.legW/2, -7*d.legH/16, d.legD/4);
    createGeometry('cyl', [d.wheelR, d.wheelR, d.wheelH], m.darkgrey, rAxes.z, legs3D, d.waistW/3+d.wheelH/2+d.legW/2, -13*d.legH/16, d.legD/4);
    createGeometry('box', [d.socketW, d.socketH, d.socketD], m.lime, null, legs3D, -d.waistW/3+d.legW/4, -5*d.legH/16, -3*d.socketD/2);
    createGeometry('box', [d.socketW, d.socketH, d.socketD], m.lime, null, legs3D, d.waistW/3-d.legW/4, -5*d.legH/16, -3*d.socketD/2);
    // Boots 3D (parents: legs 3D; children: boots)
    boots3D = createObject3D(legs3D, 0, -d.legH, d.legD/2);
    createGeometry('box', [d.bootW, d.bootH, d.bootD], m.grey, null, boots3D, -d.waistW/3, -d.bootH/2, d.bootD/2);
    createGeometry('box', [d.bootW, d.bootH, d.bootD], m.grey, null, boots3D, d.waistW/3, -d.bootH/2, d.bootD/2);
}

function createTrailer() {

    // Body 3D (parent: scene; children: body, coupler, latches 3Ds, plate 3D)
    body3D = createObject3D(scene, 500, d.bodyH/2+d.plateH+d.chassisH+d.wheelR/2, -1250);
    createGeometry('box', [d.bodyW, d.bodyH, d.bodyD], m.salmon, null, body3D, 0, 0, 0);
    createGeometry('box', [d.couplerW, d.couplerH, d.couplerD], m.grey, null, body3D, 0, -d.couplerH/2-d.bodyH/2, -5*d.couplerD/6+d.bodyD/2);
    // Latches 3Ds (parent: body 3D; children: latches)
    lLatch3D = createObject3D(body3D, -d.latchW, -d.latchH/2-d.bodyH/2, -d.latchD+d.bodyD/2);
    rLatch3D = createObject3D(body3D, d.latchW, -d.latchH/2-d.bodyH/2, -d.latchD+d.bodyD/2);
    createGeometry('box', [d.latchW, d.latchH, d.latchD], m.black, null, lLatch3D, d.latchW/2, 0, d.latchD/2);
    createGeometry('box', [d.latchW, d.latchH, d.latchD], m.black, null, rLatch3D, -d.latchW/2, 0, d.latchD/2);
    // Plate 3D (parent: body 3D; children: plate, chassis 3D)
    plate3D = createObject3D(body3D, 0, -d.bodyH/2, -d.bodyD/2);
    createGeometry('box', [d.plateW, d.plateH, d.plateD], m.grey, null, plate3D, 0, -d.plateH/2, d.plateD/2);
    // Chassis 3D (parent: plate 3D; children: chassis, wheels)
    chassis3D = createObject3D(plate3D, 0, -d.plateH, 0);
    createGeometry('box', [d.chassisW, d.chassisH, d.chassisD], m.black, null, chassis3D, 0, -d.chassisH/2, d.chassisD/2);
    createGeometry('cyl', [d.wheelR, d.wheelR, d.wheelH], m.darkgrey, rAxes.z, chassis3D, -d.wheelH/2-d.chassisW/2, -3*d.chassisH/4, 3*d.chassisD/10);
    createGeometry('cyl', [d.wheelR, d.wheelR, d.wheelH], m.darkgrey, rAxes.z, chassis3D, d.wheelH/2+d.chassisW/2, -3*d.chassisH/4, 3*d.chassisD/10);
    createGeometry('cyl', [d.wheelR, d.wheelR, d.wheelH], m.darkgrey, rAxes.z, chassis3D, -d.wheelH/2-d.chassisW/2, -3*d.chassisH/4, 7*d.chassisD/10);
    createGeometry('cyl', [d.wheelR, d.wheelR, d.wheelH], m.darkgrey, rAxes.z, chassis3D, d.wheelH/2+d.chassisW/2, -3*d.chassisH/4, 7*d.chassisD/10);
}

/////////////////////////////////////////
/* COLLISION AND BOUNDARIES FUNCTIONS */
/////////////////////////////////////////

function checkCollisions() {

    // Update RoboTruck's bounding box and check if it is colliding with Trailer's
    updateRoboTruckAABB();
    return (
        roboTruckAABB[0][0] <= trailerAABB[1][0] &&     // xMin_rT <= xMax_t
        roboTruckAABB[1][0] >= trailerAABB[0][0] &&     // xMax_rT >= xMin_t
        roboTruckAABB[0][1] <= trailerAABB[1][1] &&     // yMin_rT <= yMax_t
        roboTruckAABB[1][1] >= trailerAABB[0][1] &&     // yMax_rT >= yMin_t
        roboTruckAABB[0][2] <= trailerAABB[1][2] &&     // zMin_rT <= zMax_t
        roboTruckAABB[1][2] >= trailerAABB[0][2]        // zMax_rT >= zMin_t
    );
}

function checkBoundaries(newBody3DPos) {

    // Check if Trailer is out of bounds
    const minBound = -2000, maxBound = 2000;
    return (
        newBody3DPos.x < minBound ||
        newBody3DPos.z < minBound ||
        newBody3DPos.x > maxBound ||
        newBody3DPos.z > maxBound
    );
}

function createBoundingBox(xMin, yMin, zMin, xMax, yMax, zMax) {

    const minPoint = [xMin, yMin, zMin];
    const maxPoint = [xMax, yMax, zMax];
    return [minPoint, maxPoint];
}

function createRobotAABB() {

    roboTruckAABB = createBoundingBox(
        - d.torsoW/2 - d.uppArmW - 2*d.pipeR,
        d.wheelR/2 - d.thighH - d.legH - d.bootH,
        - d.torsoD/2 - d.uppArmD,
        d.torsoW/2 + d.uppArmW + 2*d.pipeR,
        d.wheelR/2 + d.waistH + d.abdomenH + d.torsoH + d.headH + d.antennaH/2,
        d.torsoD/2
    );
}

function createTruckAABB() {

    roboTruckAABB = createBoundingBox(
        - d.torsoW/2 - d.wheelH,
        0,
        - d.torsoD/2 - d.uppArmD - d.legH - d.bootD,
        d.torsoW/2 + d.wheelH,
        d.wheelR/2 + d.waistH + d.abdomenH + d.torsoH/2 + d.pipeH,
        d.wheelR * 2
    );
}

function updateTrailerAABB(newBody3DPos) {

    trailerAABB = createBoundingBox(
        newBody3DPos.x - d.bodyW/2 - d.wheelH,
        newBody3DPos.y - d.bodyH/2 - d.plateH - d.chassisH - d.wheelR/2,
        newBody3DPos.z - d.bodyD/2,
        newBody3DPos.x + d.bodyW/2 + d.wheelH,
        newBody3DPos.y + d.bodyH/2,
        newBody3DPos.z + d.bodyD/2
    );
    scene.remove(trailerBoundingBox);
    const boxGeometry = new THREE.BoxGeometry(d.bodyW + 2*d.wheelH, d.bodyH + d.plateH + d.chassisH + d.wheelR/2, d.bodyD);
    const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
    trailerBoundingBox = new THREE.LineSegments(edgesGeometry, boundingBoxesMaterial);
    trailerBoundingBox.position.set(newBody3DPos.x, newBody3DPos.y, newBody3DPos.z);
    scene.add(trailerBoundingBox);
}

function isTruck() {

    // Check if RoboTruck is in truck mode
    return (
        head3DAngle === Math.PI &&
        armsOffset === 80 &&
        thighs3DAngle === Math.PI/2 &&
        boots3DAngle === Math.PI/2
    );
}

function updateRoboTruckAABB() {
    if (isTruck())
        createTruckAABB();
    else
        createRobotAABB();
    scene.remove(roboTruckBoundingBox);
    const boxGeometry = new THREE.BoxGeometry(roboTruckAABB[1][0]-roboTruckAABB[0][0], roboTruckAABB[1][1]-roboTruckAABB[0][1], roboTruckAABB[1][2]-roboTruckAABB[0][2]);
    const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
    roboTruckBoundingBox = new THREE.LineSegments(edgesGeometry, boundingBoxesMaterial);
    roboTruckBoundingBox.position.set((roboTruckAABB[1][0]+roboTruckAABB[0][0])/2, (roboTruckAABB[1][1]+roboTruckAABB[0][1])/2, (roboTruckAABB[1][2]+roboTruckAABB[0][2])/2);
    scene.add(roboTruckBoundingBox);
}

////////////
/* UPDATE */
////////////

function update(delta) {
    let tentativeBody3DPos;
    // If Trailer is coupling with RoboTruck
    if (coupling) {
        if (!trailerBehindTruck)
            moveTrailerBehindTruck();
        else {
            console.log("coupling");
            doCouplingAnimation(delta);
        }
    } // Else if Trailer is unlocking latches
    else if (unlockingLatches) {
        rotateLatches(-rotationSpeed * 2, delta);
    } // If Trailer is not coupling with RoboTruck nor unlocking latches
    else {
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
                    // Trailer Movement Controls (keys left, up, right, down)
                    case "37": // left
                        tentativeBody3DPos = checkMoveTrailer('x', -movementSpeed, delta);
                        executeMoveTrailer(tentativeBody3DPos);
                        break;
                    case "38": // up
                        tentativeBody3DPos = checkMoveTrailer('z', -movementSpeed, delta);
                        executeMoveTrailer(tentativeBody3DPos);
                        break;
                    case "39": // right
                        tentativeBody3DPos = checkMoveTrailer('x', movementSpeed, delta);
                        executeMoveTrailer(tentativeBody3DPos);
                        break;
                    case "40": // down
                        tentativeBody3DPos = checkMoveTrailer('z', movementSpeed, delta);
                        executeMoveTrailer(tentativeBody3DPos);
                        break;
                }
            }
        }
    }
}

function doCouplingAnimation(delta) {

    // If Trailer is not yet in its final position, move it forward
    const targetZ = - d.torsoD/2 - d.uppArmD - d.socketD - d.bodyD/2;
    const positionZ = body3D.position.z;
    if (positionZ < targetZ) {
        const deltaZ = Math.min(movementSpeed * 2, targetZ - positionZ);
        body3D.position.z += deltaZ;
    } else
        // If Trailer is already in its final position, rotate latches
        rotateLatches(rotationSpeed, delta);
}

function moveTrailerBehindTruck() {

    // If Trailer is not yet behind the Truck, move it in that direction
    const targetX = 0;
    const targetZ = - d.torsoD/2 - d.uppArmD - d.legH - d.bootD - d.bodyD/2;
    const positionX = body3D.position.x;
    const positionZ = body3D.position.z;
    const deltaX = Math.min(movementSpeed * 2, Math.abs(targetX - positionX));
    const deltaZ = Math.min(movementSpeed * 2, Math.abs(targetZ - positionZ));
    if (positionX < targetX)
        body3D.position.x += deltaX;
    else if (positionX > targetX)
        body3D.position.x -= deltaX;
    if (positionZ < targetZ)
        body3D.position.z += deltaZ;
    else if (positionZ > targetZ)
        body3D.position.z -= deltaZ;
    if (positionX === targetX && positionZ === targetZ)
        trailerBehindTruck = true;
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

    // Create all cameras and set default camera
    cameras.front = createOrthographicCamera(0, 0, 500, 0, 0, 0, -500, 5000);
    cameras.side = createOrthographicCamera(500, 0, 0, 0, 0, 0, -500, 5000);
    cameras.top = createOrthographicCamera(0, 500, 0, 0, 0, 0, -500, 5000);
    cameras.iso = createOrthographicCamera(500, 500, 500, 0, 0, 0, -500, 5000);
    cameras.persp = createPerspectiveCamera(750, 500, 500, 0, 0, 0, 1, 5000, 70);
    camera = cameras.front;

    // Create camera controls and disable them and their arrow keys
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.keys = {LEFT: null, UP: null, RIGHT: null, BOTTOM: null};
    controls.enabled = false;

    // Create Axes Helper and Rotation Axes to be used
    axesHelper = new THREE.AxesHelper(750);
    rAxes.x = new THREE.Vector3(1, 0, 0);
    rAxes.y = new THREE.Vector3(0, 1, 0);
    rAxes.z = new THREE.Vector3(0, 0, 1);

    createScene();

    previousTime = performance.now();

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
    console.log('resize')
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (window.innerHeight > 0 && window.innerWidth > 0) {
        if (camera instanceof THREE.OrthographicCamera)
            updateOrthographicCamera(camera);
        else
            updatePerspectiveCamera(camera);
    }
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////

function onKeyDown(e) {

    switch (e.keyCode) {
        // Camera Controls (keys 1, 2, 3, 4, 5, C)
        case 49: // 1
            camera = cameras.front;
            updateOrthographicCamera(camera);
            break;
        case 50: // 2
            camera = cameras.side;
            updateOrthographicCamera(camera);
            break;
        case 51: // 3
            camera = cameras.top;
            updateOrthographicCamera(camera);
            break;
        case 52: // 4
            camera = cameras.iso;
            updateOrthographicCamera(camera);
            break;
        case 53: // 5
            camera = cameras.persp;
            updatePerspectiveCamera(camera);
            break;
        case 67: // C
        case 99: // c
            controls.enabled = !controls.enabled;
            controls.object = camera;
            controls.update();
            break;
        // Visual Representation Controls (keys 6, 7, 8, 9, Z)
        case 54: // 6
            Object.values(m).forEach(function(material) {
                material.wireframe = !material.wireframe;
            });
            break;
        case 55: // 7
            edgesMaterial.visible = !edgesMaterial.visible;
            break;
        case 56: // 8
            boundingBoxesMaterial.visible = !boundingBoxesMaterial.visible;
            break;
        case 57: // 9
            if (!isAxesHelperVisible) {
                scene.add(axesHelper);
                isAxesHelperVisible = true;
            } else {
                scene.remove(axesHelper);
                isAxesHelperVisible = false;
            }
            break;
        case 90: // Z
        case 122: // z
            body3D.position.set(500, d.bodyH/2+d.plateH+d.chassisH+d.wheelR/2, -1250);
            lLatch3D.rotation.y = 0;
            rLatch3D.rotation.y = 0;
            latches3DAngle = 0;
            coupling = false;
            trailerBehindTruck = false;
            latchesLocked = false;
            unlockingLatches = false;
            break;
        default:
            keys[e.keyCode] = true;
    }
}

/////////////////////
/* KEY UP CALLBACK */
/////////////////////

function onKeyUp(e) {

    // Ignore 1 to 9 and C keys because they are used for camera switching and visual representation
    if ((e.keyCode >= 49 && e.keyCode <= 57) || e.keyCode === 67 || e.keyCode === 99)
        return;
    keys[e.keyCode] = false;
}

/////////////////////////////////////
/* MOVEMENT AND ROTATION FUNCTIONS */
/////////////////////////////////////

function rotateHead(speed, delta) {

    let adjustment;
    const target = speed > 0 ? Math.PI : 0;
    if (Math.abs(target - head3DAngle) < Math.abs(speed * delta)) {
        adjustment = target - head3DAngle;
        head3DAngle = target;
    }
    if ((speed > 0 && head3DAngle + speed * delta <= target) || (speed < 0 && head3DAngle + speed * delta >= target)) {
        adjustment = speed * delta;
        head3DAngle += speed * delta;
    }
    head3D.rotateOnWorldAxis(rAxes.x, -adjustment);
}

function moveArms(speed, delta) {

    let adjustment;
    const target = speed > 0 ? 80 : 0;
    if (Math.abs(target - armsOffset) < Math.abs(speed * delta)) {
        adjustment = new THREE.Vector3(target - armsOffset, 0, 0);
        armsOffset = target;
    }
    else if ((speed > 0 && armsOffset + speed * delta <= target) || (speed < 0 && armsOffset + speed * delta >= target)) {
        adjustment = new THREE.Vector3(speed * delta, 0, 0);
        armsOffset += speed * delta;
    }
    lArm3D.position.add(adjustment);
    rArm3D.position.add(adjustment.clone().negate());
}

function rotateThighs(speed, delta) {

    let adjustment;
    const target = speed > 0 ? Math.PI / 2 : 0;
    if (Math.abs(target - thighs3DAngle) < Math.abs(speed * delta)) {
        adjustment = target - thighs3DAngle;
        thighs3DAngle = target;
    }
    if ((speed > 0 && thighs3DAngle + speed * delta <= target) || (speed < 0 && thighs3DAngle + speed * delta >= target)) {
        adjustment = speed * delta;
        thighs3DAngle += speed * delta;
    }
    thighs3D.rotateOnWorldAxis(rAxes.x, adjustment);
}

function rotateBoots(speed, delta) {

    let adjustment;
    const target = speed > 0 ? Math.PI / 2 : 0;
    if (Math.abs(target - boots3DAngle) < Math.abs(speed * delta)) {
        adjustment = target - boots3DAngle;
        boots3DAngle = target;
    }
    if ((speed > 0 && boots3DAngle + speed * delta <= target) || (speed < 0 && boots3DAngle + speed * delta >= target)) {
        adjustment = speed * delta;
        boots3DAngle += speed * delta;
    }
    boots3D.rotateOnWorldAxis(rAxes.x, adjustment);
}

function checkMoveTrailer(axis, speed, delta) {

    let adjustment;
    let tentativeBody3D = new THREE.Object3D();
    tentativeBody3D.copy(body3D);
    if (axis === 'x')
        adjustment = new THREE.Vector3(speed * delta, 0, 0);
    else if (axis === 'z')
        adjustment = new THREE.Vector3(0, 0, speed * delta);
    tentativeBody3D.position.add(adjustment);
    return tentativeBody3D.position;
}

function executeMoveTrailer(newBody3DPos) {

    updateTrailerAABB(newBody3DPos);
    // If there is a collision with RoboTruck in truck mode, set coupling animation to true
    if (checkCollisions() && isTruck() && !latchesLocked)
        coupling = true;
    else if (latchesLocked && !isTruck())
        unlockingLatches = true;
    // If there are no collisions and Trailer is not out of bounds, move it
    else if (!checkCollisions() && !checkBoundaries(newBody3DPos))
        body3D.position.set(newBody3DPos.x, newBody3DPos.y, newBody3DPos.z);
}

function rotateLatches(speed, delta) {

    let adjustment;
    const target = speed > 0 ? Math.PI/2 : 0;
    if (Math.abs(target - latches3DAngle) < Math.abs(speed * delta)) {
        adjustment = target - latches3DAngle;
        latches3DAngle = target;
        coupling = false;
        trailerBehindTruck = false;
        latchesLocked = !latchesLocked;
        // If the rotation is unlocking the latches, stop blocking the use of other keys
        if (!latchesLocked)
            unlockingLatches = !unlockingLatches;
    }
    if ((speed > 0 && latches3DAngle + speed * delta <= target) || (speed < 0 && latches3DAngle + speed * delta >= target)) {
        adjustment = speed * delta;
        latches3DAngle += speed * delta;
    }
    lLatch3D.rotateOnWorldAxis(rAxes.y, -adjustment);
    rLatch3D.rotateOnWorldAxis(rAxes.y, adjustment);
}

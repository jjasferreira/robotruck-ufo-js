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
let materials = []; // TODO: do a dictionary

// RoboTruck components
let torso3D, head3D, lArm3D, rArm3D, abdomen3D, waist3D, thighs3D, legs3D, boots3D;

// Trailer components
let trailer3D, plate3D, chassis3D, couplerBody, coupler3D1, coupler3D2, latch3D;

// Movements and Rotations
let movementSpeed = 0.5;
let armsOffset = 0;
let rotationSpeed = 0.008;
let head3DAngle = 0;
let thighs3DAngle = 0;
let boots3DAngle = 0;
let coupler3DAngle = 0;

// Bounding Boxes
let robotruckAABB, trailerAABB;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////

function createScene() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF0EAD6);
    scene.fog = new THREE.FogExp2( 0xa9a9fc, 0.00025);
    createRoboTruck();
    createTrailer();
    // TODO: remove the axes helper later
    const axesHelper = new THREE.AxesHelper(300);
    axesHelper.renderOrder = 1; // Set a higher render order for the axes helper
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

function createCube(w, h, d, color, rotAxis, parent, x = 0, y = 0, z = 0) {

    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshBasicMaterial({ color: color });
    materials.push(material);
    const cube = new THREE.Mesh(geometry, material);
    if (rotAxis !== null)
        cube.rotateOnAxis(rotAxis, Math.PI / 2);
    cube.position.set(x, y, z);
    parent.add(cube);
    return cube;
}

function createCylinder(rt, rb, h, color, rotAxis, parent, x = 0, y = 0, z = 0) {

    // TODO: should we do CylinderGeometry(rt, rb, h, 32) to make it look smoother?
    const geometry = new THREE.CylinderGeometry(rt, rb, h);
    const material = new THREE.MeshBasicMaterial({ color: color });
    materials.push(material);
    const cylinder = new THREE.Mesh(geometry, material);
    if (rotAxis !== null)
        cylinder.rotateOnAxis(rotAxis, Math.PI / 2);
    cylinder.position.set(x, y, z);
    parent.add(cylinder);
    return cylinder;
}

function createRoboTruck() {

    // Torso 3D (parent: scene; children: torso, head 3D, arms 3Ds, abdomen 3D)
    torso3D = createObject3D(scene, 0, 0, 0);
    const torsoW = 240, torsoH = 160, torsoD = 160;
    createCube(torsoW, torsoH, torsoD, 0x808080, null, torso3D);
    // Head 3D (parent: torso 3D; children: head, eyes, antennas)
    head3D = createObject3D(torso3D, 0, torsoH/2, -torsoD/2);
    const headW = 80, headH = 80, headD = 80;
    createCube(headW, headH, headD, 0xe8Beac, null, head3D, 0, headH/2, headD/2);
    const eyeW = 20, eyeH = 40/3, eyeD = 10;
    createCube(eyeW, eyeH, eyeD, 0xffffff, null, head3D, -headW/4, 3*headH/5, headD);
    createCube(eyeW, eyeH, eyeD, 0xffffff, null, head3D, headW/4, 3*headH/5, headD);
    const antennaW = 40/3, antennaH = 40, antennaD = 40/3;
    createCube(antennaW, antennaH, antennaD, 0xff0000, null, head3D, -headW/4, headH, 0);
    createCube(antennaW, antennaH, antennaD, 0xff0000, null, head3D, headW/4, headH, 0);
    // Arms 3Ds (parent: torso 3D; children: upper arms, exhaust pipes, lower arms)
    lArm3D = createObject3D(torso3D, -torsoW/2, 0, -torsoD/2);
    rArm3D = createObject3D(torso3D, torsoW/2, 0, -torsoD/2);
    //createCube(1, 1, 1, 0x808080, null, lArm3D, 0, 0, 0); ELIMINAR
    const uArmW = 80, uArmH = 160, uArmD = 80;
    createCube(uArmW, uArmH, uArmD, 0x035f53, null, lArm3D, -uArmW/2, 0, -uArmD/2);
    createCube(uArmW, uArmH, uArmD, 0x035f53, null, rArm3D, uArmW/2, 0, -uArmD/2);
    const pipeR = 10, pipeH = 120;
    createCylinder(pipeR, pipeR, pipeH, 0x808080, null, lArm3D, -pipeR-uArmW, 3*uArmH/8, pipeR-uArmD);
    createCylinder(pipeR, pipeR, pipeH, 0x808080, null, rArm3D, pipeR+uArmW, 3*uArmH/8, pipeR-uArmD);
    const lArmW = 80, lArmH = 80, lArmD = 240;
    createCube(lArmW, lArmH, lArmD, 0xffae42, null, lArm3D, -uArmW/2, -lArmH/2-uArmH/2, lArmD/2-uArmD);
    createCube(lArmW, lArmH, lArmD, 0xffae42, null, rArm3D, uArmW/2, -lArmH/2-uArmH/2, lArmD/2-uArmD);
    // Abdomen 3D (parent: torso 3D; children: abdomen, waist 3D)
    abdomen3D = createObject3D(torso3D, 0, -torsoH/2, 0);
    const abdomenW = 80, abdomenH = 80, abdomenD = 160;
    createCube(abdomenW, abdomenH, abdomenD, 0x035f53, null, abdomen3D, 0, -abdomenH/2, 0);
    // Waist 3D (parent: abdomen 3D; children: waist, front wheels, thighs 3D)
    waist3D = createObject3D(abdomen3D, 0, -abdomenH, abdomenD/8);
    const waistW = 240, waistH = 80, waistD = 120;
    createCube(waistW, waistH, waistD, 0x808080, null, waist3D, 0, -waistH/2, 0);
    const wheelR = 40, wheelH = 40;
    const rotAxis = new THREE.Vector3(0, 0, 1);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, waist3D, -wheelH/2-waistW/2, -3*waistH/4, 0);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, waist3D, wheelH/2+waistW/2, -3*waistH/4, 0);
    // Thighs 3D (parent: waist 3D; children: thighs, legs 3D)
    thighs3D = createObject3D(waist3D, 0, -waistH, -waistD/2);
    const thighW = 40, thighH = 120, thighD = 40;
    createCube(thighW, thighH, thighD, 0x3492da, null, thighs3D, -waistW/3, -thighH/2, -thighD/2);
    createCube(thighW, thighH, thighD, 0x3492da, null, thighs3D, waistW/3, -thighH/2, -thighD/2);
    // Legs 3D (parents: thighs 3D; children: legs, back wheels, trailer socket, boots 3D)
    legs3D = createObject3D(thighs3D, 0, -thighH, -thighD);
    const legW = 80, legH = 320, legD = 80;
    createCube(legW, legH, legD, 0x3630a6, null, legs3D, -waistW/3, -legH/2, 0);
    createCube(legW, legH, legD, 0x3630a6, null, legs3D, waistW/3, -legH/2, 0);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, legs3D, -waistW/3-wheelH/2-legW/2, -7*legH/16, legD/4);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, legs3D, -waistW/3-wheelH/2-legW/2, -13*legH/16, legD/4);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, legs3D, waistW/3+wheelH/2+legW/2, -7*legH/16, legD/4);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, legs3D, waistW/3+wheelH/2+legW/2, -13*legH/16, legD/4);
    const socketW = 40, socketH = 40, socketD = 40;
    createCube(socketW, socketH, socketD, 0xdac134, null, legs3D, -waistW/3+legW/4, -5*legH/16, -3*socketD/2);
    createCube(socketW, socketH, socketD, 0xdac134, null, legs3D, waistW/3-legW/4, -5*legH/16, -3*socketD/2);
    // Boots 3D (parents: legs 3D; children: boots)
    boots3D = createObject3D(legs3D, 0, -legH, legD/2);
    const bootW = 80, bootH = 40, bootD = 60;
    createCube(bootW, bootH, bootD, 0x131056, null, boots3D, -waistW/3, -bootH/2, bootD/2);
    createCube(bootW, bootH, bootD, 0x131056, null, boots3D, waistW/3, -bootH/2, bootD/2);
}

function createTrailer() {

    // Trailer 3D (parent: scene; children: body, plate 3D)
    trailer3D = createObject3D(scene, 300, 40, -1080);
    const bodyW = 240, bodyH = 280, bodyD = 1160;
    createCube(bodyW, bodyH, bodyD, 0xff606b, null, trailer3D);
    // Plate 3D (parent: trailer 3D; children: plate, chassis 3D)
    plate3D = createObject3D(trailer3D, 0, -bodyH/2, -bodyD/2);
    const plateW = 240, plateH = 40, plateD = 760;
    createCube(plateW, plateH, plateD, 0x808080, null, plate3D, 0, -plateH/2, plateD/2);
    // Chassis 3D (parent: plate 3D; children: chassis, wheels)
    chassis3D = createObject3D(plate3D, 0, -plateH, 0);
    const chassisW = 240, chassisH = 80, chassisD = 400;
    createCube(chassisW, chassisH, chassisD, 0x222222, null, chassis3D, 0, -chassisH/2, chassisD/2);
    const wheelR = 40, wheelH = 40;
    const rotAxis = new THREE.Vector3(0, 0, 1);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, chassis3D, -wheelH/2-chassisW/2, -3*chassisH/4, 3*chassisD/10);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, chassis3D, wheelH/2+chassisW/2, -3*chassisH/4, 3*chassisD/10);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, chassis3D, -wheelH/2-chassisW/2, -3*chassisH/4, 7*chassisD/10);
    createCylinder(wheelR, wheelR, wheelH, 0x5a5a5a, rotAxis, chassis3D, wheelH/2+chassisW/2, -3*chassisH/4, 7*chassisD/10);
    // TODO: fix this part later
    const couplerW = 80, couplerH = 40, couplerD = 120;
    const couplerLatchW = 40, couplerLatchH = 40, couplerLatchD = 40;
    couplerBody = createCube(couplerW, couplerH, couplerD, 0x808080, null, trailer3D, 0, -bodyH/2 - couplerH/2, bodyD/2 - couplerD/2 - couplerLatchD);
    coupler3D1 = createObject3D(trailer3D, -couplerW/2, -bodyH/2 - couplerH/2 , bodyD/2 - couplerLatchD);
    coupler3D2 = createObject3D(trailer3D, couplerW/2, -bodyH/2 - couplerH/2 , bodyD/2 - couplerLatchD);
    let couplerLatch1 = createCube(couplerLatchW, couplerLatchH, couplerLatchD, 0x101010, null, coupler3D1, couplerLatchW/2, 0, couplerLatchD/2);
    let couplerLatch2 = createCube(couplerLatchW, couplerLatchH, couplerLatchD, 0x101010, null, coupler3D2, -couplerLatchW/2, 0, couplerLatchD/2);

}

//////////////////////
/* COLLISION FUNCTIONS */
//////////////////////

function checkCollisions() {
    return (
        robotruckAABB[0][0] <= trailerAABB[1][0] && //xmin_robo <= xmax_trailer
        robotruckAABB[1][0] >= trailerAABB[0][0] && //xmax_robo >= xmax_trailer
        robotruckAABB[0][1] <= trailerAABB[1][1] && //ymin_robo <= ymax_trailer
        robotruckAABB[1][1] >= trailerAABB[0][1] && //ymax_robo >= ymin_trailer
        robotruckAABB[0][2] <= trailerAABB[1][2] && //zmin_robo <= zmax_trailer
        robotruckAABB[1][2] >= trailerAABB[0][2] //zmax_robo >= zmin_trailer
      );
}

function createBoundingBox(xmin, ymin, zmin, xmax, ymax, zmax) {
    let min_point = [xmin, ymin, zmin];
    let max_point = [xmax, ymax, zmax];
    return [min_point, max_point];
}

function createRoboTruckAABB() {
    // constants needed
    const pipeH = 120, wheelR = 40, thighH = 120, legH = 320, bootH = 40, 
        headH = 80, antennaH = 40, torsoD = 160;

    robotruckAABB = createBoundingBox(lArm3D.position.x - pipeH,
                                      thighs3D.position.y - wheelR/2,
                                      thighs3D.position.z - thighH - legH - bootH,
                                      rArm3D.position.x + pipeH, 
                                      head3D.position.y + headH + antennaH/2,
                                      head3D.position.z + torsoD);
}

function createTrailerAABB() {
    // constants needed for trailer AABB
    const bodyW = 240, bodyH = 280, bodyD = 1160, wheelR = 40, 
        plateH = 40, chassisH = 80;  
    //update trailer bounding box
    trailerAABB = createBoundingBox(trailer3D.position.x - bodyW/2 - wheelR,
                                    trailer3D.position.y - bodyH/2 - plateH - chassisH - wheelR/2,
                                    trailer3D.position.z - bodyD/2,
                                    trailer3D.position.x + bodyW/2 + wheelR,
                                    trailer3D.position.y + bodyH/2,
                                    trailer3D.position.z + bodyD/2); 
}

function isTruck() {
    const margin_pi = 0.02, margin_half_pi = 0.01; 
    return head3DAngle >= Math.PI - margin_pi && 
           thighs3DAngle >= Math.PI/2 - margin_half_pi && 
           boots3DAngle >= Math.PI/2 - margin_half_pi; 
}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() {

}

////////////
/* UPDATE */
////////////
function update(delta) {
    for (let k in keys) {
        if (keys[k] == true) {
            switch (k) {
                // Arms Movement Controls (keys E, D)
                case "69": // E
                case "101": // e
                    if (armsOffset < 80)
                        requestAnimationFrame(() => moveArms(movementSpeed, delta));
                    break;
                case "68": // D
                case "100": // d
                    if (armsOffset > 0)
                        requestAnimationFrame(() => moveArms(-movementSpeed, delta));
                    break;
                // Head Rotation Controls (keys R, F)
                case "82": // R
                case "114": // r
                    if (head3DAngle < Math.PI)
                        requestAnimationFrame(() => rotateHead(rotationSpeed * 2, delta));
                    break;
                case "70": // F
                case "102": // f
                    if (head3DAngle > 0)
                        requestAnimationFrame(() => rotateHead(-rotationSpeed * 2, delta));
                    break;
                // Thighs Rotation Controls (keys W, S)
                case "87": // W
                case "119": // w
                    if (thighs3DAngle < Math.PI / 2)
                        requestAnimationFrame(() => rotateThighs(rotationSpeed, delta));
                    break;
                case "83": // S
                case "115": // s
                    if (thighs3DAngle > 0)
                        requestAnimationFrame(() => rotateThighs(-rotationSpeed, delta));
                    break;
                // Boots Rotation Controls (keys Q, A)
                case "81": // Q
                case "113": // q
                    if (boots3DAngle < Math.PI / 2)
                        requestAnimationFrame(() => rotateBoots(rotationSpeed, delta));
                    break;
                case "65": // A
                case "97": // a
                    if (boots3DAngle > 0)
                        requestAnimationFrame(() => rotateBoots(-rotationSpeed, delta));
                    break;
                // Trailer Movement Controls (keys left, right, down, up)
                case "37": // left
                    moveTrailer("x", movementSpeed * 20, delta);
                    break;
                case "39": // right
                    moveTrailer("x", -movementSpeed * 20, delta);
                    break;
                case "40": // down
                    moveTrailer("z", movementSpeed * 20, delta);
                    break;
                case "38": // up
                    moveTrailer("z", -movementSpeed * 20, delta);
                    break;
                case "72": // H
                case "104": // h
                    rotateCoupler(rotationSpeed, delta);
                case "89": // Y
                case "121": // y
                    rotateCoupler(-rotationSpeed, delta);
            }
        }
    }
    // if robotruck is in full truck mode
    if (isTruck()) {
        createTrailerAABB();
        // if a collision is detected
        if (checkCollisions()) {
            //activate animation
            console.log("COLLISION"); //TODO delete later
        }
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
// noinspection JSUnresolvedReference
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

        createRoboTruckAABB();

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
                materials.forEach(function (material) {
                    material.wireframe = !material.wireframe;
                });
                break;
            default:
                keys[e.keyCode] = true;
        }
    }

///////////////////////
    /* KEY UP CALLBACK */

///////////////////////

    function onKeyUp(e) {

        // Ignore 1 to 6 keys because they are used for camera switching
        if (e.keyCode >= 49 && e.keyCode <= 54)
            return;
        keys[e.keyCode] = false;
    }

/////////////////////////
    /* MOVEMENT FUNCTIONS */

/////////////////////////

    function rotateHead(speed, delta) {
        const target = speed > 0 ? Math.PI : 0;
        if ((speed > 0 && head3DAngle + speed <= target) || (speed < 0 && head3DAngle + speed >= target)) {
            head3D.rotation.x -= speed * delta;
            head3DAngle += speed * delta;
        }
    }

    function moveArms(speed, delta) {
        const target = speed > 0 ? 80 : 0;
        if ((speed > 0 && armsOffset + speed <= target) || (speed < 0 && armsOffset + speed >= target)) {
            lArm3D.position.x += speed * delta;
            rArm3D.position.x -= speed * delta;
            armsOffset += speed * delta;
        }
    }

    function rotateThighs(speed, delta) {
        const target = speed > 0 ? Math.PI / 2 : 0;
        if ((speed > 0 && thighs3DAngle + speed <= target) || (speed < 0 && thighs3DAngle + speed >= target)) {
            thighs3D.rotation.x += speed * delta;
            thighs3DAngle += speed * delta;
        }
    }

    function rotateBoots(speed, delta) {
        const target = speed > 0 ? Math.PI / 2 : 0;
        if ((speed > 0 && boots3DAngle + speed <= target) || (speed < 0 && boots3DAngle + speed >= target)) {
            boots3D.rotation.x += speed * delta;
            boots3DAngle += speed * delta;
        }
    }

    function moveTrailer(axis, speed, delta) {
        if (speed !== 0 && axis === "x") {
            trailer3D.position.x -= speed * delta;
        } else {
            trailer3D.position.z += speed * delta;
        }
    }

    function rotateCoupler(speed, delta) {
        const target = speed > 0 ? Math.PI : 0;
        if ((speed > 0 && coupler3DAngle + speed <= target) || (speed < 0 && coupler3DAngle + speed >= target)) {
            coupler3D1.rotation.y -= speed * delta;
            coupler3D2.rotation.y += speed * delta;
            coupler3DAngle += speed * delta;
        }
    }
/*

function moveTrailer(axis, speed) {
    trailerMoving = true;
    const target = speed > 0 ? 80 : 0;
    if ((speed > 0 && trailerOffset + speed <= target) || (speed < 0 && trailerOffset + speed >= target)) {
        trailer.position[axis] += speed;
        trailerOffset += speed;
        requestAnimationFrame(() => moveTrailer(axis, speed));
    } else {
        trailer.position[axis] += target - trailerOffset;
        trailerOffset = target;
        trailerMoving = false;
    }
}

function rotateLatch(speed) {
    latch3DRotating = true;S
    const axis = new THREE.Vector3(0, 1, 0);
    const target = speed > 0 ? Math.PI : 0;
    if ((speed > 0 && latch3DAngle + speed <= target) || (speed < 0 && latch3DAngle + speed >= target)) {
        latch3D.rotateOnAxis(axis, speed);
        latch3DAngle += speed;
        requestAnimationFrame(() => rotateLatch3D(speed));
    } else {
        latch3D.rotateOnAxis(axis, target - latch3DAngle);
        latch3DAngle = target;
        latch3DRotating = false;
    }
}

*/



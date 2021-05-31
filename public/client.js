import * as THREE from '/build/three.module.js';
import { Clock, Mesh, MeshToonMaterial, TetrahedronBufferGeometry } from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'
import { PointerLockControls } from '/jsm/controls/PointerLockControls.js'
import { GLTFLoader } from '/jsm/loaders/GLTFLoader.js';


//const socket = io('http://localhost:8080');
const socket = new WebSocket("ws://localhost:9000");
//socket.emit('message', "hello world")


const objects = [];

let playerposition = null;
let playerpositionOld = false;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let jump = false;
let sprint = false;
let grounded = false;

//Setup scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight,0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
//camera.position.set(0,0,20);

//Obj1

const geometry = new THREE.BoxGeometry(3, 5, 5, 100);
const material = new THREE.MeshStandardMaterial({color: 0xcc33ff });
const torus = new THREE.Mesh(geometry, material);

//Player

const playerGeo = new THREE.BoxGeometry(2, 7, 2, 100);
const playerMat = new THREE.MeshStandardMaterial({color: 0x00FFFF });
const playerObj = new THREE.Mesh(playerGeo, playerMat);

//Floor

var geo = new THREE.PlaneBufferGeometry(2000, 2000, 8, 8);
var mat = new THREE.MeshStandardMaterial({ color: 0x00FFFF, side: THREE.DoubleSide });
var plane = new THREE.Mesh(geo, mat);
plane.rotateX( - Math.PI / 2);

//Add a light

const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5,25,5);
const ambientLight = new THREE.AmbientLight(0xffffff,0.5);

// Helpers

 const lightHelper = new THREE.PointLightHelper(pointLight)
 const gridHelper = new THREE.GridHelper(200, 50);
 scene.add(lightHelper, gridHelper)

//background

const spaceTexture = new THREE.TextureLoader().load('material.jpg')
scene.background = spaceTexture;

//Camera Controls
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add( controls.getObject() );
document.addEventListener( 'click', function () {
    controls.lock();

} );
controls.addEventListener( 'lock', function () {

	//menu.style.display = 'none';
    controls.lock();

} );

controls.addEventListener( 'unlock', function () {

	//menu.style.display = 'block';
    controls.unlock();

} );

const onKeyDown = function ( event ) {

    switch ( event.code ) {

        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;

        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;

        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;

        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;

        case 'Space':
            jumpAction();
            break;
        case 'ShiftLeft':
            sprint = true;
            break;

    }

};

function jumpAction()
{
    if(!jumpTimer.running)
    {
        console.log("no")
        jumpTimer.stop();
        jumpTimer.start();
        jump = true;    
    }
        
}

const onKeyUp = function ( event ) {

    switch ( event.code ) {

        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            sprint = false;
            break;

        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;

        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;

        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }

};

document.addEventListener( 'keydown', onKeyDown );
document.addEventListener( 'keyup', onKeyUp );

// Object Controls

controls.getObject().position.y = 3;

// Adding objects to the scene

scene.add(ambientLight);
scene.add(pointLight);
scene.add(camera);
scene.add(torus);
scene.add(plane);
scene.add(playerObj);

//Adding Objects to the collisoin array

objects.push(plane);
objects.push(torus);

//Game Loop

var jumpTimer = new THREE.Clock(false);
function detectCollisionCubes(object1, object2){
    object1.geometry.computeBoundingBox(); //not needed if its already calculated
    object2.geometry.computeBoundingBox();
    object1.updateMatrixWorld();
    object2.updateMatrixWorld();
    
    var box1 = object1.geometry.boundingBox.clone();
    box1.applyMatrix4(object1.matrixWorld);
  
    var box2 = object2.geometry.boundingBox.clone();
    box2.applyMatrix4(object2.matrixWorld);
  
    return box1.intersectsBox(box2);
  }

function animate() {



    playerObj.position.x = controls.getObject().position.x;
    playerObj.position.y = controls.getObject().position.y;
    playerObj.position.z = controls.getObject().position.z;
    playerObj.rotation.y = controls.getObject().rotation.y;
    requestAnimationFrame( animate );
    renderer.render(scene, camera);
    
    //Ground Collision

    grounded = false
    objects.map( object => {
        if(detectCollisionCubes(playerObj, object))
        {
            grounded = true;
        }
    })

    //Jumping

    if(!grounded)
    {
        controls.getObject().position.y += - 0.7;
    }

    if(jump)
    {
        controls.getObject().position.y += 1.1-jumpTimer.getElapsedTime();
    } 
    if(jumpTimer.getElapsedTime() >=0.99)
    {
        jumpTimer.stop();
        jump = false;
    }

    //Movement

    if (moveForward && !sprint) {
        controls.moveForward(0.4)
    }
    if (moveForward && sprint) {
        controls.moveForward(1)
    }
    if (moveBackward) {
        controls.moveForward(-0.4);
    }
    if (moveLeft) {
        controls.moveRight(-0.4);
    }
    if (moveRight) {
        controls.moveRight(0.4);
    }

    //Transmitting player movements
    if(playerpositionOld)
    {
        if(playerpositionOld != JSON.stringify(playerObj.position))
        {
            socket.send(JSON.stringify(playerObj.position))
            playerpositionOld = JSON.stringify(playerObj.position)
        }
    } else
    {
        playerpositionOld = JSON.stringify(playerObj.position)
    }
    


    // playerposition = playerObj.position;  
    // if(playerpositionOld == null)
    // {
    //     playerpositionOld = playerObj.position;  
    // }

    // if(playerpositionOld != playerposition)
    // {
    //     socket.send(JSON.stringify(playerposition))
    //     playerpositionOld = playerposition;
    // }

}


animate();

//Accounting for window resize

window.addEventListener( 'resize', onWindowResize );
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}
import * as THREE from '/build/three.module.js';
import { Clock, Mesh, MeshToonMaterial, TetrahedronBufferGeometry } from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'
import { PointerLockControls } from '/jsm/controls/PointerLockControls.js'
import { GLTFLoader } from '/jsm/loaders/GLTFLoader.js';

const objects = [];

let wspayload = {};
let playerpositionOld = false;
let playerHealth = 100;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let jump = false;
let sprint = false;
let grounded = false;
let leftClick = false;
let rightClick = false;

// The player class that is created for each player

class playerObject
{
    constructor (name)
    {
        this.playerName = name;
        this.geometry = new THREE.BoxGeometry(2, 7, 2, 100);
        this.material = new THREE.MeshStandardMaterial({color: 0x00FFFF });
        this.player = new THREE.Mesh(this.geometry, this.material);
        this.player.name = name;
        scene.add(this.player);
        //this.player.position.set(0,10,0);
    }
    
}

//List of players
let playerList = [];

// Player creation
let playerName = prompt("Please enter your name", "")

// Loading the map
const loader = new GLTFLoader();

loader.load( 'arena/scene.gltf', function ( gltf ) {

    gltf.scene.name = "map";
    var map = gltf.scene;
	scene.add( map );
    map.position.set(0,0.1,0)
    
    //objects.push(map)

}, undefined, function ( error ) {

	console.error( error );

} );

// Sets up websocket to conenct to server and notify of player connection

const socket = new WebSocket("ws://localhost:9000");
 socket.onopen = function(event) {
     console.log("WebSocket is open now.");
     socket.send(JSON.stringify({action: "connect", playerName: playerName}))
  };

socket.onmessage = function(event)
{

    // TODO:: Prevent the server from even repeating the message to the client from which it originated.
    let messageObj = JSON.parse(event.data);
    if(messageObj.playerName != playerName)
    {
        handleMessage(messageObj);
    }
    
}

//Network Handler

function handleMessage(message)
{
    switch (message.action) {
        case "move":
          movePlayer(message);
          break;
        case "connect":
          playerConnects(message);
          break;
        case "disconnect":
            playerDisconnects(message);
        break;
        case "update":
            playerUpdates(message);
        break;
        case "damagePlayer":
            assignDamage(message);
        break;
      }
}

//Network logic handlers
function movePlayer(message)
{
    playerList.map(playerItem =>
        {
            if(message.playerName == playerItem.playerName)
            {
                playerItem.player.position.set(message.position.x,message.position.y,message.position.z);
            }
        })
}

function playerConnects(message)
{
    //Adds the new player to the playerList array and responds by sending a ping informing the new player of their location
    //The other player responds by adding each other player to their playerList based on the pings it recieves
    playerList.push(new playerObject(message.playerName))
    console.log(playerList[playerList.length-1].playerName +" has joined!")
    socket.send(JSON.stringify({action: "update", playerName: playerName, position: playerObj.position}))
}

function playerUpdates(message)
{
    //When our player loads in we reqeust pings from other players already in the game with "playerConnects"
    //Here we receive them and add each player to the playerList as well as moving them to their current position
    playerList.push(new playerObject(message.playerName))
    movePlayer({action: "move", playerName: message.playerName, position: message.position})
    updatePlayerList();
}

function updatePlayerList()
{
    //Keep a visual lsit of connected players
    //Will only add new players, will not delete old players
    playerList.map(item => {
        var node = document.createElement('li');
        node.appendChild(document.createTextNode(item.playerName));
        document.getElementById("players").appendChild(node)
    })
}

function damagePlayer(name, weapon, damage)
{
    //Called when damage occurs on our client and informs the other clients of this damage
    socket.send(JSON.stringify({
        action: "damagePlayer", 
        attackerName: playerName, 
        victimName: name,
        weapon: weapon, 
        damageAmount: damage
    }))
}

function assignDamage(message)
{
    //When we recieve a damage message, we check if the damage is being assigned to our player, if so
    //decrement our health or kill ourselves if it is too low
    console.log(message)
    if(playerName == message.victimName)
    {
        playerHealth -= message.damageAmount;
        console.log( message.attackerName + "attacked you with " + message.weapon + " for " + message.damageAmount + " damage");
        console.log("Your health is now " + playerHealth);
        if(playerHealth <= 0)
        {
            console.log("You died")
            die(message);
        }
    }
}

function die(finalDamageDetails)
{
    //Accepts the details of the killing blow and credits the kill then "kills" the player locally
    if(finalDamageDetails.victimName = playerName)
    {
        var details = finalDamageDetails;
        details.action = "kill";
        socket.send(JSON.stringify({ details}));
    } else
    {
        //TODO
    }
    
}

function playerDisconnencts(name)
{
}

// Set up overlays
//death overlay

//Setup scene

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight,0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

//Obj1

const geometry = new THREE.BoxGeometry(3, 5, 5, 100);
const material = new THREE.MeshStandardMaterial({color: 0xcc33ff });
const torus = new THREE.Mesh(geometry, material);
torus.name = "torus"


//Creating player object

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

const mouseDown = function ( event ) {
    switch ( event.button ) {

        case 0:
           leftClick = true;
            break;
        case 1:
            console.log("middle")
            break;
        case 2:
            rightClick = true;
            break;
            

    }

};

const mouseUp = function ( event ) {
    switch ( event.button ) {

        case 0:
            leftClick = false;
            break;
        case 1:
            console.log("middle")
            break;
        case 2:
            rightClick = false;
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
document.addEventListener( 'mousedown', mouseDown );
document.addEventListener( 'mouseup', mouseUp );

// Object Controls

controls.getObject().position.y = 3;

// Adding objects to the scene

scene.add(ambientLight);
scene.add(pointLight);
scene.add(camera);
scene.add(torus);
scene.add(plane);
scene.add(playerObj);
//scene.add(player2Obj);

//Adding Objects to the collisoin array

objects.push(plane);
objects.push(torus);

//Hit detection
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var attackTimer = new THREE.Clock(false);
function shoot()
{
    if(attackTimer.getElapsedTime() >=0.2)
    {
        attackTimer.stop();
    }
    if(!attackTimer.running)
    {	
        raycaster.setFromCamera( mouse, camera );	
        var intersects = raycaster.intersectObjects( scene.children );

        if(playerList.some(player => player.playerName === intersects[0].object.name)){
            damagePlayer(intersects[0].object.name, "defaultWeapon", 10)
            console.log(playerName + " hit " +intersects[0].object.name)

        } else{
            //
        }
        console.log(intersects[0].object.name)
        attackTimer.stop();
        attackTimer.start();
    }
    
}

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
        controls.moveForward(0.2)
    }
    if (moveForward && sprint) {
        controls.moveForward(0.4)
    }
    if (moveBackward) {
        controls.moveForward(-0.2);
    }
    if (moveLeft) {
        controls.moveRight(-0.2);
    }
    if (moveRight) {
        controls.moveRight(0.2);
    }
    if (leftClick) {
        shoot();
    }
    if (rightClick) {
        //
    }

    //Transmitting player movements
    if(playerpositionOld)
    {
        if(playerpositionOld != JSON.stringify(playerObj.position))
        {
            wspayload = {};
            wspayload.position = playerObj.position;
            wspayload.playerName = playerName;
            wspayload.action = "move";
            socket.send(JSON.stringify(wspayload));
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


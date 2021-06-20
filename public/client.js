import * as THREE from '/build/three.module.js';
import { Clock, Mesh, MeshToonMaterial, TetrahedronBufferGeometry } from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'
import { PointerLockControls } from '/jsm/controls/PointerLockControls.js'
import { GLTFLoader } from '/jsm/loaders/GLTFLoader.js';

const objects = [];
const spawnPoints = [[0,3,0],[15,3,9],[-6,3,-25],[-27,3,-5]]

let wspayload = {};
let playerpositionOld = false;
let playerrotationOld = false;
let playerHealth = 100;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let inFloor = false;
let jump = false;
let sprint = false;
let grounded = false;
let leftClick = false;
let rightClick = false;
let dead = false;
let spawned = false;
var leaderBoard = [];
let showLeaderBoard = false;

let gunAccuracy = 0.03;
let gunMagazineSize = 30;
let gunAmmo = 30;
let gunDamage = 25;
let gunFireRate = 0.1;
let reload = false;

let blockedForward = false;
let blockedBackward = false;
let blockedLeft = false;
let blockedRight = false;
let blockedTop = false;

// The player class that is created for each player

class playerObject
{
    constructor (name)
    {
        this.playerName = name;
        this.geometry = new THREE.BoxGeometry(1, 3, 1, 100);
        this.material = new THREE.MeshStandardMaterial({color: 0x00FFFF });
        this.player = new THREE.Mesh(this.geometry, this.material);
        this.player.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, -1, 0) );
        this.player.name = name;
    }

    spawn(x, y, z)
    {
        scene.add(this.player);
        this.player.position.set(0,10,0)
    }
    kill()
    {
        scene.remove(this.player);
    }
    
}

function getPlayerIndexByName(name)
{
    let selectedIndex;
    playerList.map((playerItem, index) =>
        {
            if(playerItem.playerName == name)
            {
                selectedIndex = index;
            }
        })
    return selectedIndex
}

document.getElementById ("respawn").addEventListener ("click", e => spawn(), false);

function spawn()
{
    var spawnPoint = spawnPoints[Math.floor(Math.random()*spawnPoints.length)];
    controls.getObject().position.set(spawnPoint[0],spawnPoint[1],spawnPoint[2],);
    socket.send(JSON.stringify({action: "spawnPlayer", playerName: playerName, position: playerObj.position}))
    dead = false;
    spawned = true;
    playerHealth = 100;
    
}

//List of players
let playerList = [];

// Player creation
let playerName = prompt("Please enter your name", "")

// Loading the map
const gltfloader = new GLTFLoader();

let map;
var gun;

gltfloader.load( 'arena/scene.gltf', function ( gltf ) {
    map = gltf.scene;
    map.name = "teeeeeeee"
    map.position.set(0,0.1,0)
    objects.push(map)
    scene.add( map );
    //objects.push(map)

}, undefined, function ( error ) {

	console.error( error );

} );

gltfloader.load( 'gun/gun.gltf', function ( gltf ) {
    gun = gltf.scene;
    gun.name = "teeeeeeee"
    gun.position.set(0.3,-0.3,-1)
    gun.scale.set(0.2,0.2,0.2)
    //gun.position.set(3,-1,1).applyQuaternion( camera.quaternion )
    //gun.rotation.set(0,1.5708,0)
    camera.add( gun );
    //objects.push(map)

}, undefined, function ( error ) {

	console.error( error );

} );



// Sets up websocket to conenct to server and notify of player connection
console.log(window.location.host)
const socket = new WebSocket("wss://" + window.location.host );
 socket.onopen = function(event) {
     console.log("WebSocket is open now.");
     socket.send(JSON.stringify({action: "connect", playerName: playerName}))
     spawned = true;
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
        case "killPlayer":
            killPlayer(message);
        break;
        case "spawnPlayer":
            spawnPlayer(message);
        break;
        case "leaderBoardUpdate":
            updateLeaderBoard(message);
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
                playerItem.player.rotation.set(message.rotation._x,message.rotation._y,message.rotation._z);
            }
        })
}

function playerConnects(message)
{
    //Adds the new player to the playerList array and responds by sending a ping informing the new player of their location
    //The other player responds by adding each other player to their playerList based on the pings it recieves
    let newPlayer = new playerObject(message.playerName);
    playerList.push(newPlayer);
    newPlayer.spawn();
    console.log(playerList[playerList.length-1].playerName +" has joined!")
    socket.send(JSON.stringify({action: "update", playerName: playerName, position: playerObj.position}))
}

function playerUpdates(message)
{
    //When our player loads in we reqeust pings from other players already in the game with "playerConnects"
    //Here we receive them and add each player to the playerList as well as moving them to their current position
    let newPlayer = new playerObject(message.playerName);
    newPlayer.spawn();
    playerList.push(newPlayer);
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
            dead = true;
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
        details.action = "killPlayer";
        socket.send(JSON.stringify(details));
    } else
    {
        //TODO
    }
    
}

function killPlayer(message)
{
    console.log(message)
    playerList.map( entity =>
        {
            console.log(entity)
            if(entity.playerName == message.victimName)
            {
                console.log("killplayer "+ entity.playerName)
                entity.kill();
            }
        })
    
}

function spawnPlayer(message)
{
    console.log(message)
    let spawningPlayer = playerList[getPlayerIndexByName(message.playerName)];
    spawningPlayer.spawn(10,10,10);
}

function updateLeaderBoard(message)
{
    console.log(message.leaderBoard)
    leaderBoard = Object.values(message.leaderBoard);
    console.log(leaderBoard)

    document.getElementById("leaderBoard").innerHTML = "";
    leaderBoard.forEach(function (item) {
        let li = document.createElement('li');
        document.getElementById("leaderBoard").appendChild(li);
        li.innerHTML += item.name + " Kills: "+item.points+" Deaths: "+item.deaths;
    });
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

//Sounds

// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera.add( listener );

// create a global audio source
const sound = new THREE.Audio( listener );


// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load( 'shoot.mp3', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setVolume( 0.5 );
    
	
});

//Skybox

let materialArray = [];
let texture_ft = new THREE.TextureLoader().load( 'arid2/arid2_ft.jpg');
let texture_bk = new THREE.TextureLoader().load( 'arid2/arid2_bk.jpg');
let texture_up = new THREE.TextureLoader().load( 'arid2/arid2_up.jpg');
let texture_dn = new THREE.TextureLoader().load( 'arid2/arid2_dn.jpg');
let texture_rt = new THREE.TextureLoader().load( 'arid2/arid2_rt.jpg');
let texture_lf = new THREE.TextureLoader().load( 'arid2/arid2_lf.jpg');
  
materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));
   
for (let i = 0; i < 6; i++)
  materialArray[i].side = THREE.BackSide;
   
let skyboxGeo = new THREE.BoxGeometry( 900, 900, 900);
let skyboxMat = new THREE.MeshStandardMaterial({color: 0x00FFFF });
let skybox = new THREE.Mesh( skyboxGeo, materialArray );
scene.add( skybox );

//Obj1

const geometry = new THREE.BoxGeometry(3, 5, 5, 100);
const material = new THREE.MeshStandardMaterial({color: 0xcc33ff });
const torus = new THREE.Mesh(geometry, material);
torus.name = "torus"
torus.rotateX(0.5)


//Creating player object

const playerGeo = new THREE.BoxGeometry(2, 7, 2, 100);
const playerMat = new THREE.MeshStandardMaterial({color: 0x00FFFF });
const playerObj = new THREE.Mesh(playerGeo, playerMat);
playerObj.position.set(0,10,0);

//Floor

var geo = new THREE.PlaneBufferGeometry(2000, 2000, 8, 8);
var mat = new THREE.MeshStandardMaterial({ color: 0xb87a2a, side: THREE.DoubleSide });
var plane = new THREE.Mesh(geo, mat);
plane.name ="plane";
plane.rotateX( - Math.PI / 2);

//Add a light

const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5,25,5);
const ambientLight = new THREE.AmbientLight(0xffffff,1);

// Helpers

 const lightHelper = new THREE.PointLightHelper(pointLight)
 const gridHelper = new THREE.GridHelper(200, 50);
 scene.add(lightHelper, gridHelper)

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
        case 'KeyR':
            reload = true;
            break;
        case 'KeyL':
            showLeaderBoard = true;
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
    if(!jumpTimer.running && grounded)
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
        case 'KeyR':
            reload = false;
            break;
        case 'KeyL':
            showLeaderBoard = false;
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

//Adding Objects to the collisoin array

objects.push(plane);
objects.push(torus);

//SHooting in general////////////////////////////////////////////////////////////////////////
const flashPNG = new THREE.TextureLoader().load( 'gun/flash.png' );
const flashMaterial = new THREE.SpriteMaterial( { map: flashPNG } );

const holePNG = new THREE.TextureLoader().load( 'gun/bulletHole.png' );
const holeMaterial = new THREE.SpriteMaterial( { map: holePNG} );

const muzzleFlash = new THREE.Sprite( flashMaterial );
const lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff } );
const lineGeometry = new THREE.BufferGeometry()
//const LineGeometry = new THREE.BufferGeometry().setFromPoints([intersects[0].point, gun.getWorldPosition() ]);
const line = new THREE.Line( lineGeometry, lineMaterial );

function hitMarker(x)
{
    if(x)
    {
        document.getElementById("crosshair").innerHTML = "(+)";
    } else{
        document.getElementById("crosshair").innerHTML = "+";
    }
}

//var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 5, 0 ), 0, 0 );
var attackTimer = new THREE.Clock(false);
function shoot()
{

    if(!attackTimer.running)
    {	
        if(gunAmmo > 0)
        {
            gunAmmo--;
            document.getElementById("ammoCounter").innerHTML = gunAmmo;
            var testt = new THREE.Vector2();
            testt.y = (Math.random()*1>0.5?Math.random()*gunAccuracy*-1:Math.random()*gunAccuracy*1);
            testt.x = (Math.random()*1>0.5?Math.random()*gunAccuracy*-1:Math.random()*gunAccuracy*1);
            gun.add(muzzleFlash);
            muzzleFlash.position.z = -5;
            muzzleFlash.scale.set(3,3,3);
            //gun.position.z += -0.5
            sound.play();
            raycaster.setFromCamera( testt, camera );	
            var intersects = raycaster.intersectObjects( scene.children, true );
            // how to get point where bulelt hits //console.log(intersects[0].point)
            var gunPosition = new THREE.Vector3();
            gun.getWorldPosition(gunPosition)
            let bulletArc = new THREE.BufferGeometry().setFromPoints([intersects[0].point, gunPosition ]);
            line.geometry = bulletArc;
            scene.add(line);

            if(intersects.length >0)
            {
                if(playerList.some(player => player.playerName === intersects[0].object.name)){
                    hitMarker(true);
                    damagePlayer(intersects[0].object.name, "defaultWeapon", gunDamage)
                    console.log(playerName + " hit " +intersects[0].object.name)
                    

                }
                
            }
            attackTimer.stop();
            attackTimer.start();
        }
        
    }
    else  
    if(attackTimer.getElapsedTime() > gunFireRate)
    {
        attackTimer.stop();
        sound.stop();
        //gun.position.z += 0.5
        //gun.remove(muzzleFlash);
        //scene.remove(line);
    }
    
}


const down = new THREE.Vector3(0, -1, 0);
const raycaster2 = new THREE.Raycaster();

function detectFloorCollisions(object1, object2)
{
    raycaster2.set(playerObj.position, down);
    const collisionResults = raycaster2.intersectObject(object2, true);
    inFloor = false;
    if(collisionResults.length > 0)
    {   
        if(collisionResults[0].distance > 3)
        {
            return false;
        }
        else if(collisionResults[0].distance < 2.5)
        {
            controls.getObject().position.y += 0.1;
            inFloor = true;
            return true;
        }
        else
        {
            return true;
        }
    }
}

function detectFrontCollisions(object1, object2)
{
    var direction = new THREE.Vector3( 0, 0, -1 ).applyQuaternion( playerObj.quaternion );
    raycaster2.set(playerObj.position, direction);
    
    const collisionResults = raycaster2.intersectObject(object2, true);
    inFloor = false;
    if(collisionResults.length > 0)
    {   
        if(collisionResults[0].distance > 1.1)
        {
            return false;
        }
        else if(collisionResults[0].distance < 0.9)
        {
            controls.moveForward(-0.2)
            return true;
        }
        else
        {
            return true;
        }
    }
}

function detectLeftCollisions(object1, object2)
{
    var direction = new THREE.Vector3( 1, 0, 0 ).applyQuaternion( playerObj.quaternion );
    raycaster2.set(playerObj.position, direction);
    
    const collisionResults = raycaster2.intersectObject(object2, true);
    inFloor = false;
    if(collisionResults.length > 0)
    {   
        if(collisionResults[0].distance > 1.1)
        {
            return false;
        }
        else if(collisionResults[0].distance < 0.9)
        {
            controls.moveRight(-0.2)
            return true;
        }
        else
        {
            return true;
        }
    }
}

function detectRightCollisions(object1, object2)
{
    var direction = new THREE.Vector3( -1, 0, 0 ).applyQuaternion( playerObj.quaternion );
    raycaster2.set(playerObj.position, direction);
    
    const collisionResults = raycaster2.intersectObject(object2, true);
    inFloor = false;
    if(collisionResults.length > 0)
    {   
        if(collisionResults[0].distance > 1.1)
        {
            return false;
        }
        else if(collisionResults[0].distance < 0.9)
        {
            controls.moveRight(0.2)
            return true;
        }
        else
        {
            return true;
        }
    }
}

function detectBackCollisions(object1, object2)
{
    var direction = new THREE.Vector3( 0, 0, 1 ).applyQuaternion( playerObj.quaternion );
    raycaster2.set(playerObj.position, direction);
    
    const collisionResults = raycaster2.intersectObject(object2, true);
    inFloor = false;
    if(collisionResults.length > 0)
    {   
        if(collisionResults[0].distance > 1)
        {
            return false;
        }
        else if(collisionResults[0].distance < 0.9)
        {
            controls.moveForward(0.2)
            return true;
        }
        else
        {
            return true;
        }
    }
}

function detectTopCollisions(object1, object2)
{
    var direction = new THREE.Vector3( 0, 1, 0 ).applyQuaternion( playerObj.quaternion );
    raycaster2.set(playerObj.position, direction);
    
    const collisionResults = raycaster2.intersectObject(object2, true);
    inFloor = false;
    if(collisionResults.length > 0)
    {   
        if(collisionResults[0].distance > 1)
        {
            return false;
        }
        else if(collisionResults[0].distance < 0.9)
        {
            jump = false;
            jumpTimer.stop();
            return true;
        }
        else
        {
            jump = false;
            jumpTimer.stop();
            return true;
        }
    }
}

var jumpTimer = new THREE.Clock(false);
var fallTimer = new THREE.Clock(false);
function detectFloorCollisionsold(object1, object2){
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

    grounded = false;
    blockedForward = false;
    blockedBackward = false;
    blockedLeft = false;
    blockedRight = false;
    blockedTop = false;

    objects.map( object => {
        if(detectFloorCollisions(playerObj, object))
        {
            grounded = true;
        }
        if(detectFrontCollisions(playerObj, object))
        {
            blockedForward = true;
        }
        if(detectBackCollisions(playerObj, object))
        {
            blockedBackward = true;
        }
        if(detectLeftCollisions(playerObj, object))
        {
            blockedLeft= true;
        }
        if(detectRightCollisions(playerObj, object))
        {
            blockedRight = true;
        }
        if(detectTopCollisions(playerObj, object))
        {
            blockedTop = true;
        }
        if(blockedRight && blockedLeft && blockedLeft && blockedBackward)
        {
            controls.moveForward(-1)
        }
    })

    // Move up if in floor

    //Jumping

    if(!grounded)
    {
        //console.log(fallTimer.getElapsedTime());
        controls.getObject().position.y += -0.3;
    }

    if(jump)
    {
        controls.getObject().position.y += 0.3 + (0.4-jumpTimer.getElapsedTime());
    } 
    if(jumpTimer.getElapsedTime() >=0.4)
    {
        jumpTimer.stop();
        jump = false;
    }

    //Movement
    if(!dead && spawned)
    {
        if (moveForward && !sprint && !blockedForward) {
            controls.moveForward(0.2)
        }
        if (moveForward && sprint) {
            controls.moveForward(0.4)
        }
        if (moveBackward && !blockedBackward) {
            controls.moveForward(-0.2);
        }
        if (moveLeft && !blockedRight) {
            controls.moveRight(-0.2);
        }
        if (moveRight && !blockedLeft) {
            controls.moveRight(0.2);
        }
        if (leftClick) {
            shoot();
        }
        if (reload) {
            gunAmmo = gunMagazineSize;
        }
        if (rightClick) {
            //
        }
    }
    

    //Transmitting player movements
    if(playerpositionOld || playerrotationOld)
    {
        if(playerpositionOld != JSON.stringify(playerObj.position) || playerrotationOld != JSON.stringify(playerObj.rotation))
        {
            wspayload = {};
            wspayload.position = playerObj.position;
            wspayload.rotation = playerObj.rotation;
            wspayload.playerName = playerName;
            wspayload.action = "move";
            socket.send(JSON.stringify(wspayload));
            playerpositionOld = JSON.stringify(playerObj.position)
            playerrotationOld = JSON.stringify(playerObj.rotation)
        }
    } else
    {
        playerpositionOld = JSON.stringify(playerObj.position)
        playerrotationOld = JSON.stringify(playerObj.rotation)
    }

    //Checking if player is dead and spawned
    if(dead)
    {
        document.getElementById("deathScreen").style.visibility = "visible";
        controls.unlock();
    }else
    {
        document.getElementById("deathScreen").style.visibility = "hidden";
    }

    //Damage Overlay
    if(playerHealth<100 && !dead)
    {
        let redLevel 
        document.getElementById("damageOverlay").style.backgroundColor= "rgba(95, 0, 0, "+((playerHealth>30)?(1-(playerHealth/100)):0.7)+")"
        playerHealth += 0.1;
    }
    else if(dead)
    {
        document.getElementById("damageOverlay").style.backgroundColor= "rgba(95, 0, 0, 0)"
        
    }

    //Score overlay
    if(showLeaderBoard)
    {
        document.getElementById("scoreBoard").style.visibility = "visible";
    }
    else
    {
        document.getElementById("scoreBoard").style.visibility = "hidden"; 
        
    }
    if(attackTimer.getElapsedTime() > 0.02)
    {
        gun.remove(muzzleFlash);
        scene.remove(line);
    }
    
}


animate();

//Accounting for window resize

window.addEventListener( 'resize', onWindowResize );
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}


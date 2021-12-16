import * as THREE from '/build/three.module.js';
import { GLTFLoader } from '/jsm/loaders/GLTFLoader.js';
// The player class that is created for each player
function loadModelF(gltfloader, camera, url, defaultX, defaultY, defaultZ, defaultXScale, defaultYScale, defaultZScale){

    const myPromise = new Promise((resolve, reject) => {
        var gun;
        gltfloader.load(url, function (gltf) {
            gun = gltf.scene;
            gun.name = "tee"
            //Set default position with default.x and default.y vars
            gun.position.y = defaultY;
            gun.position.x = defaultX;
            gun.position.z = defaultZ;
            gun.scale.set(defaultXScale, defaultYScale, defaultZScale)
            //gun.position.set(3,-1,1).applyQuaternion( camera.quaternion )
            //gun.rotation.set(0,1.5708,0)
            camera.add(gun);
            resolve(gun);
            //objects.push(map)

        }, undefined, function (error) {

            console.error(error);

        });
    });
        return myPromise;
    
}
function loadModelF2(gltfloader, camera, url, defaultX, defaultY, defaultZ, defaultXScale, defaultYScale, defaultZScale){

    const myPromise = new Promise((resolve, reject) => {
        var gun;
        gltfloader.load(url, function (gltf) {
            gun = gltf.scene;
            gun.name = "tee"
            //Set default position with default.x and default.y vars
            gun.position.y = defaultY;
            gun.position.x = defaultX;
            gun.position.z = defaultZ;
            gun.scale.set(defaultXScale, defaultYScale, defaultZScale)
            //gun.position.set(3,-1,1).applyQuaternion( camera.quaternion )
            //gun.rotation.set(0,1.5708,0)
            //camera.add(gun);
            console.log(camera.children)
            //camera.children[1].geometry.copy(gun)
            console.log(camera.children)
            
            resolve(gun);
            //objects.push(map)

        }, undefined, function (error) {

            console.error(error);

        });
    });
        return myPromise;
    
}



function getGun(selectedGun) {
    if(!selectedGun)
    selectedGun = 0;
    var SMG = {
        url: 'gun/vsgwr.gltf',
        gunAccuracy: 0.02,
        adsAccuracy: 0.005,
        gunMagazineSize: 30,
        gunAmmo: 30,
        gunDamage: 25,
        gunFireRate: 0.1,
        name: "SMG",
        defaultX: 0.2,
        defaultY: -0.2,
        defaultZ: 0,
        defaultXScale: 0.2,
        defaultYScale: 0.2,
        defaultZScale: 0.2,
        adsX: 0,
        adsY: -0.1,
        loadModel: (gltfloader, camera) => loadModelF(gltfloader, camera, SMG.url, 
            SMG.defaultX, SMG.defaultY, SMG.defaultZ, 
            SMG.defaultXScale, SMG.defaultYScale, SMG.defaultZScale),
        
    }
    var SMG2 = {
        url: 'gun/gun.gltf',
        gunAccuracy: 0.02,
        adsAccuracy: 0.005,
        gunMagazineSize: 30,
        gunAmmo: 30,
        gunDamage: 25,
        gunFireRate: 0.1,
        name: "SMG2",
        defaultX: 0.2,
        defaultY: -0.2,
        defaultZ: 0,
        defaultXScale: 0.2,
        defaultYScale: 0.2,
        defaultZScale: 0.2,
        adsX: 0,
        adsY: -0.1,
        loadModel: (gltfloader, camera) => loadModelF(gltfloader, camera, SMG2.url, 
            SMG2.defaultX, SMG2.defaultY, SMG2.defaultZ, 
            SMG2.defaultXScale, SMG2.defaultYScale, SMG2.defaultZScale),
            loadModel2: (gltfloader, camera) => loadModelF2(gltfloader, camera, SMG2.url, 
                SMG2.defaultX, SMG2.defaultY, SMG2.defaultZ, 
                SMG2.defaultXScale, SMG2.defaultYScale, SMG2.defaultZScale)
    }
    switch(selectedGun) {
        case 0:
            return SMG;
          break;
        case 1:
            return SMG2;
          break;
        default:
          // code block
      } 
    
}


export default function weaponClass(gltfloader, camera) {
    var playerGun = getGun();
    playerGun.loadModel(gltfloader, camera).then((result) => {
        playerGun.weaponModel = result;
    })
    //console.log(playerGun.weaponModel.position.y)
    playerGun.changeGun = (number) => {
        //camera.remove(playerGun.weaponModel)

        //Solutions
        //Add all guns to camera and "enable" the active one only, is this possilbe?
        
        playerGun = getGun(number);
        playerGun.loadModel2(gltfloader, camera).then((result) => {
            playerGun.weaponModel = result;
        })
    }
    return playerGun;

}
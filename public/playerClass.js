import * as THREE from 'three';
// The player class that is created for each player

export default class playerClass
{
    constructor (name, scene)
    {
        this.playerName = name;
        this.geometry = new THREE.BoxGeometry(1, 3, 1, 100);
        this.material = new THREE.MeshStandardMaterial({color: 0x898989 });
        this.player = new THREE.Mesh(this.geometry, this.material);
        this.player.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, -1, 0) );
        this.player.name = name;
        this.scene = scene
    }

    spawn(x, y, z)
    {
        this.scene.add(this.player);
        this.player.position.set(0,10,0)
    }
    kill()
    {
        this.scene.remove(this.player);
    }
    
}
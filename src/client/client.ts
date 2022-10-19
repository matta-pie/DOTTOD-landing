import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let floorMat: THREE.MeshStandardMaterial;
let textureLoader: THREE.TextureLoader
let bulbLight: THREE.PointLight;
let bulbMat, bulbMat2: THREE.MeshStandardMaterial;
let composer: EffectComposer;
let mixer: THREE.AnimationMixer;
let clock: THREE.Clock;
let roomba_heading: THREE.Vector3 = new THREE.Vector3;
let roomba: any;
let dottod_object: Piece[] = []
//, hemiLight, stats;
let dottod_object_paths = [
    {
        "path": "models/wassily/",
        "obj": "Wassily Chair.obj",
        "mtl": "Wassily Chair.mtl",
        "x": -5,
        "z": -5,
    },
    {
        "path": "models/eames/",
        "obj": "Eames Wire Chair.obj",
        "mtl": "Eames Wire Chair.mtl",
        "x": -5,
        "z": 5,
    },
    {
        "path": "models/diamond/",
        "obj": "diamond chair bertoia.obj",
        "mtl": "diamond chair bertoia.mtl",
        "x": 2,
        "z": 6,
    },
    {
        "path": "models/cadeira/",
        "obj": "CadeiraCescaMarcel.obj",
        "mtl": "CadeiraCescaMarcel.mtl",
        "x": 6,
        "z": -2,
    },
]
const params = {
    shadows: true,
    exposure: 0.68,
    hemiIrradiance: 0.0001,
    bloomStrength: 1,
    bloomThreshold: 0.2,
    bloomRadius: 0
};

init();
animate();

function init() {
    // CLOCK
    clock = new THREE.Clock();
    // SCENE
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.x = 0;
    camera.position.z = 12;
    camera.position.y = 2.8;
    // RENDERER
    renderer = new THREE.WebGLRenderer();
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    textureLoader = new THREE.TextureLoader();

    addLights();
    addGround();
    loadModel();

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 1;
    controls.maxDistance = 20;

    const btn_enter = document.getElementById("btn_enter");
    if(btn_enter) {
        btn_enter.addEventListener("click", () => {
            dottod_object.forEach((piece: Piece) => scene.add(piece.object))
        });
    }
    window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    requestAnimationFrame(animate)
    const delta = clock.getDelta();
    if(roomba) moveRoomba(0.005);
    if(scene.getObjectByName('piece_0')) {
        dottod_object.forEach((piece: Piece) => {
            if (piece.object.position.y < 0) {
                piece.object.position.y += delta * 0.5;
                if (piece.object.position.y >= 0) {
                    bulbLight.power = 800;
                    scene.add(piece.spotLight);
                }
            }
        })
    }
    render()
}

function render() {
    renderer.toneMappingExposure = Math.pow( params.exposure, 5.0 ); // to allow for very bright scenes.
    renderer.shadowMap.enabled = params.shadows;
    renderer.render(scene, camera)
}

function moveRoomba(speed: number) {
    var dx = roomba.position.x - roomba_heading.x;
    var dz = roomba.position.z - roomba_heading.z;

    if (Math.abs(dx) < 0.2 && Math.abs(dz) < 0.2) {
        roomba_heading.setX(Math.floor(Math.random() * 10) - 5);
        roomba_heading.setZ(Math.floor(Math.random() * 10) - 5);
    }

    if (Math.abs(dx) > 0.2) {
        if(dx > 0) roomba.position.x -= speed;
        else roomba.position.x += speed;
    }
    if (Math.abs(dz) > 0.2) {
        if(dz > 0) roomba.position.z -= speed;
        else roomba.position.z += speed;
    }
}

function addLights() {
    // LIGHT
    bulbLight = new THREE.PointLight( 0xffee88, 1, 100, 2 );
    bulbLight.position.set( 0, 4, 0 );
    bulbLight.castShadow = true;
    bulbLight.power = 2000;
    // to show where the light is
//     const bulbGeometry = new THREE.SphereGeometry( 0.02, 16, 8 );
//     bulbMat = new THREE.MeshStandardMaterial( {
//         emissive: 0xffffee,
//         emissiveIntensity: 100,
//         color: 0x000000
//     } );
    // bulbLight.add( new THREE.Mesh( bulbGeometry, bulbMat ) );
    scene.add(bulbLight);

    //var light = new THREE.AmbientLight(0xffee88, 1);
    //scene.add( light );
}

function addGround(){
    // GROUND
    floorMat = new THREE.MeshStandardMaterial( {
        roughness: 0.8,
        color: 0xffffff,
        metalness: 0.2,
        bumpScale: 0.0005
    } );

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load( 'textures/hardwood2_diffuse.jpg', function ( map ) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 10, 10 );
        map.encoding = THREE.sRGBEncoding;
        floorMat.map = map;
        floorMat.needsUpdate = true;
    } );
    textureLoader.load( 'textures/hardwood2_diffuse.jpg', function ( map ) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 10, 10 );
        floorMat.bumpMap = map;
        floorMat.needsUpdate = true;
    } );

    const floorGeometry = new THREE.PlaneGeometry( 20, 20 );
    const floorMesh = new THREE.Mesh( floorGeometry, floorMat );
    floorMesh.receiveShadow = true;
    floorMesh.rotation.x = - Math.PI / 2.0;
    scene.add(floorMesh);
}

function loadModel() {
    new MTLLoader()
    .setPath( 'models/test/' )
    .load( 'test.mtl', function ( materials ) {
        materials.preload();
        new OBJLoader()
        .setMaterials( materials )
        .setPath( 'models/test/' )
        .load( 'test.obj', function ( object ) {
            object.position.set(-0.57,0,0);
            object.traverse(function (child){child.castShadow = true;});
            object.scale.set(0.05,0.05,0.05);
            scene.add(object);
            console.log(object);
            }, onProgress );
    });

    new MTLLoader()
    .setPath( 'models/roomba/' )
    .load( 'roomba560.mtl', function ( materials ) {
        materials.preload();
        new OBJLoader()
        .setMaterials( materials )
        .setPath( 'models/roomba/' )
        .load( 'roomba560.obj', function ( object ) {
            object.position.set(-5,0,5);
            object.traverse(function (child){child.castShadow = true;});
            object.scale.set(0.002,0.002,0.002);
            roomba = object;
            scene.add( object );
            console.log(object);
            }, onProgress );
    });

    dottod_object_paths.forEach((e: any) => {
        new MTLLoader()
        .setPath(e.path)
        .load(e.mtl, function ( materials ) {
            materials.preload();
            new OBJLoader()
            .setMaterials( materials )
            .setPath(e.path)
            .load(e.obj, function (object) {
                object.name = 'piece_' + dottod_object.length;
                object.position.set(e.x,-2,e.z);
                object.traverse(function (child){child.castShadow = true;});
                object.scale.set(0.05,0.05,0.05);
                //Piece
                dottod_object.push(new Piece(object));
                }, onProgress );
        });
    })

    const onProgress = function ( xhr: any ) {
        if ( xhr.lengthComputable ) {
            const percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete) + '% downloaded' );
        }
    };
}

class Piece {
    object: any;
    spotLight: THREE.SpotLight;
    constructor(object: any) {
        this.object = object;

        const texture = textureLoader.load('textures/texture_eames1.jpeg');
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;

        this.spotLight = new THREE.SpotLight( 0xffffff, 1000 );
        this.spotLight.position.set(object.position.x, 8, object.position.z);
        this.spotLight.angle = Math.PI / 10;
        this.spotLight.penumbra = 1;
        this.spotLight.decay = 2;
        this.spotLight.distance = 10;
        this.spotLight.power = 2500;
        // @ts-ignore
        this.spotLight.map = texture;

        this.spotLight.castShadow = true;
        this.spotLight.shadow.mapSize.width = 1024;
        this.spotLight.shadow.mapSize.height = 1024;
        this.spotLight.shadow.camera.near = 10;
        this.spotLight.shadow.camera.far = 200;
        this.spotLight.shadow.focus = 1;

        this.spotLight.target.position.set(object.position.x, 1, object.position.z);
        this.spotLight.target.updateMatrixWorld();
        // scene.add(this.spotLight);
        //      const lightHelper = new THREE.SpotLightHelper( this.spotLight );
        //      scene.add( lightHelper );
    }
}

import * as THREE from 'three'
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
const pointer: THREE.Vector2 = new THREE.Vector2();
const raycaster: THREE.Raycaster = new THREE.Raycaster();
let controls : OrbitControls;

let floorMat: THREE.MeshStandardMaterial;
let textureLoader: THREE.TextureLoader
let bulbLight: THREE.PointLight;
let ambientLight: THREE.AmbientLight;
let clock: THREE.Clock;
let roomba_heading: THREE.Vector3 = new THREE.Vector3;
let roomba: any;
let dottod_object: Piece[] = [];
let dottod_raycaster_objects: any[] = [];
let dottod_object_paths = [
    {
        "path": "models/enzo_mari/",
        "obj": "enzo_mari.obj",
        "mtl": "enzo_mari.mtl",
        "x": -2.5,
        "z": 1,
        "scale": 0.025,
        "name": "enzo_og",
        "ai_twin": {
            "path": "models/aienzo/",
            "obj": "ai_enzo.obj",
            "mtl": "ai_enzo.mtl",
            "x": 1.5,
            "z": 1,
            "scale": 0.025,
            "name": "enzo_ai",
        }
    },
    {
        "path": "models/diamond/",
        "obj": "diamond.obj",
        "mtl": "diamond.mtl",
        "x": 5,
        "z": -5.5,
        "scale": 0.05,
        "name": "diamond_og",
        "ai_twin": null,
    },
    {
        "path": "models/cadeira/",
        "obj": "CadeiraCescaMarcel.obj",
        "mtl": "CadeiraCescaMarcel.mtl",
        "x": -6,
        "z": -5,
        "scale": 0.05,
        "name": "cesca_og",
        "ai_twin": null,
    },
]
let tech_specs_container: HTMLElement | null = null;
let spec_wrapper_close: HTMLElement | null = null;
let is_tech_spec_open: boolean = false;

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
    loadModels();

    controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 1;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.update();

    const btn_enter = document.getElementById("btn_enter");
    const btn_enter2 = document.getElementById("btn_enter2");
    const landing_wrapper = document.getElementById("landing_wrapper");

    if(btn_enter && btn_enter2 && landing_wrapper) {
        btn_enter.addEventListener("click", () => {
            landing_wrapper.style.visibility = "hidden";
            landing_wrapper.style.opacity = "0";
            dottod_object.forEach((piece: Piece) => {
                scene.add(piece.original_model);
                if(piece.ai_twin_model) scene.add(piece.ai_twin_model);
            })
        });
        btn_enter2.addEventListener("click", () => {
            landing_wrapper.style.visibility = "hidden";
            landing_wrapper.style.opacity = "0";
            dottod_object.forEach((piece: Piece) => {
                scene.add(piece.original_model);
                if(piece.ai_twin_model) scene.add(piece.ai_twin_model);
            })
        });
    }
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mouseup', onMouseClick);
    tech_specs_container = document.getElementById("tech_specs_container");
    spec_wrapper_close = document.getElementById("spec_wrapper_close");
    spec_wrapper_close!.addEventListener('mouseup', function () {
        let tl = gsap.timeline({onComplete: () => {
            // @ts-ignore
            tech_specs_container.style.display = "none";
            is_tech_spec_open = false;
        }});
        tl.to("#tech_specs_container", {opacity: 0, duration: 1});
    });

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onMouseClick(event: any) {
    if(is_tech_spec_open) return;
    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(dottod_raycaster_objects);
    if (intersects.length > 0) {
        let piece: Piece | undefined = dottod_object.find((p: Piece) => {
            return (
                p.original_model.name === intersects[0].object.parent!.name ||
                (p.ai_twin_model !== null && p.ai_twin_model.name === intersects[0].object.parent!.name)
            );
        });
        if (piece) {
            let wp: THREE.Vector3 = piece.getCenterPoint();
            if (piece.original_model.name === "enzo_og") {
                wp = piece.getInBetweenPoint();
            }

            let tl = gsap.timeline({onComplete: () => {
                    controls.update();
                    // @ts-ignore
                    tech_specs_container.style.display = "block";
                    is_tech_spec_open = true;
                    gsap.to("#tech_specs_container", {opacity: 1, duration: 1});
            }});
            tl.to(camera.rotation, {
                x: 0,
                y: 0,
                z: 0,
                duration: 0.5
            }).to(camera.position, {
                x: wp.x,
                y: 1.5,
                z: wp.z + 4,
                duration: 2,
            });
        }
    }
}

function animate() {
    requestAnimationFrame(animate)
    const delta = clock.getDelta();
    if(roomba) moveRoomba(0.005);
    if(scene.getObjectByName('enzo_og')) {
        dottod_object.forEach((piece: Piece) => {
            if (piece.original_model.position.y < 0) {
                piece.original_model.position.y += delta * 0.5;
                if (piece.original_model.position.y >= 0) {
                    scene.add(piece.spotLight);
                }
            }
            if (piece.ai_twin_model && piece.ai_twin_model.position.y < 0) {
                piece.ai_twin_model.position.y += delta * 0.5;
                if (piece.ai_twin_model.position.y >= 0) {
                    scene.add(piece.ai_twin_spotLight);
                }
            }
        })
    }
    render()
}

function render() {
    renderer.render(scene, camera);
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
    bulbLight = new THREE.PointLight( 0xfffdef, 1, 100, 2 );
    bulbLight.position.set( 0, 4, 0 );
    bulbLight.castShadow = true;
    bulbLight.power = 500;
    scene.add(bulbLight);
    //ambientLight = new THREE.AmbientLight( 0xfffdef );
    //ambientLight.intensity = 0.4;
    //scene.add(ambientLight);
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

function loadModels() {
    new MTLLoader()
    .setPath( 'models/roomba/' )
    .load( 'roomba560.mtl', function ( materials ) {
        materials.preload();
        new OBJLoader()
        .setMaterials( materials )
        .setPath( 'models/roomba/' )
        .load( 'roomba560.obj', function(object) {
            object.position.set(-5,0,5);
            object.traverse(function (child){child.castShadow = true;});
            object.scale.set(0.002,0.002,0.002);
            roomba = object;
            scene.add(object);
            dottod_raycaster_objects.push(object);
            }, onProgress );
    });

    dottod_object_paths.forEach((e: any) => {
        let piece: Piece;
        new MTLLoader()
        .setPath(e.path)
        .load(e.mtl, function (materials) {
            materials.preload();
            new OBJLoader()
            .setMaterials(materials)
            .setPath(e.path)
            .load(e.obj, function (object) {
                object.name = e.name;
                object.position.set(e.x,-2,e.z);
                object.traverse(function (child){child.castShadow = true;});
                object.scale.set(e.scale,e.scale,e.scale);
                dottod_raycaster_objects.push(object);
                piece = new Piece(object);
                dottod_object.push(piece);
                // if there's an ai twin
                if (e.ai_twin !== null) {
                    new MTLLoader()
                        .setPath(e.ai_twin.path)
                        .load(e.ai_twin.mtl, function ( materials ) {
                            materials.preload();
                            new OBJLoader()
                                .setMaterials( materials )
                                .setPath(e.ai_twin.path)
                                .load(e.ai_twin.obj, function (object) {
                                    object.name = e.ai_twin.name;
                                    object.position.set(e.ai_twin.x,-2,e.ai_twin.z);
                                    object.traverse(function (child){child.castShadow = true;});
                                    object.scale.set(e.ai_twin.scale,e.ai_twin.scale,e.ai_twin.scale);
                                    dottod_raycaster_objects.push(object);
                                    piece.setTwin(object);
                                }, onProgress );
                        });
                }
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
    original_model: any;
    ai_twin_model: any = null;
    spotLight: THREE.SpotLight = new THREE.SpotLight(0xffffff, 1000);
    ai_twin_spotLight: THREE.SpotLight = new THREE.SpotLight(0xffffff, 1000);;

    constructor(object: any) {
        this.original_model = object;
        this.assignSpotlight(object, this.spotLight);
    }

    getCenterPoint(object: any = this.original_model) {
        const box = new THREE.Box3().setFromObject(object);
        let center = new THREE.Vector3();
        box.getCenter(center)
        return center;
    }

    getInBetweenPoint() {
        const og_center: THREE.Vector3 = this.getCenterPoint(this.original_model);
        const ai_center: THREE.Vector3 = this.getCenterPoint(this.ai_twin_model);
        return new THREE.Vector3((og_center.x + ai_center.x) / 2, 1.5, (og_center.z + ai_center.z) / 2)
    }

    assignSpotlight(object: any, spotLight: THREE.SpotLight) {
        spotLight.position.set(object.position.x, 5, object.position.z + 5);
        spotLight.angle = Math.PI / 10;
        spotLight.penumbra = 1;
        spotLight.decay = 1.8;
        spotLight.distance = 10;
        spotLight.power = 200;

        spotLight.castShadow = true;

        const object_center: THREE.Vector3 = this.getCenterPoint(object);
        spotLight.target.position.set(object_center.x, 1, object_center.z);
        spotLight.target.updateMatrixWorld();

        // const spotLightHelper = new THREE.SpotLightHelper(spotLight);
        // scene.add(spotLightHelper);
    }

    setTwin(object: any) {
        this.ai_twin_model = object;
        this.assignSpotlight(object, this.ai_twin_spotLight);
    }
}

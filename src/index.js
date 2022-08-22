//Without Webpack
//import * as THREE from './node_modules/three/src/Three.js';
//import GLTFLoader from './node_modules/three-gltf-loader/index.js';
//import {
//    OrbitControls
//} from './node_modules/three/examples/jsm/controls/OrbitControls.js';

//With Webpack

import * as THREE from 'three';
import {
    OrbitControls
} from 'three/examples/jsm/controls/OrbitControls.js';
import GLTFLoader from 'three-gltf-loader';
import Ethylene from './models/ethylene.gltf';
import Ethyne from './models/ethyne.gltf';
import Methane from './models/Methane.gltf';
import MethaneSm from './models/Methane_sm.gltf';
import './public/styles.css';
//import MoleculeViewer from './MoleculeViewer.js';

const loader = new GLTFLoader();
const models = [Ethylene, Ethyne, Methane, MethaneSm];
let canvas;
const tooltip = document.getElementById('tooltip');
let selected = null;
let viewers = [],
    hidden = [],
    viewer,
    renderer;
let mouse = new THREE.Vector2(),
    INTERSECTED;
let fullscreen = false;
let activeViewer = null;

setupKeyControls();
init();
animate();

function init() {

    canvas = document.getElementById("c");

    var template = document.getElementById("template").text;
    var content = document.getElementById("content");
    var addObject = document.getElementById('add-object');



    addObject.addEventListener('click', () => {
        viewer = new MoleculeViewer(Ethyne);
        Object.assign(MoleculeViewer.prototype, THREE.EventDispatcher.prototype);

        viewer.addEventListener('ready', (e) => {
            //            console.log(e);
            //            console.log(viewer.meshes);
            //viewer.modifyColor(viewer.meshes[0], new THREE.Color(0xff00ff));
            viewer.swapMaterial(viewer.meshes[Math.floor(Math.random() * (viewer.meshes.length - 1))])

            let sceneEl = viewer.scene.userData.element;

            sceneEl.addEventListener('intersected', (e) => {
                // console.log(e.detail)
            });

            sceneEl.addEventListener('not-intersected', (e) => {
                //console.log(e.detail)
            });

            //add meshes to unordered list
            let meshes = viewer.meshes;
            for (let mesh of meshes) {

                let li = document.createElement('li');
                li.value = mesh.name;

                let ul = viewer.scene.userData.element.parentNode;
                console.log(ul);
                ul.appendChild(li);
            }
        })
    });

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });

    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(window.devicePixelRatio);

    //add listeners
    document.addEventListener('mousemove', onDocumentMouseMove, false);
}

function updateSize() {

    var width = canvas.clientWidth;
    var height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {

        renderer.setSize(width, height, false);

    }

}

function animate() {

    render();
    requestAnimationFrame(animate);

}

function render() {

    updateSize();

    canvas.style.transform = `translateY(${window.scrollY}px)`;

    renderer.setClearColor(0xffffff);
    renderer.setScissorTest(false);
    renderer.clear();

    renderer.setClearColor(0xe0e0e0);
    renderer.setScissorTest(true);

    viewers.forEach(function (viewer) {
        // get the element that is a place holder for where we want to
        // draw the scene
        var element = viewer.scene.userData.element;

        // get its position relative to the page's viewport
        var rect = element.getBoundingClientRect();

        // check if it's offscreen. If so skip it
        if (rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
            rect.right < 0 || rect.left > renderer.domElement.clientWidth) {

            return; // it's off screen

        }

        // set the viewport
        var width = rect.right - rect.left;
        var height = rect.bottom - rect.top;
        var left = rect.left;

        //not sure why I have to correct this but it's 8 pixels off
        var bottom = renderer.domElement.clientHeight - rect.bottom + 8;

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);

        var camera = viewer.scene.userData.camera;

        camera.aspect = width / height; // not changing in this example
        camera.updateProjectionMatrix();

        tooltip.style.top = mouse.y + 10;
        tooltip.style.left = mouse.x + 10;

        //scene.userData.controls.update();
        var raycaster = viewer.scene.userData.raycaster;
        var divMouse = new THREE.Vector2();

        //if mouse is in scene
        if (mouse.x > rect.left && mouse.y > rect.top &&
            mouse.x < rect.right && mouse.y < rect.bottom) {

            //translate mouse position to inside scene
            let positionX = mouse.x - rect.left;
            let positionY = mouse.y - rect.top;

            //map from pixels to (-1, 1) float
            divMouse.x = (positionX / width) * 2 - 1;
            divMouse.y = -(positionY / height) * 2 + 1;

            raycaster.setFromCamera(divMouse, camera);
        }


        var intersects = raycaster.intersectObjects(viewer.scene.children, true);

        if (intersects.length > 0) {

            if (INTERSECTED != intersects[0].object) {

                if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);

                INTERSECTED = intersects[0].object;
                INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
                INTERSECTED.material.color.setHex(0xff0000);

                //emit intersected event
                var intersectedEvent = new CustomEvent('intersected', {
                    detail: INTERSECTED
                });
                element.dispatchEvent(intersectedEvent);


                tooltip.style.opacity = 1;


            }

        } else {

            if (INTERSECTED) {
                INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
                var intersectedEvent = new CustomEvent('not-intersected', {
                    detail: INTERSECTED
                });
                element.dispatchEvent(intersectedEvent);

                tooltip.style.opacity = 0;
            }

            INTERSECTED = null;

        }

        renderer.render(viewer.scene, camera);

    });

}


function onDocumentMouseMove(event) {

    event.preventDefault();

    mouse.x = event.clientX;
    mouse.y = event.clientY;

}

//i need to have the correct thing selected without using the mouse

function setupKeyControls() {
    document.onkeydown = function (e) {
        switch (e.keyCode) {

            //backspace, delete, or esc
            case 37:
                //if a scene has been selected with spacebar
                if (activeViewer) {
                    let activeModel = activeViewer.scene.userData.model;
                    activeModel.rotation.y += 0.25;
                }
                break;
            case 39:
                if (activeViewer) {
                    let activeModel = activeViewer.scene.userData.model;
                    activeModel.rotation.y += -0.25;
                }
                break;
            default:
                break;
        }
    };
}

class MoleculeViewer {
    //default parameters
    //model = Ethyne;

    //variables on this page
    //viewers,loader

    constructor(model) {
        this.model = model;
        this.scene = new THREE.Scene();

        //events
        this.ready = () => {
            this.dispatchEvent({
                type: 'ready',
                message: 'The Model has Loaded!'
            });
        }

        this.createScene();
    }

    createScene() {
        var scene = this.scene;
        var ready = this.ready;
        let i = viewers.length;
        var template = document.getElementById("template").text;
        var content = document.getElementById("content");

        // make a list item
        var element = document.createElement("div");
        element.className = "list-item";
        element.classList.add("resizeable");
        element.innerHTML = template.replace('$', i + 1);
        element.id = i;

        // Look up the element that represents the area
        // we want to render the scene
        this.scene.userData.element = element.querySelector(".scene");
        content.appendChild(element);


        var raycaster = new THREE.Raycaster();
        this.scene.userData.raycaster = raycaster;
        var camera = new THREE.PerspectiveCamera(50, 1, 1, 10);
        camera.position.z = 2;
        this.scene.userData.camera = camera;

        var controls = new OrbitControls(this.scene.userData.camera, this.scene.userData.element);
        controls.minDistance = 2;
        controls.maxDistance = 5;
        controls.enablePan = false;
        //controls.enableZoom = false;
        this.scene.userData.controls = controls;

        if (loader) {
            loader.load(this.model, function (gltf) {

                gltf.scene.scale.set(9, 9, 9);

                scene.add(gltf.scene);

                scene.userData.model = gltf.scene;

                //dispatch event
                ready();

            }, undefined, function (error) {

                console.error(error);

            });
        } else {
            loader = new GLTFLoader();
            loader.load(this.model, function (gltf) {

                gltf.scene.scale.set(9, 9, 9);

                scene.add(gltf.scene);

                scene.userData.model = gltf.scene;

                //dispatch event
                ready();

            }, undefined, function (error) {

                console.error(error);

            });
        }

        this.scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444));

        var light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.position.set(1, 1, 1);
        this.scene.add(light);


        //add listeners per scene
        for (var j = 0; j < element.childNodes.length; j++) {

            switch (element.childNodes[j].className) {

                case "side":

                    element.childNodes[j].addEventListener('click', () => {
                        this.sideView();
                    });
                    break;

                case "front":

                    element.childNodes[j].addEventListener('click', () => {
                        this.frontView();
                    });
                    break;

                case "top":

                    element.childNodes[j].addEventListener('click', () => {
                        this.topView();
                    });
                    break;

                case "toggle":

                    element.childNodes[j].addEventListener('click', () => {
                        this.toggleGeometry();
                    });

                    break;

                case "screen":

                    element.childNodes[j].addEventListener('click', () => {
                        this.fullscreen();
                    })

                    break;

                default:

            }
        }

        element.addEventListener('keypress', (e) => {

            //listen for spacebar
            if (e.keyCode == 32) {
                activeViewer = this;
            }
        });

        element.addEventListener('click', (e) => {
            activeViewer = this;
        });



        //add the viewer to the list
        viewers.push(this);
    }

    sideView() {

        let thisCamera = this.scene.userData.camera;
        let thisModel = this.scene.userData.model;

        //reset the camera
        thisModel.rotation.set(0, 0, 0);
        thisCamera.position.set(0, 0, 2);
        thisCamera.lookAt(0, 0, 0);

    }

    topView() {

        let thisCamera = this.scene.userData.camera;
        let thisModel = this.scene.userData.model;

        //reset the camera
        thisModel.rotation.set(0, 0, 0);
        thisCamera.position.set(0, 2, 0);
        thisCamera.lookAt(0, 0, 0);

    }

    frontView() {

        let thisCamera = this.scene.userData.camera;
        let thisModel = this.scene.userData.model;

        //reset the camera
        thisModel.rotation.set(0, 0, 0);
        thisCamera.position.set(-2, 0, 0);
        thisCamera.lookAt(0, 0, 0);

    }

    toggleGeometry() {

        //maybe in the future this method will take a mesh as input
        //                    let model = this.scene.userData.model;
        //                    model.visible = !model.visible;

        console.log(this.scene.children[2].children[0].children[5]);

        let firstNode = this.scene.children[2].children[0].children[5];
        firstNode.visible = !firstNode.visible;

    }

    get meshes() {
        //currently the gltf.scene is the third thing added to the scene
        let children = this.scene.children[2].children[0].children;
        let meshes = [];

        for (var q = 0; q < children.length; q++) {
            if (children[q].constructor == THREE.Mesh) {
                meshes.push(children[q]);
            }
        }

        return meshes;
    }

    get objects() {
        //currently the gltf.scene is the third thing added to the scene
        let children = this.scene.children[2].children[0].children;
        let objects = [];

        for (var q = 0; q < children.length; q++) {
            if (children[q].constructor == THREE.Object3D) {
                objects.push(children[q]);
            }
        }

        return objects;

    }

    modifyColor(mesh, color) {
        //find the material and color properties
        if (mesh.constructor != THREE.Mesh) {
            throw new Error("you can only change the colors of meshes");
        }

        mesh.material.color.set(color);
    }

    changeColorScheme(pairs) {

        let entries = Object.entries(pairs);

        //input is pairs of meshes with the color you want to change them to
        for (var [mesh, color] of entries) {
            this.modifyColor(mesh, color);
        }
    }

    swapMaterial(mesh) {
        if (mesh.constructor != THREE.Mesh) {
            throw new Error("you can only change the material of meshes");
        }

        //some materials
        const phongMaterial = new THREE.MeshPhongMaterial({
            color: 0x555555,
            specular: 0xffffff,
            shininess: 50
        });
        const basicMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            opacity: 1,
            wireframe: true
        });

        mesh.material = basicMaterial;

        //mesh.material.needsUpdate = true;
    }

    getMeshId(mesh) {
        if (mesh.constructor != THREE.Mesh) {
            throw new Error("Only accepts THREE.Mesh");
        }

        return mesh.name;
    }

    get materials() {
        let meshes = this.meshes;
        let materials = [];

        for (let u = 0; u < meshes.length; u++) {
            materials.push(meshes[u].material)
        }

        return materials;
    }

    fullscreen() {

        if (!fullscreen) {
            //put all scenes except this one into a different viewers list
            for (let mv of viewers) {
                if (mv !== this) {
                    hidden.push(mv)
                }
            }
            //overlay buttons, name, and list to the viewport
            //enable the viewport to take up the whole screen
            let element = this.scene.userData.element;
            element.classList.remove("scene");
            document.querySelector('html').classList.add('fullscreen');
            document.querySelector('#content').classList.add('fullscreen');
            element.classList.add("fullscreen");
            element.value = "Exit Fullscreen";
            //element.webkitRequestFullscreen();  //chrome
            //make an exitFullscreen option available
            fullscreen = true;

        } else {

            for (let mv of hidden) {
                viewers.push(mv)
            }

            let element = this.scene.userData.element;
            element.classList.add("scene");
            document.querySelector('html').classList.remove('fullscreen');
            document.querySelector('#content').classList.add('fullscreen');
            element.classList.remove("fullscreen");
            element.value = "Fullscreen";

            fullscreen = false;

        }
    }
}

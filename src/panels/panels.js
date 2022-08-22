import * as THREE from 'three';
import MoleculeViewer from '../MoleculeViewer.js';
import GLTFLoader from 'three-gltf-loader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import Ethylene from '../models/draco/ethylene.glb';
import Ethyne from '../models/draco/ethyne.glb';
import Methane from '../models/draco/methane.glb';
import Butane from '../models/draco/butane.glb';
import Ethane from '../models/draco/ethane.glb';
import Chloromethane from '../models/draco/chloromethane.glb';
import Methylamine from '../models/draco/methylamine.glb';
import Pentane from '../models/draco/pentane.glb';

let models = [Methane, Ethane, Ethylene, Ethyne, Butane, Chloromethane, Methylamine, Pentane];
const names = ["Methane", "Ethane", "Ethylene", "Ethyne", "Butane", "Chloromethane", "Methylamine", "Pentane"];

//global object
window.MV = window.MV || {};

MV.loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('./draco/gltf/');
MV.loader.setDRACOLoader( draco );

const canvas = document.getElementById("c");
const tooltip = document.getElementById('tooltip');
let selected = null;
let viewers = [];
let hidden = [],
    viewer,
    intersect = false,
    renderer;
MV.mouse = new THREE.Vector2(),
    MV.INTERSECTED, MV.intersectInfo;
MV.fullscreen = false;
MV.tab = 1;
MV.soundOn = false;
MV.shading = true;
MV.volume = 0.5;
MV.postProcessing = false;
const backgroundColor = 0x505050;
MV.composer, MV.outlinePass,

init();
animate();

function init() {
    let numViewers;

        //if grid
        if (document.querySelector("#modal")) {
            numViewers = document.querySelector("#modal").childElementCount;
        } else {
            numViewers = document.querySelector("#main").childElementCount;
        }

    for (let r = 0; r < numViewers; r++) {

        var contentId = "content-".concat(r)
        var content = document.getElementById(contentId);

        viewer = new MoleculeViewer(Pentane, names[r], r);
        viewers.push(viewer);
        Object.assign(MoleculeViewer.prototype, THREE.EventDispatcher.prototype);

        viewers[r].addEventListener('ready', (e) => {

            viewers[r].defaultTooltipSetup();
            viewers[r].postProcessingSetup();

            //interactive sounds
            let sceneEl = viewers[r].scene.userData.element;
            sceneEl.addEventListener('intersected', (e) => {

                viewers[r].highlight(e.detail);
 
                //play sound for that mesh
                viewers[r].defaultInteractiveSound(viewers[r], e);

                //change tooltip content to match name
                //right now this isn't going to the dom 
                let meshString = e.detail.name;
                //replace anything with an underscore and everything after it with nothing
                // () is a capture
                // .* is the after
                // / /g is the global regex
                tooltip.innerHTML = meshString.replace(/_(.*)/g,"");
             
                tooltip.style.opacity = 1;

                if(MV.postProcessing) outlinePass.selectedObjects = e.detail;
            });

            sceneEl.addEventListener('not-intersected', (e) => {
                tooltip.style.opacity = 0;
                viewers[r].unhighlight(e.detail);
            });

            //arrow keys
            sceneEl.addEventListener('keydown', (e) => {
                if(viewers[r].active = true) {
                    switch(e.code) {
                        case "ArrowLeft" || "KeyA":
                            viewers[r].scene.userData.model.rotation.y -= 0.25;
                            break;
                        case "ArrowRight" || "KeyD":
                            viewers[r].scene.userData.model.rotation.y += 0.25;
                            break;
                        default:
                            break;
                   }
                }
            });
        });
    }



    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });

    renderer.setClearColor(0xffffff, 0.0);
    renderer.setPixelRatio(window.devicePixelRatio);

}

function animate() {

    //things that don't involved the webgl renderer
    viewers.forEach(function (view) {
        view.render();
    });

    //things that do involve the webgl renderer
    render();

    requestAnimationFrame(animate);

}

function render() {

    updateSize();

    renderer.setClearColor(0x000000, 0.2);
    renderer.setScissorTest(false);
    renderer.clear();

    renderer.setClearColor(backgroundColor);
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
        var bottom = renderer.domElement.clientHeight - rect.bottom;

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);

        renderer.render(viewer.scene, viewer.scene.userData.camera);

    });
}

function updateSize() {

    var width = canvas.clientWidth;
    var height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
    }

    if (MV.shading) {
        // Update the resolution uniform
        viewer.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(window.devicePixelRatio);
    }

}
    
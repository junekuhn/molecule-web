//usnign  https://cobwwweb.com/export-es6-class-globally-webpack
//import stuff the webpack way
import * as THREE from 'three';
import {
    OrbitControls
} from 'three/examples/jsm/controls/OrbitControls.js';
import Bond from './sounds/bond.wav';
import Carbon from './sounds/carbon.mp3';
import Hydrogen from './sounds/hydrogen.mp3';
import Nitrogen from './sounds/nitrogen.mp3';
import Oxygen from './sounds/oxygen.mp3';
import Chlorine from './sounds/chlorine.mp3';
import Bromine from './sounds/bromine.mp3';

//post-processing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

//import custom shaders via webpack
import ToonFragment from './shaders/toonFragment.glsl';
import ToonVertex from './shaders/toonVertex.glsl';
import DisplacementVertex from './shaders/displacementVertex.glsl';
import DisplacementFragment from './shaders/displacementFragment.glsl';
import NitrogenFragment from './shaders/nitrogenFragment.glsl';
import OxygenFragment from './shaders/chlorineFragment.glsl';
import ChlorineFragment from './shaders/chlorineFragment.glsl';
import CarbonFragment from './shaders/carbonFragment.glsl';
import HydrogenFragment from './shaders/hydrogenFragment.glsl';
import BromineFragment from './shaders/bromineFragment.glsl';


class MoleculeViewer {

    constructor(model, name, index) {
        //the gltf file
        this.model = model;

        // title for html purposes
        this.name = name;

        //for rendering and keyboard access
        this.active = false;

        // create scene
        this.scene = new THREE.Scene();

        // index of scene for reference
        this.index = index;

        //Three.js told me to do raycast events this way
        this.ready = () => {
            this.dispatchEvent({
                type: 'ready',
                message: 'The Model has Loaded!'
            });
        };

        //for storing materials in memory
        this.materialMemory = {};

        //things that can only be done once the html/js has loaded i.e. "Ready"
        this.loadHTML = () => {
            //add dropdown functionality
            this.dropdowns = {
                views: {
                    options: this.views,
                    callback: (option) => this.viewFunction(option.position, option.maxtrixElement)
                },
                sounds: {
                    options: this.sounds,
                    callback: (option) => {
                        this.playGlobalAudio(option.sound);
                        
                    }
                },
                meshes: {
                    //is the option in the model?
                    options: this.geometryGroups.filter(group => {
                        let exit = false;

                        this.meshes.map(mesh => {
                            if (mesh.name.includes(group.name)) exit = true;
                        });

                        return exit;
                    }),
                    callback: (option, li) => this.toggleMesh(option, li)
                }
            }
            this.buttons();
        };

        // Initialize the clock
        this.clock = new THREE.Clock(true);

        //dropdown data
        this.sounds = [
            {
                name: 'Bond',
                sound: Bond
            },
            {
                name: 'Carbon',
                sound: Carbon
            },
            {
                name: 'Hydrogen',
                sound: Hydrogen
            },
            {
                name: 'Nitrogen',
                sound: Nitrogen
            },
            {
                name: 'Oxygen',
                sound: Oxygen
            },
            {
                name: 'Chlorine',
                sound: Chlorine
            },
            {
                name: 'Bromine',
                sound: Bromine
            }
            ];

        this.views = [
            {
                name: 'Top',
                position: {
                    x: 0,
                    y: 3,
                    z: 0
                },
                //x position
                maxtrixElement: 12
                },
            {
                name: 'Side',
                position: {
                    x: -3,
                    y: 0,
                    z: 0
                },

                maxtrixElement: 14
                },
            {
                name: 'Front',
                position: {
                    x: 0,
                    y: 0,
                    z: 3
                },
                //y position
                maxtrixElement: 12
                }
            ];

        this.geometryGroups = [
            {name: "Bond", toggled: false}, 
            {name: "Hydrogen", toggled: false},
            {name: "Carbon", toggled: false},
            {name: "Oxygen", toggled: false},
            {name: "Nitrogen", toggled: false},
            {name: "Chlorine", toggled: false},
            {name: "Bromine", toggled: false},
            {name: "Electron", toggled: false}
        ];

        //reynolds red
        this.shades = {
            //red
            oxygen: [0xea1500, 0xcc0000, 0xb40000, 0x990000, 0x7e0000, 0x5e0000, 0x3e0000],
            //blue
            nitrogen: [0x83a0dc, 0x728bcf, 0x5b73bb, 0x4156a1, 0x344891, 0x24347b, 0x192668],
            //green
            chlorine: [0xbfcc46, 0xa2b729, 0x8d9e2b, 0x6f7d1c, 0x586800, 0x424c09, 0x2f3a03]
        }

       
        //to be used for custom shading parameters
        this.uniforms = {
            u_time: {
                type: "f",
                value: 0.0
            },
            u_frame: {
                type: "f",
                value: 0.0
            },
            u_resolution: {
                type: "v2",
                value: new THREE.Vector2(window.innerWidth, window.innerHeight)
                    .multiplyScalar(window.devicePixelRatio)
            },
            u_mouse: {
                type: "v2",
                value: new THREE.Vector2(0.7 * window.innerWidth, window.innerHeight)
                    .multiplyScalar(window.devicePixelRatio)
            },
            red: {
                type: "f",
                value: [0, 0, 0, 0, 0, 0, 0]
            },
            green: {
                type: "f",
                value: [0, 0, 0, 0, 0, 0, 0]
            },
            blue: {
                type: "f",
                value: [0, 0, 0, 0, 0, 0, 0]
            }
        };

        this.highlight = (mesh, color = 0xf8e948) => {
            try{
                //store material for later use
                this.materialMemory[mesh.name] = mesh.material;
    
                //create new material and store
                mesh.material = new THREE.MeshStandardMaterial({color: new THREE.Color(color)});
    
            } catch(e) {
                console.log(e);
            }
        }
        // creates the scene on load
        this.createScene();
    }

    createScene() {
        //because 'this' loses reference in callbacks
        var scene = this.scene;
        var ready = this.ready;
        var loadHTML = this.loadHTML;
        var name = this.name;
        var shades = this.shades;
        var uniforms = this.uniforms;
        let i = this.index;

        //html setup per viewer
        var template = document.getElementById("template").text;
        var contentId = "content-".concat(this.index);
        var content = document.getElementById(contentId);
        var containerId = "scene-container-".concat(this.index);
        var container = document.getElementById(containerId);

        // make a list item
        var element = document.createElement("div");
        element.className = "list-item";
        element.classList.add("resizeable");
    

        //replace placeholders efficiently and throw in the template
        element.innerHTML = template.replace('$', name).replace(/~/g, this.index);
        element.id = name.concat(i.toString());


        // Look up the element that represents the area
        // we want to render the scene
        this.scene.userData.element = element.querySelector(".scene");
        this.scene.userData.element.setAttribute("aria-label", "3D Viewer");
        this.scene.userData.flexContainer = element.querySelector(".flex-container");

        container.appendChild(element.querySelector(".scene"));
        content.appendChild(element);

        //create raycaster and set camera
        var raycaster = new THREE.Raycaster();
        this.scene.userData.raycaster = raycaster;
        var camera = new THREE.PerspectiveCamera(50, 1, 1, 10);
        camera.position.z = 3;
        this.scene.userData.camera = camera;

        //create orbit controls 
        var controls = new OrbitControls(this.scene.userData.camera, this.scene.userData.element);
        controls.minDistance = 2;
        controls.maxDistance = 8;
        controls.enablePan = false;
        controls.enableDamping = true;
		controls.dampingFactor = 0.05;

        this.scene.userData.controls = controls;

        
    
        document.querySelector("#volume-slider").addEventListener('input', (e) => {
            MV.volume = e.target.value / 100;
    
            MV.soundOn = true;
    
            if (e.target.value == 0.0) {
                document.querySelector("#vol-svg").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-labelledby="title"
                aria-describedby="desc" role="img" xmlns:xlink="http://www.w3.org/1999/xlink">
                  <title>Mute</title>
                  <desc>A line styled icon from Orion Icon Library.</desc>
                  <path data-name="layer2"
                  fill="none" stroke="#ffffff" stroke-miterlimit="10" stroke-width="3" d="M29.4 45.4L42 58V32m0-10V6L24 24H12a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12"
                  stroke-linejoin="round" stroke-linecap="round"></path>
                  <path data-name="layer1" fill="none" stroke="#ffffff" stroke-miterlimit="10"
                  stroke-width="3" d="M62 2L2 62" stroke-linejoin="round" stroke-linecap="round"></path>
                </svg>`
            } else {
                document.querySelector("#vol-svg").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-labelledby="title"
                aria-describedby="desc" role="img" xmlns:xlink="http://www.w3.org/1999/xlink">
                <title>Volume</title>
                <desc>A line styled icon from Orion Icon Library.</desc>
                <path data-name="layer2"
                d="M40.2 21.8a12 12 0 0 1 0 20.5M46 16a20 20 0 0 1 0 32m5.7-37.7a28 28 0 0 1 .1 43.3"
                fill="none" stroke="#ffffff" stroke-miterlimit="10" stroke-width="2" stroke-linejoin="round"
                stroke-linecap="round"></path>
                <path data-name="layer1" d="M34 6L16 24H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12l18 18z"
                fill="none" stroke="#ffffff" stroke-miterlimit="10" stroke-width="2" stroke-linejoin="round"
                stroke-linecap="round"></path>
                </svg>`;
            }
        });
    
        // //toggle all sound
        // document.querySelector("#volume-slider").addEventListener('change', (e) => {
           
        // })
    
        //RESET BUTTON
        document.querySelector("#reset-button").addEventListener('click', () => {
            location.reload();
            return false;
        });
    

        let materials = [];

        //load model
        MV.loader.load(this.model, function (gltf) {


            //set scaling based on the size of the model
            let bBox = new THREE.Box3().setFromObject(gltf.scene);
            //find the maximum abs value and scale it to 0.5
            let scalingFactor = 0.5 / Math.max(Math.abs(Math.min(bBox.min.x, bBox.min.y, bBox.min.z)), bBox.max.x, bBox.max.y, bBox.max.z);
            gltf.scene.scale.set(scalingFactor, scalingFactor, scalingFactor);

            //add model to scene
            scene.add(gltf.scene);
            scene.userData.model = gltf.scene;
            shades.originalUniforms = uniforms;

            //replace materials of model with new ones
            gltf.scene.traverse((child) => {

                if (child.isMesh) {
                    if (MV.shading) {
                        if (child.name.includes("Electron")) {

                            //create a array to directly map each point in geometry by the same amount
                            let seed = new Float32Array(child.geometry.attributes.position.count);
                            //initalize seed value
                            let seedValue = Math.random() * 10;
                            //set all seed values
                            for (var i = 0; i < seed.length; i++) {
                                seed[i] = seedValue;
                            }

                            //attach the custom attribute to each geometry
                            child.geometry.setAttribute('seed', new THREE.BufferAttribute(seed, 1));

                            child.material = new THREE.ShaderMaterial({
                                uniforms: shades.originalUniforms,
                                vertexShader: DisplacementVertex,
                                fragmentShader: DisplacementFragment,
                                side: THREE.DoubleSide,
                                transparent: true,
                                extensions: {
                                    derivatives: true
                                }
                            });
                        } else if (child.name.includes("Bond")) {
                            child.material.alphaTest = 0.5;
                            if (child.material.transparent) {
                                child.material.opacity = 0.5;
                                child.material.side = 1;
                            }

                            child.material = new THREE.MeshStandardMaterial().copy(child.material);

                        } else if (child.name.includes("Nitrogen")) {

                            //use the blue shades
                            uniforms["red"].value = shades.nitrogen.map((shade) => {

                                //returns te red value from 0 to 1
                                let threeShade = new THREE.Color(shade);
                                return threeShade.r;
                            });
                            uniforms["blue"].value = shades.nitrogen.map((shade) => {
    
                                //returns te blue value from 0 to 1
                                let threeShade = new THREE.Color(shade);
                                return threeShade.b;
                            });
                            uniforms["green"].value = shades.nitrogen.map((shade) => {
    
                                //returns te green value from 0 to 1
                                let threeShade = new THREE.Color(shade);
                                return threeShade.g;
                            });

                            child.material = new THREE.ShaderMaterial({
                                uniforms: uniforms,
                                vertexShader: ToonVertex,
                                fragmentShader: NitrogenFragment,
                                side: THREE.DoubleSide,
                                transparent: true,
                                extensions: {
                                    derivatives: true
                                }
                            });

                        } else if (child.name.includes("Oxygen")) {

                            //use the blue shades
                            uniforms["red"].value = shades.oxygen.map((shade) => {

                                //returns te red value from 0 to 1
                                let threeShade = new THREE.Color(shade);
                                return threeShade.r;
                            });
                            uniforms["blue"].value = shades.oxygen.map((shade) => {
    
                                //returns te blue value from 0 to 1
                                let threeShade = new THREE.Color(shade);
                                return threeShade.b;
                            });
                            uniforms["green"].value = shades.oxygen.map((shade) => {
    
                                //returns te green value from 0 to 1
                                let threeShade = new THREE.Color(shade);
                                return threeShade.g;
                            });

                            child.material = new THREE.ShaderMaterial({
                                uniforms: uniforms,
                                vertexShader: ToonVertex,
                                fragmentShader: OxygenFragment,
                                side: THREE.DoubleSide,
                                transparent: true,
                                extensions: {
                                    derivatives: true
                                }
                            });
                            
                        } else if (child.name.includes("Chlorine")) {

                            //use the blue shades
                            uniforms["red"].value = shades.chlorine.map((shade) => {

                                //returns te red value from 0 to 1
                                let threeShade = new THREE.Color(shade);
                                return threeShade.r;
                            });
                            uniforms["blue"].value = shades.chlorine.map((shade) => {
    
                                //returns te blue value from 0 to 1
                                let threeShade = new THREE.Color(shade);
                                return threeShade.b;
                            });
                            uniforms["green"].value = shades.chlorine.map((shade) => {
    
                                //returns te green value from 0 to 1
                                let threeShade = new THREE.Color(shade);
                                return threeShade.g;
                            });

                            child.material = new THREE.ShaderMaterial({
                                uniforms: uniforms,
                                vertexShader: ToonVertex,
                                fragmentShader: ChlorineFragment,
                                side: THREE.DoubleSide,
                                transparent: true,
                                extensions: {
                                    derivatives: true
                                }
                            });
                        } else if (child.name.includes("Hydrogen")) {
                            //make it all white
                            uniforms["red"].value = [0.1,0.2,0.3,0.5,0.7,0.8,0.9];
                            uniforms["green"].value = [0.1,0.2,0.3,0.5,0.7,0.8,0.9];
                            uniforms["blue"].value = [0.1,0.2,0.3,0.5,0.7,0.8,0.9];

                            child.material = new THREE.ShaderMaterial({
                                uniforms: uniforms,
                                vertexShader: ToonVertex,
                                fragmentShader: HydrogenFragment,
                                side: THREE.DoubleSide,
                                transparent: true,
                                extensions: {
                                    derivatives: true
                                }
                            });

                        } else if (child.name.includes("Carbon")) {
                            //make it all white
                            uniforms["red"].value = [0.1,0.2,0.3,0.5,0.7,0.8,0.9];
                            uniforms["green"].value = [0.1,0.2,0.3,0.5,0.7,0.8,0.9];
                            uniforms["blue"].value = [0.1,0.2,0.3,0.5,0.7,0.8,0.9];

                            child.material = new THREE.ShaderMaterial({
                                uniforms: uniforms,
                                vertexShader: ToonVertex,
                                fragmentShader: CarbonFragment,
                                side: THREE.DoubleSide,
                                transparent: true,
                                extensions: {
                                    derivatives: true
                                }
                            });

                        } else {
                            child.material = new THREE.ShaderMaterial({
                                uniforms: shades.originalUniforms,
                                vertexShader: ToonVertex,
                                fragmentShader: ToonFragment,
                                side: THREE.DoubleSide,
                                transparent: true,
                                extensions: {
                                    derivatives: true
                                }
                            });

                            //necessary for THREE lights to be in the shader
                            //lights: true
                        }

                        //maybe after creating the material I can update customColor based on how close it is to the output of the toon shading


                    } else {

                        child.material.alphaTest = 0.5;
                        if (child.material.transparent) {
                            child.material.opacity = 0.5;
                            child.material.side = 1;
                        }

                        child.material = new THREE.MeshStandardMaterial().copy(child.material);
                    }

                }

            });

            //dispatch event
            ready();
            loadHTML();

        }, undefined, function (error) {

            console.error(error);

        });

        //add lights to scene
        this.scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444));
        var light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.position.set(1, 1, 1);
        this.scene.add(light);

        //init audio
        let listener = new THREE.AudioListener();
        camera.add(listener);
        this.scene.userData.listener = listener;

        //update mouse info
        document.addEventListener('mousemove', (event) => {
            event.preventDefault();

            MV.mouse.x = event.clientX;
            MV.mouse.y = event.clientY;

            if (MV.shading) {
                // Update the mouse uniform
                uniforms.u_mouse.value.set(event.pageX, window.innerHeight - event.pageY).multiplyScalar(
                    window.devicePixelRatio);
            }
        }, false);
    }

    //called in panels.js on init()
    buttons() {
        //pull the buttons container div
        let flexContainer = this.scene.userData.flexContainer;

        //add dropdowns
        for (let button of flexContainer.children) {

            let dropdownlist = button.querySelector('ul').children;

            //initialize dropdown using class name as a key
            this.initDropdown(button);

            button.querySelector('.buttons').addEventListener('click', () => toggleButtons(dropdownlist, flexContainer));
            button.querySelector('.buttons').addEventListener('keydown', (e) => {
                if (e.keyCode == 13) toggleButtons(dropdownlist, flexContainer);
            });
        }

        //called when list is toggled
        function toggleButtons(list, button) {

            //if target was open to start with
            let theListWasAlreadyOpen = !list[0].classList.contains('hide');

            //close all menus by selecting all li's
            let nodeList = flexContainer.querySelectorAll(".dropdown li");

            //anything without hide needs to have hide
            let visibleLi = [...nodeList].filter(li => !li.classList.contains('hide'));
            visibleLi.map(li => li.classList.add('hide'));

            if (theListWasAlreadyOpen) {
                //do nothing.  the lists are already closed
            } else {
                //open target menu
                [...list].map(li => li.classList.remove('hide'));
            }

        }
    }

    //creates html lists on init()
    initDropdown(button) {
        let buttonData = this.dropdowns[button.className];

        //        let dropdownHeight = button.getBoundingClientRect().bottom;
        //        let dropdownX = button.getBoundingClientRect().left;

        for (let option of buttonData.options) {


            let li = document.createElement('li');
            li.setAttribute("tabindex", 0);
            li.classList.add("option");
            li.classList.add("hide");
            li.innerHTML = option.name;

            //li.style.top = `calc(${divIndex}*25.4px + ${dropdownHeight}px)`;
            //li.style.left = dropdownX;

            li.addEventListener('click', () => buttonData.callback(option, li));
            li.addEventListener('keypress', (e) => {
                if(e.key == "Enter" || e.key == "Space") {
                    buttonData.callback(option, li)
                }
            })

            button.querySelector('ul').appendChild(li);
        }
    }


    //rotates molecule to a view and sonifies every mesh from left to right
    viewFunction(position, matrixElement) {

        let thisCamera = this.scene.userData.camera;
        let thisModel = this.scene.userData.model;
        let unhighlight = this.unhighlight;

        //reset the camera
        thisModel.rotation.set(0, 0, 0);
        thisCamera.position.set(position.x, position.y, position.z);
        thisCamera.lookAt(0, 0, 0);

        //sonification

        //get meshes and matrix world to find euler position
        //        12,13,14 in matrix world


        let sorted = this.meshes.filter(mesh => {

            //filter out Bonds
            return !(mesh.name.includes("Bond") || mesh.name.includes("Electron"));

        }).sort((a, b) => {

            //sort remaining atoms 
            return a.matrixWorld.elements[matrixElement] - b.matrixWorld.elements[matrixElement];

        });

        //console.log(sorted);

        let maxtrixE = matrixElement;

        //set interval and highlight each in a row
        let m = 0;
        let n;
        let myInterval = setInterval(() => {
            //exit condition
            if (m >= sorted.length) {

                clearInterval();

                // for each mesh
            } else {
                //change the color of the current mesh and the previous
                //console.log("tick");
                //modify color

                //calculate panning
                let firstMesh = sorted[0].matrixWorld.elements[maxtrixE];
                let lastMesh = sorted[sorted.length - 1].matrixWorld.elements[maxtrixE];
                let currentMesh = sorted[m].matrixWorld.elements[maxtrixE];

                let pan = map(currentMesh, firstMesh, lastMesh, -1, 1);

                if (pan == NaN) pan = 0;

                if (sorted[m].name.includes('Hydrogen')) {
                    this.playGlobalAudio(Hydrogen, pan);
                } else if (sorted[m].name.includes('Oxygen')) {
                    this.playGlobalAudio(Oxygen, pan);
                } else if (sorted[m].name.includes('Bond')) {
                    this.playGlobalAudio(Bond, pan);
                } else if (sorted[m].name.includes('Carbon')) {
                    this.playGlobalAudio(Carbon, pan);
                } else if (sorted[m].name.includes('Nitrogen')) {
                    this.playGlobalAudio(Nitrogen, pan);
                } else if (sorted[m].name.includes('Chlorine')) {
                    this.playGlobalAudio(Chlorine, pan);
                } else if (sorted[m].name.includes('Bromine')) {
                    this.playGlobalAudio(Bromine, pan);
                }
               
                this.highlight(sorted[m]);
                n = m;

                //console.log(this.materialMemory)

                //after 400 ms, reset
                setTimeout(() => {
                    this.unhighlight(sorted[n])
                }, 190);
                m++;
            }
        }, 200);

        //stolen from p5.js thank you lauren mccarthy
        function map(value, low1, high1, low2, high2) {

            //avoid dividing by zero
            if ((high1 - low1) == 0) high1 += 0.001;

            return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
        }
    }


    //utility called whenever I want all the meshes from the model
    get meshes() {
        //currently the gltf.scene is the third thing added to the scene
        let meshes = [];

        this.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                meshes.push(child)
            }
        });

        return meshes;
    }

    //not really used but useful for later projects maybe
    get objects() {
        //currently the gltf.scene is the third thing added to the scene
        let objects = [];

        this.scene.traverse((child) => {
            if (child instanceof THREE.Object3D) {
                objects.push(child)
            }
        });

        return objects;

    }

    //
    modifyColor(mesh, color) {
        //find the material and color properties
        if (mesh.constructor != THREE.Mesh) {
            throw new Error("you can only change the colors of meshes");
        }

        try {
            mesh.material.color.set(color);
        } catch (error) {
            console.log(error);
            return;
        }

    }

    //I was going to use this but we decided on custom shaders instead
    changeColorScheme(pairs) {

        let entries = Object.entries(pairs);

        //input is pairs of meshes with the color you want to change them to
        for (var [mesh, color] of entries) {
            this.modifyColor(mesh, color);
        }
    }



    unhighlight(mesh) {
        try{
            //pull material that was stored
            //console.log(this.materialMemory[mesh.name])
            mesh.material = this.materialMemory[mesh.name];
            
        } catch(e) {
            if (e instanceof TypeError) {
                console.log("unhighlight picked up a blank")
            } else {
                console.log(e);
            }
           
        }
    }
    
    //for the mesh dropdown
    toggleMesh(group, li=null) {
        //toggled that group manually
        group.toggled = !group.toggled;

        //if mesh name contains the name of the group, toggle that mesh
		this.meshes.map(mesh => {
			if(mesh.name.includes(group.name)) {
				mesh.visible = !mesh.visible;
			} else {
				//console.log("This molecule doesn't contain " + group.name);
			}
        });

        //highlight that li element
        if(li != null) {
            if(group.toggled){
                li.classList.add("selected");
            }
             else {
                li.classList.remove("selected");
            }
        }
        
        
        //chance highlight color

    }

    swapMaterial(mesh, material) {
        if (mesh.constructor != THREE.Mesh) {
            throw new Error("you can only change the material of meshes");
        }

        if (material) {
            mesh.material = material
        } else {
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
        }


        //mesh.material.needsUpdate = true;
    }

    getMeshId(mesh) {
        if (mesh.constructor != THREE.Mesh) {
            throw new Error("Only accepts THREE.Mesh");
        }

        return mesh.name;
    }

    defaultTooltipSetup() {

        //toggle tooltip
        [...document.querySelectorAll("div.buttons")].map(button => {
            button.addEventListener('mouseover', (e) => {
                try{
                    let description = e.target.getAttribute("aria-describedby");
                    tooltip.innerHTML = document.getElementById(description).innerHTML;
                    tooltip.style.opacity = 1;
                } catch {
                    console.log("no description")
                }
        
            });

            button.addEventListener('mouseout', () => {
                tooltip.style.opacity = 0;
            });
        })

    }

    defaultInteractiveSound(viewer, e) {

        if (e.detail.name.includes('Hydrogen')) {
            viewer.playGlobalAudio(Hydrogen);
        } else if (e.detail.name.includes('Oxygen')) {
            viewer.playGlobalAudio(Oxygen);
        } else if (e.detail.name.includes('Bond')) {
            viewer.playGlobalAudio(Bond);

            //if doublebond, then play another in 150 ms
            if (e.detail.name.includes('Double')) {

                setTimeout(() => {
                    viewer.playGlobalAudio(Bond);
                }, 125);
                //same goes for triple
            } else if (e.detail.name.includes('Triple')) {

                setTimeout(() => {
                    viewer.playGlobalAudio(Bond);
                }, 125);
                setTimeout(() => {
                    viewer.playGlobalAudio(Bond);
                }, 250);
            }

            
        } else if (e.detail.name.includes('Carbon')) {
            viewer.playGlobalAudio(Carbon);
        } else if (e.detail.name.includes('Nitrogen')) {
            viewer.playGlobalAudio(Nitrogen);
        } else if (e.detail.name.includes('Chlorine')) {
            viewer.playGlobalAudio(Chlorine);
        } else if (e.detail.name.includes('Bromine')) {
            viewer.playGlobalAudio(Bromine);
        }
    }

    //utility for debugging
    get materials() {
        let meshes = this.meshes;
        let materials = [];

        for (let u = 0; u < meshes.length; u++) {
            materials.push(meshes[u].material)
        }

        return materials;
    }

    //not used but might be useful for later projects
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

    //plays audio samples given a file and a pan
    playGlobalAudio(sample, pan = 0) {

        if (MV.soundOn) {
            // create a global audio source
            var sound = new THREE.Audio(this.scene.userData.listener);

            // Create a stereo panner
            var panNode = sound.context.createStereoPanner();
            panNode.pan.setValueAtTime(pan, sound.context.currentTime);

            // load a sound and set it as the Audio object's buffer
            var audioLoader = new THREE.AudioLoader();

            audioLoader.load(sample, function (buffer) {
                sound.setBuffer(buffer);
                sound.setLoop(false);
                sound.setVolume(MV.volume);
                //adds panning easy peasy
                sound.setFilter(panNode);
                sound.play();
            });

            //tone.js
            //var osc = new Tone.Oscillator(440, "sine").toMaster().start();
        }

    }

    //not used for useful
    playPositionalAudio(mesh, sample) {

        if (MV.soundOn) {
            var sound = new THREE.PositionalAudio(this.scene.userData.listener);

            //load the sound and set it as the Audio object's buffer
            audioLoader.load(sample, (buffer) => {
                sound.setBuffer(buffer);
                sound.setRefDistance(20);
                sound.setRolloffFactor(0.5)
                sound.setLoop(false);
                sound.setVolume(0.5);
                sound.play();
            });

            //add the sound to a given mesh
            mesh.add(sound);
        }

    }

    postProcessingSetup() {
        if(MV.postProcessing) {
            //post-processing
            MV.composer = new EffectComposer( renderer );
    
            var renderPass = new RenderPass( this.scene, this.scene.userData.camera );
            MV.composer.addPass( renderPass );
    
            var element2 = this.scene.userData.element;
            // get its position relative to the page's viewport
            var rect2 = element2.getBoundingClientRect();
    
            MV.outlinePass = new OutlinePass( new THREE.Vector2( rect2.right-rect2.left, rect2.bottom-rect2.top), this.scene, this.scene.userData.camera, selectedObjects );
            MV.composer.addPass( outlinePass );
            outlinePass.renderToScreen = true;
            outlinePass.visibleEdgeColor.set(0xffffff);
            outlinePass.hiddenEdgeColor.set(0xff0000);
            outlinePass.edgeStrength = 3;
            outlinePass.edgeGlow = 0.5;
            outlinePass.pulsePeriod = 1.0;
            outlinePass.usePatternTexture = false;
            outlinePass.edgeThickness = 10;
        
        }
    }
    
    //runs once per frame
    render() {
        let tooltip = document.getElementById('tooltip');
        let uniforms = this.uniforms;
        let active = this.active;

        //tooltip css
        tooltip.style.top = `calc(${MV.mouse.y}px + 10px)`;
        tooltip.style.left = `calc(${MV.mouse.x}px + 10px)`;

        //canvas css
        let canvas = document.getElementById("c");
        canvas.style.transform = `translateY(${window.scrollY}px)`;


        var element = this.scene.userData.element;

        // get its position relative to the page's viewport
        var rect = element.getBoundingClientRect();

        // set the viewport
        var width = rect.right - rect.left;
        var height = rect.bottom - rect.top;
        var left = rect.left;

        //camera setup
        var camera = this.scene.userData.camera;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();


        this.scene.userData.controls.update();
        var raycaster = this.scene.userData.raycaster;
        var divMouse = new THREE.Vector2();

        //if mouse is in scene
        if (MV.mouse.x > rect.left && MV.mouse.y > rect.top &&
            MV.mouse.x < rect.right && MV.mouse.y < rect.bottom) {

            this.active = true;

            //translate mouse position to inside scene
            let positionX = MV.mouse.x - rect.left;
            let positionY = MV.mouse.y - rect.top;

            //map from pixels to (-1, 1) float
            divMouse.x = (positionX / width) * 2 - 1;
            divMouse.y = -(positionY / height) * 2 + 1;

            raycaster.setFromCamera(divMouse, camera);
        } else {
            this.active = false;
        }


        //CAREFUL THERE ARE multiple SCENES SO INTERSECTS IS BOTH 0 AND WHATEVER
        var intersects = raycaster.intersectObjects(this.scene.children, true);


        //update uniforms for shaders
        uniforms.u_time.value = this.clock.getElapsedTime();
        uniforms.u_frame.value += 1.0;

        

        if (this.active) {
            
            if (intersects.length > 0) {

                //if it's a new intersection and it's not the same one
                if (MV.INTERSECTED != intersects[0].object) {

                    //unhighlight previous mesh
                    var intersectedEvent = new CustomEvent('not-intersected', {
                        detail: MV.INTERSECTED
                    });
                    element.dispatchEvent(intersectedEvent);

                    //get currently selected mesh
                    MV.INTERSECTED = intersects[0].object;

                    //highlight current mesh
                    var intersectedEvent = new CustomEvent('intersected', {
                        detail: MV.INTERSECTED
                    });
                    element.dispatchEvent(intersectedEvent);

                    //labeling
                    MV.intersectInfo = "different";

                } else {
                    //the intersection is on the same mesh as last frame
                    MV.intersectInfo = "same";
                }

             //if there's no intersections at all
            } else {


                if (MV.intersectInfo == "different" || MV.intersectInfo == "same") {

                    var intersectedEvent = new CustomEvent('not-intersected', {
                        detail: MV.INTERSECTED
                    });

                    element.dispatchEvent(intersectedEvent);

                    MV.INTERSECTED = null;
                    MV.intersectInfo = "left";

                    //tooltip.style.opacity = 0;
                } else {
                    //case of blank space
                    MV.INTERSECTED = null;
                    MV.intersectInfo = "blank";
                }
            }
        }
    }
}

export default MoleculeViewer

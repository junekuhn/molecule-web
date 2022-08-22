
import * as THREE from 'three';
import MoleculeViewer from './MoleculeViewer.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

import GLTFLoader from 'three-gltf-loader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import Ethylene from './models/draco/ethylene.glb';

import ToonFragment from './shaders/toonFragment.glsl';
import ToonVertex from './shaders/toonVertex.glsl';
import DisplacementVertex from './shaders/displacementVertex.glsl';
import DisplacementFragment from './shaders/displacementFragment.glsl';
import NitrogenFragment from './shaders/nitrogenFragment.glsl';
import OxygenFragment from './shaders/chlorineFragment.glsl';
import ChlorineFragment from './shaders/chlorineFragment.glsl';
import CarbonFragment from './shaders/carbonFragment.glsl';
import HydrogenFragment from './shaders/hydrogenFragment.glsl';

let container;
let camera, scene, renderer;
let controller;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

window.MV = window.MV || {};
MV.mouse = new THREE.Vector2(),
    MV.INTERSECTED, MV.intersectInfo;
MV.fullscreen = false;
MV.tab = 1;
MV.soundOn = false;
MV.shading = false;
MV.volume = 0.5;
let shades = MoleculeViewer.shades;
let uniforms = MoleculeViewer.uniforms;
let touchHold = false;
let touchTimer;

const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('./draco/gltf/');
loader.setDRACOLoader( draco );

init();
animate();

function init() {

   container = document.createElement( 'div' );
   document.body.appendChild( container );

   scene = new THREE.Scene();

   camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );

   const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
   light.position.set( 0.5, 1, 0.25 );
   scene.add( light );

   //

   renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
   renderer.setPixelRatio( window.devicePixelRatio );
   renderer.setSize( window.innerWidth, window.innerHeight );
   renderer.xr.enabled = true;
   container.appendChild( renderer.domElement );

   //

   document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );

   // this is where I'd initiate the molecule and put it in the scene
   loader.load(Ethylene, function (gltf) {


      //set scaling based on the size of the model
      let bBox = new THREE.Box3().setFromObject(gltf.scene);
      //find the maximum abs value and scale it to 0.5
      let scalingFactor = 0.3 / Math.max(Math.abs(Math.min(bBox.min.x, bBox.min.y, bBox.min.z)), bBox.max.x, bBox.max.y, bBox.max.z);
      gltf.scene.scale.set(scalingFactor, scalingFactor, scalingFactor);

      //add model to scene
      scene.add(gltf.scene);
      scene.userData.model = gltf.scene;
      //shades.originalUniforms = uniforms;

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
                  }

              } else {
                  if(child.name.toLowerCase().includes("hydrogen")) {
                    child.material = new THREE.MeshStandardMaterial({color: new THREE.Color(0xfdfdfd)});
                  } else if(child.name.toLowerCase().includes("carbon")) {
                    child.material = new THREE.MeshStandardMaterial({color: new THREE.Color(0x000000)});
                  } else {
                  child.material.alphaTest = 0.5;
                  if (child.material.transparent) {
                      child.material.opacity = 0.5;
                      child.material.side = 1;
                  }
                  child.material = new THREE.MeshStandardMaterial().copy(child.material);
                }
              }

          }

      });

      //dispatch event
      //ready();
      //loadHTML();

  }, undefined, function (error) {

      console.error(error);

  });

   const geometry = new THREE.CylinderBufferGeometry( 0.1, 0.1, 0.2, 32 ).translate( 0, 0.1, 0 );

   function onSelectStart(e) {

      console.log(e);

      touchTimer = setTimeout(() => {
          touchHold = true;
      }, 325)
      
   }

   function onSelectEnd(e) {
      //stop the timeout
      //if threshold true, execute position
      console.log(e.target.position);
      
      if (touchHold) {
          //reset touchHold
          touchHold = false;

      } else {
        // given the timer hasn't ended
        clearTimeout(touchTimer);

        if ( reticle.visible ) {
        scene.userData.model.position.setFromMatrixPosition( reticle.matrix )
        }

    }
   }

   function onDrag(e) {
       console.log(e);
   }

   controller = renderer.xr.getController( 0 );
   controller.addEventListener('selectstart', onSelectStart);
   controller.addEventListener('selectend', onSelectEnd);
   //on entering webxr, you don't have access to this anymore
   //document.addEventListener("touchstart", onDrag);


   scene.add( controller );

   reticle = new THREE.Mesh(
      new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
      new THREE.MeshBasicMaterial()
   );
   reticle.matrixAutoUpdate = false;
   reticle.visible = false;
   scene.add( reticle );

   //

   window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

   camera.aspect = window.innerWidth / window.innerHeight;
   camera.updateProjectionMatrix();

   renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

   renderer.setAnimationLoop( render );

}

function render( timestamp, frame ) {

   if ( frame ) {

      const referenceSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();

      if ( hitTestSourceRequested === false ) {

         session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {

            session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

               hitTestSource = source;

            } );

         } );

         session.addEventListener( 'end', function () {

            hitTestSourceRequested = false;
            hitTestSource = null;

         } );

         hitTestSourceRequested = true;

      }

      if ( hitTestSource ) {

         const hitTestResults = frame.getHitTestResults( hitTestSource );

         if ( hitTestResults.length ) {

            const hit = hitTestResults[ 0 ];

            reticle.visible = true;
            reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );

         } else {

            reticle.visible = false;

         }

      }

   }

   if (touchHold) {
       scene.userData.model.rotateY(0.04)
   }

   renderer.render( scene, camera );

}

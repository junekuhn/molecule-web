
    scenes.forEach(function (scene) {


        // so something moves
        //scene.children[0].rotation.y = Date.now() * 0.001;

        // get the element that is a place holder for where we want to
        // draw the scene
        var element = scene.userData.element;

        //listenforclick

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
        var bottom = renderer.domElement.clientHeight - rect.bottom;

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);

        var camera = scene.userData.camera;

        //camera.aspect = width / height; // not changing in this example
        //camera.updateProjectionMatrix();

        //scene.userData.controls.update();
        var raycaster = scene.userData.raycaster;
        var divMouse = new THREE.Vector2();

        //if mouse is in scene
        if (mouse.x > rect.left && mouse.y > rect.top &&
            mouse.x < rect.right && mouse.y < rect.bottom) {

            //translate mouse position to inside scene
            let positionX = mouse.x - rect.left;
            let positionY = mouse.y - rect.top;

            //not sure what the times 2 and -1 does yet
            divMouse.x = (positionX / width) * 2 - 1;
            divMouse.y = -(positionY / height) * 2 + 1;

            raycaster.setFromCamera(divMouse, camera);
        }


        var intersects = raycaster.intersectObjects(scene.children, true);

        console.log(intersects);

        if (intersects.length > 0) {

            if (INTERSECTED != intersects[0].object) {

                if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);

                INTERSECTED = intersects[0].object;
                INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
                INTERSECTED.material.color.setHex(0xff0000);

            }

        } else {

            if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);

            INTERSECTED = null;

        }

        renderer.render(scene, camera);

    });



function createScene() {

    let i = scenes.length;
    var template = document.getElementById("template").text;
    var content = document.getElementById("content");

    var scene = new THREE.Scene();

    // make a list item
    var element = document.createElement("div");
    element.className = "list-item";
    element.innerHTML = template.replace('$', i + 1);
    element.id = i;

    // Look up the element that represents the area
    // we want to render the scene
    scene.userData.element = element.querySelector(".scene");
    content.appendChild(element);


    var raycaster = new THREE.Raycaster();
    scene.userData.raycaster = raycaster;
    var camera = new THREE.PerspectiveCamera(50, 1, 1, 10);
    camera.position.z = 2;
    scene.userData.camera = camera;

    var controls = new OrbitControls(scene.userData.camera, scene.userData.element);
    controls.minDistance = 2;
    controls.maxDistance = 5;
    controls.enablePan = false;
    //controls.enableZoom = false;
    scene.userData.controls = controls;

    var model = models[models.length * Math.random() | 0];

    loader.load(model, function (gltf) {

        gltf.scene.scale.set(9, 9, 9);

        scene.add(gltf.scene);

        scene.userData.model = gltf.scene;

    }, undefined, function (error) {

        console.error(error);

    });

    //var model = new THREE.Mesh(geometry, material)
    //scene.add(model);


    scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444));

    var light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(1, 1, 1);
    scene.add(light);

    //console.log(scene);
    scenes.push(scene);

    //add listeners per scene
    for (var j = 0; j < element.childNodes.length; j++) {

        if (element.childNodes[j].className == "resetcamera") {

            element.childNodes[j].addEventListener('click', (e) => resetCamera(e.target));

        } else if (element.childNodes[j].className == "toggle") {

            element.childNodes[j].addEventListener('click', (e) => toggle(e.target));

        }
    }

}


function resetCamera(target) {

    //pass in the index
    //putting in the button might fix it

    var id = target.parentElement.id;
    //select the camera and controls
    let thisCamera = scenes[id].userData.camera;
    let theseControls = scenes[id].userData.controls;

    //reset the camera
    thisCamera.position.x = 0;
    thisCamera.position.y = 0;
    thisCamera.position.z = 5;
    thisCamera.lookAt(0, 0, 0);
    theseControls.reset();


}

function toggle(target) {
    var id = target.parentElement.id;

    let model = scenes[id].userData.model;
    model.visible = !model.visible;
}



function setupKeyControls() {
    document.onkeydown = function (e) {
        switch (e.keyCode) {

            //backspace, delete, or esc
            case 8:
            case 27:
            case 46:
                resetCamera();
                break;
            default:
                break;
        }
    };
}
   
                        // filter by className
                        switch (button.className) {
            
                            case "views":
            
                                button.addEventListener('focus', (e) => {
                                    this.selectViews(e.target);
                                });
                                break;
            
                            case "sounds":
            
                                button.addEventListener('focus', (e) => {
                                    this.playSoundBank(e.target);
                                });
            
                                break;
            
                            case "meshes":
            
                                button.addEventListener('focus', (e) => {
                                    this.selectMesh(e.target);
                                });
                                break;
            
                                //this is only for the grid view
                            case "screen":
            
                                button.addEventListener('focus', (e) => {
                                    this.fullscreen();
                                })
            
                                break;
            
                            default:

                        }




    selectViews(dropdown) {

        if (!viewsInitialized) {

            let dropdownHeight2 = dropdown.getBoundingClientRect().bottom;
            let dropdownX2 = dropdown.getBoundingClientRect().left;

            let divIndex = 0;

            for (let view of this.views) {

                let div = document.createElement('div');
                div.setAttribute("tabindex", window.tab);
                div.classList.add("option");
                div.innerHTML = view.name;

                div.style.top = `calc(${divIndex}*25.4px + ${dropdownHeight2}px)`;
                div.style.left = dropdownX2;

                div.addEventListener('focus', () => this.viewFunction(view.position, view.maxtrixElement));

                dropdown.appendChild(div);

                window.tab++;
                divIndex++;
            }

            window.viewsInitialized = true;

        } else {
            for (let child of dropdown.children) {
                child.classList.toggle("hide")
            }
        }
    }


  playSoundBank(dropdown) {
        //if not initialized, do that
        if (!window.soundsInitialized) {
            let sounds = this.sounds;

            let dropdownHeight2 = dropdown.getBoundingClientRect().bottom;
            let dropdownX2 = dropdown.getBoundingClientRect().left;

            let divIndex = 0;

            for (let sound of sounds) {

                let div = document.createElement('div');
                div.setAttribute("tabindex", window.tab);
                div.classList.add("option");
                div.innerHTML = sound.name;

                div.style.top = `calc(${divIndex}*25.4px + ${dropdownHeight2}px)`;
                div.style.left = dropdownX2;

                div.addEventListener('focus', () => {
                    this.playGlobalAudio(sound.sound);
                });

                dropdown.appendChild(div);

                window.tab++;
                divIndex++;
            }

            window.soundsInitialized = true;

        } else {
            for (let child of dropdown.children) {
                child.classList.toggle("hide")
            }
        }
    }

    selectMesh(dropdown) {
        //if not initialized, do that.
        if (!window.meshInitialized) {
            //just html
            let dropdownHeight = dropdown.getBoundingClientRect().bottom;
            let dropdownX = dropdown.getBoundingClientRect().left - 10;

            //add divs
            //add meshes to unordered list
            let meshes = this.meshes;
            let divIndex = 0;

            for (let mesh of meshes) {

                let div = document.createElement('div');
                div.setAttribute("tabindex", window.tab);
                div.classList.add("option");
                div.innerHTML = mesh.name;

                div.style.top = `calc(${divIndex}*25.4px + ${dropdownHeight}px)`;
                div.style.left = dropdownX;

                let oldMaterial;

                div.addEventListener('focus', () => {
                    oldMaterial = mesh.material;
                    this.swapMaterial(mesh);
                });

                div.addEventListener('focusout', () => {
                    this.swapMaterial(mesh, oldMaterial);
                });

                dropdown.appendChild(div);

                window.tab++;
                divIndex++;
            }

            window.meshInitialized = true;

        } else {

            for (let child of dropdown.children) {
                child.classList.toggle("hide")
            }
        }
    }
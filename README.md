
# Molecule Web Viewer 

Many of the topics in organic chemistry require an understanding of 3D molecule geometry and students frequently struggle with the different layers of information that get applied to these molecules as the course progresses. An interactive web viewer will allow students to better visualize molecules, explore different layers of information, and better understand topics in both 2D and 3D.

By creating this as a reusable component, we can integrate it in a number of other activities and resources that would benefit from 3D molecules.

## Goals
* Create a reusable, interactive, widely-distributable, 3D web viewer for molecules that can be integrated with other activities and embedded in other resources
* Provide controls that allow user to control basic navigation and customize the appearance of molecules
* Allow for other components on a page to interact with the viewer’s 3D content, controlling views, render settings, and display of information

## Audiences
* Primary: CH 220 students who are having difficulty translating molecules between their different representations
* Secondary: All organic chemistry students (CH 220, 222, 224, etc.), who would benefit from resources that use molecule visualizations

## Notes on Sonification

* all pitches are diatonic
* I used a rule of 1 periodic table row / octave
* because it's organic chemistry, I can get away with this without having to use microtones, or having extreme not values.
* this scheme shouldn't be used for general purpose chemistry
* I mapped high pitch to smaller size nucleus

There are two type of Sonification used in the viewer:

#### Interactive

* When you hover over a mesh, a sample less then 50ms plays back.
* More for sighted people to have fun with it and make the association

#### Full Molecule Playback / Entire View

* On selection of Top, Front, or Side, the view changes, but also I used setInterval() to play all the atoms one at a time.
* It cannot be stopped once it begins unless you turn sound off
* I made the interval quick (about 125ms) because it's supposed to be a snapshot of the entire molecule
* I used stereo panning, but because there are different views, you get a sense of 2 dimensions in a non-realtime way

## Notes on Sound Design

* I think many are scared of sound design as developers, but if I can do it, you can too!
* While I recorded sounds from an analog synthesizer, you can use piano samples, filtering, and other effects.
* To get the phasing effect, I ran some Moog Mother-32 sounds through the Meris Enzo guitar pedal.  Guitar pedals are great for added umph

## WebXR

Currectly, you can see Ethylene on Chrome and Possibly Samung Internet.  Enter the AR experience on your phone, and look around 
until the white reticle appears on whatever surface you're pointed at.  The world-tracking is really good, so try moving around
and see what happens.  Touch anywhere to re-center the molecule, and hold to rotate the molecule in place.

My next steps are to add sound interaction, where placing the phone in the molecule results in the emission of a sound sample.
So if you wave your phone through the molecule, you'll hear each intersection in 3D space.  Not designed as an web accessibility
experience, because WebXR is inherently inaccessible for many, but the sound could add a nice element of surprise and playability.


## Hosted at
[https://issdev.delta.ncsu.edu/courses/ch220/molecule-web-viewer/](https://issdev.delta.ncsu.edu/courses/ch220/molecule-web-viewer/)

# Using the Molecule Web Viewer
### To run:

1. npm install
2. npm start

The page should appear in your browser automatically, and watch for changes

### To Switch to another Branch

git checkout \<branch-name\>
 
### Roadmap/Ideas

* loading manager, and add html/css for a loading screen
 - for a tutorial https://threejsfundamentals.org/threejs/lessons/threejs-textures.html
 -  only a good use case if it fills the whole screen
* Fullscreen Option/Resizing


 
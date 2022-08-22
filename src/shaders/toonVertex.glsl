#define GLSLIFY 1
// Common varyings
varying vec3 v_position;
varying vec3 v_normal;
varying vec2 vUv;
varying float noise;

/*
 * The main program
 */
void main() {
    
    //pass the color to the frag shader
    vUv = uv;
    // Save the varyings
    v_position = position;
    v_normal = normalize(normalMatrix * normal);

    // this just preserved the existing placement of the vertices from the 3d model import
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
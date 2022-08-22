#define GLSLIFY 1
// Common uniforms
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_frame;
uniform float palette_colors[7];

// Common varyings
varying vec3 v_position;
varying vec3 v_normal;
varying vec2 vUv;
varying float noise;
//varying vec3 vColor;

/*
 *  Calculates the diffuse factor produced by the light illumination
 https://en.wikipedia.org/wiki/Diffuse_reflection
 
 */
float diffuseFactor(vec3 normal, vec3 light_direction) {
    float df = dot(normalize(normal), normalize(light_direction));

    if (gl_FrontFacing) {
        df = -df;
    }

    return max(0.0, df);
}

/*
 * The main program
 */
void main() {
    // Use the mouse position to define the light direction
    float min_resolution = min(u_resolution.x, u_resolution.y);
    
    // setting the stage, does not affect much except for the scene
    //vec3 light_direction = -vec3((u_mouse - 0.5 * u_resolution) / min_resolution, 0.5);
	
	    
    //this gives you a static light position
    vec3 light_direction = -vec3(0,1, 1.3);

    // Calculate the light diffusion factor
    float df = diffuseFactor(v_normal, light_direction);

    // Define the toon shading steps
    float nSteps = 3.0;
    float step = sqrt(df) * nSteps;
	
	float offset = 0.2;
	
    step = offset + (floor(step) + smoothstep(0.48, 0.52, fract(step))) / nSteps;


    // Calculate the surface color
    float surface_color = step * step;

    //to test let's add a little red
    float surface_r = surface_color;
    float surface_g = surface_color;
    float surface_b = surface_color;

    // Fragment shader output
    //alpha is 1.0
    gl_FragColor = vec4(vec3(surface_r, surface_g, surface_b), 0.4);
}

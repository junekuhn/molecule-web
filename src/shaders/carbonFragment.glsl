// #define GLSLIFY 1
precision mediump float;
// Common uniforms
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_frame;
uniform float red[7];
uniform float green[7];
uniform float blue[7];

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
    vec3 light_direction = -vec3(0,1, 1.6);
    
    // Calculate the light diffusion factor
    float df = diffuseFactor(v_normal, light_direction);

    // Define the toon shading steps
    float nSteps = 4.0;
    
    //this is preprocessing
    float step = sqrt(df) * nSteps;
    
    //this affects the choice of color
    // the 49 and 51 affect band resolution
	float offset = -0.4;
    step = offset +  (floor(step) + smoothstep(0.45, .55, fract(step)-0.4)) / nSteps;


    // this is the toon shader out of the box.  note that it's the inverse of the sqrt from before
    float surface_color = step * step;
    
    //Start of justin's code
    //init variables
    float chosen_red = 1.0;
    float chosen_green = 1.0;
    float chosen_blue = 1.0;
    float dist = 0.0;
    float min_dist = 1.0;


    //find the differences between surface_color and the color palette
    //the color used is the of the one with the abs minimum distance
    for (int j = 0; j < 7; j += 1) {
        // statement(s)
        dist = abs(surface_color - red[j]);
        min_dist = min(dist, min_dist);
        
    }

    chosen_red = surface_color - min_dist - 0.1;

    // Fragment shader output
    //alpha is 1.0
    gl_FragColor = vec4(vec3(chosen_red, chosen_red, chosen_red), 1.0);
}

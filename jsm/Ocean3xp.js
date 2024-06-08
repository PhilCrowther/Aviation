//= OCEAN MODULE ================================================

// Version 3.0 (updated 10 Feb 2024)
//
// History: This is an update of a three.js wave generator created in 2015 by Jérémy Bouny (github.com/fft-ocean),
// based on a 2014 js version created by David Li (david.li/waves/) and adapted to three.js by Aleksandr Albert
//
// In 2023, Phil Crowther <phil@philcrowther.com> updated and modified the wave generator to work as a module.  
// Attila_Schroeder <> further upgraded and improved this modeul to work with GLSL3 and WebGL2.
//
// As with the original wave generators, this module is licensed under a
// Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

import {
	Camera,
	ClampToEdgeWrapping,
	DataTexture,
	FloatType,
	GLSL3,
	LinearFilter,
	LinearMipMapLinearFilter,
	Mesh,
	NearestFilter,
	PlaneGeometry,
	RawShaderMaterial,
	RepeatWrapping,
	RGBAFormat,
	Vector2,
	WebGLRenderTarget
} from 'three';

//= OCEAN ========================================================
/*
 *	Don't Change After Initialization
 *	@param {float} Res		Resolution - segments per square (default = 512)
 *	@param {float} Siz		Size of Smallest Square (meters)
 *	@param {float} WSp		Wind Speed (meters/sec)
 *	@param {float} WHd		Wind Heading (degrees)
 *	@param {float} Chp		Choppiness - default = 1
 *	@param {float} Dsp		The Displacement Map
 *	@param {float} Nrm		The Normal Map
 *	@param {float} Spd		Wave Speed Adjustment
*/

// Original 2013: David Li (david.li/waves/) - shaders and js program
// Original 2014: Aleksandr Albert (routter.co.tt) - three.js program
// Modified 2015: Jeremy Bouny (github.com/fft-ocean) - three.js program
// Modified 2023: Phil Crowther (philcrowther.com) - updated three.js class module
// Modified 2023: Attila Schroeder - improvements and update to WebGL2

class Ocean {
	constructor(renderer, wav_) {
		this._init(renderer, wav_);
    }

	// Initialize
	_init(renderer, wav_) {
		this.ocean = this.Ocean(renderer, wav_);
	}

	render(wavTim) {
		this.update = this.Render(wavTim);
	}

//= Initialize Ocean ============================================
Ocean(renderer, wav_) {
	// flag used to trigger parameter changes
	this.initial = true;
	this.changed = true;
	this.renderer = renderer;
	this.textureCamera = new Camera();
	// Create the simulation plane
	this.screenQuad = new Mesh(new PlaneGeometry(2, 2));
	// Load Variables
	this.Res = wav_.Res;
	this.Siz = wav_.Siz;
	this.windX = wav_.WSp*Math.sin(wav_.WHd*Math.PI/180);
	this.windY = wav_.WSp*Math.cos(wav_.WHd*Math.PI/180);
	this.Chp = wav_.Chp;
	//
	this.matrixNeedsUpdate = false;
	
	//= Setup framebuffer pipeline =================================
	let BaseParams = {
		format: RGBAFormat,
		stencilBuffer: false,
		depthBuffer: false,
		premultiplyAlpha: false,
		type: FloatType
	};		
	// Set Parameters
	//NRP = NearestRepeatParams; NCP = NearestClampParams; LRP = LinearRepeatParams
	let NRP = JSON.parse(JSON.stringify(BaseParams));	
		NRP.minFilter = NRP.magFilter = NearestFilter;
		NRP.wrapS = NRP.wrapT = RepeatWrapping;
	let NCP = JSON.parse(JSON.stringify(BaseParams));	
		NCP.minFilter = NCP.magFilter = NearestFilter;
		NCP.wrapS = NCP.wrapT = ClampToEdgeWrapping;
	let LRP = JSON.parse(JSON.stringify(BaseParams));
		LRP.minFilter = LinearMipMapLinearFilter;		
		LRP.generateMipmaps = true;
		LRP.magFilter = LinearFilter;
		LRP.wrapS = LRP.wrapT = RepeatWrapping;
	//= Set Render Targets =========================================
	// 8 Same-Sized Buffers
		this.initialSpectrumFramebuffer = new WebGLRenderTarget(this.Res, this.Res, NRP);
		this.pingPhaseFramebuffer = new WebGLRenderTarget(this.Res, this.Res, NCP);
		this.pongPhaseFramebuffer = new WebGLRenderTarget(this.Res, this.Res, NCP);
		this.spectrumFramebuffer = new WebGLRenderTarget(this.Res, this.Res, NCP);
		this.pingTransformFramebuffer = new WebGLRenderTarget(this.Res, this.Res, NCP);
		this.pongTransformFramebuffer = new WebGLRenderTarget(this.Res, this.Res, NCP);
		this.displacementMapFramebuffer = new WebGLRenderTarget(this.Res, this.Res, LRP);
		this.normalMapFramebuffer = new WebGLRenderTarget(this.Res, this.Res, LRP);
	
	//= Define shaders and constant uniforms =======================
		
	// 1 - Fragment Shader - Initial Spectrum
	this.materialInitialSpectrum = new RawShaderMaterial({
		glslVersion: GLSL3,
		uniforms: {
			u_grdres: {value: this.Res},
			u_grdsiz: {value: this.Siz},
			u_wind: {value: new Vector2(this.windX,this.windY)},
		},	
		vertexShader: commonVS,					// default vertex shader
		fragmentShader: initialSpectrumFS,
		depthTest: false,
		blending: 0,
	});
	
	// 2 - Fragment Shader - Current Phase
	this.materialPhase = new RawShaderMaterial({
		glslVersion: GLSL3,
		uniforms: {
			u_grdres: {value: this.Res},
			u_grdsiz: {value: this.Siz},
			u_phases: {value: null},
			u_deltaTime: {value: null},
		},
		vertexShader: commonVS,					// default vertex shader
		fragmentShader: phaseFS,
		depthTest: false,
		blending: 0,
	});
	
	// 3 - Fragment Shader - Current Spectrum
	this.materialSpectrum = new RawShaderMaterial({
		glslVersion: GLSL3,
		uniforms: {
			u_grdres: {value: this.Res},
			u_grdsiz: {value: this.Siz},
			u_choppy: {value: this.Chp},
			u_phases: {value: null},
			u_begFFT: {value: null},
		},
		vertexShader: commonVS,					// default vertex shader
		fragmentShader: currentSpectrumFS,
		depthTest: false,
		blending: 0,
	});

	// 4 - Fragment Shader - Displacement Map
	// 4A - Horizontal wave vertices used for FFT
	this.materialOceanHorizontal = new RawShaderMaterial({
		glslVersion: GLSL3,
		uniforms: {
			u_transformSize: {value: this.Res},
			u_subtransformSize: {value: null},
			u_input: {value: null},
		},
		vertexShader: commonVS,					// default vertex shader
		fragmentShader: displacementHorizontalFS,
		depthTest: false,
		blending: 0,
	});
	// 4B - Vertical wave vertices used for FFT
	this.materialOceanVertical = new RawShaderMaterial({
		glslVersion: GLSL3,
		uniforms: {		// same as above since both use same type of shader
			u_transformSize: {value: this.Res},
			u_subtransformSize: {value: null},	// loaded by program
			u_input: {value: null},
		},
		vertexShader: commonVS,					// default vertex shader
		fragmentShader: displacementVerticalFS,
		depthTest: false,
		blending: 0,
	});

	// 6 - Fragment Shader - Normal Map
	this.materialNormal = new RawShaderMaterial({
		glslVersion: GLSL3,
		uniforms: {
			u_grdres: {value: this.Res},
			u_grdsiz: {value: this.Siz},
			u_displacementMap: {value: null},
		},
		vertexShader: commonVS,					// default vertex shader
		fragmentShader: ocean_normals,
		depthTest: false,
		blending: 0,
	});
				
	// Initialise spectrum data (random phase (0 to 360 degrees) in radians
	this.pingPhase = true;
	let phaseArray = new window.Float32Array(this.Res * this.Res * 4);
	for (let y = 0; y < this.Res; y++) {
		for (let x = 0; x < this.Res; x++) {
			phaseArray[y*this.Res*4 + x*4] = Math.random() * 2.0 * Math.PI;
			phaseArray[y*this.Res*4 + x*4+1] = 0.0;
			phaseArray[y*this.Res*4 + x*4+2] = 0.0;
			phaseArray[y*this.Res*4 + x*4+3] = 0.0;
		}
	}
	this.pingPhaseTexture = new DataTexture(phaseArray, this.Res, this.Res, RGBAFormat);
	this.pingPhaseTexture.minFilter = NearestFilter;
	this.pingPhaseTexture.magFilter = NearestFilter;
	this.pingPhaseTexture.wrapS = ClampToEdgeWrapping;
	this.pingPhaseTexture.wrapT = ClampToEdgeWrapping;
	this.pingPhaseTexture.type = FloatType;
	this.pingPhaseTexture.needsUpdate = true;
	
	// Static Targets
	wav_.Dsp = this.displacementMapFramebuffer.texture;
	wav_.Nrm = this.normalMapFramebuffer.texture;
};

// = OCEAN.RENDER = (called by Main Program) ====================
Render(wavTim) {

	this.screenQuad.material = null;
	
	// 1. Initial Spectrum
	if (this.changed) {
		this.screenQuad.material = this.materialInitialSpectrum;
		this.renderer.setRenderTarget(this.initialSpectrumFramebuffer);
		this.renderer.render(this.screenQuad, this.textureCamera);
	}
		
	// 2. Current Wave Phase (uses Ping and Pong Buffers)
	this.screenQuad.material = this.materialPhase;
	if (this.initial) {
		this.materialPhase.uniforms.u_phases.value = this.pingPhaseTexture;
		this.initial = false;
	}
	else {
		this.materialPhase.uniforms.u_phases.value = this.pingPhase ? this.pingPhaseFramebuffer.texture	: this.pongPhaseFramebuffer.texture;
	}
	this.materialPhase.uniforms.u_deltaTime.value = wavTim;
	this.renderer.setRenderTarget(this.pingPhase ? this.pongPhaseFramebuffer : this.pingPhaseFramebuffer);
	this.renderer.render(this.screenQuad, this.textureCamera);
	this.pingPhase = !this.pingPhase;
	
	// 3. renderSpectrum (combination of initial Spectrum and Wave Phases)
	this.screenQuad.material = this.materialSpectrum;
	this.materialSpectrum.uniforms.u_begFFT.value = this.initialSpectrumFramebuffer.texture;
	this.materialSpectrum.uniforms.u_phases.value = this.pingPhase ? this.pingPhaseFramebuffer.texture : this.pongPhaseFramebuffer.texture;
	this.materialSpectrum.uniforms.u_choppy.value = this.Chp;		// reload in case changed
	this.materialSpectrum.uniforms.u_grdsiz.value = this.Siz;		// reload in case changed
	this.renderer.setRenderTarget(this.spectrumFramebuffer);
	this.renderer.render(this.screenQuad, this.textureCamera);
	
	// 4. Displacement Map (iterations = 9*2
	let iterations = Math.log2(this.Res); // log2(512) = 9
	let pingPong = false;
	this.pingTransformFramebuffer = this.spectrumFramebuffer;		//initialize
	this.screenQuad.material = this.materialOceanHorizontal;
	for (let i = 0; i < iterations; i++) {
		pingPong = !pingPong;
		this.inputBuffer = pingPong ? this.pingTransformFramebuffer : this.pongTransformFramebuffer;
		this.frameBuffer = pingPong ? this.pongTransformFramebuffer : this.pingTransformFramebuffer;
		this.materialOceanHorizontal.uniforms.u_input.value = this.inputBuffer.texture;
		this.materialOceanHorizontal.uniforms.u_subtransformSize.value = Math.pow(2,(i % iterations + 1));
		this.ComputeFrameBuffer(this.materialOceanHorizontal, this.frameBuffer);
	}
	this.screenQuad.material = this.materialOceanVertical;		// ### OLD
	for (let i = 0; i < iterations; i++) {
		pingPong = !pingPong;
		this.inputBuffer = pingPong ? this.pingTransformFramebuffer : this.pongTransformFramebuffer;
		this.frameBuffer = pingPong ? this.pongTransformFramebuffer : this.pingTransformFramebuffer;
		this.materialOceanVertical.uniforms.u_input.value = this.inputBuffer.texture;
		this.materialOceanVertical.uniforms.u_subtransformSize.value = Math.pow(2,(i % iterations + 1));
		this.ComputeFrameBuffer(this.materialOceanVertical, this.frameBuffer);
	}
	// Final Render to Displacement Map
	this.frameBuffer = this.displacementMapFramebuffer;
	this.ComputeFrameBuffer(this.materialOceanVertical, this.frameBuffer);
	
	// 5. Normal Map
	this.screenQuad.material = this.materialNormal;
	this.materialNormal.uniforms.u_displacementMap.value = this.displacementMapFramebuffer.texture;
	this.renderer.setRenderTarget(this.normalMapFramebuffer);
	this.renderer.render(this.screenQuad, this.textureCamera);

	// Cleanup
	this.renderer.setRenderTarget(null);
};

ComputeFrameBuffer(material, frameBuffer){
	material.uniformsNeedUpdate = true;
	this.renderer.setRenderTarget(frameBuffer);
	this.renderer.render(this.screenQuad, this.textureCamera);
	this.renderer.setRenderTarget(null);
};
		
};

//= FFT OCEAN SHADERS ===========================================
// Description: A deep water ocean shader set based on an implementation of a Tessendorf Waves
// The (modified) set uses 1 common Vertex Shader and 6 Fragment Shaders:
// [1] initial_spectrumFS		-> Fragment shader used to set intitial wave frequency at a texel coordinate
// [2] phaseFS					-> Fragment shader used to set wave phase at a texel coordinate
// [3] currentSpectrumFS		-> Fragment shader used to set current wave frequency at a texel coordinate
// [4] ocean_subtransform		-> Fragment shader used to subtransform the mesh (generates the displacement map)
// [5] ocean_normals			-> Fragment shader used to set face normals at a texel coordinate
//

//= 0. Vertex shader used by all (AS V2)
let commonVS = `
	in vec2 uv;
	in vec3 position;
	out vec2 vUv;
	void main() { 
		vUv = uv;
		gl_Position = vec4(position, 1.0);
	}
`;

//= 1. Fragment shader used to set intitial wave frequency at a texel coordinate (AS V2)
let initialSpectrumFS = `
	precision highp float;
	precision highp int;
	#define PI 3.141592653589793238
	#define G 9.81
	#define KM 370.0
	#define CM 0.23
	uniform vec2 u_wind;
	uniform float u_grdres;
	uniform float u_grdsiz;
	in vec2 vUv;
	out vec4 outColor;
	float square(float x) {
		return x*x;
	}
	float omega(float k) {
		return sqrt(G*k*(1.0+square(k/KM)));
	}
	float tanH(float x) {
		return (1.0-exp(-2.0*x))/(1.0+exp(-2.0*x));
	}
	void main(){
		vec2 coordinates = gl_FragCoord.xy-0.5;
		float n = (coordinates.x < u_grdres * 0.5) ? coordinates.x : coordinates.x - u_grdres;
		float m = (coordinates.y < u_grdres * 0.5) ? coordinates.y : coordinates.y - u_grdres;
		vec2 K = (2.0*PI*vec2(n,m))/u_grdsiz;
		float k = length(K);	
		float l_wind = length(u_wind);
		float Omega = 0.84;
		float kp = G*square(Omega/l_wind);
		float c = omega(k)/k;
		float cp = omega(kp)/kp;
		float Lpm = exp(-1.25*square(kp/k));
		float gamma = 1.7;
		float sigma = 0.08*(1.0+4.0*pow(Omega, -3.0));
		float Gamma = exp(-square(sqrt(k/kp)-1.0)/2.0*square(sigma));
		float Jp = pow(gamma, Gamma);
		float Fp = Lpm*Jp*exp(-Omega/sqrt(10.0)*(sqrt(k/kp)-1.0));
		float alphap = 0.006*sqrt(Omega);
		float Bl = 0.5*alphap*cp/c*Fp;
		float z0 = 0.000037 * square(l_wind)/G*pow(l_wind/cp, 0.9);
		float uStar = 0.41*l_wind/log(10.0/z0);		
		float alpham = 0.01*((uStar<CM) ? (1.0+log(uStar/CM)) : (1.0+3.0*log(uStar/CM)));
		float Fm = exp(-0.25*square(k/KM-1.0));
		float Bh = 0.5*alpham*CM/c*Fm*Lpm;
		float a0 = log(2.0)/4.0;
		float am = 0.13*uStar/CM;
		float Delta = tanH(a0+4.0*pow(c/cp, 2.5)+am*pow(CM/c, 2.5));
		float cosPhi = dot(normalize(u_wind), normalize(K));
		float S = (1.0/(2.0*PI))*pow(k,-4.0)*(Bl+Bh)*(1.0+Delta*(2.0*cosPhi*cosPhi-1.0));
		float dk = 2.0*PI/u_grdsiz;
		float h = sqrt(S/2.0)*dk;
		if (K.x == 0.0 && K.y == 0.0) {h = 0.0;} 	//no DC term
		outColor = vec4(h, 0.0, 0.0, 0.0);
	}
`;

//= 2. Fragment Shader - Current Phase (AS V2)
let phaseFS = `
	precision highp float;
	precision highp int;
	precision highp sampler2D;
	#define PI 3.141592653589793238
	#define G 9.81
	#define KM 370.0	
	in vec2 vUv;
	out vec4 outColor;
	uniform float u_deltaTime;
	uniform sampler2D u_phases;
	uniform float u_grdres;
	uniform float u_grdsiz;
	float omega (float k){
		return sqrt(G*k*(1.0+k*k/KM*KM));
	}
	void main(){
		vec2 coordinates = gl_FragCoord.xy-0.5;
		float n = (coordinates.x < u_grdres*0.5) ? coordinates.x : coordinates.x - u_grdres;
		float m = (coordinates.y < u_grdres*0.5) ? coordinates.y : coordinates.y - u_grdres;
		vec2 waveVector = (2.0*PI*vec2(n,m))/u_grdsiz;
		float phase = texture(u_phases, vUv).r;
		float deltaPhase = omega(length(waveVector))*u_deltaTime;
		phase = mod(phase+deltaPhase, 2.0*PI);
		outColor = vec4(phase, 0.0, 0.0, 0.0);
	}
`;

//= 3. Fragment Shader - Current Spectrum (AS V2)
let currentSpectrumFS = `
	precision highp float;
	precision highp int;
	precision highp sampler2D;
	#define PI 3.141592653589793238
	#define G 9.81
	#define KM 370.0	
	in vec2 vUv;
	out vec4 outColor;
	uniform float u_grdsiz;
	uniform float u_grdres;
	uniform float u_choppy;
	uniform sampler2D u_phases;
	uniform sampler2D u_begFFT;
	vec2 multiplyComplex(vec2 a, vec2 b){
		return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
	}
	vec2 multiplyByI(vec2 z){
		return vec2(-z.y, z.x);
	}
	float omega(float k){
		return sqrt(G*k*(1.0+k*k/KM*KM));
	}
	void main(){
		vec2 coordinates = gl_FragCoord.xy-0.5;
		float n = (coordinates.x < u_grdres * 0.5) ? coordinates.x : coordinates.x - u_grdres;
		float m = (coordinates.y < u_grdres * 0.5) ? coordinates.y : coordinates.y - u_grdres;
		vec2 waveVector = (2.0 * PI * vec2(n, m)) / u_grdsiz;
		float phase = texture(u_phases, vUv).r;	
		vec2 phaseVector = vec2(cos(phase), sin(phase));
		vec2 h0 = texture(u_begFFT, vUv).rg;
		vec2 h0Star = texture(u_begFFT, vec2(1.0 - vUv + 1.0 / u_grdres)).rg;
		h0Star.y *= -1.0;		//star means conj complex	
		vec2 h = multiplyComplex(h0, phaseVector) + multiplyComplex(h0Star, vec2(phaseVector.x, -phaseVector.y));
		vec2 hX = -multiplyByI(h * (waveVector.x / length(waveVector))) * u_choppy;
		vec2 hZ = -multiplyByI(h * (waveVector.y / length(waveVector))) * u_choppy;
		//no DC term
		if (waveVector.x == 0.0 && waveVector.y == 0.0) {
		h = vec2(0.0);
		hX = vec2(0.0);
		hZ = vec2(0.0);
		}
		outColor = vec4(hX + multiplyByI(h), hZ);
	}
`;

//= 4. Fragment Shader - Displacement Map (AS V2)
// output textures = materialOceanHorizontal and materialOceanVertical

let displacementHorizontalFS = `
	precision highp float;
	precision highp int;
	precision highp sampler2D;	
	#define PI 3.141592653589793238
	in vec2 vUv;
	out vec4 outColor;
	uniform sampler2D u_input;
	uniform float u_transformSize;
	uniform float u_subtransformSize;
	vec2 multiplyComplex(vec2 a, vec2 b){
		return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
	}	
	void main(){	
		float index = vUv.x * u_transformSize - 0.5;		// horizontal
		float evenIndex = floor(index / u_subtransformSize) * (u_subtransformSize * 0.5) + mod(index, u_subtransformSize * 0.5);
		vec4 even = texture(u_input, vec2(evenIndex+0.5, gl_FragCoord.y)/u_transformSize).rgba;
		vec4 odd = texture(u_input, vec2(evenIndex + u_transformSize*0.5+0.5, gl_FragCoord.y)/u_transformSize).rgba;
		float twiddleArgument = -2.0*PI*(index/u_subtransformSize);
		vec2 twiddle = vec2(cos(twiddleArgument), sin(twiddleArgument));
		vec2 outputA = even.xy + multiplyComplex(twiddle, odd.xy);
		vec2 outputB = even.zw + multiplyComplex(twiddle, odd.zw);
		outColor = vec4(outputA,outputB);
	}
`;

let displacementVerticalFS = `
	precision highp float;
	precision highp int;
	precision highp sampler2D;	
	#define PI 3.141592653589793238	
	in vec2 vUv;
	out vec4 outColor;
	uniform sampler2D u_input;
	uniform float u_transformSize;
	uniform float u_subtransformSize;
	vec2 multiplyComplex(vec2 a, vec2 b){
		return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
	}	
	void main(){
		float index = vUv.y * u_transformSize - 0.5;		// vertical
		float evenIndex = floor(index / u_subtransformSize) * (u_subtransformSize * 0.5) + mod(index, u_subtransformSize * 0.5);
		vec4 even = texture(u_input, vec2(gl_FragCoord.x, evenIndex+0.5)/u_transformSize).rgba;
		vec4 odd = texture(u_input, vec2(gl_FragCoord.x, evenIndex+u_transformSize*0.5+0.5)/u_transformSize).rgba;
		float twiddleArgument = -2.0*PI*(index/u_subtransformSize);
		vec2 twiddle = vec2(cos(twiddleArgument), sin(twiddleArgument));
		vec2 outputA = even.xy + multiplyComplex(twiddle, odd.xy);
		vec2 outputB = even.zw + multiplyComplex(twiddle, odd.zw);
		outColor = vec4(outputA,outputB);
	}
`;

//= 5. Fragment Shader - Normal Map
// Note: The original program did not generate a "plug and play" Normal Map - modifications were required
let ocean_normals = `
	precision highp float;
	precision highp int;
	precision highp sampler2D;
	in vec2 vUv;
	out vec4 outColor;
	uniform float u_grdres;
	uniform float u_grdsiz;
	uniform sampler2D u_displacementMap;
	void main (void) {
		float texel = 1.0/u_grdres;
		float texelSize = u_grdsiz/u_grdres;
		vec3 ctr = texture(u_displacementMap, vUv).rgb;
		vec3 rgt = vec3(texelSize, 0.0, 0.0) + texture(u_displacementMap, vUv + vec2(texel, 0.0)).rgb - ctr;
		vec3 lft = vec3(-texelSize, 0.0, 0.0) + texture(u_displacementMap, vUv + vec2(-texel, 0.0)).rgb - ctr;
		vec3 top = vec3(0.0, 0.0, -texelSize) + texture(u_displacementMap, vUv + vec2(0.0, -texel)).rgb - ctr;
		vec3 bot = vec3(0.0, 0.0, texelSize) + texture(u_displacementMap, vUv + vec2(0.0, texel)).rgb - ctr;
		vec3 topRgt = cross(rgt, top);
		vec3 topLft = cross(top, lft);
		vec3 botLft = cross(lft, bot);
		vec3 botRgt = cross(bot, rgt);
		vec3 nrm3 = vec3(normalize(topRgt + topLft + botLft + botRgt));
		vec3 tmp2 = nrm3;
		nrm3.b = tmp2.g;
		nrm3.g = tmp2.b;
		outColor = vec4(nrm3*0.5+0.5, 1.0);
	}
`;

export {Ocean};

/* Change Log =================================================*/
// 230519: Version 1	:
// 230614: Vecsion 2	: Changed to Class; on initialization, only imput renderer and wav_; on render, only input wavTim; moved wavTim variables to main program
// 230628: Version 2a	: Many improvements to original code and Oceean is now WebGL2 compatible (the three.js default)
// 240210: Version 3	: Updated to include 2023 changes to shaders, including new names; Moved computation initial spectrum comp back to render

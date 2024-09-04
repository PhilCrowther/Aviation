//= OCEAN MODULE ================================================

// Version 4t (updated 1 Sep 2024)
//
// History: This is an update of a three.js wave generator created in 2015 by Jérémy Bouny (github.com/fft-ocean),
// based on a 2014 js version created by David Li (david.li/waves/) and adapted to three.js by Aleksandr Albert
//
// In 2023, Phil Crowther <phil@philcrowther.com> updated and modified the wave generator to work as a module.  
// Attila_Schroeder <> further upgraded and improved this module to work with GLSL3, WebGL2 and now WebGPU.
// This version 4t is version 4 upgraded to work with r168 and uses timerLocal rather than WavTim.
//
// As with the original wave generators, this module is licensed under a
// Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

import {
	ClampToEdgeWrapping,
	DataTexture,
	FloatType,
	LinearFilter,
	LinearMipMapLinearFilter,
	NearestFilter,
	RepeatWrapping,
	RGBAFormat,
	StorageTexture
} from 'three';
import {
	vec2,
	texture,
	textureStore,
	wgslFn,
	instanceIndex,
	code,
	uniform,
	timerLocal
} from 'three/tsl';

//= OCEAN ========================================================
/*
 *	Don't Change After Initialization
 *	@param {float} Res		Resolution of Computation
 *	@param {float} Siz		Size of Grid (meters)
 *	@param {float} WSp		Wind Speed (meters/sec)
 *	@param {float} WHd		Wind Heading (degrees)
 *	@param {float} Chp		Choppiness - default = 1
 *	@param {float} Dsp		The Displacement Map
 *	@param {float} Nrm		The Normal Map
*/

// Original 2013: David Li (david.li/waves/) - created shaders and js program
// Original 2014: Aleksandr Albert (routter.co.tt) - converted to WebGL three.js program
// Modified 2015: Jeremy Bouny (github.com/fft-ocean) - updated three.js program
// Modified 2023: Phil Crowther (philcrowther.com) - updated and converted to three.js class module
// Modified 2023: Attila Schroeder - many improvements
// Modified 2024: Attila Schroeder - converted to GPU and added butterfly texture

class Ocean {

//= Initialize Ocean ===========================================================
constructor(renderer,wav_) {
	// flag used to trigger parameter changes
	this.renderer = renderer;
	this.wav_ = wav_;
	// Load Variables
	this.Res = this.wav_.Res;
	this.Siz = this.wav_.Siz;
	this.windX = this.wav_.WSp*Math.sin(this.wav_.WHd*Math.PI/180);
	this.windY = this.wav_.WSp*Math.cos(this.wav_.WHd*Math.PI/180);
	this.Wnd = vec2(this.windX,this.windY);
	this.Chp = this.wav_.Chp;
	// Initialize Program Variables
	this.stepBF = uniform(0);
//	this.WavTim = uniform(0);
	this.initPhase = true;
	this.pingPhase = true;
	//- Create Buffers ---------------------------------------------------------	
	this.initSpectrumTexture = new StorageTexture(this.Res,this.Res);
	this.initSpectrumTexture.type = FloatType;
	this.pingPhaseTexture = new StorageTexture(this.Res,this.Res);
	this.pingPhaseTexture.type = FloatType;
	this.pongPhaseTexture = new StorageTexture(this.Res,this.Res);
	this.pongPhaseTexture.type = FloatType;
	this.compSpectrumTexture = new StorageTexture(this.Res,this.Res);
	this.compSpectrumTexture.type = FloatType;
	this.butterflyTexture = new StorageTexture(Math.log2(this.Res),this.Res);
	this.butterflyTexture.type = FloatType;
	this.pingTransformTexture = new StorageTexture(this.Res,this.Res);
	this.pingTransformTexture.type = FloatType;
	this.pongTransformTexture = new StorageTexture(this.Res,this.Res);
	this.pongTransformTexture.type = FloatType;
	this.dispMapTexture = new StorageTexture(this.Res,this.Res);
	this.dispMapTexture.type = FloatType;
	this.normMapTexture = new StorageTexture(this.Res,this.Res);
	this.normMapTexture.type = FloatType;
	//- Adjustments - Filter
	this.initSpectrumTexture.magFilter = this.initSpectrumTexture.minFilter = NearestFilter;
	this.pingPhaseTexture.magFilter = this.pingPhaseTexture.minFilter = NearestFilter;
	this.pongPhaseTexture.magFilter = this.pongPhaseTexture.minFilter = NearestFilter;
	this.compSpectrumTexture.magFilter = this.compSpectrumTexture.minFilter = NearestFilter;
	this.butterflyTexture.magFilter = this.butterflyTexture.minFilter = NearestFilter;
	this.pingTransformTexture.magFilter = this.pingTransformTexture.minFilter = NearestFilter;
	this.pongTransformTexture.magFilter = this.pongTransformTexture.minFilter = NearestFilter;
	this.dispMapTexture.magFilter = LinearFilter;
	this.dispMapTexture.minFilter = LinearMipMapLinearFilter;
	this.dispMapTexture.generateMipmaps = true;	
	this.normMapTexture.magFilter = LinearFilter;
	this.normMapTexture.minFilter = LinearMipMapLinearFilter;
	this.normMapTexture.generateMipmaps = true;
	//- Adjustments - Wrapping
	this.initSpectrumTexture.wrapS = this.initSpectrumTexture.wrapT = RepeatWrapping;
	this.pingPhaseTexture.wrapS = this.pingPhaseTexture.wrapT = ClampToEdgeWrapping;
	this.pongPhaseTexture.wrapS = this.pongPhaseTexture.wrapT = ClampToEdgeWrapping;
	this.compSpectrumTexture.wrapS = this.compSpectrumTexture.wrapT = ClampToEdgeWrapping;
	this.pingTransformTexture.wrapS = this.pingTransformTexture.wrapT = ClampToEdgeWrapping;
	this.pongTransformTexture.wrapS = this.pongTransformTexture.wrapT = ClampToEdgeWrapping;
	this.dispMapTexture.wrapS = this.dispMapTexture.wrapT = RepeatWrapping;
	this.normMapTexture.wrapS = this.normMapTexture.wrapT = RepeatWrapping;
	//- Other WebGL Adjustments - Required?
//		format: RGBAFormat,
//		stencilBuffer: false,
//		depthBuffer: false,
//		premultiplyAlpha: false,
	//- Create Initial Phase Array ---------------------------------------------
	this.phaseArray = new window.Float32Array(4*(this.Res**2));
	for (let y = 0; y < this.Res; y++) {
		for (let x = 0; x < this.Res; x++) {
			this.phaseArray[y*this.Res*4+x*4] = Math.random()*2.0*Math.PI;
			this.phaseArray[y*this.Res*4+x*4+1] = 0.0;
			this.phaseArray[y*this.Res*4+x*4+2] = 0.0;
			this.phaseArray[y*this.Res*4+x*4+3] = 1.0;	// make visible
		}
	}
	this.phaseArrayTexture = new DataTexture(this.phaseArray,this.Res,this.Res,RGBAFormat);
	this.phaseArrayTexture.type = FloatType;
	this.phaseArrayTexture.minFilter = this.phaseArrayTexture.magFilter = NearestFilter;
//	this.phaseArrayTexture.wrapS = this.phaseArrayTexture.wrapT = ClampToEdgeWrapping;	// causses line
	this.phaseArrayTexture.needsUpdate = true;
	//= Shaders ================================================================
	//- Common Subroutines -----------------------------------------------------
	let subroutines = code(`
		fn multiplyComplex(a: vec2f, b: vec2f) -> vec2f {
			return vec2f(a.x*b.x-a.y*b.y,a.y*b.x+a.x*b.y);
		}
	`);
	//- Shader 1 ---------------------------------------------------------------
	//	Set intitial wave frequency at a texel coordinate (AS V2)
	this.initSpectrum = wgslFn(`
		fn computeWGSL(
			u_tsiz: f32,
			w_ispc: texture_storage_2d<rgba32float, write>,
			u_indx: u32,
			u_gsiz: f32,
			u_wind: vec2<f32>
		) -> void {
			//- Compute vUv(u)
			var posX = f32(u_indx)%u_tsiz;	// width
			var posY = f32(u_indx)/u_tsiz;	// height
			var idx = vec2u(u32(posX),u32(posY));
			//- My Shader
			var pixel_coord = vec2<f32>(idx.xy)-u_tsiz*0.5;	// ### AS: range is 0 to 512
			var n: f32 = pixel_coord.x;
			if (pixel_coord.x >= u_tsiz*0.5) {n = pixel_coord.x-u_tsiz;}
			var m: f32 = pixel_coord.y;
			if (pixel_coord.y >= u_tsiz*0.5) {m = pixel_coord.y-u_tsiz;}
			//-
			let K = vec2<f32>(n,m)*P2/u_gsiz;
			var k: f32 = length(K);
			var l_wind: f32 = length(u_wind);
			var Omega: f32 = 0.84;
			var kp: f32 = G*square(Omega/l_wind);
			var c: f32 = omega(k)/k;			
			var cp: f32 = omega(kp)/kp;
			var Lpm: f32 = exp(-1.25*square(kp/k));
			var gamma: f32 = 1.7;
			var sigma: f32 = 0.08*(1.+4*pow(Omega,-3));
			var Gamma: f32 = exp(-square(sqrt(k/kp)-1)/2*square(sigma));
			var Jp: f32 = pow(gamma,Gamma);
			var Fp: f32 = Lpm*Jp*exp(-Omega/sqrt(10)*(sqrt(k/kp)-1));
			var alphap: f32 = 0.006 * sqrt(Omega);
			var Bl: f32 = 0.5*alphap*cp/c*Fp;			
			var z0: f32 = 0.000037*square(l_wind)/G*pow(l_wind/cp,0.9);
			var uStar: f32 = 0.41*l_wind/log(10/z0);
			var alpham: f32 = 0.01*(1+3*log(uStar/CM));	// use "else" value first
			if (uStar < CM) {alpham = 0.01*(1+log(uStar/CM));}	// use "if" value second
			var Fm: f32 = exp(-0.25*square(k/KM-1));
			var Bh: f32 = 0.5*alpham*CM/c*Fm*Lpm;
			var a0: f32 = log(2.)/4;
			var am: f32 = 0.13*uStar/CM;
			var Delta: f32 = tanH(a0+4.*pow(c/cp,2.5)+am*pow(CM/c,2.5));
			var cosPhi: f32 = dot(normalize(u_wind),normalize(K));
			var S: f32 = (1/P2)*pow(k,-4)*(Bl+Bh)*(1+Delta*(2*cosPhi*cosPhi-1));
			var dk: f32 = P2/u_gsiz;
			var h: f32 = sqrt(S/2)*dk;
			if (K.x == 0 && K.y == 0) {h = 0;}
			textureStore(w_ispc,idx,vec4<f32>(h,0,0,1));	// use 1 for a value to make visible
		}
		// Constants
		const P2: f32 = 6.28318530718;
		const G: f32 = 9.81;
		const CM: f32 = 0.23;
		const KM: f32 = 370;
		// Subroutines
		fn square(x: f32) -> f32 {
			return x * x;
		}
		fn omega(k: f32) -> f32 {
			return sqrt(G*k*(1+square(k/KM)));
		}
		fn tanH(x: f32) -> f32 {
			return (1.-exp(-2*x))/(1.+exp(-2*x));
		}		
	`, [subroutines]);
	//- Shader 2 ---------------------------------------------------------------
	//	Current Phase (AS V2)
	this.compPhase = wgslFn(`	
		fn computeWGSL(
			u_tsiz: f32,
			r_iphs: texture_2d<f32>,
			w_tphs: texture_storage_2d<rgba32float,write>,
			u_indx: u32,
			u_time: f32,
			u_gsiz: f32
		) -> void {	
			//- Compute vUv(u)
			var posX = f32(u_indx)%u_tsiz;	// width
			var posY = f32(u_indx)/u_tsiz;	// height
			var idx = vec2u(u32(posX),u32(posY));
			//- Pixel_Coord
			var pixel_coord = vec2<f32>(idx.xy)-u_tsiz*0.5;	// ### AS: range is 0 to 512
			var n: f32 = pixel_coord.x;
			if (pixel_coord.x >= u_tsiz*0.5) {n = pixel_coord.x-u_tsiz;}
			var m: f32 = pixel_coord.y;
			if (pixel_coord.y >= u_tsiz*0.5) {m = pixel_coord.y-u_tsiz;}
			//-
			var waveVector = vec2<f32>(n,m)*P2/u_gsiz;
			var phase: f32 = textureLoad(r_iphs,idx,0).r;
			var deltaPhase: f32 = omega(length(waveVector))*u_time;
			phase = (phase+deltaPhase)%P2;
			textureStore(w_tphs,idx,vec4<f32>(phase,0,0,1));	// use 1 for a value to make visible
		}
		// Constants
		const P2: f32 = 6.28318530718;
		const G: f32 = 9.81;
		const KM: f32 = 370;		
		// Subroutines
		fn omega(k: f32) -> f32 {
			return sqrt(G*k*(1+(k*k)/(KM*KM)));
		}
	`, [subroutines]);
	//- Shader 3 ---------------------------------------------------------------
	//	Current Spectrum (AS V2)
	this.compSpectrum = wgslFn(`
		fn computeWGSL(
			u_tsiz: f32,
			r_tphs: texture_2d<f32>,
			r_ispc: texture_2d<f32>,
			w_tspc: texture_storage_2d<rgba32float,write>,
			u_indx: u32,
			u_gsiz: f32,
			u_chop: f32,
		) -> void {
			// Variables
//			var u_choppy: f32 = 1.6;
			//- Compute vUv(u) and neg vUv(u)
			var posX = f32(u_indx) % u_tsiz;	// width
			var posY = f32(u_indx) / u_tsiz;	// height
			var idx = vec2u(u32(posX), u32(posY));
			var posXN = f32(u_tsiz-posX) % u_tsiz;	// neg width (AS)
			var posYN = f32(u_tsiz-posY) / u_tsiz;	// neg height
			var idxN = vec2u(u32(posXN),u32(posYN));			
			//- My Shader
			var pixel_coord = vec2<f32>(idx.xy)-u_tsiz*0.5;	// ### AS: range is 0 to 512
			var n: f32 = pixel_coord.x;
			if (pixel_coord.x >= u_tsiz*0.5) {n = pixel_coord.x-u_tsiz;}
			var m: f32 = pixel_coord.y;
			if (pixel_coord.y >= u_tsiz*0.5) {m = pixel_coord.y-u_tsiz;}	
			var waveVector = vec2<f32>(n,m)*P2/u_gsiz;
			//
			var phase = textureLoad(r_tphs,idx,0).r;
			var phaseVector = vec2<f32>(cos(phase),sin(phase));
			var h0 = vec2<f32>(textureLoad(r_ispc,idx,0).rg);
			var h0Star = vec2<f32>(textureLoad(r_ispc,idxN,0).rg);
			h0Star.y = h0Star.y*(-1);
			var h = vec2<f32>(multiplyComplex(h0,phaseVector)+multiplyComplex(h0Star,vec2<f32>(phaseVector.x,-phaseVector.y)));
			var hX = vec2<f32>(-multiplyByI(h*(waveVector.x/length(waveVector)))*u_chop);
			var hZ = vec2<f32>(-multiplyByI(h*(waveVector.y/length(waveVector)))*u_chop);
			if (waveVector.x == 0 && waveVector.y == 0) {
				h  = vec2<f32>(0,0);
				hX = vec2<f32>(0,0);
				hZ = vec2<f32>(0,0);
			}
			textureStore(w_tspc,idx,vec4<f32>(hX+multiplyByI(h),hZ));
		}
		// Variables
		const P2: f32 = 6.28318530718;
		// Subroutines
		fn multiplyByI(z: vec2f) -> vec2f {
			return vec2f(-z.y,z.x);
		}
	`, [subroutines]);
	//- Butterfly --------------------------------------------------------------
	//  This assists with Ping/Pong computations
	this.butterfly = wgslFn(`
		fn computeWGSL(
			w_bfly: texture_storage_2d<rgba32float, write>,
			u_indx: u32, 
			N: f32,
		) -> void {
			//- Compute vUv(u)
			var posX = f32(u_indx)%log2(N);
			var posY = floor(f32(u_indx)/log2(N));
			var idx = vec2u(u32(posX),u32(posY));
			//
			var k: f32 = (posY*N/pow(2,posX+1))%N;
			var twiddle: vec2<f32> = vec2<f32>(cos(P2*k/N),sin(P2*k/N));
			var butterflyspan: f32 = pow(2,f32(posX));
			var butterflywing: u32 = 0;
			if(posY%pow(2,posX+1) < pow(2,posX)){
				butterflywing = 1;
			}
			else{
				butterflywing = 0;
			}
			if(u32(posX) == 0){
				if(butterflywing == 1){
					textureStore(w_bfly,idx,vec4f(twiddle.x,twiddle.y,reverseBits(idx.y,N),reverseBits(idx.y+1,N)));
				}
				else{
					textureStore(w_bfly,idx,vec4f(twiddle.x,twiddle.y,reverseBits(idx.y-1,N),reverseBits(idx.y,N)));
				}
			}
			else{
				if(butterflywing == 1){
					textureStore(w_bfly,idx,vec4f(twiddle.x,twiddle.y,posY,posY+butterflyspan));
				}
				else{
					textureStore(w_bfly,idx,vec4f(twiddle.x,twiddle.y,posY-butterflyspan,posY));
				}
			}
		}
		fn reverseBits(index: u32, N: f32) -> f32 {
			var bitReversedIndex: u32 = 0;
			var numBits: u32 = u32(log2(N));
			for (var i: u32 = 0; i < numBits; i=i+1) {
				bitReversedIndex = bitReversedIndex | (((index >> i) & 1) << (numBits-i-1));
			} 
			return f32(bitReversedIndex);
		}
		// Variables
		const P2: f32 = 6.28318530718;
	`, [subroutines]);
	//- Shader 4A --------------------------------------------------------------
	//	Displacement Map (AS WebGPU)
	this.compDspHrz = wgslFn(`
		fn computeWGSL(
			u_tsiz: f32,
			r_tspc: texture_2d<f32>,
			r_bfly: texture_2d<f32>,
			w_horz: texture_storage_2d<rgba32float,write>,
			u_indx: u32,
			u_step: f32
		) -> void {
			//- Compute vUv(i)
			var posX = f32(u_indx)%u_tsiz;
			var posY = floor(f32(u_indx)/u_tsiz);
			var idx = vec2i(i32(posX),i32(posY));
			//			
			var data = textureLoad(r_bfly,vec2<i32>(i32(u_step),idx.x),0);
			var even = textureLoad(r_tspc,vec2<i32>(i32(data.z),idx.y),0).rg;
			var odd =  textureLoad(r_tspc,vec2<i32>(i32(data.w),idx.y),0).rg;
			var H = vec2<f32>(even + multiplyComplex(data.rg,odd.xy));
			textureStore(w_horz,idx,vec4<f32>(H,0,1));
		}
	`, [subroutines]);
	//- Shader 4B --------------------------------------------------------------
	//	Displacement Map (AS WebGPU)
	this.compDspVrt = wgslFn(`
		fn computeWGSL(
			u_tsiz: f32,
			r_tspc: texture_2d<f32>,
			r_bfly: texture_2d<f32>,
			w_vert: texture_storage_2d<rgba32float,write>,
			u_indx: u32,
			u_step: f32
		) -> void {
			//- Compute vUv(i)
			var posX = f32(u_indx)%u_tsiz;
			var posY = floor(f32(u_indx)/u_tsiz);
			var idx  = vec2i(i32(posX),i32(posY));
			//			
			var data = textureLoad(r_bfly,vec2<i32>(i32(u_step),idx.y),0);
			var even = textureLoad(r_tspc,vec2<i32>(idx.x,i32(data.z)),0).rg;
			var odd =  textureLoad(r_tspc,vec2<i32>(idx.x,i32(data.w)),0).rg;
			var H = vec2<f32>(even+multiplyComplex(data.rg,odd.xy));
			textureStore(w_vert,idx,vec4<f32>(H,0,1));
		}
	`, [subroutines]);
	//- Shader 5 ---------------------------------------------------------------
	// Permutation
	// Technically, the Ping/Pong method above results in only a vec2 value
	// where H.x = real number (vertical displacement) and H.y is an imaginary number.
	// Creating a real 3D Ocean would require 3 vec2 computations, which a shader can't handle.
	// Thus, as others have done, we are using the imaginary number to create horizontal displacement.
	// This may not be technically correct, but results in a more interesting ocean.
	this.permutation = wgslFn(`
		fn computeWGSL(
			u_tsiz: f32,
			r_ping: texture_2d<f32>,
			w_disp: texture_storage_2d<rgba32float, write>,
			u_indx: u32,
		) -> void {
			// Compute vUv (special)
			var posX = f32(u_indx)%u_tsiz;
			var posY = floor(f32(u_indx)/u_tsiz);
			var idx  = vec2i(i32(posX),i32(posY));
			//
			var input = textureLoad(r_ping,idx,0);
			input = input*(1-2*f32((idx.x+idx.y)%2));
			// Swap values
			input.z = input.y;	// Imaginary value
			input.y = input.x;	// Real value
			input.x = input.z;	// Imaginary va
			// Increase amplitude
			input.x = input.x*1.5;
			input.y = input.y*2.25;
			input.z = input.z*1.5;
			textureStore(w_disp,idx,input);
		}     
	`, [subroutines]);
	//- Shader 6 ---------------------------------------------------------------
	//  Normal Map
	this.compNormal = wgslFn(`
		fn computeWGSL(
			u_tsiz: f32,
			r_disp: texture_2d<f32>,
			w_norm: texture_storage_2d<rgba32float, write>,
			u_indx: u32,
			u_gsiz: f32
		) -> void {
			// Variables
			//- Compute vUv(u)
			var posX = u32(u_indx) % u32(u_tsiz);	// width
			var posY = u32(u_indx) / u32(u_tsiz);	// height
			var idx  = vec2u(u32(posX), u32(posY));
			var idxf = vec2f(idx);
			//
			let texel: f32 = 1/u_tsiz;
			let texelSize: f32 = u_gsiz/u_tsiz;
			//
			let ctr = vec3<f32>(textureLoad(r_disp,idx,0).xyz);
			let idxR = vec2<u32>(idxf+vec2<f32>(texel,0));
			let rgt = vec3<f32>(vec3<f32>(texelSize,0,0)+textureLoad(r_disp,idxR,0).xyz) - ctr;
			let idxL = vec2<u32>(idxf+vec2<f32>(-texel,0));
			let lft = vec3<f32>(vec3<f32>(-texelSize,0,0)+textureLoad(r_disp,idxL,0).xyz) - ctr;	
			let idxT = vec2<u32>(idxf+vec2<f32>(0,-texel));
			let top = vec3<f32>(vec3<f32>(0,0,-texelSize)+textureLoad(r_disp,idxT,0).xyz) - ctr;
			let idxB = vec2<u32>(idxf+vec2<f32>(0,texel));
			let bot = vec3<f32>(vec3<f32>(0,0,texelSize)+textureLoad(r_disp,idxB,0).xyz) - ctr;
			//
			let topRgt = vec3<f32>(cross(rgt,top));
			let topLft = vec3<f32>(cross(top,lft));
			let botLft = vec3<f32>(cross(lft,bot));
			let botRgt = vec3<f32>(cross(bot,rgt));
			var nrm3 = vec3<f32>(normalize(topRgt+topLft+botLft+botRgt));
			//
//			let tmp2: vec3<f32> = nrm3;
//			nrm3.z = tmp2.y;	// flip to create correct colors
//			nrm3.y = tmp2.z;	// for nomal map
//			nrm3 = vec3<f32>(nrm3) * 0.5 + 0.5;
//			textureStore(w_norm,idx,vec4f(nrm3.x,nrm3.y,nrm3.z,1));
			nrm3 = vec3<f32>(nrm3) * 0.5 + 0.5;	// ### NEW
			textureStore(w_norm,idx,vec4f(nrm3.x,nrm3.z,nrm3.y,1));
		}
	`, [subroutines]);
	//= Instructions ===========================================================
	//- Shader 1. Initial Frequency
	this.initSpectrumComp = this.initSpectrum({
		u_tsiz: this.Res,
		w_ispc: textureStore(this.initSpectrumTexture),
		u_indx: instanceIndex,
		u_gsiz: this.Siz,
		u_wind: this.Wnd
	}).compute(this.Res**2);
	//- Shader 2. Initial Phase
	this.pingPhaseComp = this.compPhase({
		u_tsiz: this.Res,
		r_iphs: texture(this.phaseArrayTexture),
		w_tphs: textureStore(this.pingPhaseTexture),
		u_indx: instanceIndex,
//		u_time: this.WavTim,
		u_time: timerLocal,
		u_gsiz: this.Siz
	}).compute(this.Res**2);
	this.pongPhaseComp = this.compPhase({
		u_tsiz: this.Res,
		r_iphs: texture(this.phaseArrayTexture),
		w_tphs: textureStore(this.pongPhaseTexture),
		u_indx: instanceIndex,
//		u_time: this.WavTim,
		u_time: timerLocal,
		u_gsiz: this.Siz
	}).compute(this.Res**2);
	//- Shader 3. New Phase
	this.pingSpectrumComp = this.compSpectrum({
		u_tsiz: this.Res,
		r_tphs: texture(this.pingPhaseTexture),
		r_ispc: texture(this.initSpectrumTexture),
		w_tspc: textureStore(this.compSpectrumTexture),
		u_indx: instanceIndex,
		u_gsiz: this.Siz,
		u_chop: this.Chp
	}).compute(this.Res**2);
	this.pongSpectrumComp = this.compSpectrum({
		u_tsiz: this.Res,
		r_tphs: texture(this.pongPhaseTexture),
		r_ispc: texture(this.initSpectrumTexture),
		w_tspc: textureStore(this.compSpectrumTexture),
		u_indx: instanceIndex,
		u_gsiz: this.Siz,
		u_chop: this.Chp
	}).compute(this.Res**2);
	//- Butterfly
	this.butterflyComp = this.butterfly({ 
		w_bfly: textureStore(this.butterflyTexture), 
		u_indx: instanceIndex,
		N: this.Res,
	}).compute(Math.log2(this.Res)*this.Res);
	//- Shader 4. Displacement
	//- Shader 4A
	this.initDspHrzComp = this.compDspHrz({
		u_tsiz: this.Res,
		r_tspc: texture(this.compSpectrumTexture),
		r_bfly: texture(this.butterflyTexture),
		w_horz: textureStore(this.pongTransformTexture),
		u_indx: instanceIndex,	
		u_step: this.stepBF
	}).compute(this.Res**2);
	this.pingDspHrzComp = this.compDspHrz({
		u_tsiz: this.Res,
		r_tspc: texture(this.pingTransformTexture),
		r_bfly: texture(this.butterflyTexture),
		w_horz: textureStore(this.pongTransformTexture),
		u_indx: instanceIndex,
		u_step: this.stepBF
	}).compute(this.Res**2);
	this.pongDspHrzComp = this.compDspHrz({
		u_tsiz: this.Res,
		r_tspc: texture(this.pongTransformTexture),
		r_bfly: texture(this.butterflyTexture),
		w_horz: textureStore(this.pingTransformTexture),
		u_indx: instanceIndex,
		u_step: this.stepBF
	}).compute(this.Res**2);	
	//- Shader 4B
	this.pingDspVrtComp = this.compDspVrt({
		u_tsiz: this.Res,
		r_tspc: texture(this.pingTransformTexture),
		r_bfly: texture(this.butterflyTexture),
		w_vert: textureStore(this.pongTransformTexture),
		u_indx: instanceIndex,
		u_step: this.stepBF
	}).compute(this.Res**2);
	this.pongDspVrtComp = this.compDspVrt({
		u_tsiz: this.Res,
		r_tspc: texture(this.pongTransformTexture),
		r_bfly: texture(this.butterflyTexture),
		w_vert: textureStore(this.pingTransformTexture),
		u_indx: instanceIndex,
		u_step: this.stepBF
	}).compute(this.Res**2)
	//- Shader 5
	this.permutationComp = this.permutation({
		u_tsiz: this.Res,
		r_ping: texture(this.pingTransformTexture),
		w_disp: textureStore(this.dispMapTexture),
		u_indx: instanceIndex,
	}).compute(this.Res**2)
	//- Shader 6
	this.compNormalComp = this.compNormal({
		u_tsiz: this.Res,
		r_disp: texture(this.dispMapTexture),
		w_norm: textureStore(this.normMapTexture),
		u_indx: instanceIndex,
		u_gsiz: this.Siz
	}).compute(this.Res**2)	
	//= Render =================================================================
	this.renderer.compute(this.initSpectrumComp);
	this.renderer.compute(this.butterflyComp,[1,8,1]);
	// Static Targets
	this.wav_.Dsp = this.dispMapTexture;
	this.wav_.Nrm = this.normMapTexture;
};	// End of Initialize

// = OCEAN.RENDER = (called by Main Program) ====================
render() {
//	this.WavTim.value = wavTim;
	// 2. Initial
	if (this.initPhase) {
		this.renderer.compute(this.pingPhaseComp);
		this.initPhase = false;
	}
	else {
		this.renderer.compute(this.pingPhase ? this.pingPhaseComp : this.pongPhaseComp);
	}
	this.renderer.compute(this.pingPhase ? this.pongPhaseComp : this.pingPhaseComp);	
	this.pingPhase = !this.pingPhase;
	// 3. New Spectrum from PingPhase or PongPhase
	this.renderer.compute(this.pingPhase ? this.pingSpectrumComp : this.pongSpectrumComp);
	// 4. Displacement Map (iterations = 9*2
	let iterations = Math.log2(this.Res); // log2(512) = 9
	let pingPong = false;
	for (let i = 0; i < iterations; i++) {	// Horizontal Ping/Pong
		pingPong = !pingPong;
		this.stepBF.value = i;
		if (i == 0) this.renderer.compute(this.initDspHrzComp);	// if first rep, then New Spectrum to PingHrz
		else {	// Otherwise, Ping/Pong
			this.renderer.compute(pingPong ? this.pingDspHrzComp : this.pongDspHrzComp);
		}
	}
	for (let i = 0; i < iterations; i++) {	// Vertical Ping/Pong
		pingPong = !pingPong;
		this.stepBF.value = i;
		this.renderer.compute(pingPong ? this.pingDspVrtComp : this.pongDspVrtComp);	// Ping/Pong
	}
	// 5. Displacement
	this.renderer.compute(this.permutationComp);
	this.renderer.compute(this.compNormalComp);	
};	// End of Update

};	// End of Module

export {Ocean};

/* Change Log =================================================*/
// 230519: Version 1	:
// 230614: Vecsion 2	: Changed to Class; on initialization, only imput renderer and wav_; on render, only input wavTim; moved wavTim variables to main program
// 230628: Version 2a	: Many improvements to original code and Oceean is now WebGL2 compatible (the three.js default)
// 240210: Version 3	: Updated to include 2023 changes to shaders, including new names; Moved computation initial spectrum comp back to render
// 240719: Version 4	: Converted to WebGPU module
// 240811: Version 4a	: Updated to r167 and cleaned up imports
// 240901: Version 4t	: Uses localTimer instead of wavTim.
// 240903:				: Module structure changes

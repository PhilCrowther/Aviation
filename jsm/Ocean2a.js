/*= OCEAN MODULE ================================================================

Ocean2.js (10 Sep 2025)

This is single-pass version of the Ocean Wave Generator created by Attila Schroeder
Created with his assistance and permission and licensed under a
Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/********************************************************************************
*
*	IMPORTS
*
********************************************************************************/

import {FloatType,HalfFloatType,LinearFilter,LinearMipMapLinearFilter,RepeatWrapping,Vector2,
} from 'three';
import {float,vec2,vec4,wgslFn,texture,
		uniform,instanceIndex,storage, // wave-generator, initial-spectrum and wave-cascade
		textureStore,uint,workgroupId,localId, // wave-cascade
} from 'three/tsl';
import {StorageBufferAttribute,StorageTexture} from "three/webgpu";

/********************************************************************************
*
*   OCEAN MODULE
*
********************************************************************************/

class Ocean {

constructor(params) {

//= INITIALIZE ==================================================================

	//= Variables ===============================================================
	this.size = params.size;	
	this.params_ = params;
	this.logN = Math.log2(params.size);
	this.sqSize = params.size**2;
	this.bufferSize = this.sqSize*2;
	// Convert Numbers to Uniforms ----------------------------------------------
	params.lambda = uniform(params.lambda);
	// InitSpec Variables
	params.waveLength = uniform(params.waveLength);
	params.boundaryLow = uniform(params.boundaryLow);
	params.boundaryHigh = uniform(params.boundaryHigh);
	// Wave Spectrum 1
	params.depth = uniform(params.depth);
	params.scaleHeight = uniform(params.scaleHeight);
	params.windSpeed = uniform(params.windSpeed);
	params.windDirection = uniform(params.windDirection/360.0*2*Math.PI);
	params.fetch = uniform(params.fetch);
	params.spreadBlend = uniform(params.spreadBlend);
	params.swell = uniform(params.swell);
	params.peakEnhancement = uniform(params.peakEnhancemen);
	params.shortWaveFade = uniform(params.shortWaveFade);
	params.fadeLimit = uniform(params.fadeLimit);
	// Wave Spectrum 2
	params.d_depth = uniform(params.d_depth);
	params.d_scaleHeight = uniform(params.d_scaleHeight);
	params.d_windSpeed = uniform(params.d_windSpeed);
	params.d_windDirection = uniform(params.d_windDirection/360.0*2*Math.PI);
	params.d_fetch = uniform(params.d_fetch);
	params.d_spreadBlend = uniform(params.d_spreadBlend);
	params.d_swell = uniform(params.d_swell);
	params.d_peakEnhancement = uniform(params.d_peakEnhancemen);
	params.d_shortWaveFade = uniform(params.d_shortWaveFade);
	params.d_fadeLimit = uniform(params.d_fadeLimit);
	//- Add Variables -----------------------------------------------------------
	this.DDindex = uniform(0);
	this.ifftStep = uniform(0);
	this.pingpong = uniform(0);
	this.deltaTime = uniform(0);
	//- Workgroup Variables -----------------------------------------------------
	this.workgroupSize = [16,16,1];
	this.dispatchSize = [this.size/this.workgroupSize[0],this.size/this.workgroupSize[1]];
	
	//= Storage Buffers =========================================================
	this.butterflyBuffer = new StorageBufferAttribute(new Float32Array(Math.log2(this.size)*this.size*4),4);
	this.spectrumBuffer = new StorageBufferAttribute(new Float32Array(this.bufferSize*2),4);
	this.waveDataBuffer = new StorageBufferAttribute(new Float32Array(this.bufferSize*2),4);
	this.DxDzBuffer = new StorageBufferAttribute(new Float32Array(this.bufferSize),2);
	this.DyDxzBuffer = new StorageBufferAttribute(new Float32Array(this.bufferSize),2);
	this.pingpongBuffer = new StorageBufferAttribute(new Float32Array(this.bufferSize*2),4);
	
	//= Storage Textures ========================================================
	//- Displacement Texture ----------------------------------------------------
	this.displacement = new StorageTexture(this.size,this.size);
	this.displacement.type = HalfFloatType;
	this.displacement.generateMipmaps = true;
	this.displacement.magFilter = LinearFilter;
	this.displacement.minFilter = LinearMipMapLinearFilter;
	this.displacement.wrapS = this.displacement.wrapT = RepeatWrapping;
	this.displacement.anisotropy = this.params_.anisotropy;
	//- Normal Map Texture ------------------------------------------------------
	this.normMapTexture = new StorageTexture(this.size,this.size);
	this.normMapTexture.type = FloatType;
	this.normMapTexture.generateMipmaps = true;
	this.normMapTexture.magFilter = LinearFilter;
	this.normMapTexture.minFilter = LinearMipMapLinearFilter;
	this.normMapTexture.wrapS = this.normMapTexture.wrapT = RepeatWrapping;

//= SHADERS =====================================================================

	//- Initial Spectrum --------------------------------------------------------
	this.InitialSpectrumWGSL = wgslFn(`
		fn computeWGSL(
			spectrumBuffer: ptr<storage,array<vec4<f32>>,read_write>,
			waveDataBuffer: ptr<storage,array<vec4<f32>>,read_write>,
			index: u32,
			size: u32,
			waveLength: f32,
			boundaryLow: f32,
			boundaryHigh: f32,
			//
			depth: f32,
			scaleHeight: f32,
			windSpeed: f32,
			windDirection: f32,
			fetch: f32,
			spreadBlend: f32,
			swell: f32,
			peakEnhancement: f32,
			shortWaveFade: f32,
			fadeLimit: f32,
			//
			d_depth: f32,
			d_scaleHeight: f32,
			d_windSpeed: f32,
			d_windDirection: f32,
			d_fetch: f32,
			d_spreadBlend: f32,
			d_swell: f32,
			d_peakEnhancement: f32,
			d_shortWaveFade: f32,
			d_fadeLimit: f32,
		) -> void {
			var posX = index % size;
			var posY = index / size;
			var idx = vec2u(posX,posY);
			var xy = vec2<f32>(f32(posX),f32(posY));
			let deltaK = 2.0*PI / waveLength;
			let nx = f32(posX) - f32(size) / 2.0;
			let nz = f32(posY) - f32(size) / 2.0;
			let k = vec2<f32>(nx,nz)*deltaK;
			let kLength = length(k);
			if(kLength >= boundaryLow && kLength <= boundaryHigh) {
				var kAngle: f32 = atan2(k.y,k.x);
				var alpha = JonswapAlpha(G,fetch,windSpeed);
				var w = frequency(kLength,G,depth);
				var wp = JonswapPeakFrequency(G,fetch,windSpeed);
				var dOmegadk = frequencyDerivative(kLength,G,depth);
				var spectrum: f32 = JONSWAP(w,G,depth,wp,scaleHeight,alpha,peakEnhancement)
					*directionSpectrum(kAngle,w,wp,swell,windDirection,spreadBlend)
					*shortWavesFade(kLength,shortWaveFade,fadeLimit);
				if(d_scaleHeight > 0) {
					var d_alpha = JonswapAlpha(G,d_fetch,d_windSpeed);
					var d_wp = JonswapPeakFrequency(G,d_fetch,d_windSpeed);
					spectrum = spectrum + JONSWAP(w,G,depth,d_wp,d_scaleHeight,d_alpha,d_peakEnhancement)
						*directionSpectrum(kAngle,w,d_wp,d_swell,d_windDirection,d_spreadBlend)
						*shortWavesFade(kLength,d_shortWaveFade,d_fadeLimit);
				}
				var er: f32 = gaussianRandom1(xy);
				var ei: f32 = gaussianRandom2(xy);
				spectrumBuffer[index] = vec4<f32>(vec2<f32>(er,ei)*sqrt(2*spectrum*abs(dOmegadk)/kLength*deltaK*deltaK),0,0);
				waveDataBuffer[index] = vec4<f32>(k.x,1.0 / kLength,k.y,w);
			} else {
				spectrumBuffer[index] = vec4<f32>(0.0);
				waveDataBuffer[index] = vec4<f32>(k.x,1.0,k.y,0.0);
			}
		}
		const PI: f32 = 3.141592653589793;
		const G: f32 = 9.81;
		fn JonswapAlpha(g: f32,fetch: f32,windSpeed: f32) -> f32 {
			return 0.076*pow(g*fetch/pow(windSpeed,2),-0.22);
		}
		fn JonswapPeakFrequency(g: f32,fetch: f32,windSpeed: f32) -> f32 {
			return 22*pow(windSpeed*fetch/pow(g,2),-0.33);
		}
		fn gaussianRandom1(seed: vec2<f32>) -> f32 {
			var nrnd0: f32 = random(seed);
			var nrnd1: f32 = random(seed + 0.1);
			return sqrt(-2*log(max(0.001,nrnd0)))*cos(2*PI*nrnd1);
		}
		fn gaussianRandom2(seed: vec2<f32>) -> f32 {
			var nrnd0: f32 = random(seed);
			var nrnd1: f32 = random(seed + 0.1);
			return sqrt(-2*log(max(0.001,nrnd0)))*sin(2*PI*nrnd1);
		}
		fn random(par: vec2<f32>) -> f32 {
			return fract(sin(dot(par,vec2<f32>(12.9898,78.233)))*43758.5453);
		}
		fn frequency(k: f32,g: f32,depth: f32) -> f32 {
			return sqrt(g*k*tanh(min(k*depth,20.0)));
		}
		fn frequencyDerivative(k: f32,g: f32,depth: f32) -> f32 {
			let th = tanh(min(k*depth,20.0));
			let ch = cosh(k*depth);
			return g*(depth*k/ch/ch+th)/frequency(k,g,depth)/2.0;
		}
		fn normalisationFactor(s: f32) -> f32 {
			let s2 = s*s;
			let s3 = s2*s;
			let s4 = s3*s;
			if (s < 5.0) {
				return -0.000564*s4+0.00776*s3-0.044*s2+0.192*s+0.163;
			}
			return -4.80e-08*s4+1.07e-05*s3-9.53e-04*s2+5.90e-02*s+3.93e-01;
		}
		fn cosine2s(theta: f32,s: f32) -> f32 {
			return normalisationFactor(s)*pow(abs(cos(0.5*theta)),2.0*s);
		}
		fn spreadPower(omega: f32,peakOmega: f32) -> f32 {
			if (omega > peakOmega) {
				return 9.77*pow(abs(omega / peakOmega),-2.5);
			}
			return 6.97*pow(abs(omega / peakOmega),5.0);
		}
		fn TMACorrection(omega: f32,g: f32,depth: f32) -> f32 {
			let omegaH = omega*sqrt(depth / g);
			if (omegaH <= 1.0) {
				return 0.5*omegaH*omegaH;
			}
			if (omegaH < 2.0) {
				return 1.0 - 0.5*(2.0 - omegaH)*(2.0 - omegaH);
			}
			return 1.0;
		}
		fn directionSpectrum(theta: f32,w: f32,wp: f32,swell: f32,angle: f32,spreadBlend: f32) -> f32 {
			let s = spreadPower(w,wp) + 16.0*tanh(min(w / wp,20.0))*swell*swell;
			return mix(2.0 / PI*cos(theta)*cos(theta),cosine2s(theta - angle,s),spreadBlend);
		}
		fn JONSWAP(w: f32,g: f32,depth: f32,wp: f32,scale: f32,alpha: f32,gamma: f32) -> f32 {
			var sigma: f32 = select(0.07,0.09,w <= wp);
			var a = exp(-pow(w - wp,2) / (2*pow(sigma*wp,2)));
			return scale*TMACorrection(w,g,depth)*alpha*pow(g,2) 
				* pow(1/w,5)
				* exp(-1.25*pow(wp / w,4)) 
				* pow(abs(gamma),a);
		}
		fn shortWavesFade(kLength: f32,shortWavesFade: f32,fadeLimit: f32) -> f32
		{
			return (1 - fadeLimit)*exp(-pow(shortWavesFade*kLength,2)) + fadeLimit;
		}
	`);
	//- Initial Spectrum with Inverse -------------------------------------------
	this.InitialSpectrumWithInverseWGSL = wgslFn(`
		fn computeWGSL(
			spectrumBuffer: ptr<storage,array<vec4<f32>>,read_write>,
			index: u32,
			size: u32,
		) -> void {
			var idx = ((size - index / size) % size)*size + (size - index % size) % size;
			var spectrumData = spectrumBuffer[index];
			var h0MinusK = spectrumBuffer[idx];
			spectrumBuffer[index] = vec4<f32>(spectrumData.xy,h0MinusK.x,-h0MinusK.y);
		}
	`);	
	//- Butterfly ---------------------------------------------------------------
	this.butterflyWGSL = wgslFn(`
		fn computeWGSL(
			butterflyBuffer: ptr<storage,array<vec4<f32>>,read_write>,
			index: u32,
			N: f32,
		) -> void {
			var logN = log2(N);
			var posX = f32(index) % logN;
			var posY = floor(f32(index) / logN);
			const PI: f32 = 3.1415926;
			var k: f32 = (posY*N/pow(2,posX + 1)) % N;
			var twiddle: vec2<f32> = vec2<f32>(cos(2*PI*k / N),sin(2*PI*k / N));
			var butterflyspan = pow(2,f32(posX));
			let idx = u32(posY)*u32(logN) + u32(posX);
			var butterflywing: i32 = select(0,1,posY % pow(2,posX + 1) < pow(2,posX));
			var uY = u32(posY);
			if(u32(posX) == 0){
				if(butterflywing == 1){
					butterflyBuffer[idx] = vec4f(twiddle,reverseBits(uY,N),reverseBits(uY + 1,N));
				}
				else{
					butterflyBuffer[idx] = vec4f(twiddle,reverseBits(uY - 1,N),reverseBits(uY,N));
				}
			}
			else{
				if(butterflywing == 1){
					butterflyBuffer[idx] = vec4f(twiddle,posY,posY + butterflyspan);
				}
				else{
					butterflyBuffer[idx] = vec4f(twiddle,posY - butterflyspan,posY);
				}
			}
		}
		fn reverseBits(index: u32,N: f32) -> f32 {
			var bitReversedIndex: u32 = 0;
			var numBits: u32 = u32(log2(N));
			for (var i: u32 = 0; i < numBits; i = i + 1) {
				bitReversedIndex = bitReversedIndex | (((index >> i) & 1) << (numBits - i - 1));
			} 
			return f32(bitReversedIndex);
		}
	`);	
	//- Time Spectrum -----------------------------------------------------------
	this.TimeSpectrumWGSL = wgslFn(`
		fn computeWGSL(
			spectrumBuffer: ptr<storage,array<vec4<f32>>,read_write>,
			waveDataBuffer: ptr<storage,array<vec4<f32>>,read_write>,
			writeDxDzBuffer: ptr<storage,array<vec2<f32>>,read_write>,
			writeDyDxzBuffer: ptr<storage,array<vec2<f32>>,read_write>,
			index: u32,
			size: u32,
			time: f32,
		) -> void {
			var wave = waveDataBuffer[index];
			var h0 = spectrumBuffer[index];
			var phase = wave.w*time;
			var exponent = vec2<f32>(cos(phase),sin(phase));
			var h = complexMult(h0.xy,exponent) + complexMult(h0.zw,vec2<f32>(exponent.x,-exponent.y));
			var ih = vec2<f32>(-h.y,h.x);
			var displacementX = ih*wave.x*wave.y;
			var displacementY = h;
			var displacementZ = ih*wave.z*wave.y;
			//Jacobi-Matrix-Elements
			var displacementX_dx = -h*wave.x*wave.x*wave.y;
			var displacementY_dx = ih*wave.x;
			var displacementZ_dx = -h*wave.x*wave.z*wave.y;
			var displacementY_dz = ih*wave.z;
			var displacementZ_dz = -h*wave.z*wave.z*wave.y;
			//displacementX_dz ist the same like displacementZ_dx
			//Sum up all amplitudes (real and complex)
			writeDxDzBuffer[index]   = vec2<f32>(displacementX.x - displacementZ.y,displacementX.y + displacementZ.x);
			writeDyDxzBuffer[index]  = vec2<f32>(displacementY.x - displacementZ_dx.y,displacementY.y + displacementZ_dx.x);
		}
		fn complexMult(a: vec2<f32>,b: vec2<f32>) -> vec2<f32> {
			return vec2<f32>(a.r*b.r - a.g*b.g,a.r*b.g + a.g*b.r);
		}
	`);
	//- IFFT_Init ---------------------------------------------------------------
	this.IFFT_InitWGSL = wgslFn(`
		fn computeWGSL(
			butterflyBuffer: ptr<storage,array<vec4<f32>>,read>,
			pingpongBuffer: ptr<storage,array<vec4<f32>>,read_write>,
			DxDzBuffer: ptr<storage,array<vec2<f32>>,read>,
			DyDxzBuffer: ptr<storage,array<vec2<f32>>,read>,
			index: u32,
			size: u32,
			initBufferIndex: u32,
			step: u32,
			logN: u32,
			workgroupSize: vec2<u32>,
			workgroupId: vec3<u32>,
			localId: vec3<u32>
		) -> void {
			let pos = workgroupSize.xy*workgroupId.xy + localId.xy;
			let butterflyIndex = pos.x*logN + step;
			let data = butterflyBuffer[butterflyIndex];
			let bufferIndex = pos.y*size + u32(data.z);
			let bufferIndexOdd = pos.y*size + u32(data.w);
			var even = select(DxDzBuffer[bufferIndex],DyDxzBuffer[bufferIndex],initBufferIndex == 1u);
			var odd = select(DxDzBuffer[bufferIndexOdd],DyDxzBuffer[bufferIndexOdd],initBufferIndex == 1u);
			var H: vec2<f32> = even + multiplyComplex(vec2<f32>(data.r,-data.g),odd);
			pingpongBuffer[index] = vec4<f32>(0.0,0.0,H);
		}
		fn multiplyComplex(a: vec2<f32>,b: vec2<f32>) -> vec2<f32> {
			return vec2<f32>(a.x*b.x - a.y*b.y,a.y*b.x + a.x*b.y);
		}
	`);		
	//- IFFT_Horizontal ---------------------------------------------------------
	this.IFFT_HorizontalWGSL = wgslFn(`
		fn computeWGSL(
			butterflyBuffer: ptr<storage,array<vec4<f32>>,read>,
			pingpongBuffer: ptr<storage,array<vec4<f32>>,read_write>,
			index: u32,
			size: u32,
			initBufferIndex: u32,
			step: u32,
			logN: u32,
			pingpong: u32,
			workgroupSize: vec2<u32>,
			workgroupId: vec3<u32>,
			localId: vec3<u32>
		) -> void {
			let pos = workgroupSize.xy*workgroupId.xy + localId.xy;
			let butterflyIndex = pos.x*logN + step;
			let data = butterflyBuffer[butterflyIndex];
			let bufferIndexEven = pos.y*size + u32(data.z);
			let bufferIndexOdd = pos.y*size + u32(data.w);
			let even = select(pingpongBuffer[bufferIndexEven].xy,pingpongBuffer[bufferIndexEven].zw,pingpong == 0);
			let odd  = select(pingpongBuffer[bufferIndexOdd].xy,pingpongBuffer[bufferIndexOdd].zw,pingpong == 0);
			let H: vec2<f32> = even + multiplyComplex(data.rg,odd);
			pingpongBuffer[index] = vec4<f32>(
				select(pingpongBuffer[index].xy,H,pingpong == 0),
				select(H,pingpongBuffer[index].zw,pingpong == 0)
			);
		}
		fn multiplyComplex(a: vec2<f32>,b: vec2<f32>) -> vec2<f32> {
			return vec2<f32>(a.x*b.x - a.y*b.y,a.y*b.x + a.x*b.y);
		}
	`);		
	//- IFFT_Vertical -----------------------------------------------------------
	this.IFFT_VerticalWGSL = wgslFn(`
		fn computeWGSL(
			butterflyBuffer: ptr<storage,array<vec4<f32>>,read>,
			pingpongBuffer: ptr<storage,array<vec4<f32>>,read_write>,
			index: u32,
			size: u32,
			initBufferIndex: u32,
			step: u32,
			logN: u32,
			pingpong: u32,
			workgroupSize: vec2<u32>,
			workgroupId: vec3<u32>,
			localId: vec3<u32>,
		) -> void {
			let pos = workgroupSize.xy*workgroupId.xy + localId.xy;
			let butterflyIndex = pos.y*logN + step;
			let data = butterflyBuffer[butterflyIndex];
			let bufferIndexEven = u32(data.z)*size + pos.x;
			let bufferIndexOdd = u32(data.w)*size + pos.x;
			let even = select(pingpongBuffer[bufferIndexEven].xy,pingpongBuffer[bufferIndexEven].zw,pingpong == 0);
			let odd  = select(pingpongBuffer[bufferIndexOdd].xy,pingpongBuffer[bufferIndexOdd].zw,pingpong == 0);
			let H: vec2<f32> = even + multiplyComplex(data.rg,odd);
			pingpongBuffer[index] = vec4<f32>(
				select(pingpongBuffer[index].xy,H,pingpong == 0),
				select(H,pingpongBuffer[index].zw,pingpong == 0)
			);
		}
		fn multiplyComplex(a: vec2<f32>,b: vec2<f32>) -> vec2<f32> {
			return vec2<f32>(a.x*b.x - a.y*b.y,a.y*b.x + a.x*b.y);
		}
	`);	
	//- IFFT Permute ------------------------------------------------------------
	this.IFFT_PermuteWGSL = wgslFn(`
		fn computeWGSL(
			pingpongBuffer: ptr<storage,array<vec4<f32>>,read>,
			DxDzBuffer: ptr<storage,array<vec2<f32>>,read_write>,
			DyDxzBuffer: ptr<storage,array<vec2<f32>>,read_write>,
			initBufferIndex: u32,
			index: u32,
			size: u32,
			workgroupSize: vec2<u32>,
			workgroupId: vec3<u32>,
			localId: vec3<u32>,
		) -> void {
			let pos = workgroupSize.xy*workgroupId.xy + localId.xy;
			let input = pingpongBuffer[index].xy;
			let output = input*(1.0 - 2.0*f32((pos.x + pos.y) % 2));
			DxDzBuffer[index] = select(DxDzBuffer[index],output,initBufferIndex == 0u);
			DyDxzBuffer[index] = select(DyDxzBuffer[index],output,initBufferIndex == 1u);
		} 
	`);
	//- TexturesMerger
	this.TexturesMergerWGSL = wgslFn(`
		fn computeWGSL(
			DxDzBuffer: ptr<storage,array<vec2<f32>>,read>,
			DyDxzBuffer: ptr<storage,array<vec2<f32>>,read>,
			writeDisplacement: texture_storage_2d<rgba16float,write>,
			size: u32,
			lambda: f32,
			workgroupSize: vec2<u32>,
			workgroupId: vec3<u32>,
			localId: vec3<u32>,
		) -> void {
			let pos = workgroupSize.xy*workgroupId.xy+localId.xy;
			let bufferIndex = pos.y*size+pos.x;
			var x = DxDzBuffer[bufferIndex];
			var y = DyDxzBuffer[bufferIndex];
			textureStore(writeDisplacement,pos,vec4f(lambda*x.x,y.x,lambda*x.y,0));
		}
	`);
	//-  Normal Map (Old) -------------------------------------------------------
	this.computeNormalMapWGSL = wgslFn(`
		fn computeWGSL(
			r_disp: texture_2d<f32>,
			w_norm: texture_storage_2d<rgba32float,write>,
			indx: u32,
			size: f32,
			gsiz: f32,
			workgroupSize: vec2<u32>,
			workgroupId: vec3<u32>,
			localId: vec3<u32>,
		) -> void {
			// Variables
			//- Compute vUv(u)
			let pos = workgroupSize.xy*workgroupId.xy+localId.xy;
			var posX = u32(indx) % u32(size);	// width
			var posY = u32(indx) / u32(size);	// height
			var idx  = vec2u(u32(posX),u32(posY));
			var idxf = vec2f(idx);
			//
			let texel: f32 = 1/size;
			let texelSize: f32 = gsiz/size;
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
			nrm3 = vec3<f32>(nrm3)*0.5 + 0.5;
			textureStore(w_norm,pos,vec4f(nrm3.x,nrm3.z,nrm3.y,1));
		}
	`);

//= INITIALIZE (continue) =======================================================

	//- Butterfly ---------------------------------------------------------------
	this.butterflyBuffer = new StorageBufferAttribute(new Float32Array(Math.log2(this.size)*this.size*4),4);
	this.butterfly = this.butterflyWGSL({ 
		butterflyBuffer: storage(this.butterflyBuffer,'vec4',this.butterflyBuffer.count),
		index: instanceIndex,
		N: this.size,
	}).compute(Math.log2(this.size)*this.size);
	params.renderer.compute(this.butterfly);
	//- Initial Spectrum --------------------------------------------------------
	this.initialSpectrum = this.InitialSpectrumWGSL({ 
		spectrumBuffer: storage(this.spectrumBuffer,'vec4',this.spectrumBuffer.count),
		waveDataBuffer: storage(this.waveDataBuffer,'vec4',this.waveDataBuffer.count),
		index: instanceIndex,
		size: this.size,
		waveLength: params.waveLength,
		boundaryLow: params.boundaryLow,
		boundaryHigh: params.boundaryHigh,
		// Wave Spectrum 1
		depth: params.depth,
		scaleHeight: params.scaleHeight,
		windSpeed: params.windSpeed,
		windDirection: params.windDirection,
		fetch: params.fetch,
		spreadBlend: params.spreadBlend,
		swell: params.swell,
		peakEnhancement: params.peakEnhancement,
		shortWaveFade: params.shortWaveFade,
		fadeLimit: params.fadeLimit,
		// Wave Spectrum 2
		d_depth: params.d_depth,
		d_scaleHeight: params.d_scaleHeight,
		d_windSpeed: params.d_windSpeed,
		d_windDirection: params.d_windDirection,
		d_fetch: params.d_fetch,
		d_spreadBlend: params.d_spreadBlend,
		d_swell: params.d_swell,
		d_peakEnhancement: params.d_peakEnhancement,
		d_shortWaveFade: params.d_shortWaveFade,
		d_fadeLimit: params.d_fadeLimit,	
	}).compute(this.sqSize);
	params.renderer.compute(this.initialSpectrum);
	//- Initial Spectrum with Inverse -------------------------------------------
	this.initialSpectrumWithInverse = this.InitialSpectrumWithInverseWGSL({ 
		spectrumBuffer: storage(this.spectrumBuffer,'vec4',this.spectrumBuffer.count),
		index: instanceIndex,
		size: this.size,
	}).compute(this.sqSize);
	params.renderer.compute(this.initialSpectrumWithInverse);
	// TimeSpectrum -------------------------------------------------------------
	this.computeTimeSpectrum = this.TimeSpectrumWGSL({
		spectrumBuffer: storage(this.spectrumBuffer,'vec4',this.spectrumBuffer.count),
		waveDataBuffer: storage(this.waveDataBuffer,'vec4',this.waveDataBuffer.count),
		writeDxDzBuffer: storage(this.DxDzBuffer,'vec2',this.DxDzBuffer.count),
		writeDyDxzBuffer: storage(this.DyDxzBuffer,'vec2',this.DyDxzBuffer.count),
		index: instanceIndex,
		size: uint(params.size),
		time: uniform(0)
	}).computeKernel(this.workgroupSize);
	// IFFT_Initialize ----------------------------------------------------------
	this.computeInitialize = this.IFFT_InitWGSL({ 
		butterflyBuffer: storage(this.butterflyBuffer,'vec4',this.butterflyBuffer.count).toReadOnly(),
		DxDzBuffer: storage(this.DxDzBuffer,'vec2',this.DxDzBuffer.count).toReadOnly(),
		DyDxzBuffer: storage(this.DyDxzBuffer,'vec2',this.DyDxzBuffer.count).toReadOnly(),
		pingpongBuffer: storage(this.pingpongBuffer,'vec4',this.pingpongBuffer.count),
		index: instanceIndex,
		size: uint(params.size),
		initBufferIndex: uint(this.DDindex),
		step: uint(this.ifftStep),
		logN: uint(this.logN),
		workgroupSize: uniform(new Vector2().fromArray(this.workgroupSize)),
		workgroupId: workgroupId,
		localId: localId			
	}).computeKernel(this.workgroupSize); 
	// IFFT_Horizontal ----------------------------------------------------------
	this.computeHorizontalPingPong = this.IFFT_HorizontalWGSL({ 
		butterflyBuffer: storage(this.butterflyBuffer,'vec4',this.butterflyBuffer.count).toReadOnly(),
		pingpongBuffer: storage(this.pingpongBuffer,'vec4',this.pingpongBuffer.count),
		index: instanceIndex,
		size: uint(params.size),
		initBufferIndex: uint(this.DDindex),
		pingpong: uint(this.pingpong),
		step: uint(this.ifftStep),
		logN: uint(this.logN),
		workgroupSize: uniform(new Vector2().fromArray(this.workgroupSize)),
		workgroupId: workgroupId,
		localId: localId
	}).computeKernel(this.workgroupSize);
	// IFFT_Vertical ------------------------------------------------------------
	this.computeVerticalPingPong = this.IFFT_VerticalWGSL({
		butterflyBuffer: storage(this.butterflyBuffer,'vec4',this.butterflyBuffer.count).toReadOnly(),
		pingpongBuffer: storage(this.pingpongBuffer,'vec4',this.pingpongBuffer.count),
		index: instanceIndex,
		size: uint(params.size),
		initBufferIndex: uint(this.DDindex),
		pingpong: uint(this.pingpong),
		step: uint(this.ifftStep),
		logN: uint(this.logN),
		workgroupSize: uniform(new Vector2().fromArray(this.workgroupSize)),
		workgroupId: workgroupId,
		localId: localId
	}).computeKernel(this.workgroupSize);
	// IFFT_Permute -------------------------------------------------------------
	this.computePermute = this.IFFT_PermuteWGSL({ 
		pingpongBuffer: storage(this.pingpongBuffer,'vec4',this.pingpongBuffer.count).toReadOnly(),
		DxDzBuffer: storage(this.DxDzBuffer,'vec2',this.DxDzBuffer.count),
		DyDxzBuffer: storage(this.DyDxzBuffer,'vec2',this.DyDxzBuffer.count),
		index: instanceIndex,
		size: uint(params.size),
		initBufferIndex: uint(this.DDindex),
		workgroupSize: uniform(new Vector2().fromArray(this.workgroupSize)),
		workgroupId: workgroupId,
		localId: localId
	}).computeKernel(this.workgroupSize);
	// TexturesMerge ------------------------------------------------------------
	this.computeMergeTextures = this.TexturesMergerWGSL({ 
		DxDzBuffer: storage(this.DxDzBuffer,'vec2',this.DxDzBuffer.count).toReadOnly(),
		DyDxzBuffer: storage(this.DyDxzBuffer,'vec2',this.DyDxzBuffer.count).toReadOnly(),
		writeDisplacement: textureStore(this.displacement),
		size: uint(params.size),
		lambda: uniform(params.lambda),
		workgroupSize: uniform(new Vector2().fromArray(this.workgroupSize)),
		workgroupId: workgroupId,
		localId: localId
	}).computeKernel(this.workgroupSize);
	//- Normal Map --------------------------------------------------------------
	this.computeNormalMap = this.computeNormalMapWGSL({
		r_disp: texture(this.displacement),
		w_norm: textureStore(this.normMapTexture),
		indx: instanceIndex,
		size: this.size,
		gsiz: params.gsiz,
		workgroupSize: uniform(new Vector2().fromArray(this.workgroupSize)),
		workgroupId: workgroupId,
		localId: localId
	}).computeKernel(this.workgroupSize);

// End of Initialization
};

//= UPDATE CLASS (called by Main Program) =======================================

update(dt) {
	const timeOffset = 1000;
	this.computeTimeSpectrum.computeNode.parameters.time.value = timeOffset+performance.now()/1000;
	this.params_.renderer.compute(this.computeTimeSpectrum, this.dispatchSize);
	this.IFFT( 0 );	//DxDz
	this.IFFT( 1 );	//DyDxz
	this.params_.renderer.compute(this.computeMergeTextures, this.dispatchSize);
	this.params_.renderer.compute(this.computeNormalMap, this.dispatchSize);
};

IFFT(index) {
	this.DDindex.value = index;
	let pingpong = true;
	this.ifftStep.value = 0;
	this.params_.renderer.compute( this.computeInitialize, this.dispatchSize );
	for(let i = 1; i < this.logN; i++){
		pingpong = !pingpong;
		this.ifftStep.value = i;
		this.pingpong.value = pingpong ? 1 : 0;
		this.params_.renderer.compute( this.computeHorizontalPingPong, this.dispatchSize );
	}
	for(let i = 0; i < this.logN; i++){
		pingpong = !pingpong;
		this.ifftStep.value = i;
		this.pingpong.value = pingpong ? 1 : 0;
		this.params_.renderer.compute( this.computeVerticalPingPong, this.dispatchSize );
	}
	this.params_.renderer.compute( this.computePermute, this.dispatchSize );
};

};	// End of Module

/********************************************************************************
*
*	EXPORTS
*
********************************************************************************/

export {Ocean};

/********************************************************************************
*
*	REVISIONS
*
//******************************************************************************/
/*
	250908: Initial Version - Uses Compute Shaders 
*/

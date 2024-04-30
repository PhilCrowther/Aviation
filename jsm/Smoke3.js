//= SMOKE MODULE ===============================================================

// A version of the Smoke module created by SimonDev

import {
	AdditiveBlending,
	BufferGeometry,
	Color,
	Float32BufferAttribute,
	NormalBlending,
	Points,
	ShaderMaterial,
	TextureLoader,
	Vector3
} from 'three';

const _VS = `
uniform float pointMultiplier;
attribute float size;
attribute float angle;
attribute vec4 colour;
varying vec4 vColour;
varying vec2 vAngle;
void main() {
	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * mvPosition;
	gl_PointSize = size * pointMultiplier / gl_Position.w;
	vAngle = vec2(cos(angle), sin(angle));
	vColour = colour;
}`;

const _FS = `
uniform sampler2D diffuseTexture;
varying vec4 vColour;
varying vec2 vAngle;
void main() {
	vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
	gl_FragColor = texture2D(diffuseTexture, coords) * vColour;
}`;

//* Inputs (fire)
let P_File = "../3js/common/textures/fire.png";
let P_Blnd = AdditiveBlending;
let P_Size = 4.0;					// Size [4.0]
let P_Dist = P_Size/4;				// XYZ Distance 
let P_LifM = 10;					// Life Multiplier [10]
let P_NumM = 75;					// Number Multipier [75]
let P_gdfM = P_NumM;				// [75]
let P_RotM = 0.5;					// Rotation Multiplier [0.5]
let P_SpdX = 0;
let P_SpdY = 5;						// Vertical Speed [15 fps = 5 mps]
let P_SpdZ = 0;
let P_DrgM = 0.1;					// Drag
let P_Spl0 = 0xFFFF80;				// Beg Color [0xFFFF80]
let P_Spl1 = 0xFF8080;				// Beg Color [0xFF8080]

//* Inputs (Smoke)
let	P_Mult = 8;						// Multiplier	
	P_File = "../textures/fx/cloud10.png";
	P_Blnd = NormalBlending;
	P_Size = P_Mult*P_Size;			// makes it wider
	P_Dist = P_Size/4;				// XYZ Distance 
	P_LifM = P_Mult*P_LifM;			// causes bunching at top
	P_NumM = 10;					// reduce number of particles
	P_gdfM = P_NumM;
	P_RotM = 0.1;					// Rotation Multiplier
	P_SpdX = .05*P_SpdY;
	P_SpdY = .5*P_Mult*P_SpdY;
	P_SpdZ = .05*P_SpdY;
	P_DrgM = 0.025;					// Drag	
	P_Spl0 = 0xe0e0e0;
	P_Spl1 = 0xf0f0f0;
	

class ParticleSystem {
	// Initialize System
	constructor(params) {
		const uniforms = {
			diffuseTexture: {value: new TextureLoader().load(P_File)},
			pointMultiplier: {value: window.innerHeight / (2.0 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))}
		};
		this._material = new ShaderMaterial({
			uniforms: uniforms,
			vertexShader: _VS,
			fragmentShader: _FS,
			blending: P_Blnd,
			depthTest: true,
			depthWrite: false,
			transparent: true,
			opacity: 0.5,
			alphaTest: 0.5,
			vertexColors: true
		});
		this._camera = params.camera;
		this._particles = [];
		this._geometry = new BufferGeometry();
		this._geometry.setAttribute('position', new Float32BufferAttribute([], 3));
		this._geometry.setAttribute('size', new Float32BufferAttribute([], 1));
		this._geometry.setAttribute('colour', new Float32BufferAttribute([], 4));
		this._geometry.setAttribute('angle', new Float32BufferAttribute([], 1));
		this._points = new Points(this._geometry, this._material);
		this._points.frustumCulled=false;			// TEST
		params.parent.add(this._points);
		// Make Splines for Alpha, Color, Size
		this._alphaSpline = new LinearSpline((t, a, b) => {
			return a + t * (b - a);
		});
		this._alphaSpline.AddPoint(0.0, 0.4);
		this._alphaSpline.AddPoint(0.1, 0.3);
		this._alphaSpline.AddPoint(0.6, 0.2);
		this._alphaSpline.AddPoint(0.8, 0.1);
		this._alphaSpline.AddPoint(1.0, 0.0);
		this._colourSpline = new LinearSpline((t, a, b) => {
			const c = a.clone();
			return c.lerp(b, t);
		});
		this._colourSpline.AddPoint(0.0, new Color(P_Spl0));
		this._colourSpline.AddPoint(1.0, new Color(P_Spl1));
		this._sizeSpline = new LinearSpline((t, a, b) => {
			return a + t * (b - a);
		});
		this._sizeSpline.AddPoint(0.0, 1.0);
		this._sizeSpline.AddPoint(0.5, 10.0);
		this._sizeSpline.AddPoint(0.8, 25.0);
		this._sizeSpline.AddPoint(1.0, 60.0);
		this._UpdateGeometry();
	}
	
	// Added
	setPosition(x,y,z) {
  	  this._points.position.x = x;
  	  this._points.position.y = y;
  	  this._points.position.z = z;
	}
		
	Step(timeElapsed) {
		this._AddParticles(timeElapsed);
		this._UpdateParticles(timeElapsed);
		this._UpdateGeometry();
	}

	_AddParticles(timeElapsed) {
		if (!this.gdfsghk) {
			this.gdfsghk = 0.0;
		}
		this.gdfsghk += timeElapsed;	// Adds time to gdfsghk
		const n = Math.floor(this.gdfsghk * 75.0);		// n = integer of gd*75
		this.gdfsghk -= n / 75.0;	// Subtract 1/72th of n from gd
		for (let i = 0; i < n; i++) {
			const life = (Math.random() * 0.75 + 0.25) * P_LifM;
			this._particles.push({
				position: new Vector3(
					(Math.random() * 2 - 1) * P_Dist,
					(Math.random() * 2 - 1) * P_Dist,
					(Math.random() * 2 - 1) * P_Dist),
				size: (Math.random() * 0.5 + 0.5) * P_Size,
				colour: new Color(),
				alpha: 1.0,
				life: life,
				maxLife: life,
				rotation: Math.random() * 2.0 * Math.PI,
				velocity: new Vector3(P_SpdX, P_SpdY, P_SpdZ),
			});
		}
	}

	_UpdateParticles(timeElapsed) {
		for (let p of this._particles) {
			p.life -= timeElapsed;
		}
		this._particles = this._particles.filter(p => {
			return p.life > 0.0;
		});
		for (let p of this._particles) {
			const t = 1.0 - p.life / p.maxLife;
			p.rotation += timeElapsed * P_RotM;
			p.alpha = this._alphaSpline.Get(t);
			p.currentSize = p.size * this._sizeSpline.Get(t);
			p.colour.copy(this._colourSpline.Get(t));
			p.position.add(p.velocity.clone().multiplyScalar(timeElapsed));
			const drag = p.velocity.clone();	// Use negative drag to create accelerating deflection
			drag.multiplyScalar(timeElapsed * P_DrgM);
			drag.x = -Math.sign(p.velocity.x) * Math.min(Math.abs(drag.x), Math.abs(p.velocity.x));
//			drag.y = Math.sign(p.velocity.y) * Math.min(Math.abs(drag.y), Math.abs(p.velocity.y));
			drag.z = -Math.sign(p.velocity.z) * Math.min(Math.abs(drag.z), Math.abs(p.velocity.z));
			p.velocity.sub(drag);
		}
		this._particles.sort((a, b) => {
			const d1 = this._camera.position.distanceTo(a.position);
			const d2 = this._camera.position.distanceTo(b.position);
			if (d1 > d2) {return -1;}
			if (d1 < d2) {return 1;}
			return 0;
		});
	}
	
	_UpdateGeometry() {
		const positions = [];
		const sizes = [];
		const colours = [];
		const angles = [];
		for (let p of this._particles) {
			positions.push(p.position.x, p.position.y, p.position.z);
			colours.push(p.colour.r, p.colour.g, p.colour.b, p.alpha);
			sizes.push(p.currentSize);
			angles.push(p.rotation);
		}
		this._geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
		this._geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));
		this._geometry.setAttribute('colour', new Float32BufferAttribute(colours, 4));
		this._geometry.setAttribute('angle', new Float32BufferAttribute(angles, 1));	
		this._geometry.attributes.position.needsUpdate = true;
		this._geometry.attributes.size.needsUpdate = true;
		this._geometry.attributes.colour.needsUpdate = true;
		this._geometry.attributes.angle.needsUpdate = true;
	}	
}

class LinearSpline {
	constructor(lerp) {
		this._points = [];
		this._lerp = lerp;
	}
	AddPoint(t, d) {
		this._points.push([t, d]);
	}
	Get(t) {
		let p1 = 0;
		for (let i = 0; i < this._points.length; i++) {
			if (this._points[i][0] >= t) {
				break;
			}
			p1 = i;
		}
		const p2 = Math.min(this._points.length - 1, p1 + 1);
		if (p1 == p2) {
			return this._points[p1][1];
		}
		return this._lerp(
				(t - this._points[p1][0]) / (
						this._points[p2][0] - this._points[p1][0]),
				this._points[p1][1], this._points[p2][1]);
	}
}

export {ParticleSystem};


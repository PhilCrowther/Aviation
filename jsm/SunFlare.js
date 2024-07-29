//= SUNFLARE MODULE ============================================================

// Version 1.0 (28 Jul 2024)
//
// This module allows you to create a LensWlare of the Sun in both WebGL or WebGPU
// This works with a default camera rotator and with OrbitControls 
//
// this module is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

import {
	SpriteMaterial,
	AdditiveBlending,
	Sprite
} from 'three';

//= EXTERNAL VARIABLES =========================================================
// This module uses the following inputs
//	LnF_.flg				// 0 = default, 1 = OrbitControls
//	LnF_.sun (vec2) 		// Sun Position (lat/lon) in degrees
//	LnF_.cam (vec2)			// Camera Direction (lat/lon) degrees
//	LnF_.num				// Number of Sprites
//	LnF_.txt (array)		// Texture Addresses
//	LnF_.rad (array)		// Sprite Distances
//	LnF_.siz (array)		// Sprite Scale
//	LnF_.mlt (array)		// Sprite Offset Multiplier
//	LnF_.msh (array)		// Sprite Rotator Mesh Addresses
//	LnF_.par				// (Orbit Control Only) Camera Clone Mesh (parent)
// This module generates the following outputs:
//	LnF_.off (vec2)			// Sun Offset (lat/lon) degrees (for display)
//	LnF_.spr (array)		// Sprite Addresses (if want to change textures, etc)

//= NOTE: If you use OrbitControls, you must update LnF_.cam in render using the following:
//	LnF_.cam.x = OrbCon.getPolarAngle()*RadDeg-90;
//	LnF_.cam.y = Mod360(360-OrbCon.getAzimuthalAngle()*RadDeg);
// where OrbCon is the address of the OrbitControls
// The Mod360 function and the RadDeg variable are shown below.

//= INTERNAL VARIABLES =========================================================
//	Standard Conversions
var DegRad = Math.PI/180;	// Convert Degrees to Radians
var RadDeg = 180/Math.PI;	// Convert Radians to Degrees

//= SUNFLARE ==================================================================

class SunFlare {
	constructor(scene,camera,LnF_) {
		this._init(scene,camera,LnF_);
	}

	// Initialize
	_init(renderer, wav_) {
		this.sunflare = this.SunFlare(scene,camera,LnF_);
	}

	update() {
		this.update = this.Update();
	}

//= Initialize Ocean ===========================================================
SunFlare(scene,camera,LnF_) {
	// Load Variables
	this.scene = scene;
	this.camera = camera;
	this.LnF_ = LnF_;
	//
	if (this.LnF_.flg) {										// For ObritControl, Initialize Camera Clone
		this.LnF_.par.rotation.copy(this.camera.rotation);
		this.LnF_.par.position.copy(this.camera.position);
		this.scene.add(this.LnF_.par);
	}
	// Get Sprites
	let LnFmat;
	for (let i = 0; i < LnF_.num; i++) {
		LnFmat = new SpriteMaterial({
			map: this.LnF_.txt[i],
			blending: AdditiveBlending,							// For the original non-transparent material
			depthTest:false,
			depthWrite:false
		});
		this.LnF_.spr[i] = new Sprite(LnFmat);
		this.LnF_.spr[i].scale.set(this.LnF_.siz[i],this.LnF_.siz[i],1);
		this.LnF_.spr[i].position.z = -this.LnF_.rad[i];		// neg
		this.LnF_.msh[i].attach(this.LnF_.spr[i]);				// Attach Sprite to Rotator
		this.scene.add(this.LnF_.msh[i]);						//
		if (this.LnF_.flg) this.LnF_.par.add(this.LnF_.msh[i]);	// If OrbCon: Attach Rotator to Camera Clone
		else {this.camera.attach(this.LnF_.msh[i]);}			// Otherwise: Attach Rotator to Camera
	}	
};	// End of Initialize

// = OCEAN.RENDER = (called by Main Program) ====================
Update() {
	if (this.LnF_.fl) {											// For OrbitCoontrol, Copy Camera Rotation and Position
		this.LnF_.par.rotation.copy(this.camera.rotation);
		this.LnF_.par.position.copy(this.camera.position);
	}
	// Get Difference Between Sun and Camera Directions
	this.LnF_.off.x = htis.LnF_.cam.x-this.LnF_.sun.x;			// Camera Lat Offset
	this.LnF_.off.y = PoM360(Mod360(this.LnF_.cam.y-this.LnF_.sun.y));	// Camera Lat Offset
	// Test Visibility
	let VisFlg = 0;
	let ratio = window.innerWidth/window.innerHeight;
	if (Math.abs(this.LnF_.off.x) > 45 || Math.abs(this.LnF_.off.y) > 45*ratio) VisFlg = 1;
	if (VisFlg) {
		for (let i = 0; i < this.LnF_.num; i++) {
			this.LnF_.spr[i].visible = false;	
		}
	}
	// If visible
	else {
		for (let i = 0; i < this.LnF_.num; i++) {
			this.LnF_.spr[i].visible = true;
			this.LnF_.msh[i].rotation.x = -this.LnF_.off.x*this.LnF_.mlt[i]*DegRad;
			this.LnF_.msh[i].rotation.y = this.LnF_.off.y*this.LnF_.mlt[i]*DegRad;
		}
	}
};	// End of Update

};	// End of Main Module

//= MISCELLANOUS SUBROUTINES ===================================================

//- Converts degrees to 360
function Mod360(deg) {
	while (deg < 0) deg = deg+360;	// Make deg a positive number
	deg = deg % 360;				// Compute remainder of any number divided by 360
return deg;}

//  Converts 360 degrees to +/- 180
function PoM360(deg) {
	if (deg > 180) deg = deg-360;
return deg;}


//= EXPORT =====================================================================

export {SunFlare};

//= CHANGE LOG =================================================================
//- 240728: Version 1	:

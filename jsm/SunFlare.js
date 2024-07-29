//= SUNFLARE MODULE ============================================================

//	Version 1.0 (28 Jul 2024)
//
//	This module allows you to create a LensWlare of the Sun in both WebGL or WebGPU.
//	This works with a default camera rotator and with OrbitControls.
//	this module is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//
//	EXPLANATION:
//	This Module creates LensFlares caused by the sun and which do not change distance.
//	The Module creates LensFlare sprites and attaches them to rotator meshes.
//	The rotator meshes are attached to the camera (or a camera clone for OrbitControls).
//	The Module computes an offset, which is the difference between the direction of the sun and camera.
//	The offset is multiplied by a multiplier which creates the illusion of depth.
//	If the offset is too great (the Sun is no longer visible on the screen), the sprites are turned off.
//


import {
	SpriteMaterial,
	AdditiveBlending,
	Sprite
} from 'three';

//= EXTERNAL VARIABLES =========================================================
// This module uses the following inputs
//	SnF_.flg				// 0 = default, 1 = OrbitControls
//	SnF_.sun (vec2) 		// Sun Position (lat/lon) in degrees
//	SnF_.cam (vec2)			// Camera Direction (lat/lon) degrees
//	SnF_.num				// Number of Sprites
//	SnF_.txt (array)		// Texture Addresses
//	SnF_.rad (array)		// Sprite Distances
//	SnF_.siz (array)		// Sprite Scale
//	SnF_.mlt (array)		// Sprite Offset Multiplier
//	SnF_.msh (array)		// Sprite Rotator Mesh Addresses
//	SnF_.par				// (Orbit Control Only) Camera Clone Mesh (parent)
// This module generates the following outputs:
//	SnF_.off (vec2)			// Sun Offset (lat/lon) degrees (for display)
//	SnF_.spr (array)		// Sprite Addresses (if want to change textures, etc)

//= NOTE: If you use OrbitControls, you must update SnF_.cam in render using the following:
//	SnF_.cam.x = OrbCon.getPolarAngle()*RadDeg-90;
//	SnF_.cam.y = Mod360(360-OrbCon.getAzimuthalAngle()*RadDeg);
//  where OrbCon is the address of the OrbitControls
//  The Mod360 function and the RadDeg variable are shown below.

//= INTERNAL VARIABLES =========================================================
//	Standard Conversions
var DegRad = Math.PI/180;	// Convert Degrees to Radians
var RadDeg = 180/Math.PI;	// Convert Radians to Degrees

//= SUNFLARE ==================================================================

class SunFlare {
	constructor(scene,camera,SnF_) {
		this._init(scene,camera,SnF_);
	}

	// Initialize
	_init(scene,camera,SnF_) {
		this.sunflare = this.SunFlare(scene,camera,SnF_);
	}

	update() {
		this.update = this.Update();
	}

//= INITIALIZE =================================================================
SunFlare(scene,camera,SnF_) {
	// Load Variables
	this.scene = scene;
	this.camera = camera;
	this.SnF_ = SnF_;
	//
	if (this.SnF_.flg) {										// For ObritControl, Initialize Camera Clone
		this.SnF_.par.rotation.copy(this.camera.rotation);
		this.SnF_.par.position.copy(this.camera.position);
		this.scene.add(this.SnF_.par);
	}
	// Get Sprites
	let LnFmat;
	for (let i = 0; i < SnF_.num; i++) {
		LnFmat = new SpriteMaterial({
			map: this.SnF_.txt[i],
			blending: AdditiveBlending,							// For the original non-transparent material
			depthTest:false,
			depthWrite:false
		});
		this.SnF_.spr[i] = new Sprite(LnFmat);
		this.SnF_.spr[i].scale.set(this.SnF_.siz[i],this.SnF_.siz[i],1);
		this.SnF_.spr[i].position.z = -this.SnF_.rad[i];		// neg
		this.SnF_.msh[i].attach(this.SnF_.spr[i]);				// Attach Sprite to Rotator
		this.scene.add(this.SnF_.msh[i]);						//
		if (this.SnF_.flg) this.SnF_.par.add(this.SnF_.msh[i]);	// If OrbCon: Attach Rotator to Camera Clone
		else {this.camera.attach(this.SnF_.msh[i]);}			// Otherwise: Attach Rotator to Camera
	}	
};	// End of Initialize

// = UPDATE ====================================================================
Update() {
	if (this.SnF_.fl) {											// For OrbitCoontrol, Copy Camera Rotation and Position
		this.SnF_.par.rotation.copy(this.camera.rotation);
		this.SnF_.par.position.copy(this.camera.position);
	}
	// Get Difference Between Sun and Camera Directions
	this.SnF_.off.x = this.SnF_.cam.x-this.SnF_.sun.x;			// Camera Lat Offset
	this.SnF_.off.y = PoM360(Mod360(this.SnF_.cam.y-this.SnF_.sun.y));	// Camera Lat Offset
	// Test Visibility
	let VisFlg = 0;
	let ratio = window.innerWidth/window.innerHeight;
	if (Math.abs(this.SnF_.off.x) > 45 || Math.abs(this.SnF_.off.y) > 45*ratio) VisFlg = 1;
	if (VisFlg) {
		for (let i = 0; i < this.SnF_.num; i++) {
			this.SnF_.spr[i].visible = false;	
		}
	}
	// If visible
	else {
		for (let i = 0; i < this.SnF_.num; i++) {
			this.SnF_.spr[i].visible = true;
			this.SnF_.msh[i].rotation.x = -this.SnF_.off.x*this.SnF_.mlt[i]*DegRad;
			this.SnF_.msh[i].rotation.y = this.SnF_.off.y*this.SnF_.mlt[i]*DegRad;
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

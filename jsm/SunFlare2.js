//= SUNFLARE2 MODULE ============================================================

//	Version 1.0 (5 Aug 2024)
//
//	This module allows you to create a LensWlare of the Sun in both WebGL or WebGPU.
//	This works with a default camera rotator and with OrbitControls.
//	this module is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//
//	EXPLANATION:
//	This Module creates LensFlares caused by the sun which do not change distance.
//	The Module creates Sprite Rotator Meshes and adds SunFlare Sprites to them.
//	The Module adds the Sprite Rotator Meshes to the camera (or a camera clone for OrbitControls).
//	The Module computes an offset, which is the difference between the direction of the camera and the Sun.
//	The offset is multiplied by a multiplier which creates the illusion of depth.
//	If the offset is too great (the Sun is no longer visible on the screen), the sprites are turned off.
//  This SunFlare2 Module is designed to handle situations wheer the Camera is attached to a moving object.
//

import {
	BoxGeometry,
	MeshBasicMaterial,
	Mesh
} from 'three';

//= EXTERNAL VARIABLES =========================================================
// This module uses the following inputs
//	SnF_.typ				// 0 = default, 1 = OrbitControls
//	SnF_.num				// Number of Sprites
//	SnF_.spr (array)		// Sprite Addresses
//	SnF_.mlt (array)		// Sprite Offset Multiplier
//	SnF_.cam (vec2)			// Camera Direction (lat/lon) degrees
//	SnF_.sun (vec2) 		// Sun Position (lat/lon) in degrees
//  SnF_.asp				// Screen Aspect Ratio
// This module generates the following outputs:
//	SnF_.msh [mesh array]	// Sprite Rotators
//	SnF_.par:				// Parent (camera or camera clone for OrbitControls)
//	SnF_.off (vec2)			// Sun Offset (lat/lon) degrees (for display)

//= INTERNAL VARIABLES =========================================================
//	Standard Conversions
let DegRad = Math.PI/180;	// Convert Degrees to Radians
let RadDeg = 180/Math.PI;		// Convert Radians to Degrees

//= SUNFLARE ==================================================================

class SunFlare {
	constructor(scene,camera, SnF_) {
		this._init(scene,camera, SnF_);
    }

	// Initialize
	_init(scene,camera, SnF_) {
		this.sunflare = this.sunflare(scene,camera, SnF_);
	}

	update(SnF_) {
		this.update = this.update(SnF_);
	}

//= Initialize =================================================================
sunflare(scene,camera,SnF_) {
	//
	this.camera = camera;
	//
	if (SnF_.typ) {	// Initialize Camera Clone
		SnF_.par = makMsh();	
		SnF_.par.rotation.copy(this.camera.rotation);
		SnF_.par.position.copy(this.camera.position);
		scene.add(SnF_.par);
	}
	else {SnF_.par = this.camera};
	// Get Sprites
	for (let i = 0; i < SnF_.num; i++) {
		// Sprite Rotators
		SnF_.msh[i] = makMsh();				// Make Rotators
		SnF_.msh[i].add(SnF_.spr[i]);		// Add Sprite to Rotator
		scene.add(SnF_.msh[i]);				// Make Visible
		SnF_.par.add(SnF_.msh[i]);			// Add to Parent
	}
};

update(SnF_) {
	if (SnF_.typ) {	// Copy Camera Rotation and Position
		SnF_.par.rotation.copy(this.camera.rotation);
		SnF_.par.position.copy(this.camera.position);
	}
	// Get Difference Between Sun and Camera Directions
	SnF_.off.x = SnF_.sun.x-SnF_.cam.x;					// Camera Lat Offset
	SnF_.off.y = PoM360(Mod360(SnF_.sun.y-SnF_.cam.y));	// Camera Lat Offset
	if (SnF_.cam.z) {	// If the Camera is banked
		let radius = Math.sqrt(SnF_.off.x*SnF_.off.x+SnF_.off.y*SnF_.off.y);
		let angle0 = Mod360(Math.atan2(SnF_.off.y,SnF_.off.x)*RadDeg);	// Angle to Sun
		let angle1 = Mod360(angle0-SnF_.cam.z);			// Subtract Bank
		SnF_.off.x = radius*Math.cos(angle1*DegRad);	// Recompute offsets
		SnF_.off.y = radius*Math.sin(angle1*DegRad);
	}
	// Test Visibility
	let VisFlg = 0;
	if (Math.abs(SnF_.off.x) > 45 || Math.abs(SnF_.off.y) > 45*SnF_.asp) VisFlg = 1;
	if (VisFlg) {
		for (let i = 0; i < SnF_.num; i++) {
			SnF_.spr[i].visible = false;	
		}
	}
	// If visible, Compute Displacement
	else {
		for (let i = 0; i < SnF_.num; i++) {
			SnF_.spr[i].visible = true;
			SnF_.msh[i].rotation.x = SnF_.off.x*SnF_.mlt[i]*DegRad;
			SnF_.msh[i].rotation.y = -SnF_.off.y*SnF_.mlt[i]*DegRad;
		}
	}
};

};

//= MISCELLANOUS SUBROUTINES ===================================================

//- Converts degrees to 360 ----------------------------------------------------
function Mod360(deg) {
	while (deg < 0) deg = deg+360;	// Make deg a positive number
	deg = deg % 360;				// Compute remainder of any number divided by 360
return deg;}

//- Converts 360 degrees to +/-180 ---------------------------------------------
function PoM360(deg) {
	if (deg > 180) deg = deg-360;
return deg;}

//- Make Simple Mesh -----------------------------------------------------------
function makMsh() {
	let geometry = new THREE.BoxGeometry(0.01,0.01,0.01); 
	let material = new MeshBasicNodeMaterial({transparent:true,opacity:0});
	let mesh = new THREE.Mesh(geometry, material);
return mesh;}

//= EXPORT =====================================================================

export {SunFlare};

//= CHANGE LOG =================================================================
//- 240805: Version 2
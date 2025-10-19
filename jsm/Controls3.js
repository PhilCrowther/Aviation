/********************************************************************************
*
*	CONTROLS MODULE
*
*********************************************************************************

Copyright 2017-25, Phil Crowther <phil@philcrowther.com>
Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
Version dated 8 Oct 2025

@fileoverview
The three.js pointer lock control (modified) and camera controls
See http://philcrowther.com/Aviation for more details.
*/

/********************************************************************************
*
*	IMPORTS
*
********************************************************************************/

import {
	EventDispatcher,
} from 'three';

/********************************************************************************
*
*	VARIABLES
*
********************************************************************************/

/********************************************************************************
*
*	POINTER LOCK CONTROLS
*
********************************************************************************/
//	Adapted from three.js version

class PointerLockControls extends EventDispatcher {
	constructor(camera, domElement, plc_) {
		super();
		this.domElement = domElement;
		this.isLocked = false;
		const scope = this;
		function onMouseMove(event) {
			if (scope.isLocked === false) return;
			const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;		
			InpMos.x = movementX;
			InpMos.y = movementY;
		}
		function onPointerlockChange() {
			if (scope.domElement.ownerDocument.pointerLockElement === scope.domElement) {
				scope.dispatchEvent(_lockEvent);
				scope.isLocked = true;
			} else {
				scope.dispatchEvent(_unlockEvent);
				scope.isLocked = false;
			}
		}
		function onPointerlockError() {
			console.error("PointerLockControls: Unable to use Pointer Lock API");
		}
		this.connect = function () {
			scope.domElement.ownerDocument.addEventListener("mousemove", onMouseMove);
			scope.domElement.ownerDocument.addEventListener("pointerlockchange", onPointerlockChange);
			scope.domElement.ownerDocument.addEventListener("pointerlockerror", onPointerlockError);
		};
		this.disconnect = function () {
			scope.domElement.ownerDocument.removeEventListener("mousemove", onMouseMove);
			scope.domElement.ownerDocument.removeEventListener("pointerlockchange", onPointerlockChange);
			scope.domElement.ownerDocument.removeEventListener("pointerlockerror", onPointerlockError);
		};
		this.dispose = function () {
			this.disconnect();
		};
		this.lock = function () {
			this.domElement.requestPointerLock();
		};
		this.unlock = function () {
			scope.domElement.ownerDocument.exitPointerLock();
		};
		this.connect();
	}
}

/********************************************************************************
*
*	CAMERA
*
********************************************************************************/

//= MOVE CAMERA VIEW ===========//===============================================
function moveCamera(camera,cam_,air_,key_) {
	camera.rotation.x = 0;		// Default
	if (cam_.VewRot) {			// Beginning Head Rotation
		// Zero Out When Moving Forward
		if (!air_.MovFlg) {		// Throttle is trigger
			cam_.VewRot = 0.95*cam_.VewRot;
			if (Math.abs(cam_.VewRot < 0.1)) cam_.VewRot = 0;
		}
	}
	// Camera In/Out
	camera.position.z = -cam_.CamLLD.z;
	// PointerLockControls
	if (cam_.OrbFlg) {			// If Orbiting
		cam_.CamLLD.x = cam_.CamLLD.x - InpMos.y * cam_.CamMMR.z; // Camera Position (Lat)
		cam_.CamLLD.x = MaxVal(cam_.CamLLD.x,cam_.CamMMR.x);
		cam_.CamLLD.y = Mod360(cam_.CamLLD.y + InpMos.x * cam_.CamMMR.z); // Camera Position (Lon)
		// Internal View
		if (cam_.CamFlg) {		// Range: 250 to 360/0 to 110
			if (cam_.CamLLD.y > 180 && cam_.CamLLD.y < (360-cam_.CamMMR.y)) cam_.CamLLD.y = (360-cam_.CamMMR.y);
			if (cam_.CamLLD.y < 180 && cam_.CamLLD.y > cam_.CamMMR.y) cam_.CamLLD.y = cam_.CamMMR.y;
		}
		// External View
		else {
			if (air_.GrdFlg && cam_.CamLLD.x > -12.5) cam_.CamLLD.x = -12.5;
		}
		InpMos.x = 0;
		InpMos.y = 0;
	}
	// View Keys (NumLock)
	else {						// If Not Orbiting
		// Default
		cam_.CamLLD.x = cam_.CamLLD.y = 0;
		// Internal View
		if (cam_.CamFlg) {
			cam_.CamLLD.y = cam_.VewRot;
			if (key_.D45flg && !cam_.VewRot) cam_.CamLLD.x = 45; // Up
			if (key_.D45flg && cam_.VewRot) cam_.CamLLD.y = 0;
			if (key_.U45flg) cam_.CamLLD.x = 315; // Down
		}
		// Exterior View
		else {
			cam_.CamLLD.x = -15;
			if (key_.U45flg) cam_.CamLLD.x = 315;
			if (key_.D45flg && air_.MapPos.y>50) cam_.CamLLD.x = 45;
			if (key_.CBkflg) cam_.CamLLD.y = 180; // Look Back (only in External View)
		}
		if (key_.L45flg) cam_.CamLLD.y = 315;	// Look Left 45
		if (key_.R45flg) cam_.CamLLD.y = 45;	// Look Right 45
		if (key_.L90flg) cam_.CamLLD.y = 270;	// Look Left 90
		if (key_.R90flg) cam_.CamLLD.y = 90;	// Look Right 90
		if (key_.LBkflg) cam_.CamLLD.y = 225;	// Look Left 135
		if (key_.RBkflg) cam_.CamLLD.y = 135;	// Look Right 135		
	}
	// Adjust Camera Rotators
	// In Internal View, the camera is facing out - view matches rotation
	if (cam_.CamFlg) {
		cam_.MshRot.rotation.x = Mod360(cam_.CamLLD.x)*DegRad;
		cam_.MshRot.rotation.y = Mod360(-cam_.CamLLD.y)*DegRad;
	}
	// In External View, the camera is facing in and the armature is pointing out:
	if (!cam_.CamFlg) {
		if (!cam_.OrbFlg && air_.GrdFlg) { // Air to Ground
			if (!cam_.CmGrdF) {		// if just landed
				cam_.CmLagX = cam_.CmAdjX; // All landings are smooth
//				if (cam_.CmLagX > 0.5) cam_.CmLagX = 0.5; // Make extreme landings more jarring
				cam_.CmGrdF = 1;
			}
			cam_.CmAdjX = cam_.CmLagX;	// From Landing Value to 0
		}	
		if (!cam_.OrbFlg && !air_.GrdFlg) { // Ground to Air
			if (cam_.CmGrdF) {		// if just took off
				cam_.CmLagX = cam_.CmMulX*air_.RotDif.x;
				cam_.CmGrdF = 0;
			}
			cam_.CmAdjX = (cam_.CmMulX*air_.RotDif.x)-cam_.CmLagX; // From 0 to Take-Off Value
		}
		if (cam_.CmLagX) {			// Reduce Lag
			cam_.CmLagX = 0.99*cam_.CmLagX; // Reduction in Adj/AdjOff
			if (Math.abs(cam_.CmLagX) < 0.1) cam_.CmLagX = 0;
		}
		camera.rotation.x = cam_.CmAdjX*DegRad; // + = up/airplane down
		cam_.MshRot.rotation.x = Mod360(-cam_.CamLLD.x)*DegRad;
		cam_.MshRot.rotation.y = Mod360(180-cam_.CamLLD.y)*DegRad;
	}
}

/*******************************************************************************
*
*	KEYBOARD
*
*******************************************************************************/

//= KEYBOARD (Down) FM2 ========================================================
function KeyBDn_FM2(event,keyCode,gen_,air_,anm_,cam_,key) {
	// Basic
	if (event.keyCode == key_.PwLU) gen_.PwrDif = 0.1;		// Power Up - keyboard left
	if (event.keyCode == key_.PwLD) gen_.PwrDif = -0.1;		// Power Down - keyboard left
	if (event.keyCode == key_.PwRU) gen_.PwrDif = 0.1;		// Power Up - keyboard right
	if (event.keyCode == key_.PwRD) gen_.PwrDif = -0.1;		// Power Down - keyboard right
	if (event.keyCode == key_.BnkL) air_.InpKey.z = -KeyVal.z; // Bank Left - autopilot only
	if (event.keyCode == key_.BnkR) air_.InpKey.z = KeyVal.z;	// Bank Right - autopilot only
	if (event.keyCode == key_.PitU) air_.InpKey.x = KeyVal.x;	// Pitch Up - autopilot only
	if (event.keyCode == key_.PitD) air_.InpKey.x = -KeyVal.x; // Pitch Down - autopilot only
	if (event.keyCode == key_.YwLL) air_.RotDif.y = -KeyVal.z; // YawL - keyboard left
	if (event.keyCode == key_.YwLR) air_.RotDif.y = KeyVal.z;  // YawR - keyboard left
	if (event.keyCode == key_.YwRL) air_.RotDif.y = -KeyVal.z; // YawL - keyboard right
	if (event.keyCode == key_.YwRR) air_.RotDif.y = KeyVal.z;  // YawR - keyboard right
	if (event.keyCode == key_.Brak) gen_.InpBrk = 0.01;		// Brakes
	// Additional
	if (event.keyCode == key_.Gear) anm_.lngflg = 1; 	// Gear
	if (event.keyCode == key_.Flap) anm_.flpflg = 1; 	// Flaps
	if (event.keyCode == key_.Canp) anm_.canflg = 1; 	// Canopy
	if (event.keyCode == key_.Hook) anm_.thkflg = 1; 	// Tailhook
	// Views
	if (event.keyCode == key_.Look) cam_.OrbFlg = 1;	// External View
	if (event.keyCode == key_.VU45) key_.D45flg = 1;	// View - 45 deg up
	if (event.keyCode == key_.VD45) key_.U45flg = 1;	// View - 45 deg down
	if (event.keyCode == key_.VL45) key_.L45flg = 1;	// View - 45 deg left
	if (event.keyCode == key_.VR45) key_.R45flg = 1;	// View - 45 deg right
	if (event.keyCode == key_.VL90) key_.L90flg = 1;	// View - 90 deg left
	if (event.keyCode == key_.VR90) key_.R90flg = 1;	// View - 90 deg right
	if (event.keyCode == key_.VLBk) key_.LBkflg = 1;	// View - 135 deg left
	if (event.keyCode == key_.VRBk) key_.RBkflg = 1;	// View - 135 deg right
	if (event.keyCode == key_.VCBk) key_.CBkflg = 1;	// View - 180 deg back
}

//= KEYBOARD (Up) FM2 ==========================================================

function KeyBUp_FM2(event,keyCode,gen_air_,anm_,cam_,key_) {
	// Basic
	if (event.keyCode == key_.PwLU) gen_.PwrDif = 0;	// Power Up - keyboard left
	if (event.keyCode == key_.PwLD) gen_.PwrDif = 0;	// Power Down - keyboard left
	if (event.keyCode == key_.PwRU) gen_.PwrDif = 0;	// Power Up - keyboard right
	if (event.keyCode == key_.PwRD) gen_.PwrDif = 0;	// Power Down - keyboard right
	if (event.keyCode == key_.BnkL) air_.InpKey.z = 0;	// Bank Left - autopilot only
	if (event.keyCode == key_.BnkR) air_.InpKey.z = 0;	// Bank Right - autopilot only
	if (event.keyCode == key_.PitU) air_.InpKey.x = 0;	// Pitch Up - autopilot only
	if (event.keyCode == key_.PitD) air_.InpKey.x = 0;	// Pitch Down - autopilot only
	if (event.keyCode == key_.YwLL) air_.RotDif.y = 0;	// YawL - keyboard left side
	if (event.keyCode == key_.YwLR) air_.RotDif.y = 0;	// YawR - keyboard left side
	if (event.keyCode == key_.YwRL) air_.RotDif.y = 0;	// YawL - keyboard right side
	if (event.keyCode == key_.YwRR) air_.RotDif.y = 0;	// YawR - keyboard right side
	if (event.keyCode == key_.Brak) gen_.InpBrk = 0;	// Brakes
	// Additional
	if (event.keyCode == key_.Gear) anm_.lngflg = 0;	// Gear
	if (event.keyCode == key_.Flap) anm_.flpflg = 0;	// Flaps
	if (event.keyCode == key_.Canp) anm_.canflg = 0;	// Canopy
	if (event.keyCode == key_.Hook) anm_.thkflg = 0;	// Taihook
	// Views
	if (event.keyCode == key_.Look) cam_.OrbFlg = 0;	// Orbit View
	if (event.keyCode == key_.VU45) key_.D45flg = 0;	// View - 45 deg up
	if (event.keyCode == key_.VD45) key_.U45flg = 0;	// View - 45 deg down
	if (event.keyCode == key_.VL45) key_.L45flg = 0;	// View - 45 deg left
	if (event.keyCode == key_.VR45) key_.R45flg = 0;	// View - 45 deg right
	if (event.keyCode == key_.VL90) key_.L90flg = 0;	// View - 90 deg left
	if (event.keyCode == key_.VR90) key_.R90flg = 0;	// View - 90 deg right
	if (event.keyCode == key_.VLBk) key_.LBkflg = 0;	// View - 135 deg left
	if (event.keyCode == key_.VRBk) key_.RBkflg = 0;	// View - 135 deg right
	if (event.keyCode == key_.VCBk) key_.CBkflg = 0;	// View - 180 deg back
}

/********************************************************************************
*
*	SUBROUTINES
*
********************************************************************************/

//  Converts degrees to 360
function Mod360(deg) {
	while (deg < 0) deg = deg+360; // Make deg a positive number
	deg = deg % 360;			// Compute remainder of any number divided by 360
return deg;}

//- Limit Maximum +/- Value
function MaxVal(x, max) {
	if (x > 0 && x >  max) x =  max;
	if (x < 0 && x < -max) x = -max;
return x;}

/********************************************************************************
*
*	EXPORTS
*
********************************************************************************/

export {PointerLockControls,moveCamera,KeyBDn_FM2,KeyBUp_FM2};

/********************************************************************************
*
*	REVISIONS
*
*********************************************************************************

250407:	In Development
250529: Combined this Controls Module with Camera Module

*/

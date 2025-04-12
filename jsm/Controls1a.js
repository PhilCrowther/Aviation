/*
 * Controls.js (vers 25.04.07)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * Subroutines to create an air combat simulation
 * See http://philcrowther.com/Aviation for more details.
 */

/*******************************************************************************
*
*	NOTES
*
*******************************************************************************/
/*
This currently includes a modified pointer lock control
*/

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	EventDispatcher,
} from 'three';

//= VARIABLES ==================//==============================================

/*******************************************************************************
*
*	POINTER LOCK CONTROLS
*
*******************************************************************************/
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

/*******************************************************************************
*
*	CAMERA
*
*******************************************************************************/

//- Move Camera View -----------//----------------------------------------------
function moveCamera(camera,cam_,air_,key_) {
	camera.rotation.x = 0;		// Default
	if (cam_.VewRot) {			// Beginning Head Rotation
		// Zero Out When Moving Forward
		if (air_.PwrPct) {		// Throttle is trigger
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
		if (key_.R45flg) cam_.CamLLD.y = 45;		// Look Right 45
		if (key_.L90flg) cam_.CamLLD.y = 270;	// Look Left 90
		if (key_.R90flg) cam_.CamLLD.y = 90;		// Look Right 90
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
			if (!CmGrdF) {		// if just landed
				CmLagX = CmAdjX; // All landings are smooth
//				if (CmLagX > 0.5) CmLagX = 0.5; // Make extreme landings more jarring
				CmGrdF = 1;
			}
			CmAdjX = CmLagX;	// From Landing Value to 0
		}	
		if (!cam_.OrbFlg && !air_.GrdFlg) { // Ground to Air
			if (CmGrdF) {		// if just took off
				CmLagX = CmMulX*air_.RotDif.x;
				CmGrdF = 0;
			}
			CmAdjX = (CmMulX*air_.RotDif.x)-CmLagX; // From 0 to Take-Off Value
		}
		if (CmLagX) {			// Reduce Lag
			CmLagX = 0.99*CmLagX; // Reduction in Adj/AdjOff
			if (Math.abs(CmLagX) < 0.1) CmLagX = 0;
		}
		camera.rotation.x = CmAdjX*DegRad; // + = up/airplane down
		cam_.MshRot.rotation.x = Mod360(-cam_.CamLLD.x)*DegRad;
		cam_.MshRot.rotation.y = Mod360(180-cam_.CamLLD.y)*DegRad;
	}
}

/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {PointerLockControls,moveCamera};

/*******************************************************************************
*
*	REVISIONS
*
*******************************************************************************/
/*
250407:	Version 1
*/

/*******************************************************************************
*
*	CONTROLS MODULE
*
********************************************************************************

Copyright 2017-25, Phil Crowther <phil@philcrowther.com>
Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
Version dated 26 Nov 2025

@fileoverview
The three.js pointer lock control (modified) and camera controls
See http://philcrowther.com/Aviation for more details.
*/

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	Controls
} from 'three';

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

/*******************************************************************************
*
*	POINTER LOCK CONTROLS
*
*******************************************************************************/
//	Adapted from three.js version

class PointerLockControls extends Controls {
	constructor(camera, domElement = null) {
		super(camera, domElement);
		this.isLocked = false;			
		this.pointerSpeed = 1.0;		
		// event listeners
		this._onMouseMove = onMouseMove.bind(this);
		this._onPointerlockChange = onPointerlockChange.bind(this);
		this._onPointerlockError = onPointerlockError.bind(this);
		if (this.domElement !== null) {
			this.connect(this.domElement);
		}
	}

	connect(element) {
		super.connect(element);
		this.domElement.ownerDocument.addEventListener('mousemove', this._onMouseMove);
		this.domElement.ownerDocument.addEventListener('pointerlockchange', this._onPointerlockChange);
		this.domElement.ownerDocument.addEventListener('pointerlockerror', this._onPointerlockError);
	}

	disconnect() {
		this.domElement.ownerDocument.removeEventListener('mousemove', this._onMouseMove);
		this.domElement.ownerDocument.removeEventListener('pointerlockchange', this._onPointerlockChange);
		this.domElement.ownerDocument.removeEventListener('pointerlockerror', this._onPointerlockError);
	}

	dispose() {
		this.disconnect();
	}

	lock(unadjustedMovement = false) {
		this.domElement.requestPointerLock({unadjustedMovement});
	}

	unlock() {
		this.domElement.ownerDocument.exitPointerLock();
	}
}

// event listeners
function onMouseMove(event) {
	if (this.enabled === false || this.isLocked === false) return;
	const movementx = event.movementX;
	const movementY = event.movementY;
	InpMos.x = movementX;
	InpMos.y = movementY;
	this.dispatchEvent(_changeEvent);
}
		
function onPointerlockChange() {
	if (this.domElement.ownerDocument.pointerLockElement === this.domElement) {
		this.dispatchEvent(_lockEvent);
		this.isLocked = true;
	} else {
		this.dispatchEvent(_unlockEvent);
		this.isLocked = false;
	}
}

function onPointerlockError() {
	console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');
}

/*******************************************************************************
*
*	CAMERA
*
*******************************************************************************/

//= MOVE CAMERA VIEW ===========//==============================================
function moveCamera(cam_,air_,key_,gen_) {
	gen_.camera.rotation.x = 0;		// Default
	if (cam_.VewRot) {			// Beginning Head Rotation
		// Zero Out When Moving Forward
		if (!air_.MovFlg) {		// Throttle is trigger
			cam_.VewRot = 0.95*cam_.VewRot;
			if (Math.abs(cam_.VewRot < 0.1)) cam_.VewRot = 0;
		}
	}
	// Camera In/Out
	gen_.camera.position.z = -cam_.CamLLD.z;
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
		gen_.camera.rotation.x = cam_.CmAdjX*DegRad; // + = up/airplane down
		cam_.MshRot.rotation.x = Mod360(-cam_.CamLLD.x)*DegRad;
		cam_.MshRot.rotation.y = Mod360(180-cam_.CamLLD.y)*DegRad;
	}
}

/*******************************************************************************
*
*	SUBROUTINES
*
*******************************************************************************/

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
********************************************************************************

250407:	In Development
250529: Combined this Controls Module with Camera Module
251126: Added camera to gen_
*/

/*******************************************************************************
*
*	CONTROLS MODULE
*
********************************************************************************

Copyright 2017-25, Phil Crowther <phil@philcrowther.com>
Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
Version dated 21 Oct 2025

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
	EventDispatcher,
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
*	CAMERA (FM2 Only)
*
*******************************************************************************/
// Two way view: External and Internal View

//= INIT CAMERA VIEW ===========//==============================================
// This is called every time the camera view changes
// This is currently for FM2 only since Pup does not have Internal View
// If Pup added, disable initAnimFM2(cam_,mxr_,anm_) since Pup has no animations

function initCamera(camera,sunLight,cam_,air_,sky_,CamLLD,CamMMD,CamMMR) {
	camera.position.z = -cam_.CamLLD.z;
	camera.rotation.y = cam_.CamAdj*DegRad;
//	cam_.MshRot.add(camera);	// Attach to rotator
	if (!cam_.CamSel) {			// 0 = External View
		if (!air_.GrdFlg) {
			sunLight.shadow.mapSize.set(2048,2048);
			sunLight.shadow.camera.far = sky_.SunDst+sky_.ShdDst+sky_.ShdBox;
			sunLight.shadow.camera.updateProjectionMatrix();
		}
		mxr_.Adr.visible = true;
		vxr_.Adr.visible = false;
	}
	if (cam_.CamSel) {			// 1 = Internal View
		if (!air_.GrdFlg) {
			sunLight.shadow.mapSize.set(8192,8192);
			sunLight.shadow.camera.far = sky_.SunDst+2*sky_.ShdBox;
			sunLight.shadow.camera.updateProjectionMatrix();
		}
		mxr_.Adr.visible = false;
		vxr_.Adr.visible = true;
	}
	// Common Changes
	cam_.CamLLD.copy(CamLLD[cam_.CamSel]);	// Restore Saved Values
	cam_.CamMMD.copy(CamMMD[cam_.CamSel]);	// In/Out - min, max, spd
	cam_.CamAdj = CamAdj[cam_.CamSel];		// Load Adjustment
	camera.rotation.y = cam_.CamAdj*DegRad;	// 180 = Looking in
	cam_.CamMMR.copy(CamMMR[cam_.CamSel]);	// Rotation min, max, spd
	cam_.CamPar = CamPar[cam_.CamSel]		// Load New Parent
	cam_.CamPar.add(cam_.MshRot);			// Attach Rotators
	cam_.CamFlg = CamFlg[cam_.CamSel];		// 1 = Internal
	cam_.CamLnk = CamLnk[cam_.CamSel];		// 1 = Linked to Airplane
	// Select Animations
	initAnimFM2(cam_,mxr_,anm_);			// FM2
	//
	moveCamera(camera,cam_,air_,key_);
}

function initAnimFM2(cam_,mxr_,anm_) {
	if (!cam_.CamSel) {			// 0 = External View
		// Flaps
		if (mxr_.FlL) mxr_.FlL.setTime(anm_.flppos/anm_.anmfps);
		if (mxr_.FlR) mxr_.FlR.setTime(anm_.flppos/anm_.anmfps);
		// Gear
		if (mxr_.WHL) mxr_.WHL.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WHR) mxr_.WHR.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WBL) mxr_.WBL.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WBR) mxr_.WBR.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WTL) mxr_.WTL.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WTR) mxr_.WTR.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WSL) mxr_.WSL.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WSR) mxr_.WSR.setTime(anm_.lngpos/anm_.anmfps);
		// Tailhook
		if (mxr_.THk) mxr_.THk.setTime(anm_.thkpos/anm_.anmfps);
		// Canopy
		if (mxr_.Cnp) mxr_.Cnp.setTime(anm_.canpos/anm_.anmfps);
	}
	if (cam_.CamSel) {			// 1 = Internal View
		// Canopy
		if (mxr_.Cnp) mxr_.Cnp.setTime(anm_.canpos/anm_.anmfps);
	}
}

//= MOVE CAMERA VIEW ===========//==============================================

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

export {PointerLockControls,initCamera,moveCamera};

/*******************************************************************************
*
*	REVISIONS
*
********************************************************************************

250407:	In Development
250529: Combined this Controls Module with Camera Module
*/

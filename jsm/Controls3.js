/*******************************************************************************
*
*	CONTROLS MODULE
*
********************************************************************************

Copyright 2017-26, Phil Crowther <phil@philcrowther.com>
Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
Version dated 27 Feb 2026

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
	Vector3,
} from 'three';

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

let DegRad = Math.PI/180;		// Convert Degrees to Radians

/*******************************************************************************
*
*	POINTER LOCK CONTROLS
*
*******************************************************************************/
//	Adapted from three.js version

class PointerLockControls extends EventDispatcher {
	constructor(domElement) {
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

//= INIT CAMERA VIEW ===========//==============================================
function initCamera(cam_,air_,key_,gen_,mxr_,vxr_) {
	//- Select Model -----------------------------------------------------------
	if (!cam_.CamSel) {			// 0 = External View
		// Airplane Models
		mxr_.Adr.visible = true;
		vxr_.Adr.visible = false;
	}	
	if (cam_.CamSel) {			// 1 = Internal View
		// Airplane Models
		mxr_.Adr.visible = false;
		vxr_.Adr.visible = true;	
	}
	//- Load New Values --------------------------------------------------------
	cam_.CamLLD = new Vector3().copy(cam_.SrcLLD[cam_.CamSel]); // cam_.MshRot Lat, Lon, Dst
	cam_.CamMMD = new Vector3().copy(cam_.SrcMMD[cam_.CamSel]); // In/Out - min,max,spd
	cam_.CamMMR = new Vector3().copy(cam_.SrcMMR[cam_.CamSel]); // Rotate - min/max Lat/Lon,rspd
	cam_.CamPar = cam_.SrcPar[cam_.CamSel];	// Center of Rotation
	cam_.CamAdj = cam_.SrcAdj[cam_.CamSel];	// Load Adjustment
	cam_.CamFlg = cam_.SrcFlg[cam_.CamSel];	// 1 = Internal
	cam_.CamLnk = cam_.SrcLnk[cam_.CamSel];	// 1 = Linked to Airplane
	//- Final Adjustments ------------------------------------------------------
	cam_.CamPar.add(cam_.MshRot);			// Attach Rotators to new CamPar (AirObj or CamPVC)
	gen_.camera.rotation.y = cam_.CamAdj*DegRad;	// 180 = Looking in
	moveCamera(cam_,air_,key_,gen_);
}


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
		cam_.CamLLD = new Vector3().copy(cam_.SrcLLD[cam_.CamSel]);
		// KeyPad ..............................................................
		if (cam_.KeyPad) {
			// Exterior View
			if (!cam_.CamFlg) {
				cam_.CamLLD.x = cam_.SrcLLD[cam_.CamSel].x; // 260227
				if (key_.U45flg) cam_.CamLLD.x = 315;
				if (key_.D45flg && air_.MapPos.y>50) cam_.CamLLD.x = 45;
				if (key_.CBkflg) cam_.CamLLD.y = 180; // Look Back (only in External View)
			}
			// Internal View
			else {
				cam_.CamLLD.y = cam_.VewRot;
				if (key_.D45flg && !cam_.VewRot) cam_.CamLLD.x = 45; // Up
				if (key_.D45flg && cam_.VewRot) cam_.CamLLD.y = 0;
				if (key_.U45flg) cam_.CamLLD.x = 315; // Down
			}
			if (key_.L45flg) cam_.CamLLD.y = 315;	// Look Left 45
			if (key_.R45flg) cam_.CamLLD.y = 45;	// Look Right 45
			if (key_.L90flg) cam_.CamLLD.y = 270;	// Look Left 90
			if (key_.R90flg) cam_.CamLLD.y = 90;	// Look Right 90
			if (key_.LBkflg) cam_.CamLLD.y = 225;	// Look Left 135
			if (key_.RBkflg) cam_.CamLLD.y = 135;	// Look Right 135
		}
		// Alt Keys ............................................................
		else {
			// Exterior View
			if (!cam_.CamFlg) {
				cam_.CamLLD.x = cam_.SrcLLD[cam_.CamSel].x; // 260227
				if (key_.D45flg && air_.MapPos.y>50) cam_.CamLLD.x = 45;
			}	
			// Internal View
			else {
				cam_.CamLLD.y = cam_.VewRot;
				if (key_.D45flg && !cam_.VewRot) cam_.CamLLD.x = 45; // Up
				if (key_.D45flg && cam_.VewRot) cam_.CamLLD.y = 0;
			}
			if (cam_.U45flg) cam_.CamLLD.x = 315;	// Look Down 45
			if (cam_.L45flg) cam_.CamLLD.y = 45;	// Look Left 45
			if (cam_.R45flg) cam_.CamLLD.y = 315;	// Look Right 45
			if (cam_.L90flg) cam_.CamLLD.y = 90;	// Look Left 90
			if (cam_.R90flg) cam_.CamLLD.y = 270;	// Look Right 90
		}	
	}
	// Adjust Camera Rotators
	// In Internal View, the camera is facing out - view matches rotation
	if (cam_.CamFlg) {
		cam_.MshRot.rotation.x = Mod360(cam_.CamLLD.x)*DegRad;
		cam_.MshRot.rotation.y = Mod360(-cam_.CamLLD.y)*DegRad;
	}
	// In External View, the camera is facing in and the armature is pointing out:
	if (!cam_.CamFlg) {
		// Vertical Camera Lag
		if (cam_.LagFlg) {
			if (!cam_.OrbFlg && air_.GrdFlg) { // Air to Ground
				if (!cam_.CmGrdF) {		// if just landed
					cam_.CmLagX = cam_.CmAdjX; // All landings are smooth
//					if (cam_.CmLagX > 0.5) cam_.CmLagX = 0.5; // Make extreme landings more jarring
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
		}
		gen_.camera.rotation.x = cam_.CmAdjX*DegRad; // + = up/airplane down
		// External Values
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
251126: Added camera to gen_
260227: Reload default (rather than fixed) values
		Added LagFlg to make camera vertical lag optional.
		Added initCamera
*/

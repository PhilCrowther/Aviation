/*
 * Display.js (vers 25.04.15)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * Two Position Camera Controls
 * See http://philcrowther.com/Aviation for more details.
 */

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/
	
/*******************************************************************************
*
*	CAMERA
*
*******************************************************************************/

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

export {moveCamera};

/*******************************************************************************
*
*	REVISIONS
*
*******************************************************************************/
/*
250407:	Version 1
*/

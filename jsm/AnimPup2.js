/*******************************************************************************
*
*	ANIM PUP MODULE
*
********************************************************************************

Copyright 2017-26, Phil Crowther <phil@philcrowther.com>
Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
Version dated 25 Mar 2026

@fileoverview
A three.js class-type module for animating a Sopwith Pup aircraft model
See http://philcrowther.com/Aviation for more details.
*/

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	AnimationClip,
	AnimationMixer
} from 'three';

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

//= 1. MAIN VARIABLES ==========//==============================================

//- CONSTANTS ------------------//----------------------------------------------
let	DLTime = 1/60;				// Delta Time (1/60 seconds)
//-	Conversions
const Ft2Mtr = 0.3048;			// Convert Feet to Meters (exact)
const Mtr2Ft = 1/Ft2Mtr;		// Meters to Feet
const Km2Mil = 0.621371;

/*******************************************************************************
*
*	PROGRAM
*
*******************************************************************************/

//= LOAD AIR EXTERNAL ==========================================================

//-	Load Airplane Model --------//----------------------------------------------
function loadAirExt(air_,mxr_,anm_,gen_) {
	gen_.gltfLd.load(mxr_.Src, function (gltf) {		// The OnLoad function
		gltf.scene.traverse(function (child) {	
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
			if (child.name == "propeller") {
				child.castShadow = false;
				child.receiveShadow = false;
				child.renderOrder = 1;
			}
		});
		mxr_.Adr = gltf.scene;
		mxr_.Adr.rotation.order = "YXZ";
		mxr_.Adr.scale.setScalar(Ft2Mtr);
		loadAirAnmX(gltf,air_,mxr_,anm_);
		//
		air_.AirPBY.add(mxr_.Adr);
		// Initialize
		mxr_.Adr.visible = true;
	});	
}

// Load Animations -------------//----------------------------------------------
function loadAirAnmX(gltf,air_,mxr_,anm_) {		
	// Animations --------------------------------------------------------------
	// Propeller
	let clip = AnimationClip.findByName(gltf.animations, "propellerAction");
	mxr_.Prp = new AnimationMixer(mxr_.Adr);
	let actun = mxr_.Prp.clipAction(clip);
	actun.play();
	if (mxr_.Prp) mxr_.Prp.setTime(anm_.spnprp/anm_.anmfps);
	// Rudder
	mxr_.Rdr = new AnimationMixer(mxr_.Adr);
	clip = AnimationClip.findByName(gltf.animations, "rudderAction");
	actun = mxr_.Rdr.clipAction(clip);
	actun.play();
	if (mxr_.Rdr) mxr_.Rdr.setTime(anm_.rudder/anm_.anmfps);
	// Elevator
	clip = AnimationClip.findByName(gltf.animations, "elevatorAction");
	mxr_.Elv = new AnimationMixer(mxr_.Adr);
	actun = mxr_.Elv.clipAction(clip);
	actun.play();
	if (mxr_.Elv) mxr_.Elv.setTime(anm_.elvatr/anm_.anmfps);
	// AileronTL
	clip = AnimationClip.findByName(gltf.animations, "aileronTLAction");
	mxr_.ATL = new AnimationMixer(mxr_.Adr);
	actun = mxr_.ATL .clipAction(clip);
	actun.play();
	if (mxr_.ATL) mxr_.ATL.setTime(anm_.aillft/anm_.anmfps);
	// AileronTR
	clip = AnimationClip.findByName(gltf.animations, "aileronTRAction");
	mxr_.ATR = new AnimationMixer(mxr_.Adr);
	actun = mxr_.ATR.clipAction(clip);
	actun.play();
	if (mxr_.ATR) mxr_.ATR.setTime(anm_.ailrgt/anm_.anmfps);
	// AileronBL
	clip = AnimationClip.findByName(gltf.animations, "aileronBLAction");
	mxr_.ABL = new AnimationMixer(mxr_.Adr);
	actun = mxr_.ABL .clipAction(clip);
	actun.play();
	if (mxr_.ABL) mxr_.ABL.setTime(anm_.aillft/anm_.anmfps);
	// AileronBR
	clip = AnimationClip.findByName(gltf.animations, "aileronBRAction");
	mxr_.ABR = new AnimationMixer(mxr_.Adr);
	actun = mxr_.ABR.clipAction(clip);
	actun.play();
	if (mxr_.ABR) mxr_.ABR.setTime(anm_.ailrgt/anm_.anmfps);
}

//= LOAD AIR INTERNAL ==========================================================

//-	Load Airplane Model --------//----------------------------------------------
function loadAirInt(air_,vxr_,anm_,gen_) {
	gen_.gltfLd.load(vxr_.Src, function (gltf) {		// The OnLoad function
		gltf.scene.traverse(function (child) {	
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
			if (child.name == "propeller") {
				child.castShadow = false;
				child.receiveShadow = false;
				child.renderOrder = 1;
			}
		});
		vxr_.Adr = gltf.scene;
		vxr_.Adr.rotation.order = "YXZ";
		vxr_.Adr.scale.setScalar(Ft2Mtr);
		loadAirAnmV(gltf,air_,vxr_,anm_);
		//
		air_.AirPBY.add(vxr_.Adr);
		// Initialize
		vxr_.Adr.visible = true;
	});	
}

// Load Animations -------------//----------------------------------------------
function loadAirAnmV(gltf,air_,vxr_,anm_) {		
	// Animations --------------------------------------------------------------
	// Propeller
	let clip = AnimationClip.findByName(gltf.animations, "propellerAction");
	vxr_.Prp = new AnimationMixer(vxr_.Adr);
	let actun = vxr_.Prp.clipAction(clip);
	actun.play();
	if (vxr_.Prp) vxr_.Prp.setTime(anm_.spnprp/anm_.anmfps);
	// Rudder
	vxr_.Rdr = new AnimationMixer(vxr_.Adr);
	clip = AnimationClip.findByName(gltf.animations, "rudderAction");
	actun = vxr_.Rdr.clipAction(clip);
	actun.play();
	if (vxr_.Rdr) vxr_.Rdr.setTime(anm_.rudder/anm_.anmfps);
	// Elevator
	clip = AnimationClip.findByName(gltf.animations, "elevatorAction");
	vxr_.Elv = new AnimationMixer(vxr_.Adr);
	actun = vxr_.Elv.clipAction(clip);
	actun.play();
	if (vxr_.Elv) vxr_.Elv.setTime(anm_.elvatr/anm_.anmfps);
	// AileronTL
	clip = AnimationClip.findByName(gltf.animations, "aileronTLAction");
	vxr_.ATL = new AnimationMixer(vxr_.Adr);
	actun = vxr_.ATL .clipAction(clip);
	actun.play();
	if (vxr_.ATL) vxr_.ATL.setTime(anm_.aillft/anm_.anmfps);
	// AileronTR
	clip = AnimationClip.findByName(gltf.animations, "aileronTRAction");
	vxr_.ATR = new AnimationMixer(vxr_.Adr);
	actun = vxr_.ATR.clipAction(clip);
	actun.play();
	if (vxr_.ATR) vxr_.ATR.setTime(anm_.ailrgt/anm_.anmfps);
	// AileronBL
	clip = AnimationClip.findByName(gltf.animations, "aileronBLAction");
	vxr_.ABL = new AnimationMixer(vxr_.Adr);
	actun = vxr_.ABL .clipAction(clip);
	actun.play();
	if (vxr_.ABL) vxr_.ABL.setTime(anm_.aillft/anm_.anmfps);
	// AileronBR
	clip = AnimationClip.findByName(gltf.animations, "aileronBRAction");
	vxr_.ABR = new AnimationMixer(vxr_.Adr);
	actun = vxr_.ABR.clipAction(clip);
	actun.play();
	if (vxr_.ABR) vxr_.ABR.setTime(anm_.ailrgt/anm_.anmfps);
	// Compass
	clip = AnimationClip.findByName(gltf.animations, "compassAction");
	vxr_.Cmp = new AnimationMixer(vxr_.Adr);
	actun = vxr_.Cmp.clipAction(clip);
	actun.play();
	if (vxr_.Cmp) vxr_.Cmp.setTime(air_.AirRot.y/anm_.anmfps);
	// Pilot - Left Arm
	clip = AnimationClip.findByName(gltf.animations,"pilot_armLAction");
	vxr_.ArL = new AnimationMixer(gltf.scene);
	actun = vxr_.ArL.clipAction(clip);
	actun.play();
	if (vxr_.ArL) vxr_.ArL.setTime(anm_.manprs/anm_.anmfps);
	// Pilot - Left Hand
	clip = AnimationClip.findByName(gltf.animations,"pilot_handLAction");
	vxr_.HLT = new AnimationMixer(gltf.scene);
	actun = vxr_.HLT.clipAction(clip);
	actun.play();
	if (vxr_.HLT) vxr_.HLT.setTime(anm_.manprs/anm_.anmfps);
	// Pilot - Right Hand - Pitch
	clip = AnimationClip.findByName(gltf.animations,"pilot_handRPAction");
	vxr_.HRP = new AnimationMixer(gltf.scene);
	actun = vxr_.HRP.clipAction(clip);
	actun.play();
	if (vxr_.HRP) vxr_.HRP.setTime(anm_.stkpit/anm_.anmfps);
	// Pilot - Right Hand - Bank
	clip = AnimationClip.findByName(gltf.animations,"pilot_handRBAction");
	vxr_.HRB = new AnimationMixer(gltf.scene);
	actun = vxr_.HRB.clipAction(clip);
	actun.play();
	if (vxr_.HRB) vxr_.HRB.setTime(anm_.stkbnk/anm_.anmfps);
	// Pilot - Right Arm - Bank
	clip = AnimationClip.findByName(gltf.animations,"pilot_armRAction");
	vxr_.ArR = new AnimationMixer(gltf.scene);
	actun = vxr_.ArR.clipAction(clip);
	actun.play();
	if (vxr_.ArR) vxr_.ArR.setTime(anm_.stkbnk/anm_.anmfps);
	// Pilot - Rudder - Left
	clip = AnimationClip.findByName(gltf.animations,"pilot_rudderLAction");
	vxr_.RdL = new AnimationMixer(gltf.scene);
	actun = vxr_.RdL.clipAction(clip);
	actun.play();
	if (vxr_.RdL) vxr_.RdL.setTime(anm_.yawval/anm_.anmfps);
	// Pilot - Rudder - Right
	clip = AnimationClip.findByName(gltf.animations,"pilot_rudderRAction");
	vxr_.RdR = new AnimationMixer(gltf.scene);
	actun = vxr_.RdR.clipAction(clip);
	actun.play();
	if (vxr_.RdR) vxr_.RdR.setTime(anm_.yawval/anm_.anmfps);
	// Pilot - Leg - Left
	clip = AnimationClip.findByName(gltf.animations,"pilot_legLAction");
	vxr_.LgL = new AnimationMixer(gltf.scene);
	actun = vxr_.LgL.clipAction(clip);
	actun.play();
	if (vxr_.LgL) vxr_.LgL.setTime(anm_.yawval/anm_.anmfps);
	// Pilot - Leg - Right
	clip = AnimationClip.findByName(gltf.animations,"pilot_legRAction");
	vxr_.LgR = new AnimationMixer(gltf.scene);
	actun = vxr_.LgR.clipAction(clip);
	actun.play();
	if (vxr_.LgR) vxr_.LgR.setTime(anm_.yawval/anm_.anmfps);
	// Rudder Bar
	clip = AnimationClip.findByName(gltf.animations,"cockpit_rudderAction");
	vxr_.Bar = new AnimationMixer(gltf.scene);
	actun = vxr_.Bar.clipAction(clip);
	actun.play();
	if (vxr_.Bar) vxr_.Bar.setTime(anm_.yawval/anm_.anmfps);	
	// Pilot - Head
	clip = AnimationClip.findByName(gltf.animations,"pilot_headAction");
	vxr_.Hed = new AnimationMixer(gltf.scene);
	actun = vxr_.Hed.clipAction(clip);
	actun.play();
	if (vxr_.Hed) vxr_.Hed.setTime(anm_.yawval/anm_.anmfps);
}

//= MOVE AIR OBJECT ============//==============================================

function moveAirObj(air_,mxr_,vxr_,anm_,cam_) {
	// Animate -----------------------------------------------------------------
	// Propeller
	let prpspd =  4 * (air_.PwrPct - 0.6);			// Range = -2.4 to + 1.6
	anm_.spnprp = anm_.spnprp - prpspd;
	if (anm_.spnprp < 0) anm_.spnprp = 359;			// A complete circle
	// Rudder
	anm_.rudder = 180 + air_.RotDif.y * 100;
	// Elevator
	anm_.elvatr = 180 - 10*air_.ACPAdj-25;			// estimated adjustment
	if (anm_.elvatr < 150) anm_.elvatr = 150;		// Range = 00 to 60
	else if (anm_.elvatr > 209) anm_.elvatr = 209;
	// Ailerons
	let ailbnk = air_.RotDif.z;
	if (air_.GrFlag) ailbnk = AGBank;
	// Left
	anm_.aillft = 180 + ailbnk * 30;
	if (anm_.aillft < 151) anm_.aillft = 151;		// Range = 00 to 60
	else if (anm_.aillft > 209) anm_.aillft = 209;
	// Right
	anm_.ailrgt = 180 - ailbnk * 30;
	if (anm_.ailrgt < 151) anm_.ailrgt = 151;		// Range = 00 to 60
	else if (anm_.ailrgt > 209) anm_.ailrgt = 209;
	// Animations (Display) -----------------------------------------------------
	if (!cam_.CamFlg) { 		// External View
		// Propeller
		if (mxr_.Prp) mxr_.Prp.setTime(anm_.spnprp/anm_.anmfps);
		// Rudder
		if (mxr_.Rdr) mxr_.Rdr.setTime(anm_.rudder/anm_.anmfps);
		// Elevator
		if (mxr_.Elv) mxr_.Elv.setTime(anm_.elvatr/anm_.anmfps);
		// Ailerons
		// Left
		if (mxr_.ATL) mxr_.ATL.setTime(anm_.aillft/anm_.anmfps);
		if (mxr_.ABL) mxr_.ABL.setTime(anm_.aillft/anm_.anmfps);
		// Rite
		if (mxr_.ATR) mxr_.ATR.setTime(anm_.ailrgt/anm_.anmfps);
		if (mxr_.ABR) mxr_.ABR.setTime(anm_.ailrgt/anm_.anmfps);
	}
	if (cam_.CamFlg) { 		// Internal View
		// Propeller
		if (vxr_.Prp) vxr_.Prp.setTime(anm_.spnprp/anm_.anmfps);
		// Rudder
		if (vxr_.Rdr) vxr_.Rdr.setTime(anm_.rudder/anm_.anmfps);
		// Elevator
		if (vxr_.Elv) vxr_.Elv.setTime(anm_.elvatr/anm_.anmfps);
		// Ailerons
		// Left
		if (vxr_.ATL) vxr_.ATL.setTime(anm_.aillft/anm_.anmfps);
		if (vxr_.ABL) vxr_.ABL.setTime(anm_.aillft/anm_.anmfps);
		// Rite
		if (vxr_.ATR) vxr_.ATR.setTime(anm_.ailrgt/anm_.anmfps);
		if (vxr_.ABR) vxr_.ABR.setTime(anm_.ailrgt/anm_.anmfps);
		// Compass
		if (vxr_.Cmp) vxr_.Cmp.setTime(air_.AirRot.y/anm_.anmfps);
		// Pilot - Left Hand and Arm
		anm_.manprs = air_.PwrPct*359;
		if (vxr_.HLT) vxr_.HLT.setTime(anm_.manprs/anm_.anmfps);
		if (vxr_.ArL) vxr_.ArL.setTime(anm_.manprs/anm_.anmfps);
		// Pilot - Right Hand - Pitch
		anm_.stkpcm = anm_.stkpcm - anm_.stkpit;
		if (anm_.stkpcm > 359) anm_.stkpcm = 359;
		if (anm_.stkpcm < 1) anm_.stkpcm = 1;
		if (anm_.stkpit == 0) anm_.stkpcm = 0.99*(anm_.stkpcm-180)+180;	// recenter if inactive
		if (vxr_.HRP) vxr_.HRP.setTime(anm_.stkpcm/anm_.anmfps);
		// Pilot - Right Hand - Bank
		anm_.stkbcm = anm_.stkbcm + anm_.stkbnk;
		if (anm_.stkbcm > 359) anm_.stkbcm = 359;
		if (anm_.stkbcm < 1) anm_.stkbcm = 1;
		if (anm_.stkbnk == 0) anm_.stkbnk = 0.99*(anm_.stkbcm-180)+180;	// recenter if inactive
		if (vxr_.HRB) vxr_.HRB.setTime(anm_.stkbcm/anm_.anmfps);
		// Pilot - Right Arm - Bank
		if (vxr_.ArR) vxr_.ArR.setTime(anm_.stkbcm/anm_.anmfps);
		// Pilot - Rudder (Push and Pull)
		anm_.yawval = 180;	// Default
		if (air_.RotDif.y) (
			anm_.yawval = air_.RotDif.y;		// Values = +/- 0.1
			anm_.yawval = (179 * anm_.yawval/0.3)+180;
		}
		if (vxr_.RdL) vxr_.RdL.setTime(anm_.yawval/anm_.anmfps);
		if (vxr_.LgL) vxr_.LgL.setTime(anm_.yawval/anm_.anmfps);
		if (vxr_.RdR) vxr_.RdR.setTime(anm_.yawval/anm_.anmfps);
		if (vxr_.LgR) vxr_.LgR.setTime(anm_.yawval/anm_.anmfps);
		if (vxr_.Bar) vxr_.Bar.setTime(anm_.yawval/anm_.anmfps); // Rudder Bar
//		// Pilot - Head
		anm_.vchead = Mod360(cam_.CamLLD.y);
		if (vxr_.Hed) vxr_.Hed.setTime(anm_.vchead/anm_.anmfps);
	}	
}

/*******************************************************************************
*
*	SUBROUTINES
*
*******************************************************************************/

/* Converts degrees to 360 */
function Mod360(deg) {
	while (deg < 0) deg = deg + 360;	// Make deg a positive number
	deg = deg % 360;					// Compute remainder of any number divided by 360
return deg;}

/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {loadAirExt,loadAirInt,moveAirObj};

/*******************************************************************************
*
*	REVISIONS
*
********************************************************************************

250607:	Create
251125:	Add Loaders to gen_

*/

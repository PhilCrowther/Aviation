/********************************************************************************
*
*	ANIM PUP MODULE
*
*********************************************************************************

Copyright 2017-25, Phil Crowther <phil@philcrowther.com>
Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
Version dated 8 Oct 2025

@fileoverview
A three.js class-type module for animating a Sopwith Pup aircraft model
See http://philcrowther.com/Aviation for more details.
*/

/********************************************************************************
*
*	IMPORTS
*
********************************************************************************/

import {
	AnimationClip,
	AnimationMixer
} from 'three';

/********************************************************************************
*
*	VARIABLES
*
********************************************************************************/

//= 1. MAIN VARIABLES ==========//===============================================

//- CONSTANTS ------------------//-----------------------------------------------
let	DLTime = 1/60;				// Delta Time (1/60 seconds)
//-	Conversions
const Ft2Mtr = 0.3048;			// Convert Feet to Meters (exact)
const Mtr2Ft = 1/Ft2Mtr;		// Meters to Feet
const Km2Mil = 0.621371;

/********************************************************************************
*
*	PROGRAM
*
********************************************************************************/

//= LOAD AIR EXTERNAL ===========================================================

//-	Load Airplane Model --------//-----------------------------------------------
function loadAirExt(scene,gltfLoader,air_,mxr_,anm_) {
	gltfLoader.load(mxr_.Src, function (gltf) {				// The OnLoad function
		gltf.scene.traverse(function (child) {	
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
//				child.geometry.computeVertexNormals();		// Better result?  Or remove smoothing?
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

// Load Animations -------------//-----------------------------------------------
function loadAirAnmX(gltf,air_,mxr_,anm_) {		
	/* Animations ---------------------------------------------------------------
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

//= MOVE AIR EXTERNAL ==========//===============================================

function moveAirExt(air_,mxr_,anm_) {
	// Animate ------------------------------------------------------------------
	// Propeller
	let prpspd =  4 * (air_.PwrPct - 0.6);					// Range = -2.4 to + 1.6
	anm_.spnprp = anm_.spnprp - prpspd;
	if (anm_.spnprp < 0) anm_.spnprp = 359;					// A complete circle
	// Rudder
	anm_.rudder = 180 + air_.RotDif.y * 100;
	// Elevator
	anm_.elvatr = 180 - 10*air_.ACPAdj-25;					// estimated adjustment
	if (anm_.elvatr < 150) anm_.elvatr = 150;				// Range = 00 to 60
	else if (anm_.elvatr > 209) anm_.elvatr = 209;
	// Ailerons
	let ailbnk = air_.RotDif.z;
	if (air_.GrFlag) ailbnk = AGBank;
	// Left
	anm_.aillft = 180 + ailbnk * 30;
	if (anm_.aillft < 151) anm_.aillft = 151;				// Range = 00 to 60
	else if (anm_.aillft > 209) anm_.aillft = 209;
	// Right
	anm_.ailrgt = 180 - ailbnk * 30;
	if (anm_.ailrgt < 151) anm_.ailrgt = 151;				// Range = 00 to 60
	else if (anm_.ailrgt > 209) anm_.ailrgt = 209;
	/* Animations (Display) -----------------------------------------------------
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

/********************************************************************************
*
*	EXPORTS
*
********************************************************************************/

export {loadAirExt,moveAirExt};

/********************************************************************************
*
*	REVISIONS
*
********************************************************************************/
/*
 * 250607:	Create
*/

/*
 * AnimFM2.js (vers 24.08.28)
 * Copyright 2022-2024, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * A three.js class-type module for animating a FM2 aircraft model
 * See http://philcrowther.com/Aviation for more details.
 */

//= GRID MAPS ==================================================================

import {
	AnimationClip,
	AnimationMixer
} from 'three';

//= VARIABLES ==================================================================
let	DLTime = 1/60;					// Delta Time (1/60 seconds)
//-	Conversions
var DegRad = Math.PI/180;			// Convert Degrees to Radians
var RadDeg = 180/Math.PI;			// Convert Radians to Degrees
let Mtr2Ft = 3.28084;				// Meters to Feet
let Ft2Mtr = 0.3048;				// Convert Feet to Meters (exact)
let Km2Mil = 0.621371;
let Mil2Km = 1.60934;

//= LOAD =======================================================================

// Load Aircraft Model Animations
function loadACanimX(air_, mxr_,anm_) {
	console.log("2a");
	// Animations --------------------------------------------------------------
	// Propeller
	let clip = AnimationClip.findByName(mxr_.GLT.animations, "propellerAction");
	mxr_.Prp = new AnimationMixer(mxr_.Adr);
	let actun = mxr_.Prp.clipAction(clip);
	actun.play();
	if (mxr_.Prp) mxr_.Prp.setTime(anm_.spnprp/anm_.anmfps);
	// Rudder
	clip = AnimationClip.findByName(mxr_.GLT.animations, "rudderAction");
	mxr_.Rdr = new AnimationMixer(mxr_.Adr);
	actun = mxr_.Rdr.clipAction(clip);
	actun.play();
	if (mxr_.Rdr) mxr_.Rdr.setTime(anm_.rudder/anm_.anmfps);
	// Elevator
	clip = AnimationClip.findByName(mxr_.GLT.animations, "elevatorAction");
	mxr_.Elv = new AnimationMixer(mxr_.Adr);
	actun = mxr_.Elv.clipAction(clip);
	actun.play();
	if (mxr_.Elv) mxr_.Elv.setTime(anm_.elvatr/anm_.anmfps);
	// AileronL
	clip = AnimationClip.findByName(mxr_.GLT.animations, "aileronLAction");
	mxr_.AiL = new AnimationMixer(mxr_.Adr);
	actun = mxr_.AiL .clipAction(clip);
	actun.play();
	if (mxr_.AiL) mxr_.AiL.setTime(anm_.aillft/anm_.anmfps);
	// AileronR
	clip = AnimationClip.findByName(mxr_.GLT.animations, "aileronRAction");
	mxr_.AiR = new AnimationMixer(mxr_.Adr);
	actun = mxr_.AiR.clipAction(clip);
	actun.play();
	if (mxr_.AiR) mxr_.AiR.setTime(anm_.ailrgt/anm_.anmfps);
	// Flap Left
	clip = AnimationClip.findByName(mxr_.GLT.animations, "flapLAction");
	mxr_.FlL = new AnimationMixer(mxr_.Adr);
	actun = mxr_.FlL.clipAction(clip);
	actun.play();
	if (mxr_.FlL) mxr_.FlL.setTime(anm_.flppos/anm_.anmfps);
	// Flap Right
	clip = AnimationClip.findByName(mxr_.GLT.animations, "flapRAction");
	mxr_.FlR = new AnimationMixer(mxr_.Adr);
	actun = mxr_.FlR.clipAction(clip);
	actun.play();
	if (mxr_.FlR) mxr_.FlR.setTime(anm_.flppos/anm_.anmfps);
	// WheelL Hinge
	if (air_.GrdFlg == 0) anm_.lngpos = 180;
	clip = AnimationClip.findByName(mxr_.GLT.animations, "wheel_linkLAction");
	mxr_.WHL = new AnimationMixer(mxr_.Adr);
	actun = mxr_.WHL.clipAction(clip);
	actun.play();
	if (mxr_.WHL) mxr_.WHL.setTime(anm_.lngpos/anm_.anmfps);
	// WheelR Hinge
	clip = AnimationClip.findByName(mxr_.GLT.animations, "wheel_linkRAction");
	mxr_.WHR = new AnimationMixer(mxr_.Adr);
	actun = mxr_.WHR.clipAction(clip);
	actun.play();
	if (mxr_.WHR) mxr_.WHR.setTime(anm_.lngpos/anm_.anmfps);
	// WheelL Strut Low
	clip = AnimationClip.findByName(mxr_.GLT.animations, "wheel_strutLLAction");
	mxr_.WBL = new AnimationMixer(mxr_.Adr);
	actun = mxr_.WBL.clipAction(clip);
	actun.play();
	if (mxr_.WBL) mxr_.WBL.setTime(anm_.lngpos/anm_.anmfps);
	// WheelR Strut Low
	clip = AnimationClip.findByName(mxr_.GLT.animations, "wheel_strutLRAction");
	mxr_.WBR = new AnimationMixer(mxr_.Adr);
	actun = mxr_.WBR.clipAction(clip);
	actun.play();
	if (mxr_.WBR) mxr_.WBR.setTime(anm_.lngpos/anm_.anmfps);
	// WheelL Strut Top
	clip = AnimationClip.findByName(mxr_.GLT.animations, "wheel_strutTLAction");
	mxr_.WTL = new AnimationMixer(mxr_.Adr);
	actun = mxr_.WTL.clipAction(clip);
	actun.play();
	if (mxr_.WTL) mxr_.WTL.setTime(anm_.lngpos/anm_.anmfps);
	// WheelR Strut Top
	clip = AnimationClip.findByName(mxr_.GLT.animations, "wheel_strutTRAction");
	mxr_.WTR = new AnimationMixer(mxr_.Adr);
	actun = mxr_.WTR.clipAction(clip);
	actun.play();
	if (mxr_.WTR) mxr_.WTR.setTime(anm_.lngpos/anm_.anmfps);
	// WheelL Shock
	clip = AnimationClip.findByName(mxr_.GLT.animations, "wheel_shockLAction");
	mxr_.WSL = new AnimationMixer(mxr_.Adr);
	actun = mxr_.WSL.clipAction(clip);
	actun.play();
	if (mxr_.WSL) mxr_.WSL.setTime(anm_.lngpos/anm_.anmfps);
	// WheelR Shock
	clip = AnimationClip.findByName(mxr_.GLT.animations, "wheel_shockRAction");
	mxr_.WSR = new AnimationMixer(mxr_.Adr);
	actun = mxr_.WSR.clipAction(clip);
	actun.play();
	if (mxr_.WSR) mxr_.WSR.setTime(anm_.lngpos/anm_.anmfps);
	// WheelL TopTop
	clip = AnimationClip.findByName(mxr_.GLT.animations, "wheel_toptopLAction");
	mxr_.WUL = new AnimationMixer(mxr_.Adr);
	actun = mxr_.WUL.clipAction(clip);
	actun.play();
	if (mxr_.WUL) mxr_.WUL.setTime(anm_.lngpos/anm_.anmfps);
	// WheelR TopTop
	clip = AnimationClip.findByName(mxr_.GLT.animations, "wheel_toptopRAction");
	mxr_.WUR = new AnimationMixer(mxr_.Adr);
	actun = mxr_.WUR.clipAction(clip);
	actun.play();
	if (mxr_.WUR) mxr_.WUR.setTime(anm_.lngpos/anm_.anmfps);
	// Canopy
	clip = AnimationClip.findByName(mxr_.GLT.animations, "canopyAction");
	mxr_.Cnp = new AnimationMixer(mxr_.Adr);
	actun = mxr_.Cnp.clipAction(clip);
	actun.play();
	if (mxr_.Cnp) mxr_.Cnp.setTime(anm_.canpos/anm_.anmfps);
	// Animation #09 Tailhook
	clip = AnimationClip.findByName(mxr_.GLT.animations, "tailhookAction");
	mxr_.THk = new AnimationMixer(mxr_.Adr);
	actun = mxr_.THk.clipAction(clip);
	actun.play();
	if (mxr_.THk) mxr_.THk.setTime(anm_.thkpos/anm_.anmfps);
}


// Load Aircraft Model Animations
function loadACanimV(vxr_,anm_) {		
	// Load Animations	
	// Animations --------------------------------------------------------------
	// Propeller
	let clip = AnimationClip.findByName(vxr_.GLT.animations, "propellerAction");
	vxr_.Prp = new AnimationMixer(vxr_.Adr);
	let actun = vxr_.Prp.clipAction(clip);
	actun.play();
	if (vxr_.Prp) vxr_.Prp.setTime(anm_.spnprp/anm_.anmfps);
	// AileronL
	clip = AnimationClip.findByName(vxr_.GLT.animations, "aileronLAction");
	vxr_.AiL = new AnimationMixer(vxr_.Adr);
	actun = vxr_.AiL .clipAction(clip);
	actun.play();
	if (vxr_.AiL) vxr_.AiL.setTime(anm_.aillft/anm_.anmfps);
	// AileronR
	clip = AnimationClip.findByName(vxr_.GLT.animations, "aileronRAction");
	vxr_.AiR = new AnimationMixer(vxr_.Adr);
	actun = vxr_.AiR.clipAction(clip);
	actun.play();
	if (vxr_.AiR) vxr_.AiR.setTime(anm_.ailrgt/anm_.anmfps);
	// Canopy
	clip = AnimationClip.findByName(vxr_.GLT.animations, "canopyAction");
	vxr_.Cnp = new AnimationMixer(vxr_.Adr);
	actun = vxr_.Cnp.clipAction(clip);
	actun.play();
	if (vxr_.Cnp) vxr_.Cnp.setTime(anm_.canpos/anm_.anmfps);
	// Gauge - Compass
	clip = AnimationClip.findByName(vxr_.GLT.animations, "gau_compassAction");
	vxr_.GaH = new AnimationMixer(vxr_.Adr);
	actun = vxr_.GaH.clipAction(clip);
	actun.play();
	if (vxr_.GaH) vxr_.GaH.setTime(anm_.cmphdg/anm_.anmfps);
	// Gauge - AI - Arrow
	clip = AnimationClip.findByName(vxr_.GLT.animations, "gau_ai_ptrAction");
	vxr_.GaA = new AnimationMixer(vxr_.Adr);
	actun = vxr_.GaA.clipAction(clip);
	actun.play();
	if (vxr_.GaA) vxr_.GaA.setTime(anm_.atiarr/anm_.anmfps);
	// Gauge - AI - Bank
	clip = AnimationClip.findByName(vxr_.GLT.animations, "gau_ai_bankAction");
	vxr_.GaB = new AnimationMixer(vxr_.Adr);
	actun = vxr_.GaB.clipAction(clip);
	actun.play();
	if (vxr_.GaB) vxr_.GaB.setTime(anm_.atibnk/anm_.anmfps);
	// Gauge - AI - Pitch
	clip = AnimationClip.findByName(vxr_.GLT.animations, "gau_ai_pitchAction");
	vxr_.GaP = new AnimationMixer(vxr_.Adr);
	actun = vxr_.GaP.clipAction(clip);
	actun.play();
	if (vxr_.GaP) vxr_.GaP.setTime(anm_.atipit/anm_.anmfps);	
	// Pointer - Altitude
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pointer_alt0Action");
	vxr_.PtA = new AnimationMixer(vxr_.Adr);
	actun = vxr_.PtA.clipAction(clip);
	actun.play();
	if (vxr_.PtA) vxr_.PtA.setTime(anm_.altft0/anm_.anmfps);
	// Pointer - Altitude X 1000
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pointer_alt1Action");
	vxr_.PtB = new AnimationMixer(vxr_.Adr);
	actun = vxr_.PtB.clipAction(clip);
	actun.play();
	if (vxr_.PtB) vxr_.PtB.setTime(anm_.altft1/anm_.anmfps);
	// Pointer - Speed
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pointer_mphAction");
	vxr_.PtS = new AnimationMixer(vxr_.Adr);
	actun = vxr_.PtS.clipAction(clip);
	actun.play();
	if (vxr_.PtS) vxr_.PtS.setTime(anm_.spdmph/anm_.anmfps);
	// Pointer - Turn Coordinator
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pointer_tcAction");
	vxr_.PtT = new AnimationMixer(vxr_.Adr);
	actun = vxr_.PtT.clipAction(clip);
	actun.play();
	if (vxr_.PtT) vxr_.PtT.setTime(anm_.hdgdif/anm_.anmfps);
	// Pointer - Ball
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pointer_tbAction");
	vxr_.PtC = new AnimationMixer(vxr_.Adr);
	actun = vxr_.PtC.clipAction(clip);
	actun.play();
	if (vxr_.PtC) vxr_.PtC.setTime(anm_.yawval/anm_.anmfps);		
	// Pointer - Vertical Speed
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pointer_vsiAction");
	vxr_.PtV = new AnimationMixer(vxr_.Adr);
	actun = vxr_.PtV.clipAction(clip);
	actun.play();
	if (vxr_.PtV) vxr_.PtV.setTime(anm_.vsifpm/anm_.anmfps);
	// Pointer - Manifold Pressure
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pointer_mpAction");
	vxr_.GaM = new AnimationMixer(vxr_.Adr);
	actun = vxr_.GaM.clipAction(clip);
	actun.play();
	if (vxr_.GaM) vxr_.GaM.setTime(anm_.manprs/anm_.anmfps);
	// Pointer - RPM
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pointer_rpmAction");
	vxr_.PtR = new AnimationMixer(vxr_.Adr);
	actun = vxr_.PtR.clipAction(clip);
	actun.play();
	if (vxr_.PtR) vxr_.PtR.setTime(anm_.rpmprp/anm_.anmfps);
	// Pointer - Compass
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pointer_hdgAction");
	vxr_.PtH = new AnimationMixer(vxr_.Adr);
	actun = vxr_.PtH.clipAction(clip);
	actun.play();
	if (vxr_.PtH) vxr_.PtH.setTime(anm_.cmphdg/anm_.anmfps);
	// Pilot - Left Arm
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pilot_armLAction");
	vxr_.ArL = new AnimationMixer(vxr_.Adr);
	actun = vxr_.ArL.clipAction(clip);
	actun.play();
	if (vxr_.ArL) vxr_.ArL.setTime(anm_.manprs/anm_.anmfps);
	// Pilot - Left Hand
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pilot_handLAction");
	vxr_.HLT = new AnimationMixer(vxr_.Adr);
	actun = vxr_.HLT.clipAction(clip);
	actun.play();
	if (vxr_.HLT) vxr_.HLT.setTime(anm_.manprs/anm_.anmfps);
	// Pilot - Right Hand - Pitch
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pilot_handRPAction");
	vxr_.HRP = new AnimationMixer(vxr_.Adr);
	actun = vxr_.HRP.clipAction(clip);
	actun.play();
	if (vxr_.HRP) vxr_.HRP.setTime(anm_.stkpit/anm_.anmfps);
	// Pilot - Right Hand - Bank
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pilot_handRBAction");
	vxr_.HRB = new AnimationMixer(vxr_.Adr);
	actun = vxr_.HRB.clipAction(clip);
	actun.play();
	if (vxr_.HRB) vxr_.HRB.setTime(anm_.stkbnk/anm_.anmfps);
	// Pilot - Right Arm - Bank
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pilot_armRAction");
	vxr_.ArR = new AnimationMixer(vxr_.Adr);
	actun = vxr_.ArR.clipAction(clip);
	actun.play();
	if (vxr_.ArR) vxr_.ArR.setTime(anm_.stkbnk/anm_.anmfps);
	// Pilot - Rudder - Left
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pilot_rudderLAction");
	vxr_.RdL = new AnimationMixer(vxr_.Adr);
	actun = vxr_.RdL.clipAction(clip);
	actun.play();
	if (vxr_.RdL) vxr_.RdL.setTime(anm_.yawval/anm_.anmfps);
	// Pilot - Rudder - Right
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pilot_rudderRAction");
	vxr_.RdR = new AnimationMixer(vxr_.Adr);
	actun = vxr_.RdR.clipAction(clip);
	actun.play();
	if (vxr_.RdR) vxr_.RdR.setTime(anm_.yawval/anm_.anmfps);
	// Pilot - Leg - Left
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pilot_legLAction");
	vxr_.LgL = new AnimationMixer(vxr_.Adr);
	actun = vxr_.LgL.clipAction(clip);
	actun.play();
	if (vxr_.LgL) vxr_.LgL.setTime(anm_.yawval/anm_.anmfps);
	// Pilot - Leg - Right
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pilot_legRAction");
	vxr_.LgR = new AnimationMixer(vxr_.Adr);
	actun = vxr_.LgR.clipAction(clip);
	actun.play();
	if (vxr_.LgR) vxr_.LgR.setTime(anm_.yawval/anm_.anmfps);
	// Pilot - Head
	clip = AnimationClip.findByName(vxr_.GLT.animations, "pilot_headAction");
	vxr_.Hed = new AnimationMixer(vxr_.Adr);
	actun = vxr_.Hed.clipAction(clip);
	actun.play();
	if (vxr_.Hed) vxr_.Hed.setTime(anm_.yawval/anm_.anmfps);	
}

//= MOVE =======================================================================

// Move Aircraft Model Animations
function moveACanimX(air_,mxr_,anm_) {
	// General
	moveACanimA(air_,anm_);
	// Move Aircraft Model Animations
	// Propeller
	if (mxr_.Prp) mxr_.Prp.setTime(anm_.spnprp/anm_.anmfps);
	// Rudder
	anm_.rudder = 180+air_.RotDif.y*100;
	if (mxr_.Rdr) mxr_.Rdr.setTime(anm_.rudder/anm_.anmfps);
	// Elevator
//	anm_.elvatr = 180 - anm_.stkpit;						// stkpit = mosYdif (too twitchy!)
//	anm_.elvatr = 180 - 75*(1.75*CfLift-TrmAdj)				// only works down
//	anm_.elvatr = 180 - 10 * air_.ACPAdj;					// estimated adjustment
	anm_.elvatr = 180 - 10 * air_.ACPAdj+10;				// estimated adjustment [TEST]
	if (anm_.elvatr < 150) anm_.elvatr = 150;				// Range = 00 to 60
	else if (anm_.elvatr > 209) anm_.elvatr = 209;
	if (mxr_.Elv) mxr_.Elv.setTime(anm_.elvatr/anm_.anmfps);
	// Ailerons
	if (mxr_.AiL) mxr_.AiL.setTime(anm_.aillft/anm_.anmfps);
	if (mxr_.AiR) mxr_.AiR.setTime(anm_.ailrgt/anm_.anmfps);
	// Gear
	if (anm_.lngspd) {
		if (mxr_.WHL) mxr_.WHL.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WHR) mxr_.WHR.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WBL) mxr_.WBL.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WBR) mxr_.WBR.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WTL) mxr_.WTL.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WTR) mxr_.WTR.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WSL) mxr_.WSL.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WSR) mxr_.WSR.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WUL) mxr_.WUL.setTime(anm_.lngpos/anm_.anmfps);
		if (mxr_.WUR) mxr_.WUR.setTime(anm_.lngpos/anm_.anmfps);
	}
	// Flaps
	if (anm_.flpspd) {
		if (mxr_.FlL) mxr_.FlL.setTime(anm_.flppos/anm_.anmfps);
		if (mxr_.FlR) mxr_.FlR.setTime(anm_.flppos/anm_.anmfps);
	}
	// Canopy
	if (anm_.canspd) {
		if (mxr_.Cnp) mxr_.Cnp.setTime(anm_.canpos/anm_.anmfps);
	}
	// Tailhook
	if (anm_.thkspd) {
		if (mxr_.THk) mxr_.THk.setTime(anm_.thkpos/anm_.anmfps);
	}
}

// Move Virtual Cockpit Animations
function moveACanimV(air_,vxr_,anm_,CamRot) {
	// General
	moveACanimA(air_,anm_);
	// Propeller
	if (vxr_.Prp) vxr_.Prp.setTime(anm_.spnprp/anm_.anmfps);
	// Ailerons
	if (vxr_.AiL) vxr_.AiL.setTime(anm_.aillft/anm_.anmfps);
	if (vxr_.AiR) vxr_.AiR.setTime(anm_.ailrgt/anm_.anmfps);
	// Canopy
	if (anm_.canspd) {
		if (vxr_.Cnp) vxr_.Cnp.setTime(anm_.canpos/anm_.anmfps);
	}
	// Gauge - Compass Heading
	anm_.cmphdg = Mod360(air_.AirRot.y);
	if (vxr_.GaH) vxr_.GaH.setTime(anm_.cmphdg/anm_.anmfps);
	// Gauge - AI - Arrow
	anm_.atiarr = -PoM360(air_.AirRot.z);
	if (anm_.atiarr >  90) anm_.atiarr =  90;
	if (anm_.atiarr < -90) anm_.atiarr = -90;
	anm_.atiarr = (179*anm_.atiarr/90)+180;		
	if (vxr_.GaA) vxr_.GaA.setTime(anm_.atiarr/anm_.anmfps);
	// Gauge - AI - Bank
	anm_.atibnk = Mod360(-air_.AirRot.z);
	if (vxr_.GaB) vxr_.GaB.setTime(anm_.atibnk/anm_.anmfps);
	// Gauge - AI - Pitch
	anm_.atipit = air_.AirRot.x + air_.ACPAdj;
	if (anm_.atipit > 45) anm_.atipit = 45;
	if (anm_.atipit < -45) anm_.atipit = -45;
	anm_.atipit = (179*anm_.atipit/45)+180;
	if (vxr_.GaP) vxr_.GaP.setTime(anm_.atipit/anm_.anmfps);
	// Pointer - Altitude
	let altthd = air_.MapSPS.y*Mtr2Ft/1000;					// Round to 1000s
	altthd = Math.trunc(altthd);
	altthd = altthd*1000;
	anm_.altft0 = ((air_.MapSPS.y*Mtr2Ft-altthd)/1000)*360;			// Eliminate 1000s
	if (vxr_.PtA) vxr_.PtA.setTime(anm_.altft0/anm_.anmfps);
	anm_.altft1 = (air_.MapSPS.y*Mtr2Ft/10000)*360;		
	if (vxr_.PtB) vxr_.PtB.setTime(anm_.altft1/anm_.anmfps);
	// Pointer - Speed
	anm_.spdmph = (air_.SpdKPH*Km2Mil/600)*360;
	if (vxr_.PtS) vxr_.PtS.setTime(anm_.spdmph/anm_.anmfps);
	// Pointer - Turn Coordinator
	anm_.hdgdif = PoM360(Mod360(air_.AirRot.y - vxr_.HdO));	// Change in heading +/-
	anm_.hdgdif = anm_.hdgdif / DLTime;						// Change per second
	if (anm_.hdgdif >  9) anm_.hdgdif =  9;					// Std Rate = 3 deg = 10 deg deflation
	if (anm_.hdgdif < -9) anm_.hdgdif = -9;					// Max 9 deg = 30 deg deflection
	anm_.hdgdif = (179 * anm_.hdgdif/9)+180;
	if (vxr_.PtT) vxr_.PtT.setTime(anm_.hdgdif/anm_.anmfps);
	vxr_.HdO = air_.AirRot.y;
	// Pointer - Ball
	anm_.yawval = air_.RotDif.y;								// Values = +/- 0.1
	anm_.yawval = (179 * anm_.yawval/0.3)+180;
	if (vxr_.PtC) vxr_.PtC.setTime(anm_.yawval/anm_.anmfps);
	// Pointer - VSI
	let vsispd = air_.MapSPS.y-vxr_.AlO;						// Change in meters (1/60 sec)
	anm_.vsifpm = 60*vsispd*Mtr2Ft/DLTime;					// e.g .05 fpt = 180 fpm
	if (anm_.vsifpm >  6000) anm_.vsifpm =  6000;
	if (anm_.vsifpm < -6000) anm_.vsifpm = -6000;
	anm_.vsifpm = ((anm_.vsifpm / 6000)*179)+180;			// 180 fpm / 600 fpm max =.3	
	if (vxr_.PtV) vxr_.PtV.setTime(anm_.vsifpm/anm_.anmfps);
	vxr_.AlO = air_.MapSPS.y;
	// Pointer - Manifold Pressure
	anm_.manprs = air_.PwrPct*359;
	if (vxr_.GaM) vxr_.GaM.setTime(anm_.manprs/anm_.anmfps);
	// Pointer - RPM
	anm_.rpmprp = air_.PwrPct*359;
	if (vxr_.PtR) vxr_.PtR.setTime(anm_.rpmprp/anm_.anmfps);
	// Pointer - Compass Heading
	anm_.cmphdg = Mod360(-air_.AirRot.y);
	if (vxr_.PtH) vxr_.PtH.setTime(anm_.cmphdg/anm_.anmfps);
	// Left Hand and Arm
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
	// Pilot - Rudder
	if (vxr_.RdL) vxr_.RdL.setTime(anm_.yawval/anm_.anmfps);
	if (vxr_.RdR) vxr_.RdR.setTime(anm_.yawval/anm_.anmfps);
	if (vxr_.LgL) vxr_.LgL.setTime(anm_.yawval/anm_.anmfps);
	if (vxr_.LgR) vxr_.LgR.setTime(anm_.yawval/anm_.anmfps);
	// Pilot - Head
	anm_.vchead = Mod360(CamRot.y+180);
	if (vxr_.Hed) vxr_.Hed.setTime(anm_.vchead/anm_.anmfps);
}

// Move All Animations
function moveACanimA(air_,anm_) {
	/* Animations ---------------------------------------------------------- */
	// Propeller
	let prpspd =  4*(air_.PwrPct-0.6);						// Range = -2.4 to + 1.6
	anm_.spnprp = anm_.spnprp-prpspd;
	if (anm_.spnprp < 0) anm_.spnprp = 359;					// A complete circle
	// Ailerons
	let ailbnk = air_.RotDif.z;
	if (air_.GrdFlg) ailbnk = air_.AGBank;
	// Left
	anm_.aillft = 180+ailbnk*30;
	if (anm_.aillft < 151) anm_.aillft = 151;				// Range = 00 to 60
	else if (anm_.aillft > 209) anm_.aillft = 209;
	// Right
	anm_.ailrgt = 180-ailbnk*30;
	if (anm_.ailrgt < 151) anm_.ailrgt = 151;				// Range = 00 to 60
	else if (anm_.ailrgt > 209) anm_.ailrgt = 209;
	// Gear
	if (anm_.lngflg > 0  && air_.GrdFlg == 0) {				// only if key pressed while in air
		anm_.lngflg = 0;									// one read per keypress only
		if (anm_.lngspd) anm_.lngspd = -anm_.lngspd;		// if already in motion
		if (anm_.lngpos == 0) anm_.lngspd = 0.4;			// if full down
		if (anm_.lngpos == 180) anm_.lngspd = -0.4;			// if full up
	}
	if (anm_.lngspd) {
		anm_.lngpos = anm_.lngpos + anm_.lngspd;
		if (anm_.lngpos > 180) {
			anm_.lngspd = 0;
			anm_.lngpos = 180;
		}
		if (anm_.lngpos < 0) {
			anm_.lngspd = 0;
			anm_.lngpos = 0;
		}	
	}
	// Flaps
	if (anm_.flpflg) {
		anm_.flpflg = 0;									// one read per keypress only
		if (anm_.flpspd) anm_.flpspd = -anm_.flpspd;		// if already in motion
		if (anm_.flppos == 0) anm_.flpspd = 1;				// if full down
		if (anm_.flppos == 180) anm_.flpspd = -1;			// if full up
	}
	if (anm_.flpspd) {
		anm_.flppos = anm_.flppos + anm_.flpspd;
		if (anm_.flppos > 180) {
			anm_.flpspd = 0;
			anm_.flppos = 180;
		}
		if (anm_.flppos < 0) {
			anm_.flpspd = 0;
			anm_.flppos = 0;
		}
	}
	air_.FlpPct = 1 - (anm_.flppos/180);
	air_.LngPct = 1 - (anm_.lngpos/180);
	// Canopy
	if (anm_.canflg) {
		anm_.canflg = 0;									// one read per keypress only
		if (anm_.canspd) anm_.canspd = -anm_.canspd;		// if already in motion
		if (anm_.canpos == 0) anm_.canspd = 1;				// if full down
		if (anm_.canpos == 180) anm_.canspd = -1;			// if full up
	}
	if (anm_.canspd) {
		anm_.canpos = anm_.canpos + anm_.canspd;
		if (anm_.canpos > 180) {
			anm_.canspd = 0;
			anm_.canpos = 180;
		}
		if (anm_.canpos < 0) {
			anm_.canspd = 0;
			anm_.canpos = 0;
		}
	}
	// Tailhook
	if (anm_.thkflg) {
		anm_.thkflg = 0;									// one read per keypress only
		if (anm_.thkspd) anm_.thkspd = -anm_.thkspd;		// if already in motion
		if (anm_.thkpos == 0) anm_.thkspd = 1;				// if full down
		if (anm_.thkpos == 180) anm_.thkspd = -1;			// if full up
	}
	if (anm_.thkspd) {
		anm_.thkpos = anm_.thkpos + anm_.thkspd;
		if (anm_.thkpos > 180) {
			anm_.thkspd = 0;
			anm_.thkpos = 180;
		}
		if (anm_.thkpos < 0) {
			anm_.thkspd = 0;
			anm_.thkpos = 0;
		}
	}
}

//= EXTRA ======================================================================

/* Converts degrees to 360 */
function Mod360(deg) {
	while (deg < 0) deg = deg + 360;	// Make deg a positive number
	deg = deg % 360;					// Compute remainder of any number divided by 360
return deg;}

/* Converts 360 degrees to +/- 180 */
function PoM360(deg) {
	if (deg > 180) deg = deg - 360;
return deg;}

export {loadACanimX, loadACanimV, moveACanimX, moveACanimV};

/*= REVISIONS ==================================================================
 * 240420:	Converted to SI units
 * 240424:	Changed all air_ variables to 8 character names
*/

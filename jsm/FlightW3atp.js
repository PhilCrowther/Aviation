/*
 * Flight.js
 * Version 3 (vers 24.04.24)
 * Copyright 2017-24, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * A three.js class-type module for Flight Simulation
 * See http://philcrowther.com/Aviation for more details.
*/

import {
	Object3D,
	Quaternion,
	Vector3,
	BoxGeometry,
	MeshBasicMaterial,
	Mesh,
} from 'three';

//= INTERNAL VARIABLES =========================================================
//	Standard Conversions
var DegRad = Math.PI/180;	// Convert Degrees to Radians
var RadDeg = 180/Math.PI;	// Convert Radians to Degrees
//- Constants
let quaternion = new Quaternion();
let SmallV = .0001;			// Small value added to prevent errors
let	ACDrGF = 0.08;			// Rolling Drag s/b firm turf (.02 concrete, .06 soft turf)
//- Computed Constants (Vary by Aircraft)
let	WingAs = 0;				// Wing Aspect Ratio
let FrcAcc = 0;				// Convert Force to Acceleration
let ThrstK = 0;				// Thrust Constant
// Flags
let AuFlag = 0;				// Flag for Auto Tail Up/Down

//= AIRPLANE DATA ==============================================================

//- FM2 ------------------------------------------------------------------------
let typ0_ = {
		// Lift
		WingSp: 11.58,		// Wing Span (m)
		WingAr: 24.15,		// Wing Area (m2)
		WingEf: 0.75,		// Wing Efficiency
		AngInc: 5,			// Angle of Incidence
		GrvMax: 8,			// Maximum G-Force
		TrmAdj: 2.5,		// Elevator Trim Adjustment (### - not used)
		// Gravity
		ACMass: 3400,		// Aircraft Mass (kg)
		// Thrust: Prop
		PwrMax: 1007,		// Prop Maximum Power (kW)
		PropEf: 0.8,		// Prop Efficiency
		WEPMax: 0,			// War Emergency Power (kW)
		// Thrust: Jet
		JetMax: 0,			// Jet Maximum Thrust (kW)
		AftMax: 0,			// Jet Afterburner Maximum Thrust (kW)
		// Drag
		DrgCd0: 0.0211,		// Coefficient of Drag
		// Taildragger Geometry and Speed
		Ax2CGD: 1.6667,		// Axle to CG distance (m)
		Ax2CGA: 330,		// Axle to CG angle (deg)
		WheelR: 0.3048,		// Wheel radius (m)
		TDrAng: 11,			// Taildragger Max Angle (deg)
		TDrSpd: 11.176,		// Speed at which tail lifts (25 mph = 11.18 m/s)
		// Optional: Flaps
		FlpCfL: 0.28,		// Max Flap Cfl (0.2*CfLMax) (shared with main program)
		DrgCdf: 0.01,		// Coefficient of Drag - Flaps
		FlpAIn: 10,			// Max Flap Angle of Incidence (2*AngInc)
		// Optional: Landing Gear Retractable
		DrgCdg: 0.005,		// Coefficient of Drag - Gear
		// Optional: Spoiler
		SplCfL: 0,			// Max Spoiler CfL (### - not used)
		DrgCds: 0,			// Coefficient of Drag - Spoiler
		// Optional: Airbrake	
		DrgCdb: 0,			// Coefficient of Drag - Airbrake
		// Controls (shared with air_. and main program)
		PYBmul: new Vector3(0.004,1.0,0.001),	// Basic airplane values
		CfLMax: 1.4,		// Maximum Coefficient of Lift
		BnkMax: 1,			// Maximum bank rate	
	}
let idx = [typ0_];
let typ_ = 0;

//= INITIALIZE VALUES ==========================================================

//  Initialize Rotation and Vectors*/
let Flight = function (air_) {				// Only works with Air0 now
	// Basic Flight Data (SI Adjustments)
	typ_ = idx[air_.AirIDN];				// Get Aircraft Type
	// Transfer Fixed Values air_ to typ_
	air_.ACMass = typ_.ACMass;
	air_.Weight = air_.ACMass*air_.GrvMPS;
	air_.FlpCfL = typ_.FlpCfL;
	air_.PYBmul.copy(typ_.PYBmul);
	air_.CfLMax = typ_.CfLMax;
	air_.BnkMax = typ_.BnkMax;
	// Comps
	let DLTim2 = air_.DLTime*air_.DLTime;
	let GrvDLT = air_.GrvMPS*DLTim2;
	FrcAcc = DLTim2/air_.ACMass;			// Convert Force to Acceleration
	// Orientation
	air_.AirObj.rotation.z = Mod360(360-air_.AirRot.z)*DegRad; // Bank
	air_.AirObj.rotation.x = Mod360(air_.AirRot.x)*DegRad;	// Pitch
	air_.AirObj.rotation.y = Mod360(-air_.AirRot.y)*DegRad;	// Heading
	// Constants
	if (typ_.JetMax == 0) ThrstK = 1000*typ_.PropEf;	// (SI units)
	WingAs = typ_.WingSp*typ_.WingSp/typ_.WingAr;		// Wing Aspect Ratio
	let ACPMax = air_.CfLMax*10;			// Max aircraft pitch adjustment (+/- 15)
	let ACPInc = ACPMax-typ_.AngInc;		// Net max aircraft pitch adjustment (10)
	// Speed
	if (air_.SpdKPH <= 0) air_.SpdKPH = SmallV;	// Avoid division by zero 211031
	air_.SpdMPS = air_.SpdKPH*1000/3600 ;		// (MPS)
	air_.SpdMPF = air_.SpdMPS*air_.DLTime;	// Aircraft Speed (DLT)
	// DynPres
	let DynPrs = (air_.SpdMPS*air_.SpdMPS)*air_.AirDSL/2;	// Dynamic Pressure	
	// If Starting on Ground
	if (air_.GrdFlg) {
		air_.CfLift = 0.1*typ_.AngInc;		// Level lift
		air_.PwrPct = 0;
		if (typ_.TDrAng) air_.ACPAdj = typ_.TDrAng;	// Taildragger
		let XRad = DegRad*Mod360(typ_.Ax2CGA-air_.ACPAdj);
		air_.MapPos.y = typ_.Ax2CGD*Math.cos(XRad)+typ_.WheelR+air_.GrdZed;	// Set Height
	}
	// Compute Vectors
	/* If Starting in Flight, Compute Starting air_.CfLift and Power for Level Flight and Given Bank */
	if (air_.GrdFlg == 0) {
		// Coefficient of Lift for Level Flight
		air_.CfLift = air_.Weight/(DynPrs*typ_.WingAr*Math.cos(air_.AirRot.z*DegRad));
		if (air_.CfLift > air_.CfLMax) air_.CfLift = air_.CfLMax;
		// Power Setting for Level Flight
		let QSTval = DynPrs*typ_.WingAr;
		let CfLftT = air_.CfLift+air_.CfFlap;
		let ACLftF =  CfLftT*QSTval;		// Lift[ft-lbs] - can be positive or negative
		// Thrust (Default = Prop)
		let EnThrF = ThrstK*(typ_.PwrMax*air_.PwrPct+typ_.WEPMax*air_.SupPct)/air_.SpdMPS;
		if (air_.SpdMPS < 4.572) {			// Set Cap on Initial Thrust
			EnThrF = ThrstK*(typ_.PwrMax*air_.PwrPct+typ_.WEPMax*air_.SupPct)/4.572;
		}
		if (typ_.JetMax) EnThrF = typ_.JetMax*air_.PwrPct+typ_.AftMax*air_.SupPct;	// Jet
		// Drag
		let DrgCdi = (CfLftT*CfLftT)/(WingAs*typ_.WingEf*Math.PI);	// Cfi = CLift^2/(Wing Aspect Ratio*Wing Efficiency*pi)
		let ACDrIF = DrgCdi*QSTval;			// Induced Drag = ACLftF^2/(DynPrs*WingSp^2*typ_.WingEf*PI)
		let CfDF = air_.FlpPct*typ_.DrgCdf;	// Coefficient of Parasitic Drag - Flaps
		let CfDG = air_.LngPct*typ_.DrgCdg;	// Coefficient of Parasitic Drag - Landing Gear
		let CfDB = air_.BrkPct*typ_.DrgCdb;	// Coefficient of Parasitic Drag - Air Brake
		let CfDS = air_.SplPct*typ_.DrgCds;	// Coefficient of Parasitic Drag - Spoiler
		let DrgCdp = typ_.DrgCd0+CfDF+CfDG+CfDB+CfDS;	// Total Coefficient of Parasitic Drag
		let ACDrPF = DrgCdp*QSTval;			// Parasitic Drag =  Cd0*DynPres*WingA
		// Power
		air_.PwrPct = (ACDrPF+ACDrIF)/(EnThrF*typ_.PwrMax);
		if (air_.PwrPct > 1) air_.PwrPct = 1;
	}
	Flight.update(air_);
};

//= CHANGE VALUES ==============================================================

Flight.update = function (air_) {
	// 1. COMPUTE VECTORS ------------------------------------------------------
	// Inputs: air_.SpdMPS, air_.GrvMPS
	// Comps
	let DLTim2 = air_.DLTime*air_.DLTime;
	let GrvDLT = air_.GrvMPS*DLTim2;
	FrcAcc = DLTim2/air_.ACMass;			// Convert Force to Acceleration
	air_.SpdMPF = air_.SpdMPS*air_.DLTime;
	// Compute Dynamic Pressure
	let DynPrs = (air_.SpdMPS*air_.SpdMPS)*air_.AirDSL/2;	// Dynamic Pressure
	let ACPrad = air_.AirRot.x*DegRad;
	let QSTval = DynPrs*typ_.WingAr;
	// Compute Max Lift
	let LftMax = typ_.GrvMax*GrvDLT;		// Maximum G-accel
	LftMax = (LftMax + typ_.GrvMax)*GrvDLT;	// ### ATP
	// Compute Max Bank (### ATP)
	let GrvMaxF = typ_.GrvMax*typ_.Weight;	// Max G-Force 
	let LftMaxF = typ_.CfLMax*DynPrs*typ_.WingAr;	// Max Lift at this Speed
	if (LftMaxF > GrvMaxF) LftMaxF = GrvMaxF;	// Limit Max Lift to Max G-Force
	air_.MaxBnk = Math.acos(typ_.Weight/LftMaxF)*RadDeg;	// Max Bank Angle for Max Lift
	// a. COMPUTE LIFT ROTATION ................................................
	// Lift = DynPres*typ_.WingArea*Cl
	let CfLftT = air_.CfLift+air_.CfFlap;
//	if (air_.AutoOn) {	// ### ATP
//		let LftReq = Math.abs(Math.cos(air_.AirObj.rotation.x)*typ_.Weight);
//		air_.CfLift = LftReq/(DynPrs*typ_.WingAr*Math.abs(Math.cos(air_.AirObj.rotation.z)));
//		air_.CfLftT = air_.CfLift + air_.CfLDif;
//	}
	let ACLftF =  CfLftT*QSTval;			// Lift[ft-lbs] - can be positive or negative
	let ACLift = ACLftF*FrcAcc;				// Acceleration (DLT)
	if (ACLift > 0 && ACLift > LftMax) ACLift = LftMax;	// Limit to Max Gs (pos)
	if (ACLift < 0 && ACLift < -LftMax) ACLift = -LftMax;	// Limit to Max Gs (neg)
	let ACLftD = (ACLift/air_.SpdMPF)*RadDeg;	// Degrees = ACLift*180/(PI()*V) = (ACLift/V)*RadDeg
	// Compute air_.RotDif.x
	air_.RotDif.x = ACLftD;					// Pitch Degrees (before Gravity)
	// b. COMPUTE GRAVITY CHANGES ..............................................
	let GrvThr = GrvDLT*Math.sin(air_.AirObj.rotation.x);	// Gravity opposing Thrust = Grav * sin(ACPrad)
	let GrvACP = GrvDLT*Math.cos(air_.AirObj.rotation.x);	// Vertical Gravity
	let GrvACD = (GrvACP/air_.SpdMPF)*RadDeg;	// Degrees = (GrvACP/V)*(180/(PI()) = (GrvACP/V)*RadDeg
	// c. COMPUTE NET THRUST ACCELERATION ......................................
	// Thrust (Default = Prop)
	let EnThrF = ThrstK*(typ_.PwrMax*air_.PwrPct+typ_.WEPMax*air_.SupPct)/air_.SpdMPS;
	if (air_.SpdMPS < 4.572) {				// Set Cap on Initial Thrust
		EnThrF = ThrstK*(typ_.PwrMax*air_.PwrPct+typ_.WEPMax*air_.SupPct)/4.572;
	}
	if (typ_.JetMax) EnThrF = typ_.JetMax*air_.PwrPct+typ_.AftMax*air_.SupPct;	// Jet
	// Drag
	let DrgCdi = (CfLftT*CfLftT)/(WingAs*typ_.WingEf*Math.PI);	// Cfi = CLift^2/(Wing Aspect Ratio*Wing Efficiency*pi)
	let ACDrIF = DrgCdi*QSTval;					// Induced Drag = ACLftF^2/(DynPrs*WingSp^2*typ_.WingEf*PI)
	let CfDF = air_.FlpPct*typ_.DrgCdf;		// Coefficient of Parasitic Drag - Flaps
	let CfDG = air_.LngPct*typ_.DrgCdg;		// Coefficient of Parasitic Drag - Landing Gear
	let CfDB = air_.BrkPct*typ_.DrgCdb;		// Coefficient of Parasitic Drag - Air Brake
	let CfDS = air_.SplPct*typ_.DrgCds;		// Coefficient of Parasitic Drag - Spoiler
	let DrgCdp = typ_.DrgCd0+CfDF+CfDG+CfDB+CfDS;	// Total Coefficient of Parasitic Drag
	let ACDrPF = DrgCdp*QSTval;					// Parasitic Drag =  Cd0*DynPres*WingA
	let ACDrRF = 0;								// Rolling Friction (default)
	if (air_.GrdFlg) ACDrRF = air_.ACMass*air_.GrvMPS*ACDrGF;	// Rolling Friction on Ground
	// Net
	let ACThrF = EnThrF-ACDrPF-ACDrIF-ACDrRF;	// Net Thrust Force
	let ACTrst = ACThrF*FrcAcc;				// Net Thrust Accel
	let ACThrG = ACTrst-GrvThr;					// Net Thrust after Gravity +/-
	// GrdFlg
	if (air_.GrdFlg) {
		// Leaving ground if positive lift
		if (ACLftD > GrvACD) air_.GrdFlg = 0;	// If going to leave ground
		// If Still on Ground
		else {								// if staying in ground mode, override computations
			// Thrust
			ACThrG = ACThrG-air_.BrkVal;	// Reduce thrust by brakes (if any)
			if (air_.MovFlg>0 && ACThrG<0) ACThrG = 0;	// If Stopped on Moving Object, Brakes won't pull us backwards
			// Rotation
//	temp	air_.AGBank = air_.AGBank+air_.InM.x*air_.PBYmul.z;	// Aileron bank
//	temp	air_.AGBank = MaxVal(air_.AGBank,air_.BnkMax);		// Max values	
			air_.RotDif.z = -air_.AirRot.z;		// Wheels on ground
			air_.RotDif.x = -air_.AirRot.x;		// Direction of flight = 0
			GrvACD = 0;						// No pitch down due to gravity
		}
	}	
	// Compute Aircraft Pitch Adjustment
	// air_.ACPAdj is an adjustment to ACPtch that allows the aircraft to pitch relative to the direction of flight
	// to match pitch required to produce specified lift; or, if on ground, to pitch around main wheel axis
	air_.ACPAdj = (air_.CfLift*10)-typ_.AngInc;				// Default (1.3 = 13)
	// Override if on Ground
	if (air_.GrdFlg) {
		// If Taildragger
		if (typ_.TDrAng) {
			// If Starting/Restarting
			if (air_.SpdKPH < 1 || air_.MovFlg > 0) {
				AuFlag = 1;					// Accelerating
				air_.ACPAdj = typ_.TDrAng;	// Full Pitch
			}
			// If Decelerating Through MinSpd
			if (air_.SpdKPH < typ_.TDrSpd && AuFlag == 0) {
				AuFlag = 2;					// Decelerating
			}
			// If Decelerating then Accelerating
			if (AuFlag == 2 && ACThrG > 0) {
				AuFlag = 1;					// Accelerating
			}
			// Either Way
			if (air_.SpdKPH < typ_.TDrSpd) {
			// air_.CfLift is irrelevant at low speeds.
			// At 0, air_.ACPAdj = typ_.TDrAng; At MinSpd, air_.ACPAdj = 0
			// At MinSpd set air_.CfLift so that air_.ACPAdj = 0.
				air_.ACPAdj = typ_.TDrAng-(typ_.TDrAng*air_.SpdKPH/typ_.TDrSpd);
			}
			// If Accelerate Through MinSpd then AuFlag = 0
			if ((air_.SpdKPH >= typ_.TDrSpd) && AuFlag > 0) {	//211031
				AuFlag = 0;
				air_.CfLift = (typ_.AngInc+air_.FlpPct*typ_.FlpAIn)/10;
			}
		}
	}
	// 2. COMPUTE DIRECTION OF FLIGHT ------------------------------------------
	// Inputs: air_.RotDif
	// Instead of computing rotations and then rotating aircraft using Napier formulae,
	// this routine uses 2 linked objects to correctly rotate aircraft, which automatically
	// performs the math calculations for you.
	//
	// Rotate Aircraft (Heading Not Change)
	// Changes to AirPBY
	air_.AirPBY.rotation.z = -air_.RotDif.z*DegRad;	// Change in Bank (due to user imput)
	air_.AirPBY.rotation.x = air_.RotDif.x*DegRad;	// Change in Pitch (due to change in Lift due to user input)
	air_.AirPBY.rotation.y = -air_.RotDif.y*DegRad;	// Change in Yaw (due to user input)
	// Transfer Combined Rotation to AirAxe
	air_.AirPBY.getWorldQuaternion(quaternion);
	air_.AirObj.setRotationFromQuaternion(quaternion);
	// Zero Out AirPBY Rotations (so display has correct values)
	air_.AirPBY.rotation.z = 0;
	air_.AirPBY.rotation.x = air_.ACPAdj*DegRad;	// Make Pitch Adjustment here [220120 change]
	air_.AirPBY.rotation.y = 0;
	// Pitch -------------------------------------------------------------------
	air_.AirRot.x = PoM360(air_.AirObj.rotation.x*RadDeg);
	// Heading -----------------------------------------------------------------
	air_.AirRot.y = Mod360(-air_.AirObj.rotation.y*RadDeg);
	air_.HdgDif = (air_.AirRot.y-air_.OldRot.y)/air_.DLTime;	// Change in Heading (display)
	air_.OldRot.y = air_.AirRot.y;					// Save old heading	
	// Bank --------------------------------------------------------------------
	// ### ATP
//	if (air_.AutoOn && air_.InpKey.z == 0) {
		// Keep Same Bank
//		air_.AirObj.rotation.z = air_.OldRot.z;
		// Self-Center .........................................................
//		if (air_.AirRot.z > 0 && air_.AirRot.z < 2) air_.OldRot.z = 0.000001*air_.AirRot.z*DegRad;
//		if (air_.AirRot.z < 360 && air_.AirRot.z > (360-2)) air_.OldRot.z = -0.000001*(360-air_.AirRot.z)*DegRad;
//	}
//	else {air_.OldRot.z = air_.AirObj.rotation.z;}
	//
	air_.AirRot.z = Mod360(-air_.AirObj.rotation.z*RadDeg);
	// Limit to Max Bank (### ATP) .............................................
//	if (air_.AutoOn && (air_.AirRot.z > 270 || air_.AirRot.z < 90)) {	// Only if Flag Set and Not Upside Down
//		let ACBnew = air_.AirRot.z;	// 270 to 90
//		if (ACBnew > 180) ACBnew = ACBnew-360;	// -90 to 90
//		if (ACBnew >  air_.MaxBnk) ACBnew = air_.MaxBnk;	// Limit Pos Bank
//		if (ACBnew < -air_.MaxBnk) ACBnew = -air_.MaxBnk;	// Limit Neg Bank
//		air_.AirRot.z = Mod360(ACBnew+360); 		// 270 to 90
//		air_.AirObj.rotation.z = -air_.AirRot.z*DegRad;
//	}	
	// 3. COMPUTE MAP SPEED ----------------------------------------------------
	// Inputs:	air_.SpdMPF, ACThrG, ACPtch, ACHead, air_.MapPos
	// Results:	air_.SpdKPH, PSpdZV, PSpdYV, ACPtch, air_.MapSpd, air_.MapPos
	// a. Compute Speed
	air_.SpdMPF = air_.SpdMPF+ACThrG;
	if (air_.SpdMPF <= 0) air_.SpdMPF = 0.0001;	// Set Minimum Speed to avoid division by zero  211031
	air_.SpdKPH = air_.SpdMPF*3600/(1000*air_.DLTime);	// (KPH)
	air_.SpdMPS = air_.SpdKPH*1000/3600 ;	// (MPS)
	// b1. Compute PSpd (before gravity)
	ACPrad = air_.AirRot.x*DegRad;
	let PSpdZV = air_.SpdMPF*Math.abs(Math.cos(ACPrad));
	// b2. Adjust ACP for Gravity
	air_.AirRot.x = air_.AirRot.x-GrvACD;
	if (air_.AirRot.x < -90) air_.AirRot.x = -90;	// Prevents you from pitching back up
	ACPrad = air_.AirRot.x*DegRad;
	air_.AirObj.rotation.x = ACPrad;
	let PSpdYV = air_.SpdMPF*Math.sin(ACPrad);	// Vertical speed	
	// c. Compute Map Speed
	let ACH = air_.AirRot.y*DegRad;
	air_.MapSpd.z = PSpdZV*Math.cos(ACH);
	air_.MapSpd.y = PSpdYV;
	air_.MapSpd.x = PSpdZV*Math.sin(ACH);
	// d. Compute Map Position
	air_.MapPos.z = air_.MapPos.z+air_.MapSpd.z;
	air_.MapPos.y = air_.MapPos.y+air_.MapSpd.y;
	air_.MapPos.x = air_.MapPos.x+air_.MapSpd.x;
	// If On Ground, Set Height
	if (air_.GrdFlg) {
		let XRad = DegRad*Mod360(typ_.Ax2CGA-air_.ACPAdj);
		air_.MapPos.y = typ_.Ax2CGD*Math.cos(XRad)+typ_.WheelR+air_.GrdZed;
	}
	// If Hit Ground, Limit Descent and Compute ACPAng and Height
	if (air_.GrdFlg == 0 && air_.MapPos.y < air_.GrdZed+10) {	// If close to ground, check ...
		let ACP = Mod360(air_.AirRot.x+air_.ACPAdj);	// air_.ACPAdj relative to ground
		ACPrad = DegRad*Mod360(typ_.Ax2CGA-ACP); 	// Use ACP
		let Flor = typ_.Ax2CGD*Math.cos(ACPrad)+typ_.WheelR+air_.GrdZed;
		if (air_.MapPos.y <= Flor) {
			air_.GrdFlg = 1;			// Set Flag
			air_.MapPos.y = Flor;		// Set Height
			air_.CfLift = air_.CfLift+0.1*air_.AirRot.x;	// Set air_.CfLift
		}
	}
	// Store XS, YP, ZS
	air_.MapSPS.x = air_.MapSpd.x;
	air_.MapSPS.y = air_.MapPos.y;
	air_.MapSPS.z = air_.MapSpd.z;
};

//= MISCELLANOUS SUBROUTINES ===================================================

//- Geometric Conversions ------------------------------------------------------

//  Converts degrees to 360
function Mod360(deg) {
	while (deg < 0) deg = deg+360;			// Make deg a positive number
	deg = deg % 360;						// Compute remainder of any number divided by 360
return deg;}

//  Converts 360 degrees to +/- 180
function PoM360(deg) {
	if (deg > 180) deg = deg-360;
return deg;}

//- Min Max --------------------------------------------------------------------

//- Limit Maximum +/- Value
function MaxVal(x, max) {
	if (x > 0 && x >  max) x =  max;
	if (x < 0 && x < -max) x = -max;
return x;}

//- Rotate Vector --------------------------------------------------------------
//	Input: vector3: LLD.x = lat; LLD.y = lon; LLD.z = dst
//  Exput: vector3: position(xyz)

function rotLLD(LLD) {
	let lat = LLD.x*DegRad;
	let lon = LLD.y*DegRad;
	// Latitude
	LLD.y = LLD.z * Math.sin(lat);
	LLD.z = LLD.z * Math.cos(lat);
	// Longitude
	LLD.x = LLD.z * Math.sin(lon);
	LLD.z = LLD.z * Math.cos(lon);
	return LLD;
}

//- Make Mesh ------------------------------------------------------------------
function makMsh() {
	let geometry = new BoxGeometry(0.01,0.01,0.01); 
	let material = new MeshBasicMaterial({transparent:true,opacity:0}); 
	let mesh = new Mesh(geometry, material);
return mesh;}

export {Flight, Mod360, PoM360, MaxVal, rotLLD, makMsh};

/*= REVISIONS ==================================================================
 * 211216:	This new EZ version uses three.js rotations to compute orientation.
 * 			Added standard linked objects AirAxe and AirPBY
 * 220120:	Changed air_.ACPAdj from animation to object adjustment
 * 220226:	Fixed taildragger adjustment so that smooth transition
 * 230325:  Added RoteV3 which uses and returns Vector3 value
 * 230708:  Eliminated unised subroutines: Err360, MinVal, MinMax, ZerMax
 * 23____:	Added Aircraft Data
 * 240219:	Change air_.Axe to air_.Obj
 * 240304:  Added rotLLD and makMsh
 * 240310:  Deleted "shared" variables
 * 240420:	Converted to SI units
 * 240424:	Changed all air_ variables to 8 character names
*/
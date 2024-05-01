/*
 * ACflyt_mod2.js (vers 22.11.15)
 * Copyright 2017-22, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

// This file is a module which contains the functions InitFlyt() and RoteFlyt()
// ACflyt_mod is a modele
// ACflyt_mod2 changes name of subroutine from rote3dFlyt to move3dFlyt
// ToDo: init3dFlyt should include only assignment of variables

/*
 * @fileoverview
 * The ACflyt files contain the variables and functions for simulating 3D flight.
 * There are two files: ACflytGlobal.js and the modeule ACflytEZ.js.
 * ACflytGlobal contains the global variables used by ACflytEZ.js.
 * ACflytEZ is a module and contains the routines for simulating 3D flight.
 * These include the routines for rotating and moving the aircraft object.
 * ACflytEZ computes both the direction of flight and the aircraft orientation.
 * ACflytEZ moves the aircraft taking into account thrust, lift, drag and gravity.
 * Thrust, drag and a portion of gravity act along the direction of flight.
 * Lift and the remaining gravity are deflectors which change the direction of flight.
 * See http://philcrowther.com/Aviation/ACflyt.htm for more details.
 */

import {
	Object3D,
	Quaternion,
	Vector3
//} from '../build/three.module.js';
} from 'three';

/* = AIRCRAFT OBJECTS ========================================================*/
// We originally computed aircraft rotation using the napier formulae. 
// However, we discoved that we would use linked objects to perform these computations.

// Aircraft Mount
let AirAxe = new Object3D();
	AirAxe.rotation.order = "YXZ";
// Aircraft
let AirPBY = new Object3D();
	AirPBY.rotation.order = "YXZ";
	AirAxe.add(AirPBY);
//
let quaternion = new Quaternion();
let V3temp = new Vector3();

/* = INITIALIZE VALUES =======================================================*/

/* Initialize Rotation and Vectors*/
function init3dFlyt() {
	// Orientation
	ACBank = BegBnk;
	ACPtch = BegPit;
	ACHead = BegHdg;
	AirAxe.rotation.z = Mod360(360 - ACBank) * DegRad;	// Bank
	AirAxe.rotation.x = Mod360(ACPtch) * DegRad;	// Pitch
	AirAxe.rotation.y = Mod360(-ACHead) * DegRad;	// Heading
	// Constants
	if (JetMax == 0) {
		ThrstK = 550 * PropEf;			// Thrust (US units)
		if (USorSI == "SI") ThrstK = 1000 * PwrMax * PropEf;	// (SI units)
	}
	ACMass = Weight / GrvUPS;			// Mass (slugs or kg)
	WingAs = WingSp*WingSp/WingAr;		// Wing Aspect Ratio
	ACPMax = CfLMax * 10;				// Max aircraft pitch adjustment (+/- 15)
	ACPInc = ACPMax - AngInc;			// Net max aircraft pitch adjustment (10)
	TDrAdj = TDrAng - ACPInc;			// Pitch change required for taildragger (7.5)
	// Time
	DLTim2 = DLTime * DLTime;
	GrvDLT = GrvUPS * DLTim2;			// Gravity (upt)
	FrcAcc = DLTim2 / ACMass;			// Convert Force to Acceleration
	// Speed
	if (SpdUPH <= 0) SpdUPH = SmallV;	// Avoid division by zero 211031
	SpdUPS = SpdUPH * 5280 / 3600;	// Aircraft Speed (FPS)
	if (USorSI == "SI") SpdUPS = SpdUPH * 1000 / 3600 ;	// (MPS)
	SpdDLT = SpdUPS * DLTime;		// Aircraft Speed (DLT)
	// DynPres
	DynPrs = (SpdUPS * SpdUPS) * AirDen / 2;	// Dynamic Pressure	
	// Set GrFlag/GrdZed
	if (BegAGL == MinAGL) {
		GrFlag = 1;
		GrdZed = GrdAlt;
		CfLift = 0.1 * AngInc;			// Level lift
		PwrPct = 0;
		if (TDrAng > 0) ACPAdj = TDrAng;	// Taildragger
		XRad = DegRad * Mod360(Ax2CGA - ACPAdj);
		MPosYV = Ax2CGD * Math.cos(XRad) + WheelR + GrdZed;	// Set Height
		AirAxe.rotation.x = ACPAdj * DegRad;	// Pitch
	}
	// Compute Vectors
	/* If Starting in Flight, Compute Starting CfLift and Power for Level Flight and Given Bank */
	if (GrFlag == 0) {
		MPosYV = BegAGL;		// ###
		// Coefficient of Lift for Level Flight
		CfLift = Weight / (DynPrs * WingAr * Math.cos(ACBank * DegRad));
		if (CfLift > CfLMax) CfLift = CfLMax;
		// Power Setting for Level Flight
		let QSTval = DynPrs * WingAr;
		let CfLftT = CfLift + CfFlap;
		ACLftF =  CfLftT * QSTval;		// Lift[ft-lbs] - can be positive or negative
		// Prop
		if (JetMax == 0) {
			EnThrF = ThrstK * (PwrMax * PwrPct + WEPMax * SupPct) / SpdUPS;		// Propeller Force
			if (USorSI == "US" && SpdUPS < 15) {	// Set Cap on Initial Thrust since at 0 Spd, Thrust = infinity
				EnThrF = ThrstK * (PwrMax * PwrPct + WEPMax * SupPct) / 15;
			}
			if (USorSI == "SI" && SpdUPS < 4.572) {	// Set Cap on Initial Thrust
				EnThrF = ThrstK * (PwrMax * PwrPct + WEPMax * SupPct) / 4.572;
			}
		}
		// Jet
		else {
			EnThrF = JetMax * PwrPct + AftMax * SupPct;
		}
		DrgCdi = (CfLftT*CfLftT)/(WingAs*WingEf*PieVal);	// Cfi = CLift^2 / (Wing Aspect Ratio * Wing Efficiency * pi)
		ACDrIF = DrgCdi * QSTval;		// Induced Drag = ACLftF^2 / (DynPrs * WingSp^2 * WingEf * PI)
		let CfDF = FlpPct * DrgCdf;		// Coefficient of Parasitic Drag - Flaps
		let CfDG = LngPct * DrgCdg;		// Coefficient of Parasitic Drag - Landing Gear
		let CfDB = BrkPct * DrgCdb;		// Coefficient of Parasitic Drag - Air Brake
		let CfDS = SplPct * DrgCds;		// Coefficient of Parasitic Drag - Spoiler
		DrgCdp = DrgCd0+CfDF+CfDG+CfDB+CfDS;	// Total Coefficient of Parasitic Drag
		ACDrPF = DrgCdp * QSTval;		// Parasitic Drag =  Cd0 * DynPres * WingA
		PwrPct = (ACDrPF + ACDrIF) / (EnThrF * PwrMax);
		if (PwrPct > 1) PwrPct = 1;
	}
	move3dFlyt();
}

/* = CHANGE VALUES ===========================================================*/

function move3dFlyt() {
	/* 1. COMPUTE VECTORS ----------------------------------------------------*/
	// Inputs: SpdUPS, GrvUPS
	// Compute Force Vectors in UPS and multiply by FrcAcc to convert to UPT
	// a. Compute New Speeds for New DLTime
	DLTim2 = DLTime * DLTime;			// Time ^ 2
	GrvDLT = GrvUPS * DLTim2;			// Gravity (upt)
	FrcAcc = DLTim2 / ACMass;			// Convert Force to Acceleration
	SpdDLT = SpdUPS * DLTime;
	// b. Compute Dynamic Pressure	
	DynPrs = (SpdUPS * SpdUPS) * AirDen / 2;	// Dynamic Pressure
	let ACPrad = ACPtch * DegRad;
	let MaxLft = GrvMax * GrvDLT;		// Maximum G-accel
	let QSTval = DynPrs * WingAr;
	// c. Compute Lift Rotation
	// Lift = DynPres * WingArea * Cl
	let CfLftT = CfLift + CfFlap;
	ACLftF =  CfLftT * QSTval;			// Lift[ft-lbs] - can be positive or negative
	let ACLift = ACLftF * FrcAcc;		// Acceleration (DLT)
	if (ACLift > 0 && ACLift > MaxLft) ACLift = MaxLft;	// Limit to Max Gs (pos)
	if (ACLift < 0 && ACLift < -MaxLft) ACLift = -MaxLft;	// Limit to Max Gs (neg)
	ACLftD = (ACLift / SpdDLT) * RadDeg;	// Degrees = ACLift*180 / (PI()*V) = ACLift/V * RadDeg
	// d. Compute Net Thrust Acceleration
	// Prop
	if (JetMax == 0) {
		EnThrF = ThrstK * (PwrMax * PwrPct + WEPMax * SupPct) / SpdUPS;	// Propeller Force
		if (USorSI == "US" && SpdUPS < 15) {	// Set Cap on Initial Thrust since at 0 Spd, Thrust = infinity
			EnThrF = ThrstK * (PwrMax * PwrPct + WEPMax * SupPct) / 15;
		}
		if (USorSI == "SI" && SpdUPS < 4.572) {		// Set Cap on Initial Thrust
			EnThrF = ThrstK * (PwrMax * PwrPct + WEPMax * SupPct) / 4.572;
		}
	}
	// Jet
	else {EnThrF = JetMax * PwrPct + AftMax * SupPct;}
	// Drag
	DrgCdi = (CfLftT*CfLftT)/(WingAs*WingEf*PieVal);	// Cfi = CLift^2 / (Wing Aspect Ratio * Wing Efficiency * pi)
	ACDrIF = DrgCdi * QSTval;			// Induced Drag = ACLftF^2 / (DynPrs * WingSp^2 * WingEf * PI)
	let CfDF = FlpPct * DrgCdf;			// Coefficient of Parasitic Drag - Flaps
	let CfDG = LngPct * DrgCdg;			// Coefficient of Parasitic Drag - Landing Gear
	let CfDB = BrkPct * DrgCdb;			// Coefficient of Parasitic Drag - Air Brake
	let CfDS = SplPct * DrgCds;			// Coefficient of Parasitic Drag - Spoiler
	DrgCdp = DrgCd0+CfDF+CfDG+CfDB+CfDS;	// Total Coefficient of Parasitic Drag
	ACDrPF = DrgCdp * QSTval;			// Parasitic Drag =  Cd0 * DynPres * WingA
	ACDrRF = 0;							// Rolling Friction (default)
	if (GrFlag > 0) ACDrRF = ACMass * GrvUPS * ACDrGF;	// Rolling Friction on Ground
	let ACThrF = EnThrF - ACDrPF - ACDrIF - ACDrRF;	// Net Thrust Force
	let ACTrst = ACThrF * FrcAcc;		// Net Thrust Accel
	let GrvThr = GrvDLT * Math.sin(ACPrad);	// Gravity opposing Thrust = Grav * sin(ACP)
	ACThrG = ACTrst - GrvThr;			// Net Thrust after Gravity +/-
	// e. Gravity Reducing ACPitch
	let GrvACP = GrvDLT * Math.cos(ACPrad);	// Gravity opposing Lift and Yaw
	GrACPD = (GrvACP / SpdDLT) * RadDeg;	// Degrees +/-
	// Save Values
	PPPDif = ACLftD;					// Pitch Degrees (before Gravity)
	// If on Ground
	if (GrFlag > 0) {
		// Leaving ground if positive lift
		if (ACLftD > GrACPD) GrFlag = 0;	// If going to leave ground
		// If Still on Ground
		else {							// if staying in ground mode, override computations
			// Thrust
			ACThrG = ACThrG - BrkVal;	// Reduce thrust by brakes (if any)
			if (SpFlag>0 && ACThrG<0) ACThrG = 0;	// If Stopped on Moving Object, Brakes won't pull us backwards
			// Rotation
			AGBank = AGBank +  MosXDf * BnkMul;		// Aileron bank
			AGBank = MaxVal(AGBank,MxBnkR);		// Max values	
			ACBDif = -ACBank;			// Wheels on ground
			PPPDif = -ACPtch;			// Direction of flight = 0
			GrACPD = 0;					// No pitch down due to gravity
		}
	}
	// Compute Aircraft Pitch Adjustment
	// ACPAdj is an adjustment to ACPtch that allows the aircraft to pitch relative to the direction of flight
	// to match pitch required to produce specified lift; or, if on ground, to pitch around main wheel axis
	ACPAdj = (CfLift * 10) - AngInc - FlpPct * FlpAIn;				// Default (1.3 = 13)
	// Override if on Ground
	if (GrFlag > 0) {
		// If Taildragger
		if (TDrAng > 0) {
			// If Starting / Restarting
			if (SpdUPH < 1 || SpFlag > 0) {
				AuFlag = 1;				// Accelerating
				ACPAdj = TDrAng;		// Full Pitch
			}
			// If Decelerating Through MinSpd
			if (SpdUPH < TDrSpd && AuFlag == 0) {
				AuFlag = 2;				// Decelerating
			}
			// If Decelerating then Accelerating
			if (AuFlag == 2 && ACThrG > 0) {
				AuFlag = 1;				// Accelerating
			}
			// Either Way
			if (SpdUPH < TDrSpd) {
			// CfLift is irrelevant at low speeds.
			// At 0, ACPAdj = TDrAng; At MinSpd, ACPAdj = 0
			// At MinSpd set CfLift so that ACPAdj = 0.
				ACPAdj = TDrAng - (TDrAng * SpdUPH / TDrSpd);
			}
			// If Accelerate Through MinSpd then AuFlag = 0
			if ((SpdUPH >= TDrSpd) && AuFlag > 0) {	//211031
				AuFlag = 0;
				CfLift = (AngInc + FlpPct * FlpAIn)/10;
			}
		}
	}
	/* 2. COMPUTE DIRECTION OF FLIGHT ----------------------------------------*/
	// Inputs: ACBDif, PPPDif, YawDif
	// Instead of computing rotations and then rotating aircraft using Euler formulae,
	// this routine uses 2 linked objects to correctly rotate aircraft, which automatically
	// performs the math calculations for you.
	//
	// Rotate Aircraft (Heading Not Change)
	// Changes to AirPBY
	AirPBY.rotation.z = -ACBDif*DegRad;	// Change in Bank
	AirPBY.rotation.x = PPPDif*DegRad;	// Change in Pitch
	AirPBY.rotation.y = -YawDif*DegRad;	// Change in Yaw
	// Transfer Combined Rotation to AirAxe
	AirPBY.getWorldQuaternion(quaternion);
	AirAxe.setRotationFromQuaternion(quaternion);
	// Zero Out AirPBY Rotations (so display has correct values)
	AirPBY.rotation.z = 0;
	AirPBY.rotation.x = ACPAdj*DegRad;	// Make Pitch Adjustment here [220120 change]
	AirPBY.rotation.y = 0;
	// Load New Values
	ACBank = Mod360(-AirAxe.rotation.z*RadDeg);	
	ACPtch = PoM360(AirAxe.rotation.x*RadDeg);	
	ACHead = Mod360(-AirAxe.rotation.y*RadDeg);
	/* 3. COMPUTE MAP SPEED --------------------------------------------------*/
	/* Inputs:	SpdDLT, ACThrG, ACPtch, ACHead, MPosZV, MPosYV, MPosXV */
	/* Results:	SpdUPH, PSpdZV, PSpdYV, ACPtch, MSpdZV, MSpdYV, MSpdXV, MPosZV, MPosYV, MPosXV */
	// a. Compute Speed
	SpdDLT = SpdDLT + ACThrG;
	if (SpdDLT <= 0) SpdDLT = 0.0001;	// Set Minimum Speed to avoid division by zero  211031
	SpdUPH = SpdDLT * 3600 / (5280 * DLTime);	// (MPH)
	if (USorSI == "SI") SpdUPH = SpdDLT * 3600 / (1000  * DLTime);	// (KPH)
	SpdUPS = SpdUPH * 5280 / 3600;
	if (USorSI == "SI") SpdUPS = SpdUPH * 1000 / 3600 ;	// (MPS)
	// b1. Compute PSpd (before gravity)
	let ACP = ACPtch * DegRad;
	PSpdZV = SpdDLT * Math.abs(Math.cos(ACP));	// Horizontal speed
	// b2. Adjust ACP for Gravity
	ACPtch = ACPtch-GrACPD;
	if (ACPtch < -90) ACPtch = -90;		// Prevents you from pitching back up
	ACP = ACPtch*DegRad;
	AirAxe.rotation.x = ACP;
	PSpdYV = SpdDLT * Math.sin(ACP);	// Vertical speed
	// c. Compute Map Speed
	let ACH = ACHead * DegRad;
	MSpdZV = PSpdZV * Math.cos(ACH);
	MSpdYV = PSpdYV;
	MSpdXV = PSpdZV * Math.sin(ACH);
	// d. Compute Map Position
	MPosZV = MPosZV + MSpdZV;
	MPosYV = MPosYV + MSpdYV;
	MPosXV = MPosXV + MSpdXV;
	// If On Ground, Set Height
	if (GrFlag > 0) {
		XRad = DegRad * Mod360(Ax2CGA - ACPAdj);
		MPosYV = Ax2CGD * Math.cos(XRad) + WheelR + GrdZed;
	}
	// If Hit Ground, Limit Descent and Compute ACPAng and Height
	if (GrFlag == 0 && MPosYV < GrdZed + 10) {	// If close to ground, check ...
		ACP = Mod360(ACPtch + ACPAdj);	// ACPAdj relative to ground
		XRad = DegRad * Mod360(Ax2CGA - ACP); 	// Use ACP
		let Flor = Ax2CGD * Math.cos(XRad) + WheelR + GrdZed;
		if (MPosYV <= Flor) {			// 211031
			GrFlag = 1;					// Set Flag
			MPosYV = Flor;				// Set Height
			CfLift = CfLift + 0.1 * ACPtch;	// Set CfLift
		}
	}
}

/* = MISCELLANOUS SUBROUTINES ================================================*/

/* - Rotate Vector -----------------------------------------------------------*/
// For given vector and XY radians
// Computes rotated XYZ point values
// Uses and returns Vector3 value
function RoteV3(Dst,XRd,YRd) {
	// Pitch
	V3temp.y = Dst * Math.sin(XRd);
	V3temp.z = Dst * Math.cos(XRd);
	// Heading
	V3temp.x = V3temp.z * Math.sin(YRd);
	V3temp.z = V3temp.z * Math.cos(YRd);
	return V3temp;
}

/* - Rotate Vector -----------------------------------------------------------*/
// For given vector and XY radians
// Computes rotated XYZ point values
function RotVec(Dst,XRd,YRd) {
	// Pitch
	VectRY = Dst * Math.sin(XRd);
	VectRZ = Dst * Math.cos(XRd);
	// Heading
	VectRX = VectRZ * Math.sin(YRd);
	VectRZ = VectRZ * Math.cos(YRd);
}

/* - Conversions -------------------------------------------------------------*/

/* Converts degrees to 360 */
function Mod360(deg) {
	while (deg < 0) deg = deg + 360;	// Make deg a positive number
	deg = deg % 360;					// Compute remainder of any number divided by 360
return deg;}

/* Converts degrees to 360 and avoid err */
function Err360(deg) {
	while (deg < 0) deg = deg + 360;	// Make deg a positive number
	deg = deg % 360;					// Compute remainder of any number divided by 360
	if (deg == 0 ||
		deg == 90 ||
		deg == 180 ||
		deg == 270) {
			deg = deg + SmallV;
		}
return deg;}

/* Converts 360 degrees to +/- 180 */
function PoM360(deg) {
	if (deg > 180) deg = deg - 360;
return deg;}

/* - Min Max ---------------------------------------------------------------- */

/* Limit Maximum +/- Value */
function MaxVal(x, max) {
	if (x > 0 && x >  max) x =  max;
	if (x < 0 && x < -max) x = -max;
return x;}

/* Limit Minimum +/- Value */
function MinVal(x, min) {
	if (x > 0 && x <  min) x =  min;
	if (x < 0 && x > -min) x = -min;
return x;}

/* Limit Minimum and Maximum +/- Value */
function MinMax(x, min, max) {
	if (x > 0) {
		if (x > max) x = max;
		else if (x < min) x = min;
	}
	if (x < 0 ) {
		if (x < -max) x = -max;
		else if (x > -min) x = -min;
	}
return x;}

/* Limit Minimum and Maximum +/- Value */
// Sets Max and Dead Zone
function ZerMax(x, min, max) {
	if (x > 0) {
		if (x > max) x = max;
		else if (x < min) x = 0;
	}
	if (x < 0 ) {
		if (x < -max) x = -max;
		else if (x > -min) x = 0;
	}
return x;}

/* Set Minimum Value = 0 */
function ZerMin(x, min) {
	if (x > 0 && x < min) x = 0;
	if (x < 0 && x > -min) x = 0;
return x;}


export {init3dFlyt, move3dFlyt, Mod360, PoM360, MaxVal, RoteV3, RotVec, AirAxe, AirPBY};

/* = REVISIONS ===============================================================
 * 211216:	This new EZ version uses three.js rotations to compute orientation.
 * 			Added standard linked objects AirAxe and AirPBY
 * 220120:	Changed ACPAdj from animation to object adjustment
 * 220226:	Fixed taildragger adjustment so that smooth transition
 * 230325:  Added RoteV3 which uses and returns Vector3 value
*/
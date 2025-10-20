/*******************************************************************************
*
*	FLIGHTH SUBROUTINES
*
********************************************************************************

Copyright 2017-25, Phil Crowther <phil@philcrowther.com>
Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
Version dated 19 Oct 2025

This module is used for helicopter flight

@fileoverview
This file contains variables and functions for 3D Flight.
The primary functions are: InitFlyt(Obj) and RoteFlyt(Obj)
where Obj is the address of the aircraft object.
The primary inputs are listed below and in the separate aircraft data file.
See http://philcrowther.com/Aviation/ACflyt.htm for more details.
*/

/*******************************************************************************
*
*	INITIALIZE
*
*******************************************************************************/

/* Initialize Rotation and Vectors*/
function init3dFlyt() {
	// Orientation
	ACBank = BegBnk;
	ACPtch = BegPit;
	ACHead = BegHdg;
	// Units
	if (USorSI == "SI") GrvUPS = 9.80665;	// (mps)
	if (USorSI == "US") ACMass = Weight / GrvUPS;	// Mass (slugs or kg)
	if (USorSI == "SI") AirDen = 1.225;	// (kg/m3)
	// Constants
	if (JetMax == 0) {
		ThrstK = 550 * PropEf;			// Thrust (US units)
		if (USorSI == "SI") ThrstK = 1000 * PwrMax * PropEf;	// (SI units)
	}
	ACPMax = CfLMax * 10;				// Max aircraft pitch adjustment (+/- 15)
	ACPInc = ACPMax - AngInc;			// Net max aircraft pitch adjustment (10)
	TDrAdj = TDrAng - ACPInc;			// Pitch change required for taildragger (7.5)
	// Time
	DLTim2 = DLTime**2;
	GrvDLT = GrvUPS * DLTim2;			// Gravity (upt)
	FrcAcc = DLTim2 / ACMass;			// Convert Force to Acceleration
	// Starting Altitude
	if (BegAGL == MinAGL) {				// If same AGL, then starting on ground
		GrFlag = 1;						// Set Ground Flag
		GrdZed = GrdAlt;
	}
	move3dFlyt();
}

/*******************************************************************************
*
*	UPDATE
*
*******************************************************************************/

// Inputs: GrFlag, GrdZed, AltDif, MSpdZS, ACPtch, ACBank

function move3dFlyt() {
	/* Compute Vectors */
	if (GrFlag > 0 && AltDif > 0) GrFlag = 0;	// If going to leave ground
	if (GrFlag == 0) {
		// 1. Vertical Speed
		PSpdYF = PSpdYF + AltDif;
		if (PSpdYF > 0.5) PSpdYF = 0.5;
		if (PSpdYF < -0.5) PSpdYF = -0.5;
		// 2. Horizontal Speed
		// Although MSpd is saved, PSpd must be recomputed since ACH may have changed
		var ACHRad = ACHead * DegRad;
		PSpdZS = MSpdZS * Math.cos(-ACHRad) - MSpdXS * Math.sin(-ACHRad);
		PSpdXS = MSpdZS * Math.sin(-ACHRad) + MSpdXS * Math.cos(-ACHRad);
		// 3. Thrust Force
		var ThrMu2 = (0.15 * ACPtch) * (0.15 * ACPtch);
		if (ThrMu2 < 1) ThrMu2 = 1;
		ThrMu2 = ThrMu2 / 5;
		// a. Forward
		var ACPRad = -ACPtch * DegRad;
		var PThrZS = 13762 * Math.sin(ACPRad);		// Propeller Acceleration - Forward
		PThrZS = PThrZS * ThrMu2;
		// b. Lateral
		var ACBRad = ACBank * DegRad;
		var PThrXS = 13762 * Math.sin(ACBRad);		// Propeller Acceleration - Lateral
		PThrXS = PThrXS * ThrMu2;
		// 4. Drag Force
		// a. Forward
		DynPrs = (PSpdZS * PSpdZS) * AirDen / 2;	// Dynamic Pressure (Absolute value)
		var PDrgZS = DynPrs * FrntAr * 3.821;		// Parasitic Drag
		if (PSpdZS < 0) PDrgZS = -PDrgZS;			// If going backwards, drag = forwards
		// b. Lateral
		DynPrs = (PSpdXS * PSpdXS) * AirDen / 2;	// Dynamic Pressure
		var PDrgXS = DynPrs * FrntAr * 43.525;		// Parasitic Drag
		if (PSpdXS < 0) PDrgXS = -PDrgXS;			// If going backwards, drag = forwards
		// 5. PAcc and PSpd (distance/second)
		// a. Forward
		PAccZS = (PThrZS - PDrgZS) / ACMass;
		PSpdZS = PSpdZS + PAccZS;
		if (GrFlag > 0) PSdpZS = 0;					// If on Ground, PSpdZ = 0
		// b. Lateral
		PAccXS = (PThrXS - PDrgXS) / ACMass;
		PSpdXS = PSpdXS + PAccXS;
		if (GrFlag > 0) PSdpXS = 0;					// If on Ground, PSpdX = 0;
		// 6. Compute MSpd (distance/second)
		MSpdZS = PSpdZS * Math.cos(ACHRad) - PSpdXS * Math.sin(ACHRad);
		MSpdXS = PSpdZS * Math.sin(ACHRad) + PSpdXS * Math.cos(ACHRad);
		// 8. Adjust Direction of Flight
		var YawAdj = 0;
		if (Math.abs(PSpdZS) > 1 && Math.abs(PSpdXS) > 1) { 
			DirFlt = Mod360(Math.atan2(MSpdXS,MSpdZS) * RadDeg);
			var YawAdj = Mod360(DirFlt-ACHead)*DegRad;	// Difference
			YawAdj = Math.sin(YawAdj);					// Range = 0, +1, 0, -1
			YawAdj = YawAdj * SpdUPH/135;				// Increase based on speed
		}
		YawDif = YawDif + YawAdj;		
		/* Rotate Helicopter */
		// ACPitch
		ACPtch = ACPtch + ACPDif;
		if (ACPtch > 15) ACPtch = 15;
		else if (ACPtch < -15) ACPtch = -15;
		// ACBank
		ACBank = Mod360(ACBank + ACBDif);
		if (ACBank > 30 && ACBank < 180) ACBank = 30;
		else if (ACBank < 330 && ACBank > 180) ACBank = 330;
		// ACYaw
		ACHead = Mod360(ACHead + YawDif);	
		// Compute Map Speed
		MSpdZV = MSpdZS * DLTime;
		MSpdXV = MSpdXS * DLTime;
		MSpdYV = PSpdYF;
	}
	else {
		MSpdZV = 0;						// Helicopter only
		MSpdXV = 0;						// Helicopter only
		MSpdYV = 0;						// Assumes flat land			
	}
	// Compute Map Pos
	MPosZV = MPosZV + MSpdZV;
	MPosXV = MPosXV + MSpdXV;
	MPosYV = MPosYV + MSpdYV;			// ASL
	// Landing Altitude
	MinAlt = GrdZed + MinAGL;			// Minimum Altitude (ASL = GL+AGL)
	// If Hit Ground, Stop Everything
	if (GrFlag == 0 && MPosYV <= MinAlt) GrFlag = 1;	// If Flag Not Set and Hit Ground
	// If On Ground, Set Variables
	if (GrFlag > 0) {
		MSpdYV = 0;
		MPosYV = MinAlt;				// Altitude = GL + AGL
		// Set Inputs = 0
		AltDif = 0;
		PSpdYF = 0;
		ACPDif = 0;
		ACBDif = 0;
		// Set Results = 0
		ACPtch = 0;
		ACBank = 0;
		PSpdZS = 0;						// Helicopter Only
	}
	// Compute SpdDLT
	SpdUPH = PSpdZS * 3600 / 5280;		// (MPH)
	SpdUPS = SpdUPH * 5280 / 3600;		// (fps)
}

/*******************************************************************************
*
*	SUBROUTINES
*
*******************************************************************************/

//- Conversions ----------------------------------------------------------------

//  Converts degrees to 360
function Mod360(deg) {
	while (deg < 0) deg = deg + 360;	// Make deg a positive number
	deg = deg % 360;					// Compute remainder of any number divided by 360
return deg;}

// Converts 360 degrees to +/- 180
function PoM360(deg) {
	if (deg > 180) deg = deg - 360;
return deg;}

//- Rotate Vector --------------------------------------------------------------
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

/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {init3dFlyt, move3dFlyt, Mod360, PoM360, RotVec};

/*******************************************************************************
*
*	REVISIONS
*
********************************************************************************

*/

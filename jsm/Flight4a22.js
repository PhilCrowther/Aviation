/*
 * Flight.js
 * Version 4a (vers 24.10.14)
 * Copyright 2017-24, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * A three.js class-type module for Flight Simulation
 * See http://philcrowther.com/Aviation for more details.
*/

import {Quaternion,BoxGeometry,MeshBasicNodeMaterial,Mesh} from 'three';
import {color} from "three/tsl";

class Flight {

//= Initialize Ocean ===========================================================
constructor(air_) {
	this.air_ = air_;
	//- Internal Variables -----------------------------------------------------
	//	Standard Conversions
	this.DegRad = Math.PI/180;	// Convert Degrees to Radians
	this.RadDeg = 180/Math.PI;	// Convert Radians to Degrees
	//- Constants
	this.quaternion = new Quaternion();
	this.SmallV = .0000001;		// Small value added to prevent errors
	this.ACDrGF = 0.08;			// Rolling Drag s/b firm turf (.02 concrete, .06 soft turf)
	//- Computed Constants (Vary by Aircraft)
	this.WingAs = 0;			// Wing Aspect Ratio
	this.FrcAcc = 0;			// Convert Force to Acceleration
	this.ThrstK = 0;			// Thrust Constant
	//- Air Density and IAS Computations ---------------------------------------
	this.air_.AirDSL = AirDns(this.air_.BegTmp,this.air_.MapSPS.y);	//###
	this.air_.SpdIAS = AirIAS(this.air_.AirDSL,this.air_.SpdKPH);
	// Basic Flight Data (SI Adjustments)
	this.dat_ = this.air_.AirDat; // Store address of Aircraft Type
	// this.dat_ variable saved to this.air_
	this.air_.ACMass = this.dat_.ACMass;
	this.air_.Weight = this.air_.ACMass*this.air_.GrvMPS;
	this.air_.FlpCfL = this.dat_.FlpCfL;
	this.air_.CfLMax = this.dat_.CfLMax;
	this.air_.BnkMax = this.dat_.BnkMax;
	// Comps
	let DLTim2 = this.air_.DLTime*this.air_.DLTime;
	let GrvDLT = this.air_.GrvMPS*DLTim2;
	this.FrcAcc = DLTim2/this.air_.ACMass; 		// Convert Force to Acceleration
	// Constants
	if (this.dat_.JetMax == 0) this.ThrstK = 1000*this.dat_.PropEf;	// (SI units)
	this.WingAs = this.dat_.WingSp*this.dat_.WingSp/this.dat_.WingAr; // Wing Aspect Ratio
	let ACPMax = this.air_.CfLMax*10;			// Max aircraft pitch adjustment (+/- 15)
	let ACPInc = ACPMax-this.dat_.AngInc;		// Net max aircraft pitch adjustment (10)
	// If Starting on Ground ---------------------------------------------------
	if (this.air_.GrdFlg) {
		this.air_.PwrPct = 0;	// Also specified in main program
		// this.air_.SpdKPH = 0; // Not true if on moving platform	
		this.air_.CfLift = 0.1*this.dat_.AngInc; // Level CfL (Net CfL = 0)
		this.air_.ACPAdj = 0;	// Default
		if (this.dat_.TDrAng) {	// Taildragger
			this.air_.ACPAdj = this.dat_.TDrAng; // Taildragger at Max
			let XRad = this.DegRad*Mod360(this.dat_.Ax2CGA-this.air_.ACPAdj); // Net Tilt Back
			this.air_.MapPos.y = this.dat_.Ax2CGD*Math.cos(XRad)+this.dat_.WheelR+this.air_.GrdZed;	// Set Height
		}
	}
	// If Start in Air ---------------------------------------------------------
	else {
		// Speed
		if (this.air_.SpdKPH <= 0) this.air_.SpdKPH = this.SmallV; // Avoid division by zero
		this.air_.SpdMPS = this.air_.SpdKPH/3.6; // (MPS)
		this.air_.SpdMPF = this.air_.SpdMPS*this.air_.DLTime; // Aircraft Speed (DLT)
		// DynPres
		let DynPrs = (this.air_.SpdMPS*this.air_.SpdMPS)*this.air_.AirDSL/2; // Dynamic Pressure
		// Compute Vectors
		// If Starting in Flight, Compute Starting this.air_.CfLift and Power for Level Flight and Given Bank
		// Coefficient of Lift for Level Flight
//		this.air_.CfLift = this.air_.Weight/(DynPrs*this.dat_.WingAr*Math.cos(this.air_.AirRot.z*this.DegRad));		
		this.air_.CfLift = this.air_.Weight/(DynPrs*this.dat_.WingAr*Math.abs(Math.cos(this.air_.AirRot.z*this.DegRad)));	// USE ABS?		
		if (this.air_.CfLift > this.air_.CfLMax) this.air_.CfLift = this.air_.CfLMax;
		// Power Setting for Level Flight
		let QSTval = DynPrs*this.dat_.WingAr;
		let CfLftT = this.air_.CfLift+this.air_.CfFlap;
		let ACLftF =  CfLftT*QSTval;			// Lift[ft-lbs] - can be positive or negative
		// Thrust (Default = Prop)
		let EnThrF = this.ThrstK*(this.dat_.PwrMax*this.air_.PwrPct+this.dat_.WEPMax*this.air_.SupPct)/this.air_.SpdMPS;
		if (this.air_.SpdMPS < 4.572) {			// Set Cap on Initial Thrust
			EnThrF = this.ThrstK*(this.dat_.PwrMax*this.air_.PwrPct+this.dat_.WEPMax*this.air_.SupPct)/4.572;
		}
		if (this.dat_.JetMax) EnThrF = this.dat_.JetMax*this.air_.PwrPct+this.dat_.AftMax*this.air_.SupPct;	// Jet
		// Drag
		let DrgCdi = (CfLftT*CfLftT)/(this.WingAs*this.dat_.WingEf*Math.PI);	// Cfi = CLift^2/(Wing Aspect Ratio*Wing Efficiency*pi)
		let ACDrIF = DrgCdi*QSTval;				// Induced Drag = ACLftF^2/(DynPrs*WingSp^2*this.dat_.WingEf*PI)
		let CfDF = this.air_.FlpPct*this.dat_.DrgCdf; // Coefficient of Parasitic Drag - Flaps
		let CfDG = this.air_.LngPct*this.dat_.DrgCdg; // Coefficient of Parasitic Drag - Landing Gear
		let CfDB = this.air_.BrkPct*this.dat_.DrgCdb; // Coefficient of Parasitic Drag - Air Brake
		let CfDS = this.air_.SplPct*this.dat_.DrgCds; // Coefficient of Parasitic Drag - Spoiler
		let DrgCdp = this.dat_.DrgCd0+CfDF+CfDG+CfDB+CfDS; // Total Coefficient of Parasitic Drag
		let ACDrPF = DrgCdp*QSTval;				// Parasitic Drag =  Cd0*DynPres*WingA
		// Power
		this.air_.PwrPct = (ACDrPF+ACDrIF)/(EnThrF*this.dat_.PwrMax);
		if (this.air_.PwrPct > 1) this.air_.PwrPct = 1;
	}
	// Orientation -------------------------------------------------------------
	this.air_.AirObj.rotation.x = Mod360(this.air_.AirRot.x)*this.DegRad;	// Pitch
	this.air_.AirObj.rotation.y = Mod360(-this.air_.AirRot.y)*this.DegRad;	// Heading
	this.air_.AirObj.rotation.z = Mod360(360-this.air_.AirRot.z)*this.DegRad; // Bank
	//
	this.update();
};	// End of Initialize

// = FLIGHT.UPDATE = (called by Main Program) ==================================
update() {
	// 1. COMPUTE VECTORS ------------------------------------------------------
	// Most of these comps are also used while on ground, so compute and adjust
	// Inputs: this.air_.SpdMPS, this.air_.GrvMPS
	// Comps
	let DLTim2 = this.air_.DLTime*this.air_.DLTime;
	let GrvDLT = this.air_.GrvMPS*DLTim2;
	this.FrcAcc = DLTim2/this.air_.ACMass;		// Convert Force to Acceleration
	this.air_.SpdMPF = this.air_.SpdMPS*this.air_.DLTime;
	// Compute air_.AirDSL and air_.AirIAS
	this.air_.AirDSL = AirDns(this.air_.BegTmp,this.air_.MapSPS.y);
	this.air_.SpdIAS = AirIAS(this.air_.AirDSL,this.air_.SpdKPH);
	// Compute Dynamic Pressure
	let DynPrs = (this.air_.SpdMPS*this.air_.SpdMPS)*this.air_.AirDSL/2;	// Dynamic Pressure
	let ACPrad = this.air_.AirRot.x*this.DegRad;
	let QSTval = DynPrs*this.dat_.WingAr;
	// Compute Max Lift
	let LftMax = this.dat_.GrvMax*GrvDLT; // Maximum G-accel
	LftMax = (LftMax + this.dat_.GrvMax)*GrvDLT; // AutoPilot
	// Compute Max Bank (### ATP)
	let GrvMaxF = this.dat_.GrvMax*this.air_.Weight; // Max G-Force 
	let LftMaxF = this.air_.CfLMax*DynPrs*this.dat_.WingAr;	// Max Lift at this Speed
	if (LftMaxF > GrvMaxF) LftMaxF = GrvMaxF;	// Limit Max Lift to Max G-Force
	this.air_.MaxBnk = Math.acos(this.air_.Weight/LftMaxF)*this.RadDeg;	// Max Bank Angle for Max Lift
	// a. COMPUTE LIFT ROTATION ................................................
	// Lift = DynPres*this.dat_.WingArea*Cl
	let CfLftT = this.air_.CfLift+this.air_.CfFlap;	// Default
	if (this.air_.AutoOn) {
		let LftReq = Math.abs(Math.cos(this.air_.AirObj.rotation.x)*this.air_.Weight);
		this.air_.CfLift = LftReq/(DynPrs*this.dat_.WingAr*Math.abs(Math.cos(this.air_.AirObj.rotation.z)));
		this.air_.CfLift = this.air_.CfLift+this.air_.CfLDif;
		CfLftT = this.air_.CfLift;
	}
	// Limit Total Lift
	if (this.air_.CfLftT >  this.air_.CfLMax) this.air_.CfLftT =  this.air_.CfLMax;
	if (this.air_.CfLftT < -this.air_.CfLMax) this.air_.CfLftT = -this.air_.CfLMax;
	// Compute Lift Force, Acceleration and Degrees Rotation
	let ACLftF = CfLftT*QSTval;					// Lift[ft-lbs] - can be positive or negative
	let ACLift = ACLftF*this.FrcAcc;			// Acceleration (DLT)
	if (ACLift > 0 && ACLift > LftMax) ACLift = LftMax;	// Limit to Max Gs (pos)
	if (ACLift < 0 && ACLift < -LftMax) ACLift = -LftMax;	// Limit to Max Gs (neg)
	let ACLftD = (ACLift/this.air_.SpdMPF)*this.RadDeg;	// Degrees = ACLift*180/(PI()*V) = (ACLift/V)*this.RadDeg
	// Compute this.air_.RotDif.x
	this.air_.RotDif.x = ACLftD; // Pitch Degrees (before Gravity)
	// b. COMPUTE GRAVITY CHANGES ..............................................
	let GrvThr = GrvDLT*Math.sin(this.air_.AirObj.rotation.x);	// Gravity opposing Thrust = Grav * sin(ACPrad)
	let GrvACP = GrvDLT*Math.cos(this.air_.AirObj.rotation.x);	// Vertical Gravity
	let GrvACD = (GrvACP/this.air_.SpdMPF)*this.RadDeg;	// Degrees = (GrvACP/V)*(180/(PI()) = (GrvACP/V)*this.RadDeg
	// c. COMPUTE NET THRUST ACCELERATION ......................................
	// Thrust (Default = Prop)
	let EnThrF = this.ThrstK*(this.dat_.PwrMax*this.air_.PwrPct+this.dat_.WEPMax*this.air_.SupPct)/this.air_.SpdMPS;
	if (this.air_.SpdMPS < 4.572) { // Set Cap on Initial Thrust
		EnThrF = this.ThrstK*(this.dat_.PwrMax*this.air_.PwrPct+this.dat_.WEPMax*this.air_.SupPct)/4.572;
	}
	if (this.dat_.JetMax) EnThrF = this.dat_.JetMax*this.air_.PwrPct+this.dat_.AftMax*this.air_.SupPct;	// Jet
	// Drag
	let DrgCdi = (CfLftT*CfLftT)/(this.WingAs*this.dat_.WingEf*Math.PI);	// Cfi = CLift^2/(Wing Aspect Ratio*Wing Efficiency*pi)
	let ACDrIF = DrgCdi*QSTval;	// Induced Drag = ACLftF^2/(DynPrs*WingSp^2*this.dat_.WingEf*PI)
	let CfDF = this.air_.FlpPct*this.dat_.DrgCdf; // Coefficient of Parasitic Drag - Flaps
	let CfDG = this.air_.LngPct*this.dat_.DrgCdg; // Coefficient of Parasitic Drag - Landing Gear
	let CfDB = this.air_.BrkPct*this.dat_.DrgCdb; // Coefficient of Parasitic Drag - Air Brake
	let CfDS = this.air_.SplPct*this.dat_.DrgCds; // Coefficient of Parasitic Drag - Spoiler
	let DrgCdp = this.dat_.DrgCd0+CfDF+CfDG+CfDB+CfDS; // Total Coefficient of Parasitic Drag
	let ACDrPF = DrgCdp*QSTval;	// Parasitic Drag =  Cd0*DynPres*WingA
	let ACDrRF = 0;				// Rolling Friction (default)
	if (this.air_.GrdFlg) ACDrRF = this.air_.ACMass*this.air_.GrvMPS*this.ACDrGF;	// Rolling Friction on Ground
	// Net
	let ACThrF = EnThrF-ACDrPF-ACDrIF-ACDrRF; // Net Thrust Force
	let ACTrst = ACThrF*this.FrcAcc; // Net Thrust Accel
	let ACThrG = ACTrst-GrvThr;	// Net Thrust after Gravity +/-
	// Compute Aircraft Pitch Adjustment
	// this.air_.ACPAdj is an adjustment to ACPtch that allows the aircraft to pitch relative to the direction of flight
	// to match pitch required to produce specified lift; or, if on ground, to pitch around main wheel axis
	this.air_.ACPAdj = (this.air_.CfLift*10)-this.dat_.AngInc; // Default (1.3 = 13)
	// 2. GRDFLG ADJUSTMENTS ---------------------------------------------------
	// Adjust for 3 alternatives: (1) Leaving Ground; (2) Hitting Ground; and (3) On Ground
	// Determine if Leaving Ground
	if (this.air_.GrdFlg) {
		// Leaving ground if positive lift
		if (ACLftD > GrvACD) this.air_.GrdFlg = 0; // If going to leave ground
	}
	// Determine if Hitting Ground
	if (!this.air_.GrdFlg && this.air_.MapPos.y < this.air_.GrdZed+10) { // If close to ground, check ...
		let ACP = Mod360(this.air_.AirRot.x+this.air_.ACPAdj);	// this.air_.ACPAdj relative to ground
		ACPrad = this.DegRad*Mod360(this.dat_.Ax2CGA-ACP); 	// Use ACP
		let Flor = this.dat_.Ax2CGD*Math.cos(ACPrad)+this.dat_.WheelR+this.air_.GrdZed;
		if (this.air_.MapPos.y <= Flor) {
			this.air_.GrdFlg = 1; // Set Flag
			// Set New Rotation
			this.air_.AirRot.x = 0; // Set Default Pitch (ShpPit radians added below)
			this.air_.AirPBY.rotation.x = 0;
			this.air_.AirRot.z = 0; // Set Default Bank (ShpBnk radians added below)
			this.air_.AirPBY.rotation.z = 0;
			// this.air_.ACPAdj = 0; // Allow for Flared Landing (Limits added below)
		}
	}
	// If On Ground, Make Adjustments
	if (this.air_.GrdFlg) {
		// AGBank (not now) 
		//this.air_.AGBank = this.air_.AGBank+this.air_.InM.x*this.air_.PBYmul.z;	// Aileron bank
		//this.air_.AGBank = MaxVal(this.air_.AGBank,this.air_.BnkMax); // Max values
		// No More User Changes to Pitch or Bank (except post-adjustments for ShpRot)
		this.air_.RotDif.x = 0;
		this.air_.RotDif.z = 0;
		// ACPAdj Taildragger-Related Adjustments
		if (this.dat_.TDrAng) {
			// Can't Pitch more than TDrAng
			if (this.air_.ACPAdj > this.dat_.TDrAng) this.air_.ACPAdj = this.dat_.TDrAng;	
			// If less than Full Tail-Lift Speed, ACPAdj determined by Speed
			if (this.air_.SpdKPH < this.dat_.TDrSpd) {  // Tail Slowly Raises and Falls
				let MaxAng = this.dat_.TDrAng-(this.dat_.TDrAng*this.air_.SpdKPH/this.dat_.TDrSpd);
				if (this.air_.ACPAdj < MaxAng) this.air_.ACPAdj = MaxAng; // Prevent tail from popping up
			}
			// Override: If Speed  < 1 KPH, Tail all the way down:
			if (this.air_.SpdKPH < 1 || this.air_.MovFlg > 0) {
				this.air_.ACPAdj = this.dat_.TDrAng;
			}
		}
		// Other ACPAdj-Related Adjustments
		if (this. air_.ACPAdj < 0) this. air_.ACPAdj = 0; // Never negative while on ground
		this.air_.CfLift = (this.air_.ACPAdj+this.dat_.AngInc)/10;	// Set startng this.air_.CfLift (ignore AirRot.x)
		// Preliminary Adjustments to Computation of Map Speed (Prevents Runaway Airplane Powered by Gravity)
		ACThrG = ACTrst-this.air_.BrkVal; // Elim Gravity and Reduce thrust by brakes (if any)
		if (this.air_.MovFlg && ACThrG<0) ACThrG = 0;	// If Stopped on Moving Object, Brakes won't pull us backwards
		GrvACD = 0;				// No Gravity to Cause Downward Deflection
		// Compute Map Height (should not be over-ridden since AirRot.x = 0)
		let XRad = this.DegRad*Mod360(this.dat_.Ax2CGA-this.air_.ACPAdj);
		this.air_.MapPos.y = this.dat_.Ax2CGD*Math.cos(XRad)+this.dat_.WheelR+this.air_.GrdZed;
	}
	// 2. COMPUTE DIRECTION OF FLIGHT ------------------------------------------
	// Inputs: this.air_.RotDif
	// This routine uses 2 linked meshes to correctly rotate aircraft.
	// Rotate Aircraft (Heading Not Change)
	// Changes to AirPBY
	this.air_.AirPBY.rotation.z = -this.air_.RotDif.z*this.DegRad;	// Change in Bank (due to user imput)
	this.air_.AirPBY.rotation.x = this.air_.RotDif.x*this.DegRad;	// Change in Pitch (due to change in Lift due to user input)
	this.air_.AirPBY.rotation.y = -this.air_.RotDif.y*this.DegRad;	// Change in Yaw (due to user input)
	if (this.air_.GrdFlg) {
		this.air_.AirPBY.rotation.z = 0;
		this.air_.AirPBY.rotation.x = 0;
	}
	// Transfer Combined Rotation to AirAxe
	this.air_.AirPBY.getWorldQuaternion(this.quaternion);
	this.air_.AirObj.setRotationFromQuaternion(this.quaternion);
	if (this.air_.GrdFlg) {
		this.air_.AirObj.rotation.z = 0;
		this.air_.AirObj.rotation.x = 0;
	}
	// Zero Out AirPBY Rotations (so display has correct values)
	this.air_.AirPBY.rotation.z = 0;
	this.air_.AirPBY.rotation.x = this.air_.ACPAdj*this.DegRad;	// Make Pitch Adjustment here [220120 change]
	this.air_.AirPBY.rotation.y = 0;
	// Pitch -------------------------------------------------------------------
	this.air_.AirRot.x = PoM360(this.air_.AirObj.rotation.x*this.RadDeg);
	this.air_.AirRot.x = this.air_.AirRot.x + this.air_.ShpPit; // Add Ship Pitch
	// Heading -----------------------------------------------------------------
	this.air_.AirRot.y = Mod360(-this.air_.AirObj.rotation.y*this.RadDeg);
	this.air_.HdgDif = (this.air_.AirRot.y-this.air_.OldRot.y)/this.air_.DLTime;	// Change in Heading (display)
	this.air_.OldRot.y = this.air_.AirRot.y;					// Save old heading	
	// Bank --------------------------------------------------------------------
	// ### ATP
	if (this.air_.AutoOn && this.air_.InpKey.z == 0) {
		// Keep Same Bank
		this.air_.AirObj.rotation.z = this.air_.OldRot.z;
		// Self-Center .........................................................
		if (this.air_.AirRot.z > 0 && this.air_.AirRot.z < 2) this.air_.OldRot.z = 0.000001*this.air_.AirRot.z*this.DegRad;
		if (this.air_.AirRot.z < 360 && this.air_.AirRot.z > (360-2)) this.air_.OldRot.z = -0.000001*(360-this.air_.AirRot.z)*this.DegRad;
	}
	else {this.air_.OldRot.z = this.air_.AirObj.rotation.z;}
	//
	this.air_.AirRot.z = Mod360(-this.air_.AirObj.rotation.z*this.RadDeg);
	// Limit to Max Bank (### ATP) .............................................
	if (this.air_.AutoOn && (this.air_.AirRot.z > 270 || this.air_.AirRot.z < 90)) {	// Only if Flag Set and Not Upside Down
		let ACBnew = this.air_.AirRot.z;	// 270 to 90
		if (ACBnew > 180) ACBnew = ACBnew-360;	// -90 to 90
		if (ACBnew >  this.air_.MaxBnk) ACBnew = this.air_.MaxBnk;  // Limit Pos Bank
		if (ACBnew < -this.air_.MaxBnk) ACBnew = -this.air_.MaxBnk;	// Limit Neg Bank
		this.air_.AirRot.z = Mod360(ACBnew+360); 		// 270 to 90
		this.air_.AirObj.rotation.z = -this.air_.AirRot.z*this.DegRad;
	}
	this.air_.AirRot.z = this.air_.AirRot.z + this.air_.ShpBnk; // Add Ship Pitch		
	// 3. COMPUTE MAP SPEED ----------------------------------------------------
	// Inputs:	this.air_.SpdMPF, ACThrG, ACPtch, ACHead, this.air_.MapPos
	// Results:	this.air_.SpdKPH, PSpdZV, PSpdYV, ACPtch, this.air_.MapSpd, this.air_.MapPos
	// a. Compute Speed
	this.air_.SpdMPF = this.air_.SpdMPF+ACThrG; // ### GrdFlg: eliminated gravity from ACThrG and add brakes
	if (this.air_.SpdMPF <= 0) this.air_.SpdMPF = 0.0001; // Set Minimum Speed to avoid division by zero  211031
	this.air_.SpdKPH = this.air_.SpdMPF*3.6/this.air_.DLTime;	// (KPH)
	this.air_.SpdMPS = this.air_.SpdKPH/3.6;	// (MPS)
	// b1. Compute PSpd (before gravity)
	ACPrad = this.air_.AirRot.x*this.DegRad;
	let PSpdZV = this.air_.SpdMPF*Math.abs(Math.cos(ACPrad));
	// b2. Adjust ACP for Gravity
	this.air_.AirRot.x = this.air_.AirRot.x-GrvACD; // ### GrdFlg: GrvACD = 0
	if (this.air_.AirRot.x < -90) this.air_.AirRot.x = -90;	// Prevents you from pitching back up
	ACPrad = this.air_.AirRot.x*this.DegRad;
	this.air_.AirObj.rotation.x = ACPrad;
	let PSpdYV = this.air_.SpdMPF*Math.sin(ACPrad);	// Vertical speed	
	// c. Compute Map Speed
	let ACH = this.air_.AirRot.y*this.DegRad;
	this.air_.MapSpd.z = PSpdZV*Math.cos(ACH);
	this.air_.MapSpd.y = PSpdYV;
	this.air_.MapSpd.x = PSpdZV*Math.sin(ACH);
	// d. Compute Map Position
	this.air_.MapPos.z = this.air_.MapPos.z+this.air_.MapSpd.z;
	this.air_.MapPos.y = this.air_.MapPos.y+this.air_.MapSpd.y;
	this.air_.MapPos.x = this.air_.MapPos.x+this.air_.MapSpd.x;
	// Store XS, YP, ZS
	this.air_.MapSPS.x = this.air_.MapSpd.x;
	this.air_.MapSPS.y = this.air_.MapPos.y;
	this.air_.MapSPS.z = this.air_.MapSpd.z;
};	// End of Update

};	// End of Module

//= MISCELLANOUS SUBROUTINES ===//==============================================

// Compute Air Density and Indcated Airspeed
function AirDns(BegTmp,Height) {
	//- Altitude Index
	let AltIdx = Height/1000;
	//- Standard Temperature and Pressure Ratios at Altitude
	let StdTmR = (288.15-6.5*AltIdx)/288.15;
	let StdPrR = Math.pow(StdTmR,5.2559);
	let AltTmp = BegTmp-6.5*AltIdx;	// Actual Temperature (using standard lapse rate)
	let AltTmR = AltTmp/288.15;	// Actual Temperature Ratio	
	//- Air Density Value
	let	AirDSL = 1.225*StdPrR/AltTmR;
return AirDSL}

// Compute Indicated Airspeed
function AirIAS(AirDSL,SpdKPH) {
	let AirDnR = AirDSL/1.225;
	let SpdIAS = SpdKPH*Math.sqrt(AirDnR);
return SpdIAS}

//- Geometric Conversions ------------------------------------------------------

//  Converts degrees to 360
function Mod360(deg) {
	while (deg < 0) deg = deg+360; // Make deg a positive number
	deg = deg % 360;			// Compute remainder of any number divided by 360
return deg;}

//  Converts 360 degrees to +/- 180
function PoM360(deg) {
	if (deg > 180) deg = deg-360;
return deg;}

//- Limit Maximum +/- Value
function MaxVal(x, max) {
	if (x > 0 && x >  max) x =  max;
	if (x < 0 && x < -max) x = -max;
return x;}

//- Make Mesh ------------------------------------------------------------------
function makMsh() {
	let geometry = new BoxGeometry(0.01,0.01,0.01); 
	let material = new MeshBasicNodeMaterial({colorNode:color("black"),transparent:true,opacity:0});
	let mesh = new Mesh(geometry,material);
return mesh;}

export {Flight, Mod360, PoM360, MaxVal, makMsh};

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
 * 240815:	Added Autopilot
 * 240913:	Converted to Class.
 * 240925:	Added Air Density and IAS comps
 * 240927:	Deleted rotLLD (since can used spherical to rotate vector)
 * 241006:	Add adjustment for Ship Pitch [REQUIRED VERSON CHANGE TO 4a]
 * 241012:  Change makMsh to NodeMaterial and add color
 * 241012:	Add adjustment for Ship Bank (just in case)
*/
/*
 * ACflyt.js (vers 20.12.04)
 * Copyright 2017-20, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * This file contains variables and functions for 3D Flight.
 * The primary functions are: InitFlyt(Obj) and RoteFlyt(Obj)
 * where Obj is the address of the aircraft object.
 * The primary inputs are listed below and in the separate aircraft data file.
 * See http://philcrowther.com/Aviation/ACflyt.htm for more details.
 */

/* = PRIMARY USER INPUTS =====================================================*/
let	SupPct = 0;							// Percent of Supplemental Power (War Enmergency or Afterburner)
let	CfLift = 0;							// Coefficient of Lift (user input) - determines lift
let	CfFlap = 0;							// Coefficient of Lift due to flaps (user input)
let	ACPDif = 0;							// Change in Pitch (user input) - determines pitch [NEW]
let	ACBDif = 0;							// Change in Bank (user input) - determines bank
let	YawDif = 0;							// Change in Yaw (user input) - determines yaw
let	FlpPct = 0;							// Percent of Flaps
let	LngPct = 0;							// Percent of Landing Gear
let	BrkPct = 0;							// Percent of Air Brakes
let	SplPct = 0;							// Percent of Spoiler

/* = INTERNAL VARIABLES ======================================================*/
let	USorSI = "US";						// Default Units of Measurement (US or SI)
/*	Math Predefined */
let	PieVal = Math.PI;					// PI
let	DegRad = Math.PI / 180;				// Convert Degrees to Radians
let	RadDeg = 180 / Math.PI;				// Convert Radians to Degrees
let Ft2Mtr = .3048;						// Convert Feet to Meters
let Mtr2Ft = 3.28084;					// Convert Meters to Feet
let	SmallV = .0001;						// Small value added to prevent errors
/*	Defaults */
let	GrvUPS = 32.174;					// Gravity (fps)
let	AirDSL = 0.0765;					// Density (Sea Level Value) (US units)
let	AirDen = AirDSL / GrvUPS;			// Density (Sea Level Value) (slugs)
let	ACDrGF = 0.08;						// Rolling Drag s/b firm turf (.02 concrete, .06 soft turf)
/*	Time */
let	DLTime = 1/60;						// Delta Time (1/60 seconds)
let	DLTim2 = 0;							// Time ^ 2
//	Aircraft
let	DirFlt = 0;						// Direction of Flight
/*	Inputs */
let AltDif = 0;
/*	Orientation */
let	ACBank = 0;							// Aircraft Bank = Aircraft Bank Relative to Horizon (0 to 360)
let	ACPtch = 0;							// Aircraft Pitch = Aircraft Pitch Relative to Horizon (-90 to +90)
let	ACHead = 0;							// Aircraft Heading = Compass Heading of Aircraft (0 to 360)
/*	Vectors */
let	PAccZS = 0;							// Acceleration - Forward (distance/s2)
let	PAccXS = 0;							// Acceleration - Lateral (distance/s2)
let	PAccYF = 0;							// Acceleration - Vertical (distance/t)
let	PSpdZS = 0;							// Speed - Forward (distance/s)
let	PSpdXS = 0;							// Speed - Lateral (distance/s)
let	PSpdYF = 0;							// Speed - Vertical (distance/t)
/*	Speed */
let	SpdUPH = 0;							// Aircraft Speed (units per hour)
let	SpdUPS = 0;							// Aircraft Speed (FPS)
let	SpdDLT = 0;							// Aircraft Speed (DLT)
/*	Map Speed and Position */
let	MSpdZS = 0;							// Map Speed Z (distance/second)
let	MSpdXS = 0;
let	MSpdYS = 0;
let	MSpdZV = 0;							// Map Speed Z (distance/frame)
let	MSpdXV = 0;
let	MSpdYV = 0;
let	MPosZV = 0;							// Map Position Z-Axis (North)
let	MPosXV = 0;
let	MPosYV = 0;							// Altitude (default)
/*	Ground Level */
let	GrdZed = 0;							// Ground level (SL = 0)
let LokFlg = 0;							// If locked to moving object
/* Constants */
let	ACPMax = 0;							// Max aircraft pitch adjustment (+/- 15)
let	ACPInc = 0;							// Net max aircraft pitch adjustment (10)
let	TDrAdj = 0;							// Pitch change required for taildragger (7.5)
/*	More Variables */
let	GrFlag = 0;							// Ground Flag (1 = on ground)
let	ACPAdj = 0;							// Aircraft pitch adjustment
let	AuFlag = 0;							// Flag for Auto Tail Up/Down
let	SpFlag = 0;							// If Sitting on a Moving Object
/*	Shared Values */
let VectRX, VectRY, VectRZ;				// Used in RoteVec
/*	Frequently Used Value */
let	XRad;
let MinAlt;
/*	PointerLock Variables */
let MosXDf = 0;
let MosYDf = 0;

/* = AIRCRAFT DATA ===========================================================*/
/* - Controls (if using direct inputs) ---------------------------------------*/
let	MxBnkR = 0;							// Maximum bank rate
let	BnkMul = 0;							// Standard bank multiplier
let	MxPitR = 0;							// Maximum pitch rate
let	PitMul = 0;							// Standard pitch multiplier
/*-	Advanced Movement Vectors -----------------------------------------------*/
// Thrust - Prop Only
let	PwrMax = 0;							// Prop Maximum Power (BHP) [NA]
let	WEPMax = 0;							// War Emergency Power (BHP) [NA]
let	PropEf = 0;							// Prop Efficiency [NA]
// Thrust - Jet Only
let	JetMax = 0;							// Jet Maximum Thrust (lb) [NA]
let	AftMax = 0;							// Jet Afterburner Maximum Thrust (lb) [NA]
// Thrust - Helicopter
let	HelMax = 0;							// Helicopter Maximum Thrust (lb)
// Other Unit Values
let	Weight = 0;							// Aircraft Weight (lbs)
let	FrntAr = 0;							// Frontal Area (ft2)
let	MinAGL = 0;							// Minimum altitude AGL (ft)
// Other Non-Unit Values
let	CfLMax = 0;							// Maximum Coefficient of Lifr [NA]
let	WingEf = 0;							// Wing Efficiency [NA]
let	DrgCd0 = 0;							// Coefficient of Drag (Total)
let	DrgCdf = 0;							// Coefficient of Drag - Flaps [NA]
let	DrgCdg = 0;							// Coefficient of Drag - Gear
let	DrgCdb = 0;							// Coefficient of Drag - Airbrake [NA]
let	DrgCds = 0;							// Coefficient of Drag - Spoiler [NA]
let	GrvMax = 0;							// Maximum G-Force
let	AngInc = 0;							// Angle of Incidence
let	TrmAdj = 0;							// Elevator Trim Adjustment
// Landing Gear
let	Ax2CGD = 0;							// Axle to CG distance (ft)
let	Ax2CGA = 0;							// Axle to CG angle (deg)
let	WheelR = 0;							// Wheel radius (ft)
// Flaps/Spoiler
let	FlpCfL = 0;							// Max Flap Cfl [NA]
let	SplCfL = 0;							// Max Spoiler [NA]
// Taildragger
let	TDrAng = 0;							// Taildragger Max Angle (deg)
let	TDrSpd = 0;							// Speed at which tail lifts (mph) [NA]
/*-	Starting Values ---------------------------------------------------------*/
let	BegAGL = 0;							// See AHData
let	GrdAlt = 0;							// See AHData
let	BegPit = 0;							// Default Pitch
let	BegHdg = 0;							// Default Heading
let	BegBnk = 0;							// Default Bank

/*	= AIRCRAFT VALUES =========================================================*/
/*	Constant Constants */
let	ACMass = 0;							// Mass (slugs or kg)
let WingSp = 0;
let WingAr = 0;
let WingAs = 0;
/*	Premultiplied Constants */
let	ThrstK = 0;							// Thrust (US units)
/*	Persistent Variables */
let	GrACPD = 0;							// Downward Pitch Due to Gravity - Degrees
let	ACThrG = 0;							// Net Thrust Accel after Gravity
/*	Dual Variables with Initial Values */
//	Time Variable
let	GrvDLT = 0;							// Gravity (upt)
let	FrcAcc = 0;							// Convert Force to Acceleration
//	Aerodynamics
let	DynPrs = 0;	// Dynamic Pressure
let	DrgCdi = 0;							// Coefficient of Induced Drag
let	DrgCdp = 0;							// Coefficient of Parasitic Drag

/*	= KEYBOARD ASSIGNMENTS ====================================================*/
let	K_AltU = 81;						// Altitude Up (q)
let	K_AltD = 87;						// Altitude Dn (w)
let	K_PitU = 40;						// Pitch up (down arrow)
let	K_PitD = 38;						// Pitch down (up arrow)
let	K_BnkL = 37;						// Bank Left (left arrow)
let	K_BnkR = 39;						// Bank Right (right arrow)
let	K_YawL = 90;						// Yaw Left (z)
let	K_YawR = 88;						// Yaw Right (x)
let	K_Door = 68;						// Door (d)
let	K_VU45 = 36;						// View Up (alone or modifier)
let	K_VD45 = 35;						// View Down (alone or modifier)
let	K_VL45 = 45;						// Left 45 degrees
let	K_VR45 = 33;						// Right 45 degrees
let	K_VL90 = 46;						// Left 90 degrees
let	K_VR90 = 34;						// Right 90 degrees
let	K_Look = 16;						// Pan (shift)
let	K_Soun = 83;						// Toggle sound (s)
let	K_Info = 73;						// Info (i)
let	K_Paws = 80;						// Pause (p)

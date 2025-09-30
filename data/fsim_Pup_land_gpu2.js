//= PRE-LOAD DATA ==============================================================
//	No three.js routines allowed since three.js has not been loaded yet.

/*******************************************************************************
*
*	INDEX TO VARIABLES
*
*******************************************************************************

	1. MAIN VARIABLES
	   Constants
	   Input Values					(gen_)
	   Fad2Black					(f2b_)
	2. SKY VARIABLES				(sky_)
	3. OCEAN GRID VARIABLES
		GRDWTR MODULE				(grd_)
		OCEAN MODULE				(wav_)
	4. OBJECT VARIABLES
		SHARED TEXTURES				(txt_)
		STATIC OBJECTS
			Mountains/Islands		(mnt_)
			Fixed Objects			(fxd_)
		MOVING VEHICLES
			Moving Airplanes		(xac_)
			Moving Ships			(xsh_)
		ANIMATED FLAG				(flg_)
		AIRPLANE EXPLOSION			(xae_)
	    SMOKE MODULE
	    	Volcano Smoke			(grs_)
	    	Ground Fire				(grf_)
	    	Airplane Smoke Trail	(xas_)
	    	Airplane Fire Trail		(xaf_)
	    	Ship Wakes				(wak_)
		MYPEOPLE					(myp_)
		MYCREW						(myc_)
		MINIMUM ALTITUDE			(alt_)
	5. MY AIRPLANE VARIABLES		(air_)
		FLIGHT MODULE
		ANIMFM2 MODULE				(anm_,mxr_,vxr_)
	x. GUNASG MODULE
			My Guns					(myg_)
			Moving Airplanes		(xag_)
			Moving Ships			(xsg_)
			Fixed Guns				(aaf_)
	6. SOUND VARIABLES
		My Sounds					(mys_)
		Radio Variables				(rad_)
	7. CAMERA VARIABLES				(cam_)
	8. OUTPUT VARIABLES
	9. INPUT VARIABLES
	   Pointer Lock Control
*/

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

//= 1. MAIN VARIABLES ==========//==============================================

//- CONSTANTS ------------------//----------------------------------------------
//	Conversions
const DegRad = Math.PI/180;		// Convert Degrees to Radians
const RadDeg = 180/Math.PI;		// Convert Radians to Degrees
const Ft2Mtr = 0.3048;			// Convert Feet to Meters
const Mtr2Ft = 1/Ft2Mtr;		// Meters to Feet
const Km2Mil = 0.621371;		// Kilometers to Miles
const Mil2Km = 1.60934;			// Miles to Kilometers
const MtrMil = 1609.34;			// Meters per Mile
//	Environmental
const GrvMPS = 9.80665; 		// Gravity (mps)
const BegTmp = 288.15;			// K = 59F (loaded into _air)
// These values could also be used by modules, but that would require that all 
// module users also create a data file - which complicates the use of modules.

//- GENERAL VARIABLES ----------//----------------------------------------------

let gen_ = {
		// Flght Controls
		PwrMul:	0.0005,			// Power % Input - Mouse Multiplier
		PwrDif:	0,				// Power % Input - Value
		InpBrk:	0,				// Brakes
		//- Display
		PawsOn:	0,				// Pause
		InfoOn:	0,				// Info
		SndFlg:	0,				// Sound (0 = off; 1 = on)
		StatOn:	1,				// Stats (0 = off, 1 = on)
		LnFFlg:	1,				// Lensflare
		// Program Flags
		LodFlg:	0,				// Set at end of initialization
		LodSnd:	0,				// Set when sound initialized
		MYGFlg:	0,				// My Guns (1 = firing)
		// Altitude Adjustment
		AltAdj:	0.99,			// Raises objects above map as altitude increases
		AltDif:	0,
		// Misc
		contxt: 0,
		canvas: 0,
		maxAns: 0,
	}

let tim_ = {
		DLTime: 1/60,
		DLTim2: 0,
		GrvDLT: 0,
		NowTim: 0,
		DifTim: 0,
	}

//- Fade2Black Values -----------//----------------------------------------------
//	If FadBeg > 0, Prop Invisible.
//	Therefore, limit use to where Prop would be invisible.
let f2b_ = {
		Flr: 0.25,
		Beg: 0.99,
		End: 0.25,
		Spd: 0.005,
		Mat: 0,
		Col: "black",
		Msh: 0,
	}

//= 2. SKY VARIABLES ===========//==============================================
let sky_ = {
		// Sun
		SunCol: "white",		// Sun
		SunInt: 3,
		// Fog
		FogCol: 0xbab4a6,		// Sky (for Fog only)
		// SkyBox
		SBxSrc: "https://PhilCrowther.github.io/Aviation/textures/cube/skyboxsun25deg/",
		envMap: 0,				// For this SkyBox
		// Sun (position in SkyBox)
		SunLat: 23,				// Direction - Vert (+/- 90) deg
		SunLon: 312,			// Direction - Horz (0->360) deg
		//	LensFlare		
		LF0Src: "https://PhilCrowther.github.io/Aviation/textures/fx/lensflare1.png",
		LF1Src: "https://PhilCrowther.github.io/Aviation/textures/fx/lensflare3.png",
		LF0Txt: 0,
		LF1Txt: 0,
		// Shadow Beg Info
		SunDst: 50,				// Distance
		ShdBox: 6,				// Size of shadow box
		ShdBLR: 6.5,
		ShdBTB: 4,
		ShdDst: 1500,			// Shadow Distance (meters)
	}

//= GRID MODULE ================//==============================================
//	This Map has 3 nested grids of squares.
//	Grid0 has 16x16 squares, each of size GrdSiz (e.g. 1 mile, range = 8 miles)
//	Grid1 has 16x16 squares, each of size GrdSi*4z (e.g. 4 miles, range = 32 miles)
//	Grid2 has 16x16 squares, each of size GrdSiz*16 (e.g. 16 miles, range = 128 miles))
let GrdSiz = 804.67;			// Size of Smallest Grid Square (1/4 section = 1/2 mile)
let grids = 0;
let grd_ = {
		SPS: 0,					// MSX, MPY, MSZ (meters) (from Flight)
		RCs: 27,				// Squares in each of first 2 grids
		Siz: GrdSiz,			// Size of smallest square
		Stp: 3,					// Squares in each of first 2 grids
		Grx: [],				// Index of Grids (0-2)
		Idx: [0],				// Index to Patterns
		Mat: [0],				// Index to Materials
	}

//= Roads =====================//===============================================
//- Materials
let rd0_ = {
		rodclr: [0xd0b894,0x8e6d3d], // Colors
		//-	Tones of Dirt Brown Color | #836539 Monochromatic Color
		//-	0xefe7db, 0xe0cfb7, 0xd0b894, 0xc1a070, 0xb1884d, 0x8e6d3d, 0x6a522e, 0x47361e
		r0Size: 32,
		r0Data: 0,
		txtrod: 0,
	}
//- North/South
let rd1_ = {
		Typ:	1,
		RCs:	21,				// Rows and Columns - use odd number (for now = divisible by 3)
		Siz:	2*GrdSiz,		// Size of square
		Stp:	1,				// Squares to flip
		RCi:	0,				// Rows and Columns Index (computed)
		MZV:	[0],			// Ground Z Value
		MXV:	[0],			// Ground X Value
		Nor:	0,				// Max North Square (updated)
		Est:	0,				// Max East Square (updated)
		Num:	0,				// Size of array (computed)
		Ptr:	[0],			// Ground Address
		Txt:	0,				// Texture Address
		Shd:	1				// Shadow enabled
	}
//- East West
let rd2_ = {
		Typ:	2,
		RCs:	21,				// Rows and Columns - use odd number (for now = divisible by 3)
		Siz:	2*GrdSiz,		// Size of square
		Stp:	1,				// Squares to flip
		RCi:	0,				// Rows and Columns Index (computed)
		MZV:	[0],			// Ground Z Value
		MXV:	[0],			// Ground X Value
		Nor:	0,				// Max North Square (updated)
		Est:	0,				// Max East Square (updated)
		Num:	0,				// Size of array (computed)
		Ptr:	[0],			// Ground Address
		Txt:	0,				// Texture Address
		Shd:	1				// Shadow enabled
	}

//= Trees ======================//==============================================

let tre_ = {
		treclr: [0x75b24c,0x2e471e], // Colors
		//	Hot Pepper Green ( similar ) Color | 568338 Monochromatic Color
		//	0xe3efdb, 0xc7e0b7, 0xacd193, 0x90c170, 0x75b24c, 0x5d8e3d, 0x466b2d, 0x2e471e
		t0Size: 128,
		t0Data: 0,
		txttre: 0,
		TreTot: 64,
		t0Tree: [],
		t0PosZ: [],
		t0PosX: [],
}

//= STATIC OBJECTS =============//==============================================
//- Islands --------------------//----------------------------------------------
let mnt_ = {
		ObjNum: 1,
		ObjSrc: ["https://PhilCrowther.github.io/Aviation/scenery/models/giaros.glb"],
		ObjTxt: ["https://PhilCrowther.github.io/Aviation/scenery/textures/giaros.png"],
		ObjAdr: [],
		ObjSiz: [3.75*MtrMil], // Scale
		RndOrd: [0],			// renderOrder (not used)
		ObjRot: [0],			// Rotation
		MapPos: [0],			// Absolute Position
		ObjGrp: [0],			// Group
		AltMul: [0.99],			// Altitude Adjustment // ### 250929
		VrtAdj: [-25]			// Vertical Adjustment // ### 250930
	};
//- Static Objects -------------//----------------------------------------------
//- 0 = Hangar;
let fxd_ = {
		ObjNum: 1,
		ObjSrc: ["https://PhilCrowther.github.io/Aviation/scenery/models/hangar.glb"],
		ObjTxt: [0],
		ObjAdr: [0],			// Loaded Object
		ObjSiz: [Ft2Mtr],		// Scale
		RndOrd: [0],			// renderOrder
		ObjRot: [0],			// Rotation
		MapPos: [0],			// Relative Position
		ObjRef: [0],			// Parent
	};

//= 5. MY AIRPLANE VARIABLES ===//==============================================
let	flight = 0;
let air_ = {
		// General Variables
		DLTime: tim_.DLTime,	// Seconds per frame (can vary)
		GrvMPS: GrvMPS,			// Gravity (ups)
		AirDSL: 0,				// Air Density (varies with altitude)
		// Designators
		AirDat: 0,				// Aircraft Type: 1 = Pup
		// Airplane Rotation: Vertical Angle, Horizontal Angle, Bank Angle
		AirRot: 0,				// Rotation (in degrees)
		AirObj: 0,				// Airplane Object 
		AirPBY: 0,				// Changes in radians
		// Changes to Airplane Pitch Bank and Yaw
		RotDif: 0,				// Change
		// Airplane Speed
		SpdKPH: 0,				// Speed in KPH
		SpdMPS: 0,				// Speed - meters per second
		SpdMPF: 0,				// Speed - meters per frame	
		// Airplane Map Speed and Position
		MapSpd: 0, 				// Map Speed (meters)
		MapPos: 0, 				// Map Position (meters)
		MapSPS: 0, 				// MSX, MPY, MSZ (meters)
		// Variables Obtained from Flight
		PwrPct: 0,				// % of Primary Power (0 to 1) (Main and Flight)
		SupPct: 0,				// Percent of Supplemental Power (War Enmergency or Afterburner)
		CfLift: 0,				// Coefficient of Lift (user input) - determines lift
		CfFlap: 0,				// Coefficient of Lift due to flaps (user input)
		FlpPct: 0,				// Percent of Flaps
		LngPct: 0,				// Percent of Landing Gear
		BrkPct: 0,				// Percent of Air Brakes
		SplPct: 0,				// Percent of Spoiler
		AGBank: 0,				// Aileron Bank on Ground
		BrkVal: 0,				// Brakes
		GrdZed: 0,				// Ground level (default)
		GrdFlg: 0,				// Ground Flag (1 = on ground)
		ACPAdj: 0,				// Airplane pitch adjustment
		// Values for the Selected Airplane Type (obtained from Flight)
		CfLMax: 0,				// Maximum Coefficient of Lift
		FlpCfL: 0,				// Max Flap Cfl (0.2*CfLMax)
		ACMass: 0,				// Airplane Mass
		Weight: 0,				// Used by autopilots
		PYBmul: 0, 				// Airplane Pitch/Yaw/Bank Multiplier
		BnkMax: 0,				// Maximum bank rate
		// AutoPilot - Additional Variables
		AutoOn: 0,				// Autopilot Flag
		InpKey: 0, 				// Inputs - Keys (replace InpKey)
		OldRot: 0, 				// Old Rotation (z = radians)
		CfLDif: 0,				// Change in CfL
		MaxBnk: 0,				// Max Bank (display only)
		HdgDif: 0,				// Horizontal Turn Rate (display only)
		// Air Density and IAS Comps
		BegTmp: BegTmp,			// Beginning Sea Level Temperature (K)
		BegPrs: 1013.25,		// Beginning Sea Level Air Pressure (mB) - not used
		SpdIAS: 0,				// Indicated Airspeed
		// Ship Pitch and Bank
		MovFlg: 0,				// If Sitting on Moving Ship
		ShpPit: 0,
		ShpBnk: 0,
	}

//= MY AIRPLANE ================//==============================================
//- Load Models and Animations -------------------------------------------------
//-	File Path
let AirSrc = "https://PhilCrowther.github.io/Aviation/models/pup/";	// Used to load models and sounds
//-	Animation Mixers - External Model
let mxrFNm = "pup_flyt_npa.glb"; // Name of aircraft model file (rotated blender file)

//- Pup Animations -------------------------------------------------------------
let anmfps = 24;				// Blender FPS (used by Main Program and all modules (used by Objects.js)
let anm_ = {
		anmfps: anmfps,
		spnprp: 180,			// SpinProp 	degrees = 0 to 360
		rudder: 180,			// Rudder 		degrees = +/- 360
		elvatr: 180,			// Elevator 	degrees = +/- 360
		aillft: 180,			// AileronL 	degrees = +/- 360
		ailrgt: 180,			// AileronR 	degrees = +/- 360
	}
//	Animation Mixers - External Model
let mxr_ = {
		// Source
		Src: AirSrc + mxrFNm,
		// Address
		Adr: 0,
		// Prop, Rudder, Elevator, AileronL, AileronR,  FlapL, FlapR
		Prp:0, Rdr:0, Elv:0, ATL:0, ATR:0, ABL:0, ABR:0,
	}

//= GUNASG MODULE ==============//==============================================
//	Lewis .303 caliber
//	BulSpd = 744;				// Muzzle velocity [mps]
//	BulDLT = 0.5;				// Bullet Maximum Time in Flight

//- My Guns --------------------//----------------------------------------------
let myg_ = {
		// Data
		BulSpd: 744,			// Muzzle Velocity (mps)
		BulDLT: 0.5,			// Max Bullet Time in Flight
		BulNum: 16,				// Number of Tracers
		BulSpc: 0.125,			// Bullet Spacing (4*BulDLT/BulNum)
		BulSp2: 0.125,			// Bullet Spacing - time remaining
		// Object
		BulClr: 0,				// Red (Vector2)
		BulPtr: [0],			// Bullet Objects
		BulMpS: [0],			// Bullet Speed
		BulTim: [0],			// Bullet Time in Flight
		// Sound
		ObjNum: 1,				// Number of Barrels
		ObjPos: [0],			// Position of Each Barrel
		SndSrc: 0,				// File (my guns)
		SndPtr: [0],			// For Each Gun
		SndVol: 0.5,			// Volume
		SndMsh: [0],			// For Each Gun
		// HitBox
		HitTgt: 1,				// Hit Target (1 = enemy airplane)
		HitDst: 10,				// Hit Radius
	}

//=	MY SOUNDS ==================//==============================================
let mys_ = {
		AirMsh:	0,				// For Engine and Prop
		// Engine Sound - Idle
		IdlSrc: AirSrc + "sounds/xrpm1.wav",
		IdlSnd: 0,				// Address
		IdlVol: 0.5,			// Volume
		// Engine Sound	
		EngSrc: AirSrc + "sounds/pup.mp3",
		EngSnd: 0,				// Address
		EngVol: 0.2,			// Volume
	}

//= 8. OUTPUT VARIABLES ========//==============================================

//- HTML OVERLAY TEXT ----------//----------------------------------------------
let Air_PwrElement = document.getElementById("Air_Pwr");
let Air_PwrNode = document.createTextNode("");
	Air_PwrElement.appendChild(Air_PwrNode);
let Air_SpdElement = document.getElementById("Air_Spd");
let Air_SpdNode = document.createTextNode("");
	Air_SpdElement.appendChild(Air_SpdNode);
let Air_HdgElement = document.getElementById("Air_Hdg");
let Air_HdgNode = document.createTextNode("");
	Air_HdgElement.appendChild(Air_HdgNode);
let Air_AltElement = document.getElementById("Air_Alt");
let Air_AltNode = document.createTextNode("");
	Air_AltElement.appendChild(Air_AltNode);
let Air_CfLElement = document.getElementById("Air_CfL");
let Air_CfLNode = document.createTextNode("");
	Air_CfLElement.appendChild(Air_CfLNode);
let On_PawsElement = document.getElementById("On_Paws");
let On_PawsNode = document.createTextNode("");
	On_PawsElement.appendChild(On_PawsNode);
let Air_AtPElement = document.getElementById("Air_AtP");	// Autopilot
let Air_AtPNode = document.createTextNode("");
	Air_AtPElement.appendChild(Air_AtPNode);
let On_Inf0Element = document.getElementById("On_Inf0");
let On_Inf0Node = document.createTextNode("");
	On_Inf0Element.appendChild(On_Inf0Node);
let On_Inf1Element = document.getElementById("On_Inf1");
let On_Inf1Node = document.createTextNode("");
	On_Inf1Element.appendChild(On_Inf1Node);
let On_Inf2Element = document.getElementById("On_Inf2");
let On_Inf2Node = document.createTextNode("");
	On_Inf2Element.appendChild(On_Inf2Node);
let On_Inf3Element = document.getElementById("On_Inf3");
let On_Inf3Node = document.createTextNode("");
	On_Inf3Element.appendChild(On_Inf3Node);
let On_Inf4Element = document.getElementById("On_Inf4");
let On_Inf4Node = document.createTextNode("");
	On_Inf4Element.appendChild(On_Inf4Node);
let On_Inf5Element = document.getElementById("On_Inf5");
let On_Inf5Node = document.createTextNode("");
	On_Inf5Element.appendChild(On_Inf5Node);
let On_Inf6Element = document.getElementById("On_Inf6");
let On_Inf6Node = document.createTextNode("");
	On_Inf6Element.appendChild(On_Inf6Node);
let On_Inf7Element = document.getElementById("On_Inf7");
let On_Inf7Node = document.createTextNode("");
	On_Inf7Element.appendChild(On_Inf7Node);
let On_Inf8Element = document.getElementById("On_Inf8");
let On_Inf8Node = document.createTextNode("");
	On_Inf8Element.appendChild(On_Inf8Node);
//
let Air_Pwr, Air_Spd, Air_Hdg, Air_Alt, Air_CfL;
let On_Paws, On_Inf0, On_Inf1, On_Inf2, On_Inf3, On_Inf4, On_Inf5, On_Inf6, On_Inf7, On_Inf8;

//= 9. INPUT VARIABLES =========//==============================================

//- DEFAULT KEY BINDINGS -------//----------------------------------------------
let key_ = {
		PwLU:  87,				// Power Up (w) - keyboard left
		PwLD:  81,				// Power Down (q) - keyboard left
		PwRU: 187,				// Power Up (=) - keyboard right
		PwRD: 189,				// Power Down (-) - keyboard right
		BnkL:  37,				// Bank Left (left arrow) - autopilot only
		BnkR:  39,				// Bank Right (right arrow) - autopilot only
		PitU:  40,				// Pitch up (down arrow) - autopilot only
		PitD:  38,				// Pitch down (up arrow) - autopilot only
		YwLL:  90,				// Yaw Left (z) - keyboard left
		YwLR:  88,				// Yaw Left (x) - keyboard left
		YwRL: 188,				// Yaw Left (,) - keyboard right
		YwRR: 190,				// Yaw Left (.) - keyboard right
		Brak:  66,				// Brakes (b)
		Guns:  32,				// Guns (spacebar)
		//	Views
		Look:  16,				// Pan (shift)
		VU45: 104,				// View Up (alone or modifier)
		VD45: 101,				// View Down (alone or modifier)
		VL45: 103,				// Left 45 degrees
		VR45: 105,				// Right 45 degrees
		VL90: 100,				// Left 90 degrees
		VR90: 102,				// Right 90 degrees
		//	Toggle
		Soun:  83,				// Toggle sound (s)
		Paws:  80,				// Pause (p)
		Auto:  65,				// Autopilot (a)
		Info:  73,				// Info (i)
		// Flags
		U45flg: 0,				// Up 45 degrees
		D45flg: 0,				// Down 45 degrees
		L45flg: 0,				// Left 45 degrees
		R45flg: 0,				// Right 45 degrees
		L90flg: 0,				// Left 90 degrees
		R90flg: 0,				// Right 90 degrees
};

//- POINTER LOCK CONTROL -------//----------------------------------------------
//	Variables
let InpMos = 0;					// Mouse Inputs
let _changeEvent = {type: "change"};
let _lockEvent = {type: "lock"};
let _unlockEvent = {type: "unlock"};

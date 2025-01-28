//= PRE-LOAD DATA ==============================================================
//	No three.js routines allowed since three.js has not been loaded yet.

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
const GrvMPS = 9.80665; 		// Gravity (mps)
// These values could also be used by modules, but that would require that all 
// module users also create a data file - which complicates the use of modules.

//= 5. MY AIRPLANE VARIABLES ===//==============================================

//- FM2 Animations -------------------------------------------------------------
//	Animation Positions (all range from 0 to 360 with center at 180)
let anm_ = {
		anmfps: 0,				// Blender FPS
		spnprp: 180,			// SpinProp 	degrees = 0 to 360
		rudder: 180,			// Rudder 		degrees = +/- 360
		elvatr: 180,			// Elevator 	degrees = +/- 360
		aillft: 180,			// AileronL 	degrees = +/- 360
		ailrgt: 180,			// AileronR 	degrees = +/- 360
		flppos: 180,			// Flaps 		degrees = 0 to 180
		lngpos: 0,				// Landing Gear degrees = 0 to 180
		canpos: 180,			// Canopy 		degrees = 0 to 180
		thkpos: 180,			// Tailhook 	degrees = 0 to 180
		cmphdg: 0,				// Compass Heading
		atiarr: 180,			// Attitude - Arrow
		atibnk: 0,				// Attitude - Bank
		atipit: 180,			// Attitude - Pitch
		altft0: 0,				// Altitude - feet
		altft1: 0,				// Altitude - feet X 1000
		spdmph: 0,				// Speed - MPH
		vsifpm: 0,				// Vertical Speed - fpm
		manprs: 0,				// Manifold Pressure
		rpmprp: 0,				// Propeller RPM
		hdgdif: 180,			// Change in heading
		yawval: 180,			// Slip indicator
		stkpit: 180,			// Joystick pitch
		stkpcm: 0,				// cumulative
		stkbnk: 180,			// Joystick bank
		stkbcm: 0,				// cumulative
		vchead: 0,				// Pilot head
		// Gear and Flap					
		lngspd: 0,				// Change in Gear
		flpspd: 0,				// Change in Flaps
		canspd: 0,				// Change in Canopy
		thkspd: 0,				// Change in Canopy
		// Flags
		lngflg: 0,				// Gear (up.down)
		flpflg: 0,				// Flap (up/down)
		canflg: 0,				// Canopy (up/down)
		thkflg: 0,				// Tailhook (up/down)
	}

//= 8. OUTPUTS VARIABLES =======//==============================================

//- HTML OVERLAY TEXT ----------//----------------------------------------------
let Air_PwrElement = document.getElementById("Air_Pwr"); // Power
let Air_PwrNode = document.createTextNode("");
	Air_PwrElement.appendChild(Air_PwrNode);
let Air_SpdElement = document.getElementById("Air_Spd"); // Speed
let Air_SpdNode = document.createTextNode("");
	Air_SpdElement.appendChild(Air_SpdNode);
let Air_AltElement = document.getElementById("Air_Alt"); // Altitude
let Air_AltNode = document.createTextNode("");
	Air_AltElement.appendChild(Air_AltNode);
let Air_HdgElement = document.getElementById("Air_Hdg"); // Heading
let Air_HdgNode = document.createTextNode("");
	Air_HdgElement.appendChild(Air_HdgNode);
let Air_CfLElement = document.getElementById("Air_CfL"); // CfLift
let Air_CfLNode = document.createTextNode("");
	Air_CfLElement.appendChild(Air_CfLNode);
let On_PawsElement = document.getElementById("On_Paws"); // Pause
let On_PawsNode = document.createTextNode("");
	On_PawsElement.appendChild(On_PawsNode);
let Air_AtPElement = document.getElementById("Air_AtP"); // Autopilot
let Air_AtPNode = document.createTextNode("");
	Air_AtPElement.appendChild(Air_AtPNode);
let On_Inf0Element = document.getElementById("On_Inf0"); // Info
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
let On_Inf9Element = document.getElementById("On_Inf9");
let On_Inf9Node = document.createTextNode("");
	On_Inf9Element.appendChild(On_Inf9Node);
//
let Air_Pwr,Air_Spd,Air_Hdg,Air_Alt,Air_CfL;
let On_Paws,Air_AtP;
let On_Inf0,On_Inf1,On_Inf2,On_Inf3,On_Inf4,On_Inf5,On_Inf6,On_Inf7,On_Inf8,On_Inf9;

//- Info Text ------------------------------------------------------------------
let InfoData = [
		[
			"Info : Press I","","","","","","","","",""
		],
		[
			"",
			"CONTROLS",
			"Mouse changes Pitch/Bank and Yaw (bottons)",
			"AutoPilot: Arrow Key change Pitch and Bank",
			"Mouse Wheel or -/= Keys change Throttle",
			"G Key toggles landing gear",
			"F Key toggles flaps",
			"S Key toggles sound",
			"Spacebar fires guns"
		],
		[
			"",
			"VIEW KEYS",
			"V Key toggles views",
			"Shift Key and Mouse orbits around airplane",
			"END Key looks down",
			"DELETE or PAGE DOWN Keys look left/right",
			"HOME Key and above Keys look up",
			"END Key and DELETE or PAGE DOWN Keys look back",
			"All 3 Keys look back"
		]
	];


//= 9. INPUTS VARIABLES ========//==============================================

//- DEFAULT KEY BINDINGS -------//----------------------------------------------
//	Basic
const K_PwLU =  87;				// Power Up (w) - keyboard left
const K_PwLD =  81;				// Power Down (q) - keyboard left
const K_PwRU = 187;				// Power Up (=) - keyboard right
const K_PwRD = 189;				// Power Down (-) - keyboard right
const K_BnkL =  37;				// Bank Left (left arrow) - autopilot only
const K_BnkR =  39;				// Bank Right (right arrow) - autopilot only
const K_PitU =  40;				// Pitch Up (down arrow) - autopilot only
const K_PitD =  38;				// Pitch Down (up arrow) - autopilot only
const K_YwLL =  90;				// Yaw Left (z) - keyboard left
const K_YwLR =  88;				// Yaw Left (x) - keyboard left
const K_YwRL = 188;				// Yaw Left (,) - keyboard right
const K_YwRR = 190;				// Yaw Left (.) - keyboard right
const K_Brak =  66;				// Brakes (b)
const K_Guns =  32;				// Guns (spacebar)
//	Additional
const K_Flap =  70;				// Flaps (f)
const K_Gear =  71;				// Landing Gear (g)
const K_Hook =  72;				// Tailhook (h)
const K_Canp =  67;				// Canopy (c)
//	Views
const K_Look =  16;				// Orbit (shift)
const K_VU45 =  36;				// View Up (alone or modifier)
const K_VD45 =  35;				// View Down (alone or modifier)
const K_VL45 =  33;				// Left 45 degrees
const K_VR45 =  45;				// Right 45 degrees
const K_VL90 =  34;				// Left 90 degrees
const K_VR90 =  46;				// Right 90 degrees
//	Toggle
const K_View =  86;				// Toggle Visibility (v)
const K_Soun =  83;				// Toggle sound (s)
const K_Paws =  80;				// Pause (p)
const K_Auto =  65;				// Autopilot (a)
const K_Info =  73;				// Info (i)
const K_RSet =  82;				// Reset (r)

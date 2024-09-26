//= PRE-LOAD DATA ==============================================================
//	No three.js routines allowed since three.js has not been loaded yet.

//= CONSTANTS ==================================================================
//	Time
let	DLTime = 1/60;			// Delta Time (1/60 seconds)
let DLTim2 = DLTime*DLTime;
//	Conversions
let DegRad = Math.PI / 180;	// Convert Degrees to Radians
let RadDeg = 180/Math.PI;	// Convert Radians to Degrees
let Ft2Mtr = 0.3048;		// Convert Feet to Meters
let Mtr2Ft = 1/0.3048;
let Km2Mil = 0.621371;
let Mil2Km = 1.60934;
let MtrMil = 1609.34;		// Meters per Mile
//	Default Constants
let	GrvMPS = 9.80665; 		// Gravity (mps)
//	Starting Constants per frame
let GrvDLT = GrvMPS*DLTim2;

//= FM2 WILDCAT DATA ===========================================================
let data_ = {
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
		CfLMax: 1.4,		// Maximum Coefficient of Lift
		BnkMax: 1,			// Maximum bank rate	
	}

//= DEFAULT KEY BINDINGS =======================================================
let K_BnkL = 37;	// Bank Left (left arrow)
let K_BnkR = 39;	// Bank Right (right arrow)
let K_PitU = 40;	// Pitch up (down arrow)
let K_PitD = 38;	// Pitch down (up arrow)
let K_Flap = 70;	// Flaps (f)
let K_Gear = 71;	// Landing gear (g)
let K_Hook = 72;	// Tailhook (h)
let K_Canp = 67;	// Canopy (c)
let K_Brak = 66;	// Brakes (b)
let K_Guns = 32;	// Guns (spacebar)
let K_Vizz = 86;	// Toggle visibility (v)
let K_VU45 = 36;	// View Up (alone or modifier)
let K_VD45 = 35;	// View Down (alone or modifier)
let K_VL45 = 33;	// Left 45 degrees
let K_VR45 = 45;	// Right 45 degrees
let K_VL90 = 34;	// Left 90 degrees
let K_VR90 = 46;	// Right 90 degrees
let K_Look = 16;	// Pan (shift)
let K_Soun = 83;	// Toggle sound (s)
let K_Paws = 80;	// Pause (p)
let K_Auto = 65;	// Autopilot (a)
let K_Info = 73;	// Info (i)

//=	VIEW KEYS ==================================================================
let U45flg = 0;		// Up 45 degrees
let D45flg = 0;		// Down 45 degrees
let	L45flg = 0;		// Left 45 degrees
let R45flg = 0;		// Right 45 degrees
let L90flg = 0;		// Left 90 degrees
let R90flg = 0;		// Right 90 degrees

//= HTML OVERLAY TEXT ==========================================================
let Air_PwrElement = document.getElementById("Air_Pwr");	// Power
let Air_PwrNode = document.createTextNode("");
	Air_PwrElement.appendChild(Air_PwrNode);
let Air_SpdElement = document.getElementById("Air_Spd");	// Speed
let Air_SpdNode = document.createTextNode("");
	Air_SpdElement.appendChild(Air_SpdNode);
let Air_AltElement = document.getElementById("Air_Alt");	// Altitude
let Air_AltNode = document.createTextNode("");
	Air_AltElement.appendChild(Air_AltNode);
let Air_HdgElement = document.getElementById("Air_Hdg");	// Heading
let Air_HdgNode = document.createTextNode("");
	Air_HdgElement.appendChild(Air_HdgNode);
let Air_CfLElement = document.getElementById("Air_CfL");	// CfLift
let Air_CfLNode = document.createTextNode("");
	Air_CfLElement.appendChild(Air_CfLNode);
let On_PawsElement = document.getElementById("On_Paws");	// Pause
let On_PawsNode = document.createTextNode("");
	On_PawsElement.appendChild(On_PawsNode);
let Air_AtPElement = document.getElementById("Air_AtP");	// Autopilot
let Air_AtPNode = document.createTextNode("");
	Air_AtPElement.appendChild(Air_AtPNode);
let On_Info01Element = document.getElementById("On_Info01"); // Info
let On_Info01Node = document.createTextNode("");
	On_Info01Element.appendChild(On_Info01Node);
let On_Info02Element = document.getElementById("On_Info02");
let On_Info02Node = document.createTextNode("");
	On_Info02Element.appendChild(On_Info02Node);
let On_Info03Element = document.getElementById("On_Info03");
let On_Info03Node = document.createTextNode("");
	On_Info03Element.appendChild(On_Info03Node);
let On_Info04Element = document.getElementById("On_Info04");
let On_Info04Node = document.createTextNode("");
	On_Info04Element.appendChild(On_Info04Node);
let On_Info05Element = document.getElementById("On_Info05");
let On_Info05Node = document.createTextNode("");
	On_Info05Element.appendChild(On_Info05Node);
let On_Info06Element = document.getElementById("On_Info06");
let On_Info06Node = document.createTextNode("");
	On_Info06Element.appendChild(On_Info06Node);
let On_Info07Element = document.getElementById("On_Info07");
let On_Info07Node = document.createTextNode("");
	On_Info07Element.appendChild(On_Info07Node);
let On_Info08Element = document.getElementById("On_Info08");
let On_Info08Node = document.createTextNode("");
	On_Info08Element.appendChild(On_Info08Node);
let On_Info09Element = document.getElementById("On_Info09");
let On_Info09Node = document.createTextNode("");
	On_Info09Element.appendChild(On_Info09Node);
//
let Air_Pwr, Air_Spd, Air_Hdg, Air_Alt, Air_CfL;
let On_Paws, Air_AtP, On_Info01, On_Info02, On_Info03, On_Info04, On_Info05, On_Info06, On_Info07, On_Info08;


﻿// FM2 Wildcat
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
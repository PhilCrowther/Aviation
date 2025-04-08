/*
 * Controls.js (vers 25.04.07)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * Subroutines to create an air combat simulation
 * See http://philcrowther.com/Aviation for more details.
 */

/*******************************************************************************
*
*	NOTES
*
*******************************************************************************/
/*
This currently includes a modified pointer lock control
*/

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	EventDispatcher,
} from 'three';

//= VARIABLES ==================//==============================================

/*******************************************************************************
*
*	ANIMATED FLAGS
*
*******************************************************************************/
//	Adapted from three.js version

class PointerLockControls extends EventDispatcher {
	constructor(camera, domElement, plc_) {
		super();
		this.domElement = domElement;
		this.isLocked = false;
		const scope = this;
		function onMouseMove(event) {
			if (scope.isLocked === false) return;
			const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;		
			InpMos.x = movementX;
			InpMos.y = movementY;
		}
		function onPointerlockChange() {
			if (scope.domElement.ownerDocument.pointerLockElement === scope.domElement) {
				scope.dispatchEvent(_lockEvent);
				scope.isLocked = true;
			} else {
				scope.dispatchEvent(_unlockEvent);
				scope.isLocked = false;
			}
		}
		function onPointerlockError() {
			console.error("PointerLockControls: Unable to use Pointer Lock API");
		}
		this.connect = function () {
			scope.domElement.ownerDocument.addEventListener("mousemove", onMouseMove);
			scope.domElement.ownerDocument.addEventListener("pointerlockchange", onPointerlockChange);
			scope.domElement.ownerDocument.addEventListener("pointerlockerror", onPointerlockError);
		};
		this.disconnect = function () {
			scope.domElement.ownerDocument.removeEventListener("mousemove", onMouseMove);
			scope.domElement.ownerDocument.removeEventListener("pointerlockchange", onPointerlockChange);
			scope.domElement.ownerDocument.removeEventListener("pointerlockerror", onPointerlockError);
		};
		this.dispose = function () {
			this.disconnect();
		};
		this.lock = function () {
			this.domElement.requestPointerLock();
		};
		this.unlock = function () {
			scope.domElement.ownerDocument.exitPointerLock();
		};
		this.connect();
	}
}

/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {PointerLockControls};

/*******************************************************************************
*
*	REVISIONS
*
*******************************************************************************/
/*
250407:	Version 1
*/

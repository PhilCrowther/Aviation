//= POINTER LOCK CONTROL =======================================================
//
// This is a stripped down version of PointerLockControls.js
// which does not rotate the camera, but which merely returns the XY changes
// so that you can decide how to use them in your program
// The variables MosXDf and MosYDf must be defined in the program prior to loading this module.
// Phil Crowther (philcrowther.com) 9 Jan 2022

import {
	EventDispatcher
} from 'three';

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

class PointerLockControls extends EventDispatcher {
	constructor(camera, domElement) {
		super();
		if (domElement === undefined) {
			console.warn('THREE.PointerLockControls: The second parameter "domElement" is now mandatory.');
			domElement = document.body;
		}
		this.domElement = domElement;
		this.isLocked = false;
		const scope = this;
		function onMouseMove(event) {
			if (scope.isLocked === false) return;
			const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;		
			MosXDf = movementX;
			MosYDf = movementY;
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
			console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');
		}
		this.connect = function () {
			scope.domElement.ownerDocument.addEventListener('mousemove', onMouseMove);
			scope.domElement.ownerDocument.addEventListener('pointerlockchange', onPointerlockChange);
			scope.domElement.ownerDocument.addEventListener('pointerlockerror', onPointerlockError);
		};
		this.disconnect = function () {
			scope.domElement.ownerDocument.removeEventListener('mousemove', onMouseMove);
			scope.domElement.ownerDocument.removeEventListener('pointerlockchange', onPointerlockChange);
			scope.domElement.ownerDocument.removeEventListener('pointerlockerror', onPointerlockError);
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

export {PointerLockControls};

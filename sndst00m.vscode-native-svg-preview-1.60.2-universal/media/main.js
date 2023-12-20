// @ts-check
"use strict";

(function () {
	/**
	 * @param {number} value
	 * @param {number} min
	 * @param {number} max
	 * @return {number}
	 */
	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}

	function getSettings() {
		const element = document.getElementById("svg-preview-settings");
		if (element) {
			const data = element.getAttribute("data-settings");
			if (data) {
				return JSON.parse(data);
			}
		}

		throw new Error(`Could not load settings`);
	}

	/**
	 * Enable image-rendering: pixelated for images scaled by more than this.
	 */
	const PIXELATION_THRESHOLD = 3;

	const SCALE_PINCH_FACTOR = 0.075;
	const MAX_SCALE = 20;
	const MIN_SCALE = 0.1;

	const zoomLevels = [
		0.1,
		0.2,
		0.3,
		0.4,
		0.5,
		0.6,
		0.7,
		0.8,
		0.9,
		1,
		1.5,
		2,
		3,
		5,
		7,
		10,
		15,
		20
	];

	const settings = getSettings();
	const isMac = settings.isMac;
	const vscode = acquireVsCodeApi();

	/**
	 * @constant
	 * @type {object}
	 */
	const initialState = typeof vscode.getState() === "object"
		? vscode.getState()
		: {};
	initialState.scale = initialState.scale || "fit";
	initialState.offsetX = initialState.offsetX || 0;
	initialState.offsetY = initialState.offsetY || 0;
	initialState.reflow = initialState.reflow || false;

	// State
	let scale = initialState.scale;
	let ctrlPressed = false;
	let altPressed = false;
	let hasLoadedImage = false;
	let isBoxed = true;
	let consumeClick = true;
	let isActive = false;

	// Elements
	const container = document.body;
	const image = document.createElement("img");

	function updateScale(newScale) {
		if (!image || !hasLoadedImage || !image.parentElement) {
			return;
		}

		if (newScale === "fit") {
			scale = "fit";
			image.classList.add("scale-to-fit");
			image.classList.remove("pixelated");
			image.style.minWidth = "auto";
			image.style.width = "auto";
			vscode.setState(undefined);
		} else {
			scale = clamp(newScale, MIN_SCALE, MAX_SCALE);
			if (scale >= PIXELATION_THRESHOLD) {
				image.classList.add("pixelated");
			} else {
				image.classList.remove("pixelated");
			}

			if (isBoxed) {
				const dx = (window.scrollX + container.clientWidth / 2) / container.scrollWidth;
				const dy = (window.scrollY + container.clientHeight / 2) / container.scrollHeight;

				image.classList.remove("scale-to-fit");
				image.style.minWidth = `${(image.naturalWidth * scale)}px`;
				image.style.width = `${(image.naturalWidth * scale)}px`;

				const newScrollX = container.scrollWidth * dx - container.clientWidth / 2;
				const newScrollY = container.scrollHeight * dy - container.clientHeight / 2;

				window.scrollTo(newScrollX, newScrollY);

				vscode.setState({ scale: scale, offsetX: newScrollX, offsetY: newScrollY });
			} else {
				image.classList.remove("scale-to-fit");
				image.style.height = `${Math.floor(container.clientHeight / scale)}px`;
				image.style.minWidth = `${Math.floor(container.clientWidth / scale)}px`;
				image.style.width = `${Math.floor(container.clientWidth / scale)}px`;
				image.style.transform = `scale(${scale})`;

				vscode.setState({ scale: scale, offsetX: 0, offsetY: 0, reflow: true });
			}
		}

		vscode.postMessage({
			type: "zoom",
			value: scale
		});

		vscode.postMessage({
			type: "max-scale",
			value: scale === MAX_SCALE
		});

		vscode.postMessage({
			type: "min-scale",
			value: scale === MIN_SCALE
		});
	}

	function setActive(value) {
		isActive = value;
		if (value) {
			if (isMac ? altPressed : ctrlPressed) {
				container.classList.remove("zoom-in");
				container.classList.add("zoom-out");
			} else {
				container.classList.remove("zoom-out");
				container.classList.add("zoom-in");
			}
		} else {
			ctrlPressed = false;
			altPressed = false;
			container.classList.remove("zoom-out");
			container.classList.remove("zoom-in");
		}
	}

	function firstZoom() {
		if (!image || !hasLoadedImage) {
			return;
		}

		if (isBoxed) {
			scale = image.clientWidth / image.naturalWidth;
		} else {
			scale = 1;
		}

		updateScale(scale);
	}

	function zoomIn() {
		if (scale === "fit") {
			firstZoom();
		}

		let i = 0;
		for (; i < zoomLevels.length; ++i) {
			if (zoomLevels[i] > scale) {
				break;
			}
		}
		updateScale(zoomLevels[i] || MAX_SCALE);
	}

	function zoomOut() {
		if (scale === "fit") {
			firstZoom();
		}

		let i = zoomLevels.length - 1;
		for (; i >= 0; --i) {
			if (zoomLevels[i] < scale) {
				break;
			}
		}
		updateScale(zoomLevels[i] || MIN_SCALE);
	}

	window.addEventListener("keydown", (/** @type {KeyboardEvent} */ e) => {
		if (!image || !hasLoadedImage) {
			return;
		}
		ctrlPressed = e.ctrlKey;
		altPressed = e.altKey;

		if (isMac ? altPressed : ctrlPressed) {
			container.classList.remove("zoom-in");
			container.classList.add("zoom-out");
		}
	});

	window.addEventListener("keyup", (/** @type {KeyboardEvent} */ e) => {
		if (!image || !hasLoadedImage) {
			return;
		}

		ctrlPressed = e.ctrlKey;
		altPressed = e.altKey;

		if (!(isMac ? altPressed : ctrlPressed)) {
			container.classList.remove("zoom-out");
			container.classList.add("zoom-in");
		}
	});

	container.addEventListener("mousedown", (/** @type {MouseEvent} */ e) => {
		if (!image || !hasLoadedImage) {
			return;
		}

		if (e.button !== 0) {
			return;
		}

		ctrlPressed = e.ctrlKey;
		altPressed = e.altKey;

		consumeClick = !isActive;
	});

	container.addEventListener("click", (/** @type {MouseEvent} */ e) => {
		if (!image || !hasLoadedImage) {
			return;
		}

		if (e.button !== 0) {
			return;
		}

		if (consumeClick) {
			consumeClick = false;
			return;
		}
		// left click
		if (scale === "fit") {
			firstZoom();
		}

		if (!(isMac ? altPressed : ctrlPressed)) { // zoom in
			zoomIn();
		} else {
			zoomOut();
		}
	});

	container.addEventListener("wheel", (/** @type {WheelEvent} */ e) => {
		// Prevent pinch to zoom
		if (e.ctrlKey) {
			e.preventDefault();
		}

		if (!image || !hasLoadedImage) {
			return;
		}

		const isScrollWheelKeyPressed = isMac ? altPressed : ctrlPressed;
		if (!isScrollWheelKeyPressed && !e.ctrlKey) { // pinching is reported as scroll wheel + ctrl
			return;
		}

		if (scale === "fit") {
			firstZoom();
		}

		let delta = e.deltaY > 0 ? 1 : -1;
		updateScale(scale * (1 - delta * SCALE_PINCH_FACTOR));
	}, { passive: false });

	window.addEventListener("scroll", e => {
		if (!image || !hasLoadedImage || !image.parentElement || scale === "fit" || !isBoxed) {
			return;
		}

		const entry = vscode.getState();
		if (typeof entry === "object") {
			vscode.setState({
				// @ts-ignore
				scale: entry.scale,
				offsetX: window.scrollX,
				offsetY: window.scrollY
			});
		}
	}, { passive: true });

	container.classList.add("image");

	image.classList.add("scale-to-fit");

	image.addEventListener("load", () => {
		if (hasLoadedImage) {
			return;
		}
		hasLoadedImage = true;
		isBoxed = image.naturalHeight !== 150 || image.naturalWidth !== 300;

		if (!isBoxed) {
			container.classList.add("reflow");
			scale = 1;
			image.classList.remove("scale-to-fit");
			image.style.height = `${Math.floor(container.scrollHeight)}`;
			image.style.minHeight = `${Math.floor(container.scrollHeight)}`;
			image.style.width = `${Math.floor(container.scrollWidth)}`;
		}

		vscode.postMessage({
			type: "size",
			value: isBoxed
				? `${image.naturalWidth}px x ${image.naturalHeight}px`
				: "100vw x 100vh",
		});

		container.classList.remove("loading");
		container.classList.add("ready");
		container.append(image);

		updateScale(scale);

		if (initialState.scale !== "fit" && isBoxed) {
			window.scrollTo(initialState.offsetX, initialState.offsetY);
		}
	});

	image.addEventListener("error", e => {
		if (hasLoadedImage) {
			return;
		}

		hasLoadedImage = true;
		container.classList.add("error");
		container.classList.remove("loading");
	});

	image.src = settings.src;

	document.querySelector(".open-file-link").addEventListener("click", () => {
		vscode.postMessage({
			type: "reopen-as-text",
		});
	});

	window.addEventListener("message", e => {
		switch (e.data.type) {
			case "setScale":
				updateScale(e.data.scale);
				break;

			case "setActive":
				setActive(e.data.value);
				break;

			case "zoomIn":
				zoomIn();
				break;

			case "zoomOut":
				zoomOut();
				break;
		}
	});

	window.addEventListener("resize", e => {
		if (!isBoxed) {
			image.style.height = `${Math.floor(container.clientHeight / scale)}px`;
			image.style.minWidth = `${Math.floor(container.clientWidth / scale)}px`;
			image.style.width = `${Math.floor(container.clientWidth / scale)}px`;
			image.style.transform = `scale(${scale})`;
		}
	});
}());

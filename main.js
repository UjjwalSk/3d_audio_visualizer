import * as THREE from "three";
import { vertexShader, fragmentShader } from "./utils/Shaders.module";
import { GUI } from "dat.gui";
import { SceneInit } from "./utils/SceneInit.module";
import "./style.css";

document.getElementById("mic").addEventListener("click", () => {
	navigator.getUserMedia =
		navigator.getUserMedia ||
		navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia;

	navigator.getUserMedia({ video: false, audio: true }, micData, console.log);
});

const screen = new SceneInit();
screen.initScene();

function updateGroupGeometry(mesh, geometry) {
	if (mesh.children.length) {
		mesh.children[0].geometry.dispose();
		mesh.children[0].geometry = geometry;
	}
}

const data = {
	width: 20,
	height: 10,
	widthSegments: 128,
	heightSegments: 128,
	x: 1,
	y: 1,
	z: 1,
	wireframe: true,
};

function generateGeometry() {
	updateGroupGeometry(
		screen.scene,
		new THREE.PlaneGeometry(
			data.width,
			data.height,
			data.widthSegments,
			data.heightSegments
		)
	);
}

var analyser,
	dataArray = new Uint8Array(),
	audioContext,
	audioElement = document.getElementById("myAudio"),
	source,
	uniforms = {
		u_time: {
			type: "f",
			value: 1.0,
		},
		u_amplitude: {
			type: "f",
			value: 3.0,
		},
		u_data_arr: {
			type: "float[64]",
			value: dataArray,
		},
	};

// Audio
audioElement = document.getElementById("myAudio");

// Mic Input
navigator.getUserMedia =
	navigator.getUserMedia ||
	navigator.webkitGetUserMedia ||
	navigator.mozGetUserMedia;

audioElement.addEventListener("play", generate);

const planeGeometry = new THREE.PlaneGeometry(
	data.width,
	data.height,
	data.widthSegments,
	data.heightSegments
);
// const planeGeometry = new THREE.PlaneGeometry(64, 64, 128, 128);

// const planeGeometry = new THREE.TorusGeometry(10, 0.1, 500, 500);
// const planeGeometry = new THREE.ConeGeometry(5, 20, 32);
// const planeGeometry = new THREE.SphereGeometry(20, 128, 128);

const planeCustomMaterial = new THREE.ShaderMaterial({
	uniforms: uniforms,
	vertexShader: vertexShader(),
	fragmentShader: fragmentShader(),
	wireframe: true,
});
const plane = new THREE.Mesh(planeGeometry, planeCustomMaterial);
plane.rotation.x = -Math.PI / 2 + Math.PI / 4;
plane.geometry.dynamic = true;
plane.geometry.verticesNeedUpdate = true;

screen.scene.add(plane);

function micData(stream) {
	audioContext = new AudioContext();
	// audioContext.createMediaElementSource(undefined);
	source = audioContext.createMediaStreamSource(stream);
	analyser = audioContext.createAnalyser();
	console.log("recording");
	source.connect(analyser);
	dataArray = new Uint8Array(analyser.frequencyBinCount);
	plane.material.uniforms.u_data_arr.value = dataArray;
}

function generate() {
	audioContext = new AudioContext();
	// audioContext.createMediaStreamSource(undefined);
	source = audioContext.createMediaElementSource(audioElement);
	analyser = audioContext.createAnalyser();
	source.connect(analyser);
	analyser.connect(audioContext.destination);
	analyser.fftSize = 1024;
	dataArray = new Uint8Array(analyser.frequencyBinCount);
	plane.material.uniforms.u_data_arr.value = dataArray;
}

const gui = new GUI();
const folder = gui.addFolder("THREE.PlaneGeometry");

folder.add(data, "width", 1, 200).onChange(generateGeometry);
folder.add(data, "height", 1, 200).onChange(generateGeometry);
folder.add(data, "widthSegments", 1, 500).step(1).onChange(generateGeometry);
folder.add(data, "heightSegments", 1, 500).step(1).onChange(generateGeometry);
folder.add(data, "x", 1, 100).onChange(function (e) {
	screen.scene.scale.x = data.x;
});
folder.add(data, "y", 1, 100).onChange(function (e) {
	screen.scene.scale.y = data.y;
});
folder.add(data, "z", 1, 100).onChange(function (e) {
	screen.scene.scale.z = data.z;
});
folder.add(data, "wireframe").onChange(function (e) {
	screen.scene.material.wireframe = e;
});

generateGeometry();

const render = (time) => {
	if (analyser) {
		uniforms.u_time.value = time;
		uniforms.u_data_arr.value = dataArray;
		analyser.getByteFrequencyData(dataArray);
	}
	screen.controls.update();
	// console.log(dataArray);
	screen.renderer.render(screen.scene, screen.camera);

	requestAnimationFrame(render);
};

render();

screen.animate();

import * as THREE from "three";
import { vertexShader, fragmentShader } from "./utils/Shaders.module";
import { GUI } from "dat.gui";
import { SceneInit } from "./utils/SceneInit.module";
import "./style.css";

var flag = 0;

document.getElementById("mic").addEventListener("click", () => {
	navigator.getUserMedia =
		navigator.getUserMedia ||
		navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia;

	navigator.getUserMedia({ video: false, audio: true }, micData, console.log);
});

document.getElementById("Stopmic").addEventListener("click", Stopmic);

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

var micAnalyser,
	audioAnalyser,
	dataArray = new Uint8Array(),
	audioContext,
	micContext,
	audioElement = document.getElementById("myAudio"),
	audioSource,
	micSource,
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

// Audio File Input

var file = document.getElementById("thefile");

file.onchange = function () {
	var files = this.files;
	audioElement.src = URL.createObjectURL(files[0]);
	audioElement.load();
	audioElement.play();
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
	flag = 1;
	micContext = new AudioContext();
	micSource = micContext.createMediaStreamSource(stream);
	micAnalyser = micContext.createAnalyser();
	micSource.connect(micAnalyser);
	dataArray = new Uint8Array(micAnalyser.frequencyBinCount);
	plane.material.uniforms.u_data_arr.value = dataArray;
}

function Stopmic() {
	flag = 0;
	micContext.suspend();
}

function generate() {
	flag = 0;
	if (audioContext) {
		return;
	}
	audioContext = new AudioContext();
	audioSource = audioContext.createMediaElementSource(audioElement);
	audioAnalyser = audioContext.createAnalyser();
	audioSource.connect(audioAnalyser);
	audioAnalyser.connect(audioContext.destination);
	audioAnalyser.fftSize = 1024;
	dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
	plane.material.uniforms.u_data_arr.value = dataArray;
}

const gui = new GUI();
const folder = gui.addFolder("THREE.PlaneGeometry");

folder.add(data, "width", 1, 512).onChange(generateGeometry);
folder.add(data, "height", 1, 512).onChange(generateGeometry);
folder.add(data, "widthSegments", 1, 512).step(1).onChange(generateGeometry);
folder.add(data, "heightSegments", 1, 512).step(1).onChange(generateGeometry);
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
	screen.scene.children[0].material.wireframe = e;
});

generateGeometry();

const render = (time) => {
	uniforms.u_time.value = time;
	if (micAnalyser && flag == 1) {
		uniforms.u_data_arr.value = dataArray;
		micAnalyser.getByteFrequencyData(dataArray);
	} else if (audioAnalyser) {
		audioAnalyser.getByteFrequencyData(dataArray);
	}

	screen.controls.update();
	screen.renderer.render(screen.scene, screen.camera);

	requestAnimationFrame(render);
};

render();

screen.animate();

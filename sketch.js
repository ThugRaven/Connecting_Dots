let numberOfDots = 75;

let dots = [];
let firstTime = true;
let debug = false;
let volume = 0.05;
let oldVolume;
let drawVolume = false;
let volumeTimeout;
let drawTime = false;
let timeTimeout;
let seekValue = 0;
let progressBarHeight = 0;
let isMuted = false;
let isClickEnabled = false;
let isProgressShown = false;

let input;
let sound;

function setup() {
	let cnv = createCanvas(windowWidth, windowHeight);
	cnv.parent("canvas");
	cnv.style("display", "block");

	createDots();

	getAudioContext().suspend();
	input = createFileInput(handleFile);
	input.id("audio__file");
	input.position(0, 0);
}

function createDots() {
	dots = [];
	for (let i = 0; i < numberOfDots; i++) {
		dots.push(new Dot(dotType.NORMAL));
	}

	if (isClickEnabled) {
		dots.push(new Dot(dotType.MOUSE));
		numberOfDots++;
	}
}

function handleFile(file) {
	if (file.type === "audio" || file.type === "video") {
		if (sound != null) {
			sound.stop();
			sound.disconnect();
			sound.dispose();
		}
		sound = null;

		let spinner = select(".loading");
		spinner.style("display", "block");

		// Every loadSound creates an instance, that never gets removed - memory leak
		// https://github.com/processing/p5.js-sound/issues/88
		sound = loadSound(file, () => {
			createDots();
			spinner.style("display", "none");
			sound.setVolume(volume);
			sound.play();
		});
		fft = new p5.FFT();
	} else {
		sound = null;
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function draw() {
	background(0);

	for (let i = 0; i < numberOfDots; i++) {
		dots[i].update();
		dots[i].edges();
		dots[i].render();
		dots[i].connect(dots.slice(i));
	}

	if (debug) {
		fill(255);
		noStroke();
		textSize(20);
		textAlign(RIGHT, CENTER);
		text(Math.round(getFrameRate()), width, 10);
	}

	if (sound == null) return;

	if (drawVolume) {
		fill(255);
		noStroke();
		textSize(30);
		textAlign(CENTER, CENTER);
		text(Math.round(volume * 1000) / 10 + "%", width / 2, 25);
	}

	progressBarHeight = height - 1;

	if (drawTime) {
		fill(255);
		noStroke();
		textSize(30);
		textAlign(CENTER, CENTER);
		if (seekValue > 0) {
			text(`+${seekValue}s`, width - width / 6, height / 2);
		} else if (seekValue < 0) {
			text(`${seekValue}s`, width / 6, height / 2);
		}
		progressBarHeight = height - 3;
	}

	if (mouseY >= height - 5) {
		progressBarHeight = height - 5;
		isProgressShown = true;
		displayProgressLine();
	} else {
		isProgressShown = false;
	}

	displayProgressBar();
}

function keyPressed() {
	switch (keyCode) {
		case 32:
		case 75:
			// space
			if (sound != null && sound.isPlaying()) {
				sound.pause();
			} else if (sound != null) {
				sound.play();
			}
			break;
		case 68:
			// d
			debug = !debug;
			break;
		case UP_ARROW:
			changeVolume(0.05);
			break;
		case DOWN_ARROW:
			changeVolume(-0.05);
			break;
		case LEFT_ARROW:
			seek(-5);
			break;
		case RIGHT_ARROW:
			seek(5);
			break;
		case 74:
			// j
			seek(-10);
			break;
		case 76:
			// l
			seek(10);
			break;
		case 70:
			// f
			fullscreen(!fullscreen());
			break;
		case 77:
			// m
			if (sound == null) return;

			if (!isMuted) {
				oldVolume = volume;
				volume = 0;
			} else {
				volume = oldVolume;
			}
			sound.setVolume(volume);
			isMuted = !isMuted;
			renderTime();
			break;
		case 67:
			// c
			isClickEnabled = !isClickEnabled;
			if (!isClickEnabled) {
				dots.splice(
					dots.findIndex(({ type }) => type === dotType.MOUSE),
					1
				);
				numberOfDots--;
			} else {
				dots.push(new Dot(dotType.MOUSE));
				numberOfDots++;
			}
			break;
		case 82:
			// r
			dots = dots.filter(({ type }) => type !== dotType.MOUSE_PLACED);
			numberOfDots = dots.length;
			break;
		case DELETE:
			for (let i = 0; i < numberOfDots; i++) {
				if (dots[i].remove(mouseX, mouseY)) {
					dots.splice(i, 1);
					numberOfDots--;
					break;
				}
			}
			break;
	}
}

function changeVolume(change) {
	if (sound == null) return;

	volume = volume + change;
	if (volume < 0) volume = 0;
	else if (volume > 1) volume = 1;
	sound.setVolume(volume);
	renderTime();
}

function renderTime() {
	clearTimeout(volumeTimeout);
	drawVolume = true;
	volumeTimeout = setTimeout(() => {
		drawVolume = false;
	}, 1000);
}

function seek(seconds) {
	if (sound == null) return;

	seekValue = seconds;
	clearTimeout(timeTimeout);

	if (sound.currentTime() + seconds < 0) {
		sound.jump(0);
	} else if (sound.currentTime() + seconds >= sound.duration()) {
		sound.jump(sound.duration());
	} else {
		sound.jump(sound.currentTime() + seconds);
	}

	drawTime = true;
	timeTimeout = setTimeout(() => {
		drawTime = false;
	}, 1000);
}

function displayProgressBar() {
	fill(0, 100, 100);
	noStroke();
	rect(
		0,
		progressBarHeight,
		map(sound.currentTime(), 0, sound.duration(), 0, width)
	);
}

function displayProgressLine() {
	fill(0, 0, 100, 0.5);
	noStroke();
	rect(0, progressBarHeight, mouseX);
}

function mousePressed() {
	userStartAudio();
}

function mouseClicked(event) {
	if (firstTime) {
		firstTime = false;
		return;
	}

	if (isProgressShown) {
		sound.jump(map(mouseX, 0, width, 0, sound.duration()));
		return;
	}

	if (
		isClickEnabled &&
		event.target == document.getElementById("defaultCanvas0")
	) {
		numberOfDots++;
		dots.push(new Dot(dotType.MOUSE_PLACED));
		return false;
	}
}

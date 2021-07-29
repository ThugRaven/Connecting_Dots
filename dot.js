class Dot {
	constructor(type) {
		this.padding = 50;
		this.type = type;
		if (this.type === dotType.MOUSE || this.type === dotType.MOUSE_PLACED) {
			this.pos = createVector(mouseX, mouseY);
		} else {
			this.pos = createVector(
				random(this.padding, width - this.padding),
				random(this.padding, height - this.padding)
			);
		}
		this.d = random(15, 30);
		this.r = this.d / 2;
		this.vel = p5.Vector.random2D();
		this.defVel = this.vel;
		this.range = 200;

		this.color = colors[Math.floor(Math.random() * colors.length)];
		this.fill = 255;
		colorMode(HSB);
	}

	render() {
		fill(this.fill);
		noStroke();
		circle(this.pos.x, this.pos.y, this.r);
	}

	update() {
		if (sound != null) {
			let spectrum = fft.analyze();
			spectrum = fft.getEnergy("bass");

			if (spectrum < 150) {
				this.r = map(spectrum, 0, 150, this.d / 2, 25 / 2);
				this.vel.setMag(map(spectrum, 0, 150, 0.1, 2));
				this.fill = color(this.color, map(spectrum, 0, 150, 0, 10), 100);
			} else {
				this.r = map(spectrum, 150, 255, 25 / 2, 100 / 2);
				this.vel.setMag(map(spectrum, 150, 255, 4, 15));
				this.fill = color(this.color, map(spectrum, 150, 255, 50, 100), 100);
			}
		}

		if (this.type === dotType.NORMAL) {
			this.pos.add(this.vel);
		} else if (this.type === dotType.MOUSE) {
			this.pos.set(mouseX, mouseY);
		}
	}

	edges() {
		if (this.pos.x > width - this.r) {
			this.pos.x = width - this.r;
			this.vel.x *= -1;
		} else if (this.pos.x < this.r) {
			this.pos.x = this.r;
			this.vel.x *= -1;
		}

		if (this.pos.y > height - this.r) {
			this.pos.y = height - this.r;
			this.vel.y *= -1;
		} else if (this.pos.y < this.r) {
			this.pos.y = this.r;
			this.vel.y *= -1;
		}
	}

	connect(dots) {
		dots.forEach((element) => {
			let distance = dist(this.pos.x, this.pos.y, element.pos.x, element.pos.y);
			if (distance < this.range) {
				stroke(255);
				strokeWeight(map(distance, 0, this.range, 1, 0));
				line(this.pos.x, this.pos.y, element.pos.x, element.pos.y);
			}
		});
	}

	remove(x, y) {
		let distance = dist(x, y, this.pos.x, this.pos.y);
		if (distance < this.r && this.type === dotType.MOUSE_PLACED) {
			return true;
		}
		return false;
	}
}

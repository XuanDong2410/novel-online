<!-- fork from https://codepen.io/interaminense/pen/QyGbXL -->

<template>
	<div>
	<div class="noite"></div>

	<div class="constelacao">
		<span
			v-for="i in qtdeEstrelas"
			:key="i"
			class="estrela"
			:class="[
				styles[getRandomArbitrary(0, 4)],
				opacity[getRandomArbitrary(0, 6)],
				tam[getRandomArbitrary(0, 5)]
			]"
			:style="{
				'animation-delay': `0.${getRandomArbitrary(0, 9)}s`,
				left: getRandomArbitrary(0, widthWindow) + 'px',
				top: getRandomArbitrary(0, heightWindow) + 'px'
			}"
		/>
	</div>

	<div class="lua">
		<div class="textura"></div>
	</div>

	<div class="chuvaMeteoro" :class="styleMeteoro"></div>

	<div class="floresta">
		<img
			src="https://raw.githubusercontent.com/interaminense/starry-sky/master/src/img/bgTree.png"
			alt=""
		/>
	</div>
</div>
</template>

<script lang="ts" setup>
var styles = ["style1", "style2", "style3", "style4"]
var tam = ["tam1", "tam1", "tam1", "tam2", "tam3"]
var opacity = [
	"opacity1",
	"opacity1",
	"opacity1",
	"opacity2",
	"opacity2",
	"opacity3"
]

function getRandomArbitrary(min, max) {
	return Math.floor(Math.random() * (max - min)) + min
}

var estrela = ""
var qtdeEstrelas = 250
var widthWindow = window.innerWidth
var heightWindow = window.innerHeight

//meteoros

const styleMeteoro = ref("")

var numeroAleatorio = 5000

setTimeout(function () {
	carregarMeteoro()
}, numeroAleatorio)

function carregarMeteoro() {
	setTimeout(carregarMeteoro, numeroAleatorio)
	numeroAleatorio = getRandomArbitrary(5000, 10000)
	styleMeteoro.value = styles[getRandomArbitrary(0, 4)]

	setTimeout(function () {
		styleMeteoro.valueL = ""
	}, 1000)
}
</script>

<style lang="scss" scoped>
.title {
	position: absolute;
	width: 100%;
	text-align: center;
	top: 50%;
	color: #fff;
	font-weight: 100;
	font-size: 3em;
	font-family: "Pacifico", cursive;
}

.title .avatar {
	width: 40px;
	height: 40px;
	background-image: url(../img/avatar.jpg);
	display: inline-block;
	border-radius: 50%;
	background-size: 100%;
}

.noite {
	background: -webkit-linear-gradient(
		top,
		rgb(0, 0, 0) 50%,
		rgb(25, 19, 39) 80%,
		rgb(43, 32, 72)
	);
	width: 100%;
	height: 100%;
	position: absolute;
	overflow: hidden;
}

.constelacao {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	animation: rotate 600s infinite linear;
}

.estrela {
	background-color: white;
	border-radius: 50%;
	position: absolute;
	animation-name: estrela;
	animation-timing-function: linear;
	animation-iteration-count: infinite;
}

.estrela.style1 {
	animation-duration: 0.5s;
	animation-name: estrela;
}
.estrela.style2 {
	animation-duration: 1s;
	animation-name: estrela;
}
.estrela.style3 {
	animation-duration: 1.5s;
	animation-name: estrela;
}
.estrela.style4 {
	animation-duration: 2s;
	animation-name: estrelaDestacada;
}

.estrela.tam1 {
	width: 1px;
	height: 1px;
}
.estrela.tam2 {
	width: 2px;
	height: 2px;
}
.estrela.tam3 {
	width: 3px;
	height: 3px;
}

.estrela.opacity1 {
	opacity: 1;
}
.estrela.opacity2 {
	opacity: 0.5;
}
.estrela.opacity3 {
	opacity: 0.1;
}

.meteoro {
	position: absolute;
	background-color: #fff;
	width: 2px;
	height: 2px;
	border-radius: 50%;
	transform: rotate(-35deg);
	animation-timing-function: linear;
	animation-iteration-count: infinite;
	animation-duration: 1s;
}

.meteoro:before {
	content: "";
	display: inline-block;
	vertical-align: middle;
	margin-right: 10px;
	width: 0;
	height: 0;
	border-top: 1px solid transparent;
	border-bottom: 1px solid transparent;
	border-left: 85px solid white;
	position: absolute;
	left: 2px;
	top: 0;
}

.meteoro.style1 {
	animation-name: meteoroStyle1;
}
.meteoro.style2 {
	animation-name: meteoroStyle2;
}
.meteoro.style3 {
	animation-name: meteoroStyle3;
}
.meteoro.style4 {
	animation-name: meteoroStyle4;
}

.lua {
	position: absolute;
	right: 200px;
	top: 150px;
	width: 120px;
	height: 120px;
	border-radius: 50%;
	box-shadow:
		0 0 160px 0px #fff,
		0 0 30px -4px #fff,
		0 0 8px 2px rgba(255, 255, 255, 0.26);
	background-color: #fff;
	animation-name: lua;
	animation-timing-function: linear;
	animation-iteration-count: infinite;
	animation-duration: 10s;
}

.lua .textura {
	background-image: url(https://raw.githubusercontent.com/interaminense/starry-sky/master/src/img/bgMoon.png);
	background-position: center;
	background-size: 100%;
	width: 100%;
	height: 100%;
	position: absolute;
	left: 0;
	top: 0;
	border-radius: 50%;
	overflow: hidden;
	opacity: 0.4;
}

.floresta {
	position: fixed;
	left: 0;
	bottom: 0;
	width: 100%;
}

.floresta img {
	width: 100%;
	position: absolute;
	bottom: 0;
	left: 0;
}

@keyframes escurecer {
	0% {
		top: 0;
	}
	100% {
		top: 100%;
	}
}

@keyframes estrela {
	0% {
		box-shadow: 0 0 10px 0px rgba(255, 255, 255, 0.05);
	}
	50% {
		box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.4);
	}
	100% {
		box-shadow: 0 0 10px 0px rgba(255, 255, 255, 0.05);
	}
}

@keyframes estrelaDestacada {
	0% {
		background-color: #ffffff;
		box-shadow: 0 0 10px 0px rgba(255, 255, 255, 1);
	}
	20% {
		background-color: #ffc4c4;
		box-shadow: 0 0 10px 0px rgb(255, 196, 196, 1);
	}
	80% {
		background-color: #c4cfff;
		box-shadow: 0 0 10px 0px rgb(196, 207, 255, 1);
	}
	100% {
		background-color: #ffffff;
		box-shadow: 0 0 10px 0px rgba(255, 255, 255, 0.2);
	}
}

@keyframes meteoroStyle1 {
	0% {
		opacity: 0;
		right: 300px;
		top: 100px;
	}
	30% {
		opacity: 0.3;
	}
	60% {
		opacity: 0.3;
	}
	100% {
		opacity: 0;
		right: 1000px;
		top: 600px;
	}
}

@keyframes meteoroStyle2 {
	0% {
		opacity: 0;
		right: 700px;
		top: 100px;
	}
	30% {
		opacity: 1;
	}
	60% {
		opacity: 1;
	}
	100% {
		opacity: 0;
		right: 1400px;
		top: 600px;
	}
}

@keyframes meteoroStyle3 {
	0% {
		opacity: 0;
		right: 300px;
		top: 300px;
	}
	30% {
		opacity: 1;
	}
	60% {
		opacity: 1;
	}
	100% {
		opacity: 0;
		right: 1000px;
		top: 800px;
	}
}

@keyframes meteoroStyle4 {
	0% {
		opacity: 0;
		right: 700px;
		top: 300px;
	}
	30% {
		opacity: 1;
	}
	60% {
		opacity: 1;
	}
	100% {
		opacity: 0;
		right: 1400px;
		top: 800px;
	}
}

@keyframes lua {
	0% {
		box-shadow:
			0 0 160px 0px #fff,
			0 0 30px -4px #fff,
			0 0 8px 2px rgba(255, 255, 255, 0.26);
	}
	50% {
		box-shadow:
			0 0 80px 0px #fff,
			0 0 30px -4px #fff,
			0 0 8px 2px rgba(255, 255, 255, 0.26);
	}
	100% {
		box-shadow:
			0 0 160px 0px #fff,
			0 0 30px -4px #fff,
			0 0 8px 2px rgba(255, 255, 255, 0.26);
	}
}

@keyframes rotate {
	0% {
		-webkit-transform: rotate(0deg);
	}
	100% {
		-webkit-transform: rotate(360deg);
	}
}
</style>

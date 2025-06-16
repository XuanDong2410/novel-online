<template>
	<div class="wrapper">
		<div class="Moon"></div>
		<div class="ShootingStar"></div>
		<div class="Shadows"></div>
		<div class="StarsWrapper">
			<div class="Stars">
				<div class="StarBottom"></div>
			</div>
			<div class="BigStars">
				<div class="BigStarsBottom"></div>
			</div>
		</div>
		<div class="MountainBK"></div>
		<svg
			class="MountainBottom"
			xmlns="http://www.w3.org/2000/svg"
			style="enable-background: new 0 0 800 262.1"
			x="0px"
			y="0px"
			viewBox="0 0 800 262.1"
		>
			<path
				class="BottomMout"
				d="M-611.8,99.3c0,0,172.9,5.2,229.7,19.9c56.9,14.7,91.3,12.9,106.2,10.8c14.9-2.1,125.9-30.4,166.1-19.3c40.2,11.1,50.8,24.5,68.6,18.9c17.8-5.6,52.6-10.4,75.9-1.3c23.3,9.1,13.8,6.8,24.3,0.9c10.5-6,28.8-30.5,57-16.3c22,11.1,28.7,43.1,64.2,24.7c33.9-17.6,53.4-16.8,81.6-8.2c28.3,8.6,52,14.1,86.1,15.7c34,1.5,71.7-6.8,133.8,24.9c62.1,31.7,93.5,54.6,125.6,52c32.1-2.6,117.1-18.2,136.1-14.1c19.1,4,58.1,24.5,72.6,26.2c14.5,1.7,10.5,14.2,145.1,12.4c0,0,32.2-3.8,72.2,8.8c40,12.6,78.1,31.1,127.1,30.2c49-0.9,136.1-3.4,167.9,5.8c15.5,4.5,15.5,4.5,15.5,4.5L1328.1,425 L-622.5,187.5L-611.8,99.3z"
			></path>
			<path
				class="BottomMout"
				d="M-248.3,202.7c0,0,171.9-21.6,230.2-13.7c58.4,7.9,92.2,0.3,106.7-4.5s120.3-55.3,161.6-48.8 c41.4,6.4,53.8,20.2,70.6,10.9c16.8-9.3,50.6-20.4,75-13.6c24.4,6.8,14.7,5.7,24.2-2.9c9.5-8.6,24.1-39.9,54.1-27.9c23.4,9.3,34.5,45.3,67.1,18.3c31-25.8,50.4-28,79.6-22.5c29.2,5.5,53.5,8,87.4,4.4c33.9-3.6,70-19.3,136,7.5c66,26.8,100.4,48.2,131.8,40.1c31.4-8.1,113.3-39.7,132.7-38.1c19.4,1.6,61,19,75.6,18.7c14.5-0.4,12.4,14.7,145.4-8.8c0,0,31.4-9.6,72.8-1.4c41.4,8.2,81.7,23.5,130.1,14.6c48.4-8.9,134.3-25.7,167-20.2c16,2.7,16,2.7,16,2.7l2.9,152.2l-1964.7,37L-248.3,202.7z"
			></path>
		</svg>
		<svg
			class="MountainTop"
			xmlns="http://www.w3.org/2000/svg"
			style="enable-background: new 0 0 800 262.1"
			x="0px"
			y="0px"
			viewBox="0 0 800 262.1"
		>
			<linearGradient
				id="TopMout"
				gradientUnits="userSpaceOnUse"
				x1="-39.822"
				y1="187.0429"
				x2="808.9788"
				y2="187.0429"
			>
				<stop offset="0" style="stop-color: #291668"></stop>
				<stop offset="0.5107" style="stop-color: #5f0d9f"></stop>
				<stop offset="0.8363" style="stop-color: #510cb6"></stop>
				<stop offset="1" style="stop-color: #490cc3"></stop>
			</linearGradient>
			<path
				class="TopMout"
				d="M-39.8,178.1c0,0,138.3-27.5,165.6-32c27.2-4.5,32.5,13.3,55,21.7c22.5,8.4,59.2-27.2,81.2-38c22-10.9,50.3-30.6,74.4-12.8c24.1,17.8,75.4,75.1,138.3,38.5c62.9-36.5,94.3-36.5,139.4-18.8c45.1,17.8,41.9,19.9,66,9.4s27.4-21.2,67.1-2.1c39.7,19.1,61.9,25.3,61.9,25.3v95.2H-39.8V178.1z"
			></path>
		</svg>
	</div>
</template>

<script lang="ts" setup>
var tilesize = 1,
	tilecount = 100
var gRows = Math.floor($(".StarsWrapper").innerWidth() / tilesize)
var gCols = Math.floor($(".StarsWrapper").innerHeight() / tilesize)

var vals = _.shuffle(_.range(tilecount))
var xpos = _.shuffle(_.range(gRows))
var ypos = _.shuffle(_.range(gCols))

_.each(vals, function (d, i) {
	var $SmallStarsI = $("<div/>").addClass("Stars")
	$SmallStarsI
		.css({
			position: "absolute",
			left: xpos[i] * tilesize + "px",
			top: ypos[i] * tilesize + "px"
		})
		.appendTo(".StarsWrapper")
		.html(d)

	var SmallStarsII = $("<div/>").addClass("StarBottom")
	SmallStarsII.css({
		position: "absolute",
		left: xpos[i] * tilesize + "px",
		top: ypos[i] * tilesize + "px"
	})
		.appendTo(".StarsWrapper")
		.html(d)

	var $BigStarsI = $("<div/>").addClass("BigStars")
	$BigStarsI
		.css({
			position: "absolute",
			left: xpos[i] * tilesize * 3 + "px",
			top: ypos[i] * tilesize * 3 + "px"
		})
		.appendTo(".StarsWrapper")
		.html(d)

	var $BigStarsII = $("<div/>").addClass("BigStarsBottom")
	$BigStarsII
		.css({
			position: "absolute",
			left: xpos[i] * tilesize * 3 + "px",
			top: ypos[i] * tilesize * 3 + "px"
		})
		.appendTo(".StarsWrapper")
		.html(d)
})
</script>

<style lang="scss" scoped>
$BKcolor: #5749aa;

body {
  background-color: $BKcolor;
  cursor: pointer;
  padding: 0;
  margin: 0;
}

.wrapper { 
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  position: relative;
}


.StarsWrapper {
  font-size: 400px;
  position: relative;
  height: 80vh;
  z-index:-10;
  overflow:hidden;
  opacity:0.5;

}

.StarsWrapper:after {
  content: "";
  background: $BKcolor;
  background: linear-gradient(0deg, rgba(87,73,170,1) 0%, rgba(87,73,170,0.8634804263502276) 23%, rgba(87,73,170,0.6449930313922444) 55%, rgba(87,73,170,0) 100%);
  bottom:0;
  width:100%;
  height:100%;
  position:absolute;
  left:0;
}



/* top part of the small stars*/
.Stars {
  position: absolute;
  top: 100px;
  left: 100px;
  width: 10px;
  height: 10px;
  background: #fff;
  overflow:hidden;
  animation: glitter 6.5s linear 0s infinite normal;
  -webkit-animation: glitter 6.5s linear 0s infinite normal;
  -moz-animation: glitter 6.5s linear 0s infinite normal;
  -ms-animation: glitter 6.5s linear 0s infinite normal;
  -o-animation: glitter 6.5s linear 0s infinite normal;
}

.Stars:before,.Stars:after{
  content: "";
  width: 10px;
  height: 10px;
  background: $BKcolor;
  top:-50%;

  position: absolute;
  border-radius:50%
}

.Stars:before{
  left:50%;
}

.Stars:after {
  left:-50%;

}


/* bottom part of the small stars*/
.StarBottom {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 10px;
  height: 10px;
  overflow: hidden;

}

.StarBottom:before, .StarBottom:after{
  content: "";
  width: 10px;
  height: 10px;
  background: $BKcolor;
  top:50%;
  position: absolute;
  border-radius:50%;
}

.StarBottom:before{ 
  left:50%;
}
.StarBottom:after {
  left:-50%;
}




/* top part of the small stars*/
.BigStars {
  position: absolute;
  top: 100px;
  left: 100px;
  width: 20px;
  height: 20px;
  background: #fff;
  overflow:hidden;
  animation: glitter 2.5s linear 2s infinite normal;
  -webkit-animation: glitter 2.5s linear 2s infinite normal;
  -moz-animation: glitter 2.5s  linear 0s infinite normal;
  -ms-animation: glitter 2.5s  linear 0s infinite normal;
  -o-animation: glitter 2.5s  linear 0s infinite normal;
}

.BigStars:before, .BigStars:after{
  content: "";
  width: 20px;
  height: 20px;
  background: $BKcolor;
  top:-50%;
  position: absolute;
  border-radius:50%
}

.BigStars:before{
  left:50%;
}

.BigStars:after {
  left:-50%;
}



/* bottom part of the small stars*/
.BigStarsBottom {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 20px;
  height: 20px;
  overflow: hidden;

}

.BigStarsBottom:before,.BigStarsBottom:after {
  content: "";
  width: 20px;
  height: 20px;
  background: $BKcolor;
  top:50%;
  position: absolute;
  border-radius:50%;
}

.BigStarsBottom:before{
  left:50%;
}

.BigStarsBottom:after {
  left:-50%;
}

/* a background to hide shooting stars when fall */
.MountainBK{
  position: absolute;
  z-index: -12;
  bottom: 0px;
  background:$BKcolor;
  background: linear-gradient(0deg, rgba(87,73,170,1) 0%, rgba(87,73,170,1) 88%, rgba(87,73,170,0) 100%);
  width:100%;
  height:210px;
  opacity:1;
}

.MountainBottom {
  position: absolute;
  z-index: -5;
  bottom: -140px;
  -ms-transform: scale(.9, .5);
  -webkit-transform: scale(.9, .5);
  transform: scale(1, .5);
  opacity:0.5;
}


.TopMout {
  fill: url(#TopMout);
  opacity:0.5;
}

.MountainTop {
  position: absolute;
  bottom: -190px;
  opacity: 1;
  -ms-transform: scale(.9, .5);
  -webkit-transform: scale(.9, .5);
  transform: scale(1, .5);
}



.Moon {
  position: absolute;
  left: 40%;
  bottom: 300px;
  margin: auto;
  width: 170px;
  height: 170px;
  background: $BKcolor;
  z-index: -6;
}

/* moon background to hide grneated stars behind of the moon */
.Moon:after {
  content: "";
  position: absolute;
  left:30%;
  top:30%;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: #fff;
  opacity: 1;
  box-shadow: 0px 0px 540px 50px #fff;
  z-index: -7;
  -webkit-animation: glowing 1.5s  linear infinite;
  -moz-animation: glowing 1.5s  linear infinite alternate;
  -ms-animation: glowing 1.5s  linear infinite alternate;
  -o-animation: glowing 1.5s  linear infinite alternate;
  animation: glowing 1.5s linear infinite alternate;
}


.Shadows {
  position: absolute;
  left: 10px;
  bottom: -50px;
  width: 100%;
  height: 50px;
  z-index: 5;
  opacity:1;
}

.Shadows:after,.Shadows:before {
  position: absolute;
  content: "";
  width: 70px;
  height: 70px;
    box-shadow: 0px 0px 840px 130px #000;
  -webkit-box-shadow: 0px 0px 840px 130px #000;
  -moz-box-shadow: 0px 0px 840px 130px #000;
}

/* right shadow */
.Shadows:after {
  right: 50px;
  bottom: -30px;
    opacity:0.7;

}

/* left shadow  */
.Shadows:before {
  left: 60px;
  bottom: -50px;
    opacity:0.3;

}

.ShootingStar { 
  transform:rotate(-45deg);
  margin: 25px 0;
  top:100%;
  right:20%;
  position:absolute;
  height: 2px;
  border: 0;
  opacity:0.5;
  width:150px;
  z-index:-20;
  background: #fff;
  box-shadow: 0px 0px 70px 1px #fff;
  -webkit-box-shadow:0px 0px 70px 1px #fff;
  -moz-box-shadow:0px 0px 70px 1px #fff;
  background: -webkit-gradient(linear, 0 0, 100% 10, from($BKcolor), to($BKcolor), color-stop(0%, #fff));
  -moz-animation:ShootingStarsOne 2s  linear 3s,
    ShootingStarsTwo 2s  linear 9s;
  -ms-animation:ShootingStarsOne 2s  linear 3s,
    ShootingStarsTwo 2s  linear 9s;
  -o-animation: ShootingStarsOne 2s  linear 3s,
    ShootingStarsTwo 2s  linear 9s;
  animation:ShootingStarsOne 2s  linear 3s,
    ShootingStarsTwo 2s  linear 6s,
    ShootingStarsOne 2s  linear 10s,ShootingStarsTwo 2s  linear 15s,
     ShootingStarsOne 2s  linear 20s,
    ShootingStarsTwo 2s  linear 25s,
    ShootingStarsOne 2s  linear 32s,ShootingStarsTwo 2s  linear 40s;
    -webkit-animation:ShootingStarsOne 2s  linear 3s,
    ShootingStarsTwo 2s  linear 6s,
    ShootingStarsOne 2s  linear 10s,ShootingStarsTwo 2s  linear 15s,
     ShootingStarsOne 2s  linear 20s,
    ShootingStarsTwo 2s  linear 25s,
    ShootingStarsOne 2s  linear 32s,ShootingStarsTwo 2s  linear 40s;
}
.ShootingStar:after {
  content: "";
  position:absolute;
  height:5px;
  width:7px;
  top:-2px;
  left:-3px;
  border-radius:55%;
  background:#fff;
  box-shadow: 0px 0px 40px 10px #fff;
}



@keyframes glowing {
  from {box-shadow: 0px 0px 100px 10px #fff;}
  to { box-shadow: 0px 0px 140px 20px #fff;}
}

@-webkit-keyframes glowing {
  from {-webkit-box-shadow: 0px 0px 540px 50px #fff;}
  to {-webkit-box-shadow: 0px 0px 240px 60px #fff;}
}

@-moz-keyframes glowing {
  from {-moz-box-shadow: 0px 0px 540px 50px #fff;}
  to {-moz-box-shadow: 0px 0px 240px 60px #fff;}
}


@-moz-keyframes glitter {
  0% {-moz-transform: scale(0.8); opacity: 1;}
  25% {-moz-transform: scale(0.5); opacity: 0.5;}
  50% {-moz-transform: scale(0.8); opacity: 1;}
  75% {-moz-transform: scale(0.5); opacity: 0.5;}
  100% { -moz-transform: scale(0.8); opacity: 1;}
} 


@-webkit-keyframes glitter {
  0% {-webkit-transform: scale(0.8); opacity: 1;}
  25% {-webkit-transform: scale(0.5); opacity: 0.5;}
  50% {-webkit-transform: scale(0.8); opacity: 1;}
  75% {-webkit-transform: scale(0.5); opacity: 0.5;}
  100% { -webkit-transform: scale(0.8); opacity: 1;}
}


@-moz-keyframes glitter {
  0% {-moz-transform: scale(1.0); opacity: 1;}
  25% {-moz-transform: scale(0.5);opacity: 0.5;}
  50% {-moz-transform: scale(1.0); opacity: 1;}
  75% { -moz-transform: scale(0.5); opacity: 0.5;}
  100% { -moz-transform: scale(1.0); opacity: 1;}
}


@keyframes ShootingStarsOne {
  from {opacity:1;width:150px;left:80%;top:-500px;
    -webkit-transform:rotate(-45deg) height}
  to {opacity:0; width:350px;left:-50%;top:550px;
    -webkit-transform:rotate(-20deg)}
}

@-webkit-keyframes ShootingStarsOne {
  from {opacity:1; width:150px;left:80%;top:-500px;
    -webkit-transform:rotate(-45deg) height}
  to {opacity:0; width:350px;left:-50%;top:550px;
    -webkit-transform:rotate(-20deg)}
}

@-webkit-keyframes ShootingStarsTwo {
  from {opacity:1; width:150px;left:120%;top:-500px;
    -webkit-transform:rotate(-45deg) height}
  to {opacity:0; width:350px;left:45%;top:550px;
    -webkit-transform:rotate(-40deg)}
}

@-moz-keyframes ShootingStarsTwo {
  from {opacity:1; width:150px;left:120%;top:-500px;
    -moz-transform:rotate(-45deg) height}
  to {opacity:0; width:350px;left:45%;top:550px;
    -moz-transform:rotate(-40deg)}
}


@-moz-keyframes ShootingStarsTwo {
  from {opacity:0; width:150px;left:120%;top:-500px; 
    -moz-transform:rotate(-45deg) height}
  to {opacity:1; width:350px;left:45%;top:550px;
    -moz-transform:rotate(-40deg)}
} 

@keyframes ShootingStarsTwo {
  from {opacity:1; width:150px;left:120%;top:-500px;
    transform:rotate(-45deg) height}
  to {opacity:0; width:350px;left:45%;top:550px;
    transform:rotate(-40deg)}
}
</style>
<template>
<div class="book">
  <div class="inner-book">
    <div class="img" :style="{
    	paddingTop: `calc(${1/ratio * 100}%)`
    }">
      <q-img :src="src" class="element-img">
      	<slot />
      </q-img>
    </div>
    <div class="page"></div>
    <div class="page page-2"></div>
    <div class="page page-3"></div>
    <div class="img final-page" :style="{
    	paddingTop: `calc(${1/ratio * 100}%)`
    }">
      <q-img :src="src" class="element-img" />
    </div>
  </div>
</div>
</template>

<script lang=ts setup>
defineProps<{
	ratio: number
	src: string
}>()
</script>

<style lang="scss" scoped>.book {
	display: flex;
	flex-direction: column;
	justify-content: center;
	transform: translateZ(0);
	padding-right: 11px
}
.inner-book {
	display: flex;
	align-items: center;
	transform-style: preserve-3d;
	perspective: 2000px;

	&:before {
		content: "";
		width: 100%;
		position: absolute;
		height: 0;
		bottom: 14px;
		transform: rotateY(-20deg) translateZ(-20px);
		z-index: 0;
		box-shadow: 10px 12px 20px 13px rgba(0, 0, 0, 0.3);
	}
	.img {
		transform: rotateY(-20deg);
		width: 100%;
		z-index: 5;
		clear: both;
		height: 100%;
		background: #ddd;
		&:before {
			content: "";
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			border: 2px solid rgba(0, 0, 0, 0.2);
			box-sizing: border-box;
			border-left: 4px solid rgba(0, 0, 0, 0.3);
			z-index: 2;
		}
	}
	.element-img {
		width: 100%;
		height: 100%;
		display: block;
		position: absolute;
		top: 0;
	}
}
.page {
	width: calc(100% - 20px);
	height: calc(100% - 2px);
	position: absolute;
	box-shadow: inset 0px -1px 2px rgba(50, 50, 50, 0.2),
    inset -1px 0px 1px rgba(150, 150, 150, 0.1);
	border-radius: 0px 3px 3px 0px;
	transform: rotateY(-20deg) translateZ(-5px);
	right: -3px;
	z-index: 4;
	background: white;
}
.page-2 {
	height: calc(100% - 4px);
	right: -6px;
	z-index: 3;
}
.page-3 {
	height: calc(100% - 6px);
	right: -9px;
	z-index: 2;
}
.page-4 {
	height: calc(100% - 8px);
	right: -12px;
	z-index: 1;
}
.page-5 {
	height: calc(100% - 10px);
	right: -15px;
	z-index: 0;
}
.img {
	&.final-page {
		position: absolute;
		z-index: -1;
		right: -11px; // 17px
		transform: rotateY(-19deg) translateZ(-10px) scale(0.984);
	}
}
</style>
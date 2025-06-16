<template>
	<div>
		<div class="bg">
			<span v-for="i in 10" :key="i" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
.bg {
	@apply absolute top-0 left-0 size-100%;
	background: {
		image: url(/src/assets/bg2.jpg);
		position-x: center;
		size: cover;
	}

	animation: zoom 50s linear infinite;
	@keyframes zoom {
		from,
		to {
			transform: scale(1);
		}
		50% {
			transform: scale(1.2);
		}
	}

	span {
		@apply absolute size-4px bg-#fff top-1/2 left-1/2 rounded-1/2;
		box-shadow:
			0 0 0 4px rgba(255, 255, 255, 0.2),
			0 0 0 8px rgba(255, 255, 255, 0.1),
			0 0 20px rgba(255, 255, 255, 1);
		animation: anim 3s linear infinite;
		&:before {
			content: "";
			@apply absolute top-1/2 translate-x--1/2  w-300px h-1px;
			background: linear-gradient(90deg, #fff, transparent);
		}

		@keyframes anim {
			from {
				transform: rotate(315deg) translateX(0);
				opacity: 1;
			}
			70% {
				opacity: 1;
			}
			to {
				transform: rotate(315deg) translateX(-1000px);
				opacity: 0;
			}
		}

		&:nth-child(1) {
			@apply top-0 right-0 left-inital;
			animation: {
				delay: 0;
				duration: 1s;
			}
		}
		&:nth-child(2) {
			@apply top-0 right-80px left-inital;
			animation: {
				delay: 0.2s;
				duration: 3s;
			}
		}
		&:nth-child(3) {
			@apply top-80px right-0 left-inital;
			animation: {
				delay: 0.4s;
				duration: 2s;
			}
		}
		&:nth-child(4) {
			@apply top-0 right-180px left-inital;
			animation: {
				delay: 0.6s;
				duration: 1.5s;
			}
		}
		&:nth-child(5) {
			@apply top-0 right-400px left-inital;
			animation: {
				delay: 0.8s;
				duration: 2.5s;
			}
		}
		&:nth-child(6) {
			@apply top-0 right-600px left-inital;
			animation: {
				delay: 1s;
				duration: 3s;
			}
		}
		&:nth-child(7) {
			@apply top-300px right-0 left-inital;
			animation: {
				delay: 1.2s;
				duration: 1.75s;
			}
		}
		&:nth-child(8) {
			@apply top-0 right-700px left-inital;
			animation: {
				delay: 1.4s;
				duration: 1.25s;
			}
		}
		&:nth-child(9) {
			@apply top-0 right-1000px left-inital;
			animation: {
				delay: 0.75s;
				duration: 2.25s;
			}
		}
		&:nth-child(10) {
			@apply top-0 right-450px left-inital;
			animation: {
				delay: 2.75s;
				duration: 2.25s;
			}
		}
	}
}
</style>

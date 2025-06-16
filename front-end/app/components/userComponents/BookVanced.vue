<template>
  <q-responsive class="relative book-vanced">
    
<!-- Please heart it if you like! -->
<div id='book'>
  <div id='top'></div>
  <div id='front'></div>
  <div id='right'></div>
  <div id='bottom'></div>
  <!-- <div id='shadow'></div> -->
  <div id='bookmark'>
    <div>
      <div>
        <div>
          <div></div>
        </div>
      </div>
    </div>
  </div>
  <div id='bookmark-shadow'></div>
</div>
<div id='flip' :style="{
  '--bg-url': `url(${src})`
}">
  <div id='front'>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div id='back'>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  </q-responsive>
</template>

<script lang=ts setup>
defineProps<{
  src: string
}>()
</script>

<style lang="scss" scoped>
#flip {
  animation: wrapper 6s ease-in-out infinite;
  @apply size-100%
  position: absolute;
  transform: translateZ(-10px) rotateX(20deg/*60deg*/) rotateZ(0deg /*29deg*/)!important;
  transform-style: preserve-3d;
  transform-origin: 0 0 0;
}
@keyframes wrapper {
  50% {
//    transform: translateZ(-10px) rotateX(60deg) rotateZ(29deg) rotateY(180deg);
  }
}
#flip div {
  height: 100%;
  width: calc(10% - 1px);
  position: absolute;
  left: calc(100% - 1px);
  transform-origin: 0 100%;
  transform-style: preserve-3d;
  background: {
    size: 1000% 100%;
repeat: no-repeat;
position: center;
  }
}
#flip div div {
  width: 100%;
}
#flip #front, 
#flip #front div {
  background-image: var(--bg-url);
  box-shadow: inset rgba(255,255,255,0.3) 0px -1px 0 0,#35582C 0px 1px 0px 0px;
}
#flip #front > div > div > div > div > div > div > div > div > div > div { 
  box-shadow: inset rgba(255,255,255,0.3) -1px -1px 0 0, #35582C 1px 1px 0px 0px;
}
#flip #back { transform: rotateY(.2deg); } /* avoid pages overlap */
#flip #back,
#flip #back div {
  background-image:var(--bg-url);
}

#flip > div {  left: 0;  background-position-x: 0; }
#flip div > div { background-position-x: calc(10% + 1px); transition: transform .444s; animation: page 6s ease-in-out infinite; }
#flip div > div > div { background-position-x :calc(20% + 2px); } 
#flip div > div > div > div { background-position-x : calc(30% + 3px); }
#flip div > div > div > div > div { background-position-x : calc(40% + 4px); }
#flip div > div > div > div > div > div { background-position-x : calc(50% + 5px); }
#flip div > div > div > div > div > div > div { background-position-x : calc(60% + 6px); }
#flip div > div > div > div > div > div > div > div  { background-position-x : calc(70% + 7px); }
#flip div > div > div > div > div > div > div > div > div { background-position-x : calc(80% + 8px) }
#flip div > div > div > div > div > div > div > div > div > div { background-position-x : calc(90% + 9px) }
#flip div > div > div > div > div > div > div > div > div > div > div { background-position-x : calc(100% + 10px) }
/* the more pieces you have, the smoother the bend is */


.book-vanced:hover #flip div > div {
   transform: rotateY(-20deg);
   }/*
@keyframes page {
  15% { transform: rotateY(-10deg); }
  50% { transform: rotateY(-2deg); }
  65% { transform: rotateY(10deg); }
  100% { transform: rotateY(0deg); }
}*/

#book {
  @apply size-100%;
  position: absolute;
  transform: translate3d(0px,0px,-10px) rotateX(20deg/*60deg*/) rotateZ(0deg/*29deg*/);
  transform-style: preserve-3d;
  -webkit-transform-origin: 0 0 0;
}
@keyframes book {
  25% {
    box-shadow: inset rgba(0,0,0,.2) 0px 0 50px -140px;
  }
  50% {
    box-shadow: inset rgba(0,0,0,.2) 0px 0 50px -140px;
  }
  100% {
    box-shadow: inset rgba(0,0,0,.2) 510px 0 50px -140px;
  }
}
#book #top {
  animation: book 6s ease-in-out infinite;
  background: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/164210/map2.jpg);
  background-size: 100% 100%;
  background-position: 100%;
  box-shadow: inset rgba(0,0,0,0.2) 510px 0 50px -140px;
  @apply size-100%;
  position: absolute;
  left: 0;
  top: 0;
}
#book #bottom {
  background: #E7DED1;
  box-shadow: rgba(83, 53, 13, 0.2) 4px 2px 1px,
              #35582C 1px 1px 0px 0px;
  @apply size-100%;
  position: absolute;
  transform: translateZ(-40px);
  left: 0;
  top: 0;
}
#book #shadow {
  animation: shadow 6s ease-in-out infinite;
  box-shadow: inset rgba(83, 53, 13, 0) -200px 0 150px -140px;
  @apply size-100%;
  position: absolute;
  left: -100%;
  top: 0;
  transform: translateZ(-40px);
}
@keyframes shadow {
  20% {
    box-shadow: inset rgba(83, 53, 13, 0) -200px 0 150px -140px;
  }
  50% { 
    box-shadow: inset rgba(83, 53, 13, 0.3) -350px 0 150px -140px;
  }
  60% { 
    box-shadow: inset rgba(83, 53, 13, 0) -200px 0 150px -140px;
  }
}
#book #front {
  background: -webkit-linear-gradient(top,#FCF6EA, #D8D1C3);
  background-size: 100% 2px; 
  box-shadow: inset #C2BBA2 3px 0 0px, #35582C -2px 1px 0px 0px;
  height: 40px;
  width: 100%;
    left: -3px;
  position: absolute;
  bottom: -40px;
  transform: rotateX(-90deg);
  transform-origin: 50% 0;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
}
#book #right {
  background: -webkit-linear-gradient(left,#DDD2BB, #BDB3A0);
  background-size: 2px 100%; 
  box-shadow: inset rgba(0,0,0,0) 0 0 0 20px;
  height: 100%;
  width: 40px;
  position: absolute;
  right: -40px;
  top: 0;
  transform: rotateY(90deg);
  transform-origin: 0 50%;
}

#next {
  position: absolute;
  bottom: 20px;
  right: 20px;
  margin: 0;
  font-weight: 200;
  opacity: .5;
  font-family: sans-serif;
  color: rgba(0,0,0,0.3);
  text-decoration: none;
}
#next:hover {
  opacity: 1
}

/* bookmark */

#bookmark {
  position: absolute;
  transform: translate3d(20px,350px,-16px);
  transform-style: preserve-3d;
}
#bookmark div {
  background: rgb(151, 88, 88);
  box-shadow: rgb(133,77,77) 1px 0;
  height: 10px;
  width: 20px;
  position: absolute;
  top: 9px;
  transform: rotateX(-14deg);
  transform-origin: 50% 0;
  transform-style: preserve-3d;
}
#bookmark > div > div {
  background: linear-gradient(top, rgb(151, 88, 88), rgb(189, 123, 123), rgb(151, 88, 88));
}
#bookmark > div > div > div {
  background: linear-gradient(top,rgb(151, 88, 88),rgb(133, 77, 77));
}
#bookmark > div > div > div > div {
  background: none;
  border-top: 0px solid transparent;
  border-right: 10px solid rgb(133, 77, 77);
  border-bottom: 10px solid transparent;
  border-left: 10px solid rgb(133, 77, 77);
  height: 0;
  width: 0;
}
#bookmark-shadow {
  background: linear-gradient(top,rgba(83, 53, 13, 0.25),rgba(83, 53, 13, 0.11));
  height: 15px;
  width: 20px;
  position: absolute;
  transform: translate3d(12px,350px,-25px) rotateX(-90deg) skewX(20deg);
  transform-origin: 0 0;
}
</style>
<template>
  <div class="bg-light-200 bg-opacity-30 overflow-hidden px-10 py-2">
    <v-btn
      rounded="lg"
      tonal
      size="small"
      class="bg-transparent hover:bg-gray-600"
    >
      <v-icon size="1.5rem">mdi-chevron-left</v-icon>
    </v-btn>
    <div class="flex flex-nowrap justify-between pb-5">
      <div class="left min-w-0 flex-1 m-3">
        <div class="text-30px font-600">The Here And Now</div>
        <div class="text-14px text-opacity-60">Jillian Lawrence</div>
        <div class="my-3 text-12px text-opacity-90 flex items-center">
          <svg
            class="w-4 h-4 text-yellow-300 ms-1"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 22 20"
          >
            <path
              d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
            />
          </svg>
          <span class="ml-2">4.3 / 5 (1.2k rating)</span>
        </div>
        <div class="mt-13 m">
          <NuxtLink to="/novel/chapter" class="text-yellow-200">
            <button  class="bg-[#8096A1] p-3 rounded-2xl">Read Now</button>
          </NuxtLink>
        </div>
      </div>

      <div class="w-170px relative mt-4">
        <img
          class="w-full rounded-30px"
          src='https://assets.api.uizard.io/api/cdn/stream/fda27036-11a7-4a5f-ab1e-7edbc0c2d0fe.png"'
        />
        <div
          class="absolute inset-0 flex justify-center items-center -translate-y-25px"
        >
          <div class="text-white text-20px font-semibold flex-col w-40px">
            The Here And Now
          </div>
        </div>
        <div
          class="absolute inset-0 flex flex-col justify-end items-center -translate-y-30px text-white text-xs font-semibold text-cente text-14px text-opacity-80"
        >
          Jillian Lawrence
        </div>
      </div>
    </div>
    <div class="my-3">
      <div class="text-20px font-600 ml">Decription</div>
      <div class="text-14px text-opacity-80 ml">
        An edge-of-your-seat thriller about a crime writer who moves to a
        charming town to research. The first murder in years rocks her idyllic
        world, and she's soon putting her own life in danger to track down the
        serial killer, who is evolving more dangerous with every murder. She
        must solve the mystery before it's too late - for everyone.
      </div>
    </div>
    <div class="">
      <div class="text-20px font-600 ml">List Chapters</div>

      <v-list v-model:selected="selected" select-strategy="leaf">
        <v-list-item
          v-for="item in items"
          :key="item.id"
          :value="item.id"
          active-class="text-pink"
          class="py-3"
          lines="2"
        >
          <v-list-item-title line="2">{{ item.title }}</v-list-item-title>
          <template v-slot:append="{ isSelected }">
            <v-list-item-action class="flex-column align-end">
              <small class="mb-4 text-high-emphasis opacity-60">{{
                item.action
              }}</small>

              <v-spacer></v-spacer>

              <v-icon v-if="isSelected" color="yellow-darken-3"
                >mdi-star</v-icon
              >

              <v-icon v-else class="opacity-30">mdi-star-outline</v-icon>
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>
<script setup>
import { NuxtLink } from "#components";
import { shallowRef } from "vue";

const items = [
  {
    id: 1,
    action: "15 min",
    headline: "Brunch this weekend?",
    subtitle: `I'll be in your neighborhood doing errands this weekend. Do you want to hang out?`,
    title:
      "Chapter 1: Ali Connors I'll be in your neighborhood doing errands this weekend. Do you want to hang out?",
  },
  {
    id: 2,
    action: "2 hr",
    headline: "Summer BBQ",
    subtitle: `Wish I could come, but I'm out of town this weekend.`,
    title: "Chapter 2: me, Scrott, Jennifer",
  },
  {
    id: 3,
    action: "6 hr",
    headline: "Oui oui",
    subtitle: "Do you have Paris recommendations? Have you ever been?",
    title: "Chapter 3: Sandra Adams",
  },
  {
    id: 4,
    action: "12 hr",
    headline: "Birthday gift",
    subtitle: "Have any ideas about what we should get Heidi for her birthday?",
    title: "Chapter 4: Trevor Hansen",
  },
  {
    id: 5,
    action: "18hr",
    headline: "Recipe to try",
    subtitle: "We should eat this: Grate, Squash, Corn, and tomatillo Tacos.",
    title: "Chapter 5: Britta Holt",
  },
];

const selected = shallowRef([2]);
</script>

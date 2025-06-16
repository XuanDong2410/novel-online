<template>
  <div class="text-base flex flex-nowrap items-start">
    <q-avatar size="40px">
      <q-img no-spinner src="https://shin.is-a.dev/favicon.ico" />
    </q-avatar>

    <div class="text-sm w-full min-w-0 ml-4">
      <!-- main comment -->
      <div class="flex flex-nowrap">
        <div class="w-full min-w-0">
          <!-- header comment -->
          <div>
            <a
              target="_blank"
              class="text-gray-900 dark:text-white font-semibold"
            >
              Tachibana Shin
            </a>

            <time
              class="text-0.8rem text-gray-600 dark:text-gray-400 ml-2"
              pubdate
              >10 hours ago</time
            >
          </div>

          <p class="mt-1 text-gray-500 dark:text-gray-200">Hello world</p>

          <div class="flex items-center mx-[-8px] my-1">
            <q-btn
              round
              unelevated
              padding="8px"
              class="text-gray-500 dark:text-gray-100"
            >
              <i-bxs-like v-if="true" class="text-1.2em" />
              <i-bx-like v-else class="text-1.2em" />
            </q-btn>
            <span class="text-sm text-gray-500 dark:text-gray-300">{{
              1
            }}</span>

            <q-btn
              rounded
              unelevated
              no-caps
              class="text-13px text-gray-500 dark:text-gray-100 ml-8px"
            >
              {{ $t("phan-hoi") }}
            </q-btn>
          </div>

          <!-- /header comment -->
        </div>

        <!-- button more options -->
        <div class="min-w-42px">
          <q-btn round>
            <i-solar-menu-dots-bold class="transform rotate-90" />
          </q-btn>
        </div>
        <!-- /button more options -->
      </div>
      <!-- /main comment -->
    </div>
  </div>
</template>

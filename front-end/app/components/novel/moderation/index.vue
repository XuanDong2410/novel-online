<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center justify-between px-4 py-4 sm:px-6">
        <div class="flex items-center gap-4">
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            size="sm"
            to="/moderation"
          />
          <div class="min-w-0 flex-1">
            <h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
              {{ currentNovel.title }}
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
              Tác giả: {{ currentNovel.author }} • Chương {{ currentChapter.number }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Review Status -->
          <UBadge
            :color="getStatusColor(reviewStatus)"
            variant="subtle"
            size="sm"
            class="hidden sm:inline-flex"
          >
            {{ getStatusLabel(reviewStatus) }}
          </UBadge>

          <!-- Timer -->
          <div class="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <UIcon name="i-lucide-clock" class="w-4 h-4" />
            <span class="text-xs sm:text-sm font-mono">{{ formatTime(reviewTime) }}</span>
          </div>

          <!-- Actions -->
          <UButton
            icon="i-lucide-save"
            variant="outline"
            size="xs"
            class="hidden sm:inline-flex"
            @click="saveDraft"
          >
            Lưu nháp
          </UButton>

          <UDropdownMenu :items="headerActions">
            <UButton
              icon="i-lucide-more-horizontal"
              variant="ghost"
              size="sm"
            />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="h-1 bg-gray-200 dark:bg-gray-800">
        <div
          class="h-full bg-primary-500 transition-all duration-300"
          :style="{ width: `${reviewProgress}%` }"
        />
      </div>
    </header>

    <div class="flex flex-col lg:flex-row max-h-[calc(100vh-100px)]">
      <!-- Main Content Area -->
      <!-- Sidebar - Chapter List -->
      <div class="flex-1 flex flex-col lg:flex-row max-w-full overflow-y-auto mx-auto">
        <USlideover v-model:open="sidebarOpen" side="left">
          <template #content>
            <div class="space-y-2 overflow-y-auto h-[calc(100vh-10px)] my-2">
              <div class="flex items-center justify-between mb-4 mx-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  Danh sách chương
                </h3>
                <UBadge color="primary" variant="subtle">
                  {{ pendingChapters.length }} chờ duyệt
                </UBadge>
              </div>
              <div
                v-for="chapter in chapters"
                :key="chapter.id"
                class="p-3 mx-2 rounded-lg border cursor-pointer transition-colors"
                :class="[
                  currentChapter.id === chapter.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
                @click="selectChapter(chapter)"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-sm truncate">{{ chapter.title }}</span>
                  <UBadge
                    :color="getStatusColor(chapter.status)"
                    variant="subtle"
                    size="xs"
                  >
                    {{ getStatusLabel(chapter.status) }}
                  </UBadge>
                </div>

                <div class="flex items-center gap-2 sm:gap-4 text-xs text-gray-500">
                  <span>{{ chapter.wordCount }} từ</span>
                  <span>{{ chapter.submittedAt }}</span>
                </div>

                <!-- Issues Count -->
                <div v-if="chapter.issues > 0" class="flex items-center gap-1 mt-2">
                  <UIcon name="i-lucide-alert-triangle" class="w-3 h-3 text-orange-500" />
                  <span class="text-xs text-orange-600">{{ chapter.issues }} vấn đề</span>
                </div>
              </div>
            </div>
          </template>
        </USlideover>
        <!-- Content Panel -->
        <div class="flex flex-col flex max-w-[60%]  lg:w-auto ">
          <!-- Content Header -->
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div class="flex items-center gap-2 sm:gap-4">
              <UButton
                icon="i-lucide-menu"
                variant="ghost"
                size="sm"
                @click="sidebarOpen = true"
              />
              <h2 class="font-semibold text-gray-900 dark:text-white truncate">
                {{ currentChapter.title }}
              </h2>
              <div class="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span>{{ currentChapter.wordCount }} từ</span>
                <span class="hidden sm:inline">•</span>
                <span class="hidden sm:inline">Gửi lúc {{ currentChapter.submittedAt }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <!-- View Options -->
              <UButtonGroup size="xs" class="hidden sm:flex">
                <UButton
                  :variant="viewMode === 'original' ? 'solid' : 'outline'"
                  @click="viewMode = 'original'"
                >
                  Gốc
                </UButton>
                <UButton
                  :variant="viewMode === 'annotated' ? 'solid' : 'outline'"
                  @click="viewMode = 'annotated'"
                >
                  Có chú thích
                </UButton>
                <UButton
                  :variant="viewMode === 'diff' ? 'solid' : 'outline'"
                  @click="viewMode = 'diff'"
                >
                  So sánh
                </UButton>
              </UButtonGroup>

              <!-- Text Tools -->
              <UButton
                icon="i-lucide-search"
                variant="ghost"
                size="sm"
                @click="showSearchModal = true"
              />
              <UButton
                icon="i-lucide-type"
                variant="ghost"
                size="sm"
                @click="showTextTools = !showTextTools"
              />
            </div>
          </div>

          <!-- Text Tools Bar -->
          <div v-if="showTextTools" class="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div class="flex flex-wrap items-center gap-4">
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium">Cỡ chữ:</label>
                <USlider
                  v-model="fontSize"
                  :min="12"
                  :max="20"
                  :step="1"
                  class="w-20"
                />
                <span class="text-sm">{{ fontSize }}px</span>
              </div>

              <div class="flex items-center gap-2">
                <label class="text-sm font-medium">Khoảng cách:</label>
                <USelectMenu
                  v-model="lineHeight"
                  :options="[
                    { label: '1.4', value: '1.4' },
                    { label: '1.6', value: '1.6' },
                    { label: '1.8', value: '1.8' },
                    { label: '2.0', value: '2.0' }
                  ]"
                  size="sm"
                />
              </div>

              <UButton
                icon="i-lucide-highlight"
                variant="ghost"
                size="sm"
                :class="highlightMode ? 'text-yellow-600' : ''"
                @click="highlightMode = !highlightMode"
              >
                Highlight
              </UButton>
            </div>
          </div>

          <!-- Content Display -->
          <div class="overflow-y-scroll flex-1  p-4 sm:p-6 bg-white dark:bg-gray-900">
            <article
              class="prose prose-sm sm:prose-lg dark:prose-invert max-w-none"
              :style="{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight
              }"
            >
              <div v-if="viewMode === 'original'" class="content-original">
                <div
                  v-for="(paragraph, index) in contentParagraphs"
                  :key="index"
                  class="paragraph-container"
                  :data-paragraph="index"
                >
                  <p
                    class="paragraph"
                    :class="{ 'highlight-enabled': highlightMode }"
                    @mouseup="handleTextSelection"
                  >
                    <span
                      v-for="(segment, segIndex) in paragraph.segments"
                      :key="segIndex"
                      :class="getSegmentClass(segment)"
                      @click="segment.hasIssue ? showIssueDetails(segment) : null"
                    >
                      {{ segment.text }}
                    </span>
                  </p>

                  <!-- Inline Comments -->
                  <div v-if="paragraph.comments.length > 0" class="mt-2 space-y-2">
                    <div
                      v-for="comment in paragraph.comments"
                      :key="comment.id"
                      class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded-r-lg"
                    >
                      <div class="flex items-start gap-3">
                        <UAvatar :src="comment.reviewer.avatar" size="xs" />
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="text-sm font-medium">{{ comment.reviewer.name }}</span>
                            <span class="text-xs text-gray-500">{{ comment.createdAt }}</span>
                          </div>
                          <p class="text-sm">
                            {{ comment.content }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="viewMode === 'annotated'" class="content-annotated">
                <div v-html="annotatedContent" />
              </div>

              <div v-else-if="viewMode === 'diff'" class="content-diff">
                <div v-html="diffContent" />
              </div>
            </article>
          </div>
        </div>
        <!-- Right Panel - Moderation Tools -->
        <!-- <div
          class="fixed inset-x-0 bottom-0 lg:relative lg:w-96 bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 flex flex-col z-30 transition-all duration-300"
          :class="[toolsOpen ? 'translate-y-0 h-[100vh-85px]' : 'translate-y-full lg:translate-y-10 lg:w-[60px] lg:h-auto']"
        > -->
        <!-- Tools Header -->
        <div class="flex-1 overflow-y-auto">
          <!-- Tools Header -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Công cụ kiểm duyệt
            </h3>
          </div>

          <!-- Tools Content -->
          <div class="flex-1">
            <UTabs :items="toolTabs" class="w-full">
              <!-- Issues Tab -->
              <template #issues>
                <div class="p-4 space-y-4">
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-white mb-3">
                      Vấn đề tự động phát hiện
                    </h4>
                    <div class="space-y-2">
                      <div
                        v-for="issue in detectedIssues"
                        :key="issue.id"
                        class="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        :class="getIssueColor(issue.severity)"
                        @click="highlightIssue(issue)"
                      >
                        <div class="flex items-start gap-3">
                          <UIcon
                            :name="getIssueIcon(issue.type)"
                            :class="getIssueIconColor(issue.severity)"
                            class="w-4 h-4 mt-0.5"
                          />
                          <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                              <span class="text-sm font-medium">{{ issue.title }}</span>
                              <UBadge
                                :color="getSeverityColor(issue.severity)"
                                variant="subtle"
                                size="xs"
                              >
                                {{ issue.severity }}
                              </UBadge>
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              {{ issue.description }}
                            </p>
                            <div class="text-xs text-gray-500">
                              Dòng {{ issue.line }} • {{ issue.position }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="font-medium text-gray-900 dark:text-white">
                        Vấn đề thủ công
                      </h4>
                      <UButton
                        icon="i-lucide-plus"
                        size="xs"
                        @click="showAddIssueModal = true"
                      >
                        Thêm
                      </UButton>
                    </div>
                    <div class="space-y-2">
                      <div
                        v-for="issue in manualIssues"
                        :key="issue.id"
                        class="p-3 border rounded-lg"
                      >
                        <div class="flex items-start justify-between gap-2">
                          <div class="flex-1">
                            <div class="text-sm font-medium mb-1">
                              {{ issue.title }}
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                              {{ issue.description }}
                            </p>
                          </div>
                          <UDropdownMenu :items="issueActions">
                            <UButton
                              icon="i-lucide-more-horizontal"
                              variant="ghost"
                              size="xs"
                            />
                          </UDropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Guidelines Tab -->
              <template #guidelines>
                <div class="p-4 space-y-4">
                  <h4 class="font-medium text-gray-900 dark:text-white">
                    Checklist kiểm duyệt
                  </h4>
                  <div class="space-y-3">
                    <div
                      v-for="guideline in guidelines"
                      :key="guideline.id"
                      class="flex items-start gap-3"
                    >
                      <UCheckbox
                        v-model="guideline.checked"
                        :color="guideline.checked ? 'success' : 'neutral'"
                      />
                      <div class="flex-1">
                        <label class="text-sm font-medium cursor-pointer">
                          {{ guideline.title }}
                        </label>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {{ guideline.description }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium">Điểm tuân thủ</span>
                      <span class="text-lg font-bold text-green-600">{{ complianceScore }}%</span>
                    </div>
                    <UProgress :value="complianceScore" color="primary" />
                  </div>
                </div>
              </template>

              <!-- Comments Tab -->
              <template #comments>
                <div class="p-4 space-y-4">
                  <div>
                    <UTextarea
                      v-model="newComment"
                      placeholder="Thêm nhận xét..."
                      :rows="3"
                    />
                    <div class="flex items-center justify-between mt-2">
                      <USelectMenu
                        v-model="commentType"
                        :items="commentTypes"
                        size="sm"
                      />
                      <UButton
                        size="sm"
                        :disabled="!newComment.trim()"
                        @click="addComment"
                      >
                        Thêm
                      </UButton>
                    </div>
                  </div>
                  <div class="space-y-3">
                    <div
                      v-for="comment in allComments"
                      :key="comment.id"
                      class="p-3 border rounded-lg"
                    >
                      <div class="flex items-start gap-3">
                        <UAvatar :src="comment.reviewer.avatar" size="sm" />
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="text-sm font-medium">{{ comment.reviewer.name }}</span>
                            <UBadge
                              :color="getCommentTypeColor(comment.type)"
                              variant="subtle"
                              size="xs"
                            >
                              {{ comment.type }}
                            </UBadge>
                            <span class="text-xs text-gray-500">{{ comment.createdAt }}</span>
                          </div>
                          <p class="text-sm">
                            {{ comment.content }}
                          </p>
                          <div class="flex items-center gap-2 mt-2">
                            <UButton
                              icon="i-lucide-reply"
                              variant="ghost"
                              size="xs"
                              @click="replyToComment(comment)"
                            >
                              Trả lời
                            </UButton>
                            <UButton
                              icon="i-lucide-edit"
                              variant="ghost"
                              size="xs"
                              @click="editComment(comment)"
                            >
                              Sửa
                            </UButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Analytics Tab -->
              <template #analytics>
                <div class="p-4 space-y-4">
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-white mb-3">
                      Phân tích nội dung
                    </h4>
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="text-sm">Độ dài trung bình câu</span>
                        <span class="text-sm font-medium">{{ analytics.avgSentenceLength }} từ</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm">Độ khó đọc</span>
                        <UBadge
                          :color="getReadabilityColor(analytics.readabilityScore)"
                          variant="subtle"
                        >
                          {{ analytics.readabilityLevel }}
                        </UBadge>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm">Từ lặp lại</span>
                        <span class="text-sm font-medium">{{ analytics.repetitiveWords }}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-white mb-3">
                      Từ khóa phổ biến
                    </h4>
                    <div class="space-y-2">
                      <div
                        v-for="keyword in analytics.topKeywords"
                        :key="keyword.word"
                        class="flex items-center justify-between"
                      >
                        <span class="text-sm">{{ keyword.word }}</span>
                        <div class="flex items-center gap-2">
                          <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div
                              class="bg-blue-500 h-1 rounded-full"
                              :style="{ width: `${(keyword.count / analytics.maxKeywordCount) * 100}%` }"
                            />
                          </div>
                          <span class="text-xs text-gray-500 w-6">{{ keyword.count }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-white mb-3">
                      Cảnh báo nội dung
                    </h4>
                    <div class="space-y-2">
                      <div
                        v-for="flag in contentFlags"
                        :key="flag.type"
                        class="flex items-center justify-between p-2 rounded"
                        :class="flag.detected ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'"
                      >
                        <div class="flex items-center gap-2">
                          <UIcon
                            :name="flag.detected ? 'i-lucide-alert-triangle' : 'i-lucide-check'"
                            :class="flag.detected ? 'text-red-500' : 'text-green-500'"
                            class="w-4 h-4"
                          />
                          <span class="text-sm">{{ flag.label }}</span>
                        </div>
                        <span class="text-xs text-gray-500">
                          {{ flag.detected ? flag.count + ' lần' : 'Sạch' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </UTabs>
          </div>

          <!-- Action Buttons -->
          <div class="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <UButton
                color="green"
                block
                :disabled="hasBlockingIssues"
                @click="approveChapter"
              >
                <UIcon name="i-lucide-check" class="w-4 h-4 mr-2" />
                Duyệt
              </UButton>
              <UButton
                color="red"
                variant="outline"
                block
                @click="rejectChapter"
              >
                <UIcon name="i-lucide-x" class="w-4 h-4 mr-2" />
                Từ chối
              </UButton>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <UButton
                color="orange"
                variant="outline"
                block
                @click="requestChanges"
              >
                <UIcon name="i-lucide-edit" class="w-4 h-4 mr-2" />
                Yêu cầu sửa
              </UButton>
              <UButton
                color="blue"
                variant="outline"
                block
                @click="escalateReview"
              >
                <UIcon name="i-lucide-arrow-up" class="w-4 h-4 mr-2" />
                Chuyển lên
              </UButton>
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400 text-center pt-2">
              {{ detectedIssues.length }} vấn đề • {{ allComments.length }} nhận xét
            </div>
          </div>
        </div>
        <!-- <div v-else class="hidden lg:flex flex-col items-center justify-center p-2 space-y-4 h-full">
            <UButton
              icon="i-lucide-tool"
              variant="ghost"
              size="sm"
              @click="toolsOpen = true"
            />
            <UBadge color="orange" variant="subtle">
              {{ detectedIssues.length }}
            </UBadge>
          </div> -->
        <!-- </div> -->
      </div>
    </div>

    <!-- Modals -->
    <UModal v-model:open="showSearchModal" title="Tìm kiếm" description="Tìm kiếm trong nội dung của các nhận xét">
      <template #body>
        <UCard>
          <div class="space-y-4">
            <UInput
              v-model="searchQuery"
              placeholder="Nhập từ khóa cần tìm..."
              icon="i-lucide-search"
            />
            <div class="flex flex-wrap gap-4">
              <UCheckbox v-model="searchOptions.caseSensitive" label="Phân biệt hoa thường" />
              <UCheckbox v-model="searchOptions.wholeWord" label="Toàn bộ từ" />
              <UCheckbox v-model="searchOptions.regex" label="Regex" />
            </div>
            <div v-if="searchResults.length > 0" class="max-h-60 overflow-y-auto">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Tìm thấy {{ searchResults.length }} kết quả
              </div>
              <div class="space-y-2">
                <div
                  v-for="(result, index) in searchResults"
                  :key="index"
                  class="p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  @click="jumpToResult(result)"
                >
                  <div class="text-sm">
                    {{ result.context }}
                  </div>
                  <div class="text-xs text-gray-500">
                    Dòng {{ result.line }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </template>
      <template #footer>
        <div class="w-full flex justify-around gap-2">
          <UButton variant="outline" @click="showSearchModal = false">
            Đóng
          </UButton>
          <UButton @click="performSearch">
            Tìm kiếm
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showAddIssueModal" title="Thêm vấn đề mới">
      <template #header>
        <h3 class="text-lg font-semibold">
          Thêm vấn đề mới
        </h3>
      </template>
      <template #body>
        <UCard>
          <div class="space-y-4">
            <UInput
              v-model="newIssue.title"
              placeholder="Tiêu đề vấn đề"
              label="Tiêu đề"
            />
            <UTextarea
              v-model="newIssue.description"
              placeholder="Mô tả chi tiết vấn đề"
              label="Mô tả"
              :rows="3"
            />
            <USelectMenu
              v-model="newIssue.type"
              :options="issueTypes"
              label="Loại vấn đề"
            />
            <USelectMenu
              v-model="newIssue.severity"
              :options="severityLevels"
              label="Mức độ nghiêm trọng"
            />
            <UInput
              v-model="newIssue.line"
              type="number"
              placeholder="Số dòng"
              label="Vị trí (dòng)"
            />
          </div>
        </UCard>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="showAddIssueModal = false">
            Hủy
          </UButton>
          <UButton @click="addManualIssue">
            Thêm vấn đề
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useHead } from '@vueuse/head'

// Thêm state cho responsive
const isMobile = ref(false)

onMounted(() => {
  // Kiểm tra kích thước màn hình
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 1024
    if (isMobile.value) {
      sidebarOpen.value = false
      toolsOpen.value = false
    } else {
      sidebarOpen.value = true
      toolsOpen.value = true
    }
  }

  checkMobile()
  window.addEventListener('resize', checkMobile)

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })
})

// Reactive data
const sidebarOpen = ref(false) // Default closed on mobile
const toolsOpen = ref(false) // Default closed on mobile
const reviewStatus = ref('in_progress')
const reviewTime = ref(0)
const viewMode = ref('original')
const showTextTools = ref(false)
const fontSize = ref(16)
const lineHeight = ref('1.6')
const highlightMode = ref(false)
const showSearchModal = ref(false)
const showAddIssueModal = ref(false)

// Search
const searchQuery = ref('')
const searchOptions = ref({
  caseSensitive: false,
  wholeWord: false,
  regex: false
})
const searchResults = ref([])

// Comments
const newComment = ref('')
const commentType = ref('general')

// New Issue
const newIssue = ref({
  title: '',
  description: '',
  type: 'content',
  severity: 'medium',
  line: null
})

// Sample data
const currentNovel = ref({
  id: 1,
  title: 'Tôi Là Đại Thần Tài',
  author: 'Nguyễn Văn A',
  genre: 'Tiên hiệp',
  status: 'pending_review'
})

const currentChapter = ref({
  id: 1,
  number: 1,
  title: 'Khởi đầu của một hành trình',
  wordCount: 2450,
  submittedAt: '2 giờ trước',
  status: 'in_review',
  issues: 3
})

const chapters = ref([
  { id: 1, title: 'Khởi đầu của một hành trình', wordCount: 2450, submittedAt: '2 giờ trước', status: 'in_review', issues: 3 },
  { id: 2, title: 'Cuộc gặp gỡ định mệnh', wordCount: 2180, submittedAt: '1 ngày trước', status: 'pending', issues: 0 },
  { id: 3, title: 'Sức mạnh thức tỉnh', wordCount: 2890, submittedAt: '2 ngày trước', status: 'pending', issues: 1 },
  { id: 4, title: 'Thử thách đầu tiên', wordCount: 3120, submittedAt: '3 ngày trước', status: 'approved', issues: 0 },
  { id: 5, title: 'Bí mật được tiết lộ', wordCount: 2750, submittedAt: '4 ngày trước', status: 'rejected', issues: 5 },
  { id: 6, title: 'Khởi đầu của một hành trình', wordCount: 2450, submittedAt: '2 giờ trước', status: 'in_review', issues: 3 },
  { id: 7, title: 'Cuộc gặp gỡ định mệnh', wordCount: 2180, submittedAt: '1 ngày trước', status: 'pending', issues: 0 },
  { id: 8, title: 'Sức mạnh thức tỉnh', wordCount: 2890, submittedAt: '2 ngày trước', status: 'pending', issues: 1 },
  { id: 9, title: 'Thử thách đầu tiên', wordCount: 3120, submittedAt: '3 ngày trước', status: 'approved', issues: 0 },
  { id: 10, title: 'Bí mật được tiết lộ', wordCount: 2750, submittedAt: '4 ngày trước', status: 'rejected', issues: 5 }
])

const contentParagraphs = ref([
  {
    id: 1,
    segments: [
      { text: 'Giây phút Lê Mạn mở mắt ra, nhìn thấy ánh sáng mặt trời xuyên qua mái nhà tranh trên đầu, hơn nữa đây căn bản không phải là thân thể của mình, nàng có thể khẳng định mình đã ', hasIssue: false },
      { text: 'xuyên không', hasIssue: true, issueType: 'terminology', severity: 'low' },
      { text: ' rồi, dù sao thì giây trước đó ngồi trên máy bay sang Paris, xảy ra tai nạn máy bay rơi hy hữu.', hasIssue: false }
    ],
    comments: [
      {
        id: 1,
        reviewer: { name: 'Nguyễn Kiểm Duyệt', avatar: 'https://ollama.com/public/ollama.png?height=32&width=32' },
        content: 'Thuật ngữ "xuyên không" cần được giải thích rõ hơn cho độc giả mới.',
        createdAt: '10 phút trước'
      }
    ]
  },
  {
    id: 2,
    segments: [
      { text: 'Chống lại những cơn đau đầu choáng váng, Lê Mạn từ trên giường ngồi dậy, bên dưới phát ra tiếng sột soạt sột soạt, cúi đầu nhìn xuống, là rơm rạ trải dưới tấm ga giường cũ nát phát ra âm thanh.', hasIssue: false }
    ],
    comments: []
  },
  {
    id: 3,
    segments: [
      { text: 'Giây phút Lê Mạn mở mắt ra, nhìn thấy ánh sáng mặt trời xuyên qua mái nhà tranh trên đầu, hơn nữa đây căn bản không phải là thân thể của mình, nàng có thể khẳng định mình đã ', hasIssue: false },
      { text: 'xuyên không', hasIssue: true, issueType: 'terminology', severity: 'low' },
      { text: ' rồi, dù sao thì giây trước đó ngồi trên máy bay sang Paris, xảy ra tai nạn máy bay rơi hy hữu.', hasIssue: false }
    ],
    comments: [
      {
        id: 1,
        reviewer: { name: 'Nguyễn Kiểm Duyệt', avatar: 'https://ollama.com/public/ollama.png?height=32&width=32' },
        content: 'Thuật ngữ "xuyên không" cần được giải thích rõ hơn cho độc giả mới.',
        createdAt: '10 phút trước'
      }
    ]
  },
  {
    id: 4,
    segments: [
      { text: 'Giây phút Lê Mạn mở mắt ra, nhìn thấy ánh sáng mặt trời xuyên qua mái nhà tranh trên đầu, hơn nữa đây căn bản không phải là thân thể của mình, nàng có thể khẳng định mình đã ', hasIssue: false },
      { text: 'xuyên không', hasIssue: true, issueType: 'terminology', severity: 'low' },
      { text: ' rồi, dù sao thì giây trước đó ngồi trên máy bay sang Paris, xảy ra tai nạn máy bay rơi hy hữu.', hasIssue: false }
    ],
    comments: [
      {
        id: 1,
        reviewer: { name: 'Nguyễn Kiểm Duyệt', avatar: 'https://ollama.com/public/ollama.png?height=32&width=32' },
        content: 'Thuật ngữ "xuyên không" cần được giải thích rõ hơn cho độc giả mới.',
        createdAt: '10 phút trước'
      }
    ]
  },
  {
    id: 5,
    segments: [
      { text: 'Giây phút Lê Mạn mở mắt ra, nhìn thấy ánh sáng mặt trời xuyên qua mái nhà tranh trên đầu, hơn nữa đây căn bản không phải là thân thể của mình, nàng có thể khẳng định mình đã ', hasIssue: false },
      { text: 'thân thể', hasIssue: true, issueType: 'terminology', severity: 'low' },
      { text: ' rồi, dù sao thì giây trước đó ngồi trên máy bay sang Paris, xảy ra tai nạn máy bay rơi hy hữu.', hasIssue: false }
    ],
    comments: [
      {
        id: 1,
        reviewer: { name: 'Nguyễn Kiểm Duyệt', avatar: 'https://ollama.com/public/ollama.png?height=32&width=32' },
        content: 'Thuật ngữ "xuyên không" cần được giải thích rõ hơn cho độc giả mới.',
        createdAt: '10 phút trước'
      }
    ]
  },
  {
    id: 6,
    segments: [
      { text: 'Giây phút Lê Mạn mở mắt ra, nhìn thấy ánh sáng mặt trời xuyên qua mái nhà tranh trên đầu, hơn nữa đây căn bản không phải là thân thể của mình, nàng có thể khẳng định mình đã ', hasIssue: false },
      { text: 'xuyên qua', hasIssue: true, issueType: 'terminology', severity: 'low' },
      { text: ' rồi, dù sao thì giây trước đó ngồi trên máy bay sang Paris, xảy ra tai nạn máy bay rơi hy hữu.', hasIssue: false }
    ],
    comments: [
      {
        id: 1,
        reviewer: { name: 'Nguyễn Kiểm Duyệt', avatar: 'https://ollama.com/public/ollama.png?height=32&width=32' },
        content: 'Thuật ngữ "xuyên không" cần được giải thích rõ hơn cho độc giả mới.',
        createdAt: '10 phút trước'
      }
    ]
  }
])

const detectedIssues = ref([
  {
    id: 1,
    type: 'terminology',
    severity: 'low',
    title: 'Thuật ngữ chưa rõ',
    description: 'Từ "xuyên không" cần giải thích cho độc giả mới',
    line: 1,
    position: 'Đoạn 1, câu 1'
  },
  {
    id: 2,
    type: 'grammar',
    severity: 'medium',
    title: 'Lỗi ngữ pháp',
    description: 'Câu quá dài, nên chia thành nhiều câu ngắn hơn',
    line: 1,
    position: 'Đoạn 1, câu 1'
  },
  {
    id: 3,
    type: 'content',
    severity: 'high',
    title: 'Nội dung nhạy cảm',
    description: 'Mô tả tai nạn máy bay có thể gây khó chịu',
    line: 1,
    position: 'Đoạn 1, câu 1'
  }
])

const manualIssues = ref([
  {
    id: 4,
    title: 'Thiếu mô tả cảm xúc',
    description: 'Nhân vật cần thể hiện cảm xúc rõ ràng hơn khi phát hiện xuyên không',
    type: 'content',
    severity: 'medium'
  }
])

const guidelines = ref([
  { id: 1, title: 'Không có nội dung bạo lực quá mức', description: 'Kiểm tra các cảnh chiến đấu, giết chóc', checked: true },
  { id: 2, title: 'Không có nội dung tình dục phản cảm', description: 'Kiểm tra các cảnh tình cảm, thân mật', checked: true },
  { id: 3, title: 'Không có ngôn từ thù địch', description: 'Kiểm tra từ ngữ phân biệt chủng tộc, tôn giáo', checked: true },
  { id: 4, title: 'Phù hợp với độ tuổi mục tiêu', description: 'Nội dung phù hợp với nhóm độc giả 16+', checked: false },
  { id: 5, title: 'Chất lượng văn phong tốt', description: 'Ngữ pháp, chính tả, cấu trúc câu', checked: false }
])

const allComments = ref([
  {
    id: 1,
    reviewer: { name: 'Nguyễn Kiểm Duyệt', avatar: '/placeholder.svg?height=32&width=32' },
    content: 'Chương này có tiềm năng tốt nhưng cần chỉnh sửa một số chi tiết.',
    type: 'general',
    createdAt: '15 phút trước'
  },
  {
    id: 2,
    reviewer: { name: 'Trần Biên Tập', avatar: '/placeholder.svg?height=32&width=32' },
    content: 'Cần giải thích rõ hơn về bối cảnh xuyên không.',
    type: 'suggestion',
    createdAt: '10 phút trước'
  }
])

const analytics = ref({
  avgSentenceLength: 18,
  readabilityScore: 75,
  readabilityLevel: 'Trung bình',
  repetitiveWords: 12,
  topKeywords: [
    { word: 'Lê Mạn', count: 8 },
    { word: 'xuyên không', count: 5 },
    { word: 'máy bay', count: 3 },
    { word: 'đau đầu', count: 2 }
  ],
  maxKeywordCount: 8
})

const contentFlags = ref([
  { type: 'violence', label: 'Bạo lực', detected: false, count: 0 },
  { type: 'adult', label: 'Nội dung người lớn', detected: true, count: 2 },
  { type: 'hate_speech', label: 'Ngôn từ thù địch', detected: false, count: 0 },
  { type: 'spam', label: 'Spam/Quảng cáo', detected: true, count: 2 },
  { type: 'plagiarism', label: 'Đạo văn', detected: false, count: 0 }
])

// Options
const toolTabs = ref([
  { slot: 'issues', label: 'Vấn đề', icon: 'i-lucide-alert-triangle' },
  { slot: 'guidelines', label: 'Hướng dẫn', icon: 'i-lucide-check-square' },
  { slot: 'comments', label: 'Nhận xét', icon: 'i-lucide-message-square' },
  { slot: 'analytics', label: 'Phân tích', icon: 'i-lucide-bar-chart' }
])

const commentTypes = [
  { label: 'Chung', value: 'general' },
  { label: 'Đề xuất', value: 'suggestion' },
  { label: 'Lỗi', value: 'error' },
  { label: 'Khen ngợi', value: 'praise' }
]

const issueTypes = [
  { label: 'Nội dung', value: 'content' },
  { label: 'Ngữ pháp', value: 'grammar' },
  { label: 'Thuật ngữ', value: 'terminology' },
  { label: 'Cấu trúc', value: 'structure' },
  { label: 'Khác', value: 'other' }
]

const severityLevels = [
  { label: 'Thấp', value: 'low' },
  { label: 'Trung bình', value: 'medium' },
  { label: 'Cao', value: 'high' },
  { label: 'Nghiêm trọng', value: 'critical' }
]

const headerActions = [
  [
    { label: 'Xuất báo cáo', icon: 'i-lucide-download', click: () => exportReport() },
    { label: 'In trang', icon: 'i-lucide-printer', click: () => printPage() }
  ],
  [
    { label: 'Chuyển cho reviewer khác', icon: 'i-lucide-user-plus', click: () => reassignReview() },
    { label: 'Đánh dấu ưu tiên', icon: 'i-lucide-flag', click: () => markPriority() }
  ],
  [
    { label: 'Cài đặt', icon: 'i-lucide-cog', click: () => {} }
  ]
]

const issueActions = [
  [
    { label: 'Chỉnh sửa', icon: 'i-lucide-edit', click: () => {} },
    { label: 'Xóa', icon: 'i-lucide-trash', click: () => {} }
  ]
]

// Computed
const pendingChapters = computed(() => {
  return chapters.value.filter(ch => ch.status === 'pending' || ch.status === 'in_review')
})

const reviewProgress = computed(() => {
  const currentIndex = chapters.value.findIndex(ch => ch.id === currentChapter.value.id)
  return ((currentIndex + 1) / chapters.value.length) * 100
})

const complianceScore = computed(() => {
  const checkedCount = guidelines.value.filter(g => g.checked).length
  return Math.round((checkedCount / guidelines.value.length) * 100)
})

const hasBlockingIssues = computed(() => {
  return detectedIssues.value.some(issue => issue.severity === 'critical' || issue.severity === 'high')
})

const annotatedContent = computed(() => {
  return '<p>Annotated content with highlights...</p>'
})

const diffContent = computed(() => {
  return '<p>Diff view showing changes...</p>'
})

// Methods
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'yellow',
    in_review: 'blue',
    approved: 'green',
    rejected: 'red',
    in_progress: 'blue'
  }
  return colors[status] || 'gray'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Chờ duyệt',
    in_review: 'Đang duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    in_progress: 'Đang xử lý'
  }
  return labels[status] || status
}

const getIssueColor = (severity) => {
  const colors = {
    low: 'border-yellow-200 dark:border-yellow-800',
    medium: 'border-orange-200 dark:border-orange-800',
    high: 'border-red-200 dark:border-red-800',
    critical: 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
  }
  return colors[severity] || 'border-gray-200 dark:border-gray-700'
}

const getIssueIcon = (type) => {
  const icons = {
    content: 'i-lucide-file-text',
    grammar: 'i-lucide-spell-check',
    terminology: 'i-lucide-book',
    structure: 'i-lucide-layout',
    other: 'i-lucide-help-circle'
  }
  return icons[type] || 'i-lucide-alert-circle'
}

const getIssueIconColor = (severity) => {
  const colors = {
    low: 'text-yellow-500',
    medium: 'text-orange-500',
    high: 'text-red-500',
    critical: 'text-red-600'
  }
  return colors[severity] || 'text-gray-500'
}

const getSeverityColor = (severity) => {
  const colors = {
    low: 'yellow',
    medium: 'orange',
    high: 'red',
    critical: 'red'
  }
  return colors[severity] || 'gray'
}

const getCommentTypeColor = (type) => {
  const colors = {
    general: 'blue',
    suggestion: 'green',
    error: 'red',
    praise: 'purple'
  }
  return colors[type] || 'gray'
}

const getReadabilityColor = (score) => {
  if (score >= 80) return 'green'
  if (score >= 60) return 'yellow'
  return 'red'
}

const getSegmentClass = (segment) => {
  if (!segment.hasIssue) return ''
  const severityClasses = {
    low: 'bg-yellow-100 dark:bg-yellow-900/30 border-b-2 border-yellow-400 cursor-pointer',
    medium: 'bg-orange-100 dark:bg-orange-900/30 border-b-2 border-orange-400 cursor-pointer',
    high: 'bg-red-100 dark:bg-red-900/30 border-b-2 border-red-400 cursor-pointer',
    critical: 'bg-red-200 dark:bg-red-900/50 border-b-2 border-red-500 cursor-pointer'
  }
  return severityClasses[segment.severity] || ''
}

const selectChapter = (chapter) => {
  currentChapter.value = chapter
  sidebarOpen.value = false // Close sidebar on mobile after selection
  toolsOpen.value = false // Close tools on mobile
}

const handleTextSelection = () => {
  if (!highlightMode.value) return
  const selection = window.getSelection()
  if (selection.toString().trim()) {
    console.log('Selected text:', selection.toString())
  }
}

const highlightIssue = (issue) => {
  console.log('Highlighting issue:', issue)
}

const showIssueDetails = (segment) => {
  console.log('Issue details:', segment)
}

const addComment = () => {
  if (!newComment.value.trim()) return
  const comment = {
    id: Date.now(),
    reviewer: { name: 'Current User', avatar: '/placeholder.svg?height=32&width=32' },
    content: newComment.value,
    type: commentType.value,
    createdAt: 'Vừa xong'
  }
  allComments.value.unshift(comment)
  newComment.value = ''
}

const addManualIssue = () => {
  if (!newIssue.value.title.trim()) return
  const issue = {
    id: Date.now(),
    ...newIssue.value
  }
  manualIssues.value.push(issue)
  newIssue.value = {
    title: '',
    description: '',
    type: 'content',
    severity: 'medium',
    line: null
  }
  showAddIssueModal.value = false
}

const performSearch = () => {
  console.log('Searching for:', searchQuery.value)
}

const jumpToResult = (result) => {
  console.log('Jumping to:', result)
}

const saveDraft = () => {
  console.log('Saving draft...')
}

const approveChapter = () => {
  console.log('Approving chapter...')
}

const rejectChapter = () => {
  console.log('Rejecting chapter...')
}

const requestChanges = () => {
  console.log('Requesting changes...')
}

const escalateReview = () => {
  console.log('Escalating review...')
}

const exportReport = () => {
  console.log('Exporting report...')
}

const printPage = () => {
  window.print()
}

const reassignReview = () => {
  console.log('Reassigning review...')
}

const markPriority = () => {
  console.log('Marking as priority...')
}

const replyToComment = (comment) => {
  console.log('Replying to comment:', comment)
}

const editComment = (comment) => {
  console.log('Editing comment:', comment)
}

// Lifecycle
onMounted(() => {
  const timer = setInterval(() => {
    reviewTime.value++
  }, 1000)
  onUnmounted(() => {
    clearInterval(timer)
  })
})

useHead({
  title: `Kiểm duyệt: ${currentChapter.value.title} - ${currentNovel.value.title}`,
  meta: [
    { name: 'description', content: 'Giao diện kiểm duyệt nội dung truyện tiểu thuyết' }
  ]
})
</script>

<style scoped>
.paragraph-container {
  margin-bottom: 1.5rem;
}

.paragraph {
  text-align: justify;
  line-height: 1.8;
  margin-bottom: 0.5rem;
}

.highlight-enabled {
  user-select: text;
}

.prose {
  color: inherit;
}

.prose p {
  margin-bottom: 1.5em;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: primary;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

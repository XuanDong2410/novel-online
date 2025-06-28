<template>
  <div v-if="pending" class="min-h-screen flex items-center justify-center">
    <USkeleton class="h-8 w-32" />
  </div>

  <div v-else-if="error" class="min-h-screen flex flex-col items-center justify-center gap-4">
    <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-red-500" />
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
      Đã xảy ra lỗi
    </h2>
    <p class="text-gray-600 dark:text-gray-400">
      {{ error }}
    </p>
    <UButton icon="i-lucide-refresh-cw" @click="refresh">
      Thử lại
    </UButton>
  </div>
  <div v-else-if="novelData" class="bg-gray-50 dark:bg-gray-900">
    <header class="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center justify-between px-4 py-4 sm:px-6">
        <div class="flex items-center gap-4">
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            size="sm"
            @click="onClose()"
          />
          <div class="min-w-0 flex-1">
            <h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
              {{ novelData.title }}
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
              <span>Người đăng: {{ createdBy.username }} • Chương số: {{ currentChapter?.chapterNumber }}
                - {{ currentChapter?.title }} </span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          <UButton
            v-if="confirmReviewEnabled"
            icon="i-lucide-check"
            color="success"
            variant="solid"
            size="sm"
            @click="openReviewConfirmationModal"
          >
            Duyệt bản
          </UButton>
          <UBadge
            :color="getStatusColor(reviewStatus)"
            :icon="getStatusIcon(reviewStatus)"
            variant="subtle"
            size="sm"
            class="hidden sm:inline-flex"
          >
            {{ getStatusLabel(reviewStatus) }}
          </UBadge>
          <div class="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <UIcon name="i-lucide-clock" class="w-4 h-4" />
            <span class="text-xs sm:text-sm font-mono">{{ formatTime(reviewTime) }}</span>
          </div>
          <UButton
            icon="i-lucide-save"
            variant="outline"
            size="xs"
            class="hidden sm:inline-flex"
            @click="saveDraft"
          >
            Lưu nháp
          </UButton>
        </div>
      </div>
      <div class="h-1 bg-gray-200 dark:bg-gray-800">
        <div class="h-full bg-primary-500 transition-all duration-300" :style="{ width: `${reviewProgress}%` }" />
      </div>
    </header>
    <div class="flex flex-col lg:flex-row max-h-[calc(100vh-105px)]">
      <div class="flex-1 flex flex-col lg:flex-row max-w-full overflow-y-auto mx-auto">
        <ModeratorNovelChapterList
          :chapters="chapters"
          :current-chapter="currentChapter"
          :open-sidebar="sidebarOpen"
          @update:selected-chapter="selectChapter"
          @update:open-sidebar="(value) => sidebarOpen = value"
        />
        <div class="flex-[4] flex flex-col max-w-[100%] overflow-y-auto">
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div class="flex items-center gap-2 sm:gap-4">
              <UButton
                icon="i-lucide-menu"
                variant="ghost"
                size="sm"
                @click="sidebarOpen = true"
              />
            </div>
            <div class="flex items-center gap-2">
              <UButtonGroup size="xs" class="hidden sm:flex">
                <UButton :variant="viewMode === 'original' ? 'solid' : 'outline'" @click="viewMode = 'original'">
                  Gốc
                </UButton>
                <UButton :variant="viewMode === 'annotated' ? 'solid' : 'outline'" @click="viewMode = 'annotated'">
                  Có chú thích
                </UButton>
              </UButtonGroup>
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
                  :items="[{ label: '1.4', value: '1.4' }, { label: '1.6', value: '1.6' }, { label: '1.8', value: '1.8' }, { label: '2.0', value: '2.0' }]"
                  size="sm"
                />
              </div>
              <UButton
                variant="ghost"
                size="sm"
                :class="highlightMode ? 'text-yellow-600' : ''"
                @click="highlightMode = !highlightMode"
              >
                Highlight
              </UButton>
            </div>
          </div>

          <div class="overflow-y-scroll flex-1 p-4 sm:p-6 bg-white dark:bg-gray-900">
            <article class="prose prose-sm sm:prose-lg dark:prose-invert max-w-none" :style="{ fontSize: `${fontSize}px`, lineHeight: lineHeight.value }">
              <div v-if="viewMode === 'original'" class="content-original">
                <div class="prose dark:prose-invert max-w-none">
                  <p
                    v-for="(paragraph, index) in contentParagraphs"
                    :key="index"
                    :class="{ 'bg-yellow-100 dark:bg-yellow-900': isHighlighted(index, paragraph) }"
                    v-html="annotateParagraphWithSearchHighlights(paragraph, index)"
                  />
                </div>
              </div>
              <div v-else-if="viewMode === 'annotated'" class="content-annotated">
                <div class="prose dark:prose-invert max-w-none text-justify">
                  <div v-for="(line, index) in annotatedContent" :key="index">
                    <p
                      :class="{
                        'highlight-low': line.type === 'issue' && line.issue?.severity === 'low',
                        'highlight-medium': line.type === 'issue' && line.issue?.severity === 'medium',
                        'highlight-high': line.type === 'issue' && line.issue?.severity === 'high',
                        'highlight-critical': line.type === 'issue' && line.issue?.severity === 'critical'
                      }"
                      @click="handleLineClick(index, line.text)"
                      v-html="line.processedTextHtml"
                    />
                    <div v-if="line.type === 'issue' && line.issue" class="issue-note p-2 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 text-xs text-gray-600 dark:text-gray-400 mt-1 mb-3">
                      <strong>{{ line.issue.title }}</strong> (Mức độ: {{ getSeverityLabel(line.issue.severity) }})
                      <p>{{ line.issue.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div class="flex-[3] flex flex-col max-w-[100%] overflow-y-auto">
          <UCard variant="subtle" class="m-2 bg-transparent border-transparent">
            <template #header>
              <h2 class="text-lg font-semibold">
                {{ currentChapter?.title || 'Chưa chọn chương' }}
              </h2>
            </template>
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium">Trạng thái:</span>
                  <UBadge
                    :color="getStatusColor(currentChapter?.status as statusPublish)"
                    :icon="getStatusIcon(currentChapter?.status as statusPublish)"
                    variant="subtle"
                    class="ml-2"
                  >
                    {{ getStatusLabel(currentChapter?.status as statusPublish) }}
                  </UBadge>
                </div>
                <div>
                  <span class="font-medium">Số từ:</span>
                  {{ currentChapter?.wordCount || 0 }}
                </div>
                <div>
                  <span class="font-medium">Ngày tạo:</span>
                  {{ formatDate(currentChapter?.createdAt) }}
                </div>
                <div v-if="currentChapter?.violation?.count?.total">
                  <span class="font-medium">Vi phạm:</span>
                  <UBadge color="error" variant="subtle" class="ml-2">
                    {{ currentChapter.violation.count.total }} vấn đề
                  </UBadge>
                </div>
              </div>
            </div>
          </UCard>
          <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Công cụ kiểm duyệt
            </h3>
          </div>
          <UTabs :items="toolTabs" variant="link" class="w-full">
            <!-- <template #issues>
              <div class="p-4 space-y-4">
                <div class="flex items-center justify-between mb-3">
                  <h3>Vi phạm do AI phát hiện</h3>
                  <UButton
                    icon="i-lucide-bot"
                    :loading="autoModerationLoading"
                    color="primary"
                    size="sm"
                    variant="outline"
                    class="mb-2"
                    @click="handleAutoModeration"
                  >
                    Chạy kiểm duyệt tự động
                  </UButton>
                </div>
                <div v-if="aiIssues.length">
                  <div
                    v-for="issue in aiIssues"
                    :key="issue._id"
                    class="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    :class="getIssueColor(issue.severity)"
                    @click="highlightIssue(issue)"
                  >
                    <div class="flex items-start gap-3">
                      <UIcon :name="getIssueIcon(issue.category)" :class="getIssueIconColor(issue.severity)" class="w-4 h-4 mt-0.5" />
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-sm font-medium">{{ issue.title }}</span>
                          <UBadge :color="getSeverityColor(issue.severity)" variant="subtle" size="xs">
                            {{ getSeverityLabel(issue.severity) }}
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
                <p v-else class="w-full italic text-center">
                  Không có vi phạm do AI.
                </p>
                <div class="flex items-center justify-between mb-3">
                  <h3>Vi phạm do kiểm duyệt viên</h3>
                  <UButton
                    icon="i-lucide-plus"
                    size="sm"
                    variant="outline"
                    @click="showAddIssueModal = true"
                  >
                    Thêm vấn đề
                  </UButton>
                </div>
                <div v-if="manualIssues.length">
                  <div
                    v-for="issue in manualIssues"
                    :key="issue._id"
                    class="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    :class="getIssueColor(issue.severity)"
                    @click="highlightIssue(issue)"
                  >
                    <div class="flex items-start gap-3">
                      <UIcon :name="getIssueIcon(issue.category)" :class="getIssueIconColor(issue.severity)" class="w-4 h-4 mt-0.5" />
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-sm font-medium">{{ issue.title }}</span>
                          <UBadge :color="getSeverityColor(issue.severity)" variant="subtle" size="xs">
                            {{ getSeverityLabel(issue.severity) }}
                          </UBadge>
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {{ issue.description }}
                        </p>

                        <div class="text-xs text-gray-500">
                          Dòng {{ issue.line }} • {{ issue.position }}
                        </div>
                      </div>
                      <UButton
                        icon="i-lucide-trash"
                        size="xs"
                        color="error"
                        variant="ghost"
                        class="ml-2"
                        @click.stop="removeIssue(issue._id)"
                      />
                    </div>
                  </div>
                </div>
                <p v-else class="w-full italic text-center">
                  Không có vi phạm thủ công.
                </p>
              </div>
            </template> -->
            <!-- <template #issues>
              <div class="p-4 space-y-4">
                <div>
                  <h3>Vi phạm do AI phát hiện</h3>
                  <div v-if="aiIssues.length">
                    <div
                      v-for="issue in aiIssues"
                      :key="issue._id"
                      class="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      :class="getIssueColor(issue.severity)"
                      @click="highlightIssue(issue)"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <UIcon :name="getIssueIcon(issue.category)" :class="getIssueIconColor(issue.severity)" class="w-4 h-4" />
                          <span>{{ issue.title || issue.description }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span>{{ issue.severity }}</span>
                          <UButton
                            icon="i-lucide-trash"
                            size="xs"
                            color="error"
                            variant="ghost"
                            @click.stop="removeIssue(issue._id)"
                          />
                        </div>
                      </div>
                      <p class="text-sm text-gray-500">
                        Dòng: {{ issue.line }}
                      </p>
                    </div>
                  </div>
                  <p v-else class="w-full italic text-center">
                    Không có vi phạm AI.
                  </p>
                </div>
                <div>
                  <h3>Vi phạm thủ công</h3>
                  <div v-if="manualIssues.length">
                    <div
                      v-for="issue in manualIssues"
                      :key="issue._id"
                      class="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      :class="getIssueColor(issue.severity)"
                      @click="highlightIssue(issue)"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <UIcon :name="getIssueIcon(issue.category)" :class="getIssueIconColor(issue.severity)" class="w-4 h-4" />
                          <span>{{ issue.title || issue.description }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span>{{ issue.severity }}</span>
                          <UButton
                            icon="i-lucide-trash"
                            size="xs"
                            color="error"
                            variant="ghost"
                            @click.stop="removeIssue(issue._id)"
                          />
                        </div>
                      </div>
                      <p class="text-sm text-gray-500">
                        Dòng: {{ issue.line }}
                      </p>
                    </div>
                  </div>
                  <p v-else class="w-full italic text-center">
                    Không có vi phạm thủ công.
                  </p>
                </div>
                <div>
                  <h3>Vi phạm từ hướng dẫn</h3>
                  <div v-if="guidelineIssues.length">
                    <div
                      v-for="issue in guidelineIssues"
                      :key="issue._id"
                      class="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      :class="getIssueColor(issue.severity)"
                      @click="highlightIssue(issue)"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <UIcon :name="getIssueIcon(issue.category)" :class="getIssueIconColor(issue.severity)" class="w-4 h-4" />
                          <span>{{ issue.title || issue.description }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span>{{ issue.severity }}</span>
                          <UButton
                            icon="i-lucide-trash"
                            size="xs"
                            color="error"
                            variant="ghost"
                            @click.stop="removeIssue(issue._id)"
                          />
                        </div>
                      </div>
                      <p class="text-sm text-gray-500">
                        Dòng: {{ issue.line }}
                      </p>
                    </div>
                  </div>
                  <p v-else class="w-full italic text-center">
                    Không có vi phạm từ hướng dẫn.
                  </p>
                </div>
              </div>
            </template> -->
            <template #issues>
              <div class="p-4 space-y-4">
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <h3>Vi phạm do AI phát hiện</h3>
                    <UButton
                      icon="i-lucide-bot"
                      :loading="autoModerationLoading"
                      color="primary"
                      size="sm"
                      variant="outline"
                      class="mb-2"
                      @click="handleAutoModeration"
                    >
                      Chạy kiểm duyệt tự động
                    </UButton>
                  </div>
                  <div v-if="aiIssues.length">
                    <div
                      v-for="issue in aiIssues"
                      :key="issue._id"
                      class="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      :class="getIssueColor(issue.severity)"
                      @click="highlightIssue(issue)"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <UIcon :name="getIssueIcon(issue.category)" :class="getIssueIconColor(issue.severity)" class="w-4 h-4" />
                          <span>{{ issue.title || issue.description }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span>{{ getSeverityLabel(issue.severity) }}</span>
                          <UButton
                            v-if="issue._id"
                            icon="i-lucide-trash"
                            size="xs"
                            color="error"
                            variant="ghost"
                            @click.stop="removeIssue(issue._id)"
                          />
                          <span v-else class="text-xs text-red-500">ID không hợp lệ</span>
                        </div>
                      </div>
                      <p class="text-sm text-gray-500">
                        Dòng: {{ issue.line }}
                      </p>
                    </div>
                  </div>
                  <p v-else class="w-full italic text-center">
                    Không có vi phạm AI.
                  </p>
                </div>
                <div>
                  <h3>Vi phạm thủ công</h3>
                  <div v-if="manualIssues.length">
                    <div
                      v-for="issue in manualIssues"
                      :key="issue._id"
                      class="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      :class="getIssueColor(issue.severity)"
                      @click="highlightIssue(issue)"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <UIcon :name="getIssueIcon(issue.category)" :class="getIssueIconColor(issue.severity)" class="w-4 h-4" />
                          <span>{{ issue.title || issue.description }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span>{{ getSeverityLabel(issue.severity) }}</span>
                          <UButton
                            v-if="issue._id"
                            icon="i-lucide-trash"
                            size="xs"
                            color="error"
                            variant="ghost"
                            @click.stop="removeIssue(issue._id)"
                          />
                          <span v-else class="text-xs text-red-500">ID không hợp lệ</span>
                        </div>
                      </div>
                      <p class="text-sm text-gray-500">
                        Dòng: {{ issue.line }}
                      </p>
                    </div>
                  </div>
                  <p v-else class="w-full italic text-center">
                    Không có vi phạm thủ công.
                  </p>
                </div>
              </div>
            </template>
            <template #guidelines>
              <div
                v-for="guideline in guidelines"
                :key="guideline.id"
                class="rounded-lg border p-3"
                :class="guideline.hasIssues ? 'border-red-300 dark:border-red-700' : 'border-green-300 dark:border-green-700'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <UCheckbox
                      v-model="guideline.checked"
                      :aria-label="`Kiểm tra hướng dẫn: ${guideline.title}`"
                      @change="toggleGuideline(guideline)"
                    />
                    <span class="font-medium">{{ guideline.title }}</span>
                  </div>
                  <UBadge v-if="guideline.issues.length" color="error" variant="subtle">
                    {{ guideline.issues.length }} vấn đề
                  </UBadge>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ guideline.description }}
                </p>
                <div v-if="guideline.checked === false" class="mt-3 space-y-2">
                  <div v-for="(issueOption, issueIndex) in guideline.issueOptions" :key="issueIndex" class="flex items-start gap-2">
                    <UCheckbox
                      v-model="issueOption.selected"
                      @change="handleGuidelineIssueSelection(guideline, issueOption)"
                    />
                    <div class="flex-1">
                      <span class="text-sm font-medium">{{ issueOption.description }}</span>
                      <UBadge :color="getSeverityColor(issueOption.severity)" size="xs" class="ml-2">
                        {{ getSeverityLabel(issueOption.severity) }}
                      </UBadge>
                      <div v-if="issueOption.selected" class="mt-2 p-3 border rounded-md border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <UFormField label="Dòng vi phạm (tùy chọn)" class="mb-2">
                          <UInput v-model="issueOption.line" type="number" placeholder="Nhập số dòng" />
                        </UFormField>
                        <UFormField label="Mô tả chi tiết (tùy chọn)" class="mb-2">
                          <UTextarea v-model="issueOption.note" :rows="2" placeholder="Ghi chú thêm về vi phạm" />
                        </UFormField>
                        <UButton size="sm" color="primary" @click="addGuidelineIssue(guideline, issueOption)">
                          Thêm vấn đề
                        </UButton>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- <div v-if="guideline.issues.length" class="mt-3 space-y-1">
                  <div
                    v-for="issue in guideline.issues"
                    :key="issue._id"
                    class="flex items-center justify-between p-2 rounded-md bg-red-50 dark:bg-red-900/20"
                  >
                    <span class="text-xs text-gray-700 dark:text-gray-300">
                      Dòng {{ issue.line }}: {{ issue.description }}
                    </span>
                    <UButton
                      icon="i-lucide-trash"
                      size="xs"
                      color="error"
                      variant="ghost"
                      @click.stop="removeIssue(issue._id)"
                    />
                  </div>
                </div> -->
              </div>
              <div class="mt-6 p-4 dark:bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium">Điểm tuân thủ</span>
                  <span class="text-lg font-bold text-green-600">{{ complianceScore }}%</span>
                </div>
                <UProgress v-model="complianceScore" color="primary" />
              </div>
            </template>
            <!-- <template #guidelines>
              <div>
  <h3>Vi phạm từ hướng dẫn</h3>
  <div v-if="guidelineIssues.length">
    <div
      v-for="issue in guidelineIssues"
      :key="issue._id"
      class="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
      :class="getIssueColor(issue.severity)"
      @click="highlightIssue(issue)"
    >
      <div class="flex items-center justify-between">
        <span>{{ issue.title || issue.description }}</span>
        <div class="flex items-center gap-2">
          <span>{{ issue.severity }}</span>
          <UButton
            icon="i-lucide-trash"
            size="xs"
            color="error"
            variant="ghost"
            @click.stop="removeIssue(issue._id)"
          />
        </div>
      </div>
      <p class="text-sm text-gray-500">
        Dòng: {{ issue.line }}
      </p>
    </div>
  </div>
  <p v-else class="w-full italic text-center">
    Không có vi phạm từ hướng dẫn.
  </p>
</div>
              <div
                v-for="guideline in guidelines"
                :key="guideline.id"
                class="rounded-lg border p-3"
                :class="guideline.hasIssues ? 'border-red-300 dark:border-red-700' : 'border-green-300 dark:border-green-700'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <UCheckbox
                      v-model="guideline.checked"
                      :aria-label="`Kiểm tra hướng dẫn: ${guideline.title}`"
                      @change="toggleGuideline(guideline)"
                    />
                    <span class="font-medium">{{ guideline.title }}</span>
                  </div>
                  <UBadge v-if="guideline.issues.length" color="error" variant="subtle">
                    {{ guideline.issues.length }} vấn đề
                  </UBadge>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ guideline.description }}
                </p>
                <div v-if="guideline.checked === false" class="mt-3 space-y-2">
                  <div v-for="(issueOption, issueIndex) in guideline.issueOptions" :key="issueIndex" class="flex items-start gap-2">
                    <UCheckbox
                      v-model="issueOption.selected"
                      @change="handleGuidelineIssueSelection(guideline, issueOption)"
                    />
                    <div class="flex-1">
                      <span class="text-sm font-medium">{{ issueOption.description }}</span>
                      <UBadge :color="getSeverityColor(issueOption.severity)" size="xs" class="ml-2">
                        {{ getSeverityLabel(issueOption.severity) }}
                      </UBadge>
                      <div v-if="issueOption.selected" class="mt-2 p-3 border rounded-md border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <UFormField label="Dòng vi phạm (tùy chọn)" class="mb-2">
                          <UInput v-model="issueOption.line" type="number" placeholder="Nhập số dòng" />
                        </UFormField>
                        <UFormField label="Mô tả chi tiết (tùy chọn)" class="mb-2">
                          <UTextarea v-model="issueOption.note" :rows="2" placeholder="Ghi chú thêm về vi phạm" />
                        </UFormField>
                        <UButton size="sm" color="primary" @click="addGuidelineIssue(guideline, issueOption)">
                          Thêm vấn đề
                        </UButton>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="guideline.issues.length" class="mt-3 space-y-1">
                  <div
                    v-for="issue in guideline.issues"
                    :key="issue._id"
                    class="flex items-center justify-between p-2 rounded-md bg-red-50 dark:bg-red-900/20"
                  >
                    <span class="text-xs text-gray-700 dark:text-gray-300">
                      Dòng {{ issue.line }}: {{ issue.description }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="mt-6 p-4 dark:bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium">Điểm tuân thủ</span>
                  <span class="text-lg font-bold text-green-600">{{ complianceScore }}%</span>
                </div>
                <UProgress v-model="complianceScore" color="primary" />
              </div>
            </template> -->
            <template #comparison>
              <div class="p-4 space-y-4">
                <h3>So sánh kiểm duyệt AI và thủ công</h3>
                <div v-if="comparisonData" class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span>Vấn đề AI phát hiện</span>
                    <span>{{ comparisonData?.stats?.aiCount }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Vấn đề thủ công</span>
                    <span>{{ comparisonData?.stats?.manualCount }}</span>
                  </div>
                  <!-- <div class="flex items-center justify-between">
                    <span>Vấn đề từ hướng dẫn</span>
                    <span>{{ comparisonData?.stats?.guidelineCount }}</span>
                  </div> -->
                  <div class="flex items-center justify-between">
                    <span>Trùng lặp</span>
                    <span>{{ comparisonData?.stats?.matchedCount }}</span>
                  </div>
                  <UProgress
                    :v-model="(comparisonData.stats.matchedCount / (comparisonData.stats.aiCount || 1)) * 100"
                    label="Tỷ lệ trùng khớp"
                    color="primary"
                  />
                </div>
                <p v-else class="w-full italic text-center">
                  Đang tải dữ liệu so sánh...
                </p>
              </div>
            </template>
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
                      <UBadge :color="getReadabilityColor(analytics.readabilityScore)" variant="subtle">
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
                    <div v-for="keyword in analytics.topKeywords" :key="keyword.word" class="flex items-center justify-between">
                      <span class="text-sm">{{ keyword.word }}</span>
                      <div class="flex items-center gap-2">
                        <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div class="bg-blue-500 h-1 rounded-full" :style="{ width: `${(keyword.count / (analytics?.maxKeywordCount || 1)) * 100}%` }" />
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
                      <span class="text-xs text-gray-500">{{ flag.detected ? flag.count + ' lần' : 'Sạch' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </UTabs>

          <div class="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <UButton
                color="success"
                variant="outline"
                block
                :disabled="hasBlockingIssues"
                @click="showActionModal('approve')"
              >
                <UIcon name="i-lucide-check" class="w-4 h-4 mr-2" />
                Duyệt
              </UButton>
              <UButton
                color="error"
                variant="outline"
                block
                @click="showActionModal('reject')"
              >
                <UIcon name="i-lucide-x" class="w-4 h-4 mr-2" />
                Từ chối
              </UButton>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <UButton
                color="secondary"
                variant="outline"
                block
                @click="showActionModal('edit')"
              >
                <UIcon name="i-lucide-edit" class="w-4 h-4 mr-2" />
                Yêu cầu sửa
              </UButton>
              <UButton
                color="warning"
                variant="outline"
                block
                @click="showActionModal('warning')"
              >
                <UIcon name="i-lucide-arrow-up" class="w-4 h-4 mr-2" />
                Cảnh cáo
              </UButton>
            </div>

            <div class="text-xs text-gray-600 dark:text-gray-400 text-center pt-2">
              {{ detectedIssues.length }} vấn đề
            </div>
          </div>
        </div>
      </div>
    </div>

    <USlideover
      v-model:open="showSearchModal"
      :overlay="false"
      title="Tìm kiếm"
      description="Tìm kiếm trong nội dung của các nhận xét"
    >
      <template #body>
        <UCard>
          <div class="space-y-4">
            <div class="flex justify-between w-full">
              <UInput v-model="searchQuery" placeholder="Nhập từ khóa cần tìm..." icon="i-lucide-search" />
              <UButton @click="performSearch">
                Tìm kiếm
              </UButton>
            </div>
            <div class="flex flex-wrap gap-4">
              <UCheckbox v-model="searchOptions.caseSensitive" label="Phân biệt hoa thường" />
              <UCheckbox v-model="searchOptions.wholeWord" label="Toàn bộ từ" />
              <UCheckbox v-model="searchOptions.regex" label="Regex" />
            </div>
            <div v-if="searchResults.length > 0" class="max-h-100px overflow-y-auto">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Tìm thấy {{ searchResults.length }} kết quả
              </div>
              <div class="space-y-2">
                <div
                  v-for="(result, index) in searchResults"
                  :key="index"
                  class="p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  @click="jumpToResult(result, index)"
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
    </USlideover>

    <UModal v-model:open="showActionModalOpen" :title="actionModalTitle" aria-describedby="undefined">
      <template #body>
        <UCard>
          <div class="space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ actionModalDescription }}
            </p>
            <div class="space-y-4">
              <UFormField label="Ghi chú">
                <UTextarea
                  v-model="actionNote"
                  class="w-full"
                  placeholder="Nhập ghi chú (tùy chọn)"
                  :rows="10"
                />
              </UFormField>
              <div v-if="actionGuidelineNote" class="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p class="text-sm font-medium">
                  Hướng dẫn vi phạm:
                </p>
                <p class="text-sm whitespace-pre-wrap w-full">
                  {{ actionGuidelineNote }}
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </template>
      <template #footer>
        <div class="flex items-end gap-2">
          <UButton variant="outline" @click="showActionModalOpen = false">
            Hủy
          </UButton>
          <UButton
            :disabled="hasBlockingIssues"
            :color="actionModalColor"
            variant="outline"
            @click="performAction"
          >
            {{ actionModalLabel }}
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showAddIssueModal" aria-describedby="undefined">
      <template #header>
        <h3 class="text-lg font-semibold">
          Thêm vấn đề
        </h3>
      </template>
      <template #body>
        <UCard>
          <UForm :state="newIssue" :schema="issueSchema" @submit="addIssue">
            <div class="space-y-4 w-full">
              <UFormField label="Loại vấn đề" name="type">
                <USelect v-model="newIssue.category" :items="issueTypes" class="w-full" />
              </UFormField>
              <UFormField label="Mức độ nghiêm trọng" name="severity">
                <USelect v-model="newIssue.severity" :items="severityOptions" class="w-full" />
              </UFormField>
              <UFormField label="Tiêu đề" name="title">
                <UInput v-model="newIssue.title" class="w-full" />
              </UFormField>
              <UFormField label="Mô tả" name="description">
                <UTextarea v-model="newIssue.description" :rows="4" class="w-full" />
              </UFormField>
              <UFormField label="Dòng" name="line">
                <UInput v-model="newIssue.line" type="number" class="w-full" />
              </UFormField>
            </div>
            <div class="flex justify-end gap-2 mt-4">
              <UButton variant="ghost" @click="showAddIssueModal = false">
                Hủy
              </UButton>
              <UButton type="submit" :loading="actionLoading">
                Thêm
              </UButton>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>

    <UModal v-model:open="reviewConfirmationModalOpen" title="Xác nhận hoàn tất kiểm duyệt" aria-describedby="undefined">
      <template #body>
        <UCard>
          <div class="space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Vui lòng xác nhận rằng bạn đã hoàn tất việc kiểm duyệt chương này.
              Hành động này sẽ cho phép cập nhật trạng thái chương.
            </p>
            <div v-if="!canConfirmReview" class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p class="text-sm text-yellow-700 dark:text-yellow-300">
                Chưa đáp ứng các điều kiện:
              </p>
              <ul class="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
                <li v-if="detectedIssues.some(issue => !issue.resolved && issue.severity !== 'low')">
                  Vẫn còn các vấn đề chưa được giải quyết
                </li>
                <li v-if="!guidelines.every(g => g.checked)">
                  Chưa hoàn thành checklist hướng dẫn
                </li>
                <li v-if="detectedIssues.some(issue => ['high', 'critical'].includes(issue.severity) && !issue.resolved)">
                  Có vấn đề nghiêm trọng chưa được xử lý
                </li>
              </ul>
            </div>
          </div>
        </UCard>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="cancelReviewConfirmation">
            Hủy
          </UButton>
          <UButton :disabled="!canConfirmReview" @click="confirmReview">
            Xác nhận
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { statusPublish } from '~/types'
import type { Chapter } from '~/types/chapter'
import type { User } from '~/types/user'

// Interfaces and Types
type ColorType = 'error' | 'warning' | 'primary' | 'secondary' | 'success' | 'info' | 'neutral'
type IssueType = 'violence' | 'adult' | 'hate_speech' | 'spam' | 'general' | 'grammar' | 'spelling' | 'content' | 'formatting' | 'other' | 'self_harm' // Expanded based on usage
type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'

interface Issue {
  _id: string
  category: IssueType
  severity: IssueSeverity
  title: string
  description: string
  line: number
  start?: number
  end?: number
  position?: string // Made optional as it might not always be present for manual issues
  resolved?: boolean
  isManual: boolean // Added to differentiate AI vs. manual issues
}

interface Guideline {
  id: string
  title: string
  description: string
  checked: boolean
  issues: Issue[] // Issues directly linked to this guideline
  hasIssues: boolean // Derived state
  category: IssueType | 'general' // Added category to link with issue types
  issueOptions: { // Predefined issues for quick selection
    id: string
    description: string
    severity: IssueSeverity
    selected: boolean
    line?: number
    note?: string
  }[]
}
// interface AutoModerationResult {
//   id: string
//   category: string
//   severity: string
//   description: string
//   line: number
//   start: number
//   end: number
// }
// interface ViolationDetail {
//   _id: string
//   category: IssueType
//   severity: IssueSeverity
//   description: string
//   line: number
//   start: number
//   end: number
//   resolved: boolean
//   isManual?: boolean
// }
interface SearchResult {
  line: number
  context: string
  index: number
}

// Props and Dependencies
const props = defineProps<{
  novelId: string
  createdBy: User
  onClose: () => void
}>()
const toast = useToast()
const { getNovelById, approveNovel } = useNovels()
const { getChaptersByNovelId, getChapterById, chapterActions } = useChapters()
const { getStatusColor, getStatusLabel, getStatusIcon } = useStatus()
// const { runAutoModeration } = useModeration()

// Data Fetching
const { data: novelData, pending, error, refresh } = await getNovelById(props.novelId)
const { data: chapters } = await getChaptersByNovelId(props.novelId)
interface ComparisonStats {
  aiCount: number
  manualCount: number
  guidelineCount: number
  matchedCount: number
}

interface ComparisonData {
  stats: ComparisonStats
  aiIssues: Issue[]
  manualIssues: Issue[]
  guidelineIssues: Issue[]
  // Add other properties if needed
}

const comparisonData = ref<ComparisonData | null>(null)

// Reactive States
const defaultChapter = (): Chapter => ({
  _id: '',
  title: '',
  novelId: props.novelId,
  content: '',
  chapterNumber: 0,
  status: 'draft' as statusPublish,
  isPublished: false,
  reports: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  viewCount: 0,
  wordCount: 0,
  averageListenTime: 0
})
const currentChapter = ref<Chapter>(defaultChapter())
// if (chapters?.value.length !== 0) {
//   currentChapter.value = chapters.value[0]
// }

const sidebarOpen = ref(false)
const reviewStatus = computed(() => currentChapter?.value?.status || 'in_review')
const reviewTime = ref(0)
const viewMode = ref('original')
const showTextTools = ref(false)
const fontSize = ref(16)
const lineHeight = ref({ label: '1.6', value: '1.6' })
const highlightMode = ref(false)
const showSearchModal = ref(false)
const showAddIssueModal = ref(false)
const showActionModalOpen = ref(false)
const actionType = ref('')
const actionNote = ref('')
const searchQuery = ref('')
const searchOptions = ref({ caseSensitive: false, wholeWord: false, regex: false })
const searchResults = ref<SearchResult[]>([])
const highlightedSearchResultIndex = ref<number | null>(null) // To manage highlighted search result
// const autoModerationResults = ref<AutoModerationResult[]>([])
const autoModerationLoading = ref(false)
const detectedIssues = ref<Issue[]>([])
const actionGuidelineNote = ref('')
const actionLoading = ref(false)
const reviewConfirmationModalOpen = ref(false)
const isReviewConfirmed = ref(false)
const pendingAction = ref<string | null>(null)
// const AIResult = ref<string>('') // Declared AIResult

const fetchIssues = async (chapterId: string) => {
  try {
    const response = await $fetch<{ issues: Issue[] }>(
      `http://localhost:5000/api/v1/moderation/chapters/${chapterId}/issues`,
      {
        method: 'GET',
        credentials: 'include'
      }
    )
    console.log('Issues from API:', response.issues)
    detectedIssues.value = response.issues.filter((issue) => {
      if (!issue._id) {
        console.error('Issue missing _id:', issue)
        toast.add({
          title: 'Lỗi dữ liệu',
          description: `Một vấn đề không có _id: ${issue.title || issue.description}`,
          color: 'error'
        })
        return false // Loại bỏ issue không có _id
      }
      return true
    }).map(issue => ({
      ...issue,
      _id: issue._id.toString(),
      resolved: issue.resolved || false,
      isManual: issue.isManual || false
    }))
  } catch (err) {
    toast.add({
      title: 'Lỗi',
      description: `Không thể tải danh sách vấn đề: ${err}`,
      color: 'error'
    })
  }
}

const fetchComparisonData = async () => {
  if (!currentChapter?.value?._id) return
  try {
    const response = await $fetch<ComparisonData>(
      `http://localhost:5000/api/v1/moderation/chapters/${currentChapter.value._id}/comparison`,
      {
        method: 'GET',
        credentials: 'include'
      }
    )
    console.log('Comparison data from API:', response)
    comparisonData.value = response
    detectedIssues.value = [
      ...response.aiIssues.filter((issue) => {
        if (!issue._id) {
          console.error('AI Issue missing _id:', issue)
          toast.add({
            title: 'Lỗi dữ liệu',
            description: `Một vấn đề AI không có _id: ${issue.title || issue.description}`,
            color: 'error'
          })
          return false
        }
        return true
      }).map(issue => ({
        ...issue,
        _id: issue._id.toString(),
        resolved: false,
        isManual: false
      })),
      ...response.manualIssues.filter((issue) => {
        if (!issue._id) {
          console.error('Manual Issue missing _id:', issue)
          toast.add({
            title: 'Lỗi dữ liệu',
            description: `Một vấn đề thủ công không có _id: ${issue.title || issue.description}`,
            color: 'error'
          })
          return false
        }
        return true
      }).map(issue => ({
        ...issue,
        _id: issue._id.toString(),
        resolved: false,
        isManual: true
      }))
    ]
    // guidelines.value.forEach((g) => {
    //   g.issues = response.guidelineIssues
    //     .filter((issue) => {
    //       if (!issue._id) {
    //         console.error('Guideline Issue missing _id:', issue)
    //         toast.add({
    //           title: 'Lỗi dữ liệu',
    //           description: `Một vấn đề hướng dẫn không có _id: ${issue.title || issue.description}`,
    //           color: 'error'
    //         })
    //         return false
    //       }
    //       return issue.category === g.category
    //     })
    //     .map(issue => ({
    //       ...issue,
    //       _id: issue._id.toString(),
    //       resolved: false,
    //       isManual: true
    //     }))
    //   g.hasIssues = g.issues.length > 0
    //   g.checked = !g.hasIssues
    // })
  } catch (err) {
    toast.add({
      title: 'Lỗi',
      description: `Không thể tải dữ liệu so sánh: ${err}`,
      color: 'error'
    })
  }
}
watch(currentChapter, async () => {
  if (currentChapter?.value?._id) {
    await fetchIssues(currentChapter.value._id)
    await fetchComparisonData()
  }
}, { immediate: true })
const newIssue = ref<Issue>({ // Initialized newIssue
  _id: '',
  title: '',
  description: '',
  category: 'general',
  severity: 'low',
  line: 1,
  isManual: true
})
const highlightedLineIndex = ref(-1) // Declared highlightedLineIndex
const aiIssues = computed(() => {
  return detectedIssues.value.filter(issue => !issue.isManual)
})

const manualIssues = computed(() => {
  return detectedIssues.value.filter(
    issue => issue.isManual && !guidelines.value.some(g => g.issues.some(gi => gi._id === issue._id))
  )
})

// const guidelineIssues = computed(() => {
//   return guidelines.value.flatMap(g => g.issues)
// })
// const guidelineIssues = computed(() => {
//   return guidelines.value.flatMap(g => g.issues)
// })
// const aiIssues = computed(() => {
//   return detectedIssues.value.filter(issue => !issue.isManual)
// })
// const manualIssues = computed(() => {
//   return detectedIssues.value.filter(issue => issue.isManual && !guidelines.value.some(g => g.issues.includes(issue)))
// })
const isIssueType = (value: string): value is IssueType => {
  return ['violence', 'adult', 'hate_speech', 'spam', 'general', 'grammar', 'spelling', 'content', 'formatting', 'other', 'self_harm'].includes(value)
}

const isIssueSeverity = (value: string): value is IssueSeverity => {
  return ['low', 'medium', 'high', 'critical'].includes(value)
}
// Computed Properties
const contentParagraphs = computed(() =>
  currentChapter?.value?.content.split('\n').filter(p => p.trim()) || []
)
const hasBlockingIssues = computed(() =>
  detectedIssues.value.some(i => ['high', 'critical'].includes(i.severity) && !i.resolved) // Only count unresolved blocking issues
)
// const allChaptersApproved = computed(() => {
//   // This needs to check all chapters associated with the novel, not just the current one
//   // If `chapters` reactive ref holds all chapters for the novel, this is fine.
//   // return chapters.value.every(ch => ch.status === 'approved')
// })
const canConfirmReview = computed(() => {
  // allChaptersApproved.value
  return detectedIssues.value.every(issue => issue.resolved || issue.severity === 'low')
    && guidelines.value.every(g => g.checked)
    && !detectedIssues.value.some(issue => ['high', 'critical'].includes(issue.severity) && !issue.resolved)
})
const confirmReviewEnabled = computed(() => {
  return canConfirmReview.value
})
const reviewProgress = computed(() => {
  const currentIndex = chapters?.value?.findIndex(ch => ch._id === currentChapter?.value?._id)
  if (chapters?.value?.length === 0) return 0
  return ((currentIndex + 1) / chapters?.value?.length) * 100
})
// const aiIssues = computed(() => {
//   return detectedIssues.value.filter(issue => !issue.isManual)
// })
// const manualIssues = computed(() => {
//   return detectedIssues.value.filter(issue => issue.isManual)
// })
// const annotatedContent = computed(() => {
//   if (!currentChapter?.value) return []
//   const content = currentChapter?.value?.content || ''
//   const lines = content.split('\n')

//   return lines.map((lineText, index) => {
//     const issuesOnLine = detectedIssues.value.filter(issue => issue.line === index + 1)
//     const highestSeverityIssue = issuesOnLine.length > 0
//       ? issuesOnLine.sort((a, b) => {
//         const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
//         return severityOrder[b.severity] - severityOrder[a.severity]
//       })[0]
//       : null

//     let processedTextHtml = lineText

//     // Apply search highlighting
//     if (searchQuery.value && searchResults.value.length > 0) {
//       const regexFlags = searchOptions.value.caseSensitive ? 'g' : 'gi'
//       const pattern = searchOptions.value.regex
//         ? searchQuery.value
//         : searchOptions.value.wholeWord
//           ? `\\b${searchQuery.value}\\b`
//           : searchQuery.value

//       let regex
//       try {
//         regex = new RegExp(pattern, regexFlags)
//       } catch (err) {
//         console.error(`Invalid regex for search highlight in annotatedContent: ${err}`)
//         // Fallback to original text if regex is invalid
//         return {
//           type: issuesOnLine.length > 0 ? 'issue' : 'text',
//           text: lineText,
//           issue: highestSeverityIssue,
//           originalLineIndex: index,
//           processedTextHtml: lineText // No highlight if regex is bad
//         }
//       }

//       let lastIndex = 0
//       let lineHtml = ''

//       // Iterate through matches and apply highlights
//       processedTextHtml.replace(regex, (match, offset) => {
//         // Find if this specific match corresponds to the currently highlighted search result
//         const globalSearchResultIndex = searchResults.value.findIndex(sr =>
//           sr.line === index + 1 && sr.index === offset && sr.context.includes(match)
//         )

//         lineHtml += processedTextHtml.substring(lastIndex, offset)
//         if (highlightedSearchResultIndex.value !== null && globalSearchResultIndex === highlightedSearchResultIndex.value) {
//           lineHtml += `<span class="current-search-highlight">${match}</span>`
//         } else {
//           lineHtml += `<span class="search-highlight">${match}</span>`
//         }
//         lastIndex = offset + match.length
//         return match
//       })
//       lineHtml += processedTextHtml.substring(lastIndex)
//       processedTextHtml = lineHtml
//     }

//     return {
//       type: issuesOnLine.length > 0 ? 'issue' : 'text',
//       text: lineText, // Keep original text for debugging/reference
//       issue: highestSeverityIssue,
//       originalLineIndex: index,
//       processedTextHtml: processedTextHtml // HTML with search highlights
//     }
//   })
// })
const annotatedContent = computed(() => {
  const lines = currentChapter?.value?.content?.split('\n') || []
  return lines.map((lineText, index) => {
    const issuesOnLine = detectedIssues.value.filter(issue => issue.line === index + 1)
    const highestSeverityIssue = issuesOnLine.length > 0
      ? issuesOnLine.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      })[0]
      : null

    let highlightClass = ''
    if (highestSeverityIssue) {
      if (highestSeverityIssue.isManual && guidelines.value.some(g => g.issues.includes(highestSeverityIssue))) {
        highlightClass = 'highlight-guideline'
      } else if (highestSeverityIssue.isManual) {
        highlightClass = 'highlight-manual'
      } else {
        highlightClass = `highlight-${highestSeverityIssue.severity}`
      }
    }

    return {
      type: issuesOnLine.length > 0 ? 'issue' : 'text',
      text: lineText,
      issue: highestSeverityIssue,
      originalLineIndex: index,
      processedTextHtml: lineText, // Giữ logic tìm kiếm nếu có
      highlightClass
    }
  })
})
const complianceScore = computed(() => {
  const totalGuidelines = guidelines.value.length
  if (totalGuidelines === 0) return 100
  const passedGuidelines = guidelines.value.filter(g => g.checked && g.issues.length === 0).length
  const score = (passedGuidelines / totalGuidelines) * 100
  return Math.round(score)
})

// Options and Configurations
const toolTabs = ref([
  { slot: 'issues', label: 'Vấn đề', icon: 'i-lucide-alert-triangle' },
  { slot: 'guidelines', label: 'Hướng dẫn', icon: 'i-lucide-check-square' },
  { slot: 'comparison', label: 'Phân tích', icon: 'i-lucide-bar-chart' }
  // { slot: 'analytics', label: 'Phân tích', icon: 'i-lucide-bar-chart' }
])
const issueSchema = z.object({
  type: z.string().min(1, 'Vui lòng chọn loại vấn đề'),
  severity: z.string().min(1, 'Vui lòng chọn mức độ nghiêm trọng'),
  title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
  description: z.string().min(1, 'Vui lòng nhập mô tả'),
  line: z.number().min(1, 'Dòng phải lớn hơn 0')
})
const issueTypes: { label: string, value: IssueType }[] = [
  { label: 'Bạo lực', value: 'violence' },
  { label: 'Nội dung người lớn', value: 'adult' },
  { label: 'Ngôn từ thù địch', value: 'hate_speech' },
  { label: 'Tự gây thương tích', value: 'self_harm' }, // Added for consistency with contentFlags
  { label: 'Spam', value: 'spam' },
  { label: 'Chính tả', value: 'spelling' }, // Added for consistency with contentFlags
  { label: 'Ngữ pháp', value: 'grammar' }, // Added for consistency with contentFlags
  { label: 'Định dạng', value: 'formatting' }, // Added for consistency with contentFlags
  { label: 'Chung', value: 'general' }
]
const severityOptions = [
  { label: 'Thấp', value: 'low' },
  { label: 'Trung bình', value: 'medium' },
  { label: 'Cao', value: 'high' },
  { label: 'Nghiêm trọng', value: 'critical' }
]
const guidelines = ref<Guideline[]>([
  {
    id: 'g1',
    title: 'Nội dung phù hợp',
    description: 'Đảm bảo nội dung không chứa các yếu tố nhạy cảm, bạo lực, hoặc không phù hợp.',
    checked: false,
    issues: [],
    hasIssues: false,
    category: 'content',
    issueOptions: [
      { id: 'g1i1', description: 'Nội dung bạo lực', severity: 'high', selected: false, note: '' },
      { id: 'g1i2', description: 'Nội dung khiêu dâm', severity: 'critical', selected: false, note: '' },
      { id: 'g1i3', description: 'Ngôn ngữ thù địch', severity: 'medium', selected: false, note: '' }
    ]
  },
  {
    id: 'g2',
    title: 'Chính tả và ngữ pháp',
    description: 'Kiểm tra lỗi chính tả, ngữ pháp và dấu câu.',
    checked: true,
    issues: [],
    hasIssues: false,
    category: 'grammar',
    issueOptions: [
      { id: 'g2i1', description: 'Lỗi chính tả cơ bản', severity: 'low', selected: false, note: '' },
      { id: 'g2i2', description: 'Sai ngữ pháp nghiêm trọng', severity: 'medium', selected: false, note: '' }
    ]
  },
  {
    id: 'g3',
    title: 'Định dạng văn bản',
    description: 'Đảm bảo định dạng nhất quán, dễ đọc (ví dụ: xuống dòng, đoạn văn).',
    checked: true,
    issues: [],
    hasIssues: false,
    category: 'formatting',
    issueOptions: [
      { id: 'g3i1', description: 'Lỗi xuống dòng/đoạn văn', severity: 'low', selected: false, note: '' },
      { id: 'g3i2', description: 'Phân đoạn không hợp lý', severity: 'medium', selected: false, note: '' }
    ]
  }
])

// Analytics Computations
const analytics = computed(() => {
  const content = currentChapter?.value?.content || ''
  const words = content.split(/\s+/).filter(w => w)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim())
  const syllables = words.reduce((acc, word) => acc + (word.match(/[aeiouy]/gi)?.length || 1), 0)
  const avgSentenceLength = sentences.length ? words.length / sentences.length : 0
  let readabilityScore = 0
  if (words.length > 0 && sentences.length > 0) {
    readabilityScore = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length)
  }
  const wordFreq = words.reduce<Record<string, number>>((acc, word) => {
    const lowerCaseWord = word.toLowerCase()
    acc[lowerCaseWord] = (acc[lowerCaseWord] || 0) + 1
    return acc
  }, {})

  const sortedWordFreq = Object.entries(wordFreq).sort(([, a], [, b]) => b - a)
  const topKeywords = sortedWordFreq
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }))

  // Simple repetitive word detection (could be more sophisticated)
  const repetitiveWordsCount = Object.values(wordFreq).filter(count => count > 5).length // Example: words appearing more than 5 times
  const totalUniqueWords = Object.keys(wordFreq).length
  const repetitiveWordsPercentage = totalUniqueWords > 0 ? (repetitiveWordsCount / totalUniqueWords) * 100 : 0

  return {
    avgSentenceLength: Math.round(avgSentenceLength),
    readabilityScore: Math.round(readabilityScore),
    readabilityLevel: readabilityScore >= 80 ? 'Dễ' : readabilityScore >= 60 ? 'Trung bình' : 'Khó',
    repetitiveWords: Math.round(repetitiveWordsPercentage),
    topKeywords,
    maxKeywordCount: topKeywords.length > 0 ? topKeywords[0]?.count : 1
  }
})
const contentFlags = computed(() => [
  { type: 'violence', label: 'Bạo lực', detected: currentChapter?.value?.violation?.aiFlag?.violence || false, count: currentChapter?.value?.violation?.count?.violence || 0 },
  { type: 'adult', label: 'Nội dung người lớn', detected: currentChapter?.value?.violation?.aiFlag?.adult || false, count: currentChapter?.value?.violation?.count?.adult || 0 },
  { type: 'hate_speech', label: 'Ngôn từ thù địch', detected: currentChapter?.value?.violation?.aiFlag?.hate_speech || false, count: currentChapter?.value?.violation?.count?.hate_speech || 0 },
  { type: 'self_harm', label: 'Tự gây thương tích', detected: currentChapter?.value?.violation?.aiFlag?.self_harm || false, count: currentChapter?.value?.violation?.count?.self_harm || 0 },
  { type: 'spam', label: 'Spam/Quảng cáo', detected: currentChapter?.value?.violation?.aiFlag?.spam || false, count: currentChapter?.value?.violation?.count?.spam || 0 }
])

// Methods for Formatting and Utilities
const formatDate = (date: string | Date | undefined) => { // Updated type to include undefined
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
const getSeverityColor = (severity: string) => {
  const colors: Record<string, ColorType> = {
    low: 'success', // Often low severity is green/success
    medium: 'warning',
    high: 'error',
    critical: 'error'
  }
  return colors[severity] || 'neutral'
}
const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
    critical: 'Nghiêm trọng'
  }
  return labels[severity] || 'Không rõ'
}
const getIssueColor = (severity: string) => {
  const colors: Record<string, string> = {
    low: 'border-yellow-200 dark:border-yellow-800',
    medium: 'border-orange-200 dark:border-orange-800',
    high: 'border-red-200 dark:border-red-800',
    critical: 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
  }
  return colors[severity] || 'border-gray-200 dark:border-gray-700'
}
const getIssueIcon = (type: string) => {
  const icons: Record<string, string> = {
    content: 'i-lucide-file-text',
    grammar: 'i-lucide-spell-check',
    spelling: 'i-lucide-spell-check', // Added spelling icon
    formatting: 'i-lucide-align-justify', // Added formatting icon
    violence: 'i-lucide-skull',
    adult: 'i-lucide-circle-dot',
    hate_speech: 'i-lucide-message-square-off',
    self_harm: 'i-lucide-hand-heart',
    spam: 'i-lucide-mail-warning',
    general: 'i-lucide-alert-circle',
    other: 'i-lucide-help-circle'
  }
  return icons[type] || 'i-lucide-alert-circle'
}
const getIssueIconColor = (severity: string) => {
  const colors: Record<string, string> = {
    low: 'text-yellow-500',
    medium: 'text-orange-500',
    high: 'text-red-500',
    critical: 'text-red-600'
  }
  return colors[severity] || 'text-gray-500'
}
const getReadabilityColor = (score: number) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}

const handleLineClick = (index: number, text: string) => {
  // This function can be expanded to show more details about issues on a clicked line
  // For now, it's just a placeholder.
  console.log(`Clicked line ${index + 1}: ${text}`)
  const issuesOnLine = detectedIssues.value.filter(issue => issue.line === index + 1)
  if (issuesOnLine.length > 0) {
    // You could open a modal here to display all issues for this line
    toast.add({
      title: 'Vấn đề trên dòng này',
      description: issuesOnLine.map(issue => `${getSeverityLabel(issue.severity)}: ${issue.title}`).join(', '),
      color: 'info'
    })
  }
}

// Methods for Chapter and Issue Handling
const isHighlighted = (index: number, paragraph: string) => {
  return detectedIssues.value.some((i) => {
    // Check if the issue is for this line number
    if (i.line === index + 1) {
      // If position is available, use it for more precise highlighting
      if (i.position) {
        const [startRaw, endRaw] = i.position.split('-')
        const start = Number(startRaw)
        const end = Number(endRaw)
        // Check if the paragraph contains the highlighted part based on position
        if (isNaN(start) || isNaN(end)) return false
        return paragraph.substring(start, end).length > 0
      }
      // If no position, assume the entire line is highlighted if an issue exists for it
      return true
    }
    return false
  })
}
const selectChapter = async (chapter: Chapter) => {
  currentChapter.value = chapter
  try {
    const response = await getChapterById(chapter._id)
    if (response.error.value) {
      throw new Error(response.error.value)
    }
    // Lấy danh sách vấn đề
    await fetchIssues(chapter._id)
    // Lấy dữ liệu so sánh
    await fetchComparisonData()
    // Reset các trạng thái liên quan
    highlightedSearchResultIndex.value = null
    highlightedLineIndex.value = -1
  } catch (err) {
    toast.add({ title: 'Lỗi', description: `Không thể tải chi tiết chương: ${err}`, color: 'error' })
  }
}
// const selectChapter = async (chapter: Chapter) => {
//   currentChapter.value = chapter
//   try {
//     const response = await getChapterById(chapter._id)
//     if (response.error.value) {
//       throw new Error(response.error.value)
//     }
//     // Filter out issues that might not have a position
//     detectedIssues.value = []
//     // .concat(
//     //   manualIssues.value.map(issue => ({
//     //     ...issue,
//     //     position: typeof issue.position === 'string' ? issue.position : '',
//     //     resolved: typeof issue.resolved === 'boolean' ? issue.resolved : false
//     //   }))
//     // ) // Keep manual issues when changing chapters
//     // Update guidelines based on current detected issues
//     guidelines.value.forEach((g) => {
//       g.issues = detectedIssues.value
//         .filter(i => i.category === g.category) // Filter by the new 'category' property
//       g.checked = g.issues.length === 0 // If no issues, it's checked
//       g.hasIssues = g.issues.length > 0 // Derived state for visual indication
//     })
//     highlightedSearchResultIndex.value = null // Clear search highlight on chapter change
//   } catch (err) {
//     toast.add({ title: 'Lỗi', description: `Không thể tải chi tiết chương, ${err}`, color: 'error' })
//   }
// }
const handleAutoModeration = async () => {
  try {
    const response = await $fetch<{ results: Issue[] }>(`http://localhost:5000/api/v1/moderation/chapters/${currentChapter?.value?._id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: { text: currentChapter?.value?.content }
    })
    response.results.forEach((issue) => {
      detectedIssues.value.push({
        _id: issue._id,
        category: issue.category,
        title: issue.title || issue.description,
        severity: issue.severity,
        description: issue.description,
        line: issue.line,
        start: issue.start,
        end: issue.end,
        resolved: false,
        isManual: false
      })
    })
    toast.add({ title: 'Thành công', description: 'Kiểm duyệt AI hoàn tất.', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Lỗi', description: `Kiểm duyệt AI thất bại: ${err instanceof Error ? err.message : String(err)}`, color: 'error' })
  }
}
// const addIssue = async (event: FormSubmitEvent<{ title: string, description: string, severity: string, line: number, type: string }>) => {
//   try {
//     const dataToSend = {
//       category: event.data.type,
//       title: event.data.title,
//       description: event.data.description,
//       severity: event.data.severity,
//       line: event.data.line,
//       start: 0,
//       end: 0,
//       isManual: true
//     }

//     const response = await $fetch<{ id: string }>(`http://localhost:5000/api/v1/moderation/chapters/${currentChapter?.value?._id}/issues`, {
//       method: 'POST',
//       credentials: 'include',
//       body: dataToSend
//     })

//     const newDetectedIssue = {
//       _id: response.id,
//       category: dataToSend.category,
//       title: event.data.title,
//       severity: dataToSend.severity,
//       description: dataToSend.description,
//       line: dataToSend.line,
//       start: dataToSend.start,
//       end: dataToSend.end,
//       resolved: false,
//       isManual: true
//     }
//     detectedIssues.value.push(newDetectedIssue)
//     const guideline = guidelines.value.find(g => g.category === newDetectedIssue.category)
//     if (guideline) {
//       guideline.issues.push(newDetectedIssue)
//       guideline.hasIssues = true
//       guideline.checked = false
//     }
//     toast.add({ title: 'Thành công', description: `Vấn đề "${event.data.title}" đã được thêm.`, color: 'success' })
//   } catch (err) {
//     toast.add({ title: 'Lỗi', description: `Không thể thêm vấn đề: ${err instanceof Error ? err.message : String(err)}`, color: 'error' })
//   }
// }
// const addIssue = async (event: FormSubmitEvent<{ title: string, description: string, severity: string, line: number, type: string }>) => {
//   try {
//     const category = event.data.type
//     const severity = event.data.severity

//     // Kiểm tra kiểu
//     if (!isIssueType(category)) {
//       throw new Error(`Loại vấn đề không hợp lệ: ${category}`)
//     }
//     if (!isIssueSeverity(severity)) {
//       throw new Error(`Mức độ nghiêm trọng không hợp lệ: ${severity}`)
//     }

//     const dataToSend = {
//       category,
//       title: event.data.title,
//       description: event.data.description,
//       severity,
//       line: event.data.line,
//       start: 0,
//       end: 0,
//       isManual: true
//     }

//     const response = await $fetch<{ id: string }>(`http://localhost:5000/api/v1/moderation/chapters/${currentChapter?.value?._id}/issues`, {
//       method: 'POST',
//       credentials: 'include',
//       body: dataToSend
//     })

//     const newDetectedIssue: Issue = {
//       _id: response.id,
//       category: category as IssueType, // TypeScript đã được kiểm tra
//       title: event.data.title,
//       severity: severity as IssueSeverity, // TypeScript đã được kiểm tra
//       description: event.data.description,
//       line: event.data.line,
//       start: dataToSend.start,
//       end: dataToSend.end,
//       resolved: false,
//       isManual: true
//     }
//     detectedIssues.value.push(newDetectedIssue)
//     const guideline = guidelines.value.find(g => g.category === newDetectedIssue.category)
//     if (guideline) {
//       guideline.issues.push(newDetectedIssue)
//       guideline.hasIssues = true
//       guideline.checked = false
//     }
//     toast.add({ title: 'Thành công', description: `Vấn đề "${event.data.title}" đã được thêm.`, color: 'success' })
//   } catch (err) {
//     toast.add({ title: 'Lỗi', description: `Không thể thêm vấn đề: ${err instanceof Error ? err.message : String(err)}`, color: 'error' })
//   }
// }
// const addIssue = async (event: FormSubmitEvent<{ title: string, description: string, severity: string, line: number, type: string }>) => {
//   try {
//     const category = event.data.type
//     const severity = event.data.severity

//     if (!isIssueType(category)) {
//       throw new Error(`Loại vấn đề không hợp lệ: ${category}`)
//     }
//     if (!isIssueSeverity(severity)) {
//       throw new Error(`Mức độ nghiêm trọng không hợp lệ: ${severity}`)
//     }

//     const dataToSend = {
//       category,
//       title: event.data.title,
//       description: event.data.description,
//       severity,
//       line: event.data.line,
//       start: 0,
//       end: 0,
//       isManual: true
//     }

//     const response = await $fetch<{ id: string }>(`http://localhost:5000/api/v1/moderation/chapters/${currentChapter?.value?._id}/issues`, {
//       method: 'POST',
//       credentials: 'include',
//       body: dataToSend
//     })

//     const newDetectedIssue: Issue = {
//       _id: response.id,
//       category: category as IssueType,
//       title: event.data.title,
//       severity: severity as IssueSeverity,
//       description: event.data.description,
//       line: event.data.line,
//       start: dataToSend.start,
//       end: dataToSend.end,
//       resolved: false,
//       isManual: true
//     }
//     detectedIssues.value.push(newDetectedIssue)
//     const guideline = guidelines.value.find(g => g.category === newDetectedIssue.category)
//     if (guideline) {
//       guideline.issues.push(newDetectedIssue)
//       guideline.hasIssues = true
//       guideline.checked = false
//     }
//     toast.add({ title: 'Thành công', description: `Vấn đề "${event.data.title}" đã được thêm.`, color: 'success' })
//   } catch (err) {
//     toast.add({ title: 'Lỗi', description: `Không thể thêm vấn đề: ${err instanceof Error ? err.message : String(err)}`, color: 'error' })
//   }
// }
const addIssue = async (event: FormSubmitEvent<{ title: string, description: string, severity: string, line: number, type: string }>) => {
  try {
    const category = event.data.type
    const severity = event.data.severity

    if (!isIssueType(category)) {
      throw new Error(`Loại vấn đề không hợp lệ: ${category}`)
    }
    if (!isIssueSeverity(severity)) {
      throw new Error(`Mức độ nghiêm trọng không hợp lệ: ${severity}`)
    }

    const dataToSend = {
      category,
      title: event.data.title,
      description: event.data.description,
      severity,
      line: event.data.line,
      start: 0,
      end: 0,
      isManual: true
    }

    await $fetch<{ id: string }>(`http://localhost:5000/api/v1/moderation/chapters/${currentChapter?.value?._id}/issues`, {
      method: 'POST',
      credentials: 'include',
      body: dataToSend
    })

    // Làm mới danh sách vấn đề và dữ liệu so sánh
    await fetchIssues(currentChapter.value._id)
    await fetchComparisonData()

    toast.add({ title: 'Thành công', description: `Vấn đề "${event.data.title}" đã được thêm.`, color: 'success' })
    showAddIssueModal.value = false
  } catch (err) {
    toast.add({
      title: 'Lỗi',
      description: `Không thể thêm vấn đề: ${err instanceof Error ? err.message : String(err)}`,
      color: 'error'
    })
  }
}
const removeIssue = async (issueId: string | undefined) => {
  if (!issueId) {
    toast.add({ title: 'Lỗi', description: 'ID vấn đề không hợp lệ', color: 'error' })
    return
  }
  if (!confirm('Bạn có chắc muốn xóa vấn đề này?')) {
    return
  }
  try {
    await $fetch(`http://localhost:5000/api/v1/moderation/chapters/${currentChapter?.value?._id}/issues/${issueId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    await fetchIssues(currentChapter.value._id)
    await fetchComparisonData()
    toast.add({ title: 'Thành công', description: 'Đã xóa vấn đề', color: 'success' })
  } catch (err) {
    console.error('Lỗi khi xóa vấn đề:', err)
    toast.add({ title: 'Lỗi', description: `Không thể xóa vấn đề: ${err}`, color: 'error' })
  }
}
// const removeIssue = async (issueId: string) => {
//   try {
//     // Gọi API backend để xóa vấn đề
//     await $fetch(`http://localhost:5000/api/v1/moderation/chapters/${currentChapter?.value?._id}/issues/${issueId}`, {
//       method: 'DELETE',
//       credentials: 'include'
//     })

//     // Cập nhật trạng thái frontend sau khi backend xóa thành công
//     detectedIssues.value = detectedIssues.value.filter(i => i._id !== issueId)
//     guidelines.value.forEach((g) => {
//       g.issues = g.issues.filter(i => i._id !== issueId) // Lọc theo _id
//       g.checked = !g.issues.length // Cập nhật trạng thái checked dựa trên số vấn đề còn lại
//       g.hasIssues = g.issues.length > 0 // Cập nhật hasIssues
//     })
//     toast.add({ title: 'Thành công', description: 'Đã xóa vấn đề', color: 'success' })
//   } catch (err) {
//     console.error('Lỗi khi xóa vấn đề:', err) // Log lỗi chi tiết hơn
//     toast.add({ title: 'Lỗi', description: 'Không thể xóa vấn đề', color: 'error' })
//   }
// }
const toggleGuideline = (guideline: Guideline) => {
  if (guideline.checked) {
    // If guideline is checked, remove all issues related to it from detectedIssues
    detectedIssues.value = detectedIssues.value.filter(
      issue => !(issue.category === guideline.category && issue.isManual)
    )
    guideline.issues = []
    guideline.hasIssues = false
    guideline.issueOptions.forEach((option) => {
      option.selected = false
      option.line = undefined
      option.note = undefined
    })
  }
}
const handleGuidelineIssueSelection = (guideline: Guideline, issueOption: Guideline['issueOptions'][0]) => {
  if (!issueOption.selected) {
    // If unselected, remove the issue from both guideline.issues and detectedIssues
    guideline.issues = guideline.issues.filter(issue => issue.description !== issueOption.description || issue.line !== issueOption.line)
    detectedIssues.value = detectedIssues.value.filter(issue => issue.description !== issueOption.description || issue.line !== issueOption.line)
    issueOption.line = undefined
    issueOption.note = undefined
    guideline.hasIssues = guideline.issues.length > 0
    guideline.checked = guideline.issues.length === 0
  }
}
const addGuidelineIssue = async (guideline: Guideline, issueOption: Guideline['issueOptions'][0]) => {
  if (!currentChapter?.value) {
    toast.add({ title: 'Lỗi', description: 'Chưa có chương nào được chọn.', color: 'error' })
    return
  }
  const contentLines = currentChapter?.value?.content.split('\n').length
  if (issueOption.line && (issueOption.line > contentLines || issueOption.line < 1)) {
    toast.add({ title: 'Lỗi', description: `Dòng ${issueOption.line} không hợp lệ. Chương này chỉ có ${contentLines} dòng.`, color: 'error' })
    return
  }

  try {
    const category = guideline.category
    const severity = issueOption.severity

    if (!isIssueType(category)) {
      throw new Error(`Loại vấn đề không hợp lệ: ${category}`)
    }
    if (!isIssueSeverity(severity)) {
      throw new Error(`Mức độ nghiêm trọng không hợp lệ: ${severity}`)
    }

    const dataToSend = {
      category,
      title: guideline.title,
      description: issueOption.note || issueOption.description,
      severity,
      line: issueOption.line || 0,
      start: 0,
      end: 0,
      isManual: true
    }

    await $fetch<{ id: string }>(`http://localhost:5000/api/v1/moderation/chapters/${currentChapter?.value?._id}/issues`, {
      method: 'POST',
      credentials: 'include',
      body: dataToSend
    })

    // Làm mới danh sách vấn đề và dữ liệu so sánh
    await fetchIssues(currentChapter.value._id)
    await fetchComparisonData()

    toast.add({ title: 'Thành công', description: `Vấn đề "${issueOption.description}" đã được thêm.`, color: 'success' })
  } catch (err) {
    toast.add({ title: 'Lỗi', description: `Không thể thêm vấn đề: ${err instanceof Error ? err.message : String(err)}`, color: 'error' })
  }
}
// const addGuidelineIssue = async (guideline: Guideline, issueOption: Guideline['issueOptions'][0]) => {
//   if (!currentChapter?.value) {
//     toast.add({ title: 'Lỗi', description: 'Chưa có chương nào được chọn.', color: 'error' })
//     return
//   }
//   const contentLines = currentChapter?.value?.content.split('\n').length
//   if (issueOption.line && (issueOption.line > contentLines || issueOption.line < 1)) {
//     toast.add({ title: 'Lỗi', description: `Dòng ${issueOption.line} không hợp lệ. Chương này chỉ có ${contentLines} dòng.`, color: 'error' })
//     return
//   }

//   try {
//     const category = guideline.category
//     const severity = issueOption.severity

//     if (!isIssueType(category)) {
//       throw new Error(`Loại vấn đề không hợp lệ: ${category}`)
//     }
//     if (!isIssueSeverity(severity)) {
//       throw new Error(`Mức độ nghiêm trọng không hợp lệ: ${severity}`)
//     }

//     const dataToSend = {
//       category,
//       title: guideline.title,
//       description: issueOption.note || issueOption.description,
//       severity,
//       line: issueOption.line || 0,
//       start: 0,
//       end: 0,
//       isManual: true
//     }

//     const response = await $fetch<{ id: string }>(`http://localhost:5000/api/v1/moderation/chapters/${currentChapter?.value?._id}/issues`, {
//       method: 'POST',
//       credentials: 'include',
//       body: dataToSend
//     })

//     const newGuidelineIssue: Issue = {
//       _id: response.id,
//       category: category as IssueType,
//       title: guideline.title,
//       severity: severity as IssueSeverity,
//       description: issueOption.note || issueOption.description,
//       line: issueOption.line || 0,
//       start: 0,
//       end: 0,
//       resolved: false,
//       isManual: true
//     }

//     guideline.issues.push(newGuidelineIssue)
//     detectedIssues.value.push(newGuidelineIssue)
//     guideline.hasIssues = true
//     guideline.checked = false
//     toast.add({ title: 'Thành công', description: `Vấn đề "${issueOption.description}" đã được thêm.`, color: 'success' })
//   } catch {
//     toast.add({ title: 'Lỗi', description: 'Không thể thêm vấn đề.', color: 'error' })
//   }
// }
// const addGuidelineIssue = async (guideline: Guideline, issueOption: Guideline['issueOptions'][0]) => {
//   if (!currentChapter?.value) {
//     toast.add({ title: 'Lỗi', description: 'Chưa có chương nào được chọn.', color: 'error' });
//     return;
//   }
//   const contentLines = currentChapter?.value?.content.split('\n').length;
//   if (issueOption.line && (issueOption.line > contentLines || issueOption.line < 1)) {
//     toast.add({ title: 'Lỗi', description: `Dòng ${issueOption.line} không hợp lệ. Chương này chỉ có ${contentLines} dòng.`, color: 'error' });
//     return;
//   }

//   try {
//     const category = guideline.category;
//     const severity = issueOption.severity;

//     // Kiểm tra kiểu
//     if (!isIssueType(category)) {
//       throw new Error(`Loại vấn đề không hợp lệ: ${category}`);
//     }
//     if (!isIssueSeverity(severity)) {
//       throw new Error(`Mức độ nghiêm trọng không hợp lệ: ${severity}`);
//     }

//     const dataToSend = {
//       category,
//       title: guideline.title,
//       description: issueOption.note || issueOption.description,
//       severity,
//       line: issueOption.line || 0,
//       start: 0,
//       end: 0,
//       isManual: true
//     };

//     const response = await $fetch<{ id: string }>(`http://localhost:5000/api/v1/moderation/chapters/${currentChapter?.value?._id}/issues`, {
//       method: 'POST',
//       credentials: 'include',
//       body: dataToSend
//     });

//     const newGuidelineIssue: Issue = {
//       _id: response.id,
//       category: category as IssueType,
//       title: guideline.title,
//       severity: severity as IssueSeverity,
//       description: issueOption.note || issueOption.description,
//       line: issueOption.line || 0,
//       start: 0,
//       end: 0,
//       resolved: false,
//       isManual: true
//     };

//     guideline.issues.push(newGuidelineIssue);
//     detectedIssues.value.push(newGuidelineIssue);
//     guideline.hasIssues = true;
//     guideline.checked = false;
//     toast.add({ title: 'Thành công', description: `Vấn đề "${issueOption.description}" đã được thêm.`, color: 'success' });
//   } catch (err) {
//     toast.add({ title: 'Lỗi', description: `Không thể thêm vấn đề: ${err.message}`, color: 'error' });
//   }
// };
// const addGuidelineIssue = async (guideline: Guideline, issueOption: Guideline['issueOptions'][0]) => {
//   if (!currentChapter?.value) {
//     toast.add({ title: 'Lỗi', description: 'Chưa có chương nào được chọn.', color: 'error' })
//     return
//   }
//   const contentLines = currentChapter?.value?.content.split('\n').length
//   if (issueOption.line && (issueOption.line > contentLines || issueOption.line < 1)) {
//     toast.add({ title: 'Lỗi', description: `Dòng ${issueOption.line} không hợp lệ. Chương này chỉ có ${contentLines} dòng.`, color: 'error' })
//     return
//   }

//   try {
//     const dataToSend = {
//       category: guideline.category,
//       title: guideline.title,
//       description: issueOption.note || issueOption.description,
//       severity: issueOption.severity,
//       line: issueOption.line || 0,
//       start: 0,
//       end: 0,
//       isManual: true
//     }

//     const response = await $fetch<{ id: string }>(`http://localhost:5000/api/v1/moderation/chapters/${currentChapter?.value?._id}/issues`, {
//       method: 'POST',
//       credentials: 'include',
//       body: dataToSend
//     })

//     const newGuidelineIssue: Issue = {
//       _id: response.id,
//       category: guideline.category,
//       title: guideline.title,
//       severity: issueOption.severity,
//       description: issueOption.note || issueOption.description,
//       line: issueOption.line || 0,
//       start: 0,
//       end: 0,
//       resolved: false,
//       isManual: true
//     }

//     guideline.issues.push(newGuidelineIssue)
//     detectedIssues.value.push(newGuidelineIssue)
//     guideline.hasIssues = true
//     guideline.checked = false
//     toast.add({ title: 'Thành công', description: `Vấn đề "${issueOption.description}" đã được thêm.`, color: 'success' })
//   } catch (err) {
//     toast.add({ title: 'Lỗi', description: `Không thể thêm vấn đề: ${err.message}`, color: 'error' })
//   }
// }
// const removeGuideline = (guidelineId: string) => {
//   const guideline = guidelines.value.find(g => g.id === guidelineId)
//   if (guideline) {
//     detectedIssues.value = detectedIssues.value.filter(
//       issue => !guideline.issues.some(gIssue => gIssue._id === issue._id)
//     )
//     guidelines.value = guidelines.value.filter(g => g.id !== guidelineId)
//     toast.add({ title: 'Thành công', description: 'Đã xóa hướng dẫn', color: 'success' })
//   }
// }
const highlightIssue = (issue: Issue) => {
  viewMode.value = 'annotated'
  highlightedLineIndex.value = issue.line - 1
  nextTick(() => {
    const contentElement = document.querySelector(`.content-annotated p:nth-child(${issue.line})`)
    if (contentElement) {
      // const targetParagraph = contentElement.children[issue.line - 1] as HTMLElement
      // if (contentElement) {
      contentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      contentElement.classList.add('animate-pulse-once')
      setTimeout(() => {
        contentElement.classList.remove('animate-pulse-once')
      }, 1000)
    }
  })
}
const saveDraft = () => {
  console.log('Saving draft...')
  toast.add({ title: 'Thông báo', description: 'Chức năng lưu nháp đang được phát triển.', color: 'info' })
  // Implement actual save draft logic here
}
const performAction = async () => {
  if (actionType.value !== 'approve' && !actionNote.value.trim()) {
    toast.add({ title: 'Lỗi', description: 'Ghi chú là bắt buộc cho hành động này.', color: 'error' })
    return
  }
  actionLoading.value = true
  try {
    const { error: actionError } = await chapterActions(currentChapter?.value._id, actionType.value, actionNote.value)
    if (actionError.value) {
      throw new Error(actionError.value)
    }

    currentChapter.value.status = actionType.value === 'approve'
      ? 'approved' as statusPublish
      : actionType.value === 'reject'
        ? 'rejected' as statusPublish
        : actionType.value === 'edit'
          ? 'editing' as statusPublish
          : 'in_review' as statusPublish

    showActionModalOpen.value = false
    toast.add({ title: 'Thành công', description: `Chương đã được ${actionModalLabel.value.toLowerCase()}.`, color: 'success' })
    await refresh() // Refresh data after action
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : `Có lỗi xảy ra khi ${actionType.value} chương ${currentChapter?.value?._id}`
    toast.add({ title: 'Lỗi', description: errorMessage || 'Không thể thực hiện hành động', color: 'error' })
  } finally {
    actionLoading.value = false
  }
}
const confirmReview = async () => {
  if (!canConfirmReview.value) {
    toast.add({ title: 'Lỗi', description: 'Chưa đáp ứng các điều kiện để xác nhận kiểm duyệt', color: 'error' })
    return
  }
  try {
    await approveNovel(props.novelId) // Assuming approveNovel handles the final novel approval
    isReviewConfirmed.value = true
    reviewConfirmationModalOpen.value = false
    toast.add({ title: 'Thành công', description: 'Tiểu thuyết đã được duyệt hoàn tất', color: 'success' })
    props.onClose() // Close the moderation interface
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Không thể xác nhận hoàn tất kiểm duyệt'
    toast.add({ title: 'Lỗi', description: errorMessage, color: 'error' })
  }
}
const openReviewConfirmationModal = () => {
  reviewConfirmationModalOpen.value = true
}
const cancelReviewConfirmation = () => {
  reviewConfirmationModalOpen.value = false
  pendingAction.value = null
}

const handleTextSelection = () => {
  if (!highlightMode.value) return
  const selection = window.getSelection()
  if (selection?.toString().trim()) {
    const selectedText = selection.toString().trim()
    const content = currentChapter?.value?.content || ''
    const lines = content.split('\n')
    let foundLine = -1

    // Find the line number of the selection
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]?.includes(selectedText)) {
        foundLine = i + 1
        break
      }
    }

    if (foundLine !== -1) {
      newIssue.value = {
        _id: '', // Will be generated by backend or on add
        title: `Vấn đề tại dòng ${foundLine}`,
        description: selectedText,
        category: 'general',
        severity: 'low',
        line: foundLine,
        isManual: true
      }
      showAddIssueModal.value = true
    } else {
      toast.add({ title: 'Thông báo', description: 'Không thể xác định dòng cho lựa chọn này.', color: 'warning' })
    }
  }
}
const performSearch = () => {
  if (!searchQuery.value.trim() || !currentChapter?.value?.content) {
    searchResults.value = []
    toast.add({ title: 'Thông báo', description: 'Vui lòng nhập từ khóa để tìm kiếm.', color: 'warning' })
    return
  }
  const content = currentChapter?.value?.content
  const lines = content.split('\n')
  searchResults.value = []
  highlightedSearchResultIndex.value = null // Reset highlight on new search

  const regexFlags = searchOptions.value.caseSensitive ? 'g' : 'gi'
  const pattern = searchOptions.value.regex
    ? searchQuery.value
    : searchOptions.value.wholeWord
      ? `\\b${searchQuery.value}\\b`
      : searchQuery.value
  let regex
  try {
    regex = new RegExp(pattern, regexFlags)
  } catch (err) {
    toast.add({ title: 'Lỗi', description: `Biểu thức chính quy không hợp lệ: ${err}`, color: 'error' })
    return
  }
  lines.forEach((line, index) => {
    // Only search within visible part of line context if needed, but for full line, use line directly
    // Using `matchAll` to find all occurrences
    const matches = [...line.matchAll(regex)]
    for (const match of matches) {
      if (match.index !== undefined) { // Ensure match.index is not undefined
        searchResults.value.push({
          line: index + 1,
          context: line.slice(Math.max(0, match.index - 20), match.index + match[0].length + 20), // Context for display
          index: match.index // Store the exact index within the line
        })
      }
    }
  })
  if (searchResults.value.length === 0) {
    toast.add({ title: 'Thông báo', description: 'Không tìm thấy kết quả', color: 'warning' })
  }
}
const jumpToResult = (result: SearchResult, index: number) => {
  // No longer forcing viewMode, as both modes will support highlights
  highlightedSearchResultIndex.value = index // Set the index of the highlighted result
  nextTick(() => {
    const contentElement = document.querySelector(`.content-${viewMode.value} p:nth-child(${result.line})`)
    if (contentElement) {
      contentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      contentElement.classList.add('bg-blue-100', 'text-yellow-500')
      setTimeout(() => contentElement.classList.remove('bg-blue-100', 'text-yellow-500'), 2000)
    }
  })
}

// Action Modal Computations
type ActionType = 'approve' | 'reject' | 'edit' | 'warning' | 'flag' // Explicitly define types

const actionModalTitle = computed(() => {
  const titles: Record<ActionType, string> = {
    approve: 'Duyệt chương',
    reject: 'Từ chối chương',
    edit: 'Yêu cầu chỉnh sửa chương',
    warning: 'Cảnh cáo chương',
    flag: 'Đánh dấu chương'
  }
  return titles[actionType.value as ActionType] || 'Hành động chương' // Default for safety
})
const actionModalDescription = computed(() => {
  const descriptions: Record<ActionType, string> = {
    approve: 'Bạn có chắc muốn duyệt chương này? Chương sẽ được công khai.',
    reject: 'Vui lòng nhập lý do từ chối chương.',
    edit: 'Vui lòng nhập ghi chú về các chỉnh sửa cần thực hiện.',
    warning: 'Vui lòng nhập lý do cảnh cáo chương.',
    flag: 'Vui lòng nhập ghi chú về chương.'
  }
  return descriptions[actionType.value as ActionType] || 'Mô tả hành động.' // Default for safety
})
const actionModalColor = computed(() => {
  const colors: Record<ActionType, ColorType> = {
    approve: 'success',
    reject: 'error',
    edit: 'info',
    warning: 'warning',
    flag: 'secondary'
  }
  return colors[actionType.value as ActionType] || 'neutral'
})
const actionModalLabel = computed(() => {
  const labels: Record<ActionType, string> = {
    approve: 'Duyệt',
    reject: 'Từ chối',
    edit: 'Gửi yêu cầu',
    warning: 'Cảnh cáo',
    flag: 'Đánh dấu'
  }
  return labels[actionType.value as ActionType] || 'Thực hiện' // Default for safety
})

const showActionModal = (type: ActionType) => {
  actionType.value = type
  actionNote.value = ''

  // Sửa đổi phần này để hiển thị chi tiết hơn về các vấn đề trong hướng dẫn
  const uncheckedGuidelines = guidelines.value
    .filter(g => !g.checked)
    .map((g) => {
      const issueDetails = g.issues.map(i =>
        `Dòng ${i.line}: ${i.description} (Mức độ: ${getSeverityLabel(i.severity)})` // Thêm mức độ nghiêm trọng
      ).join('\n')
      return `${g.title}:\n${issueDetails || 'Không có vấn đề nào được thêm cho hướng dẫn này.'}` // Thêm thông báo nếu không có vấn đề
    })
    .join('\n\n')

  const aiIssuesSummary = aiIssues.value
    .map(i => `AI - ${i.title} (Mức độ: ${getSeverityLabel(i.severity)}, Dòng: ${i.line})\n${i.description}`)
    .join('\n\n')

  const manualIssuesSummary = manualIssues.value
    .map(i => `Thủ công - ${i.title} (Mức độ: ${getSeverityLabel(i.severity)}, Dòng: ${i.line})\n${i.description}`)
    .join('\n\n')

  actionNote.value = `Hướng dẫn vi phạm:\n${uncheckedGuidelines || 'Không có hướng dẫn nào bị vi phạm.'}\n\nVi phạm AI:\n${aiIssuesSummary || 'Không có vi phạm AI.'}\n\nVi phạm thủ công:\n${manualIssuesSummary || 'Không có vi phạm thủ công.'}`
  showActionModalOpen.value = true
}

// New method for original view highlighting
const annotateParagraphWithSearchHighlights = (paragraph: string, paragraphIndex: number) => {
  if (!searchQuery.value || searchResults.value.length === 0) {
    return paragraph
  }

  const regexFlags = searchOptions.value.caseSensitive ? 'g' : 'gi'
  const pattern = searchOptions.value.regex
    ? searchQuery.value
    : searchOptions.value.wholeWord
      ? `\\b${searchQuery.value}\\b`
      : searchQuery.value

  let regex
  try {
    regex = new RegExp(pattern, regexFlags)
  } catch (err) {
    console.error(`Invalid regex for search highlight in original view: ${err}`)
    return paragraph
  }

  let lastIndex = 0
  let html = ''

  paragraph.replace(regex, (match, offset) => {
    // Check if this match corresponds to the globally highlighted search result
    const globalSearchResultIndex = searchResults.value.findIndex(sr =>
      sr.line === paragraphIndex + 1 && sr.index === offset && sr.context.includes(match)
    )

    html += paragraph.substring(lastIndex, offset)
    if (highlightedSearchResultIndex.value !== null && globalSearchResultIndex === highlightedSearchResultIndex.value) {
      html += `<span class="current-search-highlight">${match}</span>`
    } else {
      html += `<span class="search-highlight">${match}</span>`
    }
    lastIndex = offset + match.length
    return match
  })

  html += paragraph.substring(lastIndex)
  return html
}

// Lifecycle Hooks
onMounted(() => {
  document.addEventListener('selectionchange', handleTextSelection)
  const timer = setInterval(() => reviewTime.value++, 1000)
  onBeforeUnmount(() => {
    document.removeEventListener('selectionchange', handleTextSelection)
    clearInterval(timer)
  })
})
watch(chapters, (newChapters) => {
  if (newChapters && newChapters.length > 0 && newChapters[0]) {
    currentChapter.value = newChapters[0]
  } else {
    currentChapter.value = defaultChapter()
    toast.add({ title: 'Thông báo', description: 'Không có chương nào để hiển thị', color: 'warning' })
  }
}, { immediate: true })
useHead({
  title: `Kiểm duyệt: ${currentChapter?.value?.title} - ${novelData?.value?.title ?? ''}`,
  meta: [{ name: 'description', content: 'Giao diện kiểm duyệt nội dung truyện tiểu thuyết' }]
})
</script>

<style scoped>
.highlight-guideline {
  text-decoration: underline;
  text-decoration-color: #4caf50; /* Màu xanh lá cho vấn đề hướng dẫn */
  text-decoration-thickness: 2px;
  padding: 1px 0;
  border-radius: 2px;
}
.highlight-manual {
  text-decoration: underline;
  text-decoration-color: #2196f3; /* Màu xanh dương cho vấn đề thủ công */
  text-decoration-thickness: 2px;
  padding: 1px 0;
  border-radius: 2px;
}
.highlight-low {
  text-decoration: underline;
  text-decoration-color: #ffeb3b; /* Màu vàng cho mức độ thấp */
  text-decoration-thickness: 2px;
  padding: 1px 0;
  border-radius: 2px;
}
.highlight-medium {
  text-decoration: underline;
  text-decoration-color: #ff9800; /* Màu cam cho mức độ trung bình */
  text-decoration-thickness: 2px;
  padding: 1px 0;
  border-radius: 2px;
}
.highlight-high {
  text-decoration: underline;
  text-decoration-color: #f44336; /* Màu đỏ cho mức độ cao */
  text-decoration-thickness: 2px;
  padding: 1px 0;
  border-radius: 2px;
}
.highlight-critical {
  text-decoration: underline;
  text-decoration-color: #d81b60; /* Màu hồng đậm cho mức độ nghiêm trọng */
  text-decoration-thickness: 2px;
  padding: 1px 0;
  border-radius: 2px;
}
.highlight-low {
  text-decoration: underline;
  text-decoration-color: #5edb5e;
  text-decoration-thickness: 2px;
  /* background-color: #00ff00; */
  padding: 1px 0;
  border-radius: 2px;
}
.highlight-medium {
  text-decoration: underline;
  text-decoration-color: yellow;
  text-decoration-thickness: 2px;
  /* background-color: yellow; */
  padding: 1px 0;
  border-radius: 2px;
}
.highlight-high {
  text-decoration: underline;
  text-decoration-color: orange;
  text-decoration-thickness: 2px;
  /* background-color: orange; */
  padding: 1px 0;
  border-radius: 2px;
}
.highlight-critical {
  text-decoration: underline;
  text-decoration-color: red;
  text-decoration-thickness: 2px;
  /* background-color: red; */
  padding: 1px 0;
  border-radius: 2px;
}
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

/* New CSS for search highlighting */
.search-highlight {
  background-color: #fce83a; /* A noticeable yellow */
  color: #333;
  padding: 1px 2px;
  border-radius: 2px;
}
.current-search-highlight {
  background-color: #ff9800; /* A more distinct orange for the current highlighted result */
  color: #fff;
  padding: 1px 2px;
  border-radius: 2px;
}
</style>

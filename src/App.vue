<template>
  <div class="app">
    <!-- 台词弹幕 -->
    <div class="danmaku-layer">
      <transition-group name="danmaku">
        <div
          v-for="d in danmakuList"
          :key="d.key"
          class="danmaku"
          :style="{ '--dcolor': d.color, animationDuration: d.duration, top: d.top }"
        >
          <span v-if="d.name" class="danmaku-name">{{ d.name }}：</span>{{ d.quote }}
        </div>
      </transition-group>
    </div>

    <!-- 入口 -->
    <section v-if="stage === 'home'" class="page home-page">
      <div class="scroll-card">
        <div class="scroll-top">
          <span class="seal">知</span>
          <h1 class="title">知否情商测试</h1>
          <p class="subtitle">你的情商风格像盛家哪位？</p>
        </div>
        <div class="scroll-body">
          <p class="desc">{{ intro.desc }}</p>
          <div class="tips">
            <p v-for="(t, i) in intro.tips" :key="i" class="tip">
              <span class="tip-dot"></span>{{ t }}
            </p>
          </div>
          <div class="mode-buttons">
            <button class="btn-mode primary" @click="startMode('full')">
              <span class="btn-title">开始测试 · 12 题</span>
              <span class="btn-sub">约 3 分钟 · 对照 8 位人物</span>
            </button>
          </div>
          <p class="footnote">娱乐向测试 · 非专业 EQ 量表 · 仅供玩梗互动</p>
        </div>
      </div>
    </section>

    <!-- 答题 -->
    <section v-else-if="stage === 'quiz'" class="page quiz-page">
      <div class="quiz-progress">
        <div class="progress-bar"><div class="progress-fill" :style="{ width: progress + '%' }"></div></div>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ questionList.length }}</span>
      </div>

      <transition name="slide" mode="out-in">
        <div class="scroll-card quiz-card" :key="currentIndex">
          <div class="scroll-top mini">
            <span class="q-badge">{{ currentIndex + 1 }}</span>
            <h2 class="q-title">{{ currentQuestion.q }}</h2>
          </div>
          <div class="scroll-body">
            <div class="poem">
              <span class="poem-who">{{ currentQuestion.who }} 邀你想一想</span>
              <span class="poem-text">「{{ currentQuestion.poem }}」</span>
            </div>
            <div class="options">
              <button v-for="(optText, oi) in currentQuestion.options" :key="oi" class="option" @click="selectAnswer(oi)">
                <span class="opt-label">{{ optionLabel(oi) }}</span>
                <span class="opt-text">{{ optText }}</span>
              </button>
            </div>
          </div>
        </div>
      </transition>

      <div class="quiz-nav">
        <button v-if="currentIndex > 0" class="btn-prev" @click="prevQuestion">← 上一题</button>
        <span v-else></span>
        <span v-if="answers[currentIndex]" class="answered-dot">已答</span>
      </div>
    </section>

    <!-- 匹配中 -->
    <section v-else-if="stage === 'matching'" class="page matching-page">
      <div class="scroll-card matching-card">
        <div class="matching-loader"><span class="dot d1"></span><span class="dot d2"></span><span class="dot d3"></span></div>
        <h2 class="matching-title">正在细读你的心思…</h2>
        <p class="matching-sub">对照 8 位人物，寻找与你最像的那一位</p>
      </div>
    </section>

    <!-- 结果 -->
    <section v-else class="page result-page">
      <div class="result-wrap">
        <!-- Top1 -->
        <div v-if="match" class="scroll-card result-hero">
          <div class="scroll-top">
            <span class="q-title center">{{ match.emoji }} {{ match.name }}</span>
          </div>
          <div class="scroll-body">
            <div v-if="matchInfo.badge" class="result-badge">🏆 {{ matchInfo.badge }}</div>
            <div class="result-tag">{{ match.style }}</div>
            <div class="result-score"><span class="score-num">{{ topPercent }}</span><span class="score-unit">% 契合</span></div>
            <p class="result-diff">你和 TA 有 {{ topDiff }} 题选得不一样</p>
            <p class="result-summary">{{ match.summary }}</p>
            <div class="result-meta">
              <span class="meta-chip">家世：{{ match.family }}</span>
            </div>
          </div>
        </div>

        <!-- 情商雷达 -->
        <div v-if="match" class="scroll-card">
          <div class="scroll-top"><h2 class="q-title center">你的情商雷达</h2></div>
          <div class="scroll-body">
            <div class="radar-wrap">
              <svg :viewBox="'0 0 260 260'" class="radar-svg">
                <!-- 网格 -->
                <polygon v-for="n in 5" :key="n" :points="gridPoints(n)" class="radar-grid" />
                <!-- 轴 -->
                <line
                  v-for="(dim, i) in radarDims"
                  :key="dim.key"
                  :x1="cx" :y1="cy"
                  :x2="point(i, 5, 0).x" :y2="point(i, 5, 0).y"
                  class="radar-axis"
                />
                <!-- 数据多边形 -->
                <polygon :points="radarPoints" class="radar-fill" :fill="match.color" />
                <!-- 顶点 -->
                <circle
                  v-for="(dim, i) in radarDims"
                  :key="dim.key"
                  :cx="point(i, match.radar[dim.key], 0).x"
                  :cy="point(i, match.radar[dim.key], 0).y"
                  r="3"
                  :fill="match.color"
                />
              </svg>
            </div>
            <div class="radar-labels">
              <span v-for="dim in radarDims" :key="dim.key" class="radar-label">
                {{ dim.label }} {{ match.radar[dim.key] }}
              </span>
            </div>
            <p class="radar-note">你的形状 ≈ {{ match.name }}——六维上你最像 TA，但你是你自己。</p>
          </div>
        </div>

        <!-- 低置信度 -->
        <div v-if="matchInfo.lowConfidence" class="scroll-card lowconf-card">
          <div class="scroll-top"><h2 class="q-title center">你谁都不像</h2></div>
          <div class="scroll-body">
            <p class="analysis-text">你的契合度低于 45%，可能只是答题太随机——也许你更像你自己。</p>
          </div>
        </div>

        <!-- 人物档案 -->
        <div v-if="match" class="scroll-card">
          <div class="scroll-top"><h2 class="q-title center">人物档案</h2></div>
          <div class="scroll-body">
            <h3 class="sec-title">家世底子</h3>
            <p class="analysis-text">{{ match.family }}</p>
            <h3 class="sec-title">情商画像</h3>
            <p class="analysis-text">{{ match.portrait }}</p>
            <h3 class="sec-title">强项</h3>
            <p class="analysis-text">{{ match.strengths }}</p>
            <h3 class="sec-title">盲点</h3>
            <p class="analysis-text">{{ match.blindspot }}</p>
            <h3 class="sec-title">建议</h3>
            <p class="analysis-text advice">{{ match.advice }}</p>
            <h3 class="sec-title">一句话</h3>
            <p class="analysis-text one-liner">{{ match.oneLiner }}</p>
          </div>
        </div>

        <!-- 8 人排行 -->
        <div class="scroll-card">
          <div class="scroll-top"><h2 class="q-title center">8 位人物契合度</h2></div>
          <div class="scroll-body">
            <div class="rank-list">
              <div v-for="(g, i) in ranked" :key="g.id" class="rank-item" :class="{ top: i === 0 }">
                <span class="rank-no">{{ i + 1 }}</span>
                <span class="rank-name" :style="{ color: guestColor(g.name) }">{{ g.name }}</span>
                <div class="rank-bar"><div class="rank-fill" :style="{ width: g.percent + '%', background: guestColor(g.name) }"></div></div>
                <span class="rank-percent">{{ g.percent }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 八人四对 -->
        <div class="scroll-card">
          <div class="scroll-top"><h2 class="q-title center">八人四对</h2></div>
          <div class="scroll-body">
            <div v-for="p in fourPairs" :key="p.a" class="pair-row">
              <span class="pair-names">{{ p.a }} × {{ p.b }}</span>
              <span class="pair-diff">{{ p.diff }}</span>
            </div>
          </div>
        </div>

        <!-- 参考文献 -->
        <div class="scroll-card">
          <div class="scroll-top"><h2 class="q-title center">参考文献</h2></div>
          <div class="scroll-body">
            <ol class="ref-list">
              <li v-for="(r, i) in references" :key="i">{{ r }}</li>
            </ol>
          </div>
        </div>

        <div class="result-actions">
          <button class="btn-restart" @click="goHome">再测一次</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { intro, questions } from './data/questions.js'
import { characters, radarDims, fourPairs, characterQuotes, sharedQuotes, references } from './data/results.js'
import { matchResult } from './logic/match.js'

const stage = ref('home')
const currentIndex = ref(0)
const answers = ref([])
let matchTimer = null

const questionList = questions
const currentQuestion = computed(() => questionList[currentIndex.value])
const progress = computed(() => (currentIndex.value / questionList.length) * 100)

const OPT_LABELS = ['A', 'B', 'C', 'D']
function optionLabel(oi) {
  return OPT_LABELS[oi] || ''
}

function startMode() {
  stage.value = 'quiz'
  currentIndex.value = 0
  answers.value = []
}

function selectAnswer(oi) {
  answers.value[currentIndex.value] = OPT_LABELS[oi]
  if (currentIndex.value < questionList.length - 1) {
    currentIndex.value++
  } else {
    stage.value = 'matching'
    matchTimer = setTimeout(showResult, 1400)
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) currentIndex.value--
}

function showResult() {
  stage.value = 'result'
}

const matchInfo = computed(() => matchResult(answers.value))
const ranked = computed(() => matchInfo.value.ranked)
const match = computed(() => {
  const t = matchInfo.value.top
  return characters.find((c) => c.name === t?.name) || null
})
const topPercent = computed(() => (matchInfo.value.top ? matchInfo.value.top.percent : 0))
const topDiff = computed(() => (matchInfo.value.top ? matchInfo.value.top.diff : 0))

function guestColor(name) {
  return characters.find((c) => c.name === name)?.color || '#5a6a8a'
}

function goHome() {
  clearTimeout(matchTimer)
  stage.value = 'home'
  currentIndex.value = 0
  answers.value = []
}

// ---------- 雷达图计算 ----------
const cx = 130
const cy = 130
const R = 100

function point(i, val, _padding = 0) {
  const angle = (Math.PI / 180) * (-90 + i * 60)
  const r = (val / 5) * R
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

function gridPoints(n) {
  const pts = []
  for (let i = 0; i < 6; i++) {
    const p = point(i, n, 0)
    pts.push(p.x + ',' + p.y)
  }
  return pts.join(' ')
}

const radarPoints = computed(() => {
  if (!match.value) return ''
  const pts = []
  for (let i = 0; i < 6; i++) {
    const dim = radarDims[i]
    const p = point(i, match.value.radar[dim.key], 0)
    pts.push(p.x + ',' + p.y)
  }
  return pts.join(' ')
})

// ---------- 台词弹幕 ----------
const danmakuList = ref([])
let danmakuTimer = null
let danmakuSeq = 0

function stopDanmaku() {
  clearTimeout(danmakuTimer)
  danmakuTimer = null
  danmakuList.value = []
}

function startDanmaku() {
  if (danmakuTimer) return
  const pool = []
  characterQuotes.forEach((c) => c.quotes.forEach((q) => pool.push({ name: c.name, color: c.color, quote: q })))
  sharedQuotes.forEach((q) => pool.push({ name: '', color: '#8a8aa0', quote: q }))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  let idx = 0
  function spawnOne() {
    const item = shuffled[idx % shuffled.length]
    const duration = (12 + Math.random() * 6).toFixed(1) + 's'
    const key = 'dm-' + danmakuSeq++
    const top = (70 + Math.random() * 22).toFixed(1) + '%'
    danmakuList.value.push({ key, name: item.name, color: item.color, quote: item.quote, duration, top })
    setTimeout(() => {
      danmakuList.value = danmakuList.value.filter((d) => d.key !== key)
    }, 18000)
    idx++
    danmakuTimer = setTimeout(spawnOne, 2600 + Math.random() * 1400)
  }
  spawnOne()
}

watch(stage, (s) => {
  if (s === 'quiz') startDanmaku()
  else stopDanmaku()
})

onMounted(() => {})
onBeforeUnmount(() => {
  clearTimeout(matchTimer)
  clearTimeout(danmakuTimer)
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'KaiTi', 'STKaiti', 'SimSun', serif;
  background:
    radial-gradient(900px 500px at 20% -10%, rgba(90, 106, 138, 0.12), transparent 60%),
    radial-gradient(800px 400px at 90% 10%, rgba(80, 120, 100, 0.1), transparent 55%),
    linear-gradient(180deg, #f0e9d8 0%, #e8e0cc 50%, #ece5d2 100%);
  background-attachment: fixed;
  color: #3a3a3a;
  padding: 28px 16px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page {
  width: 100%;
  max-width: 680px;
  position: relative;
  z-index: 1;
}

/* ---------- 卷轴卡片（青黛色调） ---------- */
.scroll-card {
  position: relative;
  background:
    radial-gradient(ellipse at top, rgba(90, 106, 138, 0.06), transparent 60%),
    linear-gradient(180deg, #f7f0df 0%, #f2ebd6 100%);
  border: 1px solid #b0a88a;
  border-radius: 6px;
  box-shadow:
    0 6px 24px rgba(60, 55, 40, 0.18),
    inset 0 0 40px rgba(90, 90, 60, 0.06);
  margin-bottom: 22px;
  overflow: hidden;
}
.scroll-card::before,
.scroll-card::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 18px;
  background: linear-gradient(90deg, #6a6a7a, #8a8a98);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.35);
}
.scroll-card::before { left: -9px; border-radius: 3px; }
.scroll-card::after { right: -9px; border-radius: 3px; }

.scroll-top {
  position: relative;
  text-align: center;
  padding: 22px 34px 6px;
  border-bottom: 2px solid #6a6a8a;
}
.scroll-top.mini {
  text-align: left;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 30px 14px;
  border-bottom: 1px solid #b0a88a;
}
.scroll-top.mini .q-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
}
.scroll-body {
  padding: 18px 30px 26px;
}

.seal {
  display: inline-block;
  width: 46px;
  height: 46px;
  line-height: 46px;
  border-radius: 6px;
  background: #5a6a8a;
  color: #f0e9d8;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(90, 106, 138, 0.4);
  font-family: 'KaiTi', 'STKaiti', serif;
}
.title {
  font-family: 'KaiTi', 'STKaiti', serif;
  font-size: 30px;
  font-weight: 700;
  color: #3a3a5a;
  margin: 0 0 4px;
  letter-spacing: 0.08em;
}
.subtitle {
  color: #6a6a80;
  font-size: 15px;
  margin: 0;
  letter-spacing: 0.1em;
}
.desc {
  text-align: center;
  color: #3a3a5a;
  font-size: 14px;
  margin: 0 0 16px;
}
.tips {
  background: rgba(90, 106, 138, 0.06);
  border: 1px solid #b0a88a;
  border-radius: 6px;
  padding: 12px 18px;
  margin-bottom: 20px;
}
.tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 13.5px;
  color: #5a5a6a;
  line-height: 1.6;
}
.tip:last-child { margin-bottom: 0; }
.tip-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5a6a8a;
  margin-top: 8px;
}

.mode-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.btn-mode {
  flex: 1;
  border: 1.5px solid #5a6a8a;
  border-radius: 6px;
  padding: 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  background: transparent;
}
.btn-mode.primary {
  background: linear-gradient(135deg, #5a6a8a, #7a8aa8);
  color: #f0e9d8;
}
.btn-mode:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(90, 106, 138, 0.25);
}
.btn-title {
  font-size: 17px;
  font-weight: 700;
  font-family: 'KaiTi', 'STKaiti', serif;
  letter-spacing: 0.04em;
}
.btn-sub {
  font-size: 12px;
  opacity: 0.85;
}
.footnote {
  text-align: center;
  font-size: 12px;
  color: #8a8a98;
  margin: 0;
}

/* ---------- 答题 ---------- */
.quiz-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.progress-bar {
  flex: 1;
  height: 7px;
  border-radius: 999px;
  background: rgba(90, 106, 138, 0.2);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #5a6a8a, #7a8aa8);
  transition: width 0.3s;
}
.progress-text {
  font-size: 13px;
  color: #5a5a6a;
  font-weight: 700;
}
.q-badge {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  background: linear-gradient(135deg, #5a6a8a, #7a8aa8);
  color: #f0e9d8;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'KaiTi', serif;
}
.q-title {
  color: #3a3a5a;
  font-weight: 700;
  margin: 0;
}
.q-title.center { text-align: center; }
.poem {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  padding: 8px 14px;
  background: rgba(90, 106, 138, 0.06);
  border-radius: 6px;
}
.poem-who { font-size: 12px; color: #7a6a5a; font-weight: 600; }
.poem-text { font-size: 13px; color: #5a6a8a; font-style: italic; font-family: 'KaiTi', serif; }
.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  padding: 13px 16px;
  border-radius: 6px;
  border: 1px solid #b0a88a;
  background: rgba(250, 247, 235, 0.6);
  cursor: pointer;
  font-size: 14.5px;
  color: #4a4a5a;
  line-height: 1.6;
  transition: all 0.18s;
  width: 100%;
}
.opt-label {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1.5px solid #5a6a8a;
  color: #5a6a8a;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  transition: all 0.18s;
}
.opt-text {
  flex: 1 1 auto;
  min-width: 0;
  word-break: break-word;
  padding-top: 2px;
}
@media (hover: hover) {
  .option:hover {
    border-color: #5a6a8a;
    background: rgba(90, 106, 138, 0.08);
  }
  .option:hover .opt-label {
    background: #5a6a8a;
    color: #f0e9d8;
  }
}
.option:active { transform: scale(0.99); }
.quiz-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}
.btn-prev {
  border: 1px solid #b0a88a;
  background: transparent;
  color: #5a5a6a;
  font-size: 13.5px;
  cursor: pointer;
  padding: 7px 14px;
  border-radius: 6px;
}
.btn-prev:hover { border-color: #5a6a8a; color: #5a6a8a; }
.answered-dot {
  font-size: 12px;
  color: #8a8a98;
  background: rgba(90, 106, 138, 0.1);
  padding: 4px 12px;
  border-radius: 999px;
}

/* ---------- 匹配中 ---------- */
.matching-page { margin-top: 12vh; }
.matching-card { text-align: center; padding: 50px 34px; }
.matching-loader { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
.dot { width: 13px; height: 13px; border-radius: 50%; background: #5a6a8a; animation: bounce 1s infinite ease-in-out; }
.dot.d2 { background: #7a8aa8; animation-delay: 0.15s; }
.dot.d3 { background: #5a8a6a; animation-delay: 0.3s; }
@keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.6; } 50% { transform: translateY(-10px); opacity: 1; } }
.matching-title { font-size: 19px; font-weight: 700; color: #3a3a5a; margin: 0 0 6px; font-family: 'KaiTi', serif; }
.matching-sub { font-size: 13.5px; color: #8a8a98; margin: 0; }

/* ---------- 结果 ---------- */
.result-wrap { margin-top: 2vh; }
.result-hero { text-align: center; }
.result-badge {
  display: inline-block;
  margin: 0 auto 12px;
  padding: 7px 16px;
  border-radius: 4px;
  background: linear-gradient(135deg, #b8860b, #daa520);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  box-shadow: 0 3px 10px rgba(184, 134, 11, 0.4);
}
.result-diff { color: #8a8a98; font-size: 13px; margin: 4px 0 12px; }
.lowconf-card { border-left: 3px solid #5a6a8a; }
.result-tag {
  display: inline-block;
  background: linear-gradient(135deg, #5a6a8a, #7a8aa8);
  color: #f0e9d8;
  font-size: 14px;
  padding: 6px 18px;
  border-radius: 4px;
  margin-bottom: 12px;
  letter-spacing: 0.06em;
}
.result-score { margin: 8px auto 12px; display: flex; align-items: baseline; justify-content: center; gap: 6px; }
.score-num { font-size: 44px; font-weight: 900; line-height: 1; color: #5a6a8a; }
.score-unit { font-size: 14px; font-weight: 700; color: #8a8a98; }
.result-summary {
  color: #4a4a5a;
  font-size: 15px;
  line-height: 1.9;
  max-width: 520px;
  margin: 0 auto 14px;
}
.result-meta { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; }
.meta-chip {
  font-size: 12.5px;
  color: #5a5a6a;
  background: rgba(90, 106, 138, 0.06);
  border: 1px solid #b0a88a;
  padding: 5px 12px;
  border-radius: 4px;
}

/* 雷达图 */
.radar-wrap { display: flex; justify-content: center; margin-bottom: 10px; }
.radar-svg { width: 260px; height: 260px; }
.radar-grid { fill: none; stroke: rgba(90, 106, 138, 0.2); stroke-width: 1; }
.radar-axis { stroke: rgba(90, 106, 138, 0.3); stroke-width: 1; }
.radar-fill { fill-opacity: 0.35; stroke: currentColor; stroke-width: 1.5; }
.radar-labels {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}
.radar-label {
  font-size: 12px;
  color: #5a5a6a;
  background: rgba(90, 106, 138, 0.08);
  padding: 3px 10px;
  border-radius: 999px;
}
.radar-note {
  text-align: center;
  font-size: 13px;
  color: #8a8a98;
  margin: 0;
}

.sec-title {
  color: #3a3a5a;
  font-size: 16px;
  font-weight: 700;
  margin: 18px 0 8px;
  padding-left: 10px;
  border-left: 3px solid #5a6a8a;
  font-family: 'KaiTi', serif;
}
.sec-title:first-child { margin-top: 0; }
.analysis-text {
  color: #4a4a5a;
  font-size: 14px;
  line-height: 1.9;
  margin: 0 0 8px;
}
.analysis-text.advice {
  color: #3a3a5a;
  font-weight: 700;
  background: rgba(90, 106, 138, 0.06);
  border-left: 3px solid #5a6a8a;
  padding: 10px 14px;
  border-radius: 4px;
}
.one-liner {
  font-weight: 700;
  font-size: 15px;
  color: #5a6a8a;
  background: rgba(90, 106, 138, 0.06);
  border-left: 3px solid #5a6a8a;
  padding: 12px 16px;
  border-radius: 4px;
}

/* 排行 */
.rank-list { display: flex; flex-direction: column; gap: 10px; }
.rank-item { display: flex; align-items: center; gap: 12px; }
.rank-item.top .rank-name { font-weight: 900; transform: scale(1.08); }
.rank-no {
  flex-shrink: 0;
  width: 24px; height: 24px;
  border-radius: 4px;
  background: rgba(90, 106, 138, 0.1);
  color: #5a5a6a;
  font-weight: 700;
  font-size: 12px;
  display: flex; align-items: center; justify-content: center;
}
.rank-item.top .rank-no { background: linear-gradient(135deg, #5a6a8a, #7a8aa8); color: #f0e9d8; }
.rank-name { flex-shrink: 0; width: 64px; font-size: 14px; font-weight: 700; }
.rank-bar { flex: 1; height: 12px; border-radius: 999px; background: rgba(90, 106, 138, 0.1); overflow: hidden; }
.rank-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
.rank-percent { flex-shrink: 0; width: 44px; text-align: right; font-size: 13px; font-weight: 700; color: #5a5a6a; }

/* 四对 */
.pair-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed #d0c8a8;
}
.pair-row:last-child { border-bottom: none; }
.pair-names { font-weight: 700; color: #3a3a5a; font-size: 14px; flex-shrink: 0; }
.pair-diff { color: #8a8a98; font-size: 13px; text-align: right; }

.ref-list { margin: 0; padding-left: 20px; color: #5a5a6a; font-size: 12.5px; line-height: 1.8; }
.result-actions { text-align: center; margin-top: 8px; }
.btn-restart {
  padding: 12px 36px;
  border: 1.5px solid #5a6a8a;
  border-radius: 6px;
  background: linear-gradient(135deg, #5a6a8a, #7a8aa8);
  color: #f0e9d8;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(90, 106, 138, 0.25);
  transition: transform 0.2s;
  font-family: 'KaiTi', serif;
}
.btn-restart:hover { transform: translateY(-2px); }

/* ---------- 弹幕 ---------- */
.danmaku-layer {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none; z-index: 0; overflow: hidden;
}
.danmaku {
  position: absolute; left: 0;
  transform: translateX(-110%);
  white-space: nowrap;
  font-size: 14px; font-weight: 600;
  color: var(--dcolor, #5a6a8a);
  background: rgba(250, 247, 235, 0.88);
  border: 1.5px solid var(--dcolor, #5a6a8a);
  padding: 6px 14px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(60, 55, 40, 0.12);
  opacity: 0.88;
  animation: danmaku-move linear forwards;
}
.danmaku-name { font-weight: 800; }
@keyframes danmaku-move {
  from { transform: translateX(-110%); }
  to { transform: translateX(calc(100vw + 60px)); }
}
.danmaku-enter-active, .danmaku-leave-active { transition: all 0.3s ease; }
.danmaku-leave-to { opacity: 0; transform: scale(0.8); }

/* transition */
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateX(24px); }

@media (max-width: 560px) {
  .app { padding: 18px 12px 48px; }
  .scroll-body { padding: 16px 20px 22px; }
  .scroll-top { padding: 18px 22px 6px; }
  .scroll-top.mini { padding: 14px 20px 12px; }
  .title { font-size: 24px; }
  .danmaku { font-size: 12px; padding: 5px 10px; }
  .radar-svg { width: 200px; height: 200px; }
}
</style>

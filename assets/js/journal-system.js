(function () {
  "use strict";

  const TASKS_CSV = "assets/data/journal_tasks.csv";
  const RECORDS_CSV = "assets/data/journal_records.csv";

  const moodText = {
    1: "很糟",
    2: "低落",
    3: "普通",
    4: "不错",
    5: "很好"
  };

  const energyText = {
    1: "很低",
    2: "偏低",
    3: "一般",
    4: "不错",
    5: "很足"
  };

  const $ = function (id) {
    return document.getElementById(id);
  };

  let state = {
    tasks: {},
    records: []
  };

  let activeDate = "2026-07-02";
  let currentMonth = new Date(2026, 6, 1);

  let timer = {
    interval: null,
    remaining: 25 * 60,
    running: false
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  async function init() {
    renderShell();
    bindEvents();
    resetTimer();
    await loadCSVData();
  }

  function renderShell() {
    const root = $("sx-journal-root");
    if (!root) return;

    root.className = "sx-journal-app";

    root.innerHTML = `
      <section class="sx-journal-hero">
        <h1>日志</h1>
        <p>
          这里不再只是普通文章列表，而是一个更贴近日常使用的个人日志系统。
          它可以记录每天要做什么、今天完成了什么、最近生活状态如何，
          也可以把心情变化保存下来，形成属于自己的时间轨迹。
        </p>
        <p>
          当前版本使用 CSV 表格作为数据源。你只需要修改
          <code>assets/data/journal_tasks.csv</code> 和
          <code>assets/data/journal_records.csv</code>，然后重新预览、提交、发布即可。
        </p>
        <p id="sx-sync-status" class="sx-sync-status">正在读取 CSV 表格...</p>
      </section>

      <section class="sx-top-grid">
        <div class="sx-panel sx-task-panel">
          <div class="sx-panel-head">
            <div>
              <p class="sx-eyebrow">DAILY TASKS</p>
              <h2>每日任务</h2>
              <p id="sx-task-date" class="sx-subtitle">今日任务</p>
            </div>
            <a class="sx-panel-link" href="#sx-month-plan">月计划总览 →</a>
          </div>

          <div class="sx-task-input-row">
            <input id="sx-selected-date" type="date">
            <button id="sx-reload-data" type="button">重新读取</button>
          </div>

          <ul id="sx-task-list" class="sx-task-list"></ul>

          <div class="sx-task-actions">
            <span>任务是否完成由 <code>journal_tasks.csv</code> 中的 <code>done</code> 列控制。</span>
          </div>
        </div>

        <div class="sx-panel sx-countdown-panel">
          <p class="sx-eyebrow">COUNTDOWN</p>
          <h2>倒计时</h2>

          <label class="sx-label" for="sx-timer-title">倒计时名称</label>
          <input id="sx-timer-title" type="text" value="专注一会儿">

          <label class="sx-label" for="sx-timer-minutes">分钟数</label>
          <input id="sx-timer-minutes" type="number" min="1" max="999" value="25">

          <div id="sx-timer-display" class="sx-timer-display">25:00</div>

          <div class="sx-timer-actions">
            <button id="sx-start-timer" type="button">开始</button>
            <button id="sx-pause-timer" type="button">暂停</button>
            <button id="sx-reset-timer" type="button">重置</button>
          </div>

          <p class="sx-timer-tip">适合用来计时学习、写报告、整理博客或者休息。</p>
        </div>
      </section>

      <section class="sx-panel sx-record-panel">
        <div class="sx-panel-head">
          <div>
            <p class="sx-eyebrow">RECENT RECORDS</p>
            <h2>最近记录</h2>
            <p class="sx-subtitle">
              这里会自动读取 <code>journal_records.csv</code>，展示最近的生活记录、心情和精力。
            </p>
          </div>
        </div>

        <div id="sx-record-list" class="sx-record-list"></div>
      </section>

      <section class="sx-panel sx-mood-panel">
        <div class="sx-panel-head">
          <div>
            <p class="sx-eyebrow">MOOD DASHBOARD</p>
            <h2>当前心情与状态</h2>
            <p class="sx-subtitle">根据 CSV 记录自动生成心情热力图、波动曲线和状态概览。</p>
          </div>
        </div>

        <div class="sx-status-grid">
          <div class="sx-status-card">
            <span>最近心情</span>
            <strong id="sx-latest-mood">暂无</strong>
            <small id="sx-latest-date">还没有记录</small>
          </div>

          <div class="sx-status-card">
            <span>平均心情</span>
            <strong id="sx-average-mood">0 / 5</strong>
            <small>基于 CSV 记录</small>
          </div>

          <div class="sx-status-card">
            <span>连续记录</span>
            <strong id="sx-streak-days">0 天</strong>
            <small>从最近记录往前连续</small>
          </div>

          <div class="sx-status-card">
            <span>累计记录</span>
            <strong id="sx-total-days">0 天</strong>
            <small>长期看才有波动</small>
          </div>
        </div>

        <h3>心情热力图</h3>
        <div id="sx-mood-heatmap" class="sx-mood-heatmap"></div>

        <div class="sx-mood-legend">
          <span>未记录</span>
          <i class="mood-0"></i>
          <i class="mood-1"></i>
          <i class="mood-2"></i>
          <i class="mood-3"></i>
          <i class="mood-4"></i>
          <i class="mood-5"></i>
          <span>心情高</span>
        </div>

        <h3>心情波动线</h3>
        <div id="sx-mood-line" class="sx-mood-line"></div>
      </section>

      <section id="sx-month-plan" class="sx-panel sx-month-panel">
        <div class="sx-panel-head">
          <div>
            <p class="sx-eyebrow">MONTH PLAN</p>
            <h2>月计划总览</h2>
            <p class="sx-subtitle">这里会按月份显示 CSV 里每天设置过的任务。</p>
          </div>

          <div class="sx-month-actions">
            <button id="sx-prev-month" type="button">‹</button>
            <strong id="sx-month-title">月份</strong>
            <button id="sx-next-month" type="button">›</button>
          </div>
        </div>

        <div class="sx-week-head">
          <span>一</span>
          <span>二</span>
          <span>三</span>
          <span>四</span>
          <span>五</span>
          <span>六</span>
          <span>日</span>
        </div>

        <div id="sx-month-calendar" class="sx-month-calendar"></div>
      </section>
    `;
  }

  function bindEvents() {
    const reloadBtn = $("sx-reload-data");
    const selectedDate = $("sx-selected-date");

    if (reloadBtn) {
      reloadBtn.addEventListener("click", async function () {
        await loadCSVData();
      });
    }

    if (selectedDate) {
      selectedDate.addEventListener("change", function () {
        if (this.value) {
          activeDate = this.value;
          currentMonth = parseDate(activeDate);
          renderAll();
        }
      });
    }

    $("sx-timer-minutes").addEventListener("change", resetTimer);
    $("sx-start-timer").addEventListener("click", startTimer);
    $("sx-pause-timer").addEventListener("click", pauseTimer);
    $("sx-reset-timer").addEventListener("click", resetTimer);

    $("sx-prev-month").addEventListener("click", function () {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      renderMonthCalendar();
    });

    $("sx-next-month").addEventListener("click", function () {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      renderMonthCalendar();
    });
  }

  async function loadCSVData() {
    setSyncText("正在读取 CSV 表格...");

    try {
      const taskText = await fetchCSV(TASKS_CSV);
      const recordText = await fetchCSV(RECORDS_CSV);

      const taskRows = parseCSV(taskText);
      const recordRows = parseCSV(recordText);

      state.tasks = buildTasks(taskRows);
      state.records = buildRecords(recordRows);

      const latestDate = getLatestDateFromData();

      if (latestDate) {
        activeDate = latestDate;
      } else {
        activeDate = todayString();
      }

      currentMonth = parseDate(activeDate);

      const selectedDate = $("sx-selected-date");
      if (selectedDate) {
        selectedDate.value = activeDate;
      }

      renderAll();

      setSyncText(
        "已读取 CSV 表格数据：任务 " +
          countTasks() +
          " 条，记录 " +
          state.records.length +
          " 条。"
      );
    } catch (error) {
      console.error(error);

      state.tasks = {};
      state.records = [];
      activeDate = todayString();
      currentMonth = parseDate(activeDate);

      const selectedDate = $("sx-selected-date");
      if (selectedDate) {
        selectedDate.value = activeDate;
      }

      renderAll();
      setSyncText("CSV 读取失败，请检查 assets/data 目录、文件名和 CSV 内容。");
    }
  }

  async function fetchCSV(path) {
    const response = await fetch(path + "?v=" + Date.now(), {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("无法读取文件：" + path);
    }

    return await response.text();
  }

  function parseCSV(text) {
    const source = String(text || "").replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let value = "";
    let inQuotes = false;

    for (let i = 0; i < source.length; i++) {
      const char = source[i];
      const next = source[i + 1];

      if (char === '"' && inQuotes && next === '"') {
        value += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(value.trim());
        value = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") {
          i++;
        }

        row.push(value.trim());

        if (row.some(function (item) { return item !== ""; })) {
          rows.push(row);
        }

        row = [];
        value = "";
      } else {
        value += char;
      }
    }

    row.push(value.trim());

    if (row.some(function (item) { return item !== ""; })) {
      rows.push(row);
    }

    if (rows.length < 2) return [];

    const headers = rows[0].map(function (item) {
      return item.trim();
    });

    return rows.slice(1).map(function (items) {
      const obj = {};

      headers.forEach(function (header, index) {
        obj[header] = items[index] ? items[index].trim() : "";
      });

      return obj;
    });
  }

  function buildTasks(rows) {
    const result = {};

    rows.forEach(function (row) {
      const date = normalizeDate(row.date);
      const text = row.text || "";
      const done = normalizeBoolean(row.done);

      if (!date || !text) return;

      if (!result[date]) {
        result[date] = [];
      }

      result[date].push({
        id: date + "-" + result[date].length,
        date: date,
        text: text,
        done: done
      });
    });

    return result;
  }

  function buildRecords(rows) {
    return rows
      .map(function (row, index) {
        const date = normalizeDate(row.date);

        if (!date) return null;

        return {
          id: "record-" + index,
          date: date,
          title: row.title || "没有标题的一天",
          mood: clampNumber(row.mood, 1, 5, 3),
          energy: clampNumber(row.energy, 1, 5, 3),
          tags: parseTags(row.tags),
          content: row.content || ""
        };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return b.date.localeCompare(a.date);
      });
  }

  function parseTags(value) {
    if (!value) return [];

    return String(value)
      .split("|")
      .map(function (tag) {
        return tag.trim();
      })
      .filter(Boolean);
  }

  function normalizeBoolean(value) {
    const text = String(value || "").trim().toLowerCase();

    return (
      text === "true" ||
      text === "yes" ||
      text === "1" ||
      text === "完成" ||
      text === "已完成"
    );
  }

  function normalizeDate(value) {
    const text = String(value || "").trim();

    if (!text) return "";

    const parts = text.replace(/\//g, "-").split("-");

    if (parts.length < 3) return "";

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (!year || !month || !day) return "";

    return (
      String(year).padStart(4, "0") +
      "-" +
      String(month).padStart(2, "0") +
      "-" +
      String(day).padStart(2, "0")
    );
  }

  function clampNumber(value, min, max, fallback) {
    const num = Number(value);

    if (!Number.isFinite(num)) return fallback;

    return Math.max(min, Math.min(max, num));
  }

  function getLatestDateFromData() {
    const dates = new Set();

    Object.keys(state.tasks).forEach(function (date) {
      dates.add(date);
    });

    state.records.forEach(function (record) {
      dates.add(record.date);
    });

    return Array.from(dates).sort().pop() || "";
  }

  function countTasks() {
    return Object.keys(state.tasks).reduce(function (sum, date) {
      return sum + state.tasks[date].length;
    }, 0);
  }

  function renderAll() {
    renderTasks();
    renderRecords();
    renderMoodDashboard();
    renderMonthCalendar();
  }

  function renderTasks() {
    const list = $("sx-task-list");
    const taskDate = $("sx-task-date");

    if (taskDate) {
      taskDate.textContent = getChineseDate(activeDate);
    }

    const tasks = state.tasks[activeDate] || [];

    if (!tasks.length) {
      list.innerHTML = `
        <li class="sx-empty-task">
          这一天还没有任务。请在 <code>journal_tasks.csv</code> 里添加对应日期。
        </li>
      `;
      return;
    }

    list.innerHTML = tasks
      .map(function (task) {
        return `
          <li class="sx-task-item ${task.done ? "is-done" : ""}">
            <label>
              <input type="checkbox" ${task.done ? "checked" : ""} disabled>
              <span>${escapeHTML(task.text)}</span>
            </label>
          </li>
        `;
      })
      .join("");
  }

  function renderRecords() {
    const container = $("sx-record-list");
    const records = state.records.slice(0, 8);

    if (!records.length) {
      container.innerHTML = `
        <div class="sx-empty-record">
          暂时还没有记录。请在 <code>journal_records.csv</code> 里添加内容。
        </div>
      `;
      return;
    }

    container.innerHTML = records
      .map(function (record) {
        const tags = record.tags.length
          ? record.tags
              .map(function (tag) {
                return `<span>${escapeHTML(tag)}</span>`;
              })
              .join("")
          : "<span>未分类</span>";

        return `
          <article class="sx-record-card">
            <time>${escapeHTML(record.date)}</time>
            <h3>${escapeHTML(record.title)}</h3>
            <p>心情：${moodText[record.mood]} ｜ 精力：${energyText[record.energy]}</p>
            ${
              record.content
                ? `<div class="sx-record-content">${escapeHTML(record.content)}</div>`
                : ""
            }
            <div class="sx-record-tags">${tags}</div>
          </article>
        `;
      })
      .join("");
  }

  function getLatestRecordByDate() {
    const result = {};

    state.records
      .slice()
      .reverse()
      .forEach(function (record) {
        result[record.date] = record;
      });

    return result;
  }

  function renderMoodDashboard() {
    const recordsByDate = getLatestRecordByDate();
    const dates = Object.keys(recordsByDate).sort();

    if (!dates.length) {
      $("sx-latest-mood").textContent = "暂无";
      $("sx-latest-date").textContent = "还没有记录";
      $("sx-average-mood").textContent = "0 / 5";
      $("sx-streak-days").textContent = "0 天";
      $("sx-total-days").textContent = "0 天";

      renderMoodHeatmap(recordsByDate);
      renderMoodLine(recordsByDate);
      return;
    }

    const latestDate = dates[dates.length - 1];
    const latestRecord = recordsByDate[latestDate];

    const totalMood = dates.reduce(function (sum, date) {
      return sum + Number(recordsByDate[date].mood);
    }, 0);

    const averageMood = totalMood / dates.length;

    $("sx-latest-mood").textContent = moodText[latestRecord.mood];
    $("sx-latest-date").textContent = latestDate;
    $("sx-average-mood").textContent = averageMood.toFixed(1) + " / 5";
    $("sx-streak-days").textContent =
      calculateStreak(recordsByDate, latestDate) + " 天";
    $("sx-total-days").textContent = dates.length + " 天";

    renderMoodHeatmap(recordsByDate);
    renderMoodLine(recordsByDate);
  }

  function calculateStreak(recordsByDate, startDate) {
    let count = 0;
    const cursor = parseDate(startDate);

    while (true) {
      const date = formatDate(cursor);

      if (!recordsByDate[date]) break;

      count++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return count;
  }

  function renderMoodHeatmap(recordsByDate) {
    const container = $("sx-mood-heatmap");
    const base = activeDate ? parseDate(activeDate) : new Date();
    const year = base.getFullYear();

    let html = "";

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      const mondayIndex = firstDay === 0 ? 6 : firstDay - 1;

      html += `<div class="sx-heat-month">`;
      html += `<div class="sx-heat-title">${month + 1}月</div>`;
      html += `<div class="sx-heat-grid">`;

      for (let blank = 0; blank < mondayIndex; blank++) {
        html += `<span class="sx-heat-cell is-empty"></span>`;
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const date =
          year +
          "-" +
          String(month + 1).padStart(2, "0") +
          "-" +
          String(day).padStart(2, "0");

        const record = recordsByDate[date];
        const mood = record ? Number(record.mood) : 0;
        const title = record ? date + "：" + moodText[mood] : date + "：未记录";

        html += `<span class="sx-heat-cell mood-${mood}" title="${escapeHTML(
          title
        )}"></span>`;
      }

      html += `</div>`;
      html += `</div>`;
    }

    container.innerHTML = html;
  }

  function renderMoodLine(recordsByDate) {
    const container = $("sx-mood-line");
    const dates = Object.keys(recordsByDate).sort().slice(-14);

    if (dates.length < 2) {
      container.innerHTML = `<div class="sx-empty-chart">记录至少两天后，会显示心情波动线。</div>`;
      return;
    }

    const width = 820;
    const height = 230;
    const paddingLeft = 44;
    const paddingRight = 28;
    const paddingTop = 28;
    const paddingBottom = 42;

    const usableWidth = width - paddingLeft - paddingRight;
    const usableHeight = height - paddingTop - paddingBottom;
    const xStep = usableWidth / Math.max(dates.length - 1, 1);

    const points = dates.map(function (date, index) {
      const mood = Number(recordsByDate[date].mood);
      const x = paddingLeft + index * xStep;
      const y = paddingTop + ((5 - mood) / 4) * usableHeight;

      return { date, mood, x, y };
    });

    const path = points
      .map(function (point, index) {
        return (index === 0 ? "M" : "L") + " " + point.x + " " + point.y;
      })
      .join(" ");

    const gridLines = [1, 2, 3, 4, 5]
      .map(function (level) {
        const y = paddingTop + ((5 - level) / 4) * usableHeight;

        return `
          <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" class="sx-chart-grid"></line>
          <text x="18" y="${y + 4}" class="sx-chart-y">${level}</text>
        `;
      })
      .join("");

    const circles = points
      .map(function (point) {
        return `
          <circle cx="${point.x}" cy="${point.y}" r="5.5" class="sx-line-dot mood-${point.mood}">
            <title>${point.date}：${moodText[point.mood]}</title>
          </circle>
        `;
      })
      .join("");

    const labels = points
      .map(function (point, index) {
        if (dates.length > 8 && index % 2 !== 0) return "";

        return `<text x="${point.x}" y="${height - 12}" text-anchor="middle" class="sx-chart-x">${point.date.slice(
          5
        )}</text>`;
      })
      .join("");

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="心情波动线">
        ${gridLines}
        <path d="${path}" class="sx-line-path"></path>
        ${circles}
        ${labels}
      </svg>
    `;
  }

  function renderMonthCalendar() {
    const container = $("sx-month-calendar");
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    $("sx-month-title").textContent = year + "年" + (month + 1) + "月";

    const firstDay = new Date(year, month, 1).getDay();
    const mondayIndex = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const recordsByDate = getLatestRecordByDate();

    let html = "";

    for (let i = 0; i < mondayIndex; i++) {
      html += `<div class="sx-month-day is-blank"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date =
        year +
        "-" +
        String(month + 1).padStart(2, "0") +
        "-" +
        String(day).padStart(2, "0");

      const tasks = state.tasks[date] || [];
      const record = recordsByDate[date];
      const isActive = date === activeDate;

      const tasksHTML = tasks.length
        ? tasks
            .slice(0, 5)
            .map(function (task) {
              return `<li class="${task.done ? "is-done" : ""}">${escapeHTML(
                task.text
              )}</li>`;
            })
            .join("")
        : `<li class="is-muted">暂无任务</li>`;

      const moodHTML = record
        ? `<span class="sx-day-mood mood-${record.mood}">${moodText[record.mood]}</span>`
        : "";

      html += `
        <div class="sx-month-day ${isActive ? "is-today" : ""}">
          <div class="sx-day-top">
            <strong>${day}</strong>
            ${moodHTML}
          </div>
          <ul>${tasksHTML}</ul>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function getTimerMinutes() {
    const value = Number($("sx-timer-minutes").value);

    if (!Number.isFinite(value) || value < 1) return 25;
    if (value > 999) return 999;

    return Math.floor(value);
  }

  function startTimer() {
    if (timer.running) return;

    if (timer.remaining <= 0) {
      timer.remaining = getTimerMinutes() * 60;
    }

    timer.running = true;

    timer.interval = window.setInterval(function () {
      timer.remaining--;

      if (timer.remaining <= 0) {
        timer.remaining = 0;
        renderTimer();
        pauseTimer();
        window.alert("倒计时结束了。");
        return;
      }

      renderTimer();
    }, 1000);
  }

  function pauseTimer() {
    timer.running = false;

    if (timer.interval) {
      window.clearInterval(timer.interval);
      timer.interval = null;
    }

    renderTimer();
  }

  function resetTimer() {
    pauseTimer();
    timer.remaining = getTimerMinutes() * 60;
    renderTimer();
  }

  function renderTimer() {
    const minutes = Math.floor(timer.remaining / 60);
    const seconds = timer.remaining % 60;

    $("sx-timer-display").textContent =
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0");
  }

  function setSyncText(text) {
    const el = $("sx-sync-status");
    if (el) el.textContent = text;
  }

  function todayString() {
    return formatDate(new Date());
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
  }

  function parseDate(dateString) {
    const safe = normalizeDate(dateString) || "2026-07-02";
    const parts = safe.split("-").map(Number);

    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function getChineseDate(dateString) {
    const date = parseDate(dateString);
    const week = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];

    return dateString + " 周" + week;
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
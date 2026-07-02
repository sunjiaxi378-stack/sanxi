(function () {
  "use strict";

  const STORAGE_KEY = "sanxi-journal-system-v3";

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

  let state = loadState();
  let currentMonth = new Date();

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

  function init() {
    renderShell();
    setTodayUI();
    bindEvents();
    resetTimer();
    renderAll();
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
          这个页面主要分成四个部分：每日任务、倒计时、最近记录、心情状态。
          任务和记录会保存在当前浏览器中，刷新页面不会消失。
        </p>
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
            <input id="sx-task-input" type="text" placeholder="写下今天要完成的事情，例如：下午写一点博客">
            <button id="sx-add-task-btn" type="button">添加</button>
          </div>

          <ul id="sx-task-list" class="sx-task-list"></ul>

          <div class="sx-task-actions">
            <button id="sx-clear-done-btn" type="button">清除已完成</button>
            <span>完成后可以打勾，任务会自动划去并保存。</span>
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
            <p class="sx-subtitle">记录今天做了什么，也记录当时的心情和精力。</p>
          </div>

          <div class="sx-data-actions">
            <button id="sx-export-data" type="button">导出数据</button>
            <button id="sx-import-data-btn" type="button">导入数据</button>
            <input id="sx-import-data" type="file" accept="application/json" hidden>
          </div>
        </div>

        <div class="sx-record-layout">
          <form id="sx-record-form" class="sx-record-form">
            <label class="sx-label" for="sx-record-date">日期</label>
            <input id="sx-record-date" type="date">

            <label class="sx-label" for="sx-record-title">标题</label>
            <input id="sx-record-title" type="text" placeholder="例如：暑假正式开始了">

            <div class="sx-two-cols">
              <div>
                <label class="sx-label" for="sx-record-mood">心情</label>
                <select id="sx-record-mood">
                  <option value="1">1 很糟</option>
                  <option value="2">2 低落</option>
                  <option value="3" selected>3 普通</option>
                  <option value="4">4 不错</option>
                  <option value="5">5 很好</option>
                </select>
              </div>

              <div>
                <label class="sx-label" for="sx-record-energy">精力</label>
                <select id="sx-record-energy">
                  <option value="1">1 很低</option>
                  <option value="2">2 偏低</option>
                  <option value="3" selected>3 一般</option>
                  <option value="4">4 不错</option>
                  <option value="5">5 很足</option>
                </select>
              </div>
            </div>

            <label class="sx-label" for="sx-record-tags">标签</label>
            <input id="sx-record-tags" type="text" placeholder="例如：学习 疲惫 博客">

            <label class="sx-label" for="sx-record-content">具体记录</label>
            <textarea id="sx-record-content" rows="5" placeholder="今天发生了什么？做了什么？有什么感受？"></textarea>

            <button class="sx-save-record" type="submit">保存今天记录</button>
          </form>

          <div id="sx-record-list" class="sx-record-list"></div>
        </div>
      </section>

      <section class="sx-panel sx-mood-panel">
        <div class="sx-panel-head">
          <div>
            <p class="sx-eyebrow">MOOD DASHBOARD</p>
            <h2>当前心情与状态</h2>
            <p class="sx-subtitle">根据最近记录自动生成心情热力图、波动曲线和状态概览。</p>
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
            <small>基于已保存记录</small>
          </div>

          <div class="sx-status-card">
            <span>连续记录</span>
            <strong id="sx-streak-days">0 天</strong>
            <small>从今天往前连续</small>
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
            <p class="sx-subtitle">这里会按月份显示你每天设置过的任务。</p>
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

  function defaultState() {
    return {
      tasks: {},
      records: []
    };
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();

      const data = JSON.parse(raw);

      return {
        tasks: data.tasks && typeof data.tasks === "object" ? data.tasks : {},
        records: Array.isArray(data.records) ? data.records : []
      };
    } catch (error) {
      console.warn("日志系统数据读取失败，已重置为空数据。", error);
      return defaultState();
    }
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function todayString() {
    return formatDate(new Date());
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseDate(dateString) {
    const parts = String(dateString).split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function getChineseDate(dateString) {
    const date = parseDate(dateString);
    const week = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
    return `${dateString} 周${week}`;
  }

  function setTodayUI() {
    const today = todayString();

    const taskDate = $("sx-task-date");
    if (taskDate) taskDate.textContent = getChineseDate(today);

    const recordDate = $("sx-record-date");
    if (recordDate) recordDate.value = today;
  }

  function bindEvents() {
    $("sx-add-task-btn").addEventListener("click", addTask);

    $("sx-task-input").addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        addTask();
      }
    });

    $("sx-clear-done-btn").addEventListener("click", clearDoneTasks);

    $("sx-timer-minutes").addEventListener("change", resetTimer);
    $("sx-start-timer").addEventListener("click", startTimer);
    $("sx-pause-timer").addEventListener("click", pauseTimer);
    $("sx-reset-timer").addEventListener("click", resetTimer);

    $("sx-record-form").addEventListener("submit", saveRecord);

    $("sx-prev-month").addEventListener("click", function () {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      renderMonthCalendar();
    });

    $("sx-next-month").addEventListener("click", function () {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      renderMonthCalendar();
    });

    $("sx-export-data").addEventListener("click", exportData);

    $("sx-import-data-btn").addEventListener("click", function () {
      $("sx-import-data").click();
    });

    $("sx-import-data").addEventListener("change", importData);
  }

  function renderAll() {
    renderTasks();
    renderRecords();
    renderMoodDashboard();
    renderMonthCalendar();
  }

  function getTasksByDate(dateString) {
    if (!state.tasks[dateString]) {
      state.tasks[dateString] = [];
    }
    return state.tasks[dateString];
  }

  function getTodayTasks() {
    return getTasksByDate(todayString());
  }

  function addTask() {
    const input = $("sx-task-input");
    const text = input.value.trim();

    if (!text) return;

    const today = todayString();

    state.tasks[today].push({
      id: String(Date.now()),
      text: text,
      done: false,
      createdAt: new Date().toISOString()
    });

    input.value = "";

    saveState();
    renderTasks();
    renderMonthCalendar();
  }

  function renderTasks() {
    const list = $("sx-task-list");
    const tasks = getTodayTasks();

    if (!tasks.length) {
      list.innerHTML = `
        <li class="sx-empty-task">
          今天还没有任务。先写下一件最想完成的小事。
        </li>
      `;
      return;
    }

    list.innerHTML = tasks
      .map(function (task) {
        return `
          <li class="sx-task-item ${task.done ? "is-done" : ""}" data-id="${escapeHTML(task.id)}">
            <label>
              <input type="checkbox" ${task.done ? "checked" : ""}>
              <span>${escapeHTML(task.text)}</span>
            </label>
            <button type="button" class="sx-delete-task">×</button>
          </li>
        `;
      })
      .join("");

    list.querySelectorAll(".sx-task-item").forEach(function (item) {
      const id = item.getAttribute("data-id");

      item.querySelector("input").addEventListener("change", function () {
        toggleTask(id);
      });

      item.querySelector(".sx-delete-task").addEventListener("click", function () {
        deleteTask(id);
      });
    });
  }

  function toggleTask(id) {
    const task = getTodayTasks().find(function (item) {
      return item.id === id;
    });

    if (!task) return;

    task.done = !task.done;

    saveState();
    renderTasks();
    renderMonthCalendar();
  }

  function deleteTask(id) {
    const today = todayString();

    state.tasks[today] = getTodayTasks().filter(function (item) {
      return item.id !== id;
    });

    saveState();
    renderTasks();
    renderMonthCalendar();
  }

  function clearDoneTasks() {
    const today = todayString();

    state.tasks[today] = getTodayTasks().filter(function (item) {
      return !item.done;
    });

    saveState();
    renderTasks();
    renderMonthCalendar();
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
      timer.remaining -= 1;

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
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function saveRecord(event) {
    event.preventDefault();

    const date = $("sx-record-date").value || todayString();
    const title = $("sx-record-title").value.trim() || "没有标题的一天";
    const mood = Number($("sx-record-mood").value);
    const energy = Number($("sx-record-energy").value);
    const content = $("sx-record-content").value.trim();
    const tagsText = $("sx-record-tags").value.trim();

    const tags = tagsText
      .split(/[\s,，、]+/)
      .map(function (tag) {
        return tag.trim();
      })
      .filter(Boolean);

    state.records.push({
      id: String(Date.now()),
      date: date,
      title: title,
      mood: mood,
      energy: energy,
      tags: tags,
      content: content,
      createdAt: new Date().toISOString()
    });

    state.records.sort(function (a, b) {
      if (a.date === b.date) {
        return String(b.createdAt).localeCompare(String(a.createdAt));
      }
      return String(b.date).localeCompare(String(a.date));
    });

    $("sx-record-title").value = "";
    $("sx-record-tags").value = "";
    $("sx-record-content").value = "";

    saveState();
    renderRecords();
    renderMoodDashboard();
    renderMonthCalendar();
  }

  function renderRecords() {
    const container = $("sx-record-list");
    const records = state.records.slice(0, 8);

    if (!records.length) {
      container.innerHTML = `
        <div class="sx-empty-record">
          暂时还没有记录。保存一次今日记录后，这里会出现卡片。
        </div>
      `;
      return;
    }

    container.innerHTML = records
      .map(function (record) {
        const tags = record.tags.length
          ? record.tags.map(function (tag) {
              return `<span>${escapeHTML(tag)}</span>`;
            }).join("")
          : "<span>未分类</span>";

        return `
          <article class="sx-record-card">
            <time>${escapeHTML(record.date)}</time>
            <h3>${escapeHTML(record.title)}</h3>
            <p>心情：${moodText[record.mood]} ｜ 精力：${energyText[record.energy]}</p>
            ${record.content ? `<div class="sx-record-content">${escapeHTML(record.content)}</div>` : ""}
            <div class="sx-record-tags">${tags}</div>
            <button type="button" class="sx-delete-record" data-id="${escapeHTML(record.id)}">删除</button>
          </article>
        `;
      })
      .join("");

    container.querySelectorAll(".sx-delete-record").forEach(function (button) {
      button.addEventListener("click", function () {
        deleteRecord(button.getAttribute("data-id"));
      });
    });
  }

  function deleteRecord(id) {
    state.records = state.records.filter(function (record) {
      return record.id !== id;
    });

    saveState();
    renderRecords();
    renderMoodDashboard();
    renderMonthCalendar();
  }

  function getLatestRecordByDate() {
    const result = {};

    state.records
      .slice()
      .reverse()
      .forEach(function (record) {
        if (!result[record.date]) {
          result[record.date] = record;
        }
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
    $("sx-average-mood").textContent = `${averageMood.toFixed(1)} / 5`;
    $("sx-streak-days").textContent = `${calculateStreak(recordsByDate)} 天`;
    $("sx-total-days").textContent = `${dates.length} 天`;

    renderMoodHeatmap(recordsByDate);
    renderMoodLine(recordsByDate);
  }

  function calculateStreak(recordsByDate) {
    let count = 0;
    const cursor = new Date();

    while (true) {
      const date = formatDate(cursor);

      if (!recordsByDate[date]) break;

      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return count;
  }

  function renderMoodHeatmap(recordsByDate) {
    const container = $("sx-mood-heatmap");
    const year = new Date().getFullYear();

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
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const record = recordsByDate[date];
        const mood = record ? Number(record.mood) : 0;
        const title = record ? `${date}：${moodText[mood]}` : `${date}：未记录`;

        html += `<span class="sx-heat-cell mood-${mood}" title="${escapeHTML(title)}"></span>`;
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
      const y = paddingTop + (5 - mood) / 4 * usableHeight;

      return { date, mood, x, y };
    });

    const path = points
      .map(function (point, index) {
        return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
      })
      .join(" ");

    const gridLines = [1, 2, 3, 4, 5]
      .map(function (level) {
        const y = paddingTop + (5 - level) / 4 * usableHeight;

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

        return `<text x="${point.x}" y="${height - 12}" text-anchor="middle" class="sx-chart-x">${point.date.slice(5)}</text>`;
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

    $("sx-month-title").textContent = `${year}年${month + 1}月`;

    const firstDay = new Date(year, month, 1).getDay();
    const mondayIndex = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const recordsByDate = getLatestRecordByDate();

    let html = "";

    for (let i = 0; i < mondayIndex; i++) {
      html += `<div class="sx-month-day is-blank"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const tasks = state.tasks[date] || [];
      const record = recordsByDate[date];
      const isToday = date === todayString();

      const tasksHTML = tasks.length
        ? tasks.slice(0, 5).map(function (task) {
            return `<li class="${task.done ? "is-done" : ""}">${escapeHTML(task.text)}</li>`;
          }).join("")
        : `<li class="is-muted">暂无任务</li>`;

      const moodHTML = record
        ? `<span class="sx-day-mood mood-${record.mood}">${moodText[record.mood]}</span>`
        : "";

      html += `
        <div class="sx-month-day ${isToday ? "is-today" : ""}">
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

  function exportData() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `sanxi-journal-data-${todayString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files && event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function () {
      try {
        const imported = JSON.parse(String(reader.result));

        state = {
          tasks: imported.tasks && typeof imported.tasks === "object" ? imported.tasks : {},
          records: Array.isArray(imported.records) ? imported.records : []
        };

        saveState();
        renderAll();

        window.alert("导入成功。");
      } catch (error) {
        window.alert("导入失败，请确认文件是之前导出的 JSON 数据。");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("sx-xinliu-page");
  document.documentElement.classList.add("sx-xinliu-html");

  const root = document.getElementById("sx-xinliu-root");
  if (!root) return;

  const QUOTES = [
    "你真正厉害的地方，不是同时做很多事，而是把一件事做到底。",
    "不要等状态来了再开始，开始了状态自然会来。",
    "专注不是压抑杂念，而是一次次把自己拉回来。",
    "今天只要比昨天推进一点点，就已经很好了。",
    "你和理想生活之间，往往只差一段安静坚持的时间。",
    "不求一下子逆袭，只求今天别白过。",
    "慢一点没有关系，关键是别停下。",
    "情绪可以波动，节奏不要丢。",
    "把注意力收回来，先把眼前这件事做好。",
    "完成比完美更重要，行动比犹豫更重要。",
    "不要等状态来了再开始，开始了状态自然会来。",
    "专注不是压抑杂念，而是一次次把自己拉回来。",
    "你和理想生活之间，往往只差一段安静坚持的时间。",
    "先把今天最重要的一件事完成，其他事情再慢慢处理。",
    "真正的自律不是一直紧绷，而是知道什么时候该回到正轨。"
  ];

  const RANDOM_TASKS = [
    "英语单词背诵",
    "英语精读一篇短文",
    "数学分析随机一道大题",
    "高代随机一道大题",
    "学一个算法题",
    "数分图解再学一张",
    "整理一页课堂笔记",
    "复盘一个最近遇到的报错",
    "写一段今天的学习总结"
  ];

  const TODO_STORAGE_KEY = "sanxi_xinliu_todos_v3";

  /*
    这里改成 v4，是为了避免之前 v3 里保存的旧倒计时数据继续覆盖输入框。
    如果以后你想彻底重置倒计时，也可以把 v4 改成 v5。
  */
  const TIMER_STORAGE_KEY = "sanxi_xinliu_timer_v4";

  root.innerHTML = `
    <div class="sx-focus-bg" aria-hidden="true"></div>

    <div class="sx-focus-shell">
      <header class="sx-focus-page-title">
        <h1>心流</h1>
        <p>专注、计划与行动。</p>
      </header>

      <main class="sx-focus-board">
        <section class="sx-focus-left">
          <div class="sx-focus-card sx-focus-brand-card">
            <div class="sx-focus-brand">三喜红</div>
            <div class="sx-focus-brand-sub">FLOW · FOCUS · FINISH</div>
            <p class="sx-focus-brand-desc">
              这是一个专注页面。把注意力收回来，安静地做完今天最重要的事。
            </p>
          </div>

          <div class="sx-focus-card sx-focus-quote-card">
            <div class="sx-focus-card-head">
              <span class="sx-focus-card-label">今日句子</span>
              <button id="sx-focus-refresh-quote" class="sx-focus-btn sx-focus-btn-light" type="button">换一句</button>
            </div>
            <blockquote id="sx-focus-quote-text" class="sx-focus-quote-text"></blockquote>
          </div>
        </section>

        <section class="sx-focus-right">
          <div id="sx-focus-clock-card" class="sx-focus-card sx-focus-clock-card">
            <div class="sx-focus-card-label">TIME</div>
            <div id="sx-focus-date" class="sx-focus-date"></div>
            <div id="sx-focus-time" class="sx-focus-time"></div>
            <div class="sx-focus-tip">点击卡片可全屏显示时间</div>
          </div>

          <div class="sx-focus-card sx-focus-countdown-card">
            <div class="sx-focus-card-label">COUNTDOWN</div>
            <h3 class="sx-focus-widget-title">倒计时</h3>

            <label class="sx-focus-input-label" for="sx-focus-timer-title">名称</label>
            <input id="sx-focus-timer-title" class="sx-focus-input" type="text" value="专注一会儿" autocomplete="off">

            <label class="sx-focus-input-label" for="sx-focus-timer-minutes">分钟数</label>
            <input id="sx-focus-timer-minutes" class="sx-focus-input" type="number" min="1" max="999" value="25">

            <div id="sx-focus-timer-display" class="sx-focus-timer-display">25:00</div>

            <div class="sx-focus-action-row">
              <button id="sx-focus-timer-start" class="sx-focus-btn sx-focus-btn-dark" type="button">开始</button>
              <button id="sx-focus-timer-pause" class="sx-focus-btn sx-focus-btn-light" type="button">暂停</button>
              <button id="sx-focus-timer-reset" class="sx-focus-btn sx-focus-btn-light" type="button">重置</button>
            </div>
          </div>

          <div class="sx-focus-card sx-focus-random-card">
            <div class="sx-focus-card-label">CHALLENGE</div>
            <h3 class="sx-focus-widget-title">随机任务</h3>
            <div id="sx-focus-random-task" class="sx-focus-random-task">挑战一下</div>
            <div class="sx-focus-action-row">
              <button id="sx-focus-random-pick" class="sx-focus-btn sx-focus-btn-dark" type="button">抽一个</button>
              <button id="sx-focus-random-repick" class="sx-focus-btn sx-focus-btn-light" type="button">换一个</button>
            </div>
          </div>

          <div class="sx-focus-card sx-focus-todo-card">
            <div class="sx-focus-card-head">
              <div>
                <div class="sx-focus-card-label">TODAY PLAN</div>
                <h3 class="sx-focus-widget-title">今日待办</h3>
                <p id="sx-focus-todo-date" class="sx-focus-todo-date"></p>
              </div>
            </div>

            <div class="sx-focus-todo-input-row">
              <input id="sx-focus-todo-input" class="sx-focus-input" type="text" placeholder="写下今天要完成的事情" autocomplete="off">
              <button id="sx-focus-todo-add" class="sx-focus-btn sx-focus-btn-dark" type="button">添加</button>
            </div>

            <div id="sx-focus-todo-empty" class="sx-focus-empty-box">今天还没有待办，先写下第一件要做的事。</div>
            <ul id="sx-focus-todo-list" class="sx-focus-todo-list"></ul>

            <div class="sx-focus-action-row">
              <button id="sx-focus-todo-clear" class="sx-focus-btn sx-focus-btn-light" type="button">清除已完成</button>
            </div>
          </div>

          <div class="sx-focus-card sx-focus-music-card">
            <div class="sx-focus-card-label">MUSIC</div>
            <h3 class="sx-focus-widget-title">音乐入口</h3>
            <p class="sx-focus-music-desc">QQ 音乐网页播放器嵌入不稳定，这里先保留稳定跳转入口。</p>
            <a class="sx-focus-btn sx-focus-btn-dark" href="https://y.qq.com/" target="_blank" rel="noopener noreferrer">打开 QQ 音乐</a>
          </div>
        </section>
      </main>

      <div id="sx-focus-clock-overlay" class="sx-focus-clock-overlay" aria-hidden="true">
        <div class="sx-focus-clock-overlay-panel">
          <button id="sx-focus-clock-close" class="sx-focus-clock-close" type="button">×</button>
          <div id="sx-focus-overlay-date" class="sx-focus-overlay-date"></div>
          <div id="sx-focus-overlay-time" class="sx-focus-overlay-time"></div>
        </div>
      </div>
    </div>
  `;

  const $ = (id) => document.getElementById(id);

  const els = {
    quoteText: $("sx-focus-quote-text"),
    quoteBtn: $("sx-focus-refresh-quote"),

    clockCard: $("sx-focus-clock-card"),
    dateText: $("sx-focus-date"),
    timeText: $("sx-focus-time"),
    overlay: $("sx-focus-clock-overlay"),
    overlayDate: $("sx-focus-overlay-date"),
    overlayTime: $("sx-focus-overlay-time"),
    overlayClose: $("sx-focus-clock-close"),

    timerTitle: $("sx-focus-timer-title"),
    timerMinutes: $("sx-focus-timer-minutes"),
    timerDisplay: $("sx-focus-timer-display"),
    timerStart: $("sx-focus-timer-start"),
    timerPause: $("sx-focus-timer-pause"),
    timerReset: $("sx-focus-timer-reset"),

    randomTask: $("sx-focus-random-task"),
    randomPick: $("sx-focus-random-pick"),
    randomRepick: $("sx-focus-random-repick"),

    todoDate: $("sx-focus-todo-date"),
    todoInput: $("sx-focus-todo-input"),
    todoAdd: $("sx-focus-todo-add"),
    todoList: $("sx-focus-todo-list"),
    todoEmpty: $("sx-focus-todo-empty"),
    todoClear: $("sx-focus-todo-clear")
  };

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function weekday(day) {
    return ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][day];
  }

  function dateCN(date) {
    return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ${weekday(date.getDay())}`;
  }

  function timeCN(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  function dateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function dateLine(date) {
    return `${dateKey(date)} ${weekday(date.getDay())}`;
  }

  function escapeHTML(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* =========================
     今日句子
  ========================= */
  function pickQuote() {
    els.quoteText.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  pickQuote();
  els.quoteBtn.addEventListener("click", pickQuote);

  /* =========================
     当前时间 + 全屏时间
  ========================= */
  function updateClock() {
    const now = new Date();
    const d = dateCN(now);
    const t = timeCN(now);

    els.dateText.textContent = d;
    els.timeText.textContent = t;
    els.overlayDate.textContent = d;
    els.overlayTime.textContent = t;
  }

  updateClock();
  setInterval(updateClock, 1000);

  els.clockCard.addEventListener("click", () => {
    els.overlay.classList.add("show");
  });

  els.overlayClose.addEventListener("click", () => {
    els.overlay.classList.remove("show");
  });

  els.overlay.addEventListener("click", (e) => {
    if (e.target === els.overlay) {
      els.overlay.classList.remove("show");
    }
  });

  /* =========================
     倒计时
  ========================= */
  function defaultTimer() {
    return {
      title: "专注一会儿",
      duration: 25 * 60,
      remaining: 25 * 60,
      running: false,
      lastTick: null
    };
  }

  function loadTimer() {
    try {
      const saved = JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY));
      if (!saved || typeof saved !== "object") return defaultTimer();

      return {
        title: saved.title || "专注一会儿",
        duration: Number(saved.duration) || 25 * 60,
        remaining: Number(saved.remaining) || Number(saved.duration) || 25 * 60,
        running: Boolean(saved.running),
        lastTick: saved.lastTick || null
      };
    } catch {
      return defaultTimer();
    }
  }

  let timer = loadTimer();

  function saveTimer() {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
  }

  function timerText(seconds) {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const m = Math.floor(safeSeconds / 60);
    const s = safeSeconds % 60;
    return `${pad(m)}:${pad(s)}`;
  }

  function readTimerInputs() {
    const title = els.timerTitle.value.trim() || "专注一会儿";
    const minutes = Math.max(1, Number(els.timerMinutes.value) || 25);

    return {
      title,
      minutes,
      duration: minutes * 60
    };
  }

  function renderTimerInitial() {
    els.timerTitle.value = timer.title || "专注一会儿";
    els.timerMinutes.value = Math.max(1, Math.round((timer.duration || 1500) / 60));
    els.timerDisplay.textContent = timerText(timer.remaining || timer.duration || 1500);
  }

  function renderTimerDisplayOnly() {
    els.timerDisplay.textContent = timerText(timer.remaining);
  }

  function resetTimerByInputs() {
    const input = readTimerInputs();

    timer.title = input.title;
    timer.duration = input.duration;
    timer.remaining = input.duration;
    timer.running = false;
    timer.lastTick = null;

    saveTimer();
    renderTimerDisplayOnly();
  }

  renderTimerInitial();

  els.timerTitle.disabled = false;
  els.timerTitle.readOnly = false;
  els.timerMinutes.disabled = false;
  els.timerMinutes.readOnly = false;

  els.timerTitle.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  els.timerMinutes.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  els.timerTitle.addEventListener("input", () => {
    timer.title = els.timerTitle.value.trim() || "专注一会儿";
    saveTimer();
  });

  els.timerMinutes.addEventListener("input", () => {
    if (timer.running) return;

    const input = readTimerInputs();
    timer.title = input.title;
    timer.duration = input.duration;
    timer.remaining = input.duration;
    timer.lastTick = null;

    saveTimer();
    renderTimerDisplayOnly();
  });

  els.timerStart.addEventListener("click", () => {
    const input = readTimerInputs();

    timer.title = input.title;
    timer.duration = input.duration;

    if (!timer.remaining || timer.remaining <= 0 || timer.remaining > timer.duration) {
      timer.remaining = timer.duration;
    }

    timer.running = true;
    timer.lastTick = Date.now();

    saveTimer();
    renderTimerDisplayOnly();
  });

  els.timerPause.addEventListener("click", () => {
    timer.running = false;
    timer.lastTick = null;

    saveTimer();
    renderTimerDisplayOnly();
  });

  els.timerReset.addEventListener("click", () => {
    resetTimerByInputs();
  });

  setInterval(() => {
    if (!timer.running) return;

    const now = Date.now();

    if (!timer.lastTick) {
      timer.lastTick = now;
    }

    const passed = Math.floor((now - timer.lastTick) / 1000);
    if (passed <= 0) return;

    timer.remaining = Math.max(0, timer.remaining - passed);
    timer.lastTick = now;

    if (timer.remaining <= 0) {
      timer.remaining = 0;
      timer.running = false;
      timer.lastTick = null;

      saveTimer();
      renderTimerDisplayOnly();

      alert(`"${timer.title}" 倒计时结束啦！`);
      return;
    }

    saveTimer();
    renderTimerDisplayOnly();
  }, 300);

  /* =========================
     随机任务
  ========================= */
  function pickRandomTask() {
    els.randomTask.textContent = RANDOM_TASKS[Math.floor(Math.random() * RANDOM_TASKS.length)];
  }

  els.randomPick.addEventListener("click", pickRandomTask);
  els.randomRepick.addEventListener("click", pickRandomTask);

  /* =========================
     今日待办
  ========================= */
  const today = dateKey(new Date());
  els.todoDate.textContent = dateLine(new Date());

  function loadTodos() {
    try {
      return JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  let todoStore = loadTodos();

  function saveTodos() {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todoStore));
  }

  function todayTodos() {
    return Array.isArray(todoStore[today]) ? todoStore[today] : [];
  }

  function setTodayTodos(list) {
    todoStore[today] = list;
    saveTodos();
  }

  function renderTodos() {
    const todos = todayTodos();
    els.todoList.innerHTML = "";

    if (!todos.length) {
      els.todoEmpty.style.display = "block";
      return;
    }

    els.todoEmpty.style.display = "none";

    todos.forEach((item) => {
      const li = document.createElement("li");
      li.className = `sx-focus-todo-item ${item.done ? "done" : ""}`;

      li.innerHTML = `
        <button class="sx-focus-todo-check" data-id="${item.id}" type="button">${item.done ? "✓" : ""}</button>
        <div class="sx-focus-todo-text">${escapeHTML(item.text)}</div>
        <button class="sx-focus-todo-delete" data-id="${item.id}" type="button">删除</button>
      `;

      els.todoList.appendChild(li);
    });

    els.todoList.querySelectorAll(".sx-focus-todo-check").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const updated = todayTodos().map((item) => {
          if (item.id === id) {
            return {
              ...item,
              done: !item.done
            };
          }
          return item;
        });

        setTodayTodos(updated);
        renderTodos();
      });
    });

    els.todoList.querySelectorAll(".sx-focus-todo-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const updated = todayTodos().filter((item) => item.id !== id);

        setTodayTodos(updated);
        renderTodos();
      });
    });
  }

  function addTodo() {
    const text = els.todoInput.value.trim();
    if (!text) return;

    const list = todayTodos();

    list.push({
      id: String(Date.now()),
      text,
      done: false
    });

    setTodayTodos(list);
    els.todoInput.value = "";
    renderTodos();
  }

  els.todoAdd.addEventListener("click", addTodo);

  els.todoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      addTodo();
    }
  });

  els.todoClear.addEventListener("click", () => {
    const updated = todayTodos().filter((item) => !item.done);
    setTodayTodos(updated);
    renderTodos();
  });

  renderTodos();
});
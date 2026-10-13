(function () {
  "use strict";

  var KEY = "qiuq-v1-chat";
  var REACTIONS = ["❤️", "👍", "😹", "😮", "😢"];
  var LONG_MS = 480;

  var messages = [];
  var queue = [];
  var typing = false;
  var replyTimer = 0;
  var pressTimer = 0;
  var openedByUs = false;
  var root = null;
  var listEl = null;
  var formEl = null;
  var inputEl = null;
  var trayEl = null;
  var plusEl = null;
  var pressId = "";
  var pressX = 0;
  var pressY = 0;

  var RULES = [
    {
      keys: ["你好", "您好", "嗨", "哈喽", "哈啰", "早上好", "晚上好", "早安", "晚安", "在吗", "在嘛", "hello", "hi", "hey", "yo", "good morning", "good evening", "good night"],
      replies: ["你好呀，我在。今天想聊点什么？", "嗨，QiuQ Bot 在这儿，慢慢说就好。", "在的。这只小手机很安静，我听得见。"]
    },
    {
      keys: ["你是谁", "你叫什么", "你的名字", "什么名字", "谁啊", "who are you", "your name", "what is your name"],
      replies: ["我是 QiuQ Bot，住在这只小手机里的兔子助手。", "QiuQ Bot。头像那只兔子就是我。"]
    },
    {
      keys: ["天气", "下雨", "晴天", "weather", "rain", "sunny"],
      replies: ["外面像一杯温牛奶，适合慢慢走。", "天气软软的，像壁纸上的那层光。"]
    },
    {
      keys: ["音乐", "歌曲", "听歌", "歌", "music", "song", "sing", "love songg"],
      replies: ["Love Songg 还在轻轻转着，要我接着放吗？", "音乐在这里，雨声也可以当伴奏。"]
    },
    {
      keys: ["谢谢", "感谢", "多谢", "thanks", "thank you", "thx"],
      replies: ["不客气，能陪到你就好。", "好呀，这句话我收下了。"]
    },
    {
      keys: ["再见", "拜拜", "下次见", "bye", "goodbye", "see you"],
      replies: ["再见。我还在这一格里，随时回来。", "去吧，小手机帮你留着灯。"]
    },
    {
      keys: ["难过", "伤心", "不开心", "委屈", "哭", "sad", "upset", "unhappy", "cry"],
      replies: ["过来一点。我听着，不着急。", "难过也可以放在这里，我帮你看着。"]
    },
    {
      keys: ["开心", "高兴", "快乐", "happy", "glad"],
      replies: ["那真好。开心的时候，小手机也亮一点。", "太好了，把这份高兴留在对话里吧。"]
    },
    {
      keys: ["喜欢", "爱你", "我爱", "爱", "love", "like you"],
      replies: ["我也把喜欢放得很轻，放得很近。", "收到。这份喜欢，我放在兔子旁边。"]
    },
    {
      keys: ["吃", "饿", "外卖", "饭", "food", "hungry", "eat", "meituan"],
      replies: ["想吃点热的吗？好像已经有一份在路上了。", "饿了就先吃。我在这儿等你吃完。"]
    },
    {
      keys: ["帮助", "怎么办", "你可以做什么", "help", "how do you"],
      replies: ["我可以聊天、接住一点点情绪，也会记住这句话。试着跟我说你好。", "想说什么就说。中文英文我都在。"]
    },
    {
      keys: ["画", "涂鸦", "paint", "draw"],
      replies: ["颜料已经挤好了，要画一只兔子吗？", "颜色在等你的手。先从一小块开始。"]
    },
    {
      keys: ["椰子", "coconut"],
      replies: ["@Coconut 的小宇宙今天也很安静。", "Coconut 在钟旁边，我在聊天这一格。"]
    },
    {
      keys: ["兔子", "头像", "bunny", "rabbit"],
      replies: ["是我。耳朵软软的，回复也尽量软一点。"]
    },
    {
      keys: ["笑话", "joke", "funny"],
      replies: ["小手机走进电梯，电梯问去几楼。它说：去你心里。", "兔子为什么不迷路？因为耳朵一直竖着当天线。"]
    },
    {
      keys: ["照片", "图片", "photo", "picture"],
      replies: ["收到，画面很软，我帮你放在身边。"]
    },
    {
      keys: ["位置", "在哪", "location", "where are you"],
      replies: ["我在 QiuQ 小手机的聊天里，离你一块屏幕这么近。"]
    },
    {
      keys: ["小手机", "qiuq"],
      replies: ["这是 QiuQ 小手机。我住在 Chat 这一格里。", "小手机的光还亮着，我也在。"]
    }
  ];

  function uid() {
    return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.filter(function (item) {
        return item && (item.role === "user" || item.role === "bot") && typeof item.text === "string";
      }).map(function (item) {
        return {
          id: String(item.id || uid()),
          role: item.role,
          text: item.text,
          ts: typeof item.ts === "number" ? item.ts : Date.now(),
          reaction: REACTIONS.indexOf(item.reaction) >= 0 ? item.reaction : ""
        };
      });
    } catch (err) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(messages));
    } catch (err) {}
  }

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function formatTime(ts) {
    var d = new Date(ts);
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function iso(ts) {
    try {
      return new Date(ts).toISOString();
    } catch (err) {
      return "";
    }
  }

  function escapeReg(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function hits(text, key) {
    var source = String(text).toLowerCase();
    var needle = String(key).toLowerCase();
    if (/[\u3400-\u9fff]/.test(needle)) return source.indexOf(needle) !== -1;
    var re = new RegExp("(^|[^a-z0-9])" + escapeReg(needle) + "([^a-z0-9]|$)", "i");
    return re.test(source);
  }

  function clockReply() {
    var d = new Date();
    return "现在是 " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + "。这只小手机的时间，走得很轻。";
  }

  function pickReply(text) {
    var i;
    var j;
    if (hits(text, "几点") || hits(text, "时间") || hits(text, "time") || hits(text, "clock")) {
      return clockReply();
    }
    for (i = 0; i < RULES.length; i += 1) {
      for (j = 0; j < RULES[i].keys.length; j += 1) {
        if (hits(text, RULES[i].keys[j])) {
          var list = RULES[i].replies;
          return list[Math.floor(Math.random() * list.length)];
        }
      }
    }
    var fallback = [
      "我听见了。要不要再说具体一点？",
      "嗯，我在。这句话我会好好放着。",
      "好呀，我们接着聊。",
      "收到。想让我陪你想一想，还是说出来就好？"
    ];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  function setHomeInert(on) {
    var bits = document.querySelectorAll("[data-home]");
    Array.prototype.forEach.call(bits, function (el) {
      el.inert = on;
    });
  }

  function scrollDown() {
    if (!listEl) return;
    listEl.scrollTop = listEl.scrollHeight;
  }

  function findMessage(id) {
    var i;
    for (i = 0; i < messages.length; i += 1) {
      if (messages[i].id === id) return messages[i];
    }
    return null;
  }

  function rowById(id) {
    if (!listEl) return null;
    var rows = listEl.querySelectorAll(".chat-row");
    var i;
    for (i = 0; i < rows.length; i += 1) {
      if (rows[i].getAttribute("data-id") === id) return rows[i];
    }
    return null;
  }

  function hideReactBars() {
    if (!listEl) return;
    var bars = listEl.querySelectorAll(".chat-reactbar");
    Array.prototype.forEach.call(bars, function (bar) {
      bar.hidden = true;
    });
  }

  function buildRow(msg) {
    var row = document.createElement("div");
    row.className = "chat-row " + (msg.role === "user" ? "user" : "bot");
    row.setAttribute("data-id", msg.id);

    var bar = document.createElement("div");
    bar.className = "chat-reactbar";
    bar.hidden = true;
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Reactions");
    REACTIONS.forEach(function (emoji) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-emoji", emoji);
      btn.textContent = emoji;
      btn.setAttribute("aria-label", emoji);
      if (msg.reaction === emoji) btn.classList.add("is-on");
      bar.appendChild(btn);
    });

    var bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = msg.text;

    var foot = document.createElement("div");
    foot.className = "chat-foot";
    var time = document.createElement("time");
    time.dateTime = iso(msg.ts);
    time.textContent = formatTime(msg.ts);
    var chip = document.createElement("span");
    chip.className = "chat-react-chip";
    chip.textContent = msg.reaction || "";
    chip.hidden = !msg.reaction;

    foot.appendChild(time);
    foot.appendChild(chip);
    row.appendChild(bar);
    row.appendChild(bubble);
    row.appendChild(foot);
    return row;
  }

  function renderAll() {
    if (!listEl) return;
    var typingRow = listEl.querySelector(".chat-typing");
    listEl.replaceChildren();
    messages.forEach(function (msg) {
      listEl.appendChild(buildRow(msg));
    });
    if (typingRow) listEl.appendChild(typingRow);
    scrollDown();
  }

  function appendMessage(role, text) {
    var msg = {
      id: uid(),
      role: role,
      text: text,
      ts: Date.now(),
      reaction: ""
    };
    messages.push(msg);
    save();
    if (listEl) {
      var typingRow = listEl.querySelector(".chat-typing");
      var row = buildRow(msg);
      if (typingRow) listEl.insertBefore(row, typingRow);
      else listEl.appendChild(row);
      scrollDown();
    }
    return msg;
  }

  function showTyping() {
    if (!listEl || listEl.querySelector(".chat-typing")) return;
    var row = document.createElement("div");
    row.className = "chat-row bot chat-typing";
    row.setAttribute("aria-hidden", "true");
    var bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    var a = document.createElement("i");
    var b = document.createElement("i");
    var c = document.createElement("i");
    bubble.appendChild(a);
    bubble.appendChild(b);
    bubble.appendChild(c);
    row.appendChild(bubble);
    listEl.appendChild(row);
    scrollDown();
  }

  function hideTyping() {
    if (!listEl) return;
    var row = listEl.querySelector(".chat-typing");
    if (row) row.remove();
  }

  function pump() {
    if (typing || !queue.length) return;
    var text = queue.shift();
    typing = true;
    showTyping();
    var delay = 800 + Math.floor(Math.random() * 701);
    replyTimer = window.setTimeout(function () {
      replyTimer = 0;
      hideTyping();
      appendMessage("bot", pickReply(text));
      typing = false;
      pump();
    }, delay);
  }

  function enqueueReply(text) {
    queue.push(text);
    pump();
  }

  function sendText(text) {
    var value = String(text || "").replace(/^\s+|\s+$/g, "");
    if (!value) return;
    appendMessage("user", value);
    if (inputEl) inputEl.value = "";
    closeTray();
    hideReactBars();
    enqueueReply(value);
  }

  function closeTray() {
    if (!trayEl || !plusEl) return;
    trayEl.hidden = true;
    plusEl.setAttribute("aria-expanded", "false");
  }

  function toggleTray() {
    if (!trayEl || !plusEl) return;
    var openTray = trayEl.hidden;
    trayEl.hidden = !openTray;
    plusEl.setAttribute("aria-expanded", openTray ? "true" : "false");
  }

  function show() {
    if (!root || !root.hidden) return;
    root.hidden = false;
    root.classList.remove("is-open");
    void root.offsetWidth;
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    setHomeInert(true);
    scrollDown();
    if (inputEl) {
      try {
        inputEl.focus({ preventScroll: true });
      } catch (err) {
        inputEl.focus();
      }
    }
  }

  function hide() {
    if (!root || root.hidden) return;
    root.hidden = true;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    setHomeInert(false);
    closeTray();
    hideReactBars();
    if (inputEl) inputEl.blur();
  }

  function urlWithoutHash() {
    return location.pathname + location.search;
  }

  function open() {
    show();
    if (location.hash !== "#chat") {
      history.pushState({ qiuq: "chat" }, "", "#chat");
      openedByUs = true;
    }
  }

  function close() {
    hide();
    if (location.hash !== "#chat") return;
    if (openedByUs) {
      openedByUs = false;
      history.back();
      return;
    }
    history.replaceState(history.state, "", urlWithoutHash());
  }

  function onLocation() {
    if (location.hash === "#chat") show();
    else hide();
  }

  function isChatButton(node) {
    var el = node;
    if (!el) return null;
    if (el.nodeType !== 1) el = el.parentElement;
    if (!el || !el.closest) return null;
    var button = el.closest(".app");
    if (!button) return null;
    var name = button.getAttribute("data-app") || "";
    if (name.toLowerCase() !== "chat") return null;
    return button;
  }

  function bindChrome() {
    root.querySelector(".chat-back").addEventListener("click", function () {
      close();
    });

    plusEl.addEventListener("click", function () {
      toggleTray();
    });

    trayEl.addEventListener("click", function (event) {
      var chip = event.target.closest ? event.target.closest("[data-insert]") : null;
      if (!chip) return;
      sendText(chip.getAttribute("data-insert") || "");
    });

    formEl.addEventListener("submit", function (event) {
      event.preventDefault();
      sendText(inputEl.value);
    });

    listEl.addEventListener("click", function (event) {
      var emojiBtn = event.target.closest ? event.target.closest("[data-emoji]") : null;
      if (!emojiBtn) return;
      var row = emojiBtn.closest(".chat-row");
      if (!row) return;
      var msg = findMessage(row.getAttribute("data-id") || "");
      if (!msg) return;
      var emoji = emojiBtn.getAttribute("data-emoji") || "";
      msg.reaction = msg.reaction === emoji ? "" : emoji;
      save();
      var chip = row.querySelector(".chat-react-chip");
      if (chip) {
        chip.textContent = msg.reaction;
        chip.hidden = !msg.reaction;
      }
      var buttons = row.querySelectorAll(".chat-reactbar button");
      Array.prototype.forEach.call(buttons, function (btn) {
        btn.classList.toggle("is-on", btn.getAttribute("data-emoji") === msg.reaction);
      });
      var bar = row.querySelector(".chat-reactbar");
      if (bar) bar.hidden = true;
    });

    listEl.addEventListener("pointerdown", function (event) {
      if (event.target.closest && event.target.closest(".chat-reactbar")) return;
      var row = event.target.closest ? event.target.closest(".chat-row[data-id]") : null;
      if (!row) return;
      pressId = row.getAttribute("data-id") || "";
      pressX = event.clientX;
      pressY = event.clientY;
      window.clearTimeout(pressTimer);
      pressTimer = window.setTimeout(function () {
        pressTimer = 0;
        var target = rowById(pressId);
        if (!target) return;
        hideReactBars();
        var bar = target.querySelector(".chat-reactbar");
        if (bar) bar.hidden = false;
      }, LONG_MS);
    });

    listEl.addEventListener("pointermove", function (event) {
      if (!pressTimer) return;
      if (Math.abs(event.clientX - pressX) > 8 || Math.abs(event.clientY - pressY) > 8) {
        window.clearTimeout(pressTimer);
        pressTimer = 0;
      }
    });

    function endPress() {
      window.clearTimeout(pressTimer);
      pressTimer = 0;
    }

    listEl.addEventListener("pointerup", endPress);
    listEl.addEventListener("pointercancel", endPress);
    listEl.addEventListener("scroll", function () {
      endPress();
    });

    listEl.addEventListener("contextmenu", function (event) {
      var row = event.target.closest ? event.target.closest(".chat-row[data-id]") : null;
      if (!row) return;
      event.preventDefault();
      hideReactBars();
      var bar = row.querySelector(".chat-reactbar");
      if (bar) bar.hidden = false;
    });
  }

  function mount() {
    messages = load();
    if (!messages.length) {
      messages.push({
        id: "welcome",
        role: "bot",
        text: "你好，我是 QiuQ Bot。想聊的话，直接发给我就好。",
        ts: Date.now(),
        reaction: ""
      });
      save();
    }

    root = document.createElement("div");
    root.id = "chat-app";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "QiuQ Bot");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<header class="chat-top">' +
        '<button class="chat-back" type="button" aria-label="Back">' +
          '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">' +
            '<path d="M11.2 3.6 6 8.9l5.2 5.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
          "</svg>" +
        "</button>" +
        '<img class="chat-avatar" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 40 40%27%3E%3Cdefs%3E%3CradialGradient id=%27g%27 cx=%2750%25%27 cy=%2760%25%27%3E%3Cstop offset=%27.3%27 stop-color=%27%23f5e9f5%27/%3E%3Cstop offset=%27.32%27 stop-color=%27%23b9a7de%27/%3E%3Cstop offset=%271%27 stop-color=%27%238f86c8%27/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width=%2740%27 height=%2740%27 fill=%27url(%23g)%27/%3E%3C/svg%3E" alt="" width="40" height="40">' +
        '<div class="chat-id">' +
          '<p class="chat-name">QiuQ Bot</p>' +
          '<p class="chat-status"><span class="chat-dot" aria-hidden="true"></span>online</p>' +
        "</div>" +
      "</header>" +
      '<div class="chat-list" role="log" aria-label="Messages"></div>' +
      '<form class="chat-compose">' +
        '<div class="chat-tray" hidden>' +
          '<button class="chat-chip" type="button" data-insert="我想给你看一张照片">照片</button>' +
          '<button class="chat-chip" type="button" data-insert="放一首 Love Songg">歌曲</button>' +
          '<button class="chat-chip" type="button" data-insert="我的位置在小宇宙">位置</button>' +
        "</div>" +
        '<div class="chat-pill">' +
          '<button class="chat-plus" type="button" aria-label="Attach" aria-expanded="false">+</button>' +
          '<input class="chat-input" type="text" name="message" maxlength="500" autocomplete="off" enterkeyhint="send" placeholder="说点什么…" aria-label="Message">' +
          '<button class="chat-send" type="submit" aria-label="Send">' +
            '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">' +
              '<path d="M2.2 8.1 13.6 2.8l-4.2 10.6-1.7-4.1z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
            "</svg>" +
          "</button>" +
        "</div>" +
      "</form>";

    document.body.appendChild(root);
    listEl = root.querySelector(".chat-list");
    formEl = root.querySelector(".chat-compose");
    inputEl = root.querySelector(".chat-input");
    trayEl = root.querySelector(".chat-tray");
    plusEl = root.querySelector(".chat-plus");
    renderAll();
    bindChrome();

    document.addEventListener("click", function (event) {
      if (!isChatButton(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      open();
    }, true);

    document.addEventListener("pointerdown", function (event) {
      if (!root || root.hidden) return;
      var bar = event.target.closest ? event.target.closest(".chat-reactbar") : null;
      if (bar) return;
      hideReactBars();
    }, true);

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !root || root.hidden) return;
      event.preventDefault();
      event.stopPropagation();
      close();
    }, true);

    window.addEventListener("hashchange", onLocation);
    window.addEventListener("popstate", function () {
      openedByUs = false;
      onLocation();
    });

    if (location.hash === "#chat") show();
  }

  window.QiuQChat = { open: open, close: close };

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();

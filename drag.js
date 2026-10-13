(function () {
  "use strict";

  var GRID = 8;
  var HOLD_MS = 600;
  var SLOP = 8;
  var MIN_W = 96;
  var MIN_H = 80;
  var LAYOUT_KEY = "qiuq-layout";
  var TEXT_KEY = "qiuq-texts";
  var IMAGE_KEY = "qiuq-images";
  var DB_NAME = "qiuq-diy";
  var DB_STORE = "images";
  var WIDGET_IDS = { photo: 1, lyrics: 1, clock: 1, player: 1 };
  var CORNERS = ["nw", "ne", "sw", "se"];

  var screen = document.querySelector(".screen");
  if (!screen) return;

  var editing = false;
  var layoutFreed = false;
  var hadSaved = false;
  var layoutDirty = false;
  var gesture = null;
  var textItems = [];
  var pickKind = null;
  var swallowClick = false;
  var zTop = 4;
  var dbPromise = null;

  var tools = document.createElement("div");
  tools.className = "qiuq-tools";

  var resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.id = "edit-reset";
  resetBtn.textContent = "Reset";
  resetBtn.hidden = true;

  var wallBtn = document.createElement("button");
  wallBtn.type = "button";
  wallBtn.id = "wallpaper-btn";
  wallBtn.textContent = "Wallpaper";
  wallBtn.hidden = true;

  var toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.id = "edit-toggle";
  toggleBtn.textContent = "Edit";
  toggleBtn.setAttribute("aria-pressed", "false");

  tools.appendChild(resetBtn);
  tools.appendChild(wallBtn);
  tools.appendChild(toggleBtn);
  document.body.appendChild(tools);

  var wall = document.createElement("div");
  wall.id = "qiuq-wallpaper";
  wall.hidden = true;
  wall.setAttribute("aria-hidden", "true");
  document.body.insertBefore(wall, document.body.firstChild);

  var fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "qiuq-file";
  fileInput.accept = "image/*";
  fileInput.tabIndex = -1;
  fileInput.setAttribute("aria-hidden", "true");
  document.body.appendChild(fileInput);

  function closest(node, sel) {
    if (!node) return null;
    if (node.nodeType !== 1) node = node.parentElement;
    if (!node || !node.closest) return null;
    return node.closest(sel);
  }

  function clamp(value, min, max) {
    if (max < min) return min;
    return Math.max(min, Math.min(max, value));
  }

  function px(n) {
    return Math.round(n * 100) / 100;
  }

  function snap(n) {
    return Math.round(n / GRID) * GRID;
  }

  function snapClamp(value, min, max) {
    var snapped = snap(value);
    if (snapped < min) snapped = Math.ceil(min / GRID) * GRID;
    if (snapped > max) snapped = Math.floor(max / GRID) * GRID;
    if (snapped < min || snapped > max) return clamp(value, min, max);
    return snapped;
  }

  function readJSON(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function removeKey(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {}
  }

  function isWidget(el) {
    return !!(el && WIDGET_IDS[el.getAttribute("data-id")]);
  }

  function items() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-id]"));
  }

  function screenOrigin() {
    var rect = screen.getBoundingClientRect();
    var style = window.getComputedStyle(screen);
    return {
      rect: rect,
      x: rect.left + (parseFloat(style.borderLeftWidth) || 0),
      y: rect.top + (parseFloat(style.borderTopWidth) || 0)
    };
  }

  function readBox(el) {
    return {
      x: parseFloat(el.style.left) || 0,
      y: parseFloat(el.style.top) || 0,
      w: parseFloat(el.style.width) || el.offsetWidth,
      h: parseFloat(el.style.height) || el.offsetHeight
    };
  }

  function applyBox(el, box) {
    el.style.position = "absolute";
    el.style.left = box.x + "px";
    el.style.top = box.y + "px";
    el.style.width = box.w + "px";
    el.style.height = box.h + "px";
    el.style.margin = "0";
    if (box.z) el.style.zIndex = String(box.z);
  }

  function clearBox(el) {
    el.style.position = "";
    el.style.left = "";
    el.style.top = "";
    el.style.width = "";
    el.style.height = "";
    el.style.margin = "";
    el.style.zIndex = "";
  }

  function raise(el) {
    zTop += 1;
    el.style.zIndex = String(zTop);
  }

  function freezeLayout() {
    var origin = screenOrigin();
    var boxes = items().map(function (el) {
      if (el.style.position === "absolute" && el.style.left && el.style.width) {
        return { el: el, box: readBox(el) };
      }
      var rect = el.getBoundingClientRect();
      return {
        el: el,
        box: {
          x: px(rect.left - origin.x),
          y: px(rect.top - origin.y),
          w: px(Math.max(rect.width, 8)),
          h: px(Math.max(rect.height, 8))
        }
      };
    });
    boxes.forEach(function (entry) {
      applyBox(entry.el, entry.box);
    });
    layoutFreed = true;
  }

  function unfreeze() {
    items().forEach(clearBox);
    layoutFreed = false;
    zTop = 4;
  }

  function fitToScreen() {
    if (!layoutFreed) return;
    if (gesture && (gesture.mode === "drag" || gesture.mode === "resize")) return;
    var sw = screen.clientWidth;
    var sh = screen.clientHeight;
    if (!sw || !sh) return;
    items().forEach(function (el) {
      if (el.style.position !== "absolute") return;
      var box = readBox(el);
      var w = Math.min(box.w, sw);
      var h = Math.min(box.h, sh);
      var next = {
        x: clamp(box.x, 0, Math.max(0, sw - w)),
        y: clamp(box.y, 0, Math.max(0, sh - h)),
        w: w,
        h: h,
        z: parseInt(el.style.zIndex, 10) || 0
      };
      if (next.x !== box.x || next.y !== box.y || next.w !== box.w || next.h !== box.h) {
        applyBox(el, next);
      }
    });
  }

  function saveLayout() {
    var data = {};
    items().forEach(function (el) {
      if (el.style.position !== "absolute") return;
      var id = el.getAttribute("data-id");
      if (!id) return;
      var box = readBox(el);
      var entry = { x: box.x, y: box.y, w: box.w, h: box.h };
      var z = parseInt(el.style.zIndex, 10);
      if (z) entry.z = z;
      data[id] = entry;
    });
    if (!Object.keys(data).length) {
      removeKey(LAYOUT_KEY);
      hadSaved = false;
      return;
    }
    if (writeJSON(LAYOUT_KEY, data)) hadSaved = true;
  }

  function loadLayout() {
    var data = readJSON(LAYOUT_KEY);
    if (!data || typeof data !== "object") return;
    var sw = screen.clientWidth || 390;
    var sh = screen.clientHeight || 844;
    var any = false;
    Object.keys(data).forEach(function (id) {
      var el = document.querySelector('[data-id="' + String(id).replace(/"/g, "") + '"]');
      var box = data[id];
      if (!el || !box || typeof box !== "object") return;
      var w = clamp(parseFloat(box.w), 8, sw);
      var h = clamp(parseFloat(box.h), 8, sh);
      if (!isFinite(w) || !isFinite(h)) return;
      var x = clamp(parseFloat(box.x) || 0, 0, Math.max(0, sw - w));
      var y = clamp(parseFloat(box.y) || 0, 0, Math.max(0, sh - h));
      var z = parseInt(box.z, 10);
      if (z > zTop) zTop = z;
      applyBox(el, { x: x, y: y, w: w, h: h, z: z || 0 });
      any = true;
    });
    if (any) {
      layoutFreed = true;
      hadSaved = true;
    }
  }

  function wrapLooseText(parent, className) {
    if (!parent) return null;
    var existing = null;
    Array.prototype.forEach.call(parent.children, function (child) {
      if (!existing && child.classList.contains(className)) existing = child;
    });
    if (existing) return existing;
    var nodes = parent.childNodes;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.nodeType === 3 && node.textContent.trim()) {
        var span = document.createElement("span");
        span.className = className;
        span.textContent = node.textContent.trim();
        parent.replaceChild(span, node);
        return span;
      }
    }
    return null;
  }

  function addText(el, key) {
    if (!el || !key) return;
    textItems.push({ el: el, key: key, original: el.textContent });
  }

  function collectTexts() {
    addText(document.querySelector(".chip"), "chip");
    Array.prototype.forEach.call(document.querySelectorAll(".pill"), function (el, index) {
      addText(el, "pill-" + index);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".lyric"), function (el, index) {
      addText(el.querySelector("time"), "lyric-time-" + index);
      addText(el.querySelector("span"), "lyric-span-" + index);
    });
    addText(document.querySelector(".time"), "time");
    addText(wrapLooseText(document.querySelector(".day"), "day-label"), "day");
    addText(wrapLooseText(document.querySelector(".hero-title"), "hero-label"), "title");
    addText(document.querySelector(".handle"), "handle");
    addText(document.querySelector(".song"), "song");
    addText(document.querySelector(".song-sub"), "song-sub");
  }

  function plainText(el) {
    return (el.textContent || "").replace(/\r?\n/g, " ");
  }

  function saveTexts() {
    var data = {};
    var changed = false;
    textItems.forEach(function (item) {
      var value = plainText(item.el);
      data[item.key] = value;
      if (value !== item.original) changed = true;
    });
    if (!changed) {
      removeKey(TEXT_KEY);
      return;
    }
    writeJSON(TEXT_KEY, data);
  }

  function applySavedTexts() {
    var data = readJSON(TEXT_KEY);
    if (!data || typeof data !== "object") return;
    textItems.forEach(function (item) {
      if (typeof data[item.key] === "string") item.el.textContent = data[item.key];
    });
  }

  function setEditable(on) {
    textItems.forEach(function (item) {
      if (on) {
        item.el.setAttribute("contenteditable", "true");
        item.el.setAttribute("spellcheck", "false");
      } else {
        var value = plainText(item.el);
        if (value !== item.el.textContent) item.el.textContent = value;
        item.el.removeAttribute("contenteditable");
        item.el.removeAttribute("spellcheck");
      }
    });
  }

  function insertPlain(text) {
    var selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    var range = selection.getRangeAt(0);
    range.deleteContents();
    var node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function bindText(item) {
    var el = item.el;
    el.addEventListener("keydown", function (event) {
      if (!el.isContentEditable) return;
      if (event.key === "Enter") event.preventDefault();
    });
    el.addEventListener("paste", function (event) {
      if (!el.isContentEditable) return;
      event.preventDefault();
      var text = "";
      if (event.clipboardData) text = event.clipboardData.getData("text/plain") || "";
      insertPlain(text.replace(/\r?\n/g, " "));
      saveTexts();
    });
    el.addEventListener("input", function () {
      saveTexts();
    });
  }

  function ensureHandles() {
    items().forEach(function (el) {
      if (!isWidget(el)) return;
      el.classList.add("qiuq-widget");
      if (el.querySelector(".qiuq-handle")) return;
      CORNERS.forEach(function (corner) {
        var handle = document.createElement("button");
        handle.type = "button";
        handle.className = "qiuq-handle qiuq-handle-" + corner;
        handle.setAttribute("data-corner", corner);
        handle.setAttribute("aria-label", "Resize");
        handle.tabIndex = -1;
        el.appendChild(handle);
      });
    });
  }

  function tagWiggle() {
    items().forEach(function (el, index) {
      el.style.setProperty("--wiggle", String(index % 6));
    });
  }

  function closeSheet() {
    var layer = document.getElementById("sheetLayer");
    if (!layer || layer.hidden) return;
    var button = document.getElementById("sheetClose");
    if (button) button.click();
  }

  function syncTools() {
    var layer = document.getElementById("sheetLayer");
    tools.hidden = !!(layer && !layer.hidden);
  }

  function enterEdit() {
    if (editing) return;
    closeSheet();
    items().forEach(function (el) {
      el.classList.remove("rise");
    });
    if (!layoutFreed) freezeLayout();
    editing = true;
    document.body.classList.add("is-editing");
    toggleBtn.textContent = "Done";
    toggleBtn.setAttribute("aria-pressed", "true");
    toggleBtn.setAttribute("aria-label", "Done");
    resetBtn.hidden = false;
    wallBtn.hidden = false;
    setEditable(true);
    ensureHandles();
  }

  function exitEdit() {
    if (!editing) return;
    if (gesture) finishGesture(false);
    editing = false;
    document.body.classList.remove("is-editing");
    toggleBtn.textContent = "Edit";
    toggleBtn.setAttribute("aria-pressed", "false");
    toggleBtn.setAttribute("aria-label", "Edit");
    resetBtn.hidden = true;
    wallBtn.hidden = true;
    items().forEach(function (el) {
      el.classList.remove("is-lifting");
      el.classList.remove("is-quiet");
    });
    setEditable(false);
    saveTexts();
    if (layoutDirty) saveLayout();
    else if (!hadSaved) unfreeze();
    var active = document.activeElement;
    if (active && active !== document.body && active.blur && !tools.contains(active)) {
      active.blur();
    }
  }

  function toggleEdit() {
    if (editing) exitEdit();
    else enterEdit();
  }

  function resetAll() {
    if (gesture) finishGesture(false);
    removeKey(LAYOUT_KEY);
    removeKey(TEXT_KEY);
    hadSaved = false;
    layoutDirty = false;
    unfreeze();
    textItems.forEach(function (item) {
      item.el.textContent = item.original;
    });
    clearImages();
    if (editing) {
      screen.getBoundingClientRect();
      freezeLayout();
    }
  }

  function diyKind(target) {
    if (!editing) return null;
    if (closest(target, ".qiuq-handle")) return null;
    if (closest(target, "[contenteditable='true']")) return null;
    if (closest(target, ".avatar")) return "avatar";
    if (closest(target, ".album")) return "album";
    if (closest(target, ".photo")) return "photo";
    return null;
  }

  function armSwallow() {
    swallowClick = true;
    window.setTimeout(function () {
      swallowClick = false;
    }, 50);
  }

  function beginDrag(event) {
    var item = gesture.item;
    if (!item) return;
    if (!layoutFreed) freezeLayout();
    gesture.mode = "drag";
    gesture.orig = readBox(item);
    gesture.grabX = event.clientX;
    gesture.grabY = event.clientY;
    item.classList.add("is-lifting");
    item.classList.remove("is-pressed");
    raise(item);
    if (document.activeElement && document.activeElement.blur && closest(document.activeElement, "[data-id]") === item) {
      document.activeElement.blur();
    }
    try {
      item.setPointerCapture(event.pointerId);
    } catch (err) {}
  }

  function applyDrag(event) {
    var item = gesture.item;
    var orig = gesture.orig;
    var dx = event.clientX - gesture.grabX;
    var dy = event.clientY - gesture.grabY;
    var sw = screen.clientWidth;
    var sh = screen.clientHeight;
    var x = snapClamp(orig.x + dx, 0, Math.max(0, sw - orig.w));
    var y = snapClamp(orig.y + dy, 0, Math.max(0, sh - orig.h));
    item.style.left = x + "px";
    item.style.top = y + "px";
  }

  function applyResize(event) {
    var item = gesture.item;
    var orig = gesture.orig;
    var corner = gesture.corner;
    var dx = event.clientX - gesture.startX;
    var dy = event.clientY - gesture.startY;
    var left = orig.x;
    var top = orig.y;
    var right = orig.x + orig.w;
    var bottom = orig.y + orig.h;
    if (corner.indexOf("e") !== -1) right = orig.x + orig.w + dx;
    if (corner.indexOf("s") !== -1) bottom = orig.y + orig.h + dy;
    if (corner.indexOf("w") !== -1) left = orig.x + dx;
    if (corner.indexOf("n") !== -1) top = orig.y + dy;
    var sw = screen.clientWidth;
    var sh = screen.clientHeight;
    left = snapClamp(left, 0, sw - MIN_W);
    top = snapClamp(top, 0, sh - MIN_H);
    right = snapClamp(right, left + MIN_W, sw);
    bottom = snapClamp(bottom, top + MIN_H, sh);
    if (right - left < MIN_W) {
      if (corner.indexOf("w") !== -1) left = right - MIN_W;
      else right = left + MIN_W;
    }
    if (bottom - top < MIN_H) {
      if (corner.indexOf("n") !== -1) top = bottom - MIN_H;
      else bottom = top + MIN_H;
    }
    applyBox(item, {
      x: left,
      y: top,
      w: right - left,
      h: bottom - top,
      z: parseInt(item.style.zIndex, 10) || 0
    });
  }

  function onPointerDown(event) {
    if (event.button !== 0 && event.button !== undefined) return;
    if (closest(event.target, ".qiuq-tools")) return;
    if (closest(event.target, "#sheetLayer")) return;
    if (closest(event.target, ".boot")) return;
    if (!closest(event.target, ".screen")) return;
    if (gesture) return;

    var handle = editing ? closest(event.target, ".qiuq-handle") : null;
    if (handle) {
      var widget = closest(handle, "[data-id]");
      if (!widget) return;
      event.preventDefault();
      event.stopPropagation();
      if (!layoutFreed) freezeLayout();
      gesture = {
        id: event.pointerId,
        mode: "resize",
        corner: handle.getAttribute("data-corner") || "se",
        item: widget,
        startX: event.clientX,
        startY: event.clientY,
        orig: readBox(widget)
      };
      widget.classList.add("is-lifting");
      raise(widget);
      try {
        widget.setPointerCapture(event.pointerId);
      } catch (err) {}
      return;
    }

    var item = closest(event.target, "[data-id]");
    gesture = {
      id: event.pointerId,
      mode: "press",
      x: event.clientX,
      y: event.clientY,
      item: item,
      moved: false,
      long: false,
      timer: null
    };

    if (editing && item && item.classList.contains("app")) {
      event.stopPropagation();
    }

    if (!editing) {
      gesture.timer = window.setTimeout(function () {
        if (!gesture || gesture.mode !== "press") return;
        enterEdit();
        gesture.long = true;
      }, HOLD_MS);
    }
  }

  function onPointerMove(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    if (gesture.mode === "resize") {
      event.preventDefault();
      applyResize(event);
      return;
    }
    var dx = event.clientX - gesture.x;
    var dy = event.clientY - gesture.y;
    if (gesture.mode === "press" && dx * dx + dy * dy > SLOP * SLOP) {
      gesture.moved = true;
      if (!editing) {
        window.clearTimeout(gesture.timer);
        gesture.timer = null;
        return;
      }
      if (gesture.item) beginDrag(event);
    }
    if (gesture.mode === "drag") {
      event.preventDefault();
      applyDrag(event);
    }
  }

  function finishGesture(commit) {
    if (!gesture) return;
    window.clearTimeout(gesture.timer);
    var current = gesture;
    gesture = null;
    if (current.item) current.item.classList.remove("is-lifting");
    if (!commit) return;
    if (current.mode === "drag" || current.mode === "resize") {
      layoutDirty = true;
      saveLayout();
      armSwallow();
      return;
    }
    if (current.long) armSwallow();
  }

  function onPointerUp(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    var wasLong = gesture.long;
    var mode = gesture.mode;
    finishGesture(true);
    if (wasLong || mode === "drag" || mode === "resize") return;
  }

  function onPointerCancel(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    finishGesture(gesture.mode === "drag" || gesture.mode === "resize");
  }

  function openPicker(kind) {
    pickKind = kind;
    fileInput.value = "";
    fileInput.click();
  }

  function findDiyHost(kind) {
    if (kind === "photo") return document.querySelector(".photo");
    if (kind === "album") return document.querySelector(".album");
    if (kind === "avatar") return document.querySelector(".avatar");
    return null;
  }

  function applyImage(kind, dataUrl) {
    if (!dataUrl || dataUrl.indexOf("data:image/") !== 0) return;
    if (kind === "wallpaper") {
      wall.style.backgroundImage = 'url("' + dataUrl.replace(/"/g, "") + '")';
      wall.hidden = false;
      return;
    }
    var host = findDiyHost(kind);
    if (!host) return;
    var img = null;
    Array.prototype.forEach.call(host.children, function (child) {
      if (!img && child.classList && child.classList.contains("qiuq-diy-img")) img = child;
    });
    if (!img) {
      img = document.createElement("img");
      img.className = "qiuq-diy-img";
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.draggable = false;
      host.insertBefore(img, host.firstChild);
    }
    img.src = dataUrl;
  }

  function clearDomImages() {
    Array.prototype.forEach.call(document.querySelectorAll("img.qiuq-diy-img"), function (img) {
      img.remove();
    });
    wall.hidden = true;
    wall.style.backgroundImage = "";
  }

  function readFallbackImages() {
    var data = readJSON(IMAGE_KEY);
    if (!data || typeof data !== "object") return {};
    return data;
  }

  function writeFallbackImage(key, dataUrl) {
    var bag = readFallbackImages();
    bag[key] = dataUrl;
    writeJSON(IMAGE_KEY, bag);
  }

  function forgetFallbackImage(key) {
    var bag = readFallbackImages();
    if (!bag[key]) return;
    delete bag[key];
    if (Object.keys(bag).length) writeJSON(IMAGE_KEY, bag);
    else removeKey(IMAGE_KEY);
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error("no-idb"));
        return;
      }
      var request;
      try {
        request = window.indexedDB.open(DB_NAME, 1);
      } catch (err) {
        reject(err);
        return;
      }
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function (event) {
        if (event && event.preventDefault) event.preventDefault();
        reject(request.error || new Error("idb-open"));
      };
    });
    dbPromise.catch(function () {
      dbPromise = null;
    });
    return dbPromise;
  }

  function idbPut(key, value) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx;
        try {
          tx = db.transaction(DB_STORE, "readwrite");
        } catch (err) {
          reject(err);
          return;
        }
        tx.objectStore(DB_STORE).put(value, key);
        tx.oncomplete = function () {
          resolve();
        };
        tx.onerror = function (event) {
          if (event && event.preventDefault) event.preventDefault();
          reject(tx.error || new Error("idb-put"));
        };
        tx.onabort = function (event) {
          if (event && event.preventDefault) event.preventDefault();
          reject(tx.error || new Error("idb-abort"));
        };
      });
    });
  }

  function idbAll() {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx;
        try {
          tx = db.transaction(DB_STORE, "readonly");
        } catch (err) {
          reject(err);
          return;
        }
        var out = {};
        var request = tx.objectStore(DB_STORE).openCursor();
        request.onsuccess = function () {
          var cursor = request.result;
          if (cursor) {
            out[cursor.key] = cursor.value;
            cursor.continue();
          }
        };
        request.onerror = function (event) {
          if (event && event.preventDefault) event.preventDefault();
          reject(request.error || new Error("idb-read"));
        };
        tx.oncomplete = function () {
          resolve(out);
        };
        tx.onerror = function (event) {
          if (event && event.preventDefault) event.preventDefault();
          reject(tx.error || new Error("idb-read"));
        };
      });
    });
  }

  function idbClear() {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx;
        try {
          tx = db.transaction(DB_STORE, "readwrite");
        } catch (err) {
          reject(err);
          return;
        }
        tx.objectStore(DB_STORE).clear();
        tx.oncomplete = function () {
          resolve();
        };
        tx.onerror = function (event) {
          if (event && event.preventDefault) event.preventDefault();
          reject(tx.error || new Error("idb-clear"));
        };
      });
    });
  }

  function loadImages() {
    return idbAll().then(function (fromDb) {
      var merged = readFallbackImages();
      Object.keys(fromDb || {}).forEach(function (key) {
        merged[key] = fromDb[key];
      });
      return merged;
    }).catch(function () {
      return readFallbackImages();
    });
  }

  function persistImage(key, dataUrl) {
    return idbPut(key, dataUrl).then(function () {
      forgetFallbackImage(key);
    }).catch(function () {
      writeFallbackImage(key, dataUrl);
    });
  }

  function clearImages() {
    clearDomImages();
    removeKey(IMAGE_KEY);
    idbClear().catch(function () {});
  }

  function compress(dataUrl, maxDim) {
    return new Promise(function (resolve) {
      var image = new Image();
      image.onload = function () {
        var width = image.naturalWidth || image.width;
        var height = image.naturalHeight || image.height;
        if (!width || !height) {
          resolve(dataUrl);
          return;
        }
        var scale = Math.min(1, maxDim / Math.max(width, height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        var ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        try {
          resolve(canvas.toDataURL("image/jpeg", 0.86));
        } catch (err) {
          resolve(dataUrl);
        }
      };
      image.onerror = function () {
        resolve(dataUrl);
      };
      image.src = dataUrl;
    });
  }

  function onFile(event) {
    var file = event.target.files && event.target.files[0];
    var kind = pickKind;
    pickKind = null;
    if (!file || !kind) return;
    if (file.type && file.type.indexOf("image/") !== 0) return;
    var reader = new FileReader();
    reader.onerror = function () {};
    reader.onload = function () {
      var url = typeof reader.result === "string" ? reader.result : "";
      if (url.indexOf("data:image/") !== 0) return;
      var maxDim = kind === "avatar" ? 512 : 1600;
      compress(url, maxDim).then(function (dataUrl) {
        applyImage(kind, dataUrl);
        persistImage(kind, dataUrl).catch(function () {});
      });
    };
    try {
      reader.readAsDataURL(file);
    } catch (err) {}
  }

  function onClick(event) {
    if (swallowClick) {
      swallowClick = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!editing) return;
    if (closest(event.target, ".qiuq-tools")) return;
    var kind = diyKind(event.target);
    if (kind) {
      event.preventDefault();
      event.stopPropagation();
      openPicker(kind);
      return;
    }
    if (closest(event.target, ".app")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function onContextMenu(event) {
    if (closest(event.target, ".screen")) event.preventDefault();
  }

  function onDragStart(event) {
    if (closest(event.target, ".screen")) event.preventDefault();
  }

  function onKeyDown(event) {
    if (event.key !== "Escape" || !editing) return;
    event.stopPropagation();
    exitEdit();
  }

  function onFocusIn(event) {
    if (!editing) return;
    var item = closest(event.target, "[data-id]");
    if (item) item.classList.add("is-quiet");
  }

  function onFocusOut(event) {
    var item = closest(event.target, "[data-id]");
    if (item) item.classList.remove("is-quiet");
  }

  collectTexts();
  applySavedTexts();
  textItems.forEach(bindText);
  ensureHandles();
  tagWiggle();
  loadLayout();
  loadImages().then(function (images) {
    Object.keys(images || {}).forEach(function (key) {
      applyImage(key, images[key]);
    });
  }).catch(function () {});

  toggleBtn.addEventListener("click", toggleEdit);
  resetBtn.addEventListener("click", resetAll);
  wallBtn.addEventListener("click", function () {
    if (!editing) return;
    openPicker("wallpaper");
  });
  fileInput.addEventListener("change", onFile);

  document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: false });
  document.addEventListener("pointermove", onPointerMove, { capture: true, passive: false });
  document.addEventListener("pointerup", onPointerUp, true);
  document.addEventListener("pointercancel", onPointerCancel, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("contextmenu", onContextMenu, true);
  document.addEventListener("dragstart", onDragStart, true);
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);
  window.addEventListener("resize", fitToScreen);

  var sheet = document.getElementById("sheetLayer");
  if (sheet && window.MutationObserver) {
    new MutationObserver(syncTools).observe(sheet, { attributes: true, attributeFilter: ["hidden"] });
  }
  syncTools();
})();

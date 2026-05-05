const defaultProgress = {
  homeIntroDone: false,
  findCarbonDone: false,
  classifyDone: false,
  quizDone: false,
  checklistDone: false,
  quizScore: 0,
  foundCount: 0
};

const CARBON_FEE_PER_TON = 300;
const BUDGET_BASE = 600;

function kgToCarbonCost(kg) {
  return Math.round((kg / 1000) * CARBON_FEE_PER_TON * 100) / 100;
}

function getProgress() {
  const raw = localStorage.getItem("carbonProgress");
  if (!raw) return { ...defaultProgress };
  try {
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch (e) {
    return { ...defaultProgress };
  }
}

function saveProgress(p) {
  localStorage.setItem("carbonProgress", JSON.stringify(p));
}

function resetAllProgress() {
  localStorage.removeItem("carbonProgress");
  localStorage.removeItem("lastCoffeePlan");
}

function setActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll(".nav-links a").forEach(a => {
    const href = a.getAttribute("href");
    if ((page === "index" && href === "index.html") || href.includes(page)) {
      a.classList.add("active");
    }
  });
}

function toggleMenu() {
  const nav = document.getElementById("navLinks");
  if (nav) nav.classList.toggle("open");
}

/* 首頁互動 */
function homeQuestion(choice) {
  const box = document.getElementById("homeFeedback");
  if (!box) return;

  const p = getProgress();
  p.homeIntroDone = true;
  saveProgress(p);

  if (choice === "b") {
    box.className = "feedback ok show";
    box.innerHTML = `
      答對了！這就是這個平台想帶你思考的重點。<br><br>
      雖然目前制度主要以大型排放源為主，但對咖啡廳管理者來說，真正重要的不是現在有沒有立刻被收費，而是要不要提早建立碳成本概念。<br><br>
      如果等到未來規範更明確、供應鏈要求更高、顧客也開始在意時才反應，店家可能同時面對設備調整、包材改變、採購重整與品牌壓力，經營彈性就會更小。
    `;
  } else if (choice === "a") {
    box.className = "feedback bad show";
    box.innerHTML = `
      這個想法很常見，但對管理者來說風險比較高。<br><br>
      如果抱著等真的被收再說的心態，未來一旦制度、供應鏈或市場要求變快，店家就可能被迫在短時間內調整原料、配送、設備與包裝，反而更容易增加成本壓力。
    `;
  } else {
    box.className = "feedback bad show";
    box.innerHTML = `
      這個看法其實低估了碳費概念對經營的影響。<br><br>
      對咖啡廳管理層來說，碳排不是抽象的環保口號，而是會連動到採購距離、配送方式、設備效率、包材使用與品牌形象的管理問題。
    `;
  }

  updateGlobalProgress();
}

/* 單元二：碳排元素 */
const carbonInfo = {
  machine: {
    title: "咖啡機",
    type: "製作",
    level: "高",
    kg: 150,
    desc: "咖啡機在沖煮、蒸汽加熱與待機時都會持續耗電，是店內典型高頻使用設備。"
  },
  fridge: {
    title: "冰箱 / 冷藏設備",
    type: "製作",
    level: "高",
    kg: 180,
    desc: "冷藏設備長時間運轉，若使用效率不佳，會造成穩定且持續的排放。"
  },
  cups: {
    title: "包材 / 外帶杯",
    type: "銷售",
    level: "中",
    kg: 70,
    desc: "一次性包材單次看起來不多，但大量銷售下會累積成顯著排放。"
  },
  light: {
    title: "照明",
    type: "製作",
    level: "低",
    kg: 35,
    desc: "照明若長時間開啟，雖然單項不一定最高，但仍是可優化的日常排放來源。"
  },
  delivery: {
    title: "配送",
    type: "運輸",
    level: "中",
    kg: 95,
    desc: "原料與商品配送的頻率、距離與交通方式，都會影響物流排放。"
  },
  commute: {
    title: "員工通勤",
    type: "間接碳排",
    level: "中",
    kg: 60,
    desc: "員工每天上下班的交通方式，例如機車、汽車或大眾運輸，都會形成間接排放。"
  }
};

function initFindGame() {
  const items = document.querySelectorAll(".game-item");
  if (!items.length) return;

  const progress = getProgress();
  let found = new Set();

  const countEl = document.getElementById("foundCount");
  const infoEl = document.getElementById("findInfo");
  const barEl = document.getElementById("findProgress");

  function render() {
    if (countEl) countEl.textContent = found.size;
    if (barEl) barEl.style.width = (found.size / 6) * 100 + "%";
    progress.foundCount = found.size;

    if (found.size >= 6) {
      progress.findCarbonDone = true;
    }

    saveProgress(progress);
    updateGlobalProgress();
  }

  items.forEach(item => {
    item.addEventListener("click", () => {
      const id = item.dataset.id;
      const data = carbonInfo[id];
      if (!data) return;

      found.add(id);
      item.classList.add("found");

      const fee = kgToCarbonCost(data.kg);

      let cardClass = "";
      if (data.level === "低") {
        cardClass = "carbon-low";
      } else if (data.level === "中") {
        cardClass = "carbon-medium";
      } else {
        cardClass = "carbon-high";
      }

      if (infoEl) {
        infoEl.className = `summary-box carbon-info-box ${cardClass}`;
        infoEl.innerHTML = `
          <strong>${data.title}</strong><br><br>
          類型：${data.type}<br>
          排放等級：${data.level}<br>
          模擬碳排量：${data.kg} kg CO2e / 月<br>
          模擬碳費：NT$ ${fee}<br><br>
          ${data.desc}
        `;
      }

      render();
    });
  });

  render();
}

function resetFindGame() {
  document.querySelectorAll(".game-item").forEach(i => i.classList.remove("found"));

  const p = getProgress();
  p.findCarbonDone = false;
  p.foundCount = 0;
  saveProgress(p);

  const countEl = document.getElementById("foundCount");
  const progressEl = document.getElementById("findProgress");
  const infoEl = document.getElementById("findInfo");

  if (countEl) countEl.textContent = "0";
  if (progressEl) progressEl.style.width = "0%";
  if (infoEl) {
    infoEl.className = "summary-box carbon-info-box";
    infoEl.innerHTML = `
      <strong>請先點選場景中的元素</strong><br><br>
      你會看到：<br>
      • 類型<br>
      • 排放等級<br>
      • 模擬碳排量<br>
      • 模擬碳費
    `;
  }

  updateGlobalProgress();
}

/* 單元三：圖片拖曳題 */
let dragged = null;
let selectedDragItem = null;

function clearSelectedDrag() {
  document.querySelectorAll(".draggable").forEach(item => {
    item.classList.remove("selected-drag");
  });
  document.querySelectorAll(".dropzone").forEach(zone => {
    zone.classList.remove("selected-zone");
  });
  selectedDragItem = null;
}

function initDragDrop() {
  const draggables = document.querySelectorAll(".draggable");
  const zones = document.querySelectorAll(".dropzone[data-zone]");
  const cardBank = document.getElementById("cardBank");
  if (!draggables.length || !zones.length || !cardBank) return;

  dragged = null;
  selectedDragItem = null;

  function selectCard(item) {
    document.querySelectorAll(".draggable").forEach(el => el.classList.remove("selected-drag"));
    item.classList.add("selected-drag");
    selectedDragItem = item;
  }

  draggables.forEach(item => {
    item.setAttribute("draggable", "true");

    item.addEventListener("dragstart", () => {
      dragged = item;
    });

    item.addEventListener("click", (e) => {
      e.stopPropagation();
      selectCard(item);
    });
  });

  zones.forEach(zone => {
    zone.addEventListener("dragover", e => {
      e.preventDefault();
      zone.classList.add("over");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("over");
    });

    zone.addEventListener("drop", e => {
      e.preventDefault();
      zone.classList.remove("over");
      if (dragged) {
        zone.appendChild(dragged);
        dragged = null;
      }
    });

    zone.addEventListener("click", () => {
      if (selectedDragItem) {
        zone.appendChild(selectedDragItem);
        clearSelectedDrag();
      } else {
        document.querySelectorAll(".dropzone").forEach(el => el.classList.remove("selected-zone"));
        zone.classList.add("selected-zone");
      }
    });
  });

  if (cardBank) {
    cardBank.addEventListener("dragover", e => {
      e.preventDefault();
      cardBank.classList.add("over");
    });

    cardBank.addEventListener("dragleave", () => {
      cardBank.classList.remove("over");
    });

    cardBank.addEventListener("drop", e => {
      e.preventDefault();
      cardBank.classList.remove("over");
      if (dragged) {
        const list = cardBank.querySelector(".draggable-list");
        if (list) list.appendChild(dragged);
        dragged = null;
      }
    });

    cardBank.addEventListener("click", () => {
      if (selectedDragItem) {
        const list = cardBank.querySelector(".draggable-list");
        if (list) list.appendChild(selectedDragItem);
        clearSelectedDrag();
      } else {
        document.querySelectorAll(".dropzone").forEach(el => el.classList.remove("selected-zone"));
        cardBank.classList.add("selected-zone");
      }
    });
  }
}

function checkClassification() {
  const zones = document.querySelectorAll(".dropzone[data-zone]");
  const fb = document.getElementById("classificationFeedback");
  if (!zones.length || !fb) return;

  let total = 0;
  let correct = 0;
  let wrongMessages = [];

  const explanations = {
    "咖啡豆": "咖啡豆屬於「原料」，因為它代表的是店家最核心的原物料來源。管理者要思考的是供應來源、進貨距離與穩定性。",
    "配送貨車": "配送貨車屬於「運輸」，因為它反映的是物流移動成本。配送次數與距離都會影響排放與成本。",
    "咖啡機": "咖啡機屬於「製作」，因為它是在店內製作飲品時直接使用的設備，會影響日常耗電與營運效率。",
    "外帶杯": "外帶杯屬於「銷售」，因為它與顧客拿到商品時的包裝選擇有關，也會影響一次性耗材使用量。",
    "冰箱": "冰箱屬於「製作」，因為它是店內維持原料與商品保存的重要設備，會長時間耗能。",
    "員工通勤": "員工通勤最接近「運輸」概念，因為它涉及人員移動造成的交通排放。管理者可以思考交通補助、排班方式或通勤制度。"
  };

  zones.forEach(zone => {
    zone.querySelectorAll(".draggable").forEach(item => {
      total += 1;
      if (item.dataset.type === zone.dataset.zone) {
        correct += 1;
      } else {
        wrongMessages.push(`• ${item.dataset.name} 放錯了。${explanations[item.dataset.name]}`);
      }
    });
  });

  const p = getProgress();
  fb.classList.add("show");

  if (correct === total && total > 0) {
    fb.className = "feedback ok show";
    fb.innerHTML = "全對！你已經掌握原料、運輸、製作、銷售四種分類邏輯。";
    p.classifyDone = true;
  } else {
    fb.className = "feedback bad show";
    fb.innerHTML = `你目前答對 ${correct} / ${total}。<br><br>${wrongMessages.join("<br><br>")}`;
    p.classifyDone = false;
  }

  saveProgress(p);
  updateGlobalProgress();
}

function resetClassification() {
  location.reload();
}

/* 單元四：實戰方案 */
const planScenarioData = {
  hot_latte: {
    title: "情境：我做熱拿鐵",
    desc: "你正在規劃店內的熱拿鐵，請從管理者角度做 5 個選擇。",
    resultLabel: "這杯熱拿鐵的經營結果",
    steps: [
      {
        key: "原料",
        question: "今天這杯熱拿鐵要使用哪一種咖啡豆？",
        options: [
          { id: "hl_bean_classic", label: "經典型：巴西＋哥倫比亞（中深焙）", kg: 60, pros: "風味穩定，與牛奶融合度高，接受度高。", cons: "特色感較保守。", result: "你做出的是一杯平衡、耐喝、適合大眾市場的熱拿鐵。" },
          { id: "hl_bean_strong", label: "濃厚型：巴西＋曼特寧（偏深焙）", kg: 75, pros: "厚度高，加入牛奶後仍有存在感。", cons: "風味較厚重，不一定每個人都喜歡。", result: "你做出的是一杯濃郁、厚實、存在感高的熱拿鐵。" },
          { id: "hl_bean_sweet", label: "甜感型：瓜地馬拉（中焙）", kg: 55, pros: "甜感柔和，口感較輕盈。", cons: "個性可能不如濃厚型明顯。", result: "你做出的是一杯柔和、甜感較明顯的熱拿鐵。" }
        ]
      },
      {
        key: "運輸",
        question: "今天你選擇哪一種供應與配送方式？",
        options: [
          { id: "hl_transport_far", label: "長期配合的供應商（距離較遠）", kg: 95, pros: "合作熟悉、品質穩定。", cons: "運輸距離長，排放較高。", result: "你的原料供應穩定，但運輸排放也比較高。" },
          { id: "hl_transport_regional", label: "區域型供應商，固定週配", kg: 60, pros: "穩定與排放控制兼顧。", cons: "彈性普通。", result: "你的供應模式屬於穩定與排放控制兼顧的中間方案。" },
          { id: "hl_transport_local", label: "在地供應商，集中配送", kg: 35, pros: "距離短，排放較低。", cons: "品項彈性可能較少。", result: "你的供應方式更接近低碳經營。" }
        ]
      },
      {
        key: "製作",
        question: "今天你要怎麼安排熱拿鐵的製作設備？",
        options: [
          { id: "hl_make_eff", label: "高效率義式設備", kg: 42, pros: "品質穩定、效率高。", cons: "前期投入較高。", result: "你的出杯品質穩定，但設備投資壓力較大。" },
          { id: "hl_make_standard", label: "一般義式設備", kg: 70, pros: "成本與品質較平衡。", cons: "節能表現普通。", result: "你的設備策略屬於中間型方案。" },
          { id: "hl_make_old", label: "沿用舊設備", kg: 108, pros: "短期不需要增加成本。", cons: "耗能較高，長期壓力較大。", result: "你的短期壓力較小，但長期耗能較高。" }
        ]
      },
      {
        key: "銷售",
        question: "今天這杯熱拿鐵要怎麼賣？",
        options: [
          { id: "hl_sale_paper", label: "外帶熱飲紙杯", kg: 45, pros: "常見、方便、顧客熟悉。", cons: "一次性包材仍然會累積。", result: "你的銷售方式方便，但包材排放也會增加。" },
          { id: "hl_sale_mug", label: "內用馬克杯", kg: 20, pros: "一次性包材少，品牌感較好。", cons: "需要清洗與內用管理。", result: "你的熱拿鐵更適合店內體驗，也較接近低包材策略。" },
          { id: "hl_sale_reuse", label: "自備杯優惠", kg: 15, pros: "一次性包材最少，永續形象佳。", cons: "需要顧客配合。", result: "你的熱拿鐵銷售方式更符合低碳品牌路線。" }
        ]
      },
      {
        key: "間接碳排",
        question: "今天門市的人力與通勤會怎麼安排？",
        options: [
          { id: "hl_indirect_scooter", label: "員工多以機車通勤", kg: 52, pros: "排班彈性高。", cons: "間接碳排較高。", result: "你的營運彈性較高，但通勤造成的間接排放也較高。" },
          { id: "hl_indirect_mrt", label: "員工多以大眾運輸通勤", kg: 28, pros: "間接碳排較低。", cons: "排班彈性可能較受限。", result: "你的安排較能降低通勤造成的排放。" },
          { id: "hl_indirect_schedule", label: "集中排班與近距離人力配置", kg: 18, pros: "可進一步降低部分通勤排放。", cons: "排班與管理難度較高。", result: "你的安排更偏向整體營運優化。" }
        ]
      }
    ]
  },

  iced_latte: {
    title: "情境：我想做冰拿鐵",
    desc: "冰拿鐵除了咖啡與牛奶，還會牽涉冰塊、冷藏與塑膠杯等選擇。",
    resultLabel: "這杯冰拿鐵的經營結果",
    steps: [
      {
        key: "原料",
        question: "今天這杯冰拿鐵要使用哪一種咖啡豆？",
        options: [
          { id: "il_bean_classic", label: "經典型：巴西＋哥倫比亞（中深焙）", kg: 62, pros: "與牛奶融合度高，接受度高。", cons: "特色感較保守。", result: "你做出的是一杯平衡、耐喝的大眾型冰拿鐵。" },
          { id: "il_bean_strong", label: "濃厚型：巴西＋曼特寧（偏深焙）", kg: 78, pros: "冰飲中仍有足夠存在感。", cons: "風味較厚重。", result: "你做出的是一杯濃郁、存在感高的冰拿鐵。" },
          { id: "il_bean_sweet", label: "甜感型：瓜地馬拉（中焙）", kg: 57, pros: "口感較柔和，甜感較明顯。", cons: "加冰後個性可能被稀釋。", result: "你做出的是一杯柔和、甜感較明顯的冰拿鐵。" }
        ]
      },
      {
        key: "運輸",
        question: "今天你選擇哪一種供應與配送方式？",
        options: [
          { id: "il_transport_far", label: "長期配合的供應商（距離較遠）", kg: 95, pros: "合作熟悉、品質穩定。", cons: "運輸距離長，排放較高。", result: "你的原料供應穩定，但運輸排放也比較高。" },
          { id: "il_transport_regional", label: "區域型供應商，固定週配", kg: 60, pros: "穩定與排放控制兼顧。", cons: "彈性普通。", result: "你的供應模式屬於穩定與排放控制兼顧的中間方案。" },
          { id: "il_transport_local", label: "在地供應商，集中配送", kg: 35, pros: "距離短，排放較低。", cons: "品項彈性較少。", result: "你的供應方式更接近低碳經營。" }
        ]
      },
      {
        key: "製作",
        question: "今天你要怎麼安排冰拿鐵的製作設備？",
        options: [
          { id: "il_make_eff", label: "高效率義式設備＋製冰管理", kg: 55, pros: "品質穩定，也能控制冰塊耗能。", cons: "前期投入較高。", result: "你的冰拿鐵品質穩定，也比較重視耗能控制。" },
          { id: "il_make_standard", label: "一般義式設備＋一般製冰方式", kg: 82, pros: "操作較平衡。", cons: "節能表現普通。", result: "你的設備策略屬於一般平衡型方案。" },
          { id: "il_make_old", label: "舊設備＋高頻製冰", kg: 120, pros: "短期不需加大投資。", cons: "冰塊與設備耗能都偏高。", result: "你的短期壓力較小，但冰飲耗能也會明顯上升。" }
        ]
      },
      {
        key: "銷售",
        question: "今天這杯冰拿鐵要怎麼賣？",
        options: [
          { id: "il_sale_plastic", label: "塑膠杯＋杯蓋", kg: 68, pros: "常見、展示效果好。", cons: "塑膠使用量較高。", result: "你的銷售方式偏重視便利與展示效果。" },
          { id: "il_sale_strawless", label: "塑膠杯＋不主動提供吸管", kg: 52, pros: "較一般塑膠杯少一些耗材。", cons: "仍然屬於一次性包材。", result: "你的銷售方式有做減量，但仍有塑膠包材。" },
          { id: "il_sale_reuse", label: "自備冷飲杯優惠", kg: 18, pros: "包材最少，永續形象較好。", cons: "需要顧客配合。", result: "你的冰拿鐵銷售方式更接近低碳品牌策略。" }
        ]
      },
      {
        key: "間接碳排",
        question: "今天哪些間接因素最影響這杯冰拿鐵？",
        options: [
          { id: "il_indirect_scooter", label: "員工多以機車通勤", kg: 50, pros: "排班彈性高。", cons: "間接碳排較高。", result: "你的營運彈性較高，但間接排放也較高。" },
          { id: "il_indirect_transport", label: "員工多以大眾運輸通勤", kg: 28, pros: "間接碳排較低。", cons: "班表彈性較受限制。", result: "你的安排較能降低通勤造成的間接排放。" },
          { id: "il_indirect_customer", label: "鼓勵內用與集中取餐", kg: 20, pros: "可降低部分顧客與營運的額外排放。", cons: "需要額外溝通與動線安排。", result: "你的安排更重視整體流程中的間接排放控制。" }
        ]
      }
    ]
  },

  hot_americano: {
    title: "情境：我想做熱美式",
    desc: "熱美式看起來簡單，但仍會牽涉豆子、設備、熱水與外帶包材等決策。",
    resultLabel: "這杯熱美式的經營結果",
    steps: [
      {
        key: "原料",
        question: "今天這杯熱美式要使用哪一種咖啡豆？",
        options: [
          { id: "ha_bean_balanced", label: "平衡型：巴西＋哥倫比亞", kg: 50, pros: "接受度高，穩定好賣。", cons: "個性較保守。", result: "你做出的是一杯穩定、順口的大眾型熱美式。" },
          { id: "ha_bean_bright", label: "明亮型：衣索比亞（中焙）", kg: 58, pros: "香氣鮮明，辨識度高。", cons: "有些顧客可能不習慣。", result: "你做出的是一杯香氣明亮、特色鮮明的熱美式。" },
          { id: "ha_bean_dark", label: "厚實型：深焙拼配豆", kg: 68, pros: "苦甜明顯，存在感高。", cons: "風味較重，不是每個人都喜歡。", result: "你做出的是一杯厚實、濃烈的熱美式。" }
        ]
      },
      {
        key: "運輸",
        question: "今天你選擇哪一種供應與配送方式？",
        options: [
          { id: "ha_transport_far", label: "長期配合的供應商（距離較遠）", kg: 90, pros: "穩定熟悉，合作順暢。", cons: "運輸排放較高。", result: "你的供應穩定，但距離造成的排放較高。" },
          { id: "ha_transport_regional", label: "區域型供應商，固定週配", kg: 55, pros: "穩定與排放控制兼顧。", cons: "調整彈性普通。", result: "你的供應模式屬於較務實的平衡方案。" },
          { id: "ha_transport_local", label: "在地供應商，集中配送", kg: 30, pros: "距離短，排放較低。", cons: "品項彈性較少。", result: "你的供應模式比較接近低碳方向。" }
        ]
      },
      {
        key: "製作",
        question: "今天你怎麼安排熱美式的製作設備？",
        options: [
          { id: "ha_make_efficient", label: "高效率義式設備＋穩定熱水系統", kg: 38, pros: "出杯效率高，品質穩定。", cons: "前期成本高。", result: "你的熱美式能維持穩定品質與效率。" },
          { id: "ha_make_standard", label: "一般義式設備", kg: 60, pros: "成本較平衡。", cons: "效率與節能表現一般。", result: "你的設備策略屬於中間型。" },
          { id: "ha_make_old", label: "沿用舊設備", kg: 95, pros: "短期不需加大投資。", cons: "耗能偏高。", result: "你的短期成本較低，但能源壓力也較高。" }
        ]
      },
      {
        key: "銷售",
        question: "今天這杯熱美式要怎麼賣？",
        options: [
          { id: "ha_sale_hotcup", label: "熱飲紙杯", kg: 40, pros: "常見方便，顧客熟悉。", cons: "一次性包材仍會累積。", result: "你的銷售方式穩定，但包材仍有排放。" },
          { id: "ha_sale_mug", label: "內用杯", kg: 18, pros: "一次性包材少。", cons: "需清洗與內用管理。", result: "你的銷售方式更偏向店內體驗與減量策略。" },
          { id: "ha_sale_reuse", label: "自備杯優惠", kg: 14, pros: "包材最少，永續形象佳。", cons: "需要顧客配合。", result: "你的銷售方式更接近低碳品牌策略。" }
        ]
      },
      {
        key: "間接碳排",
        question: "今天門市的人力與通勤會怎麼安排？",
        options: [
          { id: "ha_indirect_scooter", label: "員工多以機車通勤", kg: 50, pros: "排班彈性高。", cons: "間接排放較高。", result: "你的營運彈性高，但間接碳排較高。" },
          { id: "ha_indirect_transport", label: "員工多以大眾運輸通勤", kg: 26, pros: "間接碳排較低。", cons: "排班彈性較受限制。", result: "你的營運安排較有助於降低間接排放。" },
          { id: "ha_indirect_schedule", label: "集中排班與近距離人力配置", kg: 16, pros: "能進一步降低通勤排放。", cons: "管理難度較高。", result: "你的安排更偏向整體營運優化。" }
        ]
      }
    ]
  },

  iced_americano: {
    title: "情境：我想做冰美式",
    desc: "冰美式會多出冰塊、塑膠杯與冷藏管理等選擇。",
    resultLabel: "這杯冰美式的經營結果",
    steps: [
      {
        key: "原料",
        question: "今天這杯冰美式要使用哪一種咖啡豆？",
        options: [
          { id: "ia_bean_balanced", label: "平衡型：巴西＋哥倫比亞", kg: 52, pros: "穩定、接受度高。", cons: "風味較保守。", result: "你做出的是一杯穩定、清爽的大眾型冰美式。" },
          { id: "ia_bean_bright", label: "明亮型：衣索比亞（中焙）", kg: 60, pros: "冰飲中香氣更鮮明。", cons: "有些人可能覺得酸感較明顯。", result: "你做出的是一杯香氣明亮、辨識度高的冰美式。" },
          { id: "ia_bean_dark", label: "厚實型：深焙拼配豆", kg: 70, pros: "苦甜較明顯，存在感高。", cons: "口感可能較厚重。", result: "你做出的是一杯厚實、存在感高的冰美式。" }
        ]
      },
      {
        key: "運輸",
        question: "今天你選擇哪一種供應與配送方式？",
        options: [
          { id: "ia_transport_far", label: "長期配合的供應商（距離較遠）", kg: 90, pros: "合作熟悉，穩定性高。", cons: "運輸排放較高。", result: "你的供應穩定，但距離造成的排放較高。" },
          { id: "ia_transport_regional", label: "區域型供應商，固定週配", kg: 55, pros: "穩定與排放控制兼顧。", cons: "調整彈性普通。", result: "你的供應模式屬於較務實的平衡方案。" },
          { id: "ia_transport_local", label: "在地供應商，集中配送", kg: 30, pros: "距離短，排放較低。", cons: "品項彈性較少。", result: "你的供應模式較接近低碳方向。" }
        ]
      },
      {
        key: "製作",
        question: "今天你怎麼安排冰美式的製作設備？",
        options: [
          { id: "ia_make_efficient", label: "高效率義式設備＋製冰管理", kg: 45, pros: "效率高，也能兼顧冰塊耗能控制。", cons: "前期投入較高。", result: "你的冰美式品質穩定，也比較重視耗能控制。" },
          { id: "ia_make_standard", label: "一般義式設備＋一般製冰方式", kg: 72, pros: "操作較平衡。", cons: "節能表現普通。", result: "你的設備策略屬於一般中間型方案。" },
          { id: "ia_make_old", label: "舊設備＋高頻製冰", kg: 108, pros: "短期不需增加成本。", cons: "冰塊與設備耗能都較高。", result: "你的短期成本較低，但冰飲耗能也較高。" }
        ]
      },
      {
        key: "銷售",
        question: "今天這杯冰美式要怎麼賣？",
        options: [
          { id: "ia_sale_plastic", label: "塑膠杯＋杯蓋", kg: 60, pros: "常見，顧客習慣度高。", cons: "塑膠使用量較高。", result: "你的銷售方式偏重便利與展示效果。" },
          { id: "ia_sale_strawless", label: "塑膠杯＋不主動提供吸管", kg: 48, pros: "比一般塑膠杯少一部分耗材。", cons: "仍有一次性包材問題。", result: "你的銷售方式有減量，但仍屬一次性包材。" },
          { id: "ia_sale_reuse", label: "自備冷飲杯優惠", kg: 16, pros: "包材最少，品牌形象較好。", cons: "需要顧客配合。", result: "你的冰美式銷售方式更符合低碳品牌策略。" }
        ]
      },
      {
        key: "間接碳排",
        question: "今天哪些間接因素最影響這杯冰美式？",
        options: [
          { id: "ia_indirect_scooter", label: "員工多以機車通勤", kg: 48, pros: "排班彈性高。", cons: "間接排放較高。", result: "你的營運彈性較高，但間接排放也較高。" },
          { id: "ia_indirect_transport", label: "員工多以大眾運輸通勤", kg: 26, pros: "間接排放較低。", cons: "班表彈性較受限制。", result: "你的安排較能降低通勤造成的排放。" },
          { id: "ia_indirect_customer", label: "鼓勵內用與集中取餐", kg: 18, pros: "可降低部分顧客與營運的額外排放。", cons: "需要額外溝通與動線安排。", result: "你的安排更重視整體流程中的間接排放控制。" }
        ]
      }
    ]
  },

  delivery: {
    title: "情境：我想看一筆外送訂單會發生哪些事",
    desc: "你接到一筆外送咖啡訂單，請看見配送與包材額外增加的碳排。",
    resultLabel: "這筆外送訂單的經營結果",
    steps: [
      {
        key: "原料",
        question: "今天這筆外送訂單要使用哪種咖啡基底？",
        options: [
          { id: "de_bean_classic", label: "平衡型拼配豆", kg: 56, pros: "穩定、適合大量出杯。", cons: "特色感較普通。", result: "你的外送咖啡風味穩定，適合大眾市場。" },
          { id: "de_bean_dark", label: "深焙濃厚型豆", kg: 72, pros: "配送後風味仍較有存在感。", cons: "口感較重，不一定每位顧客都喜歡。", result: "你的外送咖啡偏濃厚，配送後仍有存在感。" },
          { id: "de_bean_light", label: "較輕盈的中焙豆", kg: 50, pros: "口感較清爽。", cons: "配送後風味辨識度可能降低。", result: "你的外送咖啡偏清爽，但存在感可能較弱。" }
        ]
      },
      {
        key: "運輸",
        question: "今天原料供應與外送距離怎麼安排？",
        options: [
          { id: "de_transport_far", label: "原料遠距供應＋配送範圍大", kg: 110, pros: "選擇多，顧客範圍廣。", cons: "運輸與配送排放都偏高。", result: "你的外送範圍廣，但整體物流排放高。" },
          { id: "de_transport_mid", label: "區域供應＋中距離配送", kg: 72, pros: "穩定與排放較平衡。", cons: "範圍與彈性普通。", result: "你的外送模式屬於較務實的平衡方案。" },
          { id: "de_transport_local", label: "在地供應＋近距離配送", kg: 38, pros: "排放較低，管理較單純。", cons: "服務範圍較小。", result: "你的外送模式更偏向低碳與效率優化。" }
        ]
      },
      {
        key: "製作",
        question: "今天門市怎麼處理外送出杯流程？",
        options: [
          { id: "de_make_fastline", label: "高效率設備＋集中出杯", kg: 48, pros: "效率高，品質較穩定。", cons: "前期設備投入較高。", result: "你的外送出杯效率高，流程更穩定。" },
          { id: "de_make_standard", label: "一般設備，依單製作", kg: 75, pros: "操作單純，成本中等。", cons: "效率普通。", result: "你的外送製作流程屬於中間型方案。" },
          { id: "de_make_old", label: "舊設備＋分散出杯", kg: 105, pros: "短期不增加成本。", cons: "耗能較高，流程較亂。", result: "你的外送流程容易增加耗能與管理壓力。" }
        ]
      },
      {
        key: "銷售",
        question: "今天這筆外送訂單要用哪一種包材？",
        options: [
          { id: "de_sale_basic", label: "紙杯＋塑膠杯蓋＋提袋", kg: 68, pros: "常見、顧客熟悉。", cons: "一次性包材偏多。", result: "你的外送包材方便，但排放也增加。" },
          { id: "de_sale_extra", label: "加上封膜、吸管、雙層包裝", kg: 92, pros: "外送穩定性較高。", cons: "包材最多，排放也最高。", result: "你的外送保護較完整，但包材排放更高。" },
          { id: "de_sale_reduce", label: "精簡包材與不主動提供吸管", kg: 34, pros: "包材較少，永續形象較好。", cons: "需要顧客理解與配合。", result: "你的外送方式更接近減量包裝策略。" }
        ]
      },
      {
        key: "間接碳排",
        question: "今天外送訂單帶來哪些額外間接排放？",
        options: [
          { id: "de_indirect_many", label: "高峰時段多單配送", kg: 65, pros: "營收機會高。", cons: "配送混亂時容易增加額外耗損與排放。", result: "你的外送接單量高，但間接排放與風險也變高。" },
          { id: "de_indirect_control", label: "控制接單範圍與尖峰量", kg: 36, pros: "較能控制外送品質與排放。", cons: "可能少接部分訂單。", result: "你的外送策略比較重視品質與排放控制。" },
          { id: "de_indirect_schedule", label: "集中時段與固定配送策略", kg: 24, pros: "較能降低部分間接排放。", cons: "營運安排較複雜。", result: "你的外送策略更偏向整體流程優化。" }
        ]
      }
    ]
  }
};

let currentScenarioKey = null;
let currentPlanStep = 1;
let currentPlanSelections = {};

function chooseScenario(key) {
  const data = planScenarioData[key];
  if (!data) return;

  currentScenarioKey = key;
  currentPlanStep = 1;
  currentPlanSelections = {};

  const selector = document.getElementById("scenarioSelectorCard");
  const scenarioCard = document.getElementById("planScenarioCard");
  const title = document.getElementById("planScenarioTitle");
  const desc = document.getElementById("planScenarioDesc");
  const result = document.getElementById("planResultPage");

  if (selector) selector.style.display = "none";
  if (scenarioCard) scenarioCard.style.display = "block";
  if (title) title.textContent = data.title;
  if (desc) desc.textContent = data.desc;
  if (result) {
    result.style.display = "none";
    result.innerHTML = "";
    result.className = "summary-box";
  }

  renderPlanStep();
}

function renderPlanStep() {
  const data = planScenarioData[currentScenarioKey];
  if (!data) return;

  const stepData = data.steps[currentPlanStep - 1];
  if (!stepData) return;

  const stepCounter = document.getElementById("planStepCounter");
  const stepCard = document.getElementById("planStepCard");
  const selectionSummary = document.getElementById("planSelectionSummary");
  const resultPage = document.getElementById("planResultPage");
  const backBtn = document.getElementById("planBackBtn");
  const nextBtn = document.getElementById("planNextBtn");

  if (stepCounter) stepCounter.textContent = `步驟 ${currentPlanStep} / ${data.steps.length}`;
  if (resultPage) {
    resultPage.style.display = "none";
    resultPage.innerHTML = "";
    resultPage.className = "summary-box";
  }

  const selectedOptionId = currentPlanSelections[currentPlanStep];
  const selectedOption = stepData.options.find(opt => opt.id === selectedOptionId);

  if (stepCard) {
    stepCard.innerHTML = `
      <strong>${stepData.key}</strong><br><br>
      ${stepData.question}
      <div style="height:16px"></div>
      <div class="choice-list">
        ${stepData.options.map(opt => `
          <button class="choice-btn ${selectedOptionId === opt.id ? "selected-choice" : ""}" onclick="selectPlanChoice('${opt.id}')">
            ${opt.label}
          </button>
        `).join("")}
      </div>
    `;
  }

  if (selectionSummary) {
    if (selectedOption) {
      selectionSummary.innerHTML = `
        已選擇：${selectedOption.label}<br>
        優點：${selectedOption.pros}<br>
        缺點：${selectedOption.cons}
      `;
    } else {
      selectionSummary.innerHTML = "尚未選擇";
    }
  }

  if (backBtn) {
    backBtn.style.display = currentPlanStep > 1 ? "inline-flex" : "none";
  }

  if (nextBtn) {
    nextBtn.style.display = selectedOption ? "inline-flex" : "none";
    nextBtn.textContent = currentPlanStep === data.steps.length ? "查看結果" : "下一步";
  }
}

function selectPlanChoice(optionId) {
  currentPlanSelections[currentPlanStep] = optionId;
  renderPlanStep();
}

function goNextPlanStep() {
  const data = planScenarioData[currentScenarioKey];
  if (!data) return;

  if (!currentPlanSelections[currentPlanStep]) return;

  if (currentPlanStep < data.steps.length) {
    currentPlanStep += 1;
    renderPlanStep();
  } else {
    calculateScenarioResult();
  }
}

function goPrevPlanStep() {
  if (currentPlanStep > 1) {
    currentPlanStep -= 1;
    renderPlanStep();
  }
}

function getEmissionLevelInfo(totalKg) {
  if (totalKg <= 220) {
    return {
      level: "低",
      className: "emission-low",
      text: "你的整體選擇較偏向低碳，代表你有意識地控制了整體排放。"
    };
  } else if (totalKg <= 360) {
    return {
      level: "中",
      className: "emission-medium",
      text: "你的整體選擇屬於平衡型，兼顧品質、便利與部分排放控制。"
    };
  } else {
    return {
      level: "高",
      className: "emission-high",
      text: "你的整體選擇較偏向高排放模式，雖然可能更方便，但未來成本壓力也會比較高。"
    };
  }
}

function calculateScenarioResult() {
  const data = planScenarioData[currentScenarioKey];
  if (!data) return;

  let totalKg = 0;
  let pros = [];
  let cons = [];
  let outcome = [];

  data.steps.forEach((step, index) => {
    const selectedId = currentPlanSelections[index + 1];
    const selected = step.options.find(opt => opt.id === selectedId);
    if (selected) {
      totalKg += selected.kg;
      pros.push(`• ${step.key}｜${selected.label}：${selected.pros}`);
      cons.push(`• ${step.key}｜${selected.label}：${selected.cons}`);
      outcome.push(`• ${step.key}：${selected.result}`);
    }
  });

  const simulatedCarbonFee = kgToCarbonCost(totalKg);
  const levelInfo = getEmissionLevelInfo(totalKg);

  const stepCard = document.getElementById("planStepCard");
  const resultPage = document.getElementById("planResultPage");
  const selectionSummary = document.getElementById("planSelectionSummary");
  const nextBtn = document.getElementById("planNextBtn");

  if (stepCard) {
    stepCard.innerHTML = `<strong>${data.resultLabel}</strong><br><br>你已完成這個情境的 5 個步驟。`;
  }

  if (selectionSummary) {
    selectionSummary.innerHTML = "你可以重新開始，或返回選擇其他情境。";
  }

  if (resultPage) {
    resultPage.style.display = "block";
    resultPage.className = `summary-box ${levelInfo.className}`;
    resultPage.innerHTML = `
      <strong>${data.resultLabel}</strong><br><br>
      <strong>排放等級：</strong> ${levelInfo.level}<br>
      <strong>模擬碳排量：</strong> ${totalKg} kg CO2e<br>
      <strong>模擬碳費：</strong> NT$ ${simulatedCarbonFee}<br><br>

      <strong>這次會發生哪些事</strong><br>
      ${outcome.join("<br>")}<br><br>

      <strong>優點</strong><br>
      ${pros.join("<br>")}<br><br>

      <strong>缺點</strong><br>
      ${cons.join("<br>")}<br><br>

      <strong>管理提醒</strong><br>
      ${levelInfo.text}
    `;
  }

  localStorage.setItem("lastCoffeePlan", JSON.stringify({
    scenarioKey: currentScenarioKey,
    title: data.title,
    desc: data.desc,
    totalKg: totalKg,
    simulatedCarbonFee: simulatedCarbonFee,
    level: levelInfo.level
  }));

  if (nextBtn) nextBtn.style.display = "none";

  const p = getProgress();
  p.quizDone = true;
  p.quizScore = levelInfo.level === "低" ? 3 : levelInfo.level === "中" ? 2 : 1;
  saveProgress(p);
  updateGlobalProgress();
}

function resetPlanScenario() {
  if (!currentScenarioKey) return;
  currentPlanStep = 1;
  currentPlanSelections = {};
  renderPlanStep();

  const p = getProgress();
  p.quizDone = false;
  p.quizScore = 0;
  saveProgress(p);
  updateGlobalProgress();
}

function backToScenarioSelect() {
  currentScenarioKey = null;
  currentPlanStep = 1;
  currentPlanSelections = {};

  const selector = document.getElementById("scenarioSelectorCard");
  const scenarioCard = document.getElementById("planScenarioCard");
  const result = document.getElementById("planResultPage");

  if (selector) selector.style.display = "block";
  if (scenarioCard) scenarioCard.style.display = "none";
  if (result) {
    result.style.display = "none";
    result.innerHTML = "";
    result.className = "summary-box";
  }
}

/* 單元五：行動清單（整間店營運） */
const storeChecklistData = {
  lighting: {
    light_basic: { label: "維持目前照明方式", spend: 0, kg: 55, pros: "不需要額外投入。", cons: "照明排放沒有明顯改善。" },
    light_led: { label: "局部改成 LED 燈具", spend: 80, kg: 35, pros: "可降低部分照明耗能。", cons: "改善幅度中等。" },
    light_smart: { label: "全面 LED ＋分區開關管理", spend: 140, kg: 18, pros: "可更有效控制照明排放。", cons: "前期投入較高。" }
  },
  ac: {
    ac_basic: { label: "維持目前空調方式", spend: 0, kg: 95, pros: "不需額外調整。", cons: "冷氣耗能較高。" },
    ac_temp: { label: "設定固定溫度與時段控制", spend: 70, kg: 65, pros: "可降低部分空調耗能。", cons: "舒適度與管理需平衡。" },
    ac_upgrade: { label: "提升空調效率與門市管理", spend: 130, kg: 40, pros: "長期效果較明顯。", cons: "前期投入較高。" }
  },
  fridge: {
    fridge_basic: { label: "維持目前設備方式", spend: 0, kg: 85, pros: "短期不增加成本。", cons: "冷藏排放維持偏高。" },
    fridge_maintain: { label: "定期保養與溫度管理", spend: 75, kg: 58, pros: "成本不高，也能改善效率。", cons: "改善幅度有限。" },
    fridge_upgrade: { label: "提升冷藏效率與設備配置", spend: 140, kg: 35, pros: "可明顯降低冷藏耗能。", cons: "需要較高投入。" }
  },
  delivery: {
    delivery_basic: { label: "維持目前配送方式", spend: 0, kg: 80, pros: "維持原本物流習慣。", cons: "配送排放沒有改善。" },
    delivery_weekly: { label: "改成固定週配", spend: 90, kg: 55, pros: "可降低部分配送頻率。", cons: "補貨彈性下降。" },
    delivery_batch: { label: "改成集中配送與減少次數", spend: 140, kg: 30, pros: "物流排放下降更明顯。", cons: "需要更好的庫存規劃。" }
  },
  packaging: {
    pack_basic: { label: "維持目前包材方式", spend: 0, kg: 72, pros: "流程穩定。", cons: "包材排放維持偏高。" },
    pack_reduce: { label: "精簡包材與不主動提供吸管", spend: 60, kg: 48, pros: "可立即減少部分一次性耗材。", cons: "改善幅度中等。" },
    pack_reuse: { label: "推自備杯與低包材制度", spend: 110, kg: 28, pros: "更能降低銷售端排放。", cons: "需要顧客配合與宣導。" }
  },
  staff: {
    staff_basic: { label: "維持目前通勤與排班方式", spend: 0, kg: 68, pros: "不需改變現況。", cons: "間接碳排維持偏高。" },
    staff_transit: { label: "鼓勵員工搭大眾運輸", spend: 60, kg: 48, pros: "可降低部分通勤排放。", cons: "可能影響部分排班彈性。" },
    staff_schedule: { label: "集中排班與近距離人力配置", spend: 100, kg: 30, pros: "更能改善間接碳排。", cons: "管理與安排較複雜。" }
  }
};

let storeSelections = {
  lighting: null,
  ac: null,
  fridge: null,
  delivery: null,
  packaging: null,
  staff: null
};

function getSelectedStoreOption(section) {
  const key = storeSelections[section];
  if (!key) return null;
  return storeChecklistData[section][key];
}

function calculateStoreBudgetLeft() {
  let spent = 0;
  Object.keys(storeSelections).forEach(section => {
    const option = getSelectedStoreOption(section);
    if (option) spent += option.spend;
  });
  return BUDGET_BASE - spent;
}

function updateStoreBudget() {
  const el = document.getElementById("storeBudgetLeft");
  if (!el) return;
  el.textContent = calculateStoreBudgetLeft();
}

function loadStoreScenarioInfo() {
  const box = document.getElementById("storeScenarioInfo");
  if (!box) return;

  const raw = localStorage.getItem("lastCoffeePlan");
  if (!raw) {
    box.className = "summary-box emission-medium";
    box.innerHTML = `
      <strong>尚未讀取到上一關資料</strong><br><br>
      請先完成「實戰方案」，讓系統知道你剛剛做的是哪一杯咖啡。
    `;
    return;
  }

  try {
    const data = JSON.parse(raw);
    box.className = "summary-box";
    box.innerHTML = `
      <strong>你剛剛完成的咖啡：</strong> ${data.title}<br>
      <strong>單杯模擬碳排量：</strong> ${data.totalKg} kg CO2e<br>
      <strong>單杯模擬碳費：</strong> NT$ ${data.simulatedCarbonFee}<br><br>
      這一關會再把整間店的營運排放一起算進去，最後得到整體結果。
    `;
  } catch (e) {
    box.className = "summary-box emission-medium";
    box.innerHTML = "上一關資料讀取失敗，請重新完成一次實戰方案。";
  }
}

function clearStoreButtons(section) {
  const map = {
    lighting: ["store-light-basic", "store-light-led", "store-light-smart"],
    ac: ["store-ac-basic", "store-ac-temp", "store-ac-upgrade"],
    fridge: ["store-fridge-basic", "store-fridge-maintain", "store-fridge-upgrade"],
    delivery: ["store-delivery-basic", "store-delivery-weekly", "store-delivery-batch"],
    packaging: ["store-pack-basic", "store-pack-reduce", "store-pack-reuse"],
    staff: ["store-staff-basic", "store-staff-transit", "store-staff-schedule"]
  };

  (map[section] || []).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("selected-choice");
  });
}

function selectStoreOption(section, key) {
  storeSelections[section] = key;
  clearStoreButtons(section);

  const buttonMap = {
    light_basic: "store-light-basic",
    light_led: "store-light-led",
    light_smart: "store-light-smart",

    ac_basic: "store-ac-basic",
    ac_temp: "store-ac-temp",
    ac_upgrade: "store-ac-upgrade",

    fridge_basic: "store-fridge-basic",
    fridge_maintain: "store-fridge-maintain",
    fridge_upgrade: "store-fridge-upgrade",

    delivery_basic: "store-delivery-basic",
    delivery_weekly: "store-delivery-weekly",
    delivery_batch: "store-delivery-batch",

    pack_basic: "store-pack-basic",
    pack_reduce: "store-pack-reduce",
    pack_reuse: "store-pack-reuse",

    staff_basic: "store-staff-basic",
    staff_transit: "store-staff-transit",
    staff_schedule: "store-staff-schedule"
  };

  const btn = document.getElementById(buttonMap[key]);
  if (btn) btn.classList.add("selected-choice");

  updateStoreBudget();
  updateStoreSelectionStatus();
}

function updateStoreSelectionStatus() {
  const box = document.getElementById("storeSelectionStatus");
  if (!box) return;

  const labels = {
    lighting: "照明管理",
    ac: "空調管理",
    fridge: "冷藏設備",
    delivery: "配送制度",
    packaging: "包材制度",
    staff: "員工通勤與排班"
  };

  const done = Object.values(storeSelections).filter(Boolean).length;

  const lines = Object.keys(storeSelections).map(section => {
    const option = getSelectedStoreOption(section);
    if (!option) return `• ${labels[section]}：尚未選擇`;
    return `• ${labels[section]}：${option.label}`;
  });

  box.innerHTML = `
    已完成 ${done} / 6 項營運選擇。<br><br>
    ${lines.join("<br>")}
  `;
}

function finishStoreChecklist() {
  const resultBox = document.getElementById("storeResultBox");
  const aboutBtn = document.getElementById("aboutAfterFinish");
  if (!resultBox) return;

  const raw = localStorage.getItem("lastCoffeePlan");
  if (!raw) {
    resultBox.className = "summary-box emission-medium";
    resultBox.innerHTML = "請先完成實戰方案，再回來查看整體結果。";
    if (aboutBtn) aboutBtn.style.display = "none";
    return;
  }

  const allDone = Object.values(storeSelections).every(Boolean);
  if (!allDone) {
    resultBox.className = "summary-box emission-medium";
    resultBox.innerHTML = "請先完成 6 項營運選擇，再查看結果。";
    if (aboutBtn) aboutBtn.style.display = "none";
    return;
  }

  let coffeeData;
  try {
    coffeeData = JSON.parse(raw);
  } catch (e) {
    resultBox.className = "summary-box emission-medium";
    resultBox.innerHTML = "上一關資料讀取失敗，請重新完成實戰方案。";
    if (aboutBtn) aboutBtn.style.display = "none";
    return;
  }

  let storeSpend = 0;
  let storeKg = 0;
  let spendLines = [];
  let pros = [];
  let cons = [];
  let expensiveItems = [];

  const sectionLabels = {
    lighting: "照明管理",
    ac: "空調管理",
    fridge: "冷藏設備",
    delivery: "配送制度",
    packaging: "包材制度",
    staff: "員工通勤與排班"
  };

  Object.keys(storeSelections).forEach(section => {
    const option = getSelectedStoreOption(section);
    if (option) {
      storeSpend += option.spend;
      storeKg += option.kg;
      spendLines.push(`• ${option.label}：NT$ ${option.spend} / ${option.kg} kg CO2e`);
      pros.push(`• ${option.label}：${option.pros}`);
      cons.push(`• ${option.label}：${option.cons}`);

      if (option.spend > 0) {
        expensiveItems.push({
          section: sectionLabels[section],
          label: option.label,
          spend: option.spend
        });
      }
    }
  });

  const budgetLeft = BUDGET_BASE - storeSpend;
  const storeSimulatedCarbonFee = kgToCarbonCost(storeKg);
  const totalKg = storeKg + coffeeData.totalKg;
  const totalSimulatedCarbonFee = storeSimulatedCarbonFee + coffeeData.simulatedCarbonFee;
  const levelInfo = getEmissionLevelInfo(totalKg);

  if (budgetLeft < 0) {
    const overAmount = Math.abs(budgetLeft);

    expensiveItems.sort((a, b) => b.spend - a.spend);

    const expensiveText = expensiveItems.length
      ? expensiveItems.map(item => `• ${item.section}｜${item.label}：NT$ ${item.spend}`).join("<br>")
      : "• 目前沒有額外花費項目";

    resultBox.className = "summary-box emission-high";
    resultBox.innerHTML = `
      <strong>結果揭曉：預算不足</strong><br><br>
      你的店面營運選擇總共花了 <strong>NT$ ${storeSpend}</strong>，已超出預算 <strong>NT$ ${overAmount}</strong>。<br><br>

      <strong>目前預算較吃重的項目</strong><br>
      ${expensiveText}<br><br>

      <strong>建議你優先檢查的地方</strong><br>
      可以先從金額較高的項目重新調整，例如高投入的照明、空調、冷藏設備或配送制度，看看是否要改成中階方案。<br><br>

      <strong>目前店面營運模擬碳排量：</strong> ${storeKg} kg CO2e<br>
      <strong>目前店面營運模擬碳費：</strong> NT$ ${storeSimulatedCarbonFee}<br>
      <strong>加上剛剛那杯咖啡後的整體模擬碳排量：</strong> ${totalKg} kg CO2e<br>
      <strong>加上剛剛那杯咖啡後的整體模擬碳費：</strong> NT$ ${totalSimulatedCarbonFee}
    `;

    if (aboutBtn) aboutBtn.style.display = "none";

    const p = getProgress();
    p.checklistDone = false;
    saveProgress(p);
    updateGlobalProgress();
    return;
  }

  resultBox.className = `summary-box ${levelInfo.className}`;
  resultBox.innerHTML = `
    <strong>整體結果</strong><br><br>

    <strong>剛剛那杯咖啡</strong><br>
    • ${coffeeData.title}<br>
    • 單杯模擬碳排量：${coffeeData.totalKg} kg CO2e<br>
    • 單杯模擬碳費：NT$ ${coffeeData.simulatedCarbonFee}<br><br>

    <strong>整間店營運選擇</strong><br>
    ${spendLines.join("<br>")}<br><br>

    <strong>店面營運總花費：</strong> NT$ ${storeSpend}<br>
    <strong>剩餘預算：</strong> NT$ ${budgetLeft}<br>
    <strong>店面營運模擬碳排量：</strong> ${storeKg} kg CO2e<br>
    <strong>店面營運模擬碳費：</strong> NT$ ${storeSimulatedCarbonFee}<br><br>

    <strong>整體總模擬碳排量（店面＋單杯咖啡）：</strong> ${totalKg} kg CO2e<br>
    <strong>整體總模擬碳費（店面＋單杯咖啡）：</strong> NT$ ${totalSimulatedCarbonFee}<br>
    <strong>整體排放等級：</strong> ${levelInfo.level}<br><br>

    <strong>優點</strong><br>
    ${pros.join("<br>")}<br><br>

    <strong>可能限制</strong><br>
    ${cons.join("<br>")}<br><br>

    <strong>管理提醒</strong><br>
    ${levelInfo.text}
  `;

  if (aboutBtn) aboutBtn.style.display = "flex";

  const p = getProgress();
  p.checklistDone = true;
  saveProgress(p);
  updateGlobalProgress();
}

function resetStoreChecklist() {
  storeSelections = {
    lighting: null,
    ac: null,
    fridge: null,
    delivery: null,
    packaging: null,
    staff: null
  };

  document.querySelectorAll(".choice-btn").forEach(btn => {
    btn.classList.remove("selected-choice");
  });

  updateStoreBudget();
  updateStoreSelectionStatus();

  const resultBox = document.getElementById("storeResultBox");
  if (resultBox) {
    resultBox.className = "summary-box";
    resultBox.innerHTML = "完成所有項目後，再查看整間店的總結果。";
  }

  const aboutBtn = document.getElementById("aboutAfterFinish");
  if (aboutBtn) {
    aboutBtn.style.display = "none";
  }

  const p = getProgress();
  p.checklistDone = false;
  saveProgress(p);
  updateGlobalProgress();
}

/* 整體進度 */
function updateGlobalProgress() {
  const p = getProgress();
  const keys = ["findCarbonDone", "classifyDone", "quizDone", "checklistDone"];
  const done = keys.filter(k => p[k]).length;
  const pct = Math.round(done / keys.length * 100);

  const globalBar = document.getElementById("globalProgress");
  const globalText = document.getElementById("globalProgressText");

  if (globalBar) globalBar.style.width = pct + "%";
  if (globalText) {
    globalText.textContent = `目前完成 ${done} / ${keys.length} 個重點學習活動，進度 ${pct}%。互動評估分數：${p.quizScore || 0}。`;
  }
}

function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  setActiveNav();
  initReveal();

  const page = document.body.dataset.page;
  if (page === "index") {
    resetAllProgress();
  }

  initFindGame();
  initDragDrop();
  loadStoreScenarioInfo();
  updateStoreBudget();
  updateStoreSelectionStatus();
  updateGlobalProgress();
});
// ============================================================
//  Health OS — AI Prompts v3
//  新增 no_appetite 挑战类型支持
// ============================================================

import type { UserProfile } from "../../types/health";

function goalLabel(goal: UserProfile["goal"]): string {
  const map = {
    weight_loss: "减脂瘦身",
    muscle_gain: "增肌塑形",
    maintain: "维持体重、提升健康",
    endurance: "提高耐力与体能",
  };
  return map[goal] ?? "综合健康";
}

function fitnessLabel(level: UserProfile["fitnessLevel"]): string {
  const map = { beginner: "初级", intermediate: "中级", advanced: "高级" };
  return map[level] ?? "初级";
}

function activityLabel(level: UserProfile["activityLevel"]): string {
  const map = { low: "低（久坐为主）", medium: "中（轻度活动）", high: "高（经常运动）" };
  return map[level] ?? "低";
}

function challengeLabel(c: UserProfile["mainChallenge"]): string {
  const map = {
    appetite: "食欲难控制（容易吃多）",
    motivation: "缺乏动力",
    time: "时间不够",
    no_appetite: "没有食欲（吃不下，难以摄入足够热量）",
  };
  return map[c] ?? "综合挑战";
}

function genderLabel(g: UserProfile["gender"]): string {
  const map = { male: "男性", female: "女性", other: "不便透露" };
  return map[g] ?? "不限";
}

function estimateCalories(p: UserProfile): string {
  const bmr =
    p.gender === "female"
      ? 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age - 161
      : 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + 5;
  const activityMultiplier =
    p.activityLevel === "high" ? 1.55 : p.activityLevel === "medium" ? 1.375 : 1.2;
  const tdee = Math.round(bmr * activityMultiplier);
  if (p.goal === "weight_loss") return `${tdee - 400}~${tdee - 200}`;
  if (p.goal === "muscle_gain") return `${tdee + 200}~${tdee + 400}`;
  return `${tdee - 100}~${tdee + 100}`;
}

function bmi(p: UserProfile): string {
  return (p.weightKg / ((p.heightCm / 100) ** 2)).toFixed(1);
}

// ─── Prompt 1：营养计划 ──────────────────────────────────────

export function nutritionPrompt(p: UserProfile): string {
  const dietStyleMap = {
    budget:   { label: "经济实惠型", desc: "食材简单易得、价格亲民，以鸡蛋、豆腐、鸡胸肉、时令蔬菜为主，控制整体花费。" },
    balanced: { label: "均衡适中型", desc: "兼顾营养与口感，食材多样，可以包含适量的牛肉、三文鱼、坚果等中等价位食材。" },
    premium:  { label: "豪华奢侈型", desc: "不限预算，追求最优营养和口感体验，可以使用和牛、帝王蟹、三文鱼刺身、松露、有机食材、进口超级食品等高端食材，每餐都要精致丰盛。" },
  };
  const style = dietStyleMap[p.dietStyle ?? "budget"];

  // 针对没食欲用户的额外营养指引
  const noAppetiteNote = p.mainChallenge === "no_appetite"
    ? `\n- 特别注意：用户食欲差、吃不下，请优先推荐热量密度高、体积小、易入口的食物（如坚果酱、全脂牛奶、香蕉、燕麦、鸡蛋、奶昔等），减少高纤维低热量食物的占比，每餐不要量太大，可以增加加餐次数到2次。`
    : "";

  return `
你是一位专业营养师。根据以下用户信息，制定一份7天个性化饮食计划。

【用户画像】
- 年龄：${p.age}岁 | 性别：${genderLabel(p.gender)}
- 身高：${p.heightCm}cm | 体重：${p.weightKg}kg | BMI：${bmi(p)}
- 主要目标：${goalLabel(p.goal)}
- 日常活动水平：${activityLabel(p.activityLevel)}
- 建议每日热量范围：${estimateCalories(p)} kcal
- 每周饮食预算：约 ¥${p.weeklyBudget}
- 饮食风格：${style.label} — ${style.desc}
- 最大挑战：${challengeLabel(p.mainChallenge)}${noAppetiteNote}

【要求】
1. 严格按照"${style.label}"风格选择食材，食材档次和描述要与该风格完全匹配。
2. weeklyPlan 必须包含完整7天：周一、周二、周三、周四、周五、周六、周日，不能省略任何一天。
2. 每天4餐（早/午/晚/加餐），每餐列出具体食物、热量、蛋白质(g)。不同天的食物要有变化，不要重复。
3. 食物选择要经济实惠、易于在中国普通超市购买。
4. keyPrinciples 给出3-5条针对该用户目标的核心饮食原则。
5. personalizedNote 必须结合用户的性别、年龄、BMI、目标给出1-2句个性化说明。

严格按以下 JSON 格式返回，不要输出任何其他内容。weeklyPlan 数组必须有7个元素：
{
  "dailyCalorieTarget": 数字,
  "macroSplit": { "protein": 蛋白质百分比, "carbs": 碳水百分比, "fat": 脂肪百分比 },
  "weeklyPlan": [
    {
      "day": "周一",
      "breakfast": { "name": "餐名", "foods": ["食物1","食物2"], "calories": 数字, "protein": 数字, "notes": "备注" },
      "lunch": { "name": "餐名", "foods": ["食物1","食物2"], "calories": 数字, "protein": 数字, "notes": "备注" },
      "dinner": { "name": "餐名", "foods": ["食物1","食物2"], "calories": 数字, "protein": 数字, "notes": "备注" },
      "snack": { "name": "加餐", "foods": ["食物1"], "calories": 数字, "protein": 数字 },
      "totalCalories": 数字
    },
    { "day": "周二", "breakfast": {...}, "lunch": {...}, "dinner": {...}, "snack": {...}, "totalCalories": 数字 },
    { "day": "周三", "breakfast": {...}, "lunch": {...}, "dinner": {...}, "snack": {...}, "totalCalories": 数字 },
    { "day": "周四", "breakfast": {...}, "lunch": {...}, "dinner": {...}, "snack": {...}, "totalCalories": 数字 },
    { "day": "周五", "breakfast": {...}, "lunch": {...}, "dinner": {...}, "snack": {...}, "totalCalories": 数字 },
    { "day": "周六", "breakfast": {...}, "lunch": {...}, "dinner": {...}, "snack": {...}, "totalCalories": 数字 },
    { "day": "周日", "breakfast": {...}, "lunch": {...}, "dinner": {...}, "snack": {...}, "totalCalories": 数字 }
  ],
  "keyPrinciples": ["原则1","原则2","原则3"],
  "personalizedNote": "个性化说明"
}
`;
}

// ─── Prompt 2：训练计划 ──────────────────────────────────────

export function workoutPrompt(p: UserProfile): string {
  const equipmentScenario = (() => {
    const el = p.equipmentList ?? "none";
    if (el === "gym") return "在健身房训练，可以使用所有健身房器械：杠铃、哑铃、器械架、跑步机、划船机、绳索机等。请推荐健身房标准训练动作。";
    if (el === "home" || p.hasEquipment) return `居家训练，有家用器材，可结合自重和器材训练。`;
    return "居家无器材训练，只能用自重动作，不得包含任何需要器械的动作。";
  })();

  return `
你是一位专业健身教练。根据以下信息，制定一份30天（以周为单位展示）的完整锻炼计划。

【用户画像】
- 年龄：${p.age}岁 | 性别：${genderLabel(p.gender)} | 体重：${p.weightKg}kg
- 健身水平：${fitnessLabel(p.fitnessLevel)}
- 每天可用时间：${p.availableMinutesPerDay}分钟
- 训练场地/器材：${equipmentScenario}
- 主要目标：${goalLabel(p.goal)}
- 最大挑战：${challengeLabel(p.mainChallenge)}

【要求】
1. weeklySchedule 包含7天（含至少1天休息日，标注 focus:"休息与恢复"）。
2. 每个训练日包含：热身(3项) + 主体训练(4-6个动作) + 冷身(2项)。
3. 每个动作必须有：名称、组数、次数/时间、针对肌肉群、1条技巧提示。
4. progressionLogic：说明第2/3/4周如何递进（增加重复/缩短休息/增加难度）。
5. personalizedNote：结合用户健身水平和挑战给出个性化建议。

严格按以下 JSON 格式返回：
{
  "overview": "计划总体说明",
  "weeklySchedule": [
    {
      "day": "周一",
      "focus": "训练重点",
      "warmup": ["热身动作1","热身动作2","热身动作3"],
      "exercises": [
        { "name": "动作名", "sets": 数字, "reps": "次数或时间", "muscleGroup": "肌肉群", "tip": "技巧" }
      ],
      "cooldown": ["冷身动作1","冷身动作2"],
      "durationMinutes": 数字
    }
  ],
  "progressionLogic": "4周递进说明",
  "safetyNote": "安全提示",
  "personalizedNote": "个性化说明"
}
`;
}

// ─── Prompt 3：断食指南 ──────────────────────────────────────

export function fastingPrompt(p: UserProfile): string {
  return `
你是一位有丰富经验的断食健康顾问。根据以下信息制定个性化断食方案。

【用户画像】
- 年龄：${p.age}岁 | 性别：${genderLabel(p.gender)} | 体重：${p.weightKg}kg
- 目标：${goalLabel(p.goal)}
- 睡眠时间：${p.sleepTime} | 起床时间：${p.wakeTime}
- 断食经验：新手
- 日常活动：${activityLabel(p.activityLevel)}

【断食窗口计算规则 — 必须严格遵守】
断食窗口应围绕用户的睡眠时间自然延伸，让睡眠时间成为断食的一部分：
- 用户 ${p.wakeTime} 起床，${p.sleepTime} 入睡
- 推荐 16:8 方案时：起床后延迟进食4小时，即 eatStart = 起床时间+4小时，eatEnd = eatStart+8小时，fastStart = eatEnd
- 推荐 14:10 方案时：起床后延迟进食2小时，即 eatStart = 起床时间+2小时，eatEnd = eatStart+10小时，fastStart = eatEnd
- 例：起床06:00，16:8方案 → eatStart=10:00，eatEnd=18:00，fastStart=18:00（断食从晚6点到次日10点，共16小时）
- fastEnd 等于 eatStart

【要求】
1. 根据用户作息推荐最合适的断食方案，新手建议从14:10开始。
2. 严格按上方计算规则填写 windows 字段，确保逻辑自洽。
3. hourlyGuide 从起床时间开始，每2小时一个节点，共列出8-10个节点。
4. 针对新手给出5条入门技巧。
5. personalizedNote 结合用户作息和活动水平给出个性化建议。

严格按以下 JSON 格式返回：
{
  "recommendedProtocol": "16:8",
  "rationale": "推荐原因",
  "windows": {
    "fastStart": "时间",
    "fastEnd": "时间",
    "eatStart": "时间",
    "eatEnd": "时间",
    "fastingHours": 数字
  },
  "hourlyGuide": [
    { "time": "06:30", "status": "fasting", "action": "建议行动" }
  ],
  "fastingAllowed": ["允许的食物/饮料1","允许的食物/饮料2"],
  "eatingWindowAdvice": ["进食窗口建议1","进食窗口建议2","进食窗口建议3"],
  "beginnerTips": ["新手技巧1","新手技巧2","新手技巧3","新手技巧4","新手技巧5"],
  "personalizedNote": "个性化说明"
}
`;
}

// ─── Prompt 4：购物清单 ──────────────────────────────────────

export function shoppingPrompt(p: UserProfile): string {
  const dietStyleMap = {
    budget:   { label: "经济实惠型", desc: "优先选择超市特价品、当季蔬菜、鸡蛋豆腐等平价高蛋白食材，总花费越低越好。" },
    balanced: { label: "均衡适中型", desc: "兼顾性价比与品质，可以包含牛肉、三文鱼等中等价位食材，追求营养均衡。" },
    premium:  { label: "豪华奢侈型", desc: "不限预算，选择最优质的食材。真实市场参考价：和牛牛排200g约¥300-500、帝王蟹500g约¥400-800、新鲜三文鱼刺身200g约¥150-250、松露少量约¥200-500、有机蔬菜约¥30-80/份、进口坚果礼盒约¥200-400。请按这个价格档次推荐，estimatedCost必须反映真实高端市价，不能低估。" },
  };
  const style = dietStyleMap[p.dietStyle ?? "budget"];

  return `
你是一位营养师兼经济购物专家。根据以下信息制定一周购物清单。

【用户画像】
- 年龄：${p.age}岁 | 性别：${genderLabel(p.gender)}
- 目标：${goalLabel(p.goal)}
- 每周饮食预算：¥${p.weeklyBudget} 人民币
- 活动水平：${activityLabel(p.activityLevel)}
- 饮食风格：${style.label} — ${style.desc}

【要求】
1. 严格按照"${style.label}"风格选择食材，食材档次必须与风格完全匹配。豪华型不要出现普通鸡胸肉，经济型不要出现和牛。
2. 所有金额单位为人民币（元）。${p.dietStyle === "premium" ? "豪华型不受预算限制，大胆推荐高端食材。" : "总费用控制在预算 ¥" + p.weeklyBudget + " 以内。"}
2. budgetUsagePercent 显示预算使用比例(0-100)。
3. items 必须涵盖全部6大类，每类至少2-3项，总计不少于15项食物：
   - 蛋白质(protein)：鸡胸肉、鸡蛋、豆腐、鱼等至少3项
   - 碳水(carbs)：米饭/燕麦/红薯/全麦面包等至少2项
   - 健康脂肪(healthy_fats)：坚果/橄榄油/牛油果等至少2项
   - 蔬菜水果(vegetables_fruits)：至少4项不同蔬菜/水果
   - 零食(snacks)：健康零食至少2项
   - 调味料(condiments)：至少2项
4. 每项必须包含：名称、数量、估计费用（人民币元）、分类、1条购买技巧。
5. 优先选择中国超市常见、性价比高的食物。
6. personalizedNote 根据用户目标和预算给出省钱建议。

严格按以下 JSON 格式返回，items 数组不少于15个元素：
{
  "totalEstimatedCost": 数字,
  "budgetUsagePercent": 数字,
  "items": [
    { "name": "鸡胸肉", "quantity": "500g", "estimatedCost": 15, "category": "protein", "tip": "冷冻装更便宜" },
    { "name": "鸡蛋", "quantity": "10个", "estimatedCost": 8, "category": "protein", "tip": "散养蛋营养更好" },
    { "name": "北豆腐", "quantity": "400g", "estimatedCost": 4, "category": "protein", "tip": "蛋白质丰富且便宜" },
    ...至少15项
  ],
  "mealPrepTips": ["备餐技巧1","备餐技巧2","备餐技巧3"],
  "budgetTip": "整体省钱建议",
  "personalizedNote": "个性化说明"
}
`;
}

// ─── Prompt 5：每日动力 ──────────────────────────────────────

export function motivationPrompt(p: UserProfile): string {
  // 针对没食欲用户的专属动力策略
  const noAppetiteStrategy = p.mainChallenge === "no_appetite" ? `
【没有食欲的专项策略】
该用户的核心挑战是吃不下、没食欲，这是增肌路上最大的障碍。请重点围绕这个挑战：
- dailyTask：给一个今天能执行的"让自己多吃一口"的具体小任务，比如在某餐加一勺花生酱或多喝一杯全脂牛奶
- mindsetShift：帮助用户把"吃饭"从负担变成工具，从"我不饿"转变为"这是我增肌的训练之一"
- morningRoutine：包含一个帮助刺激食欲的早晨习惯（如晨练、冷热水交替淋浴等）
` : "";

  return `
你是一位高效的个人动力教练。根据以下用户信息，生成一套每日动力方案。

【用户画像】
- 年龄：${p.age}岁 | 性别：${genderLabel(p.gender)}
- 目标：${goalLabel(p.goal)}
- 最大挑战：${challengeLabel(p.mainChallenge)}
- 健身水平：${fitnessLabel(p.fitnessLevel)}
${noAppetiteStrategy}
【要求】
1. fatLossTip：1条针对该用户目标的具体、可执行健康小贴士（不是废话）。
2. quote：1条励志名言，配上作者。
3. dailyTask：1个今天立刻能做的具体小任务（结合用户的最大挑战）。
4. morningRoutine：3个让早晨更有活力的小习惯，简短有力。
5. mindsetShift：1个帮助克服用户最大挑战的思维转变。
6. 风格：清晰、现实、有力但不夸张，避免空洞口号。

严格按以下 JSON 格式返回：
{
  "fatLossTip": "贴士内容",
  "quote": "名言内容",
  "quoteAuthor": "作者",
  "dailyTask": "今日任务",
  "morningRoutine": ["习惯1","习惯2","习惯3"],
  "mindsetShift": "思维转变",
  "personalizedNote": "个性化鼓励语"
}
`;
}

// ─── Prompt 6：水&睡眠优化 ───────────────────────────────────

export function hydrationSleepPrompt(p: UserProfile): string {
  return `
你是一位生活方式与生物节律专家。根据以下信息制定饮水与睡眠优化方案。

【用户画像】
- 年龄：${p.age}岁 | 性别：${genderLabel(p.gender)} | 体重：${p.weightKg}kg
- 目标：${goalLabel(p.goal)}
- 睡眠时间：${p.sleepTime} | 起床时间：${p.wakeTime}
- 活动水平：${activityLabel(p.activityLevel)}

【要求】
1. dailyWaterTarget：根据体重和活动水平计算每日饮水目标(ml)。
   公式：体重(kg) × 33ml（低活动）/ × 38ml（中）/ × 43ml（高）。
   结果必须在 1500ml 到 3500ml 之间，超出则取边界值。
   例：60kg 低活动 = 60×33 = 1980ml。请直接输出整数，不要输出升数。
2. hydrationSchedule：从起床到睡前，至少8个饮水节点，每次注明时间、量、备注。
3. eveningRoutine：3-5个改善睡眠的晚间习惯，结合用户睡眠时间。
4. morningHabits：3个帮助早晨更有精力的习惯。
5. scienceNote：用简洁科学语言说明水合与睡眠质量的关系（2-3句话）。
6. personalizedNote：结合用户体重、活动水平、目标给出个性化建议。

严格按以下 JSON 格式返回：
{
  "dailyWaterTarget": 数字,
  "hydrationSchedule": [
    { "time": "06:30", "amount": "400ml", "note": "起床后第一杯" }
  ],
  "eveningRoutine": ["晚间习惯1","晚间习惯2","晚间习惯3"],
  "morningHabits": ["早晨习惯1","早晨习惯2","早晨习惯3"],
  "sleepOptimizationTips": ["睡眠优化建议1","睡眠优化建议2"],
  "scienceNote": "科学说明",
  "personalizedNote": "个性化说明"
}
`;
}

// ─── Prompt 7：生活方式减脂 ──────────────────────────────────

export function lifestylePrompt(p: UserProfile): string {
  const lifestyleMap = {
    sedentary: "久坐生活方式（办公室/学生）",
    light_active: "轻度活跃（偶尔走动）",
    moderate_active: "中度活跃（有规律轻度运动）",
    very_active: "非常活跃（体力劳动/高强度运动）",
  };

  return `
你是一位可持续健康与生活方式改善专家。根据以下信息制定长期生活方式改善方案。

【用户画像】
- 年龄：${p.age}岁 | 性别：${genderLabel(p.gender)}
- 体重：${p.weightKg}kg | 目标：${goalLabel(p.goal)}
- 生活方式类型：${lifestyleMap[p.lifestyleType] ?? "普通"}
- 日常活动：${activityLabel(p.activityLevel)}
- 最大困难：${challengeLabel(p.mainChallenge)}

【要求】
1. 制定涵盖4个维度的长期习惯方案：营养(nutrition) / 日常活动(activity) / 心态(mindset) / 生活方式(lifestyle)。
2. 每个习惯包含：类别、习惯名称、执行频率、具体做法、为什么有效。
3. weeklyMilestones：4条分别对应第1/2/3/4周的可观察里程碑。
4. challengeStrategy：专门针对用户"最大困难"给出3-5条具体应对策略。
5. 强调长期可持续性，避免短期节食心态。
6. headline：为该用户写一条个性化的激励标语（一句话）。

严格按以下 JSON 格式返回：
{
  "headline": "个性化激励标语",
  "habits": [
    {
      "category": "nutrition",
      "habit": "习惯名称",
      "frequency": "每天",
      "howTo": "具体做法",
      "whyItWorks": "原理说明"
    }
  ],
  "weeklyMilestones": ["第1周里程碑","第2周里程碑","第3周里程碑","第4周里程碑"],
  "challengeStrategy": "针对最大困难的应对策略（段落文字）",
  "longTermVision": "长期愿景描述",
  "personalizedNote": "个性化说明"
}
`;
}

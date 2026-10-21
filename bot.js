const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ytdl = require("ytdl-core");
const DataManager = require("./dataManager");

const APPSTATE_FILE = "appstate.json";
const COMMAND_COOLDOWN = 3000;
const data = new DataManager();

// --- ADMIN CONFIGURATION ---
const DEVELOPER_ID = "61593976169222";
const SUPER_ADMIN_ID = "61593976169222";
const BOT_USER_ID_TO_DETECT = "61595110707207";

let ADMIN_IDS = [
  "61593976169222"
];
// ---------------------------

let api = null;
let botUserId = null;

const userCooldowns = new Map();
const spamDetection = new Map();
const unsentSpamTracking = new Map();
const lastUnsentImage = new Map();

function isSuperAdmin(userID) { return userID === SUPER_ADMIN_ID; }
function isDeveloper(userID) { return userID === DEVELOPER_ID; }
function isProtectedUser(userID) { return userID === DEVELOPER_ID || userID === SUPER_ADMIN_ID; }
function isAdmin(threadID, userID) {
  if (isProtectedUser(userID)) return true;
  if (ADMIN_IDS.includes(userID)) return true;
  const groupAdmins = data.getGroupAdmins(threadID);
  return groupAdmins.includes(userID);
}

function loadAppState() {
  if (fs.existsSync(APPSTATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(APPSTATE_FILE, "utf8"));
    } catch (error) {
      console.error("✗ Failed to load appstate:", error.message);
      return null;
    }
  }
  return null;
}

function saveAppState(appState) {
  try {
    fs.writeFileSync(APPSTATE_FILE, JSON.stringify(appState, null, 2));
  } catch (error) {
    console.error("✗ Failed to save appstate:", error.message);
  }
}

async function initializeBot() {
  const login = require("@dongdev/fca-unofficial");
  const appState = loadAppState();
  if (!appState) {
    console.error("=== LOGIN REQUIRED ===\nPlease create appstate.json");
    process.exit(1);
  }

  if (!fs.existsSync("./cache")) fs.mkdirSync("./cache");

  console.log("🤖 Starting bot login...");
  
  const loginOptions = {
    forceLogin: true,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    listenEvents: true,
    autoMarkDelivery: false,
    autoMarkRead: false,
    online: true,
    selfListen: false
  };
  
  return new Promise((resolve, reject) => {
    login({ appState }, loginOptions, (err, fbApi) => {
      if (err) {
        console.error("✗ Login failed:", err);
        reject(err);
        return;
      }

      console.log("✓ Login successful!");
      api = fbApi;
      botUserId = api.getCurrentUserID();
      
      api.setOptions({ listenEvents: true, selfListen: false, updatePresence: true });
      saveAppState(api.getAppState());

      setupEventListeners();
      startDailyReset();
      startPeriodicAppStateSave();
      startPeriodicBanCheck();

      console.log("✓ Bot is now running...");
      resolve(api);
    });
  });
}

function setupEventListeners() {
  api.listenMqtt((err, event) => {
    if (err) {
      console.error("Listen error:", err);
      if (err.error === "Not logged in") process.exit(1);
      return;
    }
    handleEvent(event).catch(e => console.error("Event handling error:", e));
  });
}

async function handleEvent(event) {
  switch (event.type) {
    case "message":
    case "message_reply": await handleMessage(event); break;
    case "message_unsend": await handleUnsendMessage(event); break;
    case "event": await handleGroupEvent(event); break;
  }
}

async function handleMessage(event) {
  const { threadID, messageID, body, senderID, attachments } = event;
  data.cacheMessage(messageID, threadID, senderID, body, attachments || []);

  const hasBumpedMessage = event.messageReply && event.messageReply.body;
  if (!body && !hasBumpedMessage) return;

  const message = body ? body.trim() : "";
  
  if (message) {
    if (await checkMessageSpam(threadID, messageID, senderID, message)) return;
    await checkMentionWarning(threadID, messageID, senderID, message, event);
  }
  
  if (!message.startsWith(".إضافة_تحذير") && !message.startsWith(".حذف_كلمة")) {
    await checkForVulgarWords(threadID, messageID, senderID, message, event);
  }
  
  if (message.startsWith(". ")) {
    const cmd = message.substring(2).trim();
    sendMessage(threadID, `⚠️ صيغة خاطئة. جرب هكذا: .${cmd}`, messageID);
    return;
  }
  
  if (!message.startsWith(".")) return;
  if (!checkCooldown(senderID, threadID) && !isProtectedUser(senderID)) return;

  console.log("🔍 Processing command:", message);

  // توجيه الأوامر باللغة العربية
  if (message.startsWith(".مساعدة") || message.startsWith(".help")) await handleHelpCommand(threadID, messageID, senderID, message);
  else if (message === ".فحص" || message === ".test") sendMessage(threadID, "✅ البوت يعمل بشكل ممتاز وجاهز!", messageID);
  else if (message === ".حضور" || message === ".present") await handlePresentCommand(threadID, messageID, senderID);
  else if (message === ".قائمة_حضور" || message === ".attendance") await handleAttendanceCommand(threadID, messageID);
  else if (message === ".المغيبين" || message === ".attendancelist") await handleAttendanceListCommand(threadID, messageID);
  else if (message === ".تصفير_حضور" || message === ".attendancereset") await handleAttendanceResetCommand(threadID, messageID, senderID);
  else if (message.startsWith(".تصفير_غياب") || message.startsWith(".resetatt")) await handleResetAttCommand(threadID, messageID, senderID, event);
  else if (message.startsWith(".استثناء") || message.startsWith(".attendanceexl")) await handleAttendanceExcludeCommand(threadID, messageID, senderID, event);
  else if (message.startsWith(".إلغاء_استثناء") || message.startsWith(".attendanceback")) await handleAttendanceIncludeCommand(threadID, messageID, senderID, event);
  else if (message.startsWith(".ترحيب") || message.startsWith(".setgreeting")) await handleSetGreetingCommand(threadID, messageID, senderID, message);
  else if (message === ".المحظورين" || message === ".banned") await handleBannedCommand(threadID, messageID);
  else if (message.startsWith(".إضافة_تحذير") || message.startsWith(".addwarning")) await handleAddWarningKeywordCommand(threadID, messageID, senderID, message);
  else if (message.startsWith(".حذف_كلمة") || message.startsWith(".removeword")) await handleRemoveWarningKeywordCommand(threadID, messageID, senderID, message);
  else if (message.startsWith(".تحذير") || message.startsWith(".warning")) await handleManualWarningCommand(threadID, messageID, senderID, event);
  else if (message.startsWith(".إزالة_تحذير") || message.startsWith(".unwarning")) await handleUnwarningCommand(threadID, messageID, senderID, event);
  else if (message === ".قائمة_التحذيرات" || message === ".warninglist") await handleWarningListCommand(threadID, messageID);
  else if (message.startsWith(".حظر") || message.startsWith(".ban")) await handleBanCommand(threadID, messageID, senderID, event);
  else if (message.startsWith(".رفع_حظر") || message.startsWith(".unban")) await handleUnbanCommand(threadID, messageID, senderID, event);
  else if (message === ".وضع_الحرب" || message === ".warextreme") await handleWarExtremeCommand(threadID, messageID, senderID);
  else if (message === ".سلام" || message === ".peace") await handlePeaceCommand(threadID, messageID, senderID);
  else if (message === ".إيقاف" || message === ".shutdown") await handleShutdownCommand(threadID, messageID, senderID);
  else if (message.startsWith(".طرد") || message.startsWith(".kick")) await handleKickCommand(threadID, messageID, senderID, event);
  else if (message === ".فون" || message === ".von") await handleVonCommand(threadID, messageID);
  else if (message.startsWith(".إضافة_مشرف") || message.startsWith(".addmin")) await handleAddAdminCommand(threadID, messageID, senderID, event);
  else if (message.startsWith(".حذف_مشرف") || message.startsWith(".removeadmin")) await handleRemoveAdminCommand(threadID, messageID, senderID, event);
  else if (message === ".قائمة_المشرفين" || message === ".adminlist") await handleAdminListCommand(threadID, messageID);
  else if (message === ".حظر_الكل" || message === ".banall") await handleBanAllCommand(threadID, messageID, senderID);
  else if (message === ".مسح_الحظر" || message === ".removeallbans") await handleRemoveAllBansCommand(threadID, messageID, senderID);
  else if (message === ".مسح_التحذيرات" || message === ".removeallwarnings") await handleRemoveAllWarningsCommand(threadID, messageID, senderID);
  else if (message === ".السيرفر" || message === ".server") await handleServerCommand(threadID, messageID);
  else if (message.startsWith(".معلومات_السيرفر") || message.startsWith(".serverinfo")) await handleServerInfoCommand(threadID, messageID, senderID, message);
  else if (message === ".المحذوفات" || message === ".unsent") await handleUnsentCommand(threadID, messageID);
  else if (message.startsWith(".تشغيل") || message.startsWith(".play")) await handlePlayCommand(threadID, messageID, senderID, message);
  // أوامر طلبات الانضمام
  else if (message === ".الطلبات" || message === ".pendinglist") await handlePendingListCommand(threadID, messageID, senderID);
  else if (message.startsWith(".قبول") || message.startsWith(".approve")) await handleApproveCommand(threadID, messageID, senderID, message);
  else await handleInvalidCommand(threadID, messageID, senderID, message);
}

function checkCooldown(senderID, threadID) {
  const key = `${threadID}_${senderID}`;
  const now = Date.now();
  const last = userCooldowns.get(key);
  if (last && now - last < COMMAND_COOLDOWN) return false;
  userCooldowns.set(key, now);
  return true;
}

// --- دالة قائمة المساعدة بالعربية ---
async function handleHelpCommand(threadID, messageID, senderID, message) {
  const userIsAdmin = isAdmin(threadID, senderID);
  const pageMatch = message.match(/(?:\.مساعدة|\.help)\s+(\d+)/);
  const requestedPage = pageMatch ? parseInt(pageMatch[1]) : 1;
  
  const userCommands = [
    ".مساعدة - عرض قائمة الأوامر هذه",
    ".فحص - التحقق من أن البوت يعمل",
    ".حضور - تسجيل حضورك الشخصي",
    ".قائمة_حضور - عرض جدول الحضور اليومي",
    ".المغيبين - عرض قائمة المتغيبين عن الحضور",
    ".قائمة_التحذيرات - عرض تحذيرات الأعضاء",
    ".المحظورين - عرض قائمة المحظورين",
    ".السيرفر - عرض معلومات السيرفر",
    ".المحذوفات - إعادة إرسال آخر صورة حُذفت",
    ".تشغيل <رابط> - تشغيل صوت من يوتيوب (أقل من 4 دقائق)"
  ];
  
  const adminCommands = [
    ".قائمة_المشرفين - عرض مشرفي القروب",
    ".الطلبات - عرض كيفية قبول الأعضاء",
    ".قبول <آيدي أو الاسم> - الموافقة على انضمام عضو",
    ".تصفير_حضور - تصفير الحضور يدوياً",
    ".تصفير_غياب @mention - تصفير أيام الغياب لعضو",
    ".استثناء @mention - استثناء عضو من الحضور مؤقتاً",
    ".إلغاء_استثناء @mention - إعادة العضو المستثنى لحساب الحضور",
    ".ترحيب [النص] - تعيين رسالة ترحيب مخصصة",
    ".معلومات_السيرفر [ip:port] - تسجيل معلومات السيرفر",
    ".إضافة_تحذير [كلمة1, كلمة2...] - إضافة كلمات ممنوعة للتحذير التلقائي",
    ".حذف_كلمة [كلمة1, كلمة2...] - إزالة كلمة ممنوعة",
    ".تحذير @mention [السبب] - إعطاء تحذير لعضو",
    ".إزالة_تحذير @mention - خصم تحذير من عضو",
    ".طرد @mention [السبب] - طرد عضو من القروب",
    ".حظر @mention [السبب] - حظر وطرد عضو نهائياً",
    ".رفع_حظر [آيدي الحظر] - رفع الحظر عن عضو",
    ".إيقاف - إيقاف تشغيل البوت"
  ];

  const developerCommands = [
    ".إضافة_مشرف @mention - ترقية عضو لمشرف (للمطور فقط)",
    ".حذف_مشرف @mention - سحب الإشراف من عضو (للمطور فقط)",
    ".حظر_الكل - حظر الجميع في القروب (للمطور فقط)",
    ".مسح_الحظر - حذف كل سجلات الحظر",
    ".مسح_التحذيرات - مسح جميع التحذيرات"
  ];

  let availableCommands = [...userCommands];
  if (userIsAdmin) availableCommands = availableCommands.concat(adminCommands);
  if (isProtectedUser(senderID)) availableCommands = availableCommands.concat(developerCommands);
  
  const commandsPerPage = 5;
  const totalPages = Math.ceil(availableCommands.length / commandsPerPage);
  
  if (requestedPage < 1 || requestedPage > totalPages) {
    sendMessage(threadID, `❌ رقم الصفحة غير صحيح. الصفحات المتاحة: 1-${totalPages}`, messageID);
    return;
  }
  
  const startIndex = (requestedPage - 1) * commandsPerPage;
  const endIndex = Math.min(startIndex + commandsPerPage, availableCommands.length);
  const pageCommands = availableCommands.slice(startIndex, endIndex);
  
  let helpMessage = `🤖 أوامر البوت (الصفحة ${requestedPage}/${totalPages})\n\n`;
  pageCommands.forEach(cmd => helpMessage += `${cmd}\n\n`);
  
  if (requestedPage < totalPages) helpMessage += `\nاكتب .مساعدة ${requestedPage + 1} للانتقال للصفحة التالية`;
  
  sendMessage(threadID, helpMessage.trim(), messageID);
}

// --- بقية دوال الأوامر الأساسية ---
async function handlePresentCommand(threadID, messageID, senderID) {
  if (isProtectedUser(senderID) || isAdmin(threadID, senderID)) {
    sendMessage(threadID, "❌ المشرفون غير مشمولين في الحضور والغياب.", messageID);
    return;
  }
  const info = await getThreadInfo(threadID);
  if (!info) return;
  if (!info.participantIDs.includes(senderID)) {
    sendMessage(threadID, "لست عضواً في هذه المجموعة.", messageID);
    return;
  }
  const name = info.nicknames?.[senderID] || (await getUserInfo(senderID)).name;
  if (data.markPresent(threadID, senderID, name)) {
    sendMessage(threadID, `⚠️ لقد سجلت حضورك مسبقاً يا ${name}.`, messageID);
  } else {
    sendMessage(threadID, `✅ تم تسجيل حضورك بنجاح يا ${name}!`, messageID);
  }
}

async function handleAttendanceCommand(threadID, messageID) {
  const info = await getThreadInfo(threadID);
  if(!info) return;
  await updateGroupMembers(threadID, info);
  const att = data.getAttendance(threadID);
  let msg = `📋 سجل الحضور (${data.getTodayDate()})\n\n`;
  att.members.forEach(m => msg += `${m.present ? '✅' : '❌'} ${info.nicknames?.[m.userID] || m.nickname}\n`);
  sendMessage(threadID, msg, messageID);
}

async function handleAttendanceListCommand(threadID, messageID) {
  const info = await getThreadInfo(threadID);
  if(!info) return;
  await updateGroupMembers(threadID, info);
  const missed = data.getMissedAttendanceList(threadID);
  let msg = `📋 قائمة المتغيبين\n\n`;
  missed.forEach((m, i) => msg += `${i+1}. ${info.nicknames?.[m.userID] || m.nickname} ${m.consecutiveAbsences > 0 ? '💔'.repeat(m.consecutiveAbsences) : ''}\n`);
  sendMessage(threadID, msg, messageID);
}

async function handleAttendanceResetCommand(threadID, messageID, senderID) {
  if (!isAdmin(threadID, senderID)) return;
  data.manualResetAttendance(threadID);
  sendMessage(threadID, "✅ تمت إعادة تعيين الحضور بنجاح.", messageID);
}

async function handleResetAttCommand(threadID, messageID, senderID, event) {
  if (!isAdmin(threadID, senderID)) return;
  const target = Object.keys(event.mentions || {})[0] || (event.messageReply ? event.messageReply.senderID : null);
  if (target && data.resetConsecutiveAbsences(threadID, target)) {
    sendMessage(threadID, "✅ تم تصفير أيام الغياب المتتالية بنجاح.", messageID);
  } else {
    sendMessage(threadID, "❌ الاستخدام الصحيح: .تصفير_غياب @منشن", messageID);
  }
}

async function handleAttendanceExcludeCommand(threadID, messageID, senderID, event) {
  if (!isAdmin(threadID, senderID)) return;
  const target = Object.keys(event.mentions || {})[0];
  if (!target) return sendMessage(threadID, "❌ الاستخدام الصحيح: .استثناء @منشن", messageID);
  const info = await getUserInfo(target);
  if(data.excludeMember(threadID, target, info.name)) sendMessage(threadID, "✅ تم استثناء العضو من الحضور.", messageID);
}

async function handleAttendanceIncludeCommand(threadID, messageID, senderID, event) {
  if (!isAdmin(threadID, senderID)) return;
  const target = Object.keys(event.mentions || {})[0];
  if (!target) return sendMessage(threadID, "❌ الاستخدام الصحيح: .إلغاء_استثناء @منشن", messageID);
  if(data.includeMember(threadID, target)) sendMessage(threadID, "✅ تم إرجاع العضو لحساب الحضور.", messageID);
}

async function handleSetGreetingCommand(threadID, messageID, senderID, message) {
  if (!isAdmin(threadID, senderID)) return;
  const text = message.replace(/^\.ترحيب\s+|^\.setgreeting\s+/, "");
  data.setGreeting(threadID, text);
  sendMessage(threadID, `✅ تم تحديث رسالة الترحيب:\n${text}`, messageID);
}

// --- نظام فحص السبام والكلمات الممنوعة ---
async function checkMessageSpam(threadID, messageID, senderID, message) {
  if (isProtectedUser(senderID)) return false;
  const key = `spam_${threadID}_${senderID}`;
  const now = Date.now();
  if (!spamDetection.has(key)) spamDetection.set(key, { msgs: [], last: now });
  const d = spamDetection.get(key);
  if (now - d.last > 10000) { d.msgs = []; d.last = now; }
  d.msgs.push(message);
  if (d.msgs.length >= 5 && d.msgs.every(m => m === d.msgs[0])) {
    await issueWarning(threadID, messageID, senderID, {body: message}, "إرسال رسائل مكررة (سبام)", true);
    spamDetection.delete(key);
    return true;
  }
  return false;
}

async function checkMentionWarning(threadID, messageID, senderID, message, event) {
  if (isProtectedUser(senderID)) return;
  if (event.mentions[BOT_USER_ID_TO_DETECT] && !message.toLowerCase().includes("tensura")) {
    const kws = data.getWarningKeywords(threadID);
    const norm = normalizeForDetection(message);
    for (const kw of kws) {
      if (norm.includes(normalizeForDetection(kw))) {
        await issueWarning(threadID, messageID, senderID, event, "كلمة ممنوعة عند منشن البوت");
        return;
      }
    }
  }
}

function normalizeFancyUnicode(text) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.codePointAt(i);
    let normalized = null;
    if (code >= 0x24B6 && code <= 0x24CF) normalized = String.fromCharCode(code - 0x24B6 + 0x41);
    else if (code >= 0x24D0 && code <= 0x24E9) normalized = String.fromCharCode(code - 0x24D0 + 0x61);
    else if (code >= 0xFF21 && code <= 0xFF3A) normalized = String.fromCharCode(code - 0xFF21 + 0x41);
    else if (code >= 0xFF41 && code <= 0xFF5A) normalized = String.fromCharCode(code - 0xFF41 + 0x61);
    else {
      const lookalikes = {
        'Α':'a','Β':'b','Ε':'e','Ζ':'z','Η':'h','Ι':'i','Κ':'k','Μ':'m','Ν':'n','Ο':'o','Ρ':'p','Τ':'t','Υ':'y','Χ':'x','Γ':'g','Δ':'d','Θ':'t','Λ':'l','Ξ':'x','Π':'p','Σ':'s','Φ':'f','Ψ':'p','Ω':'w',
        'α':'a','β':'b','γ':'g','δ':'d','ε':'e','ζ':'z','η':'h','θ':'t','ι':'i','κ':'k','λ':'l','μ':'m','ν':'n','ξ':'x','ο':'o','π':'p','ρ':'r','σ':'s','ς':'s','τ':'t','υ':'y','φ':'f','χ':'x','ψ':'p','ω':'w',
        '0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b',
        '@':'a','$':'s','!':'i','+':'t'
      };
      normalized = lookalikes[String.fromCodePoint(code)] || String.fromCodePoint(code);
    }
    result += normalized;
    if (code > 0xFFFF) i++;
  }
  return result;
}

function normalizeForDetection(text) {
  let normalized = normalizeFancyUnicode(text).toLowerCase();
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalized;
}

const SAFE_WORDS = [];

function collapseRepeated(str) { return str.replace(/(.)\1+/g, '$1'); }
function isMatchSafe(text, keyword, safeWords) { return false; }
function createFlexiblePattern(normalizedKeyword) { return new RegExp(escapeRegex(normalizedKeyword), 'i'); }
function escapeRegex(string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

async function checkForVulgarWords(threadID, messageID, senderID, message, event) {
  if (data.isWarExtremeMode(threadID) || isProtectedUser(senderID)) return;
  const keywords = data.getWarningKeywords(threadID);
  const normalizedMessage = normalizeForDetection(message);
  
  for (const keyword of keywords) {
    const normKw = normalizeForDetection(keyword);
    if (normalizedMessage.includes(normKw)) {
      await issueWarning(threadID, messageID, senderID, event, `استخدام كلمة ممنوعة: "${keyword}"`);
      return;
    }
  }
}

async function issueWarning(threadID, messageID, senderID, event, reason, isPermanent = false) {
  const threadInfo = label = await getThreadInfo(threadID);
  if (!threadInfo) return;
  const userInfo = await getUserInfo(senderID);
  if (!userInfo) return;
  const nickname = threadInfo.nicknames?.[senderID] || userInfo.name;
  const warningCount = data.addWarning(threadID, senderID, nickname, reason, messageID, isPermanent);
  
  if (isPermanent) {
    sendMessage(threadID, `🔒 لقد تلقى ${nickname} تحذيراً دائماً!\n\nالسبب: ${reason}`, messageID);
    return;
  }
  
  const warningSymbols = "⛔".repeat(warningCount);
  if (warningCount >= 3) {
    data.banMember(threadID, senderID, nickname, "تراكم 3 تحذيرات", "النظام");
    data.clearWarnings(threadID, senderID);
    sendMessage(threadID, `⚠️ تنبيه لـ ${nickname}!\n\nالسبب: ${reason}\nالتحذيرات: ${warningSymbols}\n\n❌ لقد بلغ المستخدم 3 تحذيرات وسيتم طرده الآن.`, messageID);
    setTimeout(() => api.removeUserFromGroup(senderID, threadID, ()=>{}), 2000);
  } else {
    sendMessage(threadID, `⚠️ تنبيه لـ ${nickname}!\n\nالسبب: ${reason}\nالتحذيرات: ${warningSymbols}\n\n⚠️ تحذير: ستصل لحد الطرد عند اكتمال 3 تحذيرات!`, messageID);
  }
}

// --- أوامر إدارة التحذيرات والحظر ---
async function handleBannedCommand(threadID, messageID) {
  const bans = data.getBannedMembers(threadID);
  let msg = `🚫 المحظورون (${bans.length})\n\n`;
  bans.forEach((b, i) => msg += `${i+1}. ${b.nickname} (الآيدي: ${b.uid})\nالسبب: ${b.reason}\n\n`);
  sendMessage(threadID, msg, messageID);
}

async function handleAddWarningKeywordCommand(threadID, messageID, senderID, message) {
  if (!isAdmin(threadID, senderID)) return;
  const word = message.replace(/(?:\.إضافة_تحذير|\.addwarning)\s+/, "").trim();
  if (data.addWarningKeyword(threadID, word)) sendMessage(threadID, `✅ تم إضافة الكلمة الممنوعة: ${word}`, messageID);
}

async function handleRemoveWarningKeywordCommand(threadID, messageID, senderID, message) {
  if (!isAdmin(threadID, senderID)) return;
  const word = message.replace(/(?:\.حذف_كلمة|\.removeword)\s+/, "").trim();
  if (data.removeWarningKeyword(threadID, word)) sendMessage(threadID, `✅ تم حذف الكلمة: ${word}`, messageID);
}

async function handleManualWarningCommand(threadID, messageID, senderID, event) {
  if (!isAdmin(threadID, senderID)) return;
  const target = Object.keys(event.mentions || {})[0];
  if (!target) return sendMessage(threadID, "❌ الاستخدام الصحيح: .تحذير @منشن [السبب]", messageID);
  const reason = event.body.replace(/(?:\.تحذير|\.warning)\s+@\w+\s*/, "") || "تحذير إداري";
  await issueWarning(threadID, messageID, target, event, reason);
}

async function handleUnwarningCommand(threadID, messageID, senderID, event) {
  if (!isAdmin(threadID, senderID)) return;
  const target = Object.keys(event.mentions || {})[0];
  if (!target) return sendMessage(threadID, "❌ الاستخدام الصحيح: .إزالة_تحذير @منشن", messageID);
  data.deductWarning(threadID, target, isProtectedUser(senderID));
  sendMessage(threadID, "✅ تم إزالة تحذير من العضو بنجاح.", messageID);
}

async function handleWarningListCommand(threadID, messageID) {
  const list = data.getAllWarnings(threadID);
  let msg = "⚠️ قائمة التحذيرات:\n";
  list.forEach(u => msg += `- ${u.nickname}: ${u.count} تحذيرات\n`);
  sendMessage(threadID, msg, messageID);
}

async function handleBanCommand(threadID, messageID, senderID, event) {
  if (!isAdmin(threadID, senderID)) return;
  const target = Object.keys(event.mentions || {})[0];
  if (!target || isProtectedUser(target)) return sendMessage(threadID, "❌ لا يمكن حظر هذا المستخدم.", messageID);
  const reason = event.body.replace(/(?:\.حظر|\.ban)\s+@\w+\s*/, "") || "حظر إداري";
  const res = data.banMember(threadID, target, "عضو", reason, "مشرف");
  if(res) {
    sendMessage(threadID, `🔨 تم حظر العضو بنجاح. آيدي الحظر: ${res.uid}`, messageID);
    setTimeout(() => api.removeUserFromGroup(target, threadID, ()=>{}), 1000);
  }
}

async function handleUnbanCommand(threadID, messageID, senderID, event) {
  if (!isAdmin(threadID, senderID)) return;
  const arg = event.body.replace(/(?:\.رفع_حظر|\.unban)\s+/, "").trim();
  const target = Object.keys(event.mentions || {})[0] || arg;
  if (data.unbanMember(threadID, target)) sendMessage(threadID, "✅ تم رفع الحظر عن العضو بنجاح.", messageID);
  else sendMessage(threadID, "❌ لم يتم العثور على سجل الحظر.", messageID);
}

async function handleWarExtremeCommand(threadID, messageID, senderID) {
  if (!isAdmin(threadID, senderID)) return;
  data.setWarExtremeMode(threadID, true);
  sendMessage(threadID, "⚠️ تم تفعيل وضع الحرب القصوى!", messageID);
}

async function handlePeaceCommand(threadID, messageID, senderID) {
  if (!isAdmin(threadID, senderID)) return;
  data.setWarExtremeMode(threadID, false);
  sendMessage(threadID, "✅ تم تفعيل وضع السلام!", messageID);
}

async function handleKickCommand(threadID, messageID, senderID, event) {
  if (!isAdmin(threadID, senderID)) return;
  const target = Object.keys(event.mentions || {})[0];
  if (!target || isProtectedUser(target)) return sendMessage(threadID, "❌ لا يمكن طرد هذا المستخدم.", messageID);
  sendMessage(threadID, "👢 جاري طرد العضو...", messageID);
  setTimeout(() => api.removeUserFromGroup(target, threadID, ()=>{}), 1000);
}

// --- إدارة الطلبات ومشرفي القروب ---
async function handlePendingListCommand(threadID, messageID, senderID) {
  if (!isAdmin(threadID, senderID)) return;
  sendMessage(threadID, "❌ لا يمكن عرض قائمة الطلبات مباشرة. استعمل الأمر: .قبول <الاسم تماماً> أو .قبول <الآيدي>", messageID);
}

async function handleApproveCommand(threadID, messageID, senderID, message) {
  if (!isAdmin(threadID, senderID)) return;
  const arg = message.replace(/(?:\.قبول|\.approve|\.accept)\s+/, "").trim();
  
  if (!arg) {
    sendMessage(threadID, "❌ الاستخدام الصحيح: .قبول <الآيدي> أو <الاسم الحقيقي>", messageID);
    return;
  }

  if (/^\d+$/.test(arg)) {
    api.addUserToGroup(arg, threadID, (err) => {
      if (err) sendMessage(threadID, `❌ فشل إضافة العضو بالآيدي ${arg}.`, messageID);
      else sendMessage(threadID, `✅ تم إضافة العضو بنجاح بالآيدي: ${arg}`, messageID);
    });
    return;
  }

  sendMessage(threadID, `🔍 جاري البحث عن المستخدم "${arg}"...`, messageID);
  
  api.getUserID(arg, (err, users) => {
    if (err || !users || users.length === 0) {
      sendMessage(threadID, `❌ لم يتم العثور على المستخدم "${arg}". حاول استخدام الآيدي مباشرة.`, messageID);
      return;
    }
    const targetUID = users[0].userID;
    api.addUserToGroup(targetUID, threadID, (addErr) => {
      if (addErr) sendMessage(threadID, `❌ فشل إضافة العضو.`, messageID);
      else sendMessage(threadID, `✅ تمت الموافقة وإضافة: ${arg}`, messageID);
    });
  });
}

async function handleAddAdminCommand(threadID, messageID, senderID, event) {
  if (!isProtectedUser(senderID)) return;
  const target = Object.keys(event.mentions || {})[0];
  if (!target) return sendMessage(threadID, "❌ الاستخدام الصحيح: .إضافة_مشرف @منشن", messageID);
  api.changeAdminStatus(threadID, target, true, (err) => {
    if (err) sendMessage(threadID, "❌ فشل ترقية العضو لمشرف.", messageID);
    else sendMessage(threadID, "✅ تمت ترقية العضو وأصبح مشرفاً في القروب.", messageID);
  });
}

async function handleRemoveAdminCommand(threadID, messageID, senderID, event) {
  if (!isProtectedUser(senderID)) return;
  const target = Object.keys(event.mentions || {})[0];
  if (!target) return sendMessage(threadID, "❌ الاستخدام الصحيح: .حذف_مشرف @منشن", messageID);
  api.changeAdminStatus(threadID, target, false, (err) => {
    if (err) sendMessage(threadID, "❌ فشل سحب الإشراف.", messageID);
    else sendMessage(threadID, "✅ تم سحب صلاحية الإشراف من العضو.", messageID);
  });
}

async function handleAdminListCommand(threadID, messageID) {
  const info = await getThreadInfo(threadID);
  if (!info) return;
  let msg = `👑 مشرفو القروب (${info.adminIDs.length}):\n\n`;
  for (const admin of info.adminIDs) {
    const user = await getUserInfo(admin.id);
    msg += `- ${user?.name || admin.id}\n`;
  }
  sendMessage(threadID, msg, messageID);
}

async function handleBanAllCommand(threadID, messageID, senderID) {
  if (!isProtectedUser(senderID)) return;
  const info = await getThreadInfo(threadID);
  if (!info) return;
  sendMessage(threadID, "⚠️ تحذير: جاري حظر جميع أعضاء القروب...", messageID);
  for (const uid of info.participantIDs) {
    if (uid !== botUserId && !isProtectedUser(uid)) {
      data.banMember(threadID, uid, "عضو", "حظر جماعي", "المطور");
      api.removeUserFromGroup(uid, threadID, ()=>{});
    }
  }
  sendMessage(threadID, "✅ تم تنفيذ حظر الجميع.", messageID);
}

async function handleRemoveAllBansCommand(threadID, messageID, senderID) {
  if (!isAdmin(threadID, senderID)) return;
  const res = data.removeAllBans(threadID);
  sendMessage(threadID, `✅ تم حذف جميع سجلات الحظر (${res.count} سجل).`, messageID);
}

async function handleRemoveAllWarningsCommand(threadID, messageID, senderID) {
  if (!isAdmin(threadID, senderID)) return;
  const res = data.removeAllWarnings(threadID);
  sendMessage(threadID, `✅ تم مسح جميع التحذيرات (${res.count} مستخدم).`, messageID);
}

async function handleServerCommand(threadID, messageID) {
  const info = data.getServerInfo(threadID);
  sendMessage(threadID, info ? `🖥️ معلومات السيرفر:\n${info}` : "❌ لم يتم تعيين معلومات للسيرفر بعد.", messageID);
}

async function handleServerInfoCommand(threadID, messageID, senderID, message) {
  if (!isAdmin(threadID, senderID)) return;
  const info = message.replace(/(?:\.معلومات_السيرفر|\.serverinfo)\s+/, "").trim();
  data.setServerInfo(threadID, info);
  sendMessage(threadID, "✅ تم تحديث معلومات السيرفر بنجاح.", messageID);
}

async function handleShutdownCommand(threadID, messageID, senderID) {
  if (!isProtectedUser(senderID)) return;
  sendMessage(threadID, "🛑 جاري إيقاف تشغيل البوت...", messageID);
  setTimeout(() => process.exit(0), 1000);
}

async function handleInvalidCommand(threadID, messageID, senderID, message) {
  if (isProtectedUser(senderID)) return;
  sendMessage(threadID, "❓ أمر غير معروف. اكتب .مساعدة لعرض قائمة الأوامر المتاحة.", messageID);
}

async function handleUnsendMessage(event) {
  const { threadID, senderID, messageID } = event;
  if (!threadID || !senderID || isProtectedUser(senderID)) return;
  const cached = data.getCachedMessage(messageID);
  if (!cached) return;
  
  const threadInfo = await getThreadInfo(threadID);
  const nickname = threadInfo?.nicknames?.[senderID] || "عضو";
  const hasImages = cached.attachments && cached.attachments.some(att => att.type === 'photo');
  
  if (hasImages) {
    const photo = cached.attachments.find(att => att.type === 'photo');
    if (photo && photo.url) {
      lastUnsentImage.set(threadID, { url: photo.url, sender: nickname, senderID: senderID, timestamp: Date.now() });
      try {
        const imagePath = path.join(__dirname, "cache", `unsent_${messageID}.jpg`);
        const response = await axios({ url: photo.url, responseType: "stream" });
        const writer = fs.createWriteStream(imagePath);
        response.data.pipe(writer);
        writer.on('finish', () => {
          api.sendMessage({ body: `⚠️ قام ${nickname} بحذف هذه الصورة:`, attachment: fs.createReadStream(imagePath) }, threadID, () => {
            fs.unlink(imagePath, () => {});
          });
        });
      } catch (e) { console.error("Repost failed", e); }
    }
    return;
  }
  sendMessage(threadID, `⚠️ قام ${nickname} بحذف هذه الرسالة:\n"${cached.body}"`);
}

async function handleUnsentCommand(threadID, messageID) {
  const unsentData = lastUnsentImage.get(threadID);
  if (!unsentData || Date.now() - unsentData.timestamp > 86400000) return sendMessage(threadID, "❌ لا توجد صور محذوفة حديثاً.", messageID);
  
  const imagePath = path.join(__dirname, "cache", `manual_unsent_${Date.now()}.jpg`);
  const response = await axios({ url: unsentData.url, responseType: "stream" });
  const writer = fs.createWriteStream(imagePath);
  response.data.pipe(writer);
  writer.on('finish', () => {
    api.sendMessage({ body: `🖼️ آخر صورة حذفها ${unsentData.sender}:`, attachment: fs.createReadStream(imagePath) }, threadID, () => fs.unlink(imagePath, ()=>{}));
  });
}

async function handlePlayCommand(threadID, messageID, senderID, message) {
  const url = message.replace(/(?:\.تشغيل|\.play)\s+/, "").trim();
  if (!url || !ytdl.validateURL(url)) return sendMessage(threadID, "❌ رابط يوتيوب غير صالح.", messageID);
  sendMessage(threadID, "🎵 جاري معالجة وتحميل الصوت...", messageID);
  try {
    const info = await ytdl.getInfo(url);
    if (parseInt(info.videoDetails.lengthSeconds) > 240) return sendMessage(threadID, "❌ الفديو طويل جداً (أقصى حد 4 دقائق).", messageID);
    const filePath = path.join(__dirname, "cache", `audio_${Date.now()}.mp3`);
    ytdl(url, { quality: 'highestaudio', filter: 'audioonly' }).pipe(fs.createWriteStream(filePath)).on('finish', () => {
      api.sendMessage({ body: `🎵 ${info.videoDetails.title}`, attachment: fs.createReadStream(filePath) }, threadID, () => fs.unlink(filePath, ()=>{}));
    });
  } catch (e) { sendMessage(threadID, "❌ حدث خطأ أثناء تحميل الصوت.", messageID); }
}

async function handleVonCommand(threadID, messageID) {
  sendMessage(threadID, "🌐 رابط موقع Von:\nhttps://www.von.gov.dz", messageID);
}

async function handleGroupEvent(event, services = {}) {
  const { threadID, logMessageType, logMessageData } = event;
  const eventData = services.data || data;
  const fetchThreadInfo = services.getThreadInfo || getThreadInfo;
  const syncGroupMembers = services.updateGroupMembers || updateGroupMembers;
  const fetchUserInfo = services.getUserInfo || getUserInfo;
  const checkAdmin = services.isAdmin || isAdmin;
  const send = services.sendMessage || sendMessage;
  const apiClient = services.api || api;
  const currentBotUserId = services.botUserId ?? botUserId;
  const info = await fetchThreadInfo(threadID);
  if (logMessageType === "log:subscribe") {
    await syncGroupMembers(threadID, info);
    const added = logMessageData.addedParticipants.map(p => p.userFbId);
    for (const uid of added) {
      if (uid === currentBotUserId) {
        apiClient.changeNickname("TENSURA", threadID, currentBotUserId, ()=>{});
        continue;
      }
      if (eventData.isBanned(threadID, uid)) {
        send(threadID, "🚫 تنبيه: تم رصد عضو محظور يحاول الدخول وتم طرده.");
        setTimeout(() => apiClient.removeUserFromGroup(uid, threadID, ()=>{}), 1000);
        continue;
      }
      const user = await fetchUserInfo(uid);
      const name = info.nicknames?.[uid] || user?.name || "عضو";
      if (!checkAdmin(threadID, uid)) eventData.addMember(threadID, uid, name);
      send(threadID, eventData.getGreeting(threadID).replace("{name}", name));
    }
  }
}

async function updateGroupMembers(threadID, threadInfo) {
  if (!threadInfo?.participantIDs) return;
  data.syncGroupMembers(threadID, threadInfo.participantIDs, botUserId);
  for (const uid of threadInfo.participantIDs) {
    if (uid === botUserId || isProtectedUser(uid) || isAdmin(threadID, uid)) {
      data.removeMember(threadID, uid);
      continue;
    }
    const userInfo = await getUserInfo(uid);
    if (userInfo) data.addMember(threadID, uid, threadInfo.nicknames?.[uid] || userInfo.name);
  }
}

async function getThreadInfo(threadID) {
  return new Promise(r => api.getThreadInfo(threadID, (e, i) => r(e ? null : i)));
}

async function getUserInfo(userID) {
  return new Promise(r => api.getUserInfo(userID, (e, i) => r(e ? null : i[userID])));
}

function sendMessage(threadID, message, messageID = null) {
  api.sendMessage({ body: message }, threadID, (err) => { if(err) console.error(err); }, messageID ? messageID : undefined);
}

function startDailyReset() { setInterval(performDailyReset, 24 * 60 * 60 * 1000); }
async function performDailyReset() {
  const kicks = data.resetDailyAttendance();
  kicks.forEach(k => {
    if(k.userID !== botUserId) {
      data.banMember(k.threadID, k.userID, k.nickname, k.reason, "النظام");
      sendMessage(k.threadID, `🚫 تم طرد ${k.nickname} تلقائياً بسبب الغياب المتكرر.`);
      setTimeout(() => api.removeUserFromGroup(k.userID, k.threadID, ()=>{}), 1000);
    }
  });
}

function startPeriodicAppStateSave() { setInterval(() => api && saveAppState(api.getAppState()), 3600000); }
function startPeriodicBanCheck() { setInterval(() => data.checkAndLiftExpiredBans().forEach(b => sendMessage(b.threadID, `⏰ تم رفع الحظر تلقائياً عن: ${b.nickname}`)), 60000); }

if (require.main === module) {
  process.on("SIGINT", () => { if(api) saveAppState(api.getAppState()); process.exit(0); });
  initializeBot().catch(e => console.error(e));
}

module.exports = { handleGroupEvent };

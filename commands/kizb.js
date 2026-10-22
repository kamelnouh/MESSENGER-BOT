/**
 * .كذب: assigns a humorous random honesty score to the caller or replied-to
 * member, with an image card when Canvas and the profile avatar are available.
 */
const fs = "fs" in global ? global.fs : require("fs");
const path = require("path");

// دالة ذكية لتخمين الجنس بناءً على الاسم للكوميديا الجزائرية
function guessGender(name) {
  const n = name.toLowerCase();
  const femaleKeywords = ['fatima', 'zohra', 'amina', 'nour', 'imen', 'rym', 'rania', 'meryem', 'khaoula', 'chaima', 'asma', 'hiba', 'sara', 'selma', 'imene', 'manel', 'nadia', 'hanane', 'صارة', 'فاطمة', 'أمينة', 'مريم', 'إيمان', 'ريم', 'رانية', 'شيماء', 'أسماء', 'هبة', 'سلسبيل', 'سندس', 'نهاد', 'ملك', 'سيرين', 'خولة', 'نور', 'إناس'];
  for (const kw of femaleKeywords) {
    if (n.includes(kw)) return 'female';
  }
  return 'male';
}

module.exports = {
  name: "كذب",
  adminOnly: false,
  developerOnly: false,
  
  execute: async function({ api, event, args, data, senderID, threadID, messageID, sendMessage }) {
    const { messageReply } = event;
    
    let targetID = messageReply ? messageReply.senderID : senderID;
    
    api.getUserInfo([targetID], async (userErr, usersObj) => {
      if (userErr || !usersObj[targetID]) {
        return sendMessage(threadID, "❌ تعذر جلب معلومات المستخدم لفحص نسبة الكذب.", messageID);
      }
      
      api.getThreadInfo(threadID, async (err, info) => {
        const finalTargetName = info?.nicknames?.[targetID] || usersObj[targetID].name;
        const targetGender = guessGender(finalTargetName);
        
        const lieRate = Math.floor(Math.random() * 101);
        let lieComment = "";

        // --- بنوك القصف والتمنيك الخاصة بالإناث والذكور ---
        if (targetGender === 'female') {
          if (lieRate > 80) {
            lieComment = `يا ${finalTargetName}، نسبة الكذب عندك ${lieRate}%! راكي تنطقي بالبهتان عيني عينك في القروب.. النهار كامل وأنت تحكاي في قصص خيالية تاع "صاحبي مهندس ومحطمني" وأنت غير قاعدة تشاتي في التليفون وتكذبي على العباد! 🤥💅`;
          } else if (lieRate > 40) {
            lieComment = `يا ${finalTargetName}، نسبة الكذب عندك ${lieRate}%.. متوسطة الحال، مرة تقولي الصح ومرة تدخلي البهارات والتشيشان تاع البنات باش تباني مميزة في السهرة! 🧐☕`;
          } else {
            lieComment = `يا ${finalTargetName}، نسبة الكذب عندك ${lieRate}%.. الطفولة هذه بريئة بزاف لدرجة نشك بلي راكي تلعبيها ماليش وليك، ربي يستر من هذا النقاء المؤقت! 😇✨`;
          }
        } else {
          if (lieRate > 80) {
            lieComment = `يا ${finalTargetName}، نسبة الكذب عندك ${lieRate}%! ياو أنت أسطورة الكذب في الحومة والقروب.. النهار كامل تحكي في حكايات تاع "كنت رايح ندير وكنت رايح نجيب" وأنت قاعد في القهوة تطلب حق القهوة سلفة! وزارة الكذب تمنحك وسام الشرف بجدارة! 🤥🔥`;
          } else if (lieRate > 40) {
            lieComment = `يا ${finalTargetName}، نسبة الكذب عندك ${lieRate}%.. راك تخلط برك، مرة تخرج صحيحة ومرة تحط بهارات من راسك باش تطلع الشأن قدام الجماعة! راك تحت المراقبة يا الشاوي! 🧐💬`;
          } else {
            lieComment = `يا ${finalTargetName}، نسبة الكذب عندك ${lieRate}%! الصدق يقطر من وجهك وراك تبان مؤمن ومتربي، غير كي تزنق في زاوية ضيقة وين تبان البهدلة الحقيقية! 😇👍`;
          }
        }

        const avatarUrl = usersObj[targetID]?.thumbSrc;
        
        try {
          const { createCanvas, loadImage } = require("canvas");
          const canvas = createCanvas(1200, 630);
          const ctx = canvas.getContext('2d');

          const colorPalettes = [
            { start: '#3a1c71', mid: '#d76d77', end: '#ffaf7b', border: '#ff3366' },
            { start: '#1f4068', mid: '#162447', end: '#1b1b2f', border: '#e43f5a' },
            { start: '#2c3e50', mid: '#4ca1af', end: '#2c3e50', border: '#f1c40f' },
            { start: '#512b58', mid: '#2b0933', end: '#0f0817', border: '#ff007f' }
          ];

          const selectedPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

          const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
          gradient.addColorStop(0, selectedPalette.start);
          gradient.addColorStop(0.5, selectedPalette.mid);
          gradient.addColorStop(1, selectedPalette.end);

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 1200, 630);

          const avatarImg = await loadImage(avatarUrl);

          ctx.save();
          ctx.beginPath();
          ctx.arc(600, 220, 140, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(avatarImg, 460, 80, 280, 280);
          ctx.restore();

          ctx.strokeStyle = selectedPalette.border;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(600, 220, 140, 0, Math.PI * 2, true);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 38px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(finalTargetName, 600, 410);

          ctx.fillStyle = '#f1c40f';
          ctx.font = 'bold 34px sans-serif';
          ctx.fillText(`رادار كشف الكذب: ${lieRate}% 🤥`, 600, 470);

          ctx.fillStyle = '#a6b1e1';
          ctx.font = '24px sans-serif';
          ctx.fillText('🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |', 600, 560);

          const cacheDir = path.join(__dirname, "..", "cache");
          if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
          const outputPath = path.join(cacheDir, `lie_card_${Date.now()}.jpg`);
          
          const buffer = canvas.toBuffer('image/jpeg');
          fs.writeFileSync(outputPath, buffer);

          const textReport = `🤥 تقرير رادار فحص الكذب الرسمي 🤥\n\n👤 الضحية: ${finalTargetName}\n📊 نسبة الكذب المحسوبة: ${lieRate}%\n\n📢 تحليل البوت:\n${lieComment}\n\n🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |`;

          api.sendMessage({
            body: textReport,
            attachment: fs.createReadStream(outputPath)
          }, threadID, () => {
            fs.unlink(outputPath, ()=>{});
          }, messageID);

        } catch (e) {
          console.error("Canvas error:", e);
          const fallbackText = `🤥 تقرير رادار كشف الكذب لـ ${finalTargetName} (النسبة: ${lieRate}%):\n\n${lieComment}\n\n🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |`;
          sendMessage(threadID, fallbackText, messageID);
        }
      });
    });
  }
};

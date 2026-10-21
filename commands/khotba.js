const axios = require("axios");
const fs = "fs" in global ? global.fs : require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

function guessGender(name) {
  const n = name.toLowerCase();
  const femaleKeywords = ['fatima', 'zohra', 'amina', 'nour', 'imen', 'rym', 'rania', 'meryem', 'khaoula', 'chaima', 'asma', 'hiba', 'sara', 'selma', 'imene', 'manel', 'nadia', 'hanane', 'صارة', 'فاطمة', 'أمينة', 'مريم', 'إيمان', 'ريم', 'رانية', 'شيماء', 'أسماء', 'هبة', 'سلسبيل', 'سندس', 'نهاد', 'ملك', 'سيرين', 'خولة', 'نور', 'إناس'];
  for (const kw of femaleKeywords) {
    if (n.includes(kw)) return 'female';
  }
  return 'male';
}

module.exports = {
  name: "خطبة",
  adminOnly: false,
  developerOnly: false,
  
  execute: async function({ api, event, args, data, senderID, threadID, messageID, sendMessage }) {
    const { messageReply } = event;
    
    let user1ID = senderID;
    let user2ID = messageReply ? messageReply.senderID : null;
    
    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info || !info.participantIDs) {
        return sendMessage(threadID, "❌ حدث خطأ أثناء جلب أعضاء المجموعة.", messageID);
      }
      
      const validMembers = info.participantIDs.filter(id => id !== api.getCurrentUserID() && id !== user1ID);
      
      if (!user2ID) {
        if (validMembers.length === 0) {
          return sendMessage(threadID, "❌ لا يوجد أعضاء كافيون في المجموعة لإجراء الخطبة!", messageID);
        }
        user2ID = validMembers[Math.floor(Math.random() * validMembers.length)];
      }
      
      if (user1ID === user2ID) {
        return sendMessage(threadID, "❌ واش راك تخطب في روحك؟ راك باغي تدي باكي حلوة وحدك يا الطماع ☕", messageID);
      }
      
      api.getUserInfo([user1ID, user2ID], async (userErr, usersObj) => {
        if (userErr || !usersObj[user1ID] || !usersObj[user2ID]) {
          return sendMessage(threadID, "❌ تعذر جلب معلومات المستخدمين.", messageID);
        }
        
        const user1Name = info.nicknames?.[user1ID] || usersObj[user1ID].name;
        const user2Name = info.nicknames?.[user2ID] || usersObj[user2ID].name;
        
        const gender1 = guessGender(user1Name);
        const gender2 = guessGender(user2Name);
        
        let finalReport = "";
        const isRoastMode = Math.random() < 0.75; 

        // 1. (ذكر + أنثى): قصف الخطبة، الفاتحة، وقاروسة القهوة
        if (gender1 === 'male' && gender2 === 'female') {
          if (isRoastMode) {
            const roasts = [
              `يا ${user1Name}، راك رايح تخطب ${user2Name} 🏷️📉؟ واشمن فاتحة تقرأها وأنت نهار كامل تحوس في الحوم وتطلب حق القهوة من عند يماك 🔌💸! الطفلة هذي طاحت فيك طمعانة، ونهار تروح لدارهم تخلعهم بلا سلك ولا خدمة، والخطبة تفسد غير على باكي صابلي!`,
              `مبروك يا ${user1Name} راك لبست الخاتم لـ ${user2Name} 📜❌! بصح الخاتم نحاس من السوق بـ 39 ألف، وزيد رايح تخلص حق الكازوز بالكريدي. بهدلت بروحك والراجل لي فيك غير الهضرة الفاضية!`,
              `يا ${user1Name} راك تدير في طراس تاع الفاتحة مع ${user2Name} 🏷️🗑️ ؟ الطفولة هذي هربت من الزين والمال وطاحت في واحد بطال يبات يقصر في البلايستايشن. الخطبة هذي مآلها الفسخ قبل ما يلحق وقت صينية القهوة!`,
              `يا ${user2Name} اهربي بجلدك! طحتي في فخ ${user1Name} ⚠️🚶 اللي جاي يخطب بكرش هاملة وجيوب فارغة.. قريباً نشوفوك تعجني في الرخص وتخلصي في ديون القهوجي.`
            ];
            finalReport = roasts[Math.floor(Math.random() * roasts.length)];
          } else {
            finalReport = `إعلان رسمي ومبارك! ${user1Name} و ${user2Name} قررا قراءة الفاتحة وسط أجواء عائلية.. نتمنى لهما خطبة متينة ومبروك مسبقاً! 🏷️✨`;
          }
        }
        
        // 2. (أنثى + ذكر): تمنيك وسخرية من الخاطب الضحية في الخطبة
        else if (gender1 === 'female' && gender2 === 'male') {
          if (isRoastMode) {
            const roasts = [
              `يا ${user2Name} (المسكين)، راك رايح تخطب ${user1Name}.. 🧳📉 راك رايح توقع على وثيقة الإعدام بيدك! الإنسانة هذي مشروط عليها الذهب الصافي وكونجيلاتور معمور، وأنت ماكش قادر حتى تسلك حق الكسكسي تاع الفاتحة!`,
              `مبروك يا ${user1Name} على إيقاع ${user2Name} في شباكك 📜💢! المسكين راه مسحور بيك ورايح يبيع تلفونو باش يجيب لوازم الخطوبة. واش من هبال هذا، راك رايح تخلص عليه الحلاقة نهار العرس!`,
              `يا ${user1Name}، راك رايح تدير حالة على ${user2Name} 📉❌ المسكين.. والله غير راك رايحة تخليه يهرب من الصباح لليلة الخطبة كي يسمع بشروط يماك والسيقما!`
            ];
            finalReport = roasts[Math.floor(Math.random() * roasts.length)];
          } else {
            finalReport = `رغم أن ${user1Name} دايرة حالة بلسانها، إلا أن ${user2Name} عرف كيفاش يدخل لدارهم من الباب الواسع.. خطوبة مباركة وكل المتمنيات بالتمام! 📜💫`;
          }
        }

        // 3. (أنثى + أنثى): خطبة بنات وصالون وقصص فارغة
        else if (gender1 === 'female' && gender2 === 'female') {
          if (isRoastMode) {
            const roasts = [
              `يا لطيف! جامي شفت خطوبة بين زوج بنات في القروب ✂️📉! راكم رايحين تشروا خواتم لبعضكم وتفتحوا صالون حلاقة نسائي وتسموه "خطبة الميكام"? مهزلة عيني عينك!`,
              `يا ${user1Name} و ${user2Name}، 📋❌ راكم دايرين خطوبة؟ شكون فيكم اللي راح تلبس القفطان وشكون اللي تشد الصينية تفرق القهوة على الجوارين؟ القروب مات بالضحك عليكم!`,
              `خطبة نسائية مشبوهة بين ${user1Name} و ${user2Name}! 🏷️💥 القهوة طاحت في الكانون والنميمة بدات قبل ما يلحق المغني!`
            ];
            finalReport = roasts[Math.floor(Math.random() * roasts.length)];
          } else {
            finalReport = `أجمل صداقة تتحول إلى خطوبة رسمية ورمزية بين ${user1Name} و ${user2Name}! ربي يديم محبتكم الصادقة ويكتب لكم الخير! 🏷️🌟`;
          }
        }

        // 4. (ذكر + ذكر): خطوبة ذكورة وقهاوي وشيشة
        else {
          if (isRoastMode) {
            const roasts = [
              `يا مهبولين! واش من خطوبة بين زوز ذكورة 🎮📉؟! راكم رايحين تبدلوا القهوة والشيشة بخاتم الذهب والقرطاس؟ بهدلتوا بحالة العرش كامل!`,
              `يا ${user1Name} و ${user2Name}، 🪑❌ راكم دايرين فاتحة بينكم؟ النهار كامل في الطبلية وتزيدوا تخطبوا بعضكم؟ والله غير الشعيبية تستنى فيكم بالهراوات!`,
              `كارثة عاطفية في القروب بين ${user1Name} و ${user2Name}! 🪵⚠️ الخطبة باطلة شرعاً وقانوناً، والدار فيها غير ريحة الدخان والمشاوي الباردة! ☕`
            ];
            finalReport = roasts[Math.floor(Math.random() * roasts.length)];
          } else {
            finalReport = `تحالف رجالي وأخوة متينة توجت بإعلان خطوبة رمزية بين ${user1Name} و ${user2Name}! نتمنى لكم السند الدائم في القهوة وخرجة! 🤝💎`;
          }
        }

        const compatibility = Math.floor(Math.random() * 85) + 5;
        const timestamp = Date.now();
        
        const avatar1Url = `https://graph.facebook.com/${user1ID}/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662&t=${timestamp}`;
        const avatar2Url = `https://graph.facebook.com/${user2ID}/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662&t=${timestamp}`;
        
        try {
          const canvas = createCanvas(1200, 630);
          const ctx = canvas.getContext('2d');

          const colorPalettes = [
            { start: '#1a1a2e', mid: '#16213e', end: '#0f3460', border: '#e94560' },
            { start: '#3a6073', mid: '#16222a', end: '#000000', border: '#f39c12' },
            { start: '#834d9b', mid: '#d04ed6', end: '#111111', border: '#00d2ff' },
            { start: '#ff416c', mid: '#ff4b2b', end: '#1a1a2e', border: '#ffffff' },
            { start: '#1f4068', mid: '#1b1b2f', end: '#e43f5a', border: '#f1c40f' }
          ];

          const selectedPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

          const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
          gradient.addColorStop(0, selectedPalette.start);
          gradient.addColorStop(0.5, selectedPalette.mid);
          gradient.addColorStop(1, selectedPalette.end);

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 1200, 630);

          const [img1, img2] = await Promise.all([
            loadImage(avatar1Url),
            loadImage(avatar2Url)
          ]);

          ctx.save();
          ctx.beginPath();
          ctx.arc(300, 240, 150, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img1, 150, 90, 300, 300);
          ctx.restore();

          ctx.strokeStyle = selectedPalette.border;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(300, 240, 150, 0, Math.PI * 2, true);
          ctx.stroke();

          ctx.save();
          ctx.beginPath();
          ctx.arc(900, 240, 150, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img2, 750, 90, 300, 300);
          ctx.restore();

          ctx.strokeStyle = selectedPalette.border;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(900, 240, 150, 0, Math.PI * 2, true);
          ctx.stroke();

          ctx.fillStyle = '#ff3366';
          ctx.font = 'bold 70px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💍', 600, 265);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 34px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(user1Name, 300, 440);
          ctx.fillText(user2Name, 900, 440);

          ctx.fillStyle = '#f1c40f';
          ctx.font = 'bold 30px sans-serif';
          ctx.fillText(`نسبة نجاح الفاتحة: ${compatibility}%`, 600, 490);

          ctx.fillStyle = '#a6b1e1';
          ctx.font = '24px sans-serif';
          ctx.fillText('🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |', 600, 570);

          const cacheDir = path.join(__dirname, "..", "cache");
          if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
          const outputPath = path.join(cacheDir, `khotba_card_${Date.now()}.jpg`);
          
          const buffer = canvas.toBuffer('image/jpeg');
          fs.writeFileSync(outputPath, buffer);

          const textReport = `🏷️ مراسم قراءة الفاتحة والخطبة في القروب 🏷️\n\n📋 الخاطب / الطرف الأول: ${user1Name}\n📋 الخطيبة / الطرف الثاني: ${user2Name}\n\n📊 نسبة التوافق في الخطبة: ${compatibility}%\n\n📢 تقرير وملاحظات الخالة عن الخطوبة:\n${finalReport}\n\n🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |`;

          api.sendMessage({
            body: textReport,
            attachment: fs.createReadStream(outputPath)
          }, threadID, () => {
            fs.unlink(outputPath, ()=>{});
          }, messageID);

        } catch (e) {
          console.error("Canvas error:", e);
          const fallbackText = `🏷️ مراسيم خطوبة ${user1Name} و ${user2Name}!\n\n${finalReport}\n\n🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |`;
          sendMessage(threadID, fallbackText, messageID);
        }
      });
    });
  }
};

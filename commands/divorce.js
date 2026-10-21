const axios = "axios" in global ? global.axios : require("axios");
const fs = "fs" in global ? global.fs : require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// دالة ذكية لتخمين الجنس بناءً على الاسم أو الحساب للكوميديا الجزائرية
function guessGender(name) {
  const n = name.toLowerCase();
  const femaleKeywords = ['fatima', 'zohra', 'amina', 'nour', 'imen', 'rym', 'rania', 'meryem', 'khaoula', 'chaima', 'asma', 'hiba', 'sara', 'selma', 'imene', 'manel', 'nadia', 'hanane', 'صارة', 'فاطمة', 'أمينة', 'مريم', 'إيمان', 'ريم', 'رانية', 'شيماء', 'أسماء', 'هبة', 'سلسبيل', 'سندس', 'نهاد', 'ملك', 'سيرين', 'خولة', 'نور', 'إناس'];
  for (const kw of femaleKeywords) {
    if (n.includes(kw)) return 'female';
  }
  return 'male'; // الافتراضي ذكر في حال غموض الاسم
}

module.exports = {
  name: "طلاق",
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
          return sendMessage(threadID, "❌ لا يوجد أعضاء كافيون في المجموعة لإجراء الطلاق!", messageID);
        }
        user2ID = validMembers[Math.floor(Math.random() * validMembers.length)];
      }
      
      if (user1ID === user2ID) {
        return sendMessage(threadID, "❌ واش راك تطلق في روحك؟ راك مطلق وحدك من نهار تولدت يا الفو<sup>ر</sup> 😂", messageID);
      }
      
      api.getUserInfo([user1ID, user2ID], async (userErr, usersObj) => {
        if (userErr || !usersObj[user1ID] || !usersObj[user2ID]) {
          return sendMessage(threadID, "❌ تعذر جلب معلومات المستخدمين.", messageID);
        }
        
        const user1Name = info.nicknames?.[user1ID] || usersObj[user1ID].name;
        const user2Name = info.nicknames?.[user2ID] || usersObj[user2ID].name;
        
        const gender1 = guessGender(user1Name);
        const gender2 = guessGender(user2Name);
        
        // --- بنوك قصف الطلاق والبهدلة (مستقلة تماماً عن الزواج والخطبة) ---
        let finalReport = "";
        const isRoastMode = Math.random() < 0.75; // 75% قصف وتمنيك، 25% تسريح بالاحسان

        // 1. (ذكر + أنثى): قصف المحاكم، النفقة، وقسمة الماعون
        if (gender1 === 'male' && gender2 === 'female') {
          if (isRoastMode) {
            const roasts = [
              `يا ${user1Name}، طلقت ${user2Name} ⚖️💥؟ العقد السيد كمل في المحكمة بطلب من المدام لي زهقت من وجهك الصباحي! رايح تخلص النفقة وتبيع التليفون تاعك باش تسلك حق المؤخر. بهدلت بروحك والطلاق وقع بالتراضي على جال القهوة!`,
              `مبروك يا ${user2Name} الخلاص من ${user1Name} 📄🏃‍♂️! الطفلة هذي هربت بجلدها كي شافتك ما تخدم ما تزيد، واليوم راك تبات في الشارع تندب على الزيارة وتخلص في حق الماعون المكسور في الدار!`,
              `يا ${user1Name} راك تدير في طراس تاع طلاق بائن مبيّن مع ${user2Name} 🚪📉؟ الزواج ما طولش أسبوعين وراكم رايحين تديوا الحالة للقاضي. القاضي حكم عليك تخدم ليل ونهار باش تسلك الديون!`,
              `يا ${user2Name} الفرحة راهي باينة في وجهك بعد الطلاق من ${user1Name} 🛑🗑️.. خلاص تهنيت من النوم تاعو النهار كامل والتقصير في المصروف. عيشي حياتك يا المدام!`
            ];
            finalReport = roasts[Math.floor(Math.random() * roasts.length)];
          } else {
            finalReport = `بعد محاولات صلح فاشلة، تم الطلاق بالتراضي وباحترام متبادل بين ${user1Name} و ${user2Name}.. ربي يفتح على كل واحد فيهم ويرزقهم طريق الخير! ⚖️✨`;
          }
        }
        
        // 2. (أنثى + ذكر): سخرية من الزوج المطرد أو الخالع
        else if (gender1 === 'female' && gender2 === 'male') {
          if (isRoastMode) {
            const roasts = [
              `يا ${user2Name} (المسكين)، طلقتك ${user1Name} بالخلع 📜❌! راك رايح تخرج من الدار بصباط واحد وسروال مقطع. الإنسانة هذه نحاتك من القائمة وفريتffها معاك في الجلسة الأولى!`,
              `يا ${user1Name} درتي في ${user2Name} حالة وطلقتيه ⚖️🔨! المسكين راه يبكي في القهوة ويقول خسرت عمري معاك، واليوم راه يسلف حق التيترو باش يروح لدار يماه.`,
              `طلاق رسمي بين ${user1Name} و ${user2Name} 🚪💔.. ${user2Name} راك تخلص في عواقب لسان المدام في المحكمة، والدار رجعت ليها وحدها وأنت قبضت طريق الشارع!`
            ];
            finalReport = roasts[Math.floor(Math.random() * roasts.length)];
          } else {
            finalReport = `رغم نهاية العلاقة بين ${user1Name} و ${user2Name} بقرار الطلاق، إلا أن الأمور انتهت بهدوء تام.. ربي يعوضكم بالخير! ⚖️💫`;
          }
        }

        // 3. (أنثى + أنثى): طلاق جمعية النساء
        else if (gender1 === 'female' && gender2 === 'female') {
          if (isRoastMode) {
            const roasts = [
              `يا لطيف! حتى الطلاق وقع بين زوج بنات في القروب ✂️💥! صالون الحلاقة اتقسم بالنصف وكل واحد فيكم دات نصيبها من الماكياج والدبابز!`,
              `يا ${user1Name} و ${user2Name}، 📋❌ شكون اللي فسدت الصداقة وطلبت الطلاق؟ النميمة دات العود والتحالف النسوي تكسر في نهار واحد!`,
              `حكم نهائي بالطلاق بين ${user1Name} و ${user2Name}! 🚪📉 المعارك على السيلفيات والتلفونات رجعت للمحاكم علناً في القروب!`
            ];
            finalReport = roasts[Math.floor(Math.random() * roasts.length)];
          } else {
            finalReport = `انفصال ودي وهادئ بين الصديقتين ${user1Name} و ${user2Name}.. كل الاحترام لكل طرف والدروب تفرقوا على خير! 🤝🌟`;
          }
        }

        // 4. (ذكر + ذكر): طلاق الدكورة والقهوة
        else {
          if (isRoastMode) {
            const roasts = [
              `يا مهبولين! حتى الطلاق دخل بين زوز ذكورة 🎮💥؟! الشيشة تكسرت والطبلية تاع القهوة تفضت، واحد فيكم هرب بالبلايستايشن وطلع للسيح!`,
              `يا ${user1Name} و ${user2Name}، 🪑❌ درتوا طلاق بينكم بعد شراكة القهوة؟ والله غير بهدلتوا بالرجولة، الشعيبية راهي تشهد على قسمة الشيشة والتبغ!`,
              `نهاية التحالف المشبوه بالطلاق الرسمي بين ${user1Name} و ${user2Name}! 🪵⚠️ الدار رجعت خاوية وبلا دخان، وكل واحد شد طريق! ☕`
            ];
            finalReport = roasts[Math.floor(Math.random() * roasts.length)];
          } else {
            finalReport = `انفصال تحالف الشراكة والأخوة بين ${user1Name} و ${user2Name} بروح رياضية.. بالتوفيق للجميع في القهوة وخارجها! 🤝💎`;
          }
        }

        const sadnessRate = Math.floor(Math.random() * 90) + 10;
        const timestamp = Date.now();
        
        const avatar1Url = `https://graph.facebook.com/${user1ID}/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662&t=${timestamp}`;
        const avatar2Url = `https://graph.facebook.com/${user2ID}/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662&t=${timestamp}`;
        
        try {
          const canvas = createCanvas(1200, 630);
          const ctx = canvas.getContext('2d');

          const colorPalettes = [
            { start: '#232526', mid: '#414345', end: '#000000', border: '#ff416c' },
            { start: '#2c3e50', mid: '#34495e', end: '#000000', border: '#e74c3c' },
            { start: '#1f1c2c', mid: '#928dab', end: '#000000', border: '#ffb347' },
            { start: '#3e1a1a', mid: '#1a1a1a', end: '#000000', border: '#ff3366' },
            { start: '#141E30', mid: '#243B55', end: '#000000', border: '#00d2ff' }
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
          ctx.fillText('💔', 600, 265);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 34px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(user1Name, 300, 440);
          ctx.fillText(user2Name, 900, 440);

          ctx.fillStyle = '#f1c40f';
          ctx.font = 'bold 30px sans-serif';
          ctx.fillText(`نسبة الشماتة في الطلاق: ${sadnessRate}%`, 600, 490);

          ctx.fillStyle = '#a6b1e1';
          ctx.font = '24px sans-serif';
          ctx.fillText('🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |', 600, 570);

          const cacheDir = path.join(__dirname, "..", "cache");
          if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
          const outputPath = path.join(cacheDir, `divorce_card_${Date.now()}.jpg`);
          
          const buffer = canvas.toBuffer('image/jpeg');
          fs.writeFileSync(outputPath, buffer);

          const textReport = `⚖️ جلسة الطلاق الرسمي في المحكمة والقروب ⚖️\n\n📋 الطرف الأول: ${user1Name}\n📋 الطرف الثاني: ${user2Name}\n\n📊 نسبة الشماتة والخراب: ${sadnessRate}%\n\n📢 تقرير القاضي ومحضر الجلسة:\n${finalReport}\n\n🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |`;

          api.sendMessage({
            body: textReport,
            attachment: fs.createReadStream(outputPath)
          }, threadID, () => {
            fs.unlink(outputPath, ()=>{});
          }, messageID);

        } catch (e) {
          console.error("Canvas error:", e);
          const fallbackText = `⚖️ جلسة طلاق ${user1Name} و ${user2Name}!\n\n${finalReport}\n\n🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |`;
          sendMessage(threadID, fallbackText, messageID);
        }
      });
    });
  }
};

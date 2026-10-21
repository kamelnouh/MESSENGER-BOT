const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// دالة ذكية لتخمين الجنس بناءً على الاسم أو الحساب للكوميديا الجزائرية
function guessGender(name) {
  const n = name.toLowerCase();
  const femaleKeywords = ['fatima', 'zohra', 'amina', 'nour', 'imen', 'rym', 'rania', 'meryem', 'khaoula', 'chaima', 'asma', 'hiba', 'sara', 'selma', 'imene', 'manel', 'nadia', 'hanane', 'amina', 'صارة', 'فاطمة', 'أمينة', 'مريم', 'إيمان', 'ريم', 'رانية', 'شيماء', 'أسماء', 'هبة', 'سلسبيل', 'سندس', 'نهاد', 'ملك', 'سيرين', 'خولة', 'نور', 'إناس'];
  for (const kw of femaleKeywords) {
    if (n.includes(kw)) return 'female';
  }
  return 'male'; // الافتراضي ذكر في حال غموض الاسم
}

module.exports = {
  name: "زواج",
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
          return sendMessage(threadID, "❌ لا يوجد أعضاء كافيون في المجموعة لإجراء الزواج!", messageID);
        }
        user2ID = validMembers[Math.floor(Math.random() * validMembers.length)];
      }
      
      if (user1ID === user2ID) {
        return sendMessage(threadID, "❌ هل تود الزواج من نفسك؟ القانون لا يسمح بذلك يا وحش 😂", messageID);
      }
      
      api.getUserInfo([user1ID, user2ID], async (userErr, usersObj) => {
        if (userErr || !usersObj[user1ID] || !usersObj[user2ID]) {
          return sendMessage(threadID, "❌ تعذر جلب معلومات المستخدمين.", messageID);
        }
        
        const user1Name = info.nicknames?.[user1ID] || usersObj[user1ID].name;
        const user2Name = info.nicknames?.[user2ID] || usersObj[user2ID].name;
        
        const gender1 = guessGender(user1Name);
        const gender2 = guessGender(user2Name);
        
        // --- بنوك القصف الساخر والتبارك حسب الحالات الأربع (عشوائي بين قصف ومباركة) ---
        let finalReport = "";
        const isRoastMode = Math.random() < 0.75; // 75% فرصة قصف وتمنيك، 25% مباركة صافية

        // 1. (ذكر + أنثى): قصف حلاب المدامات والزواج الفاشل
        if (gender1 === 'male' && gender2 === 'female') {
          if (isRoastMode) {
            const roasts = [
              `يا ${user1Name}، راك تزوجت بـ ${user2Name}؟ ياو أنت أسطورة في "التحلاب 💪" والستوريات تاع "منورة يا فلانة 🤭"! الطفلة هذي طاحت فيك وهي تحسبك راجل واصل، وأنت النهار كامل قاعد في القهوة تطلب حق التريسيتي من عند يماك 😹😹💔! علاقتكم رح تكمل في المحاكم بتهمة النصب والاحتيال العاطفي.`,
              `مبروك يا ${user1Name} زواجك من ${user2Name}، 🙂💔 بصح راني عارف بلي راك مسجل في قائمة أكبر "حلاب مدامات 😘👍" في القروب! النهار كامل وأنت تتبع فيها وتدير لايكات، ونهار اللول في الدار تبدا تبكي تحوس على يماك تطيبلك العصيدة.`,
              `يا ${user1Name} راك خطبت ${user2Name} 😎💋 ؟ والله غير مسكينة الطفولة تاعها ضاعت معاك. إنسان عديم النفع، ما تعرف تخدم ما تعرف تجيب فرانك، زواجكم فاشل مسبقاً بنسبة 100% والطلاق في طريق المدام!`,
              `يا ${user2Name} اهربي بصحتك! طحتي في فخ ${user1Name} 😒😒 اللي النهار كامل وهو يبعث رسائل تملق للبنات في المراسلة.. زواجكم مآله الكارثة والشارب تاعو طايح بالدَين.`
            ];
            finalReport = roasts[Math.floor(Math.random() * roasts.length)];
          } else {
            finalReport = `يا له من توافق جميل! ${user1Name} (الذيب) و ${user2Name} (الأميرة).. صراحة ثنائي فخم نتمنى لهما حياة زوجية مليئة بالبركة والسرور والذرية الصالحة! 💐❤️`;
          }
        }
        
        // 2. (أنثى + ذكر): تمنيك وسخرية من الولد المسكين
        else if (gender1 === 'female' && gender2 === 'male') {
          if (isRoastMode) {
            const roasts = [
              `يا ${user2Name} (المسكين)، طحت في فخ ${user1Name}.. 💸😋 زواجك منها معناه أنك رضيت بالذل والشقاء الأبدي! الإنسانة هاذي النهار كامل وهي تاكل وتكسر في الماعون، وعلاقتكم رح تفشل قبل ما تبدأ وتلقى روحك تخلص في الديون.`,
              `مبروك يا ${user1Name} على ${user2Name}، 😭😭 المسكين راه مسحور بيك ولا مانيش عارف واش دارتلك 🙉💔! زوجك مستقبلاً راح يكون عديم النفع، النهار كامل ناعس والشارب طايح، وأنتي تبقاي تخدمي عليه وتأكليه بالخفيفة!`,
              `يا ${user1Name}، راك تزوجت بـ ${user2Name} 🙂💔 المسكين، والله غير راك رايحة تخليه يسلف حق الخبز نهار العرس! علاقة فاشلة بكل المقاييس والطلاق راه يكتب في عقودو من درك.`
            ];
            finalReport = roasts[Math.floor(Math.random() * roasts.length)];
          } else {
            finalReport = `رغم أن ${user1Name} معروفة بلسانها الطويل، إلا أن ${user2Name} عرف كيفاش يترأس قلبها! نتمنى لكما زواجاً مباركاً مليئاً بالحب والسعادة الدائمة! 🥂✨`;
          }
        }

        // 3. (أنثى + أنثى): زواج بنات وصالون حلاقة
        else if (gender1 === 'female' && gender2 === 'female') {
          if (isRoastMode) {
            const roasts = [
              `يا لطيف! جامي شفت زواج بين زوج بنات في القروب! راكم رايحين تفتحوا صالون حلاقة ولا تديروا جمعية نسوية لقطع رؤوس الرجال 😘💋؟ زواج هدا ولا مسرحية دبابز!`,
              `يا ${user1Name} و ${user2Name}، 🙉🙂 راكم متزوجين؟ شكون فيكم اللي راح تطيب الكسرة وشكون اللي تشد التلفون؟ والله غير عرس ميككي والقروب راه يضحك عليكم!`,
              `زواج نسائي خالص بين ${user1Name} و ${user2Name}!🥳💔 الدار رايحة تتحرق بالماكياج والنميمة 24 ساعة على 24 ساعة، والطلاق حاصل غدوة صباحاً!`
            ];
            finalReport = roasts[Math.floor(Math.random() * roasts.length)];
          } else {
            finalReport = `أجمل صداقة تحولت إلى زواج تاريخي بين ${user1Name} و ${user2Name}! بارك الله لكما وأدام محبتكم العميقة في الخير والبركات! 👭💖`;
          }
        }

        // 4. (ذكر + ذكر): زواج دكورة وقهوة وبلايستايشن
        else {
          if (isRoastMode) {
            const roasts = [
              `يا مهبولين! جامي شفت زواج بين زوز ذكورة! راكم رايحين تفتحوا قهوة ولا تلعبوا بلايستايشن للصباح؟ واحد فيكم يدير خمار ويسلك حق الكراء ولا كيفاه 😂💘؟!`,
              `يا ${user1Name} و ${user2Name}، 😭😭 زواج دكورة عيني عينك؟ النهار كامل في القهوة وتزيدوا تزوجوا بعضكم؟ والله غير الشعيبية تخمم فيكم بالخمار والقرطاس!`,
              `هذا هو زواج القرن بين ${user1Name} و ${user2Name}! الدار فيها غير ريحة الشيشة والدخان والغالطة في البلايستايشن، ربي يجيب الخير لهذ الصداقة المنحرفة! 😂`
            ];
            finalReport = roasts[Math.floor(Math.random() * roasts.length)];
          } else {
            finalReport = `تحالف رجالي تاريخي وأخوة مقدسة بين ${user1Name} و ${user2Name}! نتمنى لكما الاستقرار والسند الدايم في السراء والضراء! 🤝🔥`;
          }
        }

        const compatibility = Math.floor(Math.random() * 85) + 5;
        const timestamp = Date.now();
        
        const avatar1Url = `https://graph.facebook.com/${user1ID}/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662&t=${timestamp}`;
        const avatar2Url = `https://graph.facebook.com/${user2ID}/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662&t=${timestamp}`;
        
        try {
          // --- تصميم البطاقة عبر الـ Canvas بألوان عشوائية ومختلفة في كل مرة ---
          const canvas = createCanvas(1200, 630);
          const ctx = canvas.getContext('2d');

          const colorPalettes = [
            { start: '#0f0c29', mid: '#302b63', end: '#24243e', border: '#e94560' },
            { start: '#134e5e', mid: '#71b280', end: '#0f2027', border: '#f39c12' },
            { start: '#cb3594', mid: '#65379b', end: '#111111', border: '#00d2ff' },
            { start: '#870000', mid: '#190a05', end: '#2c3e50', border: '#e74c3c' },
            { start: '#283c86', mid: '#45a247', end: '#0f2027', border: '#ffffff' },
            { start: '#4ca1af', mid: '#2c3e50', end: '#1a1a2e', border: '#f1c40f' }
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

          // دائرة الشخص الأول
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

          // دائرة الشخص الثاني
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

          // القلب في المنتصف
          ctx.fillStyle = '#ff3366';
          ctx.font = 'bold 70px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💖', 600, 265);

          // الأسماء
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 34px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(user1Name, 300, 440);
          ctx.fillText(user2Name, 900, 440);

          // نسبة التوافق
          ctx.fillStyle = '#f1c40f';
          ctx.font = 'bold 30px sans-serif';
          ctx.fillText(`نسبة التوافق: ${compatibility}%`, 600, 490);

          // التوقيع داخل الصورة
          ctx.fillStyle = '#a6b1e1';
          ctx.font = '24px sans-serif';
          ctx.fillText('🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |', 600, 570);

          const cacheDir = path.join(__dirname, "..", "cache");
          if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
          const outputPath = path.join(cacheDir, `marriage_card_${Date.now()}.jpg`);
          
          const buffer = canvas.toBuffer('image/jpeg');
          fs.writeFileSync(outputPath, buffer);

          const textReport = `💍 مراسم الزواج الساخرة في القروب 💍\n\n👰 الطرف الأول: ${user1Name}\n🤵 الطرف الثاني: ${user2Name}\n\n📊 نسبة التوافق: ${compatibility}%\n\n📢 تحليل البوت:\n${finalReport}\n\n🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |`;

          api.sendMessage({
            body: textReport,
            attachment: fs.createReadStream(outputPath)
          }, threadID, () => {
            fs.unlink(outputPath, ()=>{});
          }, messageID);

        } catch (e) {
          console.error("Canvas error:", e);
          const fallbackText = `💍 مراسم زواج ${user1Name} و ${user2Name}!\n\n${finalReport}\n\n🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |`;
          sendMessage(threadID, fallbackText, messageID);
        }
      });
    });
  }
};

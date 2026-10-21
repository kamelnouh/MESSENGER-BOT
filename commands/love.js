const axios = "axios" in global ? global.axios : require("axios");
const fs = "fs" in global ? global.fs : require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// دالة ذكية لتخمين الجنس بناءً على الاسم للكوميديا الجزائرية
function guessGender(name) {
  const n = name.toLowerCase();

  const femaleKeywords = [
    'fatima', 'zohra', 'amina', 'nour', 'imen', 'rym', 'rania',
    'meryem', 'khaoula', 'chaima', 'asma', 'hiba', 'sara', 'selma',
    'imene', 'manel', 'nadia', 'hanane', 'صارة', 'فاطمة', 'أمينة',
    'مريم', 'إيمان', 'ريم', 'رانية', 'شيماء', 'أسماء', 'هبة',
    'سلسبيل', 'سندس', 'نهاد', 'ملك', 'سيرين', 'خولة', 'نور', 'إناس'
  ];

  for (const kw of femaleKeywords) {
    if (n.includes(kw)) return 'female';
  }

  return 'male';
}

module.exports = {
  name: "حب",
  adminOnly: false,
  developerOnly: false,

  execute: async function({
    api,
    event,
    args,
    data,
    senderID,
    threadID,
    messageID,
    sendMessage
  }) {
    const { messageReply } = event;

    let user1ID = senderID;
    let user2ID = messageReply ? messageReply.senderID : null;

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info || !info.participantIDs) {
        return sendMessage(
          threadID,
          "❌ حدث خطأ أثناء جلب أعضاء المجموعة.",
          messageID
        );
      }

      const validMembers = info.participantIDs.filter(
        id => id !== api.getCurrentUserID() && id !== user1ID
      );

      if (!user2ID) {
        if (validMembers.length === 0) {
          return sendMessage(
            threadID,
            "❌ لا يوجد أعضاء كافيون في المجموعة لحساب نسبة الحب!",
            messageID
          );
        }

        user2ID = validMembers[
          Math.floor(Math.random() * validMembers.length)
        ];
      }

      if (user1ID === user2ID) {
        return sendMessage(
          threadID,
          "❌ تحب روحك للدرجة هذه؟ راك باغي تتزوج بمراية بيتك يا الطماع 😂",
          messageID
        );
      }

      api.getUserInfo([user1ID, user2ID], async (userErr, usersObj) => {
        if (
          userErr ||
          !usersObj[user1ID] ||
          !usersObj[user2ID]
        ) {
          return sendMessage(
            threadID,
            "❌ تعذر جلب معلومات المستخدمين.",
            messageID
          );
        }

        const user1Name =
          info.nicknames?.[user1ID] || usersObj[user1ID].name;

        const user2Name =
          info.nicknames?.[user2ID] || usersObj[user2ID].name;

        const gender1 = guessGender(user1Name);
        const gender2 = guessGender(user2Name);

        const loveRate = Math.floor(Math.random() * 101);
        let loveComment = "";

        // --- بنوك قصف وتمسخير نسبة الحب حسب الحالات ---
        if (loveRate > 80) {
          loveComment =
            `يا ${user1Name} و ${user2Name}، نسبة الحب بينكم ${loveRate}%! راكم غرقتوا في العسل للراس.. العشق الهبال والقروب كامل راه يستنى في العرس تاعكم باش ياكل المقروط! 💖🔥`;
        } else if (loveRate > 40) {
          loveComment =
            `يا ${user1Name} و ${user2Name}، نسبة الحب بينكم ${loveRate}%.. علاقة متقلبة، نهار تضاربوا على صاك حلوى ونهار تولو حباب.. ربي يثبت العقل والدين! 🧐💕`;
        } else {
          loveComment =
            `يا ${user1Name} و ${user2Name}، نسبة الحب بينكم ${loveRate}%! بينكم غير الشجار والخصام، لو كان تكملوا هكا واحد فيكم راح يرمي طوب على الاخر في وسط القروب! 💔🗑️`;
        }

        const timestamp = Date.now();

        const avatar1Url =
          `https://graph.facebook.com/${user1ID}/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662&t=${timestamp}`;

        const avatar2Url =
          `https://graph.facebook.com/${user2ID}/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662&t=${timestamp}`;

        try {
          const canvas = createCanvas(1200, 630);
          const ctx = canvas.getContext('2d');

          const colorPalettes = [
            {
              start: '#ff416c',
              mid: '#ff4b2b',
              end: '#1a1a2e',
              border: '#ffffff'
            },
            {
              start: '#834d9b',
              mid: '#d04ed6',
              end: '#111111',
              border: '#ff3366'
            },
            {
              start: '#134e5e',
              mid: '#71b280',
              end: '#0f2027',
              border: '#f39c12'
            },
            {
              start: '#cb3594',
              mid: '#65379b',
              end: '#111111',
              border: '#00d2ff'
            }
          ];

          const selectedPalette = colorPalettes[
            Math.floor(Math.random() * colorPalettes.length)
          ];

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
          ctx.fillText('💖', 600, 265);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 34px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(user1Name, 300, 440);
          ctx.fillText(user2Name, 900, 440);

          ctx.fillStyle = '#f1c40f';
          ctx.font = 'bold 30px sans-serif';
          ctx.fillText(`نسبة الحب العجيبة: ${loveRate}%`, 600, 490);

          ctx.fillStyle = '#a6b1e1';
          ctx.font = '24px sans-serif';
          ctx.fillText(
            '🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |',
            600,
            570
          );

          const cacheDir = path.join(__dirname, "..", "cache");

          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
          }

          const outputPath = path.join(
            cacheDir,
            `love_card_${Date.now()}.jpg`
          );

          const buffer = canvas.toBuffer('image/jpeg');
          fs.writeFileSync(outputPath, buffer);

          const textReport =
            `💞 رادار قياس نسبة الحب في القروب 💞\n\n` +
            `👤 الطرف الأول: ${user1Name}\n` +
            `👤 الطرف الثاني: ${user2Name}\n\n` +
            `📊 نسبة الحب المحسوبة: ${loveRate}%\n\n` +
            `📢 تحليل البوت:\n${loveComment}\n\n` +
            `🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |`;

          api.sendMessage(
            {
              body: textReport,
              attachment: fs.createReadStream(outputPath)
            },
            threadID,
            () => {
              fs.unlink(outputPath, () => {});
            },
            messageID
          );

        } catch (e) {
          console.error("Canvas error:", e);

          const fallbackText =
            `💞 نسبة الحب بين ${user1Name} و ${user2Name} هي ${loveRate}%!\n\n` +
            `${loveComment}\n\n` +
            `🪻💤 𝑲𝒂𝒎𝒆𝒍 𝑩𝒐𝒖𝒎𝒓𝒅𝒂𝒔𝒔𝒊 |`;

          sendMessage(threadID, fallbackText, messageID);
        }
      });
    });
  }
};

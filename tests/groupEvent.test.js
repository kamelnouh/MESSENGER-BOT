// Tests join-event greeting behavior with injected services; no Messenger login is performed.
const assert = require("node:assert/strict");
const test = require("node:test");
const { handleGroupEvent } = require("../bot");

test("welcomes a joining member by name in Arabic and sends the message to their group", async () => {
  const groupId = "group-arabic-welcome";
  const memberId = "member-42";
  const memberName = "ليلى أحمد";
  const greeting = "أهلًا {name}، نورت المجموعة العربية! 🌷";
  const sentMessages = [];
  const greetingGroups = [];

  await handleGroupEvent(
    {
      threadID: groupId,
      logMessageType: "log:subscribe",
      logMessageData: {
        addedParticipants: [{ userFbId: memberId }]
      }
    },
    {
      data: {
        isBanned: () => false,
        addMember: () => {},
        getGreeting(threadID) {
          greetingGroups.push(threadID);
          return greeting;
        }
      },
      getThreadInfo: async () => ({ nicknames: {} }),
      updateGroupMembers: async () => {},
      getUserInfo: async () => ({ name: memberName }),
      isAdmin: () => false,
      sendMessage(threadID, message) {
        sentMessages.push({ threadID, message });
      },
      api: { changeNickname: () => {} },
      botUserId: "bot-user"
    }
  );

  assert.deepEqual(greetingGroups, [groupId]);
  assert.deepEqual(sentMessages, [
    {
      threadID: groupId,
      message: "أهلًا ليلى أحمد، نورت المجموعة العربية! 🌷"
    }
  ]);
});

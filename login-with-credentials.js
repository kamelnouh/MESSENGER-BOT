const login = require("@dongdev/fca-unofficial");
const fs = require("fs");
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("🔐 Facebook Login Setup");
console.log("This will create a fresh appstate.json using email/password\n");

rl.question('Facebook Email: ', (email) => {
  rl.question('Facebook Password: ', (password) => {
    rl.close();
    
    console.log('\n🔄 Attempting login...\n');
    
    const loginOptions = {
      forceLogin: true,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    
    login({ email, password }, loginOptions, (err, api) => {
      if (err) {
        console.error('❌ Login failed:', err);
        
        if (err.error === 'login-approval') {
          console.log('\n⚠️  2-Factor Authentication detected!');
          console.log('Check your phone/email for the approval code and approve the login.');
          console.log('Then run this script again.');
        } else {
          console.log('\n💡 Possible solutions:');
          console.log('1. Check if email/password are correct');
          console.log('2. Try logging into Facebook manually first to complete any security checks');
          console.log('3. Disable 2FA temporarily, or use the appstate method instead');
        }
        
        process.exit(1);
      }
      
      console.log('✅ Login successful!');
      console.log('✅ User ID:', api.getCurrentUserID());
      
      const appState = api.getAppState();
      fs.writeFileSync('appstate.json', JSON.stringify(appState, null, 2));
      
      console.log('✅ appstate.json saved!');
      console.log('\n🚀 You can now run the bot with: npm start\n');
      
      api.logout(() => {
        process.exit(0);
      });
    });
  });
});

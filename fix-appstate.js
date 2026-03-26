const fs = require('fs');

console.log('🔧 Fixing appstate.json format...\n');

try {
  const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
  
  const fixedAppState = appState.map(cookie => {
    const fixed = {
      key: cookie.name || cookie.key,
      value: cookie.value,
      expires: cookie.expirationDate ? String(Math.floor(cookie.expirationDate)) : cookie.expires,
      domain: cookie.domain,
      path: cookie.path || '/',
      secure: cookie.secure || false,
      httponly: cookie.httpOnly || cookie.httponly || false
    };
    
    if (cookie.sameSite) {
      fixed.sameSite = cookie.sameSite;
    }
    
    if (cookie.hostOnly !== undefined) {
      fixed.hostOnly = cookie.hostOnly;
    }
    
    return fixed;
  });
  
  fs.writeFileSync('appstate.json', JSON.stringify(fixedAppState, null, 2));
  
  console.log('✅ appstate.json has been converted to the correct format!');
  console.log(`✅ Converted ${fixedAppState.length} cookies`);
  console.log('\n🚀 You can now run the bot with: npm start\n');
  
} catch (error) {
  console.error('❌ Error fixing appstate:', error.message);
  process.exit(1);
}

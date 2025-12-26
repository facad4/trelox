// Simple test script to verify extension is working
console.log("🔥 TEST EXTENSION LOADED!");
console.log("Current URL:", window.location.href);
console.log("Page title:", document.title);

// Add a visible test element
const testDiv = document.createElement('div');
testDiv.innerHTML = '🔍 EXTENSION WORKING!';
testDiv.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: red;
  color: white;
  padding: 10px;
  z-index: 9999;
  font-weight: bold;
  border-radius: 5px;
`;
document.body.appendChild(testDiv);

// Remove after 5 seconds
setTimeout(() => {
  testDiv.remove();
  console.log("🔥 Test element removed");
}, 5000);


var connections = {};

// 监听插件安装事件
chrome.runtime.onInstalled.addListener(function() {
  console.log('插件已安装');
});

// 处理连接
chrome.runtime.onConnect.addListener(function(port) {
  var tabId = port.sender.tab.id;
  connections[tabId] = port;
  
  port.onDisconnect.addListener(function() {
    delete connections[tabId];
  });
});

// 清理断开的连接
chrome.tabs.onRemoved.addListener(function(tabId) {
  if (connections[tabId]) {
    delete connections[tabId];
  }
}); 
var reportInterval = null;
var isRunning = false;
var currentTimeout = null;
var currentOption = null;

// 修改日志管理相关的代码
var MAX_LOGS = 1000; // 最多保存1000条日志

// 从 localStorage 加载历史日志
function loadLogs() {
  try {
    const savedLogs = localStorage.getItem('felixScriptLogs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  } catch (error) {
    console.error('加载历史日志失败:', error);
    return [];
  }
}

// 保存日志到 localStorage
function saveLogs(logs) {
  try {
    localStorage.setItem('felixScriptLogs', JSON.stringify(logs));
  } catch (error) {
    console.error('保存日志失败:', error);
    // 如果存储空间不足，清除一半的旧日志
    if (error.name === 'QuotaExceededError') {
      const halfLength = Math.floor(logs.length / 2);
      const trimmedLogs = logs.slice(-halfLength);
      localStorage.setItem('felixScriptLogs', JSON.stringify(trimmedLogs));
    }
  }
}

// 初始化日志数组
var scriptLogs = loadLogs();

// 重写 console.log
const originalLog = console.log;
console.log = function(...args) {
  const time = formatTime();
  const logMessage = `[${time}] ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : arg
  ).join(' ')}`;
  
  scriptLogs.push(logMessage);
  if (scriptLogs.length > MAX_LOGS) {
    scriptLogs = scriptLogs.slice(-MAX_LOGS); // 保留最新的1000条
  }
  saveLogs(scriptLogs);
  
  originalLog.apply(console, args);
};

// 重写 console.error
const originalError = console.error;
console.error = function(...args) {
  const time = formatTime();
  const errorMessage = `[${time}] ERROR: ${args.map(arg => 
    arg instanceof Error ? `${arg.message}\n${arg.stack}` :
    typeof arg === 'object' ? JSON.stringify(arg) : arg
  ).join(' ')}`;
  
  scriptLogs.push(errorMessage);
  if (scriptLogs.length > MAX_LOGS) {
    scriptLogs = scriptLogs.slice(-MAX_LOGS);
  }
  saveLogs(scriptLogs);
  
  originalError.apply(console, args);
};

// 在文件顶部添加
console.log('Content script loaded');

// 确保 DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeScript);
} else {
  initializeScript();
}

function initializeScript() {
  console.log('Initializing content script');
  window.hasContentScript = true;
  loadState();
  loadLogs();
  
  // 通知 popup 脚本已准备就绪
  window.postMessage({
    type: 'contentScriptReady',
    isRunning: isRunning,
    currentOption: currentOption
  }, '*');
}

// 修改日志输出
console.log('Felix商品提报助手已加载');

// 修改状态检查函数
function getStatus() {
  const state = getTabState();
  return {
    status: 'success',
    isRunning: state.isRunning,
    currentOption: state.currentOption,
    tabUrl: window.location.href
  };
}

// 修改为使用标签页 ID 存储状态
function getTabKey() {
  // 使用时间戳作为标签页的唯一标识
  if (!window.felixTabId) {
    window.felixTabId = Date.now().toString();
  }
  return `felixReportState_${window.felixTabId}`;
}

// 获取当前标签页状态
function getTabState() {
  const tabKey = getTabKey();
  const savedState = localStorage.getItem(tabKey);
  if (savedState) {
    return JSON.parse(savedState);
  }
  return {
    isRunning: false,
    currentOption: null
  };
}

// 修改状态保存函数
function saveState(state) {
  const tabKey = getTabKey();
  localStorage.setItem(tabKey, JSON.stringify(state));
  console.log('保存状态:', state);
}

// 修改状态加载函数
function loadState() {
  try {
    console.log('=== 加载状态开始 ===');
    const state = getTabState();
    // 更新全局变量
    isRunning = state.isRunning;
    currentOption = state.currentOption;
    console.log('加载的状态:', state);
    console.log('=== 加载状态完成 ===');
  } catch (error) {
    console.error('加载状态出错:', error);
  }
}

// 修改消息监听部分
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Content.js - 收到消息:', request);
  
  try {
    if (request.action === 'startAutoReport') {
      console.log('Content.js - Starting auto report');
      const state = {
        isRunning: true,
        currentOption: request.option
      };
      saveState(state);
      startReportProcess(request.option);
      sendResponse({ status: 'success' });
    } else if (request.action === 'stopAutoReport') {
      console.log('Content.js - Stopping auto report');
      const state = {
        isRunning: false,
        currentOption: null
      };
      saveState(state);
      stopAutoReport();
      sendResponse({ status: 'success' });
    } else if (request.action === 'getStatus') {
      console.log('=== 处理 getStatus 请求 ===');
      const state = getTabState();
      sendResponse({
        status: 'success',
        isRunning: state.isRunning,
        currentOption: state.currentOption,
        tabUrl: window.location.href
      });
      return true;
    } else if (request.action === 'getLogs') {
      const header = `=== Felix商品提报助手运行日志 ===\n导出时间: ${formatTime()}\n总日志数: ${scriptLogs.length}\n\n`;
      const logs = header + scriptLogs.join('\n');
      
      sendResponse({ 
        status: 'success',
        logs: logs
      });
    }
  } catch (error) {
    console.error('Content.js - 处理消息时出错:', error);
    sendResponse({ 
      status: 'error', 
      message: error.message
    });
  }
  return true;
});

// 页面加载时恢复状态
document.addEventListener('DOMContentLoaded', function() {
  loadState();
});

// 点击对应的标签
async function clickTab(option) {
  // 查找所有可能的标签元素
  var tabs = document.querySelectorAll('div[role="tab"], .opportunity-tab, button, .arco-tabs-tab');
  
  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    if (tab.textContent.indexOf(option) !== -1) {
      tab.click();
      
      // 等待5秒让标签内容加载
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 如果是热门商品标签，需要额外处理
      // if (option === '热门商品') {
      //   // 等待展示按钮出现
      //   await waitForElement('button[data-tid="m4b_button_toggle_button"]', 5000);
        
      //   // 点击展示按钮
      //   var toggleButton = document.querySelector('button[data-tid="m4b_button_toggle_button"]');
      //   if (toggleButton) {
      //     toggleButton.click();
      //     // 等待3秒让页面加载
      //     await new Promise(resolve => setTimeout(resolve, 3000));
      //   }
      // }
      
      return true;
    }
  }
  return false;
}

// 等待元素出现
function waitForElement(selector, maxWait) {
  return new Promise(function(resolve) {
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
    currentTimeout = setTimeout(function() {
      currentTimeout = null;
      if (!getTabState().isRunning) {
        resolve(null);
        return;
      }
      var element = document.querySelector(selector);
      resolve(element);
    }, 5000);
  });
}

// 随机选择n个元素
function getRandomElements(array, n) {
  var result = [];
  var len = array.length;
  var taken = new Array(len);
  
  // 如果数组长度小于n，则返回所有元素
  if (n > len) {
    n = len;
  }
  
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = array[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  
  return result;
}

// 检查并裁剪文本内容
function trimContent(element) {
  try {
    console.log('开始检查内容长度...');
    
    // 找到可编辑的div（使用更精确的选择器）
    var editableDiv = element.querySelector('.ProseMirror');
    if (!editableDiv) {
      console.log('未找到可编辑区域');
      return false;
    }

    // 获取当前内容
    var content = editableDiv.textContent;
    console.log('原始内容长度:', content.length);
    
    // 如果超过255个字符
    if (content.length > 255) {
      console.log('内容超过255个字符，进行裁剪');
      
      // 保留255个字符
      var trimmed = content.substring(0, 255);
      console.log('裁剪后内容长度:', trimmed.length);
      
      // 更新内容
      editableDiv.textContent = trimmed;
      
      // 触发内容更新事件
      var event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });
      editableDiv.dispatchEvent(event);
      
      console.log('内容已更新');
      return true;
    }
    
    console.log('内容长度在限制范围内');
    return false;
    
  } catch (error) {
    console.error('裁剪内容时出错:', error);
    return false;
  }
}


// 修改通知状态变化的函数
function notifyStatusChange(running) {
  const state = {
    isRunning: running,
    currentOption: currentOption
  };
  saveState(state);
  window.postMessage({
    type: 'scriptStatusChanged',
    isRunning: running
  }, '*');
}

// 修改自动提报流程
function startReportProcess(option) {
  console.log('Starting report process for:', option);
  
  // 使用 async/await 处理标签切换
  (async function() {
    try {
      // 先点击对应标签
      if (await clickTab(option)) {
        console.log('成功切换到对应标签');
        // 设置定时执行提报
        reportInterval = setInterval(doReport, 5000);
        console.log('已设置自动提报定时器');
        // 立即执行一次
        doReport();
      } else {
        console.log('未找到对应标签');
        saveState({
          isRunning: false,
          currentOption: null
        });
      }
    } catch (error) {
      console.error('Error in report process:', error);
      saveState({
        isRunning: false,
        currentOption: null
      });
    }
  })();
}

// 执行提报操作
function doReport() {
  const state = getTabState();
  if (!state.isRunning) return;
  
  try {
    // 如果正在处理中，则不执行新的操作
    if (window.isProcessing) {
      console.log('上一个操作正在处理中，等待完成...');
      return;
    }

    console.log('开始查找添加商品按钮...');
    
    // 查找所有添加商品按钮
    var addButtons = Array.from(document.querySelectorAll('button[data-tid="m4b_button"]')).filter(function(btn) {
      return btn.textContent.trim() === '添加商品' && !btn.disabled;
    });
    
    console.log('找到可用的添加商品按钮数量:', addButtons.length);
    
    if (addButtons.length === 0) {
      console.log('没有可用的添加商品按钮，停止脚本');
      if (reportInterval) {
        clearInterval(reportInterval);
        reportInterval = null;
      }
      window.isProcessing = false; // 重置处理状态
      window.currentButtonIndex = 0; // 重置按钮索引
      notifyStatusChange(false);
      return;
    }

    // 获取当前要处理的按钮索引
    window.currentButtonIndex = window.currentButtonIndex || 0;
    
    // 如果已经处理完所有按钮，重置状态
    if (window.currentButtonIndex >= addButtons.length) {
      console.log('所有按钮处理完成，重置状态');
      window.currentButtonIndex = 0;
      window.isProcessing = false;
      return;
    }

    // 标记开始处理
    window.isProcessing = true;
    
    // 获取当前要处理的按钮
    var button = addButtons[window.currentButtonIndex];
    console.log('处理第', window.currentButtonIndex + 1, '个添加商品按钮');
    button.click();

    // 等待并点击选择商品按钮
    async function processFlow() {
      try {
        if (!state.isRunning) return;
        
        await waitForElement('button[data-tid="m4b_button"]', 5000);
        if (!state.isRunning) return;
        
        // 查找并点击选择商品按钮
        var modalButtons = document.querySelectorAll('button[data-tid="m4b_button"]');
        var selectButton = Array.from(modalButtons).find(btn => 
          btn.textContent.trim() === '选择商品' && !btn.disabled
        );
        
        if (!selectButton) {
          closePopup();
          window.isProcessing = false;
          window.currentButtonIndex++;
          console.error('未找到选择商品按钮');
          return;
        }
        
        console.log('找到选择商品按钮，点击');
        selectButton.click();

        // 等待商品列表加载
        await waitForElement('div[data-tid="m4b_table"] label[data-tid="m4b_checkbox"]', 5000);
        console.log('商品列表加载完成');

        // 选择商品
        var checkboxes = document.querySelectorAll('div[data-tid="m4b_table"] label[data-tid="m4b_checkbox"]');
        if (checkboxes.length === 0) {
          closePopup();
          window.isProcessing = false;
          window.currentButtonIndex++;
          console.error('未找到商品复选框');
          return;
        }

        var selectedCheckboxes = getRandomElements(Array.from(checkboxes), 5);
        console.log('随机选择的复选框数量:', selectedCheckboxes.length);
        
        selectedCheckboxes.forEach(checkbox => {
          checkbox.click();
          console.log('点击复选框');
        });

        await new Promise(resolve => {
          if (currentTimeout) {
            clearTimeout(currentTimeout);
          }
          currentTimeout = setTimeout(() => {
            currentTimeout = null;
            if (!state.isRunning) {
              resolve();
              return;
            }
            resolve();
          }, 1000);
        });

        // 根据当前选项决定后续流程
        if (state.currentOption === '热门商品') {
          // 热门商品直接查找提交按钮
          var submitButton = Array.from(document.querySelectorAll('button[data-tid="m4b_button"]'))
            .find(btn => btn.textContent.trim() === '提交' && !btn.disabled);

          if (!submitButton) {
            closePopup();
            window.isProcessing = false;
            window.currentButtonIndex++;
            console.error('未找到提交按钮');
            return;
          }

          console.log('找到提交按钮，点击');
          submitButton.click();
        } else {
          // 其他选项走原有流程
          var nextButton = Array.from(document.querySelectorAll('button[data-tid="m4b_button"]'))
            .find(btn => btn.textContent.trim() === '下一步' && !btn.disabled);
          
          if (!nextButton) {
            closePopup();
            window.isProcessing = false;
            window.currentButtonIndex++;
            console.error('未找到下一步按钮');
            return;
          }

          console.log('找到下一步按钮，点击');
          nextButton.click();

          // 等待新页面加载
          await waitForElement('.theme-arco-switch', 5000);
          console.log('新页面加载完成');

          // 检查并打开开关
          var switchButton = document.querySelector('button[role="switch"][aria-checked="false"].core-switch');
          if (switchButton) {
            console.log('开关未打开，点击开关');
            switchButton.click();
          }

          // 处理内容框
          var editors = document.querySelectorAll('div[data-tid="m4b_message_editor_rich"]');
          var hasChanges = false;
          console.log('处理内容框:', editors.length);
          editors.forEach(editor => {
            if (trimContent(editor)) {
              hasChanges = true;
            }
          });

          if (hasChanges) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // 点击提交
          submitButton = Array.from(document.querySelectorAll('button[data-tid="m4b_button"]'))
            .find(btn => btn.textContent.trim() === '提交' && !btn.disabled);

          if (!submitButton) {
            closePopup();
            window.isProcessing = false;
            window.currentButtonIndex++;
            console.error('未找到提交按钮');
            return;
          }

          console.log('找到提交按钮，点击');
          submitButton.click();
        }

        // 等待提交完成
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('提交完成，准备处理下一个按钮');
        
        // 更新状态
        window.isProcessing = false;
        window.currentButtonIndex++;

      } catch (error) {
        console.error('处理流程出错:', error);
        window.isProcessing = false;
        notifyStatusChange(false);  // 通知状态变化
      }
    }

    // 启动处理流程
    processFlow();

  } catch (error) {
    console.error('提报操作失败:', error);
    window.isProcessing = false;
    window.currentButtonIndex = 0;
    notifyStatusChange(false);
  }
}

// 尝试关闭弹窗
function closePopup() {
  try {
    const closeButton = document.querySelector('.core-drawer-close-icon');
    if (closeButton) {
      closeButton.click();
      console.log('已关闭弹窗');
    }
  } catch (error) {
    console.error('关闭弹窗失败:', error);
  }
}

// 修改停止操作的处理
function stopAutoReport() {
  console.log('Stopping auto report');
  const state = getTabState();
  state.isRunning = false;
  state.currentOption = null;
  window.isProcessing = false;
  window.currentButtonIndex = 0;
  
  // 清除所有定时器
  if (currentTimeout) {
    clearTimeout(currentTimeout);
    currentTimeout = null;
  }

  if (reportInterval) {
    clearInterval(reportInterval);
    reportInterval = null;
  }

  // 保存状态
  saveState(state);

  // 尝试关闭弹窗
  closePopup();
}

// 在控制台输出当前状态
console.log('Subscription data:', localStorage.getItem('felixSubscription'));

// 页面卸载时清除状态
window.addEventListener('unload', function() {
  const tabKey = getTabKey();
  localStorage.removeItem(tabKey);
});

function formatTime() {
  const now = new Date();
  return now.toLocaleString('zh-CN', { 
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
} 
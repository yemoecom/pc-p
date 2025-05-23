// 添加常量和辅助函数
const VALID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TYPE_MONTHLY = 'M';
const TYPE_PERMANENT = 'P';

function generateChecksum(type, mainCode) {
  let sum = type.charCodeAt(0);
  for (let i = 0; i < mainCode.length; i++) {
    sum += mainCode.charCodeAt(i) * (i + 1);
  }
  return sum.toString(36).slice(-2).toUpperCase();
}

// 检查当前页面是否为目标页面
function checkCurrentPage() {
  return new Promise(function(resolve) {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs || !tabs[0]) {
          updateUIState(false, false);
          resolve(false);
          return;
        }

        // 检查运行状态
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'getStatus'
        }, function(response) {
          if (chrome.runtime.lastError || !response) {
            updateUIState(false, true); // 启用开始按钮
            resolve(true);
            return;
          }

          const running = response.status === 'success' ? response.isRunning : false;
          updateUIState(running, true);
          resolve(true);
        });
      });
    } catch (error) {
      console.error('检查页面失败:', error);
      updateUIState(false, false);
      resolve(false);
    }
  });
}

// 获取选中的选项
function getSelectedOption() {
  var options = document.getElementsByName('report-type');
  for (var i = 0; i < options.length; i++) {
    if (options[i].checked) {
      return options[i].value;
    }
  }
  return '热门搜索关键词';
}

// 开始自动提报
function startAutoReport() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || !tabs[0]) return;
    
    const selectedOption = getSelectedOption();
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'startAutoReport',
      option: selectedOption,
      tabUrl: tabs[0].url
    }, function(response) {
      if (response && response.status === 'success') {
        updateUIState(true, response.isActivated, tabs[0].url);
      }
    });
  });
}

// 停止自动提报
function stopAutoReport() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || !tabs[0]) return;
    
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'stopAutoReport',
      tabUrl: tabs[0].url
    }, function(response) {
      if (response && response.status === 'success') {
        updateUIState(false, response.isActivated, tabs[0].url);
      }
    });
  });
}

function handleError(error) {
  console.error('错误:', error);
  alert('操作失败，请刷新页面后重试');
  updateUIState(false);
}

// 修改 updateUIState 函数
function updateUIState(running, enabled = true) {
  console.log('=== 更新UI状态 ===');
  console.log('运行状态:', running);
  console.log('启用状态:', enabled);
  
  const startButton = document.getElementById('start');
  const stopButton = document.getElementById('stop');
  const options = document.getElementsByName('report-type');
  
  if (!enabled) {
    // 禁用所有按钮和选项
    startButton.disabled = true;
    stopButton.disabled = true;
    options.forEach(radio => {
      radio.disabled = true;
      radio.parentElement.classList.add('disabled');
    });
    return;
  }
  
  // 根据运行状态设置
  if (running) {
    console.log('设置运行中状态');
    startButton.disabled = true;
    stopButton.disabled = false;
  } else {
    console.log('设置停止状态');
    startButton.disabled = false;
    stopButton.disabled = true;
  }
  
  // 更新选项状态
  options.forEach(radio => {
    radio.disabled = running;
    radio.parentElement.classList.toggle('disabled', running);
  });
}

// 修改 checkStatus 函数
function checkStatus() {
  console.log('=== 开始检查状态 ===');
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || !tabs[0]) {
      console.log('没有找到活动标签页');
      updateUIState(false, false);
      return;
    }

    // 注入内容脚本
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        return window.hasContentScript === true;
      }
    }).then(results => {
      const hasScript = results[0]?.result;
      
      if (!hasScript) {
        console.log('Content script 未加载，重新注入...');
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        }).then(() => {
          setTimeout(sendStatusRequest, 500);
        });
      } else {
        sendStatusRequest();
      }
    });

    function sendStatusRequest() {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'getStatus'
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('获取状态失败，等待重试...');
          setTimeout(() => {
            chrome.tabs.reload(tabs[0].id, {}, () => {
              setTimeout(checkStatus, 1000);
            });
          }, 1000);
          return;
        }

        if (response && response.status === 'success') {
          updateUIState(response.isRunning, true);
          if (response.isRunning && response.currentOption) {
            const options = document.getElementsByName('report-type');
            for (let option of options) {
              if (option.value === response.currentOption) {
                option.checked = true;
                break;
              }
            }
          }
        }
      });
    }
  });
}

// 修改消息监听部分
function initStatusListener() {
  window.addEventListener('message', function(event) {
    if (event.data.type === 'scriptStatusChanged') {
      updateUIState(event.data.isRunning);
    }
  });
}

// 添加导出日志功能
function exportLogs() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || !tabs[0]) return;
    
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'getLogs'
    }, function(response) {
      if (!response || response.status !== 'success') {
        alert('获取日志失败');
        return;
      }
      
      // 创建下载
      const blob = new Blob([response.logs], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `felix-script-logs-${timestamp}.txt`;
      a.click();
      
      URL.revokeObjectURL(url);
    });
  });
}

// 在 DOMContentLoaded 事件中初始化
document.addEventListener('DOMContentLoaded', function() {
  console.log('popup页面加载完成');
  
  // 先检查当前页面
  checkCurrentPage().then(function() {
    // 初始化其他功能
    initStatusListener();
    
    // 添加按钮事件监听
    document.getElementById('start').addEventListener('click', startAutoReport);
    document.getElementById('stop').addEventListener('click', stopAutoReport);
    document.getElementById('export-logs').addEventListener('click', exportLogs);
    
    // 立即检查状态
    checkStatus();
  });
}); 
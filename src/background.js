browser.runtime.onMessage.addListener(function(request, sender) {
  if (request == "show_page_action") {
    browser.pageAction.show(sender.tab.id);
  }
});

browser.pageAction.onClicked.addListener(function() {
  browser.runtime.openOptionsPage();
});

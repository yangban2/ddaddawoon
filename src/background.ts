// // popup → content 간 메시지 중계용 (옵션)
// chrome.runtime.onMessage.addListener((msg, sender, send) => {
//   if (msg.type === "GET_IMAGES") {
//     chrome.tabs.sendMessage(sender.tab!.id!, "GET_IMAGES", (imgs) => {
//       send(imgs)
//     })
//     return true
//   }
// })
// //

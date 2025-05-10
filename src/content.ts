interface Img {
  src: string
  width: number
  height: number
}

const imgs: Img[] = Array.from(
  document.querySelectorAll<HTMLImageElement>("img")
).map((img) => ({
  src: img.src,
  width: img.naturalWidth,
  height: img.naturalHeight,
}))

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === "GET_IMAGES") {
    sendResponse(imgs)

    return true
  }
})

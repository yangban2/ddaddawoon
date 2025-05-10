import { useEffect, useState } from "react"

type Img = { src: string; width: number; height: number }

export default function App() {
  const [imgs, setImgs] = useState<Img[]>([])
  const [filtered, setFiltered] = useState<Img[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [minWidth, setMinWidth] = useState<number>(0)
  const [minHeight, setMinHeight] = useState<number>(0)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return
      // 모든 프레임에 코드 주입
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id, allFrames: true },
          func: () => {
            // 이 함수는 프레임마다 실행됩니다
            return Array.from(document.images).map((img) => ({
              src: img.src,
              width: img.naturalWidth,
              height: img.naturalHeight,
            }))
          },
        },
        (results) => {
          // results: 프레임별 반환값 배열
          const allImgs = results.flatMap((r) => r.result as Img[])
          // src 기준으로 중복 제거
          const unique = Array.from(
            new Map(allImgs.map((i) => [i.src, i])).values()
          )
          setImgs(unique)
          setFiltered(unique)
        }
      )
    })
  }, [])

  const applyFilter = () => {
    const f = imgs.filter(
      (img) => img.width >= minWidth && img.height >= minHeight
    )
    setFiltered(f)
    setSelected(new Set())
  }

  const toggle = (src: string) => {
    const s = new Set(selected)

    if (s.has(src)) {
      s.delete(src)
    } else {
      s.add(src)
    }
    setSelected(s)
  }

  const allToggle = (on: boolean) => {
    setSelected(on ? new Set(filtered.map((i) => i.src)) : new Set())
  }

  function getSafeFilename(url: string): string {
    const u = new URL(url)

    let name = u.pathname.split("/").pop() || "download"
    name = decodeURIComponent(name)
    name = name.replace(/[<>:"\\|?*]/g, "_")
    return name
  }

  // URL 하나를 다운로드하는 Promise 래퍼
  function downloadOne(url: string): Promise<number> {
    const filename = getSafeFilename(url)
    return new Promise((resolve, reject) => {
      chrome.downloads.download(
        {
          url,
          filename,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else if (typeof downloadId === "undefined") {
            reject(new Error("다운로드 ID를 받을 수 없었습니다."))
          } else {
            resolve(downloadId)
          }
        }
      )
    })
  }

  const downloadSelected = async () => {
    if (!selected.size) return
    try {
      const ids = await Promise.all([...selected].map(downloadOne))
      console.log("다운로드된 파일 ID 목록:", ids)
      alert("✅ 모든 이미지 다운로드가 완료되었습니다!")
    } catch (err) {
      console.error("다운로드 중 오류:", err)
      alert("❌ 다운로드 실패: " + err)
    }
  }

  const copyToClipboard = async () => {
    const text = [...selected].join("\n")
    await navigator.clipboard.writeText(text)
    alert("✅ 링크가 클립보드에 복사되었습니다!")
  }

  return (
    <div style={{ width: 360, padding: 12, fontFamily: "sans-serif" }}>
      {/* 필터 입력 */}
      <div style={{ marginBottom: 12 }}>
        <label>
          Min Width:{" "}
          <input
            type="number"
            value={minWidth}
            onChange={(e) => setMinWidth(Number(e.target.value))}
            style={{ width: 60 }}
          />
        </label>
        {"  "}
        <label>
          Min Height:{" "}
          <input
            type="number"
            value={minHeight}
            onChange={(e) => setMinHeight(Number(e.target.value))}
            style={{ width: 60 }}
          />
        </label>
        {"  "}
        <button onClick={applyFilter}>적용</button>
      </div>

      {/* 전체 선택/해제 */}
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => allToggle(true)}>전체 선택</button>
        <button onClick={() => allToggle(false)}>전체 해제</button>
      </div>

      {/* 썸네일 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 4,
          maxHeight: 300,
          overflowY: "auto",
        }}
      >
        {filtered.map((img) => (
          <img
            key={img.src}
            src={img.src}
            width={100}
            height={100}
            style={{
              opacity: selected.has(img.src) ? 1 : 0.3,
              cursor: "pointer",
              objectFit: "cover",
            }}
            onClick={() => toggle(img.src)}
          />
        ))}
      </div>

      {/* 개별 동작 버튼 */}
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button
          disabled={!selected.size}
          onClick={downloadSelected}
          style={{ flex: 1 }}
        >
          다운로드
        </button>
        <button
          disabled={!selected.size}
          onClick={copyToClipboard}
          style={{ flex: 1 }}
        >
          클립보드 복사
        </button>
      </div>
    </div>
  )
}

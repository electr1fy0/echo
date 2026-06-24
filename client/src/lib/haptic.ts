const isTouchDevice =
  typeof window !== "undefined"
    ? window.matchMedia("(pointer: coarse)").matches
    : false;

export function haptic(pattern: number | number[] = 50) {
  try {
    if (!isTouchDevice) return;

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
      return;
    }

    // iOS 18 Switch Haptic Hack
    if (typeof document === "undefined") return;

    let container = document.getElementById("ios-haptic-hack-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "ios-haptic-hack-container";
      // Position offscreen with opacity 0 so it's in layout tree but invisible & interactive-disabled
      container.style.position = "absolute";
      container.style.opacity = "0";
      container.style.pointerEvents = "none";
      container.style.width = "1px";
      container.style.height = "1px";
      container.style.overflow = "hidden";
      container.style.top = "0";
      container.style.left = "0";

      const label = document.createElement("label");
      label.htmlFor = "ios-haptic-hack-input";
      label.ariaHidden = "true";

      const input = document.createElement("input");
      input.id = "ios-haptic-hack-input";
      input.type = "checkbox";
      input.setAttribute("switch", "");

      container.appendChild(input);
      container.appendChild(label);
      document.body.appendChild(container);
    }

    const labelToClick = container.querySelector("label");
    if (labelToClick) {
      labelToClick.click();
    }
  } catch {}
}

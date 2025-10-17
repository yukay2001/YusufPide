// Notification sound system

let audioContext: AudioContext | null = null;

// Initialize audio context (required for some browsers)
export function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Play notification sound from URL
export function playNotificationSound(url: string) {
  try {
    const audio = new Audio(url);
    audio.volume = 0.7;
    audio.play().catch((error) => {
      console.error("Error playing notification sound:", error);
    });
  } catch (error) {
    console.error("Error creating audio:", error);
  }
}

// Generate a simple beep sound using Web Audio API
export function playBeep(frequency: number = 440, duration: number = 200) {
  try {
    const ctx = initAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (error) {
    console.error("Error playing beep:", error);
  }
}

// Notification types
export const NOTIFICATION_SOUNDS = {
  NEW_ORDER: "new_order",
  CANCEL_REQUEST: "cancel_request",
  ORDER_READY: "order_ready",
} as const;

// Default sound frequencies for different notification types
const DEFAULT_FREQUENCIES: Record<string, number> = {
  new_order: 880, // High beep for new order
  cancel_request: 440, // Mid beep for cancel request
  order_ready: 660, // Medium-high beep for order ready
};

// Play notification based on settings
export async function playNotification(type: keyof typeof NOTIFICATION_SOUNDS) {
  try {
    // Try to fetch custom sound URL from settings
    const response = await fetch(`/api/settings/notification_sound_${type}`);
    if (response.ok) {
      const setting = await response.json();
      if (setting.value) {
        // Play custom sound from URL
        playNotificationSound(setting.value);
        return;
      }
    }
  } catch (error) {
    // If settings fetch fails, fall back to default beep
    console.log("Using default notification sound");
  }

  // Fall back to default beep
  const frequency = DEFAULT_FREQUENCIES[type] || 440;
  playBeep(frequency, 200);
}

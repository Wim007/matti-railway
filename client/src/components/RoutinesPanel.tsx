import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface RoutinesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  routineResponse?: { type: "bedtime" | "wakeup"; message: string; tip?: string; empathy?: string } | null;
  onClearResponse?: () => void;
}

export default function RoutinesPanel({ isOpen, onClose, routineResponse, onClearResponse }: RoutinesPanelProps) {
  const [sleepEnabled, setSleepEnabled] = useState(false);
  const [bedtime, setBedtime] = useState("22:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [pushGranted, setPushGranted] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: routine } = trpc.routine.getRoutine.useQuery(undefined, {
    refetchOnMount: true,
  });
  const { data: vapidData } = trpc.routine.getVapidKey.useQuery();
  const saveRoutine = trpc.routine.saveRoutine.useMutation();
  const savePushSub = trpc.routine.savePushSubscription.useMutation();

  // Load saved settings
  useEffect(() => {
    if (routine) {
      setSleepEnabled(routine.sleepEnabled);
      setBedtime(routine.bedtime);
      setWakeTime(routine.wakeTime);
    }
  }, [routine]);

  // Check push permission
  useEffect(() => {
    if ("Notification" in window) {
      setPushGranted(Notification.permission === "granted");
    }
  }, []);

  async function requestPushPermission() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast.error("Push notificaties worden niet ondersteund door deze browser.");
      return false;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Notificaties zijn geblokkeerd. Sta ze toe in je browserinstellingen.");
      return false;
    }
    setPushGranted(true);
    return true;
  }

  async function subscribeToPush() {
    if (!vapidData?.publicKey) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await savePushSub.mutateAsync({ subscription: existing.toJSON() as any });
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });
      await savePushSub.mutateAsync({ subscription: sub.toJSON() as any });
    } catch (err) {
      console.error("Push subscribe fout:", err);
      toast.error("Kon push notificaties niet activeren.");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (sleepEnabled) {
        const granted = pushGranted || (await requestPushPermission());
        if (granted) await subscribeToPush();
      }
      await saveRoutine.mutateAsync({ sleepEnabled, bedtime, wakeTime });
      toast.success("Routine opgeslagen!");
      onClose();
    } catch (err) {
      toast.error("Opslaan mislukt. Probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop - geen onClick zodat paneel niet wegspringt */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div className="relative w-80 max-w-full h-full bg-background shadow-xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg">Routines</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
        </div>

        {/* Routine response (after push notification click) */}
        {routineResponse && (
          <div className="m-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="font-semibold text-sm mb-2">{routineResponse.message}</p>
            {routineResponse.tip && (
              <p className="text-sm text-muted-foreground mt-2">{routineResponse.tip}</p>
            )}
            {routineResponse.empathy && (
              <p className="text-sm text-muted-foreground mt-2 italic">{routineResponse.empathy}</p>
            )}
            <button
              onClick={onClearResponse}
              className="mt-3 text-xs text-primary underline"
            >
              Sluiten
            </button>
          </div>
        )}

        <div className="p-4 space-y-6 flex-1">
          {/* Slaaproutine module */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Slaaproutine</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Push bericht bij bedtijd en opstaan</p>
              </div>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => setSleepEnabled(!sleepEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  sleepEnabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    sleepEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {sleepEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Bedtijd</label>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Opstaan</label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {!pushGranted && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
                    Je hebt toestemming nodig voor push berichten. Je wordt gevraagd bij het opslaan.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Placeholder voor toekomstige modules */}
          <div className="border rounded-lg p-4 opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Huiswerk-reminder</h3>
                <p className="text-xs text-muted-foreground">Binnenkort beschikbaar</p>
              </div>
              <span className="text-xs bg-muted px-2 py-1 rounded">Binnenkort</span>
            </div>
          </div>

          <div className="border rounded-lg p-4 opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Dagelijkse check-in</h3>
                <p className="text-xs text-muted-foreground">Binnenkort beschikbaar</p>
              </div>
              <span className="text-xs bg-muted px-2 py-1 rounded">Binnenkort</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-semibold disabled:opacity-50"
          >
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: convert VAPID public key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

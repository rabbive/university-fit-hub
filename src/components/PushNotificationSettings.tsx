import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, BellRing, Loader2, AlertCircle } from "lucide-react";

interface PushNotificationSettingsProps {
  userId: string | null;
}

export const PushNotificationSettings = ({ userId }: PushNotificationSettingsProps) => {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications(userId);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
        <AlertCircle className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">Push Notifications Not Supported</p>
          <p className="text-xs text-muted-foreground">Your browser doesn't support push notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-accent" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <BellOff className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <Label className="text-foreground font-medium">Push Notifications</Label>
            <p className="text-xs text-muted-foreground">
              {isSubscribed 
                ? "You'll receive real-time alerts" 
                : "Enable to get instant notifications"}
            </p>
          </div>
        </div>
        
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            checked={isSubscribed}
            onCheckedChange={(checked) => {
              if (checked) {
                subscribe();
              } else {
                unsubscribe();
              }
            }}
          />
        )}
      </div>

      {permission === 'denied' && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        </div>
      )}

      {isSubscribed && (
        <Button
          variant="outline"
          size="sm"
          onClick={sendTestNotification}
          className="w-full"
        >
          <Bell className="w-4 h-4 mr-2" />
          Send Test Notification
        </Button>
      )}
    </div>
  );
};

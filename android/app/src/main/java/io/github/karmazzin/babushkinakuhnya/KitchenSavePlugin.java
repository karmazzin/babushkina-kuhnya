package io.github.karmazzin.babushkinakuhnya;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

/** Confirms disk persistence before acknowledging a settled game turn. */
@CapacitorPlugin(name = "KitchenSave")
public class KitchenSavePlugin extends Plugin {
    private static final String KEY = "babushkina-kuhnya:progress";

    private SharedPreferences store() {
        return getContext().getSharedPreferences("KitchenProgress", Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void get(PluginCall call) {
        if (!KEY.equals(call.getString("key"))) {
            call.reject("Unexpected save key");
            return;
        }
        try {
            String value = store().getString(KEY, null);
            JSObject result = new JSObject();
            result.put("value", value == null ? JSONObject.NULL : value);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not read progress", error);
        }
    }

    @PluginMethod
    public void set(PluginCall call) {
        String value = call.getString("value");
        if (!KEY.equals(call.getString("key")) || value == null) {
            call.reject("Invalid save");
            return;
        }
        try {
            // Capacitor invokes plugin methods on its handler thread, not the UI thread.
            // apply() has no success result; commit() confirms the write or reports failure.
            if (!store().edit().putString(KEY, value).commit()) {
                call.reject("Could not persist progress");
                return;
            }
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not persist progress", error);
        }
    }
}

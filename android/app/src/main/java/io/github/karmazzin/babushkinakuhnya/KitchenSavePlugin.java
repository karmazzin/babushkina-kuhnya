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

    private boolean allowed(String key) {
        return KEY.equals(key) || (KEY + ":backup").equals(key)
            || (KEY + ":achievements").equals(key) || (KEY + ":recovery-complete").equals(key)
            || "babushkina-kuhnya:v1".equals(key) || "babushkina-kuhnya:v2".equals(key)
            || "babushkina-kuhnya:v3".equals(key);
    }

    private SharedPreferences store() {
        return getContext().getSharedPreferences("KitchenProgress", Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void get(PluginCall call) {
        if (!allowed(call.getString("key"))) {
            call.reject("Unexpected save key");
            return;
        }
        try {
            String value = store().getString(call.getString("key"), null);
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
        if (!allowed(call.getString("key")) || value == null) {
            call.reject("Invalid save");
            return;
        }
        try {
            // Capacitor invokes plugin methods on its handler thread, not the UI thread.
            // apply() has no success result; commit() confirms the write or reports failure.
            if (!store().edit().putString(call.getString("key"), value).commit()) {
                call.reject("Could not persist progress");
                return;
            }
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not persist progress", error);
        }
    }
    @PluginMethod
    public void setMany(PluginCall call) {
        JSObject values = call.getObject("values");
        if (values == null) { call.reject("Invalid save set"); return; }
        try {
            SharedPreferences.Editor editor = store().edit();
            java.util.Iterator<String> names = values.keys();
            while (names.hasNext()) {
                String key = names.next();
                if (!allowed(key)) { call.reject("Unexpected save key"); return; }
                Object value = values.get(key);
                if (value == JSONObject.NULL) editor.remove(key);
                else if (value instanceof String) editor.putString(key, (String) value);
                else { call.reject("Invalid save value"); return; }
            }
            if (!editor.commit()) { call.reject("Could not persist progress"); return; }
            call.resolve();
        } catch (Exception error) { call.reject("Could not persist progress", error); }
    }

}

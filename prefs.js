import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Gtk from "gi://Gtk";

export default class LauncherPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup();
        page.add(group);

        // Enter Path
        const rowPath = new Adw.ActionRow({
            title: "Enter Path",
            subtitle: "Directory with your scripts",
        });
        group.add(rowPath);

        const entryPath = new Gtk.Entry({
            placeholder_text: "/home/username/myscripts",
            text: settings.get_string("path"),
            valign: Gtk.Align.CENTER,
            hexpand: true,
        });

        settings.bind("path", entryPath, "text", Gio.SettingsBindFlags.DEFAULT);

        rowPath.add_suffix(entryPath);
        rowPath.activatable_widget = entryPath;

        // Log
        const rowLog = new Adw.ActionRow({
            title: "Log",
            subtitle: `${GLib.get_home_dir()}/.${this.metadata.name}.log`,
        });
        group.add(rowLog);

        const toggleLog = new Gtk.Switch({
            active: settings.get_boolean("log"),
            valign: Gtk.Align.CENTER,
        });

        settings.bind("log", toggleLog, "active", Gio.SettingsBindFlags.DEFAULT);

        rowLog.add_suffix(toggleLog);
        rowLog.activatable_widget = toggleLog;

        // Notify
        const rowNotify = new Adw.ActionRow({
            title: "Notify",
            subtitle: "Show a notification (stdout || stderr || exit code) on script completion",
        });
        group.add(rowNotify);

        const toggleNotify = new Gtk.Switch({
            active: settings.get_boolean("notify"),
            valign: Gtk.Align.CENTER,
        });

        settings.bind("notify", toggleNotify, "active", Gio.SettingsBindFlags.DEFAULT);

        rowNotify.add_suffix(toggleNotify);
        rowNotify.activatable_widget = toggleNotify;

        // Shebang Icon
        const rowIconType = new Adw.ActionRow({
            title: "Shebang Icon",
            subtitle: "Use script shebang to set an icon",
        });
        group.add(rowIconType);

        const toggleIconType = new Gtk.Switch({
            active: settings.get_boolean("shebang-icon"),
            valign: Gtk.Align.CENTER,
        });

        settings.bind("shebang-icon", toggleIconType, "active", Gio.SettingsBindFlags.DEFAULT);

        rowIconType.add_suffix(toggleIconType);
        rowIconType.activatable_widget = toggleIconType;

        // Default Icon
        const rowIconName = new Adw.ActionRow({
            title: "Default Icon",
            subtitle: "Used when shebang icon is disabled",
        });
        group.add(rowIconName);

        const entryIconName = new Gtk.Entry({
            placeholder_text: "pan-end-symbolic",
            text: settings.get_string("default-icon"),
            valign: Gtk.Align.CENTER,
            hexpand: true,
        });

        settings.bind("default-icon", entryIconName, "text", Gio.SettingsBindFlags.DEFAULT);

        rowIconName.add_suffix(entryIconName);
        rowIconName.activatable_widget = entryIconName;

        // Strip
        const rowStrip = new Adw.ActionRow({
            title: "Strip",
            subtitle: "Hide file extensions",
        });
        group.add(rowStrip);

        const toggleStrip = new Gtk.Switch({
            active: settings.get_boolean("strip"),
            valign: Gtk.Align.CENTER,
        });

        settings.bind("strip", toggleStrip, "active", Gio.SettingsBindFlags.DEFAULT);

        rowStrip.add_suffix(toggleStrip);
        rowStrip.activatable_widget = toggleStrip;

        window.add(page);
    }
}

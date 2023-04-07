'use strict';


const {Adw, Gio, GLib, Gtk} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
}


function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings();

    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    // Enter Path
    const rowPath = new Adw.ActionRow({
        title: 'Enter Path',
        subtitle: 'Directory with your scripts',
    });
    group.add(rowPath);

    const entry = new Gtk.Entry({
        placeholder_text: '/home/username/myscripts',
        text: settings.get_string('path'),
        valign: Gtk.Align.CENTER,
        hexpand: true,
    });

    rowPath.add_suffix(entry);
    rowPath.activatable_widget = entry;

    settings.bind(
        'path',
        entry,
        'text',
        Gio.SettingsBindFlags.DEFAULT
    );

    // Enable Logs
    const rowLog = new Adw.ActionRow({
        title: 'Enable Log',
        subtitle: `${GLib.get_home_dir()}/.${Me.metadata.name}.log`,
    });
    group.add(rowLog);

    const toggleLog = new Gtk.Switch({
        active: settings.get_boolean('logging'),
        valign: Gtk.Align.CENTER,
    });

    settings.bind(
        'logging',
        toggleLog,
        'active',
        Gio.SettingsBindFlags.DEFAULT
    );

    rowLog.add_suffix(toggleLog);
    rowLog.activatable_widget = toggleLog;

    // Notify
    const rowNotify = new Adw.ActionRow({
        title: 'Notify',
        subtitle: 'Show a notification on command completion',
    });
    group.add(rowNotify);

    const toggleNotify = new Gtk.Switch({
        active: settings.get_boolean('notify'),
        valign: Gtk.Align.CENTER,
    });

    settings.bind(
        'notify',
        toggleNotify,
        'active',
        Gio.SettingsBindFlags.DEFAULT
    );

    rowNotify.add_suffix(toggleNotify);
    rowNotify.activatable_widget = toggleNotify;

    window.add(page);
}

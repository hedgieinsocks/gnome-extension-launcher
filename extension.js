'use strict';


const {GLib, St, Gio} = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


const ICON = 'utilities-terminal-symbolic';


class Extension {
    constructor() {
        this._indicator = null;
        this._settings = null;
        this._launcher = null;
    }


    _appendLog(stdout, stderr) {
        let logName = `${GLib.get_home_dir()}/.${Me.metadata.name}.log`;
        let logFile = Gio.File.new_for_path(logName);
        let outputStream = logFile.append_to(Gio.FileCreateFlags.NONE, null);
        let encoder = new TextEncoder();
        let date = new Date();
        outputStream.write(encoder.encode(`\n${date}\n`), null);
        if (stdout) {
            outputStream.write(encoder.encode(`[STDOUT]:\n${stdout}`), null);
        }
        if (stderr) {
            outputStream.write(encoder.encode(`[STDERR]:\n${stderr}`), null);
        }
        outputStream.close(null);
    }


    _runCommand() {
        let rawCommand = this._settings.get_string('command');

        if (!rawCommand) {
            Main.notify(Me.metadata.name, 'Specify the command in the settings');
            return;
        }

        let command = GLib.shell_parse_argv(rawCommand)[1];
        let proc = this._launcher.spawnv(command);

        proc.communicate_utf8_async(null, null, (proc, res) => {
            let [, stdout, stderr] = proc.communicate_utf8_finish(res);

            let notify = this._settings.get_boolean('notify');
            if (notify) {
                if (proc.get_successful()) {
                    Main.notify(Me.metadata.name, 'Command execution complete!');
                } else {
                    Main.notify(Me.metadata.name, 'Uh-oh, something went wrong!');
                }
            }

            let logging = this._settings.get_boolean('logging');
            if (logging) {
                this._appendLog(stdout, stderr);
            }
        });
    }


    _addIndicator() {
        this._indicator = new PanelMenu.Button(0.0, Me.metadata.name, false);

        let icon = new St.Icon({
            gicon: new Gio.ThemedIcon({name: ICON}),
            style_class: 'popup-menu-icon',
        });
        this._indicator.add_child(icon);

        this._indicator.menu.addAction('Run Command',
            () => this._runCommand());

        this._indicator.menu.addAction('Settings',
            () => ExtensionUtils.openPrefs());

        Main.panel.addToStatusArea(Me.metadata.name, this._indicator);
    }


    enable() {
        this._addIndicator();
        this._settings = ExtensionUtils.getSettings();
        this._launcher = new Gio.SubprocessLauncher({
            flags: Gio.SubprocessFlags.STDOUT_PIPE |
                    Gio.SubprocessFlags.STDERR_PIPE,
        });
    }


    disable() {
        this._indicator.destroy();
        this._indicator = null;
        this._settings = null;
        this._launcher = null;
    }
}


function init() {
    return new Extension();
}

'use strict';


const {GLib, St, Gio} = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


const ICON = 'utilities-terminal-symbolic';


class Extension {
    constructor() {
        this._indicator = null;
        this._indicatorId = null;
        this._settings = null;
        this._launcher = null;
        this._menu = null;
        this._path = null;
    }


    _appendLog(script, stdout, stderr) {
        let logName = `${GLib.get_home_dir()}/.${Me.metadata.name}.log`;
        let logFile = Gio.File.new_for_path(logName);
        let encoder = new TextEncoder();
        let date = new Date();

        let outputStream = logFile.append_to(Gio.FileCreateFlags.NONE, null);
        outputStream.write(encoder.encode(`\n[${script}]: ${date}\n`), null);
        outputStream.write(encoder.encode(`STDOUT:\n${stdout}`), null);
        outputStream.write(encoder.encode(`STDERR:\n${stderr}`), null);
        outputStream.close(null);
    }


    _fillMenu() {
        this._menu.removeAll();

        this._path = this._settings.get_string('path');
        if (!this._path) {
            return;
        }

        this._getScripts(this._path).forEach(script => {
            this._menu.addAction(script.get_name(),
                () => this._launchScript(script.get_name()),
                script.get_icon());
        });


        if (!this._menu.isEmpty()) {
            this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }
    }


    _getScripts(path) {
        let directory = Gio.File.new_for_path(path);
        if (!directory.query_exists(null)) {
            return;
        }

        let enumerator = directory.enumerate_children('standard::name,standard::type,standard::icon', Gio.FileQueryInfoFlags.NONE, null);
        let scripts = [];

        while (true) {
            let fileInfo = enumerator.next_file(null);
            if (!fileInfo) {
                break;
            }

            let fileType = fileInfo.get_file_type();
            if (fileType === Gio.FileType.REGULAR) {
                scripts.push(fileInfo);
            }
        }

        enumerator.close(null);
        return scripts;
    }


    _launchScript(script) {
        let command = [`${this._path}/${script}`];

        try {
            let proc = this._launcher.spawnv(command);
            proc.communicate_utf8_async(null, null, (proc, res) => {
                let [, stdout, stderr] = proc.communicate_utf8_finish(res);

                let notify = this._settings.get_boolean('notify');
                if (notify) {
                    Main.notify(Me.metadata.name, `${script}: completed with exit code: ${proc.get_exit_status()}`);
                }

                let logging = this._settings.get_boolean('logging');
                if (logging) {
                    this._appendLog(script, stdout, stderr);
                }
            });
        } catch (e) {
            Main.notify(Me.metadata.name, `${e.toString().replace('GLib.SpawnError: ', '')}`);
        }
    }


    _addIndicator() {
        this._indicator = new PanelMenu.Button(0.0, Me.metadata.name, false);

        let icon = new St.Icon({
            gicon: new Gio.ThemedIcon({name: ICON}),
            style_class: 'popup-menu-icon',
        });
        this._indicator.add_child(icon);

        this._menu = new PopupMenu.PopupMenuSection();
        this._indicator.menu.addMenuItem(this._menu);

        this._indicator.menu.addAction('Settings',
            () => ExtensionUtils.openPrefs(),
            'preferences-system-symbolic');

        Main.panel.addToStatusArea(Me.metadata.name, this._indicator);

        this._indicatorId = this._indicator.connect('button-press-event', this._fillMenu.bind(this));
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
        this._indicator.disconnect(this._indicatorId);
        this._indicator.destroy();
        this._indicator = null;
        this._indicatorId = null;
        this._menu = null;
        this._settings = null;
        this._launcher = null;
    }
}


function init() {
    return new Extension();
}

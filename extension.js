import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Config from "resource:///org/gnome/shell/misc/config.js";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import St from "gi://St";

const ICON = "utilities-terminal-symbolic";
const BULLET = "pan-end-symbolic";

const ScrollableMenu = class ScrollableMenu extends PopupMenu.PopupMenuSection {
  constructor() {
    super();
    const scrollView = new St.ScrollView();
    this.innerMenu = new PopupMenu.PopupMenuSection();
    const shellVersion = parseFloat(Config.PACKAGE_VERSION)
      .toString()
      .slice(0, 2);
    if (shellVersion == 45) {
      scrollView.add_actor(this.innerMenu.actor);
      this.actor.add_actor(scrollView);
    } else {
      scrollView.add_child(this.innerMenu.actor);
      this.actor.add_child(scrollView);
    }
  }
};

export default class LauncherExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    this._indicator = null;
    this._menuId = null;
    this._settings = null;
    this._launcher = null;
    this._menu = null;
    this._path = null;
  }

  _appendLog(script, stdout, stderr) {
    const logName = `${GLib.get_home_dir()}/.${this.metadata.name}.log`;
    const logFile = Gio.File.new_for_path(logName);
    const encoder = new TextEncoder();
    const date = new Date();

    const outputStream = logFile.append_to(Gio.FileCreateFlags.NONE, null);
    outputStream.write(encoder.encode(`\n[${script}]: ${date}\n`), null);
    outputStream.write(encoder.encode(`STDOUT:\n${stdout}`), null);
    outputStream.write(encoder.encode(`STDERR:\n${stderr}`), null);
    outputStream.close(null);
  }

  _fillMenu() {
    this._menu.innerMenu.removeAll();

    this._path = this._settings.get_string("path");
    if (!this._path) {
      return;
    }

    const shebangIcon = this._settings.get_boolean("shebang-icon");
    const dafaultIcon = this._settings.get_string("default-icon");
    const stripExt = this._settings.get_boolean("strip");

    this._getScripts(this._path).forEach((script) => {
      this._menu.innerMenu.addAction(
        stripExt
          ? script.get_name().replace(/\.[^\.]+$/, "")
          : script.get_name(),
        () => this._launchScript(script.get_name()),
        shebangIcon ? script.get_icon() : dafaultIcon || BULLET,
      );
    });
  }

  _getScripts(path) {
    const directory = Gio.File.new_for_path(path);
    if (!directory.query_exists(null)) {
      return;
    }

    const enumerator = directory.enumerate_children(
      "standard::name,standard::type,standard::icon",
      Gio.FileQueryInfoFlags.NONE,
      null,
    );
    const scripts = [];

    while (true) {
      const fileInfo = enumerator.next_file(null);
      if (!fileInfo) {
        break;
      }

      const fileType = fileInfo.get_file_type();
      if (fileType === Gio.FileType.REGULAR) {
        scripts.push(fileInfo);
      }
    }

    enumerator.close(null);
    scripts.sort((a, b) => a.get_name().localeCompare(b.get_name()));
    return scripts;
  }

  _launchScript(script) {
    this._indicator.menu.toggle();
    const command = [`${this._path}/${script}`];

    try {
      const proc = this._launcher.spawnv(command);
      proc.communicate_utf8_async(null, null, (proc, res) => {
        const [, stdout, stderr] = proc.communicate_utf8_finish(res);

        const notify = this._settings.get_boolean("notify");
        if (notify) {
          if (stdout || stderr) {
            Main.notify(this.metadata.name, `[${script}]: ${stdout || stderr}`);
          } else {
            Main.notify(
              this.metadata.name,
              `[${script}]: completed with exit code: ${proc.get_exit_status()}`,
            );
          }
        }

        const logging = this._settings.get_boolean("log");
        if (logging) {
          this._appendLog(script, stdout, stderr);
        }
      });
    } catch (e) {
      Main.notify(
        this.metadata.name,
        `[${script}]: ${e.toString().replace("GLib.SpawnError: ", "")}`,
      );
    }
  }

  _addIndicator() {
    this._indicator = new PanelMenu.Button(0.5, this.metadata.name, false);

    const icon = new St.Icon({
      gicon: new Gio.ThemedIcon({ name: ICON }),
      style_class: "system-status-icon",
    });
    this._indicator.add_child(icon);

    this._menu = new ScrollableMenu();
    this._indicator.menu.addMenuItem(this._menu);
    this._indicator.menu.addAction(
      "Settings",
      () => this.openPreferences(),
      "preferences-system-symbolic",
    );

    Main.panel.addToStatusArea(this.metadata.name, this._indicator);

    this._menuId = this._indicator.menu.connect(
      "open-state-changed",
      (open) => {
        if (open) {
          this._fillMenu();
        }
      },
    );
  }

  enable() {
    this._addIndicator();
    this._settings = this.getSettings();
    this._launcher = new Gio.SubprocessLauncher({
      flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
    });
  }

  disable() {
    this._indicator.menu.disconnect(this._menuId);
    this._indicator.destroy();
    this._indicator = null;
    this._menuId = null;
    this._menu = null;
    this._settings = null;
    this._launcher = null;
  }
}

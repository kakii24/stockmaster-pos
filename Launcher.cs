using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;
using System.Management;
using System.Collections.Generic;

namespace StockMasterPOS
{
    static class Program
    {
        private static HttpListener listener;
        private static string distPath;
        private static volatile bool isRunning = true;
        private static NotifyIcon trayIcon;
        private static int currentPort = 5873;
        private static string appUrl = "";
        private static string userDataDir = "";
        private static string profileDir = "";
        private static string portFilePath = "";

        private static readonly Dictionary<string, string> MimeTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { ".html", "text/html; charset=utf-8" },
            { ".htm", "text/html; charset=utf-8" },
            { ".js", "application/javascript; charset=utf-8" },
            { ".mjs", "application/javascript; charset=utf-8" },
            { ".css", "text/css; charset=utf-8" },
            { ".json", "application/json; charset=utf-8" },
            { ".svg", "image/svg+xml" },
            { ".png", "image/png" },
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".gif", "image/gif" },
            { ".webp", "image/webp" },
            { ".ico", "image/x-icon" },
            { ".woff2", "font/woff2" },
            { ".woff", "font/woff" },
            { ".ttf", "font/ttf" },
            { ".otf", "font/otf" },
            { ".txt", "text/plain; charset=utf-8" }
        };

        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            userDataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "StockMasterPOS"
            );
            profileDir = Path.Combine(userDataDir, "Profile");
            portFilePath = Path.Combine(userDataDir, "active_port.txt");

            if (!Directory.Exists(profileDir))
            {
                Directory.CreateDirectory(profileDir);
            }

            bool createdNew;
            using (Mutex mutex = new Mutex(true, "StockMasterPOS_SingleInstance_Mutex_ka_tech", out createdNew))
            {
                if (!createdNew)
                {
                    // Existing instance running - re-open/focus window
                    try
                    {
                        if (File.Exists(portFilePath))
                        {
                            string savedUrl = File.ReadAllText(portFilePath).Trim();
                            if (!string.IsNullOrEmpty(savedUrl))
                            {
                                LaunchBrowserApp(savedUrl);
                                return;
                            }
                        }
                    }
                    catch { }

                    LaunchBrowserApp("http://127.0.0.1:5873/");
                    return;
                }

                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                distPath = FindDistDirectory(baseDir);

                if (string.IsNullOrEmpty(distPath) || !Directory.Exists(distPath))
                {
                    MessageBox.Show(
                        "Le dossier des fichiers compiles 'dist' est introuvable.\n\n" +
                        "Chemins verifies :\n" +
                        "- " + Path.Combine(baseDir, "dist") + "\n" +
                        "- " + Path.Combine(baseDir, "stockmaster-pos", "dist") + "\n\n" +
                        "Veuillez executer 'npm run build' pour compiler l'application.",
                        "StockMaster POS - Fichiers introuvables",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                currentPort = FindAvailablePort(5873);
                appUrl = string.Format("http://127.0.0.1:{0}/", currentPort);

                try
                {
                    listener = new HttpListener();
                    listener.Prefixes.Add(appUrl);
                    listener.Start();
                }
                catch (Exception ex)
                {
                    MessageBox.Show(
                        "Impossible de demarrer le serveur local sur " + appUrl + "\n\nErreur : " + ex.Message,
                        "StockMaster POS - Erreur Reseau",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                try
                {
                    File.WriteAllText(portFilePath, appUrl);
                }
                catch { }

                // Start HTTP listen loop on background thread
                Thread serverThread = new Thread(ListenLoop);
                serverThread.IsBackground = true;
                serverThread.Start();

                // Setup Tray Icon
                SetupTrayIcon(baseDir);

                // Launch Dedicated Window
                LaunchBrowserApp(appUrl);

                // Thread to monitor browser processes
                Thread monitorThread = new Thread(new ThreadStart(MonitorBrowserLifecycle));
                monitorThread.IsBackground = true;
                monitorThread.Start();

                // WinForms Message loop (handles tray icon events)
                Application.Run();
            }
        }

        private static void MonitorBrowserLifecycle()
        {
            // Wait up to 10 seconds for browser process to appear
            int waitInit = 0;
            while (waitInit < 20 && !IsStockMasterEdgeRunning())
            {
                Thread.Sleep(500);
                waitInit++;
            }

            int inactiveCount = 0;
            while (isRunning)
            {
                Thread.Sleep(1000);
                if (!IsStockMasterEdgeRunning())
                {
                    inactiveCount++;
                    if (inactiveCount >= 2)
                    {
                        // Window has been closed by user
                        break;
                    }
                }
                else
                {
                    inactiveCount = 0;
                }
            }

            ShutdownAndExit();
        }

        private static bool IsStockMasterEdgeRunning()
        {
            try
            {
                using (var searcher = new ManagementObjectSearcher("SELECT CommandLine FROM Win32_Process WHERE Name = 'msedge.exe'"))
                {
                    using (var results = searcher.Get())
                    {
                        foreach (ManagementObject mo in results)
                        {
                            object cmd = mo["CommandLine"];
                            if (cmd != null && cmd.ToString().IndexOf("StockMasterPOS", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                return true;
                            }
                        }
                    }
                }
            }
            catch { }
            return false;
        }

        private static void KillStockMasterEdgeProcesses()
        {
            try
            {
                using (var searcher = new ManagementObjectSearcher("SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name = 'msedge.exe'"))
                {
                    using (var results = searcher.Get())
                    {
                        foreach (ManagementObject mo in results)
                        {
                            object cmd = mo["CommandLine"];
                            if (cmd != null && cmd.ToString().IndexOf("StockMasterPOS", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                int pid = Convert.ToInt32(mo["ProcessId"]);
                                try
                                {
                                    Process p = Process.GetProcessById(pid);
                                    if (!p.HasExited) p.Kill();
                                }
                                catch { }
                            }
                        }
                    }
                }
            }
            catch { }
        }

        private static void ShutdownAndExit()
        {
            if (!isRunning) return;
            isRunning = false;

            KillStockMasterEdgeProcesses();

            try
            {
                if (trayIcon != null)
                {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }
            }
            catch { }

            try
            {
                if (File.Exists(portFilePath))
                {
                    File.Delete(portFilePath);
                }
            }
            catch { }

            try
            {
                if (listener != null && listener.IsListening)
                {
                    listener.Stop();
                    listener.Close();
                }
            }
            catch { }

            Environment.Exit(0);
        }

        private static void SetupTrayIcon(string baseDir)
        {
            try
            {
                trayIcon = new NotifyIcon();
                trayIcon.Text = "StockMaster POS - Gestion de Stock & Caisse";

                string iconPath = Path.Combine(baseDir, "stockmaster.ico");
                if (!File.Exists(iconPath))
                {
                    iconPath = Path.Combine(baseDir, "..", "stockmaster.ico");
                }

                if (File.Exists(iconPath))
                {
                    trayIcon.Icon = new Icon(iconPath);
                }
                else
                {
                    trayIcon.Icon = SystemIcons.Application;
                }

                ContextMenu menu = new ContextMenu();
                menu.MenuItems.Add("Ouvrir StockMaster POS", delegate { LaunchBrowserApp(appUrl); });
                menu.MenuItems.Add("-");
                menu.MenuItems.Add("Quitter", delegate
                {
                    ShutdownAndExit();
                });

                trayIcon.ContextMenu = menu;
                trayIcon.DoubleClick += delegate { LaunchBrowserApp(appUrl); };
                trayIcon.Visible = true;
            }
            catch { }
        }

        private static Process LaunchBrowserApp(string url)
        {
            string browserExe = FindBrowserPath();

            if (!string.IsNullOrEmpty(browserExe) && File.Exists(browserExe))
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = browserExe;
                psi.Arguments = string.Format(
                    "--app=\"{0}\" --window-size=1366,820 --user-data-dir=\"{1}\" --no-first-run --no-default-browser-check",
                    url,
                    profileDir
                );
                psi.UseShellExecute = false;
                try
                {
                    return Process.Start(psi);
                }
                catch { }
            }

            // Fallback to default browser
            try
            {
                return Process.Start(url);
            }
            catch { }

            return null;
        }

        private static string FindDistDirectory(string baseDir)
        {
            string[] searchPaths = new string[]
            {
                Path.Combine(baseDir, "dist"),
                Path.Combine(baseDir, "stockmaster-pos", "dist"),
                Path.Combine(baseDir, "..", "stockmaster-pos", "dist"),
                Path.Combine(baseDir, "..", "dist")
            };

            foreach (string p in searchPaths)
            {
                string full = Path.GetFullPath(p);
                if (Directory.Exists(full) && File.Exists(Path.Combine(full, "index.html")))
                {
                    return full;
                }
            }
            return null;
        }

        private static int FindAvailablePort(int startPort)
        {
            for (int p = startPort; p < startPort + 100; p++)
            {
                try
                {
                    System.Net.Sockets.TcpListener tl = new System.Net.Sockets.TcpListener(IPAddress.Loopback, p);
                    tl.Start();
                    tl.Stop();
                    return p;
                }
                catch { }
            }
            return startPort;
        }

        private static string FindBrowserPath()
        {
            // 1. Check Microsoft Edge
            string[] edgePaths = new string[]
            {
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe")
            };

            foreach (string path in edgePaths)
            {
                if (File.Exists(path)) return path;
            }

            // 2. Check Google Chrome
            string[] chromePaths = new string[]
            {
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string path in chromePaths)
            {
                if (File.Exists(path)) return path;
            }

            // 3. Registry check for msedge
            try
            {
                using (var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe"))
                {
                    if (key != null)
                    {
                        object val = key.GetValue(null);
                        if (val != null && File.Exists(val.ToString())) return val.ToString();
                    }
                }
            }
            catch { }

            return null;
        }

        private static void ListenLoop()
        {
            while (isRunning && listener != null && listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem(ProcessRequest, context);
                }
                catch
                {
                    if (!isRunning) break;
                }
            }
        }

        private static void ProcessRequest(object state)
        {
            HttpListenerContext context = (HttpListenerContext)state;
            try
            {
                string rawPath = context.Request.Url.AbsolutePath;
                string cleanPath = Uri.UnescapeDataString(rawPath).TrimStart('/');
                if (string.IsNullOrEmpty(cleanPath))
                {
                    cleanPath = "index.html";
                }

                string targetFile = Path.Combine(distPath, cleanPath.Replace('/', Path.DirectorySeparatorChar));
                string fullTarget = Path.GetFullPath(targetFile);

                // Security check: no path traversal
                if (!fullTarget.StartsWith(distPath, StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.StatusCode = 403;
                    context.Response.Close();
                    return;
                }

                if (Directory.Exists(fullTarget))
                {
                    fullTarget = Path.Combine(fullTarget, "index.html");
                }

                // SPA Fallback: if route doesn't match an asset file, serve index.html
                if (!File.Exists(fullTarget))
                {
                    fullTarget = Path.Combine(distPath, "index.html");
                }

                if (!File.Exists(fullTarget))
                {
                    context.Response.StatusCode = 404;
                    context.Response.Close();
                    return;
                }

                string ext = Path.GetExtension(fullTarget);
                string mime;
                if (!MimeTypes.TryGetValue(ext, out mime))
                {
                    mime = "application/octet-stream";
                }

                byte[] bytes = File.ReadAllBytes(fullTarget);
                context.Response.StatusCode = 200;
                context.Response.ContentType = mime;
                context.Response.ContentLength64 = bytes.Length;
                context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                context.Response.Headers.Add("Cache-Control", "no-cache");
                context.Response.OutputStream.Write(bytes, 0, bytes.Length);
                context.Response.OutputStream.Flush();
            }
            catch
            {
                // Connection closed by client
            }
            finally
            {
                try { context.Response.Close(); } catch { }
            }
        }
    }
}

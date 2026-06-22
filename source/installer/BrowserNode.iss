#define MyAppName "BrowserNode Native Host"
#define MyAppVersion "0.1.0"

[Setup]
AppId={{1A9972DF-B9C2-4C4E-B0D7-7774DDA0D859}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={localappdata}\BrowserNode
DefaultGroupName=BrowserNode
OutputBaseFilename=BrowserNodeNativeHostSetup
PrivilegesRequired=lowest
DisableProgramGroupPage=yes
UninstallDisplayName={#MyAppName}

[Files]
Source: "..\native-host\dist\browernode-host.exe"; DestDir: "{app}\native-host"; Flags: ignoreversion
Source: "scripts\install-host.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "scripts\uninstall-host.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "scripts\native-host-manifest.json.template"; DestDir: "{app}\scripts"; Flags: ignoreversion

[Run]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\install-host.ps1"" -InstallDir ""{app}"" -ExtensionId ""{code:GetExtensionId}"""; Flags: runhidden

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\uninstall-host.ps1"""; Flags: runhidden

[Code]
var
  ExtensionIdPage: TInputQueryWizardPage;

procedure InitializeWizard;
begin
  ExtensionIdPage := CreateInputQueryPage(wpSelectDir, 'Chrome Extension', 'BrowserNode extension ID', 'Load the extension once in Chrome, copy its ID, then paste it here.');
  ExtensionIdPage.Add('Extension ID:', False);
end;

function GetExtensionId(Param: String): String;
begin
  Result := ExtensionIdPage.Values[0];
end;

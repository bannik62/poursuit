# Ouvre PowerShell EN ADMINISTRATEUR sur Windows, puis :
#   cd \\wsl$\Ubuntu\home\yo\project\trivial-asso\scripts
#   .\setup-phone-access.ps1
#
# Ou depuis WSL (demande élévation admin) :
#   powershell.exe -ExecutionPolicy Bypass -File scripts/setup-phone-access.ps1

$port = 8083
$wslIp = (wsl hostname -I).Trim().Split(" ")[0]
$winIp = (
  Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*" } |
  Where-Object { $_.IPAddress -notlike "127.*" } |
  Select-Object -First 1
).IPAddress

if (-not $wslIp) { Write-Error "IP WSL introuvable. Lance WSL d'abord."; exit 1 }
if (-not $winIp) { Write-Error "IP WiFi/Ethernet introuvable."; exit 1 }

# Supprime ancienne règle si existe
netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 2>$null

# Redirige le port Windows → WSL (Docker)
netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wslIp

# Pare-feu Windows
$ruleName = "Trivial Asso $port"
Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow | Out-Null

Write-Host ""
Write-Host "OK — Acces telephone configure" -ForegroundColor Green
Write-Host ""
Write-Host "  1. Mets dans .env :" -ForegroundColor Yellow
Write-Host "     PUBLIC_URL=http://${winIp}:${port}"
Write-Host "     FRONTEND_URL=http://${winIp}:${port}"
Write-Host ""
Write-Host "  2. Redemarre Docker :" -ForegroundColor Yellow
Write-Host "     docker compose up -d --build"
Write-Host ""
Write-Host "  3. Recree une session admin (nouveaux QR codes)"
Write-Host ""
Write-Host "  Test tel (meme WiFi) : http://${winIp}:${port}/joueur/"
Write-Host ""
